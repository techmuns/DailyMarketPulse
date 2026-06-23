// Add / edit holding dialog. Used by both Portfolio and Watchlist tabs.
//
// On submit, validates the ticker by hitting /api/quote — gives instant
// feedback if the symbol doesn't resolve on Yahoo. Sector / weight /
// thesis are free-form and not validated against any list.

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchQuote } from '../state/quotes';
import type { UserHolding, HoldingPatch } from '../state/userBook';
import clsx from 'clsx';

// One match from the MUNS stock search API. The API returns each result
// keyed by symbol with a [country, name, sector] tuple.
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

// MUNS returns bare symbols (e.g. RELIANCE); Yahoo — used by the submit
// validation — expects an exchange suffix for Indian listings.
function toYahooSymbol(symbol: string, country: string): string {
  return country === 'India' ? `${symbol}.NS` : symbol;
}

export interface DialogInitial {
  ticker?: string;
  title?: string;
  sector?: string;
  weight?: number;
  thesis?: string;
}

interface Props {
  open: boolean;
  mode: 'add' | 'edit';
  surface: 'portfolio' | 'watchlist';
  initial?: DialogInitial;
  onClose: () => void;
  onSubmit: (data: Omit<UserHolding, 'id' | 'source' | 'addedAt'> | HoldingPatch) => void;
}

