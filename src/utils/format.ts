import type { Signal, ChangeStrip } from '../types';

export function pct(value: number, digits = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function num(value: number, digits = 2): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function signalColor(
  s: Signal
): { fg: string; bg: string; dotBg: string; label: string } {
  switch (s) {
    case 'risk':
      return { fg: 'text-calm-rose', bg: 'bg-calm-rose-bg', dotBg: 'bg-calm-rose', label: 'Risk' };
    case 'support':
      return { fg: 'text-calm-green', bg: 'bg-calm-green-bg', dotBg: 'bg-calm-green', label: 'Support' };
    case 'monitor':
      return { fg: 'text-calm-amber', bg: 'bg-calm-amber-bg', dotBg: 'bg-calm-amber', label: 'Monitor' };
    case 'noise':
      return { fg: 'text-charcoal-mute', bg: 'bg-ivory-100', dotBg: 'bg-charcoal-mute', label: 'Noise' };
  }
}

export function signalHex(s: Signal): string {
  switch (s) {
    case 'risk':
      return '#C86B6B';
    case 'support':
      return '#0F8F6F';
    case 'monitor':
      return '#D7A14A';
    case 'noise':
      return '#9CA0AA';
  }
}

export function deltaColor(value: number): string {
  if (value > 0) return 'text-calm-green';
  if (value < 0) return 'text-calm-rose';
  return 'text-charcoal-mute';
}

export function changeStripColor(c?: ChangeStrip): string {
  if (!c) return 'bg-ivory-100 text-charcoal-soft';
  switch (c) {
    case 'New today':
      return 'bg-calm-violet-bg text-calm-violet';
    case 'Changed since yesterday':
      return 'bg-calm-navy-bg text-calm-navy';
    case 'Risk increased':
      return 'bg-calm-rose-bg text-calm-rose';
    case 'Support improved':
      return 'bg-calm-green-bg text-calm-green';
    case 'Repeated theme':
      return 'bg-cream-deep text-charcoal-mute';
    case '5-day trend':
      return 'bg-calm-amber-bg text-calm-amber';
    case 'Action needed':
      return 'bg-calm-violet-bg text-calm-violet';
  }
}

export function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function todayLong(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
