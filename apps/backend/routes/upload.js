const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../config/upload');

// POST upload image
router.post('/image', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: `/uploads/images/${req.file.filename}`, filename: req.file.filename });
});

// POST upload sound
router.post('/sound', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: `/uploads/sounds/${req.file.filename}`, filename: req.file.filename });
});

module.exports = router;
