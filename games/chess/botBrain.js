/* ============================================================================
   BOT BRAIN FRAMEWORK
   A single extensible system that powers all bot opponents.
   Every bot shares the same brain but configures it differently via profiles.
   ============================================================================ */

// ---------------------------------------------------------------------------
// PIECE VALUES — used everywhere
// ---------------------------------------------------------------------------
const PV = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 0 };

// Positional bonus tables (from White's perspective, row 0 = rank 8)
// Encourages central control, piece activity, pawn structure.
const PST_PAWN = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [ 5,  5, 10, 25, 25, 10,  5,  5],
  [ 0,  0,  0, 20, 20,  0,  0,  0],
  [ 5, -5,-10,  0,  0,-10, -5,  5],
  [ 5, 10, 10,-20,-20, 10, 10,  5],
  [ 0,  0,  0,  0,  0,  0,  0,  0],
];

const PST_KNIGHT = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50],
];

const PST_BISHOP = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20],
];

const PST_ROOK = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [ 0,  0,  0,  5,  5,  0,  0,  0],
];

const PST_QUEEN = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [ -5,  0,  5,  5,  5,  5,  0, -5],
  [  0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20],
];

const PST_KING_MID = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 30, 10,  0,  0, 10, 30, 20],
];

const PST = { p: PST_PAWN, n: PST_KNIGHT, b: PST_BISHOP, r: PST_ROOK, q: PST_QUEEN, k: PST_KING_MID };

// ---------------------------------------------------------------------------
// POSITION EVALUATION — better than pure material
// ---------------------------------------------------------------------------
export function evaluatePosition(board, color) {
  let score = 0;
  const opp = color === "w" ? "b" : "w";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const sign = p.color === color ? 1 : -1;
      // Material
      score += sign * (PV[p.type] || 0) * 100;
      // Positional bonus from PST
      const table = PST[p.type];
      if (table) {
        const row = p.color === "w" ? r : 7 - r;
        score += sign * table[row][c];
      }
    }
  }
  // Mobility bonus (simplified — count legal moves approximation)
  return score;
}

// ---------------------------------------------------------------------------
// MINIMAX with alpha-beta pruning — used by stronger bots
// ---------------------------------------------------------------------------
function minimax(board, state, color, depth, alpha, beta, maximizing) {
  if (depth <= 0) return evaluatePosition(board, "w");

  // We need getLegalMoves and applyMove passed in or imported
  // This will be called with helpers from ChessPlayerPage
  return evaluatePosition(board, "w"); // placeholder — real impl wired in ChessPlayerPage
}

