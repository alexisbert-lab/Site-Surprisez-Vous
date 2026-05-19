import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav aria-label="Fil d'Ariane" className={`flex items-center gap-2 text-sm text-ink-secondary ${className}`}>
      <Link href="/" className="hover:text-sv-primary transition-colors">Accueil</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="text-border">/</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-sv-primary transition-colors">{item.label}</Link>
          ) : (
            <span className="text-ink font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
