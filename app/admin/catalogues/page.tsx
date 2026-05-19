'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { thClass, tdClass, btnPrimSm, btnSecSm, cardClass } from '@/lib/admin-styles';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CatalogueMeta {
  cat_id: number;
  cat_reference: string;
  cat_designation: string;
  cat_mode: string;
  cat_permanent: boolean;
}

interface ClientRow {
  id: string;
  erp_id?: string;
  raison_soc: string;
  enseigne?: string;
  email?: string;
}

interface SyncState {
  loading: boolean;
  result: string | null;
  error: string | null;
}

const BASE = 'https://us-central1-site-surprisez-vous.cloudfunctions.net';

function useSyncAction() {
  const [state, setState] = useState<SyncState>({ loading: false, result: null, error: null });

  const run = async (url: string, label: string) => {
    setState({ loading: true, result: null, error: null });
    try {
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erreur inconnue');
      const parts: string[] = [];
      if (data.catalogues !== undefined) parts.push(`${data.catalogues} catalogue(s)`);
      if (data.clients_lies !== undefined) parts.push(`${data.clients_lies} client(s) liés`);
      if (data.produits_restreints !== undefined) parts.push(`${data.produits_restreints} produit(s)`);
      if (data.produits !== undefined) parts.push(`${data.produits} produit(s)`);
      if (data.fichiers !== undefined) parts.push(`${data.fichiers} fichier(s)`);
      setState({ loading: false, result: parts.join(' · ') || 'OK', error: null });
    } catch (err: unknown) {
      setState({ loading: false, result: null, error: err instanceof Error ? err.message : 'Erreur' });
    }
  };

  return { state, run };
}

