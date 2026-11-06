import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'

const LIGHT = `
.gb-wrap{--gb-bg:#f4f6fb;--gb-surface:#ffffff;--gb-surface2:#f0f2f8;--gb-border:#e2e6f0;--gb-primary:#3b82f6;--gb-primary-d:#2563eb;--gb-primary-g:rgba(59,130,246,0.15);--gb-success:#16a34a;--gb-danger:#dc2626;--gb-text:#1e1e2e;--gb-text2:#64657a;--gb-text3:#9899ae;--gb-shadow:0 2px 12px rgba(0,0,0,0.08);--gb-shadow-md:0 4px 24px rgba(0,0,0,0.10);--gb-radius:12px;--gb-radius-sm:8px;font-family:'DM Sans',sans-serif;background:var(--gb-bg);color:var(--gb-text);min-height:100vh}
.gb-wrap *,.gb-wrap *::before,.gb-wrap *::after{box-sizing:border-box}
.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]),.gb-wrap select,.gb-wrap textarea{width:100%;font-family:inherit;font-size:14px;background:var(--gb-surface);border:none;border-bottom:1.5px solid var(--gb-border);border-radius:8px;color:var(--gb-text);padding:10px 12px 8px;outline:none;transition:border-color .18s}
.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]):focus,.gb-wrap select:focus,.gb-wrap textarea:focus{border-bottom-color:#3b82f6;border-bottom-width:2px}
.gb-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;font-size:13px;font-weight:600;border-radius:var(--gb-radius-sm);border:none;cursor:pointer;transition:all .15s;white-space:nowrap;font-family:inherit}
.gb-btn:disabled{opacity:.5;cursor:not-allowed}
.gb-btn-primary{background:var(--gb-primary);color:#fff}
.gb-btn-primary:not(:disabled):hover{background:var(--gb-primary-d);transform:translateY(-1px);box-shadow:0 4px 12px var(--gb-primary-g)}
.gb-btn-ghost{background:var(--gb-surface);color:var(--gb-text2);border:1.5px solid var(--gb-border)}
.gb-card{background:var(--gb-surface);border:1.5px solid var(--gb-border);border-radius:var(--gb-radius);box-shadow:var(--gb-shadow)}
.gb-label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gb-text2);margin-bottom:4px;display:block}
.gb-section-title{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--gb-primary);margin-bottom:12px;display:flex;align-items:center;gap:6px}
.gb-tabs{display:flex;border-bottom:2px solid var(--gb-border);margin-bottom:24px;gap:0;overflow-x:auto}
.gb-tab{padding:10px 18px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;color:var(--gb-text2);border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .15s;white-space:nowrap;font-family:inherit}
.gb-tab.active{color:#3b82f6;border-bottom-color:#3b82f6}
.gb-row{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start}
.gb-col{flex:1;min-width:140px}
.gb-fg{display:flex;flex-direction:column;gap:4px;flex:1;min-width:120px}
.gb-swatch{width:28px;height:28px;border-radius:6px;border:2px solid var(--gb-border);cursor:pointer;flex-shrink:0}
.gb-toast{position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 18px;border-radius:10px;color:#fff;font-weight:600;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.15);animation:gb-slide-in .22s ease;font-family:'DM Sans',sans-serif;max-width:320px}
@keyframes gb-slide-in{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
`

const COLOR_PRESETS = ['#1a1a2e','#ffffff','#000000','#ef4444','#22c55e','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#0ea5e9']

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [])
  return (
    <div className="gb-toast" style={{ background: type === 'success' ? '#16a34a' : '#dc2626' }}>
      {type === 'success' ? '✅' : '❌'} {msg}
    </div>
  )
}

