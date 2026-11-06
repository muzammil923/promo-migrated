import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX, Pause, Play, Home as HomeIcon } from "lucide-react";

const LOGICAL_W = 360;
const LOGICAL_H = 480;

export default function FlappyPlayerPage({ gameData, sessionToken, onComplete }) {
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);
  const bgMusicRef = useRef(null);
  const bgMusicGainRef = useRef(null);

  const gRef = useRef({
    bird: { x: 90, y: LOGICAL_H / 2, r: 12, vy: 0 },
    pipes: [],
    frame: 0,
    gravity: 0.45,
    flapV: -6,
    clouds: [],
    groundOffset: 0,
    state: "home",
    soundOn: true,
    score: 0,
    best: gameData?.high_score || 0,
  });

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(gameData?.high_score || 0);
  const [uiState, setUiState] = useState("home");
  const [soundOn, setSoundOn] = useState(true);

  const makeClouds = () => {
    const arr = [];
    for (let i = 0; i < 4; i++) {
      arr.push({
        x: Math.random() * LOGICAL_W,
        y: 30 + Math.random() * 140,
        s: 0.6 + Math.random() * 0.8,
        speed: 0.2 + Math.random() * 0.25,
      });
    }
    return arr;
  };

  const resetGame = useCallback(() => {
    const g = gRef.current;
    g.bird = { x: 90, y: LOGICAL_H / 2, r: 12, vy: 0 };
    g.pipes = [];
    g.frame = 0;
    g.score = 0;
    g.clouds = makeClouds();
    g.groundOffset = 0;
    g.state = "home";
    setScore(0);
    setUiState("home");
  }, []);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  const tone = (freq, duration, type, startGain, opts = {}) => {
    if (!gRef.current.soundOn) return;
    const ac = getAudioCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (opts.slideTo) {
      osc.frequency.exponentialRampToValueAtTime(opts.slideTo, ac.currentTime + duration);
    }
    gain.gain.setValueAtTime(startGain, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration);
  };

  const sfxFlap = () => tone(420, 0.12, "sine", 0.18, { slideTo: 620 });
  const sfxScore = () => tone(880, 0.1, "triangle", 0.15, { slideTo: 1200 });
  const sfxHit = () => tone(180, 0.35, "sawtooth", 0.2, { slideTo: 60 });

  const playBackgroundMusic = () => {
    if (bgMusicRef.current) return;
    const audio = new Audio("/flappy-bg-music.mp3");
    audio.loop = true;
    audio.volume = 0.3;
    bgMusicRef.current = audio;
    audio.play().catch(() => {});
  };

  const stopBackgroundMusic = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current = null;
    }
  };

  const haptic = (pattern) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
  };

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;

    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;

    const scaleX = (cssW / LOGICAL_W) * dpr;
    const scaleY = (cssH / LOGICAL_H) * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  }, []);

  const flap = useCallback(() => {
    const g = gRef.current;
    getAudioCtx();

    if (g.state === "home") {
      g.state = "playing";
      setUiState("playing");
      // Start background music when game starts
      playBackgroundMusic();
      return;
    }
    if (g.state === "playing") {
      g.bird.vy = g.flapV;
      sfxFlap();
      haptic(12);
    }
    if (g.state === "over") {
      resetGame();
      gRef.current.state = "playing";
      setUiState("playing");
      playBackgroundMusic();
    }
  }, [resetGame]);

