import LogoLoader from '../components/LogoLoader'

import useTTS from '../hooks/useTTS'
import renderMedia, { isVideoUrl } from '../components/renderMedia'
import { inAnim } from '../components/animations'
import { useParams, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import PlayerAuthModal from '../components/PlayerAuthModal'
import ShareMenu from '../components/ShareMenu'
import { attachPromoCoinCapture } from '../lib/promocoins'

// ── Lazy-load game player pages ──────────────────────────────────────────────
// Each game is only downloaded when the user actually plays it, instead of all
// 40+ games being bundled into the initial PlayerPage chunk.
const CrosswordPlayerPage = lazy(() => import('@games/crossword/playerpage.jsx'))
const SpinPlayerPage = lazy(() => import('@games/spin/playerpage.jsx'))
const MemoryPlayerPage = lazy(() => import('@games/memory/playerpage.jsx'))
const JigsawPlayerPage = lazy(() => import('@games/jigsaw/playerpage.jsx'))
const WordSearchPlayerPage = lazy(() => import('@games/wordsearch/playerpage.jsx'))
const PouringPlayerPage = lazy(() => import('@games/pouring/playerpage.jsx'))
const TyperPlayerPage = lazy(() => import('@games/typer/playerpage.jsx'))
const MathPlayerPage = lazy(() => import('@games/math/playerpage.jsx'))
const MazePlayerPage = lazy(() => import('@games/classicmaze/playerpage.jsx'))
const StickMazePlayerPage = lazy(() => import('@games/stickmaze/playerpage.jsx'))
const Game2048PlayerPage = lazy(() => import('@games/2048/playerpage.jsx'))
const SnakePlayerPage = lazy(() => import('@games/snake/playerpage.jsx'))
const NagarajaPlayerPage = lazy(() => import('@games/nagaraja/playerpage.jsx'))
const CatchPlayerPage = lazy(() => import('@games/catch/playerpage.jsx'))
const ReactionPlayerPage = lazy(() => import('@games/reaction/playerpage.jsx'))
const SimonPlayerPage = lazy(() => import('@games/simon/playerpage.jsx'))
const FlappyPlayerPage = lazy(() => import('@games/flappy/playerpage.jsx'))
const BouncePlayerPage = lazy(() => import('@games/bounce/playerpage.jsx'))
const BejeweledPlayerPage = lazy(() => import('@games/bejeweled/playerpage.jsx'))
const SpacePlayerPage = lazy(() => import('@games/space/playerpage.jsx'))
const Connect4PlayerPage = lazy(() => import('@games/connect4/playerpage.jsx'))
const BowlingPlayerPage = lazy(() => import('@games/bowling/playerpage.jsx'))
const SudokuPlayerPage = lazy(() => import('@games/sudoku/playerpage.jsx'))
const MinesweeperPlayerPage = lazy(() => import('@games/minesweeper/playerpage.jsx'))
const WordScramblePlayerPage = lazy(() => import('@games/wordscramble/playerpage.jsx'))
const RpsPlayerPage = lazy(() => import('@games/rps/playerpage.jsx'))
const ArrowEscapePlayerPage = lazy(() => import('@games/arrowescape/playerpage.jsx'))
const TetrisPlayerPage = lazy(() => import('@games/tetris/playerpage.jsx'))
const StackPlayerPage = lazy(() => import('@games/stack/playerpage.jsx'))
const WhackAMolePlayerPage = lazy(() => import('@games/whackamole/playerpage.jsx'))
const HanoiPlayerPage = lazy(() => import('@games/hanoi/playerpage.jsx'))
const BreakoutPlayerPage = lazy(() => import('@games/breakout/playerpage.jsx'))
const BubbleShooterPlayerPage = lazy(() => import('@games/bubbleshooter/playerpage.jsx'))
const CarLaunchPlayerPage = lazy(() => import('@games/carlaunch/playerpage.jsx'))
const SoundifyPlayerPage = lazy(() => import('@games/soundify/playerpage.jsx'))
const StressBusterPlayerPage = lazy(() => import('@games/stressbuster/playerpage.jsx'))
const TicTacToePlayerPage = lazy(() => import('@games/tictactoe/playerpage.jsx'))
const SnakeAndLadderPlayerPage = lazy(() => import('@games/snakeandladder/playerpage.jsx'))
const LudoPlayerPage = lazy(() => import('@games/ludo/playerpage.jsx'))
const CarromPlayerPage = lazy(() => import('@games/carrom/playerpage.jsx'))
const TicTacToeMultiplayerPlayerPage = lazy(() => import('@games/tictactoemulti/playerpage.jsx'))
const ChessPlayerPage = lazy(() => import('@games/chess/playerpage.jsx'))
const CandyBlastPlayerPage = lazy(() => import('@games/candyblast/playerpage.jsx'))
const QuizPlayerPage = lazy(() => import('@games/quiz/playerpage.jsx'))

import screwPlayerHtml from '@games/screw/ScrewPlayerPage.html?raw'
import towerPlayerHtml from '@games/tower/TowerPlayerPage.html?raw'


const api = axios.create({ baseURL: '/api' })

// Persistent guest device identity — lets guests' high scores / best scores be
// tracked across plays without forcing login. Stored once per browser.
function getDeviceId() {
  try {
    let id = localStorage.getItem('device_id')
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) || ('d-' + Date.now() + '-' + Math.random().toString(36).slice(2))
      localStorage.setItem('device_id', id)
    }
    return id
  } catch {
    return null
  }
}

