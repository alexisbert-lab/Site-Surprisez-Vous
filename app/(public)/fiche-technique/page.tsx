'use client';

import { useState } from 'react';
import EditableText from '@/components/editable/EditableText';

type Lot = { id: string; emoji: string; bg: string };
type View = 'search' | 'lots' | 'detail';

const DEMO_LOTS: Lot[] = [
  { id: 'CF260055', emoji: '🥃', bg: '#1a1a2e' },
  { id: 'CF260002', emoji: '🥃', bg: '#2B3EA0' },
  { id: 'CF250150', emoji: '🥃', bg: '#6B4FA0' },
  { id: 'CF250082', emoji: '🥃', bg: '#3DBDB0' },
];

const PRODUCT_DETAIL = {
  ref: 'VAH2501',
  ean: '3701052836926',
  name: 'VERRE A WHISKY 18 ANS',
  specs: [
    { label: 'Capacité', value: '300 ml' },
    { label: 'Dimensions', value: 'Ø 8 cm × H 9,5 cm' },
    { label: 'Poids', value: '180 g' },
    { label: 'Matériau', value: 'Verre borosilicaté' },
    { label: 'Résistance thermique', value: '−20°C à +300°C' },
    { label: 'Résistance mécanique', value: 'Haute résistance aux chocs' },
    { label: 'Type d\'impression', value: 'Sérigraphie UV' },
    { label: 'Résistance lavage', value: 'Lave-vaisselle : oui' },
    { label: 'Résistance chimique', value: 'Encres inertes certifiées' },
    { label: 'Migration encres', value: 'Non détectée (LM 01)' },
    { label: 'Contact alimentaire', value: 'Conforme CE n° 10/2011' },
    { label: 'Bonnes pratiques', value: 'Ne pas dépasser 60°C en lave-vaisselle' },
    { label: 'Tests migration', value: 'Réalisés par laboratoire accrédité' },
    { label: 'Certification', value: 'CE, REACH' },
    { label: 'Test lave-vaisselle', value: '500 cycles — aucune altération' },
    { label: 'Compatibilité micro-ondes', value: 'Non recommandé' },
    { label: 'Test choc', value: 'Norme EN 12875-4' },
    { label: 'Type emballage', value: 'Boîte individuelle carton blanc' },
    { label: 'Marquage obligatoire', value: 'CE, EAN, pays de fabrication' },
    { label: 'Dimensions carton', value: '52 × 36 × 28 cm (lot de 6)' },
    { label: 'Pays de fabrication', value: 'Chine' },
    { label: 'Recyclabilité', value: 'Verre 100% recyclable' },
    { label: 'Substances dangereuses', value: 'Aucune substance SVHCs détectée' },
    { label: 'Emballage', value: 'Carton recyclé FSC' },
  ],
};

