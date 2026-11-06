import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'
import { useUploadErrors, uploadErrorMessage } from '../../apps/frontend/src/lib/builderUpload'

const CELL = 40
const EMPTY = 0, WALL = 1, ARROW_R = 2, ARROW_D = 3, ARROW_L = 4, ARROW_U = 5, EXIT = 6
const TOOLS = [
  { id: WALL, label: '🧱 Wall', color: 'rgba(255,255,255,0.25)' },
  { id: ARROW_R, label: '→ Arrow', color: '#f59e0b' },
  { id: EXIT, label: '🏁 Exit', color: '#22c55e' },
  { id: EMPTY, label: '🧹 Erase', color: 'transparent' },
]
const ARROW_EMOJI = { 2: '→', 3: '↓', 4: '←', 5: '↑' }

const LIGHT = `.gb-wrap{--gb-bg:#f4f6fb;--gb-surface:#fff;--gb-border:#e2e6f0;--gb-primary:#f59e0b;--gb-text:#1e1e2e;--gb-text2:#64657a;--gb-text3:#9899ae;font-family:'DM Sans',sans-serif;background:var(--gb-bg);color:var(--gb-text);min-height:100vh}*{box-sizing:border-box}
.gb-wrap input,.gb-wrap select,.gb-wrap textarea{width:100%;font-family:inherit;font-size:14px;background:var(--gb-surface);border:none;border-bottom:1.5px solid var(--gb-border);border-radius:8px;color:var(--gb-text);padding:10px 12px 8px;outline:none}
.gb-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;font-size:13px;font-weight:600;border-radius:8px;border:none;cursor:pointer;font-family:inherit}
.gb-btn-primary{background:var(--gb-primary);color:#fff}
.gb-btn-ghost{background:var(--gb-surface);color:var(--gb-text2);border:1.5px solid var(--gb-border)}
.gb-card{background:var(--gb-surface);border:1.5px solid var(--gb-border);border-radius:12px;padding:16px;margin-bottom:16px}
.gb-label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gb-text2);margin-bottom:4px;display:block}
.gb-section-title{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--gb-primary);margin-bottom:12px}
.gb-toast{position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 18px;border-radius:10px;color:#fff;font-weight:600;font-size:13px}
`

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [])
  return <div className="gb-toast" style={{ background: type === 'success' ? '#16a34a' : '#dc2626' }}>{type === 'success' ? '✅' : '❌'} {msg}</div>
}

