'use client';

import { useState, useEffect, useMemo } from 'react';
import { getProducts, filterArticlesVisibles, isEnRupture, isStockFaible, type Product } from '@/lib/firestore/products';
import { getStatCategories, type StatCategory } from '@/lib/firestore/stat-categories';
import { getStockSettings } from '@/lib/firestore/settings';
import { cachedFetch } from '@/lib/admin-cache';
import Badge from '@/components/ui/Badge';
import { thClass, tdClass, btnPrimSm, btnSecSm } from '@/lib/admin-styles';

type TreeNode = StatCategory & { children: TreeNode[] };

function buildTree(cats: StatCategory[]): TreeNode[] {
  const niveau1 = cats.filter((c) => c.niveau === 1).sort((a, b) => a.code.localeCompare(b.code));
  return niveau1.map((n1) => {
    const children2 = cats.filter((c) => c.niveau === 2 && c.parent === n1.code).sort((a, b) => a.code.localeCompare(b.code));
    return {
      ...n1,
      children: children2.map((n2) => ({
        ...n2,
        children: cats.filter((c) => c.niveau === 3 && c.parent === n2.code).sort((a, b) => a.code.localeCompare(b.code)).map((n3) => ({ ...n3, children: [] })),
      })),
    };
  });
}


export default function RepartitionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [statCats, setStatCats] = useState<StatCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [seuilStockFaible, setSeuilStockFaible] = useState(20);

  useEffect(() => {
    Promise.all([
      cachedFetch('repartition-products', () => getProducts()),
      cachedFetch('repartition-stat-cats', () => getStatCategories()),
      cachedFetch('repartition-stock-settings', () => getStockSettings()),
    ])
      .then(([prods, cats, stockSettings]) => {
        setProducts(filterArticlesVisibles(prods));
        setStatCats(cats);
        setSeuilStockFaible(stockSettings.seuil_stock_faible);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const tree = useMemo(() => buildTree(statCats), [statCats]);

  const matchedProducts = useMemo(() => {
    if (!selectedCode) return products;
    return products.filter((p) => (p.pdt_code_stat || '').toUpperCase().startsWith(selectedCode.toUpperCase()));
  }, [products, selectedCode]);

  const selectedNode = statCats.find((c) => c.code === selectedCode);

  const countForCode = (code: string) =>
    products.filter((p) => (p.pdt_code_stat || '').toUpperCase().startsWith(code.toUpperCase())).length;

  if (loading) return <p className="text-gray-500 italic">Chargement...</p>;

  return (
    <>
      <h1 className="text-xl font-bold mb-5">Repartition par codes statistiques</h1>

      <div className="flex gap-5 items-start">
        {/* Side menu */}
        <div className="w-[280px] flex-shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">Codes statistiques</span>
          </div>

          <div className="p-2 max-h-[calc(100vh-220px)] overflow-y-auto">
            {/* All items option */}
            <button
              onClick={() => setSelectedCode(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors cursor-pointer ${
                selectedCode === null ? 'bg-primary-light text-primary font-bold' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tous les articles <span className="text-xs text-gray-400 ml-1">({products.length})</span>
            </button>

            {tree.map((n1) => (
              <div key={n1.code} className="mb-1">
                {/* Niveau 1 — 2 lettres */}
                <button
                  onClick={() => setSelectedCode(n1.code)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-between ${
                    selectedCode === n1.code ? 'bg-primary-light text-primary font-bold' : 'text-gray-800 hover:bg-gray-100 font-semibold'
                  }`}
                >
                  <span>
                    <span className="font-mono text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded mr-2">{n1.code}</span>
                    {n1.designation}
                  </span>
                  <span className="text-xs text-gray-400">{countForCode(n1.code)}</span>
                </button>

                {n1.children.length > 0 && (
                  <div className="ml-3 border-l-2 border-gray-200 pl-1">
                    {n1.children.map((n2) => (
                      <div key={n2.code}>
                        {/* Niveau 2 — 4 lettres */}
                        <button
                          onClick={() => setSelectedCode(n2.code)}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-between ${
                            selectedCode === n2.code ? 'bg-primary-light text-primary font-bold' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>
                            <span className="font-mono text-[11px] px-1 py-0.5 bg-gray-100 rounded mr-1.5">{n2.code}</span>
                            {n2.designation}
                          </span>
                          <span className="text-xs text-gray-400">{countForCode(n2.code)}</span>
                        </button>

                        {n2.children.length > 0 && (
                          <div className="ml-3 border-l-2 border-gray-100 pl-1">
                            {n2.children.map((n3) => (
                              /* Niveau 3 — 6 lettres */
                              <button
                                key={n3.code}
                                onClick={() => setSelectedCode(n3.code)}
                                className={`w-full text-left px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                                  selectedCode === n3.code ? 'bg-primary-light text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <span>
                                  <span className="font-mono text-[10px] px-1 py-0.5 bg-gray-50 rounded mr-1.5">{n3.code}</span>
                                  {n3.designation}
                                </span>
                                <span className="text-[10px] text-gray-400">{countForCode(n3.code)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                {selectedNode ? (
                  <h2 className="text-[15px] font-bold">
                    <span className="font-mono text-sm px-2 py-0.5 bg-primary/10 text-primary rounded mr-2">{selectedNode.code}</span>
                    {selectedNode.designation}
                    <span className="ml-2 text-sm font-normal text-gray-400">Niveau {selectedNode.niveau} ({selectedNode.code.length} lettres)</span>
                  </h2>
                ) : (
                  <h2 className="text-[15px] font-bold">Tous les articles</h2>
                )}
              </div>
              <span className="text-sm text-gray-400">{matchedProducts.length} article(s)</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className={thClass}>Reference</th>
                    <th className={thClass}>Designation</th>
                    <th className={thClass}>Code stat</th>
                    <th className={thClass}>Prix vente</th>
                    <th className={thClass}>Statut stock</th>
                  </tr>
                </thead>
                <tbody>
                  {matchedProducts.map((p, i) => {
                    const rupture = isEnRupture(p);
                    const faible = isStockFaible(p, seuilStockFaible);
                    return (
                      <tr key={p.pdt_reference ?? i} className={`border-b border-gray-100 transition-colors ${rupture ? 'bg-red-50/50' : 'hover:bg-primary-light/50'}`}>
                        <td className={`${tdClass} font-mono text-xs font-semibold`}>{p.pdt_reference}</td>
                        <td className={tdClass}>
                          {p.pdt_designation}
                          {p.pdt_etat === 'N' && <span className="ml-1.5"><Badge variant="fin_de_vie">Fin de vie</Badge></span>}
                        </td>
                        <td className={`${tdClass} font-mono text-xs`}>{p.pdt_code_stat || '\u2014'}</td>
                        <td className={`${tdClass} font-mono text-xs font-semibold text-primary`}>
                          {p.prix_vente ? `${p.prix_vente.toFixed(2)} \u20ac` : '\u2014'}
                        </td>
                        <td className={tdClass}>
                          {rupture ? <Badge variant="rupture">Rupture</Badge>
                            : faible ? <Badge variant="stock_faible">Stock faible</Badge>
                            : <span className="text-emerald-600 text-xs font-semibold">OK</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {matchedProducts.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400 italic">Aucun article pour ce code statistique.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
