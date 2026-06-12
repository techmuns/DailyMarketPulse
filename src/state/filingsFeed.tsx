// Real filings overlay — fetches public/data/filings.json (produced by
// scripts/fetch-filings.mjs from BSE India's announcements API) once at
// boot. Falls back to bundled demo filings when missing/empty. Mirrors
// newsFeed.tsx.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Filing } from '../types';

interface FilingsCtx {
  items: Filing[] | null;
  fetchedAt: string | null;
  loading: boolean;
  error: string | null;
}

const Ctx = createContext<FilingsCtx>({ items: null, fetchedAt: null, loading: true, error: null });

export function FilingsFeedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Filing[] | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/data/filings.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        if (j && Array.isArray(j.items) && j.items.length > 0) {
          setItems(j.items as Filing[]);
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

export function useFilingsFeed(): FilingsCtx {
  return useContext(Ctx);
}
