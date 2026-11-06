const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { sendError } = require('../lib/apiError');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'images');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Canva OAuth Configuration ────────────────────────────────────────────────
// Users need to set these in .env:
// CANVA_CLIENT_ID
// CANVA_CLIENT_SECRET
// CANVA_REDIRECT_URI (e.g., http://localhost:8000/api/canva/callback)

const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID || '';
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET || '';
const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI || 'http://localhost:8000/api/canva/callback';

// ── Design Size Templates ────────────────────────────────────────────────────
const DESIGN_TEMPLATES = {
  background: {
    label: 'Game Background',
    width: 1920,
    height: 1080,
    description: 'Full-screen background for your game'
  },
  logo: {
    label: 'Game Logo',
    width: 500,
    height: 500,
    description: 'Square logo displayed in game header'
  },
  question_image: {
    label: 'Question Image',
    width: 800,
    height: 600,
    description: 'Image for quiz/survey questions'
  },
  card_image: {
    label: 'Card Image',
    width: 400,
    height: 400,
    description: 'Image for memory match cards'
  },
  thankyou_bg: {
    label: 'Thank You Background',
    width: 1920,
    height: 1080,
    description: 'Background for thank you/completion page'
  },
  overlay: {
    label: 'Overlay Image',
    width: 1080,
    height: 1920,
    description: 'Full-screen overlay for reveals'
  }
};

// ── GET /api/canva/config ────────────────────────────────────────────────────
// Returns Canva configuration and templates for the frontend
router.get('/config', auth, (req, res) => {
  res.json({
    success: true,
    clientId: CANVA_CLIENT_ID,
    redirectUri: CANVA_REDIRECT_URI,
    templates: DESIGN_TEMPLATES,
    configured: !!CANVA_CLIENT_ID && !!CANVA_CLIENT_SECRET
  });
});

// ── GET /api/canva/auth-url ──────────────────────────────────────────────────
// Generate Canva OAuth authorization URL
router.get('/auth-url', auth, (req, res) => {
  if (!CANVA_CLIENT_ID) {
    return res.status(400).json({
      success: false,
      message: 'Canva integration not configured. Set CANVA_CLIENT_ID in .env'
    });
  }

  const state = Buffer.from(JSON.stringify({
    userId: req.user.id,
    timestamp: Date.now()
  })).toString('base64');

  const authUrl = `https://www.canva.com/api/oauth/authorize?` +
    `response_type=code` +
    `&client_id=${CANVA_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(CANVA_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent('design:content:read design:content:write design:meta:read')}` +
    `&state=${state}`;

  res.json({ success: true, authUrl });
});

// ── GET /api/canva/callback ──────────────────────────────────────────────────
// Handle Canva OAuth callback
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code missing');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://www.canva.com/api/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: CANVA_CLIENT_ID,
        client_secret: CANVA_CLIENT_SECRET,
        code: code,
        redirect_uri: CANVA_REDIRECT_URI
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(400).send('Failed to get access token');
    }

    // In a real implementation, store the token securely per user
    // For now, redirect back to the frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard/games?canva=connected`);
  } catch (err) {
    console.error('Canva OAuth error:', err);
    res.status(500).send('OAuth failed');
  }
});

// ── POST /api/canva/upload-design ────────────────────────────────────────────
// Receive exported design from Canva (called by Canva app or manually)
router.post('/upload-design', async (req, res) => {
  try {
    const { imageBase64, gameId, imageType, templateId, source } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    // Determine file extension from base64 header
    const matches = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, message: 'Invalid image format' });
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    // Generate filename
    const filename = `canva_${gameId || 'general'}_${imageType || 'design'}_${uuidv4().slice(0, 8)}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Save file
    fs.writeFileSync(filepath, buffer);

    const imageUrl = `/uploads/images/${filename}`;

    console.log(`✅ Canva design uploaded: ${filename} (${source || 'manual'})`);

    res.json({
      success: true,
      imageUrl,
      filename,
      size: buffer.length,
      type: imageType,
      template: DESIGN_TEMPLATES[imageType] || null
    });
  } catch (err) {
    console.error('Upload design error:', err);
    sendError(res, err);
  }
});

// ── GET /api/canva/templates ─────────────────────────────────────────────────
// Get available design templates
router.get('/templates', auth, (req, res) => {
  const { gameType } = req.query;

  // Filter templates based on game type if needed
  let templates = { ...DESIGN_TEMPLATES };

  // Add game-specific templates
  if (gameType === 'memory' || gameType === 'jigsaw') {
    templates.puzzle_piece = {
      label: 'Puzzle Piece',
      width: 400,
      height: 400,
      description: 'Individual puzzle piece image'
    };
  }

  if (gameType === 'crossword' || gameType === 'wordsearch') {
    templates.word_tile = {
      label: 'Word Tile',
      width: 200,
      height: 200,
      description: 'Tile for word display'
    };
  }

  res.json({ success: true, templates });
});

module.exports = router;
