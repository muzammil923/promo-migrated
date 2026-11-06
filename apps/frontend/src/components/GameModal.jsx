import { useState, useEffect, useRef } from 'react'
import ShareMenu from './ShareMenu'
import PromoCoinsWallet from './PromoCoinsWallet'
import LogoLoader from './LogoLoader'

// Persistent guest device identity — used to resolve personal best for guests.
function getDeviceId() {
  try {
    let id = localStorage.getItem('device_id')
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) || ('d-' + Date.now() + '-' + Math.random().toString(36).slice(2))
      localStorage.setItem('device_id', id)
    }
    return id
  } catch {
    return null
  }
}

const STYLES = `
  .gm-overlay{position:fixed;inset:0;z-index:8000;background:rgba(5,2,12,0.9);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:0;animation:gmFadeIn .2s ease both}
  @keyframes gmFadeIn{from{opacity:0}to{opacity:1}}
  .gm-modal{position:relative;width:100%;height:100dvh;display:flex;flex-direction:column;background:#0a0514;animation:gmSlideUp .28s cubic-bezier(.22,1,.36,1) both;overflow:hidden}
  @media(min-width:640px){
    .gm-modal{width:calc(100% - 48px);height:94dvh;max-width:1000px;border-radius:20px;border:1px solid rgba(146,16,246,0.25);box-shadow:0 40px 100px rgba(0,0,0,0.85),0 0 0 1px rgba(146,16,246,0.08)}
  }
  @keyframes gmSlideUp{from{opacity:0;transform:translateY(30px) scale(0.96)}to{opacity:1;transform:none}}
  .gm-bar{display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(10,5,20,0.98);border-bottom:1px solid rgba(146,16,246,0.15);flex-shrink:0;min-height:52px}
  .gm-bar-cat{font-family:'Karla',sans-serif;font-size:9.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:3px 10px;border-radius:100px;background:rgba(146,16,246,0.2);border:1px solid rgba(146,16,246,0.35);color:#c084fc;flex-shrink:0}
  .gm-bar-name{font-family:'Karla',sans-serif;font-size:15px;color:#fff;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .gm-bar-plays{font-family:'Karla',sans-serif;font-size:11px;color:rgba(255,255,255,0.58);display:flex;align-items:center;gap:4px;flex-shrink:0}
  .gm-close{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.13);color:rgba(255,255,255,0.7);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:15px;transition:background .2s,transform .2s,color .2s}
  .gm-close:hover{background:rgba(255,255,255,0.16);color:#fff;transform:rotate(90deg)}
  .gm-iframe-wrap{flex:1;position:relative;overflow:hidden;background:#0a0514;min-height:0}
  .gm-iframe{width:100%;height:100%;border:none;display:block}
  .gm-loader{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#0a0514;z-index:5;transition:opacity .35s,visibility .35s}
  .gm-loader.gone{opacity:0;visibility:hidden}
  .gm-loader-txt{font-family:'Karla',sans-serif;font-size:13px;color:rgba(255,255,255,0.58)}
  /* ── PromoCoins wallet pill (global top-right of the game header) ── */
  .gm-wallet{display:inline-flex;align-items:center;gap:5px;font-family:'Karla',sans-serif;font-size:11.5px;font-weight:700;color:#f5c842;background:rgba(245,200,66,0.10);border:1px solid rgba(245,200,66,0.32);padding:5px 10px;border-radius:100px;flex-shrink:0;line-height:1;cursor:default;user-select:none;box-shadow:inset 0 1px 0 rgba(255,255,255,0.06)}
  .gm-wallet-coin{width:14px;height:14px;object-fit:contain;filter:drop-shadow(0 0 6px rgba(245,200,66,0.55))}
  .gm-wallet-amount{font-variant-numeric:tabular-nums}
  .gm-wallet-label{font-size:8.5px;letter-spacing:.6px;color:rgba(245,200,66,0.78);text-transform:uppercase;font-weight:800}
  @media(max-width:480px){.gm-wallet{padding:5px 8px}.gm-wallet-label{display:none}}
  .gm-wallet--guest{color:rgba(245,200,66,0.45);border-color:rgba(245,200,66,0.16);background:rgba(245,200,66,0.05)}
  .gm-wallet--guest .gm-wallet-coin{filter:none;opacity:.55}
  .promo-wallet--pulse{animation:gmWalletPulse .62s ease}
  @keyframes gmWalletPulse{0%{transform:scale(1)}35%{transform:scale(1.24);background:rgba(245,200,66,0.30);border-color:#f5c842;box-shadow:0 0 20px rgba(245,200,66,0.6)}100%{transform:scale(1)}}
  /* ── Reward fly animation layer (coins → wallet) ── */
  .promo-reward-layer{position:fixed;inset:0;pointer-events:none;z-index:12000;overflow:hidden}
  .promo-reward-badge{position:absolute;left:0;top:0;font-family:'Karla',sans-serif;font-size:14px;font-weight:800;color:#1a0a26;background:linear-gradient(135deg,#fde68a,#f5c842);padding:8px 14px;border-radius:100px;box-shadow:0 8px 24px rgba(0,0,0,0.45),inset 0 0 0 1px rgba(255,255,255,0.45);white-space:nowrap;transition:transform .22s cubic-bezier(.22,1,.36,1),opacity .3s ease}
  .promo-reward-coin{position:absolute;left:0;top:0;width:28px;height:28px;object-fit:contain;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.45));will-change:transform,opacity}
  .promo-reward-coin--landed{transform:translate(-50%,-50%) scale(.3)!important;opacity:0!important}
  body.gm-pointer-in-iframe .mascot-cursor{opacity:0!important}
`

