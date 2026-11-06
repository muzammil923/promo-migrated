# PromoGames — Architecture & Project Structure

## Overview

PromoGames is a gamified marketing platform (quiz, crossword, spin wheel, and 30+ mini-games) built as an **npm workspaces monorepo**.

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Backend     | Node.js, Express, **MySQL** (mysql2) |
| Frontend    | React, Vite, TypeScript, Tailwind CSS |
| Mobile      | Flutter (Dart)                      |
| Monorepo    | npm workspaces                      |
| Auth        | JWT + bcrypt                        |
| Email       | Nodemailer (SMTP)                   |

## Directory Structure

```
promogames/
├── games/                    # === GAME MODULES (one folder per game) ===
│   ├── snake/                # Snake game module (fully migrated)
│   │   ├── meta.json         # Game metadata for auto-discovery
│   │   ├── schema.js         # DB settings table definition
│   │   ├── route.js          # Backend API (GET/PUT settings)
│   │   ├── builderpage.jsx   # Admin config page
│   │   ├── playerpage.jsx    # Player game page (React)
│   │   ├── logic.dart        # Flutter game implementation
│   │   └── assets/           # Shared assets (React + Flutter)
│   ├── quiz/                 # Quiz game module
│   ├── crossword/            # Crossword game module
│   └── ... (37 games total)
│
├── apps/
│   ├── backend/              # Express API server (MySQL)
│   │   ├── server.js         # Entry point — auto-loads game routes
│   │   ├── config/
│   │   │   ├── db.js         # MySQL connection pool (mysql2)
│   │   │   ├── env.js        # Env var validation
│   │   │   ├── initDB.js     # Schema + migrations
│   │   │   └── upload.js     # Multer config
│   │   ├── routes/           # Non-game routes (auth, player, clients, etc.)
│   │   ├── middleware/       # auth, requireAdmin
│   │   ├── lib/              # apiError, geocode
│   │   ├── cron/             # pcReset cron job
│   │   └── uploads/          # Uploaded files
│   │
│   └── frontend/             # React SPA (Vite + TypeScript + Tailwind)
│       └── src/
│           ├── App.jsx       # Routes — uses @games alias for game modules
│           ├── api.js        # Axios client
│           ├── components/   # Shared UI components
│           ├── pages/        # Non-game pages only
│           └── hooks/        # Custom React hooks
│
├── mobile/                   # Flutter app
│   └── lib/
│       ├── games/            # Flutter game implementations
│       │   ├── registry.dart # Game registry — auto-discovers via imports
│       │   └── ...
│       ├── features/         # Player dashboard, auth, rewards
│       ├── models/           # Data models
│       ├── pages/            # Non-game pages
│       └── services/         # API services
│
├── packages/                 # Shared packages
│   ├── api-client/           # Shared axios-based API client
│   └── ui/                   # Shared React component library
│
├── features/                 # Feature modules (legacy — being migrated)
├── load-test.js
├── quick-load-test.js
└── package.json              # Root — workspaces: apps/*, packages/*, features/*
```

## Game Module Architecture (New)

### Overview
Each game is a **self-contained folder** in `games/` with all files needed for that game:
- Backend route (API)
- Frontend builder page (admin config)
- Frontend player page (player experience)
- Flutter game implementation
- Shared assets (images, sounds, animations)
- Metadata and schema definitions

### Game Folder Structure
```
games/<game-name>/
├── meta.json              # Game metadata (name, category, features)
├── schema.js              # DB settings table definition
├── route.js               # Backend API (GET/PUT settings)
├── builderpage.jsx        # Admin config page (React)
├── playerpage.jsx         # Player game page (React web)
├── datapage.jsx           # Admin analytics view (optional)
├── databopage.jsx         # Brand owner analytics view (optional)
├── bologspage.jsx         # Brand owner logs view (optional)
├── redemptionlogspage.jsx # Redemption logs view (optional)
├── logic.dart             # Flutter PURE ENGINE (rules/state/fx — no UI)
├── playerpage.dart        # Flutter PLAYER SCREEN (UI, haptics, theming)
└── assets/                # Shared assets (React + Flutter)
    ├── icon.svg
    ├── sounds/
    └── animations/
```

#### One folder = full stack (one-engineer rule)
Everything a single game needs lives in its folder: backend route, admin
builder, React web player, Flutter engine + native player. An engineer owns a
game without leaving `games/<name>/`.

The only shared dependency is the engine contract package
`games/shared_pkg` (`package:promogames_engine/engine.dart`) — one file,
`lib/engine.dart`, holding `GameConfig`, `GameBuilder`, `GameFinished`,
`GameFx` and the `GameEngine` base class. Mobile mounts it as a pubspec
`path:` dependency; game dart files import it by package name. Because that
single file has zero relative imports, it resolves identically no matter how
a game file is reached by tooling.

