import { useEffect, useRef, useState } from 'react';

const BRICK_ROWS = 8;
const BRICK_H = 18;
const BRICK_GAP_H = 10;
const BRICK_GAP_V = 10;
const BALL_R = 7;
const PADDLE_H = 10;
const NEON_COLORS = ['#9210f6', '#7C3AED', '#610497', '#4F46E5', '#c040ff', '#a855f7', '#6366f1', '#8b5cf6'];

function lerpColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1)}`;
}

function vibrate(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch {} }

let userInteracted = false;
function vibrateIfAllowed(ms) { if (userInteracted) vibrate(ms); }

function makeSound(ctx, freq, type, dur, vol) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
}

function getBrickCols(W) {
  if (W < 360) return 7;
  if (W < 480) return 9;
  if (W < 640) return 11;
  return 13;
}

function makeBricks(W, H) {
  const cols = getBrickCols(W);
  const sidePad = W < 480 ? 12 : 20;
  const totalW = W - sidePad * 2;
  const bw = (totalW - (cols - 1) * BRICK_GAP_H) / cols;
  const startX = sidePad;
  const startY = H * 0.10;
  const bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({
        x: startX + c * (bw + BRICK_GAP_H),
        y: startY + r * (BRICK_H + BRICK_GAP_V),
        w: bw,
        h: BRICK_H,
        alive: true,
        color: lerpColor('#3b0764', '#c084fc', r / (BRICK_ROWS - 1)),
        fixed: false,
        glow: 0,
      });
    }
  }
  return bricks;
}

function makeCtaBricks(W, H) {
  if (W < 480) return [];
  const cols = getBrickCols(W);
  const sidePad = W < 480 ? 12 : 20;
  const totalW = W - sidePad * 2;
  const bw = (totalW - (cols - 1) * BRICK_GAP_H) / cols;
  const startX = sidePad;
  const startY = H * 0.10;
  const midRow = Math.floor(BRICK_ROWS / 2);
  const midColL = Math.floor(cols / 2) - 2;
  const midColR = Math.floor(cols / 2) + 1;
  const ctaY = startY + midRow * (BRICK_H + BRICK_GAP_V);
  return [
    {
      x: startX + midColL * (bw + BRICK_GAP_H),
      y: ctaY, w: bw * 2 + BRICK_GAP_H, h: BRICK_H * 2 + BRICK_GAP_V,
      alive: true, color: '#9210f6', fixed: true, glow: 0, label: 'PLAY NOW',
    },
    {
      x: startX + midColR * (bw + BRICK_GAP_H),
      y: ctaY, w: bw * 2 + BRICK_GAP_H, h: BRICK_H * 2 + BRICK_GAP_V,
      alive: true, color: '#c040ff', fixed: true, glow: 0, label: 'START WIN',
    },
  ];
}

export default function ArkanoidGame() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let W = wrap.clientWidth || 700;
    let H = wrap.clientHeight || 500;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const PW = Math.max(70, Math.min(W * 0.18, 120));

    let audioCtx = null;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}

    const s = {
      W, H,
      bricks: makeBricks(W, H),
      ctaBricks: makeCtaBricks(W, H),
      paddle: { x: W / 2 - PW / 2, y: H - 16, w: PW, h: PADDLE_H, bright: 0 },
      ball: { x: W / 2, y: H - 36, dx: 0, dy: 0, r: BALL_R },
      mouseX: W / 2,
      particles: [],
      trail: [],
      sparkTimer: 0,
      started: false,
      running: false,
      time: 0,
    };
    stateRef.current = s;

    const resetBall = () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
      const speed = 6 + Math.random() * 0.5;
      s.ball.x = s.paddle.x + s.paddle.w / 2;
      s.ball.y = s.paddle.y - BALL_R - 2;
      s.ball.dx = Math.cos(angle) * speed;
      s.ball.dy = Math.sin(angle) * speed;
    };

    const rebuildLayout = () => {
      const newW = wrap.clientWidth || 700;
      const newH = wrap.clientHeight || 500;
      if (newW === W && newH === H) return;
      W = newW; H = newH;
      s.W = W; s.H = H;
      canvas.width = W;
      canvas.height = H;
      s.paddle.w = Math.max(70, Math.min(W * 0.18, 120));
      s.paddle.y = H - 16;
      s.paddle.x = Math.max(0, Math.min(W - s.paddle.w, s.paddle.x));
      s.bricks = makeBricks(W, H);
    };

    const ro = new ResizeObserver(() => rebuildLayout());
    ro.observe(wrap);

    const onInteract = (mx) => {
      s.mouseX = mx;
      if (s.ball.dx === 0 && s.ball.dy === 0) {
        if (!s.started) {
          s.started = true;
          setStarted(true);
          if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
          startLoop();
        }
        resetBall();
        makeSound(audioCtx, 880, 'sine', 0.15, 0.12);
        userInteracted = true;
        vibrate(30);
      }
    };

    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = ((e.clientX || 0) - rect.left) * (W / rect.width);
      onInteract(mx);
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      if (!touch) return;
      const mx = (touch.clientX - rect.left) * (W / rect.width);
      s.mouseX = mx;
      if (s.ball.dx === 0 && s.ball.dy === 0) onInteract(mx);
    };
    const onTouchStart = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      if (!touch) return;
      const mx = (touch.clientX - rect.left) * (W / rect.width);
      onInteract(mx);
    };

    const onCtaClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx = ((e.clientX || 0) - rect.left) * (W / rect.width);
      const cy = ((e.clientY || 0) - rect.top) * (H / rect.height);
      for (const bb of s.ctaBricks) {
        if (!bb.alive) continue;
        if (cx >= bb.x && cx <= bb.x + bb.w && cy >= bb.y && cy <= bb.y + bb.h) {
          bb.glow = 1;
          spawnParticles(bb.x + bb.w / 2, bb.y + bb.h / 2, 12, bb.color);
          ctaHit();
          window.location.href = '/arcade';
          break;
        }
      }
    };

    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('click', onCtaClick);

    function spawnParticles(x, y, count, color) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 3;
        s.particles.push({
          x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
          life: 1, decay: 0.025 + Math.random() * 0.015,
          size: 1.5 + Math.random() * 2.5, color,
        });
      }
    }

    function wallBounce() { makeSound(audioCtx, 300, 'triangle', 0.08, 0.06); vibrateIfAllowed(8); }
    function brickBreak() { makeSound(audioCtx, 600 + Math.random() * 400, 'square', 0.1, 0.05); vibrateIfAllowed(12); }
    function ctaHit() { makeSound(audioCtx, 440, 'sawtooth', 0.15, 0.14); makeSound(audioCtx, 880, 'sine', 0.12, 0.10); vibrateIfAllowed(25); }
    function paddleHit() { makeSound(audioCtx, 520, 'triangle', 0.08, 0.08); s.paddle.bright = 1; vibrateIfAllowed(10); }

    const loop = () => {
      s.time += 0.016;
      const targetPX = s.mouseX - s.paddle.w / 2;
      s.paddle.x += (targetPX - s.paddle.x) * 0.18;
      s.paddle.x = Math.max(0, Math.min(W - s.paddle.w, s.paddle.x));
      if (s.paddle.bright > 0) s.paddle.bright *= 0.92;

      s.ball.x += s.ball.dx;
      s.ball.y += s.ball.dy;

      if (s.ball.x - BALL_R < 0) { s.ball.x = BALL_R; s.ball.dx = Math.abs(s.ball.dx); wallBounce(); }
      if (s.ball.x + BALL_R > W) { s.ball.x = W - BALL_R; s.ball.dx = -Math.abs(s.ball.dx); wallBounce(); }
      if (s.ball.y - BALL_R < 0) { s.ball.y = BALL_R; s.ball.dy = Math.abs(s.ball.dy); wallBounce(); }
      if (s.ball.y + BALL_R > H) {
        s.ball.dx = 0;
        s.ball.dy = 0;
        s.ball.x = s.paddle.x + s.paddle.w / 2;
        s.ball.y = s.paddle.y - BALL_R - 2;
      }

      if (s.started && s.ball.dx !== 0) {
        s.sparkTimer += 0.016;
        if (s.sparkTimer > 0.05) {
          s.sparkTimer = 0;
          s.particles.push({
            x: s.ball.x + (Math.random() - 0.5) * 4,
            y: s.ball.y + (Math.random() - 0.5) * 4,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            life: 0.5, decay: 0.04,
            size: 1 + Math.random() * 1.5, color: '#9210f6',
          });
        }
      }

      const pad = s.paddle;
      if (s.ball.y + BALL_R >= pad.y && s.ball.y + BALL_R <= pad.y + pad.h + 4 && s.ball.x >= pad.x - 4 && s.ball.x <= pad.x + pad.w + 4 && s.ball.dy > 0) {
        const hitPos = (s.ball.x - pad.x) / pad.w;
        const angle = (hitPos - 0.5) * Math.PI * 0.7;
        const speed = Math.sqrt(s.ball.dx * s.ball.dx + s.ball.dy * s.ball.dy);
        s.ball.dx = Math.sin(angle) * speed;
        s.ball.dy = -Math.abs(Math.cos(angle) * speed);
        s.ball.y = pad.y - BALL_R;
        spawnParticles(s.ball.x, pad.y, 5, '#c040ff');
        paddleHit();
      }

      const allBricks = [...s.bricks, ...s.ctaBricks];
      for (const brick of allBricks) {
        if (!brick.alive) continue;
        const bx = brick.x, by = brick.y, bw = brick.w, bh = brick.h;
        if (s.ball.x + BALL_R > bx && s.ball.x - BALL_R < bx + bw && s.ball.y + BALL_R > by && s.ball.y - BALL_R < by + bh) {
          const overlapLeft = (s.ball.x + BALL_R) - bx;
          const overlapRight = (bx + bw) - (s.ball.x - BALL_R);
          const overlapTop = (s.ball.y + BALL_R) - by;
          const overlapBottom = (by + bh) - (s.ball.y - BALL_R);
          if (Math.min(overlapLeft, overlapRight) < Math.min(overlapTop, overlapBottom)) s.ball.dx = -s.ball.dx;
          else s.ball.dy = -s.ball.dy;

          if (brick.fixed) {
            // CTA bricks bounce ball but don't trigger action
          } else {
            brick.alive = false;
            spawnParticles(bx + bw / 2, by + bh / 2, 10, brick.color);
            brickBreak();
          }
          break;
        }
      }

      if (s.bricks.every(b => !b.alive)) {
      s.bricks = makeBricks(W, H);
      s.ctaBricks = makeCtaBricks(W, H);
        makeSound(audioCtx, 1047, 'sine', 0.2, 0.10);
        vibrateIfAllowed(40);
      }

      for (const bb of s.ctaBricks) {
        if (bb.glow > 0) bb.glow *= 0.94;
      }

      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.04; pt.life -= pt.decay;
        if (pt.life <= 0) s.particles.splice(i, 1);
      }

      ctx.clearRect(0, 0, W, H);

      for (const brick of s.bricks) {
        if (!brick.alive) continue;
        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 10);
        ctx.fill();
      }

      const ctaFontSize = W < 480 ? 11 : W < 640 ? 13 : 15;
      for (let bi = 0; bi < s.ctaBricks.length; bi++) {
        const bb = s.ctaBricks[bi];
        if (!bb.alive) continue;
        const isPrimary = bi === 0;
        const pillH = W < 480 ? 32 : 40;
        const pillY = bb.y + (bb.h - pillH) / 2;
        const padX = W < 480 ? 12 : 24;
        const pillW = bb.w - padX * 2;
        const pillX = bb.x + padX;
        const radius = pillH / 2;

        if (bb.glow > 0.01) {
          ctx.shadowColor = isPrimary ? '#9210f6' : 'rgba(255,255,255,0.3)';
          ctx.shadowBlur = 20 * bb.glow;
        }

        if (isPrimary) {
          const grad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
          grad.addColorStop(0, '#610497');
          grad.addColorStop(1, '#9210f6');
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
        }
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, radius);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (!isPrimary) {
          ctx.strokeStyle = 'rgba(255,255,255,0.22)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(pillX, pillY, pillW, pillH, radius);
          ctx.stroke();
        }

        ctx.fillStyle = '#fff';
        ctx.font = `${isPrimary ? 700 : 600} ${ctaFontSize}px 'DM Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bb.label, pillX + pillW / 2, pillY + pillH / 2 + 1);
      }

      const p = s.paddle;
      const pGrad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y);
      pGrad.addColorStop(0, '#610497');
      pGrad.addColorStop(0.5, '#9210f6');
      pGrad.addColorStop(1, '#610497');
      ctx.fillStyle = pGrad;
      ctx.shadowColor = '#c040ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.roundRect(p.x + 4, p.y + 1, p.w - 8, 3, 2);
      ctx.fill();

      s.trail.push({ x: s.ball.x, y: s.ball.y, life: 1 });
      if (s.trail.length > 12) s.trail.shift();
      s.trail.forEach(t => {
        t.life -= 0.08;
        if (t.life <= 0) return;
        ctx.beginPath();
        ctx.arc(t.x, t.y, BALL_R * t.life * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(146,16,246,${t.life * 0.3})`;
        ctx.fill();
      });
      s.trail = s.trail.filter(t => t.life > 0);

      const bGrad = ctx.createRadialGradient(s.ball.x - 2, s.ball.y - 2, 0, s.ball.x, s.ball.y, BALL_R);
      bGrad.addColorStop(0, '#fff');
      bGrad.addColorStop(0.3, '#c040ff');
      bGrad.addColorStop(1, '#9210f6');
      ctx.fillStyle = bGrad;
      ctx.shadowColor = '#c040ff';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      for (const pt of s.particles) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.life;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (s.running) rafRef.current = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (s.running) return;
      s.running = true;
      rafRef.current = requestAnimationFrame(loop);
    };

    /* Pause the game loop while it's off-screen to keep the main thread free. */
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (s.started && !s.running) startLoop();
      } else if (s.running) {
        s.running = false;
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      }
    });
    io.observe(wrap);

    // Draw one static frame now — the rAF loop only starts once the player interacts.
    loop();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('mousemove', onMouse);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('click', onCtaClick);
    };
  }, [started]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100%', minHeight: 'min(400px, 60vh)', borderRadius: 0, overflow: 'hidden', flex: '1 1 auto', touchAction: 'none' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'none', touchAction: 'none' }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px 20px',
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(18px, 3vw, 36px)', letterSpacing: 2, color: '#fff',
          whiteSpace: 'nowrap',
        }}>
          READY TO{' '}
          <span style={{
            background: 'linear-gradient(90deg, #9210f6, #c040ff, #f5c842)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>PLAY &amp; WIN?</span>
        </div>
      </div>
    </div>
  );
}
