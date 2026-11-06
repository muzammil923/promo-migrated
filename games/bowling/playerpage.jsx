import { useState, useEffect, useRef, useCallback } from 'react'
function playSound(url) { if (!url) return; try { const a = new Audio(url); a.play().catch(() => {}) } catch {} }

export default function BowlingPlayerPage({ gameData, sessionToken, onComplete }) {
  const { settings, soundMap } = gameData
  const soundMapRef = useRef(soundMap || {})
  const resolveSound = useCallback((id) => { if (!id) return null; const n = parseInt(id); return isNaN(n) ? id : (soundMapRef.current[n] || null) }, [])
  const ff = `'${settings?.font_family || 'DM Sans'}', sans-serif`
  const primaryColor = settings?.primary_color || '#f59e0b'
  const totalFrames = settings?.frames || 10

  const [showIntro, setShowIntro] = useState(true)
  const [gamePhase, setGamePhase] = useState('aiming') // aiming, rolling, scoring, finished
  const [currentFrame, setCurrentFrame] = useState(0)
  const [currentRoll, setCurrentRoll] = useState(0)
  const [frames, setFrames] = useState(Array.from({ length: totalFrames }, () => ({ rolls: [], score: null })))
  const [totalScore, setTotalScore] = useState(0)
  const [pins, setPins] = useState(Array(settings?.pins || 10).fill(true))
  const [aimAngle, setAimAngle] = useState(50)
  const [ballX, setBallX] = useState(50)
  const [ballY, setBallY] = useState(90)
  const [knockedPins, setKnockedPins] = useState([])
  const [showResult, setShowResult] = useState(false)
  const [resultMsg, setResultMsg] = useState('')
  const completedRef = useRef(false)
  const animRef = useRef(null)
  const [termsAgreed, setTermsAgreed] = useState(false)

  const handleComplete = useCallback(async (score) => {
    if (completedRef.current) return; completedRef.current = true
    try {
      if (sessionToken) await fetch('/api/play/session/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken, score, player_data: { frames, totalScore: score } })
      })
    } catch {}
    onComplete?.()
  }, [sessionToken, onComplete, frames])

  const startGame = () => { setShowIntro(false); setCurrentFrame(0); setCurrentRoll(0); setFrames(Array.from({ length: totalFrames }, () => ({ rolls: [], score: null }))); setTotalScore(0); setPins(Array(10).fill(true)); setGamePhase('aiming'); completedRef.current = false }

  const rollBall = () => {
    if (gamePhase !== 'aiming') return
    setGamePhase('rolling')
    const pinPositions = [
      { x: 45, y: 10 }, { x: 55, y: 10 },
      { x: 40, y: 18 }, { x: 50, y: 18 }, { x: 60, y: 18 },
      { x: 35, y: 26 }, { x: 45, y: 26 }, { x: 55, y: 26 }, { x: 65, y: 26 },
      { x: 50, y: 34 },
    ]
    const ballPath = aimAngle
    const hitPins = []
    pinPositions.forEach((pin, i) => {
      if (!pins[i]) return
      const dist = Math.abs(ballPath - pin.x)
      if (dist < 15 || (dist < 20 && Math.random() > 0.5)) hitPins.push(i)
    })
    if (hitPins.length === 0 && Math.random() > 0.3) {
      const nearPins = pinPositions.map((p, i) => ({ i, dist: Math.abs(ballPath - p.x) })).filter(x => pins[x.i]).sort((a, b) => a.dist - b.dist)
      if (nearPins.length > 0) hitPins.push(nearPins[0].i)
    }

    setTimeout(() => {
      const newPins = [...pins]
      hitPins.forEach(i => { newPins[i] = false })
      setPins(newPins)
      setKnockedPins(hitPins)

      const isStrike = currentRoll === 0 && hitPins.length === 10
      const isSpare = currentRoll === 1 && newPins.every(p => !p)

      if (isStrike) playSound(resolveSound(settings?.sound_strike_id))
      else if (isSpare) playSound(resolveSound(settings?.sound_spare_id))
      else playSound(resolveSound(settings?.sound_roll_id))

      const newFrames = [...frames]
      newFrames[currentFrame].rolls.push(hitPins.length)

      if (isStrike || currentRoll === 1) {
        const frameScore = newFrames[currentFrame].rolls.reduce((a, b) => a + b, 0)
        newFrames[currentFrame].score = frameScore
        let runningTotal = 0
        for (let f = 0; f <= currentFrame; f++) {
          if (newFrames[f].score !== null) runningTotal += newFrames[f].score
          else runningTotal += newFrames[f].rolls.reduce((a, b) => a + b, 0)
        }
        setTotalScore(runningTotal)

        if (currentFrame >= totalFrames - 1) {
          setFrames(newFrames); setGamePhase('finished')
          setTimeout(() => handleComplete(runningTotal), 1500)
          return
        }
        setTimeout(() => {
          setCurrentFrame(f => f + 1); setCurrentRoll(0)
          setPins(Array(settings?.pins || 10).fill(true)); setGamePhase('aiming')
        }, 1000)
      } else {
        setFrames(newFrames); setCurrentRoll(1); setGamePhase('aiming')
      }
    }, 800)
  }

  const bgStyle = settings?.bg_image_url
    ? { backgroundImage: `url(${settings.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: settings?.bg_color || '#0f172a' }

  if (showIntro) return (
    <div style={{ minHeight:'100dvh',...bgStyle,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px 16px',fontFamily:ff }}>
      <div style={{ width:'100%',maxWidth:440,padding:'clamp(24px,6vw,36px)',borderRadius:28,background:'rgba(255,255,255,0.93)',backdropFilter:'blur(28px)',boxShadow:'0 8px 40px rgba(0,0,0,0.12)',textAlign:'center' }}>
        {settings?.game_logo_url && <img src={settings.game_logo_url} alt="" style={{ maxWidth:'100%',maxHeight:60,marginBottom:16,objectFit:'contain' }} />}
        <h1 style={{ fontSize:'clamp(22px,6vw,30px)',fontWeight:800,color:settings?.heading_1_color||'#1a1a2e',marginBottom:8,fontFamily:ff }}>{settings?.heading_1||'Bowling'}</h1>
        {settings?.heading_2 && <p style={{ fontSize:15,fontWeight:600,color:settings?.heading_2_color||'#666',marginBottom:8 }}>{settings.heading_2}</p>}
        <div style={{ background:'#FEF3C7',borderRadius:12,padding:16,marginBottom:20 }}>
          <p style={{ fontSize:13,color:'#92400E',lineHeight:1.6 }}>🎳 Aim and roll to knock down pins! Get strikes and spares for bonus points.</p>
        </div>
        {settings?.terms_enabled && (
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
              <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} style={{ width: 14, height: 14 }} />
              {settings?.terms_url ? <a href={settings.terms_url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{settings.terms_text || 'Terms & Conditions'}</a> : <span>{settings?.terms_text || 'Terms & Conditions'}</span>}
            </label>
          </div>
        )}
        <button onClick={startGame} disabled={!!settings?.terms_enabled && !termsAgreed} style={{ background: settings?.start_button_bg_color||`linear-gradient(135deg,${primaryColor},${primaryColor}cc)`,color: settings?.start_button_text_color||'#fff',border:'none',borderRadius:12,padding:'15px 36px',fontSize:16,fontWeight:700,cursor:(!!settings?.terms_enabled && !termsAgreed)?'not-allowed':'pointer',fontFamily:ff,width:'100%',maxWidth:280,opacity:(!!settings?.terms_enabled && !termsAgreed)?0.5:1 }}>{settings?.start_button_text||'Start Game →'}</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100dvh',...bgStyle,display:'flex',flexDirection:'column',alignItems:'center',fontFamily:ff,padding:'12px 16px' }}>
      <h2 style={{ fontSize:18,fontWeight:800,color:settings?.heading_1_color||'#fff',marginBottom:4,textAlign:'center',textShadow:'0 2px 8px rgba(0,0,0,0.3)' }}>{settings?.heading_1||'Bowling'}</h2>
      <div style={{ display:'flex',gap:12,marginBottom:8 }}>
        <span style={{ background:'rgba(255,255,255,0.15)',borderRadius:8,padding:'6px 14px',fontSize:13,fontWeight:700,color:'#fff' }}>Frame: {Math.min(currentFrame+1,totalFrames)}/{totalFrames}</span>
        <span style={{ background:'rgba(255,255,255,0.15)',borderRadius:8,padding:'6px 14px',fontSize:13,fontWeight:700,color:'#f59e0b' }}>Score: {totalScore}</span>
      </div>

      {/* Scoreboard */}
      <div style={{ display:'flex',gap:2,marginBottom:12,overflowX:'auto',padding:'4px 0' }}>
        {frames.map((f, i) => (
          <div key={i} style={{ minWidth:44,textAlign:'center',background:i===currentFrame?'rgba(245,158,11,0.3)':'rgba(255,255,255,0.1)',borderRadius:6,padding:'4px 6px' }}>
            <div style={{ fontSize:9,color:'rgba(255,255,255,0.5)',marginBottom:2 }}>F{i+1}</div>
            <div style={{ fontSize:11,color:'#fff',fontWeight:600 }}>{f.rolls.join('-')||'-'}</div>
            {f.score !== null && <div style={{ fontSize:10,color:'#f59e0b',fontWeight:700 }}>{f.score}</div>}
          </div>
        ))}
      </div>

      {/* Bowling Lane */}
      <div style={{ position:'relative',width:'100%',maxWidth:400,height:350,background:'linear-gradient(to bottom,#8B4513,#A0522D)',borderRadius:12,overflow:'hidden',marginBottom:12 }}>
        {/* Lane lines */}
        {[20,35,50,65,80].map(x => <div key={x} style={{ position:'absolute',left:`${x}%`,top:0,bottom:0,width:1,background:'rgba(255,255,255,0.1)' }} />)}
        {/* Pins */}
        {[[45,10],[55,10],[40,18],[50,18],[60,18],[35,26],[45,26],[55,26],[65,26],[50,34]].map(([x,y], i) => (
          <div key={i} onClick={() => gamePhase==='aiming' && setAimAngle(x)} style={{
            position:'absolute',left:`${x}%`,top:`${y}%`,width:18,height:18,borderRadius:'50%',
            background:pins[i]?'#fff':'transparent',border:pins[i]?'2px solid #ccc':'none',
            cursor:'pointer',transform:'translate(-50%,-50%)',transition:'all 0.3s',
            boxShadow:pins[i]?'0 2px 6px rgba(0,0,0,0.3)':'none'
          }} />
        ))}
        {/* Ball */}
        <div style={{
          position:'absolute',left:`${aimAngle}%`,bottom:'8%',width:24,height:24,borderRadius:'50%',
          background:`linear-gradient(135deg,${primaryColor},${primaryColor}cc)`,
          transform:'translateX(-50%)',cursor:'pointer',transition:'left 0.2s',
          boxShadow:`0 4px 12px ${primaryColor}66`,zIndex:2
        }} onClick={rollBall} />
        {/* Aim guide */}
        <div style={{ position:'absolute',left:`${aimAngle}%`,top:0,bottom:'12%',width:2,background:`${primaryColor}44`,transform:'translateX(-50%)',pointerEvents:'none' }} />
      </div>

      {gamePhase === 'aiming' && (
        <div style={{ textAlign:'center',marginBottom:8 }}>
          <p style={{ fontSize:12,color:'rgba(255,255,255,0.6)' }}>Click the ball or pins to aim, then click the ball to roll</p>
          <input type="range" min={15} max={85} value={aimAngle} onChange={e => setAimAngle(Number(e.target.value))} style={{ width:'80%',accentColor:primaryColor }} />
        </div>
      )}

      {gamePhase === 'finished' && (
        <div style={{ position:'fixed',inset:0,zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)' }}>
          <div style={{ background:'#fff',borderRadius:28,padding:36,maxWidth:360,width:'100%',textAlign:'center',boxShadow:'0 24px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize:56,marginBottom:12 }}>🎳</div>
            <h2 style={{ fontSize:22,fontWeight:800,color:'#1a1a2e',marginBottom:8 }}>Game Over!</h2>
            <p style={{ color:'#666',fontSize:16,marginBottom:20 }}>Final Score: <strong>{totalScore}</strong></p>
            <button onClick={() => handleComplete(totalScore)} style={{ background:settings?.continue_button_bg_color||primaryColor,color:settings?.continue_button_text_color||'#fff',border:'none',borderRadius:50,padding:'14px 36px',fontSize:16,fontWeight:700,cursor:'pointer',width:'100%' }}>{settings?.continue_button_text||'Continue →'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
