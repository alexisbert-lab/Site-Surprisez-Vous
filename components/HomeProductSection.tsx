'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useIframeEdit } from '@/lib/iframe-edit-context';
import type { Product } from '@/lib/firestore/products';
import { api } from '@/lib/api';
import { getProductImageUrl } from '@/lib/firebase';

const PAGE_SIZE = 8;

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const palette = ['#E8185A', '#2B3EA0', '#3DBDB0', '#6B4FA0', '#d97706', '#be185d', '#0d9488', '#7c3aed'];
  return palette[Math.abs(hash) % palette.length];
}

function parseIds(raw: string | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function ProductCard({ product, badge }: { product: Product; badge?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const bg = hashColor(product.pdt_reference);
  const outOfStock = (product.stock_physique || 0) <= 0;
  const imgUrl = getProductImageUrl(product.pdt_reference);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transition = 'box-shadow 0.1s ease';
      card.style.transform = `perspective(700px) rotateY(${x * 20}deg) rotateX(${-y * 20}deg) translateZ(12px) scale(1.04)`;
      card.style.boxShadow = `${-x * 24}px ${y * 24}px 36px rgba(0,0,0,0.22), 0 4px 20px rgba(0,0,0,0.1)`;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = 'transform 0.55s cubic-bezier(0.23,1,0.32,1), box-shadow 0.55s cubic-bezier(0.23,1,0.32,1)';
    card.style.transform = 'perspective(700px) rotateY(0deg) rotateX(0deg) translateZ(0px) scale(1)';
    card.style.boxShadow = '';
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="rounded-xl overflow-hidden shadow-sm cursor-pointer group"
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
    >
      {/* Image / couleur de fond */}
      <div className="relative h-44 overflow-hidden" style={{ backgroundColor: bg }}>
        <img
          src={imgUrl}
          alt={product.pdt_designation}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {badge && (
          <span className="absolute top-2 left-2 z-10 bg-sv-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-2 right-2 z-10 bg-red-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
            Rupture
          </span>
        )}
        <span className="absolute bottom-2 right-2 z-10 text-white/80 font-mono text-[10px] bg-black/30 px-1.5 py-0.5 rounded">
          {product.pdt_reference}
        </span>
      </div>

      {/* Footer */}
      <div className="bg-sv-primary group-hover:bg-sv-primary-dark px-3 py-2.5 transition-colors">
        <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">{product.pdt_designation}</h3>
        <p className="text-white/70 text-xs mt-0.5">Voir le produit →</p>
      </div>
    </div>
  );
}

interface Props {
  sectionId: 'nouveautes' | 'bestsellers';
  badge: string;
  initialProducts: Product[];
}

export default function HomeProductSection({ sectionId, badge, initialProducts }: Props) {
  const { isIframeMode, getContent } = useIframeEdit();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Carrousel
  const [currentPage, setCurrentPage] = useState(0);
  const [fading, setFading] = useState(false);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);

  useEffect(() => { setMounted(true); }, []);

  const key = `${sectionId}_products`;
  const iframeIds = mounted && isIframeMode ? parseIds(getContent('home', key)) : null;

  useEffect(() => {
    if (!isIframeMode || !mounted) return;
    const ids = parseIds(getContent('home', key));
    if (!ids.length) { setProducts([]); return; }
    api.getProducts().then((all) => {
      const map = new Map(all.map((p) => [p.pdt_reference, p]));
      setProducts(ids.map((id) => map.get(id)).filter(Boolean) as Product[]);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIframeMode, mounted, JSON.stringify(iframeIds)]);

  useEffect(() => { setCurrentPage(0); }, [products.length]);

  const pageCount = Math.ceil(products.length / PAGE_SIZE);
  const useCarousel = products.length > PAGE_SIZE;
  const displayedProducts = useCarousel
    ? products.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
    : products;

  const goToPage = useCallback((newPage: number) => {
    if (fading || newPage === currentPage || newPage < 0 || newPage >= pageCount) return;
    setSlideDir(newPage > currentPage ? 1 : -1);
    setFading(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setFading(false);
    }, 280);
  }, [fading, currentPage, pageCount]);

  const notifyEditor = () => {
    window.parent.postMessage({ type: 'SECTION_PRODUCTS_SELECTED', sectionId, currentIds: products.map((p) => p.pdt_reference) }, '*');
  };

  /* ── Skeleton ── */
  if (!mounted) {
    return (
      <div className="flex flex-wrap justify-center gap-4">
        {[...Array(sectionId === 'nouveautes' ? 8 : 4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-gray-100 animate-pulse"
            style={{ width: 'calc(25% - 12px)', minWidth: '160px', maxWidth: '280px', height: '198px' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Overlay éditeur iframe */}
      {isIframeMode && (
        <div
          onClick={notifyEditor}
          className="absolute inset-0 z-10 border-2 border-dashed border-blue-400 rounded-xl bg-blue-500/5 hover:bg-blue-500/15 cursor-pointer transition-colors flex items-center justify-center"
        >
          <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow pointer-events-none">
            Configurer les produits
          </span>
        </div>
      )}

      {/* Grille animée */}
      <div
        className={isIframeMode ? 'pointer-events-none select-none' : ''}
        style={{
          opacity: fading ? 0 : 1,
          transform: fading ? `translateX(${slideDir * -50}px)` : 'translateX(0)',
          transition: fading ? 'none' : 'opacity 0.28s ease, transform 0.28s ease',
        }}
      >
        {products.length === 0 ? (
          <p className="text-center py-10 text-sm text-gray-400">
            {isIframeMode ? 'Cliquez pour sélectionner des produits' : 'Aucun produit configuré'}
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {displayedProducts.map((p) => (
              <div
                key={p.pdt_reference}
                style={{ width: 'calc(25% - 12px)', minWidth: '160px', maxWidth: '280px' }}
              >
                <ProductCard product={p} badge={badge} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contrôles carrousel */}
      {useCarousel && !isIframeMode && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-sv-primary hover:text-sv-primary disabled:opacity-30 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i)}
                className="cursor-pointer rounded-full transition-all duration-300"
                style={{
                  width: i === currentPage ? '24px' : '8px',
                  height: '8px',
                  backgroundColor: i === currentPage ? 'var(--color-sv-primary, #E8185A)' : '#d1d5db',
                }}
              />
            ))}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === pageCount - 1}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-sv-primary hover:text-sv-primary disabled:opacity-30 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
