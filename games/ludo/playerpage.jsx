import { useState, useRef, useEffect, useReducer, useCallback } from "react";

/* ============================================================
   NOTE ON THIS PREVIEW
   ============================================================
   The original file imports `io` from "socket.io-client" to power
   the "Online" mode (create/join room over a Socket.io backend).
   This sandboxed artifact environment doesn't have a Socket.io
   backend to connect to, and socket.io-client isn't one of the
   preloaded libraries here, so that import is stubbed below with
   a no-op mock. "Pass & Play" and "Vs Bot" modes work exactly as
   written; "Online" mode will visually work up to entering/creating
   a room but won't actually connect to a real opponent.
   ============================================================ */
const io = () => ({
  connected: false,
  connect() {},
  disconnect() {},
  removeAllListeners() {},
  on() {},
  once() {},
  emit(event, payload, cb) {
    if (typeof cb === "function") cb({ error: "Online play isn't available in this preview." });
  },
});

/* ============================================================
   SVG Cartoon Avatars
   ============================================================ */
const SVGAvatar = ({ type }) => {
  const avatars = {
    boy1: (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <rect width="100" height="100" fill="#3b82f6" />
        <circle cx="50" cy="38" r="20" fill="#fcd34d" />
        <path d="M 30 75 C 30 55, 70 55, 70 75" fill="#1e40af" />
        <path d="M 32 32 Q 50 15 68 32 Q 50 25 32 32" fill="#1e3a8a" />
        <circle cx="43" cy="36" r="2.5" fill="#000" />
        <circle cx="57" cy="36" r="2.5" fill="#000" />
        <path d="M 45 46 Q 50 50 55 46" stroke="#000" strokeWidth="2" fill="none" />
      </svg>
    ),
    man1: (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <rect width="100" height="100" fill="#10b981" />
        <circle cx="50" cy="38" r="20" fill="#fed7aa" />
        <path d="M 28 78 C 28 55, 72 55, 72 78" fill="#065f46" />
        <path d="M 30 30 Q 50 10 70 30 L 70 20 L 30 20 Z" fill="#064e3b" />
        <circle cx="43" cy="36" r="2.5" fill="#000" />
        <circle cx="57" cy="36" r="2.5" fill="#000" />
        <path d="M 44 45 Q 50 49 56 45" stroke="#000" strokeWidth="2" fill="none" />
      </svg>
    ),
    man2: (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <rect width="100" height="100" fill="#f59e0b" />
        <circle cx="50" cy="38" r="20" fill="#fde68a" />
        <path d="M 28 78 C 28 55, 72 55, 72 78" fill="#78350f" />
        <circle cx="43" cy="36" r="2.5" fill="#000" />
        <circle cx="57" cy="36" r="2.5" fill="#000" />
        <path d="M 42 42 Q 50 38 58 42" stroke="#78350f" strokeWidth="3" fill="none" />
        <path d="M 45 48 Q 50 51 55 48" stroke="#000" strokeWidth="2" fill="none" />
      </svg>
    ),
    girl1: (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <rect width="100" height="100" fill="#ec4899" />
        <circle cx="50" cy="40" r="22" fill="#312e81" />
        <circle cx="50" cy="38" r="19" fill="#fbcfe8" />
        <path d="M 28 78 C 28 55, 72 55, 72 78" fill="#831843" />
        <circle cx="43" cy="36" r="2.5" fill="#000" />
        <circle cx="57" cy="36" r="2.5" fill="#000" />
        <path d="M 44 46 Q 50 51 56 46" stroke="#000" strokeWidth="2" fill="none" />
      </svg>
    ),
  };
  return avatars[type] || avatars.boy1;
};

const DiceDots = ({ count }) => {
  const dots = { 1:[4], 2:[0,8], 3:[0,4,8], 4:[0,2,6,8], 5:[0,2,4,6,8], 6:[0,2,3,5,6,8] };
  const active = dots[count] || [4];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gridTemplateRows:'repeat(3,1fr)', width:'100%', height:'100%' }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
          {active.includes(i) && <div style={{ width:6, height:6, background:'#fff', borderRadius:'50%', boxShadow:'inset 0 1px 1px rgba(0,0,0,0.4)' }} />}
        </div>
      ))}
    </div>
  );
};

/* ============================================================
   SVG Icons (replacing emojis)
   ============================================================ */
const IconSoundOn = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);
const IconSoundOff = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);
const IconSettings = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconTrophy = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);
const IconRefresh = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const IconDoor = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

