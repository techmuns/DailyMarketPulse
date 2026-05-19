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
    <nav className="sticky top-0 z-30 bg-ivory-50/85 backdrop-blur border-b border-bordersoft">
      <div className="max-w-[1320px] mx-auto px-6 flex items-center justify-between gap-6 h-16">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-calm-navy/90 grid place-items-center text-white text-[14px] font-semibold">
            DP
          </div>
          <div>
            <div className="font-display text-[15px] font-semibold text-charcoal leading-none">
              Daily Market Pulse
            </div>
            <div className="text-[11px] text-charcoal-mute mt-1 leading-none tracking-wide">Calm Alpha</div>
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
                    'relative px-3 py-1.5 rounded-lg text-[13.5px] transition whitespace-nowrap',
                    isActive ? 'text-charcoal font-semibold' : 'text-charcoal-mute hover:text-charcoal'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navpill"
                      className="absolute inset-0 bg-white border border-bordersoft rounded-lg shadow-soft"
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
          <span className="chip bg-calm-green-bg text-calm-green border border-calm-green/30">
            <span className="w-1.5 h-1.5 rounded-full bg-calm-green inline-block" />
            Live · mock
          </span>
        </div>
      </div>
    </nav>
  );
}
