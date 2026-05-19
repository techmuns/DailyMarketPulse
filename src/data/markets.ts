// MOCK DATA — Market indices, sectors, movers
import type { MarketIndex, SectorMove } from '../types';

export const indices: MarketIndex[] = [
  {
    id: 'i-nifty',
    title: 'NIFTY 50',
    region: 'India',
    category: 'index',
    current: 24812.4,
    previous: 24868.1,
    trend: { d1: -0.22, d5: 0.6, m1: 1.4, spark: [24620, 24680, 24752, 24868, 24820, 24800, 24812] },
    signal: 'monitor',
    impact: 80,
    affected: ['Broader market'],
    whyShown: 'Flat-to-soft; rotation underneath.',
    source: 'Reliable media',
    confidence: 90,
    timestamp: '2026-05-19T08:25:00+05:30',
  },
  {
    id: 'i-sensex',
    title: 'SENSEX',
    region: 'India',
    category: 'index',
    current: 81542.0,
    previous: 81720.0,
    trend: { d1: -0.22, d5: 0.5, m1: 1.3, spark: [80910, 81200, 81450, 81720, 81620, 81580, 81542] },
    signal: 'monitor',
    impact: 78,
    affected: ['Broader market'],
    whyShown: 'Mirroring NIFTY; financials drag, IT supports.',
    source: 'Reliable media',
    confidence: 90,
    timestamp: '2026-05-19T08:25:00+05:30',
  },
  {
    id: 'i-niftym',
    title: 'NIFTY Midcap 100',
    region: 'India',
    category: 'index',
    current: 56210.0,
    previous: 56080.0,
    trend: { d1: 0.23, d5: 1.4, m1: 3.6, spark: [54900, 55280, 55700, 56080, 56120, 56180, 56210] },
    signal: 'support',
    impact: 60,
    affected: ['Mid-caps'],
    whyShown: 'Midcaps quietly outperforming large-caps.',
    source: 'Reliable media',
    confidence: 80,
    timestamp: '2026-05-19T08:25:00+05:30',
    changeStrip: 'Support improved',
  },
  {
    id: 'i-spx',
    title: 'S&P 500 (overnight)',
    region: 'US',
    category: 'index',
    current: 5612.0,
    previous: 5590.0,
    trend: { d1: 0.39, d5: 1.1, m1: 2.4, spark: [5480, 5520, 5560, 5590, 5598, 5608, 5612] },
    signal: 'support',
    impact: 55,
    affected: ['Global risk-on'],
    whyShown: 'Mild US risk-on; supports IT and EM tone.',
    source: 'Reliable media',
    confidence: 85,
    timestamp: '2026-05-19T08:25:00+05:30',
  },
  {
    id: 'i-vix',
    title: 'India VIX',
    region: 'India',
    category: 'volatility',
    current: 13.4,
    previous: 13.9,
    trend: { d1: -3.6, d5: -8.0, m1: -16.0, spark: [16.0, 15.2, 14.5, 13.9, 13.7, 13.5, 13.4] },
    signal: 'support',
    impact: 50,
    affected: ['Broader market'],
    whyShown: 'Volatility cooling — risk appetite improving.',
    source: 'Reliable media',
    confidence: 80,
    timestamp: '2026-05-19T08:25:00+05:30',
    changeStrip: 'Support improved',
  },
];

