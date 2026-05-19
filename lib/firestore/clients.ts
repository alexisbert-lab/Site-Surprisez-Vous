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
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

const db = () => getFirebaseDb();

export interface Client {
  id: string;
  erp_id?: string;  // ID ERP (clé de jointure avec commandes.clt_id)
  cat_ids?: number[];  // IDs catalogues restreints (absent = pas de restriction)
  // Société
  raison_soc: string;
  enseigne?: string;
  siret?: string;
  num_tva?: string;
  tpe_client?: string;
  // Contact
  email: string;
  tel?: string;
  fax?: string;
  // Gérant
  nom_gerant?: string;
  prenom_gerant?: string;
  // Acheteur
  nom_ach?: string;
  prenom_ach?: string;
  // Adresse
  adr?: string;
  cp?: string;
  ville?: string;
  pays?: string;
  // Gestion
  profil_id?: string;
  groupe_contact_id?: string;
  tarif_grid_id?: string; // grille tarifaire assignée à ce client
  uid?: string;           // UID Firebase Auth lié à ce client
  commentaire?: string;
  raison_desactive?: string;
  login?: string;
  motdepasse?: string;
  statut: 'Valide' | 'En attente' | 'Refuse';
}

export interface ProRequest {
  id: string;
  nom_entreprise: string;
  siret: string;
  contact: string;
  tel: string;
  email: string;
  type_activite: string;
  date: string;
  statut: 'En attente' | 'Valide' | 'Refuse';
}

const CLIENTS_COLLECTION = 'clients';
const REQUESTS_COLLECTION = 'pro-requests';

// Clients
export async function getClients(): Promise<Client[]> {
  const snap = await getDocs(collection(db(), CLIENTS_COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client);
}

export async function getClient(id: string): Promise<Client | null> {
  const snap = await getDoc(doc(db(), CLIENTS_COLLECTION, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Client) : null;
}

export async function updateClient(id: string, data: Partial<Client>): Promise<void> {
  await updateDoc(doc(db(), CLIENTS_COLLECTION, id), data);
}

export async function getClientByEmail(email: string): Promise<Client | null> {
  const q = query(collection(db(), CLIENTS_COLLECTION), where('email', '==', email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Client;
}

/** Lie un client à un compte Firebase Auth (bidirectionnel). */
export async function linkClientToUser(clientId: string, uid: string, tarifGridId?: string): Promise<void> {
  const db = getFirebaseDb();
  const batch = (await import('firebase/firestore')).writeBatch(db);

  // Côté client : stocker l'uid
  batch.update(doc(db, CLIENTS_COLLECTION, clientId), { uid });

  // Côté user : stocker client_id + tarif_grid_id
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  const userUpdate: Record<string, unknown> = { client_id: clientId };
  if (tarifGridId) userUpdate.tarif_grid_id = tarifGridId;
  if (userSnap.exists()) {
    batch.update(userRef, userUpdate);
  } else {
    batch.set(userRef, { role: 'pro', ...userUpdate });
  }

  await batch.commit();
}

/** Supprime le lien entre un client et son compte Firebase Auth. */
export async function unlinkClientFromUser(clientId: string, uid: string): Promise<void> {
  const db = getFirebaseDb();
  const { writeBatch, deleteField } = await import('firebase/firestore');
  const batch = writeBatch(db);
  batch.update(doc(db, CLIENTS_COLLECTION, clientId), { uid: deleteField() });
  batch.update(doc(db, 'users', uid), { client_id: deleteField() });
  await batch.commit();
}

// Pro requests
export async function getProRequests(): Promise<ProRequest[]> {
  const snap = await getDocs(collection(db(), REQUESTS_COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProRequest);
}

export async function getProRequestsByStatus(statut: ProRequest['statut']): Promise<ProRequest[]> {
  const q = query(collection(db(), REQUESTS_COLLECTION), where('statut', '==', statut));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProRequest);
}

export async function createProRequest(request: Omit<ProRequest, 'id'>): Promise<string> {
  const ref = doc(collection(db(), REQUESTS_COLLECTION));
  await setDoc(ref, request);
  return ref.id;
}

export async function updateProRequestStatus(id: string, statut: ProRequest['statut']): Promise<void> {
  await updateDoc(doc(db(), REQUESTS_COLLECTION, id), { statut });
}
