import { getCachedClients } from '@/lib/server-cache';
import type { RevendeurResult } from '@/lib/firestore/revendeurs';
import RevendeurClient from './RevendeurClient';

export default async function RevendeurPage() {
  const clients = await getCachedClients();

  const revendeurs: RevendeurResult[] = clients
    .filter((c) => c.revendeur?.lat && c.revendeur?.lng && c.statut === 'Valide')
    .map((c) => ({
      id: c.id,
      nom: c.enseigne || c.raison_soc,
      adresse: c.adr || '',
      ville: c.ville || '',
      codePostal: c.cp || '',
      telephone: c.tel || '',
      lat: c.revendeur!.lat!,
      lng: c.revendeur!.lng!,
    }));

  return <RevendeurClient revendeurs={revendeurs} />;
}
