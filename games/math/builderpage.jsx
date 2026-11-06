import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'

const FONT_URL = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,300;9..144,600&display=swap'

const LIGHT = `
@import url('${FONT_URL}');
.mb-wrap *,.mb-wrap *::before,.mb-wrap *::after{box-sizing:border-box}
.mb-wrap{font-family:'DM Sans',sans-serif;color:#111827;background:#f4f6fb;min-height:100vh}
@keyframes mbFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes mbModalIn{from{opacity:0;transform:scale(0.96)translateY(6px)}to{opacity:1;transform:none}}
@keyframes mbToastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes mbSpin{to{transform:rotate(360deg)}}
.mb-input,.mb-select{width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid #E5E7EB;font-size:14px;font-family:'DM Sans',sans-serif;color:#111;background:#fafafa;outline:none;transition:border-color .15s,background .15s}
.mb-input:focus,.mb-select:focus{border-color:#818CF8;background:#fff}
.mb-select{appearance:none;cursor:pointer}
.mb-label{display:block;font-size:10.5px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.09em;margin-bottom:6px}
.mb-field{margin-bottom:16px}
.mb-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:10px;border:none;background:#18181B;color:#fff;font-size:13.5px;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;letter-spacing:.01em;transition:background .14s,transform .1s}
.mb-btn:hover{background:#27272A}
.mb-btn:active{transform:scale(.98)}
.mb-btn:disabled{opacity:.55;cursor:not-allowed}
.mb-btn-sm{padding:7px 14px;font-size:12px}
.mb-btn-secondary{background:#fff;color:#374151;border:1.5px solid #E5E7EB}
.mb-btn-secondary:hover{background:#F3F4F6;border-color:#D1D5DB}
.mb-btn-danger{background:#FEF2F2;color:#DC2626;border:1.5px solid #FECACA}
.mb-btn-danger:hover{background:#FEE2E2}
.mb-card{background:#fff;border:1.5px solid #EAECF0;border-radius:14px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04);animation:mbFadeUp .25s ease both}
.mb-card-title{font-size:13px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px}
.mb-section{background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:14px;margin-bottom:12px}
.mb-section-title{font-size:10.5px;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.mb-2col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mb-row{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap}
.mb-col{flex:1;min-width:140px}
.mb-fg{display:flex;flex-direction:column;gap:4px;flex:1;min-width:120px}
.mb-swatch{width:28px;height:28px;border-radius:6px;border:2px solid #E5E7EB;cursor:pointer;flex-shrink:0}
.mb-cpop{position:absolute;top:calc(100%+6px);left:0;z-index:300;background:#fff;border:1.5px solid #E5E7EB;border-radius:10px;padding:12px;box-shadow:0 8px 24px rgba(0,0,0,.12);display:grid;grid-template-columns:repeat(7,1fr);gap:5px;width:220px}
.mb-thumb{height:44px;width:auto;border-radius:6px;border:1px solid #E5E7EB;object-fit:contain}
.mb-empty{text-align:center;padding:48px 20px;color:#9CA3AF}
.mb-empty-icon{font-size:40px;margin-bottom:10px}
.mb-header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:12px 24px;background:#fff;border-bottom:1.5px solid #EAECF0;position:sticky;top:0;z-index:50;min-height:56px}
.mb-tabs{display:flex;gap:4px}
.mb-tab{padding:8px 16px;border-radius:8px;border:none;background:transparent;color:#6B7280;font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .14s;white-space:nowrap}
.mb-tab:hover{background:#F3F4F6;color:#374151}
.mb-tab.active{background:#DCFCE7;color:#16A34A;font-weight:600}
.mb-body{display:grid;grid-template-columns:1fr 320px;gap:24px;padding:24px;max-width:1200px;margin:0 auto}
.mb-phone{width:280px;height:560px;border-radius:36px;border:3px solid #D1D5DB;background:#F9FAFB;overflow:hidden;position:sticky;top:80px;box-shadow:0 8px 32px rgba(0,0,0,.12),inset 0 0 0 1px rgba(0,0,0,.05)}
.mb-phone-notch{width:120px;height:18px;background:#111;border-radius:0 0 14px 14px;margin:0 auto;position:relative;z-index:2}
.mb-phone-screen{height:calc(100% - 18px);overflow-y:auto;position:relative}
`

const COLOR_PRESETS = ['#1a1a2e','#ffffff','#000000','#ef4444','#22c55e','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#0ea5e5']

