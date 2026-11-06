const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const upload = require('../../apps/backend/config/upload');
const { sendError } = require('../../apps/backend/lib/apiError');

router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM reaction_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) { sendError(res, err); }
});

router.put('/:gameId/settings', auth, upload.fields([
  { name: 'bg_image', maxCount: 1 }, { name: 'thankyou_bg_image', maxCount: 1 },
  { name: 'game_logo', maxCount: 1 }, { name: 'submit_confirm_gif', maxCount: 1 },
]), async (req, res) => {
  const {
    rounds, color_change_delay, target_color, show_leaderboard,
    heading_1, heading_2, heading_3, description_text,
    heading_1_color, heading_2_color, heading_3_color, description_color,
    bg_color, primary_color, font_family, show_timer,
    sound_correct_id, sound_wrong_id, intro_text, outro_text,
    submit_button_text, continue_button_text, start_button_text,
    terms_enabled, terms_text, terms_url, meta_description,
    bg_image_url, thankyou_bg_image_url, game_logo_url, submit_confirm_gif_url,
  } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM reaction_settings WHERE game_id = ?', [req.params.gameId]);
    const e = existing[0] || {};
    const bgImg = req.files?.bg_image ? `/uploads/images/${req.files.bg_image[0].filename}` : (bg_image_url !== undefined ? bg_image_url : (e.bg_image_url || null));
    const tyImg = req.files?.thankyou_bg_image ? `/uploads/images/${req.files.thankyou_bg_image[0].filename}` : (thankyou_bg_image_url !== undefined ? thankyou_bg_image_url : (e.thankyou_bg_image_url || null));
    const logoImg = req.files?.game_logo ? `/uploads/images/${req.files.game_logo[0].filename}` : (game_logo_url !== undefined ? game_logo_url : (e.game_logo_url || null));
    const gifImg = req.files?.submit_confirm_gif ? `/uploads/images/${req.files.submit_confirm_gif[0].filename}` : (submit_confirm_gif_url !== undefined ? submit_confirm_gif_url : (e.submit_confirm_gif_url || null));
    const n = (v, f) => v !== undefined && v !== '' ? Number(v) : f;
    const fields = {
      rounds: n(rounds, e.rounds || 5), color_change_delay: n(color_change_delay, e.color_change_delay || 2000),
      target_color: target_color || e.target_color || '#22c55e',
      show_leaderboard: n(show_leaderboard, e.show_leaderboard !== undefined ? e.show_leaderboard : 1),
      heading_1: heading_1 !== undefined ? heading_1 : (e.heading_1 || null),
      heading_2: heading_2 !== undefined ? heading_2 : (e.heading_2 || null),
      heading_3: heading_3 !== undefined ? heading_3 : (e.heading_3 || null),
      description_text: description_text !== undefined ? description_text : (e.description_text || null),
      heading_1_color: heading_1_color || e.heading_1_color || '#1a1a2e',
      heading_2_color: heading_2_color || e.heading_2_color || '#666666',
      heading_3_color: heading_3_color || e.heading_3_color || '#777777',
      description_color: description_color || e.description_color || '#888888',
      bg_color: bg_color || e.bg_color || '#0f172a',
      primary_color: primary_color || e.primary_color || '#ef4444',
      bg_image_url: bgImg, thankyou_bg_image_url: tyImg, game_logo_url: logoImg, submit_confirm_gif_url: gifImg,
      font_family: font_family || e.font_family || 'DM Sans',
      sound_correct_id: sound_correct_id !== undefined && sound_correct_id !== '' ? Number(sound_correct_id) : (e.sound_correct_id || null),
      sound_wrong_id: sound_wrong_id !== undefined && sound_wrong_id !== '' ? Number(sound_wrong_id) : (e.sound_wrong_id || null),
      show_timer: n(show_timer, e.show_timer !== undefined ? e.show_timer : 1),
      intro_text: intro_text !== undefined ? intro_text : (e.intro_text || null),
      outro_text: outro_text !== undefined ? outro_text : (e.outro_text || null),
      submit_button_text: submit_button_text !== undefined ? submit_button_text : (e.submit_button_text || null),
      continue_button_text: continue_button_text !== undefined ? continue_button_text : (e.continue_button_text || null),
      start_button_text: start_button_text !== undefined ? start_button_text : (e.start_button_text || null),
      terms_enabled: n(terms_enabled, e.terms_enabled || 0),
      terms_text: terms_text !== undefined ? terms_text : (e.terms_text || null),
      terms_url: terms_url !== undefined ? terms_url : (e.terms_url || null),
      meta_description: meta_description !== undefined ? meta_description : (e.meta_description || null),
    };
    if (existing.length === 0) {
      const keys = Object.keys(fields);
      await db.query(`INSERT INTO reaction_settings (game_id,${keys.join(',')}) VALUES (?,${
        keys.map(() => '?').join(',')})`, [req.params.gameId, ...Object.values(fields)]);
    } else {
      const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
      await db.query(`UPDATE reaction_settings SET ${sets} WHERE game_id=?`, [...Object.values(fields), req.params.gameId]);
    }
    const [updated] = await db.query('SELECT * FROM reaction_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
