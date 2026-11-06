import { useState, useEffect, useRef, useCallback } from 'react'

function playSound(url) { if (!url) return; try { const a = new Audio(url); a.play().catch(() => {}) } catch {} }

export default function HanoiPlayerPage({ gameData, sessionToken, onComplete }) {
  const { settings, soundMap } = gameData || {}
  const soundMapRef = useRef(soundMap || {})
  useEffect(() => { soundMapRef.current = soundMap || {} }, [soundMap])

  const resolveSound = useCallback((id) => {
    if (!id) return null
    return soundMapRef.current[id] || null
  }, [])

  const numDisks = Number(settings?.disks) || 4

  const CANVAS_W = 360
  const CANVAS_H = 320
  const PEG_X = [60, 180, 300]
  const BASE_Y = 270
  const PEG_H = 190
  const DISK_H = 22
  const MIN_DISK_W = 28
  const MAX_DISK_W = 88

  const getDiskWidth = (d) => {
    if (numDisks <= 1) return MIN_DISK_W
    return MIN_DISK_W + (d - 1) * (MAX_DISK_W - MIN_DISK_W) / (numDisks - 1)
  }

  const [phase, setPhase] = useState('intro')
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)

  const canvasRef = useRef(null)
  const completedRef = useRef(false)
  const movesRef = useRef(0)
  const pegsRef = useRef([[], [], []])
  const selectedRef = useRef(null)
  const selectedState = useRef(null)

  const drawGame = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    ctx.fillStyle = '#334155'
    ctx.fillRect(0, BASE_Y, CANVAS_W, 3)

    const currentPegs = pegsRef.current
    const sel = selectedState.current

    for (let p = 0; p < 3; p++) {
      const pegX = PEG_X[p]
      const tower = currentPegs[p]

      ctx.fillStyle = sel === p ? '#6366f1' : '#475569'
      ctx.fillRect(pegX - 3, BASE_Y - PEG_H, 6, PEG_H)

      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(['A', 'B', 'C'][p], pegX, BASE_Y + 14)

      for (let i = 0; i < tower.length; i++) {
        const disk = tower[i]
        const dw = getDiskWidth(disk)
        const dx = pegX - dw / 2
        const dy = BASE_Y - (tower.length - i) * DISK_H
        ctx.fillStyle = disk % 2 === 0 ? '#6366f1' : '#4f46e5'
        ctx.fillRect(dx, dy, dw, DISK_H - 1)
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'
        ctx.strokeRect(dx, dy, dw, DISK_H - 1)
        ctx.fillStyle = 'rgba(255,255,255,0.08)'
        ctx.fillRect(dx + 4, dy + 2, dw - 8, 4)
      }
    }

    ctx.fillStyle = '#94a3b8'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Moves: ${movesRef.current}`, 10, 18)
  }, [numDisks])

  const checkWin = useCallback(() => {
    const pegC = pegsRef.current[2]
    if (pegC.length === numDisks) {
      setWon(true)
      setPhase('win')
      return true
    }
    return false
  }, [numDisks])

  const handlePegClick = useCallback((pegIndex) => {
    if (won) return
    const sel = selectedRef.current
    const pegs = pegsRef.current

    if (sel === null) {
      if (pegs[pegIndex].length === 0) return
      selectedRef.current = pegIndex
      selectedState.current = pegIndex
      drawGame()
      return
    }

    if (sel === pegIndex) {
      selectedRef.current = null
      selectedState.current = null
      drawGame()
      return
    }

    const fromPeg = pegs[sel]
    const toPeg = pegs[pegIndex]
    const movingDisk = fromPeg[fromPeg.length - 1]
    const topDisk = toPeg.length > 0 ? toPeg[toPeg.length - 1] : null

    if (topDisk !== null && movingDisk > topDisk) {
      selectedRef.current = null
      selectedState.current = null
      drawGame()
      return
    }

    fromPeg.pop()
    toPeg.push(movingDisk)
    movesRef.current += 1
    setMoves(movesRef.current)
    selectedRef.current = null
    selectedState.current = null

    const snd = resolveSound(settings?.sound_move_id)
    if (snd) playSound(snd)

    drawGame()

    if (pegIndex === 2 && toPeg.length === numDisks) {
      const completeSnd = resolveSound(settings?.sound_complete_id)
      if (completeSnd) playSound(completeSnd)
      setWon(true)
      setPhase('win')
    }
  }, [drawGame, resolveSound, settings, won, numDisks])

  const handleCanvasClick = useCallback((e) => {
    if (phase !== 'playing') return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const scale = CANVAS_W / rect.width
    const canvasX = x * scale
    let closest = -1
    let minDist = Infinity
    for (let p = 0; p < 3; p++) {
      const dist = Math.abs(canvasX - PEG_X[p])
      if (dist < minDist) { minDist = dist; closest = p }
    }
    if (closest >= 0) handlePegClick(closest)
  }, [phase, handlePegClick])

  const startGame = () => {
    const disks = Array.from({ length: numDisks }, (_, i) => numDisks - i)
    pegsRef.current = [[...disks], [], []]
    selectedRef.current = null
    selectedState.current = null
    movesRef.current = 0
    completedRef.current = false
    setMoves(0)
    setWon(false)
    setPhase('playing')
  }

  const handleComplete = useCallback(async () => {
    if (completedRef.current) return
    completedRef.current = true
    try {
      if (sessionToken) {
        await fetch('/api/play/session/complete', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: sessionToken, score: Math.max(0, 100 - movesRef.current * 2), player_data: {} })
        })
      }
    } catch {}
    onComplete?.()
  }, [sessionToken, onComplete])

  useEffect(() => {
    if (phase === 'playing') {
      drawGame()
    }
  }, [phase, drawGame])

  useEffect(() => {
    if (phase === 'playing') {
      window.addEventListener('click', handleCanvasClick)
      return () => window.removeEventListener('click', handleCanvasClick)
    }
  }, [phase, handleCanvasClick])

  useEffect(() => {
    return () => { completedRef.current = true }
  }, [])

  if (phase === 'intro') {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:16, background:settings?.bg_color || '#0f172a', color:'#fff', padding:20 }}>
        {settings?.game_logo_url && <img src={settings.game_logo_url} alt="" style={{ maxWidth: 160, maxHeight: 80 }} />}
        {settings?.heading_1 && <h1 style={{ fontSize: 28, fontWeight: 800, color: settings.heading_1_color || '#fff', margin:0 }}>{settings.heading_1}</h1>}
        {settings?.heading_2 && <p style={{ fontSize: 16, color: settings.heading_2_color || '#aaa', margin:0 }}>{settings.heading_2}</p>}
        {settings?.heading_3 && <p style={{ fontSize: 14, color: settings.heading_3_color || '#888', margin:0 }}>{settings.heading_3}</p>}
        {settings?.description_text && <p style={{ fontSize: 13, color: settings.description_color || '#aaa', maxWidth: 400, textAlign:'center' }}>{settings.description_text}</p>}
        {settings?.intro_text && <p style={{ fontSize: 14, color: settings.intro_text_color || '#fff' }}>{settings.intro_text}</p>}
        <p style={{ fontSize: 14, color: '#94a3b8' }}>Disks: {numDisks}</p>
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
      <div style={{ color:'#fff', fontSize:14, fontWeight:700 }}>Moves: {moves}</div>
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ border:'2px solid #333', borderRadius:8, cursor:'pointer', maxWidth:'100%' }} />
      <div style={{ color:'#666', fontSize:11 }}>Click a peg to select, click another to move</div>

      {phase === 'win' && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}>
          <div style={{ background:'#fff', padding:'24px 32px', borderRadius:12, textAlign:'center' }}>
            <h2 style={{ margin:'0 0 8px', fontSize:22, color:'#1a1a2e' }}>You Win!</h2>
            <p style={{ color:'#666', margin:'0 0 4px' }}>Moves: {moves}</p>
            <p style={{ color:'#666', margin:'0 0 16px' }}>Score: {Math.max(0, 100 - moves * 2)}</p>
            <button onClick={() => { startGame() }} style={{ padding:'8px 24px', fontSize:14, fontWeight:600, border:'none', borderRadius:6, cursor:'pointer', background:settings?.primary_color || '#6366f1', color:'#fff', marginRight:8 }}>Play Again</button>
            <button onClick={() => { handleComplete() }} style={{ padding:'8px 24px', fontSize:14, fontWeight:600, border:'none', borderRadius:6, cursor:'pointer', background:'#16a34a', color:'#fff' }}>{settings?.submit_button_text || 'Submit'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
