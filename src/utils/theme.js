// Live theme/preferences applier — keeps the UI in sync with Settings → Interface.
const PREF_KEY = 'hrm_settings'

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}
const toHex = ({ r, g, b }) =>
  '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')

// amount: negative = darker, positive = lighter
function shade(hex, amount) {
  const { r, g, b } = hexToRgb(hex)
  const t = amount < 0 ? 0 : 255
  const p = Math.abs(amount)
  return toHex({
    r: r + (t - r) * p,
    g: g + (t - g) * p,
    b: b + (t - b) * p,
  })
}
function rgba(hex, a) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export function applyAccent(hex) {
  if (!hex) return
  const { r, g, b } = hexToRgb(hex)
  const s = document.documentElement.style
  s.setProperty('--accent', hex)
  s.setProperty('--accent-rgb', `${r}, ${g}, ${b}`)
  s.setProperty('--accent-strong', shade(hex, -0.18))
  s.setProperty('--accent-soft', rgba(hex, 0.12))
  s.setProperty('--accent-softer', rgba(hex, 0.07))
  s.setProperty('--accent-ring', rgba(hex, 0.2))
}

export function applyDensity(density) {
  document.documentElement.setAttribute('data-density', density || 'comfortable')
}

export function readPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY)) || null
  } catch {
    return null
  }
}

// Called once on app boot so the saved theme is active everywhere.
export function applySavedPrefs() {
  const prefs = readPrefs()
  if (!prefs) return
  applyAccent(prefs.interface?.accent)
  applyDensity(prefs.interface?.density)
}
