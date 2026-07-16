import { Router } from 'express'
import crypto from 'node:crypto'
import { google } from 'googleapis'
import { authMiddleware, proGate, supabaseAdmin } from '../middleware/auth.js'
import { askClaude, extractJson } from './anthropic.js'

const router = Router()

/* ---------- token encryption (AES-256-GCM) ----------
   OAuth tokens are NEVER stored in plaintext. Key is derived from JWT_SECRET. */

const key = () => crypto.createHash('sha256').update(process.env.JWT_SECRET || 'pressed-dev-secret').digest()

export function encrypt(plain) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), enc.toString('base64')].join('.')
}

export function decrypt(stored) {
  const [iv, tag, data] = stored.split('.').map((p) => Buffer.from(p, 'base64'))
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

/* ---------- OAuth2 ---------- */

const oauthClient = () =>
  new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI)

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/userinfo.email']

// GET /gmail/connect → consent URL (Pro)
router.get('/connect', authMiddleware, proGate, (req, res) => {
  const url = oauthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: req.user.id,
  })
  res.json({ url })
})

// GET /gmail/callback — Google redirects here with ?code (no JWT on redirects; state carries the user id)
router.get('/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query
    if (!code || !userId) throw new Error('missing code/state')
    const client = oauthClient()
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const { data: userinfo } = await oauth2.userinfo.get()

    await supabaseAdmin
      .from('profiles')
      .update({
        gmail_connected: true,
        gmail_email: userinfo.email,
        gmail_tokens: encrypt(JSON.stringify(tokens)),
      })
      .eq('id', userId)

    res.redirect(`${process.env.APP_URL || ''}/inbox`)
  } catch (err) {
    console.error('[gmail] callback failed:', err)
    res.redirect(`${process.env.APP_URL || ''}/settings?gmail=error`)
  }
})

// POST /gmail/sync — Pro; scan threads, parse with Claude (vault context cached), upsert email_actions
router.post('/sync', authMiddleware, proGate, async (req, res) => {
  try {
    if (!req.profile.gmail_tokens) return res.status(400).json({ error: 'gmail_not_connected' })
    const client = oauthClient()
    client.setCredentials(JSON.parse(decrypt(req.profile.gmail_tokens)))
    const gmail = google.gmail({ version: 'v1', auth: client })

    const q =
      '(subject:interview OR subject:"job offer" OR subject:application OR subject:position OR subject:opportunity OR subject:hiring OR from:recruiting OR from:talent) newer_than:90d'
    const { data: list } = await gmail.users.threads.list({ userId: 'me', q, maxResults: 25 })

    // Cached vault context: the user's name + active search, reused across every thread parse.
    const { data: contactRows } = await supabaseAdmin
      .from('vault_entries').select('title').eq('user_id', req.user.id).eq('section', 'contact').limit(1)
    const { data: activeJobs } = await supabaseAdmin
      .from('jobs').select('company, role, status').eq('user_id', req.user.id).limit(50)
    const vaultContext = `<vault_context>User: ${contactRows?.[0]?.title || req.profile.email}. Active job search: ${JSON.stringify(activeJobs || [])}</vault_context>`

    const results = []
    for (const t of list.threads || []) {
      const { data: thread } = await gmail.users.threads.get({ userId: 'me', id: t.id, format: 'metadata', metadataHeaders: ['Subject', 'From', 'Date'] })
      const first = thread.messages?.[0]
      const subject = first?.payload?.headers?.find((h) => h.name === 'Subject')?.value || ''
      const snippets = (thread.messages || []).map((m) => m.snippet).filter(Boolean).join('\n').slice(0, 6000)

      try {
        const text = await askClaude({
          system: 'You are an assistant that reads job application emails and extracts structured information.',
          cachedContext: vaultContext,
          prompt: `<email_thread>${subject}\n${snippets}</email_thread>
Return ONLY JSON: {"company": string|null, "role": string|null, "action_type": "interview_invite"|"rejection"|"offer"|"follow_up"|"documents_needed"|"other", "deadline_iso": string|null, "summary": string, "confidence": number}`,
          maxTokens: 600,
        })
        const parsed = extractJson(text)
        if ((parsed.confidence ?? 1) < 0.4) continue

        const row = {
          user_id: req.user.id,
          gmail_thread_id: t.id,
          company: parsed.company,
          role: parsed.role,
          action_type: parsed.action_type || 'other',
          deadline: parsed.deadline_iso || null,
          summary: parsed.summary,
          raw_snippet: snippets.slice(0, 500),
          synced_at: new Date().toISOString(),
        }
        const { data: upserted } = await supabaseAdmin
          .from('email_actions')
          .upsert(row, { onConflict: 'user_id,gmail_thread_id' })
          .select()
          .single()
        if (upserted) results.push(upserted)
      } catch (err) {
        console.warn('[gmail] thread parse skipped:', err.message)
      }
    }

    await supabaseAdmin.from('profiles').update({ gmail_last_sync: new Date().toISOString() }).eq('id', req.user.id)
    res.json({ synced: results.length, actions: results })
  } catch (err) {
    console.error('[gmail] sync failed:', err)
    res.status(500).json({ error: 'sync_failed' })
  }
})

// POST /gmail/disconnect — clear tokens
router.post('/disconnect', authMiddleware, async (req, res) => {
  await supabaseAdmin
    .from('profiles')
    .update({ gmail_connected: false, gmail_email: null, gmail_tokens: null, gmail_last_sync: null })
    .eq('id', req.user.id)
  res.json({ ok: true })
})

/* ---------- email actions (mounted at /email-actions in api.js) ---------- */

export const emailActions = Router()
emailActions.use(authMiddleware)

emailActions.get('/', async (req, res) => {
  const includeDismissed = req.query.all === 'true'
  let query = supabaseAdmin.from('email_actions').select('*').eq('user_id', req.user.id)
  if (!includeDismissed) query = query.eq('dismissed', false)
  const { data, error } = await query.order('deadline', { ascending: true, nullsFirst: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

emailActions.put('/:id', async (req, res) => {
  const { data: action } = await supabaseAdmin
    .from('email_actions').select('*').eq('id', req.params.id).eq('user_id', req.user.id).single()
  if (!action) return res.status(404).json({ error: 'not_found' })

  const patch = {}
  if (typeof req.body?.dismissed === 'boolean') patch.dismissed = req.body.dismissed
  if (req.body?.job_id) patch.job_id = req.body.job_id

  // "Link to tracker": create or update a job card for this company/role.
  if (req.body?.link_to_tracker && !action.job_id) {
    const { data: existing } = await supabaseAdmin
      .from('jobs').select('id').eq('user_id', req.user.id)
      .ilike('company', action.company || '').limit(1)
    if (existing?.length) {
      patch.job_id = existing[0].id
    } else {
      const status = action.action_type === 'offer' ? 'offer' : action.action_type === 'interview_invite' ? 'interview' : action.action_type === 'rejection' ? 'rejected' : 'applied'
      const { data: job } = await supabaseAdmin
        .from('jobs')
        .insert({ user_id: req.user.id, company: action.company || 'Unknown', role: action.role || 'Unknown role', status })
        .select()
        .single()
      if (job) patch.job_id = job.id
    }
  }

  const { data, error } = await supabaseAdmin
    .from('email_actions').update(patch).eq('id', req.params.id).eq('user_id', req.user.id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router
