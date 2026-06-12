import clsx from 'clsx';
import { Card } from './Card';
import { Delta } from './Delta';
import { Sparkline } from './Sparkline';
import { ToneDot, MeaningBadge } from './Tone';
import type { BaseItem } from '../types';
import { num } from '../utils/format';
import { getSignalTone, marketMeaning, toneTokens } from '../utils/tone';
import { useStore } from '../state/store';
import { useAiSignals } from '../utils/useAiSignals';

interface Props {
  item: BaseItem;
  unit?: string;
  className?: string;
}

export function TrendCard({ item, unit, className }: Props) {
  const { openDrawer } = useStore();
  const aiSignals = useAiSignals();
  const tone = getSignalTone(item);
  const tokens = toneTokens(tone);
  const meaning = marketMeaning(item);
  const matched =
    aiSignals.find((s) => s.affected.some((a) => item.affected.includes(a))) ||
    aiSignals.find((s) => s.category === item.category) ||
    aiSignals[0];
  return (
    <Card
      strip={item.changeStrip}
      title={item.title}
      right={<ToneDot tone={tone} />}
      onClick={() => openDrawer(matched)}
      className={clsx('border-l-[3px]', tokens.border, className)}
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
            <Sparkline data={item.trend.spark} color={tokens.spark} height={42} />
          </div>
        )}
      </div>
      {meaning && (
        <div className="mt-3">
          <MeaningBadge tone={tone}>{meaning}</MeaningBadge>
        </div>
      )}
    </Card>
  );
}
