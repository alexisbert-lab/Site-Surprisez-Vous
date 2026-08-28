'use client';

import type { AvecRef, Variante } from '@/lib/declinaisons';

/**
 * Les membres d'un article décliné, un par ligne, avec la description de chacun.
 *
 * La rangée de pastilles d'origine obligeait à cliquer sur chaque variante pour
 * savoir ce qui les distingue au-delà de la couleur. Ici tout se lit d'un coup, et
 * la ligne active reste dans la liste : on change de référence sans la perdre de vue.
 */
export default function ListeDeclinaisons<P extends AvecRef>({
  variantes,
  refSel,
  onSelect,
  titre,
  pastilles,
}: {
  variantes: Variante<P>[];
  refSel: string;
  onSelect: (ref: string) => void;
  titre: string;
  pastilles: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink mb-2">{titre}</p>
      <div className="flex flex-col gap-1.5">
        {variantes.map((v) => {
          const ref = v.produit.pdt_reference;
          const actif = ref === refSel;
          return (
            <button
              key={ref}
              onClick={() => onSelect(ref)}
              aria-pressed={actif}
              className={`w-full flex items-start gap-3 text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                actif
                  ? 'border-sv-primary bg-sv-primary/5'
                  : 'border-border hover:border-sv-primary/60'
              }`}
            >
              {pastilles && (
                <span
                  className="w-5 h-5 rounded-full border border-border shrink-0 mt-0.5"
                  style={{ background: v.teinte }}
                />
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2 flex-wrap">
                  <span className={`text-sm text-ink ${actif ? 'font-semibold' : ''}`}>
                    {v.libelle}
                  </span>
                  <span className="text-xs text-ink-secondary font-mono">{ref}</span>
                </span>
                {v.description && (
                  <span className="block text-xs text-ink-secondary leading-snug mt-0.5">
                    {v.description}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
