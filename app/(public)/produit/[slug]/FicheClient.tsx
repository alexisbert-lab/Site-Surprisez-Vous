'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { PublicProduct } from '@/lib/firestore/products';
import type { AttributeDef } from '@/lib/firestore/attributes';
import { libelleDe, type Registry } from '@/lib/attributes';
import { variantePourSlug, type Groupe } from '@/lib/declinaisons';
import { ProductImage } from '@/components/ui/ProductImage';

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
  const [refSel, setRefSel] = useState(variantePourSlug(groupe, slug).produit.pdt_reference);

  const variante =
    groupe.variantes.find((v) => v.produit.pdt_reference === refSel) ?? groupe.variantes[0];
  const { produit, attrs } = variante;

  const choisir = (ref: string, seoSlug: string) => {
    setRefSel(ref);
    if (seoSlug && seoSlug !== slug) router.replace(`/produit/${seoSlug}`, { scroll: false });
  };

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
        <div className="bg-sv-grey-light rounded-2xl flex items-center justify-center p-8 md:p-12 md:min-h-125">
          <ProductImage
            imageRef={produit.pdt_reference}
            className="w-full h-full max-h-125 object-contain"
          />
        </div>

        <div>
          <p className="text-xs text-ink-secondary font-mono">{produit.pdt_reference}</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink leading-tight mt-2 font-[family-name:var(--font-heading)]">
            {attrs?.libelle || produit.pdt_designation}
          </h1>
          {attrs?.description_courte && (
            <p className="text-base text-ink-secondary mt-5 leading-relaxed">
              {attrs.description_courte}
            </p>
          )}

          {groupe.variantes.length > 1 && (
            <div className="mt-8">
              <p className="text-sm font-semibold text-ink mb-2.5">
                {groupe.axe?.libelle ?? 'Déclinaisons'}
                <span className="font-normal text-ink-secondary"> · {variante.libelle}</span>
              </p>
              <div className="flex items-center gap-2.5 flex-wrap">
                {groupe.variantes.map((v) => {
                  const actif = v.produit.pdt_reference === refSel;
                  return groupe.axe?.rendu === 'pastille' ? (
                    <button
                      key={v.produit.pdt_reference}
                      onClick={() => choisir(v.produit.pdt_reference, v.seoSlug)}
                      title={v.libelle}
                      aria-label={v.libelle}
                      aria-pressed={actif}
                      className={`w-9 h-9 rounded-full border-2 transition-colors cursor-pointer ${
                        actif ? 'border-sv-primary' : 'border-border hover:border-sv-primary/60'
                      }`}
                      style={{ background: v.teinte }}
                    />
                  ) : (
                    <button
                      key={v.produit.pdt_reference}
                      onClick={() => choisir(v.produit.pdt_reference, v.seoSlug)}
                      aria-pressed={actif}
                      className={`px-3.5 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                        actif
                          ? 'border-sv-primary bg-sv-primary/10 text-ink font-semibold'
                          : 'border-border text-ink-secondary hover:border-sv-primary/60'
                      }`}
                    >
                      {v.libelle}
                    </button>
                  );
                })}
              </div>
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
