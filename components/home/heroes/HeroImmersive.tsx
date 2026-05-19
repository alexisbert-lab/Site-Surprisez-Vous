'use client';
import Link from 'next/link';
import EditableText from '@/components/editable/EditableText';

export function HeroImmersive({ onSwitch }: { onSwitch?: (i: number) => void }) {
  return (
    <div style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, rgba(26,10,46,0.92), rgba(45,16,84,0.88), rgba(13,34,64,0.88), rgba(13,26,16,0.85))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Stars */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 32px' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 40,
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)', borderRadius: 999, padding: '8px 20px',
          animation: 'heroFadeIn 0.8s ease both',
        }}>
          {['#E8185A', '#F5A623', '#3DBDB0', '#6B4FA0'].map((c, i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, animation: `dotPulse 1.5s ease-in-out ${i * 0.3}s infinite` }} />
          ))}
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
            <EditableText page="home" id="hero_badge">Spécialiste de la fête depuis 2005</EditableText>
          </span>
        </div>

        {/* H1 */}
        <h1 style={{
          fontSize: 'clamp(48px, 8vw, 100px)', fontFamily: 'var(--font-heading)', fontWeight: 900,
          lineHeight: 1.05, marginBottom: 28,
          background: 'linear-gradient(90deg, #E8185A, #F5A623, #3DBDB0, #6B4FA0, #E8185A)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'heroFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s both',
        }}>
          <EditableText page="home" id="hero_title">La fête, c&apos;est notre métier</EditableText>
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, fontFamily: 'var(--font-body)', marginBottom: 40, animation: 'heroFadeUp 0.8s ease 0.3s both', maxWidth: 520, margin: '0 auto 40px' }}>
          <EditableText page="home" id="hero_subtitle" multiline>Plus de 3000 références pour les professionnels de la fête</EditableText>
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', animation: 'heroFadeUp 0.8s ease 0.45s both' }}>
          <Link href="/espace-pro" style={{
            padding: '14px 32px', borderRadius: 12, background: '#E8185A', color: '#fff',
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(232,24,90,0.4)', transition: 'transform 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = ''}>
            <EditableText page="home" id="hero_cta1">Espace Professionnel</EditableText>
          </Link>
          <Link href="/catalogue" style={{
            padding: '14px 32px', borderRadius: 12,
            background: 'rgba(255,255,255,0.1)', color: '#fff',
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
          }}>
            <EditableText page="home" id="hero_cta2">Catalogue</EditableText>
          </Link>
        </div>
      </div>
    </div>
  );
}
