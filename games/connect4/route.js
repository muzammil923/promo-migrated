const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const upload = require('../../apps/backend/config/upload');
const { sendError } = require('../../apps/backend/lib/apiError');

router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM connect4_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) { sendError(res, err); }
});

router.put('/:gameId/settings', auth, upload.fields([
  { name: 'bg_image', maxCount: 1 }, { name: 'thankyou_bg_image', maxCount: 1 },
  { name: 'game_logo', maxCount: 1 }, { name: 'submit_confirm_gif', maxCount: 1 },
]), async (req, res) => {
  const {
    board_rows, board_cols, win_count, player_color, ai_color, board_color,
    difficulty, show_timer, time_limit_seconds,
    heading_1, heading_2, heading_3, description_text,
    heading_1_color, heading_2_color, heading_3_color, description_color,
    bg_color, primary_color, font_family,
    sound_drop_id, sound_win_id, sound_draw_id,
    intro_text, intro_text_color, outro_text, outro_text_color,
    submit_button_text, continue_button_text, start_button_text,
    terms_enabled, terms_text, terms_url, meta_description,
    bg_image_url, thankyou_bg_image_url, game_logo_url, submit_confirm_gif_url,
    thankyou_subtitle, thankyou_subtitle_color,
    submit_button_text_color, submit_button_bg_color,
    continue_button_text_color, continue_button_bg_color,
    start_button_text_color, start_button_bg_color,
  } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM connect4_settings WHERE game_id = ?', [req.params.gameId]);
    const e = existing[0] || {};
    const bgImg = req.files?.bg_image ? `/uploads/images/${req.files.bg_image[0].filename}` : (bg_image_url !== undefined ? bg_image_url : (e.bg_image_url || null));
    const tyImg = req.files?.thankyou_bg_image ? `/uploads/images/${req.files.thankyou_bg_image[0].filename}` : (thankyou_bg_image_url !== undefined ? thankyou_bg_image_url : (e.thankyou_bg_image_url || null));
    const logoImg = req.files?.game_logo ? `/uploads/images/${req.files.game_logo[0].filename}` : (game_logo_url !== undefined ? game_logo_url : (e.game_logo_url || null));
    const gifImg = req.files?.submit_confirm_gif ? `/uploads/images/${req.files.submit_confirm_gif[0].filename}` : (submit_confirm_gif_url !== undefined ? submit_confirm_gif_url : (e.submit_confirm_gif_url || null));
    const n = (v, f) => v !== undefined && v !== '' ? Number(v) : f;
    const fields = {
      board_rows: n(board_rows, e.board_rows || 6),
      board_cols: n(board_cols, e.board_cols || 7),
      win_count: n(win_count, e.win_count || 4),
      player_color: player_color || e.player_color || '#ef4444',
      ai_color: ai_color || e.ai_color || '#fbbf24',
      board_color: board_color || e.board_color || '#3b82f6',
      difficulty: difficulty || e.difficulty || 'medium',
      show_timer: n(show_timer, e.show_timer !== undefined ? e.show_timer : 1),
      time_limit_seconds: n(time_limit_seconds, e.time_limit_seconds || 0),
      heading_1: heading_1 !== undefined ? heading_1 : (e.heading_1 || null),
      heading_2: heading_2 !== undefined ? heading_2 : (e.heading_2 || null),
      heading_3: heading_3 !== undefined ? heading_3 : (e.heading_3 || null),
      description_text: description_text !== undefined ? description_text : (e.description_text || null),
      heading_1_color: heading_1_color || e.heading_1_color || '#1a1a2e',
      heading_2_color: heading_2_color || e.heading_2_color || '#666666',
      heading_3_color: heading_3_color || e.heading_3_color || '#777777',
      description_color: description_color || e.description_color || '#888888',
      bg_color: bg_color || e.bg_color || '#0f172a',
      primary_color: primary_color || e.primary_color || '#3b82f6',
      bg_image_url: bgImg, thankyou_bg_image_url: tyImg, game_logo_url: logoImg, submit_confirm_gif_url: gifImg,
      font_family: font_family || e.font_family || 'DM Sans',
      sound_drop_id: sound_drop_id !== undefined && sound_drop_id !== '' ? Number(sound_drop_id) : (e.sound_drop_id || null),
      sound_win_id: sound_win_id !== undefined && sound_win_id !== '' ? Number(sound_win_id) : (e.sound_win_id || null),
      sound_draw_id: sound_draw_id !== undefined && sound_draw_id !== '' ? Number(sound_draw_id) : (e.sound_draw_id || null),
      intro_text: intro_text !== undefined ? intro_text : (e.intro_text || null),
      intro_text_color: intro_text_color || e.intro_text_color || null,
      outro_text: outro_text !== undefined ? outro_text : (e.outro_text || null),
      outro_text_color: outro_text_color || e.outro_text_color || null,
      submit_button_text: submit_button_text !== undefined ? submit_button_text : (e.submit_button_text || null),
      continue_button_text: continue_button_text !== undefined ? continue_button_text : (e.continue_button_text || null),
      start_button_text: start_button_text !== undefined ? start_button_text : (e.start_button_text || null),
      terms_enabled: n(terms_enabled, e.terms_enabled || 0),
      terms_text: terms_text !== undefined ? terms_text : (e.terms_text || null),
      terms_url: terms_url !== undefined ? terms_url : (e.terms_url || null),
      meta_description: meta_description !== undefined ? meta_description : (e.meta_description || null),
      thankyou_subtitle: thankyou_subtitle !== undefined ? thankyou_subtitle : (e.thankyou_subtitle || null),
      thankyou_subtitle_color: thankyou_subtitle_color || e.thankyou_subtitle_color || null,
      submit_button_text_color: submit_button_text_color || e.submit_button_text_color || null,
      submit_button_bg_color: submit_button_bg_color || e.submit_button_bg_color || null,
      continue_button_text_color: continue_button_text_color || e.continue_button_text_color || null,
      continue_button_bg_color: continue_button_bg_color || e.continue_button_bg_color || null,
      start_button_text_color: start_button_text_color || e.start_button_text_color || null,
      start_button_bg_color: start_button_bg_color || e.start_button_bg_color || null,
    };
    if (existing.length === 0) {
      const keys = Object.keys(fields);
      await db.query(`INSERT INTO connect4_settings (game_id,${keys.join(',')}) VALUES (?,${
        keys.map(() => '?').join(',')})`, [req.params.gameId, ...Object.values(fields)]);
    } else {
      const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
      await db.query(`UPDATE connect4_settings SET ${sets} WHERE game_id=?`, [...Object.values(fields), req.params.gameId]);
    }
    const [updated] = await db.query('SELECT * FROM connect4_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
