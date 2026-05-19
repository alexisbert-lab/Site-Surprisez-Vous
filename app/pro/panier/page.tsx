'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import Button from '@/components/ui/Button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Link from 'next/link';

export default function PanierPage() {
  const {
    carts, activeCart, activeCartId,
    createCart, selectCart, deleteCart,
    updateQty, removeItem,
    totalItems, totalPrice,
  } = useCart();
  const [newCartName, setNewCartName] = useState('');
  const [showNewCart, setShowNewCart] = useState(false);

  const handleCreateCart = () => {
    if (!newCartName.trim()) return;
    createCart(newCartName.trim());
    setNewCartName('');
    setShowNewCart(false);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Mon Espace', href: '/pro/dashboard' }, { label: 'Panier' }]} className="mb-6" />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-sv-primary font-[family-name:var(--font-heading)]">
          Mes Paniers
        </h1>
        <Button variant="secondary" size="sm" onClick={() => setShowNewCart(true)}>
          + Nouveau panier
        </Button>
      </div>

      {/* Création panier */}
      {showNewCart && (
        <div className="bg-white border border-border rounded-xl p-4 mb-4 flex items-center gap-3">
          <input
            value={newCartName}
            onChange={(e) => setNewCartName(e.target.value)}
            placeholder="Nom du panier (ex: Commande Mars)"
            className="flex-1 px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-sv-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateCart()}
          />
          <Button size="sm" onClick={handleCreateCart}>Créer</Button>
          <button onClick={() => setShowNewCart(false)} className="text-sm text-ink-secondary hover:text-ink cursor-pointer">Annuler</button>
        </div>
      )}

      {/* Liste des paniers */}
      {carts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-border rounded-xl">
          <p className="text-ink-secondary text-sm mb-4">Vous n&apos;avez pas encore de panier.</p>
          <Button variant="secondary" onClick={() => setShowNewCart(true)}>Créer mon premier panier</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 mb-6">
          {carts.map((cart) => (
            <div
              key={cart.id}
              className={`bg-white border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                cart.id === activeCartId ? 'border-sv-primary shadow-sm' : 'border-border hover:border-sv-primary/30'
              }`}
              onClick={() => selectCart(cart.id)}
            >
              <div>
                <h3 className="text-sm font-bold text-ink">{cart.nom}</h3>
                <p className="text-xs text-ink-secondary">
                  {cart.items.length} article{cart.items.length > 1 ? 's' : ''} — Créé le {new Date(cart.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {cart.id === activeCartId && (
                  <span className="text-[10px] bg-sv-primary text-white px-2 py-0.5 rounded-full font-semibold">Actif</span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteCart(cart.id); }}
                  className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contenu du panier actif */}
      {activeCart && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="bg-sv-grey-light px-5 py-3 border-b border-border">
            <h2 className="text-sm font-bold text-ink">Panier : {activeCart.nom}</h2>
          </div>

          {activeCart.items.length === 0 ? (
            <div className="text-center py-10 text-ink-secondary text-sm">
              Ce panier est vide. <Link href="/pro/catalogue" className="text-sv-primary font-semibold hover:underline">Parcourir le catalogue</Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-2.5 font-semibold text-ink-secondary">Référence</th>
                    <th className="text-left px-5 py-2.5 font-semibold text-ink-secondary">Désignation</th>
                    <th className="text-center px-5 py-2.5 font-semibold text-ink-secondary">Quantité</th>
                    <th className="text-right px-5 py-2.5 font-semibold text-ink-secondary">Prix unit. HT</th>
                    <th className="text-right px-5 py-2.5 font-semibold text-ink-secondary">Total HT</th>
                    <th className="px-5 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {activeCart.items.map((item) => (
                    <tr key={item.ref} className="border-b border-border/50">
                      <td className="px-5 py-3 font-mono text-xs">{item.ref}</td>
                      <td className="px-5 py-3">{item.designation}</td>
                      <td className="px-5 py-3 text-center">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => updateQty(item.ref, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border border-border rounded text-center text-sm focus:outline-none focus:border-sv-primary"
                        />
                      </td>
                      <td className="px-5 py-3 text-right">{item.prixUnitaire ? `${item.prixUnitaire.toFixed(2)} €` : '—'}</td>
                      <td className="px-5 py-3 text-right font-semibold">
                        {item.prixUnitaire ? `${(item.qty * item.prixUnitaire).toFixed(2)} €` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => removeItem(item.ref)} className="text-red-500 hover:text-red-700 text-xs cursor-pointer">
                          Retirer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div className="px-5 py-4 bg-sv-grey-light flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-sm text-ink-secondary">
                  {totalItems} article{totalItems > 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-sv-primary">
                    Total : {totalPrice.toFixed(2)} € HT
                  </span>
                  <Link href="/pro/panier/confirmation">
                    <Button variant="secondary">Valider la commande</Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
