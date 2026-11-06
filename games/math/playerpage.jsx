import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ============================================================================
   MATH CHALLENGE — bright arcade-style speed-arithmetic game
   Single-file React component. No external CSS, no game engine, hooks only.
   Theme: PromoGames purple / SpyZUI mascot
============================================================================ */

/* --------------------------------- helpers -------------------------------- */

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ------------------------------ level config ------------------------------ */

const LEVEL_META = [
  { level: 1, label: "Warm-Up",      numMax: 10,  ops: ["+", "−"],           choices: 2, baseTime: 12 },
  { level: 2, label: "Getting Sharp", numMax: 20,  ops: ["+", "−", "×"],      choices: 3, baseTime: 11 },
  { level: 3, label: "Full Speed",   numMax: 50,  ops: ["×", "÷"],           choices: 3, baseTime: 10 },
  { level: 4, label: "Brain Teaser", numMax: 80,  ops: ["+", "−", "×", "÷"], choices: 4, baseTime: 9  },
  { level: 5, label: "Math Wizard",  numMax: 100, ops: ["+", "−", "×", "÷"], choices: 4, baseTime: 7  },
];

// Leveling is tied directly to how many correct answers the player has
// banked this session — simple, visible, and impossible for the state to
// get "stuck": every threshold is a plain correctCount check.
const LEVEL_THRESHOLDS = [0, 6, 14, 24, 36];
function getLevelForCorrect(correctCount) {
  let lvl = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (correctCount >= LEVEL_THRESHOLDS[i]) lvl = i + 1;
  }
  if (correctCount >= 36) lvl = 5 + Math.floor((correctCount - 36) / 14);
  return lvl;
}

function getConfig(level) {
  const base = LEVEL_META[Math.min(level, 5) - 1] || LEVEL_META[4];
  if (level <= 5) return { ...base, level };
  const extra = level - 5;
  return {
    ...LEVEL_META[4],
    level,
    label: "Math Wizard +" + extra,
    baseTime: Math.max(4, LEVEL_META[4].baseTime - extra * 0.35),
    numMax: Math.min(300, LEVEL_META[4].numMax + extra * 8),
  };
}

/* --------------------------- question generators --------------------------- */

function genAdditive(cfg) {
  const opsAvail = cfg.ops.filter((o) => o === "+" || o === "−");
  const op = pick(opsAvail.length ? opsAvail : ["+"]);
  const a = randInt(1, cfg.numMax);
  const b = randInt(1, cfg.numMax);
  if (op === "−") {
    const hi = Math.max(a, b), lo = Math.min(a, b);
    return { display: `${hi} − ${lo}`, answer: hi - lo };
  }
  return { display: `${a} + ${b}`, answer: a + b };
}

function genLevel2(cfg) {
  const op = pick(cfg.ops);
  if (op === "×") {
    const a = randInt(2, Math.min(12, cfg.numMax));
    const b = randInt(2, 9);
    return { display: `${a} × ${b}`, answer: a * b };
  }
  return genAdditive({ ...cfg, ops: ["+", "−"] });
}

function genLevel3() {
  const useDiv = pick(["×", "÷"]) === "÷";
  if (useDiv) {
    const d = randInt(2, 11);
    const q = randInt(2, 11);
    return { display: `${d * q} ÷ ${d}`, answer: q };
  }
  const a = randInt(2, 12);
  const b = randInt(2, 11);
  return { display: `${a} × ${b}`, answer: a * b };
}

function genLevel4(cfg) {
  // (a op1 b) op2 c — every branch is constructed to be a non-negative integer
  const a = randInt(2, Math.min(20, cfg.numMax));
  const b = randInt(2, Math.min(15, cfg.numMax));
  const c = randInt(2, Math.min(12, cfg.numMax));
  const pattern = randInt(0, 3);

  if (pattern === 0) return { display: `(${a} + ${b}) × ${c}`, answer: (a + b) * c };
  if (pattern === 1) {
    const hi = Math.max(a, b), lo = Math.min(a, b);
    return { display: `(${hi} − ${lo}) + ${c}`, answer: hi - lo + c };
  }
  if (pattern === 2) {
    const product = a * c;
    const divisors = [];
    for (let d = 2; d <= 12; d++) if (product % d === 0) divisors.push(d);
    const d = divisors.length ? pick(divisors) : 1;
    return { display: `(${a} × ${c}) ÷ ${d}`, answer: (a * c) / d };
  }
  return { display: `${a} + (${b} × ${c})`, answer: a + b * c };
}

function genLevel5(cfg) {
  // multi-operator BODMAS chains, every branch guaranteed non-negative
  const a = randInt(2, Math.min(30, cfg.numMax));
  const b = randInt(2, Math.min(20, cfg.numMax));
  const c = randInt(2, 12);
  const d = randInt(2, 10);
  const pattern = randInt(0, 4);

  if (pattern === 0) {
    const product = a + b * c;
    const sub = Math.min(d, product);
    return { display: `${a} + ${b} × ${c} − ${sub}`, answer: product - sub };
  }
  if (pattern === 1) {
    const sum = a + b;
    const divisors = [];
    for (let x = 2; x <= 12; x++) if (sum % x === 0) divisors.push(x);
    const div = divisors.length ? pick(divisors) : 1;
    return { display: `(${a} + ${b}) ÷ ${div} × ${c}`, answer: (sum / div) * c };
  }
  if (pattern === 2) {
    // m × n − (p − q), constructed so the product always covers the subtraction
    const m = randInt(3, 9);
    const n = randInt(2, 9);
    const q = randInt(1, 10);
    const diff = randInt(1, m * n - 1);
    const p = q + diff;
    return { display: `${m} × ${n} − (${p} − ${q})`, answer: m * n - diff };
  }
  if (pattern === 3) {
    const div = pick([2, 3, 4, 5, 6]);
    const dividend = div * randInt(2, 10);
    return { display: `${dividend} ÷ ${div} + ${b} × ${c}`, answer: dividend / div + b * c };
  }
  const hi = Math.max(a, b), lo = Math.min(a, b);
  return { display: `(${hi} − ${lo}) + (${c} × ${d})`, answer: hi - lo + c * d };
}

