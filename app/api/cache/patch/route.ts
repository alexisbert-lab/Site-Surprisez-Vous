export const dynamic = 'force-static';
import { NextRequest, NextResponse } from 'next/server';
import {
  patchCachedProducts,
  patchCachedStatCategories,
  patchCachedClients,
  patchCachedCatalogues,
  patchCachedTarifLines,
  patchCachedPageContent,
} from '@/lib/server-cache';

type PatchBody = {
  collection: string;
  items: Record<string, unknown>[];
  gridId?: string;
  pageId?: string;
  secret?: string;
};

export async function POST(req: NextRequest) {
  let body: PatchBody;
  try { body = await req.json() as PatchBody; } catch { return NextResponse.json({}); }
  const { collection, items, gridId, pageId, secret } = body;
  const authHeader = req.headers.get('Authorization');
  const hasValidSecret = !process.env.CACHE_SECRET || secret === process.env.CACHE_SECRET;
  const hasBearer = authHeader?.startsWith('Bearer ') && authHeader.length > 20;
  if (!hasValidSecret && !hasBearer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items must be a non-empty array' }, { status: 400 });
  }
  switch (collection) {
    case 'products':
      patchCachedProducts(items as ({ pdt_reference: string } & Record<string, unknown>)[]);
      break;
    case 'stat-categories':
      patchCachedStatCategories(items as ({ code: string } & Record<string, unknown>)[]);
      break;
    case 'clients':
      patchCachedClients(items as ({ id: string } & Record<string, unknown>)[]);
      break;
    case 'catalogues':
      patchCachedCatalogues(items as ({ id: string } & Record<string, unknown>)[]);
      break;
    case 'tarif-lines': {
      if (!gridId) return NextResponse.json({ error: 'gridId required' }, { status: 400 });
      patchCachedTarifLines(gridId, items as ({ ref: string } & Record<string, unknown>)[]);
      break;
    }
    case 'page-content': {
      if (!pageId) return NextResponse.json({ error: 'pageId required' }, { status: 400 });
      patchCachedPageContent(pageId, items[0] as Record<string, string>);
      break;
    }
    default:
      return NextResponse.json({ error: `Unknown collection: ${collection}` }, { status: 400 });
  }
  return NextResponse.json({ patched: items.length, collection });
}
