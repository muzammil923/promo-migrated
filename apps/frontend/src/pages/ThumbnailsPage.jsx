import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api'

const CSS = `
.tn *,.tn *::before,.tn *::after{box-sizing:border-box;margin:0;padding:0}
.tn{font-family:'DM Sans',sans-serif;color:var(--text);background:var(--bg-secondary);min-height:100vh}
@keyframes tnFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes tnSpin{to{transform:rotate(360deg)}}
@keyframes tnToast{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.tn-wrap{max-width:1280px;margin:0 auto;padding:28px 32px}
.tn-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:22px}
.tn-title{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px}
.tn-h1{font-family:'poppins',sans-serif;font-weight:800;font-size:26px;color:var(--text);letter-spacing:-.02em;line-height:1}
.tn-sub{font-size:13px;color:var(--text3);margin-top:6px}
.tn-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.tn-search{position:relative}
.tn-search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none}
.tn-search input{width:260px;padding:9px 12px 9px 34px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;color:var(--text);background:var(--surface2);outline:none;transition:border-color .14s}
.tn-search input:focus{border-color:var(--primary);background:var(--surface)}
.tn-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:9px;border:1.5px solid var(--border);background:var(--surface);color:var(--text2);font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .13s;white-space:nowrap}
.tn-btn:hover{background:var(--surface2);color:var(--text)}
.tn-btn:disabled{opacity:.5;cursor:not-allowed}
.tn-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}
.tn-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;animation:tnFadeUp .3s ease both;transition:box-shadow .18s,transform .18s}
.tn-card:hover{box-shadow:0 10px 30px rgba(124,111,247,.1);transform:translateY(-2px)}
.tn-thumb{position:relative;aspect-ratio:16/10;background:var(--surface2);display:flex;align-items:center;justify-content:center;overflow:hidden}
.tn-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.tn-placeholder{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--text3)}
.tn-placeholder .tn-emoji{font-size:34px;filter:saturate(.6) opacity(.6)}
.tn-body{padding:12px 14px}
.tn-name{font-size:13.5px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tn-cat{font-size:11px;font-weight:600;color:var(--text3);text-transform:capitalize;margin-top:3px}
.tn-actions{display:flex;gap:8px;margin-top:12px}
.tn-upload{flex:1;padding:8px;border-radius:9px;border:none;background:var(--primary);color:#fff;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity .13s}
.tn-upload:hover{opacity:.88}
.tn-upload:disabled{opacity:.5;cursor:not-allowed}
.tn-del{padding:8px 10px;border-radius:9px;border:1.5px solid var(--error-border);background:var(--error-bg);color:var(--error);font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .13s}
.tn-del:hover{background:var(--error-border)}
.tn-del:disabled{opacity:.5;cursor:not-allowed}
.tn-empty{text-align:center;padding:60px 20px;color:var(--text3);font-size:14px}
.tn-spin{width:15px;height:15px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:tnSpin .7s linear infinite}
.tn-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;color:#fff;z-index:500;box-shadow:0 10px 30px rgba(0,0,0,.25);animation:tnToast .2s ease}
.tn-toast.ok{background:#059669}
.tn-toast.err{background:#DC2626}
@media(max-width:600px){.tn-wrap{padding:20px 16px}.tn-search input{width:100%}.tn-toolbar{width:100%}}
`

const CAT_EMOJI = {
  quiz:'🧠', survey:'📋', poll:'📊', registration:'📝', crossword:'🔤', spin:'🎡', memory:'🃏',
  jigsaw:'🧩', wordsearch:'🔍', pouring:'💧', typer:'⌨️', screw:'🔩', math:'🔢', maze:'🌀',
  '2048':'🔢', snake:'🐍', catch:'🧺', reaction:'⚡', simon:'🎯', flappy:'🐦', bounce:'🏀',
  space:'🚀', connect4:'🔴', bejeweled:'💎', tetris:'🧱', stack:'📦', bowling:'🎳', sudoku:'🔢',
  minesweeper:'💣', wordscramble:'🔤', rps:'✊', whackamole:'🔨', hanoi:'🗼', breakout:'🧱',
  bubbleshooter:'🫧', carlaunch:'🏎️', arrowescape:'➡️', stressbuster:'😤', soundify:'🔊',
  tictactoe:'❌', chess:'♟️', blockblaster:'💥', candyblast:'🍬', Carrom:'🎯', classicmaze:'🏰', stickmaze:'🪵',
  ludo:'🎲', snakeandladder:'🪜', tictactoemultiplayer:'🎮',
}
const catEmoji = c => CAT_EMOJI[c] || '🎮'

