const express = require('express');
const router = express.Router();
const db = require('../config/db');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { sendError } = require('../lib/apiError');
const { awardGameCompletionReward } = require('../lib/promocoins');
const jwt = require('jsonwebtoken');

// ── Player engagement helpers ────────────────────────────────────────────────
// Resolve the promo player from an optional Authorization: Bearer <playerToken>.
// Returns null for guests / invalid tokens — never throws.
function getPromoPlayerId(req) {
  try {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer ')) return null;
    const payload = jwt.verify(h.slice(7), process.env.JWT_SECRET);
    return payload.id || null;
  } catch {
    return null;
  }
}

// Upsert per-player best score (GREATEST) + all-time high score.
// Identity is either a logged-in player (player_id) or a guest (device_id).
// player_best_scores schema: player_id, device_id, game_id, best_score, updated_at.
async function recordBestScore({ promoPlayerId, deviceId }, gameId, finalScore) {
  let playerId = promoPlayerId || null;
  // A logged-in player's best is stored on their promo_players.id (player_id);
  // a guest's is stored on their persistent device_id.
  const idCol = playerId ? 'player_id' : 'device_id';
  const idVal = playerId ? playerId : deviceId;
  if (!idVal) {
    await db.query('UPDATE games SET high_score = GREATEST(COALESCE(high_score, 0), ?) WHERE id = ?', [finalScore, gameId]);
    return { player_best: null, high_score: finalScore, is_new_best: false };
  }

  const [existing] = await db.query(
    `SELECT best_score FROM player_best_scores WHERE ${idCol} = ? AND game_id = ?`,
    [idVal, gameId]
  );

  if (existing.length > 0) {
    await db.query(
      `UPDATE player_best_scores SET best_score = GREATEST(best_score, ?), updated_at = CURRENT_TIMESTAMP WHERE ${idCol} = ? AND game_id = ?`,
      [finalScore, idVal, gameId]
    );
  } else {
    await db.query(
      `INSERT INTO player_best_scores (player_id, device_id, game_id, best_score)
       VALUES (?, ?, ?, ?)`,
      [playerId, playerId ? null : deviceId, gameId, finalScore]
    );
  }

  const prevBest = existing.length ? existing[0].best_score : 0;
  await db.query('UPDATE games SET high_score = GREATEST(COALESCE(high_score, 0), ?) WHERE id = ?', [finalScore, gameId]);
  const [hs] = await db.query('SELECT high_score FROM games WHERE id = ?', [gameId]);
  return {
    player_best: Math.max(prevBest, finalScore),
    high_score: hs[0]?.high_score || finalScore,
    is_new_best: finalScore > prevBest,
  };
}

// Award Promo Coins for a completed session once — handled by the central
// transactional service (lib/promocoins.js) which enforces idempotency via a
// row lock + the pc_transactions(session_id, type) unique index.

// GET /api/play/game-data/:gameId — full game payload for the Flutter app
// MUST be before /:gameName/:companyName catch-all
router.get('/game-data/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const [gameRows] = await db.query(
      `SELECT g.id, g.name, g.slug, g.category, g.game_type, g.description, g.redirect_url,
              g.show_in_play_page, g.is_active, g.status, g.intro_video_url,
              c.slug as client_slug, c.company_name
       FROM games g JOIN clients c ON g.client_id = c.id
       WHERE g.id = ?`, [gameId]
    );
    if (gameRows.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });
    const game = gameRows[0];

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const toAbs = (url) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      return `${baseUrl}${url}`;
    };

    const categorySettingsMap = {
      quiz: 'quiz_settings', crossword: 'crossword_settings', spin: 'spin_settings',
      memory: 'memory_settings', jigsaw: 'jigsaw_settings', wordsearch: 'wordsearch_settings',
      pouring: 'pouring_settings', typer: 'typer_settings', screw: 'screw_settings', tower: 'tower_settings',
      math: 'math_settings', maze: 'maze_settings', classicmaze: 'maze_settings', stickmaze: 'stickmaze_settings', '2048': 'game2048_settings',
      snake: 'snake_settings', nagaraja: 'nagaraja_settings', catch: 'catch_settings', reaction: 'reaction_settings',
      simon: 'simon_settings', connect4: 'connect4_settings', flappy: 'flappy_settings',
      bounce: 'bounce_settings', space: 'space_settings', bejeweled: 'bejeweled_settings',
      tetris: 'tetris_settings', stack: 'stack_settings', whackamole: 'whackamole_settings',
      hanoi: 'hanoi_settings', breakout: 'breakout_settings', bubbleshooter: 'bubbleshooter_settings',
      carlaunch: 'carlaunch_settings', tictactoe: 'tictactoe_settings', stressbuster: 'stressbuster_settings',
      soundify: 'soundify_settings', arrowescape: 'arrowescape_settings', bowling: 'bowling_settings',
      sudoku: 'sudoku_settings', minesweeper: 'minesweeper_settings', wordscramble: 'wordscramble_settings',
      rps: 'rps_settings',
      snakeandladder: 'snake_ladder_settings', ludo: 'ludo_settings',
      Carrom: 'Carrom_settings', carrom: 'Carrom_settings', tictactoemultiplayer: 'tictactoe_multi_settings',
      spotregistration: 'spotreg_settings',
    };

    let settings = {};
    const settingsTable = categorySettingsMap[game.category];
    if (settingsTable) {
      const [rows] = await db.query(`SELECT * FROM ${settingsTable} WHERE game_id = ?`, [gameId]);
      if (rows[0]) settings = { ...rows[0] };
      for (const f of ['bg_image_url','thankyou_bg_image_url','game_logo_url','submit_confirm_gif_url',
        'o_image_url','puzzle_image_url','reveal_image_url','overlay_image_url','card_cover_image_url','gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }
      if (settings.tile_colors && typeof settings.tile_colors === 'string') {
        try { settings.tile_colors = JSON.parse(settings.tile_colors); } catch {}
      }
    } else if (game.category === 'quiz') {
      const [rows] = await db.query('SELECT * FROM quiz_settings WHERE game_id = ? ORDER BY id DESC LIMIT 1', [gameId]);
      if (rows[0]) settings = { ...rows[0] };
      for (const f of ['bg_image_url','thankyou_bg_image_url','game_logo_url','submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }
    }

    let questions = [];
    if (game.category === 'quiz' || !categorySettingsMap[game.category]) {
      const [qRows] = await db.query('SELECT * FROM questions WHERE game_id = ? ORDER BY question_order', [gameId]);
      for (const q of qRows) {
        const [opts] = await db.query('SELECT * FROM options WHERE question_id = ? ORDER BY option_order', [q.id]);
        q.options = opts;
        for (const f of ['question_image_url','question_bg_image_url']) {
          if (q[f]) q[f] = toAbs(q[f]);
        }
        for (const opt of q.options) {
          for (const f of ['option_image_url','option_overlay_image_url']) {
            if (opt[f]) opt[f] = toAbs(opt[f]);
          }
        }
      }
      questions = qRows;
    }

    let words = [];
    if (game.category === 'crossword') {
      const [wRows] = await db.query('SELECT * FROM crossword_words WHERE game_id = ? ORDER BY word_order', [gameId]);
      words = wRows;
    } else if (game.category === 'wordsearch') {
      const [wRows] = await db.query('SELECT * FROM wordsearch_words WHERE game_id = ? ORDER BY word_order', [gameId]);
      words = wRows;
    } else if (game.category === 'wordscramble') {
      const [wRows] = await db.query('SELECT * FROM wordscramble_words WHERE game_id = ? ORDER BY word_order', [gameId]);
      words = wRows;
    } else if (game.category === 'typer') {
      const [wRows] = await db.query('SELECT * FROM typer_words WHERE game_id = ? ORDER BY word_order', [gameId]);
      words = wRows;
    }

    let tiles = [];
    if (game.category === 'memory') {
      const [tRows] = await db.query('SELECT * FROM memory_tiles WHERE game_id = ? ORDER BY tile_order', [gameId]);
      tiles = tRows.map(t => { if (t.image_url) t.image_url = toAbs(t.image_url); return t; });
    }

    let segments = [];
    if (game.category === 'spin') {
      const [sRows] = await db.query('SELECT * FROM spin_segments WHERE game_id = ? ORDER BY segment_order', [gameId]);
      segments = sRows.map(s => {
        s.coupon_image_url = toAbs(s.coupon_image_url);
        s.overlay_image_url = toAbs(s.overlay_image_url);
        return s;
      });
    }

    const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [gameId]);
    const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [gameId]);
    const soundMap = {};
    for (const s of sounds) soundMap[s.id] = toAbs(s.url);

    res.json({
      success: true,
      game: {
        id: game.id, name: game.name, category: game.category,
        description: game.description, redirect_url: game.redirect_url,
        client_slug: game.client_slug, company_name: game.company_name,
        game_type: game.game_type, status: game.status, force_login: game.force_login,
        settings, questions, words, tiles, segments, formFields, soundMap,
      },
    });
  } catch (err) {
    console.error('GET game-data error:', err);
    sendError(res, err);
  }
});

