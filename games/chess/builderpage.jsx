import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'

const LIGHT = `
.chess-builder { --gb-bg:#f4f6fb; --gb-surface:#fff; --gb-border:#e2e6f0; --gb-primary:#7B3EFF; --gb-primary-d:#6425d9; --gb-text:#1e1e2e; --gb-text2:#64657a; --gb-text3:#9899ae; font-family:'DM Sans',sans-serif; background:var(--gb-bg); color:var(--gb-text); min-height:100vh; padding:24px; }
.chess-builder *, .chess-builder *::before, .chess-builder *::after { box-sizing:border-box; }
.chess-builder .cb-card { background:var(--gb-surface); border:1.5px solid var(--gb-border); border-radius:16px; padding:24px; margin-bottom:20px; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
.chess-builder .cb-title { font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--gb-primary); margin-bottom:16px; display:flex; align-items:center; gap:8px; }
.chess-builder .cb-label { font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--gb-text2); margin-bottom:6px; display:block; }
.chess-builder .cb-input { width:100%; font-family:inherit; font-size:14px; background:var(--gb-surface); border:1.5px solid var(--gb-border); border-radius:8px; color:var(--gb-text); padding:10px 12px; outline:none; transition:border-color .18s; }
.chess-builder .cb-input:focus { border-color:var(--gb-primary); border-width:2px; }
.chess-builder .cb-row { display:flex; gap:12px; align-items:flex-end; margin-bottom:16px; }
.chess-builder .cb-row > * { flex:1; }
.chess-builder .cb-btn { display:inline-flex; align-items:center; gap:6px; padding:10px 20px; font-size:13px; font-weight:600; border-radius:10px; border:none; cursor:pointer; transition:all .15s; font-family:inherit; }
.chess-builder .cb-btn-primary { background:var(--gb-primary); color:#fff; }
.chess-builder .cb-btn-primary:hover { background:var(--gb-primary-d); transform:translateY(-1px); }
.chess-builder .cb-btn-ghost { background:var(--gb-surface); color:var(--gb-text2); border:1.5px solid var(--gb-border); }
.chess-builder .cb-btn-ghost:hover { border-color:var(--gb-primary); color:var(--gb-primary); }
.chess-builder textarea.cb-input { resize:vertical; min-height:80px; }
.chess-builder .cb-select { width:100%; font-family:inherit; font-size:14px; background:var(--gb-surface); border:1.5px solid var(--gb-border); border-radius:8px; color:var(--gb-text); padding:10px 12px; outline:none; appearance:auto; }
.chess-builder .cb-swatch { width:36px; height:36px; border-radius:8px; border:2px solid var(--gb-border); cursor:pointer; flex-shrink:0; }
.chess-builder .cb-toggle { display:flex; align-items:center; gap:10px; cursor:pointer; }
.chess-builder .cb-toggle-track { width:44px; height:24px; border-radius:12px; background:#ccc; position:relative; transition:background .2s; }
.chess-builder .cb-toggle-track.on { background:var(--gb-primary); }
.chess-builder .cb-toggle-thumb { width:20px; height:20px; border-radius:50%; background:#fff; position:absolute; top:2px; left:2px; transition:left .2s; box-shadow:0 1px 3px rgba(0,0,0,0.2); }
.chess-builder .cb-toggle-track.on .cb-toggle-thumb { left:22px; }
@media(max-width:768px) { .chess-builder { padding:16px; } .chess-builder .cb-row { flex-direction:column; } }
`

