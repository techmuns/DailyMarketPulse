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

// Per-section data-source signal. Reports whether the build is in live
// mode (VITE_DATA_MODE=live baked in at build time), whether the live
// feed loaded, and whether the requested kind has any overlay items.
// Used by DataSourceChip on each section header.

export const LIVE_MODE = import.meta.env.VITE_DATA_MODE === 'live';
const FRESH_MS = 4 * 60 * 60 * 1000;

export type DataSourceState =
  | { kind: 'mock' }                                  // build is in mock mode
  | { kind: 'unavailable' }                           // live mode, feed missing
  | { kind: 'live'; live: number; ageMs: number }     // fresh feed, N overlay items
  | { kind: 'delayed'; live: number; ageMs: number }; // feed >4h old

export function useDataSource(section: LiveKind): DataSourceState {
  const { data } = useLive();
  if (!LIVE_MODE) return { kind: 'mock' };
  if (!data) return { kind: 'unavailable' };
  const list = data[section] ?? [];
  if (list.length === 0) return { kind: 'unavailable' };
  const t = Date.parse(data.fetchedAt);
  if (Number.isNaN(t)) return { kind: 'unavailable' };
  const ageMs = Date.now() - t;
  return { kind: ageMs <= FRESH_MS ? 'live' : 'delayed', live: list.length, ageMs };
}

function formatAge(ageMs: number): string {
  const mins = Math.max(0, Math.floor(ageMs / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function DataSourceChip({ section }: { section: LiveKind }) {
  const s = useDataSource(section);
  const base =
    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] tracking-[0.18em] uppercase font-semibold shrink-0';
  if (s.kind === 'live') {
    return (
      <span
        className={`${base} bg-calm-emerald-bg/70 ring-1 ring-calm-emerald/25 text-calm-emerald`}
        title={`${s.live} live values · ${formatAge(s.ageMs)}`}
      >
        <span className="relative inline-flex w-1.5 h-1.5">
          <span className="absolute inset-0 rounded-full bg-calm-emerald opacity-60 animate-ping" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-calm-emerald" />
        </span>
        Live · {s.live}
      </span>
    );
  }
  if (s.kind === 'delayed') {
    return (
      <span
        className={`${base} bg-calm-amber-bg ring-1 ring-calm-amber/30 text-calm-amber`}
        title={`${s.live} values · ${formatAge(s.ageMs)} (stale)`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-calm-amber" />
        Delayed · {s.live}
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-cream-deep ring-1 ring-bordersoft text-charcoal-mute`}
      title={s.kind === 'mock' ? 'Build has no VITE_DATA_MODE=live — using bundled mock numbers' : 'Live mode enabled but feed did not load for this section'}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-charcoal-mute/60" />
      {s.kind === 'mock' ? 'Mock' : 'Unavailable'}
    </span>
  );
}
