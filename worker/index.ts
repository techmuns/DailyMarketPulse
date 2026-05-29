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
  MUNS_ACCESS_TOKEN?: string;
}

const MAX_SCRIPT_BYTES = 4 * 1024; // ~4 KB cap

// Static user index required by the MUNS stock search API.
const STOCK_SEARCH_USER_INDEX = 124;
const STOCK_SEARCH_URL = 'https://devde.muns.io/stock/search';

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/api/tts') {
      if (req.method !== 'POST') {
        return json({ ok: false, reason: 'method-not-allowed' }, 405);
      }
      return handleTTS(req, env, ctx);
    }
    if (url.pathname === '/api/stock/search') {
      if (req.method !== 'POST') {
        return json({ ok: false, reason: 'method-not-allowed' }, 405);
      }
      return handleStockSearch(req, env);
    }
    return env.ASSETS.fetch(req);
  },
};

// Proxies stock search queries to the MUNS API, attaching the bearer
// token from the Worker environment so it never reaches the browser.
async function handleStockSearch(req: Request, env: Env): Promise<Response> {
  if (!env.MUNS_ACCESS_TOKEN) {
    return json({ success: false, message: 'no-token' }, 503);
  }

  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: 'bad-json' }, 400);
  }
  const query = (body.query ?? '').trim();
  if (!query) return json({ success: false, message: 'empty-query' }, 400);

  let upstream: Response;
  try {
    upstream = await fetch(STOCK_SEARCH_URL, {
      method: 'POST',
      headers: {
        accept: '*/*',
        authorization: `Bearer ${env.MUNS_ACCESS_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query, user_index: STOCK_SEARCH_USER_INDEX }),
    });
  } catch (err) {
    console.error('stock search upstream error:', err);
    return json({ success: false, message: 'upstream-error' }, 502);
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { 'content-type': 'application/json' },
  });
}

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
