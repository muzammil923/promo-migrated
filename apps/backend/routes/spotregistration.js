/**
 * SPOT REGISTRATION — QR-gated multi-station data collection.
 *
 * Flow:
 *   1. Player opens /play/spotreg/:gameSlug/:clientSlug and fills the
 *      registration form (reuses the shared `form_fields` table).
 *   2. A player_sessions row is created via /api/play/session/start.
 *   3. The player is shown a list of stations. Each station has a printed QR
 *      code; scanning it unlocks that station's form.
 *   4. After every active station is scanned AND saved, the run is complete.
 *
 * Security notes:
 *   - `station_code` lives only in the printed QR. It is never included in the
 *     public player payload, so a player cannot brute-force station unlocks
 *     from the network tab.
 *   - Codes are compared after normalisation and looked up by exact match
 *     against stations belonging to the *same game* as the session.
 *   - Public endpoints are rate limited per IP to slow down code guessing.
 */

const express = require('express');
const crypto = require('crypto');
const db = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../config/upload');
const { sendError } = require('../lib/apiError');

const router = express.Router();

// Crockford base32 minus I, L, O, U — unambiguous when read off a printed sheet.
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function generateStationCode(length = 10) {
  let out = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

/** Pull the station code out of whatever the camera decoded. */
function extractCode(raw) {
  if (typeof raw !== 'string') return null;
  let text = raw.trim();
  if (!text) return null;

  // Accept a full URL (printed QR that links somewhere) and read ?code=
  if (/^https?:\/\//i.test(text) || text.startsWith('/')) {
    try {
      const url = new URL(text, 'http://placeholder.invalid');
      const fromQuery = url.searchParams.get('code') || url.searchParams.get('station');
      if (fromQuery) text = fromQuery;
      else {
        // /scan/ABC123 style path segment
        const seg = url.pathname.split('/').filter(Boolean).pop();
        if (seg) text = seg;
      }
    } catch {
      /* fall through and use the raw text */
    }
  }

  const normalized = text.toUpperCase().replace(/[^0-9A-Z]/g, '');
  return normalized.length >= 6 && normalized.length <= 40 ? normalized : null;
}

/** Per-IP limiter, scoped to the public scan endpoint. */
const scanAttempts = new Map();
const SCAN_WINDOW_MS = 10 * 60 * 1000;
const SCAN_MAX = 40;
setInterval(() => scanAttempts.clear(), SCAN_WINDOW_MS).unref();
function scanRateLimit(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = scanAttempts.get(key);
  if (!entry || now - entry.start > SCAN_WINDOW_MS) {
    scanAttempts.set(key, { start: now, count: 1 });
    return next();
  }
  entry.count += 1;
  if (entry.count > SCAN_MAX) {
    return res.status(429).json({ success: false, message: 'Too many scan attempts. Please wait a moment.' });
  }
  next();
}

/**
 * Multipart delivers every field as a string, so 'false' would otherwise be
 * read as truthy and the builder could never switch a flag off.
 */
function toBool(value) {
  if (typeof value === 'boolean') return value ? 1 : 0;
  const text = String(value ?? '').trim().toLowerCase();
  return (text === '1' || text === 'true' || text === 'yes' || text === 'on') ? 1 : 0;
}

/**
 * Normalise a stations payload that may arrive as a JSON string (multipart
 * text field), a real array, or a lone object under `stations`.
 */
function parseStationsField(raw) {
  let value = raw;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return null; }
  }
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && Array.isArray(value.stations)) return value.stations;
  return null;
}

/** Settings columns the builder is allowed to write. */const SETTINGS_KEYS = [
  'bg_color', 'primary_color', 'font_family',
  'heading_1', 'heading_2', 'heading_3', 'description_text',
  'heading_1_color', 'heading_2_color', 'heading_3_color', 'description_color',
  'label_color', 'field_border_color', 'card_bg_color', 'card_radius',
  'heading_1_size', 'heading_2_size', 'heading_3_size', 'description_size',
  'stations_heading', 'stations_subheading', 'station_done_color',
  'bg_image_url', 'game_logo_url', 'station_bg_image_url', 'thankyou_bg_image_url',
  'intro_text', 'outro_text', 'intro_text_color', 'outro_text_color',
  'start_button_text', 'start_button_text_color', 'start_button_bg_color',
  'scan_button_text', 'scan_button_text_color', 'scan_button_bg_color',
  'submit_button_text', 'submit_button_text_color', 'submit_button_bg_color',
  'skip_button_text', 'skip_button_text_color', 'skip_button_bg_color',
    'thankyou_heading', 'thankyou_text', 'thankyou_heading_color',
    'thankyou_text_color', 'thankyou_heading_size', 'thankyou_text_size',
    'thankyou_summary_heading', 'show_entries_summary',
    'finish_button_text', 'finish_button_text_color', 'finish_button_bg_color',
    'scan_hint_text', 'terms_text', 'terms_url', 'meta_description',
];
const BOOLEAN_SETTINGS = new Set(['terms_enabled', 'show_entries_summary']);

