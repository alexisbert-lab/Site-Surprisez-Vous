import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

const db = () => getFirebaseDb();

export async function getPageContent(pageId: string): Promise<Record<string, string>> {
  const snap = await getDoc(doc(db(), 'page-content', pageId));
  return snap.exists() ? (snap.data() as Record<string, string>) : {};
}

export async function savePageContent(pageId: string, data: Record<string, string>): Promise<void> {
  await setDoc(doc(db(), 'page-content', pageId), data, { merge: true });
}
