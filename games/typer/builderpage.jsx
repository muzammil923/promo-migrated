import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'
import { useUploadErrors, uploadErrorMessage } from '../../apps/frontend/src/lib/builderUpload'

const FONT_URL = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,300;9..144,600&display=swap'

const LIGHT = `
@import url('${FONT_URL}');
.tp-wrap *,.tp-wrap *::before,.tp-wrap *::after{box-sizing:border-box}
.tp-wrap{font-family:'DM Sans',sans-serif;color:#111827;background:#f4f6fb;min-height:100vh}
@keyframes tpFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes tpToastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes tpSpin{to{transform:rotate(360deg)}}
.tp-input,.tp-select{width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid #E5E7EB;font-size:14px;font-family:'DM Sans',sans-serif;color:#111;background:#fafafa;outline:none;transition:border-color .15s,background .15s}
.tp-input:focus,.tp-select:focus{border-color:#818CF8;background:#fff}
.tp-select{appearance:none;cursor:pointer}
.tp-label{display:block;font-size:10.5px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.09em;margin-bottom:6px}
.tp-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:10px;border:none;background:#18181B;color:#fff;font-size:13.5px;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;transition:background .14s,transform .1s}
.tp-btn:hover{background:#27272A}
.tp-btn:active{transform:scale(.98)}
.tp-btn:disabled{opacity:.55;cursor:not-allowed}
.tp-btn-sm{padding:7px 14px;font-size:12px}
.tp-btn-secondary{background:#fff;color:#374151;border:1.5px solid #E5E7EB}
.tp-btn-secondary:hover{background:#F3F4F6;border-color:#D1D5DB}
.tp-icon-btn{width:30px;height:30px;border-radius:7px;border:1.5px solid #E5E7EB;background:#F9FAFB;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:#374151;transition:background .13s;flex-shrink:0}
.tp-icon-btn:hover{background:#F0F0F0}
.tp-card{background:#fff;border:1.5px solid #EAECF0;border-radius:14px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04);animation:tpFadeUp .25s ease both}
.tp-card-title{font-size:13px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px}
.tp-2col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.tp-fg{display:flex;flex-direction:column;gap:4px;flex:1;min-width:120px}
.tp-swatch{width:28px;height:28px;border-radius:6px;border:2px solid #E5E7EB;cursor:pointer;flex-shrink:0}
.tp-cpop{position:absolute;top:calc(100%+6px);left:0;z-index:300;background:#fff;border:1.5px solid #E5E7EB;border-radius:10px;padding:12px;box-shadow:0 8px 24px rgba(0,0,0,.12);display:grid;grid-template-columns:repeat(7,1fr);gap:5px;width:220px}
.tp-thumb{height:44px;width:auto;border-radius:6px;border:1px solid #E5E7EB;object-fit:contain}
.tp-header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:12px 24px;background:#fff;border-bottom:1.5px solid #EAECF0;position:sticky;top:62px;z-index:50;min-height:56px}
.tp-tabs{display:flex;gap:4px}
.tp-tab{padding:8px 16px;border-radius:8px;border:none;background:transparent;color:#6B7280;font-size:13px;font-weight:500;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .14s;white-space:nowrap}
.tp-tab:hover{background:#F3F4F6;color:#374151}
.tp-tab.active{background:#EEF2FF;color:#4338CA;font-weight:600}
.tp-body{display:grid;grid-template-columns:1fr 320px;gap:24px;padding:24px;max-width:1200px;margin:0 auto}
.tp-phone{width:280px;height:560px;border-radius:36px;border:3px solid #D1D5DB;background:#0f172a;overflow:hidden;position:sticky;top:80px;box-shadow:0 8px 32px rgba(0,0,0,.12)}
.tp-phone-notch{width:120px;height:18px;background:#111;border-radius:0 0 14px 14px;margin:0 auto;position:relative;z-index:2}
.tp-phone-screen{height:calc(100% - 18px);overflow-y:auto;position:relative}
.tp-word-chip{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;margin:2px}
`

const COLOR_PRESETS = ['#1a1a2e','#ffffff','#000000','#ef4444','#22c55e','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#0ea5e9']
const FONT_CATEGORIES = [
  { name:'Handwriting', icon:'✍️', fonts:['Dancing Script','Pacifico','Caveat','Shadows Into Light','Satisfy','Kalam','Patrick Hand','Permanent Marker','Indie Flower','Gloria Hallelujah','Bad Script','Reenie Beanie'] },
  { name:'Professional', icon:'💼', fonts:['DM Sans','Inter','Poppins','Raleway','Nunito','Lato','Montserrat','Source Sans 3','Work Sans','Rubik','Roboto','Open Sans'] },
  { name:'Luxury', icon:'👑', fonts:['Playfair Display','Cormorant Garamond','Cinzel','Bodoni Moda','Prata','Taviraj','Libre Baskerville','Old Standard TT','Abril Fatface','Forum','Goudy Bookletter 1911','Marcellus'] },
  { name:'Playful', icon:'🎮', fonts:['Quicksand','Josefin Sans','Exo 2','Cabin','Ubuntu','Comfortaa','Bubblegum Sans','Fredoka One','Baloo 2','Righteous','Fugaz One','Lilita One'] },
]

