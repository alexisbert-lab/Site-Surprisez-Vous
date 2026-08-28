import type { ProductAttributes, ProductGroup } from './firestore/attributes';
import type { AttributeDef } from './firestore/attributes';
import { type Registry, libelleDe, teinteDe } from './attributes';

/**
 * Regroupement des références d'un même article.
 *
 * L'ERP ne connaît que des références plates : un chemin de table or et un chemin de
 * table argent sont deux articles sans lien. Le classeur les rassemble par la colonne
 * `groupe`, et la colonne `axe` du registre désigne l'attribut qui les distingue —
 * donc le libellé et la pastille d'une variante viennent du référentiel, jamais d'une
 * saisie libre.
 *
 * Un article sans groupe est un groupe d'un seul membre : aucun cas particulier en aval.
 */

/** Tout ce dont le regroupement a besoin d'un produit. */
export interface AvecRef {
  pdt_reference: string;
  /** Désignation ERP : le nom affiché de l'article. Le classeur ne le recopie pas. */
  pdt_designation?: string;
}

export interface Variante<P extends AvecRef> {
  produit: P;
  attrs: ProductAttributes | undefined;
  /** Valeur d'axe portée par cette variante. Vide si aucun axe ne distingue le groupe. */
  slug: string;
  libelle: string;
  /** Description propre à la référence, montrée en regard de son bouton. */
  description: string;
  /** Renseignée seulement quand l'axe se rend en pastille. */
  teinte: string;
  /** URL de la fiche, dérivée du classeur. Vide tant que la référence n'y est pas décrite. */
  seoSlug: string;
}

/**
 * La devanture d'un article décliné : ce qu'on voit avant d'avoir choisi.
 *
 * Elle ne correspond à aucune référence de l'ERP et ne s'achète pas — elle n'apparaît
 * donc jamais dans la liste des déclinaisons, qui ne montre que du vendable.
 */
export interface Devanture {
  designation: string;
  description: string;
  /** Fichier de Storage sous `products/`, à défaut le code de groupe. */
  imageRef: string;
  seoSlug: string;
}

export interface Groupe<P extends AvecRef> {
  /** Identifiant interne, préfixé pour qu'un code de groupe ne heurte jamais une référence. */
  clef: string;
  /**
   * Premier membre par ordre de référence. Ancrage technique — identité de la fusion,
   * repli d'affichage quand aucune devanture n'est décrite. Ce n'est pas un « chef » :
   * la vitrine d'un article, c'est `devanture`.
   */
  chef: P;
  /** `undefined` tant que le groupe n'a pas de ligne dans la feuille GROUPES. */
  devanture: Devanture | undefined;
  membres: P[];
  variantes: Variante<P>[];
  /** Attributs des membres, pour les filtres et les compteurs. */
  attrs: (ProductAttributes | undefined)[];
  /**
   * Union des attributs des membres. Un article décliné en or et en argent porte les
   * deux : filtrer sur « argent » doit le ramener, et il ne doit compter qu'une fois
   * dans la facette. Le moteur de facettes s'applique dessus sans rien savoir des groupes.
   */
  fusion: ProductAttributes;
  /** L'attribut qui distingue les membres. `undefined` pour un groupe d'un seul membre. */
  axe: AttributeDef | undefined;
}

/** Champs d'identité : ceux du chef font foi, ils ne s'additionnent pas. */
const IDENTITE = ['ref', 'statut', 'description_courte', 'seo_slug'];

function fusionner(
  refChef: string,
  membres: (ProductAttributes | undefined)[]
): ProductAttributes {
  const base = membres.find(Boolean);
  const out: Record<string, string | string[]> = {
    ref: base?.ref ?? refChef,
    statut: base?.statut ?? '',
    description_courte: base?.description_courte ?? '',
    seo_slug: base?.seo_slug ?? '',
  };
  for (const attrs of membres) {
    if (!attrs) continue;
    for (const [cle, brut] of Object.entries(attrs)) {
      if (IDENTITE.includes(cle)) continue;
      const vals = (Array.isArray(brut) ? brut : [brut]).filter(Boolean);
      if (!vals.length) continue;
      const deja = out[cle];
      const cumul = new Set([...(Array.isArray(deja) ? deja : deja ? [deja] : []), ...vals]);
      // Un attribut à un seul slot reste scalaire tant que les membres s'accordent.
      out[cle] = cumul.size > 1 || Array.isArray(brut) ? [...cumul] : [...cumul][0];
    }
  }
  return out as ProductAttributes;
}

/** Un attribut à plusieurs slots reste un seul axe : c'est sa première valeur qui distingue. */
const premier = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? v[0] : v) ?? '';

/** Code de groupe saisi au classeur, vide si la référence n'en porte pas. */
const codeGroupe = (attrs: ProductAttributes | undefined, reg: Registry): string =>
  attrs ? premier(attrs[reg.cleGroupe]) : '';

/** Clé de regroupement d'une référence. Sans `groupe` au classeur, elle est seule. */
export function clefGroupe(
  ref: string,
  attrs: ProductAttributes | undefined,
  reg: Registry
): string {
  const groupe = codeGroupe(attrs, reg);
  return groupe ? `g:${groupe}` : `r:${ref}`;
}

/**
 * L'axe est le premier attribut du registre qui distingue **tous** les membres.
 * À défaut, le premier qui en distingue au moins deux — sinon le groupe est mal saisi,
 * ce que la colonne CONTRÔLE du classeur signale de son côté.
 */
