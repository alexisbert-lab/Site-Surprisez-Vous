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

export interface GroupeContact {
  id: string;
  nom: string;
  commercial_id: string;
  commercial_nom: string;
  client_ids: string[];
  description?: string;
  date_creation: string;
}

const COLLECTION = 'groupes-contact';

export async function getGroupesContact(): Promise<GroupeContact[]> {
  const snap = await getDocs(collection(db(), COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GroupeContact);
}

export async function saveGroupeContact(groupe: GroupeContact): Promise<string> {
  const ref = groupe.id ? doc(db(), COLLECTION, groupe.id) : doc(collection(db(), COLLECTION));
  const { id, ...data } = groupe;
  await setDoc(ref, data);
  return ref.id;
}

export async function updateGroupeContact(id: string, data: Partial<GroupeContact>): Promise<void> {
  await updateDoc(doc(db(), COLLECTION, id), data);
}

export async function deleteGroupeContact(id: string): Promise<void> {
  await deleteDoc(doc(db(), COLLECTION, id));
}
