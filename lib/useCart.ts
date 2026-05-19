'use client';

import { useState, useCallback } from 'react';

export interface CartItem {
  ref: string;
  designation: string;
  qty: number;
  prixUnitaire?: number;
}

export interface Cart {
  id: string;
  nom: string;
  items: CartItem[];
  createdAt: number;
}

const STORAGE_KEY = 'sv-carts';
const ACTIVE_KEY = 'sv-active-cart';

function loadCarts(): Cart[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCarts(carts: Cart[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(carts));
}

function loadActiveId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_KEY);
}

function saveActiveId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function useCart() {
  const [carts, setCarts] = useState<Cart[]>(loadCarts);
  const [activeCartId, setActiveCartId] = useState<string | null>(loadActiveId);

  const activeCart = carts.find((c) => c.id === activeCartId) || null;

  const createCart = useCallback((nom: string) => {
    const id = `cart-${Date.now()}`;
    const newCart: Cart = { id, nom, items: [], createdAt: Date.now() };
    const updated = [...carts, newCart];
    setCarts(updated);
    saveCarts(updated);
    setActiveCartId(id);
    saveActiveId(id);
    return id;
  }, [carts]);

  const selectCart = useCallback((id: string) => {
    setActiveCartId(id);
    saveActiveId(id);
  }, []);

  const deleteCart = useCallback((id: string) => {
    const updated = carts.filter((c) => c.id !== id);
    setCarts(updated);
    saveCarts(updated);
    if (activeCartId === id) {
      const newActive = updated[0]?.id || null;
      setActiveCartId(newActive);
      if (newActive) saveActiveId(newActive);
    }
  }, [carts, activeCartId]);

  const addItem = useCallback((ref: string, designation: string, qty: number, prixUnitaire?: number) => {
    if (!activeCartId) return;
    const updated = carts.map((c) => {
      if (c.id !== activeCartId) return c;
      const existing = c.items.find((i) => i.ref === ref);
      if (existing) {
        return { ...c, items: c.items.map((i) => i.ref === ref ? { ...i, qty: i.qty + qty } : i) };
      }
      return { ...c, items: [...c.items, { ref, designation, qty, prixUnitaire }] };
    });
    setCarts(updated);
    saveCarts(updated);
  }, [carts, activeCartId]);

  const updateQty = useCallback((ref: string, qty: number) => {
    if (!activeCartId) return;
    const updated = carts.map((c) => {
      if (c.id !== activeCartId) return c;
      if (qty <= 0) {
        return { ...c, items: c.items.filter((i) => i.ref !== ref) };
      }
      return { ...c, items: c.items.map((i) => i.ref === ref ? { ...i, qty } : i) };
    });
    setCarts(updated);
    saveCarts(updated);
  }, [carts, activeCartId]);

  const removeItem = useCallback((ref: string) => {
    updateQty(ref, 0);
  }, [updateQty]);

  const totalItems = activeCart?.items.reduce((sum, i) => sum + i.qty, 0) || 0;
  const totalPrice = activeCart?.items.reduce((sum, i) => sum + i.qty * (i.prixUnitaire || 0), 0) || 0;

  return {
    carts,
    activeCart,
    activeCartId,
    createCart,
    selectCart,
    deleteCart,
    addItem,
    updateQty,
    removeItem,
    totalItems,
    totalPrice,
  };
}
