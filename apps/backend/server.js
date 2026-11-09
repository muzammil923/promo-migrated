const express = require("express");
const http = require("http");
const cors = require("cors");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
require("./config/env"); // Validates all required env vars — exits if missing

const app = express();

// ── Layer 1+2: CORS lockdown + security headers ─────────────────────────────
// The frontend calls the API same-origin (baseURL '/api'), so we only allow
// known origins. Set ALLOWED_ORIGINS (comma-separated) in .env for production.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map(s => s.trim()).filter(Boolean);
const corsOptions = {
  origin: (origin, cb) => {
    // allow same-origin requests (origin undefined) and listed origins
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error("CORS origin not allowed"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Security headers (defense-in-depth; a reverse proxy should also set these)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN"); // DENY would break our own GameModal iframe
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "no-referrer");
  // Ignored over plain HTTP, picked up automatically once HTTPS terminates here
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'"
  );
  next();
});

// ── Minimal in-memory rate limiter (no extra dependency) ────────────────────
function rateLimit({ windowMs = 60000, max = 100 } = {}) {
  const hits = new Map();
  setInterval(() => hits.clear(), windowMs).unref();
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const count = (hits.get(key) || 0) + 1;
    hits.set(key, count);
    if (count > max) {
      return res.status(429).json({ success: false, message: "Too many requests, slow down." });
    }
    next();
  };
}
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }); // 10/15min per IP

// gzip/brotli compression for all responses — cuts transfer size for JS/CSS/JSON
app.use(compression());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Optimized WebP serve-through for uploaded images ─────────────────────────
// config/upload.js generates a compressed .webp sibling for every png/jpg
// upload. When one exists, serve it transparently for the original URL —
// zero DB/frontend changes, big transfer savings.
const UPLOADS_DIR = path.join(__dirname, "uploads");
app.use("/uploads", (req, res, next) => {
  if (req.method === "GET" && /\.(png|jpe?g)$/i.test(req.path)) {
    try {
      const rel = decodeURIComponent(req.path).replace(/\.(png|jpe?g)$/i, ".webp");
      const webpPath = path.join(UPLOADS_DIR, rel);
      if (fs.existsSync(webpPath)) {
        res.setHeader("Content-Type", "image/webp");
        return res.sendFile(webpPath);
      }
    } catch { /* fall through to static */ }
  }
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  // Uploaded filenames are UUIDs → content is immutable → long cache is safe
  maxAge: "30d",
  immutable: true,
  // Prevent browsers from executing uploaded files; force download/sniff-safe
  setHeaders: (res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", "inline");
  },
}));

const authRoutes = require("./routes/auth");
const pauthRoutes = require("./routes/Pauth");
const gamesRoutes = require("./routes/games");
const templateRoutes = require("./routes/templates");
const soundsRoutes = require("./routes/sounds");
const uploadRoutes = require("./routes/upload");

