import { useState, useEffect, useRef, useCallback } from 'react'

function playSound(url) { if (!url) return; try { const a = new Audio(url); a.play().catch(() => {}) } catch {} }

export default function BreakoutPlayerPage({ gameData, sessionToken, onComplete }) {
  const { settings, soundMap } = gameData || {}
  const soundMapRef = useRef(soundMap || {})
  useEffect(() => { soundMapRef.current = soundMap || {} }, [soundMap])

  const resolveSound = useCallback((id) => {
    if (!id) return null
    return soundMapRef.current[id] || null
  }, [])

  const brickRows = Number(settings?.brick_rows) || 5
  const brickCols = Number(settings?.brick_cols) || 8
  const ballSpeed = Number(settings?.ball_speed) || 3
  const paddleW = Number(settings?.paddle_width) || 120
  const maxLives = Number(settings?.lives) || 3

  const CANVAS_W = 300
  const CANVAS_H = 500
  const BRICK_H = 18
  const BRICK_GAP = 3
  const PADDLE_H = 12
  const BALL_R = 6
  const PADDLE_Y = CANVAS_H - 30

  const brickW = (CANVAS_W - (brickCols + 1) * BRICK_GAP) / brickCols
  const brickTop = 30

  const ROW_COLORS = ['#ef4444','#f59e0b','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316']

  const [phase, setPhase] = useState('intro')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(maxLives)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)

  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const completedRef = useRef(false)
  const scoreRef = useRef(0)
  const livesRef = useRef(maxLives)
  const gameOverRef = useRef(false)
  const wonRef = useRef(false)

  const bricksRef = useRef([])
  const ballRef = useRef({ x: CANVAS_W / 2, y: PADDLE_Y - BALL_R, dx: ballSpeed, dy: -ballSpeed })
  const paddleRef = useRef({ x: (CANVAS_W - paddleW) / 2, y: PADDLE_Y, w: paddleW })
  const ballLaunchedRef = useRef(false)
  const speedMultRef = useRef(1)

  const initBricks = () => {
    const grid = []
    for (let r = 0; r < brickRows; r++) {
      const row = []
      for (let c = 0; c < brickCols; c++) {
        row.push({ alive: true, color: ROW_COLORS[r % ROW_COLORS.length] })
      }
      grid.push(row)
    }
    return grid
  }

  const drawGame = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    const bricks = bricksRef.current
    for (let r = 0; r < bricks.length; r++) {
      for (let ci = 0; ci < bricks[r].length; ci++) {
        const brick = bricks[r][ci]
        if (!brick.alive) continue
        const bx = BRICK_GAP + ci * (brickW + BRICK_GAP)
        const by = brickTop + r * (BRICK_H + BRICK_GAP)
        ctx.fillStyle = brick.color
        ctx.fillRect(bx, by, brickW, BRICK_H)
        ctx.fillStyle = 'rgba(255,255,255,0.2)'
        ctx.fillRect(bx, by, brickW, 3)
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'
        ctx.strokeRect(bx, by, brickW, BRICK_H)
      }
    }

    const paddle = paddleRef.current
    ctx.fillStyle = '#6366f1'
    ctx.fillRect(paddle.x, paddle.y, paddle.w, PADDLE_H)
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillRect(paddle.x, paddle.y, paddle.w, 3)

    const ball = ballRef.current
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.closePath()

    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    ctx.fillRect(0, CANVAS_H - 2, CANVAS_W, 2)
  }, [])

  const checkCollisions = useCallback(() => {
    const ball = ballRef.current
    const paddle = paddleRef.current
    const bricks = bricksRef.current
    let hitBrick = false
    let lost = false
    let allDead = true

    if (ball.x - BALL_R <= 0) { ball.x = BALL_R; ball.dx = Math.abs(ball.dx) }
    if (ball.x + BALL_R >= CANVAS_W) { ball.x = CANVAS_W - BALL_R; ball.dx = -Math.abs(ball.dx) }
    if (ball.y - BALL_R <= 0) { ball.y = BALL_R; ball.dy = Math.abs(ball.dy) }

    if (ball.y + BALL_R >= paddle.y && ball.y + BALL_R <= paddle.y + PADDLE_H + 4 &&
        ball.x >= paddle.x - BALL_R && ball.x <= paddle.x + paddle.w + BALL_R) {
      const hitPos = (ball.x - paddle.x) / paddle.w
      const angle = -Math.PI / 2 + (hitPos - 0.5) * (Math.PI / 2.5)
      const spd = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)
      ball.dx = Math.cos(angle) * spd
      ball.dy = Math.sin(angle) * spd
      if (ball.dy > 0) ball.dy = -Math.abs(ball.dy)
      ball.y = paddle.y - BALL_R
      const snd = resolveSound(settings?.sound_hit_id)
      if (snd) playSound(snd)
    }

    for (let r = 0; r < bricks.length; r++) {
      for (let ci = 0; ci < bricks[r].length; ci++) {
        const brick = bricks[r][ci]
        if (!brick.alive) continue
        allDead = false
        const bx = BRICK_GAP + ci * (brickW + BRICK_GAP)
        const by = brickTop + r * (BRICK_H + BRICK_GAP)
        if (ball.x + BALL_R > bx && ball.x - BALL_R < bx + brickW &&
            ball.y + BALL_R > by && ball.y - BALL_R < by + BRICK_H) {
          brick.alive = false
          hitBrick = true
          const overlapLeft = (ball.x + BALL_R) - bx
          const overlapRight = (bx + brickW) - (ball.x - BALL_R)
          const overlapTop = (ball.y + BALL_R) - by
          const overlapBottom = (by + BRICK_H) - (ball.y - BALL_R)
          const minOverlapX = Math.min(overlapLeft, overlapRight)
          const minOverlapY = Math.min(overlapTop, overlapBottom)
          if (minOverlapX < minOverlapY) {
            ball.dx = overlapLeft < overlapRight ? -Math.abs(ball.dx) : Math.abs(ball.dx)
          } else {
            ball.dy = overlapTop < overlapBottom ? -Math.abs(ball.dy) : Math.abs(ball.dy)
          }
          scoreRef.current += 10
          setScore(scoreRef.current)
          speedMultRef.current += 0.02
          const spd = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)
          const newSpd = ballSpeed * speedMultRef.current
          const ratio = newSpd / spd
          ball.dx *= ratio
          ball.dy *= ratio
          const snd = resolveSound(settings?.sound_brick_id)
          if (snd) playSound(snd)
          break
        }
      }
      if (hitBrick) break
    }

    if (ball.y + BALL_R > CANVAS_H) {
      lost = true
      livesRef.current -= 1
      setLives(livesRef.current)
      const snd = resolveSound(settings?.sound_lose_id)
      if (snd) playSound(snd)
    }

    if (allDead) {
      wonRef.current = true
      setWon(true)
      setGameOver(true)
      gameOverRef.current = true
      const snd = resolveSound(settings?.sound_win_id)
      if (snd) playSound(snd)
    }

    if (lost && livesRef.current <= 0) {
      setGameOver(true)
      gameOverRef.current = true
    }

    if (lost) {
      ball.x = paddle.x + paddle.w / 2
      ball.y = PADDLE_Y - BALL_R
      const spd = ballSpeed * speedMultRef.current
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3)
      ball.dx = Math.cos(angle) * spd
      ball.dy = Math.sin(angle) * spd
      if (ball.dy > 0) ball.dy = -Math.abs(ball.dy)
      ballLaunchedRef.current = false
    }
  }, [ballSpeed, settings, resolveSound])

  const updateGame = useCallback(() => {
    const ball = ballRef.current
    const paddle = paddleRef.current

    if (ballLaunchedRef.current) {
      ball.x += ball.dx
      ball.y += ball.dy
      checkCollisions()
    } else {
      ball.x = paddle.x + paddle.w / 2
      ball.y = PADDLE_Y - BALL_R
    }
  }, [checkCollisions])

  const startGame = () => {
    const initialSpd = ballSpeed
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3)
    bricksRef.current = initBricks()
    ballRef.current = {
      x: CANVAS_W / 2,
      y: PADDLE_Y - BALL_R,
      dx: Math.cos(angle) * initialSpd,
      dy: Math.sin(angle) * initialSpd,
    }
    paddleRef.current = { x: (CANVAS_W - paddleW) / 2, y: PADDLE_Y, w: paddleW }
    ballLaunchedRef.current = false
    speedMultRef.current = 1
    scoreRef.current = 0
    livesRef.current = maxLives
    completedRef.current = false
    gameOverRef.current = false
    wonRef.current = false
    setScore(0)
    setLives(maxLives)
    setGameOver(false)
    setWon(false)
    setPhase('playing')

    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    const loop = () => {
      if (!gameOverRef.current) {
        updateGame()
        drawGame()
        animationRef.current = requestAnimationFrame(loop)
      } else {
        drawGame()
      }
    }
    animationRef.current = requestAnimationFrame(loop)
  }

  const launchBall = () => {
    if (!ballLaunchedRef.current && !gameOverRef.current) {
      ballLaunchedRef.current = true
    }
  }

  const handleComplete = useCallback(async () => {
    if (completedRef.current) return
    completedRef.current = true
    try {
      if (sessionToken) {
        await fetch('/api/play/session/complete', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: sessionToken, score: scoreRef.current, player_data: {} })
        })
      }
    } catch {}
    onComplete?.()
  }, [sessionToken, onComplete])

  useEffect(() => {
    if (gameOver) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      handleComplete()
    }
  }, [gameOver, handleComplete])

  useEffect(() => {
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
  }, [])

  useEffect(() => { drawGame() }, [drawGame])

  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = CANVAS_W / rect.width
      const mx = (e.clientX - rect.left) * scaleX
      const paddle = paddleRef.current
      let nx = mx - paddle.w / 2
      nx = Math.max(0, Math.min(nx, CANVAS_W - paddle.w))
      paddle.x = nx
      if (!ballLaunchedRef.current) {
        const ball = ballRef.current
        ball.x = paddle.x + paddle.w / 2
      }
    }

    const handleTouchMove = (e) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const scaleX = CANVAS_W / rect.width
      const mx = (e.touches[0].clientX - rect.left) * scaleX
      const paddle = paddleRef.current
      let nx = mx - paddle.w / 2
      nx = Math.max(0, Math.min(nx, CANVAS_W - paddle.w))
      paddle.x = nx
      if (!ballLaunchedRef.current) {
        const ball = ballRef.current
        ball.x = paddle.x + paddle.w / 2
      }
    }

    const handleClick = () => launchBall()
    const handleKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); launchBall() } }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKey)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [phase])

  if (phase === 'intro') {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:16, background:settings?.bg_color || '#0f172a', color:'#fff', padding:20 }}>
        {settings?.game_logo_url && <img src={settings.game_logo_url} alt="" style={{ maxWidth: 160, maxHeight: 80 }} />}
        {settings?.heading_1 && <h1 style={{ fontSize: 28, fontWeight: 800, color: settings.heading_1_color || '#fff', margin:0 }}>{settings.heading_1}</h1>}
        {settings?.heading_2 && <p style={{ fontSize: 16, color: settings.heading_2_color || '#aaa', margin:0 }}>{settings.heading_2}</p>}
        {settings?.heading_3 && <p style={{ fontSize: 14, color: settings.heading_3_color || '#888', margin:0 }}>{settings.heading_3}</p>}
        {settings?.description_text && <p style={{ fontSize: 13, color: settings.description_color || '#aaa', maxWidth: 400, textAlign:'center' }}>{settings.description_text}</p>}
        {settings?.intro_text && <p style={{ fontSize: 14, color: settings.intro_text_color || '#fff' }}>{settings.intro_text}</p>}
        <div style={{ fontSize: 13, color: '#aaa', textAlign:'center', lineHeight: 1.8 }}>
          <div>🧱 Destroy all bricks by bouncing the ball</div>
          <div>🖱️ Move mouse to control the paddle</div>
          <div>💥 {maxLives} lives · {brickRows}x{brickCols} bricks</div>
        </div>
        {settings?.terms_enabled && (
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
              <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} style={{ width: 14, height: 14 }} />
              {settings?.terms_url ? <a href={settings.terms_url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{settings.terms_text || 'Terms & Conditions'}</a> : <span>{settings?.terms_text || 'Terms & Conditions'}</span>}
            </label>
          </div>
        )}
        <button
          onClick={startGame}
          disabled={!!settings?.terms_enabled && !termsAgreed}
          style={{ padding:'10px 32px', fontSize:16, fontWeight:700, border:'none', borderRadius:8, cursor:(!!settings?.terms_enabled && !termsAgreed)?'not-allowed':'pointer', background:settings?.primary_color || '#6366f1', color:'#fff', opacity:(!!settings?.terms_enabled && !termsAgreed)?0.5:1 }}
        >{settings?.start_button_text || 'Start Game'}</button>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, background:settings?.bg_color || '#0f172a', minHeight:'60vh', padding:'20px', position:'relative' }}>
      <div style={{ display:'flex', gap: 20, color:'#fff', fontSize:14, fontWeight:700 }}>
        <span>Score: {score}</span>
        <span>Lives: {'❤️'.repeat(lives)}{'🤍'.repeat(maxLives - lives)}</span>
      </div>
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ border:'2px solid #333', borderRadius:8, maxWidth:'100%', touchAction:'none' }} />
      <div style={{ color:'#666', fontSize:11 }}>Move mouse to control paddle • Click to launch</div>

      {gameOver && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}>
          <div style={{ background:'#fff', padding:'24px 32px', borderRadius:12, textAlign:'center' }}>
            <h2 style={{ margin:'0 0 8px', fontSize:22, color:'#1a1a2e' }}>{won ? 'You Win!' : 'Game Over'}</h2>
            <p style={{ color:'#666', margin:'0 0 16px' }}>Score: {score}</p>
            <button onClick={() => { setGameOver(false); startGame() }} style={{ padding:'8px 24px', fontSize:14, fontWeight:600, border:'none', borderRadius:6, cursor:'pointer', background:settings?.primary_color || '#6366f1', color:'#fff', marginRight:8 }}>Play Again</button>
            <button onClick={() => setPhase('intro')} style={{ padding:'8px 24px', fontSize:14, fontWeight:600, border:'1px solid #ddd', borderRadius:6, cursor:'pointer', background:'#fff', color:'#666' }}>Back</button>
          </div>
        </div>
      )}
    </div>
  )
}
