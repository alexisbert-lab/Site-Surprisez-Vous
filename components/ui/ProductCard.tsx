'use client';

import { type Product, isEnRupture, isStockFaible, formatEan } from '@/lib/firestore/products';
import { ProductImage } from '@/components/ui/ProductImage';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (ref: string, qty: number) => void;
  showCart?: boolean;
}

export default function ProductCard({ product, onAddToCart, showCart = true }: ProductCardProps) {
  const colisage = product.quantite_colisage || 1;
  const [qty, setQty] = useState(colisage);
  const rupture = isEnRupture(product);
  const stockFaible = isStockFaible(product);

  const adjust = (delta: number) => setQty((q) => Math.max(1, q + delta));

  return (
    <div className="bg-white border border-border rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col">
      {/* Image produit */}
      <div className="bg-sv-grey-light rounded-lg h-40 mb-3 overflow-hidden flex items-center justify-center">
        <ProductImage imageRef={product.pdt_reference} />
      </div>

      {/* Infos */}
      <h3 className="text-sm font-semibold text-ink leading-tight mb-1 line-clamp-2">
        {product.pdt_designation}
      </h3>
      <p className="font-mono text-xs text-ink-secondary mb-1">Réf. {product.pdt_reference}</p>
      {product.pdt_ean && (
        <p className="font-mono text-xs text-ink-secondary mb-2">EAN {formatEan(product.pdt_ean)}</p>
      )}

      {/* Stock */}
      <div className="mt-auto">
        {rupture ? (
          <span className="inline-block text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full mb-2">Rupture</span>
        ) : stockFaible ? (
          <span className="inline-block text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mb-2">Stock faible</span>
        ) : (
          <span className="inline-block text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full mb-2">En stock</span>
        )}

        {showCart && !rupture && onAddToCart && (
          <div className="flex flex-col gap-2">
            {/* Colisage label */}
            <div className="flex items-center justify-between text-[11px] text-ink-secondary">
              <span>Colisage : <span className="font-semibold text-ink">{colisage}</span></span>
              <span className="font-mono">{qty} unité{qty > 1 ? 's' : ''}</span>
            </div>

            {/* Contrôles quantité */}
            <div className="flex items-center gap-1">
              {/* -- colisage */}
              <button
                onClick={() => adjust(-colisage)}
                className="px-2 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title={`−1 colisage (−${colisage})`}
              >−−</button>

              {/* - unité */}
              <button
                onClick={() => adjust(-1)}
                className="px-2 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >−</button>

              {/* Quantité */}
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 px-1 py-1.5 border border-border rounded-lg text-sm text-center focus:outline-none focus:border-sv-primary"
              />

              {/* + unité */}
              <button
                onClick={() => adjust(1)}
                className="px-2 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >+</button>

              {/* ++ colisage */}
              <button
                onClick={() => adjust(colisage)}
                className="px-2 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title={`+1 colisage (+${colisage})`}
              >++</button>
            </div>

            {/* Bouton panier */}
            <button
              onClick={() => onAddToCart(product.pdt_reference, qty)}
              className="w-full px-3 py-1.5 bg-sv-primary text-white text-sm font-semibold rounded-lg hover:bg-sv-primary-dark transition-colors cursor-pointer"
            >
              + Panier
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
