import React, { useEffect, useRef, useState } from "react";

/**
 * Tilt & Pour — mobile tilt-controlled pouring game.
 * Works on iOS Safari (requests DeviceOrientation permission on a tap,
 * as required by iOS 13+) and Android Chrome/Firefox (no permission
 * prompt needed there — sensors are read directly once the user starts).
 * Falls back to click/touch-drag tilt control automatically if a device
 * has no motion sensors, denies permission, or the host page blocks
 * sensor access (e.g. an iframe without an "accelerometer/gyroscope"
 * Permissions-Policy) — the drag fallback keeps the game fully playable.
 */
export default function TiltPourGame({ gameData, sessionToken, onComplete }) {
  const canvasRef = useRef(null);
  const scoreRef = useRef(null);
  const fillRef = useRef(null);
  const comboRef = useRef(null);
  const timerWrapRef = useRef(null);
  const timerFillRef = useRef(null);
  const timerNumRef = useRef(null);
  const tiltFillRef = useRef(null);
  const tiltThreshRef = useRef(null);
  const levelTitleRef = useRef(null);
  const levelSubRef = useRef(null);
  const iconSoundRef = useRef(null);
  const bestRef = useRef(null);
  const targetRef = useRef(null);
  const comboLabelRef = useRef(null);
  const comboCardRef = useRef(null);
  const fillBarRef = useRef(null);
  const tiltDotRef = useRef(null);

  // Imperative "remote control" populated by the game effect, called from JSX buttons.
  const apiRef = useRef({
    start(){}, resume(){}, pause(){}, recalibrate(){}, restart(){},
    next(){}, replay(){}, retry(){}, quitToStart(){}, playAgain(){},
    setMuted(){}, setMasterVolume(){}, setMusicVolume(){},
  });

  const [overlay, setOverlay] = useState("start"); // start | pause | win | fail | alldone | null
  const [muted, setMuted] = useState(false);
  const [winData, setWinData] = useState({ title: "", stars: 0, breakdown: [], total: 0, nextLabel: "Next Level" });
  const [failReason, setFailReason] = useState("");
  const [finalScore, setFinalScore] = useState(0);
  const [motionStatus, setMotionStatus] = useState("idle"); // idle | granted | denied | unsupported
  const [sensorHint, setSensorHint] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    let W = 0, H = 0, DPR = 1;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2.5);
      W = canvas.clientWidth || window.innerWidth;
      H = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      layout();
    }
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => resize());
      ro.observe(canvas);
    }

    // Prevent the host page from scrolling/rubber-banding behind the game
    // while the player drags or tilts (iOS Safari especially likes to bounce).
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overscrollBehavior = "none";
    function preventScroll(e) { e.preventDefault(); }
    canvas.addEventListener("touchmove", preventScroll, { passive: false });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // Auto-pause when the tab/app is backgrounded so pour audio doesn't get
    // stuck looping and the player doesn't lose the level while away.
    function autoPause() {
      Audio_.stopPour();
      if (state === STATE.PLAYING) { state = STATE.PAUSED; setOverlay("pause"); }
    }
    function onVisibility() {
      if (document.hidden) autoPause(); else Audio_.resumeIfSuspended();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", autoPause);

    /* ================= AUDIO (synthesized, no external assets) ================= */
    const Audio_ = (function () {
      let actx = null, masterGain, musicGain, sfxGain;
      // main pour stream
      let pourNode = null, pourFilter = null, pourGain = null;
      // secondary "froth/splash" layer that kicks in with stronger flow
      let sizzleNode = null, sizzleFilter = null, sizzleGain = null;
      // continuous subtle modulation while pouring (filter wobble + glug/bubble tremolo)
      let freqLfo = null, freqLfoGain = null, glugLfo = null, glugDepthGain = null;
      let musicNodes = []; // persistent nodes torn down together (pad filter, delay chain, LFOs)
      let musicTimer = null;
      let started = false;

      function ensure() {
        if (actx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        actx = new AC();
        masterGain = actx.createGain(); masterGain.gain.value = 0.7;
        musicGain = actx.createGain(); musicGain.gain.value = 0.3;
        sfxGain = actx.createGain(); sfxGain.gain.value = 1.0;
        musicGain.connect(masterGain); sfxGain.connect(masterGain);
        masterGain.connect(actx.destination);
      }
      function noiseBuffer(seconds) {
        const sr = actx.sampleRate;
        const buf = actx.createBuffer(1, sr * seconds, sr);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        return buf;
      }
      function setMasterVolume(v) { if (actx) masterGain.gain.setTargetAtTime(v, actx.currentTime, 0.05); }
      function setMusicVolume(v) { if (actx) musicGain.gain.setTargetAtTime(v, actx.currentTime, 0.05); }

      /* ---------------- fancy background music: warm pad + plucked arpeggio + echo ---------------- */
      function startMusic() {
        if (!actx || musicNodes.length || musicTimer) return;

        // slow-breathing lowpass on the pad for a soft, "fancy" evolving warmth
        const padFilter = actx.createBiquadFilter();
        padFilter.type = "lowpass"; padFilter.frequency.value = 1100; padFilter.Q.value = 0.3;
        padFilter.connect(musicGain);
        const padLfo = actx.createOscillator(); padLfo.frequency.value = 0.045;
        const padLfoGain = actx.createGain(); padLfoGain.gain.value = 420;
        padLfo.connect(padLfoGain); padLfoGain.connect(padFilter.frequency);
        padLfo.start();

        // gentle stereo-ish shimmer delay bus for the arpeggio
        const arpDry = actx.createGain(); arpDry.gain.value = 0.9; arpDry.connect(musicGain);
        const arpSend = actx.createGain(); arpSend.gain.value = 0.55;
        const delay = actx.createDelay(1.2); delay.delayTime.value = 0.33;
        const feedback = actx.createGain(); feedback.gain.value = 0.34;
        const delayFilter = actx.createBiquadFilter(); delayFilter.type = "lowpass"; delayFilter.frequency.value = 2000;
        arpSend.connect(delay); delay.connect(delayFilter); delayFilter.connect(feedback); feedback.connect(delay);
        delayFilter.connect(musicGain);

        musicNodes = [padFilter, padLfo, padLfoGain, arpDry, arpSend, delay, feedback, delayFilter];

        // warm, jazzy 4-chord loop (Cmaj9 - Am9 - Fmaj9 - G6/9 style voicings)
        const chordProg = [
          [130.81, 164.81, 196.00, 246.94], // C E G B
          [110.00, 130.81, 164.81, 220.00], // A C E A
          [174.61, 220.00, 261.63, 349.23], // F A C F
          [196.00, 246.94, 293.66, 392.00], // G B D G
        ];
        const arpShape = [0, 1, 2, 3, 2, 1]; // up-down pattern through chord tones
        const tempo = 88; // bpm, unhurried
        const stepSec = 60 / tempo / 2; // 8th-note step
        const stepsPerChord = 8;

        function triggerPad(chord, time, dur) {
          chord.forEach((f, i) => {
            const osc = actx.createOscillator();
            osc.type = i % 2 === 0 ? "sine" : "triangle";
            osc.frequency.value = f;
            const g = actx.createGain();
            g.gain.setValueAtTime(0.0001, time);
            g.gain.exponentialRampToValueAtTime(0.055, time + dur * 0.3);
            g.gain.setValueAtTime(0.055, time + dur * 0.75);
            g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
            osc.connect(g); g.connect(padFilter);
            osc.start(time); osc.stop(time + dur + 0.05);
            osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (e) {} };
          });
        }
        function triggerArpNote(freq, time) {
          const osc = actx.createOscillator();
          osc.type = "triangle"; osc.frequency.value = freq;
          const g = actx.createGain();
          g.gain.setValueAtTime(0.0001, time);
          g.gain.exponentialRampToValueAtTime(0.085, time + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);
          osc.connect(g); g.connect(arpDry); g.connect(arpSend);
          osc.start(time); osc.stop(time + 0.45);
          osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (e) {} };
        }

        let step = 0;
        let nextTime = actx.currentTime + 0.05;
        function scheduleStep(idx, time) {
          const chordIdx = Math.floor(idx / stepsPerChord) % chordProg.length;
          const chord = chordProg[chordIdx];
          const pos = idx % stepsPerChord;
          if (pos === 0) triggerPad(chord, time, stepsPerChord * stepSec);
          const arpFreq = chord[arpShape[pos % arpShape.length] % chord.length] * 2;
          triggerArpNote(arpFreq, time);
        }
        function tick() {
          while (nextTime < actx.currentTime + 0.12) {
            scheduleStep(step, nextTime);
            nextTime += stepSec;
            step++;
          }
          musicTimer = setTimeout(tick, 40);
        }
        tick();
      }
      function stopMusic() {
        if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
        musicNodes.forEach(n => { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
        musicNodes = [];
      }

      /* ---------------- realistic layered pour sound ---------------- */
      function startPour() {
        if (!actx || pourNode) return;
        // main tonal stream body
        pourNode = actx.createBufferSource();
        pourNode.buffer = noiseBuffer(2); pourNode.loop = true;
        pourFilter = actx.createBiquadFilter();
        pourFilter.type = "bandpass"; pourFilter.frequency.value = 750; pourFilter.Q.value = 1.15;
        pourGain = actx.createGain(); pourGain.gain.value = 0.0001;
        pourNode.connect(pourFilter); pourFilter.connect(pourGain); pourGain.connect(sfxGain);
        pourNode.start();

        // high, airy froth/splash texture that only really speaks at stronger flow
        sizzleNode = actx.createBufferSource();
        sizzleNode.buffer = noiseBuffer(1.3); sizzleNode.loop = true;
        sizzleFilter = actx.createBiquadFilter();
        sizzleFilter.type = "highpass"; sizzleFilter.frequency.value = 3200; sizzleFilter.Q.value = 0.5;
        sizzleGain = actx.createGain(); sizzleGain.gain.value = 0.0001;
        sizzleNode.connect(sizzleFilter); sizzleFilter.connect(sizzleGain); sizzleGain.connect(sfxGain);
        sizzleNode.start();

        // slow filter wobble so the stream doesn't sound like a static tone
        freqLfo = actx.createOscillator(); freqLfo.type = "sine"; freqLfo.frequency.value = 4.6;
        freqLfoGain = actx.createGain(); freqLfoGain.gain.value = 70;
        freqLfo.connect(freqLfoGain); freqLfoGain.connect(pourFilter.frequency);
        freqLfo.start();

        // glug/bubble tremolo — pronounced on a thin trickle, smooths out on a full stream
        glugLfo = actx.createOscillator(); glugLfo.type = "sine"; glugLfo.frequency.value = 6.5;
        glugDepthGain = actx.createGain(); glugDepthGain.gain.value = 0;
        glugLfo.connect(glugDepthGain); glugDepthGain.connect(pourGain.gain);
        glugLfo.start();
      }
      function updatePour(flow01) {
        if (!pourGain) return;
        const t = actx.currentTime;
        const level = 0.0001 + flow01 * 0.42;
        pourGain.gain.setTargetAtTime(level, t, 0.07);
        pourFilter.frequency.setTargetAtTime(650 + flow01 * 1900, t, 0.09);
        pourFilter.Q.setTargetAtTime(0.9 + flow01 * 0.9, t, 0.15);
        if (sizzleGain) sizzleGain.gain.setTargetAtTime(0.0001 + Math.pow(flow01, 1.6) * 0.16, t, 0.1);
        if (glugDepthGain) glugDepthGain.gain.setTargetAtTime(level * 0.5 * (1 - flow01 * 0.85), t, 0.2);
      }
      function stopPour() {
        if (!pourNode) return;
        try {
          const t = actx.currentTime;
          pourGain.gain.setTargetAtTime(0.0001, t, 0.08);
          if (sizzleGain) sizzleGain.gain.setTargetAtTime(0.0001, t, 0.08);
          const cleanupNodes = [pourNode, pourFilter, pourGain, sizzleNode, sizzleFilter, sizzleGain, freqLfo, freqLfoGain, glugLfo, glugDepthGain];
          setTimeout(() => {
            cleanupNodes.forEach(n => { if (!n) return; try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
          }, 260);
        } catch (e) {}
        pourNode = null; pourFilter = null; pourGain = null;
        sizzleNode = null; sizzleFilter = null; sizzleGain = null;
        freqLfo = null; freqLfoGain = null; glugLfo = null; glugDepthGain = null;
      }
      function splash(vol) {
        if (!actx) return;
        const t0 = actx.currentTime;
        const v = vol || 0.5;
        // watery noise burst
        const src = actx.createBufferSource(); src.buffer = noiseBuffer(0.3);
        const filt = actx.createBiquadFilter(); filt.type = "bandpass"; filt.frequency.value = 1800; filt.Q.value = 0.8;
        const g = actx.createGain();
        g.gain.setValueAtTime(v * 0.5, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
        src.connect(filt); filt.connect(g); g.connect(sfxGain);
        src.start(t0); src.stop(t0 + 0.25);
        // low pitch-drop "plink" for a droplet impact
        const osc = actx.createOscillator(); osc.type = "sine";
        osc.frequency.setValueAtTime(320, t0);
        osc.frequency.exponentialRampToValueAtTime(90, t0 + 0.12);
        const og = actx.createGain();
        og.gain.setValueAtTime(v * 0.22, t0);
        og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.14);
        osc.connect(og); og.connect(sfxGain);
        osc.start(t0); osc.stop(t0 + 0.15);
      }
      function click() {
        if (!actx) return;
        const osc = actx.createOscillator(); osc.type = "square"; osc.frequency.value = 720;
        const g = actx.createGain();
        g.gain.setValueAtTime(0.15, actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.08);
        osc.connect(g); g.connect(sfxGain);
        osc.start(); osc.stop(actx.currentTime + 0.09);
      }
      function chime(success) {
        if (!actx) return;
        const seq = success ? [523.25, 659.25, 783.99, 1046.5] : [392, 329.63, 261.63];
        seq.forEach((f, i) => {
          const osc = actx.createOscillator();
          osc.type = success ? "triangle" : "sawtooth"; osc.frequency.value = f;
          const g = actx.createGain();
          const t0 = actx.currentTime + i * 0.11;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
          osc.connect(g); g.connect(sfxGain);
          osc.start(t0); osc.stop(t0 + 0.4);
        });
      }
      let mutedPref = false;
      function unlock() {
        const hadCtx = !!actx;
        ensure();
        if (!actx) return;
        if (actx.state === "suspended") actx.resume();
        if (!started) { started = true; startMusic(); }
        if (!hadCtx && mutedPref) masterGain.gain.setTargetAtTime(0, actx.currentTime, 0.01);
      }
      function resumeIfSuspended() { if (actx && actx.state === "suspended") actx.resume(); }
      function setMutedFn(m) { mutedPref = m; if (actx) masterGain.gain.setTargetAtTime(m ? 0 : 0.7, actx.currentTime, 0.05); }
      function teardown() { stopPour(); stopMusic(); try { actx && actx.close(); } catch (e) {} }
      return { unlock, resumeIfSuspended, startPour, updatePour, stopPour, splash, click, chime, setMasterVolume, setMusicVolume, setMuted: setMutedFn, teardown };
    })();

    /* ================= UTIL ================= */
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function rand(a, b) { return a + Math.random() * (b - a); }
    function fmtPct(v) { return Math.round(v * 100) + "%"; }

    /* ================= LEVELS ================= */
    const LEVELS = [
      { name: "First Pour", bottleScale: 1.0, startFill: 1.0, liquidA: "#FFC93D", liquidB: "#FF8A3D", timeLimit: null,
        cups: [{ baseX: 0.32, w: 84, capacity: 1.0, min: 0.72, max: 1.0, moveAmp: 0, moveSpeed: 0 }] },
      { name: "Small Cup", bottleScale: 1.0, startFill: 1.0, liquidA: "#7EE7F0", liquidB: "#2FB6D9", timeLimit: null,
        cups: [{ baseX: 0.32, w: 56, capacity: 0.55, min: 0.78, max: 0.95, moveAmp: 0, moveSpeed: 0 }] },
      { name: "On the Move", bottleScale: 1.05, startFill: 1.0, liquidA: "#FF8FD0", liquidB: "#E64BA3", timeLimit: null,
        cups: [{ baseX: 0.32, w: 70, capacity: 0.7, min: 0.78, max: 0.95, moveAmp: 0.20, moveSpeed: 0.55 }] },
      { name: "Beat the Clock", bottleScale: 1.0, startFill: 1.0, liquidA: "#B6FF6B", liquidB: "#5FC93D", timeLimit: 16,
        cups: [{ baseX: 0.32, w: 80, capacity: 0.85, min: 0.68, max: 1.0, moveAmp: 0, moveSpeed: 0 }] },
      { name: "Steady Hands", bottleScale: 0.95, startFill: 1.0, liquidA: "#C8A2FF", liquidB: "#8A4BE6", timeLimit: null,
        cups: [{ baseX: 0.32, w: 62, capacity: 0.6, min: 0.90, max: 0.97, moveAmp: 0, moveSpeed: 0 }] },
      { name: "Dodge & Pour", bottleScale: 1.05, startFill: 1.0, liquidA: "#FF8A3D", liquidB: "#FF5C5C", timeLimit: null,
        obstacle: { amp: 0.30, speed: 0.42, w: 34 },
        cups: [{ baseX: 0.32, w: 66, capacity: 0.75, min: 0.80, max: 0.96, moveAmp: 0.26, moveSpeed: 0.5 }] },
      { name: "Triple Threat", bottleScale: 1.1, startFill: 1.4, liquidA: "#FFC93D", liquidB: "#FF8A3D", timeLimit: 32, sequential: true,
        cups: [
          { baseX: 0.32, w: 50, capacity: 0.42, min: 0.80, max: 0.97, moveAmp: 0, moveSpeed: 0 },
          { baseX: 0.32, w: 50, capacity: 0.42, min: 0.80, max: 0.97, moveAmp: 0, moveSpeed: 0 },
          { baseX: 0.32, w: 50, capacity: 0.42, min: 0.80, max: 0.97, moveAmp: 0, moveSpeed: 0 },
        ] },
      { name: "Last Drop", bottleScale: 1.0, startFill: 0.5, liquidA: "#7EE7F0", liquidB: "#2FB6D9", timeLimit: 22,
        cups: [{ baseX: 0.32, w: 74, capacity: 0.46, min: 0.90, max: 1.0, moveAmp: 0, moveSpeed: 0 }] },
    ];

    /* ================= GAME STATE ================= */
    const STATE = { START: "start", PLAYING: "playing", PAUSED: "paused", WIN: "win", FAIL: "fail", ALLDONE: "alldone" };
    let state = STATE.START;

    let levelIndex = 0;
    let totalScore = 0;
    let bestScore = Number(gameData?.high_score) || 0;
    let combo = 1;

    let angleDeg = 0;
    let rawAngleTarget = 0;
    let calibration = 0;
    let usingOrientation = false;
    let lastBeta = 35;
    let dragActive = false;
    let dragStartY = 0;
    let dragStartAngle = 0;

    const TILT_THRESHOLD = 27;
    const TILT_MAX = 125;

    let liquidFrac = 1.0;
    let flow01 = 0;

    let cups = [];
    let obstacle = null;
    let levelTime = 0;
    let timeLeft = null;
    let sequentialActive = 0;
    let successHoldTimer = 0;

    let bottlePivot = { x: 0, y: 0 };
    let bottleDims = { baseScale: 1 };
    let bottleFloat = 0; // current lift height (px), eases toward a target each frame while pouring
    let floorY = 0;
    let catchZoneHalf = 70;
    let pourTargetX = 0; // fixed x where the glass sits, off to the side of the bottle

    let particles = [];
    let streamDroplets = [];
    let lastTs = 0;
    let rafId = null;
    let destroyed = false;

    function layout() {
      bottlePivot.x = W * 0.68;
      const scale = clamp(Math.min(W, H) / 420, 0.62, 1.15);
      bottleDims.baseScale = scale;
      floorY = H * 0.86;
      bottlePivot.y = floorY; // base of the jar rests right on the tabletop
      catchZoneHalf = clamp(W * 0.12, 46, 95);
      pourTargetX = W * 0.32;
    }

    function setupLevel(idx) {
      const def = LEVELS[idx];
      liquidFrac = def.startFill;
      angleDeg = 0; rawAngleTarget = 0;
      flow01 = 0; bottleFloat = 0;
      particles = []; streamDroplets = [];
      levelTime = 0;
      timeLeft = def.timeLimit;
      successHoldTimer = 0;
      sequentialActive = 0;

      cups = def.cups.map((c, i) => ({
        def: c, fill: 0, phase: rand(0, Math.PI * 2),
        active: def.sequential ? i === 0 : true,
        settled: false, resultStars: 0,
        bubbleSeeds: Array.from({ length: 5 }, () => ({ dx: rand(-0.3, 0.3), speed: rand(0.08, 0.16), offset: rand(0, 1) })),
        wetSpots: Array.from({ length: 4 }, () => ({ dx: rand(-0.7, 0.7), dy: rand(0, 0.4), r: rand(2.5, 6) })),
      }));
      obstacle = def.obstacle ? { phase: 0, def: def.obstacle } : null;

      if (levelTitleRef.current) levelTitleRef.current.textContent = "Level " + (idx + 1);
      if (levelSubRef.current) levelSubRef.current.textContent = def.name;
      if (timerWrapRef.current) timerWrapRef.current.style.display = def.timeLimit ? "flex" : "none";
      updateHUD();
    }

    /* ================= DEVICE ORIENTATION ================= */
    let calibrationPending = false;
    let sensorHintTimer = null;
    function showSensorHint() {
      setSensorHint(true);
      if (sensorHintTimer) clearTimeout(sensorHintTimer);
      sensorHintTimer = setTimeout(() => setSensorHint(false), 4500);
    }

    function handleOrientation(e) {
      if (e.beta === null || e.beta === undefined) return;
      usingOrientation = true;
      setMotionStatus("granted");
      lastBeta = e.beta;
      if (calibrationPending) { calibration = e.beta; calibrationPending = false; }
      let delta = e.beta - calibration;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      rawAngleTarget = clamp(delta, -20, TILT_MAX);
    }
    function orientationListener(e) {
      if (e.beta !== null && e.beta !== undefined) lastBeta = e.beta;
      handleOrientation(e);
    }
    window.addEventListener("deviceorientation", orientationListener, true);

    // Calibrates against the very next real sensor reading rather than a
    // guessed default, so the "upright" reference is always accurate.
    function calibrateNow() {
      calibrationPending = true;
      // Fallback in case no fresh event arrives (sensor stalled): use last known value.
      setTimeout(() => { if (calibrationPending) { calibration = lastBeta; calibrationPending = false; } }, 1200);
    }

    function requestMotionPermission() {
      Audio_.unlock();
      const DOE = window.DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission === "function") {
        // iOS 13+ requires this call directly inside a user-gesture handler.
        DOE.requestPermission()
          .then((res) => {
            if (res === "granted") {
              setMotionStatus("granted");
              calibrateNow();
            } else {
              setMotionStatus("denied");
            }
            enterPlay();
          })
          .catch(() => { setMotionStatus("denied"); enterPlay(); });
      } else if (window.DeviceOrientationEvent) {
        // Android / other browsers: no permission prompt, sensors just work.
        calibrateNow();
        enterPlay();
        // If no event arrives shortly, the drag fallback silently takes over.
        setTimeout(() => { if (!usingOrientation) { setMotionStatus("unsupported"); showSensorHint(); } }, 1500);
      } else {
        setMotionStatus("unsupported");
        showSensorHint();
        enterPlay();
      }
    }

    function enterPlay() {
      setupLevel(levelIndex);
      state = STATE.PLAYING;
      setOverlay(null);
    }

    /* ---- drag fallback (also works as a manual override on touch devices) ---- */
    function onPointerDown(e) {
      if (state !== STATE.PLAYING) return;
      dragActive = true;
      dragStartY = e.clientY;
      dragStartAngle = rawAngleTarget;
    }
    function onPointerMove(e) {
      if (!dragActive) return;
      const dy = e.clientY - dragStartY;
      rawAngleTarget = clamp(dragStartAngle + dy * 0.35, -20, TILT_MAX);
    }
    function onPointerUp() {
      if (!dragActive) return;
      dragActive = false;
      if (!usingOrientation) rawAngleTarget = 0;
    }
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    /* ================= PARTICLES ================= */
    function spawnSplash(x, y, color, count, power) {
      for (let i = 0; i < count; i++) {
        const a = rand(-Math.PI * 0.95, -Math.PI * 0.05);
        const sp = rand(power * 0.4, power);
        particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.35, 0.7), age: 0, r: rand(1.6, 3.6), color });
      }
    }
    function spawnRipple(x, y, color) { particles.push({ ripple: true, x, y, life: 0.5, age: 0, r: 2, color }); }

    /* ================= UPDATE ================= */
    function currentLiquidColor() { return LEVELS[levelIndex].liquidA; }
    function cupSurfaceY(c) { return floorY - Math.min(c.fill, 1) * c.cupH; }

    function starsFor(c) {
      const mid = (c.def.min + c.def.max) / 2;
      const band = (c.def.max - c.def.min) / 2;
      const d = Math.abs(c.fill - mid);
      if (c.fill >= c.def.min && c.fill <= c.def.max && d < band * 0.35) return 3;
      if (c.fill >= c.def.min && c.fill <= c.def.max) return 2;
      return c.fill > 0 ? 1 : 0;
    }

    function update(dt) {
      levelTime += dt;
      const def = LEVELS[levelIndex];

      const smoothing = usingOrientation ? 0.16 : 0.22;
      angleDeg = lerp(angleDeg, rawAngleTarget, clamp((dt / 0.016) * smoothing, 0, 1));
      if (Math.abs(angleDeg - rawAngleTarget) < 0.02) angleDeg = rawAngleTarget;

      let targetFlow = 0;
      if (angleDeg > TILT_THRESHOLD && liquidFrac > 0.001) {
        targetFlow = clamp((angleDeg - TILT_THRESHOLD) / (TILT_MAX - TILT_THRESHOLD), 0, 1);
        targetFlow = Math.pow(targetFlow, 0.7);
      }
      flow01 = lerp(flow01, targetFlow, clamp(dt * 6, 0, 1));

      const floatMax = 170 * bottleDims.baseScale;
      const floatTarget = flow01 > 0.04 ? floatMax * clamp(flow01 * 1.35, 0, 1) : 0;
      bottleFloat = lerp(bottleFloat, floatTarget, clamp(dt * (floatTarget > bottleFloat ? 3.2 : 4.2), 0, 1));
      if (Math.abs(bottleFloat - floatTarget) < 0.05) bottleFloat = floatTarget;

      Audio_.updatePour(flow01);
      if (flow01 > 0.01) Audio_.startPour(); else Audio_.stopPour();

      const pourRate = 0.28;
      let poured = 0;
      if (flow01 > 0.01) { poured = Math.min(liquidFrac, pourRate * flow01 * dt); liquidFrac -= poured; }

      let obstacleX = null;
      if (obstacle) { obstacle.phase += dt * obstacle.def.speed; obstacleX = pourTargetX + Math.sin(obstacle.phase) * W * obstacle.def.amp; }

      cups.forEach((c) => {
        if (!c.active) return;
        c.phase += dt * (c.def.moveSpeed || 0);
        c.x = W * c.def.baseX + Math.sin(c.phase) * W * (c.def.moveAmp || 0);
      });

      if (poured > 0) {
        const targets = cups.filter((c) => c.active && !c.settled && Math.abs(c.x - pourTargetX) < catchZoneHalf);
        const obstacleBlocking = obstacle && Math.abs(obstacleX - pourTargetX) < catchZoneHalf * 0.8;
        if (obstacleBlocking) {
          spawnSplash(pourTargetX, floorY - 40, currentLiquidColor(), Math.ceil(poured * 40), 90);
        } else if (targets.length) {
          const c = targets[0];
          const capVol = c.def.capacity;
          c.fill = Math.min(1.3, c.fill + poured / capVol);
          if (c.fill > 1.0) {
            const overflowAmt = Math.min(c.fill - 1.0, poured / capVol);
            spawnSplash(c.x, floorY - c.cupH - 4, currentLiquidColor(), Math.ceil(overflowAmt * 60) + 1, 110);
          }
          if (Math.random() < poured * 22) spawnRipple(c.x, cupSurfaceY(c), currentLiquidColor());
        } else {
          spawnSplash(pourTargetX, floorY - 6, currentLiquidColor(), Math.ceil(poured * 35), 100);
        }
      }

      if (flow01 > 0.05 && Math.random() < flow01 * 0.9) streamDroplets.push({ t: 0, seed: Math.random() });
      streamDroplets.forEach((d) => (d.t += dt * 2.4));
      streamDroplets = streamDroplets.filter((d) => d.t < 1);
      if (streamDroplets.length > 40) streamDroplets = streamDroplets.slice(-40);

      particles.forEach((p) => {
        p.age += dt;
        if (p.ripple) { p.r += dt * 70; return; }
        p.vy += 480 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      });
      particles = particles.filter((p) => p.age < p.life);
      if (particles.length > 220) particles = particles.slice(-220);

      if (timeLeft !== null) {
        timeLeft -= dt;
        if (timeLeft <= 0) { timeLeft = 0; failLevel("Time ran out before the cup was filled."); return; }
      }

      if (def.sequential) {
        const c = cups[sequentialActive];
        if (c && !c.settled && c.fill >= c.def.min) {
          c.settled = true; c.resultStars = starsFor(c);
          sequentialActive++;
          if (sequentialActive < cups.length) cups[sequentialActive].active = true;
        }
      }

      evaluateOutcome(dt);
      updateHUD();
    }

    function evaluateOutcome(dt) {
      const def = LEVELS[levelIndex];
      if (state !== STATE.PLAYING) return;

      if (def.sequential) {
        if (cups.every((c) => c.settled)) {
          successHoldTimer += dt;
          if (successHoldTimer > 0.4) winLevel();
        } else if (liquidFrac <= 0.001 && flow01 < 0.01) {
          const lastActive = cups.find((c) => c.active && !c.settled);
          if (lastActive) failLevel("Ran out of liquid before every cup was filled.");
        }
        return;
      }

      const c = cups[0];
      const good = c.fill >= c.def.min && c.fill <= c.def.max;
      if (good) { successHoldTimer += dt; if (successHoldTimer > 0.55) winLevel(); }
      else successHoldTimer = Math.max(0, successHoldTimer - dt * 2);

      if (!good && liquidFrac <= 0.001 && flow01 < 0.01 && c.fill < c.def.min) {
        c._graceTimer = (c._graceTimer || 0) + dt;
        if (c._graceTimer > 1.1) {
          failLevel(c.fill < 0.02 ? "No liquid reached the cup." : "The bottle ran dry before the cup was full enough.");
        }
      } else c._graceTimer = 0;

      if (c.fill > 1.28) failLevel("Way too much spilled — the cup overflowed badly.");
    }

    /* ================= WIN / FAIL / SCORE ================= */
    function computeScore() {
      const def = LEVELS[levelIndex];
      let base = 0, breakdown = [];
      if (def.sequential) {
        let starsTotal = 0;
        cups.forEach((c) => { starsTotal += c.resultStars; base += c.resultStars * 260; });
        breakdown.push(["Cups filled", cups.length]);
        breakdown.push(["Stars earned", starsTotal + "/9"]);
      } else {
        const c = cups[0];
        const mid = (c.def.min + c.def.max) / 2;
        const band = (c.def.max - c.def.min) / 2;
        const acc = clamp(1 - Math.abs(c.fill - mid) / Math.max(band, 0.01), 0, 1);
        base = Math.round(500 + acc * 600);
        breakdown.push(["Accuracy", Math.round(acc * 100) + "%"]);
      }
      const timeBonus = def.timeLimit && timeLeft !== null ? Math.round(timeLeft * 12) : 0;
      if (timeBonus) breakdown.push(["Time bonus", "+" + timeBonus]);
      breakdown.push(["Combo", "×" + combo]);
      const total = Math.round((base + timeBonus) * combo);
      return { total, breakdown };
    }

    function winLevel() {
      state = STATE.WIN;
      Audio_.stopPour(); Audio_.chime(true);
      if (navigator.vibrate) navigator.vibrate([25, 40, 25]);

      const stars = LEVELS[levelIndex].sequential
        ? Math.round(cups.reduce((s, c) => s + c.resultStars, 0) / cups.length)
        : starsFor(cups[0]);
      combo = stars >= 3 ? Math.min(combo + 1, 8) : stars < 2 ? 1 : combo;

      const { total, breakdown } = computeScore();
      totalScore += total;
      if (totalScore > bestScore) { bestScore = totalScore; if (bestRef.current) bestRef.current.textContent = bestScore.toLocaleString(); }

      setWinData({
        title: stars >= 3 ? "Perfect Pour!" : stars === 2 ? "Nice Fill!" : "Cup Filled",
        stars, breakdown, total,
        nextLabel: levelIndex < LEVELS.length - 1 ? "Next Level" : "See Results",
      });
      setOverlay("win");
    }

    function failLevel(reason) {
      if (state !== STATE.PLAYING) return;
      state = STATE.FAIL;
      Audio_.stopPour(); Audio_.chime(false);
      if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
      combo = 1;
      setFailReason(reason || "Try again!");
      setOverlay("fail");
    }

    /* ================= HUD (imperative, per-frame) ================= */
    function comboLabelFor(n) {
      if (n >= 6) return "LEGENDARY!";
      if (n >= 4) return "AWESOME!";
      if (n >= 2) return "NICE!";
      return "";
    }

    function updateHUD() {
      if (scoreRef.current) scoreRef.current.textContent = totalScore.toLocaleString();
      if (bestRef.current) bestRef.current.textContent = Math.max(bestScore, totalScore).toLocaleString();
      if (comboRef.current) comboRef.current.textContent = "×" + combo;
      if (comboLabelRef.current) comboLabelRef.current.textContent = comboLabelFor(combo);
      if (comboCardRef.current) comboCardRef.current.style.opacity = combo > 1 ? 1 : 0.55;
      const def = LEVELS[levelIndex];
      let fillDisplay, targetCup;
      if (def.sequential) {
        const active = cups.find((c) => c.active && !c.settled) || cups[cups.length - 1];
        fillDisplay = active ? fmtPct(clamp(active.fill, 0, 1)) : "100%";
        targetCup = active;
      } else {
        fillDisplay = fmtPct(clamp(cups[0] ? cups[0].fill : 0, 0, 1));
        targetCup = cups[0];
      }
      if (fillRef.current) fillRef.current.textContent = fillDisplay;
      if (fillBarRef.current) {
        const frac = targetCup ? clamp(targetCup.fill, 0, 1) : 0;
        fillBarRef.current.style.width = (frac * 100) + "%";
      }
      if (targetRef.current && targetCup) targetRef.current.textContent = "TARGET: " + Math.round(targetCup.def.max * 100) + "%";

      if (timeLeft !== null && timerFillRef.current && timerNumRef.current) {
        const pct = clamp(timeLeft / def.timeLimit, 0, 1);
        timerFillRef.current.style.width = pct * 100 + "%";
        timerNumRef.current.textContent = Math.ceil(timeLeft);
      }
      const tiltPct = clamp(angleDeg / TILT_MAX, 0, 1) * 100;
      if (tiltFillRef.current) tiltFillRef.current.style.height = tiltPct + "%";
      if (tiltDotRef.current) tiltDotRef.current.style.bottom = tiltPct + "%";
      if (tiltThreshRef.current) tiltThreshRef.current.style.bottom = clamp(TILT_THRESHOLD / TILT_MAX, 0, 1) * 170 + "px";
    }

    /* ================= RENDERING ================= */
    function drawBackground() {
      const g = ctx.createLinearGradient(0, 0, 0, floorY);
      g.addColorStop(0, "#2B0F52"); g.addColorStop(0.55, "#4A1B6D"); g.addColorStop(1, "#5C2680");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, floorY);

      const rg = ctx.createRadialGradient(bottlePivot.x, bottlePivot.y - 20, 10, bottlePivot.x, bottlePivot.y - 20, W * 0.6);
      rg.addColorStop(0, "rgba(255,255,255,0.08)"); rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, floorY);

      // room floor beneath/around the table's legs
      ctx.fillStyle = "#210B3D";
      ctx.fillRect(0, floorY, W, H - floorY);
      ctx.fillStyle = "rgba(216,180,255,0.06)";
      ctx.fillRect(0, floorY, W, 2);

      // ---- the table itself: a slab with real thickness, standing on legs ----
      const tableThickness = clamp(H * 0.028, 12, 20);
      const tableTop = floorY;
      const tableBottom = tableTop + tableThickness;
      const legTop = tableBottom;
      const legBottom = H;
      const legW = clamp(W * 0.045, 12, 20);
      const legInset = clamp(W * 0.05, 16, 34);

      // soft shadow the table casts on the floor behind/around its legs
      ctx.save();
      ctx.globalAlpha = 0.3; ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(W * 0.5, legBottom - 4, W * 0.46, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // legs (front pair; back pair implied hidden behind the slab)
      const legGrad = ctx.createLinearGradient(0, legTop, 0, legBottom);
      legGrad.addColorStop(0, "#5E3C1E"); legGrad.addColorStop(1, "#38230F");
      ctx.fillStyle = legGrad;
      ctx.fillRect(legInset, legTop, legW, legBottom - legTop);
      ctx.fillRect(W - legInset - legW, legTop, legW, legBottom - legTop);
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(legInset, legTop, legW * 0.4, legBottom - legTop);
      ctx.fillRect(W - legInset - legW, legTop, legW * 0.4, legBottom - legTop);

      // tabletop slab
      const slabGrad = ctx.createLinearGradient(0, tableTop, 0, tableBottom);
      slabGrad.addColorStop(0, "#A9773F");
      slabGrad.addColorStop(0.45, "#8A5A2E");
      slabGrad.addColorStop(1, "#5A3A1C");
      ctx.fillStyle = slabGrad;
      ctx.fillRect(0, tableTop, W, tableThickness);

      // top-front highlight edge of the slab
      ctx.fillStyle = "rgba(255,225,180,0.30)";
      ctx.fillRect(0, tableTop, W, 2);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, tableBottom - 2, W, 2);

      // wood-grain streaks along the slab face
      ctx.save();
      ctx.globalAlpha = 0.14; ctx.strokeStyle = "#2A1808"; ctx.lineWidth = 1;
      const grainRows = 3;
      for (let i = 0; i < grainRows; i++) {
        const gy = tableTop + 3 + i * ((tableThickness - 6) / Math.max(grainRows - 1, 1));
        ctx.beginPath();
        ctx.moveTo(0, gy + Math.sin(i * 1.7) * 1.2);
        ctx.bezierCurveTo(W * 0.3, gy + Math.sin(i * 1.7 + 1) * 1.6, W * 0.7, gy + Math.sin(i * 1.7 + 2) * 1.6, W, gy + Math.sin(i * 1.7 + 3) * 1.2);
        ctx.stroke();
      }
      ctx.restore();

      // gentle glow marking where the glass should sit
      ctx.save();
      ctx.globalAlpha = 0.16; ctx.fillStyle = "#FFEFC0";
      ctx.beginPath();
      ctx.ellipse(pourTargetX, floorY - 2, catchZoneHalf * 1.05, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Geometry shared by the bottle silhouette and the spout position, so
    // the pour always originates exactly at the drawn mouth of the bottle.
    function bottleGeometry(scale, bottleScale) {
      const s = scale * (bottleScale || 1);
      const bodyW = 90 * s, bodyH = 140 * s;
      const shoulderH = 34 * s, neckW = 26 * s, neckLen = 46 * s;
      const bodyBottom = 0;
      const bodyTop = -bodyH;
      const shoulderTop = bodyTop - shoulderH;
      const neckTop = shoulderTop - neckLen;
      const r = 15 * s;
      return { s, bodyW, bodyH, shoulderH, neckW, neckLen, bodyBottom, bodyTop, shoulderTop, neckTop, r };
    }

    function bottleWorldSpout(angleRad, scale, bottleScale) {
      const g = bottleGeometry(scale, bottleScale);
      const cos = Math.cos(angleRad), sin = Math.sin(angleRad);
      const y0 = g.neckTop; // local x is 0 (spout sits on the bottle's centerline)
      const baseY = bottlePivot.y - bottleFloat;
      return { x: bottlePivot.x - y0 * sin, y: baseY + y0 * cos };
    }

    // Traces the entire bottle as ONE continuous outline (body -> shoulder
    // curve -> neck -> open mouth -> neck -> shoulder curve -> body), so a
    // single clip()/fill() call handles the whole silhouette correctly
    // instead of stacking separate clip regions (which would intersect,
    // not union, and clip almost everything away).
    function bottleOutlinePath(g) {
      const { bodyW, neckW, bodyBottom, bodyTop, shoulderTop, neckTop, r } = g;
      ctx.beginPath();
      ctx.moveTo(-bodyW / 2 + r, bodyBottom);
      ctx.lineTo(bodyW / 2 - r, bodyBottom);
      ctx.quadraticCurveTo(bodyW / 2, bodyBottom, bodyW / 2, bodyBottom - r);
      ctx.lineTo(bodyW / 2, bodyTop);
      ctx.quadraticCurveTo(bodyW / 2, shoulderTop, neckW / 2, shoulderTop);
      ctx.lineTo(neckW / 2, neckTop);
      ctx.lineTo(-neckW / 2, neckTop);
      ctx.lineTo(-neckW / 2, shoulderTop);
      ctx.quadraticCurveTo(-bodyW / 2, shoulderTop, -bodyW / 2, bodyTop);
      ctx.lineTo(-bodyW / 2, bodyBottom - r);
      ctx.quadraticCurveTo(-bodyW / 2, bodyBottom, -bodyW / 2 + r, bodyBottom);
      ctx.closePath();
    }

    function drawBottle() {
      const def = LEVELS[levelIndex];
      const scale = bottleDims.baseScale;
      // Negated so the neck swings toward the glass on the left as the
      // player tilts forward, instead of away from it.
      const angleRad = -(angleDeg * Math.PI) / 180;
      const g = bottleGeometry(scale, def.bottleScale);
      const { bodyW, neckW, bodyBottom, bodyTop, shoulderTop, neckTop } = g;
      const s = g.s;

      // ground shadow — stays on the table and shrinks/softens as the bottle floats up
      const floatT = clamp(bottleFloat / Math.max(170 * scale, 1), 0, 1);
      ctx.save();
      ctx.globalAlpha = lerp(0.25, 0.08, floatT);
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(bottlePivot.x, bottlePivot.y + 4, bodyW * lerp(0.55, 0.72, floatT), lerp(10, 4, floatT), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(bottlePivot.x, bottlePivot.y - bottleFloat);
      ctx.rotate(angleRad);

      // ---- liquid, clipped to the whole silhouette so it naturally rises
      // into the neck as the bottle fills, no special-casing needed ----
      ctx.save();
      bottleOutlinePath(g);
      ctx.clip();

      const worldFillHeight = liquidFrac * (g.bodyH + g.shoulderH + g.neckLen);
      const restY = bodyBottom - worldFillHeight / Math.max(Math.cos(angleRad), 0.35);
      const tilt = Math.tan(clamp(angleRad, -1.3, 1.3));
      const steps = 14;
      ctx.beginPath();
      ctx.moveTo(-bodyW / 2, bodyBottom + 2);
      for (let i = 0; i <= steps; i++) {
        const x = -bodyW / 2 + bodyW * (i / steps);
        let y = restY + x * tilt * 0.72;
        y = clamp(y, neckTop - 4, bodyBottom + 2);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(bodyW / 2, bodyBottom + 2);
      ctx.closePath();
      const lg = ctx.createLinearGradient(0, neckTop, 0, bodyBottom);
      lg.addColorStop(0, def.liquidB);
      lg.addColorStop(1, def.liquidA);
      ctx.fillStyle = lg;
      ctx.fill();

      // surface highlight line
      ctx.save();
      ctx.globalAlpha = 0.32; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.8 * s;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const x = -bodyW / 2 + bodyW * (i / steps);
        let y = restY + x * tilt * 0.72;
        y = clamp(y, neckTop - 4, bodyBottom + 2);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // gentle rising bubbles inside the liquid
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 4; i++) {
        const bx = -bodyW * 0.22 + (i % 2) * bodyW * 0.4 + Math.sin(levelTime * 0.6 + i) * bodyW * 0.06;
        const cycle = (levelTime * 0.12 + i * 0.29) % 1;
        const by = lerp(bodyBottom - 6, bodyTop + 6, cycle);
        if (by > restY - 2) {
          ctx.beginPath();
          ctx.ellipse(bx, by, 1.6 * s, 1.6 * s, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      ctx.restore(); // end liquid clip

      // ---- glass (single fill + stroke over the same unified outline) ----
      bottleOutlinePath(g);
      const glassGrad = ctx.createLinearGradient(-bodyW / 2, 0, bodyW / 2, 0);
      glassGrad.addColorStop(0, "rgba(255,255,255,0.22)");
      glassGrad.addColorStop(0.22, "rgba(255,255,255,0.02)");
      glassGrad.addColorStop(0.55, "rgba(255,255,255,0.12)");
      glassGrad.addColorStop(1, "rgba(255,255,255,0.02)");
      ctx.fillStyle = glassGrad; ctx.fill();
      ctx.lineWidth = 2 * s; ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.stroke();

      // collar ring where the shoulder meets the neck
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.ellipse(0, shoulderTop, neckW / 2 + 1.5 * s, 2 * s, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // open mouth rim
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, neckTop, neckW / 2, 3 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 1.6 * s;
      ctx.stroke();
      ctx.restore();

      // primary gloss streak down the body
      ctx.save();
      ctx.globalAlpha = 0.45; ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.ellipse(-bodyW * 0.24, bodyTop + (bodyBottom - bodyTop) * 0.4, bodyW * 0.08, (bodyBottom - bodyTop) * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.restore();
    }

    function streamShape(spout, landX, landY) {
      const dx = landX - spout.x;
      const dy = Math.max(landY - spout.y, 14);
      const G = 1500;
      const T = clamp(Math.sqrt((2 * dy) / G), 0.14, 0.5);
      const vx = dx / T;
      const vy0 = (dy - 0.5 * G * T * T) / T;
      return { dx, dy, G, T, vx, vy0 };
    }
    function streamPointAt(spout, shape, tf) {
      const { G, T, vx, vy0 } = shape;
      const t = clamp(tf, 0, 1) * T;
      const x = spout.x + vx * t;
      const y = spout.y + vy0 * t + 0.5 * G * t * t;
      const svx = vx, svy = vy0 + G * t;
      return { x, y, speed: Math.hypot(svx, svy), vx: svx, vy: svy };
    }

    // Renders the stream as a chain of round-capped, progressively thinner
    // strokes along a real gravity arc. This is deliberately simple: a
    // filled offset-polygon ribbon is easy to get subtly wrong (normals can
    // cross when the taper is aggressive, producing a twisted/pinched
    // shape), whereas a tapered stroked polyline can't self-intersect and
    // always reads as a clean, continuous pour.
    function drawStream() {
      if (flow01 < 0.03) return;
      const def = LEVELS[levelIndex];
      const scale = bottleDims.baseScale * (def.bottleScale || 1);
      const angleRad = -(angleDeg * Math.PI) / 180;
      const spout = bottleWorldSpout(angleRad, scale);

      let landX = pourTargetX, landY = floorY - 2;
      const activeCup = cups.find((c) => c.active && !c.settled && Math.abs(c.x - pourTargetX) < catchZoneHalf);
      if (activeCup) { landX = activeCup.x; landY = cupSurfaceY(activeCup); }
      else if (obstacle) {
        const ox = pourTargetX + Math.sin(obstacle.phase) * W * obstacle.def.amp;
        if (Math.abs(ox - pourTargetX) < catchZoneHalf * 0.8) { landX = ox; landY = floorY - 40; }
      }

      const shape = streamShape(spout, landX, landY);
      const steps = 16;
      const pts = [];
      for (let i = 0; i <= steps; i++) pts.push(streamPointAt(spout, shape, i / steps));

      // A gentle, natural S-wave applied only to the drawn path (not the
      // physics used for droplets), tapered to zero at both ends so it
      // always connects cleanly to the spout and the landing point.
      function waveDisplace(p, frac) {
        const len = Math.max(Math.hypot(p.vx, p.vy), 1);
        const nx = -p.vy / len, ny = p.vx / len;
        const amp = clamp(5 * scale * (1 - flow01 * 0.35), 1.5, 6.5);
        const edge = Math.sin(clamp(frac, 0, 1) * Math.PI);
        const disp = amp * edge * Math.sin(frac * 9 - levelTime * 7);
        return { x: p.x + nx * disp, y: p.y + ny * disp };
      }
      const vpts = pts.map((p, i) => waveDisplace(p, i / steps));

      const width0 = clamp(3.6 + flow01 * 6, 3.6, 9.5) * scale;
      const speed0 = Math.max(pts[0].speed, 40);

      const widths = pts.map((p, i) => {
        const frac = i / steps;
        let taper = clamp(Math.sqrt(speed0 / Math.max(p.speed, speed0 * 0.25)), 0.45, 1.08);
        if (frac > 0.78) taper *= lerp(1, 0.5, (frac - 0.78) / 0.22);
        return Math.max(width0 * taper, 1.5 * scale);
      });

      const grad = ctx.createLinearGradient(spout.x, spout.y, landX, landY);
      grad.addColorStop(0, def.liquidB);
      grad.addColorStop(1, def.liquidA);

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = grad;
      for (let i = 0; i < steps; i++) {
        ctx.lineWidth = (widths[i] + widths[i + 1]) / 2;
        ctx.beginPath();
        ctx.moveTo(vpts[i].x, vpts[i].y);
        ctx.lineTo(vpts[i + 1].x, vpts[i + 1].y);
        ctx.stroke();
      }

      // bright core streak down the middle for a wet, glassy look
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = "#ffffff";
      const coreSteps = Math.floor(steps * 0.82);
      for (let i = 0; i < coreSteps; i++) {
        ctx.lineWidth = Math.max(1, ((widths[i] + widths[i + 1]) / 2) * 0.26);
        ctx.beginPath();
        ctx.moveTo(vpts[i].x, vpts[i].y);
        ctx.lineTo(vpts[i + 1].x, vpts[i + 1].y);
        ctx.stroke();
      }

      // tiny air-bubble flecks riding inside the stream for texture
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#ffffff";
      for (let i = 2; i < steps - 2; i += 3) {
        const jitter = Math.sin(i * 3.1 + levelTime * 5) * 0.5 + 0.5;
        if (jitter < 0.55) continue;
        ctx.beginPath();
        ctx.ellipse(vpts[i].x, vpts[i].y, Math.max(0.8, widths[i] * 0.1), Math.max(0.8, widths[i] * 0.1), 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // an occasional droplet sheds off the thinning tail
      if (Math.random() < flow01 * 0.35) {
        const p = pts[pts.length - 1];
        particles.push({
          x: p.x, y: p.y,
          vx: p.vx * 0.15 + rand(-10, 10),
          vy: p.vy * 0.35,
          life: rand(0.18, 0.3), age: 0, r: rand(1.3, 2.2) * scale, color: def.liquidA,
        });
      }

      streamDroplets.forEach((d) => {
        const p = waveDisplace(streamPointAt(spout, shape, d.t), d.t);
        ctx.save();
        ctx.globalAlpha = 0.8 * (1 - d.t * 0.3);
        ctx.fillStyle = def.liquidA;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 2.2 * scale, 3 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (Math.random() < flow01 * 0.55) {
        spawnSplash(landX, landY, def.liquidA, 2, 70);
        if (Math.random() < 0.3) spawnRipple(landX, landY, def.liquidA);
        if (Math.random() < 0.15) Audio_.splash(flow01);
      }

      // small meniscus bulge at the spout where liquid gathers before it falls
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = def.liquidA;
      ctx.beginPath();
      ctx.ellipse(spout.x, spout.y + 1, width0 * 0.6, width0 * 0.32, angleRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawCup(c) {
      const def = LEVELS[levelIndex];
      const w = c.def.w;
      const h = (c.cupH = clamp(w * 0.95, 60, 130));
      const x = c.x !== undefined ? c.x : W * c.def.baseX + Math.sin(c.phase) * W * (c.def.moveAmp || 0);
      c.x = x;
      const rim = floorY - h, topW = w, botW = w * 0.78;

      ctx.save();
      ctx.globalAlpha = 0.28; ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.ellipse(x, floorY + 3, w * 0.42, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x - topW / 2, rim); ctx.lineTo(x + topW / 2, rim);
      ctx.lineTo(x + botW / 2, floorY); ctx.lineTo(x - botW / 2, floorY); ctx.closePath();
      ctx.clip();

      const fillClamped = clamp(c.fill, 0, 1.32);
      const liqTop = floorY - Math.min(fillClamped, 1.28) * h;
      const wob = Math.sin(levelTime * 4 + c.phase) * 2;
      ctx.beginPath();
      ctx.moveTo(x - topW / 2, liqTop + wob);
      ctx.quadraticCurveTo(x, liqTop + wob - 3, x + topW / 2, liqTop + wob);
      ctx.lineTo(x + botW / 2, floorY + 4); ctx.lineTo(x - botW / 2, floorY + 4); ctx.closePath();
      const lg = ctx.createLinearGradient(0, rim, 0, floorY);
      lg.addColorStop(0, def.liquidA); lg.addColorStop(1, def.liquidB);
      ctx.fillStyle = lg; ctx.globalAlpha = 0.92; ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.55;
      [c.def.min, c.def.max].forEach((frac, i) => {
        const gy = floorY - frac * h, gw = lerp(botW, topW, frac);
        ctx.strokeStyle = i === 0 ? "rgba(198,255,61,0.85)" : "rgba(255,92,92,0.85)";
        ctx.setLineDash([4, 3]); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x - gw / 2, gy); ctx.lineTo(x + gw / 2, gy); ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(x - topW / 2, rim); ctx.lineTo(x + topW / 2, rim);
      ctx.lineTo(x + botW / 2, floorY); ctx.lineTo(x - botW / 2, floorY); ctx.closePath();
      const cg = ctx.createLinearGradient(x - topW / 2, 0, x + topW / 2, 0);
      cg.addColorStop(0, "rgba(255,255,255,0.22)"); cg.addColorStop(0.5, "rgba(255,255,255,0.04)"); cg.addColorStop(1, "rgba(255,255,255,0.20)");
      ctx.fillStyle = cg; ctx.fill();
      ctx.lineWidth = 2.2; ctx.strokeStyle = c.active && !c.settled ? "rgba(159,239,242,0.85)" : "rgba(159,239,242,0.35)"; ctx.stroke();

      ctx.beginPath(); ctx.ellipse(x, rim, topW / 2, 5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1.6; ctx.stroke();

      if (c.settled) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = c.resultStars >= 2 ? "#4CFFB0" : "#FFC93D";
        ctx.font = "700 13px Nunito, sans-serif"; ctx.textAlign = "center";
        ctx.fillText(c.resultStars + "★", x, rim - 8);
        ctx.restore();
      }
      ctx.restore();
    }

    function drawObstacle() {
      if (!obstacle) return;
      const ox = pourTargetX + Math.sin(obstacle.phase) * W * obstacle.def.amp;
      const oy = floorY - 66;
      ctx.save();
      ctx.fillStyle = "rgba(255,92,92,0.85)"; ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 2;
      const w = obstacle.def.w;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(ox - w / 2, oy - 34, w, 68, 8);
      else ctx.rect(ox - w / 2, oy - 34, w, 68);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "700 18px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("✕", ox, oy + 6);
      ctx.restore();
    }

    function drawParticles() {
      particles.forEach((p) => {
        if (p.ripple) {
          ctx.save();
          ctx.globalAlpha = clamp(1 - p.age / p.life, 0, 1) * 0.5;
          ctx.strokeStyle = p.color; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.32, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
          return;
        }
        ctx.save();
        ctx.globalAlpha = clamp(1 - p.age / p.life, 0, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
    }

    function render() {
      drawBackground();
      drawObstacle();
      cups.forEach((c) => drawCup(c));
      drawBottle();
      drawStream();
      drawParticles();
    }

    function frame(ts) {
      if (destroyed) return;
      if (!lastTs) lastTs = ts;
      let dt = (ts - lastTs) / 1000;
      lastTs = ts;
      dt = Math.min(dt, 0.04);
      if (state === STATE.PLAYING) update(dt);
      render();
      rafId = requestAnimationFrame(frame);
    }

    /* ================= WIRE UP apiRef FOR JSX BUTTONS ================= */
    apiRef.current.start = () => { Audio_.click(); requestMotionPermission(); };
    apiRef.current.pause = () => {
      if (state !== STATE.PLAYING) return;
      Audio_.click(); Audio_.stopPour();
      state = STATE.PAUSED; setOverlay("pause");
    };
    apiRef.current.resume = () => { Audio_.click(); state = STATE.PLAYING; setOverlay(null); };
    apiRef.current.recalibrate = () => { Audio_.click(); calibrateNow(); rawAngleTarget = 0; angleDeg = 0; };
    apiRef.current.restart = () => { Audio_.click(); setupLevel(levelIndex); state = STATE.PLAYING; setOverlay(null); };
    apiRef.current.next = () => {
      Audio_.click();
      if (levelIndex < LEVELS.length - 1) {
        levelIndex++; setupLevel(levelIndex); state = STATE.PLAYING; setOverlay(null);
      } else {
        setFinalScore(totalScore); setOverlay("alldone"); state = STATE.ALLDONE;
        const finalTotal = totalScore;
        if (finalTotal > 0 && gameData?.id) {
          try {
            let devId = null;
            try { devId = localStorage.getItem('device_id') || null } catch {}
            fetch('/api/play/record-score', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ game_id: gameData.id, score: finalTotal, device_id: devId || undefined })
            }).then(r => r.json()).then(d => { if (d && d.success && d.high_score) { bestScore = Math.max(bestScore, d.high_score); if (bestRef.current) bestRef.current.textContent = bestScore.toLocaleString(); } }).catch(() => {})
          } catch {}
        }
      }
    };
    apiRef.current.replay = () => { Audio_.click(); setupLevel(levelIndex); state = STATE.PLAYING; setOverlay(null); };
    apiRef.current.retry = () => { Audio_.click(); setupLevel(levelIndex); state = STATE.PLAYING; setOverlay(null); };
    apiRef.current.quitToStart = () => {
      Audio_.click(); levelIndex = 0; totalScore = 0; combo = 1;
      setupLevel(levelIndex); state = STATE.PLAYING; setOverlay(null);
    };
    apiRef.current.playAgain = () => {
      Audio_.click(); levelIndex = 0; totalScore = 0; combo = 1;
      setupLevel(levelIndex); state = STATE.PLAYING; setOverlay(null);
    };
    apiRef.current.setMuted = (m) => { Audio_.setMuted(m); };
    apiRef.current.setMasterVolume = (v) => Audio_.setMasterVolume(v);
    apiRef.current.setMusicVolume = (v) => Audio_.setMusicVolume(v);

    /* ================= INIT ================= */
    resize();
    setupLevel(levelIndex);
    rafId = requestAnimationFrame(frame);

    return () => {
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (sensorHintTimer) clearTimeout(sensorHintTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      window.removeEventListener("deviceorientation", orientationListener, true);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("touchmove", preventScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", autoPause);
      if (ro) ro.disconnect();
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      Audio_.teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    apiRef.current.setMuted(next);
    if (iconSoundRef.current) iconSoundRef.current.style.opacity = next ? 0.35 : 1;
  }

  return (
    <div className="tp-root">
      <style>{`
        .tp-root{
          --bg-deep:#2B0F52; --bg-mid:#4A1B6D; --bg-hi:#5C2680;
          --liquid-1:#FF8A3D; --liquid-2:#FFC93D; --accent-lime:#8CFF3D;
          --glass-rim:#D8B4FF; --panel-bg:rgba(30,10,55,0.72); --panel-bg-2:rgba(28,10,52,0.94);
          --panel-border:rgba(216,180,255,0.20);
          --text-main:#F8F3FF; --text-dim:#C9AEE8; --danger:#FF5C5C; --success:#4CFFB0; --gold:#FFC93D;
          --font-display:'Baloo 2', ui-rounded, 'SF Pro Rounded', system-ui, sans-serif;
          --font-body:'Nunito', ui-rounded, system-ui, sans-serif;
          position:relative; width:100%; height:100vh; height:100dvh; overflow:hidden;
          background: radial-gradient(ellipse at 50% 0%, #4A1B6D 0%, #2B0F52 55%, #1C0A3A 100%);
          font-family:var(--font-body); color:var(--text-main);
          touch-action:none; user-select:none; -webkit-user-select:none;
        }
        .tp-root *{ box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        .tp-bgstars{ position:absolute; inset:0; pointer-events:none; opacity:.5; background-image:
            radial-gradient(2px 2px at 12% 18%, rgba(255,255,255,.35), transparent),
            radial-gradient(2px 2px at 82% 14%, rgba(255,255,255,.28), transparent),
            radial-gradient(1.5px 1.5px at 92% 40%, rgba(255,255,255,.3), transparent),
            radial-gradient(1.5px 1.5px at 6% 55%, rgba(255,255,255,.22), transparent),
            radial-gradient(2px 2px at 70% 8%, rgba(255,255,255,.25), transparent); }
        .tp-canvas{ position:absolute; inset:0; width:100%; height:100%; display:block; }
        .tp-ui{ position:absolute; inset:0; width:100%; height:100%; pointer-events:none; display:flex; flex-direction:column; }
        .tp-clickable{ pointer-events:auto; }
        .tp-hud{ display:flex; align-items:flex-start; justify-content:space-between; padding:calc(10px + env(safe-area-inset-top)) 14px 0 14px; gap:8px; }
        .tp-icon-btn{ width:44px; height:44px; border-radius:14px; background:linear-gradient(180deg,#8A4BE6,#6A2FC9); border:1px solid rgba(216,180,255,0.35); display:flex; align-items:center; justify-content:center; color:#fff; cursor:pointer; box-shadow:0 4px 0 #4A1B8A, 0 6px 14px rgba(0,0,0,.35); }
        .tp-icon-btn:active{ transform:translateY(3px); box-shadow:0 1px 0 #4A1B8A; }
        .tp-hud-center{ flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; padding-top:2px; min-width:0; }
        .tp-level-title{ font-family:var(--font-display); font-weight:800; font-size:17px; letter-spacing:.02em; color:var(--text-main); text-shadow:0 2px 6px rgba(0,0,0,.4); white-space:nowrap; text-transform:uppercase; }
        .tp-level-sub{ font-family:var(--font-display); font-weight:700; font-size:12px; letter-spacing:.06em; color:var(--gold); text-transform:uppercase; }
        .tp-timer-wrap{ display:flex; align-items:center; gap:6px; margin-top:4px; }
        .tp-timer-bar{ width:130px; height:7px; border-radius:5px; background:rgba(255,255,255,0.15); overflow:hidden; }
        .tp-timer-fill{ height:100%; width:100%; background:linear-gradient(90deg,var(--accent-lime),var(--liquid-2)); border-radius:5px; transition:width .15s linear; }
        .tp-timer-num{ font-size:11px; color:var(--text-dim); font-weight:700; min-width:26px; text-align:right; }

        .tp-fill-panel{ position:absolute; left:50%; top:calc(96px + env(safe-area-inset-top)); transform:translateX(-50%); background:var(--panel-bg); backdrop-filter:blur(8px); border:1px solid var(--panel-border); border-radius:20px; padding:12px 26px 14px; text-align:center; min-width:190px; box-shadow:0 6px 16px rgba(0,0,0,.28); }
        .tp-fill-label{ font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); font-weight:800; }
        .tp-fill-value{ font-family:var(--font-display); font-size:34px; font-weight:800; color:var(--text-main); line-height:1.1; margin:1px 0 8px; }
        .tp-fill-bar{ width:100%; height:9px; border-radius:6px; background:rgba(255,255,255,0.12); overflow:hidden; }
        .tp-fill-bar-inner{ height:100%; border-radius:6px; background:linear-gradient(90deg,#8CFF3D,#4CD964); transition:width .12s linear; }
        .tp-fill-target{ margin-top:7px; font-size:11px; font-weight:800; letter-spacing:.04em; color:var(--text-dim); }

        .tp-tilt-gauge{ position:absolute; right:14px; top:50%; transform:translateY(-50%); width:60px; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; }
        .tp-tilt-track{ position:relative; width:14px; height:170px; border-radius:8px; background:var(--panel-bg); border:1px solid var(--panel-border); overflow:hidden; box-shadow:inset 0 2px 6px rgba(0,0,0,.35); }
        .tp-tilt-ticks{ position:absolute; inset:0; display:flex; flex-direction:column; justify-content:space-between; padding:8px 0; }
        .tp-tilt-ticks span{ display:block; width:6px; height:2px; margin:0 auto; background:rgba(216,180,255,0.35); border-radius:2px; }
        .tp-tilt-thresh{ position:absolute; left:-4px; width:22px; height:3px; background:var(--accent-lime); opacity:.95; border-radius:2px; box-shadow:0 0 6px var(--accent-lime); }
        .tp-tilt-fill{ position:absolute; left:2px; bottom:2px; width:10px; border-radius:6px; background:linear-gradient(180deg, var(--liquid-2), var(--liquid-1)); height:0%; }
        .tp-tilt-dot{ position:absolute; left:50%; bottom:0%; width:16px; height:16px; margin-left:-8px; margin-bottom:-8px; border-radius:50%; background:#fff; box-shadow:0 0 10px 3px rgba(140,255,61,0.7); border:2px solid var(--accent-lime); }
        .tp-tilt-label{ margin-top:8px; font-size:10px; color:var(--text-dim); font-weight:800; letter-spacing:.08em; }

        .tp-spacer{ flex:1; }
        .tp-bottombar{ display:flex; justify-content:center; padding:0 18px calc(18px + env(safe-area-inset-bottom)); }
        .tp-reset-btn{ pointer-events:auto; display:flex; align-items:center; gap:8px; font-family:var(--font-display); font-weight:800; font-size:15px; letter-spacing:.03em; color:#3A1400; background:linear-gradient(180deg,#FFC93D,#FF8A3D); border:none; border-radius:16px; padding:12px 26px; cursor:pointer; box-shadow:0 5px 0 #C9600F, 0 8px 16px rgba(0,0,0,.3); text-transform:uppercase; }
        .tp-reset-btn:active{ transform:translateY(4px); box-shadow:0 1px 0 #C9600F; }

        .tp-overlay{ position:absolute; inset:0; pointer-events:auto; display:flex; align-items:center; justify-content:center; background:radial-gradient(ellipse at 50% 40%, rgba(74,27,109,.6), rgba(20,7,38,.9)); backdrop-filter:blur(3px); z-index:40; padding:20px; }
        .tp-card{ background:var(--panel-bg-2); border:1px solid var(--panel-border); border-radius:24px; padding:26px 24px 22px; max-width:380px; width:100%; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,.5); }
        .tp-card h1{ font-family:var(--font-display); font-size:26px; margin:2px 0 6px; font-weight:800; }
        .tp-card h2{ font-family:var(--font-display); font-size:20px; margin:2px 0 10px; font-weight:700; color:var(--text-main); }
        .tp-card p{ font-size:14px; line-height:1.5; color:var(--text-dim); margin:0 0 16px; }
        .tp-btn{ font-family:var(--font-display); display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:14px 18px; margin-top:8px; border-radius:16px; border:none; cursor:pointer; font-size:16px; font-weight:800; text-transform:uppercase; letter-spacing:.02em; background:linear-gradient(180deg, var(--liquid-2), var(--liquid-1)); color:#2A1300; box-shadow:0 6px 0 #B85A18, 0 10px 20px rgba(255,138,61,.25); }
        .tp-btn:active{ transform:translateY(4px); box-shadow:0 2px 0 #B85A18; }
        .tp-btn.secondary{ background:linear-gradient(180deg,#8A4BE6,#6A2FC9); color:#fff; box-shadow:0 6px 0 #4A1B8A; border:1px solid var(--panel-border); }
        .tp-btn.secondary:active{ box-shadow:0 2px 0 #4A1B8A; }
        .tp-btn.ghost{ background:transparent; box-shadow:none; color:var(--text-dim); border:1px solid var(--panel-border); font-size:14px; padding:10px 16px; text-transform:none; }
        .tp-phone-demo{ width:74px; height:120px; margin:6px auto 14px; position:relative; }
        .tp-phone-demo svg{ width:100%; height:100%; animation:tpTiltDemo 1.8s ease-in-out infinite; transform-origin:50% 88%; }
        @keyframes tpTiltDemo{ 0%,100%{ transform:rotate(0deg); } 50%{ transform:rotate(32deg); } }
        .tp-stars{ display:flex; justify-content:center; gap:8px; margin:6px 0 14px; }
        .tp-stars svg{ width:38px; height:38px; opacity:.25; transform:scale(.7); transition:opacity .3s ease, transform .3s ease; }
        .tp-stars svg.on{ opacity:1; transform:scale(1); filter:drop-shadow(0 2px 6px rgba(255,201,61,.5)); }
        .tp-score-rows{ text-align:left; font-size:13px; color:var(--text-dim); margin:0 0 12px; display:flex; flex-direction:column; gap:5px; }
        .tp-score-rows div{ display:flex; justify-content:space-between; }
        .tp-score-rows b{ color:var(--text-main); font-weight:800; }
        .tp-score-total{ font-family:var(--font-display); font-size:28px; font-weight:800; color:var(--accent-lime); margin:6px 0 4px; }
        .tp-sliderow{ display:flex; align-items:center; gap:10px; margin:10px 0; }
        .tp-sliderow label{ font-size:13px; color:var(--text-dim); width:76px; text-align:left; }
        .tp-sliderow input[type=range]{ flex:1; accent-color:var(--liquid-1); }
        .tp-perm-note{ font-size:11px; color:var(--text-dim); margin-top:10px; opacity:.8; }
        .tp-sensor-toast{
          position:absolute; left:50%; top:96px; transform:translateX(-50%);
          max-width:78%; text-align:center; font-size:12px; font-weight:700;
          color:var(--text-main); background:var(--panel-bg); border:1px solid rgba(255,201,61,0.35);
          padding:9px 14px; border-radius:14px; backdrop-filter:blur(8px);
          pointer-events:none; z-index:30; box-shadow:0 8px 20px rgba(0,0,0,.3);
          animation:tpFadeIn .25s ease;
        }
        @keyframes tpFadeIn{ from{ opacity:0; transform:translateX(-50%) translateY(-6px); } to{ opacity:1; transform:translateX(-50%) translateY(0); } }
        html, body{ overscroll-behavior:none; }
      `}</style>

      <canvas ref={canvasRef} className="tp-canvas" />
      <div className="tp-bgstars" />

      <div className="tp-ui">
        <div className="tp-hud">
          <div className="tp-icon-btn tp-clickable" onClick={() => apiRef.current.pause()} title="Pause" role="button" aria-label="Pause game">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="5" height="16" rx="1.5" fill="currentColor"/><rect x="14" y="4" width="5" height="16" rx="1.5" fill="currentColor"/></svg>
          </div>
          <div className="tp-hud-center">
            <div className="tp-level-title" ref={levelTitleRef}>Level 1</div>
            <div className="tp-level-sub" ref={levelSubRef}>First Pour</div>
            <div className="tp-timer-wrap" ref={timerWrapRef} style={{ display: "none" }}>
              <div className="tp-timer-bar"><div className="tp-timer-fill" ref={timerFillRef} /></div>
              <div className="tp-timer-num" ref={timerNumRef}>15</div>
            </div>
          </div>
          <div className="tp-icon-btn tp-clickable" onClick={toggleMute} title="Mute" role="button" aria-label={muted ? "Unmute" : "Mute"}>
            <svg ref={iconSoundRef} width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
        </div>

        <div className="tp-fill-panel">
          <div className="tp-fill-label">Fill</div>
          <div className="tp-fill-value" ref={fillRef}>0%</div>
          <div className="tp-fill-bar"><div className="tp-fill-bar-inner" ref={fillBarRef} style={{ width: "0%" }} /></div>
          <div className="tp-fill-target" ref={targetRef}>TARGET: 100%</div>
        </div>

        {sensorHint && (
          <div className="tp-sensor-toast">Motion sensor not detected — drag up/down on the screen to tilt the bottle.</div>
        )}

        <div className="tp-tilt-gauge">
          <div className="tp-tilt-track">
            <div className="tp-tilt-ticks">{Array.from({ length: 8 }).map((_, i) => <span key={i} />)}</div>
            <div className="tp-tilt-thresh" ref={tiltThreshRef} />
            <div className="tp-tilt-fill" ref={tiltFillRef} />
            <div className="tp-tilt-dot" ref={tiltDotRef} style={{ bottom: "0%" }} />
          </div>
          <div className="tp-tilt-label">TILT</div>
        </div>

        <div className="tp-spacer" />

        <div className="tp-bottombar">
          <button className="tp-reset-btn" onClick={() => apiRef.current.restart()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 1 1 2.5 5.8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/><path d="M4 12V6M4 12h6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Reset
          </button>
        </div>
      </div>

      {overlay === "start" && (
        <div className="tp-overlay">
          <div className="tp-card">
            <div className="tp-phone-demo">
              <svg viewBox="0 0 74 120"><rect x="4" y="4" width="66" height="112" rx="14" fill="#3A1A66" stroke="#D8B4FF" strokeWidth="2"/><rect x="10" y="14" width="54" height="92" rx="6" fill="#2B0F52"/><circle cx="37" cy="10" r="1.6" fill="#D8B4FF"/></svg>
            </div>
            <h1>Tilt &amp; Pour</h1>
            <p>Tilt your <b>phone</b> forward to tip the bottle and pour. Bring it back upright to stop. Fill each cup to the perfect line — don't spill!</p>
            <button className="tp-btn tp-clickable" onClick={() => apiRef.current.start()}>Start Pouring</button>
            <div className="tp-perm-note">
              iPhone: tap "Allow" when asked about Motion &amp; Orientation. Android: no prompt needed. If tilt doesn't respond, drag up/down on the screen instead.
            </div>
            {motionStatus === "denied" && (
              <div className="tp-perm-note" style={{ color: "var(--danger)" }}>Motion permission was denied — using drag control instead.</div>
            )}
            {motionStatus === "unsupported" && (
              <div className="tp-perm-note" style={{ color: "var(--danger)" }}>No motion sensor detected — using drag control instead.</div>
            )}
          </div>
        </div>
      )}

      {overlay === "pause" && (
        <div className="tp-overlay">
          <div className="tp-card">
            <h2>Paused</h2>
            <div className="tp-sliderow">
              <label>Master</label>
              <input type="range" min="0" max="100" defaultValue={70} onChange={(e) => apiRef.current.setMasterVolume(e.target.value / 100)} />
            </div>
            <div className="tp-sliderow">
              <label>Music</label>
              <input type="range" min="0" max="100" defaultValue={35} onChange={(e) => apiRef.current.setMusicVolume(e.target.value / 100)} />
            </div>
            <button className="tp-btn tp-clickable" onClick={() => apiRef.current.resume()}>Resume</button>
            <button className="tp-btn secondary tp-clickable" onClick={() => apiRef.current.recalibrate()}>Recalibrate Upright</button>
            <button className="tp-btn ghost tp-clickable" style={{ marginTop: 14 }} onClick={() => apiRef.current.restart()}>Restart Level</button>
          </div>
        </div>
      )}

      {overlay === "win" && (
        <div className="tp-overlay">
          <div className="tp-card">
            <h2>{winData.title}</h2>
            <div className="tp-stars">
              {[0, 1, 2].map((i) => (
                <svg key={i} viewBox="0 0 24 24" fill="#FFC93D" className={i < winData.stars ? "on" : ""}>
                  <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 6.9L12 17.1 5.7 20.8l1.7-6.9L2 9.2l7.1-.6z" />
                </svg>
              ))}
            </div>
            <div className="tp-score-rows">
              {winData.breakdown.map((r, i) => (<div key={i}><span>{r[0]}</span><b>{r[1]}</b></div>))}
            </div>
            <div className="tp-score-total">+{winData.total} pts</div>
            <button className="tp-btn tp-clickable" onClick={() => apiRef.current.next()}>{winData.nextLabel}</button>
            <button className="tp-btn secondary tp-clickable" style={{ marginTop: 10 }} onClick={() => apiRef.current.replay()}>Replay Level</button>
          </div>
        </div>
      )}

      {overlay === "fail" && (
        <div className="tp-overlay">
          <div className="tp-card">
            <h2>Spilled It!</h2>
            <p>{failReason}</p>
            <button className="tp-btn tp-clickable" onClick={() => apiRef.current.retry()}>Try Again</button>
            <button className="tp-btn ghost tp-clickable" style={{ marginTop: 12 }} onClick={() => apiRef.current.quitToStart()}>Back to Level 1</button>
          </div>
        </div>
      )}

      {overlay === "alldone" && (
        <div className="tp-overlay">
          <div className="tp-card">
            <h2>You're a Pouring Master!</h2>
            <p>All levels complete.</p>
            <div className="tp-score-total">{finalScore} pts</div>
            <button className="tp-btn tp-clickable" onClick={() => apiRef.current.playAgain()}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}
