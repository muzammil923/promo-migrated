const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendError } = require('../lib/apiError');
const env = require('../config/env');

function itAuth(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access token required' });
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (decoded.role !== 'internal_team') return res.status(403).json({ success: false, message: 'Not authorized' });
    req.it = decoded;
    next();
  } catch {
    res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
  try {
    const [rows] = await db.query('SELECT * FROM internal_team WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const member = rows[0];
    if (!member.password) return res.status(401).json({ success: false, message: 'Account not set up yet' });
    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign(
      { id: member.id, email: member.email, name: member.name, role: 'internal_team' },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ success: true, token, member: { id: member.id, name: member.name, email: member.email } });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.get('/requests', itAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, b.name as bd_name, b.email as bd_email, b.phone as bd_phone,
              g.name as game_name, g.status as game_status, g.slug as game_slug,
              c.company_name as client_name, c.slug as client_slug
       FROM bd_requests r
       LEFT JOIN business_developers b ON r.bd_id = b.id
       LEFT JOIN games g ON r.game_id = g.id
       LEFT JOIN clients c ON r.client_id = c.id
       WHERE r.assigned_to = ? ORDER BY r.created_at DESC`,
      [req.it.id]
    );
    res.json({ success: true, requests: rows });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.put('/requests/:id/status', itAuth, async (req, res) => {
  const { status, client_id, game_id } = req.body;
  const allowed = ['pending','approved','started_working','game_creating','testing','live','rejected'];
  if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
  try {
    const [rows] = await db.query('SELECT id, game_id FROM bd_requests WHERE id = ? AND assigned_to = ?', [req.params.id, req.it.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Request not found or not assigned to you' });
    const fields = ['status=?'];
    const values = [status];
    if (client_id !== undefined) { fields.push('client_id=?'); values.push(client_id); }
    if (game_id !== undefined) { fields.push('game_id=?'); values.push(game_id); }
    values.push(req.params.id);
    await db.query(`UPDATE bd_requests SET ${fields.join(',')} WHERE id=?`, values);
    // Auto-sync game to live when request goes live
    if (status === 'live') {
      const gid = game_id || rows[0].game_id;
      if (gid) await db.query('UPDATE games SET status=?, is_active=1 WHERE id=? AND status!=?', ['live', gid, 'live']);
    }
    // Notify the BD about the status change
    const [reqInfo] = await db.query('SELECT bd_id, business_name FROM bd_requests WHERE id=?', [req.params.id]);
    if (reqInfo.length > 0) {
      const labels = { pending:'Pending', approved:'Approved', started_working:'Started Working',
                       game_creating:'Game Creating', testing:'Testing', live:'Live', rejected:'Rejected' };
      await db.query(
        'INSERT INTO notifications (user_id, user_type, type, title, message, link) VALUES (?,?,?,?,?,?)',
        [reqInfo[0].bd_id, 'bd', status==='live'?'success':status==='rejected'?'error':'info',
         `Request ${labels[status]||status}`,
         `Your request for "${reqInfo[0].business_name}" is now ${labels[status]||status}`,
         '/bd/requests']
      );
    }
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.get('/list', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, phone, role, permissions, created_at FROM internal_team ORDER BY created_at DESC');
    res.json({ success: true, members: rows });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.post('/create', auth, async (req, res) => {
  const { name, email, phone, permissions } = req.body;
  if (!name || !email || !phone) return res.status(400).json({ success: false, message: 'Name, email, and phone required' });
  try {
    const [existing] = await db.query('SELECT id FROM internal_team WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ success: false, message: 'Member with this email already exists' });
    const hashedPw = await bcrypt.hash(phone, 10);
    const perms = Array.isArray(permissions) ? JSON.stringify(permissions) : null;
    const [result] = await db.query(
      'INSERT INTO internal_team (name, email, phone, password, permissions) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, hashedPw, perms]
    );
    res.status(201).json({ success: true, message: 'Internal team member created', id: result.insertId });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.put('/:id', auth, async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name && !email && !phone) return res.status(400).json({ success: false, message: 'Nothing to update' });
  try {
    const fields = []; const values = [];
    if (name !== undefined) { fields.push('name=?'); values.push(name); }
    if (email !== undefined) { fields.push('email=?'); values.push(email); }
    if (phone !== undefined) { fields.push('phone=?'); values.push(phone); if (!req.body.skipPasswordReset) { const hashedPw = await bcrypt.hash(phone, 10); fields.push('password=?'); values.push(hashedPw); } }
    values.push(req.params.id);
    await db.query(`UPDATE internal_team SET ${fields.join(',')} WHERE id=?`, values);
    res.json({ success: true, message: 'Member updated' });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM internal_team WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Member deleted' });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.put('/:id/permissions', auth, async (req, res) => {
  const { permissions } = req.body;
  if (!Array.isArray(permissions)) return res.status(400).json({ success: false, message: 'permissions must be an array' });
  try {
    await db.query('UPDATE internal_team SET permissions=? WHERE id=?', [JSON.stringify(permissions), req.params.id]);
    res.json({ success: true, message: 'Permissions updated' });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// GET /internal-team/redemption-logs — Admin view of all redemptions
router.get('/redemption-logs', auth, async (req, res) => {
  try {
    const { status, bo_id, game_id, start_date, end_date } = req.query;
    let where = ['1=1']
    let params = []
    if (status) { where.push('br.status = ?'); params.push(status) }
    if (bo_id) { where.push('br.business_owner_id = ?'); params.push(bo_id) }
    if (game_id) { where.push('br.game_id = ?'); params.push(game_id) }
    if (start_date) { where.push('br.created_at >= ?'); params.push(start_date) }
    if (end_date) { where.push('br.created_at <= ?'); params.push(end_date) }
    const [rows] = await db.query(
      `SELECT br.*, g.name as game_name, bo.business_name, bo.email as bo_email,
              a.business_name as accepted_by_name, r.business_name as rejected_by_name
       FROM business_redemptions br
       JOIN business_owners bo ON br.business_owner_id = bo.id
       JOIN games g ON br.game_id = g.id
       LEFT JOIN business_owners a ON br.accepted_by = a.id
       LEFT JOIN business_owners r ON br.rejected_by = r.id
       WHERE ${where.join(' AND ')}
       ORDER BY br.created_at DESC LIMIT 500`,
      params
    );
    res.json({ success: true, redemptions: rows });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// ── Helper: get all game IDs owned/assigned to a business owner ──
async function getBusinessOwnerGameIds(boId) {
  const [rows] = await db.query(
    `SELECT DISTINCT game_id FROM business_owner_games WHERE business_owner_id = ?
     UNION SELECT id FROM games WHERE business_owner_id = ?`,
    [boId, boId]
  );
  return rows.map(r => r.game_id).filter(Boolean);
}

// GET /internal-team/bo-logs — list all business owners with summary stats
router.get('/bo-logs', auth, async (req, res) => {
  try {
    const [bos] = await db.query(
      `SELECT bo.id, bo.business_name, bo.email, bo.phone, bo.created_at,
              bo.parent_id, bo.client_id, c.company_name as client_name
       FROM business_owners bo
       LEFT JOIN clients c ON bo.client_id = c.id
       ORDER BY c.company_name ASC, bo.parent_id IS NULL DESC, bo.business_name ASC`
    );
    const result = [];
    for (const bo of bos) {
      const gameIds = await getBusinessOwnerGameIds(bo.id);
      let plays = 0, redemptions = 0, withCode = 0, withoutCode = 0;
      if (gameIds.length) {
        const [stats] = await db.query(
          `SELECT
             COUNT(DISTINCT ps.id) as plays,
             COUNT(DISTINCT br.id) as redemptions,
             SUM(CASE WHEN br.id IS NOT NULL AND br.code IS NOT NULL AND br.code <> '' THEN 1 ELSE 0 END) as with_code,
             SUM(CASE WHEN br.id IS NOT NULL AND (br.code IS NULL OR br.code = '') THEN 1 ELSE 0 END) as without_code
           FROM player_sessions ps
           LEFT JOIN business_redemptions br ON br.session_id = ps.id AND br.business_owner_id = ?
           WHERE ps.game_id IN (?)`,
          [bo.id, gameIds]
        );
        plays = stats[0]?.plays || 0;
        redemptions = stats[0]?.redemptions || 0;
        withCode = stats[0]?.with_code || 0;
        withoutCode = stats[0]?.without_code || 0;
      }
      result.push({
        id: bo.id,
        business_name: bo.business_name,
        email: bo.email,
        phone: bo.phone,
        created_at: bo.created_at,
        parent_id: bo.parent_id,
        client_id: bo.client_id,
        client_name: bo.client_name || null,
        kind: bo.parent_id ? 'location' : 'brand',
        total_games: gameIds.length,
        total_plays: plays,
        total_redemptions: redemptions,
        with_code: withCode,
        without_code: withoutCode
      });
    }
    res.json({ success: true, business_owners: result });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// GET /internal-team/bo-logs/game/:gameId — list business owners with stats for a specific game
router.get('/bo-logs/game/:gameId', auth, async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const [game] = await db.query('SELECT id, name FROM games WHERE id = ?', [gameId]);
    if (!game.length) return res.status(404).json({ success: false, message: 'Game not found' });

    const [bos] = await db.query(
      `SELECT bo.id, bo.business_name, bo.email, bo.phone, bo.created_at,
              bo.parent_id, bo.client_id, c.company_name as client_name
       FROM business_owners bo
       LEFT JOIN clients c ON bo.client_id = c.id
       WHERE bo.id IN (SELECT business_owner_id FROM business_owner_games WHERE game_id = ?)
          OR bo.id = (SELECT business_owner_id FROM games WHERE id = ?)
       ORDER BY c.company_name ASC, bo.parent_id IS NULL DESC, bo.business_name ASC`,
      [gameId, gameId]
    );

    const result = [];
    for (const bo of bos) {
      let plays = 0, redemptions = 0, withCode = 0, withoutCode = 0;
      const [stats] = await db.query(
        `SELECT
           COUNT(DISTINCT ps.id) as plays,
           COUNT(DISTINCT br.id) as redemptions,
           SUM(CASE WHEN br.id IS NOT NULL AND br.code IS NOT NULL AND br.code <> '' THEN 1 ELSE 0 END) as with_code,
           SUM(CASE WHEN br.id IS NOT NULL AND (br.code IS NULL OR br.code = '') THEN 1 ELSE 0 END) as without_code
         FROM player_sessions ps
         LEFT JOIN business_redemptions br ON br.session_id = ps.id AND br.business_owner_id = ?
         WHERE ps.game_id = ?`,
        [bo.id, gameId]
      );
      plays = stats[0]?.plays || 0;
      redemptions = stats[0]?.redemptions || 0;
      withCode = stats[0]?.with_code || 0;
      withoutCode = stats[0]?.without_code || 0;

      result.push({
        id: bo.id,
        business_name: bo.business_name,
        email: bo.email,
        phone: bo.phone,
        created_at: bo.created_at,
        parent_id: bo.parent_id,
        client_id: bo.client_id,
        client_name: bo.client_name || null,
        kind: bo.parent_id ? 'location' : 'brand',
        total_games: 1,
        total_plays: plays,
        total_redemptions: redemptions,
        with_code: withCode,
        without_code: withoutCode
      });
    }
    res.json({ success: true, game: { id: game[0].id, name: game[0].name }, business_owners: result });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// GET /internal-team/bo-logs/:boId/entries — detailed play + redemption log for one BO
// Includes players who played but never redeemed ("Played, not redeemed")
// Supports optional game_id query parameter to filter by specific game
router.get('/bo-logs/:boId/entries', auth, async (req, res) => {
  try {
    const boId = req.params.boId;
    const { start_date, end_date, game_id } = req.query;
    const gameIds = game_id ? [game_id] : await getBusinessOwnerGameIds(boId);
    if (!gameIds.length) return res.json({ success: true, entries: [] });

    let dateFilter = '';
    const params = [boId, gameIds];
    if (start_date) { dateFilter += ' AND ps.started_at >= ?'; params.push(start_date); }
    if (end_date) { dateFilter += ' AND ps.started_at <= ?'; params.push(end_date); }

    const [rows] = await db.query(
      `SELECT
         ps.id AS session_id,
         ps.game_id,
         g.name AS game_name,
         ps.score,
         ps.total_scoreable,
         ps.completed,
         ps.started_at AS played_at,
         ps.completed_at,
         ps.player_data,
          br.id AS redemption_id,
          br.status AS redemption_status,
          br.code,
          br.accepted_at,
          br.updated_at AS redemption_updated_at,
          br.rejected_at,
          br.reject_reason,
          br.table_number,
          br.player_name AS br_player_name,
          br.player_phone AS br_player_phone,
          br.player_email AS br_player_email,
          a.business_name AS accepted_by_name
       FROM player_sessions ps
       JOIN games g ON ps.game_id = g.id
       LEFT JOIN business_redemptions br ON br.session_id = ps.id AND br.business_owner_id = ?
       LEFT JOIN business_owners a ON br.accepted_by = a.id
       WHERE ps.game_id IN (?)
       ${dateFilter}
       ORDER BY ps.started_at DESC
       LIMIT 1000`,
      params
    );

    const entries = rows.map(r => {
      let playerData = {};
      try { playerData = typeof r.player_data === 'string' ? JSON.parse(r.player_data) : (r.player_data || {}); }
      catch { playerData = {}; }
      const codePresent = r.code != null && String(r.code).trim() !== '';
      let redemptionState = 'played_not_redeemed';
      if (r.redemption_id) {
        redemptionState = codePresent ? 'accepted_with_code' : 'accepted_without_code';
      }
      const acceptedAt = r.accepted_at || (r.redemption_status ? (r.redemption_updated_at || r.played_at) : null);
      return {
        session_id: r.session_id,
        game_id: r.game_id,
        game_name: r.game_name,
        score: r.score,
        total_scoreable: r.total_scoreable,
        completed: !!r.completed,
        played_at: r.played_at,
        completed_at: r.completed_at,
        player_data: playerData,
        redemption_id: r.redemption_id,
        redemption_status: r.redemption_status,
        redemption_state: redemptionState,
        code_present: codePresent,
        code: r.code,
        accepted_at: r.accepted_at,
        rejected_at: r.rejected_at,
        reject_reason: r.reject_reason,
        table_number: r.table_number,
        accepted_by_name: r.accepted_by_name,
        player_name: r.br_player_name || playerData.Name || playerData.name || playerData.FullName || playerData.fullName || '',
        player_email: r.br_player_email || playerData.Email || playerData.email || '',
        player_phone: r.br_player_phone || playerData.Phone || playerData.phone || playerData.Mobile || ''
      };
    });

    res.json({ success: true, entries });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

module.exports = router;
module.exports.itAuth = itAuth;
