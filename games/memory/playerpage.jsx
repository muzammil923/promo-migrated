import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../../apps/frontend/src/api'

function loadFont(font) {
  if (!font || font === 'DM Sans') return
  const id = 'gf-' + font.replace(/\s/g, '-')
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id; link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700;800&display=swap`
  document.head.appendChild(link)
}

function playSound(soundMap, id) {
  if (!id || !soundMap?.[id]) return
  try { new Audio(soundMap[id]).play().catch(() => {}) } catch {}
}

function CardShapeStyle(shape) {
  switch (shape) {
    case 'rounded-sm': return { borderRadius: 4 }
    case 'rounded': return { borderRadius: 8 }
    case 'rounded-lg': return { borderRadius: 16 }
    case 'circle': return { borderRadius: '50%' }
    case 'hexagon': return { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }
    default: return { borderRadius: 2 }
  }
}

function Confetti({ count = 40 }) {
  const colors = ['#6366f1','#ec4899','#f59e0b','#22c55e','#3b82f6','#ef4444','#8b5cf6','#FFD700']
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:999, overflow:'hidden' }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          position:'absolute', top:-20, left:`${Math.random()*100}%`,
          width:6+Math.random()*8, height:6+Math.random()*8, background:colors[i%colors.length],
          borderRadius:Math.random()>0.5?'50%':'2px',
          animation:`memConfettiFall ${2+Math.random()*3}s ${Math.random()*2}s ease-in forwards`,
          transform:`rotate(${Math.random()*360}deg)`,
        }} />
      ))}
    </div>
  )
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
@keyframes memFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes memPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
@keyframes memGlow { 0%,100%{box-shadow:0 0 8px 2px rgba(255,215,0,.6)} 50%{box-shadow:0 0 20px 6px rgba(255,215,0,.9)} }
@keyframes memPopIn { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
@keyframes memMatchPop { 0%{transform:scale(1)} 30%{transform:scale(1.15) rotate(5deg)} 100%{transform:scale(1)} }
@keyframes memShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes memSlideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
@keyframes memConfettiFall { 0%{transform:translateY(-10vh) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
@keyframes memFadeIn { from{opacity:0} to{opacity:1} }
@keyframes memBounceIn { 0%{transform:scale(0);opacity:0} 50%{transform:scale(1.15)} 70%{transform:scale(0.92)} 100%{transform:scale(1);opacity:1} }
@keyframes memShuffleOut { 0%{transform:scale(1) rotate(0);opacity:1} 50%{transform:scale(.6) rotate(180deg);opacity:.5} 100%{transform:scale(0) rotate(360deg);opacity:0} }
@keyframes memShuffleIn { 0%{transform:scale(0) rotate(360deg);opacity:0} 50%{transform:scale(1.1) rotate(-10deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
@keyframes memShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
@keyframes memFlyFromBottom { from{transform:translateY(110vh) scale(0.9);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
@keyframes memFlyToTop { from{transform:translateY(0) scale(1);opacity:1} to{transform:translateY(-110vh) scale(0.9);opacity:0} }
@keyframes memNextBtnIn { from{opacity:0;transform:translateY(16px) scale(0.9)} to{opacity:1;transform:translateY(0) scale(1)} }

.mem-game {
  min-height:100vh; min-height:100dvh;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  font-family:'Poppins',sans-serif; padding:16px; position:relative; overflow:hidden;
}
.mem-game::before {
  content:''; position:absolute; inset:0;
  background:linear-gradient(135deg,#e84393 0%,#6c5ce7 25%,#00cec9 50%,#fdcb6e 75%,#e84393 100%);
  background-size:400% 400%; animation:memShimmer 15s ease infinite; z-index:0;
}
.mem-game.has-custom-bg::before { display:none; }
.mem-game::after {
  content:''; position:absolute; inset:0;
  background:radial-gradient(circle at 20% 80%,rgba(255,255,255,.15) 0%,transparent 50%),
             radial-gradient(circle at 80% 20%,rgba(255,255,255,.1) 0%,transparent 50%);
  z-index:0; pointer-events:none;
}
.mem-glass {
  position:relative; z-index:1; width:100%; max-width:420px;
  background:rgba(255,255,255,.12); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
  border-radius:28px; padding:28px 20px 20px; text-align:center;
  box-shadow:0 16px 48px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.25);
  border:1px solid rgba(255,255,255,.2);
}
.mem-title {
  font-size:28px; font-weight:900; color:#FFD700; margin:0 0 2px;
  text-shadow:0 2px 8px rgba(0,0,0,.2), 0 0 20px rgba(255,215,0,.3); letter-spacing:1px;
}
.mem-subtitle { font-size:13px; color:rgba(255,255,255,.7); margin:0 0 16px; font-weight:500; }
.mem-logo { text-align:center; margin-bottom:12px; }
.mem-logo img { height:48px; max-width:180px; object-fit:contain; border-radius:8px; }
.mem-stats { display:flex; gap:8px; margin-bottom:16px; justify-content:center; }
.mem-stat {
  flex:1; max-width:110px; padding:10px 6px; border-radius:16px; text-align:center;
  background:linear-gradient(135deg,rgba(108,92,231,.7),rgba(45,52,54,.5));
  box-shadow:0 4px 12px rgba(0,0,0,.15);
}
.mem-stat-icon { font-size:18px; margin-bottom:2px; }
.mem-stat-val { font-size:20px; font-weight:800; color:#fff; line-height:1.1; }
.mem-stat-lbl { font-size:9px; font-weight:700; color:rgba(255,255,255,.6); text-transform:uppercase; letter-spacing:1px; }
.mem-board { display:flex; flex-direction:column; gap:8px; align-items:center; margin-bottom:16px; }
.mem-row { display:flex; gap:8px; justify-content:center; }
.mem-card {
  width:72px; height:72px; border-radius:14px; cursor:pointer; position:relative; perspective:600px;
  transition:transform .2s;
}
.mem-card:active { transform:scale(.95); }
.mem-card.matched { animation:memMatchPop .4s ease; pointer-events:none; }
.mem-card-inner {
  width:100%; height:100%; position:relative; transform-style:preserve-3d;
  transition:transform .5s cubic-bezier(.4,.0,.2,1); border-radius:14px;
}
.mem-card.flipped .mem-card-inner { transform:rotateY(180deg); }
.mem-card-face {
  position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden;
  border-radius:14px; display:flex; align-items:center; justify-content:center; overflow:hidden;
}
.mem-card-back {
  background:linear-gradient(135deg,#8b5cf6,#6c5ce7);
  box-shadow:0 4px 12px rgba(108,92,231,.4);
}
.mem-card-back::after { content:'♛'; font-size:28px; color:rgba(255,255,255,.25); font-weight:900; }
.mem-card-back.custom-cover {
  background-size:cover; background-position:center; background-repeat:no-repeat;
}
.mem-card-back.custom-cover::after { display:none; }
.mem-card-front {
  transform:rotateY(180deg);
  background:linear-gradient(135deg,#fff9e6,#ffeaa7);
  box-shadow:0 4px 12px rgba(0,0,0,.15);
  border:2px solid rgba(255,215,0,.4);
}
.mem-card-front img { width:100%; height:100%; object-fit:cover; border-radius:12px; }
.mem-card.hint-glow { animation:memGlow 1s ease-in-out infinite; }
.mem-card.shuffle-out { animation:memShuffleOut .4s ease-in forwards; }
.mem-card.shuffle-in { animation:memShuffleIn .45s ease-out forwards; }
.mem-powerups { display:flex; gap:10px; justify-content:center; }
.mem-powerup {
  display:flex; flex-direction:column; align-items:center; gap:4px; padding:10px 16px;
  border-radius:16px; border:none; cursor:pointer; font-family:'Poppins',sans-serif;
  font-size:12px; font-weight:700; color:#fff; position:relative; transition:transform .15s;
  box-shadow:0 4px 12px rgba(0,0,0,.2);
}
.mem-powerup:hover { transform:translateY(-2px); }
.mem-powerup:active { transform:scale(.95); }
.mem-powerup:disabled { opacity:.5; cursor:not-allowed; transform:none; }
.mem-powerup-icon { font-size:22px; }
.mem-powerup-tooltip {
  position:absolute; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%);
  background:rgba(0,0,0,.85); color:#fff; font-size:11px; font-weight:600; padding:6px 12px;
  border-radius:8px; white-space:nowrap; z-index:10;
  opacity:0; visibility:hidden; transition:opacity .15s,visibility .15s; pointer-events:none;
}
.mem-powerup-wrap:hover .mem-powerup-tooltip { opacity:1; visibility:visible; }
.mem-powerup-tooltip::after {
  content:''; position:absolute; top:100%; left:50%; transform:translateX(-50%);
  border:5px solid transparent; border-top-color:rgba(0,0,0,.85);
}
.mem-powerup-badge {
  position:absolute; top:-4px; right:-4px; width:20px; height:20px; border-radius:50%;
  background:#e74c3c; color:#fff; font-size:11px; font-weight:800; display:flex;
  align-items:center; justify-content:center; border:2px solid #fff;
}
.mem-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,.6); backdrop-filter:blur(8px);
  display:flex; align-items:center; justify-content:center; z-index:100; padding:24px;
}
.mem-overlay-card {
  background:rgba(255,255,255,.12); backdrop-filter:blur(24px); border-radius:28px;
  padding:36px 28px; max-width:360px; width:100%; text-align:center;
  box-shadow:0 24px 64px rgba(0,0,0,.4); border:1px solid rgba(255,255,255,.15);
  animation:memPopIn .4s cubic-bezier(.68,-.55,.265,1.55);
}
.mem-overlay-emoji { font-size:64px; margin-bottom:12px; animation:memFloat 2s ease-in-out infinite; }
.mem-overlay-title { font-size:24px; font-weight:800; color:#FFD700; margin:0 0 8px; text-shadow:0 2px 8px rgba(0,0,0,.2); }
.mem-overlay-sub { font-size:14px; color:rgba(255,255,255,.7); margin:0 0 20px; }
.mem-overlay-btn {
  width:100%; padding:14px; border-radius:14px; border:none; font-size:16px; font-weight:700;
  font-family:'Poppins',sans-serif; cursor:pointer; transition:transform .15s;
}
.mem-overlay-btn:hover { transform:translateY(-2px); }
.mem-form { text-align:left; }
.mem-form-field { margin-bottom:10px; }
.mem-form-label { font-size:11px; font-weight:700; color:rgba(255,255,255,.6); text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; display:block; }
.mem-form-input {
  width:100%; padding:10px 14px; border-radius:10px; border:1.5px solid rgba(255,255,255,.2);
  background:rgba(255,255,255,.1); color:#fff; font-size:14px; font-family:'Poppins',sans-serif;
  outline:none; box-sizing:border-box;
}
.mem-form-input::placeholder { color:rgba(255,255,255,.4); }
.mem-form-input:focus { border-color:rgba(255,215,0,.6); }
.mem-popup {
  position:fixed; top:20px; left:50%; transform:translateX(-50%); padding:12px 24px;
  border-radius:12px; background:#e74c3c; color:#fff; font-weight:700; font-size:13px;
  z-index:200; animation:memSlideUp .3s ease;
}
.mem-already-played {
  min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:20px; font-family:'Poppins',sans-serif;
  background:linear-gradient(135deg,#e84393,#6c5ce7,#00cec9,#fdcb6e); background-size:400% 400%;
}
.mem-game-over-card {
  background:rgba(255,255,255,.92); backdrop-filter:blur(12px); border-radius:20px;
  padding:28px 24px; max-width:340px; width:100%; text-align:center;
  box-shadow:0 8px 32px rgba(0,0,0,.1); animation:memSlideUp .4s ease;
}
@media(max-width:400px) {
  .mem-card { width:62px; height:62px; }
  .mem-title { font-size:24px; }
  .mem-glass { padding:20px 14px 14px; border-radius:22px; }
}
`

export default function MemoryPlayerPage({ gameData, sessionToken: initToken, onComplete }) {
  const game = gameData
  const settings = game.settings || {}
  const soundMap = game.soundMap || {}
  const rawTiles = game.tiles || []
  const formFields = game.formFields || []

  const [phase, setPhase] = useState(initToken ? 'playing' : 'intro')
  const [cards, setCards] = useState([])
  const [flippedIndices, setFlippedIndices] = useState([])
  const [matchedPairIds, setMatchedPairIds] = useState(new Set())
  const [moves, setMoves] = useState(0)
  const [matchCount, setMatchCount] = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayAnimOut, setOverlayAnimOut] = useState('')
  const [gameOver, setGameOver] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [hintCount, setHintCount] = useState(3)
  const [shuffleCount, setShuffleCount] = useState(3)
  const [revealCount, setRevealCount] = useState(3)
  const [shuffling, setShuffling] = useState(false)
  const [popup, setPopup] = useState(null)
  const [sessionToken, setSessionToken] = useState(initToken)
  const [formData, setFormData] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const timerRef = useRef(null)
  const isCompleteRef = useRef(false)

  const cols = parseInt(settings.grid_cols) || 4
  const cellSize = Math.min(80, Math.floor(Math.min(360, window.innerWidth - 40) / Math.max(cols, 2)))
  const uniquePairIds = new Set(rawTiles.map(t => t.pair_id).filter(Boolean))
  const uniqueImageUrls = new Set(rawTiles.map(t => t.image_url).filter(Boolean))
  const totalPairs = uniquePairIds.size || uniqueImageUrls.size || rawTiles.length

  useEffect(() => { loadFont(settings.font_family) }, [settings.font_family])

  useEffect(() => {
    if (!rawTiles.length) return
    const shuffled = [...rawTiles]
      .sort(() => Math.random() - 0.5)
      .map((t, i) => ({ ...t, cardIndex: i, isFlipped: false, isMatched: false }))
    setCards(shuffled)
    setMatchCount(0)
    setMoves(0)
    setFlippedIndices([])
    setMatchedPairIds(new Set())
  }, [rawTiles])

  useEffect(() => {
    if (phase !== 'playing' || !settings.time_limit_seconds || gameOver) return
    setTimeLeft(settings.time_limit_seconds)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); handleGameOver(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, gameOver])

  const handleStart = async () => {
    const errors = {}
    for (const f of formFields) {
      if (Number(f.is_required) === 1 && !formData[f.field_label]?.trim()) errors[f.field_label] = 'Required'
      else if (formData[f.field_label]?.trim() && f.field_type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[f.field_label])) errors[f.field_label] = 'Enter a valid email'
      else if (formData[f.field_label]?.trim() && f.field_type === 'phone') { const digits = formData[f.field_label].replace(/[\s\-()]/g, '').replace(/^\+?91/, ''); if (!/^\d{10}$/.test(digits)) errors[f.field_label] = 'Enter a valid 10-digit phone number' }
    }
    if (Number(settings.terms_enabled) === 1 && !termsAccepted) errors._terms = 'Accept terms'
    if (Object.keys(errors).length) { setFormErrors(errors); return }
    setFormErrors({})
    setSubmitting(true)
    try {
      const playerUser = JSON.parse(localStorage.getItem('playerUser') || '{}')
      const src = new URLSearchParams(window.location.search).get('source') === 'direct' ? 'direct' : 'link'
      const res = await api.post('/play/session/start', { game_id: game.id, player_data: formData, source_type: src, promo_player_id: playerUser.id || null })
      if (!res.data.success) {
        if (res.data.message === 'already_played') { setAlreadyPlayed(true); setSubmitting(false); return }
        throw new Error(res.data.message)
      }
      setSessionToken(res.data.session_token)
      setPhase('playing')
    } catch (err) {
      setPopup(err.message || 'Error starting game')
      setTimeout(() => setPopup(null), 3000)
    }
    setSubmitting(false)
  }

  const handleCardClick = useCallback((index) => {
    if (isChecking || gameOver || flippedIndices.length >= 2) return
    if (cards[index]?.isMatched || cards[index]?.isFlipped) return

    playSound(soundMap, settings.sound_flip_id)
    const newCards = [...cards]
    newCards[index] = { ...newCards[index], isFlipped: true }
    setCards(newCards)
    const newFlipped = [...flippedIndices, index]
    setFlippedIndices(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1)
      setIsChecking(true)
      const [first, second] = newFlipped
      const card1 = newCards[first]
      const card2 = newCards[second]

      if (card1.pair_id != null && card2.pair_id != null && card1.pair_id === card2.pair_id) {
        setTimeout(() => {
          playSound(soundMap, settings.sound_match_id)
          setCards(prev => {
            const uc = [...prev]
            uc[first] = { ...uc[first], isMatched: true }
            uc[second] = { ...uc[second], isMatched: true }
            return uc
          })
          setMatchedPairIds(prev => new Set([...prev, card1.pair_id]))
          setMatchCount(prev => prev + 1)
          setFlippedIndices([])
          setIsChecking(false)
          if (settings.overlay_animation_in) setShowOverlay(true)
        }, 400)
      } else if (card1.pair_id == null && card2.pair_id == null && card1.image_url && card1.image_url === card2.image_url) {
        setTimeout(() => {
          playSound(soundMap, settings.sound_match_id)
          setCards(prev => {
            const uc = [...prev]
            uc[first] = { ...uc[first], isMatched: true, pair_id: first }
            uc[second] = { ...uc[second], isMatched: true, pair_id: first }
            return uc
          })
          setMatchedPairIds(prev => new Set([...prev, first]))
          setMatchCount(prev => prev + 1)
          setFlippedIndices([])
          setIsChecking(false)
          if (settings.overlay_animation_in) setShowOverlay(true)
        }, 400)
      } else {
        setTimeout(() => {
          playSound(soundMap, settings.sound_nomatch_id)
          setCards(prev => {
            const uc = [...prev]
            uc[first] = { ...uc[first], isFlipped: false }
            uc[second] = { ...uc[second], isFlipped: false }
            return uc
          })
          setFlippedIndices([])
          setIsChecking(false)
        }, 1000)
      }
    }
  }, [cards, flippedIndices, isChecking, gameOver, soundMap, settings])

  const handleOverlayNext = () => {
    setOverlayAnimOut(settings.overlay_animation_out || 'memFlyToTop')
    setTimeout(() => {
      setShowOverlay(false)
      setOverlayAnimOut('')
    }, 400)
  }

  const handleGameOver = async () => {
    if (isCompleteRef.current) return
    isCompleteRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)
    setGameOver(true)
    playSound(soundMap, settings.win_sound_id)
    if (!sessionToken) {
      onComplete?.({ redirect_url: settings.redirect_url || game.redirect_url })
      return
    }
    try {
      const res = await api.post('/play/session/complete', { session_token: sessionToken, score: moves, player_data: { total_moves: moves, total_pairs: totalPairs, time_taken: settings.time_limit_seconds ? settings.time_limit_seconds - timeLeft : 0 } })
      onComplete?.({ ...res.data, redirect_url: res.data.redirect_url || settings.redirect_url || game.redirect_url })
    } catch (err) {
      onComplete?.({ redirect_url: settings.redirect_url || game.redirect_url })
    }
  }

  const handleHint = () => {
    if (hintCount <= 0 || flippedIndices.length !== 1 || isChecking) return
    const firstIdx = flippedIndices[0]
    const firstCard = cards[firstIdx]
    if (!firstCard) return
    let matchIdx = -1
    if (firstCard.pair_id != null) {
      matchIdx = cards.findIndex((c, i) => i !== firstIdx && c.pair_id === firstCard.pair_id && !c.isMatched && !c.isFlipped)
    } else if (firstCard.image_url) {
      matchIdx = cards.findIndex((c, i) => i !== firstIdx && c.image_url === firstCard.image_url && !c.isMatched && !c.isFlipped)
    }
    if (matchIdx === -1) return
    setHintCount(prev => prev - 1)
    setCards(prev => {
      const uc = [...prev]
      uc[matchIdx] = { ...uc[matchIdx], hintGlow: true }
      return uc
    })
    setTimeout(() => {
      setCards(prev => {
        const uc = [...prev]
        uc[matchIdx] = { ...uc[matchIdx], hintGlow: false }
        return uc
      })
    }, 2000)
  }

  const handleReveal = () => {
    if (revealCount <= 0 || isChecking) return
    setRevealCount(prev => prev - 1)
    const unmatchedIndices = cards.map((c, i) => ({ c, i })).filter(x => !x.c.isMatched && !x.c.isFlipped)
    if (unmatchedIndices.length < 2) return
    setCards(prev => {
      const uc = [...prev]
      unmatchedIndices.forEach(({ i }) => { uc[i] = { ...uc[i], isFlipped: true } })
      return uc
    })
    setTimeout(() => {
      setCards(prev => {
        const uc = [...prev]
        unmatchedIndices.forEach(({ i }) => { uc[i] = { ...uc[i], isFlipped: false } })
        return uc
      })
    }, 1500)
  }

  const handleShuffle = () => {
    if (shuffleCount <= 0 || isChecking || shuffling) return
    setShuffleCount(prev => prev - 1)
    setShuffling(true)
    setTimeout(() => {
      const unmatched = cards.filter(c => !c.isMatched)
      const shuffled = [...unmatched].sort(() => Math.random() - 0.5)
      setCards(prev => {
        const uc = [...prev]
        let j = 0
        for (let i = 0; i < uc.length; i++) {
          if (!uc[i].isMatched) { uc[i] = { ...shuffled[j], cardIndex: i, isFlipped: false, shuffleIn: true }; j++ }
        }
        return uc
      })
      setTimeout(() => {
        setShuffling(false)
        setCards(prev => prev.map(c => ({ ...c, shuffleIn: false })))
      }, 450)
    }, 400)
  }

  const allMatched = cards.length > 0 && cards.every(c => c.isMatched)
  useEffect(() => {
    if (allMatched && matchCount > 0 && !gameOver) {
      if (showOverlay) {
        // If overlay is still showing (last match triggered it), dismiss it first then end game
        setTimeout(() => {
          setShowOverlay(false)
          handleGameOver()
        }, 1500)
      } else {
        handleGameOver()
      }
    }
  }, [allMatched])

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`
  const bgStyle = settings.bg_image_url
    ? { background: `url(${settings.bg_image_url}) center/cover no-repeat` }
    : { background: settings.bg_color || '#0097A7' }
  const logoUrl = settings.game_logo_url || game.game_logo_url
  const pageClassName = `mem-game${(settings.bg_image_url || settings.bg_color) ? ' has-custom-bg' : ''}`
  const logoNode = logoUrl ? (
    <div className="mem-logo">
      <img src={logoUrl} alt={game.name ? `${game.name} logo` : 'Game logo'} />
    </div>
  ) : null

  if (alreadyPlayed) {
    return (
      <div className={pageClassName} style={bgStyle}>
        <style>{STYLES}</style>
        <div className="mem-glass">
          {logoNode}
          <div style={{ fontSize:48, marginBottom:12 }}>⚠️</div>
          <h2 style={{ color:'#fff', marginBottom:8, fontSize:20 }}>Already Played</h2>
          <p style={{ color:'rgba(255,255,255,.7)', fontSize:13, textAlign:'center' }}>You have already completed this game. Each game can only be played once.</p>
        </div>
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div className={pageClassName} style={bgStyle}>
        <style>{STYLES}</style>
        <div className="mem-glass">
          {logoNode}
          <div className="mem-title">✨ Memory Match ✨</div>
          <div className="mem-subtitle">{settings.heading_2 || game.name}</div>
          {settings.heading_3 && <p style={{ color:'rgba(255,255,255,.5)', fontSize:12, marginBottom:8 }}>{settings.heading_3}</p>}
          {settings.description_text && <p style={{ color:'rgba(255,255,255,.5)', fontSize:12, marginBottom:16, lineHeight:1.4 }}>{settings.description_text}</p>}

          <div className="mem-form">
            {game.game_type !== 'promogames' && formFields.map((ff, i) => (
              <div key={i} className="mem-form-field">
                <label className="mem-form-label">{ff.field_label} {Number(ff.is_required) === 1 && <span style={{ color:'#e74c3c' }}>*</span>}</label>
                {ff.field_type === 'textarea' ? (
                  <textarea rows={3} value={formData[ff.field_label] || ''}
                    onChange={e => { setFormData({...formData, [ff.field_label]:e.target.value}); setFormErrors({...formErrors,[ff.field_label]:''}) }}
                    className="mem-form-input" style={{ resize:'vertical' }} />
                ) : ff.field_type === 'select' ? (
                  <select value={formData[ff.field_label] || ''}
                    onChange={e => setFormData({...formData,[ff.field_label]:e.target.value})}
                    className="mem-form-input">
                    <option value="">Select...</option>
                    {(ff.field_options || []).map((opt, oi) => <option key={oi} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input type={ff.field_type==='email'?'email':ff.field_type==='phone'?'tel':ff.field_type==='number'?'number':'text'}
                    value={formData[ff.field_label]||''}
                    onChange={e => { setFormData({...formData,[ff.field_label]:e.target.value}); setFormErrors({...formErrors,[ff.field_label]:''}) }}
                    className="mem-form-input" placeholder={ff.field_label} />
                )}
                {formErrors[ff.field_label] && <p style={{ color:'#e74c3c', fontSize:11, margin:'3px 0 0' }}>{formErrors[ff.field_label]}</p>}
              </div>
            ))}

            {Number(settings.terms_enabled) === 1 && (
              <label style={{ display:'flex', alignItems:'center', gap:8, margin:'12px 0', cursor:'pointer', fontSize:12, color:'rgba(255,255,255,.7)' }}>
                <input type="checkbox" checked={termsAccepted} onChange={e => { setTermsAccepted(e.target.checked); setFormErrors({...formErrors,_terms:''}) }} style={{ width:16, height:16 }} />
                <span>
                  {settings.terms_url
                    ? <a href={settings.terms_url} target="_blank" style={{ color:'#FFD700' }}>{settings.terms_text || 'Terms & Conditions'}</a>
                    : settings.terms_text || 'Terms & Conditions'
                  }
                </span>
              </label>
            )}
            {formErrors._terms && <p style={{ color:'#e74c3c', fontSize:11, margin:'3px 0 0' }}>{formErrors._terms}</p>}

            <button onClick={handleStart} disabled={submitting || (Number(settings.terms_enabled) === 1 && !termsAccepted)} className="mem-overlay-btn"
              style={{ background:'linear-gradient(135deg,#FFD700,#f39c12)', color:'#1a1a2e', marginTop:12, opacity:(Number(settings.terms_enabled) === 1 && !termsAccepted) ? 0.5 : 1 }}>
              {submitting ? '⏳ Starting...' : (settings.start_button_text || '🎮 Start Game')}
            </button>
          </div>
        </div>
        {popup && <div className="mem-popup">{popup}</div>}
      </div>
    )
  }

  if (phase === 'playing' || gameOver) {
    const cardShape = CardShapeStyle(settings.card_shape || 'square')
    const hasCover = !!settings.card_cover_image_url

    return (
      <div className={pageClassName} style={bgStyle}>
        <style>{STYLES}</style>
        {gameOver && <Confetti />}
        <div className="mem-glass">
          {logoNode}
          <div className="mem-title">✨ Memory Match ✨</div>
          <div className="mem-subtitle">{settings.heading_2 || game.name}</div>

          <div className="mem-stats">
            <div className="mem-stat">
              <div className="mem-stat-icon">⏱️</div>
              <div className="mem-stat-val">{settings.time_limit_seconds ? formatTime(timeLeft) : '0:00'}</div>
              <div className="mem-stat-lbl">TIME</div>
            </div>
            <div className="mem-stat">
              <div className="mem-stat-icon">⭐</div>
              <div className="mem-stat-val">{moves}</div>
              <div className="mem-stat-lbl">MOVES</div>
            </div>
            <div className="mem-stat">
              <div className="mem-stat-icon">🏆</div>
              <div className="mem-stat-val">{matchCount}/{totalPairs}</div>
              <div className="mem-stat-lbl">BEST</div>
            </div>
          </div>

          {!gameOver && (
            <div className="mem-board">
              {(() => {
                const totalCards = cards.length
                const fullRows = Math.floor(totalCards / cols)
                const lastRowCount = totalCards % cols
                const rows = []
                for (let r = 0; r < fullRows; r++) {
                  rows.push(
                    <div key={`row-${r}`} className="mem-row">
                      {cards.slice(r*cols, r*cols+cols).map((card, ci) => {
                        const idx = r*cols+ci
                        const isFlipped = card.isFlipped || card.isMatched
                        return (
                          <div key={card.cardIndex??idx}
                            className={`mem-card${isFlipped?' flipped':''}${card.isMatched?' matched':''}${card.hintGlow?' hint-glow':''}${shuffling&&!card.isMatched?' shuffle-out':''}${!shuffling&&card.shuffleIn?' shuffle-in':''}`}
                            onClick={() => handleCardClick(idx)}>
                            <div className="mem-card-inner" style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }}>
                              <div className={`mem-card-face mem-card-back${hasCover?' custom-cover':''}`}
                                style={hasCover ? {backgroundImage:`url(${settings.card_cover_image_url})`} : {...cardShape}} />
                              <div className="mem-card-face mem-card-front" style={cardShape}>
                                {card.image_url ? <img src={card.image_url} alt="" /> : <span style={{fontSize:28}}>🃏</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                }
                if (lastRowCount > 0) {
                  rows.push(
                    <div key="last-row" className="mem-row">
                      {cards.slice(fullRows*cols).map((card, ci) => {
                        const idx = fullRows*cols+ci
                        const isFlipped = card.isFlipped || card.isMatched
                        return (
                          <div key={card.cardIndex??idx}
                            className={`mem-card${isFlipped?' flipped':''}${card.isMatched?' matched':''}${card.hintGlow?' hint-glow':''}${shuffling&&!card.isMatched?' shuffle-out':''}${!shuffling&&card.shuffleIn?' shuffle-in':''}`}
                            onClick={() => handleCardClick(idx)}>
                            <div className="mem-card-inner" style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }}>
                              <div className={`mem-card-face mem-card-back${hasCover?' custom-cover':''}`}
                                style={hasCover ? {backgroundImage:`url(${settings.card_cover_image_url})`} : {...cardShape}} />
                              <div className="mem-card-face mem-card-front" style={cardShape}>
                                {card.image_url ? <img src={card.image_url} alt="" /> : <span style={{fontSize:28}}>🃏</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                }
                return rows
              })()}
            </div>
          )}

          {gameOver && !showOverlay && (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div className="mem-game-over-card" style={{ background:'rgba(255,255,255,.92)', backdropFilter:'blur(12px)', borderRadius:20, padding:'28px 24px', boxShadow:'0 8px 32px rgba(0,0,0,.1)', animation:'memSlideUp .4s ease' }}>
                <div style={{ fontSize:48, marginBottom:8 }}>🎉</div>
                <h2 style={{ fontSize:20, fontWeight:800, color: settings.heading_1_color || '#1a1a2e', margin:'0 0 4px' }}>
                  {game.text1 || '🎉 Congratulations!'}
                </h2>
                <p style={{ fontSize:14, color: settings.heading_2_color || '#666', margin:'0 0 8px' }}>
                  {game.text2 || `You matched all cards in ${moves} moves!`}
                </p>
                {settings.outro_text && (
                  <p style={{ fontSize:13, color: settings.description_color || '#888', margin:'0 0 16px', lineHeight:1.4 }}>{settings.outro_text}</p>
                )}
                <button className="mem-overlay-btn" onClick={() => onComplete?.({ redirect_url: settings.redirect_url || game.redirect_url })}
                  style={{ background: settings.primary_color || '#6366f1', color:'#fff', marginBottom:10 }}>
                  {settings.continue_button_text || 'Continue →'}
                </button>
                <button className="mem-overlay-btn" onClick={() => window.location.reload()}
                  style={{ background:'rgba(0,0,0,.08)', color:'#333' }}>
                  Play Again
                </button>
              </div>
            </div>
          )}

          {!gameOver && (
            <div className="mem-powerups">
              <div className="mem-powerup-wrap" style={{position:'relative'}}>
                <button className="mem-powerup" style={{ background:'linear-gradient(135deg,#3498db,#2980b9)' }}
                  onClick={handleHint} disabled={hintCount<=0||flippedIndices.length!==1||isChecking}>
                  <div className="mem-powerup-icon">🔍</div><div>Hint</div>
                  <div className="mem-powerup-badge">{hintCount}</div>
                </button>
                <div className="mem-powerup-tooltip">{flippedIndices.length!==1?'Select 1 card first':'Reveal matching card'}</div>
              </div>
              <div className="mem-powerup-wrap" style={{position:'relative'}}>
                <button className="mem-powerup" style={{ background:'linear-gradient(135deg,#27ae60,#229954)' }}
                  onClick={handleShuffle} disabled={shuffleCount<=0||isChecking}>
                  <div className="mem-powerup-icon">🔄</div><div>Shuffle</div>
                  <div className="mem-powerup-badge">{shuffleCount}</div>
                </button>
                <div className="mem-powerup-tooltip">Rearrange unmatched cards</div>
              </div>
            </div>
          )}
        </div>

        {showOverlay && (
          <div className="mem-overlay">
            <div style={{ animationName: overlayAnimOut || (settings.overlay_animation_in || 'memFlyFromBottom'), animationDuration:'.4s', animationFillMode:'both' }}>
              <div className="mem-overlay-card">
                {settings.overlay_image_url ? (
                  <img src={settings.overlay_image_url} alt="" style={{ maxWidth:'80vw', maxHeight:'50vh', borderRadius:16, boxShadow:'0 24px 64px rgba(0,0,0,.3)' }} />
                ) : (
                  <div className="mem-overlay-emoji">🎉</div>
                )}
                <div className="mem-overlay-title">{settings.heading_1 || 'Nice!'}</div>
                <div className="mem-overlay-sub">You found a match!</div>
                <button onClick={handleOverlayNext} className="mem-overlay-btn"
                  style={{ background: settings.primary_color || '#6366f1', color:'#fff', animation:'memNextBtnIn .3s ease .2s both' }}>
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}

        {popup && <div className="mem-popup">{popup}</div>}
      </div>
    )
  }

  return null
}
