import { collection, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

export interface Catalogue {
  id: string;
  cat_id: number;
  cat_reference: string;
  cat_designation: string;
  cat_mode: string;
  cat_permanent: boolean;
}

const db = () => getFirebaseDb();

export async function getCatalogues(): Promise<Catalogue[]> {
  const snap = await getDocs(collection(db(), 'catalogues'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Catalogue);
}
