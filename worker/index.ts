// Cloudflare Worker — serves the SPA assets and a premium TTS
// endpoint at POST /api/tts.
//
// Secrets (set via `wrangler secret put`):
//   TTS_API_KEY   — required for premium audio
//   TTS_PROVIDER  — optional, defaults to "openai"
//
// When TTS_API_KEY is unset, /api/tts replies with HTTP 503 and the
// frontend falls back to browser Web Speech API silently.

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  TTS_API_KEY?: string;
  TTS_PROVIDER?: string;
}

const MAX_SCRIPT_BYTES = 4 * 1024; // ~4 KB cap

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/api/tts') {
      if (req.method !== 'POST') {
        return json({ ok: false, reason: 'method-not-allowed' }, 405);
      }
      return handleTTS(req, env, ctx);
    }
    if (url.pathname === '/api/quote') {
      if (req.method !== 'GET') {
        return json({ ok: false, reason: 'method-not-allowed' }, 405);
      }
      return handleQuote(req, ctx);
    }
    return env.ASSETS.fetch(req);
  },
};

/* ---------- Yahoo quote proxy ---------- */
//
// GET /api/quote?ticker=RELIANCE.NS
//
// Fetches Yahoo's chart endpoint server-side (browsers can't reach
// it due to CORS + cookie/crumb requirements). Returns:
//   { ok: true, ticker, current, trend: { d1, d5, m1, spark } }
//
// Edge-cached per ticker for 5 minutes. Used by the "Add holding"
// flow on Book/Watchlist to fetch live prices for user-added tickers
// without waiting for the next refresh-data workflow run.

const QUOTE_CACHE_S = 5 * 60;

async function handleQuote(req: Request, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(req.url);
  const raw = (url.searchParams.get('ticker') ?? '').trim();
  if (!raw) return json({ ok: false, reason: 'missing-ticker' }, 400);
  if (raw.length > 32 || !/^[A-Za-z0-9.^=&_-]+$/.test(raw)) {
    return json({ ok: false, reason: 'bad-ticker' }, 400);
  }
  const ticker = raw.toUpperCase();

  const cacheKey = new Request(`https://internal.quote/v1/${encodeURIComponent(ticker)}`, { method: 'GET' });
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) {
    const r = new Response(cached.body, cached);
    r.headers.set('x-cache', 'hit');
    return r;
  }

  let result: { current: number; trend: { d1: number; d5: number; m1: number; spark: number[] } };
  try {
    result = await fetchYahooChart(ticker);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`quote ${ticker} failed:`, msg);
    return json({ ok: false, reason: 'fetch-failed', detail: msg.slice(0, 200) }, 502);
  }

  const resp = new Response(
    JSON.stringify({ ok: true, ticker, ...result, fetchedAt: new Date().toISOString() }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': `public, max-age=${QUOTE_CACHE_S}`,
        'x-cache': 'miss',
      },
    },
  );
  ctx.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}

async function fetchYahooChart(ticker: string) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 45 * 24 * 60 * 60;
  const chartUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${start}&period2=${end}&interval=1d`;

  const ua =
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';
  const res = await fetch(chartUrl, {
    headers: { 'User-Agent': ua, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`yahoo http ${res.status}`);
  }
  const data = (await res.json()) as any;
  const r = data?.chart?.result?.[0];
  const closes: unknown[] = r?.indicators?.quote?.[0]?.close ?? [];
  const valid = closes.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (valid.length < 2) throw new Error(`only ${valid.length} valid closes`);

  const round = (v: number) => Math.round(v * 100) / 100;
  const pct = (a: number, b: number) => (b === 0 ? 0 : ((a - b) / b) * 100);
  const last = valid[valid.length - 1];
  const prev1 = valid[valid.length - 2] ?? last;
  const prev5 = valid[valid.length - 6] ?? valid[0];
  const prev1m = valid[0];
  return {
    current: round(last),
    trend: {
      d1: round(pct(last, prev1)),
      d5: round(pct(last, prev5)),
      m1: round(pct(last, prev1m)),
      spark: valid.slice(-7).map(round),
    },
  };
}

/* ---------- TTS ---------- */

async function handleTTS(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (!env.TTS_API_KEY) {
    return json({ ok: false, reason: 'no-key' }, 503);
  }

  let body: { script?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, reason: 'bad-json' }, 400);
  }
  const script = (body.script ?? '').trim();
  if (!script) return json({ ok: false, reason: 'empty-script' }, 400);
  if (new TextEncoder().encode(script).byteLength > MAX_SCRIPT_BYTES) {
    return json({ ok: false, reason: 'script-too-large' }, 413);
  }

  const hash = await sha256Hex(script);
  const cacheKey = new Request(`https://internal.tts/v1/${hash}`, { method: 'GET' });
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) {
    const r = new Response(cached.body, cached);
    r.headers.set('x-cache', 'hit');
    return r;
  }

  let audio: Uint8Array;
  try {
    audio = await synthesise(env, script);
  } catch (err) {
    console.error('TTS provider error:', err);
    return json({ ok: false, reason: 'provider-error' }, 502);
  }

  const resp = new Response(audio, {
    status: 200,
    headers: {
      'content-type': 'audio/mpeg',
      'cache-control': 'public, max-age=86400',
      'x-cache': 'miss',
    },
  });
  ctx.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}

/* ---------- Provider abstraction ---------- */

async function synthesise(env: Env, script: string): Promise<Uint8Array> {
  const provider = (env.TTS_PROVIDER ?? 'openai').toLowerCase();
  switch (provider) {
    case 'openai':
      return synthOpenAI(env.TTS_API_KEY!, script);
    case 'google':
      // TODO: implement Google Cloud Text-to-Speech.
      throw new Error('google provider not implemented');
    case 'elevenlabs':
      // TODO: implement ElevenLabs synthesis.
      throw new Error('elevenlabs provider not implemented');
    default:
      throw new Error(`unknown provider: ${provider}`);
  }
}

async function synthOpenAI(apiKey: string, script: string): Promise<Uint8Array> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      // Higher-quality model. `tts-1` works too if cost is a concern.
      model: 'tts-1-hd',
      // Bright, energetic female voice — closest to a market anchor.
      voice: 'nova',
      input: script,
      response_format: 'mp3',
      speed: 1.0,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '<no body>');
    throw new Error(`openai ${res.status}: ${text.slice(0, 200)}`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

/* ---------- helpers ---------- */

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}
