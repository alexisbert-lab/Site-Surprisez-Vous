'use client';
import { useEffect } from 'react';

export function ScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById('sv-progress');
    const onScroll = () => {
      const s = document.documentElement.scrollTop;
      const t = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = (t > 0 ? (s / t) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return null;
}