function loadFont(font) {
  if (!font || font === 'DM Sans') return
  const id = 'gf-' + font.replace(/\s/g, '-')
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id; link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700;800&display=swap`
  document.head.appendChild(link)
}

const OVERLAY_STYLES = `
  @keyframes flyFromBottom  { from { transform: translateY(110vh) scale(0.9); opacity:0 } to { transform: translateY(0) scale(1); opacity:1 } }
  @keyframes flyFromTop     { from { transform: translateY(-110vh) scale(0.9); opacity:0 } to { transform: translateY(0) scale(1); opacity:1 } }
  @keyframes flyFromLeft    { from { transform: translateX(-110vw) scale(0.9); opacity:0 } to { transform: translateX(0) scale(1); opacity:1 } }
  @keyframes flyFromRight   { from { transform: translateX(110vw) scale(0.9); opacity:0 } to { transform: translateX(0) scale(1); opacity:1 } }
  @keyframes zoomIn         { from { transform: scale(0.1); opacity:0 } to { transform: scale(1); opacity:1 } }
  @keyframes fadeIn         { from { opacity:0 } to { opacity:1 } }
  @keyframes scaleIn        { from { transform: scale(0.5); opacity:0 } to { transform: scale(1); opacity:1 } }
  @keyframes slideUp        { from { transform: translateY(60px); opacity:0 } to { transform: translateY(0); opacity:1 } }
  @keyframes slideDown      { from { transform: translateY(-60px); opacity:0 } to { transform: translateY(0); opacity:1 } }
  @keyframes rotateIn       { from { transform: rotate(-360deg) scale(0.3); opacity:0 } to { transform: rotate(0) scale(1); opacity:1 } }
  @keyframes flipIn         { from { transform: rotateX(-90deg); opacity:0 } to { transform: rotateX(0); opacity:1 } }
  @keyframes swirlIn        { from { transform: rotate(720deg) scale(0.1); opacity:0 } to { transform: rotate(0) scale(1); opacity:1 } }
  @keyframes bounceIn       { 0%{transform:scale(0);opacity:0} 50%{transform:scale(1.15)} 70%{transform:scale(0.92)} 85%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
  @keyframes elasticIn      { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.08)} 80%{transform:scale(0.95)} 100%{transform:scale(1);opacity:1} }
  @keyframes blurIn         { from { filter:blur(12px); opacity:0 } to { filter:blur(0); opacity:1 } }
  @keyframes dropIn         { 0%{transform:translateY(-120vh) rotate(-20deg);opacity:0} 60%{transform:translateY(10px) rotate(2deg);opacity:1} 80%{transform:translateY(-5px) rotate(-1deg)} 100%{transform:translateY(0) rotate(0);opacity:1} }
  @keyframes wipeIn         { from { clip-path:inset(0 100% 0 0) } to { clip-path:inset(0 0 0 0) } }
  @keyframes skewIn         { from { transform:skewX(-20deg); opacity:0 } to { transform:skewX(0); opacity:1 } }
  @keyframes spiralIn       { from { transform:rotate(1080deg) translateX(-200px); opacity:0 } to { transform:rotate(0) translateX(0); opacity:1 } }
  @keyframes rushIn         { from { transform:scale(3); opacity:0 } to { transform:scale(1); opacity:1 } }
  @keyframes foldIn         { from { transform:perspective(500px) rotateY(90deg); opacity:0 } to { transform:perspective(500px) rotateY(0); opacity:1 } }
  @keyframes revealIn       { from { clip-path:circle(0% at 50% 50%) } to { clip-path:circle(100% at 50% 50%) } }
  @keyframes spinIn         { from { transform:rotate(720deg) scale(0); opacity:0 } to { transform:rotate(0) scale(1); opacity:1 } }
  @keyframes cometIn        { from { transform:translate(-200px,-200px) rotate(-30deg) scale(0.3); opacity:0 } to { transform:translate(0,0) rotate(0) scale(1); opacity:1 } }
  @keyframes floatIn        { from { transform:translateY(40px); opacity:0 } to { transform:translateY(0); opacity:1 } }

  @keyframes flyToTop       { from { transform: translateY(0) scale(1); opacity:1 } to { transform: translateY(-110vh) scale(0.9); opacity:0 } }
  @keyframes flyToBottom    { from { transform: translateY(0) scale(1); opacity:1 } to { transform: translateY(110vh) scale(0.9); opacity:0 } }
  @keyframes flyToLeft      { from { transform: translateX(0) scale(1); opacity:1 } to { transform: translateX(-110vw) scale(0.9); opacity:0 } }
  @keyframes flyToRight     { from { transform: translateX(0) scale(1); opacity:1 } to { transform: translateX(110vw) scale(0.9); opacity:0 } }
  @keyframes zoomOut        { from { transform: scale(1); opacity:1 } to { transform: scale(0.1); opacity:0 } }
  @keyframes fadeOut        { from { opacity:1 } to { opacity:0 } }
  @keyframes scaleOut       { from { transform: scale(1); opacity:1 } to { transform: scale(0.5); opacity:0 } }
  @keyframes slideUpOut     { from { transform: translateY(0); opacity:1 } to { transform: translateY(-60px); opacity:0 } }
  @keyframes slideDownOut   { from { transform: translateY(0); opacity:1 } to { transform: translateY(60px); opacity:0 } }
  @keyframes rotateOut      { from { transform: rotate(0) scale(1); opacity:1 } to { transform: rotate(360deg) scale(0.3); opacity:0 } }
  @keyframes flipOut        { from { transform: rotateX(0); opacity:1 } to { transform: rotateX(90deg); opacity:0 } }
  @keyframes swirlOut       { from { transform: rotate(0) scale(1); opacity:1 } to { transform: rotate(-720deg) scale(0.1); opacity:0 } }
  @keyframes bounceOut      { 0%{transform:scale(1);opacity:1} 50%{transform:scale(1.06)} 100%{transform:scale(0.1);opacity:0} }
  @keyframes elasticOut     { 0%{transform:scale(1);opacity:1} 30%{transform:scale(0.92)} 60%{transform:scale(1.06)} 100%{transform:scale(0);opacity:0} }
  @keyframes blurOut        { from { filter:blur(0); opacity:1 } to { filter:blur(12px); opacity:0 } }
  @keyframes dropOut        { 0%{transform:translateY(0) rotate(0);opacity:1} 40%{transform:translateY(10px) rotate(2deg);opacity:1} 100%{transform:translateY(120vh) rotate(20deg);opacity:0} }
  @keyframes wipeOut        { from { clip-path:inset(0 0 0 0) } to { clip-path:inset(0 0 0 100%) } }
  @keyframes skewOut        { from { transform:skewX(0); opacity:1 } to { transform:skewX(20deg); opacity:0 } }
  @keyframes spiralOut      { from { transform:rotate(0) translateX(0); opacity:1 } to { transform:rotate(-1080deg) translateX(200px); opacity:0 } }
  @keyframes rushOut        { from { transform:scale(1); opacity:1 } to { transform:scale(3); opacity:0 } }
  @keyframes foldOut        { from { transform:perspective(500px) rotateY(0); opacity:1 } to { transform:perspective(500px) rotateY(90deg); opacity:0 } }
  @keyframes hideOut        { from { clip-path:circle(100% at 50% 50%) } to { clip-path:circle(0% at 50% 50%) } }
  @keyframes spinOut        { from { transform:rotate(0) scale(1); opacity:1 } to { transform:rotate(-720deg) scale(0); opacity:0 } }
  @keyframes cometOut       { from { transform:translate(0,0) rotate(0) scale(1); opacity:1 } to { transform:translate(200px,200px) rotate(30deg) scale(0.3); opacity:0 } }
  @keyframes floatOut       { from { transform:translateY(0); opacity:1 } to { transform:translateY(-40px); opacity:0 } }

  @keyframes spin           { to { transform: rotate(360deg) } }
  @keyframes questionEnter  { from { opacity:0; transform: translateY(18px) scale(0.98) } to { opacity:1; transform: translateY(0) scale(1) } }
  @keyframes mascotFloat    { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-8px) } }
  @keyframes scaleIn        { from { opacity:0; transform: scale(0.85) } to { opacity:1; transform: scale(1) } }
  @keyframes bounce         { 0%,100% { transform:scale(1) } 50% { transform:scale(1.2) } }
  @keyframes cffall         { to { transform: translateY(110vh) rotate(720deg); opacity:0 } }
  @keyframes nextBtnIn      { from { opacity:0; transform: translateY(16px) scale(0.9) } to { opacity:1; transform: translateY(0) scale(1) } }
  @keyframes pulse          { 0%,100% { box-shadow: 0 0 0 0 currentColor } 50% { box-shadow: 0 0 0 8px transparent } }

  @keyframes qImgFloat      { 0%,100% { transform: translateY(0px) scale(1) } 50% { transform: translateY(-10px) scale(1.02) } }
  @keyframes qImgBreathe    { 0%,100% { transform: scale(1); opacity:1 } 50% { transform: scale(1.04); opacity:0.9 } }
  @keyframes qImgPulse      { 0%,100% { transform: scale(1); filter: brightness(1) } 50% { transform: scale(1.05); filter: brightness(1.08) } }
  @keyframes qImgShimmer    { 0%,100% { transform: rotate(-1deg) scale(1) } 50% { transform: rotate(1deg) scale(1.03) } }
  @keyframes qImgKenBurns   { 0% { transform: scale(1) translate(0,0) } 100% { transform: scale(1.08) translate(-2%,-2%) } }
  @keyframes qImgBounce     { 0%,100% { transform: translateY(0) } 20% { transform: translateY(-14px) } 40% { transform: translateY(-7px) } 60% { transform: translateY(-3px) } 80% { transform: translateY(-1px) } }
  @keyframes qImgSway      { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-6px) } 75% { transform: translateX(6px) } }
  @keyframes qImgWobble    { 0%,100% { transform: translateX(0) } 15% { transform: translateX(-6px) rotate(-3deg) } 30% { transform: translateX(4px) rotate(2deg) } 45% { transform: translateX(-3px) rotate(-1deg) } 60% { transform: translateX(2px) rotate(1deg) } }
  @keyframes qImgSwing     { 0%,100% { transform: rotate(0deg) } 20% { transform: rotate(6deg) } 40% { transform: rotate(-5deg) } 60% { transform: rotate(3deg) } 80% { transform: rotate(-2deg) } }
  @keyframes qImgTada      { 0%,100% { transform: scale(1) rotate(0deg) } 10% { transform: scale(0.94) rotate(-2deg) } 20% { transform: scale(1.06) rotate(2deg) } 30% { transform: scale(1) rotate(-2deg) } 40% { transform: scale(1.02) rotate(0deg) } }
  @keyframes qImgHeartBeat { 0%,100% { transform: scale(1) } 15% { transform: scale(1.12) } 30% { transform: scale(1) } 45% { transform: scale(1.08) } 60% { transform: scale(1) } }
  @keyframes qImgRotate    { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
  @keyframes qImgFlash     { 0%,100% { opacity:1 } 25% { opacity:0.3 } 50% { opacity:1 } 75% { opacity:0.3 } }
  @keyframes qImgRubberBand { 0%,100% { transform: scaleX(1) scaleY(1) } 15% { transform: scaleX(1.2) scaleY(0.85) } 30% { transform: scaleX(0.9) scaleY(1.1) } 45% { transform: scaleX(1.08) scaleY(0.95) } 60% { transform: scaleX(0.97) scaleY(1.03) } }
  @keyframes qImgSlideUpDown { 0%,100% { transform: translateY(0) } 25% { transform: translateY(-20px) } 50% { transform: translateY(0) } 75% { transform: translateY(12px) } }
  @keyframes qImgZoomInOut  { 0%,100% { transform: scale(1) } 50% { transform: scale(1.12) } }
  @keyframes qImgFadeInOut  { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
  @keyframes qImgWave       { 0%,100% { transform: translateY(0) rotate(0deg) } 25% { transform: translateY(-6px) rotate(1deg) } 50% { transform: translateY(0) rotate(0deg) } 75% { transform: translateY(4px) rotate(-1deg) } }
  @keyframes qImgOrbit      { 0% { transform: translate(0,0) } 25% { transform: translate(10px,-10px) } 50% { transform: translate(0,-16px) } 75% { transform: translate(-10px,-10px) } 100% { transform: translate(0,0) } }
  @keyframes qImgGlitch     { 0%,100% { transform: translate(0) } 20% { transform: translate(-2px,1px) skewX(-1deg) } 40% { transform: translate(2px,-1px) skewX(1deg) } 60% { transform: translate(-1px,-1px) skewX(-0.5deg) } 80% { transform: translate(1px,2px) skewX(0.5deg) } }
  @keyframes qImgBlurBlink  { 0%,100% { filter:blur(0);opacity:1 } 25% { filter:blur(3px);opacity:0.6 } 50% { filter:blur(0);opacity:1 } 75% { filter:blur(2px);opacity:0.7 } }
  @keyframes qImgSkew       { 0%,100% { transform: skewX(0deg) } 25% { transform: skewX(-4deg) } 50% { transform: skewX(0deg) } 75% { transform: skewX(4deg) } }
  @keyframes qImgRoll       { 0% { transform: translateX(0) rotate(0deg) } 50% { transform: translateX(60px) rotate(360deg) } 100% { transform: translateX(0) rotate(720deg) } }
  @keyframes qImgBounceIn   { 0% { transform: scale(0);opacity:0 } 50% { transform: scale(1.12) } 70% { transform: scale(0.94) } 85% { transform: scale(1.04) } 100% { transform: scale(1);opacity:1 } }
  @keyframes qImgJello      { 0%,100% { transform: skewX(0deg) skewY(0deg) } 25% { transform: skewX(-5deg) skewY(3deg) } 50% { transform: skewX(5deg) skewY(-3deg) } 75% { transform: skewX(-3deg) skewY(2deg) } }
  @keyframes qImgEntrance   { from { opacity:0; transform: scale(0.88) translateY(16px) } to { opacity:1; transform: scale(1) translateY(0) } }

  @keyframes modalIn        { from { opacity:0; transform: scale(0.82) translateY(32px) } to { opacity:1; transform: scale(1) translateY(0) } }
  @keyframes backdropIn     { from { opacity:0 } to { opacity:1 } }

  @keyframes optionReveal   { from { transform: scale(1) } 50% { transform: scale(0.96) } to { transform: scale(1) } }
  @keyframes tyFall         { 0% { transform: translateY(-10px) rotate(0deg); opacity: 0.8; } 100% { transform: translateY(680px) rotate(360deg); opacity: 0.1; } }
  @keyframes tySlideUp      { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

  * { -webkit-tap-highlight-color: transparent; }
  video { font-size: 0 !important; }
  video::-webkit-media-controls { display: none !important; }
  video::-webkit-media-controls-timeline { display: none !important; }
  video::-webkit-media-controls-time-remaining-display { display: none !important; }
  video::-webkit-media-controls-current-time-display { display: none !important; }
  video::-webkit-media-controls-enclosure { display: none !important; }
  video::-webkit-media-controls-overlay-play-button { display: none !important; }
  video::-moz-media-controls { display: none !important; }

  html, body {
    margin: 0; padding: 0;
    overscroll-behavior: none;
    -webkit-text-size-adjust: 100%;
    height: 100%;
    min-height: 100dvh;
    min-height: -webkit-fill-available;
  }
`

function PageLoader({ bg }) {
  return (
    <div style={{ minHeight: '100dvh', background: bg || '#f8f8ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <LogoLoader size={72} />
      <p style={{ color: '#888', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Loading your experience…</p>
    </div>
  )
}

function Confetti() {
  const pieces = Array.from({ length: 70 }, (_, i) => ({
    id: i, left: Math.random() * 100,
    color: ['#7c6ff7','#f0a500','#22c55e','#ef4444','#3b82f6','#ec4899','#14b8a6'][i % 7],
    delay: Math.random() * 2.5, dur: 2.5 + Math.random() * 2, size: 6 + Math.random() * 8
  }))
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{ position: 'absolute', top: -20, left: `${p.left}%`, width: p.size, height: p.size, background: p.color, borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? 2 : '30%', animation: `cffall ${p.dur}s ${p.delay}s ease-in forwards` }} />
      ))}
    </div>
  )
}

function ScoreRing({ score, total, primaryColor }) {
  const pct = total > 0 ? (score / total) * 100 : 0
  const r = 52, circ = 2 * Math.PI * r, dash = (pct / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={65} cy={65} r={r} fill="none" stroke={`${primaryColor}22`} strokeWidth={10} />
        <circle cx={65} cy={65} r={r} fill="none" stroke={primaryColor} strokeWidth={10} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.2s ease', filter: `drop-shadow(0 0 6px ${primaryColor}88)` }} />
      </svg>
      <div style={{ marginTop: -100, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative' }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: primaryColor, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 14, color: '#999', marginTop: 2 }}>/ {total}</span>
      </div>
    </div>
  )
}

function SubmittingPopup({ primaryColor, ff }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
      animation: 'backdropIn 0.3s ease'
    }}>
      <div style={{
        background: '#fff', borderRadius: 24,
        padding: 'clamp(28px,7vw,40px) clamp(24px,6vw,36px)',
        maxWidth: 340, width: '100%', textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        animation: 'modalIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily: ff, boxSizing: 'border-box'
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: `${primaryColor}15`, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          <LogoLoader size={28} />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', marginBottom: 10, lineHeight: 1.3 }}>
          Submitting your progress…
        </h3>
        <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          Please don't close this page.
        </p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
          @keyframes pulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.08); opacity: 0.8 } }
        `}</style>
      </div>
    </div>
  )
}

