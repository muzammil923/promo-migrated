const express = require('express');
const { sendError } = require('../lib/apiError');
const router = express.Router();

/*
 * Translate helper — keyless by default.
 *
 * Provider order:
 *   1. LibreTranslate  (self-hosted, no key)  — env LIBRETRANSLATE_URL (default http://localhost:5050)
 *   2. MyMemory        (free public API, no key) — used only if LibreTranslate is unreachable
 *   3. Original text   — if both fail, return the source text untouched (graceful degradation)
 *
 * Source language is English ('en') per project design (all game copy is English).
 * The target language comes from the quiz's `speech_language` setting.
 */

const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5050';
const TRANSLATE_SOURCE = process.env.TRANSLATE_SOURCE || 'en';

// Simple in-memory cache so we don't re-translate the same string repeatedly.
const cache = new Map();
const cacheKey = (text, target) => `${TRANSLATE_SOURCE}|${target}|${text}`;

async function translateLibreTranslate(text, target) {
  const res = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source: TRANSLATE_SOURCE, target, format: 'text' }),
  });
  if (!res.ok) throw new Error(`LibreTranslate ${res.status}`);
  const data = await res.json();
  if (!data || !data.translatedText) throw new Error('LibreTranslate empty');
  return data.translatedText;
}

async function translateMyMemory(text, target) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${TRANSLATE_SOURCE}|${target}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MyMemory ${res.status}`);
  const data = await res.json();
  const out = data && data.responseData && data.responseData.translatedText;
  if (!out) throw new Error('MyMemory empty');
  return out;
}

async function translateText(text, target) {
  if (!text || !target || target === TRANSLATE_SOURCE) return text;
  const key = cacheKey(text, target);
  if (cache.has(key)) return cache.get(key);

  let translated = text;
  try {
    translated = await translateLibreTranslate(text, target);
  } catch (e1) {
    try {
      translated = await translateMyMemory(text, target);
    } catch (e2) {
      // Both failed — keep original text so TTS still works.
      translated = text;
    }
  }
  cache.set(key, translated);
  return translated;
}

router.post('/', async (req, res) => {
  try {
    const { text, target, q, lang } = req.body;
    const src = text || q;
    const tgt = target || lang;
    if (!src) return res.status(400).json({ success: false, message: 'text required' });
    const translated = await translateText(src, tgt || TRANSLATE_SOURCE);
    res.json({ success: true, translated, source: TRANSLATE_SOURCE, target: tgt || TRANSLATE_SOURCE });
  } catch (err) {
    sendError(res, err);
  }
});

// Batch translate (array of strings) — handy for question + options in one call.
router.post('/batch', async (req, res) => {
  try {
    const { texts, target, lang } = req.body;
    const tgt = target || lang;
    if (!Array.isArray(texts)) return res.status(400).json({ success: false, message: 'texts[] required' });
    const translated = await Promise.all(texts.map(t => translateText(t, tgt)));
    res.json({ success: true, translated });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
module.exports.translateText = translateText;
