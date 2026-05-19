import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

const db = () => getFirebaseDb();

export type MarketingType = 'coup_de_coeur' | 'nouveaute' | 'prochainement';

export interface MarketingItem {
  id: string;
  type: MarketingType;
  ref_produit: string;
  designation: string;
  ordre: number;
  actif: boolean;
  date_debut?: string;
  date_fin?: string;
}

const COLLECTION = 'marketing';

export async function getMarketingItems(): Promise<MarketingItem[]> {
  const snap = await getDocs(collection(db(), COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MarketingItem);
}

export async function saveMarketingItem(item: MarketingItem): Promise<string> {
  const ref = item.id ? doc(db(), COLLECTION, item.id) : doc(collection(db(), COLLECTION));
  const { id, ...data } = item;
  await setDoc(ref, data);
  return ref.id;
}

export async function deleteMarketingItem(id: string): Promise<void> {
  await deleteDoc(doc(db(), COLLECTION, id));
}
