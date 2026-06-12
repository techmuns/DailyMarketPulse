// Derive the spoken "Top 5 changes" from the live feed (largest 1D
// moves across indices, FX, commodities and the book). Falls back to the
// bundled demo list when live.json has not loaded. Feeds the Pulse
// Brief audio script.

import { useMemo } from 'react';
import { useLive } from '../state/liveData';
import type { Signal } from '../types';
import type { TopChange } from '../data/topChanges';
import { topChanges as mockTopChanges } from '../data/topChanges';
import { indices } from '../data/markets';
import { currencies } from '../data/currencies';
import { commodities } from '../data/commodities';
import { portfolio } from '../data/portfolio';
import { watchlist } from '../data/watchlist';

const NAME: Record<string, string> = {};
for (const arr of [indices, currencies, commodities, portfolio, watchlist]) {
  for (const x of arr) NAME[x.id] = x.title;
}

export function useTopChanges(): TopChange[] {
  const live = useLive().data;
  return useMemo(() => {
    if (!live) return mockTopChanges;
    const rows: { id: string; name: string; d1: number }[] = [];
    (['indices', 'currencies', 'commodities', 'holdings'] as const).forEach((k) => {
      for (const it of live[k] ?? []) rows.push({ id: it.id, name: NAME[it.id] ?? it.id, d1: it.trend?.d1 ?? 0 });
    });
    rows.sort((a, b) => Math.abs(b.d1) - Math.abs(a.d1));
    const top = rows.slice(0, 5);
    if (!top.length) return mockTopChanges;
    return top.map((r, i): TopChange => {
      const up = r.d1 > 0;
      const flat = Math.abs(r.d1) < 0.2;
      const good = r.id === 'i-vix' ? !up : up;
      const signal: Signal = flat ? 'monitor' : good ? 'support' : 'risk';
      return {
        rank: i + 1,
        headline: `${r.name} ${up ? 'rose' : 'fell'} ${Math.abs(r.d1).toFixed(2)} percent`,
        signal,
        affected: [r.name],
      };
    });
  }, [live]);
}
