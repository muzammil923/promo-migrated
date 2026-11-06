import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { io } from "socket.io-client";

/* ============================================================================
   FANTASY JUNGLE ADVENTURE — SNAKE & LADDER
   Premium single-file React implementation.
   ============================================================================ */

const GRID = 10;
const VB = 500;
const TILE = VB / GRID;

const LADDERS = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };
const SNAKES = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };

const LOADING_LINES = [
  "Waking the jungle spirits…",
  "Carving the temple board…",
  "Untangling the vines…",
  "Charming the serpents…",
  "Polishing the dice…",
];

const PLAYERS_BASE = [
  { id: 0, name: "Ruby Raider", core: "#ff6b6b", edge: "#8b1e1e", ring: "#ffd166" },
  { id: 1, name: "Emerald Scout", core: "#5ce1a8", edge: "#0f5c3f", ring: "#ffe066" },
];

function tileRowCol(num) {
  const row = GRID - 1 - Math.floor((num - 1) / GRID); // row 0 = bottom = tiles 1-10
  const posInRow = (num - 1) % GRID;
  const mathRow = Math.floor((num - 1) / GRID);
  const col = mathRow % 2 === 0 ? posInRow : GRID - 1 - posInRow;
  return { row, col };
}
function tileCenter(num) {
  const { row, col } = tileRowCol(num);
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}
function centerlinePoint(t, x1, y1, x2, y2, amp, waves) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const bx = x1 + dx * t;
  const by = y1 + dy * t;
  const wobble = Math.sin(t * Math.PI * waves) * amp * Math.sin(Math.PI * t);
  return { x: bx + nx * wobble, y: by + ny * wobble };
}

