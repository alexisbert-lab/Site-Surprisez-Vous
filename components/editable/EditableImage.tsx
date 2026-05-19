'use client';

import { useEffect, useState } from 'react';
import { useEditMode } from '@/lib/edit-mode-context';
import { useIframeEdit } from '@/lib/iframe-edit-context';

interface Props {
  page: string;
  id: string;
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export default function EditableImage({ page, id, src, alt, className, fallback }: Props) {
  const { isEditMode, getContent, updateContent } = useEditMode();
  const { isIframeMode, getContent: getIframeContent, notifySelected } = useIframeEdit();
  const [mounted, setMounted] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (!isEditMode) setShowInput(false); }, [isEditMode]);

  const iframeSaved = mounted ? getIframeContent(page, id) : undefined;
  const editSaved   = mounted && !isIframeMode ? getContent(page, id) : undefined;
  const currentSrc  = iframeSaved ?? editSaved ?? src;

  // ── IFRAME MODE ────────────────────────────────────────────────────────────
  if (isIframeMode && mounted) {
    return (
      <span
        className="relative inline-block group"
        data-sv-value={currentSrc}
        onClick={(e) => {
          e.stopPropagation();
          notifySelected(page, id, 'image', e.currentTarget as HTMLElement);
        }}
        style={{ cursor: 'pointer' }}
        title="Cliquer pour modifier"
      >
        {currentSrc ? <img src={currentSrc} alt={alt} className={className} /> : (fallback ?? <img src="" alt={alt} className={className} />)}
        <span className="absolute inset-0 outline outline-2 outline-dashed outline-purple-400/60 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
    );
  }

  // ── NORMAL MODE ─────────────────────────────────────────────────────────────
  if (!isEditMode || !mounted) {
    if (!currentSrc && fallback) return <>{fallback}</>;
    return <img src={currentSrc} alt={alt} className={className} />;
  }

  // ── ADMIN INLINE EDIT MODE ──────────────────────────────────────────────────
  const openEdit = () => { setDraft(currentSrc); setShowInput(true); };
  const confirm  = () => { updateContent(page, id, draft); setShowInput(false); };

  return (
    <span className="relative inline-block group">
      <img src={currentSrc} alt={alt} className={className} />
      <span className="absolute inset-0 outline outline-2 outline-dashed outline-purple-400 rounded pointer-events-none" />

      {!showInput && (
        <button
          onClick={openEdit}
          className="absolute top-1 right-1 z-10 bg-purple-500 hover:bg-purple-600 text-white text-[11px] font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          ✎ Changer
        </button>
      )}

      {showInput && (
        <span className="absolute top-full left-0 z-50 mt-1 bg-white shadow-xl rounded-xl p-3 border border-purple-200 w-80 flex flex-col gap-2">
          <span className="text-xs font-semibold text-gray-600">URL de l&apos;image</span>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') setShowInput(false); }}
            autoFocus
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
            placeholder="https://..."
          />
          {draft && (
            <img src={draft} alt="aperçu" className="w-full h-20 object-cover rounded border border-gray-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <span className="flex gap-2">
            <button onClick={confirm} className="flex-1 px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold rounded cursor-pointer">
              Valider
            </button>
            <button onClick={() => setShowInput(false)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded cursor-pointer">
              Annuler
            </button>
          </span>
        </span>
      )}
    </span>
  );
}
