'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BalloonSVG } from '@/components/ui/BalloonSVG';
import EditableText from '@/components/editable/EditableText';

const BALLOONS = [
  { color: '#E8185A', size: 72, left: '5%',  delay: '0s',   anim: 'balloonRise 14s ease-in infinite' },
  { color: '#F5A623', size: 56, left: '15%', delay: '2s',   anim: 'balloonRiseWobble 17s ease-in infinite' },
  { color: '#3DBDB0', size: 80, left: '78%', delay: '1s',   anim: 'balloonRise 12s ease-in infinite' },
  { color: '#6B4FA0', size: 60, left: '88%', delay: '3.5s', anim: 'balloonRiseWobble 15s ease-in infinite' },
  { color: '#2B3EA0', size: 50, left: '92%', delay: '5s',   anim: 'balloonRise 18s ease-in infinite' },
  { color: '#E97132', size: 65, left: '2%',  delay: '6s',   anim: 'balloonRiseWobble 16s ease-in infinite' },
];

function AnimatedCount({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const dur = 1400;
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const tick = (now: number) => {
        const p = Math.min((now - start) / dur, 1);
        setVal(Math.round(easeOut(p) * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{val.toLocaleString('fr-FR')}{suffix}</span>;
}

export function HeroGrandGala({ onSwitch }: { onSwitch?: (i: number) => void }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#0d0a1a', position: 'relative',
      overflow: 'hidden', display: 'flex', alignItems: 'center',
    }}>
      {/* Orbs */}
      <div style={{ position: 'absolute', top: '20%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,24,90,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,79,160,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Ballons */}
      {BALLOONS.map((b, i) => (
        <div key={i} style={{ position: 'absolute', bottom: -80, left: b.left, animation: b.anim, animationDelay: b.delay, pointerEvents: 'none' }}>
          <BalloonSVG color={b.color} size={b.size} />
        </div>
      ))}

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 1, width: '100%' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)', borderRadius: 999, padding: '6px 16px', marginBottom: 32,
          animation: 'heroFadeIn 0.8s ease both',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3DBDB0', boxShadow: '0 0 8px #3DBDB0', animation: 'dotPulse 1.5s ease-in-out infinite' }} />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
            Grossiste articles de fête
          </span>
        </div>

        {/* H1 */}
        <h1 style={{
          fontSize: 'clamp(52px, 8vw, 108px)', fontFamily: 'var(--font-heading)', fontWeight: 900,
          color: '#fff', lineHeight: 1.05, marginBottom: 24, maxWidth: 800,
          animation: 'heroFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both',
        }}>
          <EditableText page="home" id="hero_line1">La fête,</EditableText>{' '}
          <span style={{ WebkitTextStroke: '2px #E8185A', color: 'transparent' }}>
            <EditableText page="home" id="hero_line2">c&apos;est</EditableText>
          </span>{' '}
          <span style={{ background: 'linear-gradient(135deg, #E8185A, #F5A623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            <EditableText page="home" id="hero_line3">notre</EditableText>
          </span>{' '}
          <EditableText page="home" id="hero_line4">métier</EditableText>
        </h1>

        {/* Sous-titre */}
        <p style={{
          color: 'rgba(255,255,255,0.65)', fontSize: 18, fontFamily: 'var(--font-body)',
          maxWidth: 560, marginBottom: 40, lineHeight: 1.6,
          animation: 'heroFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s both',
        }}>
          <EditableText page="home" id="hero_subtitle" multiline>
            Plus de 3000 références exclusives pour les professionnels de la fête — ballons, décorations, accessoires.
          </EditableText>
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 64, animation: 'heroFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.45s both' }}>
          <Link href="/espace-pro" style={{
            padding: '14px 28px', borderRadius: 12, background: '#E8185A',
            color: '#fff', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
            textDecoration: 'none', boxShadow: '0 8px 24px rgba(232,24,90,0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}>
            Espace Professionnel
          </Link>
          <Link href="/fiche-technique" style={{
            padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #3DBDB0, #2a9a8e)',
            color: '#fff', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
            textDecoration: 'none', boxShadow: '0 8px 24px rgba(61,189,176,0.35)',
            transition: 'transform 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}>
            Fiche technique
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', animation: 'heroFadeIn 1s ease 0.6s both' }}>
          {[
            { val: 3000, suffix: '+', label: 'Références' },
            { val: 5,    suffix: '',  label: 'Univers exclusifs' },
            { val: 7000, suffix: 'm²', label: 'De showrooms' },
          ].map(({ val, suffix, label }) => (
            <div key={label}>
              <div style={{ fontSize: 28, fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#E8185A' }}>
                <AnimatedCount target={val} suffix={suffix} />
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
