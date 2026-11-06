const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const { sendError } = require('../../apps/backend/lib/apiError');

router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM math_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/:gameId/settings', auth, async (req, res) => {
  const {
    total_levels, questions_per_level,
    operations, number_range_start, number_range_end,
    allow_negative, show_timer, time_per_question,
    pass_threshold, heading_1, heading_2, heading_3, description_text,
    heading_1_color, heading_2_color, heading_3_color, description_color,
    bg_color, primary_color, font_family,
    sound_correct_id, sound_wrong_id,
    overlay_animation_in, overlay_animation_out,
    intro_text, outro_text, submit_button_text, continue_button_text, start_button_text,
    terms_enabled, terms_text, terms_url, meta_description,
  } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM math_settings WHERE game_id = ?', [req.params.gameId]);
    const e = existing[0] || {};
    const n = (v, fb) => v !== undefined && v !== '' ? Number(v) : fb;
    const field = (v, fb) => v !== undefined ? v : fb;

    const fields = {
      total_levels: n(total_levels, e.total_levels || 100),
      questions_per_level: n(questions_per_level, e.questions_per_level || 5),
      operations: field(operations, e.operations || '+,-,×'),
      number_range_start: n(number_range_start, e.number_range_start || 1),
      number_range_end: n(number_range_end, e.number_range_end || 100),
      allow_negative: n(allow_negative, e.allow_negative !== undefined ? e.allow_negative : 0),
      show_timer: n(show_timer, e.show_timer !== undefined ? e.show_timer : 1),
      time_per_question: n(time_per_question, e.time_per_question || 0),
      pass_threshold: n(pass_threshold, e.pass_threshold || 5),
      heading_1: field(heading_1, e.heading_1 || null),
      heading_2: field(heading_2, e.heading_2 || null),
      heading_3: field(heading_3, e.heading_3 || null),
      description_text: field(description_text, e.description_text || null),
      heading_1_color: heading_1_color || e.heading_1_color || '#1a1a2e',
      heading_2_color: heading_2_color || e.heading_2_color || '#666666',
      heading_3_color: heading_3_color || e.heading_3_color || '#777777',
      description_color: description_color || e.description_color || '#888888',
      bg_color: bg_color || e.bg_color || '#f0fdf4',
      primary_color: primary_color || e.primary_color || '#22c55e',
      font_family: font_family || e.font_family || 'DM Sans',
      sound_correct_id: sound_correct_id !== undefined && sound_correct_id !== '' ? Number(sound_correct_id) : (e.sound_correct_id || null),
      sound_wrong_id: sound_wrong_id !== undefined && sound_wrong_id !== '' ? Number(sound_wrong_id) : (e.sound_wrong_id || null),
      overlay_animation_in: overlay_animation_in || e.overlay_animation_in || 'flyFromBottom',
      overlay_animation_out: overlay_animation_out || e.overlay_animation_out || 'flyToTop',
      intro_text: field(intro_text, e.intro_text || null),
      outro_text: field(outro_text, e.outro_text || null),
      submit_button_text: field(submit_button_text, e.submit_button_text || null),
      continue_button_text: field(continue_button_text, e.continue_button_text || null),
      start_button_text: field(start_button_text, e.start_button_text || null),
      terms_enabled: n(terms_enabled, e.terms_enabled || 0),
      terms_text: field(terms_text, e.terms_text || null),
      terms_url: field(terms_url, e.terms_url || null),
      meta_description: field(meta_description, e.meta_description || null),
    };

    if (existing.length === 0) {
      const keys = Object.keys(fields);
      await db.query(
        `INSERT INTO math_settings (game_id,${keys.join(',')}) VALUES (?,${keys.map(() => '?').join(',')})`,
        [req.params.gameId, ...Object.values(fields)]
      );
    } else {
      const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
      await db.query(
        `UPDATE math_settings SET ${sets} WHERE game_id=?`,
        [...Object.values(fields), req.params.gameId]
      );
    }

    const [updated] = await db.query('SELECT * FROM math_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    sendError(res, err);
  }
});

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = s * 16807 % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateQuestion(gameId, level, qIndex, sessionToken, ops, rangeStart, rangeEnd, allowNeg) {
  const seed = gameId * 100000 + level * 100 + qIndex + (sessionToken ? sessionToken.charCodeAt(0) * 7 : 0);
  const rng = seededRandom(seed);
  const opList = ops.split(',').map(o => o.trim());
  const op = opList[Math.floor(rng() * opList.length)];
  const min = rangeStart || 1;
  const max = rangeEnd || 100;
  let a, b, answer;
  const isHard = level > 50;
  const range = isHard ? max : Math.min(max, 10 + level * 2);

  if (op === '+') {
    a = Math.floor(rng() * range) + min;
    b = Math.floor(rng() * range) + min;
    answer = a + b;
  } else if (op === '-') {
    a = Math.floor(rng() * range) + min;
    b = Math.floor(rng() * range) + min;
    if (!allowNeg && a < b) [a, b] = [b, a];
    answer = a - b;
  } else if (op === '×') {
    const maxFactor = isHard ? 12 : Math.min(9, 2 + Math.floor(level / 10));
    a = Math.floor(rng() * maxFactor) + 1;
    b = Math.floor(rng() * Math.min(maxFactor, 10 + Math.floor(level / 5))) + 1;
    answer = a * b;
  } else if (op === '÷') {
    b = Math.floor(rng() * 9) + 1;
    answer = Math.floor(rng() * Math.min(range, 20)) + 1;
    a = b * answer;
  } else {
    a = Math.floor(rng() * range) + min;
    b = Math.floor(rng() * range) + min;
    answer = a + b;
  }

  const options = new Set([answer]);
  const maxAttempts = 50;
  let attempts = 0;
  while (options.size < 4 && attempts < maxAttempts) {
    const offset = Math.floor(rng() * Math.max(1, Math.abs(answer) + 5)) + 1;
    const sign = rng() > 0.5 ? 1 : -1;
    const distractor = answer + offset * sign;
    if (distractor !== answer) options.add(distractor);
    attempts++;
  }
  if (options.size < 4) {
    const fallbacks = [answer + 1, answer - 1, answer + 2, answer - 2];
    for (const fb of fallbacks) {
      if (options.size >= 4) break;
      options.add(fb);
    }
  }
  const optArr = Array.from(options);
  for (let i = optArr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [optArr[i], optArr[j]] = [optArr[j], optArr[i]];
  }
  const questionLabel = level > 50 && qIndex === 0
    ? `Level ${level} — Challenge Round`
    : `Level ${level} · Question ${qIndex + 1}`;

  return {
    level,
    q_index: qIndex,
    operand_a: a,
    operand_b: b,
    operator: op,
    answer,
    options: optArr.slice(0, 4),
    label: questionLabel,
  };
}

