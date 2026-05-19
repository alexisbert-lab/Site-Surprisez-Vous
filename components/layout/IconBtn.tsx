'use client';
import { ReactNode } from 'react';

interface IconBtnProps {
  icon: ReactNode;
  label: string;
  badge?: number;
  onClick?: () => void;
}

export function IconBtn({ icon, label, badge, onClick }: IconBtnProps) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      padding: '6px 10px', borderRadius: 10, border: 'none', background: 'transparent',
      cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
      color: '#1e2a35',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = '#fdeaef';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      <div style={{ position: 'relative' }}>
        {icon}
        {badge !== undefined && badge > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6,
            width: 17, height: 17, borderRadius: '50%',
            background: '#E8185A', color: '#fff', fontSize: 10,
            fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-body)',
          }}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span style={{
        fontSize: 10, fontFamily: 'var(--font-body)', fontWeight: 700,
        letterSpacing: 0.3, whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </button>
  );
}
