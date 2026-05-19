import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

const db = () => getFirebaseDb();

const COLLECTION = 'settings';
const STOCK_DOC = 'stock';

export interface StockSettings {
  seuil_stock_faible: number;
}

const DEFAULTS: StockSettings = {
  seuil_stock_faible: 20,
};

export async function getStockSettings(): Promise<StockSettings> {
  const snap = await getDoc(doc(db(), COLLECTION, STOCK_DOC));
  if (!snap.exists()) return DEFAULTS;
  return { ...DEFAULTS, ...snap.data() } as StockSettings;
}

export async function saveStockSettings(settings: StockSettings): Promise<void> {
  await setDoc(doc(db(), COLLECTION, STOCK_DOC), settings);
}
