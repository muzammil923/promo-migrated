import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'

const LIGHT = `
.gb-wrap {
  --gb-bg:        #f4f6fb;
  --gb-surface:   #ffffff;
  --gb-surface2:  #f0f2f8;
  --gb-border:    #e2e6f0;
  --gb-border2:   #cdd3e0;
  --gb-primary:   #6366f1;
  --gb-primary-d: #4f46e5;
  --gb-primary-g: rgba(99,102,241,0.15);
  --gb-success:   #16a34a;
  --gb-danger:    #dc2626;
  --gb-text:      #1e1e2e;
  --gb-text2:     #64657a;
  --gb-text3:     #9899ae;
  --gb-shadow:    0 2px 12px rgba(0,0,0,0.08);
  --gb-shadow-md: 0 4px 24px rgba(0,0,0,0.10);
  --gb-radius:    12px;
  --gb-radius-sm: 8px;
  font-family: 'DM Sans', sans-serif;
  background: var(--gb-bg);
  color: var(--gb-text);
  min-height: 100vh;
}
.gb-wrap *, .gb-wrap *::before, .gb-wrap *::after { box-sizing: border-box; }
.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]),
.gb-wrap select, .gb-wrap textarea {
  width: 100%; font-family: inherit; font-size: 14px;
  background: var(--gb-surface); border: none; border-bottom: 1.5px solid var(--gb-border);
  border-radius: 8px; color: var(--gb-text); padding: 10px 12px 8px; outline: none; transition: border-color .18s;
}
.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]):focus,
.gb-wrap select:focus, .gb-wrap textarea:focus { border-bottom-color: #22c55e; border-bottom-width: 2px; }
.gb-wrap select option { background: #fff; color: #1e1e2e; }
.gb-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--gb-radius-sm); border: none; cursor: pointer; transition: all .15s; white-space: nowrap; font-family: inherit; }
.gb-btn:disabled { opacity: .5; cursor: not-allowed; }
.gb-btn-primary { background: var(--gb-primary); color: #fff; }
.gb-btn-primary:not(:disabled):hover { background: var(--gb-primary-d); transform: translateY(-1px); box-shadow: 0 4px 12px var(--gb-primary-g); }
.gb-btn-ghost { background: var(--gb-surface); color: var(--gb-text2); border: 1.5px solid var(--gb-border); }
.gb-btn-ghost:not(:disabled):hover { border-color: var(--gb-primary); color: var(--gb-primary); }
.gb-btn-danger { background: #fee2e2; color: var(--gb-danger); border: 1.5px solid #fecaca; }
.gb-btn-danger:not(:disabled):hover { background: #fecaca; }
.gb-btn-success { background: #dcfce7; color: var(--gb-success); border: 1.5px solid #bbf7d0; }
.gb-btn-success:not(:disabled):hover { background: #bbf7d0; }
.gb-btn-sm { padding: 5px 10px; font-size: 12px; }
.gb-btn-icon { padding: 6px; border-radius: 6px; }
.gb-card { background: var(--gb-surface); border: 1.5px solid var(--gb-border); border-radius: var(--gb-radius); box-shadow: var(--gb-shadow); }
.gb-label { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--gb-text2); margin-bottom: 4px; display: block; }
.gb-section { background: var(--gb-surface2); border: 1px solid var(--gb-border); border-radius: var(--gb-radius); padding: 16px; margin-bottom: 14px; }
.gb-section-title { font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--gb-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
.gb-tabs { display: flex; border-bottom: 2px solid var(--gb-border); margin-bottom: 24px; gap: 0; overflow-x: auto; }
.gb-tab { padding: 10px 18px; font-size: 13px; font-weight: 600; border: none; background: none; cursor: pointer; color: var(--gb-text2); border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color .15s; white-space: nowrap; font-family: inherit; }
.gb-tab.active { color: #9210f6; border-bottom-color: #9210f6; }
.gb-tab:hover:not(.active) { color: var(--gb-text); }
.gb-fg { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 120px; }
.gb-swatch { width: 28px; height: 28px; border-radius: 6px; border: 2px solid var(--gb-border); cursor: pointer; flex-shrink: 0; }
.gb-thumb { height: 44px; width: auto; border-radius: 6px; border: 1px solid var(--gb-border); object-fit: contain; background: #f9f9f9; }
.gb-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
@keyframes gb-slide-in { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:none } }
.gb-toast { position: fixed; bottom: 24px; right: 24px; z-index: 9999; padding: 12px 18px; border-radius: 10px; color: #fff; font-weight: 600; font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,.15); animation: gb-slide-in .22s ease; font-family: 'DM Sans',sans-serif; max-width: 320px; }
`

