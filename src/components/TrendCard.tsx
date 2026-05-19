import { Card } from './Card';
import { Delta } from './Delta';
import { Sparkline } from './Sparkline';
import { SignalChip } from './Chip';
import type { BaseItem } from '../types';
import { num, signalHex } from '../utils/format';
import { useStore } from '../state/store';
import { aiSignals } from '../data/signals';

interface Props {
  item: BaseItem;
  unit?: string;
  className?: string;
}

export function TrendCard({ item, unit, className }: Props) {
  const { openDrawer } = useStore();
  const matched =
    aiSignals.find((s) => s.affected.some((a) => item.affected.includes(a))) ||
    aiSignals.find((s) => s.category === item.category) ||
    aiSignals[0];
  return (
    <Card
      strip={item.changeStrip}
      title={item.title}
      right={<SignalChip value={item.signal} dot />}
      onClick={() => openDrawer(matched)}
      className={className}
      padding="md"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[22px] font-semibold text-charcoal tabular-nums">
              {typeof item.current === 'number' ? num(item.current as number) : item.current}
            </span>
            {unit && <span className="text-[11px] text-charcoal-mute">{unit}</span>}
          </div>
          {item.trend && (
            <div className="flex items-center gap-3 mt-1.5">
              <Delta value={item.trend.d1} label="1D" />
              <Delta value={item.trend.d5} label="5D" />
              <Delta value={item.trend.m1} label="1M" />
            </div>
          )}
        </div>
        {item.trend && (
          <div className="w-24 shrink-0">
            <Sparkline data={item.trend.spark} color={signalHex(item.signal)} height={42} />
          </div>
        )}
      </div>
    </Card>
  );
}