const playerRoutes = require("./routes/player");
const clientsRoutes = require("./routes/clients");
const spinRoutes = require("../../games/spin/route");
const crosswordRoutes = require("../../games/crossword/route");
const leaderboardRoutes = require("./routes/leaderboard");
const quizRoutes = require("../../games/quiz/route");
const playersAdminRoutes = require("./routes/players-admin");
const memoryRoutes = require("../../games/memory/route");
const jigsawRoutes = require("../../games/jigsaw/route");
const wordsearchRoutes = require("../../games/wordsearch/route");
const pouringRoutes = require("../../games/pouring/route");
const typerRoutes = require("../../games/typer/route");
const screwRoutes = require("../../games/screw/route");
const towerRoutes = require("../../games/tower/route");
const snakeRoutes = require("../../games/snake/route");
const nagarajaRoutes = require("../../games/nagaraja/route");
const catchRoutes = require("../../games/catch/route");
const reactionRoutes = require("../../games/reaction/route");
const mathRoutes = require("../../games/math/route");
const mazeRoutes = require("../../games/classicmaze/route");
const stickMazeRoutes = require("../../games/stickmaze/route");
const game2048Routes = require("../../games/2048/route");
const simonRoutes = require("../../games/simon/route");
const bounceRoutes = require("../../games/bounce/route");
const flappyRoutes = require("../../games/flappy/route");
const canvaRoutes = require("./routes/canva");
const connect4Routes = require("../../games/connect4/route");
const brickImagesRoutes = require("./routes/brickImages");
const bowlingRoutes = require("../../games/bowling/route");
const sudokuRoutes = require("../../games/sudoku/route");
const minesweeperRoutes = require("../../games/minesweeper/route");
const wordscrambleRoutes = require("../../games/wordscramble/route");
const rpsRoutes = require("../../games/rps/route");
const arrowescapeRoutes = require("../../games/arrowescape/route");
const spaceRoutes = require("../../games/space/route");
const bejeweledRoutes = require("../../games/bejeweled/route");
const candyblastRoutes = require("../../games/candyblast/route");
const tetrisRoutes = require("../../games/tetris/route");
const stackRoutes = require("../../games/stack/route");
const whackamoleRoutes = require("../../games/whackamole/route");
const hanoiRoutes = require("../../games/hanoi/route");
const breakoutRoutes = require("../../games/breakout/route");
const bubbleshooterRoutes = require("../../games/bubbleshooter/route");
const carlaunchRoutes = require("../../games/carlaunch/route");
const stressbusterRoutes = require("../../games/stressbuster/route");
const soundifyRoutes = require("../../games/soundify/route");
const tictactoeRoutes = require("../../games/tictactoe/route");
const chessRoutes = require("../../games/chess/route");
const chessRealtime = require("../../games/chess/realtime");
const snakeandladderRoutes = require("../../games/snakeandladder/route");
const ludoRoutes = require("../../games/ludo/route");
const CarromRoutes = require("../../games/carrom/route");
const tictactoemultiRoutes = require("../../games/tictactoemulti/route");
const businessOwnerRoutes = require("./routes/businessOwner");
const spotRegRoutes = require("../../games/spotreg/route");
const businessDevRoutes = require("./routes/businessDev");
const franchiseRoutes = require("./routes/franchise");
const internalTeamRoutes = require("./routes/internalTeam");
const { itAuth } = internalTeamRoutes;
const auth = require("./middleware/auth");
const { requireAdmin } = require("./middleware/auth");
const notificationsRoutes = require("./routes/notifications");
const systemRoutes = require("./routes/system");
const translateRoutes = require("./routes/translate");
const { startCompanion, stopCompanion } = require("./libretranslateCompanion");

app.use("/api/auth", authRoutes);
app.use("/api/pauth", pauthRoutes);
app.use("/api/games", requireAdmin, gamesRoutes);
app.use("/api/templates", requireAdmin, templateRoutes);
app.use("/api/sounds", requireAdmin, soundsRoutes);
app.use("/api/upload", requireAdmin, uploadRoutes);

