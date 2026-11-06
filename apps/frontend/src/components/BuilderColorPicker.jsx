import { useState, useEffect, useRef } from 'react'

/**
 * Colour picker shared by the game builders.
 *
 * Deliberately identical in behaviour and appearance to the quiz builder's
 * picker: a swatch that opens a popup containing preset swatches, the native
 * colour input, and a hex text box for exact values.
 *
 * Preset-free variant: pass `noPresets` for settings that expect an arbitrary
 * brand colour rather than one of the palette values.
 */

const COLOR_PRESETS = [
  '#1a1a2e', '#ffffff', '#000000', '#ef4444', '#22c55e', '#3b82f6',
  '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
  '#84cc16', '#0ea5e9',
]

/** `transparent` is a legitimate value for e.g. a secondary button background. */
function isHex(value) {
  return /^#?[0-9a-f]{6}$/i.test(String(value || '').trim());
}

export default function ColorPicker({ value, onChange, label, noPresets, allowTransparent }) {
  const [show, setShow] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const onDocDown = e => {
      if (ref.current && !ref.current.contains(e.target)) setShow(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [])

  // The native <input type="color"> rejects anything that isn't #rrggbb, so it
  // falls back to the stored value when the field holds a keyword.
  const swatch = isHex(value) ? value : 'transparent'
  const nativeValue = isHex(value) ? value : '#000000'

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      {label && <span className="gb-label">{label}</span>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          className="gb-swatch"
          style={{
            background: swatch,
            // A checkerboard makes transparency readable rather than looking broken.
            backgroundImage: value === 'transparent'
              ? 'linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)'
              : undefined,
            backgroundSize: value === 'transparent' ? '10px 10px' : undefined,
            backgroundPosition: value === 'transparent' ? '0 0,0 5px,5px -5px,-5px 0' : undefined,
          }}
          onClick={() => setShow(s => !s)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShow(s => !s) } }}
          aria-label={label ? `${label}: ${value || 'unset'}` : 'Choose colour'}
        />
        <input
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="#000000"
          style={{ width: 90, fontSize: 12, padding: '5px 8px' }}
        />
      </div>

      {show && (
        <div
          className="gb-cpop"
          style={noPresets ? { display: 'flex', flexDirection: 'column', gap: 6, padding: 10 } : {}}
        >
          {!noPresets && COLOR_PRESETS.map(c => (
            <div
              key={c}
              onClick={() => { onChange(c); setShow(false) }}
              title={c}
              style={{
                width: 22, height: 22, background: c, borderRadius: 4, cursor: 'pointer',
                border: value === c ? '2px solid var(--gb-primary)' : '1px solid #e2e6f0',
              }}
            />
          ))}

          <input
            type="color"
            value={nativeValue}
            onChange={e => onChange(e.target.value)}
            style={{
              gridColumn: 'span 7', width: '100%', height: 28,
              padding: 0, border: 'none', background: 'none', cursor: 'pointer',
            }}
          />

          {allowTransparent && (
            <button
              type="button"
              className="gb-btn gb-btn-ghost gb-btn-sm"
              style={{ width: '100%' }}
              onClick={() => { onChange('transparent'); setShow(false) }}
            >
              Transparent
            </button>
          )}

          <button
            type="button"
            className="gb-btn gb-btn-ghost gb-btn-sm"
            style={{ width: '100%' }}
            onClick={() => setShow(false)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
