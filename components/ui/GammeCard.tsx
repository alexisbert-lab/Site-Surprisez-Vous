import Link from 'next/link';

interface GammeCardProps {
  nom: string;
  description?: string;
  href: string;
  productCount?: number;
  promo?: boolean;
  className?: string;
}

export default function GammeCard({ nom, description, href, productCount, promo, className = '' }: GammeCardProps) {
  return (
    <Link
      href={href}
      className={`group relative bg-white border border-border rounded-xl p-5 hover:shadow-lg hover:border-sv-primary/30 transition-all block ${className}`}
    >
      {promo && (
        <span className="absolute top-3 right-3 bg-sv-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
          Promo
        </span>
      )}

      {/* Image placeholder */}
      <div className="bg-sv-grey-light rounded-lg h-32 mb-3 flex items-center justify-center text-sv-grey-dark text-xs group-hover:bg-sv-primary-light transition-colors">
        Gamme
      </div>

      <h3 className="text-sm font-bold text-ink group-hover:text-sv-primary transition-colors mb-1">
        {nom}
      </h3>
      {description && (
        <p className="text-xs text-ink-secondary line-clamp-2 mb-2">{description}</p>
      )}
      {productCount !== undefined && (
        <p className="text-xs text-ink-secondary">{productCount} produit{productCount > 1 ? 's' : ''}</p>
      )}
    </Link>
  );
}
