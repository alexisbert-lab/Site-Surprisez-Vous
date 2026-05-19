interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  version: number;
  ttl: number;
}

function storageKey(key: string) {
  return `sv_cache_${key}`;
}

export function getCached<T>(key: string): CacheEntry<T> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      localStorage.getItem(storageKey(key)) ??
      sessionStorage.getItem(storageKey(key));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.fetchedAt > entry.ttl) {
      invalidateCached(key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

export function setCached<T>(key: string, data: T, version: number, ttl: number): void {
  if (typeof window === 'undefined') return;
  const entry: CacheEntry<T> = { data, fetchedAt: Date.now(), version, ttl };
  const serialized = JSON.stringify(entry);
  try {
    localStorage.setItem(storageKey(key), serialized);
  } catch {
    try {
      sessionStorage.setItem(storageKey(key), serialized);
    } catch {}
  }
}

export function invalidateCached(key: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(storageKey(key));
  localStorage.removeItem(storageKey(key));
}

export function invalidateAll(): void {
  if (typeof window === 'undefined') return;
  const prefix = 'sv_cache_';
  for (const storage of [sessionStorage, localStorage]) {
    Object.keys(storage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => storage.removeItem(k));
  }
}
