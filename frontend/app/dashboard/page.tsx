'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getMyOrders } from '@/lib/api';
import { money } from '@/lib/format';
import type { Order } from '@/lib/types';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/dashboard');
  }, [loading, user, router]);

  useEffect(() => {
    if (user) getMyOrders().then(setOrders).catch(() => setOrders([]));
  }, [user]);

  if (loading) return <div className="guard-note">Loading…</div>;
  if (!user) return <div className="guard-note">Redirecting to sign in…</div>;

  return (
    <section className="dash">
      <div className="container">
        <div className="dash-head">
          <div>
            <h1>Hello, {user.name.split(' ')[0]}</h1>
            <p>{user.email} · <span className="badge">{user.role}</span></p>
          </div>
          <Link href="/collection" className="btn btn-ghost btn-sm">Browse collection</Link>
        </div>

        <div className="stat-grid">
          <div className="kpi"><b>{orders.length}</b><span>Orders</span></div>
          <div className="kpi"><b>{money(orders.reduce((s, o) => s + o.total, 0))}</b><span>Lifetime value</span></div>
          <div className="kpi"><b>{user.role}</b><span>Account type</span></div>
          <div className="kpi"><b>{new Date().getFullYear()}</b><span>Member since</span></div>
        </div>

        <div className="panel">
          <h3>Order history</h3>
          {orders.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No orders yet. <Link href="/collection" style={{ color: 'var(--gold-light)' }}>Start exploring →</Link></p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{new Date(o.date).toLocaleDateString('en-IN')}</td>
                      <td>{o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</td>
                      <td>{money(o.total)}</td>
                      <td><span className="badge">{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
