import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'
import { useUploadErrors, uploadErrorMessage } from '../../apps/frontend/src/lib/builderUpload'
import PhoneFrame from '../../apps/frontend/src/components/PhoneFrame'
import FormPreview from '../../apps/frontend/src/components/FormPreview'
import ThankYouPreview from '../../apps/frontend/src/components/ThankYouPreview'

const LIGHT = `
.sb-wrap {Make the game response very fast.

Requirements:
- Player click should respond instantly.
- No delay after clicking the character.
- Damage animation should be quick.
- Health should decrease immediately.
- Click counter should update instantly.
- Death animation should trigger immediately when health reaches 0.
- Remove unnecessary loading or waiting time.
- Optimize the game for smooth and fast gameplay.
  --sb-bg:        #f4f6fb;
  --sb-surface:   #ffffff;
  --sb-surface2:  #f0f2f8;
  --sb-border:    #e2e6f0;
  --sb-border2:   #cdd3e0;
  --sb-primary:   #9333ea;
  --sb-primary-d: #7e22ce;
  --sb-primary-g: rgba(147,51,234,0.15);
  --sb-success:   #16a34a;
  --sb-danger:    #dc2626;
  --sb-text:      #1e1e2e;
  --sb-text2:     #64657a;
  --sb-text3:     #9899ae;
  --sb-shadow:    0 2px 12px rgba(0,0,0,0.08);
  --sb-shadow-md: 0 4px 24px rgba(0,0,0,0.10);
  --sb-radius:    12px;
  --sb-radius-sm: 8px;
  font-family: 'DM Sans', sans-serif;
  background: var(--sb-bg);
  color: var(--sb-text);
  min-height: 100vh;
}
.sb-wrap *, .sb-wrap *::before, .sb-wrap *::after { box-sizing: border-box; }
.sb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]),
.sb-wrap select, .sb-wrap textarea {
  width: 100%; font-family: inherit; font-size: 14px;
  background: var(--sb-surface); border: none; border-bottom: 1.5px solid var(--sb-border);
  border-radius: 8px; color: var(--sb-text); padding: 10px 12px 8px; outline: none; transition: border-color .18s;
}
.sb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]):focus,
.sb-wrap select:focus, .sb-wrap textarea:focus { border-bottom-color: #9333ea; border-bottom-width: 2px; }
.sb-wrap select option { background: #fff; color: #1e1e2e; }
.sb-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--sb-radius-sm); border: none; cursor: pointer; transition: all .15s; white-space: nowrap; font-family: inherit; }
.sb-btn:disabled { opacity: .5; cursor: not-allowed; }
.sb-btn-primary { background: var(--sb-primary); color: #fff; }
.sb-btn-primary:not(:disabled):hover { background: var(--sb-primary-d); transform: translateY(-1px); box-shadow: 0 4px 12px var(--sb-primary-g); }
.sb-btn-ghost { background: var(--sb-surface); color: var(--sb-text2); border: 1.5px solid var(--sb-border); }
.sb-btn-ghost:not(:disabled):hover { border-color: var(--sb-primary); color: var(--sb-primary); }
.sb-btn-danger { background: #fee2e2; color: var(--sb-danger); border: 1.5px solid #fecaca; }
.sb-btn-danger:not(:disabled):hover { background: #fecaca; }
.sb-btn-sm { padding: 5px 10px; font-size: 12px; }
.sb-btn-icon { padding: 6px; border-radius: 6px; }
.sb-card { background: var(--sb-surface); border: 1.5px solid var(--sb-border); border-radius: var(--sb-radius); box-shadow: var(--sb-shadow); }
.sb-label { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--sb-text2); margin-bottom: 4px; display: block; }
.sb-section-title { font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--sb-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
.sb-tabs { display: flex; border-bottom: 2px solid var(--sb-border); margin-bottom: 24px; gap: 0; overflow-x: auto; }
.sb-tab { padding: 10px 18px; font-size: 13px; font-weight: 600; border: none; background: none; cursor: pointer; color: var(--sb-text2); border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color .15s; white-space: nowrap; font-family: inherit; }
.sb-tab.active { color: #9333ea; border-bottom-color: #9333ea; }
.sb-tab:hover:not(.active) { color: var(--sb-text); }
.sb-fg { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 120px; }
.sb-swatch { width: 28px; height: 28px; border-radius: 6px; border: 2px solid var(--sb-border); cursor: pointer; flex-shrink: 0; }
.sb-thumb { height: 44px; width: auto; border-radius: 6px; border: 1px solid var(--sb-border); object-fit: contain; background: #f9f9f9; }
.sb-empty { text-align: center; padding: 40px 20px; color: var(--sb-text2); }
.sb-empty-icon { font-size: 48px; margin-bottom: 12px; }
@keyframes sb-slide-in { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:none } }
.sb-toast { position: fixed; bottom: 24px; right: 24px; z-index: 9999; padding: 12px 18px; border-radius: 10px; color: #fff; font-weight: 600; font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,.15); animation: sb-slide-in .22s ease; font-family: 'DM Sans',sans-serif; max-width: 320px; }
.ty-grid { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:24px; }
.ty-card { background:#fff; border:1.5px solid var(--sb-border); border-radius:20px; padding:24px; box-shadow:0 2px 12px rgba(0,0,0,0.04); transition:box-shadow .2s, transform .2s; display:flex; flex-direction:column; }
.ty-card:hover { box-shadow:0 8px 32px rgba(0,0,0,0.08); transform:translateY(-2px); }
.ty-card-title { font-size:13px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--sb-primary); margin-bottom:16px; display:flex; align-items:center; gap:8px; }
.ty-card-full { grid-column:span 2; }
.ty-upload-zone { border:2px dashed var(--sb-border2); border-radius:14px; padding:32px 20px; text-align:center; cursor:pointer; transition:all .2s; background:var(--sb-surface2); }
.ty-upload-zone:hover { border-color:var(--sb-primary); background:#f0f0ff; }
.ty-input-row { display:flex; gap:12px; align-items:flex-end; }
.ty-input-row .sb-fg { flex:1; }
@media(max-width:768px){ .ty-grid { grid-template-columns:1fr !important; } .ty-card-full { grid-column:span 1; } }
`

const COLOR_PRESETS = ['#1a1a2e','#ffffff','#000000','#ef4444','#22c55e','#3b82f6',
  '#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#0ea5e9']