app.use("/api/play", playerRoutes);
app.use("/api/clients", requireAdmin, clientsRoutes);
app.use("/api/spin", requireAdmin, spinRoutes);
app.use("/api/crossword", requireAdmin, crosswordRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/players-admin", requireAdmin, playersAdminRoutes);
app.use("/api/memory", requireAdmin, memoryRoutes);
app.use("/api/jigsaw", requireAdmin, jigsawRoutes);
app.use("/api/wordsearch", requireAdmin, wordsearchRoutes);
app.use("/api/pouring", requireAdmin, pouringRoutes);
app.use("/api/typer", requireAdmin, typerRoutes);
app.use("/api/screw", requireAdmin, screwRoutes);
app.use("/api/tower", requireAdmin, towerRoutes);
app.use("/api/snake", requireAdmin, snakeRoutes);
app.use("/api/nagaraja", requireAdmin, nagarajaRoutes);
app.use("/api/catch", requireAdmin, catchRoutes);
app.use("/api/reaction", requireAdmin, reactionRoutes);
app.use("/api/math", requireAdmin, mathRoutes);
app.use("/api/classicmaze", mazeRoutes); // No requireAdmin — /generate & /progress must be accessible to players; routes carry their own auth middleware
app.use("/api/stickmaze", stickMazeRoutes); // No requireAdmin — same player-facing routes
app.use("/api/2048", game2048Routes);
app.use("/api/simon", requireAdmin, simonRoutes);
app.use("/api/bounce", requireAdmin, bounceRoutes);
app.use("/api/flappy", requireAdmin, flappyRoutes);
app.use("/api/canva", requireAdmin, canvaRoutes);
app.use("/api/connect4", connect4Routes);
app.use("/api/brick-images", requireAdmin, brickImagesRoutes);
app.use("/api/bowling", requireAdmin, bowlingRoutes);
app.use("/api/sudoku", requireAdmin, sudokuRoutes);
app.use("/api/minesweeper", requireAdmin, minesweeperRoutes);
app.use("/api/wordscramble", requireAdmin, wordscrambleRoutes);
app.use("/api/rps", requireAdmin, rpsRoutes);
app.use("/api/arrowescape", requireAdmin, arrowescapeRoutes);
app.use("/api/space", spaceRoutes); // No requireAdmin — GET by-slug must be accessible to players; all admin CRUD routes carry their own auth middleware
app.use("/api/bejeweled", requireAdmin, bejeweledRoutes);
app.use("/api/candyblast", requireAdmin, candyblastRoutes);
app.use("/api/tetris", requireAdmin, tetrisRoutes);
app.use("/api/stack", requireAdmin, stackRoutes);
app.use("/api/whackamole", requireAdmin, whackamoleRoutes);
app.use("/api/hanoi", requireAdmin, hanoiRoutes);
app.use("/api/breakout", requireAdmin, breakoutRoutes);
app.use("/api/bubbleshooter", requireAdmin, bubbleshooterRoutes);
app.use("/api/carlaunch", requireAdmin, carlaunchRoutes);
app.use("/api/stressbuster", requireAdmin, stressbusterRoutes);
app.use("/api/soundify", requireAdmin, soundifyRoutes);
app.use("/api/tictactoe", requireAdmin, tictactoeRoutes);
app.use("/api/chess", chessRoutes); // No requireAdmin — GET settings must be accessible to players; PUT/POST routes use their own auth middleware
app.use("/api/snakeandladder", requireAdmin, snakeandladderRoutes);
app.use("/api/ludo", requireAdmin, ludoRoutes);
app.use("/api/Carrom", requireAdmin, CarromRoutes);
app.use("/api/tictactoemulti", requireAdmin, tictactoemultiRoutes);
app.use("/api/bd", businessDevRoutes);
app.use("/api/business", businessOwnerRoutes);
app.use("/api/franchise", franchiseRoutes);
app.use("/api/internal-team", internalTeamRoutes);
app.use("/api/notifications", auth, notificationsRoutes);
app.use("/api/internal-team/notifications", itAuth, notificationsRoutes);
app.use("/api/system", requireAdmin, systemRoutes);
app.use("/api/translate", auth, translateRoutes);
app.use(["/api/spotreg", "/api/spotregistration"], spotRegRoutes);

const { startPCResetCron } = require('./cron/pcReset');
startPCResetCron();

app.get("/api/check-code", (req, res) => {
  res.json({ 
    success: true, 
    message: "LATEST_VERSION_V5_BACKEND", 
    timestamp: new Date()
  });
});

app.get("/", (req, res) => {
  // Serve the SPA landing page when the frontend is built; plain text otherwise.
  if (fs.existsSync(INDEX_HTML_PATH)) {
    return res.sendFile(INDEX_HTML_PATH);
  }
  res.send("Backend Running");
});

// ── Social Sharing: Serve frontend HTML with dynamic OG tags ──────────────────
const SOCIAL_BOTS = /facebookexternalhit|twitterbot|whatsapp|slackbot|linkedinbot|pinterest|telegrambot|skypeuribot|naverbot|yandexbot|baiduspider/i;

const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
const INDEX_HTML_PATH = path.join(FRONTEND_DIST, 'index.html');

const OG_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>__TITLE__</title>
    <meta property="og:title" content="__TITLE__" />
    <meta name="description" content="__DESCRIPTION__" />
    <meta property="og:description" content="__DESCRIPTION__" />
    <meta property="og:image" content="__IMAGE__" />
    <meta property="og:url" content="__URL__" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="__TITLE__" />
    <meta name="twitter:description" content="__DESCRIPTION__" />
    <meta name="twitter:image" content="__IMAGE__" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;

// Serve static frontend assets in production.
// Hashed build assets are immutable → long cache; index.html stays fresh so
// new deployments are picked up immediately (PageSpeed: efficient cache policy).
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST, {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }));
}

