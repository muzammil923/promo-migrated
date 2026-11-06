// Derive a full console palette from a single picked color.
// We keep surfaces/text neutral (for readability) and recolor all the
// "brand" tokens (primary family + tinted borders) from the pick.

function hexToRgb(hex) {
  let h = String(hex || '').replace('#', '').trim()
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const n = parseInt(h, 16)
  if (isNaN(n) || h.length !== 6) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHex(r, g, b) {
  const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h *= 60
  }
  return { h, s: s * 100, l: l * 100 }
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100
  if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v } }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue = (t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return {
    r: Math.round(hue(h + 1 / 3) * 255),
    g: Math.round(hue(h) * 255),
    b: Math.round(hue(h - 1 / 3) * 255),
  }
}

function shade(hex, dl) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const nl = Math.max(4, Math.min(96, l + dl))
  const out = hslToRgb(h, s, nl)
  return rgbToHex(out.r, out.g, out.b)
}

function withAlpha(hex, alpha) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

// Full token override object for a picked color.
// Surfaces/text stay neutral (readable); brand tokens are recolored.
export function buildThemeVars(baseHex) {
  const base = hexToRgb(baseHex)
  if (!base) return {}
  const lighter1 = shade(baseHex, 8)   // hover
  const lighter2 = shade(baseHex, 18)  // light
  const darker1 = shade(baseHex, -8)   // deeper
  const darker2 = shade(baseHex, -16)
  const darker3 = shade(baseHex, -26)
  return {
    '--primary': baseHex,
    '--primary-hover': lighter1,
    '--primary-light': lighter2,
    '--primary-bg': withAlpha(baseHex, 0.1),
    '--accent': lighter1,
    '--accent-light': lighter2,
    '--gb-primary': baseHex,
    '--gb-primary-d': lighter1,
    '--gb-primary-g': withAlpha(baseHex, 0.1),
    '--gb-primary-bg': withAlpha(baseHex, 0.1),
    '--border': withAlpha(baseHex, 0.25),
    '--gb-border': withAlpha(baseHex, 0.28),
    '--border-light': withAlpha(baseHex, 0.14),
    // darker shades exposed for potential use / debugging
    '--gb-primary-d2': darker2,
    '--gb-primary-d3': darker3,
  }
}

export function shadeScale(baseHex) {
  return {
    lighter: [shade(baseHex, 8), shade(baseHex, 18), shade(baseHex, 30)],
    darker: [shade(baseHex, -8), shade(baseHex, -16), shade(baseHex, -26)],
  }
}
