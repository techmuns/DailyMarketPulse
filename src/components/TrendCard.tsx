import clsx from 'clsx';
import { Card } from './Card';
import { Delta } from './Delta';
import { Sparkline } from './Sparkline';
import { SignalChip, SourceChip } from './Chip';
import type { BaseItem } from '../types';
import { num } from '../utils/format';
import { useStore } from '../state/store';
import { aiSignals } from '../data/signals';

interface Props {
  item: BaseItem;
  unit?: string;
  className?: string;
}

export function TrendCard({ item, unit, className }: Props) {
  const { openDrawer } = useStore();
  const sparkColor =
    item.signal === 'risk' ? '#C97A78' : item.signal === 'support' ? '#5BAE8A' : item.signal === 'monitor' ? '#D4A24C' : '#9CA3AF';
  const matched =
    aiSignals.find((s) => s.affected.some((a) => item.affected.includes(a))) ||
    aiSignals.find((s) => s.category === item.category) ||
    aiSignals[0];
  return (
    <Card
      strip={item.changeStrip}
      title={item.title}
      subtitle={item.whyShown}
      right={<SignalChip value={item.signal} />}
      onClick={() => openDrawer(matched)}
      className={className}
    >
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-display font-semibold text-charcoal">
              {typeof item.current === 'number' ? num(item.current as number) : item.current}
            </span>
            {unit && <span className="text-[12px] text-charcoal-mute">{unit}</span>}
          </div>
          {item.trend && (
            <div className="flex items-center gap-3 mt-1">
              <Delta value={item.trend.d1} label="1D" />
              <Delta value={item.trend.d5} label="5D" />
              <Delta value={item.trend.m1} label="1M" />
            </div>
          )}
        </div>
        {item.trend && (
          <div className="w-28 shrink-0">
            <Sparkline data={item.trend.spark} color={sparkColor} />
          </div>
        )}
      </div>
      <div className={clsx('mt-3 flex items-center gap-2 flex-wrap')}>
        <SourceChip value={item.source} />
        {item.affected.slice(0, 3).map((a) => (
          <span
            key={a}
            className="chip bg-ivory-100 text-charcoal-soft border border-bordersoft"
          >
            {a}
          </span>
        ))}
        {item.affected.length > 3 && (
          <span className="text-[11px] text-charcoal-mute">+{item.affected.length - 3} more</span>
        )}
      </div>
    </Card>
  );
}
