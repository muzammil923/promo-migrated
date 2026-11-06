import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'

const STATE_META = {
  played_not_redeemed:  { label: 'Played · Not Redeemed', color: '#64748b', bg: '#f1f5f9' },
  accepted_with_code:   { label: 'Accepted · 6-digit code', color: '#059669', bg: '#dcfce7' },
  accepted_without_code:{ label: 'Accepted · no code',      color: '#b45309', bg: '#fef3c7' },
}

const csvCell = (v) => { const s = v == null ? '' : String(v); return `"${s.replace(/"/g, '""')}"` }

export default function WordSearchDataBOPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [gameRes, entriesRes] = await Promise.all([
        api.get(`/games/${id}`),
        api.get(`/internal-team/bo-logs/game/${id}?start_date=${startDate}&end_date=${endDate}`).catch(() => ({ data: { entries: [] } }))
      ])
      setGame(gameRes.data.game)
      setEntries(entriesRes.data.entries || [])
    } catch {}
    setLoading(false)
  }, [id, startDate, endDate])

  useEffect(() => { load() }, [load])

  const exportCSV = () => {
    const formKeys = []
    entries.forEach(r => Object.keys(r.player_data || {}).forEach(k => { if (!formKeys.includes(k)) formKeys.push(k) }))
    const headers = ['Session ID', 'Player Name', 'Player Email', 'Played At', 'Completed', 'Score', ...formKeys, 'Redemption', '6-Digit Code', 'Accepted At', 'Accepted By', 'Table #']
    const lines = [headers.map(csvCell).join(',')]
    entries.forEach(r => {
      const m = STATE_META[r.redemption_state] || STATE_META.played_not_redeemed
      lines.push([r.session_id, r.player_name, r.player_email, r.played_at, r.completed ? 'Yes' : 'No', r.score, ...formKeys.map(k => r.player_data?.[k] ?? ''), m.label, r.code_present ? 'Yes' : 'No', r.accepted_at || '', r.accepted_by_name || '', r.table_number || ''].map(csvCell).join(','))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `WordSearch_BO_Logs_${game?.name || id}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div style={{fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text3)'}}>
        Loading wordsearch BO logs…
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
            <p style={{fontSize:13.5,color:'var(--text3)',marginTop:4}}>🔍 Business owner activity for this wordsearch game</p>
          </div>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{padding:'7px 12px',borderRadius:8,border:'1.5px solid var(--border)',fontSize:12,fontFamily:'inherit'}} />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{padding:'7px 12px',borderRadius:8,border:'1.5px solid var(--border)',fontSize:12,fontFamily:'inherit'}} />
          <button onClick={load} style={{padding:'7px 16px',borderRadius:8,border:'none',background:'var(--primary)',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Apply</button>
          <button onClick={exportCSV} disabled={!entries.length} style={{padding:'8px 16px',borderRadius:8,border:'1.5px solid var(--border)',background:'var(--surface)',cursor:'pointer',fontSize:12,fontWeight:600,color:'var(--text)',fontFamily:'inherit',opacity:entries.length ? 1 : .5}}>Export CSV</button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div style={{textAlign:'center',padding:64,color:'var(--text3)'}}>No BO log entries found for this wordsearch game</div>
      ) : (
        <div style={{overflowX:'auto',borderRadius:12,border:'1px solid var(--border)'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:'var(--surface2)',borderBottom:'1px solid var(--border)'}}>
                <th style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'var(--text)'}}>Player</th>
                <th style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'var(--text)'}}>Played At</th>
                <th style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'var(--text)'}}>Score</th>
                <th style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'var(--text)'}}>Redemption</th>
                <th style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'var(--text)'}}>6-Digit Code</th>
                <th style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'var(--text)'}}>Accepted At</th>
                <th style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'var(--text)'}}>Accepted By</th>
                <th style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'var(--text)'}}>Table #</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((r, i) => {
                const m = STATE_META[r.redemption_state] || STATE_META.played_not_redeemed
                return (
                  <tr key={i} style={{borderBottom:'1px solid var(--border-light)'}}>
                    <td style={{padding:'10px 12px'}}>
                      <div style={{fontWeight:600,color:'var(--text)'}}>{r.player_name || '—'}</div>
                      <div style={{fontSize:10,color:'var(--text3)'}}>{r.player_email || r.player_phone || 'Guest'}</div>
                    </td>
                    <td style={{padding:'10px 12px',whiteSpace:'nowrap'}}>{r.played_at ? new Date(r.played_at).toLocaleString() : '—'}</td>
                    <td style={{padding:'10px 12px'}}>{r.score}{r.total_scoreable ? ` / ${r.total_scoreable}` : ''}</td>
                    <td style={{padding:'10px 12px'}}><span style={{display:'inline-block',padding:'3px 9px',borderRadius:999,fontSize:10.5,fontWeight:700,background:m.bg,color:m.color,whiteSpace:'nowrap'}}>{m.label}</span></td>
                    <td style={{padding:'10px 12px'}}>{r.redemption_id ? (r.code_present ? `Yes (${r.code})` : 'No') : '—'}</td>
                    <td style={{padding:'10px 12px',whiteSpace:'nowrap'}}>{r.accepted_at ? new Date(r.accepted_at).toLocaleString() : '—'}</td>
                    <td style={{padding:'10px 12px'}}>{r.accepted_by_name || '—'}</td>
                    <td style={{padding:'10px 12px'}}>{r.table_number || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{marginTop:12,fontSize:11,color:'var(--text3)'}}>
        Showing {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}
      </div>
    </div>
  )
}
