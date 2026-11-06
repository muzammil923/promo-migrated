const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const upload = require('../config/upload');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { sendError } = require('../lib/apiError');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'images');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// GET all brick images (public for landing page)
router.get('/', async (req, res) => {
  try {
    const onlyActive = req.query.active === 'true';
    const sql = onlyActive
      ? 'SELECT * FROM brick_images WHERE is_active = 1 ORDER BY sort_order ASC'
      : 'SELECT * FROM brick_images ORDER BY sort_order ASC';
    const [rows] = await db.query(sql);
    res.json({ success: true, images: rows });
  } catch (err) { sendError(res, err); }
});

// GET single brick image
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM brick_images WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Image not found' });
    res.json({ success: true, image: rows[0] });
  } catch (err) { sendError(res, err); }
});

// POST create brick image
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, is_active, sort_order } = req.body;
    let image_url = null;

    if (req.file) {
      image_url = `/uploads/images/${req.file.filename}`;
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    } else {
      return res.status(400).json({ success: false, message: 'Image file or URL required' });
    }

    const [maxOrder] = await db.query('SELECT MAX(sort_order) as max_order FROM brick_images');
    const order = sort_order !== undefined ? Number(sort_order) : (maxOrder[0].max_order || 0) + 1;

    const [result] = await db.query(
      'INSERT INTO brick_images (image_url, name, is_active, sort_order) VALUES (?, ?, ?, ?)',
      [image_url, name || 'Brick Image', is_active !== undefined ? Number(is_active) : 1, order]
    );

    const [newImage] = await db.query('SELECT * FROM brick_images WHERE id = ?', [result.insertId]);
    res.json({ success: true, image: newImage[0] });
  } catch (err) { sendError(res, err); }
});

// PUT update brick image
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM brick_images WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Image not found' });

    const { name, is_active, sort_order } = req.body;
    let image_url = existing[0].image_url;

    if (req.file) {
      image_url = `/uploads/images/${req.file.filename}`;
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }

    await db.query(
      'UPDATE brick_images SET image_url = ?, name = ?, is_active = ?, sort_order = ? WHERE id = ?',
      [
        image_url,
        name !== undefined ? name : existing[0].name,
        is_active !== undefined ? Number(is_active) : existing[0].is_active,
        sort_order !== undefined ? Number(sort_order) : existing[0].sort_order,
        req.params.id
      ]
    );

    const [updated] = await db.query('SELECT * FROM brick_images WHERE id = ?', [req.params.id]);
    res.json({ success: true, image: updated[0] });
  } catch (err) { sendError(res, err); }
});

// DELETE brick image
router.delete('/:id', auth, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT image_url FROM brick_images WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Image not found' });

    // Delete file if local
    const imageUrl = existing[0].image_url;
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', imageUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.query('DELETE FROM brick_images WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

// PUT reorder brick images
router.put('/reorder/batch', auth, async (req, res) => {
  try {
    const { order } = req.body; // [{ id, sort_order }]
    if (!Array.isArray(order)) return res.status(400).json({ success: false, message: 'Invalid order data' });

    for (const item of order) {
      await db.query('UPDATE brick_images SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
    }
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

// PUT toggle active status
router.put('/:id/toggle', auth, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT is_active FROM brick_images WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Image not found' });

    const newStatus = existing[0].is_active ? 0 : 1;
    await db.query('UPDATE brick_images SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);

    const [updated] = await db.query('SELECT * FROM brick_images WHERE id = ?', [req.params.id]);
    res.json({ success: true, image: updated[0] });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
