import { getCartCount } from './auth.js';

const NAV = [
  { href: 'index.html', label: 'Home' },
  { href: 'collection.html', label: 'Collection' },
  { href: 'about.html', label: 'About' },
  { href: 'contact.html', label: 'Contact' },
];

const FOOTER_COLS = [
  { title: 'Collection', links: [
    { href: 'collection.html', label: 'All Watches' },
    { href: 'collection.html', label: 'Dress' },
    { href: 'collection.html', label: 'Sport' },
    { href: 'collection.html', label: 'Haute Horlogerie' },
  ]},
  { title: 'Maison', links: [
    { href: 'about.html', label: 'Our Story' },
    { href: 'contact.html', label: 'Contact' },
    { href: 'about.html', label: 'Craftsmanship' },
  ]},
  { title: 'Account', links: [
    { href: 'login.html', label: 'Sign In' },
    { href: 'register.html', label: 'Register' },
    { href: 'cart.html', label: 'Cart' },
  ]},
];

function currentPage() {
  const path = location.pathname.split('/').pop() || 'index.html';
  return path;
}

export function injectLayout() {
  const page = currentPage();

  // ---- Ambient animated orbs (global background) ----
  const orbs = document.createElement('div');
  orbs.innerHTML = `
    <div class="orb orb-gold"></div>
    <div class="orb orb-blue"></div>
    <div class="orb orb-violet"></div>
  `;
  while (orbs.firstChild) document.body.insertBefore(orbs.firstChild, document.body.firstChild);

  // ---- Navbar ----
  const nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.innerHTML = `
    <div class="container nav-inner">
      <a href="index.html" class="brand">
        <span class="brand-mark"><span>CL</span></span>
        NOIRÉON
      </a>
      <ul class="nav-links" id="nav-links">
        ${NAV.map((n) => `<li><a href="${n.href}" class="${n.href === page ? 'active' : ''}">${n.label}</a></li>`).join('')}
      </ul>
      <div class="nav-actions">
        <a href="cart.html" class="cart-btn" aria-label="Cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span class="cart-badge" id="cart-badge">0</span>
        </a>
        <a href="login.html" class="btn btn-ghost btn-sm" id="nav-auth">Sign In</a>
        <button class="nav-toggle" id="nav-toggle" aria-label="Menu">&#9776;</button>
      </div>
    </div>
  `;
  document.body.prepend(nav);

  // ---- Footer ----
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="about">
          <a href="index.html" class="brand">
            <span class="brand-mark"><span>CL</span></span> NOIRÉON
          </a>
          <p>Independent haute horlogerie rendered in three dimensions. Every timepiece, engineered to be admired.</p>
        </div>
        ${FOOTER_COLS.map((col) => `
          <div>
            <h4>${col.title}</h4>
            <ul>${col.links.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join('')}</ul>
          </div>
        `).join('')}
      </div>
      <div class="footer-bottom">
        &copy; ${new Date().getFullYear()} NOIRÉON. Crafted for demonstration. All rights reserved.
      </div>
    </div>
  `;
  document.body.appendChild(footer);

  // ---- Mobile menu toggle ----
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.addEventListener('click', (e) => { if (e.target.tagName === 'A') links.classList.remove('open'); });

  // ---- Navbar scroll shading ----
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll);
  onScroll();

  updateNavAuth();
  refreshCartBadge();
}

export async function refreshCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = await getCartCount();
  badge.textContent = count;
  badge.classList.toggle('show', count > 0);
}

export function updateNavAuth() {
  const btn = document.getElementById('nav-auth');
  if (!btn) return;
  const user = readUser();
  if (user) {
    btn.textContent = `Hi, ${user.name.split(' ')[0]}`;
    btn.href = '#';
    btn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    btn.title = 'Sign out';
  } else {
    btn.textContent = 'Sign In';
    btn.href = 'login.html';
  }
}

// Local helpers duplicated lightly to avoid circular import with auth.js
function readUser() {
  try { return JSON.parse(localStorage.getItem('cl_user') || 'null'); } catch { return null; }
}
function logout() {
  localStorage.removeItem('cl_token');
  localStorage.removeItem('cl_user');
  location.href = 'index.html';
}

// Reveal-on-scroll observer for .reveal elements
export function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  els.forEach((el) => io.observe(el));
}

// Toast helper
let toastTimer;
export function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
