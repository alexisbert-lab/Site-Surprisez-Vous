import { getCached, setCached } from './client-cache';
import type { Product } from './firestore/products';
import type { Category } from './firestore/categories';
import type { StatCategory } from './firestore/stat-categories';
import type { Catalogue } from './firestore/catalogues';
import type { Marque } from './firestore/marques';
import type { TarifLine } from './firestore/tarifs';
import type { Client } from './firestore/clients';
import type { Commande } from './firestore/orders';

const CF_BASE = process.env.NEXT_PUBLIC_CACHE_CF_URL!;

const TTL: Record<string, number> = {
  products:          10 * 60 * 1000,
  categories:        30 * 60 * 1000,
  'stat-categories': 30 * 60 * 1000,
  'page-content':     5 * 60 * 1000,
  'site-settings':   15 * 60 * 1000,
  catalogues:        15 * 60 * 1000,
  'tarif-lines':      5 * 60 * 1000,
  clients:            2 * 60 * 1000,
  orders:             1 * 60 * 1000,
  commandes:          2 * 60 * 1000,
  marques:           30 * 60 * 1000,
};

async function fetchCollection<T>(
  collection: string,
  params?: Record<string, string>,
  idToken?: string,
): Promise<T> {
  if (!CF_BASE) throw new Error(`NEXT_PUBLIC_CACHE_CF_URL non défini`);
  const cacheKey = collection + (params ? JSON.stringify(params) : '');
  const cached = getCached<T>(cacheKey);
  if (cached) return cached.data;

  const url = new URL(`${CF_BASE}/data/${collection}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers: HeadersInit = {};
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`Cache CF ${collection}: ${res.status}`);

  const version = Number(res.headers.get('X-Cache-Version') ?? Date.now());
  const data: T = await res.json();
  setCached(cacheKey, data, version, TTL[collection] ?? 5 * 60 * 1000);

  return data;
}

export interface SiteSettings {
  theme: Record<string, string>;
  header: Record<string, string>;
  footer: Record<string, string>;
}

export const api = {
  getProducts:       () => fetchCollection<Product[]>('products'),
  getCategories:     () => fetchCollection<Category[]>('categories'),
  getStatCategories: () => fetchCollection<StatCategory[]>('stat-categories'),
  getPageContent:    (page: string) => fetchCollection<Record<string, string>>('page-content', { page }),
  getSiteSettings:   () => fetchCollection<SiteSettings>('site-settings'),
  getCatalogues:     () => fetchCollection<Catalogue[]>('catalogues'),
  getMarques:        () => fetchCollection<Marque[]>('marques'),
  getTarifLines:     (gridId: string, idToken: string) => fetchCollection<TarifLine[]>('tarif-lines', { gridId }, idToken),
  getClients:        (idToken: string) => fetchCollection<Client[]>('clients', undefined, idToken),
  getCommandes:      (cltId: string, idToken: string) => fetchCollection<Commande[]>('commandes', { cltId }, idToken),

  invalidate: (collection: string) => {
    if (!CF_BASE) return Promise.resolve();
    return fetch(`${CF_BASE}/data/invalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection }),
    });
  },
};
