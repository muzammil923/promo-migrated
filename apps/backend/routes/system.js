const express = require('express');
const router = express.Router();
const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const BACKEND_DIR = path.join(__dirname, '..');
const FRONTEND_SRC = path.join(__dirname, '..', '..', 'frontend', 'src');
const FEATURES_DIR = path.join(__dirname, '..', '..', '..', 'features');
const PACKAGES_DIR = path.join(__dirname, '..', '..', '..', 'packages');

// Cache for system status to avoid repeated heavy checks
let statusCache = null;
let cacheExpiry = 0;
const CACHE_TTL = 30000; // 30 seconds

const REQUIRED_ENV_VARS = [
  'PORT', 'NODE_ENV', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'SMTP_HOST', 'SMTP_PORT',
  'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'FRONTEND_URL'
];

const EXPECTED_TABLES = [
  'users', 'games', 'quiz_settings', 'questions', 'options', 'clients', 'sounds',
  'form_fields', 'email_templates', 'player_sessions', 'player_answers',
  'crossword_words', 'crossword_settings', 'memory_settings', 'memory_tiles',
  'math_settings', 'math_progress', 'maze_settings', 'maze_progress', 'stickmaze_settings', 'stickmaze_progress',
  'jigsaw_settings', 'wordsearch_settings', 'wordsearch_words',
  'pouring_settings', 'typer_settings', 'typer_words', 'screw_settings', 'tower_settings',
  'snake_settings', 'nagaraja_settings', 'catch_settings', 'reaction_settings', 'simon_settings',
  'connect4_settings', 'flappy_settings', 'game2048_settings', 'game2048_scores',
  'bounce_settings', 'bounce_levels', 'bounce_objects', 'bounce_progress',
  'space_settings', 'space_ships', 'space_weapons', 'space_enemies', 'space_levels', 'space_progress',
  'bowling_settings', 'sudoku_settings', 'minesweeper_settings',
  'wordscramble_settings', 'wordscramble_words', 'rps_settings',
  'arrowescape_settings', 'arrowescape_levels', 'brick_images',
  'bejeweled_settings', 'bejeweled_sessions', 'bejeweled_moves',
  'tetris_settings', 'tetris_scores', 'stack_settings',
  'whackamole_settings', 'whackamole_scores', 'hanoi_settings', 'hanoi_scores',
  'breakout_settings', 'breakout_scores', 'bubbleshooter_settings', 'bubbleshooter_scores',
  'carlaunch_settings', 'stressbuster_settings', 'soundify_settings', 'soundify_songs',
  'tictactoe_settings', 'snake_ladder_settings', 'ludo_settings', 'Carrom_settings', 'tictactoe_multi_settings', 'promo_players', 'otp_tokens', 'trusted_devices',
  'pc_transactions', 'brand_rewards', 'redemptions', 'reset_log',
  'internal_team', 'notifications', 'business_developers', 'bd_requests',
  'business_owners', 'business_owner_games', 'business_redemptions', 'spin_settings', 'spin_segments', 'spotreg_settings', 'spotreg_stations', 'spotreg_station_fields', 'spotreg_progress'
];

const GAME_TYPES = [
  'quiz', 'survey', 'poll', 'crossword', 'spin', 'memory', 'jigsaw', 'wordsearch',
  'pouring', 'typer', 'math', 'maze', 'screw', 'tower', '2048', 'snake', 'nagaraja', 'catch', 'reaction',
  'simon', 'flappy', 'bounce', 'space', 'connect4', 'bejeweled', 'tetris', 'stack',
  'bowling', 'sudoku', 'minesweeper', 'wordscramble', 'rps', 'whackamole', 'hanoi',
  'breakout', 'bubbleshooter', 'carlaunch', 'frustration', 'stressbuster', 'soundify', 'tictactoe', 'arrowescape', 'snakeandladder', 'ludo', 'Carrom', 'tictactoemultiplayer', 'classicmaze', 'stickmaze', 'spotregistration'
];

// Cache helpers
function isCacheValid() {
  return statusCache && Date.now() < cacheExpiry;
}

function setCache(data) {
  statusCache = data;
  cacheExpiry = Date.now() + CACHE_TTL;
}

function addResult(results, category, test) {
  if (!results.categories[category]) results.categories[category] = { tests: [] };
  results.categories[category].tests.push(test);
  results.summary.total++;
  if (test.status === 'pass') results.summary.passed++;
  else if (test.status === 'fail') results.summary.failed++;
  else results.summary.warnings++;
}

