import { NextResponse } from 'next/server';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCAL_ACTIF, DOSSIER_LOCAL } from '@/lib/local-data';

export const dynamic = 'force-dynamic';

/**
 * Écriture des fixtures d'édition en mode local.
 *
 * L'éditeur tourne dans le navigateur et parle normalement à Firestore : sans
 * cette route, tester la personnalisation en local reviendrait à modifier la
 * production. Les deux ressources sont stockées en `{ clé: objet }` — un pageId
 * pour `page-content`, `theme` / `header` / `footer` pour `site-settings`.
 */
const RESSOURCES = new Set(['page-content', 'site-settings']);

/** `products` s'ajoute en lecture : l'éditeur y pioche les produits mis en avant. */
const LISIBLES = new Set([...RESSOURCES, 'products']);

type Store = Record<string, Record<string, unknown>>;

/** Jamais servie en production, même si la variable traînait dans l'env. */
function refusee(): NextResponse | null {
  if (!LOCAL_ACTIF || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Mode local inactif' }, { status: 404 });
  }
  return null;
}

/** `products` est un tableau : le fichier est renvoyé tel qu'il est écrit. */
function lire(nom: string): Store | unknown[] {
  try {
    return JSON.parse(readFileSync(join(DOSSIER_LOCAL, `${nom}.json`), 'utf8'));
  } catch {
    return nom === 'products' ? [] : {};
  }
}

export async function GET(req: Request) {
  const refus = refusee();
  if (refus) return refus;

  const nom = new URL(req.url).searchParams.get('nom') ?? '';
  if (!LISIBLES.has(nom)) return NextResponse.json({ error: 'Ressource inconnue' }, { status: 400 });

  return NextResponse.json(lire(nom));
}

export async function POST(req: Request) {
  const refus = refusee();
  if (refus) return refus;

  const { nom, cle, data } = (await req.json()) as {
    nom?: string; cle?: string; data?: Record<string, unknown>;
  };
  if (!nom || !RESSOURCES.has(nom) || !cle || !data) {
    return NextResponse.json({ error: 'Requête incomplète' }, { status: 400 });
  }

  // Fusion, comme le `setDoc(..., { merge: true })` de Firestore : l'éditeur
  // n'envoie que les champs touchés.
  const store = lire(nom) as Store;
  store[cle] = { ...(store[cle] ?? {}), ...data };
  mkdirSync(DOSSIER_LOCAL, { recursive: true });
  writeFileSync(join(DOSSIER_LOCAL, `${nom}.json`), JSON.stringify(store, null, 2), 'utf8');

  return NextResponse.json({ ok: true });
}
