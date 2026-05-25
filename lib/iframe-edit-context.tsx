'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api } from './api';

// Keys: "${page}|${id}" for text, "${page}|${id}__color" for color, etc.
interface IframeEditContextValue {
  isIframeMode: boolean;
  isContentReady: boolean;
  getContent: (page: string, id: string) => string | undefined;
  getStyle: (page: string, id: string) => React.CSSProperties;
  getBlockStyle: (page: string, id: string) => React.CSSProperties;
  notifySelected: (page: string, id: string, type: string, el: HTMLElement) => void;
  notifyBlockSelected: (page: string, id: string, el: HTMLElement) => void;
}

const IframeEditContext = createContext<IframeEditContextValue>({
  isIframeMode: false,
  isContentReady: false,
  getContent: () => undefined,
  getStyle: () => ({}),
  getBlockStyle: () => ({}),
  notifySelected: () => {},
  notifyBlockSelected: () => {},
});

export function IframeEditProvider({
  children,
  initialPages,
}: {
  children: React.ReactNode;
  initialPages?: Record<string, Record<string, string>>;
}) {
  const pathname = usePathname();
  const [isIframeMode, setIsIframeMode] = useState(false);

  // Seed le store avec le contenu SSR pour éviter l'appel CF client-side
  const [store, setStore] = useState<Record<string, string>>(() => {
    if (!initialPages) return {};
    const seed: Record<string, string> = {};
    Object.entries(initialPages).forEach(([pg, data]) => {
      Object.entries(data).forEach(([k, v]) => { seed[`${pg}|${k}`] = v as string; });
    });
    return seed;
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isContentReady, setIsContentReady] = useState(false);

  // Pages déjà chargées (SSR ou CF) — ne pas re-fetcher
  const loadedRef = useRef(new Set<string>(Object.keys(initialPages ?? {})));

  const pageId = pathname === '/header-preview' ? 'header'
    : pathname === '/footer-preview' ? 'footer'
    : pathname === '/' ? 'home'
    : pathname.replace(/^\//, '').replace(/\//g, '-');

  // Fallback : libère le loader après 3s même si le CF ne répond pas
  useEffect(() => {
    const t = setTimeout(() => setIsContentReady(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const isIframe = new URLSearchParams(window.location.search).get('_editmode') === '1';
    if (isIframe) setIsIframeMode(true);

    // Load content for all visitors (not just iframe mode) so saved content shows on public site
    const pages = ['header', ...(pageId !== 'header' ? [pageId] : [])];
    const toLoad = pages.filter(pg => !loadedRef.current.has(pg));
    if (toLoad.length === 0) {
      setIsContentReady(true);
      if (isIframe) window.parent.postMessage({ type: 'IFRAME_READY', pageId }, '*');
      return;
    }
    toLoad.forEach(pg => loadedRef.current.add(pg));

    Promise.all(toLoad.map(pg => api.getPageContent(pg).then(data => ({ pg, data }))))
      .then(results => {
        setStore(prev => {
          const next = { ...prev };
          results.forEach(({ pg, data }) => {
            Object.entries(data).forEach(([k, v]) => { next[`${pg}|${k}`] = v; });
          });
          return next;
        });
        setIsContentReady(true);
        if (isIframe) window.parent.postMessage({ type: 'IFRAME_READY', pageId }, '*');
      })
      .catch(() => setIsContentReady(true));
  }, [pageId]);

  // Handle messages from admin parent
  useEffect(() => {
    if (!isIframeMode) return;

    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'APPLY_CONTENT') {
        const { key, value } = e.data as { key: string; value: string };
        setStore((prev) => ({ ...prev, [key]: value }));
      }
      if (e.data?.type === 'APPLY_BLOCK_STYLE') {
        const { key, prop, value } = e.data as { key: string; prop: string; value: string };
        setStore((prev) => ({ ...prev, [`${key}__${prop}`]: value }));
      }
      if (e.data?.type === 'CLEAR_SELECTION') {
        setSelectedKey(null);
        document.querySelectorAll('[data-sv-selected]').forEach((el) => {
          el.removeAttribute('data-sv-selected');
          (el as HTMLElement).style.outline = '';
        });
      }
    };

    // Block link navigation inside the iframe
    const onClickCapture = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a[href]');
      if (link) { e.preventDefault(); }
    };

    window.addEventListener('message', onMsg);
    document.addEventListener('click', onClickCapture, true);
    return () => {
      window.removeEventListener('message', onMsg);
      document.removeEventListener('click', onClickCapture, true);
    };
  }, [isIframeMode]);

  const getContent = (page: string, id: string) => store[`${page}|${id}`];

  const getStyle = (page: string, id: string): React.CSSProperties => {
    const style: React.CSSProperties = {};
    const color = store[`${page}|${id}__color`];
    const size = store[`${page}|${id}__size`];
    const weight = store[`${page}|${id}__weight`];
    const font = store[`${page}|${id}__font`];
    if (color) style.color = color;
    if (size) style.fontSize = size;
    if (weight) style.fontWeight = weight as React.CSSProperties['fontWeight'];
    if (font) style.fontFamily = font;
    return style;
  };

  const BLOCK_PROPS: Array<{ prop: string; css: keyof React.CSSProperties }> = [
    { prop: 'bg_color', css: 'backgroundColor' },
    { prop: 'bg_gradient', css: 'background' },
    { prop: 'text_color', css: 'color' },
    { prop: 'border_radius', css: 'borderRadius' },
    { prop: 'padding', css: 'padding' },
    { prop: 'margin', css: 'margin' },
    { prop: 'border', css: 'border' },
    { prop: 'opacity', css: 'opacity' },
    { prop: 'box_shadow', css: 'boxShadow' },
    { prop: 'width', css: 'width' },
    { prop: 'height', css: 'height' },
  ];

  const getBlockStyle = (page: string, id: string): React.CSSProperties => {
    const style: React.CSSProperties = {};
    for (const { prop, css } of BLOCK_PROPS) {
      const v = store[`${page}|${id}__${prop}`];
      if (v) (style as Record<string, string>)[css] = v;
    }
    if (style.background) delete style.backgroundColor;
    return style;
  };

  const notifyBlockSelected = (page: string, id: string, el: HTMLElement) => {
    document.querySelectorAll('[data-sv-selected]').forEach((e) => {
      e.removeAttribute('data-sv-selected');
      (e as HTMLElement).style.outline = '';
    });
    el.setAttribute('data-sv-selected', 'true');
    el.style.outline = '2px solid #f59e0b';

    const computed = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    window.parent.postMessage(
      {
        type: 'BLOCK_SELECTED',
        page,
        id,
        styles: Object.fromEntries(
          BLOCK_PROPS.map(({ prop }) => [prop, store[`${page}|${id}__${prop}`] ?? ''])
        ),
        computed: {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          borderRadius: computed.borderRadius,
          padding: computed.padding,
          margin: computed.margin,
          border: computed.border,
          opacity: computed.opacity,
          boxShadow: computed.boxShadow,
        },
        rect: { top: rect.top + window.scrollY, left: rect.left, width: rect.width, height: rect.height },
      },
      '*',
    );
  };

  const notifySelected = (page: string, id: string, type: string, el: HTMLElement) => {
    // Unhighlight previous
    document.querySelectorAll('[data-sv-selected]').forEach((e) => {
      e.removeAttribute('data-sv-selected');
      (e as HTMLElement).style.outline = '';
    });
    // Highlight current
    el.setAttribute('data-sv-selected', 'true');
    el.style.outline = '2px solid #3b82f6';
    setSelectedKey(`${page}|${id}`);

    const rect = el.getBoundingClientRect();
    window.parent.postMessage(
      {
        type: 'ELEMENT_SELECTED',
        page,
        id,
        elementType: type,
        value: store[`${page}|${id}`] ?? el.dataset.svValue ?? el.textContent ?? '',
        styles: {
          color: store[`${page}|${id}__color`] ?? '',
          size: store[`${page}|${id}__size`] ?? '',
          weight: store[`${page}|${id}__weight`] ?? '',
          font: store[`${page}|${id}__font`] ?? '',
        },
        rect: { top: rect.top + window.scrollY, left: rect.left, width: rect.width, height: rect.height },
      },
      '*',
    );
  };

  return (
    <IframeEditContext.Provider value={{ isIframeMode, isContentReady, getContent, getStyle, getBlockStyle, notifySelected, notifyBlockSelected }}>
      {children}
    </IframeEditContext.Provider>
  );
}

export const useIframeEdit = () => useContext(IframeEditContext);
