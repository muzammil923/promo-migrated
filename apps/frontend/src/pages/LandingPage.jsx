import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import CountUp from "../components/CountUp";
import PlayerNavbar from "../components/PlayerNavbar";
import HeroGlitchText from "../components/HeroGlitchText";            
import ArkanoidGame from "../components/ArkanoidGame";
import MascotCursor from "../components/MascotCursor";
import LogoLoader from "../components/LogoLoader";
import { EASE_THEME } from "../utils/bezier";
import { ScrollReelTestimonials } from "@/components/ui/scroll-reel-testimonials";
import { avatarImageSrc } from "../components/AvatarData";
/* Landing page styles live in a real stylesheet (not an inline <style> tag)
   so the browser fetches/parses them in parallel with the JS bundle instead
   of blocking on React injecting ~30 KB of CSS on mount. */
import "./LandingPage.css";

/* gsap is only used for the hero-card fan-in / shuffle. It's imported lazily
   so the ~116 KB gsap chunk is not part of the initial critical-path bundle
   (it was the 3rd largest script on first load). */
let gsapPromise;
const getGsap = () => (gsapPromise ||= import('gsap').then(m => m.default));

/* ─── INLINE SVG ICONS ────────────────────────────── */
const ICONS = {
  dice:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>',
  zap:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>',
  puzzle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h4a2 2 0 0 1 4 0h4a2 2 0 0 1 2 2v4a2 2 0 0 1 0 4v2H2v-2a2 2 0 0 1 0-4V9a2 2 0 0 1 2-2z"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 21h8M12 17v4M6 3h12l-1 7a5 5 0 0 1-10 0L6 3zM6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3"/></svg>',
  gift:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 7h-3.2a3 3 0 1 0-4.8-3 3 3 0 1 0-4.8 3H4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z"/><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 7v14"/></svg>',
  tap:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11V6a2 2 0 1 1 4 0M13 6a2 2 0 1 1 4 0v6M9 12V9a2 2 0 1 0-4 0v7a7 7 0 0 0 7 7h1a7 7 0 0 0 7-7v-3a2 2 0 1 0-4 0"/></svg>',
  blocks:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  pointer:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4l7.07 17 2.51-7.39L21 11.07z"/><path d="M9.12 12.88L4 4"/></svg>',
  star:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 6.9L12 17.3 5.7 20.8l1.7-6.9-5.4-4.7 7.1-.6z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  starSolid: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 6.9L12 17.3 5.7 20.8l1.7-6.9-5.4-4.7 7.1-.6z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  gamepad:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 3a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5c1 .3 2 .5 3 .7a2 2 0 0 1 1.7 2z"/></svg>',
  mail:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7 10-7"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V9h4v2a5 5 0 0 1 2-3z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 5.9a8.4 8.4 0 0 1-2.4.66 4.2 4.2 0 0 0 1.83-2.3 8.3 8.3 0 0 1-2.65 1 4.17 4.17 0 0 0-7.1 3.8A11.83 11.83 0 0 1 3.15 4.6a4.16 4.16 0 0 0 1.29 5.56 4.1 4.1 0 0 1-1.89-.52v.05a4.17 4.17 0 0 0 3.34 4.09 4.2 4.2 0 0 1-1.88.07 4.18 4.18 0 0 0 3.89 2.9A8.35 8.35 0 0 1 2 18.57a11.78 11.78 0 0 0 6.4 1.88c7.68 0 11.88-6.37 11.88-11.89l-.01-.54A8.5 8.5 0 0 0 22 5.9z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m10 9 5 3-5 3z"/></svg>',
  badgeCheck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.77 4 4 0 0 1 0 6.76 4 4 0 0 1-4.78 4.77 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>',
};

const SvgIcon = ({ name, size = 24, className = "", style = {} }) => (
  <span
    className={className}
    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, flexShrink: 0, ...style }}
    dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }}
  />
);

/* ─── DATA ─────────────────────────────────────────── */
const MARQUEE_TEXTS = [
  "Play Fast. Win Big.",
  "Every Game Is A Chance To Win.",
  "Compete. Score. Unlock Rewards.",
  "Turn Your Free Time Into Winning Time.",
  "Every Game Played Is A Treat You Give Yourself.",
];

/* "Pick Your Challenge" — the six game challenge cards. Artwork is composed
   at the MOCKUP CARD PROPORTIONS (visual area ~65-70% top / dark text-safe
   area ~30-35% bottom) so the HTML text/buttons sit on the dark zone and a
   full-bleed object-fit:cover needs almost no cropping. Each entry carries the
   export aspect (w×h) and the object-position the card should use. */
const CHALLENGE_GAMES = [
  { num: "01", title: "Spin & Win", tagline: "Spin. Win. Unlock the reward.", desc: "Stake it on the wheel and unlock the reward.", art: "/game-cards/spin-win.png", w: 1060, h: 1484, pos: "center top", keywords: ["spin", "wheel", "win"], featured: true },
  { num: "02", title: "Quick Reflex", tagline: "React fast. Every millisecond counts.", desc: "Pure speed. Pure victory.", art: "/game-cards/quick-reflex.png", w: 1586, h: 992, pos: "center center", keywords: ["reflex", "reaction", "speed", "tap"], featured: false },
  { num: "03", title: "Puzzle Rush", tagline: "Think quickly. Clear the challenge.", desc: "Match your mind with the clock.", art: "/game-cards/puzzle-rush.png", w: 1586, h: 992, pos: "center center", keywords: ["puzzle", "2048", "memory", "jigsaw"], featured: false },
  { num: "04", title: "Quiz Battle", tagline: "Know it? Prove it.", desc: "Answer fast and rise up the ranks.", art: "/game-cards/quiz-battle.png", w: 1448, h: 1086, pos: "center center", keywords: ["quiz", "trivia", "survey"], featured: false },
  { num: "05", title: "Lucky Drop", tagline: "Take your chance. Catch the reward.", desc: "Drop in, catch the prize.", art: "/game-cards/lucky-drop.png", w: 1448, h: 1086, pos: "center center", keywords: ["lucky", "drop", "catch", "drops"], featured: false },
  { num: "06", title: "Tap Challenge", tagline: "Tap fast. Climb higher.", desc: "Send the high score tumbling.", art: "/game-cards/tap-challenge.png", w: 1448, h: 1086, pos: "center center", keywords: ["tap", "whack", "reaction", "mole"], featured: false },
];
const CHALLENGE_FALLBACK = "/arcade";

const HOW_STEPS = [
  { num: "01", icon: <SvgIcon name="gamepad" size={30} />, title: "Choose A Game",  desc: "Jump into fun quick games anytime, anywhere." },
  { num: "02", icon: <SvgIcon name="star" size={30} />, title: "Earn Points",    desc: "Score higher and move up the leaderboard with every play." },
  { num: "03", icon: <SvgIcon name="gift" size={30} />, title: "Unlock Rewards", desc: "Top players win exciting gifts, rewards, and exclusive surprises." },
];

const REWARD_TAGS = [
  "Real-Time Rewards", "monthly Winners", "Exclusive Gifts",
  "Bonus Unlocks", "Daily Surprises",
];

const REWARD_CARDS_DATA = [
  { icon: <SvgIcon name="zap" size={38} />, title: "Real-Time Rewards", desc: "Earn points and redeem rewards instantly — no waiting, no delays." },
  { icon: <SvgIcon name="trophy" size={38} />, title: "monthly Winners",    desc: "Top scorers every week get exclusive prizes and surprises." },
  { icon: <SvgIcon name="gift" size={38} />, title: "Exclusive Gifts",   desc: "Unlock curated gifts and offers only available to top players." },
  { icon: <SvgIcon name="dice" size={38} />, title: "Daily Surprises",   desc: "Log in every day for bonus drops, mystery rewards, and more." },
];

/* WHY AUDIENCES LOVE PROMOGAMES — benefit rows (left) + mascot showcase (right) */
const WHY_BENEFITS = [
  { num: "01", title: "Quick To Start",      desc: "Simple experiences anyone can jump into instantly." },
  { num: "02", title: "Rewards That Matter", desc: "Give people a reason to participate and return." },
  { num: "03", title: "Fresh Every Time",    desc: "New challenges keep engagement from feeling repetitive." },
  { num: "04", title: "Built To Compete",    desc: "Scores, rankings, and social play make campaigns more exciting." },
  { num: "05", title: "Easy To Revisit",     desc: "Short experiences make it natural to come back again." },
];

