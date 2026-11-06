import { useEffect, useRef } from 'react'
import api from '../../apps/frontend/src/api'
import { postPromoCoinReward } from '../../apps/frontend/src/lib/promocoins'

const MAZE_CSS = `
:root{
  --sky-1:#5AC0F2; --sky-2:#8AD9FB; --sky-3:#C7EEFF;
  --cream:#FFFDF6;
  --ink:#2B3A50; --ink-soft:#6B8199;
  --green-lt:#96E86A; --green:#5FC72E; --green-dk:#3D9420;
  --blue-lt:#6FCBFF;  --blue:#2E9EF2;  --blue-dk:#1B77C4;
  --purple-lt:#D3AEFF; --purple:#A466F2; --purple-dk:#7C3FD1;
  --orange-lt:#FFC169; --orange:#FF9F2E; --orange-dk:#E07E12;
  --pink-lt:#FF9FBB;  --pink:#FF6690;  --pink-dk:#E23F6B;
  --gold-lt:#FFE79A;  --gold:#FFC736;  --gold-dk:#E29B0A;
  --gray-lt:#EDF2F6;  --gray:#CBD6DF;  --gray-dk:#9FB0BE;
}
.maze-root{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:radial-gradient(circle at 12% 15%,rgba(255,255,255,0.4),transparent 38%),radial-gradient(circle at 88% 12%,rgba(255,255,255,0.3),transparent 34%),radial-gradient(circle at 90% 80%,rgba(255,255,255,0.22),transparent 40%),radial-gradient(circle at 8% 85%,rgba(255,255,255,0.25),transparent 40%),linear-gradient(180deg,var(--sky-1) 0%,var(--sky-2) 55%,var(--sky-3) 100%);font-family:'Nunito',system-ui,sans-serif;color:var(--ink);-webkit-user-select:none;user-select:none;}
.maze-app{position:relative;width:100vw;height:100vh;height:100dvh;overflow:hidden;}
.maze-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;}
#hud-top{position:absolute;top:0;left:0;right:0;display:flex;justify-content:center;padding:14px 14px 0;z-index:20;pointer-events:none;}
#hud-bar{pointer-events:auto;display:flex;align-items:center;gap:8px;max-width:640px;width:100%;flex-wrap:nowrap;}
.stat-pill{flex:1;display:flex;align-items:center;gap:7px;background:var(--cream);border-radius:999px;padding:5px 12px 5px 5px;box-shadow:0 3px 0 rgba(43,58,80,0.12),0 6px 10px rgba(43,58,80,0.16);min-width:0;}
.stat-icon{flex-shrink:0;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 -3px 0 rgba(0,0,0,0.16),0 1px 0 rgba(255,255,255,0.4);}
.stat-icon svg{width:15px;height:15px;}
.stat-text{display:flex;flex-direction:column;line-height:1.05;min-width:0;}
.stat-num{font-family:'Baloo 2',sans-serif;font-weight:700;font-size:15px;color:var(--ink);white-space:nowrap;}
.stat-lbl{font-size:8.5px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink-soft);}
#mute-btn{pointer-events:auto;flex-shrink:0;width:38px;height:38px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:var(--cream);color:var(--ink-soft);box-shadow:0 3px 0 rgba(43,58,80,0.12),0 6px 10px rgba(43,58,80,0.16);}
#mute-btn:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(43,58,80,0.12);}
#mute-btn svg{width:17px;height:17px;}
#hud-bottom{position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:center;padding:0 14px 20px;z-index:20;}
#bottom-bar{display:flex;gap:16px;align-items:flex-end;}
.action-btn{display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:none;cursor:pointer;padding:0;color:var(--ink);}
.action-btn .knob{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid rgba(255,255,255,0.55);transition:transform .1s ease,box-shadow .1s ease;}
.action-btn svg{width:24px;height:24px;}
.action-btn span.label{font-family:'Baloo 2',sans-serif;font-size:10.5px;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,0.15);}
.action-btn:active .knob{transform:translateY(4px);}
#btn-hint .knob{background:linear-gradient(180deg,var(--gold-lt),var(--gold));box-shadow:0 5px 0 var(--gold-dk),0 8px 12px rgba(43,58,80,.25);}
#btn-hint:active .knob{box-shadow:0 1px 0 var(--gold-dk);}
#btn-restart .knob{background:linear-gradient(180deg,var(--blue-lt),var(--blue));box-shadow:0 5px 0 var(--blue-dk),0 8px 12px rgba(43,58,80,.25);}
#btn-restart:active .knob{box-shadow:0 1px 0 var(--blue-dk);}
#btn-pause .knob{background:linear-gradient(180deg,var(--purple-lt),var(--purple));box-shadow:0 5px 0 var(--purple-dk),0 8px 12px rgba(43,58,80,.25);}
#btn-pause:active .knob{box-shadow:0 1px 0 var(--purple-dk);}
#btn-menu .knob{background:linear-gradient(180deg,var(--orange-lt),var(--orange));box-shadow:0 5px 0 var(--orange-dk),0 8px 12px rgba(43,58,80,.25);}
#btn-menu:active .knob{box-shadow:0 1px 0 var(--orange-dk);}
.action-btn .knob svg{color:#fff;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.2));}
.guide-box{background:#fff;border:3px solid var(--gray-lt);border-radius:18px;padding:14px 12px 12px;margin-bottom:20px;box-shadow:0 4px 0 rgba(43,58,80,0.08);}
.guide-grid{display:grid;grid-template-columns:repeat(3,42px);grid-template-rows:repeat(3,42px);gap:6px;justify-content:center;margin:2px 0 10px;}
.g-arrow{border-radius:14px;background:linear-gradient(180deg,#fff,var(--gray-lt));border:3px solid rgba(255,255,255,0.85);box-shadow:0 3px 0 rgba(43,58,80,0.12);color:var(--blue-dk);display:flex;align-items:center;justify-content:center;}
.g-arrow svg{width:19px;height:19px;}
.g-mote-wrap{display:flex;align-items:center;justify-content:center;}
.g-mote{width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffffff,#BFE9FF 55%,#2E9EF2);box-shadow:0 0 0 5px rgba(111,203,255,0.18),0 0 14px rgba(46,158,242,0.55);animation:gPulse 1.6s ease-in-out infinite;}
@keyframes gPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
.guide-text{font-size:11.5px;font-weight:700;color:var(--ink-soft);text-align:center;line-height:1.5;margin:0;}
.overlay{position:absolute;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(30,60,90,0.45);opacity:0;pointer-events:none;transition:opacity .3s ease;}
.overlay.visible{opacity:1;pointer-events:auto;}
.game-card{max-width:400px;width:calc(100% - 48px);transform:translateY(16px) scale(0.97);opacity:0;transition:transform .4s cubic-bezier(.2,.9,.25,1),opacity .35s ease;}
.overlay.visible .game-card{transform:translateY(0) scale(1);opacity:1;}
.ribbon-wrap{display:flex;justify-content:center;margin-bottom:-2px;position:relative;z-index:2;}
.ribbon{position:relative;font-family:'Baloo 2',sans-serif;font-weight:700;font-size:19px;color:#fff;letter-spacing:0.01em;padding:11px 34px;border-radius:12px 12px 4px 4px;background:linear-gradient(180deg,var(--purple-lt),var(--purple));border:3px solid rgba(255,255,255,0.4);box-shadow:0 5px 0 var(--purple-dk),0 8px 14px rgba(43,58,80,.3);text-shadow:0 2px 2px rgba(0,0,0,0.18);text-align:center;}
.ribbon::before,.ribbon::after{content:'';position:absolute;top:2px;width:0;height:0;border-style:solid;}
.ribbon::before{left:-13px;border-width:15px 13px 15px 0;border-color:transparent var(--purple-dk) transparent transparent;}
.ribbon::after{right:-13px;border-width:15px 0 15px 13px;border-color:transparent transparent transparent var(--purple-dk);}
.card-body{background:var(--cream);border-radius:22px;padding:30px 26px 26px;border:3px solid #fff;box-shadow:0 8px 0 rgba(43,58,80,0.12),0 16px 30px rgba(20,45,70,0.35);position:relative;z-index:1;}
.subtitle{color:var(--ink-soft);font-size:13.5px;margin:2px 0 20px;line-height:1.55;font-weight:700;text-align:center;}
.subtitle b{color:var(--ink);}
.section-label{font-family:'Baloo 2',sans-serif;font-size:12.5px;font-weight:700;color:var(--ink-soft);margin-bottom:9px;text-align:center;text-transform:uppercase;letter-spacing:0.03em;}
.stat-row{display:flex;justify-content:space-around;gap:12px;margin-bottom:24px;}
.stat-col{display:flex;flex-direction:column;align-items:center;}
.stat-col .n{font-family:'Baloo 2',sans-serif;font-weight:700;font-size:22px;color:var(--blue-dk);}
.stat-col .l{font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft);margin-top:2px;}
.cta{display:flex;align-items:center;gap:9px;justify-content:center;width:100%;padding:15px 20px;border-radius:999px;cursor:pointer;font-family:'Baloo 2',sans-serif;font-weight:700;font-size:16px;letter-spacing:0.01em;color:#fff;border:3px solid rgba(255,255,255,0.55);background:linear-gradient(180deg,var(--green-lt),var(--green));box-shadow:0 6px 0 var(--green-dk),0 10px 16px rgba(43,58,80,.3);text-shadow:0 2px 2px rgba(0,0,0,0.15);transition:transform .08s ease,box-shadow .08s ease;}
.cta:active{transform:translateY(4px);box-shadow:0 2px 0 var(--green-dk);}
.cta svg{width:20px;height:20px;}
.cta.ghost{background:linear-gradient(180deg,#fff,var(--gray-lt));color:var(--ink-soft);box-shadow:0 5px 0 var(--gray),0 8px 12px rgba(43,58,80,.18);margin-top:10px;font-size:14px;}
.cta.ghost:active{box-shadow:0 1px 0 var(--gray);}
.diff-grid{display:flex;flex-direction:column;gap:10px;margin-bottom:22px;}
.diff-card{display:flex;align-items:center;gap:13px;padding:11px 14px;border-radius:16px;background:#fff;border:3px solid var(--gray-lt);cursor:pointer;text-align:left;width:100%;box-shadow:0 4px 0 rgba(43,58,80,0.08);transition:border-color .15s ease,transform .08s ease,box-shadow .15s ease;}
.diff-card:active{transform:translateY(2px);}
.diff-card.selected{border-color:var(--blue);box-shadow:0 4px 0 var(--blue-lt),inset 0 0 0 1px var(--blue-lt);background:#F2FAFF;}
.diff-orb{flex-shrink:0;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 -4px 0 rgba(0,0,0,0.15),0 3px 6px rgba(43,58,80,0.2);position:relative;}
.diff-orb svg{width:20px;height:20px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.2));}
.diff-info{flex:1;min-width:0;}
.diff-name-row{display:flex;align-items:center;gap:8px;}
.diff-name{font-family:'Baloo 2',sans-serif;font-weight:700;font-size:15px;color:var(--ink);}
.diff-stars{display:flex;gap:1px;}
.diff-stars svg{width:11px;height:11px;}
.diff-desc{font-size:11px;color:var(--ink-soft);margin-top:2px;line-height:1.35;font-weight:700;}
.diff-check{flex-shrink:0;width:22px;height:22px;border-radius:50%;background:var(--gray-lt);display:flex;align-items:center;justify-content:center;}
.diff-check svg{width:12px;height:12px;opacity:0;transition:opacity .15s ease;}
.diff-card.selected .diff-check{background:var(--blue);}
.diff-card.selected .diff-check svg{opacity:1;}
.toast{position:absolute;left:50%;top:78px;transform:translateX(-50%) translateY(-6px);padding:9px 18px;border-radius:999px;font-size:13px;font-weight:800;font-family:'Baloo 2',sans-serif;color:#fff;background:linear-gradient(180deg,var(--gold-lt),var(--gold));border:3px solid rgba(255,255,255,0.55);box-shadow:0 4px 0 var(--gold-dk),0 8px 14px rgba(43,58,80,.28);text-shadow:0 1px 2px rgba(0,0,0,0.15);opacity:0;transition:all .3s ease;z-index:30;pointer-events:none;white-space:nowrap;}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
.flying-crystal{position:absolute;width:13px;height:13px;z-index:40;pointer-events:none;background:radial-gradient(circle at 35% 30%,#fff,var(--gold));border-radius:3px;transform:rotate(45deg);box-shadow:0 0 12px rgba(255,199,54,0.9);}
@media (max-width:640px){
  .stat-lbl{display:none;}
  .stat-pill{padding:5px 10px 5px 5px;gap:5px;}
  .stat-icon{width:24px;height:24px;}
  .stat-icon svg{width:13px;height:13px;}
  .stat-num{font-size:13px;}
  #mute-btn{width:32px;height:32px;}
  #mute-btn svg{width:14px;height:14px;}
  #hud-top{padding:10px 10px 0;}
  #hud-bar{gap:5px;}
  #hud-bottom{padding:0 10px 14px;}
  #bottom-bar{gap:10px;}
  .action-btn .knob{width:46px;height:46px;}
  .action-btn svg{width:20px;height:20px;}
  .action-btn span.label{font-size:9px;}
  .guide-grid{grid-template-columns:repeat(3,34px);grid-template-rows:repeat(3,34px);gap:4px;}
  .g-arrow{width:34px;height:34px;border-radius:11px;}
  .g-arrow svg{width:16px;height:16px;}
  .g-mote{width:18px;height:18px;}
  .guide-box{padding:10px 8px 8px;margin-bottom:14px;border-radius:15px;}
  .overlay{padding:10px;}
  .game-card{width:calc(100% - 24px);max-width:360px;}
  .ribbon{font-size:16px;padding:9px 24px;}
  .ribbon::before{left:-11px;border-width:13px 11px 13px 0;}
  .ribbon::after{right:-11px;border-width:13px 0 13px 11px;}
  .card-body{padding:22px 18px 20px;border-radius:18px;}
  .subtitle{font-size:12px;margin:2px 0 14px;}
  .section-label{font-size:11px;}
  .diff-card{padding:9px 11px;gap:10px;}
  .diff-orb{width:36px;height:36px;}
  .diff-orb svg{width:17px;height:17px;}
  .diff-name{font-size:13px;}
  .diff-desc{font-size:10px;}
  .diff-check{width:20px;height:20px;}
  .cta{padding:12px 16px;font-size:14px;}
  .cta.ghost{font-size:12px;padding:10px 16px;}
  .toast{font-size:11px;padding:7px 14px;top:60px;}
  .stat-row{gap:8px;margin-bottom:18px;}
  .stat-col .n{font-size:18px;}
  .stat-col .l{font-size:8px;}
}
@media (max-width:380px){
  #hud-bar{flex-wrap:nowrap;}
  .stat-pill{min-width:0;padding:4px 8px 4px 4px;}
  .stat-num{font-size:12px;}
  .action-btn .knob{width:42px;height:42px;}
  .action-btn svg{width:18px;height:18px;}
}
`

