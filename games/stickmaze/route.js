const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const auth = require('../../apps/backend/middleware/auth');
const { sendError } = require('../../apps/backend/lib/apiError');
const { awardLevelCompletionReward } = require('../../apps/backend/lib/promocoins');

router.get('/:gameId/settings', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM stickmaze_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/:gameId/settings', auth, async (req, res) => {
  const {
    total_levels, grid_size_min, grid_size_max,
    show_timer, time_limit_seconds,
    collectible_count, collectible_label, collectible_images,
    heading_1, heading_2, heading_3, description_text,
    heading_1_color, heading_2_color, heading_3_color, description_color,
    bg_color, primary_color, font_family,
    wall_color, path_color,
    sound_collect_id, sound_complete_id,
    overlay_animation_in, overlay_animation_out,
    intro_text, outro_text, submit_button_text, continue_button_text, start_button_text,
    terms_enabled, terms_text, terms_url, meta_description,
  } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM stickmaze_settings WHERE game_id = ?', [req.params.gameId]);
    const e = existing[0] || {};
    const n = (v, fb) => v !== undefined && v !== '' ? Number(v) : fb;
    const field = (v, fb) => v !== undefined ? v : fb;

    const fields = {
      total_levels: n(total_levels, e.total_levels || 50),
      grid_size_min: n(grid_size_min, e.grid_size_min || 5),
      grid_size_max: n(grid_size_max, e.grid_size_max || 20),
      show_timer: n(show_timer, e.show_timer !== undefined ? e.show_timer : 1),
      time_limit_seconds: n(time_limit_seconds, e.time_limit_seconds || 0),
      collectible_count: n(collectible_count, e.collectible_count || 3),
      collectible_label: field(collectible_label, e.collectible_label || '★'),
      collectible_images: field(collectible_images, e.collectible_images || null),
      heading_1: field(heading_1, e.heading_1 || null),
      heading_2: field(heading_2, e.heading_2 || null),
      heading_3: field(heading_3, e.heading_3 || null),
      description_text: field(description_text, e.description_text || null),
      heading_1_color: heading_1_color || e.heading_1_color || '#1a1a2e',
      heading_2_color: heading_2_color || e.heading_2_color || '#666666',
      heading_3_color: heading_3_color || e.heading_3_color || '#777777',
      description_color: description_color || e.description_color || '#888888',
      bg_color: bg_color || e.bg_color || '#0f172a',
      primary_color: primary_color || e.primary_color || '#6366f1',
      wall_color: wall_color || e.wall_color || '#64748b',
      path_color: path_color || e.path_color || '#ffffff',
      font_family: font_family || e.font_family || 'DM Sans',
      sound_collect_id: sound_collect_id !== undefined && sound_collect_id !== '' ? Number(sound_collect_id) : (e.sound_collect_id || null),
      sound_complete_id: sound_complete_id !== undefined && sound_complete_id !== '' ? Number(sound_complete_id) : (e.sound_complete_id || null),
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
        `INSERT INTO stickmaze_settings (game_id,${keys.join(',')}) VALUES (?,${keys.map(() => '?').join(',')})`,
        [req.params.gameId, ...Object.values(fields)]
      );
    } else {
      const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
      await db.query(
        `UPDATE stickmaze_settings SET ${sets} WHERE game_id=?`,
        [...Object.values(fields), req.params.gameId]
      );
    }

    const [updated] = await db.query('SELECT * FROM stickmaze_settings WHERE game_id = ?', [req.params.gameId]);
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

function generateMaze(rows, cols, seed) {
  const rng = seededRandom(seed);
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ n: true, s: true, e: true, w: true }))
  );
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

  function carve(r, c) {
    visited[r][c] = true;
    const dirs = [[-1,0,'n','s'],[1,0,'s','n'],[0,-1,'w','e'],[0,1,'e','w']];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    for (const [dr, dc, wall, opp] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
        grid[r][c][wall] = false;
        grid[nr][nc][opp] = false;
        carve(nr, nc);
      }
    }
  }
  carve(0, 0);
  return grid;
}

function getMazeSize(level, min, max) {
  const s = Math.min(min + Math.floor(level / 5), max);
  return Math.max(min, Math.min(s, max));
}

router.get('/:gameId/generate', auth, async (req, res) => {
  try {
    const level = parseInt(req.query.level) || 1;
    const sessionToken = req.query.session_token || '';
    const [rows] = await db.query('SELECT * FROM stickmaze_settings WHERE game_id = ?', [req.params.gameId]);
    const s = rows[0] || {};
    const min = parseInt(s.grid_size_min) || 5;
    const max = parseInt(s.grid_size_max) || 20;
    const size = getMazeSize(level, min, max);
    const seed = parseInt(req.params.gameId) * 1000 + level + (sessionToken ? sessionToken.charCodeAt(0) : 0);
    const maze = generateMaze(size, size, seed);
    const collectibleCount = Math.min(parseInt(s.collectible_count) || 3, size * size - 2);
    const rng = seededRandom(seed + 999);
    const collectibles = [];
    const taken = new Set();
    taken.add('0,0');
    taken.add(`${size-1},${size-1}`);
    while (collectibles.length < collectibleCount) {
      const cr = Math.floor(rng() * size);
      const cc = Math.floor(rng() * size);
      const key = `${cr},${cc}`;
      if (!taken.has(key)) {
        taken.add(key);
        collectibles.push({ r: cr, c: cc });
      }
    }
    res.json({ success: true, maze, size, level, collectibles });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/:gameId/progress', auth, async (req, res) => {
  const { session_token, level, completed, time_spent, collectibles_found } = req.body;
  try {
    const [existing] = await db.query(
      'SELECT * FROM stickmaze_progress WHERE game_id = ? AND session_token = ?',
      [req.params.gameId, session_token]
    );
    if (existing.length > 0) {
      const p = existing[0];
      const comp = JSON.parse(p.completed_levels || '[]');
      if (completed && !comp.includes(level)) comp.push(level);
      const nextLevel = completed ? level + 1 : level;
      await db.query(
        'UPDATE stickmaze_progress SET current_level = ?, completed_levels = ?, total_collectibles = total_collectibles + ?, best_time = LEAST(COALESCE(best_time, ?), ?), last_played_at = NOW() WHERE id = ?',
        [nextLevel, JSON.stringify(comp), collectibles_found || 0, time_spent || 0, time_spent || 0, p.id]
      );
      const [updated] = await db.query('SELECT * FROM stickmaze_progress WHERE id = ?', [p.id]);
      // ── Auto-reward: every newly completed level earns PromoCoins ──
      const pc_reward = completed ? await awardLevelCompletionReward({ sessionToken: session_token, level }) : null;
      return res.json({ success: true, progress: updated[0], pc_reward });
    }
    const comp = completed ? JSON.stringify([level]) : '[]';
    const [result] = await db.query(
      'INSERT INTO stickmaze_progress (game_id, session_token, current_level, completed_levels, total_collectibles, best_time) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.gameId, session_token, completed ? level + 1 : level, comp, collectibles_found || 0, time_spent || 0]
    );
    const [row] = await db.query('SELECT * FROM stickmaze_progress WHERE id = ?', [result.insertId]);
    // ── Auto-reward: every newly completed level earns PromoCoins ──
    const pc_reward = completed ? await awardLevelCompletionReward({ sessionToken: session_token, level }) : null;
    res.json({ success: true, progress: row[0], pc_reward });
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/:gameId/progress', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM stickmaze_progress WHERE game_id = ? AND session_token = ?',
      [req.params.gameId, req.query.session_token]
    );
    res.json({ success: true, progress: rows[0] || null });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
