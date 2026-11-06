import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

/* ============================================================
   Constants
   ============================================================ */
const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

function computeWinner(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { mark: board[a], line };
    }
  }
  return null;
}

function cellCenter(i) {
  const row = Math.floor(i / 3);
  const col = i % 3;
  return { x: ((col + 0.5) / 3) * 100, y: ((row + 0.5) / 3) * 100 };
}

const JITTER = [-3, 2, -2, 3, -1, 2, -3, 1, -2];
const WIN_LINE_BOW = { "0,1,2": -2.2, "3,4,5": 2, "6,7,8": -1.8, "0,3,6": 2.2, "1,4,7": -2, "2,5,8": 1.8, "0,4,8": 2.4, "2,4,6": -2.4 };

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateRoomCode() {
  let s = "";
  for (let i = 0; i < 4; i++) s += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  return s;
}

const EMPTY_BOARD = () => Array(9).fill(null);

/* ============================================================
   Component
   ============================================================ */
export default function TicTacToeMultiplayerPlayerPage({ sessionToken, onComplete }) {
  // 'home' | 'offline' | 'online-menu' | 'online-waiting' | 'online-playing'
  const [page, setPage] = useState("home");

  const [board, setBoard] = useState(EMPTY_BOARD());
  const [current, setCurrent] = useState("X");
  const [startingPlayer, setStartingPlayer] = useState("X");
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [names, setNames] = useState({ X: "Player X", O: "Player O" });
  const [history, setHistory] = useState([]);

  const [roomCode, setRoomCode] = useState(null);
  const [mySymbol, setMySymbol] = useState(null);
  const [players, setPlayers] = useState({ X: false, O: false });
  const [yourName, setYourName] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy code");
  const [busy, setBusy] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const roomCodeRef = useRef(null);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);

  const soundOnRef = useRef(soundOn);
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);

  const audioCtxRef = useRef(null);
  function getAudioCtx() {
    if (!audioCtxRef.current) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = Ctx ? new Ctx() : null;
      } catch (e) {
        audioCtxRef.current = null;
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }

  function vibrate(pattern) {
    if (!soundOnRef.current) return;
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) {}
  }

  function playTone({ freq = 440, duration = 0.12, type = "sine", gain = 0.15, delay = 0 } = {}) {
    if (!soundOnRef.current) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.03);
    } catch (e) {}
  }

  function sfxTap(mark) {
    playTone({ freq: mark === "O" ? 460 : 560, duration: 0.07, type: "sine", gain: 0.12 });
    vibrate(10);
  }
  function sfxWin() {
    playTone({ freq: 523.25, duration: 0.14, gain: 0.16 });
    playTone({ freq: 659.25, duration: 0.14, gain: 0.16, delay: 0.11 });
    playTone({ freq: 783.99, duration: 0.24, gain: 0.18, delay: 0.22 });
    vibrate([30, 40, 30, 40, 70]);
  }
  function sfxDraw() {
    playTone({ freq: 320, duration: 0.16, type: "triangle", gain: 0.13 });
    playTone({ freq: 260, duration: 0.22, type: "triangle", gain: 0.13, delay: 0.12 });
    vibrate([20, 30, 20]);
  }
  function sfxNav() {
    playTone({ freq: 440, duration: 0.05, type: "sine", gain: 0.08 });
    vibrate(6);
  }
  function sfxError() {
    playTone({ freq: 180, duration: 0.18, type: "sawtooth", gain: 0.14 });
    vibrate([15, 40, 15, 40]);
  }
  function sfxConnect() {
    playTone({ freq: 660, duration: 0.1, gain: 0.15 });
    playTone({ freq: 880, duration: 0.16, gain: 0.15, delay: 0.1 });
    vibrate([10, 20, 10]);
  }

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const winnerInfo = computeWinner(board);
  const isDraw = !winnerInfo && board.every(Boolean);
  const gameOver = !!winnerInfo || isDraw;
  const opponentPresent = players.X && players.O;
  const socketRef = useRef(null);

  const completedRef = useRef(false);
  const handleComplete = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      if (sessionToken) {
        await fetch('/api/play/session/complete', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: sessionToken, score: 0, player_data: { result: 'finished' } })
        });
      }
    } catch {}
    onComplete?.();
  }, [sessionToken, onComplete]);

  useEffect(() => {
    if (gameOver) handleComplete();
  }, [gameOver, handleComplete]);

  function getSocket() {
    if (socketRef.current?.connected) return socketRef.current;
    const BACKEND_URL = window.location.hostname === "localhost"
      ? `http://${window.location.hostname}:8080`
      : window.location.origin;
    const s = io(BACKEND_URL, { transports: ["websocket", "polling"] });
    socketRef.current = s;

    // Set up all event listeners here so they're attached once
    s.on("ttt:opponent-joined", ({ names: n }) => {
      setNames(n);
      setPlayers({ X: true, O: true });
      sfxConnect();
      setPage(p => p === "online-waiting" ? "online-playing" : p);
    });
    s.on("ttt:state-update", (data) => {
      setBoard(data.board);
      setCurrent(data.current);
      setScores(data.scores);
      setHistory(data.history || []);
      if (data.winner === "draw") setTimeout(sfxDraw, 90);
      else if (data.winner) setTimeout(sfxWin, 90);
    });
    s.on("ttt:new-round", (data) => {
      setBoard(data.board);
      setCurrent(data.current);
      setStartingPlayer(data.startingPlayer);
    });
    s.on("ttt:match-reset", (data) => {
      setBoard(data.board);
      setScores(data.scores);
      setHistory(data.history || []);
      setCurrent(data.current);
    });
    s.on("ttt:opponent-left", () => {
      setPlayers(p => ({ ...p, O: false }));
    });

    return s;
  }

  function handleCellClick(i) {
    if (board[i] || gameOver) return;
    if (page === "online-playing") {
      if (!opponentPresent || mySymbol !== current) return;
      const s = socketRef.current;
      if (!s?.connected) return;
      sfxTap(current);
      s.emit("ttt:make-move", { index: i }, (resp) => {
        if (resp?.error) { sfxError(); }
      });
      return;
    }
    if (page !== "offline") return;
    const nextBoard = board.slice();
    nextBoard[i] = current;
    const win = computeWinner(nextBoard);
    const full = nextBoard.every(Boolean);
    let nextScores = scores, nextHistory = history, nextCurrent = current;
    sfxTap(current);
    if (win) {
      nextScores = { ...scores, [win.mark]: scores[win.mark] + 1 };
      nextHistory = [{ type: "win", mark: win.mark }, ...history].slice(0, 5);
      setTimeout(sfxWin, 90);
    } else if (full) {
      nextScores = { ...scores, draws: scores.draws + 1 };
      nextHistory = [{ type: "draw" }, ...history].slice(0, 5);
      setTimeout(sfxDraw, 90);
    } else {
      nextCurrent = current === "X" ? "O" : "X";
    }
    setBoard(nextBoard);
    setScores(nextScores);
    setHistory(nextHistory);
    setCurrent(nextCurrent);
  }

  function newRound() {
    sfxNav();
    if (page === "online-playing") {
      socketRef.current?.emit("ttt:new-round");
      return;
    }
    const nextStart = startingPlayer === "X" ? "O" : "X";
    setStartingPlayer(nextStart);
    setCurrent(nextStart);
    setBoard(EMPTY_BOARD());
  }

  function resetMatch() {
    sfxNav();
    if (page === "online-playing") {
      socketRef.current?.emit("ttt:reset-match");
      return;
    }
    setScores({ X: 0, O: 0, draws: 0 });
    setHistory([]);
    setStartingPlayer("X");
    setCurrent("X");
    setBoard(EMPTY_BOARD());
  }

  function goHome() {
    sfxNav();
    socketRef.current?.disconnect();
    socketRef.current = null;
    setPage("home");
    setRoomCode(null);
    setMySymbol(null);
    setPlayers({ X: false, O: false });
    setJoinCodeInput("");
    setJoinError("");
    setBoard(EMPTY_BOARD());
    setScores({ X: 0, O: 0, draws: 0 });
    setHistory([]);
    setNames({ X: "Player X", O: "Player O" });
  }

  function goToOffline() {
    sfxNav();
    setBoard(EMPTY_BOARD());
    setScores({ X: 0, O: 0, draws: 0 });
    setHistory([]);
    setStartingPlayer("X");
    setCurrent("X");
    setNames({ X: "Player X", O: "Player O" });
    setPage("offline");
  }

  function createRoom() {
    setBusy(true);
    setJoinError("");
    const s = getSocket();
    s.emit("ttt:create-room", { playerName: yourName.trim() || "Player X" }, (resp) => {
      if (resp?.error) { setJoinError(resp.error); sfxError(); setBusy(false); return; }
      setRoomCode(resp.roomId);
      roomCodeRef.current = resp.roomId;
      setMySymbol(resp.symbol);
      setPlayers({ X: true, O: false });
      setNames({ X: yourName.trim() || "Player X", O: "Waiting…" });
      setPage("online-waiting");
      sfxNav();
      setBusy(false);
    });
  }

  function joinRoom() {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) { setJoinError("Enter a room code."); sfxError(); return; }
    setBusy(true);
    setJoinError("");
    const s = getSocket();
    let joined = false;
    const tryJoin = () => {
      if (joined) return;
      joined = true;
      s.emit("ttt:join-room", { roomId: code, playerName: yourName.trim() || "Player O" }, (resp) => {
        if (resp?.error) { setJoinError(resp.error); sfxError(); setBusy(false); return; }
        setRoomCode(resp.roomId);
        roomCodeRef.current = resp.roomId;
        setMySymbol(resp.symbol);
        setNames(resp.names);
        setBoard(resp.board);
        setCurrent(resp.current);
        setScores(resp.scores);
        setHistory(resp.history || []);
        setPlayers({ X: true, O: true });
        setPage("online-playing");
        sfxConnect();
        setBusy(false);
      });
    };
    if (s.connected) { tryJoin(); }
    else {
      s.on("connect", () => tryJoin());
      setTimeout(() => { if (!joined) { setJoinError("Could not connect to server. Make sure the backend is running."); sfxError(); setBusy(false); } }, 5000);
    }
  }

  function copyRoomCode() {
    if (!roomCode) return;
    sfxNav();
    try {
      navigator.clipboard.writeText(roomCode);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy code"), 1500);
    } catch (e) {
      setCopyLabel("Copy failed");
      setTimeout(() => setCopyLabel("Copy code"), 1500);
    }
  }

  function winLineFullSpan(line) {
    const [a, , c] = line;
    const rowOf = (i) => Math.floor(i / 3);
    const colOf = (i) => i % 3;
    if (rowOf(a) === rowOf(c)) {
      const y = cellCenter(a).y;
      return { start: { x: -4, y }, end: { x: 104, y } };
    }
    if (colOf(a) === colOf(c)) {
      const x = cellCenter(a).x;
      return { start: { x, y: -4 }, end: { x, y: 104 } };
    }
    if (a === 0) return { start: { x: -4, y: -4 }, end: { x: 104, y: 104 } };
    return { start: { x: 104, y: -4 }, end: { x: -4, y: 104 } };
  }

  const winLineCoords = winnerInfo ? winLineFullSpan(winnerInfo.line) : null;
  let winLinePath = "";
  let winLineLength = 0;
  if (winLineCoords) {
    const { start, end } = winLineCoords;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy);
    const bow = WIN_LINE_BOW[winnerInfo.line.join(",")] || 0;
    const nx = -dy / len;
    const ny = dx / len;
    const midX = (start.x + end.x) / 2 + nx * bow;
    const midY = (start.y + end.y) / 2 + ny * bow;
    winLinePath = `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
    winLineLength = len * 1.02;
  }

  let statusText;
  if (winnerInfo) statusText = `${names[winnerInfo.mark]} wins this round!`;
  else if (isDraw) statusText = "It's a draw!";
  else if (page === "online-playing") statusText = mySymbol === current ? "Your turn" : `Waiting for ${names[current]}…`;
  else statusText = `${names[current]}'s turn`;

  /* ============================================================
     Shared style block (used by every page)
     ============================================================ */
  const styles = (
    <style>{`
      .ttt-app{
        --paper:#f6f1e4; --paper-line:#e2d9c2; --ink:#24303d; --ink-soft:#5b6572;
        --x:#c1502e; --x-dk:#8f3a20; --o:#1f7a72; --o-dk:#155a54; --margin:#c1502e;
        min-height:100vh; width:100%;
        background:
          repeating-linear-gradient(0deg, transparent 0 27px, var(--paper-line) 27px 28px),
          var(--paper);
        font-family:'JetBrains Mono', monospace; color:var(--ink);
        display:flex; align-items:center; justify-content:center;
        padding:24px; box-sizing:border-box;
        -webkit-text-size-adjust:100%; text-size-adjust:100%;
        overscroll-behavior:contain;
      }
      .ttt-app *{ box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
      .ttt-app button{
        touch-action:manipulation; user-select:none; -webkit-user-select:none;
      }
      .ttt-app input{ touch-action:manipulation; }
      @media (max-width:480px){
        .ttt-app{ padding:14px; align-items:flex-start; }
      }
      .sheet{
        position:relative; width:100%; max-width:480px;
        background:var(--paper); border-radius:6px;
        box-shadow:0 18px 40px rgba(36,48,61,0.18), 0 2px 0 rgba(36,48,61,0.06);
        padding:clamp(20px,5vw,30px) clamp(18px,5vw,30px) clamp(18px,5vw,26px) clamp(28px,8vw,46px);
      }
      .sheet::before{
        content:""; position:absolute; left:clamp(18px,5vw,28px); top:0; bottom:0; width:1.5px; background:var(--margin); opacity:0.45;
      }
      h1{
        font-family:'Instrument Serif', serif; font-style:italic; font-weight:400;
        font-size:clamp(28px,8vw,38px); margin:0 0 2px; letter-spacing:0.3px; color:var(--ink);
      }
      .subtitle{ font-size:12px; color:var(--ink-soft); margin-bottom:20px; letter-spacing:0.3px; }
      .back-row{ margin-bottom:18px; margin-left:-10px; }
      .back-btn{
        display:inline-flex; align-items:center; gap:6px; background:transparent; border:none; cursor:pointer;
        font-family:'JetBrains Mono', monospace; font-weight:700; font-size:12px; color:var(--ink-soft);
        padding:10px; min-height:40px;
      }
      .back-btn:hover{ color:var(--ink); }
      .back-btn:active{ color:var(--ink); }

      .sound-toggle{
        position:absolute; top:16px; right:16px; z-index:5;
        width:36px; height:36px; border-radius:50%; border:1.5px solid var(--paper-line);
        background:rgba(36,48,61,0.04); color:var(--ink-soft); cursor:pointer;
        display:flex; align-items:center; justify-content:center; padding:0;
      }
      .sound-toggle:hover{ border-color:var(--ink-soft); color:var(--ink); }
      .sound-toggle:active{ background:rgba(36,48,61,0.1); }
      .sound-toggle svg{ width:17px; height:17px; }

      .home-choice{ display:flex; flex-direction:column; gap:14px; margin-top:8px; }
      .choice-card{
        display:flex; align-items:center; justify-content:space-between; gap:14px;
        background:rgba(36,48,61,0.04); border:1.5px solid var(--paper-line); border-radius:12px;
        padding:20px; cursor:pointer; text-align:left; font-family:'JetBrains Mono', monospace;
        transition:border-color .15s, transform .1s;
      }
      .choice-card:hover{ border-color:var(--ink-soft); transform:translateY(-1px); }
      .choice-card:active{ transform:translateY(0); }
      .choice-title{ font-size:16px; font-weight:700; color:var(--ink); margin-bottom:3px; }
      .choice-desc{ font-size:11.5px; color:var(--ink-soft); }
      .choice-arrow{ font-size:20px; color:var(--ink-soft); flex-shrink:0; }

      .names-row{ display:flex; align-items:center; gap:10px; margin-bottom:16px; }
      .name-field{ flex:1; display:flex; align-items:center; gap:8px; }
      .name-swatch{ width:10px; height:10px; border-radius:2px; flex-shrink:0; }
      .name-input{
        flex:1; min-width:0; background:transparent; border:none; border-bottom:1.5px dashed var(--paper-line);
        font-family:'JetBrains Mono', monospace; font-size:16px; font-weight:600; color:var(--ink);
        padding:6px 0; outline:none; min-height:32px;
      }
      .name-input:focus{ border-bottom-color:var(--ink-soft); }
      .vs{ font-size:11px; color:var(--ink-soft); font-weight:600; }

      .online-panel{
        background:rgba(36,48,61,0.04); border:1px solid var(--paper-line); border-radius:10px;
        padding:18px; margin-top:4px;
      }
      .online-label{ font-size:10.5px; text-transform:uppercase; letter-spacing:0.6px; color:var(--ink-soft); margin-bottom:6px; }
      .online-input{
        width:100%; background:var(--paper); border:1.5px solid var(--paper-line); border-radius:7px;
        font-family:'JetBrains Mono', monospace; font-size:16px; font-weight:600; color:var(--ink);
        padding:11px 10px; outline:none; margin-bottom:10px; min-height:44px;
      }
      .online-input:focus{ border-color:var(--ink-soft); }
      .online-input.code{ text-transform:uppercase; letter-spacing:3px; text-align:center; font-size:16px; }
      .online-actions{ display:flex; flex-direction:column; gap:12px; }
      .online-divider{ display:flex; align-items:center; gap:10px; color:var(--ink-soft); font-size:10.5px; margin:2px 0; }
      .online-divider::before, .online-divider::after{ content:""; flex:1; height:1px; background:var(--paper-line); }
      .join-row{ display:flex; gap:8px; }
      .join-row .online-input{ margin-bottom:0; }
      .join-error{ color:var(--x-dk); font-size:11.5px; margin-top:8px; }

      .room-badge{
        display:flex; align-items:center; justify-content:space-between; gap:10px;
        background:rgba(36,48,61,0.04); border:1px solid var(--paper-line); border-radius:9px;
        padding:12px 14px; margin-bottom:18px;
      }
      .room-badge-left{ display:flex; flex-direction:column; gap:2px; }
      .room-badge-label{ font-size:9.5px; text-transform:uppercase; letter-spacing:0.6px; color:var(--ink-soft); }
      .room-badge-code{ font-size:20px; font-weight:700; letter-spacing:3px; }
      .room-badge-you{ font-size:11px; color:var(--ink-soft); }
      .copy-btn{
        font-family:'JetBrains Mono', monospace; font-size:11px; font-weight:700; padding:8px 11px;
        border-radius:6px; border:1.5px solid var(--ink); background:transparent; color:var(--ink); cursor:pointer;
        min-height:40px;
      }
      .copy-btn:hover{ background:rgba(36,48,61,0.08); }
      .copy-btn:active{ background:rgba(36,48,61,0.14); }
      .leave-btn{
        font-family:'JetBrains Mono', monospace; font-size:11px; font-weight:700; padding:8px 11px;
        border-radius:6px; border:1.5px solid var(--x-dk); background:transparent; color:var(--x-dk); cursor:pointer;
        min-height:40px;
      }
      .leave-btn:hover{ background:rgba(193,80,46,0.08); }
      .leave-btn:active{ background:rgba(193,80,46,0.16); }

      .waiting-page{ text-align:center; padding:20px 6px; }
      .waiting-note{ font-size:13px; color:var(--ink-soft); margin-top:22px; }
      .waiting-spinner{
        width:34px; height:34px; margin:6px auto 0; border-radius:50%;
        border:3px solid var(--paper-line); border-top-color:var(--ink-soft);
        animation:spin 0.9s linear infinite;
      }
      @keyframes spin{ to{ transform:rotate(360deg); } }

      .score-row{
        display:flex; align-items:stretch; justify-content:space-between; gap:8px;
        margin-bottom:20px; padding:12px 14px; background:rgba(36,48,61,0.04);
        border-radius:8px; border:1px solid var(--paper-line);
      }
      .score-cell{ flex:1; text-align:center; }
      .score-num{ font-size:24px; font-weight:700; line-height:1; }
      .score-num.x{ color:var(--x); }
      .score-num.o{ color:var(--o); }
      .score-label{ font-size:9.5px; color:var(--ink-soft); text-transform:uppercase; letter-spacing:0.6px; margin-top:4px; }
      .score-div{ width:1px; background:var(--paper-line); }

      .status-row{
        display:flex; align-items:center; justify-content:center; gap:8px;
        font-size:13.5px; font-weight:600; margin-bottom:14px; min-height:20px;
      }
      .status-dot{ width:9px; height:9px; border-radius:2px; transform:rotate(45deg); }

      .board-wrap{ position:relative; width:100%; aspect-ratio:1/1; margin-bottom:20px; }
      .board{
        position:relative; z-index:1; width:100%; height:100%;
        display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(3,1fr);
        background:var(--ink); border-radius:10px; overflow:hidden; gap:2px;
        box-shadow:inset 0 0 0 2px var(--ink);
      }
      .board.locked{ opacity:0.55; }
      .cell{
        background:var(--paper); border:none; cursor:pointer;
        display:flex; align-items:center; justify-content:center; position:relative;
        padding:0;
      }
      .cell:disabled{ cursor:default; }
      .cell:not(:disabled):hover{ background:#efe7d3; }
      .cell:not(:disabled):active{ background:#e8dfc7; }
      .mark{ width:52%; height:52%; animation:markPop 0.28s cubic-bezier(.2,1.4,.4,1); }
      @keyframes markPop{ from{ transform:scale(0.3) rotate(-6deg); opacity:0; } to{ transform:scale(1) rotate(0deg); opacity:1; } }

      .win-overlay{ position:absolute; inset:0; z-index:2; pointer-events:none; overflow:visible; }
      .win-glow{ filter:blur(2.2px); animation:drawLine 0.45s cubic-bezier(.3,.9,.4,1) forwards 0.08s, glowPulse 1.8s ease-in-out 0.6s infinite; }
      .win-core{ animation:drawLine 0.45s cubic-bezier(.3,.9,.4,1) forwards 0.08s; filter:drop-shadow(0 1px 1px rgba(36,48,61,0.25)); }
      .win-dot{ opacity:0; animation:dotPop 0.25s ease forwards 0.5s; }
      @keyframes drawLine{ to{ stroke-dashoffset:0; } }
      @keyframes glowPulse{ 0%,100%{ opacity:0.45; } 50%{ opacity:0.75; } }
      @keyframes dotPop{ from{ opacity:0; transform:scale(0.3); } to{ opacity:1; transform:scale(1); } }

      .btn-row{ display:flex; gap:10px; }
      .btn{
        flex:1; font-family:'JetBrains Mono', monospace; font-weight:700; font-size:12.5px;
        letter-spacing:0.3px; padding:12px 14px; border-radius:8px; cursor:pointer; border:1.5px solid var(--ink);
        transition:transform .1s; min-height:46px;
      }
      .btn:active{ transform:translateY(1px); }
      .btn:disabled{ opacity:0.5; cursor:default; }
      .btn-primary{ background:var(--ink); color:var(--paper); }
      .btn-primary:hover{ background:#3a4756; }
      .btn-primary:active{ background:#3a4756; }
      .btn-ghost{ background:transparent; color:var(--ink); }
      .btn-ghost:hover{ background:rgba(36,48,61,0.06); }
      .btn-ghost:active{ background:rgba(36,48,61,0.1); }

      .history-row{ display:flex; gap:5px; justify-content:center; margin-top:16px; min-height:12px; }
      .history-chip{ width:9px; height:9px; border-radius:2px; }
      .history-chip.x{ background:var(--x); }
      .history-chip.o{ background:var(--o); }
      .history-chip.draw{ background:var(--ink-soft); }
    `}</style>
  );

  const soundToggle = (
    <button
      className="sound-toggle"
      onClick={() => setSoundOn((s) => !s)}
      aria-label={soundOn ? "Mute sound and haptics" : "Unmute sound and haptics"}
      title={soundOn ? "Sound & haptics on" : "Sound & haptics off"}
    >
      {soundOn ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="4,9 8,9 12,5 12,19 8,15 4,15" fill="currentColor" stroke="none" />
          <path d="M16 8.5c1 1 1.5 2.2 1.5 3.5s-.5 2.5-1.5 3.5" />
          <path d="M18.5 6c1.8 1.8 2.7 4 2.7 6s-.9 4.2-2.7 6" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="4,9 8,9 12,5 12,19 8,15 4,15" fill="currentColor" stroke="none" />
          <line x1="16" y1="9" x2="21" y2="14" />
          <line x1="21" y1="9" x2="16" y2="14" />
        </svg>
      )}
    </button>
  );

  /* ============================================================
     PAGE: home
     ============================================================ */
  if (page === "home") {
    return (
      <div className="ttt-app">
        {styles}
        <div className="sheet">
        {soundToggle}
          <h1>Tic-Tac-Toe</h1>
          <div className="subtitle">choose how you'd like to play</div>
          <div className="home-choice">
            <button className="choice-card" onClick={goToOffline}>
              <div>
                <div className="choice-title">Play Offline</div>
                <div className="choice-desc">Pass &amp; play on this device</div>
              </div>
              <span className="choice-arrow">→</span>
            </button>
            <button className="choice-card" onClick={() => { sfxNav(); setPage("online-menu"); }}>
              <div>
                <div className="choice-title">Play Online</div>
                <div className="choice-desc">Create or join a room with a code</div>
              </div>
              <span className="choice-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     PAGE: online-menu
     ============================================================ */
  if (page === "online-menu") {
    return (
      <div className="ttt-app">
        {styles}
        <div className="sheet">
        {soundToggle}
          <div className="back-row">
            <button className="back-btn" onClick={goHome}>← Back</button>
          </div>
          <h1>Play Online</h1>
          <div className="subtitle">create a room or join one with a code</div>
          <div className="online-panel">
            <div className="online-label">Your name</div>
            <input
              className="online-input"
              placeholder="e.g. Priya"
              value={yourName}
              maxLength={16}
              onChange={(e) => setYourName(e.target.value)}
            />
            <div className="online-actions">
              <button className="btn btn-primary" style={{ flex: "none" }} onClick={createRoom} disabled={busy}>
                Create Room
              </button>
              <div className="online-divider">or join one</div>
              <div className="join-row">
                <input
                  className="online-input code"
                  placeholder="CODE"
                  maxLength={4}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                />
                <button className="btn btn-ghost" style={{ flex: "none" }} onClick={joinRoom} disabled={busy}>
                  Join Room
                </button>
              </div>
              {joinError && <div className="join-error">{joinError}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     PAGE: online-waiting
     ============================================================ */
  if (page === "online-waiting") {
    return (
      <div className="ttt-app">
        {styles}
        <div className="sheet">
        {soundToggle}
          <div className="back-row">
            <button className="back-btn" onClick={goHome}>← Leave room</button>
          </div>
          <h1>Waiting Room</h1>
          <div className="subtitle">share this code with your opponent</div>
          <div className="room-badge">
            <div className="room-badge-left">
              <span className="room-badge-label">Room code</span>
              <span className="room-badge-code">{roomCode}</span>
              <span className="room-badge-you">You're playing as <strong>X</strong></span>
            </div>
            <button className="copy-btn" onClick={copyRoomCode}>{copyLabel}</button>
          </div>
          <div className="waiting-page">
            <div className="waiting-spinner" />
            <div className="waiting-note">Waiting for your opponent to join…</div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     PAGE: offline  /  online-playing  (the actual game board)
     ============================================================ */
  const isOnlineGame = page === "online-playing";
  const boardInteractive = isOnlineGame ? opponentPresent : true;

  return (
    <div className="ttt-app">
      {styles}
      <div className="sheet">
        {soundToggle}
        <div className="back-row">
          <button className="back-btn" onClick={goHome}>{isOnlineGame ? "← Leave room" : "← Back"}</button>
        </div>
        <h1>Tic-Tac-Toe</h1>
        <div className="subtitle">
          {isOnlineGame ? "playing online — first to three in a row wins the round" : "pass & play — first to three in a row wins the round"}
        </div>

        {isOnlineGame ? (
          <div className="room-badge">
            <div className="room-badge-left">
              <span className="room-badge-label">Room code</span>
              <span className="room-badge-code">{roomCode}</span>
              <span className="room-badge-you">
                You're playing as <strong>{mySymbol}</strong> ({names[mySymbol] || "you"})
              </span>
            </div>
            <button className="copy-btn" onClick={copyRoomCode}>{copyLabel}</button>
          </div>
        ) : (
          <div className="names-row">
            <div className="name-field">
              <span className="name-swatch" style={{ background: "var(--x)" }} />
              <input
                className="name-input"
                value={names.X}
                maxLength={16}
                onChange={(e) => setNames((n) => ({ ...n, X: e.target.value || "Player X" }))}
              />
            </div>
            <span className="vs">vs</span>
            <div className="name-field">
              <span className="name-swatch" style={{ background: "var(--o)" }} />
              <input
                className="name-input"
                value={names.O}
                maxLength={16}
                onChange={(e) => setNames((n) => ({ ...n, O: e.target.value || "Player O" }))}
              />
            </div>
          </div>
        )}

        <div className="score-row">
          <div className="score-cell">
            <div className="score-num x">{scores.X}</div>
            <div className="score-label">{names.X}</div>
          </div>
          <div className="score-div" />
          <div className="score-cell">
            <div className="score-num" style={{ color: "var(--ink-soft)" }}>{scores.draws}</div>
            <div className="score-label">Draws</div>
          </div>
          <div className="score-div" />
          <div className="score-cell">
            <div className="score-num o">{scores.O}</div>
            <div className="score-label">{names.O}</div>
          </div>
        </div>

        <div className="status-row">
          {!gameOver && (
            <span className="status-dot" style={{ background: current === "X" ? "var(--x)" : "var(--o)" }} />
          )}
          <span>{statusText}</span>
        </div>

        <div className="board-wrap">
          <div className={"board" + (!boardInteractive ? " locked" : "")}>
            {board.map((mark, i) => {
              const isWinCell = winnerInfo && winnerInfo.line.includes(i);
              const cellDisabled =
                !!mark || gameOver || !boardInteractive || (isOnlineGame && mySymbol !== current);
              return (
                <button
                  key={i}
                  className="cell"
                  disabled={cellDisabled}
                  onClick={() => handleCellClick(i)}
                  aria-label={`Cell ${i + 1}${mark ? `, ${mark}` : ", empty"}`}
                >
                  {mark === "X" && (
                    <svg className="mark" viewBox="0 0 100 100" style={{ transform: `rotate(${JITTER[i]}deg)` }}>
                      <line x1="18" y1="18" x2="82" y2="82" stroke="var(--x)" strokeWidth="11" strokeLinecap="round" opacity={isWinCell || !winnerInfo ? 1 : 0.35} />
                      <line x1="82" y1="18" x2="18" y2="82" stroke="var(--x)" strokeWidth="11" strokeLinecap="round" opacity={isWinCell || !winnerInfo ? 1 : 0.35} />
                    </svg>
                  )}
                  {mark === "O" && (
                    <svg className="mark" viewBox="0 0 100 100" style={{ transform: `rotate(${JITTER[i]}deg)` }}>
                      <circle cx="50" cy="50" r="34" fill="none" stroke="var(--o)" strokeWidth="11" strokeLinecap="round" opacity={isWinCell || !winnerInfo ? 1 : 0.35} />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          {winLineCoords && (
            <svg className="win-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
              {(() => {
                const dk = winnerInfo.mark === "X" ? "var(--x-dk)" : "var(--o-dk)";
                const glowColor = winnerInfo.mark === "X" ? "var(--x)" : "var(--o)";
                return (
                  <g key={winnerInfo.line.join(",")}>
                    <path d={winLinePath} className="win-glow" fill="none" stroke={glowColor} strokeWidth="7" strokeLinecap="round"
                      style={{ strokeDasharray: winLineLength, strokeDashoffset: winLineLength }} />
                    <path d={winLinePath} className="win-core" fill="none" stroke={dk} strokeWidth="3.4" strokeLinecap="round"
                      style={{ strokeDasharray: winLineLength, strokeDashoffset: winLineLength }} />
                    <circle className="win-dot" cx={winLineCoords.start.x} cy={winLineCoords.start.y} r="2.1" fill={dk} />
                    <circle className="win-dot" cx={winLineCoords.end.x} cy={winLineCoords.end.y} r="2.1" fill={dk} />
                  </g>
                );
              })()}
            </svg>
          )}
        </div>

        <div className="btn-row">
          <button className="btn btn-primary" onClick={newRound}>
            {gameOver ? "Next Round" : "Restart Round"}
          </button>
          <button className="btn btn-ghost" onClick={resetMatch}>
            Reset Match
          </button>
        </div>

        <div className="history-row">
          {history.map((h, idx) => (
            <span
              key={idx}
              className={"history-chip " + (h.type === "draw" ? "draw" : h.mark.toLowerCase())}
              title={h.type === "draw" ? "Draw" : `${h.mark} won`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
