'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatEan, filterArticlesVisiblesWithStatCats, type Product } from '@/lib/firestore/products';
import { getDeclinations, type Declination } from '@/lib/firestore/categories';
import { type StatCategory } from '@/lib/firestore/stat-categories';
import { getStockSettings, type StockSettings } from '@/lib/firestore/settings';
import { api } from '@/lib/api';
import SearchBar from '@/components/ui/SearchBar';
import Modal, { ModalTitle, ModalActions } from '@/components/ui/Modal';
import { useCart } from '@/lib/cart-context';
import { useTarif } from '@/lib/useTarif';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, ImageOff, ShoppingCart, Check, Plus, Minus, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import { ProductImage } from '@/components/ui/ProductImage';

type SortBy = '' | 'ref_asc' | 'ref_desc' | 'designation_asc' | 'designation_desc' | 'price_asc' | 'price_desc';

interface DisplayItem {
  _declinaisonId?: string;
  pdt_reference?: string;
  pdt_designation: string;
  sous_titre?: string;
  pdt_code_stat?: string;
  pdt_etat?: string;
  stock_physique?: number;
  prix_vente?: number;
  quantite_colisage?: number;
}

interface InitialData {
  products: Product[];
  declinations: Declination[];
  stockSettings: StockSettings;
  statCategories: StatCategory[];
}

function buildItems(products: Product[], declinations: Declination[]): DisplayItem[] {
  const refsVariants = new Set<string>();
  declinations.forEach((dec) => dec.variants?.forEach((v) => refsVariants.add(v.ref)));
  const articlesNormaux: DisplayItem[] = products
    .filter((p) => !refsVariants.has(p.pdt_reference))
    .map((p) => ({ ...p, quantite_colisage: p.quantite_colisage || 1 }));
  const entriesDec: DisplayItem[] = declinations
    .filter((dec) => dec.variants?.some((v) => products.some((p) => p.pdt_reference === v.ref)))
    .map((dec) => ({ _declinaisonId: dec.id, pdt_designation: dec.designation, sous_titre: dec.sous_titre }));
  return [...entriesDec, ...articlesNormaux];
}