Flutter-side discovery uses a symlink mirror `mobile/lib/games/gamelinks/`
(real directories, leaf file-symlinks into `games/<game>/`). The registry at
`mobile/lib/games/registry.dart` imports through this mirror; the actual code
always executes from the canonical files inside each game folder. Note:
extracting the repo as a zip drops symlinks — recreate with the one-liner in
the repo README or `games/gamelinks.sh`.

#### Flutter split: logic.dart vs playerpage.dart
- `logic.dart` — headless engine extending `GameEngine` (ChangeNotifier):
  rules, state machine, scoring, timers, level generation. Emits semantic
  `GameFx` events (correct/wrong/match/win/gameOver…). No widgets, no colors,
  no network.
- `playerpage.dart` — UI shell exporting `build<Name>Player(config,
  onFinished)` matching the `GameBuilder` typedef. Parses builder settings
  from `config.settings` (the same DB rows the admin builder writes), renders
  themed screens, maps `GameFx` → haptics/sounds, reports score via
  `onFinished(score, maxScore, completed)`.
- Settings flow: builderpage.jsx → `*_settings` table → `/api/play/game-data/:id`
  → `GameConfig.settings/questions/words/tiles` → both React & Flutter players.

### meta.json
```json
{
  "name": "Snake",
  "category": "snake",
  "description": "Classic snake game",
  "icon": "assets/icon.png",
  "hasBuilder": true,
  "hasPlayer": true,
  "hasDataPage": true,
  "hasDataBOPage": true,
  "settingsTable": "snake_settings"
}
```

### schema.js
```js
module.exports = {
  table: 'snake_settings',
  fields: ['board_width', 'board_height', 'speed', ...],
  uploads: ['bg_image_url', 'game_logo_url', ...],
  defaults: { board_width: 20, speed: 5, ... },
};
```

### How It Works

#### Backend
- `server.js` imports game routes from `games/<game>/route.js`
- Each route handles GET/PUT for its `*_settings` table
- Generic `gameService.js` can handle any game using `schema.js`

#### Frontend
- `App.jsx` uses `@games` alias to lazy-load game modules
- `PlayerPage.jsx` dispatches to the correct game component
- Vite alias: `@games` → `../../games` (configured in `vite.config.js`)

#### Flutter
- `mobile/lib/games/registry.dart` maps each category to `build<Name>Player`
  imported via the `gamelinks` mirror (`../games_links`-style relative path
  into `mobile/lib/games/gamelinks/<game>/playerpage.dart`)
- Each playerpage exports a builder function matching the `GameBuilder` typedef
- Engines (`logic.dart`) extend `GameEngine`; UI shells subscribe and translate `GameFx` to haptics
- Shared contract: `package:promogames_engine/engine.dart` (path dep on `games/shared_pkg`)
- `game_player_page.dart` dispatches by category string

### Adding a New Game
1. Create `games/<game-name>/` folder
2. Add `meta.json`, `schema.js`, `route.js`
3. Copy route.js, builderpage.jsx, playerpage.jsx from a template; write `logic.dart` (engine) + `playerpage.dart` (UI)
4. Update import paths + one registry line in `mobile/lib/games/registry.dart`
5. Game is automatically available in admin panel, web player, and mobile

### Migration Status
- [x] Snake — backend + React + Flutter (engine/UI split)
- [x] Quiz — backend + React + Flutter (engine/UI split)
- [x] Math — backend + React + Flutter (engine/UI split)
- [x] Crossword — backend + React + Flutter (engine/UI split)
- [x] Memory — backend + React + Flutter (engine/UI split)
- [x] Word Search — backend + React + Flutter (engine/UI split)
- [ ] Spin, Jigsaw, Typer, ... (~31 games still in `apps/backend/routes/` + `apps/frontend/src/pages/`)

Note: legacy mobile implementations (`mobile/lib/games/{quiz,memory,crossword,
wordsearch}_game.dart`) remain on disk but are unwired from the registry;
removal is pending a performance review.

## Backend Architecture

### Database
- **MySQL** (not MongoDB) via `mysql2` package
- Connection pool in `config/db.js` with `pool.promise()` for async/await
- Schema/migrations in `config/initDB.js` (runs on every startup, idempotent)
- Raw SQL queries throughout (no ORM)
- Player-engagement schema (from `config/initPromo.js`, run manually):
  - `games.high_score` — all-time high score per game
  - `player_best_scores` — per-player (or per-`device_id` guest) best score, `UNIQUE(player_id, game_id)` + `UNIQUE(device_id, game_id)`, upserted with `GREATEST`
  - `player_sessions.device_id` — guest identity for play tracking & best scores
  - `pc_transactions` index `(player_id, type, created_at)` — powers the monthly leaderboard

### Server (`server.js`)
1. **CORS** — Configurable allowed origins, credentials enabled
2. **Security headers** — nosniff, X-Frame-Options, CSP, etc.
3. **Rate limiting** — In-memory (login: 10 req/15min per IP)
4. **Routes** — ~80 routes mounted under `/api/*`
   - Admin-only routes use `requireAdmin` middleware
   - Player/public routes: `/api/play`, `/api/leaderboard`, `/api/auth`
