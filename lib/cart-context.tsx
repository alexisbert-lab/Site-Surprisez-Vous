'use client';

import { createContext, useContext, useState, useCallback } from 'react';

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
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
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

interface CartContextValue {
  carts: Cart[];
  activeCart: Cart | null;
  activeCartId: string | null;
  totalItems: number;
  totalPrice: number;
  createCart: (nom: string) => string;
  selectCart: (id: string) => void;
  deleteCart: (id: string) => void;
  addItem: (ref: string, designation: string, qty: number, prixUnitaire?: number) => void;
  updateQty: (ref: string, qty: number) => void;
  removeItem: (ref: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [carts, setCarts] = useState<Cart[]>(loadCarts);
  const [activeCartId, setActiveCartId] = useState<string | null>(loadActiveId);

  const activeCart = carts.find((c) => c.id === activeCartId) || null;

  const createCart = useCallback((nom: string) => {
    const id = `cart-${Date.now()}`;
    const newCart: Cart = { id, nom, items: [], createdAt: Date.now() };
    setCarts((prev) => { const updated = [...prev, newCart]; saveCarts(updated); return updated; });
    setActiveCartId(id);
    saveActiveId(id);
    return id;
  }, []);

  const selectCart = useCallback((id: string) => {
    setActiveCartId(id);
    saveActiveId(id);
  }, []);

  const deleteCart = useCallback((id: string) => {
    setCarts((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveCarts(updated);
      setActiveCartId((cur) => {
        if (cur === id) {
          const newActive = updated[0]?.id || null;
          if (newActive) saveActiveId(newActive);
          return newActive;
        }
        return cur;
      });
      return updated;
    });
  }, []);

  const addItem = useCallback((ref: string, designation: string, qty: number, prixUnitaire?: number) => {
    setCarts((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== activeCartId) return c;
        const existing = c.items.find((i) => i.ref === ref);
        if (existing) {
          return { ...c, items: c.items.map((i) => i.ref === ref ? { ...i, qty: i.qty + qty } : i) };
        }
        return { ...c, items: [...c.items, { ref, designation, qty, prixUnitaire }] };
      });
      saveCarts(updated);
      return updated;
    });
  }, [activeCartId]);

  const updateQty = useCallback((ref: string, qty: number) => {
    setCarts((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== activeCartId) return c;
        if (qty <= 0) return { ...c, items: c.items.filter((i) => i.ref !== ref) };
        return { ...c, items: c.items.map((i) => i.ref === ref ? { ...i, qty } : i) };
      });
      saveCarts(updated);
      return updated;
    });
  }, [activeCartId]);

  const removeItem = useCallback((ref: string) => updateQty(ref, 0), [updateQty]);

  const totalItems = activeCart?.items.reduce((sum, i) => sum + i.qty, 0) || 0;
  const totalPrice = activeCart?.items.reduce((sum, i) => sum + i.qty * (i.prixUnitaire || 0), 0) || 0;

  return (
    <CartContext.Provider value={{ carts, activeCart, activeCartId, totalItems, totalPrice, createCart, selectCart, deleteCart, addItem, updateQty, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
