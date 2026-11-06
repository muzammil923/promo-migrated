import { useEffect, useRef, useState } from 'react';
import { usePromoCoins } from '../context/PromoCoinsContext';
import { formatCoins } from '../lib/promocoins';
import PromoCoinsRewardAnimation from './PromoCoinsRewardAnimation';

// Count-up display: animates oldBalance → newBalance while a confirmed reward
// is animating, otherwise just mirrors the current balance.
function useAnimatedBalance(from, to) {
  const [display, setDisplay] = useState(to);

  useEffect(() => {
    if (from != null && to != null && from !== to) {
      const start = performance.now();
      const dur = 600;
      let rafId;
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(from + (to - from) * eased));
        if (t < 1) rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(rafId);
    }
    setDisplay(to);
  }, [from, to]);

  return display;
}

// ── Header wallet pill (global, inside the game modal gm-bar) ────────────────
// The single place the player's PromoCoins balance is shown while playing.
// Always rendered (sits left of the play count); guests see 0 with a
// "log in to earn" hint — only a signed-in player's wallet can grow.
export default function PromoCoinsWallet() {
  const { balance, pendingReward, clearReward } = usePromoCoins();

  const isGuest = balance == null;
  const animateFrom =
    pendingReward && pendingReward.oldBalance != null ? pendingReward.oldBalance : null;
  const display = useAnimatedBalance(animateFrom, balance ?? 0);

  return (
    <>
      <div
        className={`gm-wallet promo-wallet${isGuest ? ' gm-wallet--guest' : ''}`}
        data-promo-wallet
        title={isGuest ? 'Log in to earn PromoCoins' : `PromoCoins balance: ${formatCoins(balance)}`}
        aria-label={isGuest ? 'PromoCoins wallet — log in to earn' : `PromoCoins balance: ${formatCoins(balance)}`}
      >
        <img className="gm-wallet-coin" src="/promocoin.webp" alt="" aria-hidden="true" width="14" height="14" />
        <span className="gm-wallet-amount">{formatCoins(display)}</span>
        <span className="gm-wallet-label">PC</span>
      </div>
      {pendingReward && (
        <PromoCoinsRewardAnimation reward={pendingReward} onDone={clearReward} />
      )}
    </>
  );
}