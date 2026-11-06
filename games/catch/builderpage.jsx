import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'
import { useUploadErrors, uploadErrorMessage } from '../../apps/frontend/src/lib/builderUpload'
import PhoneFrame from '../../apps/frontend/src/components/PhoneFrame'
import FormPreview from '../../apps/frontend/src/components/FormPreview'
import ThankYouPreview from '../../apps/frontend/src/components/ThankYouPreview'

/* ─────────────────────────────────────────────
   LIGHT THEME TOKENS  (scoped to .gb-wrap)
───────────────────────────────────────────── */
const LIGHT = `
.gb-wrap {
  font-family: 'DM Sans', sans-serif;
  background: var(--gb-bg);
  color: var(--gb-text);
  min-height: 100vh;
}
.gb-wrap *,
.gb-wrap *::before,
.gb-wrap *::after { box-sizing: border-box; }

/* inputs / selects / textareas */
.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]),
.gb-wrap select,
.gb-wrap textarea {
  width: 100%;
  font-family: inherit;
  font-size: 14px;
  background: var(--gb-surface);
  border: none;
  border-bottom: 1.5px solid var(--gb-border);
  border-radius: 8px;
  color: var(--gb-text);
  padding: 10px 12px 8px;
  outline: none;
  transition: border-color .18s;
}
.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]):focus,
.gb-wrap select:focus,
.gb-wrap textarea:focus {
  border-bottom-color: #22c55e;
  border-bottom-width: 2px;
}
.gb-wrap select option { background: #fff; color: #1e1e2e; }

/* buttons */
.gb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; font-size: 13px; font-weight: 600;
  border-radius: var(--gb-radius-sm); border: none; cursor: pointer;
  transition: all .15s; white-space: nowrap; font-family: inherit;
}
.gb-btn:disabled { opacity: .5; cursor: not-allowed; }
.gb-btn-primary { background: var(--gb-primary); color: #fff; }
.gb-btn-primary:not(:disabled):hover { background: var(--gb-primary-d); transform: translateY(-1px); box-shadow: 0 4px 12px var(--gb-primary-g); }
.gb-btn-ghost { background: var(--gb-surface); color: var(--gb-text2); border: 1.5px solid var(--gb-border); }
.gb-btn-ghost:not(:disabled):hover { border-color: var(--gb-primary); color: var(--gb-primary); }
.gb-btn-danger { background: #fee2e2; color: var(--gb-danger); border: 1.5px solid #fecaca; }
.gb-btn-danger:not(:disabled):hover { background: #fecaca; }
.gb-btn-success { background: #dcfce7; color: var(--gb-success); border: 1.5px solid #bbf7d0; }
.gb-btn-success:not(:disabled):hover { background: #bbf7d0; }
.gb-btn-sm { padding: 5px 10px; font-size: 12px; }
.gb-btn-icon { padding: 6px; border-radius: 6px; }

/* card */
.gb-card {
  background: var(--gb-surface);
  border: 1.5px solid var(--gb-border);
  border-radius: var(--gb-radius);
  box-shadow: var(--gb-shadow);
}

/* label */
.gb-label {
  font-size: 11px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: var(--gb-text2); margin-bottom: 4px;
  display: block;
}

/* section block */
.gb-section {
  background: var(--gb-surface2);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius);
  padding: 16px;
  margin-bottom: 14px;
}
.gb-section-title {
  font-size: 12px; font-weight: 700; letter-spacing: .05em;
  text-transform: uppercase; color: var(--gb-primary);
  margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
}

/* tabs */
.gb-tabs {
  display: flex; border-bottom: 2px solid var(--gb-border);
  margin-bottom: 24px; gap: 0; overflow-x: auto;
}
.gb-tab {
  padding: 10px 18px; font-size: 13px; font-weight: 600;
  border: none; background: none; cursor: pointer;
  color: var(--gb-text2); border-bottom: 2px solid transparent;
  margin-bottom: -2px; transition: color .15s; white-space: nowrap;
  font-family: inherit;
}
.gb-tab.active { color: #9210f6; border-bottom-color: #9210f6; }
.gb-tab:hover:not(.active) { color: var(--gb-text); }

/* toast */
@keyframes gb-slide-in { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:none } }
.gb-toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 9999;
  padding: 12px 18px; border-radius: 10px; color: #fff; font-weight: 600;
  font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,.15);
  animation: gb-slide-in .22s ease; font-family: 'DM Sans',sans-serif;
  max-width: 320px;
}

/* drag handle */
.gb-drag-handle { cursor: grab; color: var(--gb-text3); padding: 4px; display: flex; align-items: center; }
.gb-drag-handle:active { cursor: grabbing; }

/* question row */
.gb-q-row {
  background: var(--gb-surface);
  border: 1.5px solid var(--gb-border);
  border-radius: var(--gb-radius);
  margin-bottom: 10px;
  overflow: hidden;
  transition: box-shadow .15s;
}
.gb-q-row:hover { box-shadow: var(--gb-shadow-md); }
.gb-q-row.dragging { opacity: .5; box-shadow: 0 8px 32px rgba(99,102,241,.2); }

.gb-q-header {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; cursor: pointer; user-select: none;
  background: var(--gb-surface);
}
.gb-q-header:hover { background: var(--gb-surface2); }
.gb-q-body { padding: 16px; border-top: 1.5px solid var(--gb-border); }

/* color swatch */
.gb-swatch {
  width: 28px; height: 28px; border-radius: 6px;
  border: 2px solid var(--gb-border); cursor: pointer; flex-shrink: 0;
}

/* image preview thumb */
.gb-thumb {
  height: 44px; width: auto; border-radius: 6px;
  border: 1px solid var(--gb-border); object-fit: contain; background: #f9f9f9;
}

/* empty state */
.gb-empty { text-align: center; padding: 56px 20px; color: var(--gb-text2); }
.gb-empty-icon { font-size: 44px; margin-bottom: 12px; }

/* grid helpers */
.gb-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
.gb-col { flex: 1; min-width: 140px; }

/* sticky add button bar */
.gb-sticky-bar {
  position: sticky; top: 0; z-index: 40;
  background: rgba(244,246,251,.92); backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--gb-border);
  padding: 10px 0; margin-bottom: 16px;
  display: flex; align-items: center; justify-content: space-between;
}

/* phone mockup */
.gb-phone {
  width: 220px; min-height: 380px; border-radius: 28px;
  border: 3px solid #d1d5db; background: #f9f9fb;
  overflow: hidden; position: relative; box-shadow: 0 8px 32px rgba(0,0,0,.12);
}

/* color picker popup */
.gb-cpop {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 300;
  background: var(--gb-surface); border: 1.5px solid var(--gb-border);
  border-radius: 10px; padding: 12px; box-shadow: var(--gb-shadow-md);
  display: grid; grid-template-columns: repeat(7,1fr); gap: 5px; width: 220px;
}

/* badge */
.gb-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700;
}
.gb-badge-purple { background: rgba(99,102,241,.12); color: var(--gb-primary); }
.gb-badge-green  { background: rgba(22,163,74,.12);  color: var(--gb-success); }
.gb-badge-gray   { background: #f0f2f8; color: var(--gb-text2); }

/* form group inline */
.gb-fg { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 120px; }

/* scroll util */
.gb-scroll-y { overflow-y: auto; }

/* option row */
.gb-opt-row {
  background: var(--gb-surface2); border: 1px solid var(--gb-border);
  border-radius: 8px; padding: 10px 12px; margin-bottom: 8px;
}

/* preview overlay animations */
@keyframes flyFromBottom  { from { transform:translateY(110vh) scale(0.9);opacity:0 } to { transform:translateY(0) scale(1);opacity:1 } }
@keyframes flyFromTop     { from { transform:translateY(-110vh) scale(0.9);opacity:0 } to { transform:translateY(0) scale(1);opacity:1 } }
@keyframes flyFromLeft    { from { transform:translateX(-110vw) scale(0.9);opacity:0 } to { transform:translateX(0) scale(1);opacity:1 } }
@keyframes flyFromRight   { from { transform:translateX(110vw) scale(0.9);opacity:0 } to { transform:translateX(0) scale(1);opacity:1 } }
@keyframes zoomIn         { from { transform:scale(0.1);opacity:0 } to { transform:scale(1);opacity:1 } }
@keyframes fadeIn         { from { opacity:0 } to { opacity:1 } }
@keyframes scaleIn        { from { transform:scale(0.5);opacity:0 } to { transform:scale(1);opacity:1 } }
@keyframes slideUp        { from { transform:translateY(60px);opacity:0 } to { transform:translateY(0);opacity:1 } }
@keyframes slideDown      { from { transform:translateY(-60px);opacity:0 } to { transform:translateY(0);opacity:1 } }
@keyframes rotateIn       { from { transform:rotate(-360deg) scale(0.3);opacity:0 } to { transform:rotate(0) scale(1);opacity:1 } }
@keyframes flipIn         { from { transform:rotateX(-90deg);opacity:0 } to { transform:rotateX(0);opacity:1 } }
@keyframes swirlIn        { from { transform:rotate(720deg) scale(0.1);opacity:0 } to { transform:rotate(0) scale(1);opacity:1 } }
@keyframes bounceIn       { 0%{transform:scale(0);opacity:0} 50%{transform:scale(1.15)} 70%{transform:scale(0.92)} 85%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
@keyframes elasticIn      { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.08)} 80%{transform:scale(0.95)} 100%{transform:scale(1);opacity:1} }
@keyframes blurIn         { from { filter:blur(12px);opacity:0 } to { filter:blur(0);opacity:1 } }
@keyframes dropIn         { 0%{transform:translateY(-120vh) rotate(-20deg);opacity:0} 60%{transform:translateY(10px) rotate(2deg);opacity:1} 80%{transform:translateY(-5px) rotate(-1deg)} 100%{transform:translateY(0) rotate(0);opacity:1} }
@keyframes wipeIn         { from { clip-path:inset(0 100% 0 0) } to { clip-path:inset(0 0 0 0) } }
@keyframes skewIn         { from { transform:skewX(-20deg);opacity:0 } to { transform:skewX(0);opacity:1 } }
@keyframes spiralIn       { from { transform:rotate(1080deg) translateX(-200px);opacity:0 } to { transform:rotate(0) translateX(0);opacity:1 } }
@keyframes rushIn         { from { transform:scale(3);opacity:0 } to { transform:scale(1);opacity:1 } }
@keyframes foldIn         { from { transform:perspective(500px) rotateY(90deg);opacity:0 } to { transform:perspective(500px) rotateY(0);opacity:1 } }
@keyframes revealIn       { from { clip-path:circle(0% at 50% 50%) } to { clip-path:circle(100% at 50% 50%) } }
@keyframes spinIn         { from { transform:rotate(720deg) scale(0);opacity:0 } to { transform:rotate(0) scale(1);opacity:1 } }
@keyframes cometIn        { from { transform:translate(-200px,-200px) rotate(-30deg) scale(0.3);opacity:0 } to { transform:translate(0,0) rotate(0) scale(1);opacity:1 } }
@keyframes floatIn        { from { transform:translateY(40px);opacity:0 } to { transform:translateY(0);opacity:1 } }

@keyframes flyToTop       { from { transform:translateY(0) scale(1);opacity:1 } to { transform:translateY(-110vh) scale(0.9);opacity:0 } }
@keyframes flyToBottom    { from { transform:translateY(0) scale(1);opacity:1 } to { transform:translateY(110vh) scale(0.9);opacity:0 } }
@keyframes flyToLeft      { from { transform:translateX(0) scale(1);opacity:1 } to { transform:translateX(-110vw) scale(0.9);opacity:0 } }
@keyframes flyToRight     { from { transform:translateX(0) scale(1);opacity:1 } to { transform:translateX(110vw) scale(0.9);opacity:0 } }
@keyframes zoomOut        { from { transform:scale(1);opacity:1 } to { transform:scale(0.1);opacity:0 } }
@keyframes fadeOut        { from { opacity:1 } to { opacity:0 } }
@keyframes scaleOut       { from { transform:scale(1);opacity:1 } to { transform:scale(0.5);opacity:0 } }
@keyframes slideUpOut     { from { transform:translateY(0);opacity:1 } to { transform:translateY(-60px);opacity:0 } }
@keyframes slideDownOut   { from { transform:translateY(0);opacity:1 } to { transform:translateY(60px);opacity:0 } }
@keyframes rotateOut      { from { transform:rotate(0) scale(1);opacity:1 } to { transform:rotate(360deg) scale(0.3);opacity:0 } }
@keyframes flipOut        { from { transform:rotateX(0);opacity:1 } to { transform:rotateX(90deg);opacity:0 } }
@keyframes swirlOut       { from { transform:rotate(0) scale(1);opacity:1 } to { transform:rotate(-720deg) scale(0.1);opacity:0 } }
@keyframes bounceOut      { 0%{transform:scale(1);opacity:1} 50%{transform:scale(1.06)} 100%{transform:scale(0.1);opacity:0} }
@keyframes elasticOut     { 0%{transform:scale(1);opacity:1} 30%{transform:scale(0.92)} 60%{transform:scale(1.06)} 100%{transform:scale(0);opacity:0} }
@keyframes blurOut        { from { filter:blur(0);opacity:1 } to { filter:blur(12px);opacity:0 } }
@keyframes dropOut        { 0%{transform:translateY(0) rotate(0);opacity:1} 40%{transform:translateY(10px) rotate(2deg);opacity:1} 100%{transform:translateY(120vh) rotate(20deg);opacity:0} }
@keyframes wipeOut        { from { clip-path:inset(0 0 0 0) } to { clip-path:inset(0 0 0 100%) } }
@keyframes skewOut        { from { transform:skewX(0);opacity:1 } to { transform:skewX(20deg);opacity:0 } }
@keyframes spiralOut      { from { transform:rotate(0) translateX(0);opacity:1 } to { transform:rotate(-1080deg) translateX(200px);opacity:0 } }
@keyframes rushOut        { from { transform:scale(1);opacity:1 } to { transform:scale(3);opacity:0 } }
@keyframes foldOut        { from { transform:perspective(500px) rotateY(0);opacity:1 } to { transform:perspective(500px) rotateY(90deg);opacity:0 } }
@keyframes hideOut        { from { clip-path:circle(100% at 50% 50%) } to { clip-path:circle(0% at 50% 50%) } }
@keyframes spinOut        { from { transform:rotate(0) scale(1);opacity:1 } to { transform:rotate(-720deg) scale(0);opacity:0 } }
@keyframes cometOut       { from { transform:translate(0,0) rotate(0) scale(1);opacity:1 } to { transform:translate(200px,200px) rotate(30deg) scale(0.3);opacity:0 } }
@keyframes floatOut       { from { transform:translateY(0);opacity:1 } to { transform:translateY(-40px);opacity:0 } }
@keyframes qFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes qBreathe { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.04);opacity:0.9} }
@keyframes qPulse { 0%,100%{transform:scale(1);filter:brightness(1)} 50%{transform:scale(1.05);filter:brightness(1.08)} }
@keyframes qShimmer { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(1.5deg)} 75%{transform:rotate(-1.5deg)} }
@keyframes qKenBurns { 0%{transform:scale(1) translate(0,0)} 100%{transform:scale(1.08) translate(-2%,-2%)} }
@keyframes qBounce { 0%,100%{transform:translateY(0)} 20%{transform:translateY(-14px)} 40%{transform:translateY(-7px)} 60%{transform:translateY(-3px)} 80%{transform:translateY(-1px)} }
@keyframes qSway { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
@keyframes qWobble { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-6px) rotate(-3deg)} 30%{transform:translateX(4px) rotate(2deg)} 45%{transform:translateX(-3px) rotate(-1deg)} 60%{transform:translateX(2px) rotate(1deg)} }
@keyframes qSwing { 0%,100%{transform:rotate(0deg)} 20%{transform:rotate(6deg)} 40%{transform:rotate(-5deg)} 60%{transform:rotate(3deg)} 80%{transform:rotate(-2deg)} }
@keyframes qTada { 0%,100%{transform:scale(1) rotate(0deg)} 10%{transform:scale(0.94) rotate(-2deg)} 20%{transform:scale(1.06) rotate(2deg)} 30%{transform:scale(1) rotate(-2deg)} 40%{transform:scale(1.02) rotate(0deg)} }
@keyframes qHeartBeat { 0%,100%{transform:scale(1)} 15%{transform:scale(1.12)} 30%{transform:scale(1)} 45%{transform:scale(1.08)} 60%{transform:scale(1)} }
@keyframes qRotate { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
@keyframes qFlash { 0%,100%{opacity:1} 25%{opacity:0.3} 50%{opacity:1} 75%{opacity:0.3} }
@keyframes qRubberBand { 0%,100%{transform:scaleX(1) scaleY(1)} 15%{transform:scaleX(1.2) scaleY(0.85)} 30%{transform:scaleX(0.9) scaleY(1.1)} 45%{transform:scaleX(1.08) scaleY(0.95)} 60%{transform:scaleX(0.97) scaleY(1.03)} }
@keyframes qSlideUpDown { 0%,100%{transform:translateY(0)} 25%{transform:translateY(-20px)} 50%{transform:translateY(0)} 75%{transform:translateY(12px)} }
@keyframes qZoomInOut { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
@keyframes qFadeInOut { 0%,100%{opacity:1} 50%{opacity:0.3} }
@keyframes qWave { 0%,100%{transform:translateY(0) rotate(0deg)} 25%{transform:translateY(-6px) rotate(1deg)} 50%{transform:translateY(0) rotate(0deg)} 75%{transform:translateY(4px) rotate(-1deg)} }
@keyframes qOrbit { 0%{transform:translate(0,0)} 25%{transform:translate(10px,-10px)} 50%{transform:translate(0,-16px)} 75%{transform:translate(-10px,-10px)} 100%{transform:translate(0,0)} }
@keyframes qGlitch { 0%,100%{transform:translate(0)} 20%{transform:translate(-2px,1px) skewX(-1deg)} 40%{transform:translate(2px,-1px) skewX(1deg)} 60%{transform:translate(-1px,-1px) skewX(-0.5deg)} 80%{transform:translate(1px,2px) skewX(0.5deg)} }
@keyframes qBlurBlink { 0%,100%{filter:blur(0);opacity:1} 25%{filter:blur(3px);opacity:0.6} 50%{filter:blur(0);opacity:1} 75%{filter:blur(2px);opacity:0.7} }
@keyframes qSkew { 0%,100%{transform:skewX(0deg)} 25%{transform:skewX(-4deg)} 50%{transform:skewX(0deg)} 75%{transform:skewX(4deg)} }
@keyframes qRoll { 0%{transform:translateX(0) rotate(0deg)} 50%{transform:translateX(60px) rotate(360deg)} 100%{transform:translateX(0) rotate(720deg)} }
@keyframes qBounceIn { 0%{transform:scale(0);opacity:0} 50%{transform:scale(1.12)} 70%{transform:scale(0.94)} 85%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
@keyframes qJello { 0%,100%{transform:skewX(0deg) skewY(0deg)} 25%{transform:skewX(-5deg) skewY(3deg)} 50%{transform:skewX(5deg) skewY(-3deg)} 75%{transform:skewX(-3deg) skewY(2deg)} }
`

