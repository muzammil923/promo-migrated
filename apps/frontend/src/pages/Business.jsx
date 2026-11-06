import { useState, useEffect, useRef, useCallback } from "react";
import CountUp from "../components/CountUp";
import MascotBubble from "../components/MascotBubble";
import MascotCursor from "../components/MascotCursor";
import { CoverflowCarousel } from "../components/ui/coverflow-carousel";

const Arr = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ─── DATA ─────────────────────────────────────────── */
const NAV = [
  { label: "Play",        href: "/arcade"     },
  { label: "Leaderboard", href: "/leaderboard" },
];

const FOOTER_NAV = [
  ["Play Now", "/arcade"],
  ["Leaderboard", "/leaderboard"],
  ["Business", "/business"],
  ["Log In", "/login"],
];

const GAME_DROPDOWN = [
  { icon: "🧩", label: "Quiz Game"    },
  { icon: "🎁", label: "Scratch Cards"},
  { icon: "🏆", label: "Contests"     },
];

const SERVICES = [
  { title: "Giveaway Formats",        desc: "Entry-based giveaways, Instagram contests, story challenges, and multi-platform prize draws that generate massive organic reach for your brand across social platforms.",                          tag: "Giveaway",    emoji: "🎉", img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900&q=85&fit=crop" },
  { title: "Quiz-Based Engagement",   desc: "Time-based quizzes, brand trivia, personality tests, and predict-to-win formats. Perfect for educating audiences while generating qualified leads for your marketing funnel.",                    tag: "Quiz",        emoji: "🧩", img: "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=900&q=85&fit=crop" },
  { title: "Contest Campaigns",       desc: "User voting contests, photo & reel submissions, hashtag campaigns, and UGC challenges that amplify brand storytelling through authentic customer-generated content.",                             tag: "Contest",     emoji: "🏆", img: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&q=85&fit=crop" },
  { title: "Instant Reward Games",    desc: "Spin-the-wheel, scratch cards, reveal-to-win mechanics, and coupon distribution that deliver instant gratification and drive purchase intent at the moment of peak engagement.",               tag: "Rewards",     emoji: "🎡", img: "https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=900&q=85&fit=crop" },
];

const HEX_FEATURES = [
  { id: "quiz",        icon: "🧩", label: "Quiz Games",          color: "#9210f6", short: "Brand education meets lead gen",          desc: "Time-based quizzes, trivia, personality tests, and predict-to-win formats that educate your audience while capturing qualified leads for your marketing pipeline.",                                       stat: "20+",   statLabel: "games played",       tags: ["Brand Trivia", "Personality Tests", "Predict & Win"]      },
  { id: "scratch",     icon: "🎁", label: "Scratch Cards",        color: "#610497", short: "Instant reveals & coupon magic",          desc: "Digital scratch card mechanics deliver the thrill of instant reward. Customisable prize pools, coupon codes, and reveal animations create addictive brand touchpoints.",                                      stat: "50+", statLabel: "leads generated",    tags: ["Instant Win", "Coupons", "Reveal Animation"]               },
  { id: "spin",        icon: "🎡", label: "Spin the Wheel",       color: "#7C3AED", short: "High-converting reward mechanics",        desc: "Spin-the-wheel experiences create a dopamine loop that keeps users engaged. Configure prize weights, visual themes, and redemption flows that match your campaign goals.",                                 stat: "3.2×",  statLabel: "conversion boost",   tags: ["Prize Configuration", "Visual Themes", "Redemption Flow"]  },
  { id: "giveaway",    icon: "🎉", label: "Giveaways",            color: "#4F46E5", short: "Viral reach at scale",                    desc: "Entry-based giveaways, Instagram story challenges, and multi-platform draws that generate enormous organic reach. Automated winner selection and fraud prevention included.",                              stat: "10+", statLabel: "campaigns run",      tags: ["Multi-Platform", "Auto Selection", "Fraud Prevention"]     },
  { id: "contest",     icon: "🏆", label: "Contests",             color: "#9210f6", short: "UGC that amplifies brand stories",        desc: "Photo contests, reel submissions, hashtag campaigns, and user voting mechanics generate authentic content that resonates with audiences and builds lasting brand affinity.",                              stat: "10+",  statLabel: "happy clients",      tags: ["Photo Contests", "Hashtag Campaigns", "User Voting"]       },
  { id: "casual",      icon: "🕹️", label: "Casual Games",         color: "#610497", short: "Play longer, remember more",             desc: "Tile match, memory games, word scramble, quiz towers, and custom branded puzzlers keep users engaged for minutes — not seconds. Longer dwell time means stronger brand recall.",                            stat: "4.8×",  statLabel: "dwell time boost",   tags: ["Tile Match", "Word Scramble", "Brand Puzzlers"]            },
  { id: "multilevel",  icon: "📅", label: "Multi-Level",          color: "#7C3AED", short: "Campaign journeys that retain",          desc: "Score-based progression rounds, voting stages, and calendar-based journey mechanics keep audiences returning day after day. Perfect for product launches and seasonal campaigns.",                            stat: "94%",   statLabel: "return play rate",   tags: ["Score Rounds", "Daily Unlock", "Seasonal Campaigns"]       },
  { id: "analytics",  icon: "📊", label: "Analytics",             color: "#4F46E5", short: "Data that drives decisions",             desc: "Real-time campaign dashboards show participation rates, lead quality scores, geographic heatmaps, and conversion funnels. Export-ready reports for every campaign.",                                            stat: "60+",   statLabel: "data metrics",       tags: ["Live Dashboard", "Lead Scoring", "Heatmaps"]               },
  { id: "leads",       icon: "🎯", label: "Lead Capture",         color: "#9210f6", short: "Every play generates pipeline",          desc: "Seamlessly collect verified contact details, preferences, and consents as part of the game flow. CRM integrations push leads directly to Salesforce, HubSpot, and 40+ platforms.",                         stat: "40+",   statLabel: "CRM integrations",   tags: ["Verified Leads", "CRM Sync", "Consent Management"]         },
  { id: "whitelabel",  icon: "🎨", label: "White Label",          color: "#610497", short: "100% your brand, 0% our footprint",      desc: "Every game experience is fully white-labelled — your logo, colours, domain, and tone of voice. Clients and customers will only ever see your brand, not ours.",                                               stat: "100%",  statLabel: "brand ownership",    tags: ["Custom Domain", "Brand Colours", "Your Logo"]              },
  { id: "security",    icon: "🛡️", label: "Security",             color: "#7C3AED", short: "Enterprise-grade data protection",      desc: "GDPR-compliant data handling, encrypted lead storage, fraud-detection algorithms, and role-based access controls ensure your campaigns and customer data stay protected.",                                    stat: "",      statLabel: "certified",          tags: ["GDPR Compliant", "Encrypted Storage", "Fraud Detection"]   },
];

const HEX_ROWS = [
  { offset: false, ids: [0, 1, 2, 3]   },
  { offset: true,  ids: [4, 5, 6]      },
  { offset: false, ids: [7, 8, 9, 10]  },
];

const BRANDS = [
  { id: 1, name: "Enterprise",    tag: "ENTERPRISE",    headline: "Brand Engagement at Scale",         color: "#9210f6", bullets: ["10K+ concurrent players", "Multi-brand management", "Dedicated account manager", "White-label platform"],            img: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&q=80&fit=crop" },
  { id: 2, name: "FMCG",         tag: "FMCG",          headline: "Drive Trial & Repeat Purchase",     color: "#610497", bullets: ["SKU-level gamification", "POS integration", "Coupon distribution", "Retail activation"],                              img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=700&q=80&fit=crop" },
  { id: 3, name: "E-commerce",    tag: "E-COMMERCE",    headline: "Convert Browsers into Buyers",      color: "#7C3AED", bullets: ["Cart abandonment games", "Flash-sale spin wheels", "Loyalty programme", "Checkout scratch cards"],                    img: "https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=700&q=80&fit=crop" },
  { id: 4, name: "D2C Brands",    tag: "D2C",           headline: "Build Community & Loyalty",         color: "#4F46E5", bullets: ["Subscriber growth games", "UGC photo contests", "Referral quizzes", "Brand ambassador contests"],                     img: "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=700&q=80&fit=crop" },
  { id: 5, name: "Agencies",      tag: "AGENCIES",      headline: "Gamify Every Client Campaign",      color: "#9210f6", bullets: ["Multi-client dashboard", "White-label reseller", "Campaign templates", "Priority support"],                           img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=700&q=80&fit=crop" },
  { id: 6, name: "EdTech",        tag: "EDTECH",        headline: "Learning That Feels Like Play",     color: "#610497", bullets: ["Knowledge quizzes", "Leaderboards", "Badge & reward systems", "Course completion games"],                             img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&q=80&fit=crop" },
  { id: 7, name: "Events",        tag: "EVENTS",        headline: "Make Every Moment Memorable",       color: "#7C3AED", bullets: ["On-site game activations", "QR-triggered experiences", "Live leaderboards", "Prize fulfilment"],                      img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=700&q=80&fit=crop" },
  { id: 8, name: "Media",         tag: "MEDIA",         headline: "Monetise Your Audience",            color: "#4F46E5", bullets: ["Sponsored game integrations", "Audience segmentation", "Advertiser analytics", "Content-to-game pipelines"],          img: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=700&q=80&fit=crop" },
];

const STATS = [
  { val: "20+",   label: "Games Played"     },
  { val: "50+", label: "Leads Generated"  },
  { val: "10+", label: "Campaigns Run"    },
  { val: "10+",  label: "Happy Clients"    },
];

const CHANGING_TEXTS = ["Interactive Games", "Viral Giveaways", "Scratch Cards", "Brand Quizzes", "Spin the Wheel"];

/* ─── CSS ──────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Prata&family=Karla:wght@300;400;500;600;700;800&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0514;
  --purple:#9210f6;
  --purple2:#610497;
  --purple3:#7C3AED;
  --purple4:#4F46E5;
  --glass:rgba(255,255,255,0.06);
  --gb:rgba(255,255,255,0.12);
  --muted:rgba(255,255,255,0.58);
  --fh:'Prata',serif;
  --fb:'Karla',sans-serif;
  --cream:#fdecfd;
  --pink-bg:linear-gradient(135deg,#1a0a2e 0%,#0f0520 50%,#0a0514 100%);
}
html{scroll-behavior:smooth}
body{font-family:var(--fb);background:var(--bg);color:#fff;overflow-x:hidden;-webkit-font-smoothing:antialiased;cursor:none;max-width:100vw}
img{display:block;max-width:100%}
::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--purple);border-radius:3px}

.scroll-bar{
  position:fixed;top:0;left:0;height:3px;z-index:9999;
  background:linear-gradient(90deg,var(--purple),var(--purple3),var(--purple4));
  width:var(--scroll-pct,0%);
  transition:width .05s linear;
  box-shadow:0 0 12px var(--purple),0 0 24px rgba(146,16,246,0.5);
}

.cursor-dot{
  position:fixed;top:0;left:0;pointer-events:none;z-index:99999;
  width:8px;height:8px;border-radius:50%;
  background:var(--purple);
  transform:translate(-50%,-50%);
  transition:width .2s,height .2s,background .2s,opacity .2s;
  box-shadow:0 0 10px var(--purple),0 0 20px rgba(146,16,246,0.6);
}
.cursor-ring{
  position:fixed;top:0;left:0;pointer-events:none;z-index:99998;
  width:38px;height:38px;border-radius:50%;
  border:1.5px solid rgba(146,16,246,0.55);
  transform:translate(-50%,-50%);
  transition:width .35s cubic-bezier(.22,1,.36,1),height .35s cubic-bezier(.22,1,.36,1),border-color .3s,opacity .3s;
}
body.cursor-hover .cursor-dot{width:14px;height:14px;background:#fff;box-shadow:0 0 16px #fff}
body.cursor-hover .cursor-ring{width:54px;height:54px;border-color:rgba(146,16,246,0.9);background:rgba(146,16,246,0.06)}
body:not(.cursor-visible) .cursor-dot,body:not(.cursor-visible) .cursor-ring{opacity:0}

@keyframes shimmerSweep{0%{background-position:-200% center}100%{background-position:200% center}}
.shimmer-card{position:relative;overflow:hidden}
.shimmer-card::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.09) 50%,transparent 65%);
  background-size:200% 100%;animation:shimmerSweep 3.8s ease-in-out infinite;pointer-events:none;z-index:20;border-radius:inherit;
}
.shimmer-card:hover::after{animation:shimmerSweep 1.4s ease-in-out infinite;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.16) 50%,transparent 70%);background-size:200% 100%}

/* NAV */
.nav-wrap{position:fixed;top:0;left:0;right:0;z-index:1000;padding:18px 0;pointer-events:none;display:flex;justify-content:center}
.navbar{pointer-events:all;width:62%;max-width:700px;min-width:580px;display:flex;align-items:center;justify-content:space-between;padding:11px 20px 11px 18px;border-radius:100px;background:rgba(10,5,20,0.82);backdrop-filter:blur(32px);-webkit-backdrop-filter:blur(32px);border:1px solid rgba(146,16,246,0.22);box-shadow:0 8px 48px rgba(0,0,0,0.60),0 0 0 0.5px rgba(146,16,246,0.08) inset}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none}
.nav-links{list-style:none;display:flex;gap:26px;align-items:center;position:relative}
.nav-links a{font-family:var(--fb);font-size:14px;font-weight:600;color:var(--muted);text-decoration:none;position:relative;transition:color .22s;cursor:none}
.nav-links a::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:2px;background:linear-gradient(90deg,var(--purple),var(--purple3));transition:width .25s}
.nav-links a:hover{color:#fff}
.nav-links a:hover::after{width:100%}
.nav-divider{width:1px;height:22px;background:rgba(255,255,255,0.15);margin:0 4px}
.login-link{font-family:var(--fb);font-size:13.5px;font-weight:700;color:#fff!important;padding:7px 18px;border-radius:100px;border:1px solid rgba(146,16,246,0.45)!important;background:rgba(146,16,246,0.12);transition:background .2s,border-color .2s!important;cursor:none; margin-right:40px;}
.login-link:hover{background:rgba(146,16,246,0.28)!important;border-color:rgba(146,16,246,0.7)!important}
.login-link::after{display:none!important}
.nav-btn-cta{position:relative;overflow:hidden;display:inline-flex;align-items:center;height:38px;padding:0 22px;border-radius:100px;border:none;background:linear-gradient(90deg,#610497,#9210f6);text-decoration:none;cursor:none;white-space:nowrap;font-family:'DM Sans',sans-serif;font-weight:700;font-size:13px;color:#fff;transition:opacity .2s}
.nav-btn-cta:hover{opacity:.85}
.ham{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:none;padding:4px}
.ham span{display:block;width:22px;height:2px;background:#fff;border-radius:2px;transition:all .3s}
.ham.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.ham.open span:nth-child(2){opacity:0}
.ham.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.mob-overlay{display:none;position:fixed;inset:0;top:74px;background:rgba(10,5,20,0.97);backdrop-filter:blur(20px);z-index:999;flex-direction:column;align-items:center;justify-content:center;gap:30px}
.mob-overlay.open{display:flex}
.mob-overlay a{font-family:var(--fh);font-size:26px;color:#fff;text-decoration:none;opacity:.80;transition:opacity .2s}
.mob-overlay a:hover{opacity:1}
.mob-cta{margin-top:8px;padding:14px 40px;border-radius:100px;background:linear-gradient(90deg,#610497,#9210f6);color:#fff;font-family:'DM Sans',sans-serif;font-size:17px;font-weight:700;text-decoration:none}

/* DROPDOWN */
.dd-wrap{position:relative}
.dd-content{display:none;position:absolute;top:calc(100% + 14px);left:50%;transform:translateX(-50%);background:rgba(15,5,30,0.97);backdrop-filter:blur(20px);border:1px solid rgba(146,16,246,0.3);border-radius:18px;padding:18px;min-width:220px;z-index:200;box-shadow:0 20px 60px rgba(0,0,0,0.7)}
.dd-wrap:hover .dd-content{display:block}
.dd-title{font-family:var(--fb);font-size:10px;font-weight:700;letter-spacing:2px;color:var(--purple);margin-bottom:12px;text-transform:uppercase}
.dd-list{list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
.dd-list li{display:flex;align-items:center;gap:10px;font-family:var(--fb);font-size:13px;color:rgba(255,255,255,0.75);padding:9px 12px;border-radius:10px;background:rgba(255,255,255,0.04);cursor:none;transition:background .2s}
.dd-list li:hover{background:rgba(146,16,246,0.15);color:#fff}
.dd-explore{display:block;text-align:center;padding:9px;border-radius:10px;background:linear-gradient(90deg,var(--purple2),var(--purple3));color:#fff;font-family:var(--fb);font-size:12px;font-weight:700;text-decoration:none;letter-spacing:1px;cursor:none}

/* BOOK BTN */
.book-btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;height:54px;border-radius:100px;border:none;background:linear-gradient(90deg,var(--purple2),var(--purple));text-decoration:none;cursor:none;width:224px}
.book-btn .ba{position:absolute;left:0;top:0;bottom:0;width:54px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.20);border-radius:100px 0 0 100px;transform:translateX(-100%);transition:transform .42s cubic-bezier(.22,1,.36,1);z-index:2}
.book-btn .ba svg{width:18px;height:18px;fill:none;stroke:#fff;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.book-btn .bl{font-family:var(--fb);font-weight:700;font-size:13.5px;color:#fff;position:relative;z-index:2;padding:0 22px 0 20px;white-space:nowrap;transition:transform .42s cubic-bezier(.22,1,.36,1)}
.book-btn:hover .ba{transform:translateX(0)}
.book-btn:hover .bl{transform:translateX(44px)}
.ghost-btn{display:inline-flex;align-items:center;height:54px;padding:0 28px;border-radius:100px;border:1px solid rgba(255,255,255,0.22);color:#fff;font-family:var(--fb);font-weight:600;font-size:14px;text-decoration:none;cursor:none;transition:background .2s,border-color .2s}
.ghost-btn:hover{background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.4)}

/* HERO */
#home{width:100%;min-height:100svh;padding:110px 6% 60px;display:flex;align-items:center;position:relative;overflow:hidden;background:radial-gradient(ellipse 80% 70% at 50% 0%,rgba(146,16,246,0.18) 0%,transparent 70%),linear-gradient(90deg,rgba(10,10,24,0.88) 0%,rgba(10,10,24,0.72) 35%,rgba(10,10,24,0.35) 60%,rgba(10,10,24,0.05) 100%),url('/business-hero-bg.png') center/cover no-repeat,var(--bg)}
.hero-inner{width:100%;max-width:1440px;margin:0 auto;display:flex;flex-direction:column;align-items:flex-start}
.hero-h1{font-family:var(--fh);font-size:clamp(32px,4.8vw,68px);font-weight:400;line-height:1.15;letter-spacing:-0.01em;margin-bottom:18px}
.hero-h1 span{background:linear-gradient(90deg,var(--purple),var(--purple3),var(--purple4));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-sub{font-family:var(--fb);font-size:17px;color:var(--muted);line-height:1.70;max-width:480px;margin-bottom:34px}
.hero-actions{display:flex;align-items:center;gap:14px;margin-bottom:40px}
.hero-trust{display:flex;flex-direction:column;gap:10px}
.trust-label{font-family:var(--fb);font-size:11px;color:rgba(255,255,255,0.38);letter-spacing:.5px;text-transform:uppercase}
.trust-logos{display:grid;grid-template-columns:repeat(6,auto);justify-content:start;gap:8px}
.trust-logo{padding:6px 14px;border-radius:100px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);font-family:var(--fb);font-size:11px;font-weight:600;color:rgba(255,255,255,0.55);white-space:nowrap;text-align:center}

/* SERVICES */
#services{width:100%;padding:90px 6% 70px;overflow:hidden}
.svc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:30px;max-width:1440px;margin:0 auto 36px}
.svc-head h2{font-family:var(--fh);font-size:clamp(24px,3.5vw,48px);font-weight:400;line-height:1.15;letter-spacing:-0.01em}
.svc-head p{font-family:var(--fb);font-size:15px;color:var(--muted);max-width:320px;line-height:1.7;text-align:right}
.kicker{font-family:var(--fb);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--purple);margin-bottom:10px}
.exp-track{display:flex;gap:12px;max-width:1440px;margin:0 auto;height:520px}
.exp-card{flex:1;border-radius:20px;overflow:hidden;position:relative;cursor:none;transition:flex .6s cubic-bezier(.22,1,.36,1);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)}
.exp-card.active{flex:3.8}
.exp-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .6s}
.exp-card.active .exp-img{transform:scale(1.04)}
.exp-card::before{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(10,5,20,0.92) 0%,rgba(10,5,20,0.3) 50%,transparent 100%);z-index:1}
.exp-tag{position:absolute;top:16px;left:16px;z-index:5;padding:4px 12px;border-radius:100px;font-family:var(--fb);font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;background:rgba(146,16,246,0.28);border:1px solid rgba(146,16,246,0.4);color:#e8b4ff}
.exp-num{position:absolute;top:16px;right:16px;z-index:5;font-family:var(--fh);font-size:11px;color:rgba(255,255,255,0.30)}
.exp-body{position:absolute;bottom:0;left:0;right:0;padding:22px 20px;z-index:5}
.exp-body h3{font-family:var(--fh);font-size:clamp(14px,1.4vw,22px);font-weight:400;margin-bottom:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:font-size .3s}
.exp-card.active .exp-body h3{white-space:normal;font-size:clamp(17px,1.8vw,26px)}
.exp-desc{font-family:var(--fb);font-size:13.5px;color:rgba(255,255,255,0.68);line-height:1.7;margin-top:10px;max-height:0;overflow:hidden;transition:max-height .5s cubic-bezier(.22,1,.36,1),opacity .4s}
.exp-card.active .exp-desc{max-height:120px;opacity:1}

/* STATS STRIP */
.stats-strip{background:linear-gradient(90deg,rgba(146,16,246,0.14),rgba(97,4,151,0.10),rgba(124,58,237,0.14));border-top:1px solid rgba(146,16,246,0.2);border-bottom:1px solid rgba(146,16,246,0.2);padding:48px 6%;display:flex;justify-content:center;gap:0;max-width:100%}
.stat-item{flex:1;max-width:220px;text-align:center;padding:0 20px}
.stat-item:not(:last-child){border-right:1px solid rgba(255,255,255,0.08)}
.stat-val{font-family:var(--fh);font-size:clamp(28px,3vw,48px);font-weight:400;background:linear-gradient(90deg,var(--purple),var(--purple3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.1;margin-bottom:6px}
.stat-lbl{font-family:var(--fb);font-size:11.5px;color:var(--muted);letter-spacing:.5px;font-weight:600;text-transform:uppercase}

/* MARQUEE */
.marquee-section{padding:60px 0;overflow:hidden;position:relative}
.marquee-section::before,.marquee-section::after{content:'';position:absolute;top:0;bottom:0;width:120px;z-index:2;pointer-events:none}
.marquee-section::before{left:0;background:linear-gradient(to right,var(--bg),transparent)}
.marquee-section::after{right:0;background:linear-gradient(to left,var(--bg),transparent)}
.marquee-label{text-align:center;font-family:var(--fb);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:28px}
.marquee-track{display:flex;animation:marqueeScroll 28s linear infinite}
.marquee-track:hover{animation-play-state:paused}
@keyframes marqueeScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.marquee-item{display:inline-flex;align-items:center;padding:10px 32px;border-radius:100px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);font-family:var(--fb);font-size:13px;font-weight:600;color:rgba(255,255,255,0.45);white-space:nowrap;margin:0 8px;transition:color .2s,border-color .2s}
.marquee-item:hover{color:#fff;border-color:rgba(146,16,246,0.4)}

/* CAPABILITIES / HEX */
#capabilities{width:100%;min-height:100svh;display:flex;align-items:center;padding:90px 6% 60px}
.cs-inner{width:100%;max-width:1440px;margin:0 auto;display:flex;flex-direction:column;gap:70px}
.sh2{font-family:var(--fh);font-size:clamp(24px,3.2vw,44px);font-weight:400;line-height:1.15;letter-spacing:-0.01em;margin-bottom:10px}

.hex-section{padding:0 0 20px}
.hex-grid-outer{max-width:940px;margin:0 auto;padding:0 20px}
.hex-row{display:flex;justify-content:center;margin-bottom:-22px;position:relative;z-index:1}
.hex-row.offset{padding-left:90px}
.hex-cell{width:152px;height:134px;margin:0 5px;position:relative;cursor:none;flex-shrink:0}
.hex-body{width:100%;height:100%;clip-path:polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%);background:rgba(255,255,255,0.04);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;transition:transform .38s cubic-bezier(.22,1,.36,1),background .32s;position:relative;overflow:hidden}
.hex-cell::before{content:'';position:absolute;inset:-1.5px;clip-path:polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%);background:rgba(255,255,255,0.09);z-index:0;pointer-events:none;transition:background .32s}
.hex-cell.hex-active::before,.hex-cell:hover::before{background:var(--hc,rgba(146,16,246,0.5))}
.hex-cell.hex-neighbor::before{background:rgba(255,255,255,0.14)}
.hex-body::after{content:'';position:absolute;inset:0;background:var(--hc,#9210f6);opacity:0;transition:opacity .32s;z-index:0;clip-path:polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)}
.hex-cell.hex-active .hex-body::after{opacity:0.18}
.hex-cell:hover .hex-body::after{opacity:0.14}
.hex-cell.hex-active .hex-body{background:rgba(255,255,255,0.09);transform:scale(1.07) translateY(-3px)}
.hex-cell:hover:not(.hex-active) .hex-body{background:rgba(255,255,255,0.07);transform:scale(1.05) translateY(-2px)}
.hex-icon{font-size:26px;position:relative;z-index:2;line-height:1;transition:transform .3s cubic-bezier(.22,1,.36,1)}
.hex-cell.hex-active .hex-icon{transform:scale(1.2) translateY(-3px)}
.hex-label{font-family:var(--fb);font-size:9.5px;font-weight:700;letter-spacing:.2px;text-align:center;color:rgba(255,255,255,.60);line-height:1.3;max-width:92px;position:relative;z-index:2;transition:color .25s}
.hex-cell.hex-active .hex-label,.hex-cell:hover .hex-label{color:#fff}
.hex-dot{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:var(--hc,#9210f6);opacity:0;transition:opacity .28s;z-index:10;box-shadow:0 0 6px var(--hc,#9210f6)}
.hex-cell.hex-active .hex-dot{opacity:1}
.hex-panel-wrap{max-width:940px;margin:28px auto 10px;padding:0 20px}
.hex-panel{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:20px;overflow:hidden;position:relative;transform-origin:top center;animation:hexPanelUnfold .55s cubic-bezier(.22,1,.36,1) both}
.hex-panel.hex-panel-closing{animation:hexPanelFold .40s cubic-bezier(.55,0,1,.45) both!important;pointer-events:none}
@keyframes hexPanelUnfold{0%{opacity:0;transform:perspective(800px) rotateX(-22deg) translateY(-18px) scale(0.96);filter:blur(4px)}60%{filter:blur(0px)}100%{opacity:1;transform:perspective(800px) rotateX(0deg) translateY(0) scale(1)}}
@keyframes hexPanelFold{0%{opacity:1;transform:perspective(800px) rotateX(0deg) scale(1)}100%{opacity:0;transform:perspective(800px) rotateX(-18deg) translateY(-14px) scale(0.94);filter:blur(5px)}}
.hex-panel::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--hp-color,var(--purple));border-radius:0 2px 2px 0;animation:stripGrow .5s cubic-bezier(.22,1,.36,1) both}
@keyframes stripGrow{from{transform:scaleY(0);transform-origin:top}to{transform:scaleY(1);transform-origin:top}}
.hex-panel-grid{display:grid;grid-template-columns:1fr 280px}
.hex-panel-left{padding:30px 32px 30px 36px;border-right:1px solid rgba(255,255,255,.07)}
.hex-panel-hd{display:flex;align-items:center;gap:14px;margin-bottom:16px}
.hex-panel-ico{width:50px;height:50px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;background:var(--hp-bg,rgba(146,16,246,0.12));border:1px solid var(--hp-border,rgba(146,16,246,0.25));animation:icoElastic .7s cubic-bezier(.34,1.56,.64,1) .15s both}
@keyframes icoElastic{0%{opacity:0;transform:scale(0) rotate(-20deg)}60%{transform:scale(1.18) rotate(4deg)}100%{opacity:1;transform:scale(1) rotate(0deg)}}
.hex-panel-name{font-family:var(--fh);font-size:19px;font-weight:400;color:#fff;line-height:1.1;animation:slideInBlur .45s cubic-bezier(.22,1,.36,1) .22s both}
.hex-panel-short{font-family:var(--fb);font-size:12px;color:rgba(255,255,255,.45);margin-top:3px;animation:slideInBlur .45s cubic-bezier(.22,1,.36,1) .28s both}
@keyframes slideInBlur{from{opacity:0;transform:translateX(-16px);filter:blur(6px)}to{opacity:1;transform:translateX(0);filter:blur(0)}}
.hex-panel-desc{font-family:var(--fb);font-size:14px;color:rgba(255,255,255,.68);line-height:1.80;margin-bottom:20px;animation:fadeInUp .5s cubic-bezier(.22,1,.36,1) .32s both}
@keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.hex-panel-tags{display:flex;flex-wrap:wrap;gap:8px}
.hex-panel-tag{padding:5px 15px;border-radius:100px;font-family:var(--fb);font-size:11px;font-weight:600;letter-spacing:.4px;background:var(--hp-bg,rgba(146,16,246,0.10));border:1px solid var(--hp-border,rgba(146,16,246,0.22));color:var(--hp-color,#9210f6);cursor:none;animation:tagSpring .5s cubic-bezier(.34,1.56,.64,1) var(--tag-delay,0.4s) both;transition:background .2s,transform .2s}
.hex-panel-tag:hover{background:var(--hp-bg2,rgba(146,16,246,0.20));transform:translateY(-2px) scale(1.04)}
@keyframes tagSpring{from{opacity:0;transform:scale(.6) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
.hex-panel-right{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;padding:30px 28px;position:relative;overflow:hidden;background:rgba(0,0,0,.14)}
.hex-panel-right::before{content:'';position:absolute;width:180px;height:180px;border-radius:50%;background:var(--hp-color,#9210f6);opacity:.07;filter:blur(50px);pointer-events:none}
.hex-stat-val{font-family:var(--fh);font-size:clamp(38px,4vw,56px);font-weight:400;letter-spacing:-0.04em;line-height:1;color:var(--hp-color,#9210f6);position:relative;z-index:1;animation:statDrop .6s cubic-bezier(.34,1.56,.64,1) .35s both}
@keyframes statDrop{0%{opacity:0;transform:scale(1.8) translateY(-12px);filter:blur(8px)}60%{filter:blur(0)}100%{opacity:1;transform:scale(1) translateY(0)}}
.hex-stat-lbl{font-family:var(--fb);font-size:12px;font-weight:500;color:rgba(255,255,255,.45);letter-spacing:.8px;text-transform:uppercase;position:relative;z-index:1;animation:fadeInUp .4s cubic-bezier(.22,1,.36,1) .52s both}
.hex-close{position:absolute;top:14px;right:16px;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.11);color:rgba(255,255,255,.45);cursor:none;display:flex;align-items:center;justify-content:center;font-size:13px;transition:background .2s,color .2s,transform .2s;z-index:60;animation:closeIn .35s cubic-bezier(.34,1.56,.64,1) .5s both}
@keyframes closeIn{from{opacity:0;transform:scale(0) rotate(180deg)}to{opacity:1;transform:scale(1) rotate(0deg)}}
.hex-close:hover{background:rgba(255,255,255,.12);color:#fff;transform:rotate(90deg)}

/* BRAND CAROUSEL (CoverflowCarousel) */
.carousel-section{padding:60px 0 90px;overflow:hidden;position:relative}
.carousel-header{text-align:center;margin-bottom:20px;padding:0 6%}
.carousel-header h3{font-family:var(--fh);font-size:clamp(22px,3.2vw,42px);font-weight:400;letter-spacing:-0.01em;margin-bottom:10px}
.carousel-header h3 span{background:linear-gradient(90deg,var(--purple),var(--purple3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.carousel-header p{font-family:var(--fb);font-size:15px;color:var(--muted)}

/* The CoverflowCarousel renders centred info for the active card via the
   content slot. Colours, tag pill, bullets and CTA mirror the old in-card
   layout so the section keeps its identity. */
.cov-info{display:flex;flex-direction:column;align-items:center;text-align:center;gap:0;margin-top:8px;padding:0 6%}
.cov-info .cov-tag{display:inline-flex;align-items:center;padding:4px 13px;border-radius:100px;font-family:var(--fb);font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px}
.cov-info .cov-name{font-family:var(--fh);font-size:clamp(20px,2.4vw,28px);font-weight:400;letter-spacing:-0.01em;line-height:1.1;color:#fff}
.cov-info .cov-headline{font-family:var(--fb);font-size:13px;font-weight:600;color:rgba(255,255,255,.55);margin:4px 0 14px}
.cov-info .cov-bullets{list-style:none;display:flex;flex-wrap:wrap;justify-content:center;gap:6px 18px;margin:0 0 18px;padding:0;max-width:560px}
.cov-info .cov-bullets li{display:flex;align-items:center;gap:8px;font-family:var(--fb);font-size:12.5px;color:rgba(255,255,255,.78)}
.cov-info .cov-check{width:16px;height:16px;border-radius:50%;display:grid;place-items:center;font-size:9px;font-weight:900;flex-shrink:0;color:#fff}
.cov-info .cov-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 20px;border-radius:100px;font-family:var(--fb);font-size:12px;font-weight:700;color:#fff;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.10);width:fit-content;transition:background .2s;text-decoration:none}
.cov-info .cov-btn:hover{background:rgba(255,255,255,.20)}

/* Cards must stay square: the stage wrapper is exactly one card-width tall,
   so a taller card gets its bottom clipped by the frame's overflow-hidden
   (the "invisible border" cut). A subtle edge + shadow keeps cards readable
   against the dark background. */
.carousel-cf .cov-card-frame{border:1px solid rgba(255,255,255,.16);box-shadow:0 24px 60px rgba(0,0,0,.65),0 0 44px rgba(146,16,246,.10)}
.carousel-cf .cov-card-frame img{transition:transform .5s}
.carousel-cf .cov-card-frame:hover img{transform:scale(1.06)}

/* CHANGING TEXT */
.changing-section{padding:80px 6%;text-align:center;position:relative;overflow:hidden;background:radial-gradient(ellipse 60% 80% at 50% 50%,rgba(146,16,246,0.08) 0%,transparent 70%)}
.changing-section h3{font-family:var(--fh);font-size:clamp(20px,2.8vw,36px);font-weight:400;margin-bottom:16px;line-height:1.4}
#changingText{color:var(--purple);position:relative;transition:opacity .4s,transform .4s}
#changingText::after{content:'';position:absolute;bottom:-4px;left:0;width:100%;height:2px;background:linear-gradient(90deg,var(--purple),var(--purple3));border-radius:2px}
.ct-fade-out{opacity:0;transform:translateY(-10px)}
.ct-fade-in{opacity:1;transform:translateY(0)}

/* FOOTER */
.footer{padding-top:80px}
.footer-tagline{font-family:var(--fb);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--purple);margin-bottom:16px}
.footer-brand-img{height:48px;width:auto;margin-bottom:12px;border-radius:8px}
.footer-desc{font-family:var(--fb);font-size:14px;color:var(--muted);line-height:1.75;max-width:360px;margin-bottom:28px}
.socials{display:flex;gap:10px}
.soc{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);display:grid;place-items:center;color:#fff;font-family:var(--fb);font-size:12px;font-weight:700;text-decoration:none;transition:background .2s}
.soc:hover{background:rgba(146,16,246,0.25)}
.footer-links-title{font-family:var(--fb);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--purple);margin-bottom:20px}
.footer-links{display:flex;flex-direction:column;gap:12px}
.footer-links a{font-family:var(--fb);font-size:14px;color:var(--muted);text-decoration:none;transition:color .2s}
.footer-links a:hover{color:#fff}
.footer-contact{display:flex;flex-direction:column;gap:10px;margin-top:28px}
.footer-contact a{font-family:var(--fb);font-size:14px;color:var(--muted);text-decoration:none;transition:color .2s}
.footer-contact a:hover{color:#fff}
.footer-bar{border-top:1px solid rgba(255,255,255,.07);padding:18px 6%;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-family:var(--fb);font-size:13px;color:rgba(255,255,255,.36);max-width:1440px;margin:0 auto}
.footer-bar a{color:rgba(255,255,255,.36);text-decoration:none;transition:color .2s}
.footer-bar a:hover{color:#fff}
.footer-main{padding:60px 6%;display:grid;grid-template-columns:1.4fr 1fr 1.6fr;gap:40px;max-width:1440px;margin:0 auto}
/* RANKED GAMES */
.rg-section{padding:70px 6% 60px;position:relative;overflow:hidden}
.rg-section::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(146,16,246,0.4),transparent)}
.rg-kicker{font-family:var(--fb);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--purple);margin-bottom:10px}
.rg-heading{font-family:var(--fh);font-size:clamp(22px,3vw,40px);font-weight:400;line-height:1.15;letter-spacing:-0.01em;margin-bottom:8px}
.rg-sub{font-family:var(--fb);font-size:14px;color:var(--muted);margin-bottom:40px}
.rg-track{display:flex;gap:0;align-items:flex-end;overflow-x:auto;padding-bottom:12px;scrollbar-width:none}
.rg-track::-webkit-scrollbar{display:none}
.rg-item{position:relative;flex-shrink:0;cursor:pointer;transition:transform .32s cubic-bezier(.22,1,.36,1)}
.rg-item:hover{transform:scale(1.04) translateY(-6px);z-index:10}
.rg-rank{position:absolute;left:-10px;top:-18px;font-family:var(--fh);font-size:clamp(60px,7vw,100px);font-weight:400;line-height:1;color:transparent;-webkit-text-stroke:2px rgba(227, 227, 227, 0.45);user-select:none;z-index:20;pointer-events:none;transition:color .3s,-webkit-text-stroke .3s}
.rg-item:hover .rg-rank{-webkit-text-stroke:2px rgba(146,16,246,0.85);text-shadow:0 0 40px rgba(146,16,246,0.3)}
.rg-card{width:210px;height:290px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);position:relative;transition:border-color .3s,box-shadow .3s}.rg-item:hover .rg-card{border-color:rgba(146,16,246,0.5);box-shadow:0 16px 48px rgba(146,16,246,0.18),0 0 0 1px rgba(146,16,246,0.2)}
.rg-card-img{width:100%;height:65%;object-fit:cover;display:block;transition:transform .4s}
.rg-item:hover .rg-card-img{transform:scale(1.08)}
.rg-card-body{position:absolute;bottom:0;left:0;right:0;padding:10px 12px 12px;background:linear-gradient(to top,rgba(10,5,20,0.97) 0%,rgba(10,5,20,0.6) 60%,transparent 100%)}
.rg-card-name{font-family:var(--fb);font-size:12.5px;font-weight:700;color:#fff;line-height:1.3;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rg-card-plays{font-family:var(--fb);font-size:10px;color:var(--muted);display:flex;align-items:center;gap:4px}
.rg-card-badge{position:absolute;top:8px;right:8px;background:rgba(146,16,246,0.7);border:1px solid rgba(146,16,246,0.5);backdrop-filter:blur(8px);padding:3px 8px;border-radius:100px;font-family:var(--fb);font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#fff}
.rg-card-overlay{position:absolute;inset:0;background:rgba(146,16,246,0.12);opacity:0;transition:opacity .3s;display:flex;align-items:center;justify-content:center;border-radius:14px}
.rg-item:hover .rg-card-overlay{opacity:1}
.rg-play-btn{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.95);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.4);transform:scale(0.6);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
.rg-item:hover .rg-play-btn{transform:scale(1)}
.rg-empty{text-align:center;padding:60px 20px;font-family:var(--fb);font-size:14px;color:var(--muted)}
@keyframes rgSlideIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
.rg-item{animation:rgSlideIn .5s cubic-bezier(.22,1,.36,1) both};

@media(max-width:1100px){.navbar{width:78%}}
@media(max-width:900px){.nav-links,.nav-btn-cta{display:none}.ham{display:flex}.nav-wrap{padding:12px 20px;display:block}#home{padding-top:104px;align-items:stretch}.hero-inner{height:auto;min-height:calc(100svh - 164px)}.hero-left{display:flex;flex-direction:column;flex:1}.hero-actions{margin-top:auto}.navbar{width:100%;max-width:100%;min-width:unset;padding:6px 14px;border-radius:100px}#home{background-position:center bottom;background-size:cover;background-image:linear-gradient(180deg,rgba(10,10,24,0.86) 0%,rgba(10,10,24,0.72) 45%,rgba(10,10,24,0.30) 100%),url('/business-hero-mobile.png');background-repeat:no-repeat}}
@media(max-width:768px){.hero-h1{font-size:30px}.trust-logos{grid-template-columns:repeat(6,1fr);gap:4px}.trust-logo{padding:6px 4px;font-size:9px}.hero-actions{flex-wrap:nowrap;gap:10px}.hero-actions .book-btn{width:auto;flex:1;min-width:0;justify-content:center}.hero-actions .ghost-btn{flex:1;min-width:0;padding:0 14px;justify-content:center;white-space:nowrap}.exp-track{flex-direction:column!important;height:auto!important;gap:8px}.exp-card{flex:none!important;width:100%!important;height:130px;border-radius:14px;transition:height .5s cubic-bezier(.22,1,.36,1)!important}.exp-card.active{height:260px!important}.footer-main{grid-template-columns:1fr}.hex-row.offset{padding-left:72px}.hex-cell{width:118px;height:104px;margin:0 3px}.hex-panel-grid{grid-template-columns:1fr}.hex-panel-right{border-top:1px solid rgba(255,255,255,.07);flex-direction:row;justify-content:center;gap:24px;padding:20px 24px}.cov-info .cov-bullets{gap:4px 14px}.cov-info .cov-bullets li{font-size:11.5px}.stats-strip{flex-wrap:wrap;gap:24px}.stat-item{min-width:40%}body{cursor:auto}.cursor-dot,.cursor-ring{display:none}}
`;


/* ─── SUB-COMPONENTS ────────────────────────────────── */

function BookBtn({ href, label }) {
  return (
    <a href={href} className="book-btn">
      <span className="ba">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
      <span className="bl">{label}</span>
    </a>
  );
}

/* ─── HEX CAPABILITIES ──────────────────────────────── */
function HexCapabilities() {
  const [activeId, setActiveId] = useState(null);
  const [closing, setClosing] = useState(false);
  const panelKey = useRef(0);

  const openPanel = (id) => {
    if (id === activeId) {
      setClosing(true);
      setTimeout(() => { setActiveId(null); setClosing(false); }, 380);
    } else {
      panelKey.current += 1;
      setActiveId(id);
      setClosing(false);
    }
  };

  const activeFeature = HEX_FEATURES.find(f => f.id === activeId);

  return (
    <div className="hex-section">
      <div style={{ marginBottom: 32 }}>
        <p className="kicker">Platform Capabilities</p>
        <h2 className="sh2">Everything You Need to<br />Gamify Your Brand</h2>
      </div>
      <div className="hex-grid-outer">
        {HEX_ROWS.map((row, ri) => (
          <div key={ri} className={`hex-row${row.offset ? " offset" : ""}`}>
            {row.ids.map(idx => {
              const f = HEX_FEATURES[idx];
              if (!f) return null;
              const isActive = activeId === f.id;
              return (
                <div key={f.id} className={`hex-cell ${isActive ? "hex-active" : ""}`}
                  style={{ "--hc": f.color }} onClick={() => openPanel(f.id)}>
                  <div className="hex-body">
                    <span className="hex-icon">{f.icon}</span>
                    <span className="hex-label">{f.label}</span>
                  </div>
                  <div className="hex-dot" />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {(activeId || closing) && activeFeature && (
        <div className="hex-panel-wrap">
          <div className={`hex-panel${closing ? " hex-panel-closing" : ""}`}
            style={{ "--hp-color": activeFeature.color, "--hp-bg": `${activeFeature.color}18`, "--hp-bg2": `${activeFeature.color}30`, "--hp-border": `${activeFeature.color}35` }}>
            <button className="hex-close" onClick={() => openPanel(activeId)}>✕</button>
            <div className="hex-panel-grid">
              <div className="hex-panel-left">
                <div className="hex-panel-hd">
                  <div className="hex-panel-ico" key={`ico-${panelKey.current}`}>{activeFeature.icon}</div>
                  <div>
                    <div className="hex-panel-name" key={`nm-${panelKey.current}`}>{activeFeature.label}</div>
                    <div className="hex-panel-short" key={`sh-${panelKey.current}`}>{activeFeature.short}</div>
                  </div>
                </div>
                <p className="hex-panel-desc" key={`desc-${panelKey.current}`}>{activeFeature.desc}</p>
                <div className="hex-panel-tags">
                  {activeFeature.tags?.map((t, ti) => (
                    <span key={`${t}-${panelKey.current}`} className="hex-panel-tag" style={{ "--tag-delay": `${0.40 + ti * 0.09}s` }}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="hex-panel-right">
                <CountUp as="div" className="hex-stat-val" value={activeFeature.stat} key={`sv-${panelKey.current}`} />
                <div className="hex-stat-lbl" key={`sl-${panelKey.current}`}>{activeFeature.statLabel}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── BRAND CAROUSEL ────────────────────────────────── */
function BrandCarousel() {
  const [center, setCenter] = useState(0);

  return (
    <div className="carousel-section">
      <div className="carousel-header">
        <h3>Built for <span>Every Industry</span></h3>
        <p>From FMCG to EdTech — Promogames powers engagement across every category.</p>
      </div>
      <CoverflowCarousel
        slides={BRANDS.map(b => ({
          src: b.img,
          alt: b.name,
          content: (
            <div className="cov-info" key={b.id}>
              <span className="cov-tag" style={{ background: `${b.color}22`, border: `1px solid ${b.color}44`, color: b.color }}>
                {b.tag}
              </span>
              <div className="cov-name">{b.name}</div>
              <div className="cov-headline">{b.headline}</div>
              <ul className="cov-bullets">
                {b.bullets.map(bullet => (
                  <li key={bullet}>
                    <span className="cov-check" style={{ background: b.color }}>✓</span>
                    {bullet}
                  </li>
                ))}
              </ul>
              <a href="#contact" className="cov-btn">Learn More <Arr size={14} /></a>
            </div>
          ),
        }))}
        showCaption
        showPagination
        showNavigation
        autoPlayMs={4000}
        onSelectChange={setCenter}
        label="Industries we serve"
        cardWidth="clamp(240px, 27vw, 320px)"
        rotate={40}
        depth={0.55}
        falloff={0.55}
        fade={0.18}
        gap={0.08}
        className="carousel-cf"
        cardClassName="cov-card-frame"
      />
    </div>
  );
}

/* ─── CHANGING TEXT ─────────────────────────────────── */
function ChangingText() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(p => (p + 1) % CHANGING_TEXTS.length);
        setFading(false);
      }, 450);
    }, 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="changing-section">
      <h3>
        The leading Brand Engagement Platform for<br />
        <span id="changingText" className={fading ? "ct-fade-out" : "ct-fade-in"}>
          {CHANGING_TEXTS[idx]}
        </span>
      </h3>
      <p style={{ fontFamily: "var(--fb)", fontSize: 16, color: "var(--muted)", maxWidth: 540, margin: "0 auto 32px", lineHeight: 1.7 }}>
        Brand Promotions that feel like play — and perform like your best campaign.
      </p>
      <BookBtn href="https://forms.gle/LUs2Q7cVS8tU8ra66" label="Get a Trial Game" />
    </section>
  );
}
/* ─── RANKED GAMES ──────────────────────────────────── */
function RankedGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/play/hero-games')
      .then(r => r.json())
      .then(d => { if (d.success) setGames(d.games || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || games.length === 0) return null;

  const COLORS = ['#9210f6','#610497','#7C3AED','#4F46E5','#9210f6','#610497','#7C3AED','#4F46E5','#9210f6','#610497'];

  return (
    <section className="rg-section">
      <p className="rg-kicker">🔥 Trending Now</p>
      <h2 className="rg-heading">Top Games This Week</h2>
      <p className="rg-sub">Play brand games from our partners — live &amp; free</p>

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
  );
}
/* ─── MAIN COMPONENT ────────────────────────────────── */
export default function Business() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState(0);
  const hovRef = useRef(false);
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const mx = useRef(0); const my = useRef(0);
  const rx = useRef(0); const ry = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const move = (e) => { mx.current = e.clientX; my.current = e.clientY; document.body.classList.add("cursor-visible"); };
    const enter = () => document.body.classList.add("cursor-hover");
    const leave = () => document.body.classList.remove("cursor-hover");
    document.addEventListener("mousemove", move);
    document.querySelectorAll("a,button").forEach(el => { el.addEventListener("mouseenter", enter); el.addEventListener("mouseleave", leave); });
    const loop = () => {
      rx.current += (mx.current - rx.current) * 0.14;
      ry.current += (my.current - ry.current) * 0.14;
      if (dotRef.current) dotRef.current.style.transform = `translate(${mx.current - 4}px,${my.current - 4}px)`;
      if (ringRef.current) ringRef.current.style.transform = `translate(${rx.current - 19}px,${ry.current - 19}px)`;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { document.removeEventListener("mousemove", move); cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
      document.documentElement.style.setProperty("--scroll-pct", `${pct}%`);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (!hovRef.current) setActive(p => (p + 1) % SERVICES.length);
    }, 3800);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <MascotBubble />
      <MascotCursor />
      <div className="scroll-bar" />
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />

      <div className="nav-wrap">
        <nav className="navbar">
          <a href="/" className="logo">
            <img src="/favicon2.png" alt="Promogames" style={{height:60,width:'auto',borderRadius:8}} />
          </a>
          <div style={{flex:1}} />
          <ul className="nav-links">
            {NAV.map(n => (
              <li key={n.label}>
                <a href={n.href}>{n.label}</a>
              </li>
            ))}
            <li><div className="nav-divider" /></li>
<li>
  <a href="/login" className="login-link">Log in</a>
</li>          </ul>
          <a href="tel:+916366870248" className="nav-btn-cta">🎧 Talk to an Expert</a>
          <button className={`ham${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(p => !p)}>
            <span /><span /><span />
          </button>
        </nav>
      </div>
      <div className={`mob-overlay${menuOpen ? " open" : ""}`}>
        {NAV.map(n => <a key={n.label} href={n.href} onClick={() => setMenuOpen(false)}>{n.label}</a>)}
        <a href="/login" style={{ fontSize: 18, fontFamily: "var(--fb)", fontWeight: 700, border: "1px solid rgba(146,16,246,0.5)", padding: "12px 32px", borderRadius: 100 }}>Log in</a>
        <a href="tel:+916366870248" className="mob-cta">Talk to an Expert</a>
      </div>

      <section id="home">
        <div className="hero-inner">
          <div className="hero-left">
            <h1 className="hero-h1">
              Brand<br />
              MARKETING<br />
              <span>Gamified</span>
            </h1>
            <p className="hero-sub">
              Transform your brand promotions into interactive experiences. Engage customers with quizzes, scratch cards, contests, and instant rewards that drive real results.
            </p>
            <div className="hero-actions">
              <BookBtn href="#contact" label="Get a Trial Game" />
              <a href="#games" className="ghost-btn">Explore Games</a>
            </div>
            <div className="hero-trust">
              <div className="trust-label">Trusted by brands across industries</div>
              <div className="trust-logos">
                {["FMCG", "E-commerce", "D2C", "EdTech", "Events", "Media"].map(b => (
                  <span key={b} className="trust-logo">{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="stats-strip">
        {STATS.map(({ val, label }) => (
          <div key={label} className="stat-item">
            <CountUp as="div" className="stat-val" value={val} />
            <div className="stat-lbl">{label}</div>
          </div>
        ))}
      </div>
      <RankedGames />
      <section id="services">
        <div className="svc-head">
          <div>
            <p className="kicker">Game Formats</p>
            <h2 style={{ fontFamily: "var(--fh)", fontSize: "clamp(24px,3.5vw,48px)", fontWeight: 400, lineHeight: 1.15 }}>
              Promotions That Feel<br />Like Play
            </h2>
          </div>
          <p style={{ fontFamily: "var(--fb)", fontSize: 15, color: "var(--muted)", maxWidth: 320, lineHeight: 1.7, textAlign: "right" }}>
            Hover any card to explore each format — from viral giveaways to instant-win mechanics.
          </p>
        </div>
        <div className="exp-track" onMouseLeave={() => { hovRef.current = false; }}>
          {SERVICES.map((s, i) => (
            <div key={i} className={`exp-card shimmer-card${active === i ? " active" : ""}`}
              onMouseEnter={() => { hovRef.current = true; setActive(i); }}>
              <img className="exp-img" src={s.img} alt={s.title} loading="lazy" />
              <span className="exp-tag">{s.tag}</span>
              <span className="exp-num">0{i + 1}</span>
              <div className="exp-body">
                <h3>{s.emoji} {s.title}</h3>
                <p className="exp-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="marquee-section">
        <div className="marquee-label">Trusted by brands across India</div>
        <div className="marquee-track">
          {[...Array(2)].flatMap(() =>
            ["FMCG Leaders", "D2C Brands", "E-commerce Giants", "EdTech Platforms", "Event Companies", "Media Houses", "Insurance Brands", "Banking Apps", "Retail Chains", "Healthcare Brands"].map((b, i) => (
              <span key={`${b}-${Math.random()}`} className="marquee-item">{b}</span>
            ))
          )}
        </div>
      </section>

      <ChangingText />

      <section id="capabilities">
        <div className="cs-inner">
          <HexCapabilities />
          <BrandCarousel />
        </div>
      </section>

      <footer className="footer">
        <div className="footer-main">
          <div>
            <p className="footer-tagline">Play Everyday. Win Everyday.</p>
            <img src="/favicon2.png" alt="Promogames" className="footer-brand-img" />
            <p className="footer-desc">
              Quick games, real rewards, and a leaderboard that keeps you coming back. Your reward journey starts here.
            </p>
            <div className="socials">
              {[["in","https://www.linkedin.com"],["f","https://www.facebook.com/profile.php?id=61579982040453"],["𝕏","#"],["▶","#"],["📷","#"]].map(([s, href], i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="soc">{s}</a>
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
              <a href="tel:+916366870248">📞 +91 6366 870 248</a>
              <a href="mailto:play@promogames.in">📧 play@promogames.in</a>
            </div>
          </div>

        </div>
        <div className="footer-bar">
          <p>© 2026 Promogames. Fun Games. Exciting Gifts.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/terms">Terms & Conditions</a><span>|</span><a href="/privacy">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </>
  );
}
