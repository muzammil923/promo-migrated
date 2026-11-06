import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/* =========================================================================
   CONNECT FOUR — under-the-sea edition, single-file React implementation
   -------------------------------------------------------------------------
   Sections in this file:
   1. Constants & pure game-logic helpers (board, win detection, AI)
   2. Web Audio sound engine (hook)
   3. Small presentational sub-components (Disc, Confetti, space objects...)
   4. Main <Connect4Game /> component (state, handlers, render)
   5. Styles (plain CSS injected via a <style> tag, theme-aware)
   ========================================================================= */

/* ------------------------------------------------------------------------ *
 * 1. CONSTANTS
 * ------------------------------------------------------------------------ */
const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const PLAYER_ONE = 1; // Red — always a human
const PLAYER_TWO = 2; // Yellow — human (PvP) or AI (PvAI)

const COL_ORDER = [3, 2, 4, 1, 5, 0, 6]; // center-out, best for move ordering
const SCORES_KEY = 'connect4_scores_v1';
const THEME_KEY = 'connect4_theme_v1';
const MUTE_KEY = 'connect4_muted_v1';

/* ------------------------------------------------------------------------ *
 * 2. PURE GAME LOGIC HELPERS
 * ------------------------------------------------------------------------ */

/** Build a fresh 6x7 board filled with EMPTY cells. */
function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

/** Deep-ish clone (rows are shallow arrays, cheap to copy). */
function cloneBoard(board) {
  return board.map((row) => row.slice());
}

/** Columns that still have room for a disc. */
function getValidColumns(board) {
  const cols = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === EMPTY) cols.push(c);
  }
  return cols;
}

/** Row index a disc would land on in `col`, or -1 if the column is full. */
function getDropRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === EMPTY) return r;
  }
  return -1;
}

/** Returns a NEW board with `player`'s disc dropped into `col`. */
function dropDisc(board, col, player) {
  const row = getDropRow(board, col);
  if (row === -1) return null;
  const next = cloneBoard(board);
  next[row][col] = player;
  return { board: next, row };
}

/** The board is full when the top row has no empty cells (gravity guarantee). */
function isBoardFull(board) {
  return board[0].every((cell) => cell !== EMPTY);
}

/**
 * Efficient win check — only looks outward from the last-placed disc,
 * across the four possible winning axes. Returns the array of connected
 * winning cell coordinates ([row, col] pairs) or null.
 */
function checkWin(board, row, col, player) {
  const axes = [
    [
      [0, 1],
      [0, -1],
    ], // horizontal
    [
      [1, 0],
      [-1, 0],
    ], // vertical
    [
      [1, 1],
      [-1, -1],
    ], // diagonal “\”
    [
      [1, -1],
      [-1, 1],
    ], // diagonal “/”
  ];

  for (const [dirA, dirB] of axes) {
    const cells = [[row, col]];
    for (const [dr, dc] of [dirA, dirB]) {
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        cells.push([r, c]);
        r += dr;
        c += dc;
      }
    }
    if (cells.length >= 4) return cells;
  }
  return null;
}

/** Finds a column that lets `player` win immediately, or null. */
function findWinningMove(board, player) {
  for (const col of COL_ORDER) {
    const result = dropDisc(board, col, player);
    if (!result) continue;
    if (checkWin(result.board, result.row, col, player)) return col;
  }
  return null;
}

/* ---- AI: heuristic evaluation + minimax with alpha-beta pruning -------- */

/** Score a single 4-cell window from the perspective of `aiPlayer`. */
function evaluateWindow(window, aiPlayer, humanPlayer) {
  let aiCount = 0;
  let humanCount = 0;
  let emptyCount = 0;
  for (const cell of window) {
    if (cell === aiPlayer) aiCount++;
    else if (cell === humanPlayer) humanCount++;
    else emptyCount++;
  }

  if (aiCount > 0 && humanCount > 0) return 0; // blocked window, no value

  if (aiCount === 4) return 100000;
  if (aiCount === 3 && emptyCount === 1) return 120;
  if (aiCount === 2 && emptyCount === 2) return 12;

  if (humanCount === 4) return -100000;
  if (humanCount === 3 && emptyCount === 1) return -150; // weigh blocking a bit higher
  if (humanCount === 2 && emptyCount === 2) return -10;

  return 0;
}

/** Full-board heuristic score used at the leaves of the minimax search. */
function evaluateBoard(board, aiPlayer, humanPlayer) {
  let score = 0;

  // Center column control is valuable — it participates in the most lines.
  const centerCol = Math.floor(COLS / 2);
  let centerCount = 0;
  for (let r = 0; r < ROWS; r++) if (board[r][centerCol] === aiPlayer) centerCount++;
  score += centerCount * 6;

  // Horizontal windows
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]];
      score += evaluateWindow(window, aiPlayer, humanPlayer);
    }
  }
  // Vertical windows
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      const window = [board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]];
      score += evaluateWindow(window, aiPlayer, humanPlayer);
    }
  }
  // Diagonal “\”
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]];
      score += evaluateWindow(window, aiPlayer, humanPlayer);
    }
  }
  // Diagonal “/”
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window = [board[r][c], board[r - 1][c + 1], board[r - 2][c + 2], board[r - 3][c + 3]];
      score += evaluateWindow(window, aiPlayer, humanPlayer);
    }
  }

  return score;
}

