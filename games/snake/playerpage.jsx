import { useState, useEffect, useRef, useCallback } from 'react'

let audioCtx = null
const audioEls = {}
function getAudioCtx() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); return audioCtx }
function synthEat() {
  try { const c = getAudioCtx(), o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.type = 'sine'; o.frequency.setValueAtTime(520, c.currentTime); o.frequency.exponentialRampToValueAtTime(1400, c.currentTime + 0.15); g.gain.setValueAtTime(0.3, c.currentTime); g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.2); o.start(c.currentTime); o.stop(c.currentTime + 0.2) } catch {}
}
function synthGameOver() {
  try { const c = getAudioCtx(), o1 = c.createOscillator(), g1 = c.createGain(); o1.connect(g1); g1.connect(c.destination); o1.type = 'sawtooth'; o1.frequency.setValueAtTime(600, c.currentTime); o1.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.5); g1.gain.setValueAtTime(0.25, c.currentTime); g1.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.5); o1.start(c.currentTime); o1.stop(c.currentTime + 0.5); const o2 = c.createOscillator(), g2 = c.createGain(); o2.connect(g2); g2.connect(c.destination); o2.type = 'sine'; o2.frequency.setValueAtTime(120, c.currentTime + 0.1); o2.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.6); g2.gain.setValueAtTime(0.4, c.currentTime + 0.1); g2.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.6); o2.start(c.currentTime + 0.1); o2.stop(c.currentTime + 0.6) } catch {}
}
function primeSound(url) { if (!url || audioEls[url]) return; const a = new Audio(url); a.preload = 'auto'; audioEls[url] = a }
function playSound(url) {
  if (!url) return
  try {
    let a = audioEls[url]
    if (!a) { a = new Audio(url); audioEls[url] = a }
    a.currentTime = 0
    a.volume = 1
    a.play().catch(() => {})
  } catch {}
}
function unlockAudio() {
  try { const c = getAudioCtx(); if (c.state === 'suspended') c.resume() } catch {}
  try { for (const k in audioEls) { const a = audioEls[k]; a.volume = 0; a.currentTime = 0; a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = 1 }).catch(() => { a.volume = 1 }) } } catch {}
}
function vibrate(pattern) { try { if (navigator.vibrate) navigator.vibrate(pattern) } catch {} }

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&family=Rajdhani:wght@400;500;600;700&display=swap');
.snk *{margin:0;padding:0;box-sizing:border-box}
.snk{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;overflow:hidden;font-family:'Rajdhani',sans-serif;color:#fff;background:linear-gradient(135deg,#090214,#130525 40%,#1D0838);touch-action:none;-webkit-user-select:none;user-select:none}
.snk::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 50vmax 50vmax at 20% 30%,rgba(139,92,246,.08),transparent 70%),radial-gradient(ellipse 40vmax 40vmax at 80% 70%,rgba(168,85,247,.06),transparent 70%);pointer-events:none;z-index:0}
.snk .gp{position:absolute;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(139,92,246,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.03) 1px,transparent 1px);background-size:60px 60px}
.snk .pt{position:absolute;border-radius:50%;pointer-events:none;animation:pf linear infinite}
@keyframes pf{0%{transform:translateY(100vh) scale(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-10vh) scale(1);opacity:0}}
@keyframes fp{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.4);opacity:.3}}
@keyframes foodBlink{0%,100%{opacity:1}50%{opacity:.35}}
.snk .food-tile{}

:fullscreen .snk,
:-webkit-full-screen .snk,
:-moz-full-screen .snk,
:-ms-fullscreen .snk{width:100vw;height:100vh}
html:fullscreen,
html:-webkit-full-screen,
html:-moz-full-screen,
html:-ms-fullscreen{overflow:hidden}

