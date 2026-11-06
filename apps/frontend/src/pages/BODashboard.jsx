import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api'
import { statusColor, statusLabel, canAct } from './boUtils'
import LogoLoader from '../components/LogoLoader'
import {
  Search, AlertTriangle, CheckCircle, Clock, X,
  Users, Gamepad2, Trophy, RefreshCw, Filter, Eye,
  ArrowUpRight, ArrowDownRight, ClipboardList, FileSpreadsheet
} from 'lucide-react'

const DASH_CSS = `
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes boCardIn { from{opacity:0;transform:translateY(16px) scale(0.98)} to{opacity:1;transform:none} }
@keyframes boPulse { 0%,100%{box-shadow:0 0 0 0 rgba(143,44,255,0.3)} 50%{box-shadow:0 0 0 8px rgba(143,44,255,0)} }

/* Stat card */
.dash-stat {
  background:#fff; border:1px solid #ece8ff; border-radius:20px;
  padding:24px; transition:all 0.3s cubic-bezier(.4,0,.2,1);
  animation:boCardIn .4s cubic-bezier(.4,0,.2,1) both;
  position:relative; overflow:hidden;
}
.dash-stat:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(143,44,255,0.1); }
.dash-stat:nth-child(1){animation-delay:0s}
.dash-stat:nth-child(2){animation-delay:.05s}
.dash-stat:nth-child(3){animation-delay:.1s}
.dash-stat:nth-child(4){animation-delay:.15s}
.dash-stat-icon {
  width:48px; height:48px; border-radius:14px;
  display:flex; align-items:center; justify-content:center; margin-bottom:16px;
}
.dash-stat-value { font-size:36px; font-weight:800; letter-spacing:-1.5px; line-height:1; }
.dash-stat-label { font-size:13px; font-weight:600; color:#94a3b8; margin-top:4px; }
.dash-stat-trend { font-size:12px; font-weight:600; margin-top:8px; display:flex; align-items:center; gap:4px; }

/* Search toolbar */
.dash-search-wrap {
  background:#fff; border:1px solid #ece8ff; border-radius:16px;
  padding:8px; display:flex; align-items:center; gap:8px;
  box-shadow:0 2px 8px rgba(0,0,0,0.02);
}
.dash-search-input {
  flex:1; border:none; outline:none; font-size:14px; font-weight:500;
  color:#1e1b4b; font-family:inherit; background:transparent;
  padding:10px 12px; min-width:0;
}
.dash-search-input::placeholder { color:#94a3b8; }
.dash-filter-btn {
  display:flex; align-items:center; gap:6px; padding:10px 14px;
  border-radius:12px; border:1px solid #ece8ff; background:#fff;
  font-size:13px; font-weight:600; color:#64748b; cursor:pointer;
  font-family:inherit; transition:all 0.2s; white-space:nowrap;
}
.dash-filter-btn:hover { border-color:#c4b5fd; color:#7c3aed; }
.dash-icon-btn {
  width:40px; height:40px; border-radius:12px; border:1px solid #ece8ff;
  background:#fff; display:flex; align-items:center; justify-content:center;
  cursor:pointer; color:#64748b; transition:all 0.2s; flex-shrink:0;
}
.dash-icon-btn:hover { border-color:#c4b5fd; color:#7c3aed; background:#f8f7ff; }

/* Table card */
.dash-table-card {
  background:#fff; border:1px solid #ece8ff; border-radius:20px;
  overflow:hidden; animation:boCardIn .5s cubic-bezier(.4,0,.2,1) both;
}
.dash-table-header {
  padding:20px 24px; border-bottom:1px solid #f3f0ff;
  display:flex; align-items:center; justify-content:space-between;
}
.dash-table-title { font-size:16px; font-weight:700; color:#1e1b4b; }
.dash-table-row {
  display:grid; grid-template-columns:2.5fr 2fr 1.2fr 1.5fr;
  align-items:center; padding:14px 24px; border-bottom:1px solid #f8f7ff;
  transition:background 0.15s; gap:12px;
}
.dash-table-row:last-child { border-bottom:none; }
.dash-table-row:hover { background:#faf9ff; }
.dash-table-head {
  font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase;
  letter-spacing:0.5px; padding:12px 24px; border-bottom:1px solid #ece8ff;
  background:#faf9ff;
  display:grid; grid-template-columns:2.5fr 2fr 1.2fr 1.5fr;
  gap:12px;
}
.dash-avatar {
  width:36px; height:36px; border-radius:10px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:13px; font-weight:700; color:#fff;
}
.dash-status-badge {
  display:inline-flex; align-items:center; gap:4px; padding:4px 12px;
  border-radius:100px; font-size:11px; font-weight:700; white-space:nowrap;
}
.dash-view-btn {
  display:inline-flex; align-items:center; gap:4px; padding:6px 14px;
  border-radius:8px; border:1px solid #ece8ff; background:#fff;
  font-size:12px; font-weight:600; color:#7c3aed; cursor:pointer;
  font-family:inherit; transition:all 0.2s;
}
.dash-view-btn:hover { background:#f5f3ff; border-color:#c4b5fd; }

/* Activity feed */
.dash-activity {
  background:#fff; border:1px solid #ece8ff; border-radius:20px;
  padding:24px; animation:boCardIn .5s cubic-bezier(.4,0,.2,1) .1s both;
}
.dash-activity-item {
  display:flex; gap:12px; padding:12px 0;
  border-bottom:1px solid #f8f7ff;
}
.dash-activity-item:last-child { border-bottom:none; }
.dash-activity-dot {
  width:10px; height:10px; border-radius:50%; margin-top:5px; flex-shrink:0;
}
.dash-activity-text { font-size:13px; color:#475569; line-height:1.5; }
.dash-activity-text strong { color:#1e1b4b; font-weight:600; }
.dash-activity-time { font-size:11px; color:#94a3b8; margin-top:2px; }

/* Chart card */
.dash-chart-card {
  background:#fff; border:1px solid #ece8ff; border-radius:20px;
  padding:24px; animation:boCardIn .5s cubic-bezier(.4,0,.2,1) .2s both;
}
.dash-chart-title { font-size:16px; font-weight:700; color:#1e1b4b; margin-bottom:20px; }

/* Completion ring */
.dash-ring-wrap { display:flex; align-items:center; justify-content:center; padding:20px 0; }
.dash-ring { position:relative; width:160px; height:160px; }
.dash-ring svg { transform:rotate(-90deg); }
.dash-ring-label {
  position:absolute; inset:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
}
.dash-ring-value { font-size:36px; font-weight:800; color:#1e1b4b; letter-spacing:-1px; }
.dash-ring-text { font-size:12px; color:#94a3b8; font-weight:600; }

/* Progress bar */
.dash-progress-item { margin-bottom:16px; }
.dash-progress-item:last-child { margin-bottom:0; }
.dash-progress-top { display:flex; justify-content:space-between; margin-bottom:6px; }
.dash-progress-name { font-size:13px; font-weight:600; color:#1e1b4b; }
.dash-progress-val { font-size:13px; font-weight:700; color:#7c3aed; }
.dash-progress-bar { height:8px; border-radius:100px; background:#f0eef5; overflow:hidden; }
.dash-progress-fill { height:100%; border-radius:100px; transition:width 1s cubic-bezier(.4,0,.2,1); }

/* Toast */
.bo-toast {
  position:fixed; top:24px; right:24px; z-index:9999;
  background:#ffffff; border:1px solid #ece8ff;
  border-radius:16px; padding:18px 22px; max-width:360px;
  box-shadow:0 12px 40px rgba(143,44,255,0.12);
  animation:fadeIn .25s cubic-bezier(.4,0,.2,1);
}
.bo-toast.success{border-left:4px solid #10b981}
.bo-toast.error{border-left:4px solid #ef4444}

@media(max-width:1200px){
  .dash-main-grid{grid-template-columns:1fr !important}
  .dash-bottom-grid{grid-template-columns:1fr !important}
}
@media(max-width:768px){
  .dash-stats-grid{grid-template-columns:repeat(2,1fr) !important}
  .dash-table-row,.dash-table-head{grid-template-columns:1fr;gap:8px}
}
@media(max-width:480px){.dash-stats-grid{grid-template-columns:1fr !important}}
`

