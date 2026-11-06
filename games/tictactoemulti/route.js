const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const upload = require('../../apps/backend/config/upload');
const { sendError } = require('../../apps/backend/lib/apiError');

router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tictactoe_multi_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) { sendError(res, err); }
});

router.put('/:gameId/settings', auth, upload.fields([
  { name: 'bg_image', maxCount: 1 }, { name: 'thankyou_bg_image', maxCount: 1 },
  { name: 'game_logo', maxCount: 1 }, { name: 'submit_confirm_gif', maxCount: 1 },
]), async (req, res) => {
  const {
    heading_1, heading_2, heading_3, description_text,
    heading_1_color, heading_2_color, heading_3_color, description_color,
    intro_text, intro_text_color, outro_text, outro_text_color,
    thankyou_subtitle, thankyou_subtitle_color,
    bg_color, primary_color, font_family, show_timer, time_limit_seconds,
    submit_button_text, submit_button_text_color, submit_button_bg_color,
    continue_button_text, continue_button_text_color, continue_button_bg_color,
    start_button_text, start_button_text_color, start_button_bg_color,
    reveal_text, terms_enabled, terms_text, terms_url, meta_description,
    bg_image_url, thankyou_bg_image_url, game_logo_url, submit_confirm_gif_url,
  } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM tictactoe_multi_settings WHERE game_id = ?', [req.params.gameId]);
    const e = existing[0] || {};
    const n = (v, f) => v !== undefined && v !== '' ? Number(v) : f;
    const img = (field) => {
      if (req.files?.[field]) return `/uploads/images/${req.files[field][0].filename}`;
      const urlKey = field + '_url';
      return req.body[urlKey] !== undefined ? req.body[urlKey] : (e[urlKey] || null);
    };
    const fields = {
      heading_1: heading_1 !== undefined ? heading_1 : (e.heading_1 || null),
      heading_2: heading_2 !== undefined ? heading_2 : (e.heading_2 || null),
      heading_3: heading_3 !== undefined ? heading_3 : (e.heading_3 || null),
      description_text: description_text !== undefined ? description_text : (e.description_text || null),
      heading_1_color: heading_1_color || e.heading_1_color || '#1a1a2e',
      heading_2_color: heading_2_color || e.heading_2_color || '#666666',
      heading_3_color: heading_3_color || e.heading_3_color || '#777777',
      description_color: description_color || e.description_color || '#888888',
      intro_text: intro_text !== undefined ? intro_text : (e.intro_text || null),
      intro_text_color: intro_text_color || e.intro_text_color || '#444444',
      outro_text: outro_text !== undefined ? outro_text : (e.outro_text || null),
      outro_text_color: outro_text_color || e.outro_text_color || '#444444',
      thankyou_subtitle: thankyou_subtitle !== undefined ? thankyou_subtitle : (e.thankyou_subtitle || null),
      thankyou_subtitle_color: thankyou_subtitle_color || e.thankyou_subtitle_color || '#444444',
      bg_color: bg_color || e.bg_color || '#0f172a',
      primary_color: primary_color || e.primary_color || '#6366f1',
      bg_image_url: img('bg_image'), thankyou_bg_image_url: img('thankyou_bg_image'),
      game_logo_url: img('game_logo'), submit_confirm_gif_url: img('submit_confirm_gif'),
      font_family: font_family || e.font_family || 'DM Sans',
      show_timer: n(show_timer, e.show_timer ?? 1),
      time_limit_seconds: n(time_limit_seconds, e.time_limit_seconds || 0),
      submit_button_text: submit_button_text !== undefined ? submit_button_text : (e.submit_button_text || null),
      submit_button_text_color: submit_button_text_color || e.submit_button_text_color || '#ffffff',
      submit_button_bg_color: submit_button_bg_color || e.submit_button_bg_color || null,
      continue_button_text: continue_button_text !== undefined ? continue_button_text : (e.continue_button_text || null),
      continue_button_text_color: continue_button_text_color || e.continue_button_text_color || '#ffffff',
      continue_button_bg_color: continue_button_bg_color || e.continue_button_bg_color || null,
      start_button_text: start_button_text !== undefined ? start_button_text : (e.start_button_text || null),
      start_button_text_color: start_button_text_color || e.start_button_text_color || '#ffffff',
      start_button_bg_color: start_button_bg_color || e.start_button_bg_color || null,
      reveal_text: reveal_text !== undefined ? reveal_text : (e.reveal_text || null),
      terms_enabled: n(terms_enabled, e.terms_enabled || 0),
      terms_text: terms_text !== undefined ? terms_text : (e.terms_text || null),
      terms_url: terms_url !== undefined ? terms_url : (e.terms_url || null),
      meta_description: meta_description !== undefined ? meta_description : (e.meta_description || null),
    };
    if (existing.length === 0) {
      const keys = Object.keys(fields);
      await db.query(`INSERT INTO tictactoe_multi_settings (game_id,${keys.join(',')}) VALUES (?,${
        keys.map(() => '?').join(',')})`, [req.params.gameId, ...Object.values(fields)]);
    } else {
      const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
      await db.query(`UPDATE tictactoe_multi_settings SET ${sets} WHERE game_id=?`, [...Object.values(fields), req.params.gameId]);
    }
    const [updated] = await db.query('SELECT * FROM tictactoe_multi_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
