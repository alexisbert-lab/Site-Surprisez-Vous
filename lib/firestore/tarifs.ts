import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

const db = () => getFirebaseDb();

export interface TarifGrid {
  id: string;
  nom: string;
  profil_id?: string; // identifiant du groupe de vente, ex: "A", "STD", "PREMIUM"
  date_import: string;
  lignes_count: number;
  statut: 'active' | 'brouillon' | 'archivee';
}

export interface TarifLine {
  ref: string;
  designation: string;
  prix_ht: number;
  prix_promo_ht?: number;
  colisage: number;
  remise_pct?: number;
}

const GRIDS_COLLECTION = 'tarifs';
const linesCollection = (gridId: string) => `tarifs/${gridId}/lignes`;

export async function getTarifGrids(): Promise<TarifGrid[]> {
  const snap = await getDocs(collection(db(), GRIDS_COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TarifGrid);
}

export async function saveTarifGrid(grid: Omit<TarifGrid, 'id'> & { id?: string }): Promise<string> {
  const ref = grid.id ? doc(db(), GRIDS_COLLECTION, grid.id) : doc(collection(db(), GRIDS_COLLECTION));
  const { id, ...data } = grid;
  await setDoc(ref, data);
  return ref.id;
}

export async function deleteTarifGrid(id: string): Promise<void> {
  await deleteDoc(doc(db(), GRIDS_COLLECTION, id));
}

export async function getTarifLines(gridId: string): Promise<TarifLine[]> {
  const snap = await getDocs(collection(db(), linesCollection(gridId)));
  return snap.docs.map((d) => d.data() as TarifLine);
}

export async function importTarifLines(gridId: string, lines: TarifLine[]): Promise<void> {
  const batch = writeBatch(db());
  lines.forEach((line) => {
    const ref = doc(db(), linesCollection(gridId), line.ref);
    batch.set(ref, line);
  });
  await batch.commit();
}

export async function exportTarifLines(gridId: string): Promise<TarifLine[]> {
  return getTarifLines(gridId);
}

export async function getTarifLinesMap(gridId: string): Promise<Map<string, TarifLine>> {
  const lines = await getTarifLines(gridId);
  return new Map(lines.map((l) => [l.ref, l]));
}

export async function getActiveTarifGridByProfil(profilId: string): Promise<TarifGrid | null> {
  const grids = await getTarifGrids();
  return grids.find((g) => g.profil_id === profilId && g.statut === 'active') ?? null;
}
