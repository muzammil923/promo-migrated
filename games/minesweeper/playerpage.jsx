import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";

const NUM_COLORS = {
  1: "#8ecdfb",
  2: "#7ee0b8",
  3: "#ff8fa3",
  4: "#c084fc",
  5: "#ffd166",
  6: "#6fe3d6",
  7: "#f4e9ff",
  8: "#b79ad1",
};

const DIFFICULTIES = [
  { key: "easy", label: "Easy", sub: "9×9, 10 mines", cols: 9, rows: 9, mines: 10, accent: "#34d399" },
  { key: "medium", label: "Medium", sub: "16×16, 40 mines", cols: 16, rows: 16, mines: 40, accent: "#60a5fa" },
  { key: "hard", label: "Hard", sub: "20×16, 70 mines", cols: 16, rows: 20, mines: 70, accent: "#fb7185" },
];

const BOARD_GAP = 3;
const BOARD_PAD = 8;

function makeEmptyGrid(rows, cols) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({ mine: false, revealed: false, flagged: false, adj: 0 });
    }
    grid.push(row);
  }
  return grid;
}

function deepCloneGrid(grid) {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

function placeMines(grid, rows, cols, mineCount, safeR, safeC) {
  let placed = 0;
  while (placed < mineCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (grid[r][c].mine) continue;
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    grid[r][c].mine = true;
    placed++;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr,
            nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].mine) count++;
        }
      }
      grid[r][c].adj = count;
    }
  }
  return grid;
}

function floodRevealMutate(grid, r, c, rows, cols) {
  const stack = [[r, c]];
  let revealed = 0;
  while (stack.length) {
    const [cr, cc] = stack.pop();
    const cell = grid[cr][cc];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    revealed++;
    if (cell.adj === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = cr + dr,
            nc = cc + dc;
          if (
            nr >= 0 &&
            nr < rows &&
            nc >= 0 &&
            nc < cols &&
            !grid[nr][nc].revealed &&
            !grid[nr][nc].mine
          ) {
            stack.push([nr, nc]);
          }
        }
      }
    }
  }
  return revealed;
}

function revealAllMines(grid) {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c].mine) grid[r][c].revealed = true;
    }
  }
}

function makeParticles() {
  const particles = [];
  const count = 12;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
    const dist = 26 + Math.random() * 30;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const size = 3 + Math.random() * 4;
    const duration = 500 + Math.random() * 200;
    particles.push({
      id: i,
      dx,
      dy,
      size,
      duration,
      color: Math.random() > 0.5 ? "#ff8c3d" : "#ffdd8a",
    });
  }
  return particles;
}

