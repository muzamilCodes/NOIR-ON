'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as api from './api';
import { useAuth } from './auth';
import type { CartItem } from './types';

interface CartContextValue {
  items: CartItem[];
  total: number;
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
  add: (productId: string, qty?: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setTotal(0);
      return;
    }
    try {
      const cart = await api.getCart();
      setItems(cart.items);
      setTotal(cart.total);
    } catch {
      setItems([]);
      setTotal(0);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (productId: string, qty = 1) => {
      await api.addToCart(productId, qty);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (productId: string) => {
      await api.removeFromCart(productId);
      await refresh();
    },
    [refresh]
  );

  const clear = useCallback(async () => {
    await api.clearCart();
    await refresh();
  }, [refresh]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      total,
      count: items.reduce((s, i) => s + i.qty, 0),
      loading,
      refresh,
      add,
      remove,
      clear,
    }),
    [items, total, loading, refresh, add, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
