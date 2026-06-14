import type { ElementType } from 'react';
import clsx from 'clsx';
import { deltaColor, pct } from '../utils/format';

export interface HeatCell {
  id: string;
  label: string;
  value: number; // % move (1D)
  sub?: string;
  size?: number; // optional weight for visual size hint (e.g., portfolio %)
}

interface Props {
  cells: HeatCell[];
  cols?: number;
  showSub?: boolean;
  onClick?: (c: HeatCell) => void;
  maxAbs?: number; // intensity normalisation cap
}

export function Heatmap({ cells, cols = 4, showSub = true, onClick, maxAbs = 2 }: Props) {
  return (
    <div
      className={clsx('grid gap-1.5')}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {cells.map((c) => {
        const intensity = Math.min(1, Math.abs(c.value) / maxAbs);
        const bg =
          c.value >= 0
            ? `rgba(15, 143, 111, ${0.06 + intensity * 0.32})`
            : `rgba(200, 107, 107, ${0.06 + intensity * 0.32})`;
        const Comp: ElementType = onClick ? 'button' : 'div';
        return (
          <Comp
            key={c.id}
            onClick={onClick ? () => onClick(c) : undefined}
            className={clsx(
              'text-left rounded-lg p-2.5 border border-bordersoft/70 transition',
              onClick && 'hover:shadow-soft hover:border-bordersoft'
            )}
            style={{ background: bg }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11.5px] text-charcoal-soft truncate font-medium">{c.label}</div>
              {c.size !== undefined && (
                <div className="text-[10px] text-charcoal-mute">{c.size}%</div>
              )}
            </div>
            <div className={clsx('text-[14px] font-semibold mt-1.5', deltaColor(c.value))}>
              {pct(c.value)}
            </div>
            {showSub && c.sub && (
              <div className="text-[10.5px] text-charcoal-mute mt-1 line-clamp-1">{c.sub}</div>
            )}
          </Comp>
        );
      })}
    </div>
  );
}
