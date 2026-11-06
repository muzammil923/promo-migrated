/*
 * Share helpers — build UTM-tagged game URLs and share them.
 *
 * Attribution model (BO requirement): every shared link carries
 *   utm_source=@{username}  → resolves to the referrer's promo_player_id at
 *                             session start; referrer earns 5 PC when that
 *                             player completes a game (existing backend flow)
 *   utm_medium              → whatsapp | copy | native  (how it was shared)
 *   utm_campaign=share      → marks viral traffic
 *   utm_content={game-slug} → which asset was shared
 */

export const SHARE_MEDIUMS = { whatsapp: 'whatsapp', copy: 'copy', native: 'native' }

export function getLoggedInUsername() {
  try {
    const raw = localStorage.getItem('playerUser') || sessionStorage.getItem('playerUser')
    const u = raw ? JSON.parse(raw) : null
    return u?.username || null
  } catch { return null }
}

export function isLoggedInPlayer() {
  return !!(localStorage.getItem('playerToken') || sessionStorage.getItem('playerToken'))
}

export function buildGameShareUrl(game, medium = 'copy', username = getLoggedInUsername()) {
  const origin = window.location.origin
  const base = `${origin}/play/${game.slug}/${game.client_slug}`
  const params = new URLSearchParams()
  if (username) params.set('utm_source', `@${username}`)
  params.set('utm_medium', medium)
  params.set('utm_campaign', 'share')
  if (game.slug) params.set('utm_content', game.slug)
  return `${base}?${params.toString()}`
}

function whatsappText(game) {
  return `🎮 Play "${game.name}" on PromoGames — quick games, real rewards!`
}

export async function shareGame(game, medium) {
  const url = buildGameShareUrl(game, medium)
  if (medium === 'whatsapp') {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${whatsappText(game)} ${url}`)}`, '_blank', 'noopener,noreferrer')
    return true
  }
  if (medium === 'native' && typeof navigator.share === 'function') {
    try { await navigator.share({ title: game.name, text: whatsappText(game), url }); return true } catch { return false }
  }
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}