const MASCOT_CURSOR_SVG = `
  <svg viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gmMcGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e7b8ff"/>
        <stop offset="55%" stop-color="#9210f6"/>
        <stop offset="100%" stop-color="#5c0499"/>
      </linearGradient>
    </defs>
    <path d="M10 4 C6 2 2 6 4 11 L24 84 C26 91 35 92 38 85 L46 64 L66 80 C73 85 82 78 78 70 L64 50 C75 48 79 38 71 32 L16 6 C14 4 12 3 10 4 Z"
      fill="url(#gmMcGrad)" stroke="#fff" strokeWidth="3.5" strokeLinejoin="round"/>
    <path d="M10 4 C6 2 2 6 4 11 L24 84 C26 91 35 92 38 85 L46 64 L66 80 C73 85 82 78 78 70 L64 50 C75 48 79 38 71 32 L16 6 C14 4 12 3 10 4 Z"
      fill="none" stroke="#f5c842" strokeWidth="1" opacity=".6"/>
    <path d="M16 20 Q24 12 33 17" fill="none" stroke="#5c0499" strokeWidth="3" strokeLinecap="round"/>
    <g>
      <circle cx="27" cy="32" r="8" fill="#fff" stroke="#5c0499" strokeWidth="2"/>
      <circle class="pupil" cx="27" cy="32" r="3.6" fill="#1a0a26"/>
    </g>
    <g>
      <circle cx="44" cy="30" r="9.5" fill="#fff" stroke="#5c0499" strokeWidth="2"/>
      <circle class="pupil" cx="44" cy="30" r="4.1" fill="#1a0a26"/>
    </g>
    <path class="mc-mouth" d="M22 50 Q32 56 42 48" fill="none" stroke="#5c0499" strokeWidth="2.4" strokeLinecap="round"/>
  </svg>
`

function injectMascotCursor(doc) {
  if (!doc || doc.getElementById('gm-mascot-cursor')) return
  const style = doc.createElement('style')
  style.textContent = `
    #gm-mascot-cursor{position:fixed;top:0;left:0;width:34px;height:38px;pointer-events:none;z-index:2147483647;opacity:0;transition:opacity .2s ease;will-change:transform}
    @media (max-width:640px){#gm-mascot-cursor{display:none!important}}
    @media (pointer:coarse){#gm-mascot-cursor{display:none!important}}
    #gm-mascot-cursor svg{width:100%;height:100%;display:block;pointer-events:none;filter:drop-shadow(0 4px 10px rgba(92,4,153,0.35))}
    #gm-mascot-cursor .pupil{transform-origin:center}
    #gm-mascot-cursor.visible{opacity:1}
    body.gm-cursor-on, body.gm-cursor-on *{cursor:none!important}
  `
  doc.head.appendChild(style)

  const el = doc.createElement('div')
  el.id = 'gm-mascot-cursor'
  el.innerHTML = MASCOT_CURSOR_SVG
  doc.body.appendChild(el)

  let mx = 0, my = 0
  let pupilX = 0, pupilY = 0, targetPX = 0, targetPY = 0
  let lastMove = performance.now()
  let raf = null
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function loop() {
    pupilX += (targetPX - pupilX) * 0.15
    pupilY += (targetPY - pupilY) * 0.15
    el.style.transform = `translate(${mx - 6}px,${my - 4}px) rotate(8deg)`
    el.querySelectorAll('.pupil').forEach(p => { p.style.transform = `translate(${pupilX}px,${pupilY}px)` })
    targetPX *= 0.985; targetPY *= 0.985
    // Idle-stop: don't burn 60fps inside the game iframe while the mouse rests
    if (performance.now() - lastMove > 400) { raf = null; return }
    raf = requestAnimationFrame(loop)
  }

  const onMove = (e) => {
    const prevX = mx, prevY = my
    mx = e.clientX; my = e.clientY
    lastMove = performance.now()
    if (!raf) raf = requestAnimationFrame(loop)
    el.classList.add('visible')
    doc.body.classList.add('gm-cursor-on')
    const dx = mx - prevX, dy = my - prevY
    if (!reduce && Math.hypot(dx, dy) > 1.5) {
      const dir = Math.atan2(dy, dx)
      targetPX = Math.cos(dir) * 3.4
      targetPY = Math.sin(dir) * 3.4
    }
  }
  const onLeave = () => { el.classList.remove('visible'); doc.body.classList.remove('gm-cursor-on') }
  const onEnter = () => { el.classList.add('visible'); doc.body.classList.add('gm-cursor-on') }

  doc.addEventListener('mousemove', onMove, { passive: true })
  doc.addEventListener('mouseleave', onLeave)
  doc.addEventListener('mouseenter', onEnter)

  el._gmCleanup = () => {
    if (raf) cancelAnimationFrame(raf)
    doc.removeEventListener('mousemove', onMove)
    doc.removeEventListener('mouseleave', onLeave)
    doc.removeEventListener('mouseenter', onEnter)
    el.remove()
    style.remove()
    doc.body.classList.remove('gm-cursor-on')
  }
}

