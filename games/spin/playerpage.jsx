import { useState, useEffect, useRef, useCallback, memo } from 'react'
import api from '../../apps/frontend/src/api'

const PREMIUM_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.sp-body {
  min-height: 100dvh;
  background: linear-gradient(160deg, #0f0a1e 0%, #1a1035 30%, #12082e 60%, #0d0b1a 100%);
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
  position: relative;
}

.sp-body::before {
  content: '';
  position: absolute;
  top: -30%;
  left: -20%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle, rgba(124,107,247,0.12) 0%, transparent 70%);
  pointer-events: none;
}
.sp-body::after {
  content: '';
  position: absolute;
  bottom: -20%;
  right: -20%;
  width: 50%;
  height: 50%;
  background: radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%);
  pointer-events: none;
}

.sp-content {
  position: relative;
  z-index: 1;
  max-width: 440px;
  margin: 0 auto;
  padding: 20px 16px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sp-logos {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 16px;
}
.sp-logos img { height: 36px; object-fit: contain; border-radius: 8px; }

.sp-title-area {
  text-align: center;
  margin-bottom: 20px;
  position: relative;
}
.sp-title {
  font-family: 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #ffffff;
  line-height: 1.2;
  text-align: center;
  text-shadow: 0 2px 12px rgba(0,0,0,0.3);
}
.sp-subtitle {
  font-size: 13px;
  color: rgba(255,255,255,0.55);
  margin-top: 6px;
  font-weight: 500;
}

.sp-stats {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-bottom: 20px;
}
.sp-stat-card {
  flex: 1;
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 14px 10px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);
}
.sp-stat-icon { font-size: 22px; margin-bottom: 4px; }
.sp-stat-val { font-size: 20px; font-weight: 800; color: #fff; }
.sp-stat-label { font-size: 10px; color: rgba(255,255,255,0.45); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }

.sp-wheel-wrap {
  position: relative;
  margin: 0;
}

.sp-wheel-shadow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  filter: drop-shadow(0 12px 48px rgba(0,0,0,0.5));
  pointer-events: none;
  z-index: 1;
}

.sp-wheel-svg {
  display: block;
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.sp-wheel-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 88%;
  height: 88%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(124,107,247,0.2) 0%, transparent 70%);
  pointer-events: none;
  animation: spPulse 3s ease-in-out infinite;
}
@keyframes spPulse {
  0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
}

.sp-leds {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.sp-led-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  box-shadow: 0 0 6px currentColor, 0 0 12px currentColor;
}

.sp-pointer {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
}

.sp-spin-btn {
  margin-top: 20px;
  padding: 16px 56px;
  border-radius: 50px;
  border: none;
  background: linear-gradient(135deg, #7C6FF7, #9b8cff, #7C6FF7);
  color: #fff;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 3px;
  cursor: pointer;
  box-shadow: 0 0 24px rgba(124,107,247,0.5), 0 0 48px rgba(124,107,247,0.2), 0 8px 32px rgba(0,0,0,0.3);
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
  position: relative;
  overflow: hidden;
}
.sp-spin-btn::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  animation: spShimmer 2s infinite;
}
@keyframes spShimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}
.sp-spin-btn:active:not(:disabled) {
  transform: scale(0.95);
  box-shadow: 0 0 12px rgba(124,107,247,0.4), 0 4px 16px rgba(0,0,0,0.3);
}
.sp-spin-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.3);
}
.sp-spin-btn:disabled::before { animation: none; }

.sp-trust {
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  color: rgba(255,255,255,0.35);
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.sp-result-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: spFadeIn 0.3s ease;
}
@keyframes spFadeIn { from { opacity: 0; } to { opacity: 1; } }

