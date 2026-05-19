export const dynamic = 'force-static';
export function generateStaticParams() {
  return ['products', 'stat-categories', 'clients', 'catalogues', 'tarif-lines'].map(c => ({ collection: c }));
}
import { NextRequest, NextResponse } from 'next/server';
import {
  getCachedProducts,
  getCachedStatCategories,
  getCachedClients,
  getCachedCatalogues,
  getCachedTarifLines,
} from '@/lib/server-cache';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  let searchParams: URLSearchParams;
  try { searchParams = new URL(req.url).searchParams; } catch { return NextResponse.json({}); }
  const secret = searchParams.get('secret');
  if (process.env.CACHE_SECRET && secret !== process.env.CACHE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { collection } = await params;
  switch (collection) {
    case 'products':
      return NextResponse.json(await getCachedProducts());
    case 'stat-categories':
      return NextResponse.json(await getCachedStatCategories());
    case 'clients':
      return NextResponse.json(await getCachedClients());
    case 'catalogues':
      return NextResponse.json(await getCachedCatalogues());
    case 'tarif-lines': {
      const gridId = searchParams.get('gridId');
      if (!gridId) return NextResponse.json({ error: 'gridId required' }, { status: 400 });
      return NextResponse.json(await getCachedTarifLines(gridId));
    }
    default:
      return NextResponse.json({ error: `Unknown collection: ${collection}` }, { status: 400 });
  }
}
