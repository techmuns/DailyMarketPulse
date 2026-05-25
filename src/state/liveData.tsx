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
  sectors?: LiveItem[];
  macro?: LiveItem[];
}

export type LiveKind = 'indices' | 'currencies' | 'commodities' | 'holdings' | 'sectors' | 'macro';

// MoneyControl-sourced supplementary feed: news headlines, NSE
// gainers/losers, FII/DII flows. Populated by scripts/fetch-moneycontrol.mjs
// and committed as public/data/moneycontrol.json by the
// refresh-moneycontrol GitHub workflow. Any of the fields can be null
// independently — frontend treats each section as optional.

export interface MoneyControlNewsItem {
  title: string;
  url: string;
  publishedAt: string | null;
}

export interface MoneyControlMover {
  name: string;
  price: number | null;
  changePct: number | null;
}

export interface MoneyControlFiiDii {
  date: string;
  fii: { buy: number | null; sell: number | null; net: number | null };
  dii: { buy: number | null; sell: number | null; net: number | null };
}

export interface MoneyControlPayload {
  fetchedAt: string;
  news: MoneyControlNewsItem[] | null;
  gainers: MoneyControlMover[] | null;
  losers: MoneyControlMover[] | null;
  fiiDii: MoneyControlFiiDii | null;
}

interface LiveCtx {
  data: LivePayload | null;
  mc: MoneyControlPayload | null;
  loading: boolean;
  error: string | null;
}

// NSE regular trading session: Mon–Fri, 09:15–15:30 IST. While the
// market is open we poll the Worker /api/quote proxy for live intraday
// prices; while it's closed we rely on the twice-daily live.json
// snapshot produced by the refresh-data workflow.
const MARKET_TZ = 'Asia/Kolkata';
const OPEN_POLL_MS = 5 * 60 * 1000; // aligns with the Worker quote cache TTL
const CLOSED_POLL_MS = 30 * 60 * 1000;

