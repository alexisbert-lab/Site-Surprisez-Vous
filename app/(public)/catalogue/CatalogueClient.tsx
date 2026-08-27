'use client';

import { useState, useMemo, useEffect, useRef, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { filterArticlesVisiblesWithStatCats, type PublicProduct } from '@/lib/firestore/products';
import { type StatCategory } from '@/lib/firestore/stat-categories';
import { type Marque } from '@/lib/firestore/marques';
import {
  type AttributeDef, type AttributeValue, type ProductAttributes,
} from '@/lib/firestore/attributes';
import {
  buildRegistry, valeursDe, libelleDe, teinteDe, selectionVide, correspond, compte,
  bascule, selectionVersParams, paramsVersSelection, type Selection, type Registry,
} from '@/lib/attributes';
import { grouper, type Groupe } from '@/lib/declinaisons';
import MenuRayons from '@/components/catalogue/MenuRayons';
import { ProductImage } from '@/components/ui/ProductImage';
import Link from 'next/link';
import { X } from 'lucide-react';

interface Props {
  products: PublicProduct[];
  statCategories: StatCategory[];
  marques: Marque[];
  productMarques: Record<string, string>;
  attributeDefs: AttributeDef[];
  attributeValues: AttributeValue[];
  productAttributes: Record<string, ProductAttributes>;
}

/** Nombre de pastilles montrées sur une carte avant de basculer sur un « +n ». */
const PASTILLES_CARTE = 6;

// memo : sans lui, chaque lot chargé re-rendait toutes les cartes déjà montées.
const GroupeCard = memo(function GroupeCard({ groupe, onSelect }: {
  groupe: Groupe<PublicProduct>;
  onSelect: (g: Groupe<PublicProduct>) => void;
}) {
  const { chef, variantes, axe } = groupe;
  const enPastilles = axe?.rendu === 'pastille';
  return (
    <button
      onClick={() => onSelect(groupe)}
      className="bg-white border border-border rounded-xl overflow-hidden flex flex-col text-left hover:shadow-md hover:border-sv-primary/60 transition-all cursor-pointer"
    >
      <div className="aspect-square bg-sv-grey-light flex items-center justify-center overflow-hidden">
        <ProductImage imageRef={chef.pdt_reference} className="w-full h-full object-contain p-2" />
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="text-xs text-ink-secondary font-mono">{chef.pdt_reference}</p>
        <p className="text-sm font-semibold text-ink leading-tight line-clamp-2">{chef.pdt_designation}</p>
        {variantes.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {enPastilles ? (
              <>
                {variantes.slice(0, PASTILLES_CARTE).map((v) => (
                  <span
                    key={v.produit.pdt_reference}
                    title={v.libelle}
                    className="w-4 h-4 rounded-full border border-border shrink-0"
                    style={{ background: v.teinte }}
                  />
                ))}
                {variantes.length > PASTILLES_CARTE && (
                  <span className="text-xs text-ink-secondary">+{variantes.length - PASTILLES_CARTE}</span>
                )}
              </>
            ) : (
              <span className="text-xs text-ink-secondary">{variantes.length} déclinaisons</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
});

const BATCH = 48;
/** Distance au bas de page à partir de laquelle on charge le lot suivant. */
const MARGE = 1400;

/**
 * Grille produits à révélation progressive — monter 2700 cartes d'un coup fige l'onglet.
 *
 * Le déclencheur est la distance au bas du document, pas une sentinelle observée :
 * une sentinelle dépassée d'un coup de molette sort du champ de l'observateur et
 * le chargement s'arrête net, la grille se terminant en plein milieu du catalogue.
 */
function ProductGrid({ groupes, onSelect }: {
  groupes: Groupe<PublicProduct>[];
  onSelect: (g: Groupe<PublicProduct>) => void;
}) {
  const [limit, setLimit] = useState(BATCH);

  // Sur le nombre de résultats, pas sur l'identité du tableau : `router.replace`
  // recrée les props côté serveur et remettait la grille à 48 en plein défilement.
  useEffect(() => { setLimit(BATCH); }, [groupes.length]);

  useEffect(() => {
    if (limit >= groupes.length) return;
    let frame = 0;
    const verifier = () => {
      frame = 0;
      const reste = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      if (reste < MARGE) setLimit((l) => Math.min(l + BATCH, groupes.length));
    };
    const planifier = () => { if (!frame) frame = requestAnimationFrame(verifier); };
    window.addEventListener('scroll', planifier, { passive: true });
    window.addEventListener('resize', planifier);
    // Un lot qui ne remplit pas l'écran doit en appeler un autre sans attendre de geste.
    planifier();
    return () => {
      window.removeEventListener('scroll', planifier);
      window.removeEventListener('resize', planifier);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [limit, groupes.length]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {groupes.slice(0, limit).map((g) => (
          <GroupeCard key={g.clef} groupe={g} onSelect={onSelect} />
        ))}
      </div>
      {limit < groupes.length && (
        <p className="text-center text-sm text-ink-secondary py-8">
          {limit} sur {groupes.length} articles…
        </p>
      )}
    </>
  );
}

/** Modale plein écran : toutes les zones du registre, y compris `fiche` qui n'existe qu'ici. */
function FicheProduit({ groupe, reg, onClose }: {
  groupe: Groupe<PublicProduct>;
  reg: Registry;
  onClose: () => void;
}) {
  // La modale est montée avec une `key` sur le groupe : changer d'article la remonte,
  // donc la variante repart toujours du chef.
  const [refSel, setRefSel] = useState(groupe.chef.pdt_reference);
  const variante =
    groupe.variantes.find((v) => v.produit.pdt_reference === refSel) ?? groupe.variantes[0];
  const produit = variante.produit;
  const attrs = variante.attrs;

  // Escape ferme, et le fond ne défile pas sous la modale.
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', surTouche);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', surTouche);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const ligne = (def: AttributeDef) => {
    const brut = attrs?.[def.cle];
    const vals = (Array.isArray(brut) ? brut : brut ? [brut] : []).filter(Boolean);
    return (
      <div key={def.cle} className="grid grid-cols-[130px_1fr] gap-4 py-2.5 border-b border-border/60 last:border-0">
        <dt className="text-sm font-semibold text-ink">{def.libelle}</dt>
        <dd className="text-sm text-ink-secondary">
          {vals.length ? vals.map((v) => libelleDe(reg, def.cle, v)).join(', ') : '—'}
        </dd>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-8"
      // Le header est à 300 : la modale doit passer au-dessus.
      style={{ zIndex: 400, backdropFilter: 'blur(2px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={produit.pdt_designation}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"
      >
        <div className="h-0.75 shrink-0" style={{ background: 'linear-gradient(90deg,#E8185A,#F5A623,#3DBDB0)' }} />

        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-5 right-5 z-10 w-9 h-9 bg-white/90 border border-border rounded-full flex items-center justify-center hover:bg-sv-grey-light hover:border-sv-primary transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="grid md:grid-cols-2 overflow-y-auto">
          <div className="bg-sv-grey-light flex items-center justify-center p-6 md:p-10 md:h-full md:min-h-125">
            <ProductImage
              imageRef={produit.pdt_reference}
              className="w-full h-full max-h-100 object-contain"
            />
          </div>

          <div className="p-6 md:p-9">
            <p className="text-xs text-ink-secondary font-mono">{produit.pdt_reference}</p>
            <h2 className="text-2xl font-extrabold text-ink leading-tight mt-1.5 font-[family-name:var(--font-heading)]">
              {produit.pdt_designation}
            </h2>
            {attrs?.description_courte && (
              <p className="text-base text-ink-secondary mt-4 leading-relaxed">{attrs.description_courte}</p>
            )}

            {groupe.variantes.length > 1 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-ink mb-2">
                  {groupe.axe?.libelle ?? 'Déclinaisons'}
                  <span className="font-normal text-ink-secondary"> · {variante.libelle}</span>
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {groupe.variantes.map((v) => {
                    const actif = v.produit.pdt_reference === refSel;
                    return groupe.axe?.rendu === 'pastille' ? (
                      <button
                        key={v.produit.pdt_reference}
                        onClick={() => setRefSel(v.produit.pdt_reference)}
                        title={v.libelle}
                        aria-label={v.libelle}
                        aria-pressed={actif}
                        className={`w-8 h-8 rounded-full border-2 transition-colors cursor-pointer ${
                          actif ? 'border-sv-primary' : 'border-border hover:border-sv-primary/60'
                        }`}
                        style={{ background: v.teinte }}
                      />
                    ) : (
                      <button
                        key={v.produit.pdt_reference}
                        onClick={() => setRefSel(v.produit.pdt_reference)}
                        aria-pressed={actif}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
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

            {attrs ? (
              <dl className="mt-7">
                <div className="grid grid-cols-[130px_1fr] gap-4 py-2.5 border-b border-border/60">
                  <dt className="text-sm font-semibold text-ink">Rayon</dt>
                  <dd className="text-sm text-ink-secondary">
                    {libelleDe(reg, reg.cleCategorie, attrs[reg.cleCategorie] as string)}
                    {' › '}
                    {libelleDe(reg, reg.cleSousCategorie, attrs[reg.cleSousCategorie] as string)}
                  </dd>
                </div>
                {[...reg.tete, ...reg.lat, ...reg.fiche].map(ligne)}
              </dl>
            ) : (
              <p className="text-sm text-ink-secondary italic mt-6">
                Cet article n&apos;est pas encore décrit dans le référentiel produits.
              </p>
            )}

            {variante.seoSlug && (
              <Link
                href={`/produit/${variante.seoSlug}`}
                className="inline-block mt-7 text-sm font-semibold text-sv-primary hover:underline"
              >
                Voir la fiche complète →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CatalogueClient({
  products, statCategories, marques, productMarques,
  attributeDefs, attributeValues, productAttributes,
}: Props) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && (profile?.role === 'pro' || profile?.role === 'admin')) {
      router.replace('/pro/catalogue');
    }
  }, [loading, profile, router]);

  const reg = useMemo(() => buildRegistry(attributeDefs, attributeValues), [attributeDefs, attributeValues]);

  const [selection, setSelection] = useState<Selection>(() =>
    paramsVersSelection(reg, new URLSearchParams(searchParams.toString()))
  );
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  // La recherche se fait dans le header, qui pousse /catalogue?q=… sans remonter
  // ce composant : sans cette synchro, l'effet d'URL ci-dessous effacerait le terme.
  const qUrl = searchParams.get('q') ?? '';
  useEffect(() => { setSearch((s) => (s === qUrl ? s : qUrl)); }, [qUrl]);
  // La marque ne vient pas du classeur : c'est une donnée du site, filtrée comme une facette.
  const [marqueSel, setMarqueSel] = useState<string[]>(() => {
    const brut = searchParams.get('marque');
    return brut ? brut.split('|').filter(Boolean) : [];
  });
  // Onglet ouvert dans la bande de tête ; null = le premier selon `ordre` du registre.
  const [ongletTete, setOngletTete] = useState<string | null>(null);
  const [fiche, setFiche] = useState<Groupe<PublicProduct> | null>(null);

  // L'état des filtres vit dans l'URL : un tri se partage et Précédent fonctionne.
  useEffect(() => {
    const params = selectionVersParams(reg, selection);
    if (marqueSel.length) params.set('marque', marqueSel.join('|'));
    if (search.trim()) params.set('q', search.trim());
    const qs = params.toString();
    router.replace(qs ? `/catalogue?${qs}` : '/catalogue', { scroll: false });
  }, [selection, marqueSel, search, reg, router]);

  // Visibilité ERP : état article, code stat inactif, exception individuelle. Toujours en premier.
  const visibleProducts = useMemo(
    () => filterArticlesVisiblesWithStatCats(products, statCategories),
    [products, statCategories]
  );

  // Un article décliné ne doit occuper qu'une carte et ne compter qu'une fois dans les
  // facettes. Tout ce qui suit raisonne donc en groupes, jamais en références.
  const groupesVisibles = useMemo(
    () => grouper(visibleProducts, productAttributes, reg),
    [visibleProducts, productAttributes, reg]
  );

  const listeAttrs = useMemo(() => groupesVisibles.map((g) => g.fusion), [groupesVisibles]);

  const registreActif = useMemo(
    () => Object.values(selection).some((v) => (Array.isArray(v) ? v.length > 0 : Boolean(v))),
    [selection]
  );

  // Un groupe passe dès qu'un de ses membres passe : filtrer sur « rose gold » doit
  // ramener l'article disponible en rose gold, pas seulement celui dont c'est la couleur
  // canonique. Les attributs fusionnés portent déjà l'union, le registre s'y applique tel quel.
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groupesVisibles.filter((g) => {
      if (q && !g.membres.some((p) =>
        p.pdt_reference?.toLowerCase().includes(q) ||
        p.pdt_designation?.toLowerCase().includes(q) ||
        p.pdt_ean?.toLowerCase().includes(q)
      )) return false;
      if (marqueSel.length &&
        !g.membres.some((p) => marqueSel.includes(productMarques[p.pdt_reference]))) return false;
      // Sans filtre du registre, tout le catalogue reste visible : le classeur ne couvre pas
      // encore toutes les références, et les articles non décrits ne doivent pas disparaître.
      if (!registreActif) return true;
      return correspond(g.fusion, selection);
    });
  }, [groupesVisibles, search, marqueSel, productMarques, registreActif, selection]);

  // Comptée sans la sélection de marque, sinon cocher une marque ramènerait les autres à zéro.
  const marquesActives = useMemo(
    () => marques
      .filter((m) => m.actif)
      .map((m) => ({
        m,
        n: groupesVisibles.filter((g) =>
          g.membres.some((p) => productMarques[p.pdt_reference] === m.id) &&
          (!registreActif || correspond(g.fusion, selection))
        ).length,
      }))
      .filter((o) => o.n > 0)
      .sort((a, b) => a.m.nom.localeCompare(b.m.nom, 'fr')),
    [marques, groupesVisibles, productMarques, registreActif, selection]
  );

  const basculeMarque = (id: string) =>
    setMarqueSel((s) => (s.includes(id) ? s.filter((v) => v !== id) : [...s, id]));

  const clesMenu = useMemo(() => reg.menu.map((a) => a.cle), [reg]);
  const catSelect = selection[reg.cleCategorie] as string | null;
  const sousCatSelect = selection[reg.cleSousCategorie] as string | null;

  const choisirRayon = (cat: string | null, sousCat: string | null) =>
    setSelection((s) => ({ ...s, [reg.cleCategorie]: cat, [reg.cleSousCategorie]: sousCat }));

  // Compté sans les clés du menu, sinon le rayon courant écraserait les autres.
  const compteursSousCat = useMemo(() => {
    const out: Record<string, number> = {};
    valeursDe(reg, reg.cleSousCategorie).forEach((sc) => {
      out[sc.slug] = compte(listeAttrs, selection, reg.cleSousCategorie, sc.slug, clesMenu);
    });
    return out;
  }, [reg, listeAttrs, selection, clesMenu]);

  const resetFacettes = () => {
    setSelection((s) => {
      const next = { ...s };
      reg.facettes.forEach((a) => { next[a.cle] = []; });
      return next;
    });
    setMarqueSel([]);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-ink-secondary text-sm">
        Chargement…
      </div>
    );
  }

  // Le registre n'a pas encore été synchronisé : on ne cache pas le catalogue pour autant.
  const registrePret = reg.menu.length > 0 && reg.valeurs.length > 0;
  const colonneFiltres = registrePret || marquesActives.length > 0;

  const etiquettes: { id: string; texte: string; retirer: () => void }[] = [
    ...reg.facettes.flatMap((a) =>
      ((selection[a.cle] as string[]) ?? []).map((slug) => ({
        id: `${a.cle}-${slug}`,
        texte: libelleDe(reg, a.cle, slug),
        retirer: () => setSelection((s) => bascule(s, a.cle, slug)),
      }))
    ),
    ...marqueSel.map((id) => ({
      id: `marque-${id}`,
      texte: marques.find((m) => m.id === id)?.nom ?? id,
      retirer: () => basculeMarque(id),
    })),
    // Le champ de recherche est dans le header : sans étiquette, rien ne
    // signalerait le terme actif ni ne permettrait de le retirer.
    ...(search.trim()
      ? [{ id: 'recherche', texte: `« ${search.trim()} »`, retirer: () => setSearch('') }]
      : []),
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-sv-primary mb-2 font-[family-name:var(--font-heading)]">
        Notre Catalogue
      </h1>
      <p className="text-ink-secondary mb-6">
        Choisissez un rayon, une occasion, une ambiance — ou cherchez directement.
      </p>

      {registrePret && (
        <>
          {/* ── Zone menu : rayons du référentiel, catégorie › sous-catégorie ── */}
          <MenuRayons
            reg={reg}
            compteurs={compteursSousCat}
            variante="bandeau"
            actif={{ categorie: catSelect, sousCategorie: sousCatSelect }}
            onChoisir={choisirRayon}
          />

          {/* ── Zone filtre_tete : une bande, un onglet par attribut mis en avant ──
              Le registre en place trois (univers, occasion, thème). Empilés, ils
              repousseraient les produits hors de l'écran : ils partagent une bande. */}
          {reg.tete.length > 0 && (() => {
            const actif = reg.tete.find((a) => a.cle === ongletTete) ?? reg.tete[0];
            const options = valeursDe(reg, actif.cle, '')
              .map((v) => ({ v, n: compte(listeAttrs, selection, actif.cle, v.slug) }))
              .filter((o) => o.n > 0);
            const choisies = (selection[actif.cle] as string[]) ?? [];
            return (
              <section className="mb-6">
                <div className="flex gap-1 bg-sv-grey-light rounded-xl p-1 w-fit mb-4">
                  {reg.tete.map((a) => {
                    const nSel = ((selection[a.cle] as string[]) ?? []).length;
                    const on = a.cle === actif.cle;
                    return (
                      <button
                        key={a.cle}
                        onClick={() => setOngletTete(a.cle)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                          on ? 'bg-white text-sv-primary shadow-sm' : 'text-ink-secondary hover:text-ink'
                        }`}
                      >
                        {a.libelle}
                        {/* Ce qui est coché dans un onglet fermé reste signalé : rien ne se perd. */}
                        {nSel > 0 && (
                          <span className="bg-sv-primary text-white text-xs font-bold rounded-full px-1.5">{nSel}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {options.map(({ v, n }) => {
                    const on = choisies.includes(v.slug);
                    return (
                      <button
                        key={v.slug}
                        onClick={() => setSelection((s) => bascule(s, actif.cle, v.slug))}
                        className={`shrink-0 w-44 text-left border rounded-xl p-3.5 transition-all cursor-pointer ${
                          on
                            ? 'bg-sv-primary text-white border-sv-primary'
                            : 'bg-white border-border hover:border-sv-primary/60 hover:shadow-md'
                        }`}
                      >
                        <p className="font-bold text-sm leading-tight">{v.libelle}</p>
                        <p className={`text-xs mt-0.5 ${on ? 'text-white/70' : 'text-ink-secondary'}`}>
                          {n} article{n > 1 ? 's' : ''}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })()}
        </>
      )}

      {/* ── Fil d'Ariane : position dans l'arborescence des rayons ── */}
      {registrePret && catSelect && (
        <nav className="text-sm text-ink-secondary mb-5 flex items-center gap-2">
          <button onClick={() => choisirRayon(null, null)} className="hover:underline cursor-pointer">
            Tous les rayons
          </button>
          <span className="text-border">›</span>
          {sousCatSelect ? (
            <>
              <button
                onClick={() => choisirRayon(catSelect, null)}
                className="hover:underline cursor-pointer"
              >
                {libelleDe(reg, reg.cleCategorie, catSelect)}
              </button>
              <span className="text-border">›</span>
              <span className="font-bold text-ink">{libelleDe(reg, reg.cleSousCategorie, sousCatSelect)}</span>
            </>
          ) : (
            <span className="font-bold text-ink">{libelleDe(reg, reg.cleCategorie, catSelect)}</span>
          )}
        </nav>
      )}

      <div className="grid md:grid-cols-[220px_1fr] gap-8 items-start">
        {/* ── Zone filtre_attr : facettes en colonne ── */}
        {colonneFiltres && (
          <aside className="hidden md:block border border-border rounded-xl px-4 py-2 sticky top-4">
            <div className="flex items-center justify-between py-2.5 border-b border-border">
              <strong className="text-sm text-ink">Filtrer</strong>
              <button onClick={resetFacettes} className="text-xs text-ink-secondary underline cursor-pointer">
                Réinitialiser
              </button>
            </div>
            {reg.lat.map((def, i) => {
              const options = valeursDe(reg, def.cle, '')
                .map((v) => ({ v, n: compte(listeAttrs, selection, def.cle, v.slug) }))
                .filter((o) => o.n > 0);
              const choisies = (selection[def.cle] as string[]) ?? [];
              return (
                <details key={def.cle} open={i === 0} className="border-b border-border/60 last:border-0 py-2.5">
                  <summary className="text-xs font-bold uppercase tracking-wide text-ink cursor-pointer">
                    {def.libelle}
                  </summary>
                  {options.length === 0 ? (
                    <p className="text-xs text-ink-secondary italic mt-1.5">—</p>
                  ) : (
                    options.map(({ v, n }) => {
                      const on = choisies.includes(v.slug);
                      return (
                        <button
                          key={v.slug}
                          onClick={() => setSelection((s) => bascule(s, def.cle, v.slug))}
                          className="w-full flex items-center gap-2 py-1.5 text-sm text-left cursor-pointer"
                        >
                          {def.rendu === 'pastille' ? (
                            <span
                              className={`w-3.5 h-3.5 rounded-full border border-border shrink-0 ${on ? 'ring-2 ring-sv-primary ring-offset-1' : ''}`}
                              style={{ background: teinteDe(reg, def.cle, v.slug) }}
                            />
                          ) : (
                            <span className={`w-3.5 h-3.5 rounded border shrink-0 ${on ? 'bg-sv-primary border-sv-primary' : 'border-ink-secondary/50'}`} />
                          )}
                          <span className={`flex-1 ${on ? 'font-bold text-ink' : 'text-ink-secondary'}`}>{v.libelle}</span>
                          <span className="text-xs text-ink-secondary/70">{n}</span>
                        </button>
                      );
                    })
                  )}
                </details>
              );
            })}

            {/* La marque ne figure pas au registre : c'est une donnée propre au site. */}
            {marquesActives.length > 0 && (
              <details open={reg.lat.length === 0} className="border-b border-border/60 last:border-0 py-2.5">
                <summary className="text-xs font-bold uppercase tracking-wide text-ink cursor-pointer">
                  Marque
                </summary>
                {marquesActives.map(({ m, n }) => {
                  const on = marqueSel.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => basculeMarque(m.id)}
                      className="w-full flex items-center gap-2 py-1.5 text-sm text-left cursor-pointer"
                    >
                      <span className={`w-3.5 h-3.5 rounded border shrink-0 ${on ? 'bg-sv-primary border-sv-primary' : 'border-ink-secondary/50'}`} />
                      <span className={`flex-1 ${on ? 'font-bold text-ink' : 'text-ink-secondary'}`}>{m.nom}</span>
                      <span className="text-xs text-ink-secondary/70">{n}</span>
                    </button>
                  );
                })}
              </details>
            )}
          </aside>
        )}

        <main className={colonneFiltres ? '' : 'md:col-span-2'}>
          <div className="flex items-center gap-3 flex-wrap mb-5">
            <h2 className="text-lg font-bold text-ink">
              {displayed.length} article{displayed.length !== 1 ? 's' : ''}
            </h2>
            {etiquettes.map((t) => (
              <button
                key={t.id}
                onClick={t.retirer}
                className="flex items-center gap-1.5 bg-sv-primary text-white text-xs font-semibold pl-3 pr-2 py-1 rounded-full cursor-pointer"
              >
                {t.texte}
                <X size={12} />
              </button>
            ))}
          </div>

          {displayed.length > 0 ? (
            <ProductGrid groupes={displayed} onSelect={setFiche} />
          ) : (
            <p className="text-ink-secondary text-sm italic">
              Aucun article pour cette combinaison. Retirez un filtre pour élargir la recherche.
            </p>
          )}
        </main>
      </div>

      {fiche && (
        <FicheProduit
          key={fiche.clef}
          groupe={fiche}
          reg={reg}
          onClose={() => setFiche(null)}
        />
      )}

      {/* CTA espace pro */}
      {!profile && (
        <div className="mt-16 bg-sv-primary-light rounded-2xl p-8 text-center">
          <p className="text-sv-primary font-semibold text-lg mb-2">Vous êtes professionnel ?</p>
          <p className="text-ink-secondary text-sm mb-5">
            Accédez à l&apos;ensemble du catalogue avec vos tarifs personnalisés, gérez vos commandes et paniers.
          </p>
          <Link
            href="/pro/connexion"
            className="inline-block bg-sv-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-sv-primary-dark transition-colors"
          >
            Accéder à l&apos;espace pro
          </Link>
        </div>
      )}
    </div>
  );
}
