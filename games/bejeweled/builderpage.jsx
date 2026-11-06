import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'
import { useUploadErrors } from '../../apps/frontend/src/lib/builderUpload'

/* ─────────────────────────────────────────────
   LIGHT THEME TOKENS  (scoped to .gb-wrap)
───────────────────────────────────────────── */
const LIGHT = `
.gb-wrap {
  font-family: 'DM Sans', sans-serif;
  background: var(--gb-bg);
  color: var(--gb-text);
  min-height: 100vh;
}
.gb-wrap *,
.gb-wrap *::before,
.gb-wrap *::after { box-sizing: border-box; }

.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]),
.gb-wrap select,
.gb-wrap textarea {
  width: 100%;
  font-family: inherit;
  font-size: 14px;
  background: var(--gb-surface);
  border: none;
  border-bottom: 1.5px solid var(--gb-border);
  border-radius: 8px;
  color: var(--gb-text);
  padding: 10px 12px 8px;
  outline: none;
  transition: border-color .18s;
}
.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]):focus,
.gb-wrap select:focus,
.gb-wrap textarea:focus {
  border-bottom-color: #22c55e;
  border-bottom-width: 2px;
}
.gb-wrap select option { background: #fff; color: #1e1e2e; }

.gb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; font-size: 13px; font-weight: 600;
  border-radius: var(--gb-radius-sm); border: none; cursor: pointer;
  transition: all .15s; white-space: nowrap; font-family: inherit;
}
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

.gb-card {
  background: var(--gb-surface);
  border: 1.5px solid var(--gb-border);
  border-radius: var(--gb-radius);
  box-shadow: var(--gb-shadow);
}
.gb-label {
  font-size: 11px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: var(--gb-text2); margin-bottom: 4px;
  display: block;
}
.gb-section {
  background: var(--gb-surface2);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius);
  padding: 16px;
  margin-bottom: 14px;
}
.gb-section-title {
  font-size: 12px; font-weight: 700; letter-spacing: .05em;
  text-transform: uppercase; color: var(--gb-primary);
  margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
}
.gb-toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 9999;
  padding: 12px 18px; border-radius: 10px; color: #fff; font-weight: 600;
  font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,.15);
  animation: gb-slide-in .22s ease; font-family: 'DM Sans',sans-serif;
  max-width: 320px;
}
@keyframes gb-slide-in { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:none } }
`

const DEFAULT_THEME = {
  '2':'#ff6b6b','4':'#4ecdc4','8':'#45b7d1','16':'#f9ca24','32':'#f0932b','64':'#eb4d4b',
  '128':'#574b90','256':'#2c3e50','512':'#34495e','1024':'#2c3e50','2048':'#1a1a2e','4096':'#0f3d3f'
}

