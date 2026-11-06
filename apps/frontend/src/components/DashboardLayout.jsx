import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../pages/ThemeContext'
import NotificationBell from './NotificationBell'
import ProfilePanel from './ProfilePanel'
// ThemeColorPicker no longer used here (moved into ProfilePanel)

/* ═══════════════════════════════════════════════════════════════
   NAV STYLES ─ light, clean, 3-column
   ═══════════════════════════════════════════════════════════════ */
const NAV_CSS = `
@keyframes nav-fade-down {
  from { opacity:0; transform:translateY(-8px) }
  to   { opacity:1; transform:none }
}
@keyframes nav-spin { to { transform:rotate(360deg) } }
@keyframes nav-slide-in { from { transform:translateX(-100%) } to { transform:translateX(0) } }
@keyframes nav-fade-in { from { opacity:0 } to { opacity:1 } }

.nav-root {
  background: var(--surface);
  border-bottom: 1.5px solid var(--border);
  height: 62px;
  padding: 0 28px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 200;
  box-shadow: 0 1px 12px rgba(0,0,0,0.06);
  font-family: 'DM Sans', 'Inter', sans-serif;
}

/* ── left: logo ── */
.nav-logo {
  display: flex;
  align-items: center;
  gap: 0;
  text-decoration: none;
}
.nav-logo img {
  height: 38px;
  width: auto;
  display: block;
}

/* ── center: links ── */
.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 12px;
  padding: 4px;
}
.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 0px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
  text-decoration: none;
  transition: all .15s;
  white-space: nowrap;
  border: none;
}
.nav-link:hover {
  color: var(--text);
  background: transparent;
  border-color: none;
}
.nav-link.active {
  color: var(--primary);
  background: transparent;
  border-color: none;
  border-radius: 12px;
  box-shadow: 0 5px 26px rgba(88, 19, 140, 0.47);
}

/* ── right: greeting + avatar ── */
.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
}
.nav-greeting {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.3;
}
.nav-greeting-msg {
  font-size: 11px;
  color: var(--primary);
  font-weight: 500;
}
.nav-greeting-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

/* ── avatar button ── */
.nav-avatar-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
  flex-shrink: 0;
  font-family: inherit;
}
.nav-avatar-btn:hover {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.18);
  transform: scale(1.05);
}

/* ── dropdown ── */
.nav-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 360px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.12);
  animation: nav-fade-down .18s ease;
  overflow: hidden;
  z-index: 300;
}

/* dropdown sections */
.nav-dd-header {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.nav-dd-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  background: rgba(255,255,255,0.25);
  color: #fff; font-size: 18px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; border: 2px solid rgba(255,255,255,0.4);
}
.nav-dd-name  { font-size: 15px; font-weight: 700; color: #fff; }
.nav-dd-email { font-size: 12px; color: rgba(255,255,255,0.75); margin-top: 1px; }
.nav-dd-role  { display:inline-flex; align-items:center; padding:2px 8px; background:rgba(255,255,255,0.2); border-radius:20px; font-size:10px; font-weight:700; color:#fff; margin-top:4px; letter-spacing:.04em; text-transform:uppercase; }

.nav-dd-body  { padding: 12px; }
.nav-dd-sep   { height: 1px; background: var(--border-light); margin: 8px 0; }

.nav-dd-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px; cursor: pointer;
  font-size: 13px; font-weight: 600; color: var(--text);
  transition: background .12s;
  border: none; background: none; width: 100%; text-align: left;
  font-family: inherit;
}
.nav-dd-item:hover { background: var(--surface2); color: var(--primary); }
.nav-dd-item.danger:hover { background: var(--error-bg); color: var(--error); }
.nav-dd-icon { font-size: 16px; width: 28px; height: 28px; display:flex; align-items:center; justify-content:center; background:var(--surface2); border-radius:8px; flex-shrink:0; }
.nav-dd-item.danger .nav-dd-icon { background: var(--error-bg); }

/* ── calendar panel ── */
.nav-cal {
  padding: 0 12px 12px;
}
.nav-cal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 4px 8px; font-size: 13px; font-weight: 700; color: var(--text);
}
.nav-cal-nav {
  background: none; border: 1px solid var(--border); border-radius: 6px;
  width: 26px; height: 26px; cursor: pointer; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  color: var(--text2); transition: all .12s;
}
.nav-cal-nav:hover { background: var(--surface2); color: var(--primary); border-color: #c7d2fe; }
.nav-cal-grid {
  display: grid; grid-template-columns: repeat(7,1fr); gap: 2px;
}
.nav-cal-dow {
  text-align: center; font-size: 10px; font-weight: 700;
  color: var(--text3); padding: 4px 0; letter-spacing:.04em;
}
.nav-cal-day {
  text-align: center; font-size: 12px; font-weight: 500;
  padding: 5px 2px; border-radius: 6px; cursor: default;
  color: var(--text); line-height: 1;
}
.nav-cal-day.today {
  background: #6366f1; color: #fff; font-weight: 800;
  box-shadow: 0 2px 6px rgba(99,102,241,0.3);
}
.nav-cal-day.other-month { color: var(--text3); }
.nav-cal-day.weekend { color: #a855f7; }
.nav-cal-day.today.weekend { color: #fff; }

/* ── password form ── */
.nav-pw-form { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; }
.nav-pw-input {
  width: 100%; padding: 9px 12px; border: 1.5px solid var(--border);
  border-radius: 8px; font-size: 13px; font-family: inherit;
  color: var(--text); background: var(--surface2); outline: none;
  transition: border-color .14s;
}
.nav-pw-input:focus { border-color: #6366f1; background: var(--surface); }
.nav-pw-btn {
  padding: 9px; border-radius: 8px; border: none; cursor: pointer;
  font-size: 13px; font-weight: 700; font-family: inherit;
  background: #6366f1; color: #fff; transition: background .14s;
}
.nav-pw-btn:hover:not(:disabled) { background: #4f46e5; }
.nav-pw-btn:disabled { opacity:.5; cursor:not-allowed; }
.nav-pw-msg { font-size: 12px; font-weight: 600; padding: 6px 10px; border-radius: 7px; }
.nav-pw-msg.ok  { background: var(--success-bg); color: var(--success); }
.nav-pw-msg.err { background: var(--error-bg); color: var(--error); }

/* ── quick stat chips ── */
.nav-stats { display:flex; gap:6px; padding: 0 12px 12px; }
.nav-stat { flex:1; background:var(--surface2); border-radius:10px; padding:10px 8px; text-align:center; }
.nav-stat-val { font-size:16px; font-weight:800; color:#6366f1; }
.nav-stat-lbl { font-size:10px; color:var(--text3); font-weight:600; text-transform:uppercase; letter-spacing:.04em; margin-top:2px; }

/* ── mobile hamburger + drawer ── */
.nav-hamburger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1.5px solid var(--border);
  background: var(--surface2);
  color: var(--text);
  cursor: pointer;
}
.nav-hamburger svg { width: 22px; height: 22px; }
.nav-mobile-drawer-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 250;
  animation: nav-fade-in .2s ease;
}
.nav-mobile-drawer {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 85%;
  max-width: 320px;
  background: var(--surface);
  border-right: 1.5px solid var(--border);
  z-index: 260;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  animation: nav-slide-in .25s ease;
  flex-direction: column;
}
.nav-mobile-drawer.open { display: flex; }
.nav-mobile-drawer-backdrop.open { display: block; }
.nav-mobile-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
}
.nav-mobile-drawer-close {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-mobile-drawer-links {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nav-mobile-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  color: var(--text2);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}
.nav-mobile-link:hover { background: var(--surface2); color: var(--text); }
.nav-mobile-link.active {
  background: linear-gradient(90deg, rgba(99,102,241,0.12) 0%, transparent 100%);
  color: var(--primary);
}

@media (max-width: 768px) {
  .nav-root { grid-template-columns: auto 1fr auto; padding: 0 12px; height: 56px; }
  .nav-hamburger { display: flex; }
  .nav-links { display: none; }
  .nav-greeting { display: none; }
  .nav-dropdown { width: 90vw !important; max-width: 360px; }
}
`