const FONT_CATEGORIES = [
  { name:'Handwriting', icon:'✍️', fonts:['Dancing Script','Pacifico','Caveat','Shadows Into Light','Satisfy','Kalam','Patrick Hand','Permanent Marker','Indie Flower'] },
  { name:'Professional', icon:'💼', fonts:['DM Sans','Inter','Poppins','Raleway','Nunito','Lato','Montserrat','Source Sans 3','Work Sans','Rubik','Roboto','Open Sans'] },
  { name:'Luxury', icon:'👑', fonts:['Playfair Display','Cormorant Garamond','Cinzel','Bodoni Moda','Prata','Taviraj','Libre Baskerville'] },
  { name:'Playful', icon:'🎮', fonts:['Quicksand','Josefin Sans','Exo 2','Cabin','Ubuntu','Comfortaa','Bubblegum Sans','Fredoka One','Baloo 2','Righteous'] },
]

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      position:'fixed',bottom:24,right:24,zIndex:9999,padding:'12px 18px',borderRadius:10,
      color:'#fff',fontWeight:600,fontSize:13,fontFamily:"'DM Sans',sans-serif",
      boxShadow:'0 8px 24px rgba(0,0,0,.15)',maxWidth:320,
      background: type === 'success' ? '#16a34a' : '#dc2626',
      animation:'mbToastIn .28s cubic-bezier(.34,1.56,.64,1)',
    }}>{type === 'success' ? '✅' : '❌'} {msg}</div>
  )
}

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
      {label && <span className="mb-label">{label}</span>}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div className="mb-swatch" style={{ background: value||'#22c55e', border:'2px solid #E5E7EB' }} onClick={() => setShow(s => !s)} />
        <input className="mb-input" value={value||''} onChange={e => onChange(e.target.value)} placeholder="#000000"
          style={{ width:90, fontSize:12, padding:'5px 8px', background:'transparent' }} />
      </div>
      {show && (
        <div className="mb-cpop">
          {COLOR_PRESETS.map(c => (
            <div key={c} onClick={() => { onChange(c); setShow(false) }}
              style={{ width:22, height:22, background:c, borderRadius:4, cursor:'pointer', border: value===c ? '2px solid #6366f1' : '1px solid #E5E7EB' }} />
          ))}
          <input type="color" value={value||'#000000'} onChange={e => onChange(e.target.value)}
            style={{ gridColumn:'span 7', width:'100%', height:28, padding:0, border:'none', background:'none', cursor:'pointer' }} />
          <button type="button" className="mb-btn mb-btn-secondary mb-btn-sm" style={{ gridColumn:'span 7', justifyContent:'center' }} onClick={() => setShow(false)}>Close</button>
        </div>
      )}
    </div>
  )
}

