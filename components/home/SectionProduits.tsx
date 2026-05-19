'use client';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Reveal } from '@/components/ui/Reveal';
import EditableText from '@/components/editable/EditableText';
import Link from 'next/link';
import type { Product } from '@/lib/firestore/products';
import { useIframeEdit } from '@/lib/iframe-edit-context';

const BG_COLORS = ['#fdeaef', '#e8f8f7', '#eef0fb', '#fde8dd', '#f0edf8', '#fafbfc'];

function ProductCard({ product, badge, index }: { product: Product; badge: string; index: number }) {
  const [hov, setHov] = useState(false);
  const bg = BG_COLORS[index % BG_COLORS.length];

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0',
      transform: hov ? 'translateY(-6px)' : 'none',
      boxShadow: hov ? '0 16px 40px rgba(232,24,90,0.07)' : '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)', cursor: 'pointer', position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, background: '#E8185A', color: '#fff', fontSize: 10, fontFamily: 'var(--font-heading)', fontWeight: 700, padding: '3px 10px', borderRadius: 999, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {badge}
      </div>
      <div style={{ height: 200, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Icon name="box" size={64} color="rgba(0,0,0,0.1)" strokeWidth={1} />
        <div style={{
          position: 'absolute', bottom: 12, left: '50%', transform: `translateX(-50%) scale(${hov ? 1 : 0.8})`,
          opacity: hov ? 1 : 0, transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
          background: '#E8185A', color: '#fff', borderRadius: 8, padding: '8px 16px',
          fontSize: 11, fontFamily: 'var(--font-heading)', fontWeight: 700, whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="cart" size={13} color="#fff" />
          + Panier
        </div>
      </div>
      <div style={{ padding: '16px 16px 20px' }}>
        <div style={{ fontSize: 10, color: '#9e9e9e', fontFamily: 'var(--font-body)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
          {product.pdt_reference}
        </div>
        <div style={{ fontSize: 14, fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#1e2a35', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.pdt_designation}
        </div>
      </div>
    </div>
  );
}

interface SectionProduitsProps {
  title: string;
  titleId: string;
  badge: string;
  viewAllId: string;
  sectionId?: string;
  products?: Product[];
}

export function SectionProduits({ title, titleId, badge, viewAllId, sectionId, products = [] }: SectionProduitsProps) {
  const { isIframeMode, getContent } = useIframeEdit();
  const displayProducts = products.slice(0, 8);

  if (!isIframeMode && displayProducts.length === 0) return null;

  const handleEditSection = () => {
    if (!sectionId) return;
    const stored = getContent('home', `${sectionId}_products`);
    const currentIds: string[] = stored ? JSON.parse(stored) : [];
    window.parent.postMessage({ type: 'SECTION_PRODUCTS_SELECTED', sectionId, currentIds }, '*');
  };

  return (
    <section style={{ background: '#fff', padding: '80px 32px', position: 'relative' }}>
      {isIframeMode && sectionId && (
        <button
          onClick={(e) => { e.stopPropagation(); handleEditSection(); }}
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 30,
            background: '#E8185A', color: '#fff', border: 'none',
            borderRadius: 8, padding: '6px 14px', fontSize: 11,
            fontFamily: 'var(--font-heading)', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ✎ Choisir les produits
        </button>
      )}
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Reveal>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
            <div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, color: '#E8185A', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>Sélection</div>
              <h2 style={{ fontSize: 32, fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#1e2a35', margin: 0 }}>
                <EditableText page="home" id={titleId}>{title}</EditableText>
              </h2>
            </div>
            <Link href="/catalogue" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 700, color: '#E8185A', textDecoration: 'none' }}>
              <EditableText page="home" id={viewAllId}>Voir tout</EditableText>
              <Icon name="arrowRight" size={14} color="#E8185A" />
            </Link>
          </div>
        </Reveal>
        {displayProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9e9e9e', fontSize: 13, border: '2px dashed #e2e8f0', borderRadius: 12 }}>
            Aucun produit sélectionné — cliquez sur &quot;Choisir les produits&quot;
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {displayProducts.map((p, i) => (
              <Reveal key={p.pdt_reference} delay={i * 0.06}>
                <Link href={`/fiche-technique?ref=${p.pdt_reference}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <ProductCard product={p} badge={badge} index={i} />
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
