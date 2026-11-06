// Named animation variants usable in templates. These names map to the
// @keyframes defined in PlayerPage's styled wrapper. IN = entrance, OUT = exit.

export const ANIM_VARIANTS = {
  // slide family
  slideUp:    { label: 'Slide Up',    key: 'slideUp' },
  slideDown:  { label: 'Slide Down',  key: 'slideDown' },
  flyFromBottom: { label: 'Fly From Bottom', key: 'flyFromBottom' },
  flyFromTop:    { label: 'Fly From Top',    key: 'flyFromTop' },
  flyFromLeft:   { label: 'Fly From Left',   key: 'flyFromLeft' },
  flyFromRight:  { label: 'Fly From Right',  key: 'flyFromRight' },
  // keyframe / zoom family
  zoomIn:  { label: 'Zoom In',  key: 'zoomIn' },
  scaleIn: { label: 'Scale In', key: 'scaleIn' },
  fadeIn:  { label: 'Fade In',  key: 'fadeIn' },
  bounceIn: { label: 'Bounce In', key: 'bounceIn' },
  elasticIn:{ label: 'Elastic In', key: 'elasticIn' },
  rotateIn:  { label: 'Rotate In',  key: 'rotateIn' },
  flipIn:    { label: 'Flip In',    key: 'flipIn' },
  swirlIn:   { label: 'Swirl In',   key: 'swirlIn' },
  blurIn:    { label: 'Blur In',    key: 'blurIn' },
  dropIn:    { label: 'Drop In',    key: 'dropIn' },
  wipeIn:    { label: 'Wipe In',    key: 'wipeIn' },
  skewIn:    { label: 'Skew In',    key: 'skewIn' },
  spiralIn:  { label: 'Spiral In',  key: 'spiralIn' },
  rushIn:    { label: 'Rush In',    key: 'rushIn' },
  foldIn:    { label: 'Fold In',    key: 'foldIn' },
  revealIn:  { label: 'Reveal In',  key: 'revealIn' },
  spinIn:    { label: 'Spin In',    key: 'spinIn' },
  cometIn:   { label: 'Comet In',   key: 'cometIn' },
  floatIn:   { label: 'Float In',   key: 'floatIn' },
};

export const ANIM_OPTIONS = Object.entries(ANIM_VARIANTS).map(([value, v]) => ({ value, label: v.label }));

// OUT variants mirror IN names with a "To" suffix where available.
const OUT_MAP = {
  slideUp: 'slideDown', slideDown: 'slideUp',
  flyFromBottom: 'flyToTop', flyFromTop: 'flyToBottom',
  flyFromLeft: 'flyToLeft', flyFromRight: 'flyToRight',
  zoomIn: 'zoomOut', scaleIn: 'zoomOut',
  fadeIn: 'fadeIn', bounceIn: 'zoomOut', elasticIn: 'zoomOut',
  rotateIn: 'zoomOut', flipIn: 'zoomOut', swirlIn: 'zoomOut',
  blurIn: 'blurIn', dropIn: 'flyToBottom', wipeIn: 'wipeIn',
  skewIn: 'zoomOut', spiralIn: 'zoomOut', rushIn: 'zoomOut',
  foldIn: 'foldIn', revealIn: 'revealIn', spinIn: 'zoomOut',
  cometIn: 'flyToBottom', floatIn: 'slideDown',
};

export function inAnim(name, dur = 0.6) {
  const key = ANIM_VARIANTS[name]?.key || name || 'fadeIn';
  return `${key} ${dur}s cubic-bezier(0.34,1.3,0.64,1) both`;
}
export function outAnim(name, dur = 0.5) {
  const out = OUT_MAP[name] || 'zoomOut';
  return `${out} ${dur}s cubic-bezier(0.55,0,0.85,0.36) both`;
}
