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
    <nav className="sticky top-0 z-30 bg-ivory-50/80 backdrop-blur-md border-b border-bordersoft">
      <div className="max-w-[1320px] mx-auto px-6 flex items-center justify-between gap-6 h-[60px]">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-charcoal grid place-items-center text-cream text-[12px] font-semibold font-display">
            DP
          </div>
          <div className="leading-none">
            <div className="h-display text-[14px] font-semibold">Daily Market Pulse</div>
            <div className="text-[10px] text-charcoal-mute mt-1 tracking-[0.15em] uppercase">Calm Alpha</div>
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
          <span className="chip bg-cream border border-bordersoft text-charcoal-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-calm-green inline-block" />
            Live · mock
          </span>
        </div>
      </div>
    </nav>
  );
}
