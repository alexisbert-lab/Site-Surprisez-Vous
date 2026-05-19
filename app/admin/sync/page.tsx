'use client';

import { useState } from 'react';
import { cardClass, btnPrimSm } from '@/lib/admin-styles';
import { invalidateAdminCache } from '@/lib/admin-cache';

const FUNCTIONS_BASE = 'https://us-central1-site-surprisez-vous.cloudfunctions.net';

interface SyncCard {
  key: string;
  label: string;
  description: string;
  endpoint: string;
  cacheTags?: string[];
  adminCacheKeys?: string[];
}

const SYNC_CARDS: SyncCard[] = [
  {
    key: 'articles',
    label: 'Articles / Produits',
    description: 'Met à jour la collection products depuis le Drive.',
    endpoint: `${FUNCTIONS_BASE}/syncArticles`,
    cacheTags: ['products', 'declinations'],
    adminCacheKeys: ['repartition-products'],
  },
  {
    key: 'statCategories',
    label: 'Codes statistiques',
    description: 'Met à jour la collection stat-categories depuis le Drive.',
    endpoint: `${FUNCTIONS_BASE}/syncStatCategories`,
    cacheTags: ['stat-categories'],
    adminCacheKeys: ['repartition-stat-cats'],
  },
  {
    key: 'tarifs',
    label: 'Grilles tarifaires',
    description: 'Met à jour la collection tarifs depuis le Drive.',
    endpoint: `${FUNCTIONS_BASE}/syncTarifs`,
    cacheTags: ['tarif-lines'],
    adminCacheKeys: ['crm-tarif-grids'],
  },
  {
    key: 'clients',
    label: 'Clients',
    description: 'Met à jour la collection clients depuis le Drive.',
    endpoint: `${FUNCTIONS_BASE}/syncClients`,
    adminCacheKeys: ['crm-clients'],
  },
  {
    key: 'commandes',
    label: 'Commandes ERP',
    description: 'Met à jour la collection commandes depuis le Drive.',
    endpoint: `${FUNCTIONS_BASE}/syncCommandes`,
    adminCacheKeys: ['orders'],
  },
  {
    key: 'colisage',
    label: 'Colisage',
    description: 'Met à jour le champ quantite_colisage sur les produits depuis le Drive.',
    endpoint: `${FUNCTIONS_BASE}/syncColisage`,
    cacheTags: ['products'],
    adminCacheKeys: ['repartition-products'],
  },
  {
    key: 'catalogues',
    label: 'Catalogues clients',
    description: 'Met à jour les catalogues, liaisons clients et restrictions produits depuis le Drive.',
    endpoint: `${FUNCTIONS_BASE}/syncCatalogues`,
    cacheTags: ['products'],
    adminCacheKeys: ['crm-clients', 'repartition-products'],
  },
];

interface CardState {
  syncing: boolean;
  result: string | null;
  error: string | null;
  lastSync: string | null;
}

function parseSyncResult(data: Record<string, unknown>): string {
  if (data.resultats) {
    return Object.entries(data.resultats as Record<string, Record<string, unknown>>)
      .map(([file, r]) => {
        const parts = [];
        if (r.synced !== undefined) parts.push(`${r.synced} enregistrements`);
        if (r.grids !== undefined) parts.push(`${r.grids} grilles`);
        if (r.catalogues !== undefined) parts.push(`${r.catalogues} catalogue(s)`);
        if (r.clients_lies !== undefined) parts.push(`${r.clients_lies} client(s) liés`);
        if (r.produits_restreints !== undefined) parts.push(`${r.produits_restreints} produit(s) restreints`);
        return `${file} : ${parts.join(', ') || 'OK'}`;
      })
      .join(' | ');
  }
  if (data.catalogues !== undefined) {
    return `${data.catalogues} catalogue(s), ${data.clients_lies} client(s) liés, ${data.produits_restreints} produit(s) restreints`;
  }
  return 'Synchronisation terminée';
}

