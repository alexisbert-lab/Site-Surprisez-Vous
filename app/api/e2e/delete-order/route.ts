import { NextRequest, NextResponse } from 'next/server';
import { deleteOrder } from '@/lib/firestore/orders';

export async function DELETE(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await deleteOrder(id);
  return NextResponse.json({ ok: true });
}
