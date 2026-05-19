'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useScrollProgress, useIntersect } from './useScrollProgress';

const LIGHTS_CONFIG = [
  { z: -5,  color: new THREE.Color('#E8185A') },
  { z: -12, color: new THREE.Color('#3DBDB0') },
  { z: -20, color: new THREE.Color('#F5A623') },
  { z: -28, color: new THREE.Color('#6B4FA0') },
  { z: -36, color: new THREE.Color('#E8185A') },
];

export default function ShowroomTunnel() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textProgress, setTextProgress] = useState(0);
  const [entered, setEntered] = useState(false);

  useIntersect(wrapRef, (e) => { if (e.isIntersecting) setEntered(true); });

  // Three.js setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0d0a1a, 0.04);
    scene.background = new THREE.Color(0x0d0a1a);

    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
    camera.position.set(0, 1.6, 8);

    // Resize
    const resize = () => {
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ---- Floor ----
    const floorGeo = new THREE.PlaneGeometry(12, 80, 12, 80);
    const floorMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uScroll: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uScroll;
        varying vec2 vUv;
        void main() {
          float tileX = mod(floor(vUv.x * 20.0), 2.0);
          float tileY = mod(floor(vUv.y * 40.0 + uScroll * 5.0), 2.0);
          float checker = mod(tileX + tileY, 2.0);
          vec3 dark  = vec3(0.07, 0.08, 0.12);
          vec3 light = vec3(0.12, 0.13, 0.18);
          vec3 col = mix(dark, light, checker);
          // Shine stripe
          float shine = pow(max(0.0, 1.0 - abs(vUv.x - 0.5) * 6.0), 3.0) * 0.15;
          col += shine;
          float fade = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
          gl_FragColor = vec4(col, fade);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -30);
    scene.add(floor);

    // ---- Ceiling ----
    const ceilGeo = new THREE.PlaneGeometry(12, 80);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 1 });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 4, -30);
    scene.add(ceiling);

    // ---- Walls ----
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0e1020, roughness: 0.9, metalness: 0.1 });
    const wallGeo = new THREE.BoxGeometry(0.15, 4.5, 80);
    const wallL = new THREE.Mesh(wallGeo, wallMat);
    wallL.position.set(-6, 2.25, -30);
    const wallR = wallL.clone();
    wallR.position.x = 6;
    scene.add(wallL, wallR);

    // ---- Ceiling lights ----
    const spotLights: THREE.SpotLight[] = [];
    LIGHTS_CONFIG.forEach(({ z, color }) => {
      const spot = new THREE.SpotLight(color, 4, 20, Math.PI / 6, 0.5, 1.5);
      spot.position.set(0, 3.8, z);
      spot.target.position.set(0, 0, z);
      scene.add(spot, spot.target);
      spotLights.push(spot);

      // Light bulb visual
      const bulbGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const bulbMat = new THREE.MeshBasicMaterial({ color });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.copy(spot.position);
      scene.add(bulb);
    });

    // Ambient
    scene.add(new THREE.AmbientLight(0xffffff, 0.08));

    // Camera state
    const camTarget = { z: 8, rotX: 0, rotY: 0 };
    const camCurrent = { z: 8, rotX: 0, rotY: 0 };
    const mouse = { x: 0, y: 0 };
    let scrollProgress = 0;

    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5);
      mouse.y = (e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', onMouse);

    const onScroll = () => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const total = wrapRef.current.offsetHeight - window.innerHeight;
      scrollProgress = Math.max(0, Math.min(1, -rect.top / total));
      setTextProgress(scrollProgress);

      // lights color shift
      spotLights.forEach((spot, i) => {
        const t = (scrollProgress + i * 0.2) % 1;
        const hue = t * 360;
        spot.color.setHSL(hue / 360, 0.9, 0.6);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const t = clock.getElapsedTime();

      // Camera z: advance into tunnel
      camTarget.z = 8 - scrollProgress * 7;
      camTarget.rotY = mouse.x * 0.06;
      camTarget.rotX = -mouse.y * 0.03;

      camCurrent.z   += (camTarget.z   - camCurrent.z)   * 0.05;
      camCurrent.rotY += (camTarget.rotY - camCurrent.rotY) * 0.05;
      camCurrent.rotX += (camTarget.rotX - camCurrent.rotX) * 0.05;

      camera.position.z = camCurrent.z;
      camera.rotation.y = camCurrent.rotY;
      camera.rotation.x = camCurrent.rotX;

      floorMat.uniforms.uTime.value = t;
      floorMat.uniforms.uScroll.value = scrollProgress;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('scroll', onScroll);
      floorGeo.dispose(); floorMat.dispose();
      ceilGeo.dispose(); ceilMat.dispose();
      wallGeo.dispose(); wallMat.dispose();
      renderer.dispose();
    };
  }, []);

  const leftOpacity  = Math.min(1, Math.max(0, (textProgress - 0.15) / 0.3));
  const centerOpacity = Math.min(1, Math.max(0, (textProgress - 0.45) / 0.25));
  const rightOpacity = Math.min(1, Math.max(0, (textProgress - 0.15) / 0.3));

  return (
    <section ref={wrapRef} className="relative" style={{ height: '350vh' }}>
      {/* Sticky wrapper */}
      <div ref={stickyRef} className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Overlay holographic labels */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-8 z-10">
          {/* Left label */}
          <div
            style={{
              opacity: leftOpacity,
              transform: `translateX(${(1 - leftOpacity) * -40}px)`,
              transition: 'none',
            }}
          >
            <p
              className="text-white/70 uppercase tracking-[0.5em]"
              style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', writingMode: 'vertical-lr', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
            >
              ZAC DES TULIPES NORD
            </p>
          </div>

          {/* Center label */}
          <div className="text-center" style={{ opacity: centerOpacity, transform: `scale(${0.8 + centerOpacity * 0.2})` }}>
            <p
              className="font-black"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(3rem, 10vw, 8rem)',
                color: 'transparent',
                WebkitTextStroke: '1.5px rgba(232,24,90,0.8)',
                textShadow: '0 0 80px rgba(232,24,90,0.4)',
                letterSpacing: '0.05em',
              }}
            >
              400 m²
            </p>
            <p className="text-white/40 uppercase tracking-[0.4em] mt-2" style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem' }}>
              d&apos;espace festif
            </p>
          </div>

          {/* Right label */}
          <div
            style={{
              opacity: rightOpacity,
              transform: `translateX(${(1 - rightOpacity) * 40}px)`,
              transition: 'none',
            }}
          >
            <p
              className="text-white/70 uppercase tracking-[0.5em]"
              style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', writingMode: 'vertical-lr', textOrientation: 'mixed' }}
            >
              BÂTIMENT 2C · GONESSE
            </p>
          </div>
        </div>

        {/* Top gradient fade */}
        <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to bottom, #0d0a1a, transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, #0d0a1a, transparent)' }} />
      </div>
    </section>
  );
}