// ---------------------------------------------------------------------------
// BOT PROFILES — each bot has a unique personality
// ---------------------------------------------------------------------------
export const BOT_PROFILES = {
  meiLin: {
    id: "meiLin",
    name: "Mei Lin",
    title: null,
    flag: "🇨🇳",
    baseElo: 850,
    personality: {
      aggression: 0.25,
      tacticalAwareness: 0.30,
      positionalAwareness: 0.50,
      riskTolerance: 0.20,
      calculationDepth: 1,
      blunderTendency: 0.12,
      mistakeTendency: 0.20,
      openingKnowledge: 0.30,
      endgameKnowledge: 0.25,
      kingSafetyPriority: 0.75,
      patience: 0.80,
    },
    style: "cautious",
    description: "Patient beginner who prefers safe development and avoids complications.",
    thinkingStyle: "slow", // takes time even on simple positions
    reactionPersonality: "polite",
  },

  diego: {
    id: "diego",
    name: "Diego",
    title: null,
    flag: "🇲🇽",
    baseElo: 1250,
    personality: {
      aggression: 0.82,
      tacticalAwareness: 0.61,
      positionalAwareness: 0.43,
      riskTolerance: 0.76,
      calculationDepth: 2,
      blunderTendency: 0.09,
      mistakeTendency: 0.14,
      openingKnowledge: 0.55,
      endgameKnowledge: 0.46,
      kingSafetyPriority: 0.45,
      patience: 0.35,
    },
    style: "aggressive",
    description: "Aggressive intermediate who likes attacking and pushing kingside pawns.",
    thinkingStyle: "fast", // plays quickly, intuitively
    reactionPersonality: "emotional",
  },

  arjun: {
    id: "arjun",
    name: "Arjun",
    title: "CM",
    flag: "🇮🇳",
    baseElo: 1650,
    personality: {
      aggression: 0.45,
      tacticalAwareness: 0.68,
      positionalAwareness: 0.78,
      riskTolerance: 0.35,
      calculationDepth: 4,
      blunderTendency: 0.04,
      mistakeTendency: 0.10,
      openingKnowledge: 0.72,
      endgameKnowledge: 0.65,
      kingSafetyPriority: 0.70,
      patience: 0.75,
    },
    style: "positional",
    description: "Positional player who values structure, development, and patience.",
    thinkingStyle: "measured",
    reactionPersonality: "analytical",
  },

  victor: {
    id: "victor",
    name: "Victor",
    title: "FM",
    flag: "🇷🇺",
    baseElo: 2100,
    personality: {
      aggression: 0.70,
      tacticalAwareness: 0.90,
      positionalAwareness: 0.80,
      riskTolerance: 0.55,
      calculationDepth: 7,
      blunderTendency: 0.015,
      mistakeTendency: 0.05,
      openingKnowledge: 0.88,
      endgameKnowledge: 0.85,
      kingSafetyPriority: 0.65,
      patience: 0.55,
    },
    style: "tactical",
    description: "Strong tactical player who calculates combinations and punishes weaknesses.",
    thinkingStyle: "deep",
    reactionPersonality: "confident",
  },

  elena: {
    id: "elena",
    name: "Elena",
    title: "WGM",
    flag: "🇺🇦",
    baseElo: 2350,
    personality: {
      aggression: 0.60,
      tacticalAwareness: 0.93,
      positionalAwareness: 0.90,
      riskTolerance: 0.45,
      calculationDepth: 10,
      blunderTendency: 0.008,
      mistakeTendency: 0.03,
      openingKnowledge: 0.92,
      endgameKnowledge: 0.90,
      kingSafetyPriority: 0.72,
      patience: 0.65,
    },
    style: "universal",
    description: "Complete player with deep calculation and positional mastery.",
    thinkingStyle: "deep",
    reactionPersonality: "composed",
  },
};

// ---------------------------------------------------------------------------
// DIFFICULTY PRESETS — maps difficulty string to a Elo range + profile
// ---------------------------------------------------------------------------
export const DIFFICULTY_PRESETS = {
  beginner: { eloRange: [500, 800], candidateCount: 10, engineWeight: 0.20, noiseScale: 1.8, searchDepth: 1 },
  easy:     { eloRange: [800, 1100], candidateCount: 8, engineWeight: 0.35, noiseScale: 1.4, searchDepth: 2 },
  medium:   { eloRange: [1100, 1500], candidateCount: 6, engineWeight: 0.55, noiseScale: 1.0, searchDepth: 3 },
  hard:     { eloRange: [1500, 1900], candidateCount: 4, engineWeight: 0.75, noiseScale: 0.6, searchDepth: 5 },
  expert:   { eloRange: [1900, 2300], candidateCount: 3, engineWeight: 0.88, noiseScale: 0.3, searchDepth: 7 },
  master:   { eloRange: [2300, 2800], candidateCount: 2, engineWeight: 0.95, noiseScale: 0.1, searchDepth: 10 },
};

