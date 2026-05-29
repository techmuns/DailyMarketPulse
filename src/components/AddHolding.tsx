import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// One result row from the MUNS stock search API. The API returns each
// match keyed by symbol with a [country, name, sector] tuple.
interface StockResult {
  symbol: string;
  country: string;
  name: string;
  sector: string;
}

interface SearchResponse {
  data?: {
    total_results?: number;
    results?: Record<string, [string, string, string]>;
  };
  message?: string;
  success?: boolean;
}

function toResults(json: SearchResponse): StockResult[] {
  const raw = json?.data?.results ?? {};
  return Object.entries(raw).map(([symbol, [country, name, sector]]) => ({
    symbol,
    country,
    name,
    sector,
  }));
}

export function AddHolding() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-bordersoft bg-cream px-3 py-1.5 text-[12.5px] font-medium text-charcoal-soft shadow-soft transition hover:bg-ivory-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add holding
      </button>
      {/* Mounting the modal only while open keeps its state fresh on each
          open without resetting via an effect. */}
      <AnimatePresence>{open && <AddHoldingModal onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function AddHoldingModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input on mount and close on Escape.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Debounced search against the Worker proxy. user_index is fixed at
  // 124 server-side, so the client only sends the query. An empty query
  // is cleared in the change handler, so this effect only fetches.
  useEffect(() => {
    const q = query.trim();
    if (!q) return;

    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/stock/search', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ query: q }),
          signal: controller.signal,
        });
        if (!res.ok) {
          setError('Search is unavailable right now.');
          setResults([]);
          setTotal(null);
          return;
        }
        const json: SearchResponse = await res.json();
        if (json.success === false) {
          setError(json.message || 'Search failed.');
          setResults([]);
          setTotal(null);
          return;
        }
        setResults(toResults(json));
        setTotal(json?.data?.total_results ?? null);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError('Could not reach search.');
        setResults([]);
        setTotal(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [query]);

  const onChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      setTotal(null);
      setError(null);
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-charcoal/25 backdrop-blur-[3px] z-40"
        onClick={onClose}
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="fixed left-1/2 top-[12vh] z-50 w-[520px] max-w-[94vw] -translate-x-1/2 rounded-2xl border border-bordersoft bg-cream shadow-lift"
      >
        <div className="flex items-start justify-between gap-3 border-b border-bordersoft px-5 py-4">
          <div>
            <p className="label-mute">Portfolio</p>
            <h2 className="h-display text-[17px] font-semibold mt-1">Add holding</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-charcoal-mute transition hover:bg-ivory-100 hover:text-charcoal-soft"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="flex items-center gap-2 rounded-xl border border-bordersoft bg-ivory-100 px-3 py-2 focus-within:border-calm-violet">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-charcoal-mute">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Search a stock, e.g. RELI"
              className="w-full bg-transparent text-[13.5px] text-charcoal placeholder:text-charcoal-mute outline-none"
            />
            {loading && <span className="text-[11px] text-charcoal-mute tabular-nums">Searching…</span>}
          </div>
        </div>

        <div className="max-h-[46vh] overflow-y-auto px-5 py-3">
          {error && <p className="px-1 py-6 text-center text-[12.5px] text-calm-rose">{error}</p>}

          {!error && total !== null && (
            <p className="px-1 pb-2 text-[11px] text-charcoal-mute">
              {total} {total === 1 ? 'match' : 'matches'}
            </p>
          )}

          {!error &&
            results.map((r) => (
              <div
                key={r.symbol}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-ivory-100"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-charcoal">{r.symbol}</span>
                    <span className="truncate text-[12px] text-charcoal-soft">{r.name}</span>
                  </div>
                  <div className="mt-0.5 text-[10.5px] text-charcoal-mute">{r.sector}</div>
                </div>
                <span className="shrink-0 rounded-md bg-cream-deep px-2 py-0.5 text-[10.5px] text-charcoal-mute">
                  {r.country}
                </span>
              </div>
            ))}

          {!error && !loading && query.trim() && results.length === 0 && (
            <p className="px-1 py-6 text-center text-[12.5px] text-charcoal-mute">No matches found.</p>
          )}

          {!error && !query.trim() && (
            <p className="px-1 py-6 text-center text-[12.5px] text-charcoal-mute">Start typing to search stocks.</p>
          )}
        </div>
      </motion.div>
    </>
  );
}
