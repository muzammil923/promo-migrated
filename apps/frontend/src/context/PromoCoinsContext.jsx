import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import {
  PROMOCOIN_REWARD_EVENT,
  PROMOCOIN_REWARD_MESSAGE,
  PROMOCOIN_AUTH_MESSAGE,
} from '../lib/promocoins';

const PromoCoinsContext = createContext(null);

// Global PromoCoins source of truth for the web shell.
// - balance:  member's pc_balance from the backend (null → not signed in)
// - pendingReward: last backend-confirmed award awaiting the wallet animation
// - The header wallet (GameModal) renders from this; games never mutate it —
//   they emit a message and the animation + balance update happen here.
export function PromoCoinsProvider({ children }) {
  const [balance, setBalance] = useState(null);
  const [pendingReward, setPendingReward] = useState(null);
  const lastRewardKeyRef = useRef('');

  const refresh = useCallback(async () => {
    const hasToken =
      localStorage.getItem('playerToken') || sessionStorage.getItem('playerToken');
    if (!hasToken) {
      setBalance(null);
      return;
    }
    try {
      const res = await api.get('/pauth/me');
      if (res.data?.success && res.data.player) {
        setBalance(res.data.player.pc_balance ?? null);
      }
    } catch (err) {
      if (err.response?.status === 401) setBalance(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const applyReward = (payload) => {
      if (!payload || payload.rewarded !== true) return;
      if (payload.newBalance != null) setBalance(payload.newBalance);
      const key = `${payload.sessionId || 's'}:${payload.transactionId || 't'}`;
      if (lastRewardKeyRef.current === key) return;
      lastRewardKeyRef.current = key;
      setPendingReward(payload);
    };

    // Rewards fly in from the child game iframe (postMessage) …
    const onMessage = (e) => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === PROMOCOIN_REWARD_MESSAGE) applyReward(data);
      // A player logged in/registered inside the game → re-sync the wallet.
      if (data.type === PROMOCOIN_AUTH_MESSAGE) refresh();
    };
    // … or from this same document (axios interceptor / captured fetch).
    const onEvent = (e) => applyReward(e.detail || {});

    window.addEventListener('message', onMessage);
    window.addEventListener(PROMOCOIN_REWARD_EVENT, onEvent);
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener(PROMOCOIN_REWARD_EVENT, onEvent);
    };
  }, [refresh]);

  const clearReward = useCallback(() => setPendingReward(null), []);

  return (
    <PromoCoinsContext.Provider value={{ balance, refresh, pendingReward, clearReward }}>
      {children}
    </PromoCoinsContext.Provider>
  );
}

export const usePromoCoins = () => useContext(PromoCoinsContext);