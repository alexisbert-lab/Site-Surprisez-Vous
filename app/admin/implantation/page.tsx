'use client';

import { useState, useEffect } from 'react';
import { updateContenuPage } from '@/lib/firestore/contenu-pages';
import { filterArticlesVisibles, type Product } from '@/lib/firestore/products';
import { api } from '@/lib/api';
import { invalidateCached } from '@/lib/client-cache';
import { btnPrimSm, btnSecSm, btnDangerSm, inputSm, cardClass } from '@/lib/admin-styles';

const ZONES = [
  { id: 'implantation-tete-gondole', label: 'Tête de gondole' },
  { id: 'implantation-lineaire', label: 'Linéaire principal' },
  { id: 'implantation-promotion', label: 'Zone promotion' },
];

interface ZoneData {
  id: string;
  refs: string[];
}

export default function AdminImplantationPage() {
  const [zones, setZones] = useState<ZoneData[]>(ZONES.map((z) => ({ id: z.id, refs: [] })));
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeZone, setActiveZone] = useState(ZONES[0].id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getContenuPages(),
      api.getProducts(),
    ])
      .then(([pages, prods]) => {
        setProducts(filterArticlesVisibles(prods));
        const zoneData = ZONES.map((z) => {
          const page = pages.find((p) => p.id === z.id);
          const refs = page?.images?.map((img) => img.url) || [];
          return { id: z.id, refs };
        });
        setZones(zoneData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currentZone = zones.find((z) => z.id === activeZone);
  const zoneProducts = currentZone ? currentZone.refs.map((ref) => products.find((p) => p.pdt_reference === ref)).filter(Boolean) as Product[] : [];

  const searchResults = search
    ? products.filter((p) => {
        const q = search.toLowerCase();
        const alreadyAssigned = currentZone?.refs.includes(p.pdt_reference);
        return !alreadyAssigned && (p.pdt_reference.toLowerCase().includes(q) || p.pdt_designation.toLowerCase().includes(q));
      }).slice(0, 10)
    : [];

  const addToZone = (ref: string) => {
    setZones((prev) => prev.map((z) => z.id === activeZone ? { ...z, refs: [...z.refs, ref] } : z));
    setSearch('');
  };

  const removeFromZone = (ref: string) => {
    setZones((prev) => prev.map((z) => z.id === activeZone ? { ...z, refs: z.refs.filter((r) => r !== ref) } : z));
  };

  const moveUp = (ref: string) => {
    setZones((prev) => prev.map((z) => {
      if (z.id !== activeZone) return z;
      const idx = z.refs.indexOf(ref);
      if (idx <= 0) return z;
      const next = [...z.refs];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return { ...z, refs: next };
    }));
  };

  const moveDown = (ref: string) => {
    setZones((prev) => prev.map((z) => {
      if (z.id !== activeZone) return z;
      const idx = z.refs.indexOf(ref);
      if (idx < 0 || idx >= z.refs.length - 1) return z;
      const next = [...z.refs];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return { ...z, refs: next };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const zone of zones) {
      await updateContenuPage(zone.id, {
        type: 'photos',
        titre: ZONES.find((z) => z.id === zone.id)?.label,
        images: zone.refs.map((ref, i) => ({ url: ref, ordre: i })),
      });
    }
    invalidateCached('contenu-pages');
    api.invalidate('contenu-pages').catch(() => {});
    setSaving(false);
    alert('Implantation sauvegardée.');
  };

  return (
    <>
      <h1 className="text-xl font-bold mb-5">Implantation &mdash; Merchandising visuel</h1>

      <div className="flex mb-5 border-b-2 border-gray-200">
        {ZONES.map((z) => (
          <button key={z.id} onClick={() => setActiveZone(z.id)}
            className={`px-5 py-2 text-sm border-b-2 -mb-[2px] transition-colors cursor-pointer ${
              activeZone === z.id ? 'text-primary font-bold border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}>
            {z.label} ({zones.find((zd) => zd.id === z.id)?.refs.length || 0})
          </button>
        ))}
      </div>

      <div className={cardClass}>
        {loading ? <p className="text-gray-500 italic">Chargement...</p> : (
          <>
            <div className="flex gap-2 items-center mb-4">
              <div className="relative flex-1">
                <input type="text" placeholder="Rechercher un produit à ajouter..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full ${inputSm}`} />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 border border-gray-200 rounded-lg mt-1 bg-white shadow-lg max-h-40 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button key={p.pdt_reference} onClick={() => addToZone(p.pdt_reference)}
                        className="block w-full text-left px-3 py-1.5 text-sm hover:bg-primary-light border-b border-gray-100 last:border-b-0">
                        <strong className="font-mono text-xs">{p.pdt_reference}</strong> {p.pdt_designation}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className={btnPrimSm} onClick={handleSave} disabled={saving}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
            </div>

            {zoneProducts.length === 0 ? (
              <p className="text-gray-400 italic text-sm">Aucun produit dans cette zone. Recherchez et ajoutez des produits.</p>
            ) : (
              <div className="space-y-1">
                {zoneProducts.map((p, i) => (
                  <div key={p.pdt_reference} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <span className="text-xs font-bold text-gray-400 w-6">{i + 1}</span>
                    <strong className="font-mono text-xs">{p.pdt_reference}</strong>
                    <span className="flex-1">{p.pdt_designation}</span>
                    <button className={btnSecSm} onClick={() => moveUp(p.pdt_reference)} disabled={i === 0}>↑</button>
                    <button className={btnSecSm} onClick={() => moveDown(p.pdt_reference)} disabled={i === zoneProducts.length - 1}>↓</button>
                    <button className={btnDangerSm} aria-label="Retirer" onClick={() => removeFromZone(p.pdt_reference)}>
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
