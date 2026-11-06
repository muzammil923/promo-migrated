import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Swords, Puzzle, LineChart, Trophy, MessageSquare,
  User, Play, Bot, Link2, Clock, Flag, RotateCcw, Home,
  ChevronLeft, ChevronRight, X, Check, Crown, Flame, Star, Sparkles,
  Copy, Repeat, Download, Share2,
  Target, Award, Medal, Info, Lightbulb, ShieldCheck, Send,
  Menu, SkipBack, SkipForward, Timer, ListChecks, Gem, Lock
} from "lucide-react";
import api from "../../apps/frontend/src/api";
import { AvatarDisplay } from "../../apps/frontend/src/components/AvatarData";
import { selectBotForDifficulty, calculateThinkTime, evaluatePosition, scoreMoveWithPersonality, getThinkingBubble, selectHumanLikeMove } from "./botBrain";
import { loadPlayerModel, updatePlayerModel, createLiveTracker, recordMove, getAdaptiveStrategy } from "./playerModel";

let moveAudio = null;
function playMoveSound() {
  try {
    if (!moveAudio) {
      moveAudio = new Audio("/move-sound.mp3");
      moveAudio.volume = 0.6;
    }
    moveAudio.currentTime = 0;
    moveAudio.play().catch(() => {});
  } catch (e) { /* audio unavailable */ }
}

// Persistent guest device identity — used for play-count sessions.
function getDeviceId() {
  try {
    let id = localStorage.getItem("device_id");
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) || ("d-" + Date.now() + "-" + Math.random().toString(36).slice(2));
      localStorage.setItem("device_id", id);
    }
    return id;
  } catch {
    return null;
  }
}

// Logged-in player id (promo_players.id) stored by the auth flow — needed on
// the session so /play/session/complete can award Promo Coins (PC).
function getPromoPlayerId() {
  try {
    const raw = localStorage.getItem("playerUser") || sessionStorage.getItem("playerUser");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return (u && u.id) || null;
  } catch {
    return null;
  }
}

/* ============================================================================
   CHESSVERSE — "Play. Learn. Conquer."
   The board engine below is untouched. Everything about the *player* — rating,
   history, streaks, badges, opponents, tournaments — is now derived from real
   play and persisted via window.storage, instead of hardcoded fixtures.
   ============================================================================ */

/* ---------------------------------------------------------------------------
   CHESS ENGINE — self-contained rules implementation (UNCHANGED)
   board[row][col], row 0 = rank 8 (black home rank), col 0 = file a
--------------------------------------------------------------------------- */

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

function initialBoard() {
  const back = ["r", "n", "b", "q", "k", "b", "n", "r"];
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: back[c], color: "b" };
    board[1][c] = { type: "p", color: "b" };
    board[6][c] = { type: "p", color: "w" };
    board[7][c] = { type: back[c], color: "w" };
  }
  return board;
}

function cloneBoard(b) {
  return b.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function sq(r, c) {
  return FILES[c] + (8 - r);
}

/* ─── FEN <-> Board conversion ───────────────────────────────────────────── */
function boardToFen(board, turn, castling, enPassant) {
  // Piece placement
  let placement = "";
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) {
        empty++;
      } else {
        if (empty > 0) { placement += empty; empty = 0; }
        const piece = p.type === "k" ? "k" : p.type === "q" ? "q" : p.type === "r" ? "r" : p.type === "b" ? "b" : p.type === "n" ? "n" : "p";
        placement += p.color === "w" ? piece.toUpperCase() : piece;
      }
    }
    if (empty > 0) placement += empty;
    if (r < 7) placement += "/";
  }
  
  // Active color
  const active = turn === "w" ? "w" : "b";
  
  // Castling rights
  let castle = "";
  if (castling.w.k) castle += "K";
  if (castling.w.q) castle += "Q";
  if (castling.b.k) castle += "k";
  if (castling.b.q) castle += "q";
  if (!castle) castle = "-";
  
  // En passant
  const ep = enPassant ? sq(enPassant.r, enPassant.c) : "-";
  
  return `${placement} ${active} ${castle} ${ep} 0 1`;
}

function fenToBoard(fen) {
  const [placement] = fen.split(" ");
  const rows = placement.split("/");
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  
  const pieceMap = {
    "K": { type: "k", color: "w" }, "Q": { type: "q", color: "w" }, "R": { type: "r", color: "w" },
    "B": { type: "b", color: "w" }, "N": { type: "n", color: "w" }, "P": { type: "p", color: "w" },
    "k": { type: "k", color: "b" }, "q": { type: "q", color: "b" }, "r": { type: "r", color: "b" },
    "b": { type: "b", color: "b" }, "n": { type: "n", color: "b" }, "p": { type: "p", color: "b" },
  };
  
  for (let r = 0; r < 8; r++) {
    const row = rows[r];
    let c = 0;
    for (const char of row) {
      if (/\d/.test(char)) {
        c += parseInt(char);
      } else if (pieceMap[char]) {
        board[r][c] = { ...pieceMap[char] };
        c++;
      }
    }
  }
  return board;
}

function fenToTurn(fen) {
  const parts = fen.split(" ");
  return parts[1] || "w";
}

function fenToCastling(fen) {
  const parts = fen.split(" ");
  const castle = parts[2] || "KQkq";
  return {
    w: { k: castle.includes("K"), q: castle.includes("Q") },
    b: { k: castle.includes("k"), q: castle.includes("q") },
  };
}

function fenToEnPassant(fen) {
  const parts = fen.split(" ");
  const ep = parts[3];
  if (!ep || ep === "-") return null;
  // ep is like "e3" - convert to row, col
  const col = ep.charCodeAt(0) - 97;
  const row = 8 - parseInt(ep[1]);
  if (inBounds(row, col)) return { r: row, c: col };
  return null;
}

function diffMoveSquares(oldBoard, newBoard) {
  const appeared = [];
  const disappeared = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const o = oldBoard[r][c];
      const n = newBoard[r][c];
      if (o && !n) disappeared.push({ r, c, p: o });
      if (!o && n) appeared.push({ r, c, p: n });
    }
  }
  if (appeared.length === 0) return null;
  // Castling: it animates better when the king leads the way
  const king = appeared.find((t) => t.p.type === "k");
  if (king) {
    const kFrom = disappeared.find((d) => d.p.type === "k");
    if (kFrom) return { from: { r: kFrom.r, c: kFrom.c }, to: { r: king.r, c: king.c } };
  }
  // Normal moves, captures, en passant, promotion
  for (const t of appeared) {
    const f = disappeared.find((d) => d.p.color === t.p.color && d.p.type === t.p.type);
    if (f) return { from: { r: f.r, c: f.c }, to: { r: t.r, c: t.c } };
  }
  for (const t of appeared) {
    const f = disappeared.find((d) => d.p.color === t.p.color);
    if (f) return { from: { r: f.r, c: f.c }, to: { r: t.r, c: t.c } };
  }
  const to = appeared[0];
  const from = disappeared[0];
  return from ? { from: { r: from.r, c: from.c }, to: { r: to.r, c: to.c } } : { from: null, to: { r: to.r, c: to.c } };
}

const SLIDING = {
  b: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
  r: [[-1, 0], [1, 0], [0, -1], [0, 1]],
  q: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
};
const KNIGHT_DELTAS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KING_DELTAS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

function isSquareAttacked(board, r, c, byColor) {
  const pawnDir = byColor === "w" ? 1 : -1;
  for (const dc of [-1, 1]) {
    const pr = r + pawnDir, pc = c + dc;
    if (inBounds(pr, pc)) {
      const p = board[pr][pc];
      if (p && p.type === "p" && p.color === byColor) return true;
    }
  }
  for (const [dr, dc] of KNIGHT_DELTAS) {
    const nr = r + dr, nc = c + dc;
    if (inBounds(nr, nc)) {
      const p = board[nr][nc];
      if (p && p.type === "n" && p.color === byColor) return true;
    }
  }
  for (const [dr, dc] of KING_DELTAS) {
    const nr = r + dr, nc = c + dc;
    if (inBounds(nr, nc)) {
      const p = board[nr][nc];
      if (p && p.type === "k" && p.color === byColor) return true;
    }
  }
  for (const [dr, dc] of SLIDING.b) {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      const p = board[nr][nc];
      if (p) {
        if (p.color === byColor && (p.type === "b" || p.type === "q")) return true;
        break;
      }
      nr += dr; nc += dc;
    }
  }
  for (const [dr, dc] of SLIDING.r) {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      const p = board[nr][nc];
      if (p) {
        if (p.color === byColor && (p.type === "r" || p.type === "q")) return true;
        break;
      }
      nr += dr; nc += dc;
    }
  }
  return false;
}

function findKing(board, color) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === "k" && p.color === color) return { r, c };
    }
  return null;
}

function pseudoMovesFor(board, r, c, state) {
  const piece = board[r][c];
  if (!piece) return [];
  const moves = [];
  const opp = piece.color === "w" ? "b" : "w";
  const push = (nr, nc, extra = {}) => {
    if (!inBounds(nr, nc)) return;
    const target = board[nr][nc];
    if (target && target.color === piece.color) return;
    moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: !!target, ...extra });
  };

  if (piece.type === "p") {
    const dir = piece.color === "w" ? -1 : 1;
    const startRow = piece.color === "w" ? 6 : 1;
    const promoRow = piece.color === "w" ? 0 : 7;
    if (inBounds(r + dir, c) && !board[r + dir][c]) {
      if (r + dir === promoRow) {
        for (const promo of ["q", "r", "b", "n"]) push(r + dir, c, { promotion: promo });
      } else {
        push(r + dir, c);
      }
      if (r === startRow && !board[r + 2 * dir][c]) {
        push(r + 2 * dir, c, { doubleStep: true });
      }
    }
    for (const dc of [-1, 1]) {
      const nr = r + dir, nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      const target = board[nr][nc];
      if (target && target.color === opp) {
        if (nr === promoRow) {
          for (const promo of ["q", "r", "b", "n"]) moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: true, promotion: promo });
        } else {
          moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: true });
        }
      } else if (state.enPassant && state.enPassant.r === nr && state.enPassant.c === nc) {
        moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: true, enPassant: true });
      }
    }
    return moves;
  }

  if (piece.type === "n") {
    for (const [dr, dc] of KNIGHT_DELTAS) push(r + dr, c + dc);
    return moves;
  }

  if (piece.type === "k") {
    for (const [dr, dc] of KING_DELTAS) push(r + dr, c + dc);
    const home = piece.color === "w" ? 7 : 0;
    if (r === home && c === 4) {
      const rights = state.castling[piece.color];
      if (rights.k && !board[home][5] && !board[home][6] && board[home][7]?.type === "r") {
        if (
          !isSquareAttacked(board, home, 4, opp) &&
          !isSquareAttacked(board, home, 5, opp) &&
          !isSquareAttacked(board, home, 6, opp)
        ) {
          moves.push({ from: { r, c }, to: { r: home, c: 6 }, castle: "k" });
        }
      }
      if (rights.q && !board[home][3] && !board[home][2] && !board[home][1] && board[home][0]?.type === "r") {
        if (
          !isSquareAttacked(board, home, 4, opp) &&
          !isSquareAttacked(board, home, 3, opp) &&
          !isSquareAttacked(board, home, 2, opp)
        ) {
          moves.push({ from: { r, c }, to: { r: home, c: 2 }, castle: "q" });
        }
      }
    }
    return moves;
  }

  const dirs = SLIDING[piece.type];
  for (const [dr, dc] of dirs) {
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc)) {
      const target = board[nr][nc];
      if (!target) {
        moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: false });
      } else {
        if (target.color !== piece.color) moves.push({ from: { r, c }, to: { r: nr, c: nc }, capture: true });
        break;
      }
      nr += dr; nc += dc;
    }
  }
  return moves;
}

function applyMove(board, state, move) {
  const nb = cloneBoard(board);
  const piece = nb[move.from.r][move.from.c];
  const captured = nb[move.to.r][move.to.c];
  let enPassantCaptured = null;

  if (move.enPassant) {
    enPassantCaptured = nb[move.from.r][move.to.c];
    nb[move.from.r][move.to.c] = null;
  }

  nb[move.to.r][move.to.c] = move.promotion ? { type: move.promotion, color: piece.color } : piece;
  nb[move.from.r][move.from.c] = null;

  if (move.castle) {
    const home = move.from.r;
    if (move.castle === "k") {
      nb[home][5] = nb[home][7];
      nb[home][7] = null;
    } else {
      nb[home][3] = nb[home][0];
      nb[home][0] = null;
    }
  }

  const castling = {
    w: { ...state.castling.w },
    b: { ...state.castling.b },
  };
  if (piece.type === "k") {
    castling[piece.color].k = false;
    castling[piece.color].q = false;
  }
  if (piece.type === "r") {
    if (move.from.c === 0) castling[piece.color].q = false;
    if (move.from.c === 7) castling[piece.color].k = false;
  }
  if (captured && captured.type === "r") {
    if (move.to.c === 0) castling[captured.color].q = false;
    if (move.to.c === 7) castling[captured.color].k = false;
  }

  const enPassant =
    move.doubleStep ? { r: (move.from.r + move.to.r) / 2, c: move.from.c } : null;

  const takenPiece = move.enPassant ? enPassantCaptured : captured;

  return { board: nb, castling, enPassant, takenPiece, piece };
}

function getLegalMoves(board, color, state) {
  const all = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        const pseudo = pseudoMovesFor(board, r, c, state);
        for (const m of pseudo) {
          const { board: nb } = applyMove(board, state, m);
          const kingPos = findKing(nb, color);
          if (kingPos && !isSquareAttacked(nb, kingPos.r, kingPos.c, color === "w" ? "b" : "w")) {
            all.push(m);
          }
        }
      }
    }
  return all;
}

function legalMovesFrom(board, r, c, state) {
  const p = board[r][c];
  if (!p) return [];
  const pseudo = pseudoMovesFor(board, r, c, state);
  return pseudo.filter((m) => {
    const { board: nb } = applyMove(board, state, m);
    const kingPos = findKing(nb, p.color);
    return kingPos && !isSquareAttacked(nb, kingPos.r, kingPos.c, p.color === "w" ? "b" : "w");
  });
}

function pieceValue(type) {
  return { p: 1, n: 3, b: 3.1, r: 5, q: 9, k: 0 }[type] || 0;
}

function materialScore(board, color) {
  let score = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) score += (p.color === color ? 1 : -1) * pieceValue(p.type);
    }
  return score;
}

/* ── Insufficient mating material (used for timeout draw handling) ─────────
   Standard rule: if a player runs out of time, the opponent wins — UNLESS the
   opponent has no possible mating material, in which case the game is a draw.
   This helper reports whether `color` still has the material to deliver
   checkmate by any possible series of legal moves. */
function hasMatingMaterial(board, color) {
  let minors = 0;
  let bishopSquares = [];
  let hasMajor = false;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== color || p.type === "k") continue;
      const t = p.type;
      if (t === "p" || t === "r" || t === "q") { hasMajor = true; break; }
      if (t === "n") { minors += 1; }
      if (t === "b") { bishopSquares.push((r + c) % 2 === 0 ? "light" : "dark"); minors += 1; }
    }
    if (hasMajor) break;
  }
  if (hasMajor) return true;

  // Count the opponent's remaining non-king material.
  let oppMaterial = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color !== color && p.type !== "k") oppMaterial++;
    }
  // If the opponent still has material, the side in question can in principle mate.
  if (oppMaterial > 0) return true;

  // Bare-king opponent: can this side mate a lone king?
  if (minors === 0) return false;                                            // K vs K
  if (minors === 1) return false;                                            // K + single minor vs K
  if (minors === 2 && bishopSquares.length === 2 && bishopSquares[0] === bishopSquares[1]) return false; // same-colour bishops
  return true;                                                               // K+N+N, K+N+B, opposite-colour bishops, etc.
}

/* ── Unified chess clock engine (timestamp-based) ──────────────────────────
   Time is tracked in milliseconds internally. A tick loop only refreshes the
   displayed seconds; the authoritative remaining time is computed from real
   elapsed wall-clock time stored when a clock is started. This avoids drift,
   throttling and duplicate-interval inaccuracies. */
function freezeClock(clockMs, activePlayer, startTs) {
  if (!activePlayer || !startTs) return clockMs;
  const now = performance.now();
  const remaining = clockMs[activePlayer] - (now - startTs);
  return { ...clockMs, [activePlayer]: Math.max(0, remaining) };
}

function sanFor(board, state, move) {
  const piece = board[move.from.r][move.from.c];
  if (move.castle === "k") return "O-O";
  if (move.castle === "q") return "O-O-O";
  const pieceLetter = { p: "", n: "N", b: "B", r: "R", q: "Q", k: "K" }[piece.type];
  const capture = move.capture ? "x" : "";
  const fromFile = piece.type === "p" && move.capture ? FILES[move.from.c] : "";
  let str = `${pieceLetter}${fromFile}${capture}${sq(move.to.r, move.to.c)}`;
  if (move.promotion) str += `=${move.promotion.toUpperCase()}`;
  return str;
}

