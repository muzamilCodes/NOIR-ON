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
import type { Address, Order } from '@/lib/types';

const emptyAddress: Address = {
  fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '',
};

type Step = 'cart' | 'checkout' | 'done';

export default function CartPage() {
  const { user } = useAuth();
  const { items, total, remove, refresh } = useCart();
  const [step, setStep] = useState<Step>('cart');
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState<Address>({ ...emptyAddress, fullName: '' });
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [placed, setPlaced] = useState<Order | null>(null);
  const router = useRouter();

  function updateField(key: keyof Address, value: string) {
    setAddress((prev) => ({ ...prev, [key]: value }));
  }

  function startCheckout() {
    if (!user) {
      toast('Sign in to complete your purchase');
      router.push('/login?next=/cart');
      return;
    }
    if (items.length === 0) {
      toast('Your cart is empty');
      return;
    }
    setAddress((prev) => ({ ...prev, fullName: prev.fullName || user.name }));
    setStep('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const required = ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'] as const;
  const addressValid = required.every((k) => address[k].trim());

  async function placeOrder() {
    if (!addressValid) {
      toast('Please complete your shipping address');
      return;
    }
    setPlacing(true);
    try {
      const order = await createOrder({ address, paymentMethod });
      setPlaced(order);
      await refresh();
      setStep('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (step === 'done' && placed) {
    return (
      <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <div className="divider" />
            <h2>Order Confirmed</h2>
            <p>Thank you. Your timepiece is being prepared for insured delivery.</p>
          </Reveal>
          <div className="confirm-card">
            <div className="confirm-row"><span>Order ID</span><b>{placed.id}</b></div>
            <div className="confirm-row"><span>Status</span><b>{placed.status}</b></div>
            <div className="confirm-row"><span>Payment</span><b>{placed.paymentMethod}</b></div>
            <div className="confirm-row"><span>Total</span><b>{money(placed.total)}</b></div>
            <div className="confirm-items">
              {placed.items.map((it) => (
                <div className="confirm-item" key={it.id}>
                  <span>{it.name} × {it.qty}</span>
                  <span>{money(it.price * it.qty)}</span>
                </div>
              ))}
            </div>
            <div className="confirm-address">
              <h4>Shipping to</h4>
              <p>
                {placed.address?.fullName}<br />
                {placed.address?.line1}
                {placed.address?.line2 ? `, ${placed.address.line2}` : ''}<br />
                {placed.address?.city}, {placed.address?.state} {placed.address?.pincode}<br />
                {placed.address?.phone}
              </p>
            </div>
            <div className="confirm-actions">
              <Link href="/dashboard" className="btn btn-gold">View My Orders</Link>
              <Link href="/collection" className="btn btn-ghost">Continue Shopping</Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0 && step !== 'checkout') {
    return (
      <section className="section">
        <div className="container">
          <Reveal className="section-head"><div className="divider" /><h2>Your Selection</h2></Reveal>
          <div className="empty-state">
            <h3>Your cart is empty</h3>
            <p style={{ margin: '12px 0 22px' }}>Discover the collection.</p>
            <Link href="/collection" className="btn btn-ghost">Browse the Collection</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <Reveal className="section-head">
          <div className="divider" />
          <h2>{step === 'checkout' ? 'Checkout' : 'Your Selection'}</h2>
        </Reveal>

        {step === 'checkout' ? (
          <div className="checkout-layout">
            <form
              className="checkout-form"
              onSubmit={(e) => { e.preventDefault(); placeOrder(); }}
            >
              <h3 className="checkout-title">Shipping Address</h3>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="fullName">Full name</label>
                  <input id="fullName" value={address.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Your name" />
                </div>
                <div className="field">
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" value={address.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="+91 ..." />
                </div>
                <div className="field span-2">
                  <label htmlFor="line1">Address line 1</label>
                  <input id="line1" value={address.line1} onChange={(e) => updateField('line1', e.target.value)} placeholder="House / street" />
                </div>
                <div className="field span-2">
                  <label htmlFor="line2">Address line 2 <span className="optional">(optional)</span></label>
                  <input id="line2" value={address.line2} onChange={(e) => updateField('line2', e.target.value)} placeholder="Apartment, landmark" />
                </div>
                <div className="field">
                  <label htmlFor="city">City</label>
                  <input id="city" value={address.city} onChange={(e) => updateField('city', e.target.value)} placeholder="City" />
                </div>
                <div className="field">
                  <label htmlFor="state">State</label>
                  <input id="state" value={address.state} onChange={(e) => updateField('state', e.target.value)} placeholder="State" />
                </div>
                <div className="field">
                  <label htmlFor="pincode">PIN code</label>
                  <input id="pincode" value={address.pincode} onChange={(e) => updateField('pincode', e.target.value)} placeholder="6-digit PIN" inputMode="numeric" />
                </div>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input id="email" value={user.email} readOnly />
                </div>
              </div>

              <h3 className="checkout-title">Payment Method</h3>
              <div className="pay-options">
                {['Card', 'UPI', 'Cash on Delivery'].map((m) => (
                  <label key={m} className={`pay-option ${paymentMethod === m ? 'active' : ''}`}>
                    <input type="radio" name="pay" value={m} checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} />
                    <span>{m}</span>
                  </label>
                ))}
              </div>

              <div className="checkout-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setStep('cart')}>Back to Cart</button>
                <button type="submit" className="btn btn-gold" disabled={placing || !addressValid}>
                  {placing ? 'Placing…' : `Place Order · ${money(total)}`}
                </button>
              </div>
            </form>

            <aside className="summary">
              <h3>Order Summary</h3>
              {items.map((it) => (
                <div className="summary-line" key={it.id}>
                  <span>{it.name} × {it.qty}</span>
                  <span>{money(it.price * it.qty)}</span>
                </div>
              ))}
              <div className="summary-row"><span>Insured delivery</span><span>Complimentary</span></div>
              <div className="summary-row total"><span>Total</span><b>{money(total)}</b></div>
            </aside>
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
              <button className="btn btn-gold btn-block" style={{ marginTop: 20 }} onClick={startCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
