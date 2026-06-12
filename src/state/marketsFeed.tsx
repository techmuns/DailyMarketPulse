// Real Markets-internals overlay — fetches public/data/markets.json
// (produced by scripts/fetch-markets.mjs) once at boot. Each section
// (sectors / breadth / movers) falls back independently to bundled mock
// when missing or empty. Mirrors newsFeed.tsx / eventsFeed.tsx.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { SectorMove } from '../types';
import type { MoverItem } from '../data/markets';

export interface Breadth {
  advancers: number;
  decliners: number;
  unchanged: number;
  newHighs: number;
  newLows: number;
  aboveSMA50: number;
  aboveSMA200: number;
}

interface MarketsCtx {
  sectors: SectorMove[] | null;
  breadth: Breadth | null;
  gainers: MoverItem[] | null;
  losers: MoverItem[] | null;
  unusualVolume: MoverItem[] | null;
  fetchedAt: string | null;
  loading: boolean;
  error: string | null;
}

const EMPTY: MarketsCtx = {
  sectors: null, breadth: null, gainers: null, losers: null,
  unusualVolume: null, fetchedAt: null, loading: true, error: null,
};

const Ctx = createContext<MarketsCtx>(EMPTY);

const nonEmpty = <T,>(a: unknown): T[] | null =>
  Array.isArray(a) && a.length > 0 ? (a as T[]) : null;

export function MarketsFeedProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MarketsCtx>(EMPTY);

  useEffect(() => {
    let alive = true;
    fetch('/data/markets.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive || !j) return;
        setState({
          sectors: nonEmpty<SectorMove>(j.sectors),
          breadth: j.breadth && typeof j.breadth.advancers === 'number' ? (j.breadth as Breadth) : null,
          gainers: nonEmpty<MoverItem>(j.gainers),
          losers: nonEmpty<MoverItem>(j.losers),
          unusualVolume: nonEmpty<MoverItem>(j.unusualVolume),
          fetchedAt: typeof j.fetchedAt === 'string' ? j.fetchedAt : null,
          loading: false,
          error: null,
        });
      })
      .catch((e) => {
        if (alive) setState((s) => ({ ...s, error: String(e) }));
      })
      .finally(() => {
        if (alive) setState((s) => ({ ...s, loading: false }));
      });
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMarketsFeed(): MarketsCtx {
  return useContext(Ctx);
}
