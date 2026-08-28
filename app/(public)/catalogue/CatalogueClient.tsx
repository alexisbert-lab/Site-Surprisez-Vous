'use client';

import { useState, useMemo, useEffect, useRef, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { filterArticlesVisiblesWithStatCats, type PublicProduct } from '@/lib/firestore/products';
import { type StatCategory } from '@/lib/firestore/stat-categories';
import { type Marque } from '@/lib/firestore/marques';
import {
  type AttributeDef, type AttributeValue, type ProductAttributes, type ProductGroup,
} from '@/lib/firestore/attributes';
import {
  buildRegistry, valeursDe, libelleDe, teinteDe, selectionVide, correspond, compte,
  bascule, selectionVersParams, paramsVersSelection, type Selection,
} from '@/lib/attributes';
import { grouper, type Groupe } from '@/lib/declinaisons';
import MenuCategories from '@/components/catalogue/MenuCategories';
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
  productGroups: Record<string, ProductGroup>;
}

/** Nombre de pastilles montrées sur une carte avant de basculer sur un « +n ». */
const PASTILLES_CARTE = 6;

// memo : sans lui, chaque lot chargé re-rendait toutes les cartes déjà montées.
const GroupeCard = memo(function GroupeCard({ groupe }: {
  groupe: Groupe<PublicProduct>;
}) {
  const { chef, devanture, variantes, axe } = groupe;
  const enPastilles = axe?.rendu === 'pastille';
  // La devanture parle pour l'article ; sans elle, le premier membre en tient lieu.
  const imageRef = devanture?.imageRef || chef.pdt_reference;
  const titre = devanture?.designation || chef.pdt_designation;
  // La carte ouvre la fiche de la devanture, sinon celle du chef de groupe. Slug vide
  // tant que la référence n'est pas décrite dans le classeur : la carte reste inerte.
  const slug =
    devanture?.seoSlug ||
    variantes.find((v) => v.produit.pdt_reference === chef.pdt_reference)?.seoSlug ||
    '';
  const classe = 'bg-surface border border-border rounded-xl overflow-hidden flex flex-col text-left transition-all';
  const contenu = (
    <>
      <div className="aspect-square bg-section-alt flex items-center justify-center overflow-hidden">
        <ProductImage imageRef={imageRef} className="w-full h-full object-contain p-2" />
      </div>
      <div className="p-3 flex flex-col gap-1">
        {/* Une devanture n'a pas de référence : afficher celle d'un membre laisserait
            croire que c'est elle qu'on commande. */}
        {!devanture && (
          <p className="text-xs text-ink-secondary font-mono">{chef.pdt_reference}</p>
        )}
        <p className="text-sm font-semibold text-ink leading-tight line-clamp-2">{titre}</p>
        {devanture?.description && (
          <p className="text-xs text-ink-secondary leading-snug line-clamp-2">{devanture.description}</p>
        )}
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
    </>
  );
  return slug ? (
    <Link
      href={`/produit/${slug}`}
      className={`${classe} hover:shadow-md hover:border-sv-primary/60 cursor-pointer`}
    >
      {contenu}
    </Link>
  ) : (
    <div className={classe}>{contenu}</div>
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
function ProductGrid({ groupes }: {
  groupes: Groupe<PublicProduct>[];
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
          <GroupeCard key={g.clef} groupe={g} />
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

export default function CatalogueClient({
  products, statCategories, marques, productMarques,
  attributeDefs, attributeValues, productAttributes, productGroups,
}: Props) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Un pro connecté n'a rien à faire sur la vitrine : ses tarifs sont sur
  // /pro/catalogue. Deux échappatoires, pour comparer les deux pages sans se
  // déconnecter : le mode développement, et `?public=1` (retenu au montage, la
  // synchro d'URL des filtres réécrit la query derrière).
  const paramPublic = useRef(searchParams.get('public') === '1').current;
  const vuePublique = process.env.NODE_ENV !== 'production' || paramPublic;

  useEffect(() => {
    if (vuePublique) return;
    if (!loading && (profile?.role === 'pro' || profile?.role === 'admin')) {
      router.replace('/pro/catalogue');
    }
  }, [vuePublique, loading, profile, router]);

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

  // L'état des filtres vit dans l'URL : un tri se partage et Précédent fonctionne.
  useEffect(() => {
    const params = selectionVersParams(reg, selection);
    if (marqueSel.length) params.set('marque', marqueSel.join('|'));
    if (search.trim()) params.set('q', search.trim());
    if (paramPublic) params.set('public', '1');
    const qs = params.toString();
    router.replace(qs ? `/catalogue?${qs}` : '/catalogue', { scroll: false });
  }, [selection, marqueSel, search, reg, router, paramPublic]);

  // Visibilité ERP : état article, code stat inactif, exception individuelle. Toujours en premier.
  const visibleProducts = useMemo(
    () => filterArticlesVisiblesWithStatCats(products, statCategories),
    [products, statCategories]
  );

  // Un article décliné ne doit occuper qu'une carte et ne compter qu'une fois dans les
  // facettes. Tout ce qui suit raisonne donc en groupes, jamais en références.
  const groupesVisibles = useMemo(
    () => grouper(visibleProducts, productAttributes, reg, productGroups),
    [visibleProducts, productAttributes, reg, productGroups]
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

  const choisirCategorie = (cat: string | null, sousCat: string | null) =>
    setSelection((s) => ({ ...s, [reg.cleCategorie]: cat, [reg.cleSousCategorie]: sousCat }));

  // Compté sans les clés du menu, sinon la catégorie courante écraserait les autres.
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
        Choisissez une catégorie, une occasion, une ambiance — ou cherchez directement.
      </p>

      {registrePret && (
        <>
          {/* ── Zone menu : catégories du référentiel, catégorie › sous-catégorie ── */}
          <MenuCategories
            reg={reg}
            compteurs={compteursSousCat}
            variante="bandeau"
            actif={{ categorie: catSelect, sousCategorie: sousCatSelect }}
            onChoisir={choisirCategorie}
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
                <div className="flex gap-1 bg-section-alt rounded-xl p-1 w-fit mb-4">
                  {reg.tete.map((a) => {
                    const nSel = ((selection[a.cle] as string[]) ?? []).length;
                    const on = a.cle === actif.cle;
                    return (
                      <button
                        key={a.cle}
                        onClick={() => setOngletTete(a.cle)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                          on ? 'bg-surface text-sv-primary shadow-sm' : 'text-ink-secondary hover:text-ink'
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
                            : 'bg-surface border-border hover:border-sv-primary/60 hover:shadow-md'
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

      {/* ── Fil d'Ariane : position dans l'arborescence des catégories ── */}
      {registrePret && catSelect && (
        <nav className="text-sm text-ink-secondary mb-5 flex items-center gap-2">
          <button onClick={() => choisirCategorie(null, null)} className="hover:underline cursor-pointer">
            Tout le catalogue
          </button>
          <span className="text-border">›</span>
          {sousCatSelect ? (
            <>
              <button
                onClick={() => choisirCategorie(catSelect, null)}
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
          <aside
            className="hidden md:block border border-border rounded-xl px-4 py-2 sticky overflow-y-auto"
            style={{
              top: 'calc(var(--sv-header-visible-h, 0px) + 16px)',
              maxHeight: 'calc(100vh - var(--sv-header-visible-h, 0px) - 32px)',
              transition: 'top 0.35s cubic-bezier(0.4,0,0.2,1), max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
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
            <ProductGrid groupes={displayed} />
          ) : (
            <p className="text-ink-secondary text-sm italic">
              Aucun article pour cette combinaison. Retirez un filtre pour élargir la recherche.
            </p>
          )}
        </main>
      </div>

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
