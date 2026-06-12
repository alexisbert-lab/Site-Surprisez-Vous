'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { filterArticlesVisiblesWithStatCats, type Product } from '@/lib/firestore/products';
import { type StatCategory } from '@/lib/firestore/stat-categories';
import { type Marque } from '@/lib/firestore/marques';
import SearchBar from '@/components/ui/SearchBar';
import { ProductImage } from '@/components/ui/ProductImage';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Tab = 'gamme' | 'marque' | 'search';

interface Props {
  products: Product[];
  statCategories: StatCategory[];
  marques: Marque[];
  productMarques: Record<string, string>;
}

function ProductCard({ product, gammeLabel }: { product: Product; gammeLabel?: string }) {
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="aspect-square bg-sv-grey-light flex items-center justify-center overflow-hidden">
        <ProductImage imageRef={product.pdt_reference} className="w-full h-full object-contain p-2" />
      </div>
      <div className="p-3 flex flex-col gap-1">
        {gammeLabel && (
          <span className="text-xs font-semibold text-sv-primary bg-sv-primary-light px-2 py-0.5 rounded-full w-fit">
            {gammeLabel}
          </span>
        )}
        <p className="text-xs text-ink-secondary font-mono">{product.pdt_reference}</p>
        <p className="text-sm font-semibold text-ink leading-tight line-clamp-2">{product.pdt_designation}</p>
      </div>
    </div>
  );
}