function trouverAxe<P extends AvecRef>(
  membres: P[],
  attributs: Record<string, ProductAttributes>,
  reg: Registry
): AttributeDef | undefined {
  if (membres.length < 2) return undefined;
  const valeurs = (a: AttributeDef) =>
    new Set(membres.map((m) => premier(attributs[m.pdt_reference]?.[a.cle])));
  return (
    reg.axes.find((a) => valeurs(a).size === membres.length) ??
    reg.axes.find((a) => valeurs(a).size > 1)
  );
}

function construire<P extends AvecRef>(
  clef: string,
  membres: P[],
  attributs: Record<string, ProductAttributes>,
  reg: Registry,
  meta: ProductGroup | undefined
): Groupe<P> {
  // Tri par référence : ni l'ordre de l'ERP ni celui du classeur ne doivent décider
  // quelle déclinaison ouvre la liste, ni laquelle sert de repli sans devanture.
  const tries = [...membres].sort((a, b) => a.pdt_reference.localeCompare(b.pdt_reference));
  const axe = trouverAxe(tries, attributs, reg);
  const chef = tries[0];

  const variantes = tries.map((produit) => {
    const attrs = attributs[produit.pdt_reference];
    const slug = axe ? premier(attrs?.[axe.cle]) : '';
    return {
      produit,
      attrs,
      slug,
      libelle: axe && slug
        ? libelleDe(reg, axe.cle, slug)
        : (produit.pdt_designation || produit.pdt_reference),
      description: attrs?.description_courte ?? '',
      teinte: axe?.rendu === 'pastille' && slug ? teinteDe(reg, axe.cle, slug) : '',
      seoSlug: attrs?.seo_slug ?? '',
    };
  });

  return {
    clef,
    chef,
    devanture: meta && meta.designation
      ? {
          designation: meta.designation,
          description: meta.description,
          // Sans fichier nommé, la photo de la devanture porte le code du groupe.
          imageRef: meta.image_ref || meta.groupe,
          seoSlug: meta.seo_slug,
        }
      : undefined,
    membres: tries,
    variantes,
    attrs: variantes.map((v) => v.attrs),
    fusion: fusionner(chef.pdt_reference, variantes.map((v) => v.attrs)),
    axe,
  };
}

/** Une entrée par article, dans l'ordre d'apparition du premier membre. */
export function grouper<P extends AvecRef>(
  produits: P[],
  attributs: Record<string, ProductAttributes>,
  reg: Registry,
  groupes: Record<string, ProductGroup> = {}
): Groupe<P>[] {
  const paquets = new Map<string, P[]>();
  const codes = new Map<string, string>();
  for (const p of produits) {
    // Le cache produits porte des lignes sans référence — des mises à jour de
    // colisage arrivées avant leur article. Sans ce filtre, le tri par référence
    // de `construire` casse la page entière au lieu d'ignorer une ligne vide.
    if (!p.pdt_reference) continue;
    const attrs = attributs[p.pdt_reference];
    const code = codeGroupe(attrs, reg);
    const clef = code ? `g:${code}` : `r:${p.pdt_reference}`;
    const lot = paquets.get(clef);
    if (lot) lot.push(p);
    else { paquets.set(clef, [p]); codes.set(clef, code); }
  }
  const out: Groupe<P>[] = [];
  paquets.forEach((membres, clef) => {
    const code = codes.get(clef) ?? '';
    out.push(construire(clef, membres, attributs, reg, code ? groupes[code] : undefined));
  });
  return out;
}

/**
 * Vue « déclinaison » d'un groupe, pour le catalogue pro qui présente les variantes en
 * bande dépliable. Remplace la collection `declinations` saisie à la main : la désignation
 * vient de la devanture, le sous-titre du libellé de l'axe, les libellés de variante du
 * référentiel. Seuls les variants s'achètent — la devanture n'a ni prix ni stock.
 */
export interface Declinaison {
  id: string;
  designation: string;
  sous_titre?: string;
  /** Description de l'article, saisie dans la feuille GROUPES. */
  description: string;
  variants: { label: string; ref: string; description: string }[];
}

export function versDeclinaisons<P extends AvecRef>(
  groupes: Groupe<P>[]
): Declinaison[] {
  return groupes
    .filter((g) => g.variantes.length > 1)
    .map((g) => ({
      id: g.clef,
      designation:
        g.devanture?.designation || g.chef.pdt_designation || g.chef.pdt_reference,
      sous_titre: g.axe?.libelle,
      description: g.devanture?.description ?? '',
      variants: g.variantes.map((v) => ({
        label: v.libelle,
        ref: v.produit.pdt_reference,
        description: v.description,
      })),
    }));
}

/** Retrouve la variante ouverte depuis une URL. Repli sur le premier membre. */
export function variantePourSlug<P extends AvecRef>(
  groupe: Groupe<P>,
  seoSlug: string
): Variante<P> {
  return groupe.variantes.find((v) => v.seoSlug === seoSlug) ?? groupe.variantes[0];
}

/**
 * L'URL désigne-t-elle la devanture plutôt qu'une déclinaison ?
 *
 * Un article décliné a deux sortes d'adresses : celle de sa devanture, qui l'ouvre sur
 * la vue d'ensemble, et une par référence achetable. Sans devanture décrite, tout slug
 * mène à une variante et cette question n'a pas lieu d'être.
 */
export function estDevanture<P extends AvecRef>(
  groupe: Groupe<P>,
  seoSlug: string
): boolean {
  return !!groupe.devanture?.seoSlug && groupe.devanture.seoSlug === seoSlug;
}

/** Le groupe dont une URL — devanture ou déclinaison — ouvre la fiche. */
export function groupePourSlug<P extends AvecRef>(
  groupes: Groupe<P>[],
  seoSlug: string
): Groupe<P> | undefined {
  return groupes.find(
    (g) => g.devanture?.seoSlug === seoSlug || g.variantes.some((v) => v.seoSlug === seoSlug)
  );
}
