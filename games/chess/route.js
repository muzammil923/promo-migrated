const express = require('express');
const router = express.Router();
const db = require('../../apps/backend/config/db');
const crypto = require('crypto');
const auth = require('../../apps/backend/middleware/auth');
const { sendError } = require('../../apps/backend/lib/apiError');
const { notifyPlayer } = require('./realtime');

/* ── Helper: generate 6-char room code ─────────────────────────── */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) code += chars[bytes[i] % chars.length];
  return code;
}

/* ── Helper: check if a room has expired (10 min TTL) ─────────── */
const ROOM_TTL_MS = 10 * 60 * 1000;
const REMATCH_TTL_MS = 30 * 1000;

// Compute real-time clock values by deducting elapsed time from the active clock.
// Returns { white_time_left, black_time_left } with the server-authoritative values.
function computeClockValues(room) {
  let whiteTime = room.white_time_left;
  let blackTime = room.black_time_left;
  if (room.status === 'active' && room.active_clock_color && room.clock_started_at) {
    const elapsedSec = Math.max(0, Math.floor((Date.now() - new Date(room.clock_started_at).getTime()) / 1000));
    if (room.active_clock_color === 'white') {
      whiteTime = Math.max(0, room.white_time_left - elapsedSec);
    } else {
      blackTime = Math.max(0, room.black_time_left - elapsedSec);
    }
  }
  return { white_time_left: whiteTime, black_time_left: blackTime };
}
function isRoomExpired(room) {
  if (!room || room.status === 'active' || room.status === 'finished') return false;
  const created = new Date(room.created_at).getTime();
  return Date.now() - created > ROOM_TTL_MS;
}

/* ── Schema bootstrap (self-contained, additive, idempotent) ─────
   chess_rooms / chess_moves / chess_settings base tables are created by the
   platform initDB (legacy). The rematch + clock columns and the in-game chat
   table belong to this module, so they are migrated here on first room use —
   same pattern as simon/screw routes. */
let chessSchemaMigrated = false;
// `ADD COLUMN IF NOT EXISTS` is MariaDB-only syntax — on MySQL it fails with a
// parse error, which made every /room and /queue request 500 ("Failed to
// create room"). Instead, check information_schema.COLUMNS and only ALTER
// when the column is missing — portable across MySQL and MariaDB.
async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}
async function addColumnIfMissing(table, column, definition) {
  if (await columnExists(table, column)) return;
  await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}
async function ensureChessSchema() {
  if (chessSchemaMigrated) return;
  await addColumnIfMissing('chess_rooms', 'rematch_status', `ENUM('none','requested','accepted','declined','expired') DEFAULT 'none'`);
  await addColumnIfMissing('chess_rooms', 'rematch_requested_by', 'VARCHAR(100) DEFAULT NULL');
  await addColumnIfMissing('chess_rooms', 'rematch_requested_by_id', 'INT DEFAULT NULL');
  await addColumnIfMissing('chess_rooms', 'rematch_requested_at', 'TIMESTAMP NULL DEFAULT NULL');
  await addColumnIfMissing('chess_rooms', 'rematch_new_room_code', 'VARCHAR(6) DEFAULT NULL');
  await addColumnIfMissing('chess_rooms', 'rematch_of_id', 'INT DEFAULT NULL');
  await addColumnIfMissing('chess_rooms', 'active_clock_color', `ENUM('white','black') DEFAULT 'white'`);
  await addColumnIfMissing('chess_rooms', 'clock_started_at', 'TIMESTAMP NULL DEFAULT NULL');
  await db.query(`CREATE TABLE IF NOT EXISTS chess_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_msg_room (room_id)
  )`);
  chessSchemaMigrated = true;
}

// Run the schema bootstrap before any room/queue handling.
router.use(['/room', '/queue'], async (req, res, next) => {
  try { await ensureChessSchema(); next(); }
  catch (err) { next(err); }
});

/* ═══════════════ SETTINGS ═══════════════ */

// GET settings for a game
router.get('/settings/:gameId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM chess_settings WHERE game_id = ?', [req.params.gameId]);
    res.json({ success: true, settings: rows[0] || null });
  } catch (err) {
    sendError(res, err);
  }
});