function GammeGrid({ gammes, onSelect }: {
  gammes: { cat: StatCategory; count: number }[];
  onSelect: (code: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {gammes.map(({ cat, count }) => (
        <button
          key={cat.code}
          onClick={() => onSelect(cat.code)}
          className="bg-white border border-border rounded-xl p-5 text-left hover:border-sv-primary/60 hover:shadow-md transition-all group cursor-pointer"
        >
          <p className="font-bold text-ink group-hover:text-sv-primary transition-colors">{cat.designation}</p>
          <p className="text-sm text-ink-secondary mt-1">{count} article{count > 1 ? 's' : ''}</p>
        </button>
      ))}
    </div>
  );
}

function MarqueGrid({ marques, onSelect }: {
  marques: { marque: Marque; count: number }[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {marques.map(({ marque, count }) => (
        <button
          key={marque.id}
          onClick={() => onSelect(marque.id)}
          className="bg-white border border-border rounded-xl p-5 text-left hover:border-sv-primary/60 hover:shadow-md transition-all group cursor-pointer flex flex-col items-center gap-2"
        >
          {marque.logo_url ? (
            <img src={marque.logo_url} alt={marque.nom} className="h-12 w-auto object-contain" />
          ) : (
            <div className="h-12 w-full flex items-center justify-center">
              <span className="text-lg font-extrabold text-sv-primary group-hover:text-sv-primary-dark transition-colors">
                {marque.nom}
              </span>
            </div>
          )}
          {marque.logo_url && (
            <p className="text-sm font-semibold text-ink text-center">{marque.nom}</p>
          )}
          <p className="text-xs text-ink-secondary">{count} article{count > 1 ? 's' : ''}</p>
        </button>
      ))}
    </div>
  );
}

export default function CatalogueClient({ products, statCategories, marques, productMarques }: Props) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && (profile?.role === 'pro' || profile?.role === 'admin')) {
      router.replace('/pro/catalogue');
    }
  }, [loading, profile, router]);

  const initialTab = (searchParams.get('tab') as Tab | null) ?? 'gamme';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selectedGamme, setSelectedGamme] = useState<string | null>(null);
  const [selectedMarque, setSelectedMarque] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const visibleProducts = useMemo(
    () => filterArticlesVisiblesWithStatCats(products, statCategories),
    [products, statCategories]
  );

  const gammes = useMemo(() => {
    return statCategories
      .filter((c) => c.niveau === 1 && c.actif)
      .map((cat) => ({
        cat,
        count: visibleProducts.filter((p) => (p.pdt_code_stat || '').startsWith(cat.code)).length,
      }))
      .filter(({ count }) => count > 0)
      .sort((a, b) => a.cat.designation.localeCompare(b.cat.designation, 'fr'));
  }, [visibleProducts, statCategories]);

  const activeMarques = useMemo(() => {
    return marques
      .filter((m) => m.actif)
      .map((marque) => ({
        marque,
        count: visibleProducts.filter((p) => productMarques[p.pdt_reference] === marque.id).length,
      }))
      .filter(({ count }) => count > 0)
      .sort((a, b) => a.marque.nom.localeCompare(b.marque.nom, 'fr'));
  }, [marques, visibleProducts, productMarques]);

  const gammeLabel = useMemo(() => {
    if (!selectedGamme) return undefined;
    return statCategories.find((c) => c.code === selectedGamme)?.designation;
  }, [selectedGamme, statCategories]);

  const marqueLabel = useMemo(() => {
    if (!selectedMarque) return undefined;
    return marques.find((m) => m.id === selectedMarque)?.nom;
  }, [selectedMarque, marques]);

  const displayedProducts = useMemo(() => {
    if (tab === 'gamme' && selectedGamme) {
      return visibleProducts.filter((p) => (p.pdt_code_stat || '').startsWith(selectedGamme));
    }
    if (tab === 'marque' && selectedMarque) {
      return visibleProducts.filter((p) => productMarques[p.pdt_reference] === selectedMarque);
    }
    if (tab === 'search' && search.trim()) {
      const q = search.toLowerCase();
      return visibleProducts.filter(
        (p) =>
          p.pdt_reference?.toLowerCase().includes(q) ||
          p.pdt_designation?.toLowerCase().includes(q) ||
          p.pdt_ean?.toLowerCase().includes(q)
      );
    }
    return [];
  }, [tab, selectedGamme, selectedMarque, search, visibleProducts, productMarques]);

  const getGammeForProduct = (p: Product) =>
    statCategories.find((c) => c.niveau === 1 && (p.pdt_code_stat || '').startsWith(c.code))?.designation;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-ink-secondary text-sm">
        Chargement…
      </div>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'gamme', label: 'Par gamme' },
    { key: 'marque', label: 'Par marque' },
    { key: 'search', label: 'Recherche' },
  ];

  const DISABLED_TABS = [
    { label: 'Par thème', soon: true },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-sv-primary mb-2 font-[family-name:var(--font-heading)]">
        Notre Catalogue
      </h1>
      <p className="text-ink-secondary mb-8">
        Découvrez nos articles par gamme ou par marque.
      </p>

      {/* Tab nav */}
      <div className="flex gap-1 bg-sv-grey-light rounded-xl p-1 w-fit mb-8">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              setSelectedGamme(null);
              setSelectedMarque(null);
              setSearch('');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              tab === key
                ? 'bg-white text-sv-primary shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
        {DISABLED_TABS.map(({ label }) => (
          <span
            key={label}
            title="Bientôt disponible"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-ink-secondary/40 cursor-not-allowed select-none"
          >
            {label}
          </span>
        ))}
      </div>

      {/* Par gamme */}
      {tab === 'gamme' && (
        <>
          {!selectedGamme ? (
            <GammeGrid gammes={gammes} onSelect={setSelectedGamme} />
          ) : (
            <>
              <button
                onClick={() => setSelectedGamme(null)}
                className="flex items-center gap-1.5 text-sm text-sv-primary hover:underline mb-5 cursor-pointer"
              >
                <ArrowLeft size={16} /> Toutes les gammes
              </button>
              <h2 className="text-xl font-bold text-ink mb-5">{gammeLabel}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayedProducts.map((p) => (
                  <ProductCard key={p.pdt_reference} product={p} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Par marque */}
      {tab === 'marque' && (
        <>
          {!selectedMarque ? (
            activeMarques.length > 0 ? (
              <MarqueGrid marques={activeMarques} onSelect={setSelectedMarque} />
            ) : (
              <p className="text-ink-secondary text-sm">Aucune marque disponible pour le moment.</p>
            )
          ) : (
            <>
              <button
                onClick={() => setSelectedMarque(null)}
                className="flex items-center gap-1.5 text-sm text-sv-primary hover:underline mb-5 cursor-pointer"
              >
                <ArrowLeft size={16} /> Toutes les marques
              </button>
              <h2 className="text-xl font-bold text-ink mb-5">{marqueLabel}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayedProducts.map((p) => (
                  <ProductCard key={p.pdt_reference} product={p} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Recherche */}
      {tab === 'search' && (
        <>
          <SearchBar
            placeholder="Référence, désignation, EAN…"
            onSearch={setSearch}
            className="mb-6 max-w-lg"
          />
          {search.trim() ? (
            <>
              <p className="text-sm text-ink-secondary mb-4">{displayedProducts.length} résultat{displayedProducts.length !== 1 ? 's' : ''}</p>
              {displayedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {displayedProducts.map((p) => (
                    <ProductCard key={p.pdt_reference} product={p} gammeLabel={getGammeForProduct(p)} />
                  ))}
                </div>
              ) : (
                <p className="text-ink-secondary text-sm italic">Aucun article trouvé.</p>
              )}
            </>
          ) : (
            <p className="text-ink-secondary text-sm">Saisissez au moins un mot-clé pour rechercher.</p>
          )}
        </>
      )}

      {/* CTA espace pro */}
      {!profile && (
        <div className="mt-16 bg-sv-primary-light rounded-2xl p-8 text-center">
          <p className="text-sv-primary font-semibold text-lg mb-2">Vous êtes professionnel ?</p>
          <p className="text-ink-secondary text-sm mb-5">
            Accédez à l'ensemble du catalogue avec vos tarifs personnalisés, gérez vos commandes et paniers.
          </p>
          <Link
            href="/pro/connexion"
            className="inline-block bg-sv-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-sv-primary-dark transition-colors"
          >
            Accéder à l'espace pro
          </Link>
        </div>
      )}
    </div>
  );
}
