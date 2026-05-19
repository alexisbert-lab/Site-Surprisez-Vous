import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  const { tags, secret } = await req.json() as { tags: string[]; secret?: string };
  if (process.env.CACHE_SECRET && secret !== process.env.CACHE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!Array.isArray(tags) || tags.length === 0) {
    return NextResponse.json({ error: 'tags must be a non-empty array' }, { status: 400 });
  }
  tags.forEach((tag) => revalidateTag(tag, 'default'));
  return NextResponse.json({ revalidated: tags });
}