/* ─────────── helpers ─────────── */
const ANIM_IN  = [
  { value:'flyFromBottom', label:'⬆️ Fly from Bottom' },
  { value:'flyFromTop',    label:'⬇️ Fly from Top' },
  { value:'flyFromLeft',   label:'➡️ Fly from Left' },
  { value:'flyFromRight',  label:'⬅️ Fly from Right' },
  { value:'zoomIn',        label:'🔍 Zoom In' },
  { value:'fadeIn',        label:'✨ Fade In' },
  { value:'scaleIn',       label:'📐 Scale In' },
  { value:'slideUp',       label:'⬆️ Slide Up' },
  { value:'slideDown',     label:'⬇️ Slide Down' },
  { value:'rotateIn',      label:'🔄 Rotate In' },
  { value:'flipIn',        label:'🪞 Flip In' },
  { value:'swirlIn',       label:'🌀 Swirl In' },
  { value:'bounceIn',      label:'🏀 Bounce In' },
  { value:'elasticIn',     label:'🧵 Elastic In' },
  { value:'blurIn',        label:'👁️ Blur In' },
  { value:'dropIn',        label:'💧 Drop In' },
  { value:'wipeIn',        label:'🧹 Wipe In' },
  { value:'skewIn',        label:'📏 Skew In' },
  { value:'spiralIn',      label:'🐚 Spiral In' },
  { value:'rushIn',        label:'💨 Rush In' },
  { value:'foldIn',        label:'📄 Fold In' },
  { value:'revealIn',      label:'🎭 Reveal In' },
  { value:'spinIn',        label:'🪀 Spin In' },
  { value:'cometIn',       label:'☄️ Comet In' },
  { value:'floatIn',       label:'🌊 Float In' },
]
const ANIM_OUT = [
  { value:'flyToTop',     label:'⬆️ Fly to Top' },
  { value:'flyToBottom',  label:'⬇️ Fly to Bottom' },
  { value:'flyToLeft',    label:'⬅️ Fly to Left' },
  { value:'flyToRight',   label:'➡️ Fly to Right' },
  { value:'zoomOut',      label:'🔍 Zoom Out' },
  { value:'fadeOut',      label:'✨ Fade Out' },
  { value:'scaleOut',     label:'📐 Scale Out' },
  { value:'slideUpOut',   label:'⬆️ Slide Up Out' },
  { value:'slideDownOut', label:'⬇️ Slide Down Out' },
  { value:'rotateOut',    label:'🔄 Rotate Out' },
  { value:'flipOut',      label:'🪞 Flip Out' },
  { value:'swirlOut',     label:'🌀 Swirl Out' },
  { value:'bounceOut',    label:'🏀 Bounce Out' },
  { value:'elasticOut',   label:'🧵 Elastic Out' },
  { value:'blurOut',      label:'👁️ Blur Out' },
  { value:'dropOut',      label:'💧 Drop Out' },
  { value:'wipeOut',      label:'🧹 Wipe Out' },
  { value:'skewOut',      label:'📏 Skew Out' },
  { value:'spiralOut',    label:'🐚 Spiral Out' },
  { value:'rushOut',      label:'💨 Rush Out' },
  { value:'foldOut',      label:'📄 Fold Out' },
  { value:'hideOut',      label:'🎭 Hide Out' },
  { value:'spinOut',      label:'🪀 Spin Out' },
  { value:'cometOut',     label:'☄️ Comet Out' },
  { value:'floatOut',     label:'🌊 Float Out' },
]
const IMAGE_ANIMS = [
  { value:'float',     label:'🌊 Float' },
  { value:'breathe',   label:'💨 Breathe' },
  { value:'pulse',     label:'💓 Pulse' },
  { value:'shimmer',   label:'✨ Shimmer' },
  { value:'kenburns',  label:'🎥 Ken Burns' },
  { value:'bounce',    label:'🔄 Bounce' },
  { value:'sway',      label:'🌿 Sway' },
  { value:'wobble',    label:'🤪 Wobble' },
  { value:'swing',     label:'⏳ Swing' },
  { value:'tada',      label:'🎉 Tada' },
  { value:'heartBeat', label:'💖 Heart Beat' },
  { value:'rotate',    label:'🔄 Rotate' },
  { value:'flash',     label:'⚡ Flash' },
  { value:'rubberBand',label:'🌀 Rubber Band' },
  { value:'slideUpDown',label:'📐 Slide Up/Down' },
  { value:'zoomInOut', label:'🔍 Zoom In/Out' },
  { value:'fadeInOut', label:'🌅 Fade In/Out' },
  { value:'wave',      label:'🌊 Wave' },
  { value:'orbit',     label:'🪐 Orbit' },
  { value:'glitch',    label:'💥 Glitch' },
  { value:'blurBlink', label:'👁️ Blur Blink' },
  { value:'skew',      label:'📏 Skew' },
  { value:'roll',      label:'🥌 Roll' },
  { value:'bounceIn',  label:'🏀 Bounce In' },
  { value:'jello',     label:'🍮 Jello' },
  { value:'none',      label:'⛔ None' },
]
const IMAGE_ANIM_MAP = IMAGE_ANIMS.reduce((map, a) => {
  if (a.value === 'none') return map
  map[a.value] = `q${a.value.charAt(0).toUpperCase() + a.value.slice(1)} ${a.value === 'kenburns' ? '8s' : a.value === 'orbit' ? '4s' : a.value === 'roll' ? '3s' : '2.5s'} ease-in-out infinite`
  return map
}, {})
const FONT_CATEGORIES = [
  { name:'Handwriting', fonts:['Caveat','Patrick Hand','Indie Flower','Shadows Into Light','Gloria Hallelujah','Permanent Marker','Kalam','Satisfy','Reenie Beanie','Homemade Apple','Sacramento','Alex Brush'] },
  { name:'Professional', fonts:['Inter','Work Sans','Source Sans 3','Lato','Open Sans','Roboto','Nunito','DM Sans','Poppins','Rubik','Exo 2','Cabin'] },
  { name:'Luxury', fonts:['Playfair Display','Cormorant Garamond','Libre Baskerville','Cinzel','Forum','Cormorant','Bodoni Moda','Tangerine','Great Vibes','Parisienne','Bellefair','Marcellus'] },
  { name:'Modern Casual', fonts:['Montserrat','Syne','Raleway','Quicksand','Josefin Sans','Space Grotesk','Plus Jakarta Sans','Outfit','Sora','Manrope','Lexend','Figtree'] },
]
const COLOR_PRESETS = ['#1a1a2e','#ffffff','#000000','#ef4444','#22c55e','#3b82f6',
  '#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#0ea5e9']

