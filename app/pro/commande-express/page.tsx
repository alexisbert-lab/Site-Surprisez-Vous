'use client';

import { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import { filterArticlesVisibles, type Product } from '@/lib/firestore/products';
import { createOrder } from '@/lib/firestore/orders';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

interface CartLine { ref: string; designation: string; prix: number; qte: number; }

export default function CommandeExpressPage() {
  const { user } = useAuth();
  const [catalogue, setCatalogue] = useState<Record<string, Product>>({});
  const [cart, setCart] = useState<CartLine[]>([]);
  const [ref, setRef] = useState('');
  const [qte, setQte] = useState(1);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    api.getProducts().then((data) => {
      const map: Record<string, Product> = {};
      filterArticlesVisibles(data).forEach((p) => { map[p.pdt_reference.toUpperCase()] = p; });
      setCatalogue(map);
    });
  }, []);

  // Animer l'entrée des nouvelles lignes
  useEffect(() => {
    if (!tbodyRef.current) return;
    const rows = tbodyRef.current.querySelectorAll('tr:not([data-animated])');
    if (rows.length === 0) return;

    rows.forEach((row) => {
      (row as HTMLElement).setAttribute('data-animated', 'true');
      anime({
        targets: row,
        translateY: [-100, 0],
        scale: [0.25, 1],
        opacity: [0, 1],
        duration: 350,
        easing: 'easeOutQuart',
      });
    });
  }, [cart.length]);

  const handleRefChange = (value: string) => {
    setRef(value);
    const q = value.trim().toUpperCase();
    if (q.length >= 1) {
      const matches = Object.values(catalogue)
        .filter((p) => p.pdt_reference.toUpperCase().includes(q) || p.pdt_designation.toUpperCase().includes(q))
        .slice(0, 8);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (product: Product) => {
    setRef(product.pdt_reference);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleAdd = () => {
    setShowSuggestions(false);
    const refUpper = ref.trim().toUpperCase();
    const product = catalogue[refUpper];
    if (!product) { setError('Reference introuvable.'); return; }
    setError('');
    setCart((prev) => {
      const existing = prev.find((l) => l.ref === refUpper);
      if (existing) return prev.map((l) => (l.ref === refUpper ? { ...l, qte: l.qte + qte } : l));
      return [...prev, { ref: refUpper, designation: product.pdt_designation, prix: product.prix_vente || 0, qte }];
    });
    setRef(''); setQte(1);
  };

  const removeItem = (index: number) => {
    const row = tbodyRef.current?.querySelectorAll('tr')[index];
    if (row) {
      anime({
        targets: row,
        translateY: [-100],
        scale: [0.25],
        opacity: [0],
        duration: 350,
        easing: 'easeOutQuart',
        complete: () => {
          setCart((prev) => prev.filter((_, i) => i !== index));
        },
      });
    } else {
      setCart((prev) => prev.filter((_, i) => i !== index));
    }
  };
  const total = cart.reduce((sum, l) => sum + l.prix * l.qte, 0);

  const handleOrder = async () => {
    if (!user?.email || cart.length === 0) return;
    await createOrder({
      client: user.email, clientEmail: user.email,
      date: new Date().toLocaleDateString('fr-FR'),
      lignes: cart.map((l) => ({ ref: l.ref, designation: l.designation, qte: l.qte, prix_unitaire: l.prix })),
      montant_ht: total, statut: 'En attente',
    });
    alert('Commande validee !'); setCart([]);
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
  const thClass = 'text-left px-3 py-2.5 font-semibold text-gray-600 border-b-2 border-gray-200';
  const tdClass = 'px-3 py-2.5';

  return (
    <>
      <h1 className="text-xl font-bold mb-2">Commande Express</h1>
      <p className="text-gray-500 text-sm mb-6">Saisissez une reference et une quantite pour ajouter directement au panier.</p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-5">
        <h2 className="text-[15px] font-bold mb-4 pb-3 border-b border-gray-200">Ajouter un article</h2>
        <div className="flex gap-3 mb-4 items-end max-sm:flex-col max-sm:items-stretch">
          <div className="flex-1 relative">
            <label htmlFor="saisie-ref" className="block text-sm font-semibold text-gray-500 mb-1">Reference</label>
            <input type="text" id="saisie-ref" ref={inputRef} placeholder="ex: 001A20" value={ref}
              onChange={(e) => handleRefChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              autoComplete="off"
              className={inputClass} />
            {showSuggestions && (
              <div ref={suggestionsRef} className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {suggestions.map((p) => (
                  <button key={p.pdt_reference} type="button"
                    onMouseDown={() => selectSuggestion(p)}
                    className="w-full text-left px-3 py-2 hover:bg-primary-light/60 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-0 cursor-pointer">
                    <span className="font-mono text-xs font-bold text-primary w-24 shrink-0">{p.pdt_reference}</span>
                    <span className="text-sm text-gray-700 truncate">{p.pdt_designation}</span>
                    {p.prix_vente ? <span className="ml-auto text-xs font-semibold text-gray-500 shrink-0">{p.prix_vente.toFixed(2)} €</span> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-28 max-sm:w-full">
            <label htmlFor="saisie-qte" className="block text-sm font-semibold text-gray-500 mb-1">Quantite</label>
            <input type="number" id="saisie-qte" min={1} value={qte}
              onChange={(e) => setQte(parseInt(e.target.value) || 1)} className={inputClass} />
          </div>
          <button onClick={handleAdd} className="px-5 py-2 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary-dark transition-colors cursor-pointer">
            Ajouter
          </button>
        </div>
        {error && <div className="p-3 text-sm rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-[15px] font-bold mb-4 pb-3 border-b border-gray-200">Panier</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full border-collapse text-sm">
            <thead><tr className="bg-gray-50">
              <th className={thClass}>Reference</th><th className={thClass}>Designation</th>
              <th className={thClass}>Prix HT</th><th className={thClass}>Qte</th>
              <th className={thClass}>Total HT</th><th className={thClass}></th>
            </tr></thead>
            <tbody ref={tbodyRef}>
              {cart.map((l, i) => (
                <tr key={l.ref} className="border-b border-gray-100 hover:bg-primary-light/50 transition-colors">
                  <td className={`${tdClass} font-semibold`}>{l.ref}</td>
                  <td className={tdClass}>{l.designation}</td>
                  <td className={tdClass}>{l.prix.toFixed(2)} &euro;</td>
                  <td className={tdClass}>{l.qte}</td>
                  <td className={`${tdClass} font-semibold`}>{(l.prix * l.qte).toFixed(2)} &euro;</td>
                  <td className={tdClass}>
                    <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 text-base cursor-pointer transition-colors">&times;</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cart.length > 0 && (
          <>
            <div className="text-right text-lg font-bold text-primary py-4">Total HT : {total.toFixed(2)} &euro;</div>
            <div className="text-right">
              <button onClick={handleOrder} className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary-dark transition-colors cursor-pointer">
                Valider la commande
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
