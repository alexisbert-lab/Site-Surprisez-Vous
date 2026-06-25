'use client';

import { useState, useEffect, useMemo } from 'react';
import { type TarifGrid, type TarifLine } from '@/lib/firestore/tarifs';
import { type Product } from '@/lib/firestore/products';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { thClass, tdClass, btnPrimSm, btnSecSm, inputSm, selectClass } from '@/lib/admin-styles';

export default function AdminTarifsPage() {
  const [grids, setGrids] = useState<TarifGrid[]>([]);
  const [selectedGridId, setSelectedGridId] = useState<string>('');
  const [lines, setLines] = useState<TarifLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [compareGridId, setCompareGridId] = useState<string>('');
  const [compareLines, setCompareLines] = useState<Map<string, TarifLine>>(new Map());
  const [loadingGrids, setLoadingGrids] = useState(true);
  const [loadingLines, setLoadingLines] = useState(false);
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  // Chargement initial des grilles et des produits
  useEffect(() => {
    if (!user) return;
    user.getIdToken()
      .then((t) => Promise.all([api.getTarifGrids(t), api.getProducts()]))
      .then(([g, p]) => {
        setGrids(g.sort((a, b) => a.nom.localeCompare(b.nom)));
        setProducts(p);
        if (g.length > 0) setSelectedGridId(g[0].id);
      })
      .finally(() => setLoadingGrids(false));
  }, [user]);

  // Chargement des lignes de la grille sélectionnée
  useEffect(() => {
    if (!selectedGridId || !user) return;
    setLoadingLines(true);
    user.getIdToken()
      .then((t) => api.getTarifLines(selectedGridId, t))
      .then(setLines)
      .finally(() => setLoadingLines(false));
  }, [selectedGridId, user]);

  // Chargement des lignes de la grille de comparaison
  useEffect(() => {
    if (!compareGridId || !user) { setCompareLines(new Map()); return; }
    user.getIdToken()
      .then((t) => api.getTarifLines(compareGridId, t))
      .then((l) => setCompareLines(new Map(l.map((x) => [x.ref, x]))));
  }, [compareGridId, user]);

  const productMap = useMemo(() => new Map(products.map((p) => [p.pdt_reference, p])), [products]);

  const filtered = useMemo(() => {
    if (!search) return lines;
    const q = search.toLowerCase();
    return lines.filter((l) => l.ref.toLowerCase().includes(q) || l.designation.toLowerCase().includes(q));
  }, [lines, search]);

  const selectedGrid = grids.find((g) => g.id === selectedGridId);
  const compareGrid = grids.find((g) => g.id === compareGridId);

  if (loadingGrids) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-2 border-sv-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-ink-secondary">Chargement des grilles tarifaires...</p>
      </div>
    );
  }

  if (grids.length === 0) {
    return (
      <div className="text-center py-16 text-ink-secondary">
        <p>Aucune grille tarifaire trouvée dans Firestore.</p>
        <p className="text-sm mt-1">Importez des grilles via les Cloud Functions.</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold mb-1 text-sv-primary font-[family-name:var(--font-heading)]">Grilles tarifaires</h1>
      <p className="text-sm text-ink-secondary mb-5">{grids.length} grille(s) disponible(s)</p>

      {/* Sélecteurs */}
      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">Grille à afficher</label>
          <select
            value={selectedGridId}
            onChange={(e) => setSelectedGridId(e.target.value)}
            className={selectClass}
          >
            {grids.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nom} ({g.id}) — {g.lignes_count ?? '?'} lignes
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">Comparer avec</label>
          <select
            value={compareGridId}
            onChange={(e) => setCompareGridId(e.target.value)}
            className={selectClass}
          >
            <option value="">— Aucune comparaison —</option>
            {grids.filter((g) => g.id !== selectedGridId).map((g) => (
              <option key={g.id} value={g.id}>
                {g.nom} ({g.id})
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Rechercher référence / désignation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputSm + ' max-w-xs'}
        />
      </div>

      {/* Méta-infos grille */}
      {selectedGrid && (
        <div className="flex flex-wrap gap-3 mb-4">
          <GridBadge grid={selectedGrid} />
          {compareGrid && <GridBadge grid={compareGrid} variant="compare" />}
        </div>
      )}

      {/* Tableau */}
      {loadingLines ? (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-sv-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-ink-secondary">Chargement des lignes...</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-secondary mb-2">{filtered.length} article(s){search ? ' trouvés' : ''}</p>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-sv-grey-light">
                    <th className={thClass}>Référence</th>
                    <th className={thClass}>Désignation</th>
                    <th className={thClass}>Colisage</th>
                    <th className={thClass + ' text-right'}>
                      Prix HT {selectedGrid ? `(${selectedGrid.nom})` : ''}
                    </th>
                    {compareGridId && (
                      <th className={thClass + ' text-right bg-blue-50'}>
                        Prix HT {compareGrid ? `(${compareGrid.nom})` : '(Comparaison)'}
                      </th>
                    )}
                    {compareGridId && (
                      <th className={thClass + ' text-right bg-blue-50'}>Écart</th>
                    )}
                    <th className={thClass + ' text-right'}>Prix produit</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((line) => {
                    const compareLine = compareLines.get(line.ref);
                    const productPrice = productMap.get(line.ref)?.prix_vente;
                    const diff = compareGridId && compareLine != null
                      ? line.prix_ht - compareLine.prix_ht
                      : null;

                    return (
                      <tr key={line.ref} className="border-b border-border/50 hover:bg-sv-grey-light/50">
                        <td className={tdClass + ' font-mono text-xs font-semibold'}>{line.ref}</td>
                        <td className={tdClass + ' max-w-xs truncate text-xs'}>{line.designation}</td>
                        <td className={tdClass + ' text-center'}>{line.colisage}</td>
                        <td className={tdClass + ' text-right font-semibold text-sv-primary'}>
                          {line.prix_ht === 0
                            ? <span className="text-red-500 font-bold">0,00 €</span>
                            : `${line.prix_ht.toFixed(2)} €`}
                        </td>
                        {compareGridId && (
                          <td className={tdClass + ' text-right bg-blue-50/30'}>
                            {compareLine != null
                              ? compareLine.prix_ht === 0
                                ? <span className="text-red-500 font-bold">0,00 €</span>
                                : `${compareLine.prix_ht.toFixed(2)} €`
                              : <span className="text-ink-secondary italic text-xs">—</span>}
                          </td>
                        )}
                        {compareGridId && (
                          <td className={tdClass + ' text-right bg-blue-50/30 font-mono text-xs'}>
                            {diff != null ? (
                              <span className={diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-ink-secondary'}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(2)} €
                              </span>
                            ) : <span className="text-ink-secondary">—</span>}
                          </td>
                        )}
                        <td className={tdClass + ' text-right text-xs text-ink-secondary'}>
                          {productPrice != null ? `${productPrice.toFixed(2)} €` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function GridBadge({ grid, variant = 'primary' }: { grid: TarifGrid; variant?: 'primary' | 'compare' }) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700 border-green-200',
    brouillon: 'bg-orange-100 text-orange-700 border-orange-200',
    archivee: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const statusLabels: Record<string, string> = {
    active: 'Active',
    brouillon: 'Brouillon',
    archivee: 'Archivée',
  };
  const base = variant === 'compare' ? 'bg-blue-50 border-blue-200' : 'bg-surface border-border';
  return (
    <div className={`inline-flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${base}`}>
      <span className="font-semibold text-ink">{grid.nom}</span>
      <span className="font-mono text-xs text-ink-secondary">{grid.id}</span>
      {grid.profil_id && <span className="text-xs text-ink-secondary">Profil : <strong>{grid.profil_id}</strong></span>}
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusColors[grid.statut] || 'bg-gray-100 text-gray-500'}`}>
        {statusLabels[grid.statut] || grid.statut}
      </span>
      <span className="text-xs text-ink-secondary">{grid.date_import}</span>
    </div>
  );
}
