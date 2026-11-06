import React, { useState, useRef, useCallback } from "react";

const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };
const ICONS = { rock: "✊", paper: "✋", scissors: "✌️" };
const MOVE_NAME = { rock: "Rock", paper: "Paper", scissors: "Scissors" };
const SHAKE_FRAMES = ["rock", "paper", "scissors"];
const WINNING_SCORE = 5;

const STYLES = `
  .rps-root{
    --felt-dark:#1f1033;
    --felt:#3b1f5c;
    --felt-light:#54308a;
    --gold:#b48af0;
    --gold-bright:#d4b3ff;
    --oxblood-bright:#a855c9;
    --cream:#ede6f5;
    --ink:#1c1029;
    --stone:#9d8bc2;
    --win:#8b5cf6;

    min-height:100vh;
    width:100%;
    background:
      radial-gradient(circle at 50% 0%, var(--felt-light) 0%, var(--felt) 45%, var(--felt-dark) 100%);
    font-family:'Work Sans', sans-serif;
    color:var(--cream);
    display:flex;
    flex-direction:column;
    align-items:center;
    padding:28px 16px 60px;
    position:relative;
    overflow-x:hidden;
    box-sizing:border-box;
  }
  .rps-root *{box-sizing:border-box;}
  .rps-root::before{
    content:"";
    position:fixed;
    inset:0;
    pointer-events:none;
    background-image:
      repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px);
    opacity:0.4;
    z-index:0;
  }
  .rps-stage{ position:relative; z-index:1; width:100%; max-width:720px; }
  .rps-header{ text-align:center; margin-bottom:22px; }
  .rps-eyebrow{
    font-family:'JetBrains Mono', monospace;
    letter-spacing:0.35em;
    font-size:11px;
    color:var(--gold);
    text-transform:uppercase;
    margin-bottom:6px;
  }
  .rps-h1{
    font-family:'Anton', sans-serif;
    font-weight:400;
    font-size:clamp(38px, 8vw, 64px);
    letter-spacing:0.02em;
    margin:0;
    color:var(--cream);
    text-shadow:0 3px 0 rgba(0,0,0,0.35);
    line-height:0.95;
  }
  .rps-h1 span{color:var(--gold-bright);}

  /* Scoreboard: numbers only, no card/background */
  .rps-scoreboard{
    display:flex; align-items:center; justify-content:center; gap:36px;
    margin:20px auto 26px;
  }
  .rps-score-block{ text-align:center; }
  .rps-score-label{
    font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:0.2em;
    text-transform:uppercase; color:var(--stone); margin-bottom:4px;
  }
  .rps-score-value{ font-family:'Anton', sans-serif; font-size:48px; line-height:1; }
  .rps-score-value.you{ color:var(--gold-bright); }
  .rps-score-value.cpu{ color:var(--oxblood-bright); }
  .rps-score-sep{
    font-family:'Anton', sans-serif; font-size:28px; color:var(--stone); opacity:0.6;
  }
  .rps-goal{
    text-align:center; font-family:'JetBrains Mono', monospace; font-size:11px;
    letter-spacing:0.15em; color:var(--stone); margin-top:-14px; margin-bottom:20px; opacity:0.8;
  }

  .rps-table{
    position:relative;
    background:radial-gradient(ellipse at 50% 40%, var(--felt-light) 0%, var(--felt) 70%);
    border:6px solid #0d1a13; border-radius:16px; padding:36px 20px 28px;
    box-shadow:inset 0 0 60px rgba(0,0,0,0.45), 0 20px 40px rgba(0,0,0,0.4);
    margin-bottom:26px;
  }
  .rps-arena{ display:flex; align-items:center; justify-content:space-between; gap:0; min-height:190px; }
  .rps-slot{ flex:1; display:flex; flex-direction:column; align-items:center; gap:10px; }
  .rps-slot-label{
    font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:0.25em;
    text-transform:uppercase; color:var(--stone);
  }
  .rps-hand-wrap{
    width:230px; height:180px; display:flex; align-items:center; justify-content:center;
    position:relative; overflow:visible;
  }
  .rps-hand{
    font-size:110px; line-height:1; display:flex; align-items:center; justify-content:center;
    width:210px; height:162px;
    filter:drop-shadow(0 10px 8px rgba(0,0,0,0.45));
    transform:scale(0.92);
    transition:transform 0.15s ease;
  }
  .rps-slot.cpu .rps-hand{ transform:scale(0.92) scaleX(-1); }
  .rps-hand.stamp{ animation:rpsStampDown 0.32s cubic-bezier(.2,1.4,.4,1) forwards; }
  .rps-slot.cpu .rps-hand.stamp{ animation:rpsStampDownCpu 0.32s cubic-bezier(.2,1.4,.4,1) forwards; }
  @keyframes rpsStampDown{
    0%{transform:scale(1.5) rotate(-8deg); opacity:0.2;}
    60%{transform:scale(0.86) rotate(4deg); opacity:1;}
    100%{transform:scale(0.97) rotate(0deg); opacity:1;}
  }
  @keyframes rpsStampDownCpu{
    0%{transform:scale(1.5) scaleX(-1) rotate(8deg); opacity:0.2;}
    60%{transform:scale(0.86) scaleX(-1) rotate(-4deg); opacity:1;}
    100%{transform:scale(0.97) scaleX(-1) rotate(0deg); opacity:1;}
  }
  .rps-hand.shaking{ animation:rpsShake 0.28s ease-in-out infinite; }
  .rps-slot.cpu .rps-hand.shaking{ animation:rpsShakeCpu 0.28s ease-in-out infinite; }
  @keyframes rpsShake{
    0%,100%{transform:translateY(0) rotate(-4deg) scale(0.92);}
    50%{transform:translateY(-14px) rotate(4deg) scale(0.97);}
  }
  @keyframes rpsShakeCpu{
    0%,100%{transform:translateY(0) scaleX(-1) rotate(4deg) scale(0.92);}
    50%{transform:translateY(-14px) scaleX(-1) rotate(-4deg) scale(0.97);}
  }
  .rps-vs{ font-family:'Anton', sans-serif; font-size:26px; color:var(--gold); opacity:0.7; padding-top:16px; }
  .rps-result-banner{ text-align:center; margin-top:20px; min-height:66px; transition:opacity 0.2s ease; }
  .rps-result-banner .rps-headline{
    font-family:'Anton', sans-serif; font-size:clamp(30px, 6vw, 44px);
    letter-spacing:0.02em; text-shadow:0 3px 0 rgba(0,0,0,0.35);
  }
  .rps-result-banner .rps-subline{
    font-family:'Work Sans', sans-serif; font-weight:600; font-size:16px;
    color:var(--cream); opacity:0.85; margin-top:4px;
  }
  .rps-result-banner.win .rps-headline{ color:var(--win); }
  .rps-result-banner.lose .rps-headline{ color:var(--oxblood-bright); }
  .rps-result-banner.tie .rps-headline{ color:var(--gold); }
  .rps-result-banner.match .rps-headline{ color:var(--gold-bright); }
  .rps-countdown{
    text-align:center; font-family:'Anton', sans-serif; font-size:20px; color:var(--stone);
    letter-spacing:0.1em; margin-top:20px; min-height:34px;
  }
  .rps-controls{ display:flex; justify-content:center; gap:16px; flex-wrap:wrap; margin-top:22px; }
  .rps-choice-btn{
    width:88px; height:88px; border-radius:50%; border:2px solid var(--gold);
    background:var(--ink); color:var(--cream); cursor:pointer;
    display:flex; align-items:center; justify-content:center; font-size:44px; line-height:1;
    padding:0; touch-action:manipulation; -webkit-tap-highlight-color:transparent; user-select:none;
    transition:transform 0.12s ease, background 0.15s ease, box-shadow 0.15s ease;
    box-shadow:0 6px 0 #0a140e, 0 8px 14px rgba(0,0,0,0.35);
  }
  .rps-choice-btn:hover{
    background:var(--felt-light); transform:translateY(-2px);
    box-shadow:0 8px 0 #0a140e, 0 12px 18px rgba(0,0,0,0.4);
  }
  .rps-choice-btn:active, .rps-choice-btn.pressed{
    transform:translateY(4px); box-shadow:0 2px 0 #0a140e, 0 4px 8px rgba(0,0,0,0.3);
  }
  .rps-choice-btn:disabled{
    opacity:0.35; cursor:default; transform:none;
    box-shadow:0 6px 0 #0a140e, 0 8px 14px rgba(0,0,0,0.35);
  }
  .rps-choice-btn:focus-visible{ outline:3px solid var(--gold-bright); outline-offset:3px; }
  .rps-footer-row{
    display:flex; justify-content:center; align-items:center; gap:18px;
    margin-top:26px; flex-wrap:wrap;
  }
  .rps-play-again-btn{
    font-family:'Anton', sans-serif; font-size:16px; letter-spacing:0.06em;
    text-transform:uppercase; background:var(--gold-bright); border:none;
    color:var(--ink); padding:12px 30px; border-radius:6px; cursor:pointer;
    touch-action:manipulation; -webkit-tap-highlight-color:transparent;
    box-shadow:0 6px 0 #7a4fb0, 0 8px 14px rgba(0,0,0,0.35);
    transition:transform 0.12s ease;
  }
  .rps-play-again-btn:active{ transform:translateY(3px); }
  .rps-streak{
    font-family:'JetBrains Mono', monospace; font-size:12px; color:var(--gold);
    letter-spacing:0.1em; min-height:16px;
  }
  @media (prefers-reduced-motion: reduce){
    .rps-hand.stamp, .rps-hand.shaking{ animation:none; }
  }
  @media (max-width:480px){
    .rps-root{ padding:18px 10px 40px; }
    .rps-eyebrow{ font-size:10px; letter-spacing:0.28em; }
    .rps-scoreboard{ gap:24px; margin:14px auto 18px; }
    .rps-score-value{ font-size:36px; }
    .rps-goal{ margin-bottom:14px; }
    .rps-table{ padding:22px 10px 18px; border-radius:12px; }
    .rps-arena{ gap:2px; min-height:130px; }
    .rps-hand-wrap{ width:140px; height:108px; }
    .rps-hand{ width:128px; height:96px; font-size:64px; }
    .rps-vs{ font-size:18px; padding-top:8px; }
    .rps-slot-label{ font-size:10px; }
    .rps-countdown{ font-size:16px; margin-top:12px; min-height:24px; }
    .rps-result-banner{ min-height:54px; margin-top:12px; }
    .rps-choice-btn{ width:68px; height:68px; font-size:32px; }
    .rps-controls{ gap:12px; }
    .rps-footer-row{ gap:10px; margin-top:18px; }
  }
  @media (max-width:360px){
    .rps-h1{ font-size:32px; }
    .rps-hand-wrap{ width:112px; height:90px; }
    .rps-hand{ width:104px; height:80px; font-size:52px; }
    .rps-choice-btn{ width:58px; height:58px; font-size:26px; }
    .rps-score-value{ font-size:28px; }
  }
`;