/* ─────────── Toast ─────────── */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [])
  return (
    <div className="gb-toast" style={{ background: type === 'success' ? '#16a34a' : '#dc2626' }}>
      {type === 'success' ? '✅' : '❌'} {msg}
    </div>
  )
}

/* ─────────── ColorPicker ─────────── */
function ColorPicker({ value, onChange, label, noPresets }) {
  const [show, setShow] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setShow(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])
  return (
    <div ref={ref} style={{ position:'relative', display:'inline-flex', flexDirection:'column', gap:4 }}>
      {label && <span className="gb-label">{label}</span>}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div className="gb-swatch" style={{ background: value || '#6366f1' }} onClick={() => setShow(s => !s)} />
        <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="#000000"
          style={{ width:90, fontSize:12, padding:'5px 8px' }} />
      </div>
      {show && (
        <div className="gb-cpop" style={noPresets ? { display:'flex', flexDirection:'column', gap:6, padding:10 } : {}}>
          {!noPresets && COLOR_PRESETS.map(c => (
            <div key={c} onClick={() => { onChange(c); setShow(false) }}
              style={{ width:22, height:22, background:c, borderRadius:4, cursor:'pointer',
                border: value===c ? '2px solid #6366f1' : '1px solid #e2e6f0' }} />
          ))}
          <input type="color" value={value||'#000000'} onChange={e => onChange(e.target.value)}
            style={{ gridColumn:'span 7', width:'100%', height:28, padding:0, border:'none', background:'none', cursor:'pointer' }} />
          <button className="gb-btn gb-btn-ghost gb-btn-sm" style={{ width:'100%' }} onClick={() => setShow(false)}>Close</button>
        </div>
      )}
    </div>
  )
}

/* ─────────── ImageUpload ─────────── */
function ImageUpload({ label, url, onFile, onClear, accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" }) {
  const ref = useRef()
  return (
    <div>
      {label && <span className="gb-label">{label}</span>}
      <input type="file" ref={ref} accept={accept} style={{ display:'none' }}
        onChange={e => { const f=e.target.files[0]; if(f) onFile(f) }} />
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginTop:4 }}>
        <button className="gb-btn gb-btn-ghost gb-btn-sm" type="button" onClick={() => ref.current.click()}>📷 Upload</button>
        {url && <img src={url} className="gb-thumb" alt="" />}
        {url && <button className="gb-btn gb-btn-danger gb-btn-sm gb-btn-icon" type="button" onClick={onClear}>✕</button>}
      </div>
    </div>
  )
}

