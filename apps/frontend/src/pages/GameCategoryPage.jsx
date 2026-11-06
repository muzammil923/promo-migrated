import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import GameModal from '../components/GameModal'
import PlayerNavbar from '../components/PlayerNavbar'
import LogoLoader from '../components/LogoLoader'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.gc-page{min-height:100vh;background:radial-gradient(ellipse at 50% 0%,#2a1a4e 0%,#1a1228 40%,#0d0c1a 100%);font-family:'DM Sans',sans-serif;color:#fff;padding:120px 24px 60px}
.gc-container{max-width:1200px;margin:0 auto}
.gc-header{text-align:center;margin-bottom:48px}
.gc-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:100px;background:rgba(146,16,246,0.12);border:1px solid rgba(146,16,246,0.25);font-size:12px;font-weight:600;color:#c084ff;margin-bottom:16px;letter-spacing:.5px;text-transform:uppercase}
.gc-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(36px,6vw,56px);letter-spacing:3px;line-height:1.1;margin-bottom:12px;background:linear-gradient(135deg,#fff 30%,#c084ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.gc-subtitle{font-size:16px;color:rgba(255,255,255,0.55);max-width:600px;margin:0 auto}
.gc-count{font-size:14px;color:rgba(255,255,255,0.4);margin-top:8px}
.gc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
.gc-card{border-radius:14px;overflow:hidden;cursor:pointer;position:relative;transition:transform .22s cubic-bezier(.22,1,.36,1),box-shadow .22s;animation:gcIn .35s cubic-bezier(.22,1,.36,1) both}
.gc-card:hover{transform:scale(1.05);box-shadow:0 12px 40px rgba(146,16,246,0.3),0 0 0 2px rgba(146,16,246,0.5)}
@keyframes gcIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:none}}
.gc-thumb{width:100%;aspect-ratio:2/3;object-fit:cover;display:block}
.gc-fallback{width:100%;aspect-ratio:2/3;display:flex;align-items:center;justify-content:center;font-size:48px;background:linear-gradient(135deg,rgba(146,16,246,0.3),rgba(97,4,151,0.15))}
.gc-cat{position:absolute;top:8px;right:8px;font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:3px 8px;border-radius:100px;background:rgba(10,5,20,0.75);border:1px solid rgba(146,16,246,0.4);color:#c084fc;backdrop-filter:blur(6px)}
.gc-body{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(5,2,12,0.95) 0%,rgba(5,2,12,0.7) 60%,transparent 100%);padding:40px 10px 10px}
.gc-name{font-size:14px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px}
.gc-meta{font-size:11px;color:rgba(255,255,255,0.5);display:flex;align-items:center;gap:4px}
.gc-play-overlay{position:absolute;inset:0;background:rgba(146,16,246,0.12);opacity:0;transition:opacity .22s;display:flex;align-items:center;justify-content:center}
.gc-card:hover .gc-play-overlay{opacity:1}
.gc-play-ico{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.95);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.5);transform:scale(0.5);transition:transform .25s cubic-bezier(.34,1.56,.64,1);margin-bottom:40px}
.gc-card:hover .gc-play-ico{transform:scale(1)}
.gc-loading{display:flex;align-items:center;justify-content:center;gap:12px;padding:80px 20px;font-size:14px;color:rgba(255,255,255,0.5)}
.gc-empty{text-align:center;padding:80px 20px}
.gc-empty-ico{font-size:48px;margin-bottom:16px}
.gc-empty-txt{font-size:15px;color:rgba(255,255,255,0.5);line-height:1.7}
.gc-back{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:rgba(255,255,255,0.5);text-decoration:none;margin-bottom:24px;transition:color .2s}
.gc-back:hover{color:#fff}
.gc-footer{border-top:1px solid rgba(255,255,255,0.07);margin-top:60px;padding:24px 6%;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:12px;color:rgba(255,255,255,0.3)}
.gc-footer a{color:rgba(255,255,255,0.3);text-decoration:none;transition:color .2s}
.gc-footer a:hover{color:#fff}
@media(max-width:640px){
  .gc-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
}
`

const CATEGORY_META = {
  'free-online-games':    { emoji: '🎮', title: 'Free Online Games', desc: 'Play the best free online games — no downloads, no sign-ups, just instant fun.' },
  'browser-games':        { emoji: '🌐', title: 'Browser Games', desc: 'Games that run right in your browser — zero installs, maximum fun.' },
  'html5-games':          { emoji: '⚡', title: 'HTML5 Games', desc: 'Modern HTML5 games that work on any device, anywhere.' },
  'action-games':         { emoji: '💥', title: 'Action Games', desc: 'Fast-paced action games that test your reflexes and skill.' },
  'arcade-games':         { emoji: '🕹️', title: 'Arcade Games', desc: 'Classic arcade-style games — nostalgic fun with a modern twist.' },
  'puzzle-games':         { emoji: '🧩', title: 'Puzzle Games', desc: 'Brain-teasing puzzles that challenge your mind and keep you hooked.' },
  'racing-games':         { emoji: '🏎️', title: 'Racing Games', desc: 'High-speed racing games — compete, dodge, and reach the finish line.' },
  'sports-games':         { emoji: '⚽', title: 'Sports Games', desc: 'Virtual sports games — score goals, hit homers, and win matches.' },
  'adventure-games':      { emoji: '🗺️', title: 'Adventure Games', desc: 'Explore new worlds and embark on exciting adventures.' },
  'board-games':          { emoji: '🎲', title: 'Board Games', desc: 'Digital versions of classic board games — play anytime.' },
  'card-games':           { emoji: '🃏', title: 'Card Games', desc: 'Strategy card games — match, stack, and outsmart.' },
  'strategy-games':       { emoji: '🧠', title: 'Strategy Games', desc: 'Plan, build, and conquer with strategic thinking.' },
  'memory-games':         { emoji: '🧠', title: 'Memory Games', desc: 'Test and improve your memory with fun matching challenges.' },
  'word-games':           { emoji: '📝', title: 'Word Games', desc: 'Scramble, spell, and solve — word games for every level.' },
  'math-games':           { emoji: '🔢', title: 'Math Games', desc: 'Fun math challenges that make numbers exciting.' },
  'logic-games':          { emoji: '💡', title: 'Logic Games', desc: 'Logical reasoning games that sharpen your problem-solving skills.' },
  'multiplayer-games':    { emoji: '👥', title: 'Multiplayer Games', desc: 'Play against friends and other players in real-time.' },
  'new-games':            { emoji: '🆕', title: 'New Games', desc: 'Freshly added games — be the first to play!' },
  'popular-games':        { emoji: '🔥', title: 'Popular Games', desc: 'The most played games on PromoGames right now.' },
  'trending-games':       { emoji: '📈', title: 'Trending Games', desc: 'Games that are trending — jump in before everyone else!' },
}

export default function GameCategoryPage() {
  const { categorySlug } = useParams()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeGame, setActiveGame] = useState(null)

  const meta = CATEGORY_META[categorySlug] || {
    emoji: '🎮',
    title: categorySlug?.replace(/-/g, ' ') || 'Games',
    desc: 'Browse our collection of fun games.',
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)
    fetch('/api/play/play-page-games')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const all = [...(d.featured || []), ...(d.promogames || []), ...(d.games || [])]
          const filtered = all.filter(g => {
            const cat = (g.category || '').toLowerCase().replace(/\s+/g, '-')
            return cat === categorySlug || g.category?.toLowerCase() === categorySlug?.replace(/-/g, ' ')
          })
          setGames(filtered.length > 0 ? filtered : all)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [categorySlug])

  const handlePlay = useCallback((game) => setActiveGame(game), [])
  const handleSwitch = useCallback((game) => setActiveGame(game), [])
  const handleClose = useCallback(() => setActiveGame(null), [])

  return (
    <>
      <style>{CSS}</style>
      <PlayerNavbar />
      <div className="gc-page">
        <div className="gc-container">
          <a href="/arcade" className="gc-back">← Back to Arcade</a>

          <div className="gc-header">
            <div className="gc-badge">{meta.emoji} {categorySlug?.replace(/-/g, ' ')}</div>
            <h1 className="gc-title">{meta.title}</h1>
            <p className="gc-subtitle">{meta.desc}</p>
            {!loading && <p className="gc-count">{games.length} game{games.length !== 1 ? 's' : ''} available</p>}
          </div>

          {loading ? (
            <div className="gc-loading"><LogoLoader size={24} /> Loading games…</div>
          ) : games.length === 0 ? (
            <div className="gc-empty">
              <div className="gc-empty-ico">🎮</div>
              <div className="gc-empty-txt">No games found in this category yet.<br />Check back soon!</div>
            </div>
          ) : (
            <div className="gc-grid">
              {games.map((game, i) => (
                <div
                  key={game.id}
                  className="gc-card"
                  style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}
                  onClick={() => handlePlay(game)}
                >
                  {game.game_logo_url || game.bg_image_url
                    ? <img className="gc-thumb" src={game.game_logo_url || game.bg_image_url} alt={game.name} loading="lazy" />
                    : <div className="gc-fallback">🎮</div>
                  }
                  <span className="gc-cat">{game.category || 'Game'}</span>
                  <div className="gc-body">
                    <div className="gc-name">{game.name}</div>
                    <div className="gc-meta">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      {(game.play_count || 0).toLocaleString()} plays
                    </div>
                  </div>
                  <div className="gc-play-overlay">
                    <div className="gc-play-ico">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#9210f6"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="gc-footer">
          <p>© 2026 Promogames. Fun Games. Exciting Gifts.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/terms">Terms</a><span>|</span><a href="/privacy">Privacy</a>
          </div>
        </div>
      </div>

      {activeGame && (
        <GameModal
          game={activeGame}
          allGames={games}
          onClose={handleClose}
          onSwitch={handleSwitch}
          isLoggedIn={!!(localStorage.getItem('playerToken') || sessionStorage.getItem('playerToken'))}
        />
      )}
    </>
  )
}
