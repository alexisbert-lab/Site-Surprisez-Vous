'use client';

import { useState, useMemo } from 'react';
import { getStatCategory, isEnRupture, isStockFaible, type Product } from '@/lib/firestore/products';
import SearchBar from '@/components/ui/SearchBar';
import Modal, { ModalTitle } from '@/components/ui/Modal';

export default function CatalogueClient({ initialProducts }: { initialProducts: Product[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStat, setFilterStat] = useState('');
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  const categories = useMemo(
    () => [...new Set(initialProducts.map((p) => getStatCategory(p.pdt_code_stat)).filter(Boolean))].sort(),
    [initialProducts]
  );

  const statCodes = useMemo(() => {
    const source = filterCat ? initialProducts.filter((p) => getStatCategory(p.pdt_code_stat) === filterCat) : initialProducts;
    return [...new Set(source.map((p) => p.pdt_code_stat).filter(Boolean))].sort();
  }, [initialProducts, filterCat]);

  const filtered = useMemo(() => {
    let result = initialProducts;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.pdt_reference?.toLowerCase().includes(q) ||
        p.pdt_designation?.toLowerCase().includes(q) ||
        p.pdt_ean?.toLowerCase().includes(q) ||
        p.pdt_code_stat?.toLowerCase().includes(q)
      );
    }
    if (filterCat) result = result.filter((p) => getStatCategory(p.pdt_code_stat) === filterCat);
    if (filterStat) result = result.filter((p) => p.pdt_code_stat === filterStat);
    return result;
  }, [initialProducts, searchQuery, filterCat, filterStat]);

  const labels: Record<string, string> = {
    pdt_reference: 'Référence', pdt_designation: 'Désignation', pdt_ean: 'EAN',
    pdt_code_stat: 'Code stat',
  };

  return (
    <>
      <h1 className="text-xl font-bold mb-5 text-sv-primary font-[family-name:var(--font-heading)]">Catalogue</h1>

      <SearchBar
        placeholder="Rechercher par référence, désignation, EAN..."
        onSearch={setSearchQuery}
        className="mb-5"
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-ink-secondary whitespace-nowrap">Catégorie :</label>
          <select
            value={filterCat}
            onChange={(e) => { setFilterCat(e.target.value); setFilterStat(''); }}
            className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sv-primary/30"
          >
            <option value="">-- Toutes --</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-ink-secondary whitespace-nowrap">Code stat :</label>
          <select
            value={filterStat}
            onChange={(e) => setFilterStat(e.target.value)}
            className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sv-primary/30"
          >
            <option value="">-- Tous --</option>
            {statCodes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-sv-orange hover:underline cursor-pointer"
            >
              Effacer la recherche
            </button>
          )}
          <span className="text-sm text-ink-secondary">{filtered.length} article(s)</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-sv-grey-light">
              <th className="text-left px-3 py-2.5 font-semibold text-ink-secondary border-b-2 border-border">Référence</th>
              <th className="text-left px-3 py-2.5 font-semibold text-ink-secondary border-b-2 border-border">Désignation</th>
              <th className="text-left px-3 py-2.5 font-semibold text-ink-secondary border-b-2 border-border">EAN</th>
              <th className="text-left px-3 py-2.5 font-semibold text-ink-secondary border-b-2 border-border">Code stat</th>
              <th className="text-left px-3 py-2.5 font-semibold text-ink-secondary border-b-2 border-border">Stock</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-ink-secondary italic">Aucun article trouvé.</td></tr>
            ) : (
              filtered.map((pdt, i) => {
                const rupture = isEnRupture(pdt);
                const faible = isStockFaible(pdt);
                return (
                  <tr key={pdt.pdt_reference ?? i} onClick={() => setModalProduct(pdt)} className={`cursor-pointer border-b border-border/50 transition-colors ${rupture ? 'bg-red-50/50' : 'hover:bg-sv-primary-light/50'}`}>
                    <td className="px-3 py-2.5 font-semibold">{pdt.pdt_reference}</td>
                    <td className="px-3 py-2.5">{pdt.pdt_designation}</td>
                    <td className="px-3 py-2.5 text-ink-secondary">{pdt.pdt_ean || '\u2014'}</td>
                    <td className="px-3 py-2.5">{pdt.pdt_code_stat || ''}</td>
                    <td className="px-3 py-2.5">
                      {rupture ? <span className="text-red-600 font-bold text-xs">Rupture</span>
                        : faible ? <span className="text-orange-600 font-bold text-xs">Stock faible</span>
                        : <span className="text-emerald-600 font-bold text-xs">En stock</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!modalProduct} onClose={() => setModalProduct(null)}>
        {modalProduct && (
          <>
            <ModalTitle>{modalProduct.pdt_designation}</ModalTitle>
            <table className="text-sm w-full">
              <tbody>
                {Object.entries(labels).map(([key, label]) => (
                  <tr key={key}>
                    <td className="py-1.5 pr-4 text-ink-secondary font-semibold whitespace-nowrap">{label}</td>
                    <td className="py-1.5">{String((modalProduct as unknown as Record<string, unknown>)[key] ?? '\u2014')}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-1.5 pr-4 text-ink-secondary font-semibold whitespace-nowrap">Catégorie</td>
                  <td className="py-1.5">{getStatCategory(modalProduct.pdt_code_stat)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </Modal>
    </>
  );
}
