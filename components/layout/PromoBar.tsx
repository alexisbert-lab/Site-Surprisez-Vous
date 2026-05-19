'use client';
import { Icon } from '@/components/ui/Icon';
import EditableText from '@/components/editable/EditableText';

const MESSAGES = [
  { icon: 'truck'   as const, text: 'Livraison rapide sur toute la France' },
  { icon: 'sparkle' as const, text: 'Plus de 3000 références en stock' },
  { icon: 'bolt'    as const, text: 'Commande avant 14h — expédition le jour même' },
  { icon: 'tag'     as const, text: 'Tarifs grossiste réservés aux professionnels' },
  { icon: 'box'     as const, text: 'Conditionnement par lot ou à l\'unité' },
  { icon: 'store'   as const, text: 'Showrooms ouverts à Boos (76) et Paris' },
];

const TRIPLED = [...MESSAGES, ...MESSAGES, ...MESSAGES];

export function PromoBar() {
  return (
    <div style={{ height: 36, background: '#0d0a1a', overflow: 'hidden', position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(to right, #0d0a1a 80px, transparent 80px, transparent calc(100% - 80px), #0d0a1a calc(100% - 80px))',
      }} />
      <div style={{
        display: 'flex', alignItems: 'center', height: '100%',
        animation: 'marqueeScroll 38s linear infinite',
        width: 'max-content',
      }}>
        {TRIPLED.map((m, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '0 32px',
            color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: 'var(--font-body)',
            fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            <Icon name={m.icon} size={13} color="#3DBDB0" />
            <EditableText page="header" id={`promobar_${i % MESSAGES.length}`}>{m.text}</EditableText>
          </div>
        ))}
      </div>
    </div>
  );
}
