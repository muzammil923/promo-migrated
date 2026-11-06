const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const upload = require('../../apps/backend/config/upload');
const { sendError } = require('../../apps/backend/lib/apiError');

router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tictactoe_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) { sendError(res, err); }
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
    bg_color, primary_color, board_cell_color, bg_image_url, thankyou_bg_image_url, game_logo_url,
    font_family, submit_confirm_gif_url, meta_description,
    enable_board_selection, enable_level_selection, board_size, difficulty,
    terms_enabled, terms_text, terms_url,
    start_button_text, start_button_text_color, start_button_bg_color,
    sound_correct_id, sound_wrong_id, win_sound_id, lose_sound_id, o_image_url,
    thankyou_heading_text, thankyou_heading_color, thankyou_subtitle_text, thankyou_subtitle_color,
    submit_btn_text, submit_btn_text_color, submit_btn_bg_color,
    redirect_url, continue_now_btn_text, continue_now_btn_text_color, continue_now_btn_bg_color,
  } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM tictactoe_settings WHERE game_id = ?', [req.params.gameId]);
    const e = existing[0] || {};
    const toNullInt = v => (v === '' || v === undefined || v === null) ? null : Number(v);

    const bgImg  = req.files?.bg_image          ? `/uploads/images/${req.files.bg_image[0].filename}`          : (bg_image_url          !== undefined ? bg_image_url          : (e.bg_image_url          || null));
    const tyImg  = req.files?.thankyou_bg_image ? `/uploads/images/${req.files.thankyou_bg_image[0].filename}` : (thankyou_bg_image_url !== undefined ? thankyou_bg_image_url : (e.thankyou_bg_image_url || null));
    const logoImg = req.files?.game_logo        ? `/uploads/images/${req.files.game_logo[0].filename}`         : (game_logo_url         !== undefined ? game_logo_url         : (e.game_logo_url         || null));
    const gifImg = req.files?.submit_confirm_gif ? `/uploads/images/${req.files.submit_confirm_gif[0].filename}` : (submit_confirm_gif_url !== undefined ? submit_confirm_gif_url : (e.submit_confirm_gif_url || null));
    const oImg   = req.files?.o_image           ? `/uploads/images/${req.files.o_image[0].filename}`           : (o_image_url           !== undefined ? o_image_url           : (e.o_image_url           || null));

    const fields = {
      heading_1: heading_1 !== undefined ? heading_1 : (e.heading_1 || null),
      heading_2: heading_2 !== undefined ? heading_2 : (e.heading_2 || null),
      heading_3: heading_3 !== undefined ? heading_3 : (e.heading_3 || null),
      description_text: description_text !== undefined ? description_text : (e.description_text || null),
      heading_1_color: heading_1_color || e.heading_1_color || '#1a1a2e',
      heading_2_color: heading_2_color || e.heading_2_color || '#666666',
      heading_3_color: heading_3_color || e.heading_3_color || '#777777',
      description_color: description_color || e.description_color || '#888888',
      custom_win_msg: custom_win_msg !== undefined ? custom_win_msg : (e.custom_win_msg || null),
      try_again_btn_text: try_again_btn_text !== undefined ? try_again_btn_text : (e.try_again_btn_text || null),
      try_again_text_color: try_again_text_color || e.try_again_text_color || '#ffffff',
      try_again_bg_color: try_again_bg_color !== undefined ? try_again_bg_color : (e.try_again_bg_color || null),
      continue_btn_text: continue_btn_text !== undefined ? continue_btn_text : (e.continue_btn_text || null),
      continue_btn_text_color: continue_btn_text_color || e.continue_btn_text_color || '#ffffff',
      continue_btn_bg_color: continue_btn_bg_color !== undefined ? continue_btn_bg_color : (e.continue_btn_bg_color || null),
      bg_color: bg_color || e.bg_color || '#1e293b',
      primary_color: primary_color || e.primary_color || '#6366f1',
      board_cell_color: board_cell_color !== undefined ? board_cell_color : (e.board_cell_color || '#ffffff'),
      bg_image_url: bgImg, thankyou_bg_image_url: tyImg, game_logo_url: logoImg,
      font_family: font_family || e.font_family || 'DM Sans',
      meta_description: meta_description !== undefined ? meta_description : (e.meta_description || null),
      submit_confirm_gif_url: gifImg, o_image_url: oImg,
      enable_board_selection: enable_board_selection !== undefined ? Number(enable_board_selection) : (e.enable_board_selection ?? 1),
      enable_level_selection: enable_level_selection !== undefined ? Number(enable_level_selection) : (e.enable_level_selection ?? 1),
      board_size: board_size !== undefined ? board_size : (e.board_size || '3'),
      difficulty: difficulty !== undefined ? difficulty : (e.difficulty || 'easy'),
      terms_enabled: terms_enabled !== undefined ? Number(terms_enabled) : (e.terms_enabled || 0),
      terms_text: terms_text !== undefined ? terms_text : (e.terms_text || null),
      terms_url: terms_url !== undefined ? terms_url : (e.terms_url || null),
      start_button_text: start_button_text !== undefined ? start_button_text : (e.start_button_text || 'Start Game'),
      start_button_text_color: start_button_text_color || e.start_button_text_color || '#ffffff',
      start_button_bg_color: start_button_bg_color !== undefined ? start_button_bg_color : (e.start_button_bg_color || null),
      sound_correct_id: toNullInt(sound_correct_id !== undefined ? sound_correct_id : e.sound_correct_id),
      sound_wrong_id: toNullInt(sound_wrong_id !== undefined ? sound_wrong_id : e.sound_wrong_id),
      win_sound_id: toNullInt(win_sound_id !== undefined ? win_sound_id : e.win_sound_id),
      lose_sound_id: toNullInt(lose_sound_id !== undefined ? lose_sound_id : e.lose_sound_id),
      thankyou_heading_text: thankyou_heading_text !== undefined ? thankyou_heading_text : (e.thankyou_heading_text || null),
      thankyou_heading_color: thankyou_heading_color || e.thankyou_heading_color || '#1a1a2e',
      thankyou_subtitle_text: thankyou_subtitle_text !== undefined ? thankyou_subtitle_text : (e.thankyou_subtitle_text || null),
      thankyou_subtitle_color: thankyou_subtitle_color || e.thankyou_subtitle_color || '#444444',
      submit_btn_text: submit_btn_text !== undefined ? submit_btn_text : (e.submit_btn_text || null),
      submit_btn_text_color: submit_btn_text_color || e.submit_btn_text_color || '#ffffff',
      submit_btn_bg_color: submit_btn_bg_color || e.submit_btn_bg_color || '#000000',
      redirect_url: redirect_url !== undefined ? redirect_url : (e.redirect_url || null),
      continue_now_btn_text: continue_now_btn_text !== undefined ? continue_now_btn_text : (e.continue_now_btn_text || null),
      continue_now_btn_text_color: continue_now_btn_text_color || e.continue_now_btn_text_color || '#ffffff',
      continue_now_btn_bg_color: continue_now_btn_bg_color || e.continue_now_btn_bg_color || '#000000',
    };

    if (existing.length === 0) {
      const keys = Object.keys(fields);
      await db.query(`INSERT INTO tictactoe_settings (game_id,${keys.join(',')}) VALUES (?,${
        keys.map(() => '?').join(',')})`, [req.params.gameId, ...Object.values(fields)]);
    } else {
      const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
      await db.query(`UPDATE tictactoe_settings SET ${sets} WHERE game_id=?`, [...Object.values(fields), req.params.gameId]);
    }

    if (redirect_url !== undefined) {
      await db.query('UPDATE games SET redirect_url = ? WHERE id = ?', [redirect_url || null, req.params.gameId]);
    }

    const [updated] = await db.query('SELECT * FROM tictactoe_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