.sp-result-card {
  background: linear-gradient(160deg, #1e1545, #151030);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 28px;
  padding: 36px 28px;
  max-width: 380px;
  width: 100%;
  text-align: center;
  box-shadow: 0 32px 80px rgba(0,0,0,0.5);
  animation: spPopIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
  position: relative;
  overflow: hidden;
}
.sp-result-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent);
}
@keyframes spPopIn { from { opacity: 0; transform: scale(0.8) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.sp-result-emoji { font-size: 64px; margin-bottom: 16px; }
.sp-result-label {
  display: inline-block;
  padding: 6px 20px;
  border-radius: 24px;
  font-weight: 800;
  font-size: 18px;
  margin-bottom: 14px;
}
.sp-result-msg { font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.9); margin: 0 0 12px; line-height: 1.5; }
.sp-result-desc { font-size: 14px; color: rgba(255,255,255,0.5); margin: 0 0 20px; line-height: 1.5; }

.sp-coupon-box {
  background: rgba(255,255,255,0.05);
  border: 2px dashed rgba(255,255,255,0.15);
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 20px;
}
.sp-coupon-label { font-size: 11px; color: rgba(255,255,255,0.45); font-weight: 600; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px; }
.sp-coupon-code { font-size: 24px; font-weight: 900; color: #F59E0B; letter-spacing: 4px; font-family: monospace; }

.sp-claim-btn {
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: #fff;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 6px 24px rgba(245,158,11,0.3);
  transition: transform 0.15s;
}
.sp-claim-btn:active { transform: scale(0.97); }

.sp-done-card {
  background: linear-gradient(160deg, #1e1545, #151030);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 28px;
  padding: 40px 28px;
  max-width: 380px;
  width: 100%;
  text-align: center;
  box-shadow: 0 32px 80px rgba(0,0,0,0.5);
  position: relative;
  z-index: 10;
}

.sp-error-card, .sp-already-card {
  background: linear-gradient(160deg, #1e1545, #151030);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 28px;
  padding: 40px 28px;
  max-width: 380px;
  width: 100%;
  text-align: center;
  box-shadow: 0 32px 80px rgba(0,0,0,0.5);
}
`

const SpinWheel = memo(function SpinWheel({ segments, spinning, settings, onSpin, wheelRef }) {
  const [size, setSize] = useState(Math.min(window.innerWidth * 0.85, 320))
  const primaryColor = settings?.primary_color || '#7C6FF7'
  const pointerColor = settings?.pointer_color || '#EF4444'

  useEffect(() => {
    const onResize = () => setSize(Math.min(window.innerWidth * 0.85, 320))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (wheelRef.current) {
      wheelRef.current.style.transform = 'rotate(0deg) translateZ(0)'
    }
  }, [wheelRef])

  const svgSize = size + 28
  const cx = svgSize / 2
  const cy = svgSize / 2
  const r = size / 2 - 10
  const count = segments.length || 1
  const sliceAngle = 360 / count

  let startAngle = -90
  const slices = segments.map(seg => {
    const sweep = sliceAngle
    const endAngle = startAngle + sweep
    const midAngle = startAngle + sweep / 2

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const midRad = (midAngle * Math.PI) / 180

    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const largeArc = sweep > 180 ? 1 : 0
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`

    const labelR = r * 0.62
    const tx = cx + labelR * Math.cos(midRad)
    const ty = cy + labelR * Math.sin(midRad)

    startAngle = endAngle
    return { d, tx, ty, angle: midAngle, color: seg.bg_color || '#7C6FF7', textColor: seg.text_color || '#fff', label: seg.label }
  })

  const btnR = size * 0.12
  const center = settings?.center_color || '#1F2937'
  const label = settings?.center_label || 'SPIN'
  const centerImg = settings?.center_image_url

  const ledCount = 20
  const ledR = svgSize / 2 - 4
  const leds = Array.from({ length: ledCount }, (_, i) => {
    const a = (i / ledCount) * Math.PI * 2 - Math.PI / 2
    return { x: cx + ledR * Math.cos(a), y: cy + ledR * Math.sin(a), color: i % 2 === 0 ? '#F59E0B' : primaryColor }
  })

  return (
    <div className="sp-wheel-wrap" style={{ width: svgSize, height: svgSize }}>
      {/* LED ring */}
      <div className="sp-leds">
        {leds.map((l, i) => (
          <div key={i} className="sp-led-dot" style={{ left: l.x - 3, top: l.y - 3, color: l.color, background: l.color }} />
        ))}
      </div>

      {/* Shadow (non-rotating) */}
      <div className="sp-wheel-shadow" />

      {/* Glow */}
      <div className="sp-wheel-glow" />

      {/* Pointer */}
      <div className="sp-pointer">
        <svg width="34" height="44" viewBox="0 0 34 44">
          <defs>
            <linearGradient id="ptrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={pointerColor} />
              <stop offset="100%" stopColor={pointerColor} stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <g transform="translate(0,44) scale(1,-1)">
            <polygon points="17,4 3,36 17,28 31,36" fill="url(#ptrGrad)" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="17" cy="8" r="4.5" fill="#F59E0B" stroke="#fff" strokeWidth="1.5" />
          </g>
        </svg>
      </div>

      <svg
        ref={wheelRef}
        className="sp-wheel-svg"
        width={svgSize} height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        style={{ transition: 'none' }}
      >
        {/* outer decorative rings */}
        <circle cx={cx} cy={cy} r={r + 12} fill="none" stroke={`${primaryColor}4D`} strokeWidth="10" />
        <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />

        {slices.map((s, i) => (
          <g key={i}>
            <path d={s.d}
              fill={s.color}
              stroke={settings?.wheel_bg_color || 'rgba(255,255,255,0.15)'}
              strokeWidth="2"
            />
            <text
              x={s.tx} y={s.ty}
              textAnchor="middle" dominantBaseline="middle"
              fill={s.textColor}
              fontSize={Math.max(8, Math.min(12, size / 24))}
              fontWeight="800"
              transform={`rotate(${s.angle + 90 + 90}, ${s.tx}, ${s.ty})`}
              style={{ pointerEvents: 'none', fontFamily: 'Inter, sans-serif' }}
            >
              {s.label.length > 14 ? s.label.slice(0, 13) + '…' : s.label}
            </text>
          </g>
        ))}

        {/* center hub */}
        <circle cx={cx} cy={cy} r={btnR + 8} fill={`${primaryColor}26`} />
        <circle cx={cx} cy={cy} r={btnR + 4} fill="none" stroke="rgba(245,158,11,0.4)" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={btnR} fill={center}
          stroke="rgba(245,158,11,0.6)" strokeWidth="3"
          style={{ cursor: spinning ? 'not-allowed' : 'pointer' }}
          onClick={!spinning ? onSpin : undefined}
        />
        {centerImg ? (
          <image href={centerImg} x={cx - btnR * 0.6} y={cy - btnR * 0.6} width={btnR * 1.2} height={btnR * 1.2}
            style={{ clipPath: `circle(${btnR * 0.6}px at ${cx}px ${cy}px)`, pointerEvents: 'none' }} />
        ) : (
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#fff"
            fontSize={size * 0.06} fontWeight="900"
            style={{ pointerEvents: 'none', fontFamily: 'Inter, sans-serif', letterSpacing: 2 }}>
            {label}
          </text>
        )}
      </svg>
    </div>
  )
})

