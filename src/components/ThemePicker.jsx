import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

// Split-gradient swatch UX (same as Scrubbed): primary on top-left, accent bottom-right.
function Swatch({ primary, accent, size = 44 }) {
  return (
    <span
      className="block rounded-full border border-rule shadow-card"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${primary} 0 50%, ${accent} 50% 100%)` }}
    />
  )
}

export default function ThemePicker() {
  const { theme, setTheme, presets } = useTheme()
  const { isPro } = useAuth()
  const [customPrimary, setCustomPrimary] = useState(theme.primary || '#1E3A8A')
  const [customAccent, setCustomAccent] = useState(theme.accent || '#5A6E4A')

  const pick = (name, preset) => {
    if (!preset.free && !isPro) {
      window.dispatchEvent(new CustomEvent('pressed:pro-required'))
      return
    }
    setTheme(name)
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {Object.entries(presets).map(([name, preset]) => {
          const active = theme.name === name
          const locked = !preset.free && !isPro
          return (
            <button
              key={name}
              onClick={() => pick(name, preset)}
              className={`group flex flex-col items-center gap-2 rounded-card border p-3 transition-all duration-300 ease-editorial hover:-translate-y-0.5 hover:shadow-card ${
                active ? 'border-navy bg-navy-s/40' : 'border-rule bg-cream'
              }`}
            >
              <span className="relative">
                <Swatch primary={preset.primary} accent={preset.accent} />
                {locked && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-cream">
                    <Lock size={10} />
                  </span>
                )}
              </span>
              <span className={`text-xs ${active ? 'font-medium text-navy-p' : 'text-graphite'}`}>{name}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 rounded-card border border-rule bg-cream p-4">
        <p className="mb-3 text-sm font-medium text-ink">Custom palette {!isPro && <span className="pill-navy ml-2">Pro</span>}</p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">Primary</label>
            <input type="color" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="h-10 w-16 cursor-pointer rounded border border-rule bg-transparent" />
          </div>
          <div>
            <label className="label">Accent</label>
            <input type="color" value={customAccent} onChange={(e) => setCustomAccent(e.target.value)} className="h-10 w-16 cursor-pointer rounded border border-rule bg-transparent" />
          </div>
          <Swatch primary={customPrimary} accent={customAccent} size={40} />
          <button
            className="btn-secondary !py-2.5"
            onClick={() => {
              if (!isPro) return window.dispatchEvent(new CustomEvent('pressed:pro-required'))
              setTheme({ primary: customPrimary, accent: customAccent })
            }}
          >
            Apply custom
          </button>
        </div>
      </div>
    </div>
  )
}
