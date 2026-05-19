'use client';
import { useState, useRef, MouseEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Reveal } from '@/components/ui/Reveal';
import EditableText from '@/components/editable/EditableText';
import Link from 'next/link';

const UNIVERS = [
  { titleId: 'univers_1_title', titleDefault: 'RÉTROPOP',    descId: 'univers_1_desc', descDefault: "L'univers années folles",   icon: 'sparkle' as const, from: '#f97316', to: '#E8185A' },
  { titleId: 'univers_2_title', titleDefault: 'GAMME ROUGE', descId: 'univers_2_desc', descDefault: 'Passion et élégance',       icon: 'layers'  as const, from: '#dc2626', to: '#7f1d1d' },
  { titleId: 'univers_3_title', titleDefault: 'GÉNÉRIQUE',   descId: 'univers_3_desc', descDefault: 'Pour toutes les occasions', icon: 'award'   as const, from: '#2B3EA0', to: '#1e3a8a' },
  { titleId: 'univers_4_title', titleDefault: 'LÉOPARD',     descId: 'univers_4_desc', descDefault: 'Le style sauvage',          icon: 'zap'     as const, from: '#d97706', to: '#92400e' },
];

function TiltCard({ titleId, titleDefault, descId, descDefault, icon, from, to }: typeof UNIVERS[0]) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);
  const [shine, setShine] = useState({ x: 50, y: 50 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current!.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (py - 0.5) * 18, y: (px - 0.5) * -18 });
    setShine({ x: px * 100, y: py * 100 });
  };

  return (
    <div ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setTilt({ x: 0, y: 0 }); }}
      style={{
        transform: hover ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.03)` : 'perspective(800px) rotateX(0) rotateY(0) scale(1)',
        transition: hover ? 'transform 0.1s' : 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        borderRadius: 16, height: 220, position: 'relative', overflow: 'hidden', cursor: 'pointer',
        background: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: hover ? `0 24px 60px ${from}55` : '0 4px 16px rgba(0,0,0,0.15)',
      }}>
      {hover && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.22) 0%, transparent 60%)` }} />
      )}
      <div style={{ padding: 28, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: hover ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <Icon name={icon} size={28} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#fff', letterSpacing: -0.5, marginBottom: 4 }}>
            <EditableText page="home" id={titleId}>{titleDefault}</EditableText>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            <EditableText page="home" id={descId}>{descDefault}</EditableText>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SectionUnivers() {
  return (
    <section style={{ background: '#fff', padding: '80px 32px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Reveal>
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, color: '#E8185A', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>
              <EditableText page="home" id="univers_eyebrow">Nos univers</EditableText>
            </div>
            <h2 style={{ fontSize: 36, fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#1e2a35', margin: 0 }}>
              <EditableText page="home" id="univers_title">Explorez nos gammes exclusives</EditableText>
            </h2>
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {UNIVERS.map((u, i) => (
            <Reveal key={u.titleId} dir="scale" delay={i * 0.1}>
              <Link href="/univers" style={{ textDecoration: 'none', display: 'block' }}>
                <TiltCard {...u} />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
