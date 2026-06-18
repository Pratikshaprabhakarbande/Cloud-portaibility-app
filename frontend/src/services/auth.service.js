/**
 * Auth API calls — maps 1:1 to the backend /api/auth endpoints.
 */
import api from './api.js';

const authService = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data.data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }).then((r) => r.data),
  getProfile: () => api.get('/auth/profile').then((r) => r.data.data.user),
  updateProfile: (payload) => api.put('/auth/profile', payload).then((r) => r.data.data.user),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token, password) =>
    api.post('/auth/reset-password', { token, password }).then((r) => r.data)
};

export default authService;
