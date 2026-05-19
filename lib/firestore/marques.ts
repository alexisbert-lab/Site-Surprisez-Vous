import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

const db = () => getFirebaseDb();

export interface Marque {
  id: string;
  nom: string;
  logo_url?: string;
  description?: string;
  licence: boolean;
  actif: boolean;
}

const MARQUES_COLLECTION = 'marques';
const PRODUCT_MARQUES_COLLECTION = 'product-marques';

export async function getMarques(): Promise<Marque[]> {
  const snap = await getDocs(collection(db(), MARQUES_COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Marque);
}

export async function saveMarque(marque: Marque): Promise<string> {
  const ref = marque.id ? doc(db(), MARQUES_COLLECTION, marque.id) : doc(collection(db(), MARQUES_COLLECTION));
  const { id, ...data } = marque;
  await setDoc(ref, data);
  return ref.id;
}

export async function deleteMarque(id: string): Promise<void> {
  await deleteDoc(doc(db(), MARQUES_COLLECTION, id));
}

export async function getProductMarques(): Promise<Record<string, string>> {
  const snap = await getDocs(collection(db(), PRODUCT_MARQUES_COLLECTION));
  const mapping: Record<string, string> = {};
  snap.docs.forEach((d) => {
    mapping[d.id] = d.data().marqueId as string;
  });
  return mapping;
}

export async function assignProductToMarque(productRef: string, marqueId: string): Promise<void> {
  await setDoc(doc(db(), PRODUCT_MARQUES_COLLECTION, productRef), { marqueId });
}

export async function removeProductFromMarque(productRef: string): Promise<void> {
  await deleteDoc(doc(db(), PRODUCT_MARQUES_COLLECTION, productRef));
}