export default function ChessBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [game, setGame] = useState(null)

  const [settings, setSettings] = useState({
    difficulty: 'medium', time_control: 0, board_theme: 'classic',
    primary_color: '#7B3EFF', bg_color: '#0f0f23', intro_text: '', outro_text: '',
    show_coordinates: 1, piece_style: 'classic', sound_enabled: 1
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [gRes, sRes] = await Promise.all([
          api.get(`/games/${id}`),
          api.get(`/chess/settings/${id}`)
        ])
        if (gRes.data.game) setGame(gRes.data.game)
        if (sRes.data.settings) setSettings(s => ({ ...s, ...sRes.data.settings }))
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [id])

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/chess/settings/${id}`, settings)
      setToast({ type: 'success', msg: 'Settings saved!' })
    } catch (e) {
      setToast({ type: 'error', msg: 'Failed to save' })
    }
    setTimeout(() => setToast(null), 3000)
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading...</div>

  return (
    <div className="chess-builder">
      <style>{LIGHT}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <button onClick={() => navigate('/dashboard/games')} style={{ background: 'none', border: 'none', color: '#64657a', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans', marginBottom: 4 }}>
            ← Back to Games
          </button>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, fontFamily: 'Syne, DM Sans' }}>♚ Chess Settings</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate(game && game.slug ? `/play/${game.slug}/${game.client_slug}` : `/play/chess/${id}/${id}`)} className="cb-btn cb-btn-ghost">Preview</button>
          <button onClick={handleSave} disabled={saving} className="cb-btn cb-btn-primary">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Game Settings */}
        <div className="cb-card">
          <div className="cb-title">🎮 Game Settings</div>

          <label className="cb-label">AI Difficulty</label>
          <select className="cb-select" value={settings.difficulty} onChange={e => set('difficulty', e.target.value)} style={{ marginBottom: 16 }}>
            <option value="easy">Easy (Random moves)</option>
            <option value="medium">Medium (Depth 3)</option>
            <option value="hard">Hard (Depth 4)</option>
            <option value="master">Master (Depth 5)</option>
          </select>

          <label className="cb-label">Time Control (seconds, 0 = no timer)</label>
          <div className="cb-row">
            {[0, 60, 180, 300, 600, 900].map(t => (
              <button key={t} onClick={() => set('time_control', t)} className="cb-btn" style={{
                flex: 1, padding: '8px 4px', fontSize: 12, borderRadius: 8,
                background: settings.time_control === t ? '#7B3EFF' : '#f0f0f5',
                color: settings.time_control === t ? '#fff' : '#64657a',
                border: 'none', cursor: 'pointer'
              }}>
                {t === 0 ? 'None' : `${t/60}m`}
              </button>
            ))}
          </div>

          <label className="cb-label">Board Theme</label>
          <select className="cb-select" value={settings.board_theme} onChange={e => set('board_theme', e.target.value)} style={{ marginBottom: 16 }}>
            <option value="classic">Classic (Green/Brown)</option>
            <option value="blue">Blue</option>
            <option value="purple">Purple</option>
            <option value="wood">Wood</option>
            <option value="marble">Marble</option>
            <option value="dark">Dark Mode</option>
          </select>

          <label className="cb-label">Piece Style</label>
          <select className="cb-select" value={settings.piece_style} onChange={e => set('piece_style', e.target.value)}>
            <option value="classic">Classic Unicode</option>
            <option value="bold">Bold</option>
            <option value="fancy">Fancy</option>
          </select>
        </div>

        {/* Visual Settings */}
        <div className="cb-card">
          <div className="cb-title">🎨 Visual Settings</div>

          <div className="cb-row">
            <div>
              <label className="cb-label">Primary Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="cb-swatch" style={{ background: settings.primary_color }} />
                <input className="cb-input" value={settings.primary_color} onChange={e => set('primary_color', e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
            <div>
              <label className="cb-label">Background Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="cb-swatch" style={{ background: settings.bg_color }} />
                <input className="cb-input" value={settings.bg_color} onChange={e => set('bg_color', e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            <div className="cb-toggle" onClick={() => set('show_coordinates', settings.show_coordinates ? 0 : 1)}>
              <div className={`cb-toggle-track ${settings.show_coordinates ? 'on' : ''}`}>
                <div className="cb-toggle-thumb" />
              </div>
              <span style={{ fontSize: 13 }}>Show Coordinates</span>
            </div>
            <div className="cb-toggle" onClick={() => set('sound_enabled', settings.sound_enabled ? 0 : 1)}>
              <div className={`cb-toggle-track ${settings.sound_enabled ? 'on' : ''}`}>
                <div className="cb-toggle-thumb" />
              </div>
              <span style={{ fontSize: 13 }}>Sound Effects</span>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="cb-card" style={{ gridColumn: 'span 2' }}>
          <div className="cb-title">📝 Text Content</div>
          <div className="cb-row">
            <div>
              <label className="cb-label">Intro Text</label>
              <textarea className="cb-input" value={settings.intro_text || ''} onChange={e => set('intro_text', e.target.value)} placeholder="Welcome message shown before the game starts..." />
            </div>
            <div>
              <label className="cb-label">Outro Text</label>
              <textarea className="cb-input" value={settings.outro_text || ''} onChange={e => set('outro_text', e.target.value)} placeholder="Message shown after the game ends..." />
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          padding: '12px 18px', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 13,
          background: toast.type === 'success' ? '#16a34a' : '#dc2626',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontFamily: 'DM Sans'
        }}>{toast.msg}</div>
      )}
    </div>
  )
}
