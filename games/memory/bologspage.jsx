import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'

const STATE_META = {
  played_not_redeemed:  { label: 'Played · Not Redeemed', color: '#64748b', bg: '#f1f5f9' },
  accepted_with_code:   { label: 'Accepted · 6-digit code', color: '#059669', bg: '#dcfce7' },
  accepted_without_code:{ label: 'Accepted · no code',      color: '#b45309', bg: '#fef3c7' },
}

const csvCell = (v) => { const s = v == null ? '' : String(v); return `"${s.replace(/"/g, '""')}"` }

export default function MemoryBOLogsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [bos, setBos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeBo, setActiveBo] = useState(null)
  const [entries, setEntries] = useState([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [gameRes, bosRes] = await Promise.all([
        api.get(`/games/${id}`),
        api.get(`/internal-team/bo-logs/game/${id}`).catch(() => ({ data: { business_owners: [] } }))
      ])
      setGame(gameRes.data.game)
      setBos(bosRes.data.business_owners || [])
    } catch {}
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const openBo = async (bo) => {
    setActiveBo(bo)
    setEntriesLoading(true)
    setEntries([])
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)
      params.set('game_id', id)
      const { data } = await api.get(`/internal-team/bo-logs/${bo.id}/entries?${params}`)
      setEntries(data.entries || [])
    } catch {}
    setEntriesLoading(false)
  }

  const exportCSV = (bo, rows) => {
    const formKeys = []
    rows.forEach(r => Object.keys(r.player_data || {}).forEach(k => { if (!formKeys.includes(k)) formKeys.push(k) }))
    const headers = ['Session ID', 'Player Name', 'Player Email', 'Played At', 'Completed', 'Score', ...formKeys, 'Redemption', '6-Digit Code', 'Accepted At', 'Accepted By', 'Table #']
    const lines = [headers.map(csvCell).join(',')]
    rows.forEach(r => {
      const m = STATE_META[r.redemption_state] || STATE_META.played_not_redeemed
      lines.push([r.session_id, r.player_name, r.player_email, r.played_at, r.completed ? 'Yes' : 'No', r.score, ...formKeys.map(k => r.player_data?.[k] ?? ''), m.label, r.code_present ? 'Yes' : 'No', r.accepted_at || '', r.accepted_by_name || '', r.table_number || ''].map(csvCell).join(','))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `Memory_${bo.business_name.replace(/[^a-z0-9]/gi, '_')}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = bos.filter(b => b.business_name.toLowerCase().includes(search.toLowerCase()))

  if (loading) {
    return (
      <div style={{fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text3)'}}>
        Loading memory BO logs…
      </div>
    )
  }

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",padding:'32px',maxWidth:1240,margin:'0 auto',color:'var(--text)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:16,flexWrap:'wrap',marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <button style={{width:36,height:36,borderRadius:8,border:'1.5px solid var(--border)',background:'var(--surface2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text)'}} onClick={() => navigate('/dashboard/games')} title="Back">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 style={{fontFamily:"'Fraunces',serif",fontSize:28,fontWeight:600,margin:0}}>{game?.name} — BO Logs</h1>
            <p style={{fontSize:13.5,color:'var(--text3)',marginTop:4}}>🧩 Business owner activity for this memory game</p>
          </div>
        </div>
        <div style={{position:'relative'}}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search business owner…" style={{padding:'11px 14px 11px 38px',borderRadius:12,border:'1.5px solid #e2e8f0',fontSize:13,fontFamily:'inherit',width:260,background:'var(--surface)',outline:'none'}} />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)'}}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{textAlign:'center',padding:64,color:'var(--text3)'}}>No business owners linked to this memory game</div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18}}>
          {filtered.map(bo => (
            <button key={bo.id} onClick={() => openBo(bo)} style={{textAlign:'left',background:'var(--surface)',border:'1px solid #eef0f5',borderRadius:18,padding:20,cursor:'pointer',fontFamily:'inherit',transition:'transform .15s,box-shadow .15s'}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:46,height:46,borderRadius:13,background:'linear-gradient(135deg,var(--primary),var(--accent))',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:17}}>{bo.business_name.slice(0, 2).toUpperCase()}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:16,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{bo.business_name}</div>
                  <div style={{fontSize:12,color:'var(--text3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{bo.email}</div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginTop:18}}>
                <div style={{background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:12,padding:'10px 6px',textAlign:'center'}}>
                  <div style={{fontSize:20,fontWeight:800,color:'#4f46e5'}}>{bo.total_plays}</div>
                  <div style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',color:'var(--text3)',marginTop:5}}>Plays</div>
                </div>
                <div style={{background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:12,padding:'10px 6px',textAlign:'center'}}>
                  <div style={{fontSize:20,fontWeight:800,color:'#059669'}}>{bo.total_redemptions}</div>
                  <div style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',color:'var(--text3)',marginTop:5}}>Redeemed</div>
                </div>
                <div style={{background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:12,padding:'10px 6px',textAlign:'center'}}>
                  <div style={{fontSize:20,fontWeight:800,color:'#0ea5e9'}}>{bo.with_code}</div>
                  <div style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',color:'var(--text3)',marginTop:5}}>With Code</div>
                </div>
                <div style={{background:'#f8fafc',border:'1px solid #f1f5f9',borderRadius:12,padding:'10px 6px',textAlign:'center'}}>
                  <div style={{fontSize:20,fontWeight:800,color:'#d97706'}}>{bo.without_code}</div>
                  <div style={{fontSize:9.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',color:'var(--text3)',marginTop:5}}>No Code</div>
                </div>
              </div>
              <div style={{marginTop:16,fontSize:12,color:'var(--text3)',display:'flex',alignItems:'center',gap:6}}>
                <span>{bo.total_games} game{bo.total_games === 1 ? '' : 's'} linked</span>
                <span style={{marginLeft:'auto'}}>View logs →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeBo && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'48px 16px',zIndex:1000,overflowY:'auto'}} onClick={() => setActiveBo(null)}>
          <div style={{background:'var(--surface)',borderRadius:20,width:'100%',maxWidth:1080,boxShadow:'0 30px 80px rgba(0,0,0,.3)',overflow:'hidden'}} onClick={e => e.stopPropagation()}>
            <div style={{padding:'22px 26px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,flexWrap:'wrap'}}>
              <div>
                <h2 style={{margin:0,fontFamily:"'Fraunces',serif",fontSize:22}}>{activeBo.business_name}</h2>
                <p style={{margin:'4px 0 0',fontSize:13,opacity:.85}}>🧩 Memory game activity</p>
              </div>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <button onClick={() => exportCSV(activeBo, entries)} disabled={!entries.length} style={{padding:'9px 16px',borderRadius:10,fontSize:12.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit',border:'none',background:'var(--surface)',color:'#5b21b6',opacity:entries.length ? 1 : .5}}>⬇ Download CSV</button>
                <button onClick={() => setActiveBo(null)} style={{padding:'9px 16px',borderRadius:10,fontSize:12.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit',border:'none',background:'rgba(255,255,255,.18)',color:'#fff'}}>Close</button>
              </div>
            </div>
            <div style={{display:'flex',gap:12,padding:'18px 26px',flexWrap:'wrap',alignItems:'flex-end',borderBottom:'1px solid #f1f5f9'}}>
              <div>
                <label style={{display:'block',fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:5,letterSpacing:'.04em'}}>Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{padding:'8px 12px',borderRadius:9,border:'1.5px solid #e2e8f0',fontSize:12.5,fontFamily:'inherit'}} />
              </div>
              <div>
                <label style={{display:'block',fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:5,letterSpacing:'.04em'}}>End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{padding:'8px 12px',borderRadius:9,border:'1.5px solid #e2e8f0',fontSize:12.5,fontFamily:'inherit'}} />
              </div>
              <button onClick={() => openBo(activeBo)} style={{padding:'9px 18px',borderRadius:9,border:'none',background:'var(--primary)',color:'#fff',fontSize:12.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Apply</button>
            </div>
            {entriesLoading ? (
              <div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>Loading logs…</div>
            ) : entries.length === 0 ? (
              <div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>No activity found</div>
            ) : (
              <div style={{maxHeight:520,overflow:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12.5}}>
                  <thead>
                    <tr>
                      <th style={{position:'sticky',top:0,background:'#f8fafc',color:'#475569',fontWeight:700,textAlign:'left',padding:'12px 14px',fontSize:11,textTransform:'uppercase',letterSpacing:'.03em',borderBottom:'1px solid #e8edf3',whiteSpace:'nowrap',zIndex:1}}>Player</th>
                      <th style={{position:'sticky',top:0,background:'#f8fafc',color:'#475569',fontWeight:700,textAlign:'left',padding:'12px 14px',fontSize:11,textTransform:'uppercase',letterSpacing:'.03em',borderBottom:'1px solid #e8edf3',whiteSpace:'nowrap',zIndex:1}}>Played At</th>
                      <th style={{position:'sticky',top:0,background:'#f8fafc',color:'#475569',fontWeight:700,textAlign:'left',padding:'12px 14px',fontSize:11,textTransform:'uppercase',letterSpacing:'.03em',borderBottom:'1px solid #e8edf3',whiteSpace:'nowrap',zIndex:1}}>Score</th>
                      <th style={{position:'sticky',top:0,background:'#f8fafc',color:'#475569',fontWeight:700,textAlign:'left',padding:'12px 14px',fontSize:11,textTransform:'uppercase',letterSpacing:'.03em',borderBottom:'1px solid #e8edf3',whiteSpace:'nowrap',zIndex:1}}>Redemption</th>
                      <th style={{position:'sticky',top:0,background:'#f8fafc',color:'#475569',fontWeight:700,textAlign:'left',padding:'12px 14px',fontSize:11,textTransform:'uppercase',letterSpacing:'.03em',borderBottom:'1px solid #e8edf3',whiteSpace:'nowrap',zIndex:1}}>6-Digit Code</th>
                      <th style={{position:'sticky',top:0,background:'#f8fafc',color:'#475569',fontWeight:700,textAlign:'left',padding:'12px 14px',fontSize:11,textTransform:'uppercase',letterSpacing:'.03em',borderBottom:'1px solid #e8edf3',whiteSpace:'nowrap',zIndex:1}}>Accepted At</th>
                      <th style={{position:'sticky',top:0,background:'#f8fafc',color:'#475569',fontWeight:700,textAlign:'left',padding:'12px 14px',fontSize:11,textTransform:'uppercase',letterSpacing:'.03em',borderBottom:'1px solid #e8edf3',whiteSpace:'nowrap',zIndex:1}}>Table #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((r, i) => {
                      const m = STATE_META[r.redemption_state] || STATE_META.played_not_redeemed
                      return (
                        <tr key={i} style={{borderBottom:'1px solid #f5f7fa'}}>
                          <td style={{padding:'12px 14px'}}>
                            <div style={{fontWeight:700,color:'var(--text)'}}>{r.player_name || '—'}</div>
                            <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{r.player_email || r.player_phone || 'Guest'}</div>
                          </td>
                          <td style={{padding:'12px 14px',whiteSpace:'nowrap'}}>{r.played_at ? new Date(r.played_at).toLocaleString() : '—'}</td>
                          <td style={{padding:'12px 14px'}}>{r.score}{r.total_scoreable ? ` / ${r.total_scoreable}` : ''}</td>
                          <td style={{padding:'12px 14px'}}><span style={{display:'inline-block',padding:'3px 9px',borderRadius:999,fontSize:10.5,fontWeight:700,background:m.bg,color:m.color}}>{m.label}</span></td>
                          <td style={{padding:'12px 14px'}}>{r.redemption_id ? (r.code_present ? `Yes (${r.code})` : 'No') : '—'}</td>
                          <td style={{padding:'12px 14px',whiteSpace:'nowrap'}}>{r.accepted_at ? new Date(r.accepted_at).toLocaleString() : '—'}</td>
                          <td style={{padding:'12px 14px'}}>{r.table_number || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{padding:'12px 26px',fontSize:11,color:'var(--text3)',borderTop:'1px solid #f1f5f9'}}>
              Showing {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
