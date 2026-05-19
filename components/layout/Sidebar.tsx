'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SidebarCategory {
  id: string;
  nom: string;
  href: string;
  children?: SidebarCategory[];
}

interface SidebarBrand {
  slug: string;
  nom: string;
}

interface SidebarProps {
  categories: SidebarCategory[];
  brands?: SidebarBrand[];
  activeCategoryId?: string;
  className?: string;
}

export default function Sidebar({ categories, brands = [], activeCategoryId, className = '' }: SidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside className={`w-60 shrink-0 ${className}`}>
      {/* Catégories */}
      <div className="mb-4">
        <h3 className="bg-sv-primary text-white text-sm font-bold px-4 py-2.5 rounded-t-xl">
          CATÉGORIES
        </h3>
        <div className="bg-white border border-t-0 border-border rounded-b-xl">
          {categories.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center">
                <Link
                  href={cat.href}
                  className={`flex-1 px-4 py-2 text-sm hover:bg-sv-primary-light hover:text-sv-primary transition-colors ${activeCategoryId === cat.id ? 'bg-sv-primary-light text-sv-primary font-semibold' : 'text-ink'}`}
                >
                  {cat.nom}
                </Link>
                {cat.children && cat.children.length > 0 && (
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="px-3 py-2 text-ink-secondary hover:text-sv-primary cursor-pointer"
                  >
                    <svg className={`w-3 h-3 transition-transform ${expandedIds.has(cat.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
              {cat.children && expandedIds.has(cat.id) && (
                <div className="pl-4 border-l-2 border-sv-primary-light ml-4">
                  {cat.children.map((sub) => (
                    <Link
                      key={sub.id}
                      href={sub.href}
                      className={`block px-3 py-1.5 text-xs hover:text-sv-primary transition-colors ${activeCategoryId === sub.id ? 'text-sv-primary font-semibold' : 'text-ink-secondary'}`}
                    >
                      {sub.nom}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Marques */}
      {brands.length > 0 && (
        <div>
          <h3 className="bg-sv-primary text-white text-sm font-bold px-4 py-2.5 rounded-t-xl">
            NOS MARQUES
          </h3>
          <div className="bg-white border border-t-0 border-border rounded-b-xl">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/pro/catalogue?marque=${brand.slug}`}
                className="block px-4 py-2 text-sm text-ink hover:bg-sv-primary-light hover:text-sv-primary transition-colors"
              >
                {brand.nom}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
