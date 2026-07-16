import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Settings as SettingsIcon, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'

const appLinks = [
  { to: '/vault', label: 'Vault' },
  { to: '/resume', label: 'Resume' },
  { to: '/dashboard', label: 'Tracker' },
  { to: '/inbox', label: 'Inbox' },
]

function planBadge(profile) {
  const status = profile?.subscription_status
  if (status === 'lifetime') return 'Lifetime'
  if (status === 'pro_annual' || status === 'pro') {
    const renews = profile?.renews_at
      ? new Date(profile.renews_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : null
    return renews ? `Pro · renews ${renews}` : 'Pro'
  }
  return 'Free'
}

export default function Nav() {
  const { session, profile, isPro, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <>
      <header className="nav-blur sticky top-0 z-40 border-b border-rule">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-8">
            <Link to="/" className="wordmark transition-opacity duration-300 ease-editorial hover:opacity-70">
              Pressed
            </Link>
            {session ? (
              <nav className="hidden items-center gap-1 md:flex">
                {appLinks.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className={({ isActive }) =>
                      `rounded-full px-3.5 py-1.5 text-sm transition-colors duration-300 ease-editorial ${
                        isActive ? 'bg-navy-s text-navy-p font-medium' : 'text-graphite hover:text-ink hover:bg-cream'
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </nav>
            ) : (
              <nav className="hidden items-center gap-6 md:flex">
                {['Vault', 'Resume', 'Tracker', 'Pricing'].map((label) => (
                  <a
                    key={label}
                    href={`/#${label.toLowerCase()}`}
                    className="text-sm text-graphite transition-colors duration-300 ease-editorial hover:text-ink"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            )}
          </div>

          {session ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-full border border-rule bg-cream py-1.5 pl-2 pr-3 transition-all duration-300 ease-editorial hover:border-stone"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy font-display italic text-sm text-cream">
                  {(profile?.email || session.user.email || '?')[0].toUpperCase()}
                </span>
                <span className={isPro ? 'pill-navy' : 'pill-neutral'}>{planBadge(profile)}</span>
                <ChevronDown size={14} className={`text-stone transition-transform duration-300 ease-editorial ${menuOpen ? 'rotate-180' : ''}`} />
              </button>
              {menuOpen && (
                <div className="card absolute right-0 top-12 w-56 overflow-hidden py-1.5 shadow-lift">
                  <div className="border-b border-rule px-4 py-2.5">
                    <p className="truncate text-sm font-medium text-ink">{profile?.email || session.user.email}</p>
                    <p className="text-xs text-stone">{planBadge(profile)}</p>
                  </div>
                  {!isPro && (
                    <button
                      onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('pressed:pro-required')) }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-navy transition-colors hover:bg-navy-s/50"
                    >
                      <Sparkles size={15} /> Upgrade to Pro
                    </button>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/settings') }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-graphite transition-colors hover:bg-cream hover:text-ink"
                  >
                    <SettingsIcon size={15} /> Settings
                  </button>
                  <button
                    onClick={async () => { setMenuOpen(false); await signOut(); navigate('/') }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-graphite transition-colors hover:bg-cream hover:text-ink"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => window.dispatchEvent(new CustomEvent('pressed:auth', { detail: { mode: 'login' } }))} className="btn-ghost">
                Sign in
              </button>
              <button onClick={() => window.dispatchEvent(new CustomEvent('pressed:auth', { detail: { mode: 'signup' } }))} className="btn-primary !px-5 !py-2.5">
                Start free
              </button>
            </div>
          )}
        </div>
      </header>
      <AuthModal />
    </>
  )
}
