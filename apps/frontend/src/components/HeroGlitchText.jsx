import React from "react";

/* Looping glitch for hero headlines. Kept clean & legible the whole cycle,
   then ~300ms of digital corruption: the glyphs splinter into 3 stacked
   color-fringed copies that chop into horizontal slices (steps(1,end) = true
   digital chop), the base text lurches and flash-flickers, then everything
   snaps clean. Cycle repeats forever on slightly out-of-phase timings so the
   bursts drift instead of rhythmically thumping. */
const GLITCH_CSS = `
.hero-glitch{position:relative;display:block;line-height:1.05;margin-bottom:8px;letter-spacing:-0.01em}
.ht-base{position:relative;z-index:3;display:block;color:rgba(255,255,255,.98);will-change:transform,filter;animation:htBaseKf 2.8s steps(1,end) infinite;animation-delay:var(--ht-delay,0s)}
.hero-glitch i{position:absolute;inset:0;z-index:2;display:block;font-style:normal;pointer-events:none;opacity:0;clip-path:inset(0 0 100% 0);will-change:clip-path,transform;animation:htBurstB 3.1s steps(1,end) infinite;animation-delay:var(--ht-delay,0s)}
.ht-r{filter:drop-shadow(-2px 0 rgba(255,45,85,.55))}
.ht-c{filter:drop-shadow(2px 0 rgba(0,229,255,.55))}
.ht-g{filter:drop-shadow(0 0 9px rgba(57,255,20,.38))}
.ht-r{animation-name:htBurstA;animation-duration:2.8s}
.ht-c{animation-name:htBurstB;animation-duration:3.1s}
.ht-g{animation-name:htBurstG;animation-duration:2.6s}
.hero-glitch--accent .hero-glitch-text-color{background:linear-gradient(90deg,var(--purple),var(--accent),var(--gold));-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
.hero-glitch--accent i{background:linear-gradient(90deg,var(--purple),var(--accent),var(--gold));-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
@keyframes htBaseKf{
  0%,12%,100%{transform:none;filter:none;opacity:1}
  2%{transform:translateX(1.5px) scaleX(.999);filter:brightness(1.45) saturate(1.25);opacity:.9}
  3%{transform:translateX(-1.5px);filter:brightness(1.2);opacity:1}
  4%{transform:translateX(.5px) skewX(-.8deg);opacity:.95}
  5%{transform:none;filter:none;opacity:1}
  7%{transform:translateX(-.5px);opacity:.97}
  8%{transform:none;opacity:1}
}
@keyframes htBurstA{
  0%,12%,100%{clip-path:inset(0 0 100% 0);transform:translateX(0);opacity:0}
  2%{clip-path:inset(3% 0 89% 0);transform:translateX(-4px);opacity:1}
  3%{clip-path:inset(36% 0 51% 0);transform:translateX(3px)}
  4%{clip-path:inset(72% 0 13% 0);transform:translateX(-3px)}
  5%{clip-path:inset(10% 0 81% 0);transform:translateX(4px)}
  6%{clip-path:inset(47% 0 40% 0);transform:translateX(-4px)}
  7%{clip-path:inset(87% 0 2% 0);transform:translateX(3px)}
  8%{clip-path:inset(25% 0 62% 0);transform:translateX(-3px)}
  9%{clip-path:inset(60% 0 27% 0);transform:translateX(4px)}
  11%{clip-path:inset(2% 0 95% 0);transform:translateX(-2px)}
}
@keyframes htBurstB{
  0%,12%,100%{clip-path:inset(0 0 100% 0);transform:translateX(0);opacity:0}
  2%{clip-path:inset(15% 0 77% 0);transform:translateX(4px);opacity:.95}
  3%{clip-path:inset(52% 0 36% 0);transform:translateX(-3px)}
  4%{clip-path:inset(84% 0 6% 0);transform:translateX(3px)}
  5%{clip-path:inset(5% 0 90% 0);transform:translateX(-4px)}
  6%{clip-path:inset(40% 0 48% 0);transform:translateX(4px)}
  7%{clip-path:inset(78% 0 9% 0);transform:translateX(-3px)}
  8%{clip-path:inset(20% 0 67% 0);transform:translateX(4px)}
  9%{clip-path:inset(64% 0 21% 0);transform:translateX(-4px)}
  11%{clip-path:inset(8% 0 86% 0);transform:translateX(3px)}
}
@keyframes htBurstG{
  0%,5%,12%,100%{clip-path:inset(0 0 100% 0);transform:translateX(0);opacity:0}
  3%{clip-path:inset(62% 0 18% 0);transform:translateX(1.5px);opacity:.6}
  4%{clip-path:inset(30% 0 55% 0);transform:translateX(-1.5px);opacity:.6}
  8%{clip-path:inset(72% 0 10% 0);transform:translateX(1.5px);opacity:.6}
}
@media (prefers-reduced-motion: reduce){
  .hero-glitch .ht-base,.hero-glitch i{animation:none}
  .hero-glitch i{opacity:0}
}
`;

export default function HeroGlitchText({
  text = "IMMERSE",
  accent = false,
  delay = 0,
  className = "",
  style = {},
}) {
  return (
    <>
      <style>{GLITCH_CSS}</style>
      <span
        className={`hero-glitch${accent ? " hero-glitch--accent" : ""}${className ? ` ${className}` : ""}`}
        style={{ "--ht-delay": `${delay}s`, ...style }}
      >
        <span className="ht-base hero-glitch-text-color">{text}</span>
        {["ht-r", "ht-c", "ht-g"].map((c) => (
          <i key={c} className={c} aria-hidden="true">
            {text}
          </i>
        ))}
      </span>
    </>
  );
}