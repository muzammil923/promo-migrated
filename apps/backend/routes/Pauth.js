/**
 * /api/pauth  —  PromoPlayer authentication routes
 *
 * POST /api/pauth/check-email   → is this admin or player?
 * POST /api/pauth/send-otp      → generate & email 4-digit OTP
 * POST /api/pauth/verify-otp    → verify OTP, return JWT + player info
 * POST /api/pauth/register      → create new promo_player + 100 PC welcome bonus
 * GET  /api/pauth/me            → get logged-in player profile (requires playerAuth)
 */

const express    = require('express');
const router     = express.Router();
const db         = require('../config/db');
const jwt        = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { sendError } = require('../lib/apiError');
const env = require('../config/env');

(async () => {
  try { await db.query(`ALTER TABLE promo_players ADD COLUMN IF NOT EXISTS avatar_id VARCHAR(20) DEFAULT 'av-1'`); } catch {}
  try { await db.query(`ALTER TABLE promo_players ADD COLUMN IF NOT EXISTS age INT DEFAULT NULL`); } catch {}
})();
require('dotenv').config();

// ── Email transporter (uses your existing Gmail SMTP from .env) ────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
});

// ── Helper: generate 4-digit OTP ──────────────────────────────────────────
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ── Helper: send OTP email ────────────────────────────────────────────────
async function sendOTPEmail(email, otp) {
  await transporter.sendMail({
    from:    `"PromoGames" <${process.env.SMTP_USER}>`,
    to:      email,
    subject: `Your PromoGames login code: ${otp}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f8f8ff;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:40px;">🎮</span>
          <h2 style="color:#6366f1;margin:8px 0 0;">PromoGames</h2>
        </div>
        <p style="font-size:16px;color:#333;">Your one-time login code is:</p>
        <div style="text-align:center;margin:24px 0;">
          <span style="font-size:48px;font-weight:bold;letter-spacing:12px;color:#6366f1;">${otp}</span>
        </div>
        <p style="font-size:13px;color:#888;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `,
  });
}