// ---------------------------------------------------------------------------
// ADAPTIVE DIFFICULTY — picks a profile + adjusts based on player rating
// ---------------------------------------------------------------------------
export function selectBotForDifficulty(difficulty, playerRating = 1200) {
  const preset = DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS.medium;

  // Pick profile closest to target Elo
  const targetElo = (preset.eloRange[0] + preset.eloRange[1]) / 2;
  let bestProfile = BOT_PROFILES.diego;
  let bestDist = Infinity;
  for (const prof of Object.values(BOT_PROFILES)) {
    const dist = Math.abs(prof.baseElo - targetElo);
    if (dist < bestDist) { bestDist = dist; bestProfile = prof; }
  }

  return {
    ...bestProfile,
    difficulty,
    targetElo,
    ...preset,
    // Blend personality traits toward the difficulty preset
    effectiveElo: targetElo + (Math.random() - 0.5) * 200, // slight per-game variance
  };
}

// ---------------------------------------------------------------------------
// MOVE SCORING — evaluates each candidate move with personality weighting
// ---------------------------------------------------------------------------
export function scoreMoveWithPersonality(board, move, state, color, profile, evalBefore) {
  // Engine evaluation of the move
  const { applyMove: am } = state._helpers || {};
  if (!am) return 0;

  const result = am(board, state, move);
  const evalAfter = evaluatePosition(result.board, color);
  const evalGain = evalAfter - evalBefore;
  const opp = color === "w" ? "b" : "w";

  // Check if the move leaves us in check (illegal)
  const { findKing: fk, isSquareAttacked: isa, getLegalMoves: glm } = state._helpers || {};
  if (fk && isa && glm) {
    const kingPos = fk(result.board, color);
    if (kingPos && isa(result.board, kingPos.r, kingPos.c, opp)) {
      return -10000; // illegal move
    }
  }

  const p = board[move.from.r][move.from.c];
  const personality = profile.personality || {};

  let score = evalGain;

  // --- Personality adjustments ---

  // Aggression bonus for captures and attacks
  if (move.capture) {
    const capturedPiece = board[move.to.r][move.to.c];
    const captureValue = capturedPiece ? PV[capturedPiece.type] || 0 : 0;
    score += captureValue * 10 * (personality.aggression || 0.5);
  }

  // Risk tolerance — penalize moves that lose material
  if (evalGain < -20) {
    score -= Math.abs(evalGain) * (1 - (personality.riskTolerance || 0.5)) * 0.5;
  }

  // King safety — penalize exposing the king
  if (p && p.type === "k" && move.castle) {
    score += 30 * (personality.kingSafetyPriority || 0.5);
  }

  // Center control bonus for pawn/piece moves to center
  const centerDist = Math.abs(move.to.r - 3.5) + Math.abs(move.to.c - 3.5);
  if (centerDist < 3) {
    score += (4 - centerDist) * 3 * (personality.positionalAwareness || 0.5);
  }

  // Piece development bonus in opening (first 10 moves)
  if (state._moveCount !== undefined && state._moveCount < 10) {
    if (p && (p.type === "n" || p.type === "b")) {
      const homeRow = color === "w" ? 7 : 0;
      if (move.from.r === homeRow) {
        score += 15 * (personality.openingKnowledge || 0.5);
      }
    }
  }

  // Castling bonus
  if (move.castle) {
    score += 20 * (personality.kingSafetyPriority || 0.5);
  }

  // Promotion bonus
  if (move.promotion === "q") {
    score += 80;
  } else if (move.promotion) {
    score += 30;
  }

  return score;
}

