const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const { geocodePincode } = require('../lib/geocode');
const path = require('path');
const { sendError } = require('../lib/apiError');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/images')),
  filename: (req, file, cb) => cb(null, `client-${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-')
    .replace(/^-+/, '').replace(/-+$/, '');
}

// GET all clients
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.name as created_by_name,
       (SELECT COUNT(*) FROM games g WHERE g.client_id = c.id) as game_count
       FROM clients c
       LEFT JOIN users u ON c.created_by = u.id
       ORDER BY c.created_at DESC`
    );
    res.json({ success: true, clients: rows });
  } catch (err) {
    sendError(res, err);
  }
});

// GET single client
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, client: rows[0] });
  } catch (err) {
    sendError(res, err);
  }
});

// POST create client
router.post('/', requireAdmin, upload.single('logo'), async (req, res) => {
  const { company_name, contact_name, email, phone, address, notes } = req.body;
  if (!company_name) return res.status(400).json({ success: false, message: 'Company name required' });

  try {
    let slug = slugify(company_name);
    const [existing] = await db.query('SELECT id FROM clients WHERE slug = ?', [slug]);
    if (existing.length > 0) slug = `${slug}-${Date.now()}`;

    const logo_url = req.file ? `/uploads/images/${req.file.filename}` : req.body.logo_url || null;

    const [result] = await db.query(
      `INSERT INTO clients (company_name, contact_name, email, phone, address, notes, slug, logo_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [company_name, contact_name, email, phone, address, notes, slug, logo_url, req.user.id]
    );
    const clientId = result.insertId;

    // Auto-create a parent Business Owner for this client (brand-level login)
    if (email) {
      try {
        const pw = phone || email;
        const hashedPw = await bcrypt.hash(pw, 10);
        await db.query(
          'INSERT INTO business_owners (business_name, email, password, phone, client_id) VALUES (?, ?, ?, ?, ?)',
          [company_name, email, hashedPw, phone || null, clientId]
        );
      } catch {}
    }

    const [newClient] = await db.query('SELECT * FROM clients WHERE id = ?', [clientId]);
    res.status(201).json({ success: true, client: newClient[0] });
  } catch (err) {
    sendError(res, err);
  }
});

// PUT update client
router.put('/:id', requireAdmin, upload.single('logo'), async (req, res) => {
  const { company_name, contact_name, email, phone, address, notes } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Client not found' });

    const logo_url = req.file ? `/uploads/images/${req.file.filename}` : (req.body.logo_url !== undefined ? req.body.logo_url : existing[0].logo_url);

    await db.query(
      `UPDATE clients SET company_name=?, contact_name=?, email=?, phone=?, address=?, notes=?, logo_url=? WHERE id=?`,
      [company_name, contact_name, email, phone, address, notes, logo_url, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    res.json({ success: true, client: updated[0] });
  } catch (err) {
    sendError(res, err);
  }
});

// GET games for a client
router.get('/:id/games', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT g.id, g.name, g.slug, g.category, g.is_active, g.game_logo_url, g.created_at,
      g.parent_game_id, g.location_name, g.business_owner_id,
      (SELECT COUNT(*) FROM questions q WHERE q.game_id = g.id) as question_count,
      (SELECT COUNT(*) FROM player_sessions ps WHERE ps.game_id = g.id AND ps.completed = 1) as play_count
      FROM games g WHERE g.client_id = ? ORDER BY g.created_at DESC
    `, [req.params.id]);
    res.json({ success: true, games: rows });
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE client
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    // Also delete associated business owners
    await db.query('DELETE FROM business_owners WHERE client_id = ?', [req.params.id]);
    await db.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Client deleted' });
  } catch (err) {
    sendError(res, err);
  }
});

// GET branches for a client
router.get('/:id/branches', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT bo.id, bo.business_name, bo.email, bo.phone, bo.pincode, bo.is_active, bo.created_at,
              (SELECT COUNT(*) FROM business_owner_games bog WHERE bog.business_owner_id = bo.id) as game_count
       FROM business_owners bo
       WHERE bo.client_id = ? AND bo.parent_id IS NOT NULL
       ORDER BY bo.created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, branches: rows });
  } catch (err) {
    sendError(res, err);
  }
});

