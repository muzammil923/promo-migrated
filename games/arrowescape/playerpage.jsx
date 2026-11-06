import { useState, useEffect, useRef, useCallback } from 'react'
function playSound(url) { if (!url) return; try { const a = new Audio(url); a.play().catch(() => {}) } catch {} }

const CELL = 48
const WALL = 1, ARROW_R = 2, ARROW_D = 3, ARROW_L = 4, ARROW_U = 5, EXIT = 6, EMPTY = 0

const ARROW_DIRS = { 2: {dx:1,dy:0}, 3: {dx:0,dy:1}, 4: {dx:-1,dy:0}, 5: {dx:0,dy:-1} }
const ARROW_EMOJI = { 2: '→', 3: '↓', 4: '←', 5: '↑' }
const DIR_CYCLE = [0, 2, 3, 4, 5]

export default function ArrowEscapePlayerPage({ gameData, sessionToken, onComplete }) {
  const { settings, soundMap } = gameData
  const soundMapRef = useRef(soundMap || {})
  const resolveSound = useCallback((id) => { if (!id) return null; const n = parseInt(id); return isNaN(n) ? id : (soundMapRef.current[n] || null) }, [])
  const ff = `'${settings?.font_family || 'DM Sans'}', sans-serif`
  const primaryColor = settings?.primary_color || '#f59e0b'

  const [showIntro, setShowIntro] = useState(true)
  const [levels, setLevels] = useState([])
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0)
  const [grid, setGrid] = useState([])
  const [arrows, setArrows] = useState([])
  const [exits, setExits] = useState([])
  const [gameState, setGameState] = useState('planning') // planning, moving, won, lost
  const [moves, setMoves] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [arrowPositions, setArrowPositions] = useState([])
  const animRef = useRef(null)
  const completedRef = useRef(false)
  const [termsAgreed, setTermsAgreed] = useState(false)

  const currentLevel = levels[currentLevelIdx]
  const rows = currentLevel?.grid_rows || 8
  const cols = currentLevel?.grid_cols || 8

  const handleComplete = useCallback(async (score) => {
    if (completedRef.current) return; completedRef.current = true
    try {
      if (sessionToken) await fetch('/api/play/session/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken, score, player_data: { levels_completed: currentLevelIdx + 1, moves } })
      })
    } catch {}
    onComplete?.()
  }, [sessionToken, onComplete, currentLevelIdx, moves])

  useEffect(() => {
    api.get(`/arrowescape/${gameData.id}/play/levels`).then(res => {
      setLevels(res.data.levels || [])
    }).catch(() => {})
  }, [gameData.id])

  const loadLevel = (idx) => {
    if (idx >= levels.length) { setGameOver(true); return }
    const lvl = levels[idx]
    const g = Array.from({ length: lvl.grid_rows }, () => Array(lvl.grid_cols).fill(EMPTY))
    const walls = JSON.parse(lvl.walls || '[]')
    walls.forEach(([r, c]) => { if (r >= 0 && r < lvl.grid_rows && c >= 0 && c < lvl.grid_cols) g[r][c] = WALL })
    setGrid(g)
    const arr = JSON.parse(lvl.arrows || '[]')
    setArrows(arr)
    const ext = JSON.parse(lvl.exits || '[]')
    setExits(ext)
    setArrowPositions(arr.map(a => ({ ...a })))
    setGameState('planning')
  }

  useEffect(() => { if (levels.length > 0 && !showIntro) loadLevel(currentLevelIdx) }, [currentLevelIdx, levels, showIntro])

  const startGame = () => { setShowIntro(false); setCurrentLevelIdx(0); setTotalScore(0); setMoves(0); completedRef.current = false }

  const cycleArrow = (idx) => {
    if (gameState !== 'planning') return
    const newArrows = [...arrows]
    const current = newArrows[idx].dir
    const nextIdx = (DIR_CYCLE.indexOf(current) + 1) % DIR_CYCLE.length
    newArrows[idx] = { ...newArrows[idx], dir: DIR_CYCLE[nextIdx] }
    setArrows(newArrows)
    playSound(resolveSound(settings?.sound_move_id))
  }

  const startMoving = () => {
    if (gameState !== 'planning') return
    setGameState('moving')
    setMoves(m => m + 1)
    const positions = arrows.map(a => ({ ...a }))
    setArrowPositions(positions)

    let step = 0
    const maxSteps = rows * cols * 2

    const tick = () => {
      if (step >= maxSteps) { setGameState('lost'); playSound(resolveSound(settings?.sound_lose_id)); return }
      step++

      let allReachedExit = true
      let anyHitWall = false
      const newPositions = positions.map(p => {
        if (p.reached) return p
        const dir = ARROW_DIRS[p.dir]
        if (!dir) return p
        const nr = p.r + dir.dy, nc = p.c + dir.dx
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr]?.[nc] === WALL) {
          return { ...p, reached: false, stuck: true }
        }
        const exitHit = exits.some(e => e[0] === nr && e[1] === nc)
        if (exitHit) return { ...p, r: nr, c: nc, reached: true }
        allReachedExit = false
        return { ...p, r: nr, c: nc }
      })

      positions.splice(0, positions.length, ...newPositions)
      setArrowPositions([...positions])

      if (positions.every(p => p.reached)) {
        const score = Math.max(100, 500 - step * 5)
        setTotalScore(s => s + score)
        setGameState('won')
        playSound(resolveSound(settings?.sound_win_id))
        return
      }

      if (positions.every(p => p.stuck || p.reached)) {
        setGameState('lost')
        playSound(resolveSound(settings?.sound_lose_id))
        return
      }

      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }

  const nextLevel = () => {
    if (currentLevelIdx + 1 >= levels.length) {
      handleComplete(totalScore)
    } else {
      setCurrentLevelIdx(i => i + 1)
    }
  }

  const resetLevel = () => { loadLevel(currentLevelIdx) }

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current) }, [])

  const bgStyle = settings?.bg_image_url
    ? { backgroundImage: `url(${settings.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: settings?.bg_color || '#0f172a' }

  if (showIntro) return (
    <div style={{ minHeight:'100dvh',...bgStyle,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px 16px',fontFamily:ff }}>
      <div style={{ width:'100%',maxWidth:440,padding:'clamp(24px,6vw,36px)',borderRadius:28,background:'rgba(255,255,255,0.93)',backdropFilter:'blur(28px)',boxShadow:'0 8px 40px rgba(0,0,0,0.12)',textAlign:'center' }}>
        {settings?.game_logo_url && <img src={settings.game_logo_url} alt="" style={{ maxWidth:'100%',maxHeight:60,marginBottom:16,objectFit:'contain' }} />}
        <h1 style={{ fontSize:'clamp(22px,6vw,30px)',fontWeight:800,color:settings?.heading_1_color||'#1a1a2e',marginBottom:8,fontFamily:ff }}>{settings?.heading_1||'Arrow Escape'}</h1>
        {settings?.heading_2 && <p style={{ fontSize:15,fontWeight:600,color:settings?.heading_2_color||'#666',marginBottom:8 }}>{settings.heading_2}</p>}
        <div style={{ background:'#FEF3C7',borderRadius:12,padding:16,marginBottom:20 }}>
          <p style={{ fontSize:13,color:'#92400E',lineHeight:1.6 }}>➡️ Set arrow directions, then watch them move! Guide all arrows to the green exits.</p>
        </div>
        {settings?.terms_enabled && (
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
              <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} style={{ width: 14, height: 14 }} />
              {settings?.terms_url ? <a href={settings.terms_url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{settings.terms_text || 'Terms & Conditions'}</a> : <span>{settings?.terms_text || 'Terms & Conditions'}</span>}
            </label>
          </div>
        )}
        <button onClick={startGame} disabled={!!settings?.terms_enabled && !termsAgreed} style={{ background:settings?.start_button_bg_color||`linear-gradient(135deg,${primaryColor},${primaryColor}cc)`,color:settings?.start_button_text_color||'#fff',border:'none',borderRadius:12,padding:'15px 36px',fontSize:16,fontWeight:700,cursor:(!!settings?.terms_enabled && !termsAgreed)?'not-allowed':'pointer',fontFamily:ff,width:'100%',maxWidth:280,opacity:(!!settings?.terms_enabled && !termsAgreed)?0.5:1 }}>{settings?.start_button_text||'Start Game →'}</button>
      </div>
    </div>
  )

  const gridW = cols * CELL
  const gridH = rows * CELL

  return (
    <div style={{ minHeight:'100dvh',...bgStyle,display:'flex',flexDirection:'column',alignItems:'center',fontFamily:ff,padding:'12px 16px' }}>
      <h2 style={{ fontSize:18,fontWeight:800,color:settings?.heading_1_color||'#fff',marginBottom:4,textAlign:'center' }}>{settings?.heading_1||'Arrow Escape'}</h2>
      <div style={{ display:'flex',gap:12,marginBottom:8 }}>
        <span style={{ background:'rgba(255,255,255,0.15)',borderRadius:8,padding:'6px 14px',fontSize:13,fontWeight:700,color:'#fff' }}>Level: {currentLevelIdx+1}/{levels.length}</span>
        <span style={{ background:'rgba(255,255,255,0.15)',borderRadius:8,padding:'6px 14px',fontSize:13,fontWeight:700,color:'#f59e0b' }}>Score: {totalScore}</span>
        <span style={{ background:'rgba(255,255,255,0.15)',borderRadius:8,padding:'6px 14px',fontSize:13,fontWeight:700,color:'#22c55e' }}>Moves: {moves}</span>
      </div>

      {/* Grid */}
      <div style={{ position:'relative',width:gridW,height:gridH,background:'rgba(255,255,255,0.08)',borderRadius:8,marginBottom:12,border:'1px solid rgba(255,255,255,0.15)' }}>
        {grid.map((row, r) => row.map((cell, c) => (
          <div key={`${r}-${c}`} style={{
            position:'absolute',left:c*CELL,top:r*CELL,width:CELL,height:CELL,
            background:cell===WALL?'rgba(255,255,255,0.25)':'transparent',
            borderRadius:4,border:'1px solid rgba(255,255,255,0.08)',
          }} />
        )))}
        {exits.map(([r,c], i) => (
          <div key={`exit-${i}`} style={{
            position:'absolute',left:c*CELL+4,top:r*CELL+4,width:CELL-8,height:CELL-8,
            background:'rgba(34,197,94,0.3)',borderRadius:6,border:'2px solid #22c55e',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,
          }}>🏁</div>
        ))}
        {arrowPositions.map((a, i) => (
          <div key={`arrow-${i}`} style={{
            position:'absolute',left:a.c*CELL+4,top:a.r*CELL+4,width:CELL-8,height:CELL-8,
            background:a.reached?'rgba(34,197,94,0.5)':a.stuck?'rgba(239,68,68,0.5)':'rgba(245,158,11,0.8)',
            borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:22,fontWeight:700,color:'#fff',cursor:gameState==='planning'?'pointer':'default',
            transition:'all 0.15s',border:`2px solid ${a.reached?'#22c55e':a.stuck?'#ef4444':'#f59e0b'}`,
          }} onClick={() => cycleArrow(i)}>
            {ARROW_EMOJI[a.dir] || '•'}
          </div>
        ))}
      </div>

      {/* Controls */}
      {gameState === 'planning' && (
        <div style={{ display:'flex',gap:12,marginBottom:12 }}>
          <button onClick={startMoving} style={{ background:primaryColor,color:'#fff',border:'none',borderRadius:10,padding:'12px 28px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:ff }}>
            ▶ Start Moving
          </button>
          <p style={{ fontSize:12,color:'rgba(255,255,255,0.5)',alignSelf:'center' }}>Tap arrows to change direction</p>
        </div>
      )}

      {gameState === 'moving' && <p style={{ fontSize:13,color:'rgba(255,255,255,0.6)' }}>Watching arrows move...</p>}

      {(gameState === 'won' || gameState === 'lost') && (
        <div style={{ textAlign:'center' }}>
          <p style={{ fontSize:24,fontWeight:800,color:gameState==='won'?'#22c55e':'#ef4444',marginBottom:12 }}>
            {gameState==='won'?'🎉 Level Complete!':'❌ Try Again'}
          </p>
          <div style={{ display:'flex',gap:12,justifyContent:'center' }}>
            {gameState==='lost' && <button onClick={resetLevel} style={{ background:'rgba(255,255,255,0.15)',color:'#fff',border:'none',borderRadius:10,padding:'12px 24px',fontSize:14,fontWeight:600,cursor:'pointer' }}>🔄 Retry</button>}
            {gameState==='won' && <button onClick={nextLevel} style={{ background:primaryColor,color:'#fff',border:'none',borderRadius:10,padding:'12px 28px',fontSize:14,fontWeight:700,cursor:'pointer' }}>
              {currentLevelIdx+1>=levels.length?'🏆 Finish':'Next Level →'}
            </button>}
          </div>
        </div>
      )}
    </div>
  )
}
