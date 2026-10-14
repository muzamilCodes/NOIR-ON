'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Watch3D from '@/components/Watch3D';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { money } from '@/lib/format';
import { toast } from '@/lib/toast';
import * as api from '@/lib/api';
import type { Product } from '@/lib/types';

function ProductView({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { user } = useAuth();
  const { add } = useCart();
  const router = useRouter();

  useEffect(() => {
    setProduct(null);
    setNotFound(false);
    api.getProduct(id).then(setProduct).catch(() => setNotFound(true));
  }, [id]);

  async function onAdd() {
    if (!product) return;
    if (!user) {
      toast('Sign in to add items to your cart');
      router.push(`/login?next=/product/${product.id}`);
      return;
    }
    try {
      await add(product.id);
      toast('Added to cart');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add to cart');
    }
  }

  if (notFound) {
    return <div className="empty-state"><h3>Timepiece not found</h3><p><Link href="/collection" className="btn btn-ghost btn-sm">Back to collection</Link></p></div>;
  }
  if (!product) return <div className="empty-state"><h3>Loading…</h3></div>;

  const specs = product.specs || {};

  return (
    <section className="section">
      <div className="container">
        <div className="product-detail">
          <div className="product-viewer">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="product-img" src={api.resolveImageUrl(product.image)} alt={product.name} />
            ) : (
              <Watch3D variant="hero" caseColor={product.caseColor} strapColor={product.strapColor} brandText="NOIRÉON" />
            )}
          </div>
          <div className="product-info">
            <span className="eyebrow">{product.category}</span>
            <h1>{product.name}</h1>
            <p className="tagline">{product.tagline}</p>
            <div className="price">{money(product.price)}</div>
            <p style={{ color: 'var(--muted)' }}>{product.description}</p>
            <div className="spec-list">
              {Object.entries(specs).map(([k, v]) => (
                <div className="spec-row" key={k}><span>{k}</span><span>{String(v)}</span></div>
              ))}
            </div>
            <div className="product-actions">
              <button className="btn btn-gold" onClick={onAdd}>Add to Cart</button>
              <Link href="/collection" className="btn btn-ghost">Continue browsing</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="empty-state"><h3>Loading…</h3></div>}>
      <ProductView id={params.id} />
    </Suspense>
  );
}
