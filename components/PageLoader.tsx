'use client';

import { useEffect, useState } from 'react';
import { useIframeEdit } from '@/lib/iframe-edit-context';

export default function PageLoader({ logoSrc }: { logoSrc?: string }) {
  const { isContentReady } = useIframeEdit();
  const [minElapsed, setMinElapsed] = useState(false);
  const [phase, setPhase] = useState<'visible' | 'fading' | 'done'>('visible');

  // Délai minimum pour éviter un flash trop court (visuellement bizarre)
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Démarre le fade dès que le contenu est prêt ET le délai min écoulé
  useEffect(() => {
    if (!isContentReady || !minElapsed || phase !== 'visible') return;
    setPhase('fading');
    const t = setTimeout(() => setPhase('done'), 350);
    return () => clearTimeout(t);
  }, [isContentReady, minElapsed, phase]);

  if (phase === 'done') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#fff',
        zIndex: 99998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 0.35s ease',
        pointerEvents: 'none',
      }}
    >
      {logoSrc ? (
        <img src={logoSrc} alt="" style={{ height: 56, objectFit: 'contain' }} />
      ) : (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="#f1f5f9" strokeWidth="4" />
          <path
            d="M24 4 a20 20 0 0 1 20 20"
            stroke="url(#sv-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            style={{ animation: 'sv-spin 0.9s linear infinite', transformOrigin: '24px 24px' }}
          />
          <defs>
            <linearGradient id="sv-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#E8185A" />
              <stop offset="50%"  stopColor="#F5A623" />
              <stop offset="100%" stopColor="#3DBDB0" />
            </linearGradient>
          </defs>
        </svg>
      )}
      <style>{`@keyframes sv-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
