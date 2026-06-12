// Produce public/data/moneycontrol.json from working Yahoo data so
// main's existing LiveWire (news) + useLiveMovers (gainers/losers) light
// up. The original moneycontrol scraper (fetch-moneycontrol.mjs) is
// blocked from datacenter / GitHub IPs, so that file never generated;
// this fills the SAME shape with Yahoo Finance (which does work in CI):
//
//   { fetchedAt, news:[{title,url,publishedAt}],
//     gainers:[{name,price,changePct}], losers:[...], fiiDii:null }
//
// fiiDii has no working free source (NSE/BSE/MC all block CI) -> null,
// which main renders as "unavailable" rather than faked.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YahooFinance from 'yahoo-finance2';
import { SYMBOLS } from './symbols.mjs';

const yahooFinance = new YahooFinance();
yahooFinance.suppressNotices?.(['ripHistorical', 'yahooSurvey']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'public', 'data', 'moneycontrol.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round = (v) => Math.round(v * 100) / 100;
const shortName = (t) => String(t).replace(/\.(NS|BO)$/i, '');

const NIFTY50 = [
  'RELIANCE.NS','HDFCBANK.NS','ICICIBANK.NS','INFY.NS','TCS.NS','ITC.NS','LT.NS','KOTAKBANK.NS',
  'AXISBANK.NS','SBIN.NS','BHARTIARTL.NS','BAJFINANCE.NS','HINDUNILVR.NS','M&M.NS','MARUTI.NS',
  'SUNPHARMA.NS','TITAN.NS','ASIANPAINT.NS','NTPC.NS','POWERGRID.NS','TATAMOTORS.NS','TATASTEEL.NS',
  'ULTRACEMCO.NS','NESTLEIND.NS','WIPRO.NS','HCLTECH.NS','ADANIENT.NS','JSWSTEEL.NS','COALINDIA.NS',
  'ONGC.NS','GRASIM.NS','HINDALCO.NS','BAJAJFINSV.NS','TECHM.NS','DRREDDY.NS','CIPLA.NS','BRITANNIA.NS',
  'EICHERMOT.NS','HEROMOTOCO.NS','DIVISLAB.NS','BPCL.NS','TATACONSUM.NS','APOLLOHOSP.NS','INDUSINDBK.NS',
  'SBILIFE.NS','HDFCLIFE.NS','LTIM.NS','SHRIRAMFIN.NS',
];

const NEWS_QUERIES = [
  ...(SYMBOLS.holdings ?? []).map((h) => h.yahoo),
  'Nifty 50', 'Sensex', 'Indian stock market', 'RBI', 'rupee',
];

function publishIso(n) {
  const t = n.providerPublishTime;
  const ms = t instanceof Date ? t.getTime() : typeof t === 'number' ? (t > 1e12 ? t : t * 1000) : Date.parse(t ?? '');
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

async function fetchNews() {
  const byKey = new Map();
  for (const q of NEWS_QUERIES) {
    try {
      const res = await yahooFinance.search(q, { newsCount: 8, quotesCount: 0 });
      for (const n of res?.news ?? []) {
        if (!n?.title || !n?.link) continue;
        const key = n.uuid ?? n.title.toLowerCase();
        if (byKey.has(key)) continue;
        byKey.set(key, { title: n.title.trim(), url: n.link, publishedAt: publishIso(n) });
      }
    } catch (err) {
      console.warn(`skip  news "${q}" — ${err?.message ?? err}`);
    }
    await sleep(150);
  }
  return [...byKey.values()]
    .sort((a, b) => +new Date(b.publishedAt ?? 0) - +new Date(a.publishedAt ?? 0))
    .slice(0, 30);
}

async function fetchMovers() {
  const tickers = [...new Set([...NIFTY50, ...(SYMBOLS.holdings ?? []).map((h) => h.yahoo)])];
  const quotes = await yahooFinance.quote(tickers);
  const rows = (Array.isArray(quotes) ? quotes : [quotes])
    .filter((q) => q && typeof q.regularMarketChangePercent === 'number')
    .map((q) => ({
      name: q.shortName || q.longName || shortName(q.symbol),
      price: typeof q.regularMarketPrice === 'number' ? round(q.regularMarketPrice) : null,
      changePct: round(q.regularMarketChangePercent),
    }));
  if (rows.length === 0) throw new Error('no quotes');
  const byPct = [...rows].sort((a, b) => b.changePct - a.changePct);
  return { gainers: byPct.slice(0, 10), losers: byPct.slice(-10).reverse() };
}

async function run() {
  const out = { fetchedAt: new Date().toISOString(), news: null, gainers: null, losers: null, fiiDii: null };

  const news = await fetchNews().catch((e) => { console.warn(`news failed — ${e?.message ?? e}`); return null; });
  if (news && news.length) out.news = news;

  try {
    const { gainers, losers } = await fetchMovers();
    out.gainers = gainers;
    out.losers = losers;
  } catch (err) {
    console.warn(`movers failed — ${err?.message ?? err}`);
  }

  if (!out.news && !out.gainers) {
    console.error('No supplemental data fetched — leaving existing moneycontrol.json untouched.');
    process.exit(2);
  }

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}: news=${out.news?.length ?? 0}, gainers=${out.gainers?.length ?? 0}, losers=${out.losers?.length ?? 0}`);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
