'use client';
import { useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import EditableText from '@/components/editable/EditableText';

export default function ShowroomExperience({ active }: { active: boolean }) {
  const [spotXY, setSpotXY] = useState({ x: 50, y: 50 });
  const rightRef = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rightRef.current) return;
    const r = rightRef.current.getBoundingClientRect();
    setSpotXY({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div id="slide-2" style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 40 }}>
      {/* Left panel */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', background: '#0d0a1a', display: 'flex', alignItems: 'center', padding: '60px 56px', clipPath: active ? 'inset(0 0 0 0)' : 'inset(0 0 0 100%)', transition: 'clip-path 0.95s cubic-bezier(0.76,0,0.24,1)' }}>
        <div style={{ position: 'absolute', right: 0, top: '10%', bottom: '10%', width: 1, background: 'linear-gradient(to bottom, transparent, #E8185A66, transparent)' }} />
        <div style={{ zIndex: 2 }}>
          {['TOUCHEZ.', 'RESSENTEZ.', 'CHOISISSEZ.'].map((line, i) => (
            <div key={line} style={{ overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(28px,5.5vw,72px)', color: '#fff', lineHeight: 1.05, transform: active ? 'none' : 'translateX(-60px)', opacity: active ? 1 : 0, transition: `all 0.75s cubic-bezier(0.16,1,0.3,1) ${0.15 + i * 0.18}s` }}>
                {line}
              </div>
            </div>
          ))}
          <svg viewBox="0 0 2 60" style={{ width: 2, height: 60, marginTop: 32, display: 'block' }}>
            <line x1="1" y1="0" x2="1" y2="60" stroke="#E8185A" strokeWidth="1.5"
              style={{ strokeDasharray: 60, strokeDashoffset: active ? 0 : 60, transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1) 0.8s' }} />
          </svg>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(11px,1.2vw,14px)', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 20, opacity: active ? 1 : 0, transition: 'opacity 0.6s ease 1.1s' }}>
            400 m² · 2 000 références
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div ref={rightRef} onMouseMove={onMouseMove}
        style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', background: '#E8185A', display: 'flex', alignItems: 'center', padding: '60px 56px', clipPath: active ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)', transition: 'clip-path 0.95s cubic-bezier(0.76,0,0.24,1)' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at ${spotXY.x}% ${spotXY.y}%, rgba(255,255,255,0.14) 0%, transparent 55%)`, pointerEvents: 'none', zIndex: 1 }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(14px,1.6vw,20px)', color: 'rgba(255,255,255,0.9)', lineHeight: 1.7, marginBottom: 40, opacity: active ? 1 : 0, transition: 'opacity 0.7s ease 0.5s' }}>
            <EditableText page="showroom" id="exp_intro">Venez vivre l'expérience showroom dans nos deux espaces de 200 m² dédiés aux professionnels de la fête.</EditableText>
          </p>
          {([
            { icon: 'eye',       text: 'Voir et toucher les produits en vrai' },
            { icon: 'layers',    text: '2 000+ références physiques exposées' },
            { icon: 'handshake', text: "Une équipe d'experts à votre écoute" },
          ] as const).map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20, transform: active ? 'none' : 'scale(0.8)', opacity: active ? 1 : 0, transition: `all 0.55s cubic-bezier(0.34,1.56,0.64,1) ${0.65 + i * 0.12}s` }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={b.icon} size={18} color="#fff" />
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(13px,1.3vw,16px)', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>
                <EditableText page="showroom" id={`exp_bullet_${i}`}>{b.text}</EditableText>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
