// MOCK DATA — Pulse Brief per tab.
// Short analyst-style summary that opens each tab.
import type { Tone } from '../utils/tone';
import type { TabKey } from '../components/TopNav';

export interface PulseBrief {
  headline: string;
  bullets: string[];
  tone: Tone;
}

export const pulseBriefs: Record<TabKey, PulseBrief> = {
  Today: {
    headline: 'Risk-on under the surface, but autos and paints are dragging.',
    bullets: [
      'INR weakness is now a 5-day trend.',
      'CPI cooled to 4.62% — rate-cut visibility improves.',
      'Asian Paints filing eases crude pass-through worry.',
    ],
    tone: 'ai',
  },
  Macro: {
    headline: 'Disinflation continues, liquidity is improving.',
    bullets: [
      'India CPI cooled to 4.62%; US 10Y yield ticked lower.',
      'Surplus liquidity returned to ₹32.5k cr — funding costs ease.',
      'Net macro tilt is mildly supportive for rate-sensitive sectors.',
    ],
    tone: 'support',
  },
  Markets: {
    headline: 'Market breadth is mixed, but midcaps are quietly leading.',
    bullets: [
      'NIFTY is flat; midcaps and metals are outperforming.',
      'Portfolio movers concentrated in autos and IT.',
      'Watch unusual-volume names — quiet accumulation patterns.',
    ],
    tone: 'monitor',
  },
  Currency: {
    headline: 'INR weakness is becoming a trend.',
    bullets: [
      'USD/INR is moving higher over five sessions.',
      'Import-heavy names face landed cost pressure.',
      'IT and pharma exporters may pick up a revenue tailwind.',
    ],
    tone: 'risk',
  },
  Commodities: {
    headline: 'Input-cost pressure is rising.',
    bullets: [
      'Brent and industrial metals are firming.',
      'Autos, paints, and FMCG face margin pressure.',
      'Gold remains a support signal for jewellery exposure.',
    ],
    tone: 'risk',
  },
  'News & Filings': {
    headline: 'New filings and company updates need review.',
    bullets: [
      'Prioritise official filings first; opinion items stay quiet.',
      'Portfolio-linked news ranks above broader market chatter.',
      'Asian Paints price-hike filing is the headline of the morning.',
    ],
    tone: 'monitor',
  },
  Portfolio: {
    headline: 'Your book is slightly under pressure today.',
    bullets: [
      'M&M is the biggest drag — FX plus steel cost squeeze.',
      'Infosys is providing support on the IT exporter tailwind.',
      'FX and commodities are the dominant drivers, not stock-specific news.',
    ],
    tone: 'risk',
  },
  Watchlist: {
    headline: 'A few setups are quietly building.',
    bullets: [
      'DMART is up on 1.8x volume with no news — quiet accumulation.',
      'Pidilite corrected without negative news — opportunity worth reviewing.',
      'Zomato risk is rising on quick-commerce competitive intensity.',
    ],
    tone: 'support',
  },
  Events: {
    headline: 'Two events tomorrow touch your book directly.',
    bullets: [
      'Asian Paints Q4 result and US CPI release land tomorrow.',
      'RBI minutes and Infosys Investor Day later this week.',
      'Prepare follow-up questions for the Asian Paints concall.',
    ],
    tone: 'monitor',
  },
  Actions: {
    headline: 'Five open items need triage before market open.',
    bullets: [
      'Update Asian Paints thesis on the price-hike filing.',
      'Assign FX sensitivity follow-up across the book.',
      'Escalate auto sector cost squeeze to the PM.',
    ],
    tone: 'ai',
  },
};
