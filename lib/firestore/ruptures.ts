import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

const db = () => getFirebaseDb();

export interface Rupture {
  id: string;
  ref_produit: string;
  designation: string;
  date_rupture: string;
  date_retour_prevue?: string;
  statut: 'en_rupture' | 'retour_partiel' | 'retabli';
  commentaire?: string;
}

const COLLECTION = 'ruptures';

export async function getRuptures(): Promise<Rupture[]> {
  const snap = await getDocs(collection(db(), COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Rupture);
}

export async function createRupture(data: Omit<Rupture, 'id'>): Promise<string> {
  const ref = doc(collection(db(), COLLECTION));
  await setDoc(ref, data);
  return ref.id;
}

export async function updateRupture(id: string, data: Partial<Rupture>): Promise<void> {
  await updateDoc(doc(db(), COLLECTION, id), data);
}

export async function deleteRupture(id: string): Promise<void> {
  await deleteDoc(doc(db(), COLLECTION, id));
}
