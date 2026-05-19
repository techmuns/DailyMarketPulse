import clsx from 'clsx';
import type { PriorityLens } from '../types';
import { useStore } from '../state/store';

const LENSES: PriorityLens[] = [
  'Portfolio First',
  'Macro First',
  'Markets First',
  'News First',
  'Watchlist First',
  'Custom',
];

export function PriorityLensSelector() {
  const { lens, setLens } = useStore();
  return (
    <div className="flex items-center gap-2.5">
      <span className="label-mute hidden sm:inline">Lens</span>
      <div className="inline-flex items-center gap-0.5 bg-cream-deep border border-bordersoft rounded-full p-0.5 shadow-soft">
        {LENSES.map((l) => {
          const active = lens === l;
          const short = l.replace(' First', '');
          return (
            <button
              key={l}
              onClick={() => setLens(l)}
              className={clsx(
                'px-2.5 py-1 rounded-full text-[11.5px] transition-all duration-200',
                active
                  ? 'bg-charcoal text-cream shadow-soft'
                  : 'text-charcoal-mute hover:text-charcoal-soft'
              )}
            >
              {short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
