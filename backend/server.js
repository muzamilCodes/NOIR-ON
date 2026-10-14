const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'chrono-luxe-dev-secret-change-me';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ---------------------------------------------------------------------------
// In-memory data stores
// ---------------------------------------------------------------------------
const users = [];          // { id, name, email, passwordHash }
const carts = new Map();   // userId -> [{ productId, qty }]

const products = [
  {
    id: 'block-rg',
    name: 'NOIRÉON Block RG',
    price: 1850000,
    category: 'Skeleton',
    tagline: 'Rose-gold octagonal case · flying tourbillon',
    description:
      'The signature NOIRÉON. An octagonal 18k rose-gold case frames a fully skeletonised movement beneath edge-to-edge sapphire, with a flying tourbillon at six and a power-reserve indicator at twelve.',
    caseColor: 0xc9a06a,
    strapColor: 0x0e0e10,
    specs: { movement: 'Manual Cal. NR-T01 Tourbillon', case: '42mm 18k Rose Gold', water: '30m', power: '90h reserve' },
  },
  {
    id: 'saphir-noir',
    name: 'NOIRÉON Saphir Noir',
    price: 1475000,
    category: 'Skeleton',
    tagline: 'Black DLC case · smoked sapphire',
    description:
      'A stealth interpretation in black DLC with a smoked sapphire crystal. The skeleton movement floats in shadow, lit only by polished ruby jewels and rhodium gears.',
    caseColor: 0x2a2a2e,
    strapColor: 0x0a0a0c,
    specs: { movement: 'Manual Cal. NR-T02 Tourbillon', case: '42mm Titanium DLC', water: '30m', power: '90h reserve' },
  },
  {
    id: 'reserve-royale',
    name: 'NOIRÉON Réserve Royale',
    price: 1240000,
    category: 'Skeleton',
    tagline: 'White-gold case · extended power reserve',
    description:
      'White gold lends a cool clarity to the Réserve Royale, whose enlarged power-reserve indicator tracks a full ninety hours of autonomous run-time.',
    caseColor: 0xd8d8dc,
    strapColor: 0x101014,
    specs: { movement: 'Manual Cal. NR-T03', case: '42mm 18k White Gold', water: '30m', power: '90h reserve' },
  },
  {
    id: 'calibre-lumiere',
    name: 'NOIRÉON Calibre Lumière',
    price: 980000,
    category: 'Skeleton',
    tagline: 'Steel case · luminous skeleton hands',
    description:
      'Brushed steel and super-luminova skeleton hands make the Calibre Lumière the most wearable entry to the NOIRÉON skeleton family.',
    caseColor: 0xc0c6cc,
    strapColor: 0x121216,
    specs: { movement: 'Manual Cal. NR-T04', case: '42mm Brushed Steel', water: '50m', power: '72h reserve' },
  },
  {
    id: 'tourbillon-bleu',
    name: 'NOIRÉON Tourbillon Bleu',
    price: 2100000,
    category: 'Haute',
    tagline: 'Blue titanium · sapphire tourbillon bridge',
    description:
      'Anodised blue titanium surrounds a sapphire tourbillon bridge, suspending the rotating cage as if in mid-air. Limited to 25 pieces a year.',
    caseColor: 0x3a5a8a,
    strapColor: 0x0c1020,
    specs: { movement: 'Manual Cal. NR-T05 Tourbillon', case: '42mm Blue Titanium', water: '30m', power: '100h reserve' },
  },
  {
    id: 'bronze-patine',
    name: 'NOIRÉON Bronze Patine',
    price: 860000,
    category: 'Skeleton',
    tagline: 'Living bronze · evolves with wear',
    description:
      'CuSn8 bronze warms and patinas with the wearer, making every Bronze Patine a one-of-one collaboration between owner and metal.',
    caseColor: 0xb87333,
    strapColor: 0x2a1c10,
    specs: { movement: 'Manual Cal. NR-T04', case: '42mm Bronze', water: '50m', power: '72h reserve' },
  },
  {
    id: 'nuit-noire',
    name: 'NOIRÉON Nuit Noire',
    price: 1620000,
    category: 'Haute',
    tagline: 'Black ceramic · rose-gold bridges',
    description:
      'Matte black ceramic meets rose-gold skeleton bridges in the Nuit Noire — a study in contrast reserved for the evening wrist.',
    caseColor: 0x1c1c20,
    strapColor: 0x0a0a0c,
    specs: { movement: 'Manual Cal. NR-T06 Tourbillon', case: '42mm Black Ceramic', water: '30m', power: '90h reserve' },
  },
  {
    id: 'heritage-or',
    name: 'NOIRÉON Héritage Or',
    price: 2450000,
    category: 'Haute',
    tagline: 'Yellow gold · hand-engraved movement',
    description:
      'The pinnacle. A yellow-gold case over a fully hand-engraved skeleton movement, assembled by a single master watchmaker over four months.',
    caseColor: 0xd4af37,
    strapColor: 0x1a1208,
    specs: { movement: 'Manual Cal. NR-T07 Tourbillon', case: '42mm 18k Yellow Gold', water: '30m', power: '100h reserve' },
  },
];

