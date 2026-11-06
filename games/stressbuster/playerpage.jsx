    import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../../apps/frontend/src/api'

function playSound(url) {
  if (!url) return
  try { new Audio(url).play().catch(() => {}) } catch {}
}

const GAME_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');

.sb-game *, .sb-game *::before, .sb-game *::after { box-sizing: border-box; margin: 0; padding: 0; }

.sb-game {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Poppins', sans-serif;
  padding: 24px 16px;
  position: relative;
  overflow: hidden;
}

.sb-game::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(ellipse at center, rgba(147,51,234,0.1) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(236,72,153,0.08) 0%, transparent 40%);
  pointer-events: none; z-index: 1;
}

.sb-game::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(30, 0, 60, 0.35);
  pointer-events: none; z-index: 0;
}

.sb-game-card {
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 32px;
  padding: 32px 24px;
  box-shadow: 0 25px 80px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.1),
              0 0 0 1px rgba(255,255,255,0.08);
  position: relative; z-index: 2;
  max-width: 420px; width: 100%;
}

.sb-game-logo {
  height: 52px; object-fit: contain;
  margin-bottom: 20px; border-radius: 12px;
  display: block; margin-left: auto; margin-right: auto;
}

.sb-game-heading { text-align: center; margin-bottom: 24px; }
.sb-game-heading h1 { font-size: 28px; font-weight: 900; color: #fff; margin: 0 0 6px 0; letter-spacing: -0.5px; }
.sb-game-heading p { font-size: 14px; color: rgba(255,255,255,0.5); margin: 0; }

.sb-stats-bar {
  display: flex; gap: 12px; margin-bottom: 24px;
}

.sb-stat-card {
  flex: 1; padding: 16px 12px; border-radius: 16px;
  text-align: center; position: relative; overflow: hidden;
  transition: transform 0.3s ease;
}
.sb-stat-card:hover { transform: translateY(-2px); }
.sb-stat-card.clicks-card { background: linear-gradient(135deg, #ec4899, #db2777); box-shadow: 0 8px 24px rgba(236,72,153,0.3); }
.sb-stat-card.health-card { background: linear-gradient(135deg, #22c55e, #16a34a); box-shadow: 0 8px 24px rgba(34,197,94,0.3); }
.sb-stat-card.timer-card { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 8px 24px rgba(245,158,11,0.3); }

.sb-stat-number { font-size: 36px; font-weight: 900; color: #1a1a1a; line-height: 1; margin-bottom: 4px; }
.sb-stat-label { font-size: 11px; font-weight: 700; color: rgba(26,26,26,0.7); text-transform: uppercase; letter-spacing: 1px; }

.sb-health-bar-wrap {
  width: 100%; height: 20px; background: rgba(255,255,255,0.15);
  border-radius: 50px; overflow: hidden; margin-bottom: 24px;
  border: 1px solid rgba(255,255,255,0.1);
}

.sb-health-bar {
  height: 100%; border-radius: 50px;
  transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
  position: relative; overflow: hidden;
}

.sb-health-bar::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%);
  border-radius: 50px;
}

.sb-health-text {
  text-align: center; font-size: 12px; font-weight: 700;
  color: rgba(255,255,255,0.7); margin-bottom: 20px;
}

.sb-tom-wrap {
  position: relative; width: 200px; height: 200px;
  margin: 0 auto 24px; cursor: pointer;
  transition: transform 0.1s ease;
  -webkit-tap-highlight-color: transparent;
  user-select: none; -webkit-user-select: none;
}

.sb-tom-wrap:active { transform: scale(0.95); }

.sb-tom-img {
  width: 100%; height: 100%; object-fit: contain;
  transition: filter 0.15s ease;
  filter: drop-shadow(0 8px 24px rgba(147,51,234,0.4));
}

.sb-tom-wrap:hover .sb-tom-img {
  filter: drop-shadow(0 12px 32px rgba(147,51,234,0.6)) brightness(1.05);
}

.sb-tom-wrap.hit .sb-tom-img {
  animation: sb-shake 0.3s ease;
}

@keyframes sb-shake {
  0%, 100% { transform: translateX(0) rotate(0); }
  20% { transform: translateX(-8px) rotate(-3deg); }
  40% { transform: translateX(8px) rotate(3deg); }
  60% { transform: translateX(-5px) rotate(-2deg); }
  80% { transform: translateX(5px) rotate(2deg); }
}

.sb-damage-num {
  position: absolute; top: 50%; left: 50%;
  font-size: 28px; font-weight: 900; color: #ef4444;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  pointer-events: none;
  animation: sb-damage-float 0.8s ease-out forwards;
  z-index: 10;
}

@keyframes sb-damage-float {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -120%) scale(1.5); }
}

.sb-start-btn {
  width: 100%; padding: 16px; border-radius: 50px;
  border: none; font-size: 17px; font-weight: 800;
  font-family: 'Poppins', sans-serif; cursor: pointer;
  transition: all 0.3s ease; text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sb-start-btn:hover { transform: translateY(-2px); }

.sb-btn-start {
  background: linear-gradient(135deg, #9333ea, #7e22ce);
  color: #fff;
  box-shadow: 0 6px 20px rgba(147,51,234,0.4);
}
.sb-btn-start:hover { box-shadow: 0 8px 28px rgba(147,51,234,0.6); }

.sb-popup-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 24px;
  animation: sb-fade-in 0.3s ease;
}

@keyframes sb-fade-in { from { opacity: 0; } to { opacity: 1; } }

.sb-popup-card {
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border-radius: 28px; padding: 40px 32px;
  max-width: 360px; width: 100%; text-align: center;
  box-shadow: 0 25px 80px rgba(0,0,0,0.4),
              inset 0 1px 0 rgba(255,255,255,0.12),
              0 0 0 1px rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.12);
  animation: sb-popup-pop 0.5s cubic-bezier(0.68,-0.55,0.265,1.55);
}

@keyframes sb-popup-pop {
  0% { transform: scale(0.6); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.sb-popup-emoji {
  font-size: 72px; margin-bottom: 16px;
  animation: sb-bounce 1s ease-in-out infinite;
}

@keyframes sb-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.sb-popup-title {
  font-size: 28px; font-weight: 900; color: #fff; margin-bottom: 8px;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #22c55e, #4ade80);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sb-popup-stats {
  display: flex; gap: 12px; justify-content: center; margin: 20px 0;
  flex-wrap: wrap;
}

.sb-popup-stat {
  background: rgba(255,255,255,0.1); border-radius: 12px;
  padding: 12px 20px; min-width: 100px;
  border: 1px solid rgba(255,255,255,0.1);
}

.sb-popup-stat-val { font-size: 22px; font-weight: 900; color: #fff; }
.sb-popup-stat-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }

.sb-popup-actions { display: flex; gap: 12px; justify-content: center; margin-top: 24px; flex-wrap: wrap; }

.sb-popup-btn {
  padding: 14px 32px; border-radius: 50px; border: none;
  font-size: 15px; font-weight: 700; font-family: 'Poppins', sans-serif;
  cursor: pointer; transition: all 0.3s ease; text-transform: uppercase;
  letter-spacing: 0.5px;
}
.sb-popup-btn:hover { transform: translateY(-2px); }

.sb-popup-btn.primary {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff; box-shadow: 0 6px 20px rgba(34,197,94,0.4);
}
.sb-popup-btn.secondary {
  background: rgba(255,255,255,0.1); color: #fff;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.15);
}

.sb-timer-badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 28px; border-radius: 50px;
  font-size: 15px; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 4px 20px rgba(245,158,11,0.4);
  margin-bottom: 20px;
  animation: sb-pulse 2s ease-in-out infinite;
}

@keyframes sb-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.sb-progress-text {
  text-align: center; font-size: 13px; font-weight: 700;
  color: rgba(255,255,255,0.6); margin-bottom: 16px;
}

.sb-tom-default {
  width: 160px; height: 160px;
  background: linear-gradient(135deg, rgba(147,51,234,0.3), rgba(236,72,153,0.3));
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 80px; line-height: 1;
  border: 4px solid rgba(255,255,255,0.2);
  box-shadow: 0 12px 40px rgba(147,51,234,0.3),
              inset 0 1px 0 rgba(255,255,255,0.2);
  transition: all 0.2s ease;
}

.sb-tom-wrap:hover .sb-tom-default {
  box-shadow: 0 16px 48px rgba(147,51,234,0.5),
              inset 0 1px 0 rgba(255,255,255,0.3);
  transform: scale(1.05);
}

.sb-tom-wrap.hit .sb-tom-default {
  animation: sb-shake 0.3s ease;
}

@media (max-width: 400px) {
  .sb-game-card { padding: 24px 16px; border-radius: 24px; }
  .sb-game-heading h1 { font-size: 24px; }
  .sb-tom-wrap { width: 160px; height: 160px; }
  .sb-stat-number { font-size: 28px; }
}
`

const DEFAULT_TOM_EMOJI = '\uD83D\uDC31'

export default function StressBusterPlayerPage({ gameData, sessionToken: initToken, sessionId: initSessionId, onSessionStart, onComplete, onLose }) {
  const settings = gameData?.settings || {}
  const soundMap = gameData?.soundMap || {}

  const maxClicks = settings.click_limit || 150
  const timerEnabled = settings.timer_enabled === 1 || settings.timer_enabled === true || settings.timer_enabled === undefined
  const showClickCount = settings.show_click_count === 1 || settings.show_click_count === true || settings.show_click_count === undefined

  const [phase, setPhase] = useState('start')
  const [clickCount, setClickCount] = useState(0)
  const [tomHealth, setTomHealth] = useState(maxClicks)
  const [timer, setTimer] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [sessionToken, setSessionToken] = useState(initToken)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [damages, setDamages] = useState([])
  const [hitKey, setHitKey] = useState(0)
  const [termsAgreed, setTermsAgreed] = useState(false)

  const timerRef = useRef(null)
  const gameResultRef = useRef({ clicks: 0, time: 0 })
  const damageIdRef = useRef(0)

  const resolveSound = (id) => {
    if (!id) return null
    const n = parseInt(id)
    return !isNaN(n) ? (soundMap[n] || null) : id
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  useEffect(() => {
    if (phase === 'playing' && timerEnabled) {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1)
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, timerEnabled])

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const startGame = async () => {
    let token = sessionToken
    if (!token) {
      try {
        const playerUser = JSON.parse(localStorage.getItem('playerUser') || '{}')
        const src = new URLSearchParams(window.location.search).get('source') === 'direct' ? 'direct' : 'link'
        const res = await api.post('/play/session/start', {
          game_id: gameData.id, player_data: {},
          source_type: src, promo_player_id: playerUser.id || null,
        })
        if (!res.data.success) {
          if (res.data.message === 'already_played') { setAlreadyPlayed(true); return }
          throw new Error(res.data.message)
        }
        token = res.data.session_token
        setSessionToken(token)
        if (onSessionStart) onSessionStart(token, res.data.session_id)
      } catch (err) {
        setErrorMsg(err.message || 'Could not start game')
        return
      }
    }
    setPhase('playing')
  }

  const handleTomClick = useCallback(() => {
    if (phase !== 'playing' || gameOver) return

    playSound(resolveSound(settings.sound_correct_id))

    const newCount = clickCount + 1
    const newHealth = tomHealth - 1
    setClickCount(newCount)
    setTomHealth(newHealth)
    setHitKey(k => k + 1)

    damageIdRef.current++
    const id = damageIdRef.current
    setDamages(prev => [...prev, { id, x: Math.random() * 60 - 30, y: -20 }])
    setTimeout(() => {
      setDamages(prev => prev.filter(d => d.id !== id))
    }, 800)

    if (newCount >= maxClicks) {
      endGame(newCount)
    }
  }, [phase, gameOver, clickCount, tomHealth, maxClicks, settings])

  const endGame = useCallback((finalClicks) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setGameOver(true)
    setPhase('result')
    const elapsed = timer
    gameResultRef.current = { clicks: finalClicks, time: elapsed }
    playSound(resolveSound(settings.win_sound_id))

    try {
      api.post('/play/session/complete', {
        session_token: sessionToken,
        score: finalClicks,
        player_data: {
          total_clicks: finalClicks,
          max_clicks: maxClicks,
          time_taken: elapsed,
          game_result: 'completed'
        },
      }).catch(() => {})
    } catch {}
  }, [timer, sessionToken, maxClicks, settings])

  const handleRetry = () => {
    setClickCount(0)
    setTomHealth(maxClicks)
    setTimer(0)
    setGameOver(false)
    setPhase('playing')
    setDamages([])
    gameResultRef.current = { clicks: 0, time: 0 }
  }

  const handleContinue = () => {
    if (onComplete) {
      onComplete({
        redirect_url: gameData?.redirect_url || null,
        session: { score: gameResultRef.current.clicks, total_scoreable: maxClicks }
      })
    }
  }

  const healthPct = Math.max(0, (tomHealth / maxClicks) * 100)
  const healthColor = healthPct > 60 ? '#22c55e' : healthPct > 30 ? '#f59e0b' : '#ef4444'

  const containerBgStyle = settings.bg_image_url
    ? { backgroundImage: `url(${settings.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    : { background: settings.bg_color || '#1e1b4b' }

  const fontFamily = settings.font_family ? `'${settings.font_family}', sans-serif` : "'Poppins', sans-serif"

  if (alreadyPlayed) return (
    <>
      <style>{GAME_STYLES}</style>
      <div className="sb-game" style={containerBgStyle}>
        <div className="sb-game-card">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{'\u274C'}</div>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Already Played!</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>You've already completed this game.</p>
          </div>
        </div>
      </div>
    </>
  )

  if (errorMsg) return (
    <>
      <style>{GAME_STYLES}</style>
      <div className="sb-game" style={containerBgStyle}>
        <div className="sb-game-card">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{'\u274C'}</div>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Error</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{errorMsg}</p>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{GAME_STYLES}</style>
      <div className="sb-game" style={{ ...containerBgStyle, fontFamily }}>
        <div className="sb-game-card">
          {settings.game_logo_url && (
            <img src={settings.game_logo_url} alt="Logo" className="sb-game-logo" />
          )}

          <div className="sb-game-heading">
            {settings.heading_1 && <h1 style={{ color: settings.heading_1_color || '#fff' }}>{settings.heading_1}</h1>}
            {settings.heading_2 && <p style={{ color: settings.heading_2_color || 'rgba(255,255,255,0.5)' }}>{settings.heading_2}</p>}
          </div>

          {phase === 'start' && (
            <div style={{ textAlign: 'center' }}>
              <div className="sb-tom-default" style={{ margin: '0 auto 20px' }}>{DEFAULT_TOM_EMOJI}</div>
              {settings.heading_3 && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 8 }}>{settings.heading_3}</p>}
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 20 }}>
                Click Tom {maxClicks} times to win!
                {timerEnabled && ' Beat the clock!'}
              </p>
              {settings.terms_enabled && (
                <div style={{ marginBottom: 16, textAlign: 'left', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} style={{ width: 14, height: 14 }} />
                    {settings.terms_url ? <a href={settings.terms_url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{settings.terms_text || 'Terms & Conditions'}</a> : <span>{settings.terms_text || 'Terms & Conditions'}</span>}
                  </label>
                </div>
              )}
              <button onClick={startGame} className="sb-start-btn sb-btn-start"
                disabled={!!settings.terms_enabled && !termsAgreed}
                style={{
                  color: settings.start_button_text_color || '#fff',
                  background: settings.start_button_bg_color || undefined,
                  opacity: (!!settings.terms_enabled && !termsAgreed) ? 0.5 : 1,
                  cursor: (!!settings.terms_enabled && !termsAgreed) ? 'not-allowed' : 'pointer',
                }}>
                {settings.start_button_text || 'Start Game'}
              </button>
            </div>
          )}

          {phase === 'playing' && (
            <>
              {showClickCount && (
                <div className="sb-stats-bar">
                  <div className="sb-stat-card clicks-card">
                    <div className="sb-stat-number">{clickCount}</div>
                    <div className="sb-stat-label">Clicks</div>
                  </div>
                  {timerEnabled && (
                    <div className="sb-stat-card timer-card">
                      <div className="sb-stat-number">{formatTime(timer)}</div>
                      <div className="sb-stat-label">Time</div>
                    </div>
                  )}
                </div>
              )}

              {!showClickCount && timerEnabled && (
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div className="sb-timer-badge">{formatTime(timer)}</div>
                </div>
              )}

              <div className="sb-health-bar-wrap">
                <div className="sb-health-bar" style={{ width: `${healthPct}%`, background: `linear-gradient(135deg, ${healthColor}, ${healthColor}cc)` }} />
              </div>
              <div className="sb-health-text">
                Health: {tomHealth} / {maxClicks}
              </div>

              <div className="sb-progress-text">
                {showClickCount && `${clickCount} / ${maxClicks} clicks`}
                {showClickCount && timerEnabled && ' - '}
                {timerEnabled && `${formatTime(timer)}`}
              </div>

              <div
                key={hitKey}
                className={`sb-tom-wrap ${hitKey > 0 ? 'hit' : ''}`}
                onClick={handleTomClick}
              >
                {settings.o_image_url ? (
                  <img src={settings.o_image_url} alt="Tom" className="sb-tom-img" />
                ) : (
                  <div className="sb-tom-default">{DEFAULT_TOM_EMOJI}</div>
                )}
                {damages.map(d => (
                  <div key={d.id} className="sb-damage-num" style={{ left: `calc(50% + ${d.x}px)`, top: `calc(50% + ${d.y}px)` }}>-1</div>
                ))}
              </div>

              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Tap Tom to deal damage!</p>
            </>
          )}
        </div>

        {phase === 'result' && (
          <div className="sb-popup-overlay">
            <div className="sb-popup-card">
              <div className="sb-popup-emoji">{'\uD83C\uDF89'}</div>
              <div className="sb-popup-title">TOM DEFEATED!</div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 8 }}>
                {settings.custom_win_msg || 'You dealt all the damage!'}
              </p>
              <div className="sb-popup-stats">
                <div className="sb-popup-stat">
                  <div className="sb-popup-stat-val">{gameResultRef.current.clicks}</div>
                  <div className="sb-popup-stat-lbl">Total Clicks</div>
                </div>
                {timerEnabled && (
                  <div className="sb-popup-stat">
                    <div className="sb-popup-stat-val">{formatTime(gameResultRef.current.time)}</div>
                    <div className="sb-popup-stat-lbl">Time Taken</div>
                  </div>
                )}
              </div>
              <div className="sb-popup-actions">
                <button onClick={handleRetry} className="sb-popup-btn secondary"
                  style={{
                    color: settings.try_again_text_color || '#fff',
                    background: settings.try_again_bg_color || 'rgba(255,255,255,0.1)',
                    border: settings.try_again_bg_color ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  }}>
                  {settings.try_again_btn_text || 'Try Again'}
                </button>
                <button onClick={handleContinue} className="sb-popup-btn primary"
                  style={{
                    color: settings.continue_btn_text_color || '#fff',
                    background: settings.continue_btn_bg_color || undefined,
                    boxShadow: settings.continue_btn_bg_color ? `0 6px 20px ${settings.continue_btn_bg_color}66` : undefined,
                  }}>
                  {settings.continue_btn_text || 'Continue'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}