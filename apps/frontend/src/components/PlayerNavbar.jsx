import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AvatarDisplay } from './AvatarData';
import { Home, Gamepad2, Gift, LogOut, Sparkles, User } from 'lucide-react';

const PUBLIC_LINKS = [
  { label: 'Play', href: '/arcade' },
  { label: 'Leaderboard', href: '/leaderboard' },
];

const DROPDOWN_ITEMS = [
  { label: 'Dashboard',       icon: Home, href: '/player/dashboard' },
  { label: 'Rewards',         icon: Gift, href: '/player/rewards' },
  { divider: true },
  { label: 'Profile',         icon: User, href: '/player/profile' },
  { label: 'Logout',          icon: LogOut, action: 'logout' },
];

const CSS = `
  .pn-wrap{position:fixed;top:0;left:0;right:0;z-index:1000;padding:18px 0;pointer-events:none;display:flex;justify-content:center}
  .pn-nav{pointer-events:all;width:62%;max-width:700px;min-width:580px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:0 20px;padding:11px 20px 11px 18px;border-radius:100px;background:rgba(7,4,15,0.88);backdrop-filter:blur(32px);-webkit-backdrop-filter:blur(32px);border:1px solid rgba(146,16,246,0.22);box-shadow:0 8px 48px rgba(0,0,0,0.60);position:relative}
  .pn-logo{display:flex;align-items:center;gap:10px;text-decoration:none}
  .pn-logo img{width:auto;height:60px;border-radius:9px;flex-shrink:0}
  .pn-links{list-style:none;display:flex;gap:26px;align-items:center;justify-content:center;margin:0;padding:0}
  .pn-links a{font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;color:rgba(255,255,255,0.52);text-decoration:none;position:relative;transition:color .22s}
  .pn-links a::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:2px;background:linear-gradient(90deg,#9210f6,#7C3AED);transition:width .25s}
  .pn-links a:hover{color:#fff}
  .pn-links a:hover::after{width:100%}
  .pn-links a.active{color:#fff}
  .pn-links a.active::after{width:100%}
  .pn-cta{position:relative;overflow:hidden;display:inline-flex;align-items:center;height:38px;padding:0 22px;border-radius:100px;border:none;background:linear-gradient(90deg,#610497,#9210f6);text-decoration:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:700;font-size:13px;color:#fff;transition:opacity .2s;white-space:nowrap}
  .pn-cta:hover{opacity:.85}
  .pn-avatar-wrap{position:relative;justify-self:end}
  .pn-avatar-btn{width:38px;height:38px;border-radius:50%;border:2px solid rgba(146,16,246,0.4);background:linear-gradient(135deg,#6366f1,#a855f7);cursor:pointer;padding:0;transition:all .25s;overflow:hidden;flex-shrink:0}
  .pn-avatar-btn:hover{border-color:#9210f6;box-shadow:0 0 20px rgba(146,16,246,0.5)}
  .pn-dropdown{position:absolute;top:calc(100% + 10px);right:0;width:230px;background:rgba(7,4,15,0.92);backdrop-filter:blur(32px);-webkit-backdrop-filter:blur(32px);border:1px solid rgba(146,16,246,0.22);border-radius:16px;padding:8px;box-shadow:0 12px 48px rgba(0,0,0,0.6),0 0 0 0.5px rgba(146,16,246,0.08) inset;opacity:0;transform:translateY(-8px) scale(0.96);pointer-events:none;transition:all .2s ease}
  .pn-dropdown.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
  .pn-dd-header{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:4px}
  .pn-dd-name{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;color:#fff}
  .pn-dd-email{font-family:'DM Sans',sans-serif;font-size:11px;color:rgba(255,255,255,0.4)}
  .pn-dd-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;color:rgba(255,255,255,0.65);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;text-decoration:none;border:none;background:none;width:100%;text-align:left}
  .pn-dd-item:hover{background:rgba(146,16,246,0.12);color:#fff}
  .pn-dd-item.active{color:#c040ff}
  .pn-dd-icon{width:24px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .pn-dd-divider{height:1px;background:rgba(255,255,255,0.06);margin:4px 12px}
  .pn-ham{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:4px}
  .pn-ham span{display:block;width:22px;height:2px;background:#fff;border-radius:2px;transition:all .3s}
  .pn-ham.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
  .pn-ham.open span:nth-child(2){opacity:0}
  .pn-ham.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
  .pn-mob-overlay{display:none;position:fixed;inset:0;top:74px;background:rgba(7,4,15,0.97);backdrop-filter:blur(20px);z-index:999;flex-direction:column;align-items:center;justify-content:center;gap:30px}
  .pn-mob-overlay.open{display:flex}
  .pn-mob-overlay a,.pn-mob-overlay button{font-family:'DM Sans',sans-serif;font-size:26px;color:#fff;text-decoration:none;opacity:.80;transition:opacity .2s;letter-spacing:2px;background:none;border:none;cursor:pointer}
  .pn-mob-overlay a:hover,.pn-mob-overlay button:hover{opacity:1}
  .pn-mob-cta{margin-top:8px;padding:14px 40px;border-radius:100px;background:linear-gradient(90deg,#610497,#9210f6)!important;color:#fff!important;font-size:17px!important;font-weight:700!important;letter-spacing:0!important}
  .pn-mob-avatar{display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:16px}
  .pn-mob-name{font-family:'DM Sans',sans-serif;font-size:16px;font-weight:700;color:#fff;letter-spacing:0}
  /* Hanging wire */
  .pn-wire-wrap{position:absolute;top:100%;left:50%;transform:translateX(-50%);width:2px;display:flex;flex-direction:column;align-items:center;pointer-events:none;z-index:100000}
  .pn-wire{width:2px;background:linear-gradient(180deg,rgba(146,16,246,0.6),rgba(146,16,246,0.15));border-radius:1px;transition:height .4s cubic-bezier(.22,1,.36,1)}
  .pn-wire-handle{
    width:28px;height:28px;border-radius:50%;
    background:linear-gradient(135deg,#9210f6,#610497);
    border:2px solid rgba(255,255,255,0.25);
    box-shadow:0 4px 20px rgba(146,16,246,0.5),0 0 12px rgba(146,16,246,0.3);
    cursor:grab;pointer-events:all;
    display:flex;align-items:center;justify-content:center;
    transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s;
    margin-top:-1px;
    animation:wireDangle 3s ease-in-out infinite;
  }
  .pn-wire-handle:active{cursor:grabbing;transform:scale(1.15);box-shadow:0 6px 28px rgba(146,16,246,0.7),0 0 20px rgba(146,16,246,0.4)}
  .pn-wire-handle svg{width:14px;height:14px;color:#fff}
  @keyframes wireDangle{0%,100%{transform:translateX(0) rotate(0deg)}25%{transform:translateX(2px) rotate(2deg)}75%{transform:translateX(-2px) rotate(-2deg)}}
  .pn-wire-mascot{
    margin-top:8px;width:70px;position:relative;
    animation:mascotBounce 3s ease-in-out infinite;
    filter:drop-shadow(0 4px 16px rgba(146,16,246,0.35));
    transition:opacity .15s;
  }
  .pn-wire-mascot.hidden{opacity:0;visibility:hidden;pointer-events:none}
  .pn-wire-mascot img{width:100%;height:auto;display:block}
  .pn-mascot-bubble{
    position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%);
    min-width:160px;max-width:200px;padding:10px 14px;
    background:rgba(20,8,40,0.95);border:1px solid rgba(146,16,246,0.4);border-radius:14px;
    font-family:'DM Sans',sans-serif;font-size:11px;line-height:1.5;color:#e0d0ff;text-align:center;
    box-shadow:0 6px 24px rgba(0,0,0,0.5),0 0 12px rgba(146,16,246,0.2);
    opacity:0;transform:translateX(-50%) translateY(6px) scale(0.9);
    transition:opacity .3s ease,transform .3s ease;pointer-events:none;white-space:nowrap;z-index:20;
  }
  .pn-mascot-bubble.show{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}
  .pn-mascot-bubble::after{
    content:'';position:absolute;bottom:-6px;left:50%;margin-left:-5px;
    width:10px;height:10px;background:rgba(20,8,40,0.95);
    border-right:1px solid rgba(146,16,246,0.4);border-bottom:1px solid rgba(146,16,246,0.4);
    transform:rotate(45deg);
  }
  .pn-wire-mascot .pn-mascot-r,.pn-wire-mascot .pn-mascot-b{
    position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen;opacity:0
  }
  .pn-wire-mascot .pn-mascot-scanlines{
    position:absolute;inset:0;pointer-events:none;z-index:10;
    background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.12) 2px,rgba(0,0,0,0.12) 4px);opacity:0
  }
  @keyframes mascotBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  .pn-wire-mascot.glitch-in{animation:smallGlitchIn .6s steps(1) forwards}
  .pn-wire-mascot.glitch-in .pn-mascot-r{animation:pRGB_R_IN .6s steps(1) forwards}
  .pn-wire-mascot.glitch-in .pn-mascot-b{animation:pRGB_B_IN .6s steps(1) forwards}
  .pn-wire-mascot.glitch-in .pn-mascot-scanlines{animation:pScan_IN .6s steps(1) forwards}
  .pn-wire-mascot.glitch-out{animation:smallGlitchOut .5s steps(1) forwards}
  .pn-wire-mascot.glitch-out .pn-mascot-r{animation:pRGB_R_OUT .5s steps(1) forwards}
  .pn-wire-mascot.glitch-out .pn-mascot-b{animation:pRGB_B_OUT .5s steps(1) forwards}
  .pn-wire-mascot.glitch-out .pn-mascot-scanlines{animation:pScan_OUT .5s steps(1) forwards}
  @keyframes smallGlitchIn{
    0%{opacity:0;transform:translateY(-20px) scale(0.8);clip-path:inset(0 0 100% 0)}
    5%{opacity:1;transform:translate(6px,-2px) skewX(5deg);clip-path:inset(10% 0 60% 0)}
    10%{opacity:0.7;transform:translate(-10px,2px) skewX(-7deg);clip-path:inset(30% 0 20% 0);filter:hue-rotate(40deg) drop-shadow(3px 0 6px rgba(255,0,100,0.6))}
    15%{opacity:1;transform:translate(4px,-1px) skewX(3deg);clip-path:inset(5% 0 70% 0);filter:hue-rotate(-30deg) drop-shadow(-2px 0 5px rgba(0,200,255,0.5))}
    20%{opacity:0.8;transform:translate(-6px,3px) skewX(-4deg);clip-path:inset(40% 0 10% 0);filter:hue-rotate(60deg)}
    25%{opacity:1;transform:translate(2px,-1px);clip-path:inset(15% 0 45% 0);filter:none}
    35%{opacity:1;transform:translate(-1px,0);clip-path:inset(8% 0 55% 0)}
    50%{opacity:1;transform:translate(0,0);clip-path:inset(0)}
    100%{opacity:1;transform:translate(0,0) scale(1);clip-path:inset(0);animation:mascotBounce 3s ease-in-out infinite}
  }
  @keyframes smallGlitchOut{
    0%{opacity:1;transform:translate(0,0) scale(1);clip-path:inset(0)}
    10%{opacity:1;transform:translate(-5px,2px) skewX(-4deg);clip-path:inset(10% 0 50% 0);filter:hue-rotate(-30deg) drop-shadow(3px 0 6px rgba(255,0,100,0.5))}
    15%{opacity:0.8;transform:translate(8px,-3px) skewX(6deg);clip-path:inset(30% 0 20% 0);filter:hue-rotate(50deg) drop-shadow(-3px 0 7px rgba(0,200,255,0.6))}
    20%{opacity:0.9;transform:translate(-4px,1px) skewX(-3deg);clip-path:inset(5% 0 60% 0);filter:hue-rotate(-40deg)}
    30%{opacity:0.5;transform:translate(3px,-2px);clip-path:inset(20% 0 40% 0);filter:none}
    40%{opacity:0.3;transform:translate(-2px,1px);clip-path:inset(50% 0 25% 0)}
    55%{opacity:0.1;transform:translate(0,0);clip-path:inset(30% 0 50% 0)}
    70%{opacity:0;transform:translate(0,0);clip-path:inset(50% 0 50% 0)}
    100%{opacity:0;transform:translate(0,0) scale(0.9);clip-path:inset(50% 0 50% 0);visibility:hidden}
  }
  @keyframes pRGB_R_IN{
    0%{opacity:0}5%{opacity:0.6;transform:translate(5px,-2px);filter:hue-rotate(-30deg) saturate(2)}
    15%{opacity:0.5;transform:translate(-3px,1px);filter:hue-rotate(20deg)}30%{opacity:0.2}50%{opacity:0}100%{opacity:0}
  }
  @keyframes pRGB_B_IN{
    0%{opacity:0}5%{opacity:0.5;transform:translate(-4px,2px);filter:hue-rotate(50deg) saturate(2)}
    15%{opacity:0.4;transform:translate(3px,-1px);filter:hue-rotate(-40deg)}30%{opacity:0.15}50%{opacity:0}100%{opacity:0}
  }
  @keyframes pScan_IN{
    0%{opacity:0}5%{opacity:0.5}15%{opacity:0.3}25%{opacity:0.4}40%{opacity:0.15}55%{opacity:0}100%{opacity:0}
  }
  @keyframes pRGB_R_OUT{
    0%{opacity:0}5%{opacity:0.3;transform:translate(4px,-2px);filter:hue-rotate(-40deg) saturate(2)}
    15%{opacity:0.5;transform:translate(-6px,2px);filter:hue-rotate(40deg) saturate(2.5)}
    25%{opacity:0.4;transform:translate(2px,-1px)}40%{opacity:0.2}60%{opacity:0}100%{opacity:0}
  }
  @keyframes pRGB_B_OUT{
    0%{opacity:0}5%{opacity:0.35;transform:translate(-3px,2px);filter:hue-rotate(50deg) saturate(2)}
    15%{opacity:0.5;transform:translate(5px,-2px);filter:hue-rotate(-50deg) saturate(2.5)}
    25%{opacity:0.35;transform:translate(-2px,1px)}40%{opacity:0.15}60%{opacity:0}100%{opacity:0}
  }
  @keyframes pScan_OUT{
    0%{opacity:0}5%{opacity:0.3}15%{opacity:0.5}25%{opacity:0.4}40%{opacity:0.3}55%{opacity:0.1}70%{opacity:0}100%{opacity:0}
  }
  .pn-logo-desktop{display:block}
  .pn-logo-mobile{display:none}
  @media(max-width:1100px){.pn-nav{width:78%}}
  @media(max-width:900px){
    .pn-links,.pn-cta,.pn-wire-wrap{display:none}
    .pn-ham{display:flex}
    .pn-wrap{padding:12px 20px;display:block}
    .pn-nav{width:100%;max-width:100%;min-width:unset;padding:10px 20px;border-radius:18px}
    .pn-logo-desktop{display:none}
    .pn-logo-mobile{display:block}
  }
  @media(min-width:901px){.pn-mob-overlay{display:none!important}}
`;

