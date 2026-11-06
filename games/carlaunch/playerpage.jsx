import { useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

function playSound(url) { if (!url) return; try { const a = new Audio(url); a.play().catch(() => {}) } catch {} }

export default function CarLaunchPlayerPage({ gameData, sessionToken, onComplete }) {
  const { settings, soundMap } = gameData || {}
  const soundMapRef = useRef(soundMap || {})
  useEffect(() => { soundMapRef.current = soundMap || {} }, [soundMap])

  const resolveSound = useCallback((id) => {
    if (!id) return null
    return soundMapRef.current[id] || null
  }, [])

  const [phase, setPhase] = useState('intro')
  const completedRef = useRef(false)
  const scoreRef = useRef(0)

  const car =
    settings?.car_info
      ? (() => {
          try {
            return typeof settings.car_info === 'string'
              ? JSON.parse(settings.car_info)
              : settings.car_info
          } catch {
            return {}
          }
        })()
      : {}

  const make = settings?.car_make || ''
  const model = settings?.car_model || ''
  const year = settings?.car_year || 2024
  const trim = settings?.car_trim || ''
  const hp = Number(settings?.engine_hp || 400)
  const torque = Number(settings?.engine_torque || 400)
  const zeroToSixty = Number(settings?.zero_to_60 || 3.5)
  const weightKg = Number(settings?.weight_kg || 1500)
  const drivetrain = settings?.drivetrain || 'RWD'
  const quarterMileTime = Number(settings?.quarter_mile || 11.5)
  const quarterMileSpeed = 200
  const topSpeed = 320
  const gears = Number(settings?.gears || 8)
  const redline = 7000
  const carImage = settings?.car_model_url || ''
  const carLogo = settings?.game_logo_url || ''

  const colorOptions = (() => {
    try {
      const raw = settings?.color_options
      if (!raw) return null
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  })() || ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ffffff', '#000000']

  const [selectedColor, setSelectedColor] = useState(colorOptions[0] || '#ef4444')
  const [raceResult, setRaceResult] = useState(null)
  const [raceStats, setRaceStats] = useState(null)

  const threeCanvasRef = useRef(null)
  const raceCanvasRef = useRef(null)
  const raceAnimRef = useRef(null)
  const sceneRef = useRef(null)
  const carBodyRef = useRef(null)

  useEffect(() => {
    if (phase !== 'config' || !threeCanvasRef.current) return

    const canvas = threeCanvasRef.current
    const w = canvas.clientWidth
    const h = canvas.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
    camera.position.set(5, 3, 6)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 3
    controls.maxDistance = 15
    controls.target.set(0, 0.4, 0)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const dl1 = new THREE.DirectionalLight(0xffffff, 1.2)
    dl1.position.set(5, 8, 5)
    scene.add(dl1)

    const dl2 = new THREE.DirectionalLight(0xffffff, 0.6)
    dl2.position.set(-3, 4, -3)
    scene.add(dl2)

    const group = new THREE.Group()

    // Load GLB if available, else procedural
    const modelUrl = settings?.car_model_url
    if (modelUrl) {
      const loader = new GLTFLoader()
      loader.load(modelUrl, (gltf) => {
        const model = gltf.scene
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            if (child.material) {
              child.material = child.material.clone()
              child.material.metalness = 0.6
              child.material.roughness = 0.4
            }
          }
        })
        // Scale & center
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 3.5 / maxDim
        model.scale.setScalar(scale)
        box.setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        model.position.sub(center.multiplyScalar(scale))
        group.add(model)
        carBodyRef.current = model
      }, undefined, (err) => {
        console.error('GLB load failed:', err)
        buildProceduralCar()
      })
    } else {
      buildProceduralCar()
    }

    function buildProceduralCar() {
      const bodyGeo = new THREE.BoxGeometry(1.8, 0.5, 3.6)
      const bodyMat = new THREE.MeshStandardMaterial({ color: selectedColor, roughness: 0.4, metalness: 0.6 })
      const body = new THREE.Mesh(bodyGeo, bodyMat)
      body.position.y = 0.35
      body.castShadow = true
      group.add(body)
      carBodyRef.current = body

      const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.6, metalness: 0.3 })
      const cabinGeo = new THREE.BoxGeometry(1.5, 0.35, 1.8)
      const cabin = new THREE.Mesh(cabinGeo, cabinMat)
      cabin.position.set(0, 0.7, -0.3)
      cabin.castShadow = true
      group.add(cabin)

      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })
      const wheelPositions = [
        [-0.85, 0.15, 1.2],
        [0.85, 0.15, 1.2],
        [-0.85, 0.15, -1.2],
        [0.85, 0.15, -1.2],
      ]
      wheelPositions.forEach((pos) => {
        const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16)
        const wheel = new THREE.Mesh(wheelGeo, wheelMat)
        wheel.position.set(pos[0], pos[1], pos[2])
        wheel.rotation.z = Math.PI / 2
        group.add(wheel)

        const rimGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 8)
        const rimMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 })
        const rim = new THREE.Mesh(rimGeo, rimMat)
        rim.position.set(pos[0], pos[1], pos[2])
        rim.rotation.z = Math.PI / 2
        group.add(rim)
      })

      const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 0.3 })
      const headlightPositions = [[-0.5, 0.25, 1.85], [0.5, 0.25, 1.85]]
      headlightPositions.forEach((pos) => {
        const hlGeo = new THREE.SphereGeometry(0.08, 8, 8)
        const hl = new THREE.Mesh(hlGeo, headlightMat)
        hl.position.set(pos[0], pos[1], pos[2])
        group.add(hl)
      })

      const taillightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.2 })
      const taillightPositions = [[-0.5, 0.25, -1.85], [0.5, 0.25, -1.85]]
      taillightPositions.forEach((pos) => {
        const tlGeo = new THREE.SphereGeometry(0.07, 8, 8)
        const tl = new THREE.Mesh(tlGeo, taillightMat)
        tl.position.set(pos[0], pos[1], pos[2])
        group.add(tl)
      })
    }

    group.position.y = 0
    scene.add(group)

    const floorGeo = new THREE.PlaneGeometry(8, 8)
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3e, roughness: 0.9, metalness: 0.1 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.05
    scene.add(floor)

    function animate() {
      controls.update()
      renderer.render(scene, camera)
      animId = requestAnimationFrame(animate)
    }
    let animId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animId)
      renderer.dispose()
      controls.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, settings?.car_model_url])

  useEffect(() => {
    if (carBodyRef.current && selectedColor) {
      const obj = carBodyRef.current
      if (obj.isMesh) {
        obj.material.color.set(selectedColor)
      } else if (obj.isGroup || obj.isObject3D) {
        obj.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.color.set(selectedColor)
          }
        })
      }
    }
  }, [selectedColor])

  const handleComplete = useCallback(async () => {
    if (completedRef.current) return
    completedRef.current = true
    try {
      if (sessionToken) {
        await fetch('/api/play/session/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_token: sessionToken,
            score: scoreRef.current,
            player_data: raceStats || {},
          }),
        })
      }
    } catch {}
    onComplete?.()
  }, [sessionToken, onComplete, raceStats])

  const startConfig = () => setPhase('config')

  const startRace = () => {
    setPhase('racing')
    const snd = resolveSound(settings?.sound_engine_start_id || settings?.sound_start_id)
    if (snd) playSound(snd)
  }

  const drawSpeedometer = (ctx, cx, cy, r, speed, maxSpeed, label) => {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 4
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(cx, cy, r - 2, 0.75 * Math.PI, 0.25 * Math.PI)
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 3
    ctx.stroke()

    const startAngle = 0.75 * Math.PI
    const endAngle = 0.25 * Math.PI
    const range = endAngle - startAngle
    const normalizedRange = range < 0 ? range + 2 * Math.PI : range
    const angle = startAngle + (speed / maxSpeed) * normalizedRange

    ctx.beginPath()
    ctx.arc(cx, cy, r - 2, startAngle, Math.min(angle, endAngle))
    ctx.strokeStyle = speed > maxSpeed * 0.8 ? '#ef4444' : '#22c55e'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.moveTo(-4, 0)
    ctx.lineTo(8, 0)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()

    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.round(r * 0.35)}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(Math.round(speed), cx, cy + 2)

    ctx.fillStyle = '#888'
    ctx.font = `${Math.round(r * 0.15)}px monospace`
    ctx.fillText(label, cx, cy + r * 0.4)

    ctx.restore()
  }

  useEffect(() => {
    if (phase !== 'racing') return

    const canvas = raceCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 800
    const H = 400
    canvas.width = W
    canvas.height = H

    const gearRatios = []
    for (let i = 0; i < gears; i++) {
      gearRatios.push(3.5 * Math.pow(0.72, i / (gears - 1)))
    }
    const finalDrive = 3.5
    const tireRadius = 0.33
    const redlineRPM = redline

    let currentGear = 0
    let rpm = 800
    let speedMs = 0
    let distance = 0
    let time = 0
    let raceOver = false
    let autoShiftTimer = 0
    const shiftRPM = redlineRPM * 0.92

    const dragFactor = 0.3
    const rrFactor = 0.015
    const g = 9.81
    const mass = weightKg
    const power = hp * 745.7
    const maxTorque = torque * 1.3558

    let quarterTime = 0
    let quarterSpeed = 0
    let maxSpeedReached = 0
    let sixtyTime = 0
    let sixtyLogged = false
    let quarterLogged = false

    let prevSpeedMs = 0
    let accelTimer = 0

    let shiftSndPlayed = false
    let finishSndPlayed = false

    const roadStripes = []
    for (let i = 0; i < 20; i++) {
      roadStripes.push(i * 25)
    }

    function updatePhysics(dt) {
      if (raceOver) return
      const dtSec = dt / 1000
      if (dtSec > 0.05) return

      time += dtSec
      accelTimer += dtSec

      const gearRatio = gearRatios[currentGear] || gearRatios[0]
      const totalRatio = gearRatio * finalDrive

      const forceAtWheels = (maxTorque * totalRatio) / tireRadius

      const engineRPM = (speedMs * totalRatio * 60) / (2 * Math.PI * tireRadius)
      rpm = Math.max(800, Math.min(redlineRPM, engineRPM))

      const torqueCurve = 1 - Math.pow((rpm - 3000) / (redlineRPM - 2000), 2) * 0.3
      const effectiveForce = forceAtWheels * Math.max(0.4, torqueCurve)

      const dragForce = dragFactor * speedMs * speedMs * 0.001
      const rrForce = rrFactor * mass * g * 0.001
      const totalResistance = dragForce + rrForce

      const netForce = effectiveForce - totalResistance
      const accel = Math.max(-20, netForce / mass)

      speedMs += accel * dtSec
      if (speedMs < 0) speedMs = 0

      const speedKmh = speedMs * 3.6
      if (speedKmh > maxSpeedReached) maxSpeedReached = speedKmh

      distance += speedMs * dtSec

      if (!sixtyLogged && speedKmh >= 60) {
        sixtyTime = time
        sixtyLogged = true
      }
      if (!quarterLogged && distance >= 402) {
        quarterTime = time
        quarterSpeed = speedKmh
        quarterLogged = true
        raceOver = true
      }
      if (time >= 30) {
        quarterTime = time
        quarterSpeed = speedKmh
        quarterLogged = true
        raceOver = true
      }
      if (raceOver && !finishSndPlayed) {
        finishSndPlayed = true
        const snd = resolveSound(settings?.sound_finish_id)
        if (snd) playSound(snd)
      }

      if (rpm >= shiftRPM && currentGear < gears - 1) {
        if (autoShiftTimer <= 0) {
          currentGear++
          autoShiftTimer = 0.15
          if (!shiftSndPlayed) {
            shiftSndPlayed = true
            setTimeout(() => { shiftSndPlayed = false }, 200)
          }
          const snd = resolveSound(settings?.sound_shift_id)
          if (snd) playSound(snd)
        }
      }
      if (autoShiftTimer > 0) autoShiftTimer -= dtSec
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)

      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, W, H)

      const roadY1 = 280
      const roadY2 = 360
      const grad = ctx.createLinearGradient(0, roadY1, 0, roadY2)
      grad.addColorStop(0, '#2a2a3e')
      grad.addColorStop(1, '#1a1a2e')
      ctx.fillStyle = grad
      ctx.fillRect(0, roadY1, W, roadY2 - roadY1)

      ctx.strokeStyle = '#444'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, roadY1)
      ctx.lineTo(W, roadY1)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, roadY2)
      ctx.lineTo(W, roadY2)
      ctx.stroke()

      const stripeSpeed = speedMs * 2
      roadStripes.forEach((s, i) => {
        let x = ((s - (time * 80) % 500) % 500 + 500) % 500 - 50
        ctx.fillStyle = '#ffff00'
        ctx.fillRect(x, roadY1 + 10, 20, roadY2 - roadY1 - 20)
      })

      const carX = 120
      const carY = roadY1 + (roadY2 - roadY1) / 2

      const carW = 80
      const carH = 30

      ctx.fillStyle = selectedColor
      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.roundRect(carX - carW / 2, carY - carH / 2, carW, carH, 4)
      ctx.fill()

      ctx.fillStyle = '#1a1a2e'
      ctx.beginPath()
      ctx.roundRect(carX - carW / 2 + 10, carY - carH / 2 - 4, carW - 20, carH - 4, 3)
      ctx.fill()

      ctx.fillStyle = '#222'
      const wheelR = 6
      ;[[-carW / 2 + 10, carY - carH / 2 - 2], [carW / 2 - 10, carY - carH / 2 - 2], [-carW / 2 + 10, carY + carH / 2 + 2], [carW / 2 - 10, carY + carH / 2 + 2]].forEach(([wx, wy]) => {
        ctx.beginPath()
        ctx.arc(carX + wx, wy, wheelR, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.shadowBlur = 0
      ctx.fillStyle = '#ffffaa'
      ctx.beginPath()
      ctx.arc(carX + carW / 2, carY - 4, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(carX + carW / 2, carY + 4, 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#ff0000'
      ctx.beginPath()
      ctx.arc(carX - carW / 2, carY - 4, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(carX - carW / 2, carY + 4, 2.5, 0, Math.PI * 2)
      ctx.fill()

      const speedKmh = speedMs * 3.6
      drawSpeedometer(ctx, 120, 140, 60, speedKmh, topSpeed + 50, 'km/h')
      drawSpeedometer(ctx, 280, 140, 60, rpm, redlineRPM + 1000, 'RPM')

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`GEAR: ${currentGear + 1}`, 360, 80)

      ctx.font = 'bold 24px monospace'
      ctx.fillStyle = '#22c55e'
      ctx.fillText(`${time.toFixed(2)}s`, 360, 120)

      ctx.font = '12px monospace'
      ctx.fillStyle = '#888'
      ctx.fillText(`DISTANCE: ${distance.toFixed(1)}m`, 360, 150)

      if (distance < 402) {
        ctx.fillStyle = '#f59e0b'
        ctx.font = '11px monospace'
        const pct = (distance / 402) * 100
        ctx.fillText(`QUARTER MILE: ${pct.toFixed(1)}%`, 360, 170)
      } else {
        ctx.fillStyle = '#22c55e'
        ctx.font = 'bold 12px monospace'
        ctx.fillText('QUARTER MILE REACHED!', 360, 170)
      }

      if (raceOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(0, 0, W, H)

        ctx.fillStyle = '#fff'
        ctx.font = 'bold 36px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const passed = quarterTime <= quarterMileTime
        ctx.fillStyle = passed ? '#22c55e' : '#ef4444'
        ctx.fillText(passed ? 'PASS' : 'IMPROVE', W / 2, H / 2 - 40)

        ctx.font = '18px monospace'
        ctx.fillStyle = '#ccc'
        ctx.fillText(`1/4 mile: ${quarterTime.toFixed(2)}s (target: ${quarterMileTime.toFixed(1)}s)`, W / 2, H / 2 + 10)
        ctx.fillText(`Trap: ${quarterSpeed.toFixed(1)} km/h`, W / 2, H / 2 + 40)
        ctx.fillText(`0-60: ${sixtyLogged ? sixtyTime.toFixed(2) : 'N/A'}s`, W / 2, H / 2 + 70)

        if (!quarterLogged) {
          quarterTime = time
          quarterSpeed = speedKmh
          quarterLogged = true
        }
      }
    }

    let lastT = 0
    function loop(t) {
      if (!lastT) lastT = t
      const dt = Math.min(t - lastT, 33)
      lastT = t

      if (!raceOver) {
        updatePhysics(dt)
      }

      draw()

      if (raceOver) {
        const passed = quarterTime <= quarterMileTime
        setRaceResult(passed ? 'pass' : 'improve')
        setRaceStats({
          quarter_mile_et: quarterTime,
          quarter_mile_speed: quarterSpeed,
          top_speed: maxSpeedReached,
          zero_to_sixty: sixtyLogged ? sixtyTime : null,
          gear_count: gears,
          passed,
          score: passed ? 1000 : Math.round((1 - (quarterTime - quarterMileTime) / quarterMileTime) * 500),
        })
        scoreRef.current = passed ? 1000 : Math.round(Math.max(0, (1 - (quarterTime - quarterMileTime) / quarterMileTime) * 500))
        setPhase('result')

        const snd = resolveSound(settings?.sound_finish_id)
        if (snd) playSound(snd)

        return
      }

      raceAnimRef.current = requestAnimationFrame(loop)
    }

    raceAnimRef.current = requestAnimationFrame(loop)

    const handleKey = (e) => {
      if ((e.key === ' ' || e.key === 'Space') && !raceOver) {
        e.preventDefault()
        if (currentGear < gears - 1 && rpm >= 1000) {
          currentGear++
          const snd = resolveSound(settings?.sound_shift_id)
          if (snd) playSound(snd)
        }
      }
    }
    const handleClick = () => {
      if (!raceOver && currentGear < gears - 1 && rpm >= 1000) {
        currentGear++
        const snd = resolveSound(settings?.sound_shift_id)
        if (snd) playSound(snd)
      }
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('click', handleClick)

    return () => {
      cancelAnimationFrame(raceAnimRef.current)
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('click', handleClick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    const handleResize = () => {
      if (threeCanvasRef.current && phase === 'config') {
        const c = threeCanvasRef.current
        const w = c.clientWidth
        const h = c.clientHeight
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [phase])

  useEffect(() => {
    return () => {
      if (raceAnimRef.current) cancelAnimationFrame(raceAnimRef.current)
    }
  }, [])

  if (phase === 'intro') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, background: settings?.bg_color || '#0f172a', color: '#fff', padding: 20 }}>
        {carLogo && <img src={carLogo} alt="" style={{ maxWidth: 120, maxHeight: 60 }} />}
        {carImage && <img src={carImage} alt="" style={{ maxWidth: 260, maxHeight: 160, borderRadius: 8, objectFit: 'cover' }} />}
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{make} {model}</h1>
        {year && trim && <p style={{ fontSize: 16, color: '#aaa', margin: 0 }}>{year} • {trim}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13, color: '#ccc', marginTop: 8 }}>
          <span>HP: {hp}</span>
          <span>Torque: {torque} Nm</span>
          <span>0-60: {zeroToSixty}s</span>
          <span>Weight: {(weightKg / 1000).toFixed(1)}t</span>
          <span>Drivetrain: {drivetrain}</span>
          <span>1/4 mi: {quarterMileTime}s</span>
        </div>
        <button
          onClick={startConfig}
          style={{ padding: '12px 36px', fontSize: 16, fontWeight: 700, border: 'none', borderRadius: 8, cursor: 'pointer', background: settings?.primary_color || '#6366f1', color: '#fff', marginTop: 8 }}
        >
          START EXPERIENCE
        </button>
      </div>
    )
  }

  if (phase === 'config') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: settings?.bg_color || '#0f172a', minHeight: '60vh', padding: 0, position: 'relative' }}>
        <div style={{ width: '100%', height: '50vh', minHeight: 300, position: 'relative' }}>
          <canvas ref={threeCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: 8 }}>
            <span style={{ color: '#aaa', fontSize: 12, marginRight: 4 }}>Color:</span>
            {colorOptions.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', border: c === selectedColor ? '2px solid #fff' : '2px solid transparent',
                  background: c, cursor: 'pointer', outline: 'none', padding: 0,
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ padding: '16px 20px', width: '100%', maxWidth: 500, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={startRace}
            style={{ padding: '14px 40px', fontSize: 18, fontWeight: 700, border: 'none', borderRadius: 8, cursor: 'pointer', background: settings?.primary_color || '#6366f1', color: '#fff' }}
          >
            LAUNCH RACE →
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'racing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: settings?.bg_color || '#0f172a', minHeight: '60vh', padding: 12 }}>
        <div style={{ color: '#666', fontSize: 11, marginBottom: 6 }}>Tap/Space to shift up</div>
        <canvas ref={raceCanvasRef} style={{ width: '100%', maxWidth: 800, borderRadius: 8, border: '2px solid #333' }} />
      </div>
    )
  }

  if (phase === 'result') {
    const p = raceStats || {}
    const passed = p.passed
    const score = p.score || 0

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, background: settings?.bg_color || '#0f172a', color: '#fff', padding: 20 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, color: passed ? '#22c55e' : '#ef4444' }}>
          {passed ? 'PASSED' : 'IMPROVE'}
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', fontSize: 14, color: '#ccc' }}>
          <span>0-60 mph</span>
          <span style={{ textAlign: 'right', fontWeight: 700 }}>{p.zero_to_sixty ? `${p.zero_to_sixty.toFixed(2)}s` : 'N/A'} <span style={{ color: '#666', fontWeight: 400 }}>(target: {zeroToSixty}s)</span></span>
          <span>1/4 mile ET</span>
          <span style={{ textAlign: 'right', fontWeight: 700 }}>{p.quarter_mile_et?.toFixed(2)}s <span style={{ color: '#666', fontWeight: 400 }}>(target: {quarterMileTime}s)</span></span>
          <span>Trap Speed</span>
          <span style={{ textAlign: 'right', fontWeight: 700 }}>{p.quarter_mile_speed?.toFixed(1)} km/h <span style={{ color: '#666', fontWeight: 400 }}>(target: {quarterMileSpeed} km/h)</span></span>
          <span>Top Speed</span>
          <span style={{ textAlign: 'right', fontWeight: 700 }}>{p.top_speed?.toFixed(1)} km/h <span style={{ color: '#666', fontWeight: 400 }}>(target: {topSpeed} km/h)</span></span>
        </div>
        <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>SCORE: {score}</div>
        <button
          onClick={handleComplete}
          style={{ padding: '12px 36px', fontSize: 16, fontWeight: 700, border: 'none', borderRadius: 8, cursor: 'pointer', background: settings?.primary_color || '#6366f1', color: '#fff', marginTop: 8 }}
        >
          SUBMIT
        </button>
      </div>
    )
  }

  return null
}
