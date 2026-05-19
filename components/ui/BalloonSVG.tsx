function shadeColor(hex: string, pct: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  return '#' + [(n >> 16) + pct, ((n >> 8) & 255) + pct, (n & 255) + pct]
    .map(v => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0')).join('');
}

interface BalloonSVGProps { color: string; size: number; }

export function BalloonSVG({ color, size }: BalloonSVGProps) {
  const id = `balloon_${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 60 84" fill="none">
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="40%" stopColor={color} />
          <stop offset="100%" stopColor={shadeColor(color, -40)} />
        </radialGradient>
      </defs>
      <ellipse cx="30" cy="32" rx="28" ry="30" fill={`url(#${id})`} />
      <ellipse cx="21" cy="20" rx="7" ry="5" fill="rgba(255,255,255,0.35)"
        transform="rotate(-20 21 20)" />
      <polygon points="27,62 33,62 30,68" fill={color} />
      <path d="M30 68 Q35 74 30 80 Q25 86 30 92"
        stroke={shadeColor(color, -20)} strokeWidth="1.5" fill="none" />
    </svg>
  );
}
