import clsx from 'clsx';
import { Sparkline } from './Sparkline';
import { deltaColor, pct } from '../utils/format';
import { toneTokens } from '../utils/tone';
import type { Tone } from '../utils/tone';

export interface SnapshotItem {
  key: string;
  label: string;
  headline: string;
  delta: number;
  spark: number[];
  tone: Tone;
  onClick?: () => void;
}

interface Props {
  items: SnapshotItem[];
}

export function SnapshotStrip({ items }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {items.map((i) => {
        const t = toneTokens(i.tone);
        const Comp: any = i.onClick ? 'button' : 'div';
        return (
          <Comp
            key={i.key}
            onClick={i.onClick}
            className={clsx(
              'group text-left bg-cream border border-bordersoft border-l-[3px] rounded-xl p-3.5 shadow-soft transition',
              t.border,
              i.onClick && 'hover:shadow-lift hover:-translate-y-[1px]'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="label-mute">{i.label}</span>
              <span
                className={clsx(
                  'text-[12px] font-semibold tabular-nums',
                  i.delta === 0 ? 'text-charcoal-mute' : deltaColor(i.delta)
                )}
              >
                {i.delta === 0 ? '—' : pct(i.delta)}
              </span>
            </div>
            <div className="text-[12.5px] text-charcoal-soft mt-1.5 line-clamp-1 leading-tight">{i.headline}</div>
            <div className="mt-2 -mx-1">
              <Sparkline data={i.spark} color={t.spark} height={26} strokeWidth={1.5} />
            </div>
          </Comp>
        );
      })}
    </div>
  );
}
