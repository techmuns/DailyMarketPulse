// Slim newspaper-style continuation header used on inner pages
// (Macro / Markets / Currency / Commodities / Filings / Book /
// Watchlist / Events). Keeps the Daily Market Pulse identity visible
// without repeating the full hero or the lens selector — the user
// has already moved into a section, so the section name itself is
// enough context.
//
// Placement: sticky at the top of the tab's <main> content. The
// outer App padding gives it room above the page; the slim height
// (~64px) means it never dominates.

import clsx from 'clsx';
import { todayLong } from '../utils/format';

interface Props {
  section: string;
  chips?: string[];
  // Optional override — defaults to "08:25 IST" to match the
  // pre-market brief timestamp shown elsewhere on the dashboard.
  // When live data is available callers can pass a real time string.
  time?: string;
}

export function CompactMasthead({ section, chips = [], time = '08:25 IST' }: Props) {
  return (
    <header
      className="sticky top-0 z-20 -mx-6 md:-mx-16 px-6 md:px-16 backdrop-blur-[12px] border-b border-bordersoft/70"
      style={{
        background:
          'linear-gradient(180deg, rgba(252,251,255,0.92) 0%, rgba(245,240,255,0.78) 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.5) inset, 0 4px 14px rgba(72,55,120,0.05)',
      }}
    >
      <div className="max-w-[1320px] mx-auto py-2.5 md:py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Left: brand + section */}
        <div className="flex items-center gap-2 min-w-0">
          <PulseDot />
          <span className="font-masthead text-[12.5px] md:text-[13px] tracking-[0.16em] uppercase font-bold text-charcoal whitespace-nowrap">
            Daily Market Pulse
          </span>
          <span className="text-charcoal-mute/40 select-none">·</span>
          <span className="font-display text-[13px] md:text-[14px] font-medium text-charcoal-soft truncate">
            {section}
          </span>
        </div>

        {/* Middle: signal chips (hidden on narrow viewports to avoid wrap) */}
        {chips.length > 0 && (
          <ul className="hidden lg:flex items-center gap-2 min-w-0 flex-1 justify-center">
            {chips.slice(0, 3).map((chip, i) => (
              <li key={chip}>
                <span
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] tracking-[0.16em] uppercase font-semibold ring-1',
                    chipStyle(i),
                  )}
                >
                  {chip}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Right: date · time · 5-Minute Market Edge */}
        <div className="flex items-center gap-2 text-[10.5px] tracking-[0.18em] uppercase font-semibold text-charcoal-mute whitespace-nowrap">
          <span className="hidden md:inline text-charcoal-soft">{todayLong()}</span>
          <span className="hidden md:inline text-charcoal-mute/40 select-none">·</span>
          <span className="hidden md:inline text-charcoal-soft">{time}</span>
          <span className="hidden md:inline text-charcoal-mute/40 select-none">·</span>
          <span className="text-calm-emerald">5-Minute Market Edge</span>
        </div>
      </div>
    </header>
  );
}

function PulseDot() {
  return (
    <span className="relative flex w-1.5 h-1.5 shrink-0" aria-hidden>
      <span className="absolute inset-0 rounded-full bg-calm-emerald opacity-60 animate-ping" />
      <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-calm-emerald" />
    </span>
  );
}

// Rotate through three subtle tones across chips so a row of three
// reads as a small visual rhythm without anyone chip dominating.
function chipStyle(i: number): string {
  switch (i % 3) {
    case 0:
      return 'bg-calm-emerald-bg/70 text-calm-emerald ring-calm-emerald/20';
    case 1:
      return 'bg-calm-violet-bg/70 text-calm-violet ring-calm-violet/20';
    default:
      return 'bg-calm-amber-bg/70 text-calm-amber ring-calm-amber/20';
  }
}
