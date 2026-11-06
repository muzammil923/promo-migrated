const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const upload = require('../../apps/backend/config/upload');
const { sendError } = require('../../apps/backend/lib/apiError');
const path = require('path');
const fs = require('fs');

function deleteUploadFile(urlPath) {
  if (!urlPath) return;
  try {
    const abs = path.join(__dirname, '..', '..', urlPath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (e) {
    console.warn('Could not delete file:', urlPath, e.message);
  }
}

/* ─── SETTINGS ─── */

router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM spin_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) { sendError(res, err); }
});

router.put('/:gameId/settings', auth, upload.fields([
  { name: 'bg_image', maxCount: 1 },
  { name: 'thankyou_bg_image', maxCount: 1 },
  { name: 'game_logo', maxCount: 1 },
  { name: 'center_image', maxCount: 1 },
  { name: 'submit_confirm_gif', maxCount: 1 },
]), async (req, res) => {
  const {
    heading_1, heading_1_color, heading_2, heading_2_color, description_text, description_color, spin_mode,
    win_message, lose_message,
    wheel_bg_color, pointer_color, center_color, center_label,
    bg_color, primary_color, font_family,
    bg_image_url, thankyou_bg_image_url, game_logo_url,
    center_image_url, submit_confirm_gif_url,
    sound_spin_id, sound_win_id, sound_lose_id,
    redirect_url, redirect_delay, redirect_open_new_tab,
    continue_button_text, continue_button_text_color, continue_button_bg_color,
    meta_description,
    outro_text, outro_text_color,
    thankyou_subtitle, thankyou_subtitle_color,
    submit_button_text, submit_button_text_color, submit_button_bg_color,
    start_button_text, start_button_text_color, start_button_bg_color,
    terms_enabled, terms_text, terms_url,
  } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM spin_settings WHERE game_id = ?', [req.params.gameId]);
    const e = existing[0] || {};

    const bgImg     = req.files?.bg_image          ? `/uploads/images/${req.files.bg_image[0].filename}`          : (bg_image_url          !== undefined ? bg_image_url          : (e.bg_image_url          || null));
    const tyImg     = req.files?.thankyou_bg_image ? `/uploads/images/${req.files.thankyou_bg_image[0].filename}` : (thankyou_bg_image_url !== undefined ? thankyou_bg_image_url : (e.thankyou_bg_image_url || null));
    const logoImg   = req.files?.game_logo         ? `/uploads/images/${req.files.game_logo[0].filename}`         : (game_logo_url         !== undefined ? game_logo_url         : (e.game_logo_url         || null));
    const centerImg = req.files?.center_image      ? `/uploads/images/${req.files.center_image[0].filename}`      : (center_image_url      !== undefined ? center_image_url      : (e.center_image_url      || null));
    const gifImg    = req.files?.submit_confirm_gif ? `/uploads/images/${req.files.submit_confirm_gif[0].filename}` : (submit_confirm_gif_url !== undefined ? submit_confirm_gif_url : (e.submit_confirm_gif_url || null));

    const n = (v, f) => v !== undefined && v !== '' ? Number(v) : f;

    const fields = {
      heading_1:            heading_1            !== undefined ? heading_1            : (e.heading_1            || null),
      heading_1_color:      heading_1_color      !== undefined ? heading_1_color      : (e.heading_1_color      || '#1a1a2e'),
      heading_2:            heading_2            !== undefined ? heading_2            : (e.heading_2            || null),
      heading_2_color:      heading_2_color      !== undefined ? heading_2_color      : (e.heading_2_color      || '#1a1a2e'),
      description_text:     description_text     !== undefined ? description_text     : (e.description_text     || null),
      description_color:    description_color    !== undefined ? description_color    : (e.description_color    || '#666666'),
      spin_mode:            spin_mode            || e.spin_mode            || 'once',
      win_message:          win_message          !== undefined ? win_message          : (e.win_message          || null),
      lose_message:         lose_message         !== undefined ? lose_message         : (e.lose_message         || null),
      wheel_bg_color:       wheel_bg_color       || e.wheel_bg_color       || '#FFFFFF',
      pointer_color:        pointer_color        || e.pointer_color        || '#EF4444',
      center_color:         center_color         || e.center_color         || '#1F2937',
      center_label:         center_label         !== undefined ? center_label         : (e.center_label         || 'SPIN'),
      bg_color:             bg_color             || e.bg_color             || '#F8F8FF',
      primary_color:        primary_color        || e.primary_color        || '#7C6FF7',
      bg_image_url:         bgImg,
      thankyou_bg_image_url:tyImg,
      game_logo_url:        logoImg,
      center_image_url:     centerImg,
      submit_confirm_gif_url: gifImg,
      font_family:          font_family          || e.font_family          || 'DM Sans',
      sound_spin_id:        sound_spin_id        !== undefined ? (sound_spin_id  || null) : (e.sound_spin_id  || null),
      sound_win_id:         sound_win_id         !== undefined ? (sound_win_id   || null) : (e.sound_win_id   || null),
      sound_lose_id:        sound_lose_id        !== undefined ? (sound_lose_id  || null) : (e.sound_lose_id  || null),
      meta_description:     meta_description     !== undefined ? meta_description     : (e.meta_description     || null),
      outro_text:           outro_text           !== undefined ? outro_text           : (e.outro_text           || null),
      outro_text_color:     outro_text_color     !== undefined ? outro_text_color     : (e.outro_text_color     || '#1a1a2e'),
      thankyou_subtitle:    thankyou_subtitle    !== undefined ? thankyou_subtitle    : (e.thankyou_subtitle    || null),
      thankyou_subtitle_color: thankyou_subtitle_color !== undefined ? thankyou_subtitle_color : (e.thankyou_subtitle_color || '#444444'),
      submit_button_text:   submit_button_text   !== undefined ? submit_button_text   : (e.submit_button_text   || null),
      submit_button_text_color: submit_button_text_color !== undefined ? submit_button_text_color : (e.submit_button_text_color || '#ffffff'),
      submit_button_bg_color: submit_button_bg_color !== undefined ? submit_button_bg_color : (e.submit_button_bg_color || null),
      redirect_url:         redirect_url         !== undefined ? redirect_url         : (e.redirect_url         || null),
      redirect_delay:       redirect_delay       !== undefined && redirect_delay !== '' ? parseInt(redirect_delay) : (e.redirect_delay || null),
      redirect_open_new_tab: n(redirect_open_new_tab, e.redirect_open_new_tab || 0),
      continue_button_text: continue_button_text !== undefined ? continue_button_text : (e.continue_button_text || null),
      continue_button_text_color: continue_button_text_color !== undefined ? continue_button_text_color : (e.continue_button_text_color || '#ffffff'),
      continue_button_bg_color: continue_button_bg_color !== undefined ? continue_button_bg_color : (e.continue_button_bg_color || null),
      terms_enabled:        n(terms_enabled,      e.terms_enabled      || 0),
      terms_text:           terms_text           !== undefined ? terms_text           : (e.terms_text           || null),
      terms_url:            terms_url            !== undefined ? terms_url            : (e.terms_url            || null),
      start_button_text:    start_button_text    !== undefined ? start_button_text    : (e.start_button_text    || null),
      start_button_text_color: start_button_text_color !== undefined ? start_button_text_color : (e.start_button_text_color || '#ffffff'),
      start_button_bg_color: start_button_bg_color !== undefined ? start_button_bg_color : (e.start_button_bg_color || null),
    };

    if (existing.length === 0) {
      const keys = Object.keys(fields);
      await db.query(
        `INSERT INTO spin_settings (game_id,${keys.join(',')}) VALUES (?,${keys.map(() => '?').join(',')})`,
        [req.params.gameId, ...Object.values(fields)]
      );
    } else {
      const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
      await db.query(`UPDATE spin_settings SET ${sets} WHERE game_id=?`, [...Object.values(fields), req.params.gameId]);
    }

    if (redirect_url !== undefined) {
      await db.query('UPDATE games SET redirect_url = ? WHERE id = ?', [redirect_url || null, req.params.gameId]);
    }

    const [updated] = await db.query('SELECT * FROM spin_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) { sendError(res, err); }
});

/* ─── SEGMENTS ─── */

router.get('/games/:gameId/segments', auth, async (req, res) => {
  try {
    const [segments] = await db.query(
      'SELECT * FROM spin_segments WHERE game_id = ? ORDER BY segment_order',
      [req.params.gameId]
    );
    res.json({ success: true, segments });
  } catch (err) { sendError(res, err); }
});

router.post('/games/:gameId/segments', auth, upload.fields([
  { name: 'coupon_image', maxCount: 1 },
  { name: 'overlay_image', maxCount: 1 },
]), async (req, res) => {
  const { label, bg_color, text_color, weight, segment_type, prize_description, coupon_code, segment_order, sound_id } = req.body;
  try {
    const coupon_image_url  = req.files?.coupon_image  ? `/uploads/images/${req.files.coupon_image[0].filename}`  : null;
    const overlay_image_url = req.files?.overlay_image ? `/uploads/images/${req.files.overlay_image[0].filename}` : null;

    const [result] = await db.query(
      `INSERT INTO spin_segments (game_id,label,bg_color,text_color,weight,segment_type,prize_description,coupon_code,coupon_image_url,overlay_image_url,sound_id,segment_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.params.gameId, label || 'Segment', bg_color || '#7C6FF7', text_color || '#FFFFFF',
       weight || 100, segment_type || 'prize', prize_description || null, coupon_code || null,
       coupon_image_url, overlay_image_url, sound_id || null, segment_order || 0]
    );
    const [seg] = await db.query('SELECT * FROM spin_segments WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, segment: seg[0] });
  } catch (err) { sendError(res, err); }
});

router.put('/segments/:id', auth, upload.fields([
  { name: 'coupon_image', maxCount: 1 },
  { name: 'overlay_image', maxCount: 1 },
]), async (req, res) => {
  const { label, bg_color, text_color, weight, segment_type, prize_description, coupon_code,
          coupon_image_url, overlay_image_url, segment_order, sound_id } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM spin_segments WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Segment not found' });
    const e = existing[0];

    let couponImg, overlayImg;
    if (req.files?.coupon_image) {
      deleteUploadFile(e.coupon_image_url);
      couponImg = `/uploads/images/${req.files.coupon_image[0].filename}`;
    } else {
      couponImg = coupon_image_url !== undefined ? coupon_image_url : e.coupon_image_url;
    }
    if (req.files?.overlay_image) {
      deleteUploadFile(e.overlay_image_url);
      overlayImg = `/uploads/images/${req.files.overlay_image[0].filename}`;
    } else {
      overlayImg = overlay_image_url !== undefined ? overlay_image_url : e.overlay_image_url;
    }

    await db.query(
      `UPDATE spin_segments SET label=?,bg_color=?,text_color=?,weight=?,segment_type=?,
       prize_description=?,coupon_code=?,coupon_image_url=?,overlay_image_url=?,sound_id=?,segment_order=?
       WHERE id=?`,
      [label ?? e.label, bg_color || e.bg_color, text_color || e.text_color,
       weight !== undefined ? weight : e.weight, segment_type || e.segment_type,
       prize_description !== undefined ? prize_description : e.prize_description,
       coupon_code !== undefined ? coupon_code : e.coupon_code,
       couponImg, overlayImg, sound_id !== undefined ? (sound_id || null) : e.sound_id,
       segment_order !== undefined ? segment_order : e.segment_order,
       req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM spin_segments WHERE id = ?', [req.params.id]);
    res.json({ success: true, segment: updated[0] });
  } catch (err) { sendError(res, err); }
});

router.delete('/segments/:id', auth, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM spin_segments WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Segment not found' });
    deleteUploadFile(existing[0].coupon_image_url);
    deleteUploadFile(existing[0].overlay_image_url);
    await db.query('DELETE FROM spin_segments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Segment deleted' });
  } catch (err) { sendError(res, err); }
});

router.post('/games/:gameId/segments/reorder', auth, async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order) || order.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid order array' });
  }
  try {
    for (const item of order) {
      if (item.id && item.segment_order !== undefined) {
        await db.query('UPDATE spin_segments SET segment_order=? WHERE id=? AND game_id=?', [item.segment_order, item.id, req.params.gameId]);
      }
    }
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