export const sectors: SectorMove[] = [
  { id: 's-it', title: 'IT Services', sector: 'IT', category: 'sector', current: 1.1, previous: 0, trend: { d1: 1.1, d5: 2.4, m1: 4.2, spark: [-0.2, 0.4, 0.8, 1.0, 1.05, 1.08, 1.1] }, signal: 'support', impact: 65, affected: ['INFY', 'TCS', 'WIPRO'], whyShown: 'FX tailwind + dovish US yields.', source: 'Reliable media', confidence: 78, timestamp: '2026-05-19T08:25:00+05:30' },
  { id: 's-banks', title: 'Banks', sector: 'Banks', category: 'sector', current: -0.4, previous: 0, trend: { d1: -0.4, d5: 0.3, m1: 1.1, spark: [-0.2, 0.2, 0.1, 0.0, -0.1, -0.3, -0.4] }, signal: 'monitor', impact: 60, affected: ['HDFCB', 'ICICIB'], whyShown: 'Profit-booking after recent run.', source: 'Reliable media', confidence: 72, timestamp: '2026-05-19T08:25:00+05:30' },
  { id: 's-auto', title: 'Autos', sector: 'Autos', category: 'sector', current: -1.2, previous: -0.6, trend: { d1: -1.2, d5: -2.6, m1: -4.1, spark: [0.5, -0.1, -0.4, -0.6, -0.9, -1.05, -1.2] }, signal: 'risk', impact: 70, affected: ['M&M', 'MARUTI', 'TATAMTR'], whyShown: 'INR weak + steel firm = double cost squeeze.', source: 'Reliable media', confidence: 78, timestamp: '2026-05-19T08:25:00+05:30', changeStrip: 'Risk increased' },
  { id: 's-fmcg', title: 'FMCG', sector: 'FMCG', category: 'sector', current: 0.2, previous: 0.1, trend: { d1: 0.2, d5: 0.5, m1: 0.8, spark: [-0.1, 0, 0.05, 0.1, 0.15, 0.18, 0.2] }, signal: 'monitor', impact: 45, affected: ['HUL', 'ITC', 'NESTLE'], whyShown: 'Quiet day; CPO and crude watch.', source: 'Reliable media', confidence: 65, timestamp: '2026-05-19T08:25:00+05:30' },
  { id: 's-pharma', title: 'Pharma', sector: 'Pharma', category: 'sector', current: 0.6, previous: 0.3, trend: { d1: 0.6, d5: 1.2, m1: 2.8, spark: [0.1, 0.2, 0.25, 0.3, 0.45, 0.55, 0.6] }, signal: 'support', impact: 50, affected: ['SUNPHARMA', 'DIVIS'], whyShown: 'US generics pricing stabilising.', source: 'Reliable media', confidence: 70, timestamp: '2026-05-19T08:25:00+05:30' },
  { id: 's-metals', title: 'Metals', sector: 'Metals', category: 'sector', current: 1.4, previous: 0.7, trend: { d1: 1.4, d5: 3.1, m1: 6.4, spark: [-0.2, 0.4, 0.6, 0.7, 1.0, 1.2, 1.4] }, signal: 'support', impact: 55, affected: ['TATAST', 'HINDALCO'], whyShown: 'LME copper/alu firm; weak USD intraday.', source: 'Reliable media', confidence: 72, timestamp: '2026-05-19T08:25:00+05:30', changeStrip: 'Repeated theme' },
  { id: 's-energy', title: 'Energy', sector: 'Energy', category: 'sector', current: -0.5, previous: -0.2, trend: { d1: -0.5, d5: -1.0, m1: -1.4, spark: [0.1, -0.1, -0.15, -0.2, -0.3, -0.4, -0.5] }, signal: 'monitor', impact: 50, affected: ['RIL', 'ONGC'], whyShown: 'Refining margin watch.', source: 'Reliable media', confidence: 65, timestamp: '2026-05-19T08:25:00+05:30' },
  { id: 's-realty', title: 'Realty', sector: 'Realty', category: 'sector', current: 1.6, previous: 0.4, trend: { d1: 1.6, d5: 2.8, m1: 5.4, spark: [-0.1, 0.2, 0.3, 0.4, 0.9, 1.3, 1.6] }, signal: 'support', impact: 48, affected: ['DLF', 'GODREJPROP'], whyShown: 'Liquidity + rate path improving.', source: 'Reliable media', confidence: 72, timestamp: '2026-05-19T08:25:00+05:30', changeStrip: 'Support improved' },
];

export const breadth = {
  advancers: 28,
  decliners: 22,
  unchanged: 0,
  newHighs: 14,
  newLows: 3,
  aboveSMA50: 64,
  aboveSMA200: 72,
};

export interface MoverItem {
  ticker: string;
  name: string;
  pct: number;
  reason: string;
  scope: 'portfolio' | 'watchlist' | 'broader';
  volumeX?: number;
}

export const gainers: MoverItem[] = [
  { ticker: 'DMART', name: 'Avenue Supermarts', pct: 1.02, reason: 'Unusual volume; quiet accumulation.', scope: 'watchlist', volumeX: 1.8 },
  { ticker: 'INFY', name: 'Infosys', pct: 1.39, reason: 'INR tailwind; sector strength.', scope: 'portfolio' },
  { ticker: 'TCS', name: 'TCS', pct: 0.97, reason: 'Sector momentum.', scope: 'portfolio' },
  { ticker: 'TITAN', name: 'Titan', pct: 0.74, reason: 'Gold tailwind.', scope: 'portfolio' },
];

export const losers: MoverItem[] = [
  { ticker: 'M&M', name: 'Mahindra & Mahindra', pct: -1.94, reason: 'FX + steel cost squeeze.', scope: 'portfolio' },
  { ticker: 'ASIANP', name: 'Asian Paints', pct: -1.51, reason: 'Crude firm; TiO2 pressure.', scope: 'portfolio' },
  { ticker: 'ZOMATO', name: 'Zomato', pct: -1.84, reason: 'Quick-commerce competition.', scope: 'watchlist' },
  { ticker: 'BAJFIN', name: 'Bajaj Finance', pct: -1.09, reason: 'NBFC group weakness.', scope: 'portfolio' },
];

export const unusualVolume: MoverItem[] = [
  { ticker: 'DMART', name: 'Avenue Supermarts', pct: 1.02, reason: '1.8x avg volume — quiet accumulation.', scope: 'watchlist', volumeX: 1.8 },
  { ticker: 'PIDIL', name: 'Pidilite', pct: -1.23, reason: '1.4x avg volume — corrected without news.', scope: 'watchlist', volumeX: 1.4 },
  { ticker: 'TATAST', name: 'Tata Steel', pct: 1.7, reason: '1.6x avg volume — metals strength.', scope: 'broader', volumeX: 1.6 },
];

export const marketTemperature: {
  status: 'risk-on' | 'risk-off' | 'mixed';
  oneLine: string;
  spark: number[];
} = {
  status: 'mixed',
  oneLine: 'Risk-on under the surface — IT, metals, midcaps lead; autos and NBFC lag.',
  spark: [49, 52, 54, 55, 53, 56, 58],
};
