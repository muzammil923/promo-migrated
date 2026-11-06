import { useState, useEffect, useRef, useCallback } from 'react'

let audioCtx = null
function getAudioCtx() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); return audioCtx }
function synthEat() {
  try { const c = getAudioCtx(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'sine'; o.frequency.setValueAtTime(520, c.currentTime); o.frequency.exponentialRampToValueAtTime(1400, c.currentTime + 0.15); g.gain.setValueAtTime(0.3, c.currentTime); g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.2); o.start(c.currentTime); o.stop(c.currentTime + 0.2) } catch {}
}
function synthGameOver() {
  try { const c = getAudioCtx(), o1 = c.createOscillator(), g1 = c.createGain(); o1.connect(g1); g1.connect(c.destination); o1.type = 'sawtooth'; o1.frequency.setValueAtTime(600, c.currentTime); o1.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.5); g1.gain.setValueAtTime(0.25, c.currentTime); g1.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.5); o1.start(c.currentTime); o1.stop(c.currentTime + 0.5); const o2 = c.createOscillator(), g2 = c.createGain(); o2.connect(g2); g2.connect(c.destination); o2.type = 'sine'; o2.frequency.setValueAtTime(120, c.currentTime + 0.1); o2.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.6); g2.gain.setValueAtTime(0.4, c.currentTime + 0.1); g2.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.6); o2.start(c.currentTime + 0.1); o2.stop(c.currentTime + 0.6) } catch {}
}
function synthKill() {
  try { const c = getAudioCtx(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'square'; o.frequency.setValueAtTime(180, c.currentTime); o.frequency.exponentialRampToValueAtTime(45, c.currentTime + 0.4); g.gain.setValueAtTime(0.35, c.currentTime); g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.45); o.start(c.currentTime); o.stop(c.currentTime + 0.45); const o2 = c.createOscillator(), g2 = c.createGain(); o2.connect(g2); g2.connect(c.destination); o2.type = 'triangle'; o2.frequency.setValueAtTime(900, c.currentTime); o2.frequency.exponentialRampToValueAtTime(1800, c.currentTime + 0.18); g2.gain.setValueAtTime(0.15, c.currentTime); g2.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.22); o2.start(c.currentTime); o2.stop(c.currentTime + 0.22) } catch {}
}
function playSound(url) { if (!url) return; try { new Audio(url).play().catch(() => {}) } catch {} }

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=Rajdhani:wght@400;500;600;700&display=swap');
.ngr *{margin:0;padding:0;box-sizing:border-box}
.ngr{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;overflow:hidden;font-family:'Rajdhani',sans-serif;color:#fff;background:linear-gradient(135deg,#090214,#130525 40%,#1D0838);touch-action:none;-webkit-user-select:none;user-select:none}
.ngr::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 50vmax 50vmax at 20% 30%,rgba(139,92,246,.08),transparent 70%),radial-gradient(ellipse 40vmax 40vmax at 80% 70%,rgba(168,85,247,.06),transparent 70%);pointer-events:none;z-index:0}
.ngr .pt{position:absolute;border-radius:50%;pointer-events:none;animation:pf linear infinite}
@keyframes pf{0%{transform:translateY(100vh) scale(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-10vh) scale(1);opacity:0}}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes su{from{transform:translateY(40px) scale(.95);opacity:0}to{transform:none;opacity:1}}
:fullscreen .ngr,
:-webkit-full-screen .ngr,
:-moz-full-screen .ngr,
:-ms-fullscreen .ngr{width:100vw;height:100vh}
html:fullscreen,html:-webkit-full-screen,html:-moz-full-screen,html:-ms-fullscreen{overflow:hidden}
.hud{position:fixed;z-index:100;pointer-events:none}
.hud>*{pointer-events:auto}
.hud-tl{top:max(12px,env(safe-area-inset-top));left:max(12px,env(safe-area-inset-left))}
.hud-tr{top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.hud-br{bottom:max(12px,env(safe-area-inset-bottom));right:max(12px,env(safe-area-inset-right));display:flex;flex-direction:column;align-items:flex-end;gap:8px}
@media(max-width:600px){
  .hud-tl{top:max(8px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left))}
  .hud-tr{top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));gap:6px}
  .hud-br{bottom:max(56px,env(safe-area-inset-bottom));right:max(8px,env(safe-area-inset-right))}
}
.gp2{background:rgba(13,10,26,.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(139,92,246,.2);border-radius:12px;padding:8px 12px}
@media(max-width:600px){.gp2{padding:5px 8px;border-radius:10px}}
.hud .lb{font-family:'Orbitron',sans-serif;font-size:7px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(251,191,36,.7);margin-bottom:2px}
.hud .vl{font-family:'Orbitron',sans-serif;font-weight:900;color:#fbbf24;text-shadow:0 0 12px rgba(251,191,36,.4)}
.hud .vl.big{font-size:clamp(16px,3vw,28px)}
.hud .vl.sm{font-size:clamp(11px,2vw,16px);color:#a78bfa;text-shadow:0 0 10px rgba(167,139,250,.3)}
.score-row{display:flex;gap:12px;align-items:center}
.rbtn{padding:8px 16px;background:transparent;border:1.5px solid rgba(139,92,246,.5);border-radius:50px;color:#fff;font-family:'Orbitron',sans-serif;font-size:clamp(8px,1.1vw,11px);font-weight:700;letter-spacing:2px;cursor:pointer;transition:all .2s;text-transform:uppercase}
.rbtn:hover{transform:translateY(-1px);background:rgba(124,58,237,.15)}
.rbtn:active{transform:scale(.97)}
.go{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.75);backdrop-filter:blur(12px);animation:fi .3s}
.go .card{background:rgba(15,5,30,.9);backdrop-filter:blur(24px);border:1.5px solid rgba(139,92,246,.3);border-radius:24px;padding:clamp(20px,5vw,40px);max-width:min(380px,90vw);width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.5);animation:su .4s cubic-bezier(.16,1,.3,1)}
.go h2{font-family:'Orbitron',sans-serif;font-size:clamp(18px,4vw,28px);font-weight:900;background:linear-gradient(135deg,#f87171,#ef4444,#dc2626);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px}
.go .sk{font-size:clamp(36px,8vw,64px);margin-bottom:8px;filter:drop-shadow(0 0 20px rgba(239,68,68,.3))}
.go .fs{font-family:'Orbitron',sans-serif;font-size:clamp(13px,2.5vw,18px);font-weight:700;color:#a78bfa;margin-bottom:4px}
.go .bl{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:20px}
.go .cb{width:100%;padding:14px;background:linear-gradient(135deg,#7c3aed,#6d28d9);border:1.5px solid rgba(139,92,246,.5);border-radius:50px;color:#fff;font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:all .2s;box-shadow:0 6px 24px rgba(124,58,237,.3)}
.go .cb:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(124,58,237,.5)}
.io{position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#090214,#130525 40%,#1D0838);animation:fi .4s}
.io .card{background:rgba(15,5,30,.8);backdrop-filter:blur(24px);border:1.5px solid rgba(139,92,246,.25);border-radius:28px;padding:clamp(20px,5vw,40px);max-width:min(460px,90vw);width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.4);animation:su .5s cubic-bezier(.16,1,.3,1)}
.io .logo{font-size:clamp(32px,8vw,56px);margin-bottom:12px;filter:drop-shadow(0 0 20px rgba(34,197,94,.3))}
.io h1{font-family:'Orbitron',sans-serif;font-size:clamp(18px,5vw,34px);font-weight:900;background:linear-gradient(135deg,#c084fc,#a855f7,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px}
.io .sub{font-size:14px;font-weight:500;color:rgba(255,255,255,.5);margin-bottom:18px;letter-spacing:1px}
.io .inst{background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.15);border-radius:12px;padding:12px;margin-bottom:18px;text-align:left}
.io .inst p{font-size:12px;color:rgba(255,255,255,.6);line-height:1.7}
.io kbd{display:inline-block;padding:2px 6px;background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);border-radius:4px;font-family:'Orbitron',sans-serif;font-size:9px;color:#a78bfa;margin:0 2px}
.io .sbtn{width:100%;max-width:280px;padding:14px 0;background:linear-gradient(135deg,#22c55e,#16a34a 50%,#15803d);border:1.5px solid rgba(34,197,94,.5);border-radius:50px;color:#fff;font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;letter-spacing:3px;cursor:pointer;transition:all .2s;box-shadow:0 6px 24px rgba(34,197,94,.3);text-transform:uppercase}
.io .sbtn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(34,197,94,.5)}
.legend{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:18px}
.legend .lg{display:flex;align-items:center;gap:6px;background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.15);border-radius:8px;padding:5px 10px;font-size:12px;color:rgba(255,255,255,.8)}
.swipe-hint{display:none;position:fixed;bottom:max(40px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:90;font-family:'Orbitron',sans-serif;font-size:9px;color:rgba(255,255,255,.3);letter-spacing:1px;text-transform:uppercase;pointer-events:none}
@media(max-width:600px){.swipe-hint{display:block}}
`

function seedGifts(arrLen, gifts, count) {
  const picked = []
  const totalW = gifts.reduce((s, g) => s + (g.spawnWeight || 1), 0) || 1
  for (let i = 0; i < count; i++) {
    let r = Math.random() * totalW
    let g = gifts[gifts.length - 1] || { name: 'Gift', emoji: '✨', color: '#22c55e', points: 1, size: 1 }
    for (const cand of gifts) { r -= (cand.spawnWeight || 1); if (r <= 0) { g = cand; break } }
    picked.push({ g, x: 0, y: 0 })
  }
  return picked
}

function NagarajaPlayerPage({ gameData = {}, sessionToken = null, onComplete = () => {} }) {
  const { settings, soundMap } = gameData
  const soundMapRef = useRef(soundMap || {})
  const resolveSound = useCallback((id) => { if (!id) return null; const n = parseInt(id); return isNaN(n) ? id : (soundMapRef.current[n] || null) }, [])
  const [termsAgreed, setTermsAgreed] = useState(false)

  let gifts = []
  try { gifts = Array.isArray(settings?.gifts_json) ? settings.gifts_json : (typeof settings?.gifts_json === 'string' ? JSON.parse(settings.gifts_json) : []); } catch { gifts = [] }
  if (!Array.isArray(gifts) || gifts.length === 0) gifts = [{ name: 'Gold', emoji: '🟡', color: '#f59e0b', points: 1, size: 1, spawnWeight: 10 }]
  const giftsRef = useRef(gifts)

  const snakeColor = settings?.snake_color || '#22c55e'
  const baseSpeed = settings?.speed || 5
  const aiCount = settings?.ai_snake_count ?? 6
  const aiSpeed = settings?.ai_speed ?? 3
  const giftCount = settings?.gift_count ?? 40
  const boostEnabled = !!settings?.boost_enabled
  const showTimer = !!settings?.show_timer
  const timeLimit = settings?.time_limit_seconds || 0
  const WORLD_W = Math.max(800, settings?.world_width || 1600)
  const WORLD_H = Math.max(600, settings?.world_height || 1200)

  const [showIntro, setShowIntro] = useState(true)
  const [gameActive, setGameActive] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(gameData?.high_score || 0)
  const [length, setLength] = useState(0)
  const [timeLeft, setTimeLeft] = useState(timeLimit)

  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const completedRef = useRef(false)
  const stateRef = useRef(null)
  const [renderTick, setRenderTick] = useState(0)
  const [kills, setKills] = useState(0)
  const burstRef = useRef([])
  const comboRef = useRef({ count: 0, last: 0, best: 0 })
  const popupRef = useRef([])
  const shakeRef = useRef({ mag: 0, t: 0 })

  const startSnake = useCallback(() => {
    const W = WORLD_W, H = WORLD_H
    const segs = []
    const startX = W / 2, startY = H / 2
    for (let i = 0; i < 12; i++) segs.push({ x: startX - i * 8, y: startY })
    const giftsSpawned = seedGifts(1, giftsRef.current, Math.max(giftCount, 60))
    for (const gt of giftsSpawned) {
      const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 350
      gt.x = startX + Math.cos(a) * r; gt.y = startY + Math.sin(a) * r
    }
    const ai = Array.from({ length: aiCount }, (_, i) => buildAI(i, startX, startY))
    stateRef.current = {
      segs, speed: baseSpeed, boost: false, dirAngle: 0,
      gifts: giftsSpawned, ai,
      W, H, alive: true, len: 12,
    }
  }, [WORLD_W, WORLD_H, baseSpeed, aiCount, giftCount])

  function buildAI(i, cx, cy) {
    const len = 20 + Math.floor(Math.random() * 30)
    const a = Math.random() * Math.PI * 2, r = 200 + Math.random() * 1000
    const base = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
    const segs = []
    for (let k = 0; k < len; k++) segs.push({ x: base.x - k * 7, y: base.y })
    const colors = ['#ef4444', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6', '#84cc16', '#f97316']
    return {
      segs, color: colors[i % colors.length],
      angle: Math.random() * Math.PI * 2, target: Math.random() * Math.PI * 2,
      retarget: 0, speed: (2 + Math.random() * (aiSpeed - 1)),
      W: 0, H: 0, alive: true, headR: 7, len: len,
    }
  }

  const handleStart = useCallback(() => {
    setShowIntro(false); setGameActive(true); setGameOver(false); completedRef.current = false
    startSnake(); setScore(0); setLength(0); setTimeLeft(timeLimit); setKills(0); burstRef.current = []; popupRef.current = []; comboRef.current = { count: 0, last: 0, best: 0 }; shakeRef.current = { mag: 0, t: 0 }
  }, [startSnake, timeLimit])

  const handleComplete = useCallback(async () => {
    if (completedRef.current) return; completedRef.current = true
    try { if (sessionToken) await fetch('/api/play/session/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_token: sessionToken, score: scoreRef.current || 0, player_data: {} }) }) } catch {}
    onComplete?.()
  }, [sessionToken, onComplete])

  const scoreRef = useRef(0)
  const requestFullscreen = useCallback(() => {
    try { const el = document.documentElement; const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen || el.mozRequestFullScreen; if (rfs) rfs.call(el).catch(() => {}) } catch {}
  }, [])
  const exitFullscreen = useCallback(() => {
    try { const dfs = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen || document.mozCancelFullScreen; if (dfs && document.fullscreenElement) dfs.call(document).catch(() => {}) } catch {}
  }, [])

  const handleRestart = useCallback(() => { completedRef.current = false; handleStart() }, [handleStart])

  const handleBackToMenu = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    exitFullscreen()
    setGameActive(false); setGameOver(false); setShowIntro(true)
  }, [exitFullscreen])

  const handleContinue = useCallback(() => { handleComplete(); handleBackToMenu() }, [handleComplete, handleBackToMenu])

  // Pointer steering
  const pointerRef = useRef(null) // {mode:'mouse'|'touch', x, y}
  const steerTo = useCallback((x, y) => { pointerRef.current = { x, y } }, [])
  useEffect(() => {
    if (!gameActive) return
    const onMove = (e) => { steerTo(e.clientX, e.clientY) }
    const onTouch = (e) => { if (e.touches[0]) steerTo(e.touches[0].clientX, e.touches[0].clientY) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onTouch, { passive: false })
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('touchmove', onTouch) }
  }, [gameActive, steerTo])

  // Boost via hold
  const boostRef = useRef(false)
  useEffect(() => {
    if (!gameActive) return
    const down = () => { if (boostEnabled) boostRef.current = true }
    const up = () => { boostRef.current = false }
    window.addEventListener('mousedown', down); window.addEventListener('mouseup', up)
    window.addEventListener('touchstart', down); window.addEventListener('touchend', up)
    window.addEventListener('keydown', (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); boostRef.current = boostEnabled } })
    window.addEventListener('keyup', (e) => { if (e.key === ' ' || e.code === 'Space' || e.key === 'ArrowUp') boostRef.current = false })
    return () => {
      window.removeEventListener('mousedown', down); window.removeEventListener('mouseup', up)
      window.removeEventListener('touchstart', down); window.removeEventListener('touchend', up)
    }
  }, [gameActive, boostEnabled])

  const gameLoopRef = useRef(null)
  const lastWorldXRef = useRef(0)
  const lastWorldYRef = useRef(0)
  useEffect(() => {
    if (!gameActive || gameOver) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !stateRef.current) return

    const viewW = canvas.width, viewH = canvas.height
    let camX = lastWorldXRef.current, camY = lastWorldYRef.current

    const tick = (now) => {
      const st = stateRef.current
      if (!st) return
      if (st.alive && ctx) {
        // magnetic pull: find nearest non-shed gift within range and apply attraction
        const headPos0 = st.segs[0]
        const MAGNET_RANGE = 280
        const MAGNET_STRENGTH = 0.09
        let nearestGift = null, nearestDist = MAGNET_RANGE
        for (const gift of st.gifts) {
          if (gift.shed) continue
          const gd = Math.hypot(gift.x - headPos0.x, gift.y - headPos0.y)
          if (gd < nearestDist) { nearestGift = gift; nearestDist = gd }
        }
        // steering angle toward pointer (in view coords -> world offset)
        const p = pointerRef.current
        if (p) {
          const dx = lastWorldXRef.current - camX + (p.x - viewW / 2)
          const dy = lastWorldYRef.current - camY + (p.y - viewH / 2)
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            let target = Math.atan2(dy, dx)
            // apply magnetic pull toward nearest gift
            if (nearestGift && nearestDist < MAGNET_RANGE) {
              const giftAngle = Math.atan2(nearestGift.y - headPos0.y, nearestGift.x - headPos0.x)
              const pullFactor = MAGNET_STRENGTH * (1 - nearestDist / MAGNET_RANGE)
              let gdiff = giftAngle - target
              while (gdiff > Math.PI) gdiff -= Math.PI * 2
              while (gdiff < -Math.PI) gdiff += Math.PI * 2
              target += gdiff * pullFactor
            }
            let diff = target - st.dirAngle
            while (diff > Math.PI) diff -= Math.PI * 2
            while (diff < -Math.PI) diff += Math.PI * 2
            const turn = Math.sign(diff) * Math.min(Math.abs(diff), 0.16)
            st.dirAngle += turn
          } else if (nearestGift && nearestDist < MAGNET_RANGE) {
            // no pointer movement but gift nearby — still pull gently
            const giftAngle = Math.atan2(nearestGift.y - headPos0.y, nearestGift.x - headPos0.x)
            let diff = giftAngle - st.dirAngle
            while (diff > Math.PI) diff -= Math.PI * 2
            while (diff < -Math.PI) diff += Math.PI * 2
            st.dirAngle += Math.sign(diff) * Math.min(Math.abs(diff), MAGNET_STRENGTH * (1 - nearestDist / MAGNET_RANGE))
          }
        }
        const boost = boostRef.current ? 1.8 : 1
        const growth = Math.min(1, st.len / 140)
        const spd = st.speed * (1 + growth * 1.3) * boost
        const head = st.segs[0]
        // boost sheds small pellets
        if (boostRef.current && st.segs.length > 6 && Math.random() < 0.6) {
          st.gifts.push({ g: { name: 'shed', emoji: st.isShedEmoji || '', color: snakeColor, points: 1, size: 0.5 }, x: head.x, y: head.y, shed: true })
        }
        // move head — infinite arena, no walls
        const hx = head.x + Math.cos(st.dirAngle) * spd
        const hy = head.y + Math.sin(st.dirAngle) * spd
        st.segs.unshift({ x: hx, y: hy })
        // grow slower than move; keep constant-ish length by removing tail (grow a bit when eating)
        const nodeSpacing = 4
        // remove until total path length ~ target length
        let segLen = 0, cut = -1
        for (let i = 1; i < st.segs.length; i++) { segLen += Math.hypot(st.segs[i].x - st.segs[i - 1].x, st.segs[i].y - st.segs[i - 1].y) }
        const targetLen = st.len * nodeSpacing
        if (segLen > targetLen) {
          let over = 0
          for (let i = st.segs.length - 1; i >= 1; i--) {
            const d = Math.hypot(st.segs[i].x - st.segs[i - 1].x, st.segs[i].y - st.segs[i - 1].y)
            over += d
            if (over > (segLen - targetLen)) { cut = i; break }
          }
          if (cut > 1) st.segs.splice(cut)
        }

        // eat gifts (magnetic pickup radius)
        const headPos = st.segs[0]
        const headR = 7
        for (let gi = st.gifts.length - 1; gi >= 0; gi--) {
          const gift = st.gifts[gi]
          const radius = gift.g.points >= 5 ? 16 : gift.g.points >= 3 ? 12 : 10
          const d = Math.hypot(gift.x - headPos.x, gift.y - headPos.y) + 1e-6
          if (d < headR + radius + 14) {
            const pts = gift.g.points || 1
            scoreRef.current += pts
            setScore(scoreRef.current)
            st.len += pts * 4
            setLength(st.len)
            st.gifts.splice(gi, 1)
            const c = resolveSound(settings?.sound_eat_id); if (c) { playSound(c) } else { synthEat() }
            // respawn a generic gift if shed/eaten
            st.gifts.push(spawnGiftAt(st))
          }
        }

        // AI snakes: move toward player area + collisions (kill/be-killed)
        const aiAlive = []
        for (const ai of st.ai) {
          if (!ai.alive) continue
          let dead = false
          ai.retarget -= 1
          if (ai.retarget <= 0) { ai.target = Math.random() * Math.PI * 2; ai.retarget = 60 + Math.random() * 120 }
          // keep AI near the player so the action stays relevant in the infinite arena
          const aHead = ai.segs[0]
          const distToPlayer = Math.hypot(headPos.x - aHead.x, headPos.y - aHead.y)
          if (distToPlayer > 1600) { ai.target = Math.atan2(headPos.y - aHead.y, headPos.x - aHead.x); ai.retarget = 40 }
          let diff = ai.target - ai.angle
          while (diff > Math.PI) diff -= Math.PI * 2
          while (diff < -Math.PI) diff += Math.PI * 2
          ai.angle += diff * 0.05
          ai.segs.unshift({ x: aHead.x + Math.cos(ai.angle) * ai.speed, y: aHead.y + Math.sin(ai.angle) * ai.speed })
          ai.segs.pop()

          if (st.alive) {
            // 1) player head hits AI body -> player dies
            let playerCrashed = false
            for (let k = 1; k < ai.segs.length; k++) {
              const s = ai.segs[k]
              if (Math.hypot(headPos.x - s.x, headPos.y - s.y) < headR + 6) { playerCrashed = true; break }
            }
            if (playerCrashed) { st.alive = false }

            // 2) AI head hits player body (not the player's head) -> AI dies, sheds its food
            if (!playerCrashed) {
              const ah = ai.segs[0]
              for (let k = 1; k < st.segs.length; k++) {
                const s = st.segs[k]
                if (Math.hypot(ah.x - s.x, ah.y - s.y) < ai.headR + 6) { dead = true; break }
              }
            }
          }

          if (dead) {
            const ah = ai.segs[0]
            const n = performance.now()
            const combo = comboRef.current
            const streak = (n - combo.last < 4000) ? combo.count + 1 : 1
            combo.count = streak; combo.last = n
            if (streak > combo.best) combo.best = streak
            // multikill bonus points/length
            if (streak > 1) {
              const bonus = streak * 10
              scoreRef.current += bonus
              setScore(scoreRef.current)
              st.len += bonus * 2
              setLength(st.len)
              popupRef.current.push({ x: ah.x, y: ah.y, t: n, text: `COMBO x${streak} +${bonus}`, big: true, alive: true })
            }
            popupRef.current.push({ x: ah.x, y: ah.y, t: n, text: streak > 1 ? `KILLED! x${streak}` : 'KILLED!', big: false, alive: true })
            killAI(st, ai, headR)
            burstRef.current.push({ x: ah.x, y: ah.y, t: n, alive: true })
            setKills(k => k + 1)
            shakeRef.current = { mag: streak > 1 ? 10 : 6, t: n }
            const c = resolveSound(settings?.sound_eat_id); if (c) { playSound(c) } else { synthKill() }
          } else {
            aiAlive.push(ai)
          }
        }
        st.ai = aiAlive

        if (!st.alive) {
          setGameOver(true)
          const c = resolveSound(settings?.sound_gameover_id); if (c) { playSound(c) } else { synthGameOver() }
          exitFullscreen()
          return
        }

        // keep gifts plentiful across the whole world — auto-respawn if below threshold
        const nonShedGifts = st.gifts.filter(g => !g.shed).length
        if (nonShedGifts < 40) {
          // spawn in random world positions, not just near player
          for (let n = 0; n < 5; n++) {
            const cx = Math.random() * WORLD_W
            const cy = Math.random() * WORLD_H
            st.gifts.push(spawnGiftAt(st))  // spawnGiftAt now uses world coords
            // override position
            st.gifts[st.gifts.length - 1].x = cx
            st.gifts[st.gifts.length - 1].y = cy
          }
        }

        // camera — follows head in infinite arena (+ screen shake on kill)
        lastWorldXRef.current = headPos.x
        lastWorldYRef.current = headPos.y
        const sh = shakeRef.current
        let shx = 0, shy = 0
        const shAge = performance.now() - sh.t
        if (shAge < 250) {
          const m = sh.mag * (1 - shAge / 250)
          shx = (Math.random() - 0.5) * 2 * m
          shy = (Math.random() - 0.5) * 2 * m
        }
        camX = headPos.x + shx
        camY = headPos.y + shy

        draw(ctx, st, camX, camY, viewW, viewH, snakeColor)
      }
      setRenderTick(t => t + 1)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameActive, gameOver, snakeColor, resolveSound, settings, exitFullscreen])

  function spawnGiftAt(st) {
    const g = giftsRef.current[Math.floor(Math.random() * giftsRef.current.length)] || { name: 'Gift', emoji: '🎁', color: '#f59e0b', points: 1, size: 1 }
    // spread gifts across the full canvas viewport, not just near player
    const cx = (Math.random() - 0.5) * (WORLD_W - viewW) + viewW / 2
    const cy = (Math.random() - 0.5) * (WORLD_H - viewH) + viewH / 2
    return { g, x: cx, y: cy }
  }

  // When an AI snake dies, shed everything it "ate" as loot gifts along its body.
  function killAI(st, ai, headR) {
    const defs = giftsRef.current
    const baseDef = { name: 'Snake loot', emoji: '✨', color: '#fbbf24', points: 10, size: 1 }
    const lootPts = Math.max(4, Math.round((ai.len || ai.segs.length) / 3))
    const step = Math.max(2, Math.floor(ai.segs.length / 18))
    for (let k = 0; k < ai.segs.length; k += step) {
      const s = ai.segs[k]
      const src = defs[Math.floor(Math.random() * defs.length)] || baseDef
      st.gifts.push({
        g: { ...src, name: 'Snake loot', points: lootPts },
        x: s.x + (Math.random() - 0.5) * 14, y: s.y + (Math.random() - 0.5) * 14,
        shed: true, loot: true,
      })
    }
  }

  function draw(ctx, st, camX, camY, viewW, viewH, snakeColor) {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, viewW, viewH)
    // bg
    const grad = ctx.createLinearGradient(0, 0, 0, viewH)
    grad.addColorStop(0, '#0d0a1a'); grad.addColorStop(1, '#160b2e')
    ctx.fillStyle = grad; ctx.fillRect(0, 0, viewW, viewH)
    // hex-ish grid
    ctx.strokeStyle = 'rgba(139,92,246,0.08)'; ctx.lineWidth = 1
    const grid = 60
    const startX = Math.floor((camX - viewW / 2) / grid) * grid
    const startY = Math.floor((camY - viewH / 2) / grid) * grid
    ctx.beginPath()
    for (let x = startX; x < camX + viewW / 2 + grid; x += grid) { ctx.moveTo(x - camX + viewW / 2, 0); ctx.lineTo(x - camX + viewW / 2, viewH) }
    for (let y = startY; y < camY + viewH / 2 + grid; y += grid) { ctx.moveTo(0, y - camY + viewH / 2); ctx.lineTo(viewW, y - camY + viewH / 2) }
    ctx.stroke()

    // gifts
    for (const gift of st.gifts) {
      const sx = gift.x - camX + viewW / 2, sy = gift.y - camY + viewH / 2
      if (sx < -20 || sx > viewW + 20 || sy < -20 || sy > viewH + 20) continue
      const radius = gift.g.points >= 5 ? 16 : gift.g.points >= 3 ? 12 : 10
      if (gift.shed) {
        if (gift.loot) {
          // shed loot from a killed snake — big glowing reward
          const pulse = 1 + Math.sin(performance.now() / 180 + sx) * 0.12
          ctx.fillStyle = gift.g.color + '55'
          ctx.beginPath(); ctx.arc(sx, sy, radius * 2.4 * pulse, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = gift.g.color
          ctx.beginPath(); ctx.arc(sx, sy, radius * 1.2 * pulse, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.beginPath(); ctx.arc(sx - 3, sy - 3, 2, 0, Math.PI * 2); ctx.fill()
          if (gift.g.emoji) {
            ctx.font = `${Math.round(radius * 1.8)}px sans-serif`
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
            ctx.fillText(gift.g.emoji, sx, sy)
          }
        } else {
          // tiny boost shed pellet
          ctx.fillStyle = gift.g.color
          ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill()
        }
        continue
      }
// ── GIFT — simple colored circle with emoji, clearly collectable ──
      const giftRadius = gift.g.points >= 5 ? 14 : gift.g.points >= 3 ? 10 : 8
      // outer glow
      ctx.fillStyle = gift.g.color + '22'
      ctx.beginPath(); ctx.arc(sx, sy, giftRadius * 2.5, 0, Math.PI * 2); ctx.fill()
      // inner glow
      ctx.fillStyle = gift.g.color + '44'
      ctx.beginPath(); ctx.arc(sx, sy, giftRadius * 1.6, 0, Math.PI * 2); ctx.fill()
      // main circle
      ctx.fillStyle = gift.g.color
      ctx.beginPath(); ctx.arc(sx, sy, giftRadius, 0, Math.PI * 2); ctx.fill()
      // bright center dot
      ctx.fillStyle = '#fff'
      ctx.beginPath(); ctx.arc(sx - giftRadius * 0.25, sy - giftRadius * 0.25, giftRadius * 0.3, 0, Math.PI * 2); ctx.fill()
      // emoji — large and prominent
      ctx.font = `${giftRadius * 2.5}px sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillStyle = '#fff'
      ctx.fillText(gift.g.emoji, sx, sy)
    }

    // AI snakes
    for (const ai of st.ai) {
      for (let i = 0; i < ai.segs.length - 1; i++) {
        const a = ai.segs[i], b = ai.segs[i + 1]
        const sx = a.x - camX + viewW / 2, sy = a.y - camY + viewH / 2
        const ex = b.x - camX + viewW / 2, ey = b.y - camY + viewH / 2
        if ((sx < -40 && ex < -40) || (sx > viewW + 40 && ex > viewW + 40) || (sy < -40 && ey < -40) || (sy > viewH + 40 && ey > viewH + 40)) continue
        const w = 6 - (i / ai.segs.length) * 3
        ctx.strokeStyle = ai.color
        ctx.lineWidth = w
        ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke()
      }
      // head
      const h = ai.segs[0]
      const hx = h.x - camX + viewW / 2, hy = h.y - camY + viewH / 2
      ctx.fillStyle = ai.color
      ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.beginPath(); ctx.arc(hx - 2, hy - 2, 2.2, 0, Math.PI * 2); ctx.fill()
    }

    // player snake — drawn with a bright white outline + labelled head so it's unmistakable vs AI
    const segs = st.segs
    const pAng = Math.atan2(st.dirAngle !== undefined ? Math.sin(st.dirAngle) : 0, st.dirAngle !== undefined ? Math.cos(st.dirAngle) : 1)
    for (let i = segs.length - 1; i >= 0; i--) {
      const s = segs[i]
      const sx = s.x - camX + viewW / 2, sy = s.y - camY + viewH / 2
      if (sx < -40 || sx > viewW + 40 || sy < -40 || sy > viewH + 40) continue
      const w = i === 0 ? 10 : Math.max(3.5, 9 * (1 - i / (segs.length + 10)))
      ctx.globalAlpha = i === 0 ? 1 : 0.75
      // white outline for separation from AI snakes
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'
      ctx.lineWidth = 1.6
      ctx.beginPath(); ctx.arc(sx, sy, w / 2 + 1.4, 0, Math.PI * 2); ctx.stroke()
      // body fill
      ctx.fillStyle = snakeColor
      ctx.beginPath(); ctx.arc(sx, sy, w / 2, 0, Math.PI * 2); ctx.fill()
      if (i === 0) {
        ctx.globalAlpha = 1
        // two eyes looking in the direction of travel
        const px = Math.cos(pAng), py = Math.sin(pAng)
        const perpX = -py, perpY = px
        ctx.fillStyle = '#fff'
        for (const sgn of [-1, 1]) {
          ctx.beginPath(); ctx.arc(sx + px * 4 + perpX * sgn * 3, sy + py * 4 + perpY * sgn * 3, 2.6, 0, Math.PI * 2); ctx.fill()
        }
        // pupils
        ctx.fillStyle = '#111'
        for (const sgn of [-1, 1]) {
          ctx.beginPath(); ctx.arc(sx + px * 6 + perpX * sgn * 3, sy + py * 6 + perpY * sgn * 3, 1.3, 0, Math.PI * 2); ctx.fill()
        }
        // "YOU" label
        ctx.font = 'bold 12px Orbitron, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = 'rgba(0,0,0,0.8)'
        ctx.lineWidth = 3
        ctx.strokeText('YOU', sx, sy - 18)
        ctx.fillText('YOU', sx, sy - 18)
      }
    }

    // death bursts from killed snakes
    const now = performance.now()
    const bs = burstRef.current
    for (let i = bs.length - 1; i >= 0; i--) {
      const b = bs[i]
      if (!b.alive) continue
      const age = now - b.t
      if (age > 900) { b.alive = false; continue }
      const prog = age / 900
      const bsx = b.x - camX + viewW / 2, bsy = b.y - camY + viewH / 2
      const er = 10 + prog * 90
      ctx.globalAlpha = Math.max(0, 1 - prog) * 0.8
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 6 * (1 - prog) + 1
      ctx.beginPath(); ctx.arc(bsx, bsy, er, 0, Math.PI * 2); ctx.stroke()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(bsx, bsy, er * 0.6, 0, Math.PI * 2); ctx.stroke()
      // sparkle particles
      for (let p = 0; p < 8; p++) {
        const pa = (p / 8) * Math.PI * 2 + prog * 0.8
        const pr = er * 0.4 + prog * 60
        ctx.fillStyle = p % 2 ? '#fbbf24' : '#fff'
        ctx.beginPath(); ctx.arc(bsx + Math.cos(pa) * pr, bsy + Math.sin(pa) * pr, 2 + (1 - prog) * 2, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    // floating "KILLED!" / combo popups
    const pp = popupRef.current
    for (let i = pp.length - 1; i >= 0; i--) {
      const p = pp[i]
      if (!p.alive) continue
      const page = now - p.t
      if (page > 1300) { p.alive = false; continue }
      const pprog = page / 1300
      const ppx = p.x - camX + viewW / 2, ppy = p.y - camY + viewH / 2 - 30 - pprog * 50
      const psize = p.big ? Math.max(14, 26 - pprog * 8) : Math.max(11, 20 - pprog * 8)
      ctx.globalAlpha = Math.max(0, 1 - pprog)
      ctx.font = `900 ${psize}px Orbitron, sans-serif`
      ctx.textAlign = 'center'
      ctx.lineWidth = 4
      ctx.strokeStyle = 'rgba(0,0,0,0.85)'
      ctx.strokeText(p.text, ppx, ppy)
      ctx.fillStyle = p.big ? '#fbbf24' : '#f87171'
      ctx.fillText(p.text, ppx, ppy)
      ctx.globalAlpha = 1
    }
    // ── minimap ──
    const mmW = 140, mmH = 100, mmPad = 10
    const mmX = viewW - mmW - mmPad, mmY = viewH - mmH - mmPad
    const headMm = st.segs[0]
    const mmRange = 2400
    ctx.globalAlpha = 0.7
    ctx.fillStyle = 'rgba(13,10,26,0.8)'
    ctx.strokeStyle = 'rgba(139,92,246,0.4)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.roundRect(mmX, mmY, mmW, mmH, 6); ctx.fill(); ctx.stroke()
    ctx.globalAlpha = 1
    // draw gifts as green dots
    for (const gift of st.gifts) {
      if (gift.shed) continue
      const gx = mmX + mmW / 2 + ((gift.x - headMm.x) / mmRange) * mmW
      const gy = mmY + mmH / 2 + ((gift.y - headMm.y) / mmRange) * mmH
      if (gx < mmX || gx > mmX + mmW || gy < mmY || gy > mmY + mmH) continue
      ctx.fillStyle = '#22c55e'
      ctx.beginPath(); ctx.arc(gx, gy, 2, 0, Math.PI * 2); ctx.fill()
    }
    // draw AI snake heads as red dots
    for (const ai of st.ai) {
      if (!ai.alive) continue
      const ah = ai.segs[0]
      const ax = mmX + mmW / 2 + ((ah.x - headMm.x) / mmRange) * mmW
      const ay = mmY + mmH / 2 + ((ah.y - headMm.y) / mmRange) * mmH
      if (ax < mmX || ax > mmX + mmW || ay < mmY || ay > mmY + mmH) continue
      ctx.fillStyle = '#ef4444'
      ctx.beginPath(); ctx.arc(ax, ay, 2.5, 0, Math.PI * 2); ctx.fill()
    }
    // draw player as white dot
    const px = mmX + mmW / 2, py = mmY + mmH / 2
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 1
  }

  // timer
  useEffect(() => {
    if (!gameActive || gameOver || !showTimer || timeLimit <= 0) return
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); setGameOver(true); const c = resolveSound(settings?.sound_gameover_id); if (c) playSound(c); else synthGameOver(); exitFullscreen(); return 0 }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [gameActive, gameOver, showTimer, timeLimit, settings, resolveSound, exitFullscreen])

  useEffect(() => { if (score > highScore) setHighScore(score) }, [score])
  const gameOverHandledRef = useRef(false)
  useEffect(() => {
    if (gameOver && !gameOverHandledRef.current) { gameOverHandledRef.current = true; setTimeout(() => handleComplete(), 1200) }
  }, [gameOver, handleComplete])
  useEffect(() => { if (!gameOver) gameOverHandledRef.current = false }, [gameOver])

  useEffect(() => {
    const prevent = (e) => e.preventDefault()
    document.addEventListener('touchmove', prevent, { passive: false })
    document.addEventListener('gesturestart', prevent, { passive: false })
    document.addEventListener('gesturechange', prevent, { passive: false })
    return () => {
      document.removeEventListener('touchmove', prevent)
      document.removeEventListener('gesturestart', prevent)
      document.removeEventListener('gesturechange', prevent)
    }
  }, [gameActive])

  const viewport = { w: typeof window !== 'undefined' ? (window.visualViewport?.width || window.innerWidth) : 800, h: typeof window !== 'undefined' ? (window.visualViewport?.height || window.innerHeight) : 600 }

  const particles = useRef(Array.from({ length: 12 }, (_, i) => ({ id: i, left: `${8 + Math.random() * 84}%`, size: 2 + Math.random() * 3, dur: 8 + Math.random() * 12, delay: Math.random() * 10, op: 0.2 + Math.random() * 0.3, c: ['rgba(139,92,246,', 'rgba(168,85,247,', 'rgba(99,102,241,'][i % 3] }))).current
  const ft = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="ngr">
      <style>{CSS}</style>
      {particles.map(p => <div key={p.id} className="pt" style={{ left: p.left, width: p.size, height: p.size, background: p.c + p.op + ')', boxShadow: `0 0 ${p.size * 3}px ${p.c}0.3)`, animationDuration: p.dur + 's', animationDelay: p.delay + 's' }} />)}

      {showIntro && (
        <div className="io">
          <div className="card">
            <div className="logo">🐍</div>
            <h1>{settings?.heading_1 || 'NAGARAJA'}</h1>
            <p className="sub">{settings?.heading_2 || 'Slither, eat gifts, survive the snakes!'}</p>
            {settings?.heading_3 && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>{settings.heading_3}</p>}
            {settings?.intro_text && <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{settings.intro_text}</div>}
            <div className="legend">
              {gifts.map((g, i) => (
                <span key={i} className="lg"><span style={{ fontSize: 16 }}>{g.emoji || '•'}</span>{g.name} <b style={{ color: '#fbbf24' }}>+{g.points || 1}</b></span>
              ))}
            </div>
            <div className="inst">
              <p>Steer your serpent toward the gifts to collect them and grow.<br />Use your <kbd>mouse</kbd> or <kbd>drag</kbd> to steer, and <kbd>hold click</kbd> / <kbd>space</kbd> to boost.{boostEnabled ? <><br />Avoid <b style={{ color: '#f87171' }}>AI snakes</b> — touch one and it's game over!</> : <><br />Avoid <b style={{ color: '#f87171' }}>AI snakes</b> — touch one and it's game over!</>}</p>
            </div>
            {settings?.terms_enabled && <div style={{ marginBottom: 16 }}><label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><input type="checkbox" checked={termsAgreed} onChange={(e) => setTermsAgreed(e.target.checked)} style={{ width: 14, height: 14 }} />{settings.terms_text || 'I agree to Terms & Conditions'}{settings.terms_url && <a href={settings.terms_url} target="_blank" rel="noreferrer" style={{ color: '#a78bfa', textDecoration: 'underline' }}>Link</a>}</label></div>}
            <button className="sbtn" onClick={handleStart} disabled={!!settings?.terms_enabled && !termsAgreed} style={!!settings?.terms_enabled && !termsAgreed ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>{settings?.start_button_text || 'START SLITHERING'}</button>
          </div>
        </div>
      )}

      {!showIntro && (
        <>
          <canvas ref={canvasRef} width={viewport.w} height={viewport.h} style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 1, display: 'block' }} />
          <div className="hud hud-tl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <button className="rbtn home-btn" onClick={handleBackToMenu} aria-label="Back to main menu" style={{ background: 'transparent', borderColor: 'rgba(148,163,184,.4)' }}>⌂ HOME</button>
            <div className="gp2">
              <div className="score-row">
                <div><div className="lb">SCORE</div><div className="vl big" style={{ color: '#22c55e' }}>{score}</div></div>
                <div style={{ width: 1, height: 28, background: 'linear-gradient(180deg,transparent,rgba(139,92,246,.4),transparent)' }} />
                <div><div className="lb">BEST</div><div className="vl sm">{highScore}</div></div>
                <div style={{ width: 1, height: 28, background: 'linear-gradient(180deg,transparent,rgba(139,92,246,.4),transparent)' }} />
                <div><div className="lb">LENGTH</div><div className="vl sm">{length}</div></div>
                <div style={{ width: 1, height: 28, background: 'linear-gradient(180deg,transparent,rgba(139,92,246,.4),transparent)' }} />
                <div><div className="lb">KILLS</div><div className="vl sm" style={{ color: '#f87171' }}>{kills}</div></div>
              </div>
            </div>
          </div>
          <div className="hud hud-tr">
            {showTimer && timeLimit > 0 && <div className="gp2" style={{ fontFamily: 'Orbitron', fontSize: 'clamp(11px,2vw,16px)', fontWeight: 700, color: '#fbbf24' }}>{ft(timeLeft)}</div>}
          </div>
          <div className="hud hud-br">
            <button className="rbtn" onClick={handleRestart}>↻ RESTART</button>
          </div>
          <div className="swipe-hint">Drag to steer · Hold to boost</div>
        </>
      )}

      {gameOver && (
        <div className="go">
          <div className="card">
            <div className="sk">💀</div>
            <h2>GAME OVER</h2>
            <div className="fs">Score: {score}</div>
            <div className="bl">Best: {highScore}</div>
            <button className="cb" onClick={handleContinue}>{settings?.continue_button_text || 'CONTINUE'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Demo() {
  return <NagarajaPlayerPage />
}
