'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';
import { money } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { AdminStats, Order, Product } from '@/lib/types';

const hexToNum = (hex: string): number => parseInt(hex.replace('#', ''), 16);

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ name: '', price: '', category: 'Skeleton', tagline: '', caseColor: '#c9a06a', strapColor: '#0e0e10' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [s, o, p] = await Promise.all([api.adminStats(), api.adminOrders(), api.getProducts()]);
    setStats(s);
    setOrders(o);
    setProducts(p);
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/admin');
  }, [loading, user, router]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast('Admin access required');
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'admin') load().catch(() => toast('Could not load admin data'));
  }, [user, load]);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.adminAddProduct({
        name: form.name,
        price: Number(form.price),
        category: form.category,
        tagline: form.tagline,
        caseColor: hexToNum(form.caseColor),
        strapColor: hexToNum(form.strapColor),
      });
      toast('Product added');
      setForm((f) => ({ ...f, name: '', price: '', tagline: '' }));
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add product');
    } finally {
      setBusy(false);
    }
  }

  async function removeProduct(id: string) {
    try {
      await api.adminDeleteProduct(id);
      toast('Product removed');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not remove product');
    }
  }

  if (loading) return <div className="guard-note">Loading…</div>;
  if (!user) return <div className="guard-note">Redirecting to sign in…</div>;
  if (user.role !== 'admin') return <div className="guard-note">You do not have permission to view this page.</div>;

  return (
    <section className="dash">
      <div className="container">
        <div className="dash-head">
          <div><h1>Admin Panel</h1><p>Manage products, orders and view performance.</p></div>
        </div>

        <div className="stat-grid">
          <div className="kpi"><b>{stats?.products ?? '—'}</b><span>Products</span></div>
          <div className="kpi"><b>{stats?.orders ?? '—'}</b><span>Orders</span></div>
          <div className="kpi"><b>{stats?.users ?? '—'}</b><span>Users</span></div>
          <div className="kpi"><b>{stats ? money(stats.revenue) : '—'}</b><span>Revenue</span></div>
        </div>

        <div className="dash-cols">
          <div className="panel">
            <h3>Products</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead><tr><th>Name</th><th>Category</th><th>Price</th><th></th></tr></thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.category}</td>
                      <td>{money(p.price)}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => removeProduct(p.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <h3>Add a product</h3>
            <form onSubmit={addProduct}>
              <div className="field"><label>Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
              <div className="form-row">
                <div className="field"><label>Price (₹)</label>
                  <input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required /></div>
                <div className="field"><label>Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    <option>Skeleton</option><option>Haute</option>
                  </select></div>
              </div>
              <div className="field"><label>Tagline</label>
                <input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} /></div>
              <div className="form-row">
                <div className="field"><label>Case colour</label>
                  <input type="color" value={form.caseColor} onChange={(e) => setForm((f) => ({ ...f, caseColor: e.target.value }))} style={{ padding: 4, height: 46 }} /></div>
                <div className="field"><label>Strap colour</label>
                  <input type="color" value={form.strapColor} onChange={(e) => setForm((f) => ({ ...f, strapColor: e.target.value }))} style={{ padding: 4, height: 46 }} /></div>
              </div>
              <button className="btn btn-gold btn-block" type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add product'}</button>
            </form>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 26 }}>
          <h3>Recent orders</h3>
          {orders.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No orders yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Ship to</th><th>Total</th><th>Payment</th><th>Date</th></tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{o.email}</td>
                      <td>{o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</td>
                      <td>
                        {o.address ? (
                          <div className="order-ship">
                            {o.address.fullName}<br />
                            {o.address.line1}
                            {o.address.line2 ? `, ${o.address.line2}` : ''}, {o.address.city}, {o.address.state} {o.address.pincode}<br />
                            {o.address.phone}
                          </div>
                        ) : '—'}
                      </td>
                      <td>{money(o.total)}</td>
                      <td>{o.paymentMethod || '—'}<br /><span className="badge">{o.status}</span></td>
                      <td>{new Date(o.date).toLocaleDateString('en-IN')}</td>
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
