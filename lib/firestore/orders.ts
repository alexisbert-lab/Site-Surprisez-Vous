import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import { pushOrderNotif } from '../rtdb/notifications';

const db = () => getFirebaseDb();

// ===== Collection "orders" — commandes web manuelles =====

export interface OrderLine {
  ref: string;
  designation: string;
  qte: number;
  prix_unitaire: number;
}

export interface Order {
  id: string;
  client: string;
  clientEmail?: string;
  date: string;
  lignes: OrderLine[];
  montant_ht: number;
  statut: 'En attente' | 'Validee' | 'Expediee' | 'Livree' | 'Annulee';
  commentaire?: string;
}

export async function getOrders(): Promise<Order[]> {
  const snap = await getDocs(collection(db(), 'orders'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
}

export async function updateOrderStatus(id: string, statut: Order['statut']): Promise<void> {
  await updateDoc(doc(db(), 'orders', id), { statut });
}

export async function createOrder(order: Omit<Order, 'id'>): Promise<string> {
  const ref = doc(collection(db(), 'orders'));
  await setDoc(ref, order);
  pushOrderNotif(ref.id, `Nouvelle commande — ${order.client} (${order.montant_ht.toFixed(2)} € HT)`);
  return ref.id;
}

// ===== Collection "commandes" — commandes ERP =====

const COLLECTION = 'commandes';

export type EtatCommande = 'C' | 'V' | 'A' | 'E' | 'G';

export const ETAT_LABELS: Record<string, string> = {
  C: 'Clôturée',
  V: 'Validée',
  A: 'Annulée',
  E: 'En cours de saisie',
  G: 'Gagnée',
};

export interface Commande {
  id: string;
  clt_id: string;
  reference: string;
  date: string;
  date_demande: string;
  date_expedition?: string;
  date_validation?: string;
  etat: EtatCommande;
  type_saisie: string;
  notes?: string;
  notes_imprimable?: string;
  client_nom: string;
  adr_liv_destinataire?: string;
  adr_liv_voie?: string;
  adr_liv_cp?: string;
  adr_liv_commune?: string;
  adr_liv_pays?: string;
  prix_ht: number;
  prix_tva: number;
  prix_ttc: number;
  poids_total?: number;
  mode_paiement?: string;
  delai_paiement?: number;
}

export async function getCommandesByClientId(cltId: string): Promise<Commande[]> {
  const q = query(
    collection(db(), COLLECTION),
    where('clt_id', '==', cltId),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Commande);
}

export async function getCommande(id: string): Promise<Commande | null> {
  const snap = await getDoc(doc(db(), COLLECTION, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Commande) : null;
}

export async function getAllCommandes(): Promise<Commande[]> {
  const q = query(collection(db(), COLLECTION), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Commande);
}