const StarSvg = () => <svg viewBox="0 0 24 24" fill="var(--gold)"><path d="M12 2 2 9l10 13L22 9z"/></svg>
const StarGraySvg = () => <svg viewBox="0 0 24 24" fill="var(--gray)"><path d="M12 2 2 9l10 13L22 9z"/></svg>
const CheckSvg = () => <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>

/* ---------------- backend API helpers ---------------- */

async function fetchStickMazeProgress(gameId, sessionToken) {
  try {
    const res = await api.get(`/stickmaze/${gameId}/progress`, { params: { session_token: sessionToken } })
    return res.data.progress || null
  } catch { return null }
}

async function saveStickMazeProgress(gameId, payload) {
  try {
    const res = await api.post(`/stickmaze/${gameId}/progress`, payload)
    // Backend-confirmed per-level PromoCoins award → surface to the shell wallet.
    if (res.data?.pc_reward) postPromoCoinReward(res.data.pc_reward)
    return res.data
  } catch { return null }
}

async function completeStickMazeSession(sessionToken) {
  try {
    const res = await api.post('/play/session/complete', { session_token: sessionToken })
    return res.data
  } catch { return { redirect_url: null } }
}

export default function MazePlayerPage({ gameData, sessionToken, onComplete }) {
  const appRef = useRef(null)
  const canvasRef = useRef(null)
  const overlayStartRef = useRef(null)
  const overlayPauseRef = useRef(null)
  const overlayCompleteRef = useRef(null)
  const toastRef = useRef(null)
  const statLevelRef = useRef(null)
  const statMovesRef = useRef(null)
  const statTimeRef = useRef(null)
  const statCrystalsRef = useRef(null)
  const muteIconOnRef = useRef(null)
  const muteIconOffRef = useRef(null)
  const doneMovesRef = useRef(null)
  const doneTimeRef = useRef(null)
  const doneCrystalsRef = useRef(null)
  const diffGridRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const gameId = gameData?.id
  const settings = gameData?.settings || {}
  const totalLevels = Math.max(1, parseInt(settings.total_levels) || 50)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext('2d')
    let savedLevel = 1

    const CELL = 64
    const DIRS = {
      N:{dx:0,dy:-1,opp:'S',ang:-Math.PI/2},
      S:{dx:0,dy:1,opp:'N',ang:Math.PI/2},
      E:{dx:1,dy:0,opp:'W',ang:0},
      W:{dx:-1,dy:0,opp:'E',ang:Math.PI}
    }
    const DIR_KEYS = ['N','S','E','W']
    const DIFFICULTIES = {
      easy:{label:'Calm',sizeBase:4,sizeStep:0.6,sizeMin:5,sizeMax:9,loopBase:0.11,loopStep:0.006,loopMin:0.11,loopMax:0.22,shardDiv:22},
      normal:{label:'Drift',sizeBase:5,sizeStep:1.0,sizeMin:6,sizeMax:13,loopBase:0.05,loopStep:0.010,loopMin:0.05,loopMax:0.16,shardDiv:26},
      hard:{label:'Surge',sizeBase:7,sizeStep:1.3,sizeMin:8,sizeMax:17,loopBase:0.02,loopStep:0.006,loopMin:0.02,loopMax:0.09,shardDiv:20}
    }

    function lerp(a,b,t){return a+(b-a)*t}
    function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
    function easeInOutCubic(t){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}

    const Audio_=function(){
      let ctx=null,master=null,ambientNodes=null,muted=false
      function ensure(){if(ctx)return;ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=0.75;master.connect(ctx.destination)}
      function now(){return ctx.currentTime}
      function envGain(startVal,atk,dec,sus,holdTime,rel){const g=ctx.createGain();const t=now();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(startVal,0.0001),t+atk);g.gain.exponentialRampToValueAtTime(Math.max(startVal*sus,0.0001),t+atk+dec);g.gain.setValueAtTime(Math.max(startVal*sus,0.0001),t+atk+dec+holdTime);g.gain.exponentialRampToValueAtTime(0.0001,t+atk+dec+holdTime+rel);return g}
      function whoosh(distanceCells){if(muted)return;ensure();const dur=clamp(0.12+distanceCells*0.035,0.13,0.34);const osc=ctx.createOscillator();osc.type='triangle';osc.frequency.setValueAtTime(320,now());osc.frequency.exponentialRampToValueAtTime(720,now()+dur*0.85);const filt=ctx.createBiquadFilter();filt.type='lowpass';filt.Q.value=0.5;filt.frequency.setValueAtTime(2200,now());const g=ctx.createGain();const t=now();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.16,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);osc.connect(filt);filt.connect(g);g.connect(master);osc.start();osc.stop(now()+dur+0.05)}
      function stopSpark(){}
      function bump(){if(muted)return;ensure();const osc=ctx.createOscillator();osc.type='sine';osc.frequency.setValueAtTime(220,now());osc.frequency.exponentialRampToValueAtTime(140,now()+0.09);const g=envGain(0.1,0.004,0.05,0.2,0,0.07);osc.connect(g);g.connect(master);osc.start();osc.stop(now()+0.13)}
      function collect(){if(muted)return;ensure();[784,988,1175,1568].forEach((f,i)=>{const osc=ctx.createOscillator();osc.type='triangle';const osc2=ctx.createOscillator();osc2.type='square';osc2.frequency.value=f*2;const t0=now()+i*0.055;osc.frequency.value=f;const g=ctx.createGain();g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(0.17,t0+0.012);g.gain.exponentialRampToValueAtTime(0.0001,t0+0.26);const g2=ctx.createGain();g2.gain.setValueAtTime(0.0001,t0);g2.gain.exponentialRampToValueAtTime(0.035,t0+0.012);g2.gain.exponentialRampToValueAtTime(0.0001,t0+0.18);osc.connect(g);g.connect(master);osc2.connect(g2);g2.connect(master);osc.start(t0);osc.stop(t0+0.3);osc2.start(t0);osc2.stop(t0+0.22)})}
      function portal(){if(muted)return;ensure();[523.25,659.25,784,1046.5].forEach((f,i)=>{const osc=ctx.createOscillator();osc.type='triangle';osc.frequency.value=f;const t0=now()+i*0.09;const g=ctx.createGain();g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(0.18,t0+0.015);g.gain.exponentialRampToValueAtTime(0.0001,t0+0.22);osc.connect(g);g.connect(master);osc.start(t0);osc.stop(t0+0.26)});const t0=now()+0.38;[1046.5,1318.5,1568].forEach(f=>{const osc=ctx.createOscillator();osc.type='sine';osc.frequency.value=f;const g=ctx.createGain();g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(0.12,t0+0.03);g.gain.exponentialRampToValueAtTime(0.0001,t0+0.7);osc.connect(g);g.connect(master);osc.start(t0);osc.stop(t0+0.75)})}
      function click(){if(muted)return;ensure();const osc=ctx.createOscillator();osc.type='triangle';osc.frequency.value=660;const g=envGain(0.09,0.002,0.03,0.15,0,0.06);osc.connect(g);g.connect(master);osc.start();osc.stop(now()+0.1)}
      function startAmbient(){if(muted||ambientNodes)return;ensure()
        /* Fun upbeat chiptune loop: bouncy C-major melody over I-vi-IV-V bass. */
        const BPM=138,STEP=60/BPM/2
        const melody=[659.25,783.99,1046.5,783.99,880,783.99,659.25,523.25, 587.33,698.46,880,698.46,783.99,659.25,523.25,0, 659.25,783.99,1046.5,783.99,880,1046.5,1318.5,1046.5, 987.77,880,783.99,659.25,587.33,659.25,523.25,0]
        const bass=[130.81,0,164.81,0,130.81,0,164.81,0, 130.81,0,164.81,0,174.61,0,196,0, 130.81,0,164.81,0,220,0,196,0, 98,0,130.81,0,146.83,0,196,0]
        let nextTime=ctx.currentTime+0.1,stepIdx=0
        function playNote(freq,t,type,vol,dur){const osc=ctx.createOscillator(),g=ctx.createGain();osc.type=type;osc.frequency.value=freq;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.015);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);osc.connect(g);g.connect(master);osc.start(t);osc.stop(t+dur+0.05)}
        function schedule(){if(!ambientNodes)return
          while(nextTime<ctx.currentTime+0.4){const m=melody[stepIdx%melody.length],b=bass[stepIdx%bass.length]
            if(m)playNote(m,nextTime,'square',0.028,STEP*0.9)
            if(b)playNote(b,nextTime,'triangle',0.05,STEP*1.6)
            nextTime+=STEP;stepIdx++}
          ambientNodes.timer=setTimeout(schedule,150)}
        ambientNodes={timer:null}
        schedule()}
      function stopAmbient(){if(!ambientNodes)return;clearTimeout(ambientNodes.timer);ambientNodes=null}
      function setMuted(m){muted=m;if(muted)stopAmbient();else startAmbient();if(master)master.gain.value=muted?0:0.75}
      return{whoosh,stopSpark,bump,collect,portal,click,startAmbient,stopAmbient,setMuted,get muted(){return muted}}
    }()

    function makeGrid(cols,rows){const grid=[];for(let r=0;r<rows;r++){const row=[];for(let c=0;c<cols;c++){row.push({c,r,N:false,S:false,E:false,W:false,visited:false,type:'dead',exit:false,collectible:false,collected:false})}grid.push(row)}return grid}
    function inBounds(grid,c,r){return r>=0&&r<grid.length&&c>=0&&c<grid[0].length}
    function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
    function classify(grid){for(const row of grid)for(const cell of row){const opens=DIR_KEYS.filter(k=>cell[k]);const deg=opens.length;if(deg<=1){cell.type='dead'}else if(deg===2){const[a,b]=opens;cell.type=(DIRS[a].opp===b)?'straight':'turn'}else{cell.type='junction'}}}
    function bfsDistances(grid,start){const rows=grid.length,cols=grid[0].length;const dists=grid.map(row=>row.map(()=>-1));dists[start.r][start.c]=0;const q=[start];let qi=0;while(qi<q.length){const cur=q[qi++];for(const k of DIR_KEYS){if(!cur[k])continue;const d=DIRS[k];const nr=cur.r+d.dy,nc=cur.c+d.dx;if(dists[nr][nc]===-1){dists[nr][nc]=dists[cur.r][cur.c]+1;q.push(grid[nr][nc])}}}return dists}

    function generateMaze(cols,rows,loopFactor,shardDiv){
      const grid=makeGrid(cols,rows);const start=grid[0][0];start.visited=true;const stack=[start]
      while(stack.length){const cur=stack[stack.length-1];const options=[];for(const k of DIR_KEYS){const d=DIRS[k];const nc=cur.c+d.dx,nr=cur.r+d.dy;if(inBounds(grid,nc,nr)&&!grid[nr][nc].visited)options.push(k)}if(options.length===0){stack.pop();continue}const k=options[(Math.random()*options.length)|0];const d=DIRS[k];const next=grid[cur.r+d.dy][cur.c+d.dx];cur[k]=true;next[d.opp]=true;next.visited=true;stack.push(next)}
      const attempts=Math.floor(cols*rows*loopFactor);for(let i=0;i<attempts;i++){const c=(Math.random()*cols)|0,r=(Math.random()*rows)|0;const cell=grid[r][c];const k=DIR_KEYS[(Math.random()*4)|0];const d=DIRS[k];const nc=c+d.dx,nr=r+d.dy;if(!inBounds(grid,nc,nr))continue;if(cell[k])continue;const neighbor=grid[nr][nc];cell[k]=true;neighbor[d.opp]=true}
      classify(grid);const dists=bfsDistances(grid,start);let best=start,bestD=-1;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const dd=dists[r][c];if(dd>bestD){bestD=dd;best=grid[r][c]}}
      best.exit=true;const candidates=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const cell=grid[r][c];if(cell===start||cell.exit)continue;if(cell.type==='dead'||cell.type==='turn')candidates.push(cell)}
      shuffle(candidates);const wantShards=clamp(3+Math.floor(cols*rows/shardDiv),3,9);for(let i=0;i<Math.min(wantShards,candidates.length);i++){candidates[i].collectible=true}
      return{grid,start,exit:best,cols,rows}
    }

    function cellCenter(cell){return{x:cell.c*CELL+CELL/2,y:cell.r*CELL+CELL/2}}
    function levelSize(levelIndex){const cfg=DIFFICULTIES[Game.difficulty];const n=clamp(cfg.sizeBase+levelIndex*cfg.sizeStep,cfg.sizeMin,cfg.sizeMax)|0;return{cols:n,rows:clamp(n-(levelIndex%2),cfg.sizeMin-1,cfg.sizeMax-1)}}
    function simulateSlide(maze,cell,dirKey){if(!cell[dirKey])return null;const path=[cell];let cur=cell;while(true){const d=DIRS[dirKey];const next=maze.grid[cur.r+d.dy][cur.c+d.dx];path.push(next);cur=next;if(cur.exit)break;if(cur.collectible&&!cur.collected)break;if(cur.type!=='straight')break;if(!cur[dirKey])break}return path}
    function findHintPath(maze,fromCell){const key=c=>c.r+'_'+c.c;const visited=new Set([key(fromCell)]);const queue=[{cell:fromCell,path:[]}];let qi=0;while(qi<queue.length){const{cell,path}=queue[qi++];if(cell.exit)return path;for(const k of DIR_KEYS){const result=simulateSlide(maze,cell,k);if(!result)continue;const stopCell=result[result.length-1];const kk=key(stopCell);if(visited.has(kk))continue;visited.add(kk);queue.push({cell:stopCell,path:path.concat([{dir:k,cells:result}])})}}return null}

    const Game={levelIndex:1,difficulty:'normal',maze:null,playerCell:null,playerPos:{x:0,y:0},animating:false,moves:0,crystalsCollected:0,crystalsTotal:0,startTime:0,elapsed:0,paused:false,running:false,trail:[],particles:[],camera:{x:0,y:0,zoom:1},shake:0,hintGlow:null,squash:0,bumpDir:null,bumpT:0}

    let DPR=Math.min(window.devicePixelRatio||1,2)

    function resizeCanvas(){DPR=Math.min(window.devicePixelRatio||1,2);const rect=canvas.getBoundingClientRect();canvas.width=Math.round(rect.width*DPR);canvas.height=Math.round(rect.height*DPR)}
    function spawnBurst(x,y,count,palette,speedMin,speedMax,life){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2;const sp=lerp(speedMin,speedMax,Math.random());Game.particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:life*(0.7+Math.random()*0.6),maxLife:life,size:1.5+Math.random()*2.5,color:palette[(Math.random()*palette.length)|0]})}}
    function updateParticles(dt){for(let i=Game.particles.length-1;i>=0;i--){const p=Game.particles[i];p.life-=dt;if(p.life<=0){Game.particles.splice(i,1);continue}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.94;p.vy*=0.94}}
    function drawParticles(){for(const p of Game.particles){const t=clamp(p.life/p.maxLife,0,1);ctx2d.globalAlpha=t;ctx2d.fillStyle=p.color;ctx2d.beginPath();ctx2d.arc(p.x,p.y,p.size*t,0,Math.PI*2);ctx2d.fill()}ctx2d.globalAlpha=1}
    function drawCorridor(p0,p1){ctx2d.beginPath();ctx2d.moveTo(p0.x,p0.y);ctx2d.lineTo(p1.x,p1.y);ctx2d.strokeStyle='rgba(20,60,100,0.12)';ctx2d.lineWidth=15;ctx2d.stroke();ctx2d.beginPath();ctx2d.moveTo(p0.x,p0.y);ctx2d.lineTo(p1.x,p1.y);ctx2d.strokeStyle='rgba(255,255,255,0.92)';ctx2d.lineWidth=8;ctx2d.stroke();ctx2d.beginPath();ctx2d.moveTo(p0.x,p0.y);ctx2d.lineTo(p1.x,p1.y);ctx2d.strokeStyle='rgba(111,203,255,0.55)';ctx2d.lineWidth=3;ctx2d.stroke()}
    function drawNode(p,r,color){ctx2d.beginPath();ctx2d.arc(p.x,p.y,r,0,Math.PI*2);ctx2d.fillStyle=color;ctx2d.fill();ctx2d.beginPath();ctx2d.arc(p.x,p.y,r,0,Math.PI*2);ctx2d.strokeStyle='rgba(255,255,255,0.8)';ctx2d.lineWidth=1.5;ctx2d.stroke()}
    function drawCrystal(p,cell){const t=performance.now()/1000;const bob=Math.sin(t*2+cell.c*0.7+cell.r*1.3)*3;const rot=t*1.2;ctx2d.save();ctx2d.translate(p.x,p.y+bob);ctx2d.rotate(rot);const glow=ctx2d.createRadialGradient(0,0,0,0,0,22);glow.addColorStop(0,'rgba(255,199,54,0.55)');glow.addColorStop(1,'rgba(255,199,54,0)');ctx2d.fillStyle=glow;ctx2d.beginPath();ctx2d.arc(0,0,22,0,Math.PI*2);ctx2d.fill();ctx2d.beginPath();ctx2d.moveTo(0,-9);ctx2d.lineTo(6,0);ctx2d.lineTo(0,9);ctx2d.lineTo(-6,0);ctx2d.closePath();ctx2d.fillStyle='#FFE79A';ctx2d.fill();ctx2d.strokeStyle='#FFC736';ctx2d.lineWidth=2;ctx2d.stroke();ctx2d.restore()}
    function drawExit(p){const t=performance.now()/1000;ctx2d.save();ctx2d.translate(p.x,p.y);for(let i=0;i<2;i++){const rr=16+i*8+Math.sin(t*1.5+i)*3;ctx2d.beginPath();ctx2d.arc(0,0,rr,0,Math.PI*2);ctx2d.strokeStyle=i===0?'rgba(255,199,54,0.7)':'rgba(255,102,144,0.4)';ctx2d.lineWidth=3;ctx2d.stroke()}const glow=ctx2d.createRadialGradient(0,0,0,0,0,30);glow.addColorStop(0,'rgba(255,199,54,0.45)');glow.addColorStop(1,'rgba(255,199,54,0)');ctx2d.fillStyle=glow;ctx2d.beginPath();ctx2d.arc(0,0,30,0,Math.PI*2);ctx2d.fill();ctx2d.rotate(t*0.8);ctx2d.beginPath();ctx2d.arc(0,0,9,0,Math.PI*1.5);ctx2d.strokeStyle='#fff';ctx2d.lineWidth=3;ctx2d.stroke();ctx2d.restore()}
    function drawTrail(){if(Game.trail.length<2)return;ctx2d.save();ctx2d.lineCap='round';ctx2d.lineJoin='round';for(let i=1;i<Game.trail.length;i++){const a=Game.trail[i-1],b=Game.trail[i];const t=i/Game.trail.length;ctx2d.beginPath();ctx2d.moveTo(a.x,a.y);ctx2d.lineTo(b.x,b.y);ctx2d.strokeStyle=`rgba(111,203,255,${0.5*t})`;ctx2d.lineWidth=9*t;ctx2d.stroke()}ctx2d.restore()}
    function drawHintGlow(){if(!Game.hintGlow)return;const g=Game.hintGlow;const t=(performance.now()-g.start)/g.dur;if(t>1){Game.hintGlow=null;return}const alpha=Math.sin(Math.min(t,1)*Math.PI);ctx2d.save();ctx2d.beginPath();ctx2d.moveTo(g.points[0].x,g.points[0].y);for(let i=1;i<g.points.length;i++)ctx2d.lineTo(g.points[i].x,g.points[i].y);ctx2d.strokeStyle=`rgba(255,102,144,${0.75*alpha})`;ctx2d.lineWidth=6;ctx2d.setLineDash([10,10]);ctx2d.lineDashOffset=-performance.now()/20;ctx2d.shadowColor='rgba(255,102,144,0.8)';ctx2d.shadowBlur=14;ctx2d.stroke();ctx2d.restore()}
    function drawPlayer(){const p=Game.playerPos;const sq=Game.squash;const sx=1+(sq>0?sq*0.28*Math.sin(Math.min(1,sq)*Math.PI):0);const sy=1-(sq>0?sq*0.22*Math.sin(Math.min(1,sq)*Math.PI):0);ctx2d.save();ctx2d.translate(p.x,p.y);if(Game.bumpT>0&&Game.bumpDir){const d=DIRS[Game.bumpDir];const k=Math.sin(Game.bumpT*Math.PI)*4;ctx2d.translate(d.dx*k,d.dy*k)}ctx2d.scale(sx,sy);const outerGlow=ctx2d.createRadialGradient(0,0,0,0,0,26);outerGlow.addColorStop(0,'rgba(111,203,255,0.55)');outerGlow.addColorStop(1,'rgba(111,203,255,0)');ctx2d.fillStyle=outerGlow;ctx2d.beginPath();ctx2d.arc(0,0,26,0,Math.PI*2);ctx2d.fill();const bodyGrad=ctx2d.createRadialGradient(-3,-3,1,0,0,10);bodyGrad.addColorStop(0,'#ffffff');bodyGrad.addColorStop(0.55,'#BFE9FF');bodyGrad.addColorStop(1,'#2E9EF2');ctx2d.fillStyle=bodyGrad;ctx2d.beginPath();ctx2d.arc(0,0,9,0,Math.PI*2);ctx2d.fill();ctx2d.beginPath();ctx2d.fillStyle='rgba(255,255,255,0.9)';ctx2d.ellipse(-3,-3.5,2.1,1.3,-0.6,0,Math.PI*2);ctx2d.fill();ctx2d.restore()}
    function drawMaze(){const maze=Game.maze;if(!maze)return;const grid=maze.grid;ctx2d.lineCap='round';for(const row of grid){for(const cell of row){const p0=cellCenter(cell);for(const k of['E','S']){if(!cell[k])continue;const d=DIRS[k];const nb=grid[cell.r+d.dy][cell.c+d.dx];const p1=cellCenter(nb);drawCorridor(p0,p1)}}}for(const row of grid){for(const cell of row){const p=cellCenter(cell);if(cell.exit)drawExit(p);else if(cell.collectible&&!cell.collected)drawCrystal(p,cell);else if(cell.type==='junction')drawNode(p,7,'#A466F2');else if(cell.type==='turn')drawNode(p,5,'#6FCBFF');else if(cell.type==='dead')drawNode(p,4,'#FF9FBB')}}}

    function updateHUD(){
      if(statMovesRef.current)statMovesRef.current.textContent=Game.moves
      if(statCrystalsRef.current)statCrystalsRef.current.textContent=Game.crystalsCollected+'/'+Game.crystalsTotal
      const t=Game.paused?Game.elapsed:(performance.now()-Game.startTime)/1000
      const mm=String(Math.floor(t/60)).padStart(2,'0')
      const ss=String(Math.floor(t%60)).padStart(2,'0')
      if(statTimeRef.current)statTimeRef.current.textContent=mm+':'+ss
    }

    function initLevel(levelIndex,keepTime){
      const cfg=DIFFICULTIES[Game.difficulty];const{cols,rows}=levelSize(levelIndex)
      const loopFactor=clamp(cfg.loopBase+levelIndex*cfg.loopStep,cfg.loopMin,cfg.loopMax)
      let maze;let tries=0
      do{maze=generateMaze(cols,rows,loopFactor,cfg.shardDiv);tries++}while(tries<6&&bfsDistances(maze.grid,maze.start)[maze.exit.r][maze.exit.c]<Math.min(cols,rows))
      Game.maze=maze;Game.playerCell=maze.start;Game.playerPos=cellCenter(maze.start);Game.camera.x=Game.playerPos.x;Game.camera.y=Game.playerPos.y;Game.trail=[];Game.particles=[];Game.moves=0;Game.crystalsCollected=0;Game.crystalsTotal=0;Game.animating=false;Game.hintGlow=null
      for(const row of maze.grid)for(const cell of row)if(cell.collectible)Game.crystalsTotal++
      if(!keepTime){Game.startTime=performance.now();Game.elapsed=0}
      Game.levelIndex=levelIndex
      if(statLevelRef.current)statLevelRef.current.textContent=String(levelIndex).padStart(2,'0')
      updateHUD()
    }

    function worldToScreen(p){const rect=canvas.getBoundingClientRect();const cx=rect.width/2,cy=rect.height/2;return{x:rect.left+cx+(p.x-Game.camera.x)*Game.camera.zoom,y:rect.top+cy+(p.y-Game.camera.y)*Game.camera.zoom}}
    function flyCrystalToHUD(worldPos){const target=statCrystalsRef.current?.getBoundingClientRect();if(!target)return;const screenPos=worldToScreen(worldPos);const el=document.createElement('div');el.className='flying-crystal';el.style.left=screenPos.x+'px';el.style.top=screenPos.y+'px';appRef.current?.appendChild(el);const tx=target.left+target.width/2,ty=target.top+target.height/2;const anim=el.animate([{left:screenPos.x+'px',top:screenPos.y+'px',opacity:1,transform:'rotate(45deg) scale(1)'},{left:tx+'px',top:ty+'px',opacity:0.3,transform:'rotate(230deg) scale(0.3)'}],{duration:650,easing:'cubic-bezier(.3,.6,.4,1)'});anim.onfinish=()=>el.remove()}

    let toastTimer=null
    function showToast(msg){const el=toastRef.current;if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1600)}

    function showOverlay(id){[overlayStartRef,overlayPauseRef,overlayCompleteRef].forEach(r=>{if(r.current)r.current.classList.remove('visible')});const map={'overlay-start':overlayStartRef,'overlay-pause':overlayPauseRef,'overlay-complete':overlayCompleteRef};map[id]?.current?.classList.add('visible')}
    function hideOverlays(){[overlayStartRef,overlayPauseRef,overlayCompleteRef].forEach(r=>{if(r.current)r.current.classList.remove('visible')})}

    function onArrive(path,dirKey){
      Game.animating=false;Game.moves++;Game.squash=1;Game.shake=6
      const stopCell=path[path.length-1];Game.playerCell=stopCell;Audio_.stopSpark()
      spawnBurst(Game.playerPos.x,Game.playerPos.y,16,['#FFFFFF','#BFE9FF','#6FCBFF'],30,90,0.5)
      if(stopCell.collectible&&!stopCell.collected){stopCell.collected=true;Game.crystalsCollected++;spawnBurst(Game.playerPos.x,Game.playerPos.y,22,['#FFE79A','#FFC736','#fff'],40,140,0.7);Audio_.collect();flyCrystalToHUD(Game.playerPos);showToast('Gem collected \u2014 '+Game.crystalsCollected+'/'+Game.crystalsTotal)}
      updateHUD()
      if(stopCell.exit)levelComplete()
    }

    function animateAlongPath(path,dirKey){
      Game.animating=true;Game.hintGlow=null;const points=path.map(cellCenter);const totalCells=points.length-1;const totalDist=totalCells*CELL;const duration=clamp(90*totalCells+60,140,900);const startTime=performance.now();Audio_.whoosh(totalCells)
      function step(now){let t=clamp((now-startTime)/duration,0,1);const te=easeInOutCubic(t);const distAlong=te*totalDist;let segIdx=clamp(Math.floor(distAlong/CELL),0,totalCells-1);const segT=clamp((distAlong-segIdx*CELL)/CELL,0,1);const p0=points[segIdx],p1=points[segIdx+1]||points[segIdx];Game.playerPos={x:lerp(p0.x,p1.x,segT),y:lerp(p0.y,p1.y,segT)};Game.trail.push({x:Game.playerPos.x,y:Game.playerPos.y,life:1});if(Game.trail.length>40)Game.trail.shift();if(t<1){requestAnimationFrame(step)}else{Game.playerPos=points[points.length-1];onArrive(path,dirKey)}}
      requestAnimationFrame(step)
    }

    function tryMove(dirKey){
      if(Game.animating||Game.paused||!Game.running)return
      const path=simulateSlide(Game.maze,Game.playerCell,dirKey)
      if(!path||path.length<2){Game.bumpDir=dirKey;Game.bumpT=1;Game.shake=Math.max(Game.shake,3);Audio_.bump();return}
      animateAlongPath(path,dirKey)
    }

    function showHint(){if(Game.animating||!Game.running||Game.paused)return;const solution=findHintPath(Game.maze,Game.playerCell);if(!solution||solution.length===0)return;let allPoints=[];for(const hop of solution){allPoints=allPoints.concat(hop.cells.map(cellCenter))}Game.hintGlow={points:allPoints,t:0,dur:2200,start:performance.now()};Audio_.click()}

    function levelComplete(){
      Game.running=false;Audio_.portal()
      spawnBurst(Game.playerPos.x,Game.playerPos.y,46,['#FF6690','#6FCBFF','#A466F2','#FFC736','#fff'],60,180,1.1)
      saveLevelProgress()
      savedLevel=Math.min(Game.levelIndex+1,totalLevels)
      if(Game.levelIndex>=totalLevels){ finishSession(); return }
      setTimeout(()=>{if(doneMovesRef.current)doneMovesRef.current.textContent=Game.moves;const t=(performance.now()-Game.startTime)/1000;if(doneTimeRef.current)doneTimeRef.current.textContent=String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');if(doneCrystalsRef.current)doneCrystalsRef.current.textContent=Game.crystalsCollected+'/'+Game.crystalsTotal;showOverlay('overlay-complete')},550)
    }

    function timeSpentSecs(){
      return Game.paused ? Math.round(Game.elapsed) : Math.round((performance.now()-Game.startTime)/1000)
    }
    function saveLevelProgress(){
      if(!sessionToken || !gameId) return
      saveStickMazeProgress(gameId,{session_token:sessionToken,level:Game.levelIndex,completed:true,time_spent:timeSpentSecs(),collectibles_found:Game.crystalsCollected})
    }
    function finishSession(){
      Game.running=false
      const doIt=async()=>{
        if(sessionToken){
          const data=await completeStickMazeSession(sessionToken)
          onCompleteRef.current?.(data || { redirect_url: gameData?.redirect_url || null })
        }else{
          onCompleteRef.current?.({ redirect_url: gameData?.redirect_url || null })
        }
      }
      doIt()
    }
    async function restoreProgress(){
      if(!sessionToken || !gameId) return
      const p=await fetchStickMazeProgress(gameId, sessionToken)
      if(!p) return
      savedLevel=Math.min(Math.max(1,parseInt(p.current_level)||1),totalLevels)
    }
    function render(){
      const rect=canvas.getBoundingClientRect();ctx2d.setTransform(DPR,0,0,DPR,0,0);ctx2d.clearRect(0,0,rect.width,rect.height)
      const targetX=Game.playerPos.x,targetY=Game.playerPos.y;Game.camera.x=lerp(Game.camera.x,targetX,0.14);Game.camera.y=lerp(Game.camera.y,targetY,0.14)
      const targetZoom=Math.min(rect.width,rect.height)>700?1.15:0.95;Game.camera.zoom=lerp(Game.camera.zoom,targetZoom,0.05)
      let shakeX=0,shakeY=0;if(Game.shake>0.05){shakeX=(Math.random()-0.5)*Game.shake;shakeY=(Math.random()-0.5)*Game.shake;Game.shake*=0.82}else Game.shake=0
      ctx2d.save();ctx2d.translate(rect.width/2+shakeX,rect.height/2+shakeY);ctx2d.scale(Game.camera.zoom,Game.camera.zoom);ctx2d.translate(-Game.camera.x,-Game.camera.y)
      drawMaze();drawHintGlow();drawTrail();drawParticles();drawPlayer()
      ctx2d.restore()
    }

    let lastFrame=performance.now()
    function loop(now){const dt=Math.min((now-lastFrame)/1000,0.05);lastFrame=now;if(!Game.paused){updateParticles(dt);if(Game.squash>0){Game.squash-=dt*3.2;if(Game.squash<0)Game.squash=0}if(Game.bumpT>0){Game.bumpT-=dt*4;if(Game.bumpT<0)Game.bumpT=0}if(Game.running)updateHUD()}render();requestAnimationFrame(loop)}

    window.addEventListener('resize',resizeCanvas)
    resizeCanvas()
    requestAnimationFrame(loop)
    restoreProgress().then(()=>{ initLevel(savedLevel,false) })

    const KEYMAP={ArrowUp:'N',ArrowDown:'S',ArrowLeft:'W',ArrowRight:'E',w:'N',s:'S',a:'W',d:'E',W:'N',S:'S',A:'W',D:'E'}
    function onKeyDown(e){const k=KEYMAP[e.key];if(!k)return;e.preventDefault();tryMove(k)}
    window.addEventListener('keydown',onKeyDown)

    let touchStart=null
    function onTouchStart(e){const t=e.changedTouches[0];touchStart={x:t.clientX,y:t.clientY,time:performance.now()}}
    function onTouchEnd(e){if(!touchStart)return;const t=e.changedTouches[0];const dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;const adx=Math.abs(dx),ady=Math.abs(dy);if(Math.max(adx,ady)<24){touchStart=null;return}if(adx>ady)tryMove(dx>0?'E':'W');else tryMove(dy>0?'S':'N');touchStart=null}
    canvas.addEventListener('touchstart',onTouchStart,{passive:true})
    canvas.addEventListener('touchend',onTouchEnd,{passive:true})

    /* ---- Viewport lock: engaged ONLY while the game is running. ----
       Pinch-zoom / pull-to-refresh / scroll are blocked during play so
       swipes always register as moves. The host page's viewport stays
       untouched before the game starts (menu, guide, difficulty select). */
    let meta=null,originalContent=null,createdMeta=false
    function lockViewport(){
      if(meta)return
      meta=document.querySelector('meta[name="viewport"]')
      createdMeta=!meta
      originalContent=meta?meta.getAttribute('content'):null
      if(!meta){meta=document.createElement('meta');meta.name='viewport';document.head.appendChild(meta)}
      meta.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    }
    function unlockViewport(){
      if(!meta)return
      if(createdMeta){meta.remove()}
      else if(originalContent!==null){meta.setAttribute('content',originalContent)}
      meta=null;createdMeta=false;originalContent=null
    }
    function preventTouch(e){e.preventDefault()}
    let locked=false
    function setLocked(v){
      if(v===locked)return
      locked=v
      if(v){lockViewport();document.addEventListener('touchmove',preventTouch,{passive:false});document.addEventListener('gesturestart',preventTouch,{passive:false})}
      else{unlockViewport();document.removeEventListener('touchmove',preventTouch);document.removeEventListener('gesturestart',preventTouch)}
    }
    // Track lock state off the overlay visibility — 'overlay-start' visible == pre-game.
    const overlayStartEl=overlayStartRef.current
    let overlayObserver=null
    if(overlayStartEl&&typeof MutationObserver!=='undefined'){
      overlayObserver=new MutationObserver(()=>{
        const inMenu=overlayStartEl.classList.contains('visible')
        setLocked(!inMenu)
      })
      overlayObserver.observe(overlayStartEl,{attributes:true,attributeFilter:['class']})
      // Sync with the current state (page may load with the menu visible).
      setLocked(!overlayStartEl.classList.contains('visible'))
    }



    let selectedDiff='normal'
    function selectDifficulty(diff){selectedDiff=diff;Game.difficulty=diff;diffGridRef.current?.querySelectorAll('.diff-card').forEach(el=>{el.classList.toggle('selected',el.dataset.diff===diff)})}
    diffGridRef.current?.querySelectorAll('.diff-card').forEach(el=>{el.addEventListener('click',()=>{Audio_.click();selectDifficulty(el.dataset.diff)})})
    selectDifficulty('normal')

    const onBtnStart=()=>{Audio_.click();Audio_.startAmbient();hideOverlays();setLocked(true);Game.running=true;initLevel(savedLevel,false)}
    const onBtnHint=()=>showHint()
    const onBtnRestart=()=>{Audio_.click();initLevel(Game.levelIndex,false);Game.running=true}
    const onBtnRestart2=()=>{Audio_.click();hideOverlays();Game.paused=false;initLevel(Game.levelIndex,false);Game.running=true}
    const onBtnPause=()=>{Audio_.click();if(!Game.running)return;Game.paused=true;Game.elapsed=(performance.now()-Game.startTime)/1000;showOverlay('overlay-pause')}
    const onBtnResume=()=>{Audio_.click();Game.paused=false;Game.startTime=performance.now()-Game.elapsed*1000;hideOverlays()}
    const goToMenu=()=>{Audio_.click();Game.running=false;Game.paused=false;Audio_.stopAmbient();hideOverlays();showOverlay('overlay-start')}
    const onBtnNext=()=>{Audio_.click();hideOverlays();Game.running=true;initLevel(Game.levelIndex+1,false)}

    let isMuted=false
    const onMute=()=>{isMuted=!isMuted;Audio_.setMuted(isMuted);if(muteIconOnRef.current)muteIconOnRef.current.style.display=isMuted?'none':'block';if(muteIconOffRef.current)muteIconOffRef.current.style.display=isMuted?'block':'none'}

    const btnStart=document.getElementById('btn-start');if(btnStart)btnStart.addEventListener('click',onBtnStart)
    const btnHint=document.getElementById('btn-hint');if(btnHint)btnHint.addEventListener('click',onBtnHint)
    const btnRestart=document.getElementById('btn-restart');if(btnRestart)btnRestart.addEventListener('click',onBtnRestart)
    const btnRestart2=document.getElementById('btn-restart-2');if(btnRestart2)btnRestart2.addEventListener('click',onBtnRestart2)
    const btnPause=document.getElementById('btn-pause');if(btnPause)btnPause.addEventListener('click',onBtnPause)
    const btnResume=document.getElementById('btn-resume');if(btnResume)btnResume.addEventListener('click',onBtnResume)
    const btnMenu=document.getElementById('btn-menu');if(btnMenu)btnMenu.addEventListener('click',goToMenu)
    const btnMenu2=document.getElementById('btn-menu-2');if(btnMenu2)btnMenu2.addEventListener('click',goToMenu)
    const btnNext=document.getElementById('btn-next');if(btnNext)btnNext.addEventListener('click',onBtnNext)
    const muteBtn=document.getElementById('mute-btn');if(muteBtn)muteBtn.addEventListener('click',onMute)

    return () => {
      window.removeEventListener('resize',resizeCanvas)
      window.removeEventListener('keydown',onKeyDown)
      canvas.removeEventListener('touchstart',onTouchStart)
      canvas.removeEventListener('touchend',onTouchEnd)
      setLocked(false)
      if(overlayObserver)overlayObserver.disconnect()
    }
  }, [])

  return (
    <>
      <style>{MAZE_CSS}</style>
      <div className="maze-root">
        <div className="maze-app" ref={appRef}>
          <canvas ref={canvasRef} className="maze-canvas" />

          <div id="hud-top">
            <div id="hud-bar">
              <div className="stat-pill">
                <span className="stat-icon" style={{background:'linear-gradient(180deg,var(--purple-lt),var(--purple))'}}>
                  <svg viewBox="0 0 24 24" fill="#fff"><path d="M4 3v18h2v-7h11l-2-4 2-4H6V3z"/></svg>
                </span>
                <span className="stat-text"><span className="stat-num" ref={statLevelRef}>01</span><span className="stat-lbl">Level</span></span>
              </div>
              <div className="stat-pill">
                <span className="stat-icon" style={{background:'linear-gradient(180deg,var(--blue-lt),var(--blue))'}}>
                  <svg viewBox="0 0 24 24" fill="#fff"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>
                </span>
                <span className="stat-text"><span className="stat-num" ref={statMovesRef}>0</span><span className="stat-lbl">Moves</span></span>
              </div>
              <div className="stat-pill">
                <span className="stat-icon" style={{background:'linear-gradient(180deg,var(--orange-lt),var(--orange))'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                </span>
                <span className="stat-text"><span className="stat-num" ref={statTimeRef}>00:00</span><span className="stat-lbl">Time</span></span>
              </div>
              <div className="stat-pill">
                <span className="stat-icon" style={{background:'linear-gradient(180deg,var(--gold-lt),var(--gold))'}}>
                  <svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2 2 9l10 13L22 9z"/></svg>
                </span>
                <span className="stat-text"><span className="stat-num" ref={statCrystalsRef}>0/0</span><span className="stat-lbl">Gems</span></span>
              </div>
              <button id="mute-btn" title="Toggle sound">
                <svg ref={muteIconOnRef} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>
                <svg ref={muteIconOffRef} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:'none'}}><path d="M11 5 6 9H2v6h4l5 4z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              </button>
            </div>
          </div>

          <div className="toast" ref={toastRef}>Gem collected</div>

          <div id="hud-bottom">
            <div id="bottom-bar">
              <button className="action-btn" id="btn-hint" title="Hint">
                <span className="knob"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.5.5 2.7 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/></svg></span>
                <span className="label">Hint</span>
              </button>
              <button className="action-btn" id="btn-restart" title="Restart">
                <span className="knob"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></span>
                <span className="label">Restart</span>
              </button>
              <button className="action-btn" id="btn-pause" title="Pause">
                <span className="knob"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></span>
                <span className="label">Pause</span>
              </button>
              <button className="action-btn" id="btn-menu" title="Menu">
                <span className="knob"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5 12 3l9 6.5V21H3z"/><path d="M9 21v-7h6v7"/></svg></span>
                <span className="label">Menu</span>
              </button>
            </div>
          </div>

          <div className="overlay visible" ref={overlayStartRef}>
            <div className="game-card">
              <div className="ribbon-wrap"><div className="ribbon">Lumen Drift</div></div>
              <div className="card-body">
                <p className="subtitle"><b>Pick your maze size</b> below.</p>
                <div className="guide-box">
                  <div className="section-label">{'\u2605'} How to move {'\u2605'}</div>
                  <div className="guide-grid">
                    <span className="g-empty"></span>
                    <span className="g-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg></span>
                    <span className="g-empty"></span>
                    <span className="g-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></span>
                    <span className="g-mote-wrap"><span className="g-mote"></span></span>
                    <span className="g-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
                    <span className="g-empty"></span>
                    <span className="g-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>
                    <span className="g-empty"></span>
                  </div>
                  <p className="guide-text"><b>Swipe</b> anywhere on the maze to glide in that direction {'\u2014'}  On desktop, use the arrow keys.</p>
                </div>
                <div className="section-label">{'\u2605'} Choose your challenge {'\u2605'}</div>
                <div className="diff-grid" ref={diffGridRef}>
                  <button className="diff-card" data-diff="easy">
                    <span className="diff-orb" style={{background:'linear-gradient(180deg,var(--green-lt),var(--green))'}}><svg viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="9"/></svg></span>
                    <div className="diff-info"><div className="diff-name-row"><span className="diff-name">Calm</span><span className="diff-stars"><StarSvg/><StarGraySvg/><StarGraySvg/></span></div><div className="diff-desc">Small mazes, easy loops. Great for learning!</div></div>
                    <span className="diff-check"><CheckSvg/></span>
                  </button>
                  <button className="diff-card" data-diff="normal">
                    <span className="diff-orb" style={{background:'linear-gradient(180deg,var(--blue-lt),var(--blue))'}}><svg viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="9"/></svg></span>
                    <div className="diff-info"><div className="diff-name-row"><span className="diff-name">Drift</span><span className="diff-stars"><StarSvg/><StarSvg/><StarGraySvg/></span></div><div className="diff-desc">Balanced mazes that grow trickier as you go.</div></div>
                    <span className="diff-check"><CheckSvg/></span>
                  </button>
                  <button className="diff-card" data-diff="hard">
                    <span className="diff-orb" style={{background:'linear-gradient(180deg,var(--orange-lt),var(--orange))'}}><svg viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="9"/></svg></span>
                    <div className="diff-info"><div className="diff-name-row"><span className="diff-name">Surge</span><span className="diff-stars"><StarSvg/><StarSvg/><StarSvg/></span></div><div className="diff-desc">Big, tangled mazes with few shortcuts!</div></div>
                    <span className="diff-check"><CheckSvg/></span>
                  </button>
                </div>
                <button className="cta" id="btn-start"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21"/></svg>Play!</button>
              </div>
            </div>
          </div>

          <div className="overlay" ref={overlayPauseRef}>
            <div className="game-card">
              <div className="ribbon-wrap"><div className="ribbon">Paused</div></div>
              <div className="card-body">
                <p className="subtitle">Take a breather {'\u2014'} the maze will wait right here for you.</p>
                <button className="cta" id="btn-resume"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21"/></svg>Resume</button>
                <button className="cta ghost" id="btn-restart-2">Restart level</button>
                <button className="cta ghost" id="btn-menu-2">Back to menu</button>
              </div>
            </div>
          </div>

          <div className="overlay" ref={overlayCompleteRef}>
            <div className="game-card">
              <div className="ribbon-wrap"><div className="ribbon">Level Cleared! {'\u2605'}</div></div>
              <div className="card-body">
                <div className="stat-row">
                  <div className="stat-col"><div className="n" ref={doneMovesRef}>0</div><div className="l">Moves</div></div>
                  <div className="stat-col"><div className="n" ref={doneTimeRef}>00:00</div><div className="l">Time</div></div>
                  <div className="stat-col"><div className="n" ref={doneCrystalsRef}>0/0</div><div className="l">Gems</div></div>
                </div>
                <button className="cta" id="btn-next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>Next level</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
