const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const { sendError } = require('../lib/apiError');

// List templates (optionally scoped to a client)
router.get('/', auth, async (req, res) => {
  try {
    const clientId = req.query.client_id;
    let sql = 'SELECT id, name, client_id, is_default, preview_image_url, created_at FROM templates';
    const params = [];
    if (clientId) { sql += ' WHERE client_id = ?'; params.push(clientId); }
    sql += ' ORDER BY is_default DESC, name ASC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, templates: rows });
  } catch (err) { console.error(err); sendError(res, err); }
});

// Get one template (full config)
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, template: rows[0] });
  } catch (err) { console.error(err); sendError(res, err); }
});

// Create template
router.post('/', auth, async (req, res) => {
  try {
    const { name, client_id, is_default, config_json, preview_image_url } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Template name required' });
    const cfg = typeof config_json === 'string' ? config_json : JSON.stringify(config_json || {});
    const [result] = await db.query(
      'INSERT INTO templates (name, client_id, is_default, config_json, preview_image_url) VALUES (?, ?, ?, ?, ?)',
      [name, client_id || null, is_default ? 1 : 0, cfg, preview_image_url || null]
    );
    if (is_default) await db.query('UPDATE templates SET is_default = 0 WHERE id <> ? AND client_id <=> ?', [result.insertId, client_id || null]);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { console.error(err); sendError(res, err); }
});

// Update template
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, client_id, is_default, config_json, preview_image_url } = req.body;
    const fields = []; const values = [];
    if (name !== undefined) { fields.push('name=?'); values.push(name); }
    if (client_id !== undefined) { fields.push('client_id=?'); values.push(client_id || null); }
    if (config_json !== undefined) { fields.push('config_json=?'); values.push(typeof config_json === 'string' ? config_json : JSON.stringify(config_json)); }
    if (preview_image_url !== undefined) { fields.push('preview_image_url=?'); values.push(preview_image_url || null); }
    if (is_default !== undefined) {
      fields.push('is_default=?'); values.push(is_default ? 1 : 0);
      if (is_default) await db.query('UPDATE templates SET is_default = 0 WHERE id <> ? AND client_id <=> (SELECT client_id FROM templates WHERE id = ?)', [req.params.id, req.params.id]);
    }
    if (!fields.length) return res.json({ success: true, message: 'Nothing to update' });
    values.push(req.params.id);
    await db.query(`UPDATE templates SET ${fields.join(', ')} WHERE id=?`, values);
    res.json({ success: true, message: 'Template updated' });
  } catch (err) { console.error(err); sendError(res, err); }
});

// Delete template
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM templates WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) { console.error(err); sendError(res, err); }
});

module.exports = router;