async function runSync(card: SyncCard): Promise<string> {
  const res = await fetch(card.endpoint, { method: 'POST' });
  const data = await res.json() as Record<string, unknown>;
  if (!data.success) throw new Error((data.error as string) || 'Erreur inconnue');
  return parseSyncResult(data);
}

async function invalidateCaches(cards: SyncCard[]): Promise<void> {
  const allServerTags = [...new Set(cards.flatMap((c) => c.cacheTags ?? []))];
  const allAdminKeys = [...new Set(cards.flatMap((c) => c.adminCacheKeys ?? []))];

  if (allServerTags.length > 0) {
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: allServerTags }),
    });
  }
  if (allAdminKeys.length > 0) {
    invalidateAdminCache(...allAdminKeys);
  }
}

export default function AdminSyncPage() {
  const [states, setStates] = useState<Record<string, CardState>>(
    Object.fromEntries(SYNC_CARDS.map((c) => [c.key, { syncing: false, result: null, error: null, lastSync: null }]))
  );
  const [globalSyncing, setGlobalSyncing] = useState(false);

  const handleSync = async (card: SyncCard) => {
    setStates((prev) => ({ ...prev, [card.key]: { ...prev[card.key], syncing: true, result: null, error: null } }));
    try {
      const summary = await runSync(card);
      await invalidateCaches([card]);
      setStates((prev) => ({
        ...prev,
        [card.key]: { syncing: false, result: summary, error: null, lastSync: new Date().toISOString() },
      }));
    } catch (err: unknown) {
      setStates((prev) => ({
        ...prev,
        [card.key]: { ...prev[card.key], syncing: false, result: null, error: err instanceof Error ? err.message : 'Erreur inconnue' },
      }));
    }
  };

  const handleSyncAll = async () => {
    setGlobalSyncing(true);
    setStates((prev) =>
      Object.fromEntries(SYNC_CARDS.map((c) => [c.key, { ...prev[c.key], syncing: true, result: null, error: null }]))
    );

    const now = new Date().toISOString();
    const results = await Promise.allSettled(SYNC_CARDS.map((card) => runSync(card)));

    // Invalider tous les caches en une seule passe
    await invalidateCaches(SYNC_CARDS);
    // Vider intégralement l'admin cache
    invalidateAdminCache();

    setStates(
      Object.fromEntries(
        SYNC_CARDS.map((card, i) => {
          const r = results[i];
          return [
            card.key,
            r.status === 'fulfilled'
              ? { syncing: false, result: r.value, error: null, lastSync: now }
              : { syncing: false, result: null, error: r.reason instanceof Error ? r.reason.message : 'Erreur inconnue', lastSync: null },
          ];
        })
      )
    );
    setGlobalSyncing(false);
  };

  const anySyncing = globalSyncing || Object.values(states).some((s) => s.syncing);

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Synchronisation Drive</h1>
        <button
          onClick={handleSyncAll}
          disabled={anySyncing}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {globalSyncing ? 'Synchronisation en cours…' : 'Tout synchroniser'}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Chaque bouton déclenche la synchronisation d&apos;une source de données depuis Google Drive.
        Seule la collection concernée est mise à jour. Les caches serveur et admin sont invalidés automatiquement.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SYNC_CARDS.map((card) => {
          const state = states[card.key];
          return (
            <div key={card.key} className={cardClass}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-[15px] font-bold mb-1">{card.label}</h2>
                  <p className="text-xs text-gray-500 mb-2">{card.description}</p>
                  {state.lastSync && (
                    <p className="text-xs text-gray-400">
                      Dernière sync : {new Date(state.lastSync).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleSync(card)}
                  disabled={anySyncing}
                  className={`${btnPrimSm} shrink-0 mt-0.5`}
                >
                  {state.syncing ? 'En cours…' : 'Synchroniser'}
                </button>
              </div>

              {state.result && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs text-green-800">
                  {state.result}
                </div>
              )}
              {state.error && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-800">
                  Erreur : {state.error}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
