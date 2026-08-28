import { NextResponse } from 'next/server';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCAL_ACTIF } from '@/lib/local-data';

export const dynamic = 'force-dynamic';

/**
 * Remplaçant local de Firebase Storage : le fichier atterrit dans
 * `public/local-uploads/`, que le serveur de dev sert tel quel. Le dossier est
 * hors dépôt, il ne part jamais en production.
 */
const DOSSIER = join(process.cwd(), 'public', 'local-uploads');

export async function POST(req: Request) {
  if (!LOCAL_ACTIF || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Mode local inactif' }, { status: 404 });
  }

  const form = await req.formData();
  const fichier = form.get('fichier');
  if (!(fichier instanceof File)) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
  }

  const nom = `${Date.now()}-${fichier.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  mkdirSync(DOSSIER, { recursive: true });
  writeFileSync(join(DOSSIER, nom), Buffer.from(await fichier.arrayBuffer()));

  return NextResponse.json({ url: `/local-uploads/${nom}` });
}
