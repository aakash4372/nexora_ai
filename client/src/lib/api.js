import axios from 'axios';

/**
 * Axios instance pre-configured for the Nexora API.
 * Base URL comes from the VITE_API_URL env variable (set in client/.env).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // send cookies with cross-origin requests
});

/* ── Request interceptor: attach JWT token if present ── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nexora_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response interceptor: handle 401 globally ── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nexora_token');
      // Trigger a page reload to force re-auth (simple approach without router)
      window.dispatchEvent(new CustomEvent('nexora:unauthorized'));
    }
    return Promise.reject(error);
  }
);

/* ─── Auth ───────────────────────────────────────────────── */
export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
  googleLogin: (data) => api.post('/api/auth/google', data),
  me: () => api.get('/api/auth/me'),
};

/* ─── Conversations ──────────────────────────────────────── */
export const conversationsAPI = {
  list: (params) => api.get('/api/conversations', { params }),
  get: (id) => api.get(`/api/conversations/${id}`),
  sendMessage: (id, data) => api.post(`/api/conversations/${id}/messages`, data),
  update: (id, data) => api.patch(`/api/conversations/${id}`, data),
};

/* ─── Contacts ───────────────────────────────────────────── */
export const contactsAPI = {
  list: (params) => api.get('/api/contacts', { params }),
  get: (id) => api.get(`/api/contacts/${id}`),
  create: (data) => api.post('/api/contacts', data),
  update: (id, data) => api.patch(`/api/contacts/${id}`, data),
  delete: (id) => api.delete(`/api/contacts/${id}`),
};

/* ─── Automations ────────────────────────────────────────── */
export const automationsAPI = {
  list: () => api.get('/api/automations'),
  get: (id) => api.get(`/api/automations/${id}`),
  create: (data) => api.post('/api/automations', data),
  update: (id, data) => api.patch(`/api/automations/${id}`, data),
  delete: (id) => api.delete(`/api/automations/${id}`),
};

/* ─── Campaigns ──────────────────────────────────────────── */
export const campaignsAPI = {
  list: () => api.get('/api/campaigns'),
  get: (id) => api.get(`/api/campaigns/${id}`),
  create: (data) => api.post('/api/campaigns', data),
  update: (id, data) => api.patch(`/api/campaigns/${id}`, data),
  delete: (id) => api.delete(`/api/campaigns/${id}`),
};

/* ─── Analytics ──────────────────────────────────────────── */
export const analyticsAPI = {
  getAll: () => api.get('/api/analytics'),
  getOverview: () => api.get('/api/analytics/overview'),
  getChannels: () => api.get('/api/analytics/channels'),
  getWeekly: () => api.get('/api/analytics/weekly'),
};

/* ─── Instagram ──────────────────────────────────────────── */
export const instagramAPI = {
  getStatus: (workspaceId) => api.get('/api/instagram/status', { params: { workspaceId } }),
  connect: (workspaceId) => api.get('/api/instagram/connect', { params: { workspaceId } }),
  disconnect: (workspaceId) => api.post('/api/instagram/disconnect', { workspaceId }),
};

export default api;
