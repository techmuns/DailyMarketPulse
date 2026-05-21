// MOCK DATA — Top 5 "What Changed Since Yesterday".
// Shared between the Today feed table and the spoken Pulse Brief.

import type { Signal } from '../types';

export interface TopChange {
  rank: number;
  headline: string;
  signal: Signal;
  affected: string[];
  action?: string;
  meaning?: string;
}

// Top 5 = AI-ranked biggest market-moving news of the day across all
// dimensions (global, macro, FX, commodity, sector, single stock).
// Ordered by overall importance, not by theme.
export const topChanges: TopChange[] = [
  {
    rank: 1,
    headline: 'India CPI cools to 4.62 percent, lifting rate-cut visibility',
    signal: 'support',
    affected: ['Banks', 'NBFC', 'Real Estate'],
    action: 'Monitor rate-sensitive names',
    meaning: 'Rate Support',
  },
  {
    rank: 2,
    headline: 'US 10 year yields ease back below 4.45 percent on softer PMI',
    signal: 'support',
    affected: ['IT Services', 'EM Equities'],
    action: 'Watch IT exporter follow-through',
    meaning: 'Global Tailwind',
  },
  {
    rank: 3,
    headline: 'USD INR weakness is now a durable five day trend',
    signal: 'risk',
    affected: ['Auto', 'Paints', 'IT Services'],
    action: 'Update FX overlay',
    meaning: 'FX Pressure',
  },
  {
    rank: 4,
    headline: 'Brent crude firms above 84 dollars on supply concerns',
    signal: 'risk',
    affected: ['Paints', 'Aviation', 'Refining'],
    action: 'Stress-test input costs',
    meaning: 'Input Cost ↑',
  },
  {
    rank: 5,
    headline: 'NBFCs see unsecured retail growth moderate as RBI risk weights bite',
    signal: 'monitor',
    affected: ['HDFC Bank', 'Bajaj Finance', 'Axis Bank'],
    action: 'Watch credit-cost commentary',
    meaning: 'Credit Watch',
  },
];
