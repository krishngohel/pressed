// Pressed theme engine — ported from Scrubbed's theme.js (clay → navy).
// Injects CSS variable overrides via <style id="theme-overrides"> before paint,
// persists to localStorage AND profiles.theme_preset in Supabase.

import { supabase } from './supabase'

export const THEME_DEFAULT = 'Midnight'

export const THEME_PRESETS = {
  Midnight: { primary: '#1E3A8A', accent: '#5A6E4A', free: true },
  Graphite: { primary: '#1F1B16', accent: '#1E3A8A', free: true },
  Moss:     { primary: '#43573A', accent: '#1E3A8A', free: false },
  Clay:     { primary: '#B5563A', accent: '#5A6E4A', free: false }, // homage to Scrubbed
  Plum:     { primary: '#6B2D5C', accent: '#A8884A', free: false },
  Slate:    { primary: '#3B5168', accent: '#5A6E4A', free: false },
}

const STORAGE_KEY = 'pressed:theme'

/* ---------- color math ---------- */

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(v, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('').toUpperCase()
}

function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  return rgbToHex(a.map((c, i) => c + (b[i] - c) * t))
}

export const darken = (hex, t) => mix(hex, '#000000', t)
export const soften = (hex, t = 0.86) => mix(hex, '#FFFFFF', t)

/* ---------- CSS building & injection ---------- */

export function buildThemeCss({ primary, accent }) {
  return [
    ':root{',
    `--navy:${primary};`,
    `--navy-d:${darken(primary, 0.12)};`,
    `--navy-p:${darken(primary, 0.24)};`,
    `--navy-s:${soften(primary)};`,
    `--moss:${accent};`,
    `--moss-s:${soften(accent, 0.8)};`,
    '}',
  ].join('')
}

function injectCss(css) {
  let style = document.getElementById('theme-overrides')
  if (!style) {
    style = document.createElement('style')
    style.id = 'theme-overrides'
    document.head.appendChild(style)
  }
  style.textContent = css
}

/* ---------- public API ---------- */

export function resolveTheme(presetOrCustom) {
  if (typeof presetOrCustom === 'string') {
    const p = THEME_PRESETS[presetOrCustom] || THEME_PRESETS[THEME_DEFAULT]
    return { name: presetOrCustom in THEME_PRESETS ? presetOrCustom : THEME_DEFAULT, primary: p.primary, accent: p.accent }
  }
  return { name: 'Custom', primary: presetOrCustom.primary, accent: presetOrCustom.accent || THEME_PRESETS[THEME_DEFAULT].accent }
}

export function applyTheme(presetOrCustom, { persist = true, sync = true } = {}) {
  const theme = resolveTheme(presetOrCustom)
  const css = buildThemeCss(theme)
  injectCss(css)

  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: theme.name, primary: theme.primary, accent: theme.accent, css }))
    } catch {}
  }

  if (sync) {
    // Fire-and-forget: persist to Supabase profile when signed in.
    supabase.auth.getSession().then(({ data }) => {
      const userId = data?.session?.user?.id
      if (!userId) return
      supabase
        .from('profiles')
        .update({ theme_preset: theme.name === 'Custom' ? `custom:${theme.primary}:${theme.accent}` : theme.name })
        .eq('id', userId)
        .then(() => {})
    }).catch(() => {})
  }

  return theme
}

export function loadStoredTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function initTheme() {
  const stored = loadStoredTheme()
  if (stored?.primary) {
    applyTheme(stored.name && stored.name !== 'Custom' ? stored.name : { primary: stored.primary, accent: stored.accent }, { persist: false, sync: false })
    return stored
  }
  applyTheme(THEME_DEFAULT, { persist: false, sync: false })
  return { name: THEME_DEFAULT, ...THEME_PRESETS[THEME_DEFAULT] }
}

export function themeFromProfile(preset) {
  if (!preset) return
  if (preset.startsWith('custom:')) {
    const [, primary, accent] = preset.split(':')
    applyTheme({ primary, accent }, { sync: false })
  } else if (THEME_PRESETS[preset]) {
    applyTheme(preset, { sync: false })
  }
}

// Expose globally (parity with Scrubbed)
if (typeof window !== 'undefined') {
  window.THEME_PRESETS = THEME_PRESETS
  window.THEME_DEFAULT = THEME_DEFAULT
}
