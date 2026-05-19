'use client';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Reveal } from '@/components/ui/Reveal';
import EditableText from '@/components/editable/EditableText';
import Link from 'next/link';

const CARDS = [
  { icon: 'book' as const, iconBg: '#fdeaef', iconColor: '#E8185A', hoverBg: '#E8185A', href: '/catalogues',
    titleId: 'infoblocs_1_title', titleDefault: 'Catalogues',
    descId: 'infoblocs_1_desc', descDefault: 'Feuilletez nos catalogues produits et découvrez toutes nos références par univers.',
    linkId: 'infoblocs_1_link', linkDefault: 'Voir les catalogues' },
  { icon: 'building' as const, iconBg: '#e8f8f7', iconColor: '#3DBDB0', hoverBg: '#3DBDB0', href: '/showroom',
    titleId: 'infoblocs_2_title', titleDefault: 'Showrooms',
    descId: 'infoblocs_2_desc', descDefault: "Visitez nos espaces d'exposition à Boos (76) et Paris pour toucher les produits.",
    linkId: 'infoblocs_2_link', linkDefault: 'Trouver un showroom' },
  { icon: 'handshake' as const, iconBg: '#eef0fb', iconColor: '#2B3EA0', hoverBg: '#2B3EA0', href: '/revendeur',
    titleId: 'infoblocs_3_title', titleDefault: 'Premier contact',
    descId: 'infoblocs_3_desc', descDefault: 'Vous souhaitez devenir revendeur ? Contactez-nous et démarrons ensemble.',
    linkId: 'infoblocs_3_link', linkDefault: 'Prendre contact' },
];

function InfoCard({ icon, iconBg, iconColor, hoverBg, href, titleId, titleDefault, descId, descDefault, linkId, linkDefault }: typeof CARDS[0]) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #e2e8f0',
      transform: hov ? 'translateY(-8px)' : 'none',
      boxShadow: hov ? '0 20px 56px rgba(232,24,90,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <div style={{ height: 156, background: '#f9f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: hov ? hoverBg : iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: hov ? 'rotate(4deg) scale(1.12)' : 'none',
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <Icon name={icon} size={32} color={hov ? '#fff' : iconColor} strokeWidth={1.5} />
        </div>
      </div>
      <div style={{ padding: 24 }}>
        <h3 style={{ fontSize: 18, fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#1e2a35', marginBottom: 10 }}>
          <EditableText page="home" id={titleId}>{titleDefault}</EditableText>
        </h3>
        <p style={{ fontSize: 13, color: '#6b7280', fontFamily: 'var(--font-body)', lineHeight: 1.6, marginBottom: 16 }}>
          <EditableText page="home" id={descId} multiline>{descDefault}</EditableText>
        </p>
        <Link href={href} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 700, color: iconColor, textDecoration: 'none',
          opacity: hov ? 1 : 0, transform: hov ? 'translateX(0)' : 'translateX(-10px)',
          transition: 'all 0.3s ease',
        }}>
          <EditableText page="home" id={linkId}>{linkDefault}</EditableText>
          <Icon name="arrowRight" size={13} color={iconColor} />
        </Link>
      </div>
    </div>
  );
}

export function SectionInfoBlocs() {
  return (
    <section style={{ background: '#fafbfc', padding: '80px 32px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, color: '#E8185A', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>
              <EditableText page="home" id="infoblocs_eyebrow">Nos services</EditableText>
            </div>
            <h2 style={{ fontSize: 36, fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#1e2a35', margin: 0 }}>
              <EditableText page="home" id="infoblocs_title">Tout pour faciliter votre travail</EditableText>
            </h2>
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {CARDS.map((c, i) => (
            <Reveal key={c.titleId} delay={i * 0.1}>
              <InfoCard {...c} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