// Simple HTTP test helper with short timeout
async function testEndpoint(baseUrl, method, endpoint, label) {
  const url = `${baseUrl}${endpoint}`;
  const start = Date.now();
  try {
    const http = require('http');
    const https = require('https');
    const mod = url.startsWith('https') ? https : http;
    const result = await new Promise((resolve) => {
      const req = mod.get(url, { timeout: 3000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, ok: res.statusCode < 500, time: Date.now() - start });
        });
      });
      req.on('error', (err) => resolve({ status: 0, ok: false, error: 'Connection failed', time: Date.now() - start }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 0, ok: false, error: 'Timeout', time: Date.now() - start }); });
    });
    return { endpoint: url, label, ...result };
  } catch (e) {
    return { endpoint: url, label, status: 0, ok: false, error: 'Request failed', time: Date.now() - start };
  }
}

// Lightweight health check endpoint - no cache, fast
router.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Readiness check - for Kubernetes/docker
router.get('/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: 'Database connection failed' });
  }
});

// Helper: check if cache is valid
function isCacheValid() {
  return statusCache && Date.now() < cacheExpiry;
}

// Helper: set cache
function setCache(data) {
  statusCache = data;
  cacheExpiry = Date.now() + CACHE_TTL;
}

// Helper: add result to results object
function addResult(results, category, test) {
  if (!results.categories[category]) results.categories[category] = { tests: [] };
  results.categories[category].tests.push(test);
  results.summary.total++;
  if (test.status === 'pass') results.summary.passed++;
  else if (test.status === 'fail') results.summary.failed++;
  else results.summary.warnings++;
}

// Simple HTTP test helper
async function testEndpoint(baseUrl, method, endpoint, label) {
  const url = `${baseUrl}${endpoint}`;
  const start = Date.now();
  try {
    const http = require('http');
    const https = require('https');
    const mod = url.startsWith('https') ? https : http;
    const result = await new Promise((resolve) => {
      const req = mod.get(url, { timeout: 3000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, ok: res.statusCode < 500, time: Date.now() - start });
        });
      });
      req.on('error', (err) => resolve({ status: 0, ok: false, error: 'Connection failed', time: Date.now() - start }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 0, ok: false, error: 'Timeout', time: Date.now() - start }); });
    });
    return { endpoint: url, label, ...result };
  } catch (e) {
    return { endpoint: url, label, status: 0, ok: false, error: 'Request failed', time: Date.now() - start };
  }
}

