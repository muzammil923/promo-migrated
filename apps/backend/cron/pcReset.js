const db = require('../config/db');

async function ensureResetLog() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS reset_log (
        id INT PRIMARY KEY DEFAULT 1,
        last_reset_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`INSERT IGNORE INTO reset_log (id, last_reset_at) VALUES (1, NULL)`);
  } catch (err) {
    console.error('[PC Reset] reset_log table error:', err.message);
  }
}

async function runMonthlyPCReset() {
  console.log('[PC Reset] Checking monthly reset...');
  try {
    await ensureResetLog();

    const [rows] = await db.query('SELECT last_reset_at FROM reset_log WHERE id = 1');
    const lastReset = rows[0]?.last_reset_at;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const isFirstDay = now.getDate() === 1;

    if (!isFirstDay) {
      console.log('[PC Reset] Not the 1st of month, skipping.');
      return;
    }

    if (lastReset) {
      const lastMonth = new Date(lastReset).getMonth();
      const lastYear = new Date(lastReset).getFullYear();
      if (lastMonth === currentMonth && lastYear === currentYear) {
        console.log('[PC Reset] Already reset this month, skipping.');
        return;
      }
    }

    // Get all players with balance > 0
    const [players] = await db.query(
      'SELECT id, pc_balance FROM promo_players WHERE pc_balance > 0'
    );

    if (players.length === 0) {
      console.log('[PC Reset] No players with balance to reset.');
      await db.query('UPDATE reset_log SET last_reset_at = NOW() WHERE id = 1');
      return;
    }

    console.log(`[PC Reset] Resetting ${players.length} players...`);

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      for (const p of players) {
        await connection.query(
          'INSERT INTO pc_transactions (player_id, type, points, note) VALUES (?, "reset", ?, ?)',
          [p.id, -p.pc_balance, `Monthly reset — ${p.pc_balance} PC expired`]
        );
        await connection.query(
          'UPDATE promo_players SET pc_balance = 0 WHERE id = ?',
          [p.id]
        );
      }

      await connection.query('UPDATE reset_log SET last_reset_at = NOW() WHERE id = 1');
      await connection.commit();
      const totalPC = players.reduce((s, p) => s + p.pc_balance, 0);
      console.log(`[PC Reset] ✅ Reset ${players.length} players — ${totalPC} total PC zeroed.`);
    } catch (err) {
      await connection.rollback();
      console.error('[PC Reset] ❌ Transaction failed, rolled back:', err.message);
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('[PC Reset] Error:', err.message);
  }
}

function startPCResetCron() {
  // Run once on startup (for safety)
  runMonthlyPCReset();

  // Check every 30 minutes — if it's the 1st and not yet reset, run it
  setInterval(() => {
    runMonthlyPCReset();
  }, 30 * 60 * 1000);
}

module.exports = { startPCResetCron, runMonthlyPCReset };
