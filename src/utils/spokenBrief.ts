import type { TopChange } from '../data/topChanges';

const ORDINALS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

function signalWord(s: TopChange['signal']): string {
  switch (s) {
    case 'risk':
      return 'Risk';
    case 'support':
      return 'Support';
    case 'monitor':
      return 'Monitor';
    case 'noise':
      return 'Noise';
  }
}

function spokenAffected(affected: string[]): string {
  const safe = affected
    .map((a) => a.replace(/&/g, 'and').replace(/\bINR\b/, 'rupee').trim())
    .filter(Boolean);
  if (safe.length === 0) return '';
  if (safe.length === 1) return safe[0];
  if (safe.length === 2) return `${safe[0]} and ${safe[1]}`;
  if (safe.length === 3) return `${safe[0]}, ${safe[1]}, and ${safe[2]}`;
  return `${safe[0]}, ${safe[1]}, ${safe[2]}, and others`;
}

/**
 * Build the spoken script — kept deliberately short. Reads only
 * "Daily Market Pulse by Munshot. Today's top five things." followed
 * by the five changes (rank, headline, signal, affected, action).
 * No Pulse Brief headline, no tab summaries, no metadata.
 */
export function buildSpokenBrief(changes: TopChange[]): string {
  const intro = `Daily Market Pulse by Munshot. Today's top five things.`;
  const lines = changes.slice(0, 5).map((c) => {
    const parts = [
      `${ORDINALS[c.rank - 1] || c.rank}. ${c.headline}.`,
      `Signal: ${signalWord(c.signal)}.`,
    ];
    const aff = spokenAffected(c.affected);
    if (aff) parts.push(`Affected: ${aff}.`);
    if (c.action) parts.push(`Action: ${c.action}.`);
    return parts.join(' ');
  });
  return [intro, ...lines].join(' ');
}