export default function AdminCataloguesPage() {
  const [catalogues, setCatalogues] = useState<CatalogueMeta[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [catalogueFiles, setCatalogueFiles] = useState<{ name: string; modifiedTime?: string }[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [fileStates, setFileStates] = useState<Record<string, SyncState>>({});

  const [expandedCat, setExpandedCat] = useState<number | null>(null);
  const [catClients, setCatClients] = useState<Record<number, ClientRow[] | 'loading'>>({});

  const allSync = useSyncAction();
  const metaSync = useSyncAction();
  const clientSync = useSyncAction();

  const toggleCat = async (catId: number) => {
    if (expandedCat === catId) { setExpandedCat(null); return; }
    setExpandedCat(catId);
    if (catClients[catId]) return; // déjà chargé
    setCatClients((prev) => ({ ...prev, [catId]: 'loading' }));
    try {
      const q = query(collection(getFirebaseDb(), 'clients'), where('cat_ids', 'array-contains', catId));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClientRow));
      rows.sort((a, b) => (a.raison_soc || '').localeCompare(b.raison_soc || ''));
      setCatClients((prev) => ({ ...prev, [catId]: rows }));
    } catch {
      setCatClients((prev) => ({ ...prev, [catId]: [] }));
    }
  };

  useEffect(() => {
    const db = getFirebaseDb();
    Promise.all([
      getDocs(collection(db, 'catalogues')),
      getDoc(doc(db, 'settings', 'sync-metadata')),
    ]).then(([snap, meta]) => {
      setCatalogues(snap.docs.map((d) => d.data() as CatalogueMeta).sort((a, b) => a.cat_id - b.cat_id));
      const syncMeta = meta.data();
      if (syncMeta?.derniere_sync_catalogues) setLastSync(syncMeta.derniere_sync_catalogues);
    }).catch(() => {}).finally(() => setLoadingList(false));

    // Charger la liste des fichiers catalogue disponibles
    fetch(`${BASE}/listCatalogueFiles`, { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.files) {
          setCatalogueFiles(data.files);
          setFileStates(Object.fromEntries(data.files.map((f: { name: string }) => [f.name, { loading: false, result: null, error: null }])));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFiles(false));
  }, []);

  const syncOneFile = async (fileName: string) => {
    setFileStates((prev) => ({ ...prev, [fileName]: { loading: true, result: null, error: null } }));
    try {
      const res = await fetch(`${BASE}/syncOneCatalogue?file=${encodeURIComponent(fileName)}`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erreur');
      setFileStates((prev) => ({ ...prev, [fileName]: { loading: false, result: `${data.produits ?? 0} produit(s)`, error: null } }));
    } catch (err: unknown) {
      setFileStates((prev) => ({ ...prev, [fileName]: { loading: false, result: null, error: err instanceof Error ? err.message : 'Erreur' } }));
    }
  };

  const refreshList = async () => {
    const snap = await getDocs(collection(getFirebaseDb(), 'catalogues'));
    setCatalogues(snap.docs.map((d) => d.data() as CatalogueMeta).sort((a, b) => a.cat_id - b.cat_id));
    setLastSync(new Date().toISOString());
  };

  return (
    <>
      <h1 className="text-xl font-bold mb-5">Catalogues clients</h1>

      {/* Sync globale */}
      <div className={`${cardClass} mb-4`}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-[15px] font-bold mb-1">Synchronisation complète</h2>
            <p className="text-xs text-gray-500">Méta + liaisons clients + tous les articles catalogues en une seule opération.</p>
            {lastSync && <p className="text-xs text-gray-400 mt-1">Dernière sync : {new Date(lastSync).toLocaleString('fr-FR')}</p>}
          </div>
          <button
            onClick={() => allSync.run(`${BASE}/syncCatalogues`, 'tout').then(refreshList)}
            disabled={allSync.state.loading}
            className={btnPrimSm}
          >
            {allSync.state.loading ? 'Synchronisation…' : 'Tout synchroniser'}
          </button>
        </div>
        {allSync.state.result && <Feedback type="ok" msg={allSync.state.result} />}
        {allSync.state.error && <Feedback type="err" msg={allSync.state.error} />}
      </div>

      {/* Actions partielles */}
      <div className={`${cardClass} mb-4`}>
        <h2 className="text-[15px] font-bold mb-3">Synchronisations partielles</h2>
        <div className="flex flex-wrap gap-3 mb-3">
          <SyncButton
            label="Méta catalogues"
            desc="catalogues.csv"
            loading={metaSync.state.loading}
            onClick={() => metaSync.run(`${BASE}/syncCataloguesMeta`, 'méta')}
          />
          <SyncButton
            label="Liaisons clients"
            desc="client_catalogue.csv"
            loading={clientSync.state.loading}
            onClick={() => clientSync.run(`${BASE}/syncClientCatalogues`, 'clients')}
          />
        </div>
        {metaSync.state.result && <Feedback type="ok" msg={`Méta : ${metaSync.state.result}`} />}
        {metaSync.state.error && <Feedback type="err" msg={metaSync.state.error} />}
        {clientSync.state.result && <Feedback type="ok" msg={`Liaisons : ${clientSync.state.result}`} />}
        {clientSync.state.error && <Feedback type="err" msg={clientSync.state.error} />}
      </div>

      {/* Articles par catalogue */}
      <div className={`${cardClass} mb-5`}>
        <h2 className="text-[15px] font-bold mb-3">Articles par catalogue</h2>
        {loadingFiles ? (
          <p className="text-sm text-gray-400">Chargement des fichiers Drive…</p>
        ) : catalogueFiles.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Aucun fichier catalogue_*.csv trouvé dans Drive.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {catalogueFiles.map((f) => {
              const s = fileStates[f.name] ?? { loading: false, result: null, error: null };
              return (
                <div key={f.name} className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
                  <span className="flex-1 text-sm font-mono text-gray-700">{f.name}</span>
                  {f.modifiedTime && <span className="text-xs text-gray-400 hidden sm:block">{new Date(f.modifiedTime).toLocaleDateString('fr-FR')}</span>}
                  {s.result && <span className="text-xs text-green-700 font-semibold">{s.result}</span>}
                  {s.error && <span className="text-xs text-red-600">{s.error}</span>}
                  <button
                    onClick={() => syncOneFile(f.name)}
                    disabled={s.loading}
                    className={btnSecSm}
                  >
                    {s.loading ? '…' : 'Sync'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Liste catalogues */}
      <div className={cardClass}>
        <h2 className="text-[15px] font-bold mb-3">Catalogues ({catalogues.length})</h2>
        {loadingList ? (
          <p className="text-sm text-gray-400">Chargement…</p>
        ) : catalogues.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Aucun catalogue. Lancez une synchronisation.</p>
        ) : (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className={thClass}></th>
                  <th className={thClass}>ID</th>
                  <th className={thClass}>Référence</th>
                  <th className={thClass}>Désignation</th>
                  <th className={thClass}>Mode</th>
                  <th className={thClass}>Permanent</th>
                </tr>
              </thead>
              <tbody>
                {catalogues.map((cat) => {
                  const isOpen = expandedCat === cat.cat_id;
                  const clients = catClients[cat.cat_id];
                  return (
                    <>
                      <tr
                        key={cat.cat_id}
                        onClick={() => toggleCat(cat.cat_id)}
                        className={`border-b border-gray-100 cursor-pointer transition-colors ${isOpen ? 'bg-sv-primary-light' : 'hover:bg-sv-primary-light/30'}`}
                      >
                        <td className="px-2 py-2.5 text-gray-400 w-6">
                          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </td>
                        <td className={`${tdClass} font-mono text-xs text-gray-500`}>{cat.cat_id}</td>
                        <td className={`${tdClass} font-semibold`}>{cat.cat_reference}</td>
                        <td className={tdClass}>{cat.cat_designation}</td>
                        <td className={tdClass}>{cat.cat_mode}</td>
                        <td className={tdClass}>{cat.cat_permanent ? 'Oui' : 'Non'}</td>
                      </tr>
                      {isOpen && (
                        <tr key={`${cat.cat_id}-clients`} className="border-b border-gray-100 bg-gray-50/60">
                          <td colSpan={6} className="px-6 py-3">
                            {clients === 'loading' ? (
                              <p className="text-xs text-gray-400">Chargement…</p>
                            ) : !clients || clients.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">Aucun client associé à ce catalogue.</p>
                            ) : (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-2">{clients.length} client(s)</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                                  {clients.map((c) => (
                                    <div key={c.id} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs">
                                      <span className="font-semibold text-ink">{c.enseigne || c.raison_soc}</span>
                                      {c.enseigne && c.raison_soc !== c.enseigne && (
                                        <span className="text-gray-400 ml-1">({c.raison_soc})</span>
                                      )}
                                      {c.erp_id && <span className="ml-1.5 font-mono text-gray-400">#{c.erp_id}</span>}
                                      {c.email && <div className="text-gray-400 mt-0.5 truncate">{c.email}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function SyncButton({ label, desc, loading, onClick }: { label: string; desc: string; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${btnSecSm} flex flex-col items-start gap-0.5 h-auto py-2`}
    >
      <span className="font-semibold">{loading ? '…' : label}</span>
      <span className="text-[10px] opacity-70 font-normal font-mono">{desc}</span>
    </button>
  );
}

function Feedback({ type, msg }: { type: 'ok' | 'err'; msg: string }) {
  return (
    <div className={`mt-2 rounded-lg p-2.5 text-xs ${type === 'ok' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
      {msg}
    </div>
  );
}