/** Settings the player is allowed to see (no builder-only columns exist today). */
function toAbsolute(url, baseUrl) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${baseUrl}${url}`;
}

async function loadSettings(gameId) {
  const [rows] = await db.query('SELECT * FROM spotreg_settings WHERE game_id = ?', [gameId]);
  return rows[0] || null;
}

async function loadStations(gameId, { includeFields = true, includeCodes = false } = {}) {
  const [stations] = await db.query(
    'SELECT * FROM spotreg_stations WHERE game_id = ? ORDER BY station_order, id',
    [gameId]
  );

  if (!includeFields || stations.length === 0) {
    return stations.map(s => (includeCodes ? s : stripCode(s)));
  }

  const [fields] = await db.query(
    `SELECT f.* FROM spotreg_station_fields f
     JOIN spotreg_stations s ON s.id = f.station_id
     WHERE s.game_id = ? ORDER BY f.field_order, f.id`,
    [gameId]
  );

  const byStation = new Map();
  for (const f of fields) {
    if (!byStation.has(f.station_id)) byStation.set(f.station_id, []);
    let options = f.field_options;
    if (typeof options === 'string') {
      try { options = JSON.parse(options); } catch { options = []; }
    }
    byStation.get(f.station_id).push({ ...f, field_options: options || [] });
  }

  return stations.map(s => ({
    ...(includeCodes ? s : stripCode(s)),
    fields: byStation.get(s.id) || [],
  }));
}

function stripCode(station) {
  const { station_code, ...rest } = station;
  return rest;
}

/* ══════════════════════════════════════════════════════════════════════════
   BUILDER ENDPOINTS (admin)
   ══════════════════════════════════════════════════════════════════════════ */

router.get('/:gameId/settings', requireAdmin, async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);
    const [games] = await db.query('SELECT id, name, slug FROM games WHERE id = ?', [gameId]);
    if (games.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });

    const settings = await loadSettings(gameId);
    const stations = await loadStations(gameId, { includeCodes: true });

    res.json({
      success: true,
      game: games[0],
      settings: settings || {},
      stations,
    });
  } catch (err) {
    console.error('spotreg GET settings error:', err);
    sendError(res, err);
  }
});

router.put('/:gameId/settings', requireAdmin, upload.fields([
  { name: 'bg_image', maxCount: 1 },
  { name: 'game_logo', maxCount: 1 },
  { name: 'station_bg_image', maxCount: 1 },
  { name: 'thankyou_bg_image', maxCount: 1 },
]), async (req, res) => {
  const gameId = parseInt(req.params.gameId, 10);
  try {
    const [games] = await db.query('SELECT id FROM games WHERE id = ?', [gameId]);
    if (games.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });

    const existing = await loadSettings(gameId) || {};

    const fields = {};
    for (const key of SETTINGS_KEYS) {
      if (req.body[key] === undefined) continue;
      fields[key] = BOOLEAN_SETTINGS.has(key)
        ? toBool(req.body[key])
        : (req.body[key] === '' ? null : req.body[key]);
    }
    // Flags the builder sends as booleans
    for (const key of ['require_order', 'require_qr', 'show_progress', 'allow_rescan']) {
      if (req.body[key] === undefined) continue;
      fields[key] = toBool(req.body[key]);
    }

    // A freshly uploaded file always wins over whatever URL is in the body.
    for (const [field, fileKey] of [
      ['bg_image_url', 'bg_image'],
      ['game_logo_url', 'game_logo'],
      ['station_bg_image_url', 'station_bg_image'],
      ['thankyou_bg_image_url', 'thankyou_bg_image'],
    ]) {
      const file = req.files?.[fileKey]?.[0];
      if (file) {
        fields[field] = `/uploads/images/${file.filename}`;
      } else if (req.body[field] === '') {
        fields[field] = null;
      }
    }

    if (Object.keys(fields).length === 0) {
      return res.json({ success: true, settings: existing, message: 'Nothing to update' });
    }

    if (existing.id) {
      const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
      await db.query(`UPDATE spotreg_settings SET ${sets} WHERE game_id = ?`, [
        ...Object.values(fields), gameId,
      ]);
    } else {
      const keys = Object.keys(fields);
      await db.query(
        `INSERT INTO spotreg_settings (game_id,${keys.join(',')}) VALUES (?,${keys.map(() => '?').join(',')})`,
        [gameId, ...Object.values(fields)]
      );
    }

    const updated = await loadSettings(gameId);
    res.json({ success: true, settings: updated });
  } catch (err) {
    console.error('spotreg PUT settings error:', err);
    sendError(res, err);
  }
});

/**
 * Bulk-save the whole station list. Sent as a full replacement so the builder
 * can reorder, add, rename and delete stations in one request. Existing ids are
 * preserved (so progress rows survive), new stations get a fresh code, and a
 * station can request a brand new code via `regenerate_code`.
 */
router.put('/:gameId/stations', requireAdmin, upload.any(), async (req, res) => {
  const gameId = parseInt(req.params.gameId, 10);

  // Multipart always delivers text fields as strings, so the builder's JSON
  // payload arrives encoded and has to be decoded here.
  const incoming = parseStationsField(req.body.stations);

  if (!incoming) {
    return res.status(400).json({ success: false, message: 'stations array required' });
  }

  // Uploaded files are keyed by their index in the incoming array, taken from
  // the field name the builder sends (`station_images__<index>`). Matching by
  // position in the file list would shift every image as soon as a single
  // station's picture is left unchanged.
  const uploadedImages = new Map();
  for (const file of req.files || []) {
    const m = /^station_images__(\d+)$/.exec(file.fieldname);
    if (m) uploadedImages.set(parseInt(m[1], 10), file);
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [games] = await conn.query('SELECT id FROM games WHERE id = ? FOR UPDATE', [gameId]);
    if (games.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    const [existing] = await conn.query(
      'SELECT id, station_code, image_url FROM spotreg_stations WHERE game_id = ?',
      [gameId]
    );
    const existingById = new Map(existing.map(s => [s.id, s]));
    const keepIds = new Set();

    for (let i = 0; i < incoming.length; i++) {
      const s = incoming[i] || {};
      const name = (s.station_name || '').trim() || `Station ${i + 1}`;
      // Reassigned below when a brand-new station is inserted.
      let stationId = s.id ? parseInt(s.id, 10) : null;
      const known = stationId && existingById.has(stationId);

      let imageUrl;
      const uploaded = uploadedImages.get(i);
      if (uploaded) {
        imageUrl = `/uploads/images/${uploaded.filename}`;
      } else if (s.image_url === '') {
        imageUrl = null;
      } else {
        imageUrl = s.image_url !== undefined
          ? s.image_url
          : (known ? existingById.get(stationId).image_url : null);
      }

      let code;
      if (known && !s.regenerate_code) {
        code = existingById.get(stationId).station_code;
      } else {
        // Retry on the astronomically unlikely collision.
        for (let attempt = 0; attempt < 5; attempt++) {
          code = generateStationCode();
          const [dupe] = await conn.query(
            'SELECT id FROM spotreg_stations WHERE station_code = ? AND game_id <> ?',
            [code, gameId]
          );
          if (dupe.length === 0) break;
          code = null;
        }
        if (!code) {
          await conn.rollback();
          return res.status(500).json({ success: false, message: 'Could not allocate a station code' });
        }
      }

      const values = [
        gameId, name, code, i,
        s.icon || null,
        s.heading_1 || null,
        s.description_text || null,
        imageUrl,
        s.is_active === undefined ? 1 : (s.is_active ? 1 : 0),
      ];

      if (known) {
        await conn.query(
          `UPDATE spotreg_stations
             SET station_name=?, station_code=?, station_order=?, icon=?, heading_1=?,
                 description_text=?, image_url=?, is_active=?
           WHERE id=? AND game_id=?`,
          [values[1], values[2], values[3], values[4], values[5], values[6], values[7], values[8],
           stationId, gameId]
        );
      } else {
        const [r] = await conn.query(
          `INSERT INTO spotreg_stations
             (game_id, station_name, station_code, station_order, icon, heading_1, description_text, image_url, is_active)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          values
        );
        stationId = r.insertId;
      }

      keepIds.add(stationId);

      // Replace this station's fields wholesale.
      await conn.query('DELETE FROM spotreg_station_fields WHERE station_id = ?', [stationId]);
      const fields = Array.isArray(s.fields) ? s.fields : [];
      for (let j = 0; j < fields.length; j++) {
        const f = fields[j] || {};
        await conn.query(
          `INSERT INTO spotreg_station_fields (station_id, field_label, field_type, field_options, is_required, field_order)
           VALUES (?,?,?,?,?,?)`,
          [stationId, f.field_label || `Field ${j + 1}`, f.field_type || 'text',
           JSON.stringify(f.field_options || []), f.is_required ? 1 : 0, j]
        );
      }
    }

    // Anything the builder removed
    for (const row of existing) {
      if (!keepIds.has(row.id)) {
        await conn.query('DELETE FROM spotreg_stations WHERE id = ? AND game_id = ?', [row.id, gameId]);
      }
    }

    await conn.commit();
    const stations = await loadStations(gameId, { includeCodes: true });
    res.json({ success: true, stations });
  } catch (err) {
    await conn.rollback();
    console.error('spotreg PUT stations error:', err);
    sendError(res, err);
  } finally {
    conn.release();
  }
});

