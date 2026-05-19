'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

const menuItems = [
  { label: 'Mes Infos', href: '/pro/espace-client/infos', desc: 'Informations entreprise et interlocuteurs', icon: 'user' },
  { label: 'Mes Contacts SV', href: '/pro/espace-client/contacts', desc: 'Votre commercial et l\'équipe SV', icon: 'phone' },
  { label: 'Mes Paniers', href: '/pro/panier', desc: 'Gérer vos paniers et commandes', icon: 'cart' },
  { label: 'Catalogue', href: '/pro/catalogue', desc: 'Parcourir le catalogue professionnel', icon: 'grid' },
  { label: 'Commande Express', href: '/pro/commande-express', desc: 'Passer commande rapidement', icon: 'zap' },
  { label: 'Mes Commandes', href: '/pro/espace-client/commandes', desc: 'Historique de vos commandes ERP', icon: 'list' },
];


export default function ProDashboardPage() {
  const { user, profile } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-sv-primary font-[family-name:var(--font-heading)]">
          Bienvenue, {profile?.entreprise || profile?.nom || user?.email}
        </h1>
        <p className="text-sm text-ink-secondary mt-1">Votre espace professionnel Surprisez-Vous</p>
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-md:grid-cols-2 max-sm:grid-cols-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border border-border rounded-xl p-5 hover:shadow-md hover:border-sv-primary/30 transition-all group"
          >
            <h3 className="text-sm font-bold text-ink group-hover:text-sv-primary transition-colors mb-1">{item.label}</h3>
            <p className="text-xs text-ink-secondary">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Conseiller */}
      {profile?.conseiller && (
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="text-sm font-bold text-ink mb-3">Votre conseiller commercial</h2>
          <div className="flex flex-col gap-1 text-sm">
            <strong className="text-sv-primary">{profile.conseiller.nom}</strong>
            <span className="text-ink-secondary">{profile.conseiller.email}</span>
            <span className="text-ink-secondary">{profile.conseiller.tel}</span>
          </div>
        </div>
      )}
    </div>
  );
}
