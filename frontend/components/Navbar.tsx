'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/collection', label: 'Collection' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  function doLogout() {
    logout();
    setMenu(false);
    setOpen(false);
    router.push('/');
  }

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark"><span>N</span></span>
          NOIRÉON
        </Link>

        <ul className={`nav-links ${open ? 'open' : ''}`}>
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={pathname === l.href ? 'active' : ''} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            </li>
          ))}
          {user && (
            <li>
              <Link href="/dashboard" className={pathname === '/dashboard' ? 'active' : ''} onClick={() => setOpen(false)}>
                Dashboard
              </Link>
            </li>
          )}
          {isAdmin && (
            <li>
              <Link href="/admin" className={pathname === '/admin' ? 'active' : ''} onClick={() => setOpen(false)}>
                Admin
              </Link>
            </li>
          )}
        </ul>

        <div className="nav-actions">
          <Link href="/cart" className="cart-btn" aria-label="Cart">
            🛍
            <span className={`cart-badge ${count > 0 ? 'show' : ''}`}>{count}</span>
          </Link>

          {!user && <Link href="/login" className="btn btn-ghost btn-sm">Sign In</Link>}

          {user && (
            <div className="user-menu">
              <button className="avatar-sm" onClick={() => setMenu((v) => !v)} aria-label="Account menu">
                {initials(user.name)}
              </button>
              {menu && (
                <div
                  style={{
                    position: 'absolute', top: '52px', right: 0, minWidth: 180,
                    background: 'var(--surface-2)', border: '1px solid var(--border-soft)',
                    borderRadius: 14, padding: 8, boxShadow: 'var(--shadow)', zIndex: 200,
                  }}
                >
                  <div style={{ padding: '8px 10px', color: 'var(--muted)', fontSize: '.82rem' }}>{user.email}</div>
                  <Link href="/dashboard" onClick={() => setMenu(false)} style={{ display: 'block', padding: '8px 10px', borderRadius: 8 }}>My Dashboard</Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMenu(false)} style={{ display: 'block', padding: '8px 10px', borderRadius: 8 }}>Admin Panel</Link>
                  )}
                  <button onClick={doLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, background: 'none', border: 'none', color: '#ff9c9c' }}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}

          <button className="nav-toggle" onClick={() => setOpen((v) => !v)} aria-label="Menu">☰</button>
        </div>
      </div>
    </nav>
  );
}
