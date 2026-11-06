import { useEffect, useRef } from 'react'

const BOUNCE_CSS = `
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none;}
html,body{width:100%;height:100%;overflow:hidden;background:#0a1830;font-family:'Press Start 2P',monospace;}
.bq-root{position:relative;width:100vw;height:100vh;}
.bq-canvas{display:block;width:100%;height:100%;image-rendering:pixelated;}
#flashOverlay{position:absolute;inset:0;z-index:3;pointer-events:none;opacity:0;background:transparent;}
.panel{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at center,rgba(20,40,80,0.92),rgba(5,10,25,0.97));color:#fff;gap:14px;padding:20px;text-align:center;z-index:10;overflow-y:auto;}
.hidden{display:none !important;}
h1.title{font-size:clamp(22px,5vw,44px);color:#ffd23f;text-shadow:4px 4px 0 #b5451b,0 0 20px rgba(255,210,63,0.6);letter-spacing:2px;margin-bottom:6px;}
.subtitle{font-size:10px;color:#9fd8ff;margin-bottom:20px;letter-spacing:1px;}
button.btn{font-family:'Press Start 2P',monospace;font-size:12px;color:#fff;background:linear-gradient(#3aa3ff,#1a63c9);border:3px solid #0d3f80;border-radius:10px;padding:14px 26px;cursor:pointer;min-width:220px;box-shadow:0 5px 0 #0a2d5c,0 8px 14px rgba(0,0,0,0.4);transition:transform .06s;}
button.btn:active{transform:translateY(4px);box-shadow:0 1px 0 #0a2d5c;}
button.btn.green{background:linear-gradient(#4ddb7a,#1e9b46);border-color:#0c5c26;box-shadow:0 5px 0 #0c4a1f,0 8px 14px rgba(0,0,0,0.4);}
button.btn.red{background:linear-gradient(#ff6b6b,#c92e2e);border-color:#7a1414;box-shadow:0 5px 0 #6b1010,0 8px 14px rgba(0,0,0,0.4);}
button.btn.small{font-size:10px;padding:10px 16px;min-width:140px;}
button.btn:disabled{filter:grayscale(1) brightness(0.6);cursor:not-allowed;}
.levelGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:10px 0 20px;}
.levelCard{width:120px;height:120px;border-radius:12px;border:3px solid #0d3f80;background:linear-gradient(#2b6fb8,#123a68);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;gap:8px;box-shadow:0 5px 0 #0a2d5c;font-size:11px;}
.levelCard:active{transform:translateY(3px);box-shadow:0 2px 0 #0a2d5c;}
.levelCard.locked{filter:grayscale(1) brightness(0.5);cursor:not-allowed;}
.levelCard .num{font-size:22px;color:#ffd23f;}
.levelCard .stars{font-size:12px;color:#ffd23f;letter-spacing:2px;}
#hud{position:absolute;top:0;left:0;width:100%;padding:10px 14px;display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none;z-index:5;font-size:11px;color:#fff;text-shadow:2px 2px 0 rgba(0,0,0,0.5);}
#hud .box{background:rgba(10,20,40,0.55);border:2px solid rgba(255,255,255,0.25);border-radius:8px;padding:6px 10px;pointer-events:auto;display:flex;align-items:center;gap:8px;}
#pauseBtn{cursor:pointer;font-size:16px;}
#msgFloat{position:absolute;top:70px;left:50%;transform:translateX(-50%);color:#ffe27a;font-size:12px;text-shadow:2px 2px 0 #000;opacity:0;transition:opacity .3s;z-index:6;pointer-events:none;text-align:center;}
#touchLayer{position:absolute;inset:0;z-index:6;touch-action:none;}
.joyBase{position:absolute;top:0;left:0;width:92px;height:92px;margin-left:-46px;margin-top:-46px;border-radius:50%;background:rgba(255,255,255,0.10);border:3px solid rgba(255,255,255,0.35);opacity:0;pointer-events:none;transition:opacity .15s ease;z-index:7;}
.joyKnob{position:absolute;top:0;left:0;width:42px;height:42px;margin-left:-21px;margin-top:-21px;border-radius:50%;background:rgba(255,255,255,0.38);border:2px solid rgba(255,255,255,0.65);opacity:0;pointer-events:none;transition:opacity .15s ease;z-index:8;}
#touchHint{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);font-size:8px;color:rgba(255,255,255,0.6);text-shadow:2px 2px 0 rgba(0,0,0,0.45);pointer-events:none;z-index:6;text-align:center;letter-spacing:0.5px;line-height:1.7;white-space:nowrap;}
.small-note{font-size:8px;color:#8fb8dd;max-width:340px;line-height:1.6;}
#confettiLayer{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1;}
.confetti-piece{position:absolute;top:-14px;border-radius:1px;opacity:0.95;animation-name:confettiFall;animation-timing-function:cubic-bezier(.4,.1,.6,.9);animation-fill-mode:forwards;}
@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1;}100%{transform:translateY(115vh) rotate(600deg);opacity:0.9;}}
`

