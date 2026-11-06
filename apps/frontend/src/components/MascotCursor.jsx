import { useEffect } from 'react';

/*
 * MascotCursor.jsx
 * Custom purple cursor with eye-tracking pupils.
 * Imported exactly as provided — no changes.
 */

const MascotCursor = () => {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (window.innerWidth > 640 && window.matchMedia('(pointer: fine)').matches) {
      const mascot = document.getElementById('mascotCursor');
      if (!mascot) return;
      const pupils = mascot.querySelectorAll('.pupil');
      let mx = 0, my = 0;
      let pupilX = 0, pupilY = 0, targetPX = 0, targetPY = 0, scale = 1, targetScale = 1;
      let started = false;
      const PUPIL_RANGE = 3.4;

      const HOVER_SEL = 'a, button, .btn';

      // The rAF loop only runs while the mouse is actually moving, so an idle
      // page doesn't repaint the cursor at 60fps for no reason.
      let raf = null;
      let lastMove = 0;

      const onMouseMove = (e) => {
        const prevX = mx, prevY = my;
        mx = e.clientX; my = e.clientY;
        lastMove = performance.now();
        if (!started) {
          started = true;
          document.body.classList.add('custom-cursor-on');
        }
        if (!raf) raf = requestAnimationFrame(loop);
        const dx = mx - prevX, dy = my - prevY;
        const dist = Math.hypot(dx, dy);
        if (!reduce && dist > 1.5) {
          const dir = Math.atan2(dy, dx);
          targetPX = Math.cos(dir) * PUPIL_RANGE;
          targetPY = Math.sin(dir) * PUPIL_RANGE;
        }
      };

      const onMouseOver = (e) => {
        if (e.target.closest(HOVER_SEL)) targetScale = 1.16;
      };
      const onMouseOut = (e) => {
        const from = e.target.closest(HOVER_SEL);
        if (from && !(e.relatedTarget && from.contains(e.relatedTarget))) targetScale = 1;
      };
      const onMouseLeave = () => document.body.classList.remove('custom-cursor-on');
      const onMouseEnter = () => document.body.classList.add('custom-cursor-on');

      let pressStart = 0;
      const onMouseDown = (e) => {
        if (e.target.closest(HOVER_SEL)) {
          document.body.classList.add('pressing');
          pressStart = performance.now();
        }
      };
      function endPress() {
        const elapsed = performance.now() - pressStart;
        const wait = Math.max(0, 120 - elapsed);
        setTimeout(() => document.body.classList.remove('pressing'), wait);
      }
      const onMouseUp = endPress;
      const onBlur = () => document.body.classList.remove('pressing');

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      document.addEventListener('mouseover', onMouseOver);
      document.addEventListener('mouseout', onMouseOut);
      window.addEventListener('mouseleave', onMouseLeave);
      window.addEventListener('mouseenter', onMouseEnter);
      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mouseup', onMouseUp);
      window.addEventListener('blur', onBlur);

      function loop() {
        pupilX += (targetPX - pupilX) * 0.15;
        pupilY += (targetPY - pupilY) * 0.15;
        scale += (targetScale - scale) * 0.18;
        mascot.style.transform = `translate(${mx - 6}px,${my - 4}px) rotate(8deg) scale(${scale})`;
        pupils.forEach(p => { p.style.transform = `translate(${pupilX}px,${pupilY}px)`; });
        targetPX *= 0.985; targetPY *= 0.985;
        if (performance.now() - lastMove > 400) { raf = null; return; } // idle → stop
        raf = requestAnimationFrame(loop);
      }

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseover', onMouseOver);
        document.removeEventListener('mouseout', onMouseOut);
        window.removeEventListener('mouseleave', onMouseLeave);
        window.removeEventListener('mouseenter', onMouseEnter);
        document.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('blur', onBlur);
        document.body.classList.remove('custom-cursor-on', 'pressing');
      };
    }
  }, []);

  // Don't render anything on mobile / touch devices
  if (typeof window !== 'undefined' && (window.innerWidth <= 640 || !window.matchMedia('(pointer: fine)').matches)) {
    return null;
  }

  return (
    <div className="mascot-cursor" id="mascotCursor">
      <svg viewBox="0 0 90 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mcGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e7b8ff"/>
            <stop offset="55%" stopColor="#9210f6"/>
            <stop offset="100%" stopColor="#5c0499"/>
          </linearGradient>
        </defs>
        <path d="M10 4 C6 2 2 6 4 11 L24 84 C26 91 35 92 38 85 L46 64 L66 80 C73 85 82 78 78 70 L64 50 C75 48 79 38 71 32 L16 6 C14 4 12 3 10 4 Z"
          fill="url(#mcGrad)" stroke="#fff" strokeWidth="3.5" strokeLinejoin="round"/>
        <path d="M10 4 C6 2 2 6 4 11 L24 84 C26 91 35 92 38 85 L46 64 L66 80 C73 85 82 78 78 70 L64 50 C75 48 79 38 71 32 L16 6 C14 4 12 3 10 4 Z"
          fill="none" stroke="#f5c842" strokeWidth="1" opacity=".6"/>
        <path d="M16 20 Q24 12 33 17" fill="none" stroke="#5c0499" strokeWidth="3" strokeLinecap="round"/>
        <g>
          <circle cx="27" cy="32" r="8" fill="#fff" stroke="#5c0499" strokeWidth="2"/>
          <circle className="pupil" cx="27" cy="32" r="3.6" fill="#1a0a26"/>
        </g>
        <g>
          <circle cx="44" cy="30" r="9.5" fill="#fff" stroke="#5c0499" strokeWidth="2"/>
          <circle className="pupil" cx="44" cy="30" r="4.1" fill="#1a0a26"/>
        </g>
        <path className="mc-mouth" d="M22 50 Q32 56 42 48" fill="none" stroke="#5c0499" strokeWidth="2.4" strokeLinecap="round"/>
      </svg>
    </div>
  );
};

export default MascotCursor;
