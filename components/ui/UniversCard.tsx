import Link from 'next/link';
import type { ReactNode } from 'react';

interface UniversCardProps {
  nom: ReactNode;
  codeGamme?: string;
  description?: ReactNode;
  href: string;
  className?: string;
}

export default function UniversCard({ nom, codeGamme, description, href, className = '' }: UniversCardProps) {
  return (
    <Link
      href={href}
      className={`group relative bg-white border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all block ${className}`}
    >
      {/* Image ambiance placeholder */}
      <div className="bg-gradient-to-br from-sv-primary/10 to-sv-orange/10 h-44 flex items-center justify-center text-sv-grey-dark text-xs">
        Photo ambiance
      </div>

      <div className="p-4">
        <h3 className="text-sm font-bold text-ink group-hover:text-sv-primary transition-colors mb-1">
          {nom}
        </h3>
        {codeGamme && (
          <p className="font-mono text-xs text-sv-orange font-semibold mb-1">{codeGamme}</p>
        )}
        {description && (
          <p className="text-xs text-ink-secondary line-clamp-2">{description}</p>
        )}
      </div>
    </Link>
  );
}
