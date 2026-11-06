const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sendError } = require('../lib/apiError');

/**
 * Win definition:
 *   - Scoreable sessions (total_scoreable > 0, e.g. quiz/crossword): a win is
 *     score >= 70% of total_scoreable — matches the platform's existing
 *     performance messaging (70%+ = "Great job").
 *   - Non-scoreable sessions (total_scoreable = 0, e.g. arcade games) have no
 *     pass/fail signal, so they are treated as NEUTRAL: they count toward
 *     games_played but not toward win rate or win streak.
 * Uses exact integer math (s*10 >= t*7) to avoid floating-point boundary errors.
 */
function isWin(score, totalScoreable) {
  const s = Number(score) || 0;
  const t = Number(totalScoreable) || 0;
  if (t <= 0) return false;
  return s * 10 >= t * 7;
}

function newStats() {
  return { games: 0, scored: 0, wins: 0, streak: 0, last: null };
}

/**
 * Aggregate completed sessions for the ranked players only (scales with the
 * board size, not the sessions table). Rows are chronological per player, so
 * `streak` ends as the trailing consecutive-wins count = current win streak.
 */
async function getPlayerStatsMap(limit) {
  const [rows] = await db.query(
    `SELECT ps.promo_player_id, ps.score, ps.total_scoreable, ps.completed_at
     FROM player_sessions ps
     JOIN (SELECT id FROM promo_players ORDER BY pc_balance DESC LIMIT ?) ranked
       ON ps.promo_player_id = ranked.id
     WHERE ps.completed = 1
     ORDER BY ps.promo_player_id, ps.completed_at ASC`,
    [limit]
  );

  const map = new Map();
  for (const r of rows) {
    let st = map.get(r.promo_player_id);
    if (!st) { st = newStats(); map.set(r.promo_player_id, st); }
    st.games += 1;
    if ((Number(r.total_scoreable) || 0) > 0) {
      st.scored += 1;
      if (isWin(r.score, r.total_scoreable)) {
        st.wins += 1;
        st.streak += 1;
      } else {
        st.streak = 0; // a non-win breaks the streak
      }
    }
    if (r.completed_at) st.last = r.completed_at;
  }
  return map;
}

async function buildLeaderboard(limit) {
  const [rows] = await db.query(
    `SELECT
        pp.id,
        pp.name   as player_name,
        pp.username as player_username,
        pp.avatar_id,
        pp.pc_balance as total_pc,
        pp.created_at
     FROM promo_players pp
     ORDER BY pp.pc_balance DESC
     LIMIT ?`,
    [limit]
  );

  const stats = await getPlayerStatsMap(limit);

  return rows.map((row, i) => {
    const st = stats.get(row.id) || newStats();
    return {
      ...row,
      rank: i + 1,
      games_played: st.games,
      last_played_at: st.last,
      win_rate: st.scored > 0 ? Math.round((st.wins / st.scored) * 100) : null,
      win_streak: st.streak,
      player_name: row.player_username || row.player_name || 'Anonymous',
    };
  });
}

router.get('/', async (req, res) => {
  try {
    const entries = await buildLeaderboard(50);
    res.json({ success: true, entries });
  } catch (err) {
    console.error('Leaderboard error:', err);
    sendError(res, err);
  }
});

router.get('/all', async (req, res) => {
  try {
    const entries = await buildLeaderboard(500);
    res.json({ success: true, entries });
  } catch (err) {
    console.error('Leaderboard all error:', err);
    sendError(res, err);
  }
});

module.exports = router;
