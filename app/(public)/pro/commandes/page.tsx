'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getCommandesByClientId, type Commande, ETAT_LABELS } from '@/lib/firestore/orders';

const ETAT_STYLES: Record<string, string> = {
  V: 'bg-green-100 text-green-800',
  C: 'bg-gray-100 text-gray-600',
  A: 'bg-red-100 text-red-700',
  E: 'bg-yellow-100 text-yellow-800',
};

export default function CommandesPage() {
  const { profile, loading: authLoading } = useAuth();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!profile?.client_id) {
      setLoading(false);
      return;
    }
    getCommandesByClientId(profile.client_id)
      .then(setCommandes)
      .catch(() => setError('Impossible de charger les commandes.'))
      .finally(() => setLoading(false));
  }, [profile, authLoading]);

  if (authLoading || loading) {
    return <div className="text-center py-12 text-ink-secondary">Chargement…</div>;
  }

  if (!profile || profile.role === 'public') {
    return <div className="text-center py-12 text-ink-secondary">Accès réservé aux professionnels.</div>;
  }

  if (!profile.client_id) {
    return <div className="text-center py-12 text-ink-secondary">Aucun compte client associé à votre profil.</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-sv-primary mb-6">Mes commandes</h1>

      {commandes.length === 0 ? (
        <p className="text-ink-secondary">Aucune commande trouvée.</p>
      ) : (
        <div className="space-y-3">
          {commandes.map((cmd) => (
            <div key={cmd.id} className="bg-white border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-ink">{cmd.reference}</p>
                  <p className="text-sm text-ink-secondary mt-0.5">
                    Commandé le {cmd.date}
                    {cmd.date_demande && ` · Livraison souhaitée le ${cmd.date_demande}`}
                  </p>
                  {(cmd.adr_liv_voie || cmd.adr_liv_commune) && (
                    <p className="text-sm text-ink-secondary mt-0.5">
                      {[cmd.adr_liv_destinataire, cmd.adr_liv_voie, cmd.adr_liv_cp, cmd.adr_liv_commune, cmd.adr_liv_pays]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                  {cmd.notes && (
                    <p className="text-xs text-ink-secondary mt-1 italic">{cmd.notes}</p>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ETAT_STYLES[cmd.etat] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ETAT_LABELS[cmd.etat] ?? cmd.etat}
                  </span>
                  <p className="text-sm font-semibold text-ink">{cmd.prix_ttc.toFixed(2)} € TTC</p>
                  <p className="text-xs text-ink-secondary">HT : {cmd.prix_ht.toFixed(2)} €</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
