import { useState, useEffect, useRef, useCallback } from 'react'
import FloatingHintButton from '../../apps/frontend/src/components/FloatingHintButton'
import HintModal from '../../apps/frontend/src/components/HintModal'

const API_BASE = '/api'

/* ─── helpers ───────────────────────────────────────────── */
function buildGrid(words, rows, cols) {
  // grid[r][c] = { letter, wordIds: [] }
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ letter: null, wordIds: [] }))
  )
  for (const w of words) {
    if (!w.word_text) continue
    for (let i = 0; i < w.word_text.length; i++) {
      const r = w.direction === 'down'   ? w.start_row + i : w.start_row
      const c = w.direction === 'across' ? w.start_col + i : w.start_col
      if (r < rows && c < cols) {
        grid[r][c].letter = w.word_text[i]
        grid[r][c].wordIds.push(w.id)
      }
    }
  }
  return grid
}

function buildNumberMap(words) {
  // returns { 'r,c': number }
  const map = {}
  let num = 1
  const sorted = [...words].sort((a, b) =>
    a.start_row !== b.start_row ? a.start_row - b.start_row : a.start_col - b.start_col
  )
  for (const w of sorted) {
    const key = `${w.start_row},${w.start_col}`
    if (!map[key]) map[key] = num++
  }
  return map
}

function playSound(url) {
  if (!url) return
  try {
    const a = new Audio(url)
    a.play().catch(e => console.warn('Sound play failed:', url, e.message))
  } catch (e) { console.warn('Sound error:', e.message) }
}

/* ─── timer ─────────────────────────────────────────────── */
function useTimer(active, limitSeconds) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [active])
  const remaining = limitSeconds > 0 ? Math.max(0, limitSeconds - elapsed) : null
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return { elapsed, remaining, display: remaining !== null ? fmt(remaining) : fmt(elapsed) }
}

