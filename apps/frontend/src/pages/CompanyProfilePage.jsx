import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import MascotCursor from "../components/MascotCursor";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─── SECTION CONFIG ──────────────────────────────── */
const SECTIONS = [
  {
    bg: "#0a0a0a",
    accent: "#9210f6",
    kicker: "Company Profile",
    title: "Games that\nreward everyone",
    body: "We built PromoGames because we believe play should always feel worth it. For players — exciting challenges and real rewards. For businesses — a platform that turns engagement into loyalty.",
    cta: "See what we've built",
  },
  {
    bg: "#1a0a2e",
    accent: "#eac2fb",
    kicker: "Platform",
    title: "Built for scale,\ndesigned for fun",
    cards: [
      { icon: "🎮", title: "500+ Games", desc: "Puzzles, quizzes, spins, arcs — every genre your audience craves." },
      { icon: "👥", title: "10M+ Players", desc: "A growing community that plays daily and keeps coming back." },
      { icon: "📈", title: "Real-Time Data", desc: "Track every play, every score, every reward — live." },
      { icon: "⚡", title: "Instant Setup", desc: "Launch branded games in hours. No coding required." },
    ],
    cta: "For businesses",
  },
  {
    bg: "#0d1117",
    accent: "#fee960",
    kicker: "How It Works",
    title: "Three steps to\nyour first win",
    steps: [
      { num: "01", icon: "🎯", title: "Pick a Game", desc: "Browse 500+ games across quizzes, puzzles, spins, and arcade." },
      { num: "02", icon: "⚡", title: "Play & Score", desc: "Every game tests your skill or luck — climb as you go." },
      { num: "03", icon: "🎁", title: "Unlock Rewards", desc: "Top scorers unlock gifts, cashback, and surprise prizes." },
    ],
    cta: "Start playing",
  },
  {
    bg: "#1a0520",
    accent: "#ffc3d6",
    kicker: "For Businesses",
    title: "Turn your audience\ninto players",
    body: "Create branded games, set rewards, and watch engagement soar. Our platform handles the tech — you focus on the fun.",
    features: [
      "Custom branded games with your logo and colors",
      "Real-time player analytics and dashboards",
      "Automated reward distribution and tracking",
      "Leaderboards that drive repeat engagement",
    ],
    cta: "Partner with us",
  },
  {
    bg: "#0a0a0a",
    accent: "#79fee7",
    kicker: "Our Promise",
    title: "Play everyday.\nWin everyday.",
    body: "We're not just building a platform — we're building a habit. A daily ritual where play meets purpose, and every session feels rewarding.",
    cta: "Get in touch",
  },
];

