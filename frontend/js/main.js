import { initHeroWatch, initCardWatch } from './watch3d.js';
import {
  getProducts, getProduct, addToCart, getCart, removeFromCart, clearCart,
  isLoggedIn, getUser, login, register,
  createOrder, getMyOrders, adminStats, adminOrders, adminAddProduct, adminDeleteProduct,
} from './auth.js';
import { injectLayout, initReveal, refreshCartBadge, updateNavAuth, toast } from './layout.js';

// ---- helpers ----
export const money = (n) => '₹' + Number(n).toLocaleString('en-IN');

// 3D tilt-on-hover for product cards.
function initTilt(root = document) {
  root.querySelectorAll('.card').forEach((card) => {
    if (card.dataset.tilt) return;
    card.dataset.tilt = '1';
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-8px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

// Animated number counters for [data-count] elements.
function initCounters(root = document) {
  const els = root.querySelectorAll('[data-count]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      io.unobserve(el);
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur = 1400;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  els.forEach((el) => io.observe(el));
}

function productCard(p) {
  const card = document.createElement('div');
  card.className = 'card reveal';
  card.innerHTML = `
    <a href="product.html?id=${p.id}" class="card-canvas">
      <span class="card-cat">${p.category}</span>
      <canvas data-card-canvas></canvas>
    </a>
    <div class="card-body">
      <h3>${p.name}</h3>
      <span class="card-tag">${p.tagline}</span>
      <div class="card-foot">
        <span class="price">${money(p.price)}</span>
        <button class="btn btn-ghost btn-sm" data-add="${p.id}">Add to Cart</button>
      </div>
    </div>
  `;
  const canvas = card.querySelector('[data-card-canvas]');
  initCardWatch(canvas, {
    caseColor: p.caseColor, dialColor: p.dialColor,
    accentColor: p.accentColor, strapColor: p.strapColor, spinSpeed: 0.45,
  });
  return card;
}

function wireAddButtons(root = document) {
  root.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.add;
      if (!isLoggedIn()) {
        toast('Sign in to add items to your cart');
        setTimeout(() => (location.href = 'login.html?next=' + encodeURIComponent(location.pathname + location.search)), 900);
        return;
      }
      btn.disabled = true;
      try {
        await addToCart(id);
        toast('Added to cart');
        await refreshCartBadge();
      } catch (err) {
        toast(err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

async function renderGrid(container, products) {
  products.forEach((p) => container.appendChild(productCard(p)));
  wireAddButtons(container);
  initTilt(container);
  initReveal();
}

// ---- page controllers ----
async function pageHome() {
  const heroImg = document.querySelector('.hero-watch-img');
  if (heroImg && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const wrap = heroImg.parentElement;
    wrap.addEventListener('mousemove', (e) => {
      const r = wrap.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width - 0.5;
      const my = (e.clientY - r.top) / r.height - 0.5;
      heroImg.style.transform = `translate(${mx * 14}px, ${my * 12}px) rotateY(${mx * 4}deg) rotateX(${-my * 4}deg)`;
    });
    wrap.addEventListener('mouseleave', () => { heroImg.style.transform = ''; });
  }

  initCounters(document);

  const featured = document.getElementById('featured-grid');
  if (featured) {
    const products = await getProducts();
    await renderGrid(featured, products.slice(0, 4));
  }

  const nl = document.getElementById('newsletter-form');
  if (nl) {
    nl.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = document.getElementById('newsletter-msg');
      msg.className = 'form-msg ok';
      msg.textContent = 'Welcome to the inner circle. Watch your inbox.';
      nl.reset();
    });
  }
}

async function pageCollection() {
  const grid = document.getElementById('collection-grid');
  const products = await getProducts();
  await renderGrid(grid, products);

  // Filter chips
  const chips = document.querySelectorAll('[data-filter]');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const f = chip.dataset.filter;
      grid.innerHTML = '';
      renderGrid(grid, f === 'all' ? products : products.filter((p) => p.category === f));
    });
  });
}

async function pageProduct() {
  const id = new URLSearchParams(location.search).get('id');
  const wrap = document.getElementById('product-detail');
  if (!id) { wrap.innerHTML = '<div class="empty-state"><h3>No product selected</h3><a class="btn btn-ghost" href="collection.html">Browse the collection</a></div>'; return; }
  let p;
  try { p = await getProduct(id); }
  catch { wrap.innerHTML = '<div class="empty-state"><h3>Product not found</h3><a class="btn btn-ghost" href="collection.html">Back to collection</a></div>'; return; }

  document.title = `${p.name} · NOIRÉON`;
  wrap.innerHTML = `
    <div class="product-viewer"><canvas id="product-canvas"></canvas></div>
    <div class="product-info">
      <span class="eyebrow">${p.category} Collection</span>
      <h1>${p.name}</h1>
      <p class="tagline">${p.tagline}</p>
      <div class="price">${money(p.price)}</div>
      <p style="color:var(--muted)">${p.description}</p>
      <div class="spec-list">
        <div class="spec-row"><span>Movement</span><span>${p.specs.movement}</span></div>
        <div class="spec-row"><span>Case</span><span>${p.specs.case}</span></div>
        <div class="spec-row"><span>Water Resistance</span><span>${p.specs.water}</span></div>
        <div class="spec-row"><span>Power Reserve</span><span>${p.specs.power}</span></div>
      </div>
      <div class="product-actions">
        <button class="btn btn-gold" id="add-cart">Add to Cart</button>
        <a href="collection.html" class="btn btn-ghost">Continue Browsing</a>
      </div>
    </div>
  `;
  initHeroWatch(document.getElementById('product-canvas'), {
    caseColor: p.caseColor, dialColor: p.dialColor, accentColor: p.accentColor, strapColor: p.strapColor,
  });
  document.getElementById('add-cart').addEventListener('click', async () => {
    if (!isLoggedIn()) { toast('Sign in to add to cart'); setTimeout(() => (location.href = 'login.html?next=' + encodeURIComponent(location.pathname + location.search)), 900); return; }
    await addToCart(p.id); toast('Added to cart'); await refreshCartBadge();
  });

  // Related products
  const related = document.getElementById('related-grid');
  if (related) {
    const all = await getProducts();
    await renderGrid(related, all.filter((x) => x.id !== p.id).slice(0, 3));
  }
}

async function pageCart() {
  const wrap = document.getElementById('cart-root');
  if (!isLoggedIn()) {
    wrap.innerHTML = `<div class="empty-state"><h3>Sign in to view your cart</h3><p>Your collection is waiting.</p><br><a class="btn btn-gold" href="login.html?next=cart.html">Sign In</a></div>`;
    return;
  }
  const cart = await getCart();
  if (!cart.items.length) {
    wrap.innerHTML = `<div class="empty-state"><h3>Your cart is empty</h3><p>Discover a timepiece worthy of your wrist.</p><br><a class="btn btn-gold" href="collection.html">Explore Collection</a></div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="cart-layout">
      <div id="cart-items"></div>
      <div class="summary">
        <h3>Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span>${money(cart.total)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>Complimentary</span></div>
        <div class="summary-row total"><span>Total</span><b>${money(cart.total)}</b></div>
        <button class="btn btn-gold btn-block" id="checkout" style="margin-top:20px">Proceed to Checkout</button>
        <button class="btn btn-ghost btn-block" id="clear-cart" style="margin-top:12px">Clear Cart</button>
      </div>
    </div>
  `;

  const list = document.getElementById('cart-items');
  cart.items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="thumb"><canvas data-thumb></canvas></div>
      <div>
        <h4>${item.name}</h4>
        <div class="muted">${item.category} · ${money(item.price)} each</div>
        <div class="qty-row">
          <span class="muted">Qty: ${item.qty}</span>
        </div>
        <a href="#" class="remove-link" data-remove="${item.id}">Remove</a>
      </div>
      <div class="item-price">${money(item.price * item.qty)}</div>
    `;
    initCardWatch(row.querySelector('[data-thumb]'), {
      caseColor: item.caseColor, dialColor: item.dialColor, accentColor: item.accentColor, strapColor: item.strapColor, spinSpeed: 0.4,
    });
    list.appendChild(row);
  });

  list.querySelectorAll('[data-remove]').forEach((el) => {
    el.addEventListener('click', async (e) => {
      e.preventDefault();
      await removeFromCart(el.dataset.remove);
      toast('Removed from cart');
      pageCart(); refreshCartBadge();
    });
  });
  document.getElementById('clear-cart').addEventListener('click', async () => {
    await clearCart(); toast('Cart cleared'); pageCart(); refreshCartBadge();
  });
  document.getElementById('checkout').addEventListener('click', async () => {
    try {
      const order = await createOrder();
      toast(`Order ${order.id} placed — ${money(order.total)}`);
      await refreshCartBadge();
      pageCart();
    } catch (err) { toast(err.message); }
  });
}

// ---- User dashboard ----
async function pageDashboard() {
  const wrap = document.getElementById('dash-root');
  const user = getUser();
  if (!isLoggedIn() || !user) {
    wrap.innerHTML = `<div class="empty-state"><h3>Sign in to view your account</h3><br><a class="btn btn-gold" href="login.html?next=dashboard.html">Sign In</a></div>`;
    return;
  }
  const orders = await getMyOrders();
  const spent = orders.reduce((s, o) => s + o.total, 0);
  wrap.innerHTML = `
    <div class="stats-band" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat"><b>${orders.length}</b><span>Orders placed</span></div>
      <div class="stat"><b>${money(spent)}</b><span>Lifetime value</span></div>
      <div class="stat"><b>${user.role === 'admin' ? 'Admin' : 'Member'}</b><span>Account type</span></div>
    </div>
    <div class="panel-box" style="background:var(--surface);border:1px solid var(--border-soft);border-radius:20px;padding:28px;margin-top:26px">
      <h3 style="margin-bottom:16px">Order History</h3>
      ${orders.length ? `<table style="width:100%;border-collapse:collapse">
        <tr><th style="text-align:left;color:var(--muted);padding:8px">Order</th><th style="text-align:left;color:var(--muted);padding:8px">Items</th><th style="text-align:left;color:var(--muted);padding:8px">Total</th><th style="text-align:left;color:var(--muted);padding:8px">Status</th></tr>
        ${orders.map((o) => `<tr style="border-top:1px solid var(--border-soft)">
          <td style="padding:10px 8px">${o.id}</td>
          <td style="padding:10px 8px">${o.items.reduce((a, i) => a + i.qty, 0)}</td>
          <td style="padding:10px 8px" class="price">${money(o.total)}</td>
          <td style="padding:10px 8px"><span class="eyebrow" style="font-size:.7rem">${o.status}</span></td>
        </tr>`).join('')}
      </table>` : '<p style="color:var(--muted)">No orders yet. <a class="gold" href="collection.html" style="color:var(--gold-light)">Browse the collection</a>.</p>'}
    </div>
  `;
}

// ---- Admin dashboard ----
async function pageAdmin() {
  const wrap = document.getElementById('admin-root');
  const user = getUser();
  if (!isLoggedIn() || !user || user.role !== 'admin') {
    wrap.innerHTML = `<div class="empty-state"><h3>Admin access required</h3><p>Sign in with an admin account.</p><br><a class="btn btn-gold" href="login.html?next=admin.html">Sign In</a></div>`;
    return;
  }
  const [stats, orders, products] = await Promise.all([adminStats(), adminOrders(), getProducts()]);
  wrap.innerHTML = `
    <div class="stats-band" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat"><b>${stats.products}</b><span>Products</span></div>
      <div class="stat"><b>${stats.orders}</b><span>Orders</span></div>
      <div class="stat"><b>${stats.users}</b><span>Users</span></div>
      <div class="stat"><b style="font-size:1.4rem">${money(stats.revenue)}</b><span>Revenue</span></div>
    </div>

    <div class="filters" style="display:flex;gap:10px;margin:30px 0 20px;flex-wrap:wrap">
      <button class="btn btn-ghost btn-sm active" data-atab="products">Products</button>
      <button class="btn btn-ghost btn-sm" data-atab="orders">Orders</button>
      <button class="btn btn-ghost btn-sm" data-atab="add">Add Product</button>
    </div>

    <div id="atab-products" class="panel-box" style="background:var(--surface);border:1px solid var(--border-soft);border-radius:20px;padding:24px;overflow-x:auto">
      <table style="width:100%;border-collapse:collapse">
        <tr><th style="text-align:left;color:var(--muted);padding:8px">Name</th><th style="text-align:left;color:var(--muted);padding:8px">Category</th><th style="text-align:left;color:var(--muted);padding:8px">Price</th><th style="padding:8px"></th></tr>
        ${products.map((p) => `<tr style="border-top:1px solid var(--border-soft)">
          <td style="padding:10px 8px">${p.name}</td>
          <td style="padding:10px 8px">${p.category}</td>
          <td style="padding:10px 8px" class="price">${money(p.price)}</td>
          <td style="padding:10px 8px;text-align:right"><button class="btn btn-ghost btn-sm" data-del="${p.id}">Delete</button></td>
        </tr>`).join('')}
      </table>
    </div>

    <div id="atab-orders" class="panel-box hidden" style="background:var(--surface);border:1px solid var(--border-soft);border-radius:20px;padding:24px;overflow-x:auto">
      ${orders.length ? `<table style="width:100%;border-collapse:collapse">
        <tr><th style="text-align:left;color:var(--muted);padding:8px">Order</th><th style="text-align:left;color:var(--muted);padding:8px">Email</th><th style="text-align:left;color:var(--muted);padding:8px">Items</th><th style="text-align:left;color:var(--muted);padding:8px">Total</th><th style="text-align:left;color:var(--muted);padding:8px">Status</th></tr>
        ${orders.map((o) => `<tr style="border-top:1px solid var(--border-soft)">
          <td style="padding:10px 8px">${o.id}</td><td style="padding:10px 8px">${o.email}</td>
          <td style="padding:10px 8px">${o.items.reduce((a, i) => a + i.qty, 0)}</td>
          <td style="padding:10px 8px" class="price">${money(o.total)}</td>
          <td style="padding:10px 8px">${o.status}</td>
        </tr>`).join('')}</table>` : '<p style="color:var(--muted)">No orders yet.</p>'}
    </div>

    <div id="atab-add" class="panel-box hidden" style="background:var(--surface);border:1px solid var(--border-soft);border-radius:20px;padding:24px;max-width:460px">
      <form id="admin-add-form" class="form" style="display:flex;flex-direction:column;gap:14px">
        <div class="field"><label>Name</label><input name="name" required placeholder="NOIRÉON …" /></div>
        <div class="field"><label>Price (₹)</label><input name="price" type="number" required placeholder="1850000" /></div>
        <div class="field"><label>Tagline</label><input name="tagline" placeholder="Rose-gold skeleton tourbillon" /></div>
        <button class="btn btn-gold" type="submit">Add Product</button>
      </form>
    </div>
  `;

  wrap.querySelectorAll('[data-atab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('[data-atab]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      ['products', 'orders', 'add'].forEach((t) => document.getElementById('atab-' + t).classList.toggle('hidden', t !== btn.dataset.atab));
    });
  });
  wrap.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await adminDeleteProduct(btn.dataset.del);
      toast('Product deleted');
      pageAdmin();
    });
  });
  document.getElementById('admin-add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    await adminAddProduct({ name: f.get('name'), price: f.get('price'), tagline: f.get('tagline') });
    toast('Product added');
    pageAdmin();
  });
}

function pageLogin() {
  const form = document.getElementById('login-form');
  const msg = document.getElementById('form-msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'form-msg'; msg.textContent = 'Signing in…';
    const email = form.email.value.trim();
    const password = form.password.value;
    try {
      await login(email, password);
      msg.className = 'form-msg ok'; msg.textContent = 'Welcome back!';
      updateNavAuth();
      const next = new URLSearchParams(location.search).get('next') || 'index.html';
      setTimeout(() => (location.href = next), 600);
    } catch (err) {
      msg.className = 'form-msg error'; msg.textContent = err.message;
    }
  });
}

function pageRegister() {
  const form = document.getElementById('register-form');
  const msg = document.getElementById('form-msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'form-msg'; msg.textContent = 'Creating account…';
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    if (password !== form.confirm.value) { msg.className = 'form-msg error'; msg.textContent = 'Passwords do not match'; return; }
    try {
      await register(name, email, password);
      msg.className = 'form-msg ok'; msg.textContent = 'Account created!';
      updateNavAuth();
      const next = new URLSearchParams(location.search).get('next') || 'index.html';
      setTimeout(() => (location.href = next), 700);
    } catch (err) {
      msg.className = 'form-msg error'; msg.textContent = err.message;
    }
  });
}

function pageContact() {
  const form = document.getElementById('contact-form');
  const msg = document.getElementById('form-msg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    msg.className = 'form-msg ok';
    msg.textContent = 'Thank you — your message has been received. Our concierge will reply shortly.';
    form.reset();
  });
}

function pageAbout() {
  const canvas = document.getElementById('about-canvas');
  initHeroWatch(canvas, { caseColor: 0xe0a56b, dialColor: 0x2a1f16, accentColor: 0xf5d7a1, strapColor: 0x3a2a1c });
}

// ---- bootstrap ----
const PAGES = {
  home: pageHome,
  collection: pageCollection,
  product: pageProduct,
  cart: pageCart,
  login: pageLogin,
  register: pageRegister,
  contact: pageContact,
  about: pageAbout,
  dashboard: pageDashboard,
  admin: pageAdmin,
};

document.addEventListener('DOMContentLoaded', () => {
  injectLayout();
  initReveal();
  const page = document.body.dataset.page;
  if (page && PAGES[page]) {
    PAGES[page]().catch((err) => console.error('Page init failed:', err));
  }
});
