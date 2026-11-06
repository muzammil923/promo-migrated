import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'
import CanvaDesignButton from '../../apps/frontend/src/components/CanvaDesignButton'

const LIGHT = `
.gb-wrap{--gb-bg:#f4f6fb;--gb-surface:#ffffff;--gb-surface2:#f0f2f8;--gb-border:#e2e6f0;--gb-primary:#f59e0b;--gb-primary-d:#d97706;--gb-primary-g:rgba(245,158,11,0.15);--gb-success:#16a34a;--gb-danger:#dc2626;--gb-text:#1e1e2e;--gb-text2:#64657a;--gb-text3:#9899ae;--gb-shadow:0 2px 12px rgba(0,0,0,0.08);--gb-shadow-md:0 4px 24px rgba(0,0,0,0.10);--gb-radius:12px;--gb-radius-sm:8px;font-family:'DM Sans',sans-serif;background:var(--gb-bg);color:var(--gb-text);min-height:100vh}
.gb-wrap *,.gb-wrap *::before,.gb-wrap *::after{box-sizing:border-box}
.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]),.gb-wrap select,.gb-wrap textarea{width:100%;font-family:inherit;font-size:14px;background:var(--gb-surface);border:none;border-bottom:1.5px solid var(--gb-border);border-radius:8px;color:var(--gb-text);padding:10px 12px 8px;outline:none;transition:border-color .18s}
.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]):focus,.gb-wrap select:focus,.gb-wrap textarea:focus{border-bottom-color:#f59e0b;border-bottom-width:2px}
.gb-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;font-size:13px;font-weight:600;border-radius:var(--gb-radius-sm);border:none;cursor:pointer;transition:all .15s;white-space:nowrap;font-family:inherit}
.gb-btn:disabled{opacity:.5;cursor:not-allowed}
.gb-btn-primary{background:var(--gb-primary);color:#fff}
.gb-btn-primary:not(:disabled):hover{background:var(--gb-primary-d);transform:translateY(-1px);box-shadow:0 4px 12px var(--gb-primary-g)}
.gb-btn-ghost{background:var(--gb-surface);color:var(--gb-text2);border:1.5px solid var(--gb-border)}
.gb-btn-ghost:not(:disabled):hover{border-color:var(--gb-primary);color:var(--gb-primary)}
.gb-btn-danger{background:#fee2e2;color:var(--gb-danger);border:1.5px solid #fecaca}
.gb-btn-sm{padding:5px 10px;font-size:12px}
.gb-card{background:var(--gb-surface);border:1.5px solid var(--gb-border);border-radius:var(--gb-radius);box-shadow:var(--gb-shadow)}
.gb-label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gb-text2);margin-bottom:4px;display:block}
.gb-section{background:var(--gb-surface2);border:1px solid var(--gb-border);border-radius:var(--gb-radius);padding:16px;margin-bottom:14px}
.gb-section-title{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--gb-primary);margin-bottom:12px;display:flex;align-items:center;gap:6px}
.gb-tabs{display:flex;border-bottom:2px solid var(--gb-border);margin-bottom:24px;gap:0;overflow-x:auto}
.gb-tab{padding:10px 18px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;color:var(--gb-text2);border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .15s;white-space:nowrap;font-family:inherit}
.gb-tab.active{color:#f59e0b;border-bottom-color:#f59e0b}
.gb-row{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start}
.gb-col{flex:1;min-width:140px}
.gb-fg{display:flex;flex-direction:column;gap:4px;flex:1;min-width:120px}
.gb-swatch{width:28px;height:28px;border-radius:6px;border:2px solid var(--gb-border);cursor:pointer;flex-shrink:0}
.gb-cpop{position:absolute;top:calc(100% + 6px);left:0;z-index:300;background:var(--gb-surface);border:1.5px solid var(--gb-border);border-radius:10px;padding:12px;box-shadow:var(--gb-shadow-md);display:grid;grid-template-columns:repeat(7,1fr);gap:5px;width:220px}
.gb-toast{position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 18px;border-radius:10px;color:#fff;font-weight:600;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.15);animation:gb-slide-in .22s ease;font-family:'DM Sans',sans-serif;max-width:320px}
@keyframes gb-slide-in{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
`

