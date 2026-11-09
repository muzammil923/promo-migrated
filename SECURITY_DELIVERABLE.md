# PromoGames — Answer/Prize/Session Security Hardening — Deliverable

## Scope
Player-facing data exposure (JS bundle / DOM / Network tab / forged API calls) and answer/prize integrity across the ~43 browser mini-games.

## Implemented fixes (this hardening pass)

- Backend: mounted quiz admin router (`/api/quiz`) — fixes `POST /api/quiz/games/:gameId/questions` 404 that broke quiz saving.
- Frontend: fixed runtime crash in `PlayerPage.jsx` — added missing `lazy` React import and React hooks imports (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`, `useContext`, `useReducer`).

| Area | File | Change | Status |
|---|---|---|---|
| Quiz answers | `apps/backend/routes/player.js` | Server-graded `/session/answer` from DB; strips `answer_text`/`correct_option`/`is_correct` from public payloads; one-answer-per-question-per-session; short-answer (incl. numeric) + checkbox multi-select supported | DONE |
| Quiz reveal | `apps/frontend/src/pages/PlayerPage.jsx`, `games/quiz/playerpage.jsx` | Server response drives reveal via `revealedCorrectId`; no client-side correctness | DONE |
| Crossword | `apps/backend/routes/player.js`, `games/crossword/playerpage.jsx` | `word_text` masked in public payload; server-graded `/session/crossword-answer`; new hint endpoint `/session/crossword-hint` (allow_hints-gated); no client grading | DONE |
| Spin | `apps/backend/routes/player.js`, `games/spin/playerpage.jsx` | `/session/spin` server-weighted pick; once/unlimited; server `spin_result` stored/returned; client removed `pickWinner` | DONE |
| Session finality | `apps/backend/routes/player.js` | `/session/complete` idempotent; quiz/crossword scores server-sourced; arcade scores clamped 0..1e9; server spin result wins | DONE |
| Score write | `apps/backend/routes/player.js`, `games/2048/route.js` | `/record-score` + 2048 score POST clamped to 0..1e9 | DONE |
| Chess | `games/chess/route.js` | Move `fen_after` FEN shape validated; `/room/:code/end` result whitelist | DONE |
| Soundify | `apps/frontend/src/pages/PlayerPage.jsx`, `games/soundify/playerpage.jsx` | Client `is_correct` removed; correctness via DB song lookup | DONE |

## Residual risks / not fixed here
- Arcade categories still accept client scores at completion (now clamped — not truly authoritative).
- Crossword grid now uses masked `#` letters; rendering relied on truthiness/length (verified).
- Soundify likely broken/unused: player page expects `gameData.songs`, backend soundify branch returns only settings.
- Mobile (`mobile/`) game pages may still read answers/words (e.g. `word_text`) — needs same treatment later.
- Chess move legality still not fully validated server-side (notation/FEN content), only shape now.
- Business redemption / promo-coin reward flows depend on idempotent service (already centralised).

## Manual test checklist (security)
1. Quiz: answer via UI → server result; Network tab shows no `is_correct`/`answer_text`.
2. Crossword: grid renders masked; letters revealed via hint endpoint only; wrong/full words graded server-side.
3. Spin: single spin per session; unlimited mode allowed; winner/coupon only from server response.
4. Complete: double-complete returns stored result; arcade score clamped; quiz score from server.
5. Fuzz: forged `is_correct: true` posts → ignored.

## Secure-coding rules going forward
- Client never decides correctness; server grades from DB.
- Never send answer keys (`answer_text`, `correct_option`, `is_correct`, spin `coupon_code`/`prize_description`/`weight`) in player payloads.
- Server-authoritative randomness/prizes/scores with idempotency.
- Mask answer-bearing fields with equal-length placeholders for layout, use hint/submit APIs for values.

## Deliverables
- Unified diff: `SECURITY_DELIVERABLE.patch`
- Audit doc: `SECURITY_DELIVERABLE.md`
