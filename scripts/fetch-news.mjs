// Fetch real market news via yahoo-finance2's search() endpoint and
// write public/data/news.json.
//
// Why Yahoo: it is already proven in this repo (see fetch-data.mjs), is
// free, needs no API key, and ships from GitHub Actions without the
// WAF / datacenter-IP blocking that moneycontrol / ET / Google News
// return. search() yields real headlines with publisher, link,
// timestamp, and relatedTickers.
//
// What is real vs derived:
// - REAL:    title, url, publisher/source, timestamp, related tickers.
// - DERIVED: signal / impact / whyShown / scope are heuristics (Yahoo
//            gives no sentiment), computed from how a headline relates
//            to the portfolio / watchlist. The JSON marks these so the
//            UI never presents a guessed signal as fact.
//
// Behaviour mirrors fetch-data.mjs: per-query try/catch, never throws,
// writes whatever succeeded plus an ISO fetchedAt timestamp.

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
const OUT_FILE = path.join(OUT_DIR, 'news.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ITEMS = 30;

// Book lookups, derived from the single source of truth in symbols.mjs.
const holdings = SYMBOLS.holdings ?? [];
const PORTFOLIO = new Set(holdings.filter((h) => h.id.startsWith('p-')).map((h) => h.yahoo));
const WATCHLIST = new Set(holdings.filter((h) => h.id.startsWith('w-')).map((h) => h.yahoo));

// Per-ticker news (the book) plus a few market-level queries so the
// feed still has macro / index context even on quiet stock days.
const TICKER_QUERIES = holdings.map((h) => h.yahoo);
const MARKET_QUERIES = ['Nifty 50', 'Sensex', 'Indian stock market'];

const shortName = (ticker) => String(ticker).replace(/\.(NS|BO)$/i, '').replace(/=[XF]$/i, '');

// Known financial publishers Yahoo aggregates → SourceLabel union used
// by the UI. Anything unrecognised defaults to 'Reliable media' since
// Yahoo only syndicates established outlets.
function sourceLabel(publisher) {
  const p = (publisher ?? '').toLowerCase();
  if (/(press release|globe newswire|business wire|pr newswire)/.test(p)) return 'Company source';
  if (/(motley fool|seeking alpha|zacks|opinion)/.test(p)) return 'Opinion';
  return 'Reliable media';
}

function publishTimeMs(n) {
  const t = n.providerPublishTime;
  if (t instanceof Date) return t.getTime();
  if (typeof t === 'number') return t > 1e12 ? t : t * 1000; // sec vs ms
  const parsed = Date.parse(t ?? '');
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function classify(related) {
  const tickers = (related ?? []).map((t) => t.toUpperCase());
  const inPortfolio = tickers.find((t) => PORTFOLIO.has(t));
  if (inPortfolio) return { scope: 'portfolio', anchor: shortName(inPortfolio), impact: 65 };
  const inWatchlist = tickers.find((t) => WATCHLIST.has(t));
  if (inWatchlist) return { scope: 'watchlist', anchor: shortName(inWatchlist), impact: 50 };
  return { scope: 'broader', anchor: null, impact: 40 };
}

function toNewsItem(n, ms) {
  const related = Array.isArray(n.relatedTickers) ? n.relatedTickers : [];
  const { scope, anchor, impact } = classify(related);
  const affected = related.length ? [...new Set(related.map(shortName))].slice(0, 4) : ['Markets'];
  const whyShown =
    scope === 'portfolio' ? `Mentions ${anchor} — a portfolio holding.`
      : scope === 'watchlist' ? `Mentions ${anchor} — on your watchlist.`
      : 'Broader market headline.';
  return {
    id: `yn-${n.uuid ?? Buffer.from(n.link ?? n.title ?? String(ms)).toString('base64').slice(0, 16)}`,
    title: (n.title ?? '').trim(),
    category: 'news',
    summary: '',
    url: n.link,
    scope,
    signal: 'monitor', // derived placeholder — Yahoo gives no sentiment
    impact, // derived
    affected,
    whyShown, // derived
    source: sourceLabel(n.publisher),
    publisher: n.publisher ?? null,
    confidence: 60, // derived
    timestamp: new Date(ms).toISOString(),
    ...(Date.now() - ms < DAY_MS ? { changeStrip: 'New today' } : {}),
    derived: ['signal', 'impact', 'whyShown', 'scope', 'confidence'],
  };
}

async function run() {
  const byKey = new Map(); // dedupe by uuid|title
  let ok = 0;
  let fail = 0;

  const queries = [...TICKER_QUERIES, ...MARKET_QUERIES];
  for (const q of queries) {
    try {
      const res = await yahooFinance.search(q, { newsCount: 8, quotesCount: 0 });
      const items = Array.isArray(res?.news) ? res.news : [];
      let added = 0;
      for (const n of items) {
        if (!n?.title || !n?.link) continue;
        const key = n.uuid ?? n.title.toLowerCase();
        if (byKey.has(key)) continue;
        byKey.set(key, toNewsItem(n, publishTimeMs(n)));
        added++;
      }
      ok++;
      console.log(`ok    ${String(q).padEnd(18)} +${added} (${items.length} raw)`);
    } catch (err) {
      fail++;
      console.warn(`skip  ${String(q).padEnd(18)} ${err?.message ?? err}`);
    }
    await sleep(200);
  }

  const items = [...byKey.values()]
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    .slice(0, MAX_ITEMS);

  if (items.length === 0) {
    console.error('No news fetched — leaving existing news.json untouched.');
    process.exit(2);
  }

  const out = {
    fetchedAt: new Date().toISOString(),
    source: 'yahoo-finance',
    note: 'title/url/publisher/timestamp are real; signal/impact/whyShown/scope are derived heuristics.',
    items,
  };

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}: ${items.length} items, ${ok} ok / ${fail} skipped, fetchedAt=${out.fetchedAt}`);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