/** Minimax with alpha-beta pruning. Returns a numeric score for `board`. */
function minimax(board, depth, alpha, beta, maximizing, aiPlayer, humanPlayer) {
  const validCols = getValidColumns(board).sort(
    (a, b) => COL_ORDER.indexOf(a) - COL_ORDER.indexOf(b)
  );

  if (validCols.length === 0) return 0; // draw

  if (depth === 0) return evaluateBoard(board, aiPlayer, humanPlayer);

  const currentPlayer = maximizing ? aiPlayer : humanPlayer;

  if (maximizing) {
    let best = -Infinity;
    for (const col of validCols) {
      const result = dropDisc(board, col, currentPlayer);
      if (!result) continue;
      const win = checkWin(result.board, result.row, col, currentPlayer);
      let value;
      if (win) value = 1000000 + depth * 1000;
      else value = minimax(result.board, depth - 1, alpha, beta, false, aiPlayer, humanPlayer);
      best = Math.max(best, value);
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const col of validCols) {
      const result = dropDisc(board, col, currentPlayer);
      if (!result) continue;
      const win = checkWin(result.board, result.row, col, currentPlayer);
      let value;
      if (win) value = -1000000 - depth * 1000;
      else value = minimax(result.board, depth - 1, alpha, beta, true, aiPlayer, humanPlayer);
      best = Math.min(best, value);
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return best;
  }
}

/** Root-level minimax search: picks the best column for the AI. */
function minimaxRoot(board, depth, aiPlayer, humanPlayer) {
  let bestScore = -Infinity;
  let bestCol = null;
  let alpha = -Infinity;
  const beta = Infinity;

  const validCols = getValidColumns(board).sort(
    (a, b) => COL_ORDER.indexOf(a) - COL_ORDER.indexOf(b)
  );

  for (const col of validCols) {
    const result = dropDisc(board, col, aiPlayer);
    if (!result) continue;
    const win = checkWin(result.board, result.row, col, aiPlayer);
    const value = win
      ? 1000000 + depth * 1000
      : minimax(result.board, depth - 1, alpha, beta, false, aiPlayer, humanPlayer);
    if (value > bestScore) {
      bestScore = value;
      bestCol = col;
    }
    alpha = Math.max(alpha, value);
  }
  return bestCol !== null ? bestCol : validCols[0];
}

/**
 * Chooses the AI's move for a given difficulty.
 *   easy   — mostly random, occasionally plays a smart move
 *   medium — always takes a win / blocks a loss, otherwise shallow search
 *   hard   — always takes a win / blocks a loss, otherwise deep alpha-beta search
 */
function getAiMove(board, difficulty, aiPlayer, humanPlayer) {
  const validCols = getValidColumns(board);
  if (validCols.length === 0) return null;

  if (difficulty === 'easy') {
    const playSmart = Math.random() < 0.3;
    if (playSmart) {
      const win = findWinningMove(board, aiPlayer);
      if (win !== null) return win;
      const block = findWinningMove(board, humanPlayer);
      if (block !== null) return block;
    }
    return validCols[Math.floor(Math.random() * validCols.length)];
  }

  // medium & hard both take free wins / necessary blocks first
  const win = findWinningMove(board, aiPlayer);
  if (win !== null) return win;
  const block = findWinningMove(board, humanPlayer);
  if (block !== null) return block;

  const depth = difficulty === 'hard' ? 6 : 3;
  return minimaxRoot(board, depth, aiPlayer, humanPlayer);
}

/* ------------------------------------------------------------------------ *
 * 3. SOUND ENGINE (Web Audio API for SFX + HTML5 Audio for bg music)
 *    Plays a looping MP3 backdrop and uses Web Audio for interaction SFX.
 * ------------------------------------------------------------------------ */

const BG_MUSIC_SRC = '/audio/leberch-funny-playful-262598.mp3';

function useSoundEngine(muted) {
  const ctxRef = useRef(null);
  const noiseBufferRef = useRef(null);
  const musicRef = useRef(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  /** Lazily creates and starts the background music on a loop. */
  const ensureMusic = useCallback(() => {
    if (!musicRef.current) {
      const audio = new Audio(BG_MUSIC_SRC);
      audio.loop = true;
      audio.volume = 0.45;
      musicRef.current = audio;
    }
    const m = musicRef.current;
    if (mutedRef.current) {
      m.pause();
    } else if (m.paused) {
      m.play().catch(() => {});
    }
  }, []);

  // sync music with mute toggle
  useEffect(() => {
    if (!musicRef.current) return;
    if (muted) {
      musicRef.current.pause();
    } else {
      musicRef.current.play().catch(() => {});
    }
  }, [muted]);

  // clean up on unmount
  useEffect(() => {
    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, []);

  /** Builds a soft brown noise buffer for gentle fizz/texture layers. */
  const getNoiseBuffer = useCallback((ctx) => {
    if (!noiseBufferRef.current) {
      const duration = 3;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.018 * white) / 1.018;
        data[i] = lastOut * 3.2;
      }
      noiseBufferRef.current = buffer;
    }
    return noiseBufferRef.current;
  }, []);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctxRef.current = new AudioCtx();
    }
    if (ctxRef.current && ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    ensureMusic();
    return ctxRef.current;
  }, [ensureMusic]);

  /** Plays a single tone with a short attack/decay envelope. */
  const tone = useCallback(
    (freq, duration, { type = 'sine', volume = 0.18, delay = 0, glideTo = null } = {}) => {
      if (mutedRef.current) return;
      const ctx = getCtx();
      if (!ctx) return;
      const startAt = ctx.currentTime + delay;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startAt);
      if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, startAt + duration);

      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(volume, startAt + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.02);
    },
    [getCtx]
  );

  /** A short filtered-noise burst — splashes, swishes, fizzy pops. */
  const noiseBurst = useCallback(
    (duration, { volume = 0.12, delay = 0, freq = 900, freqEnd = null, q = 1 } = {}) => {
      if (mutedRef.current) return;
      const ctx = getCtx();
      const buffer = getNoiseBuffer(ctx);
      if (!ctx || !buffer) return;
      const startAt = ctx.currentTime + delay;

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, startAt);
      if (freqEnd) filter.frequency.exponentialRampToValueAtTime(freqEnd, startAt + duration);
      filter.Q.value = q;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(volume, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(startAt);
      src.stop(startAt + duration + 0.05);
    },
    [getCtx, getNoiseBuffer]
  );

  const sounds = useMemo(
    () => ({
      setMusicVolume: (vol) => {
        if (musicRef.current) musicRef.current.volume = vol;
      },
      // disc sliding down the column — bright whoosh with a happy upward glide
      drop: () => {
        tone(400, 0.12, { type: 'triangle', volume: 0.1, glideTo: 600 });
        noiseBurst(0.18, { volume: 0.06, freq: 1800, freqEnd: 800, q: 0.8 });
      },
      // disc settling into the hole — a cheerful "ding" pop
      land: () => {
        tone(523.25, 0.18, { type: 'sine', volume: 0.18 });
        tone(659.25, 0.15, { type: 'sine', volume: 0.12, delay: 0.06 });
        noiseBurst(0.2, { volume: 0.08, freq: 1200, freqEnd: 400, q: 0.7, delay: 0.01 });
      },
      // UI click — a bright, snappy pop
      click: () => {
        tone(880, 0.05, { type: 'triangle', volume: 0.1, glideTo: 1200 });
        noiseBurst(0.04, { volume: 0.04, freq: 2800, freqEnd: 1800, q: 2.5 });
      },
      // hover — a light, bright tick
      hover: () => tone(1100, 0.025, { type: 'sine', volume: 0.03 }),
      // win — a celebratory ascending major arpeggio with sparkle
      win: () => {
        [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((f, i) =>
          tone(f, 0.28, { type: 'triangle', volume: 0.16, delay: i * 0.08 })
        );
        noiseBurst(0.6, { volume: 0.04, freq: 3000, freqEnd: 7000, q: 0.3, delay: 0.06 });
      },
      // draw — a gentle, neutral descending trio
      draw: () => {
        [440, 392, 349.23].forEach((f, i) =>
          tone(f, 0.28, { type: 'sine', volume: 0.12, delay: i * 0.11 })
        );
        noiseBurst(0.35, { volume: 0.04, freq: 600, freqEnd: 300, q: 0.6, delay: 0.08 });
      },
    }),
    [tone, noiseBurst]
  );

  return sounds;
}

/** Light wrapper around the Vibration API — silently no-ops if unsupported. */
function vibrate(pattern) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      /* ignore unsupported/blocked vibration */
    }
  }
}

/* ------------------------------------------------------------------------ *
 * 3.5 OCEAN SCENE — flat, hand-drawn-style SVG critters used as ambience
 * ------------------------------------------------------------------------ */

function RocketSVG() {
  return (
    <svg viewBox="0 0 50 80" className="space-rocket">
      <path d="M25 2 C 25 2 18 18 18 40 L32 40 C32 18 25 2 25 2 Z" className="body" />
      <path d="M18 40 L12 60 L20 52 Z" className="fin" />
      <path d="M32 40 L38 60 L30 52 Z" className="fin" />
      <circle cx="25" cy="30" r="4" className="window" />
      <path d="M20 52 L25 72 L30 52 Z" className="flame" />
    </svg>
  );
}

function PlanetSVG({ ring }) {
  return (
    <svg viewBox="0 0 60 60" className={`space-planet ${ring ? 'has-ring' : ''}`}>
      <circle cx="30" cy="30" r="22" className="body" />
      <ellipse cx="30" cy="30" rx="32" ry="8" className="ring" />
      <circle cx="22" cy="24" r="3" className="crater" />
      <circle cx="36" cy="34" r="2" className="crater" />
      <circle cx="28" cy="38" r="1.5" className="crater" />
    </svg>
  );
}

