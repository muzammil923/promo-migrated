import {
 useState, useEffect, useRef, useCallback, useMemo }
 from "react";
import {
  ArrowLeft,  Music2,  Undo2,  Eraser,  PencilLine,  Lightbulb,  PartyPopper,  Feather,  Compass,  Flame,  BrainCircuit,  RotateCcw,  Grid3x3,}
 from "lucide-react";
/* ============================================================================   SUDOKU CORE — pure, framework-agnostic generation & solving logic   ========================================================================== */const idx = (r, c) => r * 9 + c;
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1;
 i > 0;
 i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function isValid(grid, r, c, val) {
  for (let i = 0;
 i < 9;
 i++) {
    if (grid[idx(r, i)] === val) return false;
    if (grid[idx(i, c)] === val) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = 0;
 i < 3;
 i++)    for (let j = 0;
 j < 3;
 j++) if (grid[idx(br + i, bc + j)] === val) return false;
  return true;
}
function generateFullGrid() {
  const grid = new Array(81).fill(0);
  function fill(pos) {
    if (pos === 81) return true;
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const n of nums) {
      if (isValid(grid, r, c, n)) {
        grid[idx(r, c)] = n;
        if (fill(pos + 1)) return true;
        grid[idx(r, c)] = 0;
      }
    }
    return false;
  }
  fill(0);
  return grid;
}
function countSolutions(grid, limit) {
  const g = grid.slice();
  let count = 0;
  function getCandidates(pos) {
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    const used = new Set();
    for (let i = 0;
 i < 9;
 i++) {
      used.add(g[idx(r, i)]);
      used.add(g[idx(i, c)]);
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let i = 0;
 i < 3;
 i++) for (let j = 0;
 j < 3;
 j++) used.add(g[idx(br + i, bc + j)]);
    const result = [];
    for (let n = 1;
 n <= 9;
 n++) if (!used.has(n)) result.push(n);
    return result;
  }
  function solve() {
    if (count >= limit) return;
    let bestPos = -1;
    let bestCands = null;
    for (let p = 0;
 p < 81;
 p++) {
      if (g[p] === 0) {
        const cands = getCandidates(p);
        if (cands.length === 0) return;
        if (bestCands === null || cands.length < bestCands.length) {
          bestPos = p;
          bestCands = cands;
          if (cands.length === 1) break;
        }
      }
    }
    if (bestPos === -1) {
      count++;
      return;
    }
    for (const n of bestCands) {
      g[bestPos] = n;
      solve();
      if (count >= limit) return;
      g[bestPos] = 0;
    }
  }
  solve();
  return count;
}
const DIFF_TARGETS = {
 easy: 40, medium: 33, hard: 27, expert: 23 }
;
function makePuzzle(fullGrid, difficulty) {
  const target = DIFF_TARGETS[difficulty] || 33;
  const puzzle = fullGrid.slice();
  const positions = shuffle([...Array(81).keys()]);
  for (const pos of positions) {
    const remaining = puzzle.filter((v) => v !== 0).length;
    if (remaining <= target) break;
    if (puzzle[pos] === 0) continue;
    const backup = puzzle[pos];
    puzzle[pos] = 0;
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[pos] = backup;
    }
  }
  return puzzle;
}
const DIFFICULTIES = [  {
 id: "easy", label: "Easy", icon: Feather, pips: 1, desc: "A relaxed warm-up with plenty of clues to lean on.", meta: "~40 clues · 5–10 min" }
,  {
 id: "medium", label: "Medium", icon: Compass, pips: 2, desc: "A fair challenge — some real thinking, no dead ends.", meta: "~33 clues · 10–18 min" }
,  {
 id: "hard", label: "Hard", icon: Flame, pips: 3, desc: "Serious deduction. Notes mode will earn its keep.", meta: "~27 clues · 18–30 min" }
,  {
 id: "expert", label: "Expert", icon: BrainCircuit, pips: 4, desc: "Full concentration required. Few clues, no mercy.", meta: "~23 clues · 30+ min" }
,];
const formatTime = (sec) => {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
;
/* ============================================================================   AUDIO ENGINE — synthesized via Web Audio API (no external files/licensing)   ========================================================================== */function useAudioEngine() {
  const ctxRef = useRef(null);
  const sfxGainRef = useRef(null);
  const musicGainRef = useRef(null);
  const musicTimerRef = useRef(null);
  const soundOnRef = useRef(true);
  const musicOnRef = useRef(true);
  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.6;
      sfxGain.connect(ctx.destination);
      const musicGain = ctx.createGain();
      musicGain.gain.value = 1;
      musicGain.connect(ctx.destination);
      ctxRef.current = ctx;
      sfxGainRef.current = sfxGain;
      musicGainRef.current = musicGain;
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
  }
, []);
  const tone = useCallback((freq, duration, type, dest, startAt, peak) => {
    const ctx = ctxRef.current;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, startAt);
    g.gain.linearRampToValueAtTime(peak, startAt + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    osc.connect(g);
    g.connect(dest);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.05);
  }
, []);
  const playTick = useCallback(    (variant) => {
      if (!soundOnRef.current) return;
      ensureCtx();
      const freq = 1050 + (variant % 3) * 90;
      tone(freq, 0.045, "square", sfxGainRef.current, ctxRef.current.currentTime, 0.07);
    }
,    [ensureCtx, tone]  );
  const playTap = useCallback(() => {
    if (!soundOnRef.current) return;
    ensureCtx();
    tone(680, 0.07, "sine", sfxGainRef.current, ctxRef.current.currentTime, 0.16);
  }
, [ensureCtx, tone]);
  const playCorrect = useCallback(() => {
    if (!soundOnRef.current) return;
    ensureCtx();
    const t = ctxRef.current.currentTime;
    tone(523.25, 0.12, "triangle", sfxGainRef.current, t, 0.2);
    tone(659.25, 0.16, "triangle", sfxGainRef.current, t + 0.06, 0.18);
  }
, [ensureCtx, tone]);
  const playWrong = useCallback(() => {
    if (!soundOnRef.current) return;
    ensureCtx();
    const t = ctxRef.current.currentTime;
    tone(190, 0.2, "sawtooth", sfxGainRef.current, t, 0.18);
    tone(130, 0.26, "sawtooth", sfxGainRef.current, t + 0.05, 0.16);
  }
, [ensureCtx, tone]);
  const playHint = useCallback(() => {
    if (!soundOnRef.current) return;
    ensureCtx();
    tone(880, 0.14, "sine", sfxGainRef.current, ctxRef.current.currentTime, 0.18);
  }
, [ensureCtx, tone]);
  const playLineComplete = useCallback(() => {
    if (!soundOnRef.current) return;
    ensureCtx();
    const t = ctxRef.current.currentTime;
    tone(587.33, 0.18, "sine", sfxGainRef.current, t, 0.14);
    tone(880, 0.24, "sine", sfxGainRef.current, t + 0.05, 0.13);
  }
, [ensureCtx, tone]);
  const playBoxComplete = useCallback(() => {
    if (!soundOnRef.current) return;
    ensureCtx();
    const t = ctxRef.current.currentTime;
    [659.25, 830.61, 987.77].forEach((f, i) => tone(f, 0.22, "triangle", sfxGainRef.current, t + i * 0.045, 0.16));
  }
, [ensureCtx, tone]);
  const playWin = useCallback(() => {
    if (!soundOnRef.current) return;
    ensureCtx();
    const t = ctxRef.current.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.34, "triangle", sfxGainRef.current, t + i * 0.1, 0.22));
  }