const COLOR_PRESETS = ['#1a1a2e','#ffffff','#000000','#ef4444','#22c55e','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#0ea5e9']
const FONT_CATEGORIES = [
  { name:'Professional', fonts:['Inter','Work Sans','Source Sans 3','Lato','Open Sans','Roboto','Nunito','DM Sans','Poppins','Rubik','Exo 2','Cabin'] },
  { name:'Modern Casual', fonts:['Montserrat','Syne','Raleway','Quicksand','Josefin Sans','Space Grotesk','Plus Jakarta Sans','Outfit','Sora','Manrope','Lexend','Figtree'] },
]

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
        <div className="gb-swatch" style={{ background: value || '#f59e0b' }} onClick={() => setShow(s => !s)} />
        <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#000000" style={{ width:90,fontSize:12,padding:'5px 8px' }} />
      </div>
      {show && (
        <div className="gb-cpop" style={noPresets ? { display:'flex',flexDirection:'column',gap:6,padding:10 } : {}}>
          {!noPresets && COLOR_PRESETS.map(c => (
            <div key={c} onClick={() => { onChange(c); setShow(false) }}
              style={{ width:22,height:22,background:c,borderRadius:4,cursor:'pointer',border: value===c ? '2px solid #f59e0b' : '1px solid #e2e6f0' }} />
          ))}
          <input type="color" value={value||'#000000'} onChange={e => onChange(e.target.value)}
            style={{ gridColumn:'span 7',width:'100%',height:28,padding:0,border:'none',background:'none',cursor:'pointer' }} />
          <button className="gb-btn gb-btn-ghost gb-btn-sm" style={{ width:'100%' }} onClick={() => setShow(false)}>Close</button>
        </div>
      )}
    </div>
  )
}

function ImageUpload({ label, url, onFile, onClear }) {
  const ref = useRef()
  return (
    <div>
      {label && <span className="gb-label">{label}</span>}
      <input type="file" ref={ref} accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" style={{ display:'none' }}
        onChange={e => { const f=e.target.files[0]; if(f) onFile(f) }} />
      <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginTop:4 }}>
        <button className="gb-btn gb-btn-ghost gb-btn-sm" type="button" onClick={() => ref.current.click()}>📷 Upload</button>
        {url && <img src={url} style={{ height:44,width:'auto',maxWidth:120,borderRadius:6,border:'1px solid var(--gb-border)',objectFit:'contain',background:'#f9f9f9' }} alt="" />}
        {url && <button className="gb-btn gb-btn-danger gb-btn-sm" type="button" onClick={onClear}>✕</button>}
      </div>
    </div>
  )
}