function AsteroidSVG() {
  return (
    <svg viewBox="0 0 40 40" className="space-asteroid">
      <polygon points="20,2 32,8 38,20 34,34 20,38 8,34 2,20 8,8" className="body" />
      <circle cx="14" cy="14" r="3" className="crater" />
      <circle cx="26" cy="22" r="2" className="crater" />
      <circle cx="18" cy="30" r="2.5" className="crater" />
    </svg>
  );
}

function UFOSVG() {
  return (
    <svg viewBox="0 0 70 50" className="space-ufo">
      <ellipse cx="35" cy="32" rx="30" ry="10" className="dome-base" />
      <path d="M20 32 C20 18 50 18 50 32" className="dome" />
      <circle cx="20" cy="34" r="3" className="light light-1" />
      <circle cx="35" cy="38" r="3" className="light light-2" />
      <circle cx="50" cy="34" r="3" className="light light-3" />
      <circle cx="35" cy="24" r="5" className="eye" />
    </svg>
  );
}

/** The full ambient space backdrop: stars + planets + rockets + asteroids. */
function SpaceScene() {
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 3,
        duration: 2 + Math.random() * 4,
        delay: Math.random() * -5,
      })),
    []
  );

  return (
    <div className="space-scene" aria-hidden="true">
      <div className="space-nebula" />

      {stars.map((s) => (
        <span
          key={s.id}
          className="space-star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      <div className="space-obj rocket-1"><RocketSVG /></div>
      <div className="space-obj rocket-2"><RocketSVG /></div>

      <div className="space-obj planet-1"><PlanetSVG ring /></div>
      <div className="space-obj planet-2"><PlanetSVG /></div>
      <div className="space-obj planet-3"><PlanetSVG ring /></div>

      <div className="space-obj asteroid-1"><AsteroidSVG /></div>
      <div className="space-obj asteroid-2"><AsteroidSVG /></div>
      <div className="space-obj asteroid-3"><AsteroidSVG /></div>

      <div className="space-obj ufo-1"><UFOSVG /></div>
    </div>
  );
}

/* ------------------------------------------------------------------------ *
 * 4. OTHER PRESENTATIONAL COMPONENTS
 * ------------------------------------------------------------------------ */

/** A single game disc — rendered as a glossy planet/asteroid. */
function Disc({ player, isFalling, fallRows, isWinning, delay = 0 }) {
  const colorClass = player === PLAYER_ONE ? 'disc-red' : 'disc-yellow';
  const style = {};
  if (isFalling) {
    style['--fall-rows'] = fallRows;
    style['--fall-duration'] = `${Math.min(0.36 + fallRows * 0.055, 0.75)}s`;
  }
  if (isWinning) style['animationDelay'] = `${delay}ms`;

  return (
    <div
      className={[
        'disc',
        colorClass,
        isFalling ? 'disc-falling' : '',
        isWinning ? 'disc-winning' : '',
      ].join(' ')}
      style={style}
    >
      <span className="disc-shine" />
    </div>
  );
}

/** Confetti burst shown when a game is won. */
function Confetti({ active }) {
  const pieces = useMemo(() => {
    const colors = ['#ff5d55', '#ffd23f', '#4fd8f0', '#7dff8b', '#c07bff', '#ff9ecf'];
    return Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[i % colors.length],
      delay: Math.random() * 0.6,
      duration: 2.4 + Math.random() * 1.6,
      size: 6 + Math.random() * 7,
      rotate: Math.random() * 360,
      drift: (Math.random() - 0.5) * 160,
      shape: Math.random() > 0.5 ? '50%' : '3px',
    }));
  }, [active]);

  if (!active) return null;

  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            width: p.size,
            height: p.size,
            borderRadius: p.shape,
            transform: `rotate(${p.rotate}deg)`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------ *
 * 5. MAIN COMPONENT
 * ------------------------------------------------------------------------ */
