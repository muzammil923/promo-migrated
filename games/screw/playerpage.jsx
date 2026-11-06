import { useState, useEffect, useRef, useCallback } from 'react'

/* ─── API helper ─── */
const api = {
  post: async (url, body) => {
    const res = await fetch('/api' + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return { data }
  },
}

/* ─── Sound helpers ─── */
function playSound(url) {
  if (!url) return
  try { new Audio(url).play().catch(() => {}) } catch {}
}

/* ─── Color palette for screws ─── */
const DEFAULT_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#0ea5e9', '#a855f7',
]

/* ─── CSS ─── */
const STYLES = `
  @keyframes spin    { to { transform: rotate(360deg) } }
  @keyframes popIn   { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scaleIn { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
  @keyframes bounce  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
  @keyframes wiggle  { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }
  @keyframes confettiFall { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
  @keyframes pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.4)} 50%{box-shadow:0 0 0 8px rgba(255,255,255,0)} }

  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { margin: 0; padding: 0; overscroll-behavior: none; }

  .screw-root {
    position: fixed; inset: 0;
    display: flex; flex-direction: column; align-items: center;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
  }

  .screw-board {
    display: grid;
    gap: clamp(6px, 2vw, 12px);
    padding: clamp(10px, 3vw, 20px);
  }

  .screw-cell {
    position: relative;
    border-radius: 14px;
    cursor: pointer;
    transition: transform .15s, box-shadow .15s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
  }
  .screw-cell:active { transform: scale(0.93); }
  .screw-cell.selected { animation: pulse 1s ease infinite; }

  .screw-hole {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 3px solid rgba(0,0,0,0.25);
    display: flex; align-items: center; justify-content: center;
    transition: background .2s;
    position: relative;
    overflow: hidden;
  }

  .screw-head {
    width: 62%;
    height: 62%;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.4);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.2);
    position: relative;
  }
  .screw-head::after {
    content: '';
    position: absolute;
    inset: 30% 45%;
    background: rgba(255,255,255,0.5);
    border-radius: 2px;
    box-shadow: 4px 0 0 rgba(255,255,255,0.5);
  }

  .screw-count-badge {
    position: absolute;
    top: -6px; right: -6px;
    background: rgba(0,0,0,0.7);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    border-radius: 20px;
    padding: 1px 5px;
    pointer-events: none;
  }

  .overlay-win {
    position: fixed; inset: 0; z-index: 100;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
    padding: 20px;
  }
  .overlay-card {
    background: #fff; border-radius: 28px;
    padding: clamp(24px,6vw,40px) clamp(20px,5vw,36px);
    max-width: 380px; width: 100%; text-align: center;
    animation: scaleIn .45s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow: 0 24px 80px rgba(0,0,0,0.4);
  }
`

/* ─── Board generation ─── */
function generateBoard(rows, cols, screwsPerBlock, emptyHoles, blockColors) {
  const totalCells = rows * cols
  // Number of distinct colors = how many full groups we can fit
  const groupSize = screwsPerBlock
  const maxGroups = Math.floor((totalCells - emptyHoles) / groupSize)
  const numColors = Math.min(maxGroups, blockColors.length)
  const usedColors = blockColors.slice(0, numColors)

  // Build list of screws: each color repeated groupSize times
  const screwList = []
  for (const color of usedColors) {
    for (let i = 0; i < groupSize; i++) screwList.push(color)
  }

  // Pad with nulls for empty holes
  while (screwList.length < totalCells) screwList.push(null)

  // Shuffle
  for (let i = screwList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [screwList[i], screwList[j]] = [screwList[j], screwList[i]]
  }

  // Build cell grid
  const cells = []
  let idx = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ id: idx, row: r, col: c, color: screwList[idx] })
      idx++
    }
  }
  return { cells, numColors, usedColors }
}

/* ─── Check win: each non-null group must all be same color, or all cells solved ─── */
function checkWin(cells, screwsPerBlock, usedColors) {
  if (usedColors.length === 0) return true
  for (const color of usedColors) {
    const group = cells.filter(c => c.color === color)
    if (group.length !== screwsPerBlock) return false
  }
  return true
}

