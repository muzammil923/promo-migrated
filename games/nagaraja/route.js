const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const upload = require('../../apps/backend/config/upload');
const { sendError } = require('../../apps/backend/lib/apiError');

router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM nagaraja_settings WHERE game_id = ?', [req.params.gameId]);
    let settings = rows[0] || null;
    if (settings && typeof settings.gifts_json === 'string') {
      try { settings.gifts_json = JSON.parse(settings.gifts_json); } catch (_) { settings.gifts_json = []; }
    }
    res.json({ success: true, settings });
  } catch (err) { sendError(res, err); }
});

router.put('/:gameId/settings', auth, upload.fields([
  { name: 'bg_image', maxCount: 1 }, { name: 'thankyou_bg_image', maxCount: 1 },
  { name: 'game_logo', maxCount: 1 }, { name: 'submit_confirm_gif', maxCount: 1 },
]), async (req, res) => {
  const {
    world_width, world_height, speed, snake_color, ai_snake_count, ai_speed,
    gift_count, gifts_json, boost_enabled, show_timer, time_limit_seconds,
    heading_1, heading_2, heading_3, description_text,
    heading_1_color, heading_2_color, heading_3_color, description_color,
    bg_color, primary_color, font_family,
    sound_eat_id, sound_gameover_id, intro_text, outro_text,
    submit_button_text, continue_button_text, start_button_text,
    reveal_text, terms_enabled, terms_text, terms_url, meta_description,
    bg_image_url, thankyou_bg_image_url, game_logo_url, submit_confirm_gif_url,
  } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM nagaraja_settings WHERE game_id = ?', [req.params.gameId]);
    const e = existing[0] || {};
    const bgImg = req.files?.bg_image ? `/uploads/images/${req.files.bg_image[0].filename}` : (bg_image_url !== undefined ? bg_image_url : (e.bg_image_url || null));
    const tyImg = req.files?.thankyou_bg_image ? `/uploads/images/${req.files.thankyou_bg_image[0].filename}` : (thankyou_bg_image_url !== undefined ? thankyou_bg_image_url : (e.thankyou_bg_image_url || null));
    const logoImg = req.files?.game_logo ? `/uploads/images/${req.files.game_logo[0].filename}` : (game_logo_url !== undefined ? game_logo_url : (e.game_logo_url || null));
    const gifImg = req.files?.submit_confirm_gif ? `/uploads/images/${req.files.submit_confirm_gif[0].filename}` : (submit_confirm_gif_url !== undefined ? submit_confirm_gif_url : (e.submit_confirm_gif_url || null));
    const n = (v, f) => v !== undefined && v !== '' ? Number(v) : f;

    // gifts_json can arrive as a JSON string (from builder) — store as string
    let gifts = gifts_json;
    if (gifts !== undefined && typeof gifts !== 'string') {
      gifts = JSON.stringify(gifts);
    }
    if (gifts === undefined) gifts = e.gifts_json || JSON.stringify([]);

    const fields = {
      world_width: n(world_width, e.world_width || 1600),
      world_height: n(world_height, e.world_height || 1200),
      speed: n(speed, e.speed || 5),
      snake_color: snake_color || e.snake_color || '#22c55e',
      ai_snake_count: n(ai_snake_count, e.ai_snake_count !== undefined ? e.ai_snake_count : 6),
      ai_speed: n(ai_speed, e.ai_speed !== undefined ? e.ai_speed : 3),
      gift_count: n(gift_count, e.gift_count !== undefined ? e.gift_count : 40),
      gifts_json: gifts,
      boost_enabled: n(boost_enabled, e.boost_enabled !== undefined ? e.boost_enabled : 1),
      heading_1: heading_1 !== undefined ? heading_1 : (e.heading_1 || null),
      heading_2: heading_2 !== undefined ? heading_2 : (e.heading_2 || null),
      heading_3: heading_3 !== undefined ? heading_3 : (e.heading_3 || null),
      description_text: description_text !== undefined ? description_text : (e.description_text || null),
      heading_1_color: heading_1_color || e.heading_1_color || '#1a1a2e',
      heading_2_color: heading_2_color || e.heading_2_color || '#666666',
      heading_3_color: heading_3_color || e.heading_3_color || '#777777',
      description_color: description_color || e.description_color || '#888888',
      bg_color: bg_color || e.bg_color || '#0d0a1a',
      primary_color: primary_color || e.primary_color || '#8b5cf6',
      bg_image_url: bgImg, thankyou_bg_image_url: tyImg, game_logo_url: logoImg, submit_confirm_gif_url: gifImg,
      font_family: font_family || e.font_family || 'DM Sans',
      sound_eat_id: sound_eat_id !== undefined && sound_eat_id !== '' ? Number(sound_eat_id) : (e.sound_eat_id || null),
      sound_gameover_id: sound_gameover_id !== undefined && sound_gameover_id !== '' ? Number(sound_gameover_id) : (e.sound_gameover_id || null),
      show_timer: n(show_timer, e.show_timer !== undefined ? e.show_timer : 0),
      time_limit_seconds: n(time_limit_seconds, e.time_limit_seconds || 0),
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
      await db.query(`INSERT INTO nagaraja_settings (game_id,${keys.join(',')}) VALUES (?,${
        keys.map(() => '?').join(',')})`, [req.params.gameId, ...Object.values(fields)]);
    } else {
      const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
      await db.query(`UPDATE nagaraja_settings SET ${sets} WHERE game_id=?`, [...Object.values(fields), req.params.gameId]);
    }
    const [updated] = await db.query('SELECT * FROM nagaraja_settings WHERE game_id = ?', [req.params.gameId]);
    let out = updated[0];
    if (out && typeof out.gifts_json === 'string') {
      try { out = { ...out, gifts_json: JSON.parse(out.gifts_json) }; } catch (_) {}
    }
    res.json({ success: true, settings: out });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