function GameModal({ game, allGames, onClose, onSwitch, isLoggedIn }) {
  const [loaded, setLoaded] = useState(false)
  const [playCount, setPlayCount] = useState(game.play_count || 0)
  const iframeRef = useRef(null)
  const src = `/play/${game.slug}/${game.client_slug}?source=${isLoggedIn ? 'player' : 'direct'}`

  useEffect(() => { setLoaded(false); setPlayCount(game.play_count || 0) }, [game.id])
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !loaded) return
    const doc = iframe.contentDocument
    if (doc) injectMascotCursor(doc)
    iframe.focus?.()
    try { iframe.contentWindow?.focus() } catch {}
  }, [loaded, game.id])
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const hideParent = () => document.body.classList.add('gm-pointer-in-iframe')
    const showParent = () => document.body.classList.remove('gm-pointer-in-iframe')
    iframe.addEventListener('mouseenter', hideParent)
    iframe.addEventListener('mouseleave', showParent)
    return () => {
      iframe.removeEventListener('mouseenter', hideParent)
      iframe.removeEventListener('mouseleave', showParent)
      document.body.classList.remove('gm-pointer-in-iframe')
    }
  }, [game.id, loaded])
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])
  // Play count: fetch immediately on open (so the bar updates right away),
  // then keep polling in place every 10s. Only the number is updated via
  // setPlayCount — the game iframe/modal never remounts.
  useEffect(() => {
    let alive = true
    const fetchCount = async () => {
      if (document.hidden) return
      try {
        const r = await fetch(`/api/play/game/${game.id}/play-count`)
        const d = await r.json()
        if (alive && d.play_count !== undefined) setPlayCount(d.play_count)
      } catch {}
    }
    fetchCount()
    const poll = setInterval(fetchCount, 10000)
    return () => { alive = false; clearInterval(poll) }
  }, [game.id])

  // High score / personal best chip (guest best via device_id fallback)
  const [scoreInfo, setScoreInfo] = useState(null)
  useEffect(() => {
    let alive = true
    setScoreInfo(null)
    const devId = getDeviceId()
    fetch(`/api/play/game/${game.id}/score-info${devId ? `?device_id=${encodeURIComponent(devId)}` : ''}`)
      .then(r => r.json())
      .then(d => { if (alive && d.success) setScoreInfo(d) })
      .catch(() => {})
    return () => { alive = false }
  }, [game.id])

  return (
    <>
      <style>{STYLES}</style>
      <div className="gm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="gm-modal">
          <div className="gm-bar">
            <span className="gm-bar-cat">{game.category || 'Quiz'}</span>
            <span className="gm-bar-name">{game.name}</span>
            <PromoCoinsWallet />
            <span className="gm-bar-plays">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {playCount.toLocaleString()} plays
            </span>
            {scoreInfo?.high_score > 0 && (
              <span className="gm-bar-plays" style={{ color: '#f5c842' }} title={`High score: ${scoreInfo.high_score.toLocaleString()}`}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#f5c842"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 6.9L12 17.3 5.7 20.8l1.7-6.9-5.4-4.7 7.1-.6z"/></svg>
                {scoreInfo.high_score.toLocaleString()}
                {scoreInfo.player_best != null && scoreInfo.player_best >= scoreInfo.high_score ? ' · You!' : ''}
              </span>
            )}
            <ShareMenu game={game} label={`Share ${game.name}`} />
            <button className="gm-close" onClick={onClose} title="Close (Esc)">✕</button>
          </div>
          <div className="gm-iframe-wrap" data-gm-game-area>
            <div className={`gm-loader${loaded ? ' gone' : ''}`}>
              <LogoLoader size={40} />
              <div className="gm-loader-txt">Loading {game.name}…</div>
            </div>
            <iframe
              ref={iframeRef}
              key={game.id}
              src={src}
              className="gm-iframe"
              title={game.name}
              allow="fullscreen"
              onLoad={() => setLoaded(true)}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default GameModal
