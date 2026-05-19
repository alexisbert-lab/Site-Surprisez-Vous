'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditMode } from '@/lib/edit-mode-context';
import { useIframeEdit } from '@/lib/iframe-edit-context';

interface Props {
  page: string;
  id: string;
  children: string;
  multiline?: boolean;
}

export default function EditableText({ page, id, children, multiline = false }: Props) {
  const { isEditMode, getContent: getEditContent, updateContent } = useEditMode();
  const { isIframeMode, getContent: getIframeContent, getStyle, notifySelected } = useIframeEdit();
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (!isEditMode) setEditing(false); }, [isEditMode]);

  // ── IFRAME MODE (visual editor in admin backoffice) ──────────────────
  if (isIframeMode && mounted) {
    const iframeValue = getIframeContent(page, id) ?? children;
    const iframeStyle = getStyle(page, id);

    return (
      <span
        data-editid={`${page}|${id}`}
        data-edittype={multiline ? 'multiline' : 'text'}
        onClick={(e) => {
          e.stopPropagation();
          notifySelected(page, id, multiline ? 'multiline' : 'text', e.currentTarget);
        }}
        style={{
          display: 'inline',
          cursor: 'pointer',
          borderRadius: '2px',
          transition: 'outline 0.1s',
          ...iframeStyle,
        }}
        className="hover:outline hover:outline-2 hover:outline-dashed hover:outline-blue-400/60"
        title="Cliquer pour modifier"
      >
        {iframeValue}
      </span>
    );
  }

  // ── NORMAL MODE (no editing) ─────────────────────────────────────────
  if (!isEditMode || !mounted) {
    const value = mounted ? (getIframeContent(page, id) ?? getEditContent(page, id) ?? children) : children;
    return <>{value}</>;
  }

  // ── ADMIN INLINE EDIT MODE ───────────────────────────────────────────
  const value = getEditContent(page, id) ?? children;

  if (editing) {
    const sharedStyle: React.CSSProperties = {
      fontFamily: 'inherit',
      fontSize: 'inherit',
      fontWeight: 'inherit',
      lineHeight: 'inherit',
      letterSpacing: 'inherit',
      color: 'inherit',
      background: 'rgba(255,255,255,0.92)',
      outline: '2px solid #3b82f6',
      borderRadius: '4px',
      padding: '0 4px',
      border: 'none',
    };

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          defaultValue={value}
          onChange={(e) => updateContent(page, id, e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }}
          autoFocus
          rows={3}
          style={{ ...sharedStyle, width: '100%', resize: 'vertical', display: 'block' }}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        defaultValue={value}
        onChange={(e) => updateContent(page, id, e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditing(false); }}
        autoFocus
        style={{ ...sharedStyle, width: `${Math.max(value.length + 4, 10)}ch` }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Cliquer pour modifier"
      className="outline outline-2 outline-dashed outline-blue-400/70 rounded-sm hover:outline-blue-500 hover:bg-blue-50/30 relative group cursor-text"
      style={{ display: 'inline' }}
    >
      {value}
      <span className="pointer-events-none absolute -top-6 left-0 z-50 bg-blue-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        ✎ Modifier
      </span>
    </span>
  );
}