/** Regenerate one station's code (use when a printed sheet is lost or replaced). */
router.post('/:gameId/stations/:stationId/regenerate-code', requireAdmin, async (req, res) => {
  const gameId = parseInt(req.params.gameId, 10);
  const stationId = parseInt(req.params.stationId, 10);
  try {
    let code = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateStationCode();
      const [dupe] = await db.query(
        'SELECT id FROM spotreg_stations WHERE station_code = ? AND game_id <> ?',
        [candidate, gameId]
      );
      if (dupe.length === 0) { code = candidate; break; }
    }
    if (!code) return res.status(500).json({ success: false, message: 'Could not allocate a station code' });

    const [result] = await db.query(
      'UPDATE spotreg_stations SET station_code = ? WHERE id = ? AND game_id = ?',
      [code, stationId, gameId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }
    res.json({ success: true, station_code: code });
  } catch (err) {
    console.error('spotreg regenerate-code error:', err);
    sendError(res, err);
  }
});

/** Completed runs with every station answer, for the admin responses view. */
router.get('/:gameId/results', requireAdmin, async (req, res) => {
  const gameId = parseInt(req.params.gameId, 10);
  try {
    const [rows] = await db.query(
      `SELECT ps.id AS session_id, ps.player_data, ps.completed, ps.completed_at,
              ps.source_type, ps.promo_player_id,
              sp.id AS station_id, sp.station_name, sp.station_order,
              spg.scanned_at, spg.completed_at AS station_completed_at, spg.answers
       FROM player_sessions ps
       LEFT JOIN spotreg_progress spg ON spg.session_id = ps.id
       LEFT JOIN spotreg_stations sp ON sp.id = spg.station_id
       WHERE ps.game_id = ?
       ORDER BY ps.id DESC, sp.station_order`,
      [gameId]
    );

    const sessions = new Map();
    for (const row of rows) {
      if (!sessions.has(row.session_id)) {
        let playerData = row.player_data;
        if (typeof playerData === 'string') {
          try { playerData = JSON.parse(playerData); } catch { playerData = {}; }
        }
        sessions.set(row.session_id, {
          session_id: row.session_id,
          player_data: playerData || {},
          completed: !!row.completed,
          completed_at: row.completed_at,
          source_type: row.source_type,
          promo_player_id: row.promo_player_id,
          stations: [],
        });
      }
      if (row.station_id) {
        let answers = row.answers;
        if (typeof answers === 'string') {
          try { answers = JSON.parse(answers); } catch { answers = {}; }
        }
        sessions.get(row.session_id).stations.push({
          station_id: row.station_id,
          station_name: row.station_name,
          station_order: row.station_order,
          scanned_at: row.scanned_at,
          completed_at: row.station_completed_at,
          answers: answers || {},
        });
      }
    }

    res.json({ success: true, results: Array.from(sessions.values()) });
  } catch (err) {
    console.error('spotreg GET results error:', err);
    sendError(res, err);
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   PLAYER ENDPOINTS (public)
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * GET /game/:gameSlug/:clientSlug? — the player's whole starting payload.
 * Station codes are stripped; only names/order are exposed so the player can
 * see how many stations remain.
 */
router.get('/game/:gameSlug{/:clientSlug}', async (req, res) => {
  try {
    let [games] = await db.query(
      `SELECT g.id, g.name, g.slug, g.category, g.description, g.meta_description, g.is_active,
              g.redirect_url, g.game_type, c.slug AS client_slug, c.company_name, c.logo_url AS client_logo
       FROM games g LEFT JOIN clients c ON g.client_id = c.id
       WHERE g.slug = ? AND g.category = 'spotregistration'`,
      [req.params.gameSlug]
    );

    if (games.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });
    const game = games[0];
    // The client slug is part of the public URL, so a mismatch means the link
    // belongs to a different brand — refuse rather than serve the wrong game.
    if (req.params.clientSlug && game.client_slug !== req.params.clientSlug) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    if (!game.is_active) return res.status(403).json({ success: false, message: 'This game is currently inactive' });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const settings = await loadSettings(game.id) || {};
    for (const key of ['bg_image_url', 'game_logo_url', 'station_bg_image_url', 'thankyou_bg_image_url']) {
      settings[key] = toAbsolute(settings[key], baseUrl);
    }

    const stations = await loadStations(game.id);
    for (const s of stations) s.image_url = toAbsolute(s.image_url, baseUrl);

    const [formFields] = await db.query(
      'SELECT * FROM form_fields WHERE game_id = ? ORDER BY field_order',
      [game.id]
    );
    for (const f of formFields) {
      if (typeof f.field_options === 'string') {
        try { f.field_options = JSON.parse(f.field_options); } catch { f.field_options = []; }
      }
    }

    // BMI-capable runs need an email address in the registration form. Warn in
    // the builder rather than silently failing to deliver the report.
    const hasEmailField = formFields.some(f => f.field_type === 'email');
    const emailSettings = await loadEmailSettings(game.id);
    const emailEnabled = !!(emailSettings && (emailSettings.is_enabled === 1 || emailSettings.is_enabled === true));
    if (emailEnabled && !hasEmailField) {
      settings.warnings = [
        ...(settings.warnings || []),
        'Email is switched on but the registration form has no Email field, so no report can be delivered.',
      ];
    }

    res.json({
      success: true,
      game: {
        id: game.id,
        name: game.name,
        slug: game.slug,
        description: game.description,
        meta_description: game.meta_description,
        redirect_url: game.redirect_url,
        game_type: game.game_type,
        company_name: game.company_name,
        client_slug: game.client_slug,
        client_logo: toAbsolute(game.client_logo, baseUrl),
        settings,
        stations: stations.filter(s => s.is_active),
        formFields,
      },
    });
  } catch (err) {
    console.error('spotreg GET game error:', err);
    sendError(res, err);
  }
});

/** Shared lookup: session by token, with its game, validated. */
async function getSession(token) {
  if (!token || typeof token !== 'string') return null;
  const [rows] = await db.query(
    `SELECT ps.*, g.category AS game_category, g.is_active AS game_is_active
     FROM player_sessions ps JOIN games g ON g.id = ps.game_id
     WHERE ps.session_token = ?`,
    [token]
  );
  if (rows.length === 0) return null;
  const session = rows[0];
  if (session.game_category !== 'spotregistration') return null;
  return session;
}

/**
 * GET /progress/:sessionToken — where the player is right now.
 * Returns every active station with its lock state and saved answers.
 */
router.get('/progress/:sessionToken', async (req, res) => {
  try {
    const session = await getSession(req.params.sessionToken);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const [settingsRows] = await db.query(
      'SELECT require_order, require_qr, show_progress, allow_rescan FROM spotreg_settings WHERE game_id = ?',
      [session.game_id]
    );
    const settings = settingsRows[0] || {};

  const [stations] = await db.query(
      'SELECT * FROM spotreg_stations WHERE game_id = ? ORDER BY station_order, id',
      [session.game_id]
    );

    // The complete endpoint is registered after the progress endpoint, so the
    // catch-all station routes above never shadow it.

    const [progress] = await db.query(
      'SELECT * FROM spotreg_progress WHERE session_id = ?',
      [session.id]
    );
    const progressByStation = new Map(progress.map(p => [p.station_id, p]));

    // No settings row at all means "ordered", matching the column default.
    const requireOrder = !settingsRows[0] || settingsRows[0].require_order !== 0;
    const requireQr = !settingsRows[0] || settingsRows[0].require_qr !== 0;
    const allowRescan = !!settingsRows[0] && !!settingsRows[0].allow_rescan;

    const [fieldRows] = await db.query(
      `SELECT f.* FROM spotreg_station_fields f
       JOIN spotreg_stations s ON s.id = f.station_id
       WHERE s.game_id = ? ORDER BY f.field_order, f.id`,
      [session.game_id]
    );
    const fieldsByStation = new Map();
    for (const f of fieldRows) {
      if (!fieldsByStation.has(f.station_id)) fieldsByStation.set(f.station_id, []);
      let options = f.field_options;
      if (typeof options === 'string') {
        try { options = JSON.parse(options); } catch { options = []; }
      }
      fieldsByStation.get(f.station_id).push({ ...f, field_options: options || [] });
    }

    // A station whose fields are all optional never blocks the ones after it.
    const hasRequired = (st) => (fieldsByStation.get(st.id) || []).some(f => f.is_required);

    // First station not yet scanned — drives the "next station" pointer. Stations
    // with a required field come first, so skipping an optional-only station
    // does not lock everything behind it.
    let nextIndex = stations.findIndex(s => !progressByStation.has(s.id) && hasRequired(s));
    if (nextIndex === -1) nextIndex = stations.findIndex(s => !progressByStation.has(s.id));
    if (nextIndex === -1) nextIndex = stations.length;

    const stationPayloads = stations.map((s, index) => {
      const { station_code, ...safe } = s;
      const p = progressByStation.get(s.id);
      let answers = p?.answers;
      if (typeof answers === 'string') {
        try { answers = JSON.parse(answers); } catch { answers = {}; }
      }
      return {
        ...safe,
        fields: fieldsByStation.get(s.id) || [],
        scanned: !!p,
        saved: !!(p && p.completed_at),
        has_required: hasRequired(s),
        answers: answers || {},
        locked: requireOrder ? index > nextIndex : false,
        isNext: index === nextIndex,
      };
    });

    const doneCount = stationPayloads.filter(s => s.saved).length;
    // The run can be finished once every station that has a required field is
    // saved. If no station has one, every station is needed (previous behaviour).
    const requiredPayloads = stationPayloads.filter(s => s.has_required);
    const gatingPayloads = requiredPayloads.length > 0 ? requiredPayloads : stationPayloads;

    res.json({
      success: true,
      session: {
        session_token: session.session_token,
        session_id: session.id,
        player_data: (() => {
          let d = session.player_data;
          if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } }
          return d || {};
        })(),
        completed: !!session.completed,
      },
      settings: {
        require_order: requireOrder,
        require_qr: requireQr,
        show_progress: !!settings.show_progress,
        allow_rescan: requireQr ? allowRescan : true,
      },
      stations: stationPayloads,
      total: stationPayloads.length,
      done: doneCount,
      all_done: gatingPayloads.length > 0 && gatingPayloads.every(s => s.saved),
    });
  } catch (err) {
    console.error('spotreg GET progress error:', err);
    sendError(res, err);
  }
});

