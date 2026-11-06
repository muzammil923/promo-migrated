import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'
import { useUploadErrors } from '../../apps/frontend/src/lib/builderUpload'

const LIGHT = `.gb-wrap{--gb-bg:#f4f6fb;--gb-surface:#fff;--gb-border:#e2e6f0;--gb-primary:#f59e0b;--gb-primary-d:#d97706;--gb-text:#1e1e2e;--gb-text2:#64657a;--gb-text3:#9899ae;--gb-radius:12px;font-family:'DM Sans',sans-serif;background:var(--gb-bg);color:var(--gb-text);min-height:100vh}*{box-sizing:border-box}
.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]),.gb-wrap select,.gb-wrap textarea{width:100%;font-family:inherit;font-size:14px;background:var(--gb-surface);border:none;border-bottom:1.5px solid var(--gb-border);border-radius:8px;color:var(--gb-text);padding:10px 12px 8px;outline:none}
.gb-wrap input:focus,.gb-wrap select:focus,.gb-wrap textarea:focus{border-bottom-color:var(--gb-primary)}
.gb-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;font-size:13px;font-weight:600;border-radius:8px;border:none;cursor:pointer;transition:all .15s;font-family:inherit}
.gb-btn-primary{background:var(--gb-primary);color:#fff}
.gb-btn-primary:hover{background:var(--gb-primary-d)}
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
.gb-toast{position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 18px;border-radius:10px;color:#fff;font-weight:600;font-size:13px}
@keyframes gbSlideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
`

const COLOR_PRESETS = ['#1a1a2e','#ffffff','#ef4444','#22c55e','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316']

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

export default function WordSearchBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('gameplay')
  const [toast, setToast] = useState(null)
  const [settings, setSettings] = useState({})
  const [sounds, setSounds] = useState([])
  const [saving, setSaving] = useState(false)
  const upload = useUploadErrors()
  const showToast = (msg, type='success') => setToast({ msg, type })

  const loadData = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/wordsearch/${id}/settings`),
      api.get(`/sounds/games/${id}/sounds`)
    ]).then(([gRes, sRes, soundRes]) => {
      setGame(gRes.data.game)
      setSettings(sRes.data.settings || {})
      setSounds(soundRes.data.sounds || [])
    }).catch(err => showToast('Failed to load', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const save = async () => {
    setSaving(true)
    try {
      await api.put(`/wordsearch/${id}/settings`, settings)
      showToast('Settings saved')
    } catch (e) {
      showToast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="gb-wrap" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}><div style={{fontSize:14,color:'var(--gb-text2)'}}>Loading...</div></div>
  if (!game) return <div className="gb-wrap" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}><div style={{fontSize:14,color:'#dc2626'}}>Game not found</div></div>

  return (
    <div className="gb-wrap">
      <style>{LIGHT}</style>
      <div style={{maxWidth:800,margin:'0 auto',padding:'24px 16px 60px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
          <button className="gb-btn gb-btn-ghost" onClick={() => navigate('/dashboard/games')}>← Back</button>
          <span style={{fontSize:22}}>🔍</span>
          <h1 style={{fontSize:18,fontWeight:700,margin:0}}>Word Search Builder</h1>
          <span style={{fontSize:12,color:'var(--gb-text3)',background:'var(--gb-border)',padding:'2px 10px',borderRadius:999}}>{game.name || 'Untitled'}</span>
        </div>

        <div className="gb-tabs">
          {['gameplay','visuals','settings'].map(t => (
            <button key={t} className={`gb-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'gameplay' ? 'Gameplay' : t === 'visuals' ? 'Visuals' : 'Settings'}
            </button>
          ))}
        </div>

        {tab === 'gameplay' && (
          <div>
            <div className="gb-card">
              <div className="gb-section-title">Game Rules</div>
              <div className="gb-row">
                <div className="gb-fg">
                  <label className="gb-label">Difficulty Levels</label>
                  <select value={settings.difficulty || 'easy,medium,hard'} onChange={e => setSettings(s => ({...s, difficulty: e.target.value}))}>
                    <option value="easy">Easy only</option>
                    <option value="easy,medium">Easy + Medium</option>
                    <option value="easy,medium,hard">Easy + Medium + Hard</option>
                  </select>
                </div>
                <div className="gb-fg">
                  <label className="gb-label">Default Difficulty</label>
                  <select value={settings.default_difficulty || 'easy'} onChange={e => setSettings(s => ({...s, default_difficulty: e.target.value}))}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="gb-card">
              <div className="gb-section-title">Categories (Word Packs)</div>
              <div className="gb-row">
                <div className="gb-fg">
                  <label className="gb-label">Available Categories</label>
                  <select multiple value={(settings.categories || 'animals,ocean,space,sweets').split(',')} onChange={e => setSettings(s => ({...s, categories: Array.from(e.target.selectedOptions, o => o.value).join(',')}))} style={{minHeight:120}}>
                    <option value="animals">🦁 Safari (Animals)</option>
                    <option value="ocean">🐙 Ocean</option>
                    <option value="space">🚀 Space</option>
                    <option value="sweets">🍩 Sweets</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'visuals' && (
          <div>
            <div className="gb-card">
              <div className="gb-section-title">Theme Colors</div>
              <div className="gb-row">
                <ColorPicker value={settings.bg_color || '#7BE1F0'} onChange={v => setSettings(s => ({...s, bg_color: v}))} label="Background Color" />
                <ColorPicker value={settings.accent_color || '#FF8A3D'} onChange={v => setSettings(s => ({...s, accent_color: v}))} label="Accent Color" />
              </div>
              <div style={{marginTop:12}} className="gb-row">
                <ColorPicker value={settings.text_color || '#4A3220'} onChange={v => setSettings(s => ({...s, text_color: v}))} label="Text Color" />
                <ColorPicker value={settings.card_color || '#FFF7E9'} onChange={v => setSettings(s => ({...s, card_color: v}))} label="Card Color" />
              </div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div>
            <div className="gb-card">
              <div className="gb-section-title">Additional Settings</div>
              <div className="gb-row">
                <div className="gb-fg">
                  <label className="gb-label">Time Limit (seconds, 0 = none)</label>
                  <input type="number" min="0" max="600" value={settings.time_limit || 0} onChange={e => setSettings(s => ({...s, time_limit: parseInt(e.target.value) || 0}))} />
                </div>
                <div className="gb-fg">
                  <label className="gb-label">Hints Per Game</label>
                  <input type="number" min="0" max="10" value={settings.hints_per_game || 3} onChange={e => setSettings(s => ({...s, hints_per_game: parseInt(e.target.value) || 3}))} />
                </div>
              </div>
              <div className="gb-row" style={{marginTop:12}}>
                <div className="gb-fg">
                  <label className="gb-label">Coins Per Word Found</label>
                  <input type="number" min="0" max="100" value={settings.coins_per_word || 10} onChange={e => setSettings(s => ({...s, coins_per_word: parseInt(e.target.value) || 10}))} />
                </div>
                <div className="gb-fg">
                  <label className="gb-label">Coins Per Level Complete</label>
                  <input type="number" min="0" max="500" value={settings.coins_per_level || 50} onChange={e => setSettings(s => ({...s, coins_per_level: parseInt(e.target.value) || 50}))} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:24}}>
          <button className="gb-btn gb-btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
