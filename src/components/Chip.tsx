import type { ReactNode } from 'react';
import clsx from 'clsx';
import type { ChangeStrip, Signal } from '../types';
import { changeStripColor, signalColor } from '../utils/format';

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={clsx('chip', className)}>{children}</span>;
}

export function ChangeStripChip({ value }: { value?: ChangeStrip }) {
  if (!value) return null;
  return <Chip className={changeStripColor(value)}>{value}</Chip>;
}

export function SignalChip({ value }: { value: Signal }) {
  const c = signalColor(value);
  return <Chip className={clsx(c.bg, c.fg, 'border', c.border)}>{c.label}</Chip>;
}

export function SourceChip({ value }: { value: string }) {
  const isOfficial = value === 'Official filing' || value === 'Government source' || value === 'Company source';
  const isLow = value === 'Opinion' || value === 'Low confidence';
  return (
    <Chip
      className={clsx(
        isOfficial && 'bg-calm-navy-bg text-calm-navy border border-calm-navy/20',
        isLow && 'bg-ivory-100 text-charcoal-mute border border-bordersoft',
        !isOfficial && !isLow && 'bg-ivory-100 text-charcoal-soft border border-bordersoft'
      )}
    >
      {value}
    </Chip>
  );
}
