const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const { sendError } = require('../../apps/backend/lib/apiError');

router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM game2048_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) {
    console.error('Error loading 2048 settings:', err);
    sendError(res, err);
  }
});

router.put('/:gameId/settings', auth, async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const s = req.body;

    const [existing] = await db.query('SELECT id FROM game2048_settings WHERE game_id = ?', [gameId]);

    const fields = {
      game_id: gameId,
      grid_size: s.grid_size || 4,
      target_number: s.target_number || 2048,
      tile_colors: s.tile_colors || JSON.stringify({
        '2':'#e8e0ff','4':'#ddd0ff','8':'#c4a8ff','16':'#a88cff','32':'#8b70ff','64':'#7c3aed',
        '128':'#6d28d9','256':'#5b21b6','512':'#8b5cf6','1024':'#a78bfa','2048':'#c084fc','4096':'#f0e6ff'
      }),
      show_timer: s.show_timer || 0,
      time_limit_seconds: s.time_limit_seconds || 0,
      heading_1: s.heading_1 || '',
      heading_2: s.heading_2 || '',
      heading_3: s.heading_3 || '',
      heading_1_color: s.heading_1_color || '#c084fc',
      heading_2_color: s.heading_2_color || '#a78bfa',
      heading_3_color: s.heading_3_color || '#a78bfa',
      description_text: s.description_text || '',
      description_color: s.description_color || 'rgba(167,139,250,0.6)',
      bg_color: s.bg_color || 'linear-gradient(135deg, #0f0a1e 0%, #1a0f2e 50%, #0f0a1e 100%)',
      primary_color: s.primary_color || '#8b5cf6',
      bg_image_url: s.bg_image_url || '',
      thankyou_bg_image_url: s.thankyou_bg_image_url || '',
      game_logo_url: s.game_logo_url || '',
      font_family: s.font_family || 'DM Sans',
      sound_slide_id: s.sound_slide_id || null,
      sound_merge_id: s.sound_merge_id || null,
      sound_win_id: s.sound_win_id || null,
      sound_lose_id: s.sound_lose_id || null,
      intro_text: s.intro_text || '',
      intro_text_color: s.intro_text_color || '#776e65',
      outro_text: s.outro_text || '',
      outro_text_color: s.outro_text_color || '#776e65',
      thankyou_subtitle: s.thankyou_subtitle || '',
      thankyou_subtitle_color: s.thankyou_subtitle_color || '#444444',
      submit_button_text: s.submit_button_text || 'Continue →',
      submit_button_text_color: s.submit_button_text_color || '#ffffff',
      submit_button_bg_color: s.submit_button_bg_color || '',
      continue_button_text: s.continue_button_text || 'Continue →',
      continue_button_text_color: s.continue_button_text_color || '#ffffff',
      continue_button_bg_color: s.continue_button_bg_color || '',
      start_button_text: s.start_button_text || 'Start Game →',
      start_button_text_color: s.start_button_text_color || '#ffffff',
      start_button_bg_color: s.start_button_bg_color || '',
      terms_enabled: s.terms_enabled || 0,
      terms_text: s.terms_text || '',
      terms_url: s.terms_url || '',
      meta_description: s.meta_description || '',
      submit_confirm_gif_url: s.submit_confirm_gif_url || '',
      overlay_animation_in: s.overlay_animation_in || 'fade',
      claim_prize_button_text: s.claim_prize_button_text || 'Claim Prize',
      new_game_button_text: s.new_game_button_text || 'New Game',
    };

    if (existing.length > 0) {
      const keys = Object.keys(fields).filter(k => k !== 'game_id');
      const setStr = keys.map(k => `${k} = ?`).join(', ');
      await db.query(`UPDATE game2048_settings SET ${setStr} WHERE game_id = ?`, [...keys.map(k => fields[k]), gameId]);
    } else {
      const keys = Object.keys(fields);
      const placeholders = keys.map(() => '?').join(', ');
      await db.query(`INSERT INTO game2048_settings (${keys.join(', ')}) VALUES (${placeholders})`, keys.map(k => fields[k]));
    }

    const [updated] = await db.query('SELECT * FROM game2048_settings WHERE game_id = ?', [gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    console.error('Error saving 2048 settings:', err);
    sendError(res, err);
  }
});

router.post('/:gameId/score', async (req, res) => {
  try {
    const { session_token, score, best_score, moves, grid_state } = req.body;
    await db.query(
      `INSERT INTO game2048_scores (game_id, session_token, score, best_score, moves, grid_state)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE score = GREATEST(score, VALUES(score)), best_score = GREATEST(best_score, VALUES(best_score)), moves = VALUES(moves), grid_state = VALUES(grid_state)`,
      [req.params.gameId, session_token, score, best_score || score, moves || 0, grid_state || null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving 2048 score:', err);
    sendError(res, err);
  }
});

router.get('/:gameId/score', async (req, res) => {
  try {
    const { session_token } = req.query;
    if (!session_token) return res.json({ success: true, score: null });
    const [rows] = await db.query(
      'SELECT * FROM game2048_scores WHERE game_id = ? AND session_token = ?',
      [req.params.gameId, session_token]
    );
    res.json({ success: true, score: rows[0] || null });
  } catch (err) {
    console.error('Error loading 2048 score:', err);
    sendError(res, err);
  }
});

module.exports = router;
