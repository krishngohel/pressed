import { createContext, useContext, useEffect, useState } from 'react'
import { initTheme, applyTheme, THEME_PRESETS, THEME_DEFAULT } from '../lib/theme'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => initTheme())

  const setTheme = (presetOrCustom) => {
    const applied = applyTheme(presetOrCustom)
    setThemeState(applied)
  }

  useEffect(() => {
    // Re-assert on mount in case the boot script ran with stale CSS.
    applyTheme(theme.name === 'Custom' ? { primary: theme.primary, accent: theme.accent } : theme.name, {
      persist: false,
      sync: false,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, presets: THEME_PRESETS, defaultPreset: THEME_DEFAULT }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