// POST create a branch under a client
router.post('/:id/branches', requireAdmin, async (req, res) => {
  const { branch_name, email, phone, pincode } = req.body;
  if (!branch_name || !email || !phone) return res.status(400).json({ success: false, message: 'Branch name, email, and phone required' });
  try {
    // Find the parent BO for this client
    let [parentRows] = await db.query(
      'SELECT id FROM business_owners WHERE client_id = ? AND parent_id IS NULL LIMIT 1',
      [req.params.id]
    );

    // Auto-create parent BO if missing
    if (parentRows.length === 0) {
      const [client] = await db.query('SELECT company_name, email, phone FROM clients WHERE id = ?', [req.params.id]);
      if (client.length > 0 && client[0].email) {
        const pw = client[0].phone || client[0].email;
        const hashedPw = await bcrypt.hash(pw, 10);
        const [r] = await db.query(
          'INSERT INTO business_owners (business_name, email, password, phone, client_id) VALUES (?, ?, ?, ?, ?)',
          [client[0].company_name, client[0].email, hashedPw, pw, req.params.id]
        );
        parentRows = [{ id: r.insertId }];
      } else {
        return res.status(400).json({ success: false, message: 'Client has no email set. Update the client first.' });
      }
    }

    const [existing] = await db.query(
      'SELECT id FROM business_owners WHERE business_name = ? AND client_id = ?',
      [branch_name, req.params.id]
    );
    if (existing.length > 0) return res.status(409).json({ success: false, message: 'Branch name already exists for this client' });

    // Geocode pincode → lat/lng for the map (free OSM, fallback to Karnataka centroid)
    let geo = {}
    try { geo = pincode ? await geocodePincode(pincode) : {} }
    catch { geo = {} }

    // Phone is the login password
    const hashedPw = await bcrypt.hash(phone, 10);
    const [result] = await db.query(
      'INSERT INTO business_owners (business_name, email, password, phone, pincode, parent_id, client_id, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [branch_name, email, hashedPw, phone, pincode || null, parentRows[0].id, req.params.id, geo.latitude || null, geo.longitude || null]
    );
    res.status(201).json({ success: true, id: result.insertId, message: 'Branch created' });
  } catch (err) {
    sendError(res, err);
  }
});

// PUT update a branch
router.put('/:id/branches/:branchId', requireAdmin, async (req, res) => {
  const { is_active, phone, pincode } = req.body;
  try {
    const updates = [];
    const vals = [];
    if (is_active !== undefined) { updates.push('is_active = ?'); vals.push(is_active ? 1 : 0); }
    if (phone) { updates.push('password = ?'); vals.push(await bcrypt.hash(phone, 10)); updates.push('phone = ?'); vals.push(phone); }
    if (pincode !== undefined) { updates.push('pincode = ?'); vals.push(pincode || null); }
    if (updates.length > 0) {
      vals.push(req.params.branchId, req.params.id);
      await db.query(`UPDATE business_owners SET ${updates.join(', ')} WHERE id = ? AND client_id = ?`, vals);
    }
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE a branch
router.delete('/:id/branches/:branchId', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM business_owners WHERE id = ? AND client_id = ?', [req.params.branchId, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
});

// GET canvas node positions for a client
router.get('/:id/canvas', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT positions FROM canvas_layout WHERE client_id = ?', [req.params.id]);
    res.json({ success: true, positions: rows[0]?.positions || {} });
  } catch (err) {
    sendError(res, err);
  }
});

// PUT (save) canvas node positions for a client
router.put('/:id/canvas', requireAdmin, async (req, res) => {
  try {
    const positions = req.body.positions || {};
    await db.query(
      `INSERT INTO canvas_layout (client_id, positions) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE positions = VALUES(positions)`,
      [req.params.id, JSON.stringify(positions)]
    );
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE (reset) canvas node positions for a client -> reverts to auto layout
router.delete('/:id/canvas', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM canvas_layout WHERE client_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
