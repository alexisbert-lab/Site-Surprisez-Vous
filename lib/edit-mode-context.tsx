'use client';

import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-context';
import { savePageContent } from './firestore/page-content';
import { api } from './api';

interface EditModeContextValue {
  isEditMode: boolean;
  toggleEditMode: () => void;
  getContent: (page: string, id: string) => string | undefined;
  updateContent: (page: string, id: string, value: string) => void;
  saveAll: () => Promise<void>;
  isSaving: boolean;
  pendingCount: number;
}

const EditModeContext = createContext<EditModeContextValue>({
  isEditMode: false,
  toggleEditMode: () => {},
  getContent: () => undefined,
  updateContent: () => {},
  saveAll: async () => {},
  isSaving: false,
  pendingCount: 0,
});

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const pathname = usePathname();
  const isAdmin = profile?.role === 'admin';

  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState<Record<string, string>>({});
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const loadedPages = useRef(new Set<string>());

  const currentPageId = pathname === '/' ? 'home' : pathname.replace(/^\//, '').replace(/\//g, '-');

  const loadPage = useCallback(async (pageId: string) => {
    if (loadedPages.current.has(pageId)) return;
    loadedPages.current.add(pageId);
    const data = await api.getPageContent(pageId);
    if (Object.keys(data).length > 0) {
      setContent((prev) => {
        const next = { ...prev };
        Object.entries(data).forEach(([id, val]) => { next[`${pageId}|${id}`] = val; });
        return next;
      });
    }
  }, []);

  useEffect(() => { loadPage(currentPageId); }, [currentPageId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleEditMode = useCallback(async () => {
    if (!isAdmin) return;
    if (!isEditMode) await loadPage(currentPageId);
    setIsEditMode((prev) => !prev);
  }, [isAdmin, isEditMode, currentPageId, loadPage]);

  const getContent = useCallback(
    (page: string, id: string) => {
      const key = `${page}|${id}`;
      return pendingChanges[key] ?? content[key];
    },
    [content, pendingChanges],
  );

  const updateContent = useCallback((page: string, id: string, value: string) => {
    setPendingChanges((prev) => ({ ...prev, [`${page}|${id}`]: value }));
  }, []);

  const saveAll = useCallback(async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    setIsSaving(true);
    const byPage: Record<string, Record<string, string>> = {};
    Object.entries(pendingChanges).forEach(([key, value]) => {
      const pipeIdx = key.indexOf('|');
      const page = key.slice(0, pipeIdx);
      const id = key.slice(pipeIdx + 1);
      if (!byPage[page]) byPage[page] = {};
      byPage[page][id] = value;
    });
    await Promise.all(Object.entries(byPage).map(([page, data]) => savePageContent(page, data)));
    setContent((prev) => ({ ...prev, ...pendingChanges }));
    setPendingChanges({});
    setIsSaving(false);
  }, [pendingChanges]);

  return (
    <EditModeContext.Provider
      value={{
        isEditMode,
        toggleEditMode,
        getContent,
        updateContent,
        saveAll,
        isSaving,
        pendingCount: Object.keys(pendingChanges).length,
      }}
    >
      {children}
    </EditModeContext.Provider>
  );
}

export const useEditMode = () => useContext(EditModeContext);