.hud{position:fixed;z-index:100;pointer-events:none}
.hud>*{pointer-events:auto}
.hud-tl{top:max(12px,env(safe-area-inset-top));left:max(12px,env(safe-area-inset-left))}
.hud-tr{top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.hud-br{bottom:max(12px,env(safe-area-inset-bottom));right:max(12px,env(safe-area-inset-right));display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.hud-bc{bottom:max(12px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%)}
@media(max-width:600px){
  .hud-tl{top:max(8px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left))}
  .hud-tr{top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));gap:6px}
  .hud-br{bottom:max(56px,env(safe-area-inset-bottom));right:max(8px,env(safe-area-inset-right))}
  .hud-bc{bottom:max(8px,env(safe-area-inset-bottom))}
}
@media(max-height:500px){
  .hud-tl{top:max(4px,env(safe-area-inset-top));left:max(4px,env(safe-area-inset-left))}
  .hud-tr{top:max(4px,env(safe-area-inset-top));right:max(4px,env(safe-area-inset-right));gap:4px}
  .hud-br{bottom:max(44px,env(safe-area-inset-bottom));right:max(4px,env(safe-area-inset-right))}
  .hud-bc{bottom:max(4px,env(safe-area-inset-bottom))}
}

.gp2{background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none;border:1px solid rgba(139,92,246,.2);border-radius:12px;padding:8px 12px;box-shadow:none}
.gp2.diff-wrap{background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:none;border-color:rgba(139,92,246,.15)}
@media(max-width:600px){.gp2{padding:5px 8px;border-radius:10px}}