router.get('/:gameId/question', auth, async (req, res) => {
  try {
    const level = parseInt(req.query.level) || 1;
    const qIndex = parseInt(req.query.q_index) || 0;
    const sessionToken = req.query.session_token || '';
    const [settings] = await db.query('SELECT * FROM math_settings WHERE game_id = ?', [req.params.gameId]);
    if (!settings[0]) return res.status(404).json({ success: false, message: 'Settings not found' });
    const s = settings[0];
    const q = generateQuestion(
      parseInt(req.params.gameId), level, qIndex, sessionToken,
      s.operations, s.number_range_start, s.number_range_end, s.allow_negative
    );
    res.json({ success: true, question: q });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/:gameId/progress', auth, async (req, res) => {
  const { session_token, level, question_index, correct, score_data } = req.body;
  try {
    const [existing] = await db.query(
      'SELECT * FROM math_progress WHERE game_id = ? AND session_token = ?',
      [req.params.gameId, session_token]
    );
    if (existing.length > 0) {
      const p = existing[0];
      const completed = JSON.parse(p.completed_levels || '[]');
      if (correct && question_index >= 0 && !completed.includes(level)) {
        await db.query(
          'UPDATE math_progress SET current_question = ?, total_correct = total_correct + 1, last_played_at = NOW() WHERE id = ?',
          [question_index + 1, p.id]
        );
      }
      const [updated] = await db.query(
        'SELECT * FROM math_progress WHERE id = ?', [p.id]
      );
      return res.json({ success: true, progress: updated[0] });
    }
    const completed = correct && question_index >= 0 ? JSON.stringify([level]) : '[]';
    const [result] = await db.query(
      'INSERT INTO math_progress (game_id, session_token, current_level, current_question, total_correct, completed_levels) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.gameId, session_token, level, correct ? question_index + 1 : 0, correct ? 1 : 0, completed]
    );
    const [row] = await db.query('SELECT * FROM math_progress WHERE id = ?', [result.insertId]);
    res.json({ success: true, progress: row[0] });
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/:gameId/progress', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM math_progress WHERE game_id = ? AND session_token = ?',
      [req.params.gameId, req.query.session_token]
    );
    res.json({ success: true, progress: rows[0] || null });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/:gameId/level-complete', auth, async (req, res) => {
  const { session_token, level } = req.body;
  try {
    const [existing] = await db.query(
      'SELECT * FROM math_progress WHERE game_id = ? AND session_token = ?',
      [req.params.gameId, session_token]
    );
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Progress not found' });
    const p = existing[0];
    const completed = JSON.parse(p.completed_levels || '[]');
    if (!completed.includes(level)) completed.push(level);
    const nextLevel = level + 1;
    await db.query(
      'UPDATE math_progress SET current_level = ?, current_question = 0, total_correct = total_correct + ?, completed_levels = ?, last_played_at = NOW() WHERE id = ?',
      [nextLevel, p.questions_per_level || 5, JSON.stringify(completed), p.id]
    );
    const [updated] = await db.query('SELECT * FROM math_progress WHERE id = ?', [p.id]);
    const [settings] = await db.query('SELECT total_levels FROM math_settings WHERE game_id = ?', [req.params.gameId]);
    const totalLevels = settings[0]?.total_levels || 100;
    const gameOver = nextLevel > totalLevels;
    res.json({ success: true, progress: updated[0], nextLevel, gameOver });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
