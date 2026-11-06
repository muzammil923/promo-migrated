import { useState } from 'react';

export const DEFAULT_AVATARS = [
  {
    id: 'av-1', label: 'Phoenix',
    gradient: 'linear-gradient(135deg,#f97316,#dc2626)',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="url(#pg1)"/><defs><radialGradient id="pg1" cx="30%" cy="30%"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#dc2626"/></radialGradient></defs><path d="M50 15 C55 30 70 35 65 50 C72 42 78 55 68 65 C60 72 50 68 50 80 C50 68 40 72 32 65 C22 55 28 42 35 50 C30 35 45 30 50 15Z" fill="#fbbf24" opacity="0.9"/><circle cx="42" cy="48" r="4" fill="#1e1b4b"/><circle cx="58" cy="48" r="4" fill="#1e1b4b"/><path d="M42 60 Q50 68 58 60" stroke="#1e1b4b" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`
  },
  {
    id: 'av-2', label: 'Neon Cat',
    gradient: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="url(#pg2)"/><defs><radialGradient id="pg2" cx="30%" cy="30%"><stop offset="0%" stop-color="#f472b6"/><stop offset="100%" stop-color="#7c3aed"/></radialGradient></defs><path d="M28 28 L35 45 L22 42Z" fill="#f9a8d4"/><path d="M72 28 L65 45 L78 42Z" fill="#f9a8d4"/><ellipse cx="50" cy="55" rx="22" ry="20" fill="#fdf2f8"/><circle cx="42" cy="50" r="5" fill="#1e1b4b"/><circle cx="58" cy="50" r="5" fill="#1e1b4b"/><circle cx="43" cy="49" r="2" fill="#fff"/><circle cx="59" cy="49" r="2" fill="#fff"/><ellipse cx="50" cy="57" rx="3" ry="2" fill="#ec4899"/><path d="M44 62 Q50 67 56 62" stroke="#1e1b4b" stroke-width="2" fill="none" stroke-linecap="round"/><line x1="28" y1="52" x2="15" y2="48" stroke="#f9a8d4" stroke-width="1.5"/><line x1="28" y1="56" x2="14" y2="58" stroke="#f9a8d4" stroke-width="1.5"/><line x1="72" y1="52" x2="85" y2="48" stroke="#f9a8d4" stroke-width="1.5"/><line x1="72" y1="56" x2="86" y2="58" stroke="#f9a8d4" stroke-width="1.5"/></svg>`
  },
  {
    id: 'av-3', label: 'Cosmic Owl',
    gradient: 'linear-gradient(135deg,#6366f1,#0ea5e9)',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="url(#pg3)"/><defs><radialGradient id="pg3" cx="30%" cy="30%"><stop offset="0%" stop-color="#818cf8"/><stop offset="100%" stop-color="#0284c7"/></radialGradient></defs><ellipse cx="50" cy="52" rx="24" ry="22" fill="#1e1b4b"/><circle cx="40" cy="48" r="10" fill="#fbbf24"/><circle cx="60" cy="48" r="10" fill="#fbbf24"/><circle cx="40" cy="48" r="5" fill="#1e1b4b"/><circle cx="60" cy="48" r="5" fill="#1e1b4b"/><circle cx="42" cy="47" r="2" fill="#fff"/><circle cx="62" cy="47" r="2" fill="#fff"/><path d="M50 56 L47 62 L53 62Z" fill="#f97316"/><path d="M32 35 L38 45" stroke="#818cf8" stroke-width="3" stroke-linecap="round"/><path d="M68 35 L62 45" stroke="#818cf8" stroke-width="3" stroke-linecap="round"/></svg>`
  },
  {
    id: 'av-4', label: 'Cyber Robot',
    gradient: 'linear-gradient(135deg,#14b8a6,#22d3ee)',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="url(#pg4)"/><defs><radialGradient id="pg4" cx="30%" cy="30%"><stop offset="0%" stop-color="#5eead4"/><stop offset="100%" stop-color="#0891b2"/></radialGradient></defs><rect x="30" y="32" width="40" height="36" rx="10" fill="#0d1f2d"/><rect x="36" y="40" width="10" height="10" rx="3" fill="#22d3ee"/><rect x="54" y="40" width="10" height="10" rx="3" fill="#22d3ee"/><rect x="44" y="56" width="12" height="4" rx="2" fill="#22d3ee"/><line x1="50" y1="26" x2="50" y2="32" stroke="#5eead4" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="24" r="3" fill="#fbbf24"/><rect x="24" y="48" width="8" height="12" rx="4" fill="#0d1f2d"/><rect x="68" y="48" width="8" height="12" rx="4" fill="#0d1f2d"/></svg>`
  },
  {
    id: 'av-5', label: 'Golden Crown',
    gradient: 'linear-gradient(135deg,#f59e0b,#f97316)',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="url(#pg5)"/><defs><radialGradient id="pg5" cx="30%" cy="30%"><stop offset="0%" stop-color="#fde047"/><stop offset="100%" stop-color="#ea580c"/></radialGradient></defs><path d="M25 60 L20 35 L35 45 L50 25 L65 45 L80 35 L75 60Z" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/><rect x="25" y="60" width="50" height="10" rx="3" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/><circle cx="35" cy="65" r="3" fill="#ef4444"/><circle cx="50" cy="65" r="3" fill="#3b82f6"/><circle cx="65" cy="65" r="3" fill="#22c55e"/></svg>`
  },
  {
    id: 'av-6', label: 'Electric Wolf',
    gradient: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="url(#pg6)"/><defs><radialGradient id="pg6" cx="30%" cy="30%"><stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#be185d"/></radialGradient></defs><path d="M30 38 L40 48 L25 52Z" fill="#1e1b4b"/><path d="M70 38 L60 48 L75 52Z" fill="#1e1b4b"/><ellipse cx="50" cy="54" rx="22" ry="18" fill="#1e1b4b"/><circle cx="42" cy="50" r="6" fill="#fbbf24"/><circle cx="58" cy="50" r="6" fill="#fbbf24"/><circle cx="42" cy="50" r="3" fill="#1e1b4b"/><circle cx="58" cy="50" r="3" fill="#1e1b4b"/><circle cx="43" cy="49" r="1.5" fill="#fff"/><circle cx="59" cy="49" r="1.5" fill="#fff"/><ellipse cx="50" cy="58" rx="4" ry="3" fill="#a78bfa"/><path d="M42 64 Q50 70 58 64" stroke="#ec4899" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M36 38 L30 28" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/><path d="M64 38 L70 28" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/></svg>`
  },
];

