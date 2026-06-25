'use client';

import { useState, useEffect, useMemo } from 'react';
import { getClients, type Client } from '@/lib/firestore/clients';
import { setRevendeurCoords, geocodeAddress, geocodePostalCode } from '@/lib/firestore/revendeurs';
import { cachedFetch, invalidateAdminCache } from '@/lib/admin-cache';

export default function AdminRevendeursPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'no_coords'>('no_coords');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchDone, setBatchDone] = useState(0);
  const [batchTotal, setBatchTotal] = useState(0);

  useEffect(() => {
    cachedFetch('crm-clients', () => getClients()).then(setClients).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let base = filter === 'no_coords'
      ? clients.filter((c) => !c.revendeur?.lat)
      : clients;
    if (!search.trim()) return base;
    const s = search.toLowerCase();
    return base.filter(
      (c) =>
        c.raison_soc.toLowerCase().includes(s) ||
        (c.enseigne?.toLowerCase().includes(s)) ||
        (c.ville?.toLowerCase().includes(s)) ||
        (c.cp?.includes(s))
    );
  }, [clients, search, filter]);

  const noCoordCount = useMemo(
    () => clients.filter((c) => (c.adr || c.cp) && !c.revendeur?.lat).length,
    [clients]
  );

  const handleBatchGeocode = async () => {
    const missing = clients.filter((c) => (c.adr || c.cp) && !c.revendeur?.lat);
    if (missing.length === 0) return;
    setBatchLoading(true);
    setBatchDone(0);
    setBatchTotal(missing.length);
    let done = 0;
    for (const client of missing) {
      // Adresse complète d'abord (pin précis), repli sur le CP seul (niveau commune).
      let coords = await geocodeAddress(client.adr || '', client.cp || '', client.ville || '');
      if (!coords && client.cp) coords = await geocodePostalCode(client.cp);
      if (coords) {
        await setRevendeurCoords(client.id, coords.lat, coords.lng);
        setClients((prev) =>
          prev.map((c) =>
            c.id === client.id
              ? { ...c, revendeur: { ...c.revendeur, lat: coords.lat, lng: coords.lng } }
              : c
          )
        );
      }
      done++;
      setBatchDone(done);
    }
    invalidateAdminCache('crm-clients');
    setBatchLoading(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-sv-primary mb-1">Revendeurs</h1>
          <p className="text-sm text-ink-secondary">
            Géolocalisation des clients pour le moteur de recherche revendeur.
          </p>
        </div>
        {noCoordCount > 0 && (
          <button
            onClick={handleBatchGeocode}
            disabled={batchLoading}
            className="px-4 py-2 bg-sv-teal hover:bg-sv-teal-dark text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-60 shrink-0"
          >
            {batchLoading
              ? `Géocodage… ${batchDone}/${batchTotal}`
              : `Géocoder ${noCoordCount} client${noCoordCount > 1 ? 's' : ''} sans coordonnées`}
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un client..."
          className="flex-1 min-w-[200px] px-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:border-sv-primary"
        />
        <div className="flex rounded-xl border border-border overflow-hidden text-sm">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium transition-colors cursor-pointer ${filter === 'all' ? 'bg-sv-primary text-white' : 'bg-white text-ink hover:bg-gray-50'}`}
          >
            Tous ({clients.length})
          </button>
          <button
            onClick={() => setFilter('no_coords')}
            className={`px-4 py-2 font-medium transition-colors cursor-pointer ${filter === 'no_coords' ? 'bg-sv-primary text-white' : 'bg-white text-ink hover:bg-gray-50'}`}
          >
            Sans coords ({noCoordCount})
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-ink-secondary text-sm">
          {noCoordCount === 0 && filter === 'no_coords'
            ? 'Tous les clients sont géolocalisés.'
            : 'Aucun client trouvé.'}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((client) => {
          const hasCoords = !!(client.revendeur?.lat && client.revendeur?.lng);
          return (
            <div
              key={client.id}
              className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-3 ${hasCoords ? 'border-border' : 'border-amber-200'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-ink truncate">
                    {client.enseigne || client.raison_soc}
                  </span>
                  {client.enseigne && (
                    <span className="text-xs text-ink-secondary truncate">({client.raison_soc})</span>
                  )}
                </div>
                <p className="text-xs text-ink-secondary mt-0.5">
                  {[client.adr, client.cp, client.ville].filter(Boolean).join(' — ')}
                </p>
              </div>
              <div className="shrink-0 text-right">
                {hasCoords ? (
                  <span className="text-[10px] text-ink-secondary">
                    {client.revendeur!.lat!.toFixed(3)}, {client.revendeur!.lng!.toFixed(3)}
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {(client.adr || client.cp) ? 'Non géolocalisé' : 'Pas d\'adresse'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
