'use client';
import { BalloonSVG } from '@/components/ui/BalloonSVG';
import Link from 'next/link';

const LINES = ['LA', 'FÊTE', "C'EST", 'NOTRE', 'MÉTIER'];

export function HeroRetroPoster() {
  return (
    <div style={{ minHeight: '100vh', background: '#E8185A', position: 'relative', overflow: 'hidden', display: 'flex' }}>
      {/* Halftone dots */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.15,
        backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
        backgroundSize: '18px 18px',
      }} />

      {/* Bloc noir diagonal */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#0d0a1a',
        clipPath: 'polygon(22% 0, 100% 0, 100% 100%, 5% 100%)',
      }}>
        {/* Ballons dans la zone noire */}
        {[
          { color: '#E8185A', size: 64, left: '15%', top: '20%', anim: 'floatA 5s ease-in-out infinite' },
          { color: '#F5A623', size: 48, left: '55%', top: '55%', anim: 'floatB 6s ease-in-out 1s infinite' },
          { color: '#3DBDB0', size: 56, left: '75%', top: '30%', anim: 'floatA 4s ease-in-out 0.5s infinite' },
        ].map((b, i) => (
          <div key={i} style={{ position: 'absolute', left: b.left, top: b.top, animation: b.anim }}>
            <BalloonSVG color={b.color} size={b.size} />
          </div>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1, width: '100%' }}>
        <div style={{ maxWidth: 480 }}>
          {LINES.map((line, i) => (
            <div key={i} style={{ overflow: 'hidden' }}>
              <h1 style={{
                fontSize: 'clamp(52px, 7vw, 96px)', fontFamily: 'var(--font-heading)', fontWeight: 900,
                color: '#fff', letterSpacing: -2, lineHeight: 0.95, textTransform: 'uppercase',
                animation: `heroSlideLeft 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s both`,
              }}>
                {line}
              </h1>
            </div>
          ))}

          {/* Ligne décorative */}
          <div style={{
            width: 80, height: 4, background: '#fff', marginTop: 24, marginBottom: 24,
            transformOrigin: 'left',
            animation: 'scaleIn 0.6s cubic-bezier(0.16,1,0.3,1) 0.55s both',
          }} />

          {/* Badge */}
          <div style={{
            display: 'inline-block', background: '#fff', borderRadius: 8, padding: '6px 14px', marginBottom: 32,
            animation: 'heroFadeIn 0.6s ease 0.7s both',
          }}>
            <span style={{ color: '#E8185A', fontSize: 11, fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
              Grossiste pro · depuis 2005
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, animation: 'heroFadeUp 0.6s ease 0.8s both' }}>
            <Link href="/espace-pro" style={{ padding: '13px 26px', borderRadius: 12, background: '#fff', color: '#E8185A', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'transform 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = ''}>
              Espace Pro
            </Link>
            <Link href="/catalogue" style={{ padding: '13px 26px', borderRadius: 12, background: 'rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.4)' }}>
              Catalogue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
