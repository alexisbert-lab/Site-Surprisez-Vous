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

export interface Category {
  id: string;
  nom: string;
  code_stat: string; // Prefix to match against product pdt_code_stat (e.g. "BF")
}

export interface Declination {
  id: string;
  designation: string;
  sous_titre?: string;
  variants: { label: string; ref: string }[];
}

const CATEGORIES_COLLECTION = 'categories';
const DECLINATIONS_COLLECTION = 'declinations';
const GROUPS_COLLECTION = 'product-groups';

// Categories
export async function getCategories(): Promise<Category[]> {
  const snap = await getDocs(collection(db(), CATEGORIES_COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category);
}

export async function createCategory(nom: string, code_stat: string): Promise<string> {
  const ref = doc(collection(db(), CATEGORIES_COLLECTION));
  await setDoc(ref, { nom, code_stat: code_stat.toUpperCase() });
  return ref.id;
}

export async function updateCategory(id: string, data: { nom: string; code_stat: string }): Promise<void> {
  await updateDoc(doc(db(), CATEGORIES_COLLECTION, id), { nom: data.nom, code_stat: data.code_stat.toUpperCase() });
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db(), CATEGORIES_COLLECTION, id));
}

// Product-group assignments (productRef -> categoryId)
export async function getProductGroups(): Promise<Record<string, string>> {
  const snap = await getDocs(collection(db(), GROUPS_COLLECTION));
  const groups: Record<string, string> = {};
  snap.docs.forEach((d) => {
    groups[d.id] = d.data().categoryId as string;
  });
  return groups;
}

export async function assignProductToCategory(productRef: string, categoryId: string): Promise<void> {
  await setDoc(doc(db(), GROUPS_COLLECTION, productRef), { categoryId });
}

export async function removeProductFromCategory(productRef: string): Promise<void> {
  await deleteDoc(doc(db(), GROUPS_COLLECTION, productRef));
}

// Declinations
export async function getDeclinations(): Promise<Declination[]> {
  const snap = await getDocs(collection(db(), DECLINATIONS_COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Declination);
}

export async function saveDeclination(dec: Declination): Promise<void> {
  await setDoc(doc(db(), DECLINATIONS_COLLECTION, dec.id), {
    designation: dec.designation,
    sous_titre: dec.sous_titre || '',
    variants: dec.variants,
  });
}

export async function deleteDeclination(id: string): Promise<void> {
  await deleteDoc(doc(db(), DECLINATIONS_COLLECTION, id));
}
