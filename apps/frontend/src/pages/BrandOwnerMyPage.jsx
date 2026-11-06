import { useState, useEffect, useCallback } from 'react'
import api from '../api'
import LogoLoader from '../components/LogoLoader'
import {
  Gamepad2, Users, Trophy, Clock, CheckCircle, XCircle,
  TrendingUp, BarChart3, Building2, RefreshCw, Eye, AlertTriangle
} from 'lucide-react'

const MYPAGE_CSS = `
@keyframes mbFadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }

.mb-stat {
  background:#fff; border:1px solid #ece8ff; border-radius:20px;
  padding:24px; transition:all 0.3s cubic-bezier(.4,0,.2,1);
  animation:mbFadeIn .4s cubic-bezier(.4,0,.2,1) both;
  position:relative; overflow:hidden;
}
.mb-stat:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(143,44,255,0.1); }
.mb-stat:nth-child(1){animation-delay:0s}
.mb-stat:nth-child(2){animation-delay:.05s}
.mb-stat:nth-child(3){animation-delay:.1s}
.mb-stat:nth-child(4){animation-delay:.15s}
.mb-stat:nth-child(5){animation-delay:.2s}
.mb-stat:nth-child(6){animation-delay:.25s}
.mb-stat-icon {
  width:48px; height:48px; border-radius:14px;
  display:flex; align-items:center; justify-content:center; margin-bottom:16px;
}
.mb-stat-value { font-size:36px; font-weight:800; letter-spacing:-1.5px; line-height:1; }
.mb-stat-label { font-size:13px; font-weight:600; color:#94a3b8; margin-top:4px; }

.mb-card {
  background:#fff; border:1px solid #ece8ff; border-radius:20px;
  overflow:hidden; animation:mbFadeIn .5s cubic-bezier(.4,0,.2,1) both;
}
.mb-card-header {
  padding:20px 24px; border-bottom:1px solid #f3f0ff;
  display:flex; align-items:center; justify-content:space-between;
}
.mb-card-title { font-size:16px; font-weight:700; color:#1e1b4b; }

.mb-branch-row {
  display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1fr;
  align-items:center; padding:14px 24px; border-bottom:1px solid #f8f7ff;
  transition:background 0.15s; gap:12px;
}
.mb-branch-row:last-child { border-bottom:none; }
.mb-branch-row:hover { background:#faf9ff; }
.mb-branch-head {
  font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase;
  letter-spacing:0.5px; padding:12px 24px; border-bottom:1px solid #ece8ff;
  background:#faf9ff;
  display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1fr;
  gap:12px;
}

.mb-bar-row { margin-bottom:14px; }
.mb-bar-row:last-child { margin-bottom:0; }
.mb-bar-top { display:flex; justify-content:space-between; margin-bottom:6px; }
.mb-bar-name { font-size:13px; font-weight:600; color:#1e1b4b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:200px; }
.mb-bar-val { font-size:13px; font-weight:700; color:#7c3aed; }
.mb-bar-track { height:8px; border-radius:100px; background:#f0eef5; overflow:hidden; }
.mb-bar-fill { height:100%; border-radius:100px; transition:width 1s cubic-bezier(.4,0,.2,1); }

.mb-readonly-badge {
  display:inline-flex; align-items:center; gap:6px;
  padding:6px 14px; border-radius:100px;
  background:#f5f3ff; border:1px solid #e0d9f5;
  font-size:12px; font-weight:600; color:#7c3aed;
}

@media(max-width:1200px) {
  .mb-stats-grid { grid-template-columns:repeat(3,1fr) !important; }
  .mb-main-grid { grid-template-columns:1fr !important; }
}
@media(max-width:768px) {
  .mb-stats-grid { grid-template-columns:repeat(2,1fr) !important; }
  .mb-branch-row,.mb-branch-head { grid-template-columns:1fr;gap:8px; }
}
@media(max-width:480px) { .mb-stats-grid { grid-template-columns:1fr !important; } }
`

const COLORS = ['#7c3aed','#2563eb','#059669','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#ec4899','#14b8a6','#f97316']

