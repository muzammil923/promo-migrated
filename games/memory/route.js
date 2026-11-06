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
    const abs = path.join(__dirname, '..', urlPath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (e) {
    console.warn('Could not delete file:', urlPath, e.message);
  }
}

router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM memory_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/:gameId/settings', auth, upload.fields([
  { name: 'bg_image', maxCount: 1 },
  { name: 'thankyou_bg_image', maxCount: 1 },
  { name: 'game_logo', maxCount: 1 },
  { name: 'card_cover_image', maxCount: 1 },
  { name: 'overlay_image', maxCount: 1 },
  { name: 'submit_confirm_gif', maxCount: 1 },
]), async (req, res) => {
  const {
    grid_cols, grid_rows, card_shape,
    show_timer, time_limit_seconds,
    heading_1, heading_2, heading_3, description_text,
    heading_1_color, heading_2_color, heading_3_color, description_color,
    bg_color, primary_color,
    bg_image_url, thankyou_bg_image_url, game_logo_url,
    card_cover_image_url, overlay_image_url, submit_confirm_gif_url,
    font_family,
    sound_flip_id, sound_match_id, sound_nomatch_id, win_sound_id,
    overlay_animation_in, overlay_animation_out, overlay_idle_time, overlay_duration,
    intro_text, outro_text, submit_button_text, continue_button_text, start_button_text,
    terms_enabled, terms_text, terms_url, meta_description,
    redirect_url, redirect_delay, redirect_open_new_tab,
    start_button_text_color, start_button_bg_color,
    submit_button_text_color, submit_button_bg_color,
    continue_button_text_color, continue_button_bg_color,
    next_button_text, next_button_text_color, next_button_bg_color,
  } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM memory_settings WHERE game_id = ?', [req.params.gameId]);
    const e = existing[0] || {};

    const bgImg   = req.files?.bg_image           ? `/uploads/images/${req.files.bg_image[0].filename}`           : (bg_image_url           !== undefined ? bg_image_url           : (e.bg_image_url           || null));
    const tyImg   = req.files?.thankyou_bg_image  ? `/uploads/images/${req.files.thankyou_bg_image[0].filename}`  : (thankyou_bg_image_url  !== undefined ? thankyou_bg_image_url  : (e.thankyou_bg_image_url  || null));
    const logoImg = req.files?.game_logo          ? `/uploads/images/${req.files.game_logo[0].filename}`          : (game_logo_url          !== undefined ? game_logo_url          : (e.game_logo_url          || null));
    const coverImg = req.files?.card_cover_image  ? `/uploads/images/${req.files.card_cover_image[0].filename}`  : (card_cover_image_url   !== undefined ? card_cover_image_url   : (e.card_cover_image_url   || null));
    const ovImg   = req.files?.overlay_image      ? `/uploads/images/${req.files.overlay_image[0].filename}`      : (overlay_image_url      !== undefined ? overlay_image_url      : (e.overlay_image_url      || null));
    const gifImg  = req.files?.submit_confirm_gif ? `/uploads/images/${req.files.submit_confirm_gif[0].filename}` : (submit_confirm_gif_url !== undefined ? submit_confirm_gif_url : (e.submit_confirm_gif_url || null));

    const n = (v, fallback) => v !== undefined && v !== '' ? Number(v) : fallback;

    const fields = {
      grid_cols: n(grid_cols, e.grid_cols || 4),
      grid_rows: n(grid_rows, e.grid_rows || 4),
      card_shape: card_shape || e.card_shape || 'square',
      show_timer: n(show_timer, e.show_timer !== undefined ? e.show_timer : 1),
      time_limit_seconds: n(time_limit_seconds, e.time_limit_seconds || 0),
      heading_1: heading_1 !== undefined ? heading_1 : (e.heading_1 || null),
      heading_2: heading_2 !== undefined ? heading_2 : (e.heading_2 || null),
      heading_3: heading_3 !== undefined ? heading_3 : (e.heading_3 || null),
      description_text: description_text !== undefined ? description_text : (e.description_text || null),
      heading_1_color: heading_1_color || e.heading_1_color || '#1a1a2e',
      heading_2_color: heading_2_color || e.heading_2_color || '#666666',
      heading_3_color: heading_3_color || e.heading_3_color || '#777777',
      description_color: description_color || e.description_color || '#888888',
      bg_color: bg_color || e.bg_color || '#f8f8ff',
      primary_color: primary_color || e.primary_color || '#6366f1',
      bg_image_url: bgImg,
      thankyou_bg_image_url: tyImg,
      game_logo_url: logoImg,
      card_cover_image_url: coverImg,
      overlay_image_url: ovImg,
      submit_confirm_gif_url: gifImg,
      font_family: font_family || e.font_family || 'DM Sans',
      sound_flip_id: sound_flip_id !== undefined && sound_flip_id !== '' ? Number(sound_flip_id) : (e.sound_flip_id || null),
      sound_match_id: sound_match_id !== undefined && sound_match_id !== '' ? Number(sound_match_id) : (e.sound_match_id || null),
      sound_nomatch_id: sound_nomatch_id !== undefined && sound_nomatch_id !== '' ? Number(sound_nomatch_id) : (e.sound_nomatch_id || null),
      win_sound_id: win_sound_id !== undefined && win_sound_id !== '' ? Number(win_sound_id) : (e.win_sound_id || null),
      overlay_animation_in: overlay_animation_in || e.overlay_animation_in || 'flyFromBottom',
      overlay_animation_out: overlay_animation_out || e.overlay_animation_out || 'flyToTop',
      overlay_idle_time: n(overlay_idle_time, e.overlay_idle_time || 3),
      overlay_duration: n(overlay_duration, e.overlay_duration || 3),
      intro_text: intro_text !== undefined ? intro_text : (e.intro_text || null),
      outro_text: outro_text !== undefined ? outro_text : (e.outro_text || null),
      submit_button_text: submit_button_text !== undefined ? submit_button_text : (e.submit_button_text || null),
      continue_button_text: continue_button_text !== undefined ? continue_button_text : (e.continue_button_text || null),
      start_button_text: start_button_text !== undefined ? start_button_text : (e.start_button_text || null),
      terms_enabled: n(terms_enabled, e.terms_enabled || 0),
      terms_text: terms_text !== undefined ? terms_text : (e.terms_text || null),
      terms_url: terms_url !== undefined ? terms_url : (e.terms_url || null),
      meta_description: meta_description !== undefined ? meta_description : (e.meta_description || null),
      redirect_url: redirect_url !== undefined ? redirect_url : (e.redirect_url || null),
      redirect_delay: n(redirect_delay, e.redirect_delay || 3),
      redirect_open_new_tab: n(redirect_open_new_tab, e.redirect_open_new_tab || 0),
      start_button_text_color: start_button_text_color !== undefined ? start_button_text_color : (e.start_button_text_color || null),
      start_button_bg_color: start_button_bg_color !== undefined ? start_button_bg_color : (e.start_button_bg_color || null),
      submit_button_text_color: submit_button_text_color !== undefined ? submit_button_text_color : (e.submit_button_text_color || null),
      submit_button_bg_color: submit_button_bg_color !== undefined ? submit_button_bg_color : (e.submit_button_bg_color || null),
      continue_button_text_color: continue_button_text_color !== undefined ? continue_button_text_color : (e.continue_button_text_color || null),
      continue_button_bg_color: continue_button_bg_color !== undefined ? continue_button_bg_color : (e.continue_button_bg_color || null),
      next_button_text: next_button_text !== undefined ? next_button_text : (e.next_button_text || null),
      next_button_text_color: next_button_text_color !== undefined ? next_button_text_color : (e.next_button_text_color || null),
      next_button_bg_color: next_button_bg_color !== undefined ? next_button_bg_color : (e.next_button_bg_color || null),
    };

    if (existing.length === 0) {
      const keys = Object.keys(fields);
      const placeholders = keys.map(() => '?').join(',');
      await db.query(
        `INSERT INTO memory_settings (game_id,${keys.join(',')}) VALUES (?,${
          keys.map(() => '?').join(',')
        })`,
        [req.params.gameId, ...Object.values(fields)]
      );
    } else {
      const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
      await db.query(
        `UPDATE memory_settings SET ${sets} WHERE game_id=?`,
        [...Object.values(fields), req.params.gameId]
      );
    }

    if (redirect_url !== undefined) {
      await db.query('UPDATE games SET redirect_url = ? WHERE id = ?', [redirect_url || null, req.params.gameId]);
    }

    const [updated] = await db.query('SELECT * FROM memory_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/games/:gameId/tiles', auth, async (req, res) => {
  try {
    const [tiles] = await db.query('SELECT * FROM memory_tiles WHERE game_id = ? ORDER BY tile_order', [req.params.gameId]);
    res.json({ success: true, tiles });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/games/:gameId/tiles', auth, upload.single('image'), async (req, res) => {
  const { tile_label } = req.body;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image is required' });
    const imgUrl = `/uploads/images/${req.file.filename}`;
    const [maxOrder] = await db.query('SELECT MAX(tile_order) as m FROM memory_tiles WHERE game_id = ?', [req.params.gameId]);
    let nextOrder = (maxOrder[0]?.m || 0) + 1;

    // Create the first tile
    const [result1] = await db.query(
      'INSERT INTO memory_tiles (game_id, image_url, tile_label, pair_id, tile_order) VALUES (?, ?, ?, ?, ?)',
      [req.params.gameId, imgUrl, tile_label || null, null, nextOrder]
    );
    const tileId1 = result1.insertId;

    // Auto-create its pair (duplicate with same image)
    nextOrder++;
    const [result2] = await db.query(
      'INSERT INTO memory_tiles (game_id, image_url, tile_label, pair_id, tile_order) VALUES (?, ?, ?, ?, ?)',
      [req.params.gameId, imgUrl, tile_label || null, tileId1, nextOrder]
    );

    // Set pair_id on the first tile pointing to itself
    await db.query('UPDATE memory_tiles SET pair_id = ? WHERE id = ?', [tileId1, tileId1]);

    // Return all tiles for this game (so frontend can re-render the full grid)
    const [allTiles] = await db.query(
      'SELECT * FROM memory_tiles WHERE game_id = ? ORDER BY tile_order',
      [req.params.gameId]
    );
    res.status(201).json({ success: true, tiles: allTiles });
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/tiles/:id', auth, upload.single('image'), async (req, res) => {
  const { tile_label } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM memory_tiles WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Tile not found' });
    let imgUrl;
    if (req.file) {
      deleteUploadFile(existing[0].image_url);
      imgUrl = `/uploads/images/${req.file.filename}`;
    } else {
      imgUrl = existing[0].image_url;
    }
    await db.query('UPDATE memory_tiles SET image_url=?, tile_label=? WHERE id=?',
      [imgUrl, tile_label !== undefined ? tile_label : existing[0].tile_label, req.params.id]);
    const [updated] = await db.query('SELECT * FROM memory_tiles WHERE id = ?', [req.params.id]);
    res.json({ success: true, tile: updated[0] });
  } catch (err) {
    sendError(res, err);
  }
});

router.delete('/tiles/:id', auth, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM memory_tiles WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Tile not found' });
    const tile = existing[0];
    deleteUploadFile(tile.image_url);

    // Find and delete the paired tile too
    if (tile.pair_id != null) {
      const [partner] = await db.query(
        'SELECT * FROM memory_tiles WHERE game_id = ? AND id != ? AND pair_id = ?',
        [tile.game_id, tile.id, tile.pair_id]
      );
      // Also find partner by reverse pair_id (partner's pair_id points to this tile)
      const [partner2] = await db.query(
        'SELECT * FROM memory_tiles WHERE game_id = ? AND id != ? AND pair_id = ?',
        [tile.game_id, tile.id, tile.id]
      );
      const p = partner[0] || partner2[0];
      if (p) {
        deleteUploadFile(p.image_url);
        await db.query('DELETE FROM memory_tiles WHERE id = ?', [p.id]);
      }
    }
    // Also delete any tile whose pair_id points to this tile
    await db.query('DELETE FROM memory_tiles WHERE pair_id = ? AND id != ?', [tile.id, tile.id]);

    await db.query('DELETE FROM memory_tiles WHERE id = ?', [tile.id]);

    // Return all remaining tiles
    const [allTiles] = await db.query(
      'SELECT * FROM memory_tiles WHERE game_id = ? ORDER BY tile_order',
      [tile.game_id]
    );
    res.json({ success: true, message: 'Tile deleted', tiles: allTiles });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/games/:gameId/tiles/create-pairs', auth, async (req, res) => {
  try {
    const [allTiles] = await db.query(
      'SELECT * FROM memory_tiles WHERE game_id = ? ORDER BY tile_order',
      [req.params.gameId]
    );

    // Group tiles by image_url and by pairing status
    const byImage = {};
    for (const t of allTiles) {
      if (!byImage[t.image_url]) byImage[t.image_url] = [];
      byImage[t.image_url].push(t);
    }

    let pairsCreated = 0;

    // Phase 1: Pair up existing tiles that share the same image_url but have no pair_id
    for (const [imgUrl, group] of Object.entries(byImage)) {
      const unpaired = group.filter(t => t.pair_id == null);
      // Pair them up in twos
      for (let i = 0; i < unpaired.length - 1; i += 2) {
        const a = unpaired[i];
        const b = unpaired[i + 1];
        await db.query('UPDATE memory_tiles SET pair_id = ? WHERE id = ?', [a.id, a.id]);
        await db.query('UPDATE memory_tiles SET pair_id = ? WHERE id = ?', [a.id, b.id]);
        pairsCreated++;
      }
    }

    // Phase 2: For tiles with image_url that appears only once and no pair_id, create a duplicate
    const [freshTiles] = await db.query(
      'SELECT * FROM memory_tiles WHERE game_id = ? ORDER BY tile_order',
      [req.params.gameId]
    );

    const imgCounts = {};
    for (const t of freshTiles) {
      imgCounts[t.image_url] = (imgCounts[t.image_url] || 0) + 1;
    }

    const stillNeedPair = freshTiles.filter(t => t.pair_id == null && imgCounts[t.image_url] === 1);

    const [maxOrder] = await db.query('SELECT MAX(tile_order) as m FROM memory_tiles WHERE game_id = ?', [req.params.gameId]);
    let order = (maxOrder[0]?.m || 0) + 1;
    for (const tile of stillNeedPair) {
      await db.query(
        'INSERT INTO memory_tiles (game_id, image_url, tile_label, pair_id, tile_order) VALUES (?, ?, ?, ?, ?)',
        [req.params.gameId, tile.image_url, tile.tile_label, tile.id, order++]
      );
      await db.query('UPDATE memory_tiles SET pair_id = ? WHERE id = ?', [tile.id, tile.id]);
      pairsCreated++;
    }

    const [updatedTiles] = await db.query(
      'SELECT * FROM memory_tiles WHERE game_id = ? ORDER BY tile_order',
      [req.params.gameId]
    );
    res.json({ success: true, tiles: updatedTiles, pairsCreated });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/games/:gameId/tiles/jumble', auth, async (req, res) => {
  try {
    const [tiles] = await db.query('SELECT id FROM memory_tiles WHERE game_id = ?', [req.params.gameId]);
    const ids = tiles.map(t => t.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    for (let i = 0; i < ids.length; i++) {
      await db.query('UPDATE memory_tiles SET tile_order = ? WHERE id = ?', [i, ids[i]]);
    }
    const [allTiles] = await db.query('SELECT * FROM memory_tiles WHERE game_id = ? ORDER BY tile_order', [req.params.gameId]);
    res.json({ success: true, tiles: allTiles });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
