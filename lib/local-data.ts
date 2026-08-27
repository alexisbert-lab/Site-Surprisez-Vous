import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Mode local : le site lit `.local-data/*.json` au lieu de Firestore.
 * Sert à visualiser le catalogue en développement sans consommer de lectures.
 * Les fichiers sont produits par `npm run local:data`.
 */
const ACTIF = process.env.SV_LOCAL_DATA === '1';

/**
 * Mémo indexé sur la date du fichier : éditer un fixture puis recharger la page
 * suffit toujours à voir le changement, sans reparser plusieurs mégaoctets de
 * JSON à chaque rendu (une page en lit jusqu'à sept).
 */
const memo = new Map<string, { mtime: number; data: unknown }>();

/** Absent ou illisible → null, l'appelant retombe sur sa source normale. */
export function lireLocal<T>(nom: string): T | null {
  if (!ACTIF) return null;
  try {
    const chemin = join(process.cwd(), '.local-data', `${nom}.json`);
    const mtime = statSync(chemin).mtimeMs;
    const cache = memo.get(nom);
    if (cache?.mtime === mtime) return cache.data as T;
    const data = JSON.parse(readFileSync(chemin, 'utf8'));
    memo.set(nom, { mtime, data });
    return data as T;
  } catch {
    return null;
  }
}
