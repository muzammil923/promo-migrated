import axios from 'axios';
import { postPromoCoinReward } from './lib/promocoins';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const playerToken = localStorage.getItem('playerToken') || sessionStorage.getItem('playerToken');
  const itToken = localStorage.getItem('itToken');
  const businessToken = localStorage.getItem('businessToken');
  
  const isPlayerRoute = /pauth|play/.test(config.url);
  const isITRoute = /^\/internal-team/.test(config.url);
  const isBusinessRoute = /^\/business/.test(config.url);

  if (isITRoute && itToken) {
    config.headers.Authorization = `Bearer ${itToken}`;
  } else if (isBusinessRoute && businessToken) {
    config.headers.Authorization = `Bearer ${businessToken}`;
  } else if (isPlayerRoute && playerToken) {
    config.headers.Authorization = `Bearer ${playerToken}`;
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (playerToken) {
    config.headers.Authorization = `Bearer ${playerToken}`;
  }
  
  return config;
});

// Handle 401 & 403 globally
api.interceptors.response.use(
  (res) => {
    // Universal "game finished" signal — every mini-game funnels through this
    // endpoint, so the post-game login prompt can never miss a completion,
    // even for games that render their own result screens.
    if (res.config?.url?.includes('/play/session/complete') && res.data?.success) {
      window.dispatchEvent(new CustomEvent('pg:session-complete'))
      // Backend-confirmed PromoCoins award → surfaced to the shell for the
      // wallet animation. Only fires when the server actually credited coins.
      if (res.data?.pc_reward) {
        postPromoCoinReward(res.data.pc_reward)
      }
    }
    return res;
  },
  (err) => {
    const status = err.response?.status;
    const isAuthError = status === 401 || status === 403;
    
    const isLoginPath = window.location.pathname.includes('/login');
    const isVerifyOtp = err.config?.url?.includes('verify-otp');
    const isPlayerRoute = /pauth|play/.test(err.config?.url || '');

    if (isAuthError && !isLoginPath && !isVerifyOtp) {
      // Player/game endpoints (/play/*, /pauth/*) are auth-optional: guests can
      // play without an account. A 401/403 here (e.g. stale/expired player token)
      // must NOT kick the player out of the game to /login — the login prompt
      // only belongs after the game ends and can always be skipped.
      if (isPlayerRoute) {
        ['playerToken', 'playerUser'].forEach(k => {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        });
        return Promise.reject(err);
      }

      console.error(`AUTH FAILURE: [${status}] URL: ${err.config?.url}`);
      
      const keys = ['token', 'user', 'playerToken', 'playerUser', 'itToken', 'itUser', 'businessToken', 'businessUser'];
      keys.forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
      
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
