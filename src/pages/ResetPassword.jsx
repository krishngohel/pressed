import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Reveal from '../components/Reveal'
import { toast } from '../components/Toast'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return setError('Passwords don’t match.')
    setBusy(true); setError('')
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      toast('Password updated — welcome back.', 'success')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Something went wrong — request a fresh reset link.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5">
      <Reveal className="card w-full max-w-md p-8">
        <p className="wordmark">Pressed</p>
        <h1 className="mt-4 font-display text-3xl text-ink">Set a new password</h1>
        <p className="mt-1.5 text-sm text-graphite">Make it long, make it memorable.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">New password</label>
            <input type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input type="password" required minLength={8} className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="btn-primary w-full disabled:opacity-60">{busy ? 'Updating…' : 'Update password'}</button>
        </form>
      </Reveal>
    </main>
  )
}
