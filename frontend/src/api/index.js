import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
  timeout: 10000,
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — refresh or redirect
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/auth/refresh`,
          { refreshToken }
        );
        localStorage.setItem('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ─── Auth ───────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  registerSeller: (data) => api.post('/auth/register/seller', data),
};

// ─── Products ────────────────────────────────────────
export const productApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// ─── Listings ────────────────────────────────────────
export const listingApi = {
  getMyListings: () => api.get('/listings/my'),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
};

// ─── Cart & Orders ───────────────────────────────────
export const cartApi = {
  get: () => api.get('/orders/cart'),
  addItem: (data) => api.post('/orders/cart', data),
  updateItem: (id, data) => api.put(`/orders/cart/${id}`, data),
  removeItem: (id) => api.delete(`/orders/cart/${id}`),
  clear: () => api.delete('/orders/cart'),
};

export const orderApi = {
  checkout: (data) => api.post('/orders/checkout', data),
  getMyOrders: () => api.get('/orders/my'),
  getById: (id) => api.get(`/orders/${id}`),
};

// ─── Payment ─────────────────────────────────────────
export const paymentApi = {
  initiate: (orderId) => api.post('/payments/initiate', { orderId }),
  verify: (data) => api.post('/payments/verify', data),
};

// ─── Seller ───────────────────────────────────────────
export const sellerApi = {
  getDashboard: () => api.get('/listings/seller/dashboard'),
  getOrders: () => api.get('/orders/seller'),
  getSettlements: () => api.get('/settlements/my'),
};

export default api;
