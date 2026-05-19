import clsx from 'clsx';
import { deltaColor, pct } from '../utils/format';

export function Delta({
  value,
  label,
  digits = 2,
  size = 'sm',
}: {
  value: number;
  label?: string;
  digits?: number;
  size?: 'xs' | 'sm' | 'md';
}) {
  const sz = size === 'md' ? 'text-[14px]' : size === 'xs' ? 'text-[11.5px]' : 'text-[12.5px]';
  return (
    <span className={clsx('inline-flex items-baseline gap-1 font-medium tabular-nums', sz, deltaColor(value))}>
      <span>{pct(value, digits)}</span>
      {label && <span className="text-charcoal-mute font-normal text-[10.5px] uppercase tracking-wider">{label}</span>}
    </span>
  );
}
