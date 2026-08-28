import type {
  AttributeDef,
  AttributeValue,
  AttributeZone,
  ProductAttributes,
} from './firestore/attributes';

/**
 * Moteur de navigation à facettes piloté par le registre d'attributs.
 *
 * Aucune fonction ici ne connaît un attribut par son nom : tout vient de la feuille
 * ATTRIBUTS (où et comment afficher) et de la feuille VALEURS (libellés, couleurs,
 * hiérarchie, ordre). Ajouter une ligne au registre suffit à faire apparaître un filtre.
 */

/** Pastille des valeurs sans hex, « multicolore » en tête. */
export const TEINTE_MULTICOLORE = 'conic-gradient(red,orange,yellow,green,blue,violet,red)';

/** Valeur sélectionnée : une seule pour la navigation, plusieurs pour une facette. */
export type Selection = Record<string, string | string[] | null>;

export interface Registry {
  /** Navigation hiérarchique, triée par niveau : catégorie puis sous-catégorie. */
  menu: AttributeDef[];
  /** Facettes mises en avant au-dessus des résultats. */
  tete: AttributeDef[];
  /** Facettes de la colonne latérale. */
  lat: AttributeDef[];
  /** Attributs réservés à la fiche produit, jamais filtrables. */
  fiche: AttributeDef[];
  /** tete + lat : tout ce qui se coche et se décoche. */
  facettes: AttributeDef[];
  valeurs: AttributeValue[];
  /** Clé de l'attribut de niveau 1 du menu (la catégorie). */
  cleCategorie: string;
  /** Clé de l'attribut de niveau 2 du menu (la sous-catégorie). */
  cleSousCategorie: string;
  /** Clé de l'attribut qui rassemble les références d'un même article. */
  cleGroupe: string;
  /** Attributs susceptibles de distinguer les membres d'un groupe, par ordre de préférence. */
  axes: AttributeDef[];
}

const parOrdre = (a: { ordre: number }, b: { ordre: number }) => a.ordre - b.ordre;

export function buildRegistry(defs: AttributeDef[], valeurs: AttributeValue[]): Registry {
  const actifs = defs.filter((d) => d.actif).sort(parOrdre);
  const zone = (z: AttributeZone) => actifs.filter((d) => d.zone === z);
  const menu = zone('menu').sort((a, b) => (a.niveau ?? 0) - (b.niveau ?? 0));
  const tete = zone('filtre_tete');
  const lat = zone('filtre_attr');
  return {
    menu,
    tete,
    lat,
    fiche: zone('fiche'),
    facettes: [...tete, ...lat],
    valeurs: valeurs.filter((v) => v.actif).sort(parOrdre),
    cleCategorie: menu[0]?.cle ?? 'categorie',
    cleSousCategorie: menu[1]?.cle ?? 'sous_categorie',
    cleGroupe: zone('groupe')[0]?.cle ?? 'groupe',
    axes: actifs.filter((d) => d.axe),
  };
}

/** Valeurs d'un attribut, dans l'ordre du classeur. `parent` filtre les sous-catégories. */
export function valeursDe(reg: Registry, cle: string, parent?: string): AttributeValue[] {
  return reg.valeurs.filter((v) => v.attribut === cle && (parent === undefined || v.parent === parent));
}

export function valeurDe(reg: Registry, cle: string, slug: string): AttributeValue | undefined {
  return reg.valeurs.find((v) => v.attribut === cle && v.slug === slug);
}

/** Libellé d'affichage. Ne jamais dériver un libellé d'un slug : « eid » → « Fête de l'Aïd ». */
export function libelleDe(reg: Registry, cle: string, slug: string): string {
  if (!slug) return '';
  return valeurDe(reg, cle, slug)?.libelle ?? slug;
}

export function teinteDe(reg: Registry, cleCouleur: string, slug: string): string {
  const hex = valeurDe(reg, cleCouleur, slug)?.hex;
  return hex ? `#${hex}` : TEINTE_MULTICOLORE;
}

/** État initial : navigation à null, facettes à vide, dérivé du registre. */
export function selectionVide(reg: Registry): Selection {
  const s: Selection = {};
  reg.menu.forEach((a) => { s[a.cle] = null; });
  reg.facettes.forEach((a) => { s[a.cle] = []; });
  return s;
}

const porte = (valeur: string | string[] | undefined, slug: string) =>
  Array.isArray(valeur) ? valeur.includes(slug) : valeur === slug;

/**
 * Un produit passe le filtre si, pour chaque attribut, il porte au moins une des valeurs
 * cochées (OU dans le groupe) — et cela pour tous les groupes (ET entre les groupes).
 * `ignorer` sert au comptage des facettes : un groupe ne se compte jamais lui-même.
 */
export function correspond(
  attrs: ProductAttributes | undefined,
  selection: Selection,
  ignorer?: string | string[]
): boolean {
  if (!attrs) return false;
  const saut = ignorer ? (Array.isArray(ignorer) ? ignorer : [ignorer]) : [];
  return Object.keys(selection).every((cle) => {
    if (saut.includes(cle)) return true;
    const choisi = selection[cle];
    const valeur = attrs[cle];
    if (Array.isArray(choisi)) {
      if (choisi.length === 0) return true;
      return Array.isArray(valeur) ? valeur.some((v) => choisi.includes(v)) : choisi.includes(valeur);
    }
    if (!choisi) return true;
    return porte(valeur, choisi);
  });
}

/**
 * Nombre de produits qu'ajouterait cette valeur, les autres groupes restant appliqués.
 * Sans l'exclusion du groupe courant, cocher une valeur ramènerait toutes les autres à zéro.
 */
export function compte(
  listeAttrs: (ProductAttributes | undefined)[],
  selection: Selection,
  cle: string,
  slug: string,
  ignorer?: string | string[]
): number {
  return listeAttrs.filter((a) => a && correspond(a, selection, ignorer ?? cle) && porte(a[cle], slug)).length;
}

/** Ajoute ou retire une valeur d'une facette multi-sélection. */
export function bascule(selection: Selection, cle: string, slug: string): Selection {
  const courant = selection[cle];
  const arr = Array.isArray(courant) ? courant : [];
  return {
    ...selection,
    [cle]: arr.includes(slug) ? arr.filter((v) => v !== slug) : [...arr, slug],
  };
}

/** Sélection ↔ URL, pour que les filtres se partagent et que Précédent fonctionne. */
export function selectionVersParams(reg: Registry, selection: Selection): URLSearchParams {
  const params = new URLSearchParams();
  reg.menu.forEach((a) => {
    const v = selection[a.cle];
    if (typeof v === 'string' && v) params.set(a.cle, v);
  });
  reg.facettes.forEach((a) => {
    const v = selection[a.cle];
    if (Array.isArray(v) && v.length) params.set(a.cle, v.join('|'));
  });
  return params;
}

export function paramsVersSelection(reg: Registry, params: URLSearchParams): Selection {
  const s = selectionVide(reg);
  reg.menu.forEach((a) => { s[a.cle] = params.get(a.cle) || null; });
  reg.facettes.forEach((a) => {
    const brut = params.get(a.cle);
    s[a.cle] = brut ? brut.split('|').filter(Boolean) : [];
  });
  return s;
}
