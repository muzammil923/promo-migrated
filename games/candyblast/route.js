const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const { sendError } = require('../../apps/backend/lib/apiError');

router.get('/:gameId/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM candyblast_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) {
    console.error('Error loading candyblast settings:', err);
    sendError(res, err);
  }
});

router.put('/:gameId/settings', auth, async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const s = req.body;

    const [existing] = await db.query('SELECT * FROM candyblast_settings WHERE game_id = ?', [gameId]);

    const fields = {
      game_id: gameId,
      grid_size: parseInt(s.grid_size) || 8,
      logo_url: s.logo_url || '',
      logo_name: s.logo_name || '',
      levels_json: s.levels_json || '[]',
      candy_types: parseInt(s.candy_types) || 6,
      match_score: parseInt(s.match_score) || 10,
      combo_multiplier: parseInt(s.combo_multiplier) || 40,
      special_spawn_rate: parseFloat(s.special_spawn_rate) || 0.17,
      is_active: s.is_active ? 1 : 0,
    };

    if (existing.length === 0) {
      const keys = Object.keys(fields);
      await db.query(
        `INSERT INTO candyblast_settings (game_id,${keys.join(',')}) VALUES (?,${keys.map(() => '?').join(',')})`,
        [gameId, ...Object.values(fields)]
      );
    } else {
      const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
      await db.query(`UPDATE candyblast_settings SET ${sets} WHERE game_id=?`, [...Object.values(fields), gameId]);
    }

    const [updated] = await db.query('SELECT * FROM candyblast_settings WHERE game_id = ?', [gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    console.error('Error saving candyblast settings:', err);
    sendError(res, err);
  }
});

module.exports = router;
