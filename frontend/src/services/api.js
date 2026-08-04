import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Core Auth endpoints
export const loginUser = async (email, password) => {
  const response = await api.post('/api/login', { email, password });
  return response.data;
};

export const apiService = {
  // Auth
  register: (name, email, password, role) =>
    api.post('/api/register', { name, email, password, role }),

  login: (email, password) =>
    api.post('/api/login', { email, password }),

  changePassword: (currentPassword, newPassword) =>
    api.post('/api/auth/change-password', { current_password: currentPassword, new_password: newPassword }),

  // Profile
  getProfile: () => api.get('/api/profile'),
  updateProfile: (data) => api.patch('/api/profile', data),

  // Tenders (authenticated)
  getTenders: () => api.get('/api/tenders'),
  getTender: (id) => api.get(`/api/tenders/${id}`),
  createTender: (formData) =>
    api.post('/api/tenders', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateTender: (id, data) => api.patch(`/api/tenders/${id}`, data),
  deleteTender: (id) => api.delete(`/api/tenders/${id}`),

  // Public (no auth required)
  getPublicTenders: () => api.get('/api/tenders/public'),
  getPublicTender: (id) => api.get(`/api/tenders/public/${id}`),
  getPublicStats: () => api.get('/api/stats/public'),

  // Proposals
  submitProposal: (formData) =>
    api.post('/api/proposals', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getProposal: (id) => api.get(`/api/proposals/${id}`),
  getProposals: () => api.get('/api/proposals'),
  updateProposalStatus: (id, status) =>
    api.patch(`/api/proposals/${id}/status`, { status }),
  deleteProposal: (id) => api.delete(`/api/proposals/${id}`),
  replaceProposal: (id, formData) =>
    api.patch(`/api/proposals/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Rankings
  getRankings: (tenderId) => api.get(`/api/rankings/${tenderId}`),

  // Admin (Company Procurement Officer)
  getAdminStats: () => api.get('/api/admin/stats'),
  getSupplierProfile: (userId) => api.get(`/api/admin/suppliers/${userId}`),
  submitTenderForApproval: (id) => api.patch(`/api/tenders/${id}/submit`),
  rescoreProposals: (id) => api.post(`/api/tenders/${id}/rescore`),

  // Super Admin
  getSuperAdminStats: () => api.get('/api/super-admin/stats'),
  getApprovalQueue: () => api.get('/api/super-admin/queue'),
  approveTender: (id) => api.post(`/api/super-admin/tenders/${id}/approve`),
  rejectTender: (id, reason) => api.post(`/api/super-admin/tenders/${id}/reject`, { reason }),
  getAllUsers: () => api.get('/api/super-admin/users'),
  createUser: (data) => api.post('/api/super-admin/users', data),
  updateUser: (id, data) => api.patch(`/api/super-admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/super-admin/users/${id}`),

  // Contact messages
  submitContact: (data) => api.post('/api/contact', data),
  getMessages: () => api.get('/api/super-admin/messages'),
  markMessageRead: (id) => api.patch(`/api/super-admin/messages/${id}/read`),
  markAllMessagesRead: () => api.patch('/api/super-admin/messages/read-all'),
};

export default api;
