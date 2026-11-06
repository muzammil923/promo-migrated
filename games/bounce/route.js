const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const upload = require('../../apps/backend/config/upload');
const path = require('path');
const fs = require('fs');
const { sendError } = require('../../apps/backend/lib/apiError');

// Helper: delete a file stored as a /uploads/... URL from disk
function deleteUploadFile(urlPath) {
  if (!urlPath) return;
  try {
    const abs = path.join(__dirname, '..', '..', urlPath);
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
      console.log('🗑️  Deleted file:', urlPath);
    }
  } catch (e) {
    console.warn('⚠️  Could not delete file:', urlPath, e.message);
  }
}

// GET all bounce games with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const [games] = await db.query(
      `SELECT g.*, c.company_name, c.slug as client_slug,
       (SELECT COUNT(*) FROM bounce_levels bl WHERE bl.game_id = g.id) as level_count,
       (SELECT COUNT(*) FROM player_sessions ps WHERE ps.game_id = g.id AND ps.completed = 1) as play_count
       FROM games g LEFT JOIN clients c ON g.client_id = c.id
       WHERE g.category = 'bounce'
       ORDER BY g.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM games WHERE category = "bounce"'
    );
    
    res.json({
      success: true,
      games,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// GET single bounce game with all data
router.get('/:gameSlug/:clientSlug', async (req, res) => {
  try {
    const [games] = await db.query(
      `SELECT g.*, c.company_name, c.slug as client_slug, c.logo_url as client_logo,
              c.contact_name, c.email, c.phone, c.address
       FROM games g JOIN clients c ON g.client_id = c.id
       WHERE g.slug = ? AND c.slug = ? AND g.category = 'bounce' AND g.is_active = 1`,
      [req.params.gameSlug, req.params.clientSlug]
    );
    
    if (games.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });
    
    const game = games[0];
    
    // Get bounce settings
    const [settings] = await db.query('SELECT * FROM bounce_settings WHERE game_id = ?', [game.id]);
    
    // Get all levels with objects
    const [levels] = await db.query(
      'SELECT * FROM bounce_levels WHERE game_id = ? ORDER BY level_order', [game.id]
    );
    
    // Get objects for each level
    for (const level of levels) {
      const [objects] = await db.query(
        'SELECT * FROM bounce_objects WHERE level_id = ? ORDER BY object_order', [level.id]
      );
      level.objects = objects;
    }
    
    // Get sounds
    const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ? ORDER BY created_at DESC', [game.id]);
    const soundMap = {};
    for (const s of sounds) {
      soundMap[s.id] = s.file_url;
    }
    
    res.json({
      success: true,
      game: {
        ...game,
        settings: settings[0] || {},
        levels,
        soundMap
      }
    });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// POST create new bounce game
router.post('/', auth, upload.fields([
  { name: 'game_logo', maxCount: 1 },
  { name: 'bg_image', maxCount: 1 },
  { name: 'ball_image', maxCount: 1 }
]), async (req, res) => {
  const { client_id, name, description, redirect_url, category = 'bounce' } = req.body;
  if (!client_id || !name) return res.status(400).json({ success: false, message: 'Client and game name required' });
  
  try {
    const [client] = await db.query('SELECT slug FROM clients WHERE id = ?', [client_id]);
    if (client.length === 0) return res.status(404).json({ success: false, message: 'Client not found' });
    
    const slug = name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
    
    const [existing] = await db.query('SELECT id FROM games WHERE slug = ? AND client_id = ?', [slug, client_id]);
    const finalSlug = existing.length > 0 ? `${slug}-${Date.now()}` : slug;
    
    const img_url = req.files?.game_logo ? `/uploads/images/${req.files.game_logo[0].filename}` : null;
    
    const [result] = await db.query(
      `INSERT INTO games (client_id, name, slug, category, description, redirect_url, game_logo_url, created_by, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [client_id, name, finalSlug, category, description, redirect_url, img_url, req.user.id]
    );
    
    await db.query('INSERT INTO bounce_settings (game_id) VALUES (?)', [result.insertId]);
    
    const [newGame] = await db.query(
      `SELECT g.*, c.company_name, c.slug as client_slug FROM games g LEFT JOIN clients c ON g.client_id = c.id WHERE g.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({ success: true, game: newGame[0] });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// PUT update bounce game
router.put('/:id', auth, upload.fields([
  { name: 'game_logo', maxCount: 1 },
  { name: 'bg_image', maxCount: 1 },
  { name: 'ball_image', maxCount: 1 }
]), async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM games WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });
    
    // Delete old logo if new one uploaded
    let game_logo_url = existing[0].game_logo_url;
    if (req.files?.game_logo) {
      deleteUploadFile(existing[0].game_logo_url);
      game_logo_url = `/uploads/images/${req.files.game_logo[0].filename}`;
    }
    
    const allowed = ['name', 'slug', 'description', 'redirect_url', 'is_active', 'game_type'];
    const fields = [];
    const values = [];
    
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key}=?`);
        values.push(req.body[key]);
      }
    }
    
    if (fields.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
    
    values.push(req.params.id);
    await db.query(`UPDATE games SET ${fields.join(', ')} WHERE id = ?`, values);
    
    const [updated] = await db.query('SELECT * FROM games WHERE id = ?', [req.params.id]);
    res.json({ success: true, game: updated[0] });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// GET bounce settings for builder
router.get('/settings/:gameId', auth, async (req, res) => {
  try {
    const [game] = await db.query(
      `SELECT g.*, c.company_name, c.slug as client_slug
       FROM games g LEFT JOIN clients c ON g.client_id = c.id
       WHERE g.id = ? AND g.category = 'bounce'`,
      [req.params.gameId]
    );
    if (game.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });

    const [settings] = await db.query('SELECT * FROM bounce_settings WHERE game_id = ?', [req.params.gameId]);
    const [levels] = await db.query('SELECT * FROM bounce_levels WHERE game_id = ? ORDER BY level_order', [req.params.gameId]);
    for (const level of levels) {
      const [objects] = await db.query('SELECT * FROM bounce_objects WHERE level_id = ? ORDER BY object_order', [level.id]);
      level.objects = objects;
    }

    res.json({ success: true, game: game[0], settings: settings[0] || null, levels });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});


// PUT update bounce settings
router.put('/settings/:gameId', auth, async (req, res) => {
  try {
    const {
      primary_color, bg_color, bg_image_url, ball_image_url, ball_color,
      ball_size, gravity, jump_force, friction, max_speed,
      intro_text, intro_text_color, outro_text, outro_text_color,
      time_limit_seconds, show_timer,
      sound_jump_id, sound_coin_id, sound_hit_id, sound_win_id, sound_lose_id
    } = req.body;
    
    const [existing] = await db.query('SELECT * FROM bounce_settings WHERE game_id = ?', [req.params.gameId]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Settings not found' });
    
    await db.query(
      `UPDATE bounce_settings SET
         primary_color = ?, bg_color = ?, bg_image_url = ?, ball_image_url = ?, ball_color = ?,
         ball_size = ?, gravity = ?, jump_force = ?, friction = ?, max_speed = ?,
         intro_text = ?, intro_text_color = ?, outro_text = ?, outro_text_color = ?,
         time_limit_seconds = ?, show_timer = ?,
         sound_jump_id = ?, sound_coin_id = ?, sound_hit_id = ?, sound_win_id = ?, sound_lose_id = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE game_id = ?`,
      [
        primary_color, bg_color, bg_image_url, ball_image_url, ball_color,
        ball_size, gravity, jump_force, friction, max_speed,
        intro_text, intro_text_color, outro_text, outro_text_color,
        time_limit_seconds, show_timer ? 1 : 0,
        sound_jump_id, sound_coin_id, sound_hit_id, sound_win_id, sound_lose_id,
        req.params.gameId
      ]
    );
    
    const [updated] = await db.query('SELECT * FROM bounce_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// POST create new level
router.post('/levels', auth, async (req, res) => {
  try {
    const { game_id, level_order, level_name, width, height, bg_color, bg_image_url, parallax_bg_url, time_limit_seconds, target_score } = req.body;
    
    const [result] = await db.query(
      `INSERT INTO bounce_levels (game_id, level_order, level_name, width, height, bg_color, bg_image_url, parallax_bg_url, time_limit_seconds, target_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [game_id, level_order, level_name, width, height, bg_color, bg_image_url, parallax_bg_url, time_limit_seconds, target_score]
    );
    
    res.status(201).json({ success: true, level: { id: result.insertId, ...req.body } });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// PUT update level
router.put('/levels/:id', auth, async (req, res) => {
  try {
    const { level_order, level_name, width, height, bg_color, bg_image_url, parallax_bg_url, time_limit_seconds, target_score } = req.body;
    
    await db.query(
      `UPDATE bounce_levels SET level_order = ?, level_name = ?, width = ?, height = ?, bg_color = ?, bg_image_url = ?, parallax_bg_url = ?, time_limit_seconds = ?, target_score = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [level_order, level_name, width, height, bg_color, bg_image_url, parallax_bg_url, time_limit_seconds, target_score, req.params.id]
    );
    
    const [updated] = await db.query('SELECT * FROM bounce_levels WHERE id = ?', [req.params.id]);
    res.json({ success: true, level: updated[0] });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// DELETE level
router.delete('/levels/:id', auth, async (req, res) => {
  try {
    // Delete objects first
    await db.query('DELETE FROM bounce_objects WHERE level_id = ?', [req.params.id]);
    
    // Delete level
    await db.query('DELETE FROM bounce_levels WHERE id = ?', [req.params.id]);
    
    res.json({ success: true, message: 'Level deleted' });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// POST create new object
router.post('/objects', auth, upload.fields([
  { name: 'object_image', maxCount: 1 }
]), async (req, res) => {
  try {
    const img_url = req.files?.object_image ? `/uploads/images/${req.files.object_image[0].filename}` : null;
    
    const {
      level_id, type, x, y, width, height, color,
      move_type, move_distance, move_speed, move_start_offset,
      spring_force, coin_value, goal_text, z_index, object_order
    } = req.body;
    
    const [result] = await db.query(
      `INSERT INTO bounce_objects (level_id, type, x, y, width, height, color, image_url,
                                   move_type, move_distance, move_speed, move_start_offset,
                                   spring_force, coin_value, goal_text, z_index, object_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        level_id, type, x, y, width, height, color, img_url,
        move_type, move_distance, move_speed, move_start_offset,
        spring_force, coin_value, goal_text, z_index, object_order
      ]
    );
    
    res.status(201).json({ success: true, object: { id: result.insertId, ...req.body, image_url: img_url } });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// PUT update object
router.put('/objects/:id', auth, upload.fields([
  { name: 'object_image', maxCount: 1 }
]), async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM bounce_objects WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Object not found' });
    
    // Delete old image if new one uploaded
    let image_url = existing[0].image_url;
    if (req.files?.object_image) {
      deleteUploadFile(existing[0].image_url);
      image_url = `/uploads/images/${req.files.object_image[0].filename}`;
    }
    
    const {
      level_id, type, x, y, width, height, color,
      move_type, move_distance, move_speed, move_start_offset,
      spring_force, coin_value, goal_text, z_index, object_order
    } = req.body;
    
    await db.query(
      `UPDATE bounce_objects SET
         level_id = ?, type = ?, x = ?, y = ?, width = ?, height = ?, color = ?, image_url = ?,
         move_type = ?, move_distance = ?, move_speed = ?, move_start_offset = ?,
         spring_force = ?, coin_value = ?, goal_text = ?, z_index = ?, object_order = ?
       WHERE id = ?`,
      [
        level_id, type, x, y, width, height, color, image_url,
        move_type, move_distance, move_speed, move_start_offset,
        spring_force, coin_value, goal_text, z_index, object_order,
        req.params.id
      ]
    );
    
    const [updated] = await db.query('SELECT * FROM bounce_objects WHERE id = ?', [req.params.id]);
    res.json({ success: true, object: updated[0] });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// DELETE object
router.delete('/objects/:id', auth, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM bounce_objects WHERE id = ?', [req.params.id]);
    if (existing[0]) {
      deleteUploadFile(existing[0].image_url);
    }
    
    await db.query('DELETE FROM bounce_objects WHERE id = ?', [req.params.id]);
    
    res.json({ success: true, message: 'Object deleted' });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// POST reorder objects
router.post('/objects/reorder', auth, async (req, res) => {
  const { level_id, objects } = req.body;
  
  try {
    for (const obj of objects) {
      await db.query('UPDATE bounce_objects SET object_order = ? WHERE id = ?', [obj.object_order, obj.id]);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

module.exports = router;
