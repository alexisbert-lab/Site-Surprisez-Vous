import { getCachedRevendeurs } from '@/lib/server-cache';
import RevendeurClient from './RevendeurClient';

export const dynamic = 'force-dynamic';

export default async function RevendeurPage() {
  const revendeurs = await getCachedRevendeurs();
  return <RevendeurClient revendeurs={revendeurs} />;
}
