// Real news overlay — fetches public/data/news.json (produced by the
// GitHub Action running scripts/fetch-news.mjs) once at boot. When the
// file is missing or empty the UI falls back to the bundled mock news,
// exactly like the live-price overlay falls back in liveData.tsx.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { NewsItem } from '../types';

export interface NewsFeedPayload {
  fetchedAt: string;
  source: string;
  items: NewsItem[];
}

interface NewsCtx {
  items: NewsItem[] | null;
  fetchedAt: string | null;
  loading: boolean;
  error: string | null;
}

const Ctx = createContext<NewsCtx>({ items: null, fetchedAt: null, loading: true, error: null });

export function NewsFeedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/data/news.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        if (j && Array.isArray(j.items) && j.items.length > 0) {
          setItems(j.items as NewsItem[]);
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

export function useNewsFeed(): NewsCtx {
  return useContext(Ctx);
}
