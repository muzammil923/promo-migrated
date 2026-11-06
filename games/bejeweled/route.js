const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const { sendError } = require('../../apps/backend/lib/apiError');

router.get('/:gameId/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bejeweled_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) {
    console.error('Error loading bejeweled settings:', err);
    sendError(res, err);
  }
});

router.put('/:gameId/settings', auth, async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const s = req.body;

    const [existing] = await db.query('SELECT id FROM bejeweled_settings WHERE game_id = ?', [gameId]);

    const fields = {
      game_id: gameId,
      grid_size: s.grid_size || 8,
      logo_url: s.logo_url || '',
      logo_name: s.logo_name || '',
      theme_colors: s.theme_colors || JSON.stringify({
        '2':'#ff6b6b','4':'#4ecdc4','8':'#45b7d1','16':'#f9ca24','32':'#f0932b','64':'#eb4d4b',
        '128':'#574b90','256':'#2c3e50','512':'#34495e','1024':'#2c3e50','2048':'#1a1a2e','4096':'#0f3d3f'
      }),
      match_score: s.match_score || 10,
      chain_score_multiplier: s.chain_score_multiplier || 2,
      is_active: s.is_active || 1,
    };

    if (existing.length > 0) {
      const keys = Object.keys(fields).filter(k => k !== 'game_id');
      const setStr = keys.map(k => `${k} = ?`).join(', ');
      await db.query(`UPDATE bejeweled_settings SET ${setStr} WHERE game_id = ?`, [...keys.map(k => fields[k]), gameId]);
    } else {
      const keys = Object.keys(fields);
      const placeholders = keys.map(() => '?').join(', ');
      await db.query(`INSERT INTO bejeweled_settings (${keys.join(', ')}) VALUES (${placeholders})`, keys.map(k => fields[k]));
    }

    const [updated] = await db.query('SELECT * FROM bejeweled_settings WHERE game_id = ?', [gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    console.error('Error saving bejeweled settings:', err);
    sendError(res, err);
  }
});

router.post('/:gameId/session', async (req, res) => {
  try {
    const { player_id } = req.body;
    const [session] = await db.query(
      `INSERT INTO bejeweled_sessions (settings_id, player_id, score, moves, status)
       VALUES (?, ?, 0, 0, 'active')`,
      [req.params.gameId, player_id]
    );
    res.json({ success: true, session_id: session.insertId });
  } catch (err) {
    console.error('Error creating bejeweled session:', err);
    sendError(res, err);
  }
});

router.put('/:gameId/session/:sessionId', async (req, res) => {
  try {
    const { score, moves, status } = req.body;
    await db.query(
      `UPDATE bejeweled_sessions 
       SET score = ?, moves = ?, status = ?, end_time = CASE WHEN ? = 'completed' THEN NOW() ELSE NULL END
       WHERE id = ? AND settings_id = ?`,
      [score, moves, status, status, req.params.sessionId, req.params.gameId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating bejeweled session:', err);
    sendError(res, err);
  }
});

router.post('/:gameId/move', async (req, res) => {
  try {
    const { session_id, move_type, position_x, position_y } = req.body;
    await db.query(
      `INSERT INTO bejeweled_moves (session_id, move_type, position_x, position_y)
       VALUES (?, ?, ?, ?)`,
      [session_id, move_type, position_x, position_y]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving bejeweled move:', err);
    sendError(res, err);
  }
});

router.get('/:gameId/session/:sessionId/stats', async (req, res) => {
  try {
    const [session] = await db.query(
      'SELECT * FROM bejeweled_sessions WHERE id = ? AND settings_id = ?',
      [req.params.sessionId, req.params.gameId]
    );
    if (!session) return res.json({ success: false, message: 'Session not found' });

    const [moves] = await db.query(
      'SELECT * FROM bejeweled_moves WHERE session_id = ? ORDER BY timestamp',
      [req.params.sessionId]
    );

    res.json({ success: true, session: session[0], moves });
  } catch (err) {
    console.error('Error loading bejeweled stats:', err);
    sendError(res, err);
  }
});

module.exports = router;
