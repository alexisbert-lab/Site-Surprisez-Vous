'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { PublicProduct } from '@/lib/firestore/products';
import type { AttributeDef } from '@/lib/firestore/attributes';
import { libelleDe, type Registry } from '@/lib/attributes';
import { variantePourSlug, estDevanture, type Groupe } from '@/lib/declinaisons';
import { ProductImage } from '@/components/ui/ProductImage';
import ListeDeclinaisons from '@/components/catalogue/ListeDeclinaisons';

/**
 * Le sélecteur de déclinaison réécrit l'URL : chaque variante reste partageable et le
 * bouton Précédent revient à la précédente. `replace` plutôt que `push` sur la première
 * ouverture aurait empilé une entrée d'historique par clic — ici c'est voulu.
 */
export default function FicheClient({ groupe, reg, slug }: {
  groupe: Groupe<PublicProduct>;
  reg: Registry;
  slug: string;
}) {
  const router = useRouter();
  const dev = groupe.devanture;
  // L'URL de la devanture ouvre l'article sans rien sélectionner ; celle d'une référence
  // ouvre directement sur elle. Une couleur précise reste donc partageable.
  const [refSel, setRefSel] = useState(
    estDevanture(groupe, slug) ? '' : variantePourSlug(groupe, slug).produit.pdt_reference
  );

  const variante = groupe.variantes.find((v) => v.produit.pdt_reference === refSel);
  const surDevanture = !variante;
  const produit = variante?.produit ?? groupe.chef;
  // Sur la devanture, la fiche décrit l'article : ses attributs sont l'union de ceux de
  // ses déclinaisons, la même que celle qui sert aux filtres.
  const attrs = variante ? variante.attrs : groupe.fusion;

  const choisir = (ref: string, seoSlug: string) => {
    setRefSel(ref);
    if (seoSlug && seoSlug !== slug) router.replace(`/produit/${seoSlug}`, { scroll: false });
  };

  const titre = surDevanture ? (dev?.designation ?? produit.pdt_designation) : produit.pdt_designation;
  const imageRef = surDevanture ? (dev?.imageRef || produit.pdt_reference) : produit.pdt_reference;
  const description = surDevanture
    ? dev?.description || groupe.variantes[0]?.description || ''
    : variante?.description ?? '';

  const categorie = attrs?.[reg.cleCategorie] as string | undefined;
  const sousCategorie = attrs?.[reg.cleSousCategorie] as string | undefined;

  const ligne = (def: AttributeDef) => {
    const brut = attrs?.[def.cle];
    const vals = (Array.isArray(brut) ? brut : brut ? [brut] : []).filter(Boolean);
    if (!vals.length) return null;
    return (
      <div
        key={def.cle}
        className="grid grid-cols-[140px_1fr] gap-4 py-3 border-b border-border/60 last:border-0"
      >
        <dt className="text-sm font-semibold text-ink">{def.libelle}</dt>
        <dd className="text-sm text-ink-secondary">
          {vals.map((v) => libelleDe(reg, def.cle, v)).join(', ')}
        </dd>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 flex-wrap text-sm text-ink-secondary mb-7">
        <Link href="/catalogue" className="hover:text-sv-primary">Catalogue</Link>
        {categorie && (
          <>
            <ChevronRight size={14} aria-hidden="true" />
            <Link
              href={`/catalogue?${reg.cleCategorie}=${encodeURIComponent(categorie)}`}
              className="hover:text-sv-primary"
            >
              {libelleDe(reg, reg.cleCategorie, categorie)}
            </Link>
          </>
        )}
        {categorie && sousCategorie && (
          <>
            <ChevronRight size={14} aria-hidden="true" />
            <Link
              href={`/catalogue?${reg.cleCategorie}=${encodeURIComponent(categorie)}&${reg.cleSousCategorie}=${encodeURIComponent(sousCategorie)}`}
              className="hover:text-sv-primary"
            >
              {libelleDe(reg, reg.cleSousCategorie, sousCategorie)}
            </Link>
          </>
        )}
      </nav>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="bg-section-alt rounded-2xl flex items-center justify-center p-8 md:p-12 md:min-h-125">
          <ProductImage
            imageRef={imageRef}
            className="w-full h-full max-h-125 object-contain"
          />
        </div>

        <div>
          {/* Rien à commander sur la devanture : pas de référence affichée. */}
          {!surDevanture && (
            <p className="text-xs text-ink-secondary font-mono">{produit.pdt_reference}</p>
          )}
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink leading-tight mt-2 font-[family-name:var(--font-heading)]">
            {titre}
          </h1>
          {description && (
            <p className="text-base text-ink-secondary mt-5 leading-relaxed">
              {description}
            </p>
          )}

          {groupe.variantes.length > 1 && (
            <div className="mt-8">
              <ListeDeclinaisons
                variantes={groupe.variantes}
                refSel={refSel}
                onSelect={(ref) => {
                  const v = groupe.variantes.find((x) => x.produit.pdt_reference === ref);
                  choisir(ref, v?.seoSlug ?? '');
                }}
                titre={groupe.axe?.libelle ?? 'Déclinaisons'}
                pastilles={groupe.axe?.rendu === 'pastille'}
              />
            </div>
          )}

          <dl className="mt-9">
            {[...reg.tete, ...reg.lat, ...reg.fiche].map(ligne)}
          </dl>
        </div>
      </div>
    </div>
  );
}
