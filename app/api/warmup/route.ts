import { NextResponse } from 'next/server';
import { getCachedProducts, getCachedStatCategories } from '@/lib/server-cache';

// Appelé par le cron Vercel toutes les 5 min pour maintenir les caches chauds.
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (process.env.WARMUP_SECRET && secret !== process.env.WARMUP_SECRET) {
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