export default function FlappyBuilderPage() {
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
  const [slugInput, setSlugInput] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [redirectUrl, setRedirectUrl] = useState('')

  const showToast = (msg, type='success') => setToast({ msg, type })

  const loadData = useCallback(() => {
    setLoading(true); setFetchError(null)
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/flappy/${id}/settings`),
      api.get(`/sounds/games/${id}/sounds`)
    ]).then(([gRes, sRes, soundRes]) => {
      const g = gRes.data.game; setGame(g)
      const s = sRes.data.settings || {}; setSettings(s)
      setSounds(soundRes.data.sounds || [])
      setSlugInput(g.slug || '')
      setRedirectUrl(g.redirect_url || '')
    }).catch(err => {
      setFetchError(err.response?.data?.message || err.message || 'Failed to load')
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const font = settings.font_family
    if (!font || font === 'DM Sans') return
    const fid = 'gf-' + font.replace(/\s/g, '-')
    if (document.getElementById(fid)) return
    const link = document.createElement('link')
    link.id = fid; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(font) + ':wght@400;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [settings.font_family])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      const textFields = ['gravity','flap_strength','pipe_speed','pipe_gap','pipe_width','bird_color','pipe_color','ground_color','sky_color','heading_1','heading_2','heading_3','description_text','intro_text','outro_text','submit_button_text','continue_button_text','start_button_text','font_family','show_timer','time_limit_seconds','sound_flap_id','sound_score_id','sound_gameover_id','terms_enabled','terms_text','terms_url','meta_description','heading_1_color','heading_2_color','heading_3_color','description_color','intro_text_color','outro_text_color','thankyou_subtitle','thankyou_subtitle_color','submit_button_text_color','submit_button_bg_color','continue_button_text_color','continue_button_bg_color','start_button_text_color','start_button_bg_color','bg_color','primary_color']
      for (const f of textFields) fd.append(f, settings[f] ?? '')
      if (settings._bgFile) fd.append('bg_image', settings._bgFile)
      else fd.append('bg_image_url', settings.bg_image_url || '')
      if (settings._tyBgFile) fd.append('thankyou_bg_image', settings._tyBgFile)
      else fd.append('thankyou_bg_image_url', settings.thankyou_bg_image_url || '')
      if (settings._logoFile) fd.append('game_logo', settings._logoFile)
      else fd.append('game_logo_url', settings.game_logo_url || '')
      if (settings._gifFile) fd.append('submit_confirm_gif', settings._gifFile)
      else fd.append('submit_confirm_gif_url', settings.submit_confirm_gif_url || '')
      await api.put(`/flappy/${id}/settings`, fd)
      await api.put(`/games/${id}`, { redirect_url: redirectUrl, slug: slugInput.trim() || undefined })
      showToast('Settings saved')
    } catch (err) {
      showToast('Error: ' + (err.response?.data?.message || err.message), 'error')
    }
    setSaving(false)
  }

  const saveGameName = async () => {
    if (!nameInput.trim()) return
    try {
      await api.put(`/games/${id}`, { name: nameInput.trim() })
      setGame(prev => ({ ...prev, name: nameInput.trim() }))
      showToast('Game name saved')
    } catch { showToast('Error saving name', 'error') }
    setEditingName(false)
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
        <div style={{ width:40,height:40,borderRadius:'50%',border:'3px solid #e2e6f0',borderTopColor:'#f59e0b',animation:'spin .8s linear infinite',margin:'0 auto 16px' }} />
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

      <div style={{
        display:'grid',gridTemplateColumns:'1fr auto 1fr',
        background:'var(--gb-surface)',borderBottom:'1.5px solid var(--gb-border)',
        padding:'10px 28px',gap:'4px 20px',alignItems:'center',
        position:'sticky',top:0,zIndex:50,boxShadow:'0 1px 8px rgba(0,0,0,.06)'
      }}>
        <div style={{ display:'flex',gap:6,alignItems:'flex-start',justifySelf:'start' }}>
          <button className="gb-btn gb-btn-ghost gb-btn-sm" onClick={() => navigate('/dashboard/games')}
            style={{ padding:'6px 8px',fontSize:16,lineHeight:1,marginTop:1 }} title="Back to games">←</button>
          <div>
            {editingName ? (
              <div style={{ display:'flex',gap:4,alignItems:'center' }}>
                <input value={nameInput} onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter') saveGameName(); if (e.key==='Escape') setEditingName(false) }}
                  onBlur={saveGameName} autoFocus style={{ width:180,fontSize:14,fontWeight:700,padding:'3px 6px' }} />
                <button className="gb-btn gb-btn-ghost gb-btn-sm" onClick={() => setEditingName(false)} style={{ padding:'2px 6px' }}>✕</button>
              </div>
            ) : (
              <div style={{ fontWeight:700,fontSize:14,color:'var(--gb-text)',cursor:'pointer',lineHeight:1.3 }}
                onClick={() => { setNameInput(game?.name||''); setEditingName(true) }} title="Click to edit">
                {game?.name} <span style={{ fontSize:10,color:'var(--gb-text3)',fontWeight:400 }}>✎</span>
              </div>
            )}
            <div style={{ fontSize:9.5,fontWeight:600,color:'var(--gb-text3)',letterSpacing:'.04em',textTransform:'uppercase',marginTop:1 }}>Flappy Bird Builder</div>
          </div>
        </div>

        <div className="gb-tabs" style={{ marginBottom:0,borderBottom:'none',justifySelf:'center' }}>
          {TABS.map(t => (
            <button key={t.id} className={`gb-tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}
              style={{ padding:'6px 14px',fontSize:12.5 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display:'flex',gap:6,alignItems:'center',justifySelf:'end' }}>
          <button className="gb-btn gb-btn-ghost gb-btn-sm" style={{ padding:'6px 8px',fontSize:16,lineHeight:1 }}
            onClick={() => { navigator.clipboard.writeText(gameLink); showToast('Link copied!') }}
            title="Copy game link">🔗</button>
          <a href={gameLink} target="_blank" rel="noreferrer" className="gb-btn gb-btn-ghost gb-btn-sm"
            style={{ padding:'6px 8px',fontSize:16,lineHeight:1,textDecoration:'none' }}
            title="Preview game">👁</a>
        </div>
      </div>

      <div style={{ maxWidth:1200,margin:'0 auto',padding:'24px 0 24px 20px',display:'grid',gridTemplateColumns:'1fr 320px',gap:24,alignItems:'start' }}>
        <div>
          {tab === 'gameplay' && (
            <div>
              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">🐦 Physics</div>
                <div className="gb-row">
                  <div className="gb-fg">
                    <span className="gb-label">Gravity</span>
                    <input type="number" step="0.1" min="0.1" max="2" value={settings.gravity??0.5}
                      onChange={e => setSettings({...settings, gravity: parseFloat(e.target.value)||0.5 })} />
                  </div>
                  <div className="gb-fg">
                    <span className="gb-label">Flap Strength</span>
                    <input type="number" step="0.5" min="-15" max="-3" value={settings.flap_strength??-8}
                      onChange={e => setSettings({...settings, flap_strength: parseFloat(e.target.value)||-8 })} />
                  </div>
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title"> Pipes</div>
                <div className="gb-row">
                  <div className="gb-fg">
                    <span className="gb-label">Pipe Speed</span>
                    <input type="number" step="0.5" min="1" max="10" value={settings.pipe_speed??3}
                      onChange={e => setSettings({...settings, pipe_speed: parseFloat(e.target.value)||3 })} />
                  </div>
                  <div className="gb-fg">
                    <span className="gb-label">Pipe Gap (px)</span>
                    <input type="number" step="10" min="80" max="250" value={settings.pipe_gap??150}
                      onChange={e => setSettings({...settings, pipe_gap: parseInt(e.target.value)||150 })} />
                  </div>
                  <div className="gb-fg">
                    <span className="gb-label">Pipe Width (px)</span>
                    <input type="number" step="5" min="30" max="100" value={settings.pipe_width??60}
                      onChange={e => setSettings({...settings, pipe_width: parseInt(e.target.value)||60 })} />
                  </div>
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">🎨 Game Colors</div>
                <div className="gb-row">
                  <ColorPicker label="Bird Color" value={settings.bird_color||'#f59e0b'} onChange={v => setSettings({...settings,bird_color:v})} />
                  <ColorPicker label="Pipe Color" value={settings.pipe_color||'#22c55e'} onChange={v => setSettings({...settings,pipe_color:v})} />
                  <ColorPicker label="Ground Color" value={settings.ground_color||'#8B4513'} onChange={v => setSettings({...settings,ground_color:v})} />
                  <ColorPicker label="Sky Color" value={settings.sky_color||'#87CEEB'} onChange={v => setSettings({...settings,sky_color:v})} />
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">📝 Game Texts</div>
                <div className="gb-row">
                  <div className="gb-fg"><span className="gb-label">Heading 1</span>
                    <input value={settings.heading_1||''} onChange={e => setSettings({...settings,heading_1:e.target.value})} placeholder="Flappy Bird" /></div>
                  <ColorPicker value={settings.heading_1_color||'#1a1a2e'} onChange={v => setSettings({...settings,heading_1_color:v})} noPresets />
                </div>
                <div className="gb-row" style={{ marginTop:8 }}>
                  <div className="gb-fg"><span className="gb-label">Heading 2</span>
                    <input value={settings.heading_2||''} onChange={e => setSettings({...settings,heading_2:e.target.value})} placeholder="Subtitle" /></div>
                  <ColorPicker value={settings.heading_2_color||'#666666'} onChange={v => setSettings({...settings,heading_2_color:v})} noPresets />
                </div>
                <div className="gb-row" style={{ marginTop:8 }}>
                  <div className="gb-fg"><span className="gb-label">Intro Text</span>
                    <textarea rows={2} value={settings.intro_text||''} onChange={e => setSettings({...settings,intro_text:e.target.value})} style={{ resize:'vertical' }} placeholder="Tap or press Space to fly!" /></div>
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
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
                  <div>
                    <ImageUpload label="Game Background" url={settings.bg_image_url}
                      onFile={f => { const r=new FileReader(); r.onload=e=>setSettings({...settings,bg_image_url:e.target.result,_bgFile:f}); r.readAsDataURL(f) }}
                      onClear={() => setSettings({...settings,bg_image_url:'',_bgFile:null})} />
                    <div style={{ marginTop:8 }}>
                      <CanvaDesignButton
                        gameId={id}
                        imageType="background"
                        onImageUploaded={(url) => setSettings({...settings, bg_image_url: url})}
                        variant="small"
                      />
                    </div>
                  </div>
                  <div>
                    <ImageUpload label="Game Logo" url={settings.game_logo_url}
                      onFile={f => { const r=new FileReader(); r.onload=e=>setSettings({...settings,game_logo_url:e.target.result,_logoFile:f}); r.readAsDataURL(f) }}
                      onClear={() => setSettings({...settings,game_logo_url:'',_logoFile:null})} />
                    <div style={{ marginTop:8 }}>
                      <CanvaDesignButton
                        gameId={id}
                        imageType="logo"
                        onImageUploaded={(url) => setSettings({...settings, game_logo_url: url})}
                        buttonText="Design Logo"
                        variant="small"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">🎨 Theme</div>
                <div className="gb-row">
                  <ColorPicker label="Background Color" value={settings.bg_color||'#87CEEB'} onChange={v => setSettings({...settings,bg_color:v})} />
                  <ColorPicker label="Primary Color" value={settings.primary_color||'#f59e0b'} onChange={v => setSettings({...settings,primary_color:v})} />
                </div>
                <div className="gb-row" style={{ marginTop:12 }}>
                  <div className="gb-fg">
                    <span className="gb-label">Font Family</span>
                    <select value={settings.font_family||'DM Sans'} onChange={e => setSettings({...settings,font_family:e.target.value})}>
                      {FONT_CATEGORIES.map(cat => (
                        <optgroup key={cat.name} label={cat.name}>
                          {cat.fonts.map(f => <option key={f} value={f}>{f}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">🐦 Start Button</div>
                <div className="gb-fg" style={{ marginBottom:12 }}>
                  <span className="gb-label">Button Text</span>
                  <input value={settings.start_button_text||''} onChange={e => setSettings({...settings,start_button_text:e.target.value})} placeholder="Start Playing →" />
                </div>
                <div className="gb-row">
                  <ColorPicker value={settings.start_button_text_color||'#ffffff'} onChange={v => setSettings({...settings,start_button_text_color:v})} noPresets label="Text Color" />
                  <ColorPicker value={settings.start_button_bg_color||''} onChange={v => setSettings({...settings,start_button_bg_color:v})} noPresets label="BG Color" />
                </div>
              </div>

              <div style={{ display:'flex',justifyContent:'flex-end' }}>
                <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px',marginTop:16 }}>
                  {saving ? '⏳ Saving…' : '💾 Save Settings'}
                </button>
              </div>
            </div>
          )}

          {tab === 'thankyou' && (
            <div>
              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">🎉 Thank You Page</div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16 }}>
                  <ImageUpload label="Thank You BG Image" url={settings.thankyou_bg_image_url}
                    onFile={f => { const r=new FileReader(); r.onload=e=>setSettings({...settings,thankyou_bg_image_url:e.target.result,_tyBgFile:f}); r.readAsDataURL(f) }}
                    onClear={() => setSettings({...settings,thankyou_bg_image_url:'',_tyBgFile:null})} />
                  <ImageUpload label="Submit Confirm GIF" url={settings.submit_confirm_gif_url}
                    onFile={f => { const r=new FileReader(); r.onload=e=>setSettings({...settings,submit_confirm_gif_url:e.target.result,_gifFile:f}); r.readAsDataURL(f) }}
                    onClear={() => setSettings({...settings,submit_confirm_gif_url:'',_gifFile:null})} />
                </div>
                <div className="gb-fg" style={{ marginBottom:12 }}>
                  <span className="gb-label">Thank You Subtitle</span>
                  <input value={settings.thankyou_subtitle||''} onChange={e => setSettings({...settings,thankyou_subtitle:e.target.value})} placeholder="Great job!" />
                </div>
                <ColorPicker value={settings.thankyou_subtitle_color||'#444444'} onChange={v => setSettings({...settings,thankyou_subtitle_color:v})} noPresets label="Subtitle Color" />
                <div className="gb-fg" style={{ marginTop:12,marginBottom:12 }}>
                  <span className="gb-label">Outro Text</span>
                  <textarea rows={2} value={settings.outro_text||''} onChange={e => setSettings({...settings,outro_text:e.target.value})} style={{ resize:'vertical' }} />
                </div>
                <ColorPicker value={settings.outro_text_color||'#444444'} onChange={v => setSettings({...settings,outro_text_color:v})} noPresets label="Outro Color" />
              </div>

              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">🔘 Continue Button</div>
                <div className="gb-fg" style={{ marginBottom:12 }}>
                  <span className="gb-label">Button Text</span>
                  <input value={settings.continue_button_text||''} onChange={e => setSettings({...settings,continue_button_text:e.target.value})} placeholder="Continue →" />
                </div>
                <div className="gb-row">
                  <ColorPicker value={settings.continue_button_text_color||'#ffffff'} onChange={v => setSettings({...settings,continue_button_text_color:v})} noPresets label="Text Color" />
                  <ColorPicker value={settings.continue_button_bg_color||''} onChange={v => setSettings({...settings,continue_button_bg_color:v})} noPresets label="BG Color" />
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">📋 Terms & Conditions</div>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
                  <input type="checkbox" checked={!!settings.terms_enabled}
                    onChange={e => setSettings({...settings,terms_enabled:e.target.checked?1:0})} style={{ width:16,height:16 }} />
                  <label style={{ fontWeight:600,cursor:'pointer',fontSize:13 }}>Require acceptance</label>
                </div>
                <div className="gb-fg" style={{ marginBottom:10 }}>
                  <span className="gb-label">Label Text</span>
                  <input value={settings.terms_text||''} onChange={e => setSettings({...settings,terms_text:e.target.value})} placeholder="Terms & Conditions" />
                </div>
                <div className="gb-fg">
                  <span className="gb-label">URL (optional)</span>
                  <input value={settings.terms_url||''} onChange={e => setSettings({...settings,terms_url:e.target.value})} placeholder="https://yoursite.com/terms" />
                </div>
              </div>

              <div style={{ display:'flex',justifyContent:'flex-end' }}>
                <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px',marginTop:16 }}>
                  {saving ? '⏳ Saving…' : '💾 Save Settings'}
                </button>
              </div>
            </div>
          )}

          {tab === 'sounds' && (
            <div>
              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">🔊 Sound Effects</div>
                <div className="gb-row">
                  <div className="gb-fg">
                    <span className="gb-label">Flap Sound</span>
                    <select value={settings.sound_flap_id||''} onChange={e => setSettings({...settings,sound_flap_id:e.target.value})}>
                      <option value="">— None —</option>
                      {sounds.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="gb-fg">
                    <span className="gb-label">Score Sound</span>
                    <select value={settings.sound_score_id||''} onChange={e => setSettings({...settings,sound_score_id:e.target.value})}>
                      <option value="">— None —</option>
                      {sounds.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="gb-fg">
                    <span className="gb-label">Game Over Sound</span>
                    <select value={settings.sound_gameover_id||''} onChange={e => setSettings({...settings,sound_gameover_id:e.target.value})}>
                      <option value="">— None —</option>
                      {sounds.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">📤 Upload Sound</div>
                <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg" style={{ marginBottom:8 }}
                  onChange={async e => {
                    const file = e.target.files[0]; if (!file) return
                    const fd = new FormData()
                    fd.append('file', file)
                    fd.append('name', file.name.replace(/\.[^.]+$/,''))
                    fd.append('sound_type', 'custom')
                    try {
                      const res = await api.post(`/sounds/games/${id}/sounds`, fd)
                      setSounds(prev => [res.data.sound, ...prev])
                      showToast('Sound uploaded')
                    } catch (err) { showToast('Error: '+(err.response?.data?.message||err.message), 'error') }
                    e.target.value=''
                  }} />
              </div>

              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">🎵 Uploaded Sounds ({sounds.length})</div>
                {sounds.length === 0 ? (
                  <p style={{ color:'var(--gb-text3)',fontSize:13 }}>No sounds uploaded yet.</p>
                ) : sounds.map(s => (
                  <div key={s.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--gb-border)' }}>
                    <span style={{ fontSize:13 }}>{s.name}</span>
                    <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                      <audio controls src={s.url || s.file_url} style={{ height:32,width:160 }} />
                      <button className="gb-btn gb-btn-danger gb-btn-sm" onClick={async () => {
                        try { await api.delete(`/sounds/sounds/${s.id}`); setSounds(prev => prev.filter(x => x.id!==s.id)); showToast('Sound deleted') }
                        catch { showToast('Error', 'error') }
                      }}>✕</button>
                    </div>
                  </div>
                ))}
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
                <div className="gb-section-title">⚙️ General Settings</div>
                <div className="gb-row">
                  <div className="gb-fg">
                    <span className="gb-label">Game Slug</span>
                    <input value={slugInput} onChange={e => setSlugInput(e.target.value)} placeholder="auto-generated" />
                  </div>
                  <div className="gb-fg">
                    <span className="gb-label">Redirect URL (after game)</span>
                    <input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} placeholder="https://yoursite.com/thankyou" />
                  </div>
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16,padding:16 }}>
                <div className="gb-section-title">📝 Meta</div>
                <div className="gb-fg">
                  <span className="gb-label">Meta Description (for SEO/sharing)</span>
                  <textarea rows={2} value={settings.meta_description||''} onChange={e => setSettings({...settings,meta_description:e.target.value})} style={{ resize:'vertical' }} placeholder="Play Flappy Bird and win prizes!" />
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

        {/* ─── RIGHT COL: Phone Preview ─── */}
        <div style={{ position:'sticky',top:80 }}>
          <div style={{ background:'var(--gb-surface)',border:'1.5px solid var(--gb-border)',borderRadius:20,overflow:'hidden',boxShadow:'var(--gb-shadow-md)' }}>
            <div style={{ padding:'12px 16px',borderBottom:'1.5px solid var(--gb-border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <span style={{ fontSize:11,fontWeight:700,color:'var(--gb-text3)',textTransform:'uppercase',letterSpacing:'.05em' }}>Preview</span>
              <a href={gameLink} target="_blank" rel="noreferrer" style={{ fontSize:11,color:'var(--gb-primary)',textDecoration:'none',fontWeight:600 }}>Open Full ↗</a>
            </div>
            <div style={{ padding:12 }}>
              <div style={{ width:'100%',aspectRatio:'9/16',maxHeight:500,borderRadius:12,overflow:'hidden',background:settings.sky_color||'#87CEEB',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative' }}>
                {settings.game_logo_url && <img src={settings.game_logo_url} alt="" style={{ maxWidth:'60%',maxHeight:40,marginBottom:12,objectFit:'contain' }} />}
                <div style={{ fontSize:16,fontWeight:800,color:settings.heading_1_color||'#1a1a2e',textAlign:'center',padding:'0 12px' }}>
                  {settings.heading_1 || 'Flappy Bird'}
                </div>
                {settings.heading_2 && <div style={{ fontSize:11,color:settings.heading_2_color||'#666',textAlign:'center',marginTop:4,padding:'0 12px' }}>{settings.heading_2}</div>}
                <div style={{ width:50,height:50,marginTop:16,borderRadius:'50%',background:settings.bird_color||'#f59e0b',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,boxShadow:'0 4px 12px rgba(0,0,0,0.2)' }}>🐦</div>
                <div style={{ display:'flex',gap:6,marginTop:12 }}>
                  <div style={{ width:30,height:100,background:settings.pipe_color||'#22c55e',borderRadius:4 }} />
                  <div style={{ width:30,height:60,background:settings.pipe_color||'#22c55e',borderRadius:4,marginTop:40 }} />
                </div>
                <div style={{ position:'absolute',bottom:0,left:0,right:0,height:30,background:settings.ground_color||'#8B4513' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