const togglePause = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const g = gRef.current;
    if (g.state === "playing") {
      g.state = "paused";
      setUiState("paused");
      if (bgMusicRef.current) bgMusicRef.current.pause();
    } else if (g.state === "paused") {
      g.state = "playing";
      setUiState("playing");
      if (bgMusicRef.current) bgMusicRef.current.play().catch(() => {});
    }
  }, []);

  const resume = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    gRef.current.state = "playing";
    setUiState("playing");
  }, []);

  const goHome = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      stopBackgroundMusic();
      resetGame();
    },
    [resetGame]
  );

  const toggleSound = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    gRef.current.soundOn = !gRef.current.soundOn;
    setSoundOn(gRef.current.soundOn);
  }, []);

  const spawnPipe = () => {
    const g = gRef.current;
    const gap = 130;
    const margin = 50;
    const top = margin + Math.random() * (LOGICAL_H - gap - margin * 2);
    g.pipes.push({ x: LOGICAL_W + 20, top, gap, w: 46, passed: false });
  };

  const update = () => {
    const g = gRef.current;

    for (const c of g.clouds) {
      c.x -= c.speed;
      if (c.x < -40) c.x = LOGICAL_W + 40;
    }
    g.groundOffset = (g.groundOffset + 2.6) % 24;

    if (g.state === "playing") {
      g.frame++;
      g.bird.vy += g.gravity;
      g.bird.y += g.bird.vy;

      if (g.frame % 90 === 0) spawnPipe();

      for (const p of g.pipes) p.x -= 2.6;
      while (g.pipes.length && g.pipes[0].x < -60) g.pipes.shift();

      for (const p of g.pipes) {
        if (!p.passed && p.x + p.w < g.bird.x) {
          p.passed = true;
          g.score++;
          setScore(g.score);
          sfxScore();
          haptic(8);
        }
      }

      for (const p of g.pipes) {
        const withinX = g.bird.x + g.bird.r > p.x && g.bird.x - g.bird.r < p.x + p.w;
        const hitTop = g.bird.y - g.bird.r < p.top;
        const hitBottom = g.bird.y + g.bird.r > p.top + p.gap;
        if (withinX && (hitTop || hitBottom)) endGame();
      }

      if (g.bird.y + g.bird.r > LOGICAL_H - 4 || g.bird.y - g.bird.r < 0) endGame();
    }
  };

  const endGame = () => {
    const g = gRef.current;
    g.state = "over";
    setUiState("over");
    sfxHit();
    haptic([30, 40, 30]);
    stopBackgroundMusic();
    if (g.score > g.best) {
      g.best = g.score;
      setBest(g.best);
    }
    if (g.score > 0 && gameData?.id) {
      try {
        let devId = null;
        try { devId = localStorage.getItem('device_id') || null } catch {}
        fetch('/api/play/record-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game_id: gameData.id, score: g.score, device_id: devId || undefined })
        }).then(r => r.json()).then(d => { if (d && d.success && d.high_score) { const hi = Math.max(g.best, d.high_score); g.best = hi; setBest(hi); } }).catch(() => {})
      } catch {}
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const g = gRef.current;

    drawSky(ctx, g.clouds);
    drawPipes(ctx, g.pipes);
    drawGround(ctx, g.groundOffset);
    drawBird(ctx, g.bird);

    if (g.state === "home") drawHome(ctx, g.best);
    if (g.state === "over") drawOver(ctx, g.score, g.best);
    if (g.state === "paused") drawPausedDim(ctx);
  };

  useEffect(() => {
    resetGame();
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);

    const onKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.focus();

    const loop = () => {
      update();
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const onCanvasPointerDown = (e) => {
    e.preventDefault();
    flap();
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        margin: 0,
        background: "#1B1030",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        overflow: "hidden",
        boxSizing: "border-box",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", lineHeight: 0 }}>
        <canvas
          ref={canvasRef}
          width={LOGICAL_W}
          height={LOGICAL_H}
          onPointerDown={onCanvasPointerDown}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            touchAction: "none",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            WebkitUserSelect: "none",
            userSelect: "none",
            outline: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 14,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            padding: "0 60px",
            fontSize: 15,
            color: "#F3E8FF",
            pointerEvents: "none",
            textShadow: "0 2px 6px rgba(0,0,0,0.6)",
          }}
        >
          <div>
            Score: <span style={{ fontWeight: 700 }}>{score}</span>
          </div>
          <div>
            Best: <span style={{ fontWeight: 700 }}>{best}</span>
          </div>
        </div>

        <button
          onPointerDown={toggleSound}
          title="Toggle sound"
          style={iconBtnStyle({ right: 10 })}
        >
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {(uiState === "playing" || uiState === "paused") && (
          <button onPointerDown={togglePause} title="Pause" style={iconBtnStyle({ left: 10 })}>
            {uiState === "paused" ? <Play size={18} /> : <Pause size={18} />}
          </button>
        )}

        {uiState === "paused" && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              alignItems: "center",
            }}
          >
            <button onPointerDown={resume} style={pillBtnStyle}>
              <Play size={16} />
              Resume
            </button>
            <button onPointerDown={goHome} style={pillBtnStyle}>
              <HomeIcon size={16} />
              Menu
            </button>
          </div>
        )}

        {uiState === "over" && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "72%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <button onPointerDown={goHome} style={pillBtnStyle}>
              <HomeIcon size={16} />
              Home
            </button>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 13,
            color: "#E7D2FA",
            pointerEvents: "none",
            textShadow: "0 2px 6px rgba(0,0,0,0.6)",
          }}
        >
          Tap the screen or press space to flap
        </div>
      </div>
    </div>
  );
}

function iconBtnStyle(pos) {
  return {
    position: "absolute",
    top: 10,
    ...pos,
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "none",
    background: "rgba(20, 10, 36, 0.5)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    WebkitTapHighlightColor: "transparent",
    outline: "none",
    touchAction: "manipulation",
  };
}

const pillBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 22px",
  borderRadius: 24,
  border: "none",
  background: "#3B1656",
  color: "#E7D2FA",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  outline: "none",
  touchAction: "manipulation",
};