/* Mascot showcase art — generated portraits in /public/mascot-showcase/.
   1 = mascot playing a handheld console · 2 = glowing gift box · 3 = winner podium.
   `pos` fine-tunes object-position so the mascot's face never crops. */
const WHY_SLIDES = [
  { art: "/mascot-showcase/1.png", title: "Quick To Play",           desc: "Short interactions that fit naturally into any moment.",            pos: "50% 30%" },
  { art: "/mascot-showcase/2.png", title: "Every Play Can Surprise", desc: "Unlock offers, rewards, and campaign moments worth remembering.",   pos: "50% 34%" },
  { art: "/mascot-showcase/3.png", title: "Compete. Climb. Win.",    desc: "Leaderboards give people a reason to keep coming back.",            pos: "50% 28%" },
];

const STATS = [
  { val: "20+",   label: "Games Played"    },
  { val: "50+", label: "Rewards Claimed" },
  { val: "10+", label: "Daily Players"   },
  { val: "10+",  label: "Active Games"    },
];

/* Stats for the Reward Community banner section */
const RCM_STATS = [
  { icon: "gamepad", val: "20+", label: "Games Played"    },
  { icon: "gift",    val: "50+", label: "Rewards Claimed" },
  { icon: "star",    val: "10+", label: "Daily Players"   },
  { icon: "flame",   val: "10+", label: "Active Games"    },
];

const FOOTER_NAV = [
  ["Play Now", "/arcade"],
  ["Leaderboard", "/leaderboard"],
  ["Business", "/business"],
  ["Log In", "/login"],
];

/* Each testimonial wears one of the six PromoGames player avatars
   (av-1 Phoenix ... av-6 Electric Wolf), handed to the reel as an SVG data
   URI so its <img>-based tiles can show them with no new asset pipeline. */
const TESTIMONIALS = [
  {
    quote: "I jumped on during my lunch break and ended up winning a ₹500 voucher in the quiz battle. Never thought a 10-minute game could actually pay off!",
    author: "Arjun K.",
    image: avatarImageSrc('av-1'),
    alt: "Arjun K.'s PromoGames avatar",
  },
  {
    quote: "The leaderboard is addictive. I check it every morning before work — seeing my name climb keeps me coming back for more every single day.",
    author: "Priya S.",
    image: avatarImageSrc('av-2'),
    alt: "Priya S.'s PromoGames avatar",
  },
  {
    quote: "Scratch cards on PromoGames are the best stress buster. Got an exclusive discount on my favourite brand — totally unexpected and so exciting!",
    author: "Rohit V.",
    image: avatarImageSrc('av-3'),
    alt: "Rohit V.'s PromoGames avatar",
  },
  {
    quote: "My whole family plays spin and win together on weekends. It's become our little tradition — and we've won some great gifts along the way!",
    author: "Meera S.",
    image: avatarImageSrc('av-4'),
    alt: "Meera S.'s PromoGames avatar",
  },
  {
    quote: "Fast games, real rewards, zero nonsense. PromoGames is the only platform that actually gives back. Won concert tickets last week — unreal!",
    author: "Kiran P.",
    image: avatarImageSrc('av-5'),
    alt: "Kiran P.'s PromoGames avatar",
  },
  {
    quote: "I've tried every gaming app out there — nothing comes close to the reward system here. The surprises keep coming and I keep winning!",
    author: "Divya R.",
    image: avatarImageSrc('av-6'),
    alt: "Divya R.'s PromoGames avatar",
  },
];

/* Right-zone artwork for the combined How-It-Works + Leaderboard panel:
   mascot on rocks holding the trophy, coins floating (public/mascot-trophy.webp). */
const HW_MASCOT_ART = '/mascot-trophy.webp';

const LB_MOCK = [
  { initials: "AK", name: "Arjun K.",  score: "48,200", pct: 100 },
  { initials: "PS", name: "Priya S.",  score: "44,750", pct: 93  },
  { initials: "RV", name: "Rohit V.",  score: "41,100", pct: 85  },
  { initials: "MS", name: "Meera S.",  score: "38,600", pct: 80  },
  { initials: "KP", name: "Kiran P.",  score: "35,900", pct: 74  },
];

/* Live-preview dataset. `id` is the stable React key so rows (and their
   Framer Motion layout animations) survive re-sorts; `avatarHue` keeps each
   player's gradient fixed when their rank changes (colors were previously
   derived from row index, which made them swap on every reorder). */
const DUMMY_LEADERBOARD = [
  { id: "arjun",   name: "Arjun K.",  score: 48200, has_account: true,  avatarHue: "#b12cff,#7C3AED" },
  { id: "priya",   name: "Priya S.",  score: 44750, has_account: true,  avatarHue: "#7C3AED,#9210f6" },
  { id: "rohit",   name: "Rohit V.",  score: 41100, has_account: false, avatarHue: "#9210f6,#610497" },
  { id: "meera",   name: "Meera S.",  score: 38600, has_account: true,  avatarHue: "#610497,#b12cff" },
  { id: "kiran",   name: "Kiran P.",  score: 35900, has_account: false, avatarHue: "#b12cff,#610497" },
  { id: "divya",   name: "Divya R.",  score: 32400, has_account: true,  avatarHue: "#7C3AED,#b12cff" },
  { id: "aman",    name: "Aman S.",   score: 29800, has_account: false, avatarHue: "#9210f6,#7C3AED" },
  { id: "neha",    name: "Neha G.",   score: 27100, has_account: true,  avatarHue: "#610497,#9210f6" },
  { id: "rajesh",  name: "Rajesh M.", score: 24500, has_account: false, avatarHue: "#b12cff,#9210f6" },
  { id: "sneha",   name: "Sneha T.",  score: 21800, has_account: true,  avatarHue: "#7C3AED,#610497" },
];

/* ─── SVG ARROW ─── */
const Arr = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ─── HERO GAMES — Card right + avatars left ─── */
const HERO_FAN_MAX = 7;
const HERO_FAN_HALF = 3;
const HERO_FAN_POSITIONS = [
  { rot: 0, scale: 0.85, x: 0, y: -6.5, zIndex: 1 },
  { rot: 0, scale: 0.90, x: 0, y: -4.8, zIndex: 2 },
  { rot: 0, scale: 0.95, x: 0, y: -2.8, zIndex: 3 },
  { rot: 0, scale: 1.0,  x: 0, y: 0,    zIndex: 10 },
  { rot: 0, scale: 0.95, x: 0, y: 2.8,  zIndex: 3 },
  { rot: 0, scale: 0.90, x: 0, y: 4.8,  zIndex: 2 },
  { rot: 0, scale: 0.85, x: 0, y: 6.5,  zIndex: 1 },
];

function heroFanResponsiveMult(w) {
  if (w < 480) return 0.5;
  if (w < 640) return 0.65;
  if (w < 768) return 0.8;
  if (w < 1024) return 0.9;
  return 1;
}
function heroFanHeightMult(w) {
  let ideal;
  if (w < 480) ideal = 352;
  else if (w < 640) ideal = 416;
  else if (w < 768) ideal = 448;
  else if (w < 1024) ideal = 544;
  else ideal = 608;
  const avail = window.innerHeight * 0.7;
  return avail >= ideal ? 1 : avail / ideal;
}
function heroFanSlotCfg(total, slot) {
  if (total >= HERO_FAN_MAX) return HERO_FAN_POSITIONS[slot];
  const c = total >> 1;
  const d = total > 1 ? (slot - c) / c : 0;
  const a = Math.abs(d);
  return { rot: 0, scale: 1 - 0.15 * a, x: 0, y: d * 3, zIndex: 10 - Math.abs(slot - c) };
}

function HeroGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const containerRef = useRef(null);
  const isAnimating = useRef(false);
  const hasEntered = useRef(false);
  const directionRef = useRef(null);
  const prevVisible = useRef(new Set());
  const hoverTimerRef = useRef(null);
  const hoverRef = useRef(false);
  const autoRef = useRef(null);

  useEffect(() => {
    fetch('/api/play/hero-games')
      .then(r => r.json())
      .then(d => { if (d.success) setGames(d.games || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = games.length;
  const needsNav = total > HERO_FAN_MAX;
  const visibleCount = needsNav ? HERO_FAN_MAX : total;

  const getVisibleMap = useCallback((ctr) => {
    const map = new Map();
    if (!needsNav) { games.forEach((_, i) => map.set(i, i)); return map; }
    for (let s = 0; s < HERO_FAN_MAX; s++) {
      map.set(((ctr + s - HERO_FAN_HALF) % total + total) % total, s);
    }
    return map;
  }, [total, needsNav, games]);

  const cycle = useCallback((dir) => {
    if (isAnimating.current || !needsNav) return;
    isAnimating.current = true;
    directionRef.current = dir;
    setCenter(p => dir === 'right' ? (p + 1) % total : (p - 1 + total) % total);
  }, [total, needsNav]);

  /* Auto-cycle every 3s, pause on hover */
  useEffect(() => {
    if (!needsNav || total < 2) return;
    const start = () => {
      clearInterval(autoRef.current);
      autoRef.current = setInterval(() => {
        if (!hoverRef.current && !isAnimating.current) cycle('right');
      }, 3000);
    };
    start();
    return () => clearInterval(autoRef.current);
  }, [needsNav, total, cycle]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !total) return;
    const cards = Array.from(el.querySelectorAll('.hero-fan-card'));
    if (!cards.length) return;

    const visMap = getVisibleMap(center);
    const prev = prevVisible.current;
    const dir = directionRef.current;
    const first = !hasEntered.current;
    const mult = heroFanResponsiveMult(window.innerWidth);
    const hMult = heroFanHeightMult(window.innerWidth);
    const cfg = (s) => heroFanSlotCfg(visibleCount, s);

    if (first) isAnimating.current = true;
    let done = 0;
    const onDone = () => { if (++done >= visMap.size) { isAnimating.current = false; if (first) hasEntered.current = true; } };

    /* gsap is lazy-loaded (see getGsap) so it stays out of the initial bundle. */
    let cancelled = false;
    let cleanup = () => {};
    getGsap().then(g => {
      if (cancelled) return;

      cards.forEach((card, ci) => {
        const slot = visMap.get(ci);
        const was = prev.has(ci);
        if (slot !== undefined) {
          const base = cfg(slot);
          const tgt = { x: `${base.x * mult}rem`, y: `${base.y * hMult}rem`, rotation: base.rot, scale: base.scale, opacity: 1, zIndex: base.zIndex };
          if (first) {
            g.set(card, { x: 0, y: `${6 * hMult}rem`, rotation: 0, scale: 0.5, opacity: 0 });
            g.to(card, { ...tgt, duration: 1.2, ease: 'elastic.out(1.05,.78)', delay: 0.2 + slot * 0.06, onComplete: onDone });
          } else if (!was) {
            const ex = dir === 'right' ? 20 : -20;
            g.set(card, { x: `${ex}rem`, y: `${base.y * hMult}rem`, rotation: dir === 'right' ? 20 : -20, scale: 0.5, opacity: 0 });
            g.to(card, { ...tgt, duration: 0.6, ease: 'power2.out', onComplete: onDone });
          } else {
            g.to(card, { ...tgt, duration: 0.5, ease: 'power2.out', onComplete: onDone });
          }
        } else if (was) {
          const ex = dir === 'right' ? -20 : 20;
          g.to(card, { x: `${ex}rem`, opacity: 0, scale: 0.5, rotation: dir === 'right' ? -20 : 20, duration: 0.4, ease: 'power2.in', zIndex: 0 });
        } else if (first) {
          g.set(card, { opacity: 0, scale: 0.3, x: 0, y: 0, zIndex: 0 });
        }
      });
      prevVisible.current = new Set(visMap.keys());

      /* Hover */
      const entries = [];
      cards.forEach((c, i) => { const s = visMap.get(i); if (s !== undefined) entries.push({ el: c, slot: s, gameIdx: i }); });
      entries.sort((a, b) => a.slot - b.slot);
      let activeSlot = null;
      const centerSlot = entries.length >> 1;

      const updateHover = (hSlot) => {
        const m = heroFanResponsiveMult(window.innerWidth);
        const hm = heroFanHeightMult(window.innerWidth);
        entries.forEach(({ el, slot }) => {
          const base = cfg(slot);
          let tx = base.x * m, ty = base.y * hm, tr = base.rot, ts = base.scale, dl = 0;
          if (hSlot !== null) {
            const dist = Math.abs(slot - hSlot);
            dl = dist * 0.015;
            if (slot === hSlot) { ts *= 1.04; }
            else if (slot < hSlot) { ty -= 0.4 * hm; }
            else { ty += 0.4 * hm; }
          } else { dl = Math.abs(slot - centerSlot) * 0.02; }
          g.to(el, { x: `${tx}rem`, y: `${ty}rem`, rotation: tr, scale: ts, duration: 0.45, delay: dl, ease: 'power2.out', overwrite: 'auto' });
          g.set(el, { zIndex: base.zIndex });
        });
      };

      const enterHandlers = entries.map(({ el, slot, gameIdx }) => {
        const h = () => {
          if (isAnimating.current) return;
          if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
          if (activeSlot !== slot) { activeSlot = slot; updateHover(slot); }
          setHoveredIdx(gameIdx);
        };
        el.addEventListener('mouseenter', h);
        return { el, h };
      });
      const onLeave = () => {
        if (isAnimating.current) return;
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => { activeSlot = null; updateHover(null); setHoveredIdx(null); }, 50);
      };
      el.addEventListener('mouseleave', onLeave);
      let resizeTimer = null;
      let lastW = window.innerWidth;
      const onResize = () => {
        const newW = window.innerWidth;
        if (Math.abs(newW - lastW) < 20) return;
        lastW = newW;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { if (!isAnimating.current) updateHover(activeSlot); }, 200);
      };
      window.addEventListener('resize', onResize);

      cleanup = () => {
        enterHandlers.forEach(({ el, h }) => el.removeEventListener('mouseenter', h));
        el.removeEventListener('mouseleave', onLeave);
        window.removeEventListener('resize', onResize);
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [center, total, getVisibleMap, needsNav, visibleCount]);

  const COLORS = ['#9210f6','#610497','#7C3AED','#4F46E5','#9210f6','#610497'];
  const GAME_ICONS = [
    <SvgIcon name="puzzle" size={24} />, <SvgIcon name="dice" size={24} />,
    <SvgIcon name="trophy" size={24} />, <SvgIcon name="gift" size={24} />,
    <SvgIcon name="zap" size={24} />, <SvgIcon name="gamepad" size={24} />
  ];

  const chevron = (d) => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={d === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  );

  return (
    <div className="hero-games">
      <div className="hero-games-title"><SvgIcon name="flame" size={14} /> Top Games this month</div>
      <div className="hero-games-area">
        {/* Card stack + arc avatars */}
        <div className="hero-fan-layout" ref={containerRef}
          onMouseEnter={() => { hoverRef.current = true; clearInterval(autoRef.current); }}
          onMouseLeave={() => { hoverRef.current = false; if (needsNav && total >= 2) autoRef.current = setInterval(() => { if (!hoverRef.current && !isAnimating.current) cycle('right'); }, 3000); }}>
          {/* Arc avatars from top-right of card, curving left, to bottom */}
          <div className="hero-game-avatars">
            {!loading && games.map((game, i) => {
              const count = Math.min(games.length, HERO_FAN_MAX);
              const idx = i < count ? i : i % count;
              const total = Math.min(games.length, HERO_FAN_MAX);
              const startAngle = 38;
              const endAngle = -142;
              const angleDeg = startAngle + (total > 1 ? (idx / (total - 1)) * (endAngle - startAngle) : 0);
              const rad = (angleDeg * Math.PI) / 180;
              const radius = 210;
              const cx = 255;
              const cy = 190;
              const x = cx + Math.sin(rad) * radius - 24;
              const y = cy - Math.cos(rad) * radius - 24;
              const delay = idx * 0.08;
              return (
                <div key={game.id}
                  className={`hero-game-avatar${hoveredIdx === i ? ' active' : ''}`}
                  style={{ left: `${x}px`, top: `${y}px`, transitionDelay: `${delay}s`, transitionDuration: '0.4s' }}>
                  {game.game_logo_url || game.bg_image_url ? (
                    <img src={game.game_logo_url || game.bg_image_url} alt={game.name} />
                  ) : (
                    <div className="hero-game-avatar-placeholder" style={{ background: `linear-gradient(135deg,${COLORS[i % COLORS.length]}44,${COLORS[(i+2)%COLORS.length]}22)` }}>
                      {GAME_ICONS[i % GAME_ICONS.length]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        {loading && <div className="hg-loader"><div className="hg-spinner" />Loading…</div>}
        {!loading && games.length > 0 && (() => {
          const game = games[center] || games[0];
          return game.slug ? (
            <a key={game.id} href={`/play/${game.slug}/${game.client_slug}`} target="_blank" rel="noopener noreferrer"
              className="hero-fan-card hgf-front">
              <div className="relative w-full h-full overflow-hidden">
                {game.game_logo_url || game.bg_image_url ? (
                  <img className="hgf-thumb" src={game.game_logo_url || game.bg_image_url} alt={game.name} loading="lazy" />
                ) : (
                  <div className="hgf-thumb-placeholder" style={{ background: `linear-gradient(135deg,${COLORS[center % COLORS.length]}33,${COLORS[(center+2)%COLORS.length]}18)` }}>
                    {GAME_ICONS[center % GAME_ICONS.length]}
                  </div>
                )}
                <div className="hgf-bottom">
                  <div className="hgf-info">
                    <span className="hgf-name">{game.name}</span>
                    <div className="hgf-meta"><div className="hgf-plays-dot" />{(game.play_count || 0).toLocaleString()} plays</div>
                  </div>
                  <span className="hgf-badge">{game.category || 'Quiz'}</span>
                </div>
              </div>
            </a>
          ) : (
            <div key={game.id} className="hero-fan-card hgf-front">
              <div className="relative w-full h-full overflow-hidden">
                {game.game_logo_url || game.bg_image_url ? (
                  <img className="hgf-thumb" src={game.game_logo_url || game.bg_image_url} alt={game.name} loading="lazy" />
                ) : (
                  <div className="hgf-thumb-placeholder" style={{ background: `linear-gradient(135deg,${COLORS[center % COLORS.length]}33,${COLORS[(center+2)%COLORS.length]}18)` }}>
                    {GAME_ICONS[center % GAME_ICONS.length]}
                  </div>
                )}
                <div className="hgf-bottom">
                  <div className="hgf-info">
                    <span className="hgf-name">{game.name}</span>
                    <div className="hgf-meta"><div className="hgf-plays-dot" />{(game.play_count || 0).toLocaleString()} plays</div>
                  </div>
                  <span className="hgf-badge">{game.category || 'Quiz'}</span>
                </div>
              </div>
            </div>
          );
        })()}
        {!loading && total === 0 && (
          <div style={{ height:240, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontFamily:'var(--fb)', fontSize:13 }}>
            Games loading soon — check back shortly!
          </div>
        )}
      </div>
      </div>
      {!loading && needsNav && (
        <div className="hero-fan-nav">
          <button className="hero-fan-arrow" onClick={() => cycle('left')} aria-label="Previous">{chevron('left')}</button>
          <div className="hero-fan-dots">
            {games.map((_, i) => <span key={i} className={`hero-fan-dot${i === center ? ' active' : ''}`} />)}
          </div>
          <button className="hero-fan-arrow" onClick={() => cycle('right')} aria-label="Next">{chevron('right')}</button>
        </div>
      )}
    </div>
  );
}

/* ─── MARQUEE ─── */
function MarqueeStrip() {
  const items = [...MARQUEE_TEXTS, ...MARQUEE_TEXTS];
  return (
    <div className="marquee-strip">
      <div className="marquee-track">
        {items.map((t, i) => (
          <span key={i} className="marquee-item">
            <span className="dot" />{t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── TOP GAMES THIS WEEK (from Business page) ─── */
function RankedGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgIdx, setMsgIdx] = useState(0);
  const [bubbleShow, setBubbleShow] = useState(false);

  const MASCOT_MSGS = [
    'Check out this week\'s hottest games!',
    'Play now and climb the ranks!',
    'Top players win big rewards!',
    'Tap a game to start playing!',
    'New games added every week!',
  ];

  useEffect(() => {
    fetch('/api/play/hero-games')
      .then(r => r.json())
      .then(d => { if (d.success) setGames(d.games || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sectionRef = useRef(null);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [inView, setInView] = useState(false);
  const [revealed, setRevealed] = useState(false);

  /* The ranked section is far below the fold — don't rotate the mascot
     messages (or re-render the bubble) until the user actually scrolls there. */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true);
        /* fire the entrance reveal once, the first time the section scrolls in */
        if (!revealed) setRevealed(true);
        obs.disconnect();
      }
    }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  useEffect(() => {
    if (!inView) return;
    let idx = 0;
    const showMsg = () => {
      setMsgIdx(idx % MASCOT_MSGS.length);
      setBubbleShow(true);
      setTimeout(() => setBubbleShow(false), 3200);
      idx++;
    };
    const t1 = setTimeout(showMsg, 1200);
    const timer = setInterval(showMsg, 7000);
    return () => { clearTimeout(t1); clearInterval(timer); };
  }, [inView]);

  useEffect(() => {
    const heroEl = document.getElementById('home');

    const sectionObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setMascotVisible(true);
    }, { threshold: 0.05 });

    const heroObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setMascotVisible(false);
    }, { threshold: 0.1 });

    if (sectionRef.current) sectionObs.observe(sectionRef.current);
    if (heroEl) heroObs.observe(heroEl);

    return () => { sectionObs.disconnect(); heroObs.disconnect(); };
  }, [loading]);

  const COLORS = ['#9210f6','#610497','#7C3AED','#4F46E5','#9210f6','#610497','#7C3AED','#4F46E5','#9210f6','#610497'];

  return (
    <>
      <div className={`rg-sticky-mascot${mascotVisible ? ' visible' : ''}`}>
        <div className={`rg-mascot-bubble${bubbleShow ? ' show' : ''}`}>{MASCOT_MSGS[msgIdx]}</div>
        <img src="/mascot-b.webp" alt="Mascot" />
      </div>
      {loading || games.length === 0 ? null : (
    <section className={`rg-section${revealed ? ' rg-in' : ''}`} ref={sectionRef}>
      <p className="rg-kicker">Trending Now</p>
      <h2 className="rg-heading">Top Games This Week</h2>
      <p className="rg-sub">Play brand games from our partners — live & free</p>

      <div className="rg-track">
        {games.map((game, i) => (
          <div
            key={game.id}
            className="rg-item"
            style={{ animationDelay: `${i * 60}ms`, marginLeft: i === 0 ? 0 : i < 3 ? 36 : 24, marginTop: 28 }}
            onClick={() => window.open(`/play/${game.slug}/${game.client_slug}`, '_blank')}
          >
            <span className="rg-rank">{i + 1}</span>

            <div className="rg-card">
              {game.game_logo_url || game.bg_image_url ? (
                <img className="rg-card-img" src={game.game_logo_url || game.bg_image_url} alt={game.name} loading="lazy" />
              ) : (
                <div className="rg-card-img" style={{
                  background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}44, ${COLORS[(i+2) % COLORS.length]}22)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40
                }}>
                  🎮
                </div>
              )}
              <span className="rg-card-badge">{game.category || 'Quiz'}</span>
              <div className="rg-card-body">
                <div className="rg-card-name">{game.name}</div>
                <div className="rg-card-plays">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  {(game.play_count || 0).toLocaleString()} plays
                </div>
              </div>
              <div className="rg-card-overlay">
                <div className="rg-play-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#9210f6"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
      )}
    </>
  );
}

/* ─── REWARDS PROGRESS BAR — remounts per card to restart animation ─── */
function RewardProgressBar() {
  const ref = useRef(null);
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (ref.current) ref.current.classList.add('running');
      })
    );
    return () => cancelAnimationFrame(id);
  }, []);
  return <div ref={ref} className="rwc-card-progress" />;
}

/* ─── REWARDS CAROUSEL ─── */
function RewardsCarousel() {
  const N = REWARD_CARDS_DATA.length;
  const [current, setCurrent] = useState(0);
  const [progKey, setProgKey] = useState(0);
  const autoRef = useRef(null);
  const wrapRef = useRef(null);
  const [inView, setInView] = useState(false);

  /* Only auto-advance while on screen — the re-render + card transitions of a
     below-the-fold carousel burned main-thread time during load and idle. */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const getPos = useCallback((i) => {
    const diff = ((i - current) % N + N) % N;
    const nd   = diff > N / 2 ? diff - N : diff;
    if (nd === 0)  return 'center';
    if (nd === 1)  return 'right1';
    if (nd === 2)  return 'right2';
    if (nd === -1) return 'left1';
    if (nd === -2) return 'left2';
    return nd > 0 ? 'hiddenright' : 'hiddenleft';
  }, [current, N]);

  const goTo = useCallback((idx) => {
    setCurrent(((idx % N) + N) % N);
    setProgKey(k => k + 1);
  }, [N]);

  const startAuto = useCallback(() => {
    if (!inView) return;
    autoRef.current = setInterval(() => {
      setCurrent(c => { setProgKey(k => k + 1); return (c + 1) % N; });
    }, 3000);
  }, [N, inView]);

  const stopAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
  }, []);

  useEffect(() => {
    if (inView) { startAuto(); return () => stopAuto(); }
  }, [inView, startAuto, stopAuto]);

  return (
    <div ref={wrapRef} onMouseEnter={stopAuto} onMouseLeave={startAuto}>
      {/* Tags — active one tracks current card */}
      <div className="reward-tags-wrap">
        {REWARD_TAGS.map((tag, i) => (
          <span
            key={tag}
            className={`reward-tag${i === current ? ' rw-active' : ''}`}
            onClick={() => goTo(i)}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Carousel */}
      <div className="rwc-wrap">
        <div className="rwc-track">
          {REWARD_CARDS_DATA.map((card, i) => {
            const pos      = getPos(i);
            const isCenter = pos === 'center';
            return (
              <div
                key={i}
                className="rwc-card"
                data-pos={pos}
                onClick={() => !isCenter && goTo(i)}
                style={{ cursor: isCenter ? 'default' : 'none' }}
              >
                <span className="rwc-card-icon">{card.icon}</span>
                <div className="rwc-card-title">{card.title}</div>
                <div className="rwc-card-desc">{card.desc}</div>
                <div className="rwc-card-bar">
                  {isCenter && <RewardProgressBar key={progKey} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nav dots + arrows */}
      <div className="rwc-nav">
        <button className="rwc-btn" onClick={() => goTo(current - 1)}>‹</button>
        <div className="rwc-dots">
          {REWARD_CARDS_DATA.map((_, i) => (
            <button key={i} className={`rwc-dot${i === current ? ' active' : ''}`} onClick={() => goTo(i)} />
          ))}
        </div>
        <button className="rwc-btn" onClick={() => goTo(current + 1)}>›</button>
      </div>
    </div>
  );
}

/* ─── WHY-SECTION MASCOT SHOWCASE ───
   Cinematic portrait carousel for the "Why Audiences Love Promogames" section.
   Slides come from WHY_SLIDES (art lives in /public/mascot-showcase/). */
function MascotShowcase() {
  const N = WHY_SLIDES.length;
  const [current, setCurrent] = useState(0);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const autoRef = useRef(null);
  const resumeRef = useRef(null);
  const wrapRef = useRef(null);
  const frameRef = useRef(null);
  const parallaxRef = useRef(null);

  const next = useCallback(() => setCurrent(c => (c + 1) % N), [N]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + N) % N), [N]);

  /* Auto-advance every 5.5s while the section is on screen and not paused
     (hover/focus or recent manual interaction). Hidden tabs are skipped. */
  useEffect(() => {
    if (!inView || paused) return;
    autoRef.current = setInterval(() => { if (!document.hidden) next(); }, 5500);
    return () => clearInterval(autoRef.current);
  }, [inView, paused, next]);

  /* Only run while the carousel is actually near the viewport. */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* Manual interaction: pause autoplay, then quietly resume. */
  const pauseFor = useCallback((ms) => {
    setPaused(true);
    clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => setPaused(false), ms);
  }, []);
  useEffect(() => () => clearTimeout(resumeRef.current), []);

  /* Optional micro-parallax: the active image drifts a few px toward the
     cursor (fine pointers only). The card itself never tilts. */
  useEffect(() => {
    const el = frameRef.current;
    if (!el || window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e) => {
      if (parallaxRef.current) cancelAnimationFrame(parallaxRef.current);
      parallaxRef.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--px', `${(dx * 8).toFixed(1)}px`);
        el.style.setProperty('--py', `${(dy * 8).toFixed(1)}px`);
      });
    };
    const onLeave = () => {
      el.style.setProperty('--px', '0px');
      el.style.setProperty('--py', '0px');
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      if (parallaxRef.current) cancelAnimationFrame(parallaxRef.current);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      className="ms-wrap"
      ref={wrapRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="ms-frame" ref={frameRef}>
        {WHY_SLIDES.map((slide, i) => {
          const active = i === current;
          return (
            <div key={i} className={`ms-slide${active ? ' active' : ''}`} aria-hidden={!active}>
              <img
                src={slide.art}
                alt={`${slide.title} — Promogames mascot`}
                style={{ objectPosition: slide.pos }}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
              />
              <div className="ms-shade" aria-hidden="true" />
              <div className="ms-caption">
                <h3>{slide.title}</h3>
                <p>{slide.desc}</p>
              </div>
            </div>
          );
        })}

        <div className="ms-controls">
          <button
            className="ms-arrow"
            onClick={() => { prev(); pauseFor(10000); }}
            aria-label="Previous slide"
          >
            <SvgIcon name="arrow" size={16} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div className="ms-count">
            <span className="ms-count-cur">{String(current + 1).padStart(2, '0')}</span>
            <span className="ms-count-line" aria-hidden="true"><i style={{ transform: `scaleX(${(current + 1) / N})` }} /></span>
            <span className="ms-count-total">{String(N).padStart(2, '0')}</span>
          </div>
          <button
            className="ms-arrow"
            onClick={() => { next(); pauseFor(10000); }}
            aria-label="Next slide"
          >
            <SvgIcon name="arrow" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ────────────────────────────────── */

function AnimateBar({ pct, threshold = 0.3 }) {
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || done.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      done.current = true;
      obs.disconnect();
      el.style.transition = 'width 1.2s cubic-bezier(.22,1,.36,1)';
      el.style.width = `${pct}%`;
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [pct, threshold]);
  return <div className="lb-bar-wrap"><div className="lb-bar" ref={ref} style={{ width: 0 }} /></div>;
}

/* ═══════════════════════════════════════════════════════
   LIVE LEADERBOARD SIMULATION
   Frontend-only demo mode (`DEMO_LIVE_MODE`) that nudges scores on an
   irregular 3–7s cadence so the landing-page preview feels like a real,
   competitive board. All logic is self-contained here so it can later be
   swapped for real WebSocket/API updates without touching the UI below.
═══════════════════════════════════════════════════════ */
const DEMO_LIVE_MODE = true;
const LB_SIM_MIN_MS = 3000;
const LB_SIM_MAX_MS = 7000;

/* Weighted pick: usually 1 player, sometimes 2, rarely 3. */
function pickUpdateCount() {
  const r = Math.random();
  if (r < 0.72) return 1;
  if (r < 0.94) return 2;
  return 3;
}

/* Mostly small gains, occasionally a big one; rare small drops.
   Range intentionally matches the +50…+1,500 brief. */
function pickScoreDelta() {
  const r = Math.random();
  if (r < 0.06) return -(Math.floor(Math.random() * 3) + 1) * 25;      // −25…−75 (rare)
  if (r < 0.90) return (Math.floor(Math.random() * 16) + 1) * 50;      // +50…+800
  return (Math.floor(Math.random() * 6) + 1) * 250;                    // +250…+1500 (rare)
}

/* One simulation "tick": nudge a few scores and re-sort by score desc.
   Returns { list, moved } where moved is a Map(id → {dir, from, to}). */
function applyLbTick(players) {
  const count = Math.min(pickUpdateCount(), players.length);
  const pool = [...players];
  const bumped = new Set();
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const [p] = pool.splice(idx, 1);
    bumped.add(p.id);
  }
  const prevRankById = new Map(players.map((p, i) => [p.id, i + 1]));
  const list = players
    .map(p => bumped.has(p.id)
      ? { ...p, score: Math.max(0, p.score + pickScoreDelta()) }
      : p)
    .sort((a, b) => b.score - a.score);
  const moved = new Map();
  list.forEach((p, i) => {
    const from = prevRankById.get(p.id);
    if (from !== i + 1) moved.set(p.id, { dir: i + 1 < from ? 'up' : 'down', from, to: i + 1 });
  });
  return { list, moved };
}

/* Drives the simulation: schedules irregular ticks, pauses when the tab is
   hidden, and stops after mount when DEMO_LIVE_MODE is off. Returns the live
   list plus a per-tick `pulse` (bumped ids + rank changes + a nonce the UI
   uses to flash/glow). */
function useLiveLeaderboard(basePlayers) {
  const [players, setPlayers] = useState(basePlayers);
  const [pulse, setPulse] = useState(() => ({ bumped: [], moved: {}, nonce: 0 }));
  const timerRef = useRef(null);
  const playersRef = useRef(basePlayers);   // ref mirror so ticks never need an impure updater

  useEffect(() => {
    if (!DEMO_LIVE_MODE) return undefined;
    let alive = true;
    const schedule = (ms) => { timerRef.current = setTimeout(tick, ms); };
    function tick() {
      if (!alive) return;
      if (document.hidden) { schedule(2000); return; }   // pause in background tabs
      const prev = playersRef.current;
      const { list, moved } = applyLbTick(prev);
      playersRef.current = list;
      setPlayers(list);
      setPulse(p => ({ bumped: bumpedIds(list, prev), moved: Object.fromEntries(moved), nonce: p.nonce + 1 }));
      schedule(LB_SIM_MIN_MS + Math.random() * (LB_SIM_MAX_MS - LB_SIM_MIN_MS));
    }
    schedule(LB_SIM_MIN_MS + Math.random() * (LB_SIM_MAX_MS - LB_SIM_MIN_MS));
    return () => { alive = false; clearTimeout(timerRef.current); };
  }, []);

  return { players, pulse };
}
function bumpedIds(newList, prevList) {
  const prevById = new Map(prevList.map(p => [p.id, p.score]));
  return newList.filter(p => prevById.get(p.id) !== p.score).map(p => p.id);
}

/* Animated number that counts from the previous value to the new one over
   ~700ms when `value` changes (rather than snapping), and briefly flashes
   while doing so. First paint is instant; flash class is added/removed here
   (NOT via a remounting key, which would skip the count animation). */
function LiveScore({ value, nonce, className = '' }) {
  const prevRef = useRef(value);
  const rafRef = useRef(0);
  const flashTimerRef = useRef(0);
  const [display, setDisplay] = useState(() => value.toLocaleString());
  const [flash, setFlash] = useState(false);

  useLayoutEffect(() => {
    if (nonce === 0 || value === prevRef.current) return undefined;
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    const dur = 700;
    const t0 = performance.now();
    const easeOut = p => 1 - Math.pow(1 - p, 3);
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      setDisplay(Math.round(from + (to - from) * easeOut(p)).toLocaleString());
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    setFlash(true);
    flashTimerRef.current = setTimeout(() => setFlash(false), 600);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, nonce]);
  useEffect(() => () => clearTimeout(flashTimerRef.current), []);

  return <span className={`${className}${flash ? ' flash' : ''}`}>{display}</span>;
}

/* The landing-page leaderboard card, now with live simulation. Renders the
   exact same markup as before — motion.div adds layout (FLIP) animations so
   rows slide into their new rank instead of teleporting. */
const LB_ROW_SPRING = { type: 'spring', stiffness: 220, damping: 26 };
const LB_TABS = ['Top Scorers', 'This Month', 'All Time'];
function LiveLeaderboardCard({ basePlayers }) {
  const { players, pulse } = useLiveLeaderboard(basePlayers);
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState(LB_TABS[0]);
  /* Keep the board one-screen tall on desktop: only the top 5 render here.
     The live sim still runs on the full pool, so ranks inside the top 5 keep
     reshuffling as players below push up. */
  const visiblePlayers = players.slice(0, 5);
  const maxScore = players[0]?.score || 1;

  return (
    <>
      <div className="hw-lb-top">
        <div className="hw-lb-tabs">
          {LB_TABS.map(t => (
            <button key={t} type="button" className={`hw-lb-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <div className="hw-lb-live">
          <span key={pulse.nonce} className={`hw-lb-live-dot${pulse.nonce > 0 ? ' pulse' : ''}`} />
          Updated in real-time
        </div>
      </div>
      <div className="hw-lb-list">
        {visiblePlayers.map((p, i) => {
          const initials = p.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          const move = pulse.moved[p.id];
          const pct = maxScore > 0 ? Math.max(0, Math.min(100, Math.round((p.score / maxScore) * 100))) : 0;
          return (
            <motion.div
              key={p.id}
              layout
              transition={reduceMotion ? { duration: 0 } : LB_ROW_SPRING}
              className={`hw-lb-row${i < 3 ? ' top3' : ''}`}
            >
              <span className="hw-lb-rankwrap">
                <span className={`hw-lb-rank${i < 3 ? ` r${i + 1}` : ''}`}>{i + 1}</span>
                {move && (
                  <span key={pulse.nonce} className={`hw-lb-move ${move.dir}${i === 0 ? ' below' : ''}`} aria-hidden="true">
                    {move.dir === 'up' ? '↑' : '↓'} {move.from}→{move.to}
                  </span>
                )}
              </span>
              <div className="hw-lb-avatar" style={{ background: `linear-gradient(135deg,${p.avatarHue})` }}>
                {initials}
              </div>
              <span className="hw-lb-name">
                {p.name}
                {p.has_account && (
                  <span className="hw-lb-badge"><SvgIcon name="badgeCheck" size={9} /> ACCOUNT</span>
                )}
              </span>
              <LiveScore className="hw-lb-score" value={p.score} nonce={pulse.nonce} />
              <LiveBar pct={pct} />
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

/* Progress bar that fills on first reveal (IntersectionObserver) and then
   glides on every pct change (CSS width transition handles the glide). */
function LiveBar({ pct }) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || revealed) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      setRevealed(true);
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [revealed]);
  return (
    <div className="lb-bar-wrap">
      <div
        className="lb-bar"
        ref={ref}
        style={{ width: revealed ? `${pct}%` : 0, transition: 'width 600ms ease' }}
      />
    </div>
  );
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 641px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 641px)');
    const onChange = (e) => setIsDesktop(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return isDesktop;
}

/* Scrollytelling hero: the section pins at the top of the viewport and, as you
   scroll away, its content recedes (slides up, shrinks, fades) so the following
   content slides in over it — like a scroll-scrubbed exit. */
function HeroSection() {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const enabled = !reduceMotion;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "-14vh"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 1, 0.35]);
  const innerY = useTransform(scrollYProgress, [0, 1], ["0vh", "-9vh"]);

  return (
    <motion.section id="home" ref={ref} style={enabled ? { y, scale, opacity } : undefined}>
      <motion.div className="hero-inner" style={enabled ? { y: innerY } : undefined}>
        <div className="hero-left">
          <div className="hero-top">
            <div className="hero-eyebrow"><SvgIcon name="gamepad" size={14} /> Gaming That Rewards You</div>
            <h1 className="hero-h1">
              <HeroGlitchText text="QUICK GAMES" />
              <HeroGlitchText text="REAL REWARDS" accent delay={0.35} />
            </h1>
            <p className="hero-sub">
              Play exciting quick games, climb the leaderboard, and unlock real-time rewards every day.
            </p>
          </div>

          <div className="hero-bottom">
            <div className="hero-actions">
              <a href="/arcade" className="btn-primary">Start Playing <Arr /></a>
            </div>
            <div className="hero-stats">
              {STATS.map(({ val, label }) => (
                <div className="hst" key={label}>
                  <CountUp as="span" className="hst-n" value={val} />
                  <span className="hst-l">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}

export default function PromoGamesHome() {
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const minDelay = new Promise((resolve) => setTimeout(resolve, 2500));
    const imagePromises = Array.from(document.images).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          })
    );
    Promise.all([minDelay, ...imagePromises]).then(() => setPageReady(true));
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      document.documentElement.style.setProperty('--scroll-pct', `${pct * 100}%`);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Lenis smooth scroll + cinematic section snapping — the landing page reads
     as one section per screen on desktop. A single wheel flick from the hero is
     captured and carried smoothly to the next section; everywhere else, once a
     scroll settles near a section boundary (within 22% of the viewport), the
     page glides the rest of the way so each section fills one screen. Deliberate
     scrolls that stop mid-section are left alone, and the footer is never
     snapped back into view. (CSS scroll-snap is intentionally NOT used — it
     fights Lenis's animated scrolling.) */
  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 641px)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isDesktop || reduceMotion) return;

    let lenis;
    let rafId;
    let snapping = false;
    let snapTimer = null;
    let settleTimer = null;
    let destroyed = false;
    let onWheel = () => {};

    const SNAP_SELECTORS = '#home, .rg-section, #featured, #leaderboard-section, #rewards, #why, #testimonials, #reward-community, #cta-final';

    import('lenis').then(({ default: Lenis }) => {
      if (destroyed) return;

      lenis = new Lenis({
        lerp: 0.15,
        wheelMultiplier: 1,
        smoothWheel: true,
        easing: EASE_THEME,
      });

      const raf = (time) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      /* The wheel-glide and the proximity snap below are desktop-only. On phones
         and tablets the browser's own momentum scrolling is left in charge, so
         the page can never pull the viewport away from where the user is
         actually scrolling. Matches the navbar's own 1024px breakpoint. */
      const allowSnap =
        window.matchMedia('(min-width: 1025px)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!allowSnap) return;

      /* Hero → next section: while near the top, a downward wheel flick glides
         the whole way to the next section with Lenis easing. */
      onWheel = (e) => {
        if (snapping) return;
        if (e.deltaY > 0) {
          const vh = window.innerHeight;
          if (lenis.scroll < vh * 0.5) {
            const next = document.querySelector('.rg-section');
            if (next) {
              e.preventDefault();
              snapping = true;
              const top = window.scrollY + next.getBoundingClientRect().top;
              lenis.scrollTo(top, {
                duration: 1.3,
                easing: EASE_THEME,
              });
              clearTimeout(snapTimer);
              snapTimer = setTimeout(() => { snapping = false; }, 1600);
            }
          }
        }
      };

      /* Proximity snap: when the scroll settles near a section boundary, close
         the remaining distance so the section reads as one full screen. */
      const settleSnap = () => {
        if (snapping || !lenis) return;
        const vh = window.innerHeight;
        const doc = document.documentElement;
        if (window.scrollY + vh >= doc.scrollHeight - 4) return; /* footer zone */
        let best = null;
        let bestDist = Infinity;
        document.querySelectorAll(SNAP_SELECTORS).forEach(el => {
          const top = window.scrollY + el.getBoundingClientRect().top;
          const d = Math.abs(window.scrollY - top);
          if (d < bestDist) { bestDist = d; best = top; }
        });
        if (best !== null && bestDist > 4 && bestDist <= vh * 0.22) {
          snapping = true;
          lenis.scrollTo(best, { duration: 0.85, easing: EASE_THEME, force: true });
          clearTimeout(snapTimer);
          snapTimer = setTimeout(() => { snapping = false; }, 1200);
        }
      };
      const queueSettle = () => {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(settleSnap, 150);
      };
      lenis.on('scroll', queueSettle);

      window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    });

    return () => {
      destroyed = true;
      window.removeEventListener('wheel', onWheel, { capture: true });
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) lenis.destroy();
      if (snapTimer) clearTimeout(snapTimer);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, []);

  /* "Pick Your Challenge" play buttons — bind to live game slugs from the API
     so they always reach the real player pages (fallback: arcade). */
  const [challengeRoutes, setChallengeRoutes] = useState(() =>
    Object.fromEntries(CHALLENGE_GAMES.map(g => [g.title, CHALLENGE_FALLBACK]))
  );
  useEffect(() => {
    let cancelled = false;
    fetch('/api/play/play-page-games')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        const list = Array.isArray(d) ? d : (d?.games || []);
        const labels = (v) => String(v || '').toLowerCase();
        const routes = { ...challengeRoutes };
        CHALLENGE_GAMES.forEach(game => {
          const hit = list.find(g =>
            game.keywords.some(k =>
              labels(g.name).includes(k) || labels(g.category).includes(k) || labels(g.slug).includes(k)
            )
          );
          if (hit?.slug) {
            routes[game.title] = hit.client_slug
              ? `/play/${hit.slug}/${hit.client_slug}`
              : `/play/${hit.slug}`;
          }
        });
        setChallengeRoutes(routes);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) cancelled = true; });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* While the challenge section is on screen, fade the floating ranked-section
     mascot out so it can't sit in the section's open space. */
  useEffect(() => {
    const el = document.getElementById('featured');
    if (!el) return;
    const apply = (onScreen) => document.body.classList.toggle('rg-hide-mascot', onScreen);
    apply(false);
    const io = new IntersectionObserver(
      entries => apply(entries[0]?.isIntersecting),
      { threshold: 0.02 }
    );
    io.observe(el);
    return () => { io.disconnect(); document.body.classList.remove('rg-hide-mascot'); };
  }, []);

  if (!pageReady) {
    return <LogoLoader fullscreen size={96} />;
  }

  return (
    <>
      <div className="scroll-bar" />
      <MascotCursor />

      {/* ── NAV ── */}
      <PlayerNavbar />

      {/* ── HERO (scrollytelling — pins and recedes on scroll) ── */}
      <HeroSection />

      <div className="post-hero">
        <MarqueeStrip />
        <RankedGames />

      {/* ── PICK YOUR CHALLENGE ── */}
      <section id="featured" className="pyc-section">
        <div className="pyc-inner">
          <header className="pyc-head">
            <div className="pyc-head-left">
              <p className="pyc-head-kicker">Game Experiences</p>
              <h2 className="pyc-title">
                <span>Pick Your</span>
                <span className="pyc-title-accent">Challenge</span>
              </h2>
            </div>
            <p className="pyc-head-copy">
              Interactive games built to turn attention into participation.
            </p>
          </header>

          <div className="challenge-grid">
            <div className="featured-col">
              {(() => {
                const featured = CHALLENGE_GAMES.find(g => g.featured);
                return (
                  <Link
                    key={featured.title}
                    to={challengeRoutes[featured.title] || CHALLENGE_FALLBACK}
                    className="ch-card feat-card"
                    aria-label={`Play ${featured.title}`}
                  >
                    <div className="feat-top">
                      <span className="feat-num">{featured.num}</span>
                      <span className="feat-pill">Featured</span>
                    </div>
                    <div className="feat-artwrap">
                      <img
                        className="feat-art"
                        src={featured.art}
                        alt=""
                        width={featured.w}
                        height={featured.h}
                        style={{ objectPosition: featured.pos }}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="feat-body">
                      <h3 className="feat-name">{featured.title}</h3>
                      <p className="feat-desc">{featured.tagline}</p>
                      <span className="feat-btn" aria-hidden="true">
                        Play Now <Arr size={15} />
                      </span>
                    </div>
                  </Link>
                );
              })()}
            </div>

            <div className="right-grid">
              <div className="right-top">
                {CHALLENGE_GAMES.filter(g => !g.featured).slice(0, 2).map((game, i) => (
                  <Link
                    key={game.title}
                    to={challengeRoutes[game.title] || CHALLENGE_FALLBACK}
                    className="ch-card sm-card"
                    style={{ animationDelay: `${160 + i * 80}ms` }}
                    aria-label={`Play ${game.title}`}
                  >
                    <span className="sm-num">{game.num}</span>
                    <img
                      className="sm-art"
                      src={game.art}
                      alt=""
                      width={game.w}
                      height={game.h}
                      style={{ objectPosition: game.pos }}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="sm-body">
                      <h4 className="sm-name">{game.title}</h4>
                      <p className="sm-desc">{game.tagline}</p>
                      <span className="sm-btn" aria-hidden="true">
                        Play <Arr size={13} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="right-bottom">
                {CHALLENGE_GAMES.filter(g => !g.featured).slice(2, 5).map((game, i) => (
                  <Link
                    key={game.title}
                    to={challengeRoutes[game.title] || CHALLENGE_FALLBACK}
                    className="ch-card sm-card"
                    style={{ animationDelay: `${400 + i * 80}ms` }}
                    aria-label={`Play ${game.title}`}
                  >
                    <span className="sm-num">{game.num}</span>
                    <img
                      className="sm-art"
                      src={game.art}
                      alt=""
                      width={game.w}
                      height={game.h}
                      style={{ objectPosition: game.pos }}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="sm-body">
                      <h4 className="sm-name">{game.title}</h4>
                      <p className="sm-desc">{game.tagline}</p>
                      <span className="sm-btn" aria-hidden="true">
                        Play <Arr size={13} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS + LEADERBOARD (combined) ── */}
      <section id="leaderboard-section" className="hw-section">
        <div className="hw-inner">
          <header className="hw-head">
            <div className="hw-pill"><span className="hw-pill-dot" />HOW IT WORKS<span className="hw-pill-dot" /></div>
            <h2 className="hw-title">
              <span>PLAY.</span> <span className="hw-title-accent">SCORE.</span> <span>WIN.</span>
            </h2>
            <p className="hw-sub">Three simple steps stand between you and your next reward.</p>
          </header>

          <div className="hw-steps">
            {HOW_STEPS.map((s, i) => (
              <div className="hw-step" key={s.num} style={{ animationDelay: `${i * 90}ms` }}>
                <span className="hw-step-num" aria-hidden="true">{s.num}</span>
                <span className="hw-step-icon">{s.icon}</span>
                <div className="hw-step-body">
                  <h3 className="hw-step-title">{s.title}</h3>
                  <p className="hw-step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="hw-board">
            <div className="hw-board-center">
              {/* Live simulated leaderboard — same markup/styling as before,
                  plus score ticks + FLIP row animations (see LiveLeaderboardCard) */}
              <LiveLeaderboardCard basePlayers={DUMMY_LEADERBOARD} />
            </div>

            <div className="hw-board-right">
              <div className="hw-mascot-glow" aria-hidden="true" />
              {HW_MASCOT_ART ? (
                <img className="hw-mascot" src={HW_MASCOT_ART} alt="Promogames mascot celebrating with a trophy" />
              ) : (
                <div className="hw-mascot-scene" aria-hidden="true">
                  {[
                    { cls: 'hw-coin hw-coin-1' }, { cls: 'hw-coin hw-coin-2' },
                    { cls: 'hw-coin hw-coin-3' }, { cls: 'hw-coin hw-coin-4' },
                  ].map((c, i) => (
                    <span key={i} className={c.cls}>
                      <svg viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="22" fill="url(#hwCoinG)" />
                        <circle cx="24" cy="24" r="17" fill="none" stroke="#fff6d8" strokeWidth="2" opacity=".8" />
                        <text x="24" y="31" textAnchor="middle" fontFamily="Bebas Neue, sans-serif" fontSize="22" fill="#5c3a00">P</text>
                        <defs>
                          <radialGradient id="hwCoinG" cx="35%" cy="30%" r="80%">
                            <stop offset="0%" stopColor="#ffe98a" />
                            <stop offset="55%" stopColor="#f7c948" />
                            <stop offset="100%" stopColor="#c98a12" />
                          </radialGradient>
                        </defs>
                      </svg>
                    </span>
                  ))}
                  <span className="hw-crown" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="#f7c948"><path d="M2.5 8.5 7 12l5-6.5L17 12l4.5-3.5-1.6 9a2 2 0 0 1-2 1.7H6.1a2 2 0 0 1-2-1.7l-1.6-9Z" /></svg>
                  </span>
                  <span className="hw-trophy" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#f7c948" strokeWidth="1.6">
                      <path d="M8 21h8M12 17v4M6 3h12l-1 7a5 5 0 0 1-10 0L6 3zM6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3" />
                    </svg>
                  </span>
                  <span className="hw-rock hw-rock-1" aria-hidden="true" />
                  <span className="hw-rock hw-rock-2" aria-hidden="true" />
                  <span className="hw-mascot-mini" aria-hidden="true">
                    <img src="/mascot-b.webp" alt="" />
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── REWARDS (carousel) ── */}
      <section id="rewards">
        <div className="rewards-inner">
          <p className="section-kicker">Rewards</p>
          <h2 className="section-h2">Every Play Feels<br />Rewarding</h2>
          <p className="section-sub">
            Play games and unlock exciting gifts, cashback, coupons, exclusive offers, and surprise rewards.
          </p>
          <RewardsCarousel />
        </div>
      </section>

      {/* ── WHY AUDIENCES LOVE PROMOGAMES ── */}
      <section id="why">
        <div className="why-inner">
          <div className="why-left">
            <p className="why-eyebrow"><span className="why-eyebrow-line" aria-hidden="true" />PLAY • ENGAGE • REWARD</p>
            <h2 className="why-heading">
              WHY AUDIENCES<br />LOVE <span className="why-heading-accent">PROMOGAMES</span>
            </h2>
            <p className="why-support">
              Fast interactions, instant feedback, rewards, and fresh challenges keep every campaign engaging.
            </p>
            <div className="why-benefits">
              {WHY_BENEFITS.map(({ num, title, desc }) => (
                <div key={num} className="why-row">
                  <span className="why-row-num" aria-hidden="true">
                    <i />
                    {num}
                  </span>
                  <div className="why-row-body">
                    <h3 className="why-row-title">{title}</h3>
                    <p className="why-row-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="why-visual">
            <MascotShowcase />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials">
        <div className="testimonials-inner">
          <div className="testimonials-head">
            <p className="section-kicker">Player Stories</p>
            <h2 className="section-h2">Real Players.<br />Real Wins.</h2>
            <p className="section-sub">
              Don't just take our word for it — hear from players who've already started winning.
            </p>
          </div>
          <ScrollReelTestimonials
            testimonials={TESTIMONIALS}
            autoPlayMs={3000}
            loop
            desaturate={false}
          />
        </div>
      </section>

      {/* ── REWARD COMMUNITY (background-image banner) ── */}
      <section id="reward-community" aria-label="Daily Play and Community">
        <img
          className="rcm-background"
          src="/reward-community-bg.png"
          alt=""
          aria-hidden="true"
          draggable={false}
        />
        <div className="rcm-content">
          <div className="rcm-eyebrow">Play • Compete • Get Rewarded</div>
          <h2 className="rcm-heading">
            <span className="rcm-heading-top">A Treat You Can</span>
            <span className="rcm-heading-accent">Give Yourself</span>
          </h2>
          <p className="rcm-copy">
            Take a quick break, play your favourite games, and make every moment
            more exciting with rewards waiting to be unlocked.
          </p>
          <a href="/arcade" className="rcm-cta">
            Play Now
            <span className="rcm-cta-arrow"><Arr size={18} /></span>
          </a>
        </div>
        <div className="rcm-stats-panel">
          {RCM_STATS.map(({ icon, val, label }) => (
            <div key={label} className="rcm-stat">
              <span className="rcm-stat-icon"><SvgIcon name={icon} size={26} /></span>
              <CountUp as="div" className="rcm-stat-val" value={val} />
              <div className="rcm-stat-lbl">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section id="cta-final">
        <ArkanoidGame />
      </section>

      {/* ── MOBILE CTA BUTTONS ── */}
      <div className="mobile-cta-buttons">
        <a href="/arcade" className="btn-primary">Play Now <Arr /></a>
        <a href="/leaderboard" className="btn-ghost">Start Winning <Arr /></a>
      </div>

      {/* ── FOOTER ── */}
      <footer className="footer" id="contact">
        <div className="footer-main">
          <div>
            <p className="footer-tagline">Play Everyday. Win Everyday.</p>
            <img src="/favicon2.png" alt="Promogames" style={{ height: 48, width: 'auto', marginBottom: 12, borderRadius: 8 }} />
            <p className="footer-desc">
              Quick games, real rewards, and a leaderboard that keeps you coming back. Your reward journey starts here.
            </p>
            <div className="socials">
              {[
                { icon: "linkedin", href: "https://www.linkedin.com" },
                { icon: "instagram", href: "https://www.facebook.com/profile.php?id=61579982040453" },
                { icon: "twitter", href: "#" },
                { icon: "youtube", href: "#" },
                { icon: "instagram", href: "#" }
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="soc"><SvgIcon name={s.icon} size={18} /></a>
              ))}
            </div>
          </div>
          <div>
            <div className="footer-links-title">Quick Links</div>
            <div className="footer-links">
              {FOOTER_NAV.map(([label, href]) => (
                <a key={label} href={href}>{label}</a>
              ))}
              <a href="/company">Company</a>
            </div>
          </div>
          <div>
            <div className="footer-links-title">Get in Touch</div>
            <div className="footer-contact">
              <a href="tel:+916366870248" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><SvgIcon name="phone" size={16} /> +91 6366 870 248</a>
              <a href="mailto:play@promogames.in" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><SvgIcon name="mail" size={16} /> play@promogames.in</a>
            </div>
          </div>

        </div>
        <div className="footer-bar" style={{ width:'100%' }}>
          <p>© 2026 Promogames. Fun Games. Exciting Gifts.</p>
          <div style={{ display:'flex', gap:8 }}>
            <a href="/terms">Terms & Conditions</a><span>|</span><a href="/privacy">Privacy Policy</a>
          </div>
        </div>
      </footer>
      </div>

    </>
  );
}