export default function ArrowEscapeBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('levels')
  const [toast, setToast] = useState(null)
  const [settings, setSettings] = useState({})
  const [levels, setLevels] = useState([])
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [grid, setGrid] = useState([])
  const [activeTool, setActiveTool] = useState(WALL)
  const [isDrawing, setIsDrawing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [levelName, setLevelName] = useState('')
  const upload = useUploadErrors()
  const showToast = (msg, type='success') => setToast({ msg, type })

  const loadData = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/arrowescape/${id}/settings`),
      api.get(`/arrowescape/${id}/levels`)
    ]).then(([gRes, sRes, lRes]) => {
      setGame(gRes.data.game)
      setSettings(sRes.data.settings || {})
      setLevels(lRes.data.levels || [])
    }).catch(err => showToast('Failed to load', 'error'))
    .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      const fields = ['heading_1','heading_2','heading_3','description_text','intro_text','outro_text','submit_button_text','continue_button_text','start_button_text','font_family','bg_color','primary_color','meta_description','heading_1_color','heading_2_color','heading_3_color','grid_rows','grid_cols','difficulty','show_timer','time_limit_seconds','sound_move_id','sound_win_id','sound_lose_id','start_button_text_color','start_button_bg_color']
      for (const f of fields) fd.append(f, settings[f] ?? '')
      if (settings._bgFile) fd.append('bg_image', settings._bgFile)
      else fd.append('bg_image_url', settings.bg_image_url || '')
      if (settings._logoFile) fd.append('game_logo', settings._logoFile)
      else fd.append('game_logo_url', settings.game_logo_url || '')
      await api.put(`/arrowescape/${id}/settings`, fd)
      showToast('Settings saved')
    } catch (err) {
      const msg = uploadErrorMessage(err)
      if (settings._bgFile) upload.setFieldError('bg_image_url', msg)
      if (settings._logoFile) upload.setFieldError('game_logo_url', msg)
      if (!settings._bgFile && !settings._logoFile) upload.setFieldError('bg_image_url', msg)
      showToast(msg, 'error')
    }
    setSaving(false)
  }

  const initGrid = (rows, cols) => {
    setGrid(Array.from({ length: rows }, () => Array(cols).fill(EMPTY)))
  }

  const createLevel = async () => {
    const rows = settings.grid_rows || 8, cols = settings.grid_cols || 8
    try {
      const res = await api.post(`/arrowescape/${id}/levels`, {
        level_name: levelName || `Level ${levels.length + 1}`,
        grid_rows: rows, grid_cols: cols,
        walls: [], arrows: [], exits: []
      })
      setLevels([...levels, res.data.level])
      selectLevel(res.data.level)
      setLevelName('')
      showToast('Level created')
    } catch (err) { showToast('Error creating level', 'error') }
  }

  const selectLevel = (lvl) => {
    setSelectedLevel(lvl)
    setGrid(JSON.parse(lvl.walls || '[]').length > 0
      ? (() => { const g = Array.from({ length: lvl.grid_rows }, () => Array(lvl.grid_cols).fill(EMPTY)); JSON.parse(lvl.walls || '[]').forEach(([r,c]) => g[r][c] = WALL); return g })()
      : Array.from({ length: lvl.grid_rows }, () => Array(lvl.grid_cols).fill(EMPTY))
    )
    setTab('editor')
  }

  const handleCellClick = (r, c) => {
    if (tab !== 'editor' || !selectedLevel) return
    const newGrid = grid.map(row => [...row])
    if (activeTool === ARROW_R) {
      newGrid[r][c] = newGrid[r][c] === ARROW_R ? ARROW_D : newGrid[r][c] === ARROW_D ? ARROW_L : newGrid[r][c] === ARROW_L ? ARROW_U : ARROW_R
    } else {
      newGrid[r][c] = newGrid[r][c] === activeTool ? EMPTY : activeTool
    }
    setGrid(newGrid)
  }

  const handleMouseDown = (r, c) => { setIsDrawing(true); handleCellClick(r, c) }
  const handleMouseEnter = (r, c) => { if (isDrawing) handleCellClick(r, c) }
  const handleMouseUp = () => setIsDrawing(false)

  const saveLevel = async () => {
    if (!selectedLevel) return
    setSaving(true)
    const walls = [], arrows = [], exits = []
    grid.forEach((row, r) => row.forEach((cell, c) => {
      if (cell === WALL) walls.push([r, c])
      else if (cell >= ARROW_R && cell <= ARROW_U) arrows.push({ r, c, dir: cell })
      else if (cell === EXIT) exits.push([r, c])
    }))
    try {
      await api.put(`/arrowescape/${id}/levels/${selectedLevel.id}`, {
        walls, arrows, exits,
        grid_rows: grid.length, grid_cols: grid[0]?.length || 8
      })
      showToast('Level saved')
      loadData()
    } catch (err) { showToast('Error saving level', 'error') }
    setSaving(false)
  }

  const deleteLevel = async (lvlId) => {
    if (!confirm('Delete this level?')) return
    try {
      await api.delete(`/arrowescape/${id}/levels/${lvlId}`)
      setLevels(levels.filter(l => l.id !== lvlId))
      if (selectedLevel?.id === lvlId) { setSelectedLevel(null); setTab('levels') }
      showToast('Level deleted')
    } catch (err) { showToast('Error', 'error') }
  }

  const gameLink = game ? `${window.location.origin}/play/${game.slug}/${game.client_slug}` : ''

  if (loading) return <div className="gb-wrap" style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}><style>{LIGHT}</style><div style={{ textAlign:'center' }}><div style={{ width:40,height:40,borderRadius:'50%',border:'3px solid #e2e6f0',borderTopColor:'#f59e0b',animation:'spin .8s linear infinite',margin:'0 auto 16px' }} />Loading…<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div></div>

  const TABS = [{ id:'levels', label:'Levels' },{ id:'editor', label:'Editor' },{ id:'settings', label:'Settings' }]
  const TAB_FIELDS = { settings: ['bg_image_url', 'game_logo_url'] }

  return (
    <div className="gb-wrap"><style>{LIGHT}</style>
      {/* Header */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr auto 1fr',background:'#fff',borderBottom:'1.5px solid var(--gb-border)',padding:'10px 28px',gap:'4px 20px',alignItems:'center',position:'sticky',top:'62px',zIndex:50 }}>
        <div style={{ display:'flex',gap:10,alignItems:'flex-start' }}>
          <button className="gb-btn gb-btn-ghost" onClick={() => navigate('/dashboard/games')} style={{ padding:'6px 8px',fontSize:16 }}>←</button>
          <div>
            <div style={{ fontWeight:700,fontSize:14 }}>{game?.name || 'Untitled'}</div>
            <div style={{ fontSize:9.5,fontWeight:600,color:'var(--gb-text3)',letterSpacing:'.04em',textTransform:'uppercase' }}>Arrow Escape Builder</div>
          </div>
        </div>
        <div style={{ display:'flex',gap:0,borderBottom:'2px solid var(--gb-border)' }}>
          {TABS.map(t => {
            const hasErr = upload.tabHasError(t.id, TAB_FIELDS[t.id] || [])
            return <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'6px 14px',fontSize:12.5,fontWeight:600,border:'none',background:'none',cursor:'pointer',color:tab===t.id?'var(--gb-primary)':'var(--gb-text2)',borderBottom:tab===t.id?'2px solid var(--gb-primary)':'2px solid transparent',marginBottom:-2 }}>{t.label}{hasErr && <span className="gb-tab-err-dot" />}</button>
          })}
        </div>
        <div style={{ display:'flex',gap:6,justifySelf:'end' }}>
          <a href={gameLink} target="_blank" rel="noreferrer" className="gb-btn gb-btn-ghost" style={{ padding:'6px 8px',fontSize:16,textDecoration:'none' }}>👁</a>
        </div>
      </div>

      <div style={{ maxWidth:1200,margin:'0 auto',padding:'24px 20px' }}>
        {/* LEVELS TAB */}
        {tab === 'levels' && (
          <div>
            <div className="gb-card">
              <div className="gb-section-title">📋 Create New Level</div>
              <div style={{ display:'flex',gap:8,alignItems:'flex-end' }}>
                <div style={{ flex:1 }}>
                  <span className="gb-label">Level Name</span>
                  <input value={levelName} onChange={e => setLevelName(e.target.value)} placeholder={`Level ${levels.length + 1}`} />
                </div>
                <button className="gb-btn gb-btn-primary" onClick={createLevel}>+ Add Level</button>
              </div>
            </div>

            <div className="gb-card">
              <div className="gb-section-title">📁 Levels ({levels.length})</div>
              {levels.length === 0 ? (
                <p style={{ color:'var(--gb-text3)',fontSize:13,textAlign:'center',padding:20 }}>No levels yet. Create your first level above.</p>
              ) : (
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12 }}>
                  {levels.map(lvl => (
                    <div key={lvl.id} onClick={() => selectLevel(lvl)} style={{
                      padding:16,borderRadius:12,border:'1.5px solid var(--gb-border)',cursor:'pointer',
                      background:selectedLevel?.id===lvl.id?'#FEF3C7':'var(--gb-surface)',
                      transition:'all 0.15s',
                    }}>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
                        <span style={{ fontWeight:600,fontSize:14 }}>{lvl.level_name}</span>
                        <button onClick={e => { e.stopPropagation(); deleteLevel(lvl.id) }} style={{ background:'none',border:'none',cursor:'pointer',fontSize:16,color:'#dc2626' }}>🗑️</button>
                      </div>
                      <div style={{ fontSize:12,color:'var(--gb-text3)' }}>
                        {lvl.grid_rows}×{lvl.grid_cols} | Order: {lvl.level_order}
                      </div>
                      <div style={{ display:'flex',gap:6,marginTop:8 }}>
                        <span style={{ fontSize:11,color:'var(--gb-text3)' }}>Walls: {JSON.parse(lvl.walls||'[]').length}</span>
                        <span style={{ fontSize:11,color:'var(--gb-text3)' }}>Arrows: {JSON.parse(lvl.arrows||'[]').length}</span>
                        <span style={{ fontSize:11,color:'var(--gb-text3)' }}>Exits: {JSON.parse(lvl.exits||'[]').length}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EDITOR TAB */}
        {tab === 'editor' && (
          <div>
            {!selectedLevel ? (
              <div className="gb-card" style={{ textAlign:'center',padding:40 }}>
                <p style={{ color:'var(--gb-text3)',fontSize:14 }}>Select a level from the Levels tab to edit.</p>
              </div>
            ) : (
              <div style={{ display:'grid',gridTemplateColumns:'auto 200px',gap:20,alignItems:'start' }}>
                {/* Grid Editor */}
                <div className="gb-card">
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
                    <span style={{ fontWeight:600 }}>{selectedLevel.level_name}</span>
                    <button className="gb-btn gb-btn-primary" onClick={saveLevel} disabled={saving}>{saving?'⏳ Saving…':'💾 Save Level'}</button>
                  </div>
                  <div
                    style={{ display:'inline-grid',gridTemplateColumns:`repeat(${selectedLevel.grid_cols},${CELL}px)`,gap:1,background:'rgba(0,0,0,0.05)',borderRadius:8,padding:2,cursor:'crosshair',userSelect:'none' }}
                    onMouseLeave={handleMouseUp}
                  >
                    {grid.map((row, r) => row.map((cell, c) => (
                      <div key={`${r}-${c}`}
                        onMouseDown={() => handleMouseDown(r, c)}
                        onMouseEnter={() => handleMouseEnter(r, c)}
                        onMouseUp={handleMouseUp}
                        style={{
                          width:CELL,height:CELL,display:'flex',alignItems:'center',justifyContent:'center',
                          background:cell===WALL?'rgba(139,92,246,0.2)':cell>=ARROW_R&&cell<=ARROW_U?'rgba(245,158,11,0.2)':cell===EXIT?'rgba(34,197,94,0.2)':'#fff',
                          borderRadius:4,border:`1px solid ${cell===WALL?'#8b5cf6':cell>=ARROW_R&&cell<=ARROW_U?'#f59e0b':cell===EXIT?'#22c55e':'#e5e7eb'}`,
                          fontSize:cell>=ARROW_R&&cell<=ARROW_U?20:cell===EXIT?18:0,fontWeight:700,
                          transition:'background 0.1s',
                        }}>
                        {ARROW_EMOJI[cell] || ''}
                        {cell === EXIT && '🏁'}
                      </div>
                    )))}
                  </div>
                </div>

                {/* Tool Palette */}
                <div className="gb-card">
                  <div className="gb-section-title">🔧 Tools</div>
                  {TOOLS.map(tool => (
                    <div key={tool.id} onClick={() => setActiveTool(tool.id)} style={{
                      padding:'10px 12px',borderRadius:8,marginBottom:6,cursor:'pointer',
                      background:activeTool===tool.id?'#FEF3C7':'transparent',
                      border:activeTool===tool.id?'2px solid #f59e0b':'2px solid transparent',
                      fontWeight:activeTool===tool.id?600:400,fontSize:13,transition:'all 0.15s',
                    }}>
                      {tool.label}
                    </div>
                  ))}
                  <div style={{ marginTop:16,padding:12,background:'#F9FAFB',borderRadius:8,fontSize:12,color:'var(--gb-text3)',lineHeight:1.6 }}>
                    <strong>How to use:</strong><br/>
                    • Click a cell to place<br/>
                    • Arrows rotate on click<br/>
                    • Click again to erase<br/>
                    • Drag to paint multiple
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div>
            <div className="gb-card">
              <div className="gb-section-title">⚙️ Game Settings</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div><span className="gb-label">Grid Rows</span><input type="number" min={4} max={20} value={settings.grid_rows||8} onChange={e => setSettings({...settings,grid_rows:parseInt(e.target.value)||8})} /></div>
                <div><span className="gb-label">Grid Cols</span><input type="number" min={4} max={20} value={settings.grid_cols||8} onChange={e => setSettings({...settings,grid_cols:parseInt(e.target.value)||8})} /></div>
                <div><span className="gb-label">Difficulty</span>
                  <select value={settings.difficulty||'medium'} onChange={e => setSettings({...settings,difficulty:e.target.value})}>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </div>
                <div><span className="gb-label">Heading 1</span><input value={settings.heading_1||''} onChange={e => setSettings({...settings,heading_1:e.target.value})} placeholder="Arrow Escape" /></div>
                <div><span className="gb-label">Heading 2</span><input value={settings.heading_2||''} onChange={e => setSettings({...settings,heading_2:e.target.value})} placeholder="Subtitle" /></div>
                <div><span className="gb-label">Background Color</span><input type="color" value={settings.bg_color||'#0f172a'} onChange={e => setSettings({...settings,bg_color:e.target.value})} style={{ width:'100%',height:40,borderRadius:8,cursor:'pointer' }} /></div>
                <div><span className="gb-label">Primary Color</span><input type="color" value={settings.primary_color||'#f59e0b'} onChange={e => setSettings({...settings,primary_color:e.target.value})} style={{ width:'100%',height:40,borderRadius:8,cursor:'pointer' }} /></div>
              </div>
            </div>
            <div style={{ display:'flex',justifyContent:'flex-end' }}>
              <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving}>{saving?'⏳ Saving…':'💾 Save Settings'}</button>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
