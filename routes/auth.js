import { Router } from 'express'
import { authMiddleware, supabaseAdmin } from '../middleware/auth.js'

const router = Router()

// Signup / login / refresh are proxied so clients without the Supabase SDK can
// still authenticate. The React app uses supabase-js directly; both paths work.
router.post('/signup', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  const { data, error } = await supabaseAdmin.auth.signUp({ email, password })
  if (error) return res.status(400).json({ error: error.message })
  if (data.user) {
    await supabaseAdmin.from('profiles').upsert({ id: data.user.id, email }, { onConflict: 'id' })
  }
  res.json({ user: data.user, session: data.session })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })
  if (error) return res.status(401).json({ error: error.message })
  res.json({ user: data.user, session: data.session })
})

router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body || {}
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' })
  const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token })
  if (error) return res.status(401).json({ error: error.message })
  res.json({ session: data.session })
})

router.get('/me', authMiddleware, async (req, res) => {
  const { gmail_tokens, ...safe } = req.profile || {}
  res.json({ ...safe, plan_type: req.profile?.plan_type || req.profile?.subscription_status || 'free' })
})

router.post('/logout', authMiddleware, async (_req, res) => {
  // Stateless JWTs — the client discards its session. Nothing to revoke server-side.
  res.json({ ok: true })
})

export default router
