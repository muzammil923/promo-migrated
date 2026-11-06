const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const upload = require('../../apps/backend/config/upload');
const { sendError } = require('../../apps/backend/lib/apiError');

// GET settings
router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM arrowescape_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) { sendError(res, err); }
});

// PUT settings
router.put('/:gameId/settings', auth, upload.fields([
  { name: 'bg_image', maxCount: 1 }, { name: 'thankyou_bg_image', maxCount: 1 },
  { name: 'game_logo', maxCount: 1 }, { name: 'submit_confirm_gif', maxCount: 1 },
]), async (req, res) => {
  const { grid_rows, grid_cols, difficulty, heading_1, heading_2, heading_3, description_text,
    heading_1_color, heading_2_color, heading_3_color, description_color,
    bg_color, primary_color, font_family, show_timer, time_limit_seconds,
    sound_move_id, sound_win_id, sound_lose_id,
    intro_text, intro_text_color, outro_text, outro_text_color,
    submit_button_text, continue_button_text, start_button_text,
    terms_enabled, terms_text, terms_url, meta_description,
    bg_image_url, thankyou_bg_image_url, game_logo_url, submit_confirm_gif_url,
    thankyou_subtitle, thankyou_subtitle_color,
    submit_button_text_color, submit_button_bg_color,
    continue_button_text_color, continue_button_bg_color,
    start_button_text_color, start_button_bg_color } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM arrowescape_settings WHERE game_id = ?', [req.params.gameId]);
    const e = existing[0] || {};
    const n = (v, f) => v !== undefined && v !== '' ? Number(v) : f;
    const img = (field) => {
      if (req.files?.[field]) return `/uploads/images/${req.files[field][0].filename}`;
      const urlKey = field + '_url';
      return req.body[urlKey] !== undefined ? req.body[urlKey] : (e[urlKey] || null);
    };
    const fields = {
      grid_rows: n(grid_rows, e.grid_rows || 8), grid_cols: n(grid_cols, e.grid_cols || 8),
      difficulty: difficulty || e.difficulty || 'medium',
      heading_1: heading_1 !== undefined ? heading_1 : (e.heading_1 || null),
      heading_2: heading_2 !== undefined ? heading_2 : (e.heading_2 || null),
      heading_3: heading_3 !== undefined ? heading_3 : (e.heading_3 || null),
      description_text: description_text !== undefined ? description_text : (e.description_text || null),
      heading_1_color: heading_1_color || e.heading_1_color || '#1a1a2e',
      heading_2_color: heading_2_color || e.heading_2_color || '#666666',
      heading_3_color: heading_3_color || e.heading_3_color || '#777777',
      description_color: description_color || e.description_color || '#888888',
      bg_color: bg_color || e.bg_color || '#0f172a',
      primary_color: primary_color || e.primary_color || '#f59e0b',
      bg_image_url: img('bg_image'), thankyou_bg_image_url: img('thankyou_bg_image'),
      game_logo_url: img('game_logo'), submit_confirm_gif_url: img('submit_confirm_gif'),
      font_family: font_family || e.font_family || 'DM Sans',
      sound_move_id: n(sound_move_id, e.sound_move_id), sound_win_id: n(sound_win_id, e.sound_win_id),
      sound_lose_id: n(sound_lose_id, e.sound_lose_id),
      show_timer: n(show_timer, e.show_timer ?? 1), time_limit_seconds: n(time_limit_seconds, e.time_limit_seconds || 0),
      intro_text: intro_text !== undefined ? intro_text : (e.intro_text || null),
      intro_text_color: intro_text_color || e.intro_text_color || null,
      outro_text: outro_text !== undefined ? outro_text : (e.outro_text || null),
      outro_text_color: outro_text_color || e.outro_text_color || null,
      submit_button_text: submit_button_text !== undefined ? submit_button_text : (e.submit_button_text || null),
      continue_button_text: continue_button_text !== undefined ? continue_button_text : (e.continue_button_text || null),
      start_button_text: start_button_text !== undefined ? start_button_text : (e.start_button_text || null),
      terms_enabled: n(terms_enabled, e.terms_enabled || 0), terms_text: terms_text !== undefined ? terms_text : (e.terms_text || null),
      terms_url: terms_url !== undefined ? terms_url : (e.terms_url || null), meta_description: meta_description !== undefined ? meta_description : (e.meta_description || null),
      thankyou_subtitle: thankyou_subtitle !== undefined ? thankyou_subtitle : (e.thankyou_subtitle || null),
      thankyou_subtitle_color: thankyou_subtitle_color || e.thankyou_subtitle_color || null,
      submit_button_text_color: submit_button_text_color || e.submit_button_text_color || null,
      submit_button_bg_color: submit_button_bg_color || e.submit_button_bg_color || null,
      continue_button_text_color: continue_button_text_color || e.continue_button_text_color || null,
      continue_button_bg_color: continue_button_bg_color || e.continue_button_bg_color || null,
      start_button_text_color: start_button_text_color || e.start_button_text_color || null,
      start_button_bg_color: start_button_bg_color || e.start_button_bg_color || null,
    };
    if (existing.length === 0) {
      const keys = Object.keys(fields);
      await db.query(`INSERT INTO arrowescape_settings (game_id,${keys.join(',')}) VALUES (?,${
        keys.map(() => '?').join(',')})`, [req.params.gameId, ...Object.values(fields)]);
    } else {
      const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
      await db.query(`UPDATE arrowescape_settings SET ${sets} WHERE game_id=?`, [...Object.values(fields), req.params.gameId]);
    }
    const [updated] = await db.query('SELECT * FROM arrowescape_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) { sendError(res, err); }
});

// GET all levels for a game
router.get('/:gameId/levels', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM arrowescape_levels WHERE game_id = ? ORDER BY level_order ASC', [req.params.gameId]);
    res.json({ success: true, levels: rows });
  } catch (err) { sendError(res, err); }
});

