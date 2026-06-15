import { unstable_cache } from 'next/cache';
import { getProducts, toPublicProduct, type Product, type PublicProduct } from './firestore/products';
import { getCategories, getDeclinations, type Category, type Declination } from './firestore/categories';
import { getEvenements, type Evenement } from './firestore/evenements';
import { getStatCategories, type StatCategory } from './firestore/stat-categories';
import { getStockSettings, type StockSettings } from './firestore/settings';
import { getTarifLines, type TarifLine } from './firestore/tarifs';
import { getClients, type Client } from './firestore/clients';
import { getCatalogues, type Catalogue } from './firestore/catalogues';
import type { RevendeurResult } from './firestore/revendeurs';
import {
  getThemeColors, getHeaderSettings, getFooterSettings,
  type ThemeColors, type HeaderSettings, type FooterSettings,
} from './firestore/site-settings';
import { getPageContent } from './firestore/page-content';
import { getMarques, getProductMarques, type Marque } from './firestore/marques';

// Cache serveur permanent — invalidé uniquement par les fonctions de synchronisation.
const CACHE_OPTS = (tags: string[]) => ({ revalidate: 86400 as const, tags });

// globalThis survit au HMR Next.js en dev (contrairement aux variables de module).
const g = globalThis as typeof globalThis & {
  _sv_products?: Product[] | null;
  _sv_statCategories?: StatCategory[] | null;
};

