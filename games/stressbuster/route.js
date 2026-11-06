const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const upload = require('../../apps/backend/config/upload');
const path = require('path');
const fs = require('fs');
const { sendError } = require('../../apps/backend/lib/apiError');

function normalizePath(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.replace(/\\/g, '/');
  if (typeof value?.path === 'string') return value.path.replace(/\\/g, '/');
  return null;
}

function deleteUploadFile(urlPath) {
  const p = normalizePath(urlPath);
  if (!p) return;
  try {
    const abs = path.join(__dirname, '..', '..', p);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (e) {
    console.warn('Could not delete file:', urlPath, e.message);
  }
}

function sanitizeValue(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') { if (v === '') return null; return v; }
  if (typeof v === 'number') return isNaN(v) ? null : v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return null;
}

/* ================== SETTINGS ================== */

router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM stressbuster_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/:gameId/settings', auth, upload.fields([
  { name: 'bg_image', maxCount: 1 },
  { name: 'thankyou_bg_image', maxCount: 1 },
  { name: 'game_logo', maxCount: 1 },
  { name: 'submit_confirm_gif', maxCount: 1 },
  { name: 'o_image', maxCount: 1 },
]), async (req, res) => {
  const {
    heading_1, heading_2, heading_3, description_text,
    heading_1_color, heading_2_color, heading_3_color, description_color,
    custom_win_msg, try_again_btn_text, try_again_text_color, try_again_bg_color,
    continue_btn_text, continue_btn_text_color, continue_btn_bg_color,
    bg_color, primary_color, board_cell_color, font_family, meta_description,
    sound_correct_id, sound_wrong_id, win_sound_id, lose_sound_id,
    game_mode, difficulty, target_count, time_limit,
    terms_enabled, terms_text, terms_url,
    start_button_text, start_button_text_color, start_button_bg_color,
    thankyou_heading_text, thankyou_heading_color, thankyou_subtitle_text, thankyou_subtitle_color,
    submit_btn_text, submit_btn_text_color, submit_btn_bg_color,
    redirect_url, continue_now_btn_text, continue_now_btn_text_color, continue_now_btn_bg_color,
    click_limit, timer_enabled, show_click_count, click_mode,
    frustration_enabled, show_click_speed, show_frustration_result,
    cat_health, millisecond_display, frustration_mode,
    bg_image_url, thankyou_bg_image_url, game_logo_url, submit_confirm_gif_url, o_image_url,
  } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM stressbuster_settings WHERE game_id = ?', [req.params.gameId]);
    const e = existing[0] || {};

    const bgImg       = req.files?.bg_image          ? `/uploads/images/${req.files.bg_image[0].filename}`           : normalizePath(bg_image_url !== undefined ? bg_image_url : (e.bg_image_url || null));
    const tyImg       = req.files?.thankyou_bg_image ? `/uploads/images/${req.files.thankyou_bg_image[0].filename}`  : normalizePath(thankyou_bg_image_url !== undefined ? thankyou_bg_image_url : (e.thankyou_bg_image_url || null));
    const logoImg     = req.files?.game_logo         ? `/uploads/images/${req.files.game_logo[0].filename}`          : normalizePath(game_logo_url !== undefined ? game_logo_url : (e.game_logo_url || null));
    const submitGif   = req.files?.submit_confirm_gif ? `/uploads/images/${req.files.submit_confirm_gif[0].filename}` : normalizePath(submit_confirm_gif_url !== undefined ? submit_confirm_gif_url : (e.submit_confirm_gif_url || null));
    const oImg        = req.files?.o_image           ? `/uploads/images/${req.files.o_image[0].filename}`            : normalizePath(o_image_url !== undefined ? o_image_url : (e.o_image_url || null));

    const fields = {
      heading_1:              heading_1 !== undefined ? heading_1 : (e.heading_1 || null),
      heading_2:              heading_2 !== undefined ? heading_2 : (e.heading_2 || null),
      heading_3:              heading_3 !== undefined ? heading_3 : (e.heading_3 || null),
      description_text:       description_text !== undefined ? description_text : (e.description_text || null),
      heading_1_color:        heading_1_color || e.heading_1_color || '#1a1a2e',
      heading_2_color:        heading_2_color || e.heading_2_color || '#1a1a2e',
      heading_3_color:        heading_3_color || e.heading_3_color || '#444444',
      description_color:      description_color || e.description_color || '#666666',
      custom_win_msg:         custom_win_msg !== undefined ? custom_win_msg : (e.custom_win_msg || null),
      try_again_btn_text:     try_again_btn_text !== undefined ? try_again_btn_text : (e.try_again_btn_text || null),
      try_again_text_color:   try_again_text_color || e.try_again_text_color || '#ffffff',
      try_again_bg_color:     try_again_bg_color || e.try_again_bg_color || null,
      continue_btn_text:      continue_btn_text !== undefined ? continue_btn_text : (e.continue_btn_text || null),
      continue_btn_text_color:continue_btn_text_color || e.continue_btn_text_color || '#ffffff',
      continue_btn_bg_color:  continue_btn_bg_color || e.continue_btn_bg_color || null,
      bg_color:               bg_color || e.bg_color || '#f4f6fb',
      primary_color:          primary_color || e.primary_color || '#9333ea',
      board_cell_color:       board_cell_color || e.board_cell_color || null,
      font_family:            font_family || e.font_family || 'DM Sans',
      meta_description:       meta_description !== undefined ? (meta_description || null) : (e.meta_description || null),
      sound_correct_id:       sanitizeValue(sound_correct_id),
      sound_wrong_id:         sanitizeValue(sound_wrong_id),
      win_sound_id:           sanitizeValue(win_sound_id),
      lose_sound_id:          sanitizeValue(lose_sound_id),
      game_mode:              game_mode || e.game_mode || null,
      difficulty:             difficulty || e.difficulty || null,
      target_count:           target_count !== undefined ? target_count : (e.target_count || 20),
      time_limit:             time_limit !== undefined ? time_limit : (e.time_limit || 0),
      terms_enabled:          terms_enabled !== undefined ? (parseInt(terms_enabled, 10) ? 1 : 0) : (e.terms_enabled || 0),
      terms_text:             terms_text !== undefined ? (terms_text || null) : (e.terms_text || null),
      terms_url:              terms_url !== undefined ? (terms_url || null) : (e.terms_url || null),
      start_button_text:      start_button_text !== undefined ? start_button_text : (e.start_button_text || null),
      start_button_text_color:start_button_text_color || e.start_button_text_color || '#ffffff',
      start_button_bg_color:  start_button_bg_color || e.start_button_bg_color || null,
      thankyou_heading_text:  thankyou_heading_text !== undefined ? thankyou_heading_text : (e.thankyou_heading_text || null),
      thankyou_heading_color: thankyou_heading_color || e.thankyou_heading_color || null,
      thankyou_subtitle_text: thankyou_subtitle_text !== undefined ? thankyou_subtitle_text : (e.thankyou_subtitle_text || null),
      thankyou_subtitle_color:thankyou_subtitle_color || e.thankyou_subtitle_color || null,
      submit_btn_text:        submit_btn_text !== undefined ? submit_btn_text : (e.submit_btn_text || null),
      submit_btn_text_color:  submit_btn_text_color || e.submit_btn_text_color || '#ffffff',
      submit_btn_bg_color:    submit_btn_bg_color || e.submit_btn_bg_color || null,
      redirect_url:           redirect_url !== undefined ? (redirect_url || null) : (e.redirect_url || null),
      continue_now_btn_text:  continue_now_btn_text !== undefined ? continue_now_btn_text : (e.continue_now_btn_text || null),
      continue_now_btn_text_color: continue_now_btn_text_color || e.continue_now_btn_text_color || '#ffffff',
      continue_now_btn_bg_color:   continue_now_btn_bg_color || e.continue_now_btn_bg_color || null,
      click_limit:            click_limit !== undefined ? click_limit : (e.click_limit || 21),
      timer_enabled:          timer_enabled !== undefined ? (parseInt(timer_enabled, 10) ? 1 : 0) : (e.timer_enabled || 0),
      show_click_count:       show_click_count !== undefined ? (parseInt(show_click_count, 10) ? 1 : 0) : (e.show_click_count || 1),
      click_mode:             click_mode || e.click_mode || null,
      frustration_enabled:    frustration_enabled !== undefined ? (parseInt(frustration_enabled, 10) ? 1 : 0) : (e.frustration_enabled || 0),
      show_click_speed:       show_click_speed !== undefined ? (parseInt(show_click_speed, 10) ? 1 : 0) : (e.show_click_speed || 0),
      show_frustration_result:show_frustration_result !== undefined ? (parseInt(show_frustration_result, 10) ? 1 : 0) : (e.show_frustration_result || 0),
      cat_health:             cat_health !== undefined ? cat_health : (e.cat_health || 20),
      millisecond_display:    millisecond_display !== undefined ? (parseInt(millisecond_display, 10) ? 1 : 0) : (e.millisecond_display || 0),
      frustration_mode:       frustration_mode !== undefined ? (parseInt(frustration_mode, 10) ? 1 : 0) : (e.frustration_mode || 0),
      bg_image_url:           bgImg,
      thankyou_bg_image_url:  tyImg,
      game_logo_url:          logoImg,
      submit_confirm_gif_url: submitGif,
      o_image_url:            oImg,
    };

    const colNames = Object.keys(fields);
    const colValues = Object.values(fields);

    if (existing.length === 0) {
      const allCols = ['game_id', ...colNames];
      const placeholders = allCols.map(() => '?').join(',');
      await db.query(
        `INSERT INTO stressbuster_settings (${allCols.join(',')}) VALUES (${placeholders})`,
        [req.params.gameId, ...colValues]
      );
    } else {
      const sets = colNames.map(k => `${k}=?`).join(',');
      await db.query(
        `UPDATE stressbuster_settings SET ${sets} WHERE game_id=?`,
        [...colValues, req.params.gameId]
      );
    }

    const [updated] = await db.query('SELECT * FROM stressbuster_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
