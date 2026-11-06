import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import api from '../../apps/frontend/src/api'

// The shared axios instance (apps/frontend/src/api) reports completions to
// /api/play/session/complete — a real backend session that may earn PromoCoins.

const STYLES = `
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{transform:scale(0);opacity:0}50%{transform:scale(1.18)}100%{transform:scale(1);opacity:1}}
@keyframes scorePop{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
@keyframes confettiFall{0%{transform:translateY(-10vh) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}
@keyframes flyFromBottom{from{transform:translateY(110vh) scale(.9);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
@keyframes float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-14px) rotate(4deg)}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes sparkle{0%,100%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1)}}
@keyframes floatUp{0%{transform:translateY(0) translateX(0);opacity:.5}50%{opacity:1}100%{transform:translateY(-100vh) translateX(20px);opacity:0}}
@keyframes crystalFloat{0%,100%{transform:translateY(0) rotate(0deg) scale(1)}33%{transform:translateY(-18px) rotate(5deg) scale(1.02)}66%{transform:translateY(-8px) rotate(-3deg) scale(.98)}}
@keyframes orbPulse{0%,100%{opacity:.12;transform:scale(1)}50%{opacity:.25;transform:scale(1.08)}}
@keyframes starTwinkle{0%,100%{opacity:.2;transform:scale(.8) rotate(0deg)}50%{opacity:1;transform:scale(1.1) rotate(180deg)}}
@keyframes neonPulse{0%,100%{box-shadow:0 0 15px rgba(123,46,255,.3),0 0 30px rgba(123,46,255,.15)}50%{box-shadow:0 0 25px rgba(123,46,255,.5),0 0 50px rgba(123,46,255,.25)}}
@keyframes waveMove{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes particleDrift{0%{transform:translate(0,0) scale(1);opacity:.6}50%{opacity:1}100%{transform:translate(var(--dx,30px),var(--dy,-60px)) scale(0);opacity:0}}
@keyframes bloomPulse{0%,100%{opacity:.08}50%{opacity:.18}}
@keyframes crownBounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-3px)}}
@keyframes tilePop{0%{opacity:0}100%{opacity:1}}
@keyframes borderGlow{0%{box-shadow:0 0 0 0 rgba(255,255,255,0),0 0 0 0 rgba(157,92,255,0)}35%{box-shadow:0 0 0 4px rgba(255,255,255,1),0 0 30px rgba(180,130,255,.7),0 0 60px rgba(157,92,255,.4),0 0 90px rgba(120,60,220,.2)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0),0 0 0 0 rgba(157,92,255,0)}}
@keyframes legendaryGlow{0%,100%{box-shadow:0 0 20px var(--glow),0 0 40px var(--glow),0 4px 12px rgba(0,0,0,.35)}50%{box-shadow:0 0 35px var(--glow),0 0 70px var(--glow),0 4px 16px rgba(0,0,0,.4)}}
@keyframes legendaryShine{0%{background-position:200% center}100%{background-position:-200% center}}
@keyframes sparkleFloat{0%,100%{opacity:0;transform:scale(0) rotate(0deg)}50%{opacity:1;transform:scale(1) rotate(180deg)}}
@keyframes popupIn{0%{opacity:0;transform:scale(.8) translateY(20px)}100%{opacity:1;transform:scale(1) translateY(0)}}

.p2048-bg{
  position:fixed;inset:0;z-index:0;pointer-events:none;
  background:linear-gradient(160deg,#2A004F 0%,#350068 20%,#4B0082 45%,#5E10A0 65%,#7B2EFF 100%);
}
.p2048-vignette{
  position:fixed;inset:0;z-index:0;pointer-events:none;
  background:radial-gradient(ellipse at center,transparent 40%,rgba(20,0,40,.55) 100%);
}
.p2048-bloom{
  position:fixed;z-index:0;pointer-events:none;border-radius:50%;
  background:radial-gradient(circle,rgba(193,107,255,.18) 0%,transparent 70%);
  animation:orbPulse 6s ease-in-out infinite;
}
.p2048-wave{
  position:fixed;bottom:0;left:0;width:200%;height:180px;z-index:0;pointer-events:none;opacity:.06;
  background:repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(193,107,255,.3) 40px,rgba(193,107,255,.3) 42px);
  animation:waveMove 20s linear infinite;
}
.p2048-crystal{
  position:fixed;z-index:0;pointer-events:none;
  animation:crystalFloat 10s ease-in-out infinite;
}
.p2048-star{
  position:fixed;z-index:0;pointer-events:none;
  animation:starTwinkle 4s ease-in-out infinite;
}
.p2048-orb{
  position:fixed;z-index:0;pointer-events:none;border-radius:50%;
  background:radial-gradient(circle,rgba(193,107,255,.35),transparent 70%);
  animation:orbPulse 5s ease-in-out infinite;
}
.p2048-neon-line{
  position:fixed;z-index:0;pointer-events:none;
  height:2px;border-radius:1px;opacity:.12;
  background:linear-gradient(90deg,transparent,rgba(193,107,255,.6),rgba(224,64,251,.6),transparent);
}
.p2048-particle{
  position:fixed;z-index:0;pointer-events:none;border-radius:50%;
  background:rgba(199,125,255,.5);
  animation:particleDrift var(--dur,8s) linear infinite;
}
`

