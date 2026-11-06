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
    const abs = path.join(__dirname, '..', urlPath);
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
      console.log('🗑️  Deleted file:', urlPath);
    }
  } catch (e) {
    console.warn('⚠️  Could not delete file:', urlPath, e.message);
  }
}

/* ================== CROSSWORD WORDS ================== */

// Get all words for a game
router.get('/games/:gameId/words', auth, async (req, res) => {
  try {
    const [words] = await db.query(
      'SELECT * FROM crossword_words WHERE game_id = ? ORDER BY word_order',
      [req.params.gameId]
    );
    res.json({ success: true, words });
  } catch (err) {
    sendError(res, err);
  }
});

// Create a new word
router.post('/games/:gameId/words', auth, upload.single('overlay_image'), async (req, res) => {
  const { word_text, clue_text, start_row, start_col, direction, word_order, sound_correct_id, sound_wrong_id, word_color } = req.body;
  try {
    const overlay_url = req.file ? `/uploads/images/${req.file.filename}` : null;
    const [result] = await db.query(
      `INSERT INTO crossword_words (game_id, word_text, clue_text, start_row, start_col, direction, word_order, sound_correct_id, sound_wrong_id, overlay_image_url, word_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.gameId, (word_text || '').toUpperCase(), clue_text, start_row || 0, start_col || 0, direction || 'across',
       word_order || 0, sound_correct_id ? parseInt(sound_correct_id) : null, sound_wrong_id ? parseInt(sound_wrong_id) : null, overlay_url, word_color || '#7c6ff7']
    );
    const [word] = await db.query('SELECT * FROM crossword_words WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, word: word[0] });
  } catch (err) {
    sendError(res, err);
  }
});

// Update a word
router.put('/words/:id', auth, upload.single('overlay_image'), async (req, res) => {
  const { word_text, clue_text, start_row, start_col, direction, word_order, sound_correct_id, sound_wrong_id, word_color, overlay_image_url } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM crossword_words WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Word not found' });

    let overlay_url;
    if (req.file) {
      deleteUploadFile(existing[0].overlay_image_url);
      overlay_url = `/uploads/images/${req.file.filename}`;
    } else {
      overlay_url = overlay_image_url !== undefined ? overlay_image_url : existing[0].overlay_image_url;
    }

    await db.query(
      `UPDATE crossword_words SET word_text=?, clue_text=?, start_row=?, start_col=?, direction=?, word_order=?, sound_correct_id=?, sound_wrong_id=?, overlay_image_url=?, word_color=? WHERE id=?`,
      [(word_text || '').toUpperCase(), clue_text, start_row, start_col, direction, word_order,
       sound_correct_id ? parseInt(sound_correct_id) : null, sound_wrong_id ? parseInt(sound_wrong_id) : null, overlay_url, word_color || existing[0].word_color, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM crossword_words WHERE id = ?', [req.params.id]);
    res.json({ success: true, word: updated[0] });
  } catch (err) {
    sendError(res, err);
  }
});

// Delete a word
router.delete('/words/:id', auth, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM crossword_words WHERE id = ?', [req.params.id]);
    if (existing[0]) deleteUploadFile(existing[0].overlay_image_url);
    await db.query('DELETE FROM crossword_words WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Word deleted' });
  } catch (err) {
    sendError(res, err);
  }
});

// Reorder words
router.post('/games/:gameId/words/reorder', auth, async (req, res) => {
  const { order } = req.body;
  try {
    for (const item of order) {
      await db.query('UPDATE crossword_words SET word_order = ? WHERE id = ?', [item.word_order, item.id]);
    }
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
});

/* ================== CROSSWORD SETTINGS ================== */

// Get settings
router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [settings] = await db.query('SELECT * FROM crossword_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: settings[0] || null });
  } catch (err) {
    sendError(res, err);
  }
});

// Save settings (upsert)
router.put('/:gameId/settings', auth, upload.fields([
  { name: 'bg_image', maxCount: 1 },
  { name: 'thankyou_bg_image', maxCount: 1 },
  { name: 'game_logo', maxCount: 1 },
  { name: 'submit_confirm_gif', maxCount: 1 },
  { name: 'blank_cell_image', maxCount: 1 }
]), async (req, res) => {
  const {
    grid_rows, grid_cols, cell_size, show_timer, time_limit_seconds, allow_hints, auto_size,
    heading_1, heading_2, heading_3, description_text,
    heading_1_color, heading_2_color, heading_3_color, description_color,
    bg_color, primary_color, bg_image_url, thankyou_bg_image_url, game_logo_url,
    font_family, sound_correct_id, sound_wrong_id,
intro_text, outro_text, submit_button_text, continue_button_text, start_button_text,
    terms_enabled, terms_text, terms_url, meta_description, submit_confirm_gif_url, blank_cell_image_url
  } = req.body;

  
  // Handle undefined/empty values with proper defaults
  const gridRows = grid_rows !== undefined && grid_rows !== '' ? Number(grid_rows) : 10;
  const gridCols = grid_cols !== undefined && grid_cols !== '' ? Number(grid_cols) : 10;
  const cellSize = cell_size !== undefined && cell_size !== '' ? Number(cell_size) : 40;
  const showTimer = show_timer !== undefined && show_timer !== '' ? Number(show_timer) : 1;
  const timeLimitSecs = time_limit_seconds !== undefined && time_limit_seconds !== '' ? Number(time_limit_seconds) : 0;
  const allowHints = allow_hints !== undefined && allow_hints !== '' ? Number(allow_hints) : 1;
  const autoSize = auto_size !== undefined && auto_size !== '' ? Number(auto_size) : 0;
  const termsEnabled = terms_enabled !== undefined && terms_enabled !== '' ? Number(terms_enabled) : 0;
  const toNullInt = v => (v === '' || v === undefined || v === null) ? null : Number(v);

  try {
    const [existing] = await db.query('SELECT * FROM crossword_settings WHERE game_id = ?', [req.params.gameId]);

    const bgImg  = req.files?.bg_image           ? `/uploads/images/${req.files.bg_image[0].filename}`           : (bg_image_url           !== undefined ? bg_image_url           : (existing[0]?.bg_image_url           || null));
    const tyImg  = req.files?.thankyou_bg_image  ? `/uploads/images/${req.files.thankyou_bg_image[0].filename}`  : (thankyou_bg_image_url  !== undefined ? thankyou_bg_image_url  : (existing[0]?.thankyou_bg_image_url  || null));
    const logoImg = req.files?.game_logo         ? `/uploads/images/${req.files.game_logo[0].filename}`          : (game_logo_url !== undefined ? game_logo_url : (existing[0]?.game_logo_url || null));
    const gifImg  = req.files?.submit_confirm_gif  ? `/uploads/images/${req.files.submit_confirm_gif[0].filename}`  : (submit_confirm_gif_url  !== undefined ? submit_confirm_gif_url  : (existing[0]?.submit_confirm_gif_url  || null));
    const blankImg = req.files?.blank_cell_image   ? `/uploads/images/${req.files.blank_cell_image[0].filename}`   : (blank_cell_image_url    !== undefined ? blank_cell_image_url    : (existing[0]?.blank_cell_image_url    || null));

    if (existing.length === 0) {
await db.query(
        `INSERT INTO crossword_settings (game_id, grid_rows, grid_cols, cell_size, show_timer, time_limit_seconds, allow_hints, auto_size,
         heading_1, heading_2, heading_3, description_text,
         heading_1_color, heading_2_color, heading_3_color, description_color,
         bg_color, primary_color, bg_image_url, thankyou_bg_image_url, game_logo_url, font_family, sound_correct_id, sound_wrong_id,
         intro_text, outro_text, submit_button_text, continue_button_text, start_button_text,
         terms_enabled, terms_text, terms_url, meta_description, submit_confirm_gif_url, blank_cell_image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.params.gameId, gridRows, gridCols, cellSize,
          showTimer, timeLimitSecs, allowHints, autoSize,
          heading_1 || null, heading_2 || null, heading_3 || null, description_text || null,
          heading_1_color || '#1a1a2e', heading_2_color || '#666666', heading_3_color || '#777777', description_color || '#888888',
          bg_color || '#f8f8ff', primary_color || '#7c6ff7', bgImg, tyImg, logoImg,
          font_family || 'DM Sans', toNullInt(sound_correct_id), toNullInt(sound_wrong_id),
          intro_text || null, outro_text || null, submit_button_text || null, continue_button_text || null, start_button_text || null,
          termsEnabled, terms_text || null, terms_url || null, meta_description || null, gifImg || null, blankImg || null]
      );
    } else {
      const e = existing[0];
      await db.query(
        `UPDATE crossword_settings SET grid_rows=?, grid_cols=?, cell_size=?, show_timer=?, time_limit_seconds=?, allow_hints=?, auto_size=?,
         heading_1=?, heading_2=?, heading_3=?, description_text=?,
         heading_1_color=?, heading_2_color=?, heading_3_color=?, description_color=?,
         bg_color=?, primary_color=?, bg_image_url=?, thankyou_bg_image_url=?, game_logo_url=?,
         font_family=?, sound_correct_id=?, sound_wrong_id=?,
         intro_text=?, outro_text=?, submit_button_text=?, continue_button_text=?, start_button_text=?,
         terms_enabled=?, terms_text=?, terms_url=?, meta_description=?, submit_confirm_gif_url=?, blank_cell_image_url=? WHERE game_id=?`,
        [gridRows, gridCols, cellSize, showTimer, timeLimitSecs, allowHints, autoSize,
         heading_1 !== undefined ? heading_1 : e.heading_1,
         heading_2 !== undefined ? heading_2 : e.heading_2,
         heading_3 !== undefined ? heading_3 : e.heading_3,
         description_text !== undefined ? description_text : e.description_text,
         heading_1_color || e.heading_1_color || '#1a1a2e',
         heading_2_color || e.heading_2_color || '#666666',
         heading_3_color || e.heading_3_color || '#777777',
         description_color || e.description_color || '#888888',
         bg_color || e.bg_color, primary_color || e.primary_color,
         bgImg, tyImg, logoImg,
         font_family || e.font_family,
         sound_correct_id !== undefined ? toNullInt(sound_correct_id) : e.sound_correct_id,
         sound_wrong_id !== undefined ? toNullInt(sound_wrong_id) : e.sound_wrong_id,
         intro_text !== undefined ? intro_text : e.intro_text,
         outro_text !== undefined ? outro_text : e.outro_text,
         submit_button_text !== undefined ? submit_button_text : e.submit_button_text,
         continue_button_text !== undefined ? continue_button_text : e.continue_button_text,
         start_button_text !== undefined ? start_button_text : e.start_button_text,
         terms_enabled !== undefined ? termsEnabled : e.terms_enabled,
         terms_text !== undefined ? terms_text : e.terms_text,
         terms_url !== undefined ? terms_url : e.terms_url,
         meta_description !== undefined ? meta_description : e.meta_description,
         gifImg || null, blankImg || null,
         req.params.gameId]
      );
    }

    const [updated] = await db.query('SELECT * FROM crossword_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    sendError(res, err);
  }
});

/* ================== GRID AUTO-GENERATE ================== */

router.post('/games/:gameId/generate-grid', auth, async (req, res) => {
  try {
    const [words] = await db.query('SELECT * FROM crossword_words WHERE game_id = ? ORDER BY word_order', [req.params.gameId]);
    if (words.length === 0) return res.json({ success: true, grid_rows: 10, grid_cols: 10, message: 'No words found' });

    let maxRow = 0, maxCol = 0;
    for (const word of words) {
      const endRow = word.direction === 'down'   ? word.start_row + word.word_text.length - 1 : word.start_row;
      const endCol = word.direction === 'across' ? word.start_col + word.word_text.length - 1 : word.start_col;
      maxRow = Math.max(maxRow, endRow);
      maxCol = Math.max(maxCol, endCol);
    }

    const grid_rows = maxRow + 2;
    const grid_cols = maxCol + 2;

    await db.query('UPDATE crossword_settings SET grid_rows=?, grid_cols=? WHERE game_id=?', [grid_rows, grid_cols, req.params.gameId]);
    res.json({ success: true, grid_rows, grid_cols });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
