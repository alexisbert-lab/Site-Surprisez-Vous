'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import EditableText from '@/components/editable/EditableText';
import { Icon } from '@/components/ui/Icon';

const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=zac+des+tulipes+nord+4+rue+de+montservon+95500+gonesse';

function SplitText({ text, visible, baseDelay = 0, stagger = 65, size, color = '#fff', stroke = false }: {
  text: string; visible: boolean; baseDelay?: number; stagger?: number;
  size: string; color?: string; stroke?: boolean;
}) {
  return (
    <span style={{ display: 'inline-block' }}>
      {text.split('').map((ch, i) => (
        <span key={i} style={{
          display: 'inline-block',
          fontSize: size,
          fontFamily: 'var(--font-heading)',
          fontWeight: 900,
          color: stroke ? 'transparent' : color,
          WebkitTextStroke: stroke ? `2px ${color}` : '0px',
          transform: visible ? 'translateY(0) rotate(0deg)' : 'translateY(-50px) rotate(-8deg)',
          opacity: visible ? 1 : 0,
          transition: `transform 0.65s cubic-bezier(0.16,1,0.3,1) ${baseDelay + i * stagger}ms, opacity 0.45s ease ${baseDelay + i * stagger}ms`,
          whiteSpace: ch === ' ' ? 'pre' : 'normal',
        }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}

function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const W = canvas.clientWidth || window.innerWidth;
    const H = canvas.clientHeight || window.innerHeight;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0a1a);
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.z = 5;

    // Volumetric rays
    const rays = Array.from({ length: 10 }, () => {
      const geo = new THREE.PlaneGeometry(0.3 + Math.random() * 1.4, 22);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true,
        opacity: 0.012 + Math.random() * 0.022, side: THREE.DoubleSide,
      });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.z = (Math.random() - 0.5) * 0.2;
      m.position.set((Math.random() - 0.5) * 20, 0, -1.5 - Math.random() * 2);
      (m as any).v = (0.003 + Math.random() * 0.005) * (Math.random() > 0.5 ? 1 : -1);
      scene.add(m);
      return m;
    });

    // Orbs
    const orbDefs = [
      { hex: '#E8185A', x: -5, y: 1.5, z: -3, phase: 0 },
      { hex: '#3DBDB0', x: 5,  y: -1,  z: -4, phase: 2.1 },
      { hex: '#F5A623', x: 0.5, y: 2.5, z: -5.5, phase: 4.2 },
    ];
    const orbs = orbDefs.map(d => {
      const color = new THREE.Color(d.hex);
      const light = new THREE.PointLight(color, 55, 18);
      light.position.set(d.x, d.y, d.z);
      scene.add(light);
      const geo = new THREE.SphereGeometry(0.32, 14, 14);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(light.position);
      scene.add(mesh);
      return { light, mesh, ox: d.x, oy: d.y, phase: d.phase };
    });

    scene.add(new THREE.AmbientLight(0x080418, 4));

    let raf = 0, t = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      t += 0.007;
      rays.forEach(r => {
        r.position.x += (r as any).v;
        if (r.position.x > 13) r.position.x = -13;
        if (r.position.x < -13) r.position.x = 13;
      });
      orbs.forEach(o => {
        const pulse = (Math.sin(t * 0.7 + o.phase) + 1) * 0.5;
        o.light.intensity = 28 + pulse * 55;
        o.mesh.scale.setScalar(0.65 + pulse * 0.55);
        (o.mesh.material as THREE.MeshBasicMaterial).opacity = 0.2 + pulse * 0.5;
        o.mesh.position.x = o.ox + Math.sin(t * 0.22 + o.phase) * 0.8;
        o.mesh.position.y = o.oy + Math.cos(t * 0.17 + o.phase) * 0.5;
        o.light.position.copy(o.mesh.position);
      });
      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); renderer.dispose(); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />;
}

function RotatingBadge() {
  const [angle, setAngle] = useState(0);
  const rafRef = useRef(0);
  useEffect(() => {
    const step = () => { setAngle(a => (a + 0.35) % 360); rafRef.current = requestAnimationFrame(step); };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);
  return (
    <div style={{ position: 'absolute', top: 36, right: 36, width: 148, height: 148, zIndex: 20, pointerEvents: 'none' }}>
      <svg viewBox="0 0 148 148" style={{ width: '100%', height: '100%', transform: `rotate(${angle}deg)` }}>
        <defs>
          <path id="badge-ring-sv" d="M74,74 m-56,0 a56,56 0 1,1 112,0 a56,56 0 1,1 -112,0" />
        </defs>
        <circle cx="74" cy="74" r="56" fill="none" stroke="rgba(245,166,35,0.25)" strokeWidth="1" />
        <circle cx="74" cy="74" r="64" fill="none" stroke="rgba(245,166,35,0.1)" strokeWidth="0.5" />
        <text fontSize="8.2" fill="rgba(255,255,255,0.7)" fontFamily="Montserrat,sans-serif" fontWeight="700" letterSpacing="2.8">
          <textPath href="#badge-ring-sv">PROFESSIONNELS UNIQUEMENT · GONESSE (95) · SHOWROOM · </textPath>
        </text>
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#F5A623', boxShadow: '0 0 10px #F5A623, 0 0 20px #F5A623aa' }} />
      </div>
    </div>
  );
}

export default function ShowroomHero() {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 200); return () => clearTimeout(t); }, []);

  return (
    <div id="slide-0" style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 60 }}>
      <HeroCanvas />
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(13,10,26,0.75) 100%)', pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0d0a1a 0%, transparent 30%)', pointerEvents: 'none', zIndex: 2 }} />
      <RotatingBadge />

      {/* Center content */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 40px' }}>
        <div style={{ overflow: 'hidden', lineHeight: 0.88, marginBottom: 8 }}>
          <SplitText text="SHOW ROOM" visible={vis} size="clamp(36px,7.5vw,100px)" baseDelay={100} stagger={65} />
        </div>
        <div style={{ overflow: 'hidden', lineHeight: 0.88, marginBottom: 32 }}>
          <SplitText text="HOMEXPO" visible={vis} size="clamp(36px,7.5vw,100px)" color="#E8185A" baseDelay={600} stagger={65} />
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(12px,1.4vw,17px)', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 48, opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(20px)', transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 1.4s' }}>
          <EditableText page="showroom" id="hero_tagline">ZAC des Tulipes Nord · Gonesse (95) · Espace Professionnel</EditableText>
        </p>
        <div style={{ display: 'flex', gap: 16, opacity: vis ? 1 : 0, transition: 'opacity 0.8s ease 1.8s' }}>
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, background: '#E8185A', color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, letterSpacing: 0.5, boxShadow: '0 6px 28px #E8185A55' }}>
            <Icon name="pin" size={15} color="#fff" /> Itinéraire
          </a>
          <a href="/pro/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
            <Icon name="phone" size={15} color="#fff" /> Nous appeler
          </a>
        </div>
      </div>

      {/* Scroll cue */}
      <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: vis ? 0.45 : 0, transition: 'opacity 1s ease 2.2s', pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#fff', letterSpacing: '0.25em', textTransform: 'uppercase' }}>Défiler</span>
        <div style={{ width: 1, height: 36, background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)', animation: 'svPulseY 1.8s ease-in-out infinite' }} />
      </div>
    </div>
  );
}