function loadFont(font) {
  if (!font || font === 'DM Sans') return
  const id = 'gf-' + font.replace(/\s/g, '-')
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id; link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700;800;900&display=swap`
  document.head.appendChild(link)
}

let _audioCtx = null
function getAudioCtx() {
  if (!_audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext
    _audioCtx = new AC()
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume()
  return _audioCtx
}

function playSound(url) {
  if (!url) return
  try { new Audio(url).play().catch(() => {}) } catch {}
}

function playWinSound() {
  try {
    const ctx = getAudioCtx()
    const t = ctx.currentTime
    const chordFreqs = [261.6, 329.6, 392, 523.3, 659.3]
    chordFreqs.forEach(freq => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.06, t + 0.08)
      gain.gain.setValueAtTime(0.06, t + 0.6)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 1.4)
    })
    const arp = [523, 659, 784, 1047, 1319, 1568]
    arp.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, t + i * 0.09)
      gain.gain.setValueAtTime(0, t + i * 0.09)
      gain.gain.linearRampToValueAtTime(0.08, t + i * 0.09 + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.3)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t + i * 0.09)
      osc.stop(t + i * 0.09 + 0.3)
    })
    const shimmer = ctx.createOscillator()
    const shimGain = ctx.createGain()
    shimmer.type = 'sine'
    shimmer.frequency.setValueAtTime(2093, t + 0.6)
    shimmer.frequency.exponentialRampToValueAtTime(3136, t + 1.0)
    shimGain.gain.setValueAtTime(0, t + 0.6)
    shimGain.gain.linearRampToValueAtTime(0.03, t + 0.65)
    shimGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1)
    shimmer.connect(shimGain).connect(ctx.destination)
    shimmer.start(t + 0.6)
    shimmer.stop(t + 1.1)
    const sub = ctx.createOscillator()
    const subGain = ctx.createGain()
    sub.type = 'sine'
    sub.frequency.setValueAtTime(65, t)
    subGain.gain.setValueAtTime(0.08, t)
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2)
    sub.connect(subGain).connect(ctx.destination)
    sub.start(t)
    sub.stop(t + 1.2)
  } catch {}
}

function playLoseSound() {
  try {
    const ctx = getAudioCtx()
    const t = ctx.currentTime
    const chord = [392, 466.2, 554.4]
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t + i * 0.05)
      gain.gain.setValueAtTime(0, t + i * 0.05)
      gain.gain.linearRampToValueAtTime(0.06, t + i * 0.05 + 0.02)
      gain.gain.setValueAtTime(0.06, t + 0.8)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t + i * 0.05)
      osc.stop(t + 1.2)
    })
    const fall = [523, 440, 370, 294]
    fall.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, t + 0.3 + i * 0.15)
      gain.gain.setValueAtTime(0, t + 0.3 + i * 0.15)
      gain.gain.linearRampToValueAtTime(0.07, t + 0.3 + i * 0.15 + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3 + i * 0.15 + 0.25)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t + 0.3 + i * 0.15)
      osc.stop(t + 0.3 + i * 0.15 + 0.25)
    })
    const sub = ctx.createOscillator()
    const subGain = ctx.createGain()
    sub.type = 'sine'
    sub.frequency.setValueAtTime(55, t)
    subGain.gain.setValueAtTime(0.06, t)
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0)
    sub.connect(subGain).connect(ctx.destination)
    sub.start(t)
    sub.stop(t + 1.0)
  } catch {}
}

function playSlideSound() {
  try {
    const ctx = getAudioCtx()
    const now = ctx.currentTime
    if (now - _lastSlide.t < 0.05) return
    _lastSlide.t = now
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.06)
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.12)
    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.12)
    const bufferSize = ctx.sampleRate * 0.08
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 4) * 0.3
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.04, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    noise.connect(noiseGain).connect(ctx.destination)
    noise.start(now)
    noise.stop(now + 0.08)
  } catch {}
}

function playMergeCrash() {
  try {
    const ctx = getAudioCtx()
    const now = ctx.currentTime
    if (now - _lastMerge.t < 0.05) return
    _lastMerge.t = now
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(420, now)
    osc1.frequency.exponentialRampToValueAtTime(180, now + 0.12)
    gain1.gain.setValueAtTime(0.15, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    osc1.connect(gain1).connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.15)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now)
    osc2.frequency.exponentialRampToValueAtTime(660, now + 0.08)
    gain2.gain.setValueAtTime(0.08, now)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    osc2.connect(gain2).connect(ctx.destination)
    osc2.start(now)
    osc2.stop(now + 0.1)
    const bufferSize = ctx.sampleRate * 0.04
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 6)
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.06, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    noise.connect(noiseGain).connect(ctx.destination)
    noise.start(now)
    noise.stop(now + 0.05)
  } catch {}
}

const _lastSlide = { t: 0 }
const _lastMerge = { t: 0 }

function vibrate(pattern) {
  try {
    const nav = window.navigator || navigator
    if (nav && nav.vibrate) nav.vibrate(pattern || 10)
  } catch (e) {}
}

function getLuminance(hex) {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16) / 255
  const g = parseInt(c.substring(2, 4), 16) / 255
  const b = parseInt(c.substring(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const TILE_COLORS = {
  2:    { bg: '#FFFFFF', tc: '#7B2EFF', glow: 'rgba(123,46,255,.00)', border: '#E8DEFF' },
  4:    { bg: '#F3EAFF', tc: '#7B2EFF', glow: 'rgba(123,46,255,.12)', border: '#DFD0FF' },
  8:    { bg: '#E6D4FF', tc: '#6B2BFF', glow: 'rgba(107,43,255,.18)', border: '#D0BBFF' },
  16:   { bg: '#D5B8FF', tc: '#5A1FD6', glow: 'rgba(90,31,214,.25)',  border: '#BFA0FF' },
  32:   { bg: '#C299FF', tc: '#4B1FB3', glow: 'rgba(100,31,214,.30)', border: '#A87FFF' },
  64:   { bg: '#AB75FF', tc: '#FFFFFF', glow: 'rgba(171,117,255,.35)', border: '#9255FF' },
  128:  { bg: '#9452FF', tc: '#FFFFFF', glow: 'rgba(148,82,255,.42)',  border: '#7C38FF' },
  256:  { bg: '#7C38FF', tc: '#FFFFFF', glow: 'rgba(124,56,255,.50)',  border: '#6420FF' },
  512:  { bg: '#6420FF', tc: '#FFFFFF', glow: 'rgba(100,32,255,.58)',  border: '#5010E6' },
  1024: { bg: '#5010D4', tc: '#FFFFFF', glow: 'rgba(80,16,212,.65)',   border: '#3C05B8' },
  2048: { bg: '#3A00A8', tc: '#FFFFFF', glow: 'rgba(58,0,168,.80)',    border: '#5A20E0', legendary: true },
  4096: { bg: '#280080', tc: '#FFFFFF', glow: 'rgba(40,0,128,.85)',    border: '#4810C0', legendary: true },
}

function getTileStyle(value) {
  if (TILE_COLORS[value]) return TILE_COLORS[value]
  if (value > 2048) return { bg: '#280080', tc: '#FFFFFF', glow: 'rgba(40,0,128,.90)', border: '#4810C0', legendary: true }
  return { bg: '#3A00A8', tc: '#FFFFFF', glow: 'rgba(58,0,168,.80)', border: '#5A20E0', legendary: true }
}

let tileIdCounter = 0
function nextTileId() { return ++tileIdCounter }

function createEmptyGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(null))
}

function addRandomTile(grid) {
  const empty = []
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[0].length; c++)
      if (!grid[r][c]) empty.push([r, c])
  if (!empty.length) return false
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  grid[r][c] = { value: Math.random() < 0.9 ? 2 : 4, id: nextTileId() }
  return true
}

function slideRow(row) {
  const cells = row.filter(c => c !== null)
  let score = 0
  for (let i = 0; i < cells.length - 1; i++) {
    if (cells[i].value === cells[i + 1].value) {
      const v = cells[i].value * 2
      cells[i] = { value: v, id: nextTileId() }
      score += v
      cells.splice(i + 1, 1)
    }
  }
  while (cells.length < row.length) cells.push(null)
  return { row: cells, score }
}

function moveLeft(grid) {
  let ts = 0
  const g = grid.map(r => { const { row, score } = slideRow([...r]); ts += score; return row })
  return { grid: g, score: ts }
}
function moveRight(grid) {
  const rev = grid.map(r => [...r].reverse())
  const { grid: rg, score } = moveLeft(rev)
  return { grid: rg.map(r => [...r].reverse()), score }
}
function moveUp(grid) {
  const s = grid.length
  const t = Array.from({ length: s }, (_, c) => grid.map(r => r[c]))
  const { grid: tg, score } = moveLeft(t)
  return { grid: Array.from({ length: s }, (_, r) => tg.map(c => c[r])), score }
}
function moveDown(grid) {
  const s = grid.length
  const t = Array.from({ length: s }, (_, c) => grid.map(r => r[c]))
  const { grid: tg, score } = moveRight(t)
  return { grid: Array.from({ length: s }, (_, r) => tg.map(c => c[r])), score }
}

function gridToString(grid) {
  return grid.map(r => r.map(c => c ? c.value : 0).join(',')).join('|')
}

function isGameOver(grid) {
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[0].length; c++) {
      if (!grid[r][c]) return false
      const v = grid[r][c].value
      if (c + 1 < grid[0].length && grid[r][c + 1]?.value === v) return false
      if (r + 1 < grid.length && grid[r + 1]?.[c]?.value === v) return false
    }
  return true
}

function hasWon(grid, target) {
  return grid.some(r => r.some(c => c && c.value >= target))
}

function CrystalSVG({ size = 30, opacity = 0.08 }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 30 42" fill="none" style={{ opacity }}>
      <path d="M15 0L28 12L22 42H8L2 12Z" fill="url(#cryG)" />
      <path d="M15 0L8 12L15 42L22 12Z" fill="rgba(193,107,255,.3)" />
      <defs>
        <linearGradient id="cryG" x1="2" y1="0" x2="28" y2="42">
          <stop offset="0%" stopColor="#C66BFF" stopOpacity=".4" />
          <stop offset="100%" stopColor="#7B2EFF" stopOpacity=".1" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function StarSVG({ size = 12, opacity = 0.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ opacity }}>
      <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#D6B8FF" />
    </svg>
  )
}

function BackgroundLayer() {
  return (
    <>
      <div className="p2048-bg" />
      <div className="p2048-vignette" />
      <div className="p2048-bloom" style={{ width: 400, height: 400, top: '5%', left: '-8%' }} />
      <div className="p2048-bloom" style={{ width: 300, height: 300, bottom: '10%', right: '-5%', animationDelay: '2s' }} />
      <div className="p2048-bloom" style={{ width: 250, height: 250, top: '45%', left: '50%', transform: 'translateX(-50%)', animationDelay: '4s' }} />
      <div className="p2048-wave" />
      {[
        { left: '8%', top: '12%', size: 28, delay: '0s', dur: '9s' },
        { left: '88%', top: '25%', size: 22, delay: '2s', dur: '11s' },
        { left: '15%', top: '70%', size: 18, delay: '4s', dur: '13s' },
        { left: '82%', top: '65%', size: 24, delay: '1s', dur: '10s' },
        { left: '50%', top: '8%', size: 16, delay: '3s', dur: '12s' },
      ].map((c, i) => (
        <div key={`cry-${i}`} className="p2048-crystal" style={{ left: c.left, top: c.top, animationDelay: c.delay, animationDuration: c.dur }}>
          <CrystalSVG size={c.size} />
        </div>
      ))}
      {[
        { left: '20%', top: '18%', size: 10, delay: '0s' },
        { left: '75%', top: '15%', size: 8, delay: '1s' },
        { left: '60%', top: '75%', size: 12, delay: '2s' },
        { left: '10%', top: '55%', size: 7, delay: '3s' },
        { left: '90%', top: '50%', size: 9, delay: '0.5s' },
        { left: '40%', top: '85%', size: 6, delay: '2.5s' },
        { left: '70%', top: '40%', size: 11, delay: '1.5s' },
      ].map((s, i) => (
        <div key={`st-${i}`} className="p2048-star" style={{ left: s.left, top: s.top, animationDelay: s.delay }}>
          <StarSVG size={s.size} />
        </div>
      ))}
      {[
        { left: '25%', top: '30%', size: 80, delay: '0s' },
        { left: '70%', top: '20%', size: 60, delay: '3s' },
        { left: '15%', top: '80%', size: 70, delay: '1.5s' },
        { left: '80%', top: '75%', size: 50, delay: '2s' },
      ].map((o, i) => (
        <div key={`ob-${i}`} className="p2048-orb" style={{ left: o.left, top: o.top, width: o.size, height: o.size, animationDelay: o.delay }} />
      ))}
      <div className="p2048-neon-line" style={{ left: '5%', top: '35%', width: 120, transform: 'rotate(25deg)' }} />
      <div className="p2048-neon-line" style={{ left: '80%', top: '55%', width: 90, transform: 'rotate(-20deg)' }} />
      <div className="p2048-neon-line" style={{ left: '45%', top: '15%', width: 100, transform: 'rotate(10deg)' }} />
      {Array.from({ length: 10 }, (_, i) => (
        <div key={`pt-${i}`} className="p2048-particle" style={{
          left: `${8 + Math.random() * 84}%`,
          bottom: '-5px',
          width: 3 + Math.random() * 3,
          height: 3 + Math.random() * 3,
          '--dx': `${(Math.random() - 0.5) * 60}px`,
          '--dy': `${-40 - Math.random() * 80}px`,
          '--dur': `${6 + Math.random() * 8}s`,
          animationDelay: `${Math.random() * 10}s`,
        }} />
      ))}
    </>
  )
}

function Game2048PlayerPage({ gameData, sessionToken, onComplete }) {
  const game = gameData
  const settings = game.settings || {}
  const soundMap = game.soundMap || {}

  const gridSize = parseInt(settings.grid_size) || 4
  const targetNumber = parseInt(settings.target_number) || 2048
  const showTimer = Number(settings.show_timer) === 1
  const timeLimit = parseInt(settings.time_limit_seconds) || 0

  const [phase] = useState('playing')
  const [grid, setGrid] = useState(null)
  const [tiles, setTiles] = useState([])
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(game?.high_score || 0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [wonState, setWonState] = useState(false)
  const [lostState, setLostState] = useState(false)
  const [scoreAnim, setScoreAnim] = useState(false)
  const isCompleteRef = useRef(false)
  const soundMapRef = useRef(soundMap)
  const timerRef = useRef(null)
  const gridRef = useRef(null)
  const scoreRef = useRef(0)
  const boardWrapRef = useRef(null)
  const boardAreaRef = useRef(null)

  const tileColors = useMemo(() => {
    const raw = settings.tile_colors
    if (!raw) return null
    if (typeof raw === 'object') return raw
    try { return JSON.parse(raw) } catch { return null }
  }, [settings.tile_colors])

  const [winW, setWinW] = useState(typeof window !== 'undefined' ? window.innerWidth : 400)
  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const isMobile = winW < 480
  const isSmall = winW < 360
  const padX = isMobile ? 16 : 20
  const maxC = Math.min(winW - padX * 2, 480)
  const cellSize = Math.max(isMobile ? 32 : 38, Math.min(isMobile ? 70 : 85, Math.floor((maxC - (gridSize + 1) * (isMobile ? 8 : 10)) / gridSize)))
  const gap = isMobile ? 8 : 10
  const boardSize = gridSize * cellSize + (gridSize + 1) * gap

  const resolveSound = useCallback((id) => {
    if (!id) return null
    const n = parseInt(id)
    return isNaN(n) ? id : (soundMapRef.current[n] || null)
  }, [])

  useEffect(() => { loadFont(settings.font_family) }, [settings.font_family])

  const initGame = useCallback(() => {
    tileIdCounter = 0
    const g = createEmptyGrid(gridSize)
    addRandomTile(g); addRandomTile(g)
    const flat = []
    for (let r = 0; r < g.length; r++)
      for (let c = 0; c < g[0].length; c++)
        if (g[r][c]) flat.push({ ...g[r][c], row: r, col: c })
    setGrid(g); setTiles(flat); gridRef.current = g
    setScore(0); scoreRef.current = 0
    setWonState(false); setLostState(false)
  }, [gridSize])

  const handleMove = useCallback((direction) => {
    const g = gridRef.current
    if (!g || wonState || lostState) return
    const before = gridToString(g)
    let result
    switch (direction) {
      case 'left': result = moveLeft(g); break
      case 'right': result = moveRight(g); break
      case 'up': result = moveUp(g); break
      case 'down': result = moveDown(g); break
      default: return
    }
    if (before === gridToString(result.grid)) return
    playSlideSound()
    playSound(resolveSound(settings.sound_slide_id))
    try { navigator.vibrate(6) } catch {}
    if (result.score > 0) {
      playMergeCrash()
      playSound(resolveSound(settings.sound_merge_id))
      try { navigator.vibrate([8, 40, 8]) } catch {}
    }
    const ns = scoreRef.current + result.score
    scoreRef.current = ns; setScore(ns); setScoreAnim(true)
    setTimeout(() => setScoreAnim(false), 200)
    if (ns > bestScore) {
      setBestScore(ns)
      try { localStorage.setItem('g2048_best_' + game.id, String(ns)) } catch {}
    }
    addRandomTile(result.grid); gridRef.current = result.grid
    const flat = []
    for (let r = 0; r < result.grid.length; r++)
      for (let c = 0; c < result.grid[0].length; c++)
        if (result.grid[r][c]) flat.push({ ...result.grid[r][c], row: r, col: c })
    setGrid(result.grid); setTiles(flat)
    if (hasWon(result.grid, targetNumber) && !wonState) {
      setWonState(true); playWinSound(); playSound(resolveSound(settings.sound_win_id))
      try { navigator.vibrate([30, 80, 30, 80, 30, 80, 30]) } catch {}
      return
    }
    if (isGameOver(result.grid)) {
      setLostState(true); playLoseSound(); playSound(resolveSound(settings.sound_lose_id))
      try { navigator.vibrate([80, 40, 80, 40, 80]) } catch {}
      clearInterval(timerRef.current)
    }
  }, [wonState, lostState, bestScore, targetNumber, settings, resolveSound, game.id])

  useEffect(() => {
    if (phase !== 'playing') return
    initGame()
    setBestScore(prev => { try { const s = localStorage.getItem('g2048_best_' + game.id); return s ? Math.max(prev, parseInt(s)) : Math.max(prev, game?.high_score || 0) } catch { return Math.max(prev, game?.high_score || 0) } })
  }, [phase, initGame, game.id])

  useEffect(() => {
    if (phase !== 'playing' || !showTimer || timeLimit <= 0) return
    setTimeLeft(timeLimit)
    timerRef.current = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { clearInterval(timerRef.current); setLostState(true); playLoseSound(); playSound(resolveSound(settings.sound_lose_id)); return 0 } return p - 1 })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, showTimer, timeLimit, settings, resolveSound])

  // Focus the board as soon as we can play, so keydown events reach us
  // immediately (fixes arrow keys not responding until you click first).
  useEffect(() => {
    if (phase === 'playing' && boardWrapRef.current) {
      boardWrapRef.current.focus()
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'playing') return
    const handleKey = (e) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          e.preventDefault(); handleMove('up'); break
        case 'ArrowDown': case 's': case 'S':
          e.preventDefault(); handleMove('down'); break
        case 'ArrowLeft': case 'a': case 'A':
          e.preventDefault(); handleMove('left'); break
        case 'ArrowRight': case 'd': case 'D':
          e.preventDefault(); handleMove('right'); break
      }
    }
    // Capture phase on document — more reliable than a plain window
    // listener when focus isn't already sitting on the page/iframe.
    document.addEventListener('keydown', handleKey, true)
    // Swipe handling is scoped to the board itself (NOT the whole page):
    // calling preventDefault() on touchstart suppresses the browser's
    // synthetic click event, so doing it at page level made every button
    // (New Game / Keep Going / Continue / Try Again) dead on touch devices.
    let ts = null
    const onStart = (e) => {
      // Prevent scroll/zoom while swiping the board.
      const t = e.touches[0]
      if (t) {
        try { e.preventDefault() } catch {}
        try { navigator.vibrate(6) } catch {}
        ts = { x: t.clientX, y: t.clientY }
      }
    }
    const onMove = (e) => { try { e.preventDefault() } catch {} }
    const onEnd = (e) => {
      if (!ts) return
      const t = e.changedTouches[0]
      if (!t) { ts = null; return }
      const dx = t.clientX - ts.x
      const dy = t.clientY - ts.y
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) handleMove(dx > 0 ? 'right' : 'left')
      else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 20) handleMove(dy > 0 ? 'down' : 'up')
      ts = null
    }
    const board = boardAreaRef.current
    if (board) {
      board.addEventListener('touchstart', onStart, { passive: false })
      board.addEventListener('touchend', onEnd)
      board.addEventListener('touchmove', onMove, { passive: false })
    }
    return () => {
      document.removeEventListener('keydown', handleKey, true)
      if (board) {
        board.removeEventListener('touchstart', onStart)
        board.removeEventListener('touchend', onEnd)
        board.removeEventListener('touchmove', onMove)
      }
    }
  }, [handleMove, phase])

  const handleKeepGoing = () => { try { navigator.vibrate(10) } catch {}; setWonState(false) }

  const handleClaimPrize = async () => {
    try { navigator.vibrate(10) } catch {}
    if (isCompleteRef.current) return
    isCompleteRef.current = true; clearInterval(timerRef.current)
    if (!sessionToken) { onComplete?.({ redirect_url: game.redirect_url }); return }
    try { const r = await api.post('/play/session/complete', { session_token: sessionToken, score: scoreRef.current, player_data: { game_type: '2048', grid_size: gridSize, target_number: targetNumber, won: true } }); onComplete?.(r.data) }
    catch { onComplete?.({ redirect_url: game.redirect_url }) }
  }

  const handleGameOver = async () => {
    try { navigator.vibrate(10) } catch {}
    if (isCompleteRef.current) return
    isCompleteRef.current = true; clearInterval(timerRef.current)
    if (!sessionToken) { onComplete?.({ redirect_url: game.redirect_url }); return }
    try { const r = await api.post('/play/session/complete', { session_token: sessionToken, score: scoreRef.current, player_data: { game_type: '2048', grid_size: gridSize, target_number: targetNumber, won: false } }); onComplete?.(r.data) }
    catch { onComplete?.({ redirect_url: game.redirect_url }) }
  }

  const handleNewGame = () => {
    try { navigator.vibrate(12) } catch {}
    initGame(); setWonState(false); setLostState(false)
    if (showTimer && timeLimit > 0) setTimeLeft(timeLimit)
    boardWrapRef.current?.focus()
  }

  const animIn = settings.overlay_animation_in || 'flyFromBottom'

  return (
    <div
      ref={boardWrapRef}
      tabIndex={0}
      onClick={() => boardWrapRef.current?.focus()}
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: `"${settings.font_family || 'DM Sans'}", sans-serif`,
        padding: '12px 16px 24px', position: 'relative', overflow: 'hidden', color: '#F2E8FF',
        outline: 'none',
      }}>
      <style>{STYLES}</style>
      <BackgroundLayer />
      <div style={{
        position: 'fixed', top: '42%', left: '50%', transform: 'translate(-50%,-50%)',
        width: boardSize * 1.6, height: boardSize * 1.6,
        background: 'radial-gradient(circle, rgba(123,46,255,.22) 0%, rgba(193,107,255,.08) 40%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: Math.max(boardSize + 20, 360), margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 12, position: 'relative' }}>
          <div style={{ position:'relative', display:'inline-block' }}>
            <h1 style={{
              fontSize: isSmall ? 32 : isMobile ? 38 : 42, fontWeight: 900, margin: 0, letterSpacing: isSmall ? -1 : -2,
              background: 'linear-gradient(135deg, #C58EFF 0%, #8C3DFF 30%, #6F25E8 60%, #C58EFF 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 18px rgba(123,46,255,.6)) drop-shadow(0 0 36px rgba(140,61,255,.3))',
              animation: 'shimmer 4s ease-in-out infinite',
            }}>
              2048
            </h1>
            <div style={{
              width: '80%', height: 3, margin: '2px auto 0',
              background: 'linear-gradient(90deg, transparent, #C58EFF, #8C3DFF, #C58EFF, transparent)',
              borderRadius: 2, boxShadow: '0 0 12px rgba(140,61,255,.6), 0 0 24px rgba(123,46,255,.3)',
            }} />
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap: isMobile ? 8 : 10, marginBottom: isMobile ? 10 : 14 }}>
          <div style={{
            background: 'rgba(42,0,79,.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(193,107,255,.35)', borderRadius: isMobile ? 12 : 14,
            padding: isMobile ? '6px 12px' : '8px 18px', textAlign: 'center', minWidth: isMobile ? 72 : 90,
            boxShadow: '0 0 20px rgba(123,46,255,.15), inset 0 1px 0 rgba(255,255,255,.06)',
          }}>
            <div style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, color: '#C58EFF', textTransform: 'uppercase', letterSpacing: 1 }}>Score</div>
            <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: '#fff', marginTop: 2, textShadow: '0 0 10px rgba(140,61,255,.5)', animation: scoreAnim ? 'scorePop .2s ease' : 'none' }}>{score}</div>
          </div>
          <div style={{
            background: 'rgba(42,0,79,.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(193,107,255,.35)', borderRadius: isMobile ? 12 : 14,
            padding: isMobile ? '6px 12px' : '8px 18px', textAlign: 'center', minWidth: isMobile ? 72 : 90,
            boxShadow: '0 0 20px rgba(123,46,255,.15), inset 0 1px 0 rgba(255,255,255,.06)',
          }}>
            <div style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, color: '#C58EFF', textTransform: 'uppercase', letterSpacing: 1 }}>Best</div>
            <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: '#fff', marginTop: 2, textShadow: '0 0 10px rgba(140,61,255,.5)' }}>{bestScore}</div>
          </div>
          {showTimer && timeLimit > 0 && (
            <div style={{
              background: timeLeft <= 10 ? 'rgba(255,60,120,.25)' : 'rgba(42,0,79,.65)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: `1.5px solid ${timeLeft <= 10 ? 'rgba(255,60,120,.5)' : 'rgba(193,107,255,.35)'}`,
              borderRadius: isMobile ? 12 : 14, padding: isMobile ? '6px 12px' : '8px 18px', textAlign: 'center', minWidth: isMobile ? 60 : 75,
              boxShadow: timeLeft <= 10 ? '0 0 24px rgba(255,60,120,.25)' : '0 0 20px rgba(123,46,255,.15)',
              animation: timeLeft <= 10 ? 'neonPulse 1s ease-in-out infinite' : 'none',
            }}>
              <div style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, color: '#C58EFF', textTransform: 'uppercase', letterSpacing: 1 }}>Time</div>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: timeLeft <= 10 ? '#C58EFF' : '#fff', marginTop: 2 }}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>
          )}
        </div>
        <div ref={boardAreaRef} style={{
          position: 'relative', width: boardSize, height: boardSize, margin: '0 auto',
          background: 'linear-gradient(145deg, rgba(28,0,52,.94) 0%, rgba(18,0,38,.96) 100%)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '2px solid rgba(140,61,255,.3)',
          borderRadius: Math.max(14, Math.min(28, cellSize * 0.35)), padding: gap, boxSizing: 'border-box',
          boxShadow: `0 0 60px rgba(123,46,255,.18), 0 0 120px rgba(123,46,255,.06), 0 20px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05), inset 0 -1px 0 rgba(0,0,0,.3)`,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
            gap: `${gap}px`,
          }}>
            {Array.from({ length: gridSize * gridSize }).map((_, i) => (
              <div key={i} style={{ width: cellSize, height: cellSize, background: 'rgba(30,5,65,.5)', borderRadius: Math.max(10, Math.min(20, cellSize * 0.22)), border: '1px solid rgba(80,30,160,.08)' }} />
            ))}
          </div>
          {tiles.map(tile => {
            const ts = getTileStyle(tile.value)
            const fs = tile.value >= 10000 ? cellSize * 0.22 : tile.value >= 1000 ? cellSize * 0.28 : tile.value >= 100 ? cellSize * 0.36 : cellSize * 0.42
            const isLegendary = ts.legendary
            const isNew = tile.id === tileIdCounter
            return (
              <div key={tile.id} style={{
                position: 'absolute', top: 0, left: 0,
                width: cellSize, height: cellSize,
                borderRadius: Math.max(10, Math.min(20, cellSize * 0.22)),
                background: `linear-gradient(145deg, ${ts.bg} 0%, ${ts.bg} 35%, ${ts.bg}cc 70%, ${ts.bg}aa 100%)`,
                color: ts.tc,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: fs,
                transition: 'transform 60ms ease-out',
                transform: `translate(${tile.col * (cellSize + gap) + gap}px, ${tile.row * (cellSize + gap) + gap}px)`,
                zIndex: 10,
                animation: isNew ? 'borderGlow .35s ease-out' : isLegendary ? 'legendaryGlow 3s ease-in-out infinite' : 'none',
                lineHeight: 1,
                boxShadow: [
                  '0 16px 32px -4px rgba(0,0,0,.3)',
                  '0 6px 12px -2px rgba(0,0,0,.22)',
                  `0 0 20px -4px ${ts.glow}`,
                  'inset 2px 2px 6px rgba(255,255,255,.45)',
                  'inset -2px -2px 8px rgba(0,0,0,.12)',
                  'inset 0 -4px 8px rgba(0,0,0,.1)',
                ].join(', '),
                border: `1px solid ${ts.border || 'rgba(255,255,255,.08)'}`,
                textShadow: isLegendary ? '0 2px 4px rgba(0,0,0,.5), 0 0 16px rgba(255,255,255,.5)' : '0 1px 3px rgba(0,0,0,.3)',
              }}>
                <span style={{ position: 'relative', zIndex: 1 }}>{tile.value}</span>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
          <button onClick={handleNewGame} style={{
            padding: isMobile ? '10px 28px' : '12px 36px', borderRadius: 50,
            border: '1.5px solid rgba(193,107,255,.45)',
            background: 'linear-gradient(135deg, #8C3DFF 0%, #6F25E8 50%, #5618C9 100%)',
            color: '#fff', fontSize: isMobile ? 13 : 15, fontWeight: 800, cursor: 'pointer',
            fontFamily: 'inherit', letterSpacing: .5,
            boxShadow: '0 8px 24px rgba(86,24,201,.45), 0 3px 10px rgba(86,24,201,.25), inset 0 1px 0 rgba(255,255,255,.2)',
            textShadow: '0 1px 3px rgba(0,0,0,.3)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {settings.new_game_button_text || 'NEW GAME'}
          </button>
        </div>
      </div>

      {wonState && !lostState && (
        <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #1a0033 0%, #2a0055 50%, #1a0033 100%)', animation:'fadeIn .3s ease' }}>
          <div style={{ textAlign:'center', animation:'popupIn .5s cubic-bezier(.34,1.56,.64,1)', padding:'0 24px', width:'100%', maxWidth:380 }}>
            <div style={{
              background:'rgba(30,0,60,.75)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
              border:'1.5px solid rgba(157,92,255,.4)', borderRadius:28,
              padding:'36px 28px 32px', maxWidth:360, margin:'0 auto',
              boxShadow:'0 0 80px rgba(123,46,255,.2), 0 20px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08)',
            }}>
              <div style={{ fontSize: 60, marginBottom:16 }}>🎉</div>
              <h2 style={{ fontSize:26, fontWeight:900, margin:'0 0 4px', color:'#fff' }}>You Win!</h2>
              <p style={{ fontSize:24, fontWeight:900, margin:'0 0 24px', background:'linear-gradient(135deg,#C58EFF,#9D5CFF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Score: {score}</p>
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button onClick={handleKeepGoing} style={{
                  padding:'14px 24px', borderRadius:50, border:'2px solid rgba(193,107,255,.5)',
                  background:'transparent', color:'#C58EFF', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                }}>Keep Going</button>
                <button onClick={handleClaimPrize} style={{
                  padding:'14px 24px', borderRadius:50, border:'none',
                  background:'linear-gradient(135deg,#B97AFF 0%,#9D5CFF 40%,#7B2EFF 100%)',
                  color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
                }}>{settings.claim_prize_button_text || 'Continue'} →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {lostState && (
        <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #1a0033 0%, #2a0055 50%, #1a0033 100%)', animation:'fadeIn .3s ease' }}>
          <div style={{ textAlign:'center', animation:'popupIn .5s cubic-bezier(.34,1.56,.64,1)', padding:'0 24px', width:'100%', maxWidth:380 }}>
            <div style={{
              background:'rgba(30,0,60,.75)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
              border:'1.5px solid rgba(157,92,255,.4)', borderRadius:28,
              padding:'36px 28px 32px', maxWidth:360, margin:'0 auto',
              boxShadow:'0 0 80px rgba(123,46,255,.15), 0 20px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08)',
            }}>
              <div style={{ fontSize: 60, marginBottom:16 }}>😞</div>
              <h2 style={{ fontSize:28, fontWeight:900, margin:'0 0 8px', background:'linear-gradient(135deg,#C58EFF,#9D5CFF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Game Over</h2>
              <p style={{ fontSize:16, color:'#D6B8FF', margin:'0 0 6px' }}>No moves left!</p>
              <p style={{ fontSize:15, color:'#B14DFF', margin:'0 0 28px' }}>Final Score: <strong style={{ color:'#C58EFF' }}>{score}</strong></p>
              <button onClick={handleNewGame} style={{
                width:'100%', padding:'16px', borderRadius:50, border:'none',
                background:'linear-gradient(135deg,#B97AFF 0%,#9D5CFF 40%,#7B2EFF 100%)',
                color:'#fff', fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
              }}>🔄 Try Again →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Default export: wraps the component with sample game data so it renders standalone ──
export default function Game2048Demo() {
  const sampleGameData = {
    id: 'demo-2048',
    settings: {
      grid_size: 4,
      target_number: 2048,
      show_timer: 0,
      time_limit_seconds: 0,
      font_family: 'DM Sans',
    },
    soundMap: {},
    redirect_url: null,
  }
  return (
    <Game2048PlayerPage
      gameData={sampleGameData}
      sessionToken={null}
      onComplete={(result) => console.log('Game complete:', result)}
    />
  )
}
