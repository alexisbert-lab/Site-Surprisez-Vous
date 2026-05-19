'use client';
import { useEffect, useRef, useState } from 'react';
import EditableText from '@/components/editable/EditableText';

const KPIS = [
  { value: 3000, suffix: '+', labelId: 'kpi_label1', labelDefault: 'Références en stock' },
  { value: 5,    suffix: '',  labelId: 'kpi_label2', labelDefault: 'Univers exclusifs' },
  { value: 7000, suffix: 'm²', labelId: 'kpi_label3', labelDefault: 'De showrooms' },
  { value: 20,   suffix: ' ans', labelId: 'kpi_label4', labelDefault: "D'expertise" },
];

function KPI({ value, suffix, labelId, labelDefault }: typeof KPIS[0]) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const dur = 1400;
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const tick = (now: number) => {
        const p = Math.min((now - start) / dur, 1);
        setCount(Math.round(easeOut(p) * value));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '20px 40px' }}>
      <div style={{ fontSize: 48, fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#E8185A', lineHeight: 1 }}>
        {count.toLocaleString('fr-FR')}{suffix}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, marginTop: 8 }}>
        <EditableText page="home" id={labelId}>{labelDefault}</EditableText>
      </div>
    </div>
  );
}

export function SectionKPIs() {
  return (
    <section style={{ background: '#0d0a1a', padding: '60px 40px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        {KPIS.map((k, i) => (
          <div key={i} style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
            <KPI {...k} />
          </div>
        ))}
      </div>
    </section>
  );
}
