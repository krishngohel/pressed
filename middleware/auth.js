// JWT validation against Supabase + Pro gating.
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export const PRO_STATUSES = ['pro', 'pro_annual', 'lifetime']

export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ error: 'unauthorized' })

    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data?.user) return res.status(401).json({ error: 'unauthorized' })
    req.user = data.user

    // Auto-create the profile row on first authenticated request.
    let { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', data.user.id).single()
    if (!profile) {
      const { data: created } = await supabaseAdmin
        .from('profiles')
        .insert({ id: data.user.id, email: data.user.email })
        .select()
        .single()
      profile = created
    }
    req.profile = profile
    next()
  } catch (err) {
    console.error('[auth] middleware error:', err)
    res.status(401).json({ error: 'unauthorized' })
  }
}

// Pro gate — enforced on the backend for every Pro route.
export function proGate(req, res, next) {
  if (!PRO_STATUSES.includes(req.profile?.subscription_status)) {
    return res.status(403).json({ error: 'pro_required' })
  }
  next()
}
