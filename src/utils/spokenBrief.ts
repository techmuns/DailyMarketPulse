import type { PulseBrief } from '../data/pulseBriefs';
import type { TopChange } from '../data/topChanges';
import type { TabKey } from '../components/TopNav';

const ORDINALS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

function signalWord(s: TopChange['signal']): string {
  switch (s) {
    case 'risk': return 'Risk';
    case 'support': return 'Support';
    case 'monitor': return 'Monitor';
    case 'noise': return 'Noise';
  }
}

function spokenAffected(affected: string[]): string {
  const safe = affected
    .map((a) => a.replace(/&/g, 'and').replace(/\bINR\b/, 'rupee').trim())
    .filter(Boolean);
  if (safe.length === 0) return '';
  if (safe.length <= 3) {
    if (safe.length === 1) return safe[0];
    if (safe.length === 2) return `${safe[0]} and ${safe[1]}`;
    return `${safe[0]}, ${safe[1]}, and ${safe[2]}`;
  }
  return `${safe[0]}, ${safe[1]}, ${safe[2]}, and others`;
}

/**
 * Build the spoken-audio script for a tab.
 * - Intro line
 * - Tab's Pulse Brief headline + bullets
 * - Top 5 What Changed Since Yesterday (rank, headline, signal,
 *   affected, action)
 *
 * The text is kept short and investor-friendly — no table column
 * names, no metadata, no ticker noise beyond three names.
 */
export function buildSpokenBrief(
  tabKey: TabKey,
  brief: PulseBrief,
  changes: TopChange[]
): string {
  const intro = `Daily Market Pulse by Munshot. ${tabKey} brief.`;
  const briefPart = [
    brief.headline,
    ...brief.bullets,
  ].join(' ');
  const changesIntro = 'Top five changes since yesterday.';
  const changeLines = changes.slice(0, 5).map((c) => {
    const parts = [
      `${ORDINALS[c.rank - 1] || c.rank}. ${c.headline}.`,
      `Signal: ${signalWord(c.signal)}.`,
    ];
    const aff = spokenAffected(c.affected);
    if (aff) parts.push(`Affected: ${aff}.`);
    if (c.action) parts.push(`Action: ${c.action}.`);
    return parts.join(' ');
  });
  return [intro, briefPart, changesIntro, ...changeLines].join(' ');
}