const PRESET_WORDS = {
  easy: 'THE AND FOR ARE BUT NOT YOU ALL CAN HER WAS ONE OUR OUT DAY GET HAS HIM HIS HOW ITS MAY NOW OLD SEE WAY WHO DID BOY LET SAY SHE TOO USE'.split(' '),
  medium: 'ABOUT AFTER AGAIN HOUSE COULD OTHER WHICH THEIR WATER FIRST PLACE WOULD THERE THOSE THEIR PEOPLE MANY THEN THEM WRITTEN LOOK ALSO FIND LONG MANY THING WELL BACK HELP WORK YEAR SAID NEED'.split(' '),
  hard: 'JAVASCRIPT PROGRAMMING ALGORITHM DATABASE FUNCTION VARIABLE BOOLEAN INTEGER STRING OBJECT ARRAY LOOP CONDITIONAL CALLBACK PROMISE ASYNCHRONOUS FRAMEWORK LIBRARY COMPONENT MODULE EXPORT'.split(' '),
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [])
  return <div style={{ position:'fixed',bottom:24,right:24,zIndex:9999,padding:'12px 18px',borderRadius:10,color:'#fff',fontWeight:600,fontSize:13,fontFamily:"'DM Sans',sans-serif",boxShadow:'0 8px 24px rgba(0,0,0,.15)',maxWidth:320,background:type==='success'?'#16a34a':'#dc2626',animation:'tpToastIn .28s cubic-bezier(.34,1.56,.64,1)' }}>{type==='success'?'✅':'❌'} {msg}</div>
}

function ColorPicker({ value, onChange, label }) {
  const [show, setShow] = useState(false)
  const ref = useRef()
  useEffect(() => { const fn = e => { if(ref.current&&!ref.current.contains(e.target)) setShow(false) }; document.addEventListener('mousedown',fn); return () => document.removeEventListener('mousedown',fn) }, [])
  return (
    <div ref={ref} style={{ position:'relative',display:'inline-flex',flexDirection:'column',gap:4 }}>
      {label && <span className="tp-label">{label}</span>}
      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
        <div className="tp-swatch" style={{ background:value||'#6366f1' }} onClick={()=>setShow(s=>!s)} />
        <input className="tp-input" value={value||''} onChange={e=>onChange(e.target.value)} placeholder="#000000" style={{ width:90,fontSize:12,padding:'5px 8px',background:'transparent' }} />
      </div>
      {show && <div className="tp-cpop">
        {COLOR_PRESETS.map(c=><div key={c} onClick={()=>{onChange(c);setShow(false)}} style={{ width:22,height:22,background:c,borderRadius:4,cursor:'pointer',border:value===c?'2px solid #6366f1':'1px solid #E5E7EB' }} />)}
        <input type="color" value={value||'#000000'} onChange={e=>onChange(e.target.value)} style={{ gridColumn:'span 7',width:'100%',height:28,padding:0,border:'none',background:'none',cursor:'pointer' }} />
        <button type="button" className="tp-btn tp-btn-secondary tp-btn-sm" style={{ gridColumn:'span 7',justifyContent:'center' }} onClick={()=>setShow(false)}>Close</button>
      </div>}
    </div>
  )
}

function ImageUpload({ label, url, onFile, onClear, accept, error }) {
  const ref = useRef()
  return <div className={error ? 'gb-img-error' : ''}>{label&&<span className="tp-label">{label}</span>}<input type="file" ref={ref} accept={accept||'image/*'} style={{ display:'none' }} onChange={e=>{const f=e.target.files[0];if(f)onFile(f)}} /><div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginTop:4 }}><button type="button" className="tp-btn tp-btn-secondary tp-btn-sm" onClick={()=>ref.current.click()}>📷 Upload</button>{url&&<img src={url} className="tp-thumb" alt="" />}{url&&<button type="button" className="tp-icon-btn" style={{ border:'1.5px solid #FEE2E2',background:'#FFF5F5',color:'#DC2626' }} onClick={onClear}>✕</button>}</div>{error&&<div className="gb-img-error-msg">⚠️ {error}</div>}</div>
}

