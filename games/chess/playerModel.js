/* ============================================================================
   PLAYER MODEL
   Tracks a player's tendencies across games. Used by the bot brain to
   adapt its strategy without cheating (no future-move knowledge).
   
   Two learning modes:
   1. SHORT-TERM: Per-session player model (resets on new session)
   2. LONG-TERM: Persisted player stats (stored in localStorage)
   ============================================================================ */

const STORAGE_KEY = "chessverse_player_model";
const MAX_GAMES = 50; // Rolling window for stats

// ---------------------------------------------------------------------------
// DEFAULT PLAYER MODEL
// ---------------------------------------------------------------------------
function emptyModel() {
  return {
    estimatedElo: 1200,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    // Per-game rolling stats
    recentGames: [],
    // Aggregated tendencies (updated after each game)
    tendencies: {
      aggression: 0.5,       // 0 = very defensive, 1 = very aggressive
      riskTaking: 0.5,       // 0 = safe player, 1 = gambit player
      tacticalAbility: 0.5,  // 0 = misses tactics, 1 = finds them all
      positionalAbility: 0.5,
      openingKnowledge: 0.5,
      endgameSkill: 0.5,
      avgBlunders: 2.0,     // per game
      avgMistakes: 3.0,
      queenEarlyFrequency: 0.0, // how often they move queen early
      castlingFrequency: 0.5,
      kingsideAttackTendency: 0.0,
      queensideAttackTendency: 0.0,
    },
    // Opening preferences
    favoriteOpenings: {},  // { "e4": 5, "d4": 3, ... }
    // Known weaknesses
    weaknesses: [],
    strengths: [],
    // Adaptation data
    adaptation: {
      exposedToKingsideAttack: 0,
      exposedToQueensideAttack: 0,
      playsAgainstSicilian: 0,
      commonMistakePatterns: [],
    },
  };
}

// ---------------------------------------------------------------------------
// LOAD / SAVE
// ---------------------------------------------------------------------------
export function loadPlayerModel() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...emptyModel(), ...JSON.parse(raw) };
  } catch {}
  return emptyModel();
}

export function savePlayerModel(model) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
  } catch {}
}

// ---------------------------------------------------------------------------
// UPDATE MODEL AFTER A GAME
// ---------------------------------------------------------------------------
export function updatePlayerModel(model, gameData) {
  const m = { ...model, tendencies: { ...model.tendencies }, favoriteOpenings: { ...model.favoriteOpenings }, recentGames: [...model.recentGames], adaptation: { ...model.adaptation } };

  m.gamesPlayed++;

  const result = gameData.result; // "win", "loss", "draw"
  if (result === "win") m.wins++;
  else if (result === "loss") m.losses++;
  else m.draws++;

  // Record game summary
  const gameSummary = {
    result,
    moves: gameData.moveCount || 0,
    evalHistory: gameData.evalHistory || [],
    blunders: gameData.blunders || 0,
    mistakes: gameData.mistakes || 0,
    captures: gameData.captures || 0,
    checks: gameData.checks || 0,
    castled: gameData.castled || false,
    castlingSide: gameData.castlingSide || null, // "k" or "q"
    opening: gameData.opening || null,
    timestamp: Date.now(),
  };

  m.recentGames.push(gameSummary);
  if (m.recentGames.length > MAX_GAMES) m.recentGames.shift();

  // Recalculate tendencies from recent games
  recalculateTendencies(m);

  // Update Elo estimate
  updateEloEstimate(m, gameData);

  // Save
  savePlayerModel(m);
  return m;
}

