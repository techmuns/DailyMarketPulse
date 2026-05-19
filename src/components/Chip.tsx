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

export function SignalChip({ value, dot }: { value: Signal; dot?: boolean }) {
  const c = signalColor(value);
  if (dot) {
    return (
      <span className={clsx('inline-flex items-center gap-1.5 text-[11.5px] font-medium', c.fg)}>
        <span className={clsx('w-1.5 h-1.5 rounded-full', c.dotBg)} />
        {c.label}
      </span>
    );
  }
  return <Chip className={clsx(c.bg, c.fg)}>{c.label}</Chip>;
}

export function SourceChip({ value }: { value: string }) {
  const isOfficial = value === 'Official filing' || value === 'Government source' || value === 'Company source';
  const isLow = value === 'Opinion' || value === 'Low confidence';
  return (
    <Chip
      className={clsx(
        isOfficial && 'bg-calm-navy-bg text-calm-navy',
        isLow && 'bg-ivory-100 text-charcoal-mute',
        !isOfficial && !isLow && 'bg-cream-deep text-charcoal-mute'
      )}
    >
      {value}
    </Chip>
  );
}

export function Ticker({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[11.5px] tracking-tight text-charcoal-soft bg-cream-deep border border-bordersoft px-1.5 py-0.5 rounded">
      {children}
    </span>
  );
}