, [ensureCtx, tone]);
  const playLose = useCallback(() => {
    if (!soundOnRef.current) return;
    ensureCtx();
    const t = ctxRef.current.currentTime;
    [392, 349.23, 293.66].forEach((f, i) => tone(f, 0.35, "sawtooth", sfxGainRef.current, t + i * 0.16, 0.16));
  }
, [ensureCtx, tone]);
  /* calm-but-energetic generative loop: Am9 → Fmaj7 → Cmaj7 → G6 */
  const musicStepRef = useRef(0);
  const CHORD_PROGRESSION = [
    { bass: 110.0, tones: [220.0, 261.63, 329.63, 392.0] }, // Am9-ish
    { bass: 87.31, tones: [174.61, 220.0, 261.63, 349.23] }, // Fmaj7
    { bass: 65.41, tones: [130.81, 164.81, 196.0, 246.94] }, // Cmaj7
    { bass: 98.0, tones: [196.0, 246.94, 293.66, 392.0] }, // G6
  ];
  const STEPS_PER_CHORD = 8;
 // 8 eighth-notes per chord = one bar at 96bpm
  const STEP_SECONDS = 60 / 96 / 2;
  const scheduleNextNote = useCallback(() => {
    if (!musicOnRef.current) return;
    musicTimerRef.current = setTimeout(() => {
      if (!musicOnRef.current) return;
      const ctx = ctxRef.current;
      const dest = musicGainRef.current;
      const t = ctx.currentTime;
      const step = musicStepRef.current;
      const barLen = STEPS_PER_CHORD;
      const chordIdx = Math.floor(step / barLen) % CHORD_PROGRESSION.length;
      const localStep = step % barLen;
      const chord = CHORD_PROGRESSION[chordIdx];
      // Soft bass pulse on the downbeat and the "and" of beat 3
      if (localStep === 0 || localStep === 4) {
        const bo = ctx.createOscillator();
        const bg = ctx.createGain();
        bo.type = "sine";
        bo.frequency.value = chord.bass;
        bg.gain.setValueAtTime(0.0001, t);
        bg.gain.linearRampToValueAtTime(0.16, t + 0.05);
        bg.gain.exponentialRampToValueAtTime(0.0001, t + STEP_SECONDS * 3.2);
        bo.connect(bg);
        bg.connect(dest);
        bo.start(t);
        bo.stop(t + STEP_SECONDS * 3.4);
      }
      // Bright plucked arpeggio, one note per step
      const arpNote = chord.tones[localStep % chord.tones.length];
      const ao = ctx.createOscillator();
      const ag = ctx.createGain();
      ao.type = "triangle";
      ao.frequency.value = arpNote;
      ag.gain.setValueAtTime(0.0001, t);
      ag.gain.linearRampToValueAtTime(0.1, t + 0.02);
      ag.gain.exponentialRampToValueAtTime(0.0001, t + STEP_SECONDS * 1.7);
      ao.connect(ag);
      ag.connect(dest);
      ao.start(t);
      ao.stop(t + STEP_SECONDS * 1.9);
      // Airy shimmer an octave up on off-beats
      if (localStep % 2 === 1) {
        const so = ctx.createOscillator();
        const sg = ctx.createGain();
        so.type = "sine";
        so.frequency.value = arpNote * 2;
        sg.gain.setValueAtTime(0.0001, t);
        sg.gain.linearRampToValueAtTime(0.035, t + 0.1);
        sg.gain.exponentialRampToValueAtTime(0.0001, t + STEP_SECONDS * 2.6);
        so.connect(sg);
        sg.connect(dest);
        so.start(t);
        so.stop(t + STEP_SECONDS * 2.8);
      }
      musicStepRef.current = step + 1;
      scheduleNextNote();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
, STEP_SECONDS * 1000);
  }
, []);
  const setSound = useCallback((on) => {
    soundOnRef.current = on;
  }
, []);
  const setMusic = useCallback(    (on) => {
      musicOnRef.current = on;
      ensureCtx();
      if (musicTimerRef.current) clearTimeout(musicTimerRef.current);
      if (on) {
        musicStepRef.current = 0;
        scheduleNextNote();
      }
    }
,    [ensureCtx, scheduleNextNote]  );
  useEffect(() => {
    return () => {
      if (musicTimerRef.current) clearTimeout(musicTimerRef.current);
    }
;
  }
, []);
  return {
 ensureCtx, playTap, playTick, playCorrect, playWrong, playHint, playWin, playLose, playLineComplete, playBoxComplete, setSound, setMusic,
    vibrate: (pattern) => {      if (!soundOnRef.current) return;      if (navigator.vibrate) {        try { navigator.vibrate(pattern); } catch {} }    }
  };
}
/* ============================================================================   SMALL PRESENTATIONAL PIECES   ========================================================================== */function WeekStrip({
 completedToday }
) {
  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const todayDow = today.getDay();
  const days = useMemo(() => {
    const list = [];
    for (let i = 0;
 i < 7;
 i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - todayDow + i);
      list.push({
 dow: dows[i], date: d.getDate(), isToday: i === todayDow }
);
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }
, []);
  return (    <div className="week-strip">      {
days.map((d) => (        <div key={
d.dow}
 className={
`day-tab${d.isToday ? " today" : ""}${d.isToday && completedToday ? " done" : ""}`}
>          <span className="dow">{
d.dow}
</span>          <span className="num">{
d.date}
</span>        </div>      ))}
    </div>  );
}
function DifficultyIcon({
 config, onSelect, index }
) {
  const Icon = config.icon;
  return (    <button      className="diff-icon-btn"      style={
{
 animationDelay: `${0.04 + index * 0.06}s` }
}
      onClick={
() => onSelect(config.id)}
    >      <span className="di-circle">        <Icon size={
26}
 strokeWidth={
2}
 />        <span className="di-pips" aria-hidden="true">          {
[0, 1, 2, 3].map((i) => (            <span key={
i}
 className={
`di-pip${i < config.pips ? " filled" : ""}`}
 />          ))}
        </span>      </span>      <span className="di-label">{
config.label}
</span>    </button>  );
}
function Ripple({
 onDone }
) {
  return <span className="ripple" onAnimationEnd={
onDone}
 />;
}
function VictoryConfetti() {
  const pieces = useMemo(    () =>      Array.from({
 length: 70 }
).map((_, i) => ({
        id: i,        left: Math.random() * 100,        color: ["#A855F7", "#D6479C", "#7C3AED", "#F2ECFA", "#9333A8", "#FFD166"][i % 6],        duration: 1.8 + Math.random() * 1.4,        delay: Math.random() * 0.5,        size: 5 + Math.random() * 5,        shape: i % 3 === 0 ? "circle" : "rect",        drift: (Math.random() - 0.5) * 180,      }
)),    []  );
  return (    <div className="victory-confetti" aria-hidden="true">      {
pieces.map((p) => (        <span          key={
p.id}
          className={
`vconf-piece ${p.shape}`}
          style={
{
            left: `${p.left}%`,            background: p.color,            width: p.shape === "circle" ? p.size : p.size * 0.6,            height: p.shape === "circle" ? p.size : p.size * 1.6,            animationDuration: `${p.duration}s`,            animationDelay: `${p.delay}s`,            "--drift": `${p.drift}px`,          }
}
        />      ))}
    </div>  );
}
function FxButton({
 active, onClick, label, icon }
) {
  return (    <button className={
`icon-btn${active ? " on" : ""}`}
 onClick={
onClick}
 aria-label={
label}
 aria-pressed={
active}
 title={
label}
>      {
icon}
    </button>  );
}
/* ============================================================================   MAIN APP   ========================================================================== */export default function SudokuApp() {
  const audio = useAudioEngine();
  const [view, setView] = useState("select");
  const [difficulty, setDifficulty] = useState("medium");
  const [solution, setSolution] = useState([]);
  const [given, setGiven] = useState([]);
  const [values, setValues] = useState([]);
  const [notes, setNotes] = useState([]);
 // bitmask per cell (bit n = candidate n present)
  const [selected, setSelected] = useState(-1);
  const [notesMode, setNotesMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [timerSec, setTimerSec] = useState(0);
  const [history, setHistory] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [modal, setModal] = useState(null);
  const [hintPos, setHintPos] = useState(-1);
  const [shake, setShake] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [ripples, setRipples] = useState({
}
);
 // btnId -> rippleId array
  const [sweepRows, setSweepRows] = useState([]);
 // [{ id, r }]
  const [sweepCols, setSweepCols] = useState([]);
 // [{ id, c }]
  const [burstBoxes, setBurstBoxes] = useState([]);
 // [{ id, box }]
  const [victoryBurst, setVictoryBurst] = useState(false);
  const [highlightNum, setHighlightNum] = useState(0);
  const maxHints = 3;
  const modalBtnRef = useRef(null);
  const boardWrapRef = useRef(null);
  const blobARef = useRef(null);
  const blobBRef = useRef(null);
  const blobCRef = useRef(null);
  const spotlightRef = useRef(null);
  const rafRef = useRef(null);
  const dealOrderRef = useRef({
}
);
  const [dealKey, setDealKey] = useState(0);
  /* ---------- staggered "tick" sounds synced to the board slam-in ---------- */  useEffect(() => {
    if (dealKey === 0) return;
    const order = dealOrderRef.current;
    const timers = Object.entries(order).map(([, i]) =>      setTimeout(() => audio.playTick(i), i * 16)    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }
, [dealKey]);
  /* ---------- timer ---------- */  useEffect(() => {
    if (view !== "game" || gameOver) return;
    const t = setInterval(() => setTimerSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }
, [view, gameOver]);
  /* ---------- first-gesture audio unlock ---------- */  useEffect(() => {
    const prime = () => audio.ensureCtx();
    document.addEventListener("pointerdown", prime, {
 once: true }
);
    document.addEventListener("keydown", prime, {
 once: true }
);
    return () => {
      document.removeEventListener("pointerdown", prime);
      document.removeEventListener("keydown", prime);
    }
;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }
, []);
  /* ---------- ambient pointer parallax on select screen (ref-driven, no re-render) ---------- */  useEffect(() => {
    if (view !== "select") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const handleMove = (e) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        if (blobARef.current) blobARef.current.style.transform = `translate(${nx * 40}px, ${ny * 30}px) scale(1.1)`;
        if (blobBRef.current) blobBRef.current.style.transform = `translate(${nx * -34}px, ${ny * -26}px) scale(1.08)`;
        if (blobCRef.current) blobCRef.current.style.transform = `translate(${nx * 22}px, ${ny * 18}px)`;
        if (spotlightRef.current) {
          spotlightRef.current.style.setProperty("--spot-x", `${e.clientX}px`);
          spotlightRef.current.style.setProperty("--spot-y", `${e.clientY}px`);
          spotlightRef.current.style.opacity = "1";
        }
      }
);
    }
;
    window.addEventListener("pointermove", handleMove);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
;
  }
, [view]);
  /* ---------- new game ---------- */  const newGame = useCallback(    (diff) => {
      const d = diff || difficulty;
      const full = generateFullGrid();
      const puzzle = makePuzzle(full, d);
      const puzzleGiven = puzzle.map((v) => v !== 0);
      const order = {
}
;
      let count = 0;
      for (let p = 0;
 p < 81;
 p++) {
        if (puzzleGiven[p]) {
          order[p] = count;
          count++;
        }
      }
      dealOrderRef.current = order;
      setDifficulty(d);
      setSolution(full);
      setGiven(puzzleGiven);
      setValues(puzzle.slice());
      setNotes(new Array(81).fill(0));
      setSelected(-1);
      setNotesMode(false);
      setMistakes(0);
      setHintsLeft(maxHints);
      setTimerSec(0);
      setHistory([]);
      setGameOver(false);
      setModal(null);
      setHintPos(-1);
      setHighlightNum(0);
      setView("game");
      setDealKey((k) => k + 1);
    }
,    [difficulty]  );
  const goToSelect = useCallback(() => {
    setModal(null);
    setView("select");
  }
, []);
  /* ---------- interactions ---------- */  const selectCell = useCallback(    (pos) => {
      if (gameOver) return;
      setSelected((prev) => {
        if (prev !== pos) {
          audio.vibrate(8);
          audio.playTap();
        }
        return pos;
      }
);
      setHighlightNum(values[pos] || 0);
    }
,    [gameOver, audio, values]  );
  const pushHistory = useCallback((pos, prevVal, prevNotes) => {
    setHistory((h) => [...h, {
 pos, prevVal, prevNotes }
]);
  }
, []);
  const checkWinWith = useCallback(    (vals) => {
      for (let i = 0;
 i < 81;
 i++) if (vals[i] !== solution[i]) return false;
      return true;
    }
,    [solution]  );
  const triggerUnitCompletions = useCallback(    (vals, pos) => {
      const r = Math.floor(pos / 9);
      const c = pos % 9;
      let rowDone = true;
      for (let i = 0;
 i < 9;
 i++) if (vals[idx(r, i)] !== solution[idx(r, i)]) rowDone = false;
      let colDone = true;
      for (let i = 0;
 i < 9;
 i++) if (vals[idx(i, c)] !== solution[idx(i, c)]) colDone = false;
      const br = Math.floor(r / 3) * 3;
      const bc = Math.floor(c / 3) * 3;
      let boxDone = true;
      for (let i = 0;
 i < 3;
 i++) for (let j = 0;
 j < 3;
 j++) if (vals[idx(br + i, bc + j)] !== solution[idx(br + i, bc + j)]) boxDone = false;
      if (!rowDone && !colDone && !boxDone) return;
      if (rowDone) {
        const id = Math.random().toString(36).slice(2);
        setSweepRows((prev) => [...prev, {
 id, r }
]);
        setTimeout(() => setSweepRows((prev) => prev.filter((s) => s.id !== id)), 700);
      }
      if (colDone) {
        const id = Math.random().toString(36).slice(2);
        setSweepCols((prev) => [...prev, {
 id, c }
]);
        setTimeout(() => setSweepCols((prev) => prev.filter((s) => s.id !== id)), 700);
      }
      if (boxDone) {
        const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        const id = Math.random().toString(36).slice(2);
        setBurstBoxes((prev) => [...prev, {
 id, box }
]);
        setTimeout(() => setBurstBoxes((prev) => prev.filter((b) => b.id !== id)), 650);
      }
      audio.vibrate(rowDone || colDone ? 16 : 14);
      if (boxDone) audio.playBoxComplete();
      else audio.playLineComplete();
    }
,    [solution, audio]  );
  const inputNumber = useCallback(    (n) => {
      if (gameOver || selected === -1 || given[selected]) return;
      const pos = selected;
      if (notesMode) {
        if (values[pos] !== 0) return;
        pushHistory(pos, values[pos], notes[pos]);
        setNotes((prev) => {
          const next = prev.slice();
          next[pos] = next[pos] ^ (1 << n);
          return next;
        }
);
        return;
      }
      pushHistory(pos, values[pos], notes[pos]);
      const nextValues = values.slice();
      nextValues[pos] = n;
      setValues(nextValues);
      setNotes((prev) => {
        const next = prev.slice();
        next[pos] = 0;
        return next;
      }
);
      setHighlightNum(n);
      const correct = n === solution[pos];
      if (correct) {
        audio.vibrate(12);
        audio.playCorrect();
        if (checkWinWith(nextValues)) {
          setGameOver(true);
          setVictoryBurst(true);
          setTimeout(() => {
            setModal("win");
            setCompletedToday(true);
            audio.vibrate([30, 40, 30, 40, 70]);
            audio.playWin();
          }
, 260);
          setTimeout(() => setVictoryBurst(false), 2600);
        }
 else {
          triggerUnitCompletions(nextValues, pos);
        }
      }
 else {
        const nextMistakes = mistakes + 1;
        setMistakes(nextMistakes);
        setShake(true);
        setTimeout(() => setShake(false), 320);
        audio.vibrate([40, 40, 40]);
        audio.playWrong();
      }
    }
,    [gameOver, selected, given, notesMode, values, notes, solution, mistakes, pushHistory, checkWinWith, audio, triggerUnitCompletions]  );
  const eraseCell = useCallback(() => {
    if (gameOver || selected === -1 || given[selected]) return;
    pushHistory(selected, values[selected], notes[selected]);
    setValues((prev) => {
      const next = prev.slice();
      next[selected] = 0;
      return next;
    }
);
    setNotes((prev) => {
      const next = prev.slice();
      next[selected] = 0;
      return next;
    }
);
    setHighlightNum(0);
    audio.vibrate(6);
    audio.playTap();
  }
, [gameOver, selected, given, values, notes, pushHistory, audio]);
  const undo = useCallback(() => {
    if (gameOver || history.length === 0) return;
    const move = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setValues((prev) => {
      const next = prev.slice();
      next[move.pos] = move.prevVal;
      return next;
    }
);
    setNotes((prev) => {
      const next = prev.slice();
      next[move.pos] = move.prevNotes;
      return next;
    }
);
    audio.vibrate(6);
    audio.playTap();
  }
, [gameOver, history, audio]);
  const toggleNotes = useCallback(() => {
    setNotesMode((v) => !v);
    audio.vibrate(6);
    audio.playTap();
  }
, [audio]);
  const giveHint = useCallback(() => {
    if (gameOver || hintsLeft <= 0) return;
    let pos = selected;
    if (pos === -1 || given[pos] || values[pos] === solution[pos]) {
      const empties = [];
      for (let i = 0;
 i < 81;
 i++) if (!given[i] && values[i] !== solution[i]) empties.push(i);
      if (empties.length === 0) return;
      pos = empties[Math.floor(Math.random() * empties.length)];
    }
    pushHistory(pos, values[pos], notes[pos]);
    const nextValues = values.slice();
    nextValues[pos] = solution[pos];
    setValues(nextValues);
    setNotes((prev) => {
      const next = prev.slice();
      next[pos] = 0;
      return next;
    }
);
    setHintsLeft((h) => h - 1);
    setSelected(pos);
    setHintPos(pos);
    setHighlightNum(solution[pos]);
    setTimeout(() => setHintPos(-1), 260);
    audio.vibrate(20);
    audio.playHint();
    if (checkWinWith(nextValues)) {
      setGameOver(true);
      setVictoryBurst(true);
      setTimeout(() => {
        setModal("win");
        setCompletedToday(true);
        audio.vibrate([30, 40, 30, 40, 70]);
        audio.playWin();
      }
, 260);
      setTimeout(() => setVictoryBurst(false), 2600);
    }
 else {
      triggerUnitCompletions(nextValues, pos);
    }
  }
, [gameOver, hintsLeft, selected, given, values, notes, solution, pushHistory, checkWinWith, audio, triggerUnitCompletions]);
  /* ---------- replay (restart current puzzle) ---------- */  const replayGame = useCallback(() => {    if (solution.length === 0) return;    const resetValues = solution.map((v, i) => (given[i] ? v : 0));    setValues(resetValues);    setNotes(new Array(81).fill(0));    setSelected(-1);    setNotesMode(false);    setMistakes(0);    setHintsLeft(maxHints);    setTimerSec(0);    setHistory([]);    setGameOver(false);    setModal(null);    setHintPos(-1);    setHighlightNum(0);    setDealKey((k) => k + 1);    audio.playTap();    audio.vibrate(10);  }, [solution, given, maxHints, audio]);
  /* ---------- keyboard support ---------- */  useEffect(() => {
    if (view !== "game") return;
    const handler = (e) => {
      if (e.key >= "1" && e.key <= "9") {
        inputNumber(parseInt(e.key, 10));
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        eraseCell();
        return;
      }
      if (e.key.toLowerCase() === "n") {
        toggleNotes();
        return;
      }
      if (e.key.toLowerCase() === "z" && (e.ctrlKey || e.metaKey)) {
        undo();
        return;
      }
      if (selected === -1) return;
      let r = Math.floor(selected / 9);
      let c = selected % 9;
      if (e.key === "ArrowUp") {
        r = (r + 8) % 9;
        selectCell(idx(r, c));
        e.preventDefault();
      }
 else if (e.key === "ArrowDown") {
        r = (r + 1) % 9;
        selectCell(idx(r, c));
        e.preventDefault();
      }
 else if (e.key === "ArrowLeft") {
        c = (c + 8) % 9;
        selectCell(idx(r, c));
        e.preventDefault();
      }
 else if (e.key === "ArrowRight") {
        c = (c + 1) % 9;
        selectCell(idx(r, c));
        e.preventDefault();
      }
    }
;
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }
, [view, selected, inputNumber, eraseCell, toggleNotes, undo, selectCell]);
  /* ---------- auto-start music on first interaction ---------- */  const musicStartedRef = useRef(false);  useEffect(() => {    if (musicStartedRef.current) return;    const start = () => {      if (musicStartedRef.current) return;      musicStartedRef.current = true;      audio.ensureCtx();      audio.setMusic(true);      document.removeEventListener("click", start);      document.removeEventListener("keydown", start);    };    document.addEventListener("click", start);    document.addEventListener("keydown", start);    return () => {      document.removeEventListener("click", start);      document.removeEventListener("keydown", start);    };  }, [audio]);
  /* ---------- modal focus trap + escape ---------- */  useEffect(() => {
    if (!modal) return;
    modalBtnRef.current?.focus();
    const handler = (e) => {
      if (e.key === "Escape") {
        goToSelect();
      }
    }
;
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }
, [modal, goToSelect]);
  const handleToggleMusic = () => {
    audio.ensureCtx();
    setMusicOn((prev) => {
      const next = !prev;
      audio.setMusic(next);
      return next;
    }
);
  }
;
  const addRipple = (btnId) => {
    const id = Math.random().toString(36).slice(2);
    setRipples((prev) => ({
 ...prev, [btnId]: [...(prev[btnId] || []), id] }
));
  }
;
  const clearRipple = (btnId, id) => {
    setRipples((prev) => ({
 ...prev, [btnId]: (prev[btnId] || []).filter((r) => r !== id) }
));
  }
;
  /* ---------- derived render data ---------- */  const selR = selected !== -1 ? Math.floor(selected / 9) : -1;
  const selC = selected !== -1 ? selected % 9 : -1;
  const selBR = Math.floor(selR / 3);
  const selBC = Math.floor(selC / 3);
  const remainingCounts = useMemo(() => {
    const counts = new Array(10).fill(9);
    for (let i = 0;
 i < 81;
 i++) {
      if (values[i] !== 0 && values[i] === solution[i]) counts[values[i]]--;
    }
    return counts;
  }
, [values, solution]);
  const diffConfig = DIFFICULTIES.find((d) => d.id === difficulty);
  /* ============================================================================     RENDER     ========================================================================== */  return (    <div className="app-root">      <style>{
`        :root{          --bg:#170F2B; --bg-alt:#221838; --bg-alt-2:#2E2249; --bg-alt-3:#3A2C5C;          --paper:#F2ECFA; --paper-line:#C9B4E3; --paper-line-strong:#9B76C4;          --ink:#2B1E47; --text:#ECE5F9; --muted:#B0A3D1; --muted-2:#7A699E;          --accent:#A855F7; --accent-deep:#7C3AED; --accent-2:#D6479C; --danger:#E14F6F;          --given-ink:#34235A; --user-ink:#9333A8;          --shadow:0 24px 60px -24px rgba(10,4,26,0.75);          --ease-out:cubic-bezier(0.16,1,0.3,1);          --safe-bottom:env(safe-area-inset-bottom,0px);        }        .app-root *{ box-sizing:border-box; }        .app-root{          position:relative; min-height:100vh; width:100%; overflow-x:hidden;          background:            radial-gradient(ellipse 900px 500px at 15% -10%, #331F5C 0%, transparent 60%),            radial-gradient(ellipse 700px 500px at 100% 10%, #241246 0%, transparent 55%),            var(--bg);          color:var(--text); font-family:'Space Grotesk', sans-serif; -webkit-font-smoothing:antialiased;        }        .app-root h1,.app-root h2,.app-root p{ margin:0; }        .app-root button{ font:inherit; touch-action:manipulation; }        .app-root ::selection{ background:var(--accent); color:#fff; }        .app-root :focus-visible{ outline:2px solid var(--accent); outline-offset:3px; border-radius:4px; }        @media (prefers-reduced-motion: reduce){          .app-root *{ animation-duration:0.001ms !important; animation-iteration-count:1 !important; transition-duration:0.001ms !important; }        }        .blob{ position:fixed; border-radius:50%; filter:blur(60px); pointer-events:none; z-index:0; opacity:0.35; will-change:transform; }        .blob-a{ width:340px; height:340px; background:var(--accent-deep); top:-80px; left:-100px; }        .blob-b{ width:280px; height:280px; background:var(--accent-2); bottom:-60px; right:-80px; }        .blob-c{ width:220px; height:220px; background:var(--accent); top:40%; left:60%; opacity:0.18; }        .spotlight{          position:fixed; inset:0; z-index:0; pointer-events:none; opacity:0; transition:opacity 0.4s ease;          background:radial-gradient(420px circle at var(--spot-x,50%) var(--spot-y,50%), rgba(168,85,247,0.10), transparent 70%);        }                .icon-btn{          width:38px; height:38px; min-width:44px; min-height:44px; border-radius:10px; background:var(--bg-alt);          border:1px solid var(--bg-alt-2); color:var(--muted); display:flex; align-items:center; justify-content:center;          cursor:pointer; transition:all 0.15s ease; position:relative; overflow:hidden;        }        .icon-btn:hover{ color:var(--text); border-color:var(--accent); }        .icon-btn:active{ transform:scale(0.92); }        .icon-btn.on{ color:var(--accent); border-color:var(--accent); background:var(--bg-alt-2); }        .view{ position:relative; z-index:1; min-height:100vh; padding:clamp(20px,4vw,44px) clamp(16px,4vw,28px) 40px; }        .view-enter{ animation:viewIn 0.5s var(--ease-out); }        @keyframes viewIn{ from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);} }        .select-inner{ max-width:720px; margin:0 auto; display:flex; flex-direction:column; align-items:center; text-align:center; gap:clamp(28px,5vw,44px); padding-top:clamp(16px,6vh,60px); }        .logo-mark{ width:64px; height:64px; border-radius:18px; overflow:hidden; box-shadow:0 14px 30px -12px rgba(168,85,247,0.7), inset 0 0 0 1px rgba(255,255,255,0.06); background:var(--bg-alt); display:flex; align-items:center; justify-content:center; }        .logo-mark svg{ width:32px; height:32px; color:var(--accent); animation:logoSpin 8s linear infinite; }@keyframes logoSpin{ 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }        .eyebrow{ font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:var(--accent); }        .brand-block h1{ font-family:'Fraunces', serif; font-weight:700; font-size:clamp(40px,9vw,68px); letter-spacing:-0.03em; line-height:1; margin-top:14px; }        .brand-block .by-line{ font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--accent-2); font-weight:700; margin-top:6px; }        .brand-block .lede{ color:var(--muted); font-size:clamp(14px,2vw,17px); margin-top:12px; }        .week-strip{ position:relative; display:flex; gap:6px; background:var(--paper); padding:14px 16px 20px; border-radius:12px 12px 0 0; box-shadow:var(--shadow); }        .week-strip::after{          content:''; position:absolute; left:0; right:0; bottom:-9px; height:10px;          background:linear-gradient(-45deg, var(--paper) 5.5px, transparent 0), linear-gradient(45deg, var(--paper) 5.5px, transparent 0);          background-size:11px 11px; background-position:left bottom; background-repeat:repeat-x;        }        .day-tab{ width:40px; text-align:center; font-family:'JetBrains Mono', monospace; padding:5px 0; border-radius:7px; position:relative; transition:transform 0.2s var(--ease-out); }        .day-tab .dow{ font-size:9px; letter-spacing:0.06em; color:var(--muted-2); text-transform:uppercase; display:block; }        .day-tab .num{ font-size:15px; font-weight:700; color:var(--ink); display:block; margin-top:2px; }        .day-tab.today{ background:var(--accent); transform:translateY(-4px); box-shadow:0 8px 16px -6px rgba(168,85,247,0.65); }        .day-tab.today .dow, .day-tab.today .num{ color:#fff; }        .day-tab.done::before{          content:'✓'; position:absolute; top:-9px; right:-4px; width:17px; height:17px; background:var(--accent-2); color:#fff;          border-radius:50%; font-size:10px; line-height:17px; box-shadow:0 2px 6px rgba(0,0,0,0.35); animation:stampIn 0.4s var(--ease-out);        }        @keyframes stampIn{ 0%{transform:scale(0) rotate(-25deg); opacity:0;} 70%{transform:scale(1.2) rotate(6deg); opacity:1;} 100%{transform:scale(1) rotate(0);} }        .diff-heading{ font-family:'Fraunces', serif; font-size:clamp(18px,2.4vw,22px); font-weight:600; color:var(--text); }        .diff-icon-row{ width:100%; display:flex; justify-content:center; align-items:flex-start; gap:clamp(18px,5vw,40px); flex-wrap:wrap; }        .diff-icon-btn{          display:flex; flex-direction:column; align-items:center; gap:11px; background:none; border:none; cursor:pointer;          color:var(--text); min-width:72px; padding:4px; animation:iconIn 0.45s var(--ease-out) both;        }        @keyframes iconIn{ from{opacity:0; transform:translateY(10px) scale(0.9);} to{opacity:1; transform:translateY(0) scale(1);} }        .di-circle{          position:relative; width:66px; height:66px; border-radius:50%; background:var(--bg-alt); border:1px solid var(--bg-alt-2);          display:flex; align-items:center; justify-content:center; color:var(--accent); box-shadow:var(--shadow);          transition:background 0.16s ease, color 0.16s ease, transform 0.16s var(--ease-out), border-color 0.16s ease;        }        .diff-icon-btn:hover .di-circle{ background:var(--accent); color:#fff; border-color:var(--accent); transform:translateY(-4px); box-shadow:0 16px 28px -12px rgba(168,85,247,0.65); }        .diff-icon-btn:active .di-circle{ transform:translateY(-1px) scale(0.94); }        .di-pips{ position:absolute; bottom:-3px; left:50%; transform:translateX(-50%); display:flex; gap:3px; background:var(--bg); padding:3px 5px; border-radius:999px; box-shadow:0 0 0 1px var(--bg-alt-2); }        .di-pip{ width:5px; height:5px; border-radius:50%; background:var(--bg-alt-3); }        .di-pip.filled{ background:var(--accent-2); }        .diff-icon-btn:hover .di-pip.filled{ background:#fff; }        .di-label{ font-family:'Fraunces', serif; font-weight:600; font-size:13.5px; color:var(--text); }        .game-topbar{ display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:22px; position:relative; z-index:1; }        .back-btn{ display:flex; align-items:center; gap:7px; background:none; border:1px solid var(--bg-alt-2); color:var(--muted); padding:9px 14px 9px 10px; min-height:44px; border-radius:999px; cursor:pointer; font-size:13px; font-weight:600; transition:all 0.15s ease; }        .back-btn:hover{ color:var(--text); border-color:var(--accent); }        .game-meta{ display:flex; align-items:center; gap:18px; flex-wrap:wrap; }        .game-stats{ display:flex; align-items:center; gap:16px; justify-content:center; margin-bottom:12px; }        .board-col{ display:flex; flex-direction:column; align-items:center; }        .diff-pill{ font-family:'JetBrains Mono', monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; background:var(--bg-alt-2); color:var(--accent); padding:6px 12px; border-radius:999px; font-weight:700; }        .stat{ display:flex; flex-direction:column; align-items:center; min-width:48px; font-family:'JetBrains Mono', monospace; }        .stat .label{ font-size:8.5px; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted-2); }        .stat .value{ font-size:15px; font-weight:700; color:var(--text); margin-top:1px; }        .stat .value.warn{ color:var(--danger); }        .stat.mistake-warn .value{ animation:warnPulse 0.9s ease-in-out infinite; }        @keyframes warnPulse{ 0%,100%{color:var(--danger);} 50%{color:#ff8fa3;} }        .game-main{ display:flex; gap:30px; align-items:flex-start; justify-content:center; flex-wrap:wrap; position:relative; z-index:1; }        .board{          width:min(88vw,500px); aspect-ratio:1/1; background:var(--paper); border-radius:22px; box-shadow:var(--shadow);          display:grid; grid-template-columns:repeat(9,1fr); grid-template-rows:repeat(9,1fr); padding:12px;          background-image:linear-gradient(var(--paper-line) 1px, transparent 1px), linear-gradient(90deg, var(--paper-line) 1px, transparent 1px);          background-size:calc((100% - 24px)/9) calc((100% - 24px)/9); background-position:12px 12px;          position:relative;        }        .board::before{ content:''; position:absolute; inset:0; border-radius:22px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 6px rgba(0,0,0,0.06); pointer-events:none; }        .board.shake{ animation:shake 0.32s ease; }        @keyframes shake{ 0%,100%{transform:translateX(0);} 20%{transform:translateX(-6px);} 40%{transform:translateX(6px);} 60%{transform:translateX(-4px);} 80%{transform:translateX(4px);} }        .board.victory{ animation:boardVictory 1.1s var(--ease-out); }        @keyframes boardVictory{          0%{ box-shadow:var(--shadow); }          32%{ transform:scale(1.018); box-shadow:0 0 0 3px rgba(168,85,247,0.55), 0 32px 84px -18px rgba(168,85,247,0.6); }          100%{ transform:scale(1); box-shadow:var(--shadow); }        }        .sweep-row, .sweep-col, .box-burst{ position:absolute; pointer-events:none; z-index:2; }        .sweep-row{ left:12px; right:12px; border-radius:5px; background:linear-gradient(90deg, transparent, rgba(168,85,247,0.55), transparent); animation:sweepAcross 0.7s ease; }        .sweep-col{ top:12px; bottom:12px; border-radius:5px; background:linear-gradient(180deg, transparent, rgba(214,71,156,0.5), transparent); animation:sweepDown 0.7s ease; }        @keyframes sweepAcross{ 0%{opacity:0; transform:scaleX(0.25);} 35%{opacity:1;} 100%{opacity:0; transform:scaleX(1);} }        @keyframes sweepDown{ 0%{opacity:0; transform:scaleY(0.25);} 35%{opacity:1;} 100%{opacity:0; transform:scaleY(1);} }        .box-burst{ z-index:3; border-radius:9px; animation:boxFlash 0.55s ease; }        @keyframes boxFlash{ 0%{ box-shadow:0 0 0 0 rgba(168,85,247,0.55); background:rgba(168,85,247,0.22); } 100%{ box-shadow:0 0 0 20px rgba(168,85,247,0); background:rgba(168,85,247,0); } }        .burst-particle{          position:absolute; top:50%; left:50%; width:5px; height:5px; border-radius:50%; background:var(--accent-2);          animation:particleFly 0.6s ease-out forwards; animation-delay:var(--delay);        }        @keyframes particleFly{          0%{ transform:translate(-50%,-50%) rotate(var(--ang)) translateX(0) scale(1); opacity:1; }          100%{ transform:translate(-50%,-50%) rotate(var(--ang)) translateX(48px) scale(0); opacity:0; }        }        .victory-confetti{ position:fixed; inset:0; z-index:90; overflow:hidden; pointer-events:none; }        .vconf-piece{ position:absolute; top:-14px; opacity:0.95; animation-name:vconfFall; animation-timing-function:cubic-bezier(0.4,0.1,0.6,1); animation-fill-mode:forwards; }        .vconf-piece.circle{ border-radius:50%; }        .vconf-piece.rect{ border-radius:2px; }        @keyframes vconfFall{ 0%{ transform:translate(0,0) rotate(0deg); opacity:1; } 100%{ transform:translate(var(--drift),100vh) rotate(620deg); opacity:0; } }        .cell{ display:flex; align-items:center; justify-content:center; position:relative; font-family:'JetBrains Mono', monospace; font-size:clamp(15px,3.6vw,23px); font-weight:700; color:var(--given-ink); cursor:pointer; user-select:none; border-right:1px solid transparent; border-bottom:1px solid transparent; transition:background-color 0.12s ease; }        .cell.b-right{ border-right:2.5px solid var(--paper-line-strong); }        .cell.b-bottom{ border-bottom:2.5px solid var(--paper-line-strong); }        .cell.peer{ background:rgba(214,71,156,0.10); }        .cell.same-value{ background:rgba(168,85,247,0.26); }        .cell.selected{ background:var(--accent); color:#fff; animation:selectPulse 0.4s var(--ease-out); }        .cell.selected.error{ background:var(--danger); color:#fff; }        .cell.user-val{ color:var(--user-ink); }        .cell.error{ color:var(--danger); }        .cell.hinted{ color:var(--accent-2); }        @keyframes selectPulse{ 0%{box-shadow:0 0 0 0 rgba(168,85,247,0.55);} 100%{box-shadow:0 0 0 10px rgba(168,85,247,0);} }        .cell .fillpop{ animation:pop 0.18s var(--ease-out); display:block; }        @keyframes pop{ 0%{transform:scale(0.5);} 70%{transform:scale(1.15);} 100%{transform:scale(1);} }        .cell .slam-in{ display:block; animation:slamIn 0.32s var(--ease-out) both; animation-delay:var(--delay,0ms); }        @keyframes slamIn{          0%{ transform:scale(2.6); opacity:0; }          55%{ transform:scale(0.8); opacity:1; }          78%{ transform:scale(1.1); }          100%{ transform:scale(1); }        }        .notes-grid{ position:absolute; inset:0; display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(3,1fr); pointer-events:none; }        .notes-grid span{ display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono', monospace; font-size:9px; font-weight:600; color:var(--muted-2); }        .panel{ flex:0 0 auto; width:min(88vw,300px); display:flex; flex-direction:column; gap:16px; position:relative; z-index:1; }        .numpad{ display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }        .num-btn{ aspect-ratio:1/1; min-height:44px; background:var(--bg-alt); border:1px solid var(--bg-alt-2); border-radius:10px; color:var(--text); font-family:'JetBrains Mono', monospace; font-size:19px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; transition:all 0.14s ease; }        .num-btn:hover{ background:var(--bg-alt-2); transform:translateY(-1px); box-shadow:0 8px 18px -10px rgba(168,85,247,0.5); }        .num-btn:active{ transform:translateY(0) scale(0.94); }        .num-btn .count{ font-size:9px; position:absolute; bottom:3px; color:var(--muted-2); }        .num-btn.depleted{ opacity:0.28; pointer-events:none; }        .num-btn.active-value{ background:var(--accent); border-color:var(--accent); color:#fff; box-shadow:0 8px 20px -8px rgba(168,85,247,0.65); }        .num-btn.active-value .count{ color:rgba(255,255,255,0.75); }        .action-row{ display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }        .action-btn{ background:var(--bg-alt); border:1px solid var(--bg-alt-2); border-radius:10px; color:var(--muted); font-size:10.5px; font-weight:600; padding:10px 4px; min-height:44px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; transition:all 0.14s ease; position:relative; overflow:hidden; }        .action-btn:hover{ color:var(--text); background:var(--bg-alt-2); }        .action-btn.on{ color:var(--accent); border-color:var(--accent); }        .action-btn:disabled{ opacity:0.3; cursor:default; }        .ripple{ position:absolute; border-radius:50%; background:rgba(255,255,255,0.35); width:140%; padding-bottom:140%; left:50%; top:50%; transform:translate(-50%,-50%) scale(0); animation:rippleAnim 0.5s var(--ease-out); pointer-events:none; }        @keyframes rippleAnim{ from{ transform:translate(-50%,-50%) scale(0); opacity:0.8; } to{ transform:translate(-50%,-50%) scale(1); opacity:0; } }        .hint-note{ font-size:11px; color:var(--muted-2); text-align:center; font-family:'JetBrains Mono', monospace; }        .modal-overlay{ position:fixed; inset:0; background:rgba(10,4,26,0.75); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; animation:overlayIn 0.25s var(--ease-out); }        @keyframes overlayIn{ from{opacity:0;} to{opacity:1;} }        .modal{ background:var(--paper); color:var(--ink); border-radius:20px; padding:34px 32px; width:min(100%,380px); text-align:center; box-shadow:0 30px 70px -20px rgba(0,0,0,0.7); animation:modalIn 0.3s var(--ease-out); position:relative; overflow:hidden; }        @keyframes modalIn{ from{ transform:translateY(14px) scale(0.97); opacity:0; } to{ transform:translateY(0) scale(1); opacity:1; } }        .modal > *{ position:relative; z-index:1; }        .modal .stamp{ width:48px; height:48px; margin:0 auto 10px; border-radius:50%; display:flex; align-items:center; justify-content:center; }        .modal .stamp.win{ background:rgba(168,85,247,0.15); color:var(--accent-deep); }        .modal .stamp.lose{ background:rgba(225,79,111,0.15); color:var(--danger); }        .modal h2{ font-family:'Fraunces', serif; font-size:26px; margin-bottom:6px; }        .modal p.sub{ color:#6b6088; font-size:13px; margin-bottom:20px; }        .modal .stats-row{ display:flex; justify-content:center; gap:26px; margin-bottom:24px; }        .modal .stats-row .m-stat .label{ font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:#8a7fa8; }        .modal .stats-row .m-stat .value{ font-family:'JetBrains Mono', monospace; font-size:22px; font-weight:700; margin-top:2px; }        .modal button.primary{ width:100%; background:var(--ink); color:var(--paper); border:none; padding:13px; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; margin-top:4px; min-height:44px; transition:opacity 0.15s ease; }        .modal button.primary:hover{ opacity:0.88; }        .modal button.secondary{ background:none; border:none; color:var(--muted-2); margin-top:10px; font-weight:600; font-size:13px; padding:8px; cursor:pointer; min-height:44px; }        .modal button.secondary:hover{ color:var(--ink); }        .confetti-layer{ position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:0; }        .confetti-piece{ position:absolute; top:-12px; width:7px; height:13px; opacity:0.9; animation-name:confettiFall; animation-timing-function:cubic-bezier(0.4,0.1,0.6,1); animation-fill-mode:forwards; }        @keyframes confettiFall{ to{ transform:translateY(440px) rotate(560deg); opacity:0; } }        @media (max-width:760px){          .game-main{ padding-bottom:208px; }          .panel{ position:fixed; left:0; right:0; bottom:0; width:auto; background:var(--bg-alt); border-top:1px solid var(--bg-alt-2); padding:12px 14px calc(14px + var(--safe-bottom)); border-radius:20px 20px 0 0; box-shadow:0 -14px 34px -10px rgba(0,0,0,0.5); z-index:40; }          .numpad{ grid-template-columns:repeat(9,1fr); }          .num-btn .count{ display:none; }          .hint-note{ display:none; }        }        @media (max-width:420px){          .game-meta{ gap:12px; }        }@media (min-width:761px){          .game-main{ display:flex; flex-direction:row; align-items:flex-start; justify-content:center; gap:40px; }          .board{ width:min(50vw, 480px); }          .panel{ width:min(28vw, 300px); }        }      `}
</style>      <link rel="preconnect" href="https://fonts.googleapis.com" />      <link        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;
9..144,600;
9..144,700&family=Space+Grotesk:wght@400;
500;
600;
700&family=JetBrains+Mono:wght@500;
700&display=swap"        rel="stylesheet"      />      <div className="blob blob-a" ref={
blobARef}
 />      <div className="blob blob-b" ref={
blobBRef}
 />      <div className="blob blob-c" ref={
blobCRef}
 />      {
view === "select" && <div className="spotlight" ref={
spotlightRef}
 />}
      {
view === "select" && (        <section className="view view-enter" aria-label="Choose difficulty">          <div className="select-inner">            <div className="brand-block">              <h1>SUDOKU</h1>                            <p className="lede">Pick a difficulty and the grid is yours.</p>            </div>            <WeekStrip completedToday={
completedToday}
 />            <div style={
{
 width: "100%", display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }
}
>              <h2 className="diff-heading">Choose a difficulty</h2>              <div className="diff-icon-row">                {
DIFFICULTIES.map((d, i) => (                  <DifficultyIcon key={
d.id}
 config={
d}
 index={
i}
 onSelect={
(id) => newGame(id)}
 />                ))}
              </div>            </div>          </div>        </section>      )}
      {
view === "game" && (        <section className="view view-enter" aria-label="Sudoku puzzle">          <div className="game-topbar">            <button className="back-btn" onClick={
() => {
 audio.vibrate(6);
 audio.playTap();
 setView("select");
 }
}
>              <ArrowLeft size={
16}
 strokeWidth={
2}
 />              Difficulty            </button>            <div className="game-meta">              <FxButton                active={
false}
                onClick={
replayGame}
                label="Replay puzzle"                icon={
<RotateCcw size={
17}
 strokeWidth={
2}
 />}
              />              <FxButton                active={
musicOn}
                onClick={
handleToggleMusic}
                label={
musicOn ? "Turn off music" : "Turn on music"}
                icon={
<Music2 size={
17}
 strokeWidth={
2}
  />}
              />            </div>          </div>          <div className="game-main">            <div className="board-col">              <div className="game-stats">                <span className="diff-pill">{
diffConfig?.label}
</span>                <div className="stat">                  <span className="label">Time</span>                  <span className="value">{
formatTime(timerSec)}
</span>                </div>                <div className="stat">                  <span className="label">Hints</span>                  <span className="value">{
hintsLeft}
</span>                </div>              </div>              <div ref={
boardWrapRef}
>              <div                key={
dealKey}
                className={
`board${shake ? " shake" : ""}${victoryBurst ? " victory" : ""}`}
                role="grid"                aria-label="Sudoku grid"              >                {
sweepRows.map((s) => (                  <div                    key={
s.id}
                    className="sweep-row"                    style={
{
 top: `calc(12px + ${s.r} * ((100% - 24px) / 9))`, height: `calc((100% - 24px) / 9)` }
}
                  />                ))}
                {
sweepCols.map((s) => (                  <div                    key={
s.id}
                    className="sweep-col"                    style={
{
 left: `calc(12px + ${s.c} * ((100% - 24px) / 9))`, width: `calc((100% - 24px) / 9)` }
}
                  />                ))}
                {
burstBoxes.map((b) => {
                  const br = Math.floor(b.box / 3);
                  const bc = b.box % 3;
                  return (                    <div                      key={
b.id}
                      className="box-burst"                      style={
{
                        top: `calc(12px + ${br * 3} * ((100% - 24px) / 9))`,                        left: `calc(12px + ${bc * 3} * ((100% - 24px) / 9))`,                        width: `calc(3 * (100% - 24px) / 9)`,                        height: `calc(3 * (100% - 24px) / 9)`,                      }
}
                    >                      {
Array.from({
 length: 10 }
).map((_, i) => (                        <span key={
i}
 className="burst-particle" style={
{
 "--ang": `${i * 36}deg`, "--delay": `${i * 0.012}s` }
}
 />                      ))}
                    </div>                  );
                }
)}
                {
values.map((val, p) => {
                  const r = Math.floor(p / 9);
                  const c = p % 9;
                  const br = Math.floor(r / 3);
                  const bc = Math.floor(c / 3);
                  const isPeer = selected !== -1 && (r === selR || c === selC || (br === selBR && bc === selBC));
                  const isSameVal = highlightNum !== 0 && val === highlightNum;
                  const isSelected = p === selected;
                  const isGiven = given[p];
                  const isWrong = val !== 0 && val !== solution[p];
                  const cellNotes = notes[p] || 0;
                  const classes = ["cell"];
                  if (c === 2 || c === 5) classes.push("b-right");
                  if (r === 2 || r === 5) classes.push("b-bottom");
                  if (isPeer) classes.push("peer");
                  if (isSameVal) classes.push("same-value");
                  if (isSelected) classes.push("selected");
                  if (val !== 0) {
                    classes.push(isGiven ? "given" : "user-val");
                    if (isWrong) classes.push("error");
                  }
                  if (p === hintPos) classes.push("hinted");
                  return (                    <div                      key={
p}
                      className={
classes.join(" ")}
                      role="gridcell"                      aria-selected={
isSelected}
                      tabIndex={
-1}
                      onClick={
() => selectCell(p)}
                    >                      {
val !== 0 ? (                        <span                          className={
p === hintPos ? "fillpop" : isGiven ? "slam-in" : undefined}
                          style={
isGiven ? {
 "--delay": `${(dealOrderRef.current[p] || 0) * 16}ms` }
 : undefined}
                        >                          {
val}
                        </span>                      ) : cellNotes > 0 ? (                        <div className="notes-grid">                          {
[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (                            <span key={
n}
>{
(cellNotes >> n) & 1 ? n : ""}
</span>                          ))}
                        </div>                      ) : null}
                    </div>                  );
                }
)}
              </div>            </div>            </div>            <div className="panel">              <div className="numpad">                {
[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (                  <button                    key={
n}
                    className={
`num-btn${remainingCounts[n] <= 0 ? " depleted" : ""}${n === highlightNum ? " active-value" : ""}`}
                    onClick={
() => {
                      audio.vibrate(6);
                      audio.playTap();
                      inputNumber(n);
                      setHighlightNum(n);
                      addRipple(`num-${n}`);
                    }
}
                  >                    {
n}
                    <span className="count">{
remainingCounts[n]}
</span>                    {
(ripples[`num-${n}`] || []).map((rid) => (                      <Ripple key={
rid}
 onDone={
() => clearRipple(`num-${n}`, rid)}
 />                    ))}
                  </button>                ))}
              </div>              <div className="action-row">                <button className="action-btn" onClick={
() => {
 undo();
 addRipple("undo");
 }
}
 title="Undo">                  <Undo2 size={
18}
 strokeWidth={
2}
 />                  Undo                  {
(ripples.undo || []).map((rid) => <Ripple key={
rid}
 onDone={
() => clearRipple("undo", rid)}
 />)}
                </button>                <button className="action-btn" onClick={
() => {
 eraseCell();
 addRipple("erase");
 }
}
 title="Erase">                  <Eraser size={
18}
 strokeWidth={
2}
 />                  Erase                  {
(ripples.erase || []).map((rid) => <Ripple key={
rid}
 onDone={
() => clearRipple("erase", rid)}
 />)}
                </button>                <button className={
`action-btn${notesMode ? " on" : ""}`}
 onClick={
() => {
 toggleNotes();
 addRipple("notes");
 }
}
 title="Notes mode">                  <PencilLine size={
18}
 strokeWidth={
2}
 />                  Notes                  {
(ripples.notes || []).map((rid) => <Ripple key={
rid}
 onDone={
() => clearRipple("notes", rid)}
 />)}
                </button>                <button className="action-btn" onClick={
() => {
 giveHint();
 addRipple("hint");
 }
}
 disabled={
hintsLeft <= 0}
 title="Hint">                  <Lightbulb size={
18}
 strokeWidth={
2}
 />                  Hint                  {
(ripples.hint || []).map((rid) => <Ripple key={
rid}
 onDone={
() => clearRipple("hint", rid)}
 />)}
                </button>              </div>              <p className="hint-note">{
hintsLeft}
 hint{
hintsLeft === 1 ? "" : "s"}
 remaining today</p>            </div>          </div>        </section>      )}
      {
victoryBurst && <VictoryConfetti />}
      {
modal && (        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">          <div className="modal">            <div className="confetti-layer">              {
modal === "win" &&                Array.from({
 length: 30 }
).map((_, i) => (                  <span                    key={
i}
                    className="confetti-piece"                    style={
{
                      left: `${Math.random() * 100}%`,                      background: ["#A855F7", "#D6479C", "#7C3AED", "#F2ECFA", "#9333A8"][i % 5],                      transform: `rotate(${Math.floor(Math.random() * 360)}deg)`,                      animationDuration: `${1.6 + Math.random() * 1.2}s`,                      animationDelay: `${Math.random() * 0.35}s`,                    }
}
                  />                ))}
            </div>            <div className={
`stamp ${modal}`}
>              <PartyPopper size={24} strokeWidth={2} />
            </div>            <h2 id="modal-title">Solved!</h2>            <p className="sub">Nice work — the grid checks out.</p>            <div className="stats-row">              <div className="m-stat"><div className="label">Time</div><div className="value">{
formatTime(timerSec)}
</div></div>              <div className="m-stat"><div className="label">Difficulty</div><div className="value">{
diffConfig?.label}
</div></div>            </div>            <button ref={
modalBtnRef}
 className="primary" onClick={
() => newGame()}
>              Play again
            </button>            <button className="secondary" onClick={
goToSelect}
>              Change difficulty            </button>          </div>        </div>      )}
    </div>  );
}