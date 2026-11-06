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

// GET all space shooter games with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const [games] = await db.query(
      `SELECT g.*, c.company_name, c.slug as client_slug,
       (SELECT COUNT(*) FROM space_levels sl WHERE sl.game_id = g.id) as level_count,
       (SELECT COUNT(*) FROM player_sessions ps WHERE ps.game_id = g.id AND ps.completed = 1) as play_count
       FROM games g LEFT JOIN clients c ON g.client_id = c.id
       WHERE g.category = 'space'
       ORDER BY g.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM games WHERE category = "space"'
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

// GET single space shooter game with all data
router.get('/:gameSlug/:clientSlug', async (req, res) => {
  try {
    const [games] = await db.query(
      `SELECT g.*, c.company_name, c.slug as client_slug, c.logo_url as client_logo,
              c.contact_name, c.email, c.phone, c.address
       FROM games g JOIN clients c ON g.client_id = c.id
       WHERE g.slug = ? AND c.slug = ? AND g.category = 'space' AND g.is_active = 1`,
      [req.params.gameSlug, req.params.clientSlug]
    );
    
    if (games.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });
    
    const game = games[0];
    
    // Get space settings
    const [settings] = await db.query('SELECT * FROM space_settings WHERE game_id = ?', [game.id]);
    
    // Get all ships
    const [ships] = await db.query('SELECT * FROM space_ships WHERE game_id = ? ORDER BY is_default DESC, ship_name', [game.id]);
    
    // Get all weapons
    const [weapons] = await db.query('SELECT * FROM space_weapons WHERE game_id = ? ORDER BY cost', [game.id]);
    
    // Get all enemies
    const [enemies] = await db.query('SELECT * FROM space_enemies WHERE game_id = ? ORDER BY points_value DESC', [game.id]);
    
    // Get all levels with objects
    const [levels] = await db.query(
      'SELECT * FROM space_levels WHERE game_id = ? ORDER BY level_order', [game.id]
    );
    
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
        ships,
        weapons,
        enemies,
        levels,
        soundMap
      }
    });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// POST create new space shooter game
router.post('/', auth, upload.fields([
  { name: 'game_logo', maxCount: 1 },
  { name: 'bg_image', maxCount: 1 }
]), async (req, res) => {
  const { client_id, name, description, redirect_url, category = 'space' } = req.body;
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
    
    await db.query('INSERT INTO space_settings (game_id) VALUES (?)', [result.insertId]);
    
    // Add default ship
    await db.query(
      'INSERT INTO space_ships (game_id, ship_name, width, height, color, speed, laser_speed, laser_width, laser_damage, shield_points, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [result.insertId, 'Default Ship', 40, 40, '#3b82f6', 4, 6, 4, 1, 100]
    );
    
    // Add default weapons
    await db.query(
      'INSERT INTO space_weapons (game_id, weapon_name, laser_speed, laser_width, laser_damage, fire_rate, cost) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [result.insertId, 'Laser Beam', 6, 4, 1, 200]
    );
    
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

// PUT update space shooter game
router.put('/:id', auth, upload.fields([
  { name: 'game_logo', maxCount: 1 },
  { name: 'bg_image', maxCount: 1 }
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

// GET space settings for builder
router.get('/settings/:gameId', auth, async (req, res) => {
  try {
    const [game] = await db.query(
      `SELECT g.*, c.company_name, c.slug as client_slug
       FROM games g LEFT JOIN clients c ON g.client_id = c.id
       WHERE g.id = ? AND g.category = 'space'`,
      [req.params.gameId]
    );
    if (game.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });

    const [settings] = await db.query('SELECT * FROM space_settings WHERE game_id = ?', [req.params.gameId]);
    const [ships] = await db.query('SELECT * FROM space_ships WHERE game_id = ? ORDER BY is_default DESC, ship_name', [req.params.gameId]);
    const [weapons] = await db.query('SELECT * FROM space_weapons WHERE game_id = ? ORDER BY cost', [req.params.gameId]);
    const [enemies] = await db.query('SELECT * FROM space_enemies WHERE game_id = ? ORDER BY points_value DESC', [req.params.gameId]);
    const [levels] = await db.query('SELECT * FROM space_levels WHERE game_id = ? ORDER BY level_order', [req.params.gameId]);

    res.json({ success: true, game: game[0], settings: settings[0] || null, ships, weapons, enemies, levels });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});


// PUT update space settings
router.put('/settings/:gameId', auth, async (req, res) => {
  try {
    const {
      primary_color, secondary_color, accent_color, bg_color, bg_image_url,
      star_density, enemy_speed, player_speed, laser_speed,
      intro_text, intro_text_color, outro_text, outro_text_color,
      time_limit_seconds, show_timer,
      sound_laser_id, sound_explosion_id, sound_hit_id, sound_powerup_id
    } = req.body;
    
    const [existing] = await db.query('SELECT * FROM space_settings WHERE game_id = ?', [req.params.gameId]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Settings not found' });
    
    await db.query(
      `UPDATE space_settings SET
         primary_color = ?, secondary_color = ?, accent_color = ?, bg_color = ?, bg_image_url = ?,
         star_density = ?, enemy_speed = ?, player_speed = ?, laser_speed = ?,
         intro_text = ?, intro_text_color = ?, outro_text = ?, outro_text_color = ?,
         time_limit_seconds = ?, show_timer = ?,
         sound_laser_id = ?, sound_explosion_id = ?, sound_hit_id = ?, sound_powerup_id = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE game_id = ?`,
      [
        primary_color, secondary_color, accent_color, bg_color, bg_image_url,
        star_density, enemy_speed, player_speed, laser_speed,
        intro_text, intro_text_color, outro_text, outro_text_color,
        time_limit_seconds, show_timer ? 1 : 0,
        sound_laser_id, sound_explosion_id, sound_hit_id, sound_powerup_id,
        req.params.gameId
      ]
    );
    
    const [updated] = await db.query('SELECT * FROM space_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// POST create new ship
router.post('/ships', auth, async (req, res) => {
  try {
    const {
      game_id, ship_name, image_url, width, height, color,
      speed, laser_speed, laser_width, laser_damage, shield_points, is_default
    } = req.body;
    
    if (is_default) {
      await db.query('UPDATE space_ships SET is_default = 0 WHERE game_id = ?', [game_id]);
    }
    
    const [result] = await db.query(
      `INSERT INTO space_ships (game_id, ship_name, image_url, width, height, color, speed, laser_speed, laser_width, laser_damage, shield_points, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        game_id, ship_name, image_url, width, height, color,
        speed, laser_speed, laser_width, laser_damage, shield_points, is_default ? 1 : 0
      ]
    );
    
    res.status(201).json({ success: true, ship: { id: result.insertId, ...req.body } });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// PUT update ship
