'use client';

import { useEffect, useState } from 'react';
import { useEditMode } from '@/lib/edit-mode-context';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';

export default function AdminEditBar() {
  const { profile } = useAuth();
  const { isEditMode, toggleEditMode, saveAll, isSaving, pendingCount } = useEditMode();
  const pathname = usePathname();
  const [isIframeMode, setIsIframeMode] = useState(false);

  useEffect(() => {
    setIsIframeMode(new URLSearchParams(window.location.search).get('_editmode') === '1');
  }, []);

  if (profile?.role !== 'admin' || isIframeMode) return null;

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-[100] h-11
        flex items-center px-4 gap-3 shadow-2xl
        transition-colors duration-300
        ${isEditMode ? 'bg-blue-600' : 'bg-sv-primary'}
      `}
    >
      <span className="hidden sm:block text-xs text-white/50 truncate max-w-[200px]">
        {pathname}
      </span>

      {isEditMode && (
        <span className="text-xs text-white/70 hidden sm:block">Mode édition actif</span>
      )}

      <div className="flex-1" />

      {isEditMode && pendingCount > 0 && (
        <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">
          {pendingCount} modif. non sauvegardée{pendingCount > 1 ? 's' : ''}
        </span>
      )}

      {isEditMode && (
        <button
          onClick={saveAll}
          disabled={isSaving || pendingCount === 0}
          className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer bg-green-500 hover:bg-green-400 text-white disabled:opacity-40 disabled:cursor-default transition-all"
        >
          {isSaving ? 'Sauvegarde…' : pendingCount === 0 ? '✓ Sauvegardé' : `Sauvegarder (${pendingCount})`}
        </button>
      )}

      <button
        onClick={toggleEditMode}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
          isEditMode
            ? 'bg-white text-blue-600 hover:bg-blue-50'
            : 'bg-white/15 text-white hover:bg-white/25 border border-white/30'
        }`}
      >
        {isEditMode ? "✕ Quitter l'édition" : '✎ Modifier la page'}
      </button>
    </div>
  );
}