/* ─── progress tracker ─────────────────────────────────── */
function ProgressTracker({ current, total, timerDisplay, showTimer }) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const [displayPct, setDisplayPct] = useState(percentage);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (current > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(t);
    }
  }, [current]);

  useEffect(() => {
    let start = displayPct;
    const end = percentage;
    if (start === end) return;
    const duration = 800;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPct(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [percentage]);

  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{
      width: '100%', maxWidth: 340, margin: '0 auto 16px',
      background: 'rgba(255, 245, 248, 0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderRadius: 24, padding: '14px 20px',
      boxShadow: pulse ? `0 12px 40px rgba(139, 92, 246, 0.25), inset 0 0 0 1px rgba(255,255,255,0.6)` : '0 8px 30px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.6)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      transform: pulse ? 'scale(1.02)' : 'scale(1)',
      position: 'relative', zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <svg width="40" height="40" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
            <circle cx="20" cy="20" r={radius} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="3.5" />
            <circle cx="20" cy="20" r={radius} fill="none" stroke="url(#pg-grad)" strokeWidth="3.5"
              strokeDasharray={circumference} strokeDashoffset={offset} 
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
            <defs>
              <linearGradient id="pg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontSize: 18, zIndex: 1 }}>{percentage === 100 ? '✅' : '✨'}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
            {current} of {total} Words Solved
          </div>
          {!!showTimer && (
            <div style={{ fontSize: 12, color: '#666', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
               <span style={{ opacity: 0.7 }}>⏱</span> {timerDisplay}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 10, background: 'rgba(0,0,0,0.05)', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
          <div style={{ 
            height: '100%', width: `${percentage}%`, 
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            borderRadius: 10, transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)'
          }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#3b82f6', minWidth: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {displayPct}%
        </div>
      </div>
    </div>
  );
}

/* ─── audio helpers ─────────────────────────────────────── */
let _sharedAudioCtx = null
const getAudioCtx = () => {
  if (!_sharedAudioCtx || _sharedAudioCtx.state === 'closed') {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    _sharedAudioCtx = new AC()
  }
  if (_sharedAudioCtx.state === 'suspended') _sharedAudioCtx.resume().catch(() => {})
  return _sharedAudioCtx
}

const playKeySound = (enabled) => {
  if (!enabled) return
  const ctx = getAudioCtx()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'square'
  const baseFreq = 880
  const freq = baseFreq + (Math.random() * 80 - 40)
  osc.frequency.setValueAtTime(freq, ctx.currentTime)

  gain.gain.setValueAtTime(0.05, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start()
  osc.stop(ctx.currentTime + 0.08)
}

/* ─── main component ────────────────────────────────────── */
export default function CrosswordPlayerPage({ gameData, sessionToken, sessionId, onComplete }) {
  const { settings, words, soundMap } = gameData
  const soundMapRef = useRef(soundMap || {})
  useEffect(() => { soundMapRef.current = soundMap || {} }, [soundMap])

  const resolveSound = useCallback((id) => {
    if (!id) return null
    const n = parseInt(id)
    return isNaN(n) ? id : (soundMapRef.current[n] || null)
  }, [])

  // Injection of global styles for the new design
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes hint-breathing {
        0%, 100% { transform: scale(1); box-shadow: 0 6px 12px rgb(255, 255, 255); }
        50% { transform: scale(1.1); box-shadow: 0 10px 25px rgba(92, 82, 232, 0.5); }
      }
      .hint-orb {
        animation: hint-breathing 3s ease-in-out infinite !important;
      }
      @keyframes cell-pulse {
        0%, 100% { transform: scale(1); border-color: inherit; }
        50% { transform: scale(1.02); border-color: #fff; box-shadow: 0 0 15px rgba(255,255,255,0.4); }
      }
      .cell-active {
        animation: cell-pulse 1.5s ease-in-out infinite;
        z-index: 10;
      }
      .bg-overlay {
        position: fixed;
        inset: 0;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: saturate(0.8) blur(2px);
        pointer-events: none;
        z-index: 0;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const rows = settings?.grid_rows || 10
  const cols = settings?.grid_cols || 10
  
  // Calculate dynamic cell size for mobile
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const responsiveCellSize = Math.min((settings?.cell_size || 40) * 1.2, (windowWidth - 40) / cols);
  const cellSize = windowWidth < 768 ? responsiveCellSize : ((settings?.cell_size || 40) * 1.2);
  
  const primaryColor = settings?.primary_color || '#7c6ff7'

  const grid = buildGrid(words, rows, cols)
  const numberMap = buildNumberMap(words)

  // State
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('crosswordKeySoundEnabled')
    return saved !== null ? JSON.parse(saved) : true
  })

  // Persistence
  useEffect(() => {
    localStorage.setItem('crosswordKeySoundEnabled', JSON.stringify(soundEnabled))
  }, [soundEnabled])

  const [inputs, setInputs] = useState(() => {
    const m = {}
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (grid[r][c].letter) m[`${r},${c}`] = ''
    return m
  })
  const [correct, setCorrect] = useState({})   // wordId -> true
  const [wrong, setWrong]     = useState({})   // wordId -> true
  const [selected, setSelected] = useState(null) // { wordId }
  const [gameOver, setGameOver] = useState(false)
  const [activeOverlay, setActiveOverlay] = useState(null) // { url }
  const [submitted, setSubmitted] = useState({}) // wordId -> true (already sent to server)
  const [hintModalOpen, setHintModalOpen] = useState(false)
  const isTypingRef = useRef(false) // prevent onFocus from changing word while typing
  const cellRefs = useRef({})
  const firstClueClickRef = useRef(new Set()) // track words that have had their clue clicked

  const revealLetter = () => {
    if (!selectedWord) return
    const newInputs = { ...inputs }
    // Find the first empty or wrong letter in the word
    for (let i = 0; i < selectedWord.word_text.length; i++) {
      const r = selectedWord.direction === 'down'   ? selectedWord.start_row + i : selectedWord.start_row
      const c = selectedWord.direction === 'across' ? selectedWord.start_col + i : selectedWord.start_col
      const key = `${r},${c}`
      if (newInputs[key] !== selectedWord.word_text[i]) {
        newInputs[key] = selectedWord.word_text[i]
        setInputs(newInputs)
        // Check if this action solves the word
        const isCorrect = selectedWord.word_text.split('').every((char, idx) => {
          const wr = selectedWord.direction === 'down'   ? selectedWord.start_row + idx : selectedWord.start_row
          const wc = selectedWord.direction === 'across' ? selectedWord.start_col + idx : selectedWord.start_col
          return (newInputs[`${wr},${wc}`] || '').toUpperCase() === char
        })
        if (isCorrect) setCorrect(p => ({ ...p, [selectedWord.id]: true }))
        return
      }
    }
  }

  const revealWord = () => {
    if (!selectedWord) return
    const newInputs = { ...inputs }
    for (let i = 0; i < selectedWord.word_text.length; i++) {
      const r = selectedWord.direction === 'down'   ? selectedWord.start_row + i : selectedWord.start_row
      const c = selectedWord.direction === 'across' ? selectedWord.start_col + i : selectedWord.start_col
      newInputs[`${r},${c}`] = selectedWord.word_text[i]
    }
    setInputs(newInputs)
    setCorrect(p => ({ ...p, [selectedWord.id]: true }))
  }

  const { display: timerDisplay, remaining } = useTimer(!gameOver, settings?.time_limit_seconds || 0)

  // Time up
  useEffect(() => {
    if (remaining === 0 && !gameOver) setGameOver(true)
  }, [remaining])

  // All correct -> game over
  const [showCompletionPopup, setShowCompletionPopup] = useState(false)
  useEffect(() => {
    if (words.length > 0 && words.every(w => correct[w.id])) {
      setGameOver(true)
      setShowCompletionPopup(true)
      playSound(resolveSound(settings?.win_sound_id))
    }
  }, [correct])

  const selectedWord = words.find(w => w.id === selected?.wordId) || null

  /* get highlighted cells for selected word */
  const highlightedCells = new Set()
  if (selectedWord) {
    for (let i = 0; i < selectedWord.word_text.length; i++) {
      const r = selectedWord.direction === 'down'   ? selectedWord.start_row + i : selectedWord.start_row
      const c = selectedWord.direction === 'across' ? selectedWord.start_col + i : selectedWord.start_col
      highlightedCells.add(`${r},${c}`)
    }
  }

  /* focus first empty cell of a word, or first cell if forceFirst=true */
  const focusWord = (w, forceFirst = false) => {
    setSelected({ wordId: w.id })
    if (forceFirst) {
      cellRefs.current[`${w.start_row},${w.start_col}`]?.focus()
      return
    }
    for (let i = 0; i < w.word_text.length; i++) {
      const r = w.direction === 'down'   ? w.start_row + i : w.start_row
      const c = w.direction === 'across' ? w.start_col + i : w.start_col
      if (!inputs[`${r},${c}`]) {
        cellRefs.current[`${r},${c}`]?.focus()
        return
      }
    }
    cellRefs.current[`${w.start_row},${w.start_col}`]?.focus()
  }

  /* handle cell input */
  const handleInput = (r, c, val) => {
    // Prevent interaction if part of a solved word
    const isLocked = grid[r][c].wordIds.some(id => correct[id]);
    console.log('DEBUG handleInput: cell', r, c, 'wordIds:', grid[r][c].wordIds, 'correct state:', correct, 'isLocked:', isLocked);
    if (isLocked) return;

    isTypingRef.current = true
    const ch = val.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(-1)
    
    // Play sound if a valid letter was entered
    if (ch) playKeySound(soundEnabled)

    const key = `${r},${c}`
    const newInputs = { ...inputs, [key]: ch }
    setInputs(newInputs)

    // auto-advance in selected word direction, skipping already-filled cells
    if (ch && selectedWord) {
      let nr = r, nc = c
      do {
        if (selectedWord.direction === 'across') nc++
        else nr++
      } while (nr < rows && nc < cols && grid[nr][nc].letter && newInputs[`${nr},${nc}`])
      if (nr < rows && nc < cols && grid[nr][nc].letter) {
        cellRefs.current[`${nr},${nc}`]?.focus()
      }
    }

    // sync state updates for intersecting words
    let nextCorrect = { ...correct }
    let nextWrong = { ...wrong }
    let wordsToUpdate = [] // { w, isCorrect }

    if (ch) {
      const cellWordIds = grid[r][c].wordIds
      for (const w of words.filter(w => cellWordIds.includes(w.id))) {
        let allFilled = true
        let attempt = ''
        for (let i = 0; i < w.word_text.length; i++) {
          const wr = w.direction === 'down'   ? w.start_row + i : w.start_row
          const wc = w.direction === 'across' ? w.start_col + i : w.start_col
          const char = (newInputs[`${wr},${wc}`] || '').toUpperCase()
          if (!char) { allFilled = false; break }
          attempt += char
        }
        
        if (allFilled) {
          const isCorrect = attempt === w.word_text
          const wasCorrect = !!correct[w.id]
          const wasWrong = !!wrong[w.id]

          if (isCorrect) {
            nextCorrect[w.id] = true
            delete nextWrong[w.id]
            if (!wasCorrect) {
              wordsToUpdate.push({ w, attempt, isCorrect: true })
              playSound(resolveSound(w.sound_correct_id) || resolveSound(settings?.sound_correct_id))
              // Trigger overlay if image exists
              if (w.overlay_image_url) setActiveOverlay({ url: w.overlay_image_url })
            }
          } else {
            nextWrong[w.id] = true
            if (!wasWrong) {
              wordsToUpdate.push({ w, attempt, isCorrect: false })
              playSound(resolveSound(w.sound_wrong_id) || resolveSound(settings?.sound_wrong_id))
            }
          }
        }
      }
    }
    
    setCorrect(nextCorrect)
    setWrong(nextWrong)

    // Trigger server updates for newly corrected/wrong words
    for (const { w, attempt, isCorrect } of wordsToUpdate) {
      if (sessionToken) {
        fetch(`${API_BASE}/play/session/crossword-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_token: sessionToken,
            crossword_word_id: w.id,
            answer_text: attempt,
            is_correct: isCorrect
          })
        }).catch(() => {})
      }
    }
    
    setTimeout(() => { isTypingRef.current = false }, 50)
  }

  const handleKeyDown = (r, c, e) => {
    // Prevent interaction if part of a solved word
    const isLocked = grid[r][c].wordIds.some(id => correct[id]);
    console.log('DEBUG handleKeyDown: cell', r, c, 'wordIds:', grid[r][c].wordIds, 'correct state:', correct, 'isLocked:', isLocked);
    if (isLocked) return;

    if (e.key === 'Backspace' && !inputs[`${r},${c}`] && selectedWord) {
      let pr = r, pc = c
      if (selectedWord.direction === 'across') pc--
      else pr--
      if (pr >= 0 && pc >= 0 && grid[pr]?.[pc]?.letter) {
        cellRefs.current[`${pr},${pc}`]?.focus()
        setInputs(p => ({ ...p, [`${pr},${pc}`]: '' }))
      }
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const idx = words.findIndex(w => w.id === selected?.wordId)
      const next = words[(idx + 1) % words.length]
      if (next) focusWord(next)
    }
  }

  /* complete game */
  const completeGame = async () => {
    if (!sessionToken) { onComplete?.(); return }
    try {
      const res = await fetch(`${API_BASE}/play/session/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken })
      })
      const data = await res.json()
      onComplete?.(data)
    } catch {
      onComplete?.()
    }
  }

  const correctCount = Object.keys(correct).length
  const totalWords   = words.length

  /* ── render ── */
  return (
    <div style={{ fontFamily: settings?.font_family || 'DM Sans, sans-serif', minHeight: '100vh',
      background: settings?.bg_image_url ? `url(${settings.bg_image_url}) center/cover no-repeat` : (settings?.bg_color || '#f8f8ff'),
      padding: '120px 16px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', position: 'relative', overflowX: 'hidden' }}>

      <div className="bg-overlay" />

      {/* Hint System */}
      {(settings?.allow_hints === 1 || settings?.allow_hints === undefined || settings?.allow_hints === null) && (
        <div className="hint-orb">
          <FloatingHintButton color={primaryColor} onClick={() => setHintModalOpen(true)} />
        </div>
      )}
      <HintModal 
        isOpen={hintModalOpen} 
        onClose={() => setHintModalOpen(false)} 
        words={words}
        numberMap={numberMap}
        color={primaryColor} 
      />

      {activeOverlay && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 24, textAlign: 'center', maxWidth: '90%', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <img src={activeOverlay.url} alt="Overlay" style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 16, display: 'block', margin: '0 auto 20px', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }} />
            {gameOver ? (
              <button onClick={completeGame} style={{ width: '100%', padding: '14px', borderRadius: 14, background: primaryColor, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 800, transition: 'transform 0.2s' }}>
                {settings?.submit_button_text || 'Continue'}
              </button>
            ) : (
              <button onClick={() => setActiveOverlay(null)} style={{ width: '100%', padding: '12px', borderRadius: 14, background: '#f0f0f0', color: '#666', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* Completion Popup */}
      {showCompletionPopup && !activeOverlay && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(12px)' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 48, borderRadius: 28, textAlign: 'center', maxWidth: '420px', width: '90%', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 72, marginBottom: 20, animation: 'bounce 0.6s ease' }}>🎉</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, color: '#fff', letterSpacing: '-0.02em' }}>
              Game Completed!
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', marginBottom: 32, lineHeight: 1.6 }}>
              Congratulations! You've successfully solved all the words in the crossword puzzle.
            </p>
            <button 
              onClick={completeGame}
              style={{ 
                width: '100%', 
                padding: '16px 24px', 
                borderRadius: 16, 
                background: '#fff', 
                color: '#667eea', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: 18, 
                fontWeight: 800, 
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'
              }}
            >
              Continue to Thank You Page
            </button>
          </div>
        </div>
      )}

      {/* header */}
      <div style={{ textAlign: 'center', marginBottom: 12, position: 'relative', zIndex: 1 }}>
        {settings?.game_logo_url && <img src={settings.game_logo_url} alt="logo" style={{ height: 64, marginBottom: 8, objectFit: 'contain' }} />}
        {settings?.heading_1 && <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: settings.heading_1_color || (settings?.bg_image_url ? '#fff' : '#1a1a2e'), letterSpacing: '-0.02em' }}>{settings.heading_1}</h1>}
        {settings?.heading_2 && <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 600, color: settings.heading_2_color || '#666' }}>{settings.heading_2}</p>}
        {settings?.heading_3 && <p style={{ margin: '0 0 2px', fontSize: 14, color: settings.heading_3_color || '#888' }}>{settings.heading_3}</p>}
        {settings?.description_text && <p style={{ margin: '8px 0 0', fontSize: 14, color: settings.description_color || '#666', lineHeight: 1.5 }}>{settings.description_text}</p>}
      </div>

      <ProgressTracker 
        current={correctCount} 
        total={totalWords} 
        timerDisplay={timerDisplay} 
        showTimer={settings?.show_timer} 
      />

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center', alignItems: 'center', width: '100%', position: 'relative', zIndex: 1 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
        {/* ── grid ── */}
        <div style={{ overflowX: 'auto', padding: '10px', borderRadius: 12 }}>
          <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`, gap: 3, padding: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 16, boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
            {Array.from({ length: rows }, (_, r) =>
              Array.from({ length: cols }, (_, c) => {
                const key = `${r},${c}`
                const cell = grid[r][c]
                if (!cell.letter) {
                  const bg = settings?.blank_cell_image_url
                    ? `white url("${settings.blank_cell_image_url}") center / contain no-repeat`
                    : 'transparent'
                  return <div key={key} style={{ width: cellSize, height: cellSize, background: bg }} />
                }

                const isHighlighted = highlightedCells.has(key)
                const isSelected = selectedWord && cellRefs.current[key] === document.activeElement
                const isCorrect = cell.wordIds.some(id => correct[id])
                const isWrong   = !isCorrect && cell.wordIds.some(id => wrong[id])
                const isLocked = isCorrect 
                const num = numberMap[key]

                let bg = '#ffffff' // White
                let textColor = '#1a1a2e' // Dark text
                let borderColor = '#cccccc' // Light gray border

                if (isCorrect) {
                  bg = '#10b981' // Green
                  textColor = '#fff'
                  borderColor = '#059669'
                } else if (isWrong) {
                  bg = '#ef4444' // Red
                  textColor = '#fff'
                  borderColor = '#dc2626'
                } else if (isHighlighted) {
                  bg = '#f0f4ff' // Light blue highlight
                  borderColor = primaryColor
                }

                return (
                  <div key={key} style={{ position: 'relative', width: cellSize, height: cellSize }} className={isHighlighted ? 'cell-active' : ''}>
                    {num && <span style={{ position: 'absolute', top: 2, left: 4, fontSize: cellSize * 0.22, color: '#666', lineHeight: 1, zIndex: 2, pointerEvents: 'none', fontWeight: 600 }}>{num}</span>}
                    <input
                      ref={el => cellRefs.current[key] = el}
                      maxLength={1}
                      value={inputs[key] || ''}
                      readOnly={isLocked}
                      onChange={e => handleInput(r, c, e.target.value)}
                      onKeyDown={e => handleKeyDown(r, c, e)}
                      onFocus={() => {
                        if (selectedWord && cell.wordIds.includes(selectedWord.id)) return
                        if (!isTypingRef.current) {
                          const owningWord = words.find(w => cell.wordIds.includes(w.id) && !correct[w.id])
                            || words.find(w => cell.wordIds.includes(w.id))
                          if (owningWord) setSelected({ wordId: owningWord.id })
                        }
                      }}
                      style={{
                        width: '100%', height: '100%', border: `2px solid ${isHighlighted ? primaryColor : borderColor}`,
                        borderRadius: 8, textAlign: 'center', fontSize: cellSize * 0.45, fontWeight: 800,
                        background: bg, color: textColor, outline: 'none', cursor: isLocked ? 'default' : 'text',
                        textTransform: 'uppercase', padding: 0, boxSizing: 'border-box', paddingTop: num ? cellSize * 0.15 : 0,
                        boxShadow: isHighlighted ? `0 0 12px ${primaryColor}66` : 'none',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </div>
                )
              })
            )}
            </div>
            </div>
            </div>
            </div>
            </div>
            )
            }
