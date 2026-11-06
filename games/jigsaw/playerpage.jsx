import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

function playTick() {
  try {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(600, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    o.start(); o.stop(ctx.currentTime + 0.06);
  } catch(e) {}
}

function playSnap() {
  try {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.04);
    o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.22, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    o.start(); o.stop(ctx.currentTime + 0.14);
  } catch(e) {}
}

function playWin() {
  try {
    const ctx = getAudioCtx();
    [0, 0.1, 0.2, 0.35, 0.5].forEach((t, i) => {
      const freqs = [523, 659, 784, 1047, 1319];
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freqs[i];
      g.gain.setValueAtTime(0, ctx.currentTime + t);
      g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.28);
    });
  } catch(e) {}
}

function vibrate(ms = 30) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch(e) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// PUZZLE PIECE SHAPE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function getPieceEdges(col, row, cols, rows, edgeMap) {
  return {
    top:    row === 0      ? 0 :  edgeMap[`${row-1},${col},v`],
    right:  col === cols-1 ? 0 :  edgeMap[`${row},${col},h`],
    bottom: row === rows-1 ? 0 : -edgeMap[`${row},${col},v`],
    left:   col === 0      ? 0 : -edgeMap[`${row},${col-1},h`],
  };
}

function buildEdgeMap(cols, rows) {
  const map = {};
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols-1; c++)
      map[`${r},${c},h`] = Math.random() > 0.5 ? 1 : -1;
  for (let r = 0; r < rows-1; r++)
    for (let c = 0; c < cols; c++)
      map[`${r},${c},v`] = Math.random() > 0.5 ? 1 : -1;
  return map;
}

const TAB  = 0.28;
const NECK = 0.15;