// ── Middleware: verify player JWT ─────────────────────────────────────────
function playerAuth(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Login required' });
  try {
    req.player = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ success: false, message: 'Session expired, please login again' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pauth/check-email
// Body: { email }
// Returns: { type: 'admin' | 'player' | 'new' }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  try {
    // 1. Check admin table (users)
    const [adminRows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (adminRows.length > 0) {
      return res.json({ success: true, type: 'admin' });
    }

    // 1.5 Check business owners table
    try {
      const [boRows] = await db.query('SELECT id FROM business_owners WHERE email = ? AND is_active = 1', [email]);
      if (boRows.length > 0) {
        return res.json({ success: true, type: 'business_owner' });
      }
    } catch {
      // business_owners table may not exist yet
    }

    // 2. Check internal team table (gracefully skip if table doesn't exist)
    try {
      const [teamRows] = await db.query('SELECT id FROM internal_team WHERE email = ?', [email]);
      if (teamRows.length > 0) {
        return res.json({ success: true, type: 'internal_team' });
      }
    } catch {
      // internal_team table may not exist yet — skip silently
    }

    // 3. Check promo_players table
    const [playerRows] = await db.query('SELECT id FROM promo_players WHERE email = ?', [email]);
    if (playerRows.length > 0) {
      return res.json({ success: true, type: 'player' });
    }

    // 4. Brand new user
    return res.json({ success: true, type: 'new' });
  } catch (err) {
    sendError(res, err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pauth/send-otp
// Body: { email }
// Generates 4-digit OTP, stores in otp_tokens, sends Gmail
// ─────────────────────────────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing unused OTPs for this email
    await db.query('UPDATE otp_tokens SET used = 1 WHERE email = ? AND used = 0', [email]);

    // Store new OTP
    await db.query(
      'INSERT INTO otp_tokens (email, otp_code, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt]
    );

    // Try to send email (works in both dev and production)
    try {
      await sendOTPEmail(email, otp);
      console.log(`✅ OTP email sent to ${email}`);
    } catch (emailErr) {
      // If email fails, log OTP to console as fallback
      console.error('OTP email delivery failed for', email);
    }

    res.json({ success: true, message: `OTP sent to ${email}` });
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Check SMTP config.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pauth/verify-otp
// Body: { email, otp }
// Returns: JWT + { type: 'player' | 'new' } so frontend knows where to go
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

  try {
    // Dev bypass: accept "0000" as dummy OTP in development mode
    let otpRow = null;
    if (otp === '0000' && process.env.NODE_ENV === 'development') {
      otpRow = { id: 0, email };
    } else {
      // Find latest unused, non-expired OTP for this email
      const [rows] = await db.query(
        `SELECT * FROM otp_tokens
         WHERE email = ? AND otp_code = ? AND used = 0 AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [email, otp]
      );
      if (rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }
      otpRow = rows[0];
      await db.query('UPDATE otp_tokens SET used = 1 WHERE id = ?', [otpRow.id]);
    }

    // Check if player exists in promo_players
    const [playerRows] = await db.query('SELECT * FROM promo_players WHERE email = ?', [email]);

    if (playerRows.length > 0) {
      const player = playerRows[0];
      const token = jwt.sign(
        { id: player.id, email: player.email, name: player.name, role: 'player' },
        env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      return res.json({
        success: true,
        type: 'player',
        token,
        player: {
          id: player.id, name: player.name, email: player.email,
          pc_balance: player.pc_balance, city: player.city, avatar_id: player.avatar_id,
        },
      });
    }

    // Check if email belongs to internal_team — auto-create promo_player
    try {
      const [teamRows] = await db.query('SELECT id, name FROM internal_team WHERE email = ?', [email]);
      if (teamRows.length > 0) {
        const teamMember = teamRows[0];
        const [insertResult] = await db.query(
          `INSERT INTO promo_players (name, email, pc_balance, avatar_id)
           VALUES (?, ?, 100, 'av-3')
           ON DUPLICATE KEY UPDATE name = VALUES(name)`,
          [teamMember.name || email, email]
        );
        const playerId = insertResult.insertId;
        const [newPlayer] = await db.query('SELECT * FROM promo_players WHERE id = ?', [playerId]);
        const player = newPlayer[0];
        const token = jwt.sign(
          { id: player.id, email: player.email, name: player.name, role: 'player' },
          env.JWT_SECRET,
          { expiresIn: '30d' }
        );
        return res.json({
          success: true,
          type: 'player',
          token,
          player: {
            id: player.id, name: player.name, email: player.email,
            pc_balance: player.pc_balance, city: player.city, avatar_id: player.avatar_id,
          },
        });
      }
    } catch {
      // internal_team table may not exist yet — skip silently
    }

    // ── Instant signup: create the player right here with an incomplete profile ──
    // No forced name/username form — they're logged in immediately, +100 PC
    // welcome bonus lands now, and profile details can be filled in later.
    const fallbackName = (email.split('@')[0].replace(/[^a-zA-Z0-9_ ]/g, '').trim() || 'Player').slice(0, 60);
    try {
      const [ins] = await db.query(
        `INSERT INTO promo_players (name, email, pc_balance, avatar_id, profile_complete)
         VALUES (?, ?, 100, 'av-1', 0)`,
        [fallbackName, email]
      );
      const playerId = ins.insertId;
      await db.query(
        `INSERT INTO pc_transactions (player_id, type, points, note)
         VALUES (?, 'earn', 100, 'Welcome bonus')`,
        [playerId]
      );
      const token = jwt.sign(
        { id: playerId, email, name: fallbackName, role: 'player' },
        env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      return res.json({
        success: true,
        type: 'player',
        created: true,
        token,
        player: { id: playerId, name: fallbackName, email, pc_balance: 100, avatar_id: 'av-1' },
      });
    } catch (err) {
      // Race: another request created the account between OTP verify and here
      if (err.code === 'ER_DUP_ENTRY') {
        const [dupe] = await db.query('SELECT * FROM promo_players WHERE email = ?', [email]);
        if (dupe.length > 0) {
          const player = dupe[0];
          const token = jwt.sign(
            { id: player.id, email: player.email, name: player.name, role: 'player' },
            env.JWT_SECRET,
            { expiresIn: '30d' }
          );
          return res.json({
            success: true, type: 'player', token,
            player: { id: player.id, name: player.name, email: player.email, pc_balance: player.pc_balance, avatar_id: player.avatar_id },
          });
        }
      }
      throw err;
    }
  } catch (err) {
    sendError(res, err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pauth/check-username
// Body: { username }
// Returns { available: true/false }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body
    if (!username || username.length < 3) {
      return res.json({ available: false, message: 'Username must be at least 3 characters' })
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      return res.json({ available: false, message: 'Only lowercase letters, numbers and underscores' })
    }
    const [[row]] = await db.query('SELECT id FROM promo_players WHERE username = ?', [username])
    res.json({ available: !row })
  } catch (err) {
    sendError(res, err)
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pauth/register
// Body: { tempToken, name, dob, whatsapp, city, pincode }
// Creates promo_player + 100 PC welcome bonus transaction
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { tempToken, name, username: rawUsername, dob, whatsapp, city, pincode, avatar_id } = req.body;

  if (!tempToken || !name || !rawUsername) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const username = rawUsername.trim().toLowerCase();
  if (username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
    return res.status(400).json({ success: false, message: 'Invalid username format' });
  }

  let email;
  try {
    const decoded = jwt.verify(tempToken, env.JWT_SECRET);
    if (decoded.role !== 'pending') throw new Error('Invalid token type');
    email = decoded.email;
  } catch {
    return res.status(403).json({ success: false, message: 'Registration session expired. Please login again.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM promo_players WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Account already exists for this email' });
    }

    // Server-side username uniqueness check
    const [[dup]] = await db.query('SELECT id FROM promo_players WHERE username = ?', [username]);
    if (dup) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }

    let ageValue = null;
    if (dob) {
      const [ageRow] = await db.query('SELECT TIMESTAMPDIFF(YEAR, ?, CURDATE()) as age', [dob]);
      ageValue = ageRow[0].age;
    }

    const [result] = await db.query(
      `INSERT INTO promo_players (name, username, dob, age, email, whatsapp, city, pincode, pc_balance, avatar_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 100, ?)`,
      [name, username, dob || null, ageValue, email, whatsapp || null, city || null, pincode || null, avatar_id || 'av-3']
    );

    const playerId = result.insertId;

    // Log the welcome bonus in pc_transactions
    await db.query(
      `INSERT INTO pc_transactions (player_id, type, points, note)
       VALUES (?, 'earn', 100, 'Welcome bonus')`,
      [playerId]
    );

    // Issue full JWT
    const token = jwt.sign(
      { id: playerId, email, name, role: 'player' },
      env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      player: { id: playerId, name, email, pc_balance: 100, city, avatar_id: avatar_id || 'av-3' },
    });
  } catch (err) {
    sendError(res, err);
  }
});

// PUT /api/pauth/update-username
// Sets/changes username; flips profile_complete once chosen.
router.put('/update-username', playerAuth, async (req, res) => {
  try {
    const username = String(req.body.username || '').trim().toLowerCase();
    if (!username || username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
      return res.status(400).json({ success: false, message: 'Username must be 3+ chars: lowercase letters, numbers, _' });
    }
    const [[dup]] = await db.query('SELECT id FROM promo_players WHERE username = ? AND id != ?', [username, req.player.id]);
    if (dup) return res.status(409).json({ success: false, message: 'Username already taken' });

    // Cooldown: one change per 30 days once an initial username exists
    const [[me]] = await db.query('SELECT username, username_changed_at FROM promo_players WHERE id = ?', [req.player.id]);
    if (me?.username && me?.username_changed_at) {
      const days = (Date.now() - new Date(me.username_changed_at).getTime()) / 86400000;
      if (days < 30) {
        return res.status(429).json({ success: false, message: `You can change your username again in ${Math.ceil(30 - days)} day(s)` });
      }
    }

    await db.query(
      'UPDATE promo_players SET username = ?, username_changed_at = NOW(), profile_complete = 1 WHERE id = ?',
      [username, req.player.id]
    );
    res.json({ success: true, message: 'Username updated', username });
  } catch (err) {
    sendError(res, err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pauth/me
// Returns current player profile + pc_balance
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', playerAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, username, dob, email, whatsapp, city, pincode, pc_balance, avatar_id, profile_complete, created_at,
              TIMESTAMPDIFF(YEAR, dob, CURDATE()) as age
       FROM promo_players WHERE id = ?`,
      [req.player.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Player not found' });
    res.json({ success: true, player: rows[0] });
  } catch (err) {
    sendError(res, err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/pauth/me
// Update player profile fields (e.g. avatar_id)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/me', playerAuth, async (req, res) => {
  try {
    const fields = [];
    const values = [];
    if (req.body.name !== undefined) {
      const nm = String(req.body.name).trim().slice(0, 60);
      if (nm) {
        fields.push('name = ?');
        values.push(nm);
      }
    }
    if (req.body.avatar_id !== undefined) {
      fields.push('avatar_id = ?');
      values.push(req.body.avatar_id);
    }
    if (req.body.username !== undefined) {
      const username = String(req.body.username).trim().toLowerCase();
      if (username.length >= 3 && /^[a-z0-9_]+$/.test(username)) {
        // Check uniqueness
        const [[dup]] = await db.query('SELECT id FROM promo_players WHERE username = ? AND id != ?', [username, req.player.id]);
        if (!dup) {
          fields.push('username = ?');
          values.push(username);
        } else {
          return res.status(409).json({ success: false, message: 'Username already taken' });
        }
      } else if (username.length > 0) {
        return res.status(400).json({ success: false, message: 'Invalid username format' });
      }
    }
    if (fields.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
    values.push(req.player.id);
    await db.query(`UPDATE promo_players SET ${fields.join(', ')} WHERE id = ?`, values);
    // Profile counts as complete once both name and username are set
    await db.query(
      'UPDATE promo_players SET profile_complete = 1 WHERE id = ? AND name IS NOT NULL AND username IS NOT NULL',
      [req.player.id]
    );
    const [rows] = await db.query(
      `SELECT id, name, username, dob, email, whatsapp, city, pincode, pc_balance, avatar_id, profile_complete, created_at,
              TIMESTAMPDIFF(YEAR, dob, CURDATE()) as age
       FROM promo_players WHERE id = ?`,
      [req.player.id]
    );
    res.json({ success: true, player: rows[0] });
  } catch (err) {
    sendError(res, err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pauth/transactions
// Returns PC transaction history for logged-in player
// ─────────────────────────────────────────────────────────────────────────────
router.get('/transactions', playerAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, g.name as game_name
       FROM pc_transactions t
       LEFT JOIN games g ON t.game_id = g.id
       WHERE t.player_id = ?
       ORDER BY t.created_at DESC
       LIMIT 50`,
      [req.player.id]
    );
    res.json({ success: true, transactions: rows });
  } catch (err) {
    sendError(res, err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pauth/rewards
// Returns available brand rewards for the mobile app
// ─────────────────────────────────────────────────────────────────────────────
router.get('/rewards', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, c.name as brand, c.bg_color, c.text_color
       FROM brand_rewards r
       JOIN clients c ON r.client_id = c.id
       WHERE r.is_active = 1 AND (r.stock = -1 OR r.stock > 0)
       ORDER BY r.pp_cost ASC`
    );
    res.json({ success: true, rewards: rows });
  } catch (err) {
    sendError(res, err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pauth/leaderboard
// Returns top promo players by PC balance
// ─────────────────────────────────────────────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, username, pc_balance, avatar_id
       FROM promo_players
       ORDER BY pc_balance DESC
       LIMIT 50`
    );
    res.json({ success: true, leaderboard: rows });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
module.exports.playerAuth = playerAuth; // export middleware for use in other routes