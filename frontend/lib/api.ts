import axios from 'axios'
import { getToken, removeToken } from './auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
})

// Request interceptor: attach JWT from localStorage if present
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Response interceptor: on 401, clear token and redirect only if we sent a JWT
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadJwt = Boolean(error.config?.headers?.['Authorization'])
    if (error.response?.status === 401 && hadJwt) {
      removeToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Auth
export const authApi = {
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
  login: (data: Record<string, unknown>) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  guest: () => api.post('/auth/guest'),
}

// Products
export const productsApi = {
  list: (params?: Record<string, unknown>) => api.get('/products', { params }),
  getBySlug: (slug: string) => api.get(`/products/${slug}`),
}

// Categories
export const categoriesApi = {
  list: () => api.get('/categories'),
}

// Search
export const searchApi = {
  search: (params?: Record<string, unknown>) => api.get('/search', { params }),
  suggestions: (q: string) => api.get('/search/suggestions', { params: { q } }),
}

// Cart
export const cartApi = {
  get: (sessionToken?: string) =>
    api.get('/cart', {
      headers: sessionToken ? { 'X-Session-Token': sessionToken } : {},
    }),
  addItem: (data: Record<string, unknown>, sessionToken?: string) =>
    api.post('/cart/items', data, {
      headers: sessionToken ? { 'X-Session-Token': sessionToken } : {},
    }),
  updateItem: (id: string | number, data: Record<string, unknown>, sessionToken?: string) =>
    api.patch(`/cart/items/${id}`, data, {
      headers: sessionToken ? { 'X-Session-Token': sessionToken } : {},
    }),
  removeItem: (id: string | number, sessionToken?: string) =>
    api.delete(`/cart/items/${id}`, {
      headers: sessionToken ? { 'X-Session-Token': sessionToken } : {},
    }),
  saveForLater: (id: string | number, sessionToken?: string) =>
    api.post(
      `/cart/items/${id}/save-later`,
      {},
      {
        headers: sessionToken ? { 'X-Session-Token': sessionToken } : {},
      }
    ),
  clear: (sessionToken?: string) =>
    api.delete('/cart', {
      headers: sessionToken ? { 'X-Session-Token': sessionToken } : {},
    }),
}

// Orders
export const ordersApi = {
  checkout: (data: Record<string, unknown>, sessionToken?: string) =>
    api.post('/checkout', data, {
      headers: sessionToken ? { 'X-Session-Token': sessionToken } : {},
    }),
  list: (params?: Record<string, unknown>, sessionToken?: string) =>
    api.get('/orders', {
      params,
      headers: sessionToken ? { 'X-Session-Token': sessionToken } : {},
    }),
  getById: (id: string, sessionToken?: string) =>
    api.get(`/orders/${id}`, {
      headers: sessionToken ? { 'X-Session-Token': sessionToken } : {},
    }),
}
