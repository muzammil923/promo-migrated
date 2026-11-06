import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'
import { Toast, ColorPicker, SoundSelector } from '../../apps/frontend/src/components/SharedBuilderComponents'
import { useUploadErrors, uploadErrorMessage } from '../../apps/frontend/src/lib/builderUpload'
import PhoneFrame from '../../apps/frontend/src/components/PhoneFrame'
import FormPreview from '../../apps/frontend/src/components/FormPreview'
import ThankYouPreview from '../../apps/frontend/src/components/ThankYouPreview'

const LIGHT = `
.sf-wrap {
  --sf-bg:        #f4f6fb;
  --sf-surface:   #ffffff;
  --sf-surface2:  #f0f2f8;
  --sf-border:    #e2e6f0;
  --sf-primary:   #8b5cf6;
  --sf-primary-d: #7c3aed;
  --sf-primary-g: rgba(139,92,246,0.15);
  --sf-success:   #16a34a;
  --sf-danger:    #dc2626;
  --sf-text:      #1e1e2e;
  --sf-text2:     #64657a;
  --sf-text3:     #9899ae;
  --sf-shadow:    0 2px 12px rgba(0,0,0,0.08);
  --sf-shadow-md: 0 4px 24px rgba(0,0,0,0.10);
  --sf-radius:    12px;
  --sf-radius-sm: 8px;
  font-family: 'DM Sans', sans-serif;
  background: var(--sf-bg);
  color: var(--sf-text);
  min-height: 100vh;
}
.sf-wrap *, .sf-wrap *::before, .sf-wrap *::after { box-sizing: border-box; }
.sf-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]),
.sf-wrap select, .sf-wrap textarea {
  width: 100%; font-family: inherit; font-size: 14px;
  background: var(--sf-surface); border: none; border-bottom: 1.5px solid var(--sf-border);
  border-radius: 8px; color: var(--sf-text); padding: 10px 12px 8px; outline: none; transition: border-color .18s;
}
.sf-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]):focus,
.sf-wrap select:focus, .sf-wrap textarea:focus { border-bottom-color: #8b5cf6; border-bottom-width: 2px; }
.sf-wrap select option { background: #fff; color: #1e1e2e; }
.sf-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: var(--sf-radius-sm); border: none; cursor: pointer; transition: all .15s; white-space: nowrap; font-family: inherit; }
.sf-btn:disabled { opacity: .5; cursor: not-allowed; }
.sf-btn-primary { background: var(--sf-primary); color: #fff; }
.sf-btn-primary:not(:disabled):hover { background: var(--sf-primary-d); transform: translateY(-1px); box-shadow: 0 4px 12px var(--sf-primary-g); }
.sf-btn-ghost { background: var(--sf-surface); color: var(--sf-text2); border: 1.5px solid var(--sf-border); }
.sf-btn-ghost:not(:disabled):hover { border-color: var(--sf-primary); color: var(--sf-primary); }
.sf-btn-danger { background: #fee2e2; color: var(--sf-danger); border: 1.5px solid #fecaca; }
.sf-btn-danger:not(:disabled):hover { background: #fecaca; }
.sf-btn-sm { padding: 5px 10px; font-size: 12px; }
.sf-btn-icon { padding: 6px; border-radius: 6px; }
.sf-card { background: var(--sf-surface); border: 1.5px solid var(--sf-border); border-radius: var(--sf-radius); box-shadow: var(--sf-shadow); }
.sf-label { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--sf-text2); margin-bottom: 4px; display: block; }
.sf-section-title { font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--sf-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
.sf-tabs { display: flex; border-bottom: 2px solid var(--sf-border); margin-bottom: 24px; gap: 0; overflow-x: auto; }
.sf-tab { padding: 10px 18px; font-size: 13px; font-weight: 600; border: none; background: none; cursor: pointer; color: var(--sf-text2); border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color .15s; white-space: nowrap; font-family: inherit; }
.sf-tab.active { color: #8b5cf6; border-bottom-color: #8b5cf6; }
.sf-tab:hover:not(.active) { color: var(--sf-text); }
.sf-fg { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 120px; }
.sf-swatch { width: 28px; height: 28px; border-radius: 6px; border: 2px solid var(--sf-border); cursor: pointer; flex-shrink: 0; }
.sf-thumb { height: 44px; width: auto; border-radius: 6px; border: 1px solid var(--sf-border); object-fit: contain; background: #f9f9f9; }
.sf-toast { position: fixed; bottom: 24px; right: 24px; z-index: 9999; padding: 12px 18px; border-radius: 10px; color: #fff; font-weight: 600; font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,.15); animation: sf-slide-in .22s ease; font-family: 'DM Sans',sans-serif; max-width: 320px; }
@keyframes sf-slide-in { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:none } }
.sf-song-card { background: var(--sf-surface); border: 1.5px solid var(--sf-border); border-radius: var(--sf-radius); padding: 16px; margin-bottom: 12px; }
.sf-opt-block { margin-bottom: 10px; padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--sf-border); background: var(--sf-surface); transition: all .15s; }
.sf-opt-block.is-correct { border-color: #22c55e; background: #f0fdf4; border-width: 2px; }
.sf-mark-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; border: 1.5px solid var(--sf-border); background: var(--sf-surface2); color: var(--sf-text3); cursor: pointer; transition: all .15s; font-family: inherit; margin-top: 6px; }
.sf-mark-btn:hover { border-color: var(--sf-primary); color: var(--sf-primary); }
.sf-mark-btn.active { background: #dcfce7; border-color: #22c55e; color: #16a34a; }
`

const FONT_CATEGORIES = [
  { name:'Handwriting', fonts:['Caveat','Patrick Hand','Indie Flower','Shadows Into Light','Gloria Hallelujah','Permanent Marker','Kalam','Satisfy','Reenie Beanie','Homemade Apple','Sacramento','Alex Brush'] },
  { name:'Professional', fonts:['Inter','Work Sans','Source Sans 3','Lato','Open Sans','Roboto','Nunito','DM Sans','Poppins','Rubik','Exo 2','Cabin'] },
  { name:'Luxury', fonts:['Playfair Display','Cormorant Garamond','Libre Baskerville','Cinzel','Forum','Cormorant','Bodoni Moda','Tangerine','Great Vibes','Parisienne','Bellefair','Marcellus'] },
  { name:'Modern Casual', fonts:['Montserrat','Syne','Raleway','Quicksand','Josefin Sans','Space Grotesk','Plus Jakarta Sans','Outfit','Sora','Manrope','Lexend','Figtree'] },
]