function buildSnake(x1, y1, x2, y2, amp = 15, waves = 2.4, samples = 34) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    pts.push(centerlinePoint(i / samples, x1, y1, x2, y2, amp, waves));
  }
  const left = [];
  const right = [];
  const headW = 12.5;
  const tailW = 1.5;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(samples, i + 1)];
    let tx = next.x - prev.x, ty = next.y - prev.y;
    const tl = Math.sqrt(tx * tx + ty * ty) || 1;
    tx /= tl; ty /= tl;
    const nx = -ty, ny = tx;
    const w = headW + (tailW - headW) * Math.pow(t, 1.35);
    const p = pts[i];
    left.push({ x: p.x + nx * (w / 2), y: p.y + ny * (w / 2) });
    right.push({ x: p.x - nx * (w / 2), y: p.y - ny * (w / 2) });
  }
  let d = `M ${left[0].x.toFixed(1)} ${left[0].y.toFixed(1)} `;
  for (let i = 1; i < left.length; i++) d += `L ${left[i].x.toFixed(1)} ${left[i].y.toFixed(1)} `;
  for (let i = right.length - 1; i >= 0; i--) d += `L ${right[i].x.toFixed(1)} ${right[i].y.toFixed(1)} `;
  d += "Z";
  let centerD = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} `;
  for (let i = 1; i < pts.length; i++) centerD += `L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} `;
  const headTangentPt = pts[1];
  const headDir = Math.atan2(pts[0].y - headTangentPt.y, pts[0].x - headTangentPt.x);
  const scalePts = [];
  for (let i = 3; i < samples - 2; i += 3) {
    const p = pts[i];
    const prev = pts[i - 1], next = pts[i + 1];
    const ang = Math.atan2(next.y - prev.y, next.x - prev.x);
    const t = i / samples;
    const w = headW + (tailW - headW) * Math.pow(t, 1.35);
    scalePts.push({ x: p.x, y: p.y, ang, w });
  }
  return { bodyPath: d, centerPath: centerD, head: pts[0], headDir, tail: pts[samples], scalePts };
}

function useSounds() {
  const ctxRef = useRef(null);
  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctxRef.current) { try { ctxRef.current = new AC(); } catch (e) { return null; } }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, []);
  const vibrate = useCallback((pattern) => {
    try { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
  }, []);
  const tone = useCallback((freq, start, dur, type = "sine", peak = 0.16) => {
    const ctx = getCtx(); if (!ctx) return;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination); osc.start(t0); osc.stop(t0 + dur + 0.03);
  }, [getCtx]);
  const slide = useCallback((freqFrom, freqTo, start, dur, type = "sawtooth", peak = 0.14) => {
    const ctx = getCtx(); if (!ctx) return;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freqFrom, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqTo, 20), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination); osc.start(t0); osc.stop(t0 + dur + 0.03);
  }, [getCtx]);
  const noiseBurst = useCallback((start, dur, peak = 0.12, freq = 1200) => {
    const ctx = getCtx(); if (!ctx) return;
    const t0 = ctx.currentTime + start;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ctx.createBufferSource(); src.buffer = buffer;
    const filter = ctx.createBiquadFilter(); filter.type = "bandpass"; filter.frequency.value = freq;
    const gain = ctx.createGain(); gain.gain.setValueAtTime(peak, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter).connect(gain).connect(ctx.destination); src.start(t0);
  }, [getCtx]);
  return useMemo(() => ({
    click: () => { tone(880, 0, 0.06, "square", 0.1); vibrate(10); },
    roll: () => { for (let i = 0; i < 6; i++) noiseBurst(i * 0.085, 0.06, 0.09, 900 + i * 60); vibrate([10, 25, 10, 25, 10, 25]); },
    move: () => { tone(540, 0, 0.07, "triangle", 0.13); vibrate(8); },
    ladder: () => { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.18, "sine", 0.15)); vibrate([20, 40, 20, 60]); },
    snake: () => { slide(480, 130, 0, 0.5, "sawtooth", 0.15); tone(90, 0.05, 0.35, "square", 0.06); vibrate([60, 40, 60, 40, 100]); },
    victory: () => { [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, i * 0.13, 0.32, "triangle", 0.17)); vibrate([30, 60, 30, 60, 30, 60, 220]); },
  }), [tone, slide, noiseBurst, vibrate]);
}

function useParticles(count, seedOffset = 0) {
  return useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i + seedOffset, left: Math.random() * 100, top: 40 + Math.random() * 60,
    delay: Math.random() * 8, dur: 6 + Math.random() * 8, size: 2 + Math.random() * 3,
  })), [count, seedOffset]);
}

const PIPS = {
  1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
};

function Die({ value, rolling }) {
  return (
    <div className={`sl-die ${rolling ? "sl-die-rolling" : "sl-die-settled"}`}>
      <div className="sl-die-face">
        {PIPS[value].map(([x, y], i) => (
          <span key={i} className="sl-pip" style={{ left: `${x}%`, top: `${y}%` }} />
        ))}
      </div>
    </div>
  );
}

export default function SnakeAndLadderPlayerPage({ gameData, sessionToken, onComplete }) {
  const [screen, setScreen] = useState("home");
  const [bgmOn, setBgmOn] = useState(true);
  const bgmRef = useRef(null);
  const [mode, setMode] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingLine, setLoadingLine] = useState(0);
  const [players, setPlayers] = useState(() => PLAYERS_BASE.map((p) => ({ ...p, position: 0 })));
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [hopTick, setHopTick] = useState(0);
  const [special, setSpecial] = useState(null);
  const [shake, setShake] = useState(false);
  const [sparkleAt, setSparkleAt] = useState(null);
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState("Ruby Raider's turn — roll the dice!");
  const [zoom, setZoom] = useState(false);
  const playersRef = useRef(players);
  const currentRef = useRef(currentPlayer);
  const sounds = useSounds();
  const fireflies = useParticles(14, 0);
  const dust = useParticles(20, 100);
  const leaves = useParticles(8, 200);

  // ── Online multiplayer state ──────────────────────────────────────
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [myPlayerIndex, setMyPlayerIndex] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [pendingRoll, setPendingRoll] = useState(false);
  const socketRef = useRef(null);

  // Connect socket for online mode
  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) return socketRef.current;
    // In dev, vite proxy handles /socket.io → localhost:8080
    // In production, socket.io is on the same origin
    const s = io(window.location.origin, { transports: ["websocket", "polling"] });
    socketRef.current = s;
    s.on("connect", () => setIsConnected(true));
    s.on("disconnect", () => setIsConnected(false));
    return s;
  }, []);

  // Socket event handlers for online mode
  useEffect(() => {
    const s = socketRef.current;
    if (!s || mode !== "online") return;

    s.on("sl:opponent-joined", ({ opponentName: oppName, playerNames }) => {
      setOpponentName(oppName);
      setWaitingForOpponent(false);
      // Set up player names
      const named = PLAYERS_BASE.map((p, i) => ({
        ...p, position: 0, name: playerNames[i] || p.name,
      }));
      playersRef.current = named; setPlayers(named);
      // Trigger loading then game
      setLoadingProgress(0); setLoadingLine(0); setScreen("loading");
    });

    s.on("sl:opponent-left", () => {
      setOpponentLeft(true);
      setMessage("Opponent disconnected!");
    });

    s.on("sl:dice-rolled", ({ diceValue: dv, rolledBy, playerName: rollerName }) => {
      // Animate dice on both clients
      setIsRolling(true);
      sounds.roll();
      let ticks = 0;
      const iv = setInterval(() => {
        setDiceValue(1 + Math.floor(Math.random() * 6)); ticks++;
        if (ticks >= 14) {
          clearInterval(iv);
          setDiceValue(dv); setIsRolling(false);
          setCurrentPlayer(rolledBy);
          // Both players see the move animation; only the roller's finishMove sends to server
          setTimeout(() => beginMove(dv, rolledBy), 220);
        }
      }, 75);
    });

    s.on("sl:turn-change", ({ currentTurn, currentPlayerName: cpn, players: serverPlayers }) => {
      setCurrentPlayer(currentTurn);
      // Sync positions from server
      const updated = [...playersRef.current];
      serverPlayers.forEach((sp, i) => { if (updated[i]) updated[i].position = sp.position; });
      playersRef.current = updated; syncPlayers();
      setMessage(`${cpn}'s turn — roll the dice!`);
    });

    s.on("sl:game-over", ({ winnerIndex, winnerName: wn }) => {
      sounds.victory(); setWinner(winnerIndex);
      setMessage(`${wn} reached the golden temple and won!`);
    });

    return () => {
      s.off("sl:opponent-joined");
      s.off("sl:opponent-left");
      s.off("sl:dice-rolled");
      s.off("sl:turn-change");
      s.off("sl:game-over");
    };
  }, [mode, myPlayerIndex, sounds]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => { socketRef.current?.disconnect(); socketRef.current = null; };
  }, []);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { currentRef.current = currentPlayer; }, [currentPlayer]);
  const syncPlayers = () => setPlayers([...playersRef.current]);

  // Background music
  useEffect(() => {
    const audio = bgmRef.current;
    if (!audio) return;
    if (bgmOn && (screen === "game" || screen === "loading")) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [bgmOn, screen]);
  useEffect(() => {
    const audio = bgmRef.current;
    if (!audio) return;
    audio.volume = 0.3;
    return () => { audio.pause(); audio.currentTime = 0; };
  }, []);

  const goToModeSelect = () => setScreen("mode");
  const backToHome = () => setScreen("home");

  const chooseMode = (m) => {
    if (m === "online") {
      setMode("online"); setScreen("lobby");
      connectSocket();
      return;
    }
    const named = PLAYERS_BASE.map((p, i) => ({
      ...p, position: 0, name: i === 1 && m === "bot" ? "Jungle Bot" : p.name,
    }));
    playersRef.current = named; setPlayers(named); setCurrentPlayer(0);
    setDiceValue(1); setWinner(null); setSpecial(null); setSparkleAt(null);
    setMessage(`${named[0].name}'s turn — roll the dice!`);
    setMode(m); setLoadingProgress(0); setLoadingLine(0); setScreen("loading");
  };

  // ── Online lobby actions ──────────────────────────────────────────
  const createOnlineRoom = () => {
    const s = socketRef.current;
    if (!s) return;
    const name = playerName.trim() || "Player 1";
    setMyPlayerIndex(0);
    s.emit("sl:create-room", { playerName: name }, ({ roomId }) => {
      setRoomCode(roomId);
      setWaitingForOpponent(true);
      setMessage(`Room created! Share code: ${roomId}`);
    });
  };

  const joinOnlineRoom = () => {
    const s = socketRef.current;
    if (!s || !joinCode.trim()) return;
    const name = playerName.trim() || "Player 2";
    setMyPlayerIndex(1);
    s.emit("sl:join-room", { roomId: joinCode.trim(), playerName: name }, (resp) => {
      if (resp?.error) { setMessage(resp.error); return; }
      setRoomCode(resp.roomId);
      setOpponentName(resp.playerNames?.[0] || "Player 1");
      // Set player names
      const named = PLAYERS_BASE.map((p, i) => ({
        ...p, position: 0, name: resp.playerNames?.[i] || p.name,
      }));
      playersRef.current = named; setPlayers(named);
      setCurrentPlayer(0);
      setLoadingProgress(0); setLoadingLine(0); setScreen("loading");
    });
  };

  useEffect(() => {
    if (screen !== "loading") return;
    setLoadingProgress(0);
    const start = Date.now(); const totalMs = 1600;
    const iv = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / totalMs) * 100));
      setLoadingProgress(pct);
      setLoadingLine(Math.min(LOADING_LINES.length - 1, Math.floor((pct / 100) * LOADING_LINES.length)));
      if (pct >= 100) { clearInterval(iv); setTimeout(() => setScreen("game"), 260); }
    }, 60);
    return () => clearInterval(iv);
  }, [screen]);

  useEffect(() => {
    if (screen !== "game" || mode !== "bot" || currentPlayer !== 1) return;
    if (isRolling || isMoving || winner !== null) return;
    const t = setTimeout(() => rollDice(), 900);
    return () => clearTimeout(t);
  }, [screen, mode, currentPlayer, isRolling, isMoving, winner]);

  const setPos = (idx, pos) => {
    playersRef.current[idx] = { ...playersRef.current[idx], position: pos };
    syncPlayers();
  };

  const rollDice = () => {
    if (isRolling || isMoving || winner !== null) return;
    // Online mode: ask server for dice
    if (mode === "online") {
      const s = socketRef.current;
      if (!s || !s.connected) return;
      if (currentRef.current !== myPlayerIndex) return; // not my turn
      sounds.click();
      setPendingRoll(true);
      s.emit("sl:roll-dice", null, (resp) => {
        setPendingRoll(false);
        if (resp?.error) { setMessage(resp.error); return; }
        // dice animation is handled by sl:dice-rolled event
      });
      return;
    }
    sounds.click(); setIsRolling(true); sounds.roll();
    let ticks = 0;
    const iv = setInterval(() => {
      setDiceValue(1 + Math.floor(Math.random() * 6)); ticks++;
      if (ticks >= 14) {
        clearInterval(iv);
        const final = 1 + Math.floor(Math.random() * 6);
        setDiceValue(final); setIsRolling(false);
        setTimeout(() => beginMove(final, currentRef.current), 220);
      }
    }, 75);
  };

  const beginMove = (steps, overrideIdx) => {
    const idx = overrideIdx !== undefined ? overrideIdx : currentRef.current;
    const player = playersRef.current[idx];
    let target = player.position + steps;
    if (target > 100) {
      setMessage(`${player.name} needs an exact roll to reach 100 — turn passes.`);
      setTimeout(() => passTurn(steps), 700); return;
    }
    setIsMoving(true); let pos = player.position;
    const step = () => {
      if (pos < target) {
        pos += 1; setPos(idx, pos); sounds.move();
        setHopTick((t) => t + 1); setTimeout(step, 165);
      } else { resolveTile(idx, target, steps); }
    }; step();
  };

  const resolveTile = (idx, pos, steps) => {
    if (LADDERS[pos]) {
      const dest = LADDERS[pos]; sounds.ladder();
      setSpecial({ type: "ladder", from: pos, to: dest });
      setMessage(`${playersRef.current[idx].name} found a hidden ladder!`);
      const c = tileCenter(dest); setSparkleAt(c); setZoom(true);
      setTimeout(() => { setPos(idx, dest); setTimeout(() => { setSpecial(null); setSparkleAt(null); setZoom(false); finishMove(idx, dest, steps); }, 500); }, 550);
    } else if (SNAKES[pos]) {
      const dest = SNAKES[pos]; sounds.snake();
      setSpecial({ type: "snake", from: pos, to: dest });
      setMessage(`${playersRef.current[idx].name} got swallowed by a jungle serpent!`);
      setShake(true); setZoom(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => { setPos(idx, dest); setTimeout(() => { setSpecial(null); setZoom(false); finishMove(idx, dest, steps); }, 500); }, 600);
    } else { finishMove(idx, pos, steps); }
  };

  const finishMove = (idx, finalPos, steps) => {
    setIsMoving(false);
    if (finalPos === 100) {
      sounds.victory(); setWinner(idx);
      setMessage(`${playersRef.current[idx].name} reached the golden temple and won!`);
      if (mode === "online" && idx === myPlayerIndex) socketRef.current?.emit("sl:game-over", { winnerIndex: idx, winnerName: playersRef.current[idx].name });
      return;
    }
    if (mode === "online") {
      if (idx === myPlayerIndex) {
        // Only the roller tells the server the move is done
        socketRef.current?.emit("sl:move-complete", { finalPosition: finalPos });
      }
    } else {
      if (steps === 6) { setMessage(`${playersRef.current[idx].name} rolled a 6 — roll again!`); }
      else { const next = (idx + 1) % playersRef.current.length; setCurrentPlayer(next); setMessage(`${playersRef.current[next].name}'s turn — roll the dice!`); }
    }
  };

  const passTurn = (steps) => {
    const idx = currentRef.current; setIsMoving(false);
    if (mode === "online") {
      // Tell server the move resulted in no position change (overshot)
      socketRef.current?.emit("sl:move-complete", { finalPosition: playersRef.current[idx].position });
    } else {
      if (steps === 6) { setMessage(`${playersRef.current[idx].name} rolled a 6 — roll again!`); }
      else { const next = (idx + 1) % playersRef.current.length; setCurrentPlayer(next); setMessage(`${playersRef.current[next].name}'s turn — roll the dice!`); }
    }
  };

  const restart = () => {
    sounds.click();
    if (mode === "online") {
      // Go back to lobby for online mode
      socketRef.current?.disconnect(); socketRef.current = null;
      setRoomCode(""); setWaitingForOpponent(false); setOpponentLeft(false);
      setWinner(null); setMode(null); setScreen("lobby");
      connectSocket();
      return;
    }
    const named = PLAYERS_BASE.map((p, i) => ({ ...p, position: 0, name: i === 1 && mode === "bot" ? "Jungle Bot" : p.name }));
    playersRef.current = named; setPlayers(named); setCurrentPlayer(0);
    setDiceValue(1); setWinner(null); setSpecial(null); setSparkleAt(null);
    setMessage(`${named[0].name}'s turn — roll the dice!`);
  };

  const quitToHome = () => {
    sounds.click(); setWinner(null); setMode(null); setScreen("home");
    if (mode === "online") { socketRef.current?.disconnect(); socketRef.current = null; setRoomCode(""); setWaitingForOpponent(false); setOpponentLeft(false); }
  };

  const tiles = useMemo(() => Array.from({ length: 100 }, (_, i) => i + 1), []);

  const ladderEls = Object.entries(LADDERS).map(([start, end]) => {
    const a = tileCenter(Number(start)); const b = tileCenter(Number(end));
    const dx = b.x - a.x, dy = b.y - a.y; const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len, ny = dx / len; const off = 7;
    const rail1a = { x: a.x + nx * off, y: a.y + ny * off };
    const rail1b = { x: b.x + nx * off, y: b.y + ny * off };
    const rail2a = { x: a.x - nx * off, y: a.y - ny * off };
    const rail2b = { x: b.x - nx * off, y: b.y - ny * off };
    const rungs = []; const steps = 6;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const p1 = { x: rail1a.x + (rail1b.x - rail1a.x) * t, y: rail1a.y + (rail1b.y - rail1a.y) * t };
      const p2 = { x: rail2a.x + (rail2b.x - rail2a.x) * t, y: rail2a.y + (rail2b.y - rail2a.y) * t };
      rungs.push(<line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#6b4226" strokeWidth="3" strokeLinecap="round" />);
    }
    return (
      <g key={`ladder-${start}`} className="sl-ladder">
        <line x1={rail1a.x} y1={rail1a.y} x2={rail1b.x} y2={rail1b.y} stroke="#8a5a34" strokeWidth="4.5" strokeLinecap="round" />
        <line x1={rail2a.x} y1={rail2a.y} x2={rail2b.x} y2={rail2b.y} stroke="#8a5a34" strokeWidth="4.5" strokeLinecap="round" />
        {rungs}
      </g>
    );
  });

  const snakeEls = Object.entries(SNAKES).map(([start, end], si) => {
    const a = tileCenter(Number(start)); const b = tileCenter(Number(end));
    const amp = 14 + (si % 3) * 3; const waves = 2 + (si % 2) * 0.6;
    const snake = buildSnake(a.x, a.y, b.x, b.y, amp, waves, 34);
    const gid = `snakeGrad-${start}`;
    const hx = snake.head.x, hy = snake.head.y;
    const dirX = Math.cos(snake.headDir), dirY = Math.sin(snake.headDir);
    const perpX = -dirY, perpY = dirX;
    const tongueBaseX = hx + dirX * 9, tongueBaseY = hy + dirY * 9;
    const tongueTipX = hx + dirX * 17, tongueTipY = hy + dirY * 17;
    const tongueForkA = { x: tongueTipX + perpX * 2.6 - dirX * 1, y: tongueTipY + perpY * 2.6 - dirY * 1 };
    const tongueForkB = { x: tongueTipX - perpX * 2.6 - dirX * 1, y: tongueTipY - perpY * 2.6 - dirY * 1 };
    return (
      <g key={`snake-${start}`} className="sl-snake-group">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9be08a" /><stop offset="45%" stopColor="#4a9b5c" /><stop offset="100%" stopColor="#1c5c34" />
          </linearGradient>
          <radialGradient id={`${gid}-head`} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#a8e79a" /><stop offset="100%" stopColor="#2f7a48" />
          </radialGradient>
        </defs>
        <path d={snake.bodyPath} fill="#04220f" opacity="0.28" transform="translate(1.5,2.5)" />
        <path d={snake.bodyPath} fill={`url(#${gid})`} stroke="#123f22" strokeWidth="1.2" className="sl-snake-body" />
        {snake.scalePts.map((s, i) => (
          <ellipse key={i} cx={s.x} cy={s.y} rx={Math.max(s.w * 0.32, 1.4)} ry={Math.max(s.w * 0.2, 0.9)} fill="#dff5d0" opacity={i % 2 === 0 ? 0.16 : 0.09} transform={`rotate(${(s.ang * 180) / Math.PI} ${s.x} ${s.y})`} />
        ))}
        <path d={snake.centerPath} fill="none" stroke="#e9f7d8" strokeWidth="1.6" opacity="0.35" strokeLinecap="round" />
        <path d={`M ${tongueBaseX} ${tongueBaseY} L ${tongueTipX} ${tongueTipY} L ${tongueForkA.x} ${tongueForkA.y} M ${tongueTipX} ${tongueTipY} L ${tongueForkB.x} ${tongueForkB.y}`} stroke="#e63946" strokeWidth="1.1" fill="none" strokeLinecap="round" className="sl-snake-tongue" />
        <ellipse cx={hx} cy={hy} rx="9.5" ry="8" fill={`url(#${gid}-head)`} stroke="#123f22" strokeWidth="1.2" transform={`rotate(${(snake.headDir * 180) / Math.PI} ${hx} ${hy})`} />
        <circle cx={hx + perpX * 4 - dirX * 1.5} cy={hy + perpY * 4 - dirY * 1.5} r="2.1" fill="#fff8e0" stroke="#123f22" strokeWidth="0.5" />
        <circle cx={hx - perpX * 4 - dirX * 1.5} cy={hy - perpY * 4 - dirY * 1.5} r="2.1" fill="#fff8e0" stroke="#123f22" strokeWidth="0.5" />
        <circle cx={hx + perpX * 4 - dirX * 1} cy={hy + perpY * 4 - dirY * 1} r="1" fill="#16150f" className="sl-snake-eye" />
        <circle cx={hx - perpX * 4 - dirX * 1} cy={hy - perpY * 4 - dirY * 1} r="1" fill="#16150f" className="sl-snake-eye" />
        <circle cx={hx + perpX * 2 + dirX * 6.5} cy={hy + perpY * 2 + dirY * 6.5} r="0.5" fill="#123f22" />
        <circle cx={hx - perpX * 2 + dirX * 6.5} cy={hy - perpY * 2 + dirY * 6.5} r="0.5" fill="#123f22" />
      </g>
    );
  });

  return (
    <div className={`sl-root ${shake ? "sl-shake" : ""} ${screen === "game" ? "sl-in-game" : ""} ${screen === "mode" ? "sl-mode-screen" : ""}`}>
      <audio ref={bgmRef} src="/snake-ladder-bgm.mp3" loop preload="auto" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Nunito:wght@400;700;900&display=swap');
        .sl-root{position:relative;width:100%;min-height:100vh;min-height:100dvh;box-sizing:border-box;padding:24px 16px 48px;display:flex;flex-direction:column;align-items:center;font-family:'Nunito',sans-serif;overflow:hidden;background:radial-gradient(circle at 50% -8%,rgba(255,210,130,0.20),transparent 42%),radial-gradient(ellipse at 12% 12%,rgba(255,224,130,0.14),transparent 48%),radial-gradient(ellipse at 88% 22%,rgba(120,255,190,0.10),transparent 52%),radial-gradient(ellipse at 50% 115%,rgba(15,60,38,0.9),transparent 60%),linear-gradient(160deg,#0b2f1d 0%,#123c27 22%,#0f3624 45%,#0c2c1c 70%,#071c12 100%)}
        .sl-root.sl-shake{animation:slShake 0.45s ease}
        @keyframes slShake{0%,100%{transform:translate(0,0)}20%{transform:translate(-6px,3px)}40%{transform:translate(5px,-4px)}60%{transform:translate(-4px,4px)}80%{transform:translate(3px,-2px)}}
        .sl-canopy{position:absolute;border-radius:50%;filter:blur(46px);pointer-events:none;animation:slCanopyDrift ease-in-out infinite;will-change:transform}
        @keyframes slCanopyDrift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(14px,-12px) scale(1.06)}}
        .sl-vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 38%,transparent 38%,rgba(3,16,10,0.62) 100%)}
        .sl-rays{position:absolute;inset:-10% -10% auto -10%;height:60%;background:conic-gradient(from 200deg at 50% 0%,transparent 0deg,rgba(255,240,190,0.10) 8deg,transparent 20deg,transparent 40deg,rgba(255,240,190,0.07) 50deg,transparent 62deg,transparent 100deg,rgba(255,240,190,0.09) 112deg,transparent 130deg);pointer-events:none;mix-blend-mode:screen}
        .sl-leaf{position:absolute;border-radius:0 100% 0 100%;background:linear-gradient(135deg,rgba(76,175,110,0.5),rgba(20,90,55,0.35));filter:blur(0.5px);animation:slLeafSway ease-in-out infinite;pointer-events:none}
        @keyframes slLeafSway{0%,100%{transform:rotate(-6deg) translateY(0)}50%{transform:rotate(8deg) translateY(10px)}}
        .sl-firefly{position:absolute;border-radius:50%;background:radial-gradient(circle,#fff6c8 0%,#ffd166 55%,transparent 75%);box-shadow:0 0 8px 2px rgba(255,214,102,0.8);animation:slFly ease-in-out infinite;pointer-events:none}
        @keyframes slFly{0%{transform:translate(0,0);opacity:0.2}25%{opacity:1}50%{transform:translate(14px,-18px);opacity:0.6}75%{opacity:1}100%{transform:translate(-10px,6px);opacity:0.2}}
        .sl-dust{position:absolute;border-radius:50%;background:rgba(255,255,255,0.35);animation:slDust linear infinite;pointer-events:none}
        @keyframes slDust{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:0.5}90%{opacity:0.3}100%{transform:translateY(-140px) translateX(20px);opacity:0}}
        .sl-sign-wrap{position:relative;z-index:3;margin-bottom:18px;animation:slSignFloat 5s ease-in-out infinite}
        @keyframes slSignFloat{0%,100%{transform:translateY(0) rotate(-0.4deg)}50%{transform:translateY(-6px) rotate(0.4deg)}}
        .sl-ropes{display:flex;justify-content:space-between;width:70%;margin:0 auto -6px}
        .sl-rope{width:3px;height:22px;background:linear-gradient(#8a6a3f,#5c4326);border-radius:2px}
        .sl-sign{padding:14px 34px;background:repeating-linear-gradient(90deg,#7a5433 0 6px,#6a4728 6px 12px),linear-gradient(180deg,#8a5f38,#5c3d22);border:4px solid #d9a441;border-radius:14px;box-shadow:0 10px 24px rgba(0,0,0,0.45),inset 0 2px 4px rgba(255,255,255,0.15),inset 0 -3px 6px rgba(0,0,0,0.35);text-align:center}
        .sl-sign h1{margin:0;font-family:'Baloo 2',cursive;font-weight:800;letter-spacing:2px;font-size:clamp(28px,6vw,46px);line-height:1.05;color:#ffe9b0;text-shadow:0 2px 0 #4a2f16,0 0 18px rgba(255,214,110,0.5)}
        .sl-sign .sl-and{font-family:'Baloo 2',cursive;font-size:clamp(12px,2.4vw,16px);color:#cdb27a;letter-spacing:6px;margin:2px 0}
        .sl-menu-wrap{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;gap:18px;margin-top:8px;text-align:center;animation:slMenuIn 0.5s ease}
        @keyframes slMenuIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .sl-tagline{margin:0;color:#d9e8c8;font-size:15px;opacity:0.85;max-width:340px}
        .sl-cta-btn{font-family:'Baloo 2',cursive;font-weight:800;font-size:22px;letter-spacing:1px;padding:16px 46px;border-radius:18px;border:none;cursor:pointer;color:#3a2410;background:linear-gradient(180deg,#ffe9a8,#ffc94d 55%,#e6a52b);box-shadow:0 7px 0 #a06c1c,0 14px 22px rgba(0,0,0,0.45),inset 0 2px 2px rgba(255,255,255,0.6);transition:transform 0.12s,box-shadow 0.12s;animation:slCtaPulse 2.2s ease-in-out infinite}
        @keyframes slCtaPulse{0%,100%{box-shadow:0 7px 0 #a06c1c,0 14px 22px rgba(0,0,0,0.45),inset 0 2px 2px rgba(255,255,255,0.6)}50%{box-shadow:0 7px 0 #a06c1c,0 14px 30px rgba(255,214,102,0.4),inset 0 2px 2px rgba(255,255,255,0.6)}}
        .sl-cta-btn:hover{transform:translateY(-2px)}.sl-cta-btn:active{transform:translateY(3px);box-shadow:0 2px 0 #a06c1c,0 4px 8px rgba(0,0,0,0.4)}
        .sl-home-icons{display:flex;gap:16px;flex-wrap:wrap;justify-content:center;color:#e8dcb8;font-size:13px;opacity:0.85}.sl-home-icons span{background:rgba(0,0,0,0.22);padding:6px 12px;border-radius:999px;border:1px solid rgba(200,150,63,0.4)}
        .sl-mode-grid{display:flex;gap:18px;flex-wrap:wrap;justify-content:center}
        .sl-mode-card{width:190px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:24px 18px;border-radius:18px;cursor:pointer;background:linear-gradient(160deg,#7a5333,#4a3018 70%);border:3px solid #c8963f;box-shadow:0 12px 24px rgba(0,0,0,0.4),inset 0 2px 4px rgba(255,255,255,0.12),inset 0 -4px 8px rgba(0,0,0,0.4);color:#f4e6c8;transition:transform 0.18s,box-shadow 0.18s,border-color 0.18s}
        .sl-mode-card:hover{transform:translateY(-4px) scale(1.02);border-color:#ffd166;box-shadow:0 18px 30px rgba(0,0,0,0.5),0 0 20px rgba(255,214,102,0.3)}.sl-mode-card:active{transform:translateY(0) scale(0.98)}
        .sl-mode-icon{font-size:34px}.sl-mode-title{font-family:'Baloo 2',cursive;font-weight:700;font-size:17px;color:#ffe0a0}.sl-mode-desc{font-size:11.5px;opacity:0.8;line-height:1.3}
.sl-mode-card-wide{flex:0 0 100%;width:100%;max-width:340px;padding:24px 16px}
.sl-mode-card-wide .sl-mode-icon{font-size:40px}
.sl-mode-card-wide .sl-mode-title{font-size:20px}
.sl-mode-card-wide .sl-mode-desc{font-size:12.5px}
        .sl-back-link{background:none;border:none;cursor:pointer;color:#d9c290;font-size:13px;text-decoration:underline;text-underline-offset:3px;opacity:0.85;padding:4px 6px}.sl-back-link:hover{opacity:1;color:#ffe0a0}
        .sl-loader{position:relative;width:88px;height:88px;display:flex;align-items:center;justify-content:center}
        .sl-loader-ring{position:absolute;inset:0;border-radius:50%;border:5px solid rgba(200,150,63,0.25);border-top-color:#ffd166;animation:slSpin 1s linear infinite}
        @keyframes slSpin{to{transform:rotate(360deg)}}
        .sl-loader-dice{font-size:30px;animation:slDiceTumble 1.1s ease-in-out infinite}
        @keyframes slDiceTumble{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}
        .sl-progress-track{width:220px;height:10px;border-radius:999px;background:rgba(0,0,0,0.35);overflow:hidden;border:1px solid rgba(200,150,63,0.4)}
        .sl-progress-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#ffe9a8,#ffc94d,#e6a52b);transition:width 0.08s linear}
        .sl-loading-text{margin:0;color:#e8dcb8;font-size:13px;opacity:0.85;min-height:18px}
        .sl-winner-actions{display:flex;flex-direction:column;align-items:center;gap:10px}
        .sl-stage{position:relative;z-index:2;width:100%;max-width:1080px;display:flex;gap:26px;align-items:flex-start;justify-content:center;flex-wrap:wrap}
        .sl-board-frame{position:relative;padding:18px;border-radius:26px;background:linear-gradient(160deg,#7a5333,#4a3018 60%,#3a2512);box-shadow:0 24px 50px rgba(0,0,0,0.55),inset 0 2px 6px rgba(255,255,255,0.12),inset 0 -6px 14px rgba(0,0,0,0.5);border:3px solid #c8963f;transition:transform 0.6s cubic-bezier(.2,.9,.3,1.2);width:min(92vw,560px);flex-shrink:0}
        .sl-board-frame.sl-zoom{transform:scale(1.02)}
        .sl-corner{position:absolute;width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffe9a8,#c8963f 70%);box-shadow:0 2px 5px rgba(0,0,0,0.5);z-index:1000}
        .sl-corner.tl{top:8px;left:8px}.sl-corner.tr{top:8px;right:8px}.sl-corner.bl{bottom:8px;left:8px}.sl-corner.br{bottom:8px;right:8px}
        .sl-board{position:relative;width:100%;aspect-ratio:1/1;border-radius:14px;overflow:hidden;display:grid;grid-template-columns:repeat(10,1fr);grid-template-rows:repeat(10,1fr);box-shadow:inset 0 0 0 3px #2b1a0d,inset 0 6px 18px rgba(0,0,0,0.4)}
        .sl-tile{position:relative;display:flex;align-items:flex-end;justify-content:flex-start;font-family:'Nunito',sans-serif;font-weight:700;font-size:9px;color:rgba(255,255,255,0.55);padding:3px 4px;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.15),inset 0 2px 3px rgba(255,255,255,0.12),inset 0 -3px 5px rgba(0,0,0,0.18)}
        .sl-tile.a{background:linear-gradient(160deg,#2f7a52,#1f5c3c)}.sl-tile.b{background:linear-gradient(160deg,#256a46,#164a30)}
        .sl-tile.ladder-tile{box-shadow:inset 0 0 0 2px rgba(255,214,110,0.5)}.sl-tile.snake-tile{box-shadow:inset 0 0 0 2px rgba(255,90,90,0.4)}
        .sl-svg-overlay{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:10}
        .sl-snake-body{filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35))}
        .sl-snake-eye{animation:slEyeGlow 1.8s ease-in-out infinite}
        @keyframes slEyeGlow{0%,100%{opacity:0.6}50%{opacity:1}}
        .sl-snake-tongue{animation:slTongueFlick 2.6s ease-in-out infinite;transform-origin:center}
        @keyframes slTongueFlick{0%,82%,100%{opacity:0;transform:scaleX(0.3)}86%{opacity:1;transform:scaleX(1)}92%{opacity:1;transform:scaleX(0.85)}96%{opacity:0;transform:scaleX(0.3)}}
        .sl-ladder line{filter:drop-shadow(0 2px 2px rgba(0,0,0,0.35))}
        .sl-token{position:absolute;width:5.2%;height:5.2%;transform:translate(-50%,-100%);transition:left 0.16s ease,top 0.16s ease;z-index:500;filter:drop-shadow(0 4px 4px rgba(0,0,0,0.5))}
        .sl-token-body{width:100%;height:100%;border-radius:50% 50% 50% 4px;position:relative;animation:slTokenBounce 0.6s ease-in-out infinite;transform-origin:bottom center}
        .sl-token.hop .sl-token-body{animation:slHop 0.32s ease-out}
        @keyframes slTokenBounce{0%,100%{transform:scaleY(1) scaleX(1) translateY(0)}50%{transform:scaleY(0.94) scaleX(1.04) translateY(1px)}}
        @keyframes slHop{0%{transform:translateY(0) scale(1,1)}35%{transform:translateY(-14px) scale(0.9,1.14)}70%{transform:translateY(0) scale(1.14,0.86)}100%{transform:translateY(0) scale(1,1)}}
        .sl-token-shine{position:absolute;top:12%;left:22%;width:34%;height:26%;border-radius:50%;background:rgba(255,255,255,0.55);filter:blur(1px)}
        .sl-token-ring{position:absolute;inset:-14%;border-radius:50%;opacity:0;transition:opacity 0.25s}
        .sl-token.active .sl-token-ring{opacity:1;animation:slRingPulse 1.4s ease-in-out infinite}
        @keyframes slRingPulse{0%,100%{box-shadow:0 0 0 2px var(--ring-color),0 0 10px 3px var(--ring-color)}50%{box-shadow:0 0 0 3px var(--ring-color),0 0 18px 6px var(--ring-color)}}
        .sl-sparkle-wrap{position:absolute;pointer-events:none;z-index:6;transform:translate(-50%,-50%)}
        .sl-spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#ffe9a8;box-shadow:0 0 6px 2px #ffd166;animation:slSparkOut 0.7s ease-out forwards}
        @keyframes slSparkOut{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0}}
        .sl-panel{width:min(92vw,220px);min-height:min(92vw,560px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:12px 0}
        .sl-player-badge{display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:999px;background:rgba(0,0,0,0.28);border:2px solid var(--badge-color,#ffd166);box-shadow:0 0 16px rgba(255,214,102,0.3),inset 0 2px 3px rgba(255,255,255,0.1);color:#ffe9c8;font-size:13px}
        .sl-chip-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;box-shadow:inset 0 -2px 3px rgba(0,0,0,0.35),inset 0 2px 2px rgba(255,255,255,0.4)}
        .sl-die{width:72px;height:72px;perspective:300px}
        .sl-die-face{width:100%;height:100%;position:relative;background:linear-gradient(160deg,#fdf6e3,#e8dcb8);border-radius:14px;border:2px solid #b8934f;box-shadow:0 6px 12px rgba(0,0,0,0.4),inset 0 2px 3px rgba(255,255,255,0.7)}
        .sl-die-rolling .sl-die-face{animation:slDiceRoll 0.16s linear infinite}
        @keyframes slDiceRoll{0%{transform:rotate3d(1,1,0,0deg) scale(1)}50%{transform:rotate3d(1,1,0,180deg) scale(1.08)}100%{transform:rotate3d(1,1,0,360deg) scale(1)}}
        .sl-die-settled .sl-die-face{animation:slDiceLand 0.4s cubic-bezier(.3,1.7,.5,1)}
        @keyframes slDiceLand{0%{transform:scale(1.3) rotate(8deg)}60%{transform:scale(0.92) rotate(-3deg)}100%{transform:scale(1) rotate(0deg)}}
        .sl-pip{position:absolute;width:9px;height:9px;margin:-4.5px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#5a4326,#2b1c0e)}
        .sl-roll-btn{font-family:'Baloo 2',cursive;font-weight:700;font-size:16px;letter-spacing:0.5px;padding:12px 28px;border-radius:14px;border:none;cursor:pointer;color:#3a2410;background:linear-gradient(180deg,#ffe9a8,#ffc94d 55%,#e6a52b);box-shadow:0 6px 0 #a06c1c,0 10px 16px rgba(0,0,0,0.4),inset 0 2px 2px rgba(255,255,255,0.6);transition:transform 0.12s,box-shadow 0.12s}
        .sl-roll-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 0 #a06c1c,0 14px 18px rgba(0,0,0,0.45)}.sl-roll-btn:active:not(:disabled){transform:translateY(3px);box-shadow:0 2px 0 #a06c1c,0 4px 8px rgba(0,0,0,0.4)}.sl-roll-btn:disabled{opacity:0.55;cursor:default;filter:grayscale(0.3)}
        .sl-turn-msg{font-size:13px;text-align:center;min-height:34px;color:#ffe9c8}
        .sl-overlay{position:fixed;inset:0;z-index:50;background:radial-gradient(circle at 50% 40%,rgba(60,40,10,0.55),rgba(0,0,0,0.82));display:flex;align-items:center;justify-content:center;animation:slFadeIn 0.4s ease}
        @keyframes slFadeIn{from{opacity:0}to{opacity:1}}
        .sl-winner-card{background:linear-gradient(160deg,#8a5f38,#5c3d22);border:4px solid #ffd166;border-radius:22px;padding:34px 40px;text-align:center;box-shadow:0 30px 60px rgba(0,0,0,0.6),0 0 60px rgba(255,214,102,0.25);animation:slWinnerIn 0.6s cubic-bezier(.2,1.4,.4,1);position:relative;max-width:92vw}
        @keyframes slWinnerIn{0%{transform:scale(0.6) translateY(30px);opacity:0}100%{transform:scale(1) translateY(0);opacity:1}}
        .sl-trophy{font-size:56px;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.5));animation:slTrophyBob 1.6s ease-in-out infinite}
        @keyframes slTrophyBob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-8px) rotate(3deg)}}
        .sl-winner-card h2{font-family:'Baloo 2',cursive;color:#ffe9b0;font-size:26px;margin:10px 0 4px;text-shadow:0 2px 0 #4a2f16}
        .sl-winner-card p{color:#f0dcb0;margin:0 0 18px;font-size:14px}
        .sl-confetti{position:absolute;top:-10px;border-radius:2px;animation:slConfetti linear forwards}
        @keyframes slConfetti{to{transform:translateY(420px) rotate(540deg);opacity:0}}
        @media(max-width:720px){.sl-stage{flex-direction:column;align-items:center}.sl-panel{max-width:560px}.sl-root.sl-in-game .sl-sign-wrap{display:none!important}.sl-mode-card{width:auto;flex:1;min-width:0;padding:18px 10px}.sl-mode-card.sl-mode-card-wide{flex:0 0 100%;width:100%;padding:24px 12px}.sl-root.sl-in-game{height:100vh;height:100dvh;padding:8px;justify-content:center;overflow:hidden;overscroll-behavior:none}.sl-root.sl-in-game .sl-stage{justify-content:center;margin:0}.sl-root.sl-in-game .sl-board-frame{width:min(calc(100dvh - 260px),92vw);padding:8px}.sl-root.sl-in-game .sl-panel{min-height:0;gap:6px;padding:0}.sl-root.sl-in-game .sl-die{width:48px;height:48px}.sl-root.sl-in-game .sl-die-face{border-radius:10px}.sl-root.sl-in-game .sl-pip{width:7px;height:7px;margin:-3.5px}.sl-root.sl-in-game .sl-roll-btn{padding:9px 20px;font-size:13px;border-radius:11px}.sl-root.sl-in-game .sl-turn-msg{font-size:11.5px;min-height:14px}}
.sl-mode-screen{justify-content:center}
.sl-mode-screen .sl-sign-wrap{margin-bottom:10px}
.sl-mode-screen .sl-sign{padding:8px 22px}
.sl-mode-screen .sl-sign h1{font-size:clamp(20px,5vw,32px)}
.sl-mode-screen .sl-and{font-size:clamp(9px,2vw,13px)}
.sl-mode-screen .sl-menu-wrap{gap:10px;margin-top:2px}
@media(max-height:650px){.sl-mode-screen .sl-sign{display:none}.sl-mode-screen .sl-menu-wrap{gap:8px}}
        .sl-lobby{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;gap:16px;animation:slMenuIn 0.5s ease;max-width:380px;width:100%}
        .sl-lobby h2{font-family:'Baloo 2',cursive;color:#ffe9b0;font-size:22px;margin:0;text-shadow:0 2px 0 #4a2f16}
        .sl-lobby-input{width:100%;padding:12px 16px;border-radius:12px;border:2px solid #8a5a34;background:rgba(0,0,0,0.3);color:#ffe9c8;font-family:'Nunito',sans-serif;font-size:14px;outline:none;box-sizing:border-box}
        .sl-lobby-input::placeholder{color:rgba(255,233,200,0.4)}
        .sl-lobby-input:focus{border-color:#ffd166;box-shadow:0 0 12px rgba(255,209,102,0.3)}
        .sl-lobby-row{display:flex;gap:10px;width:100%}
        .sl-lobby-btn{flex:1;font-family:'Baloo 2',cursive;font-weight:700;font-size:15px;padding:12px 18px;border-radius:12px;border:none;cursor:pointer;color:#3a2410;background:linear-gradient(180deg,#ffe9a8,#ffc94d 55%,#e6a52b);box-shadow:0 5px 0 #a06c1c,0 8px 14px rgba(0,0,0,0.4);transition:transform 0.12s,box-shadow 0.12s}
        .sl-lobby-btn:hover{transform:translateY(-2px)}.sl-lobby-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #a06c1c,0 3px 6px rgba(0,0,0,0.4)}
        .sl-lobby-btn:disabled{opacity:0.5;cursor:default;filter:grayscale(0.3)}
        .sl-lobby-divider{color:#cdb27a;font-size:13px;opacity:0.7;margin:4px 0}
        .sl-room-code-display{text-align:center;padding:18px 30px;background:rgba(0,0,0,0.3);border:2px solid #c8963f;border-radius:16px;animation:slMenuIn 0.3s ease}
        .sl-room-code-display .sl-code{font-family:'Baloo 2',cursive;font-size:36px;letter-spacing:8px;color:#ffd166;text-shadow:0 0 16px rgba(255,209,102,0.5)}
        .sl-room-code-display .sl-code-label{font-size:12px;color:#cdb27a;margin-top:4px}
        .sl-waiting-dots span{display:inline-block;width:8px;height:8px;margin:0 4px;border-radius:50%;background:#ffd166;animation:slWaitDot 1.2s ease-in-out infinite}
        .sl-waiting-dots span:nth-child(2){animation-delay:0.2s}.sl-waiting-dots span:nth-child(3){animation-delay:0.4s}
        @keyframes slWaitDot{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}
        .sl-conn-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
        .sl-conn-dot.on{background:#5ce1a8;box-shadow:0 0 6px #5ce1a8}.sl-conn-dot.off{background:#ff6b6b;box-shadow:0 0 6px #ff6b6b}
        .sl-opponent-left{text-align:center;color:#ff9999;font-size:13px;padding:10px;background:rgba(255,80,80,0.15);border-radius:10px;border:1px solid rgba(255,80,80,0.3)}
      `}</style>
      <div className="sl-canopy" style={{top:"-12%",left:"-12%",width:"56%",height:"56%",background:"radial-gradient(circle,#0d4327,transparent 70%)",opacity:0.8,animationDuration:"15s"}} />
      <div className="sl-canopy" style={{top:"-16%",right:"-14%",width:"62%",height:"62%",background:"radial-gradient(circle,#0f3020,transparent 70%)",opacity:0.75,animationDuration:"19s"}} />
      <div className="sl-canopy" style={{bottom:"-18%",left:"-10%",width:"46%",height:"46%",background:"radial-gradient(circle,#ffd166,transparent 72%)",opacity:0.07,animationDuration:"21s"}} />
      <div className="sl-canopy" style={{bottom:"-20%",right:"-10%",width:"50%",height:"50%",background:"radial-gradient(circle,#2f8f4e,transparent 70%)",opacity:0.35,animationDuration:"17s"}} />
      <div className="sl-vignette" />
      <div className="sl-rays" />
      {leaves.map((l) => <div key={`leaf-${l.id}`} className="sl-leaf" style={{left:`${l.left}%`,top:`${l.top-30}%`,width:30+l.size*4,height:30+l.size*4,animationDuration:`${l.dur}s`,animationDelay:`${l.delay}s`}} />)}
      {fireflies.map((f) => <div key={`fly-${f.id}`} className="sl-firefly" style={{left:`${f.left}%`,top:`${f.top}%`,width:f.size+2,height:f.size+2,animationDuration:`${f.dur}s`,animationDelay:`${f.delay}s`}} />)}
      {dust.map((d) => <div key={`dust-${d.id}`} className="sl-dust" style={{left:`${d.left}%`,top:`${d.top}%`,width:d.size,height:d.size,animationDuration:`${d.dur+4}s`,animationDelay:`${d.delay}s`}} />)}
      <div className="sl-sign-wrap">
        <div className="sl-ropes"><div className="sl-rope" /><div className="sl-rope" /></div>
        <div className="sl-sign">
          <div style={{ position:'absolute', top:8, right:8, zIndex:10 }}>
            <button onClick={() => setBgmOn(b => !b)} style={{ background:'rgba(0,0,0,0.3)', border:'2px solid #d9a441', borderRadius:'50%', width:32, height:32, cursor:'pointer', color:'#ffe9b0', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }} title={bgmOn ? "Mute music" : "Play music"}>
              {bgmOn ? "♫" : "♪"}
            </button>
          </div>
          <h1>SNAKE</h1><div className="sl-and">~ &amp; ~</div><h1>LADDER</h1>
        </div>
      </div>
      {screen === "home" && (<div className="sl-menu-wrap"><p className="sl-tagline">A hand-carved board. Golden ladders. Hungry serpents.</p><button className="sl-cta-btn" onClick={goToModeSelect}>▶ Play</button><div className="sl-home-icons"><span>🪜 9 Ladders</span><span>🐍 10 Snakes</span><span>🎲 2 Players</span></div></div>)}
      {screen === "mode" && (<div className="sl-menu-wrap"><p className="sl-tagline">Choose your opponent</p><div className="sl-mode-grid"><button className="sl-mode-card" onClick={() => chooseMode("friend")}><span className="sl-mode-icon">🧑‍🤝‍🧑</span><span className="sl-mode-title">VS Friend</span><span className="sl-mode-desc">Take turns on the same device</span></button><button className="sl-mode-card" onClick={() => chooseMode("bot")}><span className="sl-mode-icon">🤖</span><span className="sl-mode-title">VS Bot</span><span className="sl-mode-desc">Challenge the jungle spirit</span></button><button className="sl-mode-card sl-mode-card-wide" onClick={() => chooseMode("online")}><span className="sl-mode-icon">🌍</span><span className="sl-mode-title">Online</span><span className="sl-mode-desc">Play with a friend online</span></button></div><button className="sl-back-link" onClick={backToHome}>← Back</button></div>)}
      {screen === "loading" && (<div className="sl-menu-wrap"><div className="sl-loader"><div className="sl-loader-ring" /><div className="sl-loader-dice">🎲</div></div><div className="sl-progress-track"><div className="sl-progress-fill" style={{width:`${loadingProgress}%`}} /></div><p className="sl-loading-text">{LOADING_LINES[loadingLine]}</p></div>)}
      {screen === "lobby" && (<div className="sl-lobby">
        <h2>Online Multiplayer</h2>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#cdb27a'}}><span className={`sl-conn-dot ${isConnected ? 'on' : 'off'}`} />{isConnected ? 'Connected' : 'Connecting…'}</div>
        {!roomCode ? (<>
          <input className="sl-lobby-input" placeholder="Your name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={20} />
          <div className="sl-lobby-row">
            <button className="sl-lobby-btn" onClick={createOnlineRoom} disabled={!isConnected}>Create Room</button>
          </div>
          <div className="sl-lobby-divider">— or join a friend —</div>
          <input className="sl-lobby-input" placeholder="Enter room code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={6} style={{textTransform:'uppercase',letterSpacing:4,textAlign:'center'}} />
          <div className="sl-lobby-row">
            <button className="sl-lobby-btn" onClick={joinOnlineRoom} disabled={!isConnected || !joinCode.trim()}>Join Room</button>
          </div>
        </>) : waitingForOpponent ? (<>
          <div className="sl-room-code-display">
            <div className="sl-code-label">ROOM CODE</div>
            <div className="sl-code">{roomCode}</div>
          </div>
          <p style={{color:'#ffe9c8',fontSize:14,margin:0}}>Share this code with your friend</p>
          <div className="sl-waiting-dots"><span /><span /><span /></div>
          <p style={{color:'#cdb27a',fontSize:12,margin:0}}>Waiting for opponent to join…</p>
        </>) : null}
        {opponentLeft && <div className="sl-opponent-left">Opponent left the game</div>}
        <button className="sl-back-link" onClick={quitToHome} style={{marginTop:8}}>← Back to menu</button>
      </div>)}
      {screen === "game" && (<><div className="sl-stage"><div className={`sl-board-frame ${zoom ? "sl-zoom" : ""}`}><span className="sl-corner tl" /><span className="sl-corner tr" /><span className="sl-corner bl" /><span className="sl-corner br" /><div className="sl-board">{tiles.map((n) => { const { row, col } = tileRowCol(n); const isEven = (row + col) % 2 === 0; return (<div key={n} className={`sl-tile ${isEven ? "a" : "b"} ${LADDERS[n] ? "ladder-tile" : ""} ${SNAKES[n] ? "snake-tile" : ""}`} style={{ order: row * 10 + col }}>{n}</div>); })}<svg className="sl-svg-overlay" viewBox={`0 0 ${VB} ${VB}`}>{ladderEls}{snakeEls}</svg>{players.map((p, idx) => { const c = tileCenter(Math.max(p.position, 1)); const leftPct = (c.x / VB) * 100 + (idx === 0 ? -1.1 : 1.1); const topPct = (c.y / VB) * 100; return (<div key={p.id} className={`sl-token ${idx === currentPlayer ? "active" : ""} ${hopTick && idx === currentPlayer ? "hop" : ""}`} style={{left:`${leftPct}%`,top:`${topPct}%`,"--ring-color":p.ring,opacity:p.position > 0 ? 1 : 0}}><div className="sl-token-body" style={{background:`radial-gradient(circle at 35% 25%,${p.core},${p.edge} 75%)`,boxShadow:`0 0 0 2px ${p.edge}`}}><div className="sl-token-shine" /></div><div className="sl-token-ring" /></div>); })}{sparkleAt && (<div className="sl-sparkle-wrap" style={{left:`${(sparkleAt.x/VB)*100}%`,top:`${(sparkleAt.y/VB)*100}%`}}>{Array.from({length:10},(_,i)=>{const angle=(i/10)*Math.PI*2;return(<span key={i} className="sl-spark" style={{"--dx":`${Math.cos(angle)*34}px`,"--dy":`${Math.sin(angle)*34}px`,animationDelay:`${i*0.02}s`}} />);})}</div>)}</div></div><div className="sl-panel">{mode === "online" && <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontSize:11,color:'#cdb27a',marginBottom:4}}><span className={`sl-conn-dot ${isConnected ? 'on' : 'off'}`} />Room: {roomCode}</div>}{mode === "online" && opponentLeft && <div className="sl-opponent-left">Opponent left the game</div>}<div className="sl-player-badge" style={{"--badge-color":players[currentPlayer].ring}}><span className="sl-chip-dot" style={{background:`radial-gradient(circle at 35% 25%,${players[currentPlayer].core},${players[currentPlayer].edge})`}} /><b>{players[currentPlayer].name}</b></div><Die value={diceValue} rolling={isRolling} /><button className="sl-roll-btn" onClick={rollDice} disabled={isRolling || isMoving || winner !== null || (mode === "bot" && currentPlayer === 1) || (mode === "online" && currentPlayer !== myPlayerIndex)}>{mode === "bot" && currentPlayer === 1 && !isRolling && !isMoving ? "Bot's turn…" : mode === "online" && currentPlayer !== myPlayerIndex && !isRolling && !isMoving ? "Waiting…" : isRolling ? "Rolling…" : isMoving ? "Moving…" : "Roll Dice"}</button><div className="sl-turn-msg">{message}</div><button className="sl-back-link" onClick={quitToHome}>← Quit to menu</button></div></div>{winner !== null && (<div className="sl-overlay"><div className="sl-winner-card">{Array.from({length:40},(_,i)=>{const colors=["#ffd166","#ff6b6b","#5ce1a8","#4dabf7","#f4a261"];return(<span key={i} className="sl-confetti" style={{left:`${Math.random()*100}%`,width:6+Math.random()*4,height:6+Math.random()*10,background:colors[i%colors.length],animationDuration:`${1.6+Math.random()*1.4}s`,animationDelay:`${Math.random()*0.6}s`}} />);})}<div className="sl-trophy">🏆</div><h2>{players[winner].name} Wins!</h2><p>The golden temple at tile 100 has been reached.</p><div className="sl-winner-actions"><button className="sl-roll-btn" onClick={restart}>Play Again</button><button className="sl-back-link" onClick={quitToHome}>← Main menu</button></div></div></div>)}</>)}
    </div>
  );
}