function ResultOverlay({ segment, settings, onClose }) {
  const isPrize = segment.segment_type === 'prize'

  if (!isPrize) {
    const loseMsg = segment.lose_message || "Oops! The wheel wasn't in your favor this time. Better luck on your next spin! 🍀"
    return (
      <div className="sp-result-overlay">
        <div className="sp-result-card" style={{ textAlign:'center' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>😔</div>
          <h2 style={{ margin:'0 0 12px', fontWeight:800, color:'#fff', fontSize:22, lineHeight:1.3 }}>
            {loseMsg}
          </h2>
          <button className="sp-claim-btn" onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)' }}>
            {settings.continue_button_text || 'Continue'}
          </button>
        </div>
      </div>
    )
  }

  const winMsg = segment.win_message || settings?.win_message || 'Congratulations! You won!'

  return (
    <div className="sp-result-overlay">
      <div className="sp-result-card">
        {segment.overlay_image_url
          ? <img src={segment.overlay_image_url} alt="" style={{ width: '100%', borderRadius: 16, marginBottom: 20, objectFit: 'contain', maxHeight: 200 }} />
          : <div className="sp-result-emoji">🎉</div>
        }

        <div className="sp-result-label" style={{ background: segment.bg_color || '#7C6FF7', color: segment.text_color || '#fff' }}>
          {segment.label}
        </div>

        <p className="sp-result-msg">{winMsg}</p>

        {segment.prize_description && (
          <p className="sp-result-desc">{segment.prize_description}</p>
        )}

        {segment.coupon_code && (
          <div className="sp-coupon-box">
            <div className="sp-coupon-label">Your Coupon Code</div>
            <div className="sp-coupon-code">{segment.coupon_code}</div>
          </div>
        )}

        {segment.coupon_image_url && (
          <img src={segment.coupon_image_url} alt="coupon" style={{ width: '80%', borderRadius: 12, marginBottom: 20 }} />
        )}

        <button className="sp-claim-btn" onClick={onClose}>
          🎉 Claim Reward
        </button>
      </div>
    </div>
  )
}

function Confetti() {
  const canvasRef = useRef()
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const pieces = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: 6 + Math.random() * 8,
      d: Math.random() * 90,
      color: ['#7C6FF7', '#F59E0B', '#EC4899', '#10B981', '#3B82F6', '#EF4444'][Math.floor(Math.random() * 6)],
      tilt: Math.random() * 10 - 5,
      tiltAngle: 0,
      tiltAngleIncrement: Math.random() * 0.07 + 0.05,
    }))
    let frame
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pieces.forEach(p => {
        p.tiltAngle += p.tiltAngleIncrement
        p.y += (Math.cos(p.d) + 1.5)
        p.tilt = Math.sin(p.tiltAngle) * 15
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width }
        ctx.beginPath()
        ctx.lineWidth = p.r / 2
        ctx.strokeStyle = p.color
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y)
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4)
        ctx.stroke()
      })
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 200 }} />
}