/* ─── Main Component ─── */
export default function ScrewPlayerPage({ gameData, sessionToken, onComplete }) {
  const s = gameData?.settings || {}
  const primaryColor = s.primary_color || '#7c6ff7'
  const fontFamily = s.font_family || 'DM Sans'
  const ff = `'${fontFamily}', sans-serif`

  const rows = parseInt(s.board_rows) || 6
  const cols = parseInt(s.board_cols) || 6
  const screwsPerBlock = parseInt(s.screws_per_block) || 2
  const emptyHoles = parseInt(s.empty_holes) || 3
  const difficulty = s.difficulty || 'easy'
  const tapsRequired = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1
  const timeLimit = parseInt(s.time_limit_seconds) || 0

  // Parse block_colors from settings
  const blockColors = (() => {
    try {
      if (s.block_colors) {
        const parsed = typeof s.block_colors === 'string' ? JSON.parse(s.block_colors) : s.block_colors
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return DEFAULT_COLORS
  })()

  const soundMap = gameData?.soundMap || {}
  const resolveSound = (id) => {
    if (!id) return null
    const numId = parseInt(id)
    return soundMap[numId] || null
  }
  const soundScrew   = resolveSound(s.sound_screw_id)
  const soundFall    = resolveSound(s.sound_fall_id)
  const soundReveal  = resolveSound(s.sound_reveal_id)

  // Board state
  const [cells, setCells] = useState([])
  const [usedColors, setUsedColors] = useState([])
  const [selected, setSelected] = useState(null)   // { id, tapCount }
  const [tapCounts, setTapCounts] = useState({})   // id -> current tap count
  const [moves, setMoves] = useState(0)
  const [phase, setPhase] = useState('playing')     // 'playing' | 'won' | 'timeout'
  const [timeLeft, setTimeLeft] = useState(timeLimit > 0 ? timeLimit : null)
  const [submitting, setSubmitting] = useState(false)
  const completingRef = useRef(false)
  const timerRef = useRef(null)

  // Available vertical space: viewport minus header (~50px) and footer (~50px)
  const vh = window.innerHeight
  const vw = window.innerWidth
  const headerH = 56
  const footerH = 52
  const availW = Math.min(vw, 480) - 32 // padding 16px each side
  const availH = vh - headerH - footerH - 32
  // Cell size fits both width and height; add gap allowance (gap ≈ 2vw, cap 12px)
  const gap = Math.min(12, Math.max(6, Math.floor(vw * 0.02)))
  const cellSize = Math.max(28, Math.min(
    Math.floor((availW - (cols - 1) * gap) / cols),
    Math.floor((availH - (rows - 1) * gap) / rows)
  ))

  // Init board
  useEffect(() => {
    const { cells: newCells, usedColors: uc } = generateBoard(rows, cols, screwsPerBlock, emptyHoles, blockColors)
    setCells(newCells)
    setUsedColors(uc)
    setTapCounts({})
    setSelected(null)
    setMoves(0)
    setPhase('playing')
    if (timeLimit > 0) setTimeLeft(timeLimit)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || timeLeft === null) return
    if (timeLeft <= 0) { setPhase('timeout'); return }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timerRef.current)
  }, [timeLeft, phase])

  // Submit session result
  const submitResult = useCallback(async (won) => {
    if (completingRef.current) return
    completingRef.current = true
    setSubmitting(true)
    try {
      if (sessionToken) {
        const res = await api.post('/play/session/complete', { session_token: sessionToken })
        onComplete?.({ session: res.data.session, redirect_url: res.data.redirect_url })
      } else {
        onComplete?.({ session: null, redirect_url: null })
      }
    } catch {
      onComplete?.({ session: null, redirect_url: null })
    }
    setSubmitting(false)
  }, [sessionToken, onComplete])

  // Handle win
  useEffect(() => {
    if (phase === 'won') {
      playSound(soundReveal)
      const t = setTimeout(() => submitResult(true), 2200)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Handle timeout
  useEffect(() => {
    if (phase === 'timeout') {
      const t = setTimeout(() => submitResult(false), 2000)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const handleCellTap = useCallback((cell) => {
    if (phase !== 'playing') return
    if (cell.color === null) {
      // Empty cell: if something is selected, move it here
      if (selected !== null) {
        const fromCell = cells.find(c => c.id === selected)
        if (!fromCell || fromCell.color === null) { setSelected(null); return }
        playSound(soundFall)
        const newCells = cells.map(c => {
          if (c.id === fromCell.id) return { ...c, color: null }
          if (c.id === cell.id) return { ...c, color: fromCell.color }
          return c
        })
        setCells(newCells)
        setSelected(null)
        setTapCounts(prev => ({ ...prev, [fromCell.id]: 0 }))
        setMoves(m => m + 1)
        if (checkWin(newCells, screwsPerBlock, usedColors)) setPhase('won')
      }
      return
    }

    // Tap on a filled cell
    if (tapsRequired === 1) {
      // Single-tap mode: select or swap immediately
      if (selected === null) {
        setSelected(cell.id)
        playSound(soundScrew)
      } else if (selected === cell.id) {
        setSelected(null)
      } else {
        // Swap the two cells
        const fromCell = cells.find(c => c.id === selected)
        playSound(soundFall)
        const newCells = cells.map(c => {
          if (c.id === fromCell.id) return { ...c, color: cell.color }
          if (c.id === cell.id) return { ...c, color: fromCell.color }
          return c
        })
        setCells(newCells)
        setSelected(null)
        setMoves(m => m + 1)
        if (checkWin(newCells, screwsPerBlock, usedColors)) setPhase('won')
      }
    } else {
      // Multi-tap mode: need tapsRequired taps to "unscrew" before moving
      const currentTaps = tapCounts[cell.id] || 0
      const newTaps = currentTaps + 1
      playSound(soundScrew)

      if (newTaps >= tapsRequired) {
        // Fully unscrewed — now select it
        setTapCounts(prev => ({ ...prev, [cell.id]: 0 }))
        if (selected === null) {
          setSelected(cell.id)
        } else if (selected === cell.id) {
          setSelected(null)
        } else {
          const fromCell = cells.find(c => c.id === selected)
          playSound(soundFall)
          const newCells = cells.map(c => {
            if (c.id === fromCell.id) return { ...c, color: cell.color }
            if (c.id === cell.id) return { ...c, color: fromCell.color }
            return c
          })
          setCells(newCells)
          setSelected(null)
          setMoves(m => m + 1)
          if (checkWin(newCells, screwsPerBlock, usedColors)) setPhase('won')
        }
      } else {
        setTapCounts(prev => ({ ...prev, [cell.id]: newTaps }))
        // If this cell was previously selected, deselect on re-tap
        if (selected === cell.id) setSelected(null)
      }
    }
  }, [phase, cells, selected, tapCounts, tapsRequired, usedColors, screwsPerBlock, soundScrew, soundFall])

  const bgStyle = s.bg_image_url
    ? { backgroundImage: `url(${s.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: s.bg_color || '#1a1a2e' }

  const gameLogo = s.game_logo_url || gameData?.client_logo
  const totalScrews = usedColors.length * screwsPerBlock

  // Group completion
  const completedGroups = usedColors.filter(color => {
    const group = cells.filter(c => c.color === color)
    return group.length === screwsPerBlock
  })
  const progress = usedColors.length > 0 ? (completedGroups.length / usedColors.length) * 100 : 0

  return (
    <>
      <style>{STYLES}</style>

      <div className="screw-root" style={{ ...bgStyle, fontFamily: ff }}>

        {/* ── Header ── */}
        <div style={{
          width: '100%', maxWidth: 480,
          padding: '12px 16px 8px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          {gameLogo
            ? <img src={gameLogo} alt="Logo" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
            : <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{s.heading_1 || 'Screw Sort'}</span>
          }
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {timeLeft !== null && (
              <div style={{
                background: timeLeft <= 10 ? '#ef4444' : 'rgba(255,255,255,0.15)',
                borderRadius: 20, padding: '4px 12px',
                color: '#fff', fontWeight: 700, fontSize: 14,
                transition: 'background .3s',
              }}>
                ⏱ {timeLeft}s
              </div>
            )}
            <div style={{
              background: 'rgba(255,255,255,0.15)', borderRadius: 20,
              padding: '4px 12px', color: '#fff', fontWeight: 700, fontSize: 14,
            }}>
              🔄 {moves}
            </div>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div style={{ width: '100%', maxWidth: 480, padding: '0 16px 8px', flexShrink: 0 }}>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 6,
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}bb)`,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
            <span>{completedGroups.length} / {usedColors.length} groups done</span>
            <span>{totalScrews} screws total</span>
          </div>
        </div>

        {/* ── Board ── */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <div
            className="screw-board"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
            }}
          >
            {cells.map(cell => {
              const isSelected = selected === cell.id
              const tapCount = tapCounts[cell.id] || 0
              const tapsLeft = cell.color !== null ? tapsRequired - tapCount : 0
              const isEmpty = cell.color === null
              const cellColor = cell.color

              return (
                <div
                  key={cell.id}
                  className={`screw-cell${isSelected ? ' selected' : ''}`}
                  onClick={() => handleCellTap(cell)}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    background: isEmpty
                      ? 'rgba(255,255,255,0.06)'
                      : isSelected
                        ? `${cellColor}dd`
                        : `${cellColor}99`,
                    boxShadow: isSelected
                      ? `0 0 0 3px #fff, 0 0 20px ${cellColor}88`
                      : isEmpty
                        ? 'inset 0 2px 8px rgba(0,0,0,0.3)'
                        : `0 4px 14px ${cellColor}55`,
                    border: isSelected
                      ? `2px solid #fff`
                      : isEmpty
                        ? '2px dashed rgba(255,255,255,0.15)'
                        : `2px solid ${cellColor}`,
                    transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    zIndex: isSelected ? 2 : 1,
                  }}
                >
                  {!isEmpty && (
                    <>
                      <div className="screw-hole" style={{ background: `${cellColor}cc` }}>
                        <div className="screw-head" style={{ background: cellColor }} />
                      </div>
                      {tapsRequired > 1 && tapsLeft > 0 && (
                        <div className="screw-count-badge">{tapsLeft}</div>
                      )}
                    </>
                  )}
                  {isEmpty && selected !== null && (
                    <div style={{
                      width: '40%', height: '40%', borderRadius: '50%',
                      border: '2px dashed rgba(255,255,255,0.35)',
                      animation: 'pulse 1.5s ease infinite',
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Footer hint ── */}
        <div style={{ flexShrink: 0, padding: '8px 16px 20px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0, fontFamily: ff }}>
            {tapsRequired > 1
              ? `Tap a screw ${tapsRequired}× to unscrew it, then tap destination`
              : 'Tap a screw to select, then tap a destination to move it'}
          </p>
        </div>

        {/* ── Win overlay ── */}
        {phase === 'won' && (
          <div className="overlay-win">
            {/* Confetti */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99 }}>
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute', top: -10,
                  left: `${5 + (i * 2.4) % 90}%`,
                  width: 8 + (i % 3) * 4, height: 8 + (i % 3) * 4,
                  borderRadius: i % 2 === 0 ? '50%' : 2,
                  background: blockColors[i % blockColors.length] || '#7c6ff7',
                  animation: `confettiFall ${2 + (i % 4) * 0.5}s ${(i * 0.1) % 2}s ease-in forwards`,
                }} />
              ))}
            </div>

            <div className="overlay-card">
              <div style={{ fontSize: 60, marginBottom: 12, animation: 'bounce 0.6s ease' }}>🎉</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', marginBottom: 8, fontFamily: ff }}>
                {s.reveal_text || 'Puzzle Solved!'}
              </h2>
              {s.reveal_image_url && (
                <img src={s.reveal_image_url} alt="Reveal" style={{
                  maxWidth: '100%', maxHeight: 200, objectFit: 'contain',
                  borderRadius: 14, marginBottom: 16,
                }} />
              )}
              <p style={{ color: '#666', fontSize: 15, marginBottom: 20, fontFamily: ff }}>
                Completed in <strong>{moves}</strong> move{moves !== 1 ? 's' : ''} 🏆
              </p>
              {submitting && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#888', fontSize: 14 }}>
                  <span style={{ width: 16, height: 16, border: `2px solid ${primaryColor}44`, borderTopColor: primaryColor, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Saving…
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Timeout overlay ── */}
        {phase === 'timeout' && (
          <div className="overlay-win">
            <div className="overlay-card">
              <div style={{ fontSize: 60, marginBottom: 12 }}>⏰</div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', marginBottom: 8, fontFamily: ff }}>
                Time's Up!
              </h2>
              <p style={{ color: '#666', fontSize: 15, marginBottom: 20, fontFamily: ff }}>
                You made <strong>{moves}</strong> move{moves !== 1 ? 's' : ''}. Keep trying!
              </p>
              <button
                onClick={() => {
                  completingRef.current = false
                  const { cells: newCells, usedColors: uc } = generateBoard(rows, cols, screwsPerBlock, emptyHoles, blockColors)
                  setCells(newCells)
                  setUsedColors(uc)
                  setTapCounts({})
                  setSelected(null)
                  setMoves(0)
                  setPhase('playing')
                  if (timeLimit > 0) setTimeLeft(timeLimit)
                }}
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                  color: '#fff', border: 'none', borderRadius: 50,
                  padding: '14px 36px', fontSize: 16, fontWeight: 700,
                  cursor: 'pointer', fontFamily: ff,
                  boxShadow: `0 8px 24px ${primaryColor}55`,
                }}
              >
                Try Again →
              </button>
            </div>
          </div>
        )}

        {submitting && phase !== 'won' && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              Saving your progress…
            </div>
          </div>
        )}
      </div>
    </>
  )
}
