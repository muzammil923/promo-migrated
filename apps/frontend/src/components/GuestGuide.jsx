import { useState, useEffect, useRef, useCallback } from 'react'

/*
 * GuestGuide — first-visit coach marks for guests on the arcade + a 10s
 * idle nudge that spotlights a featured game. Shows once (localStorage),
 * nudge once per session (sessionStorage). Logged-in players never see it.
 */

const CSS = `
.gg-bubble{position:absolute;z-index:9400;max-width:270px;background:linear-gradient(160deg,#160b2e,#0d0820);border:1px solid rgba(146,16,246,0.5);border-radius:14px;padding:14px 16px;box-shadow:0 16px 48px rgba(0,0,0,0.55),0 0 28px rgba(146,16,246,0.2);font-family:'DM Sans',sans-serif;color:#fff;animation:ggIn .25s cubic-bezier(.22,1,.36,1) both}
@keyframes ggIn{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}
.gg-step{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#c084fc;margin-bottom:6px}
.gg-step i{width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#9210f6,#610497);color:#fff;font-style:normal;font-size:10px;display:grid;place-items:center}
.gg-title{font-size:14.5px;font-weight:700;margin-bottom:4px;line-height:1.3}
.gg-txt{font-size:12px;line-height:1.55;color:rgba(255,255,255,0.68);margin-bottom:11px}
.gg-actions{display:flex;align-items:center;justify-content:space-between}
.gg-next{padding:7px 16px;border:none;border-radius:9px;background:linear-gradient(135deg,#9210f6,#610497);color:#fff;font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:700;cursor:pointer;box-shadow:0 3px 14px rgba(146,16,246,0.35)}
.gg-skip{background:none;border:none;color:rgba(255,255,255,0.45);font-family:'DM Sans',sans-serif;font-size:11.5px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.gg-skip:hover{color:#fff}
.gg-target-hl{position:relative;z-index:3;outline:2.5px solid #c084fc !important;outline-offset:3px;border-radius:16px;animation:ggPulse 1.6s ease infinite}
@keyframes ggPulse{0%,100%{outline-color:#c084fc}50%{outline-color:rgba(192,132,252,0.35)}}
.gg-center{position:fixed;left:50%;top:44%;transform:translate(-50%,-50%);z-index:9400;width:min(90vw,340px);text-align:center}
.gg-center .gg-actions{justify-content:center;gap:14px}
.gg-nudge{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:9300;display:flex;align-items:center;gap:13px;width:min(92vw,420px);background:linear-gradient(160deg,#160b2e,#0d0820);border:1px solid rgba(146,16,246,0.45);border-radius:16px;padding:12px 14px;box-shadow:0 16px 48px rgba(0,0,0,0.5),0 0 28px rgba(146,16,246,0.18);font-family:'DM Sans',sans-serif;color:#fff;animation:ggUp .35s cubic-bezier(.22,1,.36,1) both}
@keyframes ggUp{from{opacity:0;transform:translate(-50%,20px)}to{opacity:1;transform:translate(-50%,0)}}
.gg-nudge-img{width:52px;height:52px;border-radius:10px;object-fit:cover;background:rgba(146,16,246,0.2);flex-shrink:0}
.gg-nudge-play{margin-left:auto;padding:9px 18px;border:none;border-radius:10px;background:linear-gradient(135deg,#9210f6,#610497);color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;flex-shrink:0;box-shadow:0 4px 16px rgba(146,16,246,0.4)}
.gg-x{position:absolute;top:6px;right:9px;background:none;border:none;color:rgba(255,255,255,0.45);font-size:14px;cursor:pointer;padding:4px}
.gg-x:hover{color:#fff}
@media(max-width:640px){.gg-bubble:not(.gg-center){max-width:220px}.gg-nudge{bottom:14px}}
`

const STEPS = [
  { key: 'play', title: 'Pick a game, hit Play', txt: 'Tap any tile to launch it instantly — no download, plays right here.' },
  { key: 'counts', title: 'Plays update live', txt: 'This counter ticks up in real time as players launch games.' },
  { key: 'save', title: 'Finish → save your coins', txt: 'Complete a game and the login card pops up — sign up free to keep Promo Coins, best scores and rewards.', center: true },
]

function isGuest() {
  return !(localStorage.getItem('playerToken') || sessionStorage.getItem('playerToken'))
}