export default function SpinPlayerPage({ gameData, sessionToken: initToken, sessionId: initSessionId, onSessionStart, onComplete }) {
  const [phase, setPhase] = useState('ready')
  const [resultSegment, setResultSegment] = useState(null)
  const [sessionToken, setSessionToken] = useState(initToken)
  const [sessionId, setSessionId] = useState(initSessionId)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [prizesWon, setPrizesWon] = useState(0)
  const [spinsLeft, setSpinsLeft] = useState(1)
  const [bestWin, setBestWin] = useState(null)
  const spinLock = useRef(false)
  const rotationRef = useRef(0)
  const velocityRef = useRef(0)
  const animFrameRef = useRef(null)
  const tickAudioCtx = useRef(null)
  const tickNoiseBuffer = useRef(null)
  const wheelRef = useRef(null)

  const settings = gameData?.settings || {}
  const segments = gameData?.segments || []
  const soundMap = gameData?.soundMap || {}
  const primaryColor = settings.primary_color || '#7C6FF7'

  const resolveSound = (id) => {
    if (!id) return null
    const n = parseInt(id)
    if (!isNaN(n)) return soundMap[n] || null
    return id
  }

  const playSound = (url) => {
    if (!url) return
    try { new Audio(url).play().catch(() => {}) } catch (_) {}
  }

  useEffect(() => {
    if (phase !== 'done' || !settings.redirect_url || !settings.redirect_delay) return
    const delay = parseInt(settings.redirect_delay)
    if (!delay || delay <= 0) return
    const timer = setTimeout(() => {
      window.top.location.href = settings.redirect_url
    }, delay * 1000)
    return () => clearTimeout(timer)
  }, [phase, settings.redirect_url, settings.redirect_delay])

  const pickWinner = useCallback(() => {
    if (!segments.length) return null
    const total = segments.reduce((s, seg) => s + (parseInt(seg.weight) || 1), 0)
    let rand = Math.random() * total
    for (let i = 0; i < segments.length; i++) {
      rand -= (parseInt(segments[i].weight) || 1)
      if (rand <= 0) return i
    }
    return segments.length - 1
  }, [segments])

  const playTick = useCallback(() => {
    try {
      if (!tickAudioCtx.current) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        tickAudioCtx.current = ctx
        const sr = ctx.sampleRate
        const len = Math.floor(sr * 0.04)
        const buf = ctx.createBuffer(1, len, sr)
        const data = buf.getChannelData(0)
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
        tickNoiseBuffer.current = buf
      }
      const ctx = tickAudioCtx.current
      if (ctx.state === 'suspended') ctx.resume()
      const buf = tickNoiseBuffer.current
      if (!buf) return

      const now = ctx.currentTime
      const volume = 0.20
      const duration = 0.018
      const pitchJitter = (Math.random() - 0.5) * 200
      const mainFreq = 2200 + pitchJitter
      const lowFreq = 700

      // Main high-frequency click
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = mainFreq
      const oscGain = ctx.createGain()
      oscGain.gain.setValueAtTime(volume * 0.55, now)
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      // Low-frequency body
      const low = ctx.createOscillator()
      low.type = 'sine'
      low.frequency.value = lowFreq
      const lowGain = ctx.createGain()
      lowGain.gain.setValueAtTime(volume * 0.25, now)
      lowGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 1.2)

      // Mechanical texture (bandpass noise)
      const src = ctx.createBufferSource()
      src.buffer = buf
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = mainFreq
      bp.Q.value = 1.2
      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(volume * 0.35, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      osc.connect(oscGain)
      oscGain.connect(ctx.destination)
      low.connect(lowGain)
      lowGain.connect(ctx.destination)
      src.connect(bp)
      bp.connect(noiseGain)
      noiseGain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + duration + 0.01)
      low.start(now)
      low.stop(now + duration * 1.2 + 0.01)
      src.start(now)
      src.stop(now + duration + 0.01)
    } catch (_) {}
  }, [])

  const simulateDistance = useCallback((v0) => {
    let v = v0
    let total = 0
    while (v > 0.05) {
      v *= v > 20 ? 0.992 : v > 5 ? 0.985 : 0.96
      total += v * (1 / 60)
    }
    return total
  }, [])

  const findInitialVelocity = useCallback((targetDeg) => {
    let lo = 0, hi = 3000
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2
      if (mid === lo || mid === hi) break
      if (simulateDistance(mid) < targetDeg) lo = mid
      else hi = mid
    }
    return (lo + hi) / 2
  }, [simulateDistance])

  const animateSpin = useCallback((startRotationVal, totalRotationVal, winner, token) => {
    const totalAngleNeeded = totalRotationVal - startRotationVal
    const v0 = findInitialVelocity(totalAngleNeeded)
    const count = segments.length || 1
    const sliceAngle = 360 / count
    let lastSegIdx = -1

    velocityRef.current = v0
    rotationRef.current = startRotationVal

    const setRot = (deg) => {
      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${deg}deg) translateZ(0)`
      }
    }

    const frame = () => {
      const vel = velocityRef.current
      const friction = vel > 20 ? 0.992 : vel > 5 ? 0.985 : 0.96
      velocityRef.current = vel * friction
      rotationRef.current += velocityRef.current * (1 / 60)
      const currentRot = rotationRef.current

      setRot(currentRot)

      const norm = ((currentRot % 360) + 360) % 360
      const segIdx = Math.floor(norm / sliceAngle) % count
      if (segIdx !== lastSegIdx) {
        lastSegIdx = segIdx
        playTick()
      }

      if (velocityRef.current > 0.05) {
        animFrameRef.current = requestAnimationFrame(frame)
        return
      }

      // Bounce back
      const finalRot = totalRotationVal
      let bounceFrame = 0
      const bounceFrames = 8
      const bounceAmplitude = 3

      const bounce = () => {
        bounceFrame++
        const progress = bounceFrame / bounceFrames
        const dampening = Math.max(0, 1 - progress * 1.2)
        const offset = bounceAmplitude * Math.sin(progress * Math.PI * 2.5) * dampening
        setRot(finalRot + offset)

        if (bounceFrame < bounceFrames) {
          animFrameRef.current = requestAnimationFrame(bounce)
        } else {
          setRot(finalRot)
          rotationRef.current = finalRot % 360

          setTimeout(() => {
            setResultSegment(winner)
            setPhase('result')
            playSound(resolveSound(winner.sound_id || (winner.segment_type === 'prize' ? settings.sound_win_id : settings.sound_lose_id)))

            if (winner.segment_type === 'prize') {
              setPrizesWon(prev => prev + 1)
              if (!bestWin || (winner.weight || 0) > (bestWin.weight || 0)) {
                setBestWin({ label: winner.label, weight: winner.weight })
              }
            }

            try {
              api.post('/play/session/complete', {
                session_token: token,
                score: winner.segment_type === 'prize' ? 1 : 0,
                player_data: {
                  segment_id: winner.id,
                  segment_label: winner.label,
                  segment_type: winner.segment_type,
                  coupon_code: winner.coupon_code || null,
                  prize_description: winner.prize_description || null,
                }
              }).then(res => {
                if (onComplete && res.data) {
                  window.__spinCompleteData = res.data
                }
              })
            } catch (_) {}

            spinLock.current = false
          }, 350)
        }
      }

      bounce()
    }

    animFrameRef.current = requestAnimationFrame(frame)
  }, [segments, settings, bestWin, onComplete, resolveSound, playSound, playTick, findInitialVelocity])

  const handleSpin = async () => {
    if (spinLock.current || phase !== 'ready') return
    spinLock.current = true

    ensureAudio()

    let token = sessionToken
    let sid = sessionId
    if (!token) {
      try {
        const playerUser = JSON.parse(localStorage.getItem('playerUser') || '{}')
        const src = new URLSearchParams(window.location.search).get('source') === 'direct' ? 'direct' : 'link'
        const res = await api.post('/play/session/start', {
          game_id: gameData.id,
          player_data: {},
          source_type: src,
          promo_player_id: playerUser.id || null,
        })
        if (!res.data.success) {
          if (res.data.message === 'already_played') {
            setAlreadyPlayed(true)
            spinLock.current = false
            return
          }
          throw new Error(res.data.message)
        }
        token = res.data.session_token
        sid = res.data.session_id
        setSessionToken(token)
        setSessionId(sid)
        if (onSessionStart) onSessionStart(token, sid)
      } catch (err) {
        setErrorMsg(err.message || 'Could not start game')
        spinLock.current = false
        return
      }
    }

    const winnerIdx = pickWinner()
    if (winnerIdx === null) { spinLock.current = false; return }

    const winner = segments[winnerIdx]
    const count = segments.length || 1
    const sliceAngle = 360 / count
    const targetSegMidDeg = (winnerIdx + 0.5) * sliceAngle
    const fullSpins = 6 + Math.floor(Math.random() * 3)
    const randomOffset = (Math.random() - 0.5) * sliceAngle * 0.12
    const targetRestingAngle = ((360 - targetSegMidDeg + randomOffset) % 360 + 360) % 360
    const currentAngle = ((rotationRef.current % 360) + 360) % 360
    let diffToTarget = targetRestingAngle - currentAngle
    if (diffToTarget < 0) diffToTarget += 360
    const totalRotationVal = rotationRef.current + fullSpins * 360 + diffToTarget

    playSound(resolveSound(settings.sound_spin_id))
    setPhase('spinning')
    setSpinsLeft(prev => Math.max(0, prev - 1))

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    animateSpin(rotationRef.current, totalRotationVal, winner, token)
  }

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (tickAudioCtx.current) tickAudioCtx.current.close()
    }
  }, [])

  const ensureAudio = useCallback(() => {
    try {
      if (tickAudioCtx.current) {
        if (tickAudioCtx.current.state === 'suspended') tickAudioCtx.current.resume()
        return
      }
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      tickAudioCtx.current = ctx
      const sr = ctx.sampleRate
      const len = Math.floor(sr * 0.04)
      const buf = ctx.createBuffer(1, len, sr)
      const data = buf.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
      tickNoiseBuffer.current = buf

      // Pre-warm: play a near-silent buffer to force the audio pipeline to initialize.
      // Without this, the first real tick is delayed 50-200ms while the browser spins up
      // the audio rendering thread.
      const warmup = ctx.createBufferSource()
      warmup.buffer = buf
      const warmGain = ctx.createGain()
      warmGain.gain.setValueAtTime(0.001, ctx.currentTime)
      warmup.connect(warmGain)
      warmGain.connect(ctx.destination)
      warmup.start()
      warmup.stop(ctx.currentTime + 0.02)
    } catch (_) {}
  }, [])

  const handleResultClose = () => {
    const data = window.__spinCompleteData || {}
    const isWin = resultSegment?.segment_type === 'prize'
    if (settings.spin_mode === 'unlimited') {
      window.__spinCompleteData = null
      setResultSegment(null)
      setPhase('ready')
      setSpinsLeft(prev => prev)
    } else {
      window.__spinCompleteData = null
      setResultSegment(null)
      if (onComplete) {
        onComplete({ ...data, redirect_url: settings.redirect_url || gameData.redirect_url })
      } else {
        setPhase('done')
      }
    }
  }

  const font = settings.font_family ? `'${settings.font_family}', sans-serif` : "'Inter', sans-serif"
  const bgColor = settings.bg_color || ''
  const bgImage = settings.bg_image_url

  const bodyStyle = {
    fontFamily: font,
    ...(bgImage ? {
      background: `url(${bgImage}) center/cover no-repeat, #0f0a1e`,
    } : bgColor ? {
      background: `linear-gradient(160deg, ${bgColor} 0%, ${bgColor} 100%)`,
    } : {})
  }

  if (alreadyPlayed) {
    return (
      <>
        <style>{PREMIUM_STYLES}</style>
        <div className="sp-body" style={bodyStyle}>
          <div className="sp-content" style={{ minHeight: '100dvh', justifyContent: 'center' }}>
            <div className="sp-already-card">
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎡</div>
              <h2 style={{ margin: '0 0 10px', fontWeight: 800, color: '#fff', fontSize: 22 }}>Already Played!</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 14 }}>You've already spun this wheel. Come back for more games!</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (errorMsg) {
    return (
      <>
        <style>{PREMIUM_STYLES}</style>
        <div className="sp-body" style={bodyStyle}>
          <div className="sp-content" style={{ minHeight: '100dvh', justifyContent: 'center' }}>
            <div className="sp-error-card">
              <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>{errorMsg}</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (phase === 'done') {
    const autoRedirect = settings.redirect_url && settings.redirect_delay
    return (
      <>
        <style>{PREMIUM_STYLES}</style>
        <div className="sp-body" style={bodyStyle}>
          <Confetti />
          <div className="sp-content" style={{ minHeight: '100dvh', justifyContent: 'center' }}>
            <div className="sp-done-card">
              {settings.submit_confirm_gif_url
                ? <img src={settings.submit_confirm_gif_url} alt="" style={{ maxWidth:'100%', maxHeight:160, objectFit:'contain', borderRadius:16, marginBottom:16 }} />
                : <div style={{ fontSize: 64, marginBottom: 16 }}>🎊</div>
              }
              <h2 style={{ margin: '0 0 10px', fontWeight: 800, color: '#fff', fontSize: 24 }}>{settings.outro_text || 'Thanks for playing!'}</h2>
              {settings.thankyou_subtitle && <p style={{ color: settings.thankyou_subtitle_color || 'rgba(255,255,255,0.5)', fontSize: 14 }}>{settings.thankyou_subtitle}</p>}
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16, width:'100%' }}>
                {settings.submit_button_text && (
                  <a href={settings.redirect_url || '#'} target={settings.redirect_open_new_tab ? '_blank' : '_self'} rel="noopener noreferrer"
                    style={{ display:'block', textAlign:'center', padding:'14px 28px', borderRadius:12, background:settings.submit_button_bg_color||`linear-gradient(135deg,${primaryColor},${primaryColor}cc)`, color:settings.submit_button_text_color||'#fff', fontWeight:700, fontSize:15, textDecoration:'none', boxShadow:`0 6px 24px ${primaryColor}44` }}>
                    {settings.submit_button_text}
                  </a>
                )}
                {settings.redirect_url && settings.continue_button_text && (
                  <a href={settings.redirect_url} target={settings.redirect_open_new_tab ? '_blank' : '_self'} rel="noopener noreferrer"
                    style={{ display:'block', textAlign:'center', padding:'12px 24px', borderRadius:12, background:settings.continue_button_bg_color||'rgba(255,255,255,0.1)', color:settings.continue_button_text_color||'#fff', fontWeight:600, fontSize:14, textDecoration:'none', border:'1px solid rgba(255,255,255,0.15)' }}>
                    {settings.continue_button_text}
                  </a>
                )}
              </div>
              {autoRedirect && (
                <p style={{ color:'rgba(255,255,255,0.35)', fontSize:11, marginTop:12 }}>Redirecting in {settings.redirect_delay}s…</p>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{PREMIUM_STYLES}</style>
      <style>{`.sp-body::before { background: radial-gradient(circle, ${primaryColor}1f 0%, transparent 70%); }
.sp-wheel-glow { background: radial-gradient(circle, ${primaryColor}33 0%, transparent 70%); }
.sp-spin-btn:active:not(:disabled) { box-shadow: 0 0 12px ${primaryColor}66, 0 4px 16px rgba(0,0,0,0.3); }`}</style>
      <div className="sp-body" style={bodyStyle}>
        <div className="sp-content">

          {/* Card: Logo + Title + Wheel + Spin Button */}
          <div style={{ position:'relative', padding:'10%', borderRadius:24, background:'rgba(255,255,255,0.06)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 10px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', alignItems:'center', gap:16, width:'100%', boxSizing:'border-box' }}>
            {settings.game_logo_url && (
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <img src={settings.game_logo_url} alt="Logo" style={{ maxWidth: '100%', maxHeight: 432, width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 10, display: 'block' }} />
              </div>
            )}
            {settings.heading_1 && (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'Inter, sans-serif', fontSize:28, fontWeight:700, color:settings.heading_1_color||'#ffffff', lineHeight:1.2, textShadow:'0 2px 12px rgba(0,0,0,0.3)' }}>{settings.heading_1}</div>
                {settings.heading_2 && <div style={{ fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:500, color:settings.heading_2_color||'rgba(255,255,255,0.55)', marginTop:6 }}>{settings.heading_2}</div>}
              </div>
            )}
            {segments.length > 0 ? (
              <SpinWheel
                segments={segments}
                spinning={phase === 'spinning'}
                settings={settings}
                onSpin={handleSpin}
                wheelRef={wheelRef}
              />
            ) : (
              <div style={{ width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                No segments configured
              </div>
            )}
            {segments.length > 0 && (
              <button
                className="sp-spin-btn"
                onClick={handleSpin}
                disabled={phase !== 'ready'}
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc, ${primaryColor})`, boxShadow: `0 0 24px ${primaryColor}80, 0 0 48px ${primaryColor}33, 0 8px 32px rgba(0,0,0,0.3)`, margin: 0 }}
              >
                {phase === 'spinning' ? '⏳ Spinning…' : '⭐ SPIN!'}
              </button>
            )}
            {settings.spin_mode === 'unlimited' && phase === 'ready' && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: -8 }}>Spin as many times as you like!</div>
            )}
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', textAlign:'center', marginTop:4 }}>🛡️ Good luck! Every spin is a chance to win!</div>
          </div>

        </div>

        {/* Result overlay */}
        {phase === 'result' && resultSegment && (
          <ResultOverlay segment={resultSegment} settings={settings} onClose={handleResultClose} />
        )}
      </div>
    </>
  )
}
