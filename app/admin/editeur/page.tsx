'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from '@/lib/firebase';
import { savePageContent } from '@/lib/firestore/page-content';
import { getThemeColors, DEFAULT_COLORS, type ThemeColors } from '@/lib/firestore/site-settings';
import { api } from '@/lib/api';
import { invalidateCached } from '@/lib/client-cache';
import { useAuth } from '@/lib/auth-context';
import type { Product } from '@/lib/firestore/products';

// ── Pages disponibles ──────────────────────────────────────────────────────
const PAGES = [
  // Composants globaux
  { id: 'header',          label: '— Header',          path: '/header-preview' },
  { id: 'footer',          label: '— Footer',          path: '/footer-preview' },
  // Pages publiques
  { id: 'home',            label: 'Accueil',            path: '/' },
  { id: 'pro',              label: 'Espace Pro',         path: '/pro' },
  { id: 'pro-inscription',  label: 'Inscription pro',   path: '/pro/inscription' },
  { id: 'pro-contact',      label: 'Contact pro',       path: '/pro/contact' },
  { id: 'showroom',         label: 'Showroom',          path: '/showroom' },
  { id: 'revendeur',        label: 'Revendeurs',        path: '/revendeur' },
  { id: 'fiche-technique',  label: 'Fiches techniques', path: '/fiche-technique' },
  { id: 'mentions-legales', label: 'Mentions légales',  path: '/mentions-legales' },
  { id: 'univers',          label: 'Univers',           path: '/univers' },
];

const INTERNAL_ROUTES = [
  { label: '— Pages publiques —',      path: '' },
  { label: 'Accueil',                   path: '/' },
  { label: 'Catalogue',                 path: '/catalogue' },
  { label: 'Univers / Gammes',          path: '/univers' },
  { label: 'Showroom',                  path: '/showroom' },
  { label: 'Revendeurs',                path: '/revendeur' },
  { label: 'Devenir client pro',        path: '/espace-pro' },
  { label: 'Fiches techniques',         path: '/fiche-technique' },
  { label: 'Boîte à idées',            path: '/boite-a-idees' },
  { label: 'Mentions légales',          path: '/mentions-legales' },
  { label: 'Connexion',                 path: '/connexion' },
  { label: '— Espace pro —',           path: '' },
  { label: 'Espace pro (accueil)',      path: '/pro' },
  { label: 'Contact pro',               path: '/pro/contact' },
  { label: 'Inscription pro',           path: '/pro/inscription' },
  { label: 'CGV',                       path: '/pro/cgv' },
  { label: 'Mes commandes',             path: '/pro/espace-client/commandes' },
  { label: 'Tableau de bord pro',       path: '/pro/dashboard' },
  { label: '— Ancres —',               path: '' },
  { label: 'Haut de page',             path: '#' },
];

const FONT_FAMILIES = [
  { label: 'Hérité',    value: '' },
  { label: 'Montserrat (titres)', value: 'var(--font-heading), Montserrat, sans-serif' },
  { label: 'Nunito (corps)',      value: 'var(--font-body), Nunito, sans-serif' },
  { label: 'Serif',     value: 'Georgia, serif' },
  { label: 'Mono',      value: 'monospace' },
];

const FONT_WEIGHTS = [
  { label: 'Normal',     value: '400' },
  { label: 'Medium',     value: '500' },
  { label: 'Semi-gras',  value: '600' },
  { label: 'Gras',       value: '700' },
  { label: 'Extra-gras', value: '800' },
];

// ── Types ──────────────────────────────────────────────────────────────────
interface SelectedEl {
  page: string;
  id:   string;
  type: 'text' | 'multiline' | 'image' | 'link';
  value: string;
  styles: { color: string; size: string; weight: string; font: string };
}

interface SelectedSection {
  sectionId: string;
  key: string;
  currentIds: string[];
}

interface SelectedBlock {
  page: string;
  id: string;
  styles: Record<string, string>;
  computed: Record<string, string>;
}

const BLOCK_STYLE_PROPS: { prop: string; label: string; type: string; placeholder?: string }[] = [
  { prop: 'bg_color',      label: 'Couleur de fond',   type: 'color' },
  { prop: 'bg_gradient',   label: 'Dégradé de fond',   type: 'gradient' },
  { prop: 'text_color',    label: 'Couleur du texte',  type: 'color' },
  { prop: 'border_radius', label: 'Border radius',     type: 'text', placeholder: 'ex: 12px, 50%' },
  { prop: 'padding',       label: 'Padding',           type: 'text', placeholder: 'ex: 12px 24px' },
  { prop: 'margin',        label: 'Marge',             type: 'text', placeholder: 'ex: 0 auto' },
  { prop: 'border',        label: 'Bordure',           type: 'text', placeholder: 'ex: 1px solid #ccc' },
  { prop: 'opacity',       label: 'Opacité',           type: 'range' },
  { prop: 'box_shadow',    label: 'Ombre',             type: 'text', placeholder: 'ex: 0 4px 12px rgba(0,0,0,0.1)' },
  { prop: 'width',         label: 'Largeur',           type: 'text', placeholder: 'ex: 100%, 320px' },
  { prop: 'height',        label: 'Hauteur',           type: 'text', placeholder: 'ex: auto, 200px' },
];