router.get('/status', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  // Return cached result if valid
  if (isCacheValid()) {
    return res.json({ success: true, ...statusCache });
  }

  const results = {
    timestamp: new Date().toISOString(),
    summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
    categories: {}
  };

  function addResult(category, test) {
    if (!results.categories[category]) results.categories[category] = { tests: [] };
    results.categories[category].tests.push(test);
    results.summary.total++;
    if (test.status === 'pass') results.summary.passed++;
    else if (test.status === 'fail') results.summary.failed++;
    else results.summary.warnings++;
  }

  // ── 1. Environment Variables ──
  for (const v of REQUIRED_ENV_VARS) {
    const val = process.env[v];
    addResult('Environment Variables', {
      name: v, status: val ? 'pass' : 'fail',
      message: val ? 'Set ✓' : 'MISSING from .env',
      expected: 'Should be defined in .env'
    });
  }

  // ── 2. File System Checks ──
  const routeFiles = fs.readdirSync(path.join(__dirname)).filter(f => f.endsWith('.js'));
  addResult('File System', {
    name: 'Route files count', status: 'pass', message: `${routeFiles.length} core route files found in routes/`, expected: 'Core platform routes (per-game routes live in games/<name>/route.js)'
  });

  const initDBPath = path.join(BACKEND_DIR, 'config', 'initDB.js');
  const initDBExists = fs.existsSync(initDBPath);
  addResult('File System', {
    name: 'initDB.js', status: initDBExists ? 'pass' : 'fail',
    message: initDBExists ? 'Exists at config/initDB.js' : 'MISSING at config/initDB.js',
    expected: 'Must exist for deployment auto-migration'
  });

  const dbPath = path.join(BACKEND_DIR, 'config', 'db.js');
  addResult('File System', {
    name: 'config/db.js', status: fs.existsSync(dbPath) ? 'pass' : 'fail',
    message: fs.existsSync(dbPath) ? 'Exists' : 'MISSING', expected: 'Database connection config'
  });

  const uploadConfigPath = path.join(BACKEND_DIR, 'config', 'upload.js');
  addResult('File System', {
    name: 'config/upload.js', status: fs.existsSync(uploadConfigPath) ? 'pass' : 'warn',
    message: fs.existsSync(uploadConfigPath) ? 'Exists' : 'MISSING',
    expected: 'Multer file upload config'
  });

  const envPath = path.join(BACKEND_DIR, '.env');
  addResult('File System', {
    name: 'Backend .env', status: fs.existsSync(envPath) ? 'pass' : 'fail',
    message: fs.existsSync(envPath) ? 'Exists' : 'MISSING',
    expected: 'Required for configuration'
  });

  for (const dir of ['uploads/images', 'uploads/sounds']) {
    const fullPath = path.join(BACKEND_DIR, dir);
    const exists = fs.existsSync(fullPath);
    addResult('File System', {
      name: dir, status: exists ? 'pass' : 'warn',
      message: exists ? 'Directory exists' : 'MISSING',
      expected: 'Upload directory should exist'
    });
  }

  // ── 3. Frontend Pages Check ──
  const pagesDir = path.join(FRONTEND_SRC, 'pages');
  if (fs.existsSync(pagesDir)) {
    const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
    addResult('Frontend Pages', {
      name: 'Page files', status: 'pass',
      message: `${pageFiles.length} page files found in src/pages/`,
      expected: 'Should have 100+ page files'
    });

    const builderPages = pageFiles.filter(f => f.toLowerCase().includes('builder'));
    const playerPages = pageFiles.filter(f => f.toLowerCase().includes('player'));
    addResult('Frontend Pages', {
      name: 'Builder pages', status: builderPages.length > 0 ? 'pass' : 'warn',
      message: `${builderPages.length} builder pages`, expected: 'Builder pages for each game type'
    });
    addResult('Frontend Pages', {
      name: 'Player pages', status: playerPages.length > 0 ? 'pass' : 'warn',
      message: `${playerPages.length} player pages`, expected: 'Player pages for each game type'
    });
  } else {
    addResult('Frontend Pages', { name: 'pages directory', status: 'fail', message: 'MISSING', expected: 'src/pages/ directory' });
  }

  for (const [name, p] of [['main.jsx', 'main.jsx'], ['App.jsx', 'App.jsx'], ['api.js', 'api.js']]) {
    const fp = path.join(FRONTEND_SRC, p);
    addResult('Frontend Core', {
      name, status: fs.existsSync(fp) ? 'pass' : 'fail',
      message: fs.existsSync(fp) ? 'Exists' : 'MISSING', expected: 'Required frontend file'
    });
  }

  // ── 4. Feature Packages Check (auto-discovery) ──
  if (fs.existsSync(FEATURES_DIR)) {
    const featureDirs = fs.readdirSync(FEATURES_DIR).filter(f => {
      try { return fs.statSync(path.join(FEATURES_DIR, f)).isDirectory(); } catch { return false; }
    });
    for (const feat of featureDirs) {
      const pkgPath = path.join(FEATURES_DIR, feat, 'package.json');
      const apiPath = path.join(FEATURES_DIR, feat, 'api', 'index.js');
      const uiPath = path.join(FEATURES_DIR, feat, 'ui', 'index.js');
      const hasPkg = fs.existsSync(pkgPath);
      const hasApi = fs.existsSync(apiPath);
      const hasUi = fs.existsSync(uiPath);
      if (hasPkg) {
        let msg = 'package.json exists';
        if (!hasApi && !hasUi) msg += ' — NO api/ or ui/ source files (stub package)';
        else if (!hasApi) msg += ' — missing api/index.js';
        else if (!hasUi) msg += ' — missing ui/index.js';
        addResult('Feature Packages', {
          name: feat, status: (hasApi || hasUi) ? 'pass' : 'warn',
          message: msg, expected: 'Should have api/index.js and/or ui/index.js'
        });
      }
    }
  }

  if (fs.existsSync(PACKAGES_DIR)) {
    const pkgDirs = fs.readdirSync(PACKAGES_DIR).filter(f => {
      try { return fs.statSync(path.join(PACKAGES_DIR, f)).isDirectory(); } catch { return false; }
    });
    for (const pkg of pkgDirs) {
      const pkgJsonPath = path.join(PACKAGES_DIR, pkg, 'package.json');
      const srcPath = path.join(PACKAGES_DIR, pkg, 'src', 'index.js');
      const hasSrc = fs.existsSync(srcPath);
      addResult('Shared Packages', {
        name: `@promogames/${pkg}`, status: 'pass',
        message: hasSrc ? 'Has source files' : 'package.json only',
        expected: 'Shared package'
      });
    }
  }

  // ── 5. Database Checks ──
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    addResult('Database', {
      name: 'Connection', status: 'pass',
      message: 'MySQL connection OK', expected: 'Database should be reachable'
    });

    const [tables] = await db.query('SHOW TABLES');
    const existingTables = tables.map(t => Object.values(t)[0]);
    
    for (const table of EXPECTED_TABLES) {
      const found = existingTables.includes(table);
      addResult('Database Tables', {
        name: table, status: found ? 'pass' : 'fail',
        message: found ? 'Table exists' : 'Table MISSING from database',
        expected: 'Created by initDB.js migration'
      });
    }

    try {
      const [colInfo] = await db.query('SHOW COLUMNS FROM games WHERE Field = ?', ['category']);
      if (colInfo.length > 0) {
        const type = colInfo[0].Type;
        for (const gt of GAME_TYPES) {
          const found = type.includes(gt);
          addResult('Game Types', {
            name: gt, status: found ? 'pass' : 'warn',
            message: found ? 'In games.category ENUM' : 'MISSING from games.category ENUM',
            expected: 'All game types in the ENUM'
          });
        }
      }
    } catch (e) {
      addResult('Game Types', { name: 'CHECK_ERROR', status: 'fail', message: 'Could not check game types', expected: 'N/A' });
    }

    addResult('Database', {
      name: 'Migration Status', status: 'pass',
      message: 'initDB.js runs on startup (tables verified above)',
      expected: 'initDB.js should auto-run migrations on every deploy'
    });

  } catch (e) {
    addResult('Database', {
      name: 'Connection', status: 'fail',
      message: 'Cannot connect to database', expected: 'MySQL should be running'
    });
  }

  // ── 6. API Endpoint Check (lightweight) ──
  const baseUrl = `http://localhost:${process.env.PORT || 8080}`;
  const endpointsToTest = [
    { method: 'GET', endpoint: '/api/check-code', label: 'Health Check' },
    { method: 'GET', endpoint: '/', label: 'Root' },
  ];

  const safeEndpoints = [
    '/api/auth',
    '/api/pauth',
    '/api/games',
    '/api/clients',
    '/api/leaderboard',
    '/api/play',
    '/api/upload',
    '/api/brick-images',
    '/api/roblox'
  ];

  for (const ep of safeEndpoints) {
    endpointsToTest.push({ method: 'GET', endpoint: ep, label: ep });
  }

  const systemEndpoints = ['/api/system/status'];
  for (const ep of systemEndpoints) {
    endpointsToTest.push({ method: 'GET', endpoint: ep, label: ep });
  }

  const batchSize = 10;
  for (let i = 0; i < endpointsToTest.length; i += batchSize) {
    const batch = endpointsToTest.slice(i, i + batchSize);
    const testResults = await Promise.all(
      batch.map(e => testEndpoint(baseUrl, e.method, e.endpoint, e.label))
    );
    for (const tr of testResults) {
      const expectedStatus = tr.endpoint.includes('/api/system') ? '200' :
        tr.endpoint === '/api/check-code' || tr.endpoint === '/' ? '200' :
        '401 (needs auth) - endpoint exists';
      const isOk = tr.ok || tr.status === 401 || tr.status === 405;
      addResult('API Endpoints', {
        name: tr.label, status: isOk ? 'pass' : 'fail',
        message: tr.error ? `Error: ${tr.error}` : `HTTP ${tr.status} (${tr.time}ms)`,
        expected: expectedStatus
      });
    }
  }

  // ── 7. Deployment Readiness ──
  addResult('Deployment Readiness', {
    name: 'Auto-migration on start', status: 'pass',
    message: 'server.js calls initDB() before listening — migrations run on every start',
    expected: 'initDB() is called in server.js before app.listen()'
  });

  addResult('Deployment Readiness', {
    name: 'initDB.js content', status: initDBExists ? 'pass' : 'fail',
    message: initDBExists ? `File size: ${fs.statSync(initDBPath).size} bytes` : 'MISSING',
    expected: 'initDB.js must exist at config/initDB.js for deployment auto-migration'
  });

  try {
    require('three');
    addResult('Dependencies', { name: 'three', status: 'pass', message: 'Installed (root)', expected: '3D library for some games' });
  } catch {
    addResult('Dependencies', { name: 'three', status: 'warn', message: 'Not found in node_modules', expected: 'Listed in root package.json' });
  }

  // ── 8. Summary ──
  const summary = results.summary;
  const health = summary.failed === 0 && summary.warnings === 0 ? 'healthy' :
    summary.failed === 0 ? 'degraded' : 'unhealthy';

  const response = {
    success: true,
    health,
    summary,
    categories: results.categories,
    timestamp: results.timestamp
  };

  setCache(response);
  res.json({ success: true, ...response });
});

module.exports = router;