/* ─── FLOATING PARTICLES (scroll-driven) ──────────── */
function ParallaxParticles({ accent, sectionIndex }) {
  const containerRef = useRef(null);
  const particles = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 8 + Math.random() * 32,
      speed: 0.3 + Math.random() * 0.7,
      rotation: Math.random() * 360,
      type: ["circle", "diamond", "ring", "dot"][Math.floor(Math.random() * 4)],
      opacity: 0.06 + Math.random() * 0.14,
    }))
  ).current;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const items = el.querySelectorAll(".cp-particle");

    items.forEach((item, i) => {
      const p = particles[i];
      if (!p) return;

      gsap.set(item, {
        x: 0,
        y: 0,
        rotation: p.rotation,
        scale: 0,
        opacity: 0,
      });

      gsap.to(item, {
        scale: 1,
        opacity: p.opacity,
        duration: 1.2,
        delay: i * 0.06,
        ease: "elastic.out(1, 0.6)",
      });

      gsap.to(item, {
        y: `+=${(Math.random() - 0.5) * 60}`,
        x: `+=${(Math.random() - 0.5) * 40}`,
        rotation: `+=${Math.random() * 180 - 90}`,
        duration: 4 + Math.random() * 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: Math.random() * 2,
      });
    });
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      {particles.map((p) => {
        const base = {
          position: "absolute",
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size,
        };

        if (p.type === "circle") {
          return (
            <div
              key={p.id}
              className="cp-particle"
              style={{
                ...base,
                borderRadius: "50%",
                background: accent,
              }}
            />
          );
        }
        if (p.type === "diamond") {
          return (
            <div
              key={p.id}
              className="cp-particle"
              style={{
                ...base,
                borderRadius: 4,
                background: accent,
                transform: "rotate(45deg)",
              }}
            />
          );
        }
        if (p.type === "ring") {
          return (
            <div
              key={p.id}
              className="cp-particle"
              style={{
                ...base,
                borderRadius: "50%",
                border: `2px solid ${accent}`,
                background: "transparent",
              }}
            />
          );
        }
        return (
          <div
            key={p.id}
            className="cp-particle"
            style={{
              ...base,
              width: p.size * 0.4,
              height: p.size * 0.4,
              borderRadius: "50%",
              background: accent,
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── GRADIENT ORB (parallax depth layer) ─────────── */
function GradientOrb({ color, size, x, y, blur, speed }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { scale: 0.8, opacity: 0 });

    gsap.to(el, {
      scale: 1,
      opacity: 0.35,
      duration: 2,
      ease: "power2.out",
    });

    gsap.to(el, {
      y: `+=${speed * 30}`,
      x: `+=${speed * 15}`,
      duration: 6 + speed * 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, [speed]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

/* ─── BOUNCING BALL ───────────────────────────────── */
function BouncingBall({ color }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { y: -300, opacity: 0, scale: 0.5 });
    gsap.to(el, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 1.2,
      ease: "elastic.out(1, 0.4)",
    });
    gsap.to(el, {
      y: -14,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: `radial-gradient(circle at 30% 30%, ${color}, ${color}99)`,
        boxShadow: `0 8px 32px ${color}44, 0 0 60px ${color}22`,
      }}
    />
  );
}

/* ─── MAIN COMPONENT ──────────────────────────────── */
export default function CompanyProfilePage() {
  const [activeSection, setActiveSection] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const sectionRefs = useRef([]);
  const contentRefs = useRef([]);
  const bgRefs = useRef([]);

  /* Scroll tracking */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Section detection + parallax bg */
  useEffect(() => {
    const timers = [];

    sectionRefs.current.forEach((section, i) => {
      if (!section) return;

      const st = ScrollTrigger.create({
        trigger: section,
        start: "top center",
        end: "bottom center",
        onEnter: () => setActiveSection(i),
        onEnterBack: () => setActiveSection(i),
      });

      /* Parallax background color interpolation */
      const bg = bgRefs.current[i];
      if (bg) {
        gsap.fromTo(
          bg,
          { opacity: 0.3, y: 80 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 90%",
              end: "top 30%",
              scrub: 0.5,
            },
          }
        );
      }
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  /* Content reveal animations */
  useEffect(() => {
    const timer = setTimeout(() => {
      contentRefs.current.forEach((content, i) => {
        if (!content) return;

        const els = Array.from(
          content.querySelectorAll(
            ".cp-kicker, .cp-title, .cp-body, .cp-cta, .cp-card, .cp-step, .cp-feature"
          )
        );

        gsap.set(els, { opacity: 0, y: 70 });

        ScrollTrigger.create({
          trigger: sectionRefs.current[i],
          start: "top 65%",
          onEnter: () => {
            gsap.to(els, {
              opacity: 1,
              y: 0,
              duration: 0.9,
              stagger: 0.1,
              ease: "elastic.out(1, 0.7)",
            });
          },
          onLeaveBack: () => {
            gsap.set(els, { opacity: 0, y: 70 });
          },
        });
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const scrollTo = (i) => {
    sectionRefs.current[i]?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <MascotCursor />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; background: #0a0a0a; font-family: 'Inter', sans-serif; }

        .cp-section {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cp-bg-layer {
          position: absolute;
          inset: 0;
          z-index: 0;
          transition: background-color 1s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .cp-content {
          position: relative;
          z-index: 10;
          max-width: 880px;
          width: 100%;
          padding: 100px 24px;
          text-align: center;
        }

        .cp-kicker {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 20px;
        }

        .cp-hero-logo-wrap {
          margin-bottom: 36px;
          display: flex;
          justify-content: center;
        }
        .cp-hero-logo {
          height: 120px;
          width: auto;
          border-radius: 20px;
          filter: drop-shadow(0 8px 40px rgba(121,254,231,0.3));
          animation: cpLogoFloat 4s ease-in-out infinite;
        }
        @keyframes cpLogoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .cp-title {
          font-size: clamp(38px, 7vw, 76px);
          font-weight: 900;
          color: #fff;
          line-height: 1.05;
          margin-bottom: 28px;
          letter-spacing: -2px;
          white-space: pre-line;
          text-shadow: 0 2px 40px rgba(0,0,0,0.3);
        }

        .cp-body {
          font-size: clamp(15px, 1.8vw, 18px);
          color: rgba(255,255,255,0.55);
          max-width: 540px;
          margin: 0 auto 44px;
          line-height: 1.8;
        }

        .cp-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 18px 42px;
          background: rgba(255,255,255,0.95);
          color: #0a0a0a;
          border: none;
          border-radius: 60px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          letter-spacing: 0.5px;
        }
        .cp-cta:hover {
          transform: scale(1.07) translateY(-3px);
          box-shadow: 0 20px 60px rgba(255,255,255,0.15);
        }
        .cp-cta-arrow {
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: inline-block;
          font-size: 18px;
        }
        .cp-cta:hover .cp-cta-arrow { transform: translateX(6px); }

        /* CARDS */
        .cp-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 48px auto 0;
          max-width: 700px;
        }
        .cp-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 32px 24px;
          text-align: center;
          backdrop-filter: blur(10px);
          transition: transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1),
                      border-color 0.3s ease,
                      background 0.3s ease;
        }
        .cp-card:hover {
          transform: translateY(-12px) scale(1.03);
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.07);
        }
        .cp-card-icon { font-size: 36px; margin-bottom: 14px; display: block; }
        .cp-card-title {
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 6px;
        }
        .cp-card-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          line-height: 1.6;
        }

        /* STEPS */
        .cp-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 48px auto 0;
          max-width: 780px;
          position: relative;
        }
        .cp-steps::before {
          content: '';
          position: absolute;
          top: 48px;
          left: 18%;
          right: 18%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          z-index: 0;
        }
        .cp-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px 20px;
          border-radius: 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          position: relative;
          z-index: 1;
          transition: transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1),
                      border-color 0.3s ease;
        }
        .cp-step:hover {
          transform: translateY(-10px);
          border-color: rgba(255,255,255,0.18);
        }
        .cp-step-num {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 4px;
          color: rgba(255,255,255,0.25);
          margin-bottom: 16px;
        }
        .cp-step-icon { font-size: 34px; margin-bottom: 18px; display: block; }
        .cp-step-title {
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 8px;
        }
        .cp-step-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          line-height: 1.6;
        }

        /* FEATURES */
        .cp-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 40px auto 0;
          max-width: 480px;
          text-align: left;
        }
        .cp-feature {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 24px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
                      border-color 0.3s ease,
                      background 0.3s ease;
        }
        .cp-feature:hover {
          transform: translateX(8px);
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
        }
        .cp-feature-check {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 13px;
          color: #fff;
        }
        .cp-feature-text {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.75);
        }

        /* NAV */
        .cp-nav {
          position: fixed;
          right: 28px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 14px;
          z-index: 200;
        }
        .cp-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          border: 2px solid rgba(255,255,255,0.18);
          cursor: pointer;
          transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .cp-dot.active {
          background: #fff;
          border-color: #fff;
          transform: scale(1.5);
          box-shadow: 0 0 12px rgba(255,255,255,0.3);
        }
        .cp-dot:hover:not(.active) {
          transform: scale(1.25);
          background: rgba(255,255,255,0.25);
        }

        /* BALL */
        .cp-ball-wrap {
          position: fixed;
          bottom: 36px;
          right: 36px;
          z-index: 200;
          cursor: pointer;
          transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .cp-ball-wrap:hover {
          transform: scale(1.3) rotate(12deg);
        }

        /* HEADER — logo pill */
        .cp-header {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 300;
          padding: 10px 28px;
          background: rgba(10,10,10,0.65);
          backdrop-filter: blur(24px) saturate(1.4);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 60px;
          transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .cp-header.scrolled {
          background: rgba(10,10,10,0.85);
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 8px 40px rgba(0,0,0,0.4);
        }
        .cp-logo-img {
          height: 40px;
          width: auto;
          display: block;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .cp-logo-img:hover {
          transform: scale(1.12);
        }

        @media(max-width:768px) {
          .cp-nav { display: none; }
          .cp-ball-wrap { bottom: 20px; right: 20px; }
          .cp-steps { grid-template-columns: 1fr; }
          .cp-cards { grid-template-columns: 1fr; }
          .cp-header { top: 16px; padding: 8px 20px; }
          .cp-logo-img { height: 32px; }
        }
      `}</style>

      {/* Header — logo only */}
      <div className={`cp-header${scrolled ? " scrolled" : ""}`}>
        <a href="/">
          <img src="/favicon2.png" alt="PromoGames" className="cp-logo-img" />
        </a>
      </div>

      {/* Nav dots */}
      <div className="cp-nav">
        {SECTIONS.map((_, i) => (
          <div
            key={i}
            className={`cp-dot${activeSection === i ? " active" : ""}`}
            onClick={() => scrollTo(i)}
          />
        ))}
      </div>

      {/* Ball */}
      <div className="cp-ball-wrap" onClick={() => scrollTo(Math.min(activeSection + 1, SECTIONS.length - 1))}>
        <BouncingBall color={SECTIONS[activeSection].accent} />
      </div>

      {/* Sections */}
      {SECTIONS.map((sec, i) => (
        <section
          key={i}
          className="cp-section"
          ref={(el) => (sectionRefs.current[i] = el)}
        >
          <div
            className="cp-bg-layer"
            ref={(el) => (bgRefs.current[i] = el)}
            style={{ backgroundColor: sec.bg }}
          />

          <ParallaxParticles accent={sec.accent} sectionIndex={i} />

          {/* Gradient orbs for depth */}
          <GradientOrb color={sec.accent} size={400} x="10%" y="20%" blur={80} speed={0.5} />
          <GradientOrb color={sec.accent} size={300} x="70%" y="60%" blur={100} speed={0.7} />
          <GradientOrb color={sec.accent} size={200} x="50%" y="10%" blur={60} speed={0.3} />

          <div
            className="cp-content"
            ref={(el) => (contentRefs.current[i] = el)}
          >
            <div className="cp-kicker">{sec.kicker}</div>
            <h1 className="cp-title">{sec.title}</h1>

            {sec.body && <p className="cp-body">{sec.body}</p>}

            {sec.cards && (
              <div className="cp-cards">
                {sec.cards.map((c, j) => (
                  <div className="cp-card" key={j}>
                    <span className="cp-card-icon">{c.icon}</span>
                    <div className="cp-card-title">{c.title}</div>
                    <div className="cp-card-desc">{c.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {sec.steps && (
              <div className="cp-steps">
                {sec.steps.map((s, j) => (
                  <div className="cp-step" key={j}>
                    <div className="cp-step-num">{s.num}</div>
                    <span className="cp-step-icon">{s.icon}</span>
                    <div className="cp-step-title">{s.title}</div>
                    <div className="cp-step-desc">{s.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {sec.features && (
              <div className="cp-features">
                {sec.features.map((f, j) => (
                  <div className="cp-feature" key={j}>
                    <div className="cp-feature-check">✓</div>
                    <div className="cp-feature-text">{f}</div>
                  </div>
                ))}
              </div>
            )}

            {sec.cta && (
              <button className="cp-cta" onClick={() => scrollTo(Math.min(i + 1, SECTIONS.length - 1))}>
                {sec.cta} <span className="cp-cta-arrow">→</span>
              </button>
            )}
          </div>
        </section>
      ))}
    </>
  );
}
