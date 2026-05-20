'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavGroup {
  title: string;
  items: { href: string; label: string; external?: boolean }[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Navigation',
    items: [{ href: '/admin', label: 'Dashboard' }],
  },
  {
    title: 'Catalogue & Ventes',
    items: [
      { href: '/admin/catalogue', label: 'Catalogue' },
      { href: '/admin/catalogues', label: 'Catalogues clients' },
      { href: '/admin/repartition', label: 'Répartition' },
      { href: '/admin/implantation', label: 'Implantation' },
      { href: '/admin/commandes', label: 'Commandes' },
      { href: '/admin/tarifs', label: 'Grilles tarifaires' },
    ],
  },
  {
    title: 'Clients & Marketing',
    items: [
      { href: '/admin/crm', label: 'CRM / Clients' },
      { href: '/admin/revendeurs', label: 'Revendeurs' },
      { href: '/admin/groupes-contact', label: 'Groupes de contact' },
      { href: '/admin/marketing', label: 'Marketing' },
    ],
  },
  {
    title: 'Pilotage & Contenu',
    items: [
      { href: '/admin/statistiques', label: 'Statistiques' },
{ href: '/admin/editeur', label: 'Éditeur visuel' },
      { href: '/admin/personnalisation', label: 'Personnalisation' },
    ],
  },
  {
    title: 'Données',
    items: [{ href: '/admin/sync', label: 'Synchronisation Drive' }],
  },
  {
    title: 'Site',
    items: [{ href: '/', label: 'Voir le site', external: true }],
  },
];

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin' || pathname === '/admin/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={onClose} />
      )}

      <aside className={`
        w-[220px] bg-surface border-r border-border py-3 overflow-y-auto
        fixed top-[50px] bottom-0 z-40
        transition-transform duration-200
        md:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {navGroups.map((group) => (
          <div key={group.title} className="px-4 mb-3">
            <span className="block text-[11px] font-bold uppercase text-sv-primary/50 tracking-wide mb-1 px-1">
              {group.title}
            </span>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                {...(item.external ? { target: '_blank' } : {})}
                className={`block px-3 py-1.5 rounded-lg text-sm mb-0.5 transition-all ${
                  isActive(item.href)
                    ? 'bg-sv-primary-light text-sv-primary font-bold border-l-3 border-sv-primary'
                    : 'text-ink hover:bg-sv-primary-light/50 hover:text-sv-primary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </aside>
    </>
  );
}