export function HoldingDialog({ open, mode, surface, initial, onClose, onSubmit }: Props) {
  const [ticker, setTicker] = useState(initial?.ticker ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [sector, setSector] = useState(initial?.sector ?? '');
  const [weight, setWeight] = useState<string>(initial?.weight != null ? String(initial.weight) : '');
  const [thesis, setThesis] = useState(initial?.thesis ?? '');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedPrice, setResolvedPrice] = useState<number | null>(null);

  // Ticker search dropdown state.
  const [results, setResults] = useState<StockResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  // Set right after a pick so the debounced effect doesn't re-search the
  // value we just auto-filled into the ticker field.
  const justPicked = useRef(false);

  // Reset when opened with new initial values.
  useEffect(() => {
    if (!open) return;
    setTicker(initial?.ticker ?? '');
    setTitle(initial?.title ?? '');
    setSector(initial?.sector ?? '');
    setWeight(initial?.weight != null ? String(initial.weight) : '');
    setThesis(initial?.thesis ?? '');
    setValidating(false);
    setError(null);
    setResolvedPrice(null);
    setResults([]);
    setSearching(false);
    setSearchError(null);
    setShowResults(false);
    justPicked.current = false;
  }, [open, initial]);

  // Debounced ticker search against the Worker proxy. user_index is fixed
  // server-side at 124, so the client only sends the query.
  useEffect(() => {
    if (!open) return;
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    const q = ticker.trim();
    if (!q) return;

    const controller = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      setShowResults(true);
      try {
        const res = await fetch('/api/stock/search', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ query: q }),
          signal: controller.signal,
        });
        if (!res.ok) {
          setSearchError('Search is unavailable right now.');
          setResults([]);
          return;
        }
        const json: SearchResponse = await res.json();
        if (json.success === false) {
          setSearchError(json.message || 'Search failed.');
          setResults([]);
          return;
        }
        setResults(toResults(json));
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setSearchError('Could not reach search.');
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [ticker, open]);

  function onTickerChange(val: string) {
    setTicker(val);
    if (!val.trim()) {
      setResults([]);
      setSearchError(null);
      setSearching(false);
      setShowResults(false);
    }
  }

  // Picking a result autofills ticker (with Yahoo suffix), display name,
  // and sector.
  function pickResult(r: StockResult) {
    justPicked.current = true;
    setTicker(toYahooSymbol(r.symbol, r.country));
    setTitle(r.name);
    setSector(r.sector);
    setShowResults(false);
    setResults([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedTicker = ticker.trim().toUpperCase();
    if (!trimmedTicker) return setError('Ticker is required.');
    if (!/^[A-Z0-9.^=&_-]+$/.test(trimmedTicker)) {
      return setError('Ticker should be a Yahoo symbol like RELIANCE.NS or TCS.NS.');
    }
    const w = weight === '' ? 0 : Number(weight);
    if (Number.isNaN(w) || w < 0 || w > 100) {
      return setError('Weight must be a number between 0 and 100.');
    }

    setValidating(true);
    try {
      const q = await fetchQuote(trimmedTicker);
      setResolvedPrice(q.current);
      onSubmit({
        ticker: trimmedTicker,
        title: title.trim() || trimmedTicker.split('.')[0],
        sector: sector.trim() || 'Uncategorised',
        weight: surface === 'watchlist' ? 0 : w,
        thesis: thesis.trim(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Couldn't resolve ${trimmedTicker} on Yahoo Finance. ${msg}`);
    } finally {
      setValidating(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-charcoal/25 backdrop-blur-[3px] z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed left-1/2 top-[10vh] -translate-x-1/2 z-50 w-[min(92vw,460px)] max-h-[80vh] rounded-2xl bg-white border border-calm-violet/15 flex flex-col overflow-hidden"
            style={{ boxShadow: '0 28px 60px -20px rgba(72,55,120,0.32), 0 8px 18px rgba(72,55,120,0.10)' }}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-bordersoft/60 shrink-0">
              <div>
                <p className="label-mute">{surface === 'portfolio' ? 'Portfolio' : 'Watchlist'}</p>
                <h2 className="font-display text-[18px] font-semibold mt-0.5">
                  {mode === 'add' ? `Add ${surface === 'portfolio' ? 'holding' : 'ticker'}` : 'Edit'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-charcoal-mute hover:text-charcoal text-[20px] leading-none px-1.5 -mr-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3"
            >
              <label className="block relative">
                <div className="text-[10.5px] tracking-[0.18em] uppercase font-semibold text-charcoal-mute">
                  Ticker (Yahoo symbol)
                </div>
                <input
                  type="text"
                  value={ticker}
                  autoFocus
                  autoComplete="off"
                  onChange={(e) => onTickerChange(e.target.value)}
                  onFocus={() => results.length > 0 && setShowResults(true)}
                  className="mt-1 w-full bg-white border border-bordersoft rounded-lg px-3 py-2 text-[13px] text-charcoal placeholder:text-charcoal-mute focus:outline-none focus:ring-2 focus:ring-calm-emerald/30 focus:border-calm-emerald"
                />
                <div className="text-[10.5px] text-charcoal-mute mt-1">
                  e.g. RELIANCE.NS, INFY.NS, TCS.NS, AAPL
                </div>

                {showResults && (ticker.trim() || searching) && (
                  <div className="absolute left-0 right-0 top-[58px] z-10 max-h-[240px] overflow-y-auto rounded-lg border border-bordersoft bg-white shadow-lift">
                    {searching && (
                      <p className="px-3 py-2.5 text-[12px] text-charcoal-mute">Searching…</p>
                    )}
                    {searchError && !searching && (
                      <p className="px-3 py-2.5 text-[12px] text-calm-rose">{searchError}</p>
                    )}
                    {!searching && !searchError && results.length === 0 && ticker.trim() && (
                      <p className="px-3 py-2.5 text-[12px] text-charcoal-mute">No matches found.</p>
                    )}
                    {!searchError &&
                      results.map((r) => (
                        <button
                          key={r.symbol}
                          type="button"
                          onClick={() => pickResult(r)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-cream-deep/60"
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
              </label>
              <Field
                label="Display name"
                hint="Optional. Defaults to the ticker."
                value={title}
                onChange={setTitle}
              />
              <Field
                label="Sector"
                hint="Free text — e.g. IT Services, Banks, Autos."
                value={sector}
                onChange={setSector}
              />
              {surface === 'portfolio' && (
                <Field
                  label="Weight (%)"
                  hint="Portfolio weight 0–100."
                  value={weight}
                  onChange={setWeight}
                  type="number"
                />
              )}
              <Field
                label="Thesis"
                hint="Optional one-liner. Shown in the drawer."
                value={thesis}
                onChange={setThesis}
                multiline
              />

              {error && (
                <div className="text-[12px] text-calm-rose bg-calm-rose-bg/40 border border-calm-rose/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              {resolvedPrice != null && !error && (
                <div className="text-[12px] text-calm-emerald bg-calm-emerald-bg/40 border border-calm-emerald/20 rounded-lg px-3 py-2">
                  Resolved live price: {resolvedPrice.toLocaleString('en-IN')}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-full text-[12px] text-charcoal-mute hover:text-charcoal-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={validating}
                  className={clsx(
                    'px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition',
                    validating
                      ? 'bg-charcoal-mute/40 text-charcoal-mute cursor-wait'
                      : 'bg-gradient-to-b from-calm-emerald to-[#0C7A5E] text-white hover:shadow-lift',
                  )}
                >
                  {validating ? 'Validating…' : mode === 'add' ? 'Add' : 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  type = 'text',
  multiline,
  autoFocus,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'number';
  multiline?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-[10.5px] tracking-[0.18em] uppercase font-semibold text-charcoal-mute">{label}</div>
      {multiline ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full bg-white border border-bordersoft rounded-lg px-3 py-2 text-[13px] text-charcoal placeholder:text-charcoal-mute focus:outline-none focus:ring-2 focus:ring-calm-emerald/30 focus:border-calm-emerald"
        />
      ) : (
        <input
          type={type}
          step={type === 'number' ? '0.1' : undefined}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full bg-white border border-bordersoft rounded-lg px-3 py-2 text-[13px] text-charcoal placeholder:text-charcoal-mute focus:outline-none focus:ring-2 focus:ring-calm-emerald/30 focus:border-calm-emerald"
        />
      )}
      {hint && <div className="text-[10.5px] text-charcoal-mute mt-1">{hint}</div>}
    </label>
  );
}
