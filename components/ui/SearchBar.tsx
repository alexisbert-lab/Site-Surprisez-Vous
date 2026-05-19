'use client';
import { useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export default function SearchBar({ placeholder = 'Rechercher un produit, une référence...', onSearch, className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (onSearch) onSearch(q);
    else if (q) router.push(`/catalogue?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={handleSubmit} className={className} style={{
      display: 'flex', alignItems: 'center',
      background: focused ? '#fff' : '#f4f4f6',
      border: `2px solid ${focused ? '#E8185A' : 'transparent'}`,
      borderRadius: 13, overflow: 'hidden', maxWidth: 520, width: '100%',
      boxShadow: focused ? '0 4px 20px rgba(232,24,90,0.15)' : 'none',
      transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', color: '#9e9e9e' }}>
        <Icon name="search" size={16} />
      </div>
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); onSearch?.(e.target.value.trim()); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontSize: 13, fontFamily: 'var(--font-body)', color: '#1e2a35', padding: '10px 0',
        }}
      />
      {query && (
        <button type="button" onClick={() => { setQuery(''); onSearch?.(''); }}
          style={{ border: 'none', background: 'transparent', padding: '0 8px', cursor: 'pointer', color: '#9e9e9e' }}>
          <Icon name="close" size={14} />
        </button>
      )}
      <button type="submit" style={{
        margin: 4, padding: '7px 16px', borderRadius: 11,
        background: '#E8185A', color: '#fff', border: 'none', cursor: 'pointer',
        fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700,
        transition: 'background 0.2s',
        whiteSpace: 'nowrap',
      }}
        onMouseEnter={e => (e.currentTarget.style.background = '#C4124A')}
        onMouseLeave={e => (e.currentTarget.style.background = '#E8185A')}
      >
        Chercher
      </button>
    </form>
  );
}