function SoundSelect({ label, value, onChange, sounds }) {
  return (
    <div className="mb-fg">
      <span className="mb-label">{label}</span>
      <select className="mb-select" value={value||''} onChange={e => onChange(e.target.value)}>
        <option value="">— None —</option>
        {sounds.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>
  )
}

export default function MathBuilderPage() {
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
  const [soundUploading, setSoundUploading] = useState(false)
  const [formFields, setFormFields] = useState([])
  const [emailTemplate, setEmailTemplate] = useState({})
  const [redirectUrl, setRedirectUrl] = useState('')
  const [gameSlug, setGameSlug] = useState('')
  const [heading1Color, setHeading1Color] = useState('#1a1a2e')
  const [heading2Color, setHeading2Color] = useState('#666666')
  const [heading3Color, setHeading3Color] = useState('#777777')
  const [descColor, setDescColor] = useState('#888888')

  const showToast = (msg, type='success') => setToast({ msg, type })

  const loadData = useCallback(() => {
    setLoading(true); setFetchError(null)
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/math/${id}/settings`),
      api.get(`/sounds/games/${id}/sounds`),
    ]).then(([gRes, sRes, soundRes]) => {
      const g = gRes.data.game
      setGame(g)
      setSettings(sRes.data.settings || {})
      setSounds(soundRes.data.sounds || [])
      setFormFields(g.formFields || [])
      setEmailTemplate(g.emailTemplate || {})
      setRedirectUrl(g.redirect_url || '')
      setGameSlug(g.slug || '')
      const s = sRes.data.settings || {}
      setHeading1Color(s.heading_1_color || '#1a1a2e')
      setHeading2Color(s.heading_2_color || '#666666')
      setHeading3Color(s.heading_3_color || '#777777')
      setDescColor(s.description_color || '#888888')
    }).catch(err => {
      setFetchError(err.response?.data?.message || err.message || 'Failed to load math game data')
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const body = {
        total_levels: settings.total_levels,
        questions_per_level: settings.questions_per_level,
        operations: settings.operations,
        number_range_start: settings.number_range_start,
        number_range_end: settings.number_range_end,
        allow_negative: settings.allow_negative,
        show_timer: settings.show_timer,
        time_per_question: settings.time_per_question,
        pass_threshold: settings.pass_threshold,
        heading_1: settings.heading_1,
        heading_2: settings.heading_2,
        heading_3: settings.heading_3,
        description_text: settings.description_text,
        font_family: settings.font_family,
        sound_correct_id: settings.sound_correct_id,
        sound_wrong_id: settings.sound_wrong_id,
        overlay_animation_in: settings.overlay_animation_in,
        overlay_animation_out: settings.overlay_animation_out,
        intro_text: settings.intro_text,
        outro_text: settings.outro_text,
        submit_button_text: settings.submit_button_text,
        continue_button_text: settings.continue_button_text,
        start_button_text: settings.start_button_text,
        terms_enabled: settings.terms_enabled,
        terms_text: settings.terms_text,
        terms_url: settings.terms_url,
        meta_description: settings.meta_description,
        bg_color: settings.bg_color,
        primary_color: settings.primary_color,
        heading_1_color: heading1Color,
        heading_2_color: heading2Color,
        heading_3_color: heading3Color,
        description_color: descColor,
      }
      await api.put(`/math/${id}/settings`, body)
      showToast('Settings saved')
    } catch (err) {
      showToast('Error saving: ' + (err.response?.data?.message || err.message), 'error')
    }
    setSaving(false)
  }

  const handleBack = () => navigate('/dashboard/games')

  const saveFormFields = async () => {
    setSaving(true)
    try {
      await api.put(`/games/${id}/form-fields`, { fields: formFields })
      showToast('Form fields saved')
    } catch (err) {
      showToast('Error saving form fields', 'error')
    }
    setSaving(false)
  }

  const saveEmailTemplate = async () => {
    setSaving(true)
    try {
      await api.put(`/games/${id}/email-template`, emailTemplate)
      showToast('Email template saved')
    } catch (err) {
      showToast('Error saving email template', 'error')
    }
    setSaving(false)
  }

  const addFormField = () => setFormFields([...formFields, { field_label:'New Field', field_type:'text', is_required:0, field_options:[] }])
  const removeFormField = i => { const f=[...formFields]; f.splice(i,1); setFormFields(f) }
  const updateFormField = (i, key, val) => { const f=[...formFields]; f[i]={ ...f[i],[key]:val }; setFormFields(f) }

  const loadFont = (font) => {
    if (!font || font === 'DM Sans') return
    const id = 'gf-' + font.replace(/\s/g, '-')
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700;800&display=swap`
    document.head.appendChild(link)
  }
  useEffect(() => { if (settings.font_family) loadFont(settings.font_family) }, [settings.font_family])

  const TABS = [
    { id:'gameplay', label:'Gameplay' },
    { id:'form',     label:'Player Form' },
    { id:'thankyou', label:'Thankyou Page' },
    { id:'email',    label:'Email' },
    { id:'sounds',   label:'Audio' },
    { id:'settings', label:'Settings' },
  ]

  if (loading) return (
    <div className="mb-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36,height:36,borderRadius:'50%',border:'3px solid #E5E7EB',borderTopColor:'#22c55e',animation:'mbSpin .8s linear infinite',margin:'0 auto 12px' }} />
        <div style={{ color:'#9CA3AF',fontSize:14 }}>Loading math builder…</div>
      </div>
    </div>
  )

  if (fetchError) return (
    <div className="mb-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:20 }}>
      <div className="mb-card" style={{ maxWidth:400, textAlign:'center', padding:32 }}>
        <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
        <h2 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Failed to load</h2>
        <p style={{ color:'#6B7280', fontSize:14, marginBottom:20 }}>{fetchError}</p>
        <button className="mb-btn" onClick={loadData}>Retry</button>
      </div>
    </div>
  )

  const primary = settings.primary_color || '#22c55e'
  const ff = settings.font_family || 'DM Sans'

  const opList = ['+', '-', '×', '÷']
  const enabledOps = (settings.operations || '+,-,×').split(',').map(s => s.trim())

  const opsText = (ops) => ops.join(', ')
  const levelSummary = (s) => `${s.total_levels || 100} levels · ${s.questions_per_level || 5} q/level · ${opsText(enabledOps)}`

  return (
    <div className="mb-wrap">
      <style>{LIGHT}</style>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="mb-header">
        <div><button className="mb-icon-btn" onClick={handleBack} title="Back to games" style={{ fontSize:16, lineHeight:1 }}>←</button></div>
        <div className="mb-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`mb-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <div style={{ textAlign:'right' }}>
          <button className="mb-btn mb-btn-sm" onClick={saveSettings} disabled={saving}>
            {saving ? '⏳ Saving…' : '💾 Save'}
          </button>
        </div>
      </div>

      <div className="mb-body">
        <div className="mb-left">

          {/* ── GAMEPLAY TAB ── */}
          {tab === 'gameplay' && (
            <div>
              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Levels & Questions</div>
                <div className="mb-2col">
                  <div className="mb-fg">
                    <span className="mb-label">Total Levels</span>
                    <input className="mb-input" type="number" min={1} max={500} value={settings.total_levels??100}
                      onChange={e => setSettings({...settings,total_levels:parseInt(e.target.value)||100})} />
                  </div>
                  <div className="mb-fg">
                    <span className="mb-label">Questions per Level</span>
                    <input className="mb-input" type="number" min={1} max={20} value={settings.questions_per_level??5}
                      onChange={e => setSettings({...settings,questions_per_level:parseInt(e.target.value)||5})} />
                  </div>
                </div>
                <div className="mb-2col" style={{ marginTop:12 }}>
                  <div className="mb-fg">
                    <span className="mb-label">Pass Threshold (correct out of total)</span>
                    <input className="mb-input" type="number" min={1} value={settings.pass_threshold??5}
                      onChange={e => setSettings({...settings,pass_threshold:parseInt(e.target.value)||5})} />
                  </div>
                  <div className="mb-fg">
                    <span className="mb-label">Number Range (min - max)</span>
                    <div className="mb-row" style={{ gap:6 }}>
                      <input className="mb-input" type="number" value={settings.number_range_start??1}
                        onChange={e => setSettings({...settings,number_range_start:parseInt(e.target.value)||1})}
                        style={{ width:'48%' }} placeholder="1" />
                      <input className="mb-input" type="number" value={settings.number_range_end??100}
                        onChange={e => setSettings({...settings,number_range_end:parseInt(e.target.value)||100})}
                        style={{ width:'48%' }} placeholder="100" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Operations</div>
                <div className="mb-row" style={{ gap:8 }}>
                  {opList.map(op => (
                    <label key={op} style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, cursor:'pointer', padding:'8px 14px', borderRadius:8, border:'1.5px solid', borderColor: enabledOps.includes(op) ? '#22c55e' : '#E5E7EB', background: enabledOps.includes(op) ? '#F0FDF4' : '#FAFAFA', transition:'all .13s' }}>
                      <input type="checkbox" checked={enabledOps.includes(op)}
                        onChange={() => {
                          const was = [...enabledOps]
                          const idx = was.indexOf(op)
                          if (idx >= 0) was.splice(idx, 1); else was.push(op)
                          setSettings({...settings, operations: was.join(',') })
                        }} style={{ accentColor:'#22c55e' }} />
                      <strong>{op}</strong>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Timer & Difficulty</div>
                <div className="mb-2col">
                  <div className="mb-fg">
                    <span className="mb-label">Show Timer</span>
                    <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
                      <input type="checkbox" checked={!!settings.show_timer} onChange={e => setSettings({...settings,show_timer:e.target.checked?1:0})} />
                      Enable timer per question
                    </label>
                  </div>
                  {!!settings.show_timer && (
                    <div className="mb-fg">
                      <span className="mb-label">Time per Question (seconds)</span>
                      <input className="mb-input" type="number" min={0} value={settings.time_per_question??0}
                        onChange={e => setSettings({...settings,time_per_question:parseInt(e.target.value)||0})} />
                    </div>
                  )}
                </div>
                <div className="mb-fg" style={{ marginTop:12 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
                    <input type="checkbox" checked={!!settings.allow_negative} onChange={e => setSettings({...settings,allow_negative:e.target.checked?1:0})} />
                    Allow negative results
                  </label>
                </div>
              </div>

              <button className="mb-btn" onClick={saveSettings} disabled={saving} style={{ width:'100%', justifyContent:'center' }}>
                {saving ? '⏳ Saving…' : '💾 Save Gameplay Settings'}
              </button>
            </div>
          )}

          {/* ── PLAYER FORM TAB ── */}
          {tab === 'form' && (
            <div>
              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Game Texts</div>
                <div className="mb-2col">
                  <div className="mb-fg">
                    <span className="mb-label">Heading 1</span>
                    <input className="mb-input" value={settings.heading_1||''} onChange={e => setSettings({...settings,heading_1:e.target.value})} placeholder="Math Challenge" />
                  </div>
                  <ColorPicker label="Heading 1 Color" value={heading1Color} onChange={setHeading1Color} />
                </div>
                <div className="mb-2col" style={{ marginTop:12 }}>
                  <div className="mb-fg">
                    <span className="mb-label">Heading 2</span>
                    <input className="mb-input" value={settings.heading_2||''} onChange={e => setSettings({...settings,heading_2:e.target.value})} placeholder="100 levels of brain training" />
                  </div>
                  <ColorPicker label="Heading 2 Color" value={heading2Color} onChange={setHeading2Color} />
                </div>
                <div className="mb-fg" style={{ marginTop:12 }}>
                  <span className="mb-label">Intro Text</span>
                  <textarea className="mb-input" rows={3} value={settings.intro_text||''} onChange={e => setSettings({...settings,intro_text:e.target.value})} placeholder="Solve math problems, unlock levels, and track your progress!" />
                </div>
                <div style={{ marginTop:8 }}>
                  <ColorPicker label="Intro Text Color" value={descColor} onChange={setDescColor} />
                </div>
              </div>

              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Player Form Fields</div>
                {formFields.map((ff, i) => (
                  <div key={i} className="mb-section" style={{ position:'relative' }}>
                    <div className="mb-2col">
                      <div className="mb-fg">
                        <span className="mb-label">Field Label</span>
                        <input className="mb-input" value={ff.field_label} onChange={e => updateFormField(i,'field_label',e.target.value)} />
                      </div>
                      <div className="mb-fg">
                        <span className="mb-label">Type</span>
                        <select className="mb-select" value={ff.field_type} onChange={e => updateFormField(i,'field_type',e.target.value)}>
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone</option>
                          <option value="number">Number</option>
                          <option value="textarea">Textarea</option>
                          <option value="select">Dropdown</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:8 }}>
                      <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer' }}>
                        <input type="checkbox" checked={!!ff.is_required} onChange={e => updateFormField(i,'is_required',e.target.checked?1:0)} />
                        Required
                      </label>
                      <button type="button" className="mb-btn mb-btn-danger mb-btn-sm" onClick={() => removeFormField(i)} style={{ marginLeft:'auto' }}>Remove</button>
                    </div>
                  </div>
                ))}
                <button type="button" className="mb-btn mb-btn-secondary mb-btn-sm" onClick={addFormField} style={{ marginTop:4 }}>+ Add Field</button>
                <button type="button" className="mb-btn mb-btn-sm" onClick={saveFormFields} style={{ marginLeft:8 }} disabled={saving}>Save Form</button>
              </div>

              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-row">
                  <div className="mb-col">
                    <div className="mb-section-title">Terms & Conditions</div>
                    <div className="mb-fg" style={{ marginBottom:8 }}>
                      <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
                        <input type="checkbox" checked={!!settings.terms_enabled} onChange={e => setSettings({...settings,terms_enabled:e.target.checked?1:0})} />
                        Enable terms acceptance
                      </label>
                    </div>
                    <div className="mb-fg" style={{ marginBottom:8 }}>
                      <span className="mb-label">Terms Label</span>
                      <input className="mb-input" value={settings.terms_text||''} onChange={e => setSettings({...settings,terms_text:e.target.value})} placeholder="I accept the Terms & Conditions" />
                    </div>
                    <div className="mb-fg">
                      <span className="mb-label">Terms URL (optional)</span>
                      <input className="mb-input" value={settings.terms_url||''} onChange={e => setSettings({...settings,terms_url:e.target.value})} placeholder="https://yoursite.com/terms" />
                    </div>
                  </div>
                  <div className="mb-col">
                    <div className="mb-section-title">Start Button</div>
                    <div className="mb-fg" style={{ marginBottom:8 }}>
                      <span className="mb-label">Button Text</span>
                      <input className="mb-input" value={settings.start_button_text||''} onChange={e => setSettings({...settings,start_button_text:e.target.value})} placeholder="Start Game" />
                    </div>
                  </div>
                </div>
              </div>

              <button className="mb-btn" onClick={saveSettings} disabled={saving} style={{ width:'100%', justifyContent:'center' }}>
                {saving ? '⏳ Saving…' : '💾 Save Settings'}
              </button>
            </div>
          )}

          {/* ── THANKYOU TAB ── */}
          {tab === 'thankyou' && (
            <div>
              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Thankyou Message</div>
                <div className="mb-fg" style={{ marginBottom:12 }}>
                  <span className="mb-label">Outro Text</span>
                  <textarea className="mb-input" rows={3} value={settings.outro_text||''} onChange={e => setSettings({...settings,outro_text:e.target.value})} placeholder="🎉 You completed all levels! Amazing!" />
                </div>
                <ColorPicker label="Outro Text Color" value={settings.outro_text_color||'#1a1a2e'} onChange={v => setSettings({...settings,outro_text_color:v})} />
              </div>

              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Submit Button</div>
                <div className="mb-2col">
                  <div className="mb-fg">
                    <span className="mb-label">Button Text</span>
                    <input className="mb-input" value={settings.submit_button_text||''} onChange={e => setSettings({...settings,submit_button_text:e.target.value})} placeholder="Submit & Continue →" />
                  </div>
                  <div className="mb-row">
                    <ColorPicker label="Text Color" value={settings.submit_button_text_color||'#ffffff'} onChange={v => setSettings({...settings,submit_button_text_color:v})} />
                    <ColorPicker label="Bg Color" value={settings.submit_button_bg_color||primary} onChange={v => setSettings({...settings,submit_button_bg_color:v})} />
                  </div>
                </div>
                <div className="mb-fg" style={{ marginTop:12 }}>
                  <span className="mb-label">Continue Button Text</span>
                  <input className="mb-input" value={settings.continue_button_text||''} onChange={e => setSettings({...settings,continue_button_text:e.target.value})} placeholder="Continue →" />
                </div>
              </div>

              <button className="mb-btn" onClick={saveSettings} disabled={saving} style={{ width:'100%', justifyContent:'center' }}>
                {saving ? '⏳ Saving…' : '💾 Save Settings'}
              </button>
            </div>
          )}

          {/* ── EMAIL TAB ── */}
          {tab === 'email' && (
            <div>
              <div className="mb-card" style={{ marginBottom:16 }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer', marginBottom:14 }}>
                  <input type="checkbox" checked={!!emailTemplate.is_enabled} onChange={e => setEmailTemplate({...emailTemplate,is_enabled:e.target.checked?1:0})} />
                  Enable email notifications
                </label>
                <div style={{ padding:'10px 14px', background:'#FFFBEB', borderRadius:8, border:'1px solid #FDE68A', fontSize:12, color:'#92400E', marginBottom:14 }}>
                  💡 Placeholders: <code>{'{{name}}'}</code> <code>{'{{score}}'}</code> <code>{'{{total}}'}</code> <code>{'{{level}}'}</code> <code>{'{{game_name}}'}</code>
                </div>
                <div className="mb-2col">
                  <div className="mb-fg">
                    <span className="mb-label">Sender Name</span>
                    <input className="mb-input" value={emailTemplate.sender_name||''} onChange={e => setEmailTemplate({...emailTemplate,sender_name:e.target.value})} />
                  </div>
                  <div className="mb-fg">
                    <span className="mb-label">Sender Email</span>
                    <input className="mb-input" type="email" value={emailTemplate.sender_email||''} onChange={e => setEmailTemplate({...emailTemplate,sender_email:e.target.value})} />
                  </div>
                </div>
                <div className="mb-fg" style={{ marginTop:12 }}>
                  <span className="mb-label">Subject</span>
                  <input className="mb-input" value={emailTemplate.subject||''} onChange={e => setEmailTemplate({...emailTemplate,subject:e.target.value})} placeholder="Thanks for playing {{game_name}}!" />
                </div>
                <div className="mb-2col" style={{ marginTop:12 }}>
                  <div className="mb-fg">
                    <span className="mb-label">Header Text</span>
                    <input className="mb-input" value={emailTemplate.header_text||''} onChange={e => setEmailTemplate({...emailTemplate,header_text:e.target.value})} placeholder="Congratulations!" />
                  </div>
                  <ColorPicker label="Header Color" value={emailTemplate.header_color||'#22c55e'} onChange={v => setEmailTemplate({...emailTemplate,header_color:v})} />
                </div>
                <div className="mb-fg" style={{ marginTop:12 }}>
                  <span className="mb-label">Body HTML</span>
                  <textarea className="mb-input" rows={5} value={emailTemplate.body_html||''} onChange={e => setEmailTemplate({...emailTemplate,body_html:e.target.value})}
                    placeholder={`<p>Hi {{name}},</p><p>You completed Level {{level}} on {{game_name}}!</p>`}
                    style={{ fontFamily:'monospace', fontSize:13 }} />
                </div>
                <div className="mb-fg" style={{ marginTop:12 }}>
                  <span className="mb-label">Footer Text</span>
                  <input className="mb-input" value={emailTemplate.footer_text||''} onChange={e => setEmailTemplate({...emailTemplate,footer_text:e.target.value})} placeholder="© Your Company" />
                </div>
              </div>
              <button className="mb-btn" onClick={saveEmailTemplate} disabled={saving} style={{ width:'100%', justifyContent:'center' }}>
                {saving ? '⏳ Saving…' : '💾 Save Email Template'}
              </button>
            </div>
          )}

          {/* ── AUDIO TAB ── */}
          {tab === 'sounds' && (
            <div>
              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Sound Library</div>
                <div style={{ marginBottom:16 }}>
                  <input type="file" accept="audio/mpeg,audio/wav,audio/ogg" style={{ display:'none' }} id="soundUploadInput"
                    onChange={async e => {
                      const f = e.target.files[0]; if (!f) return
                      if (!['audio/mpeg','audio/wav','audio/ogg','audio/mp3'].includes(f.type) && !f.name.match(/\.(mp3|wav|ogg)$/i)) { showToast('Please upload MP3, WAV, or OGG', 'error'); return }
                      setSoundUploading(true)
                      const fd = new FormData()
                      fd.append('file', f)
                      fd.append('name', f.name.replace(/\.[^.]+$/, ''))
                      try {
                        const res = await api.post(`/sounds/games/${id}/sounds`, fd)
                        setSounds(prev => [res.data.sound, ...prev])
                        showToast('Sound uploaded')
                      } catch (err) { showToast('Error uploading sound: '+(err.response?.data?.message||err.message), 'error') }
                      setSoundUploading(false)
                      e.target.value = ''
                    }} />
                  <button className="mb-btn mb-btn-secondary mb-btn-sm" onClick={() => document.getElementById('soundUploadInput').click()} disabled={soundUploading}>
                    {soundUploading ? '⏳ Uploading…' : '🎵 Upload Sound'}
                  </button>
                  <span style={{ fontSize:11, color:'#9CA3AF', marginLeft:8 }}>MP3, WAV, or OGG</span>
                </div>
                <div className="mb-card-title" style={{ marginTop:16 }}>Assign Sounds</div>
                <div className="mb-2col">
                  <SoundSelect label="✅ Correct Answer" value={settings.sound_correct_id} onChange={v => setSettings({...settings,sound_correct_id:v})} sounds={sounds} />
                  <SoundSelect label="❌ Wrong Answer" value={settings.sound_wrong_id} onChange={v => setSettings({...settings,sound_wrong_id:v})} sounds={sounds} />
                </div>
                <button className="mb-btn mb-btn-sm" onClick={saveSettings} disabled={saving} style={{ marginTop:8 }}>
                  {saving ? '⏳ Saving…' : '💾 Save Sound Assignments'}
                </button>
              </div>
              {sounds.length > 0 ? (
                <div className="mb-card">
                  <div className="mb-card-title">All Sounds ({sounds.length})</div>
                  {sounds.map(s => (
                    <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #F3F4F6' }}>
                      <span style={{ fontSize:18 }}>🎵</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600 }}>{s.name}</div>
                        <div style={{ fontSize:11, color:'#9CA3AF' }}>#{s.id}</div>
                      </div>
                      <audio controls src={s.url} style={{ height:32, maxWidth:160 }} />
                      <button className="mb-icon-btn del" onClick={async () => { try { await api.delete(`/sounds/${s.id}`); setSounds(prev => prev.filter(x => x.id !== s.id)); showToast('Sound deleted') } catch { showToast('Error deleting sound','error') } }}>✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-empty">
                  <div className="mb-empty-icon">🎵</div>
                  <p>No sounds uploaded yet</p>
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {tab === 'settings' && (
            <div>
              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">URL Slug & Colors</div>
                <div className="mb-fg" style={{ marginBottom:12 }}>
                  <span className="mb-label">Game URL Slug</span>
                  <input className="mb-input" value={gameSlug} onChange={e => setGameSlug(e.target.value)} placeholder="my-math-game" />
                  {game && <div style={{ marginTop:4, fontSize:12, color:'#9CA3AF' }}>/play/{gameSlug||'slug'}/{game?.client_slug||'client'}</div>}
                </div>
                <div className="mb-row">
                  <ColorPicker label="Background Color" value={settings.bg_color||'#f0fdf4'} onChange={v => setSettings({...settings,bg_color:v})} />
                  <ColorPicker label="Primary Color" value={settings.primary_color||'#22c55e'} onChange={v => setSettings({...settings,primary_color:v})} />
                </div>
              </div>

              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Font Family</div>
                <div className="mb-fg" style={{ marginBottom:12 }}>
                  <span className="mb-label">Selected: {settings.font_family||'DM Sans'}</span>
                </div>
                {FONT_CATEGORIES.map(cat => (
                  <div key={cat.name} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#6B7280', marginBottom:6 }}>{cat.icon} {cat.name}</div>
                    <div className="mb-2col">
                      {cat.fonts.map(f => (
                        <div key={f} onClick={() => setSettings({...settings,font_family:f})}
                          style={{
                            padding:'8px 6px', borderRadius:8, border: (settings.font_family||'DM Sans') === f ? '2px solid #22c55e' : '1.5px solid #E5E7EB',
                            cursor:'pointer', textAlign:'center', fontSize:12,
                            background: (settings.font_family||'DM Sans') === f ? '#F0FDF4' : '#FAFAFA',
                            fontFamily: `"${f}", sans-serif`, transition:'all .1s',
                          }}>
                          <div style={{ fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f}</div>
                          <div style={{ fontSize:10, color:'#9CA3AF', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>123 + 456 = ?</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Social Share Preview</div>
                <div className="mb-fg">
                  <span className="mb-label">Meta Description</span>
                  <textarea className="mb-input" rows={2} maxLength={200} value={settings.meta_description||''} onChange={e => setSettings({...settings,meta_description:e.target.value})} placeholder="Brief description for social sharing…" />
                  <div style={{ fontSize:11, color:'#9CA3AF', textAlign:'right', marginTop:2 }}>{(settings.meta_description||'').length}/200</div>
                </div>
              </div>

              <button className="mb-btn" onClick={saveSettings} disabled={saving} style={{ width:'100%', justifyContent:'center' }}>
                {saving ? '⏳ Saving…' : '💾 Save Settings'}
              </button>
            </div>
          )}

        </div>

        {/* ── PHONE MOCKUP ── */}
        <div className="mb-phone">
          <div className="mb-phone-notch" />
          <div className="mb-phone-screen" style={{
            fontFamily: `"${ff}", sans-serif`,
            background: (tab === 'thankyou' && settings.thankyou_bg_image_url) ? `url("${settings.thankyou_bg_image_url}") center/cover no-repeat` :
                        settings.bg_image_url ? `url("${settings.bg_image_url}") center/cover no-repeat` : settings.bg_color || '#f0fdf4',
          }}>
            {game && (
              <>
                {(tab === 'gameplay' || tab === 'form' || tab === 'sounds' || tab === 'settings') && (
                  <div style={{ display:'flex', flexDirection:'column', height:'100%', padding:'16px 14px' }}>
                    <div style={{
                      flex:1, borderRadius:16, padding:'20px 16px', display:'flex', flexDirection:'column',
                      background: settings.bg_image_url ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.92)',
                      backdropFilter: settings.bg_image_url ? 'blur(28px)' : 'none',
                      border: settings.bg_image_url ? '1px solid rgba(255,255,255,0.25)' : 'none',
                    }}>
                      {tab === 'gameplay' && (
                        <>
                          <div style={{ textAlign:'center', fontSize:36, marginBottom:8 }}>🧮</div>
                          <h1 style={{ fontSize:18, fontWeight:800, textAlign:'center', color:heading1Color, margin:0 }}>{settings.heading_1 || 'Math Challenge'}</h1>
                          <p style={{ fontSize:11, textAlign:'center', color:'#999', margin:'6px 0' }}>{levelSummary(settings)}</p>
                          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap:8 }}>
                            {['+', '-', '×'].map(op => (
                              <div key={op} style={{ display:'flex', gap:6 }}>
                                {[1,2,3,4].map(i => (
                                  <div key={i} style={{ flex:1, height:28, borderRadius:6, background:'rgba(0,0,0,0.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#999' }}>
                                    {op === '+' ? `${i}+${i+1}` : op === '-' ? `${i+2}-${i}` : `${i}×${i+1}`}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                          <button style={{ width:'100%', padding:'10px', borderRadius:10, border:'none', background: primary, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', marginTop:8 }}>
                            {settings.start_button_text || '🧮 Start Game'}
                          </button>
                        </>
                      )}
                      {tab === 'form' && (
                        <>
                          {settings.game_logo_url && <div style={{ textAlign:'center', marginBottom:12 }}><img src={settings.game_logo_url} alt="" style={{ height:32, objectFit:'contain' }} /></div>}
                          <h1 style={{ fontSize:18, fontWeight:800, textAlign:'center', color:heading1Color, margin:0 }}>{settings.heading_1 || 'Math Challenge'}</h1>
                          {settings.heading_2 && <p style={{ fontSize:12, textAlign:'center', color:heading2Color, margin:'4px 0 8px' }}>{settings.heading_2}</p>}
                          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap:8 }}>
                            {formFields.map((ff, i) => (
                              <div key={i} style={{ height:32, borderRadius:8, background:'rgba(0,0,0,0.05)', display:'flex', alignItems:'center', padding:'0 10px', fontSize:11, color:'#999' }}>
                                {ff.field_label} {ff.is_required ? '*' : ''}
                              </div>
                            ))}
                            {Number(settings.terms_enabled) === 1 && (
                              <div style={{ height:24, display:'flex', alignItems:'center', gap:6, fontSize:10, color:'#999' }}>
                                <div style={{ width:14, height:14, borderRadius:3, border:'1.5px solid #ccc' }} /> {settings.terms_text || 'I accept Terms'}
                              </div>
                            )}
                          </div>
                          <button style={{ width:'100%', padding:'10px', borderRadius:10, border:'none', background: primary, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', marginTop:8 }}>
                            {settings.start_button_text || '🧮 Start Game'}
                          </button>
                        </>
                      )}
                      {(tab === 'sounds' || tab === 'settings') && (
                        <>
                          <h1 style={{ fontSize:18, fontWeight:800, textAlign:'center', color:heading1Color, margin:0 }}>{settings.heading_1 || 'Math Challenge'}</h1>
                          <p style={{ fontSize:11, textAlign:'center', color:'#999', margin:'6px 0' }}>{levelSummary(settings)}</p>
                          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap:10 }}>
                            <div style={{ fontSize:40 }}>🧮</div>
                            <div style={{ fontSize:13, color:'#999' }}>{tab === 'settings' ? 'Settings preview' : 'Sound assignments'}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {tab === 'thankyou' && (
                  <div style={{ display:'flex', flexDirection:'column', height:'100%', padding:'16px 14px' }}>
                    <div style={{
                      flex:1, borderRadius:16, padding:'20px 16px', textAlign:'center', display:'flex', flexDirection:'column', justifyContent:'center',
                      background: settings.thankyou_bg_image_url ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.92)',
                      backdropFilter: settings.thankyou_bg_image_url ? 'blur(28px)' : 'none',
                      border: settings.thankyou_bg_image_url ? '1px solid rgba(255,255,255,0.25)' : 'none',
                    }}>
                      <div style={{ fontSize:36, marginBottom:8 }}>🏆</div>
                      <h2 style={{ fontSize:16, fontWeight:800, color: settings.outro_text_color||'#1a1a2e', margin:0 }}>{settings.outro_text || 'You completed all levels!'}</h2>
                      <button style={{ width:'100%', padding:'10px', borderRadius:10, border:'none', background: primary, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', marginTop:'auto' }}>
                        {settings.submit_button_text || 'Submit & Continue →'}
                      </button>
                    </div>
                  </div>
                )}

                {tab === 'email' && (
                  <iframe title="Email Preview" srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:'DM Sans',sans-serif;background:#f4f4f4}.eh{background:${emailTemplate.header_color||'#22c55e'};color:#fff;padding:20px;text-align:center;font-size:18px;font-weight:700}.eb{padding:20px;background:#fff;margin:12px;border-radius:8px;font-size:13px;line-height:1.6}.ef{padding:12px;text-align:center;font-size:11px;color:#999}</style></head><body><div class="eh">${emailTemplate.header_text||'Congratulations!'}</div><div class="eb">${emailTemplate.body_html||'<p>Thanks for playing!</p>'}</div><div class="ef">${emailTemplate.footer_text||''}</div></body></html>`}
                    style={{ width:'100%', height:'100%', border:'none', background:'#fff' }} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
