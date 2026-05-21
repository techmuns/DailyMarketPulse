import { useState } from 'react';
import clsx from 'clsx';
import type { LensHeadline, Signal } from '../types';
import { useStore } from '../state/store';

interface Props {
  items: LensHeadline[];
  // Number of headlines visible before "Show all" is offered. Anything
  // above this threshold is collapsed by default so the panel stays
  // visually balanced with Market Weather. Defaults to 3.
  defaultVisible?: number;
}

// Same tone vocabulary used elsewhere — tone is read via the left rail
// + a small tone-coloured dot/label, on a clean white card.
const TONE: Record<Signal, { rail: string; text: string; label: string }> = {
  support: { rail: 'bg-calm-green', text: 'text-calm-green', label: 'Support' },
  risk: { rail: 'bg-calm-rose', text: 'text-calm-rose', label: 'Risk' },
  monitor: { rail: 'bg-calm-amber', text: 'text-calm-amber', label: 'Monitor' },
  noise: { rail: 'bg-calm-violet', text: 'text-calm-violet', label: 'Neutral' },
};

export function HeadlineStack({ items, defaultVisible = 3 }: Props) {
  const { openHeadline } = useStore();
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) {
    return (
      <div className="px-4 py-8 rounded-2xl border border-bordersoft bg-cream text-center text-[12.5px] text-charcoal-mute">
        No headlines under this lens yet.
      </div>
    );
  }

  const visible = expanded ? items : items.slice(0, defaultVisible);
  const hidden = items.length - visible.length;

  return (
    <div>
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {visible.map((h, i) => {
        const tone = TONE[h.signal];
        const affected = [...h.affectedSectors, ...h.affectedCompanies].slice(0, 2);
        const isLastOdd = items.length % 2 === 1 && i === items.length - 1;
        return (
          <li key={h.id} className={clsx(isLastOdd && 'sm:col-span-2')}>
            <article className="group relative rounded-2xl border border-bordersoft/70 bg-cream shadow-soft hover:shadow-lift transition-shadow overflow-hidden h-full flex flex-col">
              <div className={clsx('absolute inset-y-0 left-0 w-[3px]', tone.rail)} aria-hidden />
              <div className="relative pl-4 pr-3.5 py-3.5 flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9.5px] tracking-[0.22em] uppercase font-semibold text-charcoal-mute truncate">
                    {h.category}
                  </span>
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1.5 text-[9.5px] tracking-[0.16em] uppercase font-semibold shrink-0',
                      tone.text
                    )}
                  >
                    <span className={clsx('w-1.5 h-1.5 rounded-full', tone.rail)} aria-hidden />
                    {tone.label}
                  </span>
                </div>

                <h3 className="font-display text-[14.5px] font-medium text-charcoal leading-[1.25] tracking-[-0.005em] line-clamp-2">
                  {h.headline}
                </h3>

                <p className="text-[11.5px] text-charcoal-soft leading-relaxed line-clamp-1">
                  {h.shortContext}
                </p>

                <div className="mt-auto pt-1.5 flex items-end justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-charcoal-mute min-w-0">
                    {affected.map((a, j) => (
                      <span key={a} className="inline-flex items-center gap-2">
                        <span className="truncate">{a}</span>
                        {j < affected.length - 1 && <span className="text-charcoal-mute/40">·</span>}
                      </span>
                    ))}
                  </div>
                  <ReadMoreButton onClick={() => openHeadline(h)} />
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
    {(hidden > 0 || expanded) && (
      <div className="mt-2.5 flex items-center justify-end gap-3">
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-[11px] tracking-wide font-medium text-calm-violet hover:text-calm-violet/80 transition"
          >
            Show all {items.length} →
          </button>
        )}
        {expanded && items.length > defaultVisible && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-[11px] tracking-wide text-charcoal-mute hover:text-charcoal-soft transition"
          >
            Show less
          </button>
        )}
      </div>
    )}
    </div>
  );
}

function ReadMoreButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11.5px] font-medium text-calm-emerald hover:text-calm-emerald/80 transition shrink-0"
    >
      Read more
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  );
}
