import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

const db = () => getFirebaseDb();

export interface Article {
  id: string;
  titre: string;
  slug: string;
  contenu: string;
  extrait?: string;
  image_url?: string;
  auteur: string;
  date_publication: string;
  statut: 'brouillon' | 'publie' | 'archive';
  tags?: string[];
}

const COLLECTION = 'articles';

export async function getArticles(): Promise<Article[]> {
  const snap = await getDocs(collection(db(), COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Article);
}

export async function getArticle(id: string): Promise<Article | null> {
  const snap = await getDoc(doc(db(), COLLECTION, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Article) : null;
}

export async function saveArticle(article: Article): Promise<string> {
  const ref = article.id ? doc(db(), COLLECTION, article.id) : doc(collection(db(), COLLECTION));
  const { id, ...data } = article;
  await setDoc(ref, data);
  return ref.id;
}

export async function deleteArticle(id: string): Promise<void> {
  await deleteDoc(doc(db(), COLLECTION, id));
}
