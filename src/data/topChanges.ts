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

export const topChanges: TopChange[] = [
  {
    rank: 1,
    headline: 'M&M faces FX and steel cost pressure',
    signal: 'risk',
    affected: ['M&M'],
    action: 'Assign follow-up',
    meaning: 'Margin Risk',
  },
  {
    rank: 2,
    headline: 'India CPI cools to 4.62 percent',
    signal: 'support',
    affected: ['HDFC Bank', 'Bajaj Finance', 'Real Estate'],
    action: 'Monitor rate-sensitive names',
    meaning: 'Rate Support',
  },
  {
    rank: 3,
    headline: 'USD INR weakness is now a five day trend',
    signal: 'risk',
    affected: ['M&M', 'Asian Paints', 'Infosys', 'TCS'],
    action: 'Add to thesis',
    meaning: 'FX Pressure',
  },
  {
    rank: 4,
    headline: 'Asian Paints announces a zero point six percent selective price hike',
    signal: 'support',
    affected: ['Asian Paints'],
    action: 'Update thesis',
    meaning: 'Input Cost Relief',
  },
  {
    rank: 5,
    headline: 'DMart saw one point eight times average volume with no major news',
    signal: 'monitor',
    affected: ['DMart'],
    action: 'Read later',
    meaning: 'Volume Breakout',
  },
];
