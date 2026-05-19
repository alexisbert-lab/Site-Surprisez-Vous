import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { getTarifLinesMap, type TarifLine } from './firestore/tarifs';

interface UseTarifResult {
  priceOf: (ref: string, fallback?: number) => number | undefined;
  lineOf: (ref: string) => TarifLine | undefined;
  gridId: string | null;
  hasTarif: boolean;
  loading: boolean;
}

// Cache module-level pour éviter de re-fetcher Firestore entre re-renders
const tarifCache = new Map<string, Map<string, TarifLine>>();

export function useTarif(): UseTarifResult {
  const { user, profile, loading: authLoading } = useAuth();
  const [linesMap, setLinesMap] = useState<Map<string, TarifLine>>(new Map());
  const [resolvedGridId, setResolvedGridId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const assignedGridId = profile?.tarif_grid_id ?? null;

  useEffect(() => {
    if (authLoading || !user) return;

    setLoading(true);

    const fetchLines = async (gridId: string): Promise<Map<string, TarifLine>> => {
      if (tarifCache.has(gridId)) return tarifCache.get(gridId)!;
      const map = await getTarifLinesMap(gridId);
      if (map.size > 0) tarifCache.set(gridId, map);
      return map;
    };

    const load = async () => {
      if (assignedGridId) {
        const map = await fetchLines(assignedGridId);
        if (map.size > 0) {
          setResolvedGridId(assignedGridId);
          setLinesMap(map);
          return;
        }
      }

      const defaultGridId = 'erp_gene11';
      const map = await fetchLines(defaultGridId);
      setResolvedGridId(map.size > 0 ? defaultGridId : null);
      setLinesMap(map);
    };

    load().catch((e) => console.error('[useTarif] Erreur chargement tarif:', e)).finally(() => setLoading(false));
  }, [authLoading, user, assignedGridId]);

  const priceOf = useCallback((ref: string, fallback?: number) => {
    const line = linesMap.get(ref);
    return line !== undefined ? line.prix_ht : fallback;
  }, [linesMap]);

  const lineOf = useCallback((ref: string) => linesMap.get(ref), [linesMap]);

  return {
    priceOf,
    lineOf,
    gridId: resolvedGridId,
    hasTarif: linesMap.size > 0,
    loading,
  };
}