function drawSky(ctx, clouds) {
  const g = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
  g.addColorStop(0, "#4A1B6D");
  g.addColorStop(0.55, "#6D2E91");
  g.addColorStop(1, "#8C4FB0");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  for (const c of clouds) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(c.s, c.s);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.arc(16, -6, 12, 0, Math.PI * 2);
    ctx.arc(-16, -4, 12, 0, Math.PI * 2);
    ctx.arc(0, -10, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawGround(ctx, groundOffset) {
  const groundY = LOGICAL_H - 22;
  ctx.fillStyle = "#3B1656";
  ctx.fillRect(0, groundY, LOGICAL_W, 22);
  ctx.fillStyle = "#5B2C82";
  for (let x = -groundOffset; x < LOGICAL_W; x += 24) {
    ctx.fillRect(x, groundY, 12, 6);
  }
  ctx.fillStyle = "#2A0E42";
  ctx.fillRect(0, groundY, LOGICAL_W, 4);
}

function drawPipes(ctx, pipes) {
  for (const p of pipes) {
    const grad = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
    grad.addColorStop(0, "#9C4DCC");
    grad.addColorStop(0.5, "#6A1B9A");
    grad.addColorStop(1, "#9C4DCC");

    ctx.fillStyle = grad;
    ctx.fillRect(p.x, 0, p.w, p.top);
    ctx.fillRect(p.x, p.top + p.gap, p.w, LOGICAL_H - 22 - (p.top + p.gap));

    ctx.fillStyle = "#4A1B6D";
    ctx.fillRect(p.x - 4, p.top - 16, p.w + 8, 16);
    ctx.fillRect(p.x - 4, p.top + p.gap, p.w + 8, 16);

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(p.x + 4, 0, 6, p.top);
    ctx.fillRect(p.x + 4, p.top + p.gap, 6, LOGICAL_H - 22 - (p.top + p.gap));
  }
}

function drawBird(ctx, bird) {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  const angle = Math.max(-0.5, Math.min(0.9, bird.vy / 10));
  ctx.rotate(angle);

  ctx.fillStyle = "rgba(20,10,36,0.28)";
  ctx.beginPath();
  ctx.ellipse(2, bird.r + 4, bird.r * 0.9, bird.r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  const bodyGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, bird.r + 4);
  bodyGrad.addColorStop(0, "#C9A0F5");
  bodyGrad.addColorStop(1, "#4A1B6D");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2A0E42";
  ctx.beginPath();
  ctx.moveTo(bird.r - 2, -2);
  ctx.lineTo(bird.r + 9, 2);
  ctx.lineTo(bird.r - 2, 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#F3E8FF";
  ctx.beginPath();
  ctx.arc(4, -4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2A0E42";
  ctx.beginPath();
  ctx.arc(5, -4, 1.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHome(ctx, best) {
  ctx.fillStyle = "rgba(20,10,36,0.55)";
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 30px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Flappy Bird", LOGICAL_W / 2, LOGICAL_H / 2 - 60);

  ctx.font = "400 14px sans-serif";
  ctx.fillStyle = "#E7D2FA";
  ctx.fillText("Tap or press space to start", LOGICAL_W / 2, LOGICAL_H / 2 - 30);

  ctx.beginPath();
  ctx.arc(LOGICAL_W / 2, LOGICAL_H / 2 + 30, 34, 0, Math.PI * 2);
  ctx.fillStyle = "#3B1656";
  ctx.fill();
  ctx.fillStyle = "#C9A0F5";
  ctx.beginPath();
  ctx.moveTo(LOGICAL_W / 2 - 8, LOGICAL_H / 2 + 14);
  ctx.lineTo(LOGICAL_W / 2 - 8, LOGICAL_H / 2 + 46);
  ctx.lineTo(LOGICAL_W / 2 + 18, LOGICAL_H / 2 + 30);
  ctx.closePath();
  ctx.fill();

  if (best > 0) {
    ctx.font = "500 13px sans-serif";
    ctx.fillStyle = "#C9A0F5";
    ctx.fillText("Best: " + best, LOGICAL_W / 2, LOGICAL_H / 2 + 90);
  }
}

function drawOver(ctx, score, best) {
  ctx.fillStyle = "rgba(20,10,36,0.65)";
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  ctx.fillStyle = "#F3E8FF";
  ctx.font = "700 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Game over", LOGICAL_W / 2, LOGICAL_H / 2 - 20);
  ctx.font = "400 15px sans-serif";
  ctx.fillText("Score: " + score, LOGICAL_W / 2, LOGICAL_H / 2 + 8);
  ctx.font = "400 13px sans-serif";
  ctx.fillStyle = "#C9A0F5";
  ctx.fillText("Best: " + best, LOGICAL_W / 2, LOGICAL_H / 2 + 30);
  ctx.font = "500 13px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("Tap to play again", LOGICAL_W / 2, LOGICAL_H / 2 + 60);
}

function drawPausedDim(ctx) {
  ctx.fillStyle = "rgba(20,10,36,0.6)";
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
}