const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_SHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠', exact: true },
  { to: '/dashboard/clients', label: 'Clients', icon: '🏢' },
  { to: '/dashboard/games', label: 'Games', icon: '🎮' },
  { to: '/dashboard/thumbnails', label: 'Thumbnail', icon: '🖼️' },
  { to: '/dashboard/crm', label: 'Team', icon: '👥' },
  { to: '/dashboard/players', label: 'Players', icon: '🎯' },
  { to: '/dashboard/status', label: 'Status', icon: '📊' },
  { to: '/dashboard/bo-logs', label: 'BO Logs', icon: '🧾' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { msg: 'Good morning', emoji: '☀️' }
  if (h < 17) return { msg: 'Good afternoon', emoji: '🌤️' }
  if (h < 21) return { msg: 'Good evening', emoji: '🌆' }
  return { msg: 'Good night', emoji: '🌙' }
}

function initials(name = '') {
  return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'
}

function MiniCalendar() {
  const today = new Date()
  const [cal, setCal] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const prevMonth = () => setCal(c => c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 })
  const nextMonth = () => setCal(c => c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 })
  const firstDow = new Date(cal.y, cal.m, 1).getDay()
  const daysInMonth = new Date(cal.y, cal.m + 1, 0).getDate()
  const daysInPrev = new Date(cal.y, cal.m, 0).getDate()
  const cells = []
  for (let i = firstDow - 1; i >= 0; i--) cells.push({ d: daysInPrev - i, cur: false })
  for (let i = 1; i <= daysInMonth; i++) cells.push({ d: i, cur: true })
  const fill = 42 - cells.length
  for (let i = 1; i <= fill; i++) cells.push({ d: i, cur: false })
  return (
    <div className="nav-cal">
      <div className="nav-cal-header">
        <button className="nav-cal-nav" onClick={prevMonth}>‹</button>
        <span>{MONTHS_FULL[cal.m]} {cal.y}</span>
        <button className="nav-cal-nav" onClick={nextMonth}>›</button>
      </div>
      <div className="nav-cal-grid">
        {DAYS_SHORT.map(d => <div key={d} className="nav-cal-dow">{d}</div>)}
        {cells.map((c, i) => {
          const todayCell = c.cur && c.d === today.getDate() && cal.m === today.getMonth() && cal.y === today.getFullYear()
          const dow = i % 7
          const weekend = dow === 0 || dow === 6
          return <div key={i} className={`nav-cal-day${todayCell ? ' today' : ''}${c.cur ? '' : ' other-month'}${weekend && !todayCell ? ' weekend' : ''}`}>{c.d}</div>
        })}
      </div>
    </div>
  )
}