export default function BejeweledBuilderPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [game,        setGame]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('form')
  const [toast,       setToast]       = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [settings,    setSettings]    = useState({
    grid_size: 8,
    logo_url: '',
    logo_name: '',
    theme_colors: JSON.stringify(DEFAULT_THEME),
    match_score: 10,
    chain_score_multiplier: 2,
    is_active: 1,
  })

  const upload = useUploadErrors()
  const showToast = (msg, type='success') => setToast({ msg, type })

  const loadGame = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/bejeweled/${id}/settings`),
    ]).then(([gameRes, gRes]) => {
      const g = gameRes.data.game
      setGame(g)
      if (gRes.data && gRes.data.settings) {
        const s = gRes.data.settings
        setSettings(prev => ({
          ...prev,
          grid_size: s.grid_size ?? prev.grid_size,
          logo_url: s.logo_url ?? '',
          logo_name: s.logo_name ?? '',
          theme_colors: s.theme_colors ?? prev.theme_colors,
          match_score: s.match_score ?? prev.match_score,
          chain_score_multiplier: s.chain_score_multiplier ?? prev.chain_score_multiplier,
          is_active: s.is_active ?? prev.is_active,
        }))
      }
    }).catch(err => {
      showToast('Failed to load: ' + (err.response?.data?.message || err.message), 'error')
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadGame() }, [loadGame])

  const set = (k, v) => setSettings(prev => ({ ...prev, [k]: v }))

  const saveSettings = async () => {
    setSaving(true)
    try {
      const payload = {
        grid_size: parseInt(settings.grid_size) || 8,
        logo_url: settings.logo_url || '',
        logo_name: settings.logo_name || '',
        theme_colors: settings.theme_colors || JSON.stringify(DEFAULT_THEME),
        match_score: parseInt(settings.match_score) || 10,
        chain_score_multiplier: parseInt(settings.chain_score_multiplier) || 2,
        is_active: settings.is_active ? 1 : 0,
      }
      const res = await api.put(`/bejeweled/${id}/settings`, payload)
      if (res.data && res.data.settings) setSettings(prev => ({ ...prev, ...res.data.settings }))
      showToast('Settings saved')
    } catch (err) {
      showToast('Error: ' + (err.response?.data?.message || err.message), 'error')
    }
    setSaving(false)
  }

  const gameLink = game ? `${window.location.origin}/play/${game.slug}/${game.client_slug}` : ''

  if (loading) return (
    <div className="gb-wrap" style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign:'center', color:'var(--gb-text2)' }}>
        <div style={{ width:40,height:40,borderRadius:'50%',border:'3px solid #e2e6f0',borderTopColor:'#6366f1',animation:'spin .8s linear infinite',margin:'0 auto 16px' }} />
        Loading…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  const TABS = [{ id:'form', label:'Game Settings' }]
  const TAB_FIELDS = {}

  return (
    <div className="gb-wrap"><style>{LIGHT}</style>
      <div style={{ display:'grid',gridTemplateColumns:'1fr auto 1fr',background:'#fff',borderBottom:'1.5px solid var(--gb-border)',padding:'10px 28px',gap:'4px 20px',alignItems:'center',position:'sticky',top:'62px',zIndex:50 }}>
        <div style={{ display:'flex',gap:10,alignItems:'flex-start' }}>
          <button className="gb-btn gb-btn-ghost" onClick={() => navigate('/dashboard/games')} style={{ padding:'6px 8px',fontSize:16 }}>←</button>
          <div>
            <div style={{ fontWeight:700,fontSize:14 }}>{game?.name || 'Untitled'}</div>
            <div style={{ fontSize:9.5,fontWeight:600,color:'var(--gb-text3)',letterSpacing:'.04em',textTransform:'uppercase' }}>Bejeweled Builder</div>
          </div>
        </div>
        <div style={{ display:'flex',gap:0,borderBottom:'2px solid var(--gb-border)' }}>
          {TABS.map(t => {
            const hasErr = upload.tabHasError(t.id, TAB_FIELDS[t.id] || [])
            return <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'6px 14px',fontSize:12.5,fontWeight:600,border:'none',background:'none',cursor:'pointer',color:tab===t.id?'var(--gb-primary)':'var(--gb-text2)',borderBottom:tab===t.id?'2px solid var(--gb-primary)':'2px solid transparent',marginBottom:-2 }}>{t.label}{hasErr && <span className="gb-tab-err-dot" />}</button>
          })}
        </div>
        <div style={{ display:'flex',gap:6,justifySelf:'end' }}>
          {gameLink && <a href={gameLink} target="_blank" rel="noreferrer" className="gb-btn gb-btn-ghost" style={{ padding:'6px 8px',fontSize:16,textDecoration:'none' }}>👁</a>}
        </div>
      </div>

      <div style={{ maxWidth:1200,margin:'0 auto',padding:'24px 20px' }}>
        <div className="gb-card">
          <div className="gb-section-title">💎 Bejeweled Settings</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div>
              <span className="gb-label">Grid Size</span>
              <input type="number" min={4} max={12} value={settings.grid_size || 8} onChange={e => set('grid_size', parseInt(e.target.value) || 8)} />
            </div>
            <div>
              <span className="gb-label">Match Score</span>
              <input type="number" min={1} value={settings.match_score || 10} onChange={e => set('match_score', parseInt(e.target.value) || 10)} />
            </div>
            <div>
              <span className="gb-label">Chain Score Multiplier</span>
              <input type="number" step="0.1" min={1} value={settings.chain_score_multiplier || 2} onChange={e => set('chain_score_multiplier', parseFloat(e.target.value) || 2)} />
            </div>
            <div>
              <span className="gb-label">Logo URL</span>
              <input value={settings.logo_url || ''} onChange={e => set('logo_url', e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <span className="gb-label">Logo Name</span>
              <input value={settings.logo_name || ''} onChange={e => set('logo_name', e.target.value)} placeholder="Brand" />
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <input type="checkbox" checked={!!settings.is_active} onChange={e => set('is_active', e.target.checked ? 1 : 0)} style={{ width:'auto' }} />
              <span className="gb-label" style={{ marginBottom:0 }}>Active (game available to play)</span>
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <span className="gb-label">Theme Colors (JSON)</span>
              <textarea rows={6} value={settings.theme_colors || ''} onChange={e => set('theme_colors', e.target.value)} style={{ fontFamily:'monospace',fontSize:12 }} />
            </div>
          </div>
          <div style={{ display:'flex',justifyContent:'flex-end',marginTop:12 }}>
            <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving}>{saving?'⏳ Saving…':'💾 Save Settings'}</button>
          </div>
        </div>
      </div>

      {toast && <div className="gb-toast" style={{ background: toast.type === 'success' ? '#16a34a' : '#dc2626' }} onClick={() => setToast(null)}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}
    </div>
  )
}
