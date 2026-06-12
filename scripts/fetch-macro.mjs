// Fetch the macro indicators that have a free, keyless real source and
// write public/data/macro.json as an id-keyed overlay onto src/data/macro.
//
//   - m-us10y  US 10Y Treasury yield  -> Yahoo ^TNX (daily)
//   - m-cpi-in India CPI inflation     -> World Bank API (annual)
//
// Indicators with no free/keyless feed (RBI repo rate, IIP, system
// liquidity, Fed-funds path, geopolitics) are intentionally NOT emitted;
// the UI keeps showing the bundled demo values for those rows. Wire a
// FRED key or the MUNS backend to make them real.
//
// Behaviour mirrors fetch-data.mjs: per-source try/catch, never throws,
// writes whatever succeeded.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();
yahooFinance.suppressNotices?.(['ripHistorical', 'yahooSurvey']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'data');
const OUT_FILE = path.join(OUT_DIR, 'macro.json');

const round = (v) => Math.round(v * 100) / 100;

// US 10Y via Yahoo ^TNX. Yahoo sometimes quotes this index as 10x the
// yield; normalise anything implausibly large back to a percentage.
async function fetchUS10Y() {
  const end = new Date();
  const start = new Date(end.getTime() - 45 * 24 * 60 * 60 * 1000);
  const res = await yahooFinance.chart('^TNX', { period1: start, period2: end, interval: '1d' });
  let closes = (res?.quotes ?? [])
    .map((q) => q.close)
    .filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (closes.length < 2) throw new Error(`only ${closes.length} closes`);
  if (closes[closes.length - 1] > 20) closes = closes.map((v) => v / 10); // 10x convention
  const last = closes[closes.length - 1];
  const prev1 = closes[closes.length - 2] ?? last;
  const prev5 = closes[closes.length - 6] ?? closes[0];
  const prev1m = closes[0];
  return {
    id: 'm-us10y',
    current: round(last),
    unit: '%',
    trend: {
      d1: round(last - prev1),
      d5: round(last - prev5),
      m1: round(last - prev1m),
      spark: closes.slice(-7).map(round),
    },
  };
}

// India CPI (annual %) via the World Bank open API — free, no key.
async function fetchIndiaCPI() {
  const url =
    'https://api.worldbank.org/v2/country/IND/indicator/FP.CPI.TOTL.ZG?format=json&per_page=20&date=2010:2026';
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const series = Array.isArray(json) && Array.isArray(json[1]) ? json[1] : [];
  const points = series
    .filter((p) => p && p.value != null)
    .map((p) => ({ year: Number(p.date), value: Number(p.value) }))
    .sort((a, b) => a.year - b.year);
  if (points.length < 2) throw new Error('no CPI values');
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  return {
    id: 'm-cpi-in',
    current: round(last.value),
    unit: '%',
    asOf: String(last.year),
    trend: {
      d1: 0,
      d5: 0,
      m1: round(last.value - prev.value), // YoY change in the inflation rate
      spark: points.slice(-7).map((p) => round(p.value)),
    },
  };
}

async function runSource(name, fn) {
  try {
    const data = await fn();
    console.log(`ok    ${name}`);
    return data;
  } catch (err) {
    console.warn(`skip  ${name} — ${err?.message ?? err}`);
    return null;
  }
}

async function run() {
  const results = await Promise.all([
    runSource('us10y (yahoo ^TNX)', fetchUS10Y),
    runSource('india-cpi (world bank)', fetchIndiaCPI),
  ]);
  const items = results.filter(Boolean);

  if (items.length === 0) {
    console.error('All macro sources failed — leaving existing macro.json untouched.');
    process.exit(2);
  }

  const out = {
    fetchedAt: new Date().toISOString(),
    source: 'yahoo-finance + world-bank',
    note: 'Overlay onto src/data/macro by id. Only indicators with a free source are emitted; the rest stay demo.',
    items,
  };
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}: ${items.length} indicators, fetchedAt=${out.fetchedAt}`);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