// ---------------------------------------------------------------------------
// HUMAN-LIKE MOVE SELECTION — the core of the brain
// ---------------------------------------------------------------------------
export function selectHumanLikeMove(board, moves, state, color, profile) {
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0];

  const evalBefore = evaluatePosition(board, color);
  const personality = profile.personality || {};
  const engineWeight = profile.engineWeight || 0.5;
  const noiseScale = profile.noiseScale || 1.0;
  const candidateCount = profile.candidateCount || 5;
  const blunderTendency = personality.blunderTendency || 0.05;
  const mistakeTendency = personality.mistakeTendency || 0.10;

  // --- Blunder / mistake check ---
  const roll = Math.random();
  if (roll < blunderTendency) {
    // Pick a genuinely bad move
    const badMoves = moves.filter(m => {
      const res = state._helpers.applyMove(board, state, m);
      const evalAfter = evaluatePosition(res.board, color);
      return (evalAfter - evalBefore) < -50;
    });
    if (badMoves.length > 0) {
      return badMoves[Math.floor(Math.random() * badMoves.length)];
    }
    // If no clearly bad move exists, fall through to normal selection with extra noise
  }

  if (roll < blunderTendency + mistakeTendency) {
    // Pick a slightly suboptimal move (mistake, not blunder)
    // Just add extra noise to push toward weaker moves
    return selectWithWeightedNoise(board, moves, state, color, profile, evalBefore, noiseScale * 3);
  }

  // --- Normal selection ---
  return selectWithWeightedNoise(board, moves, state, color, profile, evalBefore, noiseScale, candidateCount, engineWeight);
}

