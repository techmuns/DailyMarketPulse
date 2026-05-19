// Fetch live market data via yahoo-finance2 and write
// public/data/live.json.
//
// yahoo-finance2 handles Yahoo's cookie/crumb dance, so direct HTTP
// 401/403 issues don't apply here.
//
// Behaviour
// - One chart() call per symbol, 1mo / 1d.
// - Computes current + 1D / 5D / 1M % change + a 7-point spark.
// - Logs failures per symbol and continues — never throws.
// - Writes whatever succeeded, plus an ISO fetchedAt timestamp.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YahooFinance from 'yahoo-finance2';
import { SYMBOLS } from './symbols.mjs';

const yahooFinance = new YahooFinance();
yahooFinance.suppressNotices?.(['ripHistorical', 'yahooSurvey']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'data');
const OUT_FILE = path.join(OUT_DIR, 'live.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round = (v) => Math.round(v * 100) / 100;

async function fetchCloses(yahooTicker) {
  const end = new Date();
  const start = new Date(end.getTime() - 45 * 24 * 60 * 60 * 1000); // 45d back to ensure ~22 trading days
  const result = await yahooFinance.chart(yahooTicker, {
    period1: start,
    period2: end,
    interval: '1d',
  });
  const quotes = result?.quotes ?? [];
  const closes = quotes
    .map((q) => q.close)
    .filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (closes.length < 2) throw new Error(`only ${closes.length} valid closes`);
  return closes;
}

function computeTrend(closes) {
  const last = closes[closes.length - 1];
  const prev1 = closes[closes.length - 2] ?? last;
  const prev5 = closes[closes.length - 6] ?? closes[0];
  const prev1m = closes[0];
  const pct = (a, b) => (b === 0 ? 0 : ((a - b) / b) * 100);
  return {
    d1: round(pct(last, prev1)),
    d5: round(pct(last, prev5)),
    m1: round(pct(last, prev1m)),
    spark: closes.slice(-7).map((v) => round(v)),
  };
}

async function run() {
  const out = {
    fetchedAt: new Date().toISOString(),
    indices: [],
    currencies: [],
    commodities: [],
    holdings: [],
  };

  let ok = 0;
  let fail = 0;

  for (const [kind, list] of Object.entries(SYMBOLS)) {
    for (const { id, yahoo } of list) {
      try {
        const closes = await fetchCloses(yahoo);
        const trend = computeTrend(closes);
        const current = round(closes[closes.length - 1]);
        out[kind].push({ id, ticker: yahoo, current, trend });
        ok++;
        console.log(`ok    ${kind.padEnd(11)} ${id.padEnd(10)} ${yahoo.padEnd(14)} cur=${current}`);
      } catch (err) {
        fail++;
        console.warn(`skip  ${kind.padEnd(11)} ${id.padEnd(10)} ${yahoo.padEnd(14)} ${err.message ?? err}`);
      }
      await sleep(150);
    }
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n', 'utf8');

  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}: ${ok} ok, ${fail} skipped, fetchedAt=${out.fetchedAt}`);

  if (ok === 0) {
    console.error('All symbols failed — aborting.');
    process.exit(2);
  }
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
