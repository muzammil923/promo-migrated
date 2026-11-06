const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const upload = require('../../apps/backend/config/upload');
const { sendError } = require('../../apps/backend/lib/apiError');

let screwColsMigrated = false;

router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM screw_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/:gameId/settings', auth, upload.fields([
  { name: 'bg_image', maxCount: 1 },
  { name: 'thankyou_bg_image', maxCount: 1 },
  { name: 'game_logo', maxCount: 1 },
  { name: 'reveal_image', maxCount: 1 },
  { name: 'submit_confirm_gif', maxCount: 1 },
]), async (req, res) => {
  const {
    board_rows, board_cols, block_colors, screws_per_block, empty_holes, difficulty,
    heading_1, heading_2, heading_3, description_text,
    heading_1_color, heading_2_color, heading_3_color, description_color,
    bg_color, primary_color, font_family,
    show_timer, time_limit_seconds,
    sound_screw_id, sound_fall_id, sound_reveal_id,
    intro_text, outro_text, submit_button_text, continue_button_text, start_button_text,
    reveal_text, terms_enabled, terms_text, terms_url, meta_description,
    bg_image_url, thankyou_bg_image_url, game_logo_url, reveal_image_url, submit_confirm_gif_url,
  } = req.body;

  try {
    if (!screwColsMigrated) {
      await db.query('ALTER TABLE screw_settings ADD COLUMN IF NOT EXISTS empty_holes INT NULL');
      screwColsMigrated = true
    }
    const [existing] = await db.query('SELECT * FROM screw_settings WHERE game_id = ?', [req.params.gameId]);
    const e = existing[0] || {};

    const bgImg   = req.files?.bg_image           ? `/uploads/images/${req.files.bg_image[0].filename}`           : (bg_image_url !== undefined ? bg_image_url : (e.bg_image_url || null));
    const tyImg   = req.files?.thankyou_bg_image  ? `/uploads/images/${req.files.thankyou_bg_image[0].filename}`  : (thankyou_bg_image_url !== undefined ? thankyou_bg_image_url : (e.thankyou_bg_image_url || null));
    const logoImg = req.files?.game_logo          ? `/uploads/images/${req.files.game_logo[0].filename}`          : (game_logo_url !== undefined ? game_logo_url : (e.game_logo_url || null));
    const revImg  = req.files?.reveal_image       ? `/uploads/images/${req.files.reveal_image[0].filename}`       : (reveal_image_url !== undefined ? reveal_image_url : (e.reveal_image_url || null));
    const gifImg  = req.files?.submit_confirm_gif ? `/uploads/images/${req.files.submit_confirm_gif[0].filename}` : (submit_confirm_gif_url !== undefined ? submit_confirm_gif_url : (e.submit_confirm_gif_url || null));

    const n = (v, fallback) => v !== undefined && v !== '' ? Number(v) : fallback;

    const fields = {
      board_rows: n(board_rows, e.board_rows || 6),
      board_cols: n(board_cols, e.board_cols || 6),
      block_colors: block_colors || e.block_colors || '#c0392b,#2980b9,#27ae60,#f39c12,#8e44ad',
      screws_per_block: n(screws_per_block, e.screws_per_block || 2),
      empty_holes: n(empty_holes, e.empty_holes || 3),
      difficulty: difficulty || e.difficulty || 'medium',
      show_timer: n(show_timer, e.show_timer !== undefined ? e.show_timer : 1),
      time_limit_seconds: n(time_limit_seconds, e.time_limit_seconds || 120),
      heading_1: heading_1 !== undefined ? heading_1 : (e.heading_1 || null),
      heading_2: heading_2 !== undefined ? heading_2 : (e.heading_2 || null),
      heading_3: heading_3 !== undefined ? heading_3 : (e.heading_3 || null),
      description_text: description_text !== undefined ? description_text : (e.description_text || null),
      heading_1_color: heading_1_color || e.heading_1_color || '#1a1a2e',
      heading_2_color: heading_2_color || e.heading_2_color || '#666666',
      heading_3_color: heading_3_color || e.heading_3_color || '#777777',
      description_color: description_color || e.description_color || '#888888',
      bg_color: bg_color || e.bg_color || '#f0e6d3',
      primary_color: primary_color || e.primary_color || '#8B4513',
      bg_image_url: bgImg,
      thankyou_bg_image_url: tyImg,
      game_logo_url: logoImg,
      reveal_image_url: revImg,
      submit_confirm_gif_url: gifImg,
      font_family: font_family || e.font_family || 'DM Sans',
      sound_screw_id: sound_screw_id !== undefined && sound_screw_id !== '' ? Number(sound_screw_id) : (e.sound_screw_id || null),
      sound_fall_id: sound_fall_id !== undefined && sound_fall_id !== '' ? Number(sound_fall_id) : (e.sound_fall_id || null),
      sound_reveal_id: sound_reveal_id !== undefined && sound_reveal_id !== '' ? Number(sound_reveal_id) : (e.sound_reveal_id || null),
      intro_text: intro_text !== undefined ? intro_text : (e.intro_text || null),
      outro_text: outro_text !== undefined ? outro_text : (e.outro_text || null),
      submit_button_text: submit_button_text !== undefined ? submit_button_text : (e.submit_button_text || null),
      continue_button_text: continue_button_text !== undefined ? continue_button_text : (e.continue_button_text || null),
      start_button_text: start_button_text !== undefined ? start_button_text : (e.start_button_text || null),
      reveal_text: reveal_text !== undefined ? reveal_text : (e.reveal_text || null),
      terms_enabled: n(terms_enabled, e.terms_enabled || 0),
      terms_text: terms_text !== undefined ? terms_text : (e.terms_text || null),
      terms_url: terms_url !== undefined ? terms_url : (e.terms_url || null),
      meta_description: meta_description !== undefined ? meta_description : (e.meta_description || null),
    };

    if (existing.length === 0) {
      const keys = Object.keys(fields);
      await db.query(
        `INSERT INTO screw_settings (game_id,${keys.join(',')}) VALUES (?,${
          keys.map(() => '?').join(',')
        })`,
        [req.params.gameId, ...Object.values(fields)]
      );
    } else {
      const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
      await db.query(
        `UPDATE screw_settings SET ${sets} WHERE game_id=?`,
        [...Object.values(fields), req.params.gameId]
      );
    }

    const [updated] = await db.query('SELECT * FROM screw_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
