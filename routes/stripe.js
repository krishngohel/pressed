import { Router } from 'express'
import Stripe from 'stripe'
import { authMiddleware, supabaseAdmin } from '../middleware/auth.js'

const router = Router()
const stripe = () => new Stripe(process.env.STRIPE_SECRET_KEY)

const PLAN_PRICES = () => ({
  pro_monthly: { price: process.env.STRIPE_PRO_PRICE_ID, mode: 'subscription', status: 'pro' },
  pro_annual: { price: process.env.STRIPE_PRO_ANNUAL_PRICE_ID, mode: 'subscription', status: 'pro_annual' },
  lifetime: { price: process.env.STRIPE_LIFETIME_PRICE_ID, mode: 'payment', status: 'lifetime' },
})

async function ensureCustomer(profile, userId) {
  if (profile.stripe_customer_id) return profile.stripe_customer_id
  const customer = await stripe().customers.create({ email: profile.email, metadata: { user_id: userId } })
  await supabaseAdmin.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', userId)
  return customer.id
}

router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const plan = PLAN_PRICES()[req.body?.plan]
    if (!plan) return res.status(400).json({ error: 'invalid plan' })
    const customer = await ensureCustomer(req.profile, req.user.id)
    const session = await stripe().checkout.sessions.create({
      customer,
      mode: plan.mode,
      line_items: [{ price: plan.price, quantity: 1 }],
      success_url: `${process.env.APP_URL}/settings?upgraded=true`,
      cancel_url: `${process.env.APP_URL}/settings`,
      metadata: { user_id: req.user.id, plan: req.body.plan },
      ...(plan.mode === 'payment' ? { payment_intent_data: { metadata: { user_id: req.user.id, plan: 'lifetime' } } } : {}),
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('[stripe] checkout failed:', err)
    res.status(500).json({ error: 'checkout_failed' })
  }
})

router.post('/portal', authMiddleware, async (req, res) => {
  try {
    const customer = await ensureCustomer(req.profile, req.user.id)
    const session = await stripe().billingPortal.sessions.create({
      customer,
      return_url: `${process.env.APP_URL}/settings`,
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('[stripe] portal failed:', err)
    res.status(500).json({ error: 'portal_failed' })
  }
})

// Cancel at period end — never immediate.
router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    if (!req.profile.stripe_subscription_id) return res.status(400).json({ error: 'no_subscription' })
    const sub = await stripe().subscriptions.update(req.profile.stripe_subscription_id, { cancel_at_period_end: true })
    await supabaseAdmin
      .from('profiles')
      .update({ cancel_at: new Date(sub.current_period_end * 1000).toISOString() })
      .eq('id', req.user.id)
    res.json({ ok: true })
  } catch (err) {
    console.error('[stripe] cancel failed:', err)
    res.status(500).json({ error: 'cancel_failed' })
  }
})

router.post('/reactivate', authMiddleware, async (req, res) => {
  try {
    if (!req.profile.stripe_subscription_id) return res.status(400).json({ error: 'no_subscription' })
    await stripe().subscriptions.update(req.profile.stripe_subscription_id, { cancel_at_period_end: false })
    await supabaseAdmin.from('profiles').update({ cancel_at: null }).eq('id', req.user.id)
    res.json({ ok: true })
  } catch (err) {
    console.error('[stripe] reactivate failed:', err)
    res.status(500).json({ error: 'reactivate_failed' })
  }
})

router.get('/status', authMiddleware, (req, res) => {
  res.json({
    subscription_status: req.profile.subscription_status || 'free',
    plan_type: req.profile.plan_type,
    cancel_at: req.profile.cancel_at,
    renews_at: req.profile.renews_at,
  })
})

/* ---------- webhook (mounted with express.raw in api.js) ---------- */

export async function webhookHandler(req, res) {
  let event
  try {
    event = stripe().webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[stripe] webhook signature failed:', err.message)
    return res.status(400).send('invalid signature')
  }

  const setProfile = (userId, patch) => supabaseAdmin.from('profiles').update(patch).eq('id', userId)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.user_id
        const plan = session.metadata?.plan
        if (!userId) break
        if (session.mode === 'subscription') {
          const status = plan === 'pro_annual' ? 'pro_annual' : 'pro'
          const sub = await stripe().subscriptions.retrieve(session.subscription)
          await setProfile(userId, {
            subscription_status: status,
            plan_type: status,
            stripe_subscription_id: session.subscription,
            renews_at: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at: null,
          })
        } else if (plan === 'lifetime') {
          await setProfile(userId, { subscription_status: 'lifetime', plan_type: 'lifetime', renews_at: null, cancel_at: null })
        }
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const { data: profile } = await supabaseAdmin.from('profiles').select('id, subscription_status').eq('stripe_subscription_id', sub.id).single()
        if (!profile || profile.subscription_status === 'lifetime') break
        await setProfile(profile.id, {
          renews_at: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at: sub.cancel_at_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        })
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const { data: profile } = await supabaseAdmin.from('profiles').select('id, subscription_status').eq('stripe_subscription_id', sub.id).single()
        if (!profile || profile.subscription_status === 'lifetime') break
        await setProfile(profile.id, { subscription_status: 'free', plan_type: 'free', stripe_subscription_id: null, renews_at: null, cancel_at: null })
        break
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object
        if (pi.metadata?.plan === 'lifetime' && pi.metadata?.user_id) {
          await setProfile(pi.metadata.user_id, { subscription_status: 'lifetime', plan_type: 'lifetime', renews_at: null, cancel_at: null })
        }
        break
      }
    }
    res.json({ received: true })
  } catch (err) {
    console.error('[stripe] webhook handling failed:', err)
    res.status(500).json({ error: 'webhook_failed' })
  }
}

export default router
