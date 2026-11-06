// ── Central PromoCoins frontend bridge ───────────────────────────────────────
// Mirrors the backend reward contract (apps/backend/lib/promocoins.js) for the
// web shell. The backend is authoritative: every value below is *read* from API
// responses, never computed client-side. The game header wallet is the single
// source of truth shown to the player; individual games only emit a
// "completed" signal and let this bridge surface the backend-confirmed reward.

export const PROMOCOINS_REWARDS = { promogames: 10, branded: 50 }

// Same-document event name (axios interceptor + captured fetch both dispatch it)
export const PROMOCOIN_REWARD_EVENT = 'pg:promocoins:reward'
// Cross-frame handshake between the /play/<slug>/<client> iframe and the shell
export const PROMOCOIN_REWARD_MESSAGE = 'pg:promocoins:reward'
export const PROMOCOIN_AUTH_MESSAGE = 'pg:auth'

export function formatCoins(n) {
  const v = Number.isFinite(Number(n)) ? Number(n) : 0
  return v.toLocaleString()
}

// Elevate a backend-confirmed reward to the shell.
// - game iframe → postMessage → GameModal/ArcadePage provider (parent window)
// - same document (dev / standalone snapshot) → CustomEvent on the current window
// The payload is echoed straight from the server (pc_reward block in the
// /api/play/session/complete response) — only forwarded when rewarded === true.
//
// ⚠️ This is the SINGLE emit point. Producers (axios interceptor, fetch
// wrapper) call it directly — nothing may listen for PROMOCOIN_REWARD_EVENT
// and re-emit it, or the event re-dispatch below would loop forever.
export function postPromoCoinReward(payload) {
  if (!payload || payload.rewarded !== true) return
  window.dispatchEvent(new CustomEvent(PROMOCOIN_REWARD_EVENT, { detail: payload }))
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: PROMOCOIN_REWARD_MESSAGE, ...payload }, '*')
    }
  } catch {
    /* cross-origin parent should never happen (same-origin iframe) */
  }
}

// ── Capture layer ────────────────────────────────────────────────────────────
// Mounted inside the game page (PlayerPage) once. Its only job is to wrap
// global fetch so games that report completion with plain fetch()
// (crossword, snake, …) also surface their pc_reward. Axios-based games are
// covered by the api.js response interceptor, which calls postPromoCoinReward
// directly. Nothing here re-emits PROMOCOIN_REWARD_EVENT — that would loop.
export function attachPromoCoinCapture() {
  if (!window.__promoCoinFetchWrapped) {
    window.__promoCoinFetchWrapped = true
    const originalFetch = window.fetch.bind(window)
    window.fetch = async (...args) => {
      const res = await originalFetch(...args)
      try {
        const req = args[0]
        const url = typeof req === 'string' ? req : (req && req.url) || ''
        if (typeof url === 'string' && url.includes('/api/play/session/complete')) {
          res.clone().json().then((data) => {
            if (data && data.success && data.pc_reward) {
              postPromoCoinReward(data.pc_reward)
            }
          }).catch(() => {})
        }
      } catch {
        /* non-JSON or body-read errors must never break the game */
      }
      return res
    }
  }

  return () => {} // no listeners to clean up; kept for the useEffect contract
}