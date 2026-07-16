import { Router } from 'express'
import { authMiddleware, supabaseAdmin } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

const SECTIONS = ['contact', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'awards', 'publications']

// GET /vault/entries → grouped by section
router.get('/entries', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('vault_entries')
    .select('*')
    .eq('user_id', req.user.id)
    .order('position', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  const grouped = Object.fromEntries(SECTIONS.map((s) => [s, []]))
  for (const e of data) (grouped[e.section] || (grouped[e.section] = [])).push(e)
  res.json(grouped)
})

router.post('/entries', async (req, res) => {
  const { section, position = 0, title, organization, location, start_date, end_date, current = false, description, bullets = [], meta = {} } = req.body || {}
  if (!SECTIONS.includes(section)) return res.status(400).json({ error: 'invalid section' })
  const { data, error } = await supabaseAdmin
    .from('vault_entries')
    .insert({ user_id: req.user.id, section, position, title, organization, location, start_date, end_date, current, description, bullets, meta })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.put('/entries/:id', async (req, res) => {
  const allowed = ['position', 'title', 'organization', 'location', 'start_date', 'end_date', 'current', 'description', 'bullets', 'meta']
  const patch = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => allowed.includes(k)))
  patch.updated_at = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('vault_entries')
    .update(patch)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/entries/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('vault_entries').delete().eq('id', req.params.id).eq('user_id', req.user.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// POST /vault/entries/reorder — bulk position update [{id, position}]
router.post('/entries/reorder', async (req, res) => {
  const updates = req.body?.updates || []
  for (const u of updates) {
    await supabaseAdmin.from('vault_entries').update({ position: u.position }).eq('id', u.id).eq('user_id', req.user.id)
  }
  res.json({ ok: true })
})

// GET /vault/export — full JSON export
router.get('/export', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('vault_entries')
    .select('section, position, title, organization, location, start_date, end_date, current, description, bullets, meta, created_at')
    .eq('user_id', req.user.id)
    .order('section')
    .order('position')
  if (error) return res.status(500).json({ error: error.message })
  res.json({ exported_at: new Date().toISOString(), product: 'Pressed by Meridia', entries: data })
})

// Vault file records (the binary itself is parsed by /ai/parse-file)
router.post('/files/upload', async (req, res) => {
  const { name, type, size } = req.body || {}
  const { data, error } = await supabaseAdmin
    .from('vault_files')
    .insert({ user_id: req.user.id, name, type, size })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/files/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('vault_files').delete().eq('id', req.params.id).eq('user_id', req.user.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

export default router
