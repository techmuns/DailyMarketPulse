// Scrape supplemental India-market data from moneycontrol.com that
// yahoo-finance2 doesn't provide: FII/DII flows, NSE top gainers/losers,
// and the markets news feed.
//
// Writes public/data/moneycontrol.json. Each section is independent —
// a failure in one is logged and the JSON still ships with whatever
// succeeded. The frontend should treat any section as optional.
//
// No third-party deps: Node 22 native fetch + regex parsing. Selectors
// are best-effort against moneycontrol's current markup; if a section
// returns empty, the captured HTML excerpt in the Actions log is the
// fastest way to re-derive selectors.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'public', 'data', 'moneycontrol.json');

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-IN,en;q=0.9',
      'Cache-Control': 'no-cache',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.text();
}

function stripTags(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function toNumber(s) {
  if (s == null) return null;
  const cleaned = String(s).replace(/[,₹\s]/g, '').replace(/[%+]/g, '');
  if (cleaned === '' || cleaned === '-') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// ---------- FII / DII ----------
// Page: https://www.moneycontrol.com/stocks/marketstats/fii_dii_activity/index.php
// First data row of the activity table is the most recent day. Columns
// (after the date label): FII Gross Purchase, FII Gross Sales, FII Net,
// DII Gross Purchase, DII Gross Sales, DII Net.
async function fetchFiiDii() {
  const html = await fetchHtml(
    'https://www.moneycontrol.com/stocks/marketstats/fii_dii_activity/index.php',
  );

  const tableMatch = html.match(
    /<table[^>]*class="[^"]*mctable1[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
  );
  if (!tableMatch) throw new Error('fii/dii table not found');

  const rows = [...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (m) => stripTags(m[1]),
    );
    if (cells.length < 7) continue;
    const date = cells[0];
    const nums = cells.slice(1, 7).map(toNumber);
    if (nums.every((n) => n == null)) continue;
    const [fiiBuy, fiiSell, fiiNet, diiBuy, diiSell, diiNet] = nums;
    return {
      date,
      fii: { buy: fiiBuy, sell: fiiSell, net: fiiNet },
      dii: { buy: diiBuy, sell: diiSell, net: diiNet },
    };
  }
  throw new Error('fii/dii rows parsed but none had numbers');
}

// ---------- Top gainers / losers ----------
// Pages: /stocks/marketstats/nsegainer/index.html
//        /stocks/marketstats/nseloser/index.html
// Each row of the bhavcopy-style table is a stock; we keep top 10.
async function fetchMovers(kind /* 'gainer' | 'loser' */) {
  const url = `https://www.moneycontrol.com/stocks/marketstats/nse${kind}/index.html`;
  const html = await fetchHtml(url);

  const tableMatch = html.match(
    /<table[^>]*class="[^"]*(?:tbldata14|bsr_table)[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
  );
  if (!tableMatch) throw new Error(`${kind} table not found`);

  const out = [];
  const rows = [...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
    if (cells.length < 4) continue;
    const nameCell = cells[0][1];
    const symbolMatch = nameCell.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
    const name = stripTags(symbolMatch ? symbolMatch[1] : nameCell);
    if (!name) continue;

    const texts = cells.map((m) => stripTags(m[1]));
    const numericCells = texts.slice(1).map(toNumber);
    const price = numericCells.find((n) => n != null && n > 1);
    const changePct = numericCells.find(
      (n, i) => i > 0 && n != null && Math.abs(n) < 100,
    );

    out.push({ name, price: price ?? null, changePct: changePct ?? null });
    if (out.length >= 10) break;
  }

  if (out.length === 0) throw new Error(`${kind} rows parsed but none usable`);
  return out;
}

// ---------- News headlines ----------
// Page: /news/business/markets/
// Article cards have an <h2><a href=...>Title</a></h2> structure.
async function fetchNews() {
  const html = await fetchHtml(
    'https://www.moneycontrol.com/news/business/markets/',
  );

  const items = [];
  const re =
    /<li[^>]*class="[^"]*clearfix[^"]*"[^>]*>([\s\S]*?)<\/li>|<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/gi;

  // Primary: list items with article cards
  const listRe =
    /<li[^>]*class="clearfix"[^>]*>[\s\S]*?<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = listRe.exec(html)) !== null && items.length < 10) {
    const url = m[1];
    const title = stripTags(m[2]);
    if (!title || title.length < 10) continue;
    const tsMatch = m[3].match(/<span[^>]*>([^<]*\b(?:IST|AM|PM|hours? ago|min(?:ute)?s? ago)[^<]*)<\/span>/i);
    items.push({
      title,
      url: url.startsWith('http') ? url : `https://www.moneycontrol.com${url}`,
      publishedAt: tsMatch ? stripTags(tsMatch[1]) : null,
    });
  }

  if (items.length === 0) {
    // Fallback: any h2>a in the document
    const h2Re = /<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/gi;
    while ((m = h2Re.exec(html)) !== null && items.length < 10) {
      const url = m[1];
      const title = stripTags(m[2]);
      if (!title || title.length < 10) continue;
      if (!/moneycontrol\.com\/news\//.test(url)) continue;
      items.push({ title, url, publishedAt: null });
    }
  }

  if (items.length === 0) throw new Error('no news headlines parsed');
  return items;
}

// ---------- Orchestrator ----------
async function runSection(name, fn) {
  try {
    const data = await fn();
    console.log(`ok    ${name}`);
    return { status: 'ok', data };
  } catch (err) {
    const msg = err?.message ?? String(err);
    console.warn(`skip  ${name} — ${msg}`);
    return { status: 'error', error: msg };
  }
}

async function run() {
  const out = {
    fetchedAt: new Date().toISOString(),
    sources: {},
    fiiDii: null,
    gainers: null,
    losers: null,
    news: null,
  };

  const sections = [
    ['fiiDii', () => fetchFiiDii()],
    ['gainers', () => fetchMovers('gainer')],
    ['losers', () => fetchMovers('loser')],
    ['news', () => fetchNews()],
  ];

  let ok = 0;
  for (const [key, fn] of sections) {
    const result = await runSection(key, fn);
    out.sources[key] = result.status === 'ok'
      ? { status: 'ok' }
      : { status: 'error', error: result.error };
    if (result.status === 'ok') {
      out[key] = result.data;
      ok++;
    }
    await sleep(500); // be polite
  }

  if (ok === 0) {
    console.error('All moneycontrol sections failed — leaving existing JSON untouched.');
    process.exit(2);
  }

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n', 'utf8');

  console.log(
    `\nWrote ${path.relative(ROOT, OUT_FILE)}: ${ok}/${sections.length} sections, fetchedAt=${out.fetchedAt}`,
  );
}

run().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