function selectWithWeightedNoise(board, moves, state, color, profile, evalBefore, noiseScale, candidateCount, engineWeight) {
  candidateCount = candidateCount || profile.candidateCount || 5;
  engineWeight = engineWeight || profile.engineWeight || 0.5;

  // Score all moves
  const scored = moves.map(m => ({
    move: m,
    score: scoreMoveWithPersonality(board, m, state, color, profile, evalBefore),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Take top N candidates
  const candidates = scored.slice(0, Math.min(candidateCount, scored.length));

  // Normalize scores to probabilities
  const maxScore = candidates[0].score;
  const weights = candidates.map(c => {
    const normalized = c.score - maxScore; // 0 or negative
    // Engine weight: how much the engine evaluation matters
    const engineComponent = normalized * engineWeight;
    // Random noise: how much personality/noise matters
    const noiseComponent = (Math.random() - 0.5) * 100 * noiseScale;
    return Math.exp((engineComponent + noiseComponent) / 50);
  });

  const totalWeight = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i].move;
  }
  return candidates[0].move;
}

// ---------------------------------------------------------------------------
// THINKING TIME — human-like delay based on position + personality
// ---------------------------------------------------------------------------
export function calculateThinkTime(board, color, state, profile) {
  const personality = profile.personality || {};
  const moveCount = state._moveCount || 0;
  const pieceCount = board.flat().filter(p => p !== null).length;
  const legalMoveCount = state._legalMoveCount || 10;

  // Base think time varies by personality
  const styleMult = profile.thinkingStyle === "fast" ? 0.6 :
                    profile.thinkingStyle === "slow" ? 1.4 : 1.0;

  let baseMs = 800;

  // Opening: think faster (known patterns)
  if (moveCount < 8) {
    baseMs = 400 + Math.random() * 400;
  }
  // Endgame: think longer (precision matters)
  else if (pieceCount < 10) {
    baseMs = 1200 + Math.random() * 1500;
  }
  // Midgame: moderate
  else {
    baseMs = 700 + Math.random() * 800;
  }

  // More legal moves = more complex position = longer think
  if (legalMoveCount > 15) baseMs += 300 + Math.random() * 400;
  else if (legalMoveCount > 10) baseMs += 100 + Math.random() * 200;

  // Patience trait: patient bots think longer
  baseMs *= 0.7 + personality.patience * 0.6;

  // Style multiplier
  baseMs *= styleMult;

  // Stronger bots think longer on complex positions
  baseMs *= 0.8 + (profile.effectiveElo || 1200) / 5000;

  // Occasional "long think" — simulates being surprised or calculating deeply
  if (Math.random() < 0.12) {
    baseMs *= 1.8 + Math.random();
  }

  // Quick recapture: less thinking
  // (If there's exactly one capture available, it's likely a recapture)
  if (legalMoveCount <= 2) {
    baseMs *= 0.4;
  }

  return Math.max(400, Math.min(baseMs, 8000));
}

// ---------------------------------------------------------------------------
// POSITION ANALYSIS for reactions — feeds into the bot reaction layer
// ---------------------------------------------------------------------------
export function analyzeMoveForReaction(board, move, state, color, evalBefore, profile) {
  const opp = color === "w" ? "b" : "w";
  const { applyMove: am, findKing: fk, isSquareAttacked: isa, getLegalMoves: glm } = state._helpers || {};

  const result = am(board, state, move);
  const evalAfter = evaluatePosition(result.board, color);
  const evalDelta = evalAfter - evalBefore;

  // Check detection
  const oppKing = fk(result.board, opp);
  const givesCheck = oppKing && isa(result.board, oppKing.r, oppKing.c, color);

  // Checkmate detection
  const oppMoves = glm(result.board, opp, result);
  const isCheckmate = givesCheck && oppMoves.length === 0;

  // Stalemate
  const isStalemate = !givesCheck && oppMoves.length === 0;

  // Was this unexpected? Compare against what the bot would play
  const botEval = profile.effectiveElo || 1200;
  const isUnexpected = Math.abs(evalDelta) > 150 && evalDelta > 0;

  // Was this a sacrifice? (gave up material for positional advantage)
  const isSacrifice = move.capture && evalDelta > 50;

  return {
    evalDelta,
    givesCheck,
    isCheckmate,
    isStalemate,
    isUnexpected,
    isSacrifice,
    evalBefore,
    evalAfter,
    moveQuality: classifyByEvalDelta(evalDelta),
    wasExpected: !isUnexpected,
  };
}

function classifyByEvalDelta(delta) {
  if (delta > 200) return "brilliant";
  if (delta > 100) return "excellent";
  if (delta > 30) return "good";
  if (delta > -20) return "normal";
  if (delta > -80) return "inaccuracy";
  if (delta > -150) return "mistake";
  return "blunder";
}

// ---------------------------------------------------------------------------
// OPENING BOOK — basic opening knowledge that scales with profile
// ---------------------------------------------------------------------------
const OPENING_BOOK = {
  // Common first moves — higher rated bots know more
  "": ["e2e4", "d2d4", "c2c4", "g1f3"],
  "e2e4": ["e7e5", "c7c5", "e7e6", "d7d5", "g8f6"],
  "d2d4": ["d7d5", "g8f6", "e7e6", "f7f5"],
  "e2e4 e7e5": ["g1f3", "f1c4", "b1c3"],
  "e2e4 c7c5": ["g1f3", "b1c3", "f2f4"],
  "d2d4 d7d5": ["c2c4", "g1f3", "b1c3"],
  "d2d4 g8f6": ["c2c4", "g1f3", "b1c3"],
};

export function getOpeningMove(history, profile) {
  const knowledge = profile.personality?.openingKnowledge || 0.5;
  // Higher knowledge = more likely to follow book
  if (Math.random() > knowledge * 0.8) return null;

  const key = history.slice(-1).join(" ");
  const moves = OPENING_BOOK[key];
  if (!moves || moves.length === 0) return null;

  // Convert algebraic notation to move object (simplified)
  const notation = moves[Math.floor(Math.random() * moves.length)];
  return notation; // Return as string — caller converts
}

// ---------------------------------------------------------------------------
// THINKING BUBBLES — what the bot says while thinking
// ---------------------------------------------------------------------------
export const THINKING_BUBBLES = {
  slow: ["Hmm, let me think...", "This one's tricky...", "Let me see...", "Taking my time here..."],
  fast: ["Got it.", "I see.", "Easy.", "Next."],
  measured: ["Let me calculate...", "Thinking...", "This needs care...", "Evaluating..."],
  deep: ["Calculating variations...", "Deep think incoming...", "This is complex...", "Analyzing..."],
};

export function getThinkingBubble(profile) {
  const style = profile.thinkingStyle || "measured";
  const bubbles = THINKING_BUBBLES[style] || THINKING_BUBBLES.measured;
  if (Math.random() < 0.25) {
    return bubbles[Math.floor(Math.random() * bubbles.length)];
  }
  return null;
}
