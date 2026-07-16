import { useState } from 'react'
import { CreditCard, Mail, Palette, User, ExternalLink } from 'lucide-react'
import ThemePicker from '../components/ThemePicker'
import Reveal from '../components/Reveal'
import { toast } from '../components/Toast'
import { get, post } from '../lib/api'
import { useAuth } from '../context/AuthContext'

function Section({ icon: Icon, title, children, delay = 0 }) {
  return (
    <Reveal delay={delay} className="card p-7">
      <h2 className="mb-5 flex items-center gap-2.5 font-display text-2xl text-ink"><Icon size={18} className="text-navy" /> {title}</h2>
      {children}
    </Reveal>
  )
}

export default function Settings() {
  const { profile, isPro, refreshProfile } = useAuth()
  const [busy, setBusy] = useState(false)

  const portal = async () => {
    setBusy(true)
    try { const { url } = await post('/stripe/portal'); window.location.href = url }
    catch { toast('Couldn’t open billing — try again.', 'error'); setBusy(false) }
  }

  const cancel = async () => {
    setBusy(true)
    try { await post('/stripe/cancel'); await refreshProfile(); toast('Your plan will end at the period close.') }
    catch { toast('Couldn’t cancel — try the billing portal.', 'error') }
    finally { setBusy(false) }
  }

  const reactivate = async () => {
    setBusy(true)
    try { await post('/stripe/reactivate'); await refreshProfile(); toast('Welcome back — renewal restored.', 'success') }
    catch { toast('Couldn’t reactivate — try again.', 'error') }
    finally { setBusy(false) }
  }

  const connectGmail = async () => {
    try { const { url } = await get('/gmail/connect'); window.location.href = url }
    catch (err) { if (err.status !== 403) toast('Couldn’t start the Gmail connection.', 'error') }
  }

  const disconnectGmail = async () => {
    try { await post('/gmail/disconnect'); await refreshProfile(); toast('Gmail disconnected.') }
    catch { toast('Couldn’t disconnect.', 'error') }
  }

  const planLabel = { free: 'Free', pro: 'Pro Monthly', pro_annual: 'Pro Annual', lifetime: 'Lifetime' }[profile?.subscription_status] || 'Free'

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-10">
      <Reveal>
        <h1 className="font-display text-4xl font-medium tracking-tight text-ink">Settings</h1>
      </Reveal>

      <Section icon={User} title="Account" delay={60}>
        <p className="text-sm text-graphite">Signed in as <span className="font-medium text-ink">{profile?.email}</span></p>
        <p className="mt-1 text-xs text-stone">Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '—'}</p>
      </Section>

      <Section icon={CreditCard} title="Billing" delay={120}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className={isPro ? 'pill-navy' : 'pill-neutral'}>{planLabel}</span>
            {profile?.cancel_at && (
              <p className="mt-2 text-xs text-amber-700">Cancels {new Date(profile.cancel_at).toLocaleDateString()} — you keep Pro until then.</p>
            )}
            {!profile?.cancel_at && profile?.renews_at && isPro && profile?.subscription_status !== 'lifetime' && (
              <p className="mt-2 text-xs text-stone">Renews {new Date(profile.renews_at).toLocaleDateString()}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!isPro && (
              <button onClick={() => window.dispatchEvent(new CustomEvent('pressed:pro-required'))} className="btn-primary !py-2.5">Upgrade to Pro</button>
            )}
            {isPro && profile?.subscription_status !== 'lifetime' && (
              <>
                <button disabled={busy} onClick={portal} className="btn-secondary !py-2.5 disabled:opacity-60"><ExternalLink size={14} /> Billing portal</button>
                {profile?.cancel_at
                  ? <button disabled={busy} onClick={reactivate} className="btn-primary !py-2.5 disabled:opacity-60">Reactivate</button>
                  : <button disabled={busy} onClick={cancel} className="btn-ghost !py-2.5 text-graphite disabled:opacity-60">Cancel plan</button>}
              </>
            )}
          </div>
        </div>
      </Section>

      <Section icon={Mail} title="Gmail" delay={180}>
        {profile?.gmail_connected ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-ink">Connected as <span className="font-medium">{profile.gmail_email}</span></p>
              <p className="mt-1 text-xs text-stone">Tokens are stored encrypted. Read-only scanning of job-related threads.</p>
            </div>
            <button onClick={disconnectGmail} className="btn-secondary !py-2.5">Disconnect</button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-graphite">Connect Gmail to surface interviews, offers and deadlines automatically. <span className="pill-navy ml-1">Pro</span></p>
            <button onClick={connectGmail} className="btn-primary !py-2.5"><Mail size={14} /> Connect Gmail</button>
          </div>
        )}
      </Section>

      <Section icon={Palette} title="Theme" delay={240}>
        <ThemePicker />
      </Section>
    </main>
  )
}
