import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'

/* ─────────────────────────────────────────────
   LIGHT THEME TOKENS
───────────────────────────────────────────── */
const LIGHT = `
.cb-wrap {
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
.cb-wrap *,
.cb-wrap *::before,
.cb-wrap *::after { box-sizing: border-box; }
.cb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]),
.cb-wrap select,
.cb-wrap textarea {
  width: 100%;
  font-family: inherit;
  font-size: 14px;
  background: transparent;
  border: none;
  border-bottom: 1.5px solid var(--gb-border);
  border-radius: 6px 6px 4px 4px;
  color: var(--gb-text);
  padding: 8px 10px 6px;
  outline: none;
  transition: border-color .18s;
}
.cb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]):focus,
.cb-wrap select:focus,
.cb-wrap textarea:focus {
  border-bottom-color: #22c55e;
  box-shadow: none;
}
.cb-wrap select option { background: #fff; color: #1e1e2e; }
.cb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; font-size: 13px; font-weight: 600;
  border-radius: var(--gb-radius-sm); border: none; cursor: pointer;
  transition: all .15s; white-space: nowrap; font-family: inherit;
}
.cb-btn:disabled { opacity: .5; cursor: not-allowed; }
.cb-btn-primary { background: var(--gb-primary); color: #fff; }
.cb-btn-primary:not(:disabled):hover { background: var(--gb-primary-d); transform: translateY(-1px); box-shadow: 0 4px 12px var(--gb-primary-g); }
.cb-btn-ghost { background: var(--gb-surface); color: var(--gb-text2); border: 1.5px solid var(--gb-border); }
.cb-btn-ghost:not(:disabled):hover { border-color: var(--gb-primary); color: var(--gb-primary); }
.cb-btn-danger { background: #fee2e2; color: var(--gb-danger); border: 1.5px solid #fecaca; }
.cb-btn-danger:not(:disabled):hover { background: #fecaca; }
.cb-btn-success { background: #dcfce7; color: var(--gb-success); border: 1.5px solid #bbf7d0; }
.cb-btn-success:not(:disabled):hover { background: #bbf7d0; }
.cb-btn-sm { padding: 5px 10px; font-size: 12px; }
.cb-btn-icon { padding: 6px; border-radius: 6px; }
.cb-card {
  background: var(--gb-surface);
  border: 1.5px solid var(--gb-border);
  border-radius: var(--gb-radius);
  box-shadow: var(--gb-shadow);
  transition: all .2s ease;
}
.cb-card:hover { box-shadow: var(--gb-shadow-md); border-color: var(--gb-border2); }
.cb-card:has(.gb-section-title):hover .gb-section-title { color: var(--gb-primary-d); }
.cb-hover-lift { transition: all .15s ease; }
.cb-hover-lift:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.cb-font-opt { transition: all .15s ease; }
.cb-font-opt:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.1); }
@keyframes gb-fade-in-up { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
.gb-section-title { animation: gb-fade-in-up .25s ease both; }
@keyframes gb-pulse { 0%{box-shadow:0 0 0 0 rgba(99,102,241,0.4)} 70%{box-shadow:0 0 0 8px rgba(99,102,241,0)} 100%{box-shadow:0 0 0 0 rgba(99,102,241,0)} }
.cb-btn-primary:not(:disabled):active { animation: gb-pulse .25s ease; }
.gb-tab { position: relative; }
.gb-tab::after {
  content: ''; position: absolute; bottom: -2px; left: 50%; width: 0; height: 2px;
  background: var(--gb-primary); transition: all .2s ease; border-radius: 2px;
}
.gb-tab.active::after { left: 4px; width: calc(100% - 8px); }
.gb-tab:hover:not(.active)::after { left: 8px; width: calc(100% - 16px); background: var(--gb-border2); }
.gb-empty-icon { transition: transform .2s ease; display: inline-block; }
.gb-empty:hover .gb-empty-icon { transform: scale(1.1) rotate(-3deg); }
.gb-label {
  font-size: 11px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: var(--gb-text2); margin-bottom: 4px;
  display: block;
}
.gb-section {
  background: var(--gb-surface2);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius);
  padding: 14px;
  margin-bottom: 10px;
}
.gb-section-title {
  font-size: 12px; font-weight: 700; letter-spacing: .05em;
  text-transform: uppercase; color: var(--gb-primary);
  margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
}
.gb-tabs {
  display: flex; border-bottom: 2px solid var(--gb-border);
  margin-bottom: 24px; gap: 0; overflow-x: auto;
}
.gb-tab {
  padding: 10px 18px; font-size: 13px; font-weight: 600;
  border: none; background: none; cursor: pointer;
  color: var(--gb-text2); border-bottom: 2px solid transparent;
  margin-bottom: -2px; transition: color .15s; white-space: nowrap;
  font-family: inherit;
}
.gb-tab.active { color: var(--gb-primary); border-bottom-color: var(--gb-primary); }
.gb-tab:hover:not(.active) { color: var(--gb-text); }
@keyframes gb-slide-in { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:none } }
.gb-toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 9999;
  padding: 12px 18px; border-radius: 10px; color: #fff; font-weight: 600;
  font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,.15);
  animation: gb-slide-in .22s ease; font-family: 'DM Sans',sans-serif;
  max-width: 320px;
}
.gb-swatch {
  width: 28px; height: 28px; border-radius: 6px;
  border: 2px solid var(--gb-border); cursor: pointer; flex-shrink: 0;
}
.gb-thumb {
  height: 72px; width: auto; border-radius: 8px;
  border: 1px solid var(--gb-border); object-fit: contain; background: #f9f9f9;
}
.gb-empty { text-align: center; padding: 56px 20px; color: var(--gb-text2); }
.gb-empty-icon { font-size: 44px; margin-bottom: 12px; }
.gb-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
.gb-col { flex: 1; min-width: 140px; }
.gb-sticky-bar {
  position: sticky; top: 0; z-index: 40;
  background: rgba(244,246,251,.85); backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--gb-border);
  padding: 12px 0; margin-bottom: 16px;
  display: flex; align-items: center; justify-content: space-between;
  animation: gb-fade-in-up .25s ease;
}
.gb-phone {
  width: 220px; min-height: 380px; border-radius: 28px;
  border: 3px solid #d1d5db; background: #f9f9fb;
  overflow: hidden; position: relative; box-shadow: 0 8px 32px rgba(0,0,0,.12);
}
.gb-cpop {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 300;
  background: var(--gb-surface); border: 1.5px solid var(--gb-border);
  border-radius: 10px; padding: 12px; box-shadow: var(--gb-shadow-md);
  display: grid; grid-template-columns: repeat(7,1fr); gap: 5px; width: 220px;
}
.gb-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700;
}
.gb-badge-purple { background: rgba(99,102,241,.12); color: var(--gb-primary); }
.gb-badge-green  { background: rgba(22,163,74,.12);  color: var(--gb-success); }
.gb-badge-gray   { background: #f0f2f8; color: var(--gb-text2); }
.gb-fg { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 120px; }
.gb-scroll-y { overflow-y: auto; }
`

const FONT_CATEGORIES = [
  {
    name:'Handwriting', icon:'✍️',
    fonts:['Dancing Script','Pacifico','Caveat','Shadows Into Light','Satisfy','Kalam','Patrick Hand','Permanent Marker','Indie Flower','Gloria Hallelujah','Bad Script','Reenie Beanie']
  },
  {
    name:'Professional', icon:'💼',
    fonts:['DM Sans','Inter','Poppins','Raleway','Nunito','Lato','Montserrat','Source Sans 3','Work Sans','Rubik','Roboto','Open Sans']
  },
  {
    name:'Luxury', icon:'👑',
    fonts:['Playfair Display','Cormorant Garamond','Cinzel','Bodoni Moda','Prata','Taviraj','Libre Baskerville','Old Standard TT','Abril Fatface','Forum','Goudy Bookletter 1911','Marcellus']
  },
  {
    name:'Playful', icon:'🎮',
    fonts:['Quicksand','Josefin Sans','Exo 2','Cabin','Ubuntu','Comfortaa','Bubblegum Sans','Fredoka One','Baloo 2','Righteous','Fugaz One','Lilita One']
  },
]

const COLOR_PRESETS = ['#1a1a2e','#ffffff','#000000','#ef4444','#22c55e','#3b82f6',
  '#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#0ea5e9']

/* ─────────── Toast ─────────── */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [])
  return (
    <div className="gb-toast" style={{ background: type === 'success' ? '#16a34a' : '#dc2626' }}>
      {type === 'success' ? '✅' : '❌'} {msg}
    </div>
  )
}

/* ─────────── ColorPicker ─────────── */
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
        <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#000000"
          style={{ width:90, fontSize:12, padding:'5px 8px' }} />
      </div>
      {show && (
        <div className="gb-cpop">
          {COLOR_PRESETS.map(c => (
            <div key={c} onClick={() => { onChange(c); setShow(false) }}
              style={{ width:22, height:22, background:c, borderRadius:4, cursor:'pointer',
                border: value===c ? '2px solid #6366f1' : '1px solid #e2e6f0' }} />
          ))}
          <input type="color" value={value||'#000000'} onChange={e => onChange(e.target.value)}
            style={{ gridColumn:'span 7', width:'100%', height:28, padding:0, border:'none', background:'none', cursor:'pointer' }} />
          <button className="cb-btn cb-btn-ghost cb-btn-sm" style={{ gridColumn:'span 7', width:'100%' }} onClick={() => setShow(false)}>Close</button>
        </div>
      )}
    </div>
  )
}

/* ─────────── ImageUpload ─────────── */
function ImageUpload({ label, url, onFile, onClear, accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" }) {
  const ref = useRef()
  return (
    <div>
      {label && <span className="gb-label">{label}</span>}
      <input type="file" ref={ref} accept={accept} style={{ display:'none' }}
        onChange={e => { const f=e.target.files[0]; if(f) onFile(f) }} />
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginTop:4 }}>
        <button className="cb-btn cb-btn-ghost cb-btn-sm" type="button" onClick={() => ref.current.click()}>📷 Upload</button>
        {url && <img src={url} className="gb-thumb" alt="" />}
        {url && <button className="cb-btn cb-btn-danger cb-btn-sm cb-btn-icon" type="button" onClick={onClear}>✕</button>}
      </div>
    </div>
  )
}

