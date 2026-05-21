import { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { PulseBrief } from '../components/PulseBrief';
import { CompactMasthead } from '../components/CompactMasthead';
import { Portfolio } from './Portfolio';
import { Watchlist } from './Watchlist';

type BookView = 'Holdings' | 'Watchlist';

const VIEWS: BookView[] = ['Holdings', 'Watchlist'];

export function Book() {
  const [view, setView] = useState<BookView>('Holdings');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-9"
    >
      <CompactMasthead
        section={view === 'Holdings' ? 'Book' : 'Watchlist'}
        chips={view === 'Holdings'
          ? ['Risk-off feel', 'Autos lag', 'IT support']
          : ['New movers', 'No-news drift', 'Volume watch']}
      />
      <PulseBrief tabKey="Book" />

      <header>
        <p className="label-mute">Book</p>
        <h1 className="h-display text-[26px] font-semibold mt-1.5">Holdings &amp; watchlist</h1>
        <p className="text-[12.5px] text-charcoal-mute mt-1.5">
          Movers, impact drivers, and opportunity/risk signals across what you own and what you watch.
        </p>

        <div className="mt-4 inline-flex items-center gap-1 p-1 rounded-full bg-cream border border-bordersoft shadow-soft">
          {VIEWS.map((v) => {
            const isActive = v === view;
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-full text-[12px] transition whitespace-nowrap',
                  isActive
                    ? 'bg-gradient-to-b from-calm-emerald-bg to-[#D9F1E6] text-calm-emerald font-semibold ring-1 ring-calm-emerald/15 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_2px_6px_-2px_rgba(15,143,111,0.25)]'
                    : 'text-charcoal-mute hover:text-charcoal-soft'
                )}
              >
                {v}
              </button>
            );
          })}
        </div>
      </header>

      {view === 'Holdings' ? <Portfolio hideBrief /> : <Watchlist hideBrief />}
    </motion.div>
  );
}