router.get('/:gameName/:companyName', async (req, res) => {
  try {
    const [allRows] = await db.query(`
      SELECT g.*, c.company_name, c.slug as client_slug, c.logo_url as client_logo
      FROM games g LEFT JOIN clients c ON g.client_id = c.id
      WHERE g.slug = ? AND (c.slug = ? OR c.slug IS NULL)
    `, [req.params.gameName, req.params.companyName]);

    if (allRows.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });
    if (!allRows[0].is_active) return res.status(403).json({ success: false, message: 'This game is currently inactive' });

    const game = allRows[0];

    // Expose the all-time (global) high score to every game payload so game
    // player pages can show the true record instead of a per-player best.
    const _sendJson = res.json.bind(res);
    res.json = (body) => {
      if (body && typeof body === 'object' && body.game && typeof body.game.high_score !== 'number') {
        body.game.high_score = Number(game.high_score) || 0;
      }
      return _sendJson(body);
    };

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const toAbs = (url) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      return `${baseUrl}${url}`;
    };

    // ── CROSSWORD branch ──────────────────────────────────────────────────────
    if (game.category === 'crossword') {
      const [cwSettings] = await db.query(
        'SELECT * FROM crossword_settings WHERE game_id = ?', [game.id]
      );
      const [cwWords] = await db.query(
        'SELECT * FROM crossword_words WHERE game_id = ? ORDER BY word_order', [game.id]
      );
      const [cwFormFields] = await db.query(
        'SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]
      );
      const [sounds] = await db.query(
        'SELECT * FROM sounds WHERE game_id = ?', [game.id]
      );

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = cwSettings[0] ? { ...cwSettings[0] } : {};
      // Default allow_hints to 1 if not set
      if (settings.allow_hints === undefined || settings.allow_hints === null) {
        settings.allow_hints = 1;
      }
      // normalise image urls
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          words: cwWords,
          soundMap,
          // crossword form fields
          formFields: cwFormFields,
          questions: [],
        },
      });
    }

    // ── SPIN branch ───────────────────────────────────────────────────────────
    if (game.category === 'spin') {
      const [spinSettings] = await db.query(
        'SELECT * FROM spin_settings WHERE game_id = ?', [game.id]
      );
      const [spinSegments] = await db.query(
        'SELECT * FROM spin_segments WHERE game_id = ? ORDER BY segment_order', [game.id]
      );
      const [formFields] = await db.query(
        'SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]
      );
      const [sounds] = await db.query(
        'SELECT * FROM sounds WHERE game_id = ?', [game.id]
      );

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = spinSettings[0] ? { ...spinSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }
      for (const seg of spinSegments) {
        seg.coupon_image_url  = toAbs(seg.coupon_image_url);
        seg.overlay_image_url = toAbs(seg.overlay_image_url);
      }

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          segments: spinSegments,
          formFields,
          soundMap,
          questions: [],
        },
      });
    }

    // ── MEMORY branch ─────────────────────────────────────────────────────────
    if (game.category === 'memory') {
      const [memSettings] = await db.query(
        'SELECT * FROM memory_settings WHERE game_id = ?', [game.id]
      );
      const [memTiles] = await db.query(
        'SELECT * FROM memory_tiles WHERE game_id = ? ORDER BY tile_order', [game.id]
      );
      const [formFields] = await db.query(
        'SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]
      );
      const [sounds] = await db.query(
        'SELECT * FROM sounds WHERE game_id = ?', [game.id]
      );

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = memSettings[0] ? { ...memSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'card_cover_image_url', 'overlay_image_url', 'gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          game_logo_url: toAbs(game.game_logo_url),
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          tiles: memTiles,
          formFields,
          soundMap,
          questions: [],
        },
      });
    }

    // ── JIGSAW branch ────────────────────────────────────────────────────────
    if (game.category === 'jigsaw') {
      const [jigSettings] = await db.query(
        'SELECT * FROM jigsaw_settings WHERE game_id = ?', [game.id]
      );
      const [formFields] = await db.query(
        'SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]
      );
      const [sounds] = await db.query(
        'SELECT * FROM sounds WHERE game_id = ?', [game.id]
      );

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = jigSettings[0] ? { ...jigSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'puzzle_image_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      // Normalize jigsaw thank-you fields to match what the shared Thank You page reads
      if (!settings.outro_text && settings.thankyou_heading_text) settings.outro_text = settings.thankyou_heading_text;
      if (!settings.thankyou_subtitle && settings.thankyou_subtitle_text) settings.thankyou_subtitle = settings.thankyou_subtitle_text;
      if (!settings.submit_button_text && settings.submit_btn_text) settings.submit_button_text = settings.submit_btn_text;
      if (!settings.submit_button_text_color && settings.submit_btn_text_color) settings.submit_button_text_color = settings.submit_btn_text_color;
      if (!settings.submit_button_bg_color && settings.submit_btn_bg_color) settings.submit_button_bg_color = settings.submit_btn_bg_color;
      if (!settings.continue_button_text && settings.continue_now_btn_text) settings.continue_button_text = settings.continue_now_btn_text;
      if (!settings.continue_button_text_color && settings.continue_now_btn_text_color) settings.continue_button_text_color = settings.continue_now_btn_text_color;
      if (!settings.continue_button_bg_color && settings.continue_now_btn_bg_color) settings.continue_button_bg_color = settings.continue_now_btn_bg_color;

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          formFields,
          soundMap,
          questions: [],
        },
      });
    }

    // ── WORD SEARCH branch ───────────────────────────────────────────────────
    if (game.category === 'wordsearch') {
      const [wsSettings] = await db.query(
        'SELECT * FROM wordsearch_settings WHERE game_id = ?', [game.id]
      );
      const [wsWords] = await db.query(
        'SELECT * FROM wordsearch_words WHERE game_id = ? ORDER BY word_order', [game.id]
      );
      const [formFields] = await db.query(
        'SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]
      );
      const [sounds] = await db.query(
        'SELECT * FROM sounds WHERE game_id = ?', [game.id]
      );

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = wsSettings[0] ? { ...wsSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          words: wsWords,
          formFields,
          soundMap,
          questions: [],
        },
      });
    }

    // ── POURING branch ──────────────────────────────────────────────────────
    if (game.category === 'pouring') {
      const [pourSettings] = await db.query(
        'SELECT * FROM pouring_settings WHERE game_id = ?', [game.id]
      );
      const [formFields] = await db.query(
        'SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]
      );
      const [sounds] = await db.query(
        'SELECT * FROM sounds WHERE game_id = ?', [game.id]
      );

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = pourSettings[0] ? { ...pourSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          formFields,
          soundMap,
          questions: [],
        },
      });
    }

    // ── TYPER branch ────────────────────────────────────────────────────────
    if (game.category === 'typer') {
      const [typerSettings] = await db.query(
        'SELECT * FROM typer_settings WHERE game_id = ?', [game.id]
      );
      const [typerWords] = await db.query(
        'SELECT * FROM typer_words WHERE game_id = ? ORDER BY word_order', [game.id]
      );
      const [formFields] = await db.query(
        'SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]
      );
      const [sounds] = await db.query(
        'SELECT * FROM sounds WHERE game_id = ?', [game.id]
      );

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = typerSettings[0] ? { ...typerSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          words: typerWords,
          formFields,
          soundMap,
          questions: [],
        },
      });
    }

    // ── MATH branch ─────────────────────────────────────────────────────────
    if (game.category === 'math') {
      const [mathSettings] = await db.query(
        'SELECT * FROM math_settings WHERE game_id = ?', [game.id]
      );
      const [formFields] = await db.query(
        'SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]
      );
      const [sounds] = await db.query(
        'SELECT * FROM sounds WHERE game_id = ?', [game.id]
      );

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = mathSettings[0] ? { ...mathSettings[0] } : {};

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          formFields,
          soundMap,
          questions: [],
        },
      });
    }

    // ── MAZE branch ──────────────────────────────────────────────────────────
    if (game.category === 'maze' || game.category === 'classicmaze' || game.category === 'stickmaze') {
      const table = game.category === 'stickmaze' ? 'stickmaze_settings' : 'maze_settings';
      const [mazeSettings] = await db.query(
        `SELECT * FROM ${table} WHERE game_id = ?`, [game.id]
      );
      const [formFields] = await db.query(
        'SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]
      );
      const [sounds] = await db.query(
        'SELECT * FROM sounds WHERE game_id = ?', [game.id]
      );

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = mazeSettings[0] ? { ...mazeSettings[0] } : {};

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          formFields,
          soundMap,
          questions: [],
        },
      });
    }

    // ── SCREW branch ────────────────────────────────────────────────────────
    if (game.category === 'screw') {
      const [screwSettings] = await db.query(
        'SELECT * FROM screw_settings WHERE game_id = ?', [game.id]
      );
      const [formFields] = await db.query(
        'SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]
      );
      const [sounds] = await db.query(
        'SELECT * FROM sounds WHERE game_id = ?', [game.id]
      );

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = screwSettings[0] ? { ...screwSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'reveal_image_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          formFields,
          soundMap,
          questions: [],
        },
      });
    }

    // ── 2048 branch ──────────────────────────────────────────────────────────
    if (game.category === '2048') {
      const [gameSettings] = await db.query('SELECT * FROM game2048_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }
      if (settings.tile_colors && typeof settings.tile_colors === 'string') {
        try { settings.tile_colors = JSON.parse(settings.tile_colors) } catch {}
      }

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          formFields,
          soundMap,
          questions: [],
        },
      });
    }

    // ── SNAKE branch ──────────────────────────────────────────────────────────
    if (game.category === 'snake') {
      const [gameSettings] = await db.query('SELECT * FROM snake_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          formFields,
          soundMap,
          questions: [],
        },
      });
    }

    // ── NAGARAJA branch ───────────────────────────────────────────────────────
    if (game.category === 'nagaraja') {
      const [gameSettings] = await db.query('SELECT * FROM nagaraja_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }
      if (typeof settings.gifts_json === 'string') {
        try { settings.gifts_json = JSON.parse(settings.gifts_json); } catch (_) { settings.gifts_json = []; }
      }

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          formFields,
          soundMap,
          questions: [],
        },
      });
    }

    // ── SNAKE & LADDER branch ─────────────────────────────────────────────────
    if (game.category === 'snakeandladder') {
      const [gameSettings] = await db.query('SELECT * FROM snake_ladder_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      return res.json({
        success: true,
        game: {
          id: game.id, name: game.name, category: game.category,
          description: game.description, redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo), company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings, formFields, soundMap, questions: [],
        },
      });
    }

    // ── LUDO branch ───────────────────────────────────────────────────────────
    if (game.category === 'ludo') {
      const [gameSettings] = await db.query('SELECT * FROM ludo_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      return res.json({
        success: true,
        game: {
          id: game.id, name: game.name, category: game.category,
          description: game.description, redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo), company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings, formFields, soundMap, questions: [],
        },
      });
    }

    // ── Carrom branch ──────────────────────────────────────────────────────────
    if (['Carrom', 'carrom'].includes(game.category)) {
      const [gameSettings] = await db.query('SELECT * FROM Carrom_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      return res.json({
        success: true,
        game: {
          id: game.id, name: game.name, category: game.category,
          description: game.description, redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo), company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings, formFields, soundMap, questions: [],
        },
      });
    }

    // ── TIC TAC TOE MULTIPLAYER branch ───────────────────────────────────────
    if (game.category === 'tictactoemultiplayer') {
      const [gameSettings] = await db.query('SELECT * FROM tictactoe_multi_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      return res.json({
        success: true,
        game: {
          id: game.id, name: game.name, category: game.category,
          description: game.description, redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo), company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings, formFields, soundMap, questions: [],
        },
      });
    }

    // ── CATCH branch ──────────────────────────────────────────────────────────
    if (game.category === 'catch') {
      const [gameSettings] = await db.query('SELECT * FROM catch_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          formFields,
          soundMap,
          questions: [],
        },
      });
    }

    // ── REACTION branch ───────────────────────────────────────────────────────
    if (game.category === 'reaction') {
      const [gameSettings] = await db.query('SELECT * FROM reaction_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          formFields,
          soundMap,
          questions: [],
        },
      });
    }

    // ── SIMON branch ──────────────────────────────────────────────────────────
    if (game.category === 'simon') {
      const [gameSettings] = await db.query('SELECT * FROM simon_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      return res.json({
        success: true,
        game: {
          id: game.id,
          name: game.name,
          category: game.category,
          description: game.description,
          redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings,
          formFields,
          soundMap,
          questions: [],
        },
      });
    }

    // ── GAME-SPECIFIC SETTINGS BRANCHES ──────────────────────────────────────
    const categorySettingsMap = {
      connect4:   'connect4_settings',
      flappy:     'flappy_settings',
      bounce:     'bounce_settings',
      '2048':     'game2048_settings',
      maze:       'maze_settings',
      classicmaze: 'maze_settings',
      stickmaze:  'stickmaze_settings',
      screw:      'screw_settings',
      typer:      'typer_settings',
      pouring:    'pouring_settings',
      wordsearch: 'wordsearch_settings',
      jigsaw:     'jigsaw_settings',
      memory:     'memory_settings',
      crossword:  'crossword_settings',
      spin:       'spin_settings',
      tower:      'tower_settings',
      math:       'math_settings',
      space:      'space_settings',
      bejeweled:  'bejeweled_settings',
      tetris:     'tetris_settings',
      stack:      'stack_settings',
      whackamole: 'whackamole_settings',
      hanoi:      'hanoi_settings',
      breakout:   'breakout_settings',
      bubbleshooter: 'bubbleshooter_settings',
      carlaunch:     'carlaunch_settings',
      tictactoe:     'tictactoe_settings',
      stressbuster:  'stressbuster_settings',
      soundify:      'soundify_settings',
      arrowescape:   'arrowescape_settings',
      bowling:       'bowling_settings',
      sudoku:        'sudoku_settings',
      minesweeper:   'minesweeper_settings',
      wordscramble:  'wordscramble_settings',
      rps:           'rps_settings',
      spotregistration: 'spotreg_settings',
    };
    const settingsTable = categorySettingsMap[game.category];

    if (settingsTable) {
      const [gameSettings] = await db.query(`SELECT * FROM ${settingsTable} WHERE game_id = ?`, [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);

      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);

      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url', 'o_image_url', 'puzzle_image_url', 'reveal_image_url', 'overlay_image_url', 'card_cover_image_url', 'gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }

      // Normalize tictactoe / jigsaw thank-you fields to match what the shared Thank You page expects
      if (game.category === 'tictactoe' || game.category === 'jigsaw') {
        if (!settings.outro_text && settings.thankyou_heading_text) settings.outro_text = settings.thankyou_heading_text;
        if (!settings.thankyou_subtitle && settings.thankyou_subtitle_text) settings.thankyou_subtitle = settings.thankyou_subtitle_text;
        if (!settings.submit_button_text && settings.submit_btn_text) settings.submit_button_text = settings.submit_btn_text;
        if (!settings.submit_button_text_color && settings.submit_btn_text_color) settings.submit_button_text_color = settings.submit_btn_text_color;
        if (!settings.submit_button_bg_color && settings.submit_btn_bg_color) settings.submit_button_bg_color = settings.submit_btn_bg_color;
        if (!settings.continue_button_text && settings.continue_now_btn_text) settings.continue_button_text = settings.continue_now_btn_text;
        if (!settings.continue_button_text_color && settings.continue_now_btn_text_color) settings.continue_button_text_color = settings.continue_now_btn_text_color;
        if (!settings.continue_button_bg_color && settings.continue_now_btn_bg_color) settings.continue_button_bg_color = settings.continue_now_btn_bg_color;
      }

      return res.json({
        success: true,
        game: {
          id: game.id, name: game.name, category: game.category,
          description: game.description, redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo),
          company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings, formFields, soundMap, questions: [],
        },
      });
    }

    // ── SNAKE & LADDER branch ────────────────────────────────────────────────
    if (game.category === 'snakeandladder') {
      const [gameSettings] = await db.query('SELECT * FROM snake_ladder_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);
      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);
      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }
      return res.json({
        success: true,
        game: {
          id: game.id, name: game.name, category: game.category,
          description: game.description, redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo), company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings, formFields, soundMap, questions: [],
        },
      });
    }

    // ── LUDO branch ──────────────────────────────────────────────────────────
    if (game.category === 'ludo') {
      const [gameSettings] = await db.query('SELECT * FROM ludo_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);
      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);
      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }
      return res.json({
        success: true,
        game: {
          id: game.id, name: game.name, category: game.category,
          description: game.description, redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo), company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings, formFields, soundMap, questions: [],
        },
      });
    }

    // ── Carrom branch ─────────────────────────────────────────────────────────
    if (['Carrom', 'carrom'].includes(game.category)) {
      const [gameSettings] = await db.query('SELECT * FROM Carrom_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);
      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);
      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }
      return res.json({
        success: true,
        game: {
          id: game.id, name: game.name, category: game.category,
          description: game.description, redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo), company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings, formFields, soundMap, questions: [],
        },
      });
    }

    // ── TIC TAC TOE MULTIPLAYER branch ───────────────────────────────────────
    if (game.category === 'tictactoemultiplayer') {
      const [gameSettings] = await db.query('SELECT * FROM tictactoe_multi_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);
      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);
      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }
      return res.json({
        success: true,
        game: {
          id: game.id, name: game.name, category: game.category,
          description: game.description, redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo), company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings, formFields, soundMap, questions: [],
        },
      });
    }

    // ── QUIZ / SURVEY branch ─────────────────────────────────────────────────
    const [settings]   = await db.query('SELECT * FROM quiz_settings WHERE game_id = ?', [game.id]);
    const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
    const [questions]  = await db.query('SELECT * FROM questions WHERE game_id = ? ORDER BY question_order', [game.id]);
    const [sounds]     = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);

    for (let q of questions) {
      const [options] = await db.query('SELECT * FROM options WHERE question_id = ? ORDER BY option_order', [q.id]);
      q.options = options;
    }

    const soundMap = {};
    for (const s of sounds) soundMap[s.id] = toAbs(s.url);

    const safeSettings = settings[0] ? { ...settings[0] } : {};
    if (safeSettings) {
      for (const f of ['bg_image_url','thankyou_bg_image_url','game_logo_url','submit_confirm_gif_url']) {
        safeSettings[f] = toAbs(safeSettings[f]);
      }
    }

    // ── Merge template config over settings (settings win) ──
    let templateConfig = {};
    if (game.template_id) {
      const [tpl] = await db.query('SELECT config_json FROM templates WHERE id = ?', [game.template_id]);
      if (tpl[0] && tpl[0].config_json) {
        try { templateConfig = typeof tpl[0].config_json === 'string' ? JSON.parse(tpl[0].config_json) : tpl[0].config_json; }
        catch { templateConfig = {}; }
      }
    }
    // per-game animation overrides
    let animOverrides = {};
    if (safeSettings.anim_config_json) {
      try { animOverrides = typeof safeSettings.anim_config_json === 'string' ? JSON.parse(safeSettings.anim_config_json) : safeSettings.anim_config_json; }
      catch { animOverrides = {}; }
    }
    const mergedConfig = { ...templateConfig, ...animOverrides };
    // explicit quiz_settings color/font/language/tts fields override template
    for (const k of ['primary_color','bg_color','font_family','option_text_color','option_color','border_color','enable_mascot','enable_speech','speech_language','speech_rate','speech_pitch','next_button_text','next_button_text_color','next_button_bg_color','start_button_text']) {
      if (safeSettings[k] !== undefined && safeSettings[k] !== null && safeSettings[k] !== '') mergedConfig[k] = safeSettings[k];
    }
    safeSettings.templateConfig = mergedConfig;

    // ── Media list for preloading (intro + every question/overlay video) ──
    const mediaList = [];
    const introVideo = game.intro_video_url ? toAbs(game.intro_video_url) : (mergedConfig.intro_video_url ? toAbs(mergedConfig.intro_video_url) : null);
    if (introVideo) mediaList.push(introVideo);
    for (const q of questions) {
      for (const f of ['question_image_url','question_bg_image_url']) {
        const u = toAbs(q[f]); if (u) mediaList.push(u);
      }
      for (const opt of (q.options || [])) {
        for (const f of ['option_image_url','option_overlay_image_url']) {
          const u = toAbs(opt[f]); if (u) mediaList.push(u);
        }
      }
    }

    for (const q of questions) {
      for (const f of ['question_image_url','question_bg_image_url']) q[f] = toAbs(q[f]);
      for (const opt of (q.options || [])) {
        for (const f of ['option_image_url','option_overlay_image_url']) opt[f] = toAbs(opt[f]);
      }
    }

    res.json({
      success: true,
      game: {
        id: game.id, name: game.name, category: game.category,
        description: game.description, redirect_url: game.redirect_url,
        client_logo: toAbs(game.client_logo),
         company_name: game.company_name,
         game_type: game.game_type,
         force_login: game.force_login,
         intro_video: introVideo,
        media_list: mediaList,
        settings: safeSettings, formFields, questions, soundMap,
      },
    });
  } catch (err) {
    console.error('GET game error:', err);
    sendError(res, err);
  }
});

