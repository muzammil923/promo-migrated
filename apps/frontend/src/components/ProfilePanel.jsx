import { useState, useEffect } from 'react'
import { buildThemeVars, shadeScale } from '../lib/themeColor'

const ACCENT = '#a855f7'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Glass + flat styling tokens (theme-aware) ──
const C = {
  card: 'var(--surface2)',
  cardBorder: 'var(--border)',
  hair: 'var(--border-light)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  danger: 'var(--error)',
  dangerBg: 'var(--error-bg)',
  dangerBorder: 'var(--error-border)',
}

function Row({ icon, title, subtitle, chevron, onClick, right }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
      padding: '13px 14px', background: 'none', border: 'none', cursor: onClick ? 'pointer' : 'default',
      fontFamily: 'inherit', textAlign: 'left',
    }}>
      <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text }}>{title}</span>
        {subtitle && <span style={{ display: 'block', fontSize: 12, color: C.text2, marginTop: 1 }}>{subtitle}</span>}
      </span>
      {right}
      {chevron && <span style={{ color: C.text3, fontSize: 16 }}>›</span>}
    </button>
  )
}

function ProfilePanel({ user, onLogout, isDark, toggleTheme, MiniCalendar, ChangePasswordForm }) {
  const [view, setView] = useState('main')
  const [colorOpen, setColorOpen] = useState(false)
  const [stats, setStats] = useState({ games: 0, players: 0 })
  const [color, setColor] = useState(() => localStorage.getItem('consoleColor') || ACCENT)
  const [swatches, setSwatches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('consoleSwatches') || '[]') } catch { return [] }
  })

  useEffect(() => {
    if (view !== 'main') return
    Promise.all([
      fetch('/api/games', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).catch(() => null),
      fetch('/api/players-admin', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).catch(() => null),
    ]).then(([g, p]) => {
      const games = g?.games?.length || g?.length || 0
      const players = p?.players?.length || p?.length || 0
      setStats({ games, players })
    })
  }, [view])

  const applyColor = (hex) => {
    const vars = buildThemeVars(hex)
    let style = document.getElementById('custom-console-theme')
    if (!style) { style = document.createElement('style'); style.id = 'custom-console-theme'; document.head.appendChild(style) }
    const body = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n')
    style.textContent = `[data-theme='light'] {\n${body}\n}\n[data-theme='dark'] {\n${body}\n}`
  }
  const commit = (hex) => {
    setColor(hex); localStorage.setItem('consoleColor', hex); applyColor(hex)
    setSwatches(prev => {
      const next = [hex, ...prev.filter(c => c.toLowerCase() !== hex.toLowerCase())].slice(0, 5)
      localStorage.setItem('consoleSwatches', JSON.stringify(next)); return next
    })
  }
  const reset = () => {
    localStorage.removeItem('consoleColor'); localStorage.removeItem('consoleSwatches')
    const s = document.getElementById('custom-console-theme'); if (s) s.textContent = ''
    setColor(ACCENT); setSwatches([])
  }

  const initials = (user?.name || 'A').trim().charAt(0).toUpperCase()
  const today = new Date()
  const scale = shadeScale(color).lighter.concat([color]).concat(shadeScale(color).darker)

  // ── SUB VIEWS ──
  if (view === 'calendar') {
    return (
      <div style={{ padding: 14 }}>
        <button onClick={() => setView('main')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: C.text2, fontFamily: 'inherit', marginBottom: 10 }}>‹ back</button>
        <MiniCalendar />
      </div>
    )
  }
  if (view === 'password') {
    return (
      <div style={{ padding: 14 }}>
        <button onClick={() => setView('main')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: C.text2, fontFamily: 'inherit', marginBottom: 10 }}>‹ back</button>
        <ChangePasswordForm onClose={() => setView('main')} />
      </div>
    )
  }

  // ── MAIN VIEW ──
  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Profile card */}
      <div style={{
        background: C.card, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: 14,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(168,85,247,0.12)', color: ACCENT,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 800,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{user?.name || 'Admin'}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, background: 'rgba(168,85,247,0.12)', padding: '2px 8px', borderRadius: 20 }}>{user?.role || 'admin'}</span>
          </div>
          <div style={{ fontSize: 12.5, color: C.text2, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</div>
        </div>
        <span style={{ color: C.text3, fontSize: 18 }}>›</span>
      </div>

      {/* Stats row */}
      <div style={{
        background: C.card, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        border: `1px solid ${C.cardBorder}`, borderRadius: 12,
        display: 'flex',
      }}>
        {[
          { n: stats.games, l: 'Games' },
          { n: stats.players, l: 'Players' },
          { n: `${MONTHS[today.getMonth()]} ${today.getDate()}`, l: 'Today' },
        ].map((s, i) => (
          <div key={s.l} style={{
            flex: 1, padding: '14px 8px', textAlign: 'center',
            borderLeft: i === 0 ? 'none' : `1px solid ${C.hair}`,
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text, lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: 11.5, color: C.text2, marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Account section */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: '.05em', padding: '0 4px 6px' }}>Account</div>
        <div style={{
          background: C.card, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          border: `1px solid ${C.cardBorder}`, borderRadius: 12, overflow: 'hidden',
        }}>
          <Row
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
            title="Calendar" subtitle={today.toDateString()}
            onClick={() => setView('calendar')}
          />
          <div style={{ height: 1, background: C.hair }} />
          <Row
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
            title="Change password" subtitle="Update your credentials"
            chevron onClick={() => setView('password')}
          />
        </div>
      </div>

      {/* Appearance section */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: C.text2, textTransform: 'uppercase', letterSpacing: '.05em', padding: '0 4px 6px' }}>Appearance</div>
        <div style={{
          background: C.card, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          border: `1px solid ${C.cardBorder}`, borderRadius: 12, overflow: 'hidden',
        }}>
          {/* Theme toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
            <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg>
            </span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.text }}>Theme</span>
            <button onClick={toggleTheme} aria-label="Toggle theme" style={{
              width: 46, height: 26, borderRadius: 100, padding: 3, cursor: 'pointer',
              border: `1px solid ${C.hair}`, background: 'rgba(0,0,0,0.06)', position: 'relative', transition: 'background .2s',
            }}>
              <span style={{ position: 'absolute', top: 2, left: isDark ? 'calc(100% - 22px)' : 2, width: 20, height: 20, borderRadius: '50%', background: ACCENT, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
            </button>
          </div>

          <div style={{ height: 1, background: C.hair }} />

          {/* Console color (clickable row → opens picker) */}
          <div
            onClick={() => setColorOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer' }}
          >
            <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 2a10 10 0 0 0 0 20"/></svg>
            </span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.text }}>Console color</span>
            <span style={{ width: 18, height: 18, borderRadius: 5, background: color, border: `1px solid ${C.hair}` }} />
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: C.text2 }}>{color.toUpperCase()}</span>
            <span style={{ color: C.text3, fontSize: 16 }}>›</span>
          </div>

          {/* Picker popover */}
          {colorOpen && (
            <div style={{ padding: '0 14px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <input
                  type="color" value={color}
                  onChange={e => commit(e.target.value)}
                  style={{ width: 40, height: 40, padding: 0, border: `1px solid ${C.hair}`, borderRadius: 8, background: 'none', cursor: 'pointer' }}
                />
                <input
                  value={color}
                  onChange={e => { const v = e.target.value; if (/^#([0-9a-fA-F]{6})$/.test(v)) { setColor(v); commit(v) } else setColor(v) }}
                  style={{ flex: 1, fontSize: 13, padding: '9px 10px', borderRadius: 8, border: `1px solid ${C.hair}`, background: 'var(--bg-secondary)', color: C.text, outline: 'none', fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                {scale.map((c, i) => (
                  <button key={i} onClick={() => commit(c)} title={c} style={{
                    flex: 1, height: 26, borderRadius: 6, cursor: 'pointer', background: c,
                    border: `2px solid ${C.cardBorder}`,
                    boxShadow: c.toLowerCase() === color.toLowerCase() ? `0 0 0 2px ${C.text2}` : 'none',
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* reset */}
          <button onClick={reset} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%',
            padding: '11px', background: 'none', border: 'none', borderTop: `1px solid ${C.hair}`,
            cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: C.text2, fontFamily: 'inherit',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.5 15"/></svg>
            Reset to default
          </button>
        </div>
      </div>

      {/* Log out */}
      <button onClick={onLogout} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
        marginTop: 6, padding: '12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 14, fontWeight: 700, color: C.danger, background: C.dangerBg,
        border: `1px solid ${C.dangerBorder}`,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>
        Log out
      </button>
    </div>
  )
}

export default ProfilePanel
