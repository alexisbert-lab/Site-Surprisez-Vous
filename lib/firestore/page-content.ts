import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import { MODE_LOCAL } from '../local-mode';
import { lireStoreLocal, ecrireStoreLocal } from '../local-store';

const db = () => getFirebaseDb();

export async function getPageContent(pageId: string): Promise<Record<string, string>> {
  if (MODE_LOCAL) {
    return (await lireStoreLocal<Record<string, string>>('page-content', pageId)) ?? {};
  }
  const snap = await getDoc(doc(db(), 'page-content', pageId));
  return snap.exists() ? (snap.data() as Record<string, string>) : {};
}

export async function savePageContent(pageId: string, data: Record<string, string>): Promise<void> {
  if (MODE_LOCAL) return ecrireStoreLocal('page-content', pageId, data);
  await setDoc(doc(db(), 'page-content', pageId), data, { merge: true });
}
