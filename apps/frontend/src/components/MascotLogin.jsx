import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'

/* ─── Pupil ─── */
function Pupil({ size = 12, maxDistance = 5, pupilColor = '#0a0a14', forceLookX, forceLookY }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const ref = useRef(null)
  useEffect(() => {
    const handle = (e) => {
      if (!ref.current) return
      if (forceLookX !== undefined && forceLookY !== undefined) { setPos({ x: forceLookX, y: forceLookY }); return }
      const r = ref.current.getBoundingClientRect()
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      const dx = e.clientX - cx, dy = e.clientY - cy
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance)
      const angle = Math.atan2(dy, dx)
      setPos({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist })
    }
    window.addEventListener('mousemove', handle)
    if (forceLookX !== undefined && forceLookY !== undefined) setPos({ x: forceLookX, y: forceLookY })
    return () => window.removeEventListener('mousemove', handle)
  }, [forceLookX, forceLookY, maxDistance])
  return <div ref={ref} style={{ width: size, height: size, borderRadius: '50%', backgroundColor: pupilColor, transform: `translate(${pos.x}px, ${pos.y}px)`, transition: 'transform 0.08s ease-out' }} />
}

/* ─── EyeBall ─── */
function EyeBall({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = 'white', pupilColor = '#0a0a14', isBlinking = false, forceLookX, forceLookY, lightIntensity = 0 }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const ref = useRef(null)
  useEffect(() => {
    const handle = (e) => {
      if (!ref.current) return
      if (forceLookX !== undefined && forceLookY !== undefined) { setPos({ x: forceLookX, y: forceLookY }); return }
      const r = ref.current.getBoundingClientRect()
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      const dx = e.clientX - cx, dy = e.clientY - cy
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance)
      const angle = Math.atan2(dy, dx)
      setPos({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist })
    }
    window.addEventListener('mousemove', handle)
    if (forceLookX !== undefined && forceLookY !== undefined) setPos({ x: forceLookX, y: forceLookY })
    return () => window.removeEventListener('mousemove', handle)
  }, [forceLookX, forceLookY, maxDistance])
  const highlightOpacity = 0.4 + lightIntensity * 0.5
  return (
    <div ref={ref} style={{
      width: size, height: isBlinking ? 2 : size, borderRadius: '50%', backgroundColor: eyeColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      transition: 'height 0.08s ease',
      boxShadow: lightIntensity > 0.3 ? `0 0 ${8 + lightIntensity * 12}px rgba(168,133,250,${lightIntensity * 0.4})` : 'none',
    }}>
      {!isBlinking && (
        <>
          <div style={{ width: pupilSize, height: pupilSize, borderRadius: '50%', backgroundColor: pupilColor, transform: `translate(${pos.x}px, ${pos.y}px)`, transition: 'transform 0.08s ease-out', position: 'relative', zIndex: 1 }} />
          {/* Light reflection in eye */}
          <div style={{
            position: 'absolute', width: pupilSize * 0.45, height: pupilSize * 0.45,
            borderRadius: '50%', background: `rgba(255,255,255,${highlightOpacity})`,
            top: '18%', right: '20%', filter: `blur(${1 - lightIntensity}px)`, zIndex: 2,
            transition: 'opacity 0.15s ease',
          }} />
        </>
      )}
    </div>
  )
}

/* ─── Brand colors ─── */
const C1 = '#8b5cf6'
const C2 = '#6d28d9'
const C3 = '#c084fc'
const C4 = '#a78bfa'

