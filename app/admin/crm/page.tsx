'use client';

import { useState, useEffect, useMemo } from 'react';
import { updateProRequestStatus, updateClient, linkClientToUser, unlinkClientFromUser, type Client, type ProRequest } from '@/lib/firestore/clients';
import { api } from '@/lib/api';
import { invalidateCached } from '@/lib/client-cache';
import { useAuth } from '@/lib/auth-context';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { type TarifGrid } from '@/lib/firestore/tarifs';
import Modal, { ModalTitle, ModalActions } from '@/components/ui/Modal';

export default function AdminCrmPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [requests, setRequests] = useState<ProRequest[]>([]);
  const [grids, setGrids] = useState<TarifGrid[]>([]);
  const [search, setSearch] = useState('');
  const [modalClient, setModalClient] = useState<Client | null>(null);
  const [linkUid, setLinkUid] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) => Promise.all([
      api.getClients(token),
      api.getProRequests(token),
      api.getTarifGrids(token),
    ])).then(([cls, reqs, gds]) => {
      setClients(cls);
      setRequests(reqs.filter((r) => r.statut === 'En attente'));
      setGrids(gds.filter((g) => g.statut === 'active'));
    }).catch(() => {});
  }, [user]);

  const handleAssignTarif = async (clientId: string, tarif_grid_id: string) => {
    const client = clients.find((c) => c.id === clientId);
    await updateClient(clientId, { tarif_grid_id: tarif_grid_id || undefined });
    // Propager vers users/{uid} si le client est lié
    if (client?.uid) {
      await updateDoc(doc(getFirebaseDb(), 'users', client.uid), {
        tarif_grid_id: tarif_grid_id || null,
      });
    }
    invalidateCached('clients');
    api.invalidate('clients').catch(() => {});
    setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, tarif_grid_id: tarif_grid_id || undefined } : c));
    setModalClient((prev) => prev ? { ...prev, tarif_grid_id: tarif_grid_id || undefined } : prev);
  };

  const handleLink = async () => {
    if (!modalClient || !linkUid.trim()) return;
    setLinkLoading(true);
    setLinkError('');
    try {
      await linkClientToUser(modalClient.id, linkUid.trim(), modalClient.tarif_grid_id);
      invalidateCached('clients');
      api.invalidate('clients').catch(() => {});
      const updated = { ...modalClient, uid: linkUid.trim() };
      setClients((prev) => prev.map((c) => c.id === modalClient.id ? updated : c));
      setModalClient(updated);
      setLinkUid('');
    } catch (e) {
      console.error('linkClientToUser', e);
      setLinkError(`Erreur lors de la liaison : ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!modalClient?.uid || !confirm('Délier ce compte ?')) return;
    await unlinkClientFromUser(modalClient.id, modalClient.uid);
    invalidateCached('clients');
    api.invalidate('clients').catch(() => {});
    const updated = { ...modalClient, uid: undefined };
    setClients((prev) => prev.map((c) => c.id === modalClient.id ? updated : c));
    setModalClient(updated);
  };

  const filteredClients = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => `${c.raison_soc} ${c.enseigne || ''} ${c.email} ${c.tel || ''} ${c.nom_gerant || ''} ${c.nom_ach || ''}`.toLowerCase().includes(q));
  }, [clients, search]);

  const handleValidate = async (id: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req || !confirm(`Valider et creer le compte Pro pour ${req.nom_entreprise} ?`)) return;
    await updateProRequestStatus(id, 'Valide');
    invalidateCached('pro-requests');
    api.invalidate('pro-requests').catch(() => {});
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleReject = async (id: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req || !confirm(`Refuser la demande de ${req.nom_entreprise} ?`)) return;
    await updateProRequestStatus(id, 'Refuse');
    invalidateCached('pro-requests');
    api.invalidate('pro-requests').catch(() => {});
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const thClass = 'text-left px-3 py-2.5 font-semibold text-gray-600 border-b-2 border-gray-200';
  const tdClass = 'px-3 py-2.5';
  const btnPrimSm = 'px-3 py-1 bg-primary text-white rounded-md text-xs font-semibold hover:bg-primary-dark transition-colors cursor-pointer';
  const btnSecSm = 'px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold border border-gray-300 hover:bg-gray-200 transition-colors cursor-pointer';
  const btnDangerSm = 'px-3 py-1 bg-red-500 text-white rounded-md text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer';

  return (
    <>
      <h1 className="text-xl font-bold mb-5">CRM / Clients</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-5">
        <h2 className="text-[15px] font-bold mb-4 pb-3 border-b border-gray-200">Demandes Pro en attente</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full border-collapse text-sm">
            <thead><tr className="bg-gray-50">
              <th className={thClass}>Entreprise</th><th className={thClass}>SIRET</th><th className={thClass}>Contact</th>
              <th className={thClass}>Email</th><th className={thClass}>Tel</th><th className={thClass}>Activite</th>
              <th className={thClass}>Date</th><th className={thClass}>Actions</th>
            </tr></thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-4 text-gray-400 italic">Aucune demande en attente.</td></tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-primary-light/50 transition-colors">
                    <td className={`${tdClass} font-semibold`}>{r.nom_entreprise}</td>
                    <td className={tdClass}>{r.siret}</td><td className={tdClass}>{r.contact}</td>
                    <td className={tdClass}>{r.email}</td><td className={tdClass}>{r.tel}</td>
                    <td className={tdClass}>{r.type_activite}</td><td className={tdClass}>{r.date}</td>
                    <td className={`${tdClass} space-x-1`}>
                      <button className={btnPrimSm} onClick={() => handleValidate(r.id)}>Valider</button>
                      <button className={btnDangerSm} onClick={() => handleReject(r.id)}>Refuser</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-[15px] font-bold mb-4 pb-3 border-b border-gray-200">Clients Pro actifs</h2>
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-56 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <span className="text-sm text-gray-400">{filteredClients.length} client(s)</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full border-collapse text-sm">
            <thead><tr className="bg-gray-50">
              <th className={thClass}>Entreprise</th><th className={thClass}>Email</th><th className={thClass}>Tel</th>
              <th className={thClass}>Ville</th><th className={thClass}>Commandes</th><th className={thClass}>CA HT total</th>
            </tr></thead>
            <tbody>
              {filteredClients.map((c) => (
                <tr key={c.id} onClick={() => setModalClient(c)} className="border-b border-gray-100 hover:bg-primary-light/50 cursor-pointer transition-colors">
                  <td className={`${tdClass} font-semibold`}>{c.raison_soc}</td><td className={tdClass}>{c.email}</td>
                  <td className={tdClass}>{c.tel || '—'}</td><td className={tdClass}>{c.ville || '—'}</td>
                  <td className={tdClass}>—</td><td className={tdClass}>—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!modalClient} onClose={() => setModalClient(null)}>
        {modalClient && (
          <>
            <ModalTitle>{modalClient.raison_soc}</ModalTitle>
            <table className="text-sm w-full mb-4">
              <tbody>
                {[['Email', modalClient.email], ['Tel', modalClient.tel || '—'], ['SIRET', modalClient.siret || '—'],
                  ['Ville', modalClient.ville || '—'], ['Statut', modalClient.statut],
                  ['Enseigne', modalClient.enseigne || '—'],
                  ['Groupe ERP', modalClient.profil_id || '—'],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="py-1.5 pr-4 text-gray-500 font-semibold whitespace-nowrap">{label}</td>
                    <td className="py-1.5">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-gray-200 pt-4 mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Compte utilisateur lié</label>
              {modalClient.uid ? (
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-mono text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-gray-700 truncate">{modalClient.uid}</span>
                  <button onClick={handleUnlink} className={btnDangerSm}>Délier</button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="UID Firebase Auth"
                      value={linkUid}
                      onChange={(e) => setLinkUid(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button onClick={handleLink} disabled={linkLoading || !linkUid.trim()} className={`${btnPrimSm} disabled:opacity-50`}>
                      {linkLoading ? '…' : 'Lier'}
                    </button>
                  </div>
                  {linkError && <p className="text-xs text-red-500">{linkError}</p>}
                  <p className="text-xs text-gray-400">L&apos;UID se trouve dans la console Firebase Authentication.</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Grille tarifaire</label>
              <select
                value={modalClient.tarif_grid_id || ''}
                onChange={(e) => handleAssignTarif(modalClient.id, e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">— Aucune grille assignée —</option>
                {grids.map((g) => (
                  <option key={g.id} value={g.id}>{g.nom}{g.profil_id ? ` (${g.profil_id})` : ''}</option>
                ))}
              </select>
            </div>
            <ModalActions>
              <button className={btnSecSm} onClick={() => setModalClient(null)}>Fermer</button>
            </ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