/* ─────────── SoundSelector ─────────── */
function SoundSelector({ label, value, onChange, sounds }) {
  return (
    <div className="gb-fg">
      <span className="gb-label">{label}</span>
      <select value={value||''} onChange={e => onChange(e.target.value)}>
        <option value="">— None —</option>
        {sounds.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function CatchBuilderPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [game,          setGame]          = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [fetchError,    setFetchError]    = useState(null)
  const [tab,           setTab]           = useState('form')
  const [toast,         setToast]         = useState(null)
  const [formFields,    setFormFields]    = useState([])
  const [emailTemplate, setEmailTemplate] = useState({})
  const [settings,      setSettings]      = useState({})
  const [slugInput,     setSlugInput]     = useState('')
  const [editingName,   setEditingName]   = useState(false)
  const [nameInput,     setNameInput]     = useState('')
  const [sounds,        setSounds]        = useState([])
  const [saving,        setSaving]        = useState(false)
  const [soundUploading,setSoundUploading]= useState(false)
  const [redirectUrl,   setRedirectUrl]   = useState('')

  const soundUploadRef = useRef()
  const bgImgRef       = useRef()
  const tyBgImgRef     = useRef()
  const gameLogoRef    = useRef()

  const showToast = (msg, type='success') => setToast({ msg, type })

  const upload = useUploadErrors()

  const loadData = useCallback(() => {
    setLoading(true); setFetchError(null)
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/catch/${id}/settings`),
      api.get(`/sounds/games/${id}/sounds`)
    ]).then(([gRes, sRes, soundRes]) => {
      const g = gRes.data.game; setGame(g)
      const s = sRes.data.settings || {}; setSettings(s)
      setSounds(soundRes.data.sounds || [])
      setFormFields(g.formFields || [])
      setEmailTemplate(g.emailTemplate || {})
      setRedirectUrl(g.redirect_url || '')
      setSlugInput(g.slug || '')
    }).catch(err => {
      setFetchError(err.response?.data?.message || err.message || 'Failed to load')
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  /* ─── Load font for preview ─── */
  useEffect(() => {
    const font = settings.font_family
    if (!font || font === 'DM Sans') return
    const id = 'gf-' + font.replace(/\s/g, '-')
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(font) + ':wght@400;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [settings.font_family])

  /* ─── Preload all 48 fonts for font selector ─── */
  useEffect(() => {
    const families = FONT_CATEGORIES.flatMap(c => c.fonts)
      .filter(f => f !== 'DM Sans')
      .map(f => encodeURIComponent(f) + ':wght@400;600;700')
      .join('&family=')
    if (!families) return
    const id = 'gf-all-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=' + families + '&display=swap'
    document.head.appendChild(link)
  }, [])

  /* ─── Form Fields ─── */
  const addFormField    = ()          => setFormFields([...formFields, { field_label:'New Field', field_type:'text', is_required:0, field_options:[] }])
  const removeFormField = i           => { const f=[...formFields]; f.splice(i,1); setFormFields(f) }
  const updateFormField = (i,key,val) => { const f=[...formFields]; f[i]={ ...f[i],[key]:val }; setFormFields(f) }
  const saveFormFields  = async () => {
    setSaving(true)
    try { await api.put(`/games/${id}/form-fields`, { fields: formFields }); showToast('Form fields saved') }
    catch { showToast('Error saving form fields', 'error') }
    setSaving(false)
  }

  /* ─── Email ─── */
  const saveEmailTemplate = async () => {
    setSaving(true)
    try { await api.put(`/games/${id}/email-template`, emailTemplate); showToast('Email template saved') }
    catch { showToast('Error saving email template', 'error') }
    setSaving(false)
  }

  /* ─── Settings ─── */
  const saveSettings = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      const textFields = ['spawn_rate','fall_speed','max_misses','time_limit_seconds','item_type','basket_color','heading_1','heading_2','heading_3','description_text','intro_text','outro_text','submit_button_text','continue_button_text','start_button_text','font_family','show_timer','sound_catch_id','sound_miss_id','sound_gameover_id','terms_enabled','terms_text','terms_url','meta_description','heading_1_color','heading_2_color','heading_3_color','description_color','intro_text_color','outro_text_color','thankyou_subtitle','thankyou_subtitle_color','submit_button_text_color','submit_button_bg_color','continue_button_text_color','continue_button_bg_color','start_button_text_color','start_button_bg_color','bg_color','primary_color']
      for (const f of textFields) fd.append(f, settings[f] ?? '')
      if (settings._bgFile) fd.append('bg_image', settings._bgFile)
      else fd.append('bg_image_url', settings.bg_image_url || '')
      if (settings._tyBgFile) fd.append('thankyou_bg_image', settings._tyBgFile)
      else fd.append('thankyou_bg_image_url', settings.thankyou_bg_image_url || '')
      if (settings._logoFile) fd.append('game_logo', settings._logoFile)
      else fd.append('game_logo_url', settings.game_logo_url || '')
      if (settings._revealFile) fd.append('reveal_image', settings._revealFile)
      else fd.append('reveal_image_url', settings.reveal_image_url || '')
      if (settings._gifFile) fd.append('submit_confirm_gif', settings._gifFile)
      else fd.append('submit_confirm_gif_url', settings.submit_confirm_gif_url || '')
      await api.put(`/catch/${id}/settings`, fd)
      await api.put(`/games/${id}`, { redirect_url: redirectUrl, slug: slugInput.trim() || undefined })
      showToast('Settings saved')
    } catch (err) {
      upload.clearAll()
      const msg = uploadErrorMessage(err)
      if (err?.response?.status === 413) {
        if (_bgFile) upload.setFieldError('bg_image_url', msg)
        if (_logoFile) upload.setFieldError('game_logo_url', msg)
        if (_tyBgFile) upload.setFieldError('thankyou_bg_image_url', msg)
        if (_gifFile) upload.setFieldError('submit_confirm_gif_url', msg)
        if (_revealFile) upload.setFieldError('reveal_image_url', msg)
        if (!_bgFile && !_logoFile && !_tyBgFile && !_gifFile && !_revealFile) upload.setFieldError('bg_image_url', msg)
      } else {
        upload.setFieldError('bg_image_url', msg)
      }
      showToast(msg, 'error')
    }
    setSaving(false)
  }

  /* ─── Game Name ─── */
  const saveGameName = async () => {
    if (!nameInput.trim()) return
    try {
      await api.put(`/games/${id}`, { name: nameInput.trim() })
      setGame(prev => ({ ...prev, name: nameInput.trim() }))
      showToast('Game name saved')
    } catch { showToast('Error saving name', 'error') }
    setEditingName(false)
  }

  /* ─── Sounds ─── */
  const uploadSound = async e => {
    const file = e.target.files[0]; if (!file) return
    const allowed = ['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/x-wav','audio/wave']
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg)$/i)) {
      showToast('Only MP3, WAV, OGG allowed', 'error'); e.target.value=''; return
    }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', file.name.replace(/\.[^.]+$/,''))
    fd.append('sound_type', 'custom')
    setSoundUploading(true)
    try {
      const res = await api.post(`/sounds/games/${id}/sounds`, fd)
      setSounds(prev => [res.data.sound, ...prev])
      showToast('Sound uploaded')
    } catch (err) { showToast('Error: '+(err.response?.data?.message||err.message), 'error') }
    setSoundUploading(false); e.target.value=''
  }
  const deleteSound = async s => {
    try { await api.delete(`/sounds/sounds/${s.id}`); setSounds(prev => prev.filter(x => x.id!==s.id)); showToast('Sound deleted') }
    catch { showToast('Error', 'error') }
  }

  const gameLink = game ? `${window.location.origin}/play/${game.slug}/${game.client_slug}` : ''
  const TAB_FIELDS = {
    form: ['bg_image_url','game_logo_url'],
    thankyou: ['thankyou_bg_image_url','submit_confirm_gif_url','reveal_image_url'],
  }

  const TABS = [
    { id:'form',      label:'Player Form' },
    { id:'gameplay',  label:'Gameplay' },
    { id:'thankyou',  label:'Thankyou Page' },
    { id:'email',     label:'Email' },
    { id:'sounds',    label:'Audio' },
    { id:'settings',  label:'Settings' },
  ]

  if (loading) return (
    <div className="gb-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign:'center', color:'var(--gb-text2)' }}>
        <div style={{ width:40,height:40,borderRadius:'50%',border:'3px solid #e2e6f0',borderTopColor:'#6366f1',animation:'spin .8s linear infinite',margin:'0 auto 16px' }} />
        Loading builder…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (fetchError) return (
    <div className="gb-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign:'center', maxWidth:400 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>⚠️</div>
        <h2 style={{ color:'var(--gb-danger)', marginBottom:8 }}>Builder Failed to Load</h2>
        <p style={{ color:'var(--gb-text2)', marginBottom:20 }}>{fetchError}</p>
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
          <button className="gb-btn gb-btn-primary" onClick={loadData}>🔄 Retry</button>
          <button className="gb-btn gb-btn-ghost" onClick={() => navigate('/dashboard/games')}>← Back to Games</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="gb-wrap">
      <style>{LIGHT}</style>

      {/* ─── Header (3-col grid) ─── */}
      <div style={{
        display:'grid', gridTemplateColumns:'1fr auto 1fr',
        background:'var(--gb-surface)', borderBottom:'1.5px solid var(--gb-border)',
        padding:'10px 28px', gap:'4px 20px', alignItems:'center',
        position:'sticky', top:'62px', zIndex:50, boxShadow:'0 1px 8px rgba(0,0,0,.06)'
      }}>
        {/* Col 1: Back icon + Name + Builder badge */}
        <div style={{ display:'flex', gap:6, alignItems:'flex-start', justifySelf:'start' }}>
          <button className="gb-btn gb-btn-ghost gb-btn-sm" onClick={() => navigate('/dashboard/games')}
            style={{ padding:'6px 8px', fontSize:16, lineHeight:1, marginTop:1 }} title="Back to games">←</button>
          <div>
            {editingName ? (
              <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                <input value={nameInput} onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter') saveGameName(); if (e.key==='Escape') setEditingName(false) }}
                  onBlur={saveGameName} autoFocus
                  style={{ width:180, fontSize:14, fontWeight:700, padding:'3px 6px' }} />
                <button className="gb-btn gb-btn-ghost gb-btn-sm" onClick={() => setEditingName(false)} style={{ padding:'2px 6px' }}>✕</button>
              </div>
            ) : (
              <div style={{ fontWeight:700, fontSize:14, color:'var(--gb-text)', cursor:'pointer', lineHeight:1.3 }}
                onClick={() => { setNameInput(game?.name||''); setEditingName(true) }} title="Click to edit">
                {game?.name} <span style={{ fontSize:10, color:'var(--gb-text3)', fontWeight:400 }}>✎</span>
              </div>
            )}
            <div style={{ fontSize:9.5, fontWeight:600, color:'var(--gb-text3)', letterSpacing:'.04em', textTransform:'uppercase', marginTop:1 }}>Builder</div>
          </div>
        </div>

        {/* Col 2: Tabs */}
        <div className="gb-tabs" style={{ marginBottom:0, borderBottom:'none', justifySelf:'center' }}>
          {TABS.map(t => (
            <button key={t.id} className={`gb-tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}
              style={{ padding:'6px 14px', fontSize:12.5 }}>
              {t.label}{upload.tabHasError(t.id, TAB_FIELDS[t.id] || []) && <span className="gb-tab-err-dot" />}</button>
          ))}
        </div>

        {/* Col 3: Copy + Preview */}
        <div style={{ display:'flex', gap:6, alignItems:'center', justifySelf:'end' }}>
          <button className="gb-btn gb-btn-ghost gb-btn-sm" style={{ padding:'6px 8px', fontSize:16, lineHeight:1 }}
            onClick={() => { navigator.clipboard.writeText(gameLink); showToast('Link copied!') }}
            title="Copy game link">🔗</button>
          <a href={gameLink} target="_blank" rel="noreferrer" className="gb-btn gb-btn-ghost gb-btn-sm"
            style={{ padding:'6px 8px', fontSize:16, lineHeight:1, textDecoration:'none' }}
            title="Preview game">👁</a>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 0 24px 20px', display:'grid', gridTemplateColumns:'1fr 320px', gap:24, alignItems:'start' }}>

        {/* ─── LEFT COL ─── */}
        <div>

          {/* ════ FORM TAB ════ */}
          {tab === 'form' && (
            <div>
              <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
                <div className="gb-section-title">Visuals</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div className={upload.hasError('bg_image_url') ? 'gb-img-error' : ''} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <span className="gb-label" style={{ marginBottom:8, display:'block', textAlign:'center' }}>Game Background Image</span>
                    <input type="file" ref={bgImgRef} accept="image/png,image/jpeg,image/jpg"
                      onChange={e => { const f=e.target.files[0]; upload.clearFieldError('bg_image_url'); if(f){const r=new FileReader(); r.onload=ev=>setSettings({...settings,bg_image_url:ev.target.result,_bgFile:f}); r.readAsDataURL(f)} }}
                      style={{ display:'none' }} />
                    <button className="gb-btn gb-btn-ghost gb-btn-sm" type="button" onClick={() => bgImgRef.current.click()} style={{ border:'none', background:'transparent', padding:'6px 12px' }}>📷 Upload</button>
                    {settings.bg_image_url && <div style={{ position:'relative', display:'inline-block', marginTop:10 }}>
                      <img src={settings.bg_image_url} alt="" style={{ height:72, width:'auto', maxWidth:160, borderRadius:8, border:'1px solid var(--gb-border)', objectFit:'contain', background:'#f9f9f9' }} />
                      <button
                        style={{ position:'absolute', top:-8, right:-8, borderRadius:'50%', width:24, height:24, padding:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, lineHeight:1, background:'var(--gb-danger)', color:'#fff', border:'2px solid #fff', cursor:'pointer', boxShadow:'0 2px 6px rgba(0,0,0,0.2)' }}
                        type="button" onClick={() => setSettings({...settings,bg_image_url:'',_bgFile:null})}>✕</button>
                    </div>}
                  </div>
                  <div className={upload.hasError('game_logo_url') ? 'gb-img-error' : ''} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <span className="gb-label" style={{ marginBottom:8, display:'block', textAlign:'center' }}>Game Logo</span>
                    <input type="file" ref={gameLogoRef} accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                      onChange={e => { const f=e.target.files[0]; upload.clearFieldError('game_logo_url'); if(f){const r=new FileReader(); r.onload=ev=>setSettings({...settings,game_logo_url:ev.target.result,_logoFile:f}); r.readAsDataURL(f)} }}
                      style={{ display:'none' }} />
                    <button className="gb-btn gb-btn-ghost gb-btn-sm" type="button" onClick={() => gameLogoRef.current.click()} style={{ border:'none', background:'transparent', padding:'6px 12px' }}>📷 Upload</button>
                    {settings.game_logo_url && <div style={{ position:'relative', display:'inline-block', marginTop:10 }}>
                      <img src={settings.game_logo_url} alt="" style={{ height:72, width:'auto', maxWidth:160, borderRadius:8, border:'1px solid var(--gb-border)', objectFit:'contain', background:'#fff' }} />
                      <button
                        style={{ position:'absolute', top:-8, right:-8, borderRadius:'50%', width:24, height:24, padding:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, lineHeight:1, background:'var(--gb-danger)', color:'#fff', border:'2px solid #fff', cursor:'pointer', boxShadow:'0 2px 6px rgba(0,0,0,0.2)' }}
                        type="button" onClick={() => setSettings({...settings,game_logo_url:'',_logoFile:null})}>✕</button>
                    </div>}
                  </div>
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
                <div className="gb-section-title">Game Texts</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'8px 16px', alignItems:'end' }}>
                  <div className="gb-fg" style={{ marginBottom:0 }}>
                    <span className="gb-label">Heading 1 (title)</span>
                    <input value={settings.heading_1||''} onChange={e => setSettings({...settings,heading_1:e.target.value})} placeholder="Main title" />
                  </div>
                  <ColorPicker value={settings.heading_1_color||'#1a1a2e'} onChange={v => setSettings({...settings,heading_1_color:v})} noPresets />
                  <div className="gb-fg" style={{ marginBottom:0 }}>
                    <span className="gb-label">Heading 2 (subtitle)</span>
                    <input value={settings.heading_2||''} onChange={e => setSettings({...settings,heading_2:e.target.value})} placeholder="Sub-heading" />
                  </div>
                  <ColorPicker value={settings.heading_2_color||'#666666'} onChange={v => setSettings({...settings,heading_2_color:v})} noPresets />
                  <div className="gb-fg" style={{ marginBottom:0 }}>
                    <span className="gb-label">Intro Text</span>
                    <textarea rows={2} value={settings.intro_text||''} onChange={e => setSettings({...settings,intro_text:e.target.value})} style={{ resize:'vertical' }} />
                  </div>
                  <ColorPicker value={settings.intro_text_color||'#444444'} onChange={v => setSettings({...settings,intro_text_color:v})} noPresets />
                </div>
              </div>

              <p style={{ color:'var(--gb-text2)', marginBottom:16, fontSize:13 }}>These fields appear on the player registration screen before the game starts.</p>
              {formFields.map((f,i) => (
                <div key={i} className="gb-card" style={{ marginBottom:10, padding:'12px 16px' }}>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
                    <div className="gb-fg" style={{ flex:2, minWidth:130 }}>
                      <span className="gb-label">Label</span>
                      <input value={f.field_label} onChange={e => updateFormField(i,'field_label',e.target.value)} />
                    </div>
                    <div className="gb-fg" style={{ flex:1, minWidth:110 }}>
                      <span className="gb-label">Type</span>
                      <select value={f.field_type} onChange={e => updateFormField(i,'field_type',e.target.value)}>
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="number">Number</option>
                        <option value="textarea">Textarea</option>
                        <option value="select">Dropdown</option>
                      </select>
                    </div>
                    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer', paddingBottom:2, whiteSpace:'nowrap' }}>
                      <input type="checkbox" checked={!!f.is_required} onChange={e => updateFormField(i,'is_required',e.target.checked?1:0)}
                        style={{ width:16,height:16 }} />
                      Required
                    </label>
                    <button className="gb-btn gb-btn-danger gb-btn-sm" onClick={() => removeFormField(i)}>✕</button>
                  </div>
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'center' }}>
                <button className="gb-btn gb-btn-ghost" onClick={addFormField}>+ Add Field</button>
                <button className="gb-btn gb-btn-primary" onClick={saveFormFields} disabled={saving}>{saving ? 'Saving…' : '💾 Save Form'}</button>
              </div>

              <div className="gb-card" style={{ marginBottom:20, padding:16 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                  <div>
                    <div className="gb-section-title">Terms &amp; Conditions</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                      <input type="checkbox" id="termsEnabled" checked={!!settings.terms_enabled}
                        onChange={e => setSettings({...settings,terms_enabled:e.target.checked?1:0})} style={{ width:16,height:16 }} />
                      <label htmlFor="termsEnabled" style={{ fontWeight:600, cursor:'pointer', fontSize:13 }}>Require acceptance</label>
                    </div>
                    <div className="gb-fg" style={{ marginBottom:10 }}>
                      <span className="gb-label">Label Text</span>
                      <input value={settings.terms_text||''} onChange={e => setSettings({...settings,terms_text:e.target.value})} placeholder="Terms &amp; Conditions" />
                    </div>
                    <div className="gb-fg" style={{ marginBottom:0 }}>
                      <span className="gb-label">URL (optional)</span>
                      <input value={settings.terms_url||''} onChange={e => setSettings({...settings,terms_url:e.target.value})} placeholder="https://yoursite.com/terms" />
                    </div>
                  </div>
                  <div>
                    <div className="gb-section-title">Start Button</div>
                    <div className="gb-fg" style={{ marginBottom:10 }}>
                      <input value={settings.start_button_text||''} onChange={e => setSettings({...settings,start_button_text:e.target.value})} placeholder="Start Game →" />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <ColorPicker value={settings.start_button_text_color||'#ffffff'} onChange={v => setSettings({...settings,start_button_text_color:v})} noPresets label="Text Color" />
                      <ColorPicker value={settings.start_button_bg_color||''} onChange={v => setSettings({...settings,start_button_bg_color:v})} noPresets label="Background Color" />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px', marginTop:16 }}>
                  {saving ? '⏳ Saving…' : '💾 Save Settings'}
                </button>
              </div>
            </div>
          )}

          {/* ════ GAMEPLAY TAB ════ */}
          {tab === 'gameplay' && (
            <div>
              <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
                <div className="gb-section-title">Game Settings</div>
                <div className="gb-row">
                  <div className="gb-fg">
                    <span className="gb-label">Spawn Rate (ms)</span>
                    <input type="number" min={200} max={5000} step={100} value={settings.spawn_rate??1000}
                      onChange={e => setSettings({...settings, spawn_rate: parseInt(e.target.value)||1000 })} />
                  </div>
                  <div className="gb-fg">
                    <span className="gb-label">Fall Speed</span>
                    <input type="number" min={1} max={10} value={settings.fall_speed??2}
                      onChange={e => setSettings({...settings, fall_speed: parseInt(e.target.value)||2 })} />
                  </div>
                </div>
                <div className="gb-row" style={{ marginTop:12 }}>
                  <div className="gb-fg">
                    <span className="gb-label">Max Misses</span>
                    <input type="number" min={1} max={20} value={settings.max_misses??5}
                      onChange={e => setSettings({...settings, max_misses: parseInt(e.target.value)||5 })} />
                  </div>
                  <div className="gb-fg">
                    <span className="gb-label">Time Limit (seconds)</span>
                    <input type="number" min={10} max={300} value={settings.time_limit_seconds??60}
                      onChange={e => setSettings({...settings, time_limit_seconds: parseInt(e.target.value)||60 })} />
                  </div>
                </div>
                <div className="gb-fg" style={{ marginTop:12 }}>
                  <span className="gb-label">Item Type</span>
                  <select value={settings.item_type||'emoji'} onChange={e => setSettings({...settings, item_type:e.target.value})}>
                    <option value="emoji">Emoji</option>
                    <option value="image">Image</option>
                  </select>
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
                <div className="gb-section-title">Basket</div>
                <ColorPicker value={settings.basket_color||'#8B5CF6'} onChange={v => setSettings({...settings, basket_color:v})} label="Basket Color" />
              </div>

              <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
                <div className="gb-section-title">Timer</div>
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer', marginBottom:12 }}>
                  <input type="checkbox" checked={!!settings.show_timer} onChange={e => setSettings({...settings, show_timer:e.target.checked?1:0})} style={{ width:16,height:16 }} />
                  Show timer
                </label>
              </div>

              <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
                <div className="gb-section-title">Headings</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'8px 16px', alignItems:'end' }}>
                  <div className="gb-fg" style={{ marginBottom:0 }}>
                    <span className="gb-label">Heading 1 (title)</span>
                    <input value={settings.heading_1||''} onChange={e => setSettings({...settings, heading_1:e.target.value})} placeholder="Catch Game" />
                  </div>
                  <ColorPicker value={settings.heading_1_color||'#1a1a2e'} onChange={v => setSettings({...settings, heading_1_color:v})} noPresets />
                  <div className="gb-fg" style={{ marginBottom:0 }}>
                    <span className="gb-label">Heading 2 (subtitle)</span>
                    <input value={settings.heading_2||''} onChange={e => setSettings({...settings, heading_2:e.target.value})} placeholder="Catch the falling items!" />
                  </div>
                  <ColorPicker value={settings.heading_2_color||'#666666'} onChange={v => setSettings({...settings, heading_2_color:v})} noPresets />
                  <div className="gb-fg" style={{ marginBottom:0 }}>
                    <span className="gb-label">Heading 3</span>
                    <input value={settings.heading_3||''} onChange={e => setSettings({...settings, heading_3:e.target.value})} placeholder="Additional info" />
                  </div>
                  <ColorPicker value={settings.heading_3_color||'#888888'} onChange={v => setSettings({...settings, heading_3_color:v})} noPresets />
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
                <div className="gb-section-title">Description</div>
                <div className="gb-fg">
                  <span className="gb-label">Description Text</span>
                  <textarea rows={2} value={settings.description_text||''} onChange={e => setSettings({...settings, description_text:e.target.value})} placeholder="Describe your game" style={{ resize:'vertical' }} />
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
                <div className="gb-section-title">Game Sounds</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <SoundSelector label="Catch Item" value={settings.sound_catch_id} onChange={v => setSettings({...settings, sound_catch_id:v})} sounds={sounds} />
                  <SoundSelector label="Miss Item" value={settings.sound_miss_id} onChange={v => setSettings({...settings, sound_miss_id:v})} sounds={sounds} />
                  <SoundSelector label="Game Over" value={settings.sound_gameover_id} onChange={v => setSettings({...settings, sound_gameover_id:v})} sounds={sounds} />
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px' }}>
                  {saving ? '⏳ Saving…' : '💾 Save Gameplay Settings'}
                </button>
              </div>
            </div>
          )}

          {/* ════ THANKYOU TAB ════ */}
          {tab === 'thankyou' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <div className="gb-card" style={{ padding:16, margin:0 }}>
                  <div className="gb-section-title">Thankyou Page Background</div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <input type="file" ref={tyBgImgRef} accept="image/png,image/jpeg,image/jpg"
                      onChange={e => { const f=e.target.files[0]; upload.clearFieldError('thankyou_bg_image_url'); if(f){const r=new FileReader(); r.onload=ev=>setSettings({...settings,thankyou_bg_image_url:ev.target.result,_tyBgFile:f}); r.readAsDataURL(f)} }}
                      style={{ display:'none' }} />
                    <button className="gb-btn gb-btn-ghost gb-btn-sm" type="button" onClick={() => tyBgImgRef.current.click()} style={{ border:'none', background:'transparent', padding:'6px 12px' }}>📷 Upload</button>
                    {settings.thankyou_bg_image_url && <div style={{ position:'relative', display:'inline-block', marginTop:10 }}>
                      <img src={settings.thankyou_bg_image_url} alt="" style={{ height:80, width:'auto', maxWidth:200, borderRadius:8, border:'1px solid var(--gb-border)', objectFit:'contain', background:'#f9f9f9' }} />
                      <button
                        style={{ position:'absolute', top:-8, right:-8, borderRadius:'50%', width:24, height:24, padding:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, lineHeight:1, background:'var(--gb-danger)', color:'#fff', border:'2px solid #fff', cursor:'pointer', boxShadow:'0 2px 6px rgba(0,0,0,0.2)' }}
                        type="button" onClick={() => setSettings({...settings,thankyou_bg_image_url:'',_tyBgFile:null})}>✕</button>
                    </div>}
                  </div>
                </div>
                <div className="gb-card" style={{ padding:16, margin:0 }}>
                  <div className="gb-section-title">Thankyou Message</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'8px 12px', alignItems:'end' }}>
                    <div className="gb-fg" style={{ marginBottom:0 }}>
                      <span className="gb-label">Heading Text</span>
                      <textarea rows={2} value={settings.outro_text||''} onChange={e => setSettings({...settings,outro_text:e.target.value})} style={{ resize:'vertical' }} placeholder="Yay! You completed the game!" />
                    </div>
                    <ColorPicker value={settings.outro_text_color||'#1a1a2e'} onChange={v => setSettings({...settings,outro_text_color:v})} noPresets />
                    <div className="gb-fg" style={{ marginBottom:0 }}>
                      <span className="gb-label">Subtitle Text</span>
                      <textarea rows={2} value={settings.thankyou_subtitle||''} onChange={e => setSettings({...settings,thankyou_subtitle:e.target.value})} style={{ resize:'vertical' }} placeholder="Thank you for playing!" />
                    </div>
                    <ColorPicker value={settings.thankyou_subtitle_color||'#444444'} onChange={v => setSettings({...settings,thankyou_subtitle_color:v})} noPresets />
                  </div>
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
                <div className="gb-section-title">Submit Button</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'8px 16px', alignItems:'end' }}>
                  <div className="gb-fg" style={{ marginBottom:0 }}>
                    <input value={settings.submit_button_text||''} onChange={e => setSettings({...settings,submit_button_text:e.target.value})} placeholder="Submit & Explore" />
                  </div>
                  <ColorPicker value={settings.submit_button_text_color||'#ffffff'} onChange={v => setSettings({...settings,submit_button_text_color:v})} noPresets label="Text" />
                  <ColorPicker value={settings.submit_button_bg_color||''} onChange={v => setSettings({...settings,submit_button_bg_color:v})} noPresets label="Background" />
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <div className="gb-card" style={{ padding:16, margin:0 }}>
                  <div className="gb-section-title">Submit Confirmation GIF</div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <input type="file" id="submitGifInput" accept="image/gif,image/png,image/jpeg,image/webp"
                      onChange={e => { const f=e.target.files[0]; upload.clearFieldError('submit_confirm_gif_url'); if(f){const r=new FileReader(); r.onload=ev=>setSettings({...settings,submit_confirm_gif_url:ev.target.result,_gifFile:f}); r.readAsDataURL(f)} }}
                      style={{ display:'none' }} />
                    <button className="gb-btn gb-btn-ghost gb-btn-sm" type="button" onClick={() => document.getElementById('submitGifInput').click()} style={{ border:'none', background:'transparent', padding:'6px 12px' }}>🎬 Upload GIF / Image</button>
                    {settings.submit_confirm_gif_url && <div style={{ position:'relative', display:'inline-block', marginTop:10 }}>
                      <img src={settings.submit_confirm_gif_url} alt="" style={{ height:80, width:'auto', maxWidth:200, borderRadius:8, border:'1px solid var(--gb-border)', objectFit:'contain', background:'#f9f9f9' }} />
                      <button
                        style={{ position:'absolute', top:-8, right:-8, borderRadius:'50%', width:24, height:24, padding:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, lineHeight:1, background:'var(--gb-danger)', color:'#fff', border:'2px solid #fff', cursor:'pointer', boxShadow:'0 2px 6px rgba(0,0,0,0.2)' }}
                        type="button" onClick={() => setSettings({...settings,submit_confirm_gif_url:'',_gifFile:null})}>✕</button>
                    </div>}
                  </div>
                </div>
                <div className="gb-card" style={{ padding:16, margin:0 }}>
                  <div className="gb-section-title">Post-Game Redirect URL</div>
                  <p style={{ color:'var(--gb-text2)', fontSize:12, marginBottom:12 }}>
                    Where should players be sent after completing? Leave blank to show default.
                  </p>
                  <div className="gb-fg" style={{ marginBottom:0 }}>
                    <input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} placeholder="https://yourwebsite.com/thankyou" type="url" />
                  </div>
                  {redirectUrl && (
                    <div style={{ marginTop:10, marginBottom:16, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#15803d', wordBreak:'break-all' }}>
                      ✅ {redirectUrl}
                    </div>
                  )}
                  <div style={{ borderTop:'1px solid var(--gb-border)', paddingTop:16 }}>
                    <div className="gb-section-title">Continue Now Button</div>
                    <div className="gb-fg" style={{ marginBottom:10, marginTop:8 }}>
                      <input value={settings.continue_button_text||''} onChange={e => setSettings({...settings,continue_button_text:e.target.value})} placeholder="Continue Now →" />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <ColorPicker value={settings.continue_button_text_color||'#ffffff'} onChange={v => setSettings({...settings,continue_button_text_color:v})} noPresets label="Text Color" />
                      <ColorPicker value={settings.continue_button_bg_color||''} onChange={v => setSettings({...settings,continue_button_bg_color:v})} noPresets label="Background Color" />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px' }}>
                  {saving ? '⏳ Saving…' : '💾 Save Thankyou Settings'}
                </button>
              </div>
            </div>
          )}

          {/* ════ EMAIL TAB ════ */}
          {tab === 'email' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <p style={{ color:'var(--gb-text2)', fontSize:13 }}>Configure the congratulations email sent to players.</p>
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
                  <input type="checkbox" checked={!!emailTemplate.is_enabled}
                    onChange={e => setEmailTemplate({ ...emailTemplate, is_enabled:e.target.checked?1:0 })}
                    style={{ width:16,height:16 }} />
                  Enable email
                </label>
              </div>
              <div className="gb-section" style={{ marginBottom:16, background:'#fffbeb', borderColor:'#fde68a' }}>
                💡 Use <code>{'{{name}}'}</code>, <code>{'{{score}}'}</code>, <code>{'{{total}}'}</code>, <code>{'{{game_name}}'}</code> as placeholders.
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <div className="gb-fg"><span className="gb-label">Sender Name</span><input value={emailTemplate.sender_name||''} onChange={e => setEmailTemplate({ ...emailTemplate, sender_name:e.target.value })} placeholder="Screw & Reveal Platform" /></div>
                <div className="gb-fg"><span className="gb-label">Sender Email</span><input value={emailTemplate.sender_email||''} onChange={e => setEmailTemplate({ ...emailTemplate, sender_email:e.target.value })} placeholder="noreply@yourdomain.com" /></div>
              </div>
              <div className="gb-fg" style={{ marginBottom:14 }}><span className="gb-label">Subject</span><input value={emailTemplate.subject||''} onChange={e => setEmailTemplate({ ...emailTemplate, subject:e.target.value })} placeholder="Congratulations {{name}}!" /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'flex-end', marginBottom:14 }}>
                <div className="gb-fg"><span className="gb-label">Header Text</span><input value={emailTemplate.header_text||''} onChange={e => setEmailTemplate({ ...emailTemplate, header_text:e.target.value })} placeholder="Congratulations!" /></div>
                <ColorPicker value={emailTemplate.header_color||'#6366f1'} onChange={v => setEmailTemplate({ ...emailTemplate, header_color:v })} label="Header Color" />
              </div>
              <div className="gb-fg" style={{ marginBottom:14 }}><span className="gb-label">Email Body (HTML)</span><textarea rows={5} value={emailTemplate.body_html||''} onChange={e => setEmailTemplate({ ...emailTemplate, body_html:e.target.value })} placeholder="<p>Thank you, {{name}}!</p>" style={{ resize:'vertical', fontFamily:'monospace', fontSize:13 }} /></div>
              <div className="gb-fg" style={{ marginBottom:20 }}><span className="gb-label">Footer Text</span><input value={emailTemplate.footer_text||''} onChange={e => setEmailTemplate({ ...emailTemplate, footer_text:e.target.value })} placeholder="© 2024 Your Company" /></div>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button className="gb-btn gb-btn-primary" onClick={saveEmailTemplate} disabled={saving}>{saving ? 'Saving…' : '💾 Save Email Template'}</button>
              </div>
            </div>
          )}

          {/* ════ SOUNDS TAB ════ */}
          {tab === 'sounds' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <div>
                  <h3 style={{ color:'var(--gb-text)', fontFamily:'inherit', marginBottom:4 }}>Sound Library</h3>
                  <p style={{ color:'var(--gb-text2)', fontSize:13 }}>Upload MP3, WAV or OGG files, then assign them below.</p>
                </div>
                <div>
                  <input type="file" ref={soundUploadRef} accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/x-wav,audio/wave" onChange={uploadSound} style={{ display:'none' }} />
                  <button className="gb-btn gb-btn-primary" onClick={() => soundUploadRef.current.click()} disabled={soundUploading}>
                    {soundUploading ? '⏳ Uploading…' : '+ Upload Sound'}
                  </button>
                </div>
              </div>

              <div className="gb-card" style={{ marginBottom:20, padding:16 }}>
                <div className="gb-section-title">Assign Sounds to Game</div>
                <p style={{ color:'var(--gb-text2)', fontSize:12, marginBottom:14 }}>
                  These play globally across the entire game. Upload sounds above first, then select them here.
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:16 }}>
                  <SoundSelector label="Catch Item" value={settings.sound_catch_id} onChange={v => setSettings({...settings,sound_catch_id:v})} sounds={sounds} />
                  <SoundSelector label="Miss Item" value={settings.sound_miss_id} onChange={v => setSettings({...settings,sound_miss_id:v})} sounds={sounds} />
                  <SoundSelector label="Game Over" value={settings.sound_gameover_id} onChange={v => setSettings({...settings,sound_gameover_id:v})} sounds={sounds} />
                </div>
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <button className="gb-btn gb-btn-primary gb-btn-sm" onClick={saveSettings} disabled={saving}>
                    {saving ? 'Saving…' : '💾 Save Sound Assignments'}
                  </button>
                </div>
              </div>

              {sounds.length === 0
                ? (
                  <div className="gb-empty">
                    <div className="gb-empty-icon">🔊</div>
                    <h3 style={{ color:'var(--gb-text)', marginBottom:8 }}>No sounds yet</h3>
                    <p>Upload MP3, WAV, or OGG files</p>
                    <button className="gb-btn gb-btn-primary" style={{ marginTop:16 }} onClick={() => soundUploadRef.current.click()}>+ Upload Sound</button>
                  </div>
                )
                : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {sounds.map(s => (
                      <div key={s.id} className="gb-card" style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px' }}>
                        <span style={{ fontSize:20 }}>🎵</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:14, color:'var(--gb-text)' }}>{s.name}</div>
                          <div style={{ color:'var(--gb-text3)', fontSize:11, marginTop:2 }}>ID: {s.id} · {s.sound_type}</div>
                        </div>
                        <audio controls src={s.url} style={{ height:32 }} />
                        <button className="gb-btn gb-btn-danger gb-btn-sm gb-btn-icon" onClick={() => deleteSound(s)}>🗑</button>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}

          {/* ════ SETTINGS TAB ════ */}
          {tab === 'settings' && (
            <div>
              <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                  <div>
                    <div className="gb-section-title">Game URL Slug</div>
                    <p style={{ color:'var(--gb-text2)', fontSize:12, marginBottom:8 }}>This determines the public URL: <code style={{ fontSize:11 }}>{window.location.origin}/play/{slugInput||'your-slug'}/{game?.client_slug||'...'}</code></p>
                    <div className="gb-fg" style={{ marginBottom:0 }}>
                      <input value={slugInput} onChange={e => setSlugInput(e.target.value)} placeholder="my-game-slug" />
                    </div>
                  </div>
                  <div>
                    <div className="gb-section-title">Colors</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <ColorPicker value={settings.bg_color||'#ffffff'} onChange={v => setSettings({...settings,bg_color:v})} label="Background Color" />
                      <ColorPicker value={settings.primary_color||'#6366f1'} onChange={v => setSettings({...settings,primary_color:v})} label="Primary / Accent Color" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
                <div className="gb-section-title">Font Family</div>
                <div style={{ display:'grid', gap:12 }}>
                  {FONT_CATEGORIES.map((cat, ci) => (
                    <div key={cat.name} style={ci < FONT_CATEGORIES.length - 1 ? {paddingBottom:12,borderBottom:'1px solid var(--gb-border)'} : {}}>
                      <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', color:'var(--gb-text3)', marginBottom:6 }}>{cat.name}</div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                        {cat.fonts.map(font => (
                          <div key={font} onClick={() => setSettings({...settings,font_family:font})}
                            style={{ padding:'6px 8px', borderRadius:6, cursor:'pointer', fontSize:12,
                              border:`1.5px solid ${settings.font_family===font||(!settings.font_family&&font==='DM Sans') ? 'var(--gb-primary)' : 'var(--gb-border)'}`,
                              background: settings.font_family===font||(!settings.font_family&&font==='DM Sans') ? '#eef0ff' : '#fff',
                              transition:'all .12s', fontFamily: "'" + font + "', sans-serif" }}>
                            <div style={{ fontWeight:700, lineHeight:1.3 }}>{font}</div>
                            <div style={{ color:'#888', fontWeight:400, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>The quick brown fox</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
                <div className="gb-section-title">Social Share Preview</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
                  <div>
                    <p style={{ color:'var(--gb-text2)', fontSize:12, marginBottom:10 }}>Text shown when the game link is shared on WhatsApp, Facebook etc.</p>
                    <div className="gb-fg" style={{ marginBottom:0 }}>
                      <span className="gb-label">Share Description</span>
                      <input value={settings.meta_description||''} onChange={e => setSettings({...settings,meta_description:e.target.value})} placeholder="Play this game and win exciting rewards!" maxLength={200} />
                      <span style={{ fontSize:11, color:'var(--gb-text3)', marginTop:2 }}>{(settings.meta_description||'').length}/200</span>
                    </div>
                  </div>
                  <div style={{ border:'1px solid var(--gb-border)', borderRadius:10, overflow:'hidden', background:'#fff', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{ height:120, background: settings.bg_image_url ? `center/cover url(${settings.bg_image_url})` : (settings.primary_color||'#6366f1'), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:32, fontWeight:800 }}></div>
                    <div style={{ padding:'12px 14px' }}>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', color:'#888', marginBottom:3 }}>{window.location.hostname || 'yourdomain.com'}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#1a1a2e', marginBottom:4, lineHeight:1.3 }}>{game?.name || 'Untitled'}</div>
                      <div style={{ fontSize:12, color:'#555', lineHeight:1.4 }}>{settings.meta_description || 'Play this game and win exciting rewards!'}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px' }}>
                  {saving ? '⏳ Saving…' : '💾 Save All Settings'}
                </button>
              </div>
            </div>
          )}

        </div>{/* ─ end left col ─ */}

        {/* ─── RIGHT COL — Phone Mockup ─── */}
        <PhoneFrame settings={settings}>

          {/* ── Form preview ── */}
          {tab === 'form' && <FormPreview settings={settings} formFields={formFields} />}

          {/* ── Gameplay preview ── */}
          {tab === 'gameplay' && (() => {
            const hasBg = settings.bg_image_url
            return (
            <div style={{
              flex:1, display:'flex', flexDirection:'column',
              background: hasBg ? `url(${settings.bg_image_url}) center/cover` : (settings.bg_color||'#f8f8ff'),
              padding:'10px 8px',
              overflow:'auto',
              fontFamily: settings.font_family ? `'${settings.font_family}', sans-serif` : "'DM Sans', sans-serif",
            }}>
              <div style={{
                width:'100%', margin:'0 auto',
                background: hasBg ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.93)',
                backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
                borderRadius:18, padding:'14px 12px', boxSizing:'border-box',
                boxShadow: hasBg ? '0 8px 40px rgba(0,0,0,0.28)' : '0 8px 40px rgba(0,0,0,0.12)',
                border: hasBg ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(0,0,0,0.06)',
                position:'relative', overflow:'hidden', minHeight:260,
              }}>
                <h1 style={{ fontSize:15, fontWeight:800, textAlign:'center', marginBottom:6, color: settings.heading_1_color||'#1a1a2e', lineHeight:1.2 }}>{settings.heading_1 || 'Catch Game'}</h1>
                {settings.heading_2 && <div style={{ fontSize:11, fontWeight:600, textAlign:'center', marginBottom:8, color: settings.heading_2_color||'#666', lineHeight:1.3 }}>{settings.heading_2}</div>}
                <div style={{ position:'relative', height:120, marginBottom:10 }}>
                  {['🍎','🍊','🍋','🍇'].map((e,i) => (
                    <span key={i} style={{ position:'absolute', left:`${15+i*20}%`, top:`${10+i*20}%`, fontSize:20, opacity:0.8 }}>{e}</span>
                  ))}
                  <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)',
                    width:60, height:24, background: settings.basket_color||'#8B5CF6',
                    borderRadius:'0 0 8px 8px', boxShadow:'0 2px 8px rgba(0,0,0,0.2)' }} />
                </div>
                <div style={{
                  width:'100%', textAlign:'center',
                  background: settings.start_button_bg_color || `linear-gradient(135deg, ${settings.primary_color||'#8B5CF6'}, ${(settings.primary_color||'#8B5CF6')}cc)`,
                  color: settings.start_button_text_color||'#fff', border:'none', borderRadius:10, padding:'10px', fontSize:13, fontWeight:700,
                  boxShadow: settings.start_button_bg_color ? '0 4px 16px rgba(0,0,0,0.12)' : `0 4px 16px ${(settings.primary_color||'#8B5CF6')}33`,
                  cursor:'pointer',
                }}>
                  {settings.start_button_text || 'Start Game →'}
                </div>
              </div>
            </div>
          )})()}

          {/* ── Thankyou preview ── */}
          {tab === 'thankyou' && <ThankYouPreview settings={settings} />}

          {/* ── Email preview ── */}
          {tab === 'email' && (() => {
            const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { margin:0; padding:0; background:#f4f4f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    .wrap { max-width:600px; margin:0 auto; background:#fff; }
    .header { background:${emailTemplate.header_color||'#6366f1'}; padding:24px 20px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:20px; font-weight:700; }
    .body { padding:24px 20px; color:#333; font-size:14px; line-height:1.6; }
    .footer { padding:16px 20px; text-align:center; font-size:11px; color:#999; border-top:1px solid #eee; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header"><h1>${emailTemplate.header_text||'Congratulations!'}</h1></div>
    <div class="body">${emailTemplate.body_html||'<p>Thank you for completing the game!</p>'}</div>
    <div class="footer">${emailTemplate.footer_text||''}</div>
  </div>
</body>
</html>`.trim()
            return (
            <iframe
              title="Email Preview"
              srcDoc={html}
              style={{ flex:1, width:'100%', border:'none', background:'#f4f4f6' }}
              sandbox="allow-same-origin"
            />
          )})()}

          {/* ── Settings / Sounds preview ── */}
          {(tab === 'settings' || tab === 'sounds') && (() => {
            const hasBg = settings.bg_image_url
            return (
            <div style={{
              flex:1, display:'flex', flexDirection:'column',
              background: hasBg ? `url(${settings.bg_image_url}) center/cover` : (settings.bg_color||'#f4f4ff'),
              padding:'clamp(16px,4vw,20px) 12px',
              overflow:'auto',
              fontFamily: settings.font_family ? `'${settings.font_family}', sans-serif` : "'DM Sans', sans-serif",
            }}>
              <div style={{
                width:'100%', maxWidth:280, margin:'auto',
                background: hasBg ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.93)',
                backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
                borderRadius:22, padding:'20px 16px', boxSizing:'border-box',
                boxShadow: hasBg ? '0 8px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.4)' : '0 8px 40px rgba(0,0,0,0.12)',
                border: hasBg ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.85)',
              }}>
                {settings.game_logo_url && (
                  <div style={{ textAlign:'center', marginBottom:14 }}>
                    <img src={settings.game_logo_url} alt="" style={{ maxWidth:'100%', maxHeight:80, objectFit:'contain', borderRadius:8 }} />
                  </div>
                )}
                <h1 style={{ fontSize:16, fontWeight:800, textAlign:'center', marginBottom:2, color: settings.heading_1_color||'#1a1a2e', lineHeight:1.2, textShadow: hasBg ? '0 2px 8px rgba(0,0,0,0.3)' : 'none' }}>{settings.heading_1 || 'Untitled'}</h1>
                {settings.heading_2 && <div style={{ fontSize:13, fontWeight:600, textAlign:'center', marginBottom:4, color: settings.heading_2_color||'#666666', lineHeight:1.3 }}>{settings.heading_2}</div>}
                {settings.intro_text && (
                  <div style={{
                    background: hasBg ? 'rgba(255,255,255,0.15)' : '#f0f0ff',
                    border:`1.5px solid ${hasBg ? 'rgba(255,255,255,0.3)' : '#6366f130'}`,
                    borderRadius:10, padding:'8px 12px', margin:'10px 0 14px',
                    color: settings.intro_text_color||'#444', fontSize:12, textAlign:'center', lineHeight:1.5,
                  }}>{settings.intro_text}</div>
                )}
                {!!settings.terms_enabled && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12, fontSize:11, color: hasBg ? 'rgba(255,255,255,0.85)' : '#666' }}>
                    <span style={{ width:14, height:14, border:'1.5px solid currentColor', borderRadius:3, display:'inline-block', flexShrink:0 }} />
                    {settings.terms_text || 'Terms & Conditions'}
                  </div>
                )}
                <div style={{ marginTop:!!settings.terms_enabled && (settings.terms_text || settings.terms_url) ? 0 : 8 }}>
                  <div style={{
                    width:'100%', textAlign:'center',
                    background: settings.start_button_bg_color || `linear-gradient(135deg, ${settings.primary_color||'#6366f1'}, ${(settings.primary_color||'#6366f1')}cc)`,
                    color: settings.start_button_text_color||'#fff', border:'none', borderRadius:10, padding:'12px', fontSize:14, fontWeight:700,
                    boxShadow: settings.start_button_bg_color ? '0 6px 20px rgba(0,0,0,0.15)' : `0 6px 20px ${(settings.primary_color||'#6366f1')}44`,
                    cursor:'pointer',
                  }}>
                    {settings.start_button_text || 'Start Game →'}
                  </div>
                </div>
              </div>
            </div>
          )})()}
        </PhoneFrame>{/* ─ end right col ─ */}

      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
