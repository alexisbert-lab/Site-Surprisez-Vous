'use client';
import { useEffect, useRef, useState } from 'react';
import ShowroomHero         from './ShowroomHero';
import ShowroomStats         from './ShowroomStats';
import ShowroomExperience    from './ShowroomExperience';
import ShowroomPresentation  from './ShowroomPresentation';
import ShowroomAddress       from './ShowroomAddress';
import ShowroomCTA           from './ShowroomCTA';
import { state } from './showroomState';

const SCROLL_PER = () => window.innerHeight * 2;
const NUM_SLIDES = 6;

function ease(t: number, e = 3) {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), e);
}

function applyTransitions(scrollY: number) {
  const SP = SCROLL_PER();
  const progress = document.getElementById('sv-progress');
  if (progress) progress.style.width = `${Math.min(scrollY / (NUM_SLIDES * SP) * 100, 100)}%`;

  for (let i = 0; i < NUM_SLIDES; i++) {
    const el = document.getElementById(`slide-${i}`);
    if (!el) continue;
    const p = (scrollY - i * SP) / SP;

    if (p < 0) {
      el.style.opacity = '1'; el.style.transform = 'none'; el.style.clipPath = 'none';
      continue;
    }
    if (p >= 1 && i < NUM_SLIDES - 1) {
      el.style.opacity = '0'; el.style.pointerEvents = 'none'; continue;
    }
    el.style.opacity = '1'; el.style.pointerEvents = 'auto';
    const exitP = ease(Math.max(0, (p - 0.6) / 0.4));

    switch (i) {
      case 0:
        el.style.transform = `translateY(${-exitP * 100}vh)`;
        el.style.clipPath = 'none';
        break;
      case 1:
        el.style.clipPath = exitP > 0 ? `circle(${((1 - exitP) * 150).toFixed(2)}% at 50% 50%)` : 'none';
        el.style.transform = 'none';
        break;
      case 2:
        el.style.transform = `scale(${(1 + exitP * 0.38).toFixed(4)})`;
        el.style.opacity = String((1 - exitP).toFixed(4));
        el.style.clipPath = 'none';
        break;
      case 3:
        el.style.clipPath = exitP > 0 ? `inset(0 ${(exitP * 100).toFixed(2)}% 0 0)` : 'none';
        el.style.transform = 'none';
        break;
      case 4: {
        el.style.opacity = String((1 - exitP).toFixed(4));
        el.style.transform = 'none'; el.style.clipPath = 'none';
        const flash = document.getElementById('sv-flash');
        if (flash) {
          const fv = exitP < 0.5 ? exitP * 2 : (1 - exitP) * 2;
          flash.style.opacity = String((fv * 0.88).toFixed(4));
          flash.style.transition = exitP < 0.5 ? 'opacity 0.08s linear' : 'opacity 0.15s linear';
        }
        break;
      }
      case 5:
        el.style.transform = 'none'; el.style.clipPath = 'none'; el.style.opacity = '1';
        break;
    }
  }

  const p4 = (scrollY - 4 * SP) / SP;
  if (p4 < 0.6 || p4 > 1) {
    const flash = document.getElementById('sv-flash');
    if (flash) flash.style.opacity = '0';
  }
}

export default function ShowroomApp() {
  const [activeSlide, setActiveSlide] = useState(0);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(0);

  useEffect(() => {
    document.body.classList.add('showroom-page');

    const driver = document.getElementById('sv-scroll-driver');
    const setH = () => { if (driver) driver.style.height = `${NUM_SLIDES * SCROLL_PER()}px`; };
    setH();
    window.addEventListener('resize', setH);

    const onMouse = (e: MouseEvent) => {
      state.mouse.nx = (e.clientX / window.innerWidth) * 2 - 1;
      state.mouse.ny = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouse);

    const onScroll = () => {
      const y = window.scrollY;
      applyTransitions(y);
      const SP = SCROLL_PER();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const newActive = Math.max(0, Math.min(NUM_SLIDES - 1, Math.floor(y / SP)));
        if (newActive !== activeRef.current) { activeRef.current = newActive; setActiveSlide(newActive); }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    applyTransitions(0);

    return () => {
      document.body.classList.remove('showroom-page');
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', setH);
      window.removeEventListener('mousemove', onMouse);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const active = (i: number) => activeSlide >= i;

  return (
    <>
      {/* Scroll driver in normal flow — creates the scrollable height */}
      <div id="sv-scroll-driver" />

      {/* Fixed viewport — all slides render here */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 50, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', width: '100%', height: '100%', position: 'relative' }}>
          <ShowroomHero />
          <ShowroomStats        active={active(1)} />
          <ShowroomExperience   active={active(2)} />
          <ShowroomPresentation active={active(3)} />
          <ShowroomAddress      active={active(4)} />
          <ShowroomCTA          active={active(5)} />

          {/* Slide indicator dots */}
          <div style={{ position: 'fixed', bottom: 32, right: 40, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, pointerEvents: 'none' }}>
            {Array.from({ length: NUM_SLIDES }, (_, i) => (
              <div key={i} style={{ width: activeSlide === i ? 28 : 6, height: 6, borderRadius: 3, background: activeSlide === i ? '#E8185A' : 'rgba(255,255,255,0.25)', transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Flash overlay for slide 4→5 transition */}
      <div id="sv-flash" style={{ position: 'fixed', inset: 0, background: '#fff', opacity: 0, pointerEvents: 'none', zIndex: 999 }} />
    </>
  );
}
