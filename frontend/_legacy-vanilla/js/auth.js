const API = '';  // same-origin; backend serves frontend statically

const TOKEN_KEY = 'cl_token';
const USER_KEY = 'cl_user';

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } }
export function isLoggedIn() { return !!getToken(); }

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ---- Auth ----
export async function register(name, email, password) {
  const data = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  saveSession(data.token, data.user);
  return data.user;
}

export async function login(email, password) {
  const data = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveSession(data.token, data.user);
  return data.user;
}

export async function fetchMe() {
  const data = await api('/api/auth/me');
  return data.user;
}

// ---- Products ----
export async function getProducts() {
  return api('/api/products');
}
export async function getProduct(id) {
  return api(`/api/products/${id}`);
}

// ---- Cart ----
export async function getCart() {
  return api('/api/cart');
}
export async function addToCart(productId, qty = 1) {
  return api('/api/cart', { method: 'POST', body: JSON.stringify({ productId, qty }) });
}
export async function removeFromCart(productId) {
  return api(`/api/cart/${productId}`, { method: 'DELETE' });
}
export async function clearCart() {
  return api('/api/cart', { method: 'DELETE' });
}
export async function getCartCount() {
  if (!isLoggedIn()) return 0;
  try {
    const cart = await getCart();
    return cart.items.reduce((n, i) => n + i.qty, 0);
  } catch { return 0; }
}

// ---- Orders ----
export async function createOrder() {
  return api('/api/orders', { method: 'POST' });
}
export async function getMyOrders() {
  return api('/api/orders');
}

// ---- Admin ----
export async function adminStats() { return api('/api/admin/stats'); }
export async function adminOrders() { return api('/api/admin/orders'); }
export async function adminAddProduct(payload) {
  return api('/api/admin/products', { method: 'POST', body: JSON.stringify(payload) });
}
export async function adminDeleteProduct(id) {
  return api(`/api/admin/products/${id}`, { method: 'DELETE' });
}
