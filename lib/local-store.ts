'use client';

/**
 * Accès navigateur aux fixtures d'édition (`/api/local-store`).
 *
 * Utilisé à la place de Firestore et de Storage quand le mode local est actif :
 * la personnalisation se teste alors sans écrire une ligne en production.
 */

/** Côté serveur, `lireLocal` lit déjà le fichier — cette couche n'a rien à y faire. */
const navigateur = () => typeof window !== 'undefined';

export async function lireStoreLocal<T>(nom: string, cle: string): Promise<T | null> {
  if (!navigateur()) return null;
  try {
    const res = await fetch(`/api/local-store?nom=${nom}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const store = (await res.json()) as Record<string, T>;
    return store[cle] ?? null;
  } catch {
    return null;
  }
}

export async function lireStoreLocalEntier<T>(nom: string): Promise<T | null> {
  if (!navigateur()) return null;
  try {
    const res = await fetch(`/api/local-store?nom=${nom}`, { cache: 'no-store' });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function ecrireStoreLocal(
  nom: string,
  cle: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!navigateur()) return;
  const res = await fetch('/api/local-store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nom, cle, data }),
  });
  if (!res.ok) throw new Error(`Écriture locale refusée (${res.status})`);
}

/** Renvoie l'URL publique du fichier déposé dans `public/local-uploads/`. */
export async function televerserLocal(fichier: File): Promise<string> {
  const body = new FormData();
  body.append('fichier', fichier);
  const res = await fetch('/api/local-store/upload', { method: 'POST', body });
  if (!res.ok) throw new Error(`Upload local refusé (${res.status})`);
  const { url } = (await res.json()) as { url: string };
  return url;
}
