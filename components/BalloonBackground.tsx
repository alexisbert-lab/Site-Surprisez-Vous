'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import anime from 'animejs';

const BALLOON_FILES = [
  'balloon-1.glb',
  'balloon-2.glb',
  'balloon-3.glb',
  'balloon-4.glb',
  'balloon-5.glb',
];

interface Balloon {
  group: THREE.Group;
  baseX: number;
  baseY: number;
}

export default function BalloonBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    balloons: Balloon[];
    timelines: anime.AnimeInstance[];
  } | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Three.js setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 50;

    // Zone visible en unités 3D
    const vFOV = (75 * Math.PI) / 180;
    const visibleH = 2 * Math.tan(vFOV / 2) * camera.position.z; // ~100 unités
    const visibleW = visibleH * (width / height);

    const balloons: Balloon[] = [];
    const timelines: anime.AnimeInstance[] = [];
    const loader = new GLTFLoader();
    let modelsLoaded = 0;
    const models: THREE.Group[] = [];

    const DURATION = 40000;
    const COUNT = 20;

    const loadModels = async () => {
      for (const file of BALLOON_FILES) {
        try {
          const gltf = await new Promise<GLTF>((resolve, reject) => {
            loader.load(`/models/balloons/${file}`, resolve, undefined, reject);
          });
          const model = gltf.scene;
          // Normaliser la taille à ~8 unités
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const s = 20 / maxDim;
          model.scale.set(s, s, s);
          models.push(model);
          modelsLoaded++;
        } catch (error) {
          console.warn(`Impossible de charger ${file}:`, error);
        }
      }

      if (modelsLoaded === 0) {
        console.warn('Aucun ballon chargé. Place des fichiers .glb dans /public/models/balloons/');
        return;
      }

      const createBalloon = (delayOffset: number) => {
        const riseGroup = new THREE.Group();
        const innerGroup = new THREE.Group();
        innerGroup.add(models[Math.floor(Math.random() * models.length)].clone());
        riseGroup.add(innerGroup);

        const x = (Math.random() - 0.5) * visibleW;
        const startY = -visibleH / 2 - 80;
        const endY = visibleH / 2 + 80;
        riseGroup.position.set(x, startY, (Math.random() - 0.5) * 70);
        scene.add(riseGroup);

        balloons.push({ group: riseGroup, baseX: x, baseY: startY });

        let riseAnim: anime.AnimeInstance | null = null;
        let active = true;

        const runBalloon = () => {
          if (!active) return;
          const side = Math.random() > 0.5 ? 1 : -1;
          const newX = side * (0.35 + Math.random() * 0.45) * visibleW / 2;
          riseGroup.position.set(newX, startY, (Math.random() - 0.5) * 70);
          riseAnim = anime({
            targets: riseGroup.position,
            y: endY,
            duration: DURATION + Math.random() * 8000,
            easing: 'linear',
            complete: runBalloon,
          });
        };

        setTimeout(runBalloon, delayOffset);

        const tl = { pause: () => { active = false; riseAnim?.pause();} } as unknown as anime.AnimeInstance;

        const driftX = 2 + Math.random() * 3;
        anime({
          targets: innerGroup.position,
          x: [{ value: -driftX }, { value: driftX }],
          duration: 5000 + Math.random() * 4000,
          easing: 'easeInOutSine',
          direction: 'alternate',
          loop: true,
        });

        const spinDuration = 5000 + Math.random() * 6000;
        const spinDir = Math.random() > 0.5 ? 1 : -1;
        anime({
          targets: innerGroup.rotation,
          y: spinDir * Math.PI * 2,
          duration: spinDuration,
          easing: 'linear',
          loop: true,
        });

        timelines.push(tl);
      };

      // Étaler les 20 ballons sur toute la durée pour un flux continu
      for (let i = 0; i < COUNT; i++) {
        createBalloon((DURATION / COUNT) * i);
      }

      scene.add(new THREE.AmbientLight(0xffffff, 1.2));
      const dir = new THREE.DirectionalLight(0xffffff, 1.0);
      dir.position.set(5, 10, 5);
      scene.add(dir);

      sceneRef.current = { renderer, scene, camera, balloons, timelines };

      let animationFrameId: number;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        renderer.dispose();
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        timelines.forEach((tl) => tl.pause());
      };
    };

    loadModels();
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 opacity-25"
      aria-hidden="true"
    />
  );
}
