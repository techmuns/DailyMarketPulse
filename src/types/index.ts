// Daily Market Pulse — shared types
// NOTE: All data is mock/demo data, replaceable with live feeds later.

export type Signal = 'risk' | 'support' | 'monitor' | 'noise';
export type ChangeStrip =
  | 'New today'
  | 'Changed since yesterday'
  | 'Risk increased'
  | 'Support improved'
  | 'Repeated theme'
  | '5-day trend'
  | 'Action needed';

export type SourceLabel =
  | 'Official filing'
  | 'Company source'
  | 'Government source'
  | 'Reliable media'
  | 'Opinion'
  | 'Low confidence';

export type PriorityLens =
  | 'Global'
  | 'Sectoral'
  | 'Portfolio Related'
  | 'Custom';

export type LensType = 'global' | 'sectoral' | 'portfolio' | 'custom';

export interface LensHeadline {
  id: string;
  lensType: LensType;
  category: string;
  headline: string;
  shortContext: string;
  fullContext: string;
  whyItMatters: string;
  signal: Signal;
  affectedCompanies: string[];
  affectedSectors: string[];
  sourceType: SourceLabel;
  action: string;
  timestamp: string;
  url?: string;
}

export interface Trend {
  d1: number; // 1-day % change
  d5: number; // 5-day
  m1: number; // 1-month
  spark: number[]; // small series for sparkline
}

export interface BaseItem {
  id: string;
  title: string;
  category: string;
  current?: number | string;
  previous?: number | string;
  trend?: Trend;
  signal: Signal;
  impact: number; // 0..100
  affected: string[]; // company tickers or sector names
  whyShown: string;
  source: SourceLabel;
  confidence: number; // 0..100
  timestamp: string;
  action?: string;
  changeStrip?: ChangeStrip;
}

export interface Holding extends BaseItem {
  ticker: string;
  sector: string;
  weight: number; // % of portfolio
  thesis: string;
}

export interface MacroIndicator extends BaseItem {
  unit?: string;
  region?: string;
}

export interface Currency extends BaseItem {
  pair: string;
}

export interface Commodity extends BaseItem {
  unit: string;
}

export interface MarketIndex extends BaseItem {
  region: string;
}

export interface SectorMove extends BaseItem {
  sector: string;
}

export interface NewsItem extends BaseItem {
  summary: string;
  url?: string;
  scope: 'portfolio' | 'watchlist' | 'broader';
}

export interface Filing extends BaseItem {
  filingType: string;
  company: string;
  summary: string;
}

export interface EventItem extends BaseItem {
  when: 'today' | 'tomorrow' | 'this-week';
  eventType: 'result' | 'concall' | 'policy' | 'macro' | 'corporate';
  company?: string;
}

export interface AISignal {
  id: string;
  title: string;
  whatChanged: string;
  whyItMatters: string;
  trendOrNoise: 'trend' | 'one-day-noise' | 'building';
  affected: string[];
  signal: Signal;
  confidence: number;
  source: SourceLabel;
  suggestedActions: string[];
  category: string;
  timestamp: string;
  changeStrip?: ChangeStrip;
}

export interface ActionItem {
  id: string;
  title: string;
  context: string;
  type:
    | 'Add to thesis'
    | 'Assign follow-up'
    | 'Read later'
    | 'Mark noise'
    | 'Escalate to PM';
  status: 'open' | 'in-progress' | 'reviewed' | 'completed';
  owner: string;
  createdAt: string;
  related?: string[];
}
