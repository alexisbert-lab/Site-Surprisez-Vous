'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { state } from './showroomState';
import EditableText from '@/components/editable/EditableText';

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

function DrawLine({ active, color = '#E8185A', delay = 0.3 }: { active: boolean; color?: string; delay?: number }) {
  return (
    <svg viewBox="0 0 600 2" style={{ width: '100%', maxWidth: 600, height: 2, display: 'block', margin: '0 auto', overflow: 'visible' }}>
      <line x1="0" y1="1" x2="600" y2="1" stroke={color} strokeWidth="1.5"
        style={{ strokeDasharray: 600, strokeDashoffset: active ? 0 : 600, transition: `stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1) ${delay}s` }} />
    </svg>
  );
}

function StatsCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const W = canvas.clientWidth || window.innerWidth;
    const H = canvas.clientHeight || window.innerHeight;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(W, H);
    renderer.setClearColor(0, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.z = 9;
    const COUNT = 300;
    const palette = [0xE8185A, 0x3DBDB0, 0x6B4FA0, 0xF5A623, 0xE97132, 0x2B3EA0];
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const vel: { x: number; y: number }[] = [];
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 13;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      const c = new THREE.Color(palette[i % palette.length]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      vel.push({ x: (Math.random() - 0.5) * 0.003, y: (Math.random() - 0.5) * 0.002 });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: 0.075, vertexColors: true, transparent: true, opacity: 0.85 });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array;
      const mx = state.mouse.nx * 11, my = state.mouse.ny * 6.5;
      for (let i = 0; i < COUNT; i++) {
        p[i * 3] += vel[i].x; p[i * 3 + 1] += vel[i].y;
        const dx = p[i * 3] - mx, dy = p[i * 3 + 1] - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 3 && d > 0) { const f = (3 - d) / 3 * 0.02; p[i * 3] += dx / d * f; p[i * 3 + 1] += dy / d * f; }
        if (p[i * 3] > 11) p[i * 3] = -11; if (p[i * 3] < -11) p[i * 3] = 11;
        if (p[i * 3 + 1] > 6.5) p[i * 3 + 1] = -6.5; if (p[i * 3 + 1] < -6.5) p[i * 3 + 1] = 6.5;
      }
      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    tick();
    const onResize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); renderer.dispose(); geo.dispose(); mat.dispose(); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />;
}

const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

export default function ShowroomStats({ active }: { active: boolean }) {
  return (
    <div id="slide-1" style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 50 }}>
      <StatsCanvas />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(18,14,40,0.82)', zIndex: 2 }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: NOISE_BG, backgroundSize: '200px', zIndex: 3, pointerEvents: 'none', mixBlendMode: 'overlay' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#E8185A18,#6B4FA018,#3DBDB018,#F5A62318)', backgroundSize: '400% 400%', animation: 'svGradShift 10s ease infinite', zIndex: 3, pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 56, opacity: active ? 1 : 0, transition: 'opacity 0.6s ease 0.1s' }}>
          L'espace en chiffres
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0 2px', width: '100%', maxWidth: 900 }}>
          {([
            { n: 400,  s: ' m²',    l: 'Surface totale',      delay: 0,   c: '#F5A623', dur: 2000 },
            { n: 2,    s: ' espaces', l: 'de 200 m² chacun',  delay: 0.3, c: '#E8185A', dur: 1500 },
            { n: 2000, s: '+',       l: 'Références exposées', delay: 0.6, c: '#3DBDB0', dur: 2500 },
          ] as const).map((st, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '0 20px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none', opacity: active ? 1 : 0, transform: active ? 'none' : 'translateY(30px)', transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${st.delay}s` }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(34px,6.5vw,78px)', color: st.c, lineHeight: 1, letterSpacing: '-0.03em' }}>
                <Counter target={st.n} suffix={st.s} active={active} duration={st.dur} />
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(12px,1.4vw,16px)', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 12, whiteSpace: 'nowrap' }}>
                <EditableText page="showroom" id={`stat_label_${i}`}>{st.l}</EditableText>
              </div>
            </div>
          ))}
        </div>

        <div style={{ width: '100%', maxWidth: 900, margin: '56px auto 0' }}>
          <DrawLine active={active} color="#E8185A" delay={0.8} />
        </div>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(13px,1.5vw,17px)', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', marginTop: 40, textTransform: 'uppercase', opacity: active ? 1 : 0, transition: 'opacity 0.8s ease 1.2s' }}>
          Réservé aux professionnels · Sur rendez-vous recommandé
        </p>
      </div>
    </div>
  );
}
