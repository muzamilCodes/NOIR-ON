'use client';

import { useEffect, useMemo, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import * as api from '@/lib/api';
import type { Product } from '@/lib/types';

const FILTERS = ['All', 'Skeleton', 'Haute'];

export default function CollectionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.getProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  const shown = useMemo(
    () => (filter === 'All' ? products : products.filter((p) => p.category === filter)),
    [products, filter]
  );

  return (
    <section className="section">
      <div className="container">
        <Reveal className="section-head">
          <div className="divider" />
          <h2>The Collection</h2>
          <p>Every reference, rendered live in three dimensions. Move your cursor to see the light play across the case.</p>
        </Reveal>

        <div className="filters">
          {FILTERS.map((f) => (
            <button key={f} className={`btn btn-ghost btn-sm ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-4">
          {shown.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {shown.length === 0 && <div className="empty-state"><h3>No timepieces yet</h3><p>Check back soon.</p></div>}
      </div>
    </section>
  );
}