/**
 * POST /scan — exchange a scanned code for an unlocked station.
 * Body: { session_token, code }
 */
router.post('/scan', scanRateLimit, async (req, res) => {
  const { session_token, code } = req.body;
  try {
    const session = await getSession(session_token);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found. Please register again.' });

    const normalized = extractCode(code);
    if (!normalized) {
      return res.status(400).json({ success: false, message: 'That does not look like a station QR code.' });
    }

    const [matches] = await db.query(
      'SELECT * FROM spotreg_stations WHERE station_code = ? AND game_id = ? AND is_active = 1',
      [normalized, session.game_id]
    );

    if (matches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'This QR code belongs to a different activity.',
      });
    }

    const station = matches[0];

    // Ordering gate — read the setting straight from the row for this call.
    const [settingsRows] = await db.query(
      'SELECT require_order FROM spotreg_settings WHERE game_id = ?',
      [session.game_id]
    );
    const requireOrder = !settingsRows[0] || settingsRows[0].require_order !== 0;

    if (requireOrder) {
      const [orderRows] = await db.query(
        'SELECT id, station_name FROM spotreg_stations WHERE game_id = ? AND is_active = 1 ORDER BY station_order, id',
        [session.game_id]
      );
      const [doneRows] = await db.query(
        'SELECT station_id FROM spotreg_progress WHERE session_id = ? AND completed_at IS NOT NULL',
        [session.id]
      );
      const doneIds = new Set(doneRows.map(p => Number(p.station_id)));
      const [reqRows] = await db.query(
        `SELECT DISTINCT f.station_id FROM spotreg_station_fields f
           JOIN spotreg_stations s ON s.id = f.station_id
          WHERE s.game_id = ? AND s.is_active = 1 AND f.is_required = 1`,
        [session.game_id]
      );
      const requiredIds = new Set(reqRows.map(r => Number(r.station_id)));

      // Every station before this one must be finished (scanned *and* saved),
      // otherwise someone could skip ahead by scanning out of sequence.
      for (const row of orderRows) {
        if (Number(row.id) >= Number(station.id)) break;
        const blocks = requiredIds.size === 0 || requiredIds.has(Number(row.id));
        if (blocks && !doneIds.has(Number(row.id))) {
          return res.status(409).json({
            success: false,
            locked: true,
            message: `Visit "${row.station_name}" first — it comes before this one.`,
          });
        }
      }
    }

    // Record the scan (idempotent).
    await db.query(
      `INSERT INTO spotreg_progress (session_id, station_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE station_id = station_id`,
      [session.id, station.id]
    );

    const [fieldRows] = await db.query(
      'SELECT * FROM spotreg_station_fields WHERE station_id = ? ORDER BY field_order, id',
      [station.id]
    );
    const fields = fieldRows.map(f => {
      let options = f.field_options;
      if (typeof options === 'string') {
        try { options = JSON.parse(options); } catch { options = []; }
      }
      return { ...f, field_options: options || [] };
    });

    const { station_code, ...safeStation } = station;

    // What this participant already entered here, so a repeat scan can offer to
    // edit the previous values instead of silently starting from blank.
    const [progressRow] = await db.query(
      'SELECT completed_at, answers FROM spotreg_progress WHERE session_id = ? AND station_id = ?',
      [session.id, station.id]
    );
    const row = progressRow[0] || null;
    let existingAnswers = {};
    if (row && row.answers) {
      if (typeof row.answers === 'string') {
        try { existingAnswers = JSON.parse(row.answers); } catch { existingAnswers = {}; }
      } else {
        existingAnswers = row.answers;
      }
    }

    res.json({
      success: true,
      station: {
        ...safeStation,
        fields,
        saved: !!(row && row.completed_at),
        answers: existingAnswers || {},
      },
    });
  } catch (err) {
    console.error('spotreg POST scan error:', err);
    sendError(res, err);
  }
});

/**
 * POST /station-submit — save one station's answers.
 * Body: { session_token, station_id, answers }
 */
