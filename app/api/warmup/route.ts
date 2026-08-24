export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getCachedProducts, getCachedStatCategories } from '@/lib/server-cache';

// Appelé par la tâche planifiée warmupCache (Cloud Functions), en heures ouvrées.
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (process.env.CACHE_SECRET && secret !== process.env.CACHE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const [products, statCategories] = await Promise.all([
    getCachedProducts().then((p) => p.length),
    getCachedStatCategories().then((s) => s.length),
  ]);

  // Ping le CF pour le tenir chaud aussi
  const cfBase = process.env.NEXT_PUBLIC_CACHE_CF_URL;
  if (cfBase) {
    fetch(`${cfBase}/data/products`).catch(() => {});
  }

  return NextResponse.json({ ok: true, products, statCategories, ms: Date.now() - start });
}
