'use client';

import { useEffect, useRef, type RefObject } from 'react';
import anime from 'animejs';

export function useFadeIn<T extends HTMLElement>(
  options?: { delay?: number; duration?: number; translateY?: number }
): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ref.current) return;
    anime({
      targets: ref.current,
      opacity: [0, 1],
      translateY: [options?.translateY ?? 20, 0],
      duration: options?.duration ?? 600,
      delay: options?.delay ?? 0,
      easing: 'easeOutCubic',
    });
  }, []);
  return ref;
}

export function useStagger<T extends HTMLElement>(
  childSelector: string,
  options?: { delay?: number; stagger?: number; duration?: number }
): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ref.current) return;
    const children = ref.current.querySelectorAll(childSelector);
    if (!children.length) return;
    anime({
      targets: children,
      opacity: [0, 1],
      translateY: [24, 0],
      delay: anime.stagger(options?.stagger ?? 80, { start: options?.delay ?? 100 }),
      duration: options?.duration ?? 500,
      easing: 'easeOutCubic',
    });
  }, []);
  return ref;
}

export function useScaleIn<T extends HTMLElement>(
  open: boolean
): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ref.current || !open) return;
    anime({
      targets: ref.current,
      scale: [0.92, 1],
      opacity: [0, 1],
      duration: 300,
      easing: 'easeOutBack',
    });
  }, [open]);
  return ref;
}

export function useSlideInLeft<T extends HTMLElement>(
  childSelector: string
): RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ref.current) return;
    const children = ref.current.querySelectorAll(childSelector);
    if (!children.length) return;
    anime({
      targets: children,
      opacity: [0, 1],
      translateX: [-20, 0],
      delay: anime.stagger(40, { start: 100 }),
      duration: 400,
      easing: 'easeOutCubic',
    });
  }, []);
  return ref;
}
