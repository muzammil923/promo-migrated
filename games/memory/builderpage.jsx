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
.mb-btn-success{background:#F0FDF4;color:#16A34A;border:1.5px solid #BBF7D0}
.mb-btn-success:hover{background:#DCFCE7}
.mb-icon-btn{width:30px;height:30px;border-radius:7px;border:1.5px solid #E5E7EB;background:#F9FAFB;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:#374151;transition:background .13s;flex-shrink:0}
.mb-icon-btn:hover{background:#F0F0F0}
.mb-icon-btn.del{border-color:#FEE2E2;background:#FFF5F5;color:#DC2626}
.mb-icon-btn.del:hover{background:#FEE2E2}
.mb-card{background:#fff;border:1.5px solid #EAECF0;border-radius:14px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04);animation:mbFadeUp .25s ease both}
.mb-card-title{font-size:13px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px}
.mb-section{background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:14px;margin-bottom:12px}
.mb-section-title{font-size:10.5px;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.mb-2col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mb-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.mb-row{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap}
.mb-col{flex:1;min-width:140px}
.mb-fg{display:flex;flex-direction:column;gap:4px;flex:1;min-width:120px}
.mb-swatch{width:28px;height:28px;border-radius:6px;border:2px solid #E5E7EB;cursor:pointer;flex-shrink:0}
.mb-cpop{position:absolute;top:calc(100%+6px);left:0;z-index:300;background:#fff;border:1.5px solid #E5E7EB;border-radius:10px;padding:12px;box-shadow:0 8px 24px rgba(0,0,0,.12);display:grid;grid-template-columns:repeat(7,1fr);gap:5px;width:220px}
.mb-thumb{height:44px;width:auto;border-radius:6px;border:1px solid #E5E7EB;object-fit:contain}
.mb-empty{text-align:center;padding:48px 20px;color:#9CA3AF}
.mb-empty-icon{font-size:40px;margin-bottom:10px}
.mb-grid{display:flex;flex-wrap:wrap;gap:8px}
.mb-tile-card{width:80px;height:80px;border-radius:8px;border:2px solid #E5E7EB;overflow:hidden;position:relative;background:#f9f9fb;display:flex;align-items:center;justify-content:center;transition:border-color .15s}
.mb-tile-card:hover{border-color:#818CF8}
.mb-tile-card img{width:100%;height:100%;object-fit:cover}
.mb-tile-del{position:absolute;top:-5px;right:-5px;width:20px;height:20px;border-radius:50%;border:none;background:#DC2626;color:#fff;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.mb-tile-add{width:80px;height:80px;border-radius:8px;border:2px dashed #CBD5E1;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#94A3B8;font-size:28px;transition:border-color .15s,color .15s}
.mb-tile-add:hover{border-color:#818CF8;color:#818CF8}
.mb-header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:12px 24px;background:#fff;border-bottom:1.5px solid #EAECF0;position:sticky;top:0;z-index:50;min-height:56px}
.mb-tabs{display:flex;gap:4px}
.mb-tab{padding:8px 16px;border-radius:8px;border:none;background:transparent;color:#6B7280;font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .14s;white-space:nowrap}
.mb-tab:hover{background:#F3F4F6;color:#374151}
.mb-tab.active{background:#EEF2FF;color:#4338CA;font-weight:600}
.mb-body{display:grid;grid-template-columns:1fr 320px;gap:24px;padding:24px;max-width:1200px;margin:0 auto}
.mb-phone{width:280px;height:560px;border-radius:36px;border:3px solid #D1D5DB;background:#F9FAFB;overflow:hidden;position:sticky;top:80px;box-shadow:0 8px 32px rgba(0,0,0,.12),inset 0 0 0 1px rgba(0,0,0,.05)}
.mb-phone-notch{width:120px;height:18px;background:#111;border-radius:0 0 14px 14px;margin:0 auto;position:relative;z-index:2}
.mb-phone-screen{height:calc(100% - 18px);overflow-y:auto;position:relative}
`

const FONT_CATEGORIES = [
  { name:'Handwriting', icon:'✍️', fonts:['Dancing Script','Pacifico','Caveat','Shadows Into Light','Satisfy','Kalam','Patrick Hand','Permanent Marker','Indie Flower','Gloria Hallelujah','Bad Script','Reenie Beanie'] },
  { name:'Professional', icon:'💼', fonts:['DM Sans','Inter','Poppins','Raleway','Nunito','Lato','Montserrat','Source Sans 3','Work Sans','Rubik','Roboto','Open Sans'] },
  { name:'Luxury', icon:'👑', fonts:['Playfair Display','Cormorant Garamond','Cinzel','Bodoni Moda','Prata','Taviraj','Libre Baskerville','Old Standard TT','Abril Fatface','Forum','Goudy Bookletter 1911','Marcellus'] },
  { name:'Playful', icon:'🎮', fonts:['Quicksand','Josefin Sans','Exo 2','Cabin','Ubuntu','Comfortaa','Bubblegum Sans','Fredoka One','Baloo 2','Righteous','Fugaz One','Lilita One'] },
]

const COLOR_PRESETS = ['#1a1a2e','#ffffff','#000000','#ef4444','#22c55e','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#0ea5e9']

const SHAPE_OPTIONS = [
  { value:'square', label:'▢ Square' },
  { value:'rounded-sm', label:'⊡ Rounded (4px)' },
  { value:'rounded', label:'⊡ Rounded (8px)' },
  { value:'rounded-lg', label:'⊡ Rounded (16px)' },
  { value:'circle', label:'○ Circle' },
  { value:'hexagon', label:'⬡ Hexagon' },
]

const ANIM_IN = ['flyFromBottom','flyFromTop','flyFromLeft','flyFromRight','zoomIn','fadeIn','bounceIn']
const ANIM_OUT = ['flyToTop','flyToBottom','flyToLeft','flyToRight','zoomOut','fadeOut']

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
        <div className="mb-swatch" style={{ background: value||'#6366f1', border:'2px solid #E5E7EB' }} onClick={() => setShow(s => !s)} />
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

function ImageUpload({ label, url, onFile, onClear, accept }) {
  const ref = useRef()
  return (
    <div>
      {label && <span className="mb-label">{label}</span>}
      <input type="file" ref={ref} accept={accept||'image/png,image/jpeg,image/jpg,image/gif,image/webp'} style={{ display:'none' }}
        onChange={e => { const f=e.target.files[0]; if(f) onFile(f) }} />
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginTop:4 }}>
        <button type="button" className="mb-btn mb-btn-secondary mb-btn-sm" onClick={() => ref.current.click()}>📷 Upload</button>
        {url && <img src={url} className="mb-thumb" alt="" />}
        {url && <button type="button" className="mb-icon-btn del" onClick={onClear}>✕</button>}
      </div>
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

export default function MemoryBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [tab, setTab] = useState('form')
  const [toast, setToast] = useState(null)
  const [settings, setSettings] = useState({})
  const [tiles, setTiles] = useState([])
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
  const [uploadingTile, setUploadingTile] = useState(false)

  const showToast = (msg, type='success') => setToast({ msg, type })

  const loadData = useCallback(() => {
    setLoading(true); setFetchError(null)
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/memory/${id}/settings`),
      api.get(`/memory/games/${id}/tiles`),
      api.get(`/sounds/games/${id}/sounds`),
    ]).then(([gRes, sRes, tRes, soundRes]) => {
      const g = gRes.data.game
      setGame(g)
      setSettings(sRes.data.settings || {})
      setTiles(tRes.data.tiles || [])
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
      setFetchError(err.response?.data?.message || err.message || 'Failed to load memory match data')
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const saveSettings = async (includeImages) => {
    setSaving(true)
    try {
      const fd = new FormData()
      const sFields = [
        'grid_cols','grid_rows','card_shape','show_timer','time_limit_seconds',
        'heading_1','heading_2','heading_3','description_text','font_family',
        'sound_flip_id','sound_match_id','sound_nomatch_id','win_sound_id',
        'overlay_animation_in','overlay_animation_out','overlay_idle_time','overlay_duration',
        'intro_text','outro_text','submit_button_text','continue_button_text','start_button_text',
        'terms_enabled','terms_text','terms_url','meta_description','send_email',
        'start_button_text_color','start_button_bg_color',
        'submit_button_text_color','submit_button_bg_color',
        'continue_button_text_color','continue_button_bg_color',
        'next_button_text','next_button_text_color','next_button_bg_color',
        'redirect_url','redirect_delay','redirect_open_new_tab',
      ]
      for (const f of sFields) fd.append(f, settings[f] ?? '')
      // redirect_url lives in separate state, override the stale settings value
      fd.set('redirect_url', redirectUrl || '')
      fd.append('bg_color', settings.bg_color || '#f8f8ff')
      fd.append('primary_color', settings.primary_color || '#6366f1')
      fd.append('heading_1_color', heading1Color)
      fd.append('heading_2_color', heading2Color)
      fd.append('heading_3_color', heading3Color)
      fd.append('description_color', descColor)
      if (settings._bgImageFile) fd.append('bg_image', settings._bgImageFile)
      else fd.append('bg_image_url', settings.bg_image_url || '')
      if (settings._tyBgImageFile) fd.append('thankyou_bg_image', settings._tyBgImageFile)
      else fd.append('thankyou_bg_image_url', settings.thankyou_bg_image_url || '')
      if (settings._gameLogoFile) fd.append('game_logo', settings._gameLogoFile)
      else fd.append('game_logo_url', settings.game_logo_url || '')
      if (settings._cardCoverFile) fd.append('card_cover_image', settings._cardCoverFile)
      else fd.append('card_cover_image_url', settings.card_cover_image_url || '')
      if (settings._overlayFile) fd.append('overlay_image', settings._overlayFile)
      else fd.append('overlay_image_url', settings.overlay_image_url || '')
      if (settings._submitGifFile) fd.append('submit_confirm_gif', settings._submitGifFile)
      else fd.append('submit_confirm_gif_url', settings.submit_confirm_gif_url || '')
      await api.put(`/memory/${id}/settings`, fd)
      showToast('Settings saved')
    } catch (err) {
      showToast('Error saving settings: ' + (err.response?.data?.message || err.message), 'error')
    }
    setSaving(false)
  }

  const tileInputRef = useRef()
  const handleUploadTile = async e => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingTile(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post(`/memory/games/${id}/tiles`, fd)
      setTiles(res.data.tiles)
      showToast('Tile uploaded with pair!')
    } catch (err) {
      showToast('Error uploading tile: ' + (err.response?.data?.message || err.message), 'error')
    }
    setUploadingTile(false)
    e.target.value = ''
  }

  const handleDeleteTile = async tileId => {
    try {
      const res = await api.delete(`/memory/tiles/${tileId}`)
      setTiles(res.data.tiles)
      showToast('Tile and its pair deleted')
    } catch (err) {
      showToast('Error deleting tile', 'error')
    }
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
    { id:'form',     label:'Player Form' },
    { id:'tiles',    label:'Tiles' },
    { id:'thankyou', label:'Thankyou Page' },
    { id:'email',    label:'Email' },
    { id:'sounds',   label:'Audio' },
    { id:'settings', label:'Settings' },
  ]

  const shapeStyle = (shape) => {
    switch (shape) {
      case 'rounded-sm': return { borderRadius: 4 }
      case 'rounded': return { borderRadius: 8 }
      case 'rounded-lg': return { borderRadius: 16 }
      case 'circle': return { borderRadius: '50%' }
      case 'hexagon': return { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }
      default: return { borderRadius: 2 }
    }
  }

  const cardShape = shapeStyle(settings.card_shape)

  if (loading) return (
    <div className="mb-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36,height:36,borderRadius:'50%',border:'3px solid #E5E7EB',borderTopColor:'#6366f1',animation:'mbSpin .8s linear infinite',margin:'0 auto 12px' }} />
        <div style={{ color:'#9CA3AF',fontSize:14 }}>Loading memory match builder…</div>
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

  const primary = settings.primary_color || '#6366f1'
  const ff = settings.font_family || 'DM Sans'
  const gameLink = game ? `${window.location.origin}/play/${game.slug}/${game.client_slug}` : ''

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
        <div style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'flex-end' }}>
          {game && <button className="mb-btn mb-btn-sm" onClick={() => { navigator.clipboard.writeText(gameLink); showToast('Link copied!') }} style={{ padding:'6px 8px', fontSize:14 }} title="Copy link">🔗</button>}
          {game && <a href={gameLink} target="_blank" rel="noreferrer" className="mb-btn mb-btn-sm" style={{ padding:'6px 8px', fontSize:14, textDecoration:'none' }} title="Preview">👁</a>}
          <button className="mb-btn mb-btn-sm" onClick={saveSettings} disabled={saving}>
            {saving ? '⏳ Saving…' : '💾 Save'}
          </button>
        </div>
      </div>

      <div className="mb-body">
        <div className="mb-left">

          {/* ── PLAYER FORM TAB ── */}
          {tab === 'form' && (
            <div>
              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Visuals</div>
                <div className="mb-2col">
                  <ImageUpload label="Background Image" url={settings.bg_image_url}
                    onFile={f => { const r=new FileReader(); r.onload=ev=>setSettings({...settings,bg_image_url:ev.target.result,_bgImageFile:f}); r.readAsDataURL(f) }}
                    onClear={() => setSettings({...settings,bg_image_url:'',_bgImageFile:null})} />
                  <ImageUpload label="Game Logo" url={settings.game_logo_url}
                    onFile={f => { const r=new FileReader(); r.onload=ev=>setSettings({...settings,game_logo_url:ev.target.result,_gameLogoFile:f}); r.readAsDataURL(f) }}
                    onClear={() => setSettings({...settings,game_logo_url:'',_gameLogoFile:null})} accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml" />
                </div>
              </div>

              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Game Texts</div>
                <div className="mb-2col">
                  <div className="mb-fg">
                    <span className="mb-label">Heading 1</span>
                    <input className="mb-input" value={settings.heading_1||''} onChange={e => setSettings({...settings,heading_1:e.target.value})} placeholder="Main title" />
                  </div>
                  <ColorPicker label="Heading 1 Color" value={heading1Color} onChange={setHeading1Color} />
                </div>
                <div className="mb-2col" style={{ marginTop:12 }}>
                  <div className="mb-fg">
                    <span className="mb-label">Heading 2</span>
                    <input className="mb-input" value={settings.heading_2||''} onChange={e => setSettings({...settings,heading_2:e.target.value})} placeholder="Subtitle" />
                  </div>
                  <ColorPicker label="Heading 2 Color" value={heading2Color} onChange={setHeading2Color} />
                </div>
                <div className="mb-fg" style={{ marginTop:12 }}>
                  <span className="mb-label">Intro Text</span>
                  <textarea className="mb-input" rows={3} value={settings.intro_text||''} onChange={e => setSettings({...settings,intro_text:e.target.value})} placeholder="Short description shown before the game…" />
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
                    <div className="mb-row">
                      <ColorPicker label="Text Color" value={settings.start_button_text_color||'#ffffff'} onChange={v => setSettings({...settings,start_button_text_color:v})} />
                      <ColorPicker label="Bg Color" value={settings.start_button_bg_color||primary} onChange={v => setSettings({...settings,start_button_bg_color:v})} />
                    </div>
                  </div>
                </div>
              </div>

              <button className="mb-btn" onClick={saveSettings} disabled={saving} style={{ width:'100%', justifyContent:'center' }}>
                {saving ? '⏳ Saving…' : '💾 Save Settings'}
              </button>
            </div>
          )}

          {/* ── TILES TAB ── */}
          {tab === 'tiles' && (
            <div>
              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Card Settings</div>
                <div className="mb-2col">
                  <div className="mb-fg">
                    <span className="mb-label">Card Shape</span>
                    <select className="mb-select" value={settings.card_shape||'rounded'} onChange={e => setSettings({...settings,card_shape:e.target.value})}>
                      {SHAPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="mb-fg">
                    <span className="mb-label">Card Cover Image</span>
                    <ImageUpload url={settings.card_cover_image_url}
                      onFile={f => { const r=new FileReader(); r.onload=ev=>setSettings({...settings,card_cover_image_url:ev.target.result,_cardCoverFile:f}); r.readAsDataURL(f) }}
                      onClear={() => setSettings({...settings,card_cover_image_url:'',_cardCoverFile:null})} />
                  </div>
                </div>
                <div className="mb-2col" style={{ marginTop:12 }}>
                  <div className="mb-fg">
                    <span className="mb-label">Grid Columns</span>
                    <input className="mb-input" type="number" min={2} max={8} value={settings.grid_cols??4} onChange={e => setSettings({...settings,grid_cols:parseInt(e.target.value)||4})} />
                  </div>
                  <div className="mb-fg">
                    <span className="mb-label">Grid Rows</span>
                    <input className="mb-input" type="number" min={2} max={8} value={settings.grid_rows??4} onChange={e => setSettings({...settings,grid_rows:parseInt(e.target.value)||4})} />
                  </div>
                </div>
                <div className="mb-2col" style={{ marginTop:12 }}>
                  <div className="mb-fg">
                    <span className="mb-label">Timer</span>
                    <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
                      <input type="checkbox" checked={!!settings.show_timer} onChange={e => setSettings({...settings,show_timer:e.target.checked?1:0})} />
                      Show timer
                    </label>
                  </div>
                  {!!settings.show_timer && (
                    <div className="mb-fg">
                      <span className="mb-label">Time Limit (seconds)</span>
                      <input className="mb-input" type="number" min={0} value={settings.time_limit_seconds??0} onChange={e => setSettings({...settings,time_limit_seconds:parseInt(e.target.value)||0})} />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Tile Images</div>
                <p style={{ fontSize:13, color:'#6B7280', marginBottom:12 }}>
                  Upload tile images — each image is automatically duplicated into a matching pair.
                </p>
                <div className="mb-grid">
                  {tiles.map(tile => (
                    <div key={tile.id} className="mb-tile-card" style={cardShape}>
                      <img src={tile.image_url} alt="" onError={e => { e.target.style.display='none' }} />
                      <span style={{position:'absolute',fontSize:28,opacity:.3,pointerEvents:'none'}}>🖼️</span>
                      <button className="mb-tile-del" onClick={() => handleDeleteTile(tile.id)}>✕</button>
                      {tile.tile_label && <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,.6)', color:'#fff', fontSize:9, textAlign:'center', padding:'2px 4px' }}>{tile.tile_label}</div>}
                    </div>
                  ))}
                  <div className="mb-tile-add" onClick={() => tileInputRef.current?.click()} style={cardShape}>+</div>
                  <input type="file" ref={tileInputRef} accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" style={{ display:'none' }} onChange={handleUploadTile} />
                </div>
                <div style={{ display:'flex', gap:8, marginTop:16, flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'#9CA3AF' }}>
                    {tiles.length} tile{tiles.length!==1?'s':''} · {Math.floor(tiles.length/2)} pair{Math.floor(tiles.length/2)!==1?'s':''}
                  </span>
                </div>
              </div>

              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Overlay on Match</div>
                <div className="mb-2col">
                  <div className="mb-fg">
                    <span className="mb-label">Overlay Image</span>
                    <ImageUpload url={settings.overlay_image_url}
                      onFile={f => { const r=new FileReader(); r.onload=ev=>setSettings({...settings,overlay_image_url:ev.target.result,_overlayFile:f}); r.readAsDataURL(f) }}
                      onClear={() => setSettings({...settings,overlay_image_url:'',_overlayFile:null})} />
                  </div>
                </div>
                <div className="mb-2col" style={{ marginTop:12 }}>
                  <div className="mb-fg">
                    <span className="mb-label">Animation In</span>
                    <select className="mb-select" value={settings.overlay_animation_in||'flyFromBottom'} onChange={e => setSettings({...settings,overlay_animation_in:e.target.value})}>
                      {ANIM_IN.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="mb-fg">
                    <span className="mb-label">Animation Out</span>
                    <select className="mb-select" value={settings.overlay_animation_out||'flyToTop'} onChange={e => setSettings({...settings,overlay_animation_out:e.target.value})}>
                      {ANIM_OUT.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-2col" style={{ marginTop:12 }}>
                  <div className="mb-fg">
                    <span className="mb-label">Idle Time (seconds)</span>
                    <input className="mb-input" type="number" min={1} value={settings.overlay_idle_time??3} onChange={e => setSettings({...settings,overlay_idle_time:parseInt(e.target.value)||3})} />
                  </div>
                  <div className="mb-fg">
                    <span className="mb-label">Duration (seconds)</span>
                    <input className="mb-input" type="number" min={1} value={settings.overlay_duration??3} onChange={e => setSettings({...settings,overlay_duration:parseInt(e.target.value)||3})} />
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
                <div className="mb-2col">
                  <div className="mb-fg">
                    <div className="mb-card-title">Background</div>
                    <ImageUpload label="Thankyou Background" url={settings.thankyou_bg_image_url}
                      onFile={f => { const r=new FileReader(); r.onload=ev=>setSettings({...settings,thankyou_bg_image_url:ev.target.result,_tyBgImageFile:f}); r.readAsDataURL(f) }}
                      onClear={() => setSettings({...settings,thankyou_bg_image_url:'',_tyBgImageFile:null})} />
                  </div>
                  <div className="mb-fg">
                    <div className="mb-card-title">Thankyou Message</div>
                    <div className="mb-fg" style={{ marginBottom:8 }}>
                      <span className="mb-label">Heading</span>
                      <textarea className="mb-input" rows={2} value={settings.outro_text||''} onChange={e => setSettings({...settings,outro_text:e.target.value})} placeholder="Yay! You completed the game!" />
                    </div>
                    <ColorPicker label="Heading Color" value={settings.outro_text_color||'#1a1a2e'} onChange={v => setSettings({...settings,outro_text_color:v})} />
                  </div>
                </div>
              </div>

              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-card-title">Submit Button</div>
                <div className="mb-2col">
                  <div className="mb-fg">
                    <span className="mb-label">Button Text</span>
                    <input className="mb-input" value={settings.submit_button_text||''} onChange={e => setSettings({...settings,submit_button_text:e.target.value})} placeholder="Submit & Explore →" />
                  </div>
                  <div className="mb-row">
                    <ColorPicker label="Text Color" value={settings.submit_button_text_color||'#ffffff'} onChange={v => setSettings({...settings,submit_button_text_color:v})} />
                    <ColorPicker label="Bg Color" value={settings.submit_button_bg_color||primary} onChange={v => setSettings({...settings,submit_button_bg_color:v})} />
                  </div>
                </div>
              </div>

              <div className="mb-card" style={{ marginBottom:16 }}>
                <div className="mb-2col">
                  <div className="mb-fg">
                    <div className="mb-section-title">Submit Confirmation GIF</div>
                    <ImageUpload url={settings.submit_confirm_gif_url}
                      onFile={f => { const r=new FileReader(); r.onload=ev=>setSettings({...settings,submit_confirm_gif_url:ev.target.result,_submitGifFile:f}); r.readAsDataURL(f) }}
                      onClear={() => setSettings({...settings,submit_confirm_gif_url:'',_submitGifFile:null})} />
                  </div>
                  <div className="mb-fg">
                    <div className="mb-section-title">Redirect & Continue</div>
                    <div className="mb-fg" style={{ marginBottom:8 }}>
                      <span className="mb-label">Redirect URL</span>
                      <input className="mb-input" value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} placeholder="https://yoursite.com/thankyou" />
                      {redirectUrl && <div style={{ marginTop:6, padding:'6px 10px', background:'#F0FDF4', borderRadius:6, fontSize:12, color:'#16A34A', border:'1px solid #BBF7D0' }}>✓ Redirect set to {redirectUrl}</div>}
                    </div>
                    <div style={{ marginTop:8 }}>
                      <span className="mb-label">Continue Button Text</span>
                      <input className="mb-input" value={settings.continue_button_text||''} onChange={e => setSettings({...settings,continue_button_text:e.target.value})} placeholder="Continue Now →" />
                    </div>
                    <div className="mb-row" style={{ marginTop:8 }}>
                      <ColorPicker label="Text Color" value={settings.continue_button_text_color||'#ffffff'} onChange={v => setSettings({...settings,continue_button_text_color:v})} />
                      <ColorPicker label="Bg Color" value={settings.continue_button_bg_color||primary} onChange={v => setSettings({...settings,continue_button_bg_color:v})} />
                    </div>
                  </div>
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
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14, padding:'8px 12px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8 }}>
                  <input type="checkbox" checked={!!settings.send_email}
                    onChange={e => setSettings({ ...settings, send_email:e.target.checked?1:0 })}
                    style={{ width:16,height:16 }} />
                  <span style={{ fontWeight:600, color:'#166534' }}>Send email on game completion</span>
                  <span style={{ color:'#166534', fontSize:12, marginLeft:'auto' }}>Requires template below to be enabled</span>
                </div>
                <div style={{ padding:'10px 14px', background:'#FFFBEB', borderRadius:8, border:'1px solid #FDE68A', fontSize:12, color:'#92400E', marginBottom:14 }}>
                  💡 Available placeholders: <code>{'{{name}}'}</code> <code>{'{{score}}'}</code> <code>{'{{total}}'}</code> <code>{'{{game_name}}'}</code>
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
                  <ColorPicker label="Header Color" value={emailTemplate.header_color||'#6366f1'} onChange={v => setEmailTemplate({...emailTemplate,header_color:v})} />
                </div>
                <div className="mb-fg" style={{ marginTop:12 }}>
                  <span className="mb-label">Body HTML</span>
                  <textarea className="mb-input" rows={5} value={emailTemplate.body_html||''} onChange={e => setEmailTemplate({...emailTemplate,body_html:e.target.value})}
                    placeholder={`<p>Hi {{name}},</p><p>You scored {{score}}/{{total}} on {{game_name}}!</p>`}
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
                  <SoundSelect label="🃏 Card Flip" value={settings.sound_flip_id} onChange={v => setSettings({...settings,sound_flip_id:v})} sounds={sounds} />
                  <SoundSelect label="✅ Match" value={settings.sound_match_id} onChange={v => setSettings({...settings,sound_match_id:v})} sounds={sounds} />
                  <SoundSelect label="❌ No Match" value={settings.sound_nomatch_id} onChange={v => setSettings({...settings,sound_nomatch_id:v})} sounds={sounds} />
                  <SoundSelect label="🏆 Win" value={settings.win_sound_id} onChange={v => setSettings({...settings,win_sound_id:v})} sounds={sounds} />
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
                        <div style={{ fontSize:11, color:'#9CA3AF' }}>#{s.id} · {s.sound_type||'audio'}</div>
                      </div>
                      <audio controls src={s.url} style={{ height:32, maxWidth:160 }} />
                      <button className="mb-icon-btn del" onClick={async () => { try { await api.delete(`/sounds/sounds/${s.id}`); setSounds(prev => prev.filter(x => x.id !== s.id)); showToast('Sound deleted') } catch { showToast('Error deleting sound','error') } }}>✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-empty">
                  <div className="mb-empty-icon">🎵</div>
                  <p>No sounds uploaded yet</p>
                  <p style={{ fontSize:12, color:'#D1D5DB', marginTop:4 }}>Upload MP3, WAV, or OGG files above</p>
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
                  <input className="mb-input" value={gameSlug} onChange={e => setGameSlug(e.target.value)} placeholder="my-memory-game" />
                  {game && <div style={{ marginTop:4, fontSize:12, color:'#9CA3AF' }}>/play/{gameSlug||'slug'}/{game?.client_slug||'client'}</div>}
                </div>
                <div className="mb-row">
                  <ColorPicker label="Background Color" value={settings.bg_color||'#f8f8ff'} onChange={v => setSettings({...settings,bg_color:v})} />
                  <ColorPicker label="Primary Color" value={settings.primary_color||'#6366f1'} onChange={v => setSettings({...settings,primary_color:v})} />
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
                    <div className="mb-3col">
                      {cat.fonts.map(f => (
                        <div key={f} onClick={() => setSettings({...settings,font_family:f})}
                          style={{
                            padding:'8px 6px', borderRadius:8, border: (settings.font_family||'DM Sans') === f ? '2px solid #6366f1' : '1.5px solid #E5E7EB',
                            cursor:'pointer', textAlign:'center', fontSize:12,
                            background: (settings.font_family||'DM Sans') === f ? '#EEF2FF' : '#FAFAFA',
                            fontFamily: `"${f}", sans-serif`,
                            transition:'all .1s',
                          }}>
                          <div style={{ fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f}</div>
                          <div style={{ fontSize:10, color:'#9CA3AF', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>The quick brown fox</div>
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
                        settings.bg_image_url ? `url("${settings.bg_image_url}") center/cover no-repeat` : settings.bg_color || '#f4f6fb',
          }}>
            {game && (
              <>
                {(tab === 'form' || tab === 'sounds' || tab === 'settings') && (
                  <div style={{ display:'flex', flexDirection:'column', height:'100%', padding:'16px 14px' }}>
                    <div style={{
                      flex:1, borderRadius:16, padding:'20px 16px', display:'flex', flexDirection:'column',
                      background: settings.bg_image_url ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.92)',
                      backdropFilter: settings.bg_image_url ? 'blur(28px)' : 'none',
                      border: settings.bg_image_url ? '1px solid rgba(255,255,255,0.25)' : 'none',
                    }}>
                      {settings.game_logo_url && <div style={{ textAlign:'center', marginBottom:12 }}><img src={settings.game_logo_url} alt="" style={{ height:32, objectFit:'contain' }} /></div>}
                      <h1 style={{ fontSize:18, fontWeight:800, textAlign:'center', color:heading1Color, margin:0 }}>{settings.heading_1 || 'Memory Match'}</h1>
                      {settings.heading_2 && <p style={{ fontSize:12, textAlign:'center', color:heading2Color, margin:'4px 0 8px' }}>{settings.heading_2}</p>}
                      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap:8 }}>
                        {formFields.map((ff, i) => (
                          <div key={i} style={{ height:32, borderRadius:8, background:'rgba(0,0,0,0.05)', display:'flex', alignItems:'center', padding:'0 10px', fontSize:11, color:'#999' }}>
                            {ff.field_label} {ff.is_required ? '*' : ''}
                          </div>
                        ))}
                        {Number(settings.terms_enabled) === 1 && (
                          <div style={{ height:24, display:'flex', alignItems:'center', gap:6, fontSize:10, color:'#999' }}>
                            <div style={{ width:14, height:14, borderRadius:3, border:'1.5px solid #ccc' }} /> {settings.terms_text || 'I accept the Terms'}
                          </div>
                        )}
                      </div>
                      <button style={{ width:'100%', padding:'10px', borderRadius:10, border:'none', background: settings.start_button_bg_color || primary, color: settings.start_button_text_color || '#fff', fontSize:13, fontWeight:700, cursor:'pointer', marginTop:8 }}>
                        {settings.start_button_text || '🎮 Start Game'}
                      </button>
                    </div>
                  </div>
                )}

                {tab === 'tiles' && (
                  <div style={{ display:'flex', flexDirection:'column', height:'100%', padding:'16px 14px' }}>
                    <div style={{
                      flex:1, borderRadius:16, padding:'16px',
                      background: settings.bg_image_url ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.92)',
                      backdropFilter: settings.bg_image_url ? 'blur(28px)' : 'none',
                    }}>
                      <div style={{ display:'grid', gridTemplateColumns: `repeat(${Math.min(settings.grid_cols||4, 4)}, 1fr)`, gap:4 }}>
                        {Array.from({ length: Math.min((settings.grid_cols||4)*(settings.grid_rows||4), 16) }).map((_, i) => (
                          <div key={i} style={{
                            aspectRatio:1, borderRadius:6,
                            background: tiles[i] ? `url("${tiles[i].image_url}") center/cover no-repeat` : (settings.card_cover_image_url ? `url("${settings.card_cover_image_url}") center/cover no-repeat` : primary),
                            border:'1.5px solid rgba(255,255,255,0.3)',
                            ...shapeStyle(settings.card_shape),
                          }} />
                        ))}
                      </div>
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
                      {settings.game_logo_url && <div style={{ textAlign:'center', marginBottom:12 }}><img src={settings.game_logo_url} alt="" style={{ height:28, objectFit:'contain' }} /></div>}
                      <div style={{ fontSize:36, marginBottom:8 }}>🎉</div>
                      <h2 style={{ fontSize:16, fontWeight:800, color: settings.outro_text_color||'#1a1a2e', margin:0 }}>{settings.outro_text || 'Yay! You completed the game!'}</h2>
                      <button style={{ width:'100%', padding:'10px', borderRadius:10, border:'none', background: settings.submit_button_bg_color || primary, color: settings.submit_button_text_color || '#fff', fontSize:13, fontWeight:700, cursor:'pointer', marginTop:'auto' }}>
                        {settings.submit_button_text || 'Submit & Explore →'}
                      </button>
                    </div>
                  </div>
                )}

                {tab === 'email' && (
                  <iframe title="Email Preview" srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:'DM Sans',sans-serif;background:#f4f4f4}.eh{background:${emailTemplate.header_color||'#6366f1'};color:#fff;padding:20px;text-align:center;font-size:18px;font-weight:700}.eb{padding:20px;background:#fff;margin:12px;border-radius:8px;font-size:13px;line-height:1.6}.ef{padding:12px;text-align:center;font-size:11px;color:#999}</style></head><body><div class="eh">${emailTemplate.header_text||'Congratulations!'}</div><div class="eb">${emailTemplate.body_html||'<p>Thanks for playing!</p>'}</div><div class="ef">${emailTemplate.footer_text||''}</div></body></html>`}
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