export default function ThumbnailsPage() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const fileRefs = useRef({})

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2600)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/games')
      setGames(data.games || [])
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load games', false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = games.filter(g =>
    !q || (g.name || '').toLowerCase().includes(q.toLowerCase())
  )
  const withThumb = games.filter(g => g.thumbnail_url).length

  const pickFile = id => fileRefs.current[id]?.click()

  const handleFile = async (game, e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Please choose an image file', false); return }
    setBusyId(game.id)
    try {
      const fd = new FormData()
      fd.append('thumbnail', file)
      const { data } = await api.put(`/games/${game.id}/thumbnail`, fd)
      setGames(gs => gs.map(g => g.id === game.id ? { ...g, thumbnail_url: data.thumbnail_url } : g))
      showToast('Thumbnail updated')
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed', false)
    } finally {
      setBusyId(null)
    }
  }

  const removeThumb = async game => {
    setBusyId(game.id)
    try {
      await api.delete(`/games/${game.id}/thumbnail`)
      setGames(gs => gs.map(g => g.id === game.id ? { ...g, thumbnail_url: null } : g))
      showToast('Thumbnail removed')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove thumbnail', false)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="tn">
      <style>{CSS}</style>
      <div className="tn-wrap">
        <div className="tn-head">
          <div>
            <div className="tn-title">Media Library</div>
            <div className="tn-h1">Game Thumbnails</div>
            <div className="tn-sub">{games.length} games · {withThumb} with thumbnail</div>
          </div>
          <div className="tn-toolbar">
            <div className="tn-search">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input placeholder="Search games…" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <button className="tn-btn" onClick={load} disabled={loading}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="tn-empty">Loading games…</div>
        ) : filtered.length === 0 ? (
          <div className="tn-empty">{games.length === 0 ? 'No games yet.' : `No games match “${q}”.`}</div>
        ) : (
          <div className="tn-grid">
            {filtered.map((g, i) => {
              const busy = busyId === g.id
              return (
                <div key={g.id} className="tn-card" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                  <div className="tn-thumb">
                    <div className="tn-placeholder" style={g.thumbnail_url ? { position: 'absolute', inset: 0 } : undefined}>
                      <span className="tn-emoji">{catEmoji(g.category)}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.05em' }}>NO THUMBNAIL</span>
                    </div>
                    {g.thumbnail_url && (
                      <img src={g.thumbnail_url} alt={g.name} style={{ position: 'absolute', inset: 0 }} onError={e => { e.currentTarget.style.display = 'none' }} />
                    )}
                  </div>
                  <div className="tn-body">
                    <div className="tn-name" title={g.name}>{g.name}</div>
                    <div className="tn-cat">{g.category || 'game'}</div>
                    <div className="tn-actions">
                      <button className="tn-upload" disabled={busy} onClick={() => pickFile(g.id)}>
                        {busy ? <span className="tn-spin" /> : (
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></svg>
                        )}
                        {g.thumbnail_url ? (busy ? 'Uploading…' : 'Change') : (busy ? 'Uploading…' : 'Upload')}
                      </button>
                      <input
                        ref={el => { fileRefs.current[g.id] = el }}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleFile(g, e)}
                      />
                      {g.thumbnail_url && (
                        <button className="tn-del" title="Remove thumbnail" disabled={busy} onClick={() => removeThumb(g)}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {toast && <div className={`tn-toast ${toast.ok ? 'ok' : 'err'}`}>{toast.msg}</div>}
    </div>
  )
}
