'use client';

import { useState, useEffect } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  getThemeColors, saveThemeColors, DEFAULT_COLORS, type ThemeColors,
  getCatalogueSettings, saveCatalogueSettings, DEFAULT_CATALOGUE, type CatalogueSettings,
} from '@/lib/firestore/site-settings';
import { getFirebaseStorage } from '@/lib/firebase';
import { useSiteTheme } from '@/lib/site-theme-context';
import { btnPrimSm, btnSecSm, cardClass, inputSm } from '@/lib/admin-styles';
import { FileText, Upload, X } from 'lucide-react';

export default function PersonnalisationPage() {
  const { refresh } = useSiteTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS);
  const [catalogue, setCatalogue] = useState<CatalogueSettings>(DEFAULT_CATALOGUE);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [savingCat, setSavingCat] = useState(false);
  const [savedCat, setSavedCat] = useState(false);

  useEffect(() => {
    Promise.all([getThemeColors(), getCatalogueSettings()]).then(([c, cat]) => {
      setColors(c);
      setCatalogue(cat);
      setLoading(false);
    });
  }, []);

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const handlePdfUpload = async (file: File) => {
    setUploadingPdf(true);
    try {
      const storage = getFirebaseStorage();
      const sRef = storageRef(storage, `catalogue/catalogue_${Date.now()}_${file.name}`);
      const snap = await uploadBytes(sRef, file);
      const url = await getDownloadURL(snap.ref);
      setCatalogue((c) => ({ ...c, pdf_url: url, pdf_filename: file.name }));
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSaveCatalogue = async () => {
    setSavingCat(true);
    await saveCatalogueSettings(catalogue);
    await fetch('/api/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tags: ['site-settings'] }) });
    setSavingCat(false);
    setSavedCat(true);
    setTimeout(() => setSavedCat(false), 2000);
  };

  const handleSaveColors = async () => {
    setSaving(true);
    await saveThemeColors(colors);
    await Promise.all([
      refresh(),
      fetch('/api/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tags: ['site-settings'] }) }),
    ]);
    setSaving(false);
    flash();
  };

  if (loading) return <p className="text-gray-500 italic">Chargement...</p>;

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Personnalisation du site</h1>
        {saved && <span className="text-green-600 text-sm font-semibold">✓ Sauvegardé</span>}
      </div>

      <div className="space-y-6">
        <div className={cardClass}>
          <h2 className="font-bold text-ink mb-4">Fonds de sections</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ColorField
              label="Fond de page"
              description="Couleur de fond principale du site"
              value={colors.bg_page}
              onChange={(v) => setColors((c) => ({ ...c, bg_page: v }))}
            />
            <ColorField
              label="Fond de section alternée"
              description="Sections avec fond légèrement différent"
              value={colors.bg_section_alt}
              onChange={(v) => setColors((c) => ({ ...c, bg_section_alt: v }))}
            />
            <ColorField
              label="Fond de carte / bloc"
              description="Cards, blocs encadrés"
              value={colors.bg_card}
              onChange={(v) => setColors((c) => ({ ...c, bg_card: v }))}
            />
          </div>
        </div>

        <div className={cardClass}>
          <h2 className="font-bold text-ink mb-4">Palette de couleurs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ColorField
              label="Couleur principale"
              description="Header, footer, boutons primaires"
              value={colors.sv_primary}
              onChange={(v) => setColors((c) => ({ ...c, sv_primary: v }))}
            />
            <ColorField
              label="Principale — sombre"
              description="État hover des éléments principaux"
              value={colors.sv_primary_dark}
              onChange={(v) => setColors((c) => ({ ...c, sv_primary_dark: v }))}
            />
            <ColorField
              label="Principale — clair"
              description="Fonds, sélections, bordures légères"
              value={colors.sv_primary_light}
              onChange={(v) => setColors((c) => ({ ...c, sv_primary_light: v }))}
            />
            <ColorField
              label="Couleur accent"
              description="Boutons secondaires, badges, highlights"
              value={colors.sv_orange}
              onChange={(v) => setColors((c) => ({ ...c, sv_orange: v }))}
            />
            <ColorField
              label="Accent — sombre"
              description="État hover des éléments accent"
              value={colors.sv_orange_dark}
              onChange={(v) => setColors((c) => ({ ...c, sv_orange_dark: v }))}
            />
            <ColorField
              label="Accent — clair"
              description="Fonds accent légers"
              value={colors.sv_orange_light}
              onChange={(v) => setColors((c) => ({ ...c, sv_orange_light: v }))}
            />
          </div>
        </div>

        {/* Aperçu */}
        <div className={cardClass}>
          <h2 className="font-bold text-ink mb-4">Aperçu en temps réel</h2>
          <div className="rounded-xl overflow-hidden border border-border">
            <div className="h-12 px-4 flex items-center gap-5" style={{ backgroundColor: colors.sv_primary }}>
              <span className="text-white font-bold text-sm font-[family-name:var(--font-heading)]">
                Surprisez-Vous
              </span>
              <span className="text-white/80 text-xs hidden sm:inline">Showroom</span>
              <span className="text-white/80 text-xs hidden sm:inline">Espace Pro</span>
              <div className="ml-auto">
                <span className="px-3 py-1 rounded-lg text-xs font-semibold border border-white/40 text-white">
                  Espace Pro
                </span>
              </div>
            </div>
            <div className="bg-white p-5 flex flex-wrap gap-3 items-center">
              <button
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                style={{ backgroundColor: colors.sv_primary }}
              >
                Bouton principal
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold border"
                style={{
                  backgroundColor: colors.sv_orange_light,
                  color: colors.sv_orange_dark,
                  borderColor: colors.sv_orange + '33',
                }}
              >
                Bouton secondaire
              </button>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: colors.sv_orange }}
              >
                Badge accent
              </span>
              <div
                className="px-3 py-1 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: colors.sv_primary_light, color: colors.sv_primary }}
              >
                Tag primaire
              </div>
            </div>
            <div className="h-10 px-4 flex items-center" style={{ backgroundColor: colors.sv_primary }}>
              <span className="text-white/50 text-xs">© {new Date().getFullYear()} Surprisez-Vous</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button className={btnPrimSm} onClick={handleSaveColors} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Appliquer les couleurs'}
          </button>
          <button className={btnSecSm} onClick={() => setColors(DEFAULT_COLORS)}>
            Réinitialiser
          </button>
        </div>

        {/* Catalogue téléchargeable */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-ink">Catalogue téléchargeable</h2>
            {savedCat && <span className="text-green-600 text-sm font-semibold">✓ Sauvegardé</span>}
          </div>
          <p className="text-xs text-ink-secondary mb-4">
            PDF proposé au téléchargement dans le catalogue pro. Le lien Calaméo (feuilletage) est optionnel et pourra être activé plus tard.
          </p>

          <div className="space-y-4">
            {/* PDF */}
            <div className="p-3 border border-border rounded-xl">
              <div className="text-sm font-semibold text-ink mb-2">Fichier PDF</div>
              {catalogue.pdf_url ? (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-sv-primary shrink-0" />
                  <a href={catalogue.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sv-primary hover:underline truncate flex-1">
                    {catalogue.pdf_filename || 'catalogue.pdf'}
                  </a>
                  <button
                    onClick={() => setCatalogue((c) => ({ ...c, pdf_url: '', pdf_filename: '' }))}
                    className="p-1 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
                    title="Retirer le PDF"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-ink-secondary italic">Aucun PDF chargé.</p>
              )}
              <label className={`${btnSecSm} inline-flex items-center gap-1.5 mt-3 ${uploadingPdf ? 'opacity-60 pointer-events-none' : ''}`}>
                <Upload className="w-4 h-4" />
                {uploadingPdf ? 'Chargement...' : (catalogue.pdf_url ? 'Remplacer le PDF' : 'Charger un PDF')}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={uploadingPdf}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); e.target.value = ''; }}
                />
              </label>
            </div>

            {/* Calaméo (optionnel) */}
            <div className="p-3 border border-border rounded-xl">
              <div className="text-sm font-semibold text-ink mb-1">Lien Calaméo (optionnel)</div>
              <div className="text-xs text-ink-secondary mb-2">URL de la publication Calaméo, pour le feuilletage en ligne.</div>
              <input
                type="url"
                value={catalogue.calameo_url}
                onChange={(e) => setCatalogue((c) => ({ ...c, calameo_url: e.target.value }))}
                placeholder="https://www.calameo.com/read/..."
                className={inputSm + ' w-full'}
              />
            </div>
          </div>

          <div className="mt-4">
            <button className={btnPrimSm} onClick={handleSaveCatalogue} disabled={savingCat || uploadingPdf}>
              {savingCat ? 'Sauvegarde...' : 'Enregistrer le catalogue'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ColorField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-xl">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg border border-border cursor-pointer flex-shrink-0"
        title={label}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-ink truncate">{label}</div>
        <div className="text-xs text-ink-secondary truncate">{description}</div>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 px-2 py-1 border border-border rounded-lg text-xs font-mono flex-shrink-0"
        placeholder="#000000"
        maxLength={7}
      />
    </div>
  );
}
