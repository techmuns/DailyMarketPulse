import clsx from 'clsx';
import { toneTokens } from '../utils/tone';
import type { Tone } from '../utils/tone';

export function ToneDot({ tone, label }: { tone: Tone; label?: string }) {
  const t = toneTokens(tone);
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-[11.5px] font-medium', t.text)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', t.dot)} />
      {label ?? t.label}
    </span>
  );
}

/**
 * "Market meaning" chip — short context label like "FX Pressure".
 * Coloured by tone so the meaning is instant.
 */
export function MeaningBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const t = toneTokens(tone);
  return (
    <span className={clsx('chip', t.chipBg, t.text)}>
      {children}
    </span>
  );
}