router.post('/session/start', async (req, res) => {
  const { game_id, player_data, source_type, promo_player_id, utm_source, utm_medium, utm_campaign, utm_term, utm_content, device_id } = req.body;
  const validSrc = ['direct', 'link', 'player'];
  const src = validSrc.includes(source_type) ? source_type : 'link';
  try {
    // ── Look up game type + status for replay rules ────────────────────────────
    const [gameRows] = await db.query('SELECT game_type, status FROM games WHERE id = ?', [game_id]);
    const gameType = gameRows[0]?.game_type || 'promogames';
    const gameStatus = gameRows[0]?.status || 'development';

    // ── Hardened uniqueness check (only block replay for branded games that are LIVE) ──
    //    In development/testing, allow endless replays so testers are not restricted.
    if (gameType === 'branded' && gameStatus === 'live') {
      if (promo_player_id) {
        const [existing] = await db.query(
          'SELECT id FROM player_sessions WHERE game_id = ? AND promo_player_id = ? AND completed = 1 LIMIT 1',
          [game_id, promo_player_id]
        );
        if (existing.length > 0) {
          return res.status(400).json({ success: false, already_played: true, message: 'You have already played this game' });
        }
      } else {
        const pd = player_data || {};
        const emailKey = Object.keys(pd).find(k => ['email','emailaddress','e-mail','email address'].includes(k.toLowerCase().replace(/\s+/g, '')));
        if (emailKey && pd[emailKey]) {
          const [existing] = await db.query(
            "SELECT id FROM player_sessions WHERE game_id = ? AND completed = 1 AND JSON_UNQUOTE(JSON_EXTRACT(player_data, '$.\"Email\"')) = ? LIMIT 1",
            [game_id, pd[emailKey]]
          );
          if (existing.length > 0) {
            return res.status(400).json({ success: false, already_played: true, message: 'You have already played this game' });
          }
        }
      }
    }
    // ── Resolve referred_by from utm_source (@username) ──
    let referredBy = null;
    if (utm_source && utm_source.startsWith('@')) {
      const username = utm_source.slice(1).trim();
      if (username) {
        const [refRows] = await db.query('SELECT id FROM promo_players WHERE username = ? LIMIT 1', [username]);
        if (refRows.length > 0) referredBy = refRows[0].id;
      }
    }

    const token = uuidv4();
    const [result] = await db.query(
      `INSERT INTO player_sessions (game_id, session_token, player_data, source_type, promo_player_id, utm_source, utm_medium, utm_campaign, utm_term, utm_content, referred_by, device_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [game_id, token, JSON.stringify(player_data || {}), src, promo_player_id || null,
       utm_source || null, utm_medium || null, utm_campaign || null, utm_term || null, utm_content || null, referredBy,
       (typeof device_id === 'string' && device_id) ? device_id : null]
    );

    // ── Question pool: select random subset if configured ──
    let selectedQuestions = null;
    try {
      const [settingsRows] = await db.query('SELECT randomize_questions, questions_per_session FROM quiz_settings WHERE game_id = ? ORDER BY id DESC LIMIT 1', [game_id]);
      const qs = settingsRows[0];
      if (qs && qs.randomize_questions && qs.questions_per_session > 0) {
        const [allQ] = await db.query('SELECT id FROM questions WHERE game_id = ? ORDER BY question_order', [game_id]);
        if (allQ.length > 0) {
          const count = Math.min(qs.questions_per_session, allQ.length);
          // Fisher-Yates shuffle
          const arr = [...allQ];
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
          const selected = arr.slice(0, count).map(q => q.id);
          await db.query('UPDATE player_sessions SET selected_question_ids = ? WHERE id = ?', [JSON.stringify(selected), result.insertId]);
          selectedQuestions = selected;
        }
      }
    } catch (e) { console.error('Question pool error:', e.message); }

    res.json({ success: true, session_token: token, session_id: result.insertId, selected_question_ids: selectedQuestions });
  } catch (err) {
    console.error('Session start error:', err);
    sendError(res, err);
  }
});

// ── Quiz / survey answer ──────────────────────────────────────────────────────
router.post('/session/answer', async (req, res) => {
  const { session_token, question_id, option_id, option_ids, is_correct, question_type, answer_text } = req.body;
  try {
    const [sessions] = await db.query('SELECT * FROM player_sessions WHERE session_token = ?', [session_token]);
    if (sessions.length === 0) return res.status(404).json({ success: false, message: 'Session not found' });
    const session = sessions[0];
    const storeOptionIds = Array.isArray(option_ids) ? JSON.stringify(option_ids) : (option_ids ? JSON.stringify([option_ids]) : null);
    await db.query(
      'INSERT INTO player_answers (session_id, question_id, option_id, option_ids, answer_text, is_correct, question_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [session.id, question_id, option_id || null, storeOptionIds, answer_text || null, is_correct === true ? 1 : 0, question_type || null]
    );
    if (question_type === 'right_wrong' && is_correct) {
      await db.query('UPDATE player_sessions SET score = score + 1 WHERE id = ?', [session.id]);
    }
    if (question_type === 'right_wrong') {
      await db.query('UPDATE player_sessions SET total_scoreable = total_scoreable + 1 WHERE id = ?', [session.id]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Answer error:', err);
    sendError(res, err);
  }
});

// ── Crossword word answer ─────────────────────────────────────────────────────
router.post('/session/crossword-answer', async (req, res) => {
  const { session_token, crossword_word_id, answer_text, is_correct } = req.body;
  try {
    const [sessions] = await db.query('SELECT * FROM player_sessions WHERE session_token = ?', [session_token]);
    if (sessions.length === 0) return res.status(404).json({ success: false, message: 'Session not found' });
    const session = sessions[0];

    // Store using question_id slot (crossword_word_id maps to question_id column)
    await db.query(
      'INSERT INTO player_answers (session_id, question_id, option_id, is_correct) VALUES (?, ?, ?, ?)',
      [session.id, crossword_word_id, null, is_correct ? 1 : 0]
    );

    // Always count as scoreable; correct ones get a point
    await db.query(
      'UPDATE player_sessions SET total_scoreable = total_scoreable + 1 WHERE id = ?',
      [session.id]
    );
    if (is_correct) {
      await db.query('UPDATE player_sessions SET score = score + 1 WHERE id = ?', [session.id]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Crossword answer error:', err);
    sendError(res, err);
  }
});

// ── Claim an anonymous session for a logged-in promo player ──────────────────
// Called right after a guest logs in/registers from the post-game prompt.
// Attaches promo_player_id to an unclaimed session and, if the game already
// completed, runs the once-only PC award + best-score recording immediately.
router.post('/session/:token/claim', async (req, res) => {
  try {
    const playerId = getPromoPlayerId(req);
    if (!playerId) return res.status(401).json({ success: false, message: 'Login required' });

    const [sessions] = await db.query('SELECT * FROM player_sessions WHERE session_token = ?', [req.params.token]);
    if (sessions.length === 0) return res.status(404).json({ success: false, message: 'Session not found' });
    let session = sessions[0];
    const wasAlreadyClaimed = !!session.promo_player_id;

    // Idempotent: another device/tab may have claimed it first
    if (!wasAlreadyClaimed) {
      await db.query('UPDATE player_sessions SET promo_player_id = ? WHERE id = ?', [playerId, session.id]);
      session = { ...session, promo_player_id: playerId };
    } else if (session.promo_player_id !== playerId) {
      return res.status(409).json({ success: false, message: 'Session belongs to another player' });
    }

    let pc_awarded_now = false;
    let pc_reward = null;
    let score_info = null;
    if (session.completed) {
      try {
        pc_reward = await awardGameCompletionReward(session);
        pc_awarded_now = pc_reward.rewarded === true;
      } catch (err) {
        console.error('❌ Claim PromoCoins award error:', err.message);
        pc_reward = { success: false, rewarded: false, reason: 'internal_error' };
      }
      const finalScore = parseInt(session.score, 10) || 0;
      if (finalScore > 0) {
        try { score_info = await recordBestScore({ promoPlayerId: playerId, deviceId: session.device_id }, session.game_id, finalScore); }
        catch (err) { console.error('Claim best-score error:', err.message); }
      }
    }

    res.json({ success: true, claimed: true, already_claimed: wasAlreadyClaimed, pc_awarded: pc_awarded_now, pc_reward, score_info });
  } catch (err) {
    console.error('Claim session error:', err);
    sendError(res, err);
  }
});

// ── Per-game high score info (all-time + caller's personal best) ─────────────
// Personal best resolves via the logged-in player (Bearer) falling back to the
// guest ?device_id= query param, so unregistered players also see their own best.
router.get('/game/:id/score-info', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT high_score FROM games WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });
    const playerId = getPromoPlayerId(req);
    const deviceId = typeof req.query.device_id === 'string' ? req.query.device_id : null;
    let player_best = null;
    if (playerId) {
      const [best] = await db.query(
        'SELECT best_score FROM player_best_scores WHERE player_id = ? AND game_id = ?',
        [playerId, req.params.id]
      );
      player_best = best.length ? best[0].best_score : null;
    } else if (deviceId) {
      const [best] = await db.query(
        'SELECT best_score FROM player_best_scores WHERE device_id = ? AND game_id = ?',
        [deviceId, req.params.id]
      );
      player_best = best.length ? best[0].best_score : null;
    }
    res.json({ success: true, high_score: rows[0].high_score || 0, player_best });
  } catch (err) {
    sendError(res, err);
  }
});

// POST /api/play/record-score — lightweight global high score recording for
// arcade games that report a numeric score without a form/email completion
// flow. Mirrors session/complete high-score handling (games.high_score is the
// all-time record across every player). Optional device_id / Bearer player
// token also maintains the caller's personal best.
router.post('/record-score', async (req, res) => {
  try {
    const gameId = parseInt(req.body.game_id, 10);
    const rawScore = parseInt(req.body.score, 10);
    if (!gameId || isNaN(rawScore) || rawScore <= 0) {
      return res.status(400).json({ success: false, message: 'Valid game_id and positive score are required' });
    }
    const [gRows] = await db.query('SELECT id FROM games WHERE id = ?', [gameId]);
    if (gRows.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });
    const deviceId = typeof req.body.device_id === 'string' && req.body.device_id ? req.body.device_id : null;
    const info = await recordBestScore(
      { promoPlayerId: getPromoPlayerId(req), deviceId },
      gameId,
      Math.floor(rawScore)
    );
    res.json({ success: true, high_score: info.high_score, player_best: info.player_best, is_new_best: info.is_new_best });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/session/complete', async (req, res) => {
  const { session_token, score, player_data } = req.body;
  try {
    const [sessions] = await db.query('SELECT * FROM player_sessions WHERE session_token = ?', [session_token]);
    if (sessions.length === 0) return res.status(404).json({ success: false, message: 'Session not found' });

    const session = sessions[0];

    // Merge player_data
    let existingData = typeof session.player_data === 'string' ? JSON.parse(session.player_data) : (session.player_data || {});
    const mergedData = { ...existingData, ...(player_data || {}) };

    await db.query(
      'UPDATE player_sessions SET completed = 1, completed_at = NOW(), score = ?, player_data = ? WHERE id = ?',
      [score !== undefined ? score : session.score, JSON.stringify(mergedData), session.id]
    );

    const [games]          = await db.query('SELECT * FROM games WHERE id = ?', [session.game_id]);
    const [emailTemplates] = await db.query('SELECT * FROM email_templates WHERE game_id = ?', [session.game_id]);
    const [settingsRows]   = await db.query('SELECT * FROM quiz_settings WHERE game_id = ?', [session.game_id]);
    const gameSettings     = settingsRows[0] || {};

    const playerData  = mergedData;

    const normalize = (obj, keys) => {
      for (const k of keys) {
        for (const [label, val] of Object.entries(obj || {})) {
          if (label.toLowerCase().replace(/\s+/g, '') === k.toLowerCase().replace(/\s+/g, '') && val) {
            return String(val).trim();
          }
        }
      }
      return null;
    };
    const playerEmail = normalize(playerData, ['email','emailaddress','e-mail']);
    const playerName  = normalize(playerData, ['name','fullname','full name']) || 'Player';

    let emailSent = false;
    const emailEnabled = gameSettings.send_email === 1 || gameSettings.send_email === '1' || gameSettings.send_email === true;
    const templateOk   = emailTemplates.length > 0 && (emailTemplates[0].is_enabled === 1 || emailTemplates[0].is_enabled === true);

    // Check if a redemption code exists for this session
    let redemptionCode = null;
    let isGuestPlayer = false;
    try {
      const [redRows] = await db.query("SELECT code, is_player FROM business_redemptions WHERE session_id = ? AND code IS NOT NULL LIMIT 1", [session.id]);
      if (redRows.length > 0) {
        redemptionCode = redRows[0].code;
        isGuestPlayer = !redRows[0].is_player;
      }
    } catch {}

    if (emailEnabled && templateOk && playerEmail) {
      const template = emailTemplates[0];
      const scoreText = session.total_scoreable > 0
        ? `You scored <strong>${session.score} out of ${session.total_scoreable}</strong>.` : '';
      const rawBody = (template.body_html || '').replace(/^```html[\s\S]*?\n/, '').replace(/^```[\s\S]*?\n/, '').replace(/```\s*$/, '').trim();

      const pct = session.total_scoreable > 0 ? (session.score / session.total_scoreable) * 100 : 0;
      const perfMsg = pct === 100 ? 'Perfect score! You nailed every single one. 🏆'
        : pct >= 70 ? 'Great job! You got most of them right. 🎉'
        : pct >= 40 ? 'Good effort! Keep exploring and you will master them all. 🍰'
        : 'Thanks for playing! Every expert starts somewhere. Come back and try again! 😊';

      const bodyContent = rawBody
        .replace(/\{\{player_name\}\}/g, playerName)
        .replace(/\{\{name\}\}/g, playerName)
        .replace(/\{\{score\}\}/g, session.score)
        .replace(/\{\{total\}\}/g, session.total_scoreable)
        .replace(/\{\{total_questions\}\}/g, session.total_scoreable)
        .replace(/\{\{game_name\}\}/g, games[0]?.name || 'Game')
        .replace(/\{\{time_taken\}\}/g, 'N/A')
        .replace(/\{\{performance_message\}\}/g, perfMsg)
        .replace(/\{\{website_link\}\}/g, 'https://www.thirdwavecoffeeroasters.com/')
        .replace(/\{\{code\}\}/g, isGuestPlayer ? (redemptionCode || '') : '')
        .replace(/\{\{redemption_code\}\}/g, isGuestPlayer ? (redemptionCode || '') : '');

      const htmlEmail = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0"
              style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
              <tr><td style="background:${template.header_color||'#6366f1'};padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:24px;">${template.header_text||'🎉 Congratulations!'}</h1>
              </td></tr>
              <tr><td style="padding:32px 40px;">
                <p style="font-size:18px;color:#1a1a2e;margin:0 0 16px;">Hi <strong>${playerName}</strong>,</p>
                ${scoreText ? `<p style="font-size:16px;color:#333;">${scoreText}</p>` : ''}
                <p style="font-size:16px;color:#333;">You have completed the game!</p>
                ${bodyContent ? `<div style="margin-top:16px;color:#555;">${bodyContent}</div>` : ''}
              </td></tr>
              ${template.footer_text ? `<tr><td style="background:#f8f8f8;padding:20px 40px;text-align:center;color:#888;font-size:14px;">${template.footer_text}</td></tr>` : ''}
            </table>
          </td></tr>
        </table></body></html>`;

      try {
        const smtpSecure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1';
        const smtpPort   = parseInt(process.env.SMTP_PORT || '587', 10);
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: smtpPort,
          secure: smtpSecure,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          tls: { rejectUnauthorized: false },
        });
        await transporter.sendMail({
          from: `"${template.sender_name||'Quiz Platform'}" <${template.sender_email||process.env.SMTP_USER}>`,
          to: playerEmail,
          subject: (template.subject||'You completed the game! 🎉').replace(/\{\{name\}\}/g, playerName),
          html: htmlEmail,
        });
        emailSent = true;
        await db.query('UPDATE player_sessions SET email_sent = 1 WHERE id = ?', [session.id]);
        console.log(`✅ Email sent to ${playerEmail}`);
      } catch (emailErr) {
        console.error('❌ Email error:', emailErr.message);
        console.error('   SMTP:', process.env.SMTP_HOST, process.env.SMTP_PORT, process.env.SMTP_USER);
      }
    } else if (emailEnabled && !playerEmail && games[0]?.game_type !== 'promogames') {
      // Promogames skip the form by design — guests legitimately have no email
      console.warn('⚠️  Email enabled but no email found in player data:', JSON.stringify(playerData));
    }

    // ── Award Promo Coins (PC) on game completion ──
    // Central, transactional and idempotent: the reward amount is derived from
    // the trusted DB games.game_type, never from the client. The result is
    // echoed to the frontend so it can animate the coin fly + wallet update.
    let pcReward = null;
    try {
      pcReward = await awardGameCompletionReward(session);
    } catch (err) {
      console.error('❌ PromoCoins award error:', err.message);
      pcReward = { success: false, rewarded: false, reason: 'internal_error' };
    }

    // ── High scores: per-player best + all-time high (score reported games) ──
    // Records for logged-in players (promo_player_id) AND guests (device_id),
    // as long as a positive score was reported. games.high_score always updated.
    let scoreInfo = null;
    const finalScore = parseInt(score !== undefined ? score : session.score, 10) || 0;
    if (finalScore > 0 && (session.promo_player_id || session.device_id)) {
      try {
        scoreInfo = await recordBestScore(
          { promoPlayerId: session.promo_player_id, deviceId: session.device_id },
          session.game_id,
          finalScore
        );
      } catch (err) {
        console.error('Best score update error:', err.message);
      }
    }

    // ── Referral bonus: award 5 PC to referrer if this session was referred ──
    if (session.referred_by) {
      const [alreadyBonus] = await db.query(
        'SELECT id FROM pc_transactions WHERE player_id = ? AND type = ? AND game_id = ? AND session_id = ? LIMIT 1',
        [session.referred_by, 'referral_bonus', session.game_id, session.id]
      );
      if (alreadyBonus.length === 0) {
        await db.query(
          'UPDATE promo_players SET pc_balance = pc_balance + 5 WHERE id = ?',
          [session.referred_by]
        );
        await db.query(
          'INSERT INTO pc_transactions (player_id, type, points, game_id, session_id, note) VALUES (?, ?, ?, ?, ?, ?)',
          [session.referred_by, 'referral_bonus', 5, session.game_id, session.id, 'Referral bonus']
        );
      }
    }

    // ── Business Owner Redemption: Create redemption with 6-digit code ──
    try {
      const [boGames] = await db.query(
        'SELECT bog.business_owner_id, bog.id as bog_id FROM business_owner_games bog WHERE bog.game_id = ? LIMIT 1',
        [session.game_id]
      );

      // If no direct BO link, check if game belongs to a client and find the parent (brand) BO
      let resolvedBoId = boGames.length > 0 ? boGames[0].business_owner_id : null;
      if (!resolvedBoId) {
        const [gameRow] = await db.query('SELECT client_id FROM games WHERE id = ?', [session.game_id]);
        if (gameRow.length > 0 && gameRow[0].client_id) {
          const [parentBo] = await db.query(
            'SELECT id FROM business_owners WHERE client_id = ? AND parent_id IS NULL LIMIT 1',
            [gameRow[0].client_id]
          );
          if (parentBo.length > 0) {
            resolvedBoId = parentBo[0].id;
          }
        }
      }

      if (resolvedBoId) {
        const isPlayer = !!session.promo_player_id;
        const code = String(Math.floor(100000 + Math.random() * 900000));

        const phoneKey = Object.keys(playerData).find(k => /phone|mobile|whatsapp|contact/i.test(k));
        const playerPhone = phoneKey ? String(playerData[phoneKey]) : '';
        const tableKey = Object.keys(playerData).find(k => /table\s*(num|no|number)?/i.test(k));
        const tableNumber = tableKey ? String(playerData[tableKey]) : '';

        const [gameSettingsRow] = await db.query('SELECT email_settings FROM games WHERE id = ?', [session.game_id]);
        const emailSettings = gameSettingsRow[0]?.email_settings || {};

        await db.query(
          `INSERT INTO business_redemptions (business_owner_id, game_id, session_id, code, player_name, player_phone, player_email, is_player, promo_player_id, status, table_number)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
          [resolvedBoId, session.game_id, session.id,
           code, playerName, playerPhone, playerEmail || '', isPlayer ? 1 : 0, session.promo_player_id || null, tableNumber]
        );

        const gameName = games[0]?.name || 'a game';

        // Send email 1: Guest offer with code (only for guests, not players)
        if (!isPlayer && playerEmail && emailSettings.guest_offer?.enabled !== false) {
          try {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT || '587', 10),
              secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1',
              auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
              tls: { rejectUnauthorized: false },
            });
            const html = (emailSettings.guest_offer?.body || '')
              .replace(/\{\{code\}\}/g, code)
              .replace(/\{\{name\}\}/g, playerName)
              .replace(/\{\{player_name\}\}/g, playerName)
              .replace(/\{\{game_name\}\}/g, gameName);
            await transporter.sendMail({
              from: `"PromoGames" <${process.env.SMTP_USER}>`,
              to: playerEmail,
              subject: (emailSettings.guest_offer?.subject || 'Your reward code 🎁').replace(/\{\{name\}\}/g, playerName),
              html,
            });
            console.log(`✅ Guest offer email sent to ${playerEmail} with code ${code}`);
          } catch (e) { console.error('❌ Guest offer email error:', e.message, e.response?.data || ''); }
        }

        // Send email 2: BO notification for ALL plays
        try {
          const [boRows] = await db.query('SELECT email FROM business_owners WHERE id = ?', [resolvedBoId]);
          const boEmail = boRows[0]?.email;
          if (boEmail) {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT || '587', 10),
              secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1',
              auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
              tls: { rejectUnauthorized: false },
            });
            const html = (emailSettings.bo_notification?.body || '')
              .replace(/\{\{code\}\}/g, code)
              .replace(/\{\{player_name\}\}/g, playerName)
              .replace(/\{\{name\}\}/g, playerName)
              .replace(/\{\{game_name\}\}/g, gameName)
              .replace(/\{\{bo_name\}\}/g, 'Owner');
            const subject = (emailSettings.bo_notification?.subject || 'New play at your location 🎮')
              .replace(/\{\{player_name\}\}/g, playerName)
              .replace(/\{\{game_name\}\}/g, gameName);
            await transporter.sendMail({
              from: `"PromoGames" <${process.env.SMTP_USER}>`,
              to: boEmail,
              subject,
              html,
              headers: {
                'Message-ID': `<bo-${boGames[0].business_owner_id}-game-${session.game_id}@promogames>`,
                'In-Reply-To': `<bo-${boGames[0].business_owner_id}-game-${session.game_id}@promogames>`,
                'References': `<bo-${boGames[0].business_owner_id}-game-${session.game_id}@promogames>`,
              },
            });
            console.log(`✅ BO notification sent to ${boEmail} for ${playerName}`);
          }
        } catch (e) { console.error('❌ BO notification email error:', e.message, e.response?.data || ''); }
      }
    } catch (err) {
      console.error('❌ BO redemption hook error:', err.message);
      console.error('   stack:', err.stack?.split('\n').slice(0,3).join('\n'));
    }

    const [updatedSession] = await db.query('SELECT * FROM player_sessions WHERE id = ?', [session.id]);
    res.json({
      success: true,
      session: updatedSession[0],
      email_sent: emailSent,
      score_info: scoreInfo,
      pc_reward: pcReward,
      redirect_url: games[0]?.redirect_url || null,
    });
  } catch (err) {
    console.error('Complete session error:', err);
    sendError(res, err);
  }
});