export default function BrandOwnerMyPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const { data: res } = await api.get('/business/brand-dashboard')
      setData(res)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load brand dashboard')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [])

  if (loading) return (
    <div style={{ textAlign:'center', padding:80 }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}><LogoLoader size={40} /></div>
      <div style={{ color:'#94a3b8', fontSize:14, fontWeight:500 }}>Loading brand dashboard...</div>
    </div>
  )

  if (error) return (
    <div style={{ textAlign:'center', padding:80 }}>
      <AlertTriangle size={40} style={{ color:'#f59e0b', marginBottom:16 }} />
      <div style={{ color:'#ef4444', fontSize:14, fontWeight:600, marginBottom:12 }}>{error}</div>
      <button onClick={fetchData} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'#7c3aed', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Retry</button>
    </div>
  )

  const { kpis, branches, topGames, playsByDay, totalBranches, brand } = data
  const maxPlays = Math.max(...(topGames || []).map(g => g.play_count), 1)
  const maxBranchPlays = Math.max(...(branches || []).map(b => b.play_count), 1)

  const statsCards = [
    { label:'Total Games', value:kpis.totalGames, color:'#7c3aed', bg:'linear-gradient(135deg,#f5f3ff,#ede9fe)', icon:Gamepad2 },
    { label:'Total Plays', value:kpis.totalPlays, color:'#2563eb', bg:'linear-gradient(135deg,#eff6ff,#dbeafe)', icon:TrendingUp },
    { label:'Participants', value:kpis.totalParticipants, color:'#059669', bg:'linear-gradient(135deg,#ecfdf5,#d1fae5)', icon:Users },
    { label:'Redemptions', value:kpis.totalRedemptions, color:'#f59e0b', bg:'linear-gradient(135deg,#fffbeb,#fef3c7)', icon:Trophy },
    { label:'Pending', value:kpis.pendingRedemptions, color:'#ef4444', bg:'linear-gradient(135deg,#fef2f2,#fecaca)', icon:Clock },
    { label:'Completed', value:kpis.completedRedemptions, color:'#10b981', bg:'linear-gradient(135deg,#ecfdf5,#d1fae5)', icon:CheckCircle },
  ]

  return (
    <div style={{ fontFamily:'Inter, sans-serif', color:'#1e1b4b' }}>
      <style>{MYPAGE_CSS}</style>

      {/* Header */}
      <div style={{ marginBottom:32, display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, margin:0, letterSpacing:'-0.5px' }}>
            {brand?.name || 'Brand'} — Overview
          </h1>
          <p style={{ color:'#94a3b8', fontSize:14, margin:'6px 0 0', fontWeight:500 }}>
            Aggregated KPIs across {totalBranches} branch{totalBranches !== 1 ? 'es' : ''}. View only — no action required.
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div className="mb-readonly-badge"><Eye size={14} /> View Only</div>
          <button onClick={fetchData} style={{ width:40, height:40, borderRadius:12, border:'1px solid #ece8ff', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b', transition:'all 0.2s' }} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:16, marginBottom:28 }}>
        {statsCards.map(s => (
          <div key={s.label} className="mb-stat" style={{ background:s.bg }}>
            <div className="mb-stat-icon" style={{ background:s.color+'15' }}>
              <s.icon size={22} style={{ color:s.color }} />
            </div>
            <div className="mb-stat-label">{s.label}</div>
            <div className="mb-stat-value" style={{ color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Main grid: Branch breakdown + Top Games */}
      <div className="mb-main-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>

        {/* Branch Breakdown */}
        <div className="mb-card">
          <div className="mb-card-header">
            <span className="mb-card-title"><Building2 size={18} style={{ marginRight:8, verticalAlign:'middle', color:'#7c3aed' }} />Branch Performance</span>
            <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>{branches?.length || 0} branches</span>
          </div>
          {(!branches || branches.length === 0) ? (
            <div style={{ textAlign:'center', padding:'48px 20px', color:'#94a3b8', fontSize:14 }}>
              No branches yet.
            </div>
          ) : (
            <>
              <div className="mb-branch-head">
                <span>Branch</span>
                <span>Games</span>
                <span>Plays</span>
                <span>Redemptions</span>
                <span>Completed</span>
              </div>
              {branches.map((b, i) => (
                <div key={b.id} className="mb-branch-row">
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:COLORS[i % COLORS.length], display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                      {(b.business_name?.[0] || 'B').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{b.business_name}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#475569' }}>{b.game_count}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#2563eb' }}>{b.play_count}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#f59e0b' }}>{b.redemption_count}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#10b981' }}>{b.completed_count || 0}</div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Top Games */}
        <div className="mb-card">
          <div className="mb-card-header">
            <span className="mb-card-title"><BarChart3 size={18} style={{ marginRight:8, verticalAlign:'middle', color:'#2563eb' }} />Top Games by Plays</span>
          </div>
          <div style={{ padding:24 }}>
            {(!topGames || topGames.length === 0) ? (
              <div style={{ textAlign:'center', padding:'48px 20px', color:'#94a3b8', fontSize:14 }}>
                No games played yet.
              </div>
            ) : topGames.map((g, i) => (
              <div key={i} className="mb-bar-row">
                <div className="mb-bar-top">
                  <span className="mb-bar-name">{g.game_name}</span>
                  <span className="mb-bar-val">{g.play_count} plays</span>
                </div>
                <div className="mb-bar-track">
                  <div className="mb-bar-fill" style={{ width:`${(g.play_count / maxPlays) * 100}%`, background:COLORS[i % COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Branch play bars (visual) */}
      {branches && branches.length > 0 && (
        <div className="mb-card" style={{ marginBottom:24 }}>
          <div className="mb-card-header">
            <span className="mb-card-title"><TrendingUp size={18} style={{ marginRight:8, verticalAlign:'middle', color:'#059669' }} />Plays per Branch</span>
          </div>
          <div style={{ padding:24 }}>
            {branches.map((b, i) => (
              <div key={b.id} className="mb-bar-row">
                <div className="mb-bar-top">
                  <span className="mb-bar-name">{b.business_name}</span>
                  <span className="mb-bar-val">{b.play_count} plays · {b.completed_count || 0} completed</span>
                </div>
                <div className="mb-bar-track">
                  <div className="mb-bar-fill" style={{ width:`${maxBranchPlays > 0 ? (b.play_count / maxBranchPlays) * 100 : 0}%`, background:COLORS[i % COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