export default function MinesweeperVelvet() {
  const [screen, setScreen] = useState("menu"); // 'menu' | 'game'
  const [dims, setDims] = useState({ cols: 9, rows: 9, mines: 10 });
  const [grid, setGrid] = useState(() => makeEmptyGrid(9, 9));
  const [revealedCount, setRevealedCount] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [blast, setBlast] = useState(null); // { r, c, particles }
  const [showPopup, setShowPopup] = useState(false);

  // ---- responsive viewport tracking ----
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 390,
    h: typeof window !== "undefined" ? window.innerHeight : 800,
  }));
  const panelRef = useRef(null);
  const boardWrapRef = useRef(null);

  useEffect(() => {
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  // Lock mobile pinch/double-tap zoom while this game is mounted so taps on
  // tiny cells register as taps, not zoom gestures. Restores whatever the
  // host page had on unmount.
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    const created = !meta;
    const original = meta ? meta.getAttribute("content") : null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    );
    return () => {
      if (created) {
        meta.remove();
      } else if (original !== null) {
        meta.setAttribute("content", original);
      }
    };
  }, []);

  const firstClickRef = useRef(true);
  const timerRef = useRef(null);
  const soundRef = useRef(soundOn);
  const actxRef = useRef(null);
  const masterOutRef = useRef(null);
  const touchTimerRef = useRef(null);
  const touchMovedRef = useRef(false);
  const touchStartPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (gameOver) {
      const timer = setTimeout(() => setShowPopup(true), 850);
      return () => clearTimeout(timer);
    } else {
      setShowPopup(false);
    }
  }, [gameOver]);

  // ---- audio ----
  const ensureAudio = useCallback(() => {
    if (!actxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) actxRef.current = new AC();
      if (actxRef.current) {
        const actx = actxRef.current;
        const compressor = actx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-12, actx.currentTime);
        compressor.knee.setValueAtTime(18, actx.currentTime);
        compressor.ratio.setValueAtTime(6, actx.currentTime);
        compressor.attack.setValueAtTime(0.003, actx.currentTime);
        compressor.release.setValueAtTime(0.25, actx.currentTime);
        const masterGain = actx.createGain();
        masterGain.gain.setValueAtTime(1.6, actx.currentTime);
        masterGain.connect(compressor);
        compressor.connect(actx.destination);
        masterOutRef.current = masterGain;
      }
    }
    if (actxRef.current && actxRef.current.state === "suspended") actxRef.current.resume();
  }, []);

  const tone = useCallback((freq, dur, type, gainVal, delay) => {
    if (!soundRef.current || !actxRef.current) return;
    const actx = actxRef.current;
    const t0 = actx.currentTime + (delay || 0);
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(gainVal || 0.55, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(masterOutRef.current);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }, []);

  const playReveal = useCallback(() => tone(520, 0.09, "sine", 0.55), [tone]);
  const playFlag = useCallback(() => tone(660, 0.07, "square", 0.45), [tone]);

  const playExplosion = useCallback(() => {
    if (!soundRef.current || !actxRef.current) return;
    const actx = actxRef.current;
    const t0 = actx.currentTime;

    const thump = actx.createOscillator();
    const thumpGain = actx.createGain();
    thump.type = "sine";
    thump.frequency.setValueAtTime(160, t0);
    thump.frequency.exponentialRampToValueAtTime(35, t0 + 0.35);
    thumpGain.gain.setValueAtTime(1.3, t0);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
    thump.connect(thumpGain);
    thumpGain.connect(masterOutRef.current);
    thump.start(t0);
    thump.stop(t0 + 0.6);

    const bufferSize = actx.sampleRate * 0.6;
    const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.6);
    }
    const noise = actx.createBufferSource();
    noise.buffer = buffer;
    const filter = actx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, t0);
    filter.frequency.exponentialRampToValueAtTime(200, t0 + 0.5);
    const noiseGain = actx.createGain();
    noiseGain.gain.setValueAtTime(1.2, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterOutRef.current);
    noise.start(t0);

    const crackBuf = actx.createBuffer(1, actx.sampleRate * 0.05, actx.sampleRate);
    const crackData = crackBuf.getChannelData(0);
    for (let i = 0; i < crackData.length; i++) {
      crackData[i] = Math.random() * 2 - 1;
    }
    const crack = actx.createBufferSource();
    crack.buffer = crackBuf;
    const crackGain = actx.createGain();
    crackGain.gain.setValueAtTime(1.0, t0);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.06);
    crack.connect(crackGain);
    crackGain.connect(masterOutRef.current);
    crack.start(t0);
  }, []);

  const playWin = useCallback(() => {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, "triangle", 0.5, i * 0.11));
  }, [tone]);

  // Elegant bell/chime for picking a difficulty — a fundamental tone plus
  // two quiet overtones, routed through a short feedback delay so it trails
  // off with a soft echo, like a small jewelry-box bell.
  const playSelect = useCallback(() => {
    if (!soundRef.current || !actxRef.current) return;
    const actx = actxRef.current;
    const t0 = actx.currentTime;

    // short feedback delay for the echo tail
    const delay = actx.createDelay();
    delay.delayTime.setValueAtTime(0.17, t0);
    const feedback = actx.createGain();
    feedback.gain.setValueAtTime(0.3, t0);
    const delayWet = actx.createGain();
    delayWet.gain.setValueAtTime(0.35, t0);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(delayWet);
    delayWet.connect(masterOutRef.current);

    // bell tone: fundamental + two soft overtones
    const partials = [
      { freq: 880, gain: 0.42 },
      { freq: 1320, gain: 0.16 },
      { freq: 1760, gain: 0.08 },
    ];
    partials.forEach((p) => {
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(p.freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(p.gain, t0 + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      osc.connect(gain);
      gain.connect(masterOutRef.current);
      gain.connect(delay);
      osc.start(t0);
      osc.stop(t0 + 0.55);
    });
  }, []);

  const playToggle = useCallback(() => {
    tone(880, 0.05, "sine", 0.35);
  }, [tone]);

  const vibrate = useCallback((pattern) => {
    if (soundRef.current && navigator.vibrate) navigator.vibrate(pattern);
  }, []);

  // ---- visual blast effects ----
  const triggerBlastEffects = useCallback((r, c) => {
    setShake(true);
    setTimeout(() => setShake(false), 500);

    setFlash(true);
    setTimeout(() => setFlash(false), 550);

    setBlast({ r, c, particles: makeParticles() });
    setTimeout(() => setBlast(null), 750);
  }, []);

  // ---- game lifecycle ----
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const startGame = useCallback(
    (cols, rows, mines) => {
      ensureAudio();
      clearInterval(timerRef.current);
      setDims({ cols, rows, mines });
      setSeconds(0);
      setGameOver(false);
      setWon(false);
      setRevealedCount(0);
      setFlagCount(0);
      setBlast(null);
      setShake(false);
      setFlash(false);
      setShowPopup(false);
      firstClickRef.current = true;
      setGrid(makeEmptyGrid(rows, cols));
      setScreen("game");
    },
    [ensureAudio]
  );

  const onReveal = (r, c) => {
    if (gameOver) return;
    ensureAudio();
    const cell = grid[r][c];
    if (cell.flagged || cell.revealed) return;

    let workingGrid = grid;
    if (firstClickRef.current) {
      workingGrid = placeMines(deepCloneGrid(grid), dims.rows, dims.cols, dims.mines, r, c);
      firstClickRef.current = false;
      startTimer();
    }

    const clone = deepCloneGrid(workingGrid);
    const targetCell = clone[r][c];

    if (targetCell.mine) {
      targetCell.revealed = true;
      revealAllMines(clone);
      setGrid(clone);
      playExplosion();
      vibrate([100, 50, 100, 50, 150]);
      clearInterval(timerRef.current);
      setGameOver(true);
      setWon(false);
      triggerBlastEffects(r, c);
      return;
    }

    playReveal();
    vibrate(15);
    const revealedDelta = floodRevealMutate(clone, r, c, dims.rows, dims.cols);
    setGrid(clone);
    setRevealedCount((prev) => {
      const newCount = prev + revealedDelta;
      if (newCount === dims.rows * dims.cols - dims.mines) {
        playWin();
        vibrate([50, 40, 50, 40, 100]);
        clearInterval(timerRef.current);
        setGameOver(true);
        setWon(true);
      }
      return newCount;
    });
  };

  const onFlag = (r, c) => {
    if (gameOver) return;
    ensureAudio();
    const cell = grid[r][c];
    if (cell.revealed) return;
    const clone = deepCloneGrid(grid);
    clone[r][c].flagged = !clone[r][c].flagged;
    setGrid(clone);
    setFlagCount((prev) => prev + (clone[r][c].flagged ? 1 : -1));
    playFlag();
    vibrate(20);
  };

  // Long-press-to-flag for touch devices, with a small movement tolerance so
  // a scroll/drag gesture doesn't get misread as a flag.
  const handleTouchStart = (r, c, e) => {
    touchMovedRef.current = false;
    const t = e.touches && e.touches[0];
    touchStartPosRef.current = t ? { x: t.clientX, y: t.clientY } : { x: 0, y: 0 };
    touchTimerRef.current = setTimeout(() => {
      if (!touchMovedRef.current) {
        onFlag(r, c);
      }
      touchTimerRef.current = null;
    }, 450);
  };
  const handleTouchMove = (e) => {
    const t = e.touches && e.touches[0];
    if (!t) return;
    const dx = t.clientX - touchStartPosRef.current.x;
    const dy = t.clientY - touchStartPosRef.current.y;
    if (Math.hypot(dx, dy) > 10) {
      touchMovedRef.current = true;
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }
    }
  };
  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  const changeDifficulty = () => {
    clearInterval(timerRef.current);
    setScreen("menu");
  };

  const faceEmoji = gameOver ? (won ? "😎" : "💥") : "🙂";

  // ---- responsive cell sizing ----
  const isNarrow = viewport.w <= 480;
  const cellSize = useMemo(() => {
    const defaultMax = dims.cols > 12 ? (isNarrow ? 24 : 30) : isNarrow ? 30 : 38;
    const panelSidePadding = isNarrow ? 16 : 24;
    const panelMaxWidth = Math.min(viewport.w - (isNarrow ? 16 : 32), 460);
    const availWidth =
      panelMaxWidth - panelSidePadding * 2 - BOARD_PAD * 2 - (dims.cols - 1) * BOARD_GAP;
    const widthBased = Math.floor(availWidth / dims.cols);

    const reservedVertical = isNarrow ? 190 : 210;
    const availHeight = viewport.h - reservedVertical;
    const heightBased = Math.floor(
      (availHeight - BOARD_PAD * 2 - (dims.rows - 1) * BOARD_GAP) / dims.rows
    );

    const size = Math.min(defaultMax, widthBased, heightBased);
    return Math.max(14, size);
  }, [viewport, dims, isNarrow]);

  const minesLeft = dims.mines - flagCount;

  return (
    <div className="ms-body">
      <style>{CSS}</style>

      <div className={`ms-flash-overlay ${flash ? "play" : ""}`} />

      <div className={`ms-panel ${shake ? "shake" : ""}`} ref={panelRef}>
        {screen === "menu" && (
          <div className="ms-menu">
            <div>Choose a difficulty</div>
            <div className="ms-menu-buttons">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.key}
                  className="ms-diff"
                  style={{ "--diff-accent": d.accent }}
                  onClick={() => {
                    ensureAudio();
                    playSelect();
                    vibrate(15);
                    startGame(d.cols, d.rows, d.mines);
                  }}
                >
                  {d.label}
                  <span>{d.sub}</span>
                </button>
              ))}
            </div>
            <label className="ms-sound-label">
              <input
                type="checkbox"
                checked={soundOn}
                onChange={(e) => {
                  const next = e.target.checked;
                  ensureAudio();
                  setSoundOn(next);
                  if (next) {
                    soundRef.current = true;
                    playToggle();
                  }
                }}
              />
              Sound &amp; vibration
            </label>
          </div>
        )}

        {screen === "game" && (
          <div className="ms-game-wrap" style={{ display: "flex" }}>
            <div className="ms-hud">
              <div>
                🚩 <span>{minesLeft}</span>
              </div>
              <button className="ms-face" onClick={() => startGame(dims.cols, dims.rows, dims.mines)}>
                {faceEmoji}
              </button>
              <div>
                ⏱️ <span>{seconds}</span>
              </div>
            </div>

            <div className="ms-board-scroll" ref={boardWrapRef}>
              <div
                className="ms-board"
                style={{ gridTemplateColumns: `repeat(${dims.cols}, ${cellSize}px)` }}
              >
                {grid.map((row, r) =>
                  row.map((cell, c) => {
                    const isBlast = blast && blast.r === r && blast.c === c;
                    const style = {
                      width: cellSize,
                      height: cellSize,
                      fontSize: cellSize * 0.5,
                    };
                    let content = null;
                    const cellClass = ["ms-cell"];
                    if (cell.revealed) {
                      cellClass.push("ms-cell-open");
                      if (cell.mine) {
                        cellClass.push("ms-cell-mine");
                        content = "💣";
                      } else if (cell.adj > 0) {
                        content = cell.adj;
                        style.color = NUM_COLORS[cell.adj] || "var(--text-primary)";
                      }
                    } else {
                      cellClass.push("ms-cell-closed");
                      if (cell.flagged) content = "🚩";
                    }
                    if (isBlast) cellClass.push("blast-cell");

                    return (
                      <div
                        key={`${r}-${c}`}
                        className={cellClass.join(" ")}
                        style={style}
                        onClick={() => onReveal(r, c)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          onFlag(r, c);
                        }}
                        onTouchStart={(e) => handleTouchStart(r, c, e)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      >
                        {content}
                        {isBlast && (
                          <>
                            <div className="blast-ring" />
                            <div className="blast-core" />
                            {blast.particles.map((p) => (
                              <div
                                key={p.id}
                                className="blast-particle"
                                style={{
                                  width: p.size,
                                  height: p.size,
                                  background: p.color,
                                  "--dx": `${p.dx}px`,
                                  "--dy": `${p.dy}px`,
                                  animation: `particleMove ${p.duration}ms cubic-bezier(0.2,0.7,0.3,1) forwards`,
                                }}
                              />
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="ms-status">
              {gameOver ? (won ? "You cleared the board!" : "Boom — game over.") : ""}
            </div>
            <button className="ms-change-diff" onClick={changeDifficulty}>
              Change difficulty
            </button>

            {showPopup && (
              <div className="ms-popup-overlay">
                <div className="ms-popup">
                  <div className="ms-popup-emoji">{won ? "🏆" : "💀"}</div>
                  <div className="ms-popup-title">{won ? "You Win!" : "Game Over"}</div>
                  <div className="ms-popup-sub">
                    {won ? "Congratulations, you cleared the board!" : "Better luck next time!"}
                  </div>
                  <div className="ms-popup-buttons">
                    <button
                      className="ms-popup-btn ms-popup-btn-home"
                      onClick={changeDifficulty}
                    >
                      🏠 Home
                    </button>
                    <button
                      className="ms-popup-btn ms-popup-btn-retry"
                      onClick={() => startGame(dims.cols, dims.rows, dims.mines)}
                    >
                      🔄 Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Poppins:wght@500;600;700&display=swap');

.ms-body {
  --bg-deep: #0e0318;
  --bg-mid: #2a0a45;
  --velvet-1: #4a1470;
  --velvet-2: #2c0a4a;
  --velvet-3: #1b0630;
  --gold: #ffd166;
  --gold-deep: #c9932e;
  --gold-soft: rgba(255, 209, 102, 0.30);
  --accent-soft: rgba(192, 132, 252, 0.30);
  --text-primary: #f6ecff;
  --text-muted: #b79ad1;
  --cell-face: #3a1560;
  --cell-face-hi: #4d1f7e;
  --cell-open: #22093c;

  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse 800px 500px at 15% -5%, rgba(255,209,102,0.10), transparent 60%),
    radial-gradient(ellipse 900px 650px at 105% 105%, rgba(192,132,252,0.20), transparent 60%),
    linear-gradient(160deg, var(--bg-mid), var(--bg-deep) 60%);
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  padding: 20px;
  padding-left: max(20px, env(safe-area-inset-left));
  padding-right: max(20px, env(safe-area-inset-right));
  padding-top: max(20px, env(safe-area-inset-top));
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  box-sizing: border-box;
  color: var(--text-primary);
  overscroll-behavior: contain;
}

.ms-body * { box-sizing: border-box; }

.ms-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 2rem 0 1.5rem;
  background:
    radial-gradient(ellipse 340px 160px at 28% 0%, rgba(255,255,255,0.10), transparent 55%),
    linear-gradient(150deg, var(--velvet-1) 0%, var(--velvet-2) 48%, var(--velvet-3) 100%);
  border-radius: 26px;
  width: 100%;
  max-width: min(460px, 96vw);
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.5),
    0 0 0 3px rgba(255,209,102,0.22),
    0 30px 70px -20px rgba(10, 0, 25, 0.85),
    inset 0 1px 0 rgba(255,255,255,0.08),
    0 0 50px -14px var(--accent-soft);
}

.ms-panel::before {
  content: '';
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #fff2cf, var(--gold) 45%, var(--gold-deep));
  box-shadow: 0 0 0 3px var(--velvet-3), 0 0 18px rgba(255,209,102,0.65);
  border-radius: 4px;
}
.ms-panel::after {
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(255, 209, 102, 0.14);
  border-radius: 20px;
  pointer-events: none;
}

.ms-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 0.6rem 1.2rem 1rem;
  width: 100%;
}
.ms-menu > div:first-child {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Playfair Display', serif;
  font-size: clamp(17px, 5vw, 21px);
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--text-primary);
  text-align: center;
}
.ms-menu > div:first-child::before,
.ms-menu > div:first-child::after {
  content: '';
  width: 26px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-soft));
  flex-shrink: 0;
}
.ms-menu > div:first-child::after { background: linear-gradient(270deg, transparent, var(--gold-soft)); }

.ms-menu-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

.ms-diff {
  position: relative;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  padding: 13px 18px 11px;
  border-radius: 14px;
  border: 1px solid rgba(255,209,102,0.2);
  background:
    radial-gradient(ellipse 60px 30px at 30% 0%, rgba(255,255,255,0.16), transparent 60%),
    linear-gradient(160deg, rgba(255,255,255,0.06), rgba(0,0,0,0.12));
  cursor: pointer;
  font-weight: 600;
  color: var(--text-primary);
  box-shadow: 0 0 0 1px var(--diff-accent, rgba(52,211,153,0.35)) inset, 0 6px 16px -8px var(--diff-accent, rgba(52,211,153,0.4));
  transition: border-color 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  flex: 1 1 130px;
  min-width: 118px;
  max-width: 160px;
}
.ms-diff::before {
  content: '◆';
  display: block;
  font-size: 11px;
  margin-bottom: 3px;
  color: var(--diff-accent, #34d399);
}
.ms-diff:hover {
  border-color: var(--gold-soft);
  transform: translateY(-2px);
}
.ms-diff:active { transform: translateY(0) scale(0.98); }
.ms-diff span {
  display: block;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
  letter-spacing: 0.02em;
}

.ms-sound-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
  letter-spacing: 0.02em;
}
.ms-sound-label input {
  accent-color: var(--gold);
  width: 16px;
  height: 16px;
}

.ms-game-wrap {
  position: relative;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 0 1.2rem 1.2rem;
  width: 100%;
  box-sizing: border-box;
}

.ms-hud {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 360px;
  align-items: center;
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.ms-hud > div {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(160deg, rgba(255,255,255,0.06), rgba(0,0,0,0.15));
  border: 1px solid rgba(255,209,102,0.22);
  padding: 6px 12px;
  border-radius: 999px;
  white-space: nowrap;
}
.ms-hud span {
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: var(--gold);
  letter-spacing: 0.02em;
  text-shadow: 0 0 14px var(--gold-soft);
}

.ms-face {
  font-size: 20px;
  line-height: 1;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255,209,102,0.3);
  background:
    radial-gradient(ellipse 20px 12px at 30% 20%, rgba(255,255,255,0.35), transparent 60%),
    linear-gradient(160deg, #6a2a9e, #3d1160);
  cursor: pointer;
  box-shadow: 0 4px 12px -4px rgba(0,0,0,0.5);
  transition: transform 0.12s ease, border-color 0.18s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.ms-face:hover { border-color: var(--gold); transform: scale(1.06); }
.ms-face:active { transform: scale(0.94); }

.ms-board-scroll {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding-bottom: 2px;
}

.ms-board {
  display: grid;
  gap: 3px;
  background: rgba(0,0,0,0.28);
  padding: 8px;
  border-radius: 16px;
  border: 1px solid rgba(255,209,102,0.16);
  box-shadow: inset 0 2px 12px rgba(0,0,0,0.5);
  width: max-content;
  margin: 0 auto;
  touch-action: manipulation;
}

.ms-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  touch-action: manipulation;
}
.ms-cell-closed {
  background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.14), transparent 55%), linear-gradient(160deg, var(--cell-face-hi), var(--cell-face));
  box-shadow: inset 1px 1px 0 rgba(255,255,255,0.08), inset -1px -1px 0 rgba(0,0,0,0.4), 0 0 0 1px rgba(255,209,102,0.06);
}
.ms-cell-open {
  background: var(--cell-open);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
}
.ms-cell-mine {
  background: linear-gradient(160deg, #4a1030, #2a0a1c) !important;
  box-shadow: inset 0 0 0 1px rgba(255,77,109,0.55), 0 0 16px rgba(255,77,109,0.4) !important;
}

.ms-status {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  min-height: 18px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.ms-change-diff {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255,209,102,0.2);
  background: rgba(255,255,255,0.04);
  cursor: pointer;
  color: var(--text-muted);
  letter-spacing: 0.03em;
  transition: color 0.15s ease, border-color 0.15s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.ms-change-diff:hover { color: var(--text-primary); border-color: var(--gold-soft); }
.ms-change-diff:active { transform: scale(0.97); }

/* ---- blast effects ---- */
@keyframes ms-shake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-6px, -3px); }
  20% { transform: translate(6px, 3px); }
  30% { transform: translate(-5px, 3px); }
  40% { transform: translate(5px, -3px); }
  50% { transform: translate(-4px, 2px); }
  60% { transform: translate(4px, -2px); }
  70% { transform: translate(-3px, 1px); }
  80% { transform: translate(3px, -1px); }
  90% { transform: translate(-1px, 1px); }
}
.ms-panel.shake { animation: ms-shake 0.45s ease; }

@keyframes ms-flashScreen {
  0% { opacity: 0.85; }
  100% { opacity: 0; }
}
.ms-flash-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,190,120,0.6) 40%, rgba(0,0,0,0) 75%);
  pointer-events: none;
  opacity: 0;
  z-index: 9999;
}
.ms-flash-overlay.play { animation: ms-flashScreen 0.5s ease-out forwards; }

.blast-cell { overflow: visible !important; }

@keyframes ringExpand {
  0% { transform: translate(-50%, -50%) scale(0.2); opacity: 1; border-width: 6px; }
  100% { transform: translate(-50%, -50%) scale(3.2); opacity: 0; border-width: 1px; }
}
.blast-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 6px solid #ff7a3d;
  box-sizing: border-box;
  pointer-events: none;
  animation: ringExpand 0.5s ease-out forwards;
}

@keyframes coreFlash {
  0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
  35% { transform: translate(-50%, -50%) scale(1.6); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
}
.blast-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 90%;
  height: 90%;
  border-radius: 50%;
  background: radial-gradient(circle, #fff7e6 0%, #ffcf6b 30%, #ff7a3d 60%, rgba(255,80,20,0) 100%);
  pointer-events: none;
  animation: coreFlash 0.35s ease-out forwards;
  z-index: 2;
}

@keyframes particleMove {
  0% { transform: translate(-50%, -50%) translate(0, 0); opacity: 1; }
  100% { transform: translate(-50%, -50%) translate(var(--dx), var(--dy)); opacity: 0; }
}
.blast-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  pointer-events: none;
  z-index: 3;
}

/* ---- mobile responsive breakpoints ---- */
@media (max-width: 480px) {
  .ms-body { padding: 12px; }
  .ms-panel {
    padding: 1.5rem 0 1.1rem;
    border-radius: 20px;
    gap: 10px;
  }
  .ms-menu { padding: 0.4rem 0.8rem 0.8rem; gap: 12px; }
  .ms-game-wrap { padding: 0 0.7rem 0.9rem; gap: 10px; }
  .ms-diff { padding: 11px 12px 9px; font-size: 13px; min-width: 96px; }
  .ms-diff span { font-size: 10px; }
  .ms-hud { font-size: 10px; max-width: 100%; }
  .ms-hud > div { padding: 5px 10px; }
  .ms-hud span { font-size: 13px; }
  .ms-face { font-size: 18px; padding: 7px 10px; }
  .ms-status { font-size: 11px; }
  .ms-change-diff { font-size: 11px; padding: 7px 14px; }
}

@media (max-width: 360px) {
  .ms-diff { flex: 1 1 100%; max-width: none; }
}

@media (max-height: 700px) and (orientation: portrait) {
  .ms-panel { padding-top: 1rem; }
}

@media (orientation: landscape) and (max-height: 480px) {
  .ms-body { padding: 8px; align-items: flex-start; }
  .ms-panel { padding: 0.9rem 0 0.8rem; }
  .ms-menu { padding: 0.2rem 0.6rem 0.6rem; gap: 8px; }
  .ms-game-wrap { padding: 0 0.6rem 0.6rem; gap: 8px; }
}

@media (hover: none) {
  .ms-diff:hover, .ms-face:hover, .ms-change-diff:hover { border-color: inherit; }
}

/* ---- game-over popup ---- */
@keyframes ms-popupFadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes ms-popupScaleIn {
  0% { transform: scale(0.7); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.ms-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: ms-popupFadeIn 0.3s ease forwards;
  padding: 20px;
}
.ms-popup {
  background:
    radial-gradient(ellipse 340px 160px at 28% 0%, rgba(255,255,255,0.10), transparent 55%),
    linear-gradient(150deg, var(--velvet-1) 0%, var(--velvet-2) 48%, var(--velvet-3) 100%);
  border-radius: 22px;
  padding: 2rem 1.8rem;
  max-width: 340px;
  width: 100%;
  text-align: center;
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.5),
    0 0 0 3px rgba(255,209,102,0.22),
    0 30px 70px -20px rgba(10, 0, 25, 0.85),
    0 0 60px -14px var(--accent-soft);
  animation: ms-popupScaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
.ms-popup-emoji {
  font-size: 48px;
  margin-bottom: 10px;
  line-height: 1.1;
}
.ms-popup-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(22px, 6vw, 28px);
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 6px;
  letter-spacing: 0.01em;
}
.ms-popup-sub {
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 1.4rem;
  letter-spacing: 0.02em;
}
.ms-popup-buttons {
  display: flex;
  gap: 10px;
}
.ms-popup-btn {
  flex: 1;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255,209,102,0.22);
  cursor: pointer;
  color: var(--text-primary);
  letter-spacing: 0.02em;
  transition: transform 0.12s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.ms-popup-btn-home {
  background:
    radial-gradient(ellipse 40px 20px at 30% 0%, rgba(255,255,255,0.12), transparent 60%),
    linear-gradient(160deg, rgba(255,255,255,0.06), rgba(0,0,0,0.12));
}
.ms-popup-btn-retry {
  background:
    radial-gradient(ellipse 40px 20px at 30% 0%, rgba(255,255,255,0.18), transparent 60%),
    linear-gradient(160deg, rgba(255,180,60,0.15), rgba(255,120,40,0.08));
  border-color: rgba(255,209,102,0.4);
  box-shadow: 0 0 0 1px rgba(255,209,102,0.3) inset, 0 6px 16px -8px rgba(255,209,102,0.35);
}
.ms-popup-btn:hover {
  transform: translateY(-2px);
  border-color: var(--gold-soft);
}
.ms-popup-btn:active {
  transform: translateY(0) scale(0.97);
}
.ms-popup-btn-retry:hover {
  box-shadow: 0 0 0 1px rgba(255,209,102,0.5) inset, 0 8px 20px -8px rgba(255,209,102,0.5);
}

@media (max-width: 480px) {
  .ms-popup { padding: 1.6rem 1.4rem; border-radius: 18px; max-width: 300px; }
  .ms-popup-emoji { font-size: 40px; }
  .ms-popup-title { font-size: clamp(20px, 5vw, 24px); }
  .ms-popup-sub { font-size: 12px; margin-bottom: 1.2rem; }
  .ms-popup-btn { font-size: 13px; padding: 11px 12px; border-radius: 12px; }
}
`;
