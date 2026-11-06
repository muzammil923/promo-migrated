import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../../apps/frontend/src/api'

function playSound(url) { if (!url) return; try { const a = new Audio(url); a.play().catch(() => {}) } catch {} }

const SPEED_MAP = { slow: 800, medium: 500, fast: 300 }

const DEFAULT_COLORS = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899']

export default function SimonPlayerPage({ gameData, sessionToken, onComplete }) {
  const settings = gameData?.settings || {}
  const soundMapRef = useRef(gameData?.soundMap || {})
  const resolveSound = useCallback((id) => { if (!id) return null; const n = parseInt(id); return isNaN(n) ? id : (soundMapRef.current[n] || null) }, [])
  const [formData, setFormData] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [termsAgreed, setTermsAgreed] = useState(false)

  const numColors = Math.min(Math.max(parseInt(settings.num_colors) || 4, 3), 6)
  const colors = [settings.color_1, settings.color_2, settings.color_3, settings.color_4, settings.color_5, settings.color_6]
    .slice(0, numColors).map((c, i) => c || DEFAULT_COLORS[i])
  const maxRounds = parseInt(settings.num_rounds) || 8
  const speed = SPEED_MAP[settings.speed] || 500

  const [phase, setPhase] = useState('intro')
  const [sequence, setSequence] = useState([])
  const [playerInput, setPlayerInput] = useState([])
  const [currentRound, setCurrentRound] = useState(0)
  const [activePad, setActivePad] = useState(-1)
  const [isShowingSequence, setIsShowingSequence] = useState(false)
  const [score, setScore] = useState(0)
  const [message, setMessage] = useState('')
  const [timer, setTimer] = useState(0)
  const completedRef = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const font = settings.font_family
    if (!font || font === 'DM Sans') return
    const id = 'gf-' + font.replace(/\s/g, '-')
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(font) + ':wght@400;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [settings.font_family])

  useEffect(() => {
    if (phase === 'playing' && settings.show_timer && settings.time_limit_seconds > 0 && !isShowingSequence) {
      setTimer(settings.time_limit_seconds)
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); handleGameOver(); return 0 }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [phase, isShowingSequence])

  const addToSequence = useCallback(() => {
    const next = Math.floor(Math.random() * numColors)
    setSequence(prev => [...prev, next])
  }, [numColors])

  const showSequence = useCallback((seq) => {
    setIsShowingSequence(true)
    setMessage('Watch carefully...')
    let i = 0
    const interval = setInterval(() => {
      if (i < seq.length) {
        setActivePad(seq[i])
        playSound(resolveSound(settings[`color_${seq[i]+1}_sound_id`]))
        setTimeout(() => setActivePad(-1), speed * 0.6)
        i++
      } else {
        clearInterval(interval)
        setIsShowingSequence(false)
        setMessage('Your turn!')
        setPlayerInput([])
      }
    }, speed)
  }, [speed, resolveSound, settings])

  const validateField = (value, fieldType, isRequired) => {
    if (isRequired && !value.trim()) return 'This field is required'
    if (!value.trim()) return ''
    if (fieldType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address'
    if (fieldType === 'phone') { const digits = value.replace(/[\s\-()]/g, '').replace(/^\+?91/, ''); if (!/^\d{10}$/.test(digits)) return 'Enter a valid 10-digit phone number' }
    return ''
  }

  const handleStartIntro = () => {
    const errors = {}
    for (const f of (gameData?.formFields || [])) {
      errors[f.field_label] = validateField(formData[f.field_label] || '', f.field_type, f.is_required)
    }
    if (settings.terms_enabled === 1 && !termsAgreed) errors._terms = 'Accept terms & conditions'
    if (Object.keys(errors).some(k => errors[k])) { setFormErrors(errors); return }
    startGame()
  }

  const startGame = () => {
    setPhase('playing')
    setScore(0)
    setSequence([])
    setPlayerInput([])
    setCurrentRound(0)
    completedRef.current = false
    setTimeout(() => {
      const first = Math.floor(Math.random() * numColors)
      const newSeq = [first]
      setSequence(newSeq)
      setCurrentRound(1)
      setTimeout(() => showSequence(newSeq), 600)
    }, 400)
  }

  const handlePadTap = (idx) => {
    if (isShowingSequence || phase !== 'playing') return
    const newInput = [...playerInput, idx]
    setPlayerInput(newInput)
    setActivePad(idx)
    setTimeout(() => setActivePad(-1), 200)
    playSound(resolveSound(settings[`color_${idx+1}_sound_id`]))

    const roundNum = sequence.length
    if (idx !== sequence[newInput.length - 1]) {
      handleGameOver()
      return
    }

    if (newInput.length === sequence.length) {
      clearInterval(timerRef.current)
      const newScore = score + roundNum
      setScore(newScore)
      if (roundNum >= maxRounds) {
        handleWin(newScore)
      } else {
        setMessage('Correct! Next round...')
        setTimeout(() => {
          const next = Math.floor(Math.random() * numColors)
          const newSeq = [...sequence, next]
          setSequence(newSeq)
          setCurrentRound(roundNum + 1)
          setPlayerInput([])
          setTimeout(() => showSequence(newSeq), 600)
        }, 1000)
      }
    }
  }

  const handleGameOver = () => {
    clearInterval(timerRef.current)
    setPhase('lost')
    setMessage(`Game Over! Score: ${score}`)
    playSound(resolveSound(settings.sound_gameover_id))
    completeSession(score)
  }

  const handleWin = (finalScore) => {
    clearInterval(timerRef.current)
    setPhase('won')
    setMessage(`You won! Score: ${finalScore}`)
    playSound(resolveSound(settings.sound_correct_id))
    completeSession(finalScore)
  }

  const completeSession = async (finalScore) => {
    if (completedRef.current) return
    completedRef.current = true
    try {
      await api.post('/play/session/complete', {
        session_token: sessionToken,
        score: finalScore,
        answers: [{ question_id: 0, is_correct: 1 }]
      })
    } catch {}
  }

  const hasBg = settings.bg_image_url
  const bgStyle = hasBg ? `url(${settings.bg_image_url}) center/cover` : (settings.bg_color || '#1a1a2e')

  if (phase === 'intro') {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:bgStyle, fontFamily: settings.font_family ? `'${settings.font_family}', sans-serif` : "'DM Sans', sans-serif", padding:20 }}>
        <div style={{ maxWidth:400, width:'100%', background:'rgba(255,255,255,0.08)', backdropFilter:'blur(20px)', borderRadius:24, padding:'32px 24px', textAlign:'center', border:'1px solid rgba(255,255,255,0.12)', boxShadow:'0 16px 64px rgba(0,0,0,0.3)' }}>
          {settings.game_logo_url && <img src={settings.game_logo_url} alt="" style={{ maxWidth:'100%', maxHeight:80, objectFit:'contain', borderRadius:8, marginBottom:16 }} />}
          <h1 style={{ fontSize:28, fontWeight:800, color: settings.heading_1_color||'#fff', marginBottom:8, lineHeight:1.2 }}>{settings.heading_1 || 'Simon Says'}</h1>
          {settings.heading_2 && <p style={{ fontSize:16, color: settings.heading_2_color||'#aaa', marginBottom:8 }}>{settings.heading_2}</p>}
          {settings.heading_3 && <p style={{ fontSize:13, color: settings.heading_3_color||'#888', marginBottom:16 }}>{settings.heading_3}</p>}
          {settings.description_text && <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:12, padding:'10px 14px', marginBottom:16, fontSize:13, color: settings.description_color||'#aaa', lineHeight:1.5 }}>{settings.description_text}</div>}
          <div style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:20, fontSize:12, color:'#888' }}>
            <div><span style={{ fontWeight:700, color:'#fff', fontSize:18 }}>{maxRounds}</span><br/>Rounds</div>
            <div><span style={{ fontWeight:700, color:'#fff', fontSize:18 }}>{numColors}</span><br/>Colors</div>
          </div>
          {gameData?.game_type !== 'promogames' && gameData?.formFields?.map((f,i) => (
            <div key={i} style={{ marginBottom:10, textAlign:'left' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.7)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>{f.field_label}{f.is_required ? '*' : ''}</div>
              <input type={f.field_type === 'email' ? 'email' : f.field_type === 'phone' ? 'tel' : f.field_type === 'number' ? 'number' : 'text'} placeholder={f.field_label} value={formData[f.field_label] || ''}
                onChange={e => {
                  const v = e.target.value
                  let nv = v
                  if (f.field_type === 'phone') nv = v.replace(/[^\d+\s\-()]/g, '')
                  setFormData({ ...formData, [f.field_label]: nv })
                  setFormErrors({ ...formErrors, [f.field_label]: validateField(nv, f.field_type, f.is_required) })
                }}
                onBlur={() => setFormErrors({ ...formErrors, [f.field_label]: validateField(formData[f.field_label] || '', f.field_type, f.is_required) })}
                style={{ width:'100%', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'10px 12px', fontSize:14, color:'#fff', outline:'none' }} />
              {formErrors[f.field_label] && <div style={{ fontSize:11, color:'#ef4444', marginTop:4 }}>{formErrors[f.field_label]}</div>}
            </div>
          ))}
          {settings.terms_enabled === 1 && (
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'rgba(255,255,255,0.6)', cursor:'pointer' }}>
                <input type="checkbox" checked={termsAgreed} onChange={e => { setTermsAgreed(e.target.checked); setFormErrors({ ...formErrors, _terms:'' }) }} style={{ width:14, height:14 }} />
                {settings.terms_url ? <a href={settings.terms_url} target="_blank" rel="noopener noreferrer" style={{ color: settings.primary_color||'#6366f1', textDecoration:'underline' }}>{settings.terms_text || 'Terms & Conditions'}</a> : <span>{settings.terms_text || 'Terms & Conditions'}</span>}
              </label>
              {formErrors._terms && <div style={{ fontSize:11, color:'#ef4444', marginTop:4 }}>{formErrors._terms}</div>}
            </div>
          )}
          <button onClick={handleStartIntro} disabled={!!(settings.terms_enabled === 1 && !termsAgreed)} style={{ width:'100%', padding:'14px', background: settings.start_button_bg_color || `linear-gradient(135deg, ${settings.primary_color||'#6366f1'}, ${(settings.primary_color||'#6366f1')}cc)`, color: settings.start_button_text_color||'#fff', border:'none', borderRadius:12, fontSize:16, fontWeight:700, cursor:(settings.terms_enabled === 1 && !termsAgreed) ? 'not-allowed' : 'pointer', opacity:(settings.terms_enabled === 1 && !termsAgreed) ? 0.5 : 1, boxShadow:`0 6px 24px ${(settings.primary_color||'#6366f1')}44` }}>
            {settings.start_button_text || 'Start Game →'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:bgStyle, fontFamily: settings.font_family ? `'${settings.font_family}', sans-serif` : "'DM Sans', sans-serif", padding:20 }}>
      <div style={{ maxWidth:400, width:'100%', background:'rgba(255,255,255,0.08)', backdropFilter:'blur(20px)', borderRadius:24, padding:'24px 20px', textAlign:'center', border:'1px solid rgba(255,255,255,0.12)', boxShadow:'0 16px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:12, color:'#888' }}>Round <span style={{ fontWeight:700, color:'#fff', fontSize:16 }}>{currentRound}</span> / {maxRounds}</div>
          <div style={{ fontSize:12, color:'#888' }}>Score <span style={{ fontWeight:700, color:'#fff', fontSize:16 }}>{score}</span></div>
          {settings.show_timer && settings.time_limit_seconds > 0 && (
            <div style={{ fontSize:12, color: timer < 10 ? '#ef4444' : '#888' }}>⏱ {timer}s</div>
          )}
        </div>

        {message && (
          <div style={{ fontSize:14, fontWeight:600, color: phase === 'lost' ? '#ef4444' : phase === 'won' ? '#22c55e' : '#aaa', marginBottom:16 }}>
            {message}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns: numColors <= 4 ? '1fr 1fr' : '1fr 1fr 1fr', gap:8, maxWidth:280, margin:'0 auto 20px' }}>
          {colors.map((c, i) => {
            const isActive = activePad === i
            const isPlayerTurn = playerInput.includes(i) && !isShowingSequence
            return (
              <button key={i} onClick={() => handlePadTap(i)} disabled={phase !== 'playing' || isShowingSequence}
                style={{
                  aspectRatio:'1', borderRadius: numColors <= 4 ? '50%' : '16px',
                  background: isActive ? c : `${c}66`,
                  border: `3px solid ${isActive ? '#fff' : 'transparent'}`,
                  boxShadow: isActive ? `0 0 30px ${c}88, inset 0 0 20px rgba(255,255,255,0.3)` : 'none',
                  cursor: phase === 'playing' && !isShowingSequence ? 'pointer' : 'default',
                  transition:'all 0.15s ease',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  opacity: phase === 'lost' ? 0.5 : 1,
                }} />
            )
          })}
        </div>

        {(phase === 'won' || phase === 'lost') && (
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>{phase === 'won' ? '🎉' : '😢'}</div>
            <p style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:16 }}>{phase === 'won' ? 'Congratulations!' : 'Game Over!'}</p>
            <button onClick={() => { completedRef.current = false; setPhase('intro'); setSequence([]); setPlayerInput([]); setScore(0); setCurrentRound(0); setMessage(''); }}
              style={{ padding:'12px 24px', background: settings.primary_color||'#6366f1', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', marginRight:8 }}>
              Play Again
            </button>
            <button onClick={() => onComplete?.({ redirect_url: settings.redirect_url })}
              style={{ padding:'12px 24px', background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
              {settings.continue_button_text || 'Continue →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
