import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'

const CSS = `
.cm-wrap {
  --cm-bg: #f4f6fb; --cm-surface: #ffffff; --cm-surface2: #f0f2f8;
  --cm-border: #e2e6f0; --cm-primary: #6366f1; --cm-primary-d: #4f46e5;
  --cm-primary-g: rgba(99,102,241,0.15); --cm-success: #16a34a; --cm-danger: #dc2626;
  --cm-text: #1e1e2e; --cm-text2: #64657a; --cm-text3: #9899ae;
  --cm-shadow: 0 2px 12px rgba(0,0,0,0.08); --cm-radius: 12px; --cm-radius-sm: 8px;
  font-family: 'DM Sans', sans-serif; background: var(--cm-bg); color: var(--cm-text); min-height: 100vh;
}
.cm-wrap *, .cm-wrap *::before, .cm-wrap *::after { box-sizing: border-box; }
.cm-wrap input:not([type=checkbox]):not([type=color]):not([type=range]),
.cm-wrap select, .cm-wrap textarea {
  width: 100%; font-family: inherit; font-size: 14px; background: var(--cm-surface);
  border: none; border-bottom: 1.5px solid var(--cm-border); border-radius: 8px;
  color: var(--cm-text); padding: 10px 12px 8px; outline: none; transition: border-color .18s;
}
.cm-wrap input:not([type=checkbox]):not([type=color]):focus,
.cm-wrap select:focus, .cm-wrap textarea:focus { border-bottom-color: #6366f1; border-bottom-width: 2px; }
.cm-wrap select option { background: #fff; color: #1e1e2e; }
.cm-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600;
  border-radius: var(--cm-radius-sm); border: none; cursor: pointer; transition: all .15s; white-space: nowrap; font-family: inherit; }
.cm-btn:disabled { opacity: .5; cursor: not-allowed; }
.cm-btn-primary { background: var(--cm-primary); color: #fff; }
.cm-btn-primary:not(:disabled):hover { background: var(--cm-primary-d); transform: translateY(-1px); box-shadow: 0 4px 12px var(--cm-primary-g); }
.cm-btn-ghost { background: var(--cm-surface); color: var(--cm-text2); border: 1.5px solid var(--cm-border); }
.cm-btn-ghost:not(:disabled):hover { border-color: var(--cm-primary); color: var(--cm-primary); }
.cm-card { background: var(--cm-surface); border: 1.5px solid var(--cm-border); border-radius: var(--cm-radius); box-shadow: var(--cm-shadow); }
.cm-label { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--cm-text2); margin-bottom: 4px; display: block; }
.cm-section { background: var(--cm-surface2); border: 1px solid var(--cm-border); border-radius: var(--cm-radius); padding: 16px; margin-bottom: 14px; }
.cm-section-title { font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--cm-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
.cm-toast { position: fixed; bottom: 24px; right: 24px; z-index: 9999; padding: 12px 18px; border-radius: 10px; color: #fff; font-weight: 600; font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,.15); animation: cm-slide-in .22s ease; font-family: 'DM Sans',sans-serif; max-width: 320px; }
@keyframes cm-slide-in { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:none } }
.cm-color-row { display: flex; gap: 10px; align-items: center; }
.cm-color-row input[type=color] { width: 40px; height: 36px; border: 1.5px solid var(--cm-border); border-radius: 8px; padding: 2px; cursor: pointer; background: var(--cm-surface); }
`

