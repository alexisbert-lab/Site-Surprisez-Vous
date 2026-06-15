import { describe, it, expect } from 'vitest';
import {
  getStockDisponible,
  isEnRupture,
  isStockFaible,
  filterArticlesVisibles,
  SEUIL_STOCK_FAIBLE,
  type Product,
} from '@/lib/firestore/products';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  pdt_reference: 'REF001',
  pdt_designation: 'Produit test',
  stock_physique: 50,
  ...overrides,
});

describe('getStockDisponible', () => {
  it('retourne le stock physique', () => {
    expect(getStockDisponible(makeProduct({ stock_physique: 42 }))).toBe(42);
  });

  it('retourne 0 si stock absent', () => {
    expect(getStockDisponible(makeProduct({ stock_physique: undefined as unknown as number }))).toBe(0);
  });
});

describe('isEnRupture', () => {
  it('vrai si stock = 0', () => {
    expect(isEnRupture(makeProduct({ stock_physique: 0 }))).toBe(true);
  });

  it('vrai si stock négatif', () => {
    expect(isEnRupture(makeProduct({ stock_physique: -5 }))).toBe(true);
  });

  it('faux si stock > 0', () => {
    expect(isEnRupture(makeProduct({ stock_physique: 1 }))).toBe(false);
  });
});

describe('isStockFaible', () => {
  it(`vrai entre 1 et ${SEUIL_STOCK_FAIBLE}`, () => {
    expect(isStockFaible(makeProduct({ stock_physique: 10 }))).toBe(true);
    expect(isStockFaible(makeProduct({ stock_physique: SEUIL_STOCK_FAIBLE }))).toBe(true);
  });

  it('faux si stock = 0 (rupture, pas faible)', () => {
    expect(isStockFaible(makeProduct({ stock_physique: 0 }))).toBe(false);
  });

  it('faux si stock > seuil', () => {
    expect(isStockFaible(makeProduct({ stock_physique: 100 }))).toBe(false);
  });

  it('respecte un seuil personnalisé', () => {
    expect(isStockFaible(makeProduct({ stock_physique: 5 }), 3)).toBe(false);
    expect(isStockFaible(makeProduct({ stock_physique: 2 }), 3)).toBe(true);
  });
});

describe('filterArticlesVisibles', () => {
  it('exclut les produits sans référence', () => {
    const result = filterArticlesVisibles([makeProduct({ pdt_reference: '' })]);
    expect(result).toHaveLength(0);
  });

  it('exclut les références ZFB (frais de port)', () => {
    const result = filterArticlesVisibles([makeProduct({ pdt_reference: 'ZFB001' })]);
    expect(result).toHaveLength(0);
  });

  it('exclut les produits supprimés (S) ou bloqués (B)', () => {
    const s = filterArticlesVisibles([makeProduct({ pdt_etat: 'S' })]);
    const b = filterArticlesVisibles([makeProduct({ pdt_etat: 'B' })]);
    expect(s).toHaveLength(0);
    expect(b).toHaveLength(0);
  });

  it('inclut les produits normaux', () => {
    const result = filterArticlesVisibles([makeProduct({ pdt_etat: 'G' })]);
    expect(result).toHaveLength(1);
  });

  it('inclut les produits fin de vie (N)', () => {
    const result = filterArticlesVisibles([makeProduct({ pdt_etat: 'N' })]);
    expect(result).toHaveLength(1);
  });

  it('filtre correctement un tableau mixte', () => {
    const products = [
      makeProduct({ pdt_reference: 'REF001', pdt_etat: 'G' }),
      makeProduct({ pdt_reference: 'ZFB001', pdt_etat: 'G' }),
      makeProduct({ pdt_reference: 'REF002', pdt_etat: 'S' }),
      makeProduct({ pdt_reference: 'REF003', pdt_etat: 'N' }),
    ];
    const result = filterArticlesVisibles(products);
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.pdt_reference)).toEqual(['REF001', 'REF003']);
  });
});
