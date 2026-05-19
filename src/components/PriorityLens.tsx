import clsx from 'clsx';
import type { PriorityLens } from '../types';
import { useStore } from '../state/store';

const LENSES: PriorityLens[] = ['Global', 'Sectoral', 'Portfolio Related', 'Custom'];

export function PriorityLensSelector() {
  const { lens, setLens } = useStore();
  return (
    <div className="flex items-center gap-2.5">
      <span className="label-mute hidden sm:inline">Lens</span>
      <div
        role="tablist"
        aria-label="Priority lens"
        className="inline-flex items-center gap-0.5 bg-ivory-100/80 border border-bordersoft rounded-full p-0.5 shadow-soft"
      >
        {LENSES.map((l) => {
          const active = lens === l;
          return (
            <button
              key={l}
              role="tab"
              aria-selected={active}
              onClick={() => setLens(l)}
              className={clsx(
                'px-3 py-1 rounded-full text-[11.5px] transition-all duration-200 whitespace-nowrap',
                active
                  ? 'bg-gradient-to-b from-calm-emerald to-[#0C7A5E] text-white font-semibold shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_2px_6px_-2px_rgba(15,143,111,0.45)]'
                  : 'text-charcoal-mute hover:text-charcoal-soft'
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
