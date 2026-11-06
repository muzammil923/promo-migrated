import { useRef, useEffect } from 'react'

export default function WaveformPlayer({ duration = 0, currentTime = 0, isPlaying = false }) {
  const canvasRef = useRef(null)
  const barsRef = useRef([])

  useEffect(() => {
    if (barsRef.current.length === 0) {
      const bars = []
      for (let i = 0; i < 60; i++) {
        bars.push(0.2 + Math.random() * 0.8)
      }
      barsRef.current = bars
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const bars = barsRef.current
    const barCount = bars.length
    const gap = 2
    const barWidth = (w - gap * (barCount - 1)) / barCount
    const progress = duration > 0 ? currentTime / duration : 0

    ctx.clearRect(0, 0, w, h)

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap)
      const barH = bars[i] * h * 0.9
      const y = (h - barH) / 2
      const played = (i / barCount) < progress

      ctx.fillStyle = played ? 'rgba(139, 92, 246, 1)' : 'rgba(255, 255, 255, 0.25)'
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barH, 1)
      ctx.fill()
    }
  }, [currentTime, duration, isPlaying])

  return (
    <div style={{ width: '100%', padding: '0 4px', marginBottom: 16 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 48, display: 'block', borderRadius: 8 }} />
    </div>
  )
}
