import { useState, useEffect, useMemo } from 'react'
import api from '../api'
import LogoLoader from '../components/LogoLoader'
import {
  Gamepad2, MapPin, Gift, ExternalLink, Search, Filter,
  RefreshCw, Grid3X3, List, Eye, Tag, CheckCircle, Clock,
  AlertTriangle
} from 'lucide-react'

const GAMES_CSS = `
@keyframes gFadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }

.g-stat {
  background:#fff; border:1px solid #ece8ff; border-radius:20px;
  padding:20px 24px; display:flex; align-items:center; gap:16px;
  transition:all 0.3s cubic-bezier(.4,0,.2,1);
  animation:gFadeIn .4s cubic-bezier(.4,0,.2,1) both;
}
.g-stat:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(143,44,255,0.08); }
.g-stat-icon {
  width:48px; height:48px; border-radius:14px;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.g-stat-value { font-size:28px; font-weight:800; letter-spacing:-1px; line-height:1; }
.g-stat-label { font-size:12px; font-weight:600; color:#94a3b8; margin-top:2px; }

.g-search-wrap {
  background:#fff; border:1px solid #ece8ff; border-radius:16px;
  padding:8px; display:flex; align-items:center; gap:8px;
  box-shadow:0 2px 8px rgba(0,0,0,0.02);
}
.g-search-input {
  flex:1; border:none; outline:none; font-size:14px; font-weight:500;
  color:#1e1b4b; font-family:inherit; background:transparent;
  padding:10px 12px; min-width:0;
}
.g-search-input::placeholder { color:#94a3b8; }
.g-filter-btn {
  display:flex; align-items:center; gap:6px; padding:10px 14px;
  border-radius:12px; border:1px solid #ece8ff; background:#fff;
  font-size:13px; font-weight:600; color:#64748b; cursor:pointer;
  font-family:inherit; transition:all 0.2s; white-space:nowrap;
}
.g-filter-btn:hover { border-color:#c4b5fd; color:#7c3aed; }
.g-icon-btn {
  width:40px; height:40px; border-radius:12px; border:1px solid #ece8ff;
  background:#fff; display:flex; align-items:center; justify-content:center;
  cursor:pointer; color:#64748b; transition:all 0.2s; flex-shrink:0;
}
.g-icon-btn:hover { border-color:#c4b5fd; color:#7c3aed; background:#f8f7ff; }
.g-icon-btn.active { background:#7c3aed; color:#fff; border-color:#7c3aed; }

.g-card {
  background:#fff; border:1px solid #ece8ff; border-radius:20px;
  overflow:hidden; transition:all 0.3s cubic-bezier(.4,0,.2,1);
  animation:gFadeIn .4s cubic-bezier(.4,0,.2,1) both;
}
.g-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(143,44,255,0.1); }
.g-card-img {
  width:100%; height:160px; object-fit:cover;
  background:linear-gradient(135deg,#f5f3ff,#ede9fe);
}
.g-card-body { padding:20px; }
.g-card-name { font-size:16px; font-weight:700; color:#1e1b4b; margin-bottom:4px; line-height:1.3; }
.g-card-meta { display:flex; align-items:center; gap:6px; font-size:12px; color:#94a3b8; margin-top:4px; }
.g-card-badges { display:flex; gap:6px; margin-top:12px; flex-wrap:wrap; }
.g-badge {
  display:inline-flex; align-items:center; gap:4px; padding:4px 10px;
  border-radius:100px; font-size:11px; font-weight:700;
}
.g-card-footer {
  padding:14px 20px; border-top:1px solid #f3f0ff;
  display:flex; align-items:center; justify-content:space-between;
}
.g-card-link {
  display:inline-flex; align-items:center; gap:4px; padding:6px 14px;
  border-radius:8px; border:1px solid #ece8ff; background:#fff;
  font-size:12px; font-weight:600; color:#7c3aed; cursor:pointer;
  font-family:inherit; transition:all 0.2s; text-decoration:none;
}
.g-card-link:hover { background:#f5f3ff; border-color:#c4b5fd; }

.g-list-row {
  display:grid; grid-template-columns:2.5fr 1.5fr 1fr 1fr 1fr;
  align-items:center; padding:14px 24px; border-bottom:1px solid #f8f7ff;
  transition:background 0.15s; gap:12px;
}
.g-list-row:last-child { border-bottom:none; }
.g-list-row:hover { background:#faf9ff; }
.g-list-head {
  font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase;
  letter-spacing:0.5px; padding:12px 24px; border-bottom:1px solid #ece8ff;
  background:#faf9ff;
  display:grid; grid-template-columns:2.5fr 1.5fr 1fr 1fr 1fr;
  gap:12px;
}

@media(max-width:768px) {
  .g-stats-grid { grid-template-columns:repeat(2,1fr) !important; }
  .g-grid { grid-template-columns:1fr !important; }
}
@media(max-width:480px) { .g-stats-grid { grid-template-columns:1fr !important; } }
`