function ImageUpload({ label, url, onFile, onClear, error, accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" }) {
  const ref = useRef()
  return (
    <div className={error ? 'gb-img-error' : ''} style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
      {label && <span className="sf-label">{label}</span>}
      <input type="file" ref={ref} accept={accept} style={{ display:'none' }} onChange={e => { const f=e.target.files[0]; if(f) onFile(f) }} />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, width:'100%', marginTop:6 }}>
        <button className="sf-btn sf-btn-ghost sf-btn-sm" type="button" onClick={() => ref.current.click()}>Upload</button>
        {url && (
          <div style={{ width:'100%', maxWidth:240, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <img src={url} alt="" style={{ width:'100%', height:112, objectFit:'contain', display:'block', borderRadius:6, border:'1px solid var(--sf-border)', background:'#f9f9f9' }} />
            <button className="sf-btn sf-btn-danger sf-btn-sm" type="button" onClick={onClear}>Remove</button>
          </div>
        )}
      </div>
      {error && <div className="gb-img-error-msg">⚠️ {error}</div>}
    </div>
  )
}

export default function SoundifyBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [settings, setSettings] = useState({})
  const [emailTemplate, setEmailTemplate] = useState({})
  const [formFields, setFormFields] = useState([])
  const [sounds, setSounds] = useState([])
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [activeTab, setActiveTab] = useState('display')
  const [toast, setToast] = useState(null)
  const upload = useUploadErrors()
  const [saving, setSaving] = useState(false)
  const [savingForm, setSavingForm] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [soundUploading, setSoundUploading] = useState(false)
  const [slugInput, setSlugInput] = useState('')
  const soundUploadRef = useRef()
  const songFileRef = useRef()

  const [newSong, setNewSong] = useState({ song_title:'', option_1:'', option_2:'', option_3:'', option_4:'', correct_option: 1 })
  const [addingSong, setAddingSong] = useState(false)
  const [selectedSongId, setSelectedSongId] = useState(null)

  const showToast = (msg, type = 'success') => setToast({ msg, type })

  const loadData = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const [sfRes, gameRes, soundRes, songRes] = await Promise.all([
        api.get(`/soundify/${id}/settings`),
        api.get(`/games/${id}`),
        api.get(`/sounds/games/${id}/sounds`),
        api.get(`/soundify/${id}/songs`)
      ])
      if (gameRes.data.game) {
        setGame(gameRes.data.game)
        setFormFields(gameRes.data.game.formFields || [])
        setEmailTemplate(gameRes.data.game.emailTemplate || {})
        setSlugInput(gameRes.data.game.slug || '')
      }
      if (sfRes.data.settings) setSettings(sfRes.data.settings)
      setSounds(soundRes.data.sounds || [])
      setSongs(songRes.data.songs || [])
    } catch (err) {
      setFetchError(err.message || 'Failed to load')
    }
    setLoading(false)
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const families = FONT_CATEGORIES.flatMap(c => c.fonts).filter(f => f !== 'DM Sans').map(f => encodeURIComponent(f) + ':wght@400;600;700;800').join('&family=')
    if (!families) return
    const lid = 'sf-gf-all'
    if (document.getElementById(lid)) return
    const link = document.createElement('link')
    link.id = lid; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=' + families + '&display=swap'
    document.head.appendChild(link)
  }, [])

  useEffect(() => {
    const font = settings.font_family
    if (!font || font === 'DM Sans') return
    const lid = 'sf-gf-' + font.replace(/\s/g, '-')
    if (document.getElementById(lid)) return
    const link = document.createElement('link')
    link.id = lid; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(font) + ':wght@400;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [settings.font_family])

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
    upload.clearAll()
    try {
      const fd = new FormData()
      const fields = [
        'heading_1','heading_2','heading_3','description_text',
        'heading_1_color','heading_2_color','heading_3_color','description_color',
        'custom_win_msg','custom_lose_msg','try_again_btn_text','try_again_text_color','try_again_bg_color',
        'continue_btn_text','continue_btn_text_color','continue_btn_bg_color',
        'bg_color','primary_color','font_family','meta_description',
        'sound_correct_id','sound_wrong_id','win_sound_id','lose_sound_id',
        'terms_enabled','terms_text','terms_url',
        'start_button_text','start_button_text_color','start_button_bg_color',
        'thankyou_heading_text','thankyou_heading_color','thankyou_subtitle_text','thankyou_subtitle_color',
        'submit_btn_text','submit_btn_text_color','submit_btn_bg_color',
        'redirect_url','continue_now_btn_text','continue_now_btn_text_color','continue_now_btn_bg_color',
        'time_per_question','max_sound_replays'
      ]
      for (const f of fields) {
        let val = settings[f] ?? ''
        if (f === 'terms_enabled') val = Number(val) || 0
        if (f === 'time_per_question') val = Number(val) || 30
        if (f === 'max_sound_replays') val = Number(val) || 0
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
      await api.put(`/soundify/${id}/settings`, fd)
      showToast('Settings saved')
    } catch (err) {
      const msg = uploadErrorMessage(err)
      if (err?.response?.status === 413) {
        if (settings._bgImageFile) upload.setFieldError('bg_image_url', msg)
        if (settings._gameLogoFile) upload.setFieldError('game_logo_url', msg)
        if (settings._tyBgImageFile) upload.setFieldError('thankyou_bg_image_url', msg)
        if (settings._submitGifFile) upload.setFieldError('submit_confirm_gif_url', msg)
        if (!settings._bgImageFile && !settings._gameLogoFile && !settings._tyBgImageFile && !settings._submitGifFile)
          upload.setFieldError('bg_image_url', msg)
      } else {
        upload.setFieldError('bg_image_url', msg)
      }
      showToast('Error saving settings: ' + (err.response?.data?.message || err.message), 'error')
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

  const handleAddSong = async () => {
    if (!newSong.song_title || !newSong.option_1 || !newSong.option_2 || !newSong.option_3 || !newSong.option_4) {
      showToast('Fill all song fields', 'error'); return
    }
    const fileInput = songFileRef.current
    const file = fileInput?.files?.[0]
    if (!file) {
      showToast('Upload a song file', 'error'); return
    }
    if (file) {
      const dur = await new Promise(resolve => {
        const a = new Audio()
        a.src = URL.createObjectURL(file)
        a.onloadedmetadata = () => { URL.revokeObjectURL(a.src); resolve(a.duration) }
        a.onerror = () => { URL.revokeObjectURL(a.src); resolve(0) }
      })
      if (dur < 5) {
        showToast('Audio must be at least 5 seconds long', 'error'); return
      }
    }
    setAddingSong(true)
    try {
      const fd = new FormData()
      fd.append('song_title', newSong.song_title)
      fd.append('option_1', newSong.option_1)
      fd.append('option_2', newSong.option_2)
      fd.append('option_3', newSong.option_3)
      fd.append('option_4', newSong.option_4)
      fd.append('correct_option', newSong.correct_option)
      if (file) fd.append('song_file', file)
      const res = await api.post(`/soundify/${id}/songs`, fd)
      const newSongData = res.data.song
      setSongs(prev => [...prev, newSongData])
      setSelectedSongId(newSongData.id)
      setNewSong({ song_title:'', option_1:'', option_2:'', option_3:'', option_4:'', correct_option: 1 })
      if (fileInput) fileInput.value = ''
      showToast('Song added')
    } catch (err) { showToast('Error: '+(err.response?.data?.message||err.message), 'error') }
    setAddingSong(false)
  }

  const handleDeleteSong = async (song) => {
    try {
      const res = await api.delete(`/soundify/${id}/songs/${song.id}`)
      if (res.data.success) {
        setSongs(prev => prev.filter(s => s.id !== song.id))
        if (selectedSongId === song.id) setSelectedSongId(null)
        showToast('Song deleted')
      }
    } catch (err) {
      showToast('Error: ' + (err.response?.data?.message || err.message), 'error')
    }
  }

  const selectedSong = songs.find(s => s.id === selectedSongId)
  const gameLink = game ? `${window.location.origin}/play/${game.slug}/${game.client_slug}` : ''
  const gameBgUrl = settings._bgPreview || settings.bg_image_url
  const gameLogoUrl = settings._logoPreview || settings.game_logo_url
  const thankyouBgUrl = settings._tyPreview || settings.thankyou_bg_image_url
  const submitGifUrl = settings._submitGifPreview || settings.submit_confirm_gif_url

  const TABS = [
    { id:'display',  label:'Player Form' },
    { id:'songs',    label:'Songs' },
    { id:'thankyou', label:'Thankyou Page' },
    { id:'email',    label:'Email' },
    { id:'audio',    label:'Audio' },
    { id:'settings', label:'Settings' },
  ]

  const TAB_FIELDS = {
    display:  ['bg_image_url', 'game_logo_url'],
    thankyou: ['thankyou_bg_image_url', 'submit_confirm_gif_url'],
  }

  if (loading) return (
    <div className="sf-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign:'center', color:'var(--sf-text2)' }}>
        <div style={{ width:40,height:40,borderRadius:'50%',border:'3px solid #e2e6f0',borderTopColor:'#8b5cf6',animation:'spin .8s linear infinite',margin:'0 auto 16px' }} />
        Loading builder...
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (fetchError) return (
    <div className="sf-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign:'center', maxWidth:400 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>!</div>
        <h2 style={{ color:'var(--sf-danger)', marginBottom:8 }}>Builder Failed to Load</h2>
        <p style={{ color:'var(--sf-text2)', marginBottom:20 }}>{fetchError}</p>
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
          <button className="sf-btn sf-btn-primary" onClick={loadData}>Retry</button>
          <button className="sf-btn sf-btn-ghost" onClick={() => navigate('/dashboard/games')}>Back to Games</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="sf-wrap">
      <style>{LIGHT}</style>

      <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', background:'var(--sf-surface)', borderBottom:'1.5px solid var(--sf-border)', padding:'10px 28px', gap:'4px 20px', alignItems:'center', position:'sticky', top:'62px', zIndex:50, boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>
        <div style={{ display:'flex', gap:6, alignItems:'center', justifySelf:'start' }}>
          <button className="sf-btn sf-btn-ghost sf-btn-sm" onClick={() => navigate('/dashboard/games')} style={{ padding:'6px 8px', fontSize:16, lineHeight:1 }} title="Back to games">&larr;</button>
          <div>
            {editingName ? (
              <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                <input value={nameInput} onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter') saveGameName(); if (e.key==='Escape') setEditingName(false) }}
                  onBlur={saveGameName} autoFocus style={{ width:180, fontSize:14, fontWeight:700, padding:'3px 6px' }} />
                <button className="sf-btn sf-btn-ghost sf-btn-sm" onClick={() => setEditingName(false)} style={{ padding:'2px 6px' }}>x</button>
              </div>
            ) : (
              <div style={{ fontWeight:700, fontSize:14, color:'var(--sf-text)', cursor:'pointer', lineHeight:1.3 }} onClick={() => { setNameInput(game?.name||''); setEditingName(true) }} title="Click to edit">
                {game?.name || 'Soundify Game'} <span style={{ fontSize:10, color:'var(--sf-text3)', fontWeight:400 }}>edit</span>
              </div>
            )}
            <div style={{ fontSize:9.5, fontWeight:600, color:'var(--sf-text3)', letterSpacing:'.04em', textTransform:'uppercase', marginTop:1 }}>Soundify Builder</div>
          </div>
        </div>

        <div className="sf-tabs" style={{ marginBottom:0, borderBottom:'none', justifySelf:'center' }}>
          {TABS.map(t => {
            const hasErr = upload.tabHasError(t.id, TAB_FIELDS[t.id] || [])
            return (
              <button key={t.id} className={`sf-tab${activeTab===t.id?' active':''}`} onClick={() => setActiveTab(t.id)} style={{ padding:'6px 14px', fontSize:12.5 }}>
                {t.label}{hasErr && <span className="gb-tab-err-dot" />}
              </button>
            )
          })}
        </div>

        <div style={{ display:'flex', gap:6, alignItems:'center', justifySelf:'end' }}>
          <button className="sf-btn sf-btn-ghost sf-btn-sm" style={{ padding:'6px 8px', fontSize:16, lineHeight:1 }}
            onClick={() => { navigator.clipboard.writeText(gameLink); showToast('Link copied!') }}
            title="Copy game link">link</button>
          <a href={gameLink} target="_blank" rel="noreferrer" className="sf-btn sf-btn-ghost sf-btn-sm"
            style={{ padding:'6px 8px', fontSize:16, lineHeight:1, textDecoration:'none' }}
            title="Preview game">preview</a>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 0 24px 20px', display:'grid', gridTemplateColumns:'1fr 320px', gap:24, alignItems:'start' }}>

        {/* ─── LEFT COL ─── */}
        <div>

          {/* ════ PLAYER FORM TAB ════ */}
          {activeTab === 'display' && (
            <div>
              <div className="sf-card" style={{ padding:20, marginBottom:16 }}>
                <div className="sf-section-title">Visuals</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(220px, 1fr))', gap:20, justifyItems:'center', alignItems:'start' }}>
                  <ImageUpload label="Game Background Image" error={upload.hasError('bg_image_url')} url={settings._bgPreview || settings.bg_image_url} onFile={f => { upload.clearFieldError('bg_image_url'); setS('_bgImageFile', f); setS('_bgPreview', URL.createObjectURL(f)) }} onClear={() => { setS('bg_image_url', ''); setS('_bgImageFile', null); setS('_bgPreview', null); upload.clearFieldError('bg_image_url') }} />
                  <ImageUpload label="Game Logo" error={upload.hasError('game_logo_url')} url={settings._logoPreview || settings.game_logo_url} onFile={f => { upload.clearFieldError('game_logo_url'); setS('_gameLogoFile', f); setS('_logoPreview', URL.createObjectURL(f)) }} onClear={() => { setS('game_logo_url', ''); setS('_gameLogoFile', null); setS('_logoPreview', null); upload.clearFieldError('game_logo_url') }} />
                </div>
              </div>

              <div className="sf-card" style={{ padding:20, marginBottom:16 }}>
                <div className="sf-section-title">Game Texts</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'12px 16px', alignItems:'end' }}>
                  <div className="sf-fg" style={{ marginBottom:0 }}><span className="sf-label">Heading 1 (Title - Text 1)</span><input value={settings.heading_1 || ''} onChange={e => setS('heading_1', e.target.value)} placeholder="Main title" /></div>
                  <ColorPicker value={settings.heading_1_color || '#1a1a2e'} onChange={v => setS('heading_1_color', v)} label="Color" />
                  <div className="sf-fg" style={{ marginBottom:0 }}><span className="sf-label">Heading 2 (Subtitle - Text 2)</span><input value={settings.heading_2 || ''} onChange={e => setS('heading_2', e.target.value)} placeholder="Sub-heading" /></div>
                  <ColorPicker value={settings.heading_2_color || '#1a1a2e'} onChange={v => setS('heading_2_color', v)} label="Color" />
                  <div className="sf-fg" style={{ marginBottom:0 }}><span className="sf-label">Intro Text (Body - Text 3, shown before quiz)</span><input value={settings.heading_3 || ''} onChange={e => setS('heading_3', e.target.value)} placeholder="Intro text" /></div>
                  <ColorPicker value={settings.heading_3_color || '#444444'} onChange={v => setS('heading_3_color', v)} label="Color" />
                </div>
              </div>

              <div className="sf-card" style={{ padding:20, marginBottom:16 }}>
                <div className="sf-section-title">Form Fields</div>
                <p style={{ color:'var(--sf-text2)', marginBottom:16, fontSize:13 }}>These fields appear on the player registration screen before the quiz starts.</p>
                {formFields.map((f,i) => (
                  <div key={i} className="sf-card" style={{ marginBottom:10, padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
                      <div className="sf-fg" style={{ flex:2, minWidth:130 }}><span className="sf-label">Label</span><input value={f.field_label} onChange={e => updateFormField(i,'field_label',e.target.value)} /></div>
                      <div className="sf-fg" style={{ flex:1, minWidth:110 }}><span className="sf-label">Type</span><select value={f.field_type} onChange={e => updateFormField(i,'field_type',e.target.value)}><option value="text">Text</option><option value="email">Email</option><option value="phone">Phone</option><option value="number">Number</option><option value="textarea">Textarea</option><option value="select">Dropdown</option></select></div>
                      <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer', paddingBottom:2, whiteSpace:'nowrap' }}><input type="checkbox" checked={!!f.is_required} onChange={e => updateFormField(i,'is_required',e.target.checked?1:0)} style={{ width:16,height:16 }} /> Required</label>
                      <button className="sf-btn sf-btn-danger sf-btn-sm" onClick={() => removeFormField(i)}>x</button>
                    </div>
                  </div>
                ))}
                <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'center' }}>
                  <button className="sf-btn sf-btn-ghost" onClick={addFormField}>+ Add Field</button>
                  <button className="sf-btn sf-btn-primary" onClick={saveFormFields} disabled={savingForm}>{savingForm ? 'Saving...' : 'Save Form'}</button>
                </div>
              </div>

              <div className="sf-card" style={{ padding:20, marginBottom:16 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                  <div>
                    <div className="sf-section-title">Terms & Conditions</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}><input type="checkbox" id="sfTermsEnabled" checked={!!settings.terms_enabled} onChange={e => setS('terms_enabled', e.target.checked?1:0)} style={{ width:16,height:16 }} /><label htmlFor="sfTermsEnabled" style={{ fontWeight:600, cursor:'pointer', fontSize:13 }}>Require acceptance</label></div>
                    <div className="sf-fg" style={{ marginBottom:10 }}><span className="sf-label">Label Text</span><input value={settings.terms_text||''} onChange={e => setS('terms_text', e.target.value)} placeholder="Terms & Conditions" /></div>
                    <div className="sf-fg" style={{ marginBottom:0 }}><span className="sf-label">URL (optional)</span><input value={settings.terms_url||''} onChange={e => setS('terms_url', e.target.value)} placeholder="https://yoursite.com/terms" /></div>
                  </div>
                  <div>
                    <div className="sf-section-title">Start Button</div>
                    <div className="sf-fg" style={{ marginBottom:10 }}><span className="sf-label">Button Text</span><input value={settings.start_button_text||''} onChange={e => setS('start_button_text', e.target.value)} placeholder="Start Quiz" /></div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <ColorPicker value={settings.start_button_text_color||'#ffffff'} onChange={v => setS('start_button_text_color', v)} label="Text Color" />
                      <ColorPicker value={settings.start_button_bg_color||''} onChange={v => setS('start_button_bg_color', v)} label="Background Color" />
                    </div>
                  </div>
                </div>
              </div>

              <button className="sf-btn sf-btn-primary" onClick={saveSettings} disabled={saving} style={{ width:'100%', padding:'14px', justifyContent:'center', fontSize:14, borderRadius:14 }}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}

          {/* ════ SONGS TAB ════ */}
          {activeTab === 'songs' && (
            <div style={{ display:'grid', gridTemplateColumns: selectedSongId ? '260px 1fr' : '1fr', gap:16, alignItems:'start' }}>
              {/* Song List Sidebar */}
              <div>
                <div className="sf-card" style={{ padding:16, marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                    <div className="sf-section-title" style={{ marginBottom:0 }}>Songs</div>
                    <span style={{ fontSize:12, color:'var(--sf-text2)', fontWeight:600 }}>{songs.length}</span>
                  </div>
                  {songs.length === 0 ? (
                    <p style={{ color:'var(--sf-text3)', fontSize:13 }}>No songs yet. Add your first song.</p>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {songs.map((song, i) => {
                        const isSelected = selectedSongId === song.id
                        return (
                          <div key={song.id} onClick={() => setSelectedSongId(song.id)} style={{ padding:'8px 10px', borderRadius:8, cursor:'pointer', fontSize:13, background: isSelected ? '#f0ecff' : '#fff', border:`1.5px solid ${isSelected ? 'var(--sf-primary)' : 'var(--sf-border)'}`, transition:'all .12s' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                              <span style={{ fontWeight:700, color:'var(--sf-primary)', fontSize:12 }}>#{i+1}</span>
                              <span style={{ fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{song.song_title || 'Untitled'}</span>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                              <span style={{ fontSize:10, color:'var(--sf-text3)' }}>Correct: Opt {song.correct_option}</span>
                              <button onClick={e => { e.stopPropagation(); handleDeleteSong(song) }} style={{ background:'none', border:'none', cursor:'pointer', padding:0, fontSize:12, color:'var(--sf-danger)' }} title="Delete">del</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <button className="sf-btn sf-btn-primary sf-btn-sm" onClick={() => { setSelectedSongId(null); setNewSong({ song_title:'', option_1:'', option_2:'', option_3:'', option_4:'', correct_option: 1 }); if (songFileRef.current) songFileRef.current.value = '' }} style={{ width:'100%', marginTop:10, justifyContent:'center' }}>
                    + Add Song
                  </button>
                </div>
              </div>

              {/* Song Editor */}
              <div>
                {!selectedSongId ? (
                  <div className="sf-card" style={{ padding:20 }}>
                    <div className="sf-section-title">Add New Song</div>
                    <p style={{ color:'var(--sf-text2)', marginBottom:16, fontSize:13 }}>Upload an audio clip and provide 4 options. Mark the correct answer.</p>
                    <div className="sf-fg" style={{ marginBottom:12 }}>
                      <span className="sf-label">Song Title</span>
                      <input value={newSong.song_title} onChange={e => setNewSong(p => ({...p, song_title: e.target.value}))} placeholder="Song title / display name" />
                    </div>
                    <div className="sf-fg" style={{ marginBottom:12 }}>
                      <span className="sf-label">Song Audio File (MP3/WAV/OGG)</span>
                      <input type="file" ref={songFileRef} accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg" style={{ fontSize:13 }} />
                    </div>
                    <div style={{ marginBottom:12 }}>
                      <span className="sf-label" style={{ marginBottom:8, display:'block' }}>Answer Options</span>
                      {[1,2,3,4].map(n => (
                        <div key={n} className={`sf-opt-block${newSong.correct_option === n ? ' is-correct' : ''}`}>
                          <div className="sf-fg" style={{ marginBottom:0 }}>
                            <span className="sf-label">Option {n}</span>
                            <input value={newSong[`option_${n}`]} onChange={e => setNewSong(p => ({...p, [`option_${n}`]: e.target.value}))} placeholder={`Option ${n}`} style={{ fontSize:13 }} />
                          </div>
                          <button type="button" className={`sf-mark-btn${newSong.correct_option === n ? ' active' : ''}`} onClick={() => setNewSong(p => ({...p, correct_option: n}))}>
                            {newSong.correct_option === n ? 'Correct Answer' : 'Mark as Correct'}
                          </button>
                        </div>
                      ))}
                    </div>
                    <button className="sf-btn sf-btn-primary" onClick={handleAddSong} disabled={addingSong} style={{ width:'100%', justifyContent:'center' }}>
                      {addingSong ? 'Adding...' : '+ Add Song'}
                    </button>
                  </div>
                ) : selectedSong ? (
                  <div className="sf-card" style={{ padding:20 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                      <div className="sf-section-title" style={{ marginBottom:0 }}>Song #{songs.indexOf(selectedSong)+1}</div>
                      <button className="sf-btn sf-btn-danger sf-btn-sm" onClick={() => handleDeleteSong(selectedSong)}>Delete</button>
                    </div>
                    <div style={{ marginBottom:12 }}>
                      <span className="sf-label">Audio Preview</span>
                      <audio controls src={selectedSong.song_url} style={{ width:'100%', height:36 }} />
                    </div>
                    <div className="sf-fg" style={{ marginBottom:12 }}>
                      <span className="sf-label">Correct Answer</span>
                      <div style={{ padding:'6px 10px', borderRadius:6, fontSize:13, background:'#dcfce7', border:'1px solid #86efac', color:'#16a34a', fontWeight:600 }}>
                        Option {selectedSong.correct_option}: {selectedSong[`option_${selectedSong.correct_option}`]}
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      {[1,2,3,4].map(n => (
                        <div key={n} style={{ padding:'6px 10px', borderRadius:6, fontSize:12, background: selectedSong.correct_option === n ? '#dcfce7' : 'var(--sf-surface2)', border: selectedSong.correct_option === n ? '1px solid #86efac' : '1px solid var(--sf-border)', color: selectedSong.correct_option === n ? '#16a34a' : 'var(--sf-text2)' }}>
                          {n}. {selectedSong[`option_${n}`]}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* ════ THANKYOU PAGE TAB ════ */}
          {activeTab === 'thankyou' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <div className="sf-card" style={{ padding:20 }}>
                  <div className="sf-section-title">Thankyou Page Background</div>
                  <ImageUpload label="" error={upload.hasError('thankyou_bg_image_url')} url={settings._tyPreview || settings.thankyou_bg_image_url} onFile={f => { upload.clearFieldError('thankyou_bg_image_url'); setS('_tyBgImageFile',f); setS('_tyPreview',URL.createObjectURL(f)) }} onClear={() => { setS('thankyou_bg_image_url',''); setS('_tyBgImageFile',null); setS('_tyPreview',null); upload.clearFieldError('thankyou_bg_image_url') }} />
                </div>
                <div className="sf-card" style={{ padding:20 }}>
                  <div className="sf-section-title">Thankyou Message</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'12px 12px', alignItems:'end' }}>
                    <div className="sf-fg"><span className="sf-label">Heading Text</span><input value={settings.thankyou_heading_text||''} onChange={e=>setS('thankyou_heading_text',e.target.value)} placeholder="Yay! You completed the game!" /></div>
                    <ColorPicker value={settings.thankyou_heading_color||'#1a1a2e'} onChange={v=>setS('thankyou_heading_color',v)} label="Color" />
                    <div className="sf-fg"><span className="sf-label">Subtitle Text</span><input value={settings.thankyou_subtitle_text||''} onChange={e=>setS('thankyou_subtitle_text',e.target.value)} placeholder="Thank you for completing!" /></div>
                    <ColorPicker value={settings.thankyou_subtitle_color||'#444444'} onChange={v=>setS('thankyou_subtitle_color',v)} label="Color" />
                  </div>
                </div>
              </div>

              <div className="sf-card" style={{ padding:20, marginBottom:16 }}>
                <div className="sf-section-title">Submit Button</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:12, alignItems:'end' }}>
                  <div className="sf-fg"><span className="sf-label">Button Text</span><input value={settings.submit_btn_text||''} onChange={e=>setS('submit_btn_text',e.target.value)} placeholder="Submit & Explore" /></div>
                  <ColorPicker value={settings.submit_btn_text_color||'#ffffff'} onChange={v=>setS('submit_btn_text_color',v)} label="Text Color" />
                  <ColorPicker value={settings.submit_btn_bg_color||'#000000'} onChange={v=>setS('submit_btn_bg_color',v)} label="Background" />
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <div className="sf-card" style={{ padding:20 }}>
                  <div className="sf-section-title">Submit Confirmation GIF</div>
                  <ImageUpload label="" error={upload.hasError('submit_confirm_gif_url')} url={settings._submitGifPreview || settings.submit_confirm_gif_url} onFile={f => { upload.clearFieldError('submit_confirm_gif_url'); setS('_submitGifFile',f); setS('_submitGifPreview',URL.createObjectURL(f)) }} onClear={() => { setS('submit_confirm_gif_url',''); setS('_submitGifFile',null); setS('_submitGifPreview',null); upload.clearFieldError('submit_confirm_gif_url') }} accept="image/gif,image/png,image/jpeg,image/webp" />
                </div>
                <div className="sf-card" style={{ padding:20 }}>
                  <div className="sf-section-title">Post-Game Redirect URL</div>
                  <div className="sf-fg" style={{ marginBottom:16 }}><span className="sf-label">Redirect URL</span><input value={settings.redirect_url||''} onChange={e=>setS('redirect_url',e.target.value)} placeholder="https://yourwebsite.com/thankyou" /><span style={{ fontSize:11, color:'var(--sf-text3)', marginTop:2 }}>Leave blank to show default.</span></div>
                  <div style={{ height:1, background:'var(--sf-border)', margin:'8px 0' }} />
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}><input type="checkbox" id="sfContBtn" checked={!!settings.continue_now_btn_text} onChange={e => setS('continue_now_btn_text', e.target.checked ? 'Continue Now' : '')} style={{ width:16,height:16 }} /><label htmlFor="sfContBtn" style={{ fontWeight:600, cursor:'pointer', fontSize:13 }}>Continue Now Button</label></div>
                  {settings.continue_now_btn_text && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:12, alignItems:'end' }}>
                      <div className="sf-fg"><input value={settings.continue_now_btn_text} onChange={e=>setS('continue_now_btn_text',e.target.value)} placeholder="Continue Now" /></div>
                      <ColorPicker value={settings.continue_now_btn_text_color||'#ffffff'} onChange={v=>setS('continue_now_btn_text_color',v)} label="Text Color" />
                      <ColorPicker value={settings.continue_now_btn_bg_color||'#000000'} onChange={v=>setS('continue_now_btn_bg_color',v)} label="Background" />
                    </div>
                  )}
                </div>
              </div>

              <button className="sf-btn sf-btn-primary" onClick={saveSettings} disabled={saving} style={{ width:'100%', padding:'14px', justifyContent:'center', fontSize:14, borderRadius:14 }}>
                {saving ? 'Saving...' : 'Save Thankyou Settings'}
              </button>
            </div>
          )}

          {/* ════ EMAIL TAB ════ */}
          {activeTab === 'email' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <p style={{ color:'var(--sf-text2)', fontSize:13, margin:0 }}>Configure the congratulations email sent to players.</p>
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>
                  <input type="checkbox" checked={!!emailTemplate.is_enabled} onChange={e => setEmailTemplate({ ...emailTemplate, is_enabled:e.target.checked?1:0 })} style={{ width:16, height: 16 }} />
                  Enable email
                </label>
              </div>

              <div style={{ background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:10, padding:'12px 14px', color:'#92400e', fontSize:13, marginBottom:16 }}>
                Use {'{{name}}'}, {'{{score}}'}, {'{{total}}'}, and {'{{game_name}}'} as placeholders.
              </div>

              <div className="sf-card" style={{ padding:20, marginBottom:16 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div className="sf-fg"><span className="sf-label">Sender Name</span><input value={emailTemplate.sender_name||''} onChange={e => setEmailTemplate({ ...emailTemplate, sender_name:e.target.value })} placeholder="Quiz Platform" /></div>
                  <div className="sf-fg"><span className="sf-label">Sender Email</span><input value={emailTemplate.sender_email||''} onChange={e => setEmailTemplate({ ...emailTemplate, sender_email:e.target.value })} placeholder="noreply@yourdomain.com" /></div>
                </div>
                <div className="sf-fg" style={{ marginBottom:14 }}><span className="sf-label">Subject</span><input value={emailTemplate.subject||''} onChange={e => setEmailTemplate({ ...emailTemplate, subject:e.target.value })} placeholder="Congratulations {{name}}!" /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'flex-end', marginBottom:14 }}>
                  <div className="sf-fg"><span className="sf-label">Header Text</span><input value={emailTemplate.header_text||''} onChange={e => setEmailTemplate({ ...emailTemplate, header_text:e.target.value })} placeholder="Congratulations!" /></div>
                  <ColorPicker value={emailTemplate.header_color||'#6366f1'} onChange={v => setEmailTemplate({ ...emailTemplate, header_color:v })} label="Header Color" />
                </div>
                <div className="sf-fg" style={{ marginBottom:14 }}><span className="sf-label">Email Body (HTML)</span><textarea rows={7} value={emailTemplate.body_html||''} onChange={e => setEmailTemplate({ ...emailTemplate, body_html:e.target.value })} placeholder="<p>Thank you, {{name}}!</p>" style={{ resize:'vertical', fontFamily:'monospace', fontSize:13 }} /></div>
                <div className="sf-fg" style={{ marginBottom:20 }}><span className="sf-label">Footer Text</span><input value={emailTemplate.footer_text||''} onChange={e => setEmailTemplate({ ...emailTemplate, footer_text:e.target.value })} placeholder="Your Company" /></div>
                <button className="sf-btn sf-btn-primary" onClick={saveEmailTemplate} disabled={saving} style={{ width:'100%', padding:'12px', justifyContent:'center', fontSize:14 }}>
                  {saving ? 'Saving...' : 'Save Email Template'}
                </button>
              </div>
            </div>
          )}

          {/* ════ AUDIO TAB ════ */}
          {activeTab === 'audio' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <div>
                  <h3 style={{ color:'var(--sf-text)', fontFamily:'inherit', marginBottom:4 }}>Sound Library</h3>
                  <p style={{ color:'var(--sf-text2)', fontSize:13 }}>Upload MP3, WAV or OGG files, then assign them below.</p>
                </div>
                <div>
                  <input type="file" ref={soundUploadRef} accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/x-wav,audio/wave" onChange={uploadSound} style={{ display: 'none' }} />
                  <button className="sf-btn sf-btn-primary" onClick={() => soundUploadRef.current.click()} disabled={soundUploading}>
                    {soundUploading ? 'Uploading...' : '+ Upload Sound'}
                  </button>
                </div>
              </div>
              <div className="sf-card" style={{ marginBottom:20, padding:16 }}>
                <div className="sf-section-title">Assign Sounds to Quiz</div>
                <p style={{ color:'var(--sf-text2)', fontSize:12, marginBottom:14 }}>These play globally across the entire quiz. Upload sounds above first, then select them here.</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:16 }}>
                  <SoundSelector label="Correct Answer" value={settings.sound_correct_id} onChange={v => setS('sound_correct_id', v)} sounds={sounds} />
                  <SoundSelector label="Wrong Answer" value={settings.sound_wrong_id} onChange={v => setS('sound_wrong_id', v)} sounds={sounds} />
                  <SoundSelector label="Win / Completion" value={settings.win_sound_id} onChange={v => setS('win_sound_id', v)} sounds={sounds} />
                  <SoundSelector label="Lose Sound" value={settings.lose_sound_id} onChange={v => setS('lose_sound_id', v)} sounds={sounds} />
                </div>
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <button className="sf-btn sf-btn-primary sf-btn-sm" onClick={saveSettings} disabled={saving}>{saving ? 'Saving...' : 'Save Sound Assignments'}</button>
                </div>
              </div>
              {sounds.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--sf-text2)' }}>
                  <p style={{ marginBottom:16 }}>No sounds yet. Upload MP3, WAV, or OGG files.</p>
                  <button className="sf-btn sf-btn-primary" onClick={() => soundUploadRef.current.click()}>+ Upload Sound</button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {sounds.map(s => (
                    <div key={s.id} className="sf-card" style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:14 }}>{s.name}</div>
                        <div style={{ color:'var(--sf-text3)', fontSize:11, marginTop:2 }}>ID: {s.id} - {s.sound_type}</div>
                      </div>
                      <audio controls src={s.url} style={{ height:32 }} />
                      <button className="sf-btn sf-btn-danger sf-btn-sm sf-btn-icon" onClick={() => deleteSound(s)}>del</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ SETTINGS TAB ════ */}
          {activeTab === 'settings' && (
            <div>
              <div className="sf-card" style={{ padding:20, marginBottom:16 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                  <div>
                    <div className="sf-section-title">Game URL Slug</div>
                    <p style={{ color:'var(--sf-text2)', fontSize:12, marginBottom:8 }}>This determines the public URL: <code style={{ fontSize:11 }}>{window.location.origin}/play/{slugInput || 'your-slug'}/{game?.client_slug || '...'}</code></p>
                    <div className="sf-fg" style={{ marginBottom:0 }}>
                      <input value={slugInput} onChange={e => setSlugInput(e.target.value)} placeholder="my-game-slug" />
                    </div>
                  </div>
                  <div>
                    <div className="sf-section-title">Colors</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <ColorPicker value={settings.bg_color || '#ffffff'} onChange={v => setS('bg_color', v)} label="Background Color" />
                      <ColorPicker value={settings.primary_color || '#8b5cf6'} onChange={v => setS('primary_color', v)} label="Primary / Accent Color" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sf-card" style={{ padding:20, marginBottom:16 }}>
                <div className="sf-section-title">Font Family</div>
                <div style={{ display:'grid', gap:12 }}>
                  {FONT_CATEGORIES.map((cat, ci) => (
                    <div key={cat.name} style={ci < FONT_CATEGORIES.length - 1 ? {paddingBottom:12,borderBottom:'1px solid var(--sf-border)'} : {}}>
                      <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', color:'var(--sf-text3)', marginBottom:6 }}>{cat.name}</div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                        {cat.fonts.map(font => (
                          <div key={font} onClick={() => setS('font_family', font)} style={{ padding:'6px 8px', borderRadius:6, cursor:'pointer', fontSize:12, border:`1.5px solid ${settings.font_family===font||(!settings.font_family&&font==='DM Sans') ? 'var(--sf-primary)' : 'var(--sf-border)'}`, background: settings.font_family===font||(!settings.font_family&&font==='DM Sans') ? '#f0ecff' : '#fff', transition:'all .12s', fontFamily: "'" + font + "', sans-serif" }}>
                            <div style={{ fontWeight:700, lineHeight:1.3 }}>{font}</div>
                            <div style={{ color:'#888', fontWeight:400, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>The quick brown fox</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sf-card" style={{ padding:20, marginBottom:16 }}>
                <div className="sf-section-title">Game Timing</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div className="sf-fg"><span className="sf-label">Time per Song (seconds)</span><input type="number" value={settings.time_per_question||30} onChange={e=>setS('time_per_question',e.target.value)} min={5} max={120} placeholder="30" /><span style={{ fontSize:11, color:'var(--sf-text3)', marginTop:2 }}>Default: 30s</span></div>
                  <div className="sf-fg"><span className="sf-label">Maximum Sound Replays</span><input type="number" min={0} max={10} value={settings.max_sound_replays ?? 1} onChange={e => setS('max_sound_replays', parseInt(e.target.value) || 0)} placeholder="1" /><span style={{ fontSize:11, color:'var(--sf-text3)', marginTop:2 }}>0 = no replay, 1 = one replay</span></div>
                </div>
              </div>

              <div className="sf-card" style={{ padding:20, marginBottom:16 }}>
                <div className="sf-section-title">Social Share Preview</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
                  <div>
                    <p style={{ color:'var(--sf-text2)', fontSize:12, marginBottom:10 }}>Text shown when the game link is shared on WhatsApp, Facebook etc.</p>
                    <div className="sf-fg" style={{ marginBottom:0 }}><span className="sf-label">Share Description</span><input value={settings.meta_description||''} onChange={e => setS('meta_description', e.target.value)} placeholder="Play this game and win exciting rewards!" maxLength={200} /><span style={{ fontSize:11, color:'var(--sf-text3)', marginTop:2 }}>{(settings.meta_description||'').length}/200</span></div>
                  </div>
                  <div style={{ border:'1px solid var(--sf-border)', borderRadius:10, overflow:'hidden', background:'#fff', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{ height:120, background: gameBgUrl ? `center/cover url(${gameBgUrl})` : (settings.primary_color||'#8b5cf6'), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:32, fontWeight:800 }}></div>
                    <div style={{ padding:'12px 14px' }}>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', color:'#888', marginBottom:3 }}>{window.location.hostname || 'yourdomain.com'}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#1a1a2e', marginBottom:4, lineHeight:1.3 }}>{game?.name || 'Untitled'}</div>
                      <div style={{ fontSize:12, color:'#555', lineHeight:1.4 }}>{settings.meta_description || 'Play this game and win exciting rewards!'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <button className="sf-btn sf-btn-primary" onClick={saveSettings} disabled={saving} style={{ width:'100%', padding:'14px', justifyContent:'center', fontSize:14, borderRadius:14 }}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}

        </div>{/* ─ end left col ─ */}

        {/* ─── RIGHT COL — Phone Mockup ─── */}
        {activeTab !== 'email' && (
          <PhoneFrame settings={settings}>
            {(activeTab === 'display' || activeTab === 'settings' || activeTab === 'audio') && (
              <FormPreview settings={settings} formFields={formFields} bgUrl={gameBgUrl} logoUrl={gameLogoUrl} />
            )}
            {activeTab === 'songs' && (
              <div style={{ flex:1, display:'flex', flexDirection:'column', background: gameBgUrl ? `url(${gameBgUrl}) center/cover` : (settings.bg_color||'#1e1b4b'), padding:'14px 12px', overflow:'auto' }}>
                <div style={{ width:'100%', maxWidth:280, margin:'auto', background:'rgba(255,255,255,0.08)', backdropFilter:'blur(20px)', borderRadius:22, padding:'18px 14px', boxShadow:'0 8px 40px rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', textAlign:'center', marginBottom:4 }}>Question {Math.min(1, songs.length)} of {songs.length}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fff', textAlign:'center', marginBottom:12 }}>{songs[0]?.song_title || 'Song Title'}</div>
                  <div style={{ width:'100%', height:36, borderRadius:20, background:'rgba(255,255,255,0.15)', marginBottom:12 }} />
                  {[1,2,3,4].map(n => (
                    <div key={n} style={{ width:'100%', padding:'10px 14px', borderRadius:12, border:'2px solid rgba(255,255,255,0.15)', background:songs[0]?.correct_option===n ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'rgba(255,255,255,0.08)', color:'#fff', fontSize:12, fontWeight:600, marginBottom:6, textAlign:'center' }}>
                        {songs[0]?.[`option_${n}`] || `Option ${n}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'thankyou' && (
              <ThankYouPreview settings={settings} bgUrl={thankyouBgUrl} submitGifUrl={submitGifUrl} />
            )}
          </PhoneFrame>
        )}

        {activeTab === 'email' && (() => {
          const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;background:#f4f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.wrap{max-width:600px;margin:0 auto;background:#fff}.header{background:${emailTemplate.header_color||'#6366f1'};padding:24px 20px;text-align:center}.header h1{color:#fff;margin:0;font-size:20px;font-weight:700}.body{padding:24px 20px;color:#333;font-size:14px;line-height:1.6}.footer{padding:16px 20px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee}</style></head><body><div class="wrap"><div class="header"><h1>${emailTemplate.header_text||'Congratulations!'}</h1></div><div class="body">${emailTemplate.body_html||'<p>Thank you for completing the game, {{name}}!</p>'}</div>${emailTemplate.footer_text?`<div class="footer">${emailTemplate.footer_text}</div>`:''}</div></body></html>`.trim()
          return (
            <div style={{ position:'sticky', top:80, width:320, height:580, flexShrink:0 }}>
              <div style={{ height:'100%', borderRadius:18, border:'1.5px solid var(--sf-border)', overflow:'hidden', background:'#f4f4f6', boxShadow:'0 12px 48px rgba(0,0,0,.12)' }}>
                <iframe title="Email Preview" srcDoc={html} style={{ width:'100%', height:'100%', border:'none', background:'#f4f4f6' }} sandbox="allow-same-origin" />
              </div>
            </div>
          )
        })()}

      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