export default function ProCatalogueClient({ initialData }: { initialData: InitialData }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { profile, loading: authLoading } = useAuth();
  const catIds = profile?.cat_ids;

  const [resolvedProducts, setResolvedProducts] = useState(initialData.products);
  const [declinationsList, setDeclinationsList] = useState<Declination[]>(initialData.declinations);
  const [seuilStockFaible, setSeuilStockFaible] = useState(initialData.stockSettings.seuil_stock_faible);
  const [statCatsList, setStatCatsList] = useState<StatCategory[]>(initialData.statCategories);

  useEffect(() => {
    if (resolvedProducts.length > 0) return;
    Promise.all([
      api.getProducts(),
      api.getStatCategories() as Promise<StatCategory[]>,
      getDeclinations(),
      getStockSettings(),
    ]).then(([allProds, allStatCats, decls, stockSett]) => {
      setResolvedProducts(filterArticlesVisiblesWithStatCats(allProds, allStatCats));
      setDeclinationsList(decls);
      setSeuilStockFaible(stockSett.seuil_stock_faible);
      setStatCatsList(allStatCats);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Affiche tous les produits tant que l'auth charge (catIds inconnus),
  // puis filtre une fois le profil disponible.
  const authorizedProducts = useMemo(() => {
    if (!authLoading && catIds !== undefined && catIds.length > 0)
      return resolvedProducts.filter((p) => p.cat_ids?.some((id) => catIds.includes(id)));
    return resolvedProducts;
  }, [authLoading, catIds, resolvedProducts]);

  const items = useMemo(() => buildItems(authorizedProducts, declinationsList), [authorizedProducts, declinationsList]);
  const catalogueBrut = authorizedProducts;

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [filterCat, setFilterCat] = useState('');
  const [filterStat, setFilterStat] = useState('');
  const [modalDec, setModalDec] = useState<Declination | null>(null);
  const [addedRef, setAddedRef] = useState<string | null>(null);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [pendingItem, setPendingItem] = useState<DisplayItem | null>(null);
  const [filterStock, setFilterStock] = useState<Set<'en_stock' | 'stock_faible' | 'rupture'>>(new Set());
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterColisageMin, setFilterColisageMin] = useState('');
  const [filterColisageMax, setFilterColisageMax] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['sort', 'stock', 'price', 'colisage']));
  const toggleSection = (s: string) => setOpenSections((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailAdded, setDetailAdded] = useState(false);
  const [detailPending, setDetailPending] = useState(false);

  const { addItem, activeCartId, createCart } = useCart();
  const { priceOf } = useTarif();

  const detailRef = searchParams.get('ref');
  const detailProduct = detailRef ? catalogueBrut.find((p) => p.pdt_reference === detailRef) ?? null : null;

  useEffect(() => { setDetailAdded(false); }, [detailRef]);

  useEffect(() => {
    if (detailPending && activeCartId && detailProduct) {
      addItem(detailProduct.pdt_reference, detailProduct.pdt_designation, 1, detailProduct.prix_vente);
      setDetailAdded(true);
      setTimeout(() => setDetailAdded(false), 2000);
      setDetailPending(false);
    }
  }, [activeCartId, detailPending, detailProduct, addItem]);

  useEffect(() => {
    if (pendingItem && activeCartId && pendingItem.pdt_reference) {
      addItem(pendingItem.pdt_reference, pendingItem.pdt_designation, getQty(pendingItem.pdt_reference, pendingItem.quantite_colisage ?? 1), pendingItem.prix_vente);
      setAddedRef(pendingItem.pdt_reference);
      setTimeout(() => setAddedRef(null), 1500);
      setPendingItem(null);
    }
  }, [activeCartId, pendingItem, addItem]);

  const getQty = (ref: string, colisage: number) => qtys[ref] ?? colisage;
  const adjustQty = (ref: string, colisage: number, delta: number) =>
    setQtys((prev) => ({ ...prev, [ref]: Math.max(1, (prev[ref] ?? colisage) + delta) }));
  const stepUp = (ref: string, col: number) =>
    setQtys((prev) => {
      const q = prev[ref] ?? col;
      return { ...prev, [ref]: Math.ceil((q + 1) / col) * col };
    });
  const stepDown = (ref: string, col: number) =>
    setQtys((prev) => {
      const q = prev[ref] ?? col;
      return { ...prev, [ref]: Math.max(1, Math.floor((q - 1) / col) * col) };
    });
  const setQty = (ref: string, val: number) =>
    setQtys((prev) => ({ ...prev, [ref]: Math.max(1, val) }));

  const handleAddToCart = (p: DisplayItem) => {
    if (!p.pdt_reference) return;
    const qty = getQty(p.pdt_reference, p.quantite_colisage ?? 1);
    if (!activeCartId) {
      createCart('Mon panier');
      setPendingItem(p);
    } else {
      addItem(p.pdt_reference, p.pdt_designation, qty, p.prix_vente);
      setAddedRef(p.pdt_reference);
      setTimeout(() => setAddedRef(null), 1500);
    }
  };

  const handleAddToCartDetail = () => {
    if (!detailProduct) return;
    if (!activeCartId) {
      createCart('Mon panier');
      setDetailPending(true);
    } else {
      addItem(detailProduct.pdt_reference, detailProduct.pdt_designation, 1, detailProduct.prix_vente);
      setDetailAdded(true);
      setTimeout(() => setDetailAdded(false), 2000);
    }
  };

  // Utilise les déclinaisons déjà chargées — aucun appel Firestore
  const openDecModal = (decId: string) => {
    const dec = declinationsList.find((d) => d.id === decId);
    if (dec) setModalDec(dec);
  };

  const openDetail = (ref: string) => {
    router.push(`/pro/catalogue?ref=${encodeURIComponent(ref)}`);
  };

  const closeDetail = () => router.back();

  const catLabels = useMemo(() => Object.fromEntries(statCatsList.map((c) => [c.code, c.designation])), [statCatsList]);
  const categories2 = useMemo(() =>
    [...new Set(items.filter((p) => !p._declinaisonId && p.pdt_code_stat && p.pdt_code_stat.length >= 4).map((p) => p.pdt_code_stat!.slice(0, 4)))].sort(),
    [items]
  );
  const pdtCodesPerCat2 = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const cat2 of categories2) {
      result[cat2] = [...new Set(items.filter((p) => !p._declinaisonId && p.pdt_code_stat?.startsWith(cat2)).map((p) => p.pdt_code_stat!).filter(Boolean))].sort();
    }
    return result;
  }, [items, categories2]);

  const hasAdvancedFilters = filterStock.size > 0 || filterPriceMin !== '' || filterPriceMax !== '' || filterColisageMin !== '' || filterColisageMax !== '' || sortBy !== '';

  const filtered = useMemo(() => {
    const priceMin = filterPriceMin !== '' ? parseFloat(filterPriceMin) : null;
    const priceMax = filterPriceMax !== '' ? parseFloat(filterPriceMax) : null;
    const colMin = filterColisageMin !== '' ? parseInt(filterColisageMin) : null;
    const colMax = filterColisageMax !== '' ? parseInt(filterColisageMax) : null;

    let result = items;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.pdt_reference?.toLowerCase().includes(q) ||
        p.pdt_designation?.toLowerCase().includes(q) ||
        p.sous_titre?.toLowerCase().includes(q) ||
        p.pdt_code_stat?.toLowerCase().includes(q)
      );
    }
    if (filterCat) result = result.filter((p) => p._declinaisonId || p.pdt_code_stat?.startsWith(filterCat));
    if (filterStat) result = result.filter((p) => p._declinaisonId || p.pdt_code_stat === filterStat);

    if (filterStock.size > 0) {
      result = result.filter((p) => {
        if (p._declinaisonId) return true;
        const stock = p.stock_physique || 0;
        const enRupture = stock <= 0;
        const faible = !enRupture && stock <= seuilStockFaible;
        if (enRupture && filterStock.has('rupture')) return true;
        if (faible && filterStock.has('stock_faible')) return true;
        if (!enRupture && !faible && filterStock.has('en_stock')) return true;
        return false;
      });
    }
    if (priceMin !== null || priceMax !== null) {
      result = result.filter((p) => {
        if (p._declinaisonId) return true;
        const px = p.pdt_reference ? priceOf(p.pdt_reference, p.prix_vente) : p.prix_vente;
        if (px == null) return false;
        if (priceMin !== null && px < priceMin) return false;
        if (priceMax !== null && px > priceMax) return false;
        return true;
      });
    }
    if (colMin !== null || colMax !== null) {
      result = result.filter((p) => {
        if (p._declinaisonId) return true;
        const col = p.quantite_colisage ?? 1;
        if (colMin !== null && col < colMin) return false;
        if (colMax !== null && col > colMax) return false;
        return true;
      });
    }
    if (sortBy) {
      result = [...result].sort((a, b) => {
        if (a._declinaisonId || b._declinaisonId) return 0;
        switch (sortBy) {
          case 'ref_asc': return (a.pdt_reference ?? '').localeCompare(b.pdt_reference ?? '');
          case 'ref_desc': return (b.pdt_reference ?? '').localeCompare(a.pdt_reference ?? '');
          case 'designation_asc': return a.pdt_designation.localeCompare(b.pdt_designation);
          case 'designation_desc': return b.pdt_designation.localeCompare(a.pdt_designation);
          case 'price_asc': return (priceOf(a.pdt_reference ?? '', a.prix_vente) ?? 0) - (priceOf(b.pdt_reference ?? '', b.prix_vente) ?? 0);
          case 'price_desc': return (priceOf(b.pdt_reference ?? '', b.prix_vente) ?? 0) - (priceOf(a.pdt_reference ?? '', a.prix_vente) ?? 0);
          default: return 0;
        }
      });
    }
    return result;
  }, [items, searchQuery, filterCat, filterStat, filterStock, filterPriceMin, filterPriceMax, filterColisageMin, filterColisageMax, sortBy, seuilStockFaible, priceOf]);

  // ── Vue fiche produit ──
  if (detailRef) {
    if (!detailProduct) {
      return (
        <div className="text-center py-20">
          <p className="text-ink-secondary mb-4">Produit introuvable.</p>
          <button onClick={closeDetail} className="text-sv-primary hover:underline text-sm cursor-pointer">← Retour au catalogue</button>
        </div>
      );
    }

    const stock = detailProduct.stock_physique || 0;
    const enRupture = stock <= 0;
    const stockFaible = stock > 0 && stock <= seuilStockFaible;
    const etatLabels: Record<string, string> = { G: 'Géré', N: 'Fin de vie', B: 'Bloqué', S: 'Supprimé' };
    const etat = detailProduct.pdt_etat ? (etatLabels[detailProduct.pdt_etat.toUpperCase()] || detailProduct.pdt_etat) : null;
    const rows = [
      ['Référence', <span key="ref" className="font-mono font-bold">{detailProduct.pdt_reference}</span>],
      detailProduct.pdt_ean ? ['EAN', <span key="ean" className="font-mono text-sm">{formatEan(detailProduct.pdt_ean)}</span>] : null,
      detailProduct.gpv_reference ? ['Réf. GPV', <span key="gpv" className="font-mono text-sm">{detailProduct.gpv_reference}</span>] : null,
      detailProduct.pdt_code_stat ? ['Code stat', detailProduct.pdt_code_stat] : null,
      detailProduct.prix_base != null ? ['Prix base', `${detailProduct.prix_base.toFixed(2)} €`] : null,
      detailProduct.prix_coef_vente != null ? ['Coef. vente', detailProduct.prix_coef_vente.toFixed(4)] : null,
      detailProduct.prix_type ? ['Type prix', detailProduct.prix_type] : null,
    ].filter(Boolean) as [string, React.ReactNode][];

    return (
      <div className="max-w-3xl mx-auto">
        <button onClick={closeDetail}
          className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-sv-primary transition-colors mb-6 cursor-pointer group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Retour au catalogue
        </button>

        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-6 p-6 border-b border-border">
            <div className="shrink-0 w-full sm:w-56 h-56 rounded-xl border border-border bg-sv-grey-light flex items-center justify-center overflow-hidden">
              <ProductImage
                imageRef={detailProduct.pdt_reference}
                className="w-full h-full object-contain p-3"
              />
              <ImageOff className="w-16 h-16 text-border absolute opacity-0 peer-[&:not(img)]:opacity-100" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-ink mb-3 font-[family-name:var(--font-heading)]">{detailProduct.pdt_designation}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                {enRupture && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Rupture de stock</span>}
                {stockFaible && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Stock faible</span>}
                {!enRupture && !stockFaible && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">En stock</span>}
                {etat && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sv-grey-light text-ink-secondary border border-border">{etat}</span>}
              </div>
              {(() => { const px = priceOf(detailProduct.pdt_reference, detailProduct.prix_vente); return px != null ? (
                <div className="text-3xl font-extrabold text-sv-primary mb-4">
                  {px.toFixed(2)} €<span className="text-sm font-normal text-ink-secondary ml-1">HT</span>
                </div>
              ) : null; })()}
              <button onClick={handleAddToCartDetail} disabled={enRupture}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer
                  ${enRupture ? 'bg-sv-grey-light text-ink-secondary cursor-not-allowed'
                  : detailAdded ? 'bg-green-500 text-white'
                  : 'bg-sv-primary text-white hover:bg-sv-primary-dark'}`}>
                {detailAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                {detailAdded ? 'Ajouté !' : enRupture ? 'Indisponible' : 'Ajouter au panier'}
              </button>
            </div>
          </div>
          <div className="p-6">
            <h2 className="text-sm font-semibold text-ink-secondary uppercase tracking-wide mb-3">Informations produit</h2>
            <table className="w-full text-sm">
              <tbody>
                {rows.map(([label, value], i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-4 text-ink-secondary font-semibold whitespace-nowrap w-40">{label}</td>
                    <td className="py-2.5">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── Contenu sidebar (partagé entre aside desktop et drawer mobile) ──
  const sidebarContent = (
    <>
      {/* Catégories */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border bg-sv-grey-light">
          <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">Catégories</span>
        </div>
        <nav className="py-1 overflow-y-auto max-h-80">
          <button
            onClick={() => { setFilterCat(''); setFilterStat(''); }}
            className={`w-full text-left px-3 py-2 text-sm cursor-pointer ${!filterCat ? 'text-sv-primary font-semibold bg-sv-primary-light' : 'text-ink hover:bg-sv-grey-light'}`}
          >
            Toutes
          </button>
          {categories2.map((c2) => {
            const isExpanded = expandedCats.has(c2);
            const pdtCodes = pdtCodesPerCat2[c2] || [];
            return (
              <div key={c2}>
                <div className="flex items-center">
                  <button
                    onClick={() => { setFilterCat(filterCat === c2 ? '' : c2); setFilterStat(''); }}
                    className={`flex-1 text-left px-3 py-2 text-sm cursor-pointer ${filterCat === c2 ? 'text-sv-primary font-semibold bg-sv-primary-light' : 'text-ink hover:bg-sv-grey-light'}`}
                  >
                    {catLabels[c2] || c2}
                  </button>
                  {pdtCodes.length > 0 && (
                    <button
                      onClick={() => setExpandedCats((prev) => { const next = new Set(prev); if (next.has(c2)) next.delete(c2); else next.add(c2); return next; })}
                      className="px-2 py-2 text-ink-secondary hover:text-ink cursor-pointer"
                    >
                      {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </button>
                  )}
                </div>
                {isExpanded && pdtCodes.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setFilterCat(c2); setFilterStat(filterStat === s ? '' : s); }}
                    className={`w-full text-left pl-5 pr-3 py-1.5 text-xs cursor-pointer border-l-2 ml-3 ${filterStat === s ? 'border-sv-primary text-sv-primary font-semibold' : 'border-transparent text-ink-secondary hover:text-ink hover:border-border'}`}
                  >
                    {catLabels[s] || s}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Filtres avancés */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border bg-sv-grey-light flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wide flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3" /> Filtres
          </span>
          {hasAdvancedFilters && (
            <button
              onClick={() => { setFilterStock(new Set()); setFilterPriceMin(''); setFilterPriceMax(''); setFilterColisageMin(''); setFilterColisageMax(''); setSortBy(''); }}
              className="text-[10px] text-sv-primary hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <X className="w-2.5 h-2.5" /> Effacer
            </button>
          )}
        </div>
        <div className="overflow-y-auto max-h-80">
          {/* Tri */}
          <div className="border-b border-border last:border-0">
            <button onClick={() => toggleSection('sort')} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-ink-secondary hover:bg-sv-grey-light transition-colors cursor-pointer">
              <span className="flex items-center gap-1.5"><ArrowUpDown className="w-3 h-3" /> Tri {sortBy && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-sv-primary inline-block" />}</span>
              <span className="text-ink-secondary">{openSections.has('sort') ? '▴' : '▾'}</span>
            </button>
            {openSections.has('sort') && (
              <div className="px-2 pb-2 flex flex-col gap-0.5">
                {([
                  ['', 'Par défaut'],
                  ['ref_asc', 'Référence A→Z'],
                  ['ref_desc', 'Référence Z→A'],
                  ['designation_asc', 'Désignation A→Z'],
                  ['designation_desc', 'Désignation Z→A'],
                  ['price_asc', 'Prix croissant ↑'],
                  ['price_desc', 'Prix décroissant ↓'],
                ] as [SortBy, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setSortBy(val)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${sortBy === val ? 'bg-sv-primary text-white font-semibold' : 'text-ink hover:bg-sv-grey-light'}`}
                  >{label}</button>
                ))}
              </div>
            )}
          </div>
          {/* Disponibilité */}
          <div className="border-b border-border last:border-0">
            <button onClick={() => toggleSection('stock')} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-ink-secondary hover:bg-sv-grey-light transition-colors cursor-pointer">
              <span className="flex items-center gap-1.5">Disponibilité {filterStock.size > 0 && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-sv-primary inline-block" />}</span>
              <span>{openSections.has('stock') ? '▴' : '▾'}</span>
            </button>
            {openSections.has('stock') && (
              <div className="px-3 pb-2 flex flex-col gap-0.5">
                {([
                  ['en_stock', 'En stock', 'text-green-700 bg-green-50 border-green-200'],
                  ['stock_faible', 'Stock faible', 'text-orange-600 bg-orange-50 border-orange-200'],
                  ['rupture', 'Rupture', 'text-red-600 bg-red-50 border-red-200'],
                ] as const).map(([key, label, cls]) => (
                  <button
                    key={key}
                    onClick={() => setFilterStock((prev) => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; })}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${filterStock.has(key) ? cls + ' ring-1 ring-current' : 'text-ink border-transparent hover:bg-sv-grey-light'}`}
                  >{label}</button>
                ))}
              </div>
            )}
          </div>
          {/* Prix HT */}
          <div className="border-b border-border last:border-0">
            <button onClick={() => toggleSection('price')} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-ink-secondary hover:bg-sv-grey-light transition-colors cursor-pointer">
              <span className="flex items-center gap-1.5">Prix HT (€) {(filterPriceMin || filterPriceMax) && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-sv-primary inline-block" />}</span>
              <span>{openSections.has('price') ? '▴' : '▾'}</span>
            </button>
            {openSections.has('price') && (
              <div className="px-3 pb-3">
                <div className="flex items-center gap-1.5">
                  <input type="number" min={0} placeholder="Min" value={filterPriceMin} onChange={(e) => setFilterPriceMin(e.target.value)} className="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:border-sv-primary" />
                  <span className="text-ink-secondary text-xs shrink-0">—</span>
                  <input type="number" min={0} placeholder="Max" value={filterPriceMax} onChange={(e) => setFilterPriceMax(e.target.value)} className="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:border-sv-primary" />
                </div>
              </div>
            )}
          </div>
          {/* Colisage */}
          <div className="border-b border-border last:border-0">
            <button onClick={() => toggleSection('colisage')} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-ink-secondary hover:bg-sv-grey-light transition-colors cursor-pointer">
              <span className="flex items-center gap-1.5">Colisage {(filterColisageMin || filterColisageMax) && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-sv-primary inline-block" />}</span>
              <span>{openSections.has('colisage') ? '▴' : '▾'}</span>
            </button>
            {openSections.has('colisage') && (
              <div className="px-3 pb-3">
                <div className="flex items-center gap-1.5">
                  <input type="number" min={1} placeholder="Min" value={filterColisageMin} onChange={(e) => setFilterColisageMin(e.target.value)} className="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:border-sv-primary" />
                  <span className="text-ink-secondary text-xs shrink-0">—</span>
                  <input type="number" min={1} placeholder="Max" value={filterColisageMax} onChange={(e) => setFilterColisageMax(e.target.value)} className="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:border-sv-primary" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // ── Vue catalogue ──
  return (
    <>
      <h1 className="text-xl font-bold mb-2 text-sv-primary font-[family-name:var(--font-heading)]">Catalogue Pro</h1>

      {/* ── Drawer mobile overlay ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative z-10 w-72 max-w-[85vw] bg-white h-full overflow-y-auto flex flex-col gap-3 p-3 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">Catégories &amp; Filtres</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1 rounded-lg hover:bg-sv-grey-light cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      <div className="flex gap-5" style={{ height: 'calc(100vh - 210px)', alignItems: 'stretch' }}>

        {/* ── Sidebar desktop ── */}
        <aside className="hidden md:flex flex-col w-52 lg:w-60 xl:w-64 2xl:w-72 shrink-0 gap-3 overflow-y-auto pb-4">
          {sidebarContent}
        </aside>

        {/* ── Contenu principal ── */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
          <div className="flex gap-2 mb-4 shrink-0">
            <SearchBar placeholder="Rechercher par référence, désignation..." onSearch={setSearchQuery} className="flex-1" />
            <button
              onClick={() => setDrawerOpen(true)}
              className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold shrink-0 transition-colors cursor-pointer ${(filterCat || filterStat || hasAdvancedFilters) ? 'bg-sv-primary text-white border-sv-primary' : 'bg-white text-ink border-border hover:border-sv-primary hover:text-sv-primary'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
              {(filterCat || filterStat || hasAdvancedFilters) && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block ml-0.5" />}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4 shrink-0">
            {(filterCat || filterStat || searchQuery || hasAdvancedFilters) && (
              <button
                onClick={() => { setFilterCat(''); setFilterStat(''); setSearchQuery(''); setFilterStock(new Set()); setFilterPriceMin(''); setFilterPriceMax(''); setFilterColisageMin(''); setFilterColisageMax(''); setSortBy(''); }}
                className="text-xs text-sv-primary hover:underline cursor-pointer"
              >
                Réinitialiser tout
              </button>
            )}
            <span className="text-sm text-ink-secondary">{filtered.length} article(s)</span>
          </div>

          <div className="overflow-y-auto flex-1 min-h-0 pr-1">
          {authLoading ? (
            <div className="py-16 text-center text-ink-secondary">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-ink-secondary italic">Aucun article trouvé.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {filtered.map((p, i) => {
                if (p._declinaisonId) {
                  return (
                    <div key={p._declinaisonId} className="col-span-full flex items-center gap-3 pt-3 pb-1 border-b border-border">
                      <span className="text-sm font-bold text-ink">{p.pdt_designation}</span>
                      {p.sous_titre && <span className="text-xs text-ink-secondary">{p.sous_titre}</span>}
                      <button
                        onClick={() => openDecModal(p._declinaisonId!)}
                        className="ml-auto text-xs px-3 py-1 bg-sv-primary text-white rounded-full font-semibold hover:bg-sv-primary-dark transition-colors cursor-pointer"
                      >
                        Voir variants
                      </button>
                    </div>
                  );
                }

                const ref = p.pdt_reference!;
                const col = p.quantite_colisage ?? 1;
                const qty = getQty(ref, col);
                const inRupture = (p.stock_physique || 0) <= 0;
                const isLowStock = !inRupture && (p.stock_physique || 0) <= seuilStockFaible;
                const price = priceOf(ref, p.prix_vente);

                return (
                  <div key={ref ?? i} className="bg-white border border-border rounded-xl overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-200">

                    <div
                      className="relative bg-sv-grey-light aspect-square flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => openDetail(ref)}
                    >
                      <ProductImage imageRef={ref} className="w-full h-full object-contain p-2" />
                      {inRupture && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                          Rupture
                        </span>
                      )}
                      {isLowStock && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold bg-orange-400 text-white px-1.5 py-0.5 rounded-full leading-none">
                          Faible
                        </span>
                      )}
                    </div>

                    <div className="px-3 pt-2.5 pb-1 flex flex-col gap-0.5 cursor-pointer" onClick={() => openDetail(ref)}>
                      <p className="text-[11px] font-semibold text-ink leading-snug line-clamp-2 min-h-[2.5em]">
                        {p.pdt_designation}
                      </p>
                      <p className="text-[10px] font-mono text-ink-secondary">{ref}</p>
                      <p className="text-sm font-extrabold text-sv-primary mt-1">
                        {price != null ? `${price.toFixed(2)} €` : '—'}
                      </p>
                    </div>

                    <div className="px-2.5 pb-2.5 pt-1 mt-auto" onClick={(e) => e.stopPropagation()}>
                      {inRupture ? (
                        <div className="text-center text-[11px] text-red-500 font-semibold py-1">Indisponible</div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] text-ink-secondary uppercase tracking-wide">Col. <span className="font-bold text-ink">{col}</span></span>
                            <span className="text-[9px] text-ink-secondary font-mono">{qty} u.</span>
                          </div>
                          <div className="flex items-center gap-0.5 mb-1.5">
                            <button onClick={() => stepDown(ref, col)} title={`−${col}`}
                              className="flex-1 py-1 text-[11px] font-bold border border-border rounded-md hover:bg-sv-grey-light transition-colors cursor-pointer leading-none">−−</button>
                            <button onClick={() => adjustQty(ref, col, -1)}
                              className="flex-1 py-1 text-[11px] font-bold border border-border rounded-md hover:bg-sv-grey-light transition-colors cursor-pointer leading-none">−</button>
                            <input
                              type="number" min={1} value={qty}
                              onChange={(e) => setQty(ref, parseInt(e.target.value) || 1)}
                              className="w-10 py-1 border border-border rounded-md text-[11px] text-center focus:outline-none focus:border-sv-primary font-mono"
                            />
                            <button onClick={() => adjustQty(ref, col, 1)}
                              className="flex-1 py-1 text-[11px] font-bold border border-border rounded-md hover:bg-sv-grey-light transition-colors cursor-pointer leading-none">+</button>
                            <button onClick={() => stepUp(ref, col)} title={`+${col}`}
                              className="flex-1 py-1 text-[11px] font-bold border border-border rounded-md hover:bg-sv-grey-light transition-colors cursor-pointer leading-none">++</button>
                          </div>
                          <button
                            onClick={() => handleAddToCart(p)}
                            className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                              addedRef === ref
                                ? 'bg-green-500 text-white'
                                : 'bg-sv-primary text-white hover:bg-sv-primary-dark'
                            }`}
                          >
                            {addedRef === ref
                              ? <><Check className="w-3 h-3" /> Ajouté</>
                              : <><ShoppingCart className="w-3 h-3" /> Panier</>}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>

      <Modal open={!!modalDec} onClose={() => setModalDec(null)}>
        {modalDec && (
          <>
            <ModalTitle>{modalDec.designation}</ModalTitle>
            <p className="text-sm text-ink-secondary mb-4">{modalDec.sous_titre}</p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-sv-grey-light">
                  <th className="text-left px-3 py-2 font-semibold text-ink-secondary border-b border-border">Variante</th>
                  <th className="text-left px-3 py-2 font-semibold text-ink-secondary border-b border-border">Référence</th>
                  <th className="text-left px-3 py-2 font-semibold text-ink-secondary border-b border-border">Prix</th>
                </tr></thead>
                <tbody>
                  {modalDec.variants.map((v) => {
                    const article = catalogueBrut.find((p) => p.pdt_reference === v.ref);
                    if (!article) return null;
                    return (
                      <tr key={v.ref} className="border-b border-border/50">
                        <td className="px-3 py-2">{v.label}</td>
                        <td className="px-3 py-2 font-mono text-xs text-ink-secondary">{v.ref}</td>
                        <td className="px-3 py-2 font-bold text-sv-primary">{(() => { const px = priceOf(v.ref, article?.prix_vente); return px != null ? `${px.toFixed(2)} €` : '—'; })()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ModalActions>
              <button onClick={() => setModalDec(null)} className="px-4 py-2 bg-sv-grey-light text-ink rounded-lg text-sm font-semibold border border-border hover:bg-sv-grey transition-colors cursor-pointer">Fermer</button>
            </ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
