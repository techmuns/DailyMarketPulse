// Build the audio script for "Today's Top 5 Things".
// Produces a single prose paragraph suitable for both premium TTS
// and the browser-speech fallback. The tone is a human market anchor:
// short sentences, light transitions, no "Signal colon" recitals.

import type { TopChange } from '../data/topChanges';

const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth'];

function spokenAffected(affected: string[]): string {
  const safe = affected
    .map((a) => a.replace(/&/g, 'and').trim())
    .filter(Boolean);
  if (safe.length === 0) return '';
  if (safe.length === 1) return safe[0];
  if (safe.length === 2) return `${safe[0]} and ${safe[1]}`;
  if (safe.length === 3) return `${safe[0]}, ${safe[1]}, and ${safe[2]}`;
  return `${safe[0]}, ${safe[1]}, ${safe[2]}, and others`;
}

/**
 * Pick a sentence template based on the item's signal and meaning.
 * The goal is investor-voice prose, not metadata narration.
 */
function narrate(c: TopChange, idx: number): string {
  const lead = ORDINALS[idx] || `Item ${idx + 1}`;
  const aff = spokenAffected(c.affected);
  const action = c.action ? `The action is ${c.action.toLowerCase()}.` : '';
  const meaning = c.meaning ?? '';

  // FX
  if (c.signal === 'risk' && /fx/i.test(meaning)) {
    return `${lead}, ${decapFirst(c.headline)}. Import-heavy companies are under pressure, while exporters may pick up support. ${action}`.trim();
  }
  // Input cost up
  if (c.signal === 'risk' && /input cost/i.test(meaning)) {
    return `${lead}, ${decapFirst(c.headline)}. That raises input-cost pressure for ${aff || 'affected sectors'}. ${action}`.trim();
  }
  // Margin risk
  if (c.signal === 'risk' && /margin/i.test(meaning)) {
    return `${lead}, ${decapFirst(c.headline)}. Margin watch for ${aff || 'this name'}. ${action}`.trim();
  }
  // Generic risk
  if (c.signal === 'risk') {
    return `${lead}, ${decapFirst(c.headline)}. Risk for ${aff || 'affected names'}. ${action}`.trim();
  }

  // Rate support
  if (c.signal === 'support' && /rate/i.test(meaning)) {
    return `${lead}, ${decapFirst(c.headline)}. That supports rate-sensitive names like ${aff || 'banks and NBFCs'}. ${action}`.trim();
  }
  // Input cost relief
  if (c.signal === 'support' && /relief/i.test(meaning)) {
    return `${lead}, ${decapFirst(c.headline)}. Pass-through holds, easing worry for ${aff || 'affected names'}. ${action}`.trim();
  }
  // Generic support
  if (c.signal === 'support') {
    return `${lead}, ${decapFirst(c.headline)}. Reads positive for ${aff || 'affected names'}. ${action}`.trim();
  }

  // Volume breakout / monitor
  if (c.signal === 'monitor' && /volume/i.test(meaning)) {
    return `${lead}, ${decapFirst(c.headline)}. Treat this as a monitor signal, not a risk signal yet. ${action}`.trim();
  }
  if (c.signal === 'monitor') {
    return `${lead}, ${decapFirst(c.headline)}. Worth watching for now. ${action}`.trim();
  }

  // Noise / fallback
  return `${lead}, ${decapFirst(c.headline)}. ${action}`.trim();
}

function decapFirst(s: string): string {
  return s.length > 0 ? s[0].toLowerCase() + s.slice(1) : s;
}

export function buildTopFiveAudioScript(changes: TopChange[]): string {
  const intro = `Daily Market Pulse by Munshot. Here are today's top five things.`;
  const body = changes.slice(0, 5).map((c, i) => narrate(c, i));
  return [intro, ...body].join(' ');
}
