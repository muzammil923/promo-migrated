import { useState, useEffect, useRef, useCallback } from 'react'

function playSound(url) { if (!url) return; try { const a = new Audio(url); a.play().catch(() => {}) } catch {} }

export default function ReactionPlayerPage({ gameData, sessionToken, onComplete }) {
  const { settings, soundMap } = gameData
  const soundMapRef = useRef(soundMap || {})
  const resolveSound = useCallback((id) => { if (!id) return null; const n = parseInt(id); return isNaN(n) ? id : (soundMapRef.current[n] || null) }, [])

  const primaryColor = settings?.primary_color || '#ef4444'
  const fontFamily = settings?.font_family || 'DM Sans'
  const ff = `'${fontFamily}', sans-serif`
  const bgColor = settings?.bg_color || '#0f172a'
  const totalRounds = settings?.rounds || 5
  const targetColor = settings?.target_color || '#22c55e'

  const [showIntro, setShowIntro] = useState(true)
  const [gameActive, setGameActive] = useState(false)
  const [phase, setPhase] = useState('waiting') // waiting, ready, go, result, finished
  const [currentRound, setCurrentRound] = useState(0)
  const [times, setTimes] = useState([])
  const [goTime, setGoTime] = useState(null)
  const [resultMsg, setResultMsg] = useState('')
  const [avgTime, setAvgTime] = useState(0)
  const [bestTime, setBestTime] = useState(Infinity)
  const [termsAgreed, setTermsAgreed] = useState(false)
  const timerRef = useRef(null)
  const completedRef = useRef(false)

  const handleComplete = useCallback(async () => {
    if (completedRef.current) return; completedRef.current = true
    const score = Math.max(0, Math.round(1000 - avgTime))
    try { if (sessionToken) await fetch('/api/play/session/complete', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ session_token:sessionToken, score, player_data:{ times, avgTime } }) }) } catch {}
    onComplete?.()
  }, [sessionToken, onComplete, avgTime, times])

  const handleStart = () => {
    setShowIntro(false); setGameActive(true); setCurrentRound(0); setTimes([])
    setAvgTime(0); setBestTime(Infinity); completedRef.current = false
    startRound()
  }

  const startRound = () => {
    setPhase('waiting')
    const delay = 1500 + Math.random() * 3000
    timerRef.current = setTimeout(() => {
      setPhase('go'); setGoTime(Date.now())
    }, delay)
  }

  const handleTap = () => {
    if (phase === 'waiting') {
      clearTimeout(timerRef.current)
      setResultMsg('Too early! Wait for green.')
      playSound(resolveSound(settings?.sound_wrong_id))
      setTimes(prev => [...prev, -1])
      setTimeout(() => {
        if (currentRound + 1 >= totalRounds) {
          finishGame([...times, -1])
        } else {
          setCurrentRound(r => r + 1); startRound()
        }
      }, 1000)
      return
    }

    if (phase === 'go') {
      const reactionTime = Date.now() - goTime
      playSound(resolveSound(settings?.sound_correct_id))
      setTimes(prev => [...prev, reactionTime])
      if (reactionTime < bestTime) setBestTime(reactionTime)
      setResultMsg(`${reactionTime}ms`)
      setPhase('result')

      setTimeout(() => {
        if (currentRound + 1 >= totalRounds) {
          finishGame([...times, reactionTime])
        } else {
          setCurrentRound(r => r + 1); startRound()
        }
      }, 1500)
    }
  }

  const finishGame = (allTimes) => {
    const valid = allTimes.filter(t => t > 0)
    const avg = valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0
    setAvgTime(avg); setPhase('finished')
    setTimeout(() => handleComplete(), 2000)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const bgStyle = settings?.bg_image_url
    ? { backgroundImage:`url(${settings.bg_image_url})`,backgroundSize:'cover',backgroundPosition:'center' }
    : { background:bgColor }

  const rating = avgTime > 0 ? avgTime < 200 ? 'Lightning Fast!' : avgTime < 350 ? 'Great Reflexes!' : avgTime < 500 ? 'Good Reaction!' : 'Keep Practicing!' : ''

  if (showIntro) {
    return (
      <div style={{ minHeight:'100dvh',...bgStyle,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px 16px',fontFamily:ff }}>
        <div style={{ width:'100%',maxWidth:440,padding:'clamp(24px,6vw,36px)',borderRadius:28,background:'rgba(255,255,255,0.93)',backdropFilter:'blur(28px)',boxShadow:'0 8px 40px rgba(0,0,0,0.12)',textAlign:'center' }}>
          {settings?.game_logo_url && <img src={settings.game_logo_url} alt="" style={{ maxWidth:'100%',maxHeight:60,marginBottom:16,objectFit:'contain' }} />}
          <h1 style={{ fontSize:'clamp(22px,6vw,30px)',fontWeight:800,color:settings?.heading_1_color||'#1a1a2e',marginBottom:8,fontFamily:ff }}>{settings?.heading_1||'Reaction Time Test'}</h1>
          {settings?.heading_2 && <p style={{ fontSize:15,fontWeight:600,color:settings?.heading_2_color||'#666',marginBottom:8 }}>{settings.heading_2}</p>}
          <div style={{ background:'#fef2f2',borderRadius:12,padding:16,marginBottom:20 }}>
            <p style={{ fontSize:13,color:'#991b1b',lineHeight:1.6 }}>⚡ Wait for the screen to turn green, then tap as fast as you can! {totalRounds} rounds.</p>
          </div>
          {settings?.terms_enabled && (
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(0,0,0,0.6)', cursor: 'pointer' }}>
                <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} style={{ width: 14, height: 14 }} />
                {settings?.terms_url ? <a href={settings.terms_url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{settings.terms_text || 'Terms & Conditions'}</a> : <span>{settings?.terms_text || 'Terms & Conditions'}</span>}
              </label>
            </div>
          )}
          <button onClick={handleStart} disabled={!!settings?.terms_enabled && !termsAgreed} style={{ background:`linear-gradient(135deg,${primaryColor},${primaryColor}cc)`,color:'#fff',border:'none',borderRadius:12,padding:'15px 36px',fontSize:16,fontWeight:700,cursor:(!!settings?.terms_enabled && !termsAgreed)?'not-allowed':'pointer',fontFamily:ff,boxShadow:`0 6px 20px ${primaryColor}44`,width:'100%',maxWidth:280,opacity:(!!settings?.terms_enabled && !termsAgreed)?0.5:1 }}>{settings?.start_button_text||'Start Test →'}</button>
        </div>
      </div>
    )
  }

  const screenColor = phase === 'go' ? targetColor : phase === 'waiting' ? '#ef4444' : phase === 'result' ? '#3b82f6' : '#1a1a2e'

  return (
    <div style={{ minHeight:'100dvh',...bgStyle,display:'flex',flexDirection:'column',alignItems:'center',fontFamily:ff,padding:'12px 16px' }}>
      <h2 style={{ fontSize:18,fontWeight:800,color:settings?.heading_1_color||'#fff',marginBottom:4,textAlign:'center' }}>{settings?.heading_1||'Reaction Time'}</h2>
      <div style={{ display:'flex',gap:12,marginBottom:10 }}>
        <span style={{ background:'rgba(255,255,255,0.15)',borderRadius:8,padding:'6px 14px',fontSize:13,fontWeight:700,color:'#fff' }}>Round: {Math.min(currentRound+1,totalRounds)}/{totalRounds}</span>
        {bestTime < Infinity && <span style={{ background:'rgba(255,255,255,0.15)',borderRadius:8,padding:'6px 14px',fontSize:13,fontWeight:700,color:'#f59e0b' }}>Best: {bestTime}ms</span>}
      </div>

      <div onClick={handleTap} style={{
        width:'100%',maxWidth:500,height:350,margin:'20px 0',
        borderRadius:24,background:screenColor,
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        cursor:'pointer',transition:'background 0.15s ease',
        boxShadow:phase==='go'?`0 0 40px ${targetColor}44`:'none',touchAction:'manipulation',
      }}>
        {phase === 'waiting' && <p style={{ fontSize:22,fontWeight:700,color:'#fff',textAlign:'center' }}>Wait for green…</p>}
        {phase === 'go' && <p style={{ fontSize:28,fontWeight:800,color:'#fff',textAlign:'center' }}>TAP NOW!</p>}
        {phase === 'result' && <p style={{ fontSize:48,fontWeight:900,color:'#fff',textAlign:'center' }}>{resultMsg}</p>}
        {phase === 'finished' && (
          <div style={{ textAlign:'center' }}>
            <p style={{ fontSize:48,fontWeight:900,color:'#fff' }}>{avgTime}ms</p>
            <p style={{ fontSize:18,color:'rgba(255,255,255,0.8)',marginTop:8 }}>{rating}</p>
          </div>
        )}
      </div>

      <div style={{ display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center' }}>
        {times.map((t, i) => (
          <span key={i} style={{ background:t<0?'rgba(239,68,68,0.2)':t<300?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.15)',borderRadius:8,padding:'4px 10px',fontSize:12,fontWeight:600,color:t<0?'#ef4444':t<300?'#22c55e':'#fff' }}>
            {t < 0 ? 'Early!' : `${t}ms`}
          </span>
        ))}
      </div>
    </div>
  )
}
