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
    <div className="flex items-center gap-2 flex-wrap">
      <span className="label-mute">Priority Lens</span>
      <div className="flex items-center gap-1 bg-white border border-bordersoft rounded-xl p-1">
        {LENSES.map((l) => {
          const active = lens === l;
          return (
            <button
              key={l}
              onClick={() => setLens(l)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-[12.5px] transition',
                active
                  ? 'bg-calm-navy text-white shadow-soft'
                  : 'text-charcoal-soft hover:text-charcoal hover:bg-ivory-100'
              )}
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
