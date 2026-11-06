import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'

const COLOR_PRESETS = ['#1a1a2e','#ffffff','#000000','#ef4444','#22c55e','#3b82f6',
  '#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#0ea5e9']

function ColorPicker({ value, onChange, label, noPresets }) {
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
        <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#000000"
          style={{ width:90, fontSize:12, padding:'5px 8px' }} />
      </div>
      {show && (
        <div className="gb-cpop" style={noPresets ? { display:'flex', flexDirection:'column', gap:6, padding:10 } : {}}>
          {!noPresets && COLOR_PRESETS.map(c => (
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

function ImageUpload({ label, url, onFile, onClear, accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" }) {
  const ref = useRef()
  return (
    <div>
      {label && <span className="gb-label">{label}</span>}
      <input type="file" ref={ref} accept={accept} style={{ display:'none' }}
        onChange={e => { const f=e.target.files[0]; if(f) onFile(f) }} />
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginTop:4 }}>
        <button className="gb-btn gb-btn-ghost gb-btn-sm" type="button" onClick={() => ref.current.click()}>📷 Upload</button>
        {url && <img src={url} className="gb-thumb" alt="" />}
        {url && <button className="gb-btn gb-btn-danger gb-btn-sm gb-btn-icon" type="button" onClick={onClear}>✕</button>}
      </div>
    </div>
  )
}

function SoundSelector({ label, value, onChange, sounds }) {
  return (
    <div className="gb-fg">
      <span className="gb-label">{label}</span>
      <select value={value||''} onChange={e => onChange(e.target.value)}>
        <option value="">— None —</option>
        {sounds.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>
  )
}

const LIGHT = `
.gb-wrap *,.gb-wrap *::before,.gb-wrap *::after{box-sizing:border-box}
.gb-wrap{--gb-bg:#f4f6fb;--gb-surface:#fff;--gb-surface2:#f0f2f8;--gb-border:#e2e6f0;--gb-border2:#cdd3e0;--gb-primary:#6366f1;--gb-primary-d:#4f46e5;--gb-primary-g:rgba(99,102,241,0.15);--gb-success:#16a34a;--gb-danger:#dc2626;--gb-text:#1e1e2e;--gb-text2:#64657a;--gb-text3:#9899ae;--gb-shadow:0 2px 12px rgba(0,0,0,0.08);--gb-shadow-md:0 4px 24px rgba(0,0,0,0.10);--gb-radius:12px;--gb-radius-sm:8px;font-family:'DM Sans',sans-serif;background:var(--gb-bg);color:var(--gb-text);min-height:100vh}
.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]),.gb-wrap select,.gb-wrap textarea{width:100%;font-family:inherit;font-size:14px;background:var(--gb-surface);border:none;border-bottom:1.5px solid var(--gb-border);border-radius:8px;color:var(--gb-text);padding:10px 12px 8px;outline:none;transition:border-color .18s}
.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]):focus,.gb-wrap select:focus,.gb-wrap textarea:focus{border-bottom-color:#22c55e;border-bottom-width:2px}
.gb-wrap select option{background:#fff;color:#1e1e2e}
.gb-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;font-size:13px;font-weight:600;border-radius:var(--gb-radius-sm);border:none;cursor:pointer;transition:all .15s;white-space:nowrap;font-family:inherit}
.gb-btn:disabled{opacity:.5;cursor:not-allowed}
.gb-btn-primary{background:var(--gb-primary);color:#fff}
.gb-btn-primary:not(:disabled):hover{background:var(--gb-primary-d);transform:translateY(-1px);box-shadow:0 4px 12px var(--gb-primary-g)}
.gb-btn-ghost{background:var(--gb-surface);color:var(--gb-text2);border:1.5px solid var(--gb-border)}
.gb-btn-ghost:not(:disabled):hover{border-color:var(--gb-primary);color:var(--gb-primary)}
.gb-btn-danger{background:#fee2e2;color:var(--gb-danger);border:1.5px solid #fecaca}
.gb-btn-danger:not(:disabled):hover{background:#fecaca}
.gb-btn-sm{padding:5px 10px;font-size:12px}
.gb-btn-icon{padding:6px;border-radius:6px}
.gb-card{background:var(--gb-surface);border:1.5px solid var(--gb-border);border-radius:var(--gb-radius);box-shadow:var(--gb-shadow)}
.gb-label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gb-text2);margin-bottom:4px;display:block}
.gb-section{background:var(--gb-surface2);border:1px solid var(--gb-border);border-radius:var(--gb-radius);padding:16px;margin-bottom:14px}
.gb-section-title{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--gb-primary);margin-bottom:12px;display:flex;align-items:center;gap:6px}
.gb-tabs{display:flex;border-bottom:2px solid var(--gb-border);margin-bottom:24px;gap:0;overflow-x:auto}
.gb-tab{padding:10px 18px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;color:var(--gb-text2);border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .15s;white-space:nowrap;font-family:inherit}
.gb-tab.active{color:#9210f6;border-bottom-color:#9210f6}
.gb-tab:hover:not(.active){color:var(--gb-text)}
@keyframes gb-slide-in{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
.gb-toast{position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 18px;border-radius:10px;color:#fff;font-weight:600;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.15);animation:gb-slide-in .22s ease;font-family:'DM Sans',sans-serif;max-width:320px}
.gb-row{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start}
.gb-fg{display:flex;flex-direction:column;gap:4px;flex:1;min-width:120px}
.gb-thumb{height:44px;width:auto;border-radius:6px;border:1px solid var(--gb-border);object-fit:contain;background:#f9f9f9}
.gb-swatch{width:28px;height:28px;border-radius:6px;border:2px solid var(--gb-border);cursor:pointer;flex-shrink:0}
.gb-cpop{position:absolute;top:calc(100% + 6px);left:0;z-index:300;background:var(--gb-surface);border:1.5px solid var(--gb-border);border-radius:10px;padding:12px;box-shadow:var(--gb-shadow-md);display:grid;grid-template-columns:repeat(7,1fr);gap:5px;width:220px}
.gb-scroll-y{overflow-y:auto}
.gb-sticky-bar{position:sticky;top:0;z-index:40;background:rgba(244,246,251,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--gb-border);padding:10px 0;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between}
.gb-empty{text-align:center;padding:56px 20px;color:var(--gb-text2)}
.gb-empty-icon{font-size:44px;margin-bottom:12px}
.gb-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700}
.gb-badge-purple{background:rgba(99,102,241,.12);color:var(--gb-primary)}
.gb-badge-green{background:rgba(22,163,74,.12);color:var(--gb-success)}
.gb-header{display:flex;align-items:center;gap:16px;padding:12px 24px;background:var(--gb-surface);border-bottom:1px solid var(--gb-border);position:sticky;top:0;z-index:10}
.gb-h-left{display:flex;align-items:center;gap:10px}
.gb-back-btn{width:30px;height:30px;border-radius:7px;border:1.5px solid var(--gb-border);background:var(--gb-surface);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--gb-text2);font-size:16px;flex-shrink:0}
.gb-title{font-size:15px;font-weight:700;margin:0;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}
.gb-name-input{font-size:15px;font-weight:700;padding:4px 8px;border:1.5px solid var(--gb-primary);border-radius:6px;outline:none;width:180px}
.gb-subtitle{font-size:11px;color:var(--gb-text3);margin-top:1px}
.gb-h-tabs{display:flex;gap:2px;flex:1;justify-content:center}
.gb-h-tabs .gb-tab{padding:6px 14px;font-size:12px;font-weight:600;border:none;background:transparent;color:var(--gb-text2);cursor:pointer;border-radius:6px;transition:all .15s;white-space:nowrap}
.gb-h-tabs .gb-tab.active{background:var(--gb-primary-g);color:var(--gb-primary)}
.gb-h-right{display:flex;align-items:center;gap:8px}
.gb-link-btn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:1.5px solid var(--gb-border);background:var(--gb-surface);cursor:pointer;text-decoration:none;font-size:16px}
.gb-body{display:flex;gap:24px;padding:24px;max-width:1400px;margin:0 auto}
.gb-main{flex:1;min-width:0}
.gb-phone-col{width:320px;flex-shrink:0}
.gb-phone{background:var(--gb-surface);border-radius:var(--gb-radius);box-shadow:var(--gb-shadow);overflow:hidden;position:sticky;top:80px}
.gb-field{display:flex;flex-direction:column;gap:4px;flex:1;min-width:120px}
.gb-field label{font-size:11px;font-weight:600;color:var(--gb-text2);text-transform:uppercase;letter-spacing:.04em}
.gb-input,.gb-select{padding:7px 10px;border:1.5px solid var(--gb-border);border-radius:6px;font-size:13px;outline:none;transition:border .15s;background:var(--gb-surface);color:var(--gb-text);width:100%}
.gb-input:focus{border-color:var(--gb-primary)}
.gb-color{height:36px;padding:2px 4px;cursor:pointer}
.gb-textarea{padding:7px 10px;border:1.5px solid var(--gb-border);border-radius:6px;font-size:13px;outline:none;width:100%;resize:vertical;font-family:inherit;background:var(--gb-surface);color:var(--gb-text)}
.gb-textarea:focus{border-color:var(--gb-primary)}
.gb-img-upload{display:flex;align-items:center;justify-content:center;width:100%;height:80px;border:2px dashed var(--gb-border);border-radius:8px;cursor:pointer;color:var(--gb-text3);font-size:12px;overflow:hidden}
.gb-img-upload img{max-width:100%;max-height:100%;object-fit:contain}
.gb-toast--success{background:var(--gb-success);color:#fff}
.gb-toast--error{background:var(--gb-danger);color:#fff}
@keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
`

export default function TetrisBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [tab, setTab] = useState('gameplay')
  const [toast, setToast] = useState(null)
  const [settings, setSettings] = useState({})
  const [slugInput, setSlugInput] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [sounds, setSounds] = useState([])
  const [saving, setSaving] = useState(false)
  const [soundUploading, setSoundUploading] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState('')

  const soundUploadRef = useRef()
  const bgImgRef = useRef()
  const tyBgImgRef = useRef()
  const gameLogoRef = useRef()
  const gifRef = useRef()

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = useCallback(() => {
    setLoading(true); setFetchError(null)
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/tetris/${id}/settings`),
      api.get(`/sounds/games/${id}/sounds`)
    ]).then(([gRes, sRes, soundRes]) => {
      const g = gRes.data.game
      setGame(g)
      setSettings(sRes.data.settings || {})
      setSounds(soundRes.data.sounds || [])
      setRedirectUrl(g.redirect_url || '')
      setSlugInput(g.slug || '')
    }).catch(err => {
      setFetchError(err.response?.data?.message || err.message || 'Failed to load')
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const s = (key, fallback = '') => settings[key] !== undefined && settings[key] !== null ? settings[key] : fallback

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }))

  const saveSettings = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      const fields = ['grid_width','grid_height','block_colors','level_speed_mult','starting_level',
        'heading_1','heading_2','heading_3','description_text',
        'heading_1_color','heading_2_color','heading_3_color','description_color',
        'bg_color','primary_color','font_family','show_timer','time_limit_seconds',
        'sound_rotate_id','sound_clear_id','sound_drop_id','sound_gameover_id',
        'intro_text','intro_text_color','outro_text','outro_text_color',
        'submit_button_text','continue_button_text','start_button_text',
        'terms_enabled','terms_text','terms_url','meta_description',
        'thankyou_subtitle','thankyou_subtitle_color',
        'submit_button_text_color','submit_button_bg_color',
        'continue_button_text_color','continue_button_bg_color',
        'start_button_text_color','start_button_bg_color']
      for (const f of fields) fd.append(f, settings[f] ?? '')
      if (settings._bgFile) fd.append('bg_image', settings._bgFile)
      else fd.append('bg_image_url', settings.bg_image_url || '')
      if (settings._tyBgFile) fd.append('thankyou_bg_image', settings._tyBgFile)
      else fd.append('thankyou_bg_image_url', settings.thankyou_bg_image_url || '')
      if (settings._logoFile) fd.append('game_logo', settings._logoFile)
      else fd.append('game_logo_url', settings.game_logo_url || '')
      if (settings._gifFile) fd.append('submit_confirm_gif', settings._gifFile)
      else fd.append('submit_confirm_gif_url', settings.submit_confirm_gif_url || '')
      await api.put(`/tetris/${id}/settings`, fd)
      await api.put(`/games/${id}`, { redirect_url: redirectUrl, slug: slugInput.trim() || undefined })
      showToast('Settings saved')
    } catch (err) {
      showToast('Error: ' + (err.response?.data?.message || err.message), 'error')
    }
    setSaving(false)
  }

  const TABS = [
    { id: 'gameplay', label: '🧱 Gameplay' },
    { id: 'visuals', label: '🎨 Visuals' },
    { id: 'thankyou', label: '✅ Thankyou' },
    { id: 'sounds', label: '🔊 Audio' },
    { id: 'settings', label: '⚙️ Settings' },
  ]

  const handleImgUpload = (field, ref) => {
    const file = ref.current?.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      set(field, url)
      set(field.replace('_url', '_file'), file)
    }
  }

  const renderGameplay = () => (
    <>
      <div className="gb-section">
        <div className="gb-section-title">🎮 Board</div>
        <div className="gb-row">
          <div className="gb-field"><label>Grid Width</label><input type="number" value={s('grid_width', 10)} onChange={e => set('grid_width', e.target.value)} /></div>
          <div className="gb-field"><label>Grid Height</label><input type="number" value={s('grid_height', 20)} onChange={e => set('grid_height', e.target.value)} /></div>
          <div className="gb-field"><label>Starting Level</label><input type="number" value={s('starting_level', 1)} onChange={e => set('starting_level', e.target.value)} /></div>
          <div className="gb-field"><label>Level Speed Multiplier</label><input type="number" step="0.01" value={s('level_speed_mult', 0.85)} onChange={e => set('level_speed_mult', e.target.value)} /></div>
        </div>
      </div>
      <div className="gb-section">
        <div className="gb-section-title">🎨 Block Colors (JSON)</div>
        <textarea className="gb-textarea" rows={4} value={s('block_colors', '{"I":"#00f0f0","O":"#f0f000","T":"#a000f0","S":"#00f000","Z":"#f00000","J":"#0000f0","L":"#f0a000"}')} onChange={e => set('block_colors', e.target.value)} />
      </div>
      <div className="gb-section">
        <div className="gb-section-title">📝 Headings</div>
        <div className="gb-row">
          <div className="gb-field"><label>Heading 1</label><input value={s('heading_1')} onChange={e => set('heading_1', e.target.value)} /></div>
          <div className="gb-field"><label>Heading 2</label><input value={s('heading_2')} onChange={e => set('heading_2', e.target.value)} /></div>
          <div className="gb-field"><label>Heading 3</label><input value={s('heading_3')} onChange={e => set('heading_3', e.target.value)} /></div>
        </div>
        <div className="gb-field" style={{ marginTop: 8 }}><label>Description</label><textarea className="gb-textarea" rows={2} value={s('description_text')} onChange={e => set('description_text', e.target.value)} /></div>
        <div className="gb-row" style={{ marginTop: 8 }}>
          <ColorPicker value={s('heading_1_color', '#1a1a2e')} onChange={v => set('heading_1_color', v)} label="H1 Color" />
          <ColorPicker value={s('heading_2_color', '#666666')} onChange={v => set('heading_2_color', v)} label="H2 Color" />
          <ColorPicker value={s('heading_3_color', '#777777')} onChange={v => set('heading_3_color', v)} label="H3 Color" />
        </div>
      </div>
      <div className="gb-section">
        <div className="gb-section-title">🚀 Intro Screen</div>
        <div className="gb-row">
          <div className="gb-fg" style={{ flex: 2 }}>
            <span className="gb-label">Intro Text</span>
            <textarea rows={2} value={s('intro_text')} onChange={e => set('intro_text', e.target.value)} />
          </div>
          <ColorPicker value={s('intro_text_color', '#ffffff')} onChange={v => set('intro_text_color', v)} label="Intro Text Color" />
        </div>
        <div className="gb-row" style={{ marginTop: 8 }}>
          <div className="gb-field"><label>Start Button Text</label><input value={s('start_button_text', 'Start Game')} onChange={e => set('start_button_text', e.target.value)} /></div>
          <ColorPicker value={s('start_button_bg_color', '#6366f1')} onChange={v => set('start_button_bg_color', v)} label="Button BG" />
          <ColorPicker value={s('start_button_text_color', '#ffffff')} onChange={v => set('start_button_text_color', v)} label="Button Text" />
        </div>
      </div>
    </>
  )

  const renderVisuals = () => (
    <>
      <div className="gb-section">
        <div className="gb-section-title">🎨 Colors &amp; Font</div>
        <div className="gb-row">
          <ColorPicker value={s('bg_color', '#1a1a2e')} onChange={v => set('bg_color', v)} label="Background Color" />
          <ColorPicker value={s('primary_color', '#00f0f0')} onChange={v => set('primary_color', v)} label="Primary Color" />
        </div>
        <div className="gb-field" style={{ marginTop: 8 }}><label>Font Family</label><input value={s('font_family', 'DM Sans')} onChange={e => set('font_family', e.target.value)} /></div>
      </div>
      <div className="gb-section">
        <div className="gb-section-title">🖼️ Images</div>
        <ImageUpload label="Background Image" url={settings.bg_image_url} onFile={f => handleImgUpload('bg_image_url', bgImgRef)} onClear={() => set('bg_image_url', '')} />
        <input ref={bgImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={() => handleImgUpload('bg_image_url', bgImgRef)} />
        <div style={{ marginTop: 8 }}><ImageUpload label="Game Logo" url={settings.game_logo_url} onFile={f => handleImgUpload('game_logo_url', gameLogoRef)} onClear={() => set('game_logo_url', '')} /></div>
        <input ref={gameLogoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={() => handleImgUpload('game_logo_url', gameLogoRef)} />
      </div>
      <div className="gb-section">
        <div className="gb-section-title">⏱️ Timer</div>
        <div className="gb-row">
          <div className="gb-field"><label>Show Timer</label><select value={s('show_timer', 1)} onChange={e => set('show_timer', e.target.value)}><option value={1}>Yes</option><option value={0}>No</option></select></div>
          <div className="gb-field"><label>Time Limit (seconds, 0 = none)</label><input type="number" value={s('time_limit_seconds', 0)} onChange={e => set('time_limit_seconds', e.target.value)} /></div>
        </div>
      </div>
    </>
  )

  const renderThankyou = () => (
    <>
      <div className="gb-section">
        <div className="gb-section-title">🎉 Thankyou Page</div>
        <div className="gb-row">
          <div className="gb-fg" style={{ flex: 2 }}>
            <span className="gb-label">Outro Text</span>
            <textarea rows={2} value={s('outro_text')} onChange={e => set('outro_text', e.target.value)} />
          </div>
          <ColorPicker value={s('outro_text_color', '#ffffff')} onChange={v => set('outro_text_color', v)} label="Outro Color" />
        </div>
        <div className="gb-row" style={{ marginTop: 8 }}>
          <div className="gb-field"><label>Thankyou Subtitle</label><input value={s('thankyou_subtitle')} onChange={e => set('thankyou_subtitle', e.target.value)} /></div>
          <ColorPicker value={s('thankyou_subtitle_color', '#888888')} onChange={v => set('thankyou_subtitle_color', v)} label="Subtitle Color" />
        </div>
      </div>
      <div className="gb-section">
        <div className="gb-section-title">🖼️ Thankyou Images</div>
        <ImageUpload label="Thankyou Background" url={settings.thankyou_bg_image_url} onFile={f => handleImgUpload('thankyou_bg_image_url', tyBgImgRef)} onClear={() => set('thankyou_bg_image_url', '')} />
        <input ref={tyBgImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={() => handleImgUpload('thankyou_bg_image_url', tyBgImgRef)} />
        <div style={{ marginTop: 8 }}><ImageUpload label="Confirmation GIF" url={settings.submit_confirm_gif_url} onFile={f => handleImgUpload('submit_confirm_gif_url', gifRef)} onClear={() => set('submit_confirm_gif_url', '')} /></div>
        <input ref={gifRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={() => handleImgUpload('submit_confirm_gif_url', gifRef)} />
      </div>
      <div className="gb-section">
        <div className="gb-section-title">🔘 Buttons</div>
        <div className="gb-row">
          <div className="gb-field"><label>Submit Button Text</label><input value={s('submit_button_text', 'Submit')} onChange={e => set('submit_button_text', e.target.value)} /></div>
          <div className="gb-field"><label>Continue Button Text</label><input value={s('continue_button_text', 'Continue →')} onChange={e => set('continue_button_text', e.target.value)} /></div>
        </div>
      </div>
    </>
  )

  const renderSounds = () => (
    <div className="gb-section">
      <div className="gb-section-title">🔊 Sound Effects</div>
      <div className="gb-row">
        <SoundSelector label="Rotate Sound" value={s('sound_rotate_id')} onChange={v => set('sound_rotate_id', v)} sounds={sounds} />
        <SoundSelector label="Clear Sound" value={s('sound_clear_id')} onChange={v => set('sound_clear_id', v)} sounds={sounds} />
        <SoundSelector label="Drop Sound" value={s('sound_drop_id')} onChange={v => set('sound_drop_id', v)} sounds={sounds} />
        <SoundSelector label="Game Over Sound" value={s('sound_gameover_id')} onChange={v => set('sound_gameover_id', v)} sounds={sounds} />
      </div>
      <div style={{ marginTop: 12 }}>
        {soundUploading ? <span style={{ color: 'var(--gb-text2)', fontSize: 13 }}>Uploading...</span> : (
          <button className="gb-btn gb-btn-ghost" onClick={() => soundUploadRef.current?.click()}>+ Upload Sound</button>
        )}
        <input ref={soundUploadRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={async e => {
          const file = e.target.files?.[0]
          if (!file) return
          setSoundUploading(true)
          try {
            const fd = new FormData()
            fd.append('sound', file)
            fd.append('game_id', id)
            const res = await api.post('/sounds/upload', fd)
            setSounds(prev => [...prev, res.data.sound])
            showToast('Sound uploaded')
          } catch { showToast('Upload failed', 'error') }
          setSoundUploading(false)
        }} />
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="gb-section">
      <div className="gb-section-title">⚙️ Game Settings</div>
      <div className="gb-row">
        <div className="gb-field"><label>Slug</label><input value={slugInput} onChange={e => setSlugInput(e.target.value)} /></div>
        <div className="gb-field"><label>Redirect URL</label><input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} /></div>
      </div>
      <div className="gb-row" style={{ marginTop: 8 }}>
        <div className="gb-field"><label>Terms Enabled</label><select value={s('terms_enabled', 0)} onChange={e => set('terms_enabled', e.target.value)}><option value={1}>Yes</option><option value={0}>No</option></select></div>
        <div className="gb-field"><label>Terms Text</label><input value={s('terms_text')} onChange={e => set('terms_text', e.target.value)} /></div>
        <div className="gb-field"><label>Terms URL</label><input value={s('terms_url')} onChange={e => set('terms_url', e.target.value)} /></div>
      </div>
      <div className="gb-field" style={{ marginTop: 8 }}><label>Meta Description</label><textarea className="gb-textarea" rows={2} value={s('meta_description')} onChange={e => set('meta_description', e.target.value)} /></div>
    </div>
  )

  if (loading) return (
    <div className="gb-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign: 'center', color: 'var(--gb-text2)' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e6f0', borderTopColor: '#6366f1', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
        Loading Tetris builder...
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (fetchError) return (
    <div className="gb-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ color: 'var(--gb-danger)', marginBottom: 8 }}>Failed to load</h2>
        <p style={{ color: 'var(--gb-text2)', marginBottom: 20 }}>{fetchError}</p>
        <button className="gb-btn gb-btn-primary" onClick={loadData}>Retry</button>
        <button className="gb-btn gb-btn-ghost" onClick={() => navigate('/dashboard/games')} style={{ marginLeft: 8 }}>Back</button>
      </div>
    </div>
  )

  const previewUrl = game?.slug ? `/play/${game.slug}/${game.client_slug || 'demo'}` : '#'

  return (
    <div className="gb-wrap">
      <style>{LIGHT}</style>
      {toast && <div className={`gb-toast gb-toast--${toast.type}`}>{toast.msg}</div>}

      <div className="gb-header">
        <div className="gb-h-left">
          <button onClick={() => navigate('/dashboard/games')} className="gb-back-btn">←</button>
          <div>
            {editingName ? (
              <input className="gb-name-input" value={nameInput} onChange={e => setNameInput(e.target.value)}
                onBlur={() => { setEditingName(false); if (nameInput.trim()) { setGame(prev => ({ ...prev, name: nameInput.trim() })); api.put(`/games/${id}`, { name: nameInput.trim() }).catch(() => {}) } }}
                onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }} autoFocus />
            ) : (
              <h1 className="gb-title" onClick={() => { setNameInput(game?.name || ''); setEditingName(true) }}>{game?.name || 'Tetris Game'}</h1>
            )}
            <div className="gb-subtitle">🧱 Tetris</div>
          </div>
        </div>
        <div className="gb-h-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`gb-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <div className="gb-h-right">
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="gb-link-btn" title="Preview game">👁</a>
          <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>

      <div className="gb-body">
        <div className="gb-main">
          {tab === 'gameplay' && renderGameplay()}
          {tab === 'visuals' && renderVisuals()}
          {tab === 'thankyou' && renderThankyou()}
          {tab === 'sounds' && renderSounds()}
          {tab === 'settings' && renderSettings()}
        </div>

        <div className="gb-phone-col">
          <div className="gb-phone">
            <div style={{ padding: 16, textAlign: 'center' }}>
              {s('game_logo_url') && <img src={settings.game_logo_url} alt="" style={{ maxWidth: 120, maxHeight: 60, marginBottom: 8 }} />}
              {s('heading_1') && <div style={{ fontSize: 20, fontWeight: 800, color: s('heading_1_color', '#1a1a2e') }}>{s('heading_1')}</div>}
              {s('heading_2') && <div style={{ fontSize: 14, color: s('heading_2_color', '#666'), marginTop: 4 }}>{s('heading_2')}</div>}
              {s('heading_3') && <div style={{ fontSize: 12, color: s('heading_3_color', '#777'), marginTop: 2 }}>{s('heading_3')}</div>}
              {s('description_text') && <div style={{ fontSize: 11, color: s('description_color', '#888'), marginTop: 6 }}>{s('description_text')}</div>}
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: `repeat(${Math.min(Number(s('grid_width', 10)), 10)}, 1fr)`, gap: 1, background: '#222', padding: 4, borderRadius: 4, width: 'fit-content', margin: '16px auto 0' }}>
                {Array.from({ length: 4 }).map((_, ri) => (
                  Array.from({ length: Math.min(Number(s('grid_width', 10)), 10) }).map((_, ci) => (
                    <div key={`${ri}-${ci}`} style={{ width: 14, height: 14, background: ri === 0 ? '#00f0f0' : '#1a1a2e', borderRadius: 2 }} />
                  ))
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>Tetris Preview</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