const FONT_CATEGORIES = [
  { name:'Handwriting', fonts:['Caveat','Patrick Hand','Indie Flower','Shadows Into Light','Gloria Hallelujah','Permanent Marker','Kalam','Satisfy','Reenie Beanie','Homemade Apple','Sacramento','Alex Brush'] },
  { name:'Professional', fonts:['Inter','Work Sans','Source Sans 3','Lato','Open Sans','Roboto','Nunito','DM Sans','Poppins','Rubik','Exo 2','Cabin'] },
  { name:'Luxury', fonts:['Playfair Display','Cormorant Garamond','Libre Baskerville','Cinzel','Forum','Cormorant','Bodoni Moda','Tangerine','Great Vibes','Parisienne','Bellefair','Marcellus'] },
  { name:'Modern Casual', fonts:['Montserrat','Syne','Raleway','Quicksand','Josefin Sans','Space Grotesk','Plus Jakarta Sans','Outfit','Sora','Manrope','Lexend','Figtree'] },
]

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
      {label && <span className="sb-label">{label}</span>}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div className="sb-swatch" style={{ background: value || '#9333ea' }} onClick={() => setShow(s => !s)} />
        <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#000000" style={{ width:90, fontSize:12, padding:'5px 8px' }} />
      </div>
      {show && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:300, background:'var(--sb-surface)', border:'1.5px solid var(--sb-border)', borderRadius:10, padding:12, boxShadow:'var(--sb-shadow-md)', display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5, width:220 }}>
          {COLOR_PRESETS.map(c => (
            <div key={c} onClick={() => { onChange(c); setShow(false) }} style={{ width:22, height:22, background:c, borderRadius:4, cursor:'pointer', border: value===c ? '2px solid #9333ea' : '1px solid #e2e6f0' }} />
          ))}
          <input type="color" value={value||'#000000'} onChange={e => onChange(e.target.value)} style={{ gridColumn:'span 7', width:'100%', height:28, padding:0, border:'none', background:'none', cursor:'pointer' }} />
          <button className="sb-btn sb-btn-ghost sb-btn-sm" style={{ width:'100%' }} onClick={() => setShow(false)}>Close</button>
        </div>
      )}
    </div>
  )
}

