import { useEffect, useState } from 'react'
import { Mail, RefreshCw } from 'lucide-react'
import EmailActionCard from '../components/EmailActionCard'
import Reveal from '../components/Reveal'
import { toast } from '../components/Toast'
import { get, post, put } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'action', label: 'Action Needed' },
  { id: 'interview_invite', label: 'Interviews' },
  { id: 'offer', label: 'Offers' },
  { id: 'rejection', label: 'Rejections' },
]

export default function Inbox() {
  const { profile, isPro, refreshProfile } = useAuth()
  const [actions, setActions] = useState([])
  const [tab, setTab] = useState('all')
  const [syncing, setSyncing] = useState(false)

  const load = () => get('/email-actions').then((a) => setActions(a || [])).catch(() => {})

  useEffect(() => {
    if (!isPro) { window.dispatchEvent(new CustomEvent('pressed:pro-required')); return }
    load()
    // Auto-sync if last sync > 1hr ago
    const last = profile?.gmail_last_sync ? new Date(profile.gmail_last_sync).getTime() : 0
    if (profile?.gmail_connected && Date.now() - last > 3600_000) sync(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro, profile?.gmail_connected])

  const connect = async () => {
    try {
      const { url } = await get('/gmail/connect')
      window.location.href = url
    } catch (err) {
      if (err.status !== 403) toast('Couldn’t start the Gmail connection.', 'error')
    }
  }

  const sync = async (quiet = false) => {
    setSyncing(true)
    try {
      await post('/gmail/sync')
      await load()
      await refreshProfile()
      if (!quiet) toast('Inbox synced.', 'success')
    } catch (err) {
      if (!quiet && err.status !== 403) toast('Sync hit a snag — try again.', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const dismiss = async (action) => {
    setActions((prev) => prev.filter((a) => a.id !== action.id))
    try { await put(`/email-actions/${action.id}`, { dismissed: true }) } catch {}
  }

  const linkToTracker = async (action) => {
    try {
      const updated = await put(`/email-actions/${action.id}`, { link_to_tracker: true })
      setActions((prev) => prev.map((a) => (a.id === action.id ? updated : a)))
      toast(`${action.company || 'Job'} linked to your tracker.`, 'success')
    } catch {
      toast('Couldn’t link that one.', 'error')
    }
  }

  const filtered = actions.filter((a) => {
    if (tab === 'all') return true
    if (tab === 'action') return ['interview_invite', 'follow_up', 'documents_needed'].includes(a.action_type) || a.deadline
    return a.action_type === tab
  })

  const sorted = [...filtered].sort((a, b) => {
    if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline)
    if (a.deadline) return -1
    if (b.deadline) return 1
    return new Date(b.synced_at || b.created_at) - new Date(a.synced_at || a.created_at)
  })

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <Reveal className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink">Inbox</h1>
          <p className="mt-1 text-sm text-graphite">Job-search emails, read and ranked for you.</p>
        </div>
        {profile?.gmail_connected && (
          <div className="flex items-center gap-3">
            {profile.gmail_last_sync && (
              <span className="font-mono text-xs text-stone">synced {new Date(profile.gmail_last_sync).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
            )}
            <button onClick={() => sync()} disabled={syncing} className="btn-primary !py-2.5 disabled:opacity-60">
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Scanning…' : 'Sync now'}
            </button>
          </div>
        )}
      </Reveal>

      {!profile?.gmail_connected ? (
        <Reveal className="card flex flex-col items-center gap-4 border-dashed p-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-s text-navy"><Mail size={22} /></span>
          <h2 className="font-display text-2xl text-ink">Connect Gmail</h2>
          <p className="max-w-md text-sm leading-relaxed text-graphite">
            Pressed scans for recruiter threads — interview invites, offers, rejections, deadlines — and turns them into a tidy action list. Read-only access; tokens stored encrypted.
          </p>
          <button onClick={connect} className="btn-primary"><Mail size={15} /> Connect Gmail</button>
        </Reveal>
      ) : (
        <>
          <Reveal delay={80} className="mb-6 flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-1.5 text-sm transition-all duration-300 ease-editorial ${
                  tab === t.id ? 'bg-navy text-cream' : 'border border-rule text-graphite hover:border-stone hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </Reveal>

          {sorted.length === 0 ? (
            <Reveal className="card border-dashed p-14 text-center text-sm text-stone">
              Nothing here. Either you're all caught up, or it's time to hit Sync.
            </Reveal>
          ) : (
            <div className="space-y-3.5">
              {sorted.map((action, i) => (
                <Reveal key={action.id} delay={Math.min(i * 60, 360)}>
                  <EmailActionCard action={action} onLink={linkToTracker} onDismiss={dismiss} />
                </Reveal>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}
