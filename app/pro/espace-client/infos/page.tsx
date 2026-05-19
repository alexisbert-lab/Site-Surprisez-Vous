'use client';

import { useAuth } from '@/lib/auth-context';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function MesInfosPage() {
  const { user, profile } = useAuth();

  return (
    <div className="max-w-3xl">
      <Breadcrumb items={[{ label: 'Mon Espace', href: '/pro/dashboard' }, { label: 'Mes Infos' }]} className="mb-6" />

      <h1 className="text-2xl font-extrabold text-sv-primary mb-6 font-[family-name:var(--font-heading)]">
        Mes Informations
      </h1>

      {/* Infos entreprise */}
      <section className="bg-white border border-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-bold text-ink mb-4 pb-3 border-b border-border">Entreprise</h2>
        <div className="grid grid-cols-2 gap-4 text-sm max-md:grid-cols-1">
          <div>
            <span className="block text-xs text-ink-secondary mb-0.5">Raison sociale</span>
            <span className="font-medium">{profile?.entreprise || '—'}</span>
          </div>
          <div>
            <span className="block text-xs text-ink-secondary mb-0.5">Email</span>
            <span className="font-medium">{user?.email || '—'}</span>
          </div>
          <div>
            <span className="block text-xs text-ink-secondary mb-0.5">Rôle</span>
            <span className="font-medium capitalize">{profile?.role || '—'}</span>
          </div>
          <div>
            <span className="block text-xs text-ink-secondary mb-0.5">Nom</span>
            <span className="font-medium">{profile?.nom || '—'}</span>
          </div>
        </div>
      </section>

      {/* Interlocuteurs */}
      <section className="bg-white border border-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-bold text-ink mb-4 pb-3 border-b border-border">Interlocuteurs</h2>
        <p className="text-sm text-ink-secondary">
          Les interlocuteurs de votre entreprise sont gérés par votre conseiller commercial.
          Contactez-le pour toute modification.
        </p>
      </section>

      {/* Horaires et consignes livraison */}
      <section className="bg-white border border-border rounded-xl p-6">
        <h2 className="text-sm font-bold text-ink mb-4 pb-3 border-b border-border">Consignes de livraison</h2>
        <div className="grid grid-cols-2 gap-4 text-sm max-md:grid-cols-1">
          <div>
            <span className="block text-xs text-ink-secondary mb-0.5">Horaires de réception</span>
            <span className="font-medium">Lundi — Vendredi, 8h — 17h</span>
          </div>
          <div>
            <span className="block text-xs text-ink-secondary mb-0.5">Consignes particulières</span>
            <span className="font-medium text-ink-secondary">Aucune consigne spécifiée</span>
          </div>
        </div>
      </section>
    </div>
  );
}
