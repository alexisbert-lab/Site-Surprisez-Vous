'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { getCommandesByClientId, Commande, ETAT_LABELS } from '@/lib/firestore/orders';

const ETAT_COLORS: Record<string, string> = {
  C: 'bg-green-100 text-green-800',
  V: 'bg-blue-100 text-blue-800',
  E: 'bg-yellow-100 text-yellow-800',
  A: 'bg-red-100 text-red-800',
  G: 'bg-purple-100 text-purple-800',
};

export default function MesCommandesPage() {
  const { profile } = useAuth();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const clientId = profile?.client_erp_id ?? profile?.client_id;
    if (!clientId) {
      setLoading(false);
      return;
    }

    getCommandesByClientId(clientId)
      .then(setCommandes)
      .catch((err) => { console.error('Erreur commandes:', err); setError('Impossible de charger vos commandes.'); })
      .finally(() => setLoading(false));
  }, [profile?.client_erp_id]);

  return (
    <div className="max-w-4xl">
      <Breadcrumb
        items={[{ label: 'Mon Espace', href: '/pro/dashboard' }, { label: 'Mes Commandes' }]}
        className="mb-6"
      />

      <h1 className="text-2xl font-extrabold text-sv-primary mb-6 font-[family-name:var(--font-heading)]">
        Mes Commandes
      </h1>

      {loading && (
        <p className="text-sm text-ink-secondary">Chargement…</p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && !profile?.client_erp_id && !profile?.client_id && (
        <p className="text-sm text-ink-secondary">
          Aucun compte client associé à votre profil. Contactez votre conseiller.
        </p>
      )}

      {!loading && !error && profile?.client_id && commandes.length === 0 && (
        <p className="text-sm text-ink-secondary">Vous n'avez pas encore de commandes.</p>
      )}

      {commandes.length > 0 && (
        <div className="flex flex-col gap-3">
          {commandes.map((cmd) => (
            <div
              key={cmd.id}
              className="bg-white border border-border rounded-xl p-5 flex items-start justify-between gap-4 max-sm:flex-col"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-ink">{cmd.reference}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ETAT_COLORS[cmd.etat] ?? 'bg-gray-100 text-gray-700'}`}>
                    {ETAT_LABELS[cmd.etat] ?? cmd.etat}
                  </span>
                </div>
                <span className="text-xs text-ink-secondary">
                  Commandé le {cmd.date_demande || cmd.date}
                  {cmd.date_expedition ? ` · Expédié le ${cmd.date_expedition}` : ''}
                </span>
                {cmd.adr_liv_commune && (
                  <span className="text-xs text-ink-secondary">
                    Livraison : {cmd.adr_liv_destinataire ? `${cmd.adr_liv_destinataire} · ` : ''}
                    {[cmd.adr_liv_voie, cmd.adr_liv_cp, cmd.adr_liv_commune].filter(Boolean).join(' ')}
                  </span>
                )}
                {cmd.notes && (
                  <span className="text-xs text-ink-secondary italic whitespace-pre-line">{cmd.notes}</span>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-ink">{cmd.prix_ttc.toFixed(2)} € TTC</p>
                <p className="text-xs text-ink-secondary">{cmd.prix_ht.toFixed(2)} € HT</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