function ImageUpload({ label, url, onFile, onClear, error }) {
  const ref = useRef()
  return (
    <div className={error ? 'gb-img-error' : ''} style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
      {label && <span className="sb-label">{label}</span>}
      <input type="file" ref={ref} accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" style={{ display:'none' }} onChange={e => { const f=e.target.files[0]; if(f) onFile(f) }} />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, width:'100%', marginTop:6 }}>
        <button className="sb-btn sb-btn-ghost sb-btn-sm" type="button" onClick={() => ref.current.click()}>Upload</button>
        {url && (
          <div style={{ width:'100%', maxWidth:240, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <img src={url} className="sb-thumb" alt="" style={{ width:'100%', height:112, objectFit:'contain', display:'block' }} />
            <button className="sb-btn sb-btn-danger sb-btn-sm" type="button" onClick={onClear}>Remove</button>
          </div>
        )}
      </div>
      {error && <div className="gb-img-error-msg">⚠️ {error}</div>}
    </div>
  )
}

function SoundSelector({ label, value, onChange, sounds }) {
  return (
    <div className="sb-fg">
      <span className="sb-label">{label}</span>
      <select value={value||''} onChange={e => onChange(e.target.value)}>
        <option value="">None</option>
        {sounds.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>
  )
}

export default function StressBusterBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [settings, setSettings] = useState({})
  const [emailTemplate, setEmailTemplate] = useState({})
  const [formFields, setFormFields] = useState([])
  const [sounds, setSounds] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [activeTab, setActiveTab] = useState('display')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savingForm, setSavingForm] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [soundUploading, setSoundUploading] = useState(false)
  const [slugInput, setSlugInput] = useState('')
  const soundUploadRef = useRef()

  const upload = useUploadErrors()
  const showToast = (msg, type = 'success') => setToast({ msg, type })

  const ToastComp = ({ msg, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [onClose])
    return (
      <div className="sb-toast" style={{ background: type === 'success' ? '#16a34a' : '#dc2626' }} onClick={onClose}>
        {type === 'success' ? '' : ''} {msg}
      </div>
    )
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const [sbRes, gameRes, soundRes] = await Promise.all([
        api.get(`/stressbuster/${id}/settings`),
        api.get(`/games/${id}`),
        api.get(`/sounds/games/${id}/sounds`)
      ])
      if (gameRes.data.game) {
        setGame(gameRes.data.game)
        setFormFields(gameRes.data.game.formFields || [])
        setEmailTemplate(gameRes.data.game.emailTemplate || {})
        setSlugInput(gameRes.data.game.slug || '')
      }
      if (sbRes.data.settings) {
        const s = sbRes.data.settings
        s.enable_board_selection = 0
        s.enable_level_selection = 0
        setSettings(s)
      }
      setSounds(soundRes.data.sounds || [])
    } catch (err) {
      setFetchError(err.message || 'Failed to load')
    }
    setLoading(false)
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const font = settings.font_family
    if (!font || font === 'DM Sans') return
    const lid = 'gf-' + font.replace(/\s/g, '-')
    if (document.getElementById(lid)) return
    const link = document.createElement('link')
    link.id = lid; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(font) + ':wght@400;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [settings.font_family])

  useEffect(() => {
    const families = FONT_CATEGORIES.flatMap(c => c.fonts).filter(f => f !== 'DM Sans').map(f => encodeURIComponent(f) + ':wght@400;600;700').join('&family=')
    if (!families) return
    const lid = 'gf-all-fonts'
    if (document.getElementById(lid)) return
    const link = document.createElement('link')
    link.id = lid; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=' + families + '&display=swap'
    document.head.appendChild(link)
  }, [])

  const setS = (k, v) => setSettings(prev => ({ ...prev, [k]: v }))

  const saveGameName = async () => {
    if (!nameInput.trim()) return
    try {
      await api.put(`/games/${id}`, { name: nameInput.trim() })
      setGame(prev => ({ ...prev, name: nameInput.trim() }))
      showToast('Game name saved')
    } catch { showToast('Error saving name', 'error') }
    setEditingName(false)
  }

  const slugify = s => s.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '')

  const saveSlug = async () => {
    const cleanSlug = slugify(slugInput) || slugify(game?.name) || 'game'
    try {
      await api.put(`/games/${id}`, { slug: cleanSlug })
      setGame(prev => ({ ...prev, slug: cleanSlug }))
      setSlugInput(cleanSlug)
      showToast('Slug saved')
    } catch { showToast('Error saving slug', 'error') }
  }

  const uploadSound = async e => {
    const file = e.target.files[0]; if (!file) return
    const allowed = ['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/x-wav','audio/wave']
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg)$/i)) {
      showToast('Only MP3, WAV, OGG allowed', 'error'); e.target.value=''; return
    }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', file.name.replace(/\.[^.]+$/,''))
    fd.append('sound_type', 'custom')
    setSoundUploading(true)
    try {
      const res = await api.post(`/sounds/games/${id}/sounds`, fd)
      setSounds(prev => [res.data.sound, ...prev])
      showToast('Sound uploaded')
    } catch (err) { showToast('Error: '+(err.response?.data?.message||err.message), 'error') }
    setSoundUploading(false); e.target.value=''
  }

  const deleteSound = async s => {
    try { await api.delete(`/sounds/sounds/${s.id}`); setSounds(prev => prev.filter(x => x.id!==s.id)); showToast('Sound deleted') }
    catch { showToast('Error', 'error') }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      const fields = [
        'heading_1','heading_2','heading_3','description_text',
        'heading_1_color','heading_2_color','heading_3_color','description_color',
        'custom_win_msg','try_again_btn_text','try_again_text_color','try_again_bg_color',
        'continue_btn_text','continue_btn_text_color','continue_btn_bg_color',
        'bg_color','primary_color','board_cell_color','font_family','meta_description',
        'sound_correct_id','sound_wrong_id','win_sound_id','lose_sound_id',
        'game_mode','difficulty','target_count','time_limit',
        'terms_enabled','terms_text','terms_url',
        'start_button_text','start_button_text_color','start_button_bg_color',
        'thankyou_heading_text','thankyou_heading_color','thankyou_subtitle_text','thankyou_subtitle_color',
        'submit_btn_text','submit_btn_text_color','submit_btn_bg_color',
        'redirect_url','continue_now_btn_text','continue_now_btn_text_color','continue_now_btn_bg_color',
        'click_limit','timer_enabled','show_click_count','click_mode',
        'frustration_enabled','show_click_speed','show_frustration_result',
        'cat_health','millisecond_display','frustration_mode'
      ]
      for (const f of fields) {
        let val = settings[f] ?? ''
        if (f === 'enable_board_selection' || f === 'enable_level_selection' || f === 'timer_enabled' || f === 'show_click_count') val = Number(val) || 0
        fd.append(f, val)
      }
      if (settings._bgImageFile) fd.append('bg_image', settings._bgImageFile)
      else if (settings.bg_image_url !== undefined) fd.append('bg_image_url', settings.bg_image_url)
      if (settings._tyBgImageFile) fd.append('thankyou_bg_image', settings._tyBgImageFile)
      else if (settings.thankyou_bg_image_url !== undefined) fd.append('thankyou_bg_image_url', settings.thankyou_bg_image_url)
      if (settings._gameLogoFile) fd.append('game_logo', settings._gameLogoFile)
      else if (settings.game_logo_url !== undefined) fd.append('game_logo_url', settings.game_logo_url || '')
      if (settings._submitGifFile) fd.append('submit_confirm_gif', settings._submitGifFile)
      else if (settings.submit_confirm_gif_url !== undefined) fd.append('submit_confirm_gif_url', settings.submit_confirm_gif_url || '')
      if (settings._oImageFile) fd.append('o_image', settings._oImageFile)
      else if (settings.o_image_url !== undefined) fd.append('o_image_url', settings.o_image_url || '')
      await api.put(`/stressbuster/${id}/settings`, fd)
      showToast('Settings saved')
    } catch (err) {
      const msg = uploadErrorMessage(err)
      if (settings._bgImageFile) upload.setFieldError('bg_image_url', msg)
      if (settings._gameLogoFile) upload.setFieldError('game_logo_url', msg)
      if (settings._tyBgImageFile) upload.setFieldError('thankyou_bg_image_url', msg)
      if (settings._submitGifFile) upload.setFieldError('submit_confirm_gif_url', msg)
      if (settings._oImageFile) upload.setFieldError('o_image_url', msg)
      if (!settings._bgImageFile && !settings._gameLogoFile && !settings._tyBgImageFile && !settings._submitGifFile && !settings._oImageFile) upload.setFieldError('bg_image_url', msg)
      showToast(msg, 'error')
    }
    setSaving(false)
  }

  const addFormField = () => setFormFields([...formFields, { field_label:'New Field', field_type:'text', is_required:0, field_options:[] }])
  const removeFormField = i => { const f=[...formFields]; f.splice(i,1); setFormFields(f) }
  const updateFormField = (i,key,val) => { const f=[...formFields]; f[i]={ ...f[i],[key]:val }; setFormFields(f) }
  const saveFormFields = async () => {
    setSavingForm(true)
    try { await api.put(`/games/${id}/form-fields`, { fields: formFields }); showToast('Form fields saved') }
    catch { showToast('Error saving form fields', 'error') }
    setSavingForm(false)
  }

  const saveEmailTemplate = async () => {
    setSaving(true)
    try { await api.put(`/games/${id}/email-template`, emailTemplate); showToast('Email template saved') }
    catch { showToast('Error saving email template', 'error') }
    setSaving(false)
  }

  const TABS = [
    { id: 'display', label: 'Display & Content' },
    { id: 'game', label: 'Game Rules' },
    { id: 'sounds', label: 'Sounds' },
    { id: 'thankyou', label: 'Thankyou Page' },
    { id: 'email', label: 'Email' },
    { id: 'settings', label: 'Settings' },
  ]
  const TAB_FIELDS = {
    display: ['bg_image_url', 'game_logo_url', 'o_image_url'],
    thankyou: ['thankyou_bg_image_url', 'submit_confirm_gif_url'],
  }

  const gameLink = game ? `${window.location.origin}/play/${game.slug}/${game.client_slug}` : ''
  const previewTabs = ['display', 'email', 'thankyou', 'settings']
  const gameBgUrl = settings._bgPreview || settings.bg_image_url
  const gameLogoUrl = settings._logoPreview || settings.game_logo_url
  const thankyouBgUrl = settings._tyPreview || settings.thankyou_bg_image_url
  const submitGifUrl = settings._submitGifPreview || settings.submit_confirm_gif_url

  if (loading) return (
    <div className="sb-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign:'center', color:'var(--sb-text2)' }}>
        <div style={{ width:40,height:40,borderRadius:'50%',border:'3px solid #e2e6f0',borderTopColor:'#9333ea',animation:'spin .8s linear infinite',margin:'0 auto 16px' }} />
        Loading builder...
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (fetchError) return (
    <div className="sb-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign:'center', maxWidth:400 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>!</div>
        <h2 style={{ color:'var(--sb-danger)', marginBottom:8 }}>Builder Failed to Load</h2>
        <p style={{ color:'var(--sb-text2)', marginBottom:20 }}>{fetchError}</p>
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
          <button className="sb-btn sb-btn-primary" onClick={loadData}>Retry</button>
          <button className="sb-btn sb-btn-ghost" onClick={() => navigate('/dashboard/games')}>Back to Games</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="sb-wrap">
      <style>{LIGHT}</style>

      <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', background:'var(--sb-surface)', borderBottom:'1.5px solid var(--sb-border)', padding:'10px 28px', gap:'4px 20px', alignItems:'center', position:'sticky', top:'62px', zIndex:50, boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>
        <div style={{ display:'flex', gap:6, alignItems:'center', justifySelf:'start' }}>
          <button className="sb-btn sb-btn-ghost sb-btn-sm" onClick={() => navigate('/dashboard/games')} style={{ padding:'6px 8px', fontSize:16, lineHeight:1 }} title="Back to games">←</button>
          <div>
            {editingName ? (
              <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                <input value={nameInput} onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter') saveGameName(); if (e.key==='Escape') setEditingName(false) }}
                  onBlur={saveGameName} autoFocus style={{ width:180, fontSize:14, fontWeight:700, padding:'3px 6px' }} />
                <button className="sb-btn sb-btn-ghost sb-btn-sm" onClick={() => setEditingName(false)} style={{ padding:'2px 6px' }}>x</button>
              </div>
            ) : (
              <div style={{ fontWeight:700, fontSize:14, color:'var(--sb-text)', cursor:'pointer', lineHeight:1.3 }} onClick={() => { setNameInput(game?.name||''); setEditingName(true) }} title="Click to edit">
                {game?.name || 'Stress Buster'} <span style={{ fontSize:10, color:'var(--sb-text3)', fontWeight:400 }}>edit</span>
              </div>
            )}
            <div style={{ fontSize:9.5, fontWeight:600, color:'var(--sb-text3)', letterSpacing:'.04em', textTransform:'uppercase', marginTop:1 }}>Builder</div>
          </div>
        </div>

        <div className="sb-tabs" style={{ marginBottom:0, borderBottom:'none', justifySelf:'center' }}>
          {TABS.map(t => {
            const hasErr = upload.tabHasError(t.id, TAB_FIELDS[t.id] || [])
            return (
              <button key={t.id} className={`sb-tab${activeTab===t.id?' active':''}`} onClick={() => setActiveTab(t.id)} style={{ padding:'6px 14px', fontSize:12.5 }}>
                {t.label}{hasErr && <span className="gb-tab-err-dot" />}
              </button>
            )
          })}
        </div>

        <div style={{ display:'flex', gap:6, alignItems:'center', justifySelf:'end' }}>
          <button className="sb-btn sb-btn-ghost sb-btn-sm" style={{ padding:'6px 8px', fontSize:16, lineHeight:1 }}
            onClick={() => { navigator.clipboard.writeText(gameLink); showToast('Link copied!') }}
            title="Copy game link">link</button>
          <a href={gameLink} target="_blank" rel="noreferrer" className="sb-btn sb-btn-ghost sb-btn-sm"
            style={{ padding:'6px 8px', fontSize:16, lineHeight:1, textDecoration:'none' }}
            title="Preview game">preview</a>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 20px', display:'grid', gridTemplateColumns: previewTabs.includes(activeTab) ? 'minmax(0, 1fr) 320px' : '1fr', gap:24, alignItems:'start' }}>

        <div>
          {activeTab === 'display' && (
          <div>
            <div className="sb-card" style={{ padding:20, marginBottom:16 }}>
              <div className="sb-section-title">Visuals</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(220px, 1fr))', gap:20, justifyItems:'center', alignItems:'start' }}>
                <ImageUpload label="Game Background Image" url={settings._bgPreview || settings.bg_image_url} error={upload.errors.bg_image_url} onFile={f => { upload.clearFieldError('bg_image_url'); setS('_bgImageFile', f); setS('_bgPreview', URL.createObjectURL(f)) }} onClear={() => { setS('bg_image_url', ''); setS('_bgImageFile', null); setS('_bgPreview', null) }} />
                <ImageUpload label="Game Logo" url={settings._logoPreview || settings.game_logo_url} error={upload.errors.game_logo_url} onFile={f => { upload.clearFieldError('game_logo_url'); setS('_gameLogoFile', f); setS('_logoPreview', URL.createObjectURL(f)) }} onClear={() => { setS('game_logo_url', ''); setS('_gameLogoFile', null); setS('_logoPreview', null) }} />
              </div>
            </div>

            <div className="sb-card" style={{ padding:20, marginBottom:16 }}>
              <div className="sb-section-title">Game Texts</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'12px 16px', alignItems:'end' }}>
                <div className="sb-fg" style={{ marginBottom:0 }}><span className="sb-label">Heading 1 (title)</span><input value={settings.heading_1 || ''} onChange={e => setS('heading_1', e.target.value)} placeholder="Main title" /></div>
                <ColorPicker value={settings.heading_1_color || '#1a1a2e'} onChange={v => setS('heading_1_color', v)} label="Color" />
                <div className="sb-fg" style={{ marginBottom:0 }}><span className="sb-label">Heading 2 (subtitle)</span><input value={settings.heading_2 || ''} onChange={e => setS('heading_2', e.target.value)} placeholder="Sub-heading" /></div>
                <ColorPicker value={settings.heading_2_color || '#1a1a2e'} onChange={v => setS('heading_2_color', v)} label="Color" />
                <div className="sb-fg" style={{ marginBottom:0 }}><span className="sb-label">Intro Text (body, shown before game)</span><input value={settings.heading_3 || ''} onChange={e => setS('heading_3', e.target.value)} placeholder="Intro text" /></div>
                <ColorPicker value={settings.heading_3_color || '#444444'} onChange={v => setS('heading_3_color', v)} label="Color" />
              </div>
            </div>

            <div className="sb-card" style={{ padding:20, marginBottom:16 }}>
              <div className="sb-section-title">Form Fields</div>
              <p style={{ color:'var(--sb-text2)', marginBottom:16, fontSize:13 }}>These fields appear on the registration screen before the game starts.</p>
              {formFields.map((f,i) => (
                <div key={i} className="sb-card" style={{ marginBottom:10, padding:'12px 16px' }}>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
                    <div className="sb-fg" style={{ flex:2, minWidth:130 }}><span className="sb-label">Label</span><input value={f.field_label} onChange={e => updateFormField(i,'field_label',e.target.value)} /></div>
                    <div className="sb-fg" style={{ flex:1, minWidth:110 }}><span className="sb-label">Type</span><select value={f.field_type} onChange={e => updateFormField(i,'field_type',e.target.value)}><option value="text">Text</option><option value="email">Email</option><option value="phone">Phone</option><option value="number">Number</option><option value="textarea">Textarea</option><option value="select">Dropdown</option></select></div>
                    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer', paddingBottom:2, whiteSpace:'nowrap' }}><input type="checkbox" checked={!!f.is_required} onChange={e => updateFormField(i,'is_required',e.target.checked?1:0)} style={{ width:16,height:16 }} /> Required</label>
                    <button className="sb-btn sb-btn-danger sb-btn-sm" onClick={() => removeFormField(i)}>x</button>
                  </div>
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'center' }}>
                <button className="sb-btn sb-btn-ghost" onClick={addFormField}>+ Add Field</button>
                <button className="sb-btn sb-btn-primary" onClick={saveFormFields} disabled={savingForm}>{savingForm ? 'Saving...' : 'Save Form'}</button>
              </div>
            </div>

            <div className="sb-card" style={{ padding:20, marginBottom:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <div>
                  <div className="sb-section-title">Terms & Conditions</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}><input type="checkbox" id="termsEnabled" checked={!!settings.terms_enabled} onChange={e => setS('terms_enabled', e.target.checked?1:0)} style={{ width:16,height:16 }} /><label htmlFor="termsEnabled" style={{ fontWeight:600, cursor:'pointer', fontSize:13 }}>Require acceptance</label></div>
                  <div className="sb-fg" style={{ marginBottom:10 }}><span className="sb-label">Label Text</span><input value={settings.terms_text||''} onChange={e => setS('terms_text', e.target.value)} placeholder="Terms & Conditions" /></div>
                  <div className="sb-fg" style={{ marginBottom:0 }}><span className="sb-label">URL (optional)</span><input value={settings.terms_url||''} onChange={e => setS('terms_url', e.target.value)} placeholder="https://yoursite.com/terms" /></div>
                </div>
                <div>
                  <div className="sb-section-title">Start Button</div>
                  <div className="sb-fg" style={{ marginBottom:10 }}><span className="sb-label">Button Text</span><input value={settings.start_button_text||''} onChange={e => setS('start_button_text', e.target.value)} placeholder="Start Game" /></div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <ColorPicker value={settings.start_button_text_color||'#ffffff'} onChange={v => setS('start_button_text_color', v)} label="Text Color" />
                    <ColorPicker value={settings.start_button_bg_color||''} onChange={v => setS('start_button_bg_color', v)} label="Background Color" />
                  </div>
                </div>
              </div>
            </div>

            <button className="sb-btn sb-btn-primary" onClick={saveSettings} disabled={saving} style={{ width:'100%', padding:'12px', justifyContent:'center', fontSize:14 }}>
              {saving ? 'Saving...' : 'Save Display Settings'}
            </button>
          </div>
        )}

        {activeTab === 'game' && (
          <div>
            <div className="sb-card" style={{ padding:20, marginBottom:16 }}>
              <div className="sb-section-title">Cat Damage Challenge</div>
              <p style={{ color:'var(--sb-text2)', marginBottom:16, fontSize:13 }}>Configure the cat damage game. Player clicks the cat to deal damage. Destroy the cat before the click limit runs out!</p>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:20, marginBottom:20 }}>
                <div className="sb-fg">
                  <span className="sb-label">Cat Health</span>
                  <input type="number" value={settings.cat_health || 20} onChange={e => setS('cat_health', e.target.value)} min={1} max={999} placeholder="20" />
                  <span style={{ fontSize:11, color:'var(--sb-text3)', marginTop:2 }}>Default: 20</span>
                </div>
                <div className="sb-fg">
                  <span className="sb-label">Maximum Click Limit</span>
                  <input type="number" value={settings.click_limit || 21} onChange={e => setS('click_limit', e.target.value)} min={1} max={199} placeholder="21" />
                  <span style={{ fontSize:11, color:'var(--sb-text3)', marginTop:2 }}>Min: 1, Max: 199</span>
                </div>
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderRadius:10, border:'1.5px solid var(--sb-border)', background:'var(--sb-surface2)', cursor:'pointer' }}>
                  <div onClick={() => setS('frustration_mode', settings.frustration_mode === 1 || settings.frustration_mode === true ? 0 : 1)} style={{ width:44, height:24, borderRadius:12, background: settings.frustration_mode === 1 || settings.frustration_mode === true ? 'var(--sb-primary)' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: settings.frustration_mode === 1 || settings.frustration_mode === true ? 22 : 2, transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                  </div>
                  <div><div style={{ fontSize:13, fontWeight:600, color:'var(--sb-text)' }}>Frustration Mode</div><div style={{ fontSize:11, color:'var(--sb-text3)' }}>Enable multiplayer frustration measurement (players enter name + number, measures start vs final click speed)</div></div>
                </label>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:20 }}>
                <label style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderRadius:10, border:'1.5px solid var(--sb-border)', background:'var(--sb-surface2)', cursor:'pointer' }}>
                  <div onClick={() => setS('show_click_count', settings.show_click_count === 1 || settings.show_click_count === true ? 0 : 1)} style={{ width:44, height:24, borderRadius:12, background: settings.show_click_count === 1 || settings.show_click_count === true ? 'var(--sb-primary)' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: settings.show_click_count === 1 || settings.show_click_count === true ? 22 : 2, transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                  </div>
                  <div><div style={{ fontSize:13, fontWeight:600, color:'var(--sb-text)' }}>Click Counter</div><div style={{ fontSize:11, color:'var(--sb-text3)' }}>Show clicks progress</div></div>
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderRadius:10, border:'1.5px solid var(--sb-border)', background:'var(--sb-surface2)', cursor:'pointer' }}>
                  <div onClick={() => setS('millisecond_display', settings.millisecond_display === 1 || settings.millisecond_display === true ? 0 : 1)} style={{ width:44, height:24, borderRadius:12, background: settings.millisecond_display === 1 || settings.millisecond_display === true ? 'var(--sb-primary)' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: settings.millisecond_display === 1 || settings.millisecond_display === true ? 22 : 2, transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                  </div>
                  <div><div style={{ fontSize:13, fontWeight:600, color:'var(--sb-text)' }}>Millisecond Display</div><div style={{ fontSize:11, color:'var(--sb-text3)' }}>Show click speed in ms</div></div>
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderRadius:10, border:'1.5px solid var(--sb-border)', background:'var(--sb-surface2)', cursor:'pointer' }}>
                  <div onClick={() => setS('frustration_enabled', settings.frustration_enabled === 1 || settings.frustration_enabled === true ? 0 : 1)} style={{ width:44, height:24, borderRadius:12, background: settings.frustration_enabled === 1 || settings.frustration_enabled === true ? 'var(--sb-primary)' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: settings.frustration_enabled === 1 || settings.frustration_enabled === true ? 22 : 2, transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                  </div>
                  <div><div style={{ fontSize:13, fontWeight:600, color:'var(--sb-text)' }}>Frustration System</div><div style={{ fontSize:11, color:'var(--sb-text3)' }}>Enable frustration measurement</div></div>
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderRadius:10, border:'1.5px solid var(--sb-border)', background:'var(--sb-surface2)', cursor:'pointer' }}>
                  <div onClick={() => setS('show_click_speed', settings.show_click_speed === 1 || settings.show_click_speed === true ? 0 : 1)} style={{ width:44, height:24, borderRadius:12, background: settings.show_click_speed === 1 || settings.show_click_speed === true ? 'var(--sb-primary)' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: settings.show_click_speed === 1 || settings.show_click_speed === true ? 22 : 2, transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                  </div>
                  <div><div style={{ fontSize:13, fontWeight:600, color:'var(--sb-text)' }}>Show Click Speed</div><div style={{ fontSize:11, color:'var(--sb-text3)' }}>Display real-time click speed</div></div>
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderRadius:10, border:'1.5px solid var(--sb-border)', background:'var(--sb-surface2)', cursor:'pointer' }}>
                  <div onClick={() => setS('show_frustration_result', settings.show_frustration_result === 1 || settings.show_frustration_result === true ? 0 : 1)} style={{ width:44, height:24, borderRadius:12, background: settings.show_frustration_result === 1 || settings.show_frustration_result === true ? 'var(--sb-primary)' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: settings.show_frustration_result === 1 || settings.show_frustration_result === true ? 22 : 2, transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                  </div>
                  <div><div style={{ fontSize:13, fontWeight:600, color:'var(--sb-text)' }}>Show Frustration Result</div><div style={{ fontSize:11, color:'var(--sb-text3)' }}>Show frustration % in results</div></div>
                </label>
              </div>
            </div>

            <div className="sb-card" style={{ padding:20, marginBottom:16 }}>
              <div className="sb-section-title">Win / Retry</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <div className="sb-fg"><span className="sb-label">Custom Win Message</span><input value={settings.custom_win_msg || ''} onChange={e => setS('custom_win_msg', e.target.value)} placeholder="Congratulations! You won!" /></div>
                <div className="sb-fg"><span className="sb-label">Try Again Button Text</span><input value={settings.try_again_btn_text || ''} onChange={e => setS('try_again_btn_text', e.target.value)} placeholder="Try Again" /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginTop:16 }}>
                <ColorPicker value={settings.try_again_text_color||'#ffffff'} onChange={v => setS('try_again_text_color', v)} label="Try Again Text Color" />
                <ColorPicker value={settings.try_again_bg_color||''} onChange={v => setS('try_again_bg_color', v)} label="Try Again Background" />
              </div>
            </div>

            <div className="sb-card" style={{ padding:20, marginBottom:16 }}>
              <div className="sb-section-title">Continue Button</div>
              <div className="sb-fg" style={{ marginBottom:10 }}><span className="sb-label">Button Text</span><input value={settings.continue_btn_text||''} onChange={e => setS('continue_btn_text', e.target.value)} placeholder="Continue" /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <ColorPicker value={settings.continue_btn_text_color||'#ffffff'} onChange={v => setS('continue_btn_text_color', v)} label="Text Color" />
                <ColorPicker value={settings.continue_btn_bg_color||''} onChange={v => setS('continue_btn_bg_color', v)} label="Background Color" />
              </div>
            </div>

            <button className="sb-btn sb-btn-primary" onClick={saveSettings} disabled={saving} style={{ width:'100%', padding:'12px', justifyContent:'center', fontSize:14 }}>
              {saving ? 'Saving...' : 'Save Game Settings'}
            </button>
          </div>
        )}

        {activeTab === 'sounds' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
              <div>
                <h3 style={{ color:'var(--sb-text)', fontFamily:'inherit', marginBottom:4 }}>Sound Library</h3>
                <p style={{ color:'var(--sb-text2)', fontSize:13 }}>Upload MP3, WAV or OGG files, then assign them below.</p>
              </div>
              <div>
                <input type="file" ref={soundUploadRef} accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/x-wav,audio/wave" onChange={uploadSound} style={{ display:'none' }} />
                <button className="sb-btn sb-btn-primary" onClick={() => soundUploadRef.current.click()} disabled={soundUploading}>
                  {soundUploading ? 'Uploading...' : '+ Upload Sound'}
                </button>
              </div>
            </div>

            <div className="sb-card" style={{ marginBottom:20, padding:16 }}>
              <div className="sb-section-title">Assign Sounds to Game</div>
              <p style={{ color:'var(--sb-text2)', fontSize:12, marginBottom:14 }}>Upload sounds above first, then select them here.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:16 }}>
                <SoundSelector label="Correct Pop Sound" value={settings.sound_correct_id} onChange={v => setS('sound_correct_id', v)} sounds={sounds} />
                <SoundSelector label="Wrong Pop Sound" value={settings.sound_wrong_id} onChange={v => setS('sound_wrong_id', v)} sounds={sounds} />
                <SoundSelector label="Win Sound" value={settings.win_sound_id} onChange={v => setS('win_sound_id', v)} sounds={sounds} />
                <SoundSelector label="Lose Sound" value={settings.lose_sound_id} onChange={v => setS('lose_sound_id', v)} sounds={sounds} />
              </div>
              <div style={{ display:'flex', justifyContent:'center' }}>
                <button className="sb-btn sb-btn-primary sb-btn-sm" onClick={saveSettings} disabled={saving}>{saving ? 'Saving...' : 'Save Sound Assignments'}</button>
              </div>
            </div>

            {sounds.length === 0 ? (
              <div className="sb-empty">
                <div className="sb-empty-icon">Sound</div>
                <h3 style={{ color:'var(--sb-text)', marginBottom:8 }}>No sounds yet</h3>
                <p>Upload MP3, WAV, or OGG files</p>
                <button className="sb-btn sb-btn-primary" style={{ marginTop:16 }} onClick={() => soundUploadRef.current.click()}>+ Upload Sound</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {sounds.map(s => (
                  <div key={s.id} className="sb-card" style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:'var(--sb-text)' }}>{s.name}</div>
                      <div style={{ color:'var(--sb-text3)', fontSize:11, marginTop:2 }}>ID: {s.id} - {s.sound_type}</div>
                    </div>
                    <audio controls src={s.url} style={{ height:32 }} />
                    <button className="sb-btn sb-btn-danger sb-btn-sm sb-btn-icon" onClick={() => deleteSound(s)}>del</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'email' && (
          <div>
            <div className="sb-card" style={{ padding:20, marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, gap:12, flexWrap:'wrap' }}>
                <div>
                  <div className="sb-section-title" style={{ marginBottom:4 }}>Email Template</div>
                  <p style={{ color:'var(--sb-text2)', fontSize:13, margin:0 }}>Configure the completion email sent to players.</p>
                </div>
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={!!emailTemplate.is_enabled}
                    onChange={e => setEmailTemplate({ ...emailTemplate, is_enabled:e.target.checked?1:0 })}
                    style={{ width:16, height: 16 }}
                  />
                  Enable email
                </label>
              </div>

              <div style={{ background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:10, padding:'12px 14px', color:'#92400e', fontSize:13, marginBottom:16 }}>
                Use {'{{name}}'}, {'{{score}}'}, {'{{total}}'}, and {'{{game_name}}'} as placeholders.
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <div className="sb-fg"><span className="sb-label">Sender Name</span><input value={emailTemplate.sender_name||''} onChange={e => setEmailTemplate({ ...emailTemplate, sender_name:e.target.value })} placeholder="Promo Games" /></div>
                <div className="sb-fg"><span className="sb-label">Sender Email</span><input value={emailTemplate.sender_email||''} onChange={e => setEmailTemplate({ ...emailTemplate, sender_email:e.target.value })} placeholder="noreply@yourdomain.com" /></div>
              </div>

              <div className="sb-fg" style={{ marginBottom:14 }}>
                <span className="sb-label">Subject</span>
                <input value={emailTemplate.subject||''} onChange={e => setEmailTemplate({ ...emailTemplate, subject:e.target.value })} placeholder="Congratulations {{name}}!" />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'flex-end', marginBottom:14 }}>
                <div className="sb-fg"><span className="sb-label">Header Text</span><input value={emailTemplate.header_text||''} onChange={e => setEmailTemplate({ ...emailTemplate, header_text:e.target.value })} placeholder="Congratulations!" /></div>
                <ColorPicker value={emailTemplate.header_color||'#9333ea'} onChange={v => setEmailTemplate({ ...emailTemplate, header_color:v })} label="Header Color" />
              </div>

              <div className="sb-fg" style={{ marginBottom:14 }}>
                <span className="sb-label">Email Body (HTML)</span>
                <textarea rows={7} value={emailTemplate.body_html||''} onChange={e => setEmailTemplate({ ...emailTemplate, body_html:e.target.value })} placeholder="<p>Thank you for playing, {{name}}!</p>" style={{ resize:'vertical', fontFamily:'monospace', fontSize:13 }} />
              </div>

              <div className="sb-fg" style={{ marginBottom:20 }}>
                <span className="sb-label">Footer Text</span>
                <input value={emailTemplate.footer_text||''} onChange={e => setEmailTemplate({ ...emailTemplate, footer_text:e.target.value })} placeholder="Your Company" />
              </div>

              <button className="sb-btn sb-btn-primary" onClick={saveEmailTemplate} disabled={saving} style={{ width:'100%', padding:'12px', justifyContent:'center', fontSize:14 }}>
                {saving ? 'Saving...' : 'Save Email Template'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'thankyou' && (
          <div>
            <div className="ty-grid">
              <div className="ty-card">
                <div className="ty-card-title">Thank You Background</div>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
                  {(settings._tyPreview || settings.thankyou_bg_image_url) ? (
                    <div className={upload.errors.thankyou_bg_image_url ? 'gb-img-error' : ''} style={{ position:'relative', borderRadius:12, overflow:'hidden', background:'#f5f5f5' }}>
                      <img src={settings._tyPreview || settings.thankyou_bg_image_url} alt="" style={{ width:'100%', height:160, objectFit:'cover', display:'block' }} />
                      <button className="sb-btn sb-btn-danger sb-btn-sm" onClick={() => { setS('thankyou_bg_image_url',''); setS('_tyBgImageFile',null); setS('_tyPreview',null) }} style={{ position:'absolute', top:8, right:8, borderRadius:8, padding:'4px 10px', fontSize:11 }}>Remove</button>
                      {upload.errors.thankyou_bg_image_url && <div className="gb-img-error-msg">⚠️ {upload.errors.thankyou_bg_image_url}</div>}
                    </div>
                  ) : (
                    <label className={`ty-upload-zone${upload.errors.thankyou_bg_image_url ? ' gb-img-error' : ''}`} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                      <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => { upload.clearFieldError('thankyou_bg_image_url'); const f=e.target.files[0]; if(f){ setS('_tyBgImageFile',f); setS('_tyPreview',URL.createObjectURL(f)) } }} />
                      <div style={{ fontSize:32, opacity:0.4 }}>Upload</div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--sb-text2)' }}>Click to upload background</div>
                      <div style={{ fontSize:11, color:'var(--sb-text3)' }}>PNG, JPG, WEBP up to 5MB</div>
                      {upload.errors.thankyou_bg_image_url && <div className="gb-img-error-msg">⚠️ {upload.errors.thankyou_bg_image_url}</div>}
                    </label>
                  )}
                </div>
              </div>

              <div className="ty-card">
                <div className="ty-card-title">Thank You Message</div>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16 }}>
                  <div className="ty-input-row">
                    <div className="sb-fg"><span className="sb-label">Heading Text</span><input value={settings.thankyou_heading_text||''} onChange={e=>setS('thankyou_heading_text',e.target.value)} placeholder="You completed the game!" /></div>
                    <ColorPicker value={settings.thankyou_heading_color||'#1a1a2e'} onChange={v=>setS('thankyou_heading_color',v)} label="Color" />
                  </div>
                  <div className="ty-input-row">
                    <div className="sb-fg"><span className="sb-label">Subtitle Text</span><input value={settings.thankyou_subtitle_text||''} onChange={e=>setS('thankyou_subtitle_text',e.target.value)} placeholder="Thank you for completing!" /></div>
                    <ColorPicker value={settings.thankyou_subtitle_color||'#444444'} onChange={v=>setS('thankyou_subtitle_color',v)} label="Color" />
                  </div>
                </div>
              </div>
            </div>

            <div className="ty-grid" style={{ marginTop:24 }}>
              <div className="ty-card ty-card-full">
                <div className="ty-card-title">Submit Button</div>
                <div className="ty-input-row">
                  <div className="sb-fg"><span className="sb-label">Button Text</span><input value={settings.submit_btn_text||''} onChange={e=>setS('submit_btn_text',e.target.value)} placeholder="Submit & Explore" /></div>
                  <ColorPicker value={settings.submit_btn_text_color||'#ffffff'} onChange={v=>setS('submit_btn_text_color',v)} label="Text Color" />
                  <ColorPicker value={settings.submit_btn_bg_color||'#000000'} onChange={v=>setS('submit_btn_bg_color',v)} label="Background" />
                </div>
              </div>
            </div>

            <div className="ty-grid" style={{ marginTop:24 }}>
              <div className="ty-card">
                <div className="ty-card-title">Confirmation GIF</div>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
                  {(settings._submitGifPreview || settings.submit_confirm_gif_url) ? (
                    <div style={{ position:'relative', borderRadius:12, overflow:'hidden', background:'#f5f5f5' }}>
                      <img src={settings._submitGifPreview || settings.submit_confirm_gif_url} alt="" style={{ width:'100%', height:160, objectFit:'contain', display:'block', background:'#f9f9f9', borderRadius:12 }} />
                      <button className="sb-btn sb-btn-danger sb-btn-sm" onClick={() => { setS('submit_confirm_gif_url',''); setS('_submitGifFile',null); setS('_submitGifPreview',null) }} style={{ position:'absolute', top:8, right:8, borderRadius:8, padding:'4px 10px', fontSize:11 }}>Remove</button>
                    </div>
                  ) : (
                    <label className="ty-upload-zone" style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                      <input type="file" accept="image/gif,image/png,image/jpeg,image/webp" style={{ display:'none' }} onChange={e => { const f=e.target.files[0]; if(f){ setS('_submitGifFile',f); setS('_submitGifPreview',URL.createObjectURL(f)) } }} />
                      <div style={{ fontSize:32, opacity:0.4 }}>GIF</div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--sb-text2)' }}>Click to upload GIF / Image</div>
                      <div style={{ fontSize:11, color:'var(--sb-text3)' }}>GIF, PNG, JPG up to 10MB</div>
                    </label>
                  )}
                </div>
              </div>

              <div className="ty-card">
                <div className="ty-card-title">Redirect & Continue</div>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16 }}>
                  <div className="sb-fg"><span className="sb-label">Post-Game Redirect URL</span><input value={settings.redirect_url||''} onChange={e=>setS('redirect_url',e.target.value)} placeholder="https://yourwebsite.com/thankyou" /><span style={{ fontSize:11, color:'var(--sb-text3)', marginTop:2 }}>Where players go after completing. Leave blank for default.</span></div>
                  <div style={{ height:1, background:'var(--sb-border)', margin:'4px 0' }} />
                  <div className="ty-input-row">
                    <div className="sb-fg"><span className="sb-label">Continue Button Text</span><input value={settings.continue_now_btn_text||''} onChange={e=>setS('continue_now_btn_text',e.target.value)} placeholder="Continue Now" /></div>
                    <ColorPicker value={settings.continue_now_btn_text_color||'#ffffff'} onChange={v=>setS('continue_now_btn_text_color',v)} label="Text Color" />
                    <ColorPicker value={settings.continue_now_btn_bg_color||'#000000'} onChange={v=>setS('continue_now_btn_bg_color',v)} label="Background" />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop:24 }}>
              <button className="sb-btn sb-btn-primary" onClick={saveSettings} disabled={saving} style={{ width:'100%', padding:'14px', justifyContent:'center', fontSize:14, borderRadius:14 }}>
                {saving ? 'Saving...' : 'Save Thank You Settings'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <div className="sb-card" style={{ padding:20, marginBottom:16 }}>
              <div className="sb-section-title">Game URL Slug</div>
              <p style={{ color:'var(--sb-text2)', fontSize:12, marginBottom:8 }}>This determines the public URL: <code style={{ fontSize:11 }}>{window.location.origin}/play/{slugInput || 'your-slug'}/{game?.client_slug || '...'}</code></p>
              <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                <div className="sb-fg" style={{ marginBottom:0, flex:1 }}><span className="sb-label">Slug</span><input value={slugInput} onChange={e => setSlugInput(e.target.value)} placeholder="my-game-slug" /></div>
                <button className="sb-btn sb-btn-primary sb-btn-sm" onClick={saveSlug} style={{ marginBottom:1 }}>Save Slug</button>
              </div>
            </div>

            <div className="sb-card" style={{ padding:20, marginBottom:16 }}>
              <div className="sb-section-title">Colors</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <ColorPicker value={settings.bg_color || '#ffffff'} onChange={v => setS('bg_color', v)} label="Background Color" />
                <ColorPicker value={settings.primary_color || '#9333ea'} onChange={v => setS('primary_color', v)} label="Primary / Accent Color" />
              </div>
            </div>

            <div className="sb-card" style={{ padding:20, marginBottom:16 }}>
              <div className="sb-section-title">Font Family</div>
              <div style={{ display:'grid', gap:12 }}>
                {FONT_CATEGORIES.map((cat, ci) => (
                  <div key={cat.name} style={ci < FONT_CATEGORIES.length - 1 ? {paddingBottom:12,borderBottom:'1px solid var(--sb-border)'} : {}}>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', color:'var(--sb-text3)', marginBottom:6 }}>{cat.name}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                      {cat.fonts.map(font => (
                        <div key={font} onClick={() => setS('font_family', font)} style={{ padding:'6px 8px', borderRadius:6, cursor:'pointer', fontSize:12, border:`1.5px solid ${settings.font_family===font||(!settings.font_family&&font==='DM Sans') ? 'var(--sb-primary)' : 'var(--sb-border)'}`, background: settings.font_family===font||(!settings.font_family&&font==='DM Sans') ? '#f5f0ff' : '#fff', transition:'all .12s', fontFamily: "'" + font + "', sans-serif" }}>
                          <div style={{ fontWeight:700, lineHeight:1.3 }}>{font}</div>
                          <div style={{ color:'#888', fontWeight:400, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>The quick brown fox</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sb-card" style={{ padding:20, marginBottom:16 }}>
              <div className="sb-section-title">Social Share Preview</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
                <div>
                  <p style={{ color:'var(--sb-text2)', fontSize:12, marginBottom:10 }}>Text shown when the game link is shared on WhatsApp, Facebook etc.</p>
                  <div className="sb-fg" style={{ marginBottom:0 }}><span className="sb-label">Share Description</span><input value={settings.meta_description||''} onChange={e => setS('meta_description', e.target.value)} placeholder="Play this game and win exciting rewards!" maxLength={200} /><span style={{ fontSize:11, color:'var(--sb-text3)', marginTop:2 }}>{(settings.meta_description||'').length}/200</span></div>
                </div>
                <div style={{ border:'1px solid var(--sb-border)', borderRadius:10, overflow:'hidden', background:'#fff', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ height:120, background: gameBgUrl ? `center/cover url(${gameBgUrl})` : (settings.primary_color||'#9333ea'), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:32, fontWeight:800 }}></div>
                  <div style={{ padding:'12px 14px' }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', color:'#888', marginBottom:3 }}>{window.location.hostname || 'yourdomain.com'}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#1a1a2e', marginBottom:4, lineHeight:1.3 }}>{game?.name || 'Untitled'}</div>
                    <div style={{ fontSize:12, color:'#555', lineHeight:1.4 }}>{settings.meta_description || 'Play this game and win exciting rewards!'}</div>
                  </div>
                </div>
              </div>
            </div>

            <button className="sb-btn sb-btn-primary" onClick={saveSettings} disabled={saving} style={{ width:'100%', padding:'12px', justifyContent:'center', fontSize:14 }}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}

        </div>

        {/* RIGHT COL - Phone Mockup */}
        {activeTab !== 'email' && (
          <PhoneFrame settings={settings}>
            {activeTab === 'display' && (
              <FormPreview settings={settings} formFields={formFields} bgUrl={gameBgUrl} logoUrl={gameLogoUrl} />
            )}
            {activeTab === 'thankyou' && (
              <ThankYouPreview settings={settings} bgUrl={thankyouBgUrl} submitGifUrl={submitGifUrl} />
            )}
            {activeTab === 'settings' && (
              <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column', background: gameBgUrl ? `url(${gameBgUrl}) center/cover` : (settings.bg_color||'#1e1b4b'), padding:'18px 14px' }}>
                <div style={{ width:'100%', maxWidth:280, margin:'auto auto 16px', background:'rgba(255,255,255,0.94)', borderRadius:20, padding:'18px 16px', boxShadow:'0 8px 32px rgba(0,0,0,0.16)', textAlign:'center' }}>
                  {gameLogoUrl && <img src={gameLogoUrl} alt="" style={{ maxWidth:'100%', maxHeight:58, objectFit:'contain', display:'block', margin:'0 auto 12px', borderRadius:8 }} />}
                  <h2 style={{ margin:'0 0 6px', fontSize:18, lineHeight:1.2, color:settings.heading_1_color||'#1a1a2e', fontWeight:800 }}>{settings.heading_1 || game?.name || 'Game Title'}</h2>
                  <p style={{ margin:'0 0 14px', fontSize:12, lineHeight:1.35, color:settings.heading_2_color||'#666666' }}>{settings.heading_2 || 'Your game subtitle appears here'}</p>
                  <div style={{ width:'100%', borderRadius:10, padding:'10px 12px', background:settings.start_button_bg_color||`linear-gradient(135deg, ${settings.primary_color||'#9333ea'}, ${(settings.primary_color||'#9333ea')}cc)`, color:settings.start_button_text_color||'#ffffff', fontSize:13, fontWeight:800 }}>{settings.start_button_text||'Start Game'}</div>
                </div>
              </div>
            )}
          </PhoneFrame>
        )}

        {activeTab === 'email' && (() => {
          const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { margin:0; padding:0; background:#f4f4f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    .wrap { max-width:600px; margin:0 auto; background:#fff; }
    .preheader { padding:12px 20px; color:#6b7280; font-size:12px; border-bottom:1px solid #ececf1; }
    .header { background:${emailTemplate.header_color||'#9333ea'}; padding:24px 20px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:20px; font-weight:700; }
    .body { padding:24px 20px; color:#333; font-size:14px; line-height:1.6; }
    .footer { padding:16px 20px; text-align:center; font-size:11px; color:#999; border-top:1px solid #eee; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="preheader">${emailTemplate.subject||'Congratulations {{name}}!'}</div>
    <div class="header"><h1>${emailTemplate.header_text||'Congratulations!'}</h1></div>
    <div class="body">${emailTemplate.body_html||'<p>Thank you for completing the game, {{name}}!</p><p>Your score: {{score}} / {{total}}</p>'}</div>
    <div class="footer">${emailTemplate.footer_text||''}</div>
  </div>
</body>
</html>`.trim()
          return (
            <div style={{ position:'sticky', top:80, width:320, height:580, flexShrink:0 }}>
              <div style={{ height:'100%', borderRadius:18, border:'1.5px solid var(--sb-border)', overflow:'hidden', background:'#f4f4f6', boxShadow:'0 12px 48px rgba(0,0,0,.12)' }}>
                <iframe
                  title="Email Preview"
                  srcDoc={html}
                  style={{ width:'100%', height:'100%', border:'none', background:'#f4f4f6' }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )
        })()}

      </div>

      {toast && <ToastComp msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}