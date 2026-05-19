import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

const db = () => getFirebaseDb();

const COLLECTION = 'stat-categories';

export interface StatCategory {
  code: string;         // ex: "CO", "DEAM", "PTKDUN"
  designation: string;
  niveau: 1 | 2 | 3;   // 1=principale (2 chars), 2=sous-cat (4 chars), 3=sous-sous-cat (6 chars)
  parent?: string;      // code du parent (ex: "DE" pour "DEAM", "DEAM" pour "DEAMGB")
  actif: boolean;
}

export function getNiveau(code: string): 1 | 2 | 3 {
  if (code.length <= 2) return 1;
  if (code.length <= 4) return 2;
  return 3;
}

export function getParentCode(code: string): string | undefined {
  if (code.length <= 2) return undefined;
  if (code.length <= 4) return code.slice(0, 2);
  return code.slice(0, 4);
}

export async function getStatCategories(): Promise<StatCategory[]> {
  const snap = await getDocs(collection(db(), COLLECTION));
  return snap.docs.map((d) => ({ code: d.id, ...d.data() }) as StatCategory);
}

export async function toggleStatCategoryActif(code: string, actif: boolean): Promise<void> {
  await setDoc(doc(db(), COLLECTION, code), { actif }, { merge: true });
}

/**
 * Genere les codes stats (niveaux 1/2/3) a partir des pdt_code_stat des produits.
 * Les codes sont extraits par prefixes de 2, 4 et 6 caracteres.
 */
export function generateStatCategoriesFromProducts(
  products: { pdt_code_stat?: string }[],
  existing: StatCategory[] = [],
): StatCategory[] {
  const existingMap = new Map(existing.map((c) => [c.code, c]));
  const codesSet = new Set<string>();

  for (const p of products) {
    const code = (p.pdt_code_stat || '').trim().toUpperCase();
    if (!code) continue;
    if (code.length >= 2) codesSet.add(code.slice(0, 2));
    if (code.length >= 4) codesSet.add(code.slice(0, 4));
    if (code.length >= 6) codesSet.add(code.slice(0, 6));
  }

  const result: StatCategory[] = [];
  for (const code of codesSet) {
    const ex = existingMap.get(code);
    result.push({
      code,
      designation: ex?.designation || code,
      niveau: getNiveau(code),
      parent: getParentCode(code),
      actif: ex?.actif ?? true,
    });
  }
  return result.sort((a, b) => a.code.localeCompare(b.code));
}

export async function saveStatCategories(categories: StatCategory[]): Promise<void> {
  const firestore = db();
  const batchSize = 450;
  for (let i = 0; i < categories.length; i += batchSize) {
    const batch = writeBatch(firestore);
    const chunk = categories.slice(i, i + batchSize);
    for (const cat of chunk) {
      const ref = doc(firestore, COLLECTION, cat.code);
      batch.set(ref, {
        designation: cat.designation,
        niveau: cat.niveau,
        parent: cat.parent || null,
        actif: cat.actif,
      }, { merge: true });
    }
    await batch.commit();
  }
}
