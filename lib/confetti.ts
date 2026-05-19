import confetti from 'canvas-confetti';

export function fireConfetti() {
  const colors = ['#E8185A', '#F5A623', '#3DBDB0', '#6B4FA0', '#2B3EA0', '#fff', '#E97132'];
  const fire = (ratio: number, opts: confetti.Options) =>
    confetti({ origin: { y: 0.55 }, colors, zIndex: 9999, disableForReducedMotion: true, ...opts, particleCount: Math.floor(250 * ratio) });

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2,  { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1,  { spread: 120, startVelocity: 45 });

  setTimeout(() => {
    confetti({ particleCount: 80, angle: 60,  spread: 55, origin: { x: 0 }, colors, zIndex: 9999 });
    confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 }, colors, zIndex: 9999 });
  }, 200);
}