const COLOR_PRESETS = ['#1a1a2e','#ffffff','#000000','#ef4444','#22c55e','#3b82f6',
  '#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#0ea5e9']

function ColorPicker({ value, onChange, label }) {
  const [show, setShow] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setShow(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  return (
    <div ref={ref} style={{ position:'relative', display:'inline-flex', flexDirection:'column', gap:4 }}>
      {label && <span className="gb-label">{label}</span>}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div className="gb-swatch" style={{ background: value || '#6366f1' }} onClick={() => setShow(s => !s)} />
        <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#000000" style={{ width:90, fontSize:12, padding:'5px 8px' }} />
      </div>
      {show && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:300, background:'var(--gb-surface)', border:'1.5px solid var(--gb-border)', borderRadius:10, padding:12, boxShadow:'var(--gb-shadow-md)', display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5, width:220 }}>
          {COLOR_PRESETS.map(c => (
            <div key={c} onClick={() => { onChange(c); setShow(false) }}
              style={{ width:22, height:22, background:c, borderRadius:4, cursor:'pointer',
                border: value===c ? '2px solid #6366f1' : '1px solid #e2e6f0' }} />
          ))}
          <input type="color" value={value||'#000000'} onChange={e => onChange(e.target.value)}
            style={{ gridColumn:'span 7', width:'100%', height:28, padding:0, border:'none', background:'none', cursor:'pointer' }} />
          <button className="gb-btn gb-btn-ghost gb-btn-sm" style={{ width:'100%' }} onClick={() => setShow(false)}>Close</button>
        </div>
      )}
    </div>
  )
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [])
  return (
    <div className="gb-toast" style={{ background: type === 'success' ? '#16a34a' : '#dc2626' }}>
      {type === 'success' ? '✅' : '❌'} {msg}
    </div>
  )
}