5. **Static serving** — Serves frontend `dist/` in production
6. **Social sharing** — Dynamic OG tags for social media crawlers
7. **Error handling** — Global handler, no stack trace leaks

### Route Categories
- **Admin**: games, templates, quiz, spin, crossword, clients, upload, sounds, players-admin
- **Public**: auth, play, leaderboard
- **Game routes** (~30+): snake, tetris, 2048, sudoku, chess, ludo, carrom, tictactoe, whackamole, bubble shooter, etc.

### Player Engagement API (`apps/backend/routes/player.js`)
- `POST /api/play/session/start` — accepts `device_id` for guest identity; response includes `game_type` so the frontend can skip registration for promogames
- `POST /api/play/session/complete` — marks the session complete and, when `score > 0`, upserts `player_best_scores` (GREATEST) and updates `games.high_score`
- `GET /api/play/play-page-games` — returns `{ games, featured (branded), promogames }` for the arcade; split by `game_type`
- `GET /api/play/game/:id/score-info` — `{ high_score, player_best }`; `player_best` resolved via `Bearer` token or `?device_id=`, `null` where unused
- `GET /api/play/leaderboard` — monthly rank by PC **earned** this month (`type='earn'`, spends ignored); sequential `ROW_NUMBER` ties (#53, #54); optional `Bearer` adds your own rank; board restarts each month via the existing `pcReset` cron
- `GET /api/play/game/:id/play-count` — lightweight completed-play counter

## Frontend Architecture
- React + Vite + TypeScript + Tailwind CSS
- React Router v6 for routing
- Axios-based API client (shared in `packages/api-client`)
- Shared UI components in `packages/ui`

### Vite Configuration
- **Alias**: `@games` → `../../games` (allows importing game modules from `games/` folder)
- **Proxy**: `/api` → `http://localhost:8080` (backend API)
- **Code splitting**: Route-level lazy loading for all pages
- **Manual chunks**: three.js, GSAP, Leaflet, Recharts, Framer Motion split into separate chunks

### Arcade / Play page (`src/pages/ArcadePage.jsx`)
- **Rows**: Featured (branded games, horizontal scroll track) + PromoGames (masonry)
- **PromoGames masonry**: CSS `columns` grid — 8 columns desktop, 6 tablet, 5 phone; each card gets a fixed column width and an auto height driven by its aspect ratio
- **Random ratios**: each card randomly picks one of `1:1, 3:4, 4:3, 16:9, 9:16` (keys `11, 34, 43, 169, 916`). `pickGameRatio()` probes which icon files actually exist (HEAD + `Content-Type: image/` — required because Vite returns the HTML SPA fallback with HTTP 200 for missing files) and picks randomly **only among available ratios**
- **Icon sources** (checked in order): `public/game-previews/<category>/<category><key>.png`, `game-previews/<category>/<category>_<key>.png`, `public/gameicons/<slug>/<slug>_<key>.png`, then `game_logo_url`/`bg_image_url`, then an emoji placeholder. Add icons as `public/game-previews/snake/snake11.png` etc. (category-key naming, no underscore)
- **Play tracking**: closing or switching games triggers `loadGames()` (in-place state refresh, no page/modal reload) so the visible "N plays" numbers update; `GameModal` also refetches `play-count` immediately on open plus every 10s; the `pg:auth` message listener closes the game + refreshes counts. A persistent `device_id` (localStorage + `crypto.randomUUID`, fallback `d-<ts>-<rand>`) is sent with every `session/start` (both the skip-form `startSession` and the form-submit path in `PlayerPage.jsx`) and passed as `?device_id=` by `GameModal` to `score-info`, so guest per-player best scores persist across plays without forcing login.
- **High scores**: `POST /session/complete` records per-player best (`player_best_scores`, upserted with `GREATEST`) for both logged-in (`promo_player_id`) and guest (`device_id`) players whenever `score > 0`, and always updates `games.high_score`. `GET /game/:id/score-info` resolves `player_best` via Bearer token falling back to `?device_id=`. PC auto-award for already-registered players happens automatically inside `/session/complete` (gated on `promo_player_id && !pc_awarded`), no player intervention.

## Mobile
- Flutter app in `mobile/`
- Communicates with backend via HTTP API

## Environment Variables
See `apps/backend/.env.example` for all required and optional variables.
Required: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, SMTP_*

## Git Workflow / Deployment

- **NO pushes to any remote (origin) unless explicitly instructed.** Do not run
  `git push` (or create/approve PRs) on your own initiative — wait for an
  explicit "push" / "commit & push" instruction from the user.
- Local commits are fine, but the working tree must never be pushed to
  `origin` (including branch creation/rename that syncs remotely, or deleting
  remote branches) without a direct go-ahead.
- When in doubt, leave changes local and ask.