export default function GuestGuide({ ready, sampleGame, onPlay }) {
  const [stepIdx, setStepIdx] = useState(null) // null = off
  const [targetRect, setTargetRect] = useState(null)
  const [nudgeOpen, setNudgeOpen] = useState(false)
  const hlRef = useRef(null)

  const finish = useCallback(() => {
    setStepIdx(null)
    setNudgeOpen(false)
    try { localStorage.setItem('pg_guide_seen', '1') } catch {}
  }, [])

  // Start guide for first-time guests
  useEffect(() => {
    if (!ready || !isGuest()) return
    let seen = false
    try { seen = localStorage.getItem('pg_guide_seen') === '1' } catch {}
    if (!seen) setStepIdx(0)
  }, [ready])

  // Track target element per step
  useEffect(() => {
    if (stepIdx === null || stepIdx >= STEPS.length) { setTargetRect(null); return }
    const step = STEPS[stepIdx]
    if (step.center) { setTargetRect(null); hlRef.current = null; return }
    const t = setTimeout(() => {
      let el = null
      if (step.key === 'play') el = document.querySelector('.pg-grid .pg-tile')
      if (step.key === 'counts') el = document.querySelector('.arc-grid-count')
      if (!el) { setTargetRect(null); hlRef.current = null; return }
      const apply = () => {
        const r = el.getBoundingClientRect()
        setTargetRect({ top: r.top, left: r.left, width: r.width })
        el.classList.add('gg-target-hl')
        hlRef.current = el
      }
      // Wait one frame so layout is settled after data render
      requestAnimationFrame(() => { apply(); window.addEventListener('resize', apply) })
      hlRef.current?._cleanup?.()
      el._cleanup = () => { el.classList.remove('gg-target-hl'); window.removeEventListener('resize', apply) }
    }, 60)
    return () => {
      clearTimeout(t)
      if (hlRef.current) { hlRef.current.classList.remove('gg-target-hl'); hlRef.current = null }
    }
  }, [stepIdx])

  // Cleanup highlight on unmount
  useEffect(() => () => {
    document.querySelectorAll('.gg-target-hl').forEach(el => el.classList.remove('gg-target-hl'))
  }, [])

  // 10s idle nudge — only for guests who've finished/seen the guide
  useEffect(() => {
    if (!ready || !isGuest() || stepIdx !== null) return
    let nudged = false
    try { nudged = sessionStorage.getItem('pg_nudged') === '1' } catch {}
    if (nudged) return

    let timer = null
    const reset = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        try { sessionStorage.setItem('pg_nudged', '1') } catch {}
        setNudgeOpen(true)
      }, 10000)
    }
    const evts = ['mousemove', 'keydown', 'touchstart', 'scroll']
    evts.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      if (timer) clearTimeout(timer)
      evts.forEach(e => window.removeEventListener(e, reset))
    }
  }, [ready, stepIdx])

  if (!ready || !isGuest()) return null

  // ── Idle nudge bubble ──
  if (nudgeOpen && sampleGame && stepIdx === null) {
    const img = sampleGame.thumbnail_url || sampleGame.game_logo_url || sampleGame.bg_image_url
    return (
      <>
        <style>{CSS}</style>
        <div className="gg-nudge" role="status">
          <img className="gg-nudge-img" src={img} alt="" width="52" height="52" />
          <div style={{ minWidth: 0 }}>
            <div className="gg-title">Still there?</div>
            <div className="gg-txt" style={{ marginBottom: 0 }}>
              Try <strong>{sampleGame.name}</strong> — takes under a minute!
            </div>
          </div>
          <button className="gg-nudge-play" onClick={() => { finish(); setNudgeOpen(false); onPlay?.(sampleGame) }}>Play</button>
          <button className="gg-x" aria-label="Dismiss" onClick={() => { setNudgeOpen(false); try { sessionStorage.setItem('pg_nudged', '1') } catch {} }}>✕</button>
        </div>
      </>
    )
  }

  // ── Coach-mark steps ──
  if (stepIdx === null || stepIdx >= STEPS.length) return null
  const step = STEPS[stepIdx]
  const isLast = stepIdx === STEPS.length - 1

  return (
    <>
      <style>{CSS}</style>
      {step.center ? (
        <div className="gg-bubble gg-center">
          <button className="gg-x" aria-label="Skip guide" onClick={finish}>✕</button>
          <div style={{ fontSize: 38, marginBottom: 8 }}><img src="/promocoin.webp" alt="PromoCoin" width="48" height="48" /></div>
          <div className="gg-step"><i>{stepIdx + 1}/3</i> Your progress</div>
          <div className="gg-title">{step.title}</div>
          <div className="gg-txt">{step.txt}</div>
          <div className="gg-actions">
            <button className="gg-skip" onClick={finish}>Got it</button>
            <button className="gg-next" onClick={finish}>{isLast ? "Let's play! 🎮" : 'Next'}</button>
          </div>
        </div>
      ) : (
        targetRect && (
          <div
            className="gg-bubble"
            style={{
              position: 'fixed',
              top: Math.min(Math.max(targetRect.top - 10, 84), window.innerHeight - 190),
              left: Math.min(Math.max(targetRect.left, 10), Math.max(window.innerWidth - 290, 10)),
            }}
          >
            <button className="gg-x" aria-label="Skip guide" onClick={finish}>✕</button>
            <div className="gg-step"><i>{stepIdx + 1}/3</i> Quick tour</div>
            <div className="gg-title">{step.title}</div>
            <div className="gg-txt">{step.txt}</div>
            <div className="gg-actions">
              <button className="gg-skip" onClick={finish}>Skip</button>
              <button className="gg-next" onClick={() => setStepIdx(i => i + 1)}>Next</button>
            </div>
          </div>
        )
      )}
    </>
  )
}
