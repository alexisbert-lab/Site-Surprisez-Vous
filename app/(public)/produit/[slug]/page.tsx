import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getCachedPublicProducts,
  getCachedStatCategories,
  getCachedAttributeRegistry,
  getCachedAttributeValues,
  getCachedProductAttributes,
  getCachedProductGroups,
} from '@/lib/server-cache';
import { filterArticlesVisiblesWithStatCats } from '@/lib/firestore/products';
import { buildRegistry } from '@/lib/attributes';
import { grouper, variantePourSlug } from '@/lib/declinaisons';
import FicheClient from './FicheClient';

/**
 * Fiche produit adressable, une par article — pas une par référence : les déclinaisons
 * partagent la page et se choisissent dedans. Chaque référence garde malgré tout son
 * `seo_slug` comme URL d'entrée, avec la canonique posée sur le chef du groupe.
 *
 * Pas de `generateStaticParams` : `getCachedProducts` se court-circuite pendant la phase
 * de build pour ne pas charger le catalogue entier (lib/server-cache.ts), donc prérendre
 * ces pages n'y graverait que des 404. Elles sont rendues à la demande, puis mises en
 * cache par les mêmes tags que le reste du référentiel.
 */

/** `cache` : les métadonnées et la page résolvent le même slug dans la même requête. */
const chargerGroupe = cache(async (slug: string) => {
  const [produits, statCats, defs, valeurs, attributs, groupes] = await Promise.all([
    getCachedPublicProducts(),
    getCachedStatCategories(),
    getCachedAttributeRegistry(),
    getCachedAttributeValues(),
    getCachedProductAttributes(),
    getCachedProductGroups(),
  ]);
  const reg = buildRegistry(defs, valeurs);
  const visibles = filterArticlesVisiblesWithStatCats(produits, statCats);
  const groupe = grouper(visibles, attributs, reg, groupes)
    .find((g) => g.variantes.some((v) => v.seoSlug === slug));
  return groupe ? { groupe, reg } : null;
});

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const trouve = await chargerGroupe(slug);
  if (!trouve) return { title: 'Article introuvable' };

  const variante = variantePourSlug(trouve.groupe, slug);
  const canonique = trouve.groupe.variantes[0].seoSlug || slug;
  return {
    title: variante.produit.pdt_designation,
    description: variante.attrs?.description_courte || undefined,
    alternates: { canonical: `/produit/${canonique}` },
  };
}

export default async function ProduitPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const trouve = await chargerGroupe(slug);
  if (!trouve) notFound();

  return <FicheClient groupe={trouve.groupe} reg={trouve.reg} slug={slug} />;
}
