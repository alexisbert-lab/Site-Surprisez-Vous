'use client';

import { useState, useEffect, useMemo } from 'react';
import { updateOrderStatus, type Order } from '@/lib/firestore/orders';
import { api } from '@/lib/api';
import { invalidateCached } from '@/lib/client-cache';
import { useAuth } from '@/lib/auth-context';
import { statusBadge } from '@/components/ui/Badge';
import Modal, { ModalTitle, ModalSubtitle, ModalActions } from '@/components/ui/Modal';
import { thClass, tdClass, btnPrimSm, btnSecSm, btnDangerSm, selectClass } from '@/lib/admin-styles';

function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length === 3) return new Date(+parts[2], +parts[1] - 1, +parts[0]);
  return null;
}

export default function AdminCommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalOrder, setModalOrder] = useState<Order | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((t) => api.getOrders(t)).then(setOrders).catch(() => {});
  }, [user]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch = !search || `${o.id} ${o.client}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || o.statut === statusFilter;
      let matchDate = true;
      if (dateFrom || dateTo) {
        const d = parseDate(o.date);
        if (d) {
          if (dateFrom) matchDate = matchDate && d >= new Date(dateFrom);
          if (dateTo) matchDate = matchDate && d <= new Date(dateTo + 'T23:59:59');
        }
      }
      return matchSearch && matchStatus && matchDate;
    });
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  const handleStatusChange = async (orderId: string, newStatus: Order['statut']) => {
    const order = orders.find((o) => o.id === orderId);
    await updateOrderStatus(orderId, newStatus, order?.clientEmail);
    invalidateCached('orders');
    api.invalidate('orders').catch(() => {});
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, statut: newStatus } : o)));
  };


  return (
    <>
      <h1 className="text-xl font-bold mb-5">Commandes</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <input type="text" placeholder="Client, N&deg; commande..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <label className="text-sm font-semibold text-gray-600">Statut :</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            <option value="">-- Tous --</option>
            <option value="En attente">En attente</option>
            <option value="Validee">Validée</option>
            <option value="Expediee">Expédiée</option>
            <option value="Livree">Livrée</option>
            <option value="Annulee">Annulée</option>
          </select>
          <label className="text-sm font-semibold text-gray-600">Du :</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectClass} />
          <label className="text-sm font-semibold text-gray-600">Au :</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectClass} />

          <span className="text-sm text-gray-400">{filtered.length} commande(s)</span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full border-collapse text-sm">
            <thead><tr className="bg-gray-50">
              <th className={thClass}>N&deg;</th><th className={thClass}>Client</th><th className={thClass}>Date</th>
              <th className={thClass}>Articles</th><th className={thClass}>Montant HT</th>
              <th className={thClass}>Statut</th><th className={thClass}>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-gray-100 hover:bg-primary-light/50 transition-colors">
                  <td className={`${tdClass} font-semibold`}>#{o.id.slice(0, 4)}</td>
                  <td className={tdClass}>{o.client}</td><td className={tdClass}>{o.date}</td>
                  <td className={tdClass}>{o.lignes.length}</td>
                  <td className={tdClass}>{o.montant_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} &euro;</td>
                  <td className={tdClass}>{statusBadge(o.statut)}</td>
                  <td className={`${tdClass} space-x-1`}>
                    <button className={btnPrimSm} onClick={() => setModalOrder(o)}>Détail</button>
                    {o.statut === 'En attente' && <button className={btnSecSm} onClick={() => handleStatusChange(o.id, 'Validee')}>Valider</button>}
                    {o.statut === 'Validee' && (
                      <>
                        <button className={btnSecSm} onClick={() => handleStatusChange(o.id, 'Expediee')}>Expédier</button>
                        <button className={btnDangerSm} onClick={() => handleStatusChange(o.id, 'Annulee')}>Annuler</button>
                      </>
                    )}
                    {o.statut === 'Expediee' && <button className={btnSecSm} onClick={() => handleStatusChange(o.id, 'Livree')}>Livrée</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!modalOrder} onClose={() => setModalOrder(null)} size="lg">
        {modalOrder && (
          <>
            <ModalTitle>Commande #{modalOrder.id.slice(0, 4)}</ModalTitle>
            <ModalSubtitle>{modalOrder.client} &mdash; {modalOrder.date}</ModalSubtitle>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-gray-50">
                  <th className={thClass}>Référence</th><th className={thClass}>Désignation</th>
                  <th className={thClass}>Qté</th><th className={thClass}>Prix unit. HT</th><th className={thClass}>Total HT</th>
                </tr></thead>
                <tbody>
                  {modalOrder.lignes.map((l) => (
                    <tr key={l.ref} className="border-b border-gray-100">
                      <td className={`${tdClass} font-mono text-xs text-gray-400`}>{l.ref}</td>
                      <td className={tdClass}>{l.designation}</td><td className={tdClass}>{l.qte}</td>
                      <td className={tdClass}>{l.prix_unitaire.toFixed(2)} &euro;</td>
                      <td className={tdClass}>{(l.qte * l.prix_unitaire).toFixed(2)} &euro;</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={4} className="text-right font-bold px-3 py-2">Total HT</td>
                  <td className="font-bold px-3 py-2 text-primary">{modalOrder.montant_ht.toFixed(2)} &euro;</td></tr>
                </tfoot>
              </table>
            </div>
            <ModalActions>
              <button onClick={() => setModalOrder(null)} className={btnSecSm}>Fermer</button>
            </ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
