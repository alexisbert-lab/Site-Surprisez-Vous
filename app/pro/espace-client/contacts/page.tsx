'use client';

import { useAuth } from '@/lib/auth-context';
import Breadcrumb from '@/components/ui/Breadcrumb';

const contactsSV = [
  { role: 'Accueil', nom: 'Accueil Surprisez-Vous', email: 'contact@surprisez-vous.fr', tel: '01 23 45 67 89' },
  { role: 'Administration des Ventes', nom: 'Service ADV', email: 'adv@surprisez-vous.fr', tel: '01 23 45 67 90' },
];

export default function MesContactsPage() {
  const { profile } = useAuth();

  return (
    <div className="max-w-3xl">
      <Breadcrumb items={[{ label: 'Mon Espace', href: '/pro/dashboard' }, { label: 'Mes Contacts' }]} className="mb-6" />

      <h1 className="text-2xl font-extrabold text-sv-primary mb-6 font-[family-name:var(--font-heading)]">
        Mes Contacts Surprisez-Vous
      </h1>

      {/* Conseiller commercial */}
      {profile?.conseiller && (
        <section className="bg-sv-primary text-white rounded-xl p-6 mb-6">
          <h2 className="text-sm font-bold mb-3">Votre conseiller commercial dédié</h2>
          <div className="space-y-1">
            <p className="text-lg font-bold">{profile.conseiller.nom}</p>
            <p className="text-white/80 text-sm">{profile.conseiller.email}</p>
            <p className="text-white/80 text-sm">{profile.conseiller.tel}</p>
          </div>
        </section>
      )}

      {!profile?.conseiller && (
        <section className="bg-sv-grey-light border border-border rounded-xl p-6 mb-6 text-center">
          <p className="text-sm text-ink-secondary">
            Aucun conseiller commercial attribué. Contactez l&apos;accueil pour toute demande.
          </p>
        </section>
      )}

      {/* Contacts SV */}
      <div className="grid grid-cols-1 gap-4">
        {contactsSV.map((c) => (
          <div key={c.role} className="bg-white border border-border rounded-xl p-5">
            <span className="text-[10px] font-semibold uppercase text-sv-orange tracking-wider">{c.role}</span>
            <p className="text-sm font-bold text-ink mt-1">{c.nom}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-ink-secondary">
              <a href={`mailto:${c.email}`} className="hover:text-sv-primary transition-colors">{c.email}</a>
              <span>{c.tel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
