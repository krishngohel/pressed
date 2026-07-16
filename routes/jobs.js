import { Router } from 'express'
import { authMiddleware, supabaseAdmin } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

const STATUSES = ['saved', 'applied', 'phone_screen', 'interview', 'offer', 'rejected', 'withdrawn']

router.get('/', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('user_id', req.user.id)
    .order('position', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { company, role, location, salary_min, salary_max, status = 'saved', source_url, notes, contacts = [], tags = [], resume_id } = req.body || {}
  if (!company || !role) return res.status(400).json({ error: 'company and role are required' })
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'invalid status' })
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .insert({ user_id: req.user.id, company, role, location, salary_min, salary_max, status, source_url, notes, contacts, tags, resume_id })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.put('/:id', async (req, res) => {
  const allowed = ['company', 'role', 'location', 'salary_min', 'salary_max', 'status', 'applied_at', 'source_url', 'notes', 'contacts', 'tags', 'resume_id', 'position']
  const patch = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => allowed.includes(k)))
  if (patch.status && !STATUSES.includes(patch.status)) return res.status(400).json({ error: 'invalid status' })
  patch.updated_at = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .update(patch)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('jobs').delete().eq('id', req.params.id).eq('user_id', req.user.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
})

// POST /jobs/reorder — bulk status + position update [{id, status, position}]
router.post('/reorder', async (req, res) => {
  const updates = req.body?.updates || []
  for (const u of updates) {
    const patch = { position: u.position }
    if (u.status && STATUSES.includes(u.status)) patch.status = u.status
    await supabaseAdmin.from('jobs').update(patch).eq('id', u.id).eq('user_id', req.user.id)
  }
  res.json({ ok: true })
})

export default router
