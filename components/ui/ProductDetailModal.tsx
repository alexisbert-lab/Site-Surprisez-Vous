'use client';

import { useState } from 'react';
import Modal, { ModalTitle, ModalActions } from './Modal';
import { formatEan, type Product } from '@/lib/firestore/products';
import { getProductImageUrl } from '@/lib/firebase';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
  seuilStockFaible?: number;
}

export default function ProductDetailModal({ product, onClose, onAddToCart, seuilStockFaible = 20 }: ProductDetailModalProps) {
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  const stock = product.stock_physique || 0;
  const enRupture = stock <= 0;
  const stockFaible = stock > 0 && stock <= seuilStockFaible;

  const stockBadge = enRupture
    ? <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Rupture de stock</span>
    : stockFaible
    ? <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Stock faible</span>
    : <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">En stock</span>;

  const etatLabels: Record<string, string> = { G: 'Géré', N: 'Fin de vie', B: 'Bloqué', S: 'Supprimé' };
  const etat = product.pdt_etat ? (etatLabels[product.pdt_etat.toUpperCase()] || product.pdt_etat) : null;

  const imageUrl = getProductImageUrl(product.pdt_reference);

  return (
    <Modal open={!!product} onClose={onClose} size="xl">
      <div className="flex flex-col sm:flex-row gap-6">

        {/* Image */}
        <div className="sm:w-48 shrink-0">
          {!imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.pdt_designation}
              onError={() => setImgError(true)}
              className="w-full sm:w-48 h-48 object-contain rounded-xl border border-border bg-sv-grey-light"
            />
          ) : (
            <div className="w-full sm:w-48 h-48 rounded-xl border border-border bg-sv-grey-light flex items-center justify-center">
              <svg className="w-16 h-16 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Détails */}
        <div className="flex-1 min-w-0">
          <ModalTitle>{product.pdt_designation}</ModalTitle>

          <div className="flex flex-wrap gap-2 mb-4">
            {stockBadge}
            {etat && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sv-grey-light text-ink-secondary border border-border">{etat}</span>}
            {product.pdt_code_stat && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sv-primary/10 text-sv-primary">{product.pdt_code_stat}</span>}
          </div>

          <table className="w-full text-sm mb-4">
            <tbody>
              {[
                ['Référence', <span key="ref" className="font-mono font-bold">{product.pdt_reference}</span>],
                product.pdt_ean ? ['EAN', <span key="ean" className="font-mono">{formatEan(product.pdt_ean)}</span>] : null,
                product.gpv_reference ? ['Réf. GPV', <span key="gpv" className="font-mono">{product.gpv_reference}</span>] : null,
              ].filter(Boolean).map((row, i) => { const [label, value] = row as [string, React.ReactNode]; return (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 pr-4 text-ink-secondary font-semibold whitespace-nowrap w-36">{label as string}</td>
                  <td className="py-1.5">{value as React.ReactNode}</td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
      </div>

      <ModalActions>
        {onAddToCart && !enRupture && (
          <button
            onClick={() => { onAddToCart(product); onClose(); }}
            className="px-5 py-2 bg-sv-primary text-white font-semibold rounded-lg text-sm hover:bg-sv-primary-dark transition-colors cursor-pointer"
          >
            + Ajouter au panier
          </button>
        )}
        <button
          onClick={onClose}
          className="px-5 py-2 bg-sv-grey-light text-ink font-semibold rounded-lg text-sm border border-border hover:bg-sv-grey transition-colors cursor-pointer"
        >
          Fermer
        </button>
      </ModalActions>
    </Modal>
  );
}
