import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'
import { useUploadErrors, uploadErrorMessage } from '../../apps/frontend/src/lib/builderUpload'

const LIGHT = `.gb-wrap{--gb-bg:#f4f6fb;--gb-surface:#fff;--gb-border:#e2e6f0;--gb-primary:#f59e0b;--gb-primary-d:#d97706;--gb-text:#1e1e2e;--gb-text2:#64657a;--gb-text3:#9899ae;--gb-radius:12px;font-family:'DM Sans',sans-serif;background:var(--gb-bg);color:var(--gb-text);min-height:100vh}*{box-sizing:border-box}
.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]),.gb-wrap select,.gb-wrap textarea{width:100%;font-family:inherit;font-size:14px;background:var(--gb-surface);border:none;border-bottom:1.5px solid var(--gb-border);border-radius:8px;color:var(--gb-text);padding:10px 12px 8px;outline:none}
.gb-wrap input:focus,.gb-wrap select:focus,.gb-wrap textarea:focus{border-bottom-color:var(--gb-primary)}
.gb-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;font-size:13px;font-weight:600;border-radius:8px;border:none;cursor:pointer;transition:all .15s;font-family:inherit}
.gb-btn-primary{background:var(--gb-primary);color:#fff}
.gb-btn-primary:hover{background:var(--gb-primary-d)}
.gb-btn-primary:disabled{opacity:.6;cursor:default}
.gb-btn-ghost{background:var(--gb-surface);color:var(--gb-text2);border:1.5px solid var(--gb-border)}
.gb-card{background:var(--gb-surface);border:1.5px solid var(--gb-border);border-radius:var(--gb-radius);padding:16px;margin-bottom:16px}
.gb-label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gb-text2);margin-bottom:4px;display:block}
.gb-section-title{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--gb-primary);margin-bottom:12px}
.gb-tabs{display:flex;border-bottom:2px solid var(--gb-border);margin-bottom:24px}
.gb-tab{padding:10px 18px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;color:var(--gb-text2);border-bottom:2px solid transparent;margin-bottom:-2px;font-family:inherit}
.gb-tab.active{color:var(--gb-primary);border-bottom-color:var(--gb-primary)}
.gb-row{display:flex;gap:12px;flex-wrap:wrap}
.gb-fg{display:flex;flex-direction:column;gap:4px;flex:1;min-width:120px}
.gb-swatch{width:28px;height:28px;border-radius:6px;border:2px solid var(--gb-border);cursor:pointer}
.gb-img-error{border:1.5px solid #dc2626!important;border-radius:8px;padding:6px}
.gb-img-error-msg{color:#dc2626;font-size:11px;font-weight:600}
.gb-tab-err-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#dc2626;margin-left:6px}
.gb-toast{position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 18px;border-radius:10px;color:#fff;font-weight:600;font-size:13px}
@keyframes gbSlideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
`

const COLOR_PRESETS = ['#1a1a2e','#ffffff','#ef4444','#22c55e','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f95240']

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [])
  return <div className="gb-toast" style={{ background: type === 'success' ? '#16a34a' : '#dc2626', animation:'gbSlideIn .22s ease' }}>{type === 'success' ? '✅' : '❌'} {msg}</div>
}

function ColorPicker({ value, onChange, label }) {
  const [show, setShow] = useState(false)
  const ref = useRef()
  useEffect(() => { const fn = e => { if (ref.current && !ref.current.contains(e.target)) setShow(false) }; document.addEventListener('mousedown', fn); return () => document.removeEventListener('mousedown', fn) }, [])
  return (
    <div ref={ref} style={{ position:'relative',display:'inline-flex',flexDirection:'column',gap:4 }}>
      {label && <span className="gb-label">{label}</span>}
      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
        <div className="gb-swatch" style={{ background: value || '#f59e0b' }} onClick={() => setShow(s => !s)} />
        <input value={value||''} onChange={e => onChange(e.target.value)} style={{ width:90,fontSize:12,padding:'5px 8px' }} />
      </div>
      {show && <div style={{ position:'absolute',top:'calc(100% + 6px)',left:0,zIndex:300,background:'#fff',border:'1.5px solid #e2e6f0',borderRadius:10,padding:12,boxShadow:'0 4px 24px rgba(0,0,0,0.1)',display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:5,width:180 }}>
        {COLOR_PRESETS.map(c => <div key={c} onClick={() => { onChange(c); setShow(false) }} style={{ width:22,height:22,background:c,borderRadius:4,cursor:'pointer',border: value===c?'2px solid #f59e0b':'1px solid #e2e6f0' }} />)}
        <input type="color" value={value||'#000000'} onChange={e => onChange(e.target.value)} style={{ gridColumn:'span 5',width:'100%',height:28,padding:0,border:'none',cursor:'pointer' }} />
      </div>}
    </div>
  )
}

