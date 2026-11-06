import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'

const FONT_URL = `https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,300;9..144,600&display=swap`

const CSS = `
@import url('${FONT_URL}');
.snk-dp *,.snk-dp *::before,.snk-dp *::after{box-sizing:border-box;margin:0;padding:0}
.snk-dp{font-family:'DM Sans',sans-serif;color:var(--text);background:var(--bg-secondary);min-height:100vh}
@keyframes snkFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes snkSpin{to{transform:rotate(360deg)}}
.snk-dp-input{width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid var(--border);font-size:14px;font-family:'DM Sans',sans-serif;color:var(--text);background:var(--surface2);outline:none;transition:border-color .15s,background .15s}
.snk-dp-input:focus{border-color:var(--primary);background:var(--surface)}
.snk-dp-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:10px;border:none;background:var(--primary);color:#fff;font-size:13.5px;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;letter-spacing:.01em;transition:background .14s,transform .1s}
.snk-dp-btn:hover{background:var(--primary-hover)}
.snk-dp-btn:disabled{opacity:.55;cursor:not-allowed}
`

const Ico = {
  search: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  download: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
  back: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  spin: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{animation:'snkSpin .75s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
}

export default function SnakeDataPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('completed_at')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/games/${id}/responses`)
    ]).then(([gameRes, respRes]) => {
      setGame(gameRes.data.game)
      setSessions(respRes.data.sessions || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const parsePlayerData = (raw) => {
    try { return typeof raw === 'string' ? JSON.parse(raw) : (raw || {}) }
    catch { return {} }
  }

  const rows = sessions.map(s => ({ session: s, playerData: parsePlayerData(s.player_data) }))
  const formKeys = rows.length > 0 ? Object.keys(rows[0].playerData) : []

  const filtered = rows.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return Object.values(r.playerData).some(v => v?.toString().toLowerCase().includes(q)) ||
      (r.session.score || 0).toString().includes(q)
  })

  const sorted = [...filtered].sort((a, b) => {
    let av, bv
    if (sortField === 'completed_at') { av = new Date(a.session.completed_at || 0).getTime(); bv = new Date(b.session.completed_at || 0).getTime() }
    else if (sortField === 'score') { av = a.session.score || 0; bv = b.session.score || 0 }
    else { av = (a.playerData[sortField] || '').toLowerCase(); bv = (b.playerData[sortField] || '').toLowerCase() }
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  })

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const completedCount = sessions.filter(s => s.completed).length
  const avgScore = sessions.length > 0 ? (sessions.reduce((a, s) => a + (s.score || 0), 0) / sessions.length).toFixed(1) : 0

  const downloadCSV = () => {
    const headers = ['#', ...formKeys, 'Score', 'Completed At', 'Source']
    const csvRows = sorted.map((r, i) => [
      i + 1,
      ...formKeys.map(k => `"${(r.playerData[k] || '').toString().replace(/"/g, '""')}"`),
      r.session.score || 0,
      r.session.completed_at ? new Date(r.session.completed_at).toLocaleString() : '',
      r.session.source_type === 'direct' ? 'Website' : 'Link'
    ])
    const csv = [headers.map(h => `"${h}"`).join(','), ...csvRows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${game?.name || 'snake'}_responses.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="snk-dp">
        <style>{CSS}</style>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',gap:10,color:'var(--text3)',fontSize:14}}>
          <Ico.spin/> Loading snake responses…
        </div>
      </div>
    )
  }

  return (
    <div className="snk-dp">
      <style>{CSS}</style>
      <div style={{padding:'36px 40px',maxWidth:1400,margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'auto 1fr 1.5fr auto',gap:20,alignItems:'center',marginBottom:28}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <button style={{width:36,height:36,borderRadius:8,border:'1.5px solid var(--border)',background:'var(--surface2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--text)',flexShrink:0}} onClick={() => navigate('/dashboard/games')} title="Back to Games">
              <Ico.back/>
            </button>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:'var(--text)',fontFamily:"'Fraunces',serif",lineHeight:1.2}}>
                {game?.name}
              </div>
              <div style={{fontSize:10,fontWeight:700,color:'var(--primary)',textTransform:'uppercase',letterSpacing:'.08em',marginTop:2}}>
                🐍 Snake Responses
              </div>
            </div>
          </div>

          <div style={{display:'flex',gap:10}}>
            {[
              { label:'Total', value: sessions.length, color:'var(--primary)' },
              { label:'Completed', value: completedCount, color:'var(--success)' },
              { label:'Avg Score', value: avgScore, color:'var(--warning)' },
            ].map(s => (
              <div key={s.label} style={{flex:1,background:'var(--surface)',borderRadius:10,border:'1.5px solid var(--border)',padding:'6px 14px',display:'flex',alignItems:'center',gap:8,height:38}}>
                <div style={{fontSize:17,fontWeight:700,color:s.color,fontFamily:"'Fraunces',serif",lineHeight:1,flex:1}}>{s.value}</div>
                <div style={{fontSize:8.5,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.05em',whiteSpace:'nowrap',flexShrink:0}}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',zIndex:1}}><Ico.search/></span>
            <input className="snk-dp-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, score..." style={{paddingLeft:38,fontSize:13.5,height:38,width:'100%'}} />
            {search && <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:10.5,fontWeight:600,color:'var(--primary)',whiteSpace:'nowrap',pointerEvents:'none'}}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>}
          </div>

          <button className="snk-dp-btn" onClick={downloadCSV} disabled={sorted.length === 0} style={{padding:'8px 18px',fontSize:12.5}}>
            <Ico.download/> Download Excel
          </button>
        </div>

        {sorted.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px 0'}}>
            <div style={{fontSize:48,marginBottom:16}}>🐍</div>
            <h3 style={{fontFamily:"'Fraunces',serif",fontWeight:600,fontSize:20,color:'var(--text)',marginBottom:8}}>
              {search ? 'No matching responses' : 'No responses yet'}
            </h3>
            <p style={{color:'var(--text3)',fontSize:14}}>
              {search ? 'Try adjusting your search terms' : 'Players who complete the snake game will appear here.'}
            </p>
          </div>
        ) : (
          <>
            <div style={{overflowX:'auto',borderRadius:14,border:'1.5px solid var(--border)',background:'var(--surface)',boxShadow:'0 4px 16px rgba(0,0,0,0.04)'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'var(--bg-secondary)',borderBottom:'2px solid var(--border)'}}>
                    <th style={{padding:'14px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.08em'}}>#</th>
                    {formKeys.map(k => (
                      <th key={k} onClick={() => handleSort(k)} style={{padding:'14px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:sortField === k ? 'var(--primary)' : 'var(--text2)',textTransform:'uppercase',letterSpacing:'.08em',cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'}}>
                        {k}
                      </th>
                    ))}
                    <th onClick={() => handleSort('score')} style={{padding:'14px 16px',textAlign:'center',fontSize:11,fontWeight:700,color:sortField === 'score' ? 'var(--primary)' : 'var(--text2)',textTransform:'uppercase',letterSpacing:'.08em',cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'}}>
                      Score
                    </th>
                    <th style={{padding:'14px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.08em'}}>
                      Completed
                    </th>
                    <th style={{padding:'14px 16px',textAlign:'center',fontSize:11,fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.08em'}}>
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, idx) => (
                    <tr key={r.session.id} style={{borderBottom:'1px solid var(--border-light)',background:idx % 2 === 0 ? 'var(--surface)' : 'var(--surface2)'}}>
                      <td style={{padding:'12px 16px',fontSize:13,color:'var(--text3)',fontWeight:600,fontFamily:'monospace'}}>{idx + 1}</td>
                      {formKeys.map(k => (
                        <td key={k} style={{padding:'12px 16px',fontSize:13.5,color:'var(--text)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {r.playerData[k] || <span style={{color:'var(--border-light)'}}>—</span>}
                        </td>
                      ))}
                      <td style={{padding:'12px 16px',fontSize:15,fontWeight:700,color:'var(--primary)',textAlign:'center'}}>
                        {r.session.score || 0}
                      </td>
                      <td style={{padding:'12px 16px',fontSize:12.5,color:'var(--text2)',whiteSpace:'nowrap'}}>
                        {r.session.completed_at ? new Date(r.session.completed_at).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}
                      </td>
                      <td style={{padding:'12px 16px',textAlign:'center'}}>
                        {r.session.source_type === 'direct'
                          ? <span style={{background:'var(--chip-primary-bg)',color:'var(--chip-primary-fg)',padding:'2px 10px',borderRadius:100,fontSize:11,fontWeight:700}}>🌐 Website</span>
                          : <span style={{background:'var(--chip-green-bg)',color:'var(--chip-green-fg)',padding:'2px 10px',borderRadius:100,fontSize:11,fontWeight:700}}>🔗 Link</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{marginTop:16,fontSize:12.5,color:'var(--text3)',textAlign:'right',fontWeight:500}}>
              Showing {sorted.length} of {sessions.length} response{sessions.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
