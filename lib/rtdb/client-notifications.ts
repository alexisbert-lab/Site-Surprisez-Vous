'use client';

import { ref, push, onValue, update, remove, serverTimestamp } from 'firebase/database';
import { getFirebaseRTDB } from '@/lib/firebase';

export type ClientNotif = {
  id: string;
  orderId: string;
  label: string;
  statut: string;
  at: number;
  read: boolean;
};

export const STATUT_LABELS: Record<string, string> = {
  'En attente': 'En attente de validation',
  'Validee':    'Validée ✓',
  'Expediee':   'Expédiée 📦',
  'Livree':     'Livrée 🎉',
  'Annulee':    'Annulée',
};

/**
 * Pousse une notification de progression commande vers le client.
 * Recherche l'UID Firebase du client via sa collection Firestore.
 * Si le client n'a pas encore de compte lié, la notif est silencieusement ignorée.
 */
export async function pushClientOrderNotif(
  clientEmail: string,
  orderId: string,
  statut: string,
): Promise<void> {
  const { getClientByEmail } = await import('@/lib/firestore/clients');
  const client = await getClientByEmail(clientEmail).catch(() => null);
  if (!client?.uid) return; // pas de compte lié → pas de notif

  push(ref(getFirebaseRTDB(), `notifications/clients/${client.uid}`), {
    orderId,
    label: STATUT_LABELS[statut] ?? statut,
    statut,
    at: serverTimestamp(),
    read: false,
  });
}

/** Abonnement temps-réel par UID. Retourne la fonction unsubscribe. */
export function subscribeClientNotifs(
  uid: string,
  cb: (notifs: ClientNotif[]) => void,
): () => void {
  const r = ref(getFirebaseRTDB(), `notifications/clients/${uid}`);
  return onValue(r, snap => {
    if (!snap.exists()) { cb([]); return; }
    const items: ClientNotif[] = [];
    snap.forEach(child => items.push({ id: child.key!, ...child.val() }));
    cb(items.sort((a, b) => b.at - a.at));
  });
}

export async function markNotifRead(uid: string, id: string): Promise<void> {
  await update(ref(getFirebaseRTDB(), `notifications/clients/${uid}/${id}`), { read: true });
}

export async function clearClientNotif(uid: string, id: string): Promise<void> {
  await remove(ref(getFirebaseRTDB(), `notifications/clients/${uid}/${id}`));
}
