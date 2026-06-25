'use client';

import { Download, BookOpen } from 'lucide-react';
import type { CatalogueSettings } from '@/lib/firestore/site-settings';

/** Bouton(s) d'accès au catalogue : téléchargement PDF et, si configuré, feuilletage Calaméo. */
export default function CatalogueDownload({ settings }: { settings: CatalogueSettings }) {
  const hasPdf = !!settings.pdf_url;
  const hasCalameo = !!settings.calameo_url;
  if (!hasPdf && !hasCalameo) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {hasCalameo && (
        <a
          href={settings.calameo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-sv-primary/30 text-sv-primary hover:bg-sv-primary-light transition-all"
        >
          <BookOpen className="w-4 h-4" /> Feuilleter
        </a>
      )}
      {hasPdf && (
        <a
          href={settings.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          download={settings.pdf_filename || undefined}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-sv-primary text-white hover:bg-sv-primary-dark hover:shadow-md transition-all"
        >
          <Download className="w-4 h-4" /> Télécharger le catalogue (PDF)
        </a>
      )}
    </div>
  );
}
