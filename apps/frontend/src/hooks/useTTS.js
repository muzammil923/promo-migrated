import { useRef, useCallback, useEffect } from 'react'
import api from '../api'

const SUPPORTS_SPEECH = typeof window !== 'undefined' && 'speechSynthesis' in window

// Remove emojis / pictographs / symbols so the voice doesn't read them out loud.
// Covers Emoji, Dingbats, Misc Symbols, Arrows, Variation Selector and Regional Indicators.
// Deliberately keeps normal letters, numbers and punctuation.
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu
function stripEmojis(text) {
  if (!text) return ''
  return text.replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim()
}

// ── Translation cache (in-memory + localStorage so repeats are instant) ──
const memCache = new Map()
const lsKey = (text, lang) => `tts_tr_${lang}__${(text || '').slice(0, 120)}`

async function translateOne(text, lang) {
  if (!text || !lang || lang === 'en') return text
  const key = lsKey(text, lang)
  if (memCache.has(key)) return memCache.get(key)
  try {
    const c = localStorage.getItem(key)
    if (c) { memCache.set(key, c); return c }
  } catch {}
  try {
    const { data } = await api.post('/translate', { text, target: lang })
    const out = (data && data.translated) || text
    memCache.set(key, out)
    try { localStorage.setItem(key, out) } catch {}
    return out
  } catch {
    try {
      const c = localStorage.getItem(key)
      if (c) return c
    } catch {}
    return text // graceful: speak original English
  }
}

function pickVoice(lang) {
  if (!SUPPORTS_SPEECH) return null
  const voices = window.speechSynthesis.getVoices() || []
  if (!voices.length) return null
  const want = (lang || 'en').slice(0, 2).toLowerCase()
  // Prefer an exact lang match, then a prefix match.
  return voices.find(v => v.lang && v.lang.toLowerCase() === lang.toLowerCase())
      || voices.find(v => v.lang && v.lang.toLowerCase().startsWith(want))
      || null
}

function speakOne(text, { lang, rate, pitch, voice }) {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.rate = rate
    u.pitch = pitch
    if (voice) u.voice = voice
    u.onend = () => resolve(true)
    u.onerror = () => resolve(false)
    window.speechSynthesis.speak(u)
  })
}

/*
 * useTTS — translate-then-speak for the quiz player.
 *   speak(texts, { lang, rate, pitch })  — translates each then reads them in order
 *   cancel()                              — stops any ongoing speech
 *   supported                             — boolean
 */
export default function useTTS() {
  const stopRef = useRef(false)
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (SUPPORTS_SPEECH) window.speechSynthesis.cancel()
    }
  }, [])

  const cancel = useCallback(() => {
    stopRef.current = true
    if (SUPPORTS_SPEECH) window.speechSynthesis.cancel()
  }, [])

  const speak = useCallback(async (texts, opts = {}) => {
    if (!SUPPORTS_SPEECH || !mountedRef.current) return
    const lang = opts.lang || 'en'
    const rate = Number.isFinite(opts.rate) ? opts.rate : 1
    const pitch = Number.isFinite(opts.pitch) ? opts.pitch : 1
    stopRef.current = false
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel()

    // Strip emojis up front so they are neither translated nor spoken.
    const cleaned = (Array.isArray(texts) ? texts : [texts]).map(stripEmojis).filter(Boolean)
    if (cleaned.length === 0) return

    const voice = pickVoice(lang)
    let spokenTexts
    let speakLang = lang
    if (!voice && lang !== 'en') {
      // No voice installed for the chosen language — speak the original (English)
      // text with the default voice so the player still hears the content.
      spokenTexts = cleaned
      speakLang = 'en'
    } else {
      spokenTexts = await Promise.all(cleaned.map(t => translateOne(t, lang)))
    }
    const finalTexts = spokenTexts.map(stripEmojis).filter(Boolean)
    if (finalTexts.length === 0) return

    for (const t of finalTexts) {
      if (stopRef.current || !mountedRef.current) break
      await speakOne(t, { lang: speakLang, rate, pitch, voice: voice || null })
      // tiny breathing gap between question and each option
      if (!stopRef.current) await new Promise(r => setTimeout(r, 250))
    }
  }, [])

  return { speak, cancel, supported: SUPPORTS_SPEECH }
}
