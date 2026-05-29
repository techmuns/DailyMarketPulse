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

// What the modal hands back to the Portfolio tab on "Add".
export interface NewHolding {
  ticker: string;
  displayName: string;
  sector: string;
  weight: number;
  thesis: string;
  country?: string;
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

export function AddHolding({ onAdd }: { onAdd: (h: NewHolding) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-calm-emerald px-3.5 py-2 text-[12px] font-semibold text-white shadow-soft transition hover:bg-[#0CA67F]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add holding
      </button>
      {/* Mounting only while open keeps form state fresh on each open. */}
      <AnimatePresence>
        {open && (
          <AddHoldingModal
            onClose={() => setOpen(false)}
            onAdd={(h) => {
              onAdd(h);
              setOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function AddHoldingModal({ onClose, onAdd }: { onClose: () => void; onAdd: (h: NewHolding) => void }) {
  // Form fields — the Ticker field doubles as the search box.
  const [ticker, setTicker] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [sector, setSector] = useState('');
  const [weight, setWeight] = useState('');
  const [thesis, setThesis] = useState('');
  const [country, setCountry] = useState<string | undefined>(undefined);

  // Search dropdown state.
  const [results, setResults] = useState<StockResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  // Set true right after a pick so the effect doesn't re-search the
  // value we just auto-filled into the ticker field.
  const justPicked = useRef(false);

  const tickerRef = useRef<HTMLInputElement>(null);

  // Focus the ticker field on mount and close on Escape.
  useEffect(() => {
    const t = setTimeout(() => tickerRef.current?.focus(), 60);
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
  // 124 server-side, so the client only sends the query.
  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    const q = ticker.trim();
    if (!q) return;

    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setShowResults(true);
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
          return;
        }
        const json: SearchResponse = await res.json();
        if (json.success === false) {
          setError(json.message || 'Search failed.');
          setResults([]);
          return;
        }
        setResults(toResults(json));
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError('Could not reach search.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [ticker]);

  const onTickerChange = (val: string) => {
    setTicker(val);
    if (!val.trim()) {
      setResults([]);
      setError(null);
      setLoading(false);
      setShowResults(false);
    }
  };

  // Picking a result autofills three columns: ticker, display name, sector.
  const pick = (r: StockResult) => {
    justPicked.current = true;
    setTicker(r.symbol);
    setDisplayName(r.name);
    setSector(r.sector);
    setCountry(r.country);
    setShowResults(false);
    setResults([]);
  };

  const canAdd = ticker.trim().length > 0;

  const submit = () => {
    if (!canAdd) return;
    const w = parseFloat(weight);
    onAdd({
      ticker: ticker.trim(),
      displayName: displayName.trim() || ticker.trim(),
      sector: sector.trim(),
      weight: Number.isFinite(w) ? w : 0,
      thesis: thesis.trim(),
      country,
    });
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
        className="fixed left-1/2 top-[8vh] z-50 flex max-h-[84vh] w-[520px] max-w-[94vw] -translate-x-1/2 flex-col rounded-2xl border border-bordersoft bg-cream shadow-lift"
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4">
          <div>
            <p className="label-mute">Portfolio</p>
            <h2 className="h-display text-[18px] font-semibold mt-1">Add holding</h2>
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

        <div className="overflow-y-auto px-6 pb-2 space-y-4">
          {/* Ticker — doubles as the search box. */}
          <div className="relative">
            <input
              ref={tickerRef}
              value={ticker}
              onChange={(e) => onTickerChange(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              placeholder="e.g. RELIANCE.NS, INFY.NS, TCS.NS, AAPL"
              autoComplete="off"
              className="w-full rounded-lg border border-calm-emerald bg-cream px-3.5 py-2.5 text-[13.5px] text-charcoal placeholder:text-charcoal-mute outline-none focus:ring-2 focus:ring-calm-emerald/20"
            />
            <p className="mt-1.5 text-[11px] text-charcoal-mute">
              Search a ticker — name &amp; sector autofill from market data.
            </p>

            {showResults && (ticker.trim() || loading) && (
              <div className="absolute left-0 right-0 top-[44px] z-10 max-h-[240px] overflow-y-auto rounded-xl border border-bordersoft bg-cream shadow-lift">
                {loading && <p className="px-3 py-3 text-[12px] text-charcoal-mute">Searching…</p>}
                {error && !loading && <p className="px-3 py-3 text-[12px] text-calm-rose">{error}</p>}
                {!loading && !error && results.length === 0 && ticker.trim() && (
                  <p className="px-3 py-3 text-[12px] text-charcoal-mute">No matches found.</p>
                )}
                {!error &&
                  results.map((r) => (
                    <button
                      key={r.symbol}
                      type="button"
                      onClick={() => pick(r)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-ivory-100"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12.5px] font-semibold text-charcoal">{r.symbol}</span>
                          <span className="truncate text-[12px] text-charcoal-soft">{r.name}</span>
                        </div>
                        <div className="mt-0.5 text-[10.5px] text-charcoal-mute">{r.sector}</div>
                      </div>
                      <span className="shrink-0 rounded-md bg-cream-deep px-2 py-0.5 text-[10.5px] text-charcoal-mute">
                        {r.country}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          <Field label="Display name" hint="Optional. Defaults to the ticker.">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-bordersoft bg-cream px-3.5 py-2.5 text-[13.5px] text-charcoal outline-none focus:border-calm-emerald"
            />
          </Field>

          <Field label="Sector" hint="Free text — e.g. IT Services, Banks, Autos.">
            <input
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full rounded-lg border border-bordersoft bg-cream px-3.5 py-2.5 text-[13.5px] text-charcoal outline-none focus:border-calm-emerald"
            />
          </Field>

          <Field label="Weight (%)" hint="Portfolio weight 0–100.">
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              type="number"
              min={0}
              max={100}
              step="0.1"
              className="w-full rounded-lg border border-bordersoft bg-cream px-3.5 py-2.5 text-[13.5px] text-charcoal outline-none focus:border-calm-emerald"
            />
          </Field>

          <Field label="Thesis" hint="Optional one-liner. Shown in the drawer.">
            <textarea
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              rows={2}
              className="w-full resize-y rounded-lg border border-bordersoft bg-cream px-3.5 py-2.5 text-[13.5px] text-charcoal outline-none focus:border-calm-emerald"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3.5 py-2 text-[12.5px] font-medium text-charcoal-soft transition hover:bg-ivory-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canAdd}
            className="inline-flex items-center gap-1.5 rounded-full bg-calm-emerald px-4 py-2 text-[12.5px] font-semibold text-white shadow-soft transition hover:bg-[#0CA67F] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </motion.div>
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-mute mb-1.5">{label}</div>
      {children}
      <p className="mt-1.5 text-[11px] text-charcoal-mute">{hint}</p>
    </div>
  );
}
