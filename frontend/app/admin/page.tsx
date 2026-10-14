'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';
import { money } from '@/lib/format';
import { toast } from '@/lib/toast';
import { ORDER_STATUSES } from '@/lib/types';
import type { AdminStats, AdminUser, Order, Product } from '@/lib/types';

type Tab = 'overview' | 'products' | 'orders' | 'users';

const hexToNum = (hex: string): number => parseInt(hex.replace('#', ''), 16);
const numToHex = (n: number): string => `#${(n >>> 0).toString(16).padStart(6, '0')}`;

interface Draft {
  id: string | null;
  name: string;
  price: string;
  category: string;
  tagline: string;
  description: string;
  caseColor: string;
  strapColor: string;
  image: string;
  movement: string;
  case: string;
  water: string;
  power: string;
}

const EMPTY: Draft = {
  id: null, name: '', price: '', category: 'Skeleton', tagline: '', description: '',
  caseColor: '#c9a06a', strapColor: '#0e0e10', image: '',
  movement: 'Manual Cal. NR-T01', case: '42mm', water: '30m', power: '90h reserve',
};

const toDraft = (p: Product): Draft => ({
  id: p.id,
  name: p.name,
  price: String(p.price),
  category: p.category,
  tagline: p.tagline,
  description: p.description,
  caseColor: numToHex(p.caseColor),
  strapColor: numToHex(p.strapColor),
  image: p.image || '',
  movement: p.specs?.movement || '',
  case: p.specs?.case || '',
  water: p.specs?.water || '',
  power: p.specs?.power || '',
});

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [editing, setEditing] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const patch = (u: Partial<Draft>) => setEditing((d) => (d ? { ...d, ...u } : d));

  const load = useCallback(async () => {
    const [s, o, p, u] = await Promise.all([
      api.adminStats(),
      api.adminOrders(),
      api.getProducts(),
      api.adminUsers(),
    ]);
    setStats(s);
    setOrders(o);
    setProducts(p);
    setUsers(u);
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

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    const payload: Partial<Product> = {
      name: editing.name.trim(),
      price: Number(editing.price),
      category: editing.category,
      tagline: editing.tagline,
      description: editing.description || editing.tagline || editing.name,
      caseColor: hexToNum(editing.caseColor),
      strapColor: hexToNum(editing.strapColor),
      image: editing.image,
      specs: { movement: editing.movement, case: editing.case, water: editing.water, power: editing.power },
    };
    try {
      if (editing.id) {
        await api.adminUpdateProduct(editing.id, payload);
        toast('Product updated');
      } else {
        await api.adminAddProduct(payload);
        toast('Product added');
      }
      setEditing(null);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save product');
    } finally {
      setBusy(false);
    }
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const url = await api.adminUploadImage(file);
      setEditing((d) => (d ? { ...d, image: url } : d));
      toast('Image uploaded');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function removeProduct(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.adminDeleteProduct(p.id);
      toast('Product removed');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not remove product');
    }
  }

  async function changeStatus(id: string, status: string) {
    try {
      const updated = await api.adminUpdateOrderStatus(id, status);
      setOrders((os) => os.map((o) => (o.id === id ? updated : o)));
      toast('Order updated');
      const s = await api.adminStats();
      setStats(s);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not update order');
    }
  }

  if (loading) return <div className="guard-note">Loading…</div>;
  if (!user) return <div className="guard-note">Redirecting to sign in…</div>;
  if (user.role !== 'admin') return <div className="guard-note">You do not have permission to view this page.</div>;

  const kpis = [
    { label: 'Products', value: stats ? String(stats.products) : '—' },
    { label: 'Orders', value: stats ? String(stats.orders) : '—' },
    { label: 'Customers', value: stats ? String(stats.users) : '—' },
    { label: 'Revenue', value: stats ? money(stats.revenue) : '—', accent: true },
    { label: 'Pending', value: stats ? String(stats.pending) : '—' },
    { label: 'Delivered', value: stats ? String(stats.delivered) : '—' },
  ];

  return (
    <section className="dash admin">
      <div className="container">
        <div className="dash-head">
          <div><h1>Admin Panel</h1><p>Manage the catalogue, orders and customers.</p></div>
        </div>

        <div className="admin-tabs">
          {(['overview', 'products', 'orders', 'users'] as Tab[]).map((t) => (
            <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'overview' ? 'Overview' : t === 'products' ? 'Products' : t === 'orders' ? 'Orders' : 'Users'}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <div className="stat-grid">
              {kpis.map((k) => (
                <div key={k.label} className={`kpi ${k.accent ? 'kpi-accent' : ''}`}>
                  <b>{k.value}</b><span>{k.label}</span>
                </div>
              ))}
            </div>
            <div className="panel" style={{ marginTop: 22 }}>
              <h3>Recent orders</h3>
              {orders.length === 0 ? <p className="muted">No orders yet.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.id}>
                          <td className="mono">{o.id}</td>
                          <td>{o.email}</td>
                          <td>{money(o.total)}</td>
                          <td><span className={`badge status-${o.status.toLowerCase()}`}>{o.status}</span></td>
                          <td>{new Date(o.date).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'products' && (
          <div className="panel">
            <div className="panel-head">
              <h3>Products ({products.length})</h3>
              <button className="btn btn-gold btn-sm" onClick={() => setEditing({ ...EMPTY })}>+ Add product</button>
            </div>
            {products.length === 0 ? <p className="muted">No products yet. Add your first one.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th className="col-actions">Actions</th></tr></thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="thumb" src={api.resolveImageUrl(p.image)} alt={p.name} />
                          ) : (
                            <span className="swatch" style={{ background: numToHex(p.caseColor) }} />
                          )}
                        </td>
                        <td>{p.name}</td>
                        <td>{p.category}</td>
                        <td>{money(p.price)}</td>
                        <td className="col-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(toDraft(p))}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => removeProduct(p)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'orders' && (
          <div className="panel">
            <h3>Orders ({orders.length})</h3>
            {orders.length === 0 ? <p className="muted">No orders yet.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Ship to</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="mono">{o.id}</td>
                        <td>{o.email}</td>
                        <td>{o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</td>
                        <td>
                          {o.address ? (
                            <div className="order-ship">
                              {o.address.fullName}<br />
                              {o.address.line1}{o.address.line2 ? `, ${o.address.line2}` : ''}, {o.address.city}, {o.address.state} {o.address.pincode}<br />
                              {o.address.phone}
                            </div>
                          ) : '—'}
                        </td>
                        <td>{money(o.total)}</td>
                        <td>{o.paymentMethod || '—'}</td>
                        <td>
                          <select className="status-select" value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}>
                            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td>{new Date(o.date).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="panel">
            <h3>Customers ({users.length})</h3>
            {users.length === 0 ? <p className="muted">No users yet.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td><span className={`role-badge ${u.role === 'admin' ? 'role-admin' : ''}`}>{u.role}</span></td>
                        <td>{u.date ? new Date(u.date).toLocaleDateString('en-IN') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => !busy && setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editing.id ? 'Edit product' : 'New product'}</h3>
              <button className="modal-close" onClick={() => !busy && setEditing(null)} aria-label="Close">×</button>
            </div>
            <form onSubmit={saveProduct} className="modal-body">
              <div className="field"><label>Name</label>
                <input value={editing.name} onChange={(e) => patch({ name: e.target.value })} required /></div>
              <div className="form-row">
                <div className="field"><label>Price (₹)</label>
                  <input type="number" min={0} value={editing.price} onChange={(e) => patch({ price: e.target.value })} required /></div>
                <div className="field"><label>Category</label>
                  <select value={editing.category} onChange={(e) => patch({ category: e.target.value })}>
                    <option>Skeleton</option><option>Haute</option>
                  </select></div>
              </div>
              <div className="field"><label>Tagline</label>
                <input value={editing.tagline} onChange={(e) => patch({ tagline: e.target.value })} /></div>
              <div className="field"><label>Description</label>
                <textarea rows={3} value={editing.description} onChange={(e) => patch({ description: e.target.value })} /></div>

              <div className="field"><label>Product image</label>
                <div className="img-row">
                  {editing.image ? (
                    <div className="img-preview">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={api.resolveImageUrl(editing.image)} alt="preview" />
                      <button type="button" className="img-clear" onClick={() => patch({ image: '' })}>Remove</button>
                    </div>
                  ) : (
                    <div className="img-empty">No image — the 3D render is shown instead.</div>
                  )}
                  <div className="img-actions">
                    <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} className="file-input" />
                    <button type="button" className="btn btn-ghost btn-sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                      {uploading ? 'Uploading…' : 'Upload image'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="field"><label>Case colour</label>
                  <input type="color" value={editing.caseColor} onChange={(e) => patch({ caseColor: e.target.value })} style={{ padding: 4, height: 46 }} /></div>
                <div className="field"><label>Strap colour</label>
                  <input type="color" value={editing.strapColor} onChange={(e) => patch({ strapColor: e.target.value })} style={{ padding: 4, height: 46 }} /></div>
              </div>

              <div className="specs-grid">
                <div className="field"><label>Movement</label>
                  <input value={editing.movement} onChange={(e) => patch({ movement: e.target.value })} /></div>
                <div className="field"><label>Case</label>
                  <input value={editing.case} onChange={(e) => patch({ case: e.target.value })} /></div>
                <div className="field"><label>Water resist.</label>
                  <input value={editing.water} onChange={(e) => patch({ water: e.target.value })} /></div>
                <div className="field"><label>Power</label>
                  <input value={editing.power} onChange={(e) => patch({ power: e.target.value })} /></div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
                <button type="submit" className="btn btn-gold" disabled={busy || uploading}>{busy ? 'Saving…' : editing.id ? 'Save changes' : 'Create product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
