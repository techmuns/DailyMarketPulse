import clsx from 'clsx';
import { motion } from 'framer-motion';

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

export function TopNav({ active, onChange }: Props) {
  return (
    <nav className="sticky top-0 z-30 bg-ivory-50/85 backdrop-blur-md border-b border-bordersoft">
      <div className="max-w-[1320px] mx-auto px-6 flex items-center justify-between gap-6 h-[60px]">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-calm-emerald grid place-items-center text-white text-[12px] font-semibold font-masthead">
            DP
          </div>
          <div className="leading-none">
            <div className="font-masthead text-[14px] font-bold tracking-tight">Daily Market Pulse</div>
            <div className="text-[9.5px] text-charcoal-mute mt-1 tracking-[0.22em] uppercase font-semibold">By Munshot</div>
          </div>
        </div>
        <div className="flex items-center overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-0.5 relative">
            {TABS.map((t) => {
              const isActive = t === active;
              return (
                <button
                  key={t}
                  onClick={() => onChange(t)}
                  className={clsx(
                    'relative px-3 py-1.5 rounded-full text-[12.5px] transition whitespace-nowrap',
                    isActive ? 'text-charcoal font-semibold' : 'text-charcoal-mute hover:text-charcoal-soft'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navpill"
                      className="absolute inset-0 bg-cream border border-bordersoft rounded-full shadow-soft"
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
      </div>
    </nav>
  );
}