.hud .lb{font-family:'Orbitron',sans-serif;font-size:7px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(251,191,36,.7);margin-bottom:2px}
.hud .vl{font-family:'Orbitron',sans-serif;font-weight:900;color:#fbbf24;text-shadow:0 0 12px rgba(251,191,36,.4)}
.hud .vl.big{font-size:clamp(16px,3vw,28px)}
.hud .vl.sm{font-size:clamp(11px,2vw,16px);color:#a78bfa;text-shadow:0 0 10px rgba(167,139,250,.3)}
.score-row{display:flex;gap:12px;align-items:center}

.rbtn{padding:8px 16px;background:transparent;border:1.5px solid rgba(139,92,246,.5);border-radius:50px;color:#fff;font-family:'Orbitron',sans-serif;font-size:clamp(8px,1.1vw,11px);font-weight:700;letter-spacing:2px;cursor:pointer;transition:all .2s;box-shadow:none;text-transform:uppercase}
.rbtn:hover{transform:translateY(-1px);background:rgba(124,58,237,.15)}
.rbtn:active{transform:scale(.97)}

.diff{display:flex;gap:3px}
.diff button{flex:1;padding:5px 6px;border-radius:6px;border:1.5px solid transparent;font-family:'Orbitron',sans-serif;font-size:clamp(6px,.9vw,9px);font-weight:700;letter-spacing:1px;cursor:pointer;text-transform:uppercase;text-align:center;transition:all .2s}
.diff .e{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.3);color:#22c55e}
.diff .e.on{background:rgba(34,197,94,.25);border-color:#22c55e;box-shadow:0 0 12px rgba(34,197,94,.2)}
.diff .m{background:rgba(249,115,22,.1);border-color:rgba(249,115,22,.3);color:#f97316}
.diff .m.on{background:rgba(249,115,22,.25);border-color:#f97316;box-shadow:0 0 12px rgba(249,115,22,.2)}
.diff .h{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.3);color:#ef4444}
.diff .h.on{background:rgba(239,68,68,.25);border-color:#ef4444;box-shadow:0 0 12px rgba(239,68,68,.2)}

.ib{display:none}

.go{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.75);backdrop-filter:blur(12px);animation:fi .3s}
@keyframes fi{from{opacity:0}to{opacity:1}}
.go .card{background:rgba(15,5,30,.9);backdrop-filter:blur(24px);border:1.5px solid rgba(139,92,246,.3);border-radius:24px;padding:clamp(20px,5vw,40px);max-width:min(380px,90vw);width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.5);animation:su .4s cubic-bezier(.16,1,.3,1)}
@keyframes su{from{transform:translateY(40px) scale(.95);opacity:0}to{transform:none;opacity:1}}
.go h2{font-family:'Orbitron',sans-serif;font-size:clamp(18px,4vw,28px);font-weight:900;background:linear-gradient(135deg,#f87171,#ef4444,#dc2626);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px}
.go .sk{font-size:clamp(36px,8vw,64px);margin-bottom:8px;filter:drop-shadow(0 0 20px rgba(239,68,68,.3))}
.go .fs{font-family:'Orbitron',sans-serif;font-size:clamp(13px,2.5vw,18px);font-weight:700;color:#a78bfa;margin-bottom:4px}
.go .bl{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:20px}
.go .cb{width:100%;padding:14px;background:linear-gradient(135deg,#7c3aed,#6d28d9);border:1.5px solid rgba(139,92,246,.5);border-radius:50px;color:#fff;font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;cursor:pointer;transition:all .2s;box-shadow:0 6px 24px rgba(124,58,237,.3)}
.go .cb:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(124,58,237,.5)}

.io{position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#090214,#130525 40%,#1D0838);animation:fi .4s}
.io .card{background:rgba(15,5,30,.8);backdrop-filter:blur(24px);border:1.5px solid rgba(139,92,246,.25);border-radius:28px;padding:clamp(20px,5vw,40px);max-width:min(420px,90vw);width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.4);animation:su .5s cubic-bezier(.16,1,.3,1)}
.io .logo{font-size:clamp(32px,8vw,56px);margin-bottom:12px;filter:drop-shadow(0 0 20px rgba(34,197,94,.3))}
.io h1{font-family:'Orbitron',sans-serif;font-size:clamp(18px,5vw,34px);font-weight:900;background:linear-gradient(135deg,#c084fc,#a855f7,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px}
.io .sub{font-size:14px;font-weight:500;color:rgba(255,255,255,.5);margin-bottom:20px;letter-spacing:1px}
.io .inst{background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.15);border-radius:12px;padding:12px;margin-bottom:20px}
.io .inst p{font-size:12px;color:rgba(255,255,255,.6);line-height:1.7}
.io kbd{display:inline-block;padding:2px 6px;background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);border-radius:4px;font-family:'Orbitron',sans-serif;font-size:9px;color:#a78bfa;margin:0 2px}
.io .sbtn{width:100%;max-width:280px;padding:14px 0;background:linear-gradient(135deg,#22c55e,#16a34a 50%,#15803d);border:1.5px solid rgba(34,197,94,.5);border-radius:50px;color:#fff;font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;letter-spacing:3px;cursor:pointer;transition:all .2s;box-shadow:0 6px 24px rgba(34,197,94,.3);text-transform:uppercase}
.io .sbtn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(34,197,94,.5)}

.bw{position:relative;border-radius:16px;padding:3px;background:linear-gradient(135deg,rgba(139,92,246,.5),rgba(168,85,247,.3),rgba(99,102,241,.5));box-shadow:0 0 30px rgba(139,92,246,.2),0 0 60px rgba(139,92,246,.1)}
.bw::before{content:'';position:absolute;inset:-2px;border-radius:18px;z-index:-1;background:linear-gradient(135deg,rgba(139,92,246,.15),transparent,rgba(168,85,247,.15));filter:blur(8px)}
.b{background:linear-gradient(180deg,#0a0520,#0d0828 50%,#0f0a2e);border-radius:14px;position:relative;overflow:hidden;box-shadow:inset 0 0 60px rgba(0,0,0,.5)}

.swipe-hint{display:none;position:fixed;bottom:max(40px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:90;font-family:'Orbitron',sans-serif;font-size:9px;color:rgba(255,255,255,.3);letter-spacing:1px;text-transform:uppercase;pointer-events:none}
@media(max-width:600px){.swipe-hint{display:block}}

`

function SnakePlayerPage({ gameData = {}, sessionToken = null, onComplete = () => {} }) {
  const { settings, soundMap } = gameData
  const soundMapRef = useRef(soundMap || {})
  const resolveSound = useCallback((id) => { if (!id) return null; const n = parseInt(id); return isNaN(n) ? id : (soundMapRef.current[n] || null) }, [])
  const [termsAgreed, setTermsAgreed] = useState(false)

  const snakeColor = settings?.snake_color || '#22c55e'
  const foodColor = settings?.food_color || '#ef4444'
  const baseSpeed = settings?.speed || 5
  const showTimer = !!settings?.show_timer
  const timeLimit = settings?.time_limit_seconds || 0

  const getViewport = () => {
    if (typeof window === 'undefined') return { w: 1920, h: 1080 }
    const vv = window.visualViewport
    return vv ? { w: vv.width, h: vv.height } : { w: window.innerWidth, h: window.innerHeight }
  }
  const [winSize, setWinSize] = useState(getViewport())
  useEffect(() => {
    const r = () => setWinSize(getViewport())
    window.addEventListener('resize', r)
    window.addEventListener('orientationchange', r)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', r)
      window.visualViewport.addEventListener('scroll', r)
    }
    return () => {
      window.removeEventListener('resize', r)
      window.removeEventListener('orientationchange', r)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', r)
        window.visualViewport.removeEventListener('scroll', r)
      }
    }
  }, [])

  const aspect = winSize.w / winSize.h
  const baseRows = 40
  const boardW = settings?.board_width || Math.max(10, Math.round(baseRows * aspect))
  const boardH = settings?.board_height || baseRows

  const [showIntro, setShowIntro] = useState(true)
  const [gameActive, setGameActive] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [snake, setSnake] = useState([{ x: 10, y: 10 }])
  const [food, setFood] = useState({ x: 5, y: 5 })
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(gameData?.high_score || 0)
  const [foodCollected, setFoodCollected] = useState(0)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [difficulty, setDifficulty] = useState(baseSpeed <= 4 ? 'easy' : baseSpeed >= 8 ? 'hard' : 'medium')

  const dirRef = useRef({ x: 1, y: 0 })
  const pendingDirs = useRef([])
  const snakeRef = useRef([{ x: 10, y: 10 }])
  const foodRef = useRef({ x: 5, y: 5 })
  const scoreRef = useRef(0)
  const gameLoopRef = useRef(null)
  const timerRef = useRef(null)
  const completedRef = useRef(false)
  const prevSnakeRef = useRef([{ x: 10, y: 10 }])
  const lastTickTimeRef = useRef(performance.now())
  const animFrameRef = useRef(null)
  const [renderTick, setRenderTick] = useState(0)

  const setDirection = useCallback((x, y) => {
    const last = pendingDirs.current.length ? pendingDirs.current[pendingDirs.current.length - 1] : dirRef.current
    if ((x === last.x && y === last.y) || (x === -last.x && y === -last.y)) return false
    if (pendingDirs.current.length < 2) pendingDirs.current.push({ x, y })
    return true
  }, [])

  const speedForDifficulty = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 10 : 5
  const tick = Math.max(50, 300 - speedForDifficulty * 25)

  const spawnFood = useCallback((cs) => {
    let p; do { p = { x: Math.floor(Math.random() * boardW), y: Math.floor(Math.random() * boardH) } } while (cs.some(s => s.x === p.x && s.y === p.y))
    foodRef.current = p; setFood(p)
  }, [boardW, boardH])

  const handleComplete = useCallback(async () => {
    if (completedRef.current) return; completedRef.current = true
    try { if (sessionToken) await fetch('/api/play/session/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_token: sessionToken, score: scoreRef.current, player_data: {} }) }) } catch {}
    onComplete?.()
  }, [sessionToken, onComplete])

  const requestFullscreen = useCallback(() => {
    try {
      const el = document.documentElement
      const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen || el.mozRequestFullScreen
      if (rfs) rfs.call(el).catch(() => {})
    } catch {}
  }, [])

  const exitFullscreen = useCallback(() => {
    try {
      const dfs = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen || document.mozCancelFullScreen
      if (dfs && document.fullscreenElement) dfs.call(document).catch(() => {})
    } catch {}
  }, [])

  const handleStart = useCallback(() => {
    vibrate(15)
    const eat = resolveSound(settings?.sound_eat_id)
    const over = resolveSound(settings?.sound_gameover_id)
    if (eat) primeSound(eat)
    if (over) primeSound(over)
    unlockAudio()
    setShowIntro(false); setGameActive(true); setGameOver(false); completedRef.current = false
    const init = [{ x: Math.floor(boardW / 2), y: Math.floor(boardH / 2) }]
    snakeRef.current = init; setSnake(init); prevSnakeRef.current = init.map(s => ({ ...s })); lastTickTimeRef.current = performance.now()
    dirRef.current = { x: 1, y: 0 }; pendingDirs.current = []; scoreRef.current = 0; setScore(0); setFoodCollected(0); setTimeLeft(timeLimit); spawnFood(init)
  }, [boardW, boardH, spawnFood, timeLimit, settings, resolveSound])

  const handleRestart = useCallback(() => { if (timerRef.current) clearInterval(timerRef.current); completedRef.current = false; handleStart() }, [handleStart])

  const handleBackToMenu = useCallback(() => {
    vibrate(8)
    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    exitFullscreen()
    setGameActive(false)
    setGameOver(false)
    setShowIntro(true)
  }, [exitFullscreen])

  const handleContinue = useCallback(() => {
    handleComplete()
    handleBackToMenu()
  }, [handleComplete, handleBackToMenu])

  useEffect(() => {
    if (!gameActive || gameOver) return
    gameLoopRef.current = setInterval(() => {
      if (pendingDirs.current.length) dirRef.current = pendingDirs.current.shift()
      const dir = dirRef.current, curr = snakeRef.current, head = curr[0]
      let nx = (head.x + dir.x + boardW) % boardW, ny = (head.y + dir.y + boardH) % boardH
      prevSnakeRef.current = curr.map(s => ({ ...s }))
      if (curr.slice(0, -1).some(s => s.x === nx && s.y === ny)) { vibrate([60, 40, 60]); setGameOver(true); const c = resolveSound(settings?.sound_gameover_id); if (c) playSound(c); else synthGameOver(); return }
      const ns = [{ x: nx, y: ny }, ...curr]
      if (nx === foodRef.current.x && ny === foodRef.current.y) { scoreRef.current += 10; setScore(scoreRef.current); setFoodCollected(p => p + 1); vibrate(12); const c = resolveSound(settings?.sound_eat_id); if (c) playSound(c); else synthEat(); spawnFood(ns) } else { ns.pop() }
      snakeRef.current = ns; setSnake(ns); lastTickTimeRef.current = performance.now()
    }, tick)
    return () => clearInterval(gameLoopRef.current)
  }, [gameActive, gameOver, tick, boardW, boardH, spawnFood, settings, resolveSound])

  useEffect(() => {
    if (!gameActive || gameOver) return; let r = true
    const a = () => { if (!r) return; setRenderTick(t => t + 1); animFrameRef.current = requestAnimationFrame(a) }
    animFrameRef.current = requestAnimationFrame(a)
    return () => { r = false; if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [gameActive, gameOver])

  useEffect(() => {
    if (!gameActive || gameOver || !showTimer || timeLimit <= 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(timerRef.current); timerRef.current = null; return 0 }
        return p - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gameActive, gameOver, showTimer, timeLimit])

  useEffect(() => { if (score > highScore) setHighScore(score) }, [score])
  useEffect(() => { if (gameOver && !completedRef.current) { setTimeout(() => handleComplete(), 1500); exitFullscreen() } }, [gameOver])

  useEffect(() => {
    const onFSChange = () => setWinSize(getViewport())
    document.addEventListener('fullscreenchange', onFSChange)
    document.addEventListener('webkitfullscreenchange', onFSChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFSChange)
      document.removeEventListener('webkitfullscreenchange', onFSChange)
    }
  }, [])

  useEffect(() => {
    const h = (e) => { const m = { ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0} }[e.key]; if (m && setDirection(m.x, m.y)) vibrate(5) }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  useEffect(() => {
    if (!gameActive) return
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

  const touchStart = useRef(null)
  const touchLast = useRef(null)
  const applyDragDir = (cx, cy) => {
    const base = touchLast.current || touchStart.current
    if (!base) return null
    const dx = cx - base.x, dy = cy - base.y
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return null
    let nd
    if (Math.abs(dx) > Math.abs(dy)) nd = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 }
    else nd = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 }
    if (!setDirection(nd.x, nd.y)) return null
    vibrate(5)
    touchLast.current = { x: cx, y: cy }
    return nd
  }
  const onTouchStart = (e) => {
    if (!gameActive) return
    if (e.target.closest('button, a, input, label, .card, .io, .go')) return
    if (e.touches.length > 1) return
    e.preventDefault()
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    touchLast.current = touchStart.current
  }
  const onTouchMove = (e) => {
    if (!gameActive) return
    if (e.target.closest('button, a, input, label, .card, .io, .go')) return
    e.preventDefault()
    if (!touchStart.current || e.touches.length === 0) return
    applyDragDir(e.touches[0].clientX, e.touches[0].clientY)
  }
  const onTouchEnd = (e) => {
    if (!gameActive) return
    if (e.target.closest('button, a, input, label, .card, .io, .go')) return
    e.preventDefault()
    if (!touchStart.current) return
    if (e.changedTouches[0]) applyDragDir(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
    touchStart.current = null
    touchLast.current = null
  }
  const pad = 4
  const displayW = winSize.w - pad * 2
  const displayH = winSize.h - pad * 2

  const cellW = (displayW - (boardW - 1) - 4) / boardW
  const cellH = (displayH - (boardH - 1) - 4) / boardH
  const segW = cellW + 1
  const segH = cellH + 1

  const now = performance.now()
  const elapsed = lastTickTimeRef.current ? now - lastTickTimeRef.current : tick
  const rawT = Math.min(1, elapsed / tick)
  const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

  const smoothSegs = snake.map((seg, i) => {
    const prev = prevSnakeRef.current[i] || seg
    const dx = Math.abs(seg.x - prev.x), dy = Math.abs(seg.y - prev.y)
    const isWrap = dx > boardW / 2 || dy > boardH / 2
    const segT = ease(Math.max(0, Math.min(1, rawT - i * 0.025)))
    let x = isWrap ? seg.x : prev.x + (seg.x - prev.x) * segT
    let y = isWrap ? seg.y : prev.y + (seg.y - prev.y) * segT
    let perpX = 0, perpY = 1
    if (snake.length > 1) { const r = i > 0 ? snake[i - 1] : snake[1]; if (r) { const ddx = seg.x - r.x, ddy = seg.y - r.y, l = Math.sqrt(ddx * ddx + ddy * ddy) || 1; perpX = -ddy / l; perpY = ddx / l } }
    const br = snake.length > 1 ? i / (snake.length - 1) : 0
    const w = Math.sin(br * Math.PI * 3.5 - now * 0.006) * 0.28 * Math.sin(br * Math.PI) * Math.min(1, snake.length / 4)
    return { x: x + perpX * w, y: y + perpY * w }
  })

  const particles = useRef(Array.from({ length: 12 }, (_, i) => ({
    id: i, left: `${8 + Math.random() * 84}%`, size: 2 + Math.random() * 3, dur: 8 + Math.random() * 12, delay: Math.random() * 10, op: 0.2 + Math.random() * 0.3, c: ['rgba(139,92,246,', 'rgba(168,85,247,', 'rgba(99,102,241,'][i % 3]
  }))).current
  const ft = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="snk" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <style>{CSS}</style>
      <div className="gp" />
      {particles.map(p => <div key={p.id} className="pt" style={{ left: p.left, width: p.size, height: p.size, background: p.c + p.op + ')', boxShadow: `0 0 ${p.size * 3}px ${p.c}0.3)`, animationDuration: p.dur + 's', animationDelay: p.delay + 's' }} />)}

      {showIntro && (
        <div className="io">
          <div className="card">
            <div className="logo">🐍</div>
            <h1>{settings?.heading_1 || 'SNAKE GAME'}</h1>
            <p className="sub">{settings?.heading_2 || 'Eat, grow, survive!'}</p>
            {settings?.heading_3 && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>{settings.heading_3}</p>}
            {settings?.intro_text && <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{settings.intro_text}</div>}
            <div className="inst"><p>Use <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to move.<br />On mobile, swipe or use the D-pad.<br />Eat food to grow. Borders wrap around!</p></div>
            {settings?.terms_enabled && <div style={{ marginBottom: 16 }}><label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 12, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><input type="checkbox" checked={termsAgreed} onChange={(e) => setTermsAgreed(e.target.checked)} style={{ width: 14, height: 14 }} />{settings.terms_text || 'I agree to Terms & Conditions'}{settings.terms_url && <a href={settings.terms_url} target="_blank" rel="noreferrer" style={{ color: '#a78bfa', textDecoration: 'underline' }}>Link</a>}</label></div>}
            <button className="sbtn" onClick={handleStart} disabled={!!settings?.terms_enabled && !termsAgreed} style={!!settings?.terms_enabled && !termsAgreed ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>{settings?.start_button_text || 'START PLAYING'}</button>
          </div>
        </div>
      )}

      {!showIntro && (
        <>
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <div className="bw" style={{ width: displayW + 6, height: displayH + 6 }}>
              <div className="b" style={{ width: displayW, height: displayH, padding: 2, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden', backgroundImage: `linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)`, backgroundSize: `${cellW + 1}px ${cellH + 1}px`, backgroundPosition: '2px 2px' }} />
                <div className="food-tile" style={{ position: 'absolute', left: food.x * (cellW + 1) + 2, top: food.y * (cellH + 1) + 2, width: segW, height: segH, borderRadius: 7, background: foodColor, boxShadow: `0 0 ${segW * .3}px ${foodColor},0 0 ${segW * .6}px ${foodColor}88`, zIndex: 50 }}>
                  <div style={{ position: 'absolute', inset: -segW * .15, borderRadius: '50%', background: `radial-gradient(circle,${foodColor}55,transparent 70%)`, animation: 'fp 1.5s ease-in-out infinite' }} />
                </div>
                {[...smoothSegs].reverse().map((seg, ri) => {
                  const i = smoothSegs.length - 1 - ri, isHead = i === 0
                  const br = snake.length > 1 ? i / (snake.length - 1) : 0, b = 1 - br * .25
                  return (
                    <div key={i} style={{ position: 'absolute', left: seg.x * (cellW + 1) + 2, top: seg.y * (cellH + 1) + 2, width: segW, height: segH, borderRadius: isHead ? 9 : 7, background: isHead ? `radial-gradient(circle at 40% 35%,${snakeColor},${snakeColor}dd)` : `linear-gradient(135deg,${snakeColor}${Math.round(b * 255).toString(16).padStart(2, '0')},${snakeColor}${Math.round(b * 180).toString(16).padStart(2, '0')})`, boxShadow: isHead ? `0 0 14px ${snakeColor}55,0 0 6px ${snakeColor}33` : `0 0 ${8 - br * 4}px ${snakeColor}${Math.round((1 - br) * 60).toString(16).padStart(2, '0')}`, zIndex: isHead ? 20 : Math.max(1, 10 - i) }}>
                      {isHead && <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '18%', left: '15%', width: Math.max(2, segW * .2), height: Math.max(2, segH * .2), background: '#fff', borderRadius: '50%' }}><div style={{ position: 'absolute', top: '15%', right: '10%', width: '50%', height: '50%', background: '#1a1a2e', borderRadius: '50%' }} /></div>
                        <div style={{ position: 'absolute', top: '18%', right: '15%', width: Math.max(2, segW * .2), height: Math.max(2, segH * .2), background: '#fff', borderRadius: '50%' }}><div style={{ position: 'absolute', top: '15%', right: '10%', width: '50%', height: '50%', background: '#1a1a2e', borderRadius: '50%' }} /></div>
                        {segW >= 10 && <div style={{ position: 'absolute', bottom: '18%', width: segW * .32, height: segH * .12, borderBottom: '2px solid rgba(0,0,0,.25)', borderRadius: '0 0 50% 50%' }} />}
                      </div>}
                      {segW > 8 && <div style={{ position: 'absolute', top: '10%', left: '15%', width: '50%', height: '30%', background: 'rgba(255,255,255,.08)', borderRadius: '50%', filter: 'blur(2px)' }} />}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="hud hud-tl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <button className="rbtn home-btn" onClick={handleBackToMenu} aria-label="Back to main menu" style={{ background: 'transparent', borderColor: 'rgba(148,163,184,.4)' }}>⌂ HOME</button>
            <div className="gp2">
              <div className="score-row">
                <div><div className="lb">SCORE</div><div className="vl big" style={{ color: '#22c55e' }}>{score}</div></div>
                <div style={{ width: 1, height: 28, background: 'linear-gradient(180deg,transparent,rgba(139,92,246,.4),transparent)' }} />
                <div><div className="lb">BEST</div><div className="vl sm">{highScore}</div></div>
              </div>
            </div>
          </div>

          <div className="hud hud-tr">
            {showTimer && timeLimit > 0 && <div className="gp2" style={{ fontFamily: 'Orbitron', fontSize: 'clamp(11px,2vw,16px)', fontWeight: 700, color: '#fbbf24' }}>{ft(timeLeft)}</div>}
            <div className="gp2 diff-wrap">
              <div className="diff">
                <button className={`e ${difficulty === 'easy' ? 'on' : ''}`} onClick={() => { vibrate(6); setDifficulty('easy') }}>EASY</button>
                <button className={`m ${difficulty === 'medium' ? 'on' : ''}`} onClick={() => { vibrate(6); setDifficulty('medium') }}>MED</button>
                <button className={`h ${difficulty === 'hard' ? 'on' : ''}`} onClick={() => { vibrate(6); setDifficulty('hard') }}>HARD</button>
              </div>
            </div>
          </div>

          <div className="hud hud-br">
            <button className="rbtn" onClick={handleRestart}>↻ RESTART</button>
          </div>

          <div className="hud hud-bc">
            <div className="ib"><span className="ar">◆</span>Arrow Keys to Move<span className="ar">◆</span></div>
          </div>

          <div className="swipe-hint">Swipe to move</div>
        </>
      )}

      {gameOver && (
        <div className="go">
          <div className="card">
            <div className="sk">💀</div>
            <h2>GAME OVER</h2>
            <div className="fs">Score: {score}</div>
            <div className="bl">Best: {highScore}</div>
            <button className="cb" onClick={() => { vibrate(8); handleContinue() }}>{settings?.continue_button_text || 'CONTINUE'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Demo() {
  return <SnakePlayerPage />
}