import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'

export default function QuizRedemptionLogsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [redemptions, setRedemptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', start_date: '', end_date: '' })

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('game_id', id)
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      const [gameRes, redRes] = await Promise.all([
        api.get(`/games/${id}`),
        api.get(`/internal-team/redemption-logs?${params}`)
      ])
      setGame(gameRes.data.game)
      setRedemptions(redRes.data.redemptions || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const statusColor = (s) => {
    switch (s) {
      case 'pending': return 'var(--warning)'
      case 'code_revealed': return 'var(--primary)'
      case 'code_entered': return 'var(--primary)'
      case 'player_confirmed': return 'var(--success)'
      case 'completed': return 'var(--success)'
      case 'rejected': return 'var(--error)'
      default: return 'var(--text3)'
    }
  }

  const statusLabel = (s) => {
    switch (s) {
      case 'pending': return 'Pending'
      case 'code_revealed': return 'Code Revealed'
      case 'code_entered': return 'Code Entered'
      case 'player_confirmed': return 'Player Confirmed'
      case 'completed': return 'Completed'
      case 'rejected': return 'Rejected'
      default: return s
    }
  }

  const set = k => e => setFilters(f => ({ ...f, [k]: e.target.value }))

  const exportCSV = () => {
    const headers = ['ID', 'Player Name', 'Player Phone', 'Player Email', 'Status', 'Table Number', 'Accepted By', 'Accepted At', 'Rejected By', 'Rejected At', 'Reject Reason', 'Created At']
    const rows = redemptions.map(r => [
      r.id, r.player_name, r.player_phone, r.player_email, r.status,
      r.table_number || '', r.accepted_by_name || '', r.accepted_at || '', r.rejected_by_name || '', r.rejected_at || '',
      r.reject_reason || '', r.created_at
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `Quiz_Redemption_Logs.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",padding:'24px 0'}}>
      <div style={{padding:'0 24px',maxWidth:1200,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <button style={{width:36,height:36,borderRadius:8,border:'1.5px solid var(--border)',background:'var(--surface2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text)'}} onClick={() => navigate('/dashboard/games')} title="Back">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <h1 style={{fontFamily:"'Fraunces',serif",fontSize:28,fontWeight:600,color:'var(--text)',margin:0}}>{game?.name} — Redemption Logs</h1>
              <p style={{fontSize:13.5,color:'var(--text3)',marginTop:4}}>🧠 Redemption audit for this quiz</p>
            </div>
          </div>
          <button onClick={exportCSV} style={{padding:'8px 16px',borderRadius:8,border:'1.5px solid var(--border)',background:'var(--surface)',cursor:'pointer',fontSize:12,fontWeight:600,color:'var(--text)',fontFamily:'inherit'}}>Export CSV</button>
        </div>

        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div>
            <label style={{display:'block',fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:4}}>Status</label>
            <select value={filters.status} onChange={set('status')} style={{padding:'7px 12px',borderRadius:8,border:'1.5px solid var(--border)',fontSize:12,fontFamily:'inherit',background:'var(--surface)'}}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="code_revealed">Code Revealed</option>
              <option value="code_entered">Code Entered</option>
              <option value="player_confirmed">Player Confirmed</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label style={{display:'block',fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:4}}>Start Date</label>
            <input type="date" value={filters.start_date} onChange={set('start_date')} style={{padding:'6px 12px',borderRadius:8,border:'1.5px solid var(--border)',fontSize:12,fontFamily:'inherit'}} />
          </div>
          <div>
            <label style={{display:'block',fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',marginBottom:4}}>End Date</label>
            <input type="date" value={filters.end_date} onChange={set('end_date')} style={{padding:'6px 12px',borderRadius:8,border:'1.5px solid var(--border)',fontSize:12,fontFamily:'inherit'}} />
          </div>
          <button onClick={load} style={{padding:'7px 16px',borderRadius:8,border:'none',background:'var(--primary)',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Apply Filters</button>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>Loading...</div>
        ) : redemptions.length === 0 ? (
          <div style={{textAlign:'center',padding:40,color:'var(--text3)'}}>No redemptions found for this quiz</div>
        ) : (
          <div style={{overflowX:'auto',borderRadius:12,border:'1px solid var(--border)'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:'var(--surface2)',borderBottom:'1px solid var(--border)'}}>
                  <th style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'var(--text)'}}>ID</th>
                  <th style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'var(--text)'}}>Player</th>
                  <th style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'var(--text)'}}>Business Owner</th>
                  <th style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'var(--text)'}}>Status</th>
                  <th style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'var(--text)'}}>Table #</th>
                  <th style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'var(--text)'}}>Accepted / Rejected By</th>
                  <th style={{padding:'10px 12px',textAlign:'left',fontWeight:700,color:'var(--text)'}}>Date</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map(r => (
                  <tr key={r.id} style={{borderBottom:'1px solid var(--border-light)'}}>
                    <td style={{padding:'10px 12px',color:'var(--text2)'}}>{r.id}</td>
                    <td style={{padding:'10px 12px'}}>
                      <div style={{fontWeight:600,color:'var(--text)'}}>{r.player_name}</div>
                      <div style={{fontSize:10,color:'var(--text3)'}}>{r.player_phone}{r.table_number ? ` · Tbl ${r.table_number}` : ''}</div>
                    </td>
                    <td style={{padding:'10px 12px',color:'var(--text2)'}}>{r.business_name}</td>
                    <td style={{padding:'10px 12px'}}>
                      <span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:statusColor(r.status) + '22',color:statusColor(r.status)}}>{statusLabel(r.status)}</span>
                    </td>
                    <td style={{padding:'10px 12px',color:'var(--text2)'}}>{r.table_number || '-'}</td>
                    <td style={{padding:'10px 12px',fontSize:11}}>
                      {r.accepted_by_name && <div style={{color:'var(--success)'}}>✓ {r.accepted_by_name}</div>}
                      {r.rejected_by_name && <div style={{color:'var(--error)'}}>✕ {r.rejected_by_name}{r.reject_reason ? `: ${r.reject_reason}` : ''}</div>}
                      {!r.accepted_by_name && !r.rejected_by_name && <span style={{color:'var(--text3)'}}>-</span>}
                    </td>
                    <td style={{padding:'10px 12px',color:'var(--text2)',fontSize:11}}>
                      {r.accepted_at || r.rejected_at || r.created_at?.slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
