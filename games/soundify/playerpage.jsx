import { useState, useEffect, useRef, useCallback } from 'react'
import WaveformPlayer from '../../apps/frontend/src/pages/WaveformPlayer'
import api from '../../apps/frontend/src/api'

function playSound(url) {
  if (!url) return
  try { new Audio(url).play().catch(() => {}) } catch {}
}

const S = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
.sf-g*,.sf-g*::before,.sf-g*::after{box-sizing:border-box;margin:0;padding:0}
.sf-g{min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Poppins',sans-serif;padding:24px 16px;position:relative;overflow:hidden}
.sf-g::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(ellipse at center,rgba(139,92,246,.12) 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,rgba(168,85,247,.08) 0%,transparent 40%);pointer-events:none;z-index:1}
.sf-g::after{content:'';position:absolute;inset:0;background:rgba(30,0,60,.35);pointer-events:none;z-index:0}
.sf-gc{background:rgba(255,255,255,.08);backdrop-filter:blur(20px);border-radius:32px;padding:32px 24px;box-shadow:0 25px 80px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.1),0 0 0 1px rgba(255,255,255,.08);position:relative;z-index:2;max-width:420px;width:100%}
.sf-gl{height:52px;object-fit:contain;margin-bottom:20px;border-radius:12px;display:block;margin-left:auto;margin-right:auto}
.sf-gh{text-align:center;margin-bottom:24px}.sf-gh h1{font-size:28px;font-weight:900;color:#fff;margin:0 0 6px 0}.sf-gh p{font-size:14px;color:rgba(255,255,255,.5);margin:0}
.sf-sb{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}
.sf-sc{flex:1;min-width:90px;padding:14px 10px;border-radius:16px;text-align:center;overflow:hidden}
.sf-sc.cc{background:linear-gradient(135deg,#8b5cf6,#7c3aed);box-shadow:0 8px 24px rgba(139,92,246,.3)}
.sf-sc.tc{background:linear-gradient(135deg,#f59e0b,#d97706);box-shadow:0 8px 24px rgba(245,158,11,.3)}
.sf-sc.sc2{background:linear-gradient(135deg,#22c55e,#16a34a);box-shadow:0 8px 24px rgba(34,197,94,.3)}
.sf-sc.sc3{background:linear-gradient(135deg,#ef4444,#dc2626);box-shadow:0 8px 24px rgba(239,68,68,.3)}
.sf-sn{font-size:28px;font-weight:900;color:#1a1a1a;line-height:1;margin-bottom:4px}
.sf-sl{font-size:10px;font-weight:700;color:rgba(26,26,26,.7);text-transform:uppercase;letter-spacing:1px}
.sf-song-info{text-align:center;margin-bottom:16px}
.sf-song-title{font-size:14px;color:rgba(255,255,255,.4);margin-bottom:8px}
.sf-timer-badge{display:inline-flex;align-items:center;gap:6px;padding:10px 24px;border-radius:50px;font-size:14px;font-weight:700;color:#fff;background:linear-gradient(135deg,#f59e0b,#d97706);box-shadow:0 4px 20px rgba(245,158,11,.4);margin-bottom:20px}
.sf-audio-wrap{width:100%;margin-bottom:20px;display:flex;justify-content:center}
.sf-audio-wrap audio{width:100%;max-width:380px;height:40px;border-radius:20px}
.sf-opts{display:flex;flex-direction:column;gap:10px}
.sf-opt{width:100%;padding:16px 20px;border-radius:16px;border:2px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);color:#fff;font-size:15px;font-weight:600;font-family:'Poppins',sans-serif;cursor:pointer;transition:all .2s ease;text-align:left;position:relative;overflow:hidden;-webkit-tap-highlight-color:transparent}
.sf-opt:hover{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.3);transform:translateY(-1px)}
.sf-opt:active{transform:scale(.98)}
.sf-opt.correct{background:linear-gradient(135deg,#22c55e,#16a34a);border-color:#22c55e;color:#fff;box-shadow:0 4px 20px rgba(34,197,94,.4)}
.sf-opt.wrong{background:linear-gradient(135deg,#ef4444,#dc2626);border-color:#ef4444;color:#fff;box-shadow:0 4px 20px rgba(239,68,68,.4);opacity:.7}
.sf-opt.disabled{pointer-events:none;opacity:.6}
.sf-sbtn{width:100%;padding:16px;border-radius:50px;border:none;font-size:17px;font-weight:800;font-family:'Poppins',sans-serif;cursor:pointer;transition:all .3s ease;text-transform:uppercase;letter-spacing:.5px}
.sf-sbtn:hover{transform:translateY(-2px)}
.sf-sbtn.go{background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;box-shadow:0 6px 20px rgba(139,92,246,.4)}
.sf-po{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:24px;animation:fi .3s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}
.sf-pcc{background:rgba(255,255,255,.08);backdrop-filter:blur(24px);border-radius:28px;padding:36px 28px;max-width:400px;width:100%;text-align:center;box-shadow:0 25px 80px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.12);animation:pp .5s cubic-bezier(.68,-.55,.265,1.55)}
@keyframes pp{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}
.sf-pe{font-size:64px;margin-bottom:12px;animation:bc 1s ease-in-out infinite}
@keyframes bc{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.sf-pt{font-size:24px;font-weight:900;margin-bottom:8px}
.sf-pt.w{background:linear-gradient(135deg,#22c55e,#4ade80);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.sf-pt.l{background:linear-gradient(135deg,#f59e0b,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.sf-ps{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}
.sf-psi{background:rgba(255,255,255,.1);border-radius:12px;padding:12px 14px;border:1px solid rgba(255,255,255,.1)}
.sf-psv{font-size:18px;font-weight:900;color:#fff}
.sf-psl{font-size:9px;font-weight:600;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.sf-pa{display:flex;gap:12px;justify-content:center;margin-top:20px}
.sf-pb{padding:14px 28px;border-radius:50px;border:none;font-size:14px;font-weight:700;font-family:'Poppins',sans-serif;cursor:pointer;transition:all .3s ease;text-transform:uppercase;letter-spacing:.5px}
.sf-pb:hover{transform:translateY(-2px)}
.sf-pb.p{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;box-shadow:0 6px 20px rgba(34,197,94,.4)}
.sf-pb.s{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.15)}
.sf-feedback{position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:12px;font-size:16px;font-weight:700;color:#fff;z-index:100;animation:fbIn .3s ease}
@keyframes fbIn{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.sf-progress{width:100%;height:4px;background:rgba(255,255,255,.15);border-radius:50px;margin-bottom:16px;overflow:hidden}
.sf-progress-bar{height:100%;border-radius:50px;transition:width .3s ease;background:linear-gradient(90deg,#8b5cf6,#a78bfa)}
.sf-next-btn{width:100%;padding:14px;border-radius:50px;border:none;font-size:15px;font-weight:700;font-family:'Poppins',sans-serif;cursor:pointer;transition:all .3s ease;margin-top:16px;text-transform:uppercase;letter-spacing:.5px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;box-shadow:0 4px 16px rgba(139,92,246,.3)}
.sf-next-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(139,92,246,.5)}
.sf-wave-wrap{width:100%;padding:0 4px;margin-bottom:16px}
.sf-wave-wrap audio{display:none}
#sf-waveform{width:100%}
#sf-waveform wave{overflow:hidden!important}
#sf-waveform [data-decoration="played"]{border-radius:1px}
#sf-waveform [data-decoration="cursor"]{display:none}
@media(max-width:400px){.sf-gc{padding:24px 16px;border-radius:24px}.sf-gh h1{font-size:24px}.sf-sn{font-size:24px}}
`

export default function SoundifyPlayerPage({ gameData, sessionToken: initToken, sessionId, onSessionStart, onComplete }) {
  const st = gameData?.settings || {}
  const sm = gameData?.soundMap || {}
  const songList = gameData?.songs || []
  const totalTime = Number(st.time_per_question) || 30

  const [phase, setPhase] = useState('start')
  const [currentSong, setCurrentSong] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(totalTime)
  const [sessionToken, setSessionToken] = useState(initToken)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [audioReady, setAudioReady] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [audioIsPlaying, setAudioIsPlaying] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)

  const timerRef = useRef(null)
  const audioRef = useRef(null)
  const resultRef = useRef({ correct: 0, total: 0 })
  const optsRef = useRef(null)
  const replayTimeoutRef = useRef(null)
  const playCountRef = useRef(0)
  const answeredRef = useRef(false)
  const currentSongRef = useRef(0)
  currentSongRef.current = currentSong

  const rs = id => { if (!id) return null; const n = parseInt(id); return !isNaN(n) ? (sm[n] || null) : id }

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setAudioIsPlaying(false)
    setAudioCurrentTime(0)
  }, [])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); stopAudio() }
  }, [stopAudio])

  const startTimer = useCallback(() => {
    setTimer(totalTime)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [totalTime])

  useEffect(() => {
    if (phase !== 'playing' || answered) return
    console.log('QUESTION_LOADED')
    setAudioReady(false)
    setAudioDuration(0)
    setAudioCurrentTime(0)
    setAudioIsPlaying(false)
    playCountRef.current = 0
    answeredRef.current = false
    if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    const t = setTimeout(() => {
      console.log('OPTIONS_VISIBLE')
      setTimeout(() => {
        console.log('AUDIO_AUTOPLAY_STARTED')
        setAudioReady(true)
        startTimer()
      }, 1000)
    }, 1000)
    return () => { clearTimeout(t); if (timerRef.current) clearInterval(timerRef.current); if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current) }
  }, [phase, currentSong, answered, startTimer])

  useEffect(() => {
    if (audioReady && audioRef.current) {
      playCountRef.current++
      audioRef.current.play().catch(() => {})
    }
  }, [audioReady])

  const startGame = async () => {
    console.log('START_CLICKED')
    let token = sessionToken
    if (!token) {
      try {
        const pu = JSON.parse(localStorage.getItem('playerUser') || '{}')
        const src = new URLSearchParams(window.location.search).get('source') === 'direct' ? 'direct' : 'link'
        const res = await api.post('/play/session/start', { game_id: gameData.id, player_data: {}, source_type: src, promo_player_id: pu.id || null })
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
    setCurrentSong(0)
    setScore(0)
    resultRef.current = { correct: 0, total: songList.length }
  }

  const handleOptionSelect = useCallback((optIdx) => {
    if (answered) return
    if (timerRef.current) clearInterval(timerRef.current)
    if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current)
    stopAudio()
    answeredRef.current = true
    setAnswered(true)

    const song = songList[currentSong]
    if (!song) return

    const correctIdx = song.correct_option
    const isCorrect = optIdx === correctIdx

    if (isCorrect) {
      playSound(rs(st.sound_correct_id))
      setScore(prev => prev + 1)
      resultRef.current.correct++
      setFeedback({ type: 'correct', text: 'Correct!' })
    } else {
      playSound(rs(st.sound_wrong_id))
      setFeedback({ type: 'wrong', text: optIdx === null ? 'Time\'s up!' : 'Wrong answer!' })
    }

    setSelectedOption(optIdx)

    try {
      api.post('/play/session/answer', {
        session_token: sessionToken,
        question_id: song.id,
        option_id: optIdx,
        is_correct: isCorrect,
        question_type: 'soundify'
      }).catch(() => {})
    } catch {}
  }, [answered, currentSong, songList, sessionToken, st])

  useEffect(() => {
    if (timer === 0 && phase === 'playing' && !answered) {
      handleOptionSelect(null)
    }
  }, [timer, phase, answered, handleOptionSelect])

  const endGame = useCallback(() => {
    const finalScore = resultRef.current.correct
    const total = resultRef.current.total

    if (finalScore / total >= 0.5) {
      playSound(rs(st.win_sound_id))
    } else {
      playSound(rs(st.lose_sound_id))
    }

    try {
      api.post('/play/session/complete', {
        session_token: sessionToken,
        score: finalScore,
        player_data: {
          correct_answers: finalScore,
          total_songs: total,
          game_result: finalScore / total >= 0.5 ? 'WIN' : 'TRY_AGAIN',
        }
      }).catch(() => {})
    } catch {}

    setPhase('result')
  }, [sessionToken, st])

  const handleNext = useCallback(() => {
    setFeedback(null)
    setSelectedOption(null)
    setAnswered(false)
    answeredRef.current = false
    stopAudio()
    if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current)
    playCountRef.current = 0

    if (currentSong + 1 >= songList.length) {
      endGame()
    } else {
      setCurrentSong(prev => prev + 1)
    }
  }, [currentSong, songList.length, stopAudio, endGame])

  const handleRetry = () => {
    setCurrentSong(0)
    setSelectedOption(null)
    setAnswered(false)
    answeredRef.current = false
    setScore(0)
    setFeedback(null)
    stopAudio()
    if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current)
    playCountRef.current = 0
    resultRef.current = { correct: 0, total: songList.length }
    setPhase('playing')
  }

  const handleContinue = () => {
    if (onComplete) {
      onComplete({
        redirect_url: gameData?.redirect_url || null,
        session: { score: resultRef.current.correct, total_scoreable: songList.length }
      })
    }
  }

  const bg = st.bg_image_url
    ? { backgroundImage: `url(${st.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    : { background: st.bg_color || '#1e1b4b' }
  const ff = st.font_family ? `'${st.font_family}',sans-serif` : "'Poppins',sans-serif"

  if (alreadyPlayed) return <><style>{S}</style><div className="sf-g" style={bg}><div className="sf-gc"><div style={{textAlign:'center',padding:'40px 20px'}}><div style={{fontSize:56,marginBottom:16}}>{"\u274C"}</div><h2 style={{color:'#fff',fontSize:24,fontWeight:800,margin:'0 0 8px'}}>Already Played!</h2><p style={{color:'rgba(255,255,255,.6)',fontSize:14}}>You've already completed this game.</p></div></div></div></>
  if (errorMsg) return <><style>{S}</style><div className="sf-g" style={bg}><div className="sf-gc"><div style={{textAlign:'center',padding:'40px 20px'}}><div style={{fontSize:56,marginBottom:16}}>{"\u274C"}</div><h2 style={{color:'#fff',fontSize:24,fontWeight:800,margin:'0 0 8px'}}>Error</h2><p style={{color:'rgba(255,255,255,.6)',fontSize:14}}>{errorMsg}</p></div></div></div></>

  return (<><style>{S}</style>
  <div className="sf-g" style={{...bg,fontFamily:ff}}>
    {feedback && (
      <div className="sf-feedback" style={{
        background: feedback.type === 'correct' ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#ef4444,#dc2626)',
      }}>
        {feedback.text}
      </div>
    )}

    <div className="sf-gc">
      {st.game_logo_url && <img src={st.game_logo_url} alt="Logo" className="sf-gl"/>}
      <div className="sf-gh">
        {st.heading_1 && <h1 style={{color:st.heading_1_color||'#fff'}}>{st.heading_1}</h1>}
        {st.heading_2 && <p style={{color:st.heading_2_color||'rgba(255,255,255,.5)'}}>{st.heading_2}</p>}
      </div>

      {phase==='start' && <div style={{textAlign:'center'}}>
        <div style={{width:120,height:120,borderRadius:'50%',background:'linear-gradient(135deg,rgba(139,92,246,.3),rgba(168,85,247,.3))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:60,border:'4px solid rgba(255,255,255,.2)',boxShadow:'0 12px 40px rgba(139,92,246,.3)',margin:'0 auto 20px'}}>
          {"\uD83C\uDFB5"}
        </div>
        {st.heading_3 && <p style={{color:'rgba(255,255,255,.5)',fontSize:13,marginBottom:8}}>{st.heading_3}</p>}
        <p style={{color:'rgba(255,255,255,.4)',fontSize:12,marginBottom:20}}>
          Listen to {songList.length} songs and guess the correct answer!
        </p>
        {!!st.terms_enabled && (st.terms_text || st.terms_url) && (
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:16, textAlign:'left' }}>
            <div onClick={() => setTermsAgreed(!termsAgreed)} style={{ width:22, height:22, flexShrink:0, marginTop:2, border:`2px solid ${termsAgreed?'#8b5cf6':'rgba(255,255,255,.3)'}`, borderRadius:5, background:termsAgreed?'#8b5cf6':'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}>
              {termsAgreed && <span style={{color:'#fff',fontSize:12,fontWeight:700}}>✓</span>}
            </div>
            <span style={{fontSize:13,color:'rgba(255,255,255,.6)',lineHeight:1.5}}>
              I agree to the{' '}
              {st.terms_url ? <a href={st.terms_url} target="_blank" rel="noopener noreferrer" style={{color:'#8b5cf6',fontWeight:600,textDecoration:'underline'}}>{st.terms_text||'Terms & Conditions'}</a> : <span style={{color:'#8b5cf6',fontWeight:600}}>{st.terms_text||'Terms & Conditions'}</span>}
            </span>
          </div>
        )}
        <button onClick={startGame} className="sf-sbtn go" disabled={!!st.terms_enabled && !termsAgreed} style={{color:st.start_button_text_color||'#fff',background:st.start_button_bg_color||undefined, opacity:(!!st.terms_enabled && !termsAgreed)?0.5:1}}>
          {st.start_button_text||'Start Game'}
        </button>
      </div>}

      {phase==='playing' && <>
        <div className="sf-progress">
          <div className="sf-progress-bar" style={{width:`${((currentSong+1)/songList.length)*100}%`}} />
        </div>

        <div className="sf-sb">
          <div className="sf-sc cc"><div className="sf-sn">{currentSong+1}/{songList.length}</div><div className="sf-sl">Song</div></div>
          <div className="sf-sc tc"><div className="sf-sn">{timer}s</div><div className="sf-sl">Time</div></div>
          <div className="sf-sc sc2"><div className="sf-sn">{score}</div><div className="sf-sl">Score</div></div>
        </div>

        <div className="sf-song-info">
          <div style={{fontSize:36,marginBottom:8}}>{"\uD83C\uDFB5"}</div>
          <div style={{color:'rgba(255,255,255,.5)',fontSize:12}}>Listen carefully and pick the correct answer</div>
        </div>

        {songList[currentSong] && (
          <>
            <audio
              ref={el => {
                if (el) {
                  audioRef.current = el
                  const newSrc = songList[currentSong].song_url
                  if (el.getAttribute('data-src') !== newSrc) {
                    el.src = newSrc
                    el.setAttribute('data-src', newSrc)
                  }
                }
              }}
              onLoadedMetadata={() => { if (audioRef.current) setAudioDuration(audioRef.current.duration) }}
              onTimeUpdate={() => { if (audioRef.current) setAudioCurrentTime(audioRef.current.currentTime) }}
              onPlay={() => setAudioIsPlaying(true)}
              onPause={() => setAudioIsPlaying(false)}
              onEnded={() => {
                setAudioIsPlaying(false)
                setAudioCurrentTime(0)
                const maxPlays = 1 + (st.max_sound_replays ?? 1)
                if (playCountRef.current < maxPlays && !answeredRef.current) {
                  replayTimeoutRef.current = setTimeout(() => {
                    if (!answeredRef.current && audioRef.current) {
                      audioRef.current.currentTime = 0
                      audioRef.current.play().catch(() => {})
                      playCountRef.current++
                    }
                  }, 3000)
                }
              }}
              style={{ display:'none' }}
            />
            <WaveformPlayer
              duration={audioDuration}
              currentTime={audioCurrentTime}
              isPlaying={audioIsPlaying}
            />
          </>
        )}

        <div className="sf-opts" ref={optsRef}>
          {[1,2,3,4].map(n => {
            const song = songList[currentSong]
            if (!song) return null
            const text = song[`option_${n}`]
            let className = 'sf-opt'
            if (answered) {
              if (n === song.correct_option) className += ' correct'
              else if (n === selectedOption) className += ' wrong'
              else className += ' disabled'
            }
            return (
              <button key={n} className={className} onClick={() => handleOptionSelect(n)}>
                <span style={{marginRight:8,opacity:.6}}>{n}.</span> {text}
              </button>
            )
          })}
        </div>

        {answered && (
          <button className="sf-next-btn" onClick={handleNext}>
            {currentSong + 1 >= songList.length ? 'See Results' : 'Next Song'}
          </button>
        )}
      </>}
    </div>

    {phase==='result' && <div className="sf-po"><div className="sf-pcc">
      <div className="sf-pe">{score/songList.length >= 0.5 ? "\uD83C\uDF89" : "\uD83D\uDE14"}</div>
      <div className={`sf-pt ${score/songList.length >= 0.5?'w':'l'}`}>
        {score/songList.length >= 0.5 ? (st.custom_win_msg || 'GREAT JOB!') : (st.custom_lose_msg || 'KEEP TRYING!')}
      </div>
      <p style={{color:'rgba(255,255,255,.6)',fontSize:14,marginBottom:8}}>
        You got {score} out of {songList.length} correct!
      </p>
      <div className="sf-ps">
        <div className="sf-psi"><div className="sf-psv">{score}</div><div className="sf-psl">Correct</div></div>
        <div className="sf-psi"><div className="sf-psv">{songList.length - score}</div><div className="sf-psl">Wrong</div></div>
      </div>
      <div className="sf-pa">
        <button onClick={handleRetry} className="sf-pb s" style={{color:st.try_again_text_color||'#fff',background:st.try_again_bg_color||'rgba(255,255,255,.1)',border:st.try_again_bg_color?'none':'1px solid rgba(255,255,255,.15)'}}>
          {st.try_again_btn_text||'Try Again'}
        </button>
        <button onClick={handleContinue} className="sf-pb p" style={{color:st.continue_btn_text_color||'#fff',background:st.continue_btn_bg_color||undefined}}>
          {st.continue_btn_text||'Continue'}
        </button>
      </div>
    </div></div>}
  </div></>)
}
