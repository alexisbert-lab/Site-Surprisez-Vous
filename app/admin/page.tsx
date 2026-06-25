'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { filterArticlesVisibles } from '@/lib/firestore/products';
import { type Order } from '@/lib/firestore/orders';
import { type ProRequest } from '@/lib/firestore/clients';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { statusBadge } from '@/components/ui/Badge';
import { thClass, tdClass, btnPrimSm, btnSecSm, cardClass } from '@/lib/admin-styles';

export default function AdminDashboardPage() {
  const [articleCount, setArticleCount] = useState<string>('\u2014');
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<ProRequest[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [marketingCount, setMarketingCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    api.getProducts().then((data) => setArticleCount(filterArticlesVisibles(data).length.toLocaleString('fr-FR'))).catch(() => {});
    api.getMarketing().then((m) => setMarketingCount(m.filter((i) => i.actif).length)).catch(() => {});
    if (!user) return;
    user.getIdToken().then((t) => {
      api.getOrders(t).then(setOrders).catch(() => {});
      api.getProRequests(t).then((r) => setRequests(r.filter((req) => req.statut === 'En attente'))).catch(() => {});
      api.getClients(t).then((c) => setClientCount(c.filter((cl) => cl.statut === 'Valide').length)).catch(() => {});
    });
  }, [user]);

  const recentOrders = orders.slice(0, 5);
  const orderCount = orders.filter((o) => o.statut !== 'Annulee').length;
  const totalCA = orders.reduce((sum, o) => sum + o.montant_ht, 0);

  return (
    <>
      <h1 className="text-xl font-bold mb-5">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-6 max-[900px]:grid-cols-2">
        {[
          { label: 'Commandes', value: orderCount, href: '/admin/commandes' },
          { label: 'CA HT', value: `${totalCA.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} \u20ac`, href: '/admin/statistiques' },
          { label: 'Clients Pro actifs', value: clientCount, href: '/admin/crm' },
          { label: 'Articles catalogue', value: articleCount, href: '/admin/catalogue' },
          { label: 'Marketing actifs', value: marketingCount, href: '/admin/marketing' },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className={`${cardClass} hover:border-primary transition-colors`}>
            <div className="text-xs text-gray-500 mb-1.5">{kpi.label}</div>
            <div className="text-2xl font-bold text-primary">{kpi.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className={cardClass}>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
            <h2 className="text-[15px] font-bold">Dernières commandes</h2>
            <Link href="/admin/commandes" className={btnSecSm}>Voir tout</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr className="bg-gray-50">
                <th className={thClass}>N&deg;</th><th className={thClass}>Client</th><th className={thClass}>Montant HT</th><th className={thClass}>Statut</th>
              </tr></thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-100 hover:bg-primary-light/50 transition-colors">
                    <td className={`${tdClass} font-semibold`}>#{o.id.slice(0, 4)}</td>
                    <td className={tdClass}>{o.client}</td>
                    <td className={tdClass}>{o.montant_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} &euro;</td>
                    <td className={tdClass}>{statusBadge(o.statut)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
            <h2 className="text-[15px] font-bold">Demandes Pro en attente</h2>
            <Link href="/admin/crm" className={btnSecSm}>Voir tout</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr className="bg-gray-50">
                <th className={thClass}>Entreprise</th><th className={thClass}>Contact</th><th className={thClass}>Date</th><th className={thClass}></th>
              </tr></thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-4 text-gray-400 italic">Aucune demande en attente.</td></tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-primary-light/50 transition-colors">
                      <td className={`${tdClass} font-semibold`}>{r.nom_entreprise}</td>
                      <td className={tdClass}>{r.contact}</td>
                      <td className={tdClass}>{r.date}</td>
                      <td className={tdClass}>
                        <Link href="/admin/crm" className={btnPrimSm}>Traiter</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className={cardClass}>
        <h2 className="text-[15px] font-bold mb-3">Accès rapides</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/admin/catalogue', label: 'Catalogue' },
            { href: '/admin/groupes-contact', label: 'Groupes de contact' },
            { href: '/admin/marketing', label: 'Marketing' },
            { href: '/admin/statistiques', label: 'Statistiques' },
            { href: '/admin/actualites', label: 'Actualités' },
          ].map((link) => (
            <Link key={link.href} href={link.href} className={`${btnSecSm} !py-2 !px-4`}>{link.label}</Link>
          ))}
        </div>
      </div>
    </>
  );
}