const GRADIENT_PRESETS = [
  { label: 'Rose→Violet', value: 'linear-gradient(135deg, #E8185A, #6B4FA0)' },
  { label: 'Turquoise',   value: 'linear-gradient(135deg, #3DBDB0, #2a9a8e)' },
  { label: 'Nuit',        value: 'linear-gradient(135deg, #1e2a35, #3b4e61)' },
  { label: 'Or',          value: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { label: 'Crème',       value: 'linear-gradient(180deg, #fffbf4, #fff)' },
];

interface SelectedBrandLogos {
  key: string;
  urls: string[];
}

// ── Composant principal ────────────────────────────────────────────────────
export default function EditeurPage() {
  const { user } = useAuth();
  const [selectedPage,       setSelectedPage]       = useState(PAGES[0]);
  const [selectedEl,         setSelectedEl]         = useState<SelectedEl | null>(null);
  const [selectedSection,    setSelectedSection]    = useState<SelectedSection | null>(null);
  const [selectedBrandLogos, setSelectedBrandLogos] = useState<SelectedBrandLogos | null>(null);
  const [selectedBlock,      setSelectedBlock]      = useState<SelectedBlock | null>(null);
  const [draftBlockStyles,   setDraftBlockStyles]   = useState<Record<string, string>>({});
  const [pending,         setPending]         = useState<Record<string, string>>({});
  const [isSaving,        setIsSaving]        = useState(false);
  const [saved,           setSaved]           = useState(false);
  const [saveError,       setSaveError]       = useState<string | null>(null);
  const [iframeReady,     setIframeReady]     = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── Produits (sélecteur) ───────────────────────────────────────────────
  const [allProducts,      setAllProducts]      = useState<Product[] | null>(null);
  const [loadingProducts,  setLoadingProducts]  = useState(false);
  const [productSearch,    setProductSearch]    = useState('');

  // ── Drafts locaux pour les champs du panneau ───────────────────────────
  const [draftText,   setDraftText]   = useState('');
  const [draftColor,  setDraftColor]  = useState('');
  const [draftSize,   setDraftSize]   = useState('');
  const [draftWeight, setDraftWeight] = useState('');
  const [draftFont,   setDraftFont]   = useState('');
  const [isUploading,      setIsUploading]      = useState(false);
  const [uploadError,      setUploadError]      = useState<string | null>(null);
  const [isUploadingBrand, setIsUploadingBrand] = useState(false);
  const [newBrandUrl,      setNewBrandUrl]      = useState('');
  const [themeColors,      setThemeColors]      = useState<ThemeColors>(DEFAULT_COLORS);

  useEffect(() => { getThemeColors().then(setThemeColors); }, []);

  const iframeUrl = `${selectedPage.path}?_editmode=1`;

  // Fallback : si IFRAME_READY n'arrive pas en 8s (ex: erreur Firestore), débloquer quand même
  useEffect(() => {
    setIframeReady(false);
    const t = setTimeout(() => setIframeReady(true), 8000);
    return () => clearTimeout(t);
  }, [iframeUrl]);

  // ── Messages entrants de l'iframe ──────────────────────────────────────
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'IFRAME_READY') {
        setIframeReady(true);
        setSelectedEl(null);
        setSelectedBlock(null);
        // Re-envoyer les modifications en attente pour cette page
        Object.entries(pending).forEach(([key, value]) => {
          iframeRef.current?.contentWindow?.postMessage({ type: 'APPLY_CONTENT', key, value }, '*');
        });
      }
      if (e.data?.type === 'BLOCK_SELECTED') {
        const { page, id, styles, computed } = e.data as { page: string; id: string; styles: Record<string, string>; computed: Record<string, string> };
        setSelectedEl(null);
        setSelectedSection(null);
        setSelectedBrandLogos(null);
        setSelectedBlock({ page, id, styles, computed });
        setDraftBlockStyles(styles);
      }
      if (e.data?.type === 'ELEMENT_SELECTED') {
        const { page, id, elementType, value, styles } = e.data;
        setSelectedSection(null);
        setSelectedBlock(null);
        setSelectedEl({ page, id, type: elementType, value, styles });
        setDraftText(pending[`${page}|${id}`]           ?? value           ?? '');
        setDraftColor(pending[`${page}|${id}__color`]   ?? styles?.color   ?? '');
        setDraftSize(pending[`${page}|${id}__size`]     ?? styles?.size    ?? '');
        setDraftWeight(pending[`${page}|${id}__weight`] ?? styles?.weight  ?? '');
        setDraftFont(pending[`${page}|${id}__font`]     ?? styles?.font    ?? '');
      }
      if (e.data?.type === 'SECTION_PRODUCTS_SELECTED') {
        const { sectionId, currentIds } = e.data as { sectionId: string; currentIds: string[] };
        setSelectedEl(null);
        setSelectedBlock(null);
        setSelectedBrandLogos(null);
        const key = `home|${sectionId}_products`;
        const existingIds: string[] = pending[key] ? JSON.parse(pending[key]) : currentIds;
        setSelectedSection({ sectionId, key, currentIds: existingIds });
        setProductSearch('');
        if (!allProducts && !loadingProducts) {
          setLoadingProducts(true);
          api.getProducts().then((prods) => {
            setAllProducts(prods.filter((p) => p.pdt_reference && p.pdt_etat !== 'S').sort((a, b) => (a.pdt_designation ?? '').localeCompare(b.pdt_designation ?? '')));
            setLoadingProducts(false);
          });
        }
      }
      if (e.data?.type === 'BRAND_LOGOS_SELECTED') {
        const { currentUrls } = e.data as { currentUrls: string[] };
        setSelectedEl(null);
        setSelectedSection(null);
        setSelectedBlock(null);
        const key = 'home|marque_logos';
        const existingUrls: string[] = pending[key] ? JSON.parse(pending[key]) : currentUrls;
        setSelectedBrandLogos({ key, urls: existingUrls });
        setNewBrandUrl('');
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [pending]);

  // ── Envoi d'une valeur à l'iframe + mémorisation ───────────────────────
  const sendUpdate = useCallback((key: string, value: string) => {
    setPending((prev) => ({ ...prev, [key]: value }));
    iframeRef.current?.contentWindow?.postMessage({ type: 'APPLY_CONTENT', key, value }, '*');
  }, []);

  const sendBlockUpdate = useCallback((page: string, id: string, prop: string, value: string) => {
    const storeKey = `${page}|${id}__${prop}`;
    setPending((prev) => ({ ...prev, [storeKey]: value }));
    iframeRef.current?.contentWindow?.postMessage({ type: 'APPLY_BLOCK_STYLE', key: `${page}|${id}`, prop, value }, '*');
  }, []);

  const applyBlockStyle = (prop: string, value: string) => {
    if (!selectedBlock) return;
    setDraftBlockStyles((prev) => ({ ...prev, [prop]: value }));
    sendBlockUpdate(selectedBlock.page, selectedBlock.id, prop, value);
  };

  // Helpers par propriété
  const applyText   = (v: string) => { if (!selectedEl) return; setDraftText(v);   sendUpdate(`${selectedEl.page}|${selectedEl.id}`, v); };
  const applyColor  = (v: string) => { if (!selectedEl) return; setDraftColor(v);  sendUpdate(`${selectedEl.page}|${selectedEl.id}__color`, v); };
  const applySize   = (v: string) => { if (!selectedEl) return; setDraftSize(v);   sendUpdate(`${selectedEl.page}|${selectedEl.id}__size`, v); };
  const applyWeight = (v: string) => { if (!selectedEl) return; setDraftWeight(v); sendUpdate(`${selectedEl.page}|${selectedEl.id}__weight`, v); };
  const applyFont   = (v: string) => { if (!selectedEl) return; setDraftFont(v);   sendUpdate(`${selectedEl.page}|${selectedEl.id}__font`, v); };

  // ── Upload image Firebase Storage ──────────────────────────────────────
  const handleImageUpload = useCallback(async (file: File) => {
    if (!selectedEl) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const storage = getFirebaseStorage();
      const sRef = storageRef(storage, `page-content/${selectedEl.page}_${selectedEl.id}_${Date.now()}_${file.name}`);
      const snap = await uploadBytes(sRef, file);
      const url  = await getDownloadURL(snap.ref);
      applyText(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur upload');
    } finally {
      setIsUploading(false);
    }
  }, [selectedEl]);

  // ── Gestion logos marques ──────────────────────────────────────────────
  const removeBrandLogo = useCallback((index: number) => {
    setSelectedBrandLogos((prev) => {
      if (!prev) return prev;
      const urls = prev.urls.filter((_, i) => i !== index);
      const value = JSON.stringify(urls);
      setPending((p) => ({ ...p, [prev.key]: value }));
      iframeRef.current?.contentWindow?.postMessage({ type: 'APPLY_CONTENT', key: prev.key, value }, '*');
      return { ...prev, urls };
    });
  }, []);

  const addBrandLogoUrl = useCallback((url: string) => {
    if (!url.trim()) return;
    setSelectedBrandLogos((prev) => {
      if (!prev) return prev;
      const urls = [...prev.urls, url.trim()];
      const value = JSON.stringify(urls);
      setPending((p) => ({ ...p, [prev.key]: value }));
      iframeRef.current?.contentWindow?.postMessage({ type: 'APPLY_CONTENT', key: prev.key, value }, '*');
      return { ...prev, urls };
    });
    setNewBrandUrl('');
  }, []);

  const handleBrandLogoUpload = useCallback(async (file: File) => {
    setIsUploadingBrand(true);
    const storage = getFirebaseStorage();
    const sRef = storageRef(storage, `page-content/marque_logo_${Date.now()}_${file.name}`);
    const snap = await uploadBytes(sRef, file);
    const url  = await getDownloadURL(snap.ref);
    addBrandLogoUrl(url);
    setIsUploadingBrand(false);
  }, [addBrandLogoUrl]);

  // ── Changement de page ─────────────────────────────────────────────────
  const changePage = (p: typeof PAGES[0]) => {
    setSelectedPage(p);
    setSelectedEl(null);
    setSelectedSection(null);
    setSelectedBrandLogos(null);
    setIframeReady(false);
  };

  // ── Toggle produit dans la sélection ──────────────────────────────────
  const toggleProduct = useCallback((ref: string) => {
    setSelectedSection((prev) => {
      if (!prev) return prev;
      const ids = prev.currentIds.includes(ref)
        ? prev.currentIds.filter((id) => id !== ref)
        : [...prev.currentIds, ref];
      const value = JSON.stringify(ids);
      setPending((p) => ({ ...p, [prev.key]: value }));
      iframeRef.current?.contentWindow?.postMessage({ type: 'APPLY_CONTENT', key: prev.key, value }, '*');
      return { ...prev, currentIds: ids };
    });
  }, []);

  // ── Sauvegarde Firestore ───────────────────────────────────────────────
  const saveAll = async () => {
    if (!Object.keys(pending).length) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const byPage: Record<string, Record<string, string>> = {};
      Object.entries(pending).forEach(([key, value]) => {
        const pipe = key.indexOf('|');
        const page = key.slice(0, pipe);
        const id   = key.slice(pipe + 1);
        if (!byPage[page]) byPage[page] = {};
        byPage[page][id] = value;
      });
      await Promise.all(Object.entries(byPage).map(([pg, data]) => savePageContent(pg, data)));

      const idToken = user ? await user.getIdToken() : undefined;
      const patchHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) patchHeaders['Authorization'] = `Bearer ${idToken}`;

      await Promise.allSettled([
        api.invalidate('page-content'),
        ...Object.entries(byPage).map(([pageId, data]) =>
          fetch('/api/cache/patch', {
            method: 'POST',
            headers: patchHeaders,
            body: JSON.stringify({ collection: 'page-content', pageId, items: [data] }),
          })
        ),
      ]);

      // Vider le cache localStorage pour que la prochaine visite recharge le contenu frais
      Object.keys(byPage).forEach(pg => {
        invalidateCached(`page-content${JSON.stringify({ page: pg })}`);
      });
      setPending({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur de sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const pendingCount      = Object.keys(pending).length;
  const hasEl             = selectedEl !== null;
  const hasSection        = selectedSection !== null;
  const hasBrandLogos     = selectedBrandLogos !== null;
  const hasBlock          = selectedBlock !== null;

  const filteredProducts = (allProducts ?? []).filter((p) => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return (p.pdt_designation ?? '').toLowerCase().includes(q) || p.pdt_reference.toLowerCase().includes(q);
  });

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col -m-4 sm:-m-7" style={{ height: 'calc(100vh - 50px)' }}>

      {/* ── TOP BAR ── */}
      <div className="flex items-center gap-3 px-5 py-2 border-b border-border bg-surface shrink-0 h-[46px]">
        <h1 className="text-sm font-bold text-ink shrink-0">Editeur visuel</h1>

        <select
          value={selectedPage.id}
          onChange={(e) => changePage(PAGES.find((p) => p.id === e.target.value)!)}
          className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white cursor-pointer"
        >
          {PAGES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>

        <div className="flex-1" />

        {saveError && (
          <span className="text-xs text-red-600 font-semibold shrink-0 max-w-xs truncate" title={saveError}>
            ✕ {saveError}
          </span>
        )}
        {pendingCount > 0 && !saved && !saveError && (
          <span className="text-xs text-amber-600 font-semibold shrink-0">
            {pendingCount} modification{pendingCount > 1 ? 's' : ''} non sauvegardée{pendingCount > 1 ? 's' : ''}
          </span>
        )}
        {saved && <span className="text-xs text-green-600 font-semibold shrink-0">Sauvegarde réussie ✓</span>}

        <button
          onClick={saveAll}
          disabled={isSaving || pendingCount === 0}
          className="px-3 py-1.5 bg-sv-primary hover:bg-sv-primary-dark text-white rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer transition-colors shrink-0"
        >
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>

        <a
          href={selectedPage.path}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 border border-border rounded-lg text-xs font-semibold text-ink-secondary hover:text-sv-primary transition-colors shrink-0"
        >
          Ouvrir la page
        </a>
      </div>

      {/* ── CORPS ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── PANNEAU PROPRIETES ── */}
        <aside className="w-[300px] shrink-0 border-r border-border bg-surface overflow-y-auto flex flex-col">

          {hasBrandLogos ? (
            /* ── PANNEAU LOGOS MARQUES ── */
            <div className="p-4 space-y-4 flex flex-col h-full">
              <div className="flex items-start justify-between gap-2 shrink-0">
                <div>
                  <p className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest mb-1">Logos marques</p>
                  <p className="text-[11px] text-ink-secondary mt-0.5">
                    {selectedBrandLogos!.urls.length} logo{selectedBrandLogos!.urls.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-2 items-center shrink-0">
                  {selectedBrandLogos!.urls.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedBrandLogos((prev) => {
                          if (!prev) return prev;
                          const value = JSON.stringify([]);
                          setPending((p) => ({ ...p, [prev.key]: value }));
                          iframeRef.current?.contentWindow?.postMessage({ type: 'APPLY_CONTENT', key: prev.key, value }, '*');
                          return { ...prev, urls: [] };
                        });
                      }}
                      className="text-[11px] text-red-500 hover:text-red-700 cursor-pointer font-semibold"
                    >
                      Tout supprimer
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedBrandLogos(null)}
                    className="text-ink-secondary hover:text-ink text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Liste des logos */}
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {selectedBrandLogos!.urls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-gray-50">
                    <div className="w-16 h-10 rounded bg-white border border-border flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={url}
                        alt={`Logo ${i + 1}`}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                      />
                    </div>
                    <p className="flex-1 text-[10px] font-mono text-ink-secondary truncate">{url}</p>
                    <button
                      onClick={() => removeBrandLogo(i)}
                      className="text-red-400 hover:text-red-600 text-xs font-bold cursor-pointer shrink-0"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {selectedBrandLogos!.urls.length === 0 && (
                  <p className="text-center text-xs text-ink-secondary py-6">Aucun logo. Ajoutez-en ci-dessous.</p>
                )}
              </div>

              {/* Ajouter par URL */}
              <div className="shrink-0 space-y-2 border-t border-border pt-3">
                <p className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest">Ajouter un logo</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... (URL image)"
                    value={newBrandUrl}
                    onChange={(e) => setNewBrandUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addBrandLogoUrl(newBrandUrl); }}
                    className="flex-1 px-2 py-1.5 border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sv-primary/30"
                  />
                  <button
                    onClick={() => addBrandLogoUrl(newBrandUrl)}
                    disabled={!newBrandUrl.trim()}
                    className="px-3 py-1.5 bg-sv-primary hover:bg-sv-primary-dark text-white rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer transition-colors shrink-0"
                  >
                    Ajouter
                  </button>
                </div>

                {/* Upload fichier */}
                <label className={`flex items-center justify-center gap-2 w-full px-3 py-3 border-2 border-dashed rounded-lg transition-colors ${isUploadingBrand ? 'border-sv-primary/40 bg-sv-primary-light/30 cursor-wait' : 'border-border hover:border-sv-primary/50 hover:bg-sv-primary-light/20 cursor-pointer'}`}>
                  {isUploadingBrand ? (
                    <>
                      <div className="w-4 h-4 border-2 border-sv-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-ink-secondary">Upload en cours...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-ink-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-ink-secondary">Uploader depuis l&apos;ordinateur</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingBrand}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBrandLogoUpload(f); e.target.value = ''; }}
                  />
                </label>
              </div>
            </div>

          ) : hasSection ? (
            /* ── PANNEAU SELECTION PRODUITS ── */
            <div className="p-4 space-y-4 flex flex-col h-full">
              <div className="flex items-start justify-between gap-2 shrink-0">
                <div>
                  <p className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest mb-1">Section produits</p>
                  <p className="text-xs font-mono text-sv-primary">
                    {selectedSection!.sectionId === 'nouveautes' ? 'Nouveautés' : 'Best-sellers'}
                  </p>
                  <p className="text-[11px] text-ink-secondary mt-0.5">
                    {selectedSection!.currentIds.length} produit{selectedSection!.currentIds.length > 1 ? 's' : ''} sélectionné{selectedSection!.currentIds.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-2 items-center shrink-0">
                  {selectedSection!.currentIds.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedSection((prev) => {
                          if (!prev) return prev;
                          const value = JSON.stringify([]);
                          setPending((p) => ({ ...p, [prev.key]: value }));
                          iframeRef.current?.contentWindow?.postMessage({ type: 'APPLY_CONTENT', key: prev.key, value }, '*');
                          return { ...prev, currentIds: [] };
                        });
                      }}
                      className="text-[11px] text-red-500 hover:text-red-700 cursor-pointer font-semibold"
                    >
                      Vider
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedSection(null)}
                    className="text-ink-secondary hover:text-ink text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sv-primary/30 shrink-0"
              />

              <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                {loadingProducts && (
                  <div className="flex items-center justify-center py-10 gap-2 text-xs text-ink-secondary">
                    <div className="w-4 h-4 border-2 border-sv-primary border-t-transparent rounded-full animate-spin" />
                    Chargement des produits...
                  </div>
                )}
                {!loadingProducts && filteredProducts.map((p) => {
                  const selected = selectedSection!.currentIds.includes(p.pdt_reference);
                  return (
                    <label
                      key={p.pdt_reference}
                      className={`flex items-start gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        selected ? 'bg-sv-primary-light border border-sv-primary/30' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleProduct(p.pdt_reference)}
                        className="mt-0.5 accent-sv-primary shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink leading-tight line-clamp-2">{p.pdt_designation}</p>
                        <p className="text-[10px] text-ink-secondary font-mono">{p.pdt_reference}</p>
                      </div>
                    </label>
                  );
                })}
                {!loadingProducts && filteredProducts.length === 0 && productSearch && (
                  <p className="text-center text-xs text-ink-secondary py-6">Aucun résultat pour &quot;{productSearch}&quot;</p>
                )}
              </div>
            </div>

          ) : hasBlock ? (
            /* ── PANNEAU BLOCK STYLE ── */
            <div className="p-4 space-y-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest mb-1">Bloc selectionne</p>
                  <p className="text-xs font-mono text-amber-600 break-all">{selectedBlock!.page} / {selectedBlock!.id}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedBlock(null);
                    iframeRef.current?.contentWindow?.postMessage({ type: 'CLEAR_SELECTION' }, '*');
                  }}
                  className="text-ink-secondary hover:text-ink text-sm cursor-pointer shrink-0 mt-0.5"
                  title="Deselectionner"
                >✕</button>
              </div>

              {BLOCK_STYLE_PROPS.map(({ prop, label, type, placeholder }) => (
                <div key={prop}>
                  <label className="block text-[11px] font-semibold text-ink-secondary uppercase tracking-widest mb-1.5">{label}</label>
                  {type === 'color' && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {(prop === 'bg_color'
                          ? [
                              { key: 'bg_page',       label: 'Fond page' },
                              { key: 'bg_section_alt',label: 'Fond alt' },
                              { key: 'bg_card',       label: 'Fond carte' },
                              { key: 'sv_primary_light', label: 'Primaire clair' },
                              { key: 'sv_orange_light',  label: 'Accent clair' },
                              { key: 'sv_primary',    label: 'Primaire' },
                              { key: 'sv_orange',     label: 'Accent' },
                              { key: 'sv_primary_dark', label: 'Primaire sombre' },
                            ]
                          : [
                              { key: 'sv_primary',    label: 'Primaire' },
                              { key: 'sv_primary_dark', label: 'Primaire sombre' },
                              { key: 'sv_primary_light', label: 'Primaire clair' },
                              { key: 'sv_orange',     label: 'Accent' },
                              { key: 'sv_orange_dark',  label: 'Accent sombre' },
                              { key: 'bg_page',       label: 'Fond page' },
                              { key: 'bg_card',       label: 'Fond carte' },
                            ]
                        ).map(({ key, label }) => {
                          const hex = themeColors[key as keyof ThemeColors];
                          const active = draftBlockStyles[prop] === hex;
                          return (
                            <button
                              key={key}
                              title={label}
                              onClick={() => applyBlockStyle(prop, hex)}
                              className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110 cursor-pointer shrink-0"
                              style={{
                                backgroundColor: hex,
                                borderColor: active ? '#f59e0b' : '#e5e7eb',
                                boxShadow: active ? '0 0 0 2px #f59e0b' : 'none',
                              }}
                            />
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={draftBlockStyles[prop] && /^#/.test(draftBlockStyles[prop]) ? draftBlockStyles[prop] : '#000000'}
                          onChange={(e) => applyBlockStyle(prop, e.target.value)}
                          className="w-10 h-9 rounded-lg border border-border cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={draftBlockStyles[prop] ?? ''}
                          onChange={(e) => applyBlockStyle(prop, e.target.value)}
                          placeholder={`hérité (computed: ${selectedBlock!.computed[prop === 'bg_color' ? 'backgroundColor' : 'color'] ?? ''})`}
                          className="flex-1 px-3 py-2 border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                        />
                        {draftBlockStyles[prop] && (
                          <button onClick={() => applyBlockStyle(prop, '')} className="text-xs text-ink-secondary hover:text-ink cursor-pointer" title="Réinitialiser">↺</button>
                        )}
                      </div>
                    </div>
                  )}
                  {type === 'gradient' && (
                    <>
                      <input
                        type="text"
                        value={draftBlockStyles[prop] ?? ''}
                        onChange={(e) => applyBlockStyle(prop, e.target.value)}
                        placeholder="linear-gradient(135deg, #E8185A, #6B4FA0)"
                        className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/30 mb-2"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {GRADIENT_PRESETS.map((g) => (
                          <button
                            key={g.value}
                            onClick={() => applyBlockStyle(prop, g.value)}
                            className="px-2 py-1 rounded text-[11px] font-semibold text-white cursor-pointer border-2 transition-all hover:scale-105"
                            style={{
                              background: g.value,
                              borderColor: draftBlockStyles[prop] === g.value ? '#fff' : 'transparent',
                              boxShadow: draftBlockStyles[prop] === g.value ? '0 0 0 2px #f59e0b' : 'none',
                            }}
                          >{g.label}</button>
                        ))}
                        {draftBlockStyles[prop] && (
                          <button onClick={() => applyBlockStyle(prop, '')} className="px-2 py-1 rounded text-[11px] bg-gray-100 hover:bg-gray-200 text-ink cursor-pointer">↺ Réinitialiser</button>
                        )}
                      </div>
                    </>
                  )}
                  {type === 'range' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min={0} max={1} step={0.05}
                        value={draftBlockStyles[prop] ? parseFloat(draftBlockStyles[prop]) : 1}
                        onChange={(e) => applyBlockStyle(prop, e.target.value)}
                        className="flex-1 cursor-pointer"
                      />
                      <span className="text-xs font-mono w-10 text-right">{draftBlockStyles[prop] || '1'}</span>
                      {draftBlockStyles[prop] && draftBlockStyles[prop] !== '1' && (
                        <button onClick={() => applyBlockStyle(prop, '')} className="text-xs text-ink-secondary hover:text-ink cursor-pointer">↺</button>
                      )}
                    </div>
                  )}
                  {type === 'text' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={draftBlockStyles[prop] ?? ''}
                        onChange={(e) => applyBlockStyle(prop, e.target.value)}
                        placeholder={(placeholder as string | undefined) ?? ''}
                        className="flex-1 px-3 py-2 border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                      />
                      {draftBlockStyles[prop] && (
                        <button onClick={() => applyBlockStyle(prop, '')} className="text-xs text-ink-secondary hover:text-ink cursor-pointer">↺</button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Aperçu */}
              <Divider label="Aperçu" />
              <div
                className="p-4 rounded-xl border border-border text-center text-sm font-semibold"
                style={{
                  backgroundColor: draftBlockStyles['bg_color'] || undefined,
                  background: draftBlockStyles['bg_gradient'] || (draftBlockStyles['bg_color'] || undefined),
                  color: draftBlockStyles['text_color'] || undefined,
                  borderRadius: draftBlockStyles['border_radius'] || undefined,
                  padding: draftBlockStyles['padding'] || undefined,
                  border: draftBlockStyles['border'] || undefined,
                  opacity: draftBlockStyles['opacity'] ? parseFloat(draftBlockStyles['opacity']) : undefined,
                  boxShadow: draftBlockStyles['box_shadow'] || undefined,
                }}
              >
                Aperçu du bloc
              </div>
            </div>

          ) : hasEl ? (
            <div className="p-4 space-y-5">
              {/* En-tête élément */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest mb-1">Element selectionne</p>
                  <p className="text-xs font-mono text-sv-primary break-all">{selectedEl!.page} / {selectedEl!.id}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedEl(null);
                    iframeRef.current?.contentWindow?.postMessage({ type: 'CLEAR_SELECTION' }, '*');
                  }}
                  className="text-ink-secondary hover:text-ink text-sm cursor-pointer shrink-0 mt-0.5"
                  title="Deselectionner"
                >
                  ✕
                </button>
              </div>

              {/* ── PANNEAU IMAGE ── */}
              {selectedEl!.type === 'image' && (
                <>
                  <Divider label="Image" />

                  {draftText && (
                    <div className="rounded-xl border border-border overflow-hidden bg-gray-50">
                      <img
                        src={draftText}
                        alt="aperçu"
                        className="w-full h-36 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div>
                    <Label>URL de l&apos;image</Label>
                    <input
                      type="text"
                      value={draftText}
                      onChange={(e) => applyText(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sv-primary/30"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label>Uploader depuis l&apos;ordinateur</Label>
                    <label className={`flex items-center justify-center gap-2 w-full px-3 py-4 border-2 border-dashed rounded-lg transition-colors ${isUploading ? 'border-sv-primary/40 bg-sv-primary-light/30 cursor-wait' : 'border-border hover:border-sv-primary/50 hover:bg-sv-primary-light/20 cursor-pointer'}`}>
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-sv-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-ink-secondary">Upload en cours...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-ink-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs text-ink-secondary">Choisir un fichier image</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }}
                      />
                    </label>
                    {uploadError && (
                      <p className="mt-1.5 text-xs text-red-500 break-all">{uploadError}</p>
                    )}
                  </div>
                </>
              )}

              {/* ── PANNEAU LIEN ── */}
              {selectedEl!.type === 'link' && (
                <>
                  <Divider label="Lien" />
                  <div>
                    <Label>Page de destination</Label>
                    <select
                      value={INTERNAL_ROUTES.some((r) => r.path === draftText) ? draftText : '__externe__'}
                      onChange={(e) => { if (e.target.value !== '__externe__') applyText(e.target.value); }}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sv-primary/30 bg-white"
                    >
                      {INTERNAL_ROUTES.map((r, i) => (
                        r.path === ''
                          ? <option key={i} value="" disabled className="text-gray-400 font-semibold">{r.label}</option>
                          : <option key={r.path} value={r.path}>{r.label}</option>
                      ))}
                      <option value="__externe__">— URL externe —</option>
                    </select>
                  </div>
                  {!INTERNAL_ROUTES.some((r) => r.path === draftText) && (
                    <div>
                      <Label>URL externe</Label>
                      <input
                        type="text"
                        value={draftText}
                        onChange={(e) => applyText(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sv-primary/30"
                        placeholder="https://..."
                        autoFocus
                      />
                    </div>
                  )}
                  {draftText && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="text-xs text-green-700 font-mono truncate">{draftText}</span>
                    </div>
                  )}
                </>
              )}

              {selectedEl!.type !== 'image' && selectedEl!.type !== 'link' && (
                <>
                  <Divider label="Contenu" />

                  {/* Texte */}
                  <div>
                    <Label>Texte</Label>
                    {selectedEl!.type === 'multiline' ? (
                      <textarea
                        value={draftText}
                        onChange={(e) => applyText(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sv-primary/30"
                      />
                    ) : (
                      <input
                        type="text"
                        value={draftText}
                        onChange={(e) => applyText(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sv-primary/30"
                      />
                    )}
                  </div>
                </>
              )}

              {selectedEl!.type !== 'image' && selectedEl!.type !== 'link' && <Divider label="Style" />}

              {selectedEl!.type !== 'image' && selectedEl!.type !== 'link' && (
                <>
                  {/* Couleur */}
                  <div>
                    <Label>Couleur du texte</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftColor || '#000000'}
                        onChange={(e) => applyColor(e.target.value)}
                        className="w-10 h-9 rounded-lg border border-border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={draftColor}
                        onChange={(e) => applyColor(e.target.value)}
                        placeholder="herite"
                        className="flex-1 px-3 py-2 border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sv-primary/30"
                      />
                      {draftColor && (
                        <button onClick={() => applyColor('')} className="text-xs text-ink-secondary hover:text-ink cursor-pointer" title="Reinitialiser">↺</button>
                      )}
                    </div>
                  </div>

                  {/* Taille */}
                  <div>
                    <Label>Taille de police</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={draftSize}
                        onChange={(e) => applySize(e.target.value)}
                        placeholder="herite (ex: 24px, 1.5rem)"
                        className="flex-1 px-3 py-2 border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sv-primary/30"
                      />
                      {draftSize && (
                        <button onClick={() => applySize('')} className="text-xs text-ink-secondary hover:text-ink cursor-pointer" title="Reinitialiser">↺</button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {['12px','14px','16px','18px','20px','24px','28px','32px','40px','48px'].map((s) => (
                        <button
                          key={s}
                          onClick={() => applySize(s)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                            draftSize === s ? 'bg-sv-primary text-white' : 'bg-gray-100 hover:bg-gray-200 text-ink'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Graisse */}
                  <div>
                    <Label>Graisse</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FONT_WEIGHTS.map((w) => (
                        <button
                          key={w.value}
                          onClick={() => applyWeight(draftWeight === w.value ? '' : w.value)}
                          className={`px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors text-left ${
                            draftWeight === w.value
                              ? 'bg-sv-primary text-white font-semibold'
                              : 'bg-gray-100 hover:bg-gray-200 text-ink'
                          }`}
                          style={{ fontWeight: Number(w.value) || undefined }}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Police */}
                  <div>
                    <Label>Famille de police</Label>
                    <select
                      value={draftFont}
                      onChange={(e) => applyFont(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sv-primary/30 bg-white"
                    >
                      {FONT_FAMILIES.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Apercu texte */}
                  {draftText && (
                    <>
                      <Divider label="Apercu" />
                      <div
                        className="p-4 bg-gray-50 rounded-xl border border-border break-words"
                        style={{
                          color:      draftColor  || undefined,
                          fontSize:   draftSize   || undefined,
                          fontWeight: (draftWeight ? Number(draftWeight) : undefined) as React.CSSProperties['fontWeight'],
                          fontFamily: draftFont   || undefined,
                        }}
                      >
                        {draftText}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

          ) : (
            /* Etat vide */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-sv-primary-light flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-sv-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-ink mb-2">Cliquez sur un element</p>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Cliquez sur n&apos;importe quel texte mis en evidence dans l&apos;apercu pour modifier son contenu et son style.
              </p>
              {!iframeReady && (
                <div className="mt-5 flex items-center gap-2 text-xs text-amber-600">
                  <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  Chargement de la page...
                </div>
              )}
              {iframeReady && (
                <div className="mt-5 flex items-center gap-2 text-xs text-green-600">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Page chargee, cliquez sur un element
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── IFRAME ── */}
        <div className="flex-1 min-w-0 relative bg-gray-200 overflow-hidden">
          {/* Label page */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-black/60 text-white text-[11px] px-3 py-1 rounded-full pointer-events-none">
            {selectedPage.label} — {selectedPage.path}
          </div>

          <iframe
            ref={iframeRef}
            key={iframeUrl}
            src={iframeUrl}
            className="w-full h-full border-0"
            title="Apercu de la page"
            onLoad={() => {
              // IFRAME_READY vient via postMessage depuis IframeEditProvider
            }}
          />

          {!iframeReady && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-3 text-ink-secondary">
                <div className="w-5 h-5 border-2 border-sv-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Chargement de l&apos;apercu...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sous-composants UI ─────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-600 mb-1.5">{children}</p>;
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] font-bold text-ink-secondary uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
