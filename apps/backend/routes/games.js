const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../config/upload');
const path = require('path');
const fs = require('fs');
const { sendError } = require('../lib/apiError');

// Helper: delete a file stored as a /uploads/... URL from disk
function deleteUploadFile(urlPath) {
  if (!urlPath) return;
  try {
    const abs = path.join(__dirname, '..', urlPath);
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
      console.log('🗑️  Deleted file:', urlPath);
    }
  } catch (e) {
    console.warn('⚠️  Could not delete file:', urlPath, e.message);
  }
}


function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-')
    .replace(/^-+/, '').replace(/-+$/, '');
}

router.get('/', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT g.*, c.company_name, c.slug as client_slug,
      u.name as updated_by_name,
      bo.business_name as branch_name, bo.pincode as branch_pincode,
      (SELECT COUNT(*) FROM questions q WHERE q.game_id = g.id) as question_count,
      (SELECT COUNT(*) FROM player_sessions ps WHERE ps.game_id = g.id AND ps.completed = 1) as play_count
      FROM games g LEFT JOIN clients c ON g.client_id = c.id
      LEFT JOIN users u ON g.updated_by = u.id
      LEFT JOIN business_owners bo ON g.business_owner_id = bo.id
      ORDER BY g.created_at DESC
    `);
    res.json({ success: true, games: rows });
  } catch (err) { console.error(err); sendError(res, err); }
});

router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const [games] = await db.query(`SELECT g.*, c.company_name, c.slug as client_slug FROM games g LEFT JOIN clients c ON g.client_id = c.id WHERE g.id = ?`, [req.params.id]);
    if (games.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });
    const game = games[0];
    const [settings] = await db.query('SELECT * FROM quiz_settings WHERE game_id = ? ORDER BY id DESC LIMIT 1', [game.id]);
    const [emailTemplate] = await db.query('SELECT * FROM email_templates WHERE game_id = ?', [game.id]);
    const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
    const [questions] = await db.query('SELECT * FROM questions WHERE game_id = ? ORDER BY question_order', [game.id]);
    const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ? ORDER BY created_at DESC', [game.id]);
    for (let q of questions) {
      const [options] = await db.query('SELECT * FROM options WHERE question_id = ? ORDER BY option_order', [q.id]);
      q.options = options;
    }
    res.json({ success: true, game: { ...game, settings: settings[0] || null, emailTemplate: emailTemplate[0] || null, formFields, questions, sounds } });
  } catch (err) { console.error(err); sendError(res, err); }
});

router.post('/', requireAdmin, async (req, res) => {
  const { client_id, name, category, description, redirect_url } = req.body;
  if (!client_id || !name) return res.status(400).json({ success: false, message: 'Client and game name required' });
  try {
    const [client] = await db.query('SELECT slug FROM clients WHERE id = ?', [client_id]);
    if (client.length === 0) return res.status(404).json({ success: false, message: 'Client not found' });
    let slug = slugify(name);
    const [existing] = await db.query('SELECT id FROM games WHERE slug = ? AND client_id = ?', [slug, client_id]);
    if (existing.length > 0) slug = `${slug}-${Date.now()}`;
    const [result] = await db.query(
      `INSERT INTO games (client_id, name, slug, category, description, redirect_url, game_logo_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [client_id, name, slug, category || 'quiz', description, redirect_url, null, req.user.id]
    );
    await db.query('INSERT INTO quiz_settings (game_id) VALUES (?)', [result.insertId]);
    const defaultFields = [['Full Name', 'text', 1, 0], ['Email Address', 'email', 1, 1], ['Phone Number', 'phone', 0, 2]];
    for (const [label, type, required, order] of defaultFields) {
      await db.query('INSERT INTO form_fields (game_id, field_label, field_type, is_required, field_order) VALUES (?, ?, ?, ?, ?)', [result.insertId, label, type, required, order]);
    }
    const [newGame] = await db.query('SELECT g.*, c.company_name, c.slug as client_slug FROM games g LEFT JOIN clients c ON g.client_id = c.id WHERE g.id = ?', [result.insertId]);
    res.status(201).json({ success: true, game: newGame[0] });
  } catch (err) { console.error(err); sendError(res, err); }
});

router.put('/:id', requireAdmin, upload.single('intro_video'), async (req, res) => {
  try {
    const allowed = ['name','slug','description','redirect_url','is_active','category','show_in_play_page','show_in_hero_page','force_login','meta_description','game_type','status','template_id','intro_video_url','thumbnail_url'];
    const booleans = ['is_active','show_in_play_page','show_in_hero_page','force_login'];
    const fields = []; const values = [];
    for (const key of allowed) {
      if (req.body[key] === undefined) continue;
      if (key === 'intro_video_url') continue; // handled below (file takes precedence)
      if (key === 'template_id') {
        const tv = req.body[key];
        if (tv === '' || tv === 'null' || tv === null || tv === undefined) { fields.push('template_id=?'); values.push(null); }
        else { fields.push('template_id=?'); values.push(parseInt(tv) || null); }
        continue;
      }
      fields.push(`${key}=?`);
      values.push(booleans.includes(key) ? (req.body[key] ? 1 : 0) : req.body[key]);
    }
    if (req.file) {
      const url = `/uploads/images/${req.file.filename}`;
      fields.push('intro_video_url=?'); values.push(url);
    } else if (req.body.intro_video_url !== undefined) {
      fields.push('intro_video_url=?'); values.push(req.body.intro_video_url ? req.body.intro_video_url : null);
    }
    fields.push('updated_by=?');
    values.push(req.user.id);
    if (fields.length <= 1) return res.json({ success: true, message: 'Nothing to update' });
    values.push(req.params.id);
    await db.query(`UPDATE games SET ${fields.join(', ')} WHERE id=?`, values);
    res.json({ success: true, message: 'Game updated' });
  } catch (err) { console.error(err); sendError(res, err); }
});

// PUT /api/games/:id/thumbnail — upload or replace a game thumbnail
router.put('/:id/thumbnail', requireAdmin, upload.single('thumbnail'), async (req, res) => {
  try {
    const [games] = await db.query('SELECT id, thumbnail_url FROM games WHERE id = ?', [req.params.id]);
    if (games.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No thumbnail file provided' });

    const url = `/uploads/images/${req.file.filename}`;
    deleteUploadFile(games[0].thumbnail_url);
    await db.query('UPDATE games SET thumbnail_url = ?, updated_by = ? WHERE id = ?', [url, req.user.id, req.params.id]);
    res.json({ success: true, thumbnail_url: url, message: 'Thumbnail saved' });
  } catch (err) { console.error(err); sendError(res, err); }
});

// DELETE /api/games/:id/thumbnail — remove the game thumbnail
router.delete('/:id/thumbnail', requireAdmin, async (req, res) => {
  try {
    const [games] = await db.query('SELECT id, thumbnail_url FROM games WHERE id = ?', [req.params.id]);
    if (games.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });
    deleteUploadFile(games[0].thumbnail_url);
    await db.query('UPDATE games SET thumbnail_url = NULL, updated_by = ? WHERE id = ?', [req.user.id, req.params.id]);
    res.json({ success: true, message: 'Thumbnail removed' });
  } catch (err) { console.error(err); sendError(res, err); }
});