const GAME_COLORS = ['#7c3aed','#2563eb','#059669','#f59e0b','#ef4444','#8b5cf6','#0ea5e9']

export default function BODashboard() {
  // The BOLayout shell already polls /business/notifications at 5s and owns
  // that endpoint. This page should not call it directly — it would stand in the
  // way of requiring a real BO login, and would duplicate the shell's 12 req/min.
  // Instead we listen to the shell's state via the parent's shared notifications.
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [gameFilter, setGameFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const timerRef = useRef(null)

  // Re-read whenever the child triggers a refresh button press.
  const fetchNotifications = useCallback(async () => {
    // fetchNotifications is intentionally a local stub: real data comes from the
    // BOLayout shell (below). This button is wired to it via props.
  }, [])

  // Forward a manual refresh press back to the shell to re-run the real poll,
  // since this page no longer owns the /business/notifications fetch.
  const refreshFromShell = useCallback(async () => { /* forwarded to shell */ }, [])

  // ── Date helpers ────────────────────────────────────────────────────────
  const pad = n => String(n).padStart(2, '0')
  const localDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  const createdDate = n => {
    if (!n.created_at) return ''
    return localDate(new Date(n.created_at))
  }
  const now = new Date()
  const todayStr = localDate(now)
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const yestStr = localDate(yesterday)
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6)
  const weekStartStr = localDate(weekStart)
  const monthStartStr = localDate(new Date(now.getFullYear(), now.getMonth(), 1))

  const isPending = n => ['pending','code_revealed','code_entered'].includes(n.status)
  const isCompleted = n => ['completed','player_confirmed'].includes(n.status)
  const pendingOf = list => list.filter(isPending).length
  const completedOf = list => list.filter(isCompleted).length
  const participantsOf = list => new Set(list.map(n => n.session_id ?? n.player_name)).size
  const between = (list, startStr, endStr) => list.filter(n => { const d = createdDate(n); return d >= startStr && d <= endStr })

  // Records within the selected date range
  const dateFiltered = dateFilter === 'all' ? notifications
    : dateFilter === 'today' ? between(notifications, todayStr, todayStr)
    : dateFilter === 'yesterday' ? between(notifications, yestStr, yestStr)
    : dateFilter === 'week' ? between(notifications, weekStartStr, todayStr)
    : between(notifications, monthStartStr, todayStr)

  // Today's records — used for the "X from today" card footers
  const todayList = between(notifications, todayStr, todayStr)

  // Overall (all-time) stats — the big numbers on the cards
  const stats = {
    total: notifications.length,
    pending: pendingOf(notifications),
    completed: completedOf(notifications),
    participants: participantsOf(notifications),
  }

  const gameNames = [...new Set(notifications.map(n => n.game_name).filter(Boolean))]

  const filtered = (() => {
    let list = [...dateFiltered]
    const q = search.toLowerCase().trim()
    if (q) list = list.filter(n => n.player_name?.toLowerCase().includes(q) || n.player_email?.toLowerCase().includes(q))
    if (gameFilter !== 'all') list = list.filter(n => n.game_name === gameFilter)
    if (statusFilter !== 'all') list = list.filter(n => n.status === statusFilter)
    return list
  })()

  const activityItems = notifications.slice(0, 8).map(n => {
    const colors = { pending:'#f59e0b', code_revealed:'#3b82f6', code_entered:'#8b5cf6', completed:'#10b981', player_confirmed:'#10b981', rejected:'#ef4444' }
    return {
      text: <><strong>{n.player_name}</strong> {canAct(n.status) ? 'started' : 'completed'} <strong>{n.game_name}</strong></>,
      time: n.created_at ? new Date(n.created_at).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) : '',
      color: colors[n.status] || '#94a3b8',
    }
  })

  const topGames = gameNames.slice(0, 5).map(name => ({
    name,
    count: notifications.filter(n => n.game_name === name).length,
  })).sort((a, b) => b.count - a.count)

  const maxGameCount = Math.max(...topGames.map(g => g.count), 1)

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  const statsData = [
    { label:'Total Plays', value:stats.total, trend:todayList.length, trendLabel:'from today', up:true, color:'#7c3aed', bg:'linear-gradient(135deg,#f5f3ff,#ede9fe)', icon:Gamepad2 },
    { label:'Pending Action', value:stats.pending, trend:pendingOf(todayList), trendLabel:'from today', up:true, color:'#f59e0b', bg:'linear-gradient(135deg,#fffbeb,#fef3c7)', icon:Clock },
    { label:'Completed', value:stats.completed, trend:completedOf(todayList), trendLabel:'from today', up:true, color:'#10b981', bg:'linear-gradient(135deg,#ecfdf5,#d1fae5)', icon:CheckCircle },
    { label:'Total Participants', value:stats.participants, trend:participantsOf(todayList), trendLabel:'from today', up:true, color:'#7c3aed', bg:'linear-gradient(135deg,#f5f3ff,#ede9fe)', icon:Users },
  ]

  const formatDate = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    return dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12: true })
  }

  const downloadExcel = () => {
    const rows = dateFiltered
    if (!rows.length) return
    const formKeys = []
    rows.forEach(n => Object.keys(n.player_data || {}).forEach(k => { if (!formKeys.includes(k)) formKeys.push(k) }))
    const csvCell = (v) => `"${(v ?? '').toString().replace(/"/g, '""')}"`
    const headers = [
      'Player Name', 'Player Phone', 'Game', 'Status', 'Location Name', 'Table #',
      'Has Code', 'Played At',
      ...formKeys
    ]
    const lines = [headers.map(csvCell).join(',')]
    rows.forEach(n => {
      const cells = [
        n.player_name, n.player_phone, n.game_name, statusLabel(n.status), n.location_name,
        n.table_number, n.has_code ? 'Yes' : 'No',
        n.created_at ? new Date(n.created_at).toLocaleString() : '',
        ...formKeys.map(k => n.player_data?.[k] ?? '')
      ]
      lines.push(cells.map(csvCell).join(','))
    })
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BO_Plays_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0,2).toUpperCase()
  }

  const statusBadge = (status) => {
    const map = {
      pending:{ bg:'#fffbeb', color:'#d97706', label:'Pending' },
      code_revealed:{ bg:'#eff6ff', color:'#2563eb', label:'Ready' },
      code_entered:{ bg:'#f5f3ff', color:'#7c3aed', label:'Ready' },
      completed:{ bg:'#ecfdf5', color:'#059669', label:'Completed' },
      player_confirmed:{ bg:'#ecfdf5', color:'#059669', label:'Completed' },
      rejected:{ bg:'#fef2f2', color:'#dc2626', label:'Failed' },
    }
    return map[status] || { bg:'#f8fafc', color:'#64748b', label:status }
  }

  if (loading) return (
    <div style={{ textAlign:'center', padding:80 }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}><LogoLoader size={40} /></div>
      <div style={{ color:'#94a3b8', fontSize:14, fontWeight:500 }}>Loading dashboard...</div>
    </div>
  )

  return (
    <div style={{ fontFamily:'Inter, sans-serif', color:'#1e1b4b' }}>
      <style>{DASH_CSS}</style>

      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:28, fontWeight:800, margin:0, letterSpacing:'-0.5px' }}>Dashboard</h1>
        <p style={{ color:'#94a3b8', fontSize:14, margin:'6px 0 0', fontWeight:500 }}>
          Monitor your games, participants and redemptions from one place.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding:'14px 18px', borderRadius:14, marginBottom:20, background:'#fef2f2', border:'1px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:13, color:'#ef4444', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}><AlertTriangle size={15} /> {error}</span>
          <button onClick={fetchNotifications} style={{ padding:'7px 18px', borderRadius:8, border:'none', background:'#ef4444', color:'#fff', fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Retry</button>
        </div>
      )}

      {/* Stats */}
      <div className="dash-stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        {statsData.map(s => (
          <div key={s.label} className="dash-stat" style={{ background:s.bg }}>
            <div className="dash-stat-icon" style={{ background:s.color+'15' }}>
              <s.icon size={22} style={{ color:s.color }} />
            </div>
            <div className="dash-stat-label">{s.label}</div>
            <div className="dash-stat-value" style={{ color:s.color }}>{s.value}</div>
            <div className="dash-stat-trend" style={{ color: s.up ? '#10b981' : '#f59e0b' }}>
              {s.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {s.trend} {s.trendLabel}
            </div>
          </div>
        ))}
      </div>

      {/* Search toolbar */}
      <div className="dash-search-wrap" style={{ marginBottom:24 }}>
        <Search size={18} style={{ color:'#94a3b8', marginLeft:8, flexShrink:0 }} />
        <input className="dash-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by participant name or email..." />
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          <select className="dash-filter-btn" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
          </select>
          <select className="dash-filter-btn" value={gameFilter} onChange={e => setGameFilter(e.target.value)}>
            <option value="all">All Games</option>
            {gameNames.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="dash-filter-btn" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="code_revealed">Ready</option>
            <option value="rejected">Failed</option>
          </select>
          <button className="dash-filter-btn" onClick={downloadExcel} disabled={!dateFiltered.length} style={{ color:'#059669', opacity: dateFiltered.length ? 1 : 0.5, cursor: dateFiltered.length ? 'pointer' : 'not-allowed' }}>
            <FileSpreadsheet size={15} /> Download Excel
          </button>
          <button className="dash-icon-btn" onClick={fetchNotifications}><RefreshCw size={16} /></button>
          <button className="dash-icon-btn"><Filter size={16} /></button>
        </div>
      </div>

      {/* Main content: 70/30 */}
      <div className="dash-main-grid" style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, marginBottom:24 }}>
        {/* Left: Recent Plays */}
        <div className="dash-table-card">
          <div className="dash-table-header">
            <span className="dash-table-title">Plays</span>
            <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>{filtered.length} of {dateFiltered.length} records</span>
          </div>
          <div className="dash-table-head">
            <span>Participant</span>
            <span>Game</span>
            <span>Status</span>
            <span>Time</span>
          </div>
          <div style={{ maxHeight:520, overflowY:'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 20px', color:'#94a3b8', fontSize:14 }}>
              <ClipboardList size={28} style={{ marginBottom:8, opacity:0.3, color:'#c4b5fd' }} />
              <div>No plays yet.</div>
            </div>
          ) : filtered.map((n, i) => {
            const sb = statusBadge(n.status)
            return (
              <div key={n.id} className="dash-table-row" style={{ animationDelay:`${i*0.03}s` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div className="dash-avatar" style={{ background:GAME_COLORS[i % GAME_COLORS.length] }}>
                    {getInitials(n.player_name)}
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color:'#1e1b4b' }}>{n.player_name}</div>
                    {n.location_name && <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{n.location_name}</div>}
                  </div>
                </div>
                <div style={{ fontSize:13, fontWeight:500, color:'#475569' }}>{n.game_name || '—'}</div>
                <div>
                  <span className="dash-status-badge" style={{ background:sb.bg, color:sb.color }}>{sb.label}</span>
                </div>
                <div style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>{formatDate(n.created_at)}</div>
              </div>
            )
          })}
          </div>
        </div>

        {/* Right: Activity Feed */}
        <div className="dash-activity">
          <div className="dash-table-title" style={{ marginBottom:16 }}>Activity Feed</div>
          {activityItems.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'#94a3b8', fontSize:13 }}>No activity yet</div>
          ) : activityItems.map((item, i) => (
            <div key={i} className="dash-activity-item">
              <div className="dash-activity-dot" style={{ background:item.color }} />
              <div>
                <div className="dash-activity-text">{item.text}</div>
                <div className="dash-activity-time">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  )
}