router.post('/station-submit', async (req, res) => {
  const { session_token, station_id, answers } = req.body;
  try {
    const session = await getSession(session_token);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found. Please register again.' });

    const stationId = parseInt(station_id, 10);
    const [stations] = await db.query(
      'SELECT id, station_name FROM spotreg_stations WHERE id = ? AND game_id = ? AND is_active = 1',
      [stationId, session.game_id]
    );
    if (stations.length === 0) return res.status(404).json({ success: false, message: 'Station not found' });

    // Overwriting a finished station is only allowed when the builder opted in.
    const [settingRows] = await db.query(
      'SELECT allow_rescan, require_order, require_qr FROM spotreg_settings WHERE game_id = ?',
      [session.game_id]
    );
    // Without a QR gate there is nothing to re-scan, so editing stays open —
    // that is the whole point of turning QR off.
    const requireQr = !settingRows[0] || settingRows[0].require_qr !== 0;
    const allowRescan = requireQr
      ? !!(settingRows[0] && settingRows[0].allow_rescan)
      : true;
    const requireOrder = !settingRows[0] || settingRows[0].require_order !== 0;

    const [existingProgress] = await db.query(
      'SELECT completed_at FROM spotreg_progress WHERE session_id = ? AND station_id = ?',
      [session.id, stationId]
    );
    const alreadyDone = existingProgress.length > 0 && existingProgress[0].completed_at;

    if (alreadyDone && !allowRescan) {
      return res.status(409).json({
        success: false,
        message: 'This station is already complete and cannot be changed.',
      });
    }

    // The station has to have been unlocked by scanning its QR first, unless
    // the builder turned the QR gate off for this game.
    if (requireQr && !existingProgress.length) {
      return res.status(409).json({
        success: false,
        message: 'Scan this station\'s QR code before filling it in.',
      });
    }

    if (requireOrder) {
      const [[reqCount]] = await db.query(
        `SELECT COUNT(*) AS c FROM spotreg_station_fields f
           JOIN spotreg_stations s ON s.id = f.station_id
          WHERE s.game_id = ? AND s.is_active = 1 AND f.is_required = 1`,
        [session.game_id]
      );
      const anyRequiredStation = reqCount.c > 0 ? 1 : 0;
      const [earlier] = await db.query(
        `SELECT st.station_name
           FROM spotreg_stations st
          WHERE st.game_id = ? AND st.is_active = 1
            AND (st.station_order, st.id) < (
                  SELECT st2.station_order, st2.id
                    FROM spotreg_stations st2
                   WHERE st2.id = ?)
            AND NOT EXISTS (
                  SELECT 1 FROM spotreg_progress p
                   WHERE p.session_id = ? AND p.station_id = st.id
                     AND p.completed_at IS NOT NULL)
            AND (? = 0 OR EXISTS (
                  SELECT 1 FROM spotreg_station_fields f
                   WHERE f.station_id = st.id AND f.is_required = 1))
          LIMIT 1`,
        [session.game_id, stationId, session.id, anyRequiredStation]
      );
      if (earlier.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Visit "${earlier[0].station_name}" first — it comes before this one.`,
        });
      }
    }

    const [fields] = await db.query(
      'SELECT field_label, field_type, is_required FROM spotreg_station_fields WHERE station_id = ?',
      [stationId]
    );

    // Server-side required check — the client is not trusted for this.
    const incoming = (answers && typeof answers === 'object') ? answers : {};
    const missing = fields
      .filter(f => f.is_required)
      .filter(f => {
        const v = incoming[f.field_label];
        return v === undefined || v === null || String(v).trim() === '';
      })
      .map(f => f.field_label);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please fill in: ${missing.join(', ')}`,
        missing,
      });
    }

    await db.query(
      `INSERT INTO spotreg_progress (session_id, station_id, completed_at, answers)
       VALUES (?, ?, NOW(), ?)
       ON DUPLICATE KEY UPDATE completed_at = NOW(), answers = VALUES(answers)`,
      [session.id, stationId, JSON.stringify(incoming)]
    );

    res.json({ success: true, station_id: stationId, message: 'Saved' });
  } catch (err) {
    console.error('spotreg POST station-submit error:', err);
    sendError(res, err);
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   EMAIL + BMI REPORT
   ═══════════════════════════════════════════════════════════════════════════ */

const nodemailer = require('nodemailer');
const { computeBmi, extractMeasurements } = require('../lib/bmi');

const EMAIL_BOOLEAN_KEYS = ['is_enabled', 'show_bmi_block', 'show_entries_table', 'show_disclaimer', 'use_full_html'];
const EMAIL_TEXT_KEYS = [
  'subject', 'sender_name', 'sender_email', 'sender_account', 'header_text', 'header_color',
  'footer_text', 'accent_color', 'disclaimer_text',
];

function escapeHtml(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function loadEmailSettings(gameId) {
  const [rows] = await db.query(
    'SELECT * FROM spotreg_email_settings WHERE game_id = ?', [gameId]
  );
  return rows[0] || null;
}

/* ── Sending: sender accounts, address detection, timeouts + retry ─────────── */

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

/**
 * Mailboxes a game may send from. "default" is the SMTP_* login from .env.
 * Extra mailboxes come from SMTP_ACCOUNTS (JSON array in .env), e.g.
 *   SMTP_ACCOUNTS=[{"key":"health","label":"Health Camp","host":"smtp.gmail.com",
 *     "port":587,"secure":false,"user":"health@x.com","pass":"app-password"}]
 * Passwords stay in .env; the builder only ever sees key + label.
 */
function getSmtpAccounts() {
  const accounts = [{
    key: 'default',
    label: `Default (${process.env.SMTP_USER || 'SMTP_USER not set'})`,
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_USER,
  }];
  if (process.env.SMTP_ACCOUNTS) {
    try {
      for (const a of JSON.parse(process.env.SMTP_ACCOUNTS)) {
        if (!a || !a.key || !a.host || !a.user || !a.pass) continue;
        accounts.push({
          key: String(a.key),
          label: a.label ? `${a.label} (${a.from || a.user})` : (a.from || a.user),
          host: a.host,
          port: parseInt(a.port || 587, 10),
          secure: a.secure === true || a.secure === 'true',
          user: a.user,
          pass: a.pass,
          from: a.from || a.user,
        });
      }
    } catch (e) {
      console.error('SMTP_ACCOUNTS is not valid JSON:', e.message);
    }
  }
  return accounts;
}

function pickSmtpAccount(key) {
  const accounts = getSmtpAccounts();
  const found = key && accounts.find(a => a.key === key);
  if (key && !found) console.warn(`spotreg: sender account "${key}" not found, using default`);
  return found || accounts[0];
}

/**
 * Find the participant's address. Forms label the field differently per game
 * ("Email", "Email ID", "Your E-mail"...), so match any label containing "mail"
 * and only accept a value that actually looks like an address.
 */
function findPlayerEmail(playerData) {
  const entries = Object.entries(playerData || {});
  const clean = v => String(v === null || v === undefined ? '' : v).trim();
  const norm = l => String(l).toLowerCase().replace(/[^a-z]/g, '');
  const ok = v => EMAIL_RE.test(clean(v));
  for (const exact of ['email', 'emailaddress', 'emailid']) {
    for (const [label, val] of entries) if (norm(label) === exact && ok(val)) return clean(val);
  }
  for (const [label, val] of entries) if (norm(label).includes('mail') && ok(val)) return clean(val);
  return null;
}

/** Send one report with hard timeouts and up to 3 attempts on transient errors. */
async function sendReportMail({ settings, to, subject, html }) {
  const account = pickSmtpAccount(settings.sender_account);
  const fromAddress = account.from || account.user;
  const replyTo = settings.sender_email && EMAIL_RE.test(settings.sender_email) && settings.sender_email !== fromAddress
    ? settings.sender_email : undefined;
  const mail = {
    from: { name: settings.sender_name || 'Health Camp', address: fromAddress },
    to, replyTo, subject, html,
  };

  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const transporter = nodemailer.createTransport({
      host: account.host,
      port: account.port,
      secure: account.secure,
      auth: { user: account.user, pass: account.pass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 15000,
      tls: { rejectUnauthorized: false },
    });
    try {
      const info = await transporter.sendMail(mail);
      transporter.close();
      return info;
    } catch (err) {
      transporter.close();
      lastErr = err;
      const permanent = err.responseCode >= 500 && err.responseCode < 600;
      console.error(`spotreg mail attempt ${attempt} failed (${account.key} -> ${to}): ${err.message}`);
      if (permanent || attempt === 3) break;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw lastErr;
}

/** Collect every saved answer for a session, ordered by station. */
async function collectSessionEntries(sessionId, gameId) {
  const [rows] = await db.query(
    `SELECT s.station_name, s.icon, p.answers
       FROM spotreg_progress p
       JOIN spotreg_stations s ON s.id = p.station_id
      WHERE p.session_id = ? AND p.completed_at IS NOT NULL
      ORDER BY s.station_order, s.id`,
    [sessionId]
  );
  return rows.map(r => {
    let answers = r.answers;
    if (typeof answers === 'string') {
      try { answers = JSON.parse(answers); } catch { answers = {}; }
    }
    return { station_name: r.station_name, icon: r.icon, answers: answers || {} };
  });
}

/**
 * Compute (and cache) the BMI for a finished run.
 * Re-running is harmless — the row is keyed on the session.
 */
async function computeAndStoreBmi(session, entries) {
  let playerData = session.player_data;
  if (typeof playerData === 'string') {
    try { playerData = JSON.parse(playerData); } catch { playerData = {}; }
  }
  const measurements = extractMeasurements(entries, playerData || {});
  const result = computeBmi(measurements);
  if (!result) return null;

  await db.query(
    `INSERT INTO spotreg_bmi
       (session_id, bmi_value, bmi_category, bmi_percentile, height_cm, weight_kg,
        age_years, gender, is_adult, source)
     VALUES (?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       bmi_value = VALUES(bmi_value), bmi_category = VALUES(bmi_category),
       bmi_percentile = VALUES(bmi_percentile), height_cm = VALUES(height_cm),
       weight_kg = VALUES(weight_kg), age_years = VALUES(age_years),
       gender = VALUES(gender), is_adult = VALUES(is_adult), source = VALUES(source)`,
    [
      session.id, result.bmi, result.category, result.percentile,
      measurements.heightCm, measurements.weightKg,
      result.ageYears, result.gender, result.isAdult ? 1 : 0,
      JSON.stringify({ ...measurements.source, measurement: measurements }),
    ]
  );
  return result;
}

/** Render the BMI card, or null when the builder turned it off. */
function renderBmiRow(bmi, pad) {
  if (!bmi) return '';
  const accent = escapeHtml(bmi.hex || '#4F46E5');
  const headline = bmi.isAdult
    ? 'Body Mass Index'
    : 'BMI for age';
  const detail = bmi.isAdult
    ? (bmi.ageYears ? `Based on the adult BMI bands (age ${bmi.ageYears}).` : 'Based on the adult BMI bands.')
    : (bmi.percentile
      ? `Approximately the ${bmi.percentile}th percentile for a ${bmi.ageYears}-year-old ${bmi.gender}.`
      : 'Add gender to the registration form for a percentile comparison.');

  return `
      <tr><td style="padding:${pad};">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:#f8fafc;border-left:5px solid ${accent};border-radius:10px;">
          <tr><td style="padding:24px 26px;">
            <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:bold;">
              ${escapeHtml(headline)}
            </div>
            <div style="font-size:44px;font-weight:800;color:${accent};line-height:1.1;margin:8px 0 4px 0;">
              ${escapeHtml(bmi.bmi)}
            </div>
            <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:10px;">
              ${escapeHtml(bmi.category)}
            </div>
            <div style="font-size:14px;color:#475569;line-height:1.6;">
              ${escapeHtml(detail)}
            </div>
          </td></tr>
        </table>
      </td></tr>`;
}

function renderEntriesRow(entries, pad) {
  const rows = entries.map(entry => {
    const pairs = Object.entries(entry.answers || {})
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
      .map(([k, v]) => `
            <tr>
              <td style="padding:10px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;width:45%;">
                ${escapeHtml(k)}
              </td>
              <td style="padding:10px 0;font-size:15px;color:#0f172a;font-weight:700;border-bottom:1px solid #f1f5f9;">
                ${escapeHtml(v)}
              </td>
            </tr>`)
      .join('');
    if (!pairs) return '';
    return `
          <tr><td colspan="2" style="padding:20px 0 6px 0;">
            <span style="font-size:15px;font-weight:800;color:#0f172a;">${escapeHtml(entry.icon || '📍')} ${escapeHtml(entry.station_name)}</span>
          </td></tr>${pairs}`;
  }).join('');

  if (!rows) return '';
  return `
      <tr><td style="padding:${pad};">
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:bold;margin-bottom:8px;">
          Measurements recorded
        </div>
        <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td></tr>`;
}

/**
 * Build the HTML email. The builder's body_html is the editable middle; the
 * header, BMI block and entries table are structured so the layout always holds
 * together, while `body_html` gives full control over the prose.
 */
const asBlock = (row) => (row ? `<table width="100%" cellpadding="0" cellspacing="0">${row}</table>` : '');
/** Full-width rows, appended below the body when the template has no placeholder. */
const renderBmiBlock = (bmi) => renderBmiRow(bmi, '0 40px 28px 40px');
const renderEntriesTable = (entries) => renderEntriesRow(entries, '0 40px 32px 40px');
/** Same blocks without side padding, for {{bmi_card}} / {{measurements_table}} inside the body. */
const renderBmiInline = (bmi) => asBlock(renderBmiRow(bmi, '0 0 24px 0'));
const renderEntriesInline = (entries) => asBlock(renderEntriesRow(entries, '0 0 24px 0'));

const DEFAULT_DISCLAIMER = 'This report is generated automatically for information only. It is not a medical diagnosis. Please follow up with a qualified health professional.';

function renderEmailHtml({ settings, bmi, entries, playerName, gameName, stationCount, playerData }) {
  const headerColor = settings.header_color || '#4F46E5';
  const accent = settings.accent_color || headerColor;

  const rawBody = (settings.body_html || '')
    .replace(/^```html[\s\S]*?\n/i, '')
    .replace(/^```[\s\S]*?\n/, '')
    .replace(/```\s*$/, '')
    .trim();

  const showBmi = settings.show_bmi_block !== 0 && settings.show_bmi_block !== false;
  const showEntries = settings.show_entries_table !== 0 && settings.show_entries_table !== false;
  const usesBmiToken = /\{\{\s*bmi_card\s*\}\}/i.test(rawBody);
  const usesEntriesToken = /\{\{\s*measurements_table\s*\}\}/i.test(rawBody);

  // {{field:Label}} pulls any value the participant entered, by its label
  // (registration form first, then station answers). Matching ignores case/spaces.
  const findField = (label) => {
    const want = String(label).toLowerCase().replace(/[^a-z0-9]/g, '');
    const pools = [playerData || {}, ...entries.map(e => e.answers || {})];
    for (const pool of pools) {
      for (const [k, v] of Object.entries(pool)) {
        if (String(k).toLowerCase().replace(/[^a-z0-9]/g, '') === want
            && v !== null && v !== undefined && String(v).trim() !== '') return String(v);
      }
    }
    return '';
  };

  const tokens = {
    '{{player_name}}': playerName,
    '{{name}}': playerName,
    '{{game_name}}': gameName,
    '{{station_count}}': String(stationCount),
    '{{stations_completed}}': String(stationCount),
    '{{bmi}}': bmi ? bmi.bmi : '—',
    '{{bmi_category}}': bmi ? bmi.category : 'Not available',
    '{{bmi_percentile}}': bmi && bmi.percentile ? `${bmi.percentile}th` : '—',
    '{{bmi_height}}': bmi ? `${bmi.heightCm} cm` : '—',
    '{{bmi_weight}}': bmi ? `${bmi.weightKg} kg` : '—',
  };

  let body = rawBody;
  // HTML blocks first (inserted raw), then plain-text tokens (escaped, because
  // participants type these values and they must not inject markup into the email).
  body = body.replace(/\{\{\s*bmi_card\s*\}\}/gi, showBmi ? renderBmiInline(bmi) : '');
  body = body.replace(/\{\{\s*measurements_table\s*\}\}/gi, showEntries ? renderEntriesInline(entries) : '');
  for (const [token, value] of Object.entries(tokens)) {
    body = body.split(token).join(escapeHtml(value));
  }
  body = body.replace(/\{\{\s*field:([^}]+?)\s*\}\}/gi, (_, label) => escapeHtml(findField(label)));
  // Any token the builder did not use should not leak through as raw text.
  body = body.replace(/\{\{[a-z_]+\}\}/gi, '');

  // "My HTML is the whole email": no header, card, footer or disclaimer is added.
  if (settings.use_full_html && rawBody) {
    if (/<html[\s>]/i.test(body)) return body;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;">${body}</body></html>`;
  }

  const showDisclaimer = settings.show_disclaimer !== 0 && settings.show_disclaimer !== false;
  const disclaimerText = (settings.disclaimer_text || '').trim() || DEFAULT_DISCLAIMER;

  const defaultBody = `<p style="font-size:16px;color:#333;margin:0 0 16px 0;">
        Hi <strong>${escapeHtml(playerName)}</strong>,
      </p>
      <p style="font-size:16px;color:#333;margin:0;">
        Thank you for completing all ${stationCount} station${stationCount === 1 ? '' : 's'} of the
        <strong>${escapeHtml(gameName)}</strong> health checkup. Your report is below.
      </p>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(settings.subject || 'Your Health Report')}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:28px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;box-shadow:0 4px 20px rgba(15,23,42,.08);">

        <tr><td style="background:${escapeHtml(headerColor)};padding:34px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:23px;font-weight:800;line-height:1.3;">
            ${escapeHtml(settings.header_text || '🩺 Your Health Report')}
          </h1>
        </td></tr>

        <tr><td style="padding:32px 40px 8px 40px;">
          ${body || defaultBody}
        </td></tr>

        ${showBmi && !usesBmiToken ? renderBmiBlock(bmi) : ''}
        ${showEntries && !usesEntriesToken ? renderEntriesTable(entries) : ''}

        ${showDisclaimer ? `
        <tr><td style="padding:0 40px 32px 40px;">
          <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0;">
            ${escapeHtml(disclaimerText)}
          </p>
        </td></tr>` : ''}

        ${settings.footer_text ? `
        <tr><td style="background:#f8fafc;border-top:3px solid ${escapeHtml(accent)};padding:22px 40px;text-align:center;">
          <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0;">
            ${escapeHtml(settings.footer_text)}
          </p>
        </td></tr>` : ''}

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return html;
}

/** The builder's live preview uses the same renderer as the real email. */
function renderEmailSubject({ settings, playerName }) {
  return (settings.subject || 'Your Health Report').split('{{name}}').join(playerName || 'there');
}

/**
 * POST /complete — called by the player once the last station is saved.
 *
 * Finalises the run, computes BMI, and sends the report. Kept separate from the
 * generic /play/session/complete so the spotreg flow controls the email itself
 * (the generic path only emails quiz-shaped games).
 */
router.post('/complete', async (req, res) => {
  const { session_token } = req.body;
  try {
    const session = await getSession(session_token);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found. Please register again.' });

    const [games] = await db.query('SELECT id, name FROM games WHERE id = ?', [session.game_id]);
    const game = games[0];
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });

    const entries = await collectSessionEntries(session.id, session.game_id);
    const bmi = await computeAndStoreBmi(session, entries).catch(e => { console.error('spotreg BMI store failed:', e.message); return null; });

    let playerData = session.player_data;
    if (typeof playerData === 'string') {
      try { playerData = JSON.parse(playerData); } catch { playerData = {}; }
    }
    playerData = playerData || {};

    const normalize = (obj, keys) => {
      for (const k of keys) {
        for (const [label, val] of Object.entries(obj)) {
          const norm = String(label).toLowerCase().replace(/\s+/g, '');
          if (norm === k && val) return String(val).trim();
        }
      }
      return null;
    };
    const playerEmail = findPlayerEmail(playerData);
    const playerName = normalize(playerData, ['name', 'fullname']) || 'there';

    // Mark the run complete. Guarded so a double tap can't double-report.
    let alreadyCompleted = !!session.completed;
    if (!alreadyCompleted) {
      await db.query(
        'UPDATE player_sessions SET completed = 1, completed_at = NOW() WHERE id = ? AND completed = 0',
        [session.id]
      );
      alreadyCompleted = true;
    }

    const emailSettings = await loadEmailSettings(session.game_id);
    let email = { attempted: false, sent: false, reason: null };

    const emailEnabled = emailSettings && (emailSettings.is_enabled === 1 || emailSettings.is_enabled === true);
    if (emailEnabled && session.email_sent) {
      // A repeat /complete (double tap, reconnect) must not send a second report.
      email.reason = 'already_sent';
    } else if (emailEnabled && playerEmail) {
      email.attempted = true;
      try {
        const html = renderEmailHtml({
          settings: emailSettings, bmi, entries,
          playerName, gameName: game.name, stationCount: entries.length, playerData,
        });
        await sendReportMail({
          settings: emailSettings,
          to: playerEmail,
          subject: renderEmailSubject({ settings: emailSettings, playerName }),
          html,
        });
        email.sent = true;
        await db.query('UPDATE player_sessions SET email_sent = 1, email_error = NULL WHERE id = ?', [session.id]);
        console.log(`✅ spotreg report emailed to ${playerEmail}`);
      } catch (err) {
        // Keep SMTP details off the public player response; store them for the admin.
        email.reason = 'send_failed';
        console.error('❌ spotreg email error:', err.message);
        await db.query('UPDATE player_sessions SET email_error = ? WHERE id = ?',
          [String(err.message).slice(0, 490), session.id]).catch(() => {});
      }
    } else if (emailEnabled && !playerEmail) {
      email.attempted = true;
      email.reason = 'No valid email address in the registration form';
      await db.query('UPDATE player_sessions SET email_error = ? WHERE id = ?',
        ['No valid email address in the registration form', session.id]).catch(() => {});
    } else {
      email.reason = emailEnabled ? 'disabled' : 'Email disabled in the builder';
    }

    res.json({
      success: true,
      completed: true,
      already_completed: alreadyCompleted,
      stations_completed: entries.length,
      // BMI is deliberately not returned to the player: the report is emailed.
      email,
    });
  } catch (err) {
    console.error('spotreg POST complete error:', err);
    sendError(res, err);
  }
});

/* ── Admin: email settings ─────────────────────────────────────────────── */

/** Mailboxes the builder can choose from (labels only, never credentials). */
router.get('/email-senders', requireAdmin, (req, res) => {
  res.json({ success: true, senders: getSmtpAccounts().map(a => ({ key: a.key, label: a.label })) });
});

router.get('/:gameId/email-settings', requireAdmin, async (req, res) => {
  try {
    const settings = await loadEmailSettings(parseInt(req.params.gameId, 10));
    res.json({ success: true, settings: settings || null });
  } catch (err) {
    console.error('spotreg GET email-settings error:', err);
    sendError(res, err);
  }
});

router.put('/:gameId/email-settings', requireAdmin, async (req, res) => {
  const gameId = parseInt(req.params.gameId, 10);
  try {
    const [games] = await db.query('SELECT id FROM games WHERE id = ?', [gameId]);
    if (games.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });

    const existing = await loadEmailSettings(gameId);
    const fields = {};

    for (const key of EMAIL_BOOLEAN_KEYS) {
      if (req.body[key] !== undefined) fields[key] = toBool(req.body[key]);
    }
    for (const key of EMAIL_TEXT_KEYS) {
      if (req.body[key] === undefined) continue;
      fields[key] = req.body[key] === '' ? null : req.body[key];
    }
    if (fields.sender_email && !EMAIL_RE.test(fields.sender_email)) {
      return res.status(400).json({ success: false, message: 'Reply-to email is not a valid address' });
    }
    if (fields.sender_account && !getSmtpAccounts().some(a => a.key === fields.sender_account)) {
      return res.status(400).json({ success: false, message: 'Unknown sender account' });
    }
    if (req.body.body_html !== undefined) {
      fields.body_html = req.body.body_html === '' ? null : req.body.body_html;
    }
    if (!fields.sender_email && req.body.sender_email === undefined && !existing) {
      fields.sender_email = process.env.SMTP_USER || null;
    }
    if (!fields.subject && !existing) {
      fields.subject = 'Your Health Checkup Report';
    }
    if (!fields.header_text && !existing) {
      fields.header_text = '🩺 Your Health Report';
    }

    if (Object.keys(fields).length > 0) {
      if (existing) {
        const sets = Object.keys(fields).map(k => `${k}=?`).join(',');
        await db.query(`UPDATE spotreg_email_settings SET ${sets} WHERE game_id = ?`, [
          ...Object.values(fields), gameId,
        ]);
      } else {
        const keys = Object.keys(fields);
        await db.query(
          `INSERT INTO spotreg_email_settings (game_id,${keys.join(',')}) VALUES (?,${keys.map(() => '?').join(',')})`,
          [gameId, ...Object.values(fields)]
        );
      }
    }

    const updated = await loadEmailSettings(gameId);
    res.json({ success: true, settings: updated });
  } catch (err) {
    console.error('spotreg PUT email-settings error:', err);
    sendError(res, err);
  }
});

/** Render a preview with placeholder values, for the builder's live preview. */
router.post('/:gameId/email-preview', requireAdmin, async (req, res) => {
  const gameId = parseInt(req.params.gameId, 10);
  try {
    const [games] = await db.query('SELECT name FROM games WHERE id = ?', [gameId]);
    const settings = await loadEmailSettings(gameId);
    if (!settings) return res.status(400).json({ success: false, message: 'Save the email settings first' });

    const bmi = computeBmi({
      heightCm: 172, weightKg: 68, age: 32, gender: 'female',
    });
    const entries = [
      { station_name: 'Measurements', icon: '📏', answers: { 'Height (cm)': '172', 'Weight (kg)': '68' } },
      { station_name: 'Blood Pressure', icon: '🩺', answers: { 'Blood pressure': '118/76', 'Blood group': 'O+' } },
    ];
    const playerName = 'Sample Participant';
    const stationCount = entries.length;

    const html = renderEmailHtml({
      settings, bmi, entries, playerName,
      gameName: (games[0] && games[0].name) || 'Health Camp',
      stationCount,
    });

    res.json({
      success: true,
      subject: renderEmailSubject({ settings, playerName }),
      html,
    });
  } catch (err) {
    console.error('spotreg POST email-preview error:', err);
    sendError(res, err);
  }
});

/** Manual resend, for a station volunteer when a participant says it never arrived. */
router.post('/:gameId/sessions/:sessionId/resend', requireAdmin, async (req, res) => {
  const gameId = parseInt(req.params.gameId, 10);
  const sessionId = parseInt(req.params.sessionId, 10);
  try {
    const [games] = await db.query('SELECT * FROM games WHERE id = ?', [gameId]);
    if (games.length === 0) return res.status(404).json({ success: false, message: 'Game not found' });

    const [sessions] = await db.query('SELECT * FROM player_sessions WHERE id = ? AND game_id = ?', [sessionId, gameId]);
    const session = sessions[0];
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const emailSettings = await loadEmailSettings(gameId);
    if (!emailSettings) return res.status(400).json({ success: false, message: 'Email is not configured' });

    let playerData = session.player_data;
    if (typeof playerData === 'string') {
      try { playerData = JSON.parse(playerData); } catch { playerData = {}; }
    }
    const normalize = (obj, keys) => {
      for (const k of keys) {
        for (const [label, val] of Object.entries(obj || {})) {
          if (String(label).toLowerCase().replace(/\s+/g, '') === k && val) return String(val).trim();
        }
      }
      return null;
    };
    const to = findPlayerEmail(playerData);
    if (!to) return res.status(400).json({ success: false, message: 'This session has no valid email address' });

    const entries = await collectSessionEntries(sessionId, gameId);
    const bmi = await computeAndStoreBmi(session, entries).catch(e => { console.error('spotreg BMI store failed:', e.message); return null; });
    const playerName = normalize(playerData, ['name', 'fullname']) || 'there';

    const html = renderEmailHtml({
      settings: emailSettings, bmi, entries, playerName,
      gameName: games[0].name, stationCount: entries.length, playerData,
    });
    await sendReportMail({
      settings: emailSettings,
      to,
      subject: renderEmailSubject({ settings: emailSettings, playerName }),
      html,
    });

    await db.query('UPDATE player_sessions SET email_sent = 1, email_error = NULL WHERE id = ?', [sessionId]);
    res.json({ success: true, message: `Report sent to ${to}` });
  } catch (err) {
    console.error('spotreg POST resend error:', err);
    sendError(res, err);
  }
});

module.exports = router;
