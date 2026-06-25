'use client';

import { useState, useEffect, useMemo } from 'react';
import { saveMarketingItem, deleteMarketingItem, type MarketingItem, type MarketingType } from '@/lib/firestore/marketing';
import { filterArticlesVisibles, type Product } from '@/lib/firestore/products';
import { api } from '@/lib/api';
import { invalidateCached } from '@/lib/client-cache';
import Badge from '@/components/ui/Badge';
import Modal, { ModalTitle, ModalActions } from '@/components/ui/Modal';
import { btnPrimSm, btnSecSm, btnDangerSm, inputSm, cardClass } from '@/lib/admin-styles';

const TABS: { key: MarketingType; label: string }[] = [
  { key: 'coup_de_coeur', label: 'Coups de cœur' },
  { key: 'nouveaute', label: 'Nouveautés' },
  { key: 'prochainement', label: 'Prochainement' },
];

export default function AdminMarketingPage() {
  const [items, setItems] = useState<MarketingItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MarketingType>('coup_de_coeur');
  const [showModal, setShowModal] = useState(false);
  const [prodSearch, setProdSearch] = useState('');
  const [selectedProd, setSelectedProd] = useState<Product | null>(null);
  const [form, setForm] = useState({ date_debut: '', date_fin: '' });

  useEffect(() => {
    Promise.all([
      api.getMarketing(),
      api.getProducts(),
    ])
      .then(([m, p]) => { setItems(m); setProducts(filterArticlesVisibles(p)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const bustMarketing = () => {
    invalidateCached('marketing');
    api.invalidate('marketing').catch(() => {});
  };

  const tabItems = useMemo(() => items.filter((i) => i.type === activeTab).sort((a, b) => a.ordre - b.ordre), [items, activeTab]);

  const matchedProducts = useMemo(() => {
    if (!prodSearch) return [];
    const q = prodSearch.toLowerCase();
    return products.filter((p) => p.pdt_reference.toLowerCase().includes(q) || p.pdt_designation.toLowerCase().includes(q)).slice(0, 10);
  }, [products, prodSearch]);

  const handleAdd = async () => {
    if (!selectedProd) return;
    const maxOrdre = tabItems.length > 0 ? Math.max(...tabItems.map((i) => i.ordre)) : 0;
    const item: MarketingItem = {
      id: '',
      type: activeTab,
      ref_produit: selectedProd.pdt_reference,
      designation: selectedProd.pdt_designation,
      ordre: maxOrdre + 1,
      actif: true,
      date_debut: form.date_debut || undefined,
      date_fin: form.date_fin || undefined,
    };
    const id = await saveMarketingItem(item);
    bustMarketing();
    setItems((prev) => [...prev, { ...item, id }]);
    setShowModal(false);
    setSelectedProd(null);
    setProdSearch('');
    setForm({ date_debut: '', date_fin: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Retirer cet article ?')) return;
    await deleteMarketingItem(id);
    bustMarketing();
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleToggle = async (item: MarketingItem) => {
    const updated = { ...item, actif: !item.actif };
    await saveMarketingItem(updated);
    bustMarketing();
    setItems((prev) => prev.map((i) => i.id === item.id ? updated : i));
  };

  const handleMove = async (item: MarketingItem, direction: 'up' | 'down') => {
    const sorted = [...tabItems].sort((a, b) => a.ordre - b.ordre);
    const idx = sorted.findIndex((i) => i.id === item.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const a = { ...sorted[idx], ordre: sorted[swapIdx].ordre };
    const b = { ...sorted[swapIdx], ordre: sorted[idx].ordre };
    await Promise.all([saveMarketingItem(a), saveMarketingItem(b)]);
    bustMarketing();
    setItems((prev) => prev.map((i) => {
      if (i.id === a.id) return a;
      if (i.id === b.id) return b;
      return i;
    }));
  };

  return (
    <>
      <h1 className="text-xl font-bold mb-5">Marketing</h1>

      <div className="flex mb-5 border-b-2 border-gray-200">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 text-sm border-b-2 -mb-[2px] transition-colors cursor-pointer ${
              activeTab === tab.key ? 'text-primary font-bold border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}>
            {tab.label} ({items.filter((i) => i.type === tab.key).length})
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button className={btnPrimSm} onClick={() => setShowModal(true)}>Ajouter un article</button>
      </div>

      <div className={cardClass}>
        {loading ? <p className="text-gray-500 italic">Chargement...</p> : tabItems.length === 0 ? (
          <p className="text-gray-400 italic text-sm">Aucun article dans cette catégorie.</p>
        ) : (
          <div className="space-y-1">
            {tabItems.map((item, i) => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <span className="text-xs font-bold text-gray-400 w-6">{i + 1}</span>
                <strong className="font-mono text-xs">{item.ref_produit}</strong>
                <span className="flex-1">{item.designation}</span>
                {item.date_debut && <span className="text-xs text-gray-400">du {item.date_debut}</span>}
                {item.date_fin && <span className="text-xs text-gray-400">au {item.date_fin}</span>}
                <Badge variant={item.actif ? 'actif' : 'inactif'}>{item.actif ? 'Actif' : 'Inactif'}</Badge>
                <button className={btnSecSm} onClick={() => handleToggle(item)}>{item.actif ? 'Désactiver' : 'Activer'}</button>
                <button className={btnSecSm} onClick={() => handleMove(item, 'up')} disabled={i === 0}>↑</button>
                <button className={btnSecSm} onClick={() => handleMove(item, 'down')} disabled={i === tabItems.length - 1}>↓</button>
                <button className={btnDangerSm} aria-label="Supprimer" onClick={() => handleDelete(item.id)}>
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setSelectedProd(null); setProdSearch(''); }}>
        <ModalTitle>Ajouter un article — {TABS.find((t) => t.key === activeTab)?.label}</ModalTitle>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Produit</label>
            {selectedProd ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50">
                <strong className="font-mono text-xs">{selectedProd.pdt_reference}</strong> {selectedProd.pdt_designation}
                <button className="ml-auto text-red-500 text-xs font-bold" aria-label="Retirer le produit sélectionné" onClick={() => { setSelectedProd(null); setProdSearch(''); }}>
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <input type="text" placeholder="Rechercher un produit..." value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} className={`w-full ${inputSm}`} />
                {matchedProducts.length > 0 && (
                  <div className="border border-gray-200 rounded-lg mt-1 max-h-40 overflow-y-auto">
                    {matchedProducts.map((p) => (
                      <button key={p.pdt_reference} onClick={() => { setSelectedProd(p); setProdSearch(''); }}
                        className="block w-full text-left px-3 py-1.5 text-sm hover:bg-primary-light border-b border-gray-100 last:border-b-0">
                        <strong className="font-mono text-xs">{p.pdt_reference}</strong> {p.pdt_designation}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Date début (optionnel)</label>
            <input type="date" value={form.date_debut} onChange={(e) => setForm((p) => ({ ...p, date_debut: e.target.value }))} className={`w-full ${inputSm}`} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Date fin (optionnel)</label>
            <input type="date" value={form.date_fin} onChange={(e) => setForm((p) => ({ ...p, date_fin: e.target.value }))} className={`w-full ${inputSm}`} />
          </div>
        </div>
        <ModalActions>
          <button className={btnPrimSm} onClick={handleAdd} disabled={!selectedProd}>Ajouter</button>
          <button className={btnSecSm} onClick={() => { setShowModal(false); setSelectedProd(null); setProdSearch(''); }}>Annuler</button>
        </ModalActions>
      </Modal>
    </>
  );
}