function ChangePasswordForm({ onClose }) {
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const submit = async () => {
    if (!oldPw || !newPw || !confirmPw) { setMsg({ text: 'All fields required', ok: false }); return }
    if (newPw !== confirmPw) { setMsg({ text: 'New passwords do not match', ok: false }); return }
    if (newPw.length < 6) { setMsg({ text: 'Password must be at least 6 characters', ok: false }); return }
    setSaving(true)
    setMsg(null)
    try {
      await api.post('/auth/change-password', { oldPassword: oldPw, newPassword: newPw })
      setMsg({ text: 'Password changed successfully ✅', ok: true })
      setOldPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(onClose, 1800)
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Failed to change password', ok: false })
    }
    setSaving(false)
  }

  return (
    <div className="nav-pw-form">
      <div style={{ position: 'relative' }}>
        <input className="nav-pw-input" type={showOld ? 'text' : 'password'} placeholder="Current password" value={oldPw} onChange={e => setOldPw(e.target.value)} />
        <span onClick={() => setShowOld(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: 14, color: 'var(--text3)' }}>{showOld ? '🙈' : '👁'}</span>
      </div>
      <div style={{ position: 'relative' }}>
        <input className="nav-pw-input" type={showNew ? 'text' : 'password'} placeholder="New password (min 6 chars)" value={newPw} onChange={e => setNewPw(e.target.value)} />
        <span onClick={() => setShowNew(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: 14, color: 'var(--text3)' }}>{showNew ? '🙈' : '👁'}</span>
      </div>
      <input className="nav-pw-input" type="password" placeholder="Confirm new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
      {msg && <div className={`nav-pw-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="nav-pw-btn" onClick={submit} disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving…' : '🔐 Update Password'}</button>
        <button className="nav-pw-btn" onClick={onClose} style={{ background: 'var(--surface2)', color: 'var(--text2)', flex: '0 0 auto', padding: '9px 14px' }}>Cancel</button>
      </div>
    </div>
  )
}

function AvatarDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const { isDark, toggleTheme } = useTheme()
  useEffect(() => {
    const fn = e => { ref.current && !ref.current.contains(e.target) && setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="nav-avatar-btn" onClick={() => setOpen(v => !v)} title="Account menu">
        {initials(user?.name)}
      </button>
      {open && (
        <div className="nav-dropdown" style={{ width: 400, background: 'var(--surface)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--border)' }}>
          <ProfilePanel user={user} onLogout={onLogout} isDark={isDark} toggleTheme={toggleTheme} MiniCalendar={MiniCalendar} ChangePasswordForm={ChangePasswordForm} />
        </div>
      )}
    </div>
  )
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [greeting, setGreeting] = useState(getGreeting())
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setGreeting(getGreeting()), 60000)
    return () => clearInterval(t)
  }, [])

  // Close the mobile drawer on navigation
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = link => link.exact ? location.pathname === link.to : location.pathname.startsWith(link.to)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', transition: 'var(--transition)' }}>
      <style>{NAV_CSS}</style>
      <nav className="nav-root">
        {/* Left: hamburger (mobile) + logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="nav-hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <Link to="/dashboard" className="nav-logo">
            <img src={isDark ? '/favicon2.png' : '/favicon3.png'} alt="PromoGames" />
          </Link>
        </div>

        {/* Center: links */}
        <div className="nav-links">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className={`nav-link${isActive(link) ? ' active' : ''}`}>
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right: greeting + avatar + bell */}
        <div className="nav-right">
          <div className="nav-greeting">
            <span className="nav-greeting-msg">{greeting.emoji} {greeting.msg}</span>
            <span className="nav-greeting-name">{user?.name?.split(' ')[0] || 'there'}!</span>
          </div>
          <AvatarDropdown user={user} onLogout={handleLogout} />
          <NotificationBell />
        </div>
      </nav>

      {mobileOpen && (
        <>
          <div className="nav-mobile-drawer-backdrop open" onClick={() => setMobileOpen(false)} />
          <aside className="nav-mobile-drawer open">
            <div className="nav-mobile-drawer-header">
              <Link to="/dashboard" className="nav-logo" onClick={() => setMobileOpen(false)}>
                <img src={isDark ? '/favicon2.png' : '/favicon3.png'} alt="PromoGames" />
              </Link>
              <button className="nav-mobile-drawer-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="nav-mobile-drawer-links">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to} className={`nav-mobile-link${isActive(link) ? ' active' : ''}`} onClick={() => setMobileOpen(false)}>
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </aside>
        </>
      )}

      {/* Page content */}
      <Outlet />
    </div>
  )
}