export default function MascotLogin({ children, isTyping: isTypingProp, showPassword, passwordLength, loginFailed, loginSuccess }) {
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [hasEntered, setHasEntered] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [scaleFactor, setScaleFactor] = useState(1)
  const [purpleBlink, setPurpleBlink] = useState(false)
  const [blackBlink, setBlackBlink] = useState(false)
  const [charPos, setCharPos] = useState({
    c1: { faceX: 0, faceY: 0, bodySkew: 0, centerX: 0, centerY: 0 },
    c2: { faceX: 0, faceY: 0, bodySkew: 0, centerX: 0, centerY: 0 },
    c3: { faceX: 0, faceY: 0, bodySkew: 0, centerX: 0, centerY: 0 },
    c4: { faceX: 0, faceY: 0, bodySkew: 0, centerX: 0, centerY: 0 },
  })
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false)
  const [isPurplePeeking, setIsPurplePeeking] = useState(false)

  const ref1 = useRef(null), ref2 = useRef(null), ref3 = useRef(null), ref4 = useRef(null)
  const isTyping = isTypingProp
  const passwordHidden = passwordLength > 0 && !showPassword
  const passwordVisible = passwordLength > 0 && showPassword

  useEffect(() => { const t = setTimeout(() => setHasEntered(true), 200); return () => clearTimeout(t) }, [])
  useEffect(() => {
    if (loginSuccess) { setShowConfetti(true); const t = setTimeout(() => setShowConfetti(false), 5000); return () => clearTimeout(t) }
  }, [loginSuccess])
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth
      if (vw >= 1200) setScaleFactor(1)
      else if (vw >= 768) setScaleFactor(0.55 + (vw - 768) / (1200 - 768) * 0.45)
      else if (vw >= 480) setScaleFactor(0.45 + (vw - 480) / (768 - 480) * 0.1)
      else setScaleFactor(0.4)
    }
    update(); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update)
  }, [])
  useEffect(() => {
    const handler = (e) => { setMouseX(e.clientX); setMouseY(e.clientY) }
    window.addEventListener('mousemove', handler); return () => window.removeEventListener('mousemove', handler)
  }, [])

  useEffect(() => { let t; const s = () => { t = setTimeout(() => { setPurpleBlink(true); setTimeout(() => { setPurpleBlink(false); s() }, 150) }, 3000 + Math.random() * 4000) }; s(); return () => clearTimeout(t) }, [])
  useEffect(() => { let t; const s = () => { t = setTimeout(() => { setBlackBlink(true); setTimeout(() => { setBlackBlink(false); s() }, 150) }, 3000 + Math.random() * 4000) }; s(); return () => clearTimeout(t) }, [])

  /* Character position + center tracking */
  useEffect(() => {
    const calc = (ref) => {
      if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0, centerX: 0, centerY: 0 }
      const r = ref.current.getBoundingClientRect()
      const cx = r.left + r.width / 2, cy = r.top + r.height / 3
      const dx = mouseX - cx, dy = mouseY - cy
      return {
        faceX: Math.max(-15, Math.min(15, dx / 20)),
        faceY: Math.max(-10, Math.min(10, dy / 30)),
        bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
        centerX: cx, centerY: cy,
      }
    }
    setCharPos({ c1: calc(ref1), c2: calc(ref2), c3: calc(ref3), c4: calc(ref4) })
  }, [mouseX, mouseY])

  /* Light intensity per character based on cursor distance */
  const lightData = useMemo(() => {
    const calc = (centerX, centerY) => {
      if (!centerX) return { intensity: 0, angle: 0, distance: 999 }
      const dx = mouseX - centerX, dy = mouseY - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const maxDist = 500
      const intensity = Math.max(0, 1 - distance / maxDist)
      const angle = Math.atan2(dy, dx)
      return { intensity, angle, distance }
    }
    return {
      c1: calc(charPos.c1.centerX, charPos.c1.centerY),
      c2: calc(charPos.c2.centerX, charPos.c2.centerY),
      c3: calc(charPos.c3.centerX, charPos.c3.centerY),
      c4: calc(charPos.c4.centerX, charPos.c4.centerY),
    }
  }, [mouseX, mouseY, charPos])

  useEffect(() => {
    if (isTyping) { const t1 = setTimeout(() => setIsLookingAtEachOther(true), 0); const t2 = setTimeout(() => setIsLookingAtEachOther(false), 800); return () => { clearTimeout(t1); clearTimeout(t2) } }
    else { const t = setTimeout(() => setIsLookingAtEachOther(false), 0); return () => clearTimeout(t) }
  }, [isTyping])

  useEffect(() => {
    if (passwordVisible) { let t; const s = () => { t = setTimeout(() => { setIsPurplePeeking(true); setTimeout(() => setIsPurplePeeking(false), 800) }, 2000 + Math.random() * 3000) }; s(); return () => clearTimeout(t) }
    else { const t = setTimeout(() => setIsPurplePeeking(false), 0); return () => clearTimeout(t) }
  }, [passwordVisible])

  const isFullHeight = scaleFactor >= 0.55
  /* Hide the mascot characters on mobile/narrow screens — the layout strip
     they occupy below the form isn't worth the space there. */
  const showMascot = scaleFactor >= 0.55
  const p1 = charPos.c1, p2 = charPos.c2, p3 = charPos.c3, p4 = charPos.c4
  const l1 = lightData.c1, l2 = lightData.c2, l3 = lightData.c3, l4 = lightData.c4

  const confettiColors = [C1, C2, C3, C4, '#10b981', '#ec4899']
  const confettiPieces = showConfetti ? Array.from({ length: 50 }, (_, i) => ({
    left: `${Math.random() * 100}%`, top: `${-5 - Math.random() * 10}%`,
    bg: confettiColors[i % confettiColors.length], w: 3 + Math.random() * 4, h: 6 + Math.random() * 6,
    delay: `${Math.random() * 2}s`, dur: `${3 + Math.random() * 2}s`,
  })) : []

  /* Build light gradient for a character */
  /* Lighten / darken a hex color */
  const adjustColor = (hex, amount) => {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
    return `rgb(${r},${g},${b})`
  }

  const lightGradient = (angle, intensity, baseColor) => {
    if (intensity < 0.02) return baseColor
    const lightAngle = (angle * 180 / Math.PI + 180) % 360
    const highlight = adjustColor(baseColor, Math.round(intensity * 70))
    const shadow = adjustColor(baseColor, -Math.round(intensity * 50))
    return `linear-gradient(${lightAngle}deg, ${highlight} 0%, ${baseColor} 45%, ${shadow} 100%)`
  }

  const shadowStyle = (angle, intensity) => {
    if (intensity < 0.05) return 'none'
    const sx = -Math.cos(angle) * (8 + intensity * 16)
    const sy = -Math.sin(angle) * (8 + intensity * 16)
    const blur = 12 + intensity * 24
    return `${sx}px ${sy}px ${blur}px rgba(0,0,0,${0.2 + intensity * 0.35})`
  }

  const glowStyle = (intensity) => {
    if (intensity < 0.15) return 'none'
    return `0 0 ${20 + intensity * 40}px rgba(168,133,250,${intensity * 0.25}), 0 0 ${40 + intensity * 60}px rgba(139,92,246,${intensity * 0.12})`
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
      width: '100%', minHeight: '100vh',
      background: `
        radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 50%, rgba(168,133,250,0.06) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 100%, rgba(192,132,252,0.04) 0%, transparent 40%),
        linear-gradient(160deg, #06060c 0%, #0c0a16 40%, #120f20 100%)
      `.replace(/\n\s*/g, ' '),
      position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* ── Home icon top-left ── */}
      <Link to="/" style={{
        position: 'fixed', top: 20, left: 20, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 42, height: 42, borderRadius: 12,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.5)',
        transition: 'all 0.2s ease', textDecoration: 'none',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.12)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)'; e.currentTarget.style.color = '#a78bfa' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </Link>

      {showConfetti && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
          {confettiPieces.map((c, i) => (
            <div key={i} style={{ position: 'absolute', left: c.left, top: c.top, background: c.bg, width: c.w, height: c.h, borderRadius: 2, animation: `confetti-fall ${c.dur} linear ${c.delay} forwards` }} />
          ))}
        </div>
      )}

      {/* ── Left: Characters (hidden on mobile) ── */}
        {showMascot && <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          position: 'relative', minHeight: isFullHeight ? '100vh' : 'auto', paddingBottom: isFullHeight ? 40 : 0,
          opacity: hasEntered ? 1 : 0, transform: hasEntered ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 0.8s cubic-bezier(0.34,1.56,0.64,1)',
          width: Math.max(80, 550 * scaleFactor),
          flexShrink: 0,
          order: isFullHeight ? 0 : 1,
        }}>
          <div style={{
            position: 'relative', width: 550, height: 420,
            transform: `scale(${scaleFactor})`, transformOrigin: 'bottom center',
            transition: 'transform 0.2s ease',
          }}>

            {/* ── C1: Tall back ── */}
            <div ref={ref1} style={{
              position: 'absolute', left: 70, bottom: 0, width: 180,
              height: passwordHidden ? 440 : 400,
              background: lightGradient(l1.angle, l1.intensity, C1),
              borderRadius: '10px 10px 0 0', zIndex: 1,
              boxShadow: `${shadowStyle(l1.angle, l1.intensity)}, ${glowStyle(l1.intensity)}`,
              filter: `brightness(${1 + l1.intensity * 0.2})`,
              transform: passwordVisible ? 'skewX(0deg)' : (isTyping || passwordHidden) ? `skewX(${(p1.bodySkew || 0) - 12}deg) translateX(40px)` : `skewX(${p1.bodySkew || 0}deg)`,
              transformOrigin: 'bottom center', transition: 'height 0.4s ease, transform 0.3s ease, background 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease',
            }}>
              {/* Specular highlight stripe */}
              {l1.intensity > 0.1 && (
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${50 + Math.cos(l1.angle) * 40}%`,
                  width: `${6 + l1.intensity * 10}%`,
                  background: `linear-gradient(180deg, transparent, rgba(255,255,255,${l1.intensity * 0.12}), transparent)`,
                  borderRadius: '0 10px 10px 0', pointerEvents: 'none',
                  transition: 'left 0.1s ease, width 0.1s ease',
                }} />
              )}
              <div style={{ position: 'absolute', left: passwordVisible ? 20 : isLookingAtEachOther ? 55 : 45 + (p1.faceX || 0), top: passwordVisible ? 35 : isLookingAtEachOther ? 65 : 40 + (p1.faceY || 0), display: 'flex', gap: 8, transition: 'left 0.3s ease, top 0.3s ease' }}>
                <EyeBall size={18} pupilSize={7} maxDistance={5} isBlinking={purpleBlink} lightIntensity={l1.intensity}
                  forceLookX={passwordVisible ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={passwordVisible ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
                <EyeBall size={18} pupilSize={7} maxDistance={5} isBlinking={purpleBlink} lightIntensity={l1.intensity}
                  forceLookX={passwordVisible ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={passwordVisible ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
              </div>
            </div>

            {/* ── C2: Medium middle ── */}
            <div ref={ref2} style={{
              position: 'absolute', left: 240, bottom: 0, width: 120, height: 310,
              background: lightGradient(l2.angle, l2.intensity, C2),
              borderRadius: '8px 8px 0 0', zIndex: 2,
              boxShadow: `${shadowStyle(l2.angle, l2.intensity)}, ${glowStyle(l2.intensity)}`,
              filter: `brightness(${1 + l2.intensity * 0.2})`,
              transform: passwordVisible ? 'skewX(0deg)' : isLookingAtEachOther ? `skewX(${(p2.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)` : (isTyping || passwordHidden) ? `skewX(${(p2.bodySkew || 0) * 1.5}deg)` : `skewX(${p2.bodySkew || 0}deg)`,
              transformOrigin: 'bottom center', transition: 'transform 0.3s ease, background 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease',
            }}>
              {l2.intensity > 0.1 && (
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${50 + Math.cos(l2.angle) * 40}%`,
                  width: `${6 + l2.intensity * 10}%`,
                  background: `linear-gradient(180deg, transparent, rgba(255,255,255,${l2.intensity * 0.12}), transparent)`,
                  borderRadius: '0 8px 8px 0', pointerEvents: 'none',
                  transition: 'left 0.1s ease, width 0.1s ease',
                }} />
              )}
              <div style={{ position: 'absolute', left: passwordVisible ? 10 : isLookingAtEachOther ? 32 : 26 + (p2.faceX || 0), top: passwordVisible ? 28 : isLookingAtEachOther ? 12 : 32 + (p2.faceY || 0), display: 'flex', gap: 6, transition: 'left 0.3s ease, top 0.3s ease' }}>
                <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={blackBlink} lightIntensity={l2.intensity}
                  forceLookX={passwordVisible ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={passwordVisible ? -4 : isLookingAtEachOther ? -4 : undefined} />
                <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={blackBlink} lightIntensity={l2.intensity}
                  forceLookX={passwordVisible ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={passwordVisible ? -4 : isLookingAtEachOther ? -4 : undefined} />
              </div>
            </div>

            {/* ── C3: Semicircle front left ── */}
            <div ref={ref3} style={{
              position: 'absolute', left: 0, bottom: 0, width: 240, height: 200,
              background: lightGradient(l3.angle, l3.intensity, C3),
              borderRadius: '120px 120px 0 0', zIndex: 3,
              boxShadow: `${shadowStyle(l3.angle, l3.intensity)}, ${glowStyle(l3.intensity)}`,
              filter: `brightness(${1 + l3.intensity * 0.2})`,
              transform: passwordVisible ? 'skewX(0deg)' : `skewX(${p3.bodySkew || 0}deg)`,
              transformOrigin: 'bottom center', transition: 'transform 0.3s ease, background 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease',
            }}>
              {l3.intensity > 0.1 && (
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${50 + Math.cos(l3.angle) * 40}%`,
                  width: `${8 + l3.intensity * 12}%`,
                  background: `linear-gradient(180deg, transparent, rgba(255,255,255,${l3.intensity * 0.15}), transparent)`,
                  borderRadius: '0 120px 120px 0', pointerEvents: 'none',
                  transition: 'left 0.1s ease, width 0.1s ease',
                }} />
              )}
              <div style={{ position: 'absolute', left: passwordVisible ? 50 : 82 + (p3.faceX || 0), top: passwordVisible ? 85 : 90 + (p3.faceY || 0), display: 'flex', gap: 8, transition: 'left 0.3s ease, top 0.3s ease' }}>
                <Pupil size={12} maxDistance={5} forceLookX={passwordVisible ? -5 : undefined} forceLookY={passwordVisible ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} forceLookX={passwordVisible ? -5 : undefined} forceLookY={passwordVisible ? -4 : undefined} />
              </div>
            </div>

            {/* ── C4: Rounded front right ── */}
            <div ref={ref4} style={{
              position: 'absolute', left: 310, bottom: 0, width: 140, height: 230,
              background: lightGradient(l4.angle, l4.intensity, C4),
              borderRadius: '70px 70px 0 0', zIndex: 4,
              boxShadow: `${shadowStyle(l4.angle, l4.intensity)}, ${glowStyle(l4.intensity)}`,
              filter: `brightness(${1 + l4.intensity * 0.2})`,
              transform: passwordVisible ? 'skewX(0deg)' : `skewX(${p4.bodySkew || 0}deg)`,
              transformOrigin: 'bottom center', transition: 'transform 0.3s ease, background 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease',
            }}>
              {l4.intensity > 0.1 && (
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${50 + Math.cos(l4.angle) * 40}%`,
                  width: `${6 + l4.intensity * 10}%`,
                  background: `linear-gradient(180deg, transparent, rgba(255,255,255,${l4.intensity * 0.12}), transparent)`,
                  borderRadius: '0 70px 70px 0', pointerEvents: 'none',
                  transition: 'left 0.1s ease, width 0.1s ease',
                }} />
              )}
              <div style={{ position: 'absolute', left: passwordVisible ? 20 : 52 + (p4.faceX || 0), top: passwordVisible ? 35 : 40 + (p4.faceY || 0), display: 'flex', gap: 6, transition: 'left 0.3s ease, top 0.3s ease' }}>
                <Pupil size={12} maxDistance={5} forceLookX={passwordVisible ? -5 : undefined} forceLookY={passwordVisible ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} forceLookX={passwordVisible ? -5 : undefined} forceLookY={passwordVisible ? -4 : undefined} />
              </div>
              <div style={{ position: 'absolute', left: passwordVisible ? 10 : 40 + (p4.faceX || 0), top: passwordVisible ? 88 : 88 + (p4.faceY || 0), width: 20, height: 3, borderRadius: 2, backgroundColor: 'rgba(10,10,20,0.3)', transition: 'left 0.3s ease, top 0.3s ease' }} />
            </div>

            {/* Ground glow — brighter when cursor near */}
            {(() => {
              const avgIntensity = (l1.intensity + l2.intensity + l3.intensity + l4.intensity) / 4
              return (
                <div style={{
                  position: 'absolute', bottom: -10, left: -40, right: -40, height: 30,
                  background: `radial-gradient(ellipse at ${50 + ((mouseX - 275) / 550) * 30}% 0%, rgba(168,133,250,${avgIntensity * 0.25}) 0%, transparent 70%)`,
                  pointerEvents: 'none', transition: 'background 0.15s ease',
                }} />
              )
            })()}
          </div>
        </div>}

      {/* ── Right: Form ── */}
      <div style={{
        flex: '1 1 42%', minWidth: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isFullHeight ? '40px 32px' : '24px 16px',
        position: 'relative', zIndex: 5,
        order: isFullHeight ? 0 : -1,
      }}>
        <div style={{
          width: '100%', maxWidth: 420,
          opacity: hasEntered ? 1 : 0,
          transform: hasEntered ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s ease 0.3s',
        }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
