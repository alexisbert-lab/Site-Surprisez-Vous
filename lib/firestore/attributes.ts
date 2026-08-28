import { collection, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

const db = () => getFirebaseDb();

/**
 * Où l'attribut s'affiche sur le site. Piloté par la colonne `zone` du classeur.
 * `groupe` ne s'affiche nulle part : il rassemble les références d'un même article.
 */
export type AttributeZone = 'menu' | 'filtre_tete' | 'filtre_attr' | 'fiche' | 'groupe';
/** Comment il s'affiche. Piloté par la colonne `rendu`. */
export type AttributeRendu = 'chips' | 'pastille' | 'case';

/** Une ligne de la feuille ATTRIBUTS : le registre décrit l'interface, l'interface ne décrit rien. */
export interface AttributeDef {
  cle: string;
  libelle: string;
  zone: AttributeZone;
  /** Profondeur dans le menu : 1 = catégorie, 2 = sous-catégorie. null hors zone menu. */
  niveau: number | null;
  type: string;
  /** Nombre de valeurs qu'un produit peut porter. > 1 ⇒ le champ est un tableau. */
  slots: number;
  rendu: AttributeRendu;
  ordre: number;
  actif: boolean;
  /** Porte une variante : c'est cet attribut qui distingue les membres d'un groupe. */
  axe: boolean;
}

/** Une ligne de la feuille VALEURS : le référentiel des options possibles. */
export interface AttributeValue {
  attribut: string;
  /** Clé technique stockée sur le produit. */
  slug: string;
  /** Libellé affiché. Jamais dérivé du slug. */
  libelle: string;
  /** Couleur de pastille, sans « # ». Vide pour « multicolore ». */
  hex: string;
  /** Rattachement hiérarchique : la catégorie d'une sous-catégorie. */
  parent: string;
  ordre: number;
  actif: boolean;
}

/** Une ligne de la feuille EXPORT : les attributs d'une référence produit. */
export interface ProductAttributes {
  ref: string;
  statut: string;
  description_courte: string;
  seo_slug: string;
  /** Une clé par attribut du registre : string si slots = 1, string[] si slots > 1. */
  [cle: string]: string | string[];
}

/**
 * Une ligne de la feuille GROUPES : ce qu'un article décliné porte en propre,
 * par-delà ses références. Sans elle, un groupe n'a ni chef désigné ni description.
 */
export interface ProductGroup {
  groupe: string;
  /** Référence maître : son image, sa désignation, son URL canonique. */
  ref_principale: string;
  /** Affichée tant que le maître est sélectionné, jamais sur une variante. */
  description: string;
}

const REGISTRY_COLLECTION = 'attribute-registry';
const VALUES_COLLECTION = 'attribute-values';
const PRODUCT_ATTRIBUTES_COLLECTION = 'product-attributes';
const PRODUCT_GROUPS_COLLECTION = 'product-groups';

/**
 * Le référentiel peut être absent : collections pas encore créées, règles pas encore
 * déployées. Le catalogue doit alors rester une grille simple, pas planter le rendu.
 */
async function lireOuVide<T>(nom: string, lecture: () => Promise<T>, vide: T): Promise<T> {
  try {
    return await lecture();
  } catch (e) {
    console.warn(`[attributs] ${nom} illisible, le catalogue s'affiche sans référentiel :`, e);
    return vide;
  }
}

export async function getAttributeRegistry(): Promise<AttributeDef[]> {
  return lireOuVide(REGISTRY_COLLECTION, async () => {
    const snap = await getDocs(collection(db(), REGISTRY_COLLECTION));
    return snap.docs.map((d) => d.data() as AttributeDef);
  }, []);
}

export async function getAttributeValues(): Promise<AttributeValue[]> {
  return lireOuVide(VALUES_COLLECTION, async () => {
    const snap = await getDocs(collection(db(), VALUES_COLLECTION));
    return snap.docs.map((d) => d.data() as AttributeValue);
  }, []);
}

/** Indexé par référence produit pour la jointure avec la collection `products`. */
export async function getProductAttributes(): Promise<Record<string, ProductAttributes>> {
  return lireOuVide(PRODUCT_ATTRIBUTES_COLLECTION, async () => {
    const snap = await getDocs(collection(db(), PRODUCT_ATTRIBUTES_COLLECTION));
    const out: Record<string, ProductAttributes> = {};
    snap.docs.forEach((d) => {
      const data = d.data() as ProductAttributes;
      if (data.ref) out[data.ref] = data;
    });
    return out;
  }, {} as Record<string, ProductAttributes>);
}

/** Indexé par code de groupe : c'est par lui que `clefGroupe` retrouve l'entrée. */
export async function getProductGroups(): Promise<Record<string, ProductGroup>> {
  return lireOuVide(PRODUCT_GROUPS_COLLECTION, async () => {
    const snap = await getDocs(collection(db(), PRODUCT_GROUPS_COLLECTION));
    const out: Record<string, ProductGroup> = {};
    snap.docs.forEach((d) => {
      const data = d.data() as ProductGroup;
      if (data.groupe) out[data.groupe] = data;
    });
    return out;
  }, {} as Record<string, ProductGroup>);
}
