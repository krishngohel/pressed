import { useEffect, useState } from 'react'
import { X, Check, Sparkles } from 'lucide-react'
import { post } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const PERKS = [
  'AI resume generation with four editorial templates',
  'Click-to-edit visual resume editor — zero code, ever',
  '“Tailor for this role” rewrites bullets to the job description',
  'Gmail connector: interviews, offers & deadlines surfaced for you',
  'Unlimited AI resume parsing into your Vault',
  'Version history and every theme preset',
]

export default function UpgradeModal() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(null)
  const { session } = useAuth()

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener('pressed:pro-required', onOpen)
    return () => window.removeEventListener('pressed:pro-required', onOpen)
  }, [])

  if (!open) return null

  const checkout = async (plan) => {
    if (!session) {
      setOpen(false)
      window.dispatchEvent(new CustomEvent('pressed:auth', { detail: { mode: 'signup' } }))
      return
    }
    setBusy(plan)
    try {
      const { url } = await post('/stripe/checkout', { plan })
      window.location.href = url
    } catch {
      setBusy(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="card w-full max-w-lg overflow-hidden shadow-lift animate-rise" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-ink px-8 py-7">
          <button onClick={() => setOpen(false)} className="absolute right-4 top-4 text-stone transition-colors hover:text-cream"><X size={16} /></button>
          <p className="flex items-center gap-2 font-display italic text-2xl text-cream"><Sparkles size={18} className="text-navy-s" /> Pressed Pro</p>
          <p className="mt-1.5 text-sm text-stone">The full wardrobe. Everything you need to walk in prepared.</p>
        </div>
        <div className="px-8 py-6">
          <ul className="space-y-2.5">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-graphite">
                <Check size={15} className="mt-0.5 shrink-0 text-moss" /> {p}
              </li>
            ))}
          </ul>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button disabled={!!busy} onClick={() => checkout('pro_monthly')} className="btn-secondary flex-col !gap-0.5 !py-3.5 disabled:opacity-60">
              <span className="font-mono text-base font-semibold text-ink">$15<span className="text-xs text-stone">/mo</span></span>
              <span className="text-xs text-stone">Monthly</span>
            </button>
            <button disabled={!!busy} onClick={() => checkout('pro_annual')} className="btn-primary flex-col !gap-0.5 !py-3.5 disabled:opacity-60">
              <span className="font-mono text-base font-semibold">$120<span className="text-xs opacity-70">/yr</span></span>
              <span className="text-xs opacity-80">Annual — two months free</span>
            </button>
          </div>
          <button disabled={!!busy} onClick={() => checkout('lifetime')} className="mt-3 w-full text-center text-xs text-graphite transition-colors hover:text-navy">
            Or own it forever — Lifetime, $299 once
          </button>
        </div>
      </div>
    </div>
  )
}
