'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Icon } from '@/components/ui/Icon';
import EditableText from '@/components/editable/EditableText';

const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

function CTACanvas() {
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
    camera.position.z = 8;
    const palette = [0xE8185A, 0x3DBDB0, 0x6B4FA0, 0xF5A623, 0xE97132, 0xffffff];
    const geoPool = [new THREE.BoxGeometry(0.14, 0.14, 0.14), new THREE.SphereGeometry(0.08, 6, 6), new THREE.TetrahedronGeometry(0.1)];
    const pieces = Array.from({ length: 150 }, (_, i) => {
      const m = new THREE.Mesh(geoPool[i % 3], new THREE.MeshBasicMaterial({ color: palette[i % palette.length], transparent: true, opacity: 0.55 + Math.random() * 0.35 }));
      m.position.set((Math.random() - 0.5) * 15, 7 + Math.random() * 5, (Math.random() - 0.5) * 3);
      m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      (m as any).vy = -(0.014 + Math.random() * 0.018);
      (m as any).vx = (Math.random() - 0.5) * 0.006;
      (m as any).rx = (Math.random() - 0.5) * 0.04;
      (m as any).rz = (Math.random() - 0.5) * 0.04;
      scene.add(m); return m;
    });
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      pieces.forEach(p => {
        p.position.y += (p as any).vy; p.position.x += (p as any).vx;
        p.rotation.x += (p as any).rx; p.rotation.z += (p as any).rz;
        if (p.position.y < -8) { p.position.y = 8 + Math.random() * 3; p.position.x = (Math.random() - 0.5) * 15; }
      });
      renderer.render(scene, camera);
    };
    tick();
    const onResize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      geoPool.forEach(g => g.dispose());
      renderer.dispose();
    };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />;
}

export default function ShowroomCTA({ active }: { active: boolean }) {
  const [btnHov, setBtnHov] = useState(false);
  return (
    <div id="slide-5" style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 10 }}>
      <CTACanvas />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#E8185A,#6B4FA0,#3DBDB0,#F5A623,#E97132)', backgroundSize: '400% 400%', animation: 'svGradShift 8s ease infinite', zIndex: 2 }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: NOISE_BG, backgroundSize: '200px', zIndex: 4, pointerEvents: 'none', mixBlendMode: 'overlay' }} />

      <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 40px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 20, opacity: active ? 1 : 0, transition: 'opacity 0.6s ease 0.1s' }}>Prêt à nous rendre visite ?</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(36px,7.5vw,100px)', color: '#fff', lineHeight: 1, letterSpacing: '-0.03em', textShadow: '0 4px 40px rgba(0,0,0,0.3)', marginBottom: 24, opacity: active ? 1 : 0, transform: active ? 'none' : 'translateY(40px)', transition: 'all 0.85s cubic-bezier(0.16,1,0.3,1) 0.2s' }}>
          <EditableText page="showroom" id="cta_line1">VENEZ VIVRE</EditableText>
          <br />
          <EditableText page="showroom" id="cta_line2">{"L'EXPÉRIENCE"}</EditableText>
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(13px,1.5vw,18px)', color: 'rgba(255,255,255,0.7)', marginBottom: 52, opacity: active ? 1 : 0, transition: 'opacity 0.7s ease 0.55s' }}>
          Sur rendez-vous · Professionnels uniquement
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', opacity: active ? 1 : 0, transition: 'opacity 0.7s ease 0.7s' }}>
          <a
            href="/pro/contact"
            onMouseEnter={() => setBtnHov(true)}
            onMouseLeave={() => setBtnHov(false)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '16px 36px', borderRadius: 14, background: btnHov ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.35)', color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(13px,1.4vw,16px)', cursor: 'pointer', backdropFilter: 'blur(16px)', transform: btnHov ? 'scale(1.05)' : 'none', boxShadow: btnHov ? '0 8px 40px rgba(255,255,255,0.2)' : 'none', transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', letterSpacing: 0.8 }}>
            <EditableText page="showroom" id="cta_btn">PRENDRE RENDEZ-VOUS</EditableText>
            <span style={{ transform: btnHov ? 'translateX(4px)' : 'none', display: 'inline-flex', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <Icon name="arrowRight" size={18} color="#fff" />
            </span>
          </a>
          <a href="/catalogue" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(13px,1.4vw,16px)', backdropFilter: 'blur(12px)', letterSpacing: 0.5 }}>
            <Icon name="book" size={16} color="rgba(255,255,255,0.8)" />
            <EditableText page="showroom" id="cta_btn2">Voir le catalogue</EditableText>
          </a>
        </div>
      </div>
    </div>
  );
}
