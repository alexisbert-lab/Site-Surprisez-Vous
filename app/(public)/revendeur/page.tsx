'use client';

import { useState, type FormEvent } from 'react';
import EditableText from '@/components/editable/EditableText';
import EditableLink from '@/components/editable/EditableLink';
import {
  getActiveRevendeurs,
  geocodePostalCode,
  distanceKm,
  type RevendeurResult,
} from '@/lib/firestore/revendeurs';

export default function RevendeurPage() {
  const [codePostal, setCodePostal] = useState('');
  const [rayon, setRayon] = useState('20');
  const [results, setResults] = useState<RevendeurResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{5}$/.test(codePostal)) {
      setError('Veuillez saisir un code postal valide (5 chiffres)');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const origin = await geocodePostalCode(codePostal);
      if (!origin) {
        setError('Code postal introuvable. Vérifiez votre saisie.');
        setResults([]);
        return;
      }
      const all = await getActiveRevendeurs();
      const rayonKm = parseInt(rayon, 10);
      const filtered = all
        .map((r) => ({ ...r, distance: distanceKm(origin.lat, origin.lng, r.lat, r.lng) }))
        .filter((r) => r.distance <= rayonKm)
        .sort((a, b) => a.distance - b.distance);
      setResults(filtered);
    } catch {
      setError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-5 py-10">
      <h1 className="text-3xl font-extrabold text-sv-primary mb-2 font-[family-name:var(--font-heading)]">
        <EditableText page="revendeur" id="h1">Vous recherchez un revendeur près de chez vous ?</EditableText>
      </h1>
      <p className="text-ink-secondary mb-8">
        <EditableText page="revendeur" id="intro">Saisissez votre code postal pour trouver les revendeurs les plus proches.</EditableText>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white border border-border rounded-xl p-6 space-y-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Code postal *</label>
                <input
                  value={codePostal}
                  onChange={(e) => setCodePostal(e.target.value)}
                  placeholder="Ex : 75001"
                  maxLength={5}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-sv-primary focus:ring-2 focus:ring-sv-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Rayon de recherche</label>
                <select
                  value={rayon}
                  onChange={(e) => setRayon(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-sv-primary bg-white"
                >
                  <option value="10">10 km</option>
                  <option value="20">20 km</option>
                  <option value="50">50 km</option>
                  <option value="100">100 km</option>
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sv-teal hover:bg-sv-teal-dark text-white font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Recherche en cours...' : <EditableText page="revendeur" id="btn_search">Rechercher un revendeur</EditableText>}
            </button>
          </form>

          {/* Résultats */}
          {searched && !loading && (
            <div className="mt-6">
              {results.length === 0 ? (
                <div className="text-center py-10 text-ink-secondary text-sm bg-white border border-border rounded-xl">
                  <div className="text-4xl mb-3">📍</div>
                  <p><EditableText page="revendeur" id="msg_no_results">Aucun revendeur trouvé dans cette zone.</EditableText></p>
                  <p className="mt-1"><EditableText page="revendeur" id="msg_no_results_hint">Essayez d&apos;élargir le rayon de recherche.</EditableText></p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((r) => (
                    <div key={r.id} className="bg-white border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-ink">{r.nom}</h3>
                        <span className="text-xs text-ink-secondary shrink-0">
                          {r.distance! < 1 ? '< 1 km' : `${Math.round(r.distance!)} km`}
                        </span>
                      </div>
                      <p className="text-xs text-ink-secondary">
                        {r.adresse}{r.adresse ? ', ' : ''}{r.codePostal} {r.ville}
                      </p>
                      {r.telephone && <p className="text-xs text-sv-primary mt-1">{r.telephone}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Encart infos */}
        <div className="space-y-4">
          <div className="bg-sv-primary-light border border-sv-primary/20 rounded-xl p-5">
            <h3 className="font-bold text-sv-primary mb-2 text-sm">
              <EditableText page="revendeur" id="sidebar_howto_title">Comment ça marche ?</EditableText>
            </h3>
            <ol className="text-sm text-ink-secondary space-y-2">
              <li className="flex gap-2"><span className="font-bold text-sv-primary shrink-0">1.</span>Saisissez votre code postal</li>
              <li className="flex gap-2"><span className="font-bold text-sv-primary shrink-0">2.</span>Choisissez un rayon de recherche</li>
              <li className="flex gap-2"><span className="font-bold text-sv-primary shrink-0">3.</span>Consultez les revendeurs proches</li>
            </ol>
          </div>
          <div className="bg-sv-teal-light border border-sv-teal/20 rounded-xl p-5">
            <h3 className="font-bold text-sv-teal-dark mb-2 text-sm">
              <EditableText page="revendeur" id="sidebar_pro_title">Vous êtes professionnel ?</EditableText>
            </h3>
            <p className="text-sm text-ink-secondary mb-3">
              <EditableText page="revendeur" id="sidebar_pro_text">Ouvrez votre compte pro et commandez directement en ligne avec des tarifs remisés.</EditableText>
            </p>
            <EditableLink
              page="revendeur"
              id="sidebar_pro_cta"
              href="/pro/inscription"
              className="block text-center py-2 bg-sv-teal hover:bg-sv-teal-dark text-white font-bold text-sm rounded-lg transition-colors"
            >
              Devenir revendeur
            </EditableLink>
          </div>
        </div>
      </div>
    </div>
  );
}