const findProduct = (id) => products.find((p) => p.id === id);

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role || 'user';
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function authAdmin(req, res, next) {
  if (req.userRole !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role || 'user' }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

// ---------------------------------------------------------------------------
// Auth routes
// ---------------------------------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const normalizedEmail = String(email).toLowerCase().trim();
  if (users.some((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const role = req.body.role === 'admin' ? 'admin' : 'user';
  const user = { id: `u_${Date.now().toString(36)}`, name, email: normalizedEmail, passwordHash, role };
  users.push(user);
  res.status(201).json({ token: signToken(user), user: { id: user.id, name, email: normalizedEmail, role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const normalizedEmail = String(email).toLowerCase().trim();
  const user = users.find((u) => u.email === normalizedEmail);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: signToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user' } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user' } });
});

// ---------------------------------------------------------------------------
// Product routes
// ---------------------------------------------------------------------------
app.get('/api/products', (_req, res) => res.json(products));

app.get('/api/products/:id', (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// ---------------------------------------------------------------------------
// Cart routes
// ---------------------------------------------------------------------------
app.get('/api/cart', auth, (req, res) => {
  const items = carts.get(req.userId) || [];
  const detailed = items
    .map((item) => {
      const product = findProduct(item.productId);
      return product ? { ...product, qty: item.qty } : null;
    })
    .filter(Boolean);
  const total = detailed.reduce((sum, p) => sum + p.price * p.qty, 0);
  res.json({ items: detailed, total });
});

app.post('/api/cart', auth, (req, res) => {
  const { productId, qty = 1 } = req.body || {};
  const product = findProduct(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const items = carts.get(req.userId) || [];
  const existing = items.find((i) => i.productId === productId);
  if (existing) existing.qty += Number(qty) || 1;
  else items.push({ productId, qty: Number(qty) || 1 });
  carts.set(req.userId, items);
  res.status(201).json({ ok: true });
});

app.delete('/api/cart/:productId', auth, (req, res) => {
  const items = (carts.get(req.userId) || []).filter((i) => i.productId !== req.params.productId);
  carts.set(req.userId, items);
  res.json({ ok: true });
});

app.delete('/api/cart', auth, (req, res) => {
  carts.set(req.userId, []);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
const orders = [];

app.post('/api/orders', auth, (req, res) => {
  const items = carts.get(req.userId) || [];
  if (!items.length) return res.status(400).json({ error: 'Cart is empty' });
  const detailed = items
    .map((i) => { const p = findProduct(i.productId); return p ? { id: p.id, name: p.name, price: p.price, qty: i.qty } : null; })
    .filter(Boolean);
  const total = detailed.reduce((s, i) => s + i.price * i.qty, 0);
  const owner = users.find((u) => u.id === req.userId);
  const order = {
    id: `o_${Date.now().toString(36)}`,
    userId: req.userId,
    email: owner ? owner.email : '',
    items: detailed,
    total,
    status: 'Paid',
    date: new Date().toISOString(),
  };
  orders.push(order);
  carts.set(req.userId, []);
  res.status(201).json(order);
});

app.get('/api/orders', auth, (req, res) => {
  res.json(orders.filter((o) => o.userId === req.userId));
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
app.get('/api/admin/stats', auth, authAdmin, (_req, res) => {
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  res.json({ products: products.length, orders: orders.length, users: users.length, revenue });
});

app.get('/api/admin/orders', auth, authAdmin, (_req, res) => res.json(orders));

app.post('/api/admin/products', auth, authAdmin, (req, res) => {
  const { name, price, category = 'Skeleton', tagline = '', caseColor = 0xc9a06a, strapColor = 0x0e0e10 } = req.body || {};
  if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });
  const product = {
    id: `nr_${Date.now().toString(36)}`,
    name, price: Number(price), category, tagline,
    description: tagline || name,
    caseColor: Number(caseColor) || 0xc9a06a,
    strapColor: Number(strapColor) || 0x0e0e10,
    specs: { movement: 'Manual Cal. NR-T01', case: '42mm', water: '30m', power: '90h reserve' },
  };
  products.push(product);
  res.status(201).json(product);
});

app.delete('/api/admin/products/:id', auth, authAdmin, (req, res) => {
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  products.splice(idx, 1);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Fallback: serve frontend for unknown non-API routes
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  next();
});

app.listen(PORT, () => {
  console.log(`Chrono Luxe server running on http://localhost:${PORT}`);
});
