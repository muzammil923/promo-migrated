// ── Central PromoCoins service ───────────────────────────────────────────────
// Single authoritative source for reward amounts and the once-per-session
// award. Every reward decision happens server-side against the trusted DB row
// (games.game_type) — the client only ever reports a completed session/level
// and is told how many coins were granted, never left to decide it.
//
//   Category      Amount (once per session)
//   promogames     10 PC
//   branded        50 PC
//
// Reward model for level-based games (Classic Maze, Stick Maze):
//   - The FIRST completed level of a session pays the full session amount.
//   - Further levels in the SAME session earn nothing (already rewarded).
//   - Restarting the game creates a fresh session → fresh reward.
//
// Idempotency is enforced three ways:
//   1. player_sessions.pc_awarded flag (legacy guard)
//   2. a "already earned" check inside the same transaction
//   3. the DB unique index pc_transactions(session_id, type, level) — backstop
//      that makes a concurrent double-award impossible even if both checks race.
// The player's balance is read and credited under SELECT ... FOR UPDATE so two
// simultaneous completions can never lose an increment.

const db = require('../config/db');

// Full-session completion reward — paid ONCE per session. For level-based
// games it is triggered by the first completed level; for other games by the
// final /play/session/complete. Either way: 10 PC per session (promogames),
// 50 PC (branded). A restarted game = new session = fresh reward.
const PROMOCOINS_REWARDS = {
  promogames: 10,
  branded: 50,
};

function rewardAmountForGameType(gameType) {
  const normalized = gameType || 'promogames';
  const amount = PROMOCOINS_REWARDS[normalized];
  return typeof amount === 'number' ? amount : 0;
}

const ERRORS = {
  SESSION_NOT_FOUND: 'Session not found',
  SESSION_NOT_COMPLETED: 'Session not completed',
  PLAYER_NOT_LINKED: 'Session is not linked to a player',
  GAME_NOT_FOUND: 'Game not found',
  NO_REWARD: 'No reward configured for this category',
};

/**
 * Transactionally award the completion reward for a session (max once).
 * @param {object} session - the session row as loaded by the caller.
 * @returns {Promise<object>} one of:
 *   { success:true, rewarded:true,  reward, oldBalance, newBalance, transactionId, sessionId, gameType }
 *   { success:true, rewarded:false, alreadyRewarded:true, reward, oldBalance, newBalance, sessionId }
 *   { success:false, rewarded:false, reason }
 */
async function awardGameCompletionReward(session) {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [sessRows] = await conn.query(
      'SELECT * FROM player_sessions WHERE id = ? FOR UPDATE',
      [session.id]
    );
    const sess = sessRows[0];
    if (!sess) {
      await conn.rollback();
      return { success: false, rewarded: false, reason: ERRORS.SESSION_NOT_FOUND };
    }
    if (!sess.completed) {
      await conn.rollback();
      return { success: false, rewarded: false, reason: ERRORS.SESSION_NOT_COMPLETED };
    }
    if (!sess.promo_player_id) {
      await conn.rollback();
      return { success: false, rewarded: false, reason: ERRORS.PLAYER_NOT_LINKED };
    }

    const [existingTxs] = await conn.query(
      'SELECT points FROM pc_transactions WHERE session_id = ? AND type = ? LIMIT 1',
      [sess.id, 'earn']
    );
    const [[playerRow]] = await conn.query(
      'SELECT pc_balance FROM promo_players WHERE id = ? FOR UPDATE',
      [sess.promo_player_id]
    );
    const balance = playerRow ? playerRow.pc_balance : 0;

    if (existingTxs.length > 0 || sess.pc_awarded) {
      await conn.commit();
      return {
        success: true,
        rewarded: false,
        alreadyRewarded: true,
        reward: existingTxs.length > 0 ? existingTxs[0].points : null,
        oldBalance: balance,
        newBalance: balance,
        sessionId: sess.id,
      };
    }

    const [games] = await conn.query(
      'SELECT id, name, game_type FROM games WHERE id = ?',
      [sess.game_id]
    );
    const game = games[0];
    if (!game) {
      await conn.rollback();
      return { success: false, rewarded: false, reason: ERRORS.GAME_NOT_FOUND };
    }

    const gameType = game.game_type;
    const amount = rewardAmountForGameType(gameType);
    if (amount <= 0) {
      await conn.rollback();
      return { success: true, rewarded: false, reward: 0, reason: ERRORS.NO_REWARD, sessionId: sess.id };
    }

    const [insertRes] = await conn.query(
      'INSERT INTO pc_transactions (player_id, type, points, game_id, session_id, game_type, level, note) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
      [sess.promo_player_id, 'earn', amount, sess.game_id, sess.id, gameType, `Completed: ${game.name}`]
    );
    await conn.query(
      'UPDATE promo_players SET pc_balance = pc_balance + ? WHERE id = ?',
      [amount, sess.promo_player_id]
    );
    await conn.query('UPDATE player_sessions SET pc_awarded = 1 WHERE id = ?', [sess.id]);
    await conn.commit();

    return {
      success: true,
      rewarded: true,
      alreadyRewarded: false,
      reward: amount,
      oldBalance: balance,
      newBalance: balance + amount,
      transactionId: insertRes.insertId,
      sessionId: sess.id,
      gameType,
    };
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (e) { /* ignore */ }
    }
    // A concurrent request already committed the unique earn row — treat as done.
    if (err && (err.code === 'ER_DUP_ENTRY' || err.code === 'ER_DUP_ENTRY_WITH_KEY_NAME')) {
      try {
        const [[playerRow]] = await db.query(
          'SELECT pc_balance FROM promo_players WHERE id = ?',
          [session.promo_player_id]
        );
        const balance = playerRow ? playerRow.pc_balance : null;
        return {
          success: true,
          rewarded: false,
          alreadyRewarded: true,
          reward: null,
          oldBalance: balance,
          newBalance: balance,
          sessionId: session.id,
        };
      } catch (e) {
        return { success: false, rewarded: false, reason: ERRORS.SESSION_NOT_FOUND };
      }
    }
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

