/**
 * Camera QR scanner built on getUserMedia + jsQR.
 *
 * jsQR is used rather than the native BarcodeDetector API because iOS Safari
 * does not implement BarcodeDetector — and this flow is meant to be walked
 * through on whatever phone the visitor happens to have.
 *
 * Props:
 *   onScan(text)   called once per successful decode (guarded against repeats)
 *   onError(msg)   human-readable camera/permission failure
 *   onClose()      optional — renders a close button when provided
 *   hint           text shown above the viewfinder
 *   accentColor    viewfinder + frame colour, defaults to the brand indigo
 *
 * Notes:
 *   - The camera stream is always stopped on unmount and whenever the user
 *     switches to the manual-code fallback, so the OS indicator goes away.
 *   - iOS requires getUserMedia to be called from a user gesture; the caller
 *     renders this component only after a tap.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

const CAMERA_COOLDOWN_MS = 1500

export default function QrScanner({ onScan, onError, onClose, hint, accentColor = '#4F46E5' }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(0)
  // Guards against the same code firing on every animation frame.
  const lastHitRef = useRef({ value: null, at: 0 })
  const stoppedRef = useRef(false)

  const [cameraState, setCameraState] = useState('starting') // starting | live | error
  const [cameraError, setCameraError] = useState('')
  const [manual, setManual] = useState(false)
  const [manualValue, setManualValue] = useState('')

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const tick = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || stoppedRef.current) return

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Downscale — jsQR cost scales with pixel count and this runs per frame.
      const scale = Math.min(1, 480 / Math.max(video.videoWidth, video.videoHeight))
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })

      if (result && result.data) {
        const now = Date.now()
        const last = lastHitRef.current
        // Cooldown so one physical QR is not reported repeatedly.
        if (last.value !== result.data || now - last.at > CAMERA_COOLDOWN_MS) {
          lastHitRef.current = { value: result.data, at: now }
          navigator.vibrate?.(40)
          onScan?.(result.data)
          return
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [onScan])

  const startCamera = useCallback(async () => {
    // Re-entering camera mode after the manual fallback: the previous effect
    // cleanup set this flag, so clear it before requesting a new stream.
    stoppedRef.current = false
    setCameraState('starting')
    setCameraError('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('error')
      setCameraError('This browser cannot open the camera. Enter the code manually instead.')
      return
    }

    try {
      // environment = back camera, which is what you point at a printed QR.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      if (stoppedRef.current) {
        stream.getTracks().forEach(t => t.stop())
        return
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // iOS Safari needs an explicit play() kicked off from the gesture.
        await videoRef.current.play().catch(() => {})
      }
      setCameraState('live')
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      setCameraState('error')
      if (err?.name === 'NotAllowedError') {
        setCameraError('Camera permission was blocked. Allow camera access in your browser settings, or enter the code manually.')
      } else if (err?.name === 'NotFoundError') {
        setCameraError('No camera found on this device. Enter the code manually instead.')
      } else {
        setCameraError('Could not start the camera. Enter the code manually instead.')
      }
      onError?.('Camera unavailable')
    }
  }, [tick, onError])

  useEffect(() => {
    if (manual) return undefined
    startCamera()
    return () => {
      stoppedRef.current = true
      stopCamera()
    }
  }, [manual, startCamera, stopCamera])

  const submitManual = (e) => {
    e.preventDefault()
    const value = manualValue.trim()
    if (!value) return
    lastHitRef.current = { value, at: Date.now() }
    onScan?.(value)
  }

  if (manual) {
    return (
      <div style={{ fontFamily: "'DM Sans',sans-serif", color: '#1a1a2e' }}>
        <p style={{ margin: '0 0 12px', fontSize: 14, color: '#555' }}>
          {cameraError || 'Type the code printed under the QR code.'}
        </p>
        <form onSubmit={submitManual} style={{ display: 'flex', gap: 8 }}>
          <input
            autoFocus
            value={manualValue}
            onChange={e => setManualValue(e.target.value)}
            placeholder="e.g. 4KD9PQR7TW"
            style={{
              flex: 1, minWidth: 0, padding: '13px 15px', fontSize: 16,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              border: `1.5px solid ${accentColor}`, borderRadius: 12,
              outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '13px 20px', fontSize: 15, fontWeight: 700, color: '#fff',
              background: accentColor, border: 'none', borderRadius: 12, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Go
          </button>
        </form>
        <button
          type="button"
          onClick={() => { setManual(false); setManualValue('') }}
          style={{
            marginTop: 14, background: 'none', border: 'none', padding: 0,
            color: accentColor, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            textDecoration: 'underline', fontFamily: 'inherit',
          }}
        >
          Back to camera
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', fontFamily: "'DM Sans',sans-serif" }}>
      {hint && (
        <p style={{ margin: '0 0 12px', fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 1.5 }}>
          {hint}
        </p>
      )}

      <div
        style={{
          position: 'relative', width: '100%', aspectRatio: '1 / 1',
          borderRadius: 18, overflow: 'hidden', background: '#0b0b16',
          border: `2px solid ${accentColor}33`,
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Viewfinder reticle */}
        <div
          style={{
            position: 'absolute', inset: '14%', pointerEvents: 'none',
            border: `3px solid ${accentColor}`, borderRadius: 16,
            boxShadow: '0 0 0 100vmax rgba(0,0,0,0.34)',
          }}
        />

        {cameraState === 'starting' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 600,
          }}>
            Starting camera…
          </div>
        )}

        {cameraState === 'error' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
            color: '#fff', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32 }}>📷</div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>{cameraError}</div>
            <button
              type="button"
              onClick={() => setManual(true)}
              style={{
                padding: '11px 20px', fontSize: 14, fontWeight: 700, color: accentColor,
                background: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Enter code manually
            </button>
          </div>
        )}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            style={{
              position: 'absolute', top: 10, right: 10, width: 34, height: 34,
              borderRadius: 17, border: 'none', cursor: 'pointer',
              background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 19, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        )}
      </div>

      {cameraState === 'live' && (
        <button
          type="button"
          onClick={() => setManual(true)}
          style={{
            marginTop: 14, width: '100%', padding: '13px', fontSize: 14, fontWeight: 700,
            color: accentColor, background: `${accentColor}12`, border: `1.5px solid ${accentColor}55`,
            borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Enter code manually instead
        </button>
      )}
    </div>
  )
}