function isIndianMarketOpen(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: MARKET_TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  if (!['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(get('weekday'))) return false;
  const minutes = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
  return minutes >= 9 * 60 + 15 && minutes <= 15 * 60 + 30;
}

const OVERLAY_KINDS: LiveKind[] = ['indices', 'currencies', 'commodities', 'holdings', 'sectors', 'macro'];

// Fetch fresh per-ticker quotes from the Worker proxy. Any ticker that
// fails is simply omitted so the caller keeps its live.json baseline.
async function fetchLiveQuotes(items: LiveItem[]): Promise<Map<string, { current: number; trend: Trend }>> {
  const out = new Map<string, { current: number; trend: Trend }>();
  await Promise.all(
    items.map(async (it) => {
      if (!it.ticker) return;
      try {
        const r = await fetch(`/api/quote?ticker=${encodeURIComponent(it.ticker)}`, { cache: 'no-cache' });
        if (!r.ok) return;
        const j = await r.json();
        if (j && j.ok === true && typeof j.current === 'number' && j.trend) {
          out.set(it.id, { current: j.current, trend: j.trend as Trend });
        }
      } catch {
        // Leave this id on its live.json baseline value.
      }
    }),
  );
  return out;
}

async function overlayLiveQuotes(payload: LivePayload): Promise<LivePayload> {
  const items: LiveItem[] = [];
  for (const kind of OVERLAY_KINDS) {
    const list = payload[kind];
    if (Array.isArray(list)) items.push(...list);
  }
  const quotes = await fetchLiveQuotes(items);
  if (quotes.size === 0) return payload;
  const apply = (list?: LiveItem[]) =>
    list?.map((i) => {
      const q = quotes.get(i.id);
      return q ? { ...i, current: q.current, trend: q.trend } : i;
    });
  return {
    ...payload,
    fetchedAt: new Date().toISOString(),
    indices: apply(payload.indices) ?? payload.indices,
    currencies: apply(payload.currencies) ?? payload.currencies,
    commodities: apply(payload.commodities) ?? payload.commodities,
    holdings: apply(payload.holdings) ?? payload.holdings,
    sectors: apply(payload.sectors),
    macro: apply(payload.macro),
  };
}

const Ctx = createContext<LiveCtx>({ data: null, mc: null, loading: true, error: null });

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LivePayload | null>(null);
  const [mc, setMc] = useState<MoneyControlPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastLoad = 0;

    async function load() {
      lastLoad = Date.now();
      const [liveRes, mcRes] = await Promise.allSettled([
        fetch('/data/live.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)),
        fetch('/data/moneycontrol.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)),
      ]);

      let base: LivePayload | null = null;
      if (liveRes.status === 'fulfilled' && liveRes.value && typeof liveRes.value.fetchedAt === 'string') {
        base = liveRes.value as LivePayload;
      } else if (liveRes.status === 'rejected' && alive) {
        setError(String(liveRes.reason));
      }

      // Phase 1 — paint the twice-daily snapshot immediately.
      if (alive) {
        if (base) setData(base);
        if (mcRes.status === 'fulfilled' && mcRes.value && typeof mcRes.value.fetchedAt === 'string') {
          setMc(mcRes.value as MoneyControlPayload);
        }
        setLoading(false);
      }

      // Phase 2 — overlay the freshest quotes from the Worker proxy so the
      // card reflects the latest close (or live intraday prices while the
      // market is open) instead of the last committed snapshot. Market
      // hours only govern poll cadence (see schedule), not whether we
      // refresh, so a stale live.json never strands the card on old data.
      if (alive && base && LIVE_MODE) {
        const live = await overlayLiveQuotes(base);
        if (alive) setData(live);
      }
    }

    function schedule() {
      const delay = isIndianMarketOpen() ? OPEN_POLL_MS : CLOSED_POLL_MS;
      timer = setTimeout(() => {
        load().finally(() => {
          if (alive) schedule();
        });
      }, delay);
    }

    function refetchOnReturn() {
      if (document.visibilityState === 'visible' && Date.now() - lastLoad > 60_000) load();
    }

    load().finally(() => {
      if (alive) schedule();
    });
    document.addEventListener('visibilitychange', refetchOnReturn);
    window.addEventListener('focus', refetchOnReturn);

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', refetchOnReturn);
      window.removeEventListener('focus', refetchOnReturn);
    };
  }, []);

  const value = useMemo(() => ({ data, mc, loading, error }), [data, mc, loading, error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLive(): LiveCtx {
  return useContext(Ctx);
}

export function useMoneyControl(): MoneyControlPayload | null {
  return useContext(Ctx).mc;
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

// MoneyControl-driven hooks for movers + FII/DII flows.
//
// useLiveMovers(kind) returns live gainers/losers from moneycontrol
// when the build is in live mode and the feed loaded. Returns null in
// every other case — callers fall back to bundled mock data.

export type MoverKind = 'gainers' | 'losers';

export interface LiveMoversState {
  kind: 'mock' | 'unavailable' | 'live' | 'delayed';
  items: MoneyControlMover[];
  ageMs: number | null;
}

export function useLiveMovers(which: MoverKind): LiveMoversState {
  const mc = useMoneyControl();
  return useMemo(() => {
    if (!LIVE_MODE) return { kind: 'mock', items: [], ageMs: null };
    if (!mc) return { kind: 'unavailable', items: [], ageMs: null };
    const list = mc[which] ?? [];
    if (list.length === 0) return { kind: 'unavailable', items: [], ageMs: null };
    const t = Date.parse(mc.fetchedAt);
    const ageMs = Number.isNaN(t) ? null : Date.now() - t;
    const fresh = ageMs == null ? true : ageMs <= FRESH_MS;
    return { kind: fresh ? 'live' : 'delayed', items: list, ageMs };
  }, [mc, which]);
}

export interface LiveFiiDiiState {
  kind: 'mock' | 'unavailable' | 'live' | 'delayed';
  data: MoneyControlFiiDii | null;
  ageMs: number | null;
}

export function useLiveFiiDii(): LiveFiiDiiState {
  const mc = useMoneyControl();
  return useMemo(() => {
    if (!LIVE_MODE) return { kind: 'mock', data: null, ageMs: null };
    if (!mc || !mc.fiiDii) return { kind: 'unavailable', data: null, ageMs: null };
    const t = Date.parse(mc.fetchedAt);
    const ageMs = Number.isNaN(t) ? null : Date.now() - t;
    const fresh = ageMs == null ? true : ageMs <= FRESH_MS;
    return { kind: fresh ? 'live' : 'delayed', data: mc.fiiDii, ageMs };
  }, [mc]);
}

function formatAge(ageMs: number): string {
  const mins = Math.max(0, Math.floor(ageMs / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ---------- Live headlines (MoneyControl news feed) ----------
//
// useLiveHeadlines(filter?) returns a filtered slice of moneycontrol news
// plus a freshness state matching the DataSource model.
// The `filter` predicate runs on the headline title (case-insensitive
// substring match against any keyword in the array).

export interface LiveHeadlineState {
  kind: 'mock' | 'unavailable' | 'live' | 'delayed';
  items: MoneyControlNewsItem[];
  total: number;
  ageMs: number | null;
}

export function useLiveHeadlines(keywords?: string[]): LiveHeadlineState {
  const mc = useMoneyControl();
  return useMemo(() => {
    if (!LIVE_MODE) return { kind: 'mock', items: [], total: 0, ageMs: null };
    if (!mc || !mc.news || mc.news.length === 0) {
      return { kind: 'unavailable', items: [], total: 0, ageMs: null };
    }
    const all = mc.news;
    const items = keywords && keywords.length > 0
      ? all.filter((n) => {
          const t = n.title.toLowerCase();
          return keywords.some((k) => t.includes(k.toLowerCase()));
        })
      : all;
    const t = Date.parse(mc.fetchedAt);
    const ageMs = Number.isNaN(t) ? null : Date.now() - t;
    const fresh = ageMs == null ? true : ageMs <= FRESH_MS;
    return {
      kind: fresh ? 'live' : 'delayed',
      items,
      total: all.length,
      ageMs,
    };
  }, [mc, keywords?.join('|')]);
}

// Reusable chip used by headline sections (and any list where the
// underlying source is moneycontrol news).
export function LiveHeadlinesChip({ state }: { state: LiveHeadlineState }) {
  const base =
    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] tracking-[0.18em] uppercase font-semibold shrink-0';
  if (state.kind === 'live') {
    return (
      <span
        className={`${base} bg-calm-emerald-bg/70 ring-1 ring-calm-emerald/25 text-calm-emerald`}
        title={`${state.items.length} of ${state.total} live headlines · ${state.ageMs == null ? '' : formatAge(state.ageMs)}`}
      >
        <span className="relative inline-flex w-1.5 h-1.5">
          <span className="absolute inset-0 rounded-full bg-calm-emerald opacity-60 animate-ping" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-calm-emerald" />
        </span>
        Live · {state.items.length}
      </span>
    );
  }
  if (state.kind === 'delayed') {
    return (
      <span
        className={`${base} bg-calm-amber-bg ring-1 ring-calm-amber/30 text-calm-amber`}
        title={`${state.items.length} headlines · ${state.ageMs == null ? '' : formatAge(state.ageMs)} (stale)`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-calm-amber" />
        Delayed · {state.items.length}
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-cream-deep ring-1 ring-bordersoft text-charcoal-mute`}
      title={state.kind === 'mock' ? 'Build has no VITE_DATA_MODE=live — using bundled mock narratives' : 'Live mode enabled but moneycontrol feed did not load'}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-charcoal-mute/60" />
      {state.kind === 'mock' ? 'Curated · mock' : 'Headlines unavailable'}
    </span>
  );
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
