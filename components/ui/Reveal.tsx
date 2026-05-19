'use client';
import { useRef, useEffect, useState, ReactNode, CSSProperties } from 'react';

type Dir = 'bottom' | 'left' | 'right' | 'scale';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  dir?: Dir;
  className?: string;
  style?: CSSProperties;
}

const ANIM: Record<Dir, string> = {
  bottom: 'revealFromBottom',
  left:   'revealFromLeft',
  right:  'revealFromRight',
  scale:  'revealScale',
};

export function Reveal({ children, delay = 0, dir = 'bottom', className, style }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{
      animationName: visible ? ANIM[dir] : 'none',
      animationDuration: '0.72s',
      animationDelay: visible ? `${delay}s` : '0s',
      animationTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
      animationFillMode: 'both',
      opacity: visible ? undefined : 0,
      willChange: 'transform, opacity',
      ...style,
    }}>
      {children}
    </div>
  );
}
