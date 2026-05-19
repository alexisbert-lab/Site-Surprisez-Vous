import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

const db = () => getFirebaseDb();

export interface Evenement {
  id: string;
  nom: string;
  description?: string;
  image_url?: string;
  categories: string[];
  actif: boolean;
  ordre: number;
}

const COLLECTION = 'evenements';

export async function getEvenements(): Promise<Evenement[]> {
  const snap = await getDocs(collection(db(), COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Evenement);
}

export async function saveEvenement(evt: Evenement): Promise<string> {
  const ref = evt.id ? doc(db(), COLLECTION, evt.id) : doc(collection(db(), COLLECTION));
  const { id, ...data } = evt;
  await setDoc(ref, data);
  return ref.id;
}

export async function deleteEvenement(id: string): Promise<void> {
  await deleteDoc(doc(db(), COLLECTION, id));
}
