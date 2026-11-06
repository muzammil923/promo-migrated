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
    const [rows] = await db.query('SELECT * FROM soundify_settings WHERE game_id = ?', [req.params.gameId]);
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
]), async (req, res) => {
  const {
    heading_1, heading_2, heading_3, description_text,
    heading_1_color, heading_2_color, heading_3_color, description_color,
    custom_win_msg, custom_lose_msg, try_again_btn_text, try_again_text_color, try_again_bg_color,
    continue_btn_text, continue_btn_text_color, continue_btn_bg_color,
    bg_color, primary_color, font_family, meta_description,
    sound_correct_id, sound_wrong_id, win_sound_id, lose_sound_id,
    terms_enabled, terms_text, terms_url,
    start_button_text, start_button_text_color, start_button_bg_color,
    thankyou_heading_text, thankyou_heading_color, thankyou_subtitle_text, thankyou_subtitle_color,
    submit_btn_text, submit_btn_text_color, submit_btn_bg_color,
    redirect_url, continue_now_btn_text, continue_now_btn_text_color, continue_now_btn_bg_color,
    time_per_question, max_sound_replays,
    bg_image_url, thankyou_bg_image_url, game_logo_url, submit_confirm_gif_url,
  } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM soundify_settings WHERE game_id = ?', [req.params.gameId]);
    const e = existing[0] || {};

    const bgImg     = req.files?.bg_image          ? `/uploads/images/${req.files.bg_image[0].filename}`           : normalizePath(bg_image_url !== undefined ? bg_image_url : (e.bg_image_url || null));
    const tyImg     = req.files?.thankyou_bg_image ? `/uploads/images/${req.files.thankyou_bg_image[0].filename}`  : normalizePath(thankyou_bg_image_url !== undefined ? thankyou_bg_image_url : (e.thankyou_bg_image_url || null));
    const logoImg   = req.files?.game_logo         ? `/uploads/images/${req.files.game_logo[0].filename}`          : normalizePath(game_logo_url !== undefined ? game_logo_url : (e.game_logo_url || null));
    const submitGif = req.files?.submit_confirm_gif ? `/uploads/images/${req.files.submit_confirm_gif[0].filename}` : normalizePath(submit_confirm_gif_url !== undefined ? submit_confirm_gif_url : (e.submit_confirm_gif_url || null));

    const fields = {
      heading_1:               heading_1 !== undefined ? heading_1 : (e.heading_1 || null),
      heading_2:               heading_2 !== undefined ? heading_2 : (e.heading_2 || null),
      heading_3:               heading_3 !== undefined ? heading_3 : (e.heading_3 || null),
      description_text:        description_text !== undefined ? description_text : (e.description_text || null),
      heading_1_color:         heading_1_color || e.heading_1_color || '#1a1a2e',
      heading_2_color:         heading_2_color || e.heading_2_color || '#1a1a2e',
      heading_3_color:         heading_3_color || e.heading_3_color || '#444444',
      description_color:       description_color || e.description_color || '#666666',
      custom_win_msg:          custom_win_msg !== undefined ? custom_win_msg : (e.custom_win_msg || null),
      custom_lose_msg:         custom_lose_msg !== undefined ? custom_lose_msg : (e.custom_lose_msg || null),
      try_again_btn_text:      try_again_btn_text !== undefined ? try_again_btn_text : (e.try_again_btn_text || null),
      try_again_text_color:    try_again_text_color || e.try_again_text_color || '#ffffff',
      try_again_bg_color:      try_again_bg_color || e.try_again_bg_color || null,
      continue_btn_text:       continue_btn_text !== undefined ? continue_btn_text : (e.continue_btn_text || null),
      continue_btn_text_color: continue_btn_text_color || e.continue_btn_text_color || '#ffffff',
      continue_btn_bg_color:   continue_btn_bg_color || e.continue_btn_bg_color || null,
      bg_color:                bg_color || e.bg_color || '#1a1a2e',
      primary_color:           primary_color || e.primary_color || '#8b5cf6',
      font_family:             font_family || e.font_family || 'DM Sans',
      meta_description:        meta_description !== undefined ? (meta_description || null) : (e.meta_description || null),
      sound_correct_id:        sanitizeValue(sound_correct_id),
      sound_wrong_id:          sanitizeValue(sound_wrong_id),
      win_sound_id:            sanitizeValue(win_sound_id),
      lose_sound_id:           sanitizeValue(lose_sound_id),
      terms_enabled:           terms_enabled !== undefined ? (parseInt(terms_enabled, 10) ? 1 : 0) : (e.terms_enabled || 0),
      terms_text:              terms_text !== undefined ? (terms_text || null) : (e.terms_text || null),
      terms_url:               terms_url !== undefined ? (terms_url || null) : (e.terms_url || null),
      start_button_text:       start_button_text !== undefined ? start_button_text : (e.start_button_text || null),
      start_button_text_color: start_button_text_color || e.start_button_text_color || '#ffffff',
      start_button_bg_color:   start_button_bg_color || e.start_button_bg_color || null,
      thankyou_heading_text:   thankyou_heading_text !== undefined ? thankyou_heading_text : (e.thankyou_heading_text || null),
      thankyou_heading_color:  thankyou_heading_color || e.thankyou_heading_color || null,
      thankyou_subtitle_text:  thankyou_subtitle_text !== undefined ? thankyou_subtitle_text : (e.thankyou_subtitle_text || null),
      thankyou_subtitle_color: thankyou_subtitle_color || e.thankyou_subtitle_color || null,
      submit_btn_text:         submit_btn_text !== undefined ? submit_btn_text : (e.submit_btn_text || null),
      submit_btn_text_color:   submit_btn_text_color || e.submit_btn_text_color || '#ffffff',
      submit_btn_bg_color:     submit_btn_bg_color || e.submit_btn_bg_color || null,
      redirect_url:            redirect_url !== undefined ? (redirect_url || null) : (e.redirect_url || null),
      continue_now_btn_text:   continue_now_btn_text !== undefined ? continue_now_btn_text : (e.continue_now_btn_text || null),
      continue_now_btn_text_color: continue_now_btn_text_color || e.continue_now_btn_text_color || '#ffffff',
      continue_now_btn_bg_color:   continue_now_btn_bg_color || e.continue_now_btn_bg_color || null,
      time_per_question:       time_per_question !== undefined ? (Number(time_per_question) || 30) : (e.time_per_question || 30),
      max_sound_replays:       max_sound_replays !== undefined ? (Number(max_sound_replays) || 0) : (e.max_sound_replays || 0),
      bg_image_url:            bgImg,
      thankyou_bg_image_url:   tyImg,
      game_logo_url:           logoImg,
      submit_confirm_gif_url:  submitGif,
    };

    const colNames = Object.keys(fields);
    const colValues = Object.values(fields);

    if (existing.length === 0) {
      const allCols = ['game_id', ...colNames];
      const placeholders = allCols.map(() => '?').join(',');
      await db.query(
        `INSERT INTO soundify_settings (${allCols.join(',')}) VALUES (${placeholders})`,
        [req.params.gameId, ...colValues]
      );
    } else {
      const sets = colNames.map(k => `${k}=?`).join(',');
      await db.query(
        `UPDATE soundify_settings SET ${sets} WHERE game_id=?`,
        [...colValues, req.params.gameId]
      );
    }

    const [updated] = await db.query('SELECT * FROM soundify_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    sendError(res, err);
  }
});

