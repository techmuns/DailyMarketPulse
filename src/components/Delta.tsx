import clsx from 'clsx';
import { deltaColor, pct } from '../utils/format';

export function Delta({ value, label, digits = 2 }: { value: number; label?: string; digits?: number }) {
  const arrow = value > 0 ? '▲' : value < 0 ? '▼' : '·';
  return (
    <span className={clsx('inline-flex items-baseline gap-1 text-sm font-medium', deltaColor(value))}>
      <span className="text-[10px] leading-none">{arrow}</span>
      <span>{pct(value, digits)}</span>
      {label && <span className="text-charcoal-mute font-normal text-[11px]">{label}</span>}
    </span>
  );
}
