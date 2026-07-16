import { Router } from 'express'
import { authMiddleware, proGate, supabaseAdmin } from '../middleware/auth.js'
import { buildResume, vaultToResumeData, TEMPLATES } from './templateEngine.js'
import { askClaude, extractJson } from './anthropic.js'

const router = Router()
router.use(authMiddleware)

async function fetchVault(userId) {
  const { data } = await supabaseAdmin
    .from('vault_entries')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true })
  const grouped = {}
  for (const e of data || []) (grouped[e.section] = grouped[e.section] || []).push(e)
  return grouped
}

// POST /resumes/generate — Pro gate; vault → AI → LaTeX → source + placeholders.
// The vault is ALWAYS fetched fresh (RAG source of truth — never stale snapshots).
router.post('/generate', proGate, async (req, res) => {
  try {
    const { template = 'classic', job_description = null, name = 'Untitled resume' } = req.body || {}
    if (!TEMPLATES.includes(template)) return res.status(400).json({ error: 'invalid template' })

    const vault = await fetchVault(req.user.id)
    let data = vaultToResumeData(vault)

    // Let Claude select, order and (if a JD is provided) rewrite bullets.
    try {
      const text = await askClaude({
        system:
          'You are a professional resume writer. Given a user\'s career vault data, select and structure the most relevant entries for the specified template and role. Keep bullets truthful — rewrite for impact and keyword relevance, never invent facts.',
        cachedContext: `<vault_context>${JSON.stringify(data)}</vault_context>`,
        prompt: `Template: ${template}. Job description: ${job_description || 'none'}.
Return ONLY JSON with this exact shape (omit nothing, use empty arrays when needed):
{ "summary": string|null, "experiences": [{"title","company","location","dates","bullets":[string]}], "education": [{"school","degree","location","dates","bullets":[string]}], "skills": [{"group","items":[string]}], "projects": [{"title","tech","dates","bullets":[string]}], "certifications": [{"title","issuer","date"}], "awards": [{"title","issuer","date"}], "publications": [{"title","venue","date"}] }
Order experiences by relevance${job_description ? ' to the job description, rewriting bullets to mirror its key requirements' : ''}.`,
      })
      const aiData = extractJson(text)
      data = { ...data, ...aiData, contact: data.contact }
    } catch (err) {
      console.warn('[resumes] AI selection unavailable, using vault verbatim:', err.message)
    }

    const { latex_source, placeholders } = buildResume(template, data)

    const { data: resume, error } = await supabaseAdmin
      .from('resumes')
      .insert({
        user_id: req.user.id,
        name,
        template,
        latex_source,
        placeholders,
        vault_snapshot: vault,
        job_description,
        tailored: !!job_description,
      })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    res.json(resume)
  } catch (err) {
    console.error('[resumes] generate failed:', err)
    res.status(500).json({ error: 'generation_failed' })
  }
})

router.get('/', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('resumes')
    .select('id, name, template, tailored, created_at, updated_at')
    .eq('user_id', req.user.id)
    .order('updated_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('resumes')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single()
  if (error) return res.status(404).json({ error: 'not_found' })
  res.json(data)
})

router.put('/:id', async (req, res) => {
  const allowed = ['name', 'placeholders', 'latex_source', 'tailored']
  const patch = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => allowed.includes(k)))
  patch.updated_at = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('resumes')
    .update(patch)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('resumes').delete().eq('id', req.params.id).eq('user_id', req.user.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// Version history — keep last 10 (Pro)
router.get('/:id/versions', proGate, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('resume_versions')
    .select('*')
    .eq('resume_id', req.params.id)
    .order('created_at', { ascending: false })
    .limit(10)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/:id/version', proGate, async (req, res) => {
  const { data: resume } = await supabaseAdmin
    .from('resumes')
    .select('latex_source, placeholders')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single()
  if (!resume) return res.status(404).json({ error: 'not_found' })

  const { data, error } = await supabaseAdmin
    .from('resume_versions')
    .insert({ resume_id: req.params.id, latex_source: resume.latex_source, placeholders: resume.placeholders })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })

  // Trim history beyond the last 10.
  const { data: all } = await supabaseAdmin
    .from('resume_versions')
    .select('id')
    .eq('resume_id', req.params.id)
    .order('created_at', { ascending: false })
  if (all && all.length > 10) {
    await supabaseAdmin.from('resume_versions').delete().in('id', all.slice(10).map((v) => v.id))
  }
  res.json(data)
})

export default router
