'use client';
import { useEffect, useRef, useState } from 'react';

function Counter({ target, suffix = '', duration = 2000, active }: {
  target: number; suffix?: string; duration?: number; active: boolean;
}) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(e * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return <>{val.toLocaleString('fr-FR')}{suffix}</>;
}

const MARQUES = [
  { nom: 'MDR',              bg: '#E8185A', color: '#fff' },
  { nom: 'Fête à DÉCO',     bg: '#2B3EA0', color: '#fff' },
  { nom: 'Oui pour la vie', bg: '#F5A623', color: '#1A1A2E' },
  { nom: 'Zéro de Conduite',bg: '#3DBDB0', color: '#fff' },
  { nom: 'Fête des Bêtises',bg: '#6B4FA0', color: '#fff' },
];

const STATS = [
  { n: 3000, s: '+',    l: 'Références',          c: '#F5A623', dur: 2000 },
  { n: 7000, s: ' m²',  l: 'Entrepôt & Showroom', c: '#E8185A', dur: 2200 },
  { n: 500,  s: '+',    l: 'Clients pro',          c: '#3DBDB0', dur: 1800 },
  { n: 5,    s: '',     l: 'Marques exclusives',   c: '#6B4FA0', dur: 1200 },
];

const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

export default function ShowroomPresentation({ active }: { active: boolean }) {
  return (
    <div id="slide-3" style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 30, background: '#080614' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 80% at 15% 50%, rgba(232,24,90,0.09) 0%, transparent 60%)', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 85% 50%, rgba(61,189,176,0.07) 0%, transparent 60%)', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: NOISE_BG, backgroundSize: '200px', zIndex: 2, pointerEvents: 'none', mixBlendMode: 'overlay' }} />

      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'clamp(40px,6vw,80px) clamp(40px,8vw,120px)',
        gap: 'clamp(20px,3.5vh,44px)',
        overflowY: 'auto',
      }}>
        {/* Tag */}
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 11, color: '#E8185A',
          letterSpacing: '0.35em', textTransform: 'uppercase', margin: 0,
          opacity: active ? 1 : 0, transition: 'opacity 0.5s ease 0.1s',
        }}>
          Qui sommes-nous
        </p>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,6vw,80px)', alignItems: 'start' }}>

          {/* Left — description + marques */}
          <div>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontWeight: 900,
              fontSize: 'clamp(28px,4.5vw,60px)', color: '#fff',
              lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 clamp(16px,2vh,24px)',
              opacity: active ? 1 : 0, transform: active ? 'none' : 'translateY(30px)',
              transition: 'all 0.75s cubic-bezier(0.16,1,0.3,1) 0.15s',
            }}>
              7000 m² de fête
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 'clamp(13px,1.3vw,16px)',
              color: 'rgba(255,255,255,0.55)', lineHeight: 1.7,
              margin: '0 0 clamp(12px,2vh,20px)',
              opacity: active ? 1 : 0, transition: 'opacity 0.7s ease 0.35s',
            }}>
              Fondée avec la passion de créer des moments inoubliables,{' '}
              <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Surprisez-Vous</strong>{' '}
              est devenue l&apos;un des leaders français de la distribution d&apos;articles de fête
              pour les professionnels. Depuis notre site de Boos (76), nous accompagnons magasins,
              grande distribution et décorateurs événementiels.
            </p>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 'clamp(13px,1.3vw,16px)',
              color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0,
              opacity: active ? 1 : 0, transition: 'opacity 0.7s ease 0.5s',
            }}>
              Avec plus de{' '}
              <strong style={{ color: '#F5A623' }}>3 000 références en stock permanent</strong>,
              nos gammes couvrent l&apos;ensemble des occasions festives et se renouvellent chaque saison
              pour suivre les dernières tendances.
            </p>

            {/* Marque badges */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8,
              marginTop: 'clamp(16px,2.5vh,28px)',
              opacity: active ? 1 : 0, transition: 'opacity 0.7s ease 0.65s',
            }}>
              {MARQUES.map(m => (
                <span key={m.nom} style={{
                  padding: '6px 14px', borderRadius: 8,
                  background: m.bg, color: m.color,
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11, letterSpacing: 0.4,
                }}>
                  {m.nom}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div style={{
              display: 'flex', gap: 12, flexWrap: 'wrap',
              marginTop: 'clamp(20px,3vh,36px)',
              opacity: active ? 1 : 0, transition: 'opacity 0.7s ease 0.85s',
            }}>
              <a href="/catalogue" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 12,
                background: '#E8185A', color: '#fff', textDecoration: 'none',
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, letterSpacing: 0.5,
                boxShadow: '0 6px 24px #E8185A44',
              }}>
                Voir le catalogue
              </a>
              <a href="/pro/contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 12,
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff', textDecoration: 'none',
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13,
                backdropFilter: 'blur(8px)',
              }}>
                Nous contacter
              </a>
            </div>
          </div>

          {/* Right — stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(8px,1.5vw,16px)' }}>
            {STATS.map((st, i) => (
              <div key={st.l} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: 'clamp(16px,2.5vh,28px) clamp(16px,2vw,24px)',
                opacity: active ? 1 : 0, transform: active ? 'none' : 'translateY(20px)',
                transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.12}s`,
              }}>
                <div style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 900,
                  fontSize: 'clamp(28px,4vw,52px)', color: st.c,
                  lineHeight: 1, letterSpacing: '-0.03em',
                }}>
                  <Counter target={st.n} suffix={st.s} active={active} duration={st.dur} />
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 'clamp(10px,1.1vw,13px)',
                  color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                  letterSpacing: '0.12em', marginTop: 8,
                }}>
                  {st.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
