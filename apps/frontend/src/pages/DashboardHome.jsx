import { useState, useEffect, useCallback, useRef, Children } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  purple : '#7c6ff7',
  teal   : '#10b981',
  amber  : '#f59e0b',
  coral  : '#ef4444',
  pink   : '#ec4899',
  blue   : '#3b82f6',
  PIE    : ['#7c6ff7','#10b981','#f59e0b','#ef4444','#ec4899','#3b82f6'],
}

// ─── Theme tokens (resolve from global CSS variables so dark/pink themes apply) ────────
const T = {
  bg      : 'var(--bg-secondary)',
  surface : 'var(--surface)',
  surf2   : 'var(--surface2)',
  border  : 'var(--border)',
  text    : 'var(--text)',
  text2   : 'var(--text2)',
  text3   : 'var(--text3)',
  primary : 'var(--primary)',
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
.dh { font-family:'DM Sans',sans-serif; min-height:100vh; background:${T.bg}; color:${T.text}; }
.dh *,.dh *::before,.dh *::after { box-sizing:border-box; margin:0; padding:0; }

.dh {
  font-family:'DM Sans',sans-serif;
  min-height:100vh;
  color:var(--text);
  position:relative;

  /* Keep the page background on the theme token — a hard-coded #ffffff here
     made dark-mode text invisible (white on white). */
  background: var(--bg-secondary);
}

.dh-card {
  width:100%;
  background:var(--surface) !important;

  border:1px solid var(--border);

  border-radius:18px;
  overflow:hidden;

  box-shadow:
    0 10px 40px rgba(124,111,247,0.08),
    0 2px 10px rgba(0,0,0,0.04),
    inset 0 1px 0 rgba(255,255,255,0.15);

  transition:all .25s ease;
}

.dh-card:hover {
  transform:translateY(-2px);

  box-shadow:
    0 16px 50px rgba(124,111,247,0.12),
    0 4px 14px rgba(0,0,0,0.06),
    inset 0 1px 0 rgba(255,255,255,0.8);
}
    .dh-card-pad {
  padding:20px 22px;
  background:var(--surface) !important;
}.dh-card table {
  background:var(--surface) !important;
}

.dh-card thead tr {
  background:var(--surface2) !important;
}

.dh-tr:hover {
  background:var(--surface2) !important;
}

.dh-kpi-val {
  font-family:'poppins',sans-serif;
  font-weight:800; font-size:36px; line-height:1;
  color:${T.text}; letter-spacing:-0.03em;
}
.dh-kpi-label {
  font-size:10px; font-weight:700; text-transform:uppercase;
  letter-spacing:.1em; color:${T.text3}; margin-bottom:10px;
}
.dh-kpi-sub { font-size:11.5px; color:${T.text3}; margin-top:6px; }

.dh-sec-title {
  font-family:'poppins',sans-serif; font-weight:700;
  font-size:14px; color:${T.text};
}
.dh-sec-sub { font-size:11px; color:${T.text3}; margin-top:2px; }

.dh-badge-live {
  display:inline-flex; align-items:center; gap:5px;
  padding:3px 9px; border-radius:100px; font-size:11px; font-weight:700;
  background:var(--success-bg); color:var(--success);
  border:1px solid var(--success-border);
}
.dh-badge-off {
  display:inline-flex; align-items:center; gap:5px;
  padding:3px 9px; border-radius:100px; font-size:11px; font-weight:700;
  background:var(--error-bg); color:var(--error);
  border:1px solid var(--error-border);
}
.dh-pulse { width:5px;height:5px;border-radius:50%;background:currentColor;display:inline-block;animation:dhPulse 2s ease infinite; }

.dh-tr { border-bottom:1px solid ${T.border}; transition:background .12s; }
.dh-tr:last-child { border-bottom:none; }
.dh-tr:hover { background:${T.surf2}; }

.dh-btn-ghost {
  display:inline-flex;align-items:center;gap:5px;
  padding:6px 12px;border-radius:8px;
  border:1.5px solid ${T.border};background:${T.surface};
  color:${T.text2};font-size:12px;font-weight:600;
  cursor:pointer;font-family:'DM Sans',sans-serif;
  transition:background .13s,border-color .13s;
}
.dh-btn-ghost:hover { background:${T.surf2}; border-color:var(--border); }

.dh-btn-primary {
  display:inline-flex;align-items:center;gap:6px;
  padding:8px 18px;border-radius:8px;border:none;
  background:${T.primary};color:#fff;
  font-size:13px;font-weight:700;cursor:pointer;
  font-family:'DM Sans',sans-serif;transition:opacity .13s;
}
.dh-btn-primary:hover { opacity:.88; }

.dh-skel {
  background:linear-gradient(90deg,${T.surf2} 25%,${T.border} 50%,${T.surf2} 75%);
  background-size:200% 100%;animation:dhShimmer 1.4s infinite;border-radius:6px;
}

.dh-kpi-grid  { display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px; }
.dh-row2      { display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:18px; }
.dh-row3      { display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:18px; }
.dh-row5      { display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px; }

.dh-prog-bar  { height:4px;border-radius:100px;background:${T.border};overflow:hidden; }
.dh-prog-fill { height:100%;border-radius:100px;transition:width 1.2s ease; }

@keyframes dhPulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
@keyframes dhShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@keyframes dhFadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

@media(max-width:1200px){
  .dh-kpi-grid{grid-template-columns:repeat(2,1fr)}
  .dh-row2{grid-template-columns:1fr}
  .dh-row3{grid-template-columns:1fr 1fr}
}
@media(max-width:768px){
  .dh-row3,.dh-row5{grid-template-columns:1fr}
}
`

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtN   = n => Number(n || 0).toLocaleString()
const capStr = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'

function Skel({ h = 18, w = '60%' }) {
  return <div className="dh-skel" style={{ height: h, width: w }} />
}

function SecHead({ title, sub, action, onAction }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'16px 20px', borderBottom:`1px solid ${T.border}`,
    }}>
      <div>
        <div className="dh-sec-title">{title}</div>
        {sub && <div className="dh-sec-sub">{sub}</div>}
      </div>
      {action && (
        <button className="dh-btn-ghost" onClick={onAction}>
          {action}
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      )}
    </div>
  )
}

function LiveBadge({ active }) {
  return active
    ? <span className="dh-badge-live"><span className="dh-pulse"/>Live</span>
    : <span className="dh-badge-off"><span style={{width:5,height:5,borderRadius:'50%',background:'currentColor',display:'inline-block'}}/>Off</span>
}

function Empty({ msg }) {
  return <div style={{padding:'32px 0',textAlign:'center',fontSize:13,color:T.text3}}>{msg}</div>
}

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background:T.surface, border:`1px solid ${T.border}`,
      borderRadius:8, padding:'8px 12px', fontSize:12,
      boxShadow:'0 4px 16px rgba(0,0,0,0.1)',
    }}>
      {label && <div style={{fontWeight:700, marginBottom:4, color:T.text2, fontFamily:"'DM Sans',sans-serif"}}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{display:'flex',alignItems:'center',gap:6,fontFamily:"'DM Sans',sans-serif"}}>
          <span style={{width:8,height:8,borderRadius:'50%',background:p.color,display:'inline-block'}}/>
          <span style={{color:T.text2}}>{p.name}:</span>
          <span style={{fontWeight:700,color:T.text}}>{fmtN(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function KpiCard({ label, value, sub, icon, accent, loading, delay = 0 }) {
  return (
    <div className="dh-card dh-card-pad" style={{
      position:'relative', overflow:'hidden',
      animation:`dhFadeUp .35s ease ${delay}ms both`,
    }}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:accent,borderRadius:'14px 14px 0 0'}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
        <div className="dh-kpi-label">{label}</div>
        <div style={{
          width:34,height:34,borderRadius:9,
          background:`${accent}18`,
          display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
        }}>{icon}</div>
      </div>
      {loading ? <Skel h={36} w="50%"/> : <div className="dh-kpi-val">{fmtN(value)}</div>}
      {sub && !loading && <div className="dh-kpi-sub">{sub}</div>}
    </div>
  )
}

function MasonryGrid({ children, gap = 14, minColWidth = 320 }) {
  const ref = useRef()
  const [cols, setCols] = useState(3)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth
      setCols(Math.max(1, Math.floor((w + gap) / (minColWidth + gap))))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [gap, minColWidth])

  const items = Children.toArray(children)
  const columns = Array.from({ length: cols }, () => [])
  items.forEach((item, i) => { columns[i % cols].push(item) })

  return (
    <div ref={ref} style={{ display:'flex', gap, alignItems:'flex-start', marginBottom:18 }}>
      {columns.map((col, ci) => (
        <div key={ci} style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap }}>
          {col}
        </div>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardHome() {
  const navigate = useNavigate()
  const [loading,  setLoading]  = useState(true)
  const [games,    setGames]    = useState([])
  const [clients,  setClients]  = useState([])
  const [players,  setPlayers]  = useState([])
  const [pStats,   setPStats]   = useState(null)
  const [lboard,   setLboard]   = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [gr, cr, pr, lr] = await Promise.all([
        api.get('/games'),
        api.get('/clients'),
        api.get('/players-admin'),
        api.get('/leaderboard'),
      ])
      setGames(gr.data.games     || [])
      setClients(cr.data.clients || [])
      setPlayers(pr.data.players || [])
      setPStats(pr.data.stats    || null)
      setLboard(lr.data.entries  || [])
    } catch(e) { console.error(e) }
    finally    { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ── derived ────────────────────────────────────────────────────────────────
  const totalPlays  = games.reduce((s, g) => s + (g.play_count || 0), 0)
  const activeGames = games.filter(g => g.is_active).length
  const activeRate  = games.length ? Math.round((activeGames / games.length) * 100) : 0
  const avgPlays    = games.length ? Math.round(totalPlays / games.length) : 0

  // game type donut
  const typeMap  = games.reduce((acc, g) => { const t = capStr(g.category || 'quiz'); acc[t] = (acc[t]||0)+1; return acc }, {})
  const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value }))

  // top 8 games by plays
  const topGames = [...games].sort((a,b) => (b.play_count||0)-(a.play_count||0)).slice(0,8)
    .map(g => ({ name: g.name.length>16 ? g.name.slice(0,14)+'…' : g.name, plays: g.play_count||0 }))

  // clients by game count
  const clientData = [...clients].sort((a,b) => (b.game_count||0)-(a.game_count||0)).slice(0,8)
    .map(c => ({ name: c.company_name.length>14 ? c.company_name.slice(0,12)+'…' : c.company_name, games: c.game_count||0 }))

  // players by city
  const cityMap  = players.reduce((acc, p) => { const c = p.city ? capStr(p.city.trim()) : 'Unknown'; acc[c] = (acc[c]||0)+1; return acc }, {})
  const cityData = Object.entries(cityMap).sort((a,b) => b[1]-a[1]).slice(0,8).map(([name,value]) => ({name,value}))
  const maxCity  = cityData[0]?.value || 1

  // PC distribution
  const ppBuckets = { '0–99':0,'100–299':0,'300–499':0,'500–999':0,'1000+':0 }
  players.forEach(p => {
    const b = p.pp_balance||0
    if (b<100) ppBuckets['0–99']++
    else if (b<300) ppBuckets['100–299']++
    else if (b<500) ppBuckets['300–499']++
    else if (b<1000) ppBuckets['500–999']++
    else ppBuckets['1000+']++
  })
  const ppData = Object.entries(ppBuckets).map(([range, count]) => ({ range, count }))

  // growth last 6 months
  const now = new Date()
  const monthSlots = Array.from({length:6}, (_,i) => {
    const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1)
    return { label: d.toLocaleString('default',{month:'short'}), year:d.getFullYear(), month:d.getMonth(), games:0, players:0 }
  })
  games.forEach(g => {
    if (!g.created_at) return
    const d = new Date(g.created_at)
    const s = monthSlots.find(x => x.month===d.getMonth() && x.year===d.getFullYear())
    if (s) s.games++
  })
  players.forEach(p => {
    if (!p.created_at) return
    const d = new Date(p.created_at)
    const s = monthSlots.find(x => x.month===d.getMonth() && x.year===d.getFullYear())
    if (s) s.players++
  })

  // top players
  const topPlayers = [...players].sort((a,b) => (b.pc_balance||0)-(a.pc_balance||0)).slice(0,8)
    .map(p => ({ name: (p.name||'?').split(' ')[0], pp: p.pp_balance||0 }))

  // most active (leaderboard)
  const topActive = lboard.slice(0,8)
    .map(e => ({ name: (e.player_name||'?').split(' ')[0], plays: e.total_plays||0 }))

  // active vs inactive
  const activeData = [
    { name:'Active',   value: activeGames },
    { name:'Inactive', value: Math.max(0, games.length - activeGames) },
  ]

  const recentGames = games.slice(0,6)
  const hour = new Date().getHours()
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'

  const kpis = [
    { label:'Total Clients',  value:clients.length,              sub:'organisations onboarded',             accent:C.purple, icon:<Icon1 c={C.purple}/> },
    { label:'Total Games',    value:games.length,                sub:`${activeGames} currently active`,     accent:C.teal,   icon:<Icon2 c={C.teal}/> },
    { label:'Total Plays',    value:totalPlays,                  sub:`avg ${fmtN(avgPlays)} per game`,      accent:C.amber,  icon:<Icon3 c={C.amber}/> },
    { label:'PromoPlayers',   value:pStats?.total||players.length, sub:`${pStats?.new_month||0} joined this month`, accent:C.pink, icon:<Icon4 c={C.pink}/> },
  ]

  const axisStyle = { fill: T.text2, fontSize: 11, fontFamily:"'DM Sans',sans-serif" }

  return (
    <div className="dh">
      <style>{CSS}</style>
      <div style={{padding:'28px 32px', maxWidth:1480, margin:'0 auto'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
          <div>
            <p style={{fontSize:10,fontWeight:700,color:T.text3,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:5}}>
              Dashboard Overview
            </p>
            <h1 style={{fontFamily:"'poppins',sans-serif",fontWeight:800,fontSize:28,color:T.text,letterSpacing:'-0.02em',lineHeight:1}}>
              {greeting} 👋
            </h1>
            <p style={{fontSize:13,color:T.text3,marginTop:6}}>Live data across your entire platform.</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="dh-btn-ghost" onClick={load}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              Refresh
            </button>
            <button className="dh-btn-ghost" onClick={() => navigate('/dashboard/clients')}>+ New Client</button>
            <button className="dh-btn-primary" onClick={() => navigate('/dashboard/games')}>+ Create Game</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="dh-kpi-grid">
          {kpis.map((k,i) => <KpiCard key={k.label} {...k} loading={loading} delay={i*60}/>)}
        </div>

        <MasonryGrid gap={14} minColWidth={340}>
          <div className="dh-card">
            <SecHead title="Platform Growth" sub="Games created & players joined — last 6 months"/>
            <div style={{padding:'16px 20px 8px'}}>
              {loading ? <Skel h={180}/> : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthSlots} margin={{top:4,right:8,left:-20,bottom:0}}>
                    <defs>
                      <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.purple} stopOpacity={0.25}/>
                        <stop offset="95%" stopColor={C.purple} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="pG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.teal} stopOpacity={0.25}/>
                        <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false}/>
                    <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <Tooltip content={<Tip/>}/>
                    <Legend wrapperStyle={{fontSize:12,color:T.text2,paddingTop:8,fontFamily:"'DM Sans',sans-serif"}}/>
                    <Area type="monotone" dataKey="games"   name="Games"   stroke={C.purple} fill="url(#gG)" strokeWidth={2} dot={false}/>
                    <Area type="monotone" dataKey="players" name="Players" stroke={C.teal}   fill="url(#pG)" strokeWidth={2} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="dh-card">
            <SecHead title="Game Status" sub="Active vs inactive"/>
            <div style={{padding:'16px 20px'}}>
              {loading ? <Skel h={180}/> : (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={activeData} cx="50%" cy="50%" innerRadius={46} outerRadius={66} dataKey="value" stroke="none" paddingAngle={3}>
                        <Cell fill={C.teal}/>
                        <Cell fill={C.coral}/>
                      </Pie>
                      <Tooltip content={<Tip/>}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{display:'flex',justifyContent:'center',gap:20,marginTop:4}}>
                    {activeData.map((d,i) => (
                      <div key={d.name} style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:T.text2,fontFamily:"'DM Sans',sans-serif"}}>
                        <span style={{width:8,height:8,borderRadius:'50%',background:i===0?C.teal:C.coral,display:'inline-block'}}/>
                        {d.name}: <strong style={{color:T.text}}>{d.value}</strong>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:14,padding:'12px',background:T.surf2,borderRadius:10,textAlign:'center',border:`1px solid ${T.border}`}}>
                    <div style={{fontFamily:"'poppins',sans-serif",fontWeight:800,fontSize:30,color:T.primary}}>{activeRate}%</div>
                    <div style={{fontSize:11,color:T.text3,marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>activation rate</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="dh-card">
            <SecHead title="Top Games by Plays" sub="Ranked by completed sessions" action="All games" onAction={() => navigate('/dashboard/games')}/>
            <div style={{padding:'16px 20px 8px'}}>
              {loading ? <Skel h={220}/> : topGames.length===0 ? <Empty msg="No plays yet"/> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topGames} layout="vertical" margin={{top:0,right:8,left:4,bottom:0}}>
                    <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false}/>
                    <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="name" width={92} tick={axisStyle} axisLine={false} tickLine={false}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar dataKey="plays" name="Plays" fill={C.purple} radius={[0,4,4,0]} barSize={14}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="dh-card">
            <SecHead title="Game Types" sub="Distribution across all games"/>
            <div style={{padding:'16px 20px 8px'}}>
              {loading ? <Skel h={220}/> : typeData.length===0 ? <Empty msg="No games yet"/> : (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={typeData} cx="50%" cy="50%" innerRadius={42} outerRadius={64} dataKey="value" nameKey="name" stroke="none" paddingAngle={2}>
                        {typeData.map((_,i) => <Cell key={i} fill={C.PIE[i%C.PIE.length]}/>)}
                      </Pie>
                      <Tooltip content={<Tip/>}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:8}}>
                    {typeData.map((d,i) => (
                      <div key={d.name} style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{width:8,height:8,borderRadius:2,background:C.PIE[i%C.PIE.length],flexShrink:0}}/>
                        <span style={{fontSize:12,color:T.text,flex:1,fontFamily:"'DM Sans',sans-serif"}}>{d.name}</span>
                        <span style={{fontSize:12,fontWeight:700,color:T.text2,fontFamily:"'DM Sans',sans-serif"}}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="dh-card">
            <SecHead title="Games per Client" sub="Top clients by game count" action="Clients" onAction={() => navigate('/dashboard/clients')}/>
            <div style={{padding:'16px 20px 8px'}}>
              {loading ? <Skel h={220}/> : clientData.length===0 ? <Empty msg="No clients yet"/> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={clientData} layout="vertical" margin={{top:0,right:8,left:4,bottom:0}}>
                    <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false}/>
                    <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <YAxis type="category" dataKey="name" width={92} tick={axisStyle} axisLine={false} tickLine={false}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar dataKey="games" name="Games" fill={C.teal} radius={[0,4,4,0]} barSize={14}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="dh-card" style={{gridColumn:'1 / -1',width:'100%'}}>
            <SecHead title="Recent Games" sub={`${recentGames.length} most recent`} action="View all" onAction={() => navigate('/dashboard/games')}/>
            {loading ? (
              <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:12}}>
                {[90,75,85].map((w,i) => <Skel key={i} h={16} w={`${w}%`}/>)}
              </div>
            ) : recentGames.length===0 ? (
              <Empty msg="No games yet — create your first!"/>
            ) : (
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontFamily:"'DM Sans',sans-serif"}}>
                  <thead>
                    <tr style={{borderBottom:`1px solid ${T.border}`,background:T.surf2}}>
                      {['Game','Client','Type','Questions','Plays','Status',''].map(h => (
                        <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:10,fontWeight:700,color:T.text3,textTransform:'uppercase',letterSpacing:'.08em',whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentGames.map(g => (
                      <tr key={g.id} className="dh-tr">
                        <td style={{padding:'12px 16px'}}>
                          <div style={{fontWeight:700,fontSize:13,color:T.text}}>{g.name}</div>
                        </td>
                        <td style={{padding:'12px 16px',fontSize:13,color:T.text2}}>{g.company_name||'—'}</td>
                        <td style={{padding:'12px 16px'}}>
                          <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:6,background:T.surf2,color:T.text2,border:`1px solid ${T.border}`,textTransform:'capitalize'}}>{g.category||'quiz'}</span>
                        </td>
                        <td style={{padding:'12px 16px',fontSize:13,fontWeight:700,color:T.text}}>{g.question_count||0}</td>
                        <td style={{padding:'12px 16px',fontSize:13,fontWeight:700,color:T.text}}>{fmtN(g.play_count||0)}</td>
                        <td style={{padding:'12px 16px'}}><LiveBadge active={g.is_active}/></td>
                        <td style={{padding:'12px 16px'}}>
                          <button onClick={() => navigate(`/dashboard/games/${g.id}/builder`)} style={{
                            background:'none',border:'none',cursor:'pointer',
                            fontSize:12,fontWeight:700,color:T.primary,
                            fontFamily:"'DM Sans',sans-serif",
                          }}>Edit →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="dh-card">
            <SecHead title="Players by City" sub="Geographic distribution" action="All players" onAction={() => navigate('/dashboard/players')}/>
            <div style={{padding:'16px 20px'}}>
              {loading ? <Skel h={180}/> : cityData.length===0 ? <Empty msg="No location data yet"/> : cityData.map((c,i) => (
                <div key={c.name} style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                  <span style={{fontSize:12.5,fontWeight:600,color:T.text,minWidth:80,fontFamily:"'DM Sans',sans-serif"}}>{c.name}</span>
                  <div className="dh-prog-bar" style={{flex:1}}>
                    <div className="dh-prog-fill" style={{width:`${(c.value/maxCity)*100}%`,background:C.PIE[i%C.PIE.length]}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:T.text2,minWidth:24,textAlign:'right',fontFamily:"'DM Sans',sans-serif"}}>{c.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dh-card">
            <SecHead title="Promo Coins Distribution" sub="Players grouped by PC balance"/>
            <div style={{padding:'16px 20px 8px'}}>
              {loading ? <Skel h={180}/> : players.length===0 ? <Empty msg="No players yet"/> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ppData} margin={{top:4,right:8,left:-20,bottom:0}}>
                    <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="range" tick={axisStyle} axisLine={false} tickLine={false}/>
                    <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar dataKey="count" name="Players" fill={C.amber} radius={[4,4,0,0]} barSize={30}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="dh-card">
            <SecHead title="Top Players by Promo Coins" sub="Highest PC balances" action="All players" onAction={() => navigate('/dashboard/players')}/>
            <div style={{padding:'16px 20px 8px'}}>
              {loading ? <Skel h={200}/> : topPlayers.length===0 ? <Empty msg="No players yet"/> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topPlayers} layout="vertical" margin={{top:0,right:8,left:4,bottom:0}}>
                    <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false}/>
                    <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="name" width={70} tick={axisStyle} axisLine={false} tickLine={false}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar dataKey="pc_balance" name="Promo Coins" fill={C.pink} radius={[0,4,4,0]} barSize={14}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="dh-card">
            <SecHead title="Most Active Players" sub="Ranked by completed plays"/>
            <div style={{padding:'16px 20px 8px'}}>
              {loading ? <Skel h={200}/> : topActive.length===0 ? <Empty msg="No completed plays yet"/> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topActive} layout="vertical" margin={{top:0,right:8,left:4,bottom:0}}>
                    <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false}/>
                    <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <YAxis type="category" dataKey="name" width={70} tick={axisStyle} axisLine={false} tickLine={false}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar dataKey="plays" name="Plays" fill={C.blue} radius={[0,4,4,0]} barSize={14}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="dh-card dh-card-pad">
            <div style={{fontSize:10,fontWeight:700,color:T.text3,textTransform:'uppercase',letterSpacing:'.09em',marginBottom:14,fontFamily:"'DM Sans',sans-serif"}}>Platform Summary</div>
            {[
              { label:'Avg plays / game',  val: fmtN(avgPlays) },
              { label:'Games per client',  val: clients.length ? (games.length/clients.length).toFixed(1) : '—' },
              { label:'Total questions',   val: fmtN(games.reduce((s,g)=>s+(g.question_count||0),0)) },
            ].map((r,i,arr) => (
              <div key={r.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 0',borderBottom:i<arr.length-1?`1px solid ${T.border}`:'none'}}>
                <span style={{fontSize:12.5,color:T.text2,fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>{r.label}</span>
                <span style={{fontFamily:"'poppins',sans-serif",fontWeight:800,fontSize:22,color:T.text,letterSpacing:'-0.02em'}}>{r.val}</span>
              </div>
            ))}
          </div>

          <div className="dh-card dh-card-pad">
            <div style={{fontSize:10,fontWeight:700,color:T.text3,textTransform:'uppercase',letterSpacing:'.09em',marginBottom:14,fontFamily:"'DM Sans',sans-serif"}}>PromoPlayer Stats</div>
            {[
              { label:'Total players',     val: fmtN(pStats?.total||players.length) },
              { label:'New this month',    val: fmtN(pStats?.new_month||0) },
              { label:'Avg PC balance',    val: fmtN(pStats?.avg_pc||0) },
            ].map((r,i,arr) => (
              <div key={r.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 0',borderBottom:i<arr.length-1?`1px solid ${T.border}`:'none'}}>
                <span style={{fontSize:12.5,color:T.text2,fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>{r.label}</span>
                <span style={{fontFamily:"'poppins',sans-serif",fontWeight:800,fontSize:22,color:T.text,letterSpacing:'-0.02em'}}>{r.val}</span>
              </div>
            ))}
          </div>

          <div className="dh-card dh-card-pad">
            <div style={{fontSize:10,fontWeight:700,color:T.text3,textTransform:'uppercase',letterSpacing:'.09em',marginBottom:14,fontFamily:"'DM Sans',sans-serif"}}>Quick Actions</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                { label:'Add a client',   sub:'Onboard new organisation', to:'/dashboard/clients', accent:C.purple },
                { label:'Create a game',  sub:'Set up questions & rules',  to:'/dashboard/games',   accent:C.teal   },
                { label:'View players',   sub:'Promo Coins & profiles',    to:'/dashboard/players', accent:C.pink   },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.to)} style={{
                  display:'flex',alignItems:'center',gap:10,padding:'10px 12px',
                  borderRadius:10,background:T.surf2,border:`1px solid ${T.border}`,
                  cursor:'pointer',textAlign:'left',width:'100%',
                  fontFamily:"'DM Sans',sans-serif",transition:'background .13s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background=T.surf2}>
                  <div style={{width:32,height:32,borderRadius:8,background:`${a.accent}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{width:10,height:10,borderRadius:'50%',background:a.accent,display:'inline-block'}}/>
                  </div>
                  <div>
                    <div style={{fontSize:12.5,fontWeight:700,color:T.text}}>{a.label}</div>
                    <div style={{fontSize:11,color:T.text3}}>{a.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </MasonryGrid>
      </div>
    </div>
  )
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────
function Icon1({ c }) {
  return <svg width="17" height="17" fill="none" stroke={c} strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h18M3 15h18"/></svg>
}
function Icon2({ c }) {
  return <svg width="17" height="17" fill="none" stroke={c} strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M6 12h4M8 10v4M15 12h.01M18 12h.01"/></svg>
}
function Icon3({ c }) {
  return <svg width="17" height="17" fill="none" stroke={c} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill={c} stroke="none"/></svg>
}
function Icon4({ c }) {
  return <svg width="17" height="17" fill="none" stroke={c} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}