/**
 * Transactionally award the session reward when the FIRST level of a
 * level-based game (Classic Maze, Stick Maze) is completed.
 *
 *   - first completed level of a session → full session amount (10/50 PC)
 *   - further levels in the same session → alreadyRewarded (nothing)
 *   - restarting the game → new session_token → fresh reward
 *
 * The session is marked pc_awarded here, so the final /play/session/complete
 * never pays a second time. The DB unique index
 * pc_transactions(session_id, type, level) backstops replays and races.
 * @returns {Promise<object>} same shape as awardGameCompletionReward.
 */
async function awardLevelCompletionReward({ sessionToken, level }) {
  const lvl = parseInt(level, 10);
  if (!sessionToken || !Number.isFinite(lvl) || lvl < 1) {
    return { success: false, rewarded: false, reason: 'Invalid level completion' };
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [sessRows] = await conn.query(
      'SELECT * FROM player_sessions WHERE session_token = ? FOR UPDATE',
      [sessionToken]
    );
    const sess = sessRows[0];
    if (!sess) {
      await conn.rollback();
      return { success: false, rewarded: false, reason: ERRORS.SESSION_NOT_FOUND };
    }
    if (!sess.promo_player_id) {
      await conn.rollback();
      return { success: true, rewarded: false, reason: ERRORS.PLAYER_NOT_LINKED };
    }

    // This session has already earned (via a level or full completion) → done.
    const [existingTxs] = await conn.query(
      'SELECT points FROM pc_transactions WHERE session_id = ? AND type = ? LIMIT 1',
      [sess.id, 'earn']
    );
    const [[playerRow]] = await conn.query(
      'SELECT pc_balance FROM promo_players WHERE id = ? FOR UPDATE',
      [sess.promo_player_id]
    );
    const balance = playerRow ? playerRow.pc_balance : 0;

    if (existingTxs.length > 0 || sess.pc_awarded) {
      await conn.commit();
      return {
        success: true,
        rewarded: false,
        alreadyRewarded: true,
        reward: existingTxs.length > 0 ? existingTxs[0].points : null,
        oldBalance: balance,
        newBalance: balance,
        sessionId: sess.id,
        level: lvl,
      };
    }

    const [games] = await conn.query(
      'SELECT id, name, game_type FROM games WHERE id = ?',
      [sess.game_id]
    );
    const game = games[0];
    if (!game) {
      await conn.rollback();
      return { success: false, rewarded: false, reason: ERRORS.GAME_NOT_FOUND };
    }

    const gameType = game.game_type;
    const amount = rewardAmountForGameType(gameType);
    if (amount <= 0) {
      await conn.rollback();
      return { success: true, rewarded: false, reward: 0, reason: ERRORS.NO_REWARD, sessionId: sess.id, level: lvl };
    }

    const [insertRes] = await conn.query(
      'INSERT INTO pc_transactions (player_id, type, points, game_id, session_id, game_type, level, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [sess.promo_player_id, 'earn', amount, sess.game_id, sess.id, gameType, lvl, `Level ${lvl} completed: ${game.name}`]
    );
    await conn.query(
      'UPDATE promo_players SET pc_balance = pc_balance + ? WHERE id = ?',
      [amount, sess.promo_player_id]
    );
    // Mark rewarded so the final /play/session/complete won't pay again.
    await conn.query('UPDATE player_sessions SET pc_awarded = 1 WHERE id = ?', [sess.id]);
    await conn.commit();

    return {
      success: true,
      rewarded: true,
      alreadyRewarded: false,
      reward: amount,
      oldBalance: balance,
      newBalance: balance + amount,
      transactionId: insertRes.insertId,
      sessionId: sess.id,
      level: lvl,
      gameType,
    };
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (e) { /* ignore */ }
    }
    // A concurrent request already committed this session's earn row.
    if (err && (err.code === 'ER_DUP_ENTRY' || err.code === 'ER_DUP_ENTRY_WITH_KEY_NAME')) {
      return { success: true, rewarded: false, alreadyRewarded: true, level: lvl };
    }
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

/**
 * Backfill wrapper preserving the legacy "true when newly awarded" semantics
 * used by the /session/:token/claim endpoint.
 */
async function awardPCOnce(session) {
  const result = await awardGameCompletionReward(session);
  return result.rewarded;
}

module.exports = {
  PROMOCOINS_REWARDS,
  rewardAmountForGameType,
  awardGameCompletionReward,
  awardLevelCompletionReward,
  awardPCOnce,
};