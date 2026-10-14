'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Reveal from '@/components/Reveal';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { createOrder } from '@/lib/api';
import { money } from '@/lib/format';
import { toast } from '@/lib/toast';

export default function CartPage() {
  const { user } = useAuth();
  const { items, total, remove, refresh } = useCart();
  const [placing, setPlacing] = useState(false);
  const router = useRouter();

  async function checkout() {
    if (!user) {
      toast('Sign in to complete your purchase');
      router.push('/login?next=/cart');
      return;
    }
    setPlacing(true);
    try {
      const order = await createOrder();
      await refresh();
      toast(`Order ${order.id} confirmed — thank you.`);
      router.push('/dashboard');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not place order');
    } finally {
      setPlacing(false);
    }
  }

  if (!user) {
    return (
      <section className="section"><div className="container">
        <div className="empty-state">
          <h3>Your cart is private</h3>
          <p style={{ margin: '12px 0 22px' }}>Sign in to view and manage your cart.</p>
          <Link href="/login?next=/cart" className="btn btn-gold">Sign in</Link>
        </div>
      </div></section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <Reveal className="section-head"><div className="divider" /><h2>Your Selection</h2></Reveal>

        {items.length === 0 ? (
          <div className="empty-state">
            <h3>Your cart is empty</h3>
            <p style={{ margin: '12px 0 22px' }}>Discover the collection.</p>
            <Link href="/collection" className="btn btn-ghost">Browse the Collection</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div>
              {items.map((it) => (
                <div className="cart-item" key={it.id}>
                  <div className="thumb">
                    <Link href={`/product/${it.id}`} style={{ display: 'block', width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 40%, rgba(212,175,55,0.18), transparent 60%)' }} />
                  </div>
                  <div>
                    <h4>{it.name}</h4>
                    <div className="muted">{it.category} · Qty {it.qty}</div>
                  </div>
                  <div>
                    <div className="item-price">{money(it.price * it.qty)}</div>
                    <button className="remove-link" onClick={() => remove(it.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="summary">
              <h3>Summary</h3>
              <div className="summary-row"><span>Subtotal</span><span>{money(total)}</span></div>
              <div className="summary-row"><span>Insured delivery</span><span>Complimentary</span></div>
              <div className="summary-row total"><span>Total</span><b>{money(total)}</b></div>
              <button className="btn btn-gold btn-block" style={{ marginTop: 20 }} onClick={checkout} disabled={placing}>
                {placing ? 'Placing…' : 'Place Order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
