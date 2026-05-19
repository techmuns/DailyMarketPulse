// MOCK DATA — AI Signals
import type { AISignal } from '../types';

export const aiSignals: AISignal[] = [
  {
    id: 'ai-1',
    title: 'INR weakness becomes a 5-day trend',
    whatChanged:
      'USDINR has moved from 83.7 to 84.6 over five sessions, a sustained ~1% depreciation rather than a one-day spike.',
    whyItMatters:
      'Sustained INR weakness pressures import-cost-heavy sectors (autos, paints, edible oils) and supports IT/pharma exporters. Re-rating risk for importers if the trend persists into next quarter.',
    trendOrNoise: 'trend',
    affected: ['M&M', 'ASIANP', 'INFY', 'TCS', 'PI'],
    signal: 'risk',
    confidence: 82,
    source: 'Reliable media',
    suggestedActions: ['Add to thesis: importer cost watch', 'Re-check exporter weights', 'Assign FX sensitivity follow-up'],
    category: 'currency',
    timestamp: '2026-05-19T08:20:00+05:30',
    changeStrip: '5-day trend',
  },
  {
    id: 'ai-2',
    title: 'Asian Paints filing softens crude-cost worry',
    whatChanged:
      'BSE intimation announces selective 0.6% price revision; suggests pricing power retained as crude firms.',
    whyItMatters:
      'Pass-through capability reduces margin downside. Combined with stable demand, the risk leg of the thesis improves.',
    trendOrNoise: 'one-day-noise',
    affected: ['ASIANP'],
    signal: 'support',
    confidence: 76,
    source: 'Official filing',
    suggestedActions: ['Update thesis note', 'Hold / consider small add'],
    category: 'filings',
    timestamp: '2026-05-19T08:05:00+05:30',
    changeStrip: 'Changed since yesterday',
  },
  {
    id: 'ai-3',
    title: 'DMART — quiet accumulation pattern',
    whatChanged:
      'Avenue Supermarts trading 1.8x average volume with steady upticks across last three sessions, no news catalyst.',
    whyItMatters:
      'Pattern often precedes positioning by quality long-only funds. Watch for confirmation in next session.',
    trendOrNoise: 'building',
    affected: ['DMART'],
    signal: 'monitor',
    confidence: 64,
    source: 'Reliable media',
    suggestedActions: ['Add to watchlist priority', 'Read later: peer set check'],
    category: 'markets',
    timestamp: '2026-05-19T08:10:00+05:30',
    changeStrip: 'New today',
  },
  {
    id: 'ai-4',
    title: 'Auto sector — double cost squeeze',
    whatChanged:
      'INR weakness + HRC steel firming + aluminium up: three input lines moved against autos in the same week.',
    whyItMatters:
      'Margin guide could be at risk for FY27; OEM commentary on price action becomes critical at Q4 calls.',
    trendOrNoise: 'trend',
    affected: ['M&M', 'MARUTI', 'TATAMTR'],
    signal: 'risk',
    confidence: 78,
    source: 'Reliable media',
    suggestedActions: ['Assign follow-up: margin sensitivity', 'Re-read OEM commentary'],
    category: 'macro',
    timestamp: '2026-05-19T08:00:00+05:30',
    changeStrip: 'Repeated theme',
  },
  {
    id: 'ai-5',
    title: 'Liquidity surplus returning',
    whatChanged:
      'System liquidity flipped from deficit to ₹32.5k cr surplus. Money-market rates softening.',
    whyItMatters:
      'Funding costs ease for NBFCs and banks; supports credit growth and equity multiples for rate-sensitives.',
    trendOrNoise: 'trend',
    affected: ['HDFCB', 'BAJFIN', 'Real Estate'],
    signal: 'support',
    confidence: 84,
    source: 'Government source',
    suggestedActions: ['Add to thesis: NIM trajectory', 'Note for PM brief'],
    category: 'macro',
    timestamp: '2026-05-19T07:50:00+05:30',
    changeStrip: 'Support improved',
  },
];

export const featuredSignal = aiSignals[0];
