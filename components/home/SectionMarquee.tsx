'use client';
import EditableText from '@/components/editable/EditableText';

const MARQUES = [
  { id: 'marquee_brand1', defaultLabel: 'MDR',               color: '#E8185A', bg: '#fdeaef' },
  { id: 'marquee_brand2', defaultLabel: 'Fête à DÉCO',      color: '#3DBDB0', bg: '#e8f8f7' },
  { id: 'marquee_brand3', defaultLabel: 'Oui pour la vie',  color: '#6B4FA0', bg: '#f0edf8' },
  { id: 'marquee_brand4', defaultLabel: 'Zéro de Conduite', color: '#2B3EA0', bg: '#eef0fb' },
  { id: 'marquee_brand5', defaultLabel: 'OptimiZline',      color: '#E97132', bg: '#fde8dd' },
];

const TRIPLED = [...MARQUES, ...MARQUES, ...MARQUES];

export function SectionMarquee() {
  return (
    <section style={{ background: '#fafbfc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '24px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: 3 }}>
          <EditableText page="home" id="marquee_title">Nos marques</EditableText>
        </span>
      </div>
      <div style={{ overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', background: 'linear-gradient(to right, #fafbfc 100px, transparent 100px, transparent calc(100% - 100px), #fafbfc calc(100% - 100px))' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, animation: 'marqueeScroll 28s linear infinite', width: 'max-content' }}>
          {TRIPLED.map((m, i) => (
            <div key={i} style={{ padding: '14px 32px', borderRadius: 12, background: m.bg, fontSize: 14, fontFamily: 'var(--font-heading)', fontWeight: 800, color: m.color, whiteSpace: 'nowrap', transition: 'transform 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = ''}>
              <EditableText page="home" id={m.id}>{m.defaultLabel}</EditableText>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