export default function PlayerNavbar() {
  const [player, setPlayer] = useState(null);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mascotGlitch, setMascotGlitch] = useState('visible');
  const [bubbleText, setBubbleText] = useState('');
  const [bubbleShow, setBubbleShow] = useState(false);
  const ddRef = useRef(null);
  const wireRef = useRef(null);
  const [wireDragging, setWireDragging] = useState(false);
  const wireStartY = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  /* Mascot popup messages */
  const MASCOT_MSGS = [
    'Pull the trigger to play a quick game!',
    'Drag me down to start!',
    'Ready to play? Pull down!',
    'Spin the wheel of rewards!',
    'Try your luck today!',
  ];
  useEffect(() => {
    let idx = 0;
    const show = () => {
      setBubbleText(MASCOT_MSGS[idx % MASCOT_MSGS.length]);
      setBubbleShow(true);
      setTimeout(() => setBubbleShow(false), 3500);
      idx++;
    };
    const t1 = setTimeout(show, 1500);
    const timer = setInterval(show, 8000);
    return () => { clearTimeout(t1); clearInterval(timer); };
  }, []);

  useEffect(() => {
    const readPlayer = () => {
      const stored = localStorage.getItem('playerUser') || sessionStorage.getItem('playerUser');
      if (stored) {
        try { setPlayer(JSON.parse(stored)); } catch {}
      }
    };
    readPlayer();
    window.addEventListener('player-updated', readPlayer);
    return () => window.removeEventListener('player-updated', readPlayer);
  }, [location.pathname]);

  /* Listen for mascot-switch events (auto 5s cycle) */
  useEffect(() => {
    const handler = (e) => {
      const { phase, activeMascot } = e.detail;
      if (activeMascot === 'small' && phase === 'glitch-in') {
        setMascotGlitch('glitch-in');
        setTimeout(() => setMascotGlitch('visible'), 600);
      } else if (activeMascot === 'small' && phase === 'glitch-out') {
        setMascotGlitch('glitch-out');
        setTimeout(() => setMascotGlitch('hidden'), 500);
      } else if (activeMascot === 'big' && phase === 'glitch-out') {
        setMascotGlitch('glitch-out');
        setTimeout(() => setMascotGlitch('hidden'), 500);
      } else if (activeMascot === 'big' && phase === 'glitch-in') {
        setMascotGlitch('glitch-in');
        setTimeout(() => setMascotGlitch('visible'), 600);
      }
    };
    window.addEventListener('mascot-switch', handler);
    return () => window.removeEventListener('mascot-switch', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ddRef.current && !ddRef.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc); };
  }, [open]);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  /* Wire drag handlers */
  const onWireDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setWireDragging(true);
    wireStartY.current = e.clientY || e.touches?.[0]?.clientY || 0;
  };
  useEffect(() => {
    if (!wireDragging) return;
    const onMove = (e) => {
      const y = e.clientY || e.touches?.[0]?.clientY || 0;
      const dy = y - wireStartY.current;
      if (dy > 120) {
        setWireDragging(false);
        const el = document.getElementById('cta-final');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    };
    const onUp = () => setWireDragging(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
  }, [wireDragging]);

  const isActive = (href) => location.pathname === href;

  const handleClick = (item) => {
    if (item.action === 'logout') {
      localStorage.removeItem('playerToken');
      localStorage.removeItem('playerUser');
      sessionStorage.removeItem('playerToken');
      sessionStorage.removeItem('playerUser');
      setPlayer(null);
      navigate('/');
    } else {
      navigate(item.href);
    }
    setOpen(false);
  };

  const isAuth = !!player;
  const showTrigger = location.pathname === '/';
  const visibleDropdown = DROPDOWN_ITEMS.filter(item => {
    if (item.divider) return true;
    return location.pathname !== item.href;
  });

  return (
    <>
      <style>{CSS}</style>
      <div className="pn-wrap">
        <nav className="pn-nav">
          <a href="/" className="pn-logo">
            <img src="/favicon2.png" alt="Promogames" className="pn-logo-desktop" width="320" height="120" />
            <img src="/favicon.png" alt="Promogames" className="pn-logo-mobile" width="128" height="128" />
          </a>

          <ul className="pn-links">
            {PUBLIC_LINKS.map(n => (
              <li key={n.href}>
                <a href={n.href} className={location.pathname === n.href ? 'active' : ''}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>

          {isAuth ? (
              <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{lineHeight:1.2}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,color:'#fff',whiteSpace:'nowrap',textAlign:'right',display:'flex',alignItems:'center',gap:4,justifyContent:'flex-end'}}>Hi, {player.name?.split(' ')[0]} <Sparkles size={14} color="#c084fc" /></div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:'rgba(255,255,255,0.45)',fontWeight:500,whiteSpace:'nowrap',marginTop:1,textAlign:'right'}}>Welcome back</div>
              </div>
              <div className="pn-avatar-wrap" ref={ddRef}>
              <button className="pn-avatar-btn" onClick={() => setOpen(!open)} title="Account menu">
                <AvatarDisplay avatarId={player.avatar_id} size={34} style={{ border: 'none', background: 'transparent' }} />
              </button>
              <div className={`pn-dropdown${open ? ' open' : ''}`}>
                <div className="pn-dd-header">
                  <AvatarDisplay avatarId={player.avatar_id} size={32} style={{ border: 'none' }} />
                  <div>
                    <div className="pn-dd-name">{player.name}</div>
                    <div className="pn-dd-email">{player.email}</div>
                  </div>
                </div>
                {visibleDropdown.map((item, i) => item.divider ? (
                  <div key={i} className="pn-dd-divider" />
                ) : (
                  <button
                    key={i}
                    className={`pn-dd-item${isActive(item.href) ? ' active' : ''}`}
                    onClick={() => handleClick(item)}
                  >
                    <span className="pn-dd-icon"><item.icon size={16} /></span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <a href="/login" className="pn-cta">Login</a>
              {showTrigger && (
              <div className="pn-wire-wrap" ref={wireRef}>
                <div className="pn-wire" style={{ height: wireDragging ? 80 : 40, transition: wireDragging ? 'none' : 'height .4s cubic-bezier(.22,1,.36,1)' }} />
                <div
                  className="pn-wire-handle"
                  onMouseDown={onWireDown}
                  onTouchStart={onWireDown}
                  style={wireDragging ? { animation: 'none', transform: 'scale(1.15)' } : {}}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                {/* Small mascot below the pulling trigger */}
                <div className={`pn-wire-mascot${mascotGlitch === 'visible' ? '' : mascotGlitch === 'hidden' ? ' hidden' : ' ' + mascotGlitch}`}>
                  <div className={`pn-mascot-bubble${bubbleShow ? ' show' : ''}`}>{bubbleText}</div>
                  <img src="/mascotques.webp" alt="Mascot" width="256" height="256" />
                  {mascotGlitch === 'glitch-in' && (
                    <>
                      <img src="/mascotques.webp" alt="" className="pn-mascot-r" width="256" height="256" />
                      <img src="/mascotques.webp" alt="" className="pn-mascot-b" width="256" height="256" />
                      <div className="pn-mascot-scanlines" />
                    </>
                  )}
                </div>
              </div>
              )}
            </div>
          )}

          <button
            className={`pn-ham${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </nav>
      </div>

      <div className={`pn-mob-overlay${menuOpen ? ' open' : ''}`}>
        {isAuth && (
          <div className="pn-mob-avatar">
            <AvatarDisplay avatarId={player.avatar_id} size={56} style={{ border: '3px solid rgba(146,16,246,0.3)' }} />
            <span className="pn-mob-name">{player.name}</span>
          </div>
        )}
        {PUBLIC_LINKS.map(n => (
          <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)}>{n.label}</a>
        ))}
        {isAuth ? (
          <button className="pn-mob-cta" onClick={() => { setMenuOpen(false); navigate('/player/dashboard'); }}>
            Dashboard
          </button>
        ) : (
          <a href="/login" className="pn-mob-cta">Login</a>
        )}
      </div>
    </>
  );
}
