// On-demand quote lookup for user-added holdings. Calls the Cloudflare
// Worker /api/quote endpoint (which proxies Yahoo Finance server-side
// and edge-caches for 5 minutes), returns current price + 1D/5D/1M
// trend + 7-point spark.
//
// In-memory cache keyed by ticker, so re-renders don't re-fetch. A
// new mount of useQuote(ticker) hits the cache instantly; pass
// `refresh: true` to force a network call.

import { useEffect, useState } from 'react';
import type { Trend } from '../types';

export interface QuoteResult {
  ticker: string;
  current: number;
  trend: Trend;
  fetchedAt: string;
}

export interface QuoteState {
  loading: boolean;
  data: QuoteResult | null;
  error: string | null;
}

const cache = new Map<string, QuoteResult>();
const inflight = new Map<string, Promise<QuoteResult>>();

export function useQuote(ticker: string | null | undefined): QuoteState {
  const t = (ticker ?? '').trim().toUpperCase();
  const [state, setState] = useState<QuoteState>(() =>
    t && cache.has(t)
      ? { loading: false, data: cache.get(t)!, error: null }
      : { loading: !!t, data: null, error: null },
  );

  useEffect(() => {
    if (!t) {
      setState({ loading: false, data: null, error: null });
      return;
    }
    const cached = cache.get(t);
    if (cached) {
      setState({ loading: false, data: cached, error: null });
      return;
    }
    let alive = true;
    setState({ loading: true, data: null, error: null });
    fetchQuote(t)
      .then((q) => {
        if (alive) setState({ loading: false, data: q, error: null });
      })
      .catch((e: unknown) => {
        if (alive) setState({ loading: false, data: null, error: String(e) });
      });
    return () => {
      alive = false;
    };
  }, [t]);

  return state;
}

export async function fetchQuote(ticker: string): Promise<QuoteResult> {
  const key = ticker.toUpperCase();
  if (cache.has(key)) return cache.get(key)!;
  const existing = inflight.get(key);
  if (existing) return existing;

  const p = (async () => {
    const r = await fetch(`/api/quote?ticker=${encodeURIComponent(key)}`);
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      throw new Error(`/api/quote ${r.status}: ${body.slice(0, 120)}`);
    }
    const j = (await r.json()) as { ok: boolean; ticker: string; current: number; trend: Trend; fetchedAt: string; reason?: string };
    if (!j.ok) throw new Error(j.reason ?? 'unknown error');
    const out: QuoteResult = {
      ticker: j.ticker,
      current: j.current,
      trend: j.trend,
      fetchedAt: j.fetchedAt,
    };
    cache.set(key, out);
    return out;
  })();

  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}
