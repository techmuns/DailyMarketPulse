// Real macro overlay — fetches public/data/macro.json (produced by
// scripts/fetch-macro.mjs) and merges current/trend onto src/data/macro
// by id. Only indicators with a free real source are present; the rest
// fall through to the bundled demo values. Mirrors the other feeds.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { MacroIndicator, Trend } from '../types';

export interface MacroOverlayItem {
  id: string;
  current: number | string;
  unit?: string;
  asOf?: string;
  trend: Trend;
}

interface MacroCtx {
  items: MacroOverlayItem[] | null;
  fetchedAt: string | null;
  loading: boolean;
  error: string | null;
}

const Ctx = createContext<MacroCtx>({ items: null, fetchedAt: null, loading: true, error: null });

export function MacroFeedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MacroOverlayItem[] | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/data/macro.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        if (j && Array.isArray(j.items) && j.items.length > 0) {
          setItems(j.items as MacroOverlayItem[]);
          setFetchedAt(typeof j.fetchedAt === 'string' ? j.fetchedAt : null);
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

  const value = useMemo(() => ({ items, fetchedAt, loading, error }), [items, fetchedAt, loading, error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMacroFeed(): MacroCtx {
  return useContext(Ctx);
}

/** Overlay real macro values onto the mock array by id; unmatched rows pass through. */
export function useMacroOverlay(mock: MacroIndicator[]): MacroIndicator[] {
  const { items } = useMacroFeed();
  return useMemo(() => {
    if (!items) return mock;
    const byId = new Map(items.map((i) => [i.id, i]));
    return mock.map((m) => {
      const live = byId.get(m.id);
      return live ? { ...m, current: live.current, trend: live.trend } : m;
    });
  }, [mock, items]);
}
