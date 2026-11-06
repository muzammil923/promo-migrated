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

router.get('/games/:gameId/questions', auth, async (req, res) => {
  try {
    const [questions] = await db.query('SELECT * FROM questions WHERE game_id = ? ORDER BY question_order', [req.params.gameId]);
    for (let q of questions) {
      const [options] = await db.query('SELECT * FROM options WHERE question_id = ? ORDER BY option_order', [q.id]);
      q.options = options;
    }
    res.json({ success: true, questions });
  } catch (err) { sendError(res, err); }
});

router.post('/games/:gameId/questions', auth, upload.fields([
  { name: 'question_image', maxCount: 1 },
  { name: 'question_bg_image', maxCount: 1 }
]), async (req, res) => {
  const { question_text, question_type, question_color, question_order, num_options,
    sound_correct, sound_wrong, sound_neutral, sound_correct_id, sound_wrong_id, sound_neutral_id,
    overlay_duration, overlay_idle_time, overlay_animation_in, overlay_animation_out,
    question_image_animation } = req.body;
  try {
    const img_url = req.files?.question_image ? `/uploads/images/${req.files.question_image[0].filename}` : null;
    const bg_url = req.files?.question_bg_image ? `/uploads/images/${req.files.question_bg_image[0].filename}` : null;
    const [result] = await db.query(
      `INSERT INTO questions (game_id, question_text, question_image_url, question_bg_image_url, question_type, question_color, question_order, num_options, sound_correct, sound_wrong, sound_neutral, sound_correct_id, sound_wrong_id, sound_neutral_id, overlay_duration, overlay_idle_time, overlay_animation_in, overlay_animation_out, question_image_animation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.gameId, question_text, img_url, bg_url, question_type || 'right_wrong', question_color || '#1a1a2e', question_order || 0, num_options || 4,
       sound_correct, sound_wrong, sound_neutral, sound_correct_id || null, sound_wrong_id || null, sound_neutral_id || null,
       overlay_duration || 3, overlay_idle_time || 3, overlay_animation_in || 'flyFromBottom', overlay_animation_out || 'flyToTop',
       question_image_animation || 'float']
    );
    const [q] = await db.query('SELECT * FROM questions WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, question: { ...q[0], options: [] } });
  } catch (err) { sendError(res, err); }
});

router.put('/questions/:id', auth, upload.fields([
  { name: 'question_image', maxCount: 1 },
  { name: 'question_bg_image', maxCount: 1 }
]), async (req, res) => {
  const { question_text, question_type, question_color, question_order, num_options,
    sound_correct, sound_wrong, sound_neutral, sound_correct_id, sound_wrong_id, sound_neutral_id,
    overlay_duration, overlay_idle_time, overlay_animation_in, overlay_animation_out,
    question_image_animation, answer_text, answer_is_number } = req.body;
  const toIntOrNull = (v) => (v === '' || v === null || v === undefined) ? null : parseInt(v, 10);
  const toInt = (v, d = 0) => (v === '' || v === null || v === undefined) ? d : parseInt(v, 10);
  try {
    const [existing] = await db.query('SELECT * FROM questions WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Question not found' });

    // Delete old image from disk if a new one is being uploaded
    let img_url;
    if (req.files?.question_image) {
      deleteUploadFile(existing[0].question_image_url);
      img_url = `/uploads/images/${req.files.question_image[0].filename}`;
    } else {
      img_url = existing[0].question_image_url;
    }

    let bg_url;
    if (req.files?.question_bg_image) {
      deleteUploadFile(existing[0].question_bg_image_url);
      bg_url = `/uploads/images/${req.files.question_bg_image[0].filename}`;
    } else {
      bg_url = existing[0].question_bg_image_url;
    }

    await db.query(
      `UPDATE questions SET question_text=?, question_image_url=?, question_bg_image_url=?, question_type=?, question_color=?, question_order=?, num_options=?,
       sound_correct=?, sound_wrong=?, sound_neutral=?, sound_correct_id=?, sound_wrong_id=?, sound_neutral_id=?,
       overlay_duration=?, overlay_idle_time=?, overlay_animation_in=?, overlay_animation_out=?,
       question_image_animation=?, answer_text=?, answer_is_number=? WHERE id=?`,
       [question_text, img_url, bg_url, question_type, question_color, question_order, toInt(num_options),
        sound_correct, sound_wrong, sound_neutral, toIntOrNull(sound_correct_id), toIntOrNull(sound_wrong_id), toIntOrNull(sound_neutral_id),
        toInt(overlay_duration, 3), toInt(overlay_idle_time, 3), overlay_animation_in, overlay_animation_out,
        question_image_animation, answer_text || null, answer_is_number ? 1 : 0, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM questions WHERE id = ?', [req.params.id]);
    const [options] = await db.query('SELECT * FROM options WHERE question_id = ? ORDER BY option_order', [req.params.id]);
    res.json({ success: true, question: { ...updated[0], options } });
  } catch (err) { sendError(res, err); }
});

router.delete('/questions/:id', auth, async (req, res) => {
  try {
    // Fetch question and its options before deleting so we can clean up files
    const [existing] = await db.query('SELECT * FROM questions WHERE id = ?', [req.params.id]);
    if (existing[0]) {
      deleteUploadFile(existing[0].question_image_url);
      deleteUploadFile(existing[0].question_bg_image_url);
      const [options] = await db.query('SELECT * FROM options WHERE question_id = ?', [req.params.id]);
      for (const opt of options) {
        deleteUploadFile(opt.option_image_url);
        deleteUploadFile(opt.option_overlay_image_url);
      }
    }
    await db.query('DELETE FROM questions WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Question deleted' });
  } catch (err) { sendError(res, err); }
});

// POST duplicate a question with all its options
router.post('/questions/:id/duplicate', auth, async (req, res) => {
  try {
    const [src] = await db.query('SELECT * FROM questions WHERE id = ?', [req.params.id]);
    if (!src.length) return res.status(404).json({ success: false, message: 'Question not found' });
    const q = src[0];

    // Shift later questions down
    await db.query('UPDATE questions SET question_order = question_order + 1 WHERE game_id = ? AND question_order > ?', [q.game_id, q.question_order]);

    const [qr] = await db.query(
      `INSERT INTO questions (game_id, question_text, question_image_url, question_bg_image_url, question_type, question_color, question_order, num_options, sound_correct, sound_wrong, sound_neutral, sound_correct_id, sound_wrong_id, sound_neutral_id, overlay_duration, overlay_idle_time, overlay_animation_in, overlay_animation_out, question_image_animation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [q.game_id, q.question_text + ' (copy of)', q.question_image_url, q.question_bg_image_url, q.question_type, q.question_color, q.question_order + 1, q.num_options,
       q.sound_correct, q.sound_wrong, q.sound_neutral, q.sound_correct_id, q.sound_wrong_id, q.sound_neutral_id,
       q.overlay_duration, q.overlay_idle_time, q.overlay_animation_in, q.overlay_animation_out, q.question_image_animation]
    );
    const newQId = qr.insertId;

    // Clone options
    const [options] = await db.query('SELECT * FROM options WHERE question_id = ? ORDER BY option_order', [q.id]);
    for (const o of options) {
      await db.query(
        'INSERT INTO options (question_id, option_text, option_image_url, option_overlay_image_url, option_color, option_text_color, is_correct, option_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [newQId, o.option_text, o.option_image_url, o.option_overlay_image_url, o.option_color, o.option_text_color, o.is_correct, o.option_order]
      );
    }

    const [newQ] = await db.query('SELECT * FROM questions WHERE id = ?', [newQId]);
    const [newOpts] = await db.query('SELECT * FROM options WHERE question_id = ? ORDER BY option_order', [newQId]);
    res.status(201).json({ success: true, question: { ...newQ[0], options: newOpts } });
  } catch (err) { sendError(res, err); }
});

router.post('/games/:gameId/questions/reorder', auth, async (req, res) => {
  const { order } = req.body;
  try {
    for (const item of order) {
      await db.query('UPDATE questions SET question_order = ? WHERE id = ?', [item.question_order, item.id]);
    }
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

router.post('/questions/:questionId/options', auth, upload.fields([
  { name: 'option_image', maxCount: 1 },
  { name: 'option_overlay_image', maxCount: 1 }
]), async (req, res) => {
  const { option_text, option_color, option_text_color, is_correct, option_order } = req.body;
  try {
    // FIX: Properly parse is_correct from string form data ("0", "1", "true", "false")
    const isCorrectBool = is_correct === 1 || is_correct === true || is_correct === '1' || is_correct === 'true';
    const img_url = req.files?.option_image ? `/uploads/images/${req.files.option_image[0].filename}` : null;
    const overlay_url = req.files?.option_overlay_image ? `/uploads/images/${req.files.option_overlay_image[0].filename}` : null;
    const [result] = await db.query(
      'INSERT INTO options (question_id, option_text, option_image_url, option_overlay_image_url, option_color, option_text_color, is_correct, option_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.params.questionId, option_text, img_url, overlay_url, option_color || '#1a1a2e', option_text_color || '#ffffff', isCorrectBool ? 1 : 0, option_order || 0]
    );
    const [opt] = await db.query('SELECT * FROM options WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, option: opt[0] });
  } catch (err) { sendError(res, err); }
});

router.put('/options/:id', auth, upload.fields([
  { name: 'option_image', maxCount: 1 },
  { name: 'option_overlay_image', maxCount: 1 }
]), async (req, res) => {
  const { option_text, option_color, option_text_color, is_correct, option_order } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM options WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Option not found' });

    // FIX: Properly parse is_correct — req.body values are always strings when sent as form data.
    const isCorrectBool = is_correct === 1 || is_correct === true || is_correct === '1' || is_correct === 'true';

    // If marking this option as correct, unmark all other options in the same question
    if (isCorrectBool) {
      await db.query('UPDATE options SET is_correct = 0 WHERE question_id = ? AND id != ?', [existing[0].question_id, req.params.id]);
    }

    // Delete old image from disk if a new one is being uploaded
    let img_url;
    if (req.files?.option_image) {
      deleteUploadFile(existing[0].option_image_url);
      img_url = `/uploads/images/${req.files.option_image[0].filename}`;
    } else {
      img_url = existing[0].option_image_url;
    }

    let overlay_url;
    if (req.files?.option_overlay_image) {
      deleteUploadFile(existing[0].option_overlay_image_url);
      overlay_url = `/uploads/images/${req.files.option_overlay_image[0].filename}`;
    } else {
      overlay_url = existing[0].option_overlay_image_url;
    }

    await db.query(
      'UPDATE options SET option_text=?, option_image_url=?, option_overlay_image_url=?, option_color=?, option_text_color=?, is_correct=?, option_order=? WHERE id=?',
      [option_text, img_url, overlay_url, option_color, option_text_color || existing[0].option_text_color || '#ffffff', isCorrectBool ? 1 : 0, option_order, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM options WHERE id = ?', [req.params.id]);
    res.json({ success: true, option: updated[0] });
  } catch (err) { sendError(res, err); }
});

router.delete('/options/:id', auth, async (req, res) => {
  try {
    // Fetch option before deleting so we can clean up its files
    const [existing] = await db.query('SELECT * FROM options WHERE id = ?', [req.params.id]);
    if (existing[0]) {
      deleteUploadFile(existing[0].option_image_url);
      deleteUploadFile(existing[0].option_overlay_image_url);
    }
    await db.query('DELETE FROM options WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
