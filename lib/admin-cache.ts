/**
 * Cache session côté client pour les pages admin.
 * Pas d'expiration automatique — invalidé uniquement via invalidateAdminCache()
 * après chaque mutation ou synchronisation.
 */

const store = new Map<string, unknown>();

export async function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (store.has(key)) return store.get(key) as T;
  const data = await fetcher();
  store.set(key, data);
  return data;
}

/** Invalide une ou plusieurs clés (ou tout le cache si aucune clé fournie). */
export function invalidateAdminCache(...keys: string[]): void {
  if (keys.length === 0) {
    store.clear();
  } else {
    keys.forEach((k) => store.delete(k));
  }
}
