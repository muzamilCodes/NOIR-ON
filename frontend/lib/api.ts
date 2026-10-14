import type { Address, AdminStats, Cart, Order, Product, User } from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TOKEN_KEY = 'cl_token';
const USER_KEY = 'cl_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

interface ApiError {
  error?: string;
}

async function request<T>(path: string, options: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers, cache: 'no-store' });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T & ApiError) : ({} as T & ApiError);
  if (!res.ok) {
    const msg = (data as ApiError).error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ---- catalog ----
export const getProducts = () => request<Product[]>('/api/products');
export const getProduct = (id: string) => request<Product>(`/api/products/${id}`);

// ---- auth ----
export interface AuthResult {
  token: string;
  user: User;
}
export const login = (email: string, password: string) =>
  request<AuthResult>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const register = (name: string, email: string, password: string) =>
  request<AuthResult>('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
export const me = () => request<{ user: User }>('/api/auth/me', {}, true);

// ---- cart ----
export const getCart = () => request<Cart>('/api/cart', {}, true);
export const addToCart = (productId: string, qty = 1) =>
  request<{ ok: boolean }>('/api/cart', { method: 'POST', body: JSON.stringify({ productId, qty }) }, true);
export const removeFromCart = (productId: string) =>
  request<{ ok: boolean }>(`/api/cart/${productId}`, { method: 'DELETE' }, true);
export const clearCart = () => request<{ ok: boolean }>('/api/cart', { method: 'DELETE' }, true);

// ---- orders ----
export const createOrder = (payload: { address: Address; paymentMethod: string }) =>
  request<Order>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }, true);
export const getMyOrders = () => request<Order[]>('/api/orders', {}, true);

// ---- admin ----
export const adminStats = () => request<AdminStats>('/api/admin/stats', {}, true);
export const adminOrders = () => request<Order[]>('/api/admin/orders', {}, true);
export const adminAddProduct = (payload: Partial<Product>) =>
  request<Product>('/api/admin/products', { method: 'POST', body: JSON.stringify(payload) }, true);
export const adminDeleteProduct = (id: string) =>
  request<{ ok: boolean }>(`/api/admin/products/${id}`, { method: 'DELETE' }, true);
