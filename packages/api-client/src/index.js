import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const playerToken = localStorage.getItem('playerToken') || sessionStorage.getItem('playerToken');

  const isPlayerRoute = /pauth|play/.test(config.url);

  if (isPlayerRoute && playerToken) {
    config.headers.Authorization = `Bearer ${playerToken}`;
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (playerToken) {
    config.headers.Authorization = `Bearer ${playerToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const isAuthError = status === 401 || status === 403;

    const isLoginPath = window.location.pathname.includes('/login');
    const isVerifyOtp = err.config?.url?.includes('verify-otp');

    if (isAuthError && !isLoginPath && !isVerifyOtp) {
      const keys = ['token', 'user', 'playerToken', 'playerUser'];
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
export { api };
