const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendError } = require('../lib/apiError');
const env = require('../config/env');

function bdAuth(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access token required' });
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (decoded.role !== 'bd') return res.status(403).json({ success: false, message: 'Not authorized' });
    req.bd = decoded;
    next();
  } catch {
    res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
  try {
    const [rows] = await db.query('SELECT * FROM business_developers WHERE email = ? AND is_active = 1', [email]);
    if (rows.length === 0) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const bd = rows[0];
    const isMatch = await bcrypt.compare(password, bd.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign(
      { id: bd.id, email: bd.email, name: bd.name, role: 'bd' },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ success: true, token, bd: { id: bd.id, name: bd.name, email: bd.email } });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.post('/create', auth, async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) return res.status(400).json({ success: false, message: 'Name, email, and phone required' });
  try {
    const [existing] = await db.query('SELECT id FROM business_developers WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ success: false, message: 'BD with this email already exists' });
    const hashedPw = await bcrypt.hash(phone, 10);
    const [result] = await db.query(
      'INSERT INTO business_developers (name, email, phone, password, created_by) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, hashedPw, req.user.id]
    );
    res.status(201).json({ success: true, message: 'BD created', id: result.insertId });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.get('/list', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, phone, is_active, created_at FROM business_developers ORDER BY created_at DESC');
    res.json({ success: true, bds: rows });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.post('/requests', bdAuth, async (req, res) => {
  const { business_name, gmaps_url, social_url, game_category } = req.body;
  if (!business_name || !game_category) return res.status(400).json({ success: false, message: 'Business name and game category required' });
  try {
    const [result] = await db.query(
      'INSERT INTO bd_requests (bd_id, business_name, gmaps_url, social_url, game_category) VALUES (?, ?, ?, ?, ?)',
      [req.bd.id, business_name, gmaps_url, social_url, game_category]
    );
    // Notify all admins
    await db.query(
      `INSERT INTO notifications (user_id, user_type, type, title, message, link)
       SELECT id, 'admin', 'info', 'New BD Request',
              CONCAT(?, ' submitted a request for ', ?),
              '/dashboard/crm'
       FROM users WHERE role='admin'`,
      [req.bd.name || 'A BD', game_category]
    );
    res.status(201).json({ success: true, message: 'Request submitted', id: result.insertId });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.get('/requests', bdAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, g.status as game_status, g.slug as game_slug, g.name as game_name,
              c.slug as client_slug, c.company_name as client_name
       FROM bd_requests r
       LEFT JOIN games g ON r.game_id = g.id
       LEFT JOIN clients c ON g.client_id = c.id
       WHERE r.bd_id = ? ORDER BY r.created_at DESC`,
      [req.bd.id]
    );
    res.json({ success: true, requests: rows });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.get('/requests/all', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, b.name as bd_name, b.email as bd_email, b.phone as bd_phone,
              g.name as game_name, g.status as game_status, c.company_name as client_name
       FROM bd_requests r
       LEFT JOIN business_developers b ON r.bd_id = b.id
       LEFT JOIN games g ON r.game_id = g.id
       LEFT JOIN clients c ON r.client_id = c.id
       ORDER BY r.created_at DESC`
    );
    res.json({ success: true, requests: rows });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.put('/requests/:id/approve', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT bd_id, business_name FROM bd_requests WHERE id = ?', [req.params.id]);
    await db.query('UPDATE bd_requests SET status = ? WHERE id = ?', ['approved', req.params.id]);
    if (rows.length > 0) {
      await db.query(
        'INSERT INTO notifications (user_id, user_type, type, title, message, link) VALUES (?,?,?,?,?,?)',
        [rows[0].bd_id, 'bd', 'success', 'Request Approved',
         `Your request for "${rows[0].business_name}" has been approved`,
         '/bd/requests']
      );
    }
    res.json({ success: true, message: 'Request approved' });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

router.put('/requests/:id/status', auth, async (req, res) => {
  const { status, client_id, game_id } = req.body;
  const allowed = ['pending','approved','started_working','game_creating','testing','live','rejected'];
  if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
  try {
    const fields = ['status=?'];
    const values = [status];
    if (client_id !== undefined) { fields.push('client_id=?'); values.push(client_id); }
    if (game_id !== undefined) { fields.push('game_id=?'); values.push(game_id); }
    values.push(req.params.id);
    await db.query(`UPDATE bd_requests SET ${fields.join(',')} WHERE id=?`, values);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

module.exports = router;
