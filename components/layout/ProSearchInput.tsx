'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { filterArticlesVisibles, type Product } from '@/lib/firestore/products';
import { api } from '@/lib/api';

export default function ProSearchInput({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getProducts().then((data) => {
      setProducts(filterArticlesVisibles(data));
    }).catch(() => {});
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    const q = value.trim().toUpperCase();
    if (q.length < 1) { setSuggestions([]); setShowDropdown(false); return; }
    const matches = products
      .filter((p) => p.pdt_reference?.toUpperCase().includes(q) || p.pdt_designation?.toUpperCase().includes(q))
      .slice(0, 8);
    setSuggestions(matches);
    setShowDropdown(matches.length > 0);
  };

  const selectSuggestion = (p: Product) => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    router.push(`/pro/catalogue?q=${encodeURIComponent(p.pdt_reference)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowDropdown(false);
    router.push(`/pro/catalogue?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-secondary" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Rechercher par référence, désignation, EAN..."
          autoComplete="off"
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-sv-primary focus:ring-2 focus:ring-sv-primary/20"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setSuggestions([]); setShowDropdown(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-secondary hover:text-ink cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
        {showDropdown && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((p) => (
              <button key={p.pdt_reference} type="button"
                onMouseDown={() => selectSuggestion(p)}
                className="w-full text-left px-3 py-2.5 hover:bg-sv-primary-light/60 transition-colors flex items-center gap-3 border-b border-border/50 last:border-0 cursor-pointer">
                <span className="font-mono text-xs font-bold text-sv-primary w-24 shrink-0">{p.pdt_reference}</span>
                <span className="text-sm text-ink truncate">{p.pdt_designation}</span>
                {p.prix_vente ? <span className="ml-auto text-xs font-semibold text-ink-secondary shrink-0">{p.prix_vente.toFixed(2)} €</span> : null}
              </button>
            ))}
          </div>
        )}
      </div>
      <button type="submit" aria-label="Rechercher"
        className="hidden sm:inline-flex p-2 text-ink-secondary hover:text-sv-primary transition-colors cursor-pointer focus:outline-none">
        <Search className="w-5 h-5" />
      </button>
    </form>
  );
}