function PlayerCard({ name, avatarType, color, accent, isRight, isActive, diceValue, isRolling, onClick }) {
  return (
    <div style={{ position:'relative', width:138, background:'rgba(15,23,42,0.75)', backdropFilter:'blur(12px)', border: isActive ? `1px solid ${accent}` : '1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'10px 12px', boxShadow: isActive ? `0 0 20px ${accent}55, 0 8px 32px rgba(0,0,0,0.5)` : '0 8px 32px rgba(0,0,0,0.37)', overflow:'hidden', cursor:'pointer', userSelect:'none', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', transition:'all 0.25s ease', transform: isActive ? 'translateY(-2px)' : 'none' }} onClick={isActive ? onClick : undefined}>
      <div style={{ position:'absolute', top:-30, left:-30, width:80, height:80, borderRadius:'50%', background:color, filter:'blur(25px)', opacity:0.15, pointerEvents:'none' }} />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', zIndex:2, flexDirection: isRight ? 'row-reverse' : 'row' }}>
        <div style={{ position:'relative', width:46, height:46, borderRadius:10, overflow:'hidden', border: isActive ? `2px solid ${accent}` : '2px solid rgba(255,255,255,0.2)', boxShadow:'0 4px 8px rgba(0,0,0,0.4)', flexShrink:0 }}>
          <SVGAvatar type={avatarType} />
          {isActive && <div style={{ position:'absolute', top:3, right:3, width:7, height:7, borderRadius:'50%', background:accent, boxShadow:`0 0 6px ${accent}` }} />}
        </div>
        <div style={{
          width:44, height:44,
          background: isRolling ? `linear-gradient(135deg, ${accent} 0%, ${color} 100%)` : `linear-gradient(135deg,${color},${color}cc)`,
          border: isRolling ? `2px solid ${accent}` : `1.5px solid ${accent}`,
          borderRadius:10, padding:5, boxSizing:'border-box',
          boxShadow: isRolling ? `0 0 12px ${accent}88, inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 10px rgba(0,0,0,0.3)` : 'inset 0 2px 4px rgba(255,255,255,0.4), 0 4px 10px rgba(0,0,0,0.3)',
          animation: isRolling ? 'diceShake 0.12s ease-in-out infinite' : 'none',
          transition: isRolling ? 'none' : 'transform 0.3s ease, box-shadow 0.3s ease',
        }}>
          <DiceDots count={diceValue} />
        </div>
      </div>
      <div style={{ marginTop:8, fontSize:11, fontWeight:700, color:'#f8fafc', letterSpacing:0.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', position:'relative', zIndex:2, textAlign: isRight ? 'right' : 'left' }}>{name}</div>
      <style>{`
        @keyframes diceShake {
          0% { transform: rotate(0deg) scale(1); }
          20% { transform: rotate(-12deg) scale(1.08); }
          40% { transform: rotate(10deg) scale(0.95); }
          60% { transform: rotate(-8deg) scale(1.05); }
          80% { transform: rotate(6deg) scale(0.98); }
          100% { transform: rotate(0deg) scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   Board geometry (module scope — pure constants, computed once)
   ============================================================ */
const TRACK = [
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [6,6],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],
  [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
  [6,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],
  [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
  [8,8],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],
  [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
  [8,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],
  [6,0],
];
const HOMECOLS = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  green:  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  yellow: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  blue:   [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
};
const TRACK_LEN = TRACK.length; // 56 — physical length of the shared outer loop
const START_OFFSET = { red: 0, green: 14, yellow: 28, blue: 42 };
const SAFE_IDX = [0, 9, 14, 23, 28, 37, 42, 51];
const START_IDX_COLOR = { 0: "red", 14: "green", 28: "yellow", 42: "blue" };

const SKIP_PHYSICAL_IDX = new Set([5, 19, 33, 47]); // visual-only tiles — never part of movement
const SKIP_PHYSICAL_IDX_RELATIVE_ARM = new Set([5, 19, 33, 47]);

const REL_OFFSETS = (() => {
  const arr = [];
  for (let r = 0; r <= 54; r++) if (!SKIP_PHYSICAL_IDX_RELATIVE_ARM.has(r)) arr.push(r);
  return arr;
})();

function physicalOffsetForLogicalStep(logicalStep) {
  return REL_OFFSETS[logicalStep];
}

function physicalTrackIdx(color, step) {
  return (START_OFFSET[color] + physicalOffsetForLogicalStep(step)) % TRACK_LEN;
}

const MAIN_STEPS = 51;
const HOME_STEPS = 6; // exactly 6 home-column moves

// The pawn must travel through exactly 5 cells of its own colored
// home column. It is FINISHED visually at the center finish area after the 6th home-column move.
// It does NOT move onto the center golden circle.
const WIN_STEP = MAIN_STEPS + HOME_STEPS - 1; // 56 — 57 total moves
// If the pawn is on main-track step 50 and rolls 6, it finishes after
// traversing the six home-column cells; the sixth pip has no board cell.
const BASESPOTS = {
  red:    [[1,1],[1,4],[4,1],[4,4]],
  green:  [[1,10],[1,13],[4,10],[4,13]],
  yellow: [[10,10],[10,13],[13,10],[13,13]],
  blue:   [[10,1],[10,4],[13,1],[13,4]],
};
const FINISH_OFFSET = { red: {x:-42,y:-42}, green: {x:42,y:-42}, yellow: {x:42,y:42}, blue: {x:-42,y:42} };
const JITTER = [{x:-9,y:-9},{x:9,y:-9},{x:-9,y:9},{x:9,y:9}];
const COLOR_HEX = { red: "#c0392f", green: "#1f7d55", yellow: "#d19a1f", blue: "#2b5ba0" };
const NAME = { red: "Red", green: "Green", yellow: "Yellow", blue: "Blue" };
const PIP_PATTERNS = { 1:[4], 2:[0,8], 3:[0,4,8], 4:[0,2,6,8], 5:[0,2,4,6,8], 6:[0,2,3,5,6,8] };

// Canvas photorealistic board colors
const CANVAS_COLORS = {
  red:    { hex: '#B71C1C', dark: '#5C0000', light: '#E53935', stroke: '#7F0000' },
  green:  { hex: '#1B5E20', dark: '#003300', light: '#4CAF50', stroke: '#0F380F' },
  yellow: { hex: '#E65100', dark: '#7F2800', light: '#FB8C00', stroke: '#501B00' },
  blue:   { hex: '#0D47A1', dark: '#002171', light: '#1E88E5', stroke: '#001040' }
};
const CANVAS_PLAYER_ORDER = ['red', 'green', 'yellow', 'blue'];

const AVATARS = {
  red:    "https://api.dicebear.com/9.x/lorelei/svg?seed=Felix&backgroundColor=ffd5dc",
  green:  "https://api.dicebear.com/9.x/lorelei/svg?seed=Aneka&backgroundColor=d1d4f9",
  yellow: "https://api.dicebear.com/9.x/lorelei/svg?seed=Milo&backgroundColor=fff3c4",
  blue:   "https://api.dicebear.com/9.x/lorelei/svg?seed=Jasper&backgroundColor=c0eafe",
};
const BOT_AVATARS = {
  red:    "https://api.dicebear.com/9.x/bottts/svg?seed=LudoBot1&backgroundColor=ffd5dc",
  green:  "https://api.dicebear.com/9.x/bottts/svg?seed=LudoBot2&backgroundColor=d1d4f9",
  yellow: "https://api.dicebear.com/9.x/bottts/svg?seed=LudoBot3&backgroundColor=fff3c4",
  blue:   "https://api.dicebear.com/9.x/bottts/svg?seed=LudoBot4&backgroundColor=c0eafe",
};
const DICE_POS = {
  red:    { bottom: "calc(100% + 8px)", right: "calc(100% + 8px)" },
  green:  { bottom: "calc(100% + 8px)", left: "calc(100% + 8px)" },
  yellow: { top: "calc(100% + 8px)", left: "calc(100% + 8px)" },
  blue:   { top: "calc(100% + 8px)", right: "calc(100% + 8px)" },
};

function buildBoardMap() {
  const map = {};
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
    const isInner = r >= 1 && r <= 4 && c >= 1 && c <= 4;
    map[`${r},${c}`] = isInner ? { type: "yard-inner", color: "red" } : { type: "yard", color: "red" };
  }
  for (let r = 0; r < 6; r++) for (let c = 9; c < 15; c++) {
    const isInner = r >= 1 && r <= 4 && c >= 10 && c <= 13;
    map[`${r},${c}`] = isInner ? { type: "yard-inner", color: "green" } : { type: "yard", color: "green" };
  }
  for (let r = 9; r < 15; r++) for (let c = 9; c < 15; c++) {
    const isInner = r >= 10 && r <= 13 && c >= 10 && c <= 13;
    map[`${r},${c}`] = isInner ? { type: "yard-inner", color: "yellow" } : { type: "yard", color: "yellow" };
  }
  for (let r = 9; r < 15; r++) for (let c = 0; c < 6; c++) {
    const isInner = r >= 10 && r <= 13 && c >= 1 && c <= 4;
    map[`${r},${c}`] = isInner ? { type: "yard-inner", color: "blue" } : { type: "yard", color: "blue" };
  }
  TRACK.forEach((p, i) => {
    map[`${p[0]},${p[1]}`] = { type: "track", idx: i, safe: SAFE_IDX.includes(i), start: START_IDX_COLOR[i] || null };
  });
  Object.keys(HOMECOLS).forEach((color) => {
    HOMECOLS[color].forEach((p) => { map[`${p[0]},${p[1]}`] = { type: "homecol", color }; });
  });
  map["7,7"] = { type: "center" };
  return map;
}
const BOARD_MAP = buildBoardMap();
const BASESPOT_KEYS = new Set(Object.values(BASESPOTS).flat().map((p) => `${p[0]},${p[1]}`));

const BOARD_CELLS = [];
for (let r = 0; r < 15; r++) {
  for (let c = 0; c < 15; c++) {
    const info = BOARD_MAP[`${r},${c}`];
    const classes = ["cell"];
    if (info) {
      if (info.type === "yard") {
        classes.push("yard", `yard-${info.color}`);
        if (BASESPOT_KEYS.has(`${r},${c}`)) classes.push("basespot");
      } else if (info.type === "yard-inner") {
        classes.push("yard-inner");
        if (BASESPOT_KEYS.has(`${r},${c}`)) classes.push("basespot", `basespot-${info.color}`);
      } else if (info.type === "track") {
        classes.push("track");
        if (info.safe) classes.push("safe");
        if (info.start) classes.push(`start-${info.start}`);
      } else if (info.type === "homecol") {
        classes.push(`homecol-${info.color}`);
      } else if (info.type === "center") {
        classes.push("center");
      }
    }
    BOARD_CELLS.push({ r, c, className: classes.join(" ") });
  }
}

function cellForToken(color, tokenIdx, step) {
  if (step === -1) return BASESPOTS[color][tokenIdx];

  // The pawn uses exactly 6 home-column moves, but when the 5th
  // home move completes, visually place the finished pawn at the
  // center finish area (the triangle/center shown in the reference).
  if (step === WIN_STEP) {
    // Keep the finished pawn in its own colored home area.
    // Do NOT place it on the center golden circle.
    return HOMECOLS[color][HOME_STEPS - 1];
  }

  if (step < MAIN_STEPS) return TRACK[physicalTrackIdx(color, step)];

  return HOMECOLS[color][step - MAIN_STEPS];
}

function getMovable(player, dice) {
  const list = [];
  player.tokens.forEach((tok, idx) => {
    if (tok.step === -1) {
      if (dice === 6) list.push(idx);
    } else if (tok.step >= 0 && tok.step < WIN_STEP) {
      const requestedStep = tok.step + dice;

      // Normally the dice must land on or before the finish.
      // Exception: from the final main-track cell, a 6 reaches the
      // six home-column cells and finishes there (the extra pip has
      // no separate board cell).
      if (
        requestedStep <= WIN_STEP ||
        (tok.step === MAIN_STEPS - 1 && dice === 6)
      ) {
        list.push(idx);
      }
    }
  });
  return list;
}

function colorsForCount(n) {
  if (n === 2) return ["red", "yellow"];
  if (n === 3) return ["red", "green", "yellow"];
  return ["red", "green", "yellow", "blue"];
}

const PLAYER_META = {
  red:    { label: "P1 (RED)",    avatarType: "boy1",  color: "#B71C1C", accent: "#E53935" },
  green:  { label: "P2 (GREEN)",  avatarType: "girl1", color: "#1B5E20", accent: "#4CAF50" },
  yellow: { label: "P3 (YELLOW)", avatarType: "man2",  color: "#E65100", accent: "#FB8C00" },
  blue:   { label: "P4 (BLUE)",   avatarType: "man1",  color: "#0D47A1", accent: "#1E88E5" },
};

// The board's home yards are FIXED (see buildBoardMap): red = top-left,
// green = top-right, blue = bottom-left, yellow = bottom-right. Every
// player's dice/avatar card must sit in that same corner as their own
// yard — never guessed by player count — so a color's dice is always
// directly next to that color's own home base, in every mode (2/3/4
// player and vs-bot).
function getCardLayout(players) {
  const has = (c) => players.some((p) => p.color === c);
  return {
    top: [has("red") ? "red" : null, has("green") ? "green" : null],
    bottom: [has("blue") ? "blue" : null, has("yellow") ? "yellow" : null],
  };
}

/* ---- bot AI helpers ---- */
function wouldCapture(gs, pIdx, tIdx) {
  const player = gs.players[pIdx];
  const tok = player.tokens[tIdx];
  const dice = gs.dice;
  const newStep = tok.step === -1 ? 0 : tok.step + dice;
  if (newStep > MAIN_STEPS - 1) return false;
  const cellIdx = physicalTrackIdx(player.color, newStep);
  if (SAFE_IDX.includes(cellIdx)) return false;
  const stackCounts = {};
  gs.players.forEach((op, opIdx) => {
    if (opIdx === pIdx) return;
    op.tokens.forEach((ot) => {
      if (ot.step >= 0 && ot.step <= MAIN_STEPS - 1 && physicalTrackIdx(op.color, ot.step) === cellIdx) {
        stackCounts[op.color] = (stackCounts[op.color] || 0) + 1;
      }
    });
  });
  return gs.players.some((op, opIdx) => opIdx !== pIdx && (stackCounts[op.color] || 0) < 2 && op.tokens.some((ot) =>
    ot.step >= 0 && ot.step <= MAIN_STEPS - 1 && physicalTrackIdx(op.color, ot.step) === cellIdx
  ));
}

function chooseBotMove(gs, pIdx, difficulty) {
  const movable = gs.movable;
  if (movable.length === 1) return movable[0];
  const player = gs.players[pIdx];

  if (difficulty === "easy") {
    return movable[Math.floor(Math.random() * movable.length)];
  }

  const captureIdx = movable.find((tIdx) => wouldCapture(gs, pIdx, tIdx));
  if (captureIdx !== undefined && (difficulty === "hard" || Math.random() < 0.8)) return captureIdx;

  if (difficulty === "hard") {
    const homeIdx = movable.find((tIdx) => {
      const tok = player.tokens[tIdx];
      const nextStep = tok.step === -1 ? 0 : tok.step + gs.dice;
      return (
        nextStep === WIN_STEP ||
        (tok.step === MAIN_STEPS - 1 && gs.dice === 6 && nextStep === WIN_STEP + 1)
      );
    });
    if (homeIdx !== undefined) return homeIdx;

    const safeIdx = movable.find((tIdx) => {
      const tok = player.tokens[tIdx];
      const newStep = tok.step === -1 ? 0 : tok.step + gs.dice;
      if (newStep > MAIN_STEPS - 1) return false;
      return SAFE_IDX.includes(physicalTrackIdx(player.color, newStep));
    });
    if (safeIdx !== undefined) return safeIdx;

    if (gs.dice === 6) {
      const outIdx = movable.find((tIdx) => player.tokens[tIdx].step === -1);
      if (outIdx !== undefined) return outIdx;
    }

    let best = movable[0], bestStep = player.tokens[best].step;
    movable.forEach((tIdx) => {
      const step = player.tokens[tIdx].step;
      if (step > bestStep) { bestStep = step; best = tIdx; }
    });
    return best;
  }

  if (gs.dice === 6) {
    const outIdx = movable.find((tIdx) => player.tokens[tIdx].step === -1);
    if (outIdx !== undefined && Math.random() < 0.7) return outIdx;
  }

  if (Math.random() < 0.25) {
    return movable[Math.floor(Math.random() * movable.length)];
  }

  const safeNormal = movable.filter((tIdx) => {
    const tok = player.tokens[tIdx];
    const newStep = tok.step === -1 ? 0 : tok.step + gs.dice;
    if (newStep > MAIN_STEPS - 1) return false;
    return SAFE_IDX.includes(physicalTrackIdx(player.color, newStep));
  });
  if (safeNormal.length > 0 && Math.random() < 0.6) {
    return safeNormal[Math.floor(Math.random() * safeNormal.length)];
  }

  let best = movable[0], bestStep = player.tokens[best].step;
  movable.forEach((tIdx) => {
    const step = player.tokens[tIdx].step;
    if (step > bestStep) { bestStep = step; best = tIdx; }
  });
  return best;
}

/* ============================================================
   Sound engine — synthesized with Web Audio API (no external
   assets), plus a matching haptics helper.
   ============================================================ */
let _actx = null;
let _masterGain = null;
function getAudioCtx() {
  try {
    if (!_actx) {
      _actx = new (window.AudioContext || window.webkitAudioContext)();
      _masterGain = _actx.createGain();
      _masterGain.gain.value = 1;
      _masterGain.connect(_actx.destination);
    }
    if (_actx.state === "suspended") _actx.resume();
    return _actx;
  } catch (e) { return null; }
}
function voice(ctx, t0, { freq, type = "sine", vol = 0.2, dur = 0.15, attack = 0.006, decay = null, sweep = null, detune = 0 }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.detune.value = detune;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweep) osc.frequency.exponentialRampToValueAtTime(sweep, t0 + dur);
  const d = decay ?? dur;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(vol, 0.001), t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + d);
  osc.connect(gain).connect(_masterGain);
  osc.start(t0);
  osc.stop(t0 + attack + d + 0.05);
}
function noiseBurst(ctx, t0, { dur = 0.05, vol = 0.2, filterType = "bandpass", freq = 1400, q = 1.1, decayCurve = "exponential" }) {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(freq, t0);
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t0);
  if (decayCurve === "exponential") gain.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  else gain.gain.linearRampToValueAtTime(0, t0 + dur);
  src.connect(filter).connect(gain).connect(_masterGain);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}
const rnd = (a, b) => a + Math.random() * (b - a);

/* ============================================================
   Vs-Bot win-rate bias
   ============================================================
   In "Vs Bot" (topMode === "computer") games only, dice rolls are
   drawn from a weighted distribution instead of a flat 1-in-6 each,
   so that across many games the human comes out ahead roughly 70%
   of the time and the bot roughly 30% — matching the requested
   target. This nudges the ODDS on every roll; it can't force any
   single game's outcome, so any one match can still go either way,
   the same way a biased coin can still land tails.
   Human rolls skew toward higher values (more 5s/6s → more exits
   and extra turns). Bot rolls skew toward lower values. Weights
   were chosen empirically to land near a 70/30 split over many
   simulated games; they're not derived from a closed-form formula.
   ============================================================ */
const HUMAN_DIE_WEIGHTS = [0.12, 0.13, 0.15, 0.17, 0.19, 0.24]; // favors 5s/6s
const BOT_DIE_WEIGHTS   = [0.22, 0.19, 0.17, 0.15, 0.14, 0.13]; // favors 1s/2s
function weightedDie(weights) {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < 6; i++) {
    cum += weights[i];
    if (r <= cum) return i + 1;
  }
  return 6;
}
function rollDieFor(isBotTurn, biasActive) {
  if (!biasActive) return 1 + Math.floor(Math.random() * 6);
  return weightedDie(isBotTurn ? BOT_DIE_WEIGHTS : HUMAN_DIE_WEIGHTS);
}

const sfx = {
  diceTick: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    const t0 = ctx.currentTime;
    noiseBurst(ctx, t0, { dur: 0.05, vol: 0.16, freq: rnd(1600, 2600), q: 2.2 });
    voice(ctx, t0, { freq: rnd(900, 1300), type: "square", vol: 0.05, dur: 0.02, attack: 0.001 });
  },
  diceLand: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    const t0 = ctx.currentTime;
    noiseBurst(ctx, t0, { dur: 0.09, vol: 0.22, freq: 700, q: 1.4 });
    voice(ctx, t0, { freq: 180, type: "triangle", vol: 0.16, dur: 0.1, sweep: 90, attack: 0.002 });
    voice(ctx, t0 + 0.015, { freq: 340, type: "sine", vol: 0.08, dur: 0.06, attack: 0.002 });
  },
  hop: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    const t0 = ctx.currentTime;
    const base = rnd(430, 470);
    voice(ctx, t0, { freq: base, type: "sine", vol: 0.15, dur: 0.09, sweep: base * 1.6, attack: 0.004, detune: -6 });
    voice(ctx, t0, { freq: base * 2, type: "sine", vol: 0.05, dur: 0.06, sweep: base * 2.4, attack: 0.004, detune: 6 });
  },
  capture: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    const t0 = ctx.currentTime;
    noiseBurst(ctx, t0, { dur: 0.1, vol: 0.2, freq: 550, q: 0.9 });
    voice(ctx, t0, { freq: 460, type: "sawtooth", vol: 0.14, dur: 0.2, sweep: 85, attack: 0.003 });
    voice(ctx, t0 + 0.03, { freq: 220, type: "square", vol: 0.09, dur: 0.14, sweep: 60, attack: 0.002 });
  },
  home: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    const t0 = ctx.currentTime;
    voice(ctx, t0, { freq: 587, type: "triangle", vol: 0.17, dur: 0.32, decay: 0.32, attack: 0.005 });
    voice(ctx, t0, { freq: 880, type: "sine", vol: 0.09, dur: 0.28, decay: 0.28, attack: 0.005 });
    voice(ctx, t0 + 0.11, { freq: 988, type: "triangle", vol: 0.14, dur: 0.3, decay: 0.3, attack: 0.006 });
  },
  win: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const t0 = ctx.currentTime + i * 0.14;
      voice(ctx, t0, { freq: f, type: "triangle", vol: 0.19, dur: 0.26, decay: 0.26, attack: 0.006 });
      voice(ctx, t0, { freq: f * 2, type: "sine", vol: 0.06, dur: 0.2, decay: 0.2, attack: 0.006 });
    });
  },
  tap: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    const t0 = ctx.currentTime;
    noiseBurst(ctx, t0, { dur: 0.03, vol: 0.12, freq: 2400, q: 3 });
  },
};
function buzz(pattern) {
  try { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
}

/* ============================================================
   Canvas photorealistic board renderer
   ============================================================ */
function drawLudoBoard(canvas, gs) {
  if (!canvas || !gs) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const innerMargin = 60;
  const bedMargin = innerMargin + 12;
  const bedSize = W - bedMargin * 2;
  const gridStep = bedSize / 15;

  const frameGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.7);
  frameGrad.addColorStop(0, '#5A351D');
  frameGrad.addColorStop(0.7, '#3A1E0E');
  frameGrad.addColorStop(1, '#1A0C05');
  ctx.fillStyle = frameGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#2A1408';
  ctx.beginPath();
  ctx.roundRect(innerMargin, innerMargin, bedSize, bedSize, 28);
  ctx.fill();
  ctx.restore();

  const parchmentGrad = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, bedSize / 2);
  parchmentGrad.addColorStop(0, '#FAF6EE');
  parchmentGrad.addColorStop(0.8, '#E8DFC8');
  parchmentGrad.addColorStop(1, '#D0C2A0');
  ctx.fillStyle = parchmentGrad;
  ctx.beginPath();
  ctx.roundRect(bedMargin, bedMargin, bedSize, bedSize, 16);
  ctx.fill();
  ctx.save();
  ctx.strokeStyle = 'rgba(60, 30, 10, 0.5)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();

  const quadSize = bedSize * 0.4;
  const homeSlotCoords = { red: [], green: [], yellow: [], blue: [] };
  const drawHomeBase = (x, y, colorKey) => {
    const color = CANVAS_COLORS[colorKey];
    ctx.fillStyle = color.dark;
    ctx.fillRect(x, y, quadSize, quadSize);
    const matPadding = 16;
    const matX = x + matPadding;
    const matY = y + matPadding;
    const matSize = quadSize - matPadding * 2;
    const feltGrad = ctx.createLinearGradient(matX, matY, matX + matSize, matY + matSize);
    feltGrad.addColorStop(0, color.light);
    feltGrad.addColorStop(0.5, color.hex);
    feltGrad.addColorStop(1, color.dark);
    ctx.fillStyle = feltGrad;
    ctx.beginPath();
    ctx.roundRect(matX, matY, matSize, matSize, 12);
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.stroke();
    const cornerSize = 22;
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath(); ctx.moveTo(matX, matY); ctx.lineTo(matX + cornerSize, matY); ctx.lineTo(matX, matY + cornerSize); ctx.fill();
    ctx.beginPath(); ctx.moveTo(matX + matSize, matY); ctx.lineTo(matX + matSize - cornerSize, matY); ctx.lineTo(matX + matSize, matY + cornerSize); ctx.fill();
    ctx.beginPath(); ctx.moveTo(matX, matY + matSize); ctx.lineTo(matX + cornerSize, matY + matSize); ctx.lineTo(matX, matY + matSize - cornerSize); ctx.fill();
    ctx.beginPath(); ctx.moveTo(matX + matSize, matY + matSize); ctx.lineTo(matX + matSize - cornerSize, matY + matSize); ctx.lineTo(matX + matSize, matY + matSize - cornerSize); ctx.fill();
    const slotCenters = [
      [matX + matSize * 0.3, matY + matSize * 0.3],
      [matX + matSize * 0.7, matY + matSize * 0.3],
      [matX + matSize * 0.3, matY + matSize * 0.7],
      [matX + matSize * 0.7, matY + matSize * 0.7]
    ];
    slotCenters.forEach(([cx, cy]) => {
      homeSlotCoords[colorKey].push({ cx, cy });
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.strokeStyle = '#AA7C11';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });
  };
  drawHomeBase(bedMargin, bedMargin, 'red');
  drawHomeBase(bedMargin + bedSize - quadSize, bedMargin, 'green');
  drawHomeBase(bedMargin + bedSize - quadSize, bedMargin + bedSize - quadSize, 'yellow');
  drawHomeBase(bedMargin, bedMargin + bedSize - quadSize, 'blue');

  const SAFE_TILES = [[6,1],[2,6],[1,8],[6,12],[8,13],[12,8],[13,6],[8,2]];
  const drawStar = (cx, cy, spikes = 5, outerRadius = 12, innerRadius = 5) => {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y); rot += step;
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y); rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    const starGrad = ctx.createLinearGradient(cx - outerRadius, cy - outerRadius, cx + outerRadius, cy + outerRadius);
    starGrad.addColorStop(0, '#FFE57F');
    starGrad.addColorStop(0.5, '#D4AF37');
    starGrad.addColorStop(1, '#8A640F');
    ctx.fillStyle = starGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.strokeStyle = '#5A351D';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  };
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if ((r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8) || (r >= 6 && r <= 8 && c >= 6 && c <= 8)) continue;
      const tx = bedMargin + c * gridStep;
      const ty = bedMargin + r * gridStep;
      let tileColor = '#FDFBF7';
      if (r === 7 && c >= 1 && c <= 5) tileColor = CANVAS_COLORS.red.hex;
      if (c === 7 && r >= 1 && r <= 5) tileColor = CANVAS_COLORS.green.hex;
      if (r === 7 && c >= 9 && c <= 13) tileColor = CANVAS_COLORS.yellow.hex;
      if (c === 7 && r >= 9 && r <= 13) tileColor = CANVAS_COLORS.blue.hex;
      if (r === 6 && c === 1) tileColor = CANVAS_COLORS.red.hex;
      if (r === 1 && c === 8) tileColor = CANVAS_COLORS.green.hex;
      if (r === 8 && c === 13) tileColor = CANVAS_COLORS.yellow.hex;
      if (r === 13 && c === 6) tileColor = CANVAS_COLORS.blue.hex;
      ctx.fillStyle = tileColor;
      ctx.fillRect(tx, ty, gridStep, gridStep);
      ctx.strokeStyle = 'rgba(120, 100, 80, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tx, ty, gridStep, gridStep);
      if (SAFE_TILES.some(([sr, sc]) => sr === r && sc === c)) drawStar(tx + gridStep / 2, ty + gridStep / 2);
    }
  }

  const centerX = bedMargin + 7.5 * gridStep;
  const centerY = bedMargin + 7.5 * gridStep;
  const triOffset = 1.5 * gridStep;
  const drawCenterTri = (p1, p2, color) => {
    ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.closePath();
    ctx.fillStyle = color.hex; ctx.fill(); ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 2.5; ctx.stroke();
  };
  drawCenterTri([centerX - triOffset, centerY - triOffset], [centerX + triOffset, centerY - triOffset], CANVAS_COLORS.green);
  drawCenterTri([centerX + triOffset, centerY - triOffset], [centerX + triOffset, centerY + triOffset], CANVAS_COLORS.yellow);
  drawCenterTri([centerX - triOffset, centerY + triOffset], [centerX + triOffset, centerY + triOffset], CANVAS_COLORS.blue);
  drawCenterTri([centerX - triOffset, centerY - triOffset], [centerX - triOffset, centerY + triOffset], CANVAS_COLORS.red);
  ctx.beginPath(); ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
  const centerGrad = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, 20);
  centerGrad.addColorStop(0, '#FFE57F'); centerGrad.addColorStop(0.7, '#D4AF37'); centerGrad.addColorStop(1, '#8A640F');
  ctx.fillStyle = centerGrad; ctx.fill(); ctx.strokeStyle = '#3D2012'; ctx.lineWidth = 2; ctx.stroke();

  const drawRealPawn = (px, py, colorKey, isMovable = false) => {
    const color = CANVAS_COLORS[colorKey];
    ctx.save();
    if (isMovable) {
      ctx.beginPath(); ctx.arc(px, py + 4, 28, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(255,255,255,0.6)'; ctx.shadowBlur = 12;
      ctx.stroke(); ctx.shadowBlur = 0;
    }
    ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = 14; ctx.shadowOffsetX = -4; ctx.shadowOffsetY = 10;
    ctx.beginPath(); ctx.ellipse(px, py + 12, 16, 7, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
    ctx.restore();
    ctx.save();
    const pawnGrad = ctx.createLinearGradient(px - 14, py - 20, px + 14, py + 12);
    pawnGrad.addColorStop(0, color.light); pawnGrad.addColorStop(0.4, color.hex); pawnGrad.addColorStop(1, color.dark);
    const goldGrad = ctx.createLinearGradient(px - 16, py - 20, px + 16, py + 12);
    goldGrad.addColorStop(0, '#FFE57F'); goldGrad.addColorStop(0.5, '#D4AF37'); goldGrad.addColorStop(1, '#7A5200');
    ctx.beginPath(); ctx.ellipse(px, py + 10, 17, 7, 0, 0, Math.PI * 2); ctx.fillStyle = goldGrad; ctx.fill(); ctx.strokeStyle = '#4A2E0B'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(px, py + 8, 15, 6, 0, 0, Math.PI * 2); ctx.fillStyle = pawnGrad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(px - 14, py + 8); ctx.bezierCurveTo(px - 10, py - 4, px - 7, py - 10, px - 6, py - 12);
    ctx.lineTo(px + 6, py - 12); ctx.bezierCurveTo(px + 7, py - 10, px + 10, py - 4, px + 14, py + 8);
    ctx.closePath(); ctx.fillStyle = pawnGrad; ctx.fill(); ctx.strokeStyle = color.stroke; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px - 8, py + 6); ctx.bezierCurveTo(px - 6, py, px - 4, py - 6, px - 3, py - 11);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(px, py - 12, 8, 3.5, 0, 0, Math.PI * 2); ctx.fillStyle = goldGrad; ctx.fill(); ctx.strokeStyle = '#4A2E0B'; ctx.lineWidth = 1; ctx.stroke();
    const headY = py - 20, headRadius = 10;
    ctx.beginPath(); ctx.arc(px, headY, headRadius, 0, Math.PI * 2);
    const headGrad = ctx.createRadialGradient(px - 3, headY - 4, 1, px, headY, headRadius);
    headGrad.addColorStop(0, '#FFFFFF'); headGrad.addColorStop(0.2, color.light); headGrad.addColorStop(0.7, color.hex); headGrad.addColorStop(1, color.dark);
    ctx.fillStyle = headGrad; ctx.fill(); ctx.strokeStyle = color.stroke; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(px - 3, headY - 4, 2.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
    ctx.restore();
  };

  const currentColor = gs.players[gs.current]?.color;

  // Collect every token's raw pixel position first, so tokens sharing a
  // cell (home slot / win / same track or home-column square) can be
  // detected and given a small stagger offset — otherwise they draw
  // exactly on top of one another and only the last one is visible.
  const placements = [];
  gs.players.forEach((player) => {
    player.tokens.forEach((tok, tIdx) => {
      let px, py, special = false;
      if (tok.step === -1) {
        const slot = homeSlotCoords[player.color]?.[tIdx];
        if (!slot) return;
        px = slot.cx; py = slot.cy; special = true; // base slots never overlap
      } else {
        // WIN_STEP resolves to the last cell of the player's colored
        // home column. Finished pawns stay in that column.
        const [gr, gc] = cellForToken(player.color, tIdx, tok.step);
        px = bedMargin + gc * gridStep + gridStep / 2;
        py = bedMargin + gr * gridStep + gridStep / 2;
      }
      placements.push({ player, tIdx, px, py, special });
    });
  });

  // Group tokens that land on the exact same cell (on-track or home-column).
  const groups = {};
  placements.forEach((p, i) => {
    if (!p.special) {
      const key = `${Math.round(p.px)},${Math.round(p.py)}`;
      (groups[key] = groups[key] || []).push(i);
    }
  });

  // Diagonal stagger so 2+ overlapping pawns read as a fused cluster
  // (the "heart" overlap look) instead of hiding each other completely.
  const STACK_OFFSETS = {
    2: [{ x: -10, y: -8 }, { x: 10, y: 8 }],
    3: [{ x: -12, y: -10 }, { x: 12, y: -10 }, { x: 0, y: 12 }],
    4: [{ x: -12, y: -12 }, { x: 12, y: -12 }, { x: -12, y: 12 }, { x: 12, y: 12 }],
  };

  placements.forEach((p, i) => {
    let ox = 0, oy = 0;
    if (!p.special) {
      const key = `${Math.round(p.px)},${Math.round(p.py)}`;
      const arr = groups[key];
      if (arr.length > 1) {
        const offsets = STACK_OFFSETS[Math.min(arr.length, 4)] || STACK_OFFSETS[4];
        const idxInGroup = arr.indexOf(i);
        const o = offsets[idxInGroup % offsets.length];
        ox = o.x; oy = o.y;
      }
    }
    const isMovable = p.player.color === currentColor && gs.movable.includes(p.tIdx) && gs.winner == null;
    drawRealPawn(p.px + ox, p.py + oy, p.player.color, isMovable);
  });

  return { bedMargin, gridStep, homeSlotCoords };
}

/* ============================================================
   Component
   ============================================================ */
export default function LudoPlayerPage({ sessionToken, onComplete }) {
  const stateRef = useRef(null);
  const [tick, bump] = useReducer((x) => x + 1, 0);
  const rerender = () => bump();

  const [phase, setPhase] = useState("setup");        // 'setup' | 'playing'
  const [topMode, setTopMode] = useState("local");     // 'local' | 'online' | 'computer'
  const [selectedCount, setSelectedCount] = useState(4);
  const [selectedCompCount, setSelectedCompCount] = useState(4);
  const [botDifficulty, setBotDifficulty] = useState("normal"); // 'easy' | 'normal' | 'hard'
  const [showWin, setShowWin] = useState(false);
  const completedRef = useRef(false);
  const handleComplete = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      if (sessionToken) {
        await fetch('/api/play/session/complete', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: sessionToken, score: 0, player_data: { result: 'finished' } })
        });
      }
    } catch {}
    onComplete?.();
  }, [sessionToken, onComplete]);

  useEffect(() => {
    if (showWin) handleComplete();
  }, [showWin, handleComplete]);
  const [isRolling, setIsRolling] = useState(false);
  const [movingToken, setMovingToken] = useState(null);   // "pIdx-tIdx" currently hopping
  const [flashTokens, setFlashTokens] = useState([]);     // token keys briefly flashing after capture
  const botTimerRef = useRef(null);
  const botDifficultyRef = useRef("normal");
  const [soundOn, setSoundOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const soundOnRef = useRef(true);
  const canvasBoardRef = useRef(null);
  const boardMetaRef = useRef(null);
  const [rollingColor, setRollingColor] = useState(null); // which color is currently rolling
  const [diceFace, setDiceFace] = useState(1); // the animated dice face during roll
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);
  const play = (name) => { if (soundOnRef.current && sfx[name]) sfx[name](); };

  // online-only state
  const [onlineStage, setOnlineStage] = useState("choice"); // 'choice' | 'hostWait' | 'guestWait'
  const [roomCode, setRoomCode] = useState(null);
  const [joinInput, setJoinInput] = useState("");
  const [joinErr, setJoinErr] = useState("");
  const [myColor, setMyColor] = useState(null);
  const [oppLive, setOppLive] = useState(false);
  const modeRef = useRef("local");     // mirrors topMode for use inside closures/timeouts
  const myColorRef = useRef(null);
  const roomCodeRef = useRef(null);
  const pollRef = useRef(null);
  const lobbyPollRef = useRef(null);

  useEffect(() => {
    botDifficultyRef.current = botDifficulty;
  }, [botDifficulty]);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@600;700;800;900&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (lobbyPollRef.current) clearInterval(lobbyPollRef.current);
    };
  }, []);

  // Close settings dropdown on outside click
  useEffect(() => {
    if (!showSettings) return;
    const fn = (e) => {
      if (!e.target.closest('.settings-btn') && !e.target.closest('.settings-dropdown')) setShowSettings(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [showSettings]);

  // Draw Canvas board whenever game state changes
  useEffect(() => {
    if (phase === "playing" && canvasBoardRef.current && stateRef.current) {
      boardMetaRef.current = drawLudoBoard(canvasBoardRef.current, stateRef.current);
    }
  }, [phase, tick, movingToken]);

  /* ---------------- local game bootstrap ---------------- */
  function newGame(colors, botFlags) {
    if (botTimerRef.current) { clearTimeout(botTimerRef.current); botTimerRef.current = null; }
    stateRef.current = {
      players: colors.map((color, i) => ({
        color,
        isBot: !!(botFlags && botFlags[i]),
        tokens: [{ step: -1 }, { step: -1 }, { step: -1 }, { step: -1 }],
      })),
      current: Math.floor(Math.random() * colors.length),
      dice: 1,
      movable: [],
      sixStreak: 0,
      winner: null,
      canRoll: true,
      msg: "Roll to begin.",
    };
    setShowWin(false);
    setMovingToken(null);
    setFlashTokens([]);
    setPhase("playing");
    rerender();
  }

  /* ---------------- online: Socket.io connection ---------------- */
  const socketRef = useRef(null);

  function getSocket() {
    if (socketRef.current?.connected) return socketRef.current;
    const s = io();
    socketRef.current = s;
    return s;
  }

  /* ---------------- online: push state ---------------- */
  function pushState() {
    if (modeRef.current !== "online" || !roomCodeRef.current || !stateRef.current) return;
    const s = socketRef.current;
    if (!s?.connected) return;
    const gs = stateRef.current;
    s.emit("ludo:sync-state", {
      players: gs.players,
      current: gs.current,
      dice: gs.dice,
      movable: gs.movable,
      sixStreak: gs.sixStreak,
      winner: gs.winner,
      canRoll: gs.canRoll,
      msg: gs.msg,
    });
  }

  function isMyTurn() {
    const gs = stateRef.current;
    if (!gs) return false;
    if (modeRef.current !== "online") return true;
    return gs.players[gs.current].color === myColorRef.current;
  }

  /* ---------------- online: lobby flow ---------------- */
  function beginCreateRoom() {
    const s = getSocket();
    modeRef.current = "online";
    setTopMode("online");
    setOnlineStage("hostWait");

    s.emit("ludo:create-room", { playerName: "Player 1" }, (resp) => {
      if (resp?.error) { setJoinErr(resp.error); setOnlineStage("choice"); return; }
      setRoomCode(resp.roomId);
      roomCodeRef.current = resp.roomId;
      myColorRef.current = resp.color;
      setMyColor(resp.color);

      s.once("ludo:opponent-joined", ({ opponentName, playerNames }) => {
        myColorRef.current = "red";
        setMyColor("red");
        newGame(["red", "green"], [false, false]);
        setupOnlineListeners(s);
      });
    });
  }

  function beginJoinRoom() {
    const code = joinInput.trim().toUpperCase();
    setJoinErr("");
    if (code.length < 4) { setJoinErr("Enter the room code your friend shared."); return; }

    const s = getSocket();
    modeRef.current = "online";
    setTopMode("online");

    s.emit("ludo:join-room", { roomId: code, playerName: "Player 2" }, (resp) => {
      if (resp?.error) { setJoinErr(resp.error); return; }
      setRoomCode(resp.roomId);
      roomCodeRef.current = resp.roomId;
      myColorRef.current = resp.color;
      setMyColor(resp.color);
      setOnlineStage("guestWait");

      s.once("ludo:state-update", (state) => {
        stateRef.current = { ...state, movable: state.movable || [] };
        setShowWin(false);
        setPhase("playing");
        rerender();
        setupOnlineListeners(s);
      });

      s.once("ludo:turn-change", (data) => {
        if (stateRef.current) {
          stateRef.current.current = data.currentTurn;
          stateRef.current.dice = data.diceValue;
          stateRef.current.msg = `${data.currentPlayerName}'s turn.`;
          rerender();
        }
      });
    });
  }

  function setupOnlineListeners(s) {
    if (s.__ludoListenersAttached) {
      ["ludo:dice-rolled", "ludo:state-update", "ludo:turn-change", "ludo:game-over", "ludo:quick-msg", "ludo:opponent-left"]
        .forEach((evt) => s.removeAllListeners(evt));
    }
    s.__ludoListenersAttached = true;

    s.on("ludo:dice-rolled", ({ diceValue, rolledBy, playerName }) => {
      const activeColor = ["red", "green", "yellow", "blue"][rolledBy];
      setRollingColor(activeColor);
      setIsRolling(true);
      let ticks = 0;
      const iv = setInterval(() => {
        ticks++;
        setDiceFace(1 + Math.floor(Math.random() * 6));
        if (ticks > 10) {
          clearInterval(iv);
          setDiceFace(diceValue);
          setIsRolling(false);
          setRollingColor(null);
          if (stateRef.current) {
            stateRef.current.dice = diceValue;
            stateRef.current.current = rolledBy;
            const player = stateRef.current.players[rolledBy];
            const movable = getMovable(player, diceValue);
            stateRef.current.movable = movable;
            stateRef.current.msg = movable.length > 0 ? "Pick a token to move." : "No valid moves.";
            rerender();
          }
        }
      }, 70);
    });

    s.on("ludo:state-update", (state) => {
      if (!isMyTurn()) {
        stateRef.current = { ...state, movable: state.movable || [] };
        rerender();
        if (state.winner != null) setShowWin(true);
      }
    });

    s.on("ludo:turn-change", ({ currentTurn, currentPlayerName, diceValue }) => {
      if (stateRef.current) {
        stateRef.current.current = currentTurn;
        stateRef.current.dice = diceValue;
        stateRef.current.msg = `${currentPlayerName}'s turn.`;
        rerender();
      }
    });

    s.on("ludo:game-over", ({ winnerIndex, winnerName }) => {
      if (stateRef.current) {
        stateRef.current.winner = winnerIndex;
        stateRef.current.msg = `${winnerName} wins!`;
        rerender();
      }
      setShowWin(true);
    });

    s.on("ludo:quick-msg", ({ message }) => {
      if (stateRef.current) {
        stateRef.current.msg = message;
        rerender();
      }
    });

    s.on("ludo:opponent-left", ({ playerName }) => {
      if (stateRef.current) {
        stateRef.current.msg = `${playerName} disconnected!`;
        rerender();
      }
    });
  }

  function cancelLobby() {
    const s = socketRef.current;
    if (s) { s.removeAllListeners(); s.disconnect(); socketRef.current = null; }
    roomCodeRef.current = null;
    setRoomCode(null);
    setOnlineStage("choice");
  }

  function leaveOnlineGame() {
    const s = socketRef.current;
    if (s) { s.removeAllListeners(); s.disconnect(); socketRef.current = null; }
    if (botTimerRef.current) { clearTimeout(botTimerRef.current); botTimerRef.current = null; }
    roomCodeRef.current = null;
    myColorRef.current = null;
    modeRef.current = "local";
    setRoomCode(null);
    setMyColor(null);
    setOnlineStage("choice");
    setPhase("setup");
    setShowWin(false);
  }

  function rematchOnline() {
    leaveOnlineGame();
  }

  /* ---------------- bot AI ---------------- */
  function isCurrentBot() {
    const gs = stateRef.current;
    return !!(gs && gs.players[gs.current] && gs.players[gs.current].isBot);
  }

  useEffect(() => {
    const gs = stateRef.current;
    if (phase !== "playing" || !gs || gs.winner != null) return;
    if (modeRef.current === "online") return;
    const player = gs.players[gs.current];
    if (!player || !player.isBot) return;
    if (botTimerRef.current) return;

    if (gs.canRoll && !isRolling) {
      botTimerRef.current = setTimeout(() => {
        botTimerRef.current = null;
        rollDice();
      }, 650 + Math.random() * 450);
    } else if (gs.movable && gs.movable.length > 0) {
      botTimerRef.current = setTimeout(() => {
        botTimerRef.current = null;
        const gs2 = stateRef.current;
        if (!gs2 || gs2.winner != null || !gs2.movable.length) return;
        const tIdx = chooseBotMove(gs2, gs2.current, botDifficultyRef.current);
        moveToken(gs2.current, tIdx);
      }, 600 + Math.random() * 500);
    }
  });

  /* ---------------- gameplay ---------------- */
  function rollDice() {
    const gs = stateRef.current;
    if (!gs || gs.winner != null || !gs.canRoll) return;
    if (!isMyTurn()) return;

    if (modeRef.current === "online") {
      const s = socketRef.current;
      if (!s?.connected) return;
      gs.canRoll = false;
      rerender();
      s.emit("ludo:roll-dice", null, (resp) => {
        if (resp?.error) { gs.canRoll = true; rerender(); return; }
      });
      return;
    }

    gs.canRoll = false;
    const activeColor = gs.players[gs.current].color;
    setRollingColor(activeColor);
    setIsRolling(true);
    rerender();
    let ticks = 0;
    const iv = setInterval(() => {
      ticks++;
      setDiceFace(1 + Math.floor(Math.random() * 6));
      play("diceTick");
      buzz(8);
      rerender();
      if (ticks > 10) {
        clearInterval(iv);
        // Only bias rolls in "Vs Bot" games — Pass & Play and Online stay
        // perfectly fair (both sides are humans there).
        const biasActive = topMode === "computer";
        const isBotTurn = !!gs.players[gs.current].isBot;
        const final = rollDieFor(isBotTurn, biasActive);
        gs.dice = final;
        setDiceFace(final);
        setIsRolling(false);
        setRollingColor(null);
        play("diceLand");
        buzz(25);
        finalizeRoll();
      }
    }, 70);
  }

  function finalizeRoll() {
    const gs = stateRef.current;
    const player = gs.players[gs.current];

    if (gs.dice === 6) {
      gs.sixStreak = (gs.sixStreak || 0) + 1;
    } else {
      gs.sixStreak = 0;
    }

    if (gs.sixStreak >= 3) {
      gs.movable = [];
      gs.msg = `${NAME[player.color]} rolled three sixes in a row — turn forfeited!`;
      gs.sixStreak = 0;
      rerender();
      pushState();
      setTimeout(() => endTurn(false), 900);
      return;
    }

    const movable = getMovable(player, gs.dice);
    gs.movable = movable;

    if (movable.length === 0) {
      gs.msg = `${NAME[player.color]} rolled a ${gs.dice} — no valid moves.`;
      rerender();
      pushState();
      setTimeout(() => endTurn(gs.dice === 6), 900);
      return;
    }

    // If only ONE coin can move, move it automatically.
    // This is especially useful when 3 coins are already inside/finished
    // and only 1 coin remains outside. The user does not need to click it.
    if (
      movable.length === 1 &&
      !player.isBot &&
      modeRef.current !== "online"
    ) {
      const onlyToken = movable[0];
      gs.msg = `${NAME[player.color]} rolled a ${gs.dice} — moving the only movable coin.`;
      rerender();
      pushState();

      setTimeout(() => {
        const latest = stateRef.current;
        if (!latest || latest.winner != null) return;
        if (latest.current !== gs.current) return;
        if (!latest.movable.includes(onlyToken)) return;
        moveToken(latest.current, onlyToken);
      }, 350);
      return;
    }

    gs.msg = `${NAME[player.color]} rolled a ${gs.dice} — choose a token to move.`;
    rerender();
    pushState();
  }

  function onTokenClick(pIdx, tIdx) {
    const gs = stateRef.current;
    if (!gs || gs.winner != null) return;
    if (pIdx !== gs.current) return;
    if (gs.players[pIdx].isBot) return;
    if (movingToken) return;
    if (!gs.movable.includes(tIdx)) return;
    if (!isMyTurn()) return;
    play("tap");
    buzz(12);
    moveToken(pIdx, tIdx);
  }

  function moveToken(pIdx, tIdx) {
    const gs = stateRef.current;
    const player = gs.players[pIdx];
    const tok = player.tokens[tIdx];
    const dice = gs.dice;
    const fromStep = tok.step;

    // A normal move uses the dice exactly. For the requested final move,
    // a pawn on main-track step 50 with a 6 enters the six home cells and
    // finishes on step 55. There is no sixth home cell.
    const requestedStep = fromStep === -1 ? 0 : fromStep + dice;
    const isFinalSixFinish =
      fromStep === MAIN_STEPS - 1 &&
      dice === 6 &&
      requestedStep === WIN_STEP + 1;

    const toStep = isFinalSixFinish
      ? WIN_STEP
      : requestedStep;

    gs.movable = [];
    gs.msg = `${NAME[player.color]} is on the move…`;
    setMovingToken(`${pIdx}-${tIdx}`);
    rerender();

    const path = fromStep === -1 ? [0] : [];
    if (fromStep !== -1) {
      for (let s = fromStep + 1; s <= toStep; s++) path.push(s);
    }

    let i = 0;
    const hopIv = setInterval(() => {
      tok.step = path[i];
      play("hop");
      buzz(10);
      rerender();
      i++;
      if (i >= path.length) {
        clearInterval(hopIv);
        finishMove(pIdx, tIdx, dice);
      }
    }, 160);
  }

  function animateCapturedPawns(captures, done) {
    if (!captures.length) {
      done();
      return;
    }

    // Animate each captured pawn backward through its own travelled
    // track positions, then return it to base (-1).
    let remaining = captures.length;

    const animateOne = (capture) => {
      const pawn = stateRef.current?.players[capture.opIdx]?.tokens?.[capture.tIdx];
      if (!pawn) {
        remaining--;
        if (remaining === 0) done();
        return;
      }

      const path = [];
      for (let s = capture.fromStep; s >= 0; s--) path.push(s);
      path.push(-1);

      let i = 0;
      const reverseIv = setInterval(() => {
        const currentPawn =
          stateRef.current?.players[capture.opIdx]?.tokens?.[capture.tIdx];

        if (!currentPawn) {
          clearInterval(reverseIv);
          remaining--;
          if (remaining === 0) done();
          return;
        }

        currentPawn.step = path[i];
        play("hop");
        buzz(7);
        rerender();

        i++;
        if (i >= path.length) {
          clearInterval(reverseIv);
          currentPawn.step = -1;
          rerender();
          remaining--;
          if (remaining === 0) done();
        }
      }, 100);
    };

    captures.forEach(animateOne);
  }

  function finishMove(pIdx, tIdx, dice) {
    const gs = stateRef.current;
    const player = gs.players[pIdx];
    const tok = player.tokens[tIdx];
    let captured = false;
    const capturedKeys = [];
    const capturedAnimations = [];

    const reachedFinish = tok.step === WIN_STEP;
    const onTrack = tok.step >= 0 && tok.step <= MAIN_STEPS - 1;

    if (onTrack) {
      const cellIdx = physicalTrackIdx(player.color, tok.step);
      if (!SAFE_IDX.includes(cellIdx)) {
        const stackCounts = {};
        gs.players.forEach((op, opIdx) => {
          if (opIdx === pIdx) return;
          op.tokens.forEach((otok) => {
            if (otok.step >= 0 && otok.step <= MAIN_STEPS - 1) {
              const oCellIdx = physicalTrackIdx(op.color, otok.step);
              if (oCellIdx === cellIdx) {
                stackCounts[op.color] = (stackCounts[op.color] || 0) + 1;
              }
            }
          });
        });
        gs.players.forEach((op, opIdx) => {
          if (opIdx === pIdx) return;
          if ((stackCounts[op.color] || 0) >= 2) return;
          op.tokens.forEach((otok, oTIdx) => {
            if (otok.step >= 0 && otok.step <= MAIN_STEPS - 1) {
              const oCellIdx = physicalTrackIdx(op.color, otok.step);
              if (oCellIdx === cellIdx) {
                // Do not instantly send the captured pawn to base.
                // Save its current position so it can travel backward
                // through the exact same cells it used to reach this spot.
                captured = true;
                capturedKeys.push(`${opIdx}-${oTIdx}`);
                capturedAnimations.push({
                  opIdx,
                  tIdx: oTIdx,
                  fromStep: otok.step,
                });
              }
            }
          });
        });
      }
    }

    let extra = false;
    if (dice === 6) extra = true;
    if (captured) extra = true;
    if (reachedFinish) extra = true;

    let msg = `${NAME[player.color]} moved a token`;
    if (reachedFinish) msg += " home!";
    if (captured) msg += " and sent an opponent back to base!";
    gs.msg = msg;
    gs.movable = [];
    setMovingToken(null);
    if (capturedKeys.length) {
      setFlashTokens(capturedKeys);
      play("capture");
      buzz([0, 30, 40, 30]);
      setTimeout(() => setFlashTokens([]), 650);
    } else if (reachedFinish) {
      play("home");
      buzz(35);
    }
    rerender();
    pushState();

    if (modeRef.current === "online" && socketRef.current?.connected) {
      socketRef.current.emit("ludo:move-complete", {
        finalPosition: tok.step,
        tokens: player.tokens.map((t) => t.step),
      });
    }

    if (player.tokens.every((t) => t.step === WIN_STEP)) {
      gs.winner = pIdx;
      gs.canRoll = false;
      rerender();
      pushState();
      setShowWin(true);
      play("win");
      buzz([0, 90, 60, 90, 60, 140]);
      return;
    }
    const continueTurn = () => {
      setTimeout(() => endTurn(extra), captured || reachedFinish ? 500 : 250);
    };

    if (capturedAnimations.length) {
      // Let the captured pawn visibly travel backward to its base first.
      // The turn only continues after the reverse animation completes.
      animateCapturedPawns(capturedAnimations, continueTurn);
    } else {
      continueTurn();
    }
  }

  function endTurn(extraIn) {
    const gs = stateRef.current;
    if (!gs || gs.winner != null) return;
    const extra = extraIn;
    if (!extra) {
      gs.current = (gs.current + 1) % gs.players.length;
      gs.sixStreak = 0;
      gs.msg = `${NAME[gs.players[gs.current].color]}'s turn. Roll the dice.`;
    } else {
      gs.msg = `${NAME[gs.players[gs.current].color]} rolls again!`;
    }
    gs.movable = [];
    gs.canRoll = true;
    rerender();
    pushState();
  }

  function backToSetup() {
    if (topMode === "online") { leaveOnlineGame(); return; }
    if (botTimerRef.current) { clearTimeout(botTimerRef.current); botTimerRef.current = null; }
    setShowWin(false);
    setPhase("setup");
    stateRef.current = null;
  }

  const gs = stateRef.current;

  /* ---- derive token render list + stacking offsets ---- */
  let tokenRenders = [];
  if (gs) {
    const placements = [];
    gs.players.forEach((player, pIdx) => {
      player.tokens.forEach((tok, tIdx) => {
        const [r, c] = cellForToken(player.color, tIdx, tok.step);
        const special = tok.step === -1 || tok.step === WIN_STEP;
        placements.push({ pIdx, tIdx, color: player.color, step: tok.step, r, c, special });
      });
    });
    const groups = {};
    placements.forEach((p, i) => {
      if (!p.special) {
        const key = `${p.r},${p.c}`;
        (groups[key] = groups[key] || []).push(i);
      }
    });
    tokenRenders = placements.map((p) => {
      let tx = 0, ty = 0;
      if (p.step === WIN_STEP) {
        const fo = FINISH_OFFSET[p.color];
        const j = JITTER[p.tIdx];
        tx = fo.x + j.x * 0.4;
        ty = fo.y + j.y * 0.4;
      } else if (!p.special) {
        const key = `${p.r},${p.c}`;
        const arr = groups[key];
        if (arr.length > 1) {
          const n = arr.length;
          const offsets =
            n === 2 ? [{x:-26,y:0},{x:26,y:0}] :
            n === 3 ? [{x:-26,y:-20},{x:26,y:-20},{x:0,y:24}] :
                      [{x:-26,y:-26},{x:26,y:-26},{x:-26,y:26},{x:26,y:26}];
          const idxInGroup = arr.indexOf(placements.indexOf(p));
          const o = offsets[idxInGroup % offsets.length];
          tx = o.x; ty = o.y;
        }
      }
      const movable = gs.winner == null && p.pIdx === gs.current && gs.movable.includes(p.tIdx) && isMyTurn();
      return { ...p, tx, ty, movable };
    });
  }

  const online = topMode === "online" && phase === "playing";
  const myTurnNow = gs ? isMyTurn() : false;

  return (
    <div className="ludo-app">
      <style>{`
        .ludo-app{
          --surface:#0f172a; --surface-raised:#1e293b; --surface-card:#1e293b;
          --border:#334155; --border-subtle:#1e293b;
          --text:#f1f5f9; --text-muted:#94a3b8; --text-dim:#64748b;
          --red:#ef4444; --red-dk:#dc2626; --red-glow:rgba(239,68,68,0.3);
          --green:#22c55e; --green-dk:#16a34a; --green-glow:rgba(34,197,94,0.3);
          --blue:#3b82f6; --blue-dk:#2563eb; --blue-glow:rgba(59,130,246,0.3);
          --yellow:#eab308; --yellow-dk:#ca8a04; --yellow-glow:rgba(234,179,8,0.3);
          --gold:#fbbf24; --gold-dk:#f59e0b;
          --cell: clamp(20px, 5.6vmin, 34px);
          min-height:100vh; width:100%;
          background:
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59,130,246,0.08), transparent 60%),
            radial-gradient(ellipse 60% 40% at 20% 100%, rgba(239,68,68,0.05), transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(34,197,94,0.05), transparent 50%),
            linear-gradient(180deg, #0f172a 0%, #020617 100%);
          font-family:'Nunito',sans-serif; color:var(--text);
          display:flex; align-items:center; justify-content:center; padding:20px; box-sizing:border-box;
          position:relative; overflow:hidden;
        }
        .ludo-app *{box-sizing:border-box;}
        .ludo-app::before, .ludo-app::after{
          content:""; position:absolute; width:300px; height:300px; pointer-events:none; z-index:0;
          border-radius:50%; filter:blur(100px);
        }
        .ludo-app::before{ top:-120px; left:-80px; background:rgba(239,68,68,0.06); }
        .ludo-app::after{ bottom:-120px; right:-80px; background:rgba(34,197,94,0.06); }
        .canopy-edge{ display:none; }
        .app{ width:100%; max-width:920px; display:flex; flex-direction:column; align-items:center; gap:14px; position:relative; z-index:1; }

        .signboard{
          position:relative; padding:14px 34px 18px; border-radius:16px; margin-bottom:2px;
          background:linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95));
          border:1px solid rgba(255,255,255,0.08);
          box-shadow:0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset;
          backdrop-filter:blur(12px);
        }
        .signboard::before, .signboard::after{ display:none; }
        .ludo-app h1{
          font-family:'Baloo 2',cursive; font-weight:800; font-size:clamp(30px,6vw,48px);
          margin:0; letter-spacing:2px; text-align:center; text-transform:uppercase;
          background:linear-gradient(135deg, #fff 0%, #cbd5e1 50%, #fff 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text;
          filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          display:flex; justify-content:center; gap:1px;
        }
        .ludo-app h1 span:nth-child(6n+1){ -webkit-text-fill-color:var(--red); }
        .ludo-app h1 span:nth-child(6n+2){ -webkit-text-fill-color:var(--yellow); }
        .ludo-app h1 span:nth-child(6n+3){ -webkit-text-fill-color:var(--green); }
        .ludo-app h1 span:nth-child(6n+4){ -webkit-text-fill-color:var(--blue); }
        .ludo-app h1 span:nth-child(6n+5){ -webkit-text-fill-color:var(--gold); }
        .ludo-app h1 span:nth-child(6n){ -webkit-text-fill-color:var(--text); }
        .subtitle{ font-size:13px; font-weight:700; color:var(--text-muted); margin-top:-2px; letter-spacing:0.4px; text-align:center; }

        .statbar{
          display:flex; align-items:center; gap:10px;
          background:rgba(30,41,59,0.8); border:1px solid rgba(255,255,255,0.06);
          border-radius:20px; padding:6px 16px;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
        }
        .stat-chip{ display:flex; align-items:center; gap:6px; font-family:'Baloo 2',cursive; font-weight:700; font-size:14px; color:var(--text); }
        .stat-coin, .stat-gem{
          width:18px; height:18px; border-radius:50%; display:inline-block; flex-shrink:0;
          box-shadow:inset 0 -2px 3px rgba(0,0,0,0.3), inset 0 2px 2px rgba(255,255,255,0.5);
        }
        .stat-coin{ background:radial-gradient(circle at 35% 30%,#fff2b0,var(--yellow) 60%,var(--yellow-dk)); }
        .stat-gem{ border-radius:4px; transform:rotate(45deg); background:radial-gradient(circle at 35% 30%,#c9f2ff,var(--blue) 60%,var(--blue-dk)); }
        .icon-btn{
          width:30px; height:30px; border-radius:50%; border:1px solid rgba(255,255,255,0.1); margin-left:2px;
          background:rgba(30,41,59,0.8); color:var(--text-muted); font-size:14px;
          cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s;
        }
        .icon-btn:hover{ transform:translateY(-1px); background:rgba(51,65,85,0.8); color:var(--text); }
        .icon-btn:active{ transform:translateY(1px); }

        @keyframes signFloat{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-3px); } }
        .signboard{ animation:signFloat 4.5s ease-in-out infinite; }

        @keyframes emberDrift{
          0%{ transform:translateY(0) translateX(0); opacity:0; }
          10%{ opacity:0.6; }
          90%{ opacity:0.3; }
          100%{ transform:translateY(-140px) translateX(14px); opacity:0; }
        }
        .ember{
          position:absolute; width:4px; height:4px; border-radius:50%; z-index:0; pointer-events:none;
          background:radial-gradient(circle,var(--gold),rgba(251,191,36,0.1) 70%); box-shadow:0 0 6px 2px rgba(251,191,36,0.3);
          animation:emberDrift 6s ease-in infinite;
        }

        .setup-card{
          position:relative;
          background:rgba(30,41,59,0.9);
          border:1px solid rgba(255,255,255,0.08); border-radius:22px;
          padding:30px 26px; width:100%; max-width:460px;
          box-shadow:0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset;
          backdrop-filter:blur(12px);
          text-align:center;
        }
        .setup-card p{ color:var(--text-muted); font-weight:600; font-size:14px; line-height:1.5; margin:10px 0 22px; }

        .mode-toggle{ display:flex; gap:6px; margin-bottom:22px; background:rgba(0,0,0,0.3); border-radius:16px; padding:6px; }
        .mode-toggle button{
          flex:1; border:none; background:transparent; color:var(--text-dim); font-family:'Baloo 2',cursive; font-weight:700;
          font-size:12.5px; padding:11px 4px; border-radius:12px; cursor:pointer; transition:.15s;
        }
        .mode-toggle button.active{
          background:linear-gradient(135deg, var(--blue), var(--blue-dk));
          color:#fff; box-shadow:0 4px 12px var(--blue-glow);
        }

        .count-row{ display:flex; gap:12px; justify-content:center; margin-bottom:22px; }
        .count-btn{
          width:54px; height:54px; border-radius:50%; border:2px solid rgba(255,255,255,0.1);
          background:rgba(30,41,59,0.8); color:var(--text-muted);
          font-family:'Baloo 2',cursive; font-size:22px; font-weight:700; cursor:pointer; transition:.15s;
        }
        .count-btn:hover{ transform:translateY(-2px); border-color:rgba(255,255,255,0.2); }
        .count-btn.selected{
          background:linear-gradient(135deg, var(--green), var(--green-dk)); color:#fff;
          border-color:transparent; box-shadow:0 4px 12px var(--green-glow);
        }
        .swatches{ display:flex; justify-content:center; gap:10px; margin-bottom:24px; }
        .swatch{ width:24px; height:24px; border-radius:50%; border:2px solid rgba(255,255,255,0.2); box-shadow:inset 0 2px 3px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.3); }
        .swatch-tag{
          position:absolute; top:100%; left:50%; transform:translateX(-50%); margin-top:4px;
          font-size:8.5px; font-weight:800; color:var(--text-dim); white-space:nowrap; letter-spacing:0.3px;
        }
        .diff-row{ display:flex; gap:8px; justify-content:center; margin-bottom:22px; }
        .diff-btn{
          flex:1; max-width:96px; border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:9px 4px;
          background:rgba(30,41,59,0.8); color:var(--text-muted);
          font-family:'Baloo 2',cursive; font-weight:700; font-size:12.5px; cursor:pointer;
          transition:.15s;
        }
        .diff-btn:hover{ transform:translateY(-1px); border-color:rgba(255,255,255,0.15); }
        .diff-btn.selected{
          background:linear-gradient(135deg, var(--gold), var(--gold-dk)); color:#0f172a;
          border-color:transparent; box-shadow:0 4px 12px rgba(251,191,36,0.3);
        }
        .start-btn{
          position:relative; overflow:hidden;
          background:linear-gradient(135deg, var(--green), var(--green-dk)); border:none; color:#fff;
          font-family:'Baloo 2',cursive; font-weight:700; font-size:18px; padding:14px 30px; border-radius:16px;
          cursor:pointer; box-shadow:0 4px 16px var(--green-glow), 0 8px 24px rgba(0,0,0,0.3); transition:all .15s; width:100%;
          letter-spacing:0.4px;
        }
        .start-btn::before{
          content:""; position:absolute; top:2px; left:6%; right:6%; height:38%; border-radius:50px;
          background:linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0)); pointer-events:none;
        }
        .start-btn:hover{ transform:translateY(-2px); box-shadow:0 6px 20px var(--green-glow), 0 12px 28px rgba(0,0,0,0.35); }
        .start-btn:active{ transform:translateY(1px); box-shadow:0 2px 8px var(--green-glow); }
        .start-btn.secondary{
          background:linear-gradient(135deg, var(--gold), var(--gold-dk)); box-shadow:0 4px 16px rgba(251,191,36,0.3), 0 8px 24px rgba(0,0,0,0.3); margin-top:10px; color:#0f172a;
        }
        .start-btn.secondary:active{ box-shadow:0 2px 8px rgba(251,191,36,0.3); }
        .start-btn:disabled{ opacity:0.45; cursor:not-allowed; transform:none; }

        .code-input{
          width:100%; text-align:center; letter-spacing:6px; font-size:20px; font-weight:800; font-family:'Baloo 2',cursive;
          padding:13px; border-radius:12px; border:2px solid rgba(255,255,255,0.1); margin-bottom:10px; color:var(--text);
          text-transform:uppercase; background:rgba(0,0,0,0.3);
        }
        .code-input:focus{ outline:none; border-color:var(--blue); box-shadow:0 0 0 3px var(--blue-glow); }
        .err-msg{ color:#f87171; font-weight:700; font-size:12.5px; margin:-2px 0 10px; min-height:15px; }
        .room-code-box{
          font-family:'Baloo 2',cursive; font-size:34px; font-weight:800; letter-spacing:7px; color:var(--gold);
          background:rgba(0,0,0,0.3); border-radius:14px; padding:14px 8px; margin:12px 0;
        }
        .spinner{
          width:24px; height:24px; border-radius:50%; border:4px solid rgba(251,191,36,0.2); border-top-color:var(--gold);
          margin:6px auto 14px; animation:ludoSpin 0.9s linear infinite;
        }
        @keyframes ludoSpin{ to{ transform:rotate(360deg); } }
        .wait-note{ font-size:12.5px; color:var(--text-dim); font-weight:700; }

        .game-wrap{ display:flex; width:100%; flex-direction:column; align-items:center; gap:14px; }

        .board-area{
          display:flex; flex-direction:column; align-items:center; gap:12px;
          width:min(90vw, 640px);
        }
        .top-row, .bottom-row{
          display:flex; justify-content:space-between; width:100%;
        }
        .board-frame{
          width:100%; aspect-ratio:1/1;
          background:#111827;
          border-radius:18px; border:2px solid #1f2937;
          box-shadow:0 25px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05);
          overflow:hidden;
          filter:drop-shadow(0 25px 35px rgba(0,0,0,0.8));
        }
        .quick-msgs{ display:flex; gap:8px; flex-wrap:wrap; justify-content:center; width:100%; margin-top:4px; }
        .quick-msg-btn{
          font-family:'Baloo 2',cursive; font-weight:700; font-size:12px; padding:6px 14px;
          border-radius:20px; border:1px solid rgba(255,255,255,0.12);
          background:rgba(30,41,59,0.8); color:var(--text-muted); cursor:pointer;
          transition:all 0.15s ease; white-space:nowrap;
        }
        .quick-msg-btn:hover{ background:rgba(51,65,85,0.9); color:var(--text); border-color:rgba(255,255,255,0.2); transform:translateY(-1px); }
        .quick-msg-btn:active{ transform:translateY(1px); }

        .settings-btn{
          position:fixed; top:14px; right:14px; z-index:30;
          width:40px; height:40px; border-radius:50%; border:1px solid rgba(255,255,255,0.1);
          background:rgba(30,41,59,0.9); color:var(--text-muted); font-size:18px; cursor:pointer;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex; align-items:center; justify-content:center; transition:all .15s;
        }
        .settings-btn:hover{ transform:translateY(-1px); color:var(--text); background:rgba(51,65,85,0.9); }
        .settings-btn:active{ transform:translateY(1px); }
        .settings-dropdown{
          position:fixed; top:62px; right:14px; z-index:31; min-width:180px;
          background:rgba(30,41,59,0.95); border:1px solid rgba(255,255,255,0.08); border-radius:16px;
          box-shadow:0 8px 24px rgba(0,0,0,0.5); overflow:hidden;
          backdrop-filter:blur(12px);
          animation:dropdownIn .18s ease-out;
        }
        @keyframes dropdownIn{ from{ opacity:0; transform:translateY(-8px); } to{ opacity:1; transform:none; } }
        .settings-dropdown button{
          width:100%; border:none; background:transparent; color:var(--text-muted);
          font-family:'Baloo 2',cursive; font-weight:700; font-size:13px;
          padding:12px 18px; text-align:left; cursor:pointer; transition:background .12s;
          display:flex; align-items:center; gap:10px;
        }
        .settings-dropdown button:hover{ background:rgba(255,255,255,0.08); color:var(--text); }
        .settings-dropdown button:active{ background:rgba(255,255,255,0.12); }
        .settings-dropdown .sd-icon{ font-size:16px; width:22px; text-align:center; }

        .winbox{ position:fixed; inset:0; background:rgba(0,0,0,0.75); align-items:center; justify-content:center; z-index:50; display:none; backdrop-filter:blur(4px); }
        .winbox.active{ display:flex; }
        .winbox .card{
          position:relative;
          background:rgba(30,41,59,0.95); border:1px solid rgba(255,255,255,0.1);
          border-radius:22px; padding:36px 40px; text-align:center;
          box-shadow:0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset;
          backdrop-filter:blur(12px);
          max-width:320px;
        }
        .winbox h2{ font-family:'Baloo 2',cursive; color:var(--gold); font-size:26px; margin:0 0 8px; }
        .winbox p{ color:var(--text-muted); font-weight:600; margin:0 0 20px; font-size:14px; }
      `}</style>

      <div className="canopy-edge" />
      {[8, 22, 38, 55, 70, 85].map((left, i) => (
        <span
          key={i}
          className="ember"
          style={{ left: `${left}%`, bottom: `${(i % 3) * 10}%`, animationDelay: `${i * 0.9}s` }}
        />
      ))}

      <div className="app">
        {phase !== "playing" && (
          <>
            <div className="signboard">
              <h1>{"MASTER LUDO".split("").map((ch, i) => (
                <span key={i}>{ch === " " ? "\u00A0" : ch}</span>
              ))}</h1>
            </div>
            <div className="subtitle">
              {online ? "Online race — one board, two devices" : "Pass & play multiplayer — one board, everyone takes turns"}
            </div>
            <div className="statbar">
              <span className="stat-chip"><span className="stat-coin" /> 36,223</span>
              <span className="stat-chip"><span className="stat-gem" /> 6,223</span>
              <button className="icon-btn" aria-label="Sound" onClick={() => setSoundOn((s) => !s)}>{soundOn ? <IconSoundOn /> : <IconSoundOff />}</button>
              <button className="icon-btn" aria-label="Settings"><IconSettings /></button>
            </div>
          </>
        )}

        {phase === "setup" && (
          <div className="setup-card">
            <div className="mode-toggle">
              <button className={topMode === "local" ? "active" : ""} onClick={() => setTopMode("local")}>Pass &amp; Play</button>
              <button className={topMode === "computer" ? "active" : ""} onClick={() => setTopMode("computer")}>Vs Bot</button>
              <button className={topMode === "online" ? "active" : ""} onClick={() => { setTopMode("online"); setOnlineStage("choice"); }}>Online</button>
            </div>

            {topMode === "local" && (
              <>
                <p>Choose how many players are sharing this device.</p>
                <div className="count-row">
                  {[2, 3, 4].map((n) => (
                    <button key={n} className={"count-btn" + (selectedCount === n ? " selected" : "")} onClick={() => setSelectedCount(n)}>{n}</button>
                  ))}
                </div>
                <div className="swatches">
                  {colorsForCount(selectedCount).map((c) => (
                    <div key={c} className="swatch" style={{ background: COLOR_HEX[c] }} />
                  ))}
                </div>
                <button className="start-btn" onClick={() => { play("tap"); buzz(15); modeRef.current = "local"; newGame(colorsForCount(selectedCount)); }}>Start Game</button>
              </>
            )}

            {topMode === "computer" && (
              <>
                <p>Play solo against a computer opponent. You're Yellow — the bot plays Red, diagonally opposite your base.</p>
                <div className="swatches">
                  <div style={{ position: "relative" }}>
                    <div className="swatch" style={{ background: COLOR_HEX.yellow }} />
                    <span className="swatch-tag">YOU</span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <div className="swatch" style={{ background: COLOR_HEX.red }} />
                    <span className="swatch-tag">BOT</span>
                  </div>
                </div>
                <button className="start-btn" onClick={() => { play("tap"); buzz(15); modeRef.current = "local"; newGame(["red", "yellow"], [true, false]); }}>Play vs Bot</button>
              </>
            )}

            {topMode === "online" && onlineStage === "choice" && (
              <>
                <p>Play a 1v1 race with a friend on a different device.</p>
                <button className="start-btn" onClick={beginCreateRoom}>Create Room</button>
                <input className="code-input" style={{ marginTop: 14 }} maxLength={5} placeholder="CODE" value={joinInput} onChange={(e) => setJoinInput(e.target.value)} />
                <div className="err-msg">{joinErr}</div>
                <button className="start-btn secondary" onClick={beginJoinRoom}>Join Room</button>
              </>
            )}
            {topMode === "online" && onlineStage === "hostWait" && (
              <>
                <p>Share this code with your friend</p>
                <div className="room-code-box">{roomCode}</div>
                <div className="spinner" />
                <div className="wait-note">Waiting for opponent to join…</div>
                <button className="start-btn secondary" onClick={cancelLobby}>Cancel</button>
              </>
            )}
            {topMode === "online" && onlineStage === "guestWait" && (
              <>
                <p>Joined room <strong>{roomCode}</strong></p>
                <div className="spinner" />
                <div className="wait-note">Waiting for the host to start…</div>
                <button className="start-btn secondary" onClick={cancelLobby}>Cancel</button>
              </>
            )}
          </div>
        )}

        {phase === "playing" && gs && (
          <div className="game-wrap">
            <button className="settings-btn" onClick={() => setShowSettings(s => !s)}><IconSettings /></button>
            {showSettings && (
              <div className="settings-dropdown">
                <button onClick={() => { setSoundOn(s => !s); }}>
                  <span className="sd-icon">{soundOn ? <IconSoundOn /> : <IconSoundOff />}</span>
                  {soundOn ? "Sound On" : "Sound Off"}
                </button>
                <button onClick={() => { setShowSettings(false); backToSetup(); }}>
                  <span className="sd-icon"><IconRefresh /></span>
                  New Game
                </button>
                {online && (
                  <button onClick={() => setShowSettings(false)} style={{ fontSize:11, color:'#c9b48f' }}>
                    <span className="sd-icon">📡</span>
                    Room {roomCode}
                  </button>
                )}
              </div>
            )}

            <div className="board-area">
              {(() => {
                const layout = getCardLayout(gs.players);
                const renderSlot = (color, isRight) => {
                  if (!color) return <div key={`empty-${isRight}`} style={{ width: 138 }} />;
                  const player = gs.players.find(p => p.color === color);
                  if (!player) return <div key={`empty-${color}`} style={{ width: 138 }} />;
                  const meta = PLAYER_META[color];
                  return (
                    <PlayerCard
                      key={color}
                      name={player.isBot ? "BOT" : meta.label}
                      avatarType={meta.avatarType}
                      color={meta.color}
                      accent={meta.accent}
                      isRight={isRight}
                      isActive={gs.players[gs.current]?.color === color}
                      diceValue={rollingColor === color ? diceFace : gs.dice}
                      isRolling={rollingColor === color}
                      onClick={() => { if (gs.players[gs.current]?.color === color) rollDice(); }}
                    />
                  );
                };
                return (
                  <>
                    <div className="top-row">
                      {renderSlot(layout.top[0], false)}
                      {renderSlot(layout.top[1], true)}
                    </div>
                    <div className="board-frame">
                      <canvas ref={canvasBoardRef} width={1000} height={1000}
                        style={{ width: '100%', height: '100%', borderRadius: '16px', cursor: 'pointer' }}
                        onClick={(e) => {
                          const canvas = canvasBoardRef.current;
                          if (!canvas || !boardMetaRef.current || !stateRef.current) return;
                          const rect = canvas.getBoundingClientRect();
                          const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
                          const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
                          const gs2 = stateRef.current;
                          const { bedMargin, gridStep, homeSlotCoords } = boardMetaRef.current;
                          gs2.players.forEach((player, pIdx) => {
                            player.tokens.forEach((tok, tIdx) => {
                              let px, py;
                              if (tok.step === -1) {
                                const slot = homeSlotCoords[player.color]?.[tIdx];
                                if (!slot) return;
                                px = slot.cx; py = slot.cy;
                              } else {
                                // Finished (WIN_STEP) tokens resolve to the last
                                // home-column cell via cellForToken, same as the
                                // board renderer — keeps click hit-testing lined
                                // up with where the pawn is actually drawn.
                                const [gr, gc] = cellForToken(player.color, tIdx, tok.step);
                                px = bedMargin + gc * gridStep + gridStep / 2;
                                py = bedMargin + gr * gridStep + gridStep / 2;
                              }
                              if (Math.hypot(clickX - px, clickY - py) < 28) onTokenClick(pIdx, tIdx);
                            });
                          });
                        }} />
                    </div>
                    <div className="bottom-row">
                      {renderSlot(layout.bottom[0], false)}
                      {renderSlot(layout.bottom[1], true)}
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="quick-msgs">
              {["Good move!", "Nice try!", "Watch out!", "Ha ha!", "Lucky!", "My turn!"].map((msg) => (
                <button key={msg} className="quick-msg-btn" onClick={() => { if (gs) { gs.msg = msg; rerender(); } }}>{msg}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={"winbox" + (showWin ? " active" : "")}>
        <div className="card">
          <h2>{gs && gs.winner != null ? `${NAME[gs.players[gs.winner].color]} wins!` : ""}</h2>
          <p>All four tokens made it home.</p>
          {online ? (
            <>
              {myColor === "red" ? (
                <button className="start-btn" onClick={() => { rematchOnline(); setShowWin(false); }}>Play Again</button>
              ) : (
                <div className="wait-note" style={{ marginBottom: 10 }}>Waiting for the host to start a rematch…</div>
              )}
              <button className="start-btn secondary" onClick={() => { setShowWin(false); leaveOnlineGame(); }}>Leave Room</button>
            </>
          ) : (
            <button className="start-btn" onClick={() => { setShowWin(false); backToSetup(); }}>Play Again</button>
          )}
        </div>
      </div>
    </div>
  );
}