export default function Connect4Game() {
  /* ---- persisted preferences -------------------------------------- */
  const [scores, setScores] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SCORES_KEY));
      if (saved && typeof saved.p1 === 'number') return saved;
    } catch (e) {
      /* ignore malformed storage */
    }
    return { p1: 0, p2: 0, draws: 0 };
  });

  const [darkMode] = useState(true);

  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  });

  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  /* ---- core game state ---------------------------------------------- */
  const [board, setBoard] = useState(() => createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER_ONE);
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'pvp'
  const [difficulty, setDifficulty] = useState('hard'); // 'easy' | 'medium' | 'hard'
  const [winner, setWinner] = useState(null); // null | PLAYER_ONE | PLAYER_TWO | 'draw'
  const [winningCells, setWinningCells] = useState([]);
  const [history, setHistory] = useState([]); // stack of {board, currentPlayer}
  const [lastMove, setLastMove] = useState(null); // {row, col, player, moveId}
  const [isDropping, setIsDropping] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hoverCol, setHoverCol] = useState(null);
  const [appLoaded, setAppLoaded] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [announcement, setAnnouncement] = useState('');

  const moveIdRef = useRef(0);
  const aiTimeoutRef = useRef(null);
  const dropTimeoutRef = useRef(null);
  const sounds = useSoundEngine(muted);

  /* ---- entrance animation -------------------------------------------- */
  useEffect(() => {
    const t = setTimeout(() => setAppLoaded(true), 120);
    return () => clearTimeout(t);
  }, []);

  /* ---- persist preferences -------------------------------------------- */
  useEffect(() => {
    try {
      localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
    } catch (e) {
      /* storage may be unavailable (private mode, etc.) */
    }
  }, [scores]);

  useEffect(() => {
    try {
      localStorage.setItem(MUTE_KEY, String(muted));
    } catch (e) {
      /* ignore */
    }
  }, [muted]);

  /* ---- cleanup pending timers on unmount ------------------------------- */
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
      if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current);
    };
  }, []);

  /* ---- derived labels --------------------------------------------------- */
  const player2Label = gameMode === 'ai' ? 'Computer' : 'Player 2';
  const isHumanTurn =
    !winner &&
    !isDropping &&
    !isAiThinking &&
    !showWelcome &&
    (gameMode === 'pvp' || currentPlayer === PLAYER_ONE);

  /* ---- score bookkeeping -------------------------------------------------- */
  const updateScore = useCallback((result) => {
    setScores((prev) => {
      if (result === PLAYER_ONE) return { ...prev, p1: prev.p1 + 1 };
      if (result === PLAYER_TWO) return { ...prev, p2: prev.p2 + 1 };
      return { ...prev, draws: prev.draws + 1 };
    });
  }, []);

  /* ---- core move pipeline (shared by human clicks & AI) ------------------- */
  const finishTurn = useCallback(
    (newBoard, row, col, player) => {
      const win = checkWin(newBoard, row, col, player);
      if (win) {
        setWinningCells(win);
        setWinner(player);
        updateScore(player);
        sounds.setMusicVolume(0.05);
        sounds.win();
        vibrate([40, 30, 40, 30, 80]);
        setShowConfetti(true);
        setAnnouncement(`${player === PLAYER_ONE ? 'Red' : player2Label} wins the game!`);
        setTimeout(() => setShowOverlay(true), 550);
        setTimeout(() => setShowConfetti(false), 4200);
        return;
      }
      if (isBoardFull(newBoard)) {
        setWinner('draw');
        updateScore('draw');
        sounds.setMusicVolume(0.05);
        sounds.draw();
        vibrate([30, 40, 30]);
        setAnnouncement("It's a draw!");
        setTimeout(() => setShowOverlay(true), 400);
        return;
      }
      const next = player === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
      setCurrentPlayer(next);
      setAnnouncement(`${next === PLAYER_ONE ? "Red's" : `${player2Label}'s`} turn`);
      if (gameMode === 'ai' && next === PLAYER_TWO) {
        triggerAiMove(newBoard);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameMode, player2Label, sounds, updateScore]
  );

  const makeMove = useCallback(
    (col, sourceBoard, player) => {
      const result = dropDisc(sourceBoard, col, player);
      if (!result) return;
      const { board: newBoard, row } = result;

      setHistory((prev) => [...prev, { board: sourceBoard, currentPlayer: player }]);
      moveIdRef.current += 1;
      setLastMove({ row, col, player, moveId: moveIdRef.current });
      setBoard(newBoard);
      setIsDropping(true);
      sounds.drop();
      vibrate(12);

      const fallDuration = Math.min(360 + row * 55, 750) + 40;
      dropTimeoutRef.current = setTimeout(() => {
        setIsDropping(false);
        sounds.land();
        vibrate(18);
        finishTurn(newBoard, row, col, player);
      }, fallDuration);
    },
    [finishTurn, sounds]
  );

  const triggerAiMove = useCallback(
    (sourceBoard) => {
      setIsAiThinking(true);
      const thinkTime = 480 + Math.random() * 420;
      aiTimeoutRef.current = setTimeout(() => {
        const col = getAiMove(sourceBoard, difficulty, PLAYER_TWO, PLAYER_ONE);
        setIsAiThinking(false);
        if (col !== null) makeMove(col, sourceBoard, PLAYER_TWO);
      }, thinkTime);
    },
    [difficulty, makeMove]
  );

  const handleColumnClick = useCallback(
    (col) => {
      if (winner || isDropping || isAiThinking || showWelcome) return;
      if (gameMode === 'ai' && currentPlayer !== PLAYER_ONE) return;
      if (getDropRow(board, col) === -1) return;
      sounds.click();
      makeMove(col, board, currentPlayer);
    },
    [board, currentPlayer, gameMode, isAiThinking, isDropping, makeMove, showWelcome, sounds, winner]
  );

  /* ---- new game / undo / reset ------------------------------------------- */
  const startNewGame = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current);
    setBoard(createEmptyBoard());
    setCurrentPlayer(PLAYER_ONE);
    setWinner(null);
    setWinningCells([]);
    setHistory([]);
    setLastMove(null);
    setIsDropping(false);
    setIsAiThinking(false);
    setShowConfetti(false);
    setShowOverlay(false);
    setAnnouncement("Red's turn");
    sounds.setMusicVolume(0.45);
    sounds.click();
    vibrate(10);
  }, [sounds]);

  const handleUndo = useCallback(() => {
    if (history.length === 0 || winner || isDropping || isAiThinking) return;
    sounds.click();
    vibrate(10);
    // In AI mode, roll back two half-moves so control returns to the human.
    const stepsBack = gameMode === 'ai' && history.length >= 2 ? 2 : 1;
    const target = history[history.length - stepsBack];
    setHistory((prev) => prev.slice(0, prev.length - stepsBack));
    setBoard(target.board);
    setCurrentPlayer(target.currentPlayer);
    setLastMove(null);
    setWinner(null);
    setWinningCells([]);
    setShowOverlay(false);
  }, [gameMode, history, isAiThinking, isDropping, sounds, winner]);

  const handleResetScore = useCallback(() => {
    sounds.click();
    setScores({ p1: 0, p2: 0, draws: 0 });
  }, [sounds]);

  const openMenu = useCallback(() => {
    sounds.click();
    setShowWelcome(true);
    setShowOverlay(false);
  }, [sounds]);

  const startFromMenu = useCallback(
    (mode) => {
      sounds.click();
      setGameMode(mode);
      setShowWelcome(false);
      startNewGame();
    },
    [sounds, startNewGame]
  );

  /* ---- keyboard support --------------------------------------------------- */
  useEffect(() => {
    function onKeyDown(e) {
      if (!isHumanTurn) return;
      if (e.key >= '1' && e.key <= '7') {
        const col = Number(e.key) - 1;
        handleColumnClick(col);
        return;
      }
      if (e.key === 'ArrowLeft') {
        setHoverCol((c) => (c === null ? COLS - 1 : (c + COLS - 1) % COLS));
      } else if (e.key === 'ArrowRight') {
        setHoverCol((c) => (c === null ? 0 : (c + 1) % COLS));
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (hoverCol !== null) {
          e.preventDefault();
          handleColumnClick(hoverCol);
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleColumnClick, hoverCol, isHumanTurn]);

  /* ---- helpers for rendering ---------------------------------------------- */
  const isWinningCell = useCallback(
    (r, c) => winningCells.some(([wr, wc]) => wr === r && wc === c),
    [winningCells]
  );

  const columnFull = useCallback((c) => board[0][c] !== EMPTY, [board]);

  const statusText = winner
    ? winner === 'draw'
      ? "It's a draw!"
      : `${winner === PLAYER_ONE ? 'Red' : player2Label} wins!`
    : isAiThinking
    ? 'Computer is thinking…'
    : `${currentPlayer === PLAYER_ONE ? 'Red' : player2Label}'s turn`;

  const themeClass = darkMode ? 'theme-dark' : 'theme-light';

  return (
    <div
      className={`c4-app ${themeClass} ${appLoaded ? 'loaded' : 'loading'} ${
        animationsEnabled ? '' : 'no-anim'
      }`}
    >
      <style>{STYLES}</style>

      <SpaceScene />

      {/* live region for screen readers */}
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>

      {/* corner score badges */}
      <div className="score-badge badge-red" title="Red score">
        <span className="badge-shine" aria-hidden="true" />
        <span className="badge-value">{scores.p1}</span>
        <span className="badge-label">Red</span>
      </div>
      <div className="score-badge badge-yellow" title={`${player2Label} score`}>
        <span className="badge-shine" aria-hidden="true" />
        <span className="badge-value">{scores.p2}</span>
        <span className="badge-label">{gameMode === 'ai' ? 'CPU' : 'P2'}</span>
      </div>

      <div className="c4-shell">
        {/* ============================ TOP BAR ============================ */}
        <header className="topbar">
          <p className={`turn-indicator ${winner ? 'ended' : ''}`} data-player={currentPlayer}>
            <span
              className={`turn-dot ${currentPlayer === PLAYER_ONE ? 'dot-red' : 'dot-yellow'} ${
                isAiThinking ? 'pulsing' : ''
              }`}
            />
            {statusText}
          </p>

          <div className="icon-btn-row">
            <button
              className="icon-btn"
              onClick={handleUndo}
              disabled={history.length === 0 || !!winner || isDropping || isAiThinking || showWelcome}
              title="Undo last move"
              aria-label="Undo last move"
            >
              ↺
            </button>
            <button
              className="icon-btn"
              onClick={() => setMuted((m) => !m)}
              title={muted ? 'Unmute sounds' : 'Mute sounds'}
              aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
              aria-pressed={muted}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </header>

        {/* ============================ BOARD =============================== */}
        <main className="board-area">
          <div
            className="board-wrapper"
            tabIndex={0}
            role="grid"
            aria-label="Connect four board, 7 columns by 6 rows"
            onKeyDown={() => {}}
          >
            <div className="drop-arrow-row">
              {Array.from({ length: COLS }).map((_, c) => (
                <div key={c} className="drop-arrow-cell">
                  {isHumanTurn && !columnFull(c) && (
                    <span
                      className={`drop-arrow ${hoverCol === c ? 'active' : ''} ${
                        currentPlayer === PLAYER_ONE ? 'arrow-red' : 'arrow-yellow'
                      }`}
                    >
                      ▼
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="board">
              {/* clickable column overlay */}
              <div className="column-layer">
                {Array.from({ length: COLS }).map((_, c) => (
                  <button
                    key={c}
                    type="button"
                    className={`column-btn ${hoverCol === c ? 'hovered' : ''}`}
                    disabled={!isHumanTurn || columnFull(c)}
                    onMouseEnter={() => {
                      setHoverCol(c);
                      if (isHumanTurn) sounds.hover();
                    }}
                    onMouseLeave={() => setHoverCol((h) => (h === c ? null : h))}
                    onFocus={() => setHoverCol(c)}
                    onClick={() => handleColumnClick(c)}
                    aria-label={`Drop disc in column ${c + 1}${columnFull(c) ? ' (full)' : ''}`}
                  >
                    {isHumanTurn && !columnFull(c) && (
                      <span
                        className={`ghost-disc ${
                          currentPlayer === PLAYER_ONE ? 'ghost-red' : 'ghost-yellow'
                        } ${hoverCol === c ? 'visible' : ''}`}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* visual cell grid: holes + discs */}
              <div className="cells-grid">
                {board.map((rowArr, r) =>
                  rowArr.map((cell, c) => (
                    <div className="cell" key={`${r}-${c}`}>
                      <div className="hole" />
                      {cell !== EMPTY && (
                        <Disc
                          player={cell}
                          isFalling={
                            lastMove &&
                            lastMove.row === r &&
                            lastMove.col === c &&
                            lastMove.player === cell &&
                            isDropping
                          }
                          fallRows={r + 1}
                          isWinning={!!winner && winner !== 'draw' && isWinningCell(r, c)}
                          delay={(r + c) * 40}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <Confetti active={showConfetti} />
        </main>

        {/* ============================ BOTTOM BAR =========================== */}
        <footer className="bottom-bar">
          <button className="bottom-btn" onClick={openMenu}>
            Menu
          </button>
          <button className="bottom-btn" onClick={startNewGame}>
            Restart
          </button>
        </footer>
      </div>

      {/* ============================ WELCOME / SETTINGS MODAL ============== */}
      {showWelcome && (
        <div className="welcome-overlay" role="dialog" aria-modal="true" aria-label="Connect Four settings">
          <div className="welcome-card">
            <button className="welcome-close" onClick={() => setShowWelcome(false)} aria-label="Close">
              ×
            </button>

            <div className="welcome-banner">
              <div className="welcome-banner-rays" />
              <h1 className="c4-title">
                <span className="l-white">C</span>
                <span className="l-red">O</span>
                <span className="l-blue arrow-letter">
                  N<span className="mini-arrow mini-arrow-up">▲</span>
                </span>
                <span className="l-yellow arrow-letter">
                  N<span className="mini-arrow mini-arrow-down">▼</span>
                </span>
                <span className="l-white">E</span>
                <span className="l-red">C</span>
                <span className="l-blue">T</span>
              </h1>
              <h1 className="c4-title c4-title-2">
                <span className="l-white">F</span>
                <span className="l-yellow">O</span>
                <span className="l-red">U</span>
                <span className="l-blue">R</span>
              </h1>
              <div className="welcome-banner-floor">
                <div style={{ opacity: 0.6 }}><AsteroidSVG /></div>
                <div style={{ opacity: 0.7 }}><PlanetSVG /></div>
                <div style={{ opacity: 0.5 }}><AsteroidSVG /></div>
              </div>
            </div>

            <div className="welcome-body">
              <p>
                Use the arrow keys or buttons located below the gameboard to select a column
                indicated by the flashing arrow.
              </p>
              <p>Once you have chosen, press enter or click the column to drop your disc.</p>
              <p>The first player with four discs in a row, up, across, or diagonally, wins!</p>

              <div className="welcome-controls">
                <label className="anim-toggle">
                  <input
                    type="checkbox"
                    checked={animationsEnabled}
                    onChange={(e) => setAnimationsEnabled(e.target.checked)}
                  />
                  <span className="checkbox-box" aria-hidden="true" />
                  Animation
                </label>

                <div className="difficulty-control">
                  <span className="control-title">Difficulty</span>
                  <div className="difficulty-options">
                    {[
                      { level: 'easy', label: 'Easy' },
                      { level: 'medium', label: 'Medium' },
                      { level: 'hard', label: 'Hard' },
                    ].map(({ level, label }) => (
                      <label key={level} className="difficulty-option">
                        <span>{label}</span>
                        <input
                          type="radio"
                          name="difficulty"
                          checked={difficulty === level}
                          onChange={() => setDifficulty(level)}
                        />
                        <span className="radio-dot" aria-hidden="true" />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="welcome-actions">
                <button className="welcome-btn btn-computer" onClick={() => startFromMenu('ai')}>
                  Vs Computer
                </button>
                <button className="welcome-btn btn-player" onClick={() => startFromMenu('pvp')}>
                  Vs Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================ VICTORY / DRAW OVERLAY ================ */}
      {winner && showOverlay && !showWelcome && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Game result">
          <div
            className={`overlay-card ${
              winner === 'draw' ? 'draw-result' : winner === PLAYER_ONE ? 'win-red-result' : 'win-yellow-result'
            }`}
          >
            {winner === 'draw' ? (
              <>
                <div className="overlay-icon draw-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 15h8"/>
                    <path d="M9 9h.01"/>
                    <path d="M15 9h.01"/>
                  </svg>
                </div>
                <h2>It's a draw!</h2>
                <p>The board is full — nobody takes this one.</p>
              </>
            ) : (
              <>
                <div className="overlay-icon trophy-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                    <path d="M4 22h16"/>
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/>
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                  </svg>
                </div>
                <h2>
                  <span className={winner === PLAYER_ONE ? 'text-red' : 'text-yellow'}>
                    {winner === PLAYER_ONE ? 'Red' : player2Label}
                  </span>{' '}
                  wins!
                </h2>
                <p>
                  {winner === PLAYER_ONE ? scores.p1 : scores.p2} total win
                  {(winner === PLAYER_ONE ? scores.p1 : scores.p2) === 1 ? '' : 's'} so far.
                </p>
              </>
            )}
            <div className="overlay-actions">
              <button className="primary-btn" onClick={startNewGame}>
                Play again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ *
 * 6. STYLES
 * ------------------------------------------------------------------------ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

/* =========================================================================
   UNDER-THE-SEA THEME
   Deep space backdrop, twinkling stars, floating planets, disc-shaped chips.
   ========================================================================= */
.c4-app {
  --ink: #0d0f1a;
  --deep-1: #0a0c18;
  --deep-2: #12142a;
  --deep-3: #1a1d3a;
  --water-surface: #2a1f4e;
  --sand: #1c1f3a;
  --sand-dark: #14162e;
  --white: #ffffff;
  --red: #d6483c;
  --red-dark: #a92f27;
  --yellow: #e0ab2c;
  --yellow-dark: #b5811a;
  --cyan: #6ec6ff;
  --cyan-dark: #3a8fd4;
  --green: #4ecf7a;
  --green-dark: #2ea35a;
  --purple: #a855f7;
  --purple-dark: #7c3aed;
  --hole: rgba(6, 8, 20, 0.55);
  --border-w: 3px;
  --border-w-lg: 4px;
  --radius-lg: 26px;
  --radius-md: 18px;
  --font-display: 'Baloo 2', system-ui, sans-serif;
  --font-body: 'Baloo 2', 'Inter', system-ui, sans-serif;

  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow-x: hidden;
  font-family: var(--font-body);
  color: var(--white);
  background: linear-gradient(180deg, #0d0f1a 0%, #12142a 30%, #1a1040 60%, #0d0f1a 100%);
}

.c4-app * { box-sizing: border-box; }

.c4-app.loading .c4-shell { opacity: 0; transform: translateY(14px) scale(0.99); }
.c4-app.loaded .c4-shell {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition: opacity 0.6s cubic-bezier(.2,.7,.2,1), transform 0.6s cubic-bezier(.2,.7,.2,1);
}

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

/* ---------- space ambience ---------- */
/* ---------- space scene ---------- */
.space-scene { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
.space-nebula {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(120,60,200,0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(60,100,220,0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(180,60,180,0.08) 0%, transparent 60%);
  animation: nebulaPulse 18s ease-in-out infinite alternate;
}
@keyframes nebulaPulse { 0% { opacity: 0.6; } 100% { opacity: 1; } }

.space-star {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  animation-name: starTwinkle;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
@keyframes starTwinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

.space-obj { position: absolute; opacity: 0.7; }

/* rockets */
.space-rocket { width: 36px; overflow: visible; }
.space-rocket .body { fill: #e0e0e0; stroke: #0d0f1a; stroke-width: 1.5; }
.space-rocket .fin { fill: var(--red); stroke: #0d0f1a; stroke-width: 1.5; }
.space-rocket .window { fill: var(--cyan); stroke: #0d0f1a; stroke-width: 1.5; }
.space-rocket .flame { fill: #f59e0b; opacity: 0.85; }
.rocket-1 { top: 8%; left: 5%; animation: rocketFloat 14s ease-in-out infinite; }
.rocket-2 { top: 20%; right: 8%; width: 28px; animation: rocketFloat 18s ease-in-out infinite reverse; }
@keyframes rocketFloat {
  0%, 100% { transform: translateY(0) rotate(-15deg); }
  50% { transform: translateY(-18px) rotate(-15deg); }
}

/* planets */
.space-planet { width: 50px; overflow: visible; }
.space-planet .body { fill: #7c3aed; opacity: 0.85; }
.space-planet.has-ring .body { fill: #c084fc; }
.space-planet .ring { fill: none; stroke: rgba(255,255,255,0.35); stroke-width: 2.5; }
.space-planet.has-ring .ring { transform: rotate(-20deg); }
.space-planet .crater { fill: rgba(0,0,0,0.2); }
.planet-1 { top: 15%; right: 5%; width: 56px; animation: planetOrbit 24s ease-in-out infinite; }
.planet-2 { bottom: 20%; left: 3%; width: 38px; animation: planetOrbit 30s ease-in-out infinite reverse; }
.planet-3 { bottom: 35%; right: 12%; width: 42px; animation: planetOrbit 28s ease-in-out infinite; animation-delay: -6s; }
@keyframes planetOrbit {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}

/* asteroids */
.space-asteroid { width: 30px; overflow: visible; }
.space-asteroid .body { fill: #4a4a5a; stroke: #0d0f1a; stroke-width: 1.5; }
.space-asteroid .crater { fill: rgba(0,0,0,0.3); }
.asteroid-1 { top: 50%; left: 2%; width: 24px; animation: asteroidDrift 20s linear infinite; }
.asteroid-2 { top: 30%; right: 3%; width: 18px; animation: asteroidDrift 26s linear infinite reverse; }
.asteroid-3 { bottom: 15%; left: 20%; width: 20px; animation: asteroidDrift 22s linear infinite; animation-delay: -8s; }
@keyframes asteroidDrift {
  0% { transform: translateY(0) rotate(0deg); }
  100% { transform: translateY(-100vh) rotate(360deg); }
}

/* ufo */
.space-ufo { width: 54px; overflow: visible; }
.space-ufo .dome-base { fill: #6b7280; stroke: #0d0f1a; stroke-width: 1.5; }
.space-ufo .dome { fill: rgba(110,198,255,0.4); stroke: #0d0f1a; stroke-width: 1.5; }
.space-ufo .light { fill: #6ec6ff; opacity: 0.7; }
.space-ufo .light-1 { animation: ufoLight 1.5s ease-in-out infinite; }
.space-ufo .light-2 { animation: ufoLight 1.5s ease-in-out infinite 0.5s; }
.space-ufo .light-3 { animation: ufoLight 1.5s ease-in-out infinite 1s; }
.space-ufo .eye { fill: #0d0f1a; }
@keyframes ufoLight {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
.ufo-1 { top: 45%; left: 8%; animation: ufoFloat 16s ease-in-out infinite; }
@keyframes ufoFloat {
  0%, 100% { transform: translateY(0) translateX(0); }
  25% { transform: translateY(-12px) translateX(6px); }
  75% { transform: translateY(8px) translateX(-6px); }
}

@media (max-width: 640px) {
  .space-rocket { width: 26px; }
  .space-planet { width: 36px; }
  .space-ufo { width: 40px; }
}

/* ---------- layout shell ---------- */
.c4-shell {
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
  padding: 76px 16px 26px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 100vh;
}

/* ---------- corner score badges ---------- */
.score-badge {
  position: fixed;
  top: 22px;
  z-index: 20;
  width: 82px;
  height: 82px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  animation: badgeBob 4s ease-in-out infinite;
}
.badge-yellow { animation-delay: -2s; }
@keyframes badgeBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

.score-badge::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 3px solid var(--ink);
}
.badge-red {
  left: 20px;
  filter: drop-shadow(0 6px 0 var(--red-dark)) drop-shadow(0 10px 14px rgba(0,0,0,0.4));
}
.badge-red, .badge-red::before {
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}
.badge-red {
  background: radial-gradient(circle at 34% 26%, #f19086 0%, var(--red) 46%, var(--red-dark) 100%);
}
.badge-yellow {
  right: 20px;
  filter: drop-shadow(0 6px 0 var(--yellow-dark)) drop-shadow(0 10px 14px rgba(0,0,0,0.4));
}
.badge-yellow, .badge-yellow::before {
  clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
}
.badge-yellow {
  background: radial-gradient(circle at 34% 26%, #f5dd8e 0%, var(--yellow) 46%, var(--yellow-dark) 100%);
}
.badge-shine {
  position: absolute;
  top: 16%;
  left: 24%;
  width: 30%;
  height: 20%;
  background: rgba(255,255,255,0.55);
  border-radius: 50%;
  filter: blur(2px);
  transform: rotate(-20deg);
  pointer-events: none;
}
.badge-value {
  position: relative;
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  color: var(--white);
  text-shadow: 2px 2px 0 rgba(0,0,0,0.28);
}
.badge-label {
  position: relative;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.9);
  text-shadow: 1px 1px 0 rgba(0,0,0,0.25);
}

@media (max-width: 640px) {
  .score-badge { width: 60px; height: 60px; top: 14px; }
  .badge-value { font-size: 18px; }
  .badge-label { font-size: 7.5px; }
  .badge-red { left: 12px; }
  .badge-yellow { right: 12px; }
}

/* ---------- top bar ---------- */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(8, 38, 51, 0.55);
  border: 2px solid rgba(255,255,255,0.18);
  backdrop-filter: blur(2px);
}

.turn-indicator {
  margin: 0;
  font-size: 13px;
  color: var(--white);
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.turn-dot {
  width: 20px; height: 20px;
  border-radius: 50%;
  display: inline-flex;
  border: 2px solid var(--ink);
  flex-shrink: 0;
}
.dot-red { background: var(--red); }
.dot-yellow { background: var(--yellow); }
.turn-dot.pulsing { animation: dotPulse 0.9s ease-in-out infinite; }
@keyframes dotPulse { 0%,100%{ transform: scale(1); } 50%{ transform: scale(1.25); } }

.icon-btn-row { display: flex; gap: 8px; }
.icon-btn {
  width: 36px; height: 36px;
  border-radius: 10px;
  border: 2px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.12);
  color: var(--white);
  font-size: 15px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.15s ease, background 0.15s ease, opacity 0.2s ease;
}
.icon-btn:hover:not(:disabled) { background: rgba(255,255,255,0.22); transform: translateY(-1px); }
.icon-btn:active:not(:disabled) { transform: translateY(1px); }
.icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.icon-btn:focus-visible, .column-btn:focus-visible {
  outline: 3px solid var(--cyan);
  outline-offset: 2px;
}

/* ---------- board area ---------- */
.board-area { position: relative; display: flex; justify-content: center; flex-direction: column; align-items: center; }

.board-wrapper {
  position: relative;
  width: 100%;
  max-width: 560px;
  outline: none;
}

.drop-arrow-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0 3.2%;
  height: 24px;
}
.drop-arrow-cell { display: flex; align-items: center; justify-content: center; }
.drop-arrow {
  font-size: 15px;
  color: var(--sand);
  opacity: 0.55;
  animation: arrowFloat 1.1s ease-in-out infinite;
}
.drop-arrow.active { opacity: 1; }
.arrow-red.active { color: var(--red); }
.arrow-yellow.active { color: var(--yellow); }
@keyframes arrowFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(4px); } }

.board {
  position: relative;
  z-index: 1;
  aspect-ratio: 7 / 6;
  width: 100%;
  border-radius: var(--radius-lg);
  background: linear-gradient(160deg, var(--deep-3), var(--deep-2));
  box-shadow: 0 10px 0 rgba(6,26,35,0.55), 0 18px 30px rgba(0,0,0,0.35), inset 0 0 0 3px rgba(255,255,255,0.08);
  padding: 3.2%;
  border: var(--border-w-lg) solid var(--ink);
  overflow: hidden;
}

.column-layer, .cells-grid {
  position: absolute;
  inset: 3.2%;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.column-layer { z-index: 3; grid-template-rows: 1fr; }
.cells-grid { z-index: 2; grid-template-rows: repeat(6, 1fr); gap: 3%; }

.column-btn {
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
  padding: 0;
  transition: background 0.2s ease;
  border-radius: 10px;
}
.column-btn:disabled { cursor: not-allowed; }
.column-btn:not(:disabled):hover { background: rgba(255,255,255,0.06); }

.ghost-disc {
  position: absolute;
  top: 2%;
  left: 50%;
  width: 76%;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 2.5px solid var(--ink);
  transform: translate(-50%, -12px);
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
}
.ghost-disc.visible { opacity: 0.6; transform: translate(-50%, 0); }
.ghost-red { background: var(--red); }
.ghost-yellow { background: var(--yellow); }

.cell { position: relative; width: 100%; height: 100%; }
.hole {
  position: absolute; inset: 0;
  border-radius: 50%;
  background: var(--hole);
  box-shadow: inset 0 3px 6px rgba(0,0,0,0.5);
}

/* ---------- discs (glossy planet/asteroid look) ---------- */
.disc { position: absolute; inset: 0; border-radius: 50%; z-index: 1; border: 2.5px solid var(--ink); }
.disc-shine {
  position: absolute; top: 12%; left: 18%; width: 34%; height: 26%;
  background: rgba(255,255,255,0.55);
  border-radius: 50%;
  filter: blur(1px);
}
.disc-red { background: radial-gradient(circle at 35% 30%, #ef7a6f, var(--red) 60%, var(--red-dark)); }
.disc-yellow { background: radial-gradient(circle at 35% 30%, #f3cf6e, var(--yellow) 60%, var(--yellow-dark)); }

.disc-falling {
  animation-name: dropFall;
  animation-duration: var(--fall-duration, 0.5s);
  animation-timing-function: cubic-bezier(.4,0,.9,.4);
  animation-fill-mode: backwards;
}
@keyframes dropFall {
  0% { transform: translateY(calc(-100% * var(--fall-rows) - 6%)); }
  68% { transform: translateY(0); }
  80% { transform: translateY(-9%); }
  90% { transform: translateY(0); }
  96% { transform: translateY(-3%); }
  100% { transform: translateY(0); }
}

.disc-winning {
  animation: winPulse 1s ease-in-out infinite;
  z-index: 4;
}
@keyframes winPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.14); box-shadow: 0 0 0 4px rgba(255,255,255,0.35); }
}

/* ---------- confetti ---------- */
.confetti-layer { position: fixed; inset: 0; pointer-events: none; z-index: 50; overflow: hidden; }
.confetti-piece {
  position: absolute;
  top: -5%;
  animation-name: confettiFall;
  animation-timing-function: cubic-bezier(.3,.6,.7,1);
  animation-fill-mode: forwards;
  border: 2px solid var(--ink);
}
@keyframes confettiFall {
  0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(105vh) translateX(var(--drift)) rotate(540deg); opacity: 0; }
}

/* ---------- bottom bar ---------- */
.bottom-bar {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 4px;
}
.bottom-btn {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--white);
  background: var(--green-dark);
  border: 2px solid rgba(255,255,255,0.25);
  padding: 11px 26px;
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 4px 0 rgba(0,0,0,0.25);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.bottom-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 0 rgba(0,0,0,0.25); }
.bottom-btn:active { transform: translateY(1px); box-shadow: 0 2px 0 rgba(0,0,0,0.25); }

/* ---------- welcome / settings modal ---------- */
.welcome-overlay {
  position: fixed; inset: 0;
  background: rgba(6, 8, 20, 0.85);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 200;
  padding: 20px;
  animation: overlayFade 0.3s ease;
}
.welcome-card {
  position: relative;
  width: 100%;
  max-width: 460px;
  border-radius: 22px;
  overflow: hidden;
  border: 3px solid rgba(168, 85, 247, 0.5);
  box-shadow: 0 0 0 1px rgba(168,85,247,0.2), 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(168,85,247,0.15);
  background: #15172e;
  animation: overlayPop 0.4s cubic-bezier(.2,.9,.3,1.3);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
}
.welcome-close {
  position: absolute;
  top: 10px; right: 12px;
  z-index: 5;
  width: 30px; height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.9);
  color: #1a1040;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.welcome-close:hover { background: var(--white); transform: scale(1.1); }

.welcome-banner {
  position: relative;
  padding: 30px 20px 38px;
  text-align: center;
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 30%, #4c1d95 60%, #1e1b4b 100%);
  overflow: hidden;
}
.welcome-banner-rays {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(196,136,255,0.25) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 60%, rgba(139,92,246,0.15) 0%, transparent 50%),
    repeating-linear-gradient(70deg, rgba(255,255,255,0.06) 0 18px, transparent 18px 60px);
  opacity: 0.8;
}
.welcome-banner-floor {
  position: relative;
  margin-top: 10px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 14px;
  height: 40px;
}

.c4-title {
  position: relative;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 42px;
  margin: 0;
  line-height: 1;
  letter-spacing: 0.01em;
}
.c4-title-2 { margin-top: 2px; }
.c4-title span {
  display: inline-block;
  -webkit-text-stroke: 2.5px var(--ink);
  text-shadow: 3px 3px 0 var(--ink);
}
.l-white { color: #ffffff; }
.l-red { color: var(--red); }
.l-yellow { color: var(--yellow); }
.l-blue { color: #3a6df0; }
.arrow-letter { position: relative; }
.mini-arrow {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  -webkit-text-stroke: 1.5px var(--ink);
}
.mini-arrow-up { top: -18px; color: var(--red); }
.mini-arrow-down { bottom: -16px; color: var(--yellow); }

.welcome-body {
  background: #1c1f3a;
  padding: 20px 24px 24px;
  overflow-y: auto;
}
.welcome-body p {
  margin: 0 0 10px;
  font-size: 13.5px;
  line-height: 1.45;
  color: rgba(255,255,255,0.92);
  font-weight: 500;
}

.welcome-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin: 16px 0 18px;
  padding-top: 12px;
  border-top: 2px dashed rgba(168,85,247,0.25);
}

.anim-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 13px;
  color: rgba(255,255,255,0.95);
  cursor: pointer;
}
.anim-toggle input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.checkbox-box {
  width: 20px; height: 20px;
  border-radius: 5px;
  border: 2.5px solid rgba(168,85,247,0.5);
  background: rgba(255,255,255,0.1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.anim-toggle input:checked + .checkbox-box { background: var(--purple); border-color: var(--purple); }
.anim-toggle input:checked + .checkbox-box::after {
  content: '\\2713';
  color: var(--white);
  font-size: 13px;
  font-weight: 800;
}
.anim-toggle input:focus-visible + .checkbox-box { outline: 2px solid var(--purple); outline-offset: 2px; }

.difficulty-control { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.control-title {
  font-weight: 800;
  font-size: 12.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255,255,255,0.85);
}
.difficulty-options { display: flex; gap: 16px; }
.difficulty-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 700;
  color: rgba(255,255,255,0.92);
  cursor: pointer;
}
.difficulty-option input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.radio-dot {
  width: 18px; height: 18px;
  border-radius: 50%;
  border: 2.5px solid rgba(168,85,247,0.5);
  background: rgba(255,255,255,0.1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s, background 0.2s;
}
.difficulty-option input:checked + .radio-dot { border-color: var(--purple); background: rgba(168,85,247,0.15); }
.difficulty-option input:checked + .radio-dot::after {
  content: '';
  width: 9px; height: 9px;
  border-radius: 50%;
  background: var(--purple);
}
.difficulty-option input:focus-visible + .radio-dot { outline: 2px solid var(--purple); outline-offset: 2px; }

.welcome-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; padding-bottom: 4px; }
.welcome-btn {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 13px 22px;
  border-radius: 14px;
  cursor: pointer;
  border: 3px solid rgba(255,255,255,0.15);
  color: var(--white);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  flex: 1 1 140px;
}
.btn-player { background: var(--green); box-shadow: 0 4px 0 var(--green-dark); }
.btn-computer { background: var(--purple); box-shadow: 0 4px 0 var(--purple-dark); }
.welcome-btn:hover { transform: translateY(-2px); }
.welcome-btn:active { transform: translateY(2px); box-shadow: none; }

/* ---------- win / draw overlay ---------- */
.overlay {
  position: fixed; inset: 0;
  background: rgba(6, 8, 20, 0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
  padding: 20px;
  animation: overlayFade 0.3s ease;
}
@keyframes overlayFade { from { opacity: 0; } to { opacity: 1; } }

.overlay-card {
  position: relative;
  border: var(--border-w-lg) solid var(--ink);
  border-radius: 28px;
  padding: 36px 30px;
  max-width: 380px;
  width: 100%;
  text-align: center;
  box-shadow: 0 14px 0 rgba(0,0,0,0.25), 0 24px 40px rgba(0,0,0,0.4);
  animation: overlayPop 0.4s cubic-bezier(.2,.9,.3,1.3);
  overflow: hidden;
}
.overlay-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(70deg, rgba(255,255,255,0.08) 0 16px, transparent 16px 52px);
  pointer-events: none;
}
.overlay-card::after {
  content: '';
  position: absolute;
  width: 130px; height: 130px;
  border-radius: 50%;
  background: rgba(255,255,255,0.12);
  top: -50px; right: -40px;
  pointer-events: none;
}
.overlay-card.win-red-result {
  background: radial-gradient(circle at 30% 20%, #f0958a 0%, var(--red) 45%, var(--red-dark) 100%);
}
.overlay-card.win-yellow-result {
  background: radial-gradient(circle at 30% 20%, #f6de92 0%, var(--yellow) 45%, var(--yellow-dark) 100%);
}
.overlay-card.draw-result {
  background: radial-gradient(circle at 30% 20%, #7fd6ec 0%, var(--cyan) 45%, var(--cyan-dark) 100%);
}
@keyframes overlayPop {
  0% { transform: scale(0.75) translateY(20px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

.overlay-icon {
  position: relative;
  color: var(--ink);
  margin: 0 auto 14px;
  width: 76px; height: 76px;
  display: flex; align-items: center; justify-content: center;
  background: var(--white);
  border: var(--border-w) solid var(--ink);
  border-radius: 50%;
  box-shadow: 0 4px 0 rgba(0,0,0,0.2);
}
.trophy-icon { animation: trophyBounce 1.3s ease-in-out infinite; }
@keyframes trophyBounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(-6deg); }
  50% { transform: translateY(0) rotate(0deg); }
  75% { transform: translateY(-5px) rotate(6deg); }
}
.draw-icon { animation: drawShake 1.2s ease-in-out infinite; }
@keyframes drawShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px) rotate(-3deg); }
  75% { transform: translateX(4px) rotate(3deg); }
}

.overlay-card h2 {
  position: relative;
  font-family: var(--font-display);
  font-size: 28px;
  margin: 0 0 8px;
  font-weight: 800;
  color: var(--ink);
  text-transform: uppercase;
}
.overlay-card p { position: relative; color: var(--ink); opacity: 0.75; margin: 0 0 22px; font-size: 13.5px; font-weight: 600; }
.win-red-result .text-red { color: var(--white); text-shadow: 2px 2px 0 var(--ink); }
.win-yellow-result .text-yellow { color: var(--red-dark); }

.overlay-actions { position: relative; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.primary-btn, .ghost-btn {
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 13.5px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 12px 24px;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border: var(--border-w) solid var(--ink);
}
.primary-btn {
  background: var(--cyan-dark);
  color: var(--white);
  box-shadow: 4px 4px 0 var(--ink);
}
.primary-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--ink); }
.primary-btn:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--ink); }
.ghost-btn {
  background: var(--white);
  color: var(--ink);
  box-shadow: 4px 4px 0 var(--ink);
}
.ghost-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--ink); }
.ghost-btn:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--ink); }

/* ---------- responsive ---------- */
@media (max-width: 640px) {
  .c4-shell { padding: 64px 12px 20px; }
  .c4-title { font-size: 30px; }
  .welcome-banner { padding: 20px 14px 24px; }
  .overlay-card { padding: 28px 20px; }
}

@media (prefers-reduced-motion: reduce) {
  .c4-app, .floating-particle, .disc-falling, .disc-winning,
  .trophy-icon, .draw-icon, .turn-dot.pulsing {
    animation: none !important;
    transition: none !important;
  }
}

.c4-app.no-anim *, .c4-app.no-anim {
  animation: none !important;
  transition: none !important;
}
`;