function ColorPicker({ value, onChange, label, noPresets }) {
  const [show, setShow] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setShow(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  return (
    <div ref={ref} style={{ position:'relative',display:'inline-flex',flexDirection:'column',gap:4 }}>
      {label && <span className="gb-label">{label}</span>}
      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
        <div className="gb-swatch" style={{ background: value || '#3b82f6' }} onClick={() => setShow(s => !s)} />
        <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#000000" style={{ width:90,fontSize:12,padding:'5px 8px' }} />
      </div>
      {show && (
        <div style={{ position:'absolute',top:'calc(100% + 6px)',left:0,zIndex:300,background:'#fff',border:'1.5px solid #e2e6f0',borderRadius:10,padding:12,boxShadow:'0 4px 24px rgba(0,0,0,0.1)',display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5,width:220 }}>
          {!noPresets && COLOR_PRESETS.map(c => (
            <div key={c} onClick={() => { onChange(c); setShow(false) }}
              style={{ width:22,height:22,background:c,borderRadius:4,cursor:'pointer',border: value===c ? '2px solid #3b82f6' : '1px solid #e2e6f0' }} />
          ))}
          <input type="color" value={value||'#000000'} onChange={e => onChange(e.target.value)}
            style={{ gridColumn:'span 7',width:'100%',height:28,padding:0,border:'none',background:'none',cursor:'pointer' }} />
          <button className="gb-btn gb-btn-ghost" style={{ width:'100%',fontSize:12,padding:'4px 8px' }} onClick={() => setShow(false)}>Close</button>
        </div>
      )}
    </div>
  )
}

export default function Connect4BuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [tab, setTab] = useState('gameplay')
  const [toast, setToast] = useState(null)
  const [settings, setSettings] = useState({})
  const [sounds, setSounds] = useState([])
  const [saving, setSaving] = useState(false)

  const showToast = (msg, type='success') => setToast({ msg, type })

  const loadData = useCallback(() => {
    setLoading(true); setFetchError(null)
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/connect4/${id}/settings`),
      api.get(`/sounds/games/${id}/sounds`)
    ]).then(([gRes, sRes, soundRes]) => {
      setGame(gRes.data.game)
      setSettings(sRes.data.settings || {})
      setSounds(soundRes.data.sounds || [])
    }).catch(err => {
      setFetchError(err.response?.data?.message || err.message || 'Failed to load')
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      const textFields = ['board_rows','board_cols','win_count','player_color','ai_color','board_color','difficulty','heading_1','heading_2','heading_3','description_text','intro_text','outro_text','submit_button_text','continue_button_text','start_button_text','font_family','show_timer','time_limit_seconds','sound_drop_id','sound_win_id','sound_draw_id','terms_enabled','terms_text','terms_url','meta_description','heading_1_color','heading_2_color','heading_3_color','description_color','intro_text_color','outro_text_color','thankyou_subtitle','thankyou_subtitle_color','submit_button_text_color','submit_button_bg_color','continue_button_text_color','continue_button_bg_color','start_button_text_color','start_button_bg_color','bg_color','primary_color']
      for (const f of textFields) fd.append(f, settings[f] ?? '')
      if (settings._bgFile) fd.append('bg_image', settings._bgFile)
      else fd.append('bg_image_url', settings.bg_image_url || '')
      if (settings._tyBgFile) fd.append('thankyou_bg_image', settings._tyBgFile)
      else fd.append('thankyou_bg_image_url', settings.thankyou_bg_image_url || '')
      if (settings._logoFile) fd.append('game_logo', settings._logoFile)
      else fd.append('game_logo_url', settings.game_logo_url || '')
      if (settings._gifFile) fd.append('submit_confirm_gif', settings._gifFile)
      else fd.append('submit_confirm_gif_url', settings.submit_confirm_gif_url || '')
      await api.put(`/connect4/${id}/settings`, fd)
      showToast('Settings saved')
    } catch (err) {
      showToast('Error: ' + (err.response?.data?.message || err.message), 'error')
    }
    setSaving(false)
  }

  const gameLink = game ? `${window.location.origin}/play/${game.slug}/${game.client_slug}` : ''
  const TABS = [
    { id:'gameplay', label:'Gameplay' },
    { id:'visuals', label:'Visuals' },
    { id:'thankyou', label:'Thank You' },
    { id:'sounds', label:'Audio' },
    { id:'settings', label:'Settings' },
  ]

  if (loading) return (
    <div className="gb-wrap" style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign:'center',color:'var(--gb-text2)' }}>
        <div style={{ width:40,height:40,borderRadius:'50%',border:'3px solid #e2e6f0',borderTopColor:'#3b82f6',animation:'spin .8s linear infinite',margin:'0 auto 16px' }} />
        Loading builder…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (fetchError) return (
    <div className="gb-wrap" style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign:'center',maxWidth:400 }}>
        <div style={{ fontSize:48,marginBottom:12 }}>⚠️</div>
        <h2 style={{ color:'var(--gb-danger)',marginBottom:8 }}>Builder Failed to Load</h2>
        <p style={{ color:'var(--gb-text2)',marginBottom:20 }}>{fetchError}</p>
        <div style={{ display:'flex',gap:8,justifyContent:'center' }}>
          <button className="gb-btn gb-btn-primary" onClick={loadData}>🔄 Retry</button>
          <button className="gb-btn gb-btn-ghost" onClick={() => navigate('/dashboard/games')}>← Back to Games</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="gb-wrap">
      <style>{LIGHT}</style>

      {/* Header */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr auto 1fr',background:'var(--gb-surface)',borderBottom:'1.5px solid var(--gb-border)',padding:'10px 28px',gap:'4px 20px',alignItems:'center',position:'sticky',top:0,zIndex:50,boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>
        <div style={{ display:'flex',gap:6,alignItems:'flex-start',justifySelf:'start' }}>
          <button className="gb-btn gb-btn-ghost" onClick={() => navigate('/dashboard/games')} style={{ padding:'6px 8px',fontSize:16,lineHeight:1,marginTop:1 }} title="Back to games">←</button>
          <div>
            <div style={{ fontWeight:700,fontSize:14,color:'var(--gb-text)',lineHeight:1.3 }}>{game?.name || 'Untitled'}</div>
            <div style={{ fontSize:9.5,fontWeight:600,color:'var(--gb-text3)',letterSpacing:'.04em',textTransform:'uppercase',marginTop:1 }}>Connect 4 Builder</div>
          </div>
        </div>

        <div className="gb-tabs" style={{ marginBottom:0,borderBottom:'none',justifySelf:'center' }}>
          {TABS.map(t => (
            <button key={t.id} className={`gb-tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)} style={{ padding:'6px 14px',fontSize:12.5 }}>{t.label}</button>
          ))}
        </div>

        <div style={{ display:'flex',gap:6,alignItems:'center',justifySelf:'end' }}>
          <button className="gb-btn gb-btn-ghost" style={{ padding:'6px 8px',fontSize:16,lineHeight:1 }}
            onClick={() => { navigator.clipboard.writeText(gameLink); showToast('Link copied!') }} title="Copy game link">🔗</button>
          <a href={gameLink} target="_blank" rel="noreferrer" className="gb-btn gb-btn-ghost" style={{ padding:'6px 8px',fontSize:16,lineHeight:1,textDecoration:'none' }} title="Preview game">👁</a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1200,margin:'0 auto',padding:'24px 0 24px 20px',display:'grid',gridTemplateColumns:'1fr 320px',gap:24,alignItems:'start' }}>
        <div>
          {tab === 'gameplay' && (
            <div>
              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">🎮 Board Settings</div>
                <div className="gb-row">
                  <div className="gb-fg">
                    <span className="gb-label">Board Rows</span>
                    <input type="number" min={4} max={10} value={settings.board_rows??6} onChange={e => setSettings({...settings, board_rows: parseInt(e.target.value)||6 })} />
                  </div>
                  <div className="gb-fg">
                    <span className="gb-label">Board Columns</span>
                    <input type="number" min={4} max={10} value={settings.board_cols??7} onChange={e => setSettings({...settings, board_cols: parseInt(e.target.value)||7 })} />
                  </div>
                  <div className="gb-fg">
                    <span className="gb-label">Win Count</span>
                    <input type="number" min={3} max={6} value={settings.win_count??4} onChange={e => setSettings({...settings, win_count: parseInt(e.target.value)||4 })} />
                  </div>
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">🤖 AI Settings</div>
                <div className="gb-row">
                  <div className="gb-fg">
                    <span className="gb-label">Difficulty</span>
                    <select value={settings.difficulty||'medium'} onChange={e => setSettings({...settings, difficulty: e.target.value })}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">🎨 Colors</div>
                <div className="gb-row">
                  <ColorPicker label="Player Color" value={settings.player_color||'#ef4444'} onChange={v => setSettings({...settings,player_color:v})} />
                  <ColorPicker label="AI Color" value={settings.ai_color||'#fbbf24'} onChange={v => setSettings({...settings,ai_color:v})} />
                  <ColorPicker label="Board Color" value={settings.board_color||'#3b82f6'} onChange={v => setSettings({...settings,board_color:v})} />
                </div>
              </div>

              <div style={{ display:'flex',justifyContent:'flex-end' }}>
                <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px',marginTop:16 }}>
                  {saving ? '⏳ Saving…' : '💾 Save Settings'}
                </button>
              </div>
            </div>
          )}

          {tab === 'visuals' && (
            <div>
              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">🖼 Images</div>
                <div className="gb-row">
                  <div className="gb-fg">
                    <span className="gb-label">Background Image</span>
                    <input type="file" accept="image/*" onChange={e => { const f=e.target.files[0]; if(f){const r=new FileReader(); r.onload=ev=>setSettings({...settings,bg_image_url:ev.target.result,_bgFile:f}); r.readAsDataURL(f)} }} />
                  </div>
                  <div className="gb-fg">
                    <span className="gb-label">Game Logo</span>
                    <input type="file" accept="image/*" onChange={e => { const f=e.target.files[0]; if(f){const r=new FileReader(); r.onload=ev=>setSettings({...settings,game_logo_url:ev.target.result,_logoFile:f}); r.readAsDataURL(f)} }} />
                  </div>
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">🎨 Theme</div>
                <div className="gb-row">
                  <ColorPicker label="Background Color" value={settings.bg_color||'#0f172a'} onChange={v => setSettings({...settings,bg_color:v})} />
                  <ColorPicker label="Primary Color" value={settings.primary_color||'#3b82f6'} onChange={v => setSettings({...settings,primary_color:v})} />
                </div>
              </div>

              <div style={{ display:'flex',justifyContent:'flex-end' }}>
                <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px',marginTop:16 }}>
                  {saving ? '⏳ Saving…' : '💾 Save Settings'}
                </button>
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div>
              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">⚙️ General</div>
                <div className="gb-fg">
                  <span className="gb-label">Meta Description</span>
                  <textarea rows={2} value={settings.meta_description||''} onChange={e => setSettings({...settings,meta_description:e.target.value})} style={{ resize:'vertical' }} />
                </div>
              </div>
              <div style={{ display:'flex',justifyContent:'flex-end' }}>
                <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px',marginTop:16 }}>
                  {saving ? '⏳ Saving…' : '💾 Save Settings'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div style={{ position:'sticky',top:80 }}>
          <div style={{ background:'var(--gb-surface)',border:'1.5px solid var(--gb-border)',borderRadius:20,overflow:'hidden',boxShadow:'var(--gb-shadow-md)' }}>
            <div style={{ padding:'12px 16px',borderBottom:'1.5px solid var(--gb-border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <span style={{ fontSize:11,fontWeight:700,color:'var(--gb-text3)',textTransform:'uppercase',letterSpacing:'.05em' }}>Preview</span>
            </div>
            <div style={{ padding:12 }}>
              <div style={{ width:'100%',aspectRatio:'9/16',maxHeight:500,borderRadius:12,overflow:'hidden',background:settings.bg_color||'#0f172a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative' }}>
                <div style={{ fontSize:16,fontWeight:800,color:settings.heading_1_color||'#fff',textAlign:'center',padding:'0 12px' }}>{settings.heading_1 || 'Connect 4'}</div>
                <div style={{ display:'inline-grid',gridTemplateColumns:`repeat(${settings.board_cols||7},24px)`,gap:4,padding:8,background:settings.board_color||'#3b82f6',borderRadius:8,marginTop:12 }}>
                  {Array.from({ length: (settings.board_rows||6) * (settings.board_cols||7) }, (_, i) => (
                    <div key={i} style={{ width:24,height:24,borderRadius:'50%',background:'rgba(0,0,0,0.3)' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
