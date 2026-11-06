/**
 * Centralized environment variable validation.
 * 
 * IMPORTANT: This file MUST be required BEFORE any other module that reads
 * process.env. server.js already does require('dotenv').config() before this.
 * 
 * If any required variable is missing, the process exits immediately with a
 * clear error message listing exactly what's missing.
 */

const REQUIRED = {
  // ── Database ──────────────────────────────────────────────────────────
  DB_HOST:     'MySQL host (e.g. localhost)',
  DB_PORT:     'MySQL port (e.g. 3306)',
  DB_USER:     'MySQL username',
  DB_PASSWORD: 'MySQL password',
  DB_NAME:     'MySQL database name',

  // ── Auth ──────────────────────────────────────────────────────────────
  JWT_SECRET:  'JWT signing secret — generate with: openssl rand -base64 64',

  // ── SMTP (used by OTP emails, redemption emails) ─────────────────────
  SMTP_HOST:   'SMTP server host (e.g. smtp.gmail.com)',
  SMTP_PORT:   'SMTP server port (e.g. 587)',
  SMTP_SECURE: 'SMTP TLS (true/false)',
  SMTP_USER:   'SMTP username / email address',
  SMTP_PASS:   'SMTP password or app-specific password',
};

const OPTIONAL = {
  PORT:                '8080',
  NODE_ENV:            'development',
  ADMIN_EMAIL:         'admin@yourdomain.com',
  ADMIN_PASSWORD:      'Admin@123',
  FRONTEND_URL:        'http://localhost:5173',
  ALLOWED_ORIGINS:     '',
};

// ── Validate ────────────────────────────────────────────────────────────
const missing = [];

for (const [key, desc] of Object.entries(REQUIRED)) {
  if (!process.env[key] || process.env[key].trim() === '') {
    missing.push(`  - ${key}: ${desc}`);
  }
}

if (missing.length > 0) {
  console.error('');
  console.error('❌ Missing required environment variables:');
  console.error(missing.join('\n'));
  console.error('');
  console.error('Fix: Add these to apps/backend/.env (see .env.example)');
  console.error('');
  process.exit(1);
}

// ── Set defaults for optional vars ──────────────────────────────────────
for (const [key, fallback] of Object.entries(OPTIONAL)) {
  if (!process.env[key]) process.env[key] = fallback;
}

// ── Export validated values ─────────────────────────────────────────────
module.exports = {
  // Database
  DB_HOST:     process.env.DB_HOST,
  DB_PORT:     parseInt(process.env.DB_PORT, 10),
  DB_USER:     process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME:     process.env.DB_NAME,

  // Auth
  JWT_SECRET:  process.env.JWT_SECRET,

  // SMTP
  SMTP_HOST:   process.env.SMTP_HOST,
  SMTP_PORT:   parseInt(process.env.SMTP_PORT, 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER:   process.env.SMTP_USER,
  SMTP_PASS:   process.env.SMTP_PASS,

  // Optional
  PORT:           parseInt(process.env.PORT, 10) || 8080,
  NODE_ENV:       process.env.NODE_ENV,
  ADMIN_EMAIL:    process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  FRONTEND_URL:   process.env.FRONTEND_URL,
};