function drawPiecePath(ctx, x, y, w, h, edges) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  if (edges.top === 0) { ctx.lineTo(x+w, y); }
  else {
    const t = edges.top;
    ctx.lineTo(x+w*0.35, y);
    ctx.bezierCurveTo(x+w*(0.35-NECK), y-t*h*NECK, x+w*(0.5-TAB), y-t*h*TAB, x+w*0.5, y-t*h*TAB);
    ctx.bezierCurveTo(x+w*(0.5+TAB), y-t*h*TAB, x+w*(0.65+NECK), y-t*h*NECK, x+w*0.65, y);
    ctx.lineTo(x+w, y);
  }
  if (edges.right === 0) { ctx.lineTo(x+w, y+h); }
  else {
    const t = edges.right;
    ctx.lineTo(x+w, y+h*0.35);
    ctx.bezierCurveTo(x+w+t*w*NECK, y+h*(0.35-NECK), x+w+t*w*TAB, y+h*(0.5-TAB), x+w+t*w*TAB, y+h*0.5);
    ctx.bezierCurveTo(x+w+t*w*TAB, y+h*(0.5+TAB), x+w+t*w*NECK, y+h*(0.65+NECK), x+w, y+h*0.65);
    ctx.lineTo(x+w, y+h);
  }
  if (edges.bottom === 0) { ctx.lineTo(x, y+h); }
  else {
    const t = edges.bottom;
    ctx.lineTo(x+w*0.65, y+h);
    ctx.bezierCurveTo(x+w*(0.65+NECK), y+h+t*h*NECK, x+w*(0.5+TAB), y+h+t*h*TAB, x+w*0.5, y+h+t*h*TAB);
    ctx.bezierCurveTo(x+w*(0.5-TAB), y+h+t*h*TAB, x+w*(0.35-NECK), y+h+t*h*NECK, x+w*0.35, y+h);
    ctx.lineTo(x, y+h);
  }
  if (edges.left === 0) { ctx.lineTo(x, y); }
  else {
    const t = edges.left;
    ctx.lineTo(x, y+h*0.65);
    ctx.bezierCurveTo(x-t*w*NECK, y+h*(0.65+NECK), x-t*w*TAB, y+h*(0.5+TAB), x-t*w*TAB, y+h*0.5);
    ctx.bezierCurveTo(x-t*w*TAB, y+h*(0.5-TAB), x-t*w*NECK, y+h*(0.35-NECK), x, y+h*0.35);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function buildPieceCanvas(fullCanvas, col, row, tileW, tileH, edges) {
  const pad = Math.ceil(Math.max(tileW, tileH) * TAB);
  const cw = tileW + pad*2, ch = tileH + pad*2;
  const pc = document.createElement("canvas");
  pc.width = cw; pc.height = ch;
  const ctx = pc.getContext("2d");
  ctx.save();
  drawPiecePath(ctx, pad, pad, tileW, tileH, edges);
  ctx.clip();
  ctx.drawImage(fullCanvas, col*tileW-pad, row*tileH-pad, cw, ch, 0, 0, cw, ch);
  ctx.restore();
  // subtle inner shadow only, no outer border
  ctx.save();
  drawPiecePath(ctx, pad, pad, tileW, tileH, edges);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
  return pc;
}

const DIFFS = { easy:{cols:3,rows:3}, medium:{cols:4,rows:4}, hard:{cols:5,rows:5} };

function fmtTime(s) { return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`; }

function drawImageToCanvas(canvas, img, w, h) {
  if (!canvas || !img) return;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  if (!ctx) return;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = w / h;
  let drawW, drawH, offsetX, offsetY;
  if (imgAspect > canvasAspect) {
    drawH = h;
    drawW = h * imgAspect;
    offsetX = (w - drawW) / 2;
    offsetY = 0;
  } else {
    drawW = w;
    drawH = w / imgAspect;
    offsetX = 0;
    offsetY = (h - drawH) / 2;
  }
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFETTI
// ─────────────────────────────────────────────────────────────────────────────
function useConfetti(active) {
  const canvasRef=useRef(null), rafRef=useRef(null), particlesRef=useRef([]);
  useEffect(()=>{
    if(!active) return;
    const canvas=canvasRef.current; if(!canvas) return;
    canvas.width=window.innerWidth; canvas.height=window.innerHeight;
    const colors=["#2ecfb8","#f5c842","#ff6fa8","#42a5f5","#ef5350","#ab47bc"];
    particlesRef.current=Array.from({length:140},()=>({x:Math.random()*window.innerWidth,y:-20,w:8+Math.random()*8,h:4+Math.random()*4,color:colors[Math.floor(Math.random()*colors.length)],vy:2+Math.random()*3,vx:(Math.random()-0.5)*3,rot:Math.random()*360,vr:(Math.random()-0.5)*8}));
    const animate=()=>{
      const ctx=canvas.getContext("2d"); ctx.clearRect(0,0,canvas.width,canvas.height);
      particlesRef.current.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();});
      particlesRef.current=particlesRef.current.filter(p=>p.y<canvas.height+20);
      if(particlesRef.current.length>0) rafRef.current=requestAnimationFrame(animate);
      else { const c2=canvas.getContext("2d"); c2.clearRect(0,0,canvas.width,canvas.height); }
    };
    rafRef.current=requestAnimationFrame(animate);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[active]);
  return canvasRef;
}

// ─────────────────────────────────────────────────────────────────────────────
// BREAK & SCATTER ANIMATION
// Phase 1 (0–600ms): image shown on board, fracture lines appear
// Phase 2 (600–2200ms): each shaped piece flies outward with bounce, then settles into tray
// ─────────────────────────────────────────────────────────────────────────────
function BreakAnimation({ fullCanvas, pieces, tileW, tileH, boardW, boardH, boardOffsetX, boardOffsetY, onDone }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fullCanvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");

    const pad = Math.ceil(Math.max(tileW, tileH) * TAB);
    const psize = Math.min(tileW, tileH, 80);
    const trayAreaW = window.innerWidth - 16;
    const cols2 = Math.max(1, Math.floor((trayAreaW) / (psize + 8)));

    // Tray destination (bottom tray) for each piece
    const trayBottomStart = window.innerHeight - 130;
    const trayPositions = pieces.map((_, i) => ({
      x: 8 + (i % cols2) * (psize + 8) + psize / 2,
      y: trayBottomStart + 8 + Math.floor(i / cols2) * (psize + 8) + psize / 2,
    }));

    const numCols = pieces.reduce((mx,p)=>Math.max(mx,p.col),0)+1;
    const numRows = pieces.reduce((mx,p)=>Math.max(mx,p.row),0)+1;
    const boardCenterX = boardOffsetX + boardW / 2;
    const boardCenterY = boardOffsetY + boardH / 2;

    // Per-piece state: explode outward then curve to tray
    const state = pieces.map((p, i) => {
      const pCenterX = boardOffsetX + p.col * tileW + tileW / 2;
      const pCenterY = boardOffsetY + p.row * tileH + tileH / 2;
      const dx = pCenterX - boardCenterX;
      const dy = pCenterY - boardCenterY;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      return {
        piece: p,
        homeX: pCenterX,
        homeY: pCenterY,
        trayX: trayPositions[i].x,
        trayY: trayPositions[i].y,
        // explosion direction
        explodeX: pCenterX + (dx / dist) * (60 + Math.random() * 40),
        explodeY: pCenterY + (dy / dist) * (60 + Math.random() * 40),
        staggerDelay: i * 40 + Math.random() * 30,
        rot: (Math.random() - 0.5) * 30,
      };
    });

    const START = performance.now();
    const CRACK_DUR = 500;
    const EXPLODE_DUR = 300;
    const SETTLE_DUR = 1400;
    const TOTAL = CRACK_DUR + EXPLODE_DUR + SETTLE_DUR + 200;

    function easeInOut(t) { return t<0.5 ? 2*t*t : -1+(4-2*t)*t; }
    function easeOut(t)   { return 1 - (1-t)*(1-t); }
    function easeIn(t)    { return t*t; }
    function lerp(a,b,t)  { return a+(b-a)*t; }

    // Bezier curve lerp through a midpoint
    function bezierLerp(ax,ay, bx,by, cx,cy, t) {
      const ab_x = lerp(ax,bx,t), ab_y = lerp(ay,by,t);
      const bc_x = lerp(bx,cx,t), bc_y = lerp(by,cy,t);
      return { x: lerp(ab_x,bc_x,t), y: lerp(ab_y,bc_y,t) };
    }

    function drawCracks(alpha) {
      ctx.save();
      pieces.forEach(p => {
        const x = boardOffsetX + p.col * tileW;
        const y = boardOffsetY + p.row * tileH;
        const e = p.edges;
        if (e.right !== 0 && p.col < numCols - 1) {
          const t = e.right;
          ctx.beginPath();
          ctx.moveTo(x+tileW, y+tileH*0.35);
          ctx.bezierCurveTo(x+tileW+t*tileW*NECK, y+tileH*(0.35-NECK), x+tileW+t*tileW*TAB, y+tileH*(0.5-TAB), x+tileW+t*tileW*TAB, y+tileH*0.5);
          ctx.bezierCurveTo(x+tileW+t*tileW*TAB, y+tileH*(0.5+TAB), x+tileW+t*tileW*NECK, y+tileH*(0.65+NECK), x+tileW, y+tileH*0.65);
          ctx.strokeStyle = `rgba(255,255,255,${alpha*0.85})`;
          ctx.lineWidth = 2.5; ctx.stroke();
          ctx.strokeStyle = `rgba(0,0,0,${alpha*0.5})`;
          ctx.lineWidth = 0.8; ctx.stroke();
        } else if (e.right === 0 && p.col < numCols - 1) {
          ctx.beginPath(); ctx.moveTo(x+tileW, y); ctx.lineTo(x+tileW, y+tileH);
          ctx.strokeStyle = `rgba(255,255,255,${alpha*0.85})`; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.strokeStyle = `rgba(0,0,0,${alpha*0.5})`; ctx.lineWidth = 0.8; ctx.stroke();
        }
        if (e.bottom !== 0 && p.row < numRows - 1) {
          const t = e.bottom;
          ctx.beginPath();
          ctx.moveTo(x+tileW*0.65, y+tileH);
          ctx.bezierCurveTo(x+tileW*(0.65+NECK), y+tileH+t*tileH*NECK, x+tileW*(0.5+TAB), y+tileH+t*tileH*TAB, x+tileW*0.5, y+tileH+t*tileH*TAB);
          ctx.bezierCurveTo(x+tileW*(0.5-TAB), y+tileH+t*tileH*TAB, x+tileW*(0.35-NECK), y+tileH+t*tileH*NECK, x+tileW*0.35, y+tileH);
          ctx.strokeStyle = `rgba(255,255,255,${alpha*0.85})`; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.strokeStyle = `rgba(0,0,0,${alpha*0.5})`; ctx.lineWidth = 0.8; ctx.stroke();
        } else if (e.bottom === 0 && p.row < numRows - 1) {
          ctx.beginPath(); ctx.moveTo(x, y+tileH); ctx.lineTo(x+tileW, y+tileH);
          ctx.strokeStyle = `rgba(255,255,255,${alpha*0.85})`; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.strokeStyle = `rgba(0,0,0,${alpha*0.5})`; ctx.lineWidth = 0.8; ctx.stroke();
        }
      });
      ctx.restore();
    }

    function render(now) {
      const elapsed = now - START;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (elapsed < CRACK_DUR) {
        // Phase 1: show image, cracks appear
        const t = elapsed / CRACK_DUR;
        ctx.drawImage(fullCanvas, boardOffsetX, boardOffsetY, boardW, boardH);
        const crackAlpha = easeInOut(Math.min(t * 1.5, 1));
        drawCracks(crackAlpha);

        // flash white on crack appear
        if (t > 0.6 && t < 0.85) {
          const flashT = (t - 0.6) / 0.25;
          ctx.save();
          ctx.globalAlpha = Math.sin(flashT * Math.PI) * 0.25;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(boardOffsetX, boardOffsetY, boardW, boardH);
          ctx.restore();
        }

      } else if (elapsed < CRACK_DUR + EXPLODE_DUR) {
        // Phase 2: pieces explode outward (short burst)
        const globalT = (elapsed - CRACK_DUR) / EXPLODE_DUR;

        state.forEach(s => {
          const et = easeOut(Math.max(0, Math.min(1, globalT)));
          const x = lerp(s.homeX, s.explodeX, et);
          const y = lerp(s.homeY, s.explodeY, et);
          const pc = s.piece.canvas;
          const scale = lerp(1, 1.15, et);
          const dw = pc.width * scale, dh = pc.height * scale;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((s.rot * et) * Math.PI / 180);
          ctx.globalAlpha = 1;
          ctx.drawImage(pc, -dw/2, -dh/2, dw, dh);
          ctx.restore();
        });

      } else if (elapsed < CRACK_DUR + EXPLODE_DUR + SETTLE_DUR) {
        // Phase 3: pieces arc to tray — curved path, shrink, staggered
        const settleElapsed = elapsed - CRACK_DUR - EXPLODE_DUR;

        state.forEach(s => {
          const raw = (settleElapsed - s.staggerDelay) / (SETTLE_DUR * 0.65);
          const t = Math.max(0, Math.min(1, raw));

          if (t === 0) {
            // Still at exploded position
            const pc = s.piece.canvas;
            ctx.save();
            ctx.translate(s.explodeX, s.explodeY);
            ctx.rotate(s.rot * Math.PI / 180);
            ctx.drawImage(pc, -pc.width*0.575, -pc.height*0.575, pc.width*1.15, pc.height*1.15);
            ctx.restore();
          } else {
            // Arc path: explode -> mid-arc (above) -> tray
            const arcMidX = (s.explodeX + s.trayX) / 2;
            const arcMidY = Math.min(s.explodeY, s.trayY) - 80;

            const et = easeInOut(t);
            const pos = bezierLerp(s.explodeX, s.explodeY, arcMidX, arcMidY, s.trayX, s.trayY, et);

            const startScale = 1.15;
            const targetScale = psize / Math.max(s.piece.canvas.width, s.piece.canvas.height);
            const scale = lerp(startScale, targetScale, easeIn(t));
            const rot = lerp(s.rot, 0, et);

            const pc = s.piece.canvas;
            const dw = pc.width * scale, dh = pc.height * scale;
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(rot * Math.PI / 180);
            ctx.globalAlpha = 1;
            ctx.drawImage(pc, -dw/2, -dh/2, dw, dh);
            ctx.restore();
          }
        });

      } else {
        cancelAnimationFrame(rafRef.current);
        onDone();
        return;
      }

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:50 }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOARD CANVAS — slots with ghost image at 0.2 opacity by default
// ─────────────────────────────────────────────────────────────────────────────
function BoardCanvas({ pieces, pieceMap, cols, rows, tileW, tileH, boardW, boardH, fullCanvas, dropTarget, onDragOver, onDragLeave }) {
  const canvasRef = useRef(null);
  const pad = Math.ceil(Math.max(tileW, tileH) * TAB);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if(!canvas) return;
    canvas.width = boardW; canvas.height = boardH;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0d1f2d";
    ctx.fillRect(0, 0, boardW, boardH);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c*tileW, y = r*tileH;
        const id = r*cols+c;
        const pieceData = pieceMap[id];
        const placed = pieces.find(p => p.placed && p.row===r && p.col===c);

        if (placed) {
          ctx.drawImage(placed.canvas, 0,0,placed.canvas.width,placed.canvas.height, x-pad, y-pad, placed.canvas.width, placed.canvas.height);
        } else {
          // Draw ghost image (0.2 opacity always)
          ctx.save();
          if (pieceData) drawPiecePath(ctx, x, y, tileW, tileH, pieceData.edges);
          else { ctx.beginPath(); ctx.rect(x,y,tileW,tileH); }
          if (fullCanvas) {
            ctx.clip();
            ctx.globalAlpha = 0.20;
            ctx.drawImage(fullCanvas, x, y, tileW, tileH, x, y, tileW, tileH);
            ctx.globalAlpha = 1;
          }
          ctx.restore();

          // Slot outline — very subtle
          ctx.save();
          if (pieceData) drawPiecePath(ctx, x, y, tileW, tileH, pieceData.edges);
          else { ctx.beginPath(); ctx.rect(x,y,tileW,tileH); }
          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Drop target highlight
    if (dropTarget) {
      const { col, row } = dropTarget;
      const x = col*tileW, y = row*tileH;
      const id = row*cols+col;
      const pieceData = pieceMap[id];
      ctx.save();
      if (pieceData) drawPiecePath(ctx, x, y, tileW, tileH, pieceData.edges);
      else { ctx.beginPath(); ctx.rect(x,y,tileW,tileH); }
      ctx.strokeStyle = "rgba(46,207,184,0.9)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "rgba(46,207,184,0.18)";
      ctx.fill();
      ctx.restore();
    }
  }, [pieces, pieceMap, cols, rows, tileW, tileH, boardW, boardH, fullCanvas, dropTarget, pad]);

  useEffect(()=>{ draw(); },[draw]);

  const getCell = (e) => {
    const canvas=canvasRef.current; if(!canvas) return null;
    const rect=canvas.getBoundingClientRect();
    const { clientX, clientY }=e.touches?e.touches[0]:e;
    const scaleX=boardW/rect.width, scaleY=boardH/rect.height;
    const col=Math.floor(((clientX-rect.left)*scaleX)/tileW);
    const row=Math.floor(((clientY-rect.top)*scaleY)/tileH);
    if(col>=0&&col<cols&&row>=0&&row<rows) return {col,row};
    return null;
  };

  return (
    <canvas ref={canvasRef}
      data-board-canvas="true"
      style={{borderRadius:12,boxShadow:"0 0 0 3px rgba(46,207,184,0.2),0 8px 40px rgba(0,0,0,0.6)",display:"block",cursor:"default",touchAction:"none",maxWidth:"100%",maxHeight:"100%",width:"auto",height:"auto"}}
      onMouseMove={e=>onDragOver(getCell(e))}
      onMouseLeave={()=>onDragLeave()}
      onTouchMove={e=>{e.preventDefault();onDragOver(getCell(e));}}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAY PIECE
// ─────────────────────────────────────────────────────────────────────────────
function TrayPiece({ piece, psize, isDragging, onDragStart }) {
  const canvasRef=useRef(null);
  useEffect(()=>{
    const c=canvasRef.current; if(!c) return;
    c.width=psize; c.height=psize;
    const ctx=c.getContext("2d"); ctx.clearRect(0,0,psize,psize);
    const src=piece.canvas;
    const scale=psize/Math.max(src.width,src.height);
    const dw=src.width*scale, dh=src.height*scale;
    ctx.drawImage(src,(psize-dw)/2,(psize-dh)/2,dw,dh);
  },[piece,psize]);
  return (
    <div data-id={piece.id}
      style={{width:psize,height:psize,cursor:isDragging?"grabbing":"grab",borderRadius:6,overflow:"hidden",flexShrink:0,opacity:isDragging?0.25:1,transition:"transform .12s,opacity .12s",background:"transparent"}}
      onMouseDown={e=>{playTick();vibrate(15);onDragStart(e,piece);}}
      onTouchStart={e=>{playTick();vibrate(15);onDragStart(e,piece);}}>
      <canvas ref={canvasRef} style={{display:"block"}} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THUMBNAILS
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// WIN ANIMATION OVERLAY — pieces assemble, puzzle "clicks", then result
// ─────────────────────────────────────────────────────────────────────────────
function WinOverlay({ seconds, onMenu, onPlayAgain, sceneCanvas, onComplete, redirectUrl, bgColor, primaryColor, heading2Color, heading3Color, settings }) {
  const [phase, setPhase] = useState("lock"); // lock | result
  const [scale, setScale] = useState(0);
  const [glow, setGlow] = useState(false);

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  function adjustBrightness(hex, percent) {
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(2.55 * percent)));
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(2.55 * percent)));
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(2.55 * percent)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  useEffect(() => {
    playWin();
    vibrate([30, 50, 100]);
    // Animate puzzle lock-in
    let t0 = performance.now();
    const dur = 600;
    const animate = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      // overshoot spring
      const spring = p < 0.7
        ? (p / 0.7) * 1.15
        : 1.15 - ((p - 0.7) / 0.3) * 0.15;
      setScale(spring);
      if (p < 1) requestAnimationFrame(animate);
      else {
        setScale(1);
        setGlow(true);
        setTimeout(() => setPhase("result"), 900);
      }
    };
    requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (phase === "result" && onComplete) {
      onComplete({ redirect_url: redirectUrl || null });
    }
  }, [phase, onComplete, redirectUrl]);

  const imgRef = useRef(null);
  useEffect(() => {
    if (imgRef.current && sceneCanvas) {
      drawImageToCanvas(imgRef.current, { naturalWidth: sceneCanvas.width, naturalHeight: sceneCanvas.height,
        ...sceneCanvas }, 200, 200);
      // Direct canvas copy
      const c = imgRef.current;
      c.width = 200; c.height = 200;
      c.getContext("2d").drawImage(sceneCanvas, 0, 0, 200, 200);
    }
  }, [sceneCanvas]);

return (
    <div style={{position:"fixed",inset:0,background:`rgba(${parseInt(bgColor.slice(1,3),16)},${parseInt(bgColor.slice(3,5),16)},${parseInt(bgColor.slice(5,7),16)},0.92)`,backdropFilter:"blur(10px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:100}}>
      {phase === "lock" && (
        <div style={{transform:`scale(${scale})`,transition:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <div style={{fontSize:"5rem",filter:glow?`drop-shadow(0 0 30px ${heading3Color})`:"none",transition:"filter .4s"}}>🧩</div>
          <div style={{fontSize:"1.5rem",fontWeight:900,color:glow?heading3Color:"#fff",textShadow:glow?`0 0 20px ${hexToRgba(heading3Color, 0.8)}`:"none",transition:"all .4s",letterSpacing:1}}>
            {glow ? "Perfect fit!" : "Locking in…"}
          </div>
          {glow && (
            <div style={{display:"flex",gap:6,animation:"fadeIn .3s ease"}}>
              {["✨","🎉","✨"].map((e,i)=><span key={i} style={{fontSize:"1.5rem",animationDelay:`${i*0.1}s`}}>{e}</span>)}
            </div>
          )}
        </div>
      )}

      {phase === "result" && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,animation:"slideUp .4s ease"}}>
          <div style={{fontSize:"3rem"}}>🎉</div>
          <div style={{fontSize:"2rem",fontWeight:900,color:heading3Color,textShadow:`0 0 20px ${hexToRgba(heading3Color, 0.5)}`}}>{settings?.outro_text || "Puzzle Complete!"}</div>
          <div style={{color:heading2Color,fontSize:"0.9rem"}}>Finished in</div>
          <div style={{fontSize:"2rem",fontWeight:800,color:primaryColor}}>{fmtTime(seconds)}</div>
          <div style={{borderRadius:16,overflow:"hidden",boxShadow:`0 8px 40px rgba(0,0,0,0.6),0 0 0 3px ${hexToRgba(heading3Color, 0.4)}`,margin:"8px 0"}}>
            <canvas ref={imgRef} style={{display:"block",width:180,height:180}} />
          </div>
          <div style={{display:"flex",gap:12,marginTop:8}}>
            <button style={{padding:"12px 28px",borderRadius:50,border:`2px solid rgba(255,255,255,0.2)`,fontFamily:"inherit",fontSize:"0.98rem",fontWeight:800,cursor:"pointer",background:"transparent",color:heading2Color,transition:"all .2s"}}
              onClick={onMenu}>Menu</button>
            <button style={{padding:"12px 28px",borderRadius:50,border:"none",fontFamily:"inherit",fontSize:"0.98rem",fontWeight:800,cursor:"pointer",background:`linear-gradient(135deg, ${primaryColor}, ${adjustBrightness(primaryColor, -15)})`,color:"#ffffff",boxShadow:`0 4px 16px ${hexToRgba(primaryColor, 0.4)}`,transition:"all .2s"}}
              onClick={onPlayAgain}>{settings?.submit_button_text || "Play Again"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSIVE HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function JigsawSurprise({ gameData, sessionToken, onComplete }) {
  const isMobile = useIsMobile();
  const settings = gameData?.settings || {};
  const soundMap = gameData?.soundMap || {};

  const resolveSoundUrl = (id) => {
    if (!id) return null
    const n = parseInt(id)
    return isNaN(n) ? null : (soundMap[n] || null)
  }

  const playCustomSound = (id, fallback) => {
    const url = resolveSoundUrl(id)
    if (url) {
      try { const a = new Audio(url); a.play().catch(() => fallback()) } catch { fallback() }
    } else {
      fallback()
    }
  }

  // Dynamic styles based on settings
  const bgColor = settings.bg_color || '#1a2a3a';
  const primaryColor = settings.primary_color || '#2ecfb8';
  const heading1Color = settings.heading_1_color || primaryColor;
  const heading2Color = settings.heading_2_color || '#7eb8cc';
  const heading3Color = settings.heading_3_color || '#f5c842';
  const descriptionColor = settings.description_color || '#5a8a9a';
  const fontFamily = settings.font_family || "'Nunito','Segoe UI',sans-serif";

  const textColor = getContrastColor(bgColor);

  const S = {
    root: { fontFamily, background: bgColor, color: textColor, minHeight: '100vh', userSelect: 'none', overflow: 'hidden' },
    menuWrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${bgColor} 0%, ${adjustBrightness(bgColor, -20)} 50%, ${bgColor} 100%)`, gap: 0, padding: '20px 0', overflowY: 'auto' },
    menuTitle: { fontSize: '2.8rem', fontWeight: 900, color: heading1Color, textShadow: `0 0 30px ${hexToRgba(heading1Color, 0.5)}`, marginBottom: 6, letterSpacing: -1 },
    menuSub: { fontSize: '1rem', color: heading2Color, marginBottom: 24 },
    previewWrap: { width: 210, height: 210, borderRadius: 20, overflow: 'hidden', marginBottom: 24, boxShadow: `0 0 40px ${hexToRgba(primaryColor, 0.3)}, 0 8px 32px rgba(0,0,0,0.5)`, border: `3px solid ${hexToRgba(primaryColor, 0.4)}`, background: adjustBrightness(bgColor, -10), position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    diffLabel: { fontSize: '0.8rem', color: heading2Color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
    diffRow: { display: 'flex', gap: 12, marginBottom: 20 },
    diffBtn: (a) => ({ padding: '10px 22px', borderRadius: 50, border: a ? `2px solid ${primaryColor}` : '2px solid transparent', fontFamily: 'inherit', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer', background: a ? primaryColor : adjustBrightness(bgColor, -10), color: a ? getContrastColor(primaryColor) : heading2Color, boxShadow: a ? `0 0 16px ${hexToRgba(primaryColor, 0.5)}` : 'none', transition: 'all .2s' }),
    playBtn: { padding: '15px 52px', borderRadius: 50, border: 'none', fontFamily: 'inherit', fontSize: '1.15rem', fontWeight: 800, cursor: 'pointer', background: `linear-gradient(135deg, ${primaryColor}, ${adjustBrightness(primaryColor, -15)})`, color: getContrastColor(primaryColor), boxShadow: `0 6px 24px ${hexToRgba(primaryColor, 0.4)}`, transition: 'all .2s' },
    gameWrap: { display: 'flex', flexDirection: 'column', height: '100vh', background: `linear-gradient(135deg, ${bgColor} 0%, ${adjustBrightness(bgColor, -15)} 100%)` },
    topBar: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: 'rgba(13,31,45,0.8)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 },
    iconBtn: { background: adjustBrightness(bgColor, -10), border: 'none', borderRadius: 10, color: heading2Color, fontSize: '0.85rem', cursor: 'pointer', padding: '6px 12px', fontFamily: 'inherit', fontWeight: 700, transition: 'all .15s', whiteSpace: 'nowrap' },
    statPill: (accent) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', background: adjustBrightness(bgColor, -10), borderRadius: 10, padding: '4px 14px', minWidth: 60 }),
    statVal: { fontSize: '1rem', fontWeight: 900, color: heading3Color, lineHeight: 1.2 },
    statLbl: { fontSize: '0.6rem', color: descriptionColor, textTransform: 'uppercase', letterSpacing: 1 },
    progressBar: { flex: 1, height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
    progressFill: (pct) => ({ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${primaryColor}, ${adjustBrightness(primaryColor, 15)})`, width: pct + '%', transition: 'width .4s ease' }),
    boardArea: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, overflow: 'hidden' },
    trayPanel: { background: adjustBrightness(bgColor, -15), borderTop: '2px solid rgba(255,255,255,0.07)', padding: '8px 8px 8px 8px', flexShrink: 0, maxHeight: 160, overflowY: 'auto' },
    trayTitle: { fontSize: '0.65rem', color: descriptionColor, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' },
    trayGrid: { display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'flex-start' },
    confetti: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99 },
    ghost: (x, y, size, vis) => ({ position: 'fixed', left: x - size / 2, top: y - size / 2, width: size, height: size, pointerEvents: 'none', zIndex: 9999, borderRadius: 6, boxShadow: `0 6px 20px ${hexToRgba(primaryColor, 0.35)}`, overflow: 'hidden', display: vis ? 'block' : 'none', background: 'transparent' }),
  };

  // Helper functions for color manipulation
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  function adjustBrightness(hex, percent) {
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(2.55 * percent)));
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(2.55 * percent)));
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(2.55 * percent)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  function getContrastColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#0d1f2d' : '#ffffff';
  }
  const [screen, setScreen] = useState("menu");
  const [difficulty, setDifficulty] = useState(
    settings.allow_difficulty_selection == 1 ? "medium" : "builder"
  );
  const [puzzleImg, setPuzzleImg] = useState(null);

  const [pieces, setPieces] = useState([]);
  const [pieceMap, setPieceMap] = useState({});
  const [placedCount, setPlacedCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [dropTarget, setDropTarget] = useState(null);
  const [dragPiece, setDragPiece] = useState(null);
  const [ghostPos, setGhostPos] = useState({ x:0, y:0 });
  const [ghostSize, setGhostSize] = useState(80);
  const [breakData, setBreakData] = useState(null);
  const [showWin, setShowWin] = useState(false);

  const timerRef = useRef(null);
  const menuPreviewRef = useRef(null);
  const ghostCanvasRef = useRef(null);
  const fullCanvasRef = useRef(null);
  const colsRef = useRef(4);
  const rowsRef = useRef(4);
  const tileSizeRef = useRef({ w:100, h:100 });
  const boardSizeRef = useRef({ w:480, h:480 });
  const secondsRef = useRef(0);

  const confettiActive = showWin;
  const confettiCanvasRef = useConfetti(confettiActive);

  // Load puzzle image from builder settings
  useEffect(() => {
    if (!settings.puzzle_image_url) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setPuzzleImg(img);
    };
    img.onerror = () => {};
    img.src = settings.puzzle_image_url;
  }, [settings.puzzle_image_url]);

  // Menu preview
  useEffect(() => {
    if (!menuPreviewRef.current || !puzzleImg) return;
    drawImageToCanvas(menuPreviewRef.current, puzzleImg, 210, 210);
  }, [puzzleImg]);

  // Timer — count down when show_timer is enabled and time_limit_seconds > 0,
  // otherwise count up (no timer)
  const showTimer = Number(settings.show_timer) === 1;
  const timeLimit = Number(settings.time_limit_seconds) || 0;
  const countdown = showTimer && timeLimit > 0;

  useEffect(() => {
    if (screen !== "game") { clearInterval(timerRef.current); return; }
    if (countdown) {
      secondsRef.current = timeLimit;
      setSeconds(timeLimit);
    } else {
      secondsRef.current = 0;
      setSeconds(0);
    }
    timerRef.current = setInterval(() => {
      if (countdown) {
        secondsRef.current = Math.max(0, secondsRef.current - 1);
        setSeconds(secondsRef.current);
        if (secondsRef.current <= 0) {
          clearInterval(timerRef.current);
          setShowWin(true);
        }
      } else {
        secondsRef.current = secondsRef.current + 1;
        setSeconds(secondsRef.current);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, countdown, timeLimit]);

  const startGame = useCallback(() => {
    clearInterval(timerRef.current);
    secondsRef.current = 0;
    setSeconds(0); setMoves(0); setPlacedCount(0);
    setDropTarget(null); setDragPiece(null); setShowWin(false);

    const useSettingsGrid = settings.allow_difficulty_selection != 1;
    const diff = useSettingsGrid
      ? { cols: parseInt(settings.grid_cols) || 4, rows: parseInt(settings.grid_rows) || 4 }
      : DIFFS[difficulty];
    colsRef.current = diff.cols; rowsRef.current = diff.rows;

    // Board area: full screen minus top bar (~50px) minus bottom tray (~130px)
    const hPad = isMobile ? 12 : 24;
    const topBarH = isMobile ? 44 : 50;
    const trayH = isMobile ? 120 : 140;
    const vw = window.innerWidth - hPad * 2;
    const vh = window.innerHeight - topBarH - trayH;
    const maxBoard = isMobile ? Math.min(vw, vh, 420) : Math.min(vw, vh, 500);
    const bs = Math.max(200, maxBoard);
    const tw = Math.floor(bs / diff.cols);
    const th = Math.floor(bs / diff.rows);
    boardSizeRef.current = { w: tw * diff.cols, h: th * diff.rows };
    tileSizeRef.current = { w: tw, h: th };

    const totalW = tw * diff.cols, totalH = th * diff.rows;
    const full = document.createElement("canvas");
    full.width = totalW; full.height = totalH;
    if (puzzleImg) drawImageToCanvas(full, puzzleImg, totalW, totalH);
    fullCanvasRef.current = full;

    const edgeMap = buildEdgeMap(diff.cols, diff.rows);
    const builtPieces = [];
    const map = {};
    for (let r = 0; r < diff.rows; r++) {
      for (let c = 0; c < diff.cols; c++) {
        const edges = getPieceEdges(c, r, diff.cols, diff.rows, edgeMap);
        const pc = buildPieceCanvas(full, c, r, tw, th, edges);
        const p = { id: r*diff.cols+c, row:r, col:c, canvas:pc, edges, placed:false, inTray:true };
        builtPieces.push(p);
        map[p.id] = { edges };
      }
    }
    setPieceMap(map);
    const shuffled = [...builtPieces].sort(() => Math.random() - 0.5);
    setPieces(shuffled);

    // Board is centered in available area
    const bTopBarH = isMobile ? 44 : 50;
    const bTrayH = isMobile ? 120 : 140;
    const boardAreaW = window.innerWidth;
    const boardAreaH = window.innerHeight - bTopBarH - bTrayH;
    const boardOffsetX = Math.max(0, (boardAreaW - boardSizeRef.current.w) / 2);
    const boardOffsetY = bTopBarH + Math.max(0, (boardAreaH - boardSizeRef.current.h) / 2);

    setBreakData({ pieces: shuffled, fullCanvas: full, boardOffsetX, boardOffsetY });
    setScreen("break");
  }, [difficulty, puzzleImg, isMobile, settings]);

  const onBreakDone = useCallback(() => {
    setBreakData(null);
    setScreen("game");
  }, []);

  const checkWin = useCallback((newPlaced, total) => {
    if (newPlaced >= total) {
      clearInterval(timerRef.current);
      setShowWin(true);
    }
  }, []);

  const startDrag = useCallback((e, piece) => {
    setDragPiece(piece);
    const psize = Math.min(tileSizeRef.current.w, tileSizeRef.current.h, 80);
    setGhostSize(psize);
    requestAnimationFrame(() => {
      const gc = ghostCanvasRef.current; if(!gc) return;
      gc.width=psize; gc.height=psize;
      const ctx=gc.getContext("2d"); ctx.clearRect(0,0,psize,psize);
      const src=piece.canvas;
      const scale=psize/Math.max(src.width,src.height);
      ctx.drawImage(src,(psize-src.width*scale)/2,(psize-src.height*scale)/2,src.width*scale,src.height*scale);
    });
    const { clientX, clientY }=e.touches?e.touches[0]:e;
    setGhostPos({ x:clientX, y:clientY });
  }, []);

  const handleDrop = useCallback((cell) => {
    if(!dragPiece||!cell){ setDragPiece(null); setDropTarget(null); return; }
    const{col,row}=cell;
    const occupied=pieces.find(p=>p.placed&&p.col===col&&p.row===row);
    if(occupied){ setDragPiece(null); setDropTarget(null); return; }
    const correct=dragPiece.col===col&&dragPiece.row===row;
    setMoves(m=>m+1);
    vibrate(correct ? 60 : 20);
    if(correct){
      playCustomSound(settings.sound_correct_id, playSnap);
      setPieces(prev=>prev.map(p=>p.id===dragPiece.id?{...p,placed:true,inTray:false}:p));
      setPlacedCount(c=>{ const next=c+1; checkWin(next,colsRef.current*rowsRef.current); return next; });
    } else {
      playCustomSound(settings.sound_wrong_id, playTick);
    }
    setDragPiece(null); setDropTarget(null);
  }, [dragPiece, pieces, checkWin]);

  const handleDropRef = useRef(null);
  useEffect(() => { handleDropRef.current = handleDrop; }, [handleDrop]);
  const dropTargetRef = useRef(null);
  useEffect(() => { dropTargetRef.current = dropTarget; }, [dropTarget]);

  useEffect(() => {
    if (!dragPiece) return;
    const onMove = e => {
      const { clientX, clientY } = e.touches ? e.touches[0] : e;
      setGhostPos({ x: clientX, y: clientY });
      const boardEl = document.querySelector('[data-board-canvas]');
      if (boardEl) {
        const rect = boardEl.getBoundingClientRect();
        const scaleX = boardSizeRef.current.w / rect.width;
        const scaleY = boardSizeRef.current.h / rect.height;
        const col = Math.floor(((clientX - rect.left) * scaleX) / tileSizeRef.current.w);
        const row = Math.floor(((clientY - rect.top) * scaleY) / tileSizeRef.current.h);
        if (col >= 0 && col < colsRef.current && row >= 0 && row < rowsRef.current) {
          setDropTarget({ col, row });
        } else {
          setDropTarget(null);
        }
      }
    };
    const onUp = e => {
      const cell = dropTargetRef.current;
      if (cell && handleDropRef.current) {
        handleDropRef.current(cell);
      } else {
        setDragPiece(null);
        setDropTarget(null);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragPiece]);

  const total = colsRef.current * rowsRef.current;
  const pct = total ? (placedCount/total)*100 : 0;
  const trayPieces = pieces.filter(p=>!p.placed);
  const psize = Math.min(tileSizeRef.current.w, tileSizeRef.current.h, isMobile ? 56 : 72);

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes popIn{0%{transform:scale(0)}70%{transform:scale(1.2)}100%{transform:scale(1)}}
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:${primaryColor};border-radius:4px}
        .tp:hover{transform:scale(1.1)!important;filter:brightness(1.1);}
        .ib:hover{background:${hexToRgba(primaryColor, 0.2)}!important;color:${primaryColor}!important;}
        .pb:hover{transform:translateY(-2px)!important;box-shadow:0 10px 30px ${hexToRgba(primaryColor, 0.5)}!important;}
        .ub:hover{border-color:${primaryColor}!important;background:${hexToRgba(primaryColor, 0.1)}!important;}
      `}</style>

      <canvas ref={confettiCanvasRef} style={S.confetti} />
      <div style={S.ghost(ghostPos.x, ghostPos.y, ghostSize, !!dragPiece)}>
        <canvas ref={ghostCanvasRef} style={{display:"block"}} />
      </div>

      {/* ── MENU ── */}
      {screen === "menu" && (
        <div style={{...S.menuWrap, padding: isMobile ? "12px 10px" : "20px 0"}}>
          <div style={{...S.menuTitle, fontSize: isMobile ? "1.8rem" : "2.8rem", marginBottom: isMobile ? 4 : 6}}>{settings.heading_1 || "🧩 Jigsaw Surprise"}</div>
          <div style={{...S.menuSub, fontSize: isMobile ? "0.85rem" : "1rem", marginBottom: isMobile ? 16 : 24}}>{settings.heading_2 || "Piece together a beautiful scene!"}</div>
          <div style={{...S.previewWrap, width: isMobile ? 150 : 210, height: isMobile ? 150 : 210, marginBottom: isMobile ? 16 : 24}}>
            {settings.puzzle_image_url ? (
              <img src={settings.puzzle_image_url} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",display:"block"}} alt="puzzle" />
            ) : (
              <div style={{fontSize:"2rem"}}>🧩</div>
            )}
          </div>
          {settings.allow_difficulty_selection == 1 && (
            <>
              <div style={S.diffLabel}>Choose difficulty</div>
              <div style={{...S.diffRow, gap: isMobile ? 8 : 12, marginBottom: isMobile ? 16 : 20}}>
                {[["easy","3×3"],["medium","4×4"],["hard","5×5"]].map(([d,label])=>(
                  <button key={d} style={{...S.diffBtn(difficulty===d), padding: isMobile ? "7px 14px" : "10px 22px", fontSize: isMobile ? "0.82rem" : "0.92rem"}} onClick={()=>setDifficulty(d)}>
                    {d.charAt(0).toUpperCase()+d.slice(1)}<br/><small style={{fontWeight:400,fontSize:".73rem"}}>{label}</small>
                  </button>
                ))}
              </div>
            </>
          )}
          <button className="pb" style={{...S.playBtn, padding: isMobile ? "12px 36px" : "15px 52px", fontSize: isMobile ? "1rem" : "1.15rem"}} onClick={startGame}>▶  Play</button>
        </div>
      )}

      {/* ── BREAK ANIMATION SCREEN ── */}
      {screen === "break" && breakData && (
        <div style={{...S.gameWrap, position:"relative"}}>
          {/* Ghost panels as backdrop */}
          <div style={{...S.topBar,justifyContent:"center"}}>
            <span style={{color:primaryColor,fontWeight:800,fontSize:"0.9rem"}}>Get ready…</span>
          </div>
          <div style={S.boardArea} />
          <div style={{...S.trayPanel,height:130}} />
          <BreakAnimation
            fullCanvas={breakData.fullCanvas}
            pieces={breakData.pieces}
            tileW={tileSizeRef.current.w}
            tileH={tileSizeRef.current.h}
            boardW={boardSizeRef.current.w}
            boardH={boardSizeRef.current.h}
            boardOffsetX={breakData.boardOffsetX}
            boardOffsetY={breakData.boardOffsetY}
            onDone={onBreakDone}
          />
        </div>
      )}

      {/* ── GAME ── */}
      {screen === "game" && (
        <div style={S.gameWrap}>
          {/* Top stats bar */}
          <div style={{...S.topBar, padding: isMobile ? "6px 10px" : "8px 16px", gap: isMobile ? 6 : 10}}>
            <button className="ib" style={{...S.iconBtn, padding: isMobile ? "5px 8px" : "6px 12px", fontSize: isMobile ? "0.78rem" : "0.85rem"}} onClick={()=>{ clearInterval(timerRef.current); setScreen("menu"); }}>{isMobile ? "←" : "← Menu"}</button>
            <div style={S.progressBar}><div style={S.progressFill(pct)}/></div>
            <div style={{...S.statPill(), padding: isMobile ? "3px 8px" : "4px 14px", minWidth: isMobile ? 40 : 60}}>
              <div style={{...S.statVal, fontSize: isMobile ? "0.82rem" : "1rem", color: heading3Color}}>{Math.round(pct)}%</div>
              <div style={{...S.statLbl, fontSize: isMobile ? "0.5rem" : "0.6rem"}}>Done</div>
            </div>
            <div style={{...S.statPill(), padding: isMobile ? "3px 8px" : "4px 14px", minWidth: isMobile ? 40 : 60}}>
              <div style={{...S.statVal, fontSize: isMobile ? "0.82rem" : "1rem"}}>{fmtTime(seconds)}</div>
              <div style={{...S.statLbl, fontSize: isMobile ? "0.5rem" : "0.6rem"}}>Time</div>
            </div>
            <div style={{...S.statPill(), padding: isMobile ? "3px 8px" : "4px 14px", minWidth: isMobile ? 40 : 60}}>
              <div style={{...S.statVal, fontSize: isMobile ? "0.82rem" : "1rem"}}>{moves}</div>
              <div style={{...S.statLbl, fontSize: isMobile ? "0.5rem" : "0.6rem"}}>Moves</div>
            </div>
          </div>

          {/* Board centered */}
          <div style={S.boardArea}>
            <BoardCanvas
              pieces={pieces} pieceMap={pieceMap}
              cols={colsRef.current} rows={rowsRef.current}
              tileW={tileSizeRef.current.w} tileH={tileSizeRef.current.h}
              boardW={boardSizeRef.current.w} boardH={boardSizeRef.current.h}
              fullCanvas={fullCanvasRef.current}
              dropTarget={dropTarget}
              onDragOver={cell=>{ if(dragPiece) setDropTarget(cell); }}
              onDragLeave={()=>setDropTarget(null)}
            />
          </div>

          {/* Bottom tray */}
          <div style={{...S.trayPanel, padding: isMobile ? "6px 6px" : "8px", maxHeight: isMobile ? 130 : 160}}>
            <div style={{...S.trayTitle, fontSize: isMobile ? "0.6rem" : "0.65rem", marginBottom: isMobile ? 4 : 6}}>
              {trayPieces.length > 0 ? `${trayPieces.length} piece${trayPieces.length!==1?"s":""} left` : "All placed! 🎉"}
            </div>
            <div style={{...S.trayGrid, gap: isMobile ? 4 : 5, justifyContent: isMobile ? "center" : "flex-start"}}>
              {trayPieces.map(p=>(
                <div key={p.id} className="tp" style={{width:psize,height:psize,cursor:dragPiece?.id===p.id?"grabbing":"grab",borderRadius:6,overflow:"hidden",flexShrink:0,opacity:dragPiece?.id===p.id?0.2:1,transition:"transform .12s,opacity .12s",background:"transparent"}}>
                  <TrayPiece piece={p} psize={psize} isDragging={dragPiece?.id===p.id} onDragStart={startDrag} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── WIN OVERLAY ── */}
      {showWin && (
        <WinOverlay
          seconds={countdown ? Math.max(0, timeLimit - seconds) : seconds}
          sceneCanvas={fullCanvasRef.current}
          onMenu={()=>{ setShowWin(false); setScreen("menu"); }}
          onPlayAgain={()=>{ setShowWin(false); startGame(); }}
          onComplete={onComplete}
          redirectUrl={gameData?.redirect_url}
          bgColor={bgColor}
          primaryColor={primaryColor}
          heading2Color={heading2Color}
          heading3Color={heading3Color}
          settings={settings}
        />
      )}
    </div>
  );
}