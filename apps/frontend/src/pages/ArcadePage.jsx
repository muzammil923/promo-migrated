import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import GameModal from '../components/GameModal'
import PlayerNavbar from '../components/PlayerNavbar'
import LogoLoader from '../components/LogoLoader'
import MascotBubble from '../components/MascotBubble'
import MascotCursor from '../components/MascotCursor'
import GuestGuide from '../components/GuestGuide'

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#07040f;
  --bg2:#0d0820;
  --purple:#9210f6;
  --purple2:#610497;
  --purple3:#7C3AED;
  --accent:#c040ff;
  --gold:#f5c842;
  --glass:rgba(255,255,255,0.05);
  --gb:rgba(255,255,255,0.10);
  --muted:rgba(255,255,255,0.52);
  --fh:'Bebas Neue',sans-serif;
  --fb:'DM Sans',sans-serif;
  --fm:'Space Mono',monospace;
}
html{scroll-behavior:smooth}
body{font-family:var(--fb);background:var(--bg);color:#fff;overflow-x:hidden;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%}
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-track{background:rgba(255,255,255,0.03)}
::-webkit-scrollbar-thumb{background:rgba(146,16,246,0.4);border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:rgba(146,16,246,0.6)}

.arc-scroll-bar{position:fixed;top:0;left:0;height:3px;z-index:9999;background:linear-gradient(90deg,var(--purple),var(--purple3));width:var(--scroll-pct,0%);transition:width .05s linear;box-shadow:0 0 10px var(--purple)}

.arc-container{max-width:100%;margin:0;padding:0}
.arc-content{padding-top:120px}

.arc-featured{padding:40px 0 24px}
.arc-featured > .arc-container{max-width:1720px;margin:0 auto;padding:0 10px}
.arc-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.arc-section-title{font-family:var(--fh);font-size:24px;font-weight:400;letter-spacing:3px;color:#fff;text-transform:uppercase}
.arc-view-all{display:inline-flex;align-items:center;gap:6px;font-family:var(--fb);font-size:14px;font-weight:600;color:var(--accent);text-decoration:none;transition:gap .2s}
.arc-view-all:hover{gap:10px}
.arc-featured-scroll{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:12px;margin:0;padding-left:0;padding-right:0}
.arc-featured-card{flex:0 0 auto;width:280px;scroll-snap-align:start;border-radius:16px;overflow:hidden;cursor:pointer;background:#171a23;border:1px solid rgba(255,255,255,0.08);transition:transform .3s,box-shadow .3s,border-color .3s}
.arc-featured-card:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(0,0,0,0.6),0 0 0 1px rgba(146,16,246,0.4);border-color:rgba(146,16,246,0.5)}
.arc-featured-thumb{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:linear-gradient(150deg,rgba(146,16,246,0.25),rgba(97,4,151,0.12))}
.arc-featured-thumb img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
.arc-featured-card:hover .arc-featured-thumb img{transform:scale(1.1)}
.arc-featured-info{padding:14px 16px}
.arc-featured-name{font-family:var(--fb);font-size:15px;font-weight:700;color:#fff;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.arc-featured-meta{font-size:12px;color:rgba(255,255,255,0.5);display:flex;align-items:center;gap:8px}
.arc-featured-cat{font-family:var(--fm);font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 10px;border-radius:100px;background:rgba(146,16,246,0.2);border:1px solid rgba(146,16,246,0.4);color:#c084fc}

.arc-grid-section{padding:0 0 5px}
.arc-grid-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:12px}
.arc-grid-label{font-family:var(--fh);font-size:clamp(20px,2.4vw,30px);font-weight:400;letter-spacing:2px;color:#fff;display:flex;align-items:center;gap:12px}
.arc-grid-count{font-family:var(--fm);font-size:11px;color:var(--muted);letter-spacing:1px}

/* ── Play grid — CrazyGames-style mixed tiles ─────────────────── */
/* Fluid container: scales with the viewport up to a readable cap, so the
   grid adapts to any resolution (small laptops → ultrawide / 4K). */
.arc-grid-section > .arc-container{max-width:1720px;margin:0 auto;padding:0 10px;container-type:inline-size}
.pg-grid{display:grid;grid-template-columns:repeat(12,1fr);grid-auto-flow:row dense;gap:clamp(10px,1.1vw,18px)}
/* row heights in cqw (% of container width) keep every tile proportional at any size */
.pg-grid{grid-auto-rows:176px;grid-auto-rows:16.5cqw}
.pg-tile{position:relative;border-radius:16px;overflow:hidden;cursor:pointer;background:#171a23;border:1px solid rgba(255,255,255,0.07);text-decoration:none;animation:pgIn .45s cubic-bezier(.22,1,.36,1) both;transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s,border-color .25s}
.pg-tile:hover{transform:translateY(-4px);box-shadow:0 20px 48px rgba(0,0,0,0.6),0 0 0 1px rgba(146,16,246,0.4);border-color:rgba(146,16,246,0.5);z-index:3}
@keyframes pgIn{from{opacity:0;transform:translateY(16px) scale(0.96)}to{opacity:1;transform:none}}
.pg-tile-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s cubic-bezier(.22,1,.36,1)}
.pg-tile:hover .pg-tile-bg{transform:scale(1.07)}
.pg-tile-fallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:42px;background:linear-gradient(150deg,rgba(146,16,246,0.32),rgba(97,4,151,0.16))}
.pg-tile-shade{position:absolute;inset:0;background:linear-gradient(to top,rgba(8,10,16,0.9) 0%,rgba(8,10,16,0.42) 38%,rgba(8,10,16,0.05) 60%)}
.pg-tile-cat{position:absolute;top:10px;left:10px;z-index:2;font-family:var(--fm);font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 10px;border-radius:100px;background:rgba(8,8,16,0.62);border:1px solid rgba(255,255,255,0.16);color:rgba(255,255,255,0.85);backdrop-filter:blur(6px)}
.pg-tile-info{position:absolute;left:0;right:0;bottom:0;padding:14px;z-index:2}
.pg-tile-name{font-family:var(--fb);font-size:13.5px;font-weight:700;color:#fff;line-height:1.28;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 2px 10px rgba(0,0,0,0.6)}
.pg-tile-meta{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.6);margin-top:4px}
.pg-tile-meta svg{width:9px;height:9px;flex-shrink:0;color:rgba(255,255,255,0.4)}
.pg-tile-play{position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;background:rgba(8,10,16,0.34);opacity:0;transition:opacity .22s}
.pg-tile:hover .pg-tile-play{opacity:1}
.pg-tile-play-btn{width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,0.97);display:grid;place-items:center;box-shadow:0 6px 24px rgba(0,0,0,0.55);transform:scale(0.5) translateY(8px);transition:transform .28s cubic-bezier(.34,1.56,.64,1)}
.pg-tile:hover .pg-tile-play-btn{transform:scale(1) translateY(0)}
.pg-tile:focus-visible,.arc-featured-card:focus-visible{outline:2.5px solid #c084fc;outline-offset:3px}

/* hero placements — 12-column layout:
   1 big square · vertical 2-stack · 1 wide tile · 3 small · 4 medium */
.pg-h0{grid-column:1 / span 4;grid-row:1 / span 2}
.pg-h1{grid-column:5 / span 2;grid-row:1}
.pg-h2{grid-column:5 / span 2;grid-row:2}
.pg-h3{grid-column:7 / span 6;grid-row:1}
.pg-h4{grid-column:7 / span 2;grid-row:2}
.pg-h5{grid-column:9 / span 2;grid-row:2}
.pg-h6{grid-column:11 / span 2;grid-row:2}
.pg-h7{grid-column:1 / span 3;grid-row:3}
.pg-h8{grid-column:4 / span 3;grid-row:3}
.pg-h9{grid-column:7 / span 3;grid-row:3}
.pg-h10{grid-column:10 / span 3;grid-row:3}
.pg-rest{grid-column:span 2}

/* big-tile typography */
.pg-h0 .pg-tile-info{padding:18px}
.pg-h0 .pg-tile-name{font-family:var(--fh);font-weight:400;font-size:clamp(24px,2.4vw,32px);letter-spacing:1.5px;line-height:1.02}
.pg-h0 .pg-tile-meta{font-size:12.5px}
.pg-h3 .pg-tile-name{font-size:17px}
.pg-rest .pg-tile-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;-webkit-line-clamp:unset}

@media(max-width:1024px){
  .pg-grid{grid-template-columns:repeat(6,1fr);gap:clamp(10px,1.5vw,14px)}
  .pg-grid{grid-auto-rows:118px;grid-auto-rows:24cqw}
  .pg-h0{grid-column:1 / span 4;grid-row:1 / span 2}
  .pg-h1{grid-column:5 / span 2;grid-row:1}
  .pg-h2{grid-column:5 / span 2;grid-row:2}
  .pg-h3{grid-column:1 / span 6;grid-row:3}
  .pg-h4{grid-column:1 / span 3;grid-row:4}
  .pg-h5{grid-column:4 / span 3;grid-row:4}
  .pg-h6{grid-column:1 / span 3;grid-row:5}
  .pg-h7{grid-column:4 / span 3;grid-row:5}
  .pg-h8{grid-column:1 / span 3;grid-row:6}
  .pg-h9{grid-column:4 / span 3;grid-row:6}
  .pg-h10{grid-column:1 / span 6;grid-row:7}
  .pg-rest{grid-column:span 2}
}
@media(max-width:640px){
  .pg-grid{grid-template-columns:repeat(4,1fr);gap:clamp(6px,2.2vw,10px)}
  .pg-grid{grid-auto-rows:88px;grid-auto-rows:25cqw}
  .pg-h0{grid-column:1 / span 2;grid-row:1 / span 2}
  .pg-h1{grid-column:3 / span 2;grid-row:1}
  .pg-h2{grid-column:3;grid-row:2}
  .pg-h3{grid-column:4;grid-row:2}
  .pg-h4{grid-column:1 / span 2;grid-row:3}
  .pg-h5{grid-column:3;grid-row:3}
  .pg-h6{grid-column:4;grid-row:3}
  .pg-h7{grid-column:1;grid-row:4}
  .pg-h8{grid-column:2;grid-row:4}
  .pg-h9{grid-column:3 / span 2;grid-row:4}
  .pg-h10{grid-column:1 / span 4;grid-row:5}
  .pg-rest{grid-column:span 1}
  .pg-rest:nth-child(3n+12){grid-column:span 2}
  .pg-tile{border-radius:12px}
  .pg-tile-info{padding:10px}
  .pg-h0 .pg-tile-info{padding:14px}
  .pg-h0 .pg-tile-name{font-size:clamp(18px,5.5vw,24px)}
}

.arc-empty{text-align:center;padding:90px 20px}
.arc-empty-ico{font-size:46px;margin-bottom:14px;opacity:.9}
.arc-empty-txt{font-family:var(--fb);font-size:15px;color:var(--muted);line-height:1.7}
.arc-loading{display:flex;align-items:center;justify-content:center;gap:12px;padding:140px 20px 80px;font-family:var(--fb);font-size:14px;color:var(--muted)}

@media(max-width:768px){
  .arc-content{padding-top:84px}
  .arc-featured{padding:24px 0 16px}
  .arc-featured-card{width:220px}
  .arc-featured-scroll{margin:0;padding-left:0;padding-right:0;gap:12px}
  .arc-grid-section{padding:0 0 5px}
  .arc-grid-head{flex-direction:column;align-items:flex-start}
}

@media(max-width:400px){
  .arc-content{padding-top:76px}
  .arc-featured-card{width:180px}
  .arc-section-title{font-size:20px}
}
`

const HERO_SIZES = ['pg-h0','pg-h1','pg-h2','pg-h3','pg-h4','pg-h5','pg-h6','pg-h7','pg-h8','pg-h9','pg-h10']

function PlayTile({ game, sizeClass, delay, onPlay, eager }) {
  const thumb = game.thumbnail_url || game.game_logo_url || game.bg_image_url
  const activate = () => onPlay(game)
  return (
    <div
      className={`pg-tile ${sizeClass}`}
      style={{ animationDelay: `${delay}ms` }}
      role="button" tabIndex={0} aria-label={`Play ${game.name}`}
      onClick={activate}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate() } }}
    >
      {thumb ? (
        <img className="pg-tile-bg" src={thumb} alt={game.name} decoding="async"
          loading={eager ? 'eager' : 'lazy'} {...(eager ? { fetchPriority: 'high' } : {})} />
      ) : (
        <>
          <div className="pg-tile-fallback">🎮</div>
          <div className="pg-tile-shade" />
          <span className="pg-tile-cat">{game.category || 'Game'}</span>
          <div className="pg-tile-info">
            <div className="pg-tile-name">{game.name}</div>
            <div className="pg-tile-meta">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>{(game.play_count || 0).toLocaleString()} plays</span>
            </div>
          </div>
        </>
      )}
      {thumb && (game.play_count > 0 || game.high_score > 0) && (
        <div className="pg-tile-info">
          <div className="pg-tile-meta">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>{(game.play_count || 0).toLocaleString()}</span>
            {game.high_score > 0 && (
              <><svg width="10" height="10" viewBox="0 0 24 24" fill="#f5c842"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 6.9L12 17.3 5.7 20.8l1.7-6.9-5.4-4.7 7.1-.6z"/></svg>
              <span style={{ color:'#f5c842' }}>{game.high_score.toLocaleString()}</span></>
            )}
          </div>
        </div>
      )}
      <div className="pg-tile-play">
        <div className="pg-tile-play-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#9210f6"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      </div>
    </div>
  )
}


// Module-level cache — arcade revisits within a session render instantly
// from the last payload while a background refresh updates the numbers.
let gamesCache = null

export default function ArcadePage() {
  const location = useLocation()
  const [featured, setFeatured] = useState(() => gamesCache?.featured || [])
  const [promogames, setPromogames] = useState(() => gamesCache?.promogames || [])
  const [loading, setLoading] = useState(!gamesCache)
  const [error, setError] = useState(false)
  const [activeGame, setActiveGame] = useState(null)
  const [showWelcome, setShowWelcome] = useState(location.state?.welcomeBonus === true)
  const featuredRef = useRef(null)

  useEffect(() => {
    if (location.state?.welcomeBonus) {
      window.history.replaceState({}, document.title)
    }
  }, [])

  const loadGames = useCallback(async (signal) => {
    setError(false)
    try {
      const r = await fetch('/api/play/play-page-games', { signal, cache: 'no-store' })
      const d = await r.json()
      if (!d.success) throw new Error('bad payload')
      gamesCache = { featured: d.featured || [], promogames: d.promogames || [] }
      setFeatured(gamesCache.featured)
      setPromogames(gamesCache.promogames)
    } catch (err) {
      if (err?.name !== 'AbortError' && !gamesCache) setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    loadGames(ac.signal)
    return () => ac.abort()
  }, [loadGames])

  useEffect(() => {
    // rAF-batched so layout is read at most once per frame
    let ticking = false
    const update = () => {
      ticking = false
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100
      document.documentElement.style.setProperty('--scroll-pct', `${pct}%`)
    }
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update) }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Game iframe tells us when a guest logs in/registers → close the game,
  // refresh counts, and celebrate the welcome bonus for fresh registrations.
  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type !== 'pg:auth') return
      setActiveGame(null) // back to the arcade after "You're in!"
      loadGames()
      if (e.data.registered) setShowWelcome(true)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [loadGames])

  const handlePlay = useCallback((game) => setActiveGame(game), [])
  // Refreshing the underlying game counts in place (loadGames only setState's the
  // numbers — the grid/modal never reload) right after switching or closing a game,
  // so the "N plays" shown reflects the latest play.
  const handleSwitch = useCallback((game) => { setActiveGame(game); loadGames() }, [loadGames])
  const handleClose = useCallback(() => { setActiveGame(null); loadGames() }, [loadGames])

  // Keep arcade grid fresh while a game modal is open
  useEffect(() => {
    if (!activeGame) return
    const interval = setInterval(() => loadGames(), 15000)
    return () => clearInterval(interval)
  }, [activeGame, loadGames])

  const allGames = [...featured, ...promogames]

  return (
    <>
      <style>{CSS}</style>
      <MascotBubble />
      <MascotCursor />
      <div className="arc-scroll-bar" />

      <PlayerNavbar />

      <GuestGuide
        ready={!loading && promogames.length > 0 && !activeGame}
        sampleGame={promogames[0] || featured[0]}
        onPlay={handlePlay}
      />

      <div className="arc-content">
        {loading ? (
          <div className="arc-loading"><LogoLoader size={24} /> Loading games…</div>
        ) : (
          <>
            {/* FEATURED */}
            {featured.length > 0 && (
              <section className="arc-featured">
                <div className="arc-container">
                  <div className="arc-section-head">
                    <h2 className="arc-section-title">Featured Games</h2>
                    <a href="#all-games" className="arc-view-all">
                      View All <ChevronRight />
                    </a>
                  </div>
                  <div className="arc-featured-scroll" ref={featuredRef}>
                    {featured.map((game, i) => {
                      const hasThumb = game.thumbnail_url || game.game_logo_url || game.bg_image_url
                      return (
                        <div
                          className="arc-featured-card" key={game.id}
                          role="button" tabIndex={0} aria-label={`Play ${game.name}`}
                          onClick={() => handlePlay(game)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlay(game) } }}
                        >
                          <div className="arc-featured-thumb">
                            {hasThumb
                              ? <img src={hasThumb} alt={game.name} loading="lazy" />
                              : <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:44, background:'linear-gradient(150deg,rgba(146,16,246,0.35),rgba(97,4,151,0.18))' }}>🎮</div>
                            }
                          </div>
                          <div className="arc-featured-info">
                            <div className="arc-featured-name">{game.name}</div>
                            <div className="arc-featured-meta">
                              <span className="arc-featured-cat">{game.category || 'Quiz'}</span>
                              <span>{(game.play_count || 0).toLocaleString()} plays</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* ALL GAMES */}
            <section className="arc-grid-section" id="all-games">
              <div className="arc-container">
                <div className="arc-grid-head">
                  <div className="arc-grid-label">
                    All Games
                    <span className="arc-grid-count">{allGames.length} games</span>
                  </div>
                </div>

                {allGames.length === 0 ? (
                  <div className="arc-empty">
                    <div className="arc-empty-ico">🎮</div>
                    <div className="arc-empty-txt">
                      {error ? 'Couldn\'t load games.' : 'No games are live right now — check back soon!'}
                      {error && (
                        <><br /><button onClick={() => loadGames()} style={{
                          marginTop: 14, padding: '10px 22px', border: 'none', borderRadius: 10,
                          background: 'linear-gradient(135deg, #9210f6, #610497)', color: '#fff',
                          fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 700,
                          cursor: 'pointer',
                        }}>Retry</button></>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pg-grid">
                    {allGames.slice(0, 11).map((game, i) => (
                      <PlayTile key={game.id} game={game} sizeClass={HERO_SIZES[i]} delay={Math.min(i * 45, 360)} onPlay={handlePlay} eager={i < 4} />
                    ))}
                    {allGames.slice(11).map((game, i) => (
                      <PlayTile key={game.id} game={game} sizeClass="pg-rest" delay={Math.min(i * 25, 280)} onPlay={handlePlay} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {activeGame && (
        <GameModal
          game={activeGame}
          allGames={allGames}
          onClose={handleClose}
          onSwitch={handleSwitch}
          isLoggedIn={!!(localStorage.getItem('playerToken') || sessionStorage.getItem('playerToken'))}
        />
      )}

      {showWelcome && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(5,2,12,0.85)', backdropFilter: 'blur(12px)',
          animation: 'gmFadeIn 0.2s ease both',
        }}>
          <div style={{
            background: 'linear-gradient(160deg, #0d0820, #12082a)',
            border: '1px solid rgba(146,16,246,0.3)',
            borderRadius: 24, padding: '48px 40px 36px',
            maxWidth: 420, width: '90%', textAlign: 'center',
            boxShadow: '0 0 60px rgba(146,16,246,0.15), 0 24px 80px rgba(0,0,0,0.5)',
            animation: 'gmSlideUp 0.3s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 32,
              color: '#fff', letterSpacing: 2, marginBottom: 8,
            }}>Welcome Aboard!</h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 15,
              color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 24,
            }}>
              You've earned a bonus of{' '}
              <strong style={{ color: '#f5c842' }}>100 Promo Coins!</strong>
              {' '}Play more and earn more!
            </p>
            <button onClick={() => setShowWelcome(false)} style={{
              width: '100%', padding: '14px 24px',
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700,
              color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer',
              background: 'linear-gradient(135deg, #9210f6, #610497)',
              boxShadow: '0 4px 20px rgba(146,16,246,0.35)',
              transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(146,16,246,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(146,16,246,0.35)'; e.currentTarget.style.transform = 'none' }}
            >
              Let's Play!
            </button>
          </div>
        </div>
      )}
    </>
  )
}