function chooseComputerMove(board, color, state, difficulty = 1, blunderChance = 0.2, drawSeeking = false) {
  const moves = getLegalMoves(board, color, state);
  if (moves.length === 0) return null;

  if (Math.random() < blunderChance) {
    const casualPicks = moves.filter((m) => !m.capture || Math.random() < 0.4);
    const pool = casualPicks.length ? casualPicks : moves;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  let best = [];
  let bestScore = -Infinity;
  for (const m of moves) {
    const { board: nb } = applyMove(board, state, m);
    let score = materialScore(nb, color);
    if (m.capture) score += 0.15;
    if (m.promotion === "q") score += 0.5;
    if (drawSeeking) score -= Math.abs(materialScore(nb, "w")) * 0.35;
    score += (Math.random() - 0.5) * (difficulty === 1 ? 1.8 : difficulty === 2 ? 1.5 : 0.6);
    if (score > bestScore) {
      bestScore = score;
      best = [m];
    } else if (score === bestScore) {
      best.push(m);
    }
  }
  return best[Math.floor(Math.random() * best.length)];
}

// Depth-limited minimax search used for Hard bot mode — the bot evaluates its
// own move plus the human's best reply, making it measurably stronger than the
// one-ply heuristic above. White maximizes its material edge, black minimizes.
function minimaxScore(board, color, state, depth) {
  const moves = getLegalMoves(board, color, state);
  if (depth <= 0 || moves.length === 0) {
    return materialScore(board, "w") - materialScore(board, "b");
  }
  const opp = color === "w" ? "b" : "w";
  if (color === "w") {
    let best = -Infinity;
    for (const m of moves) {
      const res = applyMove(board, state, m);
      best = Math.max(best, minimaxScore(res.board, opp, res, depth - 1));
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    const res = applyMove(board, state, m);
    best = Math.min(best, minimaxScore(res.board, opp, res, depth - 1));
  }
  return best;
}

function chooseStrongComputerMove(board, color, state, depth = 2) {
  const moves = getLegalMoves(board, color, state);
  if (moves.length === 0) return null;
  const opp = color === "w" ? "b" : "w";
  let best = [];
  let bestScore = color === "w" ? -Infinity : Infinity;
  for (const m of moves) {
    const res = applyMove(board, state, m);
    const score = minimaxScore(res.board, opp, res, depth - 1);
    if (score === bestScore) {
      best.push(m);
    } else if ((color === "w" && score > bestScore) || (color === "b" && score < bestScore)) {
      bestScore = score;
      best = [m];
    }
  }
  return best[Math.floor(Math.random() * best.length)];
}

function premoveThresholdSeconds(baseMinutes) {
  return (baseMinutes * 60) / 3;
}

const THINK_TIME_OPTIONS_SECONDS = [1, 2, 3, 5, 6, 3, 4, 2];

function estimateThinkTime(remainingMs = Infinity) {
  const pick = THINK_TIME_OPTIONS_SECONDS[Math.floor(Math.random() * THINK_TIME_OPTIONS_SECONDS.length)];
  const jitterMs = Math.random() * 500 - 150;
  const raw = pick * 1000 + jitterMs;
  return Math.max(500, Math.min(raw, remainingMs * 0.5));
}

function rollOutcomeBias() {
  const roll = Math.random();
  if (roll < 0.6) return "player";
  if (roll < 0.9) return "bot";
  return "draw";
}

/* ---------------------------------------------------------------------------
   BOT REACTION SYSTEM — cosmetic dialogue layer (zero game-logic influence)
--------------------------------------------------------------------------- */
const BOT_REACTIONS = {
  pools: {
    brilliant: [
      "Whoa. Nice find.",
      "That was actually really good.",
      "Okay... you've got my attention.",
      "Clever.",
      "I almost missed that.",
      "That's a strong move.",
      "Wow, didn't see that coming.",
      "Alright, I'm impressed.",
      "Sharp play.",
      "That was surgical.",
    ],
    excellent: [
      "Nice move.",
      "Okay, I see you 👀",
      "That was clean.",
      "Interesting...",
      "Good one.",
      "Didn't expect that.",
      "You're making this difficult.",
      "Strong play.",
      "Well calculated.",
      "That was precise.",
    ],
    good: [
      "Not bad.",
      "Solid.",
      "Okay.",
      "I see what you're doing.",
      "Fair enough.",
      "That works.",
      "Decent move.",
      "You're thinking ahead.",
    ],
    normal: [
      "Hmm.",
      "Okay.",
      "Interesting.",
      "I see.",
      "Let's go.",
      "Sure.",
      "Right.",
      "Noted.",
    ],
    inaccuracy: [
      "Interesting choice...",
      "Are you sure about that?",
      "Hmm...",
      "I'll take it.",
      "That gives me an idea.",
      "Let's see where this goes.",
      "If you say so.",
      "Bold.",
    ],
    mistake: [
      "Oh...",
      "You might regret that.",
      "I think you left something open.",
      "Was that intentional?",
      "I won't complain 😏",
      "Thanks.",
      "I was hoping for that.",
      "That helps me.",
    ],
    blunder: [
      "Ouch.",
      "That's gonna hurt.",
      "I think you dropped something.",
      "Are you okay?",
      "I'll definitely take that.",
      "That was free.",
      "Didn't expect a gift.",
      "Well, I appreciate that.",
    ],
    check: [
      "Check? Already?",
      "Okay, okay...",
      "I saw that coming. Mostly.",
      "Getting aggressive, are we?",
      "Nice pressure.",
      "Watch it.",
      "I see the check.",
    ],
    promotion: [
      "A queen? Bold.",
      "New queen on the board.",
      "Promoted. Respect.",
      "That's a power move.",
    ],
    captureQueen: [
      "Ouch. That queen was important.",
      "There goes my queen.",
      "You really wanted that one, huh?",
      "I need to be more careful.",
      "That queen served me well.",
      "Okay... that hurt.",
    ],
    captureRook: [
      "There goes my rook.",
      "Ouch.",
      "You took my rook.",
      "That's a big piece.",
      "I'll remember that.",
    ],
    captureMinor: [
      "Good capture.",
      "Okay, that's fair.",
      "You got one.",
      "Noted.",
      "I'll recover from that.",
    ],
    capturePawn: [
      "A pawn?",
      "Sure.",
      "Go ahead.",
      "Every bit counts, huh?",
    ],
    playerWin: [
      "Well played.",
      "You got me.",
      "Okay, that was good.",
      "GG. You earned that.",
      "Rematch?",
      "Impressive finish.",
      "You were on fire.",
    ],
    botWin: [
      "Good game.",
      "That was close.",
      "Nice fight.",
      "GG.",
      "Want another one?",
      "Better luck next time.",
      "You'll get me next time.",
    ],
    draw: [
      "Fair enough.",
      "Looks like we're even.",
      "I'll take the draw.",
      "GG.",
      "Nobody wins, nobody loses.",
      "Evenly matched.",
    ],
    timeWin: [
      "Good game. Time pressure is real.",
      "You played fast.",
      "GG. The clock was the decider.",
    ],
    timeLoss: [
      "Time got me.",
      "I ran out of time. GG.",
      "Flag fell. Well played.",
    ],
    resignation: [
      "Good game.",
      "GG.",
      "You fought well.",
    ],
  },
};

function pickRandom(arr, recent) {
  if (!arr || arr.length === 0) return null;
  const available = arr.filter((m) => !recent.includes(m));
  const pool = available.length > 0 ? available : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

const PIECE_VALUES = { p: 1, n: 3, b: 3.1, r: 5, q: 9, k: 0 };

function classifyMove(evalBefore, evalAfter, move, playerColor) {
  const perspective = playerColor === "w" ? 1 : -1;
  const delta = (evalAfter - evalBefore) * perspective;

  let classification = "normal";
  if (delta >= 4.0) classification = "brilliant";
  else if (delta >= 2.0) classification = "excellent";
  else if (delta >= 0.5) classification = "good";
  else if (delta <= -5.0) classification = "blunder";
  else if (delta <= -3.0) classification = "mistake";
  else if (delta <= -1.5) classification = "inaccuracy";

  if (move.capture) {
    const capturedVal = PIECE_VALUES[move.capture] || 0;
    if (capturedVal >= 9 && classification !== "blunder") classification = "excellent";
    if (capturedVal >= 5 && delta >= 1.0 && classification !== "brilliant") classification = "excellent";
  }

  return classification;
}

function getBotReaction({
  moveQuality,
  isCheck,
  isCheckmate,
  isPromotion,
  capturedPiece,
  gameOutcome,
  triggerOnTime,
  playerResigned,
  recentMessages,
}) {
  const roll = Math.random();

  if (gameOutcome) {
    if (playerResigned) return pickRandom(BOT_REACTIONS.pools.resignation, recentMessages);
    if (triggerOnTime) {
      return pickRandom(
        gameOutcome === "win" ? BOT_REACTIONS.pools.timeWin : BOT_REACTIONS.pools.timeLoss,
        recentMessages
      );
    }
    if (isCheckmate) {
      return pickRandom(
        gameOutcome === "win" ? BOT_REACTIONS.pools.playerWin : BOT_REACTIONS.pools.botWin,
        recentMessages
      );
    }
    return pickRandom(BOT_REACTIONS.pools.draw, recentMessages);
  }

  if (isPromotion && roll < 0.85) return pickRandom(BOT_REACTIONS.pools.promotion, recentMessages);

  if (capturedPiece === "q" && roll < 0.85) return pickRandom(BOT_REACTIONS.pools.captureQueen, recentMessages);
  if (capturedPiece === "r" && roll < 0.7) return pickRandom(BOT_REACTIONS.pools.captureRook, recentMessages);
  if (capturedPiece === "b" || capturedPiece === "n") {
    if (roll < 0.6) return pickRandom(BOT_REACTIONS.pools.captureMinor, recentMessages);
  }
  if (capturedPiece === "p" && roll < 0.5) return pickRandom(BOT_REACTIONS.pools.capturePawn, recentMessages);

  if (isCheck && roll < 0.8) return pickRandom(BOT_REACTIONS.pools.check, recentMessages);

  const qualityThresholds = { brilliant: 0.85, excellent: 0.8, good: 0.5, normal: 0.45, inaccuracy: 0.7, mistake: 0.7, blunder: 0.75 };
  const threshold = qualityThresholds[moveQuality] || 0.45;
  if (roll < threshold) return pickRandom(BOT_REACTIONS.pools[moveQuality] || BOT_REACTIONS.pools.normal, recentMessages);

  return null;
}

/* ---------------------------------------------------------------------------
   PIECE GLYPHS (board rendering — unchanged)
--------------------------------------------------------------------------- */
const GLYPHS = {
  w: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

/* ---------------------------------------------------------------------------
   CONFIG / CONTENT — legitimate static content (time controls, puzzle
   levels, quick-chat phrases, nav). Not user data, so these stay as-is.
--------------------------------------------------------------------------- */
const TIME_CONTROLS = [
  { label: "1 min", sub: "Bullet", base: 1, inc: 0 },
  { label: "2 | 1", sub: "Bullet", base: 2, inc: 1 },
  { label: "3 min", sub: "Blitz", base: 3, inc: 0 },
  { label: "3 | 2", sub: "Blitz", base: 3, inc: 2 },
  { label: "5 min", sub: "Blitz", base: 5, inc: 0 },
  { label: "5 | 3", sub: "Blitz", base: 5, inc: 3 },
  { label: "10 min", sub: "Rapid", base: 10, inc: 0 },
  { label: "15 | 10", sub: "Rapid", base: 15, inc: 10 },
  { label: "30 min", sub: "Classical", base: 30, inc: 0 },
];

const QUICK_MESSAGES = [
  "Good luck!",
  "Have fun!",
  "Well played",
  "Thanks!",
  "Good game",
  "Oops!",
  "Nice move",
  "One moment please",
];

const BOT_CHAT_CATEGORIES = [
  {
    label: "Reactions",
    msgs: [
      "Nice move.",
      "Good one.",
      "Solid.",
      "Interesting...",
      "Okay, I see you 👀",
      "Not bad.",
      "Sharp play.",
      "Bold.",
    ],
  },
  {
    label: "Captures",
    msgs: [
      "Ouch.",
      "Good capture.",
      "You took my rook.",
      "That was free.",
      "A pawn?",
      "I'll remember that.",
    ],
  },
  {
    label: "Chat",
    msgs: [
      "GG.",
      "Well played.",
      "You got me.",
      "Rematch?",
      "Let's go.",
      "Thanks.",
    ],
  },
];

const NAV_ITEMS = [
  { id: "play", label: "Play", icon: Swords },
  { id: "puzzles", label: "Puzzles", icon: Puzzle },
  { id: "profile", label: "Profile", icon: User },
];

/* ---------------------------------------------------------------------------
   PERSISTENT STORAGE HELPERS
--------------------------------------------------------------------------- */
async function storageGet(key, fallback) {
  // window.storage is the mobile-app bridge (Capacitor-style). When it's
  // absent (plain browser / dev), fall back to localStorage so nothing breaks.
  try {
    if (window.storage && window.storage.get) {
      const res = await window.storage.get(key, false);
      if (res && res.value !== undefined && res.value !== null && res.value !== "") return JSON.parse(res.value);
    }
  } catch (e) { /* fall through to localStorage */ }
  try {
    const raw = localStorage.getItem("cv:" + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
async function storageSet(key, value) {
  try {
    if (window.storage && window.storage.set) {
      await window.storage.set(key, JSON.stringify(value), false);
      return;
    }
  } catch (e) { /* fall through to localStorage */ }
  try {
    localStorage.setItem("cv:" + key, JSON.stringify(value));
  } catch (e) { /* storage unavailable — persist nothing */ }
}

/* ---------------------------------------------------------------------------
   PLAYER PROFILE — every number here is earned through real play and
   persisted across sessions. Nothing is pre-filled.
--------------------------------------------------------------------------- */
function defaultProfile() {
  return {
    name: "Player",
    flag: "🌐",
    createdAt: new Date().toISOString(),
    ratings: { bullet: 0, blitz: 0, rapid: 0 },
    ratingHistory: { bullet: [0], blitz: [0], rapid: [0] },
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
    recentGames: [],
    puzzle: {
      rating: 0,
      solved: 0,
      failed: 0,
      streak: 0,
      bestStreak: 0,
      lastSolvedDate: null,
      bestRushScore: 0,
      log: [],
    },
  };
}

/* Badge tiers — purely a function of earned rating, recomputed live. */
const TIER_DEFS = [
  { id: "bronze", label: "Bronze", min: 0, color: "#c07a3e", Icon: Medal },
  { id: "silver", label: "Silver", min: 1000, color: "#b9c0cc", Icon: Award },
  { id: "diamond", label: "Diamond", min: 1400, color: "#5fd0e0", Icon: Gem },
  { id: "pro", label: "Pro", min: 1800, color: "#f6c453", Icon: Crown },
];
function getTier(rating) {
  let tier = TIER_DEFS[0];
  for (const t of TIER_DEFS) if (rating >= t.min) tier = t;
  return tier;
}

function controlCategory(tc) {
  if (tc.sub === "Bullet") return "bullet";
  if (tc.sub === "Blitz") return "blitz";
  return "rapid"; // Rapid & Classical share a pool
}

function eloDelta(myRating, oppRating, actual) {
  const expected = 1 / (1 + Math.pow(10, (oppRating - myRating) / 400));
  let delta = Math.round(24 * (actual - expected));
  if (delta === 0) delta = actual === 1 ? 4 : actual === 0 ? -4 : 0;
  return delta;
}

function applyGameResult(profile, { category, result, opponentName, opponentRating, control }) {
  const myRating = profile.ratings[category];
  const actual = result === "win" ? 1 : result === "draw" ? 0.5 : 0;
  const delta = eloDelta(myRating, opponentRating, actual);
  const newRating = Math.max(0, myRating + delta);
  const ratingHistory = { ...profile.ratingHistory };
  ratingHistory[category] = [...ratingHistory[category].slice(-19), newRating];
  const currentWinStreak = result === "win" ? profile.currentWinStreak + 1 : 0;
  return {
    ...profile,
    ratings: { ...profile.ratings, [category]: newRating },
    ratingHistory,
    gamesPlayed: profile.gamesPlayed + 1,
    wins: profile.wins + (result === "win" ? 1 : 0),
    losses: profile.losses + (result === "loss" ? 1 : 0),
    draws: profile.draws + (result === "draw" ? 1 : 0),
    currentWinStreak,
    bestWinStreak: Math.max(profile.bestWinStreak, currentWinStreak),
    recentGames: [
      { id: `${Date.now()}`, opponent: opponentName, result, delta, control, when: new Date().toISOString() },
      ...profile.recentGames,
    ].slice(0, 12),
  };
}

function applyPuzzleResult(profile, correct) {
  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
  const p = profile.puzzle;
  let streak = p.streak;
  let lastSolvedDate = p.lastSolvedDate;
  if (correct && lastSolvedDate !== todayStr) {
    streak = lastSolvedDate === yesterdayStr ? p.streak + 1 : 1;
    lastSolvedDate = todayStr;
  }
  const delta = correct ? 6 + Math.floor(Math.random() * 9) : -(3 + Math.floor(Math.random() * 5));
  return {
    ...profile,
    puzzle: {
      ...p,
      rating: Math.max(0, p.rating + delta),
      solved: p.solved + (correct ? 1 : 0),
      failed: p.failed + (correct ? 0 : 1),
      streak,
      bestStreak: Math.max(p.bestStreak, streak),
      lastSolvedDate,
      log: [{ when: new Date().toISOString(), result: correct ? "solved" : "failed", delta }, ...p.log].slice(0, 12),
    },
  };
}

function applyRushScore(profile, score) {
  return { ...profile, puzzle: { ...profile.puzzle, bestRushScore: Math.max(profile.puzzle.bestRushScore, score) } };
}

const ACHIEVEMENT_DEFS = [
  { id: "first-win", label: "First Win", icon: Crown, tone: "brass", test: (p) => p.wins >= 1 },
  { id: "streak-10", label: "10-Game Streak", icon: Flame, tone: "danger", test: (p) => p.bestWinStreak >= 10 },
  { id: "puzzle-rush-20", label: "Puzzle Rush 20", icon: Target, tone: "malachite", test: (p) => p.puzzle.bestRushScore >= 20 },
  { id: "century", label: "Century Club", icon: Medal, tone: "brass", test: (p) => p.gamesPlayed >= 100 },
  { id: "puzzle-week", label: "7-Day Puzzle Streak", icon: Flame, tone: "danger", test: (p) => p.puzzle.bestStreak >= 7 },
  { id: "diamond", label: "Reached Diamond", icon: Gem, tone: "malachite", test: (p) => p.ratings.rapid >= 1400 },
];

/* Opponent pool — used only to *generate* a matched opponent per match.
   Never displayed as a single fixed "the opponent". */
const OPPONENT_POOL = [
  { name: "Viktor Solheim", flag: "🇳🇴" },
  { name: "Elena Marchetti", flag: "🇮🇹" },
  { name: "Kwame Asante", flag: "🇬🇭" },
  { name: "Mei Lin Zhao", flag: "🇨🇳" },
  { name: "Diego Fuentes", flag: "🇪🇸" },
  { name: "Anya Kowalski", flag: "🇵🇱" },
  { name: "Tomás Herrera", flag: "🇦🇷" },
  { name: "Sofia Lindqvist", flag: "🇸🇪" },
  { name: "Ravi Chandran", flag: "🇮🇳" },
  { name: "Noah Bergström", flag: "🇩🇰" },
];
function generateOpponent(myRating) {
  const pick = OPPONENT_POOL[Math.floor(Math.random() * OPPONENT_POOL.length)];
  const rating = Math.max(0, Math.round(myRating + (Math.random() * 2 - 1) * 150));
  const title = rating >= 2200 ? "GM" : rating >= 2000 ? "IM" : rating >= 1800 ? "FM" : null;
  return { ...pick, rating, title };
}

/* ---------------------------------------------------------------------------
   PUZZLE CONTENT — hand-built tactics, each with a single unambiguous best
   move. legalMovesFrom/applyMove (the real chess engine above) validate and
   play every attempt, so any legal try that isn't the solution is correctly
   rejected — including other checks or captures that look tempting.
--------------------------------------------------------------------------- */
function emptyBoard() {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

const PUZZLES = [
  {
    id: "p1",
    theme: "Back Rank",
    rating: 1850,
    orientation: "w",
    intro: "White to move — the back rank is fatally weak.",
    hint: "Black's own pawns block every escape square on the 8th rank. Bring your rook all the way down the open file.",
    success: "Rd8 is checkmate — the king has nowhere to run.",
    board: () => {
      const b = emptyBoard();
      b[0][6] = { type: "k", color: "b" }; // g8
      b[1][5] = { type: "p", color: "b" }; // f7
      b[1][6] = { type: "p", color: "b" }; // g7
      b[1][7] = { type: "p", color: "b" }; // h7
      b[7][3] = { type: "r", color: "w" }; // d1
      b[7][6] = { type: "k", color: "w" }; // g1
      return b;
    },
    solution: { from: { r: 7, c: 3 }, to: { r: 0, c: 3 } },
  },
  {
    id: "p2",
    theme: "Forks",
    rating: 1720,
    orientation: "w",
    intro: "White to move — one knight hop wins material.",
    hint: "A knight on e7 would give check and attack a rook at the same time. Which square is the knight jumping from?",
    success: "Ne7+ forks the king and rook — the rook falls next move.",
    board: () => {
      const b = emptyBoard();
      b[0][6] = { type: "k", color: "b" }; // g8
      b[0][2] = { type: "r", color: "b" }; // c8
      b[3][3] = { type: "n", color: "w" }; // d5
      b[7][6] = { type: "k", color: "w" }; // g1
      return b;
    },
    solution: { from: { r: 3, c: 3 }, to: { r: 1, c: 4 } },
  },
  {
    id: "p3",
    theme: "Discovered Attack",
    rating: 2010,
    orientation: "w",
    intro: "White to move — clear the e-file with tempo.",
    hint: "Your rook already aims down the e-file at the enemy king. Move the bishop somewhere useful and see what you uncover.",
    success: "Bxh7+ grabs a pawn and discovers check from the rook on e1 — a free pawn with tempo.",
    board: () => {
      const b = emptyBoard();
      b[0][4] = { type: "k", color: "b" }; // e8
      b[1][7] = { type: "p", color: "b" }; // h7
      b[4][4] = { type: "b", color: "w" }; // e4
      b[7][4] = { type: "r", color: "w" }; // e1
      b[7][6] = { type: "k", color: "w" }; // g1
      return b;
    },
    solution: { from: { r: 4, c: 4 }, to: { r: 1, c: 7 } },
  },
  {
    id: "p4",
    theme: "Pins",
    rating: 1650,
    orientation: "w",
    intro: "White to move — the bishop can't run.",
    hint: "Black's bishop is pinned to the king by your rook on the e-file — it isn't allowed to move. What attacks it for free?",
    success: "dxe5 wins the pinned bishop outright — it was never allowed to move.",
    board: () => {
      const b = emptyBoard();
      b[0][4] = { type: "k", color: "b" }; // e8
      b[3][4] = { type: "b", color: "b" }; // e5
      b[4][3] = { type: "p", color: "w" }; // d4
      b[7][4] = { type: "r", color: "w" }; // e1
      b[7][6] = { type: "k", color: "w" }; // g1
      return b;
    },
    solution: { from: { r: 4, c: 3 }, to: { r: 3, c: 4 } },
  },
];

const NEUTRAL_PUZZLE_STATE = {
  castling: { w: { k: false, q: false }, b: { k: false, q: false } },
  enPassant: null,
};

const THEME_LIST = ["Back Rank", "Forks", "Discovered Attack", "Pins", "Endgames", "Sacrifices"];

/* ---------------------------------------------------------------------------
   STYLE SYSTEM
--------------------------------------------------------------------------- */
const Style = () => (
  <style>{`
    .cv {
      --ink: #08070f;
      --ink-soft: #0d0c18;
      --surface: #14121f;
      --surface-raised: #1a1828;
      --surface-hover: #211e33;
      --line: #2c2843;
      --line-soft: #221f36;
      --brass: #a855f7;
      --brass-bright: #c084fc;
      --brass-dim: #9333ea;
      --danger: #ef4444;
      --danger-bright: #f87171;
      --malachite: #22c55e;
      --ivory: #fafaf9;
      --ivory-dim: #e7e5e4;
      --muted: #a1a1aa;
      --muted-2: #71717a;
      --font-body: 'Inter', system-ui, sans-serif;
      --shadow-soft: 0 4px 20px rgba(0,0,0,0.35);
      --shadow-lift: 0 12px 40px rgba(0,0,0,0.5);
      background: var(--ink);
      color: var(--ivory-dim);
      min-height: 100vh;
    }

    .cv-shell {
      display: flex;
      min-height: 100vh;
    }

    .scrim {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background: linear-gradient(180deg, rgba(139,92,246,0.12) 0%, transparent 40%), radial-gradient(800px 400px at 80% -20%, rgba(139,92,246,0.25), transparent 60%);
    }

    .content {
      flex: 1;
      padding: 34px;
      max-width: 1240px;
      width: 100%;
      margin: 0 auto;
    }
    .search-screen {
      position: fixed;
      inset: 0 0 0 200px;
      z-index: 90;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: var(--ink);
      padding: 20px;
    }

    /* ---- Typography ---- */
    .eyebrow {
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--brass);
    }
    .h1 {
      font-family: var(--font-body);
      font-weight: 800;
      font-size: 30px;
      letter-spacing: -0.02em;
      color: var(--ivory);
      margin: 0;
    }
    .h2 {
      font-family: var(--font-body);
      font-weight: 700;
      font-size: 20px;
      letter-spacing: -0.01em;
      color: var(--ivory);
      margin: 0;
    }
    .h3 {
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 14.5px;
      color: var(--ivory-dim);
      margin: 0;
    }
    .muted {
      color: var(--muted);
      font-size: 13.5px;
      line-height: 1.55;
    }
    .mono {
      font-family: var(--font-mono);
    }
    .divider {
      border: none;
      height: 1px;
      background: var(--line);
      margin: 18px 0;
    }

    /* ---- Buttons ---- */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 11px 20px;
      border-radius: 10px;
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 13.5px;
      cursor: pointer;
      border: 1px solid transparent;
      color: var(--ivory-dim);
      background: var(--surface);
      box-shadow: var(--shadow-soft);
      transition: all 0.15s ease;
    }
    .btn:hover {
      background: var(--surface-raised);
      border-color: var(--line);
    }
    .btn:active {
      transform: scale(0.98);
    }
    .btn-brass {
      background: var(--brass);
      color: #fff;
      border-color: var(--brass-dim);
    }
    .btn-brass:hover {
      background: var(--brass-bright);
    }
    .btn-danger {
      background: var(--danger);
      color: #fff;
      border-color: var(--danger-bright);
    }
    .btn-danger:hover {
      background: var(--danger-bright);
    }
    .btn-ghost {
      background: transparent;
      border-color: var(--line-soft);
      color: var(--muted);
    }
    .btn-ghost:hover {
      color: var(--ivory-dim);
      border-color: var(--line);
      background: var(--surface);
    }
    .btn-icon {
      padding: 10px;
      border-radius: 10px;
    }
    .btn-sm {
      padding: 5px 10px;
      font-size: 12px;
      border-radius: 6px;
      border: none;
      color: var(--muted);
      background: transparent;
      box-shadow: none;
    }
    .btn-sm:hover {
      color: var(--ivory-dim);
      background: var(--surface);
    }
    .btn-lg {
      padding: 14px 26px;
      font-size: 15px;
      border-radius: 12px;
    }

    /* ---- Card ---- */
    .card {
      background: var(--surface);
      border: 1px solid var(--line-soft);
      border-radius: 16px;
      padding: 20px;
    }
    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .ov-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--line-soft);
      border-radius: 14px;
      padding: 16px 18px;
    }
    .stat-num {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 24px;
      color: var(--ivory);
      line-height: 1;
      margin-top: 6px;
    }

    /* ---- Sidebar ---- */
    .sidebar {
      width: 200px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      padding: 16px 12px;
      border-right: 1px solid var(--line);
      background: var(--ink-soft);
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 6px 16px;
    }
    .brand-mark {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      background: linear-gradient(135deg, var(--brass) 0%, var(--brass-dim) 100%);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .brand-name {
      font-family: var(--font-body);
      font-weight: 700;
      font-size: 15px;
      color: var(--ivory);
    }
    .nav-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-radius: 8px;
      border: 1px solid rgba(168, 85, 247, 0.3);
      background: rgba(168, 85, 247, 0.12);
      color: #c4b5fd;
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 12.5px;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
    }
    .nav-item:hover {
      background: rgba(168, 85, 247, 0.2);
      border-color: rgba(168, 85, 247, 0.48);
      color: #e9d5ff;
    }
    .nav-item.active {
      background: linear-gradient(135deg, var(--brass) 0%, var(--brass-dim) 100%);
      border-color: rgba(192, 132, 252, 0.65);
      color: #fff;
      box-shadow: 0 4px 18px rgba(168, 85, 247, 0.35);
    }
    .sidebar-foot {
      margin-top: 12px;
      padding: 12px;
      border-radius: 12px;
      background: var(--surface);
      border: 1px solid var(--line-soft);
      font-size: 12.5px;
      line-height: 1.5;
      color: var(--muted);
    }
    .sidebar-foot .tier-badge { flex-shrink: 0; }

    /* ---- Main column ---- */
    .main-col {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    /* ---- Landing / play options ---- */
    .landing-hero {
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 32px;
      padding: 48px;
      border-radius: 24px;
      border: 1px solid var(--line);
      background: linear-gradient(135deg, var(--surface-raised) 0%, var(--surface) 60%, var(--ink-soft) 100%);
      min-height: 0;
    }
    .landing-hero-text {
      flex: 1 1 300px;
      min-width: 0;
      max-width: 400px;
    }
    .landing-lede {
      margin: 14px 0 28px;
      color: var(--muted);
      font-size: 15px;
      line-height: 1.6;
    }
    .landing-cta {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .landing-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-top: 32px;
    }
    .landing-stats .ls-item {
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 5px;
      padding: 14px 16px;
    }
    .landing-stats .stat-num {
      font-size: 24px;
    }

    .landing-board {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 520px;
      max-height: 100%;
      aspect-ratio: 1;
      flex-shrink: 1;
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      grid-template-rows: repeat(8, 1fr);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 26px 60px rgba(0,0,0,0.45);
      border: 1px solid var(--line-soft);
      margin: 0 auto;
    }
    .lb-cell { position: relative; display: flex; align-items: center; justify-content: center; }
    .lb-light { background: #f0d9b5; }
    .lb-dark { background: #b58863; }
    .lb-cell.lb-last::after { content: ''; position: absolute; inset: 0; background: rgba(246, 238, 128, 0.4); pointer-events: none; }
    .landing-board .piece-glyph { font-size: clamp(24px, 5vw, 44px); line-height: 1; }
    .landing-board .piece-glyph.lb-moved { animation: lbPop 0.35s ease; }
    @keyframes lbPop {
      0% { transform: scale(0.55); }
      60% { transform: scale(1.14); }
      100% { transform: scale(1); }
    }
    @media (prefers-reduced-motion: reduce) { .landing-board .piece-glyph.lb-moved { animation: none; } }

    /* ---- Mode picker ---- */
    .mode-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      width: 100%;
    }
    .mode-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      padding: 18px;
      border-radius: 14px;
      background: var(--surface);
      border: 1px solid var(--line-soft);
      cursor: pointer;
      transition: border-color 0.15s ease, background 0.15s ease;
      text-align: left;
      color: var(--ivory-dim);
      font-family: var(--font-body);
      min-height: 100%;
    }
    .mode-card:hover {
      border-color: var(--line);
      background: var(--surface-raised);
    }
    .mode-card.mode-computer {
      grid-column: 1 / -1;
    }
    .mode-card.mode-computer .mode-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
    }
    .mode-card.mode-computer .mode-icon svg { width: 22px; height: 22px; }
    .mode-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ivory);
      background: linear-gradient(135deg, var(--brass) 0%, var(--brass-dim) 100%);
      margin-bottom: 4px;
    }
    .play-options { margin-top: 36px; }
    .play-btn-mobile {
      display: flex;
      justify-content: center;
      width: 100%;
      max-width: 560;
      margin-top: 20px;
    }
    @media (min-width: 769px) {
      .play-btn-mobile { display: none; }
    }

    /* ---- Time control chips ---- */
    .tc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%; }
    .tc-chip {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 14px 10px;
      border-radius: 14px;
      border: 1px solid var(--line-soft);
      background: var(--surface);
      cursor: pointer;
      color: var(--ivory-dim);
      transition: border-color 0.15s ease, background 0.15s ease;
      font-family: var(--font-body);
    }
    .tc-chip:hover { border-color: var(--line); background: var(--surface-raised); }
    .tc-chip.active {
      border-color: var(--brass);
      background: var(--surface-hover);
      color: var(--brass-bright);
    }
    .tc-label { font-weight: 700; font-family: var(--font-mono); font-size: 14px; }
    .tc-sub { font-size: 11px; color: var(--muted); }

    /* ---- Tab bar ---- */
    .tabbar {
      display: inline-flex;
      gap: 4px;
      padding: 4px;
      border-radius: 10px;
      background: var(--surface);
      border: 1px solid var(--line-soft);
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 14px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--muted);
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .tab-btn:hover { color: var(--ivory-dim); }
    .tab-btn.active {
      background: var(--surface-hover);
      color: var(--brass-bright);
    }

    /* ---- Searching ring ---- */
    .mm-ring {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto;
      border-radius: 50%;
      border: 3px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mm-ring::before {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 3px solid transparent;
      border-top-color: var(--brass-bright);
      border-right-color: var(--brass);
      animation: spin 1s linear infinite;
    }
    .mm-ring::after {
      content: '';
      position: absolute;
      inset: -14px;
      border-radius: 50%;
      border: 2px solid transparent;
      border-bottom-color: rgba(180, 150, 80, 0.25);
      animation: spin 2.5s linear infinite reverse;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .mm-ring-found {
      border-color: var(--malachite);
      box-shadow: 0 0 40px rgba(34, 197, 94, 0.4);
      animation: popIn 0.4s ease;
    }
    @keyframes popIn {
      0% { transform: scale(0.6); opacity: 0; }
      70% { transform: scale(1.08); }
      100% { transform: scale(1); opacity: 1; }
    }
    .match-found-opponent {
      margin-top: 14px;
      text-align: center;
    }
    .opponent-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      margin: 0 auto 10px;
      background: linear-gradient(135deg, var(--brass) 0%, var(--brass-dim) 100%);
      border: 2px solid var(--line);
    }

    /* ---- Board ---- */
    .board-wrap { display: flex; width: fit-content; margin: 0 auto; flex-direction: column; border-radius: 14px; overflow: hidden; box-shadow: var(--shadow-lift); border: 1px solid var(--line-soft); }
    .board-grid { display: grid; grid-template-columns: repeat(8, var(--sqsize)); grid-template-rows: repeat(8, var(--sqsize)); }
    .square { position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer; user-select: none; }
    .square.light { background: #f0d9b5; }
    .square.dark { background: #b58863; }
    .square.selected.light { background: #f6ee80; }
    .square.selected.dark { background: #d8c34a; }
    .square.lastmove.light { background: #f3ec9b; }
    .square.lastmove.dark { background: #c9b458; }
    .square.check { box-shadow: inset 0 0 0 3px var(--danger-bright); }
    .square.premove { box-shadow: inset 0 0 0 3px rgba(59,130,246,0.85); }
    .square .coord { position: absolute; font-size: 9.5px; font-family: var(--font-mono); font-weight: 600; opacity: 0.55; }
    .square .coord.file { bottom: 2px; right: 4px; }
    .square .coord.rank { top: 2px; left: 3px; }
    .square.light .coord { color: #8a6238; }
    .square.dark .coord { color: #f2ddb8; }
    @keyframes piece-slide {
      from { transform: translate(var(--slide-x), var(--slide-y)); }
      to { transform: translate(0, 0); }
    }
    .piece-glyph { position: relative; z-index: 1; font-family: 'Noto Sans Symbols 2', 'Segoe UI Symbol', 'DejaVu Sans', 'Apple Symbols', serif; font-size: calc(var(--sqsize) * 0.8); line-height: 1; font-weight: 400; transition: transform 0.1s ease; filter: drop-shadow(0 3px 2px rgba(35,20,5,0.4)); }
    .piece-glyph.piece-moved { animation: piece-slide 0.4s cubic-bezier(0.22, 1, 0.36, 1); z-index: 5; }
    .piece-glyph.white { color: #fffdf6; -webkit-text-fill-color: #fffdf6; -webkit-text-stroke: 0.6px #5c3a1e; paint-order: stroke fill; }
    .piece-glyph.black { color: #1a0f04; -webkit-text-fill-color: #1a0f04; -webkit-text-stroke: 0.6px #2a1608; paint-order: stroke fill; }
    .square:hover .piece-glyph { transform: scale(1.06); }
    .move-dot { width: 30%; height: 30%; border-radius: 50%; background: rgba(124,92,252,0.55); position: absolute; }
    .square.dark .move-dot { background: rgba(155,134,255,0.65); }
    .capture-square { position: absolute; inset: 0; background: rgba(220, 38, 38, 0.55); }

    /* ---- Game HUD ---- */
    .game-layout {
      display: flex;
      gap: 24px;
      align-items: flex-start;
      justify-content: center;
    }
    .game-main {
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .game-board-area {
      width: min(100%, 640px);
    }
    .game-player-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      width: 100%;
      border-radius: 6px;
      background: var(--surface);
      border: 1px solid var(--line-soft);
      min-height: 48px;
      margin: 8px 0;
    }
    .game-player-row.is-active {
      border-color: var(--brass-dim);
      box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.15);
    }
    .game-player-row.is-low .game-timer { color: var(--danger-bright); }
    .game-pa-wrap { position: relative; flex-shrink: 0; }
    .game-pa-wrap .online-dot {
      position: absolute;
      right: -2px;
      bottom: -2px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--malachite);
      border: 2px solid var(--surface);
    }
    .game-pinfo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .game-pname-row { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .game-pname {
      font-weight: 600;
      font-size: 13.5px;
      color: var(--ivory);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .game-pmeta { font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 5px; }
    .bot-thinking-pill {
      flex-shrink: 0;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
    }
    .bot-thinking-pill .dot {
      width: 4px;
      height: 4px;
    }
    .game-timer {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 17px;
      color: var(--ivory-dim);
      padding: 5px 12px;
      border-radius: 5px;
      background: var(--surface-hover);
      border: 1px solid var(--line-soft);
      white-space: nowrap;
      flex-shrink: 0;
      min-width: 62px;
      text-align: center;
      line-height: 1;
    }
    .game-timer.active-timer {
      color: var(--ivory);
      background: var(--surface-raised);
      border-color: var(--brass-dim);
    }
    .game-tc-line {
      font-size: 11px;
      color: var(--muted);
      text-align: center;
      padding: 3px 0 6px;
      letter-spacing: 0.02em;
    }
    .bot-reaction-bubble-wrap {
      min-height: 34px;
      width: 100%;
      padding: 0 12px;
      box-sizing: border-box;
    }
    .bot-reaction-bubble {
      margin-top: 4px;
      padding: 6px 12px;
      border-radius: 10px 10px 10px 2px;
      background: var(--surface);
      border: 1px solid rgba(168, 85, 247, 0.25);
      color: var(--ivory-dim);
      font-size: 12px;
      font-weight: 600;
      font-family: var(--font-body);
      line-height: 1.3;
      max-width: 200px;
      animation: bubbleIn 0.25s ease-out both, bubbleOut 0.4s ease-in 3.1s forwards;
    }
    @keyframes bubbleIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes bubbleOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    .bot-reaction-bubble.bot-typing {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 400;
      animation: bubbleIn 0.25s ease-out both;
    }
    .bot-typing-label {
      font-size: 11px;
      color: var(--muted);
      font-style: italic;
    }
    .below-board-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 10px;
      flex-wrap: wrap;
    }
    .below-board-row .clock { display: none; }
    .board-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 36px;
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 9999px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
    }
    .board-controls .btn-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      padding: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--ivory-dim);
      cursor: pointer;
      transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .board-controls .btn-icon:hover {
      background: rgba(255, 255, 255, 0.14);
      color: var(--ivory);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    .board-controls .btn-icon:active {
      transform: translateY(0) scale(0.95);
    }
    .board-controls .btn-icon:disabled {
      opacity: 0.3;
      cursor: default;
      transform: none;
      box-shadow: none;
    }
    .board-controls .btn-resign {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 0 14px;
      height: 34px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 12px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fff;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(239, 68, 68, 0.25);
      transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .board-controls .btn-resign:hover {
      background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
      transform: translateY(-1px);
    }
    .board-controls .btn-resign:active {
      transform: translateY(0) scale(0.97);
    }
    .board-controls .btn-resign:disabled {
      opacity: 0.35;
      cursor: default;
      transform: none;
      box-shadow: none;
    }
    .game-header {
      display: contents;
    }
    .player-pill {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 14px;
      border: 1px solid var(--line-soft);
      background: var(--surface);
      min-width: 0;
    }
    .player-pill.you { justify-content: flex-end; }
    .pill-info { flex: 1 1 auto; min-width: 0; }
    .player-avatar-wrap { position: relative; flex-shrink: 0; }
    .online-dot {
      position: absolute;
      right: -1px;
      bottom: -1px;
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: var(--malachite);
      border: 2px solid var(--surface);
    }
    .player-name-row { display: flex; align-items: center; gap: 7px; min-width: 0; }
    .player-name {
      font-weight: 700;
      font-size: 15px;
      color: var(--ivory);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .player-flag { font-size: 14px; line-height: 1; }
    .player-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); margin-top: 3px; }
    .pill-clock {
      display: block;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 15px;
      color: var(--ivory-dim);
      padding: 5px 10px;
      border-radius: 9px;
      background: var(--surface-hover);
      border: 1px solid var(--line-soft);
      white-space: nowrap;
      margin-left: auto;
      flex-shrink: 0;
    }
    .player-pill.you .pill-clock { margin-left: 0; margin-right: auto; }
    .pill-clock.active { color: var(--brass-bright); border-color: var(--brass); background: var(--surface); }
    .pill-clock.low { color: var(--danger-bright); }
    .clock {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 20px;
      min-width: 92px;
      text-align: center;
      padding: 9px 16px;
      border-radius: 10px;
      color: var(--ivory-dim);
      background: var(--surface);
      border: 1px solid var(--line-soft);
    }
    .clock.active {
      color: var(--brass-bright);
      background: var(--surface-hover);
      border-color: var(--brass);
    }
    .clock.low { color: var(--danger-bright); }
    .clock-sm { font-size: 15px; min-width: 76px; padding: 7px 12px; }
    .format-pill {
      display: none;
    }
    .format-time { display: flex; align-items: center; gap: 6px; font-family: var(--font-mono); font-weight: 700; font-size: 17px; color: var(--brass-bright); }
    .format-label { font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
    .ctrl-divider { width: 1px; height: 18px; background: var(--line); margin: 0 2px; }

    /* ---- Bottom sheet ---- */
    .game-sheet-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 90;
      background: rgba(0,0,0,0.55);
    }
    .game-sheet-overlay.open { display: block; }
    .game-sheet {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 95;
      max-height: 65vh;
      background: var(--surface);
      border-top: 1px solid var(--line);
      border-radius: 14px 14px 0 0;
      transform: translateY(100%);
      transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .game-sheet.open { transform: translateY(0); }
    .game-sheet-handle {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 0 4px;
      flex-shrink: 0;
    }
    .game-sheet-handle span {
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--line);
    }
    .game-sheet-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 16px 8px;
      flex-shrink: 0;
    }
    .game-sheet-body {
      flex: 1;
      overflow-y: auto;
      padding: 0 16px 16px;
    }
    .game-sheet-tabs {
      display: flex;
      gap: 2px;
      padding: 0 16px 8px;
      flex-shrink: 0;
    }
    .game-sheet-tabs button {
      flex: 1;
      padding: 7px 0;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--muted);
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      transition: background 0.12s, color 0.12s;
    }
    .game-sheet-tabs button:hover { background: var(--surface-hover); color: var(--ivory-dim); }
    .game-sheet-tabs button.active-tab { background: var(--surface-hover); color: var(--brass-bright); }
    .game-sheet-foot {
      display: flex;
      gap: 8px;
      padding: 10px 16px 16px;
      border-top: 1px solid var(--line);
      flex-shrink: 0;
    }
    .game-sheet-foot button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: transparent;
      color: var(--ivory-dim);
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.12s;
    }
    .game-sheet-foot button:hover { background: var(--surface-hover); }

    /* ---- Compact moves strip (mobile) ---- */
    .mobile-moves-strip {
      display: none;
      width: 100%;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      margin-top: 8px;
      border-radius: 6px;
      background: var(--surface);
      border: 1px solid var(--line-soft);
    }
    .mobile-moves-scroll {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      white-space: nowrap;
      scrollbar-width: none;
    }
    .mobile-moves-scroll::-webkit-scrollbar { display: none; }
    .mobile-moves-pair {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-family: var(--font-mono);
      font-size: 11.5px;
      flex-shrink: 0;
    }
    .mobile-moves-num { color: var(--muted); font-size: 10px; }
    .mobile-moves-mv {
      padding: 1px 5px;
      border-radius: 3px;
      color: var(--ivory-dim);
      cursor: pointer;
      transition: background 0.1s;
    }
    .mobile-moves-mv:hover { background: var(--surface-hover); }
    .mobile-moves-mv.current { background: var(--surface-hover); color: var(--brass-bright); }

    .sparkline-wrap { height: 30px; }
    .sparkline-fill { fill: rgba(139,92,246,0.25); }
    .daily-goal-track {
      height: 8px;
      border-radius: 999px;
      background: var(--line);
      overflow: hidden;
      margin-top: 8px;
    }
    .daily-goal-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--brass), var(--brass-dim));
    }
    .daily-goal-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11px;
      color: var(--muted);
      margin-top: 10px;
    }
    .daily-goal-label span:last-child { font-family: var(--font-mono); color: var(--ivory-dim); }

    /* ---- Move list ---- */
    .movelist {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 260px;
      overflow-y: auto;
    }
    .movelist-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 10px;
      border-radius: 8px;
      font-family: var(--font-mono);
      font-size: 13.5px;
    }
    .movelist-row:hover { background: var(--surface-hover); }
    .movelist-num {
      width: 28px;
      flex-shrink: 0;
      font-size: 11px;
      color: var(--muted);
      text-align: right;
    }
    .movelist-move {
      flex: 1;
      color: var(--ivory-dim);
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.1s ease, color 0.1s ease;
    }
    .movelist-move:hover { background: var(--surface); color: var(--ivory); }
    .movelist-move.current {
      background: var(--surface-hover);
      color: var(--brass-bright);
    }
    .movelist-eval {
      margin-left: auto;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      color: var(--brass-bright);
      background: rgba(168, 85, 247, 0.12);
      padding: 2px 6px;
      border-radius: 6px;
      white-space: nowrap;
    }
    .premove-banner {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid rgba(59,130,246,0.3);
      background: rgba(59,130,246,0.08);
      color: #93c5fd;
      font-size: 13px;
      font-weight: 600;
    }

    /* ---- Right panel ---- */
    .right-panel {
      width: 340px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .ls-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 12px;
      background: var(--surface);
      border: 1px solid var(--line-soft);
    }
    .ls-label { font-weight: 600; color: var(--ivory-dim); font-size: 13.5px; }
    .accent { color: var(--brass-bright); font-weight: 700; font-family: var(--font-mono); }

    /* ---- Puzzles ---- */
    .puzzle-layout { display: flex; gap: 24px; align-items: flex-start; }
    .puzzle-board-col { flex-shrink: 0; width: min(100%, 434px); }
    .puzzle-side {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .puzzle-stats-row { display: flex; gap: 14px; }
    .puzzle-side-stat {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 14px 16px;
      border-radius: 12px;
      background: var(--surface);
      border: 1px solid var(--line-soft);
    }
    .puzzle-side-stat .stat-num { margin-top: 0; }
    .puzzle-stat-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .puzzle-stat-top .eyebrow { white-space: nowrap; }
    .puzzle-stat-sub {
      font-size: 11.5px;
      color: var(--muted);
      text-align: right;
      white-space: nowrap;
    }

    /* ---- Profile ---- */
    .profile-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .avatar {
      border-radius: 50%;
      overflow: hidden;
      background: linear-gradient(135deg, var(--brass) 0%, var(--brass-dim) 100%);
      color: #fff;
      font-family: var(--font-body);
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .profile-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      cursor: pointer;
      border-radius: 8px;
      transition: background 0.15s ease;
    }
    .profile-chip:hover { background: var(--surface-hover); }
    .profile-chip-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .profile-chip-name { font-weight: 600; font-size: 13px; color: var(--ivory); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .profile-chip-rating { font-family: var(--font-mono); font-size: 12.5px; color: var(--brass-bright); }
    .profile-rating-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 18px;
    }

    /* ---- Chat ---- */
    .chat-log {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 240px;
      overflow-y: auto;
    }
    .chat-msg {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 9px 12px;
      border-radius: 10px;
      background: var(--surface);
      border: 1px solid var(--line-soft);
      font-size: 13px;
      color: var(--ivory-dim);
    }
    .chat-bubble { line-height: 1.45; }
    .chat-time { font-size: 10.5px; color: var(--muted-2); }
    .chat-input-row { display: flex; gap: 8px; margin-top: 10px; }
    .chat-send-btn { flex-shrink: 0; }
    .quick-msg-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .quick-msg-chip {
      padding: 7px 12px;
      border-radius: 999px;
      border: 1px solid var(--line-soft);
      background: var(--surface);
      color: var(--muted);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: border-color 0.15s ease, color 0.15s ease;
    }
    .quick-msg-chip:hover { border-color: var(--line); color: var(--ivory); }

    /* ---- Badges ---- */
    .badge-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 14px;
      border-radius: 14px;
      background: var(--surface);
      border: 1px solid var(--line-soft);
      text-align: center;
    }
    .badge-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ivory);
      background: linear-gradient(135deg, var(--brass) 0%, var(--brass-dim) 100%);
    }
    .badge-icon.gold { background: linear-gradient(135deg, #fbbf24 0%, #b45309 100%); color: #fff; }
    .badge-icon.silver { background: linear-gradient(135deg, #cbd5e1 0%, #64748b 100%); color: #fff; }
    .badge-icon.bronze { background: linear-gradient(135deg, #fdba74 0%, #c2410c 100%); color: #fff; }
    .badge-icon.rank { background: linear-gradient(135deg, #818cf8 0%, #4f46e5 100%); }
    .badge-icon.streak { background: linear-gradient(135deg, #fb7185 0%, #e11d48 100%); }
    .badge-icon.time { background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%); }

    /* ---- Pills / tags / toast ---- */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 12px;
      font-family: var(--font-body);
    }
    .pill-win {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }
    .pill-loss {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .pill-draw {
      background: rgba(168, 85, 247, 0.15);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.3);
    }
    .tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 8px;
      background: rgba(168, 85, 247, 0.1);
      color: var(--brass-bright);
      font-size: 11.5px;
      font-weight: 600;
    }
    .title-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 13px;
      border-radius: 999px;
      background: var(--surface-hover);
      border: 1px solid var(--line);
      color: var(--brass-bright);
      font-weight: 700;
      font-size: 12.5px;
    }
    .tier-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 11px;
      border-radius: 8px;
      font-family: var(--font-body);
      font-weight: 700;
      font-size: 12px;
      background: linear-gradient(135deg, var(--brass) 0%, var(--brass-dim) 100%);
      color: #fff;
    }
    .tier-badge.tier-lg { font-size: 14px; padding: 7px 14px; }
    .rank { display: inline-flex; align-items: center; gap: 5px; color: #fbbf24; font-weight: 700; font-size: 13px; }

    /* ---- Placeholder ---- */
    .placeholder-icon {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      background: var(--surface);
      border: 1px dashed var(--line);
      margin: 0 auto 12px;
    }

    /* ---- Modal ---- */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(0,0,0,0.6);
      animation: fadein 0.2s ease both;
    }
    @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
    .modal-card {
      width: 100%;
      max-width: 560px;
      max-height: 86vh;
      overflow-y: auto;
      border-radius: 20px;
      padding: 30px;
      background: var(--surface);
      border: 1px solid var(--line);
    }

    /* ---- Misc ---- */
    .toast {
      position: fixed;
      left: 50%;
      bottom: 26px;
      transform: translateX(-50%);
      z-index: 120;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 13px 20px;
      border-radius: 999px;
      background: var(--surface-raised);
      border: 1px solid var(--line);
      color: var(--ivory);
      font-weight: 600;
      font-size: 13.5px;
      box-shadow: var(--shadow-lift);
    }
    .thinking-dots {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      background: var(--surface2);
      border: 1px solid var(--border);
    }
    .thinking-dots .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--brass);
      animation: dotPulse 1.4s ease-in-out infinite;
    }
    .thinking-dots .dot:nth-child(2) { animation-delay: 0.15s; }
    .thinking-dots .dot:nth-child(3) { animation-delay: 0.3s; }
    @keyframes dotPulse {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
      40% { transform: scale(1.15); opacity: 1; }
    }
    @keyframes countdownPop {
      0% { transform: scale(1.4); opacity: 0.5; }
      100% { transform: scale(1); opacity: 1; }
    }
    .fade-in { animation: fadein 0.3s ease both; }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ---- Responsive ---- */
    @media (max-width: 1400px) {
      .game-layout { flex-direction: column; align-items: stretch; }
      .right-panel { width: 100%; }
      .puzzle-layout { flex-direction: column; align-items: center; }
      .puzzle-side { width: 100%; }
    }

    @media (max-width: 720px) {
      .puzzle-stats-row { flex-direction: column; }
    }

    @media (max-width: 1280px) {
      .content { padding: 26px; }
      .landing-hero { padding: 36px; gap: 26px; }
      .landing-hero-text { max-width: 460px; }
      .landing-board { width: 300px; height: 300px; }
      .landing-board .piece-glyph { font-size: 27px; }
    }

    @media (max-width: 1180px) {
      .landing-hero { flex-direction: column; align-items: stretch; padding: 36px; }
      .landing-hero-text { flex: 0 0 auto; max-width: 620px; }
      .landing-board { align-self: center; }
    }

    /* Compact fit for short screens — everything visible without scrolling. */
    @media (max-height: 900px) and (min-width: 821px) {
      .content { padding: 18px 34px 22px; }
      .landing-hero { padding: 22px 26px; gap: 24px; }
      .landing-hero-text .h1 { font-size: 24px; }
      .landing-lede { margin: 9px 0 14px; font-size: 13.5px; line-height: 1.5; }
      .landing-cta { gap: 10px; }
      .landing-cta .btn-lg { padding: 10px 18px; font-size: 13.5px; }
      .landing-stats { margin-top: 13px; gap: 12px; }
      .landing-stats .ls-item { padding: 8px 13px; }
      .landing-stats .stat-num { font-size: 19px; margin-top: 3px; }
      .landing-board { width: 270px; height: 270px; }
      .landing-board .piece-glyph { font-size: 24px; }
      .play-options { margin-top: 14px; }
      .mode-grid { gap: 12px; }
      .mode-card { padding: 11px 13px; gap: 6px; }
      .mode-card .h3 { font-size: 13.5px; }
      .mode-icon { width: 32px; height: 32px; margin-bottom: 2px; }
    }

    @media (max-width: 820px) {
      .sidebar {
        position: fixed;
        left: 0;
        right: 0;
        top: auto;
        bottom: 0;
        width: 100%;
        height: auto;
        flex-direction: row;
        align-items: stretch;
        padding: 5px 12px;
        border-right: none;
        border-top: 1px solid var(--line);
        background: var(--ink-soft);
        z-index: 80;
      }
      .brand, .sidebar-foot { display: none; }
      .nav-list {
        flex-direction: row;
        width: 100%;
        gap: 4px;
        padding: 0;
      }
      .nav-item {
        flex: 1;
        flex-direction: column;
        justify-content: center;
        gap: 4px;
        padding: 6px 4px;
        font-size: 10.5px;
        font-weight: 700;
        text-align: center;
      }
      .main-col { padding-bottom: 52px; }
      .search-screen { left: 0; bottom: 0; }
      .content { padding: 8px; max-width: 100%; display: flex; flex-direction: column; }
      .game-layout { min-height: calc(100vh - 78px); align-items: flex-start; flex: 1; overflow-y: auto; }
      .game-main { width: 100%; }
      .game-board-area { width: 100%; }
      .game-player-row { padding: 6px 10px; border-radius: 6px; }
      .game-pa-wrap .avatar { width: 32px !important; height: 32px !important; font-size: 11px !important; }
      .game-pname { font-size: 13px; }
      .game-pmeta { font-size: 10px; }
      .game-timer { font-size: 15px; padding: 4px 10px; min-width: 52px; }
      .game-tc-line { font-size: 10px; padding: 1px 0 4px; }
      .bot-reaction-bubble-wrap { min-height: 30px; } .bot-reaction-bubble { max-width: 170px; font-size: 11px; }
      .below-board-row { flex-wrap: wrap; justify-content: center; gap: 4px; margin-top: 12px; }
      .below-board-row .btn-sm { padding: 6px 8px; font-size: 11px; }
      .board-controls { gap: 4px; padding: 5px 10px; }
      .board-controls .btn-resign { padding: 0 11px; height: 30px; font-size: 11px; gap: 4px; }
      .board-controls .btn-icon { width: 30px; height: 30px; }
      .right-panel { display: none !important; }
      .mobile-moves-strip { display: flex; }
      .landing-hero { padding: 18px 16px; border-radius: 20px; gap: 8px; flex-direction: column; align-items: stretch; }
      .landing-hero-text { flex: 0 0 auto; }
      .landing-hero-text .h1 { font-size: 22px; margin-top: 4px; }
      .landing-lede { display: none; }
      .landing-stats { display: none; }
      .landing-board { width: min(85vw, 340px); height: min(85vw, 340px); aspect-ratio: 1 / 1; margin: 0 auto; }
      .mode-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .mode-card { padding: 14px; gap: 6px; }
      .mode-card .h3 { font-size: 13.5px; }
      .mode-card .muted { font-size: 12px; }
      .tc-grid { grid-template-columns: repeat(3, 1fr); }
      .grid-3 { grid-template-columns: 1fr; }
      .ov-grid { grid-template-columns: 1fr; }
      #cv-play-options .h2 { display: none; }
      .cv-play-options { padding: 8px 14px !important; display: flex; flex-direction: column; max-height: calc(100vh - 88px); overflow-y: auto; }
      .cv-play-options .card { margin-top: 10px !important; }
      .cv-play-options .h3 { font-size: 13px; }
      .cv-play-options .btn-brass { margin-top: 10px !important; }
      .friend-action-row .btn { margin-top: 0 !important; }
      .toast { bottom: 88px; }
      .board-wrap { border-radius: 6px; }
    }

    @media (max-width: 820px) and (max-height: 650px) {
      .landing-hero { padding: 12px 14px; gap: 6px; }
      .landing-hero-text .h1 { font-size: 18px; margin-top: 4px; }
      .landing-board { width: min(70vw, 240px); height: min(70vw, 240px); }
    }
  `}</style>
);



/* ---------------------------------------------------------------------------
   SMALL COMPONENTS
--------------------------------------------------------------------------- */
function Avatar({ name, size = 32, ring = false }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.4, boxShadow: ring ? "0 0 0 2px var(--brass-bright)" : "none" }}>
      {initials}
    </div>
  );
}

function PlayerAvatar({ profile, size = 32, ring = false }) {
  if (profile.avatarId) {
    return <AvatarDisplay avatarId={profile.avatarId} size={size} style={{ boxShadow: ring ? "0 0 0 2px var(--brass-bright)" : "none" }} />;
  }
  return <Avatar name={profile.name} size={size} ring={ring} />;
}

function TierBadge({ rating, size = "sm" }) {
  const tier = getTier(rating);
  const Icon = tier.Icon;
  return (
    <span className={`tier-badge tier-${size}`} style={{ color: tier.color, borderColor: tier.color }}>
      <Icon size={size === "lg" ? 15 : 11} /> {tier.label}
    </span>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return <div className="toast fade-in">{message}</div>;
}

function fmtClock(seconds) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  if (s < 10) {
    return `${m}:${r.toFixed(1).padStart(4, "0")}`;
  }
  return `${m}:${Math.floor(r).toString().padStart(2, "0")}`;
}

function Sparkline({ data, width = 280, height = 64, color = "var(--brass-bright)" }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / span) * (height - 8) - 4;
    return [x, y];
  });
  const line = pts.map((p) => p.join(",")).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline-wrap">
      <polygon points={area} fill={color} className="sparkline-fill" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill={color} />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   CHESSBOARD — rendering & interaction rules unchanged
--------------------------------------------------------------------------- */
function ChessBoard({ board, legalTargets, selected, onSquareClick, lastMove, orientation, checkSquare, sqSize = 62, premoveFrom = null, premoveTo = null }) {
  const rows = orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  return (
    <div className="board-wrap">
      <div className="board-grid" style={{ "--sqsize": `min(${sqSize}px, calc((100vw - 28px) / 8))` }}>
        {rows.map((r) =>
          cols.map((c) => {
            const isLight = (r + c) % 2 === 0;
            const piece = board[r][c];
            const isSelected = selected && selected.r === r && selected.c === c;
            const isLast = lastMove && ((lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c));
            const isCheck = checkSquare && checkSquare.r === r && checkSquare.c === c;
            const isPremoveFrom = premoveFrom && premoveFrom.r === r && premoveFrom.c === c;
            const isPremoveTo = premoveTo && premoveTo.r === r && premoveTo.c === c;
            const target = legalTargets.find((m) => m.to.r === r && m.to.c === c);
            const slideStyle =
              piece && lastMove && lastMove.from && lastMove.to && lastMove.to.r === r && lastMove.to.c === c
                ? {
                    "--slide-x": `calc(var(--sqsize) * ${(orientation === "w" ? -1 : 1) * (c - lastMove.from.c)})`,
                    "--slide-y": `calc(var(--sqsize) * ${(orientation === "w" ? -1 : 1) * (r - lastMove.from.r)})`,
                  }
                : null;
            const showFile = r === (orientation === "w" ? 7 : 0);
            const showRank = c === (orientation === "w" ? 0 : 7);
            return (
              <div
                key={`${r}-${c}`}
                className={[
                  "square",
                  isLight ? "light" : "dark",
                  isSelected ? "selected" : "",
                  isLast ? "lastmove" : "",
                  isCheck ? "check" : "",
                  isPremoveFrom || isPremoveTo ? "premove" : "",
                ].join(" ")}
                onClick={() => onSquareClick(r, c)}
              >
                {showFile && <span className="coord file">{FILES[c]}</span>}
                {showRank && <span className="coord rank">{8 - r}</span>}
                {piece && (
                  <span
                    className={`piece-glyph ${piece.color === "w" ? "white" : "black"} ${slideStyle ? "piece-moved" : ""}`}
                    style={slideStyle}
                  >
                    {GLYPHS[piece.color][piece.type]}
                  </span>
                )}
                {target && (piece ? <span className="capture-square" /> : <span className="move-dot" />)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   PROMOTION DIALOG
--------------------------------------------------------------------------- */
function PromotionDialog({ color, onChoose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card fade-in" style={{ width: "min(300px, calc(100vw - 32px))" }}>
        <div className="h3" style={{ marginBottom: 16 }}>Promote your pawn</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {["q", "r", "b", "n"].map((t) => (
            <button
              key={t}
              className="btn btn-ghost"
              style={{ fontSize: 30, width: 58, height: 58, justifyContent: "center" }}
              onClick={() => onChoose(t)}
            >
              <span className={`piece-glyph ${color === "w" ? "white" : "black"}`} style={{ fontSize: 30 }}>
                {GLYPHS[color][t]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   GAME OVER MODAL
--------------------------------------------------------------------------- */
function GameOverModal({ result, onRematch, onExit, isComputer, rematchStatus, rematchReady, onCancelRematch, rematchError }) {
  const isWaiting = rematchStatus === "requested";
  const isAccepted = rematchStatus === "accepted";
  let btnLabel = "Rematch";
  if (isWaiting) btnLabel = "Waiting for opponent...";
  else if (isAccepted) btnLabel = "Rematch accepted...";
  return (
    <div className="modal-backdrop">
      <div className="modal-card fade-in">
        <div className="placeholder-icon" style={{ margin: "0 auto 14px" }}>
          <Crown size={28} />
        </div>
        <div className="h2">{result.title}</div>
        <div className="muted" style={{ marginTop: 6, fontSize: 13.5 }}>{result.subtitle}</div>
        {typeof result.delta === "number" && (
          <div className="mono" style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: result.delta >= 0 ? "var(--malachite)" : "var(--danger-bright)" }}>
            Rating {result.delta >= 0 ? "+" : ""}{result.delta}
          </div>
        )}
        <div className="divider" />
        {rematchError && <div className="muted" style={{ fontSize: 12.5, color: "var(--danger-bright)", marginBottom: 12 }}>{rematchError}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {!isComputer && (
            isWaiting ? (
              <button className="btn btn-ghost" onClick={onCancelRematch}><X size={15} /> Cancel request</button>
            ) : (
              <button className="btn btn-brass" onClick={onRematch} disabled={!rematchReady}><Repeat size={15} /> {btnLabel}</button>
            )
          )}
          <button className="btn btn-ghost" onClick={onExit}>Back to Play</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   SIDEBAR
--------------------------------------------------------------------------- */
function Sidebar({ view, setView, profile }) {
  const todayStr = new Date().toDateString();
  const gamesToday = profile.recentGames.filter((g) => new Date(g.when).toDateString() === todayStr).length;
  const goal = 5;
  const pct = Math.min(100, Math.round((gamesToday / goal) * 100));

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Crown size={19} /></div>
        <div className="brand-name">ChessVerse</div>
      </div>
      <nav className="nav-list">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${view === item.id ? "active" : ""}`}
            onClick={() => setView(item.id)}
          >
            <item.icon />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="profile-chip" onClick={() => setView("profile")}>
          <PlayerAvatar profile={profile} size={32} ring />
          <div className="profile-chip-info">
            <div className="profile-chip-name">{profile.name}</div>
            <div className="profile-chip-rating">{profile.ratings.rapid} {profile.flag}</div>
          </div>
          <TierBadge rating={profile.ratings.rapid} />
        </div>
        <div className="daily-goal">
          <div className="daily-goal-label"><span>Daily Goal</span><span>{gamesToday}/{goal} games</span></div>
          <div className="daily-goal-track"><div className="daily-goal-fill" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------------------------
   PLAY VIEW — landing page
--------------------------------------------------------------------------- */
function LandingBoardArt() {
  // Filled glyphs read as black pieces; outline glyphs read as white pieces.
  const FILL = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
  const OUTLINE = { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" };
  const [, setFrame] = useState(0);

  // Self-play simulation: the board plays random legal moves on a loop so the
  // landing board looks like a live game, purely for visual flair.
  const simRef = useRef({
    board: initialBoard(),
    castling: { w: { k: true, q: true }, b: { k: true, q: true } },
    enPassant: null,
    turn: "w",
    lastMove: null,
    plies: 0,
  });

  useEffect(() => {
    let timer = null;
    const tick = () => {
      const s = simRef.current;
      const moves = getLegalMoves(s.board, s.turn, s);
      if (moves.length === 0 || s.plies >= 60) {
        // Game finished (or long enough) — reset to the starting position.
        Object.assign(s, {
          board: initialBoard(),
          castling: { w: { k: true, q: true }, b: { k: true, q: true } },
          enPassant: null,
          turn: "w",
          lastMove: null,
          plies: 0,
        });
      } else {
        const m = moves[Math.floor(Math.random() * moves.length)];
        const res = applyMove(s.board, s, m);
        s.board = res.board;
        s.castling = res.castling;
        s.enPassant = res.enPassant;
        s.turn = s.turn === "w" ? "b" : "w";
        s.lastMove = { from: m.from, to: m.to };
        s.plies += 1;
      }
      setFrame((f) => f + 1);
      timer = setTimeout(tick, 450 + Math.random() * 550);
    };
    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, []);

  const sim = simRef.current;
  const cells = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const dark = (r + c) % 2 === 1;
      const p = sim.board[r][c];
      const isLast =
        sim.lastMove &&
        ((sim.lastMove.from.r === r && sim.lastMove.from.c === c) ||
         (sim.lastMove.to.r === r && sim.lastMove.to.c === c));
      const isMoved = sim.lastMove && sim.lastMove.to.r === r && sim.lastMove.to.c === c;
      cells.push(
        <div key={`${r}-${c}`} className={`lb-cell ${dark ? "lb-dark" : "lb-light"}${isLast ? " lb-last" : ""}`}>
          {p && (
            <span
              key={`${r}-${c}-${p.type}${p.color}`}
              className={`piece-glyph ${p.color === "w" ? "white" : "black"}${isMoved ? " lb-moved" : ""}`}
            >
              {p.color === "w" ? OUTLINE[p.type] : FILL[p.type]}
            </span>
          )}
        </div>
      );
    }
  }
  return <div className="landing-board" aria-hidden="true">{cells}</div>;
}

function PlayView({ onStart, profile, notify }) {
  const [mode, setMode] = useState(null);
  const [tc, setTc] = useState(TIME_CONTROLS[4]);
  const [botDiff, setBotDiff] = useState("medium");
  
  // Quick Match state
  const [searching, setSearching] = useState(false);
  const [searchPhase, setSearchPhase] = useState("idle"); // idle | searching | found | timeout
  const [queueId, setQueueId] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [quickBotOpponent, setQuickBotOpponent] = useState(null);

  
  // Play a Friend state
  const [friendCode, setFriendCode] = useState("");
  const [friendJoining, setFriendJoining] = useState(false);
  const [friendStatus, setFriendStatus] = useState(null); // null | "waiting" | "active" | "notfound" | "full"
  const [friendAction, setFriendAction] = useState(null); // null | "create" | "join"
  const [createdRoomCode, setCreatedRoomCode] = useState(null);
  const [friendOpponentName, setFriendOpponentName] = useState("");
  
  const [searchPollTimer, setSearchPollTimer] = useState(null);
  const [friendPollTimer, setFriendPollTimer] = useState(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchPollTimer) clearTimeout(searchPollTimer);
      if (friendPollTimer) clearInterval(friendPollTimer);
    };
  }, []);

  // Auto-join from shareable link (?join=ROOMCODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get("join");
    if (joinCode) {
      const code = joinCode.trim().toUpperCase();
      // Clear the URL param so refresh doesn't re-join
      window.history.replaceState({}, "", window.location.pathname);
      setFriendCode(code);
      setFriendAction("join");
      setMode("friend");
      setStep("options");
      setTimeout(() => joinFriendRoom(code), 100);
    }
  }, []);

  const cancelSearch = async () => {
    if (searchPollTimer) clearTimeout(searchPollTimer);
    setSearchPollTimer(null);
    if (queueId) {
      try {
        await api.delete("/chess/queue/leave", { data: { queueId } });
      } catch (e) { /* ignore */ }
    }
    setSearching(false);
    setSearchPhase("idle");
    setQueueId(null);
    setMatchData(null);
  };

  // Start Quick Match: join queue, poll for 4 seconds
  const startQuickMatch = async () => {
    setMode("quick");
    setSearching(true);
    setSearchPhase("searching");
    setQueueId(null);
    setMatchData(null);

    try {
      const category = controlCategory(tc);
      const rating = profile.ratings[category] || 0;
      const res = await api.post("/chess/queue/join", {
        player_name: profile.name || "Player",
        player_id: PLAYER_ID,
        rating: rating,
        time_control: tc.base,
      });

      if (res.data.matched) {
        // Immediate match!
        const md = {
          roomCode: res.data.roomCode,
          color: res.data.color,
          opponentName: res.data.opponentName,
          isOnline: true,
        };
        setSearchPhase("found");
        setMatchData(md);
        setTimeout(() => startOnlineGame(md.roomCode, md.color, md.opponentName), 1500);
        return;
      }

      if (res.data.queued) {
        setQueueId(res.data.queueId);
        // Poll for up to 4 seconds
        let pollCount = 0;
        const maxPolls = 8; // 4 seconds / 500ms
        
        const poll = async () => {
          pollCount++;
          try {
            const pollRes = await api.get(`/chess/queue/poll?queueId=${queueId}`);
            if (pollRes.data.matched) {
              // Match found!
              clearTimeout(searchPollTimer);
              setSearchPollTimer(null);
              setSearchPhase("found");
              const md = {
                roomCode: pollRes.data.roomCode,
                color: pollRes.data.color,
                opponentName: pollRes.data.opponentName,
                isOnline: true,
              };
              setMatchData(md);
              setTimeout(() => startOnlineGame(md.roomCode, md.color, md.opponentName), 1500);
              return;
            }
            if (pollCount >= maxPolls) {
              // Timeout - generate a bot opponent that looks like a real player
              clearTimeout(searchPollTimer);
              setSearchPollTimer(null);
              const category = controlCategory(tc);
              const botOpp = generateOpponent(profile.ratings[category] || 0);
              setQuickBotOpponent(botOpp);
              setSearchPhase("found");
              setMatchData({
                roomCode: null,
                color: "w",
                opponentName: botOpp.name,
                isOnline: false,
                isBot: true,
              });
              setTimeout(() => startBotGame(botOpp), 1500);
              return;
            }
            // Continue polling
            const timerId = setTimeout(poll, 500);
            setSearchPollTimer(timerId);
          } catch (e) {
            pollCount = maxPolls; // Stop on error
            setTimeout(() => startBotGame(), 500);
          }
        };
        
        const timerId = setTimeout(poll, 500);
        setSearchPollTimer(timerId);
      }
    } catch (e) {
      console.error("Queue join error:", e);
      const category = controlCategory(tc);
      const botOpp = generateOpponent(profile.ratings[category] || 0);
      setQuickBotOpponent(botOpp);
      setSearchPhase("found");
      setMatchData({
        roomCode: null,
        color: "w",
        opponentName: botOpp.name,
        isOnline: false,
        isBot: true,
      });
      setTimeout(() => startBotGame(botOpp), 1500);
    }
  };

  // Create a room for Play a Friend (host)
  const startFriendRoomPoll = (code) => {
    if (friendPollTimer) clearInterval(friendPollTimer);
    const pollInterval = setInterval(async () => {
      try {
        const checkRes = await api.get(`/chess/room/${code}`);
        const room = checkRes.data.room;
        if (!room) {
          sessionStorage.removeItem("chess:createdRoom");
          clearInterval(pollInterval);
          setFriendStatus("notfound");
          setCreatedRoomCode(null);
          return;
        }
        if (room.status === "active") {
          clearInterval(pollInterval);
          sessionStorage.removeItem("chess:createdRoom");
          const opponentName = room.player2_name;
          setFriendOpponentName(opponentName);
          setFriendStatus("active");
          setTimeout(() => startOnlineGame(code, "w", opponentName), 1500);
        } else if (room.status === "finished") {
          clearInterval(pollInterval);
          sessionStorage.removeItem("chess:createdRoom");
          setFriendStatus("notfound");
          setCreatedRoomCode(null);
        }
      } catch (e) { /* keep polling */ }
    }, 1000);
    setFriendPollTimer(pollInterval);
  };

  const createFriendRoom = async () => {
    setFriendStatus("waiting");
    
    try {
      const res = await api.post("/chess/room", {
        game_id: 0,
        player_name: profile.name || "Player",
        player_id: PLAYER_ID,
        time_control: tc.base * 60,
      });
      
      if (res.data.success) {
        const code = res.data.room.room_code;
        setCreatedRoomCode(code);
        // Persist the invite so the room survives backgrounding/reload (e.g. sharing to WhatsApp)
        sessionStorage.setItem("chess:createdRoom", JSON.stringify({ code, action: "create" }));
        startFriendRoomPoll(code);
      }
    } catch (e) {
      notify("Failed to create room");
      setFriendStatus(null);
    }
  };

  // Join an existing friend room
  const joinFriendRoom = async (overrideCode) => {
    const code = (overrideCode || friendCode).trim().toUpperCase();
    if (!code) {
      notify("Enter a room code");
      return;
    }
    setFriendJoining(true);
    setFriendStatus("waiting");
    
    try {
      const checkRes = await api.get(`/chess/room/${code}`);
      if (!checkRes.data.success) {
        setFriendStatus("notfound");
        setFriendJoining(false);
        return;
      }
      
      const room = checkRes.data.room;
      if (room.status !== "waiting") {
        setFriendStatus(room.status === "active" ? "full" : "notfound");
        setFriendJoining(false);
        return;
      }
      
      const joinRes = await api.post(`/chess/room/${code}/join`, {
        player_name: profile.name || "Player",
        player_id: PLAYER_ID,
      });
      
      if (joinRes.data.success) {
        setFriendOpponentName(room.player1_name);
        setFriendStatus("active");
        // Start game as black
        setTimeout(() => startOnlineGame(code, "b", room.player1_name), 1500);
      } else {
        setFriendStatus("notfound");
      }
    } catch (e) {
      console.error("Join room error:", e);
      setFriendStatus("error");
    }
    setFriendJoining(false);
  };

  // Restore a persisted room invite so returning from WhatsApp (or a tab reload)
  // does not discard the room / bounce the host back to the home page.
  useEffect(() => {
    if (!profile) return;
    const saved = sessionStorage.getItem("chess:createdRoom");
    if (!saved) return;
    try {
      const { code } = JSON.parse(saved);
      const c = String(code || "").toUpperCase();
      if (!c) return;
      setFriendAction("create");
      setMode("friend");
      setStep("options");
      setFriendStatus("waiting");
      setCreatedRoomCode(c);
      startFriendRoomPoll(c);
    } catch (e) { /* ignore malformed */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const startOnlineGame = (roomCode, color, opponentName) => {
    // Backend speaks in "white"/"black"; the game engine uses "w"/"b"
    color = color === "white" ? "w" : color === "black" ? "b" : color;
    setSearching(false);
    setSearchPhase("idle");
    cancelSearch();
    if (friendPollTimer) clearInterval(friendPollTimer);
    setFriendStatus(null);
    setFriendAction(null);
    setCreatedRoomCode(null);
    sessionStorage.removeItem("chess:createdRoom");

    const category = controlCategory(tc);
    onStart({
      mode: "online",
      tc,
      color,
      category,
      roomCode,
      // playerName is the name this client sent when creating/joining the room;
      // playerId is the stable per-browser identity used for authoritative rematch checks.
      playerName: profile.name || "Player",
      playerId: PLAYER_ID,
      opponent: { name: opponentName, rating: 0, flag: null, title: null },
      preGameCountdown: 3,
    });
  };

  const startBotGame = (botOpp) => {
    setSearching(false);
    setSearchPhase("idle");
    cancelSearch();
    const category = controlCategory(tc);
    const opponent = botOpp || { name: "ChessVerse Engine", rating: profile.ratings[category], flag: null, title: null };
    onStart({
      mode: "computer",
      tc,
      color: "w",
      category,
      difficulty: botOpp ? (botOpp.rating >= 1800 ? "hard" : botOpp.rating >= 1400 ? "medium" : "easy") : botDiff,
      opponent,
      preGameCountdown: 3,
    });
  };

  const [step, setStep] = useState("home"); // home | mode | options

  const modes = [
    { id: "quick", title: "Quick Match", desc: "Find a real player instantly, or face a tough opponent.", icon: Play },
    { id: "friend", title: "Play a Friend", desc: "Create or join a room with a code.", icon: Link2 },
    { id: "computer", title: "Play the Computer", desc: "Practice against the ChessVerse engine.", icon: Bot },
  ];

  const pickMode = (id) => {
    setMode(id);
    setStep("options");
  };

  // Render searching UI
  if (searching) {
    return (
      <div className="fade-in search-screen">
        {searchPhase === "searching" && (
          <>
            <div className="mm-ring">
              <div style={{ textAlign: "center" }}>
                <div className="h2">{tc.label}</div>
                <div className="muted" style={{ fontSize: 12 }}>{tc.sub}</div>
              </div>
            </div>
            <div className="h3" style={{ marginTop: 26 }}>Searching for players…</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>Finding the best match for you</div>
          </>
        )}

        {searchPhase === "found" && matchData && (
          <div className="fade-in">
            <div className="mm-ring mm-ring-found">
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32 }}>✓</div>
              </div>
            </div>
            <div className="h3" style={{ marginTop: 26, color: "var(--malachite)" }}>
              {matchData.isBot ? "Opponent found!" : "Player found!"}
            </div>
            {matchData.opponentName && (
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 8, color: "var(--ivory)" }}>{matchData.opponentName}</div>
            )}
            <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>Starting match…</div>
          </div>
        )}


        <button className="btn btn-ghost" style={{ marginTop: 22 }} onClick={cancelSearch}>
          <X size={14} /> Cancel
        </button>
      </div>
    );
  }

  // Step 2: Mode selection
  if (step === "mode") {
    return (
      <div className="fade-in" style={{ maxWidth: 700, width: "100%", margin: "0 auto", padding: "40px 20px" }}>
        <button className="btn btn-sm" style={{ marginBottom: 20 }} onClick={() => setStep("home")}>
          <ChevronLeft size={13} /> Back
        </button>
        <div className="eyebrow">Choose mode</div>
        <div className="h2" style={{ marginTop: 6 }}>How would you like to play?</div>
        <div className="mode-grid" style={{ marginTop: 20 }}>
          {modes.map((m) => (
            <div
              key={m.id}
              className={`mode-card ${m.id === "computer" ? "mode-computer" : ""}`}
              onClick={() => pickMode(m.id)}
            >
              <div className="mode-icon"><m.icon size={19} /></div>
              <div className="h3">{m.title}</div>
              <div className="muted" style={{ fontSize: 13 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Step 3: Options (time control, difficulty, friend room)
  if (step === "options") {
    // ── Play a Friend: dedicated create/join flow ──
    if (mode === "friend") {
      return (
        <div id="cv-play-options" className="fade-in cv-play-options" style={{ maxWidth: 520, width: "100%", margin: "0 auto", padding: "32px 20px" }}>
          <button className="btn btn-sm" style={{ marginBottom: 18, alignSelf: 'flex-start' }} onClick={() => { setMode(null); setStep("mode"); setFriendAction(null); setCreatedRoomCode(null); setFriendStatus(null); setFriendCode(""); setFriendJoining(false); }}>
            <ChevronLeft size={13} /> Back
          </button>
          <div className="eyebrow">Play a Friend</div>

          {/* Step A: choose create or join */}
          {!friendAction && !createdRoomCode && (
            <>
              <div className="h2" style={{ marginTop: 6 }}>Play with a friend</div>
              <div className="card fade-in" style={{ marginTop: 20 }}>
                <div className="h3">Start a game</div>
                <div className="friend-action-row" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%", marginTop: 16 }}>
                  <button
                    className="btn btn-brass"
                    style={{ height: 48, padding: "0 20px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, flex: "1 1 0%", minWidth: 0, whiteSpace: "nowrap" }}
                    onClick={() => setFriendAction("create")}
                  >
                    <Link2 size={15} /> Create a Room
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ height: 48, padding: "0 20px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, flex: "1 1 0%", minWidth: 0, whiteSpace: "nowrap" }}
                    onClick={() => setFriendAction("join")}
                  >
                    <Play size={15} /> Join a Room
                  </button>
                </div>
                <div className="muted" style={{ fontSize: 12, marginTop: 14 }}>
                  Create a room to invite a friend with a code, or join a room using your friend's code.
                </div>
              </div>
            </>
          )}

          {/* Step B1: create → pick time control, then create */}
          {friendAction === "create" && !createdRoomCode && (
            <>
              <div className="h2" style={{ marginTop: 6 }}>Time control</div>
              <div className="card fade-in" style={{ marginTop: 20 }}>
                <div className="h3">Choose time control</div>
                <div className="tc-grid" style={{ marginTop: 14 }}>
                  {TIME_CONTROLS.map((t) => (
                    <div
                      key={t.label}
                      className={`tc-chip ${tc.label === t.label ? "active" : ""}`}
                      onClick={() => setTc(t)}
                    >
                      <div className="tc-label">{t.label}</div>
                      <div className="tc-sub">{t.sub}</div>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-brass"
                  style={{ width: "100%", justifyContent: "center", marginTop: 18 }}
                  onClick={() => createFriendRoom()}
                >
                  <Link2 size={15} /> Create Room
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                  onClick={() => setFriendAction(null)}
                >
                  <ChevronLeft size={12} /> Back to options
                </button>
                {friendStatus === "waiting" && !createdRoomCode && (
                  <div className="muted" style={{ fontSize: 13, textAlign: "center", padding: "14px 0 0" }}>
                    Creating room…
                  </div>
                )}
              </div>
            </>
          )}

          {/* Created room: show room code + share link */}
          {createdRoomCode && (
            <div className="card fade-in" style={{ marginTop: 20 }}>
              <div className="h3" style={{ textAlign: "center" }}>Play a Friend</div>
              <div style={{ textAlign: "center", padding: "16px 0 4px" }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>Share this code with your friend</div>
                <div style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  color: "var(--brass-bright)",
                }}>
                  {createdRoomCode}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => { navigator.clipboard.writeText(createdRoomCode); notify("Code copied!"); }}
                >
                  <Copy size={13} /> Copy Code
                </button>
                <button
                  className="btn btn-brass"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => {
                    const link = `${window.location.origin}/play/chess?join=${createdRoomCode}`;
                    navigator.clipboard.writeText(link).then(() => notify("Link copied!")).catch(() => notify(link));
                  }}
                >
                  <Share2 size={13} /> Copy Link
                </button>
              </div>
              {window.location.hostname === "localhost" && (
                <div style={{ color: "var(--warning)", fontSize: 11, marginTop: 6, textAlign: "center" }}>
                  On another device? Replace "localhost" in the link with your IP address.
                </div>
              )}
              {friendStatus === "waiting" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0" }}>
                  <span className="thinking-dots" style={{ fontSize: 10 }}>
                    <span className="dot" /><span className="dot" /><span className="dot" />
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>Waiting for opponent to join…</span>
                </div>
              )}
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 14, width: "100%", justifyContent: "center" }}
                onClick={() => {
                  if (friendPollTimer) clearInterval(friendPollTimer);
                  setFriendAction(null);
                  setCreatedRoomCode(null);
                  setFriendStatus(null);
                  sessionStorage.removeItem("chess:createdRoom");
                }}
              >
                <X size={12} /> Cancel
              </button>
            </div>
          )}

          {/* Step C: join → only the code field */}
          {friendAction === "join" && (
            <>
              <div className="h2" style={{ marginTop: 6 }}>Join a room</div>
              <div className="card fade-in" style={{ marginTop: 20 }}>
                <input
                  type="text"
                  placeholder="Enter room code"
                  value={friendCode}
                  onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === "Enter") joinFriendRoom(); }}
                  autoFocus
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line-soft)",
                    background: "var(--surface)",
                    color: "#fff",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.1em",
                    fontSize: 16,
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                />
                <button
                  className="btn btn-brass"
                  style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
                  onClick={() => joinFriendRoom()}
                  disabled={friendJoining}
                >
                  {friendJoining ? "Joining…" : "Join Room"}
                </button>
                {friendStatus === "waiting" && (
                  <div style={{ color: "var(--accent)", fontSize: 12, marginTop: 8, textAlign: "center" }}>Joining room…</div>
                )}
                {friendStatus === "notfound" && (
                  <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 8, textAlign: "center" }}>Room not found — double-check the code</div>
                )}
                {friendStatus === "full" && (
                  <div style={{ color: "var(--warning)", fontSize: 12, marginTop: 8, textAlign: "center" }}>Room is full</div>
                )}
                {friendStatus === "error" && (
                  <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 8, textAlign: "center" }}>Connection error — try again</div>
                )}
                {friendStatus === "active" && (
                  <div style={{ color: "var(--accent)", fontSize: 12, marginTop: 8, textAlign: "center" }}>
                    {friendOpponentName ? `Opponent found: ${friendOpponentName}! Starting…` : "Opponent found! Starting…"}
                  </div>
                )}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                  onClick={() => { setFriendAction(null); setFriendCode(""); setFriendStatus(null); setFriendJoining(false); }}
                >
                  <ChevronLeft size={12} /> Back to options
                </button>
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div id="cv-play-options" className="fade-in cv-play-options" style={{ maxWidth: 520, width: "100%", margin: "0 auto", padding: "40px 20px" }}>
        <button className="btn btn-sm" style={{ marginBottom: 24, alignSelf: 'flex-start' }} onClick={() => { setMode(null); setStep("mode"); setFriendAction(null); setCreatedRoomCode(null); setFriendStatus(null); }}>
          <ChevronLeft size={13} /> Back
        </button>
        <div className="eyebrow">Quick Match</div>
        <div className="h2" style={{ marginTop: 6 }}>Game settings</div>

        {mode === "computer" && (
          <div className="card fade-in" style={{ marginTop: 20 }}>
            <div className="h3">Difficulty</div>
            <div className="tabbar" style={{ maxWidth: 340, marginTop: 14 }}>
              {["easy", "medium", "hard"].map((d) => (
                <button
                  key={d}
                  className={`tab-btn ${botDiff === d ? "active" : ""}`}
                  onClick={() => setBotDiff(d)}
                >
                  {d[0].toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card fade-in" style={{ marginTop: 16 }}>
          <div className="h3">Time control</div>
          <div className="tc-grid" style={{ marginTop: 14 }}>
            {TIME_CONTROLS.map((t) => (
              <div
                key={t.label}
                className={`tc-chip ${tc.label === t.label ? "active" : ""}`}
                onClick={() => setTc(t)}
              >
                <div className="tc-label">{t.label}</div>
                <div className="tc-sub">{t.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <button
          className="btn btn-brass"
          style={{ width: "100%", justifyContent: "center", marginTop: 20 }}
          onClick={mode === "computer" ? startBotGame : startQuickMatch}
        >
          {mode === "computer" ? <>Start Game <Bot size={15} /></> : <>Find Match <Play size={15} /></>}
        </button>
      </div>
    );
  }

  // Step 1: Home (landing hero)
  return (
    <div className="fade-in">
      <section className="landing-hero">
        <div className="landing-hero-text">
          <div className="eyebrow">ChessVerse · Play. Learn. Conquer.</div>
          <div className="h1" style={{ marginTop: 10 }}>Play chess.<br /><span className="accent">Learn. Conquer.</span></div>
          <p className="muted landing-lede">
            Challenge players in Rapid, Blitz &amp; Bullet, duel the ChessVerse engine, or battle a friend —
            then sharpen your game with puzzles and live analysis.
          </p>
          <div className="landing-stats">
            <div className="ls-item"><span className="stat-num">{profile.gamesPlayed}</span><span className="ls-label">Games played</span></div>
            <div className="ls-item"><span className="stat-num">{profile.puzzle.solved}</span><span className="ls-label">Puzzles solved</span></div>
            <div className="ls-item"><span className="stat-num">{profile.ratings.rapid}</span><span className="ls-label">Rapid rating</span></div>
          </div>
        </div>
        <LandingBoardArt />
      </section>
      <div style={{ paddingTop: 16, paddingBottom: 8, flexShrink: 0 }}>
        <button className="btn btn-brass btn-lg" style={{ width: "100%", maxWidth: 560, justifyContent: "center" }} onClick={() => setStep("mode")}><Swords size={17} /> Play Now</button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   GAME VIEW
--------------------------------------------------------------------------- */
// Stable per-browser player id used as the authoritative identity for shared
// online rooms. Rooms/indexed by numeric ids (player1_id/player2_id below) so
// rematches are correctly attributed even when two players share a name.
function getOrCreatePlayerId() {
  try {
    const KEY = "chessVerse:playerId";
    const existing = localStorage.getItem(KEY);
    if (existing && /^\d+$/.test(existing)) return Number(existing);
    const id = Math.floor(10000 + Math.random() * 900000000);
    localStorage.setItem(KEY, String(id));
    return id;
  } catch (e) {
    return Math.floor(10000 + Math.random() * 900000000);
  }
}
const PLAYER_ID = getOrCreatePlayerId();

function initGameState(playerColor) {
  return {
    board: initialBoard(),
    boardHistory: [initialBoard()],
    turn: "w",
    castling: { w: { k: true, q: true }, b: { k: true, q: true } },
    enPassant: null,
    history: [],
    evalHistory: [0],
    captured: { w: [], b: [] },
    lastMove: null,
    status: "playing",
    playerColor,
    outcomeBias: rollOutcomeBias(),
    checkCount: { w: 0, b: 0 },
  };
}

function GameView({ session, onExit, onGameEnd, onRematchStart, notify, profile, rematchStartedRef }) {
  const [gs, setGs] = useState(() => initGameState(session.color));
  const [panelTab, setPanelTab] = useState("analysis");
  const [selected, setSelected] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [clocks, setClocks] = useState({ w: session.tc.base * 60, b: session.tc.base * 60 });
  const [gameOver, setGameOver] = useState(null);
  // ── Clock engine (milliseconds) ──────────────────────────────────────────
  const clockMsRef = useRef({ w: session.tc.base * 60 * 1000, b: session.tc.base * 60 * 1000 });
  const clockActiveRef = useRef(null);   // color whose clock is currently running ("w"/"b"/null)
  const clockStartRef = useRef(0);       // performance.now() when the active clock started
  const incrementMsRef = useRef((session.tc.inc || 0) * 1000);
  const clockStartedRef = useRef(false); // guards the one-time game-start clock boot
  const [chatMessages, setChatMessages] = useState(() => [
    { from: "opponent", text: "Good luck!", time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [botThinking, setBotThinking] = useState(false);
  const [premove, setPremove] = useState(null);
  const [premoveSelected, setPremoveSelected] = useState(null);
  const [viewIndex, setViewIndex] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState("moves");
  const [preGameCountdown, setPreGameCountdown] = useState(() => session.preGameCountdown || 0);
  const preGameCountdownRef = useRef(null);
  const [botReaction, setBotReaction] = useState(null);
  const [playerMessage, setPlayerMessage] = useState(null);
  const [opponentMessage, setOpponentMessage] = useState(null);
  const [botTyping, setBotTyping] = useState(false);
  const timerRef = useRef(null);
  const gameEndedRef = useRef(false);
  const recentReactionsRef = useRef([]);
  const reactionTimerRef = useRef(null);
  const botTypingTimerRef = useRef(null);
  const lastReactionMoveRef = useRef(null);

  // ── Online rematch (request → opponent popup → accept/decline → new match) ─
  const [rematchStatus, setRematchStatus] = useState("idle"); // idle|requested|accepted|declined|expired
  const [incomingRematch, setIncomingRematch] = useState(null); // incoming request popup payload
  const [rematchError, setRematchError] = useState(null);
  const rematchPollRef = useRef(null);
  const rematchSentRef = useRef(null); // room_code of pending/processed request on this screen
  const rematchHandledRoomRef = useRef(null); // prevents re-processing the same accept/decline
  const rematchExpireRef = useRef(null);
  const rematchEndRetryRef = useRef(0);
  const lastEndResultRef = useRef(null);
  const myName = session.playerName || session.opponent?.selfName || profile?.name || "Player";
  const myId = session.playerId ?? PLAYER_ID;

  // Pre-game countdown timer
  useEffect(() => {
    if (preGameCountdown > 0) {
      preGameCountdownRef.current = setInterval(() => {
        setPreGameCountdown((c) => {
          if (c <= 1) {
            clearInterval(preGameCountdownRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(preGameCountdownRef.current);
    }
  }, []);
  const preGameCounting = preGameCountdown > 0;
  const isComputer = session.mode === "computer";
  const isOnline = session.mode === "online";
  const opponentName = session.opponent?.name || "Opponent";
  const opponentTitle = session.opponent?.title || null;
  const opponentFlag = session.opponent?.flag || null;
  const premoveThreshold = premoveThresholdSeconds(session.tc.base);

  const state = useMemo(
    () => ({ castling: gs.castling, enPassant: gs.enPassant }),
    [gs.castling, gs.enPassant]
  );

  const liveIndex = gs.boardHistory.length - 1;
  const displayIndex = viewIndex === null ? liveIndex : viewIndex;
  const displayBoard = gs.boardHistory[displayIndex];
  const isViewingHistory = viewIndex !== null && viewIndex !== liveIndex;

  const checkInfo = useMemo(() => {
    const kingPos = findKing(gs.board, gs.turn);
    if (kingPos && isSquareAttacked(gs.board, kingPos.r, kingPos.c, gs.turn === "w" ? "b" : "w")) {
      return kingPos;
    }
    return null;
  }, [gs.board, gs.turn]);

  const triggerBotReaction = useCallback((text) => {
    if (!text) return;
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    if (botTypingTimerRef.current) clearTimeout(botTypingTimerRef.current);
    // Human-like typing delay before the message appears
    const typingDelay = 1200 + Math.random() * 1600;
    setBotTyping(true);
    botTypingTimerRef.current = setTimeout(() => {
      setBotTyping(false);
      setBotReaction({ text, id: Date.now() });
      recentReactionsRef.current = [...recentReactionsRef.current.slice(-9), text];
      // In computer mode, also persist the bot message in the chat log
      if (isComputer) {
        const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        setChatMessages((prev) => [...prev, { from: "bot", text, time }]);
      }
      reactionTimerRef.current = setTimeout(() => setBotReaction(null), 4000);
    }, typingDelay);
  }, [isComputer]);

  const analyzePlayerMove = useCallback((analysis) => {
    if (!isComputer) return;
    const moveQuality = classifyMove(analysis.prevEval, analysis.newEval, analysis.move, session.color);
    // Only react to notable moments — never to routine quiet moves.
    const significantPieceCapture = analysis.capturedPiece && ["q", "r", "b", "n"].includes(analysis.capturedPiece);
    const notable =
      analysis.isCheckmate ||
      analysis.isPromotion ||
      significantPieceCapture ||
      analysis.inCheck ||
      ["brilliant", "inaccuracy", "mistake", "blunder"].includes(moveQuality);
    if (!notable) return;
    const reaction = getBotReaction({
      moveQuality,
      isCheck: analysis.inCheck,
      isCheckmate: analysis.isCheckmate,
      isPromotion: analysis.isPromotion,
      capturedPiece: analysis.capturedPiece,
      gameOutcome: null,
      triggerOnTime: false,
      playerResigned: false,
      recentMessages: recentReactionsRef.current,
    });
    if (!reaction) return;
    // Hard throttle so we never react every move (checkmate bypasses the gap).
    const moveNum = gs.history.length;
    const sinceLast = lastReactionMoveRef.current == null ? Infinity : moveNum - lastReactionMoveRef.current;
    const minGap = analysis.isCheckmate ? 0 : 4;
    if (sinceLast >= minGap && Math.random() < 0.6) {
      lastReactionMoveRef.current = moveNum;
      triggerBotReaction(reaction);
    }
  }, [isComputer, session.color, triggerBotReaction, gs.history.length]);

  const triggerGameEndReaction = useCallback((outcome, title) => {
    if (!isComputer) return;
    const onTime = /time/i.test(title || "");
    const reaction = getBotReaction({
      moveQuality: "normal",
      isCheck: false,
      isCheckmate: false,
      isPromotion: false,
      capturedPiece: null,
      gameOutcome: outcome,
      triggerOnTime: onTime,
      playerResigned: false,
      recentMessages: recentReactionsRef.current,
    });
    if (reaction) triggerBotReaction(reaction);
  }, [isComputer, triggerBotReaction]);

  const finishGame = useCallback(
    (modalResult, outcome) => {
      if (gameEndedRef.current) return;
      gameEndedRef.current = true;
      // Immediately stop both clocks so no timer callback can touch them after
      // the game ends (checkmate, stalemate, resign, draw, timeout, etc.).
      if (clockActiveRef.current) {
        const active = clockActiveRef.current;
        clockMsRef.current = {
          ...clockMsRef.current,
          [active]: Math.max(0, clockMsRef.current[active] - (performance.now() - clockStartRef.current)),
        };
        clockActiveRef.current = null;
        clockStartRef.current = 0;
      }
      const opponentRating = session.opponent?.rating ?? 0;
      const control = `${session.tc.sub} · ${session.tc.label}`;
      const category = session.category;
      const delta = eloDelta(0, 0, 0); // placeholder unused; real delta computed by App via profile
      setGameOver({ ...modalResult });
      onGameEnd({ category, result: outcome, opponentName, opponentRating, control });

      // For online games, always reflect the finished state on the server so the
      // opponent (and the rematch flow) knows the match has ended. Weigh-checks:
      // "win" => I won (my colour), "loss" => opponent won, "draw" => draw.
      if (session.mode === "online" && session.roomCode) {
        const myC = session.color === "w" ? "white" : "black";
        const result = outcome === "draw" ? "draw" : outcome === "win" ? myC : (myC === "white" ? "black" : "white");
        lastEndResultRef.current = result;
        api.post(`/chess/room/${session.roomCode}/end`, { result, player_color: myC }).catch(() => {});
      }
      triggerGameEndReaction(outcome, modalResult?.title);
    },
    [onGameEnd, session, opponentName, triggerGameEndReaction]
  );

  const pendingMoveAnalysisRef = useRef(null);
  const turnStartClockRef = useRef(session.tc.base * 60);
  const moverElapsedMsRef = useRef(0);
  const clocksRef = useRef(clocks);
  const gsRef = useRef(gs);
  useEffect(() => {
    clocksRef.current = clocks;
    gsRef.current = gs;
  }, [clocks, gs]);

  /* ── Clock engine helpers ─────────────────────────────────────────────────
     - clockMsRef: authoritative remaining time in ms.
     - clockActiveRef/clockStartRef: which clock is running and since when.
     - The tick loop below only mirrors ms -> displayed seconds. */
  const clockDisplay = useCallback(() => {
    const curMs = clockActiveRef.current ? freezeClock(clockMsRef.current, clockActiveRef.current, clockStartRef.current) : clockMsRef.current;
    setClocks({
      w: curMs.w / 1000,
      b: curMs.b / 1000,
    });
    return curMs;
  }, []);

  const stopClock = useCallback(() => {
    if (!clockActiveRef.current) return;
    const now = performance.now();
    const ch = clockActiveRef.current;
    clockMsRef.current = {
      ...clockMsRef.current,
      [ch]: Math.max(0, clockMsRef.current[ch] - (now - clockStartRef.current)),
    };
    clockActiveRef.current = null;
    clockStartRef.current = 0;
  }, []);

  const startClock = useCallback((color) => {
    if (!color || gameEndedRef.current) return;
    stopClock();
    clockActiveRef.current = color;
    clockStartRef.current = performance.now();
    // Record this clock's value at the moment its turn began (in seconds) so the
    // online time_spent can be computed accurately from real elapsed movement.
    turnStartClockRef.current = clockMsRef.current[color] / 1000;
  }, [stopClock]);

  // Apply increment to the player who just completed a move. Only applied
  // locally in computer mode; online relies on the server's authoritative clock.
  const addIncrement = useCallback((color) => {
    if (isOnline) return;
    const inc = incrementMsRef.current;
    if (inc <= 0) return;
    clockMsRef.current = { ...clockMsRef.current, [color]: clockMsRef.current[color] + inc };
  }, [isOnline]);

  const resetClockEngine = useCallback(() => {
    const initialMs = session.tc.base * 60 * 1000;
    clockMsRef.current = { w: initialMs, b: initialMs };
    clockActiveRef.current = null;
    clockStartRef.current = 0;
    incrementMsRef.current = (session.tc.inc || 0) * 1000;
    turnStartClockRef.current = session.tc.base * 60;
    setClocks({ w: session.tc.base * 60, b: session.tc.base * 60 });
  }, [session.tc.base, session.tc.inc]);

  // Online mode: the server is authoritative. Mirror server clock values (in
  // seconds) back into the local ms engine and re-start the running clock with a
  // fresh timestamp so the local mirror stays accurate between polls.
  const syncClockFromServer = useCallback((seconds, activePlayer) => {
    clockMsRef.current = {
      w: Math.max(0, (seconds.w ?? 0) * 1000),
      b: Math.max(0, (seconds.b ?? 0) * 1000),
    };
    turnStartClockRef.current = activePlayer === "b" ? (seconds.b || 0) : (seconds.w || 0);
    clockActiveRef.current = activePlayer;
    clockStartRef.current = performance.now();
    setClocks({ w: clockMsRef.current.w / 1000, b: clockMsRef.current.b / 1000 });
  }, []);

  // Start the appropriate player's clock the moment the game actually begins
  // (once the pre-game countdown finishes). White always moves first, so white's
  // clock is the first one running once the game is live.
  useEffect(() => {
    if (clockStartedRef.current || gameEndedRef.current || preGameCounting) return;
    clockStartedRef.current = true;
    startClock("w");
    clockDisplay();
  }, [preGameCounting, startClock, clockDisplay]);

  const commitMove = useCallback(
    (move) => {
      // Never mutate board or clocks once the game has ended — this also stops a
      // queued bot/committed move from running after a timeout or checkmate.
      if (gameEndedRef.current) return;
      // Compute everything from gsRef.current (always up-to-date)
      // instead of inside setGs updater (React 18 batches updaters)
      const prev = gsRef.current;
      const result = applyMove(prev.board, { castling: prev.castling, enPassant: prev.enPassant }, move);
      const san = sanFor(prev.board, prev, move);
      const captured = { ...prev.captured };
      if (result.takenPiece) {
        const key = result.takenPiece.color;
        captured[key] = [...captured[key], result.takenPiece.type];
      }
      const nextTurn = prev.turn === "w" ? "b" : "w";
      const nextState = { castling: result.castling, enPassant: result.enPassant };
      const legal = getLegalMoves(result.board, nextTurn, nextState);
      const inCheck = (() => {
        const k = findKing(result.board, nextTurn);
        return k && isSquareAttacked(result.board, k.r, k.c, prev.turn);
      })();
      let sanFinal = san;
      let status = "playing";
      if (legal.length === 0) {
        status = inCheck ? "checkmate" : "stalemate";
        sanFinal += inCheck ? "#" : "";
      } else if (inCheck) {
        sanFinal += "+";
      }

      if (status === "checkmate") {
        const outcome = prev.turn === session.color ? "win" : "loss";
        finishGame(
          {
            title: outcome === "win" ? "You win by checkmate" : `${opponentName} wins by checkmate`,
            subtitle: `Checkmate delivered in ${prev.history.length + 1} moves.`,
          },
          outcome
        );
      } else if (status === "stalemate") {
        finishGame({ title: "Draw by stalemate", subtitle: "No legal moves remain." }, "draw");
      }

      // 3-Check win: only CONSECUTIVE checks count. A move that does not give
      // check resets the mover's streak, so 3 checks must come in a row.
      const checkCount = { ...prev.checkCount };
      if (inCheck && status !== "checkmate") {
        checkCount[prev.turn] = (checkCount[prev.turn] || 0) + 1;
      } else {
        checkCount[prev.turn] = 0; // move gave no check -> break the streak
      }
      if (checkCount[prev.turn] >= 3 && status === "playing") {
        status = "3check";
        const outcome = prev.turn === session.color ? "win" : "loss";
        finishGame(
          {
            title: outcome === "win" ? "You win by 3 checks" : `${opponentName} wins by 3 checks`,
            subtitle: `${prev.turn === "w" ? "White" : "Black"} delivered 3 checks.`,
          },
          outcome
        );
      }

      // Advance the clock ONLY for a successfully committed, non-game-ending move.
      if (status === "playing") {
        // Capture the mover's real elapsed time (for online time_spent) BEFORE we
        // switch clocks and overwrite turnStartClockRef.
        moverElapsedMsRef.current = clockActiveRef.current === prev.turn
          ? Math.max(0, performance.now() - clockStartRef.current)
          : Math.max(0, turnStartClockRef.current * 1000 - clockMsRef.current[prev.turn]);
        // Stop mover's clock and apply their increment; start the opponent's clock.
        addIncrement(prev.turn);
        stopClock();
        startClock(nextTurn);
        clockDisplay();
      }

      // Analysis
      if (prev.turn === session.color) {
        analyzePlayerMove({
          move,
          prevEval: prev.evalHistory[prev.evalHistory.length - 1] || 0,
          newEval: materialScore(result.board, "w"),
          capturedPiece: result.takenPiece ? result.takenPiece.type : null,
          inCheck,
          isCheckmate: status === "checkmate",
          isPromotion: !!move.promotion,
        });
      }

      // Update local board state
      setGs(() => ({
        board: result.board,
        boardHistory: [...prev.boardHistory, result.board],
        castling: result.castling,
        enPassant: result.enPassant,
        turn: nextTurn,
        history: [...prev.history, sanFinal],
        evalHistory: [...prev.evalHistory, materialScore(result.board, "w")],
        captured,
        lastMove: move,
        status,
        checkCount,
      }));

      setSelected(null);
      setLegalTargets([]);
      setViewIndex(null);
      playMoveSound();

      // Online POST — computed directly, not from a ref inside setGs
      if (session.mode === "online" && prev.turn === session.color && session.roomCode) {
        const fen = boardToFen(result.board, nextTurn, result.castling, result.enPassant);
        const colorMap = { w: "white", b: "black" };
        const timeSpent = Math.round(moverElapsedMsRef.current / 1000);
        const onlineData = {
          notation: sanFinal,
          fen_after: fen,
          player_color: colorMap[prev.turn] || "white",
          time_spent: timeSpent,
          increment: session.tc.inc || 0,
        };
        api.post(`/chess/room/${session.roomCode}/move`, onlineData).then((res) => {
          console.log("[CHESS] Move posted:", onlineData.notation, "→", session.roomCode);
          // Server may report flag fall (timeout) even though the move was accepted locally.
          if (res.data.flag_fell) {
            const myColor = session.color === "w" ? "white" : "black";
            const outcome = res.data.winner === myColor ? "win" : "loss";
            finishGame(
              { title: outcome === "win" ? "You win on time" : "Opponent wins on time",
                subtitle: "The flag has fallen." },
              outcome
            );
          }
        }).catch((e) => {
          console.error("[CHESS] Move sync failed:", e?.response?.data || e.message);
          notify("Move failed to sync — check connection");
        });
      }
    },
    [finishGame, session.color, session.mode, session.roomCode, opponentName, analyzePlayerMove,
     addIncrement, stopClock, startClock, clockDisplay]
  );

  useEffect(() => {
    if (gameOver || preGameCounting) return;
    // The authoritative time lives in clockMsRef; this loop only refreshes the
    // displayed seconds from real elapsed wall-clock time. It never mutates the
    // authoritative values — it only mirrors them, so throttling can't cause
    // drift, and once gameOver is true nothing here can change a clock.
    timerRef.current = setInterval(() => {
      if (gameEndedRef.current || !clockActiveRef.current) {
        const cur = clockMsRef.current;
        setClocks({ w: cur.w / 1000, b: cur.b / 1000 });
        return;
      }
      const active = clockActiveRef.current;
      const elapsed = performance.now() - clockStartRef.current;
      const remainingMs = clockMsRef.current[active] - elapsed;
      if (remainingMs <= 0) {
        // Flag reaches zero. Clamp it at 0 immediately.
        stopClock();
        clockMsRef.current = { ...clockMsRef.current, [active]: 0 };
        setClocks({ w: clockMsRef.current.w / 1000, b: clockMsRef.current.b / 1000 });
        if (!gameEndedRef.current) {
          // Online: the server is authoritative for timeouts — the local mirror
          // must NOT declare a winner on its own (the opponent's true clock is
          // governed server-side). Just freeze the display and wait for the next
          // poll/opponent move to resync.
          if (isOnline) return;
          const flagged = active;
          const winner = flagged === "w" ? "b" : "w";
          // Respect proper chess timeout rules: if the opponent has no possible
          // mating material, the game is a draw rather than a loss.
          const flagBoard = gsRef.current.board;
          if (!hasMatingMaterial(flagBoard, winner)) {
            finishGame(
              { title: "Draw on time", subtitle: "Timeout — your opponent ran out of time, but has no mating material." },
              "draw"
            );
          } else {
            const outcome = flagged === session.color ? "loss" : "win";
            finishGame(
              { title: flagged === session.color ? `${opponentName} wins on time` : "You win on time", subtitle: "The flag has fallen." },
              outcome
            );
          }
        }
        return;
      }
      setClocks({
        w: (active === "w" ? remainingMs : clockMsRef.current.w) / 1000,
        b: (active === "b" ? remainingMs : clockMsRef.current.b) / 1000,
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [gameOver, preGameCounting, stopClock, finishGame, session.color, opponentName, session.mode, session.roomCode, isOnline]);

  // ── Online mode: Poll opponent's moves ────────────────────────────────────────
  const lastFenRef = useRef("");
  const pollTimerRef = useRef(null);
  const lastMoveNumRef = useRef(0);
  const initialSyncRef = useRef(false);


  useEffect(() => {
    if (!isOnline || gameOver) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    lastFenRef.current = boardToFen(gs.board, gs.turn, gs.castling, gs.enPassant);
    lastMoveNumRef.current = 0;
    initialSyncRef.current = false;

    const poll = async () => {
      if (gameOver) return;
      try {
        const res = await api.get(`/chess/room/${session.roomCode}/moves?after=${lastMoveNumRef.current}`);
        const { room, moves } = res.data;
        if (!room) return;

        if (room.status === "finished") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          const colorMap = { white: "w", black: "b" };
          const resultColor = colorMap[room.result] || room.result;
          const outcome = room.result === "draw" ? "draw" :
            (resultColor === session.color ? "win" : "loss");
          finishGame(
            { title: outcome === "draw" ? "Draw" : outcome === "win" ? "You win!" : "You lose",
              subtitle: room.result === "draw" ? "Game ended in a draw" : `${room.result} wins` },
            outcome
          );
          return;
        }

        if (moves && moves.length > 0) {
          const latestMove = moves[moves.length - 1];
          lastMoveNumRef.current = latestMove.move_number;


          if (room.fen && room.fen !== lastFenRef.current) {
            // Check if our local board already matches the server FEN
            // (happens when we just posted our own move via commitMove)
            const cur = gsRef.current;
            const currentFen = boardToFen(cur.board, cur.turn, cur.castling, cur.enPassant);
            if (currentFen === room.fen) {
              lastFenRef.current = room.fen;
              syncClockFromServer(
                { w: room.white_time_left, b: room.black_time_left },
                cur.turn
              );
              return;
            }

            // This is an opponent's move — apply it
            lastFenRef.current = room.fen;

            const newBoard = fenToBoard(room.fen);
            const newTurn = fenToTurn(room.fen);
            const newCastling = fenToCastling(room.fen);
            const newEnPassant = fenToEnPassant(room.fen);

            setGs(prev => {
              const captured = { ...prev.captured };
              const oldBoard = prev.board;
              for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                  const oldP = oldBoard[r][c];
                  const newP = newBoard[r][c];
                  if (oldP && (!newP || (newP.color !== oldP.color || newP.type !== oldP.type))) {
                    if (newP && oldP.color !== newP.color) continue;
                    if (oldP && (!newP || oldP.color !== newP.color)) {
                      captured[oldP.color] = [...captured[oldP.color], oldP.type];
                    }
                  }
                }
              }

              const san = latestMove.notation || `Move ${prev.history.length + 1}`;
              const lastMoveObj = diffMoveSquares(oldBoard, newBoard) || null;

              return {
                ...prev,
                board: newBoard,
                boardHistory: [...prev.boardHistory, newBoard],
                turn: newTurn,
                castling: newCastling,
                enPassant: newEnPassant,
                history: [...prev.history, san],
                evalHistory: [...prev.evalHistory, materialScore(newBoard, "w")],
                captured,
                lastMove: lastMoveObj,
                status: "playing",
              };
            });

            playMoveSound();
            syncClockFromServer(
              { w: room.white_time_left, b: room.black_time_left },
              newTurn
            );
          } else {
            // FEN didn't change but we got moves — just sync clocks
            const cur = gsRef.current;
            syncClockFromServer(
              { w: room.white_time_left, b: room.black_time_left },
              cur.turn
            );
          }
        } else if (!initialSyncRef.current) {
          initialSyncRef.current = true;
          syncClockFromServer(
            { w: room.white_time_left, b: room.black_time_left },
            room.current_turn === "black" ? "b" : "w"
          );
        }

      } catch (e) {

        // Ignore polling errors
      }
    };

    pollTimerRef.current = setInterval(poll, 800);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOnline, session.roomCode, gameOver, finishGame, session.color, syncClockFromServer]);

  // ── Online rematch workflow ────────────────────────────────────────────────
  // A rematch is server-authoritative. Clicking Rematch only *requests* one;
  // when the opponent accepts, the backend creates a brand-new room (new id +
  // new room_code) and both clients bootstrap that exact session via the same
  // `new_room_code`. The rematch button never resets the board directly.

  const [rematchReady, setRematchReady] = useState(false);

  const startRematchSession = useCallback((newRoomCode) => {
    if (!newRoomCode) return;
    // Colors swap in a rematch: whichever side I played becomes the opponent's
    // side in the new game, exactly as the backend's createRematchRoom does.
    const newColor = session.color === "w" ? "b" : "w";
    const nextSession = {
      mode: "online",
      tc: session.tc,
      color: newColor,
      category: session.category,
      roomCode: newRoomCode,
      playerName: session.playerName || session.opponent?.selfName || profile?.name || "Player",
      playerId: session.playerId ?? myId,
      opponent: { ...session.opponent, name: session.opponent?.name || opponentName },
      preGameCountdown: 3,
    };
    onRematchStart(nextSession);
  }, [session, opponentName, onRematchStart, myId]);

  const requestRematch = useCallback(async () => {
    if (!isOnline || !session.roomCode) return;
    if (rematchStatus === "requested" || rematchStatus === "accepted") return;
    try {
      setRematchError(null);
      const res = await api.post(`/chess/room/${session.roomCode}/rematch`, { player_name: myName, player_id: myId });
      const info = res.data.rematch || {};
      setRematchStatus(info.status || "requested");
      if (info.status === "accepted" && info.new_room_code) {
        rematchSentRef.current = session.roomCode;
        startRematchSession(info.new_room_code);
        return;
      }
      if (info.status === "requested") {
        rematchSentRef.current = session.roomCode;
        notify("Rematch request sent. Waiting for opponent...");
        // Auto-expire the pending request after 30s if unanswered.
        clearTimeout(rematchExpireRef.current);
        rematchExpireRef.current = setTimeout(async () => {
          rematchHandledRoomRef.current = session.roomCode;
          setRematchStatus((cur) => {
            if (cur === "requested") {
              setIncomingRematch(null);
              notify("Rematch request expired.");
              return "expired";
            }
            return cur;
          });
        }, 30000);
      }
    } catch (e) {
      // "Match not finished" is transient — the server reflects our /end post a
      // moment later and the poll re-enables the button; don't surface an error.
      const errMsg = String(e?.response?.data?.error || e?.message || "");
      if (!/not finished/i.test(errMsg)) setRematchError("Unable to request a rematch.");
    }
  }, [isOnline, session.roomCode, session.tc, session.category, myName, myId, rematchStatus, startRematchSession, notify]);

  const acceptRematch = useCallback(async () => {
    if (!isOnline || !session.roomCode) return;
    try {
      setRematchError(null);
      const res = await api.post(`/chess/room/${session.roomCode}/rematch/respond`, { player_name: myName, player_id: myId, action: "accept" });
      setIncomingRematch(null);
      setRematchStatus("accepted");
      clearTimeout(rematchExpireRef.current);
      rematchHandledRoomRef.current = session.roomCode;
      const code = res.data.new_room_code || res.data.rematch?.new_room_code;
      if (code) startRematchSession(code);
    } catch (e) {
      setRematchError("Could not accept the rematch request.");
      setIncomingRematch(null);
    }
  }, [isOnline, session.roomCode, myName, myId, startRematchSession]);

  const declineRematch = useCallback(async () => {
    if (!isOnline || !session.roomCode) return;
    try {
      clearTimeout(rematchExpireRef.current);
      rematchHandledRoomRef.current = session.roomCode;
      setIncomingRematch(null);
      setRematchStatus("declined");
      await api.post(`/chess/room/${session.roomCode}/rematch/respond`, { player_name: myName, player_id: myId, action: "decline" });
      notify("You declined the rematch.");
    } catch (e) { /* best-effort decline */ }
  }, [isOnline, session.roomCode, myName, myId, notify]);

  const cancelRematch = useCallback(async () => {
    if (!isOnline || !session.roomCode) return;
    try {
      clearTimeout(rematchExpireRef.current);
      setRematchStatus("idle");
      rematchSentRef.current = null;
      await api.post(`/chess/room/${session.roomCode}/rematch/cancel`, { player_name: myName, player_id: myId });
    } catch (e) { /* best-effort cancel */ }
  }, [isOnline, session.roomCode, myName, myId]);

  const handleExit = useCallback(() => {
    // Leaving cancels any pending rematch request so the opponent isn't left
    // waiting forever ("Opponent left the game. Rematch request cancelled.").
    if (isOnline && session.roomCode) {
      clearTimeout(rematchExpireRef.current);
      rematchSentRef.current = null;
      api.post(`/chess/room/${session.roomCode}/rematch/cancel`, { player_name: myName, player_id: myId }).catch(() => {});
    }
    onExit();
  }, [isOnline, session.roomCode, myName, onExit]);

  // Poll room rematch state after the game ends so requests/accepts from the
  // opponent (including simultaneous requests) are observed and reconciled.
  useEffect(() => {
    if (!isOnline || !session.roomCode || !gameOver) {
      if (rematchPollRef.current) clearInterval(rematchPollRef.current);
      return;
    }
    const reconcile = async () => {
      try {
        const res = await api.get(`/chess/room/${session.roomCode}`);
        const room = res.data.room;
        if (!room) return;
        if (room.status === "finished") setRematchReady(true);
        const r = room.rematch || { status: "none" };

        // An accept observed on the server starts the rematch for us too.
        if (r.status === "accepted" && r.new_room_code) {
          // If the shell WS handler already started this room, skip to avoid
          // double-starting (which causes a double color-swap → both white).
          if (rematchStartedRef && rematchStartedRef.current === r.new_room_code) return;
          if (rematchHandledRoomRef.current !== session.roomCode) {
            rematchHandledRoomRef.current = session.roomCode; // mark handled to prevent re-fire
            clearTimeout(rematchExpireRef.current);
            setIncomingRematch(null);
            setRematchStatus("accepted");
            startRematchSession(r.new_room_code);
          }
          return;
        }

        const reqKey = r.requested_at || null;
        // If the local game is over but the server room hasn't reflected it yet
        // (e.g. our /end post raced or failed), re-post it (idempotent) so the
        // rematch flow can proceed. Capped retries.
        if (room.status !== "finished" && rematchEndRetryRef.current < 3 && lastEndResultRef.current) {
          rematchEndRetryRef.current += 1;
          api.post(`/chess/room/${session.roomCode}/end`, { result: lastEndResultRef.current, player_color: session.color === "w" ? "white" : "black" }).catch(() => {});
        }
        if (room.status === "finished") setRematchReady(true);
        // The opponent requested a rematch. Identity is id-based so two players
        // sharing the same name are never mis-attributed; falls back to name for
        // legacy rooms created before player ids existed.
        const isFromOpponent =
          (r.requested_by_id != null && r.requested_by_id !== myId) ||
          (r.requested_by_id == null && r.requested_by && r.requested_by !== myName);
        if (r.status === "requested" && isFromOpponent) {
          // Only surface a request we haven't already shown/answered for this
          // specific pending request (keyed by its requested_at timestamp, so a
          // brand-new request after a decline is surfaced again).
          if (rematchHandledRoomRef.current !== reqKey) {
            rematchHandledRoomRef.current = reqKey;
            setIncomingRematch({ requestedBy: r.requested_by });
            clearTimeout(rematchExpireRef.current);
            rematchExpireRef.current = setTimeout(() => {
              setIncomingRematch((cur) => (cur ? { ...cur, expired: true } : cur));
            }, 30000);
          }
          return;
        }

        if (r.status === "expired" || r.status === "declined") {
          if (rematchHandledRoomRef.current !== reqKey && rematchHandledRoomRef.current !== session.roomCode) {
            clearTimeout(rematchExpireRef.current);
            setIncomingRematch(null);
            if (rematchStatus === "requested") setRematchStatus(r.status);
            if (r.status === "declined") notify("Opponent declined the rematch.");
            else notify("Rematch request expired.");
          }
          // Clear the request-specific guard so a future request can be surfaced.
          if (r.status === "expired") rematchHandledRoomRef.current = null;
        }
      } catch (e) {
        // If the old room becomes unreachable the opponent likely left the match.
        setIncomingRematch(null);
        setRematchStatus((cur) => (cur === "requested" ? "expired" : cur));
      }
    };
    reconcile();
    rematchPollRef.current = setInterval(reconcile, 1000);
    return () => {
      if (rematchPollRef.current) clearInterval(rematchPollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, session.roomCode, gameOver, myName, myId, startRematchSession, rematchStatus]);

  // ── Bot move (computer mode + fallback from quick match) ────────────────────
  useEffect(() => {
    // Skip if online mode or not our turn
    if (isOnline || gs.turn === session.color || gs.status !== "playing" || gameOver || preGameCounting) return;

    setBotThinking(true);
    const remainingMs = clocksRef.current[gs.turn] * 1000;

    // --- Brain-powered bot selection ---
    let botProfile;
    if (isComputer) {
      const d = session.difficulty || "medium";
      botProfile = selectBotForDifficulty(d, profile?.ratings?.[session.category] || 0);
    } else {
      // Quick-match fallback
      const bias = gs.outcomeBias;
      const d = bias === "bot" ? "hard" : bias === "draw" ? "medium" : "easy";
      botProfile = selectBotForDifficulty(d, profile?.ratings?.[session.category] || 0);
    }

    // Wire up chess engine helpers so the brain can call them
    const helpers = {
      applyMove: (b, s, m) => applyMove(b, { castling: s.castling, enPassant: s.enPassant }, m),
      findKing,
      isSquareAttacked,
      getLegalMoves: (b, c, s) => getLegalMoves(b, c, { castling: s.castling, enPassant: s.enPassant }),
    };
    const stateWithHelpers = {
      ...state,
      _helpers: helpers,
      _moveCount: gs.history.length,
      _legalMoveCount: getLegalMoves(gs.board, gs.turn, state).length,
    };

    // Human-like thinking time from the brain
    const humanThinkTime = calculateThinkTime(gs.board, gs.turn, stateWithHelpers, botProfile);
    const thinkBubble = getThinkingBubble(botProfile);
    if (thinkBubble) setBotThinking(thinkBubble);

    const t = setTimeout(() => {
      const moves = getLegalMoves(gs.board, gs.turn, state);
      const move = selectHumanLikeMove(gs.board, moves, stateWithHelpers, gs.turn, botProfile);
      setBotThinking(false);
      if (move) commitMove(move);
    }, humanThinkTime);
    
    return () => {
      clearTimeout(t);
      setBotThinking(false);
    };
  }, [gs.turn, gs.board, session.color, gameOver, gs.status, state, commitMove, gs.outcomeBias, session.difficulty, isComputer, isOnline, profile, session.category, preGameCounting]);

  useEffect(() => {
    if (!premove || gameOver) return;
    if (gs.turn !== session.color) return;
    const targets = legalMovesFrom(gs.board, premove.from.r, premove.from.c, state);
    const matches = targets.filter((m) => m.to.r === premove.to.r && m.to.c === premove.to.c);
    setPremove(null);
    if (matches.length === 0) return;
    if (matches.length > 1) {
      const queenMove = matches.find((m) => m.promotion === "q") || matches[0];
      commitMove(queenMove);
      return;
    }
    commitMove(matches[0]);
  }, [gs.turn, premove, gameOver, gs.board, state, session.color, commitMove]);

  const premoveActive =
    !gameOver &&
    !pendingPromotion &&
    gs.status === "playing" &&
    gs.turn !== session.color &&
    clocks[session.color] <= premoveThreshold &&
    !isOnline;

  const handleSquareClick = (r, c) => {
    if (gameOver || pendingPromotion || isViewingHistory || preGameCounting) return;

    if (gs.turn !== session.color) {
      if (!premoveActive) return;
      const piece = gs.board[r][c];
      if (premoveSelected) {
        if (premoveSelected.r === r && premoveSelected.c === c) {
          setPremoveSelected(null);
          return;
        }
        if (piece && piece.color === session.color) {
          setPremoveSelected({ r, c });
          return;
        }
        setPremove({ from: premoveSelected, to: { r, c } });
        setPremoveSelected(null);
        return;
      }
      if (piece && piece.color === session.color) {
        setPremoveSelected({ r, c });
      }
      return;
    }

    const piece = gs.board[r][c];
    if (selected) {
      const move = legalTargets.find((m) => m.to.r === r && m.to.c === c);
      if (move) {
        const promoMoves = legalTargets.filter((m) => m.to.r === r && m.to.c === c && m.promotion);
        if (promoMoves.length > 1) {
          setPendingPromotion({ from: selected, to: { r, c } });
          return;
        }
        commitMove(move);
        return;
      }
      if (piece && piece.color === gs.turn) {
        setSelected({ r, c });
        setLegalTargets(legalMovesFrom(gs.board, r, c, state));
        return;
      }
      setSelected(null);
      setLegalTargets([]);
      return;
    }
    if (piece && piece.color === gs.turn) {
      setSelected({ r, c });
      setLegalTargets(legalMovesFrom(gs.board, r, c, state));
    }
  };

  const cancelPremove = () => {
    setPremove(null);
    setPremoveSelected(null);
  };

  const choosePromotion = (type) => {
    const move = legalTargets.find(
      (m) => m.to.r === pendingPromotion.to.r && m.to.c === pendingPromotion.to.c && m.promotion === type
    );
    setPendingPromotion(null);
    if (move) commitMove(move);
  };

  const handleResign = () => {
    if (gameOver) return;
    finishGame(
      { title: `${opponentName} wins by resignation`, subtitle: "A graceful concession — every game teaches something." },
      "loss"
    );
  };

  const playerMessageTimerRef = useRef(null);
  const opponentMessageTimerRef = useRef(null);
  const lastChatMsgIdRef = useRef(0);

  // Poll for incoming chat messages in online mode
  useEffect(() => {
    if (!isOnline || !session.roomCode) return;
    const pollChat = async () => {
      try {
        const res = await api.get(`/chess/room/${session.roomCode}/chat?after=${lastChatMsgIdRef.current}`);
        if (res.data.success && res.data.messages.length > 0) {
          for (const msg of res.data.messages) {
            if (msg.sender_name === session.color) continue; // skip own messages
            lastChatMsgIdRef.current = Math.max(lastChatMsgIdRef.current, msg.id);
            const time = new Date(msg.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
            setChatMessages((prev) => [...prev, { from: "opponent", text: msg.message, time }]);
            // Show as bubble below opponent card
            if (opponentMessageTimerRef.current) clearTimeout(opponentMessageTimerRef.current);
            setOpponentMessage({ text: msg.message, id: Date.now() });
            opponentMessageTimerRef.current = setTimeout(() => setOpponentMessage(null), 3500);
          }
        }
      } catch (e) { /* poll error — ignore */ }
    };
    const interval = setInterval(pollChat, 2000);
    return () => clearInterval(interval);
  }, [isOnline, session.roomCode]);

  const sendChatMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // Show as bubble below player card
    if (playerMessageTimerRef.current) clearTimeout(playerMessageTimerRef.current);
    setPlayerMessage({ text: trimmed, id: Date.now() });
    playerMessageTimerRef.current = setTimeout(() => setPlayerMessage(null), 3500);
    // Also store in chatMessages
    const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setChatMessages((prev) => [...prev, { from: "you", text: trimmed, time }]);
    setChatInput("");
    setSheetOpen(false);
    if (isComputer) {
      // Bot auto-reply in computer mode only
      if (Math.random() < 0.55) {
        const delay = 900 + Math.random() * 1600;
        setTimeout(() => {
          const allQuickMsgs = BOT_CHAT_CATEGORIES.flatMap((c) => c.msgs);
          const reply = allQuickMsgs[Math.floor(Math.random() * allQuickMsgs.length)];
          triggerBotReaction(reply);
        }, delay);
      }
    } else if (isOnline && session.roomCode) {
      // Send to opponent via API — no auto-reply for real humans
      api.post(`/chess/room/${session.roomCode}/chat`, {
        sender_name: session.color,
        message: trimmed,
      }).catch(() => {});
    }
  };

  const buildPGN = () => {
    const headers = [
      `[Event "Casual Game"]`,
      `[Site "ChessVerse"]`,
      `[Date "${new Date().toISOString().slice(0, 10).replace(/-/g, ".")}"]`,
      `[White "${session.color === "w" ? "You" : opponentName}"]`,
      `[Black "${session.color === "b" ? "You" : opponentName}"]`,
      `[TimeControl "${session.tc.label}"]`,
    ].join("\n");
    const moves = gs.history.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${m}` : m)).join(" ");
    return `${headers}\n\n${moves}`.trim();
  };

  const handleDownloadPGN = () => {
    if (gs.history.length === 0) return;
    const pgn = buildPGN();
    const blob = new Blob([pgn], { type: "application/x-chess-pgn" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chessverse-game.pgn";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify("PGN downloaded");
  };

  const handleShare = async () => {
    if (gs.history.length === 0) {
      notify("Play a move first to share the game");
      return;
    }
    try {
      await navigator.clipboard.writeText(buildPGN());
      notify("Game copied to clipboard");
    } catch {
      notify("Couldn't copy — try downloading the PGN instead");
    }
  };

  const jumpToStart = () => setViewIndex(0);
  const stepBack = () => setViewIndex((v) => Math.max(0, (v ?? liveIndex) - 1));
  const stepForward = () =>
    setViewIndex((v) => {
      const next = (v ?? liveIndex) + 1;
      return next >= liveIndex ? null : next;
    });
  const jumpToLive = () => setViewIndex(null);

  const orientation = session.color;
  const boardOrientation = flipped ? (orientation === "w" ? "b" : "w") : orientation;
  const evalScore = materialScore(gs.board, "w");

  const you = { name: profile?.name || "You" };
  const diffLabel = session.difficulty ? session.difficulty[0].toUpperCase() + session.difficulty.slice(1) : "—";
  const opp = { name: opponentName, rating: isComputer ? diffLabel : session.opponent?.rating };

  return (
    <div className="fade-in game-layout" style={{ display: "flex", gap: 26 }}>
      <div className="game-main">
        <div className="game-board-area">

          {/* Opponent row */}
          <div className={`game-player-row ${gs.turn !== orientation ? "is-active" : ""} ${clocks[orientation === "w" ? "b" : "w"] < 20 ? "is-low" : ""}`}>
            <div className="game-pa-wrap">
              <Avatar name={opp.name} size={36} />
              {!isComputer && <span className="online-dot" />}
            </div>
            <div className="game-pinfo">
              <div className="game-pname-row">
                {opponentTitle && <span className="title-badge" style={{ fontSize: 10, padding: "3px 8px" }}>{opponentTitle}</span>}
                <span className="game-pname">{opp.name}</span>
                {opponentFlag && <span style={{ fontSize: 13 }}>{opponentFlag}</span>}
                {(() => { const oppColor = orientation === "w" ? "b" : "w"; const count = gs.checkCount?.[oppColor] || 0; return count > 0 ? (
                  <span style={{ fontSize: 10, fontWeight: 700, color: count >= 2 ? "var(--danger-bright)" : "var(--ivory-dim)", background: count >= 2 ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: 6, lineHeight: "16px" }}>♛ {count}/3</span>
                ) : null; })()}
              </div>
              <div className="game-pmeta">
                <Trophy size={10} />
                <span className="mono">{opp.rating !== "—" ? opp.rating : diffLabel}</span>
              </div>
            </div>
            <span className={`game-timer ${gs.turn !== orientation ? "active-timer" : ""}`}>
              {fmtClock(clocks[orientation === "w" ? "b" : "w"])}
            </span>
          </div>

          {/* Bot reaction bubble — always reserves space */}
          <div className="bot-reaction-bubble-wrap">
            {botTyping && (
              <div className="bot-reaction-bubble bot-typing">
                <span className="thinking-dots" style={{ fontSize: 9 }}>
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </span>
                <span className="bot-typing-label">typing…</span>
              </div>
            )}
            {!botTyping && botReaction && (
              <div key={botReaction.id} className="bot-reaction-bubble">
                {botReaction.text}
              </div>
            )}
            {opponentMessage && (
              <div key={opponentMessage.id} className="bot-reaction-bubble" style={{ background: "var(--surface-raised)", color: "var(--ivory-dim)" }}>
                {opponentMessage.text}
              </div>
            )}
          </div>

          {/* Time control line */}
          <div className="game-tc-line">{session.tc.sub} · {session.tc.label}</div>

          {/* Board */}
          <div style={{ position: "relative" }}>
            <ChessBoard
              board={displayBoard}
              legalTargets={selected && !isViewingHistory ? legalTargets : []}
              selected={isViewingHistory ? null : selected}
              onSquareClick={handleSquareClick}
              lastMove={isViewingHistory ? null : gs.lastMove}
              orientation={boardOrientation}
              checkSquare={isViewingHistory ? null : checkInfo}
              sqSize={focusMode ? 78 : 72}
              premoveFrom={premoveSelected || (premove ? premove.from : null)}
              premoveTo={premove ? premove.to : null}
            />
            {preGameCounting && (
              <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", borderRadius: 12, backdropFilter: "blur(2px)" }}>
                <div style={{ textAlign: "center" }}>
                  <div key={preGameCountdown} style={{ fontSize: 96, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--brass-bright)", lineHeight: 1, textShadow: "0 0 40px rgba(168,85,247,0.5)", animation: "countdownPop 0.4s ease" }}>
                    {preGameCountdown}
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>{opponentName}</div>
                </div>
              </div>
            )}
          </div>

          {/* Player row */}
          <div className={`game-player-row ${gs.turn === orientation ? "is-active" : ""} ${clocks[orientation] < 20 ? "is-low" : ""}`}>
            <div className="game-pa-wrap">
              <Avatar name={you.name} size={36} />
              <span className="online-dot" />
            </div>
            <div className="game-pinfo">
              <div className="game-pname-row">
                <span className="game-pname">{you.name}</span>
                {(() => { const count = gs.checkCount?.[orientation] || 0; return count > 0 ? (
                  <span style={{ fontSize: 10, fontWeight: 700, color: count >= 2 ? "var(--danger-bright)" : "var(--ivory-dim)", background: count >= 2 ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: 6, lineHeight: "16px" }}>♛ {count}/3</span>
                ) : null; })()}
              </div>
              <div className="game-pmeta">
                <span className={`piece-glyph ${orientation === "w" ? "white" : "black"}`} style={{ fontSize: 12 }}>{GLYPHS[orientation === "w" ? "w" : "b"].k}</span>
                <span>Playing {orientation === "w" ? "White" : "Black"}</span>
              </div>
            </div>
            <span className={`game-timer ${gs.turn === orientation ? "active-timer" : ""}`}>
              {fmtClock(clocks[orientation])}
            </span>
          </div>

          {/* Player message bubble */}
          <div className="bot-reaction-bubble-wrap">
            {playerMessage && (
              <div key={playerMessage.id} className="bot-reaction-bubble" style={{ marginLeft: "auto", background: "var(--brass-dim)", color: "var(--ivory)" }}>
                {playerMessage.text}
              </div>
            )}
          </div>

          {/* Viewing history banner */}
          {isViewingHistory && (
            <div className="premove-banner fade-in" style={{ marginTop: 8 }}>
              <span><ListChecks size={13} /> Viewing move {displayIndex} of {liveIndex}</span>
              <button className="btn btn-ghost btn-sm" onClick={jumpToLive}><SkipForward size={12} /> Return to live</button>
            </div>
          )}

          {/* Premove banner */}
          {!isViewingHistory && premoveActive && (
            <div className="premove-banner fade-in" style={{ marginTop: 8 }}>
              {premove ? (
                <>
                  <span><Clock size={13} /> Premove queued — it'll play the instant it's your turn.</span>
                  <button className="btn btn-ghost btn-sm" onClick={cancelPremove}><X size={12} /> Cancel</button>
                </>
              ) : (
                <span><Clock size={13} /> Low on time — click a piece to queue your next move.</span>
              )}
            </div>
          )}

          {/* Board controls */}
          <div className="below-board-row">
            <div className="board-controls">
              <button className="btn-resign" onClick={handleResign} disabled={!!gameOver}><Flag size={13} /> Resign</button>
              <button className="btn-icon" onClick={jumpToStart} disabled={liveIndex === 0} title="Jump to start"><SkipBack size={14} /></button>
              <button className="btn-icon" onClick={stepBack} disabled={displayIndex === 0} title="Step back"><ChevronLeft size={14} /></button>
              <button className="btn-icon" onClick={stepForward} disabled={!isViewingHistory} title="Step forward"><ChevronRight size={14} /></button>
              <button className="btn-icon" onClick={() => { setSheetTab("chat"); setSheetOpen(true); }} title="Quick message"><MessageSquare size={14} /></button>
            </div>
          </div>

          {/* Compact moves strip (mobile) */}
          {gs.history.length > 0 && (
            <div className="mobile-moves-strip">
              <div className="mobile-moves-scroll">
                {Array.from({ length: Math.ceil(gs.history.length / 2) }).slice(-4).map((_, ri) => {
                  const i = Math.ceil(gs.history.length / 2) - 4 + ri;
                  if (i < 0) return null;
                  return (
                    <span key={i} className="mobile-moves-pair">
                      <span className="mobile-moves-num">{i + 1}.</span>
                      <span className={`mobile-moves-mv ${!isViewingHistory && gs.history.length - 1 === i * 2 ? "current" : ""}`}>{gs.history[i * 2]}</span>
                      {gs.history[i * 2 + 1] && <span className={`mobile-moves-mv ${!isViewingHistory && gs.history.length - 1 === i * 2 + 1 ? "current" : ""}`}>{gs.history[i * 2 + 1]}</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Desktop right panel */}
      {!focusMode && (
        <div className="right-panel">
          <div className="card">
            <div className="card-head">
              <div className="h3">Moves</div>
              <Menu size={15} className="muted" />
            </div>
            <div className="divider" style={{ margin: "12px 0" }} />
            <div className="movelist">
              {gs.history.length === 0 && <div className="muted" style={{ fontSize: 12.5, padding: "6px 4px" }}>No moves yet — make the opening move.</div>}
              {Array.from({ length: Math.ceil(gs.history.length / 2) }).map((_, i) => (
                <div className="movelist-row" key={i}>
                  <span className="movelist-num">{i + 1}.</span>
                  <span
                    className={`movelist-move ${!isViewingHistory && gs.history.length - 1 === i * 2 ? "current" : ""}`}
                    onClick={() => { const idx = i * 2 + 1; setViewIndex(idx >= liveIndex ? null : idx); }}
                  >
                    {gs.history[i * 2]}
                    {!isViewingHistory && gs.history.length - 1 === i * 2 && <span className="movelist-eval">{evalScore > 0 ? "+" : ""}{evalScore.toFixed(2)}</span>}
                  </span>
                  <span
                    className={`movelist-move ${!isViewingHistory && gs.history.length - 1 === i * 2 + 1 ? "current" : ""}`}
                    onClick={() => { if (!gs.history[i * 2 + 1]) return; const idx = i * 2 + 2; setViewIndex(idx >= liveIndex ? null : idx); }}
                  >
                    {gs.history[i * 2 + 1] || ""}
                    {!isViewingHistory && gs.history.length - 1 === i * 2 + 1 && <span className="movelist-eval">{evalScore > 0 ? "+" : ""}{evalScore.toFixed(2)}</span>}
                  </span>
                </div>
              ))}
            </div>
            <div className="divider" style={{ margin: "12px 0" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={handleDownloadPGN} disabled={gs.history.length === 0}><Download size={13} /> PGN</button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={handleShare}><Share2 size={13} /> Share</button>
            </div>
          </div>

          <div className="tabbar" style={{ marginTop: 16 }}>
            <button className={`tab-btn ${panelTab === "analysis" ? "active" : ""}`} onClick={() => setPanelTab("analysis")}><LineChart size={13} /> Analysis</button>
            <button className={`tab-btn ${panelTab === "chat" ? "active" : ""}`} onClick={() => setPanelTab("chat")}><MessageSquare size={13} /> Chat</button>
            <button className={`tab-btn ${panelTab === "info" ? "active" : ""}`} onClick={() => setPanelTab("info")}><Info size={13} /> Info</button>
          </div>

          {panelTab === "analysis" && (
            <div className="card fade-in" style={{ marginTop: 12 }}>
              <div className="card-head">
                <div className="h3">Evaluation</div>
                <span className="mono" style={{ fontSize: 15, fontWeight: 800, color: evalScore >= 0 ? "var(--brass-bright)" : "var(--danger-bright)" }}>
                  {evalScore > 0 ? "+" : ""}{evalScore.toFixed(2)}
                </span>
              </div>
              <div className="muted" style={{ fontSize: 11 }}>Material balance, live estimate</div>
              <div style={{ marginTop: 10 }}>
                <Sparkline data={gs.evalHistory.length > 1 ? gs.evalHistory : [0, 0]} width={296} height={72} />
              </div>
              <div className="divider" />
              <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}><Star size={12} color="var(--gold)" /> Last Move</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                <div className="h3" style={{ fontFamily: "var(--font-mono)" }}>{gs.history[gs.history.length - 1] || "—"}</div>
                <span className="pill pill-win">{evalScore > 0 ? "+" : ""}{evalScore.toFixed(2)}</span>
              </div>
            </div>
          )}

          {panelTab === "chat" && (
            <div className="card fade-in" style={{ marginTop: 12 }}>
              <div className="chat-log" style={{ marginBottom: 8 }}>
                {chatMessages.map((m, i) => (
                  <div key={i} className={`chat-msg ${m.from === "you" ? "you" : ""}`} style={{ alignSelf: m.from === "you" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                    <div className="chat-bubble">{m.text}</div>
                    <div className="chat-time">{m.time}</div>
                  </div>
                ))}
              </div>
              {isComputer ? (
                <>
                  {BOT_CHAT_CATEGORIES.map((cat) => (
                    <div key={cat.label} style={{ marginBottom: 12 }}>
                      <div className="eyebrow" style={{ marginBottom: 6 }}>{cat.label}</div>
                      <div className="quick-msg-row" style={{ flexWrap: "wrap" }}>
                        {cat.msgs.map((msg) => (
                          <button key={msg} className="quick-msg-chip" onClick={() => sendChatMessage(msg)}>{msg}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {BOT_CHAT_CATEGORIES.map((cat) => (
                    <div key={cat.label} style={{ marginBottom: 12 }}>
                      <div className="eyebrow" style={{ marginBottom: 6 }}>{cat.label}</div>
                      <div className="quick-msg-row" style={{ flexWrap: "wrap" }}>
                        {cat.msgs.map((msg) => (
                          <button key={msg} className="quick-msg-chip" onClick={() => sendChatMessage(msg)}>{msg}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {panelTab === "info" && (
            <div className="card fade-in" style={{ marginTop: 12 }}>
              <div className="h3">Game Info</div>
              <div className="divider" style={{ margin: "12px 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Time control</span><span>{session.tc.sub} · {session.tc.label}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Moves played</span><span>{gs.history.length}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">You</span><span className="mono">Playing {session.color === "w" ? "White" : "Black"}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">{opp.name}</span><span className="mono">{opp.rating}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom sheet (mobile) */}
      <div className={`game-sheet-overlay ${sheetOpen ? "open" : ""}`} onClick={() => setSheetOpen(false)} />
      <div className={`game-sheet ${sheetOpen ? "open" : ""}`}>
        <div className="game-sheet-handle"><span /></div>
        <div className="game-sheet-head">
          <div className="h3">{sheetTab === "moves" ? "Moves" : sheetTab === "chat" ? "Chat" : "Game Info"}</div>
          <button className="btn btn-ghost btn-icon" onClick={() => setSheetOpen(false)} style={{ padding: 6 }}><X size={16} /></button>
        </div>
        <div className="game-sheet-tabs">
          <button className={sheetTab === "moves" ? "active-tab" : ""} onClick={() => setSheetTab("moves")}><Menu size={13} /> Moves</button>
          <button className={sheetTab === "chat" ? "active-tab" : ""} onClick={() => setSheetTab("chat")}><MessageSquare size={13} /> Chat</button>
          <button className={sheetTab === "info" ? "active-tab" : ""} onClick={() => setSheetTab("info")}><Info size={13} /> Info</button>
        </div>
        <div className="game-sheet-body">
          {sheetTab === "moves" && (
            <>
              <div className="movelist" style={{ maxHeight: "none" }}>
                {gs.history.length === 0 && <div className="muted" style={{ fontSize: 12.5, padding: "6px 4px" }}>No moves yet — make the opening move.</div>}
                {Array.from({ length: Math.ceil(gs.history.length / 2) }).map((_, i) => (
                  <div className="movelist-row" key={i}>
                    <span className="movelist-num">{i + 1}.</span>
                    <span
                      className={`movelist-move ${!isViewingHistory && gs.history.length - 1 === i * 2 ? "current" : ""}`}
                      onClick={() => { const idx = i * 2 + 1; setViewIndex(idx >= liveIndex ? null : idx); }}
                    >
                      {gs.history[i * 2]}
                    </span>
                    <span
                      className={`movelist-move ${!isViewingHistory && gs.history.length - 1 === i * 2 + 1 ? "current" : ""}`}
                      onClick={() => { if (!gs.history[i * 2 + 1]) return; const idx = i * 2 + 2; setViewIndex(idx >= liveIndex ? null : idx); }}
                    >
                      {gs.history[i * 2 + 1] || ""}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          {sheetTab === "chat" && (
            <>
              <div className="chat-log" style={{ marginBottom: 8, maxHeight: 200 }}>
                {chatMessages.map((m, i) => (
                  <div key={i} className={`chat-msg ${m.from === "you" ? "you" : ""}`} style={{ alignSelf: m.from === "you" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                    <div className="chat-bubble">{m.text}</div>
                    <div className="chat-time">{m.time}</div>
                  </div>
                ))}
              </div>
              {isComputer ? (
                <>
                  {BOT_CHAT_CATEGORIES.map((cat) => (
                    <div key={cat.label} style={{ marginBottom: 12 }}>
                      <div className="eyebrow" style={{ marginBottom: 6 }}>{cat.label}</div>
                      <div className="quick-msg-row" style={{ flexWrap: "wrap" }}>
                        {cat.msgs.map((msg) => (
                          <button key={msg} className="quick-msg-chip" onClick={() => { sendChatMessage(msg); setSheetOpen(false); }}>{msg}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {BOT_CHAT_CATEGORIES.map((cat) => (
                    <div key={cat.label} style={{ marginBottom: 10 }}>
                      <div className="eyebrow" style={{ marginBottom: 6 }}>{cat.label}</div>
                      <div className="quick-msg-row" style={{ flexWrap: "wrap" }}>
                        {cat.msgs.map((msg) => (
                          <button key={msg} className="quick-msg-chip" onClick={() => sendChatMessage(msg)}>{msg}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
          {sheetTab === "info" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Time control</span><span>{session.tc.sub} · {session.tc.label}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">Moves played</span><span>{gs.history.length}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">You</span><span className="mono">Playing {session.color === "w" ? "White" : "Black"}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">{opp.name}</span><span className="mono">{opp.rating}</span></div>
            </div>
          )}
        </div>
        {sheetTab === "moves" && (
          <div className="game-sheet-foot">
            <button onClick={handleDownloadPGN} disabled={gs.history.length === 0}><Download size={13} /> PGN</button>
            <button onClick={handleShare}><Share2 size={13} /> Share</button>
          </div>
        )}
      </div>

      {pendingPromotion && <PromotionDialog color={gs.turn} onChoose={choosePromotion} />}
      {showLeaveConfirm && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowLeaveConfirm(false)}>
          <div className="card" style={{ maxWidth: 380, width: "90%", padding: 28, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <Home size={32} style={{ color: "var(--brass-bright)", marginBottom: 12 }} />
            <div className="h3" style={{ marginBottom: 6 }}>Leave the match?</div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 20 }}>Your current game progress will be lost.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowLeaveConfirm(false)}>Stay</button>
              <button className="btn btn-brass" style={{ flex: 1, justifyContent: "center" }} onClick={() => { setShowLeaveConfirm(false); handleExit(); }}>Leave</button>
            </div>
          </div>
        </div>
      )}
      {incomingRematch && isOnline && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { if (incomingRematch.expired) setIncomingRematch(null); }}>
          <div className="card" style={{ maxWidth: 360, width: "90%", padding: 28, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <Repeat size={30} style={{ color: "var(--brass-bright)", marginBottom: 12, margin: "0 auto 12px" }} />
            <div className="h3" style={{ marginBottom: 6 }}>Rematch Request</div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
              {incomingRematch.expired ? "This rematch request has expired." : "Your opponent wants to play again."}
            </div>
            {!incomingRematch.expired ? (
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={declineRematch}>Decline</button>
                <button className="btn btn-brass" style={{ flex: 1, justifyContent: "center" }} onClick={acceptRematch}>Accept Rematch</button>
              </div>
            ) : (
              <button className="btn btn-ghost" style={{ justifyContent: "center" }} onClick={() => setIncomingRematch(null)}>Close</button>
            )}
          </div>
        </div>
      )}
      {gameOver && (
        <GameOverModal
          result={gameOver}
          isComputer={isComputer}
          rematchStatus={isOnline ? rematchStatus : "idle"}
          rematchReady={rematchReady}
          onCancelRematch={cancelRematch}
          rematchError={isOnline ? rematchError : null}
          onRematch={() => {
            if (isOnline) {
              // Online: rematch is a *request* to the opponent, never a direct reset.
              requestRematch();
              return;
            }
            // Computer / local: restart immediately.
            setGameOver(null);
            gameEndedRef.current = false;
            setGs(initGameState(session.color));
            // Fully reset the clock engine: clear any in-flight tick, restore the
            // selected mode's start time + increment, and restart white's clock.
            resetClockEngine();
            clockStartedRef.current = true;
            startClock("w");
            clockDisplay();
            setPremove(null);
            setPremoveSelected(null);
            setBotThinking(false);
            setViewIndex(null);
            setBotReaction(null);
            recentReactionsRef.current = [];
            if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
          }}
          onExit={handleExit}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   PUZZLE SOLVER
--------------------------------------------------------------------------- */
function PuzzleSolver({ puzzle, onResult, compact = false }) {
  const [board, setBoard] = useState(() => puzzle.board());
  const [selected, setSelected] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);
  const [status, setStatus] = useState("playing"); // playing | correct | incorrect
  const [revealed, setRevealed] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const shakeTimeout = useRef(null);

  useEffect(() => {
    setBoard(puzzle.board());
    setSelected(null);
    setLegalTargets([]);
    setStatus("playing");
    setRevealed(false);
    setLastMove(null);
    setAttempts(0);
    return () => clearTimeout(shakeTimeout.current);
  }, [puzzle]);

  const handleSquareClick = (r, c) => {
    if (status !== "playing") return;
    const piece = board[r][c];

    if (selected) {
      const move = legalTargets.find((m) => m.to.r === r && m.to.c === c);
      if (move) {
        const isSolution =
          move.from.r === puzzle.solution.from.r &&
          move.from.c === puzzle.solution.from.c &&
          move.to.r === puzzle.solution.to.r &&
          move.to.c === puzzle.solution.to.c;

        if (isSolution) {
          const result = applyMove(board, NEUTRAL_PUZZLE_STATE, move);
          setBoard(result.board);
          setLastMove(move);
          setSelected(null);
          setLegalTargets([]);
          setStatus("correct");
          onResult && onResult(true);
        } else {
          setAttempts((a) => a + 1);
          setStatus("incorrect");
          onResult && onResult(false);
          clearTimeout(shakeTimeout.current);
          shakeTimeout.current = setTimeout(() => {
            setStatus("playing");
            setSelected(null);
            setLegalTargets([]);
          }, 650);
        }
        return;
      }
      if (piece && piece.color === puzzle.orientation) {
        setSelected({ r, c });
        setLegalTargets(legalMovesFrom(board, r, c, NEUTRAL_PUZZLE_STATE));
        return;
      }
      setSelected(null);
      setLegalTargets([]);
      return;
    }

    if (piece && piece.color === puzzle.orientation) {
      setSelected({ r, c });
      setLegalTargets(legalMovesFrom(board, r, c, NEUTRAL_PUZZLE_STATE));
    }
  };

  const resetPuzzle = () => {
    clearTimeout(shakeTimeout.current);
    setBoard(puzzle.board());
    setSelected(null);
    setLegalTargets([]);
    setStatus("playing");
    setLastMove(null);
  };

  return (
    <div>
      <ChessBoard
        board={board}
        legalTargets={selected ? legalTargets : []}
        selected={selected}
        onSquareClick={handleSquareClick}
        lastMove={lastMove}
        orientation={puzzle.orientation}
        checkSquare={null}
        sqSize={compact ? 48 : window.innerHeight < 800 ? 44 : 54}
      />
      <div style={{ textAlign: "center", marginTop: 14, width: "100%" }}>
        <div className="h3" style={{ fontWeight: 700, color: "var(--ivory)" }}>{puzzle.orientation === "w" ? "White" : "Black"} to move</div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{puzzle.intro}</div>

        {status === "correct" && (
          <div
            className="fade-in"
            style={{ marginTop: 10, color: "var(--malachite)", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Check size={15} /> {puzzle.success}
          </div>
        )}
        {status === "incorrect" && (
          <div className="fade-in" style={{ marginTop: 10, color: "var(--danger-bright)", fontWeight: 700, fontSize: 13 }}>
            Not quite — try again.
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            className="btn btn-ghost"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={() => setRevealed((v) => !v)}
            disabled={status === "correct"}
          >
            <Lightbulb size={15} /> {revealed ? "Hide hint" : "Reveal hint"}
          </button>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={resetPuzzle}>
            <RotateCcw size={15} /> Reset
          </button>
        </div>
        {revealed && status !== "correct" && (
          <div className="muted fade-in" style={{ fontSize: 12.5, marginTop: 10 }}>{puzzle.hint}</div>
        )}
        {attempts > 0 && status === "playing" && (
          <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>{attempts} attempt{attempts === 1 ? "" : "s"} so far</div>
        )}
      </div>
    </div>
  );
}

/* ---- Daily tab ---- */
function DailyPuzzleTab({ profile, onPuzzleResult }) {
  const [dayIndex, setDayIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const puzzle = PUZZLES[dayIndex % PUZZLES.length];

  return (
    <div className="puzzle-layout">
      <div className="puzzle-board-col">
        <PuzzleSolver
          key={dayIndex}
          puzzle={puzzle}
          onResult={(correct) => {
            onPuzzleResult(correct);
            if (correct) setSolved(true);
          }}
        />
        {solved && (
          <button
            className="btn btn-brass"
            style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
            onClick={() => {
              setDayIndex((i) => i + 1);
              setSolved(false);
            }}
          >
            Next puzzle <ChevronRight size={15} />
          </button>
        )}
      </div>

      <div className="puzzle-side">
        <div className="puzzle-stats-row">
          <div className="puzzle-side-stat">
            <div className="puzzle-stat-top">
              <div className="eyebrow">Puzzle rating</div>
              <div className="puzzle-stat-sub">{profile.puzzle.solved} solved total</div>
            </div>
            <div className="stat-num" style={{ color: "var(--brass-bright)" }}>{profile.puzzle.rating}</div>
          </div>
          <div className="puzzle-side-stat">
            <div className="puzzle-stat-top">
              <div className="eyebrow">Current streak</div>
              <div className="puzzle-stat-sub">Best: {profile.puzzle.bestStreak} days</div>
            </div>
            <div className="stat-num" style={{ display: "flex", alignItems: "center", gap: 6 }}><Flame size={19} color="var(--danger-bright)" /> {profile.puzzle.streak} days</div>
          </div>
        </div>

        <div className="card">
          <div className="h3">Recent puzzles</div>
          <div className="divider" />
          {profile.puzzle.log.length === 0 ? (
            <div className="muted" style={{ fontSize: 12.5, padding: "14px 4px", textAlign: "center" }}>Solve puzzles to build your history.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {profile.puzzle.log.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Target size={15} color="var(--muted-2)" />
                    <span style={{ fontSize: 13 }}>{new Date(p.when).toLocaleDateString()}</span>
                  </div>
                  <span className={`pill ${p.result === "solved" ? "pill-win" : "pill-loss"}`}>{p.delta > 0 ? "+" : ""}{p.delta}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Themes tab ---- */
function ThemesView({ onPuzzleResult }) {
  const [activeTheme, setActiveTheme] = useState(null);
  const puzzlesByTheme = useMemo(() => {
    const map = {};
    PUZZLES.forEach((p) => { map[p.theme] = p; });
    return map;
  }, []);
  const activePuzzle = activeTheme ? puzzlesByTheme[activeTheme] : null;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
        {THEME_LIST.map((t) => {
          const available = !!puzzlesByTheme[t];
          const isActive = activeTheme === t;
          return (
            <button
              key={t}
              className="tag"
              style={{
                padding: "7px 14px",
                cursor: available ? "pointer" : "default",
                opacity: available ? 1 : 0.45,
                border: `1px solid ${isActive ? "var(--brass-bright)" : "transparent"}`,
                color: isActive ? "var(--brass-bright)" : undefined,
                background: isActive ? "rgba(124,92,252,0.14)" : "var(--surface-raised)",
              }}
              onClick={() => available && setActiveTheme(t)}
            >
              {t}{!available && " · soon"}
            </button>
          );
        })}
      </div>

      {activePuzzle ? (
        <div style={{ maxWidth: 400, margin: "0 auto" }}>
          <PuzzleSolver key={activePuzzle.id} puzzle={activePuzzle} onResult={onPuzzleResult} />
        </div>
      ) : (
        <div className="muted" style={{ textAlign: "center", padding: "50px 0" }}>
          Pick a theme above to start a themed puzzle.
        </div>
      )}
    </div>
  );
}

/* ---- Training tab: Puzzle Rush ---- */
function TrainingView({ onPuzzleResult, onRushEnd }) {
  const RUSH_SECONDS = 90;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(RUSH_SECONDS);
  const [running, setRunning] = useState(true);
  const advanceTimeout = useRef(null);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (!running && !endedRef.current) {
      endedRef.current = true;
      onRushEnd(score);
    }
  }, [running, score, onRushEnd]);

  useEffect(() => () => clearTimeout(advanceTimeout.current), []);

  const puzzle = PUZZLES[index % PUZZLES.length];

  const handleResult = (correct) => {
    if (!running) return;
    onPuzzleResult(correct);
    if (!correct) return;
    setScore((s) => s + 1);
    advanceTimeout.current = setTimeout(() => setIndex((i) => i + 1), 550);
  };

  const restart = () => {
    clearTimeout(advanceTimeout.current);
    endedRef.current = false;
    setIndex(0);
    setScore(0);
    setTimeLeft(RUSH_SECONDS);
    setRunning(true);
  };

  if (!running) {
    return (
      <div className="card fade-in" style={{ maxWidth: 400, margin: "40px auto", textAlign: "center", padding: 32 }}>
        <div className="placeholder-icon" style={{ margin: "0 auto 14px" }}><Timer size={26} /></div>
        <div className="h2">Time's up!</div>
        <div className="muted" style={{ marginTop: 6, fontSize: 13.5 }}>
          You solved {score} puzzle{score === 1 ? "" : "s"} in {RUSH_SECONDS} seconds.
        </div>
        <button className="btn btn-brass" style={{ marginTop: 20 }} onClick={restart}>
          <Repeat size={15} /> Play again
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 380, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div className="tag" style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px" }}>
          <Timer size={13} /> {timeLeft}s
        </div>
        <div className="tag" style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px" }}>
          <Target size={13} /> Score {score}
        </div>
      </div>
      <PuzzleSolver key={`${puzzle.id}-${index}`} puzzle={puzzle} onResult={handleResult} compact />
    </div>
  );
}

/* ---- History tab ---- */
function PuzzleHistoryView({ profile }) {
  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <div className="card">
        <div className="h3">Recent puzzles</div>
        <div className="divider" />
        {profile.puzzle.log.length === 0 ? (
          <div className="muted" style={{ fontSize: 13, padding: "16px 4px" }}>No puzzle attempts yet.</div>
        ) : (
          profile.puzzle.log.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Target size={15} color="var(--muted-2)" />
                <span style={{ fontSize: 13 }}>{new Date(p.when).toLocaleString()}</span>
              </div>
              <span className={`pill ${p.result === "solved" ? "pill-win" : "pill-loss"}`}>{p.delta > 0 ? "+" : ""}{p.delta}</span>
            </div>
          ))
        )}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="h3">Themes to practice</div>
        <div className="divider" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {THEME_LIST.map((t) => (
            <span key={t} className="tag" style={{ padding: "6px 12px" }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   PUZZLES VIEW
--------------------------------------------------------------------------- */
function PuzzlesView({ profile, onPuzzleResult, onRushEnd }) {
  const [tab, setTab] = useState("daily");

  return (
    <div className="fade-in">
      <div className="eyebrow">Puzzles</div>
      <div className="h1" style={{ fontSize: 28, marginTop: 6 }}>Sharpen your tactics</div>

      <div className="tabbar" style={{ width: "min(100%, 340px)", marginTop: 18 }}>
        {["daily", "themes", "training", "history"].map((t) => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 22 }}>
        {tab === "daily" && <DailyPuzzleTab profile={profile} onPuzzleResult={onPuzzleResult} />}
        {tab === "themes" && <ThemesView onPuzzleResult={onPuzzleResult} />}
        {tab === "training" && <TrainingView onPuzzleResult={onPuzzleResult} onRushEnd={onRushEnd} />}
        {tab === "history" && <PuzzleHistoryView profile={profile} />}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   PROFILE VIEW
--------------------------------------------------------------------------- */
function ProfileView({ profile }) {
  const [tab, setTab] = useState("overview");

  const winRate = profile.gamesPlayed > 0 ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0;
  const bestRapid = profile.ratingHistory.rapid.length ? Math.max(...profile.ratingHistory.rapid) : profile.ratings.rapid;
  const joined = new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" });

  return (
    <div className="fade-in">
      <div className="profile-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <PlayerAvatar profile={profile} size={64} />
          <div>
            <div className="h2" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>{profile.name} <TierBadge rating={profile.ratings.rapid} size="lg" /></div>
            {profile.username && <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>@{profile.username}</div>}
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>Joined {joined}</div>
          </div>
        </div>
      </div>

      <div className="tabbar" style={{ width: "min(100%, 460px)", marginTop: 20 }}>
        {["overview", "stats", "games", "achievements"].map((t) => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="profile-rating-grid" style={{ marginTop: 20 }}>
        <div className="stat-card"><div className="eyebrow">Rapid</div><div className="stat-num">{profile.ratings.rapid}</div></div>
        <div className="stat-card"><div className="eyebrow">Blitz</div><div className="stat-num">{profile.ratings.blitz}</div></div>
        <div className="stat-card"><div className="eyebrow">Bullet</div><div className="stat-num">{profile.ratings.bullet}</div></div>
        <div className="stat-card"><div className="eyebrow">Puzzles</div><div className="stat-num">{profile.puzzle.rating}</div></div>
      </div>

      {tab === "overview" && (
        <div className="ov-grid" style={{ marginTop: 18 }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="h3">Rating progress</div>
              <span className="tag">Rapid</span>
            </div>
            <div style={{ marginTop: 10 }}>
              {profile.ratingHistory.rapid.length > 1 ? (
                <Sparkline data={profile.ratingHistory.rapid} width={460} height={120} />
              ) : (
                <div className="muted" style={{ padding: "40px 0", textAlign: "center", fontSize: 13 }}>Play rapid games to see your progress here.</div>
              )}
            </div>
          </div>
          <div className="card">
            <div className="h3">Badges</div>
            <div className="divider" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {ACHIEVEMENT_DEFS.slice(0, 4).map((a) => {
                const unlocked = a.test(profile);
                const Icon = unlocked ? a.icon : Lock;
                return (
                  <div className="badge-tile" style={{ opacity: unlocked ? 1 : 0.4 }} key={a.id}>
                    <div className={`badge-icon ${a.tone}`}><Icon size={19} /></div>
                    <div style={{ fontSize: 11.5, fontWeight: 600 }}>{a.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "stats" && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="h3">Performance</div>
          <div className="divider" />
          <div className="grid-3">
            <div className="stat-card"><div className="eyebrow">Wins</div><div className="stat-num" style={{ color: "var(--malachite)" }}>{profile.wins}</div></div>
            <div className="stat-card"><div className="eyebrow">Losses</div><div className="stat-num" style={{ color: "var(--danger-bright)" }}>{profile.losses}</div></div>
            <div className="stat-card"><div className="eyebrow">Draws</div><div className="stat-num">{profile.draws}</div></div>
          </div>
          <div className="divider" />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
            <span className="muted">Win rate</span><span>{winRate}%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginTop: 8 }}>
            <span className="muted">Best win streak</span><span>{profile.bestWinStreak}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginTop: 8 }}>
            <span className="muted">Best puzzle streak</span><span>{profile.puzzle.bestStreak} days</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginTop: 8 }}>
            <span className="muted">Best Puzzle Rush score</span><span>{profile.puzzle.bestRushScore}</span>
          </div>
        </div>
      )}

      {tab === "games" && (
        <div className="card" style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="h3">Games</div>
            <div style={{ display: "flex", gap: 20, fontSize: 12.5, flexWrap: "wrap" }}>
              <span className="muted">Games <b style={{ color: "var(--ivory)" }}>{profile.gamesPlayed}</b></span>
              <span className="muted">Win Rate <b style={{ color: "var(--malachite)" }}>{winRate}%</b></span>
              <span className="muted">Best Rating <b style={{ color: "var(--ivory)" }}>{bestRapid}</b></span>
            </div>
          </div>
          <div className="divider" />
          {profile.recentGames.length === 0 ? (
            <div className="muted" style={{ fontSize: 13, padding: "20px 4px", textAlign: "center" }}>No games played yet — head to Play to get started.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {profile.recentGames.map((g) => (
                <div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={g.opponent} size={30} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{g.opponent}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{g.control} · {new Date(g.when).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span className={`pill pill-${g.result}`}>{g.result === "win" ? "Win" : g.result === "loss" ? "Loss" : "Draw"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "achievements" && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="h3">Badges</div>
          <div className="divider" />
          <div className="grid-3" style={{ gap: 12 }}>
            {ACHIEVEMENT_DEFS.map((a) => {
              const unlocked = a.test(profile);
              const Icon = unlocked ? a.icon : Lock;
              return (
                <div className="badge-tile" style={{ opacity: unlocked ? 1 : 0.4 }} key={a.id}>
                  <div className={`badge-icon ${a.tone}`}><Icon size={19} /></div>
                  <div style={{ fontSize: 11.5, fontWeight: 600 }}>{a.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   APP ROOT
--------------------------------------------------------------------------- */
export default function ChessPlayerPage({ gameData }) {
  const [view, setView] = useState("play");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const matchSessionTokenRef = useRef(null);

  const completeMatchSession = useCallback((payload) => {
    const token = matchSessionTokenRef.current;
    matchSessionTokenRef.current = null;
    if (!token || !gameData?.id) return;
    api.post("/play/session/complete", {
      session_token: token,
      score: 0,
      player_data: {
        category: payload?.category || "chess",
        result: payload?.result || "none",
        opponentName: payload?.opponentName || "",
        control: payload?.control || "",
      },
    }).catch(() => {});
  }, [gameData]);

  // ── Global forced rematch popup ────────────────────────────────────────────
  // The rematch popup normally lives inside GameView, which unmounts when the
  // player exits a match. To let an opponent *force* an incoming rematch request
  // onto this screen even after we've left the game (or are browsing elsewhere),
  // the shell keeps track of the most recent online room and polls it here.
  // Identifies the requesting player by the stable numeric playerId (see the
  // backend player1_id/player2_id/rematch_requested_by_id), so even two players
  // sharing the name "Player" are never mis-attributed.
  const lastRoomRef = useRef(null); // { roomCode, myId, myName, session }
  const [forcedRematch, setForcedRematch] = useState(null);
  const forcedPopupHandledRef = useRef(null); // requested_at guard
  const forcedPopupExpireRef = useRef(null);
  const rematchStartedRef = useRef(null); // Prevents WS push + reconcile double-start race

  useEffect(() => {
    (async () => {
      const storedProfile = (await storageGet("profile", null)) || defaultProfile();
      try {
        const raw = localStorage.getItem("playerUser") || sessionStorage.getItem("playerUser");
        if (raw) {
          const u = JSON.parse(raw);
          if (u.name || u.username || u.avatar_id) {
            storedProfile.name = u.name || storedProfile.name;
            storedProfile.username = u.username || storedProfile.username;
            storedProfile.avatarId = u.avatar_id || storedProfile.avatarId;
          }
        }
      } catch (e) { /* ignore malformed stored player */ }
      if (localStorage.getItem("playerToken") || sessionStorage.getItem("playerToken")) {
        try {
          const { data } = await api.get("/pauth/me");
          const p = data.player || data;
          if (p && (p.name || p.username || p.avatar_id)) {
            storedProfile.name = p.name || storedProfile.name;
            storedProfile.username = p.username || storedProfile.username;
            storedProfile.avatarId = p.avatar_id || storedProfile.avatarId;
          }
        } catch (e) { /* fall back to stored player */ }
      }
      setProfile(storedProfile);
      storageSet("profile", storedProfile);
      setLoaded(true);
    })();
  }, []);

  // Resume a persisted online game after a background reload (e.g. returning from WhatsApp).
  useEffect(() => {
    if (!loaded) return;
    const raw = sessionStorage.getItem("chess:activeSession");
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (saved && saved.mode === "online" && saved.roomCode) {
        setSession({ ...saved, id: `${Date.now()}-resumed` });
        setView("game");
        lastRoomRef.current = {
          roomCode: saved.roomCode,
          myId: saved.playerId ?? PLAYER_ID,
          myName: saved.playerName || "Player",
          session: saved,
        };
      }
    } catch (e) { /* ignore malformed */ }
  }, [loaded]);

  const notify = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const updateProfile = useCallback((updater) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      storageSet("profile", next);
      return next;
    });
  }, []);

  const onGameEnd = useCallback((payload) => {
    sessionStorage.removeItem("chess:activeSession");
    completeMatchSession(payload);
    updateProfile((prev) => applyGameResult(prev, payload));
  }, [updateProfile, completeMatchSession]);

  const onPuzzleResult = useCallback((correct) => {
    updateProfile((prev) => applyPuzzleResult(prev, correct));
  }, [updateProfile]);

  const onRushEnd = useCallback((score) => {
    updateProfile((prev) => applyRushScore(prev, score));
  }, [updateProfile]);

  const startGame = (sessionCfg) => {
    // A fresh id guarantees GameView remounts (brand-new board + clocks) for
    // every match — critically important for synchronized online rematches so we
    // never reuse stale state or the previous match's id.
    setSession({ ...sessionCfg, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
    setView("game");
    if (gameData?.id) {
      const devId = getDeviceId();
      api.post("/play/session/start", {
        game_id: gameData.id,
        player_data: {},
        source_type: "direct",
        device_id: devId || undefined,
        promo_player_id: getPromoPlayerId() || undefined,
      }).then((res) => {
        if (res.data?.session_token) matchSessionTokenRef.current = res.data.session_token;
      }).catch(() => {});
    }
    // Persist online sessions so a background reload (e.g. returning from WhatsApp)
    // resumes the match instead of discarding it.
    if (sessionCfg.mode === "online" && sessionCfg.roomCode) {
      sessionStorage.setItem("chess:activeSession", JSON.stringify(sessionCfg));
      // Track this room at the shell so an incoming rematch popup can be forced
      // even after the player leaves the game screen.
      lastRoomRef.current = {
        roomCode: sessionCfg.roomCode,
        myId: sessionCfg.playerId ?? PLAYER_ID,
        myName: sessionCfg.playerName || sessionCfg.opponent?.selfName || "Player",
        session: sessionCfg,
      };
      setForcedRematch(null);
      clearTimeout(forcedPopupExpireRef.current);
      forcedPopupHandledRef.current = null;
      rematchStartedRef.current = null; // clear so next rematch can proceed
    } else {
      sessionStorage.removeItem("chess:activeSession");
    }
  };

  // Accept an incoming (forced) rematch popup at the shell level.
  const rematchAccept = useCallback(async () => {
    const track = lastRoomRef.current;
    const fc = forcedRematch;
    if (!track || !fc) return;
    try {
      const res = await api.post(`/chess/room/${fc.roomCode}/rematch/respond`, {
        player_name: track.myName, player_id: track.myId, action: "accept",
      });
      clearTimeout(forcedPopupExpireRef.current);
      forcedPopupHandledRef.current = null;
      setForcedRematch(null);
      const code = res.data.new_room_code || res.data.rematch?.new_room_code;
      if (code) {
        // If GameView reconcile already started this room, skip to prevent
        // double color-swap (same race as handleForcedAccepted).
        if (lastRoomRef.current?.roomCode === code) return;
        const prev = track.session || {};
        // Rematch swaps colors; everything else (tc, opponent, id) is preserved.
        startGame({ ...prev, roomCode: code, color: prev.color === "w" ? "b" : "w", id: undefined });
      } else {
        notify("Rematch accepted.");
      }
    } catch (e) {
      notify("Could not accept the rematch request.");
      setForcedRematch(null);
    }
  }, [forcedRematch, notify, startGame]);

  const rematchDecline = useCallback(async () => {
    const track = lastRoomRef.current;
    const fc = forcedRematch;
    if (!track || !fc) return;
    setForcedRematch(null);
    clearTimeout(forcedPopupExpireRef.current);
    forcedPopupHandledRef.current = null;
    try {
      await api.post(`/chess/room/${fc.roomCode}/rematch/respond`, {
        player_name: track.myName, player_id: track.myId, action: "decline",
      });
    } catch (e) { /* best-effort decline */ }
  }, [forcedRematch]);

  // Shared handling of an incoming rematch request so the poll fallback and the
  // WebSocket push both surface the identical forced popup.
  const showForcedRequest = useCallback((roomCode, requested_by, requested_by_id) => {
    const track = lastRoomRef.current;
    const incomingToMe =
      requested_by_id != null
        ? requested_by_id !== track?.myId
        : (requested_by != null && requested_by !== track?.myName);
    if (!incomingToMe) return;
    const reqKey = JSON.stringify([requested_by, requested_by_id, roomCode]);
    if (forcedPopupHandledRef.current === reqKey) return;
    forcedPopupHandledRef.current = reqKey;
    setForcedRematch({ roomCode, requested_by });
    clearTimeout(forcedPopupExpireRef.current);
    forcedPopupExpireRef.current = setTimeout(() => {
      setForcedRematch((cur) => (cur && cur.roomCode === roomCode ? { ...cur, expired: true } : cur));
    }, 30000);
  }, []);

  // Shared handling of "your request was accepted" so any screen boots the new match.
  const handleForcedAccepted = useCallback((newRoomCode) => {
    forcedPopupHandledRef.current = null;
    setForcedRematch(null);
    clearTimeout(forcedPopupExpireRef.current);
    if (!newRoomCode) return;
    // If the GameView reconcile already started this room, don't double-start
    // (prevents a race where reconcile swaps color then WS swaps it back).
    if (lastRoomRef.current?.roomCode === newRoomCode) return;
    rematchStartedRef.current = newRoomCode;
    const prev = lastRoomRef.current?.session || {};
    setView("game");
    startGame({ ...prev, roomCode: newRoomCode, color: prev.color === "w" ? "b" : "w", id: undefined });
  }, [startGame]);

  // Force an incoming rematch popup onto ANY screen (including after leaving the
  // game) by watching the most recent online room. While the player is on the
  // game screen for that exact room, GameView already surfaces the popup, so the
  // shell defers to it there to avoid duplicating the UI.
  useEffect(() => {
    if (!loaded) return;
    const track = lastRoomRef.current;
    if (!track || !track.roomCode) return;
    const roomCode = track.roomCode;
    // Defer to the in-game GameView popup when it's showing this room.
    if (view === "game" && session?.roomCode === roomCode) return;

    let timer;
    const check = async () => {
      try {
        const { data } = await api.get(`/chess/room/${roomCode}`);
        const r = (data.room && data.room.rematch) || {};
        if (r.status === "requested" && r.requested_by) {
          showForcedRequest(roomCode, r.requested_by, r.requested_by_id);
        } else if (r.status === "accepted" && r.new_room_code) {
          handleForcedAccepted(r.new_room_code);
        }
      } catch (e) { /* room unreachable; opponent likely left */ }
    };
    check();
    timer = setInterval(check, 1500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, view, session?.id, session?.roomCode, handleForcedAccepted, showForcedRequest]);

  // WebSocket push: registers this browser's player_id once and reacts to
  // rematch events instantly (no need to wait for the poll). Reconnects with a
  // simple backoff and re-registers on every (re)connect.
  useEffect(() => {
    if (!loaded) return;
    let ws = null;
    let closed = false;
    let retry = 0; // just to vary the reconnect delay
    let reconnectTimer = null;

    const connect = () => {
      if (closed) return;
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      let socket;
      try {
        socket = new WebSocket(`${proto}://${window.location.host}/ws/chess`);
      } catch (e) { return; }
      ws = socket;
      socket.onopen = () => {
        retry = 0;
        socket.send(JSON.stringify({ type: "hello", player_id: PLAYER_ID }));
      };
      socket.onmessage = (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch (e) { return; }
        if (!msg || msg.type !== "rematch") return;
        if (msg.action === "requested" && msg.room_code) {
          // Only the opponent of the tracked room needs to act; showForcedRequest
          // already guards by player id.
          showForcedRequest(msg.room_code, msg.requested_by, msg.requested_by_id);
        } else if (msg.action === "accepted" && msg.new_room_code) {
          handleForcedAccepted(msg.new_room_code);
        }
      };
      socket.onclose = () => {
        if (closed) return;
        const delay = Math.min(1000 * Math.pow(2, retry++), 15000);
        reconnectTimer = setTimeout(connect, delay);
      };
      socket.onerror = () => { try { socket.close(); } catch (e) {} };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(reconnectTimer);
      try { if (ws) ws.close(); } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, handleForcedAccepted, showForcedRequest]);
  if (!loaded || !profile) {
    return (
      <div className="cv">
        <Style />
        <div className="scrim" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 12, position: "relative", zIndex: 1 }}>
          <div className="placeholder-icon"><Crown size={26} /></div>
          <div className="muted">Loading your profile…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cv">
      <Style />
      <div className="scrim" />
      <div className="cv-shell">
        {view !== "game" && <Sidebar view={view} setView={setView} profile={profile} />}
        <div className="main-col">
          <div className="content">
            {view === "play" && <PlayView onStart={startGame} profile={profile} notify={notify} />}
            {view === "game" && session && (
              <GameView key={session.id} session={session} onExit={() => { sessionStorage.removeItem("chess:activeSession"); setView("play"); }} onGameEnd={onGameEnd} onRematchStart={startGame} notify={notify} profile={profile} rematchStartedRef={rematchStartedRef} />
            )}
            {view === "puzzles" && <PuzzlesView profile={profile} onPuzzleResult={onPuzzleResult} onRushEnd={onRushEnd} />}
            {view === "profile" && <ProfileView profile={profile} />}
          </div>
        </div>
      </div>
      <Toast message={toast} />
      {forcedRematch && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { if (forcedRematch.expired) { setForcedRematch(null); forcedPopupHandledRef.current = null; } }}>
          <div className="card" style={{ maxWidth: 360, width: "90%", padding: 28, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <Repeat size={30} style={{ color: "var(--brass-bright)", margin: "0 auto 12px" }} />
            <div className="h3" style={{ marginBottom: 6 }}>Rematch Request</div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
              {forcedRematch.expired
                ? "This rematch request has expired."
                : `${forcedRematch.requested_by || "Your opponent"} wants to play again.`}
            </div>
            {!forcedRematch.expired ? (
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={rematchDecline}>Decline</button>
                <button className="btn btn-brass" style={{ flex: 1, justifyContent: "center" }} onClick={rematchAccept}>Accept Rematch</button>
              </div>
            ) : (
              <button className="btn btn-ghost" style={{ justifyContent: "center" }} onClick={() => { setForcedRematch(null); forcedPopupHandledRef.current = null; }}>Close</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}