/* ─────────── SoundSelector ─────────── */
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

/* ─────────── GridPreview ─────────── */
function GridPreview({ words, rows, cols, blankCellImageUrl }) {
  const cellSize = Math.min(32, Math.floor(520 / Math.max(cols, 1)))
  const grid = {}
  const numberMap = {}
  let num = 1
  const sorted = [...words].sort((a, b) => a.word_order - b.word_order)
  for (const w of sorted) {
    if (!w.word_text) continue
    numberMap[`${w.start_row},${w.start_col}`] = numberMap[`${w.start_row},${w.start_col}`] || num++
    for (let i = 0; i < w.word_text.length; i++) {
      const r = w.direction === 'down'   ? w.start_row + i : w.start_row
      const c = w.direction === 'across' ? w.start_col + i : w.start_col
      grid[`${r},${c}`] = w.word_text[i]
    }
  }
  return (
    <div style={{ overflowX:'auto', marginTop:12, display:'flex', justifyContent:'center' }}>
      <div style={{ display:'inline-grid', gridTemplateColumns:`repeat(${cols}, ${cellSize}px)`, gap:1, background:'var(--gb-border)', border:'1px solid var(--gb-border)', borderRadius:4 }}>
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const key = `${r},${c}`
            const letter = grid[key]
            const n = numberMap[key]
            return (
              <div key={key} style={{
                width: cellSize, height: cellSize,
                background: letter
                  ? 'var(--gb-surface)'
                  : blankCellImageUrl
                    ? `white url("${blankCellImageUrl}") center / contain no-repeat`
                    : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: cellSize * 0.4, fontWeight: 700, color: 'var(--gb-text)', position: 'relative'
              }}>
                {n && <span style={{ position:'absolute', top:1, left:2, fontSize: cellSize * 0.25, color: 'var(--gb-text2)', lineHeight:1 }}>{n}</span>}
                {letter}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ─────────── WordCard ─────────── */
function WordCard({ word, index, sounds, onUpdate, onDelete, onSave, saving, open, onToggle }) {
  const [localWord, setLocalWord] = useState(word)
  useEffect(() => { setLocalWord(word) }, [word])
  const set = (k, v) => {
    const updated = { ...localWord, [k]: v }
    setLocalWord(updated)
    onUpdate(updated)
  }

  return (
    <div style={{ border:'1.5px solid var(--gb-border)', borderRadius:10, marginBottom:10, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--gb-surface2)', cursor:'pointer' }} onClick={() => onToggle(word.id)}>
        <span style={{ fontWeight:700, fontSize:13, minWidth:24, color:'var(--gb-primary)' }}>#{index+1}</span>
        <span style={{ fontWeight:700, fontSize:14, letterSpacing:1, flex:1 }}>{localWord.word_text || '—'}</span>
        <span style={{ fontSize:12, color:'var(--gb-text2)', background:'var(--gb-bg)', borderRadius:4, padding:'2px 8px' }}>{localWord.direction}</span>
        <span style={{ fontSize:12, color:'var(--gb-text2)' }}>R{localWord.start_row} C{localWord.start_col}</span>
        <span style={{ fontSize:16 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <div className="gb-fg" style={{ flex:2, minWidth:140 }}>
              <span className="gb-label">Word *</span>
              <input value={localWord.word_text || ''} onChange={e => set('word_text', e.target.value.toUpperCase())}
                placeholder="EXAMPLE" style={{ fontFamily:'monospace', letterSpacing:2 }} />
            </div>
            <div className="gb-fg" style={{ flex:1, minWidth:100 }}>
              <span className="gb-label">Direction</span>
              <select value={localWord.direction || 'across'} onChange={e => set('direction', e.target.value)}>
                <option value="across">→ Across</option>
                <option value="down">↓ Down</option>
              </select>
            </div>
            <div className="gb-fg" style={{ flex:1, minWidth:80 }}>
              <span className="gb-label">Start Row</span>
              <input type="number" min="0" value={localWord.start_row ?? 0} onChange={e => set('start_row', +e.target.value)} />
            </div>
            <div className="gb-fg" style={{ flex:1, minWidth:80 }}>
              <span className="gb-label">Start Col</span>
              <input type="number" min="0" value={localWord.start_col ?? 0} onChange={e => set('start_col', +e.target.value)} />
            </div>
          </div>
          <div className="gb-fg">
            <span className="gb-label">Clue</span>
            <input value={localWord.clue_text || ''} onChange={e => set('clue_text', e.target.value)} placeholder="Clue shown to the player" />
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <SoundSelector label="Correct Sound" value={localWord.sound_correct_id} onChange={v => set('sound_correct_id', v)} sounds={sounds} />
            <SoundSelector label="Wrong Sound"   value={localWord.sound_wrong_id}   onChange={v => set('sound_wrong_id',   v)} sounds={sounds} />
          </div>
          <div>
            <span className="gb-label">Overlay Image (shown on correct answer)</span>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
              <input type="file" accept="image/*" style={{ display:'none' }}
                id={`overlay-file-${word.id}`}
                onChange={e => { const f=e.target.files[0]; if(f){ set('_overlayFile',f); set('_overlayPreview',URL.createObjectURL(f)) }}} />
              <button className="cb-btn cb-btn-ghost cb-btn-sm" type="button" onClick={() => document.getElementById(`overlay-file-${word.id}`).click()}>📷 Upload</button>
              {(localWord._overlayPreview || localWord.overlay_image_url) && (
                <div style={{ position:'relative', display:'inline-flex' }}>
                  <img src={localWord._overlayPreview || localWord.overlay_image_url} alt="" style={{ height:60, borderRadius:8, objectFit:'contain', border:'1px solid var(--gb-border)', background:'#f9f9f9' }} />
                  <button className="cb-btn cb-btn-danger cb-btn-sm cb-btn-icon" type="button" onClick={() => { set('overlay_image_url',''); set('_overlayFile',null); set('_overlayPreview',null) }}
                    style={{ position:'absolute', top:-6, right:-6, width:18, height:18, fontSize:9, padding:0, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%' }}>✕</button>
                </div>
              )}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="cb-btn cb-btn-danger cb-btn-sm" onClick={() => onDelete(word)}>🗑 Delete</button>
            <button className="cb-btn cb-btn-primary cb-btn-sm" disabled={saving} onClick={() => { onUpdate(localWord); onSave(localWord) }}>
              {saving ? 'Saving…' : '💾 Save Word'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function CrosswordBuilderPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [game,          setGame]          = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [fetchError,    setFetchError]    = useState(null)
  const [tab,           setTab]           = useState('display')
  const [toast,         setToast]         = useState(null)
  const [words,         setWords]         = useState([])
  const [formFields,    setFormFields]    = useState([])
  const [emailTemplate, setEmailTemplate] = useState({})
  const [emailPreview,  setEmailPreview]  = useState(null)
  const [settings,      setSettings]      = useState({})
  const [sounds,        setSounds]        = useState([])
  const [saving,        setSaving]        = useState(false)
  const [soundUploading,setSoundUploading]= useState(false)
  const [redirectUrl,   setRedirectUrl]   = useState('')
  const [savingRedirect,setSavingRedirect]= useState(false)
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')
  const [gameSlug, setGameSlug] = useState('')
  const [heading1Color, setHeading1Color] = useState('#1a1a2e')
  const [heading2Color, setHeading2Color] = useState('#666666')
  const [heading3Color, setHeading3Color] = useState('#777777')
  const [descColor, setDescColor] = useState('#888888')
  const [savingWord, setSavingWord] = useState(null)
  const [openWordId, setOpenWordId] = useState(null)
  const dirtyRef = useRef(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [newWord, setNewWord] = useState({
    word_text: '', clue_text: '', direction: 'across', start_row: 0, start_col: 0,
    sound_correct_id: '', sound_wrong_id: '', overlay_image_url: '', _overlayFile: null, _overlayPreview: null
  })
  const snapRef = useRef({})

  const soundUploadRef = useRef()
  const bgImgRef       = useRef()
  const tyBgImgRef     = useRef()
  const gameLogoRef    = useRef()

  const showToast = (msg, type='success') => setToast({ msg, type })

  const loadGame = useCallback(() => {
    setLoading(true); setFetchError(null)
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/crossword/games/${id}/words`),
      api.get(`/crossword/${id}/settings`),
      api.get('/sounds')
    ]).then(([gRes, wRes, sRes, soundRes]) => {
      const g = gRes.data.game
      setGame(g)
      setWords(wRes.data.words || [])
      setSettings(sRes.data.settings || {})
      setSounds(soundRes.data.sounds || [])
      setFormFields(g.formFields||[])
      setEmailTemplate(g.emailTemplate||{})
      setRedirectUrl(g.redirect_url||'')
      setText1(g.text1||'')
      setText2(g.text2||'')
      setGameSlug(g.slug||'')
      const s = sRes.data.settings || {}
      setHeading1Color(s.heading_1_color||'#1a1a2e')
      setHeading2Color(s.heading_2_color||'#666666')
      setHeading3Color(s.heading_3_color||'#777777')
      setDescColor(s.description_color||'#888888')
      snapRef.current = { text1:g.text1||'', text2:g.text2||'', slug:g.slug||'', settings:JSON.parse(JSON.stringify(s)), formFields:JSON.parse(JSON.stringify(g.formFields||[])), emailTemplate:JSON.parse(JSON.stringify(g.emailTemplate||{})) }
    }).catch(err => {
      setFetchError(err.response?.data?.message || err.message || 'Failed to load crossword data')
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadGame() }, [loadGame])

  /* ─── Words ─── */
  const openAddModal = () => {
    setNewWord({
      word_text: '', clue_text: '', direction: 'across',
      start_row: words.length > 0 ? Math.max(...words.map(w => w.start_row)) + 2 : 0,
      start_col: 0, sound_correct_id: '', sound_wrong_id: '',
      overlay_image_url: '', _overlayFile: null, _overlayPreview: null
    })
    setShowAddModal(true)
  }

  const handleAddWord = async () => {
    if (!newWord.word_text.trim()) { showToast('Word text is required', 'error'); return }
    try {
      const fd = new FormData()
      fd.append('word_text', newWord.word_text.toUpperCase())
      fd.append('clue_text', newWord.clue_text || '')
      fd.append('direction', newWord.direction)
      fd.append('start_row', newWord.start_row ?? 0)
      fd.append('start_col', newWord.start_col ?? 0)
      fd.append('word_order', words.length)
      fd.append('sound_correct_id', newWord.sound_correct_id || '')
      fd.append('sound_wrong_id', newWord.sound_wrong_id || '')
      if (newWord._overlayFile) fd.append('overlay_image', newWord._overlayFile)
      else fd.append('overlay_image_url', newWord.overlay_image_url || '')
      const res = await api.post(`/crossword/games/${id}/words`, fd)
      setWords(prev => [...prev, res.data.word])
      setShowAddModal(false)
      showToast('Word added ✅')
    } catch (err) { showToast('Error adding word: ' + (err.response?.data?.message || err.message), 'error') }
  }

  const saveWord = async (w) => {
    setSavingWord(w.id)
    try {
      const fd = new FormData()
      fd.append('word_text', w.word_text || '')
      fd.append('clue_text', w.clue_text || '')
      fd.append('start_row', w.start_row ?? 0)
      fd.append('start_col', w.start_col ?? 0)
      fd.append('direction', w.direction || 'across')
      fd.append('word_order', w.word_order ?? 0)
      fd.append('sound_correct_id', w.sound_correct_id || '')
      fd.append('sound_wrong_id', w.sound_wrong_id || '')
      fd.append('word_color', w.word_color || '#7c6ff7')
      if (w._overlayFile) fd.append('overlay_image', w._overlayFile)
      else fd.append('overlay_image_url', w.overlay_image_url || '')
      await api.put(`/crossword/words/${w.id}`, fd)
      dirtyRef.current.delete(w.id)
      showToast('Word saved ✅')
    } catch (err) { showToast('Error saving word: ' + (err.response?.data?.message || err.message), 'error') }
    setSavingWord(null)
  }

  const deleteWord = async (w) => {
    if (!confirm(`Delete "${w.word_text}"?`)) return
    try { await api.delete(`/crossword/words/${w.id}`); setWords(prev => prev.filter(x => x.id !== w.id)); showToast('Word deleted') }
    catch { showToast('Error deleting word', 'error') }
  }

  const handleWordToggle = async (wordId) => {
    if (wordId === openWordId) { setOpenWordId(null); return }
    if (openWordId !== null && dirtyRef.current.has(openWordId)) {
      const dirtyWord = words.find(w => w.id === openWordId)
      if (dirtyWord) {
        setSavingWord(openWordId)
        try {
          const fd = new FormData()
          fd.append('word_text', dirtyWord.word_text || '')
          fd.append('clue_text', dirtyWord.clue_text || '')
          fd.append('start_row', dirtyWord.start_row ?? 0)
          fd.append('start_col', dirtyWord.start_col ?? 0)
          fd.append('direction', dirtyWord.direction || 'across')
          fd.append('word_order', dirtyWord.word_order ?? 0)
          fd.append('sound_correct_id', dirtyWord.sound_correct_id || '')
          fd.append('sound_wrong_id', dirtyWord.sound_wrong_id || '')
          fd.append('word_color', dirtyWord.word_color || '#7c6ff7')
          if (dirtyWord._overlayFile) fd.append('overlay_image', dirtyWord._overlayFile)
          else fd.append('overlay_image_url', dirtyWord.overlay_image_url || '')
          await api.put(`/crossword/words/${openWordId}`, fd)
          showToast('Word auto-saved ✅')
        } catch { showToast('Error saving word', 'error') }
        dirtyRef.current.delete(openWordId)
        setSavingWord(null)
      }
    }
    setOpenWordId(wordId)
  }

  const autoGenerateGrid = async () => {
    try {
      const res = await api.post(`/crossword/games/${id}/generate-grid`)
      setSettings(s => ({ ...s, grid_rows: res.data.grid_rows, grid_cols: res.data.grid_cols }))
      showToast(`Grid auto-sized to ${res.data.grid_rows}×${res.data.grid_cols}`)
    } catch (err) { showToast('Error: ' + (err.response?.data?.message || err.message), 'error') }
  }

  /* ─── Form Fields ─── */
  const addFormField    = ()          => setFormFields([...formFields, { field_label:'New Field', field_type:'text', is_required:0, field_options:[] }])
  const removeFormField = i           => { const f=[...formFields]; f.splice(i,1); setFormFields(f) }
  const updateFormField = (i,key,val) => { const f=[...formFields]; f[i]={ ...f[i],[key]:val }; setFormFields(f) }
  const saveFormFields  = async () => {
    setSaving(true)
    try { await api.put(`/games/${id}/form-fields`, { fields: formFields }); showToast('Form fields saved') }
    catch { showToast('Error saving form fields', 'error') }
    setSaving(false)
  }

  /* ─── Email ─── */
  const saveEmailTemplate = async () => {
    setSaving(true)
    try { await api.put(`/games/${id}/email-template`, emailTemplate); showToast('Email template saved') }
    catch { showToast('Error saving email template', 'error') }
    setSaving(false)
  }

  /* ─── Settings Save ─── */
  const saveSettings = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      // Ensure we send ALL fields the backend expects, in the right order
      fd.append('grid_rows', settings.grid_rows || 0)
      fd.append('grid_cols', settings.grid_cols || 0)
      fd.append('cell_size', settings.cell_size || 0)
      fd.append('show_timer', settings.show_timer !== undefined ? Number(settings.show_timer) : 0)
      fd.append('time_limit_seconds', settings.time_limit_seconds || 0)
      fd.append('allow_hints', settings.allow_hints !== undefined ? Number(settings.allow_hints) : 0)
      fd.append('auto_size', settings.auto_size !== undefined ? Number(settings.auto_size) : 0)
      fd.append('heading_1', settings.heading_1 || '')
      fd.append('heading_2', settings.heading_2 || '')
      fd.append('heading_3', settings.heading_3 || '')
      fd.append('description_text', settings.description_text || '')
      fd.append('heading_1_color', settings.heading_1_color || '')
      fd.append('heading_2_color', settings.heading_2_color || '')
      fd.append('heading_3_color', settings.heading_3_color || '')
      fd.append('description_color', settings.description_color || '')
      fd.append('bg_color', settings.bg_color || '')
      fd.append('primary_color', settings.primary_color || '')
      fd.append('font_family', settings.font_family || '')
      fd.append('sound_correct_id', settings.sound_correct_id || '')
      fd.append('sound_wrong_id', settings.sound_wrong_id || '')
      fd.append('intro_text', settings.intro_text || '')
      fd.append('outro_text', settings.outro_text || '')
      fd.append('submit_button_text', settings.submit_button_text || '')
      fd.append('continue_button_text', settings.continue_button_text || '')
      fd.append('start_button_text', settings.start_button_text || '')
      fd.append('terms_enabled', settings.terms_enabled !== undefined ? Number(settings.terms_enabled) : 0)
      fd.append('terms_text', settings.terms_text || '')
      fd.append('terms_url', settings.terms_url || '')
      fd.append('send_email', settings.send_email !== undefined ? Number(settings.send_email) : 0)
      fd.append('meta_description', settings.meta_description || '')
      // Always send image URL fields (backend expects them even if uploading files)
      fd.append('bg_image_url', settings.bg_image_url || '')
      fd.append('thankyou_bg_image_url', settings.thankyou_bg_image_url || '')
      fd.append('game_logo_url', settings.game_logo_url !== undefined ? settings.game_logo_url : '')
      fd.append('submit_confirm_gif_url', settings.submit_confirm_gif_url || '')
      fd.append('blank_cell_image_url', settings.blank_cell_image_url || '')
      // Handle file uploads
      if (settings._bgImageFile) fd.append('bg_image', settings._bgImageFile)
      if (settings._tyBgImageFile) fd.append('thankyou_bg_image', settings._tyBgImageFile)
      if (settings._gameLogoFile) fd.append('game_logo', settings._gameLogoFile)
      if (settings._submitGifFile) fd.append('submit_confirm_gif', settings._submitGifFile)
      if (settings._blankCellImageFile) fd.append('blank_cell_image', settings._blankCellImageFile)
      console.log('Sending FormData fields:', Array.from(fd.entries()).map(([k,v]) => `${k}: ${typeof v === 'object' ? '[File]' : v}`))
      await api.put(`/crossword/${id}/settings`, fd)
      showToast('Settings saved ✅')
    } catch (err) { showToast('Error saving settings: ' + (err.response?.data?.message || err.message), 'error') }
    setSaving(false)
  }

  /* ─── Display Save ─── */
  const saveDisplaySettings = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      const sFields = ['heading_1','heading_2','heading_3','description_text','intro_text','meta_description','font_family',
        'bg_color','primary_color','show_timer','allow_hints','auto_size','time_limit_seconds',
        'sound_correct_id','sound_wrong_id','start_button_text',
        'terms_enabled','terms_text','terms_url']
      for (const f of sFields) fd.append(f, settings[f]??'')
      fd.append('heading_1_color', heading1Color)
      fd.append('heading_2_color', heading2Color)
      fd.append('heading_3_color', heading3Color)
      fd.append('description_color', descColor)
      if (settings._bgImageFile) fd.append('bg_image', settings._bgImageFile)
      else if (settings.bg_image_url !== undefined) fd.append('bg_image_url', settings.bg_image_url || '')
      if (settings._gameLogoFile) fd.append('game_logo', settings._gameLogoFile)
      else if (settings.game_logo_url !== undefined) fd.append('game_logo_url', settings.game_logo_url||'')
      await api.put(`/crossword/${id}/settings`, fd)
      await api.put(`/games/${id}`, { text1, text2 })
      await api.put(`/games/${id}/form-fields`, { fields: formFields })
      setGame(prev => ({ ...prev, text1, text2 }))
      showToast('Display settings saved ✅')
    } catch (err) { showToast('Error: '+(err.response?.data?.message||err.message), 'error') }
    setSaving(false)
  }

  /* ─── Redirect URL ─── */
  const saveRedirectUrl = async () => {
    setSavingRedirect(true)
    try {
      await api.put(`/games/${id}`, { redirect_url: redirectUrl })
      setGame(prev => ({ ...prev, redirect_url: redirectUrl }))
      showToast('Redirect URL saved ✅')
    } catch (err) { showToast('Error: '+(err.response?.data?.message||err.message), 'error') }
    setSavingRedirect(false)
  }

  /* ─── Game Details ─── */
  const slugify = s => s.toString().toLowerCase().replace(/\s+/g,'-').replace(/[^\w\-]+/g,'').replace(/\-\-+/g,'-').replace(/^-+/,'').replace(/-+$/,'')
  const saveGameDetails = async () => {
    setSaving(true)
    const cleanSlug = slugify(gameSlug) || slugify(text1) || 'game'
    try {
      await api.put(`/games/${id}`, { text1, text2, slug: cleanSlug })
      setGame(prev => ({ ...prev, text1, text2, slug: cleanSlug }))
      setGameSlug(cleanSlug)
      showToast('Game details saved ✅')
    } catch (err) { showToast('Error: '+(err.response?.data?.message||err.message), 'error') }
    setSaving(false)
  }

  /* ─── Sounds ─── */
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
      showToast('Sound uploaded ✅')
    } catch (err) { showToast('Error: '+(err.response?.data?.message||err.message), 'error') }
    setSoundUploading(false); e.target.value=''
  }
  const deleteSound = async s => {
    try { await api.delete(`/sounds/sounds/${s.id}`); setSounds(prev => prev.filter(x => x.id!==s.id)); showToast('Sound deleted') }
    catch { showToast('Error', 'error') }
  }

  const gameLink = game ? `${window.location.origin}/play/${game.slug}/${game.client_slug}` : ''
  const TABS = [
    { id:'display',   label:'🎨 Game Display' },
    { id:'sounds',    label:'🔊 Sounds' },
    { id:'words',     label:'🔤 Words' },
    { id:'thankyou',  label:'🙏 Thank You' },
    { id:'email',     label:'📧 Email' },
    { id:'settings',  label:'⚙️ Settings' },
  ]

  if (loading) return (
    <div className="cb-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign:'center', color:'var(--gb-text2)' }}>
        <div style={{ width:40,height:40,borderRadius:'50%',border:'3px solid #e2e6f0',borderTopColor:'#6366f1',animation:'spin .8s linear infinite',margin:'0 auto 16px' }} />
        Loading crossword builder…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (fetchError) return (
    <div className="cb-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign:'center', maxWidth:400 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>⚠️</div>
        <h2 style={{ color:'var(--gb-danger)', marginBottom:8 }}>Builder Failed to Load</h2>
        <p style={{ color:'var(--gb-text2)', marginBottom:20 }}>{fetchError}</p>
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
          <button className="cb-btn cb-btn-primary" onClick={loadGame}>🔄 Retry</button>
          <button className="cb-btn cb-btn-ghost" onClick={() => navigate('/dashboard/games')}>← Back to Games</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="cb-wrap">
      <style>{LIGHT}</style>

      {/* ─── Header with tabs ─── */}
      <div style={{ position:'sticky', top:0, zIndex:50, background:'var(--gb-surface)', borderBottom:'1.5px solid var(--gb-border)', boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>
        <div style={{ position:'relative', padding:'6px 20px', display:'flex', alignItems:'center', gap:6 }}>
          <button className="cb-btn cb-btn-ghost cb-btn-sm" onClick={() => navigate('/dashboard/games')} title="Back">←</button>
          <div style={{ fontWeight:700, fontSize:13, color:'var(--gb-text)', whiteSpace:'nowrap', minWidth:0, overflow:'hidden', textOverflow:'ellipsis' }}>{game?.name}</div>
          <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', display:'flex', gap:0, overflowX:'auto' }}>
            {TABS.map(t => {
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ padding:'5px 10px', fontSize:11, fontWeight:600, border:'none', background:'none', cursor:'pointer', color:tab===t.id?'var(--gb-primary)':'var(--gb-text2)', borderBottom:'2px solid '+(tab===t.id?'var(--gb-primary)':'transparent'), whiteSpace:'nowrap', fontFamily:'inherit', transition:'color .15s', flexShrink:0 }}>
                  {t.label}
                </button>
              )
            })}
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:4, alignItems:'center', flexShrink:0 }}>
            <button className="cb-btn cb-btn-ghost cb-btn-sm" onClick={() => { navigator.clipboard.writeText(gameLink); showToast('Link copied!') }} title="Copy link">🔗</button>
            <a href={gameLink} target="_blank" rel="noreferrer" className="cb-btn cb-btn-ghost cb-btn-sm" title="Preview">👁</a>
          </div>
        </div>
      </div>

      {/* ─── Content: two column layout ─── */}
      <div style={{ display:'flex', gap:20, padding:'16px 20px', minHeight:'calc(100vh - 56px)' }}>
        {/* ─── Left: Settings ─── */}
        <div style={{ flex:'3 1 0%', minWidth:0, maxWidth:'60%' }}>

        {/* ════ DISPLAY TAB ════ */}
        {tab === 'display' && (
          <div>
            <div className="cb-card" style={{ marginBottom:10, padding:14 }}>
              <div className="gb-section-title">🎮 Game Name</div>
              <input value={text1||game?.name||''} onChange={e => setText1(e.target.value)}
                style={{ fontSize:16, fontWeight:700, padding:'10px 14px' }} placeholder="Game display title" />
              <p style={{ fontSize:12, color:'var(--gb-text3)', marginTop:6 }}>This is what players see on the game page.</p>
            </div>

            <div className="cb-card" style={{ marginBottom:10, padding:14 }}>
              <div className="gb-section-title">🖼️ Images</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div style={{ textAlign:'center' }}>
                  <span className="gb-label">Game Background Image</span>
                  <input type="file" ref={bgImgRef} accept="image/png,image/jpeg,image/jpg"
                    onChange={e => { const f=e.target.files[0]; if(f){const r=new FileReader(); r.onload=ev=>setSettings({...settings,bg_image_url:ev.target.result,_bgImageFile:f}); r.readAsDataURL(f)} }}
                    style={{ display:'none' }} />
                  <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'center', marginBottom:8 }}>
                    <button className="cb-btn cb-btn-ghost cb-btn-sm" type="button" onClick={() => bgImgRef.current.click()}>📷 Upload</button>
                  </div>
                  {settings.bg_image_url ? (
                    <div style={{ position:'relative', display:'inline-block' }}>
                      <img src={settings.bg_image_url} className="gb-thumb" alt="" />
                      <button className="cb-btn cb-btn-danger cb-btn-icon"
                        style={{ position:'absolute', top:-8, right:-8, width:22, height:22, fontSize:11, lineHeight:'1px', padding:0, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%' }}
                        type="button" onClick={() => setSettings({...settings,bg_image_url:'',_bgImageFile:null})} title="Delete">✕</button>
                    </div>
                  ) : (
                    <p style={{ fontSize:11, color:'var(--gb-text3)' }}>No image uploaded</p>
                  )}
                </div>
                <div style={{ textAlign:'center' }}>
                  <span className="gb-label">Game Logo</span>
                  <input type="file" ref={gameLogoRef} accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                    onChange={e => { const f=e.target.files[0]; if(f){const r=new FileReader(); r.onload=ev=>setSettings({...settings,game_logo_url:ev.target.result,_gameLogoFile:f}); r.readAsDataURL(f)} }}
                    style={{ display:'none' }} />
                  <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'center', marginBottom:8 }}>
                    <button className="cb-btn cb-btn-ghost cb-btn-sm" type="button" onClick={() => gameLogoRef.current.click()}>📷 Upload</button>
                  </div>
                  {settings.game_logo_url ? (
                    <div style={{ position:'relative', display:'inline-block' }}>
                      <img src={settings.game_logo_url} alt="" className="gb-thumb" style={{ background:'#fff' }} />
                      <button className="cb-btn cb-btn-danger cb-btn-icon"
                        style={{ position:'absolute', top:-8, right:-8, width:22, height:22, fontSize:11, lineHeight:'1px', padding:0, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%' }}
                        type="button" onClick={() => setSettings({...settings,game_logo_url:'',_gameLogoFile:null})} title="Delete">✕</button>
                    </div>
                  ) : (
                    <p style={{ fontSize:11, color:'var(--gb-text3)' }}>No image uploaded</p>
                  )}
                </div>
              </div>
            </div>

            <div className="cb-card" style={{ marginBottom:10, padding:14 }}>
              <div className="gb-section-title">📝 Headings & Description</div>
              <div className="gb-fg" style={{ marginBottom:8 }}>
                <span className="gb-label">Heading 1</span>
                <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                  <input value={settings.heading_1||''} onChange={e => setSettings({...settings,heading_1:e.target.value})} placeholder="Main heading" style={{ flex:1 }} />
                  <ColorPicker value={heading1Color} onChange={v => setHeading1Color(v)} label="Color" />
                </div>
              </div>
              <div className="gb-fg" style={{ marginBottom:8 }}>
                <span className="gb-label">Heading 2 / Sub-heading</span>
                <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                  <input value={settings.heading_2||''} onChange={e => setSettings({...settings,heading_2:e.target.value})} placeholder="Sub-heading" style={{ flex:1 }} />
                  <ColorPicker value={heading2Color} onChange={v => setHeading2Color(v)} label="Color" />
                </div>
              </div>
              <div className="gb-fg" style={{ marginBottom:8 }}>
                <span className="gb-label">Heading 3 / Instructions</span>
                <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                  <input value={settings.heading_3||''} onChange={e => setSettings({...settings,heading_3:e.target.value})} placeholder="Short instructions" style={{ flex:1 }} />
                  <ColorPicker value={heading3Color} onChange={v => setHeading3Color(v)} label="Color" />
                </div>
              </div>
              <div className="gb-fg">
                <span className="gb-label">Description</span>
                <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                  <textarea rows={2} value={settings.description_text||''} onChange={e => setSettings({...settings,description_text:e.target.value})} placeholder="Optional description shown above the grid" style={{ flex:1, resize:'vertical' }} />
                  <ColorPicker value={descColor} onChange={v => setDescColor(v)} label="Color" />
                </div>
              </div>
            </div>

            <div className="cb-card" style={{ marginBottom:10, padding:14 }}>
              <div className="gb-section-title">📋 Form Fields</div>
              <p style={{ color:'var(--gb-text2)', fontSize:12, marginBottom:8 }}>These fields appear on the registration screen before the crossword starts.</p>
              {formFields.map((f,i) => (
                <div key={i} style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end', marginBottom:8, padding:'8px 10px', background:'var(--gb-surface2)', borderRadius:'var(--gb-radius-sm)' }}>
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
                    <input type="checkbox" checked={Number(f.is_required)===1} onChange={e => updateFormField(i,'is_required',e.target.checked?1:0)} style={{ width:16,height:16 }} />
                    Required
                  </label>
                  <button className="cb-btn cb-btn-danger cb-btn-sm" onClick={() => removeFormField(i)}>✕</button>
                </div>
              ))}
              <div style={{ textAlign:'center', marginTop:6, display:'flex', gap:8, justifyContent:'center' }}>
                <button className="cb-btn cb-btn-primary" onClick={addFormField}>+ Add Field</button>
                <button className="cb-btn cb-btn-primary" onClick={saveFormFields} disabled={saving}>{saving?'⏳ Saving…':'💾 Save Fields'}</button>
              </div>
            </div>

            <div className="cb-card" style={{ marginBottom:10, padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <input type="checkbox" id="termsEnabledDisplay" checked={Number(settings.terms_enabled)===1}
                  onChange={e => setSettings({...settings,terms_enabled:e.target.checked?1:0})} style={{ width:16,height:16 }} />
                <label htmlFor="termsEnabledDisplay" style={{ fontWeight:700, cursor:'pointer', fontSize:14 }}>Require Terms & Conditions</label>
              </div>
              {settings.terms_enabled ? (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="gb-fg"><span className="gb-label">Terms Label</span><input value={settings.terms_text||''} onChange={e => setSettings({...settings,terms_text:e.target.value})} placeholder="Terms & Conditions" /></div>
                  <div className="gb-fg"><span className="gb-label">Terms URL (optional)</span><input value={settings.terms_url||''} onChange={e => setSettings({...settings,terms_url:e.target.value})} placeholder="https://yoursite.com/terms" /></div>
                </div>
              ) : (
                <p style={{ color:'var(--gb-text3)', fontSize:13 }}>Enable to require players to accept T&C before starting.</p>
              )}
            </div>

            <div className="cb-card" style={{ marginBottom:10, padding:14 }}>
              <div className="gb-section-title">🎯 Start Button</div>
              <div className="gb-fg" style={{ maxWidth:280 }}>
                <span className="gb-label">Button Text</span>
                <input value={settings.start_button_text||''} onChange={e => setSettings({...settings,start_button_text:e.target.value})} placeholder="Start Crossword →" />
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button className="cb-btn cb-btn-primary" onClick={saveDisplaySettings} disabled={saving} style={{ padding:'10px 28px' }}>
                {saving ? '⏳ Saving…' : '💾 Save Display Settings'}
              </button>
            </div>
          </div>
        )}

        {/* ════ SOUNDS TAB ════ */}
        {tab === 'sounds' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, flexWrap:'wrap', gap:10 }}>
              <div>
                <h3 style={{ color:'var(--gb-text)', fontFamily:'inherit', marginBottom:4 }}>Sound Library</h3>
                <p style={{ color:'var(--gb-text2)', fontSize:13 }}>Upload MP3, WAV or OGG files, then assign them per-word or globally.</p>
              </div>
              {sounds.length > 0 && (
              <div>
                <button className="cb-btn cb-btn-primary" onClick={() => soundUploadRef.current.click()} disabled={soundUploading}>
                  {soundUploading ? '⏳ Uploading…' : '+ Upload Sound'}
                </button>
              </div>
              )}
            </div>
            <input type="file" ref={soundUploadRef} accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/x-wav,audio/wave" onChange={uploadSound} style={{ display:'none' }} />

            <div className="cb-card" style={{ marginBottom:10, padding:14 }}>
              <div className="gb-section-title">🎮 Assign Sounds to Crossword</div>
              <p style={{ color:'var(--gb-text2)', fontSize:12, marginBottom:8 }}>
                These play globally. Per-word sounds can be set inside each word card.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, marginBottom:10 }}>
                <SoundSelector label="✅ Correct Answer" value={settings.sound_correct_id} onChange={v => setSettings({...settings,sound_correct_id:v})} sounds={sounds} />
                <SoundSelector label="❌ Wrong Answer" value={settings.sound_wrong_id} onChange={v => setSettings({...settings,sound_wrong_id:v})} sounds={sounds} />
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button className="cb-btn cb-btn-primary cb-btn-sm" onClick={saveSettings} disabled={saving}>
                  {saving ? 'Saving…' : '💾 Save Sound Assignments'}
                </button>
              </div>
            </div>

            {sounds.length === 0
              ? (
                <div className="gb-empty">
                  <div className="gb-empty-icon">🔊</div>
                  <h3 style={{ color:'var(--gb-text)', marginBottom:8 }}>No sounds yet</h3>
                  <p>Upload MP3, WAV, or OGG files</p>
                  <button className="cb-btn cb-btn-primary" style={{ marginTop:16 }} onClick={() => soundUploadRef.current.click()}>+ Upload Sound</button>
                </div>
              )
              : (
                <div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {sounds.map(s => (
                      <div key={s.id} className="cb-card" style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px' }}>
                        <span style={{ fontSize:20 }}>🎵</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:14, color:'var(--gb-text)' }}>{s.name}</div>
                          <div style={{ color:'var(--gb-text3)', fontSize:11, marginTop:2 }}>ID: {s.id} · {s.sound_type}</div>
                        </div>
                        <audio controls src={s.url} style={{ height:32 }} />
                        <button className="cb-btn cb-btn-danger cb-btn-sm cb-btn-icon" onClick={() => deleteSound(s)} title="Remove sound">✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign:'center', marginTop:10 }}>
                    <button className="cb-btn cb-btn-primary" onClick={() => soundUploadRef.current.click()} disabled={soundUploading}>
                      {soundUploading ? '⏳ Uploading…' : '+ Upload Sound'}
                    </button>
                  </div>
                </div>
              )
            }
          </div>
        )}

        {/* ════ WORDS TAB ════ */}
        {tab === 'words' && (
          <div>
            {/* Grid Config */}
            <div className="cb-card" style={{ marginBottom:10, padding:14 }}>
              <div className="gb-section-title">🔲 Grid & Blank Cell</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'center' }}>
                {/* Left — fields */}
                <div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                    <div className="gb-fg">
                      <span className="gb-label">Rows</span>
                      <input type="number" min="3" max="30" value={settings.grid_rows || 10} onChange={e => setSettings({...settings,grid_rows:+e.target.value})} />
                    </div>
                    <div className="gb-fg">
                      <span className="gb-label">Cols</span>
                      <input type="number" min="3" max="30" value={settings.grid_cols || 10} onChange={e => setSettings({...settings,grid_cols:+e.target.value})} />
                    </div>
                    <div className="gb-fg">
                      <span className="gb-label">Cell Size</span>
                      <input type="number" min="20" max="80" value={settings.cell_size || 40} onChange={e => setSettings({...settings,cell_size:+e.target.value})} />
                    </div>
                    <div className="gb-fg">
                      <span className="gb-label">Time Limit (s)</span>
                      <input type="number" min="0" value={settings.time_limit_seconds || 0} onChange={e => setSettings({...settings,time_limit_seconds:+e.target.value})} />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:20, alignItems:'center' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontSize:13, whiteSpace:'nowrap' }}>
                      <input type="checkbox" checked={!!settings.show_timer} onChange={e => setSettings({...settings,show_timer:e.target.checked?1:0})} />
                      Show Timer
                    </label>
                    <label style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontSize:13, whiteSpace:'nowrap' }}>
                      <input type="checkbox" checked={!!settings.allow_hints} onChange={e => setSettings({...settings,allow_hints:e.target.checked?1:0})} />
                      Allow Hints
                    </label>
                    <label style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontSize:13, whiteSpace:'nowrap' }}>
                      <input type="checkbox" checked={!!settings.auto_size} onChange={e => {
                        const v = e.target.checked ? 1 : 0
                        setSettings({...settings, auto_size: v})
                        if (v) autoGenerateGrid()
                      }} />
                      Auto-size
                    </label>
                  </div>
                </div>
                {/* Right — blank cell image */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, borderLeft:'1px solid var(--gb-border)', paddingLeft:24 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--gb-primary)' }}>🎯 Blank Cell Image</span>
                  <span style={{ fontSize:11, color:'var(--gb-text3)', textAlign:'center' }}>brand logo / watermark<br />in empty cells</span>
                  <input type="file" id="blankCellImgInput" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                    onChange={e => { const f=e.target.files[0]; if(f){const r=new FileReader(); r.onload=ev=>setSettings({...settings,blank_cell_image_url:ev.target.result,_blankCellImageFile:f}); r.readAsDataURL(f)} }}
                    style={{ display:'none' }} />
                  <button className="cb-btn cb-btn-ghost cb-btn-sm" type="button" onClick={() => document.getElementById('blankCellImgInput').click()}>📷 Upload Image</button>
                  {settings.blank_cell_image_url && (
                    <div style={{ position:'relative', display:'inline-flex' }}>
                      <img src={settings.blank_cell_image_url} alt="" style={{ height:56, borderRadius:6, objectFit:'contain', border:'1px solid var(--gb-border)', background:'#f9f9f9' }} />
                      <button className="cb-btn cb-btn-danger cb-btn-sm cb-btn-icon"
                        style={{ position:'absolute', top:-6, right:-6, width:18, height:18, fontSize:9, padding:0, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%' }}
                        type="button" onClick={() => setSettings({...settings,blank_cell_image_url:'',_blankCellImageFile:null})} title="Remove">✕</button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10, paddingTop:10, borderTop:'1px solid var(--gb-border)' }}>
                <button className="cb-btn cb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'8px 20px', fontSize:13 }}>
                  {saving ? '⏳ Saving…' : '💾 Save Grid Settings'}
                </button>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ color:'var(--gb-text2)', fontSize:13 }}>{words.length} word{words.length !== 1 ? 's' : ''}</span>
            </div>

            {words.length === 0 ? (
              <div className="gb-empty">
                <div className="gb-empty-icon">🔤</div>
                <p>No words yet. Click <strong>+ Add Word</strong> to start.</p>
                <p style={{ fontSize:12, marginTop:4 }}>Each word needs a position (row, col) and direction.</p>
              </div>
            ) : (
              words.map((w, i) => (
                <WordCard
                  key={w.id} word={w} index={i} sounds={sounds}
                  open={openWordId === w.id}
                  onToggle={handleWordToggle}
                  saving={savingWord === w.id}
                  onUpdate={updated => {
                    setWords(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x))
                    dirtyRef.current.add(updated.id)
                  }}
                  onSave={saveWord}
                  onDelete={deleteWord}
                />
              ))
            )}
            <div style={{ textAlign:'center', marginTop:16 }}>
              <button className="cb-btn cb-btn-primary" onClick={openAddModal}>+ Add Word</button>
            </div>
          </div>
        )}



        {/* ════ THANK YOU TAB ════ */}
        {tab === 'thankyou' && (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:10 }}>
              <div className="cb-card" style={{ flex:1, padding:14, display:'flex', flexDirection:'column' }}>
                <div className="gb-section-title">🌅 Thank You Page Background</div>
                <input type="file" ref={tyBgImgRef} accept="image/png,image/jpeg,image/jpg"
                  onChange={e => { const f=e.target.files[0]; if(f){const r=new FileReader(); r.onload=ev=>setSettings({...settings,thankyou_bg_image_url:ev.target.result,_tyBgImageFile:f}); r.readAsDataURL(f)} }}
                  style={{ display:'none' }} />
                <div style={{ display:'flex', flexDirection:'column', flex:1 }}>
                  <div style={{ textAlign:'center', padding:'16px 0' }}>
                    <button className="cb-btn cb-btn-ghost cb-btn-sm" type="button" onClick={() => tyBgImgRef.current.click()} style={{ fontSize:13 }}>📷 Upload BG Image</button>
                    {settings.thankyou_bg_image_url && (
                      <button className="cb-btn cb-btn-danger cb-btn-sm cb-btn-icon" type="button" onClick={() => setSettings({...settings,thankyou_bg_image_url:'',_tyBgImageFile:null})} style={{ marginLeft:6 }}>✕</button>
                    )}
                  </div>
                  {settings.thankyou_bg_image_url && (
                    <div style={{ textAlign:'center', marginTop:'auto' }}>
                      <img src={settings.thankyou_bg_image_url} alt="" style={{ maxWidth:'100%', maxHeight:150, borderRadius:8, objectFit:'contain' }} />
                    </div>
                  )}
                  {!settings.thankyou_bg_image_url && (
                    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gb-text3)', fontSize:12 }}>No background image</div>
                  )}
                </div>
              </div>
              <div className="cb-card" style={{ flex:1, padding:14, display:'flex', flexDirection:'column' }}>
                <div className="gb-fg" style={{ flex:1 }}>
                  <span className="gb-label">Outro / Thank You Text</span>
                  <textarea rows={3} value={settings.outro_text||''} onChange={e => setSettings({...settings,outro_text:e.target.value})} style={{ resize:'vertical', flex:1 }} />
                </div>
                <div className="gb-fg" style={{ maxWidth:280, marginTop:10 }}>
                  <span className="gb-label">Submit & Explore Button Text</span>
                  <input value={settings.submit_button_text||''} onChange={e => setSettings({...settings,submit_button_text:e.target.value})} placeholder="Submit & Explore" />
                </div>
              </div>
            </div>

            <div className="cb-card" style={{ marginBottom:10, padding:14 }}>
              <div className="gb-section-title">🔗 Post-Game Redirect URL</div>
              <p style={{ color:'var(--gb-text2)', fontSize:12, marginBottom:8 }}>
                Where should players be sent after completing the crossword? Leave blank to show the default thank-you screen.
              </p>
              <div style={{ display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
                <div className="gb-fg" style={{ flex:1, minWidth:240 }}>
                  <span className="gb-label">Redirect URL</span>
                  <input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} placeholder="https://yourwebsite.com/thankyou" type="url" />
                </div>
                <button className="cb-btn cb-btn-primary" onClick={saveRedirectUrl} disabled={savingRedirect} style={{ flexShrink:0 }}>
                  {savingRedirect ? '⏳ Saving…' : '💾 Save URL'}
                </button>
              </div>
              {redirectUrl && (
                <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'8px 12px' }}>
                  <span style={{ fontSize:13 }}>🚀</span>
                  <span style={{ fontSize:12, color:'#15803d' }}>Players will be redirected to: </span>
                  <a href={redirectUrl} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#15803d', fontWeight:700, wordBreak:'break-all' }}>{redirectUrl}</a>
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:10, marginBottom:10 }}>
              <div className="cb-card" style={{ flex:1, padding:14, display:'flex', flexDirection:'column' }}>
                <div className="gb-section-title">🎊 Submit Confirmation GIF</div>
                <p style={{ color:'var(--gb-text2)', fontSize:12, marginBottom:8 }}>Shown in the popup modal when the player presses "Submit & Explore".</p>
                <input type="file" id="submitGifInputCW" accept="image/gif,image/png,image/jpeg,image/webp"
                  onChange={e => { const f=e.target.files[0]; if(f){const r=new FileReader(); r.onload=ev=>setSettings({...settings,submit_confirm_gif_url:ev.target.result,_submitGifFile:f}); r.readAsDataURL(f)} }}
                  style={{ display:'none' }} />
                <div style={{ textAlign:'center', padding:'8px 0' }}>
                  <button className="cb-btn cb-btn-ghost cb-btn-sm" type="button" onClick={() => document.getElementById('submitGifInputCW').click()} style={{ fontSize:13 }}>🎬 Upload GIF / Image</button>
                  {settings.submit_confirm_gif_url && (
                    <button className="cb-btn cb-btn-danger cb-btn-sm cb-btn-icon" type="button" onClick={() => setSettings({...settings,submit_confirm_gif_url:'',_submitGifFile:null})} title="Remove GIF" style={{ marginLeft:6 }}>✕</button>
                  )}
                </div>
                {settings.submit_confirm_gif_url && (
                  <div style={{ textAlign:'center' }}>
                    <img src={settings.submit_confirm_gif_url} alt="" style={{ maxWidth:'100%', maxHeight:120, borderRadius:8, objectFit:'contain' }} />
                  </div>
                )}
              </div>
              <div className="cb-card" style={{ flex:1, padding:14 }}>
                <div className="gb-section-title">➡️ Continue Button</div>
                <div className="gb-fg" style={{ maxWidth:280 }}>
                  <span className="gb-label">Button Text</span>
                  <input value={settings.continue_button_text||''} onChange={e => setSettings({...settings,continue_button_text:e.target.value})} placeholder="Continue Now →" />
                </div>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button className="cb-btn cb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px' }}>
                {saving ? '⏳ Saving…' : '💾 Save Thank You Settings'}
              </button>
            </div>
          </div>
        )}

        {/* ════ EMAIL TAB ════ */}
        {tab === 'email' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <p style={{ color:'var(--gb-text2)', fontSize:13 }}>Configure the congratulations email sent to players.</p>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
                <input type="checkbox" checked={Number(emailTemplate.is_enabled)===1}
                  onChange={e => setEmailTemplate({ ...emailTemplate, is_enabled:e.target.checked?1:0 })} style={{ width:16,height:16 }} />
                Enable email
              </label>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10, padding:'8px 12px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8 }}>
              <input type="checkbox" checked={!!settings.send_email}
                onChange={e => setSettings({ ...settings, send_email:e.target.checked?1:0 })}
                style={{ width:16,height:16 }} />
              <span style={{ fontWeight:600, color:'#166534' }}>Send email on game completion</span>
              <span style={{ color:'#166534', fontSize:12, marginLeft:'auto' }}>Requires template below to be enabled</span>
            </div>
            <div className="gb-section" style={{ marginBottom:10, background:'#fffbeb', borderColor:'#fde68a' }}>
              💡 SMTP credentials are configured in the server <code>.env</code> file. Use <code>{'{{name}}'}</code>, <code>{'{{score}}'}</code>, <code>{'{{total}}'}</code>, <code>{'{{game_name}}'}</code> as placeholders.
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:10 }}>
              <div className="gb-fg"><span className="gb-label">Sender Name</span><input value={emailTemplate.sender_name||''} onChange={e => setEmailTemplate({ ...emailTemplate, sender_name:e.target.value })} placeholder="Crossword Platform" /></div>
              <div className="gb-fg"><span className="gb-label">Sender Email</span><input value={emailTemplate.sender_email||''} onChange={e => setEmailTemplate({ ...emailTemplate, sender_email:e.target.value })} placeholder="noreply@yourdomain.com" /></div>
            </div>
            <div className="gb-fg" style={{ marginBottom:8 }}><span className="gb-label">Subject</span><input value={emailTemplate.subject||''} onChange={e => setEmailTemplate({ ...emailTemplate, subject:e.target.value })} placeholder="Congratulations {{name}}! 🎉" /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'flex-end', marginBottom:8 }}>
              <div className="gb-fg"><span className="gb-label">Header Text</span><input value={emailTemplate.header_text||''} onChange={e => setEmailTemplate({ ...emailTemplate, header_text:e.target.value })} placeholder="🎉 Congratulations!" /></div>
              <ColorPicker value={emailTemplate.header_color||'#6366f1'} onChange={v => setEmailTemplate({ ...emailTemplate, header_color:v })} label="Header Color" />
            </div>
            <div className="gb-fg" style={{ marginBottom:8 }}><span className="gb-label">Email Body (HTML)</span><textarea rows={4} value={emailTemplate.body_html||''} onChange={e => setEmailTemplate({ ...emailTemplate, body_html:e.target.value })} placeholder="<p>Thank you, {{name}}!</p>" style={{ resize:'vertical', fontFamily:'monospace', fontSize:13 }} /></div>
            <div className="gb-fg" style={{ marginBottom:12 }}><span className="gb-label">Footer Text</span><input value={emailTemplate.footer_text||''} onChange={e => setEmailTemplate({ ...emailTemplate, footer_text:e.target.value })} placeholder="© 2024 Your Company" /></div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button className="cb-btn cb-btn-ghost" onClick={() => setEmailPreview(emailTemplate.body_html||'')}>👁 Preview</button>
              <button className="cb-btn cb-btn-primary" onClick={saveEmailTemplate} disabled={saving} style={{ padding:'10px 28px' }}>{saving ? 'Saving…' : '💾 Save Email Template'}</button>
            </div>
          </div>
        )}

        {/* ════ EMAIL PREVIEW MODAL ════ */}
        {emailPreview && (
          <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)' }}
            onClick={() => setEmailPreview(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:680, maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.3)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', borderBottom:'1px solid #e5e7eb' }}>
                <span style={{ fontWeight:700, fontSize:15 }}>📧 Email Preview</span>
                <button className="cb-btn cb-btn-ghost cb-btn-sm" onClick={() => setEmailPreview(null)}>✕</button>
              </div>
              <div style={{ padding:20 }}>
                <div dangerouslySetInnerHTML={{ __html: emailTemplate.body_html || '' }} style={{ fontFamily:'Arial, sans-serif' }} />
              </div>
            </div>
          </div>
        )}

        {/* ════ SETTINGS TAB ════ */}
        {tab === 'settings' && (
          <div>

            {/* URL Slug */}
            <div className="cb-card" style={{ marginBottom:10, padding:14 }}>
              <div className="gb-section-title">🔗 Game URL</div>
              <div style={{ display:'flex', alignItems:'center', gap:0, background:'var(--gb-surface)', border:'1.5px solid var(--gb-border)', borderRadius:'var(--gb-radius-sm)', padding:'0', overflow:'hidden' }}>
                <span style={{ padding:'9px 0 9px 12px', fontSize:14, color:'var(--gb-text3)', background:'var(--gb-surface2)', borderRight:'1px solid var(--gb-border)', whiteSpace:'nowrap', fontFamily:'monospace' }}>/play/</span>
                <input value={gameSlug} onChange={e => setGameSlug(e.target.value)}
                  style={{ border:'none', borderRadius:0, background:'var(--gb-surface)', fontSize:14, padding:'9px 8px', outline:'none', flex:1, fontFamily:'monospace' }} />
                <span style={{ padding:'9px 12px 9px 0', fontSize:14, color:'var(--gb-text3)', background:'var(--gb-surface2)', borderLeft:'1px solid var(--gb-border)', whiteSpace:'nowrap', fontFamily:'monospace' }}>/{game?.client_slug||'client'}</span>
              </div>
            </div>

            {/* Font */}
            <div className="cb-card" style={{ marginBottom:10, padding:14 }}>
              <div className="gb-section-title">🔤 Font Family</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {FONT_CATEGORIES.map(cat => (
                  <div key={cat.name}>
                    <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--gb-text3)', marginBottom:6, display:'flex', alignItems:'center', gap:4 }}>
                      {cat.icon} {cat.name}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(165px,1fr))', gap:6, padding:8, background:'var(--gb-surface2)', borderRadius:'var(--gb-radius-sm)', border:'1px solid var(--gb-border)' }}>
                      {cat.fonts.map(font => (
                        <div key={font} onClick={() => setSettings({...settings,font_family:font})}
                          className="cb-font-opt"
                          style={{ padding:'6px 8px', borderRadius:6, cursor:'pointer',
                            border:`2px solid ${settings.font_family===font||(!settings.font_family&&font==='DM Sans') ? 'var(--gb-primary)' : 'transparent'}`,
                            background: settings.font_family===font||(!settings.font_family&&font==='DM Sans') ? '#eef0ff' : '#fff',
                            transition:'all .12s' }}>
                          <div style={{ fontSize:12, fontFamily:`'${font}',sans-serif`, color:'#1e1e2e', fontWeight:700 }}>{font}</div>
                          <div style={{ fontSize:10, fontFamily:`'${font}',sans-serif`, color:'#64657a' }}>The quick brown fox</div>
                          <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700&display=swap');`}</style>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="cb-card" style={{ marginBottom:10, padding:14 }}>
              <div className="gb-section-title">🎨 Colors</div>
              <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                <ColorPicker value={settings.bg_color||'#f8f8ff'} onChange={v => setSettings({...settings,bg_color:v})} label="Background Color" />
                <ColorPicker value={settings.primary_color||'#7c6ff7'} onChange={v => setSettings({...settings,primary_color:v})} label="Primary / Accent Color" />
              </div>
            </div>

            {/* Social Share */}
            <div className="cb-card" style={{ marginBottom:10, padding:14 }}>
              <div className="gb-section-title">📲 Social Share Text</div>
              <p style={{ color:'var(--gb-text2)', fontSize:12, marginBottom:6 }}>Text shown when the game link is shared on WhatsApp, Facebook etc.</p>
              <div style={{ display:'flex', gap:16 }}>
                <div className="gb-fg" style={{ flex:1 }}>
                  <span className="gb-label">Share Description</span>
                  <input value={settings.meta_description||''} onChange={e => setSettings({...settings,meta_description:e.target.value})} placeholder="Play this crossword and win exciting rewards!" maxLength={200} />
                  <span style={{ fontSize:11, color:'var(--gb-text3)', marginTop:2 }}>{(settings.meta_description||'').length}/200</span>
                </div>
                <div style={{ flex:1 }}>
                  <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(settings.font_family||'DM Sans')}:wght@400;600;700&display=swap');`}</style>
                  <div style={{ border:'1.5px solid var(--gb-border)', borderRadius:'var(--gb-radius-sm)', overflow:'hidden' }}>
                    <div style={{ background:'#f0f2f5', height:110, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'#999', overflow:'hidden' }}>
                      {settings.game_logo_url
                        ? <img src={settings.game_logo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'contain', padding:12, background:'#fff' }} />
                        : settings.bg_image_url
                          ? <img src={settings.bg_image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          : <span>🔗</span>
                      }
                    </div>
                    <div style={{ padding:'8px 12px', background:'#fff', fontFamily:`'${settings.font_family||'DM Sans'}',sans-serif` }}>
                      <div style={{ fontSize:10, color:'#666', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:2 }}>{game?.name || 'Game Name'}</div>
                      <div style={{ fontSize:12, fontWeight:600, color:'#1a1a2e', marginBottom:2, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                        {settings.meta_description || 'Play this crossword and win exciting rewards!'}
                      </div>
                      <div style={{ fontSize:10, color:'#888', marginTop:2, fontFamily:'inherit' }}>{window.location.origin}/play/…</div>
                    </div>
                    <div style={{ padding:'4px 12px', borderTop:'1px solid #eef0f5', fontSize:10, color:'#999', display:'flex', gap:8 }}>
                      <span>💬 0</span><span>🔁 0</span><span>❤️ 0</span>
                    </div>
                  </div>
                  <p style={{ fontSize:11, color:'var(--gb-text3)', marginTop:4 }}>Preview of how your game appears when shared.</p>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button className="cb-btn cb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px' }}>
                {saving ? '⏳ Saving…' : '💾 Save All Settings'}
              </button>
            </div>
          </div>
        )}

        </div>

        {/* ─── Right: Live Preview (40%) ─── */}
        <div style={{ flex:'2 1 0%', minWidth:0, maxWidth:'40%', position:'sticky', top:68, alignSelf:'flex-start', display:'flex', flexDirection:'column', height:'calc(100vh - 140px)' }}>
          <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(settings.font_family||'DM Sans')}:wght@400;600;700;800&display=swap');`}</style>

          {tab === 'words' ? (
            <div className="gb-phone" style={{
              width:'100%', maxWidth:320, flex:1, margin:'0 auto',
              fontFamily:`'${settings.font_family||'DM Sans'}',sans-serif`,
              border:'3px solid var(--gb-border)', borderRadius:32,
              boxShadow:'0 8px 32px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.1)',
              display:'flex', flexDirection:'column',
              overflow:'hidden',
              background: settings.bg_image_url ? `url(${settings.bg_image_url}) center/cover no-repeat` : (settings.bg_color||'#f4f4ff'),
            }}>
              <div style={{ height:8, background: settings.primary_color||'#7c6ff7', borderRadius:'29px 29px 0 0', flexShrink:0 }} />
              <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column', padding:'clamp(12px,3vw,20px)' }}>
                {/* Logo */}
                {settings.game_logo_url && (
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:6 }}>
                    <img src={settings.game_logo_url} alt="" style={{ maxWidth:'100%', maxHeight:80, width:'auto', height:'auto', objectFit:'contain', borderRadius:6 }} />
                  </div>
                )}
                {/* Headings */}
                <div style={{ fontSize:'clamp(12px,2.5vw,18px)', fontWeight:800, color: heading1Color, textAlign:'center', marginBottom:2, textShadow: settings.bg_image_url ? '0 2px 8px rgba(0,0,0,0.3)' : 'none' }}>
                  {settings.heading_1 || 'Crossword Title'}
                </div>
                <div style={{ fontSize:'clamp(10px,2vw,14px)', fontWeight:600, color: heading2Color, textAlign:'center', marginBottom:2 }}>
                  {settings.heading_2 || 'Sub-heading'}
                </div>
                <div style={{ fontSize:'clamp(9px,1.5vw,12px)', fontWeight:400, color: heading3Color, textAlign:'center', marginBottom:4 }}>
                  {settings.heading_3 || 'Fill in the words'}
                </div>
                {/* Grid */}
                <div style={{ flex:1, overflow:'auto', marginTop:4, display:'flex', justifyContent:'center' }}>
                  <GridPreview words={words} rows={settings.grid_rows || 10} cols={settings.grid_cols || 10} blankCellImageUrl={settings.blank_cell_image_url} />
                </div>
              </div>
            </div>
          ) : tab === 'thankyou' ? (
            <div className="gb-phone" style={{
              width:'100%', maxWidth:320, flex:1, margin:'0 auto',
              fontFamily:`'${settings.font_family||'DM Sans'}',sans-serif`,
              border:'3px solid var(--gb-border)', borderRadius:32,
              boxShadow:'0 8px 32px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.1)',
              display:'flex', flexDirection:'column',
              background: settings.thankyou_bg_image_url ? `url(${settings.thankyou_bg_image_url}) center/cover no-repeat` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}>
              <div style={{ height:8, background: settings.primary_color||'#7c6ff7', borderRadius:'29px 29px 0 0', flexShrink:0 }} />
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'clamp(12px,3vw,20px)', overflow:'auto' }}>
                <div style={{
                  width:'100%', maxWidth:300, padding:'clamp(16px,3vw,22px) clamp(14px,2vw,20px)',
                  borderRadius:14, textAlign:'center',
                  background: settings.thankyou_bg_image_url ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.95)',
                  backdropFilter:'blur(28px)', boxShadow:'0 8px 40px rgba(0,0,0,0.2)',
                  border:'1px solid rgba(255,255,255,0.35)',
                }}>
                  <div style={{ fontSize:40, marginBottom:6 }}>🎉</div>
                  <h2 style={{ fontSize:'clamp(18px,3vw,24px)', fontWeight:800, color:'#1a1a2e', marginBottom:4, lineHeight:1.2 }}>
                    {settings.outro_text || 'Thank You!'}
                  </h2>
                  <p style={{ fontSize:12, color:'#666', lineHeight:1.5, marginBottom:14 }}>
                    You have completed the crossword!
                  </p>
                  {settings.submit_confirm_gif_url && (
                    <div style={{ marginBottom:14 }}>
                      <img src={settings.submit_confirm_gif_url} alt="" style={{ maxWidth:'100%', maxHeight:100, borderRadius:8 }} />
                    </div>
                  )}
                  <div style={{ display:'inline-block', background:`linear-gradient(135deg, ${settings.primary_color||'#6366f1'}, ${settings.primary_color||'#6366f1'}cc)`, color:'#fff', borderRadius:8, padding:'8px 24px', fontSize:13, fontWeight:700, boxShadow:`0 6px 20px ${settings.primary_color||'#6366f1'}44` }}>
                    {settings.submit_button_text || 'Submit & Explore'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="gb-phone" style={{
              width:'100%', maxWidth:320, flex:1, margin:'0 auto',
              fontFamily:`'${settings.font_family||'DM Sans'}',sans-serif`,
              border:'3px solid var(--gb-border)', borderRadius:32,
              boxShadow:'0 8px 32px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.1)',
              display:'flex', flexDirection:'column',
              background: settings.bg_image_url ? `url(${settings.bg_image_url}) center/cover no-repeat` : (settings.bg_color||'#f4f4ff'),
            }}>
              <div style={{ height:8, background: settings.primary_color||'#7c6ff7', borderRadius:'29px 29px 0 0', flexShrink:0 }} />
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'clamp(12px,3vw,20px)', overflow:'auto' }}>
                <div style={{
                  width:'100%', maxWidth:300,
                  padding:'clamp(14px,2.5vw,20px) clamp(12px,2vw,18px)',
                  borderRadius:14,
                  background: settings.bg_image_url ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.93)',
                  backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
                  boxShadow: settings.bg_image_url ? '0 8px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.4)' : '0 8px 40px rgba(0,0,0,0.12)',
                  border: settings.bg_image_url ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.85)',
                }}>
                  {settings.game_logo_url && (
                    <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}>
                      <img src={settings.game_logo_url} alt="" style={{ maxWidth:'100%', maxHeight:160, width:'auto', height:'auto', objectFit:'contain', borderRadius:8, display:'block' }} />
                    </div>
                  )}
                  <div style={{ fontSize:'clamp(14px,2.5vw,20px)', fontWeight:800, color: heading1Color, textAlign:'center', marginBottom:2, lineHeight:1.2, textShadow: settings.bg_image_url ? '0 2px 8px rgba(0,0,0,0.3)' : 'none' }}>
                    {settings.heading_1 || text1 || game?.name || 'Crossword Title'}
                  </div>
                  <div style={{ fontSize:'clamp(11px,2vw,14px)', fontWeight:600, color: heading2Color, textAlign:'center', marginBottom:2 }}>
                    {settings.heading_2 || text2 || ''}
                  </div>
                  <div style={{ fontSize:'clamp(10px,1.5vw,12px)', fontWeight:400, color: heading3Color, textAlign:'center', marginBottom:4 }}>
                    {settings.heading_3 || ''}
                  </div>
                  {settings.description_text && (
                    <div style={{
                      background: settings.bg_image_url ? 'rgba(255,255,255,0.15)' : '#eef0ff',
                      border:`1.5px solid ${settings.bg_image_url ? 'rgba(255,255,255,0.3)' : '#6366f140'}`,
                      borderRadius:8, padding:'5px 8px', marginBottom:8,
                      color: descColor,
                      fontSize:11, textAlign:'center', lineHeight:1.3
                    }}>
                      {settings.description_text}
                    </div>
                  )}
                  {formFields.map((f,i) => (
                    <div key={i} style={{ marginBottom:4 }}>
                      <div style={{ fontSize:9, fontWeight:700, color: settings.bg_image_url ? 'rgba(255,255,255,0.9)' : '#555', marginBottom:1, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                        {f.field_label}{Number(f.is_required) ? ' *' : ''}
                      </div>
                      <div style={{ height:24, background:'rgba(255,255,255,0.88)', borderRadius:6, border:`1.5px solid ${settings.bg_image_url ? 'rgba(255,255,255,0.45)' : '#e0e0f0'}` }} />
                    </div>
                  ))}
                  {!!settings.terms_enabled && (
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4, marginTop:1 }}>
                      <div style={{ width:14, height:14, borderRadius:3, border:`2px solid ${settings.bg_image_url ? 'rgba(255,255,255,0.6)' : '#ccc'}`, background:'transparent', flexShrink:0 }} />
                      <span style={{ fontSize:10, color: settings.bg_image_url ? 'rgba(255,255,255,0.85)' : '#555' }}>
                        I agree to the <strong>{settings.terms_text || 'Terms & Conditions'}</strong>
                      </span>
                    </div>
                  )}
                  <div style={{ marginTop:1, textAlign:'center' }}>
                    <div style={{ display:'inline-block', background:`linear-gradient(135deg, ${settings.primary_color||'#6366f1'}, ${settings.primary_color||'#6366f1'}cc)`, color:'#fff', borderRadius:8, padding:'8px 24px', fontSize:13, fontWeight:700, fontFamily:'inherit', boxShadow:`0 6px 20px ${settings.primary_color||'#6366f1'}44` }}>
                      {settings.start_button_text || 'Start Crossword →'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ─── Add Word Modal ─── */}
      {showAddModal && (
        <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)' }}
          onClick={() => setShowAddModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:560, maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.3)', padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <span style={{ fontWeight:700, fontSize:16 }}>➕ Add Word</span>
              <button className="cb-btn cb-btn-ghost cb-btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="gb-fg">
                <span className="gb-label">Word *</span>
                <input value={newWord.word_text} onChange={e => setNewWord(p => ({ ...p, word_text: e.target.value.toUpperCase() }))}
                  placeholder="EXAMPLE" style={{ fontFamily:'monospace', letterSpacing:2 }} autoFocus />
              </div>
              <div className="gb-row">
                <div className="gb-fg" style={{ minWidth:100 }}>
                  <span className="gb-label">Direction</span>
                  <select value={newWord.direction} onChange={e => setNewWord(p => ({ ...p, direction: e.target.value }))}>
                    <option value="across">→ Across</option>
                    <option value="down">↓ Down</option>
                  </select>
                </div>
                <div className="gb-fg" style={{ minWidth:80 }}>
                  <span className="gb-label">Start Row</span>
                  <input type="number" min="0" value={newWord.start_row} onChange={e => setNewWord(p => ({ ...p, start_row: +e.target.value }))} />
                </div>
                <div className="gb-fg" style={{ minWidth:80 }}>
                  <span className="gb-label">Start Col</span>
                  <input type="number" min="0" value={newWord.start_col} onChange={e => setNewWord(p => ({ ...p, start_col: +e.target.value }))} />
                </div>
              </div>
              <div className="gb-fg">
                <span className="gb-label">Clue</span>
                <input value={newWord.clue_text} onChange={e => setNewWord(p => ({ ...p, clue_text: e.target.value }))} placeholder="Clue shown to the player" />
              </div>
              <div className="gb-row">
                <SoundSelector label="✅ Correct Sound" value={newWord.sound_correct_id} onChange={v => setNewWord(p => ({ ...p, sound_correct_id: v }))} sounds={sounds} />
                <SoundSelector label="❌ Wrong Sound"   value={newWord.sound_wrong_id}   onChange={v => setNewWord(p => ({ ...p, sound_wrong_id:   v }))} sounds={sounds} />
              </div>
              <div>
                <span className="gb-label">Overlay Image (shown on correct answer)</span>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                  <input type="file" accept="image/*" style={{ display:'none' }} id="add-word-overlay"
                    onChange={e => { const f=e.target.files[0]; if(f) setNewWord(p => ({ ...p, _overlayFile: f, _overlayPreview: URL.createObjectURL(f) })) }} />
                  <button className="cb-btn cb-btn-ghost cb-btn-sm" type="button" onClick={() => document.getElementById('add-word-overlay').click()}>📷 Upload</button>
                  {(newWord._overlayPreview || newWord.overlay_image_url) && (
                    <div style={{ position:'relative', display:'inline-flex' }}>
                      <img src={newWord._overlayPreview || newWord.overlay_image_url} alt="" style={{ height:60, borderRadius:8, objectFit:'contain', border:'1px solid var(--gb-border)', background:'#f9f9f9' }} />
                      <button className="cb-btn cb-btn-danger cb-btn-sm cb-btn-icon" type="button" onClick={() => setNewWord(p => ({ ...p, overlay_image_url: '', _overlayFile: null, _overlayPreview: null }))}
                        style={{ position:'absolute', top:-6, right:-6, width:18, height:18, fontSize:9, padding:0, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%' }}>✕</button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
                <button className="cb-btn cb-btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="cb-btn cb-btn-primary" onClick={handleAddWord}>➕ Add Word</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