// ---------------------------------------------------------------------------
// RECALCULATE TENDENCIES from recent games
// ---------------------------------------------------------------------------
function recalculateTendencies(m) {
  const games = m.recentGames;
  if (games.length === 0) return;

  const n = games.length;

  // Aggression: captures + checks per move ratio
  const totalMoves = games.reduce((s, g) => s + g.moves, 0) || 1;
  const totalCaptures = games.reduce((s, g) => s + g.captures, 0);
  const totalChecks = games.reduce((s, g) => s + g.checks, 0);
  m.tendencies.aggression = clamp((totalCaptures + totalChecks * 2) / totalMoves / 3);

  // Risk taking: frequency of material sacrifices (moves where eval drops then recovers)
  let riskCount = 0;
  for (const g of games) {
    const evals = g.evalHistory || [];
    for (let i = 1; i < evals.length - 1; i++) {
      if (evals[i] < evals[i - 1] - 100 && evals[i + 1] > evals[i] + 50) riskCount++;
    }
  }
  m.tendencies.riskTaking = clamp(riskCount / Math.max(totalMoves * 0.05, 1));

  // Tactical ability: how often they avoid blunders
  const avgBlunders = games.reduce((s, g) => s + g.blunders, 0) / n;
  m.tendencies.tacticalAbility = clamp(1 - avgBlunders / 4);

  // Average blunders per game
  m.tendencies.avgBlunders = avgBlunders;
  m.tendencies.avgMistakes = games.reduce((s, g) => s + g.mistakes, 0) / n;

  // Opening knowledge: how many games they play the same opening
  const openingCounts = {};
  for (const g of games) {
    if (g.opening) openingCounts[g.opening] = (openingCounts[g.opening] || 0) + 1;
  }
  const maxOpeningRep = Math.max(...Object.values(openingCounts), 0);
  m.tendencies.openingKnowledge = clamp(maxOpeningRep / n * 1.5);

  // Castling frequency
  const castledCount = games.reduce((s, g) => s + (g.castled ? 1 : 0), 0);
  m.tendencies.castlingFrequency = clamp(castledCount / n);

  // Favorite openings
  m.favoriteOpenings = {};
  for (const g of games) {
    if (g.opening) m.favoriteOpenings[g.opening] = (m.favoriteOpenings[g.opening] || 0) + 1;
  }

  // Strengths and weaknesses
  m.strengths = [];
  m.weaknesses = [];
  if (m.tendencies.tacticalAbility > 0.7) m.strengths.push("Tactical awareness");
  if (m.tendencies.aggression > 0.7) m.strengths.push("Aggressive play");
  if (m.tendencies.openingKnowledge > 0.6) m.strengths.push("Opening knowledge");
  if (m.tendencies.castlingFrequency > 0.7) m.strengths.push("King safety");
  if (m.tendencies.avgBlunders > 2) m.weaknesses.push("Blunders under pressure");
  if (m.tendencies.aggression > 0.7 && m.tendencies.riskTaking > 0.7) m.weaknesses.push("Overextension");
  if (m.tendencies.castlingFrequency < 0.3) m.weaknesses.push("Slow castling");
  if (m.tendencies.endgameSkill < 0.3) m.weaknesses.push("Endgame technique");

  // Adaptive counters
  // Count how often the player launches kingside attacks
  let kingsideAttacks = 0;
  for (const g of games) {
    if (g.evaluations) {
      // simplified: if eval swings on kingside, they attacked there
    }
  }
}

// ---------------------------------------------------------------------------
// ELO ESTIMATION — simple Glicko-like update
// ---------------------------------------------------------------------------
function updateEloEstimate(m, gameData) {
  const K = 32;
  const opponentElo = gameData.opponentElo || 1200;
  let resultScore;
  if (gameData.result === "win") resultScore = 1;
  else if (gameData.result === "loss") resultScore = 0;
  else resultScore = 0.5;

  const expected = 1 / (1 + Math.pow(10, (opponentElo - m.estimatedElo) / 400));
  m.estimatedElo = Math.round(m.estimatedElo + K * (resultScore - expected));
  m.estimatedElo = Math.max(200, Math.min(3000, m.estimatedElo));
}

// ---------------------------------------------------------------------------
// GET ADAPTIVE STRATEGY — what should the bot prioritize?
// ---------------------------------------------------------------------------
export function getAdaptiveStrategy(model) {
  const t = model.tendencies;
  const strategies = [];

  if (t.kingsideAttackTendency > 0.6) {
    strategies.push({ focus: "kingSafety", priority: 0.8, reason: "Player frequently attacks kingside" });
  }
  if (t.aggression > 0.7) {
    strategies.push({ focus: "defensive", priority: 0.7, reason: "Player is very aggressive — play solid" });
  }
  if (t.riskTaking > 0.7) {
    strategies.push({ focus: "punishRisks", priority: 0.6, reason: "Player takes risks — wait for mistakes" });
  }
  if (t.avgBlunders > 2.5) {
    strategies.push({ focus: "setTraps", priority: 0.7, reason: "Player blunders often — create tactical pressure" });
  }
  if (t.tacticalAbility < 0.3) {
    strategies.push({ focus: "simplify", priority: 0.5, reason: "Player misses tactics — simplify into winning endgame" });
  }
  if (t.openingKnowledge > 0.7) {
    strategies.push({ focus: "surprise", priority: 0.4, reason: "Player knows openings — try unusual lines" });
  }

  return strategies;
}

// ---------------------------------------------------------------------------
// IN-GAME TRACKING — updates the live model during a game
// ---------------------------------------------------------------------------
export function createLiveTracker() {
  return {
    captures: 0,
    checks: 0,
    blunders: 0,
    mistakes: 0,
    castled: false,
    castlingSide: null,
    queenMovesEarly: 0,
    moveEvals: [],
    moveCount: 0,
    opening: null,
  };
}

export function recordMove(tracker, move, board, evalDelta, moveNumber) {
  tracker.moveCount++;
  tracker.moveEvals.push(evalDelta);

  if (move.capture) tracker.captures++;

  // Blunder / mistake detection
  if (evalDelta < -150) tracker.blunders++;
  else if (evalDelta < -50) tracker.mistakes++;

  // Castling
  if (move.castle) {
    tracker.castled = true;
    tracker.castlingSide = move.castle;
  }

  // Early queen moves
  const piece = board[move.from.r][move.from.c];
  if (piece && piece.type === "q" && moveNumber <= 10) {
    tracker.queenMovesEarly++;
  }
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}
