'use client';
import { useEffect, useRef, useCallback } from 'react';

export function useScrollProgress(
  ref: React.RefObject<HTMLElement | null>,
  cb: (progress: number) => void
) {
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1,
        (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
      ));
      cbRef.current(p);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, [ref]);
}

export function useIntersect(
  ref: React.RefObject<HTMLElement | null>,
  cb: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
) {
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => cbRef.current(entry),
      { threshold: 0.1, ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
}