router.put('/ships/:id', auth, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM space_ships WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Ship not found' });
    
    const {
      ship_name, image_url, width, height, color,
      speed, laser_speed, laser_width, laser_damage, shield_points, is_default
    } = req.body;
    
    if (is_default) {
      await db.query('UPDATE space_ships SET is_default = 0 WHERE game_id = ?', [existing[0].game_id]);
    }
    
    await db.query(
      `UPDATE space_ships SET
         ship_name = ?, image_url = ?, width = ?, height = ?, color = ?,
         speed = ?, laser_speed = ?, laser_width = ?, laser_damage = ?, shield_points = ?,
         is_default = ?
       WHERE id = ?`,
      [
        ship_name, image_url, width, height, color,
        speed, laser_speed, laser_width, laser_damage, shield_points,
        is_default ? 1 : 0,
        req.params.id
      ]
    );
    
    const [updated] = await db.query('SELECT * FROM space_ships WHERE id = ?', [req.params.id]);
    res.json({ success: true, ship: updated[0] });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// DELETE ship
router.delete('/ships/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM space_ships WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Ship deleted' });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// POST create new weapon
router.post('/weapons', auth, async (req, res) => {
  try {
    const {
      game_id, weapon_name, image_url, laser_speed, laser_width,
      laser_damage, fire_rate, cost, description
    } = req.body;
    
    const [result] = await db.query(
      `INSERT INTO space_weapons (game_id, weapon_name, image_url, laser_speed, laser_width, laser_damage, fire_rate, cost, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        game_id, weapon_name, image_url, laser_speed, laser_width,
        laser_damage, fire_rate, cost, description
      ]
    );
    
    res.status(201).json({ success: true, weapon: { id: result.insertId, ...req.body } });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// PUT update weapon
router.put('/weapons/:id', auth, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM space_weapons WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Weapon not found' });
    
    const {
      weapon_name, image_url, laser_speed, laser_width,
      laser_damage, fire_rate, cost, description
    } = req.body;
    
    await db.query(
      `UPDATE space_weapons SET
         weapon_name = ?, image_url = ?, laser_speed = ?, laser_width = ?,
         laser_damage = ?, fire_rate = ?, cost = ?, description = ?
       WHERE id = ?`,
      [
        weapon_name, image_url, laser_speed, laser_width,
        laser_damage, fire_rate, cost, description,
        req.params.id
      ]
    );
    
    const [updated] = await db.query('SELECT * FROM space_weapons WHERE id = ?', [req.params.id]);
    res.json({ success: true, weapon: updated[0] });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// DELETE weapon
router.delete('/weapons/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM space_weapons WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Weapon deleted' });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// POST create new level
router.post('/levels', auth, async (req, res) => {
  try {
    const { game_id, level_order, level_name, width, height, bg_color, bg_image_url, time_limit_seconds, target_score, enemy_spawn_rate } = req.body;
    
    const [result] = await db.query(
      `INSERT INTO space_levels (game_id, level_order, level_name, width, height, bg_color, bg_image_url, time_limit_seconds, target_score, enemy_spawn_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [game_id, level_order, level_name, width, height, bg_color, bg_image_url, time_limit_seconds, target_score, enemy_spawn_rate]
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
    const { level_order, level_name, width, height, bg_color, bg_image_url, time_limit_seconds, target_score, enemy_spawn_rate } = req.body;
    
    await db.query(
      `UPDATE space_levels SET level_order = ?, level_name = ?, width = ?, height = ?, bg_color = ?, bg_image_url = ?, time_limit_seconds = ?, target_score = ?, enemy_spawn_rate = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [level_order, level_name, width, height, bg_color, bg_image_url, time_limit_seconds, target_score, enemy_spawn_rate, req.params.id]
    );
    
    const [updated] = await db.query('SELECT * FROM space_levels WHERE id = ?', [req.params.id]);
    res.json({ success: true, level: updated[0] });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// DELETE level
router.delete('/levels/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM space_levels WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Level deleted' });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

module.exports = router;