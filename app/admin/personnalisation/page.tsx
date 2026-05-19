'use client';

import { useState, useEffect } from 'react';
import {
  getThemeColors, saveThemeColors, DEFAULT_COLORS, type ThemeColors,
} from '@/lib/firestore/site-settings';
import { useSiteTheme } from '@/lib/site-theme-context';
import { btnPrimSm, btnSecSm, cardClass } from '@/lib/admin-styles';

export default function PersonnalisationPage() {
  const { refresh } = useSiteTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS);

  useEffect(() => {
    getThemeColors().then((c) => { setColors(c); setLoading(false); });
  }, []);

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

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
