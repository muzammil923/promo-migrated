import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { formatCoins } from '../lib/promocoins';

// ── PromoCoins reward animation ───────────────────────────────────────────────
// Rendered once per backend-confirmed award inside the game modal. Coins fly
// from the middle of the game area into the wallet pill ([data-promo-wallet]).
// Pure CSS-transform/DOM animation (no libraries), GPU-friendly, respects
// prefers-reduced-motion, and never blocks touches/clicks (pointer-events none).
//
// The layer is PORTALED to <body>: it uses position:fixed with viewport-space
// coordinates, so it must not live inside a transformed ancestor (the game
// modal animates `transform` during gmSlideUp, which would otherwise become
// the fixed layer's containing block and offset the whole flight path).

const COIN_COUNT = 6;

export default function PromoCoinsRewardAnimation({ reward, onDone }) {
  const layerRef = useRef(null);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone && onDone();
  };

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) {
      finish();
      return;
    }

    let disposed = false;
    const cAFs = [];
    const timeouts = [];
    const raf = (cb) => {
      const id = requestAnimationFrame(cb);
      cAFs.push(id);
      return id;
    };
    const later = (cb, ms) => {
      const id = setTimeout(cb, ms);
      timeouts.push(id);
      return id;
    };

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const amount = Math.max(0, Number(reward?.reward) || 0);

    // ── Target: the wallet pill in the game header ──
    const wallet = document.querySelector('[data-promo-wallet]');
    if (!wallet) {
      finish();
      return;
    }
    const wRect = wallet.getBoundingClientRect();
    const tx = wRect.left + wRect.width / 2;
    const ty = wRect.top + wRect.height / 2;

    // ── Origin: middle-ish of the game area (real rect when available) ──
    const wrap =
      document.querySelector('[data-gm-game-area]') || document.querySelector('.gm-iframe-wrap');
    let ox;
    let oy;
    if (wrap) {
      const r = wrap.getBoundingClientRect();
      ox = r.left + r.width * 0.5;
      oy = r.top + r.height * 0.42;
    } else {
      ox = window.innerWidth * 0.5;
      oy = window.innerHeight * 0.42;
    }

    // ── Badge: "🪙 +10 PromoCoins" pops in at the origin ──
    const badge = document.createElement('div');
    badge.className = 'promo-reward-badge';
    badge.innerHTML = `<img src="/promocoin.webp" alt="" width="18" height="18" style="vertical-align:-3px;margin-right:4px">+${formatCoins(amount)} PromoCoins`;
    badge.style.transform = `translate(${ox}px, ${oy}px) translate(-50%, -50%) scale(0.55)`;
    layer.appendChild(badge);
    raf(() => {
      badge.style.transform = `translate(${ox}px, ${oy}px) translate(-50%, -50%) scale(1)`;
    });

    const pulseWallet = () => {
      wallet.classList.remove('promo-wallet--pulse');
      void wallet.offsetWidth;
      wallet.classList.add('promo-wallet--pulse');
      later(() => wallet.classList.remove('promo-wallet--pulse'), 700);
    };

    const finishFade = () => {
      badge.style.transition = 'opacity .3s ease, transform .3s ease';
      badge.style.opacity = '0';
      const coins = layer.querySelectorAll('.promo-reward-coin');
      coins.forEach((c) => {
        c.style.transition = 'opacity .3s ease, transform .3s ease';
      });
      later(finish, 320);
    };

    if (prefersReduced) {
      // Minimal: badge fades in, brief wallet glow, done.
      later(pulseWallet, 600);
      later(finishFade, 820);
      return () => cleanup();
    }

    // ── Coins: quadratic-bezier arcs from origin into the wallet ──
    const coinsFly = () => {
      for (let i = 0; i < COIN_COUNT; i++) {
        const startDelay = 220 + i * 45;
        const coin = document.createElement('img');
        coin.className = 'promo-reward-coin';
        coin.src = '/promocoin.webp';
        coin.alt = '';
        coin.width = 28;
        coin.height = 28;
        layer.appendChild(coin);

        const dur = 620 + Math.random() * 130;
        const peak = 70 + Math.random() * 90;
        const drift = (Math.random() - 0.5) * 140;
        const cx = (ox + tx) / 2 + drift;
        const cy = (oy + ty) / 2 - peak;
        const startTime = performance.now();
        let begunAt = null;

        const step = (now) => {
          if (disposed) return;
          if (begunAt === null) {
            if (now - startTime < startDelay) {
              raf(step);
              return;
            }
            begunAt = now;
          }
          const t = Math.min(1, (now - begunAt) / dur);
          const u = 1 - t;
          const x = u * u * ox + 2 * u * t * cx + t * t * tx;
          const y = u * u * oy + 2 * u * t * cy + t * t * ty;
          const s = 1 - t * 0.5;
          coin.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s})`;
          coin.style.opacity = t > 0.82 ? String(1 - (t - 0.82) / 0.18) : '1';
          if (t < 1) {
            raf(step);
          } else {
            coin.classList.add('promo-reward-coin--landed');
            if (i === COIN_COUNT - 1) {
              pulseWallet();
              later(finishFade, 260);
            }
          }
        };
        raf(step);
      }
    };
    coinsFly();

    function cleanup() {
      disposed = true;
      cAFs.forEach((id) => cancelAnimationFrame(id));
      timeouts.forEach((id) => clearTimeout(id));
      while (layer.firstChild) layer.removeChild(layer.lastChild);
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reward]);

  return createPortal(
    <div ref={layerRef} className="promo-reward-layer" aria-hidden="true">
    </div>,
    document.body
  );
}