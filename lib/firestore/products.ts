import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import type { StatCategory } from './stat-categories';

const db = () => getFirebaseDb();

export interface Product {
  pdt_reference: string;
  pdt_designation: string;
  pdt_ean?: string;
  pdt_code_stat?: string;
  pdt_etat?: string; // G=géré, N=fin de vie, B=bloqué, S=supprimé
  stock_physique: number;
  gpv_reference?: string;
  prix_type?: string;
  prix_base?: number;
  prix_coef_vente?: number;
  prix_vente?: number;
  en_rupture?: boolean;
  stock_faible?: boolean;
  visible_override?: boolean; // exception individuelle : visible même si son code stat est inactif
  quantite_colisage?: number;
  cat_ids?: number[]; // catalogues restreints qui incluent ce produit (absent = visible par tous)
}

export const SEUIL_STOCK_FAIBLE = 20;

export function getStockDisponible(p: Product): number {
  return p.stock_physique || 0;
}

export function isEnRupture(p: Product): boolean {
  return (p.stock_physique || 0) <= 0;
}

export function isStockFaible(p: Product, seuil = SEUIL_STOCK_FAIBLE): boolean {
  const stock = p.stock_physique || 0;
  return stock > 0 && stock <= seuil;
}

const COLLECTION = 'products';

function sanitize(data: Record<string, unknown>): Product {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { derniere_sync, ...rest } = data;
  return rest as unknown as Product;
}

export async function getProducts(): Promise<Product[]> {
  const snap = await getDocs(collection(db(), COLLECTION));
  return snap.docs.map((d) => sanitize(d.data()));
}

export async function getProduct(reference: string): Promise<Product | null> {
  const snap = await getDoc(doc(db(), COLLECTION, reference));
  return snap.exists() ? sanitize(snap.data()) : null;
}

export async function setProduct(product: Product): Promise<void> {
  await setDoc(doc(db(), COLLECTION, product.pdt_reference), product);
}

export async function deleteProduct(reference: string): Promise<void> {
  await deleteDoc(doc(db(), COLLECTION, reference));
}

export async function setProductVisibleOverride(reference: string, override: boolean | null): Promise<void> {
  const ref = doc(db(), COLLECTION, reference);
  if (override === null) {
    await updateDoc(ref, { visible_override: false });
  } else {
    await updateDoc(ref, { visible_override: override });
  }
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const q = query(collection(db(), COLLECTION), where('pdt_categorie', '==', category));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Product);
}

export function filterArticlesVisibles(products: Product[]): Product[] {
  return products.filter((p) => {
    if (!p.pdt_reference) return false;
    if (p.pdt_reference.toUpperCase().startsWith('ZFB')) return false;
    const etat = (p.pdt_etat || '').toUpperCase();
    if (etat === 'S' || etat === 'B') return false;
    return true;
  });
}

/** Filtre avec prise en compte des codes stats inactifs (cascade parent→enfant).
 *  Un produit avec visible_override=true reste visible même si son code stat est inactif. */
export function filterArticlesVisiblesWithStatCats(products: Product[], statCats: StatCategory[]): Product[] {
  const inactive = new Set(statCats.filter((c) => !c.actif).map((c) => c.code));
  if (inactive.size === 0) return filterArticlesVisibles(products);
  return filterArticlesVisibles(products).filter((p) => {
    if (p.visible_override) return true;
    const code = (p.pdt_code_stat || '').trim().toUpperCase();
    if (!code) return true;
    // Vérifie si le code lui-même ou un de ses ancêtres est inactif
    const prefixes = [code.slice(0, 2), code.slice(0, 4), code].filter((s, i, a) => s && a.indexOf(s) === i);
    return !prefixes.some((prefix) => inactive.has(prefix));
  });
}

export function getStatCategory(codeStat?: string): string {
  return codeStat ? codeStat.slice(0, 2) : '';
}

/** Convertit un EAN en notation scientifique (ex: "3.70105E+12") en entier lisible */
export function formatEan(ean?: string | number): string {
  if (!ean && ean !== 0) return '';
  const s = String(ean).replace(',', '.');
  if (/e/i.test(s)) return Math.round(parseFloat(s)).toString();
  return s;
}