const FONT_OPTIONS = ['DM Sans','Inter','Poppins','Roboto','Montserrat']
const TAB_FIELDS = { visuals: ['bg_image_url','game_logo_url','thankyou_bg_image_url'] }

export default function TowerBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('gameplay')
  const [toast, setToast] = useState(null)
  const [settings, setSettings] = useState({})
  const [saving, setSaving] = useState(false)
  const upload = useUploadErrors()
  const showToast = (msg, type='success') => setToast({ msg, type })

  const loadData = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/tower/${id}/settings`),
    ]).then(([gRes, sRes]) => {
      setGame(gRes.data.game)
      setSettings(sRes.data.settings || {})
    }).catch(() => showToast('Failed to load', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      for (const f of ['target_score','heading_1','heading_2','heading_1_color','heading_2_color','bg_color','primary_color','font_family','start_button_text','meta_description']) fd.append(f, settings[f] ?? '')
      if (settings._bgFile) fd.append('bg_image', settings._bgFile)
      else fd.append('bg_image_url', settings.bg_image_url || '')
      if (settings._logoFile) fd.append('game_logo', settings._logoFile)
      else fd.append('game_logo_url', settings.game_logo_url || '')
      if (settings._tyFile) fd.append('thankyou_bg_image', settings._tyFile)
      else fd.append('thankyou_bg_image_url', settings.thankyou_bg_image_url || '')
      await api.put(`/tower/${id}/settings`, fd)
      showToast('Settings saved')
    } catch (err) {
      const msg = uploadErrorMessage(err)
      if (settings._bgFile) upload.setFieldError('bg_image_url', msg)
      if (settings._logoFile) upload.setFieldError('game_logo_url', msg)
      if (settings._tyFile) upload.setFieldError('thankyou_bg_image_url', msg)
      if (!settings._bgFile && !settings._logoFile && !settings._tyFile) upload.setFieldError('bg_image_url', msg)
      showToast(msg, 'error')
    }
    setSaving(false)
  }

  const setImg = (key, fileKey) => (e) => {
    upload.clearFieldError(key)
    const f = e.target.files[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => setSettings({ ...settings, [key]: ev.target.result, [fileKey]: f })
    r.readAsDataURL(f)
  }

  const gameLink = game ? `${window.location.origin}/play/${game.slug}/${game.client_slug}` : ''
  const TABS = [
    { id: 'gameplay', label: 'Gameplay' },
    { id: 'visuals', label: 'Visuals' },
    { id: 'settings', label: 'Settings' },
  ]

  if (loading) return <div className="gb-wrap" style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}><style>{LIGHT}</style><div style={{ textAlign:'center' }}><div style={{ width:40,height:40,borderRadius:'50%',border:'3px solid #e2e6f0',borderTopColor:'#f59e0b',animation:'spin .8s linear infinite',margin:'0 auto 16px' }} />Loading…<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div></div>

  return (
    <div className="gb-wrap"><style>{LIGHT}</style>
      {/* Header */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr auto 1fr',background:'#fff',borderBottom:'1.5px solid var(--gb-border)',padding:'10px 28px',gap:'4px 20px',alignItems:'center',position:'sticky',top:'62px',zIndex:50,boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>
        <div style={{ display:'flex',gap:10,alignItems:'flex-start' }}>
          <button className="gb-btn gb-btn-ghost" onClick={() => navigate('/dashboard/games')} style={{ padding:'6px 8px',fontSize:16,lineHeight:1,marginTop:1 }}>←</button>
          <div>
            <div style={{ fontWeight:700,fontSize:14,lineHeight:1.3 }}>{game?.name || 'Untitled'}</div>
            <div style={{ fontSize:9.5,fontWeight:600,color:'var(--gb-text3)',letterSpacing:'.04em',textTransform:'uppercase',marginTop:1 }}>Tower Builder</div>
          </div>
        </div>
        <div className="gb-tabs" style={{ marginBottom:0,borderBottom:'none' }}>
          {TABS.map(t => {
            const hasErr = upload.tabHasError(t.id, TAB_FIELDS[t.id] || [])
            return <button key={t.id} className={`gb-tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)} style={{ padding:'6px 14px',fontSize:12.5 }}>{t.label}{hasErr && <span className="gb-tab-err-dot" />}</button>
          })}
        </div>
        <div style={{ display:'flex',gap:6,justifySelf:'end' }}>
          <button className="gb-btn gb-btn-ghost" style={{ padding:'6px 8px',fontSize:16,lineHeight:1 }} onClick={() => { navigator.clipboard.writeText(gameLink); showToast('Link copied!') }}>🔗</button>
          <a href={gameLink} target="_blank" rel="noreferrer" className="gb-btn gb-btn-ghost" style={{ padding:'6px 8px',fontSize:16,lineHeight:1,textDecoration:'none' }}>👁</a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1200,margin:'0 auto',padding:'24px 0 24px 20px',display:'grid',gridTemplateColumns:'1fr 320px',gap:24,alignItems:'start' }}>
        <div>
          {tab === 'gameplay' && (
            <div>
              <div className="gb-card">
                <div className="gb-section-title">🗼 Game</div>
                <div className="gb-row">
                  <div className="gb-fg"><span className="gb-label">Target Score</span><input type="number" value={settings.target_score ?? 1000} onChange={e => setSettings({...settings,target_score:parseInt(e.target.value)||0})} /></div>
                  <div className="gb-fg"><span className="gb-label">Start Button Text</span><input value={settings.start_button_text||''} onChange={e => setSettings({...settings,start_button_text:e.target.value})} placeholder="Start Game →" /></div>
                </div>
              </div>
              <div className="gb-card">
                <div className="gb-section-title">📝 Texts</div>
                <div className="gb-row">
                  <div className="gb-fg"><span className="gb-label">Title</span><input value={settings.heading_1||''} onChange={e => setSettings({...settings,heading_1:e.target.value})} placeholder="Tower" /></div>
                  <ColorPicker value={settings.heading_1_color||'#1a1a2e'} onChange={v => setSettings({...settings,heading_1_color:v})} />
                </div>
                <div className="gb-row" style={{ marginTop:8 }}>
                  <div className="gb-fg"><span className="gb-label">Subtitle</span><input value={settings.heading_2||''} onChange={e => setSettings({...settings,heading_2:e.target.value})} placeholder="Build the tower block by block" /></div>
                  <ColorPicker value={settings.heading_2_color||'#666666'} onChange={v => setSettings({...settings,heading_2_color:v})} />
                </div>
              </div>
              <div style={{ display:'flex',justifyContent:'flex-end' }}><button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px',marginTop:16 }}>{saving?'⏳ Saving…':'💾 Save Settings'}</button></div>
            </div>
          )}

          {tab === 'visuals' && (
            <div>
              <div className="gb-card">
                <div className="gb-section-title">🖼 Images</div>
                <div className="gb-row">
                  <div className={`gb-fg${upload.errors.bg_image_url ? ' gb-img-error' : ''}`}><span className="gb-label">Background</span><input type="file" accept="image/*" onChange={setImg('bg_image_url','_bgFile')} />{upload.errors.bg_image_url && <div className="gb-img-error-msg">⚠️ {upload.errors.bg_image_url}</div>}</div>
                  <div className={`gb-fg${upload.errors.game_logo_url ? ' gb-img-error' : ''}`}><span className="gb-label">Logo</span><input type="file" accept="image/*" onChange={setImg('game_logo_url','_logoFile')} />{upload.errors.game_logo_url && <div className="gb-img-error-msg">⚠️ {upload.errors.game_logo_url}</div>}</div>
                  <div className={`gb-fg${upload.errors.thankyou_bg_image_url ? ' gb-img-error' : ''}`}><span className="gb-label">Thank-You Background</span><input type="file" accept="image/*" onChange={setImg('thankyou_bg_image_url','_tyFile')} />{upload.errors.thankyou_bg_image_url && <div className="gb-img-error-msg">⚠️ {upload.errors.thankyou_bg_image_url}</div>}</div>
                </div>
              </div>
              <div className="gb-card">
                <div className="gb-section-title">🎨 Theme</div>
                <div className="gb-row">
                  <ColorPicker label="Background Color" value={settings.bg_color||'#f95240'} onChange={v => setSettings({...settings,bg_color:v})} />
                  <ColorPicker label="Primary Color" value={settings.primary_color||'#ff735c'} onChange={v => setSettings({...settings,primary_color:v})} />
                </div>
                <div className="gb-row" style={{ marginTop:12 }}>
                  <div className="gb-fg">
                    <span className="gb-label">Font Family</span>
                    <select value={settings.font_family||'DM Sans'} onChange={e => setSettings({...settings,font_family:e.target.value})}>
                      {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display:'flex',justifyContent:'flex-end' }}><button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px',marginTop:16 }}>{saving?'⏳ Saving…':'💾 Save Settings'}</button></div>
            </div>
          )}

          {tab === 'settings' && (
            <div>
              <div className="gb-card">
                <div className="gb-section-title">⚙️ General</div>
                <div className="gb-fg"><span className="gb-label">Meta Description</span><textarea rows={2} value={settings.meta_description||''} onChange={e => setSettings({...settings,meta_description:e.target.value})} style={{ resize:'vertical' }} /></div>
              </div>
              <div style={{ display:'flex',justifyContent:'flex-end' }}><button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px',marginTop:16 }}>{saving?'⏳ Saving…':'💾 Save Settings'}</button></div>
            </div>
          )}
        </div>

        {/* Right: Phone Preview */}
        <div style={{ position:'sticky',top:80 }}>
          <div style={{ background:'var(--gb-surface)',border:'1.5px solid var(--gb-border)',borderRadius:20,overflow:'hidden',boxShadow:'0 4px 24px rgba(0,0,0,0.1)' }}>
            <div style={{ padding:'12px 16px',borderBottom:'1.5px solid var(--gb-border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <span style={{ fontSize:11,fontWeight:700,color:'var(--gb-text3)',textTransform:'uppercase',letterSpacing:'.05em' }}>Preview</span>
              <a href={gameLink} target="_blank" rel="noreferrer" style={{ fontSize:11,color:'var(--gb-primary)',textDecoration:'none',fontWeight:600 }}>Open Full ↗</a>
            </div>
            <div style={{ padding:12 }}>
              <div style={{ width:'100%',aspectRatio:'9/16',maxHeight:500,borderRadius:12,overflow:'hidden',background:settings.bg_image_url || settings.bg_color || '#f95240',backgroundSize:'cover',backgroundPosition:'center',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative' }}>
                {settings.game_logo_url && <img src={settings.game_logo_url} alt="" style={{ maxWidth:'60%',maxHeight:40,marginBottom:12,objectFit:'contain' }} />}
                <div style={{ fontSize:48,marginBottom:12 }}>🗼</div>
                <div style={{ fontSize:16,fontWeight:800,color:settings.heading_1_color||'#fff',textAlign:'center',padding:'0 12px',fontFamily:`'${settings.font_family||'DM Sans'}',sans-serif` }}>
                  {settings.heading_1 || 'Tower'}
                </div>
                {settings.heading_2 && <div style={{ fontSize:11,color:settings.heading_2_color||'rgba(255,255,255,0.7)',textAlign:'center',marginTop:4,padding:'0 12px',fontFamily:`'${settings.font_family||'DM Sans'}',sans-serif` }}>{settings.heading_2}</div>}
                <button style={{ marginTop:16,background:settings.primary_color||'#ff735c',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',fontSize:12,fontWeight:600,cursor:'default' }}>
                  {settings.start_button_text || 'Start Game →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
