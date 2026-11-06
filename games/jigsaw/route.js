const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const upload = require('../../apps/backend/config/upload');
const path = require('path');
const fs = require('fs');
const { sendError } = require('../../apps/backend/lib/apiError');

function deleteUploadFile(urlPath) {
  if (!urlPath) return;
  try {
    const abs = path.join(__dirname, '..', '..', urlPath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (e) {
    console.warn('Could not delete file:', urlPath, e.message);
  }
}

router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM jigsaw_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/:gameId/settings', auth, upload.fields([
  { name: 'bg_image', maxCount: 1 },
  { name: 'thankyou_bg_image', maxCount: 1 },
  { name: 'game_logo', maxCount: 1 },
  { name: 'puzzle_image', maxCount: 1 },
  { name: 'submit_confirm_gif', maxCount: 1 },
]), async (req, res) => {
  const {
    grid_cols, grid_rows,
    show_timer, time_limit_seconds,
    heading_1, heading_2, heading_3, description_text,
    heading_1_color, heading_2_color, heading_3_color, description_color,
    bg_color, primary_color,
    bg_image_url, thankyou_bg_image_url, game_logo_url,
    puzzle_image_url, submit_confirm_gif_url,
    font_family,
    intro_text, outro_text, submit_button_text, continue_button_text, start_button_text,
    terms_enabled, terms_text, terms_url, meta_description,
    sound_correct_id, sound_wrong_id,
    allow_difficulty_selection,
    start_button_text_color, start_button_bg_color,
    submit_button_text_color, submit_button_bg_color, outro_text_color,
    continue_button_text_color, continue_button_bg_color,
    thankyou_heading_text, thankyou_heading_color, thankyou_subtitle_text, thankyou_subtitle_color,
    submit_btn_text, submit_btn_text_color, submit_btn_bg_color, continue_now_btn_text, continue_now_btn_text_color, continue_now_btn_bg_color,
    redirect_url,
  } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM jigsaw_settings WHERE game_id = ?', [req.params.gameId]);
    const e = existing[0] || {};

    const bgImg   = req.files?.bg_image           ? `/uploads/images/${req.files.bg_image[0].filename}`           : (bg_image_url           !== undefined ? bg_image_url           : (e.bg_image_url           || null));
    const tyImg   = req.files?.thankyou_bg_image  ? `/uploads/images/${req.files.thankyou_bg_image[0].filename}`  : (thankyou_bg_image_url  !== undefined ? thankyou_bg_image_url  : (e.thankyou_bg_image_url  || null));
    const logoImg = req.files?.game_logo          ? `/uploads/images/${req.files.game_logo[0].filename}`          : (game_logo_url          !== undefined ? game_logo_url          : (e.game_logo_url          || null));
    const pzImg   = req.files?.puzzle_image       ? `/uploads/images/${req.files.puzzle_image[0].filename}`       : (puzzle_image_url       !== undefined ? puzzle_image_url       : (e.puzzle_image_url       || null));
    const gifImg  = req.files?.submit_confirm_gif ? `/uploads/images/${req.files.submit_confirm_gif[0].filename}` : (submit_confirm_gif_url !== undefined ? submit_confirm_gif_url : (e.submit_confirm_gif_url || null));

    const n = (v, fallback) => v !== undefined && v !== '' ? Number(v) : fallback;

  const fields = {
    grid_cols: n(grid_cols, e.grid_cols || 4),
    grid_rows: n(grid_rows, e.grid_rows || 4),
    show_timer: n(show_timer, e.show_timer !== undefined ? e.show_timer : 1),
    time_limit_seconds: n(time_limit_seconds, e.time_limit_seconds || 0),
    heading_1: heading_1 !== undefined ? heading_1 : (e.heading_1 || null),
    heading_2: heading_2 !== undefined ? heading_2 : (e.heading_2 || null),
    heading_3: heading_3 !== undefined ? heading_3 : (e.heading_3 || null),
    description_text: description_text !== undefined ? description_text : (e.description_text || null),
    heading_1_color: heading_1_color !== undefined ? heading_1_color : (e.heading_1_color || '#1a1a2e'),
    heading_2_color: heading_2_color !== undefined ? heading_2_color : (e.heading_2_color || '#666666'),
    heading_3_color: heading_3_color !== undefined ? heading_3_color : (e.heading_3_color || '#777777'),
    description_color: description_color !== undefined ? description_color : (e.description_color || '#888888'),
    bg_color: bg_color !== undefined ? bg_color : (e.bg_color || '#f8f8ff'),
    primary_color: primary_color !== undefined ? primary_color : (e.primary_color || '#6366f1'),
    bg_image_url: bgImg,
    thankyou_bg_image_url: tyImg,
    game_logo_url: logoImg,
    puzzle_image_url: pzImg,
    submit_confirm_gif_url: gifImg,
    font_family: font_family !== undefined ? font_family : (e.font_family || 'DM Sans'),
    intro_text: intro_text !== undefined ? intro_text : (e.intro_text || null),
    outro_text: outro_text !== undefined ? outro_text : (e.outro_text || null),
    submit_button_text: submit_button_text !== undefined ? submit_button_text : (e.submit_button_text || null),
    continue_button_text: continue_button_text !== undefined ? continue_button_text : (e.continue_button_text || null),
    start_button_text: start_button_text !== undefined ? start_button_text : (e.start_button_text || null),
    terms_enabled: n(terms_enabled, e.terms_enabled || 0),
    terms_text: terms_text !== undefined ? terms_text : (e.terms_text || null),
    terms_url: terms_url !== undefined ? terms_url : (e.terms_url || null),
    meta_description: meta_description !== undefined ? meta_description : (e.meta_description || null),
    sound_correct_id: sound_correct_id !== undefined && sound_correct_id !== '' ? Number(sound_correct_id) : (e.sound_correct_id || null),
    sound_wrong_id: sound_wrong_id !== undefined && sound_wrong_id !== '' ? Number(sound_wrong_id) : (e.sound_wrong_id || null),
    allow_difficulty_selection: n(allow_difficulty_selection, e.allow_difficulty_selection || 0),
    start_button_text_color: start_button_text_color !== undefined ? start_button_text_color : (e.start_button_text_color || '#ffffff'),
    start_button_bg_color: start_button_bg_color !== undefined ? start_button_bg_color : e.start_button_bg_color,
    submit_button_text_color: submit_button_text_color !== undefined ? submit_button_text_color : (e.submit_button_text_color || '#ffffff'),
    submit_button_bg_color: submit_button_bg_color !== undefined ? submit_button_bg_color : e.submit_button_bg_color,
    outro_text_color: outro_text_color !== undefined ? outro_text_color : (e.outro_text_color || '#1a1a2e'),
    continue_button_text_color: continue_button_text_color !== undefined ? continue_button_text_color : (e.continue_button_text_color || '#ffffff'),
    continue_button_bg_color: continue_button_bg_color !== undefined ? continue_button_bg_color : e.continue_button_bg_color,
    thankyou_heading_text: thankyou_heading_text !== undefined ? thankyou_heading_text : (e.thankyou_heading_text || null),
    thankyou_heading_color: thankyou_heading_color !== undefined ? thankyou_heading_color : (e.thankyou_heading_color || '#1a1a2e'),
    thankyou_subtitle_text: thankyou_subtitle_text !== undefined ? thankyou_subtitle_text : (e.thankyou_subtitle_text || null),
    thankyou_subtitle_color: thankyou_subtitle_color !== undefined ? thankyou_subtitle_color : (e.thankyou_subtitle_color || '#444444'),
    submit_btn_text: submit_btn_text !== undefined ? submit_btn_text : (e.submit_button_text || null),
    submit_btn_text_color: submit_btn_text_color !== undefined ? submit_btn_text_color : (e.submit_btn_text_color || '#ffffff'),
    submit_btn_bg_color: submit_btn_bg_color !== undefined ? submit_btn_bg_color : e.submit_btn_bg_color,
    continue_now_btn_text: continue_now_btn_text !== undefined ? continue_now_btn_text : (e.continue_button_text || null),
    continue_now_btn_text_color: continue_now_btn_text_color !== undefined ? continue_now_btn_text_color : (e.continue_now_btn_text_color || '#ffffff'),
    continue_now_btn_bg_color: continue_now_btn_bg_color !== undefined ? continue_now_btn_bg_color : e.continue_now_btn_bg_color,
  };

    if (existing.length === 0) {
      const keys = Object.keys(fields);
      await db.query(
        `INSERT INTO jigsaw_settings (game_id,${keys.join(',')}) VALUES (?,${
          keys.map(() => '?').join(',')
        })`,
        [req.params.gameId, ...Object.values(fields)]
      );
    } else {
      const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
      await db.query(
        `UPDATE jigsaw_settings SET ${sets} WHERE game_id=?`,
        [...Object.values(fields), req.params.gameId]
      );
    }

    if (redirect_url !== undefined) {
      await db.query('UPDATE games SET redirect_url = ? WHERE id = ?', [redirect_url || null, req.params.gameId]);
    }

    const [updated] = await db.query('SELECT * FROM jigsaw_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