export default function RockPaperScissors() {
  const [youScore, setYouScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [youHand, setYouHand] = useState("rock");
  const [cpuHand, setCpuHand] = useState("rock");
  const [youAnimClass, setYouAnimClass] = useState("");
  const [cpuAnimClass, setCpuAnimClass] = useState("");
  const [countdownText, setCountdownText] = useState("Choose your hand");
  const [banner, setBanner] = useState({ kind: "", headline: "", subline: "" });
  const [streak, setStreak] = useState({ count: 0, who: null });
  const [locked, setLocked] = useState(false);
  const [pressedBtn, setPressedBtn] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  const audioCtxRef = useRef(null);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const beep = useCallback((freq, duration, type = "sine", peakGain = 0.18, delay = 0) => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.03);
    } catch (e) {}
  }, [getAudioCtx]);

  const playClick = useCallback(() => beep(520, 0.08, "square", 0.12), [beep]);
  const playReveal = useCallback(() => beep(170, 0.16, "sine", 0.22), [beep]);
  const playWin = useCallback(() => {
    beep(523, 0.12, "triangle", 0.2, 0);
    beep(659, 0.12, "triangle", 0.2, 0.12);
    beep(784, 0.22, "triangle", 0.22, 0.24);
  }, [beep]);
  const playLose = useCallback(() => {
    beep(300, 0.18, "sawtooth", 0.14, 0);
    beep(220, 0.26, "sawtooth", 0.14, 0.15);
  }, [beep]);
  const playTie = useCallback(() => {
    beep(400, 0.1, "sine", 0.16, 0);
    beep(400, 0.1, "sine", 0.16, 0.14);
  }, [beep]);
  const playMatchWin = useCallback(() => {
    [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.18, "triangle", 0.22, i * 0.13));
  }, [beep]);

  const hapticsSupported = typeof navigator !== "undefined" && "vibrate" in navigator;

  const vibrate = useCallback((pattern) => {
    if (!hapticsSupported) return;
    try { navigator.vibrate(pattern); } catch (e) {}
  }, [hapticsSupported]);

  const decide = (you, cpu) => {
    if (you === cpu) return "tie";
    return BEATS[you] === cpu ? "win" : "lose";
  };

  const playRound = (youChoice) => {
    if (locked || gameOver) return;
    setLocked(true);
    setBanner({ kind: "", headline: "", subline: "" });

    // Decide everything up front. Android Chrome only reliably runs
    // navigator.vibrate() when it's called synchronously inside the tap
    // handler — a vibrate() fired later from inside setTimeout gets silently
    // ignored because "user activation" no longer covers it. So we compute
    // the outcome now and fire ONE combined pattern immediately, timed to
    // line up with the shake (≈750ms) then the reveal buzz.
    const cpuChoice = ["rock", "paper", "scissors"][Math.floor(Math.random() * 3)];
    const result = decide(youChoice, cpuChoice);
    const newYou = result === "win" ? youScore + 1 : youScore;
    const newCpu = result === "lose" ? cpuScore + 1 : cpuScore;
    const youWonMatch = newYou >= WINNING_SCORE;
    const cpuWonMatch = newCpu >= WINNING_SCORE;

    // ~8 short pulses spanning the 720ms shake, then a result-specific buzz.
    const shakePulses = [40, 50, 40, 50, 40, 50, 40, 50, 40, 50, 40, 50, 40, 50, 40, 50];
    let resultPulses;
    if (youWonMatch || cpuWonMatch) resultPulses = [70, 40, 70, 40, 220];
    else if (result === "win") resultPulses = [50, 30, 50, 30, 130];
    else if (result === "lose") resultPulses = [280];
    else resultPulses = [60, 60, 60];

    playClick();
    vibrate([...shakePulses, ...resultPulses]);

    setYouAnimClass("shaking");
    setCpuAnimClass("shaking");
    setYouHand(SHAKE_FRAMES[0]);
    setCpuHand(SHAKE_FRAMES[0]);

    let ticks = 0;
    setCountdownText("Rock… Paper… Scissors…");
    const shakeCycle = setInterval(() => {
      setYouHand(SHAKE_FRAMES[ticks % 3]);
      setCpuHand(SHAKE_FRAMES[ticks % 3]);
      ticks++;
    }, 90);

    setTimeout(() => {
      clearInterval(shakeCycle);
      setYouAnimClass("stamp");
      setCpuAnimClass("stamp");
      setYouHand(youChoice);
      setCpuHand(cpuChoice);

      playReveal();

      setYouScore(newYou);
      setCpuScore(newCpu);

      if (youWonMatch || cpuWonMatch) {
        setGameOver(true);
        setBanner({
          kind: "match",
          headline: youWonMatch ? "You Win the Game!" : "Opponent Wins the Game!",
          subline: `Final score ${newYou} - ${newCpu}`,
        });
        setCountdownText("Game Over");
        playMatchWin();
      } else if (result === "win") {
        setBanner({
          kind: "win",
          headline: "You Win!",
          subline: `${MOVE_NAME[youChoice]} beats ${MOVE_NAME[cpuChoice]}!`,
        });
        setStreak((prev) => (prev.who === "you" ? { count: prev.count + 1, who: "you" } : { count: 1, who: "you" }));
        playWin();
        setCountdownText("Choose your next hand");
      } else if (result === "lose") {
        setBanner({
          kind: "lose",
          headline: "Opponent Wins!",
          subline: `${MOVE_NAME[cpuChoice]} beats ${MOVE_NAME[youChoice]}!`,
        });
        setStreak((prev) => (prev.who === "cpu" ? { count: prev.count + 1, who: "cpu" } : { count: 1, who: "cpu" }));
        playLose();
        setCountdownText("Choose your next hand");
      } else {
        setBanner({ kind: "tie", headline: "Push!", subline: "It's a tie — choose your next hand!" });
        setStreak({ count: 0, who: null });
        playTie();
        setCountdownText("Choose your next hand");
      }

      setLocked(false);
    }, 750);
  };

  const handlePlayAgain = () => {
    setYouScore(0);
    setCpuScore(0);
    setStreak({ count: 0, who: null });
    setBanner({ kind: "", headline: "", subline: "" });
    setCountdownText("Choose your hand");
    setYouHand("rock");
    setCpuHand("rock");
    setYouAnimClass("");
    setCpuAnimClass("");
    setGameOver(false);
  };

  const streakText =
    streak.count >= 2 ? `${streak.who === "you" ? "You are" : "Opponent is"} on a ${streak.count}-win streak` : "";

  return (
    <div className="rps-root">
      <style>{STYLES}</style>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Anton&family=Work+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap"
      />
      <div className="rps-stage">
        <header className="rps-header">
          <div className="rps-eyebrow">First to {WINNING_SCORE} Wins</div>
          <h1 className="rps-h1">
            ROCK · PAPER · <span>SCISSORS</span>
          </h1>
        </header>

        <div className="rps-scoreboard">
          <div className="rps-score-block">
            <div className="rps-score-label">You</div>
            <div className="rps-score-value you">{youScore}</div>
          </div>
          <div className="rps-score-sep">—</div>
          <div className="rps-score-block">
            <div className="rps-score-label">Opponent</div>
            <div className="rps-score-value cpu">{cpuScore}</div>
          </div>
        </div>
        <div className="rps-goal">First to {WINNING_SCORE} points wins the game</div>

        <div className="rps-table">
          <div className="rps-arena">
            <div className="rps-slot">
              <div className="rps-slot-label">You</div>
              <div className="rps-hand-wrap">
                <div className={`rps-hand ${youAnimClass}`}>{ICONS[youHand]}</div>
              </div>
            </div>
            <div className="rps-vs">VS</div>
            <div className="rps-slot cpu">
              <div className="rps-slot-label">Opponent</div>
              <div className="rps-hand-wrap">
                <div className={`rps-hand ${cpuAnimClass}`}>{ICONS[cpuHand]}</div>
              </div>
            </div>
          </div>
          <div className="rps-countdown">{countdownText}</div>
          <div className={`rps-result-banner ${banner.kind}`}>
            {banner.headline && (
              <>
                <div className="rps-headline">{banner.headline}</div>
                <div className="rps-subline">{banner.subline}</div>
              </>
            )}
          </div>

          {!gameOver ? (
            <div className="rps-controls">
              {["rock", "paper", "scissors"].map((choice) => (
                <button
                  key={choice}
                  className={`rps-choice-btn ${pressedBtn === choice ? "pressed" : ""}`}
                  aria-label={`Play ${MOVE_NAME[choice]}`}
                  disabled={locked}
                  onPointerDown={() => setPressedBtn(choice)}
                  onPointerUp={() => setPressedBtn(null)}
                  onPointerCancel={() => setPressedBtn(null)}
                  onPointerLeave={() => setPressedBtn(null)}
                  onClick={() => playRound(choice)}
                >
                  {ICONS[choice]}
                </button>
              ))}
            </div>
          ) : (
            <div className="rps-controls">
              <button className="rps-play-again-btn" onClick={handlePlayAgain}>
                Play Again
              </button>
            </div>
          )}
        </div>

        <div className="rps-footer-row">
          <div className="rps-stre
          
          ak">{streakText}</div>
        </div>
      </div>
    </div>
  );
}