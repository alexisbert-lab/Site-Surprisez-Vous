'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { valeursDe, type Registry } from '@/lib/attributes';

/**
 * Méga-menu des catégories, piloté par le registre d'attributs.
 *
 * Deux emplacements, un seul rendu : `header` ouvre un panneau unique listant
 * toutes les catégories en colonnes ; `bandeau` (page catalogue) pose un onglet
 * par catégorie et n'ouvre que la colonne de la catégorie survolée.
 *
 * Sans `onChoisir`, les items sont des liens vers /catalogue — c'est la variante
 * du header, qui doit fonctionner depuis n'importe quelle page.
 */
interface Props {
  reg: Registry;
  /** Nombre de produits par slug de sous-catégorie. Absent = compteur masqué. */
  compteurs: Record<string, number>;
  variante: 'header' | 'bandeau';
  actif?: { categorie: string | null; sousCategorie: string | null };
  onChoisir?: (categorie: string | null, sousCategorie: string | null) => void;
}

const DELAI_FERMETURE = 140;

function hrefCategorie(reg: Registry, cat: string, sousCat?: string) {
  const p = new URLSearchParams({ [reg.cleCategorie]: cat });
  if (sousCat) p.set(reg.cleSousCategorie, sousCat);
  return `/catalogue?${p}`;
}