export function getAvatarById(id) {
  return DEFAULT_AVATARS.find(a => a.id === id) || DEFAULT_AVATARS[0];
}

/* PromoGames avatars ship as inline SVG markup, but <img src> consumers
   (the landing-page testimonial reel) need a URL. Percent-encoding is what
   keeps the '#' in the gradient stop colors from truncating the data URI. */
export function avatarImageSrc(id) {
  return `data:image/svg+xml,${encodeURIComponent(getAvatarById(id).svg)}`;
}

export const AVATAR_IDS = DEFAULT_AVATARS.map(a => a.id);

const STYLES = `
  @keyframes av-glow { 0%,100%{box-shadow:0 0 12px rgba(46,207,184,0.5)} 50%{box-shadow:0 0 24px rgba(46,207,184,0.8)} }
  .av-card { position:relative; cursor:pointer; border-radius:16px; display:flex; flex-direction:column; align-items:center; justify-content:center; border:2px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.05); transition:all .2s ease; user-select:none; }
  .av-card:hover { transform:scale(1.08); border-color:rgba(255,255,255,0.2); box-shadow:0 4px 20px rgba(0,0,0,0.3); }
  .av-card.selected { border-color:#2ecfb8; animation:av-glow 2s ease-in-out infinite; }
  .av-check { position:absolute; top:4px; right:4px; width:20px; height:20px; border-radius:50%; background:#2ecfb8; display:flex; align-items:center; justify-content:center; font-size:11px; color:#0d1f2d; font-weight:800; opacity:0; transition:opacity .2s; }
  .av-card.selected .av-check { opacity:1; }
  .av-label { font-size:10px; color:rgba(255,255,255,0.5); margin-top:4px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; }
  .av-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; width:100%; max-width:340px; margin:0 auto; padding:16px 0; }
  @media(max-width:480px){ .av-grid{ grid-template-columns:repeat(3,1fr); gap:8px; max-width:300px; } }
`;

export function AvatarDisplay({ avatarId, size = 40, style = {} }) {
  const av = getAvatarById(avatarId);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: av.gradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      overflow: 'hidden',
      ...style,
    }} dangerouslySetInnerHTML={{ __html: av.svg.replace(/viewBox/, `width="${size}" height="${size}" viewBox`) }} />
  );
}

export function AvatarGrid({ selected, onSelect, size = 90 }) {
  return (
    <>
      <style>{STYLES}</style>
      <div className="av-grid">
        {DEFAULT_AVATARS.map(av => (
          <div
            key={av.id}
            className={`av-card${selected === av.id ? ' selected' : ''}`}
            style={{ width: size, height: size + 24, background: selected === av.id ? av.gradient : 'rgba(255,255,255,0.05)' }}
            onClick={() => onSelect(av.id)}
          >
            <div className="av-check">✓</div>
            <div style={{ width: size * 0.65, height: size * 0.65 }} dangerouslySetInnerHTML={{ __html: av.svg.replace(/viewBox/, `width="${size * 0.65}" height="${size * 0.65}" viewBox`) }} />
            <span className="av-label">{av.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