function generateQuestion(level, usedSet) {
  const cfg = getConfig(level);
  let q, attempt = 0;
  do {
    if (cfg.level === 1) q = genAdditive(cfg);
    else if (cfg.level === 2) q = genLevel2(cfg);
    else if (cfg.level === 3) q = genLevel3();
    else if (cfg.level === 4) q = genLevel4(cfg);
    else q = genLevel5(cfg);
    attempt++;
  } while (usedSet.has(q.display) && attempt < 40);
  usedSet.add(q.display);
  return { ...q, cfg };
}

function generateChoices(answer, count) {
  const set = new Set([answer]);
  const magnitude = Math.max(2, Math.round(Math.abs(answer) * 0.18));
  let guard = 0;
  while (set.size < count && guard < 200) {
    guard++;
    const delta = randInt(1, Math.max(3, magnitude)) * (Math.random() < 0.5 ? -1 : 1);
    const val = answer + delta;
    if (val >= 0 && !set.has(val)) set.add(val);
  }
  const arr = [...set];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* -------------------------------- sound engine ------------------------------ */

function useSoundEngine(enabled) {
  const ctxRef = useRef(null);
  const ambientRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const tone = useCallback((freq, dur, type = "sine", vol = 0.16, when = 0) => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + when);
    gain.gain.setValueAtTime(vol, ctx.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + when);
    osc.stop(ctx.currentTime + when + dur);
  }, [enabled, getCtx]);

  const noiseBurst = useCallback((dur = 0.18, vol = 0.1, filterFreq = 2200) => {
    if (!enabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }, [enabled, getCtx]);

  /* quick two-note chirp helper */
  const chirp = useCallback((f1, f2, dur = 0.06, vol = 0.12) => {
    tone(f1, dur, "sine", vol);
    tone(f2, dur, "sine", vol * 0.8, dur * 0.45);
  }, [tone]);

  return useMemo(() => ({
    pop: () => {
      chirp(880, 1320, 0.05, 0.10);
      noiseBurst(0.08, 0.05, 3800);
    },
    click: () => {
      tone(660, 0.04, "square", 0.06);
      tone(990, 0.04, "square", 0.04, 0.02);
    },
    correct: () => {
      /* ascending three-note arpeggio — bright and satisfying */
      tone(880, 0.09, "sine", 0.14);
      tone(1175, 0.09, "sine", 0.12, 0.06);
      tone(1568, 0.14, "sine", 0.10, 0.12);
      /* sparkle tail */
      tone(2093, 0.08, "sine", 0.06, 0.18);
      tone(2637, 0.06, "sine", 0.04, 0.22);
    },
    wrong: () => {
      /* descending buzz — noticeable but not harsh */
      tone(260, 0.15, "sawtooth", 0.12);
      tone(190, 0.18, "sawtooth", 0.09, 0.04);
      tone(140, 0.14, "sawtooth", 0.06, 0.08);
      noiseBurst(0.10, 0.06, 600);
    },
    beep: () => {
      /* urgent countdown tick */
      tone(1046, 0.05, "square", 0.08);
      tone(1046, 0.05, "square", 0.05, 0.06);
    },
    levelup: () => {
      /* triumphant fanfare — fast ascending scale */
      const notes = [523, 659, 784, 1046, 1318, 1568];
      notes.forEach((f, i) => tone(f, 0.14, "triangle", 0.11, i * 0.07));
      /* final sparkle chord */
      tone(1046, 0.20, "sine", 0.08, 0.45);
      tone(1318, 0.20, "sine", 0.06, 0.45);
      tone(1568, 0.20, "sine", 0.05, 0.45);
    },
    highscore: () => {
      /* celebratory cascade */
      [659, 880, 1046, 1318, 1568, 2093].forEach((f, i) => tone(f, 0.18, "sine", 0.12, i * 0.09));
      /* shimmer chords */
      tone(1046, 0.30, "triangle", 0.06, 0.50);
      tone(1318, 0.30, "triangle", 0.05, 0.52);
      tone(1568, 0.25, "triangle", 0.04, 0.54);
    },
    ambientStart: () => {
      if (!enabled || ambientRef.current) return;
      const ctx = getCtx();
      if (!ctx) return;
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.02;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 340;
      const gain = ctx.createGain();
      gain.gain.value = 0.5;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      ambientRef.current = src;
    },
    ambientStop: () => {
      if (ambientRef.current) {
        try { ambientRef.current.stop(); } catch (e) {}
        ambientRef.current = null;
      }
    },
  }), [enabled, tone, noiseBurst, chirp, getCtx]);
}

function haptic(pattern) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch (e) {}
  }
}

/* ---------------------------------- storage --------------------------------- */

const BEST_KEY = "mathChallenge.bestScore.v2";
function loadBest() {
  try { return parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) {}
}

/* ----------------------------------- icons ----------------------------------- */

