'use client';

import { useEffect, useState } from 'react';
import { useIframeEdit } from '@/lib/iframe-edit-context';

interface Props {
  initialLogos: string[];
}

function parseLogos(raw: string | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

export default function BrandCarousel3D({ initialLogos }: Props) {
  const { isIframeMode, getContent } = useIframeEdit();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const iframeLogos = mounted && isIframeMode ? parseLogos(getContent('home', 'marque_logos')) : null;
  const logos = iframeLogos ?? initialLogos;

  const notifyEditor = () => {
    window.parent.postMessage({ type: 'BRAND_LOGOS_SELECTED', currentUrls: logos }, '*');
  };

  const track = logos.length > 0 ? [...logos, ...logos] : [];

  return (
    <div className="relative" style={{ perspective: '700px' }}>
      <div
        className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #fafbfc 20%, transparent)' }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #fafbfc 20%, transparent)' }}
      />

      {isIframeMode && mounted && (
        <div
          onClick={notifyEditor}
          className="absolute inset-0 z-20 border-2 border-dashed border-purple-400 rounded-xl bg-purple-500/5 hover:bg-purple-500/15 cursor-pointer transition-colors flex items-center justify-center"
        >
          <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow pointer-events-none">
            Configurer les logos
          </span>
        </div>
      )}

      <div
        className="overflow-hidden"
        style={{ pointerEvents: isIframeMode && mounted ? 'none' : undefined }}
      >
        {logos.length === 0 && (
          <div className="flex items-center justify-center h-24 text-sm text-ink-secondary">
            {isIframeMode && mounted
              ? 'Cliquez pour ajouter des logos de marques'
              : 'Aucun logo configuré'}
          </div>
        )}

        {logos.length > 0 && (
          <div
            style={{
              transform: 'rotateX(-10deg) scale(1.02)',
              transformStyle: 'preserve-3d',
              transformOrigin: 'center center',
            }}
          >
            <div
              className="flex gap-5 py-5 px-2"
              style={{
                animation: 'brand-scroll 24s linear infinite',
                width: 'max-content',
                willChange: 'transform',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.animationPlayState = 'paused'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.animationPlayState = 'running'; }}
            >
              {track.map((url, i) => (
                <div
                  key={i}
                  className="w-[170px] h-[96px] rounded-2xl bg-white shrink-0 overflow-hidden flex items-center justify-center"
                  style={{
                    boxShadow: '0 4px 20px -4px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(226,232,240,0.8)',
                  }}
                >
                  <img
                    src={url}
                    alt={`Marque ${(i % logos.length) + 1}`}
                    className="w-full h-full object-contain p-3"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
