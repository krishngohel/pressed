import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const { signIn, signUp, resetPassword, session } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  useEffect(() => {
    const onOpen = (e) => {
      setMode(e.detail?.mode || 'login')
      setError(''); setInfo('')
      setOpen(true)
    }
    window.addEventListener('pressed:auth', onOpen)
    return () => window.removeEventListener('pressed:auth', onOpen)
  }, [])

  // ?auth=login deep link (used by protected-route redirects)
  useEffect(() => {
    const auth = params.get('auth')
    if (auth && !session) {
      setMode(auth === 'signup' ? 'signup' : 'login')
      setOpen(true)
    }
  }, [params, session])

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(''); setInfo('')
    try {
      if (mode === 'forgot') {
        await resetPassword(email)
        setInfo('Check your inbox — we sent a reset link.')
      } else if (mode === 'signup') {
        await signUp(email, password)
        setInfo('Account created. Check your email to confirm, then sign in.')
        setMode('login')
      } else {
        await signIn(email, password)
        setOpen(false)
        const next = params.get('next') || '/dashboard'
        params.delete('auth'); params.delete('next')
        setParams(params, { replace: true })
        navigate(next)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong — try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="card w-full max-w-md p-8 shadow-lift animate-rise" style={{ '--rise-delay': '0ms' }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="wordmark">Pressed</p>
            <p className="mt-1 text-sm text-graphite">
              {mode === 'login' && 'Welcome back. Sign in to continue.'}
              {mode === 'signup' && 'Start free — no card required.'}
              {mode === 'forgot' && 'We’ll email you a reset link.'}
            </p>
          </div>
          <button onClick={() => setOpen(false)} className="btn-ghost !p-2"><X size={16} /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          {mode !== 'forgot' && (
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          )}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {info && <p className="rounded-lg bg-moss-s px-3 py-2 text-sm text-moss">{info}</p>}
          <button disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? 'One moment…' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm text-graphite">
          {mode === 'login' ? (
            <>
              <button className="transition-colors hover:text-ink" onClick={() => setMode('signup')}>Need an account?</button>
              <button className="transition-colors hover:text-ink" onClick={() => setMode('forgot')}>Forgot password?</button>
            </>
          ) : (
            <button className="transition-colors hover:text-ink" onClick={() => setMode('login')}>Back to sign in</button>
          )}
        </div>
      </div>
    </div>
  )
}