// GET /api/play/hero-games
router.get('/hero-games', async (req, res) => {
  try {
    const [games] = await db.query(`
      SELECT g.id, g.name, g.slug, g.category,
             c.slug as client_slug,
             qs.game_logo_url, qs.bg_image_url,
             (SELECT COUNT(*) FROM player_sessions ps WHERE ps.game_id = g.id) as play_count
      FROM games g
      JOIN clients c ON g.client_id = c.id
      LEFT JOIN quiz_settings qs ON qs.game_id = g.id
      WHERE g.show_in_hero_page = 1 AND g.is_active = 1
      ORDER BY play_count DESC
      LIMIT 10
    `);
    res.json({ success: true, games });
  } catch (err) {
    sendError(res, err);
  }
});

// GET /api/play/play-page-games
router.get('/play-page-games', async (req, res) => {
  try {
    // Branded games → Featured row
    const [branded] = await db.query(`
      SELECT g.id, g.name, g.slug, g.category, g.game_type, g.high_score,
             c.slug as client_slug, c.company_name,
             g.thumbnail_url, qs.game_logo_url, qs.bg_image_url,
             (SELECT COUNT(*) FROM player_sessions ps WHERE ps.game_id = g.id) as play_count
      FROM games g
      JOIN clients c ON g.client_id = c.id
      LEFT JOIN quiz_settings qs ON qs.game_id = g.id
      WHERE g.show_in_play_page = 1 AND g.is_active = 1 AND g.game_type = 'branded'
      ORDER BY play_count DESC
    `);

    // PromoGames → PromoGames row
    const [promoGames] = await db.query(`
      SELECT g.id, g.name, g.slug, g.category, g.game_type, g.high_score,
             c.slug as client_slug, c.company_name,
             g.thumbnail_url, qs.game_logo_url, qs.bg_image_url,
             (SELECT COUNT(*) FROM player_sessions ps WHERE ps.game_id = g.id) as play_count
      FROM games g
      JOIN clients c ON g.client_id = c.id
      LEFT JOIN quiz_settings qs ON qs.game_id = g.id
      WHERE g.show_in_play_page = 1 AND g.is_active = 1 AND g.game_type = 'promogames'
      ORDER BY play_count DESC
    `);

    const allGames = [...branded, ...promoGames];
    res.json({ success: true, games: allGames, featured: branded, promogames: promoGames });
  } catch (err) {
    sendError(res, err);
  }
});

