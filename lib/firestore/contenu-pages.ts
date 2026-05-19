import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

const db = () => getFirebaseDb();

export interface ContenuImage {
  url: string;
  alt?: string;
  ordre: number;
}

export interface ContenuPage {
  id: string;
  type: 'carousel' | 'photos' | 'texte' | 'texte-images';
  titre?: string;
  contenu?: string;
  images?: ContenuImage[];
  updated_at: string;
}

const COLLECTION = 'contenu-pages';

export async function getAllContenuPages(): Promise<ContenuPage[]> {
  const snap = await getDocs(collection(db(), COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ContenuPage);
}

export async function getContenuPage(id: string): Promise<ContenuPage | null> {
  const snap = await getDoc(doc(db(), COLLECTION, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as ContenuPage) : null;
}

export async function updateContenuPage(id: string, data: Partial<ContenuPage>): Promise<void> {
  await setDoc(doc(db(), COLLECTION, id), { ...data, updated_at: new Date().toISOString() }, { merge: true });
}
