const NEWTON_ITERATIONS = 8;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 12;

function aRatio(a1, a2) {
  return 1 - 3 * a2 + 3 * a1;
}
function bRatio(a1, a2) {
  return 3 * a2 - 6 * a1;
}
function cRatio(a1) {
  return 3 * a1;
}

function sampleCurveX(t, x1, x2) {
  return ((aRatio(x1, x2) * t + bRatio(x1, x2)) * t + cRatio(x1)) * t;
}

function sampleCurveDerivativeX(t, x1, x2) {
  return 3 * aRatio(x1, x2) * t * t + 2 * bRatio(x1, x2) * t + cRatio(x1);
}

function sampleCurveY(t, y1, y2) {
  return ((aRatio(y1, y2) * t + bRatio(y1, y2)) * t + cRatio(y1)) * t;
}

function solveCurveX(x, x1, x2) {
  let t2 = x;
  let x2v;
  let d2;
  let i;

  for (i = 0; i < NEWTON_ITERATIONS; i++) {
    x2v = sampleCurveX(t2, x1, x2) - x;
    if (Math.abs(x2v) < SUBDIVISION_PRECISION) return t2;
    d2 = sampleCurveDerivativeX(t2, x1, x2);
    if (Math.abs(d2) < NEWTON_MIN_SLOPE) break;
    t2 = t2 - x2v / d2;
  }

  let t0 = 0;
  let t1 = 1;
  t2 = x;

  if (t2 < t0) return t0;
  if (t2 > t1) return t1;

  for (i = 0; i < SUBDIVISION_MAX_ITERATIONS; i++) {
    x2v = sampleCurveX(t2, x1, x2) - x;
    if (Math.abs(x2v) < SUBDIVISION_PRECISION) return t2;
    if (x > x2v) t0 = t2;
    else t1 = t2;
    t2 = (t1 - t0) * 0.5 + t0;
  }
  return t2;
}

export function cubicBezier(mX1, mY1, mX2, mY2) {
  if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
    throw new Error('cubicBezier x values must be in [0, 1] range.');
  }

  if (mX1 === mY1 && mX2 === mY2) return (t) => t;

  return (x) => {
    if (x === 0 || x === 1) return x;
    return sampleCurveY(solveCurveX(x, mX1, mX2), mY1, mY2);
  };
}

export const EASE_THEME = cubicBezier(0.22, 1, 0.36, 1);