'use client';
import { BalloonSVG } from '@/components/ui/BalloonSVG';
import Link from 'next/link';

const BALLOON_CLUSTER = [
  { color: '#E8185A', size: 80, x: 60,  y: 30,  anim: 'floatA 4s ease-in-out infinite' },
  { color: '#F5A623', size: 64, x: 160, y: 60,  anim: 'floatB 5s ease-in-out infinite' },
  { color: '#3DBDB0', size: 72, x: 30,  y: 140, anim: 'floatA 6s ease-in-out 0.5s infinite' },
  { color: '#6B4FA0', size: 56, x: 200, y: 180, anim: 'floatB 4.5s ease-in-out 1s infinite' },
  { color: '#2B3EA0', size: 88, x: 120, y: 240, anim: 'floatA 5.5s ease-in-out 0.3s infinite' },
  { color: '#E97132', size: 60, x: 260, y: 80,  anim: 'floatB 6.5s ease-in-out 0.8s infinite' },
];

export function HeroChromaticBlast() {
  return (
    <div style={{
      minHeight: '100vh', background: '#fff', position: 'relative',
      overflow: 'hidden', display: 'flex', alignItems: 'center',
    }}>
      {/* Mesh gradient orbs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,24,90,0.09) 0%, transparent 65%)', animation: 'meshFloat1 10s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '20%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,79,160,0.07) 0%, transparent 65%)', animation: 'meshFloat2 12s ease-in-out infinite', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 32px', display: 'flex', alignItems: 'center', gap: 60, width: '100%' }}>
        {/* Texte */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ overflow: 'hidden', marginBottom: 8 }}>
            <h1 style={{ fontSize: 'clamp(64px, 9vw, 120px)', fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#1e2a35', lineHeight: 0.9, animation: 'heroSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) both' }}>
              LA FÊTE
            </h1>
          </div>
          <div style={{ overflow: 'hidden', marginBottom: 32 }}>
            <h1 style={{
              fontSize: 'clamp(64px, 9vw, 120px)', fontFamily: 'var(--font-heading)', fontWeight: 900,
              lineHeight: 0.9, animation: 'heroSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.12s both',
              background: 'linear-gradient(90deg, #E8185A, #6B4FA0, #3DBDB0)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              NOTRE MÉTIER
            </h1>
          </div>
          <p style={{ fontSize: 16, color: '#6b7280', fontFamily: 'var(--font-body)', maxWidth: 440, lineHeight: 1.7, marginBottom: 36, animation: 'heroFadeUp 0.8s ease 0.3s both' }}>
            Grossiste spécialisé en articles de fête depuis 2005 — plus de 3000 références pour les professionnels.
          </p>
          <div style={{ display: 'flex', gap: 12, animation: 'heroFadeUp 0.8s ease 0.45s both' }}>
            <Link href="/espace-pro" style={{ padding: '13px 26px', borderRadius: 12, background: '#E8185A', color: '#fff', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 8px 24px rgba(232,24,90,0.35)', transition: 'transform 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = ''}>
              Espace Pro
            </Link>
            <Link href="/catalogue" style={{ padding: '13px 26px', borderRadius: 12, background: '#f4f4f6', color: '#1e2a35', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#e2e8f0'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#f4f4f6'}>
              Voir le catalogue
            </Link>
          </div>
        </div>

        {/* Balloon cluster */}
        <div style={{ position: 'relative', width: 340, height: 440, flexShrink: 0 }} className="hidden lg:block">
          {BALLOON_CLUSTER.map((b, i) => (
            <div key={i} style={{ position: 'absolute', left: b.x, top: b.y, animation: b.anim }}>
              <BalloonSVG color={b.color} size={b.size} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
