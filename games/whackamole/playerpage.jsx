import { useState, useEffect, useRef, useCallback } from 'react'

function playSound(url) { if (!url) return; try { const a = new Audio(url); a.play().catch(() => {}) } catch {} }

export default function WhackAMolePlayerPage({ gameData, sessionToken, onComplete }) {
  const { settings, soundMap } = gameData || {}
  const soundMapRef = useRef(soundMap || {})
  useEffect(() => { soundMapRef.current = soundMap || {} }, [soundMap])

  const resolveSound = useCallback((id) => {
    if (!id) return null
    return soundMapRef.current[id] || null
  }, [])

  const gridSize = Number(settings?.grid_size) || 3
  const moleCount = Number(settings?.mole_count) || 3
  const moleTimeMs = Number(settings?.mole_time_ms) || 1000
  const gameDurationSec = Number(settings?.game_duration_sec) || 30
  const difficulty = settings?.difficulty || 'medium'

  const CANVAS_SIZE = 300
  const PADDING = 16
  const areaSize = CANVAS_SIZE - PADDING * 2
  const cellSize = areaSize / gridSize
  const holeRadius = cellSize * 0.3
  const moleRadius = cellSize * 0.25

  const [phase, setPhase] = useState('intro')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(gameDurationSec)
  const [gameOver, setGameOver] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)

  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const completedRef = useRef(false)
  const scoreRef = useRef(0)
  const timeLeftRef = useRef(gameDurationSec)
  const molesRef = useRef([])
  const gameStartRef = useRef(0)

  const difficultySpeedMultiplier = useRef(() => {
    switch (difficulty) {
      case 'easy': return 1.5
      case 'hard': return 0.6
      default: return 1
    }
  })()

  const getHoleCenter = (row, col) => ({
    x: PADDING + col * cellSize + cellSize / 2,
    y: PADDING + row * cellSize + cellSize / 2,
  })

  const spawnMole = useCallback(() => {
    const moles = molesRef.current
    if (moles.length >= moleCount) return

    const occupied = new Set(moles.map(m => m.row * gridSize + m.col))
    const available = []
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (!occupied.has(r * gridSize + c)) available.push({ row: r, col: c })
      }
    }
    if (available.length === 0) return

    const pos = available[Math.floor(Math.random() * available.length)]
    const now = performance.now()
    moles.push({
      row: pos.row,
      col: pos.col,
      startTime: now,
      duration: moleTimeMs * difficultySpeedMultiplier,
      whacked: false,
    })
  }, [gridSize, moleCount, moleTimeMs, difficultySpeedMultiplier])

  const drawGame = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    const bgColor = settings?.bg_color || '#0f172a'
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    const moles = molesRef.current
    const now = performance.now()

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const center = getHoleCenter(r, c)
        ctx.beginPath()
        ctx.arc(center.x, center.y, holeRadius, 0, Math.PI * 2)
        ctx.fillStyle = '#1a1a2e'
        ctx.fill()
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    for (const mole of moles) {
      if (mole.whacked) continue
      const elapsed = now - mole.startTime
      const progress = Math.min(elapsed / mole.duration, 1)
      if (progress >= 1) continue

      const center = getHoleCenter(mole.row, mole.col)
      const moleY = Math.sin(progress * Math.PI) * holeRadius * 0.7

      ctx.beginPath()
      ctx.arc(center.x, center.y - moleY, moleRadius, 0, Math.PI * 2)
      ctx.fillStyle = '#8B4513'
      ctx.fill()
      ctx.strokeStyle = '#5C2E00'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(center.x - 3, center.y - moleY - 3, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#000'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(center.x + 3, center.y - moleY - 3, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#000'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(center.x, center.y - moleY + 2, 2.5, 0, Math.PI)
      ctx.strokeStyle = '#5C2E00'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    molesRef.current = moles.filter(m => {
      if (m.whacked) return false
      const elapsed = now - m.startTime
      return elapsed < m.duration
    })

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px DM Sans, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Score: ${scoreRef.current}`, 10, 20)

    ctx.textAlign = 'right'
    ctx.fillText(`Time: ${Math.ceil(timeLeftRef.current)}s`, CANVAS_SIZE - 10, 20)
  }, [gridSize, holeRadius, moleRadius, CANVAS_SIZE, PADDING, cellSize, settings])

  const handleCanvasClick = useCallback((e) => {
    if (gameOver) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clickX = (e.clientX - rect.left) * scaleX
    const clickY = (e.clientY - rect.top) * scaleY

    const moles = molesRef.current
    const now = performance.now()
    let hit = false

    for (const mole of moles) {
      if (mole.whacked) continue
      const elapsed = now - mole.startTime
      if (elapsed >= mole.duration) continue

      const center = getHoleCenter(mole.row, mole.col)
      const progress = Math.min(elapsed / mole.duration, 1)
      const moleY = Math.sin(progress * Math.PI) * holeRadius * 0.7
      const dx = clickX - center.x
      const dy = clickY - (center.y - moleY)
      if (dx * dx + dy * dy <= moleRadius * moleRadius) {
        mole.whacked = true
        hit = true
        scoreRef.current += 1
        setScore(scoreRef.current)

        const snd = resolveSound(settings?.sound_whack_id)
        if (snd) playSound(snd)
        break
      }
    }

    if (!hit) {
      const snd = resolveSound(settings?.sound_miss_id)
      if (snd) playSound(snd)
    }
  }, [gameOver, gridSize, holeRadius, moleRadius, cellSize, PADDING, settings, resolveSound])

  const startGame = useCallback(() => {
    molesRef.current = []
    scoreRef.current = 0
    timeLeftRef.current = gameDurationSec
    completedRef.current = false
    setScore(0)
    setTimeLeft(gameDurationSec)
    setGameOver(false)
    setPhase('playing')

    gameStartRef.current = performance.now()

    if (animationRef.current) cancelAnimationFrame(animationRef.current)

    let lastSpawn = 0
    const spawnInterval = (moleTimeMs * difficultySpeedMultiplier) * 0.8
    let lastTime = 0

    const loop = (time) => {
      if (!lastTime) lastTime = time
      lastTime = time

      const elapsed = (time - gameStartRef.current) / 1000
      timeLeftRef.current = Math.max(0, gameDurationSec - elapsed)
      setTimeLeft(timeLeftRef.current)

      if (timeLeftRef.current <= 0) {
        setGameOver(true)
        return
      }

      if (time - lastSpawn > spawnInterval) {
        spawnMole()
        lastSpawn = time
      }

      drawGame()
      animationRef.current = requestAnimationFrame(loop)
    }
    animationRef.current = requestAnimationFrame(loop)
  }, [gameDurationSec, moleTimeMs, difficultySpeedMultiplier, spawnMole, drawGame])

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
      const snd = resolveSound(settings?.sound_gameover_id)
      if (snd) playSound(snd)
      handleComplete()
    }
  }, [gameOver, handleComplete, settings, resolveSound])

  useEffect(() => {
    if (phase === 'playing') {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.addEventListener('click', handleCanvasClick)
      return () => canvas.removeEventListener('click', handleCanvasClick)
    }
  }, [phase, handleCanvasClick])

  useEffect(() => {
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
  }, [])

  useEffect(() => { drawGame() }, [drawGame])

  if (phase === 'intro') {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:16, background:settings?.bg_color || '#0f172a', color:'#fff', padding:20 }}>
        {settings?.game_logo_url && <img src={settings.game_logo_url} alt="" style={{ maxWidth: 160, maxHeight: 80 }} />}
        {settings?.heading_1 && <h1 style={{ fontSize: 28, fontWeight: 800, color: settings.heading_1_color || '#fff', margin:0 }}>{settings.heading_1}</h1>}
        {settings?.heading_2 && <p style={{ fontSize: 16, color: settings.heading_2_color || '#aaa', margin:0 }}>{settings.heading_2}</p>}
        {settings?.heading_3 && <p style={{ fontSize: 14, color: settings.heading_3_color || '#888', margin:0 }}>{settings.heading_3}</p>}
        {settings?.description_text && <p style={{ fontSize: 13, color: settings.description_color || '#aaa', maxWidth: 400, textAlign:'center' }}>{settings.description_text}</p>}
        {settings?.intro_text && <p style={{ fontSize: 14, color: settings.intro_text_color || '#fff' }}>{settings.intro_text}</p>}
        <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
          {gridSize}x{gridSize} Grid · {gameDurationSec}s · {difficulty}
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
        >{settings?.start_button_text || 'Start Whacking'}</button>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, background:settings?.bg_color || '#0f172a', minHeight:'60vh', padding:'20px', position:'relative' }}>
      <div style={{ color:'#fff', fontSize:14, fontWeight:700 }}>Score: {score}</div>
      <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ border:'2px solid #333', borderRadius:8, maxWidth:'100%' }} />
      <div style={{ color:'#666', fontSize:11 }}>Tap/Click moles to whack them!</div>

      {gameOver && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}>
          <div style={{ background:'#fff', padding:'24px 32px', borderRadius:12, textAlign:'center' }}>
            <h2 style={{ margin:'0 0 8px', fontSize:22, color:'#1a1a2e' }}>Game Over</h2>
            <p style={{ color:'#666', margin:'0 0 16px' }}>Moles Whacked: {score}</p>
            <button onClick={() => { setGameOver(false); startGame() }} style={{ padding:'8px 24px', fontSize:14, fontWeight:600, border:'none', borderRadius:6, cursor:'pointer', background:settings?.primary_color || '#6366f1', color:'#fff', marginRight:8 }}>Play Again</button>
            <button onClick={() => setPhase('intro')} style={{ padding:'8px 24px', fontSize:14, fontWeight:600, border:'1px solid #ddd', borderRadius:6, cursor:'pointer', background:'#fff', color:'#666' }}>Back</button>
          </div>
        </div>
      )}
    </div>
  )
}