// Serve frontend HTML with OG tags for social media crawlers.
// Covers BOTH URL forms: /play/:gameSlug and /play/:gameSlug/:clientSlug.
// Social crawlers (WhatsApp/Meta/Twitter) don't run JS, so they must get tags
// from the raw server HTML — not from React's client-side <head> mutations.
const serveOGTags = async (req, res, gameSlug, clientSlug) => {
  const ua = req.headers['user-agent'] || '';
  if (!SOCIAL_BOTS.test(ua)) return false;

  try {
    const db = require('./config/db');
    const baseSelect = `
      SELECT g.name, g.slug, g.description, g.meta_description, g.game_logo_url as g_logo,
             COALESCE(qs.game_logo_url, g.game_logo_url) as game_logo_url,
             qs.bg_image_url,
             c.company_name, c.slug as client_slug
      FROM games g JOIN clients c ON g.client_id = c.id
      LEFT JOIN quiz_settings qs ON qs.game_id = g.id
    `;
    const [rows] = clientSlug
      ? await db.query(`${baseSelect} WHERE g.slug = ? AND c.slug = ?`, [gameSlug, clientSlug])
      : await db.query(`${baseSelect} WHERE g.slug = ? ORDER BY qs.id DESC LIMIT 1`, [gameSlug]);

    const game = rows && rows.length ? rows[0] : null;
    if (game) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const gameUrl = `${baseUrl}/play/${game.slug}/${game.client_slug}`;
      const title = game.name || 'Play this game';
      const description = game.meta_description || game.description || `Play ${game.name} and win exciting rewards!`;
      const image = game.game_logo_url
        ? (game.game_logo_url.startsWith('http') ? game.game_logo_url : `${baseUrl}${game.game_logo_url}`)
        : `${baseUrl}/favicon.png`;

      let html = OG_TEMPLATE
        .replace(/__TITLE__/g, title)
        .replace(/__DESCRIPTION__/g, description)
        .replace(/__IMAGE__/g, image)
        .replace(/__URL__/g, gameUrl);

      res.type('html').send(html);
      return true;
    }
  } catch (err) {
    console.error('OG tag error:', err.message);
  }
  return false;
};

app.get('/play/:gameSlug/:clientSlug', async (req, res) => {
  if (await serveOGTags(req, res, req.params.gameSlug, req.params.clientSlug)) return;

  // For regular users, serve the SPA index.html (React Router handles routing)
  if (fs.existsSync(INDEX_HTML_PATH)) {
    return res.sendFile(INDEX_HTML_PATH);
  }
  res.status(404).send('Frontend not built. Run npm run build first.');
});

// Single-segment play URL (no client slug) — must also serve OG tags.
app.get('/play/:gameSlug', async (req, res) => {
  if (await serveOGTags(req, res, req.params.gameSlug, null)) return;

  if (fs.existsSync(INDEX_HTML_PATH)) {
    return res.sendFile(INDEX_HTML_PATH);
  }
  res.status(404).send('Frontend not built. Run npm run build first.');
});

// Catch-all: serve frontend for any non-API route (SPA fallback)
app.get('/{*splat}', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  if (fs.existsSync(INDEX_HTML_PATH)) {
    return res.sendFile(INDEX_HTML_PATH);
  }
  res.send('Backend Running');
});

// ── Global error handler (Layer 5): never leak stack traces / internal errors ──
app.use((err, req, res, next) => {
  if (err && err.message === 'CORS origin not allowed') {
    return res.status(403).json({ success: false, message: 'Origin not allowed' });
  }
  console.error('Unhandled error:', err && err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 8080;

// HTTP server wrapping the Express app so WebSocket upgrades (chess online
// mode at /ws/chess) share the same port as the REST API.
const server = http.createServer(app);
chessRealtime.attach(server);

// Run DB migrations on startup (idempotent — safe to run every time)
const initDB = require('./config/initDB');
initDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      // Auto-start the translation companion (LibreTranslate) so it comes up
      // with the backend — no manual step on restart.
      startCompanion();
    });

    const shutdown = () => {
      stopCompanion();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch(err => {
    console.error('❌ DB init failed:', err.message);
    process.exit(1);
  });
