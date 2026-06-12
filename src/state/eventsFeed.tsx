// Real events overlay — fetches public/data/events.json (produced by
// scripts/fetch-events.mjs) once at boot. Falls back to bundled mock
// events when the file is missing or empty. Mirrors newsFeed.tsx.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { EventItem } from '../types';

export interface EventsFeedPayload {
  fetchedAt: string;
  source: string;
  items: EventItem[];
}

interface EventsCtx {
  items: EventItem[] | null;
  fetchedAt: string | null;
  loading: boolean;
  error: string | null;
}

const Ctx = createContext<EventsCtx>({ items: null, fetchedAt: null, loading: true, error: null });

export function EventsFeedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<EventItem[] | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/data/events.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        if (j && Array.isArray(j.items) && j.items.length > 0) {
          setItems(j.items as EventItem[]);
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

  const value = useMemo(
    () => ({ items, fetchedAt, loading, error }),
    [items, fetchedAt, loading, error]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEventsFeed(): EventsCtx {
  return useContext(Ctx);
}
