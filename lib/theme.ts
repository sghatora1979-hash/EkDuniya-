// EkDuniya hourly theme engine — 7 high-contrast futuristic themes, rotating every hour.
export type HourTheme = { name: string; acc: string; acc2: string; glow: string; deep: string };

export const HOUR_THEMES: HourTheme[] = [
  { name: 'Solar Blaze',   acc: '#FF6B35', acc2: '#FFD166', glow: 'rgba(255,107,53,.55)',  deep: '#7c2d12' },
  { name: 'Violet Storm',  acc: '#8B5CF6', acc2: '#F472B6', glow: 'rgba(139,92,246,.55)',  deep: '#3b1470' },
  { name: 'Emerald Pulse', acc: '#10B981', acc2: '#A7F3D0', glow: 'rgba(16,185,129,.50)',  deep: '#064e3b' },
  { name: 'Crimson Volt',  acc: '#EF4444', acc2: '#FCA5A5', glow: 'rgba(239,68,68,.55)',   deep: '#7f1d1d' },
  { name: 'Azure Neon',    acc: '#3B82F6', acc2: '#93C5FD', glow: 'rgba(59,130,246,.55)',   deep: '#1e3a8a' },
  { name: 'Magenta Rush',  acc: '#EC4899', acc2: '#F9A8D4', glow: 'rgba(236,72,153,.55)',  deep: '#831843' },
  { name: 'Golden Apex',   acc: '#F59E0B', acc2: '#FDE68A', glow: 'rgba(245,158,11,.55)',  deep: '#78350f' },
];

export function hourTheme(d = new Date()): HourTheme {
  const h = Math.floor(d.getTime() / 3600000);
  return HOUR_THEMES[h % HOUR_THEMES.length];
}

export function msToNextHour(d = new Date()): number {
  const n = new Date(d);
  n.setMinutes(60, 0, 0);
  return n.getTime() - d.getTime();
}

export function applyTheme(t: HourTheme) {
  if (typeof document === 'undefined') return;
  const r = document.documentElement.style;
  r.setProperty('--th-acc', t.acc);
  r.setProperty('--th-acc2', t.acc2);
  r.setProperty('--th-glow', t.glow);
  r.setProperty('--th-deep', t.deep);
}