/* ================== SONGS ================== */

router.get('/:gameId/songs', auth, async (req, res) => {
  try {
    const [songs] = await db.query(
      'SELECT * FROM soundify_songs WHERE game_id = ? ORDER BY song_order',
      [req.params.gameId]
    );
    res.json({ success: true, songs });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/:gameId/songs', auth, upload.single('song_file'), async (req, res) => {
  const { song_title, option_1, option_2, option_3, option_4, correct_option } = req.body;
  try {
    const song_url = req.file ? `/uploads/sounds/${req.file.filename}` : null;

    const [maxOrder] = await db.query('SELECT COALESCE(MAX(song_order),0)+1 AS next_order FROM soundify_songs WHERE game_id=?', [req.params.gameId]);

    const [result] = await db.query(
      `INSERT INTO soundify_songs (game_id, song_title, song_url, option_1, option_2, option_3, option_4, correct_option, song_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.gameId, song_title || '', song_url, option_1 || '', option_2 || '', option_3 || '', option_4 || '', correct_option || 1, maxOrder[0].next_order]
    );
    const [song] = await db.query('SELECT * FROM soundify_songs WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, song: song[0] });
  } catch (err) {
    sendError(res, err);
  }
});

router.delete('/:gameId/songs/:songId', auth, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM soundify_songs WHERE id = ? AND game_id = ?', [req.params.songId, req.params.gameId]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Song not found' });
    if (existing[0].song_url) deleteUploadFile(existing[0].song_url);
    await db.query('DELETE FROM soundify_songs WHERE id = ?', [req.params.songId]);
    res.json({ success: true, message: 'Song deleted' });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
