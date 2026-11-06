import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";

/* ============================================================
   CANDY BLAST — 10 Level Mode
   - 10 levels, each with its own score target & move count
   - Beat the target before moves run out to advance
   - Smooth 60fps movement using translate3d
   ============================================================ */

const GRID = 8;

// Ten levels: each has its own score goal and move allowance.
// Difficulty ramps up gradually — higher targets, slightly more moves.
const LEVELS = [
  { target: 800, moves: 18 },
  { target: 1400, moves: 19 },
  { target: 2000, moves: 20 },
  { target: 2700, moves: 21 },
  { target: 3500, moves: 22 },
  { target: 4400, moves: 23 },
  { target: 5400, moves: 24 },
  { target: 6500, moves: 25 },
  { target: 7700, moves: 26 },
  { target: 9000, moves: 28 },
];

const CANDY_TYPES = [
  { emoji: "🍬", bg: "#FF6FA5" },
  { emoji: "🍭", bg: "#FF4D4D" },
  { emoji: "🍫", bg: "#8B5A2B" },
  { emoji: "🍡", bg: "#FFB6C1" },
  { emoji: "🍩", bg: "#C77DFF" },
  { emoji: "🍪", bg: "#E0A458" },
];

const SPECIAL_ROW = { emoji: "🚀", bg: "#00E5FF", isSpecial: "ROW" };
const SPECIAL_BOMB = { emoji: "💣", bg: "#333333", isSpecial: "BOMB" };

function randType() { return Math.floor(Math.random() * CANDY_TYPES.length); }

function genTypesGrid() {
  const g = Array.from({ length: GRID }, () => Array(GRID).fill(-1));
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      let t, tries = 0;
      do {
        t = randType();
        tries++;
      } while (
        tries < 30 &&
        ((c >= 2 && g[r][c - 1] === t && g[r][c - 2] === t) ||
          (r >= 2 && g[r - 1][c] === t && g[r - 2][c] === t))
      );
      g[r][c] = t;
    }
  }
  return g;
}

function findMatchKeys(typesGrid) {
  const matched = new Set();
  for (let r = 0; r < GRID; r++) {
    let runStart = 0;
    for (let c = 1; c <= GRID; c++) {
      const same = c < GRID && typesGrid[r][c] !== -1 && typesGrid[r][c] === typesGrid[r][runStart];
      if (same) continue;
      const runLen = c - runStart;
      if (runLen >= 3 && typesGrid[r][runStart] !== -1 && typesGrid[r][runStart] < 6) {
        for (let k = runStart; k < c; k++) matched.add(`${r}_${k}`);
      }
      runStart = c;
    }
  }
  for (let c = 0; c < GRID; c++) {
    let runStart = 0;
    for (let r = 1; r <= GRID; r++) {
      const same = r < GRID && typesGrid[r][c] !== -1 && typesGrid[r][c] === typesGrid[runStart][c];
      if (same) continue;
      const runLen = r - runStart;
      if (runLen >= 3 && typesGrid[runStart][c] !== -1 && typesGrid[runStart][c] < 6) {
        for (let k = runStart; k < r; k++) matched.add(`${k}_${c}`);
      }
      runStart = r;
    }
  }
  return matched;
}

function hasAnyMove(typesGrid) {
  const clone = (g) => g.map((row) => row.slice());
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (c + 1 < GRID) {
        const g2 = clone(typesGrid);
        [g2[r][c], g2[r][c + 1]] = [g2[r][c + 1], g2[r][c]];
        if (findMatchKeys(g2).size > 0 || g2[r][c] >= 6 || g2[r][c + 1] >= 6) return true;
      }
      if (r + 1 < GRID) {
        const g2 = clone(typesGrid);
        [g2[r][c], g2[r + 1][c]] = [g2[r + 1][c], g2[r][c]];
        if (findMatchKeys(g2).size > 0 || g2[r][c] >= 6 || g2[r + 1][c] >= 6) return true;
      }
    }
  }
  return false;
}