const IconStar = ({ filled = true, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
    <path d="M12 2.5l2.9 6.32 6.85.65-5.2 4.66 1.55 6.87L12 17.9l-6.1 3.1 1.55-6.87-5.2-4.66 6.85-.65L12 2.5z" strokeLinejoin="round" />
  </svg>
);
const IconTrophy = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#8b2fd9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 4h8v5a4 4 0 01-8 0V4z" fill="#ffc94a" stroke="#E88A00" />
    <path d="M8 5H5a2 2 0 002 4" stroke="#c084fc" strokeWidth="1.5" />
    <path d="M16 5h3a2 2 0 01-2 4" stroke="#c084fc" strokeWidth="1.5" />
    <path d="M12 13v3" stroke="#E88A00" />
    <path d="M9 20h6" stroke="#E88A00" strokeWidth="1.8" />
    <path d="M12 16c-2 0-3 1.4-3 4h6c0-2.6-1-4-3-4z" fill="#ffc94a" stroke="#E88A00" />
  </svg>
);
const IconCoin = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#FFC94A" stroke="#E88A00" strokeWidth="1.4" />
    <circle cx="12" cy="12" r="6.4" fill="none" stroke="#E88A00" strokeWidth="1.2" opacity="0.6" />
    <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill="#E88A00" fontFamily="Baloo 2, sans-serif">$</text>
  </svg>
);
const IconSound = ({ on, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    {on && <path d="M16.5 8.5a5 5 0 010 7" />}
    {on && <path d="M19 6a8.5 8.5 0 010 12" />}
    {!on && <path d="M17 9l4 6M21 9l-4 6" />}
  </svg>
);
const IconGear = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
const IconArrowLeft = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
const IconClock = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

/* --------------------------------- mascot --------------------------------- */

function Mascot({ className = "", mood = "happy" }) {
  return (
    <img
      src="/mascotques.webp"
      alt="Mascot"
      className={`mc-mascot-img ${className}`}
    />
  );
}

/* ------------------------------ small components ------------------------------ */

function FloatingSymbols() {
  const symbols = useMemo(() => {
    const chars = ["+", "−", "×", "÷", "="];
    return [...Array(16)].map((_, i) => ({
      ch: chars[i % chars.length],
      left: (i * 37) % 100,
      delay: (i * 0.27) % 3.2,
      dur: 4 + ((i * 13) % 5),
      size: 18 + ((i * 7) % 22),
    }));
  }, []);

  return (
    <div className="mc-intro-symbols" aria-hidden="true">
      {symbols.map((s, i) => (
        <span key={i} className="mc-intro-symbol" style={{ left: `${s.left}%`, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s`, fontSize: `${s.size}px` }}>
          {s.ch}
        </span>
      ))}
    </div>
  );
}

function Particles({ burst }) {
  if (!burst) return null;
  return (
    <div className="mc-particles" style={{ left: burst.x, top: burst.y }}>
      {burst.dots.map((d, i) => (
        <span
          key={i}
          className="mc-particle"
          style={{ "--tx": `${d.tx}px`, "--ty": `${d.ty}px`, "--rot": `${d.rot}deg`, background: d.color, animationDelay: `${d.delay}ms` }}
        />
      ))}
    </div>
  );
}

function FloatingStars({ trigger }) {
  if (!trigger) return null;
  return (
    <div className="mc-star-float-wrap">
      {[...Array(7)].map((_, i) => (
        <span key={i} className="mc-star-float" style={{ left: `${8 + i * 13}%`, animationDelay: `${i * 60}ms` }}>
          <IconStar size={20} />
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------ app ------------------------------------ */

export default function MathChallenge({ gameData, sessionToken, onComplete }) {
  const [screen, setScreen] = useState("home"); // home | playing | gameover
  const [soundOn, setSoundOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bestScore, setBestScore] = useState(gameData?.high_score || 0);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highestCombo, setHighestCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const [stars, setStars] = useState(3);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const [question, setQuestion] = useState(null);
  const [choices, setChoices] = useState([]);
  const [questionKey, setQuestionKey] = useState(0);
  const [maxTime, setMaxTime] = useState(12);
  const [timeLeft, setTimeLeft] = useState(12);
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'wrong'
  const [pickedIdx, setPickedIdx] = useState(null);
  const [popups, setPopups] = useState([]);
  const [burst, setBurst] = useState(null);
  const [milestone, setMilestone] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  const usedQuestionsRef = useRef(new Set());
  const lastBeepSecondRef = useRef(null);
  const popupIdRef = useRef(0);
  const gameRef = useRef(gameData);
  useEffect(() => { gameRef.current = gameData }, [gameData]);
  const sound = useSoundEngine(soundOn);

  useEffect(() => {
    setBestScore(prev => Math.max(prev, loadBest()));
    const mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq && mq.matches) setReducedMotion(true);
  }, []);

  /* pause bg music when tab is hidden, resume when visible */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        sound.ambientStop();
      } else if (screen === "playing" && soundOn) {
        sound.ambientStart();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [screen, soundOn, sound]);

  const comboMultiplier = useMemo(() => Math.min(3, 1 + Math.floor(streak / 3) * 0.5), [streak]);
  const accuracy = questionsAnswered > 0 ? Math.round((correctCount / questionsAnswered) * 100) : 100;
  const nextPreviewPts = Math.round(12 * level * comboMultiplier);

  /* --------------------------- question lifecycle --------------------------- */

  const nextQuestion = useCallback((lvl) => {
    const cfg = getConfig(lvl);
    const q = generateQuestion(lvl, usedQuestionsRef.current);
    const ch = generateChoices(q.answer, cfg.choices);
    setQuestion(q);
    setChoices(ch);
    setQuestionKey((k) => k + 1);
    setFeedback(null);
    setPickedIdx(null);
    setMaxTime(cfg.baseTime);
    setTimeLeft(cfg.baseTime);
    lastBeepSecondRef.current = null;
    sound.pop();
  }, [sound]);

  const startGame = useCallback(() => {
    usedQuestionsRef.current = new Set();
    setScore(0);
    setStreak(0);
    setHighestCombo(0);
    setLevel(1);
    setStars(3);
    setQuestionsAnswered(0);
    setCorrectCount(0);
    setIsNewBest(false);
    setPopups([]);
    setBurst(null);
    setMilestone(0);
    setScreen("playing");
    nextQuestion(1);
    if (soundOn) sound.ambientStart();
    if (hapticsOn) haptic([10, 20, 10]);
  }, [nextQuestion, sound, soundOn]);

  const endGame = useCallback((finalScore) => {
    sound.ambientStop();
    setScreen("gameover");
    setBestScore((prev) => {
      if (finalScore > prev) {
        saveBest(finalScore);
        setIsNewBest(true);
        sound.highscore();
        if (hapticsOn) haptic([20, 15, 20, 15, 20, 15, 40]);
        return finalScore;
      }
      return prev;
    });
    if (finalScore > 0 && gameRef.current?.id) {
      try {
        let devId = null;
        try { devId = localStorage.getItem('device_id') || null } catch {}
        fetch('/api/play/record-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game_id: gameRef.current.id, score: finalScore, device_id: devId || undefined })
        }).then(r => r.json()).then(d => { if (d && d.success && d.high_score) setBestScore(p => Math.max(p, d.high_score)) }).catch(() => {})
      } catch {}
    }
  }, [sound, hapticsOn]);

  const goHome = useCallback(() => {
    sound.ambientStop();
    setScreen("home");
    setSettingsOpen(false);
  }, [sound]);

  /* --------------------------------- timer --------------------------------- */

  useEffect(() => {
    if (screen !== "playing" || feedback !== null) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        const nt = Math.max(0, t - 0.1);
        const secondsLeft = Math.ceil(nt);
        if (secondsLeft <= 3 && secondsLeft >= 1 && secondsLeft !== lastBeepSecondRef.current && nt > 0) {
          lastBeepSecondRef.current = secondsLeft;
          sound.beep();
        }
        if (nt <= 0) setFeedback((f) => (f === null ? "wrong" : f));
        return nt;
      });
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, feedback, questionKey]);

  // if the timer ran out (rather than a tap), pickedIdx stays null — route it
  // through the same wrong-answer path exactly once per question.
  useEffect(() => {
    if (feedback === "wrong" && pickedIdx === null) registerWrong(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  /* --------------------------------- answers --------------------------------- */

  const spawnPopup = (text, positive) => {
    const id = popupIdRef.current++;
    setPopups((p) => [...p, { id, text, positive }]);
    setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 900);
  };

  const spawnBurst = (colorList) => {
    const dots = [...Array(14)].map(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 60;
      return { tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist, rot: Math.random() * 360, color: pick(colorList), delay: Math.random() * 80 };
    });
    setBurst({ x: "50%", y: "46%", dots });
    setTimeout(() => setBurst(null), 700);
  };

  // Every value the level-up decision needs is read directly from current
  // state and computed into plain local variables — nothing here depends on
  // a stale closure or a functional-updater side effect, which is what made
  // levelling unreliable before.
  const registerCorrect = (idx) => {
    if (feedback !== null) return;
    setPickedIdx(idx);
    setFeedback("correct");
    sound.correct();
    if (hapticsOn) haptic([15, 40, 25]);
    spawnBurst(["#c084fc", "#6FE07A", "#a855f7", "#ffffff"]);

    const newStreak = streak + 1;
    const newCorrect = correctCount + 1;
    const newAnswered = questionsAnswered + 1;
    const mult = Math.min(3, 1 + Math.floor(newStreak / 3) * 0.5);
    const pts = Math.round(12 * level * mult);
    const newScore = score + pts;
    const newLevel = getLevelForCorrect(newCorrect);

    setStreak(newStreak);
    setCorrectCount(newCorrect);
    setQuestionsAnswered(newAnswered);
    setHighestCombo((h) => Math.max(h, newStreak));
    setScore(newScore);
    spawnPopup(`+${pts}`, true);

    if (newLevel !== level) {
      setLevel(newLevel);
      setLevelUpFlash(true);
      sound.levelup();
      if (hapticsOn) haptic([20, 30, 20, 30, 40]);
      setTimeout(() => setLevelUpFlash(false), 1300);
    }

    if (Math.floor(newScore / 300) > Math.floor(score / 300)) {
      setMilestone((m) => m + 1);
    }

    setTimeLeft((t) => Math.min(maxTime, t + maxTime * 0.18));

    setTimeout(() => nextQuestion(newLevel), 480);
  };

  const registerWrong = (idx) => {
    if (feedback !== null && idx !== null) return;
    setPickedIdx(idx);
    setFeedback("wrong");
    sound.wrong();
    if (hapticsOn) haptic([50, 20, 30, 20, 50]);
    spawnPopup("Miss", false);

    setStreak(0);
    setQuestionsAnswered((q) => q + 1);
    setTimeLeft((t) => Math.max(0, t - maxTime * 0.2));

    const newStars = stars - 1;
    setStars(newStars);

    if (newStars <= 0) {
      setTimeout(() => endGame(score), 550);
    } else {
      setTimeout(() => nextQuestion(level), 550);
    }
  };

  const handleAnswer = (val, idx) => {
    if (feedback !== null || !question) return;
    sound.click();
    if (hapticsOn) haptic(12);
    if (val === question.answer) registerCorrect(idx);
    else registerWrong(idx);
  };

  /* --------------------------------- render --------------------------------- */

  return (
    <div className="mc-root">
      <style>{CSS}</style>

      {screen === "home" && (
        <HomeScreen
          bestScore={bestScore}
          onPlay={startGame}
          soundOn={soundOn}
          setSoundOn={setSoundOn}
          settingsOpen={settingsOpen}
          setSettingsOpen={setSettingsOpen}
          hapticsOn={hapticsOn}
          setHapticsOn={setHapticsOn}
          reducedMotion={reducedMotion}
          setReducedMotion={setReducedMotion}
          onResetBest={() => { saveBest(0); setBestScore(0); }}
        />
      )}

      {screen === "playing" && question && (
        <GameScreen
          score={score}
          streak={streak}
          comboMultiplier={comboMultiplier}
          level={level}
          levelLabel={getConfig(level).label}
          levelUpFlash={levelUpFlash}
          stars={stars}
          timeLeft={timeLeft}
          maxTime={maxTime}
          question={question}
          questionKey={questionKey}
          choices={choices}
          feedback={feedback}
          pickedIdx={pickedIdx}
          onAnswer={handleAnswer}
          popups={popups}
          burst={burst}
          milestone={milestone}
          onHome={goHome}
          nextPreviewPts={nextPreviewPts}
          accuracy={accuracy}
        />
      )}

      {screen === "gameover" && (
        <GameOverScreen
          score={score}
          bestScore={bestScore}
          accuracy={accuracy}
          highestCombo={highestCombo}
          questionsAnswered={questionsAnswered}
          isNewBest={isNewBest}
          onRestart={startGame}
          onHome={goHome}
        />
      )}
    </div>
  );
}

/* -------------------------------- home screen -------------------------------- */

function HomeScreen({
  bestScore, onPlay, soundOn, setSoundOn, settingsOpen, setSettingsOpen,
  hapticsOn, setHapticsOn, reducedMotion, setReducedMotion, onResetBest,
}) {
  return (
    <div className="mc-screen mc-home">
      <FloatingSymbols />
      <div className="mc-home-topbar">
        <div className="mc-topbar-actions">
          <button className="mc-icon-btn" onClick={() => setSoundOn((s) => !s)} aria-label="Toggle sound"><IconSound on={soundOn} /></button>
          <button className="mc-icon-btn" onClick={() => setSettingsOpen((s) => !s)} aria-label="Settings"><IconGear /></button>
        </div>
      </div>

      {settingsOpen && (
        <div className="mc-settings-panel">
          <div className="mc-settings-row"><span>Sound effects</span><button className={`mc-toggle ${soundOn ? "on" : ""}`} onClick={() => setSoundOn((s) => !s)}><i /></button></div>
          <div className="mc-settings-row"><span>Haptics</span><button className={`mc-toggle ${hapticsOn ? "on" : ""}`} onClick={() => setHapticsOn((s) => !s)}><i /></button></div>
          <div className="mc-settings-row"><span>Reduce motion</span><button className={`mc-toggle ${reducedMotion ? "on" : ""}`} onClick={() => setReducedMotion((s) => !s)}><i /></button></div>
          <button className="mc-settings-reset" onClick={onResetBest}>Reset best score</button>
        </div>
      )}

      <div className="mc-home-center">
        <div className="mc-home-card">
          <Mascot className="mc-home-mascot" />
          <div className="mc-title-wrap">
            <h1 className="mc-title">Math<span className="mc-title-accent"> Challenge</span></h1>
          </div>
          <p className="mc-home-sub">Solve fast. Chain combos. Beat the board.</p>

          <div className="mc-best-pill">
            <IconTrophy size={22} />
            <div className="mc-best-pill-text">
              <span className="mc-best-label">Best score</span>
              <span className="mc-best-value">{bestScore}</span>
            </div>
          </div>

          <button className="mc-btn-3d green big" onClick={onPlay}>Play</button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- game screen -------------------------------- */

function GameScreen({
  score, streak, comboMultiplier, level, levelLabel, levelUpFlash, stars,
  timeLeft, maxTime, question, questionKey, choices, feedback, pickedIdx,
  onAnswer, popups, burst, milestone, onHome, nextPreviewPts, accuracy,
}) {
  const pct = clamp((timeLeft / maxTime) * 100, 0, 100);
  const urgent = pct <= 25;
  const secondsLeft = Math.ceil(timeLeft);

  return (
    <div className={`mc-screen mc-game ${feedback === "correct" ? "flash-green" : ""} ${feedback === "wrong" ? "flash-red shake" : ""}`}>
      <div className="mc-hud-top">
        <button className="mc-icon-btn round-white" onClick={onHome} aria-label="Home"><IconArrowLeft size={19} /></button>
        <div className="mc-level-block">
          <div className="mc-level-title">Level {level}</div>
          <div className="mc-level-sub">{levelLabel}</div>
        </div>
        <div className="mc-stars-row">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`mc-life-star ${i < stars ? "lit" : "dim"}`}><IconStar filled={i < stars} size={17} /></span>
          ))}
        </div>
      </div>

      <div className="mc-progress-track">
        <div className="mc-progress-fill" style={{ width: `${clamp((streak % 6) / 6 * 100 + 8, 8, 100)}%` }} />
      </div>

      <div className="mc-hud-mid">
        <div className="mc-timer-chip">
          <IconClock size={14} />
          <span className={urgent ? "urgent" : ""}>00:{String(Math.max(0, Math.floor(secondsLeft))).padStart(2, "0")}</span>
        </div>
        <div className="mc-timer-track">
          <div className={`mc-timer-fill ${urgent ? "urgent" : ""}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className={`mc-stat-row ${levelUpFlash ? "level-pop" : ""}`}>
        <div className="mc-stat-chip"><span>Score</span><b>{score}</b></div>
        <div className={`mc-stat-chip ${streak >= 3 ? "combo-active" : ""}`}><span>Combo</span><b>×{comboMultiplier.toFixed(1)}</b></div>
        <div className="mc-stat-chip"><span>Accuracy</span><b>{accuracy}%</b></div>
      </div>

      <div className="mc-board" key={questionKey}>
        <div className="mc-equation-card">
          <div className="mc-equation">{question.display}</div>
        </div>

        <div className="mc-reward-chip"><IconCoin size={16} /> +{nextPreviewPts}</div>

        <div className={`mc-choices choices-${choices.length}`}>
          {choices.map((c, idx) => {
            let cls = "mc-choice-btn";
            if (feedback && pickedIdx === idx) cls += feedback === "correct" ? " correct" : " wrong";
            else if (feedback === "correct" && c === question.answer) cls += " correct";
            return (
              <button key={idx} className={cls} onClick={() => onAnswer(c, idx)} disabled={feedback !== null}>
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mc-popup-layer">
        {popups.map((p) => (
          <div key={p.id} className={`mc-popup ${p.positive ? "pos" : "neg"}`}>{p.text}</div>
        ))}
      </div>

      <Particles burst={burst} />
      <FloatingStars trigger={milestone > 0 ? milestone : 0} />
    </div>
  );
}

/* ------------------------------ game over screen ------------------------------ */

function GameOverScreen({ score, bestScore, accuracy, highestCombo, questionsAnswered, isNewBest, onRestart, onHome }) {
  return (
    <div className="mc-screen mc-gameover">
      <FloatingSymbols />
      <div className="mc-go-card">
        {isNewBest && <div className="mc-newbest-badge">New Best!</div>}
        <Mascot className="mc-go-mascot" mood="sad" />
        <div className="mc-go-title">Game Over</div>
        <div className="mc-go-score">{score}</div>
        <div className="mc-go-grid">
          <div className="mc-go-stat"><span>Accuracy</span><b>{accuracy}%</b></div>
          <div className="mc-go-stat"><span>Best Combo</span><b>×{(1 + Math.floor(highestCombo / 3) * 0.5).toFixed(1)}</b></div>
          <div className="mc-go-stat"><span>Questions</span><b>{questionsAnswered}</b></div>
          <div className="mc-go-stat"><span>Best Score</span><b>{bestScore}</b></div>
        </div>
        <div className="mc-go-actions">
          <button className="mc-btn-3d blue" onClick={onHome}><IconArrowLeft size={16} /> Home</button>
          <button className="mc-btn-3d green" onClick={onRestart}>Play Again</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------- CSS ------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap');

.mc-root {
  --blue-top: #8b5cf6;
  --blue-bottom: #2e1065;
  --panel: #f1eaff;
  --panel-border: rgba(124,58,237,0.18);
  --ink: #241147;
  --ink-soft: rgba(36,17,71,0.62);
  --white: #ffffff;
  --green-top: #8bdc6b;
  --green-bottom: #4c9a2a;
  --green-bevel: #357016;
  --blue-btn-top: #a879ff;
  --blue-btn-bottom: #7c3aed;
  --blue-btn-bevel: #4c1d95;
  --red-top: #ff8a80;
  --red-bottom: #e5534b;
  --red-bevel: #b23328;
  --gold: #ffc94a;
  --gold-bottom: #f59f00;
  --radius-lg: 28px;
  --radius-md: 20px;
  position: relative;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(180deg, var(--blue-top) 0%, var(--blue-bottom) 100%);
  font-family: 'Nunito', sans-serif;
  color: var(--white);
  overflow: hidden;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.mc-screen {
  position: relative; z-index: 1;
  width: 100%; max-width: 460px;
  min-height: 100vh; min-height: 100dvh;
  margin: 0 auto;
  display: flex; flex-direction: column;
  padding: 20px 20px 26px;
  box-sizing: border-box;
}

/* ---------- shared ---------- */

.mc-icon-btn {
  width: 42px; height: 42px; border-radius: 14px;
  background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.4);
  color: var(--white); display: flex; align-items: center; justify-content: center;
  cursor: pointer; backdrop-filter: blur(4px);
  transition: transform .15s ease, background .15s ease;
}
.mc-icon-btn:hover { background: rgba(255,255,255,0.32); }
.mc-icon-btn:active { transform: scale(0.9); }
.mc-icon-btn.round-white { background: var(--white); color: var(--blue-bottom); border: none; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
.mc-icon-btn.on-bar { background: rgba(255,255,255,0.16); }

.mc-btn-3d {
  font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 18px;
  border: none; border-radius: 999px; cursor: pointer; color: var(--white);
  padding: 15px 34px; position: relative;
  box-shadow: 0 5px 0 var(--green-bevel), 0 10px 22px rgba(0,0,0,0.22);
  background: linear-gradient(180deg, var(--green-top), var(--green-bottom));
  transition: transform .08s ease, box-shadow .08s ease;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
}
.mc-btn-3d.big { padding: 17px 60px; font-size: 21px; }
.mc-btn-3d.blue { background: linear-gradient(180deg, var(--blue-btn-top), var(--blue-btn-bottom)); box-shadow: 0 5px 0 var(--blue-btn-bevel), 0 10px 22px rgba(0,0,0,0.22); }
.mc-btn-3d.red { background: linear-gradient(180deg, var(--red-top), var(--red-bottom)); box-shadow: 0 5px 0 var(--red-bevel), 0 10px 22px rgba(0,0,0,0.22); }
.mc-btn-3d:active { transform: translateY(4px); box-shadow: 0 1px 0 var(--green-bevel), 0 4px 10px rgba(0,0,0,0.2); }
.mc-btn-3d.blue:active { box-shadow: 0 1px 0 var(--blue-btn-bevel), 0 4px 10px rgba(0,0,0,0.2); }

.mc-title { font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: clamp(32px, 8.5vw, 46px); margin: 0; color: var(--white); text-shadow: 0 3px 0 rgba(0,0,0,0.18); }
.mc-title-accent { color: #e9d5ff; }

/* ---------- mascot ---------- */

.mc-mascot-img { width: 110px; height: auto; filter: drop-shadow(0 10px 14px rgba(0,0,0,0.28)); object-fit: contain; }
.mc-home-mascot { animation: mc-bounce 2.6s ease-in-out infinite; margin-bottom: 4px; }
.mc-go-mascot { width: 86px; margin: 0 auto 8px; }

/* ---------- floating symbols ---------- */

.mc-intro-symbols { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.mc-intro-symbol {
  position: absolute; top: -60px; color: rgba(255,255,255,0.28); font-family: 'Baloo 2', sans-serif; font-weight: 700;
  animation: mc-symbol-fall linear infinite;
}

/* ---------- home screen ---------- */

.mc-home { justify-content: flex-start; }
.mc-home-topbar { display: flex; align-items: center; justify-content: space-between; }
.mc-topbar-actions { display: flex; gap: 10px; margin-left: auto; }
.mc-home-center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin-top: -20px; }
.mc-home-sub { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.88); margin: 0; }

.mc-home-card {
  width: 100%; max-width: 340px;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.28);
  border-radius: var(--radius-lg);
  padding: 32px 24px 28px;
  box-shadow: 0 18px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2);
  backdrop-filter: blur(6px);
}

.mc-best-pill {
  display: flex; align-items: center; gap: 10px; background: var(--white); color: var(--ink);
  border-radius: 999px; padding: 8px 20px 8px 12px; box-shadow: 0 8px 18px rgba(0,0,0,0.18);
  margin-top: 4px;
}
.mc-best-pill-text { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.15; }
.mc-best-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--ink-soft); font-weight: 700; }
.mc-best-value { font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 19px; color: var(--blue-bottom); }

.mc-settings-panel {
  position: absolute; top: 68px; right: 20px; z-index: 5;
  background: var(--white); color: var(--ink); border-radius: var(--radius-md); padding: 16px; width: 220px;
  box-shadow: 0 16px 34px rgba(0,0,0,0.25); animation: mc-fade-scale-in .18s ease;
}
.mc-settings-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 0; font-size: 14px; font-weight: 700; }
.mc-toggle { width: 40px; height: 22px; border-radius: 999px; background: rgba(36,17,71,0.15); border: none; position: relative; cursor: pointer; }
.mc-toggle i { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: var(--white); transition: left .18s ease; display: block; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
.mc-toggle.on { background: var(--green-bottom); }
.mc-toggle.on i { left: 20px; }
.mc-settings-reset { margin-top: 8px; width: 100%; background: transparent; border: 1px solid rgba(36,17,71,0.2); color: var(--red-bottom); border-radius: 10px; padding: 8px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }

/* ---------- game screen ---------- */

.mc-game { transition: background .25s ease; }
.mc-game.flash-green::before, .mc-game.flash-red::before { content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none; animation: mc-flash 0.5s ease-out; }
.mc-game.flash-green::before { background: radial-gradient(circle at 50% 45%, rgba(139,220,107,0.4), transparent 70%); }
.mc-game.flash-red::before { background: radial-gradient(circle at 50% 45%, rgba(229,83,75,0.4), transparent 70%); }
.mc-game.shake .mc-board { animation: mc-shake 0.4s ease; }

.mc-hud-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.mc-level-block { text-align: center; }
.mc-level-title { font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 19px; }
.mc-level-sub { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.75); margin-top: -2px; }
.mc-stars-row { display: flex; gap: 3px; min-width: 60px; justify-content: flex-end; }
.mc-life-star.lit { color: var(--gold); filter: drop-shadow(0 0 4px rgba(255,201,74,0.7)); }
.mc-life-star.dim { color: rgba(255,255,255,0.3); }

.mc-progress-track { height: 6px; border-radius: 999px; background: rgba(255,255,255,0.25); margin-top: 12px; overflow: hidden; }
.mc-progress-fill { height: 100%; border-radius: 999px; background: var(--gold); transition: width .3s ease; }

.mc-hud-mid { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
.mc-timer-chip {
  display: flex; align-items: center; gap: 5px; background: var(--white); color: var(--ink);
  border-radius: 999px; padding: 6px 12px; font-weight: 800; font-size: 13px; font-family: 'Baloo 2', sans-serif;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15); white-space: nowrap;
}
.mc-timer-chip .urgent { color: var(--red-bottom); }
.mc-timer-track { flex: 1; height: 10px; border-radius: 999px; background: rgba(255,255,255,0.25); overflow: hidden; }
.mc-timer-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--gold), #ffe27a); transition: width .12s linear, background .3s ease; }
.mc-timer-fill.urgent { background: linear-gradient(90deg, var(--red-bottom), #ff9d8f); }

.mc-stat-row { display: flex; gap: 8px; margin-top: 14px; }
.mc-stat-chip { flex: 1; background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.3); border-radius: 14px; padding: 8px 6px; text-align: center; display: flex; flex-direction: column; gap: 1px; }
.mc-stat-chip span { font-size: 9px; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 700; color: rgba(255,255,255,0.75); }
.mc-stat-chip b { font-family: 'Baloo 2', sans-serif; font-size: 16px; }
.mc-stat-chip.combo-active { background: rgba(255,201,74,0.25); border-color: rgba(255,201,74,0.5); }
.mc-stat-chip.combo-active b { color: var(--gold); animation: mc-combo-pulse 0.6s ease; }
.mc-stat-row.level-pop .mc-level-title { animation: mc-level-pop 1.2s ease; }

.mc-board { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; position: relative; }

.mc-equation-card {
  width: 100%; max-width: 340px; background: linear-gradient(180deg, #7c3aed, #3b1077);
  border-radius: var(--radius-lg); padding: 34px 18px; text-align: center;
  box-shadow: 0 14px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
  animation: mc-fade-scale-in .35s cubic-bezier(.2,.9,.3,1.2);
}
.mc-equation { font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: clamp(32px, 8.5vw, 46px); color: var(--white); text-shadow: 0 2px 0 rgba(0,0,0,0.2); }

.mc-reward-chip {
  display: flex; align-items: center; gap: 6px; background: var(--white); color: var(--ink);
  font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 14px; padding: 6px 16px; border-radius: 999px;
  box-shadow: 0 6px 14px rgba(0,0,0,0.15); margin-top: -6px;
}

.mc-choices { display: grid; gap: 14px; width: 100%; max-width: 340px; }
.choices-2 { grid-template-columns: repeat(2, 1fr); }
.choices-3 { grid-template-columns: repeat(3, 1fr); }
.choices-4 { grid-template-columns: repeat(2, 1fr); }

.mc-choice-btn {
  font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 24px; color: var(--white);
  background: linear-gradient(180deg, var(--blue-btn-top), var(--blue-btn-bottom));
  border: none; border-radius: 20px; padding: 22px 10px; cursor: pointer;
  box-shadow: 0 5px 0 var(--blue-btn-bevel), 0 10px 18px rgba(0,0,0,0.2);
  transition: transform .1s ease, box-shadow .1s ease;
}
.mc-choice-btn:active { transform: translateY(4px); box-shadow: 0 1px 0 var(--blue-btn-bevel), 0 4px 8px rgba(0,0,0,0.2); }
.mc-choice-btn:disabled { cursor: default; }
.mc-choice-btn.correct { background: linear-gradient(180deg, var(--green-top), var(--green-bottom)); box-shadow: 0 5px 0 var(--green-bevel), 0 10px 18px rgba(0,0,0,0.2); animation: mc-pop .35s ease; }
.mc-choice-btn.wrong { background: linear-gradient(180deg, var(--red-top), var(--red-bottom)); box-shadow: 0 5px 0 var(--red-bevel), 0 10px 18px rgba(0,0,0,0.2); animation: mc-shake .35s ease; }

.mc-popup-layer { position: absolute; inset: 0; pointer-events: none; display: flex; align-items: center; justify-content: center; }
.mc-popup { position: absolute; top: 38%; font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 26px; animation: mc-float-up 0.9s ease-out forwards; }
.mc-popup.pos { color: #f3d9ff; text-shadow: 0 2px 6px rgba(0,0,0,0.3); }
.mc-popup.neg { color: #ffd6d2; text-shadow: 0 2px 6px rgba(0,0,0,0.3); }

.mc-particles { position: absolute; width: 0; height: 0; pointer-events: none; }
.mc-particle { position: absolute; width: 8px; height: 8px; border-radius: 3px; animation: mc-particle-fly 0.65s ease-out forwards; }

.mc-star-float-wrap { position: absolute; bottom: 30%; left: 0; right: 0; height: 0; pointer-events: none; }
.mc-star-float { position: absolute; color: var(--gold); animation: mc-star-rise 1.3s ease-out forwards; }

/* ---------- game over screen ---------- */

.mc-gameover { align-items: center; justify-content: center; }
.mc-go-card {
  width: 100%; max-width: 360px; background: var(--white); color: var(--ink);
  border-radius: var(--radius-lg); padding: 30px 26px; text-align: center;
  box-shadow: 0 22px 50px rgba(0,0,0,0.35); position: relative;
  animation: mc-fade-scale-in .3s ease;
}
.mc-newbest-badge {
  position: absolute; top: -16px; left: 50%; transform: translateX(-50%) translateY(-120px) scale(1.4);
  background: linear-gradient(180deg, var(--gold), var(--gold-bottom)); color: #6b4700;
  font-family: 'Baloo 2', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; padding: 6px 16px; border-radius: 999px;
  box-shadow: 0 8px 20px rgba(245,159,0,0.35); animation: mc-newbest-slam 0.5s cubic-bezier(.2,1,.3,1) forwards, mc-combo-pulse 1s ease 0.5s infinite;
}
.mc-go-title { font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 20px; color: var(--ink-soft); margin-bottom: 4px; }
.mc-go-score { font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 54px; color: var(--blue-bottom); margin-bottom: 18px; }
.mc-go-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.mc-go-stat { background: var(--panel); border: 1px solid var(--panel-border); border-radius: 14px; padding: 10px; display: flex; flex-direction: column; gap: 4px; }
.mc-go-stat span { font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--ink-soft); font-weight: 700; }
.mc-go-stat b { font-family: 'Baloo 2', sans-serif; font-size: 18px; color: var(--ink); }
.mc-go-actions { display: flex; gap: 10px; }
.mc-go-actions .mc-btn-3d { flex: 1; padding: 14px 10px; font-size: 15px; }

/* ---------- keyframes ---------- */

@keyframes mc-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes mc-spark-glow { 0%,100% { opacity: 0.5; filter: drop-shadow(0 0 2px rgba(192,132,252,0.6)); } 50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(192,132,252,1)); } }
@keyframes mc-fade-scale-in { from { opacity: 0; transform: scale(0.9) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes mc-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(4px); } }
@keyframes mc-flash { from { opacity: 1; } to { opacity: 0; } }
@keyframes mc-pop { 0% { transform: scale(1); } 40% { transform: scale(1.08); } 100% { transform: scale(1); } }
@keyframes mc-float-up { 0% { opacity: 0; transform: translateY(10px) scale(0.8); } 20% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-60px) scale(1.1); } }
@keyframes mc-particle-fly { 0% { opacity: 1; transform: translate(0,0) rotate(0deg) scale(1); } 100% { opacity: 0; transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0.4); } }
@keyframes mc-star-rise { 0% { opacity: 0; transform: translateY(0) scale(0.6) rotate(0deg); } 30% { opacity: 1; } 100% { opacity: 0; transform: translateY(-140px) scale(1.1) rotate(25deg); } }
@keyframes mc-newbest-slam {
  0% { transform: translateX(-50%) translateY(-120px) scale(1.4); }
  50% { transform: translateX(-50%) translateY(6px) scale(0.95); }
  70% { transform: translateX(-50%) translateY(-4px) scale(1.05); }
  85% { transform: translateX(-50%) translateY(2px) scale(0.98); }
  100% { transform: translateX(-50%) translateY(0) scale(1); }
}
@keyframes mc-combo-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
@keyframes mc-level-pop { 0% { transform: scale(1); } 15% { transform: scale(1.2); color: var(--gold); } 100% { transform: scale(1); } }
@keyframes mc-symbol-fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(110vh) rotate(40deg); opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .mc-title, .mc-home-mascot, .mc-choice-btn, .mc-particle, .mc-star-float, .mc-newbest-badge, .mc-intro-symbol { animation: none !important; transform: none !important; }
}

@media (max-width: 380px) {
  .mc-equation { font-size: 28px; }
  .mc-choice-btn { font-size: 19px; padding: 18px 8px; }
  .mc-go-score { font-size: 44px; }
}
`;