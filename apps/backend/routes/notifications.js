const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sendError } = require('../lib/apiError');

function getUser(req) {
  if (req.user) return { id: req.user.id, type: 'admin' };
  if (req.it)   return { id: req.it.id,   type: 'it' };
  if (req.bd)   return { id: req.bd.id,   type: 'bd' };
  return null;
}

// GET /api/notifications — list notifications for current user
router.get('/', async (req, res) => {
  const u = getUser(req);
  if (!u) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    const [rows] = await db.query(
      `SELECT id, type, title, message, link, read_at, created_at
       FROM notifications WHERE user_id=? AND user_type=?
       ORDER BY created_at DESC LIMIT 20`,
      [u.id, u.type]
    );
    const [countRow] = await db.query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE user_id=? AND user_type=? AND read_at IS NULL`,
      [u.id, u.type]
    );
    res.json({ success: true, notifications: rows, unreadCount: countRow[0].count });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', async (req, res) => {
  const u = getUser(req);
  if (!u) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    await db.query(
      'UPDATE notifications SET read_at=NOW() WHERE user_id=? AND user_type=? AND read_at IS NULL',
      [u.id, u.type]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

// PUT /api/notifications/:id/read — mark single notification as read
router.put('/:id/read', async (req, res) => {
  const u = getUser(req);
  if (!u) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    await db.query(
      'UPDATE notifications SET read_at=NOW() WHERE id=? AND user_id=? AND user_type=?',
      [req.params.id, u.id, u.type]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
});

module.exports = router;
