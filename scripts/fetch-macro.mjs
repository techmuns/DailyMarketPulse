// Merge the macro indicators that have a free, keyless source INTO
// public/data/live.json's `macro` array, so main's existing
// useLiveOverlay(mockMacro, 'macro') + DataSourceChip light up.
//
//   - m-cpi-in India CPI (YoY)   -> FRED INDCPIALLMINMEI (monthly)
//   - m-iip    India IIP (YoY)   -> FRED INDPROINDMISMEI (monthly)
//   - m-fed    US Fed Funds Rate -> FRED FEDFUNDS (monthly)
//
// (m-us10y is already produced by fetch-data.mjs from Yahoo ^TNX.)
// FRED is read via the keyless fredgraph.csv endpoint — no API key. A
// freshness guard drops any stale series. Runs AFTER fetch-data.mjs in
// the workflow; reads the live.json it produced and writes it back with
// macro merged in. Never throws — leaves live.json untouched on failure.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LIVE_FILE = path.join(ROOT, 'public', 'data', 'live.json');

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const round = (v) => Math.round(v * 100) / 100;
const STALE_DAYS = 200;

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

async function fredLevel(id, series) {
  const rows = await fredSeries(series);
  const vals = rows.map((r) => r.value);
  const last = vals[vals.length - 1];
  return { id, current: round(last), trend: { d1: 0, d5: 0, m1: round(last - (vals[vals.length - 2] ?? last)), spark: vals.slice(-7).map(round) } };
}

async function fredYoY(id, series) {
  const rows = await fredSeries(series);
  const yoyAt = (i) => round(((rows[i].value - rows[i - 12].value) / rows[i - 12].value) * 100);
  const last = rows.length - 1;
  const spark = [];
  for (let i = Math.max(12, last - 6); i <= last; i++) spark.push(yoyAt(i));
  return { id, current: yoyAt(last), trend: { d1: 0, d5: 0, m1: round(yoyAt(last) - yoyAt(last - 1)), spark } };
}

async function runSource(name, fn) {
  try {
    const data = await fn();
    console.log(`ok    ${name} = ${data.current}`);
    return data;
  } catch (err) {
    console.warn(`skip  ${name} — ${err?.message ?? err}`);
    return null;
  }
}

async function run() {
  const items = (await Promise.all([
    runSource('india-cpi (FRED INDCPIALLMINMEI)', () => fredYoY('m-cpi-in', 'INDCPIALLMINMEI')),
    runSource('india-iip (FRED INDPROINDMISMEI)', () => fredYoY('m-iip', 'INDPROINDMISMEI')),
    runSource('us-fed-funds (FRED FEDFUNDS)', () => fredLevel('m-fed', 'FEDFUNDS')),
  ])).filter(Boolean);

  if (items.length === 0) {
    console.warn('No macro indicators fetched — leaving live.json unchanged.');
    return;
  }

  let live;
  try {
    live = JSON.parse(await fs.readFile(LIVE_FILE, 'utf8'));
  } catch (err) {
    console.error(`Cannot read ${LIVE_FILE} — run fetch-data.mjs first. ${err?.message ?? err}`);
    return;
  }

  const byId = new Map((Array.isArray(live.macro) ? live.macro : []).map((m) => [m.id, m]));
  for (const it of items) byId.set(it.id, it); // add/override CPI/IIP/Fed; keep US 10Y
  live.macro = [...byId.values()];

  await fs.writeFile(LIVE_FILE, JSON.stringify(live, null, 2) + '\n', 'utf8');
  console.log(`\nMerged ${items.length} macro indicators into ${path.relative(ROOT, LIVE_FILE)}: macro now ${live.macro.length} items.`);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