// GET single level
router.get('/:gameId/levels/:levelId', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM arrowescape_levels WHERE id = ? AND game_id = ?', [req.params.levelId, req.params.gameId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Level not found' });
    res.json({ success: true, level: rows[0] });
  } catch (err) { sendError(res, err); }
});

// POST create level
router.post('/:gameId/levels', auth, async (req, res) => {
  try {
    const { level_name, grid_rows, grid_cols, walls, arrows, exits, obstacles, level_order } = req.body;
    const [maxOrder] = await db.query('SELECT MAX(level_order) as max_order FROM arrowescape_levels WHERE game_id = ?', [req.params.gameId]);
    const order = level_order !== undefined ? Number(level_order) : (maxOrder[0].max_order || 0) + 1;
    const [result] = await db.query(
      'INSERT INTO arrowescape_levels (game_id, level_name, level_order, grid_rows, grid_cols, walls, arrows, exits, obstacles) VALUES (?,?,?,?,?,?,?,?,?)',
      [req.params.gameId, level_name || 'Level ' + order, order, grid_rows || 8, grid_cols || 8,
       JSON.stringify(walls || []), JSON.stringify(arrows || []), JSON.stringify(exits || []), JSON.stringify(obstacles || [])]
    );
    const [newLevel] = await db.query('SELECT * FROM arrowescape_levels WHERE id = ?', [result.insertId]);
    res.json({ success: true, level: newLevel[0] });
  } catch (err) { sendError(res, err); }
});

// PUT update level
router.put('/:gameId/levels/:levelId', auth, async (req, res) => {
  try {
    const { level_name, grid_rows, grid_cols, walls, arrows, exits, obstacles, is_active, level_order } = req.body;
    const [existing] = await db.query('SELECT * FROM arrowescape_levels WHERE id = ? AND game_id = ?', [req.params.levelId, req.params.gameId]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Level not found' });
    const e = existing[0];
    await db.query(
      'UPDATE arrowescape_levels SET level_name=?, level_order=?, grid_rows=?, grid_cols=?, walls=?, arrows=?, exits=?, obstacles=?, is_active=? WHERE id=?',
      [level_name !== undefined ? level_name : e.level_name, level_order !== undefined ? level_order : e.level_order,
       grid_rows !== undefined ? grid_rows : e.grid_rows, grid_cols !== undefined ? grid_cols : e.grid_cols,
       walls !== undefined ? JSON.stringify(walls) : e.walls, arrows !== undefined ? JSON.stringify(arrows) : e.arrows,
       exits !== undefined ? JSON.stringify(exits) : e.exits, obstacles !== undefined ? JSON.stringify(obstacles) : e.obstacles,
       is_active !== undefined ? is_active : e.is_active, req.params.levelId]
    );
    const [updated] = await db.query('SELECT * FROM arrowescape_levels WHERE id = ?', [req.params.levelId]);
    res.json({ success: true, level: updated[0] });
  } catch (err) { sendError(res, err); }
});

// DELETE level
router.delete('/:gameId/levels/:levelId', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM arrowescape_levels WHERE id = ? AND game_id = ?', [req.params.levelId, req.params.gameId]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

// GET active levels for player (public)
router.get('/:gameId/play/levels', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM arrowescape_levels WHERE game_id = ? AND is_active = 1 ORDER BY level_order ASC', [req.params.gameId]);
    res.json({ success: true, levels: rows });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
