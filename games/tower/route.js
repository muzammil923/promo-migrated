const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const upload = require('../../apps/backend/config/upload');
const { sendError } = require('../../apps/backend/lib/apiError');

router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tower_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/:gameId/settings', auth, upload.fields([
  { name: 'bg_image', maxCount: 1 },
  { name: 'thankyou_bg_image', maxCount: 1 },
  { name: 'game_logo', maxCount: 1 },
]), async (req, res) => {
  const {
    target_score,
    heading_1, heading_2,
    heading_1_color, heading_2_color,
    bg_color, primary_color, font_family,
    start_button_text, meta_description,
    bg_image_url, thankyou_bg_image_url, game_logo_url,
  } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM tower_settings WHERE game_id = ?', [req.params.gameId]);
    const e = existing[0] || {};

    const bgImg = req.files?.bg_image          ? `/uploads/images/${req.files.bg_image[0].filename}`          : (bg_image_url !== undefined ? bg_image_url : (e.bg_image_url || null));
    const tyImg = req.files?.thankyou_bg_image ? `/uploads/images/${req.files.thankyou_bg_image[0].filename}` : (thankyou_bg_image_url !== undefined ? thankyou_bg_image_url : (e.thankyou_bg_image_url || null));
    const logoImg = req.files?.game_logo       ? `/uploads/images/${req.files.game_logo[0].filename}`          : (game_logo_url !== undefined ? game_logo_url : (e.game_logo_url || null));

    const n = (v, fallback) => v !== undefined && v !== '' ? Number(v) : fallback;

    const fields = {
      target_score: n(target_score, e.target_score || 1000),
      heading_1: heading_1 !== undefined ? heading_1 : (e.heading_1 || null),
      heading_2: heading_2 !== undefined ? heading_2 : (e.heading_2 || null),
      heading_1_color: heading_1_color || e.heading_1_color || '#1a1a2e',
      heading_2_color: heading_2_color || e.heading_2_color || '#666666',
      bg_color: bg_color || e.bg_color || '#f95240',
      primary_color: primary_color || e.primary_color || '#ff735c',
      bg_image_url: bgImg,
      thankyou_bg_image_url: tyImg,
      game_logo_url: logoImg,
      font_family: font_family || e.font_family || 'DM Sans',
      start_button_text: start_button_text !== undefined ? start_button_text : (e.start_button_text || null),
      meta_description: meta_description !== undefined ? meta_description : (e.meta_description || null),
    };

    if (existing.length === 0) {
      const keys = Object.keys(fields);
      await db.query(
        `INSERT INTO tower_settings (game_id,${keys.join(',')}) VALUES (?,${
          keys.map(() => '?').join(',')
        })`,
        [req.params.gameId, ...Object.values(fields)]
      );
    } else {
      const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
      await db.query(
        `UPDATE tower_settings SET ${sets} WHERE game_id=?`,
        [...Object.values(fields), req.params.gameId]
      );
    }

    const [updated] = await db.query('SELECT * FROM tower_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
