import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { LensHeadline, Signal } from '../types';
import { useStore } from '../state/store';

interface Props {
  items: LensHeadline[];
}

// Cards stay on a clean white surface. Tone is carried by the left
// rail + a small tone-coloured dot/label only — no full-card pastel
// fill, which read as dated.
const TONE: Record<Signal, { rail: string; text: string; label: string }> = {
  support: { rail: 'bg-calm-green', text: 'text-calm-green', label: 'Support' },
  risk: { rail: 'bg-calm-rose', text: 'text-calm-rose', label: 'Risk' },
  monitor: { rail: 'bg-calm-amber', text: 'text-calm-amber', label: 'Monitor' },
  noise: { rail: 'bg-calm-violet', text: 'text-calm-violet', label: 'Neutral' },
};

export function HeadlineStrip({ items }: Props) {
  const { openHeadline } = useStore();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      setCanPrev(el.scrollLeft > 4);
      setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [items.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>('[data-card]')?.offsetWidth ?? 320;
    el.scrollBy({ left: dir * (cardWidth + 16), behavior: 'smooth' });
  };

  if (items.length === 0) {
    return (
      <div className="px-4 py-8 rounded-2xl border border-bordersoft bg-cream text-center text-[12.5px] text-charcoal-mute">
        No headlines under this lens yet.
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-1 -mx-1 px-1"
      >
        {items.map((h) => {
          const tone = TONE[h.signal];
          return (
            <article
              key={h.id}
              data-card
              className={clsx(
                'group relative flex-shrink-0 w-[300px] sm:w-[328px] snap-start',
                'rounded-2xl border border-bordersoft/70 shadow-soft hover:shadow-lift transition-shadow',
                'overflow-hidden bg-cream'
              )}
            >
              <div className={clsx('absolute inset-y-0 left-0 w-[3px]', tone.rail)} aria-hidden />
              <div className="relative px-[18px] py-4 flex flex-col gap-2.5 min-h-[218px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] tracking-[0.22em] uppercase font-semibold text-charcoal-mute">
                    {h.category}
                  </span>
                  <span className={clsx('inline-flex items-center gap-1.5 text-[10px] tracking-[0.16em] uppercase font-semibold', tone.text)}>
                    <span className={clsx('w-1.5 h-1.5 rounded-full', tone.rail)} aria-hidden />
                    {tone.label}
                  </span>
                </div>
                <div className="h-px bg-bordersoft/70" aria-hidden />
                <h3 className="font-display text-[16.5px] font-medium text-charcoal leading-[1.22] tracking-[-0.005em] line-clamp-3">
                  {h.headline}
                </h3>
                <p className="text-[11.5px] text-charcoal-soft leading-relaxed line-clamp-2">
                  {h.shortContext}
                </p>
                <div className="mt-auto pt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-charcoal-mute">
                  {[...h.affectedSectors, ...h.affectedCompanies].slice(0, 3).map((a, i, arr) => (
                    <span key={a} className="inline-flex items-center gap-2">
                      <span>{a}</span>
                      {i < arr.length - 1 && <span className="text-charcoal-mute/40">·</span>}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => openHeadline(h)}
                  className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-calm-emerald hover:text-calm-emerald/80 self-start transition"
                >
                  Read more
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <NavButton dir="prev" disabled={!canPrev} onClick={() => scrollBy(-1)} />
      <NavButton dir="next" disabled={!canNext} onClick={() => scrollBy(1)} />
    </div>
  );
}

function NavButton({ dir, disabled, onClick }: { dir: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'prev' ? 'Scroll previous' : 'Scroll next'}
      disabled={disabled}
      className={clsx(
        'hidden sm:flex absolute top-1/2 -translate-y-1/2 z-10 items-center justify-center',
        'w-8 h-8 rounded-full bg-cream/85 backdrop-blur-md border border-bordersoft shadow-soft',
        'text-charcoal-soft hover:text-charcoal hover:shadow-lift transition',
        'disabled:opacity-0 disabled:pointer-events-none',
        dir === 'prev' ? '-left-3' : '-right-3'
      )}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        {dir === 'prev' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 6l6 6-6 6" />}
      </svg>
    </button>
  );
}