// Utilise le Data Cache de Next.js (persist entre invocations Vercel, tag-invalidable).
async function fetchFromCF<T>(path: string): Promise<T | null> {
  const base = process.env.NEXT_PUBLIC_CACHE_CF_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/data/${path}`, {
      next: { revalidate: 300, tags: [path] },
    });
    if (res.ok) return res.json() as Promise<T>;
  } catch {}
  return null;
}

// ── Products : store mutable module-level (supporte le patch partiel) ──────────
export async function getCachedProducts(): Promise<Product[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return [];
  if (g._sv_products != null) return g._sv_products;
  g._sv_products = (await fetchFromCF<Product[]>('products')) ?? await getProducts();
  return g._sv_products;
}

/** Version allégée pour le catalogue public : seulement les champs affichés, sans prix ni stock. */
export async function getCachedPublicProducts(): Promise<PublicProduct[]> {
  const all = await getCachedProducts();
  return all.map(toPublicProduct);
}

/** Met à jour uniquement les produits passés en paramètre (merge par pdt_reference). */
export function patchCachedProducts(patches: (Partial<Product> & { pdt_reference: string })[]): void {
  if (g._sv_products == null || patches.length === 0) return;
  const map = new Map(g._sv_products.map((p) => [p.pdt_reference, p]));
  for (const patch of patches) {
    const existing = map.get(patch.pdt_reference);
    map.set(patch.pdt_reference, existing ? { ...existing, ...patch } : (patch as Product));
  }
  g._sv_products = Array.from(map.values());
}

/** Force le rechargement depuis Firestore au prochain appel. */
export function invalidateCachedProducts(): void {
  g._sv_products = null;
}

// ── Stat-categories : store mutable module-level ───────────────────────────────
export async function getCachedStatCategories(): Promise<StatCategory[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return [];
  if (g._sv_statCategories != null) return g._sv_statCategories;
  g._sv_statCategories = (await fetchFromCF<StatCategory[]>('stat-categories')) ?? await getStatCategories();
  return g._sv_statCategories;
}

export function patchCachedStatCategories(patches: (Partial<StatCategory> & { code: string })[]): void {
  if (g._sv_statCategories == null || patches.length === 0) return;
  const map = new Map(g._sv_statCategories.map((s) => [s.code, s]));
  for (const patch of patches) {
    const existing = map.get(patch.code);
    map.set(patch.code, existing ? { ...existing, ...patch } : (patch as StatCategory));
  }
  g._sv_statCategories = Array.from(map.values());
}

export function invalidateCachedStatCategories(): void {
  g._sv_statCategories = null;
}

export const getCachedDeclinations = unstable_cache(
  async (): Promise<Declination[]> => getDeclinations(),
  ['declinations'],
  CACHE_OPTS(['declinations'])
);

export const getCachedStockSettings = unstable_cache(
  async (): Promise<StockSettings> => getStockSettings(),
  ['stock-settings'],
  CACHE_OPTS(['stock-settings'])
);

export const getCachedCategories = unstable_cache(
  async (): Promise<Category[]> => getCategories(),
  ['categories'],
  CACHE_OPTS(['categories'])
);

export const getCachedEvenements = unstable_cache(
  async (): Promise<Evenement[]> => getEvenements(),
  ['evenements'],
  CACHE_OPTS(['evenements'])
);

export const getCachedMarques = unstable_cache(
  async (): Promise<Marque[]> => getMarques(),
  ['marques'],
  CACHE_OPTS(['marques'])
);

export const getCachedProductMarques = unstable_cache(
  async (): Promise<Record<string, string>> => getProductMarques(),
  ['product-marques'],
  CACHE_OPTS(['product-marques'])
);

// ── Clients : store mutable module-level ──────────────────────────────────────
let _clients: Client[] | null = null;

export async function getCachedClients(): Promise<Client[]> {
  if (_clients !== null) return _clients;
  _clients = await getClients();
  return _clients;
}

export function patchCachedClients(patches: (Partial<Client> & { id: string })[]): void {
  if (_clients === null || patches.length === 0) return;
  const map = new Map(_clients.map((c) => [c.id, c]));
  for (const patch of patches) {
    const existing = map.get(patch.id);
    map.set(patch.id, existing ? { ...existing, ...patch } : (patch as Client));
  }
  _clients = Array.from(map.values());
}

export function invalidateCachedClients(): void {
  _clients = null;
}

// ── Revendeurs : source publique (champs vitrine uniquement) via CF ───────────
export async function getCachedRevendeurs(): Promise<RevendeurResult[]> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return [];
  return (await fetchFromCF<RevendeurResult[]>('revendeurs')) ?? [];
}

// ── Catalogues : store mutable module-level ───────────────────────────────────
let _catalogues: Catalogue[] | null = null;

export async function getCachedCatalogues(): Promise<Catalogue[]> {
  if (_catalogues !== null) return _catalogues;
  _catalogues = await getCatalogues();
  return _catalogues;
}

export function patchCachedCatalogues(patches: (Partial<Catalogue> & { id: string })[]): void {
  if (_catalogues === null || patches.length === 0) return;
  const map = new Map(_catalogues.map((c) => [c.id, c]));
  for (const patch of patches) {
    const existing = map.get(patch.id);
    map.set(patch.id, existing ? { ...existing, ...patch } : (patch as Catalogue));
  }
  _catalogues = Array.from(map.values());
}

export function invalidateCachedCatalogues(): void {
  _catalogues = null;
}

// ── TarifLines : store mutable par grille ─────────────────────────────────────
let _tarifLines: Map<string, TarifLine[]> | null = null;

export async function getCachedTarifLines(gridId: string): Promise<TarifLine[]> {
  if (_tarifLines === null) _tarifLines = new Map();
  if (!_tarifLines.has(gridId)) {
    _tarifLines.set(gridId, await getTarifLines(gridId));
  }
  return _tarifLines.get(gridId)!;
}

export function patchCachedTarifLines(gridId: string, patches: (Partial<TarifLine> & { ref: string })[]): void {
  if (_tarifLines === null || !_tarifLines.has(gridId) || patches.length === 0) return;
  const lines = _tarifLines.get(gridId)!;
  const map = new Map(lines.map((l) => [l.ref, l]));
  for (const patch of patches) {
    const existing = map.get(patch.ref);
    map.set(patch.ref, existing ? { ...existing, ...patch } : (patch as TarifLine));
  }
  _tarifLines.set(gridId, Array.from(map.values()));
}

export function invalidateCachedTarifLines(gridId?: string): void {
  if (!gridId) { _tarifLines = null; return; }
  _tarifLines?.delete(gridId);
}

export const getCachedThemeColors = unstable_cache(
  async (): Promise<ThemeColors> => getThemeColors(),
  ['theme-colors'],
  CACHE_OPTS(['site-settings'])
);

export const getCachedHeaderSettings = unstable_cache(
  async (): Promise<HeaderSettings> => getHeaderSettings(),
  ['header-settings'],
  CACHE_OPTS(['site-settings'])
);

export const getCachedFooterSettings = unstable_cache(
  async (): Promise<FooterSettings> => getFooterSettings(),
  ['footer-settings'],
  CACHE_OPTS(['site-settings'])
);

// ── PageContent : store mutable par pageId (pas de TTL — patch via éditeur admin) ──
let _pageContent: Map<string, Record<string, string>> | null = null;

export async function getCachedPageContent(pageId: string): Promise<Record<string, string>> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return {};
  if (_pageContent === null) _pageContent = new Map();
  if (!_pageContent.has(pageId)) {
    _pageContent.set(pageId, await getPageContent(pageId));
  }
  return _pageContent.get(pageId)!;
}

export function patchCachedPageContent(pageId: string, data: Record<string, string>): void {
  if (_pageContent === null) _pageContent = new Map();
  const current = _pageContent.get(pageId) ?? {};
  _pageContent.set(pageId, { ...current, ...data });
}

export function invalidateCachedPageContent(pageId?: string): void {
  if (!pageId) { _pageContent = null; return; }
  _pageContent?.delete(pageId);
}