function SubmitModal({ primaryColor, ff, confirmGifUrl, onConfirm, onClose, gameCategory, continueButtonText, continueButtonTextColor, continueButtonBgColor }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px', boxSizing: 'border-box',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
      animation: 'backdropIn 0.3s ease'
    }}>
      <div style={{
        background: '#fff', borderRadius: 28,
        padding: 'clamp(28px,7vw,44px) clamp(20px,6vw,36px)',
        maxWidth: 400, width: '100%', textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        animation: 'modalIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily: ff, boxSizing: 'border-box'
      }}>
        {confirmGifUrl ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <img src={confirmGifUrl} alt="Quiz submitted!" style={{ maxWidth: '100%', maxHeight: 380, width: 'auto', height: 'auto', borderRadius: 16, objectFit: 'contain' }} />
          </div>
        ) : (
          <div style={{ fontSize: 68, marginBottom: 16, animation: 'bounce 0.6s ease both' }}>🎉</div>
        )}
        <h2 style={{ fontSize: 'clamp(20px,5vw,26px)', fontWeight: 800, color: '#1a1a2e', marginBottom: 10, lineHeight: 1.25 }}>{gameCategory === 'quiz' ? 'Quiz' : gameCategory === 'registration' ? 'Registration' : 'Game'} Completed!</h2>
        <p style={{ color: '#666', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>Your responses have been recorded.<br />Redirecting you now…</p>
        <div style={{ height: 5, background: `${primaryColor}22`, borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ height: '100%', background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}bb)`, borderRadius: 10, animation: 'redirectBar 3s linear forwards' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onConfirm} style={{ background: continueButtonBgColor || `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`, color: continueButtonTextColor || '#fff', border: 'none', borderRadius: 50, padding: '14px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: ff, boxShadow: continueButtonBgColor ? '0 8px 28px rgba(0,0,0,0.2)' : `0 8px 28px ${primaryColor}55`, touchAction: 'manipulation' }}>
            {continueButtonText || 'Continue Now →'}
          </button>
          <button onClick={onClose} style={{ background: 'transparent', color: '#888', border: '1.5px solid #ddd', borderRadius: 50, padding: '12px 36px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: ff, touchAction: 'manipulation', transition: 'border-color 0.2s, color 0.2s' }}
            onMouseEnter={e => { e.target.style.borderColor = primaryColor; e.target.style.color = primaryColor; }}
            onMouseLeave={e => { e.target.style.borderColor = '#ddd'; e.target.style.color = '#888'; }}>
            Close
          </button>
        </div>
        <style>{`@keyframes redirectBar { from { width: 0% } to { width: 100% } }`}</style>
      </div>
    </div>
  )
}

function validateField(value, fieldType, isRequired) {
  if (isRequired && !value.trim()) return 'This field is required'
  if (!value.trim()) return ''
  if (fieldType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address'
  if (fieldType === 'phone') { const digits = value.replace(/[\s\-()]/g, '').replace(/^\+?91/, ''); if (!/^\d{10}$/.test(digits)) return 'Enter a valid 10-digit phone number' }
  return ''
}

export default function PlayerPage() {
  const { gameName, companyName } = useParams()
  const [searchParams] = useSearchParams()
  const [phase, setPhase] = useState('loading')
  const [showIntroNext, setShowIntroNext] = useState(false)
  const tts = useTTS()
  const [game, setGame] = useState(null)
  const [errorMsg, setErrorMsg] = useState('Game not found')
  const [formData, setFormData] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [formTouched, setFormTouched] = useState({})
  const [sessionToken, setSessionToken] = useState(null)
  const [sessionId,    setSessionId]    = useState(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [questionPool, setQuestionPool] = useState([])
  const [selectedOpt, setSelectedOpt] = useState(null)
  const [checkedOpts, setCheckedOpts] = useState([])
  const [selectValue, setSelectValue] = useState('')
  const [shortAnswerText, setShortAnswerText] = useState('')
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [totalScoreable, setTotalScoreable] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState(null)
  const [completing, setCompleting] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [questionKey, setQuestionKey] = useState(0)
  const [playerProfile, setPlayerProfile] = useState(null)
  const [showContinueBtn, setShowContinueBtn] = useState(false)
  const continueTimerRef = useRef(null)

  // Bridge backend-confirmed PromoCoins rewards to the shell wallet.
  // Captures both axios (api.js interceptor) and raw-fetch game completions
  // and forwards the award to the parent window / this document.
  useEffect(() => attachPromoCoinCapture(), [])

  // Timer per question
  const [timeLeft, setTimeLeft] = useState(null)
  const questionTimerRef = useRef(null)
  const autoAdvanceRef = useRef({ doAdvance: null, sessionToken: null })

  // Reset timer when question changes
  useEffect(() => {
    const t = game?.settings?.time_per_question
    if (t && t > 0 && phase === 'playing' && !answered) {
      setTimeLeft(t)
      clearInterval(questionTimerRef.current)
      questionTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(questionTimerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (answered || phase !== 'playing') {
      clearInterval(questionTimerRef.current)
    }
    return () => clearInterval(questionTimerRef.current)
  }, [currentQ, phase, answered, game?.settings?.time_per_question])

  // The actual question set shown to the player (shuffled + capped per session for quizzes).
  const questions = questionPool.length ? questionPool : (game?.questions || [])

  // Auto-advance when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && !answered && autoAdvanceRef.current.doAdvance) {
      const qs = questions.length
      autoAdvanceRef.current.doAdvance(currentQ + 1 >= qs, autoAdvanceRef.current.sessionToken)
    }
  }, [timeLeft, answered, currentQ, game?.questions?.length])

  /* ── Text-to-Speech (translate-then-speak) ── */
  const ttsOpts = (s) => ({
    lang: (s && s.speech_language) || 'en',
    rate: parseFloat(s && s.speech_rate) || 1,
    pitch: parseFloat(s && s.speech_pitch) || 1,
  })

  // Read question + its options aloud when a question appears
  useEffect(() => {
    const s = game?.settings
    if (!s?.enable_speech || phase !== 'playing') return
    const q = questions[currentQ]
    if (!q) return
    const texts = [q.question_text, ...(q.options || []).map(o => o.option_text).filter(Boolean)]
    tts.speak(texts, ttsOpts(s))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQ])

  // Read intro/heading when the start (form) screen appears
  useEffect(() => {
    const s = game?.settings
    if (!s?.enable_speech || phase !== 'form') return
    const texts = [s.heading_1, s.intro_text].filter(Boolean)
    if (texts.length) tts.speak(texts, ttsOpts(s))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Read the outro when the game finishes (natural intonation)
  useEffect(() => {
    const s = game?.settings
    if (!s?.enable_speech || phase !== 'thankyou') return
    const text = s.outro_text || 'Yay! You completed the game! Thank you for playing!'
    tts.speak([text], ttsOpts(s))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Preload all media (intro + question/overlay videos) while the form is shown ──
  useEffect(() => {
    if (phase !== 'form') return
    const list = game?.media_list || []
    if (!list.length) return
    const cache = []
    for (const url of list) {
      if (isVideoUrl(url)) {
        const v = document.createElement('video')
        v.preload = 'auto'; v.muted = true; v.src = url
        cache.push(v)
      } else {
        const img = new Image(); img.src = url
        cache.push(img)
      }
    }
    return () => { cache.forEach(c => { try { c.src = '' } catch {} }) }
  }, [phase, game?.media_list])

  // Ensure the question image video (with audio) actually starts playing.
  // Questions render under phase === 'playing'. Browsers block unmuted autoplay,
  // so we explicitly call play() after the user gesture and retry until it starts.
  useEffect(() => {
    if (phase !== 'playing') return
    const q = questions[currentQ]
    if (!q?.question_image_url || !isVideoUrl(q.question_image_url)) return
    const el = qImgWrapRef.current?.querySelector('video')
    if (!el) return
    el.muted = false
    let attempts = 0
    let timer
    const tryPlay = () => {
      el.play()
        .then(() => { if (timer) clearInterval(timer) })
        .catch(() => {})
      attempts += 1
      if (attempts >= 20) clearInterval(timer)
    }
    tryPlay()
    timer = setInterval(tryPlay, 250)
    return () => { if (timer) clearInterval(timer) }
  }, [phase, currentQ, game?.questions])

  // When an option is selected, stop the question video (freeze + mute) so the
  // overlay video's audio takes over instead of overlapping.
  useEffect(() => {
    if (!answered) return
    const el = qImgWrapRef.current?.querySelector('video')
    if (el) { try { el.pause() } catch {} }
  }, [answered])

  // Ensure thankyou-page videos (bg + confirmation) play with audio after a gesture.
  useEffect(() => {
    if (phase !== 'thankyou') return
    const root = tyWrapRef.current
    if (!root) return
    const vids = root.querySelectorAll('video')
    const playAll = () => vids.forEach(v => { v.muted = false; v.play().catch(() => {}) })
    playAll()
    const t = setTimeout(playAll, 300)
    return () => clearTimeout(t)
  }, [phase])

  // Overlay state machine
  const [overlayState, setOverlayState] = useState('hidden')
  const [overlayData, setOverlayData] = useState(null)
  const [showNextBtn, setShowNextBtn] = useState(false)

  // Submit modal
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  // Post-game "save your progress" prompt for guests
  const [showSaveAuth, setShowSaveAuth] = useState(false)
  const [saveClaim, setSaveClaim] = useState(null) // { pc_awarded, score_info }

  const activeSoundsRef = useRef([])
  const completingRef = useRef(false)
  const overlayTimerRef = useRef(null)
  const advanceRef = useRef(null)
  const qImgWrapRef = useRef(null)
  const tyWrapRef = useRef(null)

  // ── Known field mapping from player profile ──────────────────────────────
  const KNOWN_FIELD_MAP = {
    name: ['name','full name','fullname','player name','your name','yourname'],
    email: ['email','email address','emailaddress','e-mail','e mail'],
    whatsapp: ['whatsapp','whatsapp number','phone','phone number','mobile','mobile number','contact','contact number'],
    city: ['city','town','city/town','location'],
    pincode: ['pincode','pin code','zip','zip code','postal code','postalcode'],
    state: ['state','province','region'],
    country: ['country','nation'],
    company: ['company','company name','organization','org','workplace'],
    dob: ['dob','date of birth','birthday','birth date'],
    gender: ['gender','sex'],
  }

  const getPlayerField = (profile, fieldLabel) => {
    const norm = fieldLabel.toLowerCase().replace(/\s+/g, '')
    for (const [key, aliases] of Object.entries(KNOWN_FIELD_MAP)) {
      if (aliases.some(a => a.replace(/\s+/g, '') === norm || a === fieldLabel.toLowerCase())) {
        return profile?.[key] || null
      }
    }
    return null
  }

  useEffect(() => {
    const storedToken = localStorage.getItem('playerToken') || sessionStorage.getItem('playerToken')
    const userData = localStorage.getItem('playerUser') || sessionStorage.getItem('playerUser')

    ;(async () => {
      let profile = null
      if (storedToken && userData) {
        try {
          const r = await fetch('/api/pauth/me', { headers: { Authorization: `Bearer ${storedToken}` } })
          const d = await r.json()
          profile = d.success ? d.player : null
        } catch {}
      }
      setPlayerProfile(profile)

      try {
        const playUrl = companyName ? `/play/${gameName}/${companyName}` : `/play/${gameName}`
        const res = await api.get(playUrl)
        let g = res.data.game
        setGame(g)

        // ── Question pool: shuffle + per-session cutoff (mirrors games/quiz/logic.dart) ──
        if (g.category === 'quiz' && Array.isArray(g.questions) && g.questions.length) {
          let pool = [...g.questions]
          const randomize = g.settings?.randomize_questions === 1 || g.settings?.randomize_questions === '1'
          if (randomize) {
            for (let i = pool.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1))
              ;[pool[i], pool[j]] = [pool[j], pool[i]]
            }
          }
          const perSession = parseInt(g.settings?.questions_per_session, 10) || 0
          if (perSession > 0 && perSession < pool.length) pool = pool.slice(0, perSession)
          setQuestionPool(pool)
        } else {
          setQuestionPool([])
        }
        if (g.settings?.font_family) loadFont(g.settings.font_family)

        // Chess is a self-contained game (no question bank) — open the chess player directly.
        if (g.category === 'chess') { setPhase('chess'); return }

        // Update OG meta tags for social sharing
        if (g.settings?.game_logo_url) {
          const ogImage = g.settings.game_logo_url
          document.querySelectorAll('meta[property="og:image"]').forEach(m => m.remove())
          document.querySelectorAll('meta[name="twitter:image"]').forEach(m => m.remove())
          const ogImgTag = document.createElement('meta')
          ogImgTag.setAttribute('property', 'og:image')
          ogImgTag.setAttribute('content', ogImage)
          document.head.appendChild(ogImgTag)
          const twitterImgTag = document.createElement('meta')
          twitterImgTag.setAttribute('name', 'twitter:image')
          twitterImgTag.setAttribute('content', ogImage)
          document.head.appendChild(twitterImgTag)
        }
        if (g.name) {
          document.title = g.name
          document.querySelectorAll('meta[property="og:title"]').forEach(m => m.remove())
          const ogTitleTag = document.createElement('meta')
          ogTitleTag.setAttribute('property', 'og:title')
          ogTitleTag.setAttribute('content', g.name)
          document.head.appendChild(ogTitleTag)
        }
        if (g.settings?.meta_description) {
          const descTag = document.querySelector('meta[name="description"]') || document.createElement('meta')
          descTag.setAttribute('name', 'description')
          descTag.setAttribute('content', g.settings.meta_description)
          if (!descTag.parentNode) document.head.appendChild(descTag)
          document.querySelectorAll('meta[property="og:description"]').forEach(m => m.remove())
          const ogDescTag = document.createElement('meta')
          ogDescTag.setAttribute('property', 'og:description')
          ogDescTag.setAttribute('content', g.settings.meta_description)
          document.head.appendChild(ogDescTag)
        }
        // Ensure twitter card type
        document.querySelectorAll('meta[name="twitter:card"]').forEach(m => m.remove())
        const twitterCardTag = document.createElement('meta')
        twitterCardTag.setAttribute('name', 'twitter:card')
        twitterCardTag.setAttribute('content', 'summary_large_image')
        document.head.appendChild(twitterCardTag)

        const canSkipForm = () => {
          if (g.game_type === 'promogames') return true
          if (!profile) return false
          const fields = g.formFields || []
          if (fields.length === 0) return true
          return fields.every(f => {
            const val = getPlayerField(profile, f.field_label)
            if (f.is_required) return !!val
            return true
          })
        }

        const startSession = async (initData) => {
          const utmSource = searchParams.get('utm_source') || ''
          const utmMedium = searchParams.get('utm_medium') || ''
          const utmCampaign = searchParams.get('utm_campaign') || ''
          const utmTerm = searchParams.get('utm_term') || ''
          const utmContent = searchParams.get('utm_content') || ''
          const payload = {
            game_id: g.id,
            player_data: initData,
            source_type: searchParams.get('source') === 'direct' ? 'direct' : (profile ? 'player' : 'link'),
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            utm_term: utmTerm,
            utm_content: utmContent,
          }
          if (profile) payload.promo_player_id = profile.id
          const devId = getDeviceId()
          if (devId) payload.device_id = devId
          const sessRes = await api.post('/play/session/start', payload)
          setSessionToken(sessRes.data.session_token)
        }

        if (g.category === 'crossword') {
          const init = {}
          for (const ff of (g.formFields || [])) init[ff.field_label] = getPlayerField(profile, ff.field_label) || ''
          setFormData(init)
          if (canSkipForm()) {
            try {
              await startSession(init)
            } catch (sessErr) {
              const data = sessErr.response?.data
              if (data?.already_played) { setPhase('already_played'); return }
              console.error('Session start error:', sessErr)
            }
            setPhase('crossword')
          } else {
            setPhase('form')
          }
          return
        }

        if (g.category === 'spin') {
          const hasForm = g.formFields && g.formFields.length > 0
          if (!hasForm || canSkipForm()) {
            setPhase('spin')
            return
          }
          const init = {}
          for (const ff of (g.formFields || [])) init[ff.field_label] = getPlayerField(profile, ff.field_label) || ''
          setFormData(init)
          setPhase('form')
          return
        }

        // ── Generic categories (previously unconditional form blocks) ──
        // Check canSkipForm; if true, start session and jump to the game directly.
        if (canSkipForm()) {
          const init = {}
          for (const ff of (g.formFields || [])) init[ff.field_label] = getPlayerField(profile, ff.field_label) || ''
          setFormData(init)
          try { await startSession(init) } catch (sessErr) {
            const data = sessErr.response?.data
            if (data?.already_played) { setPhase('already_played'); return }
            console.error('Session start error:', sessErr)
          }
          setPhase(g.questions && g.questions.length ? 'playing' : g.category)
          return
        }
        // Show the form; after submit the handler below transitions to the game.
        const init = {}
        for (const ff of (g.formFields || [])) init[ff.field_label] = getPlayerField(profile, ff.field_label) || ''
        setFormData(init)
        setPhase('form')
        return

      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Game not found')
        setPhase('error')
      }
    })()
  }, [gameName, companyName])

  const resolveSound = useCallback((idOrUrl, soundMap) => {
    if (!idOrUrl) return null
    if (typeof idOrUrl === 'number' || (typeof idOrUrl === 'string' && /^\d+$/.test(idOrUrl))) {
      return soundMap?.[parseInt(idOrUrl)] || null
    }
    return idOrUrl || null
  }, [])

  const stopAllSounds = useCallback(() => {
    for (const a of activeSoundsRef.current) {
      try { a.pause(); a.currentTime = 0 } catch {}
    }
    activeSoundsRef.current = []
  }, [])

  const playSound = useCallback((url) => {
    if (!url) return null
    stopAllSounds()
    try {
      const audio = new Audio(url)
      audio.volume = 1
      audio.preload = 'auto'
      activeSoundsRef.current.push(audio)
      audio.play().catch(() => {})
      return audio
    } catch (e) { console.warn('playSound failed:', url, e); return null }
  }, [])

  // Satisfy the browser autoplay policy: unlock audio on the first user gesture
  // anywhere on the page so backend-assigned answer sounds can actually play.
  // This is not a player toggle — sounds still only play when the backend assigns them.
  useEffect(() => {
    const unlock = () => {
      try { const a = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAD//w=='); a.volume = 0; a.play().catch(() => {}) } catch {}
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock) }
  }, [])

  const handleFieldChange = (label, value, fieldType, isRequired) => {
    setFormData(prev => ({ ...prev, [label]: value }))
    if (formTouched[label]) {
      setFormErrors(prev => ({ ...prev, [label]: validateField(value, fieldType, isRequired) }))
    }
  }

  const handleFieldBlur = (label, value, fieldType, isRequired) => {
    setFormTouched(prev => ({ ...prev, [label]: true }))
    setFormErrors(prev => ({ ...prev, [label]: validateField(value, fieldType, isRequired) }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    const errors = {}; let hasErrors = false
    for (const f of (game.formFields || [])) {
      const err = validateField(formData[f.field_label] || '', f.field_type, f.is_required)
      errors[f.field_label] = err
      if (err) hasErrors = true
    }
    if (!!s.terms_enabled && !termsAgreed) errors._terms = 'Accept terms & conditions'
    setFormErrors(errors)
    setFormTouched(Object.fromEntries((game.formFields || []).map(f => [f.field_label, true])))
    if (hasErrors || errors._terms) return
    setSubmitting(true)
    try {
      const utmSource = searchParams.get('utm_source') || ''
      const utmMedium = searchParams.get('utm_medium') || ''
      const utmCampaign = searchParams.get('utm_campaign') || ''
      const utmTerm = searchParams.get('utm_term') || ''
      const utmContent = searchParams.get('utm_content') || ''
      const payload = {
        game_id: game.id,
        player_data: formData,
        source_type: searchParams.get('source') === 'direct' ? 'direct' : (playerProfile ? 'player' : 'link'),
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_term: utmTerm,
        utm_content: utmContent,
      }
      if (playerProfile) payload.promo_player_id = playerProfile.id
      const devId = getDeviceId()
      if (devId) payload.device_id = devId
      const res = await api.post('/play/session/start', payload)
      setSessionToken(res.data.session_token)
      if (game.category === 'crossword') {
        setPhase('crossword')
      } else if (game.category === 'spin') {
        setPhase('spin')
      } else if (game.category === 'memory') {
        setPhase('memory')
      } else if (game.category === 'jigsaw') {
        setPhase('jigsaw')
      } else if (game.category === 'wordsearch') {
        setPhase('wordsearch')
      } else if (game.category === 'pouring') {
        setPhase('pouring')
      } else if (game.category === 'typer') {
        setPhase('typer')
      } else if (game.category === 'screw') {
        setPhase('screw')
      } else if (game.category === 'math') {
        setPhase('math')
      } else if (game.category === '2048') {
        setPhase('2048')
      } else if (game.category === 'snake') {
        setPhase('snake')
      } else if (game.category === 'nagaraja') {
        setPhase('nagaraja')
      } else if (game.category === 'catch') {
        setPhase('catch')
      } else if (game.category === 'reaction') {
        setPhase('reaction')
      } else if (game.category === 'simon') {
        setPhase('simon')
      } else if (game.category === 'maze') {
        setPhase('stickmaze')
      } else if (game.category === 'classicmaze') {
        setPhase('classicmaze')
      } else if (game.category === 'stickmaze') {
        setPhase('stickmaze')
      } else if (game.category === 'flappy') {
        setPhase('flappy')
      } else if (game.category === 'bounce') {
        setPhase('bounce')
      } else if (game.category === 'space') {
        setPhase('space')
      } else if (game.category === 'connect4') {
        setPhase('connect4')
      } else if (game.category === 'bowling') {
        setPhase('bowling')
      } else if (game.category === 'sudoku') {
        setPhase('sudoku')
      } else if (game.category === 'minesweeper') {
        setPhase('minesweeper')
      } else if (game.category === 'wordscramble') {
        setPhase('wordscramble')
      } else if (game.category === 'rps') {
        setPhase('rps')
      } else if (game.category === 'arrowescape') {
        setPhase('arrowescape')
      } else if (game.category === 'tetris') {
        setPhase('tetris')
      } else if (game.category === 'stack') {
        setPhase('stack')
      } else if (game.category === 'whackamole') {
        setPhase('whackamole')
      } else if (game.category === 'hanoi') {
        setPhase('hanoi')
      } else if (game.category === 'breakout') {
        setPhase('breakout')
      } else if (game.category === 'bubbleshooter') {
        setPhase('bubbleshooter')
      } else if (game.category === 'carlaunch') {
        setPhase('carlaunch')
      } else if (game.category === 'soundify') {
        setPhase('soundify')
      } else if (game.category === 'stressbuster' || game.category === 'frustration') {
        setPhase('stressbuster')
      } else if (game.category === 'tictactoe') {
        setPhase('tictactoe')
      } else if (game.category === 'snakeandladder') {
        setPhase('snakeandladder')
      } else if (game.category === 'ludo') {
        setPhase('ludo')
      } else if (['Carrom', 'carrom'].includes(game.category)) {
        setPhase('Carrom')
      } else if (game.category === 'tictactoemultiplayer') {
        setPhase('tictactoemultiplayer')
      } else if (game.category === 'candyblast') {
        setPhase('candyblast')
      } else if (game.category === 'chess') {
        setPhase('chess')
      } else if (game.category === 'tower') {
        setPhase('tower')
      } else {
        setPhase(game.intro_video ? 'intro' : 'playing')
      }
    } catch (err) {
      const data = err.response?.data
      if (data?.already_played) { setPhase('already_played') }
      else { alert(data?.message || 'Error starting. Please try again.') }
    }
    setSubmitting(false)
  }

  const completeSession = useCallback(async (token) => {
    if (completingRef.current) return
    completingRef.current = true
    setCompleting(true)
    try {
      const res = await api.post('/play/session/complete', { session_token: token })
      setRedirectUrl(res.data.redirect_url)
      const sess = res.data.session
      if (sess) {
        setScore(sess.score || 0)
        setTotalScoreable(sess.total_scoreable || 0)
        const soundMap = game?.soundMap || {}
        const settingsObj = game?.settings || {}
        const finalScore = sess.score || 0
        const finalTotal = sess.total_scoreable || 0
        if (finalTotal > 0) {
          const isWin = finalScore / finalTotal >= 0.5
          const soundId = isWin ? settingsObj.win_sound_id : settingsObj.lose_sound_id
          if (soundId) {
            const url = soundMap[parseInt(soundId)]
            if (url) {
              stopAllSounds()
              try { const a = new Audio(url); a.play().catch(() => {}); activeSoundsRef.current.push(a) } catch {}
            }
          }
        } else if (settingsObj.win_sound_id) {
          const url = soundMap[parseInt(settingsObj.win_sound_id)]
          if (url) {
            stopAllSounds()
            try { const a = new Audio(url); a.play().catch(() => {}); activeSoundsRef.current.push(a) } catch {}
          }
        }
      }
      // All players see the thank-you screen — guests get the save-progress prompt
      setPhase('thankyou')
    } catch {
      setPhase('thankyou')
    }
    setCompleting(false)
  }, [game, playerProfile, stopAllSounds])

  const handleGameComplete = useCallback((data) => {
    if (data?.session) {
      setScore(data.session.score || 0)
      setTotalScoreable(data.session.total_scoreable || 0)
    }
    setRedirectUrl(data?.redirect_url || null)
    if (game?.game_type === 'promogames') return
    setPhase('thankyou')
  }, [game, playerProfile])

  const isNewSignupRef = useRef(false)

  const handleSaveAuthSuccess = useCallback(async (_player, { isNew }) => {
    isNewSignupRef.current = !!isNew
    // Claim immediately so progress + game PC are locked in even if they wander off
    const tok = localStorage.getItem('playerToken') || sessionStorage.getItem('playerToken')
    if (tok && sessionToken) {
      try {
        const res = await api.post(`/play/session/${sessionToken}/claim`, {})
        setSaveClaim({ pc_awarded: !!res.data.pc_awarded, score_info: res.data.score_info || null })
      } catch {}
    }
  }, [sessionToken])

  // Fired when the auth popup fully closes after signup/login:
  // fresh signups go back to the arcade; direct visitors navigate there.
  const handleAuthFinished = useCallback(() => {
    const registered = isNewSignupRef.current
    try { window.parent?.postMessage({ type: 'pg:auth', registered }, '*') } catch {}
    if (window.self === window.top && registered) {
      window.location.href = '/arcade'
    }
  }, [])

  // Auto-pop the centered login card for guests when they finish a game
  useEffect(() => {
    if (phase !== 'thankyou') return
    if (game?.force_login !== false && !(localStorage.getItem('playerToken') || sessionStorage.getItem('playerToken'))) {
      setShowSaveAuth(true)
    }
  }, [phase])

  // Safety net #2: fire on ANY successful session/complete through axios —
  // covers games whose own result screens bypass the thankyou phase
  useEffect(() => {
    const onDone = () => {
      if (game?.force_login !== false && !(localStorage.getItem('playerToken') || sessionStorage.getItem('playerToken'))) {
        setShowSaveAuth(true)
      }
    }
    window.addEventListener('pg:session-complete', onDone)
    return () => window.removeEventListener('pg:session-complete', onDone)
  }, [])

  const doAdvance = useCallback((isLast, token) => {
    tts.cancel()
    if (isLast) { completeSession(token) }
    else {
      setCurrentQ(q => q + 1)
      setSelectedOpt(null)
      setCheckedOpts([])
      setSelectValue('')
      setShortAnswerText('')
      setAnswered(false)
      setQuestionKey(k => k + 1)
    }
  }, [completeSession])

  useEffect(() => { advanceRef.current = doAdvance }, [doAdvance])
  useEffect(() => { autoAdvanceRef.current.doAdvance = doAdvance }, [doAdvance])
  useEffect(() => { autoAdvanceRef.current.sessionToken = sessionToken }, [sessionToken])
  const handleContinueClick = useCallback(() => {
  if (continueTimerRef.current) clearTimeout(continueTimerRef.current)
  setShowContinueBtn(false)
  
  const isLastQ = currentQ + 1 >= questions.length
  const token = sessionToken
  doAdvance(isLastQ, token)
}, [currentQ, game, sessionToken, doAdvance, questions])

  const startOverlayFlyOut = useCallback(() => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current)
    setShowNextBtn(false)
    setOverlayState('flyingOut')
    overlayTimerRef.current = setTimeout(() => {
      setOverlayState('hidden')
      setOverlayData(null)
      const d = overlayData
      if (d) advanceRef.current?.(d.isLast, d.token)
    }, 520)
  }, [overlayData])

  const flyOutRef = useRef(null)
  useEffect(() => { flyOutRef.current = startOverlayFlyOut }, [startOverlayFlyOut])

  const handleOptionSelect = async (opt, token) => {
  if (answered) return
  tts.cancel()
  setSelectedOpt(opt)
  setAnswered(true)

  // Mute + pause the question video FIRST so its audio channel is freed
  // before we try to play the answer sound. Otherwise the browser may
  // block the new Audio() because the video is still playing unmuted.
  const videoEl = qImgWrapRef.current?.querySelector('video')
  if (videoEl) { try { videoEl.muted = true; videoEl.pause() } catch {} }

  const question = questions[currentQ]
  const isCorrect = question.question_type === 'right_wrong' ? !!opt.is_correct : null
  const isLastQ = currentQ + 1 >= questions.length
  const soundMap = game.soundMap || {}
  const settingsObj = game.settings || {}

  if (question.question_type === 'right_wrong') {
    if (isCorrect) {
      playSound(resolveSound(settingsObj.sound_correct_id, soundMap))
      setScore(s => s + 1)
    } else {
      playSound(resolveSound(settingsObj.sound_wrong_id, soundMap))
    }
  } else {
    playSound(resolveSound(question.sound_neutral_id, soundMap))
  }

  try {
    await api.post('/play/session/answer', {
      session_token: token, question_id: question.id,
      option_id: opt.id, is_correct: isCorrect, question_type: question.question_type
    })
  } catch {}

  // ── Overlay or advance ──
  if (opt.option_overlay_image_url) {
    const tpl = s.templateConfig || {}
    const animIn = tpl.anim_overlay_in || question.overlay_animation_in || 'flyFromBottom'
    const animOut = tpl.anim_overlay_out || question.overlay_animation_out || 'flyToTop'
    const idleTime = ((tpl.idle_overlay_time ?? question.overlay_idle_time ?? 3)) * 1000

    setOverlayState('preparing')
    overlayTimerRef.current = setTimeout(() => {
      setOverlayData({ src: opt.option_overlay_image_url, animIn, animOut, idleTime, isLast: isLastQ, token })
      setOverlayState('flyingIn')
      setShowNextBtn(false)

      overlayTimerRef.current = setTimeout(() => {
        setOverlayState('visible')
        if (idleTime > 0) {
          overlayTimerRef.current = setTimeout(() => {
            setShowNextBtn(true)
          }, idleTime)
        } else {
          setShowNextBtn(true)
        }
      }, 620)
    }, 1200)
  } else {
    // ── NEW: Check if registration game and show Continue button ──
    const isRegistrationGame = game.category === 'registration'
    const idleTime = (question.overlay_idle_time ?? 3) * 1000
    
    if (isRegistrationGame) {
      // Show Continue button after idle time
      if (continueTimerRef.current) clearTimeout(continueTimerRef.current)
      setShowContinueBtn(false)
      
      continueTimerRef.current = setTimeout(() => {
        setShowContinueBtn(true)
      }, idleTime)
    } else {
      // Non-registration games: advance immediately as before
      setTimeout(() => doAdvance(isLastQ, token), 1200)
    }
  }
}

  // ── Checkbox (multi-select, opinion-only: capture chosen set) ──
  const handleCheckboxToggle = (opt) => {
    if (answered) return
    setCheckedOpts(prev => prev.some(o => o.id === opt.id) ? prev.filter(o => o.id !== opt.id) : [...prev, opt])
  }
  const handleCheckboxSubmit = async (token) => {
    if (answered || checkedOpts.length === 0) return
    tts.cancel()
    setAnswered(true)
    const question = questions[currentQ]
    const isLastQ = currentQ + 1 >= questions.length
    try {
      await api.post('/play/session/answer', {
        session_token: token, question_id: question.id,
        option_ids: checkedOpts.map(o => o.id), question_type: 'checkbox'
      })
    } catch {}
    setTimeout(() => doAdvance(isLastQ, token), 1200)
  }

  // ── Select (dropdown, opinion-only: capture chosen option) ──
  const handleSelectSubmit = async (token) => {
    if (answered || !selectValue) return
    tts.cancel()
    setAnswered(true)
    const question = questions[currentQ]
    const isLastQ = currentQ + 1 >= questions.length
    const opt = (question.options || []).find(o => String(o.id) === String(selectValue))
    try {
      await api.post('/play/session/answer', {
        session_token: token, question_id: question.id,
        option_id: opt ? opt.id : null, question_type: 'select'
      })
    } catch {}
    setTimeout(() => doAdvance(isLastQ, token), 1200)
  }

  const handleShortAnswerSubmit = async () => {
    if (answered || !shortAnswerText.trim()) return
    tts.cancel()
    setAnswered(true)

    const question = questions[currentQ]
    const isLastQ = currentQ + 1 >= questions.length
    const soundMap = game.soundMap || {}
    const settingsObj = game.settings || {}
    const playerAnswer = shortAnswerText.trim()

    // Compare answer
    let isCorrect = false
    if (question.answer_is_number) {
      isCorrect = parseFloat(playerAnswer) === parseFloat(question.answer_text)
    } else {
      isCorrect = playerAnswer.toLowerCase() === (question.answer_text || '').toLowerCase()
    }

    playSound(resolveSound(question.sound_neutral_id, soundMap))

    try {
      await api.post('/play/session/answer', {
        session_token: sessionToken, question_id: question.id,
        option_id: null, is_correct: isCorrect, question_type: question.question_type,
        answer_text: playerAnswer
      })
    } catch {}

    setTimeout(() => doAdvance(isLastQ, sessionToken), 1200)
  }

  const s = game?.settings || {}
  const tpl = s.templateConfig || {}
  const primaryColor = s.primary_color || tpl.primary_color || '#7c6ff7'
  const fontFamily = s.font_family || tpl.font_family || 'DM Sans'
  const optionTextColor = tpl.option_text_color || '#ffffff'
  const optionBgColor = tpl.option_color || '#1a1a2e'
  const optionBorderColor = tpl.border_color || 'transparent'
  const gameLogo = s.game_logo_url || game?.client_logo
  const ff = `'${fontFamily}', sans-serif`

  const getPageBg = (qBgImg, gameBgImg, solidColor) => {
    if (qBgImg) return { backgroundImage: `url(${qBgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }
    if (gameBgImg) return { backgroundImage: `url(${gameBgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed' }
    return { background: solidColor || '#f4f4ff' }
  }

  // ── CHANGE: getOptionStyle now accepts selectedOpt as param for wrong-answer correct reveal ──
  const getOptionStyle = (opt, question, currentSelectedOpt) => {
    if (!answered) return { bg: opt.option_color || optionBgColor, text: opt.option_text_color || optionTextColor, border: `2px solid ${optionBorderColor}`, shadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: 1, scale: 'scale(1)' }

    const isRightWrong = question.question_type === 'right_wrong'
    const isSelected = currentSelectedOpt?.id === opt.id

    if (isRightWrong) {
      if (opt.is_correct) {
        // Always show correct option green — even when wrong answer selected
        return { bg: '#22c55e', text: '#fff', border: '2px solid #16a34a', shadow: '0 4px 20px rgba(34,197,94,0.45)', opacity: 1, scale: 'scale(1)' }
      } else if (isSelected) {
        // The wrong option the user picked — show red
        return { bg: '#ef4444', text: '#fff', border: '2px solid #dc2626', shadow: '0 4px 20px rgba(239,68,68,0.45)', opacity: 1, scale: 'scale(0.97)' }
      } else {
        // Other wrong options — dimmed red
        return { bg: '#ef4444', text: '#fff', border: '2px solid #dc2626', shadow: 'none', opacity: 0.45, scale: 'scale(0.97)' }
      }
    } else {
      if (isSelected) {
        return { bg: primaryColor, text: '#fff', border: `2px solid ${primaryColor}`, shadow: `0 4px 16px ${primaryColor}55`, opacity: 1, scale: 'scale(0.97)' }
      }
      return { bg: opt.option_color || '#1a1a2e', text: opt.option_text_color || '#ffffff', border: '2px solid transparent', shadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: 0.5, scale: 'scale(1)' }
    }
  }

  useEffect(() => () => { 
  if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current)
  if (continueTimerRef.current) clearTimeout(continueTimerRef.current)
}, [])

  if (phase === 'loading') return <PageLoader primaryColor={primaryColor} />

  if (phase === 'already_played') {
    const bgStyle = getPageBg(null, s.bg_image_url, s.bg_color)
    return (
      <div style={{ minHeight: '100dvh', ...bgStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: ff }}>
        <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderRadius: 24, padding: 'clamp(32px,8vw,48px) clamp(24px,6vw,40px)', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.7)' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
          <h2 style={{ fontSize: 'clamp(20px,5vw,24px)', fontWeight: 800, color: '#1a1a2e', marginBottom: 12 }}>Already Played!</h2>
          <p style={{ color: '#666', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>Our records show you have already completed this game.<br />Each participant can only play <strong>once</strong>.</p>
          <div style={{ background: primaryColor + '15', border: `1px solid ${primaryColor}40`, borderRadius: 12, padding: '16px 20px', color: primaryColor, fontWeight: 600, fontSize: 14 }}>Thank you for your participation! 🎉</div>
        </div>
        <style>{OVERLAY_STYLES}</style>
      </div>
    )
  }

  if (phase === 'error') return (
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: 32, fontFamily: ff }}>
      <div style={{ fontSize: 56 }}>{errorMsg.toLowerCase().includes('inactive') ? '⏸️' : '😕'}</div>
      <h2 style={{ color: '#1a1a2e', fontSize: 24 }}>{errorMsg}</h2>
      <p style={{ color: '#888', fontSize: 15 }}>{errorMsg.toLowerCase().includes('inactive') ? 'This game has been paused.' : 'This link may be invalid.'}</p>
      <style>{OVERLAY_STYLES}</style>
    </div>
  )

  /* ── INTRO VIDEO ── */
  if (phase === 'intro') {
    const tpl = s.templateConfig || {}
    const nextText = tpl.next_button_text || s.next_button_text || 'Next →'
    return (
      <div style={{ minHeight: '100dvh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 16, fontFamily: ff }}>
        {game.intro_video && isVideoUrl(game.intro_video) ? (
          <video src={game.intro_video} autoPlay muted={false} controls={false} playsInline
            style={{ width: '100%', maxWidth: 900, maxHeight: '78dvh', objectFit: 'contain', borderRadius: 12, background: '#000' }}
            onEnded={() => setShowIntroNext(true)} />
        ) : null}
        {showIntroNext && (
          <button onClick={() => setPhase('playing')}
            style={{ background: tpl.next_button_bg_color || s.next_button_bg_color || primaryColor, color: tpl.next_button_text_color || s.next_button_text_color || '#fff', border: 'none', borderRadius: 10, padding: '14px 34px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            {nextText}
          </button>
        )}
        <style>{OVERLAY_STYLES}</style>
      </div>
    )
  }

  /* ── FORM ── */
  if (phase === 'form') {
    const bgStyle = getPageBg(null, s.bg_image_url, s.bg_color || '#f4f4ff')
    const hasBgImg = !!s.bg_image_url
    return (
      <div style={{ minHeight: '100dvh', ...bgStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px,4vw,24px) 16px', fontFamily: ff }}>
        <div style={{
          width: '100%', maxWidth: 440,
          padding: 'clamp(24px,6vw,36px) clamp(18px,5vw,28px)',
          borderRadius: 28,
          background: hasBgImg ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.93)',
          backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          boxShadow: hasBgImg ? '0 8px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.4)' : '0 8px 40px rgba(0,0,0,0.12)',
          border: hasBgImg ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.85)',
        }}>
          {gameLogo && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <img src={gameLogo} alt="Logo" style={{ maxWidth: '100%', maxHeight: 300, width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 10, display: 'block' }} />
            </div>
          )}
          <h1 style={{ color: s.heading_1_color||'#1a1a2e', fontFamily: ff, fontSize: 'clamp(22px,6vw,30px)', textAlign: 'center', marginBottom: 2, lineHeight: 1, textShadow: hasBgImg ? '0 2px 8px rgba(0,0,0,0.3)' : 'none', fontWeight: 800 }}>{s.heading_1 || 'Untitled'}</h1>
          {s.heading_2 && <div style={{ fontSize: 15, fontWeight: 600, textAlign: 'center', marginBottom: 6, color: s.heading_2_color||'#1a1a2e', lineHeight: 1.3, fontFamily: ff }}>{s.heading_2}</div>}
          {game.description && <p style={{ color: hasBgImg ? 'rgba(255,255,255,0.85)' : '#666', textAlign: 'center', marginBottom: 20, fontSize: 12, lineHeight: 1.6, fontFamily: ff }}>{game.description}</p>}
          {s.intro_text && (
            <div style={{ background: hasBgImg ? 'rgba(255,255,255,0.15)' : `${primaryColor}12`, border: `1.5px solid ${hasBgImg ? 'rgba(255,255,255,0.3)' : primaryColor + '30'}`, borderRadius: 12, padding: '12px 16px', marginBottom: 24, color: s.intro_text_color||'#444', fontSize: 13, textAlign: 'center', lineHeight: 1.6, fontFamily: ff }}>
              {s.intro_text}
            </div>
          )}
          <form onSubmit={handleFormSubmit} noValidate>
            {(game.formFields || []).map((f, i) => {
              const val = formData[f.field_label] || ''
              const err = formErrors[f.field_label] || ''
              const touched = formTouched[f.field_label]
              const hasErr = touched && !!err
              const fieldId = `field-${i}-${f.field_label.toLowerCase().replace(/\s+/g, '-')}`
              const fromProfile = playerProfile && !!getPlayerField(playerProfile, f.field_label)
              const inputStyle = {
                background: hasErr ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.88)',
                border: `1.5px solid ${hasErr ? '#ef4444' : (hasBgImg ? 'rgba(255,255,255,0.45)' : '#e0e0f0')}`,
                borderRadius: 10, color: '#1a1a2e', padding: '11px 14px', fontSize: 15,
                width: '100%', outline: 'none', fontFamily: ff,
                transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box'
              }
              return (
                <div key={i} style={{ marginBottom: 6 }}>
                  <label htmlFor={fieldId} style={{ display: 'block', fontSize: 12, fontWeight: 700, color: hasBgImg ? 'rgba(255,255,255,0.9)' : '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {f.field_label} {f.is_required ? <span style={{ color: '#ef4444' }}>*</span> : ''}
                    {fromProfile && <span style={{ marginLeft: 6, fontSize: 10, color: '#22c55e', fontWeight: 600 }}>✓ from profile</span>}
                  </label>
                  {f.field_type === 'textarea' ? (
                    <textarea id={fieldId} name={fieldId} rows={3} value={val}
                      onChange={e => handleFieldChange(f.field_label, e.target.value, f.field_type, f.is_required)}
                      onBlur={e => handleFieldBlur(f.field_label, e.target.value, f.field_type, f.is_required)}
                      style={{ ...inputStyle, resize: 'vertical' }} />
                  ) : (
                    <input id={fieldId} name={fieldId}
                      type={f.field_type === 'phone' ? 'tel' : f.field_type === 'email' ? 'email' : f.field_type === 'number' ? 'number' : 'text'}
                      value={val}
                      disabled={fromProfile}
                      onChange={e => handleFieldChange(f.field_label, e.target.value, f.field_type, f.is_required)}
                      onBlur={e => handleFieldBlur(f.field_label, e.target.value, f.field_type, f.is_required)}
                      style={{ ...inputStyle, opacity: fromProfile ? 0.7 : 1 }} />
                  )}
                  <div style={{ height: 20, marginTop: 3 }}>
                    {hasErr && <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>⚠ {err}</span>}
                  </div>
                </div>
              )
            })}

            {!!s.terms_enabled && (s.terms_text || s.terms_url) && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, marginTop: 4 }}>
                <div onClick={() => setTermsAgreed(!termsAgreed)} style={{ width: 22, height: 22, flexShrink: 0, marginTop: 2, border: `2px solid ${termsAgreed ? primaryColor : '#ccc'}`, borderRadius: 5, background: termsAgreed ? primaryColor : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                  {termsAgreed && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: hasBgImg ? 'rgba(255,255,255,0.85)' : '#555', lineHeight: 1.5 }}>
                  I agree to the{' '}
                  {s.terms_url ? <a href={s.terms_url} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor, fontWeight: 600, textDecoration: 'underline' }}>{s.terms_text || 'Terms & Conditions'}</a> : <span style={{ color: primaryColor, fontWeight: 600 }}>{s.terms_text || 'Terms & Conditions'}</span>}
                </span>
              </div>
            )}
            {formErrors._terms && <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>⚠ {formErrors._terms}</div>}

            <button type="submit" disabled={submitting || (!!s.terms_enabled && !termsAgreed)} style={{ width: '100%', background: s.start_button_bg_color || `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`, color: s.start_button_text_color || '#fff', border: 'none', borderRadius: 12, padding: '15px', fontSize: 16, fontWeight: 700, cursor: submitting || (!!s.terms_enabled && !termsAgreed) ? 'not-allowed' : 'pointer', marginTop: 8, opacity: (submitting || (!!s.terms_enabled && !termsAgreed)) ? 0.5 : 1, fontFamily: ff, boxShadow: s.start_button_bg_color ? '0 6px 20px rgba(0,0,0,0.15)' : `0 6px 20px ${primaryColor}44`, transition: 'all 0.2s', touchAction: 'manipulation' }}>
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Starting…
                </span>
                ) : s.start_button_text || `Start ${game.category === 'quiz' ? 'Quiz' : game.category === 'registration' ? 'Registration' : 'Survey'} →`}
            </button>
          </form>
        </div>
        <style>{OVERLAY_STYLES}</style>
      </div>
    )
  }

  /* ── PLAYING ── */
  if (phase === 'playing') {
    return (
      <QuizPlayerPage
        game={game}
        currentQ={currentQ}
        sessionToken={sessionToken}
        questions={questions}
        answered={answered}
        selectedOpt={selectedOpt}
        selectValue={selectValue}
        checkedOpts={checkedOpts}
        shortAnswerText={shortAnswerText}
        score={score}
        totalScoreable={totalScoreable}
        completing={completing}
        timeLeft={timeLeft}
        questionKey={questionKey}
        overlayState={overlayState}
        overlayData={overlayData}
        showNextBtn={showNextBtn}
        primaryColor={primaryColor}
        ff={ff}
        s={s}
        showContinueBtn={showContinueBtn}
        qImgWrapRef={qImgWrapRef}
        flyOutRef={flyOutRef}
        handleOptionSelect={handleOptionSelect}
        handleSelectSubmit={handleSelectSubmit}
        handleCheckboxSubmit={handleCheckboxSubmit}
        handleShortAnswerSubmit={handleShortAnswerSubmit}
        handleCheckboxToggle={handleCheckboxToggle}
        handleContinueClick={handleContinueClick}
        setSelectValue={setSelectValue}
        setShortAnswerText={setShortAnswerText}
        getPageBg={getPageBg}
        optionBgColor={optionBgColor}
        optionTextColor={optionTextColor}
        optionBorderColor={optionBorderColor}
      />
    )
  }

  /* ── GAME COMPLETE (PromoGames - no form, no thank you, no redirect) ── */
  if (phase === 'complete') {
    return (
      <div style={{
        minHeight: '100dvh',
        background: s.bg_color || '#120822',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', position: 'relative', fontFamily: ff, padding: '20px 16px', boxSizing: 'border-box',
      }}>
        <div style={{
          position: 'relative', zIndex: 2,
          width: '100%', maxWidth: 380, margin: '0 auto',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 28, padding: 'clamp(28px,7vw,40px) clamp(20px,6vw,32px)',
          boxShadow: '0 16px 60px rgba(0,0,0,0.12)',
          animation: 'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          boxSizing: 'border-box',
        }}>
          {/* Check icon */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
            background: `linear-gradient(135deg, ${primaryColor || '#7c3aed'}, ${primaryColor ? primaryColor + 'cc' : '#6d28d9'})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 24px ${primaryColor || '#7c3aed'}44`,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12.5 9.5 18 20 6" />
            </svg>
          </div>

          <h1 style={{
            fontFamily: ff, fontSize: 'clamp(22px,6vw,28px)', fontWeight: 800,
            color: '#1a1a2e', margin: '0 0 8px', lineHeight: 1.2,
          }}>
            Game Completed!
          </h1>

          {totalScoreable > 0 && (
            <p style={{
              color: '#6b7280', fontSize: '0.9rem', fontWeight: 600, margin: '0 0 6px',
            }}>
              You scored <strong style={{ color: primaryColor || '#7c3aed' }}>{score}</strong> out of <strong>{totalScoreable}</strong>
            </p>
          )}

          <p style={{
            color: '#9ca3af', fontSize: '0.82rem', margin: '0 0 24px', lineHeight: 1.5,
          }}>
            Thanks for playing! Try another game.
          </p>

          {/* Play Again */}
          <button
            onClick={() => window.location.reload()}
            style={{
              width: '100%', marginBottom: 10,
              background: `linear-gradient(135deg, ${primaryColor || '#7c3aed'}, ${primaryColor ? primaryColor + 'cc' : '#6d28d9'})`,
              color: '#fff', border: 'none',
              padding: '14px 20px', borderRadius: 14,
              fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: ff,
              boxShadow: `0 6px 24px ${primaryColor || '#7c3aed'}55`,
            }}>
            Play Again
          </button>

          {/* Back to Arcade */}
          <button
            onClick={() => { window.top.location.href = '/arcade' }}
            style={{
              width: '100%',
              background: 'transparent',
              color: primaryColor || '#7c3aed', border: `2px solid ${primaryColor || '#7c3aed'}`,
              padding: '12px 20px', borderRadius: 14,
              fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: ff,
            }}>
            Back to Games
          </button>
        </div>
        <style>{OVERLAY_STYLES}</style>
      </div>
    )
  }

  /* ── THANK YOU ── */
  if (phase === 'thankyou') {
    const tyBg = s.thankyou_bg_image_url
    const gameBg = s.bg_image_url
    const bgStyle = getPageBg(tyBg, gameBg, s.bg_color || '#f4f4ff')
    const hasScore = totalScoreable > 0
    const hasBgImage = !!(tyBg || gameBg)
    const confirmGifUrl = s.submit_confirm_gif_url || null

const handleSubmitExplore = () => {
  setShowSubmitModal(true)
  // Removed auto-redirect - now only redirects on button click
}

const handleModalConfirm = () => {
  setShowSubmitModal(false)
  if (redirectUrl) {
    window.top.location.href = redirectUrl
  } else if (playerProfile) {
    window.top.location.href = '/player/dashboard'
  } else {
    window.location.href = `/play/${gameName}/${companyName}`
  }
}

const handleModalClose = () => {
  setShowSubmitModal(false)
  window.location.href = `/play/${gameName}/${companyName}`
}

    return (
      <div style={{ minHeight: '100dvh', ...bgStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', fontFamily: ff, padding: '20px 16px', boxSizing: 'border-box' }}>
        <Confetti />

        {/* Share — every finished game can be shared with UTM attribution */}
        <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 70 }}>
          <ShareMenu game={game} light label={`Share ${game?.name || 'this game'}`} />
        </div>

        {/* Post-claim confirmation chip */}
        {saveClaim?.pc_awarded && (
          <div style={{
            position: 'fixed', left: '50%', bottom: 18, transform: 'translateX(-50%)',
            zIndex: 65, padding: '10px 18px', borderRadius: 12,
            background: '#0d2818', border: '1px solid #2ea56a',
            color: '#7ee787', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 600,
            boxShadow: '0 10px 32px rgba(0,0,0,0.4)', whiteSpace: 'nowrap',
            animation: 'tySlideUp 0.35s cubic-bezier(.2,1.2,.4,1) both',
          }}>
            🎉 +{game?.game_type === 'branded' ? 50 : 10} Promo Coins added!
            {saveClaim.score_info?.is_new_best && <span style={{ color: '#f5c842' }}> · New personal best!</span>}
          </div>
        )}
        {showSaveAuth && (
          <PlayerAuthModal onClose={() => setShowSaveAuth(false)} onSuccess={handleSaveAuthSuccess} onFinished={handleAuthFinished} />
        )}

        {showSubmitModal && (
          <SubmitModal primaryColor={primaryColor} ff={ff} confirmGifUrl={confirmGifUrl} onConfirm={handleModalConfirm} onClose={handleModalClose} gameCategory={game.category} continueButtonText={s.continue_button_text} continueButtonTextColor={s.continue_button_text_color} continueButtonBgColor={s.continue_button_bg_color} />
        )}

        {/* Animated confetti dots */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} style={{
              position: 'absolute', top: -10, borderRadius: '50%', opacity: 0.7,
              left: `${8 + (i * 5.2) % 85}%`,
              animation: `tyFall ${2 + (i % 3) * 0.7}s linear ${(i * 0.3) % 2}s infinite`,
              background: ['#ff6fa5','#8b6ef0','#35c9a5','#ffc93d','#4fb6ff','#ff8a3d'][i % 6],
              width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px`,
            }} />
          ))}
        </div>

        <div style={{
          position: 'relative', zIndex: 2,
          width: '100%', maxWidth: 400, margin: '0 auto',
          background: hasBgImage ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: hasBgImage ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(0,0,0,0.06)',
          borderRadius: 28, padding: 'clamp(28px,7vw,40px) clamp(20px,6vw,32px)',
          boxShadow: hasBgImage ? '0 16px 60px rgba(0,0,0,0.28)' : '0 16px 60px rgba(0,0,0,0.12)',
          animation: 'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          {/* Submit Confirmation GIF/Image — only show when image exists */}
          {confirmGifUrl && (
            <div style={{
              width: 'auto', margin: 'calc(-1 * clamp(28px,7vw,40px) + 2px) calc(-1 * clamp(20px,6vw,32px) + 2px) 14px',
              borderRadius: '26px 26px 12px 12px', overflow: 'hidden',
              padding: 2,
            }}>
              <img src={confirmGifUrl} alt="Confirmation" style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block', borderRadius: '22px 22px 10px 10px' }} />
            </div>
          )}

          {/* Ribbon */}
          <div style={{ margin: '-2px 0 10px', animation: 'tySlideUp 0.5s cubic-bezier(.2,1.2,.4,1) 0.2s backwards' }}>
            <div style={{
              background: `linear-gradient(180deg, ${primaryColor || '#4f46e5'}, ${primaryColor ? primaryColor + 'cc' : '#3730a3'})`,
              color: '#fff', fontFamily: ff, fontWeight: 600, fontSize: '0.85rem',
              letterSpacing: 2, padding: '8px 28px', borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ color: '#FFD700', fontSize: 12 }}>&#9733;</span>
              GAME COMPLETED!
              <span style={{ color: '#FFD700', fontSize: 12 }}>&#9733;</span>
            </div>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: ff, fontSize: 'clamp(22px,6vw,30px)', fontWeight: 800,
            color: s.outro_text_color || '#1a1a2e', margin: '0 0 6px', lineHeight: 1.2,
            textShadow: hasBgImage ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
          }}>
            {s.outro_text || 'Congratulations!'}
          </h1>
          <p style={{
            color: s.thankyou_subtitle_color || '#6b7280', fontSize: '0.85rem',
            fontWeight: 600, margin: '0 0 16px',
          }}>
            {hasScore
              ? <>You scored <strong style={{ color: primaryColor || '#7c3aed' }}>{score}</strong> out of <strong>{totalScoreable}</strong></>
              : (s.thankyou_subtitle || 'Thank you for completing!')}
          </p>

          {/* Progress Card */}
          {hasScore && (
            <div style={{
              background: '#fff', borderRadius: 20, padding: '18px 22px',
              width: '100%', maxWidth: 280, margin: '0 auto 14px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', margin: '0 auto 8px',
                background: `linear-gradient(135deg, ${primaryColor || '#c4b5fd'}, ${primaryColor ? primaryColor + 'aa' : '#a78bfa'})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px ${primaryColor || '#7c3aed'}33`,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12.5 9.5 18 20 6" />
                </svg>
              </div>
              <p style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e1b4b', margin: '0 0 10px' }}>
                Question Answered Progress
              </p>
              <div style={{ position: 'relative', height: 10, background: '#e9e5f5', borderRadius: 999, overflow: 'visible', marginBottom: 6 }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  background: `linear-gradient(90deg, ${primaryColor || '#7c3aed'}, ${primaryColor ? primaryColor + 'cc' : '#a855f7'})`,
                  transition: 'width 0.8s cubic-bezier(.2,1,.4,1)',
                  boxShadow: `0 0 8px ${primaryColor || '#7c3aed'}66`,
                  width: `${Math.min(100, (score / Math.max(1, totalScoreable)) * 100)}%`,
                }} />
                <span style={{
                  position: 'absolute', top: '50%', left: -4, transform: 'translateY(-50%)',
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', border: `3px solid ${primaryColor || '#7c3aed'}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }} />
                <span style={{
                  position: 'absolute', top: '50%', right: -4, transform: 'translateY(-50%)',
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', border: `3px solid ${primaryColor || '#7c3aed'}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }} />
              </div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', margin: 0 }}>
                {score} of {totalScoreable}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmitExplore}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%',
              background: s.submit_button_bg_color || `linear-gradient(135deg, ${primaryColor || '#7c3aed'}, ${primaryColor ? primaryColor + 'cc' : '#6d28d9'})`,
              color: s.submit_button_text_color || '#fff', border: 'none',
              padding: '14px 20px', borderRadius: 14,
              fontSize: 17, fontWeight: 700,
              cursor: 'pointer', fontFamily: ff,
              boxShadow: s.submit_button_bg_color ? '0 6px 24px rgba(0,0,0,0.15)' : `0 6px 24px ${primaryColor || '#7c3aed'}55`,
              touchAction: 'manipulation',
              letterSpacing: '0.02em',
              minHeight: 52,
            }}>
            <span>{s.submit_button_text || 'Submit & Explore'}</span>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12h15M13 6l6 6-6 6" />
              </svg>
            </span>
          </button>

          {/* PC rule — guests earn no Promo Coins, only registered players do */}
          {!playerProfile && !saveClaim?.pc_awarded && (
            <p style={{
              fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af',
              marginTop: 12, marginBottom: 0, lineHeight: 1.4,
            }}>
              💡 Promo Coins are earned by registered players only. Sign up free to start collecting coins, best scores &amp; rewards.
            </p>
          )}
        </div>
        <style>{OVERLAY_STYLES}</style>
      </div>
    )
  }

  // ── Game phases (each lazy-loaded only when needed) ──────────────────────────
  // Wrapped in a single <Suspense> so React shows a loader while the game chunk
  // downloads, instead of crashing on a missing lazy component.
  const gameFallback = <PageLoader primaryColor={primaryColor} />

  if (phase === 'chess') {
    return <Suspense fallback={gameFallback}><ChessPlayerPage gameData={game} /></Suspense>
  }

  if (phase === 'spin') {
    return (
      <Suspense fallback={gameFallback}>
        <SpinPlayerPage
          gameData={game}
          sessionToken={sessionToken}
          sessionId={sessionId}
          onSessionStart={(token, id) => { setSessionToken(token); setSessionId(id) }}
          onComplete={(data) => {
            if (data?.session) setScore(data.session.score || 0)
            setRedirectUrl(data?.redirect_url || null)
            setPhase('thankyou')
          }}
        />
      </Suspense>
    )
  }

  if (phase === 'crossword') {
    return (
      <Suspense fallback={gameFallback}>
        <CrosswordPlayerPage
          gameData={game}
          sessionToken={sessionToken}
          sessionId={null}
          onComplete={(data) => {
            if (data?.session) {
              setScore(data.session.score || 0)
              setTotalScoreable(data.session.total_scoreable || 0)
            }
            setRedirectUrl(data?.redirect_url || null)
            setPhase('thankyou')
          }}
        />
      </Suspense>
    )
  }

  if (phase === 'memory') {
    return <Suspense fallback={gameFallback}><MemoryPlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (phase === 'jigsaw') {
    return <Suspense fallback={gameFallback}><JigsawPlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (phase === 'wordsearch') {
    return <Suspense fallback={gameFallback}><WordSearchPlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (phase === 'pouring') {
    return <Suspense fallback={gameFallback}><PouringPlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (phase === 'typer') {
    return <Suspense fallback={gameFallback}><TyperPlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (phase === 'math') {
    return <Suspense fallback={gameFallback}><MathPlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (phase === 'maze') {
    return <Suspense fallback={gameFallback}><StickMazePlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (phase === 'classicmaze') {
    return <Suspense fallback={gameFallback}><MazePlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (phase === 'stickmaze') {
    return <Suspense fallback={gameFallback}><StickMazePlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (phase === 'screw') {
    return (
      <iframe
        title="Screw & Reveal"
        srcDoc={screwPlayerHtml}
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 'none', background: '#140c06' }}
      />
    )
  }

  if (phase === 'tower') {
    return (
      <iframe
        title="Tower Building"
        srcDoc={towerPlayerHtml}
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 'none', background: '#f95240' }}
      />
    )
  }

  if (phase === '2048') {
    return <Suspense fallback={gameFallback}><Game2048PlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (phase === 'snake') {
    return <Suspense fallback={gameFallback}><SnakePlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (phase === 'nagaraja') {
    return <Suspense fallback={gameFallback}><NagarajaPlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (phase === 'snakeandladder') {
    return <Suspense fallback={gameFallback}><SnakeAndLadderPlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (phase === 'ludo') {
    return <Suspense fallback={gameFallback}><LudoPlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (['Carrom', 'carrom'].includes(phase)) {
    return <Suspense fallback={gameFallback}><CarromPlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (phase === 'bejeweled') {
    return (
      <Suspense fallback={gameFallback}>
        <BejeweledPlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'reaction') {
    return (
      <Suspense fallback={gameFallback}>
        <ReactionPlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'simon') {
    return (
      <Suspense fallback={gameFallback}>
        <SimonPlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'flappy') {
    return (
      <Suspense fallback={gameFallback}>
        <FlappyPlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'bounce') {
    return <Suspense fallback={gameFallback}><BouncePlayerPage gameData={game} sessionToken={sessionToken} onComplete={() => {}} /></Suspense>
  }

  if (phase === 'space') {
    return (
      <Suspense fallback={gameFallback}>
        <SpacePlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'connect4') {
    return (
      <Suspense fallback={gameFallback}>
        <Connect4PlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'bowling') {
    return (
      <Suspense fallback={gameFallback}>
        <BowlingPlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'sudoku') {
    return (
      <Suspense fallback={gameFallback}>
        <SudokuPlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'minesweeper') {
    return (
      <Suspense fallback={gameFallback}>
        <MinesweeperPlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'wordscramble') {
    return (
      <Suspense fallback={gameFallback}>
        <WordScramblePlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'rps') {
    return (
      <Suspense fallback={gameFallback}>
        <RpsPlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'arrowescape') {
    return (
      <Suspense fallback={gameFallback}>
        <ArrowEscapePlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'tetris') {
    return (
      <Suspense fallback={gameFallback}>
        <TetrisPlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'stack') {
    return (
      <Suspense fallback={gameFallback}>
        <StackPlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'whackamole') {
    return (
      <Suspense fallback={gameFallback}>
        <WhackAMolePlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'hanoi') {
    return (
      <Suspense fallback={gameFallback}>
        <HanoiPlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'breakout') {
    return (
      <Suspense fallback={gameFallback}>
        <BreakoutPlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'bubbleshooter') {
    return (
      <Suspense fallback={gameFallback}>
        <BubbleShooterPlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'carlaunch') {
    return (
      <Suspense fallback={gameFallback}>
        <CarLaunchPlayerPage gameData={game} sessionToken={sessionToken} onComplete={(data) => { setRedirectUrl(data?.redirect_url || null); setPhase('thankyou') }} />
      </Suspense>
    )
  }

  if (phase === 'soundify') {
    return (
      <Suspense fallback={gameFallback}>
        <SoundifyPlayerPage
          gameData={game}
          sessionToken={sessionToken}
          sessionId={sessionId}
          onSessionStart={(token, id) => { setSessionToken(token); setSessionId(id) }}
          onComplete={(data) => {
            if (data?.session) setScore(data.session.score || 0)
            setRedirectUrl(data?.redirect_url || null)
            setPhase('thankyou')
          }}
        />
      </Suspense>
    )
  }

  if (phase === 'stressbuster') {
    return (
      <Suspense fallback={gameFallback}>
        <StressBusterPlayerPage
          gameData={game}
          sessionToken={sessionToken}
          sessionId={sessionId}
          onSessionStart={(token, id) => { setSessionToken(token); setSessionId(id) }}
          onComplete={(data) => {
            if (data?.session) setScore(data.session.score || 0)
            setRedirectUrl(data?.redirect_url || null)
            setPhase('thankyou')
          }}
        />
      </Suspense>
    )
  }

  if (phase === 'tictactoe') {
    return (
      <Suspense fallback={gameFallback}>
        <TicTacToePlayerPage
          gameData={game}
          sessionToken={sessionToken}
          sessionId={sessionId}
          onSessionStart={(token, id) => { setSessionToken(token); setSessionId(id) }}
          onComplete={(data) => {
            if (data?.session) setScore(data.session.score || 0)
            setRedirectUrl(data?.redirect_url || null)
            setPhase('thankyou')
          }}
        />
      </Suspense>
    )
  }

  if (phase === 'tictactoemultiplayer') {
    return <Suspense fallback={gameFallback}><TicTacToeMultiplayerPlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  if (phase === 'candyblast') {
    return <Suspense fallback={gameFallback}><CandyBlastPlayerPage gameData={game} sessionToken={sessionToken} onComplete={handleGameComplete} /></Suspense>
  }

  return null
}