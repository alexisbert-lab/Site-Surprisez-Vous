'use client';
import { useState } from 'react';
import { HeroGrandGala } from './heroes/HeroGrandGala';
import { HeroChromaticBlast } from './heroes/HeroChromaticBlast';
import { HeroRetroPoster } from './heroes/HeroRetroPoster';
import { HeroImmersive } from './heroes/HeroImmersive';

const VARIANTS = [
  { label: 'Grand Gala', Component: HeroGrandGala },
  { label: 'Chromatic Blast', Component: HeroChromaticBlast },
  { label: 'Retro Poster', Component: HeroRetroPoster },
  { label: 'Immersive', Component: HeroImmersive },
];

export function HeroSwitcher() {
  const [variant, setVariant] = useState(0);
  const { Component } = VARIANTS[variant];

  return (
    <div style={{ position: 'relative' }}>
      <Component onSwitch={setVariant} />

      {/* Dots nav */}
      <div style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 8, zIndex: 10,
        background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 999, padding: '8px 14px',
      }}>
        {VARIANTS.map((v, i) => (
          <button key={i} onClick={() => setVariant(i)} style={{
            border: 'none', cursor: 'pointer', padding: 0, background: 'transparent',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{
              height: 8,
              width: i === variant ? 20 : 8,
              borderRadius: i === variant ? 4 : '50%',
              background: i === variant ? '#E8185A' : 'rgba(255,255,255,0.3)',
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
            }} />
            {i === variant && (
              <span style={{
                color: 'rgba(255,255,255,0.8)', fontSize: 11,
                fontFamily: 'var(--font-heading)', fontWeight: 700,
                whiteSpace: 'nowrap',
              }}>
                {v.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
