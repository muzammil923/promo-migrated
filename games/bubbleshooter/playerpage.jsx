import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* =====================================================================================
   BUBBLE SHOOTER — single-file React game
   Sections: CONSTANTS · HELPERS · AUDIO · PHYSICS · COLLISION · RENDERING · UI SCREENS
   ===================================================================================== */

/* ------------------------------- CONSTANTS ------------------------------- */

const PALETTE = ["#ff4d6d", "#ffd23f", "#4dd4ff", "#7cff6b", "#c77dff", "#ff9f4d"];

const DIFFICULTY = {
  easy: { label: "Easy", colors: 4, initialRows: 5, pushInterval: 9, speed: 640, desc: "Slow pace, fewer colors" },
  medium: { label: "Medium", colors: 5, initialRows: 6, pushInterval: 7, speed: 720, desc: "Balanced challenge" },
  hard: { label: "Hard", colors: 6, initialRows: 7, pushInterval: 5, speed: 820, desc: "Fast & tricky" },
};

const MAX_LEVEL = 5;

const CANVAS_W = 400;
const CANVAS_H = 660;
const COLS = 10;
const BUBBLE_D = CANVAS_W / COLS; // 40
const RADIUS = BUBBLE_D / 2; // 20
const ROW_H = BUBBLE_D * 0.87;
const TOP_MARGIN = 46;
const GRID_ROWS = 16;
const LOSE_ROW = 13;
const CANNON_Y = CANVAS_H - 70;
const CANNON_X = CANVAS_W / 2;
const PROJECTILE_R = RADIUS;
const POP_POINTS = 10;
const FLOAT_POINTS = 25;
const HIGH_SCORE_KEY = "bubbleShooterHighScore_v1";

/* -------------------------------- HELPERS -------------------------------- */

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}
function shade(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  const f = (c) => clamp(Math.round(c + amt), 0, 255);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function colsInRow(row) {
  return row % 2 === 1 ? COLS - 1 : COLS;
}

function cellToPos(row, col) {
  const offset = row % 2 === 1 ? RADIUS : 0;
  return {
    x: col * BUBBLE_D + RADIUS + offset,
    y: TOP_MARGIN + row * ROW_H + RADIUS,
  };
}

function neighborsOf(row, col) {
  const even = row % 2 === 0;
  const raw = even
    ? [
        [row, col - 1], [row, col + 1],
        [row - 1, col - 1], [row - 1, col],
        [row + 1, col - 1], [row + 1, col],
      ]
    : [
        [row, col - 1], [row, col + 1],
        [row - 1, col], [row - 1, col + 1],
        [row + 1, col], [row + 1, col + 1],
      ];
  return raw.filter(
    ([r, c]) => r >= 0 && r < GRID_ROWS && c >= 0 && c < colsInRow(r)
  );
}

function randomColor(count) {
  return PALETTE[Math.floor(Math.random() * count)];
}

function makeEmptyGrid() {
  const g = [];
  for (let r = 0; r < GRID_ROWS; r++) g.push(new Array(COLS).fill(null));
  return g;
}

function generateLevelGrid(rows, colorCount) {
  const g = makeEmptyGrid();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < colsInRow(r); c++) {
      g[r][c] = randomColor(colorCount);
    }
  }
  return g;
}

function generateRandomRow(colorCount) {
  const arr = new Array(COLS).fill(null);
  for (let c = 0; c < COLS; c++) arr[c] = randomColor(colorCount);
  return arr;
}

/* ==================================================================
   SVG ICON SET
   ================================================================== */

function icon(name, size, color) {
  const s = size || 18;
  const c = color || "currentColor";
  switch (name) {
    case "trophy":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 4h10v3.2a5 5 0 0 1-10 0V4z" fill={c} />
          <path d="M7 5.2H4.2A3 3 0 0 0 7 8" stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M17 5.2h2.8A3 3 0 0 1 17 8" stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <rect x="10.6" y="12.2" width="2.8" height="3.6" fill={c} />
          <rect x="7.8" y="17" width="8.4" height="2.2" rx="1.1" fill={c} />
        </svg>
      );
    case "star":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={c} xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.5l2.9 6.1 6.6.7-4.9 4.5 1.3 6.6L12 17.9 5.9 20.4l1.3-6.6-4.9-4.5 6.6-.7L12 2.5z" />
        </svg>
      );
    case "speakerOn":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 9v6h4l5 4V5L8 9H4z" fill={c} />
          <path d="M16.3 8.6a5 5 0 0 1 0 6.8" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M19 6.2a8.6 8.6 0 0 1 0 11.6" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "speakerOff":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 9v6h4l5 4V5L8 9H4z" fill={c} />
          <line x1="16" y1="9" x2="21" y2="15" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="21" y1="9" x2="16" y2="15" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "pause":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={c} xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="5" width="4" height="14" rx="1.4" />
          <rect x="14" y="5" width="4" height="14" rx="1.4" />
        </svg>
      );
    case "play":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={c} xmlns="http://www.w3.org/2000/svg">
          <path d="M6 4.2v15.6l13-7.8-13-7.8z" />
        </svg>
      );
    case "gear":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3.3" fill={c} />
          <g stroke={c} strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="2.6" x2="12" y2="5.1" />
            <line x1="12" y1="18.9" x2="12" y2="21.4" />
            <line x1="2.6" y1="12" x2="5.1" y2="12" />
            <line x1="18.9" y1="12" x2="21.4" y2="12" />
            <line x1="5.2" y1="5.2" x2="7" y2="7" />
            <line x1="17" y1="17" x2="18.8" y2="18.8" />
            <line x1="18.8" y1="5.2" x2="17" y2="7" />
            <line x1="7" y1="17" x2="5.2" y2="18.8" />
          </g>
        </svg>
      );
    case "music":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 17a2.4 2.4 0 1 1-2.4-2.4A2.4 2.4 0 0 1 9 17zM17 15a2.4 2.4 0 1 1-2.4-2.4A2.4 2.4 0 0 1 17 15z" fill={c} />
          <path d="M9 17V6.3l8-1.5v10.2" stroke={c} strokeWidth="1.6" fill="none" strokeLinejoin="round" />
        </svg>
      );
    case "haptics":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="3" width="8" height="18" rx="2" stroke={c} strokeWidth="1.8" fill="none" />
          <line x1="2.4" y1="9" x2="2.4" y2="15" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="21.6" y1="9" x2="21.6" y2="15" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "refresh":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 12a8 8 0 0 1 13.8-5.6L20 8" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M20 12a8 8 0 0 1-13.8 5.6L4 16" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M20 4.2v3.9h-4M4 19.8v-3.9h4" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case "home":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={c} xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3 2 11h3v9h5v-6h4v6h5v-9h3z" />
        </svg>
      );
    case "arrowRight":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 12h15M13 6l6 6-6 6" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case "check":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 12.5l5.5 5.5L20 6.5" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case "cross":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 5l14 14M19 5L5 19" stroke={c} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "flame":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={c} xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2c1 3-3 4-3 8a3 3 0 0 0 6 0c0-1-1-2-1-3 2 1 4 4 4 7a6 6 0 0 1-12 0c0-5 3-7 6-12z" />
        </svg>
      );
    case "bubble":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9.2" fill={c} />
          <ellipse cx="9" cy="8.6" rx="3" ry="1.7" fill="rgba(255,255,255,0.6)" transform="rotate(-20 9 8.6)" />
        </svg>
      );
    default:
      return null;
  }
}

/* ==================================================================
   PREMIUM AUDIO ENGINE — layered synthesis, filtering, compression
   ================================================================== */

