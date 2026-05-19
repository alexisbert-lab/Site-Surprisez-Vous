'use client';

import { useCart } from '@/lib/cart-context';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Link from 'next/link';

export default function ConfirmationPage() {
  const { activeCart, totalItems, totalPrice } = useCart();
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      // TODO: Envoyer la commande via Cloud Function
      await new Promise((r) => setTimeout(r, 1500));
      setConfirmed(true);
    } catch {
      alert('Erreur lors de la validation. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Commande envoyée !</h2>
        <p className="text-sm text-ink-secondary mb-6">
          Votre commande a bien été transmise à notre équipe. Vous recevrez une confirmation par email.
        </p>
        <Link href="/pro/dashboard">
          <Button>Retour au tableau de bord</Button>
        </Link>
      </div>
    );
  }

  if (!activeCart || activeCart.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <p className="text-ink-secondary text-sm mb-4">Aucun article dans le panier.</p>
        <Link href="/pro/catalogue"><Button>Retour au catalogue</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Breadcrumb items={[
        { label: 'Mon Espace', href: '/pro/dashboard' },
        { label: 'Panier', href: '/pro/panier' },
        { label: 'Confirmation' },
      ]} className="mb-6" />

      <h1 className="text-2xl font-extrabold text-sv-primary mb-6 font-[family-name:var(--font-heading)]">
        Confirmation de commande
      </h1>

      <div className="bg-white border border-border rounded-xl overflow-hidden mb-6">
        <div className="bg-sv-grey-light px-5 py-3 border-b border-border">
          <h2 className="text-sm font-bold text-ink">Récapitulatif — {activeCart.nom}</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-2.5 font-semibold text-ink-secondary">Réf.</th>
              <th className="text-left px-5 py-2.5 font-semibold text-ink-secondary">Désignation</th>
              <th className="text-center px-5 py-2.5 font-semibold text-ink-secondary">Qté</th>
              <th className="text-right px-5 py-2.5 font-semibold text-ink-secondary">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {activeCart.items.map((item) => (
              <tr key={item.ref} className="border-b border-border/50">
                <td className="px-5 py-2.5 font-mono text-xs">{item.ref}</td>
                <td className="px-5 py-2.5">{item.designation}</td>
                <td className="px-5 py-2.5 text-center">{item.qty}</td>
                <td className="px-5 py-2.5 text-right font-semibold">
                  {item.prixUnitaire ? `${(item.qty * item.prixUnitaire).toFixed(2)} €` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-4 bg-sv-grey-light flex items-center justify-between">
          <span className="text-sm text-ink-secondary">{totalItems} article{totalItems > 1 ? 's' : ''}</span>
          <span className="text-lg font-bold text-sv-primary">Total : {totalPrice.toFixed(2)} € HT</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/pro/panier">
          <Button variant="outline">Modifier le panier</Button>
        </Link>
        <Button variant="secondary" onClick={handleConfirm} disabled={submitting} className="flex-1">
          {submitting ? 'Envoi en cours...' : 'Confirmer et envoyer la commande'}
        </Button>
      </div>
    </div>
  );
}