function SoundSelect({ label, value, onChange, sounds }) {
  return <div className="tp-fg"><span className="tp-label">{label}</span><select className="tp-select" value={value||''} onChange={e=>onChange(e.target.value)}><option value="">— None —</option>{sounds.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
}

export default function TyperBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [tab, setTab] = useState('display')
  const [toast, setToast] = useState(null)
  const [settings, setSettings] = useState({})
  const [words, setWords] = useState([])
  const [sounds, setSounds] = useState([])
  const [saving, setSaving] = useState(false)
  const [soundUploading, setSoundUploading] = useState(false)
  const [formFields, setFormFields] = useState([])
  const [emailTemplate, setEmailTemplate] = useState({})
  const [redirectUrl, setRedirectUrl] = useState('')
  const [heading1Color, setHeading1Color] = useState('#1a1a2e')
  const [heading2Color, setHeading2Color] = useState('#666666')
  const [heading3Color, setHeading3Color] = useState('#777777')
  const [descColor, setDescColor] = useState('#888888')
  const [text1, setText1] = useState('')
  const [newWordText, setNewWordText] = useState('')
  const [showAddWord, setShowAddWord] = useState(false)
  const [bulkWords, setBulkWords] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [openWordId, setOpenWordId] = useState(null)

  const upload = useUploadErrors()
  const showToast = (msg, type='success') => setToast({ msg, type })

  const loadData = useCallback(() => {
    setLoading(true); setFetchError(null)
    Promise.all([
      api.get(`/games/${id}`), api.get(`/typer/${id}/settings`), api.get(`/typer/games/${id}/words`), api.get(`/sounds/games/${id}/sounds`),
    ]).then(([gRes, sRes, wRes, soundRes]) => {
      const g = gRes.data.game; setGame(g); setSettings(sRes.data.settings || {}); setWords(wRes.data.words || [])
      setSounds(soundRes.data.sounds || []); setFormFields(g.formFields || []); setEmailTemplate(g.emailTemplate || {})
      setRedirectUrl(g.redirect_url || ''); setText1(g.name || '')
      const s = sRes.data.settings || {}
      setHeading1Color(s.heading_1_color||'#1a1a2e'); setHeading2Color(s.heading_2_color||'#666666')
      setHeading3Color(s.heading_3_color||'#777777'); setDescColor(s.description_color||'#888888')
    }).catch(err => { setFetchError(err.response?.data?.message || err.message) }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      const fields = ['fall_speed','max_simultaneous','difficulty_mode','time_limit_seconds','max_misses','target_words','word_category',
        'heading_1','heading_2','heading_3','description_text',
        'heading_1_color','heading_2_color','heading_3_color','description_color',
        'bg_color','primary_color','font_family','meta_description','show_timer',
        'sound_correct_id','sound_wrong_id','sound_combo_id','sound_gameover_id',
        'intro_text','outro_text','submit_button_text','continue_button_text','start_button_text',
        'terms_enabled','terms_text','terms_url']
      for (const f of fields) fd.append(f, settings[f]??'')
      if (settings._bgImageFile) fd.append('bg_image', settings._bgImageFile); else if (settings.bg_image_url !== undefined) fd.append('bg_image_url', settings.bg_image_url)
      if (settings._tyBgImageFile) fd.append('thankyou_bg_image', settings._tyBgImageFile); else if (settings.thankyou_bg_image_url !== undefined) fd.append('thankyou_bg_image_url', settings.thankyou_bg_image_url)
      if (settings._gameLogoFile) fd.append('game_logo', settings._gameLogoFile); else if (settings.game_logo_url !== undefined) fd.append('game_logo_url', settings.game_logo_url||'')
      if (settings._submitGifFile) fd.append('submit_confirm_gif', settings._submitGifFile); else if (settings.submit_confirm_gif_url !== undefined) fd.append('submit_confirm_gif_url', settings.submit_confirm_gif_url||'')
      await api.put(`/typer/${id}/settings`, fd)
      showToast('Settings saved ✅')
    } catch (err) {
      const msg = uploadErrorMessage(err)
      if (settings._bgImageFile) upload.setFieldError('bg_image_url', msg)
      if (settings._gameLogoFile) upload.setFieldError('game_logo_url', msg)
      if (settings._tyBgImageFile) upload.setFieldError('thankyou_bg_image_url', msg)
      if (settings._submitGifFile) upload.setFieldError('submit_confirm_gif_url', msg)
      if (!settings._bgImageFile && !settings._gameLogoFile && !settings._tyBgImageFile && !settings._submitGifFile) upload.setFieldError('bg_image_url', msg)
      showToast(msg, 'error')
    }
    setSaving(false)
  }

  const saveDisplaySettings = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      const sFields = ['heading_1','heading_2','heading_3','description_text','intro_text','meta_description','font_family',
        'bg_color','primary_color','show_timer',
        'sound_correct_id','sound_wrong_id','sound_combo_id','sound_gameover_id']
      for (const f of sFields) fd.append(f, settings[f]??'')
      fd.append('heading_1_color', heading1Color); fd.append('heading_2_color', heading2Color)
      fd.append('heading_3_color', heading3Color); fd.append('description_color', descColor)
      if (settings._bgImageFile) fd.append('bg_image', settings._bgImageFile); else if (settings.bg_image_url !== undefined) fd.append('bg_image_url', settings.bg_image_url)
      if (settings._gameLogoFile) fd.append('game_logo', settings._gameLogoFile); else if (settings.game_logo_url !== undefined) fd.append('game_logo_url', settings.game_logo_url||'')
      await api.put(`/typer/${id}/settings`, fd)
      await api.put(`/games/${id}`, { name: text1 || game?.name })
      showToast('Saved ✅')
    } catch (err) { showToast('Error', 'error') }
    setSaving(false)
  }

  const handleAddWord = async () => {
    if (!newWordText.trim()) return
    try { const res = await api.post(`/typer/games/${id}/words`, { word_text: newWordText, difficulty: 'medium', word_order: words.length }); setWords(prev => [...prev, res.data.word]); setNewWordText(''); setShowAddWord(false); showToast('Added ✅') }
    catch (err) { showToast('Error', 'error') }
  }

  const handleBulkAdd = async () => {
    const list = bulkWords.split(/[\n,]+/).map(w => w.trim()).filter(Boolean)
    if (list.length === 0) return
    try { const res = await api.post(`/typer/games/${id}/words/bulk`, { words: list, difficulty: 'medium' }); showToast(`${res.data.inserted} words added ✅`); setBulkWords(''); setShowBulk(false); loadData() }
    catch (err) { showToast('Error', 'error') }
  }

  const handleAddPreset = async (difficulty) => {
    const list = PRESET_WORDS[difficulty] || []
    try { const res = await api.post(`/typer/games/${id}/words/bulk`, { words: list, difficulty }); showToast(`${res.data.inserted} ${difficulty} words added ✅`); loadData() }
    catch (err) { showToast('Error', 'error') }
  }

  const deleteWord = async (w) => { if (!confirm(`Delete "${w.word_text}"?`)) return; try { await api.delete(`/typer/words/${w.id}`); setWords(prev => prev.filter(x => x.id !== w.id)); showToast('Deleted') } catch { showToast('Error', 'error') } }

  const saveFormFields = async () => { setSaving(true); try { await api.put(`/games/${id}/form-fields`, { fields: formFields }); showToast('Saved') } catch { showToast('Error', 'error') }; setSaving(false) }
  const saveEmailTemplate = async () => { setSaving(true); try { await api.put(`/games/${id}/email-template`, emailTemplate); showToast('Saved') } catch { showToast('Error', 'error') }; setSaving(false) }
  const addFormField = () => setFormFields([...formFields, { field_label:'New Field', field_type:'text', is_required:0, field_options:[] }])
  const removeFormField = i => { const f=[...formFields]; f.splice(i,1); setFormFields(f) }
  const updateFormField = (i,key,val) => { const f=[...formFields]; f[i]={...f[i],[key]:val}; setFormFields(f) }
  const uploadSound = async e => { const file=e.target.files[0]; if(!file)return; const fd=new FormData(); fd.append('file',file); fd.append('name',file.name.replace(/\.[^.]+$/,'')); fd.append('sound_type','custom'); setSoundUploading(true); try{const res=await api.post(`/sounds/games/${id}/sounds`,fd);setSounds(prev=>[res.data.sound,...prev]);showToast('Uploaded ✅')}catch{showToast('Error','error')}; setSoundUploading(false);e.target.value='' }
  const deleteSound = async s => { try{await api.delete(`/sounds/sounds/${s.id}`);setSounds(prev=>prev.filter(x=>x.id!==s.id));showToast('Deleted')}catch{showToast('Error','error')} }

  const gameLink = game ? `${window.location.origin}/play/${game.slug}/${game.client_slug}` : ''
  const TABS = [
    { id:'display', label:'🎨 Display' }, { id:'gameplay', label:'🎮 Gameplay' }, { id:'words', label:'🔤 Words' },
    { id:'sounds', label:'🔊 Sounds' }, { id:'form', label:'📋 Form' }, { id:'thankyou', label:'🙏 Thank You' },
    { id:'email', label:'📧 Email' }, { id:'settings', label:'⚙️ Settings' },
  ]
  const TAB_FIELDS = {
    display: ['bg_image_url', 'game_logo_url'],
    thankyou: ['thankyou_bg_image_url', 'submit_confirm_gif_url'],
  }

  if (loading) return <div className="tp-wrap" style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}><style>{LIGHT}</style><div style={{ textAlign:'center',color:'#9CA3AF' }}><div style={{ width:40,height:40,borderRadius:'50%',border:'3px solid #E5E7EB',borderTopColor:'#6366f1',animation:'tpSpin .8s linear infinite',margin:'0 auto 16px' }} />Loading…</div></div>
  if (fetchError) return <div className="tp-wrap" style={{ textAlign:'center',padding:60 }}><style>{LIGHT}</style><h2 style={{ color:'#DC2626' }}>Error</h2><p style={{ color:'#9CA3AF' }}>{fetchError}</p><button className="tp-btn" onClick={loadData}>Retry</button></div>

  return (
    <div className="tp-wrap">
      <style>{LIGHT}</style>
      <div className="tp-header">
        <div style={{ display:'flex',alignItems:'center',gap:8 }}><button className="tp-btn tp-btn-secondary tp-btn-sm" onClick={()=>navigate('/dashboard/games')}>←</button><span style={{ fontWeight:700,fontSize:14 }}>{game?.name}</span></div>
        <div className="tp-tabs">{TABS.map(t=>{const hasErr=upload.tabHasError(t.id,TAB_FIELDS[t.id]||[]);return <button key={t.id} className={`tp-tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>{t.label}{hasErr&&<span className="gb-tab-err-dot" />}</button>})}</div>
        <div style={{ display:'flex',gap:6,justifyContent:'flex-end' }}><button className="tp-btn tp-btn-secondary tp-btn-sm" onClick={()=>{navigator.clipboard.writeText(gameLink);showToast('Copied!')}}>🔗</button><a href={gameLink} target="_blank" rel="noreferrer" className="tp-btn tp-btn-secondary tp-btn-sm">👁</a></div>
      </div>
      <div className="tp-body">
        <div style={{ minWidth:0 }}>
          {tab==='display' && <div>
            <div className="tp-card" style={{ marginBottom:14 }}><div className="tp-card-title">🎮 Game Name</div><input className="tp-input" value={text1||''} onChange={e=>setText1(e.target.value)} placeholder="Speed Typer" /></div>
            <div className="tp-card" style={{ marginBottom:14 }}><div className="tp-card-title">🖼️ Images</div><div className="tp-2col">
              <ImageUpload label="Background" url={settings.bg_image_url} error={upload.errors.bg_image_url} onFile={f=>{upload.clearFieldError('bg_image_url');const r=new FileReader();r.onload=e=>setSettings({...settings,bg_image_url:e.target.result,_bgImageFile:f});r.readAsDataURL(f)}} onClear={()=>setSettings({...settings,bg_image_url:'',_bgImageFile:null})} />
              <ImageUpload label="Logo" url={settings.game_logo_url} error={upload.errors.game_logo_url} onFile={f=>{upload.clearFieldError('game_logo_url');const r=new FileReader();r.onload=e=>setSettings({...settings,game_logo_url:e.target.result,_gameLogoFile:f});r.readAsDataURL(f)}} onClear={()=>setSettings({...settings,game_logo_url:'',_gameLogoFile:null})} />
            </div></div>
            <div className="tp-card" style={{ marginBottom:14 }}><div className="tp-card-title">📝 Headings</div>
              {[['Heading 1','heading_1',heading1Color,setHeading1Color],['Heading 2','heading_2',heading2Color,setHeading2Color]].map(([l,k,c,s])=><div className="tp-fg" key={k} style={{ marginBottom:10 }}><span className="tp-label">{l}</span><div style={{ display:'flex',gap:8,alignItems:'flex-end' }}><input className="tp-input" value={settings[k]||''} onChange={e=>setSettings({...settings,[k]:e.target.value})} style={{ flex:1 }} /><ColorPicker value={c} onChange={s} label="Color" /></div></div>)}
              <div className="tp-fg"><span className="tp-label">Description</span><textarea className="tp-input" rows={2} value={settings.description_text||''} onChange={e=>setSettings({...settings,description_text:e.target.value})} style={{ resize:'vertical' }} /></div>
            </div>
            <div className="tp-card" style={{ marginBottom:14 }}><div className="tp-card-title">🎨 Colors</div><div className="tp-2col">
              <ColorPicker value={settings.bg_color||'#0f172a'} onChange={v=>setSettings({...settings,bg_color:v})} label="BG Color" />
              <ColorPicker value={settings.primary_color||'#6366f1'} onChange={v=>setSettings({...settings,primary_color:v})} label="Primary Color" />
            </div></div>
            <div style={{ display:'flex',justifyContent:'flex-end',marginTop:20 }}><button className="tp-btn" onClick={saveDisplaySettings} disabled={saving}>{saving?'⏳…':'💾 Save'}</button></div>
          </div>}

          {tab==='gameplay' && <div>
            <div className="tp-card" style={{ marginBottom:14 }}><div className="tp-card-title">🎮 Game Settings</div>
              <div className="tp-2col" style={{ marginBottom:14 }}>
                <div className="tp-fg"><span className="tp-label">Fall Speed (1-5)</span><input className="tp-input" type="number" min="1" max="5" value={settings.fall_speed||2} onChange={e=>setSettings({...settings,fall_speed:parseInt(e.target.value)||2})} /><p style={{ fontSize:10,color:'#999',marginTop:2 }}>1=slow, 5=very fast</p></div>
                <div className="tp-fg"><span className="tp-label">Max Words on Screen (1-5)</span><input className="tp-input" type="number" min="1" max="5" value={settings.max_simultaneous||3} onChange={e=>setSettings({...settings,max_simultaneous:parseInt(e.target.value)||3})} /></div>
              </div>
              <div className="tp-2col" style={{ marginBottom:14 }}>
                <div className="tp-fg"><span className="tp-label">Difficulty Mode</span><select className="tp-select" value={settings.difficulty_mode||'progressive'} onChange={e=>setSettings({...settings,difficulty_mode:e.target.value})}><option value="fixed">Fixed</option><option value="progressive">Progressive (gets harder)</option></select><p style={{ fontSize:10,color:'#999',marginTop:2 }}>Progressive = words get longer & fall faster over time</p></div>
                <div className="tp-fg"><span className="tp-label">Time Limit (seconds, 0=unlimited)</span><input className="tp-input" type="number" min="0" value={settings.time_limit_seconds||60} onChange={e=>setSettings({...settings,time_limit_seconds:parseInt(e.target.value)||0})} /></div>
              </div>
              <div className="tp-2col">
                <div className="tp-fg"><span className="tp-label">Max Misses (game over)</span><input className="tp-input" type="number" min="1" max="20" value={settings.max_misses||5} onChange={e=>setSettings({...settings,max_misses:parseInt(e.target.value)||5})} /></div>
                <div className="tp-fg"><span className="tp-label">Target Words (0=unlimited)</span><input className="tp-input" type="number" min="0" value={settings.target_words||0} onChange={e=>setSettings({...settings,target_words:parseInt(e.target.value)||0})} /><p style={{ fontSize:10,color:'#999',marginTop:2 }}>Win by typing this many words</p></div>
              </div>
            </div>
            <div style={{ display:'flex',justifyContent:'flex-end' }}><button className="tp-btn" onClick={saveDisplaySettings} disabled={saving}>{saving?'⏳…':'💾 Save Gameplay'}</button></div>
          </div>}

          {tab==='words' && <div>
            <div className="tp-card">
              <div className="tp-card-title">🔤 Words ({words.length})</div>
              <div className="tp-2col" style={{ marginBottom:14 }}>
                <div style={{ display:'flex',gap:8 }}>
                  <button className="tp-btn tp-btn-secondary tp-btn-sm" onClick={()=>handleAddPreset('easy')}>+ Easy Preset</button>
                  <button className="tp-btn tp-btn-secondary tp-btn-sm" onClick={()=>handleAddPreset('medium')}>+ Medium Preset</button>
                  <button className="tp-btn tp-btn-secondary tp-btn-sm" onClick={()=>handleAddPreset('hard')}>+ Hard Preset</button>
                </div>
                <div style={{ display:'flex',gap:8 }}>
                  <button className="tp-btn tp-btn-sm" onClick={()=>{setShowAddWord(true);setShowBulk(false)}}>+ Add Word</button>
                  <button className="tp-btn tp-btn-secondary tp-btn-sm" onClick={()=>{setShowBulk(true);setShowAddWord(false)}}>+ Bulk Add</button>
                </div>
              </div>
              {showAddWord && <div style={{ padding:12,background:'#F0FDF4',border:'2px dashed #BBF7D0',borderRadius:10,marginBottom:12 }}>
                <div className="tp-fg" style={{ marginBottom:10 }}><span className="tp-label">Word</span><input className="tp-input" value={newWordText} onChange={e=>setNewWordText(e.target.value.toUpperCase())} placeholder="TYPING" autoFocus style={{ fontFamily:'monospace',letterSpacing:2 }} /></div>
                <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}><button className="tp-btn tp-btn-secondary tp-btn-sm" onClick={()=>{setShowAddWord(false);setNewWordText('')}}>Cancel</button><button className="tp-btn tp-btn-sm" onClick={handleAddWord}>Add</button></div>
              </div>}
              {showBulk && <div style={{ padding:12,background:'#EFF6FF',border:'2px dashed #BFDBFE',borderRadius:10,marginBottom:12 }}>
                <div className="tp-fg" style={{ marginBottom:10 }}><span className="tp-label">Words (one per line or comma-separated)</span><textarea className="tp-input" rows={4} value={bulkWords} onChange={e=>setBulkWords(e.target.value)} placeholder={"WORD1\nWORD2\nWORD3"} style={{ fontFamily:'monospace',letterSpacing:1 }} /></div>
                <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}><button className="tp-btn tp-btn-secondary tp-btn-sm" onClick={()=>{setShowBulk(false);setBulkWords('')}}>Cancel</button><button className="tp-btn tp-btn-sm" onClick={handleBulkAdd}>Add All</button></div>
              </div>}
              <div style={{ display:'flex',flexWrap:'wrap',gap:4 }}>
                {words.map(w => (
                  <div key={w.id} className="tp-word-chip" style={{ background:w.difficulty==='easy'?'#DCFCE7':w.difficulty==='hard'?'#FEE2E2':'#FEF3C7',border:`1px solid ${w.difficulty==='easy'?'#BBF7D0':w.difficulty==='hard'?'#FECACA':'#FDE68A'}`,color:w.difficulty==='easy'?'#166534':w.difficulty==='hard'?'#991B1B':'#92400E' }}>
                    {w.word_text}
                    <span style={{ fontSize:10,opacity:0.7,cursor:'pointer' }} onClick={()=>deleteWord(w)}>✕</span>
                  </div>
                ))}
              </div>
              {words.length===0 && <p style={{ textAlign:'center',color:'#999',padding:20 }}>No words yet. Add words or use presets above.</p>}
            </div>
          </div>}

          {tab==='sounds' && <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}><h3 style={{ fontWeight:700,fontSize:16 }}>Sounds</h3><input type="file" accept="audio/*" onChange={uploadSound} style={{ display:'none' }} id="tpSound" /><button className="tp-btn" onClick={()=>document.getElementById('tpSound').click()} disabled={soundUploading}>{soundUploading?'⏳':'+ Upload'}</button></div>
            <div className="tp-card"><div className="tp-card-title">🔊 Assign Sounds</div><div className="tp-2col" style={{ marginBottom:10 }}>
              <SoundSelect label="Correct Word" value={settings.sound_correct_id} onChange={v=>setSettings({...settings,sound_correct_id:v})} sounds={sounds} />
              <SoundSelect label="Missed Word" value={settings.sound_wrong_id} onChange={v=>setSettings({...settings,sound_wrong_id:v})} sounds={sounds} />
            </div><div className="tp-2col">
              <SoundSelect label="Combo Sound" value={settings.sound_combo_id} onChange={v=>setSettings({...settings,sound_combo_id:v})} sounds={sounds} />
              <SoundSelect label="Game Over" value={settings.sound_gameover_id} onChange={v=>setSettings({...settings,sound_gameover_id:v})} sounds={sounds} />
            </div>
            <div style={{ display:'flex',justifyContent:'flex-end',marginTop:12 }}><button className="tp-btn" onClick={saveSettings}>{saving?'⏳':'💾 Save'}</button></div></div>
          </div>}

          {tab==='form' && <div className="tp-card">
            <div className="tp-card-title">📋 Fields</div>
            {formFields.map((f,i)=><div key={i} style={{ display:'flex',gap:10,flexWrap:'wrap',alignItems:'flex-end',marginBottom:8,padding:'10px 12px',background:'#F9FAFB',borderRadius:8 }}>
              <div className="tp-fg" style={{ flex:2,minWidth:130 }}><span className="tp-label">Label</span><input className="tp-input" value={f.field_label} onChange={e=>updateFormField(i,'field_label',e.target.value)} /></div>
              <div className="tp-fg" style={{ flex:1,minWidth:110 }}><span className="tp-label">Type</span><select className="tp-select" value={f.field_type} onChange={e=>updateFormField(i,'field_type',e.target.value)}><option value="text">Text</option><option value="email">Email</option><option value="phone">Phone</option><option value="number">Number</option><option value="textarea">Textarea</option></select></div>
              <label style={{ display:'flex',alignItems:'center',gap:6,paddingBottom:2 }}><input type="checkbox" checked={Number(f.is_required)===1} onChange={e=>updateFormField(i,'is_required',e.target.checked?1:0)} style={{ width:16,height:16 }} />Required</label>
              <button className="tp-icon-btn" style={{ border:'1.5px solid #FEE2E2',background:'#FFF5F5',color:'#DC2626' }} onClick={()=>removeFormField(i)}>✕</button>
            </div>)}
            <div style={{ textAlign:'center',marginTop:10 }}><button className="tp-btn tp-btn-secondary" onClick={addFormField}>+ Add</button></div>
            <div style={{ display:'flex',justifyContent:'flex-end',marginTop:14 }}><button className="tp-btn" onClick={saveFormFields}>{saving?'⏳':'💾 Save'}</button></div>
          </div>}

          {tab==='thankyou' && <div className="tp-card">
            <div className="tp-card-title">🙏 Thank You</div>
            <div className="tp-2col" style={{ marginBottom:14 }}>
              <ImageUpload label="Thank You BG" url={settings.thankyou_bg_image_url} error={upload.errors.thankyou_bg_image_url} onFile={f=>{upload.clearFieldError('thankyou_bg_image_url');const r=new FileReader();r.onload=e=>setSettings({...settings,thankyou_bg_image_url:e.target.result,_tyBgImageFile:f});r.readAsDataURL(f)}} onClear={()=>setSettings({...settings,thankyou_bg_image_url:'',_tyBgImageFile:null})} />
              <ImageUpload label="Confirm GIF" url={settings.submit_confirm_gif_url} error={upload.errors.submit_confirm_gif_url} onFile={f=>{upload.clearFieldError('submit_confirm_gif_url');const r=new FileReader();r.onload=e=>setSettings({...settings,submit_confirm_gif_url:e.target.result,_submitGifFile:f});r.readAsDataURL(f)}} onClear={()=>setSettings({...settings,submit_confirm_gif_url:'',_submitGifFile:null})} />
            </div>
            <div className="tp-fg" style={{ marginBottom:10 }}><span className="tp-label">Outro</span><textarea className="tp-input" rows={2} value={settings.outro_text||''} onChange={e=>setSettings({...settings,outro_text:e.target.value})} style={{ resize:'vertical' }} /></div>
            <div style={{ display:'flex',justifyContent:'flex-end' }}><button className="tp-btn" onClick={saveSettings}>{saving?'⏳':'💾 Save'}</button></div>
          </div>}

          {tab==='email' && <div className="tp-card">
            <div className="tp-card-title">📧 Email</div>
            <div className="tp-2col" style={{ marginBottom:12 }}><div className="tp-fg"><span className="tp-label">Sender Name</span><input className="tp-input" value={emailTemplate.sender_name||''} onChange={e=>setEmailTemplate({...emailTemplate,sender_name:e.target.value})} /></div><div className="tp-fg"><span className="tp-label">Sender Email</span><input className="tp-input" type="email" value={emailTemplate.sender_email||''} onChange={e=>setEmailTemplate({...emailTemplate,sender_email:e.target.value})} /></div></div>
            <div className="tp-fg" style={{ marginBottom:12 }}><span className="tp-label">Subject</span><input className="tp-input" value={emailTemplate.subject||''} onChange={e=>setEmailTemplate({...emailTemplate,subject:e.target.value})} /></div>
            <div className="tp-fg" style={{ marginBottom:12 }}><span className="tp-label">Body HTML</span><textarea className="tp-input" rows={6} value={emailTemplate.body_html||''} onChange={e=>setEmailTemplate({...emailTemplate,body_html:e.target.value})} style={{ resize:'vertical',fontFamily:'monospace',fontSize:12 }} /></div>
            <div style={{ display:'flex',justifyContent:'flex-end' }}><button className="tp-btn" onClick={saveEmailTemplate}>{saving?'⏳':'💾 Save'}</button></div>
          </div>}

          {tab==='settings' && <div className="tp-card">
            <div className="tp-card-title">⚙️ Settings</div>
            <div className="tp-fg" style={{ marginBottom:12 }}><span className="tp-label">Redirect URL</span><input className="tp-input" type="url" value={redirectUrl} onChange={e=>setRedirectUrl(e.target.value)} placeholder="https://..." /></div>
            <div style={{ display:'flex',justifyContent:'flex-end' }}><button className="tp-btn" onClick={saveSettings}>{saving?'⏳':'💾 Save'}</button></div>
          </div>}
        </div>

        <div className="tp-phone">
          <div className="tp-phone-notch" />
          <div className="tp-phone-screen" style={{ padding:12,display:'flex',flexDirection:'column',alignItems:'center',gap:8 }}>
            {settings.game_logo_url && <img src={settings.game_logo_url} alt="" style={{ width:'100%',maxHeight:40,objectFit:'contain',borderRadius:6 }} />}
            <h2 style={{ fontSize:14,fontWeight:800,color:settings.heading_1_color||'#fff',textAlign:'center',fontFamily:settings.font_family||'DM Sans' }}>{settings.heading_1||'Speed Typer'}</h2>
            <div style={{ display:'flex',gap:12,fontSize:11,color:'rgba(255,255,255,0.6)' }}>
              <span>Score: 0</span><span>WPM: 0</span><span>Combo: 0</span>
            </div>
            <div style={{ width:'100%',flex:1,position:'relative',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',overflow:'hidden',display:'flex',flexDirection:'column',gap:4,justifyContent:'center',alignItems:'center',padding:12 }}>
              <div style={{ padding:'6px 14px',background:'rgba(255,255,255,0.15)',borderRadius:6,color:'#fff',fontSize:12,fontWeight:700,letterSpacing:1 }}>PROGRAMMING</div>
              <div style={{ padding:'6px 14px',background:'rgba(255,255,255,0.15)',borderRadius:6,color:'#fff',fontSize:12,fontWeight:700,letterSpacing:1 }}>ALGORITHM</div>
              <div style={{ padding:'6px 14px',background:'rgba(255,255,255,0.15)',borderRadius:6,color:'#fff',fontSize:12,fontWeight:700,letterSpacing:1 }}>DATABASE</div>
            </div>
            <input style={{ width:'100%',padding:'10px',borderRadius:8,border:'2px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',color:'#fff',fontSize:14,textAlign:'center',fontFamily:'monospace',letterSpacing:2,outline:'none' }} readOnly placeholder="Type here…" />
            <div style={{ fontSize:10,color:'rgba(255,255,255,0.4)',textAlign:'center' }}>
              {settings.time_limit_seconds||60}s | {settings.max_misses||5} misses | {settings.fall_speed||2}x speed
            </div>
          </div>
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  )
}
