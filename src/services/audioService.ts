// Frontend audio service — premium TTS layer.
//
// Calls the Cloudflare Worker /api/tts endpoint when VITE_AUDIO_MODE
// is 'premium'. Returns null in any other case so the caller can fall
// back to the browser Web Speech API gracefully.
//
// Per-session in-memory cache by script hash means repeated clicks on
// the same Top 5 don't re-hit the Worker.

interface AudioResult {
  url: string;
}

const sessionCache = new Map<string, string>();

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 32);
}

function premiumEnabled(): boolean {
  // import.meta.env is statically replaced by Vite at build time.
  const mode = (import.meta.env.VITE_AUDIO_MODE ?? 'browser').toLowerCase();
  return mode === 'premium';
}

/**
 * Try to generate premium TTS for the given script.
 * Returns a playable Blob URL on success, or null when the caller
 * should fall back to browser speech (no premium mode, no API key,
 * provider error, network error, etc.). Never throws.
 */
export async function generateTopFiveAudio(
  script: string
): Promise<AudioResult | null> {
  if (!premiumEnabled() || !script.trim()) return null;

  const key = await sha256Hex(script);
  const cached = sessionCache.get(key);
  if (cached) return { url: cached };

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ script }),
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size === 0) return null;
    const url = URL.createObjectURL(blob);
    sessionCache.set(key, url);
    return { url };
  } catch {
    return null;
  }
}

/** Free a previously-issued Blob URL when the consumer is done with it. */
export function revokeAudio(url: string | null | undefined): void {
  if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
}
