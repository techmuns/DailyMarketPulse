import type { ReactNode } from 'react';
import clsx from 'clsx';

interface Props {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: 'green' | 'rose' | 'amber' | 'navy' | 'violet' | 'neutral';
  className?: string;
}

const accents: Record<NonNullable<Props['accent']>, string> = {
  green: 'border-l-calm-green',
  rose: 'border-l-calm-rose',
  amber: 'border-l-calm-amber',
  navy: 'border-l-calm-navy',
  violet: 'border-l-calm-violet',
  neutral: 'border-l-bordersoft',
};

export function Scorecard({ label, value, sub, accent = 'neutral', className }: Props) {
  return (
    <div
      className={clsx(
        'bg-cream border border-bordersoft rounded-xl p-4 shadow-soft',
        'border-l-[3px]',
        accents[accent],
        className
      )}
    >
      <div className="label-mute">{label}</div>
      <div className="mt-2 font-display text-[20px] font-semibold text-charcoal leading-tight">
        {value}
      </div>
      {sub && <div className="mt-1 text-[11.5px] text-charcoal-mute">{sub}</div>}
    </div>
  );
}
