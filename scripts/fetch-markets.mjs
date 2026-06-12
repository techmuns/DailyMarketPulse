// Fetch real Markets-tab internals via yahoo-finance2 and write
// public/data/markets.json:
//   - sectors:       NSE sectoral indices (1D/5D/1M + spark)
//   - breadth:       advance/decline, new highs/lows, % above 50/200DMA
//   - gainers/losers/unusualVolume: from a Nifty-50 + book quote scan
//
// Index levels themselves already live in live.json (fetch-data.mjs);
// this script only covers what that feed omits. Behaviour mirrors
// fetch-data.mjs: per-item try/catch, never throws, writes whatever
// succeeded.

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
const OUT_FILE = path.join(OUT_DIR, 'markets.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round = (v) => Math.round(v * 100) / 100;
const shortName = (t) => String(t).replace(/\.(NS|BO)$/i, '');
const nowIso = () => new Date().toISOString();

// NSE sectoral indices on Yahoo. Any symbol that fails is logged and
// skipped — the heatmap simply shows fewer tiles.
const SECTORS = [
  { id: 's-it',     title: 'IT Services', sector: 'IT',     yahoo: '^CNXIT' },
  { id: 's-banks',  title: 'Banks',       sector: 'Banks',  yahoo: '^NSEBANK' },
  { id: 's-auto',   title: 'Autos',       sector: 'Autos',  yahoo: '^CNXAUTO' },
  { id: 's-fmcg',   title: 'FMCG',        sector: 'FMCG',   yahoo: '^CNXFMCG' },
  { id: 's-pharma', title: 'Pharma',      sector: 'Pharma', yahoo: '^CNXPHARMA' },
  { id: 's-metals', title: 'Metals',      sector: 'Metals', yahoo: '^CNXMETAL' },
  { id: 's-energy', title: 'Energy',      sector: 'Energy', yahoo: '^CNXENERGY' },
  { id: 's-realty', title: 'Realty',      sector: 'Realty', yahoo: '^CNXREALTY' },
];

// Nifty-50 constituents (approximate; used only as a breadth / movers
// sample, not a tradable index). Book names are merged in below.
const NIFTY50 = [
  'RELIANCE.NS','HDFCBANK.NS','ICICIBANK.NS','INFY.NS','TCS.NS','ITC.NS','LT.NS',
  'KOTAKBANK.NS','AXISBANK.NS','SBIN.NS','BHARTIARTL.NS','BAJFINANCE.NS','HINDUNILVR.NS',
  'M&M.NS','MARUTI.NS','SUNPHARMA.NS','TITAN.NS','ASIANPAINT.NS','NTPC.NS','POWERGRID.NS',
  'TATAMOTORS.NS','TATASTEEL.NS','ULTRACEMCO.NS','NESTLEIND.NS','WIPRO.NS','HCLTECH.NS',
  'ADANIENT.NS','ADANIPORTS.NS','JSWSTEEL.NS','COALINDIA.NS','ONGC.NS','GRASIM.NS',
  'HINDALCO.NS','BAJAJFINSV.NS','TECHM.NS','DRREDDY.NS','CIPLA.NS','BRITANNIA.NS',
  'EICHERMOT.NS','HEROMOTOCO.NS','DIVISLAB.NS','BPCL.NS','TATACONSUM.NS','APOLLOHOSP.NS',
  'INDUSINDBK.NS','BAJAJ-AUTO.NS','SBILIFE.NS','HDFCLIFE.NS','LTIM.NS','SHRIRAMFIN.NS',
];

const BOOK = new Map((SYMBOLS.holdings ?? []).map((h) => [h.yahoo.toUpperCase(), h.id]));
const scopeOf = (ticker) => {
  const id = BOOK.get(String(ticker).toUpperCase());
  if (!id) return 'broader';
  return id.startsWith('p-') ? 'portfolio' : 'watchlist';
};

async function fetchCloses(yahooTicker) {
  const end = new Date();
  const start = new Date(end.getTime() - 45 * 24 * 60 * 60 * 1000);
  const result = await yahooFinance.chart(yahooTicker, { period1: start, period2: end, interval: '1d' });
  const closes = (result?.quotes ?? [])
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

async function fetchSectors() {
  const out = [];
  for (const s of SECTORS) {
    try {
      const closes = await fetchCloses(s.yahoo);
      const trend = computeTrend(closes);
      const dir = trend.d1 > 0.05 ? 'up' : trend.d1 < -0.05 ? 'down' : 'flat';
      out.push({
        id: s.id,
        title: s.title,
        sector: s.sector,
        category: 'sector',
        current: trend.d1,
        previous: 0,
        trend,
        signal: trend.d1 >= 0.3 ? 'support' : trend.d1 <= -0.3 ? 'risk' : 'monitor',
        impact: 55,
        affected: [s.sector],
        whyShown: `NSE ${s.title} index ${dir} ${Math.abs(trend.d1)}% on the day.`,
        source: 'Reliable media',
        confidence: 85,
        timestamp: nowIso(),
      });
      console.log(`ok    sector ${s.id.padEnd(9)} ${s.yahoo.padEnd(12)} d1=${trend.d1}`);
    } catch (err) {
      console.warn(`skip  sector ${s.id.padEnd(9)} ${s.yahoo.padEnd(12)} ${err?.message ?? err}`);
    }
    await sleep(150);
  }
  return out;
}

async function fetchUniverse() {
  const tickers = [...new Set([...NIFTY50, ...(SYMBOLS.holdings ?? []).map((h) => h.yahoo)])];
  const quotes = await yahooFinance.quote(tickers);
  const list = (Array.isArray(quotes) ? quotes : [quotes]).filter(
    (q) => q && typeof q.regularMarketChangePercent === 'number'
  );
  if (list.length === 0) throw new Error('no quotes returned');
  return list;
}

function buildFromUniverse(quotes) {
  const rows = quotes.map((q) => {
    const price = q.regularMarketPrice;
    const vol = q.regularMarketVolume;
    const avgVol = q.averageDailyVolume3Month || q.averageDailyVolume10Day;
    return {
      ticker: shortName(q.symbol),
      name: q.shortName || q.longName || shortName(q.symbol),
      pct: round(q.regularMarketChangePercent),
      scope: scopeOf(q.symbol),
      price,
      volumeX: avgVol ? round(vol / avgVol) : undefined,
      aboveSMA50: typeof q.fiftyDayAverage === 'number' ? price > q.fiftyDayAverage : null,
      aboveSMA200: typeof q.twoHundredDayAverage === 'number' ? price > q.twoHundredDayAverage : null,
      nearHigh: typeof q.fiftyTwoWeekHigh === 'number' ? price >= q.fiftyTwoWeekHigh * 0.995 : false,
      nearLow: typeof q.fiftyTwoWeekLow === 'number' ? price <= q.fiftyTwoWeekLow * 1.005 : false,
    };
  });

  const advancers = rows.filter((r) => r.pct > 0).length;
  const decliners = rows.filter((r) => r.pct < 0).length;
  const unchanged = rows.filter((r) => r.pct === 0).length;
  const sma50 = rows.filter((r) => r.aboveSMA50 != null);
  const sma200 = rows.filter((r) => r.aboveSMA200 != null);
  const breadth = {
    advancers,
    decliners,
    unchanged,
    newHighs: rows.filter((r) => r.nearHigh).length,
    newLows: rows.filter((r) => r.nearLow).length,
    aboveSMA50: sma50.length ? Math.round((sma50.filter((r) => r.aboveSMA50).length / sma50.length) * 100) : 0,
    aboveSMA200: sma200.length ? Math.round((sma200.filter((r) => r.aboveSMA200).length / sma200.length) * 100) : 0,
  };

  const byPctDesc = [...rows].sort((a, b) => b.pct - a.pct);
  const toMover = (r, reason) => ({ ticker: r.ticker, name: r.name, pct: r.pct, reason, scope: r.scope, volumeX: r.volumeX });

  const gainers = byPctDesc.slice(0, 5).map((r) => toMover(r, `+${r.pct}% — among today's top movers.`));
  const losers = byPctDesc.slice(-5).reverse().map((r) => toMover(r, `${r.pct}% — among today's laggards.`));
  const unusualVolume = rows
    .filter((r) => typeof r.volumeX === 'number' && r.volumeX >= 1.3)
    .sort((a, b) => (b.volumeX ?? 0) - (a.volumeX ?? 0))
    .slice(0, 5)
    .map((r) => toMover(r, `${r.volumeX}x average volume.`));

  return { breadth, gainers, losers, unusualVolume };
}

async function run() {
  const out = { fetchedAt: nowIso(), source: 'yahoo-finance', sectors: [], breadth: null, gainers: [], losers: [], unusualVolume: [] };
  let ok = 0;

  out.sectors = await fetchSectors();
  if (out.sectors.length) ok++;

  try {
    const quotes = await fetchUniverse();
    Object.assign(out, buildFromUniverse(quotes));
    ok++;
    console.log(`ok    universe ${quotes.length} quotes -> A/D ${out.breadth.advancers}/${out.breadth.decliners}, ${out.gainers.length} gainers`);
  } catch (err) {
    console.warn(`skip  universe ${err?.message ?? err}`);
  }

  if (ok === 0) {
    console.error('All markets sections failed — leaving existing markets.json untouched.');
    process.exit(2);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}: ${out.sectors.length} sectors, fetchedAt=${out.fetchedAt}`);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