export default function BouncePlayerPage({ gameData, sessionToken, onComplete }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const hudRef = useRef(null)
  const touchRef = useRef(null)
  const joyBaseRef = useRef(null)
  const joyKnobRef = useRef(null)
  const msgRef = useRef(null)
  const ringCountRef = useRef(null)
  const ringTotalRef = useRef(null)
  const livesCountRef = useRef(null)
  const loadingRef = useRef(null)
  const menuRef = useRef(null)
  const levelSelectRef = useRef(null)
  const levelGridRef = useRef(null)
  const pausePanelRef = useRef(null)
  const gameOverRef = useRef(null)
  const gameOverTextRef = useRef(null)
  const completeRef = useRef(null)
  const completeTitleRef = useRef(null)
  const completeSubRef = useRef(null)
  const completeStarsRef = useRef(null)
  const completeRingsRef = useRef(null)
  const nextLevelRef = useRef(null)
  const confettiRef = useRef(null)
  const soundBtnRef = useRef(null)
  const hapticsBtnRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext('2d')

    const T = 32

    let progress = { unlocked:1, stars:{1:0,2:0,3:0,4:0,5:0}, sound:true, haptics:true }
    async function loadProgress(){try{if(window.storage&&window.storage.get){const r=await window.storage.get('bouncequest_progress');if(r&&r.value)progress=Object.assign(progress,JSON.parse(r.value))}}catch(e){}}
    async function saveProgress(){try{if(window.storage&&window.storage.set){await window.storage.set('bouncequest_progress',JSON.stringify(progress),false)}}catch(e){}}

    const FlashFX=(function(){let enabled=true;let el=null;function elRef(){if(!el)el=document.getElementById('flashOverlay');return el}function flash(color,peakOpacity,duration){if(!enabled)return;const node=elRef();if(!node)return;node.style.transition='none';node.style.background=color;node.style.opacity=String(peakOpacity);void node.offsetWidth;requestAnimationFrame(()=>{node.style.transition='opacity '+duration+'ms ease-out';node.style.opacity='0'})}return{setEnabled(v){enabled=v},isEnabled(){return enabled},ring(){flash('#ffd23f',0.30,180)},checkpoint(){flash('#4ddb7a',0.28,260)},denied(){flash('#ff6b6b',0.24,200)},death(){flash('#ff2d2d',0.42,320)},gameOver(){flash('#7a0000',0.55,550)},win(){flash('#ffe27a',0.5,650)}}})()

    const Haptics=(function(){let enabled=true;function supported(){return typeof navigator!=='undefined'&&'vibrate'in navigator}function fire(pattern){if(!enabled||!supported())return;try{navigator.vibrate(pattern)}catch(e){}}return{setEnabled(v){enabled=v;if(v)fire(10)},isEnabled(){return enabled},tap(){fire(10)},bounce(){fire(8)},ring(){fire(14)},checkpoint(){fire([0,18,30,18])},denied(){fire([0,25,25,25])},death(){fire([0,90,50,90])},gameOver(){fire([0,120,60,120,60,220])},win(){fire([0,60,40,60,40,140])}}})()

    const Audio1=(function(){let ctx=null,master=null,musicOn=true,musicTimer=null,musicStep=0;function ensure(){if(!ctx){ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=0.35;master.connect(ctx.destination)}}function tone(freq,dur,type,vol,delay){ensure();const t0=ctx.currentTime+(delay||0);const osc=ctx.createOscillator();const g=ctx.createGain();osc.type=type||'square';osc.frequency.setValueAtTime(freq,t0);g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol||0.5,t0+0.01);g.gain.exponentialRampToValueAtTime(0.001,t0+dur);osc.connect(g);g.connect(master);osc.start(t0);osc.stop(t0+dur+0.02)}function sweep(f1,f2,dur,type,vol,delay){ensure();const t0=ctx.currentTime+(delay||0);const osc=ctx.createOscillator();const g=ctx.createGain();osc.type=type||'sine';osc.frequency.setValueAtTime(f1,t0);osc.frequency.exponentialRampToValueAtTime(f2,t0+dur);g.gain.setValueAtTime(vol||0.4,t0);g.gain.exponentialRampToValueAtTime(0.001,t0+dur);osc.connect(g);g.connect(master);osc.start(t0);osc.stop(t0+dur+0.02)}let ringCombo=0,ringComboResetTimer=null;const sfx={jump:()=>sweep(280,560,0.16,'square',0.3),bounce:()=>sweep(180,320,0.12,'triangle',0.28),ring:()=>{const step=Math.min(ringCombo,7);const base=880*Math.pow(1.06,step);tone(base,0.07,'square',0.28);sweep(base*1.15,base*2.1,0.09,'square',0.18,0.03);ringCombo++;if(ringComboResetTimer)clearTimeout(ringComboResetTimer);ringComboResetTimer=setTimeout(()=>{ringCombo=0},700)},checkpoint:()=>{tone(440,0.1,'triangle',0.3);tone(660,0.1,'triangle',0.3,0.08);tone(880,0.18,'triangle',0.3,0.16)},death:()=>sweep(300,60,0.35,'sawtooth',0.3),gameOver:()=>{sweep(220,40,0.6,'sawtooth',0.32);[220,196,174,146].forEach((f,i)=>tone(f,0.3,'triangle',0.22,0.15+i*0.16))},door:()=>{[523,659,784,1046].forEach((f,i)=>tone(f,0.22,'square',0.28,i*0.09))},victory:()=>{const notes=[523,659,784,1046,784,1046,1318,1568];notes.forEach((f,i)=>tone(f,0.24,'square',0.3,0.32+i*0.1));setTimeout(()=>sweep(1046,2093,0.5,'triangle',0.22),0.32*1000+notes.length*100)},denied:()=>sweep(200,120,0.2,'sawtooth',0.25),click:()=>tone(600,0.06,'square',0.2)};function playMusic(){if(!musicOn)return;ensure();const pattern=[261,0,329,0,392,0,329,0,261,0,349,0,440,0,349,0];if(musicTimer)clearInterval(musicTimer);musicTimer=setInterval(()=>{const n=pattern[musicStep%pattern.length];if(n>0)tone(n,0.16,'triangle',0.09);musicStep++},220)}function stopMusic(){if(musicTimer)clearInterval(musicTimer);musicTimer=null}function setMuted(muted){musicOn=!muted;ensure();master.gain.value=muted?0:0.35;if(muted)stopMusic();else playMusic()}return{sfx,playMusic,stopMusic,setMuted,ensure}})()

    class Builder{constructor(){this.tiles=new Map();this.rings=[];this.checkpoints=[];this.spikes=[];this.platforms=[];this.crushers=[];this.fallers=[];this.exit=null;this.h=4;this.cx=2;this.cy=8;this.minC=Infinity;this.maxC=-Infinity;this.minR=Infinity;this.maxR=-Infinity;this.pit=null;this.carveRect(this.cx,this.cy,this.h,this.h);this.startX=this.cx*T+T;this.startY=this.cy*T+Math.floor(this.h*T/2)}key(c,r){return c+'_'+r}carveRect(c0,r0,w,h){for(let c=c0;c<c0+w;c++)for(let r=r0;r<r0+h;r++){this.tiles.set(this.key(c,r),1);if(c<this.minC)this.minC=c;if(c>this.maxC)this.maxC=c;if(r<this.minR)this.minR=r;if(r>this.maxR)this.maxR=r}this.lastRect={c0,r0,w,h};return this}carveVoid(c0,r0,w,h){for(let c=c0;c<c0+w;c++)for(let r=r0;r<r0+h;r++)this.tiles.set(this.key(c,r),1);if(c0<this.minC)this.minC=c0;if(c0+w-1>this.maxC)this.maxC=c0+w-1;if(r0<this.minR)this.minR=r0;if(r0+h-1>this.maxR)this.maxR=r0+h-1}solidAt(c,r){return!this.tiles.has(this.key(c,r))}_makePit(startC,n,h,opts){const pitStart=opts.start!=null?opts.start:1;const maxW=Math.max(2,(n+h)-pitStart-1);const pitWidth=Math.max(2,Math.min(opts.width!=null?opts.width:Math.max(1,n-2),maxW));const depth=opts.depth||10;const r0=this.cy+h;const c0=startC+pitStart;this.carveVoid(c0,r0,pitWidth,depth);this.pit={c0,w:pitWidth,r0};const stepGap=4;let side=0;for(let rowsFromBottom=stepGap;rowsFromBottom<depth;rowsFromBottom+=stepGap){const stepRow=r0+depth-rowsFromBottom;const stepCol=side===0?c0:c0+pitWidth-1;this.tiles.delete(this.key(stepCol,stepRow));side=1-side}}right(n,o={}){const h=o.h||this.h;const startC=this.cx;this.carveRect(this.cx,this.cy,n+h,h);this.cx+=n;this.pit=null;if(o.pit)this._makePit(startC,n,h,o.pit);return this}left(n,o={}){const h=o.h||this.h;const nc=this.cx-n;this.carveRect(nc,this.cy,n+h,h);this.cx=nc;this.pit=null;if(o.pit)this._makePit(nc,n,h,o.pit);return this}down(n,o={}){const w=o.w||this.h;this.pit=null;this.carveRect(this.cx,this.cy,w,n+w);this.cy+=n;return this}up(n,o={}){const w=o.w||this.h;const nr=this.cy-n;this.pit=null;this.carveRect(this.cx,nr,w,n+w);this.cy=nr;return this}room(w,h,offx=0){this.pit=null;this.carveRect(this.cx-Math.floor((w-this.h)/2)+offx,this.cy,w,h);return this}ring(dx=0,dy=1){this.rings.push({x:(this.cx+dx)*T+T,y:(this.cy+dy)*T+T,id:this.rings.length});return this}ringRow(n,dir=1,dy=1,spacing=1.4){for(let i=0;i<n;i++)this.rings.push({x:(this.cx+dir*i*spacing)*T+T,y:(this.cy+dy)*T+T,id:this.rings.length});return this}spikeFloor(len=1,opts={}){const r=this.lastRect;const step=opts.step||1;const off=opts.offset||0;for(let i=off;i<len;i+=step)this.spikes.push({x:(r.c0+i)*T+2,y:(r.r0+r.h)*T-16,w:T-4,h:16,type:'floor'});return this}spikeCeil(len=1,opts={}){const r=this.lastRect;const step=opts.step||1;const off=opts.offset||0;for(let i=off;i<len;i+=step)this.spikes.push({x:(r.c0+i)*T+2,y:r.r0*T,w:T-4,h:16,type:'ceil'});return this}checkpoint(){const r=this.lastRect;const cyCenter=r.r0*T+Math.floor(r.h*T/2);this.checkpoints.push({x:this.cx*T+T,y:cyCenter,active:false,id:this.checkpoints.length});return this}platformH(range,speed){const r=this.lastRect;const centerY=r?(r.r0+r.h/2)*T:(this.cy+1)*T;this.platforms.push({baseX:this.cx*T,baseY:centerY,axis:'x',range:range*T,speed,w:70,h:16,phase:Math.random()*6});return this}platformV(range,speed){const r=this.lastRect;const centerX=r?(r.c0+r.w/2)*T:this.cx*T;const w=r?Math.max(40,Math.min(70,r.w*T-14)):70;const shaftTopRow=r?r.r0:this.cy;const shaftBottomRow=r?r.r0+r.h:this.cy+4;const desiredLowRow=shaftBottomRow-1.5;const rangeTiles=Math.max(range,desiredLowRow-shaftTopRow);this.platforms.push({baseX:centerX,baseY:shaftTopRow*T,axis:'y',range:rangeTiles*T,speed,w,h:16,phase:Math.random()*6});return this}platformOverPit(speed,o={}){const p=this.pit;if(!p)return this.platformH(o.range||3,speed);const w=o.w||58;const pitX0=p.c0*T,pitX1=(p.c0+p.w)*T;const leftPos=pitX0+w/2;const rightPos=pitX1-w/2;const baseX=leftPos;const range=Math.max(24,rightPos-leftPos);this.platforms.push({baseX,baseY:p.r0*T-20,axis:'x',range,speed,w,h:14,phase:0});return this}crusher(range,speed){const colCenterX=this.cx*T+T/2;const topY=this.cy*T+6;this.crushers.push({baseX:colCenterX,baseY:topY,axis:'y',range:Math.max(24,range*T),speed,w:T-6,h:T-4,phase:0});return this}faller(){this.fallers.push({x:this.cx*T,y:(this.cy+1)*T,w:70,h:16,ox:this.cx*T,oy:(this.cy+1)*T,state:'idle',timer:0});return this}fallerOverPit(){const p=this.pit;if(!p)return this.faller();const w=Math.min(90,Math.max(40,p.w*T-12));const cx=(p.c0*T)+(p.w*T)/2;const y=p.r0*T-20;this.fallers.push({x:cx,y,w,h:14,ox:cx,oy:y,state:'idle',timer:0});return this}secret(fn){const save={cx:this.cx,cy:this.cy,lastRect:this.lastRect,pit:this.pit};fn(this);this.cx=save.cx;this.cy=save.cy;this.lastRect=save.lastRect;this.pit=save.pit;return this}setExit(required){this.exit={x:this.cx*T,y:this.cy*T,w:this.h*T,h:this.h*T,required};return this}}

    function buildLevel1(){const b=new Builder();b.ring().right(5).ring().right(5,{h:3}).ring().down(4,{w:3}).ring().right(6).ringRow(3,1,1).checkpoint().right(4).spikeFloor(1).right(3).up(3,{w:3}).ring().right(5).ring().down(5,{w:3}).secret(bb=>{bb.left(4,{h:2});bb.ring();bb.ring(1,0)}).right(7,{pit:{start:2,width:3,depth:8}}).platformOverPit(1.0).ringRow(2,1,1).checkpoint().right(5).spikeCeil(1).right(6).ring().up(4,{w:3}).right(5).ring().ring(1,0).room(6,4).right(3).setExit(6);return{builder:b,name:'Sunny Slopes',requiredFrac:0.3}}
    function buildLevel2(){const b=new Builder();b.ring().right(6).down(3,{w:3}).ring().right(7,{pit:{start:2,width:3,depth:8}}).platformOverPit(0.55,{w:78}).ringRow(2,1,1).checkpoint().right(5).ring().up(6,{w:3}).platformV(4,0.65).up(2,{w:3}).ring().right(6).ring().checkpoint().down(7,{w:3}).right(6,{pit:{start:2,width:3,depth:8}}).fallerOverPit().ringRow(2,1,1).checkpoint().right(5).spikeCeil(1).right(5).ring().secret(bb=>{bb.up(3,{w:2});bb.ring();bb.ring(0,1);bb.ring(0,2)}).down(3,{w:3}).checkpoint().right(6).ringRow(2,1,1).up(2,{w:3}).ring().right(6).checkpoint().room(6,4).ring().ring(1,0).ring(-1,1).right(3).setExit(9);return{builder:b,name:'Gearwork Gorge',requiredFrac:0.3}}
    function buildLevel3(){const b=new Builder();b.ring().right(5).down(4,{w:3}).ring().right(6).spikeFloor(1).right(4).ringRow(2,1,1).checkpoint().down(5,{w:3}).right(6,{pit:{start:2,width:3,depth:8}}).platformOverPit(1.2).right(4).spikeCeil(1).up(6,{w:3}).platformV(4,1.0).up(2,{w:3}).ring().right(4).right(4).spikeCeil(1).right(4).ring().secret(bb=>{bb.down(3,{w:2});bb.ring();bb.ring(0,1);bb.checkpoint()}).checkpoint().down(4,{w:3}).right(7,{pit:{start:2,width:4,depth:8}}).fallerOverPit().ringRow(2,1,1).up(3,{w:3}).right(4).spikeFloor(1).right(3).ring().room(6,4).ring(-1,0).ring(1,0).right(3).setExit(10);return{builder:b,name:'Spike Serpent',requiredFrac:0.32}}
    function buildLevel4(){const b=new Builder();b.ring().right(4).down(3,{w:3}).ring().left(6).ring().down(4,{w:3}).right(7).ringRow(2,1,1).checkpoint().up(5,{w:3}).platformV(4,1.1).up(2,{w:3}).right(5).spikeCeil(1).right(4).ring().secret(bb=>{bb.up(4,{w:2});bb.room(5,3);bb.ring();bb.ring(1,0);bb.ring(-1,0)}).down(6,{w:3}).right(4).crusher(1.5,1.3).right(6,{pit:{start:2,width:3,depth:8}}).platformOverPit(1.3).right(4).spikeFloor(1).ring().checkpoint().down(3,{w:3}).left(5).ring().down(4,{w:3}).right(9).ringRow(3,1,1).up(4,{w:3}).right(4).spikeCeil(1).right(6,{pit:{start:2,width:4,depth:8}}).fallerOverPit().right(4).ring().room(7,5).secret(bb=>{bb.right(3,{h:2});bb.ring();bb.ring(0,1);bb.ring(1,1)}).right(4).setExit(12);return{builder:b,name:'Labyrinth Depths',requiredFrac:0.35}}
    function buildLevel5(){const b=new Builder();b.ring().right(5).down(4,{w:3}).ring().right(6,{pit:{start:2,width:3,depth:8}}).platformOverPit(1.4).right(4).spikeFloor(1).ringRow(2,1,1).checkpoint().down(5,{w:3}).right(4).spikeCeil(1).right(5).crusher(1.6,1.4).right(4).ring().up(6,{w:3}).platformV(5,1.3).up(2,{w:3}).ring().secret(bb=>{bb.left(5,{h:2});bb.ring();bb.ring(1,0);bb.ring(2,0)}).right(7,{pit:{start:2,width:4,depth:8}}).fallerOverPit().ringRow(2,1,1).checkpoint().down(7,{w:3}).right(5).crusher(1.6,1.5).right(6,{pit:{start:2,width:3,depth:8}}).platformOverPit(1.5).right(4).spikeCeil(1).ring().down(4,{w:3}).right(4).spikeFloor(1).right(6,{pit:{start:2,width:4,depth:8}}).fallerOverPit().right(3).ring().up(8,{w:3}).platformV(6,1.4).up(2,{w:3}).checkpoint().right(6).ringRow(2,1,1).secret(bb=>{bb.up(4,{w:2});bb.room(5,3);bb.ring();bb.ring(1,0);bb.ring(-1,0);bb.ring(0,1)}).down(4,{w:3}).right(6,{pit:{start:2,width:3,depth:8}}).platformOverPit(1.6).right(4).spikeCeil(1).ring().down(5,{w:3}).right(4).spikeFloor(1).right(5).ring().room(8,5).ring(-2,0).ring(2,0).ring(0,1).right(4).setExit(20);return{builder:b,name:'The Grand Descent',requiredFrac:0.35}}
    const LEVEL_FACTORIES=[buildLevel1,buildLevel2,buildLevel3,buildLevel4,buildLevel5]

    let VW=800,VH=480,DPR=1,skyGrad=null
    function resize(){VW=window.innerWidth;VH=window.innerHeight;DPR=Math.min(window.devicePixelRatio||1,1.5);canvas.width=VW*DPR;canvas.height=VH*DPR;ctx2d.setTransform(DPR,0,0,DPR,0,0);skyGrad=ctx2d.createLinearGradient(0,0,0,VH);skyGrad.addColorStop(0,'#7ec8f2');skyGrad.addColorStop(0.6,'#bfe6fa');skyGrad.addColorStop(1,'#e9f7ff')}
    window.addEventListener('resize',resize);resize()

    let state='loading',currentLevelIndex=1,level=null,ball,cam,keys={left:false,right:false,up:false}
    let jumpBufferTimer=0,coyoteTimer=0,ringsCollected=0,lives=4,stars=0,msgTimer=0,timeAccum=0,particles=[]

    function spawnBurst(x,y,color,count,opts={}){const speed=opts.speed||3.2,life=opts.life||0.6,size=opts.size||3;for(let i=0;i<count;i++){const ang=(Math.PI*2*i/count)+Math.random()*0.6;const spd=speed*(0.6+Math.random()*0.7);particles.push({x,y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd-(opts.upBias||0),life,maxLife:life,size:size*(0.7+Math.random()*0.6),color})}}
    function updateParticles(dt){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.vy+=6*dt;p.x+=p.vx;p.y+=p.vy;p.life-=dt;if(p.life<=0)particles.splice(i,1)}}
    function drawParticles(){for(const p of particles){const a=Math.max(0,p.life/p.maxLife);ctx2d.globalAlpha=a;ctx2d.fillStyle=p.color;ctx2d.beginPath();ctx2d.arc(p.x,p.y,p.size*a+0.5,0,Math.PI*2);ctx2d.fill()}ctx2d.globalAlpha=1}
    function makeBall(x,y){return{x,y,vx:0,vy:0,r:14,grounded:false,onPlatform:null,squashT:0,invuln:1.0,jumpCooldown:0,jumpsLeft:2}}

    function roundRect(x,y,w,h,r){ctx2d.beginPath();ctx2d.moveTo(x+r,y);ctx2d.arcTo(x+w,y,x+w,y+h,r);ctx2d.arcTo(x+w,y+h,x,y+h,r);ctx2d.arcTo(x,y+h,x,y,r);ctx2d.arcTo(x,y,x+w,y,r);ctx2d.closePath()}
    function drawBrick(x,y,c){c=c||ctx2d;c.fillStyle='#7a3fc0';c.fillRect(x,y,T,T);c.strokeStyle='#4a2280';c.lineWidth=1;c.strokeRect(x+0.5,y+0.5,T-1,T-1);c.fillStyle='rgba(255,255,255,0.08)';c.fillRect(x+2,y+2,T-4,6);c.strokeStyle='#4a2280';c.beginPath();c.moveTo(x,y+T/2);c.lineTo(x+T,y+T/2);c.stroke();c.beginPath();c.moveTo(x+T/2,y);c.lineTo(x+T/2,y+T/2);c.moveTo(x+T/4,y+T/2);c.lineTo(x+T/4,y+T);c.moveTo(x+3*T/4,y+T/2);c.lineTo(x+3*T/4,y+T);c.stroke()}
    function drawPlatform(x,y,w,h,colors){ctx2d.fillStyle=colors[1];roundRect(x-w/2,y,w,h,5);ctx2d.fill();ctx2d.fillStyle=colors[0];roundRect(x-w/2,y,w,h-6,5);ctx2d.fill();ctx2d.fillStyle='rgba(255,255,255,0.35)';ctx2d.fillRect(x-w/2+4,y+2,w-8,3)}
    function drawBall(){const squash=1-Math.max(0,ball.squashT)*0.25;ctx2d.save();if(ball.invuln>0&&Math.floor(ball.invuln*10)%2===0)ctx2d.globalAlpha=0.45;ctx2d.translate(ball.x,ball.y);ctx2d.scale(1/squash,squash);ctx2d.beginPath();ctx2d.ellipse(2,ball.r*0.9,ball.r*0.9,ball.r*0.35,0,0,Math.PI*2);ctx2d.fillStyle='rgba(0,0,0,0.18)';ctx2d.fill();const grad=ctx2d.createRadialGradient(-ball.r*0.35,-ball.r*0.35,2,0,0,ball.r*1.3);grad.addColorStop(0,'#ffffff');grad.addColorStop(0.25,'#c98fff');grad.addColorStop(1,'#6a1fb0');ctx2d.beginPath();ctx2d.arc(0,0,ball.r,0,Math.PI*2);ctx2d.fillStyle=grad;ctx2d.fill();ctx2d.strokeStyle='#3f0f6e';ctx2d.lineWidth=2;ctx2d.stroke();ctx2d.beginPath();ctx2d.ellipse(-ball.r*0.35,-ball.r*0.4,ball.r*0.35,ball.r*0.2,-0.5,0,Math.PI*2);ctx2d.fillStyle='rgba(255,255,255,0.75)';ctx2d.fill();ctx2d.restore()}
    function tileSolid(c,r){return level.builder.solidAt(c,r)}
    function circleRectOverlap(cx,cy,r,rx,ry,rw,rh){const nx=Math.max(rx,Math.min(cx,rx+rw));const ny=Math.max(ry,Math.min(cy,ry+rh));const dx=cx-nx,dy=cy-ny;return(dx*dx+dy*dy)<r*r}
    function platformPos(p,t){const off=(Math.sin(t*p.speed+(p.phase||0))*0.5+0.5)*p.range;if(p.axis==='x')return{x:p.baseX+off,y:p.baseY};return{x:p.baseX,y:p.baseY+off}}

    function showMsg(text){const el=msgRef.current;if(!el)return;el.textContent=text;el.style.opacity='1';msgTimer=1.6}
    function showMsgTop(t){const el=msgRef.current;if(!el)return;el.textContent=t;el.style.opacity='1';setTimeout(()=>el.style.opacity='0',1400)}

    function clearOfWalls(b,x,y,margin){const c0=Math.floor((x-margin)/T),c1=Math.floor((x+margin)/T),r0=Math.floor((y-margin)/T),r1=Math.floor((y+margin)/T);for(let c=c0;c<=c1;c++)for(let r=r0;r<=r1;r++){if(b.solidAt(c,r)){const rx=c*T,ry=r*T;const nx=Math.max(rx,Math.min(x,rx+T)),ny=Math.max(ry,Math.min(y,ry+T));const dx=x-nx,dy=y-ny;if(dx*dx+dy*dy<margin*margin)return false}}return true}
    function nearestOpenTile(b,px,py){const margin=16;const c0=Math.floor(px/T),r0=Math.floor(py/T);if(clearOfWalls(b,px,py,margin))return{x:px,y:py};for(let rad=1;rad<=8;rad++){for(let dc=-rad;dc<=rad;dc++){for(let dr=-rad;dr<=rad;dr++){if(Math.max(Math.abs(dc),Math.abs(dr))!==rad)continue;const c=c0+dc,r=r0+dr;const cx=c*T+T/2,cy=r*T+T/2;if(!b.solidAt(c,r)&&clearOfWalls(b,cx,cy,margin))return{x:cx,y:cy}}}}return{x:px,y:py}}
    function loadLevel(idx){
      currentLevelIndex=idx;const data=LEVEL_FACTORIES[idx-1]();const b=data.builder
      level={builder:b,name:data.name,total:b.rings.length,required:Math.ceil(b.rings.length*data.requiredFrac)}
      level.rings=b.rings.map(r=>{const fixed=nearestOpenTile(b,r.x,r.y);return{...r,x:fixed.x,y:fixed.y,collected:false}});level.checkpoints=b.checkpoints.map(c=>{const fixed=nearestOpenTile(b,c.x,c.y);return{...c,x:fixed.x,y:fixed.y,active:false}});level.platforms=b.platforms.map(p=>({...p}));level.crushers=b.crushers.map(p=>({...p}));level.fallers=b.fallers.map(f=>({...f}))
      ball=makeBall(b.startX,b.startY);cam={x:ball.x-VW/2,y:0};ringsCollected=0;lives=4;jumpBufferTimer=0;coyoteTimer=0;level.lastCheckpoint={x:b.startX,y:b.startY}
      if(ringTotalRef.current)ringTotalRef.current.textContent=level.total
      if(ringCountRef.current)ringCountRef.current.textContent=0
      if(livesCountRef.current)livesCountRef.current.textContent=lives
      const tOX=(b.minC-1)*T,tOY=(b.minR-1)*T,tW=(b.maxC-b.minC+3)*T,tH=(b.maxR-b.minR+3)*T;const tileCanvas=document.createElement('canvas');tileCanvas.width=tW;tileCanvas.height=tH;const tileCtx=tileCanvas.getContext('2d');for(let c=b.minC-1;c<=b.maxC+1;c++){for(let r=b.minR-1;r<=b.maxR+1;r++){if(tileSolid(c,r))drawBrick(c*T-tOX,r*T-tOY,tileCtx)}}level.tileCanvas=tileCanvas;level.tileOX=tOX;level.tileOY=tOY
    }

    function pushOutX(ball,rx,ry,rw,rh){
      const r=ball.r;const nx=Math.max(rx,Math.min(ball.x,rx+rw));const ny=Math.max(ry,Math.min(ball.y,ry+rh));const ddx=ball.x-nx,ddy=ball.y-ny;const distSq=ddx*ddx+ddy*ddy;if(distSq>=r*r)return false;const maxDx=Math.sqrt(Math.max(0,r*r-ddy*ddy));if(Math.abs(ddx)>0.0001){ball.x=nx+Math.sign(ddx)*(maxDx+0.03)}else{const centerX=rx+rw/2;ball.x=ball.x<centerX?nx-(maxDx+0.03):nx+(maxDx+0.03)}ball.vx=0;return true
    }
    function pushOutY(ball,rx,ry,rw,rh,onLand){
      const r=ball.r;const nx=Math.max(rx,Math.min(ball.x,rx+rw));const ny=Math.max(ry,Math.min(ball.y,ry+rh));const ddx=ball.x-nx,ddy=ball.y-ny;const distSq=ddx*ddx+ddy*ddy;if(distSq>=r*r)return false;const maxDy=Math.sqrt(Math.max(0,r*r-ddx*ddx));const fromAbove=ddy<-0.0001||(Math.abs(ddy)<=0.0001&&ball.vy>=0);if(fromAbove){ball.y=ny-(maxDy+0.03);if(ball.vy>1.4){ball.vy=-ball.vy*0.68;Audio1.sfx.bounce()}else{ball.vy=0;ball.grounded=true;ball.jumpsLeft=2;if(onLand)onLand()}}else{ball.y=ny+(maxDy+0.03);if(ball.vy<0)ball.vy=0}return true
    }
    function resolveAxis(ball,axis,solids){
      const r=ball.r
      if(axis==='x'){
        const c0=Math.floor((ball.x-r)/T),c1=Math.floor((ball.x+r)/T);const r0=Math.floor((ball.y-r)/T),r1=Math.floor((ball.y+r)/T)
        for(let c=c0;c<=c1;c++)for(let rr=r0;rr<=r1;rr++){if(tileSolid(c,rr))pushOutX(ball,c*T,rr*T,T,T)}
        for(const s of solids){pushOutX(ball,s.x-s.w/2,s.y,s.w,s.h)}
      }else{
        const c0=Math.floor((ball.x-r)/T),c1=Math.floor((ball.x+r)/T);const r0=Math.floor((ball.y-r)/T),r1=Math.floor((ball.y+r)/T)
        ball.grounded=false;ball.onPlatform=null
        for(let c=c0;c<=c1;c++)for(let rr=r0;rr<=r1;rr++){if(tileSolid(c,rr))pushOutY(ball,c*T,rr*T,T,T)}
        for(const s of solids){pushOutY(ball,s.x-s.w/2,s.y,s.w,s.h,()=>{ball.onPlatform=s})}
      }
    }

    const GRAVITY=0.62,MAX_FALL=15,MAX_SPEED=4.6,ACCEL=0.55,FRICTION=0.82,AIR_FRICTION=0.95,JUMP_V=-11.2,JUMP_COOLDOWN=0.14
    function requestJump(){jumpBufferTimer=0.12}

    function loseLife(){Audio1.sfx.death();Haptics.death();FlashFX.death();lives--;if(livesCountRef.current)livesCountRef.current.textContent=Math.max(lives,0);if(lives<=0){enterGameOver();return}ball=makeBall(level.lastCheckpoint.x,level.lastCheckpoint.y);jumpBufferTimer=0;coyoteTimer=0}

    function updatePhysics(dt){
      const fs=Math.min(dt*60,2)
      timeAccum+=dt;if(keys.left)ball.vx-=ACCEL*fs;if(keys.right)ball.vx+=ACCEL*fs;if(!keys.left&&!keys.right)ball.vx*=Math.pow(ball.grounded?FRICTION:AIR_FRICTION,fs);ball.vx=Math.max(-MAX_SPEED,Math.min(MAX_SPEED,ball.vx))
      jumpBufferTimer=Math.max(0,jumpBufferTimer-dt);ball.jumpCooldown=Math.max(0,ball.jumpCooldown-dt)
      if(jumpBufferTimer>0&&ball.jumpCooldown<=0&&ball.jumpsLeft>0){ball.vy=JUMP_V;ball.grounded=false;ball.jumpsLeft--;Audio1.sfx.jump();ball.squashT=1;jumpBufferTimer=0;ball.jumpCooldown=JUMP_COOLDOWN}
      if(ball.invuln>0)ball.invuln=Math.max(0,ball.invuln-dt);ball.vy+=GRAVITY*fs;if(ball.vy>MAX_FALL)ball.vy=MAX_FALL
      const solidPlatforms=[];for(const p of level.platforms){const pos=platformPos(p,timeAccum);p.px=p.x;p.py=p.y;p.x=pos.x;p.y=pos.y;solidPlatforms.push(p)}
      for(const f of level.fallers){if(f.state==='idle'){f.px=f.x;f.py=f.y;f.x=f.ox+Math.sin(timeAccum*1.3+f.ox*0.013)*16;f.y=f.oy;solidPlatforms.push(f)}else if(f.state==='shaking'){f.px=f.x;f.py=f.y;f.x=f.ox+Math.sin(timeAccum*40)*2;f.y=f.oy;solidPlatforms.push(f)}else if(f.state==='falling'){f.y+=6*fs;if(f.y>f.oy+400){f.state='respawning';f.timer=1.5}}else if(f.state==='respawning'){f.timer-=dt;if(f.timer<=0){f.state='idle'}}}
      ball.x+=ball.vx*fs;resolveAxis(ball,'x',solidPlatforms);ball.y+=ball.vy*fs;resolveAxis(ball,'y',solidPlatforms)
      if(tileSolid(Math.floor(ball.x/T),Math.floor(ball.y/T))){const cc=Math.floor(ball.x/T),rr0=Math.floor(ball.y/T);let bestD=Infinity,bestX=ball.x,bestY=ball.y;for(let dc=-1;dc<=1;dc++)for(let dr=-1;dr<=1;dr++){if(dc===0&&dr===0)continue;if(!tileSolid(cc+dc,rr0+dr)){const tx=(cc+dc)*T+T/2,ty=(rr0+dr)*T+T/2;const d=Math.hypot(tx-ball.x,ty-ball.y);if(d<bestD){bestD=d;bestX=tx;bestY=ty}}}ball.x=bestX;ball.y=bestY;ball.vx=0;ball.vy=0}
      if(ball.onPlatform&&ball.onPlatform.px!==undefined){ball.x+=(ball.onPlatform.x-ball.onPlatform.px);ball.y+=(ball.onPlatform.y-ball.onPlatform.py)}
      for(const f of level.fallers){if(f.state==='idle'&&ball.onPlatform===f){f.state='shaking';f.timer=0.5}}
      for(const f of level.fallers){if(f.state==='shaking'){f.timer-=dt;if(f.timer<=0)f.state='falling'}}
      if(ball.squashT>0)ball.squashT-=dt*4;updateParticles(dt)
      for(const s of level.builder.spikes){if(ball.invuln<=0&&circleRectOverlap(ball.x,ball.y,ball.r*0.6,s.x,s.y,s.w,s.h)){loseLife();return}}
      for(const c of level.crushers){const pos=platformPos(c,timeAccum);if(ball.invuln<=0&&circleRectOverlap(ball.x,ball.y,ball.r*0.6,pos.x-c.w/2,pos.y,c.w,c.h)){loseLife();return}}
      if(ball.y>(level.builder.maxR+6)*T){loseLife();return}
      for(const ring of level.rings){if(!ring.collected&&Math.hypot(ball.x-ring.x,ball.y-ring.y)<ball.r+10){ring.collected=true;ringsCollected++;Audio1.sfx.ring();Haptics.ring();FlashFX.ring();spawnBurst(ring.x,ring.y,'#ffd23f',10,{speed:2.6,life:0.5,size:2.6,upBias:1.2});ball.squashT=0.6;if(ringCountRef.current)ringCountRef.current.textContent=ringsCollected}}
      for(const cp of level.checkpoints){if(!cp.active&&Math.hypot(ball.x-cp.x,ball.y-cp.y)<ball.r+16){cp.active=true;level.lastCheckpoint={x:cp.x,y:cp.y};Audio1.sfx.checkpoint();Haptics.checkpoint();FlashFX.checkpoint();showMsg('Checkpoint!');spawnBurst(cp.x,cp.y-10,'#4ddb7a',16,{speed:3.4,life:0.7,size:3,upBias:2})}}
      const ex=level.builder.exit;if(ex&&circleRectOverlap(ball.x,ball.y,ball.r,ex.x,ex.y,ex.w,ex.h)){if(ringsCollected>=level.required)enterComplete();else{if(msgTimer<=0){showMsg('Need '+(level.required-ringsCollected)+' more rings!');Audio1.sfx.denied();Haptics.denied();FlashFX.denied()}}}
      if(msgTimer>0){msgTimer-=dt;if(msgTimer<=0&&msgRef.current)msgRef.current.style.opacity='0'}
      const targetX=ball.x-VW/2,targetY=ball.y-VH/2;cam.x+=(targetX-cam.x)*0.12;cam.y+=(targetY-cam.y)*0.12;const minX=(level.builder.minC-2)*T,maxX=(level.builder.maxC+3)*T-VW;const minY=(level.builder.minR-6)*T,maxY=(level.builder.maxR+6)*T-VH;cam.x=Math.max(minX,Math.min(cam.x,Math.max(minX,maxX)));cam.y=Math.max(minY,Math.min(cam.y,Math.max(minY,maxY)))
    }

    function draw(){
      ctx2d.fillStyle=skyGrad;ctx2d.fillRect(0,0,VW,VH)
      ctx2d.fillStyle='rgba(90,170,120,0.35)';for(let i=-2;i<20;i++){const hx=i*220-(cam.x*0.3)%220;ctx2d.beginPath();ctx2d.ellipse(hx,VH-40,140,90,0,0,Math.PI*2);ctx2d.fill()}
      ctx2d.fillStyle='rgba(255,255,255,0.55)';for(let i=-2;i<10;i++){const cx=i*300-(cam.x*0.15)%300,cy=60+((i*57)%80);ctx2d.beginPath();ctx2d.ellipse(cx,cy,34,16,0,0,Math.PI*2);ctx2d.ellipse(cx+26,cy+4,26,14,0,0,Math.PI*2);ctx2d.fill()}
      ctx2d.save();ctx2d.translate(-cam.x,-cam.y)
      const b=level.builder;if(level.tileCanvas){const tc=level.tileCanvas;const sx=Math.max(0,Math.min(tc.width,cam.x-level.tileOX));const sy=Math.max(0,Math.min(tc.height,cam.y-level.tileOY));const sw=Math.max(0,Math.min(VW,tc.width-sx));const sh=Math.max(0,Math.min(VH,tc.height-sy));if(sw>0&&sh>0){ctx2d.drawImage(tc,sx,sy,sw,sh,level.tileOX+sx,level.tileOY+sy,sw,sh)}}
      for(const s of b.spikes){ctx2d.fillStyle='#f4f7fb';ctx2d.strokeStyle='#9fb4c9';ctx2d.lineWidth=1;const n=3,sw=s.w/n;for(let i=0;i<n;i++){ctx2d.beginPath();if(s.type==='floor'){ctx2d.moveTo(s.x+i*sw,s.y+s.h);ctx2d.lineTo(s.x+i*sw+sw/2,s.y);ctx2d.lineTo(s.x+i*sw+sw,s.y+s.h)}else{ctx2d.moveTo(s.x+i*sw,s.y);ctx2d.lineTo(s.x+i*sw+sw/2,s.y+s.h);ctx2d.lineTo(s.x+i*sw+sw,s.y)}ctx2d.closePath();ctx2d.fill();ctx2d.stroke()}}
      for(const cp of level.checkpoints){ctx2d.strokeStyle='#555';ctx2d.lineWidth=3;ctx2d.beginPath();ctx2d.moveTo(cp.x,cp.y+18);ctx2d.lineTo(cp.x,cp.y-22);ctx2d.stroke();ctx2d.fillStyle=cp.active?'#4ddb7a':'#ff8f4d';ctx2d.beginPath();ctx2d.moveTo(cp.x,cp.y-22);ctx2d.lineTo(cp.x+18,cp.y-16);ctx2d.lineTo(cp.x,cp.y-10);ctx2d.closePath();ctx2d.fill()}
      const t=timeAccum;for(const ring of level.rings){if(ring.collected)continue;const bob=Math.sin(t*3+ring.id)*3;ctx2d.save();ctx2d.translate(ring.x,ring.y+bob);ctx2d.strokeStyle='#ffd23f';ctx2d.lineWidth=6;ctx2d.beginPath();ctx2d.arc(0,0,9,0,Math.PI*2);ctx2d.stroke();ctx2d.strokeStyle='#fff3c4';ctx2d.lineWidth=2;ctx2d.beginPath();ctx2d.arc(-2,-2,6,0,Math.PI*2);ctx2d.stroke();ctx2d.restore()}
      ctx2d.strokeStyle='rgba(10,20,40,0.18)';ctx2d.lineWidth=2
      for(const p of level.platforms){const color=p.axis==='x'?['#3aa3ff','#0d5fb8']:['#b06bff','#6f2fc9'];drawPlatform(p.x,p.y,p.w,p.h,color)}
      for(const f of level.fallers){if(f.state==='respawning')continue;const alpha=f.state==='falling'?0.5:1;ctx2d.globalAlpha=alpha;drawPlatform(f.x,f.y,f.w,f.h,['#ffb84d','#c9701e']);ctx2d.globalAlpha=1}
      for(const c of level.crushers){const pos=platformPos(c,t);ctx2d.fillStyle='#8a8f9c';ctx2d.strokeStyle='#4a4e58';ctx2d.lineWidth=2;const cx0=pos.x-c.w/2,cy0=pos.y;roundRect(cx0,cy0,c.w,c.h,4);ctx2d.fill();ctx2d.stroke();ctx2d.fillStyle='#e05555';for(let i=0;i<3;i++){ctx2d.fillRect(cx0+6+i*(c.w-12)/3,cy0+c.h-6,(c.w-12)/3-4,4)}}
      if(b.exit){const ex=b.exit;const ready=ringsCollected>=level.required;ctx2d.fillStyle=ready?'#2fbf5f':'#2a7d47';roundRect(ex.x,ex.y,ex.w,ex.h,8);ctx2d.fill();ctx2d.strokeStyle='#134a26';ctx2d.lineWidth=4;roundRect(ex.x,ex.y,ex.w,ex.h,8);ctx2d.stroke();ctx2d.fillStyle='#eafff0';ctx2d.beginPath();ctx2d.arc(ex.x+ex.w/2,ex.y+ex.h/2,8,0,Math.PI*2);ctx2d.fill();if(ready){ctx2d.shadowColor='#7dffb0';ctx2d.shadowBlur=20;roundRect(ex.x,ex.y,ex.w,ex.h,8);ctx2d.stroke();ctx2d.shadowBlur=0}}
      drawBall();drawParticles();ctx2d.restore()
    }

    let lastT=performance.now()
    function loop(now){const dt=Math.min((now-lastT)/1000,0.033);lastT=now;if(state==='playing')updatePhysics(dt);if(state==='playing'||state==='paused')draw();requestAnimationFrame(loop)}
    requestAnimationFrame(loop)

    function showPanel(id){document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));if(id)document.getElementById(id)?.classList.remove('hidden')}
    function enterMenu(){state='menu';showPanel('menuPanel');hudRef.current?.classList.add('hidden');touchRef.current?.classList.add('hidden');Audio1.playMusic()}
    function enterLevelSelect(){state='levelSelect';buildLevelGrid();showPanel('levelSelectPanel')}
    function enterPlaying(idx){loadLevel(idx);state='playing';showPanel(null);hudRef.current?.classList.remove('hidden');touchRef.current?.classList.remove('hidden');if(msgRef.current)msgRef.current.style.opacity='0'}
    function enterPaused(){state='paused';showPanel('pausePanel')}
    function enterResume(){state='playing';showPanel(null)}
    function enterGameOver(){state='gameover';Audio1.sfx.gameOver();Haptics.gameOver();FlashFX.gameOver();if(gameOverTextRef.current)gameOverTextRef.current.textContent='You ran out of lives in '+level.name+'.';showPanel('gameOverPanel')}
    function enterComplete(){
      state='complete';Audio1.sfx.door();Audio1.sfx.victory();Haptics.win();FlashFX.win()
      spawnBurst(ball.x,ball.y,'#ffd23f',24,{speed:5,life:0.9,size:3.5,upBias:3})
      const frac=ringsCollected/level.total;let s=frac>=0.95?3:(frac>=0.7?2:1);stars=s
      progress.stars[currentLevelIndex]=Math.max(progress.stars[currentLevelIndex]||0,s);progress.unlocked=Math.max(progress.unlocked,Math.min(currentLevelIndex+1,5));saveProgress()
      const isFinalLevel=currentLevelIndex>=5
      if(completeTitleRef.current)completeTitleRef.current.textContent=isFinalLevel?'GAME COMPLETE!':'LEVEL COMPLETE!'
      if(completeSubRef.current)completeSubRef.current.textContent=isFinalLevel?"You've cleared all 5 levels of Bounce Quest!":''
      if(completeSubRef.current)completeSubRef.current.style.display=isFinalLevel?'block':'none'
      if(completeStarsRef.current)completeStarsRef.current.textContent='\u2b50'.repeat(s)+'\u2606'.repeat(3-s)
      if(completeRingsRef.current)completeRingsRef.current.textContent='Rings: '+ringsCollected+'/'+level.total
      if(nextLevelRef.current)nextLevelRef.current.style.display=currentLevelIndex<5?'block':'none'
      showPanel('completePanel');spawnConfetti();if(isFinalLevel)spawnConfetti()
      try{onCompleteRef.current?.({type:'bounce-complete',level:currentLevelIndex,stars:s,rings:ringsCollected,total:level.total})}catch(e){}
    }
    function spawnConfetti(){const layer=confettiRef.current;if(!layer)return;layer.innerHTML='';const colors=['#ffd23f','#4ddb7a','#3aa3ff','#ff6b6b','#c98fff'];for(let i=0;i<60;i++){const el=document.createElement('div');el.className='confetti-piece';const w=4+Math.random()*5,h=w*(1+Math.random());el.style.width=w+'px';el.style.height=h+'px';el.style.left=(Math.random()*100)+'%';el.style.background=colors[Math.floor(Math.random()*colors.length)];el.style.animationDuration=(2+Math.random()*1.6).toFixed(2)+'s';el.style.animationDelay=(Math.random()*0.5).toFixed(2)+'s';layer.appendChild(el)}}

    function buildLevelGrid(){const grid=levelGridRef.current;if(!grid)return;grid.innerHTML='';for(let i=1;i<=5;i++){const card=document.createElement('div');const locked=i>progress.unlocked;card.className='levelCard'+(locked?' locked':'');const st=progress.stars[i]||0;card.innerHTML='<div class="num">'+i+'</div><div class="stars">'+(locked?'\ud83d\udd12':'\u2b50'.repeat(st)+'\u2606'.repeat(3-st))+'</div>';if(!locked)card.addEventListener('click',()=>{Audio1.sfx.click();Haptics.tap();enterPlaying(i)});grid.appendChild(card)}}

    function onKeyDown(e){if(['ArrowLeft','a','A'].includes(e.key))keys.left=true;if(['ArrowRight','d','D'].includes(e.key))keys.right=true;if(['ArrowUp','w','W',' '].includes(e.key)){keys.up=true;requestJump();if(e.key===' ')e.preventDefault()}if(e.key==='Escape'||e.key==='p'||e.key==='P'){if(state==='playing')enterPaused();else if(state==='paused')enterResume()}}
    function onKeyUp(e){if(['ArrowLeft','a','A'].includes(e.key))keys.left=false;if(['ArrowRight','d','D'].includes(e.key))keys.right=false;if(['ArrowUp','w','W',' '].includes(e.key))keys.up=false}
    window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp)

    // Swipe / drag joystick: touch-and-drag left-right anywhere on screen to move,
    // a quick tap jumps, and swiping upward jumps too.
    const MOVE_THRESHOLD=10,JOY_MAX_RADIUS=46,SWIPE_JUMP_DY=-38
    let touchId=null,touchActive=false,touchStartX=0,touchStartY=0,touchMoved=false,touchJumped=false

    function showJoy(x,y){const base=joyBaseRef.current,knob=joyKnobRef.current;if(!base||!knob)return;base.style.transform='translate('+x+'px,'+y+'px)';base.style.opacity='1';knob.style.transform='translate('+x+'px,'+y+'px)';knob.style.opacity='1'}
    function moveJoyKnob(x,y,ox,oy){const knob=joyKnobRef.current;if(!knob)return;let dx=x-ox,dy=y-oy;const dist=Math.hypot(dx,dy);if(dist>JOY_MAX_RADIUS){dx=dx/dist*JOY_MAX_RADIUS;dy=dy/dist*JOY_MAX_RADIUS}knob.style.transform='translate('+(ox+dx)+'px,'+(oy+dy)+'px)'}
    function hideJoy(){const base=joyBaseRef.current,knob=joyKnobRef.current;if(base)base.style.opacity='0';if(knob)knob.style.opacity='0'}

    function touchXY(t){const rect=touchRef.current?touchRef.current.getBoundingClientRect():{left:0,top:0};return{x:t.clientX-rect.left,y:t.clientY-rect.top}}

    function onTouchStart(e){
      if(state!=='playing'||touchActive)return
      const t=e.changedTouches[0];touchId=t.identifier;touchActive=true;touchMoved=false;touchJumped=false
      const p=touchXY(t);touchStartX=p.x;touchStartY=p.y
      showJoy(touchStartX,touchStartY)
      e.preventDefault()
    }
    function onTouchMove(e){
      if(!touchActive)return
      let t=null;for(let i=0;i<e.changedTouches.length;i++){if(e.changedTouches[i].identifier===touchId){t=e.changedTouches[i];break}}
      if(!t)return
      const p=touchXY(t);const dx=p.x-touchStartX,dy=p.y-touchStartY
      moveJoyKnob(p.x,p.y,touchStartX,touchStartY)
      if(Math.abs(dx)>MOVE_THRESHOLD){touchMoved=true;keys.right=dx>0;keys.left=dx<0}else{keys.left=false;keys.right=false}
      if(!touchJumped&&dy<SWIPE_JUMP_DY){touchJumped=true;touchMoved=true;requestJump();Haptics.tap()}
      e.preventDefault()
    }
    function onTouchEnd(e){
      let ended=false;for(let i=0;i<e.changedTouches.length;i++){if(e.changedTouches[i].identifier===touchId)ended=true}
      if(!ended)return
      touchActive=false;keys.left=false;keys.right=false;hideJoy()
      if(!touchMoved){requestJump();Haptics.tap()}
      e.preventDefault()
    }
    const touchLayerEl=touchRef.current
    if(touchLayerEl){
      touchLayerEl.addEventListener('touchstart',onTouchStart,{passive:false})
      touchLayerEl.addEventListener('touchmove',onTouchMove,{passive:false})
      touchLayerEl.addEventListener('touchend',onTouchEnd,{passive:false})
      touchLayerEl.addEventListener('touchcancel',onTouchEnd,{passive:false})
    }

    let soundOn=true,hapticsOn=Haptics.isEnabled()
    const clickFx=()=>{Audio1.sfx.click();Haptics.tap()}
    document.getElementById('playBtn')?.addEventListener('click',()=>{clickFx();enterLevelSelect()})
    document.getElementById('backToMenuBtn')?.addEventListener('click',()=>{clickFx();enterMenu()})
    document.getElementById('pauseBtn')?.addEventListener('click',()=>{clickFx();enterPaused()})
    document.getElementById('resumeBtn')?.addEventListener('click',()=>{clickFx();enterResume()})
    document.getElementById('restartBtn')?.addEventListener('click',()=>{clickFx();enterPlaying(currentLevelIndex)})
    document.getElementById('levelsFromPauseBtn')?.addEventListener('click',()=>{clickFx();enterLevelSelect()})
    document.getElementById('quitBtn')?.addEventListener('click',()=>{clickFx();enterMenu()})
    document.getElementById('retryBtn')?.addEventListener('click',()=>{clickFx();enterPlaying(currentLevelIndex)})
    document.getElementById('gameOverLevelsBtn')?.addEventListener('click',()=>{clickFx();enterLevelSelect()})
    document.getElementById('nextLevelBtn')?.addEventListener('click',()=>{clickFx();enterPlaying(Math.min(currentLevelIndex+1,5))})
    document.getElementById('completeLevelsBtn')?.addEventListener('click',()=>{clickFx();enterLevelSelect()})
    document.getElementById('completeHomeBtn')?.addEventListener('click',()=>{clickFx();enterMenu()})
    document.getElementById('resetBtn')?.addEventListener('click',async()=>{clickFx();progress={unlocked:1,stars:{1:0,2:0,3:0,4:0,5:0},sound:true,haptics:true};await saveProgress();showMsgTop('Progress reset.')})
    document.getElementById('soundBtn')?.addEventListener('click',(e)=>{soundOn=!soundOn;Audio1.setMuted(!soundOn);Haptics.tap();e.target.textContent=soundOn?'\ud83d\udd0a SOUND: ON':'\ud83d\udd07 SOUND: OFF';progress.sound=soundOn;saveProgress()})
    document.getElementById('hapticsBtn')?.addEventListener('click',(e)=>{hapticsOn=!hapticsOn;Haptics.setEnabled(hapticsOn);e.target.textContent=hapticsOn?'\ud83d\udcf3 HAPTICS: ON':'\ud83d\udcf1 HAPTICS: OFF';progress.haptics=hapticsOn;saveProgress()})

    ;(async function boot(){await loadProgress();soundOn=progress.sound!==false;hapticsOn=progress.haptics!==false;Haptics.setEnabled(hapticsOn);if(soundBtnRef.current)soundBtnRef.current.textContent=soundOn?'\ud83d\udd0a SOUND: ON':'\ud83d\udd07 SOUND: OFF';if(hapticsBtnRef.current)hapticsBtnRef.current.textContent=hapticsOn?'\ud83d\udcf3 HAPTICS: ON':'\ud83d\udcf1 HAPTICS: OFF';if(!soundOn)Audio1.setMuted(true);enterMenu()})()

    return()=>{window.removeEventListener('resize',resize);window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);if(touchLayerEl){touchLayerEl.removeEventListener('touchstart',onTouchStart);touchLayerEl.removeEventListener('touchmove',onTouchMove);touchLayerEl.removeEventListener('touchend',onTouchEnd);touchLayerEl.removeEventListener('touchcancel',onTouchEnd)}}
  },[])

  return(
    <>
      <style>{BOUNCE_CSS}</style>
      <div className="bq-root" ref={wrapRef}>
        <canvas ref={canvasRef} className="bq-canvas" />
        <div id="flashOverlay" />
        <div id="hud" className="hidden" ref={hudRef}>
          <div className="box">{'\ud83d\udc8d'} <span ref={ringCountRef}>0</span>/<span ref={ringTotalRef}>0</span></div>
          <div className="box">{'\u2764'} <span ref={livesCountRef}>3</span></div>
          <div className="box" id="pauseBtn">{'\u23f8'}</div>
        </div>
        <div id="msgFloat" ref={msgRef} />
        <div id="touchLayer" className="hidden" ref={touchRef}>
          <div className="joyBase" ref={joyBaseRef} />
          <div className="joyKnob" ref={joyKnobRef} />
          <div id="touchHint"><div>DRAG LEFT/RIGHT TO MOVE</div><div>TAP OR SWIPE UP TO JUMP</div></div>
        </div>
        <div id="loadingPanel" className="panel" ref={loadingRef}>
          <h1 className="title">BOUNCE QUEST</h1>
          <div className="subtitle">loading save data...</div>
        </div>
        <div id="menuPanel" className="panel hidden" ref={menuRef}>
          <h1 className="title">BOUNCE QUEST</h1>
          <div className="subtitle">a rolling-ball platform adventure</div>
          <button className="btn green" id="playBtn">{'\u25b6'} PLAY</button>
          <button className="btn" id="soundBtn" ref={soundBtnRef}>{'\ud83d\udd0a'} SOUND: ON</button>
          <button className="btn" id="hapticsBtn" ref={hapticsBtnRef}>{'\ud83d\udcf3'} HAPTICS: ON</button>
          <button className="btn red" id="resetBtn">RESET PROGRESS</button>
          <div className="small-note">Arrow keys / WASD to move, UP or SPACE to jump (double jump - one in the air, resets when you land). On touch devices, drag left or right anywhere to move, and tap or swipe up to jump. Roll into rings, avoid spikes and crushers, ride the moving platforms across the gaps, and reach the green door. You're briefly invincible right after a respawn.</div>
        </div>
        <div id="levelSelectPanel" className="panel hidden" ref={levelSelectRef}>
          <h1 className="title" style={{fontSize:'24px'}}>SELECT LEVEL</h1>
          <div className="levelGrid" ref={levelGridRef} />
          <button className="btn small" id="backToMenuBtn">{'\u25c0'} BACK</button>
        </div>
        <div id="pausePanel" className="panel hidden" ref={pausePanelRef}>
          <h1 className="title" style={{fontSize:'26px'}}>PAUSED</h1>
          <button className="btn green" id="resumeBtn">{'\u25b6'} RESUME</button>
          <button className="btn" id="restartBtn">{'\u27f2'} RESTART LEVEL</button>
          <button className="btn" id="levelsFromPauseBtn">{'\u2630'} LEVEL SELECT</button>
          <button className="btn red" id="quitBtn">{'\u2715'} MAIN MENU</button>
        </div>
        <div id="gameOverPanel" className="panel hidden" ref={gameOverRef}>
          <h1 className="title" style={{color:'#ff6b6b',textShadow:'4px 4px 0 #7a1414'}}>GAME OVER</h1>
          <div className="subtitle" ref={gameOverTextRef}>You ran out of lives.</div>
          <button className="btn green" id="retryBtn">{'\u27f2'} TRY AGAIN</button>
          <button className="btn" id="gameOverLevelsBtn">{'\u2630'} LEVEL SELECT</button>
        </div>
        <div id="completePanel" className="panel hidden" ref={completeRef}>
          <div id="confettiLayer" ref={confettiRef} />
          <h1 className="title" style={{color:'#4ddb7a',textShadow:'4px 4px 0 #0c5c26'}} ref={completeTitleRef}>LEVEL COMPLETE!</h1>
          <div className="subtitle" ref={completeSubRef} style={{display:'none'}} />
          <div className="subtitle" ref={completeStarsRef}>{'\u2b50\u2b50\u2b50'}</div>
          <div className="subtitle" ref={completeRingsRef}>Rings: 0/0</div>
          <button className="btn green" id="nextLevelBtn" ref={nextLevelRef}>{'\u25b6'} NEXT LEVEL</button>
          <button className="btn" id="completeLevelsBtn">{'\u2630'} LEVEL SELECT</button>
          <button className="btn red" id="completeHomeBtn">{'\ud83c\udfe0'} HOME</button>
        </div>
      </div>
    </>
  )
}