// Fetch the macro indicators that have a free, keyless real source and
// write public/data/macro.json as an id-keyed overlay onto src/data/macro.
//
//   - m-us10y  US 10Y Treasury yield  -> Yahoo ^TNX (daily)
//   - m-cpi-in India CPI (YoY)         -> FRED INDCPIALLMINMEI (monthly),
//                                         World Bank fallback (annual)
//   - m-iip    India IIP (YoY)         -> FRED INDPROINDMISMEI (monthly)
//   - m-fed    US Fed Funds Rate       -> FRED FEDFUNDS (monthly)
//
// FRED is read via the keyless fredgraph.csv endpoint (no API key/secret
// required). A freshness guard drops any series whose latest observation
// is stale so we never overlay an out-of-date number.
//
// Still no free source (kept demo): RBI repo rate, system liquidity (LAF).
// Behaviour mirrors fetch-data.mjs: per-source try/catch, never throws.

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

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const round = (v) => Math.round(v * 100) / 100;
const STALE_DAYS = 200; // monthly series older than this are dropped

// ---------- US 10Y via Yahoo ^TNX ----------
async function fetchUS10Y() {
  const end = new Date();
  const start = new Date(end.getTime() - 45 * 24 * 60 * 60 * 1000);
  const res = await yahooFinance.chart('^TNX', { period1: start, period2: end, interval: '1d' });
  let closes = (res?.quotes ?? []).map((q) => q.close).filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (closes.length < 2) throw new Error(`only ${closes.length} closes`);
  if (closes[closes.length - 1] > 20) closes = closes.map((v) => v / 10);
  const last = closes[closes.length - 1];
  return {
    id: 'm-us10y',
    current: round(last),
    unit: '%',
    trend: {
      d1: round(last - (closes[closes.length - 2] ?? last)),
      d5: round(last - (closes[closes.length - 6] ?? closes[0])),
      m1: round(last - closes[0]),
      spark: closes.slice(-7).map(round),
    },
  };
}

// ---------- FRED (keyless CSV) ----------
async function fredSeries(series) {
  const res = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${series}`, {
    headers: { 'User-Agent': UA, Accept: 'text/csv' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const rows = text.trim().split(/\r?\n/).slice(1)
    .map((line) => line.split(','))
    .map(([date, value]) => ({ date, value: Number(value) }))
    .filter((p) => p.date && Number.isFinite(p.value));
  if (rows.length < 13) throw new Error('insufficient data');
  const ageDays = (Date.now() - Date.parse(rows[rows.length - 1].date)) / 86400000;
  if (ageDays > STALE_DAYS) throw new Error(`stale (${Math.round(ageDays)}d old)`);
  return rows;
}

// Level series (e.g. a policy rate) — latest value + month-over-month.
async function fredLevel(id, series, unit = '%') {
  const rows = await fredSeries(series);
  const vals = rows.map((r) => r.value);
  const last = vals[vals.length - 1];
  return {
    id,
    current: round(last),
    unit,
    trend: { d1: 0, d5: 0, m1: round(last - (vals[vals.length - 2] ?? last)), spark: vals.slice(-7).map(round) },
  };
}

// Index series → year-over-year % (CPI, IIP).
async function fredYoY(id, series, unit = '%') {
  const rows = await fredSeries(series);
  const yoyAt = (i) => round(((rows[i].value - rows[i - 12].value) / rows[i - 12].value) * 100);
  const last = rows.length - 1;
  const spark = [];
  for (let i = Math.max(12, last - 6); i <= last; i++) spark.push(yoyAt(i));
  return { id, current: yoyAt(last), unit, asOf: rows[last].date.slice(0, 7), trend: { d1: 0, d5: 0, m1: round(yoyAt(last) - yoyAt(last - 1)), spark } };
}

// World Bank annual CPI — fallback when FRED CPI is unavailable.
async function worldBankCPI() {
  const res = await fetch('https://api.worldbank.org/v2/country/IND/indicator/FP.CPI.TOTL.ZG?format=json&per_page=20&date=2010:2026', {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const pts = (Array.isArray(json) && Array.isArray(json[1]) ? json[1] : [])
    .filter((p) => p && p.value != null).map((p) => ({ year: Number(p.date), value: Number(p.value) }))
    .sort((a, b) => a.year - b.year);
  if (pts.length < 2) throw new Error('no CPI values');
  const last = pts[pts.length - 1];
  return { id: 'm-cpi-in', current: round(last.value), unit: '%', asOf: String(last.year), trend: { d1: 0, d5: 0, m1: round(last.value - pts[pts.length - 2].value), spark: pts.slice(-7).map((p) => round(p.value)) } };
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
  const cpi = (await runSource('india-cpi (FRED)', () => fredYoY('m-cpi-in', 'INDCPIALLMINMEI')))
    ?? (await runSource('india-cpi (World Bank fallback)', worldBankCPI));

  const results = [
    await runSource('us10y (Yahoo ^TNX)', fetchUS10Y),
    cpi,
    await runSource('india-iip (FRED)', () => fredYoY('m-iip', 'INDPROINDMISMEI')),
    await runSource('us-fed-funds (FRED)', () => fredLevel('m-fed', 'FEDFUNDS')),
  ];
  const items = results.filter(Boolean);

  if (items.length === 0) {
    console.error('All macro sources failed — leaving existing macro.json untouched.');
    process.exit(2);
  }

  const out = {
    fetchedAt: new Date().toISOString(),
    source: 'yahoo-finance + FRED + world-bank',
    note: 'Overlay onto src/data/macro by id. RBI repo rate and system liquidity have no free source and stay demo.',
    items,
  };
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}: ${items.map((i) => i.id).join(', ')}, fetchedAt=${out.fetchedAt}`);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
