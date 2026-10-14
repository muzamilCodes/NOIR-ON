'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Watch3D from './Watch3D';
import Reveal from './Reveal';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { money } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { Product } from '@/lib/types';

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { add } = useCart();
  const router = useRouter();

  async function onAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast('Sign in to add items to your cart');
      router.push('/login?next=/collection');
      return;
    }
    try {
      await add(product.id);
      toast('Added to cart');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add to cart');
    }
  }

  return (
    <Reveal className="card">
      <Link href={`/product/${product.id}`} className="card-canvas">
        <span className="card-cat">{product.category}</span>
        <Watch3D variant="card" caseColor={product.caseColor} strapColor={product.strapColor} spinSpeed={0.45} />
      </Link>
      <div className="card-body">
        <h3>{product.name}</h3>
        <span className="card-tag">{product.tagline}</span>
        <div className="card-foot">
          <span className="price">{money(product.price)}</span>
          <button className="btn btn-ghost btn-sm" onClick={onAdd}>Add to Cart</button>
        </div>
      </div>
    </Reveal>
  );
}
