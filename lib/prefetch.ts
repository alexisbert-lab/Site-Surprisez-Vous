/**
 * Pré-charge en arrière-plan toutes les données accessibles par l'utilisateur
 * dès qu'il s'authentifie. Chaque appel est idempotent :
 *  - api.*         → localStorage (TTL géré par client-cache)
 *  - prefetchTarif → Map mémoire in-process (tarifCache dans useTarif)
 *  - orders        → localStorage (TTL 5 min)
 */

import type { User } from 'firebase/auth';
import { api } from './api';
import { getCached, setCached, invalidateAll } from './client-cache';
import { prefetchTarif } from './useTarif';
import { getOrdersByEmail } from './firestore/orders';

interface MinProfile {
  role: 'admin' | 'pro' | 'public';
  tarif_grid_id?: string;
}

// Évite de re-fetcher si l'utilisateur recharge la page (cache déjà chaud)
let lastPrefetchedUid: string | null = null;

export async function prefetchUserData(user: User, profile: MinProfile): Promise<void> {
  if (lastPrefetchedUid === user.uid) return;
  lastPrefetchedUid = user.uid;

  const bg = (p: Promise<unknown>) => p.catch(() => {});

  // ── Données universelles (catalogue, settings, contenu) ──────────────────
  bg(api.getProducts());
  bg(api.getCategories());
  bg(api.getStatCategories());
  bg(api.getSiteSettings());
  bg(api.getCatalogues());
  bg(api.getMarques());

  // ── Données spécifiques pro / admin ──────────────────────────────────────
  if (profile.role === 'pro' || profile.role === 'admin') {
    const gridId = profile.tarif_grid_id ?? 'erp_gene11';

    // Grille tarifaire → Map in-memory (utilisée par useTarif sans re-fetcher)
    bg(prefetchTarif(gridId));

    // Commandes de l'utilisateur → localStorage 5 min
    if (user.email) bg(prefetchOrders(user.email));
  }
}

async function prefetchOrders(email: string): Promise<void> {
  const key = `user-orders|${email}`;
  if (getCached(key)) return;                                 // déjà en cache
  const orders = await getOrdersByEmail(email);
  setCached(key, orders, Date.now(), 5 * 60 * 1000);
}

/** Appelé au logout : vide le cache localStorage et réinitialise le verrou. */
export function clearPrefetchCache(): void {
  lastPrefetchedUid = null;
  invalidateAll();
}
