import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from '@/lib/useCart';

// localStorage mock
const storage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v; },
  removeItem: (k: string) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
});

beforeEach(() => {
  Object.keys(storage).forEach((k) => delete storage[k]);
});

describe('useCart — createCart', () => {
  it('crée un panier et le rend actif', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.createCart('Commande janvier'); });
    expect(result.current.carts).toHaveLength(1);
    expect(result.current.carts[0].nom).toBe('Commande janvier');
    expect(result.current.activeCartId).toBeTruthy();
    expect(result.current.activeCart?.nom).toBe('Commande janvier');
  });

  it('génère des IDs uniques', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCart());
    act(() => { result.current.createCart('A'); });
    vi.advanceTimersByTime(10);
    act(() => { result.current.createCart('B'); });
    vi.useRealTimers();
    const ids = result.current.carts.map((c) => c.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe('useCart — addItem', () => {
  it('ajoute un article au panier actif', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.createCart('Test'); });
    act(() => { result.current.addItem('REF001', 'Ballon rouge', 3, 2.5); });
    expect(result.current.activeCart?.items).toHaveLength(1);
    expect(result.current.activeCart?.items[0]).toMatchObject({ ref: 'REF001', qty: 3 });
  });

  it('cumule la quantité si même référence', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.createCart('Test'); });
    act(() => { result.current.addItem('REF001', 'Ballon rouge', 2); });
    act(() => { result.current.addItem('REF001', 'Ballon rouge', 3); });
    expect(result.current.activeCart?.items[0].qty).toBe(5);
  });

  it('ne fait rien sans panier actif', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.addItem('REF001', 'Ballon rouge', 1); });
    expect(result.current.activeCart).toBeNull();
  });
});

describe('useCart — updateQty', () => {
  it('met à jour la quantité', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.createCart('Test'); });
    act(() => { result.current.addItem('REF001', 'Ballon', 5); });
    act(() => { result.current.updateQty('REF001', 2); });
    expect(result.current.activeCart?.items[0].qty).toBe(2);
  });

  it('supprime l\'article si qty <= 0', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.createCart('Test'); });
    act(() => { result.current.addItem('REF001', 'Ballon', 5); });
    act(() => { result.current.updateQty('REF001', 0); });
    expect(result.current.activeCart?.items).toHaveLength(0);
  });
});

describe('useCart — totalItems / totalPrice', () => {
  it('calcule correctement les totaux', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.createCart('Test'); });
    act(() => { result.current.addItem('REF001', 'A', 2, 10); });
    act(() => { result.current.addItem('REF002', 'B', 3, 5); });
    expect(result.current.totalItems).toBe(5);
    expect(result.current.totalPrice).toBe(35);
  });
});

describe('useCart — deleteCart', () => {
  it('supprime le panier et change l\'actif', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCart());
    act(() => { result.current.createCart('A'); });
    vi.advanceTimersByTime(10);
    act(() => { result.current.createCart('B'); });
    vi.useRealTimers();
    const idA = result.current.carts[0].id;
    act(() => { result.current.deleteCart(idA); });
    expect(result.current.carts).toHaveLength(1);
    expect(result.current.carts[0].nom).toBe('B');
  });
});

describe('useCart — persistance localStorage', () => {
  it('restaure les paniers depuis localStorage', () => {
    const cartData = [{ id: 'cart-1', nom: 'Saved', items: [], createdAt: Date.now() }];
    storage['sv-carts'] = JSON.stringify(cartData);
    storage['sv-active-cart'] = 'cart-1';

    const { result } = renderHook(() => useCart());
    expect(result.current.carts).toHaveLength(1);
    expect(result.current.activeCartId).toBe('cart-1');
  });
});
