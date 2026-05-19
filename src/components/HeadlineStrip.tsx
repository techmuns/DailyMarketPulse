import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { LensHeadline, Signal } from '../types';
import { useStore } from '../state/store';

interface Props {
  items: LensHeadline[];
}

// Soft semantic tints used on each card. The card body uses the bg
// token; the eyebrow chip uses the chip pair; the left rail picks up
// the accent. "noise" / neutral falls back to lavender for global.
const TONE: Record<Signal, { bg: string; rail: string; chip: string; chipText: string; label: string }> = {
  support: {
    bg: 'bg-calm-green-bg/55',
    rail: 'bg-calm-green',
    chip: 'bg-calm-green-bg',
    chipText: 'text-calm-green',
    label: 'Support',
  },
  risk: {
    bg: 'bg-calm-rose-bg/55',
    rail: 'bg-calm-rose',
    chip: 'bg-calm-rose-bg',
    chipText: 'text-calm-rose',
    label: 'Risk',
  },
  monitor: {
    bg: 'bg-calm-amber-bg/60',
    rail: 'bg-calm-amber',
    chip: 'bg-calm-amber-bg',
    chipText: 'text-calm-amber',
    label: 'Monitor',
  },
  noise: {
    bg: 'bg-calm-violet-bg/55',
    rail: 'bg-calm-violet',
    chip: 'bg-calm-violet-bg',
    chipText: 'text-calm-violet',
    label: 'Neutral',
  },
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
                'group relative flex-shrink-0 w-[300px] sm:w-[324px] snap-start',
                'rounded-2xl border border-bordersoft/70 shadow-soft hover:shadow-lift transition-shadow',
                'overflow-hidden bg-cream'
              )}
            >
              <div className={clsx('absolute inset-y-0 left-0 w-[3px]', tone.rail)} aria-hidden />
              <div className={clsx('absolute inset-0 pointer-events-none', tone.bg)} aria-hidden />
              <div className="relative p-4 flex flex-col gap-2.5 min-h-[210px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] tracking-[0.18em] uppercase font-semibold text-charcoal-mute">
                    {h.category}
                  </span>
                  <span className={clsx('chip', tone.chip, tone.chipText)}>{tone.label}</span>
                </div>
                <h3 className="text-[13.5px] font-semibold text-charcoal leading-snug line-clamp-3">
                  {h.headline}
                </h3>
                <p className="text-[11.5px] text-charcoal-soft leading-relaxed line-clamp-2">
                  {h.shortContext}
                </p>
                <div className="mt-auto pt-1.5 flex flex-wrap items-center gap-1.5">
                  {[...h.affectedSectors, ...h.affectedCompanies].slice(0, 3).map((a) => (
                    <span
                      key={a}
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-cream-deep border border-bordersoft/60 text-charcoal-mute"
                    >
                      {a}
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
