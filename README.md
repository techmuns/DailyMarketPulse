# Daily Market Pulse — Calm Alpha

A premium, smooth, habit-forming daily market intelligence dashboard for
investors. The product promise:

> Know what changed. Know what matters. Know what to do.

This is not a generic news dashboard — it is a portfolio-aware daily
market cockpit covering macro, markets, currency, commodities, news,
filings, events, portfolio impact, watchlist impact, and actions.

This repo is a mock-data MVP. All data is clearly marked as mock/demo
and kept in structured files under `src/data/` so it can be swapped for
live feeds without touching UI components.

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

## Production environment

The Market Weather card decides between mock and live data via the
`VITE_DATA_MODE` build-time environment variable:

- **Production (Cloudflare Pages):** set `VITE_DATA_MODE=live` in the
  project's environment variables (Cloudflare Pages → Settings →
  Environment variables → Production). Without it, the deployed
  dashboard shows the "Mock data" chip even when `public/data/live.json`
  is present.
- **Local development / `npm run dev` / `npm run build` without the
  variable:** defaults to mock mode so the dashboard renders against
  bundled `src/data/*` without needing a fetched feed.

State labels:

- `Live · updated Xm/Xh ago` — `VITE_DATA_MODE=live` and
  `public/data/live.json` is fresh (≤ 4h old).
- `Delayed · updated Xh ago` — live mode with stale data (> 4h).
- `Mock data` — mock mode (default).
- `Data unavailable` — live mode but no `live.json` was loaded.