const GAME_COLORS = ['#7c3aed','#2563eb','#059669','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#ec4899']

export default function BOGames() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [view, setView] = useState('grid')

  const fetchGames = async () => {
    try {
      const { data } = await api.get('/business/games')
      setGames(data.games || [])
      setError('')
    } catch { setError('Failed to load games.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchGames() }, [])

  const stats = useMemo(() => ({
    total: games.length,
    live: games.filter(g => g.game_status === 'live').length,
    development: games.filter(g => g.game_status === 'development').length,
    templates: games.filter(g => g.is_template).length,
  }), [games])

  const filtered = useMemo(() => {
    let list = [...games]
    const q = search.toLowerCase().trim()
    if (q) list = list.filter(g => g.game_name?.toLowerCase().includes(q) || g.location_name?.toLowerCase().includes(q))
    if (statusFilter !== 'all') list = list.filter(g => g.game_status === statusFilter)
    return list
  }, [games, search, statusFilter])

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase()
  }

  if (loading) return (
    <div style={{ textAlign:'center', padding:80 }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}><LogoLoader size={40} /></div>
      <div style={{ color:'#94a3b8', fontSize:14, fontWeight:500 }}>Loading games...</div>
    </div>
  )

  return (
    <div style={{ fontFamily:'Inter, sans-serif', color:'#1e1b4b' }}>
      <style>{GAMES_CSS}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:28, fontWeight:800, margin:0, letterSpacing:'-0.5px' }}>My Games</h1>
        <p style={{ color:'#94a3b8', fontSize:14, margin:'6px 0 0', fontWeight:500 }}>
          All games linked to your brand and branches.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding:'14px 18px', borderRadius:14, marginBottom:20, background:'#fef2f2', border:'1px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:13, color:'#ef4444', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}><AlertTriangle size={15} /> {error}</span>
          <button onClick={fetchGames} style={{ padding:'7px 18px', borderRadius:8, border:'none', background:'#ef4444', color:'#fff', fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Retry</button>
        </div>
      )}

      {/* Search & filters */}
      <div className="g-search-wrap" style={{ marginBottom:24 }}>
        <Search size={18} style={{ color:'#94a3b8', marginLeft:8, flexShrink:0 }} />
        <input className="g-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search games by name or location..." />
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          <select className="g-filter-btn" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="live">Live</option>
            <option value="development">Development</option>
            <option value="testing">Testing</option>
          </select>
          <button className="g-icon-btn" onClick={fetchGames} title="Refresh"><RefreshCw size={16} /></button>
          <button className={`g-icon-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')} title="Grid view"><Grid3X3 size={16} /></button>
          <button className={`g-icon-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')} title="List view"><List size={16} /></button>
        </div>
      </div>

      {/* Games */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'64px 20px', background:'#fff', borderRadius:20, border:'1px solid #ece8ff' }}>
          <Gamepad2 size={48} style={{ marginBottom:12, opacity:0.2, color:'#c4b5fd' }} />
          <div style={{ color:'#94a3b8', fontSize:14, fontWeight:500 }}>
            {games.length === 0 ? 'No games linked to your account yet.' : 'No games match your search.'}
          </div>
        </div>
      ) : view === 'grid' ? (
        <div className="g-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
          {filtered.map((g, i) => (
            <div key={g.id || `template-${i}`} className="g-card" style={{ animationDelay:`${i * 0.04}s` }}>
              {/* Card header / image area */}
              <div style={{ position:'relative' }}>
                {g.game_logo_url ? (
                  <img src={g.game_logo_url} alt="" className="g-card-img" style={{ objectFit:'contain', padding:16 }} />
                ) : (
                  <div className="g-card-img" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{
                      width:64, height:64, borderRadius:16,
                      background:'linear-gradient(135deg,#7c3aed30,#7c3aed10)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <span style={{ fontSize:28, fontWeight:800, color:'#7c3aed' }}>{getInitials(g.game_name)}</span>
                    </div>
                  </div>
                )}
                {/* Status badge overlay */}
                <div style={{ position:'absolute', top:12, right:12, display:'flex', gap:6 }}>
                  <span className="g-badge" style={{
                    background: g.game_status === 'live' ? '#dcfce7' : g.game_status === 'testing' ? '#fef3c7' : '#f1f5f9',
                    color: g.game_status === 'live' ? '#16a34a' : g.game_status === 'testing' ? '#d97706' : '#64748b',
                  }}>
                    {g.game_status === 'live' && <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor' }} />}
                    {g.game_status}
                  </span>
                </div>
              </div>

              <div className="g-card-body">
                <div className="g-card-name">{g.game_name}</div>
                {g.location_name && (
                  <div className="g-card-meta"><MapPin size={12} /> {g.location_name}</div>
                )}
                {g.reward_text && (
                  <div className="g-card-meta" style={{ color:'#059669' }}><Gift size={12} /> {g.reward_text}</div>
                )}
                <div className="g-card-badges">
                  {g.is_template && (
                    <span className="g-badge" style={{ background:'#f5f3ff', color:'#7c3aed' }}>Template</span>
                  )}
                  {g.location_name && (
                    <span className="g-badge" style={{ background:'#eff6ff', color:'#2563eb' }}>Branch Game</span>
                  )}
                </div>
              </div>

              <div className="g-card-footer">
                <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>
                  {g.slug ? `/play/${g.slug}` : '—'}
                </span>
                {g.slug && (
                  <a
                    href={`/play/${g.slug}/${g.game_slug || 'play'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="g-card-link"
                  >
                    <ExternalLink size={12} /> Play
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div style={{ background:'#fff', border:'1px solid #ece8ff', borderRadius:20, overflow:'hidden' }}>
          <div className="g-list-head">
            <span>Game</span>
            <span>Location</span>
            <span>Status</span>
            <span>Type</span>
            <span>Action</span>
          </div>
          {filtered.map((g, i) => (
            <div key={g.id || `template-${i}`} className="g-list-row">
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{
                  width:40, height:40, borderRadius:12, flexShrink:0,
                  background: g.game_logo_url ? 'transparent' : `linear-gradient(135deg,${GAME_COLORS[i % GAME_COLORS.length]}20,${GAME_COLORS[i % GAME_COLORS.length]}08)`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  overflow:'hidden',
                }}>
                  {g.game_logo_url ? (
                    <img src={g.game_logo_url} alt="" style={{ width:40, height:40, objectFit:'contain' }} />
                  ) : (
                    <span style={{ fontSize:14, fontWeight:700, color:GAME_COLORS[i % GAME_COLORS.length] }}>{getInitials(g.game_name)}</span>
                  )}
                </div>
                <div style={{ fontWeight:600, fontSize:13 }}>{g.game_name}</div>
              </div>
              <div style={{ fontSize:13, color:'#64748b', fontWeight:500 }}>
                {g.location_name || <span style={{ color:'#cbd5e1' }}>—</span>}
              </div>
              <div>
                <span className="g-badge" style={{
                  background: g.game_status === 'live' ? '#dcfce7' : g.game_status === 'testing' ? '#fef3c7' : '#f1f5f9',
                  color: g.game_status === 'live' ? '#16a34a' : g.game_status === 'testing' ? '#d97706' : '#64748b',
                }}>
                  {g.game_status}
                </span>
              </div>
              <div>
                {g.is_template ? (
                  <span className="g-badge" style={{ background:'#f5f3ff', color:'#7c3aed' }}>Template</span>
                ) : (
                  <span className="g-badge" style={{ background:'#eff6ff', color:'#2563eb' }}>Branch</span>
                )}
              </div>
              <div>
                {g.slug && (
                  <a href={`/play/${g.slug}/${g.game_slug || 'play'}`} target="_blank" rel="noopener noreferrer" className="g-card-link">
                    <ExternalLink size={12} /> Play
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
