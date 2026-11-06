import { useState, useEffect, useRef, useCallback } from 'react'

function playSound(url) { if (!url) return; try { const a = new Audio(url); a.play().catch(() => {}) } catch {} }

const CATCH_EMOJIS = ['🍎','🍊','🍋','🍇','🍓','🫐','🥝','🍒','🏀','⚽','💎','⭐','🎁','🍔','🍕']
const BASKET_ITEMS = ['🧺','🪣','📦','🎒']

export default function CatchPlayerPage({ gameData, sessionToken, onComplete }) {
  const { settings, soundMap } = gameData
  const soundMapRef = useRef(soundMap || {})
  const resolveSound = useCallback((id) => { if (!id) return null; const n = parseInt(id); return isNaN(n) ? id : (soundMapRef.current[n] || null) }, [])

  const primaryColor = settings?.primary_color || '#8B5CF6'
  const fontFamily = settings?.font_family || 'DM Sans'
  const ff = `'${fontFamily}', sans-serif`
  const bgColor = settings?.bg_color || '#f8f8ff'
  const spawnRate = settings?.spawn_rate || 1000
  const fallSpeed = settings?.fall_speed || 2
  const maxMisses = settings?.max_misses || 5
  const timeLimit = settings?.time_limit_seconds || 60
  const basketColor = settings?.basket_color || '#8B5CF6'

  const [showIntro, setShowIntro] = useState(true)
  const [gameActive, setGameActive] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [basketX, setBasketX] = useState(50)
  const [items, setItems] = useState([])
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState(0)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [combo, setCombo] = useState(0)
  const itemIdRef = useRef(0)
  const gameLoopRef = useRef(null)
  const spawnRef = useRef(null)
  const completedRef = useRef(false)
  const basketXRef = useRef(50)
  const [termsAgreed, setTermsAgreed] = useState(false)

  const handleComplete = useCallback(async () => {
    if (completedRef.current) return; completedRef.current = true
    try { if (sessionToken) await fetch('/api/play/session/complete', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ session_token:sessionToken, score, player_data:{} }) }) } catch {}
    onComplete?.()
  }, [sessionToken, onComplete, score])

  useEffect(() => { if (gameOver && !completedRef.current) setTimeout(handleComplete, 1500) }, [gameOver])

  useEffect(() => {
    if (gameActive && timeLimit > 0 && !gameOver) {
      const t = setInterval(() => { setTimeLeft(p => { if (p <= 1) { clearInterval(t); setGameOver(true); return 0 }; return p - 1 }) }, 1000)
      return () => clearInterval(t)
    }
  }, [gameActive, timeLimit, gameOver])

  const handleStart = () => {
    setShowIntro(false); setGameActive(true); setGameOver(false); completedRef.current = false
    setScore(0); setMisses(0); setCombo(0); setTimeLeft(timeLimit); setItems([]); setBasketX(50)
    basketXRef.current = 50
  }

  useEffect(() => {
    if (!gameActive || gameOver) return
    spawnRef.current = setInterval(() => {
      const emoji = CATCH_EMOJIS[Math.floor(Math.random() * CATCH_EMOJIS.length)]
      setItems(prev => [...prev, { id: itemIdRef.current++, x: 10 + Math.random() * 80, y: -5, emoji, speed: fallSpeed * (0.8 + Math.random() * 0.4) }])
    }, spawnRate)

    gameLoopRef.current = setInterval(() => {
      setItems(prev => {
        const updated = []
        let newMisses = 0
        for (const item of prev) {
          const newY = item.y + item.speed * 0.5
          if (newY >= 92) { newMisses++; continue }
          const dx = Math.abs(item.x - basketXRef.current)
          if (newY >= 82 && newY <= 92 && dx < 8) {
            playSound(resolveSound(settings?.sound_catch_id))
            setScore(s => s + 10 * (1 + Math.floor(combo / 3)))
            setCombo(c => c + 1)
          } else {
            updated.push({ ...item, y: newY })
          }
        }
        if (newMisses > 0) {
          setMisses(m => {
            const nm = m + newMisses
            if (nm >= maxMisses) { setGameOver(true); playSound(resolveSound(settings?.sound_gameover_id)) }
            return nm
          })
          setCombo(0)
        }
        return updated
      })
    }, 50)

    return () => { clearInterval(spawnRef.current); clearInterval(gameLoopRef.current) }
  }, [gameActive, gameOver, spawnRate, fallSpeed, maxMisses, settings, resolveSound, combo])

  const handleMove = useCallback((clientX) => {
    if (!gameActive || gameOver) return
    const container = document.getElementById('catch-area')
    if (!container) return
    const rect = container.getBoundingClientRect()
    const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100))
    setBasketX(pct); basketXRef.current = pct
  }, [gameActive, gameOver])

  const handleMouseMove = (e) => handleMove(e.clientX)
  const handleTouchMove = (e) => { e.preventDefault(); handleMove(e.touches[0].clientX) }

  const bgStyle = settings?.bg_image_url
    ? { backgroundImage:`url(${settings.bg_image_url})`,backgroundSize:'cover',backgroundPosition:'center' }
    : { background:bgColor }

  if (showIntro) {
    return (
      <div style={{ minHeight:'100dvh',...bgStyle,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px 16px',fontFamily:ff }}>
        <div style={{ width:'100%',maxWidth:440,padding:'clamp(24px,6vw,36px)',borderRadius:28,background:'rgba(255,255,255,0.93)',backdropFilter:'blur(28px)',boxShadow:'0 8px 40px rgba(0,0,0,0.12)',textAlign:'center' }}>
          {settings?.game_logo_url && <img src={settings.game_logo_url} alt="" style={{ maxWidth:'100%',maxHeight:60,marginBottom:16,objectFit:'contain' }} />}
          <h1 style={{ fontSize:'clamp(22px,6vw,30px)',fontWeight:800,color:settings?.heading_1_color||'#1a1a2e',marginBottom:8,fontFamily:ff }}>{settings?.heading_1||'Catch the Falling Objects'}</h1>
          {settings?.heading_2 && <p style={{ fontSize:15,fontWeight:600,color:settings?.heading_2_color||'#666',marginBottom:8 }}>{settings.heading_2}</p>}
          <div style={{ background:'#f5f3ff',borderRadius:12,padding:16,marginBottom:20 }}>
            <p style={{ fontSize:13,color:'#6D28D9',lineHeight:1.6 }}>🧺 Move your basket left/right to catch falling items. Don't let them hit the ground!</p>
          </div>
          {settings?.terms_enabled && (
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} style={{ width: 14, height: 14 }} />
                {settings?.terms_url ? <a href={settings.terms_url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{settings.terms_text || 'Terms & Conditions'}</a> : <span>{settings?.terms_text || 'Terms & Conditions'}</span>}
              </label>
            </div>
          )}
          <button onClick={handleStart} disabled={!!settings?.terms_enabled && !termsAgreed} style={{ background:`linear-gradient(135deg,${primaryColor},${primaryColor}cc)`,color:'#fff',border:'none',borderRadius:12,padding:'15px 36px',fontSize:16,fontWeight:700,cursor:(!!settings?.terms_enabled && !termsAgreed)?'not-allowed':'pointer',fontFamily:ff,boxShadow:`0 6px 20px ${primaryColor}44`,width:'100%',maxWidth:280,opacity:(!!settings?.terms_enabled && !termsAgreed)?0.5:1 }}>{settings?.start_button_text||'Start Catching →'}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100dvh',...bgStyle,display:'flex',flexDirection:'column',alignItems:'center',fontFamily:ff,padding:'12px 16px' }}>
      <h2 style={{ fontSize:18,fontWeight:800,color:settings?.heading_1_color||'#1a1a2e',marginBottom:4,textAlign:'center' }}>{settings?.heading_1||'Catch!'}</h2>
      <div style={{ display:'flex',gap:12,marginBottom:10,flexWrap:'wrap',justifyContent:'center' }}>
        <span style={{ background:'rgba(255,255,255,0.85)',borderRadius:8,padding:'6px 14px',fontSize:13,fontWeight:700,color:primaryColor }}>Score: {score}</span>
        <span style={{ background:'rgba(255,255,255,0.85)',borderRadius:8,padding:'6px 14px',fontSize:13,fontWeight:700,color:combo>3?'#f59e0b':'#666' }}>Combo: {combo}x</span>
        <span style={{ background:'rgba(255,255,255,0.85)',borderRadius:8,padding:'6px 14px',fontSize:13,fontWeight:700,color:misses>=maxMisses-1?'#ef4444':'#666' }}>Misses: {misses}/{maxMisses}</span>
        {timeLimit>0 && <span style={{ background:'rgba(255,255,255,0.85)',borderRadius:8,padding:'6px 14px',fontSize:13,fontWeight:700,color:timeLeft<=10?'#ef4444':'#666' }}>⏱ {timeLeft}s</span>}
      </div>
      <div id="catch-area" onMouseMove={handleMouseMove} onTouchMove={handleTouchMove}
        style={{ width:'100%',maxWidth:500,height:400,background:'rgba(255,255,255,0.15)',borderRadius:16,position:'relative',overflow:'hidden',cursor:'none',touchAction:'none' }}>
        {items.map(item => (
          <div key={item.id} style={{ position:'absolute',left:`${item.x}%`,top:`${item.y}%`,transform:'translate(-50%,-50%)',fontSize:28,transition:'top .05s linear',pointerEvents:'none' }}>{item.emoji}</div>
        ))}
        <div style={{ position:'absolute',bottom:0,left:`${basketX}%`,transform:'translateX(-50%)',fontSize:40,transition:'left .05s ease',filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',pointerEvents:'none' }}>🧺</div>
      </div>
      {gameOver && (
        <div style={{ position:'fixed',inset:0,zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)' }}>
          <div style={{ background:'#fff',borderRadius:28,padding:36,maxWidth:360,width:'100%',textAlign:'center',boxShadow:'0 24px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize:56,marginBottom:12 }}>{misses>=maxMisses?'💀':'⏰'}</div>
            <h2 style={{ fontSize:22,fontWeight:800,color:'#1a1a2e',marginBottom:8 }}>{misses>=maxMisses?'Too Many Misses!':'Time\'s Up!'}</h2>
            <p style={{ color:'#666',fontSize:16,marginBottom:20 }}>Score: <strong>{score}</strong></p>
            <button onClick={handleComplete} style={{ background:primaryColor,color:'#fff',border:'none',borderRadius:50,padding:'14px 36px',fontSize:16,fontWeight:700,cursor:'pointer',width:'100%' }}>{settings?.continue_button_text||'Continue →'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