// ── GET dashboard games for player (active, grouped by type) ────────────
router.get('/dashboard-games', async (req, res) => {
  try {
    // Simplified query for initial testing, using LEFT JOINs safely
const [games] = await db.query(`
      SELECT g.id, g.name, g.slug, g.game_type, g.category, 
             g.redirect_url, g.description, g.game_logo_url, qs.bg_image_url,
             c.company_name, c.slug as client_slug
      FROM games g
      JOIN clients c ON g.client_id = c.id
      LEFT JOIN quiz_settings qs ON qs.game_id = g.id
      WHERE g.is_active = 1
      ORDER BY g.game_type, g.name
    `)
    const grouped = { promogames: [], branded: [] }
    for (const g of games) {
      const entry = { ...g }
      if (g.game_type === 'branded') grouped.branded.push(entry)
      else grouped.promogames.push(entry)
    }
    res.json({ success: true, games: grouped })
  } catch (err) {
    console.error('DASHBOARD-GAMES FATAL ERROR:', err)
    res.status(500).json({ 
      success: false, 
      message: 'Something went wrong. Please try again.',
    })
  }
})

// ── Lightweight play-count poll endpoint ─────────────────────────────────
router.get('/game/:id/play-count', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT (SELECT COUNT(*) FROM player_sessions ps WHERE ps.game_id = ?) AS play_count',
      [req.params.id]
    );
    res.json({ play_count: rows[0]?.play_count || 0 });
  } catch (err) {
    res.status(500).json({ play_count: 0 });
  }
});

