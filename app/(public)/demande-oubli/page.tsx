'use client';

import { useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';

export default function DemandeOubliPage() {
  const [email, setEmail] = useState('');
  const [motif, setMotif] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setSubmitting(true);
    try {
      // TODO: Cloud Function traitement
      await new Promise((r) => setTimeout(r, 1000));
      setSuccess(true);
    } catch {
      alert('Erreur lors de l\'envoi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">Demande envoyée</h2>
        <p className="text-sm text-ink-secondary">
          Votre demande d&apos;oubli numérique sera traitée dans un délai de 30 jours conformément au RGPD.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-extrabold text-sv-primary mb-2 font-[family-name:var(--font-heading)]">
        Demande d&apos;oubli numérique
      </h1>
      <p className="text-sm text-ink-secondary mb-8">
        Conformément au RGPD, vous pouvez demander la suppression de vos données personnelles.
      </p>

      <form onSubmit={handleSubmit} className="bg-white border border-border rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">Adresse email associée à votre compte *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-sv-primary focus:ring-2 focus:ring-sv-primary/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">Motif (optionnel)</label>
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-sv-primary focus:ring-2 focus:ring-sv-primary/20 resize-none"
          />
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Envoi...' : 'Envoyer ma demande'}
        </Button>
      </form>
    </div>
  );
}