// GET /api/games/:id/locations — list child location games
router.get('/:id/locations', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT g.id, g.name, g.slug, g.location_name, g.business_owner_id, g.is_active,
              (SELECT COUNT(*) FROM questions q WHERE q.game_id = g.id) as question_count
       FROM games g WHERE g.parent_game_id = ? ORDER BY g.created_at`,
      [req.params.id]
    );
    res.json({ success: true, locations: rows });
  } catch (err) { sendError(res, err); }
});

// DELETE /api/games/:id/locations/:childId — delete a location game
router.delete('/:id/locations/:childId', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM games WHERE id = ? AND parent_game_id = ?', [req.params.childId, req.params.id]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

// POST /api/games/:id/duplicate — clone a game with all settings, questions, options, form fields
router.post('/:id/duplicate', requireAdmin, async (req, res) => {
  try {
    const gameId = req.params.id;
    const [games] = await db.query('SELECT * FROM games WHERE id = ?', [gameId]);
    if (games.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });
    const src = games[0];

    let newName = src.name;
    const { location_name, business_owner_id, client_id } = req.body || {};

    // Target client: duplicate can be assigned to any client (admin chooses). Falls back to the source game's client.
    const targetClientId = client_id || src.client_id;

    if (location_name) {
      // Location instances keep the original game name
      newName = src.name;
    } else {
      const copyMatch = src.name.match(/\(Copy(?: (\d+))?\)$/);
      if (copyMatch) {
        const n = parseInt(copyMatch[1] || '1');
        newName = src.name.replace(/\(Copy(?:\s?\d+)?\)$/, `(Copy ${n + 1})`);
      } else {
        newName = `${src.name} (Copy)`;
      }
    }

    let slug = slugify(newName);
    const [existing] = await db.query('SELECT id FROM games WHERE slug = ? AND client_id = ?', [slug, targetClientId]);
    if (existing.length > 0) slug = `${slug}-${Date.now()}`;

    // Prevent duplicate location instances for the same branch + template
    if (business_owner_id) {
      const [dup] = await db.query(
        'SELECT id FROM games WHERE parent_game_id = ? AND business_owner_id = ?',
        [gameId, business_owner_id]
      );
      if (dup.length > 0) {
        return res.status(409).json({ success: false, message: 'This branch already has a location instance for this game', existingGameId: dup[0].id });
      }
    }

    const [result] = await db.query(
      `INSERT INTO games (client_id, name, slug, category, description, redirect_url, is_active, show_in_play_page, show_in_hero_page, meta_description, game_type, created_by, updated_by, parent_game_id, location_name, business_owner_id)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?, ?, ?, ?)`,
       [targetClientId, newName, slug, src.category, src.description, src.redirect_url, src.meta_description, src.game_type || 'promogames', req.user.id, req.user.id, location_name ? gameId : null, location_name || null, business_owner_id || null]
    );
    const newId = result.insertId;

    // Clone quiz_settings
    const [settings] = await db.query('SELECT * FROM quiz_settings WHERE game_id = ? ORDER BY id DESC LIMIT 1', [gameId]);
    if (settings[0]) {
      const s = settings[0];
      await db.query(
        `INSERT INTO quiz_settings (game_id, bg_color, primary_color, show_progress, allow_back, time_per_question, heading_1, heading_2, intro_text, outro_text, bg_image_url, thankyou_bg_image_url, game_logo_url, font_family, submit_confirm_gif_url, terms_enabled, terms_text, terms_url, send_email, heading_1_color, heading_2_color, intro_text_color, thankyou_subtitle, outro_text_color, thankyou_subtitle_color, start_button_text, start_button_text_color, start_button_bg_color, submit_button_text, submit_button_text_color, submit_button_bg_color, continue_button_text, continue_button_text_color, continue_button_bg_color, next_button_text, next_button_text_color, next_button_bg_color, randomize_questions, questions_per_session)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, s.bg_color, s.primary_color, s.show_progress, s.allow_back, s.time_per_question, s.heading_1, s.heading_2, s.intro_text, s.outro_text, s.bg_image_url, s.thankyou_bg_image_url, s.game_logo_url, s.font_family, s.submit_confirm_gif_url, s.terms_enabled, s.terms_text, s.terms_url, s.send_email, s.heading_1_color, s.heading_2_color, s.intro_text_color, s.thankyou_subtitle, s.outro_text_color, s.thankyou_subtitle_color, s.start_button_text, s.start_button_text_color, s.start_button_bg_color, s.submit_button_text, s.submit_button_text_color, s.submit_button_bg_color, s.continue_button_text, s.continue_button_text_color, s.continue_button_bg_color, s.next_button_text, s.next_button_text_color, s.next_button_bg_color, s.randomize_questions, s.questions_per_session || 0]
      );
    } else {
      await db.query('INSERT INTO quiz_settings (game_id) VALUES (?)', [newId]);
    }

    // Clone email_template
    const [emailTemplates] = await db.query('SELECT * FROM email_templates WHERE game_id = ?', [gameId]);
    if (emailTemplates[0]) {
      const t = emailTemplates[0];
      await db.query(
        `INSERT INTO email_templates (game_id, sender_name, sender_email, subject, header_color, header_text, body_html, footer_text, is_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, t.sender_name, t.sender_email, t.subject, t.header_color, t.header_text, t.body_html, t.footer_text, t.is_enabled]
      );
    }

    // Clone form_fields
    const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [gameId]);
    for (const f of formFields) {
      await db.query(
        'INSERT INTO form_fields (game_id, field_label, field_type, field_options, is_required, field_order) VALUES (?, ?, ?, ?, ?, ?)',
        [newId, f.field_label, f.field_type, JSON.stringify(f.field_options || []), f.is_required, f.field_order]
      );
    }

    // Clone questions + options
    const [questions] = await db.query('SELECT * FROM questions WHERE game_id = ? ORDER BY question_order', [gameId]);
    for (const q of questions) {
      const [qr] = await db.query(
        `INSERT INTO questions (game_id, question_text, question_image_url, question_bg_image_url, question_type, question_color, question_order, num_options, sound_correct, sound_wrong, sound_neutral, sound_correct_id, sound_wrong_id, sound_neutral_id, overlay_duration, overlay_idle_time, overlay_animation_in, overlay_animation_out, question_image_animation, expected_answer, comparison_type, answer_text, answer_is_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, q.question_text, q.question_image_url, q.question_bg_image_url, q.question_type, q.question_color, q.question_order, q.num_options, q.sound_correct, q.sound_wrong, q.sound_neutral, q.sound_correct_id, q.sound_wrong_id, q.sound_neutral_id, q.overlay_duration, q.overlay_idle_time, q.overlay_animation_in, q.overlay_animation_out, q.question_image_animation, q.expected_answer, q.comparison_type, q.answer_text, q.answer_is_number]
      );
      const newQId = qr.insertId;

      const [options] = await db.query('SELECT * FROM options WHERE question_id = ? ORDER BY option_order', [q.id]);
      for (const o of options) {
        await db.query(
          'INSERT INTO options (question_id, option_text, option_image_url, option_overlay_image_url, option_color, option_text_color, is_correct, option_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [newQId, o.option_text, o.option_image_url, o.option_overlay_image_url, o.option_color, o.option_text_color, o.is_correct, o.option_order]
        );
      }
    }

    // Clone crossword_settings
    const [cwSettings] = await db.query('SELECT * FROM crossword_settings WHERE game_id = ?', [gameId]);
    if (cwSettings[0]) {
      const c = cwSettings[0];
      await db.query(
        `INSERT INTO crossword_settings (game_id, grid_rows, grid_cols, cell_size, show_timer, time_limit_seconds, allow_hints, heading_1, heading_2, heading_3, description_text, bg_color, primary_color, bg_image_url, thankyou_bg_image_url, game_logo_url, font_family, sound_correct_id, sound_wrong_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, c.grid_rows, c.grid_cols, c.cell_size, c.show_timer, c.time_limit_seconds, c.allow_hints, c.heading_1, c.heading_2, c.heading_3, c.description_text, c.bg_color, c.primary_color, c.bg_image_url, c.thankyou_bg_image_url, c.game_logo_url, c.font_family, c.sound_correct_id, c.sound_wrong_id]
      );
    }

    // Clone crossword_words
    const [cwWords] = await db.query('SELECT * FROM crossword_words WHERE game_id = ? ORDER BY word_order', [gameId]);
    for (const w of cwWords) {
      await db.query(
        'INSERT INTO crossword_words (game_id, word_text, clue_text, start_row, start_col, direction, word_order, sound_correct_id, sound_wrong_id, overlay_image_url, word_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newId, w.word_text, w.clue_text, w.start_row, w.start_col, w.direction, w.word_order, w.sound_correct_id, w.sound_wrong_id, w.overlay_image_url, w.word_color]
      );
    }

    // Clone spin_settings
    const [spinSettings] = await db.query('SELECT * FROM spin_settings WHERE game_id = ?', [gameId]);
    if (spinSettings[0]) {
      const sp = spinSettings[0];
      await db.query(
        `INSERT INTO spin_settings (game_id, heading_1, heading_2, description_text, spin_mode, win_message, lose_message, wheel_bg_color, pointer_color, center_color, center_label, bg_color, primary_color, bg_image_url, thankyou_bg_image_url, game_logo_url, font_family, sound_spin_id, sound_win_id, sound_lose_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, sp.heading_1, sp.heading_2, sp.description_text, sp.spin_mode, sp.win_message, sp.lose_message, sp.wheel_bg_color, sp.pointer_color, sp.center_color, sp.center_label, sp.bg_color, sp.primary_color, sp.bg_image_url, sp.thankyou_bg_image_url, sp.game_logo_url, sp.font_family, sp.sound_spin_id, sp.sound_win_id, sp.sound_lose_id]
      );
    }

    // Clone spin_segments
    const [spinSegments] = await db.query('SELECT * FROM spin_segments WHERE game_id = ? ORDER BY segment_order', [gameId]);
    for (const seg of spinSegments) {
      await db.query(
        'INSERT INTO spin_segments (game_id, label, bg_color, text_color, weight, segment_type, prize_description, coupon_code, coupon_image_url, overlay_image_url, sound_id, segment_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newId, seg.label, seg.bg_color, seg.text_color, seg.weight, seg.segment_type, seg.prize_description, seg.coupon_code, seg.coupon_image_url, seg.overlay_image_url, seg.sound_id, seg.segment_order]
      );
    }

    // Clone memory_settings
    const [memSettings] = await db.query('SELECT * FROM memory_settings WHERE game_id = ?', [gameId]);
    if (memSettings[0]) {
      const m = memSettings[0];
      const { id, game_id, ...memData } = m;
      const memKeys = Object.keys(memData);
      await db.query(
        `INSERT INTO memory_settings (game_id,${memKeys.join(',')}) VALUES (?,${
          memKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(memData)]
      );
    }

    // Clone memory_tiles
    const [memTiles] = await db.query('SELECT * FROM memory_tiles WHERE game_id = ? ORDER BY tile_order', [gameId]);
    for (const t of memTiles) {
      const { id, game_id, ...tileData } = t;
      const tileKeys = Object.keys(tileData);
      await db.query(
        `INSERT INTO memory_tiles (game_id,${tileKeys.join(',')}) VALUES (?,${
          tileKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(tileData)]
      );
    }

    // Clone jigsaw_settings
    const [jigSettings] = await db.query('SELECT * FROM jigsaw_settings WHERE game_id = ?', [gameId]);
    if (jigSettings[0]) {
      const j = jigSettings[0];
      const { id, game_id, created_at, updated_at, ...jigData } = j;
      const jigKeys = Object.keys(jigData);
      await db.query(
        `INSERT INTO jigsaw_settings (game_id,${jigKeys.join(',')}) VALUES (?,${
          jigKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(jigData)]
      );
    }

    // Clone wordsearch_settings
    const [wsSettings] = await db.query('SELECT * FROM wordsearch_settings WHERE game_id = ?', [gameId]);
    if (wsSettings[0]) {
      const ws = wsSettings[0];
      const { id, game_id, created_at, updated_at, ...wsData } = ws;
      const wsKeys = Object.keys(wsData);
      await db.query(
        `INSERT INTO wordsearch_settings (game_id,${wsKeys.join(',')}) VALUES (?,${
          wsKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(wsData)]
      );
    }

    // Clone wordsearch_words
    const [wsWords] = await db.query('SELECT * FROM wordsearch_words WHERE game_id = ? ORDER BY word_order', [gameId]);
    for (const w of wsWords) {
      const { id, game_id, created_at, ...wData } = w;
      const wKeys = Object.keys(wData);
      await db.query(
        `INSERT INTO wordsearch_words (game_id,${wKeys.join(',')}) VALUES (?,${
          wKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(wData)]
      );
    }

    // Clone typer_settings
    const [typerSettings] = await db.query('SELECT * FROM typer_settings WHERE game_id = ?', [gameId]);
    if (typerSettings[0]) {
      const t = typerSettings[0];
      const { id, game_id, created_at, updated_at, ...typerData } = t;
      const typerKeys = Object.keys(typerData);
      await db.query(
        `INSERT INTO typer_settings (game_id,${typerKeys.join(',')}) VALUES (?,${
          typerKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(typerData)]
      );
    }

    // Clone typer_words
    const [typerWords] = await db.query('SELECT * FROM typer_words WHERE game_id = ? ORDER BY word_order', [gameId]);
    for (const w of typerWords) {
      const { id, game_id, created_at, ...twData } = w;
      const twKeys = Object.keys(twData);
      await db.query(
        `INSERT INTO typer_words (game_id,${twKeys.join(',')}) VALUES (?,${
          twKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(twData)]
      );
    }

    // Clone pouring_settings
    const [pourSettings] = await db.query('SELECT * FROM pouring_settings WHERE game_id = ?', [gameId]);
    if (pourSettings[0]) {
      const p = pourSettings[0];
      const { id, game_id, created_at, updated_at, ...pourData } = p;
      const pourKeys = Object.keys(pourData);
      await db.query(
        `INSERT INTO pouring_settings (game_id,${pourKeys.join(',')}) VALUES (?,${
          pourKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(pourData)]
      );
    }

    // Clone screw_settings
    const [screwSettings] = await db.query('SELECT * FROM screw_settings WHERE game_id = ?', [gameId]);
    if (screwSettings[0]) {
      const s = screwSettings[0];
      const { id, game_id, created_at, updated_at, ...screwData } = s;
      const screwKeys = Object.keys(screwData);
      await db.query(
        `INSERT INTO screw_settings (game_id,${screwKeys.join(',')}) VALUES (?,${
          screwKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(screwData)]
      );
    }

    // Clone math_settings
    const [mathSettings] = await db.query('SELECT * FROM math_settings WHERE game_id = ?', [gameId]);
    if (mathSettings[0]) {
      const m = mathSettings[0];
      const { id, game_id, created_at, updated_at, ...mathData } = m;
      const mathKeys = Object.keys(mathData);
      await db.query(
        `INSERT INTO math_settings (game_id,${mathKeys.join(',')}) VALUES (?,${
          mathKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(mathData)]
      );
    }

    // Clone maze_settings
    const [mazeSettings] = await db.query('SELECT * FROM maze_settings WHERE game_id = ?', [gameId]);
    if (mazeSettings[0]) {
      const mz = mazeSettings[0];
      const { id, game_id, created_at, updated_at, ...mazeData } = mz;
      const mazeKeys = Object.keys(mazeData);
      await db.query(
        `INSERT INTO maze_settings (game_id,${mazeKeys.join(',')}) VALUES (?,${
          mazeKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(mazeData)]
      );
    }

    // Clone game2048_settings
    const [g2048Settings] = await db.query('SELECT * FROM game2048_settings WHERE game_id = ?', [gameId]);
    if (g2048Settings[0]) {
      const gs = g2048Settings[0];
      const { id, game_id, created_at, updated_at, ...g2048Data } = gs;
      const g2048Keys = Object.keys(g2048Data);
      await db.query(
        `INSERT INTO game2048_settings (game_id,${g2048Keys.join(',')}) VALUES (?,${
          g2048Keys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(g2048Data)]
      );
    }

    // Clone snake_settings
    const [snakeSettings] = await db.query('SELECT * FROM snake_settings WHERE game_id = ?', [gameId]);
    if (snakeSettings[0]) {
      const ss = snakeSettings[0];
      const { id, game_id, created_at, updated_at, ...snakeData } = ss;
      const snakeKeys = Object.keys(snakeData);
      await db.query(
        `INSERT INTO snake_settings (game_id,${snakeKeys.join(',')}) VALUES (?,${
          snakeKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(snakeData)]
      );
    }

    // Clone nagaraja_settings
    const [nagarajaSettings] = await db.query('SELECT * FROM nagaraja_settings WHERE game_id = ?', [gameId]);
    if (nagarajaSettings[0]) {
      const ns = nagarajaSettings[0];
      const { id, game_id, created_at, updated_at, ...nagarajaData } = ns;
      const nagarajaKeys = Object.keys(nagarajaData);
      await db.query(
        `INSERT INTO nagaraja_settings (game_id,${nagarajaKeys.join(',')}) VALUES (?,${
          nagarajaKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(nagarajaData)]
      );
    }

    // Clone snake_ladder_settings
    const [snakeLadderSettings] = await db.query('SELECT * FROM snake_ladder_settings WHERE game_id = ?', [gameId]);
    if (snakeLadderSettings[0]) {
      const ss = snakeLadderSettings[0];
      const { id, game_id, created_at, updated_at, ...snakeLadderData } = ss;
      const slKeys = Object.keys(snakeLadderData);
      await db.query(
        `INSERT INTO snake_ladder_settings (game_id,${slKeys.join(',')}) VALUES (?,${
          slKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(snakeLadderData)]
      );
    }

    // Clone ludo_settings
    const [ludoSettings] = await db.query('SELECT * FROM ludo_settings WHERE game_id = ?', [gameId]);
    if (ludoSettings[0]) {
      const ls = ludoSettings[0];
      const { id, game_id, created_at, updated_at, ...ludoData } = ls;
      const ludoKeys = Object.keys(ludoData);
      await db.query(
        `INSERT INTO ludo_settings (game_id,${ludoKeys.join(',')}) VALUES (?,${
          ludoKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(ludoData)]
      );
    }

    // Clone Carrom_settings
    const [CarromSettings] = await db.query('SELECT * FROM Carrom_settings WHERE game_id = ?', [gameId]);
    if (CarromSettings[0]) {
      const cs = CarromSettings[0];
      const { id, game_id, created_at, updated_at, ...CarromData } = cs;
      const CarromKeys = Object.keys(CarromData);
      await db.query(
        `INSERT INTO Carrom_settings (game_id,${CarromKeys.join(',')}) VALUES (?,${
          CarromKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(CarromData)]
      );
    }

    // Clone tictactoe_multi_settings
    const [tttMultiSettings] = await db.query('SELECT * FROM tictactoe_multi_settings WHERE game_id = ?', [gameId]);
    if (tttMultiSettings[0]) {
      const ts = tttMultiSettings[0];
      const { id, game_id, created_at, updated_at, ...tttMultiData } = ts;
      const tttMultiKeys = Object.keys(tttMultiData);
      await db.query(
        `INSERT INTO tictactoe_multi_settings (game_id,${tttMultiKeys.join(',')}) VALUES (?,${
          tttMultiKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(tttMultiData)]
      );
    }

    // Clone catch_settings
    const [catchSettings] = await db.query('SELECT * FROM catch_settings WHERE game_id = ?', [gameId]);
    if (catchSettings[0]) {
      const cs = catchSettings[0];
      const { id, game_id, created_at, updated_at, ...catchData } = cs;
      const catchKeys = Object.keys(catchData);
      await db.query(
        `INSERT INTO catch_settings (game_id,${catchKeys.join(',')}) VALUES (?,${
          catchKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(catchData)]
      );
    }

    // Clone reaction_settings
    const [reactionSettings] = await db.query('SELECT * FROM reaction_settings WHERE game_id = ?', [gameId]);
    if (reactionSettings[0]) {
      const rs = reactionSettings[0];
      const { id, game_id, created_at, updated_at, ...reactionData } = rs;
      const reactionKeys = Object.keys(reactionData);
      await db.query(
        `INSERT INTO reaction_settings (game_id,${reactionKeys.join(',')}) VALUES (?,${
          reactionKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(reactionData)]
      );
    }

    // Clone simon_settings
    const [simonSettings] = await db.query('SELECT * FROM simon_settings WHERE game_id = ?', [gameId]);
    if (simonSettings[0]) {
      const ss = simonSettings[0];
      const { id, game_id, created_at, updated_at, ...simonData } = ss;
      const simonKeys = Object.keys(simonData);
      await db.query(
        `INSERT INTO simon_settings (game_id,${simonKeys.join(',')}) VALUES (?,${
          simonKeys.map(() => '?').join(',')
        })`,
        [newId, ...Object.values(simonData)]
      );
    }

    // Clone spot registration stations. Each cloned station gets a BRAND NEW code
    // so the copy's printed QR sheets never open the original activity.
    if (src.category === 'spotregistration') {
      const crypto = require('crypto');
      const [srSettings] = await db.query('SELECT * FROM spotreg_settings WHERE game_id = ?', [gameId]);
      if (srSettings[0]) {
        const s = srSettings[0];
        await db.query(
          `INSERT INTO spotreg_settings (game_id, bg_color, primary_color, font_family, heading_1, heading_2, heading_3,
             description_text, heading_1_color, heading_2_color, heading_3_color, description_color, bg_image_url,
             game_logo_url, station_bg_image_url, thankyou_bg_image_url, intro_text, outro_text, intro_text_color,
             outro_text_color, start_button_text, scan_button_text, submit_button_text, skip_button_text,
             complete_heading, complete_text, scan_hint_text, require_order, show_progress, allow_rescan,
             terms_enabled, terms_text, terms_url, meta_description)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [newId, s.bg_color, s.primary_color, s.font_family, s.heading_1, s.heading_2, s.heading_3,
           s.description_text, s.heading_1_color, s.heading_2_color, s.heading_3_color, s.description_color,
           s.bg_image_url, s.game_logo_url, s.station_bg_image_url, s.thankyou_bg_image_url, s.intro_text,
           s.outro_text, s.intro_text_color, s.outro_text_color, s.start_button_text, s.scan_button_text,
           s.submit_button_text, s.skip_button_text, s.complete_heading, s.complete_text, s.scan_hint_text,
           s.require_order, s.show_progress, s.allow_rescan, s.terms_enabled, s.terms_text, s.terms_url,
           s.meta_description]
        );
      }

      const [srStations] = await db.query('SELECT * FROM spotreg_stations WHERE game_id = ? ORDER BY station_order, id', [gameId]);
      for (const st of srStations) {
        const freshCode = crypto.randomBytes(10).toString('hex').slice(0, 12).toUpperCase();
        const [newStation] = await db.query(
          `INSERT INTO spotreg_stations (game_id, station_name, station_code, station_order, icon, heading_1, description_text, image_url, is_active)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [newId, st.station_name, freshCode, st.station_order, st.icon, st.heading_1, st.description_text, st.image_url, st.is_active]
        );
        const [stFields] = await db.query('SELECT * FROM spotreg_station_fields WHERE station_id = ? ORDER BY field_order', [st.id]);
        for (const f of stFields) {
          await db.query(
            'INSERT INTO spotreg_station_fields (station_id, field_label, field_type, field_options, is_required, field_order) VALUES (?, ?, ?, ?, ?, ?)',
            [newStation.insertId, f.field_label, f.field_type, JSON.stringify(f.field_options || []), f.is_required, f.field_order]
          );
        }
      }
    }

    const [newGame] = await db.query('SELECT g.*, c.company_name, c.slug as client_slug FROM games g LEFT JOIN clients c ON g.client_id = c.id WHERE g.id = ?', [newId]);
    res.status(201).json({ success: true, game: newGame[0] });
  } catch (err) {
    console.error('Duplicate error:', err.message);
    console.error('Duplicate SQL:', err.sqlMessage);
    sendError(res, err);
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const gameId = req.params.id;

    // ── Collect all file URLs associated with this game before deleting ──

    // 1. quiz_settings images
    const [settingsRows] = await db.query('SELECT * FROM quiz_settings WHERE game_id = ? ORDER BY id DESC LIMIT 1', [gameId]);
    if (settingsRows[0]) {
      const s = settingsRows[0];
      ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url'].forEach(f => deleteUploadFile(s[f]));
    }

    // 2. question images + option images
    const [questions] = await db.query('SELECT * FROM questions WHERE game_id = ?', [gameId]);
    for (const q of questions) {
      deleteUploadFile(q.question_image_url);
      deleteUploadFile(q.question_bg_image_url);
      const [options] = await db.query('SELECT * FROM options WHERE question_id = ?', [q.id]);
      for (const opt of options) {
        deleteUploadFile(opt.option_image_url);
        deleteUploadFile(opt.option_overlay_image_url);
      }
    }

    // 3. sound files
    const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [gameId]);
    for (const s of sounds) {
      deleteUploadFile(s.url || s.file_url);
    }

    // 4. memory_tiles images
    const [memTiles] = await db.query('SELECT * FROM memory_tiles WHERE game_id = ?', [gameId]);
    for (const t of memTiles) deleteUploadFile(t.image_url);

    // 5. memory_settings images
    const [memSettings] = await db.query('SELECT * FROM memory_settings WHERE game_id = ?', [gameId]);
    if (memSettings[0]) {
      ['bg_image_url','thankyou_bg_image_url','game_logo_url','card_cover_image_url','overlay_image_url','submit_confirm_gif_url'].forEach(f => deleteUploadFile(memSettings[0][f]));
    }

    // ── Now delete the game (cascades to questions, options, settings, sounds, sessions) ──
    await db.query('DELETE FROM games WHERE id = ?', [gameId]);

    console.log(`🗑️  Game ${gameId} and all associated files deleted.`);
    res.json({ success: true, message: 'Game deleted' });
  } catch (err) { console.error(err); sendError(res, err); }
});

// PUT settings/field - quick single-field update (JSON, no multer needed)
router.put('/:id/settings/field', requireAdmin, async (req, res) => {
  try {
    const boolFields = ['randomize_questions', 'show_progress', 'allow_back', 'terms_enabled', 'send_email', 'enable_mascot', 'enable_speech'];
    const intFields = ['questions_per_session'];
    const floatFields = ['speech_rate', 'speech_pitch'];
    const strFields = ['speech_language'];
    const allowed = [...boolFields, ...intFields, ...floatFields, ...strFields];
    const updates = [];
    const vals = [];
    for (const [key, val] of Object.entries(req.body)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        if (boolFields.includes(key)) {
          vals.push(val === '1' || val === 1 || val === true ? 1 : 0);
        } else if (intFields.includes(key)) {
          vals.push(parseInt(val) || 0);
        } else if (floatFields.includes(key)) {
          vals.push(parseFloat(val) || 1);
        } else {
          vals.push(val);
        }
      }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, message: 'No valid fields' });
    vals.push(req.params.id);
    await db.query(`UPDATE quiz_settings SET ${updates.join(', ')} WHERE game_id = ?`, vals);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

// PUT settings - with image upload support
router.put('/:id/settings', requireAdmin, upload.fields([
  { name: 'bg_image', maxCount: 1 },
  { name: 'thankyou_bg_image', maxCount: 1 },
  { name: 'game_logo', maxCount: 1 },
  { name: 'submit_confirm_gif', maxCount: 1 }
]), async (req, res) => {
    const { bg_color, primary_color, show_progress, allow_back, time_per_question,
      heading_1, heading_2,
      intro_text, outro_text,
      win_sound_url, win_sound_id, lose_sound_id, sound_correct_id, sound_wrong_id,
      terms_enabled, terms_text, terms_url, send_email,
      bg_image_url, thankyou_bg_image_url, game_logo_url, font_family, submit_confirm_gif_url,
      heading_1_color, heading_2_color, intro_text_color,
      thankyou_subtitle, outro_text_color, thankyou_subtitle_color,
      start_button_text, start_button_text_color, start_button_bg_color,
      submit_button_text, submit_button_text_color, submit_button_bg_color,
      continue_button_text, continue_button_text_color, continue_button_bg_color,
      next_button_text, next_button_text_color, next_button_bg_color,
      randomize_questions, questions_per_session,
      enable_mascot, enable_speech, speech_language, speech_rate, speech_pitch,
      default_option_color, default_option_text_color, default_option_border_color,
      default_option_border_width, default_option_border_radius, default_option_font_gradient,
      default_option_bg_json, default_option_font_json, default_option_bg_gradient,
      default_option_border_json, default_option_corners_json } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM quiz_settings WHERE game_id = ? ORDER BY id DESC LIMIT 1', [req.params.id]);
    const bgImg   = req.files?.bg_image           ? `/uploads/images/${req.files.bg_image[0].filename}`           : (bg_image_url           !== undefined ? bg_image_url           : (existing[0]?.bg_image_url           || null));
    const tyImg   = req.files?.thankyou_bg_image  ? `/uploads/images/${req.files.thankyou_bg_image[0].filename}`  : (thankyou_bg_image_url  !== undefined ? thankyou_bg_image_url  : (existing[0]?.thankyou_bg_image_url  || null));
    const logoImg = req.files?.game_logo          ? `/uploads/images/${req.files.game_logo[0].filename}`          : (game_logo_url !== undefined ? game_logo_url : (existing[0]?.game_logo_url || null));
    const gifImg  = req.files?.submit_confirm_gif ? `/uploads/images/${req.files.submit_confirm_gif[0].filename}` : (submit_confirm_gif_url !== undefined ? submit_confirm_gif_url : (existing[0]?.submit_confirm_gif_url  || null));

    // UPDATE existing row first; if no row exists, INSERT a new one.
    // This avoids relying on UNIQUE KEY + ON DUPLICATE KEY UPDATE which
    // silently fails when duplicate rows already exist.
    const coerceBool = (v) => (v === 1 || v === true || v === '1' || v === 'true') ? 1 : 0
    const coerceInt = (v) => { const n = parseInt(v); return Number.isFinite(n) ? n : 0 }
    const showProgress = show_progress === '' || show_progress === undefined || show_progress === null ? 0 : coerceBool(show_progress)
    const allowBack = allow_back === '' || allow_back === undefined || allow_back === null ? 0 : coerceBool(allow_back)
    const timePerQ = time_per_question === '' || time_per_question === undefined || time_per_question === null ? 0 : coerceInt(time_per_question)
    const vals = [
      req.params.id, bg_color, primary_color, showProgress, allowBack, timePerQ,
      heading_1 || null, heading_2 || null, intro_text, outro_text,
      win_sound_url, bgImg, tyImg,       terms_enabled !== '0' ? 1 : 0, terms_text, terms_url, send_email !== '0' ? 1 : 0,
      win_sound_id || null, lose_sound_id || null, sound_correct_id || null, sound_wrong_id || null,
      logoImg || null, font_family || 'DM Sans', gifImg || null,
      heading_1_color || null, heading_2_color || null, intro_text_color || null,
      thankyou_subtitle || null, outro_text_color || null, thankyou_subtitle_color || null,
      start_button_text || null, start_button_text_color || null, start_button_bg_color || null,
      submit_button_text || null, submit_button_text_color || null, submit_button_bg_color || null,
      continue_button_text || null, continue_button_text_color || null, continue_button_bg_color || null,
      next_button_text || null, next_button_text_color || null, next_button_bg_color || null,
      randomize_questions !== undefined ? (randomize_questions === 1 || randomize_questions === true || randomize_questions === '1' || randomize_questions === 'true' ? 1 : 0) : 0,
      parseInt(questions_per_session) || 0,
      enable_mascot !== undefined ? (enable_mascot === 1 || enable_mascot === true || enable_mascot === '1' || enable_mascot === 'true' ? 1 : 0) : 0,
      enable_speech !== undefined ? (enable_speech === 1 || enable_speech === true || enable_speech === '1' || enable_speech === 'true' ? 1 : 0) : 0,
      speech_language || 'en',
      parseFloat(speech_rate) || 1,
      parseFloat(speech_pitch) || 1,
      default_option_color || '#1a1a2e',
      default_option_text_color || '#ffffff',
      default_option_border_color || 'transparent',
      default_option_border_width ?? 0,
      default_option_border_radius ?? 12,
      default_option_font_gradient || '',
      default_option_bg_json || null,
      default_option_font_json || null,
      default_option_bg_gradient || '',
      default_option_border_json || null,
      default_option_corners_json || null
    ];

    const [upd] = await db.query(
      `UPDATE quiz_settings SET bg_color=?, primary_color=?, show_progress=?, allow_back=?, time_per_question=?,
       heading_1=?, heading_2=?, intro_text=?, outro_text=?, win_sound_url=?,
       bg_image_url=?, thankyou_bg_image_url=?, terms_enabled=?, terms_text=?, terms_url=?, send_email=?,
       win_sound_id=?, lose_sound_id=?, sound_correct_id=?, sound_wrong_id=?,
       game_logo_url=?, font_family=?, submit_confirm_gif_url=?,
       heading_1_color=?, heading_2_color=?, intro_text_color=?,
       thankyou_subtitle=?, outro_text_color=?, thankyou_subtitle_color=?,
       start_button_text=?, start_button_text_color=?, start_button_bg_color=?,
       submit_button_text=?, submit_button_text_color=?, submit_button_bg_color=?,
       continue_button_text=?, continue_button_text_color=?, continue_button_bg_color=?,
       next_button_text=?, next_button_text_color=?, next_button_bg_color=?,
randomize_questions=?, questions_per_session=?,
         enable_mascot=?, enable_speech=?, speech_language=?, speech_rate=?, speech_pitch=?,
         default_option_color=?, default_option_text_color=?, default_option_border_color=?,
         default_option_border_width=?, default_option_border_radius=?, default_option_font_gradient=?,
         default_option_bg_json=?, default_option_font_json=?, default_option_bg_gradient=?,
         default_option_border_json=?, default_option_corners_json=? WHERE game_id=?`,
      [...vals.slice(1), req.params.id]
    );

    if (upd.affectedRows === 0) {
      await db.query(
        `INSERT INTO quiz_settings (game_id, bg_color, primary_color, show_progress, allow_back, time_per_question, heading_1, heading_2, intro_text, outro_text, win_sound_url, bg_image_url, thankyou_bg_image_url, terms_enabled, terms_text, terms_url, send_email, win_sound_id, lose_sound_id, sound_correct_id, sound_wrong_id, game_logo_url, font_family, submit_confirm_gif_url, heading_1_color, heading_2_color, intro_text_color, thankyou_subtitle, outro_text_color, thankyou_subtitle_color, start_button_text, start_button_text_color, start_button_bg_color, submit_button_text, submit_button_text_color, submit_button_bg_color, continue_button_text, continue_button_text_color, continue_button_bg_color, next_button_text, next_button_text_color, next_button_bg_color, randomize_questions, questions_per_session, enable_mascot, enable_speech, speech_language, speech_rate, speech_pitch, default_option_color, default_option_text_color, default_option_border_color, default_option_border_width, default_option_border_radius, default_option_font_gradient, default_option_bg_json, default_option_font_json, default_option_bg_gradient, default_option_border_json, default_option_corners_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        vals
      );
    }

    // Clean up any duplicate rows — keep the one with the highest id (latest)
    await db.query(
      `DELETE t1 FROM quiz_settings t1
       INNER JOIN quiz_settings t2
       ON t1.game_id = t2.game_id AND t1.id < t2.id`
    );

    res.json({ success: true, message: 'Settings saved' });
  } catch (err) { console.error(err); sendError(res, err); }
});

// PUT email template - NO SMTP fields
router.put('/:id/email-template', requireAdmin, async (req, res) => {
  const { sender_name, sender_email, subject, header_color, header_text, body_html, footer_text, is_enabled } = req.body;
  try {
    await db.query(
      `INSERT INTO email_templates (game_id, sender_name, sender_email, subject, header_color, header_text, body_html, footer_text, is_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE sender_name=VALUES(sender_name), sender_email=VALUES(sender_email),
       subject=VALUES(subject), header_color=VALUES(header_color), header_text=VALUES(header_text),
       body_html=VALUES(body_html), footer_text=VALUES(footer_text), is_enabled=VALUES(is_enabled)`,
      [req.params.id, sender_name, sender_email, subject, header_color, header_text, body_html, footer_text, is_enabled ? 1 : 0]
    );
    res.json({ success: true, message: 'Email template saved' });
  } catch (err) { console.error(err); sendError(res, err); }
});

router.put('/:id/form-fields', requireAdmin, async (req, res) => {
  const { fields } = req.body;
  try {
    await db.query('DELETE FROM form_fields WHERE game_id = ?', [req.params.id]);
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      await db.query(
        'INSERT INTO form_fields (game_id, field_label, field_type, field_options, is_required, field_order) VALUES (?, ?, ?, ?, ?, ?)',
        [req.params.id, f.field_label, f.field_type, JSON.stringify(f.field_options || []), f.is_required ? 1 : 0, i]
      );
    }
    res.json({ success: true, message: 'Form fields saved' });
  } catch (err) { console.error(err); sendError(res, err); }
});

router.get('/:id/stats', requireAdmin, async (req, res) => {
  try {
    const [sessions] = await db.query('SELECT COUNT(*) as total, SUM(completed) as completed, AVG(score) as avg_score FROM player_sessions WHERE game_id = ?', [req.params.id]);
    const [recent] = await db.query('SELECT player_data, score, total_scoreable, completed_at FROM player_sessions WHERE game_id = ? AND completed = 1 ORDER BY completed_at DESC LIMIT 20', [req.params.id]);
    res.json({ success: true, stats: sessions[0], recent });
  } catch (err) { console.error(err); sendError(res, err); }
});

// GET UTM attribution breakdown for a game — how BOs see where players came
// from (whatsapp share vs qr poster vs direct vs a referrer's @username link)
router.get('/:id/traffic-sources', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT COALESCE(NULLIF(utm_source, ''), 'direct') AS source,
             COALESCE(NULLIF(utm_medium, ''), 'organic') AS medium,
             COUNT(*) AS plays,
             SUM(completed = 1) AS completions
      FROM player_sessions
      WHERE game_id = ?
      GROUP BY 1, 2
      ORDER BY plays DESC
      LIMIT 25
    `, [req.params.id]);
    res.json({ success: true, sources: rows });
  } catch (err) { console.error(err); sendError(res, err); }
});


// GET all completed sessions with answers for a game (for responses page)
router.get('/:id/responses', requireAdmin, async (req, res) => {
  try {
    const [sessions] = await db.query(
      `SELECT * FROM player_sessions WHERE game_id = ? AND completed = 1 ORDER BY completed_at DESC`,
      [req.params.id]
    );

    // For each session, fetch answers joined with option text and question text
    for (const session of sessions) {
      const [answers] = await db.query(
        `SELECT pa.question_id, pa.option_id, pa.is_correct, pa.question_type,
                o.option_text, q.question_text
         FROM player_answers pa
         LEFT JOIN options o ON pa.option_id = o.id
         LEFT JOIN questions q ON pa.question_id = q.id
         WHERE pa.session_id = ?
         ORDER BY q.question_order`,
        [session.id]
      );
      session.answers = answers;
    }

    // Spot Registration has no questions: every value lives on a station row.
    // Flatten them into labelled keys so the shared Responses table can show
    // them as ordinary columns, and attach the computed BMI for the report.
    const [gameRows] = await db.query('SELECT category FROM games WHERE id = ?', [req.params.id]);
    if (gameRows[0] && gameRows[0].category === 'spotregistration' && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id);

      const [stationRows] = await db.query(
        `SELECT p.session_id, s.station_name, s.station_order, p.answers
           FROM spotreg_progress p
           JOIN spotreg_stations s ON s.id = p.station_id
          WHERE p.session_id IN (?) AND p.completed_at IS NOT NULL
          ORDER BY s.station_order, s.id`,
        [sessionIds]
      );

      const [bmiRows] = await db.query(
        'SELECT session_id, bmi_value, bmi_category, bmi_percentile, height_cm, weight_kg, age_years, gender, is_adult FROM spotreg_bmi WHERE session_id IN (?)',
        [sessionIds]
      );
      const bmiBySession = new Map(bmiRows.map(r => [r.session_id, r]));

      const bySession = new Map(sessionIds.map(id => [id, {}]));
      for (const row of stationRows) {
        let answers = row.answers;
        if (typeof answers === 'string') {
          try { answers = JSON.parse(answers); } catch { answers = {}; }
        }
        const target = bySession.get(row.session_id);
        if (!target) continue;
        for (const [label, value] of Object.entries(answers || {})) {
          if (value === null || value === undefined || String(value).trim() === '') continue;
          target[`${row.station_name} — ${label}`] = value;
        }
      }

      for (const session of sessions) {
        session.station_answers = bySession.get(session.id) || {};
        const bmi = bmiBySession.get(session.id);
        session.bmi = bmi ? {
          value: bmi.bmi_value,
          category: bmi.bmi_category,
          percentile: bmi.bmi_percentile,
          height_cm: bmi.height_cm,
          weight_kg: bmi.weight_kg,
          age_years: bmi.age_years,
          gender: bmi.gender,
          is_adult: bmi.is_adult
        } : null;
      }
    }

    res.json({ success: true, sessions });
  } catch (err) { console.error(err); sendError(res, err); }
});

// PUT /api/games/:id/status — change game status (development/testing/live)
router.put('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const allowed = ['development','testing','live'];
  if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
  try {
    const [gameRows] = await db.query('SELECT testing_started_at FROM games WHERE id = ?', [req.params.id]);
    const testingStartedAt = gameRows[0]?.testing_started_at || null;

    if (status === 'live') {
      // ── Bounded wipe: remove ONLY entries written during the most recent
      //    testing round (started_at >= testing_started_at). Production data
      //    from earlier live periods is preserved. If there was no tracked
      //    testing round (e.g. brand-new game going live first time) a full
      //    wipe is safe since no production data exists yet.
      const startedAt = testingStartedAt;

      // 1. Player answers (tied to sessions; legacy rows via join)
      if (startedAt) {
        await db.query(
          `DELETE pa FROM player_answers pa
           INNER JOIN player_sessions ps ON pa.session_id = ps.id
           WHERE ps.game_id = ? AND ps.created_at >= ?`,
          [req.params.id, startedAt]
        );
      } else {
        await db.query(
          `DELETE pa FROM player_answers pa
           INNER JOIN player_sessions ps ON pa.session_id = ps.id
           WHERE ps.game_id = ?`,
          [req.params.id]
        );
      }
      // 2. Player sessions (cascades remaining player_answers via FK)
      if (startedAt) {
        await db.query(
          'DELETE FROM player_sessions WHERE game_id = ? AND created_at >= ?',
          [req.params.id, startedAt]
        );
      } else {
        await db.query('DELETE FROM player_sessions WHERE game_id = ?', [req.params.id]);
      }
      // 3. High scores written during testing
      if (startedAt) {
        await db.query(
          'DELETE FROM player_best_scores WHERE game_id = ? AND updated_at >= ?',
          [req.params.id, startedAt]
        );
      } else {
        await db.query('DELETE FROM player_best_scores WHERE game_id = ?', [req.params.id]);
      }
      // 4. Points transactions awarded during testing
      if (startedAt) {
        await db.query(
          'DELETE FROM pc_transactions WHERE game_id = ? AND created_at >= ?',
          [req.params.id, startedAt]
        );
      } else {
        await db.query('DELETE FROM pc_transactions WHERE game_id = ?', [req.params.id]);
      }
      // 5. Business redemptions created during testing
      if (startedAt) {
        await db.query(
          'DELETE FROM business_redemptions WHERE game_id = ? AND created_at >= ?',
          [req.params.id, startedAt]
        );
      } else {
        await db.query('DELETE FROM business_redemptions WHERE game_id = ?', [req.params.id]);
      }

      await db.query('UPDATE games SET status=?, is_active=1, testing_started_at=NULL WHERE id=?', [status, req.params.id]);
      // Auto-sync linked BD request to live
      await db.query('UPDATE bd_requests SET status=? WHERE game_id=? AND status!=?', ['live', req.params.id, 'live']);
      // Notify the BD who requested this game
      const [bdReq] = await db.query(
        'SELECT r.bd_id, r.business_name, g.name FROM bd_requests r JOIN games g ON r.game_id=g.id WHERE r.game_id=?',
        [req.params.id]
      );
      if (bdReq.length > 0) {
        await db.query(
          'INSERT INTO notifications (user_id, user_type, type, title, message, link) VALUES (?,?,?,?,?,?)',
          [bdReq[0].bd_id, 'bd', 'success', 'Game is Live!',
           `"${bdReq[0].name}" for "${bdReq[0].business_name}" is now live — QR code available`,
           '/bd/requests']
        );
      }
    } else if (status === 'development') {
      // Leaving any lifecycle state back to development clears the test window
      await db.query('UPDATE games SET status=?, testing_started_at=NULL WHERE id=?', [status, req.params.id]);
    } else {
      // testing — begin/continue a testing round; keep earliest start so we
      // wipe everything accumulated since this round began
      await db.query(
        'UPDATE games SET status=?, testing_started_at = IFNULL(testing_started_at, NOW()) WHERE id=?',
        [status, req.params.id]
      );
    }
    res.json({ success: true, message: `Game status changed to ${status}` });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// PUT /games/:id/email-settings — Save email templates for a game
router.put('/:id/email-settings', requireAdmin, async (req, res) => {
  const { email_settings } = req.body;
  if (!email_settings) return res.status(400).json({ success: false, message: 'email_settings required' });
  try {
    await db.query('UPDATE games SET email_settings = ? WHERE id = ?', [JSON.stringify(email_settings), req.params.id]);
    res.json({ success: true, message: 'Email settings saved' });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// GET /games/:id/email-settings — Get email templates for a game
router.get('/:id/email-settings', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT email_settings FROM games WHERE id = ?', [req.params.id]);
    const settings = rows[0]?.email_settings || {};
    res.json({ success: true, email_settings: settings });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

module.exports = router;