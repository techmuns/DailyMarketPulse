// Fetch real corporate events (earnings + ex-dividend dates) for the
// book via yahoo-finance2's quoteSummary calendarEvents module and write
// public/data/events.json.
//
// Coverage note: Yahoo carries COMPANY events (earnings, dividends). It
// does NOT carry the economic / policy calendar (CPI prints, RBI
// minutes) — those need a different source, so the Events tab keeps
// those mock entries until one is wired in.
//
// Behaviour mirrors fetch-data.mjs: per-symbol try/catch, never throws,
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
const OUT_FILE = path.join(OUT_DIR, 'events.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DAY = 24 * 60 * 60 * 1000;
const HORIZON_DAYS = 14; // only surface events within the next 2 weeks

const holdings = SYMBOLS.holdings ?? [];
const shortName = (t) => String(t).replace(/\.(NS|BO)$/i, '');

// Bucket a future date into the UI's three windows; null if outside the
// horizon or in the past.
function bucketWhen(date) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d = date.getTime();
  const dayIdx = Math.floor((d - startToday) / DAY);
  if (dayIdx < 0 || dayIdx > HORIZON_DAYS) return null;
  if (dayIdx === 0) return 'today';
  if (dayIdx === 1) return 'tomorrow';
  return 'this-week';
}

function asDate(v) {
  if (v instanceof Date) return v;
  if (typeof v === 'number') return new Date(v > 1e12 ? v : v * 1000);
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isFinite(t) ? new Date(t) : null;
  }
  if (v && typeof v === 'object' && 'raw' in v) return asDate(v.raw);
  return null;
}

async function run() {
  const items = [];
  let ok = 0;
  let fail = 0;

  for (const { id, yahoo } of holdings) {
    const isPortfolio = id.startsWith('p-');
    try {
      const qs = await yahooFinance.quoteSummary(yahoo, { modules: ['calendarEvents', 'price'] });
      const name = qs?.price?.shortName || qs?.price?.longName || shortName(yahoo);
      const sym = shortName(yahoo);

      // Earnings — calendarEvents.earnings.earningsDate is a Date[].
      const earningsDates = qs?.calendarEvents?.earnings?.earningsDate ?? [];
      for (const raw of earningsDates) {
        const date = asDate(raw);
        const when = date && bucketWhen(date);
        if (!when) continue;
        items.push({
          id: `ev-earn-${id}`,
          title: `${name} — earnings`,
          company: sym,
          when,
          eventType: 'result',
          category: 'event',
          signal: 'monitor',
          impact: isPortfolio ? 72 : 55,
          affected: [sym],
          whyShown: isPortfolio
            ? 'Portfolio holding; results print due.'
            : 'Watchlist name; results print due.',
          source: 'Company source',
          confidence: 90,
          timestamp: date.toISOString(),
          changeStrip: when === 'today' || when === 'tomorrow' ? 'Action needed' : undefined,
        });
      }

      // Ex-dividend date — a lighter corporate event.
      const exDiv = asDate(qs?.calendarEvents?.exDividendDate);
      const exWhen = exDiv && bucketWhen(exDiv);
      if (exWhen) {
        items.push({
          id: `ev-exdiv-${id}`,
          title: `${name} — ex-dividend`,
          company: sym,
          when: exWhen,
          eventType: 'corporate',
          category: 'event',
          signal: 'monitor',
          impact: isPortfolio ? 45 : 35,
          affected: [sym],
          whyShown: 'Ex-dividend date; price adjusts by the dividend.',
          source: 'Company source',
          confidence: 88,
          timestamp: exDiv.toISOString(),
        });
      }

      ok++;
      console.log(`ok    ${id.padEnd(10)} ${yahoo.padEnd(14)} earnings=${earningsDates.length} exDiv=${exDiv ? 'y' : 'n'}`);
    } catch (err) {
      fail++;
      console.warn(`skip  ${id.padEnd(10)} ${yahoo.padEnd(14)} ${err?.message ?? err}`);
    }
    await sleep(200);
  }

  if (ok === 0) {
    console.error('All event lookups failed — leaving existing events.json untouched.');
    process.exit(2);
  }

  items.sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));

  const out = {
    fetchedAt: new Date().toISOString(),
    source: 'yahoo-finance',
    note: 'Corporate events (earnings, ex-dividend) only. Economic/policy calendar not covered by Yahoo.',
    items,
  };

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}: ${items.length} events, ${ok} ok / ${fail} skipped, fetchedAt=${out.fetchedAt}`);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
