// Live data overlay — fetches the JSON produced by the GitHub Action
// once at boot and merges real prices / trends onto the existing mock
// data by id. Mock fields like signal / whyShown / impact / source are
// left untouched.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Trend } from '../types';

export interface LiveItem {
  id: string;
  ticker?: string;
  current: number;
  trend: Trend;
}

export interface LivePayload {
  fetchedAt: string;
  indices: LiveItem[];
  currencies: LiveItem[];
  commodities: LiveItem[];
  holdings: LiveItem[];
}

export type LiveKind = 'indices' | 'currencies' | 'commodities' | 'holdings';

interface LiveCtx {
  data: LivePayload | null;
  loading: boolean;
  error: string | null;
}

const Ctx = createContext<LiveCtx>({ data: null, loading: true, error: null });

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LivePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/data/live.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        if (j && typeof j.fetchedAt === 'string') {
          setData(j as LivePayload);
        }
      })
      .catch((e) => {
        if (alive) setError(String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => ({ data, loading, error }), [data, loading, error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLive(): LiveCtx {
  return useContext(Ctx);
}

export type DataState = 'live' | 'delayed' | 'mock' | 'unavailable';

// Freshness window. The refresh-data cron runs twice a day (01:30 and
// 13:30 UTC, ~12h apart), so a snapshot within ~13h belongs to the
// current cycle and reads as "live"; anything older means a refresh was
// missed, which we surface as "delayed" so the UI never overstates how
// current it is.
export const FRESH_MS = 13 * 60 * 60 * 1000;

// Explicit escape hatch for demos / screenshots: VITE_DATA_MODE=mock
// forces the bundled mock scaffold regardless of the fetched feed. Any
// other value (including unset) lets the real live.json drive the state.
const FORCE_MOCK = import.meta.env.VITE_DATA_MODE === 'mock';

// Single source of truth for live/mock status, derived purely from the
// fetched payload's timestamp. Shared by the Today chip, the sidebar
// badge and the footer so they can never disagree.
export function resolveDataState(fetchedAt: string | null): {
  state: DataState;
  ageMs: number | null;
} {
  if (FORCE_MOCK) return { state: 'mock', ageMs: null };
  if (!fetchedAt) return { state: 'unavailable', ageMs: null };
  const t = Date.parse(fetchedAt);
  if (Number.isNaN(t)) return { state: 'unavailable', ageMs: null };
  const ageMs = Date.now() - t;
  return { state: ageMs <= FRESH_MS ? 'live' : 'delayed', ageMs };
}

// Hook flavour that reads the live context and derives the current state.
export function useDataState(): {
  state: DataState;
  ageMs: number | null;
  fetchedAt: string | null;
} {
  const fetchedAt = useLive().data?.fetchedAt ?? null;
  return { ...resolveDataState(fetchedAt), fetchedAt };
}

/**
 * Overlay live `current` + `trend` values onto a mock array by id.
 * Items without a live match fall through unchanged.
 */
export function useLiveOverlay<T extends { id: string; current?: number | string; trend?: Trend }>(
  mock: T[],
  kind: LiveKind
): T[] {
  const { data } = useLive();
  return useMemo(() => {
    if (!data) return mock;
    const list = data[kind];
    if (!list || list.length === 0) return mock;
    const byId = new Map(list.map((l) => [l.id, l]));
    return mock.map((m) => {
      const live = byId.get(m.id);
      if (!live) return m;
      return { ...m, current: live.current, trend: live.trend };
    });
  }, [mock, kind, data]);
}

export function formatFreshness(iso?: string | null): string {
  if (!iso) return 'Mock data';
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return 'Mock data';
  const diff = Date.now() - t.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just refreshed';
  if (mins < 60) return `fresh ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `fresh ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `fresh ${days}d ago`;
}