export default function ClassicMazeBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    total_levels: 50,
    show_timer: 1,
    time_limit_seconds: 45,
    collectible_count: 3,
    collectible_label: '★',
    bg_color: '#0f172a',
    primary_color: '#6366f1',
    wall_color: '#64748b',
    path_color: '#ffffff',
    font_family: 'DM Sans',
    heading_1: '',
    heading_2: '',
    heading_3: '',
    intro_text: '',
    outro_text: 'All Mazes Complete!',
    continue_button_text: 'Continue →',
    is_active: 1,
  })

  const showToast = (msg, type = 'success') => setToast({ msg, type })

  const loadGame = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/classicmaze/${id}/settings`),
    ]).then(([gameRes, sRes]) => {
      const g = gameRes.data.game
      setGame(g)
      if (sRes.data?.settings) {
        const s = sRes.data.settings
        setSettings(prev => ({
          ...prev,
          total_levels: s.total_levels ?? prev.total_levels,
          show_timer: s.show_timer ?? prev.show_timer,
          time_limit_seconds: s.time_limit_seconds ?? prev.time_limit_seconds,
          collectible_count: s.collectible_count ?? prev.collectible_count,
          collectible_label: s.collectible_label ?? prev.collectible_label,
          bg_color: s.bg_color ?? prev.bg_color,
          primary_color: s.primary_color ?? prev.primary_color,
          wall_color: s.wall_color ?? prev.wall_color,
          path_color: s.path_color ?? prev.path_color,
          font_family: s.font_family ?? prev.font_family,
          heading_1: s.heading_1 ?? prev.heading_1,
          heading_2: s.heading_2 ?? prev.heading_2,
          heading_3: s.heading_3 ?? prev.heading_3,
          intro_text: s.intro_text ?? prev.intro_text,
          outro_text: s.outro_text ?? prev.outro_text,
          continue_button_text: s.continue_button_text ?? prev.continue_button_text,
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
        total_levels: parseInt(settings.total_levels) || 50,
        show_timer: settings.show_timer ? 1 : 0,
        time_limit_seconds: parseInt(settings.time_limit_seconds) || 0,
        collectible_count: parseInt(settings.collectible_count) || 3,
        collectible_label: settings.collectible_label || '★',
        bg_color: settings.bg_color || '#0f172a',
        primary_color: settings.primary_color || '#6366f1',
        wall_color: settings.wall_color || '#64748b',
        path_color: settings.path_color || '#ffffff',
        font_family: settings.font_family || 'DM Sans',
        heading_1: settings.heading_1 || '',
        heading_2: settings.heading_2 || '',
        heading_3: settings.heading_3 || '',
        intro_text: settings.intro_text || '',
        outro_text: settings.outro_text || '',
        continue_button_text: settings.continue_button_text || 'Continue →',
        is_active: settings.is_active ? 1 : 0,
      }
      const res = await api.put(`/classicmaze/${id}/settings`, payload)
      if (res.data?.settings) setSettings(prev => ({ ...prev, ...res.data.settings }))
      showToast('Settings saved')
    } catch (err) {
      showToast('Error: ' + (err.response?.data?.message || err.message), 'error')
    }
    setSaving(false)
  }

  const gameLink = game ? `${window.location.origin}/play/${game.slug}/${game.client_slug}` : ''

  if (loading) return (
    <div className="cm-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <style>{CSS}</style>
      <div style={{ textAlign: 'center', color: 'var(--cm-text2)' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e6f0', borderTopColor: '#6366f1', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
        Loading…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div className="cm-wrap"><style>{CSS}</style>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', background: '#fff', borderBottom: '1.5px solid var(--cm-border)', padding: '10px 28px', gap: '4px 20px', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <button className="cm-btn cm-btn-ghost" onClick={() => navigate('/dashboard/games')} style={{ padding: '6px 8px', fontSize: 16 }}>←</button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{game?.name || 'Untitled'}</div>
            <div style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--cm-text3)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Classic Maze Builder</div>
          </div>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--cm-primary)' }}>Game Settings</div>
        <div style={{ display: 'flex', gap: 6, justifySelf: 'end' }}>
          {gameLink && <a href={gameLink} target="_blank" rel="noreferrer" className="cm-btn cm-btn-ghost" style={{ padding: '6px 8px', fontSize: 16, textDecoration: 'none' }}>&#128065;</a>}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
        <div className="cm-card" style={{ padding: 20 }}>
          <div className="cm-section-title">Maze Gameplay</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <span className="cm-label">Total Levels</span>
              <input type="number" min={1} max={200} value={settings.total_levels} onChange={e => set('total_levels', parseInt(e.target.value) || 50)} />
            </div>
            <div>
              <span className="cm-label">Collectibles per Level</span>
              <input type="number" min={0} max={20} value={settings.collectible_count} onChange={e => set('collectible_count', parseInt(e.target.value) || 3)} />
            </div>
            <div>
              <span className="cm-label">Collectible Label / Emoji</span>
              <input value={settings.collectible_label} onChange={e => set('collectible_label', e.target.value)} placeholder="★" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!settings.show_timer} onChange={e => set('show_timer', e.target.checked ? 1 : 0)} style={{ width: 'auto' }} />
              <span className="cm-label" style={{ marginBottom: 0 }}>Show Timer</span>
            </div>
            {settings.show_timer ? (
              <div>
                <span className="cm-label">Time Limit (seconds, 0 = unlimited)</span>
                <input type="number" min={0} value={settings.time_limit_seconds} onChange={e => set('time_limit_seconds', parseInt(e.target.value) || 0)} />
              </div>
            ) : null}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!settings.is_active} onChange={e => set('is_active', e.target.checked ? 1 : 0)} style={{ width: 'auto' }} />
              <span className="cm-label" style={{ marginBottom: 0 }}>Active (game available to play)</span>
            </div>
          </div>

          <div className="cm-section-title" style={{ marginTop: 20 }}>Appearance</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <span className="cm-label">Background Color</span>
              <div className="cm-color-row">
                <input type="color" value={settings.bg_color} onChange={e => set('bg_color', e.target.value)} />
                <input value={settings.bg_color} onChange={e => set('bg_color', e.target.value)} />
              </div>
            </div>
            <div>
              <span className="cm-label">Primary / Accent Color</span>
              <div className="cm-color-row">
                <input type="color" value={settings.primary_color} onChange={e => set('primary_color', e.target.value)} />
                <input value={settings.primary_color} onChange={e => set('primary_color', e.target.value)} />
              </div>
            </div>
            <div>
              <span className="cm-label">Wall Color</span>
              <div className="cm-color-row">
                <input type="color" value={settings.wall_color} onChange={e => set('wall_color', e.target.value)} />
                <input value={settings.wall_color} onChange={e => set('wall_color', e.target.value)} />
              </div>
            </div>
            <div>
              <span className="cm-label">Path Color</span>
              <div className="cm-color-row">
                <input type="color" value={settings.path_color} onChange={e => set('path_color', e.target.value)} />
                <input value={settings.path_color} onChange={e => set('path_color', e.target.value)} />
              </div>
            </div>
            <div>
              <span className="cm-label">Font Family</span>
              <select value={settings.font_family} onChange={e => set('font_family', e.target.value)}>
                <option value="DM Sans">DM Sans</option>
                <option value="Inter">Inter</option>
                <option value="Poppins">Poppins</option>
                <option value="Roboto">Roboto</option>
                <option value="Nunito">Nunito</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Montserrat">Montserrat</option>
              </select>
            </div>
          </div>

          <div className="cm-section-title" style={{ marginTop: 20 }}>Text & Messaging</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <span className="cm-label">Heading 1 (Title)</span>
              <input value={settings.heading_1} onChange={e => set('heading_1', e.target.value)} placeholder="Classic Maze" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span className="cm-label">Heading 2 (Subtitle)</span>
              <input value={settings.heading_2} onChange={e => set('heading_2', e.target.value)} placeholder="Find your way out!" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span className="cm-label">Heading 3</span>
              <input value={settings.heading_3} onChange={e => set('heading_3', e.target.value)} placeholder="Swipe or use arrow keys" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span className="cm-label">Intro Text</span>
              <textarea rows={3} value={settings.intro_text} onChange={e => set('intro_text', e.target.value)} placeholder="Instructions shown before the game starts..." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span className="cm-label">Outro Text (Game Complete)</span>
              <input value={settings.outro_text} onChange={e => set('outro_text', e.target.value)} placeholder="All Mazes Complete!" />
            </div>
            <div>
              <span className="cm-label">Continue Button Text</span>
              <input value={settings.continue_button_text} onChange={e => set('continue_button_text', e.target.value)} placeholder="Continue →" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="cm-btn cm-btn-primary" onClick={saveSettings} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
          </div>
        </div>
      </div>

      {toast && <div className="cm-toast" style={{ background: toast.type === 'success' ? '#16a34a' : '#dc2626' }} onClick={() => setToast(null)}>{toast.msg}</div>}
    </div>
  )
}