// PUT (upsert) settings
router.put('/settings/:gameId', auth, async (req, res) => {
  try {
    const { difficulty, time_control, board_theme, primary_color, bg_color, intro_text, outro_text, show_coordinates, piece_style, sound_enabled } = req.body;
    const [existing] = await db.query('SELECT id FROM chess_settings WHERE game_id = ?', [req.params.gameId]);
    if (existing.length > 0) {
      await db.query(`UPDATE chess_settings SET difficulty=?, time_control=?, board_theme=?, primary_color=?, bg_color=?, intro_text=?, outro_text=?, show_coordinates=?, piece_style=?, sound_enabled=? WHERE game_id=?`,
        [difficulty, time_control, board_theme, primary_color, bg_color, intro_text, outro_text, show_coordinates, piece_style, sound_enabled, req.params.gameId]);
    } else {
      await db.query(`INSERT INTO chess_settings (game_id, difficulty, time_control, board_theme, primary_color, bg_color, intro_text, outro_text, show_coordinates, piece_style, sound_enabled) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [req.params.gameId, difficulty, time_control, board_theme, primary_color, bg_color, intro_text, outro_text, show_coordinates, piece_style, sound_enabled]);
    }
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
});

/* ═══════════════ ROOMS (multiplayer) ═══════════════ */

// POST create room
router.post('/room', async (req, res) => {
  try {
    const { game_id, player_name, time_control, player_id } = req.body;
    let room_code;
    let attempts = 0;
    do {
      room_code = generateRoomCode();
      const [existing] = await db.query('SELECT id FROM chess_rooms WHERE room_code = ?', [room_code]);
      if (existing.length === 0) break;
      attempts++;
    } while (attempts < 10);

    const tc = time_control || 0;
    const pid = (player_id != null && /^\d+$/.test(String(player_id))) ? Number(player_id) : null;
    const [result] = await db.query(
      `INSERT INTO chess_rooms (room_code, game_id, player1_name, player1_id, status, time_control, white_time_left, black_time_left) VALUES (?, ?, ?, ?, 'waiting', ?, ?, ?)`,
      [room_code, game_id, player_name || 'Player 1', pid, tc, tc, tc]
    );
    res.json({ success: true, room: { id: result.insertId, room_code, status: 'waiting', player1_id: pid } });
  } catch (err) {
    sendError(res, err);
  }
});

// POST join room
router.post('/room/:code/join', async (req, res) => {
  try {
    const { player_name, player_id } = req.body;
    const [rooms] = await db.query('SELECT * FROM chess_rooms WHERE room_code = ?', [req.params.code.toUpperCase()]);
    if (rooms.length === 0) return res.status(404).json({ success: false, error: 'Room not found' });
    const room = rooms[0];
    if (isRoomExpired(room)) {
      await db.query("UPDATE chess_rooms SET status = 'finished', result = 'draw', active_clock_color = NULL, clock_started_at = NULL WHERE id = ?", [room.id]);
      return res.status(400).json({ success: false, error: 'Room has expired' });
    }
    if (room.status !== 'waiting') return res.status(400).json({ success: false, error: 'Game already in progress' });
    if (room.player2_id && room.player2_id !== null) return res.status(400).json({ success: false, error: 'Room is full' });

    const pid = (player_id != null && /^\d+$/.test(String(player_id))) ? Number(player_id) : null;
    await db.query(
      `UPDATE chess_rooms SET player2_name = ?, player2_id = ?, status = 'active', active_clock_color = 'white', clock_started_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [player_name || 'Player 2', pid, room.id]
    );
    res.json({ success: true, room: { ...room, player2_name: player_name || 'Player 2', player2_id: pid, status: 'active' } });
  } catch (err) {
    sendError(res, err);
  }
});

// GET room by code
router.get('/room/:code', async (req, res) => {
  try {
    const [rooms] = await db.query('SELECT * FROM chess_rooms WHERE room_code = ?', [req.params.code.toUpperCase()]);
    if (rooms.length === 0) return res.status(404).json({ success: false, error: 'Room not found' });
    const room = rooms[0];
    if (isRoomExpired(room)) {
      await db.query("UPDATE chess_rooms SET status = 'finished', result = 'draw', active_clock_color = NULL, clock_started_at = NULL WHERE id = ?", [room.id]);
      return res.json({ success: true, room: { ...rooms[0], status: 'finished', result: 'draw', active_clock_color: null, clock_started_at: null, rematch: { status: 'none' } } });
    }
    // Lazily expire pending rematch requests.
    if (room.rematch_status === 'requested' && room.rematch_requested_at &&
        Date.now() - new Date(room.rematch_requested_at).getTime() > REMATCH_TTL_MS) {
      await db.query(`UPDATE chess_rooms SET rematch_status='expired' WHERE id=?`, [room.id]);
      room.rematch_status = 'expired';
    }
    // Compute real-time clock values for the response.
    const clock = computeClockValues(room);
    res.json({ success: true, room: { ...room, ...clock, rematch: rematchInfo(room) } });
  } catch (err) {
    sendError(res, err);
  }
});

// POST make move
router.post('/room/:code/move', async (req, res) => {
  try {
    const { notation, fen_after, player_color, time_spent, increment = 0 } = req.body;
    const [rooms] = await db.query('SELECT * FROM chess_rooms WHERE room_code = ?', [req.params.code.toUpperCase()]);
    if (rooms.length === 0) return res.status(404).json({ success: false, error: 'Room not found' });
    const room = rooms[0];
    if (room.status !== 'active') return res.status(400).json({ success: false, error: 'Game not active' });
    if (room.current_turn !== player_color) return res.status(400).json({ success: false, error: 'Not your turn' });

    const [moveCount] = await db.query('SELECT COUNT(*) as cnt FROM chess_moves WHERE room_id = ?', [room.id]);
    const moveNumber = moveCount[0].cnt + 1;

    await db.query(
      `INSERT INTO chess_moves (room_id, move_number, notation, fen_before, fen_after, player_color, time_spent) VALUES (?,?,?,?,?,?,?)`,
      [room.id, moveNumber, notation, room.fen, fen_after, player_color, time_spent || 0]
    );

    const nextTurn = player_color === 'white' ? 'black' : 'white';
    const incSec = Math.max(0, parseInt(increment, 10) || 0);

    // Server-authoritative clock: compute real elapsed time from clock_started_at.
    // This works even if the client was offline — the server tracks wall-clock time.
    const elapsedSec = room.clock_started_at
      ? Math.max(0, Math.floor((Date.now() - new Date(room.clock_started_at).getTime()) / 1000))
      : (time_spent || 0);
    const effectiveSpent = Math.min(elapsedSec, (time_spent || 0) + 5); // cap at client-reported + 5s grace

    const newWhiteTime = player_color === 'white'
      ? Math.max(0, room.white_time_left - effectiveSpent + incSec)
      : room.white_time_left;
    const newBlackTime = player_color === 'black'
      ? Math.max(0, room.black_time_left - effectiveSpent + incSec)
      : room.black_time_left;

    // Check for flag fall (timeout)
    const moverTimeLeft = player_color === 'white' ? newWhiteTime : newBlackTime;
    if (moverTimeLeft <= 0) {
      const winner = player_color === 'white' ? 'black' : 'white';
      await db.query(
        `UPDATE chess_rooms SET fen = ?, current_turn = ?, white_time_left = ?, black_time_left = ?, status = 'finished', result = ?, active_clock_color = NULL, clock_started_at = NULL, updated_at = NOW() WHERE id = ?`,
        [fen_after, nextTurn, Math.max(0, newWhiteTime), Math.max(0, newBlackTime), winner, room.id]
      );
      return res.json({ success: true, move: { notation, move_number: moveNumber, player_color }, next_turn: nextTurn, flag_fell: true, winner });
    }

    await db.query(
      `UPDATE chess_rooms SET fen = ?, current_turn = ?, white_time_left = ?, black_time_left = ?, active_clock_color = ?, clock_started_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [fen_after, nextTurn, newWhiteTime, newBlackTime, nextTurn === 'white' ? 'white' : 'black', room.id]
    );

    res.json({ success: true, move: { notation, move_number: moveNumber, player_color }, next_turn: nextTurn });
  } catch (err) {
    sendError(res, err);
  }
});

// GET moves after a certain move number (for polling)
router.get('/room/:code/moves', async (req, res) => {
  try {
    const [rooms] = await db.query('SELECT * FROM chess_rooms WHERE room_code = ?', [req.params.code.toUpperCase()]);
    if (rooms.length === 0) return res.status(404).json({ success: false, error: 'Room not found' });
    const room = rooms[0];
    const after = parseInt(req.query.after) || 0;
    const [moves] = await db.query(
      'SELECT * FROM chess_moves WHERE room_id = ? AND move_number > ? ORDER BY move_number ASC',
      [room.id, after]
    );

    // Compute real-time clock values.
    const clock = computeClockValues(room);

    // Check for flag fall on poll — if active player's time ran out, end the game.
    if (room.status === 'active' && room.active_clock_color) {
      const activeTimeLeft = room.active_clock_color === 'white' ? clock.white_time_left : clock.black_time_left;
      if (activeTimeLeft <= 0) {
        const winner = room.active_clock_color === 'white' ? 'black' : 'white';
        await db.query(
          `UPDATE chess_rooms SET white_time_left = ?, black_time_left = ?, status = 'finished', result = ?, active_clock_color = NULL, clock_started_at = NULL, updated_at = NOW() WHERE id = ?`,
          [Math.max(0, clock.white_time_left), Math.max(0, clock.black_time_left), winner, room.id]
        );
        room.status = 'finished';
        room.result = winner;
      }
    }

    const roomResponse = { ...room, ...clock };
    if (room.status === 'finished') {
      roomResponse.active_clock_color = null;
      roomResponse.clock_started_at = null;
    }
    res.json({ success: true, moves, room: roomResponse });
  } catch (err) {
    sendError(res, err);
  }
});

// POST end game
router.post('/room/:code/end', async (req, res) => {
  try {
    const { result, player_color } = req.body;
    const [rooms] = await db.query('SELECT * FROM chess_rooms WHERE room_code = ?', [req.params.code.toUpperCase()]);
    if (rooms.length === 0) return res.status(404).json({ success: false, error: 'Room not found' });
    await db.query(`UPDATE chess_rooms SET status = 'finished', result = ?, active_clock_color = NULL, clock_started_at = NULL, updated_at = NOW() WHERE id = ?`, [result, rooms[0].id]);
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
});

/* ═══════════════ REMATCH (online shared games) ═══════════════
   Server-authoritative rematch state stored on the finished room.
   Since this app uses polling (no sockets), clients read room status
   to learn about requests/accepts. Stale requests expire lazily. */

// Resolve the rematch state of a room; marks expired requests lazily on read.
function rematchInfo(room) {
  let status = room.rematch_status || 'none';
  let requested_by = room.rematch_requested_by || null;
  if (status === 'requested' && room.rematch_requested_at) {
    const requestedAt = new Date(room.rematch_requested_at).getTime();
    if (Date.now() - requestedAt > REMATCH_TTL_MS) status = 'expired';
  }
  return {
    status,
    requested_by,
    requested_by_id: room.rematch_requested_by_id != null ? room.rematch_requested_by_id : null,
    accepted_by: status === 'accepted' ? room.rematch_new_room_code : null,
    new_room_code: status === 'accepted' ? room.rematch_new_room_code : null,
    expires_in: status === 'requested' ? Math.max(0, REMATCH_TTL_MS - (Date.now() - new Date(room.rematch_requested_at).getTime())) : null,
  };
}

// Build and persist the brand-new rematch room reusing the previous match's
// settings. Colors swap: previous black side becomes white in the rematch.
async function createRematchRoom(prevRoom) {
  const ttl = prevRoom.time_control || 0;
  let room_code;
  for (let attempts = 0; attempts < 10; attempts++) {
    room_code = generateRoomCode();
    const [ex] = await db.query('SELECT id FROM chess_rooms WHERE room_code = ?', [room_code]);
    if (ex.length === 0) break;
  }
  const [result] = await db.query(
    `INSERT INTO chess_rooms (room_code, game_id, player1_name, player1_id, player2_name, player2_id, status, time_control, white_time_left, black_time_left, rematch_of_id, active_clock_color, clock_started_at)
     VALUES (?,?,?,?,?,?, 'active', ?,?,?,?, 'white', NOW())`,
    [room_code, prevRoom.game_id, prevRoom.player2_name, prevRoom.player2_id, prevRoom.player1_name, prevRoom.player1_id, ttl, ttl, ttl, prevRoom.id]
  );
  const [rows] = await db.query('SELECT * FROM chess_rooms WHERE id = ?', [result.insertId]);
  return rows[0];
}

// POST request a rematch against the opponent of the finished game
router.post('/room/:code/rematch', async (req, res) => {
  try {
    const { player_name, player_id } = req.body;
    const code = req.params.code.toUpperCase();
    const [rooms] = await db.query('SELECT * FROM chess_rooms WHERE room_code = ?', [code]);
    if (rooms.length === 0) return res.status(404).json({ success: false, error: 'Room not found' });
    const room = rooms[0];
    if (room.status !== 'finished') return res.status(400).json({ success: false, error: 'Match not finished' });
    if (!player_name) return res.status(400).json({ success: false, error: 'player_name required' });

    // Resolve stale request first (expires lazily).
    const stale = room.rematch_status === 'requested' && room.rematch_requested_at &&
      (Date.now() - new Date(room.rematch_requested_at).getTime() > REMATCH_TTL_MS);
    if (stale) {
      await db.query("UPDATE chess_rooms SET rematch_status='expired' WHERE id = ?", [room.id]);
      room.rematch_status = 'expired';
    }

    // Identity: prefer the stable numeric player_id; fall back to the name for
    // legacy rooms created before ids existed.
    const pid = (player_id != null && /^\d+$/.test(String(player_id))) ? Number(player_id) : null;
    const requesterIsPlayer1 = pid != null ? room.player1_id === pid : room.player1_name === player_name;
    const requesterIsPlayer2 = pid != null ? room.player2_id === pid : room.player2_name === player_name;
    const requester = requesterIsPlayer1 ? room.player1_name : room.player2_name;
    if (!requesterIsPlayer1 && !requesterIsPlayer2) {
      return res.status(403).json({ success: false, error: 'Not part of this match' });
    }

    // Simultaneous request from the opponent — treat as mutual acceptance.
    // (Only valid when the requester is a *distinct* player from the existing one.)
    const existingById = room.rematch_requested_by_id != null;
    const existingBy = existingById ? room.rematch_requested_by_id : room.rematch_requested_by;
    const sameRequester = existingById
      ? (pid != null && existingBy === pid && ((room.player1_id===pid)||(room.player2_id===pid)))
      : room.rematch_requested_by === player_name;
    if (room.rematch_status === 'requested' && room.rematch_requested_by && !sameRequester) {
      const newRoom = await createRematchRoom(room);
      await db.query(
        `UPDATE chess_rooms SET rematch_status='accepted', rematch_new_room_code=?, updated_at=NOW() WHERE id=?`,
        [newRoom.room_code, room.id]
      );
      // Both players requested simultaneously — let the opponent know it's on.
      const opponentId = requesterIsPlayer1 ? room.player2_id : room.player1_id;
      if (opponentId != null && opponentId !== pid) {
        notifyPlayer(opponentId, {
          type: 'rematch', action: 'accepted', room_code: code, new_room_code: newRoom.room_code,
        });
      }
      return res.json({ success: true, rematch: { status: 'accepted', new_room_code: newRoom.room_code } });
    }

    // Already requested by same player — do nothing (idempotent, prevents duplicates).
    if (room.rematch_status === 'requested' && sameRequester) {
      return res.json({ success: true, rematch: rematchInfo(room) });
    }

    // Declined/expired previously resets to a fresh request from this player.
    await db.query(
      `UPDATE chess_rooms SET rematch_status='requested', rematch_requested_by=?, rematch_requested_by_id=?, rematch_requested_at=NOW(), rematch_new_room_code=NULL, updated_at=NOW() WHERE id=?`,
      [requester, pid, room.id]
    );
    const [updated] = await db.query('SELECT * FROM chess_rooms WHERE id = ?', [room.id]);
    // Instantly notify the opponent over WebSocket (in addition to polling).
    const opponentId = requesterIsPlayer1 ? room.player2_id : room.player1_id;
    notifyPlayer(opponentId, {
      type: 'rematch',
      action: 'requested',
      room_code: code,
      requested_by: requester,
      requested_by_id: pid,
      expires_in: REMATCH_TTL_MS,
    });
    return res.json({ success: true, rematch: rematchInfo(updated[0]) });
  } catch (err) {
    sendError(res, err);
  }
});

// POST respond (accept/decline) to a rematch request
router.post('/room/:code/rematch/respond', async (req, res) => {
  try {
    const { player_name, player_id, action } = req.body;
    const code = req.params.code.toUpperCase();
    const [rooms] = await db.query('SELECT * FROM chess_rooms WHERE room_code = ?', [code]);
    if (rooms.length === 0) return res.status(404).json({ success: false, error: 'Room not found' });
    const room = rooms[0];
    if (room.status !== 'finished') return res.status(400).json({ success: false, error: 'Match not finished' });
    if (!player_name || !action) return res.status(400).json({ success: false, error: 'player_name and action required' });
    if (!['accept', 'decline'].includes(action)) return res.status(400).json({ success: false, error: 'action must be accept or decline' });

    const pid = (player_id != null && /^\d+$/.test(String(player_id))) ? Number(player_id) : null;
    const requesterIsPlayer1 = pid != null ? room.player1_id === pid : room.player1_name === player_name;
    const requesterIsPlayer2 = pid != null ? room.player2_id === pid : room.player2_name === player_name;
    if (!requesterIsPlayer1 && !requesterIsPlayer2) {
      return res.status(403).json({ success: false, error: 'Not part of this match' });
    }

    // No active request to answer.
    if (room.rematch_status !== 'requested' || !room.rematch_requested_by) {
      return res.json({ success: true, rematch: rematchInfo(room) });
    }
    // The requester cannot answer their own request.
    const isOwnRequest = room.rematch_requested_by_id != null
      ? (pid != null && room.rematch_requested_by_id === pid)
      : room.rematch_requested_by === player_name;
    if (isOwnRequest) {
      return res.status(400).json({ success: false, error: 'Cannot respond to your own request' });
    }
    // Request expired.
    if (Date.now() - new Date(room.rematch_requested_at).getTime() > REMATCH_TTL_MS) {
      await db.query("UPDATE chess_rooms SET rematch_status='expired' WHERE id = ?", [room.id]);
      return res.json({ success: true, rematch: { status: 'expired' } });
    }

    if (action === 'decline') {
      await db.query(`UPDATE chess_rooms SET rematch_status='declined', updated_at=NOW() WHERE id=?`, [room.id]);
      const requesterId = room.rematch_requested_by_id != null
        ? room.rematch_requested_by_id
        : (pid === room.player1_id ? room.player2_id : room.player1_id);
      notifyPlayer(requesterId, {
        type: 'rematch', action: 'declined', room_code: code,
      });
      return res.json({ success: true, rematch: { status: 'declined' } });
    }

    // Accept: create the new match and record it on the previous room so the
    // requester discovers it via polling.
    const newRoom = await createRematchRoom(room);
    await db.query(
      `UPDATE chess_rooms SET rematch_status='accepted', rematch_new_room_code=?, updated_at=NOW() WHERE id=?`,
      [newRoom.room_code, room.id]
    );
    // Notify the requester immediately so they can boot the new match.
    const acceptedRequesterId = room.rematch_requested_by_id != null
      ? room.rematch_requested_by_id
      : (pid === room.player1_id ? room.player2_id : room.player1_id);
    notifyPlayer(acceptedRequesterId, {
      type: 'rematch', action: 'accepted', room_code: code, new_room_code: newRoom.room_code,
    });
    return res.json({ success: true, new_room_code: newRoom.room_code, rematch: { status: 'accepted', new_room_code: newRoom.room_code } });
  } catch (err) {
    sendError(res, err);
  }
});

// POST cancel a pending rematch request (requester leaving / change of mind)
router.post('/room/:code/rematch/cancel', async (req, res) => {
  try {
    const { player_name } = req.body;
    const [rooms] = await db.query('SELECT * FROM chess_rooms WHERE room_code = ?', [req.params.code.toUpperCase()]);
    if (rooms.length === 0) return res.json({ success: true });
    const room = rooms[0];
    if (room.rematch_status === 'requested') {
      await db.query(`UPDATE chess_rooms SET rematch_status='none', rematch_requested_by=NULL, rematch_requested_by_id=NULL, rematch_requested_at=NULL, updated_at=NOW() WHERE id=?`, [room.id]);
    }
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
});

// POST resign
router.post('/room/:code/resign', async (req, res) => {
  try {
    const { player_color } = req.body;
    const [rooms] = await db.query('SELECT * FROM chess_rooms WHERE room_code = ?', [req.params.code.toUpperCase()]);
    if (rooms.length === 0) return res.status(404).json({ success: false, error: 'Room not found' });
    const winner = player_color === 'white' ? 'black' : 'white';
    await db.query(`UPDATE chess_rooms SET status = 'finished', result = ?, active_clock_color = NULL, clock_started_at = NULL, updated_at = NOW() WHERE id = ?`, [winner, rooms[0].id]);
    res.json({ success: true, winner });
  } catch (err) {
    sendError(res, err);
  }
});

// POST send chat message
router.post('/room/:code/chat', async (req, res) => {
  try {
    const { sender_name, message } = req.body;
    const [rooms] = await db.query('SELECT * FROM chess_rooms WHERE room_code = ?', [req.params.code.toUpperCase()]);
    if (rooms.length === 0) return res.status(404).json({ success: false, error: 'Room not found' });
    await db.query(
      'INSERT INTO chess_messages (room_id, sender_name, message) VALUES (?, ?, ?)',
      [rooms[0].id, sender_name || 'Player', message]
    );
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
});

// GET poll chat messages after a certain id
router.get('/room/:code/chat', async (req, res) => {
  try {
    const [rooms] = await db.query('SELECT * FROM chess_rooms WHERE room_code = ?', [req.params.code.toUpperCase()]);
    if (rooms.length === 0) return res.status(404).json({ success: false, error: 'Room not found' });
    const after = parseInt(req.query.after) || 0;
    const [messages] = await db.query(
      'SELECT * FROM chess_messages WHERE room_id = ? AND id > ? ORDER BY id ASC',
      [rooms[0].id, after]
    );
    res.json({ success: true, messages });
  } catch (err) {
    sendError(res, err);
  }
});

// POST offer/accept draw
router.post('/room/:code/draw', async (req, res) => {
  try {
    const { action, player_color } = req.body; // 'offer' or 'accept'
    const [rooms] = await db.query('SELECT * FROM chess_rooms WHERE room_code = ?', [req.params.code.toUpperCase()]);
    if (rooms.length === 0) return res.status(404).json({ success: false, error: 'Room not found' });
    if (action === 'accept') {
      await db.query(`UPDATE chess_rooms SET status = 'finished', result = 'draw', active_clock_color = NULL, clock_started_at = NULL, updated_at = NOW() WHERE id = ?`, [rooms[0].id]);
      return res.json({ success: true, result: 'draw' });
    }
    res.json({ success: true, draw_offered_by: player_color });
  } catch (err) {
    sendError(res, err);
  }
});

/* ═══════════════ MATCHMAKING QUEUE (in-memory) ═══════════════
   Simple queue with 60-second TTL per entry. No DB needed —
   restarting the server clears the queue, which is fine.
   ──────────────────────────────────────────────────────────── */

const matchQueue = []; // { queueId, player_name, rating, time_control, joinedAt, roomCode }
const QUEUE_TTL_MS = 60_000;  // entries expire after 60s

function pruneQueue() {
  const now = Date.now();
  for (let i = matchQueue.length - 1; i >= 0; i--) {
    if (now - matchQueue[i].joinedAt > QUEUE_TTL_MS) matchQueue.splice(i, 1);
  }
}

// POST /api/chess/queue/join  — enter the matchmaking queue
// Returns { queued: true, queueId, roomCode? } or { matched: true, roomCode, color }
router.post('/queue/join', async (req, res) => {
  try {
    pruneQueue();
    const { player_name, player_id, rating, time_control, game_id } = req.body;
    const tc = time_control || 600;
    const myRating = parseInt(rating) || 1200;
    const pid = (player_id != null && /^\d+$/.test(String(player_id))) ? Number(player_id) : null;

    // Look for a waiting opponent with similar time control & rating (±300)
    const matchIdx = matchQueue.findIndex(e =>
      e.time_control === tc &&
      Math.abs(e.rating - myRating) <= 300
    );

    if (matchIdx !== -1) {
      // Match found — create a real room, remove them from queue
      const opponent = matchQueue.splice(matchIdx, 1)[0];

      let room_code;
      let attempts = 0;
      do {
        room_code = generateRoomCode();
        const [ex] = await db.query('SELECT id FROM chess_rooms WHERE room_code=?', [room_code]);
        if (ex.length === 0) break;
      } while (++attempts < 10);

      await db.query(
        `INSERT INTO chess_rooms (room_code, game_id, player1_name, player1_id, player2_name, player2_id, status, time_control, white_time_left, black_time_left, active_clock_color, clock_started_at)
         VALUES (?,?,?,?,?,?, 'active',?,?,?, 'white', NOW())`,
        [room_code, game_id || 0, opponent.player_name, opponent.player_id, player_name || 'Player 2', pid, tc, tc, tc]
      );

      // Tell opponent their room via their queued entry's roomCode field
      opponent.roomCode = room_code;
      opponent.opponentName = player_name || 'Player 2';
      opponent.myColor = 'white'; // opponent (creator) gets white

      return res.json({
        matched: true,
        roomCode: room_code,
        color: 'black',          // joiner gets black
        opponentName: opponent.player_name,
      });
    }

    // No match yet — add to queue
    const queueId = crypto.randomBytes(8).toString('hex');
    matchQueue.push({ queueId, player_name: player_name || 'Player', player_id: pid, rating: myRating, time_control: tc, game_id: game_id || 0, joinedAt: Date.now(), roomCode: null });
    return res.json({ queued: true, queueId });
  } catch (err) {
    sendError(res, err);
  }
});

// GET /api/chess/queue/poll?queueId=xxx  — check if a match was found
router.get('/queue/poll', (req, res) => {
  pruneQueue();
  const { queueId } = req.query;
  if (!queueId) return res.status(400).json({ success: false, error: 'queueId required' });

  const entry = matchQueue.find(e => e.queueId === queueId);
  if (!entry) {
    // Entry gone — either matched (has roomCode) or expired
    return res.json({ matched: false, expired: true });
  }
  if (entry.roomCode) {
    // Match was found by the other player's /join call
    const { roomCode, opponentName, myColor } = entry;
    // Remove from queue now
    const idx = matchQueue.indexOf(entry);
    if (idx !== -1) matchQueue.splice(idx, 1);
    return res.json({ matched: true, roomCode, color: myColor || 'white', opponentName });
  }
  return res.json({ matched: false, queued: true, position: matchQueue.indexOf(entry) + 1 });
});

// DELETE /api/chess/queue/leave  — cancel search
router.delete('/queue/leave', (req, res) => {
  const { queueId } = req.body;
  if (queueId) {
    const idx = matchQueue.findIndex(e => e.queueId === queueId);
    if (idx !== -1) matchQueue.splice(idx, 1);
  }
  res.json({ success: true });
});

module.exports = router;