class SFX {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createDynamicsCompressor();
      this.master.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.master.knee.setValueAtTime(8, this.ctx.currentTime);
      this.master.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.master.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.master.release.setValueAtTime(0.08, this.ctx.currentTime);
      this.master.connect(this.ctx.destination);
    } catch (e) {
      this.ctx = null;
    }
  }

  now() { return this.ctx ? this.ctx.currentTime : 0; }

  // --- Simple pitched tone with smooth decay ---
  blip(freq, dur, delay, endFreq) {
    if (this.muted || !this.ctx) return;
    const t = this.now() + (delay || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  // --- Tiny filtered noise burst (for pop texture) ---
  popNoise(dur) {
    if (this.muted || !this.ctx) return;
    const t = this.now();
    const len = Math.max(0.01, dur + 0.02);
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = "bandpass";
    flt.frequency.setValueAtTime(3000, t);
    flt.Q.setValueAtTime(0.8, t);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(this.master);
    src.start(t);
    src.stop(t + len);
  }

  // --- Sound: Launch ---
  launch() {
    const S = this;
    S.blip(400, 0.12, 0, 900);
    S.blip(600, 0.08, 0.03);
  }

  // --- Sound: Pop (smooth bubble pop) ---
  pop() {
    const S = this;
    S.blip(800, 0.08, 0, 400);
    S.blip(500, 0.06, 0.015);
    S.popNoise(0.05);
  }

  // --- Sound: Collision/land ---
  collision() {
    const S = this;
    S.blip(250, 0.08, 0, 150);
    S.blip(180, 0.05, 0.02);
  }

  // --- Sound: Drop ---
  drop() {
    const S = this;
    S.blip(500, 0.18, 0, 200);
    S.blip(300, 0.12, 0.06);
  }

  // --- Sound: Bounce ---
  bounce() {
    this.blip(500, 0.05, 0, 350);
  }

  // --- Sound: Combo ---
  combo() {
    const S = this;
    S.blip(800, 0.08, 0, 1200);
    S.blip(1000, 0.07, 0.06, 1500);
    S.blip(1200, 0.06, 0.12, 1800);
  }

  // --- Sound: Victory ---
  victory() {
    const S = this;
    S.blip(523, 0.2, 0);
    S.blip(659, 0.2, 0.15);
    S.blip(784, 0.3, 0.3);
  }

  // --- Sound: Game over ---
  gameover() {
    this.blip(300, 0.4, 0, 150);
  }

  // --- Sound: UI click ---
  click() {
    this.blip(1000, 0.04, 0, 800);
  }
}

const sfx = new SFX();

/* ==================================================================
   MAIN COMPONENT
   ================================================================== */

export default function BubbleShooterPlayerPage({ gameData, sessionToken, onComplete }) {
  const { settings, soundMap } = gameData || {};
  const soundMapRef = useRef(soundMap || {});
  useEffect(() => { soundMapRef.current = soundMap || {}; }, [soundMap]);

  const resolveSound = useCallback((id) => {
    if (!id) return null;
    return soundMapRef.current[id] || null;
  }, []);

  /* ------------------------------ REACT STATE ------------------------------ */
  const [screen, setScreen] = useState("home");
  const [prevScreen, setPrevScreen] = useState("home");
  const [difficulty, setDifficulty] = useState("medium");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(gameData?.high_score || 0);
  const [muted, setMuted] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [comboUi, setComboUi] = useState(0);
  const [gameOverReason, setGameOverReason] = useState("");
  const [victoryFinal, setVictoryFinal] = useState(false);

  /* -------------------------------- REFS -------------------------------- */
  const canvasRef = useRef(null);
  const gridRef = useRef(makeEmptyGrid());
  const projectileRef = useRef(null);
  const particlesRef = useRef([]);
  const fallingRef = useRef([]);
  const scoreTextsRef = useRef([]);
  const confettiRef = useRef([]);
  const comboRef = useRef(0);
  const comboTimerRef = useRef(0);
  const shakeRef = useRef(0);
  const aimAngleRef = useRef(-Math.PI / 2);
  const currentColorRef = useRef(PALETTE[0]);
  const nextColorRef = useRef(PALETTE[1]);
  const shotsSincePushRef = useRef(0);
  const pointerDownRef = useRef(false);
  const aimModeRef = useRef(false); // true after first tap (mobile two-tap: aim then shoot)
  const isTouchDeviceRef = useRef(typeof navigator !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const musicTimerRef = useRef(null);
  const completedRef = useRef(false);

  const screenRef = useRef(screen);
  const difficultyRef = useRef(difficulty);
  const levelRef = useRef(level);
  const mutedRef = useRef(muted);
  const musicOnRef = useRef(musicOn);
  const hapticsOnRef = useRef(hapticsOn);
  const scoreRef = useRef(score);
  const highScoreRef = useRef(highScore);

  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { musicOnRef.current = musicOn; }, [musicOn]);
  useEffect(() => { hapticsOnRef.current = hapticsOn; }, [hapticsOn]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { highScoreRef.current = highScore; }, [highScore]);

  /* ------------------------------ LOAD HIGH SCORE ------------------------------ */
  useEffect(() => {
    try {
      const globalHigh = gameData?.high_score;
      if (globalHigh > 0) { setHighScore(globalHigh); return; }
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    } catch (e) {}
  }, [gameData?.high_score]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      try { localStorage.setItem(HIGH_SCORE_KEY, String(score)); } catch (e) {}
    }
  }, [score]);

  /* ================================================================
     AUDIO — uses premium SFX engine
     ================================================================ */
  useEffect(() => {
    sfx.init();
  }, []);

  function playSound(type) {
    sfx.muted = mutedRef.current;
    switch (type) {
      case "click":      sfx.click(); break;
      case "launch":     sfx.launch(); break;
      case "collision":  sfx.collision(); break;
      case "pop":        sfx.pop(); break;
      case "drop":       sfx.drop(); break;
      case "bounce":     sfx.bounce(); break;
      case "combo":      sfx.combo(); break;
      case "victory":    sfx.victory(); break;
      case "gameover":   sfx.gameover(); break;
      case "levelclear": sfx.levelclear(); break;
      default: break;
    }
  }

  function scheduleMusic() {
    if (musicTimerRef.current) clearTimeout(musicTimerRef.current);
    const chords = [
      [261.6, 329.6, 392.0],
      [392.0, 493.9, 587.3],
      [440.0, 523.3, 659.3],
      [349.2, 440.0, 523.3],
    ];
    const beatDur = 1.0;
    let chordIdx = 0;
    const step = () => {
      if (!musicOnRef.current || screenRef.current !== "game") return;
      sfx.muted = mutedRef.current;
      if (!sfx.muted && sfx.ctx) {
        const chord = chords[chordIdx % chords.length];
        chordIdx++;
        const ctx = sfx.ctx;
        const padFilter = ctx.createBiquadFilter();
        padFilter.type = "lowpass";
        padFilter.frequency.value = 900;
        padFilter.Q.value = 0.7;
        padFilter.connect(sfx.master);
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0, ctx.currentTime);
          g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.12);
          g.gain.setValueAtTime(0.08, ctx.currentTime + beatDur * 0.7);
          g.gain.linearRampToValueAtTime(0, ctx.currentTime + beatDur * 0.98);
          osc.connect(g);
          g.connect(padFilter);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + beatDur + 0.05);
        });
        const shimmer = ctx.createOscillator();
        const sg = ctx.createGain();
        shimmer.type = "sine";
        shimmer.frequency.value = chord[0] * 2;
        sg.gain.setValueAtTime(0, ctx.currentTime);
        sg.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.08);
        sg.gain.linearRampToValueAtTime(0, ctx.currentTime + beatDur * 0.5);
        shimmer.connect(sg);
        sg.connect(padFilter);
        shimmer.start(ctx.currentTime);
        shimmer.stop(ctx.currentTime + beatDur * 0.6);
      }
      musicTimerRef.current = setTimeout(step, beatDur * 1000);
    };
    step();
  }

  function stopMusic() {
    if (musicTimerRef.current) { clearTimeout(musicTimerRef.current); musicTimerRef.current = null; }
  }

  // Haptics
  function vibrate(kind) {
    if (!hapticsOnRef.current) return;
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    try {
      switch (kind) {
        case "tap":      navigator.vibrate(8); break;
        case "aim":      navigator.vibrate([5, 3]); break;
        case "small":    navigator.vibrate(12); break;
        case "launch":   navigator.vibrate([8, 4, 12]); break;
        case "land":     navigator.vibrate([10, 5]); break;
        case "pop":      navigator.vibrate([15, 8, 20]); break;
        case "medium":   navigator.vibrate(25); break;
        case "drop":     navigator.vibrate([10, 6, 10, 6, 15]); break;
        case "combo":    navigator.vibrate([12, 5, 12, 5, 20, 8, 25]); break;
        case "large":    navigator.vibrate([30, 15, 50]); break;
        case "victory":  navigator.vibrate([20, 10, 20, 10, 40, 15, 60]); break;
        case "gameover": navigator.vibrate([40, 20, 30, 15, 20]); break;
        default: break;
      }
    } catch (e) {}
  }

  /* ================================================================
     GAME SETUP
     ================================================================ */
  function startNewGame(diff) {
    const cfg = DIFFICULTY[diff];
    setDifficulty(diff);
    difficultyRef.current = diff;
    setLevel(1);
    levelRef.current = 1;
    setScore(0);
    scoreRef.current = 0;
    completedRef.current = false;
    setVictoryFinal(false);
    aimModeRef.current = false;
    setupLevel(diff, 1);
    setScreen("game");
    sfx.init();
    playSound("click");
    vibrate("small");
  }

  function setupLevel(diff, lvl) {
    const cfg = DIFFICULTY[diff];
    const rows = Math.min(GRID_ROWS - 4, cfg.initialRows + lvl - 1);
    const colorCount = Math.min(PALETTE.length, cfg.colors + Math.floor((lvl - 1) / 2));
    gridRef.current = generateLevelGrid(rows, colorCount);
    projectileRef.current = null;
    particlesRef.current = [];
    fallingRef.current = [];
    scoreTextsRef.current = [];
    confettiRef.current = [];
    comboRef.current = 0;
    comboTimerRef.current = 0;
    shakeRef.current = 0;
    shotsSincePushRef.current = 0;
    aimAngleRef.current = -Math.PI / 2;
    currentColorRef.current = randomColor(colorCount);
    nextColorRef.current = randomColor(colorCount);
  }

  function restartGame() {
    aimModeRef.current = false;
    setupLevel(difficultyRef.current, levelRef.current);
    setScreen("game");
    playSound("click");
    vibrate("tap");
  }

  function goNextLevel() {
    const nl = levelRef.current + 1;
    setLevel(nl);
    levelRef.current = nl;
    aimModeRef.current = false;
    setupLevel(difficultyRef.current, nl);
    setScreen("game");
    playSound("click");
    vibrate("tap");
  }

  function goHome() {
    stopMusic();
    setScreen("home");
    playSound("click");
    vibrate("tap");
  }

  /* ================================================================
     PHYSICS + COLLISION
     ================================================================ */

  function findLandingCell(px, py) {
    const grid = gridRef.current;
    let best = null;
    let bestD = Infinity;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < colsInRow(r); c++) {
        if (grid[r][c]) continue;
        const attachable = r === 0 || neighborsOf(r, c).some(([nr, nc]) => grid[nr][nc]);
        if (!attachable) continue;
        const pos = cellToPos(r, c);
        const d = dist(pos.x, pos.y, px, py);
        if (d < bestD) { bestD = d; best = { r, c, pos }; }
      }
    }
    if (!best) {
      for (let c = 0; c < colsInRow(0); c++) {
        if (!grid[0][c]) { best = { r: 0, c, pos: cellToPos(0, c) }; break; }
      }
    }
    return best;
  }

  function floodMatch(row, col, color) {
    const grid = gridRef.current;
    const visited = new Set();
    const stack = [[row, col]];
    const matched = [];
    while (stack.length) {
      const [r, c] = stack.pop();
      const key = r + "_" + c;
      if (visited.has(key)) continue;
      visited.add(key);
      if (!grid[r] || grid[r][c] !== color) continue;
      matched.push([r, c]);
      for (const [nr, nc] of neighborsOf(r, c)) {
        if (!visited.has(nr + "_" + nc)) stack.push([nr, nc]);
      }
    }
    return matched;
  }

  function findFloating() {
    const grid = gridRef.current;
    const reached = new Set();
    const stack = [];
    for (let c = 0; c < colsInRow(0); c++) if (grid[0][c]) { stack.push([0, c]); reached.add("0_" + c); }
    while (stack.length) {
      const [r, c] = stack.pop();
      for (const [nr, nc] of neighborsOf(r, c)) {
        const key = nr + "_" + nc;
        if (!reached.has(key) && grid[nr][nc]) { reached.add(key); stack.push([nr, nc]); }
      }
    }
    const floating = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < colsInRow(r); c++) {
        if (grid[r][c] && !reached.has(r + "_" + c)) floating.push([r, c]);
      }
    }
    return floating;
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 160;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        color,
        size: 2 + Math.random() * 3.5,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        gravity: 260,
      });
    }
  }

  function spawnScoreText(x, y, text, color) {
    scoreTextsRef.current.push({ x, y, text, color, life: 1, vy: -40 });
  }

  function spawnConfetti() {
    confettiRef.current = [];
    for (let i = 0; i < 90; i++) {
      confettiRef.current.push({
        x: Math.random() * CANVAS_W,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 60,
        vy: 60 + Math.random() * 90,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        size: 4 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 6,
        life: 4 + Math.random() * 2,
      });
    }
  }

  function triggerShake(amount) {
    shakeRef.current = Math.max(shakeRef.current, amount);
  }

  function checkGameOver() {
    const grid = gridRef.current;
    for (let c = 0; c < colsInRow(LOSE_ROW); c++) {
      if (grid[LOSE_ROW][c]) return true;
    }
    for (let r = LOSE_ROW + 1; r < GRID_ROWS; r++) {
      for (let c = 0; c < colsInRow(r); c++) if (grid[r][c]) return true;
    }
    return false;
  }

  function checkVictory() {
    const grid = gridRef.current;
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < colsInRow(r); c++)
        if (grid[r][c]) return false;
    return true;
  }

  function handleLanding(landRow, landCol, color) {
    const grid = gridRef.current;
    grid[landRow][landCol] = color;
    playSound("collision");
    vibrate("land");

    const matched = floodMatch(landRow, landCol, color);
    let gained = 0;
    let popped = 0;

    if (matched.length >= 3) {
      comboRef.current += 1;
      comboTimerRef.current = 1.4;
      const mult = 1 + comboRef.current * 0.5;
      for (const [r, c] of matched) {
        const pos = cellToPos(r, c);
        grid[r][c] = null;
        spawnParticles(pos.x, pos.y, color, 10);
        popped++;
      }
      gained += Math.round(matched.length * POP_POINTS * mult);
      playSound("pop");
      if (comboRef.current >= 2) playSound("combo");
      vibrate("pop");
      triggerShake(matched.length >= 5 ? 8 : 4);

      const floating = findFloating();
      if (floating.length) {
        const mult2 = 1 + comboRef.current * 0.5;
        for (const [r, c] of floating) {
          const pos = cellToPos(r, c);
          const fcolor = grid[r][c];
          grid[r][c] = null;
          fallingRef.current.push({
            x: pos.x, y: pos.y, vx: (Math.random() - 0.5) * 60, vy: 20,
            color: fcolor, rot: 0, rotSpeed: (Math.random() - 0.5) * 6, life: 2,
          });
        }
        gained += Math.round(floating.length * FLOAT_POINTS * mult2);
        playSound("drop");
        vibrate("drop");
        triggerShake(6);
      }

      const centerPos = cellToPos(landRow, landCol);
      spawnScoreText(centerPos.x, centerPos.y - 10, "+" + gained, color);
      setComboUi(comboRef.current);
    } else {
      comboRef.current = 0;
      comboTimerRef.current = 0;
      setComboUi(0);
    }

    if (gained > 0) {
      scoreRef.current += gained;
      setScore(scoreRef.current);
    }

    shotsSincePushRef.current += 1;
    const cfg = DIFFICULTY[difficultyRef.current];
    const pushInterval = Math.max(3, cfg.pushInterval - (levelRef.current - 1));
    if (shotsSincePushRef.current >= pushInterval) {
      shotsSincePushRef.current = 0;
      pushNewRow();
    }

    if (checkGameOver()) {
      endGame("Bubbles reached the bottom!");
      return;
    }
    if (checkVictory()) {
      winLevel();
    }
  }

  function pushNewRow() {
    const grid = gridRef.current;
    const cfg = DIFFICULTY[difficultyRef.current];
    const colorCount = Math.min(PALETTE.length, cfg.colors + Math.floor((levelRef.current - 1) / 2));
    for (let r = GRID_ROWS - 1; r > 0; r--) grid[r] = grid[r - 1];
    grid[0] = generateRandomRow(colorCount);
    playSound("drop");
    vibrate("medium");
    triggerShake(5);
  }

  function endGame(reason) {
    setGameOverReason(reason);
    setScreen("gameover");
    playSound("gameover");
    vibrate("gameover");
    stopMusic();
  }

  function winLevel() {
    playSound("victory");
    vibrate("victory");
    spawnConfetti();
    stopMusic();
    if (levelRef.current >= MAX_LEVEL) {
      setVictoryFinal(true);
    } else {
      setVictoryFinal(false);
    }
    setScreen("victory");
  }

  /* ------------------------------ SHOOTING ------------------------------ */

  function computeAimAngle(px, py) {
    let dx = px - CANNON_X;
    let dy = py - CANNON_Y;
    if (dy > -20) dy = -20;
    let angle = Math.atan2(dy, dx);
    const minA = -Math.PI + 0.2;
    const maxA = -0.2;
    angle = clamp(angle, minA, maxA);
    return angle;
  }

  function shoot() {
    if (screenRef.current !== "game") return;
    if (projectileRef.current) return;
    const cfg = DIFFICULTY[difficultyRef.current];
    const angle = aimAngleRef.current;
    projectileRef.current = {
      x: CANNON_X, y: CANNON_Y,
      vx: Math.cos(angle) * cfg.speed,
      vy: Math.sin(angle) * cfg.speed,
      color: currentColorRef.current,
    };
    playSound("launch");
    vibrate("launch");
  }

  function afterShot() {
    const colorCount = Math.min(
      PALETTE.length,
      DIFFICULTY[difficultyRef.current].colors + Math.floor((levelRef.current - 1) / 2)
    );
    currentColorRef.current = nextColorRef.current;
    nextColorRef.current = randomColor(colorCount);
  }

  /* ------------------------------ POINTER HANDLERS ------------------------------ */

  function getCanvasCoords(e) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function onPointerMove(e) {
    if (screenRef.current !== "game") return;
    const { x, y } = getCanvasCoords(e);
    aimAngleRef.current = computeAimAngle(x, y);
  }
  function onPointerDown(e) {
    if (screenRef.current !== "game") return;
    pointerDownRef.current = true;
    const { x, y } = getCanvasCoords(e);
    aimAngleRef.current = computeAimAngle(x, y);
    // Mobile: first tap aims, second tap shoots
    if (isTouchDeviceRef.current) {
      if (aimModeRef.current) {
        shoot();
        aimModeRef.current = false;
      } else {
        aimModeRef.current = true;
        vibrate("aim");
      }
    } else {
      // Desktop: click shoots immediately
      shoot();
    }
  }
  function onPointerUp() {
    pointerDownRef.current = false;
  }

  /* ================================================================
     RENDERING
     ================================================================ */

  function drawBubble(ctx, x, y, r, color) {
    const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r);
    grad.addColorStop(0, shade(color, 90));
    grad.addColorStop(0.45, color);
    grad.addColorStop(1, shade(color, -40));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.beginPath();
    ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.34, r * 0.2, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r - 0.75, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.stroke();
  }

  function draw(ctx) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bg.addColorStop(0, "#2b0f52");
    bg.addColorStop(0.55, "#4a1f7a");
    bg.addColorStop(1, "#2a0f4d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let i = 0; i < 40; i++) {
      const gx = (i * 53) % CANVAS_W;
      const gy = (i * 97) % CANVAS_H;
      ctx.beginPath();
      ctx.arc(gx, gy, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    if (shakeRef.current > 0.1) {
      const s = shakeRef.current;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }

    ctx.strokeStyle = "rgba(255,80,100,0.35)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    const dangerY = TOP_MARGIN + LOSE_ROW * ROW_H + RADIUS;
    ctx.moveTo(0, dangerY);
    ctx.lineTo(CANVAS_W, dangerY);
    ctx.stroke();
    ctx.setLineDash([]);

    const grid = gridRef.current;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < colsInRow(r); c++) {
        if (grid[r][c]) {
          const pos = cellToPos(r, c);
          drawBubble(ctx, pos.x, pos.y, RADIUS - 1.5, grid[r][c]);
        }
      }
    }

    for (const fb of fallingRef.current) {
      ctx.save();
      ctx.translate(fb.x, fb.y);
      ctx.rotate(fb.rot);
      ctx.globalAlpha = clamp(fb.life / 2, 0, 1);
      drawBubble(ctx, 0, 0, RADIUS - 2, fb.color);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    if (screenRef.current === "game" && !projectileRef.current) {
      drawAimLine(ctx);
    }

    if (projectileRef.current) {
      const p = projectileRef.current;
      drawBubble(ctx, p.x, p.y, PROJECTILE_R - 1.5, p.color);
    }

    for (const p of particlesRef.current) {
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const st of scoreTextsRef.current) {
      ctx.globalAlpha = clamp(st.life, 0, 1);
      ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = st.color;
      ctx.textAlign = "center";
      ctx.fillText(st.text, st.x, st.y);
      ctx.globalAlpha = 1;
    }

    if (comboTimerRef.current > 0 && comboRef.current >= 2) {
      const alpha = clamp(comboTimerRef.current / 1.4, 0, 1);
      const scale = 1 + (1 - alpha) * 0.4;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 60);
      ctx.scale(scale, scale);
      ctx.font = "bold 30px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffd23f";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 8;
      ctx.fillText("COMBO x" + comboRef.current + "!", 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    drawCannon(ctx);

    ctx.restore();

    for (const cf of confettiRef.current) {
      ctx.save();
      ctx.translate(cf.x, cf.y);
      ctx.rotate(cf.rot);
      ctx.globalAlpha = clamp(cf.life / 2, 0, 1);
      ctx.fillStyle = cf.color;
      ctx.fillRect(-cf.size / 2, -cf.size / 2, cf.size, cf.size * 0.6);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawAimLine(ctx) {
    const angle = aimAngleRef.current;
    let vx = Math.cos(angle), vy = Math.sin(angle);
    ctx.save();
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANNON_X, CANNON_Y);
    let steps = 0;
    let cx = CANNON_X, cy = CANNON_Y;
    while (steps < 400 && cy > TOP_MARGIN) {
      cx += vx * 4;
      cy += vy * 4;
      if (cx <= RADIUS || cx >= CANVAS_W - RADIUS) { vx = -vx; cx = clamp(cx, RADIUS, CANVAS_W - RADIUS); }
      ctx.lineTo(cx, cy);
      steps++;
    }
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);
  }

  function drawCannon(ctx) {
    const angle = aimAngleRef.current;
    const glow = ctx.createRadialGradient(CANNON_X, CANNON_Y + 10, 5, CANNON_X, CANNON_Y + 10, 60);
    glow.addColorStop(0, "rgba(199,125,255,0.35)");
    glow.addColorStop(1, "rgba(199,125,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(CANNON_X - 60, CANNON_Y - 40, 120, 100);

    ctx.save();
    ctx.translate(CANNON_X, CANNON_Y);
    ctx.rotate(angle + Math.PI / 2);
    const barrelGrad = ctx.createLinearGradient(-14, 0, 14, 0);
    barrelGrad.addColorStop(0, "#8a4fd1");
    barrelGrad.addColorStop(0.5, "#c77dff");
    barrelGrad.addColorStop(1, "#8a4fd1");
    ctx.fillStyle = barrelGrad;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-13, -46, 26, 46, 8) : ctx.rect(-13, -46, 26, 46);
    ctx.fill();
    ctx.restore();

    const baseGrad = ctx.createRadialGradient(CANNON_X - 8, CANNON_Y - 8, 4, CANNON_X, CANNON_Y, 34);
    baseGrad.addColorStop(0, "#e6c7ff");
    baseGrad.addColorStop(0.5, "#9b5de5");
    baseGrad.addColorStop(1, "#5a2a8f");
    ctx.beginPath();
    ctx.arc(CANNON_X, CANNON_Y, 30, 0, Math.PI * 2);
    ctx.fillStyle = baseGrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.stroke();

    if (currentColorRef.current) {
      drawBubble(ctx, CANNON_X, CANNON_Y, RADIUS - 1, currentColorRef.current);
    }

    const nx = CANNON_X + 62, ny = CANNON_Y + 4;
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.textAlign = "center";
    ctx.fillText("NEXT", nx, ny - 20);
    if (nextColorRef.current) {
      drawBubble(ctx, nx, ny, (RADIUS - 1) * 0.7, nextColorRef.current);
    }
  }

  /* ================================================================
     GAME LOOP (persistent requestAnimationFrame)
     ================================================================ */
  useEffect(() => {
    function loop(t) {
      const dt = Math.min(0.033, (t - (lastTimeRef.current || t)) / 1000);
      lastTimeRef.current = t;

      const active = screenRef.current === "game";

      if (active) {
        const p = projectileRef.current;
        if (p) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x - PROJECTILE_R <= 0) { p.x = PROJECTILE_R; p.vx = -p.vx; playSound("bounce"); vibrate("tap"); }
          if (p.x + PROJECTILE_R >= CANVAS_W) { p.x = CANVAS_W - PROJECTILE_R; p.vx = -p.vx; playSound("bounce"); vibrate("tap"); }

          let landed = false;
          if (p.y - PROJECTILE_R <= TOP_MARGIN) {
            landed = true;
          } else {
            const grid = gridRef.current;
            outer:
            for (let r = 0; r < GRID_ROWS; r++) {
              for (let c = 0; c < colsInRow(r); c++) {
                if (!grid[r][c]) continue;
                const pos = cellToPos(r, c);
                if (dist(pos.x, pos.y, p.x, p.y) <= BUBBLE_D * 0.92) {
                  landed = true;
                  break outer;
                }
              }
            }
          }
          if (landed) {
            const cell = findLandingCell(p.x, p.y);
            const color = p.color;
            projectileRef.current = null;
            if (cell) handleLanding(cell.r, cell.c, color);
            afterShot();
          }
        }

        if (comboTimerRef.current > 0) {
          comboTimerRef.current -= dt;
          if (comboTimerRef.current <= 0) setComboUi(0);
        }
      }

      const grav = 380;
      fallingRef.current = fallingRef.current.filter((fb) => {
        fb.vy += grav * dt;
        fb.x += fb.vx * dt;
        fb.y += fb.vy * dt;
        fb.rot += fb.rotSpeed * dt;
        fb.life -= dt;
        return fb.life > 0 && fb.y < CANVAS_H + 60;
      });

      particlesRef.current = particlesRef.current.filter((pt) => {
        pt.vy += pt.gravity * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        return pt.life > 0;
      });

      scoreTextsRef.current = scoreTextsRef.current.filter((st) => {
        st.y += st.vy * dt;
        st.life -= dt * 0.8;
        return st.life > 0;
      });

      confettiRef.current = confettiRef.current.filter((cf) => {
        cf.x += cf.vx * dt;
        cf.y += cf.vy * dt;
        cf.rot += cf.rotSpeed * dt;
        cf.life -= dt;
        return cf.life > 0 && cf.y < CANVAS_H + 40;
      });

      if (shakeRef.current > 0) shakeRef.current *= 0.88;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        draw(ctx);
      }

      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    if (screen === "game" && musicOn) scheduleMusic();
    else stopMusic();
    return () => stopMusic();
  }, [screen, musicOn]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopMusic();
      } else if (screenRef.current === "game" && musicOnRef.current) {
        scheduleMusic();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        if (screenRef.current === "game") { setPrevScreen("game"); setScreen("paused"); playSound("click"); vibrate("tap"); }
        else if (screenRef.current === "paused") { setScreen("game"); playSound("click"); vibrate("tap"); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ================================================================
     UI ACTION HANDLERS
     ================================================================ */
  function openSettingsFrom(fromScreen) {
    setPrevScreen(fromScreen);
    setScreen("settings");
    playSound("click");
    vibrate("tap");
  }
  function closeSettings() {
    setScreen(prevScreen);
    playSound("click");
    vibrate("tap");
  }
  function pauseGame() {
    setScreen("paused");
    playSound("click");
    vibrate("tap");
  }
  function resumeGame() {
    setScreen("game");
    playSound("click");
    vibrate("tap");
  }

  /* ================================================================
     COMPLETE CALLBACK
     ================================================================ */
  const handleComplete = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      if (sessionToken) {
        await fetch('/api/play/session/complete', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: sessionToken, score: scoreRef.current, player_data: {} })
        });
      }
    } catch {}
    onComplete?.();
  }, [sessionToken, onComplete]);

  useEffect(() => {
    if (screen === "gameover") {
      handleComplete();
    }
  }, [screen, handleComplete]);

  /* ================================================================
     STYLES
     ================================================================ */
  const styles = `
    * { box-sizing: border-box; }
    .bs-root {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      width: 100%;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(160deg, #8fe3ff 0%, #57c3f5 55%, #2e9ee0 100%);
      padding: 16px;
      position: relative;
      overflow: hidden;
    }
    .bs-stage {
      position: relative;
      width: 100%;
      max-width: 420px;
      aspect-ratio: ${CANVAS_W} / ${CANVAS_H};
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(10,60,100,0.45), 0 0 0 6px rgba(255,255,255,0.55);
    }
    .bs-canvas {
      width: 100%;
      height: 100%;
      display: block;
      touch-action: none;
      cursor: crosshair;
    }
    .bs-hud {
      position: absolute;
      top: 0; left: 0; right: 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px 12px;
      pointer-events: none;
    }
    .bs-hud > * { pointer-events: auto; }
    .candy-chip {
      background: linear-gradient(180deg, #fffef8, #fff3d6);
      border-radius: 999px;
      padding: 7px 14px 7px 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 900;
      font-size: 13px;
      color: #5a3d1f;
      box-shadow: 0 4px 0 rgba(0,0,0,0.12), 0 6px 10px rgba(0,0,0,0.2), 0 0 0 3px rgba(255,255,255,0.6);
    }
    .candy-chip .chip-icon {
      width: 22px; height: 22px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px;
      background: radial-gradient(circle at 35% 30%, #fff2b0, #ffb347);
      box-shadow: 0 2px 3px rgba(0,0,0,0.25);
    }
    .candy-chip .chip-sub { font-size: 9px; font-weight: 800; color: #9a7a4a; }
    .candy-icon-btn {
      width: 42px; height: 42px;
      border-radius: 50%;
      border: none;
      display: flex; align-items: center; justify-content: center;
      font-size: 17px;
      cursor: pointer;
      position: relative;
      color: #fff;
      box-shadow: 0 4px 0 rgba(0,0,0,0.25), 0 7px 12px rgba(0,0,0,0.25), 0 0 0 3px rgba(255,255,255,0.55);
      transition: transform 0.1s ease;
    }
    .candy-icon-btn::after {
      content: ''; position: absolute; top: 12%; left: 20%; width: 42%; height: 30%;
      border-radius: 50%; background: rgba(255,255,255,0.45); pointer-events: none;
    }
    .candy-icon-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.2), 0 0 0 3px rgba(255,255,255,0.55); }
    .icon-blue { background: linear-gradient(180deg, #7fd6ff, #329bdb); }
    .icon-purple { background: linear-gradient(180deg, #c79bff, #8a5cf0); }
    .bs-combo-pill {
      position: absolute; top: 60px; left: 50%; transform: translateX(-50%);
      padding: 5px 16px; border-radius: 999px;
      font-size: 12px; font-weight: 900; color: #6a3d00;
      background: linear-gradient(180deg,#ffe37a,#ffb347);
      box-shadow: 0 4px 0 #d9871f, 0 6px 12px rgba(0,0,0,0.3);
      animation: bsPop 0.3s ease;
    }
    @keyframes bsPop { from { transform: translateX(-50%) scale(0.4); opacity:0; } to { transform: translateX(-50%) scale(1); opacity:1; } }
    .bs-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      background: linear-gradient(160deg, rgba(70,190,240,0.92), rgba(30,120,190,0.94));
      animation: bsFadeIn 0.3s ease;
      padding: 30px 22px 24px;
      text-align: center;
      overflow-y: auto;
    }
    @keyframes bsFadeIn { from { opacity: 0; transform: scale(0.97);} to { opacity: 1; transform: scale(1);} }
    .bs-float-bubble {
      position: absolute;
      border-radius: 50%;
      opacity: 0.45;
      animation: bsFloat 8s ease-in-out infinite;
    }
    @keyframes bsFloat {
      0%, 100% { transform: translateY(0) translateX(0); }
      50% { transform: translateY(-24px) translateX(10px); }
    }
    .ribbon-wrap { position: relative; margin-bottom: 14px; z-index: 3; }
    .ribbon {
      position: relative;
      padding: 12px 30px;
      font-weight: 900;
      font-size: 16px;
      letter-spacing: 0.3px;
      color: #fff;
      text-shadow: 0 2px 2px rgba(0,0,0,0.3);
      white-space: nowrap;
      clip-path: polygon(3% 0, 97% 0, 100% 50%, 97% 100%, 3% 100%, 0 50%);
      display: inline-block;
    }
    .ribbon::before, .ribbon::after {
      content: ''; position: absolute; top: 70%; width: 14px; height: 18px; z-index: -1;
    }
    .ribbon::before { left: -9px; transform: skewY(20deg); border-radius: 0 0 0 3px; }
    .ribbon::after { right: -9px; transform: skewY(-20deg); border-radius: 0 0 3px 0; }
    .ribbon-purple { background: linear-gradient(180deg, #c39bff, #7c4dd6); }
    .ribbon-purple::before, .ribbon-purple::after { background: #52299e; }
    .ribbon-orange { background: linear-gradient(180deg, #ffcb7a, #ff8a3d); }
    .ribbon-orange::before, .ribbon-orange::after { background: #c05a1a; }
    .ribbon-pink { background: linear-gradient(180deg, #ffabd9, #ff5fa0); }
    .ribbon-pink::before, .ribbon-pink::after { background: #c22d72; }
    .ribbon-teal { background: linear-gradient(180deg, #7ff0dd, #2bbfa8); }
    .ribbon-teal::before, .ribbon-teal::after { background: #178a78; }
    .ribbon-red { background: linear-gradient(180deg, #ff9d9d, #ef4444); }
    .ribbon-red::before, .ribbon-red::after { background: #a82323; }
    .candy-panel {
      background: linear-gradient(180deg, #fffef9, #fff6e4);
      border-radius: 26px;
      padding: 30px 22px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      width: 100%;
      max-width: 300px;
      box-shadow: 0 10px 0 rgba(0,0,0,0.15), 0 18px 30px rgba(0,0,0,0.3), 0 0 0 5px rgba(255,255,255,0.3);
      position: relative;
    }
    .candy-subtitle { color: #7a6a52; font-size: 13px; font-weight: 700; margin: -6px 0 0; }
    .candy-score-big {
      font-size: 42px;
      font-weight: 900;
      color: #ff8a3d;
      text-shadow: 0 3px 0 rgba(0,0,0,0.08);
      margin: 0;
    }
    .bs-title-plain {
      font-size: 27px;
      font-weight: 900;
      color: #fff;
      text-shadow: 0 3px 0 rgba(0,0,0,0.2), 0 6px 14px rgba(0,0,0,0.25);
      margin: 0;
      letter-spacing: 0.5px;
    }
    .bs-subtitle-plain { color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 700; margin-top: -10px; }
    .candy-btn {
      position: relative;
      border: none;
      border-radius: 50px;
      padding: 15px 26px;
      font-weight: 900;
      font-size: 15px;
      color: #fff;
      text-shadow: 0 2px 2px rgba(0,0,0,0.28);
      cursor: pointer;
      width: 100%;
      max-width: 250px;
      transition: transform 0.1s ease, box-shadow 0.1s ease;
    }
    .candy-btn::after {
      content: ''; position: absolute; top: 8%; left: 8%; right: 8%; height: 34%;
      border-radius: 50px; background: rgba(255,255,255,0.32); pointer-events: none;
    }
    .candy-btn:active { transform: translateY(4px); }
    .candy-green { background: linear-gradient(180deg,#b3e876,#6fbf3f); box-shadow: 0 6px 0 #4c8a29, 0 10px 16px rgba(0,0,0,0.3); }
    .candy-green:active { box-shadow: 0 2px 0 #4c8a29, 0 4px 8px rgba(0,0,0,0.25); }
    .candy-blue { background: linear-gradient(180deg,#7dd3ff,#2e9ee0); box-shadow: 0 6px 0 #1c6fa8, 0 10px 16px rgba(0,0,0,0.3); }
    .candy-blue:active { box-shadow: 0 2px 0 #1c6fa8, 0 4px 8px rgba(0,0,0,0.25); }
    .candy-purple { background: linear-gradient(180deg,#cba0ff,#8a5cf0); box-shadow: 0 6px 0 #5c34b8, 0 10px 16px rgba(0,0,0,0.3); }
    .candy-purple:active { box-shadow: 0 2px 0 #5c34b8, 0 4px 8px rgba(0,0,0,0.25); }
    .candy-orange { background: linear-gradient(180deg,#ffcb7a,#ff8a3d); box-shadow: 0 6px 0 #c05a1a, 0 10px 16px rgba(0,0,0,0.3); }
    .candy-orange:active { box-shadow: 0 2px 0 #c05a1a, 0 4px 8px rgba(0,0,0,0.25); }
    .candy-pink { background: linear-gradient(180deg,#ffabd9,#ff5fa0); box-shadow: 0 6px 0 #c22d72, 0 10px 16px rgba(0,0,0,0.3); }
    .candy-pink:active { box-shadow: 0 2px 0 #c22d72, 0 4px 8px rgba(0,0,0,0.25); }
    .candy-red { background: linear-gradient(180deg,#ff9d9d,#ef4444); box-shadow: 0 6px 0 #a82323, 0 10px 16px rgba(0,0,0,0.3); }
    .candy-red:active { box-shadow: 0 2px 0 #a82323, 0 4px 8px rgba(0,0,0,0.25); }
    .candy-btn.small { padding: 10px 20px; font-size: 12px; max-width: 160px; }
    .bs-row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
    .candy-round {
      width: 50px; height: 50px; border-radius: 50%;
      border: none; display: flex; align-items: center; justify-content: center;
      font-size: 20px; color: #fff; cursor: pointer; position: relative;
      box-shadow: 0 5px 0 rgba(0,0,0,0.2), 0 8px 14px rgba(0,0,0,0.3);
      transition: transform 0.1s ease;
    }
    .candy-round::after {
      content: ''; position: absolute; top: 14%; left: 20%; width: 40%; height: 28%;
      border-radius: 50%; background: rgba(255,255,255,0.4);
    }
    .candy-round:active { transform: translateY(3px); }
    .candy-check { background: linear-gradient(180deg,#a4e263,#4c9a2a); box-shadow: 0 5px 0 #33691e, 0 8px 14px rgba(0,0,0,0.3); }
    .candy-x { background: linear-gradient(180deg,#ff8f8f,#e33d3d); box-shadow: 0 5px 0 #a82323, 0 8px 14px rgba(0,0,0,0.3); }
    .bs-card-row { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .bs-diff-card {
      display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
      padding: 14px 18px; border-radius: 18px; cursor: pointer; text-align: left;
      color: #4a3520; transition: transform 0.12s ease;
      box-shadow: 0 5px 0 rgba(0,0,0,0.12), 0 8px 14px rgba(0,0,0,0.18);
    }
    .bs-diff-card:active { transform: translateY(3px); }
    .bs-diff-card .bs-diff-name { font-size: 16px; font-weight: 900; }
    .bs-diff-card .bs-diff-desc { font-size: 11.5px; opacity: 0.75; font-weight: 700; }
    .bs-diff-easy { background: linear-gradient(180deg,#d4f5b0,#a4e263); }
    .bs-diff-medium { background: linear-gradient(180deg,#ffe7a8,#ffcb7a); }
    .bs-diff-hard { background: linear-gradient(180deg,#ffb3c6,#ff8fae); }
    .bs-toggle-row {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; padding: 10px 6px; font-weight: 800; font-size: 13.5px; color: #4a3520;
    }
    .candy-switch {
      width: 68px; height: 32px; border-radius: 999px; position: relative;
      border: none; cursor: pointer; box-shadow: 0 3px 6px rgba(0,0,0,0.25) inset, 0 0 0 2px rgba(255,255,255,0.5);
    }
    .candy-switch.on { background: linear-gradient(180deg,#7dd3ff,#2e9ee0); }
    .candy-switch.off { background: linear-gradient(180deg,#d8dbe3,#a4a9b6); }
    .candy-switch::after {
      content: ''; position: absolute; top: 3px; width: 26px; height: 26px; border-radius: 50%;
      background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.35); transition: left 0.18s ease;
    }
    .candy-switch.on::after { left: 39px; }
    .candy-switch.off::after { left: 3px; }
    .candy-switch-label {
      position: absolute; top: 50%; transform: translateY(-50%);
      font-size: 9.5px; font-weight: 900; color: #fff; text-shadow: 0 1px 1px rgba(0,0,0,0.3);
    }
    .candy-switch.on .candy-switch-label { left: 8px; }
    .candy-switch.off .candy-switch-label { right: 8px; color: #626878; text-shadow: none; }

    /* ---------- THANK YOU PAGE ---------- */
    .ty-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(160deg, #a855f7 0%, #7c3aed 40%, #6d28d9 100%);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px; padding: 24px 20px; text-align: center; overflow-y: auto;
      animation: bsFadeIn 0.4s ease;
    }
    .ty-confetti {
      position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0;
    }
    .ty-dot {
      position: absolute; top: -10px; border-radius: 50%; opacity: 0.7;
      animation: tyFall linear infinite;
    }
    @keyframes tyFall {
      0% { transform: translateY(-10px) rotate(0deg); opacity: 0.8; }
      100% { transform: translateY(680px) rotate(360deg); opacity: 0.1; }
    }
    .ty-trophy-wrap {
      position: relative; z-index: 1; margin-bottom: 2px;
    }
    .ty-trophy-glow {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 120px; height: 120px; border-radius: 50%;
      background: radial-gradient(circle, rgba(255,215,0,0.35) 0%, rgba(255,215,0,0) 70%);
      animation: tyPulse 2s ease-in-out infinite;
    }
    @keyframes tyPulse { 0%,100%{transform:translate(-50%,-50%) scale(1);} 50%{transform:translate(-50%,-50%) scale(1.15);} }
    .ty-trophy {
      position: relative; z-index: 1;
      filter: drop-shadow(0 6px 20px rgba(255,215,0,0.5));
      animation: tyBounce 0.6s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes tyBounce { 0%{transform:scale(0.3) translateY(30px);opacity:0;} 60%{transform:scale(1.1) translateY(-5px);} 100%{transform:scale(1) translateY(0);opacity:1;} }
    .ty-ribbon-wrap { position: relative; z-index: 1; margin: -4px 0 4px; }
    .ty-ribbon {
      background: linear-gradient(180deg, #4f46e5 0%, #3730a3 100%);
      color: #fff; font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 0.85rem;
      letter-spacing: 2px; padding: 8px 28px; border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: inline-flex; align-items: center; gap: 8px;
      animation: tySlideUp 0.5s cubic-bezier(.2,1.2,.4,1) 0.2s backwards;
    }
    .ty-ribbon-star { color: #FFD700; font-size: 12px; }
    @keyframes tySlideUp { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
    .ty-title {
      font-family: 'Fredoka', sans-serif; font-size: 1.8rem; font-weight: 700;
      color: #fff; margin: 0; text-shadow: 0 3px 12px rgba(0,0,0,0.25);
      animation: tySlideUp 0.5s cubic-bezier(.2,1.2,.4,1) 0.3s backwards;
    }
    .ty-subtitle {
      color: rgba(255,255,255,0.85); font-size: 0.85rem; font-weight: 600; margin: 0;
      animation: tySlideUp 0.5s cubic-bezier(.2,1.2,.4,1) 0.35s backwards;
    }
    .ty-subtitle strong { color: #FFD700; }
    .ty-card {
      background: rgba(255,255,255,0.95); border-radius: 20px; padding: 18px 22px;
      width: 100%; max-width: 280px; position: relative; z-index: 1;
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
      animation: tySlideUp 0.5s cubic-bezier(.2,1.2,.4,1) 0.4s backwards;
    }
    .ty-card-icon {
      width: 44px; height: 44px; border-radius: 50%; margin: 0 auto 8px;
      background: linear-gradient(135deg, #c4b5fd, #a78bfa);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(124,58,237,0.3);
    }
    .ty-card-label {
      font-weight: 800; font-size: 0.85rem; color: #1e1b4b; margin: 0 0 10px;
    }
    .ty-progress-bar {
      position: relative; height: 10px; background: #e9e5f5; border-radius: 999px;
      overflow: visible; margin-bottom: 6px;
    }
    .ty-progress-fill {
      height: 100%; border-radius: 999px;
      background: linear-gradient(90deg, #7c3aed, #a855f7);
      transition: width 0.8s cubic-bezier(.2,1,.4,1);
      box-shadow: 0 0 8px rgba(124,58,237,0.4);
    }
    .ty-progress-dot {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 20px; height: 20px; border-radius: 50%;
      background: #fff; border: 3px solid #7c3aed;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .ty-dot-left { left: -4px; }
    .ty-dot-right { right: -4px; }
    .ty-progress-text {
      font-size: 0.75rem; font-weight: 700; color: #6b7280; margin: 4px 0 0;
    }
    .ty-stars {
      display: flex; gap: 10px; margin: 4px 0;
      animation: tySlideUp 0.5s cubic-bezier(.2,1.2,.4,1) 0.5s backwards;
    }
    .ty-star { transition: transform 0.3s cubic-bezier(.34,1.56,.64,1); }
    .ty-star.filled { animation: tyStarPop 0.4s cubic-bezier(.34,1.56,.64,1) backwards; }
    .ty-star:nth-child(2).filled { animation-delay: 0.1s; }
    .ty-star:nth-child(3).filled { animation-delay: 0.2s; }
    @keyframes tyStarPop { 0%{transform:scale(0) rotate(-30deg);} 100%{transform:scale(1) rotate(0deg);} }
    .ty-actions {
      display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 280px;
      animation: tySlideUp 0.5s cubic-bezier(.2,1.2,.4,1) 0.55s backwards;
    }
    .ty-btn {
      border: none; border-radius: 999px; padding: 14px 24px;
      font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.95rem;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .ty-btn:active { transform: translateY(3px); }
    .ty-btn-primary {
      background: linear-gradient(180deg, #a855f7, #7c3aed);
      color: #fff; box-shadow: 0 5px 0 #5b21b6, 0 8px 20px rgba(124,58,237,0.4);
    }
    .ty-btn-primary:active { box-shadow: 0 2px 0 #5b21b6; }
    .ty-btn-secondary {
      background: rgba(255,255,255,0.15); color: #fff;
      border: 2px solid rgba(255,255,255,0.3);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .ty-btn-secondary:active { box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
    .ty-btn-icon {
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;
    }
  `;

  /* ================================================================
     UI HELPERS
     ================================================================ */
  function ribbon(text, color, iconName) {
    return (
      <div className="ribbon-wrap">
        <span className={`ribbon ribbon-${color}`}>
          {iconName && (
            <span style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 7, position: "relative", top: -1 }}>
              {icon(iconName, 16, "#fff")}
            </span>
          )}
          {text}
        </span>
      </div>
    );
  }

  const decorBubbles = useMemo(() => {
    return new Array(10).fill(0).map((_, i) => ({
      id: i,
      size: 20 + Math.random() * 50,
      left: Math.random() * 90,
      top: Math.random() * 90,
      color: PALETTE[i % PALETTE.length],
      delay: Math.random() * 4,
      dur: 6 + Math.random() * 5,
    }));
  }, []);

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <div className="bs-root">
      <style>{styles}</style>
      <div className="bs-stage">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="bs-canvas"
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        />

        {/* IN-GAME HUD */}
        {(screen === "game" || screen === "paused") && (
          <div className="bs-hud">
            <div className="candy-chip">
              <span className="chip-icon">{icon("trophy", 14, "#a0722a")}</span>
              <span>{highScore}</span>
            </div>
            <div className="candy-chip" style={{ flexDirection: "column", alignItems: "flex-start", gap: 0, padding: "6px 14px" }}>
              <span style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 4 }}>
                {icon("star", 14, "#e6a817")} {score}
              </span>
              <span className="chip-sub">LEVEL {level}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="candy-icon-btn icon-blue" onClick={() => setMuted((m) => !m)} title="Mute">
                {muted ? icon("speakerOff", 18, "#fff") : icon("speakerOn", 18, "#fff")}
              </button>
              <button className="candy-icon-btn icon-purple" onClick={pauseGame} title="Pause">
                {icon("pause", 18, "#fff")}
              </button>
            </div>
          </div>
        )}
        {comboUi >= 2 && screen === "game" && (
          <div className="bs-combo-pill">
            {icon("flame", 12, "#e65100")} COMBO x{comboUi}
          </div>
        )}

        {/* HOME */}
        {screen === "home" && (
          <div className="bs-overlay">
            {decorBubbles.map((b) => (
              <div
                key={b.id}
                className="bs-float-bubble"
                style={{
                  width: b.size, height: b.size, left: b.left + "%", top: b.top + "%",
                  background: `radial-gradient(circle at 30% 30%, ${shade(b.color, 60)}, ${b.color})`,
                  animationDelay: b.delay + "s", animationDuration: b.dur + "s",
                }}
              />
            ))}
            {ribbon("BUBBLE BLAST", "purple", "bubble")}
            <p className="bs-subtitle-plain">Pop. Combo. Conquer.</p>
            <div className="candy-chip" style={{ marginTop: -4 }}>
              <span className="chip-icon">{icon("trophy", 14, "#a0722a")}</span>
              <span>High Score: {highScore}</span>
            </div>
            <button className="candy-btn candy-green" onClick={() => { playSound("click"); vibrate("tap"); setScreen("difficulty"); }}>
              {icon("play", 16, "#fff")} Play
            </button>
            <button className="candy-btn candy-blue" onClick={() => openSettingsFrom("home")}>
              {icon("gear", 16, "#fff")} Settings
            </button>
          </div>
        )}

        {/* DIFFICULTY SELECT */}
        {screen === "difficulty" && (
          <div className="bs-overlay">
            {ribbon("Choose Difficulty", "orange", "flame")}
            <div className="candy-panel" style={{ marginTop: -4 }}>
              <div className="bs-card-row">
                {Object.entries(DIFFICULTY).map(([key, cfg]) => (
                  <div
                    key={key}
                    className={`bs-diff-card bs-diff-${key}`}
                    onClick={() => startNewGame(key)}
                  >
                    <span className="bs-diff-name">{cfg.label}</span>
                    <span className="bs-diff-desc">{cfg.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="candy-round candy-x" onClick={() => { playSound("click"); vibrate("tap"); setScreen("home"); }} title="Back">
              {icon("cross", 20, "#fff")}
            </button>
          </div>
        )}

        {/* PAUSED */}
        {screen === "paused" && (
          <div className="bs-overlay">
            {ribbon("Paused", "purple", "pause")}
            <div className="candy-panel" style={{ marginTop: -4 }}>
              <button className="candy-btn candy-green" onClick={resumeGame}>
                {icon("play", 16, "#fff")} Resume
              </button>
              <button className="candy-btn candy-blue" onClick={() => openSettingsFrom("paused")}>
                {icon("gear", 16, "#fff")} Settings
              </button>
              <button className="candy-btn candy-orange" onClick={restartGame}>
                {icon("refresh", 16, "#fff")} Restart
              </button>
              <button className="candy-btn candy-pink" onClick={goHome}>
                {icon("home", 16, "#fff")} Home
              </button>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {screen === "settings" && (
          <div className="bs-overlay">
            {ribbon("Settings", "purple", "gear")}
            <div className="candy-panel" style={{ marginTop: -4 }}>
              <div className="bs-toggle-row">
                <span>{icon("speakerOn", 16, "#4a3520")} Sound</span>
                <button className={`candy-switch ${!muted ? "on" : "off"}`} onClick={() => setMuted((m) => !m)}>
                  <span className="candy-switch-label">{!muted ? "ON" : "OFF"}</span>
                </button>
              </div>
              <div className="bs-toggle-row">
                <span>{icon("music", 16, "#4a3520")} Music</span>
                <button className={`candy-switch ${musicOn ? "on" : "off"}`} onClick={() => setMusicOn((m) => !m)}>
                  <span className="candy-switch-label">{musicOn ? "ON" : "OFF"}</span>
                </button>
              </div>
              <div className="bs-toggle-row">
                <span>{icon("haptics", 16, "#4a3520")} Haptics</span>
                <button className={`candy-switch ${hapticsOn ? "on" : "off"}`} onClick={() => setHapticsOn((m) => !m)}>
                  <span className="candy-switch-label">{hapticsOn ? "ON" : "OFF"}</span>
                </button>
              </div>
              <div className="bs-row" style={{ marginTop: 6 }}>
                <button className="candy-round candy-check" onClick={closeSettings} title="Done">
                  {icon("check", 22, "#fff")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* THANK YOU — Game Over / Victory */}
        {(screen === "gameover" || screen === "victory") && (
          <div className="ty-overlay">
            {/* Animated confetti dots */}
            <div className="ty-confetti">
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="ty-dot" style={{
                  left: `${8 + (i * 5.2) % 85}%`,
                  animationDelay: `${(i * 0.3) % 2}s`,
                  animationDuration: `${2 + (i % 3) * 0.7}s`,
                  background: ["#ff6fa5","#8b6ef0","#35c9a5","#ffc93d","#4fb6ff","#ff8a3d"][i % 6],
                  width: `${4 + (i % 3) * 2}px`,
                  height: `${4 + (i % 3) * 2}px`,
                }} />
              ))}
            </div>

            {/* Trophy */}
            <div className="ty-trophy-wrap">
              <div className="ty-trophy-glow" />
              <div className="ty-trophy">{icon("trophy", 72, "#FFD700")}</div>
            </div>

            {/* Ribbon */}
            <div className="ty-ribbon-wrap">
              <div className="ty-ribbon">
                <span className="ty-ribbon-star">&#9733;</span>
                {screen === "victory" ? "GAME COMPLETED!" : "GAME OVER"}
                <span className="ty-ribbon-star">&#9733;</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="ty-title">
              {screen === "victory" ? "Congratulations!" : "Good Try!"}
            </h2>
            <p className="ty-subtitle">
              You scored <strong>{score}</strong> points on Level {level}
            </p>

            {/* Progress Card */}
            <div className="ty-card">
              <div className="ty-card-icon">
                {icon("star", 22, "#7c3aed")}
              </div>
              <p className="ty-card-label">Performance</p>
              <div className="ty-progress-bar">
                <div className="ty-progress-fill" style={{
                  width: `${Math.min(100, (score / Math.max(1, highScore)) * 100)}%`
                }} />
                <span className="ty-progress-dot ty-dot-left" />
                <span className="ty-progress-dot ty-dot-right" />
              </div>
              <p className="ty-progress-text">
                {score} of {highScore} best
              </p>
            </div>

            {/* Stars */}
            <div className="ty-stars">
              {[1, 2, 3].map((s) => (
                <span key={s} className={`ty-star ${score >= (s * 100) ? "filled" : ""}`}>
                  {icon("star", 28, score >= (s * 100) ? "#FFD700" : "#d4d0e0")}
                </span>
              ))}
            </div>

            {/* Buttons */}
            <div className="ty-actions">
              {screen === "victory" && !victoryFinal && (
                <button className="ty-btn ty-btn-primary" onClick={goNextLevel}>
                  <span className="ty-btn-icon">{icon("arrowRight", 18, "#fff")}</span>
                  Next Level
                </button>
              )}
              {screen === "gameover" && (
                <button className="ty-btn ty-btn-primary" onClick={() => { setGameOverReason(""); restartGame(); }}>
                  <span className="ty-btn-icon">{icon("refresh", 18, "#fff")}</span>
                  Try Again
                </button>
              )}
              {victoryFinal && (
                <button className="ty-btn ty-btn-primary" onClick={goHome}>
                  <span className="ty-btn-icon">{icon("home", 18, "#fff")}</span>
                  Submit & Explore
                </button>
              )}
              <button className="ty-btn ty-btn-secondary" onClick={goHome}>
                {icon("home", 16, "#7c3aed")} Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
