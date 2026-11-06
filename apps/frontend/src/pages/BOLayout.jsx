import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Gamepad2, Trophy, LogOut, Menu, X, Volume2, VolumeX, Eye } from 'lucide-react'
import api from '../api'

const BO_LAYOUT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
@keyframes boFadeDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:none } }
@keyframes boSlideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
@keyframes boPulse { 0%,100%{box-shadow:0 0 0 0 rgba(146,16,246,0.4)} 50%{box-shadow:0 0 0 12px rgba(146,16,246,0)} }
@keyframes boShake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
.bo-layout { display: flex; min-height: 100vh; background: #f8f7ff; }

/* ── Sidebar ── */
.bo-sidebar {
  width: 260px; flex-shrink: 0;
  background: linear-gradient(180deg, #0f0a1e 0%, #0a0614 30%, #07040f 70%, #05030b 100%);
  display: flex; flex-direction: column;
  position: fixed; top: 0; left: 0; bottom: 0; z-index: 200;
  transition: transform 0.3s cubic-bezier(.4,0,.2,1);
}
.bo-sidebar-logo { padding: 24px 24px 0; display: flex; align-items: center; gap: 10px; }
.bo-sidebar-logo-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(146,16,246,0.2);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 16px; font-weight: 900;
  border: 1px solid rgba(146,16,246,0.3);
}
.bo-sidebar-logo-text { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; }
.bo-sidebar-greeting { padding: 20px 24px 0; font-size: 13px; color: rgba(255,255,255,0.6); font-weight: 500; }
.bo-sidebar-nav { flex: 1; padding: 16px 12px 0; display: flex; flex-direction: column; gap: 4px; }
.bo-sidebar-link {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; border-radius: 12px; font-size: 14px; font-weight: 600;
  color: rgba(255,255,255,0.65); text-decoration: none;
  transition: all 0.2s cubic-bezier(.4,0,.2,1); position: relative;
}
.bo-sidebar-link:hover { background: rgba(146,16,246,0.1); color: #ffffff; }
.bo-sidebar-link.active {
  background: rgba(146,16,246,0.18);
  color: #ffffff; box-shadow: 0 2px 12px rgba(146,16,246,0.15);
  border: 1px solid rgba(146,16,246,0.2);
}
.bo-sidebar-link .badge {
  position:absolute; top:8px; right:12px; min-width:20px; height:20px; border-radius:10px;
  background:#ef4444; color:#fff; font-size:11px; font-weight:700;
  display:flex; align-items:center; justify-content:center; padding:0 6px;
  animation: boPulse 2s ease infinite;
}
.bo-sidebar-promo {
  margin: 12px; padding: 20px; border-radius: 16px;
  background: rgba(146,16,246,0.12);
  color: #fff; position: relative; overflow: hidden;
  border: 1px solid rgba(146,16,246,0.2);
}
.bo-sidebar-promo::before { content:''; position:absolute; top:-20px; right:-20px; width:80px; height:80px; border-radius:50%; background:rgba(146,16,246,0.12); }
.bo-sidebar-promo::after { content:''; position:absolute; bottom:-30px; left:-10px; width:60px; height:60px; border-radius:50%; background:rgba(146,16,246,0.08); }
.bo-sidebar-promo-title { font-size:14px; font-weight:800; line-height:1.3; position:relative; z-index:1; }
.bo-sidebar-promo-sub { font-size:11px; opacity:0.6; margin-top:4px; position:relative; z-index:1; }
.bo-sidebar-promo-mascot { width:56px; height:56px; border-radius:14px; margin:12px auto 0; background:rgba(146,16,246,0.15); display:flex; align-items:center; justify-content:center; font-size:28px; position:relative; z-index:1; border:1px solid rgba(146,16,246,0.2); }
.bo-sidebar-footer { padding:16px 24px; border-top:1px solid rgba(146,16,246,0.15); font-size:11px; color:rgba(255,255,255,0.45); }

/* ── Main ── */
.bo-main { flex:1; margin-left:260px; display:flex; flex-direction:column; min-height:100vh; }

/* ── Toast ── */
.bo-toast {
  position:fixed; top:24px; right:24px; z-index:11000;
  padding:14px 22px; border-radius:14px;
  background:#fff; box-shadow:0 8px 32px rgba(0,0,0,0.12);
  animation:boFadeDown .3s ease;
  border:1px solid #ece8ff;
}

/* ── Force Popup ── */
.bo-force-overlay {
  position:fixed; inset:0; background:rgba(17,24,39,0.6); backdrop-filter:blur(8px);
  z-index:10000; display:flex; align-items:center; justify-content:center;
  animation:boFadeDown .25s ease;
}
.bo-force-card {
  background:#fff; border-radius:24; max-width:440px; width:calc(100% - 32px);
  box-shadow:0 32px 80px rgba(143,44,255,0.35); animation:boSlideUp .3s cubic-bezier(.4,0,.2,1);
  overflow:hidden;
}
.bo-force-header {
  background:linear-gradient(135deg,#9210f6,#6E11D8); padding:20px 24px 16px; position:relative;
}
.bo-force-body { padding:24px; }

/* Mobile hamburger */
.bo-hamburger {
  display:none; position:fixed; top:16px; left:16px; z-index:210;
  width:42px; height:42px; border-radius:12px; border:1px solid #f0eef5;
  background:#fff; align-items:center; justify-content:center; cursor:pointer;
  color:#64748b; transition:all 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.06);
}
.bo-hamburger:hover { border-color:#e0d9f5; color:#9210f6; }
.bo-mobile-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.3); z-index:199; backdrop-filter:blur(2px); }

@media (max-width:1024px) {
  .bo-sidebar { transform:translateX(-100%); }
  .bo-sidebar.open { transform:translateX(0); }
  .bo-main { margin-left:0; }
  .bo-hamburger { display:flex; }
  .bo-mobile-overlay.open { display:block; }
}
`

function playNotifSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    if (!notifCtx.current || notifCtx.current.state === 'closed') notifCtx.current = new Ctx()
    if (notifCtx.current.state === 'suspended') notifCtx.current.resume()
    const ctx = notifCtx.current
    const t = ctx.currentTime
    const playTone = (freq, start, dur) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.4, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start); osc.stop(start + dur + 0.05)
    }
    playTone(880, t, 0.18)
    playTone(1174.66, t + 0.12, 0.25)
  } catch {}
}

export default function BOLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [bo, setBo] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ── Notification polling ──
  const [pendingCount, setPendingCount] = useState(0)
  const [forcePopup, setForcePopup] = useState(null)
  const [forceCountdown, setForceCountdown] = useState(5)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')
  const [acceptMode, setAcceptMode] = useState(null) // null | 'direct' | 'code'
  const [processing, setProcessing] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [toast, setToast] = useState(null)

  const pollRef = useRef(null)
  const forceTimerRef = useRef(null)
  const forceCountdownRef = useRef(null)
  const seenIdsRef = useRef(new Set())
  const lastCountRef = useRef(0)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const closeForcePopup = useCallback(() => {
    setForcePopup(null)
    setForceCountdown(5)
    setCodeInput('')
    setCodeError('')
    setAcceptMode(null)
    setProcessing(false)
    clearInterval(forceCountdownRef.current)
    clearTimeout(forceTimerRef.current)
  }, [])

  const showForcePopup = useCallback((n) => {
    if (!n) return
    if (seenIdsRef.current.has(n.id)) return
    seenIdsRef.current.add(n.id)
    if (soundOn) playNotifSound()
    setForcePopup(n)
    setForceCountdown(5)
    setCodeInput('')
    setCodeError('')
    setAcceptMode(null)
    setProcessing(false)
    let count = 5
    if (
      forceCountdownRef.current && forceCountdownRef.current._started !== undefined
    ) {
      clearInterval(forceCountdownRef.current)
    }
    forceCountdownRef.current = setInterval(() => {
      count -= 1
      setForceCountdown(count)
      if (count <= 0) {
        clearInterval(forceCountdownRef.current)
        forceTimerRef.current = setTimeout(() => closeForcePopup(), 500)
      }
    }, 1000)
  }, [closeForcePopup, soundOn])

  /* Stable referral context so the forced-popup sound effect can be triggered
     from outside the shell's own handler (e.g. when a new redemption arrives while
     the user is on a different tab). Expose nothing public — the shell remains the
     single owner of /business/notifications. */
  const handleAcceptWithCode = async () => {
    if (!forcePopup) return
    setCodeError('')
    setProcessing(true)
    try {
      const payload = { redemption_id: forcePopup.id }
      if (codeInput) payload.code = codeInput
      await api.post('/business/accept-with-code', payload)
      showToast('Redemption accepted!')
      closeForcePopup()
    } catch (err) {
      setCodeError(err.response?.data?.message || 'Invalid code')
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!forcePopup) return
    setProcessing(true)
    try {
      await api.post('/business/reject-redemption', { redemption_id: forcePopup.id })
      showToast('Redemption rejected')
      closeForcePopup()
    } catch { showToast('Failed to reject', 'error') }
    finally { setProcessing(false) }
  }

  const fetchPending = useCallback(async () => {
    try {
      const { data } = await api.get('/business/notifications')
      const list = data.notifications || []
      const pending = list.filter(n => ['pending', 'code_revealed', 'code_entered'].includes(n.status))
      setPendingCount(pending.length)
      // Detect NEW pending items
      if (pending.length > lastCountRef.current && lastCountRef.current >= 0) {
        const newOnes = pending.filter(n => !seenIdsRef.current.has(n.id))
        if (newOnes.length > 0) {
          showForcePopup(newOnes[0])
        }
      }
      lastCountRef.current = pending.length
    } catch {}
  }, [soundOn, showForcePopup])

  useEffect(() => {
    /* Start the notification poll only AFTER the BO auth has resolved (token
       && stored user are present). While auth is pending or missing, the /business/
       endpoint must not be hit — that would mean the notification API fires in every
       place the layout mounts, without a real login.
       We gate on `bo` being non-null, so the first poll runs once inside the auth
       effect below and the 5s loop only starts once `bo` is known. */
    if (bo != null) {
      fetchPending()
      pollRef.current = setInterval(fetchPending, 5000)
    }
    return () => {
      clearInterval(pollRef.current)
      clearInterval(forceCountdownRef.current)
      clearTimeout(forceTimerRef.current)
    }
  }, [bo, fetchPending])

  // ── Auth ──
  // The /business/notifications poll must never start before a real BO login is
  // present. The shell manages auth; this effect reads the stored user + token and
  // only then begins the 5s polling loop. If the user is not logged in (or the
  // auth state is missing), we redirect to /login and the endpoint is never touched.
  useEffect(() => {
    const stored = localStorage.getItem('businessUser')
    const token = localStorage.getItem('businessToken')

    if (!token || !stored) {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
      clearInterval(forceCountdownRef.current)
      clearTimeout(forceTimerRef.current)
      setForcePopup(null)
      setPendingCount(0)
      navigate('/login')
      return
    }
    try {
      setBo(JSON.parse(stored))
      // Auth succeeded — now it's safe to start polling /business/notifications
      // for pending redemptions. This is the single place the endpoint is called.
      fetchPending()
      pollRef.current = setInterval(fetchPending, 5000)
    } catch {
      localStorage.removeItem('businessUser')
      localStorage.removeItem('businessToken')
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
      clearInterval(forceCountdownRef.current)
      clearTimeout(forceTimerRef.current)
      setForcePopup(null)
      setPendingCount(0)
      navigate('/login')
    }
  }, [token, stored])

  const isActive = (path) => location.pathname.startsWith(path)
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  })()

  const isBrandOwner = bo && !bo.parent_id

  const navItems = [
    { to: '/bo/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ...(isBrandOwner ? [{ to: '/bo/my-page', icon: Eye, label: 'Franchise Overview' }] : []),
    { to: '/bo/games', icon: Gamepad2, label: 'My Games' },
    { to: '/bo/redemptions', icon: Trophy, label: 'Redemptions' },
  ]

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase()
  }

  return (
    <div className="bo-layout">
      <style>{BO_LAYOUT_CSS}</style>

      {/* Toast */}
      {toast && <div className="bo-toast"><div style={{ fontWeight:700, fontSize:14, color: toast.type === 'error' ? '#ef4444' : '#1e1b4b' }}>{toast.msg}</div></div>}

      {/* ── Force Popup ── */}
      {forcePopup && (
        <div className="bo-force-overlay" onClick={closeForcePopup}>
          <div className="bo-force-card" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bo-force-header">
              <button onClick={closeForcePopup} style={{ position:'absolute', top:12, right:12, width:32, height:32, borderRadius:10, border:'none', background:'rgba(255,255,255,0.15)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={16} />
              </button>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ color:'#fff', fontSize:20, fontWeight:800 }}>New Player Submission!</div>
                  <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, marginTop:4 }}>Action required within {forceCountdown}s</div>
                </div>
                <button onClick={() => setSoundOn(!soundOn)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', cursor:'pointer', padding:4 }}>
                  {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
              </div>
              {/* Countdown bar */}
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 0 0', marginTop:12 }}>
                <div style={{ flex:1, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${(forceCountdown / 5) * 100}%`, borderRadius:2, background:'linear-gradient(90deg,#c040ff,#fff)', transition:'width 1s linear' }} />
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.8)', minWidth:20, textAlign:'center' }}>{forceCountdown}s</span>
              </div>
            </div>

            {/* Body */}
            <div className="bo-force-body">
              {/* Player info */}
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#7c3aed', fontSize:18, flexShrink:0 }}>
                  {getInitials(forcePopup.player_name)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{forcePopup.player_name}</div>
                  <div style={{ fontSize:12, color:'#94a3b8', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{forcePopup.game_name}</div>
                </div>
              </div>

              {/* Code verification input */}
              {acceptMode === 'code' && (
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#64748b', marginBottom:6 }}>6-digit code (optional)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={codeInput}
                    onChange={e => { setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setCodeError('') }}
                    autoFocus
                    placeholder="000000"
                    style={{
                      width:'100%', padding:'12px 16px', fontSize:20, fontWeight:700, letterSpacing:8,
                      textAlign:'center', border: codeError ? '2px solid #ef4444' : '2px solid #e5e7eb',
                      borderRadius:12, outline:'none', fontFamily:'Inter, monospace', color:'#1e1b4b',
                      background: codeError ? '#fef2f2' : '#f9fafb',
                      animation: codeError ? 'boShake .4s ease' : 'none',
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') handleAcceptWithCode() }}
                  />
                  {codeError && <div style={{ fontSize:12, color:'#ef4444', fontWeight:600, marginTop:6 }}>{codeError}</div>}
                  {!codeError && <div style={{ fontSize:11, color:'#94a3b8', fontWeight:500, marginTop:6 }}>Leave blank to accept without code verification.</div>}
                </div>
              )}

              {/* Buttons */}
              {!acceptMode ? (
                /* Initial state: accept with code or reject */
                <div style={{ display:'flex', gap:10 }}>
                  <button
                    onClick={() => setAcceptMode('code')}
                    style={{ flex:1, padding:13, borderRadius:12, border:'2px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#9210f6'; e.currentTarget.style.color = '#9210f6' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151' }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    style={{ flex:1, padding:13, borderRadius:12, border:'2px solid #fecaca', background:'#fff', color:'#ef4444', fontWeight:700, fontSize:13, cursor: processing ? 'not-allowed' : 'pointer', fontFamily:'inherit', opacity: processing ? 0.6 : 1, transition:'all 0.2s' }}
                  >
                    Reject
                  </button>
                </div>
              ) : (
                /* Accept mode (code optional) */
                <div style={{ display:'flex', gap:10 }}>
                  <button
                    onClick={() => { setAcceptMode(null); setCodeInput(''); setCodeError('') }}
                    style={{ padding:13, borderRadius:12, border:'1px solid #e5e7eb', background:'#fff', color:'#64748b', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleAcceptWithCode}
                    disabled={processing}
                    style={{ flex:1, padding:13, borderRadius:12, border:'none', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontWeight:700, fontSize:13, cursor: processing ? 'not-allowed' : 'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(16,185,129,0.3)', transition:'all 0.2s', opacity: processing ? 0.6 : 1 }}
                  >
                    {processing ? 'Accepting...' : 'Accept'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    style={{ padding:13, borderRadius:12, border:'2px solid #fecaca', background:'#fff', color:'#ef4444', fontWeight:700, fontSize:13, cursor: processing ? 'not-allowed' : 'pointer', fontFamily:'inherit', opacity: processing ? 0.6 : 1, transition:'all 0.2s' }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      <div className={`bo-mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Mobile hamburger */}
      <button className="bo-hamburger" onClick={() => setSidebarOpen(true)}>
        <Menu size={20} />
      </button>

      {/* Sidebar */}
      <aside className={`bo-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="bo-sidebar-logo">
          <div className="bo-sidebar-logo-icon">{(bo?.business_name?.[0] || 'B').toUpperCase()}</div>
          <span className="bo-sidebar-logo-text">{bo?.business_name || 'Business'}</span>
        </div>

        <div className="bo-sidebar-greeting">
          {greeting}, {bo?.business_name?.split(' ')[0] || 'User'} 👋
        </div>

        <nav className="bo-sidebar-nav">
          {navItems.map(item => (
            <Link key={item.to} to={item.to} className={`bo-sidebar-link ${isActive(item.to) ? 'active' : ''}`}>
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.to === '/bo/redemptions' && pendingCount > 0 && (
                <span className="badge">{pendingCount}</span>
              )}
            </Link>
          ))}
        </nav>

        <div style={{ padding:'12px', marginTop:'auto' }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', inset:'20%', background:'rgba(146,16,246,0.35)', borderRadius:'50%', filter:'blur(30px)', zIndex:0 }} />
            <img src="/mascot.webp" alt="PromoGames" style={{ width:'100%', borderRadius:16, display:'block', position:'relative', zIndex:1 }} />
          </div>
        </div>

        <div style={{ padding:'0 12px 16px' }}>
          <button onClick={handleLogout} style={{
            display:'flex', alignItems:'center', gap:10, width:'100%', padding:'12px 16px',
            borderRadius:12, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.08)',
            color:'rgba(255,255,255,0.75)', fontSize:13, fontWeight:600, cursor:'pointer',
            fontFamily:'inherit', transition:'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        <div className="bo-sidebar-footer">
          © 2025 {bo?.business_name || 'Business'}<br/>All rights reserved.
        </div>
      </aside>

      {/* Main */}
      <div className="bo-main">
        <div className="bo-content" style={{ padding:32, animation:'boSlideUp 0.4s cubic-bezier(.4,0,.2,1)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
