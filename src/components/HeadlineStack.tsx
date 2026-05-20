import clsx from 'clsx';
import type { LensHeadline, Signal } from '../types';
import { useStore } from '../state/store';

interface Props {
  items: LensHeadline[];
}

// Same tone vocabulary as HeadlineStrip — tone read via left rail
// + a small tone-coloured dot/label, on a clean white card.
const TONE: Record<Signal, { rail: string; text: string; label: string }> = {
  support: { rail: 'bg-calm-green', text: 'text-calm-green', label: 'Support' },
  risk: { rail: 'bg-calm-rose', text: 'text-calm-rose', label: 'Risk' },
  monitor: { rail: 'bg-calm-amber', text: 'text-calm-amber', label: 'Monitor' },
  noise: { rail: 'bg-calm-violet', text: 'text-calm-violet', label: 'Neutral' },
};

export function HeadlineStack({ items }: Props) {
  const { openHeadline } = useStore();

  if (items.length === 0) {
    return (
      <div className="px-4 py-8 rounded-2xl border border-bordersoft bg-cream text-center text-[12.5px] text-charcoal-mute">
        No headlines under this lens yet.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3.5">
      {items.map((h) => {
        const tone = TONE[h.signal];
        const affected = [...h.affectedSectors, ...h.affectedCompanies].slice(0, 3);
        return (
          <li key={h.id}>
            <article
              className={clsx(
                'group relative rounded-2xl border border-bordersoft/70 bg-cream shadow-soft hover:shadow-lift transition-shadow overflow-hidden'
              )}
            >
              <div className={clsx('absolute inset-y-0 left-0 w-[3px]', tone.rail)} aria-hidden />
              <div className="relative pl-5 pr-4 py-3.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9.5px] tracking-[0.22em] uppercase font-semibold text-charcoal-mute">
                    {h.category}
                  </span>
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1.5 text-[9.5px] tracking-[0.16em] uppercase font-semibold',
                      tone.text
                    )}
                  >
                    <span className={clsx('w-1.5 h-1.5 rounded-full', tone.rail)} aria-hidden />
                    {tone.label}
                  </span>
                </div>

                <h3 className="font-display text-[15.5px] font-medium text-charcoal leading-[1.25] tracking-[-0.005em] line-clamp-2">
                  {h.headline}
                </h3>

                <p className="text-[11.5px] text-charcoal-soft leading-relaxed line-clamp-1">
                  {h.shortContext}
                </p>

                <div className="mt-1 flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-charcoal-mute min-w-0">
                    {affected.map((a, i) => (
                      <span key={a} className="inline-flex items-center gap-2">
                        <span className="truncate">{a}</span>
                        {i < affected.length - 1 && <span className="text-charcoal-mute/40">·</span>}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => openHeadline(h)}
                    className="inline-flex items-center gap-1 text-[11.5px] font-medium text-calm-emerald hover:text-calm-emerald/80 shrink-0 transition"
                  >
                    Read more
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
