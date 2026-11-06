import { useState, useEffect, useRef, useCallback } from 'react'

function playSound(url) { if (!url) return; try { const a = new Audio(url); a.play().catch(() => {}) } catch {} }

export default function StackPlayerPage({ gameData, sessionToken, onComplete }) {
  const { settings, soundMap } = gameData || {}
  const soundMapRef = useRef(soundMap || {})
  useEffect(() => { soundMapRef.current = soundMap || {} }, [soundMap])

  const resolveSound = useCallback((id) => {
    if (!id) return null
    return soundMapRef.current[id] || null
  }, [])

  const blockW = Number(settings?.block_width) || 200
  const blockH = Number(settings?.block_height) || 30
  const baseSpeed = Number(settings?.base_speed) || 3
  const speedInc = Number(settings?.speed_increase) || 0.15
  const blockColor = settings?.block_color || '#6366f1'
  const blockColor2 = settings?.block_color_2 || '#4f46e5'

  const CANVAS_W = 240
  const CANVAS_H = 400
  const START_X = (CANVAS_W - blockW) / 2

  const [phase, setPhase] = useState('intro')
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)

  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const completedRef = useRef(false)
  const scoreRef = useRef(0)

  const towerRef = useRef([])
  const sliderRef = useRef({
    x: 0,
    width: blockW,
    speed: baseSpeed,
    direction: 1,
  })

  const drawGame = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    const tower = towerRef.current
    const slider = sliderRef.current

    let towerY = CANVAS_H
    for (let i = tower.length - 1; i >= 0; i--) {
      const block = tower[i]
      towerY -= blockH
      ctx.fillStyle = i % 2 === 0 ? blockColor : blockColor2
      ctx.fillRect(block.x, towerY, block.width, blockH - 1)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.strokeRect(block.x, towerY, block.width, blockH - 1)
    }

    if (!gameOver) {
      const slideY = towerY - blockH
      ctx.fillStyle = blockColor
      ctx.fillRect(slider.x, slideY, slider.width, blockH - 1)

      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillRect(slider.x, slideY, slider.width, 3)
    }

    const centerX = CANVAS_W / 2
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(centerX, 0)
    ctx.lineTo(centerX, CANVAS_H)
    ctx.stroke()
    ctx.setLineDash([])
  }, [blockW, blockH, blockColor, blockColor2, gameOver])

  const updateSlider = useCallback(() => {
    const slider = sliderRef.current
    slider.x += slider.speed * slider.direction
    if (slider.x + slider.width > CANVAS_W) {
      slider.x = CANVAS_W - slider.width
      slider.direction = -1
    }
    if (slider.x < 0) {
      slider.x = 0
      slider.direction = 1
    }
  }, [])

  const dropBlock = () => {
    if (gameOver) return
    const slider = sliderRef.current
    const tower = towerRef.current

    const currentW = slider.width
    const currentX = slider.x

    let targetW = currentW
    let targetX = currentX

    if (tower.length > 0) {
      const prevBlock = tower[tower.length - 1]
      const prevRight = prevBlock.x + prevBlock.width

      const overlapLeft = Math.max(currentX, prevBlock.x)
      const overlapRight = Math.min(currentX + currentW, prevRight)

      if (overlapLeft >= overlapRight) {
        setGameOver(true)
        return
      }

      targetX = overlapLeft
      targetW = overlapRight - overlapLeft

      const sliceOffLeft = overlapLeft - currentX
      const sliceOffRight = (currentX + currentW) - overlapRight

      if (sliceOffLeft > 0 || sliceOffRight > 0) {
        const snd = resolveSound(settings?.sound_slice_id)
        if (snd) playSound(snd)
      }
    }

    tower.push({ x: targetX, width: targetW })
    slider.width = targetW
    slider.x = targetX

    slider.speed = baseSpeed + tower.length * speedInc

    scoreRef.current = tower.length
    setScore(tower.length)

    const snd = resolveSound(settings?.sound_place_id)
    if (snd) playSound(snd)
  }

  const startGame = () => {
    towerRef.current = []
    sliderRef.current = {
      x: START_X,
      width: blockW,
      speed: baseSpeed,
      direction: 1,
    }
    scoreRef.current = 0
    completedRef.current = false
    setScore(0)
    setGameOver(false)
    setPhase('playing')

    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    let lastTime = 0
    const loop = (time) => {
      if (!lastTime) lastTime = time
      const dt = time - lastTime
      lastTime = time
      if (!gameOver) updateSlider()
      drawGame()
      animationRef.current = requestAnimationFrame(loop)
    }
    animationRef.current = requestAnimationFrame(loop)
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
    if (phase === 'playing') {
      const handleClick = () => dropBlock()
      const handleKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); dropBlock() } }
      window.addEventListener('click', handleClick)
      window.addEventListener('keydown', handleKey)
      return () => {
        window.removeEventListener('click', handleClick)
        window.removeEventListener('keydown', handleKey)
      }
    }
  }, [phase, gameOver])

  useEffect(() => {
    if (gameOver) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      const snd = resolveSound(settings?.sound_gameover_id)
      if (snd) playSound(snd)
      handleComplete()
    }
  }, [gameOver, handleComplete, settings, resolveSound])

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
        >{settings?.start_button_text || 'Start Stacking'}</button>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, background:settings?.bg_color || '#0f172a', minHeight:'60vh', padding:'20px', position:'relative' }}>
      <div style={{ color:'#fff', fontSize:14, fontWeight:700 }}>Score: {score}</div>
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ border:'2px solid #333', borderRadius:8 }} />
      <div style={{ color:'#666', fontSize:11 }}>Tap/Space to drop • Click/Space to place</div>

      {gameOver && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}>
          <div style={{ background:'#fff', padding:'24px 32px', borderRadius:12, textAlign:'center' }}>
            <h2 style={{ margin:'0 0 8px', fontSize:22, color:'#1a1a2e' }}>Game Over</h2>
            <p style={{ color:'#666', margin:'0 0 16px' }}>Blocks Stacked: {score}</p>
            <button onClick={() => { setGameOver(false); startGame() }} style={{ padding:'8px 24px', fontSize:14, fontWeight:600, border:'none', borderRadius:6, cursor:'pointer', background:settings?.primary_color || '#6366f1', color:'#fff', marginRight:8 }}>Play Again</button>
            <button onClick={() => setPhase('intro')} style={{ padding:'8px 24px', fontSize:14, fontWeight:600, border:'1px solid #ddd', borderRadius:6, cursor:'pointer', background:'#fff', color:'#666' }}>Back</button>
          </div>
        </div>
      )}
    </div>
  )
}
