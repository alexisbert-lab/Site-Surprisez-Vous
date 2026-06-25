'use client';

import { useState, useEffect, useMemo } from 'react';
import { saveGroupeContact, deleteGroupeContact, type GroupeContact } from '@/lib/firestore/groupes-contact';
import { type Client } from '@/lib/firestore/clients';
import { api } from '@/lib/api';
import { invalidateCached } from '@/lib/client-cache';
import { useAuth } from '@/lib/auth-context';
import Modal, { ModalTitle, ModalActions } from '@/components/ui/Modal';
import { btnPrimSm, btnSecSm, btnDangerSm, inputSm, cardClass } from '@/lib/admin-styles';

export default function AdminGroupesContactPage() {
  const [groupes, setGroupes] = useState<GroupeContact[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<GroupeContact | null>(null);
  const [form, setForm] = useState({ nom: '', commercial_nom: '', description: '' });
  const [detailModal, setDetailModal] = useState<GroupeContact | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((t) => Promise.all([
      api.getGroupesContact(t),
      api.getClients(t),
    ]))
      .then(([g, c]) => { setGroupes(g); setClients(c); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  const bustGroupes = () => {
    invalidateCached('groupes-contact');
    api.invalidate('groupes-contact').catch(() => {});
  };

  const openCreate = () => {
    setEditModal({ id: '', nom: '', commercial_id: '', commercial_nom: '', client_ids: [], date_creation: new Date().toLocaleDateString('fr-FR') });
    setForm({ nom: '', commercial_nom: '', description: '' });
  };

  const openEdit = (g: GroupeContact) => {
    setEditModal(g);
    setForm({ nom: g.nom, commercial_nom: g.commercial_nom, description: g.description || '' });
  };

  const handleSave = async () => {
    if (!form.nom.trim()) return;
    const groupe: GroupeContact = {
      id: editModal?.id || '',
      nom: form.nom.trim(),
      commercial_id: '',
      commercial_nom: form.commercial_nom.trim(),
      client_ids: editModal?.client_ids || [],
      description: form.description,
      date_creation: editModal?.date_creation || new Date().toLocaleDateString('fr-FR'),
    };
    const id = await saveGroupeContact(groupe);
    bustGroupes();
    setGroupes((prev) => {
      const idx = prev.findIndex((g) => g.id === (editModal?.id || id));
      const updated = { ...groupe, id: editModal?.id || id };
      if (idx !== -1) { const next = [...prev]; next[idx] = updated; return next; }
      return [...prev, updated];
    });
    setEditModal(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce groupe ?')) return;
    await deleteGroupeContact(id);
    bustGroupes();
    setGroupes((prev) => prev.filter((g) => g.id !== id));
  };

  const addClientToGroup = async (clientId: string) => {
    if (!detailModal) return;
    const updated = { ...detailModal, client_ids: [...detailModal.client_ids, clientId] };
    await saveGroupeContact(updated);
    bustGroupes();
    setDetailModal(updated);
    setGroupes((prev) => prev.map((g) => g.id === updated.id ? updated : g));
  };

  const removeClientFromGroup = async (clientId: string) => {
    if (!detailModal) return;
    const updated = { ...detailModal, client_ids: detailModal.client_ids.filter((id) => id !== clientId) };
    await saveGroupeContact(updated);
    bustGroupes();
    setDetailModal(updated);
    setGroupes((prev) => prev.map((g) => g.id === updated.id ? updated : g));
  };

  const assignedClients = detailModal ? clients.filter((c) => detailModal.client_ids.includes(c.id)) : [];
  const availableClients = detailModal && clientSearch
    ? clients.filter((c) => {
        if (detailModal.client_ids.includes(c.id)) return false;
        const q = clientSearch.toLowerCase();
        return c.raison_soc.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      }).slice(0, 50)
    : [];

  return (
    <>
      <h1 className="text-xl font-bold mb-5">Groupes de contact</h1>

      <div className="flex items-center gap-3 mb-5">
        <button className={btnPrimSm} onClick={openCreate}>Créer un groupe</button>
        <span className="text-sm text-gray-400">{groupes.length} groupe(s)</span>
      </div>

      {loading ? <p className="text-gray-500 italic">Chargement...</p> : groupes.length === 0 ? (
        <p className="text-gray-400 italic text-sm">Aucun groupe de contact.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupes.map((g) => (
            <div key={g.id} className={cardClass}>
              <h3 className="font-bold text-primary mb-1">{g.nom}</h3>
              <p className="text-xs text-gray-500 mb-1">Commercial : {g.commercial_nom || '—'}</p>
              <p className="text-xs font-bold text-primary mb-1">{g.client_ids.length} client(s)</p>
              {g.description && <p className="text-xs text-gray-400 mb-2">{g.description}</p>}
              <div className="flex gap-1 mt-2">
                <button className={btnSecSm} onClick={() => openEdit(g)}>Modifier</button>
                <button className={btnSecSm} onClick={() => { setDetailModal(g); setClientSearch(''); }}>Clients</button>
                <button className={btnDangerSm} onClick={() => handleDelete(g.id)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edit */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)}>
        <ModalTitle>{editModal?.id ? 'Modifier le groupe' : 'Nouveau groupe'}</ModalTitle>
        <div className="space-y-3">
          <input type="text" placeholder="Nom du groupe" value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} className={`w-full ${inputSm}`} />
          <input type="text" placeholder="Nom du commercial" value={form.commercial_nom} onChange={(e) => setForm((p) => ({ ...p, commercial_nom: e.target.value }))} className={`w-full ${inputSm}`} />
          <textarea placeholder="Description (optionnel)" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={3} />
        </div>
        <ModalActions>
          <button className={btnPrimSm} onClick={handleSave}>Enregistrer</button>
          <button className={btnSecSm} onClick={() => setEditModal(null)}>Annuler</button>
        </ModalActions>
      </Modal>

      {/* Modal Clients */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} size="xl">
        {detailModal && (
          <>
            <ModalTitle>Clients du groupe : {detailModal.nom}</ModalTitle>
            <input type="text" placeholder="Rechercher un client..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
              className={`w-full mb-3 ${inputSm}`} />
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-sm font-semibold text-gray-500 mb-1.5">Clients du groupe</div>
                <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                  {assignedClients.length === 0 ? (
                    <div className="p-3 text-gray-400 italic text-sm text-center">Aucun client</div>
                  ) : assignedClients.map((c) => (
                    <div key={c.id} className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100 last:border-b-0 text-sm">
                      <span><strong>{c.raison_soc}</strong> <span className="text-xs text-gray-400">{c.email}</span></span>
                      <button className={btnDangerSm} onClick={() => removeClientFromGroup(c.id)}>Retirer</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-500 mb-1.5">Clients disponibles</div>
                <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                  {availableClients.length === 0 ? (
                    <div className="p-3 text-gray-400 italic text-sm text-center">{clientSearch ? 'Aucun résultat' : 'Recherchez un client'}</div>
                  ) : availableClients.map((c) => (
                    <div key={c.id} className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100 last:border-b-0 text-sm">
                      <span><strong>{c.raison_soc}</strong> <span className="text-xs text-gray-400">{c.email}</span></span>
                      <button className={btnPrimSm} onClick={() => addClientToGroup(c.id)}>Ajouter</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <ModalActions><button className={btnSecSm} onClick={() => setDetailModal(null)}>Fermer</button></ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