export default function FicheTechniquePage() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('search');
  const [selectedLot, setSelectedLot] = useState<string | null>(null);

  const handleSearch = () => {
    if (query.trim()) setView('lots');
  };

  const handleLotSelect = (id: string) => {
    setSelectedLot(id);
    setView('detail');
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-5 py-8">

      {/* ── Barre de recherche de référence ── */}
      <div className="bg-white border border-border rounded-xl p-5 mb-8 shadow-sm">
        <label className="block text-sm font-semibold text-ink mb-3">
          <EditableText page="fiche-technique" id="label_search">Saisissez la référence pour consulter la fiche technique</EditableText>
        </label>
        <div className="flex gap-2 flex-col sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Exemple : ECHB01, BALC05, SEXG003..."
            className="flex-1 px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-sv-primary focus:ring-2 focus:ring-sv-primary/20"
          />
          <button
            onClick={handleSearch}
            className="flex items-center justify-center gap-2 bg-sv-teal hover:bg-sv-teal-dark text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <EditableText page="fiche-technique" id="btn_consulter">Consulter</EditableText>
          </button>
        </div>
      </div>

      {/* ── PAGE : Sélection du lot ── */}
      {view === 'lots' && (
        <div>
          <h2 className="text-lg font-bold text-center text-ink mb-2 font-[family-name:var(--font-heading)]">
            <EditableText page="fiche-technique" id="lots_title">Séléctionnez le numéro de lot correspondant à votre produit</EditableText>
          </h2>
          <p className="text-sm text-center text-ink-secondary mb-8">
            <EditableText page="fiche-technique" id="lots_subtitle">(écrit sur le packaging, proche du code barre)</EditableText>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {DEMO_LOTS.map((lot) => (
              <div key={lot.id} className="bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div
                  className="h-40 flex items-center justify-center text-6xl"
                  style={{ backgroundColor: lot.bg }}
                >
                  {lot.emoji}
                </div>
                <div className="p-4 text-center">
                  <p className="text-sm font-semibold text-ink mb-3">N° de lot : <strong>{lot.id}</strong></p>
                  <button
                    onClick={() => handleLotSelect(lot.id)}
                    className="w-full py-2 bg-sv-primary hover:bg-sv-primary-dark text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <EditableText page="fiche-technique" id="btn_voir_produit">Voir ce produit</EditableText>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <button onClick={() => setView('search')} className="text-sm text-sv-primary hover:underline cursor-pointer">
              <EditableText page="fiche-technique" id="btn_nouvelle_recherche">← Nouvelle recherche</EditableText>
            </button>
          </div>
        </div>
      )}

      {/* ── PAGE : Détail produit ── */}
      {view === 'detail' && (
        <div>
          <button onClick={() => setView('lots')} className="text-sm text-sv-primary hover:underline mb-6 flex items-center gap-1 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <EditableText page="fiche-technique" id="btn_retour_lots">Retour aux lots</EditableText>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Gauche — image produit */}
            <div
              className="rounded-2xl overflow-hidden h-80 lg:h-auto flex items-center justify-center text-9xl"
              style={{ background: '#1a1a2e', minHeight: '380px' }}
            >
              🥃
            </div>

            {/* Droite — détails */}
            <div>
              <h1 className="text-2xl font-extrabold text-sv-primary uppercase mb-1 font-[family-name:var(--font-heading)]">
                {PRODUCT_DETAIL.name}
              </h1>
              <p className="text-sm text-ink-secondary mb-0.5">Référence : <strong className="text-ink">{PRODUCT_DETAIL.ref}</strong></p>
              <p className="text-sm text-ink-secondary mb-6">Code EAN : <strong className="text-ink">{PRODUCT_DETAIL.ean}</strong></p>
              <p className="text-xs text-ink-secondary mb-2">N° de lot sélectionné : <strong className="text-sv-primary">{selectedLot}</strong></p>

              <div className="space-y-0 border border-border rounded-xl overflow-hidden">
                {PRODUCT_DETAIL.specs.map((s, i) => (
                  <div
                    key={s.label}
                    className={`flex gap-4 px-4 py-2 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <span className="font-semibold text-ink min-w-[180px] shrink-0">{s.label}</span>
                    <span className="text-ink-secondary">{s.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <button className="inline-flex items-center gap-2 bg-sv-primary hover:bg-sv-primary-dark text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <EditableText page="fiche-technique" id="btn_download">Télécharger la fiche (pdf)</EditableText>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── État initial ── */}
      {view === 'search' && (
        <div className="text-center py-16 text-ink-secondary">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-base font-medium">
            <EditableText page="fiche-technique" id="initial_title">Saisissez une référence produit pour accéder à sa fiche technique</EditableText>
          </p>
          <p className="text-sm mt-2">
            <EditableText page="fiche-technique" id="initial_subtitle">Ex : VAH2501, BALC05, ECHB01...</EditableText>
          </p>
        </div>
      )}
    </div>
  );
}
