'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useIframeEdit } from '@/lib/iframe-edit-context';

interface NavItemProps {
  label: React.ReactNode;
  href: string;
  sub?: React.ReactNode[];
  page?: string;
  hrefId?: string;
}

const LinkIcon = () => (
  <svg width={10} height={10} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

export function NavItem({ label, href, sub, page, hrefId }: NavItemProps) {
  const [open, setOpen] = useState(false);
  const { isIframeMode, getContent, notifySelected } = useIframeEdit();

  const currentHref = (isIframeMode && page && hrefId)
    ? (getContent(page, hrefId) ?? href)
    : href;

  return (
    <div
      style={{ position: 'relative' }}
      data-sv-value={currentHref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link href={currentHref} style={{
        display: 'flex', alignItems: 'center', gap: 4, height: 44,
        fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13,
        color: '#1e2a35', textDecoration: 'none', position: 'relative',
        padding: '0 2px',
      }}
        className="nav-item-link"
      >
        {label}
        <style>{`
          .nav-item-link::after {
            content: '';
            position: absolute;
            bottom: 0; left: 0;
            height: 2px; width: 100%;
            background: #E8185A;
            transform: scaleX(0);
            transform-origin: left;
            transition: transform 0.25s cubic-bezier(0.16,1,0.3,1);
          }
          .nav-item-link:hover::after { transform: scaleX(1); }
        `}</style>
      </Link>

      {/* Bouton édition URL en mode iframe */}
      {isIframeMode && page && hrefId && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const el = (e.currentTarget.parentElement as HTMLElement);
            notifySelected(page, hrefId, 'link', el);
          }}
          style={{
            position: 'absolute', top: 4, right: -8, zIndex: 200,
            width: 16, height: 16, borderRadius: '50%',
            background: '#22c55e', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff',
          }}
          title="Modifier le lien"
        >
          <LinkIcon />
        </button>
      )}

      {sub && open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0,
          background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
          padding: '8px 0', minWidth: 200, zIndex: 100,
        }}>
          {sub.map((s, j) => (
            <div key={j} style={{
              padding: '8px 20px', fontSize: 13, fontFamily: 'var(--font-body)',
              fontWeight: 600, color: '#1e2a35', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fdeaef')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
