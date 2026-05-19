'use client';
import { Icon } from '@/components/ui/Icon';
import EditableText from '@/components/editable/EditableText';

const MAPS_EMBED  = 'https://www.google.com/maps?q=zac+des+tulipes+nord+4+rue+de+montservon+95500+gonesse&output=embed';
const MAPS_SEARCH = 'https://www.google.com/maps/search/?api=1&query=zac+des+tulipes+nord+4+rue+de+montservon+95500+gonesse';

const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;

function DrawLine({ active, color = '#E8185A', delay = 0.3 }: { active: boolean; color?: string; delay?: number }) {
  return (
    <svg viewBox="0 0 600 2" style={{ width: '100%', maxWidth: 360, height: 2, display: 'block', overflow: 'visible', margin: '16px 0 32px' }}>
      <line x1="0" y1="1" x2="600" y2="1" stroke={color} strokeWidth="1.5"
        style={{ strokeDasharray: 600, strokeDashoffset: active ? 0 : 600, transition: `stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1) ${delay}s` }} />
    </svg>
  );
}

export default function ShowroomAddress({ active }: { active: boolean }) {
  return (
    <div id="slide-4" style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 20, background: '#05030f' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 70% at 50% 40%, rgba(61,189,176,0.06) 0%, transparent 70%)', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: NOISE_BG, backgroundSize: '220px', zIndex: 2, pointerEvents: 'none', mixBlendMode: 'overlay' }} />

      <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
        {/* Left — address info */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(40px,6vw,80px)', gap: 32 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#3DBDB0', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 16, opacity: active ? 1 : 0, transition: 'opacity 0.5s ease 0.1s' }}>Nous trouver</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(32px,5.5vw,68px)', color: '#fff', lineHeight: 1, letterSpacing: '-0.03em', transform: active ? 'none' : 'translateX(-40px)', opacity: active ? 1 : 0, transition: 'all 0.75s cubic-bezier(0.16,1,0.3,1) 0.15s', margin: 0 }}>
              NOUS<br /><span style={{ color: '#E8185A' }}>TROUVER</span>
            </h2>
            <DrawLine active={active} color="#E8185A" delay={0.5} />
          </div>

          {([
            { icon: 'building',  text: 'SHOW ROOM HOMEXPO',         sub: 'Bâtiment 2C',                           delay: 0.4,  c: '#E8185A', pulse: false },
            { icon: 'pin',       text: '4, rue de Montservon',       sub: 'ZAC des Tulipes Nord · 95500 GONESSE',  delay: 0.55, c: '#3DBDB0', pulse: true },
            { icon: 'calendar',  text: 'Lundi – Vendredi · 9h–17h', sub: 'Accueil sur rendez-vous recommandé',    delay: 0.7,  c: '#F5A623', pulse: false },
          ] as const).map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', opacity: active ? 1 : 0, transform: active ? 'none' : 'translateY(20px)', transition: `all 0.65s cubic-bezier(0.16,1,0.3,1) ${item.delay}s` }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: item.pulse ? 'svPinPulse 2.5s ease-in-out infinite' : 'none' }}>
                <Icon name={item.icon} size={17} color={item.c} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(12px,1.3vw,15px)', color: '#fff', marginBottom: 3 }}>
                  <EditableText page="showroom" id={`addr_title_${i}`}>{item.text}</EditableText>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(11px,1.1vw,13px)', color: 'rgba(255,255,255,0.4)' }}>
                  <EditableText page="showroom" id={`addr_sub_${i}`}>{item.sub}</EditableText>
                </div>
              </div>
            </div>
          ))}

          <div style={{ opacity: active ? 1 : 0, transition: 'opacity 0.6s ease 1s' }}>
            <a href={MAPS_SEARCH} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, backdropFilter: 'blur(12px)', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#E8185A33'; (e.currentTarget as HTMLElement).style.borderColor = '#E8185A66'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)'; }}>
              Ouvrir dans Maps <Icon name="arrowRight" size={15} color="#fff" />
            </a>
          </div>
        </div>

        {/* Right — Google Maps glassmorphism */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(30px,4vw,60px)', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 30, borderRadius: 28, border: '1px solid #3DBDB033', animation: 'svRingSpin 12s linear infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 22, borderRadius: 32, border: '1px dashed #E8185A22', animation: 'svRingSpin 20s linear infinite reverse', pointerEvents: 'none' }} />

          <div style={{ width: '100%', maxWidth: 520, height: '70vh', maxHeight: 480, borderRadius: 24, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 0 60px #E8185A22, 0 20px 80px rgba(0,0,0,0.5)', clipPath: active ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)', transition: 'clip-path 0.85s cubic-bezier(0.76,0,0.24,1) 0.3s', animation: active ? 'svMapGlow 4s ease-in-out infinite' : 'none', position: 'relative' }}>
            <iframe title="Showroom Homexpo" src={MAPS_EMBED} width="100%" height="100%" style={{ border: 'none', display: 'block', filter: 'saturate(0.7) brightness(0.85)' }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            <div style={{ position: 'absolute', bottom: 20, right: 20, width: 12, height: 12, borderRadius: '50%', background: '#E8185A', animation: 'svDotPulse 2s ease-out infinite', zIndex: 5 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
