'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useIframeEdit } from '@/lib/iframe-edit-context';

interface Props {
  page: string;
  id: string;
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  external?: boolean;
  [key: string]: unknown;
}

const LinkIcon = () => (
  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

export default function EditableLink({ page, id, href, children, className, style, external, ...rest }: Props) {
  const { isIframeMode, getContent, notifySelected } = useIframeEdit();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const currentHref = (mounted ? getContent(page, id) : undefined) ?? href;

  if (isIframeMode && mounted) {
    return (
      <span
        className={`relative group/elink ${className ?? ''}`}
        style={style}
        data-sv-value={currentHref}
      >
        {children}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const wrapper = e.currentTarget.parentElement as HTMLElement;
            notifySelected(page, id, 'link', wrapper);
          }}
          className="absolute -top-2 -left-1 z-30 w-4 h-4 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity shadow cursor-pointer"
          title="Modifier le lien"
        >
          <LinkIcon />
        </button>
      </span>
    );
  }

  if (external) {
    return (
      <a href={currentHref} className={className} style={style} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link href={currentHref} className={className} style={style} {...rest}>
      {children}
    </Link>
  );
}
