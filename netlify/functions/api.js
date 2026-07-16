// Pressed API — Express wrapped for Netlify Functions.
// /api/* redirects here (see netlify.toml), so routes mount without the /api prefix.

import express from 'express'
import serverless from 'serverless-http'
import authRoutes from '../../routes/auth.js'
import vaultRoutes from '../../routes/vault.js'
import resumeRoutes from '../../routes/resumes.js'
import aiRoutes from '../../routes/ai.js'
import jobRoutes from '../../routes/jobs.js'
import gmailRoutes, { emailActions } from '../../routes/gmail.js'
import stripeRoutes, { webhookHandler } from '../../routes/stripe.js'

const app = express()

// Stripe webhook needs the raw body for signature verification — mount BEFORE express.json.
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), webhookHandler)

app.use(express.json({ limit: '15mb' })) // base64 resume uploads

app.use('/auth', authRoutes)
app.use('/vault', vaultRoutes)
app.use('/resumes', resumeRoutes)
app.use('/ai', aiRoutes)
app.use('/jobs', jobRoutes)
app.use('/gmail', gmailRoutes)
app.use('/email-actions', emailActions)
app.use('/stripe', stripeRoutes)

app.use((req, res) => res.status(404).json({ error: 'not_found' }))

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[api] unhandled error:', err)
  res.status(500).json({ error: 'internal_error' })
})

export const handler = serverless(app)
