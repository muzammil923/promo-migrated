/**
 * BMI from the values a participant entered across the camp stations.
 *
 * Height/weight are located by matching the field label text, so no extra
 * builder configuration is needed. Age and gender come from the registration
 * form, which decides whether the WHO adult bands or the age/sex percentile
 * bands apply.
 */

const HEIGHT_PATTERNS = [
  /height/i, /\bht\b/i, /\bcm\b/, /stature/i,
];
const WEIGHT_PATTERNS = [
  /weight/i, /\bwt\b/i, /\bkgs?\b/i, /mass/i,
];
const AGE_PATTERNS = [
  /^age$/i, /\bage\b/i, /age[\s_]*(in[\s_]*)?years?/i, /years?[\s_]*old/i,
];
const GENDER_PATTERNS = [
  /^gender$/i, /^sex$/i, /\bgender\b/i,
];

const FEMALE_TOKENS = ['female', 'woman', 'girl', 'f', 'fem'];
const MALE_TOKENS = ['male', 'man', 'boy', 'm', 'mas'];

/** Pull a first number out of a value that may be "62.5 kg" or "1.64 m". */
function toNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const match = String(value).match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = parseFloat(match[0]);
  return Number.isFinite(n) ? n : null;
}

/**
 * Normalise to centimetres.
 *
 * The unit is read from the label where possible, because height units are
 * ambiguous from the number alone: 5 could be 5 feet or 5 metres. The label is
 * only a fallback when the value itself carries a unit ("62.5 kg").
 */