export default function CarromBuilderPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [game,       setGame]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [tab,        setTab]        = useState('settings')
  const [toast,      setToast]      = useState(null)
  const [settings,   setSettings]   = useState({})
  const [formFields, setFormFields] = useState([])
  const [emailTemplate, setEmailTemplate] = useState({})
  const [slugInput,  setSlugInput]  = useState('')
  const [redirectUrl, setRedirectUrl] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameInput,  setNameInput]  = useState('')
  const [saving,     setSaving]     = useState(false)

  const showToast = (msg, type='success') => setToast({ msg, type })

  const loadData = useCallback(() => {
    setLoading(true); setFetchError(null)
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/Carrom/${id}/settings`),
    ]).then(([gRes, sRes]) => {
      const g = gRes.data.game; setGame(g)
      setSettings(sRes.data.settings || {})
      setFormFields(g.formFields || [])
      setEmailTemplate(g.emailTemplate || {})
      setRedirectUrl(g.redirect_url || '')
      setSlugInput(g.slug || '')
    }).catch(err => {
      setFetchError(err.response?.data?.message || err.message || 'Failed to load')
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      const textFields = ['heading_1','heading_2','heading_3','description_text','intro_text','outro_text',
        'submit_button_text','continue_button_text','start_button_text','font_family',
        'show_timer','time_limit_seconds','terms_enabled','terms_text','terms_url',
        'meta_description','heading_1_color','heading_2_color','heading_3_color',
        'description_color','intro_text_color','outro_text_color',
        'thankyou_subtitle','thankyou_subtitle_color',
        'submit_button_text_color','submit_button_bg_color',
        'continue_button_text_color','continue_button_bg_color',
        'start_button_text_color','start_button_bg_color',
        'bg_color','primary_color']
      for (const f of textFields) fd.append(f, settings[f] ?? '')
      if (settings._bgFile) fd.append('bg_image', settings._bgFile)
      else fd.append('bg_image_url', settings.bg_image_url || '')
      if (settings._logoFile) fd.append('game_logo', settings._logoFile)
      else fd.append('game_logo_url', settings.game_logo_url || '')
      await api.put(`/Carrom/${id}/settings`, fd)
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

  const saveFormFields = async () => {
    setSaving(true)
    try { await api.put(`/games/${id}/form-fields`, { fields: formFields }); showToast('Form fields saved') }
    catch { showToast('Error saving form fields', 'error') }
    setSaving(false)
  }

  const saveEmailTemplate = async () => {
    setSaving(true)
    try { await api.put(`/games/${id}/email-template`, emailTemplate); showToast('Email template saved') }
    catch { showToast('Error saving email template', 'error') }
    setSaving(false)
  }

  const addFormField    = ()          => setFormFields([...formFields, { field_label:'New Field', field_type:'text', is_required:0, field_options:[] }])
  const removeFormField = i           => { const f=[...formFields]; f.splice(i,1); setFormFields(f) }
  const updateFormField = (i,key,val) => { const f=[...formFields]; f[i]={ ...f[i],[key]:val }; setFormFields(f) }

  const gameLink = game ? `${window.location.origin}/play/${game.slug}/${game.client_slug}` : ''

  const TABS = [
    { id:'settings', label:'Settings' },
    { id:'form',     label:'Player Form' },
    { id:'email',    label:'Email' },
  ]

  if (loading) return (
    <div className="gb-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign:'center', color:'var(--gb-text2)' }}>
        <div style={{ width:40,height:40,borderRadius:'50%',border:'3px solid #e2e6f0',borderTopColor:'#6366f1',animation:'spin .8s linear infinite',margin:'0 auto 16px' }} />
        Loading builder…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (fetchError) return (
    <div className="gb-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign:'center', maxWidth:400 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>⚠️</div>
        <h2 style={{ color:'var(--gb-danger)', marginBottom:8 }}>Builder Failed to Load</h2>
        <p style={{ color:'var(--gb-text2)', marginBottom:20 }}>{fetchError}</p>
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
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
      <div style={{
        display:'grid', gridTemplateColumns:'1fr auto 1fr',
        background:'var(--gb-surface)', borderBottom:'1.5px solid var(--gb-border)',
        padding:'10px 28px', gap:'4px 20px', alignItems:'center',
        position:'sticky', top:0, zIndex:50, boxShadow:'0 1px 8px rgba(0,0,0,.06)'
      }}>
        <div style={{ display:'flex', gap:6, alignItems:'flex-start', justifySelf:'start' }}>
          <button className="gb-btn gb-btn-ghost gb-btn-sm" onClick={() => navigate('/dashboard/games')}
            style={{ padding:'6px 8px', fontSize:16, lineHeight:1, marginTop:1 }} title="Back to games">←</button>
          <div>
            {editingName ? (
              <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                <input value={nameInput} onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter') saveGameName(); if (e.key==='Escape') setEditingName(false) }}
                  onBlur={saveGameName} autoFocus
                  style={{ width:180, fontSize:14, fontWeight:700, padding:'3px 6px' }} />
                <button className="gb-btn gb-btn-ghost gb-btn-sm" onClick={() => setEditingName(false)} style={{ padding:'2px 6px' }}>✕</button>
              </div>
            ) : (
              <div style={{ fontWeight:700, fontSize:14, color:'var(--gb-text)', cursor:'pointer', lineHeight:1.3 }}
                onClick={() => { setNameInput(game?.name||''); setEditingName(true) }} title="Click to edit">
                {game?.name} <span style={{ fontSize:10, color:'var(--gb-text3)', fontWeight:400 }}>✎</span>
              </div>
            )}
            <div style={{ fontSize:9.5, fontWeight:600, color:'var(--gb-text3)', letterSpacing:'.04em', textTransform:'uppercase', marginTop:1 }}>Builder</div>
          </div>
        </div>

        <div className="gb-tabs" style={{ marginBottom:0, borderBottom:'none', justifySelf:'center' }}>
          {TABS.map(t => (
            <button key={t.id} className={`gb-tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}
              style={{ padding:'6px 14px', fontSize:12.5 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', gap:6, alignItems:'center', justifySelf:'end' }}>
          <button className="gb-btn gb-btn-ghost gb-btn-sm" style={{ padding:'6px 8px', fontSize:16, lineHeight:1 }}
            onClick={() => { navigator.clipboard.writeText(gameLink); showToast('Link copied!') }}
            title="Copy game link">🔗</button>
          <a href={gameLink} target="_blank" rel="noreferrer" className="gb-btn gb-btn-ghost gb-btn-sm"
            style={{ padding:'6px 8px', fontSize:16, lineHeight:1, textDecoration:'none' }}
            title="Preview game">👁</a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 20px' }}>

        {/* ════ SETTINGS TAB ════ */}
        {tab === 'settings' && (
          <div>
            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div className="gb-section-title">Visuals</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div className="gb-fg">
                  <span className="gb-label">Background Image URL</span>
                  <input value={settings.bg_image_url||''} onChange={e => setSettings({...settings, bg_image_url:e.target.value})} placeholder="https://..." />
                </div>
                <div className="gb-fg">
                  <span className="gb-label">Game Logo URL</span>
                  <input value={settings.game_logo_url||''} onChange={e => setSettings({...settings, game_logo_url:e.target.value})} placeholder="https://..." />
                </div>
              </div>
            </div>

            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div className="gb-section-title">Game Texts</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'8px 16px', alignItems:'end' }}>
                <div className="gb-fg" style={{ marginBottom:0 }}>
                  <span className="gb-label">Heading 1 (title)</span>
                  <input value={settings.heading_1||''} onChange={e => setSettings({...settings,heading_1:e.target.value})} placeholder="Carrom King" />
                </div>
                <ColorPicker value={settings.heading_1_color||'#1a1a2e'} onChange={v => setSettings({...settings,heading_1_color:v})} />
                <div className="gb-fg" style={{ marginBottom:0 }}>
                  <span className="gb-label">Heading 2 (subtitle)</span>
                  <input value={settings.heading_2||''} onChange={e => setSettings({...settings,heading_2:e.target.value})} placeholder="Pass & play multiplayer" />
                </div>
                <ColorPicker value={settings.heading_2_color||'#666666'} onChange={v => setSettings({...settings,heading_2_color:v})} />
                <div className="gb-fg" style={{ marginBottom:0 }}>
                  <span className="gb-label">Intro Text</span>
                  <textarea rows={2} value={settings.intro_text||''} onChange={e => setSettings({...settings,intro_text:e.target.value})} style={{ resize:'vertical' }} />
                </div>
                <ColorPicker value={settings.intro_text_color||'#444444'} onChange={v => setSettings({...settings,intro_text_color:v})} />
              </div>
            </div>

            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div className="gb-section-title">Colors & Theme</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <ColorPicker value={settings.primary_color||'#6366f1'} onChange={v => setSettings({...settings,primary_color:v})} label="Primary Color" />
                <ColorPicker value={settings.bg_color||'#0f172a'} onChange={v => setSettings({...settings,bg_color:v})} label="Background Color" />
                <div className="gb-fg">
                  <span className="gb-label">Font Family</span>
                  <select value={settings.font_family||'DM Sans'} onChange={e => setSettings({...settings,font_family:e.target.value})}>
                    <option value="DM Sans">DM Sans</option>
                    <option value="Nunito">Nunito</option>
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Baloo 2">Baloo 2</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div className="gb-section-title">Buttons</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <span className="gb-label">Start Button Text</span>
                  <input value={settings.start_button_text||''} onChange={e => setSettings({...settings,start_button_text:e.target.value})} placeholder="Start Game →" />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:8 }}>
                    <ColorPicker value={settings.start_button_text_color||'#ffffff'} onChange={v => setSettings({...settings,start_button_text_color:v})} label="Text Color" />
                    <ColorPicker value={settings.start_button_bg_color||''} onChange={v => setSettings({...settings,start_button_bg_color:v})} label="BG Color" />
                  </div>
                </div>
                <div>
                  <span className="gb-label">Submit Button Text</span>
                  <input value={settings.submit_button_text||''} onChange={e => setSettings({...settings,submit_button_text:e.target.value})} placeholder="Submit →" />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:8 }}>
                    <ColorPicker value={settings.submit_button_text_color||'#ffffff'} onChange={v => setSettings({...settings,submit_button_text_color:v})} label="Text Color" />
                    <ColorPicker value={settings.submit_button_bg_color||''} onChange={v => setSettings({...settings,submit_button_bg_color:v})} label="BG Color" />
                  </div>
                </div>
              </div>
            </div>

            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div className="gb-section-title">Terms &amp; Conditions</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <input type="checkbox" id="termsEnabled" checked={!!settings.terms_enabled}
                  onChange={e => setSettings({...settings,terms_enabled:e.target.checked?1:0})} style={{ width:16,height:16 }} />
                <label htmlFor="termsEnabled" style={{ fontWeight:600, cursor:'pointer', fontSize:13 }}>Require acceptance</label>
              </div>
              <div className="gb-row">
                <div className="gb-fg">
                  <span className="gb-label">Label Text</span>
                  <input value={settings.terms_text||''} onChange={e => setSettings({...settings,terms_text:e.target.value})} placeholder="Terms &amp; Conditions" />
                </div>
                <div className="gb-fg">
                  <span className="gb-label">URL (optional)</span>
                  <input value={settings.terms_url||''} onChange={e => setSettings({...settings,terms_url:e.target.value})} placeholder="https://yoursite.com/terms" />
                </div>
              </div>
            </div>

            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div className="gb-section-title">Link &amp; Slug</div>
              <div className="gb-row">
                <div className="gb-fg">
                  <span className="gb-label">Custom Slug</span>
                  <input value={slugInput} onChange={e => setSlugInput(e.target.value)} placeholder="my-Carrom-game" />
                </div>
                <div className="gb-fg">
                  <span className="gb-label">Redirect URL (after game)</span>
                  <input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </div>

            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div className="gb-section-title">SEO &amp; Meta</div>
              <div className="gb-fg">
                <span className="gb-label">Meta Description</span>
                <textarea rows={2} value={settings.meta_description||''} onChange={e => setSettings({...settings,meta_description:e.target.value})} style={{ resize:'vertical' }} placeholder="A fun Carrom board game..." />
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px', marginTop:16 }}>
                {saving ? '⏳ Saving…' : '💾 Save Settings'}
              </button>
            </div>
          </div>
        )}

        {/* ════ FORM TAB ════ */}
        {tab === 'form' && (
          <div>
            <p style={{ color:'var(--gb-text2)', marginBottom:16, fontSize:13 }}>These fields appear on the player registration screen before the game starts.</p>
            {formFields.map((f,i) => (
              <div key={i} className="gb-card" style={{ marginBottom:10, padding:'12px 16px' }}>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
                  <div className="gb-fg" style={{ flex:2, minWidth:130 }}>
                    <span className="gb-label">Label</span>
                    <input value={f.field_label} onChange={e => updateFormField(i,'field_label',e.target.value)} />
                  </div>
                  <div className="gb-fg" style={{ flex:1, minWidth:110 }}>
                    <span className="gb-label">Type</span>
                    <select value={f.field_type} onChange={e => updateFormField(i,'field_type',e.target.value)}>
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="number">Number</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Dropdown</option>
                    </select>
                  </div>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer', paddingBottom:2, whiteSpace:'nowrap' }}>
                    <input type="checkbox" checked={!!f.is_required} onChange={e => updateFormField(i,'is_required',e.target.checked?1:0)}
                      style={{ width:16,height:16 }} />
                    Required
                  </label>
                  <button className="gb-btn gb-btn-danger gb-btn-sm" onClick={() => removeFormField(i)}>✕</button>
                </div>
              </div>
            ))}
            <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'center' }}>
              <button className="gb-btn gb-btn-ghost" onClick={addFormField}>+ Add Field</button>
              <button className="gb-btn gb-btn-primary" onClick={saveFormFields} disabled={saving}>{saving ? 'Saving…' : '💾 Save Form'}</button>
            </div>
          </div>
        )}

        {/* ════ EMAIL TAB ════ */}
        {tab === 'email' && (
          <div>
            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div className="gb-section-title">Email Template</div>
              <div className="gb-fg" style={{ marginBottom:12 }}>
                <span className="gb-label">Subject</span>
                <input value={emailTemplate.subject||''} onChange={e => setEmailTemplate({...emailTemplate, subject:e.target.value})} placeholder="You played {game_name}!" />
              </div>
              <div className="gb-fg" style={{ marginBottom:12 }}>
                <span className="gb-label">Body (HTML supported)</span>
                <textarea rows={8} value={emailTemplate.body||''} onChange={e => setEmailTemplate({...emailTemplate, body:e.target.value})}
                  style={{ resize:'vertical', fontFamily:'monospace', fontSize:12 }} placeholder="<h2>Thanks for playing!</h2>" />
              </div>
              <div className="gb-fg">
                <span className="gb-label">From Name</span>
                <input value={emailTemplate.from_name||''} onChange={e => setEmailTemplate({...emailTemplate, from_name:e.target.value})} placeholder="Your Brand" />
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button className="gb-btn gb-btn-primary" onClick={saveEmailTemplate} disabled={saving} style={{ padding:'10px 28px' }}>
                {saving ? '⏳ Saving…' : '💾 Save Email'}
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
