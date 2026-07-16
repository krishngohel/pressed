import { Router } from 'express'
import mammoth from 'mammoth'
import { authMiddleware, proGate, supabaseAdmin, PRO_STATUSES } from '../middleware/auth.js'
import { askClaude, extractJson, anthropic, MODEL } from './anthropic.js'

const router = Router()
router.use(authMiddleware)

// Free users get exactly one parse; Pro is unlimited.
async function parseGate(req, res, next) {
  if (PRO_STATUSES.includes(req.profile?.subscription_status)) return next()
  const { count } = await supabaseAdmin
    .from('vault_files')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', req.user.id)
    .eq('parsed', true)
  if ((count || 0) >= 1) return res.status(403).json({ error: 'pro_required' })
  next()
}

// POST /ai/parse-file — { name, type, content_base64 } → vault entry suggestions
router.post('/parse-file', parseGate, async (req, res) => {
  try {
    const { name, type, content_base64 } = req.body || {}
    if (!content_base64) return res.status(400).json({ error: 'content_base64 required' })

    const ai = anthropic()
    if (!ai) return res.status(500).json({ error: 'ai_unavailable' })

    const system =
      'Extract resume information from this document into structured JSON matching the vault entry schema. Be faithful to the document; do not invent details.'
    const instruction = `Return ONLY a JSON array of vault entries:
[{"section":"contact|summary|experience|education|skills|projects|certifications|awards|publications","title":string,"organization":string|null,"location":string|null,"start_date":string|null,"end_date":string|null,"current":boolean,"description":string|null,"bullets":[string],"meta":{}}]
For contact use meta keys: email, phone, linkedin, github, website. For skills create one entry per skill with meta.group.`

    let text
    const isPdf = (type || '').includes('pdf') || (name || '').toLowerCase().endsWith('.pdf')
    if (isPdf) {
      const response = await ai.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: content_base64 } },
            { type: 'text', text: instruction },
          ],
        }],
      })
      text = response.content.find((b) => b.type === 'text')?.text || ''
    } else {
      const { value: docText } = await mammoth.extractRawText({ buffer: Buffer.from(content_base64, 'base64') })
      text = await askClaude({ system, prompt: `<document_text>${docText.slice(0, 50000)}</document_text>\n\n${instruction}` })
    }

    const entries = extractJson(text)

    await supabaseAdmin.from('vault_files').insert({
      user_id: req.user.id,
      name: name || 'resume',
      type: isPdf ? 'pdf' : 'docx',
      size: Math.round((content_base64.length * 3) / 4),
      parsed: true,
      parsed_at: new Date().toISOString(),
    })

    res.json({ entries })
  } catch (err) {
    console.error('[ai] parse-file failed:', err)
    res.status(500).json({ error: 'parse_failed' })
  }
})

// POST /ai/tailor — Pro; { resume_id, job_description } → diff + updated placeholders
router.post('/tailor', proGate, async (req, res) => {
  try {
    const { resume_id, job_description } = req.body || {}
    if (!resume_id || !job_description) return res.status(400).json({ error: 'resume_id and job_description required' })

    const { data: resume } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('id', resume_id)
      .eq('user_id', req.user.id)
      .single()
    if (!resume) return res.status(404).json({ error: 'not_found' })

    const bulletEntries = Object.entries(resume.placeholders || {}).filter(([k]) => /_BULLET_\d+$/.test(k))

    const text = await askClaude({
      system:
        'You are a professional resume writer. Rewrite work experience bullets to match the job description\'s keywords and priorities. Stay truthful — sharpen language and emphasis, never invent facts. Keep each bullet a single line under 200 characters.',
      cachedContext: `<vault_context>${JSON.stringify(Object.fromEntries(bulletEntries))}</vault_context>`,
      prompt: `<job_description>${job_description.slice(0, 12000)}</job_description>
Rewrite only the bullets that benefit from tailoring. Return ONLY JSON: {"changes":[{"key": "<placeholder key>", "after": "<rewritten bullet>"}]}`,
    })

    const { changes = [] } = extractJson(text)
    const valid = changes.filter((c) => resume.placeholders[c.key] && typeof c.after === 'string')
    const updatedPlaceholders = { ...resume.placeholders }
    const diff = valid.map((c) => {
      const before = resume.placeholders[c.key]
      updatedPlaceholders[c.key] = c.after
      return { key: c.key, before, after: c.after }
    })

    res.json({ changes: diff, placeholders: Object.fromEntries(diff.map((d) => [d.key, d.after])) })
  } catch (err) {
    console.error('[ai] tailor failed:', err)
    res.status(500).json({ error: 'tailor_failed' })
  }
})

export default router
