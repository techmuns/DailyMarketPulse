import clsx from 'clsx';
import { motion } from 'framer-motion';
import logoUrl from '../assets/logos/munshot-logo-w.png';

export type TabKey =
  | 'Today'
  | 'Macro'
  | 'Markets'
  | 'Currency'
  | 'Commodities'
  | 'News & Filings'
  | 'Portfolio'
  | 'Watchlist'
  | 'Events'
  | 'Actions';

const TABS: TabKey[] = [
  'Today',
  'Macro',
  'Markets',
  'Currency',
  'Commodities',
  'News & Filings',
  'Portfolio',
  'Watchlist',
  'Events',
  'Actions',
];

interface Props {
  active: TabKey;
  onChange: (t: TabKey) => void;
}

/**
 * Munshot M-mark — gold M on a soft tile.
 */
export function MunshotMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      className={clsx(
        'shrink-0 inline-flex items-center justify-center',
        className
      )}
      style={{ width: size, height: size }}
      aria-label="Munshot"
    >
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        className="block w-full h-full object-contain select-none pointer-events-none"
        style={{ mixBlendMode: 'multiply' }}
        draggable={false}
      />
    </span>
  );
}

export function TopNav({ active, onChange }: Props) {
  return (
    <div className="sticky top-0 z-30 pt-3 sm:pt-4 px-3 sm:px-6 pb-2 bg-gradient-to-b from-ivory-50/90 via-ivory-50/70 to-transparent backdrop-blur-sm">
      <nav
        className="
          mx-auto max-w-[1280px]
          flex items-center justify-between gap-4
          h-[68px] pl-3 pr-4 sm:pl-4 sm:pr-5
          rounded-full
          bg-cream/75 backdrop-blur-xl
          border border-white/70
          ring-1 ring-bordersoft/60
          shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_10px_30px_-12px_rgba(76,55,120,0.18),0_4px_14px_-6px_rgba(76,55,120,0.10)]
        "
      >
        <div className="flex items-center gap-2.5 shrink-0 pl-1">
          <MunshotMark size={36} />
          <div className="leading-none">
            <div className="font-masthead text-[14px] font-bold tracking-tight">Daily Market Pulse</div>
            <div className="text-[9.5px] text-charcoal-mute mt-1 tracking-[0.22em] uppercase font-semibold">By Munshot</div>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-center overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-0.5 relative">
            {TABS.map((t) => {
              const isActive = t === active;
              return (
                <button
                  key={t}
                  onClick={() => onChange(t)}
                  className={clsx(
                    'relative px-3 py-1.5 rounded-full text-[12.5px] transition whitespace-nowrap',
                    isActive
                      ? 'text-calm-emerald font-semibold'
                      : 'text-charcoal-mute hover:text-charcoal-soft'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navpill"
                      className="absolute inset-0 rounded-full bg-gradient-to-b from-calm-emerald-bg to-[#D9F1E6] ring-1 ring-calm-emerald/15 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_2px_6px_-2px_rgba(15,143,111,0.25)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{t}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="chip bg-calm-emerald-bg text-calm-emerald">
            <span className="w-1.5 h-1.5 rounded-full bg-calm-emerald inline-block" />
            Live · mock
          </span>
        </div>
      </nav>
    </div>
  );
}
