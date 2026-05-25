'use client';

import { getDatabase, ref, push, onValue, remove, serverTimestamp } from 'firebase/database';
import { getFirebaseRTDB } from '@/lib/firebase';

export type AdminNotif = {
  id: string;
  type: 'new_order' | 'new_client';
  orderId?: string;
  clientId?: string;
  label: string;
  at: number;
};

export function pushOrderNotif(orderId: string, label: string): void {
  const db = getFirebaseRTDB();
  push(ref(db, 'notifications/admin'), {
    type: 'new_order',
    orderId,
    label,
    at: serverTimestamp(),
  });
}

export function subscribeAdminNotifs(cb: (notifs: AdminNotif[]) => void): () => void {
  const db = getFirebaseRTDB();
  const r = ref(db, 'notifications/admin');
  const unsub = onValue(r, snap => {
    if (!snap.exists()) { cb([]); return; }
    const items: AdminNotif[] = [];
    snap.forEach(child => { items.push({ id: child.key!, ...child.val() }); });
    cb(items.reverse());
  });
  return unsub;
}

export async function clearNotif(id: string): Promise<void> {
  await remove(ref(getFirebaseRTDB(), `notifications/admin/${id}`));
}

export async function clearAllNotifs(): Promise<void> {
  await remove(ref(getFirebaseRTDB(), 'notifications/admin'));
}