/** Feet/inches expressed inside a value, e.g. "5 ft 5 in" or "5'5\"". */
function parseFeetInches(valueText) {
  const feet = valueText.match(/(\d+(?:\.\d+)?)\s*(?:ft\b|feet\b|foot\b|['′])/i);
  const inches = valueText.match(/(\d+(?:\.\d+)?)\s*(?:in\b|inch(?:es)?\b|["″])/i);
  if (!feet && !inches) return null;
  return {
    feet: feet ? parseFloat(feet[1]) : 0,
    inches: inches ? parseFloat(inches[1]) : 0,
  };
}

const IMPERIAL = /\bft\b|\bfeet\b|\bfoot\b|['′]|\bin\b|\binch(?:es)?\b|["″]/i;
const METRIC = /\bcm\b|centimet(?:er|re)s?|\bm\b|met(?:er|re)s?/i;

function toCentimetres(raw, label) {
  const n = toNumber(raw);
  if (n === null) return null;

  const valueText = String(raw);
  const labelText = String(label || '');

  // A unit written into the value is the most reliable signal.
  if (IMPERIAL.test(valueText)) {
    const parts = parseFeetInches(valueText);
    const total = (parts.feet + parts.inches / 12) * 30.48;
    if (total > 0) return total;
  }
  if (/\bm\b|met(?:er|re)s?/i.test(valueText)) return n * 100;
  if (/\bcm\b|centimet(?:er|re)s?/i.test(valueText)) return n;

  // Otherwise the field's own label decides.
  if (IMPERIAL.test(labelText)) {
    const total = (n + 0) * 30.48;
    return total > 0 ? total : null;
  }
  if (METRIC.test(labelText)) {
    if (/\bm\b|met(?:er|re)s?/i.test(labelText)) return n * 100;
    return n;
  }

  // No unit anywhere: fall back to magnitude.
  if (n > 0 && n < 3) return n * 100;            // metres
  if (n >= 100 && n <= 260) return n;             // centimetres
  if (n > 3 && n < 12) return n * 30.48;          // bare feet
  return null;
}

/**
 * Normalise to kilograms. Same rule: the label disambiguates lb vs kg, because
 * 30 is a plausible value in either unit.
 */
function toKilograms(raw, label) {
  const n = toNumber(raw);
  if (n === null) return null;

  const valueText = String(raw);
  const labelText = String(label || '');

  if (/\b(kgs?|kilograms?)\b/i.test(valueText) || /\b(kgs?|kilograms?)\b/i.test(labelText)) return n;
  if (/\b(g|grams?|gms?)\b/i.test(valueText) || /\b(g|grams?|gms?)\b/i.test(labelText)) return n / 1000;
  if (/\b(lbs?|pounds?)\b/i.test(valueText) || /\b(lbs?|pounds?)\b/i.test(labelText)) return n * 0.45359237;

  // No unit anywhere: fall back to magnitude.
  if (n > 1000) return n / 1000;                  // grams
  if (n >= 10 && n <= 400) return n;              // kilograms
  if (n >= 3 && n < 10) return n * 0.45359237;    // bare pounds
  return null;
}

function labelMatches(label, patterns) {
  const text = String(label || '').trim();
  if (!text) return false;
  return patterns.some(p => p.test(text));
}

function parseGender(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return null;
  if (FEMALE_TOKENS.includes(text)) return 'female';
  if (MALE_TOKENS.includes(text)) return 'male';
  if (FEMALE_TOKENS.some(t => text.includes(t))) return 'female';
  if (MALE_TOKENS.some(t => text.includes(t))) return 'male';
  return null;
}

function parseAge(value) {
  const n = toNumber(value);
  return n === null ? null : n;
}

/**
 * Walk the collected entries and pull out the values we need.
 *
 * @param {Array<{station_name:string, icon:string, answers:object}>} stations
 * @param {object} registrationData form_fields answers from the sign-up form
 */
function extractMeasurements(stations, registrationData) {
  let heightCm = null;
  let weightKg = null;
  const source = {};

  for (const station of stations || []) {
    const answers = station.answers || {};
    for (const [label, value] of Object.entries(answers)) {
      if (value === null || value === undefined || String(value).trim() === '') continue;

      if (heightCm === null && labelMatches(label, HEIGHT_PATTERNS)) {
        const cm = toCentimetres(value, label);
        if (cm !== null) { heightCm = cm; source.height = { station: station.station_name, label, value }; }
      } else if (weightKg === null && labelMatches(label, WEIGHT_PATTERNS)) {
        const kg = toKilograms(value, label);
        if (kg !== null) { weightKg = kg; source.weight = { station: station.station_name, label, value }; }
      }
    }
  }

  let age = null;
  let gender = null;
  for (const [label, value] of Object.entries(registrationData || {})) {
    if (value === null || value === undefined || String(value).trim() === '') continue;
    if (age === null && labelMatches(label, AGE_PATTERNS)) age = parseAge(value);
    if (gender === null && labelMatches(label, GENDER_PATTERNS)) gender = parseGender(value);
  }

  return { heightCm, weightKg, age, gender, source };
}

/* ── Adult bands (WHO) ─────────────────────────────────────────────────── */
const ADULT_BANDS = [
  { max: 16.0, category: 'Severely underweight', hex: '#2563eb' },
  { max: 18.5, category: 'Underweight', hex: '#0ea5e9' },
  { max: 25.0, category: 'Normal weight', hex: '#16a34a' },
  { max: 30.0, category: 'Overweight', hex: '#f59e0b' },
  { max: 35.0, category: 'Obese (Class I)', hex: '#f97316' },
  { max: 40.0, category: 'Obese (Class II)', hex: '#ef4444' },
  { max: Infinity, category: 'Obese (Class III)', hex: '#b91c1c' },
];

/* ── WHO child BMI-for-age percentile cut-offs ───────────────────────────
   85th percentile (the WHO "overweight" line) per age in months, and the
   97th ("obesity"). Boys and girls differ from about age 6 onwards, so each
   sex is stored separately. Values are the WHO 2007 reference tables.
   ──────────────────────────────────────────────────────────────────────── */
const BOY_85 = {
  15: 15.4, 18: 15.3, 24: 15.1, 30: 15.0, 36: 14.9, 42: 14.9, 48: 14.8, 54: 14.8,
  60: 14.8, 66: 14.8, 72: 14.8, 78: 14.8, 84: 14.8, 90: 14.9, 96: 15.0, 102: 15.1,
  108: 15.2, 114: 15.3, 120: 15.5, 126: 15.7, 132: 15.9, 138: 16.1, 144: 16.3,
  150: 16.5, 156: 16.7, 162: 17.0, 168: 17.2, 174: 17.5, 180: 17.7, 186: 18.0,
  192: 18.2, 198: 18.5, 204: 18.8, 216: 19.3, 228: 19.9, 240: 20.5, 252: 21.1,
  264: 21.6, 276: 22.1, 288: 22.6, 300: 23.1, 312: 23.5, 324: 23.9, 336: 24.3,
  348: 24.7, 360: 25.1, 372: 25.5, 384: 25.9, 396: 26.4, 408: 26.8, 420: 27.2,
  432: 27.6, 444: 28.0, 456: 28.4, 468: 28.8, 480: 29.2, 492: 29.5, 504: 29.9,
};
const BOY_97 = {
  15: 17.5, 18: 17.7, 24: 17.5, 30: 17.4, 36: 17.4, 42: 17.4, 48: 17.5, 54: 17.6,
  60: 17.7, 66: 17.8, 72: 18.0, 78: 18.1, 84: 18.3, 90: 18.5, 96: 18.7, 102: 19.0,
  108: 19.3, 114: 19.5, 120: 19.8, 126: 20.1, 132: 20.4, 138: 20.7, 144: 21.0,
  150: 21.3, 156: 21.6, 162: 21.9, 168: 22.2, 174: 22.6, 180: 22.9, 186: 23.3,
  192: 23.6, 198: 24.0, 204: 24.3, 216: 25.0, 228: 25.8, 240: 26.6, 252: 27.3,
  264: 28.0, 276: 28.7, 288: 29.3, 300: 29.9, 312: 30.5, 324: 31.1, 336: 31.6,
  348: 32.2, 360: 32.7, 372: 33.2, 384: 33.7, 396: 34.2, 408: 34.7, 420: 35.2,
  432: 35.6, 444: 36.1, 456: 36.5, 468: 37.0, 480: 37.4, 492: 37.8, 504: 38.2,
};
const GIRL_85 = {
  15: 15.3, 18: 15.2, 24: 15.1, 30: 15.0, 36: 14.9, 42: 14.9, 48: 14.8, 54: 14.8,
  60: 14.9, 66: 14.9, 72: 15.0, 78: 15.1, 84: 15.2, 90: 15.3, 96: 15.4, 102: 15.6,
  108: 15.7, 114: 15.9, 120: 16.1, 126: 16.3, 132: 16.5, 138: 16.8, 144: 17.0,
  150: 17.3, 156: 17.5, 162: 17.8, 168: 18.1, 174: 18.4, 180: 18.7, 186: 19.0,
  192: 19.3, 198: 19.6, 204: 19.9, 216: 20.6, 228: 21.2, 240: 21.9, 252: 22.6,
  264: 23.2, 276: 23.9, 288: 24.5, 300: 25.1, 312: 25.7, 324: 26.3, 336: 26.8,
  348: 27.4, 360: 27.9, 372: 28.4, 384: 28.9, 396: 29.4, 408: 29.9, 420: 30.4,
  432: 30.9, 444: 31.4, 456: 31.8, 468: 32.3, 480: 32.7, 492: 33.2, 504: 33.6,
};
const GIRL_97 = {
  15: 17.6, 18: 17.8, 24: 17.6, 30: 17.5, 36: 17.5, 42: 17.5, 48: 17.6, 54: 17.7,
  60: 17.9, 66: 18.0, 72: 18.2, 78: 18.4, 84: 18.6, 90: 18.9, 96: 19.1, 102: 19.4,
  108: 19.7, 114: 20.0, 120: 20.3, 126: 20.6, 132: 20.9, 138: 21.2, 144: 21.5,
  150: 21.8, 156: 22.1, 162: 22.5, 168: 22.8, 174: 23.2, 180: 23.5, 186: 23.9,
  192: 24.3, 198: 24.6, 204: 25.0, 216: 25.8, 228: 26.6, 240: 27.4, 252: 28.2,
  264: 28.9, 276: 29.6, 288: 30.3, 300: 31.0, 312: 31.7, 324: 32.3, 336: 33.0,
  348: 33.6, 360: 34.2, 372: 34.8, 384: 35.4, 396: 36.0, 408: 36.5, 420: 37.1,
  432: 37.7, 444: 38.2, 456: 38.8, 468: 39.3, 480: 39.8, 492: 40.3, 504: 40.8,
};

/** Linear interpolation inside a cutoff table so bands don't step at each row. */
function lookupCutoff(table, months) {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (months <= keys[0]) return table[keys[0]];
  if (months >= keys[keys.length - 1]) return table[keys[keys.length - 1]];
  for (let i = 0; i < keys.length - 1; i++) {
    const lo = keys[i];
    const hi = keys[i + 1];
    if (months >= lo && months <= hi) {
      const t = (months - lo) / (hi - lo);
      return table[lo] + (table[hi] - table[lo]) * t;
    }
  }
  return table[keys[keys.length - 1]];
}

/** Inverse-interpolated percentile — a rough, clearly-labelled figure. */
function estimatePercentile(bmi, months, sex) {
  const table = sex === 'female' ? GIRL_97 : BOY_97;
  const reference = lookupCutoff(table, months);
  if (!reference) return null;
  // 97th percentile maps to ~97; scale linearly around it. Deliberately
  // rounded — this is context for a doctor, not a diagnostic tool.
  const delta = bmi - reference;
  const pct = 97 + delta * 2.2;
  if (pct < 1) return 1;
  if (pct > 99.7) return 99.7;
  return Math.round(pct * 10) / 10;
}

const ADULT_AGE_MIN = 19;

/**
 * Compute a BMI result.
 * @returns {object|null} null when height or weight is missing.
 */
function computeBmi({ heightCm, weightKg, age, gender }) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;

  const metres = heightCm / 100;
  const bmi = weightKg / (metres * metres);
  if (!Number.isFinite(bmi) || bmi < 5 || bmi > 100) return null;

  const rounded = Math.round(bmi * 10) / 10;
  const ageYears = age === null ? null : Math.round(age * 10) / 10;
  const isAdult = ageYears === null ? true : ageYears >= ADULT_AGE_MIN;

  if (isAdult) {
    const band = ADULT_BANDS.find(b => rounded < b.max) || ADULT_BANDS[ADULT_BANDS.length - 1];
    return {
      bmi: rounded,
      category: band.category,
      hex: band.hex,
      percentile: null,
      isAdult: true,
      ageYears,
      gender,
    };
  }

  // Children: 5–19 is the range the WHO percentile tables cover.
  const months = Math.max(1, Math.min(19, ageYears) * 12);
  const sex = gender || null;
  const p85 = sex ? lookupCutoff(sex === 'female' ? GIRL_85 : BOY_85, months) : null;
  const p97 = sex ? lookupCutoff(sex === 'female' ? GIRL_97 : BOY_97, months) : null;

  let category;
  if (!sex) {
    category = 'BMI for age (percentile needs gender)';
  } else if (rounded >= p97) {
    category = 'Obese (above 97th percentile)';
  } else if (rounded >= p85) {
    category = 'Overweight (above 85th percentile)';
  } else {
    category = 'Normal weight for age';
  }

  return {
    bmi: rounded,
    category,
    hex: category.startsWith('Obese') ? '#ef4444'
      : category.startsWith('Overweight') ? '#f59e0b' : '#16a34a',
    percentile: sex ? estimatePercentile(rounded, months, sex) : null,
    isAdult: false,
    ageYears,
    gender: sex,
  };
}

module.exports = {
  computeBmi,
  extractMeasurements,
  toCentimetres,
  toKilograms,
  parseGender,
};
