# PromoGames — Context for AI Assistants

> Read this first. It replaces re-exploring the whole codebase.

## What this is

Gamified marketing SaaS. Businesses create/configure branded mini-games (45+ types: quiz, spin,
snake, chess, tetris, crossword...) to engage customers. Players play games → earn points →
redeem rewards. Three user surfaces: **admin dashboard** (businesses configure games),
**brand-owner portal** (`/bo/*`), **player arcade** (web + Flutter mobile).

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Node + Express 5, MySQL (mysql2, raw SQL), JWT, Nodemailer, Multer+Sharp (WebP) |
| Frontend | React 18 + Vite 5 + TS + Tailwind, lazy-loaded routes, `@games` alias |
| Mobile | Flutter 3.8+, go_router, Provider, sqflite (offline cache) |
| Monorepo | npm workspaces |
| CI/CD | GitHub Actions → SSH deploy to Oracle server (pm2) |

## Directory layout

```
apps/backend/     Express API. Main: server.js. Routes in routes/ (~60 files)
                  config/: db.js (pool), initDB.js (idempotent schema), env.js, upload.js
                  middleware/auth.js (JWT, requireRole)
                  cron/pcReset.js (monthly reset)
apps/frontend/    React SPA. main.jsx → App.jsx (90+ lazy routes). api.js (axios+multi-token).
                  src/pages/ (~151), src/components/ (~40), context/, hooks/, lib/
games/<name>/     VERTICAL SLICE per game. Contains ALL of:
                  meta.json (name/category/features/routes), schema.js (DB table),
                  route.js (API), builderpage.jsx (admin UI), playerpage.jsx (React),
                  logic.dart (headless Flutter engine), playerpage.dart (Flutter UI),
                  datapage.jsx (admin analytics), databopage.jsx (BO analytics),
                  assets/ (images/sounds)
                  EXCEPTION: shared_pkg/lib/engine.dart = base contract (GameConfig,
                  GameEngine extends ChangeNotifier + GameFx events, GameBuilder)
games/shared_pkg  shared Flutter engine contract
mobile/           Flutter app. lib/main.dart, app_router.dart (go_router shells, 5 tabs),
                  lib/games/registry.dart (category→builder map),
                  lib/games/gamelinks/ (SYMLINK mirror → games/*)
                  services/: api, auth, game_data, local_db (sqflite), notification,
                             player_provider, sync_service (offline)
packages/         @promogames/api-client, @promogames/ui
features/         LEGACY modules being migrated into games/. Don't add new code here.
```

## Game module pattern (the core architecture)

Each game is self-contained. Backend `server.js` imports each game's `route.js` → mounted at
`/api/<game>`. Settings go to per-game MySQL table (`<game>_settings`). Flow:

```
Admin builderpage.jsx → writes <game>_settings → /api/play/game-data/:id
    → GameConfig (settings+questions+words+tiles) → React + Flutter players consume same data
```

Flutter engine/UI split: `logic.dart` = headless (ChangeNotifier, emits semantic `GameFx`
events win/wrong/gameOver, zero UI). `playerpage.dart` = UI shell subscribing to state,
translation to haptics/sounds.

Mobile discovers games via `registry.dart` mapping category→builder; code reached through
symlink mirror at `mobile/lib/games/gamelinks/`.

`features/` has legacy duplicates of some games/routes — being migrated. **Prefer `games/`
pattern for anything new; don't touch `features/` unless explicitly asked.**

## Users / routes

- Admin: `/dashboard/*` — game mgmt, clients, templates, CRM
- Brand Owner: `/bo/*` — dashboard, games, redemptions, my-page
- Player: `/play/*`, `/player/*` — arcade, dashboard, rewards, profile, leaderboard
- Backend roles via JWT: admin, player, business-owner, internal-team, franchise

## Key entry points

| Purpose | Path |
|---|---|
| Backend server | `apps/backend/server.js` |
| DB schema init | `apps/backend/config/initDB.js` |
| Auth middleware | `apps/backend/middleware/auth.js` |
| Frontend entry | `apps/frontend/src/main.jsx` |
| Frontend router | `apps/frontend/src/App.jsx` |
| API client | `apps/frontend/src/api.js` |
| Vite config (`@games` alias) | `apps/frontend/vite.config.js` |
| Mobile entry | `mobile/lib/main.dart` |
| Mobile router | `mobile/lib/app_router.dart` |
| Game registry | `mobile/lib/games/registry.dart` |
| Engine contract | `games/shared_pkg/lib/engine.dart` |
| Full arch doc | `ARCHITECTURE.md` (authoritative, 280 lines) |

## Conventions & gotchas

- **No ORM** — raw SQL through `pool.promise()`.
- **No comments in code** unless asked.
- **Games are the vertical-slice pattern** — when adding/editing a game, follow an existing
  migrated one (snake/quiz) as the template.
- **`@games` alias** maps to `../../games` — imports like `import('@games/snake/builderpage.jsx')`.
- **Guest play**: `device_id` UUID in localStorage sent with every session start (no forced registration).
- **WebP optimization**: uploads auto-generate `.webp` siblings; static middleware serves them transparently.
- **Idempotent migrations**: `initDB.js` runs on every backend startup — schema changes there auto-apply.
- Full architecture details, game-migration status, env vars, git workflow: **read `ARCHITECTURE.md`**.

## Git

Monorepo. Deploy via GitHub Actions on push to `main`/`staging`. Do NOT push/commit unless asked.