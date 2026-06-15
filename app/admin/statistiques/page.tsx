'use client';

import { useState, useEffect, useMemo } from 'react';
import { getOrders, type Order } from '@/lib/firestore/orders';
import { getProducts, type Product } from '@/lib/firestore/products';
import { getClients, type Client } from '@/lib/firestore/clients';
import { cardClass } from '@/lib/admin-styles';
import { cachedFetch } from '@/lib/admin-cache';

type Period = 'month' | '3months' | 'year' | 'last_year';

function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length === 3) return new Date(+parts[2], +parts[1] - 1, +parts[0]);
  return null;
}

export default function AdminStatistiquesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('year');

  useEffect(() => {
    Promise.all([
      cachedFetch('orders', getOrders),
      cachedFetch('products', getProducts),
      cachedFetch('clients', getClients),
    ])
      .then(([o, p, c]) => { setOrders(o); setProducts(p); setClients(c); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = parseDate(o.date);
      if (!d) return false;
      if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (period === '3months') { const three = new Date(now); three.setMonth(three.getMonth() - 3); return d >= three; }
      if (period === 'year') return d.getFullYear() === now.getFullYear();
      if (period === 'last_year') return d.getFullYear() === now.getFullYear() - 1;
      return true;
    });
  }, [orders, period]);

  const totalCA = useMemo(() => filteredOrders.reduce((sum, o) => sum + o.montant_ht, 0), [filteredOrders]);
  const avgBasket = filteredOrders.length > 0 ? totalCA / filteredOrders.length : 0;

  const monthlyCA = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      const d = parseDate(o.date);
      if (d) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        map[key] = (map[key] || 0) + o.montant_ht;
      }
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredOrders]);

  const topProducts = useMemo(() => {
    const map: Record<string, { ref: string; designation: string; total: number; qty: number }> = {};
    filteredOrders.forEach((o) => {
      o.lignes.forEach((l) => {
        if (!map[l.ref]) map[l.ref] = { ref: l.ref, designation: l.designation, total: 0, qty: 0 };
        map[l.ref].total += l.prix_unitaire * l.qte;
        map[l.ref].qty += l.qte;
      });
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [filteredOrders]);

  const topClients = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    filteredOrders.forEach((o) => {
      if (!map[o.client]) map[o.client] = { name: o.client, total: 0, count: 0 };
      map[o.client].total += o.montant_ht;
      map[o.client].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [filteredOrders]);

  const maxMonthlyCA = monthlyCA.length > 0 ? Math.max(...monthlyCA.map(([, v]) => v)) : 1;
  const maxProductCA = topProducts.length > 0 ? topProducts[0].total : 1;
  const maxClientCA = topClients.length > 0 ? topClients[0].total : 1;

  const monthNames: Record<string, string> = {
    '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Juin',
    '07': 'Juil', '08': 'Août', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
  };

  return (
    <>
      <h1 className="text-xl font-bold mb-5">Statistiques</h1>

      <div className="flex items-center gap-3 mb-5">
        <label className="text-sm font-semibold text-gray-600">Période :</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="month">Ce mois</option>
          <option value="3months">3 derniers mois</option>
          <option value="year">Cette année</option>
          <option value="last_year">Année précédente</option>
        </select>
      </div>

      {loading ? <p className="text-gray-500 italic">Chargement...</p> : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'CA Total (€ HT)', value: totalCA.toFixed(2) + ' €' },
              { label: 'Commandes', value: filteredOrders.length.toString() },
              { label: 'Panier moyen', value: avgBasket.toFixed(2) + ' €' },
              { label: 'Clients actifs', value: clients.filter((c) => c.statut === 'Valide').length.toString() },
            ].map((kpi) => (
              <div key={kpi.label} className={cardClass}>
                <div className="text-xs font-semibold text-gray-500 mb-1">{kpi.label}</div>
                <div className="text-xl font-bold text-primary">{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* CA Mensuel */}
          <div className={`${cardClass} mb-6`}>
            <h2 className="text-[15px] font-bold mb-4">CA mensuel (€ HT)</h2>
            {monthlyCA.length === 0 ? <p className="text-gray-400 italic text-sm">Aucune donnée.</p> : (
              <div className="space-y-2">
                {monthlyCA.map(([key, value]) => {
                  const month = key.split('-')[1];
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-500 w-12">{monthNames[month] || month}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                        <div className="bg-primary h-5 rounded-full transition-all" style={{ width: `${(value / maxMonthlyCA) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-primary w-24 text-right">{value.toFixed(2)} €</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Produits */}
            <div className={cardClass}>
              <h2 className="text-[15px] font-bold mb-4">Top 10 Produits (CA)</h2>
              {topProducts.length === 0 ? <p className="text-gray-400 italic text-sm">Aucune donnée.</p> : (
                <div className="space-y-2">
                  {topProducts.map((p, i) => (
                    <div key={p.ref} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate"><strong className="font-mono">{p.ref}</strong> {p.designation}</div>
                        <div className="bg-gray-100 rounded-full h-3 mt-0.5 overflow-hidden">
                          <div className="bg-primary h-3 rounded-full" style={{ width: `${(p.total / maxProductCA) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary w-20 text-right">{p.total.toFixed(0)} €</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Clients */}
            <div className={cardClass}>
              <h2 className="text-[15px] font-bold mb-4">Top 10 Clients (CA)</h2>
              {topClients.length === 0 ? <p className="text-gray-400 italic text-sm">Aucune donnée.</p> : (
                <div className="space-y-2">
                  {topClients.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate font-semibold">{c.name} <span className="text-gray-400 font-normal">({c.count} cmd)</span></div>
                        <div className="bg-gray-100 rounded-full h-3 mt-0.5 overflow-hidden">
                          <div className="bg-primary h-3 rounded-full" style={{ width: `${(c.total / maxClientCA) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary w-20 text-right">{c.total.toFixed(0)} €</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
