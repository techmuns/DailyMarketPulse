// Fetch real corporate filings for the book from BSE India's public
// announcements API (api.bseindia.com) and write public/data/filings.json.
//
// This is an official JSON endpoint (not an HTML scrape). It can be IP-
// blocked from some hosts; the script fails gracefully per-company and
// the News & Filings tab keeps demo filings when nothing is returned.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'data');
const OUT_FILE = path.join(OUT_DIR, 'filings.json');

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// BSE scrip codes for the book, keyed by the same id used in symbols.mjs
// / src/data so scope (portfolio vs watchlist) follows the id prefix.
const BSE = [
  { id: 'p-infy', code: '500209', tag: 'INFY' },
  { id: 'p-mm', code: '500520', tag: 'M&M' },
  { id: 'p-hdfcb', code: '500180', tag: 'HDFCBANK' },
  { id: 'p-asianp', code: '500820', tag: 'ASIANPAINT' },
  { id: 'p-tcs', code: '532540', tag: 'TCS' },
  { id: 'p-relian', code: '500325', tag: 'RELIANCE' },
  { id: 'p-titan', code: '500114', tag: 'TITAN' },
  { id: 'p-bajfin', code: '500034', tag: 'BAJFINANCE' },
  { id: 'w-pidil', code: '500331', tag: 'PIDILITIND' },
  { id: 'w-dmart', code: '540376', tag: 'DMART' },
  { id: 'w-divis', code: '532488', tag: 'DIVISLAB' },
  { id: 'w-pi', code: '523642', tag: 'PIIND' },
  { id: 'w-zomato', code: '543320', tag: 'ETERNAL' },
];

const ymd = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

function isoOf(v) {
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString();
}

async function fetchScrip({ id, code, tag }) {
  const today = new Date();
  const prev = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const url =
    `https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w?pageno=1&strCat=-1` +
    `&strPrevDate=${ymd(prev)}&strScrip=${code}&strSearch=P&strToDate=${ymd(today)}&strType=C`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
      Referer: 'https://www.bseindia.com/',
      Origin: 'https://www.bseindia.com',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const rows = Array.isArray(json?.Table) ? json.Table : [];
  const isPortfolio = id.startsWith('p-');
  return rows.slice(0, 2).map((r, i) => {
    const title = clean(r.HEADLINE) || clean(r.NEWSSUB) || 'Corporate announcement';
    const ts = isoOf(r.NEWS_DT || r.News_submission_dt);
    const attach = clean(r.ATTACHMENTNAME);
    return {
      id: `bse-${code}-${r.NEWSID ?? i}`,
      title: title.length > 140 ? `${title.slice(0, 137)}…` : title,
      company: clean(r.SLONGNAME) || tag,
      filingType: clean(r.CATEGORYNAME) || 'BSE filing',
      category: 'filing',
      summary: clean(r.NEWSSUB),
      signal: 'monitor',
      impact: isPortfolio ? 60 : 45,
      affected: [tag],
      whyShown: isPortfolio ? 'Portfolio holding — official BSE filing.' : 'Watchlist name — official BSE filing.',
      source: 'Official filing',
      confidence: 92,
      timestamp: ts,
      url: attach ? `https://www.bseindia.com/xml-data/corpfiling/AttachLive/${attach}` : undefined,
      ...(Date.now() - Date.parse(ts) < 24 * 60 * 60 * 1000 ? { changeStrip: 'New today' } : {}),
    };
  });
}

async function run() {
  const items = [];
  let ok = 0;
  let fail = 0;
  for (const entry of BSE) {
    try {
      const filings = await fetchScrip(entry);
      items.push(...filings);
      ok++;
      console.log(`ok    ${entry.id.padEnd(10)} ${entry.code} +${filings.length}`);
    } catch (err) {
      fail++;
      console.warn(`skip  ${entry.id.padEnd(10)} ${entry.code} ${err?.message ?? err}`);
    }
    await sleep(250);
  }

  if (items.length === 0) {
    console.error('No filings fetched — leaving existing filings.json untouched.');
    process.exit(2);
  }

  items.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  const out = { fetchedAt: new Date().toISOString(), source: 'bse-india', items: items.slice(0, 15) };
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}: ${out.items.length} filings, ${ok} ok / ${fail} skipped, fetchedAt=${out.fetchedAt}`);
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
