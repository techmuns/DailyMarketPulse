import clsx from 'clsx';
import { Sparkline } from './Sparkline';
import { deltaColor, pct, signalHex } from '../utils/format';
import type { Signal } from '../types';

export interface SnapshotItem {
  key: string;
  label: string;
  headline: string;
  delta: number;
  spark: number[];
  signal: Signal;
  onClick?: () => void;
}

interface Props {
  items: SnapshotItem[];
}

export function SnapshotStrip({ items }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {items.map((i) => {
        const Comp: any = i.onClick ? 'button' : 'div';
        return (
          <Comp
            key={i.key}
            onClick={i.onClick}
            className={clsx(
              'group text-left bg-cream border border-bordersoft rounded-xl p-3.5 shadow-soft transition',
              i.onClick && 'hover:shadow-lift hover:-translate-y-[1px]'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="label-mute">{i.label}</span>
              <span className={clsx('text-[12px] font-semibold tabular-nums', deltaColor(i.delta))}>
                {pct(i.delta)}
              </span>
            </div>
            <div className="text-[12.5px] text-charcoal-soft mt-1.5 line-clamp-1 leading-tight">{i.headline}</div>
            <div className="mt-2 -mx-1">
              <Sparkline data={i.spark} color={signalHex(i.signal)} height={26} strokeWidth={1.5} />
            </div>
          </Comp>
        );
      })}
    </div>
  );
}