export default function MenuCategories({ reg, compteurs, variante, actif, onChoisir }: Props) {
  // header : '*' pour le panneau unique. bandeau : le slug de la catégorie ouverte.
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [epingle, setEpingle] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const racine = useRef<HTMLDivElement>(null);

  const categories = valeursDe(reg, reg.cleCategorie, '');

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOuvert(null); setEpingle(false); }
    };
    const surClic = (e: MouseEvent) => {
      if (racine.current && !racine.current.contains(e.target as Node)) {
        setOuvert(null);
        setEpingle(false);
      }
    };
    document.addEventListener('keydown', surTouche);
    document.addEventListener('mousedown', surClic);
    return () => {
      document.removeEventListener('keydown', surTouche);
      document.removeEventListener('mousedown', surClic);
    };
  }, []);

  const annuler = () => { if (timer.current) clearTimeout(timer.current); };
  const survoler = (cle: string) => { annuler(); setOuvert(cle); };
  const quitter = () => {
    annuler();
    if (!epingle) timer.current = setTimeout(() => setOuvert(null), DELAI_FERMETURE);
  };
  const basculer = (cle: string) => {
    if (ouvert === cle && epingle) { setOuvert(null); setEpingle(false); }
    else { setOuvert(cle); setEpingle(true); }
  };

  const fermer = () => { setOuvert(null); setEpingle(false); };

  /** Un item de sous-catégorie : lien dans le header, bouton sur le catalogue. */
  const item = (cat: string, sc: { slug: string; libelle: string }) => {
    const n = compteurs[sc.slug] ?? 0;
    const courant = actif?.sousCategorie === sc.slug;
    const classes = `w-full flex items-center gap-3 px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors ${
      n === 0
        ? 'text-ink-secondary/40 cursor-default pointer-events-none'
        : 'text-ink hover:bg-sv-primary-light hover:text-sv-primary cursor-pointer'
    } ${courant ? 'font-bold text-sv-primary bg-sv-primary-light' : ''}`;
    const contenu = (
      <>
        <span className="flex-1 leading-snug">{sc.libelle}</span>
        <span className="text-xs text-ink-secondary/70 tabular-nums">{n}</span>
      </>
    );
    return onChoisir ? (
      <button key={sc.slug} className={classes} disabled={n === 0}
        onClick={() => { onChoisir(cat, sc.slug); fermer(); }}>
        {contenu}
      </button>
    ) : (
      <Link key={sc.slug} href={hrefCategorie(reg, cat, sc.slug)} className={classes} onClick={fermer}>
        {contenu}
      </Link>
    );
  };

  /** En-tête de colonne : la catégorie entière, sans sous-catégorie. */
  const titreCategorie = (cat: { slug: string; libelle: string }, voirTout = false) => {
    const classes = 'flex items-center justify-between gap-4 w-full text-left text-xs font-extrabold uppercase tracking-wide text-sv-primary px-2.5 pb-2 mb-1 border-b border-border hover:opacity-70 transition-opacity cursor-pointer';
    const contenu = (
      <>
        {cat.libelle}
        {voirTout && <span className="normal-case tracking-normal font-bold">Voir tout →</span>}
      </>
    );
    return onChoisir ? (
      <button className={classes} onClick={() => { onChoisir(cat.slug, null); fermer(); }}>{contenu}</button>
    ) : (
      <Link href={hrefCategorie(reg, cat.slug)} className={classes} onClick={fermer}>{contenu}</Link>
    );
  };

  const cadre = 'absolute top-full z-40 mt-0 bg-surface rounded-b-2xl border border-t-0 border-border shadow-xl overflow-hidden';
  // Rappel du dégradé de la barre de progression : le panneau appartient au site.
  const filet = <div className="h-0.75" style={{ background: 'linear-gradient(90deg,#E8185A,#F5A623,#3DBDB0)' }} />;

  // ── Variante header : un déclencheur, un panneau, toutes les colonnes ────────
  if (variante === 'header') {
    const occasions = reg.tete[0];
    return (
      <div ref={racine} style={{ position: 'static' }} className="h-full flex items-center"
        onMouseEnter={() => survoler('*')} onMouseLeave={quitter}>
        <button
          aria-expanded={ouvert === '*'}
          aria-controls="menu-categories"
          onClick={() => basculer('*')}
          className={`flex items-center gap-1 px-3 h-full text-sm font-bold transition-colors cursor-pointer ${
            ouvert === '*' ? 'text-sv-primary' : 'text-ink hover:text-sv-primary'
          }`}
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Nos produits
          <ChevronDown size={14} className={ouvert === '*' ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>

        {ouvert === '*' && (
          <div id="menu-categories" className={`${cadre} left-6 right-6`}>
            {filet}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-6 p-6">
              {categories.map((cat) => (
                <div key={cat.slug}>
                  {titreCategorie(cat)}
                  <div className="flex flex-col">
                    {valeursDe(reg, reg.cleSousCategorie, cat.slug).map((sc) => item(cat.slug, sc))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 bg-section-alt px-6 py-3 border-t border-border">
              {occasions && (
                <>
                  <span className="text-xs font-bold uppercase tracking-wide text-ink-secondary mr-1">
                    {occasions.libelle}
                  </span>
                  {valeursDe(reg, occasions.cle, '').slice(0, 8).map((v) => (
                    <Link
                      key={v.slug}
                      href={`/catalogue?${new URLSearchParams({ [occasions.cle]: v.slug })}`}
                      onClick={fermer}
                      className="text-xs font-semibold bg-surface border border-border rounded-full px-3 py-1.5 text-ink hover:border-sv-primary hover:text-sv-primary transition-colors"
                    >
                      {v.libelle}
                    </Link>
                  ))}
                </>
              )}
              <Link href="/catalogue" onClick={fermer}
                className="ml-auto text-xs font-bold text-sv-primary hover:underline">
                Tout le catalogue →
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Variante bandeau : un onglet par catégorie, la colonne s'ouvre dessous ───
  return (
    <div ref={racine} className="relative border-y border-border mb-6">
      <ul className="flex flex-wrap">
        {categories.map((cat) => {
          const sous = valeursDe(reg, reg.cleSousCategorie, cat.slug);
          const on = actif?.categorie === cat.slug;
          return (
            <li key={cat.slug} onMouseEnter={() => survoler(cat.slug)} onMouseLeave={quitter}>
              <button
                aria-expanded={ouvert === cat.slug}
                onClick={() => (sous.length > 0 ? basculer(cat.slug) : onChoisir?.(cat.slug, null))}
                className={`flex items-center gap-1 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${
                  on
                    ? 'text-sv-primary border-sv-primary'
                    : `border-transparent ${ouvert === cat.slug ? 'text-sv-primary' : 'text-ink hover:text-sv-primary'}`
                }`}
              >
                {cat.libelle}
                {sous.length > 0 && (
                  <ChevronDown size={14} className={ouvert === cat.slug ? 'rotate-180 transition-transform' : 'transition-transform'} />
                )}
              </button>

              {ouvert === cat.slug && sous.length > 0 && (
                <div className={`${cadre} left-0 right-0 rounded-t-none`}
                  onMouseEnter={annuler} onMouseLeave={quitter}>
                  {filet}
                  <div className="p-5">
                    {titreCategorie(cat, true)}
                    {/* Colonnes CSS : l'ordre du classeur se lit de haut en bas,
                        comme dans le classeur, et non de gauche à droite. */}
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-x-4 mt-2 *:break-inside-avoid">
                      {sous.map((sc) => item(cat.slug, sc))}
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Accordéon des catégories pour le menu burger : pas de survol sur mobile. */
export function MenuCategoriesMobile({ reg, compteurs, onNaviguer }: {
  reg: Registry;
  compteurs: Record<string, number>;
  onNaviguer: () => void;
}) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  return (
    <div className="flex flex-col">
      {valeursDe(reg, reg.cleCategorie, '').map((cat) => {
        const sous = valeursDe(reg, reg.cleSousCategorie, cat.slug);
        const on = ouvert === cat.slug;
        return (
          <div key={cat.slug} className="border-b border-border last:border-b-0">
            <button
              onClick={() => setOuvert(on ? null : cat.slug)}
              aria-expanded={on}
              className="w-full flex items-center justify-between py-2.5 text-sm font-bold text-ink cursor-pointer"
            >
              {cat.libelle}
              <ChevronDown size={16} className={on ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
            {on && (
              <div className="flex flex-col pb-2">
                {sous.map((sc) => {
                  const n = compteurs[sc.slug] ?? 0;
                  return (
                    <Link
                      key={sc.slug}
                      href={hrefCategorie(reg, cat.slug, sc.slug)}
                      onClick={onNaviguer}
                      className={`flex items-center gap-3 py-1.5 pl-3 text-sm ${
                        n === 0 ? 'text-ink-secondary/40 pointer-events-none' : 'text-ink'
                      }`}
                    >
                      <span className="flex-1">{sc.libelle}</span>
                      <span className="text-xs text-ink-secondary/70 tabular-nums">{n}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