// ── Game by slug only (no client/company required) ─────────────────────
// MUST be registered AFTER all static routes so it doesn't shadow them.
router.get('/:gameName', async (req, res) => {
  try {
    const [allRows] = await db.query(`
      SELECT g.*, c.company_name, c.slug as client_slug, c.logo_url as client_logo
      FROM games g LEFT JOIN clients c ON g.client_id = c.id
      WHERE g.slug = ?
    `, [req.params.gameName]);

    if (allRows.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });
    if (!allRows[0].is_active) return res.status(403).json({ success: false, message: 'This game is currently inactive' });

    const game = allRows[0];

    // Expose the all-time (global) high score to every game payload so game
    // player pages can show the true record instead of a per-player best.
    const _sendJson = res.json.bind(res);
    res.json = (body) => {
      if (body && typeof body === 'object' && body.game && typeof body.game.high_score !== 'number') {
        body.game.high_score = Number(game.high_score) || 0;
      }
      return _sendJson(body);
    };

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const toAbs = (url) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      return `${baseUrl}${url}`;
    };

    // ── CROSSWORD branch ──
    if (game.category === 'crossword') {
      const [cwSettings] = await db.query('SELECT * FROM crossword_settings WHERE game_id = ?', [game.id]);
      const [cwWords] = await db.query('SELECT * FROM crossword_words WHERE game_id = ? ORDER BY word_order', [game.id]);
      const [cwFormFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);
      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);
      const settings = cwSettings[0] ? { ...cwSettings[0] } : {};
      if (settings.allow_hints === undefined || settings.allow_hints === null) settings.allow_hints = 1;
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }
      return res.json({
        success: true,
        game: {
          id: game.id, name: game.name, category: game.category,
          description: game.description, redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo), company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings, words: cwWords, soundMap, formFields: cwFormFields, questions: [],
        },
      });
    }

    // ── SPIN branch ──
    if (game.category === 'spin') {
      const [spinSettings] = await db.query('SELECT * FROM spin_settings WHERE game_id = ?', [game.id]);
      const [spinSegments] = await db.query('SELECT * FROM spin_segments WHERE game_id = ? ORDER BY segment_order', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);
      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);
      const settings = spinSettings[0] ? { ...spinSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }
      for (const seg of spinSegments) {
        seg.coupon_image_url = toAbs(seg.coupon_image_url);
        seg.overlay_image_url = toAbs(seg.overlay_image_url);
      }
      return res.json({
        success: true,
        game: {
          id: game.id, name: game.name, category: game.category,
          description: game.description, redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo), company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings, segments: spinSegments, formFields, soundMap,
        },
      });
    }

    // ── SNAKE & LADDER branch ────────────────────────────────────────────────
    if (game.category === 'snakeandladder') {
      const [gameSettings] = await db.query('SELECT * FROM snake_ladder_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);
      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);
      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }
      return res.json({
        success: true,
        game: {
          id: game.id, name: game.name, category: game.category,
          description: game.description, redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo), company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings, formFields, soundMap, questions: [],
        },
      });
    }

    // ── LUDO branch ──────────────────────────────────────────────────────────
    if (game.category === 'ludo') {
      const [gameSettings] = await db.query('SELECT * FROM ludo_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);
      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);
      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }
      return res.json({
        success: true,
        game: {
          id: game.id, name: game.name, category: game.category,
          description: game.description, redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo), company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings, formFields, soundMap, questions: [],
        },
      });
    }

    // ── Carrom branch ─────────────────────────────────────────────────────────
    if (['Carrom', 'carrom'].includes(game.category)) {
      const [gameSettings] = await db.query('SELECT * FROM Carrom_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);
      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);
      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }
      return res.json({
        success: true,
        game: {
          id: game.id, name: game.name, category: game.category,
          description: game.description, redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo), company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings, formFields, soundMap, questions: [],
        },
      });
    }

    // ── TIC TAC TOE MULTIPLAYER branch ───────────────────────────────────────
    if (game.category === 'tictactoemultiplayer') {
      const [gameSettings] = await db.query('SELECT * FROM tictactoe_multi_settings WHERE game_id = ?', [game.id]);
      const [formFields] = await db.query('SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]);
      const [sounds] = await db.query('SELECT * FROM sounds WHERE game_id = ?', [game.id]);
      const soundMap = {};
      for (const s of sounds) soundMap[s.id] = toAbs(s.url);
      const settings = gameSettings[0] ? { ...gameSettings[0] } : {};
      for (const f of ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url']) {
        if (settings[f] !== undefined) settings[f] = toAbs(settings[f]);
      }
      return res.json({
        success: true,
        game: {
          id: game.id, name: game.name, category: game.category,
          description: game.description, redirect_url: game.redirect_url,
          client_logo: toAbs(game.client_logo), company_name: game.company_name,
          game_type: game.game_type,
          force_login: game.force_login,
          settings, formFields, soundMap, questions: [],
        },
      });
    }

    // ── Default (quiz + other categories) ──
    const [settingsRows] = await db.query(
      'SELECT * FROM quiz_settings WHERE game_id = ? ORDER BY id DESC LIMIT 1', [game.id]
    );
    const [formFields] = await db.query(
      'SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order', [game.id]
    );
    const [questions] = await db.query(
      'SELECT * FROM questions WHERE game_id = ? ORDER BY question_order', [game.id]
    );
    const [sounds] = await db.query(
      'SELECT * FROM sounds WHERE game_id = ?', [game.id]
    );
    for (let q of questions) {
      const [options] = await db.query(
        'SELECT * FROM options WHERE question_id = ? ORDER BY option_order', [q.id]
      );
      q.options = options;
    }
    const soundMap = {};
    for (const s of sounds) soundMap[s.id] = toAbs(s.url);
    const rawSettings = settingsRows[0] || {};
    const safeSettings = { ...rawSettings };
    for (const f of ['bg_image_url','thankyou_bg_image_url','game_logo_url','intro_video_url']) {
      if (safeSettings[f]) safeSettings[f] = toAbs(safeSettings[f]);
    }
    const introVideo = safeSettings.intro_video_url || null;
    const mediaList = [];
    if (introVideo) mediaList.push(introVideo);
    for (const q of questions) {
      for (const f of ['question_image_url','question_bg_image_url']) {
        const u = toAbs(q[f]); if (u) mediaList.push(u);
      }
      for (const opt of (q.options || [])) {
        for (const f of ['option_image_url','option_overlay_image_url']) {
          const u = toAbs(opt[f]); if (u) mediaList.push(u);
        }
      }
    }
    for (const q of questions) {
      for (const f of ['question_image_url','question_bg_image_url']) q[f] = toAbs(q[f]);
      for (const opt of (q.options || [])) {
        for (const f of ['option_image_url','option_overlay_image_url']) opt[f] = toAbs(opt[f]);
      }
    }
    res.json({
      success: true,
      game: {
        id: game.id, name: game.name, category: game.category,
        description: game.description, redirect_url: game.redirect_url,
         client_logo: toAbs(game.client_logo), company_name: game.company_name,
         game_type: game.game_type,
         force_login: game.force_login,
         intro_video: introVideo, media_list: mediaList,
        settings: safeSettings, formFields, questions, soundMap,
      },
    });
  } catch (err) {
    console.error('GET game (by slug) error:', err);
    sendError(res, err);
  }
});

module.exports = router;
