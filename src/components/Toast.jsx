import { useEffect, useState } from 'react'

// Global toast — fire with: toast('Saved'), toast('Something went wrong', 'error')
export function toast(message, tone = 'info') {
  window.dispatchEvent(new CustomEvent('pressed:toast', { detail: { message, tone, id: Date.now() + Math.random() } }))
}

export default function ToastHost() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const onToast = (e) => {
      const t = e.detail
      setToasts((prev) => [...prev, t])
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000)
    }
    window.addEventListener('pressed:toast', onToast)
    return () => window.removeEventListener('pressed:toast', onToast)
  }, [])

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-rise rounded-full border px-5 py-2.5 text-sm shadow-lift ${
            t.tone === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : t.tone === 'success'
              ? 'border-moss-s bg-moss-s text-moss'
              : 'border-rule bg-cream text-ink'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