function genPlayableGrid() {
  let g = genTypesGrid();
  let tries = 0;
  while (!hasAnyMove(g) && tries < 15) { g = genTypesGrid(); tries++; }
  return g;
}

function buildTypesGrid(candies) {
  const g = Array.from({ length: GRID }, () => Array(GRID).fill(-1));
  candies.forEach((c) => { if (c.row >= 0 && c.row < GRID && c.col >= 0 && c.col < GRID) g[c.row][c.col] = c.type; });
  return g;
}

/* ---------------- Audio & Haptics ---------------- */
function createSnd() {
  let ctx = null, muted = false;
  function ensure() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function tone(freq, dur, type, vol, delay) {
    if (muted) return;
    ensure();
    const t0 = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol || 0.2, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  function sweep(f1, f2, dur, type, vol) {
    if (muted) return;
    ensure();
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(f1, t0);
    osc.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(vol || 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  return {
    ensure,
    setMuted: (m) => { muted = m; },
    isMuted: () => muted,
    select: () => tone(520, 0.05, "triangle", 0.18),
    swap: () => sweep(300, 480, 0.1, "triangle", 0.18),
    bad: () => tone(150, 0.12, "sawtooth", 0.15),
    match: () => tone(600, 0.1, "sine", 0.2),
    combo: (level) => sweep(500 + level * 100, 800 + level * 100, 0.12, "triangle", 0.2),
    boom: () => sweep(200, 40, 0.25, "sawtooth", 0.35),
    shuffle: () => tone(350, 0.08, "square", 0.1),
    win: () => tone(800, 0.25, "triangle", 0.2),
    lose: () => tone(200, 0.25, "sawtooth", 0.18),
    click: () => tone(600, 0.04, "square", 0.12),
    levelup: () => { tone(660, 0.12, "triangle", 0.2); tone(880, 0.18, "triangle", 0.2, 0.1); },
  };
}

function createHaptics(snd) {
  const supported = typeof navigator !== "undefined" && !!navigator.vibrate;
  function vibrate(pattern) {
    if (!supported || snd.isMuted()) return;
    try { navigator.vibrate(pattern); } catch (e) {}
  }
  return {
    select: () => vibrate(8),
    swap: () => vibrate(12),
    bad: () => vibrate(20),
    match: () => vibrate(12),
    boom: () => vibrate([40, 20, 60]),
    win: () => vibrate([20, 20, 40]),
    lose: () => vibrate(40),
    click: () => vibrate(8),
  };
}

const CSS = `
.cb-app { position:relative; width:100%; max-width:480px; margin:0 auto; display:flex; flex-direction:column;
  align-items:center; background:radial-gradient(ellipse at top, #402a55 0%, #211530 65%); color:#fff;
  font-family:'Baloo 2','Trebuchet MS',sans-serif; border-radius:22px; padding:14px 0 22px; overflow:hidden;
  box-shadow:0 10px 30px rgba(0,0,0,0.35); touch-action:none; -webkit-user-select:none; user-select:none; }
.cb-app * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
.cb-topbar { width:100%; max-width:480px; display:flex; justify-content:space-between; align-items:center; padding:0 18px 4px; z-index: 10; gap:6px; }
.cb-title { font-size:22px; font-weight:800; color:#ff9ecf; text-shadow:2px 2px 0 rgba(0,0,0,0.35); }
.cb-scores { display:flex; gap:6px; align-items:center; }
.cb-box { background:rgba(255,255,255,0.08); border:2px solid rgba(255,255,255,0.15); border-radius:10px;
  padding:5px 9px; text-align:center; min-width:46px; }
.cb-box.cb-level { border-color:rgba(255,226,122,0.5); background:rgba(255,226,122,0.12); }
.cb-box .lbl { font-size:9px; color:#cbb8e6; }
.cb-box .val { font-size:16px; font-weight:800; color:#fff; }
.cb-box.cb-level .val { color:#ffe27a; }
.cb-soundBtn { cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:16px;
  background:rgba(255,255,255,0.08); border:2px solid rgba(255,255,255,0.15); border-radius:10px; width:34px; height:34px; }
.cb-progressWrap { width:100%; max-width:440px; padding:6px 20px 2px; z-index: 10; }
.cb-progressLbl { display:flex; justify-content:space-between; font-size:10px; color:#cbb8e6; margin-bottom:3px; }
.cb-progressBar { height:10px; border-radius:6px; background:rgba(255,255,255,0.12); overflow:hidden; }
.cb-progressFill { height:100%; background:linear-gradient(90deg,#ff9ecf,#c77dff); transition:width .3s ease; }

.cb-dots { display:flex; gap:4px; justify-content:center; padding:6px 12px 0; flex-wrap:wrap; z-index:10; }
.cb-dot { width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-size:8px; font-weight:800; background:rgba(255,255,255,0.1); border:2px solid rgba(255,255,255,0.15); color:#cbb8e6; }
.cb-dot.done { background:linear-gradient(#ffe27a,#ffb74d); border-color:#ffb74d; color:#4a2c00; }
.cb-dot.active { border-color:#ff9ecf; box-shadow:0 0 6px rgba(255,158,207,0.7); color:#fff; }

.cb-boardWrap { position:relative; margin-top:10px; border-radius:16px; background:rgba(0,0,0,0.25);
  box-shadow:inset 0 2px 10px rgba(0,0,0,0.4); padding:8px; overflow:hidden; z-index:1; contain: layout style paint; }
.cb-boardWrap.cb-shake { animation: cb-shake 0.25s ease-in-out; }
@keyframes cb-shake { 0%,100%{transform:translate(0,0)} 25%{transform:translate(-4px,2px)} 75%{transform:translate(4px,-2px)} }

.cb-board { position:relative; overflow:hidden; }
.candy { position:absolute; display:flex; align-items:center; justify-content:center; border-radius:50%;
  cursor:pointer; transition:transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.15s ease;
  will-change: transform; top: 0; left: 0; z-index: 2; }
.candy .glyph { pointer-events:none; }
.candy.selected { box-shadow:0 0 0 3px #fff, 0 0 8px rgba(255,255,255,0.8); z-index:5; }
.candy.clearing { animation:cb-pop .18s ease forwards; z-index:4; }
@keyframes cb-pop { 0%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.8} 100%{transform:scale(0);opacity:0} }

.cb-blastRow { position:absolute; left:0; width:100%; background:linear-gradient(90deg, transparent, #ffea00, #ff0055, transparent);
  z-index:10; pointer-events:none; animation: cb-beam 0.28s ease-out forwards; }
.cb-blastCol { position:absolute; top:0; height:100%; background:linear-gradient(180deg, transparent, #ffea00, #ff0055, transparent);
  z-index:10; pointer-events:none; animation: cb-beam 0.28s ease-out forwards; }
@keyframes cb-beam { 0%{opacity:0; transform:scale(0.3);} 50%{opacity:1; transform:scale(1);} 100%{opacity:0;} }

.cb-msgFloat { position:absolute; top:8px; left:50%; transform:translateX(-50%); color:#ffe27a; font-size:16px; font-weight:800;
  text-shadow:2px 2px 0 rgba(0,0,0,0.4); transition:opacity .2s; pointer-events:none; z-index:12; }
.cb-btn { font-family:'Baloo 2','Trebuchet MS',sans-serif; font-weight:800; font-size:15px; color:#fff;
  background:linear-gradient(#ff9ecf,#c93f8f); border:none; border-radius:12px; padding:12px 28px; cursor:pointer;
  box-shadow:0 4px 0 #8f2a63; margin-top:14px; }
.cb-btn.secondary { background:linear-gradient(#8fb8ff,#4d6fc9); box-shadow:0 4px 0 #2a3f8f; margin-top:8px; font-size:13px; padding:9px 22px; }
.cb-panel { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:rgba(10,8,20,0.92); gap:6px; z-index:20; text-align:center; padding:20px; border-radius:22px; }
.cb-panel h1 { font-size:26px; margin:0; color:#ff9ecf; }
.cb-panel .sub { font-size:12px; color:#cbb8e6; margin:0; }
.cb-panel .finalScore { font-size:36px; font-weight:800; color:#ffd23f; margin:4px 0; }
`;

export default function CandyBlast({ sessionToken, onComplete }) {
  const idRef = useRef(1);
  const wrapRef = useRef(null);
  const dragRef = useRef(null);
  const msgTimerRef = useRef(null);

  const snd = useMemo(() => createSnd(), []);
  const haptics = useMemo(() => createHaptics(snd), [snd]);

  const gameRef = useRef({
    candies: [], moves: 0, score: 0, busy: false, levelIndex: 0, status: "playing", totalScore: 0,
  });

  const [cellSize, setCellSize] = useState(42);
  const [candies, setCandies] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [clearingIds, setClearingIds] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);
  // status: 'playing' | 'levelComplete' | 'gameWon' | 'gameOver'
  const [status, setStatus] = useState("playing");
  const [muted, setMuted] = useState(false);
  const [msg, setMsg] = useState({ text: "", visible: false });
  const [blastEffect, setBlastEffect] = useState(null);
  const [isShaking, setIsShaking] = useState(false);

  function makeCandiesFromTypesGrid(typesGrid) {
    const list = [];
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        list.push({ id: idRef.current++, row: r, col: c, type: typesGrid[r][c] });
      }
    }
    return list;
  }

  const startLevel = useCallback((idx, carryTotal) => {
    const lvl = LEVELS[idx];
    const g = genPlayableGrid();
    const list = makeCandiesFromTypesGrid(g);
    gameRef.current = {
      candies: list,
      moves: lvl.moves,
      score: 0,
      busy: false,
      levelIndex: idx,
      status: "playing",
      totalScore: typeof carryTotal === "number" ? carryTotal : gameRef.current.totalScore,
    };
    setCandies(list);
    setMoves(lvl.moves);
    setScore(0);
    setLevelIndex(idx);
    setStatus("playing");
    setTotalScore(gameRef.current.totalScore);
    setSelectedId(null);
    setClearingIds(new Set());
  }, []);

  const restartAll = useCallback(() => {
    startLevel(0, 0);
  }, [startLevel]);

  useEffect(() => { startLevel(0, 0); }, [startLevel]);

  const completedRef = useRef(false);
  const handleComplete = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      if (sessionToken) {
        await fetch('/api/play/session/complete', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: sessionToken, score: 0, player_data: { result: status === 'gameWon' ? 'win' : 'over' } })
        });
      }
    } catch {}
    onComplete?.();
  }, [sessionToken, onComplete, status]);

  useEffect(() => {
    if (status === 'gameWon' || status === 'gameOver') handleComplete();
  }, [status, handleComplete]);

  useEffect(() => {
    function computeCellSize() {
      const containerWidth = wrapRef.current ? wrapRef.current.clientWidth : 360;
      const usable = Math.min(containerWidth, 480) - 36;
      const size = Math.floor(usable / GRID);
      setCellSize(Math.max(28, Math.min(48, size)));
    }
    computeCellSize();
    window.addEventListener("resize", computeCellSize);
    return () => window.removeEventListener("resize", computeCellSize);
  }, []);

  function showMsg(text) {
    setMsg({ text, visible: true });
    clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMsg((m) => ({ ...m, visible: false })), 600);
  }

  function bumpScore(delta) {
    gameRef.current.score += delta;
    setScore(gameRef.current.score);
  }

  function candyAt(row, col) {
    return gameRef.current.candies.find((c) => c.row === row && c.col === col) || null;
  }

  function updateCandyPositions(candiesList, aId, aPos, bId, bPos) {
    return candiesList.map((c) => {
      if (c.id === aId) return { ...c, row: aPos.row, col: aPos.col };
      if (c.id === bId) return { ...c, row: bPos.row, col: bPos.col };
      return c;
    });
  }

  function checkEndConditions() {
    const g = gameRef.current;
    const lvl = LEVELS[g.levelIndex];
    const isLastLevel = g.levelIndex === LEVELS.length - 1;

    if (g.score >= lvl.target) {
      const newTotal = g.totalScore + g.score;
      g.totalScore = newTotal;
      g.busy = true;
      setTotalScore(newTotal);
      if (isLastLevel) {
        g.status = "gameWon";
        setStatus("gameWon");
        snd.win(); haptics.win();
      } else {
        g.status = "levelComplete";
        setStatus("levelComplete");
        snd.levelup(); haptics.win();
      }
      return;
    }
    if (g.moves <= 0) {
      g.busy = true;
      g.status = "gameOver";
      setStatus("gameOver");
      snd.lose(); haptics.lose();
      return;
    }
    const typesGrid = buildTypesGrid(g.candies);
    if (!hasAnyMove(typesGrid)) {
      showMsg("Shuffling!");
      snd.shuffle();
      const fresh = genPlayableGrid();
      const relist = g.candies.map((c) => ({ ...c }));
      let i = 0;
      for (let r = 0; r < GRID; r++) {
        for (let col = 0; col < GRID; col++) {
          relist[i].row = r; relist[i].col = col; relist[i].type = fresh[r][col]; i++;
        }
      }
      gameRef.current.candies = relist;
      setCandies(relist);
    }
  }

  function useMove() {
    gameRef.current.moves -= 1;
    setMoves(gameRef.current.moves);
  }

  function processCascade(combo, forcedBombPos = null) {
    const g = gameRef.current;
    const typesGrid = buildTypesGrid(g.candies);
    const matchKeys = findMatchKeys(typesGrid);

    if (matchKeys.size === 0 && forcedBombPos === null) {
      g.busy = false;
      checkEndConditions();
      return;
    }

    const matchedIds = new Set();
    g.candies.forEach((c) => { if (matchKeys.has(`${c.row}_${c.col}`)) matchedIds.add(c.id); });

    if (forcedBombPos) {
      const { row, col } = forcedBombPos;
      g.candies.filter((item) => item.row === row || item.col === col).forEach((item) => matchedIds.add(item.id));

      setIsShaking(true);
      setBlastEffect({ row, col });
      setTimeout(() => { setIsShaking(false); setBlastEffect(null); }, 280);

      showMsg("CROSS BLAST! 💥");
      snd.boom(); haptics.boom();
    }

    g.candies.forEach((c) => {
      if (matchedIds.has(c.id) && (c.type === 6 || c.type === 7)) {
        g.candies.filter((item) => item.row === c.row).forEach((item) => matchedIds.add(item.id));
      }
    });

    setClearingIds(matchedIds);
    bumpScore(matchedIds.size * 10 + (combo * 40));

    if (!forcedBombPos) {
      if (combo > 0) { snd.combo(combo); haptics.match(); }
      else { snd.match(matchedIds.size); haptics.match(); }
    }

    setTimeout(() => {
      const remaining = g.candies.filter((c) => !matchedIds.has(c.id));
      const byCol = Array.from({ length: GRID }, () => []);
      remaining.forEach((c) => byCol[c.col].push(c));

      const newGridList = [];

      for (let col = 0; col < GRID; col++) {
        const colCandies = byCol[col].sort((a, b) => a.row - b.row);
        const count = colCandies.length;

        colCandies.forEach((c, idx) => {
          newGridList.push({ ...c, row: GRID - count + idx, col });
        });

        const missing = GRID - count;
        for (let k = 0; k < missing; k++) {
          const id = idRef.current++;
          const roll = Math.random();
          const spawnType = roll < 0.09 ? 7 : roll < 0.17 ? 6 : randType();
          newGridList.push({ id, row: k, col, type: spawnType });
        }
      }

      g.candies = newGridList;
      setClearingIds(new Set());
      setCandies(newGridList);

      setTimeout(() => processCascade(combo + 1), 220);
    }, 200);
  }

  function attemptSwap(a, b) {
    const g = gameRef.current;
    if (g.busy || g.status !== "playing") return;
    const dr = Math.abs(a.row - b.row), dc = Math.abs(a.col - b.col);
    if (dr + dc !== 1) return;

    g.busy = true;
    snd.swap(); haptics.swap();

    const posA = { row: a.row, col: a.col };
    const posB = { row: b.row, col: b.col };

    // 1. Swap visually and update state
    const swappedList = updateCandyPositions(g.candies, a.id, posB, b.id, posA);
    g.candies = swappedList;
    setCandies(swappedList);

    // 2. Check for match after swap transition finishes
    setTimeout(() => {
      const typesGrid = buildTypesGrid(gameRef.current.candies);
      const matches = findMatchKeys(typesGrid);

      const bombSwapped = a.type === 7 ? a : b.type === 7 ? b : null;
      const specialSwapped = a.type >= 6 || b.type >= 6;

      if (matches.size === 0 && !specialSwapped) {
        snd.bad(); haptics.bad();

        // 3. Invalid move: Swap back to original positions
        const restoredList = updateCandyPositions(gameRef.current.candies, a.id, posA, b.id, posB);
        gameRef.current.candies = restoredList;
        setCandies(restoredList);

        // 4. Release lock after return animation completes
        setTimeout(() => {
          gameRef.current.busy = false;
        }, 220);
      } else {
        useMove();
        const forcedPos = bombSwapped ? { row: bombSwapped.id === a.id ? posB.row : posA.row, col: bombSwapped.id === a.id ? posB.col : posA.col } : null;
        processCascade(0, forcedPos);
      }
    }, 220);
  }

  function handleTap(candy) {
    const g = gameRef.current;
    if (g.busy || g.status !== "playing") return;
    if (selectedId === null) {
      setSelectedId(candy.id);
      snd.select(); haptics.select();
      return;
    }
    if (selectedId === candy.id) { setSelectedId(null); return; }
    const sel = g.candies.find((c) => c.id === selectedId);
    if (!sel) { setSelectedId(candy.id); snd.select(); haptics.select(); return; }
    const dr = Math.abs(sel.row - candy.row), dc = Math.abs(sel.col - candy.col);
    if (dr + dc === 1) {
      setSelectedId(null);
      attemptSwap(sel, candy);
    } else {
      setSelectedId(candy.id);
      snd.select(); haptics.select();
    }
  }

  function onCandyPointerDown(candy, ev) {
    if (gameRef.current.busy || gameRef.current.status !== "playing") return;
    snd.ensure();
    dragRef.current = { candy, x: ev.clientX, y: ev.clientY };
  }

  function onCandyPointerUp(candy, ev) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;

    const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 10) {
      handleTap(candy);
      return;
    }

    let target = null;
    if (Math.abs(dx) > Math.abs(dy)) target = candyAt(candy.row, candy.col + (dx > 0 ? 1 : -1));
    else target = candyAt(candy.row + (dy > 0 ? 1 : -1), candy.col);

    setSelectedId(null);
    if (target) attemptSwap(candy, target);
  }

  function toggleMute() {
    snd.ensure();
    const m = !snd.isMuted();
    snd.setMuted(m);
    setMuted(m);
    if (!m) { snd.click(); haptics.click(); }
  }

  const boardPx = GRID * cellSize;
  const pad = Math.max(2, Math.floor(cellSize * 0.08));
  const currentTarget = LEVELS[levelIndex].target;
  const progressPct = Math.min(100, Math.round((score / currentTarget) * 100));
  const isLastLevel = levelIndex === LEVELS.length - 1;

  return (
    <div className="cb-app" ref={wrapRef}>
      <style>{CSS}</style>

      <div className="cb-topbar">
        <div className="cb-title">Candy Blast</div>
        <div className="cb-scores">
          <div className="cb-box cb-level"><div className="lbl">LEVEL</div><div className="val">{levelIndex + 1}/{LEVELS.length}</div></div>
          <div className="cb-box"><div className="lbl">SCORE</div><div className="val">{score}</div></div>
          <div className="cb-box"><div className="lbl">MOVES</div><div className="val">{moves}</div></div>
          <div className="cb-soundBtn" onClick={toggleMute}>{muted ? "🔇" : "🔊"}</div>
        </div>
      </div>

      <div className="cb-progressWrap">
        <div className="cb-progressLbl"><span>Goal: {currentTarget}</span><span>{Math.min(score, currentTarget)}/{currentTarget}</span></div>
        <div className="cb-progressBar"><div className="cb-progressFill" style={{ width: `${progressPct}%` }} /></div>
      </div>

      {status !== "playing" && (
        <div className="cb-dots">
          {LEVELS.map((_, i) => (
            <div key={i} className={`cb-dot${i < levelIndex ? " done" : ""}${i === levelIndex ? " active" : ""}`}>
              {i < levelIndex ? "✓" : i + 1}
            </div>
          ))}
        </div>
      )}

      <div className={`cb-boardWrap${isShaking ? " cb-shake" : ""}`}>
        <div className="cb-msgFloat" style={{ opacity: msg.visible ? 1 : 0 }}>{msg.text}</div>
        <div className="cb-board" style={{ width: boardPx, height: boardPx }}>

          {blastEffect && (
            <>
              <div className="cb-blastRow" style={{ top: blastEffect.row * cellSize + pad, height: cellSize - pad * 2 }} />
              <div className="cb-blastCol" style={{ left: blastEffect.col * cellSize + pad, width: cellSize - pad * 2 }} />
            </>
          )}

          {candies.map((c) => {
            const isSpecial = c.type === 6 ? SPECIAL_ROW : c.type === 7 ? SPECIAL_BOMB : null;
            const type = isSpecial || CANDY_TYPES[c.type] || CANDY_TYPES[0];
            const isSelected = selectedId === c.id;
            const isClearing = clearingIds.has(c.id);

            const x = c.col * cellSize + pad;
            const y = c.row * cellSize + pad;
            const itemSize = cellSize - pad * 2;

            return (
              <div
                key={c.id}
                className={`candy${isSelected ? " selected" : ""}${isClearing ? " clearing" : ""}`}
                style={{
                  width: itemSize,
                  height: itemSize,
                  transform: `translate3d(${x}px, ${y}px, 0)${isSelected ? " scale(1.08)" : ""}`,
                  background: `radial-gradient(circle at 35% 30%, ${type.bg}dd, ${type.bg})`,
                }}
                onPointerDown={(ev) => onCandyPointerDown(c, ev)}
                onPointerUp={(ev) => onCandyPointerUp(c, ev)}
              >
                <span className="glyph" style={{ fontSize: cellSize * 0.5 }}>{type.emoji}</span>
              </div>
            );
          })}
        </div>

        {status === "levelComplete" && (
          <div className="cb-panel">
            <h1>Level {levelIndex + 1} Complete!</h1>
            <p className="sub">Goal was {currentTarget} — you scored:</p>
            <div className="finalScore">{score}</div>
            <p className="sub">Total score: {totalScore}</p>
            <button className="cb-btn" onClick={() => { snd.click(); haptics.click(); startLevel(levelIndex + 1); }}>
              ▶ LEVEL {levelIndex + 2}
            </button>
          </div>
        )}

        {status === "gameWon" && (
          <div className="cb-panel">
            <h1>🏆 All 10 Levels Complete!</h1>
            <p className="sub">Final total score</p>
            <div className="finalScore">{totalScore}</div>
            <button className="cb-btn" onClick={() => { snd.click(); haptics.click(); restartAll(); }}>⟲ PLAY AGAIN</button>
          </div>
        )}

        {status === "gameOver" && (
          <div className="cb-panel">
            <h1>Out of Moves</h1>
            <p className="sub">Level {levelIndex + 1} goal was {currentTarget}</p>
            <div className="finalScore">{score}</div>
            <button className="cb-btn" onClick={() => { snd.click(); haptics.click(); startLevel(levelIndex); }}>⟲ RETRY LEVEL</button>
            {levelIndex > 0 && (
              <button className="cb-btn secondary" onClick={() => { snd.click(); haptics.click(); restartAll(); }}>Restart from Level 1</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}