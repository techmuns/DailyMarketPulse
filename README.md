# Daily Market Pulse — Calm Alpha

A premium, smooth, habit-forming daily market intelligence dashboard for
investors. The product promise:

> Know what changed. Know what matters. Know what to do.

This is not a generic news dashboard — it is a portfolio-aware daily
market cockpit covering macro, markets, currency, commodities, news,
filings, events, portfolio impact, watchlist impact, and actions.

Live market data is fetched by scheduled GitHub Actions (Yahoo Finance
via `scripts/fetch-*.mjs`) into `public/data/*.json` and overlaid onto
the UI at runtime. The bundled `src/data/*` files are the typed fallback
shown when a feed is missing, so the dashboard always renders.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS (Calm Alpha theme)
- Recharts (sparklines & compact charts)
- Framer Motion (smooth transitions, drawer)

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Theme — Calm Alpha

- Soft ivory background, cream cards, charcoal text
- Positive: soft green · Negative: muted rose · Watch: warm amber
- Portfolio: calm navy · AI insight: soft violet
- Rounded cards, soft shadows, sparklines, no terminal aesthetics

## Project layout

```
src/
  components/   Reusable UI (Card, Chip, Delta, Sparkline, Drawer, TopNav, ...)
  data/         Mock data (portfolio, watchlist, macro, currencies,
                commodities, markets, news, filings, events, signals, actions)
  state/        Lightweight React context (priority lens + AI drawer)
  tabs/         One file per top-level tab
  types/        Shared TypeScript types
  utils/        Formatting helpers
```

## Top tabs

`Today | Macro | Markets | Currency | Commodities | News & Filings | Portfolio | Watchlist | Events | Actions`

Each tab answers the five core questions:

1. What changed since yesterday?
2. Is it a one-day move or a trend?
3. Who is affected?
4. Is it risk, support, or noise?
5. What action is needed?

## Replacing mock data with live feeds

Every data file under `src/data/` exports typed arrays matching the
shared types in `src/types/index.ts`. Swap the in-file constants with
the result of a live fetch (or a TanStack Query hook) — UI components
read against the type contract, not the source.

## Data feeds

Scheduled GitHub Actions refresh the live feeds into `public/data/`:

| File | Script | Powers |
|------|--------|--------|
| `live.json` | `fetch-data.mjs` | Index / FX / commodity / holding prices + trends |
| `news.json` | `fetch-news.mjs` | News & Filings headlines |
| `events.json` | `fetch-events.mjs` | Earnings & ex-dividend dates |
| `markets.json` | `fetch-markets.mjs` | Sector heatmap, breadth, gainers/losers, unusual volume |
| `macro.json` | `fetch-macro.mjs` | US 10Y (Yahoo `^TNX`); India CPI + IIP + US Fed Funds (keyless FRED CSV) |
| `filings.json` | `fetch-filings.mjs` | Corporate filings (BSE India announcements API) |

Every tab reads live data when its feed is present and falls back to the
bundled `src/data/*` mock otherwise — no env flag required. Prices,
trends, news, earnings, sectors, breadth, movers, US 10Y, CPI, IIP, Fed
Funds and filings are real; the Pulse Brief, lens headlines, AI signals,
geopolitics read and per-row tone are derived from the live numbers. The
only remaining demo rows — **RBI repo rate** and **system liquidity** —
have no free, keyless source; they are tagged "demo" in the Macro tab and
go live once the MUNS backend is wired in.

### Market Weather data state

The Today tab's Market Weather card is **live by default** whenever
`public/data/live.json` is present. Set `VITE_DATA_MODE=mock` to force
the demo view. State labels:

- `Live · updated Xm/Xh ago` — `live.json` is fresh (≤ 4h old).
- `Delayed · updated Xh ago` — `live.json` present but stale (> 4h).
- `Mock data` — no `live.json` loaded, or `VITE_DATA_MODE=mock`.

