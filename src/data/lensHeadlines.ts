// MOCK DATA — Lens-driven headline strip on the Today tab.
// Each item is filtered by `lensType` when the user picks a Priority Lens.
import type { LensHeadline } from '../types';

export const lensHeadlines: LensHeadline[] = [
  // ---------------- GLOBAL ----------------
  {
    id: 'g-1',
    lensType: 'global',
    category: 'Global rates',
    headline: 'US 10Y yields climb as Fed cut expectations cool',
    shortContext: 'Higher yields may pressure EM flows and rate-sensitive sectors.',
    fullContext:
      'The US 10-year yield pushed back above 4.45% after stronger-than-expected services PMI data caused traders to dial back near-term Fed cut probabilities. EM equity funds have already seen two consecutive weeks of outflows; INR drift and a softer NIFTY bank index reflect the same tape.',
    whyItMatters:
      'Indian banks, NBFCs, and rate-sensitive consumer credit names sit at the front of the queue if yields stay sticky. A 25 bps further move could re-price the NIFTY 50 earnings yield gap.',
    signal: 'monitor',
    affectedCompanies: ['HDFCB', 'BAJFIN', 'KOTAKBANK'],
    affectedSectors: ['Banks', 'NBFC', 'Real estate'],
    sourceType: 'Reliable media',
    action: 'Watch INR + bank index together',
    timestamp: '07:42 IST',
  },
  {
    id: 'g-2',
    lensType: 'global',
    category: 'US markets',
    headline: 'S&P 500 closes at record on AI capex re-acceleration',
    shortContext: 'Hyperscaler guidance lifts global tech sentiment overnight.',
    fullContext:
      'Microsoft, Alphabet and Meta all guided FY capex higher on the most recent prints, reinforcing the AI infrastructure spend cycle. The Nasdaq 100 added 1.4% with semiconductors leading.',
    whyItMatters:
      'Positive read-through for India IT large-caps via deal pipeline rhetoric and for select semicap-adjacent names. Watch for ADR follow-through at the India open.',
    signal: 'support',
    affectedCompanies: ['INFY', 'TCS', 'HCLTECH', 'TECHM'],
    affectedSectors: ['IT services', 'Semiconductors'],
    sourceType: 'Reliable media',
    action: 'Look for IT exporter follow-through',
    timestamp: '06:55 IST',
  },
  {
    id: 'g-3',
    lensType: 'global',
    category: 'China',
    headline: 'China property stimulus disappoints on size',
    shortContext: 'Headline support package below market expectations; metals soften.',
    fullContext:
      'The Politburo readout signalled additional liquidity for property developers but stopped short of a balance-sheet repair package. SHFE copper -1.2%, iron ore -2.0%.',
    whyItMatters:
      'Negative read-through for Indian metals (steel + base) and a mild tailwind for input-cost-sensitive autos and capital goods.',
    signal: 'risk',
    affectedCompanies: ['TATASTEEL', 'JSWSTEEL', 'HINDALCO'],
    affectedSectors: ['Metals', 'Mining'],
    sourceType: 'Reliable media',
    action: 'Reduce conviction on metals beta',
    timestamp: '06:30 IST',
  },
  {
    id: 'g-4',
    lensType: 'global',
    category: 'Commodities',
    headline: 'Brent crude firms above $84 on supply discipline',
    shortContext: 'OPEC+ rhetoric tightens; input-cost pressure resumes for paints, aviation.',
    fullContext:
      'Brent +1.8% overnight as OPEC+ officials signalled continued discipline through Q3. US crude inventories also drew more than expected.',
    whyItMatters:
      'Asian Paints, aviation, and select FMCG names face renewed input-cost headwinds. Watch USD/INR — typically firms with crude into EM importer drag.',
    signal: 'risk',
    affectedCompanies: ['ASIANP', 'INDIGO', 'HINDPETRO'],
    affectedSectors: ['Paints', 'Aviation', 'Oil marketing'],
    sourceType: 'Reliable media',
    action: 'Add to thesis: input-cost watchlist',
    timestamp: '06:10 IST',
  },
  {
    id: 'g-5',
    lensType: 'global',
    category: 'Geopolitics',
    headline: 'Red Sea shipping disruption returns to multi-month high',
    shortContext: 'Container rates spike; freight costs creep back into FY guidance.',
    fullContext:
      'Drewry WCI is +18% week-on-week on renewed Red Sea routing. Larger forwarders are warning of 4–6 week delivery slippage on Europe-bound goods.',
    whyItMatters:
      'Watch for guidance commentary from chemicals, textiles, and engineered-goods exporters. EBITDA-margin sensitivity highest at the smaller-cap end.',
    signal: 'monitor',
    affectedCompanies: ['SRF', 'NAVINFLUOR', 'WELSPUNLIV'],
    affectedSectors: ['Chemicals', 'Textiles', 'Logistics'],
    sourceType: 'Reliable media',
    action: 'Flag for concall questions',
    timestamp: '05:58 IST',
  },
  {
    id: 'g-6',
    lensType: 'global',
    category: 'Risk sentiment',
    headline: 'DXY softens as Fed minutes read dovish at the margin',
    shortContext: 'Dollar weakness modestly supports EM assets; gold breakout extends.',
    fullContext:
      'DXY -0.4% post the FOMC minutes which highlighted slower disinflation but acknowledged downside risk to labour markets. Gold +0.9% extending its breakout.',
    whyItMatters:
      'Mildly risk-on for EM equities; INR can find some support if DXY stays sub-104. Watch gold-linked names.',
    signal: 'support',
    affectedCompanies: ['TITAN', 'KALYANKJIL', 'MUTHOOTFIN'],
    affectedSectors: ['Jewellery', 'Gold financiers'],
    sourceType: 'Reliable media',
    action: 'Track DXY 104 level',
    timestamp: '05:40 IST',
  },

  // ---------------- SECTORAL ----------------
  {
    id: 's-1',
    lensType: 'sectoral',
    category: 'Auto',
    headline: 'PV dispatches see early signs of festive pull-forward',
    shortContext: 'October wholesales tracking ahead; OEM commentary turns more constructive.',
    fullContext:
      'Channel checks across MSIL, M&M and HMC suggest mid-single-digit wholesale upside vs initial dealer plans. Inventory at dealers remains elevated but stable.',
    whyItMatters:
      'Constructive setup for festive-quarter prints; offsets some of the input-cost squeeze. Watch for SUV-mix commentary.',
    signal: 'support',
    affectedCompanies: ['MARUTI', 'M&M', 'TATAMOTORS'],
    affectedSectors: ['Auto OEM', 'Auto ancillaries'],
    sourceType: 'Company source',
    action: 'Refresh PV demand thesis',
    timestamp: '08:05 IST',
  },
  {
    id: 's-2',
    lensType: 'sectoral',
    category: 'Banks / NBFC',
    headline: 'Unsecured retail growth moderates as RBI risk-weights bite',
    shortContext: 'Private banks reporting +18% growth vs +24% a year ago.',
    fullContext:
      'Latest sector data show personal-loan growth at 18.4% YoY vs 24%+ before the November risk-weight changes. Credit cards outstanding growth has cooled to ~22%.',
    whyItMatters:
      'NIM resilience matters more than growth from here. Watch credit-cost commentary closely on private-bank concalls.',
    signal: 'monitor',
    affectedCompanies: ['HDFCB', 'AXISBANK', 'BAJFIN'],
    affectedSectors: ['Private banks', 'NBFC'],
    sourceType: 'Government source',
    action: 'Compare cost-of-funds trajectories',
    timestamp: '07:50 IST',
  },
  {
    id: 's-3',
    lensType: 'sectoral',
    category: 'IT services',
    headline: 'Deal pipeline commentary firmer across Tier-1',
    shortContext: 'Discretionary spend stabilising in BFSI; healthcare leading.',
    fullContext:
      'Aggregating commentary from the latest set of US client meets, three of the top four Tier-1 IT names cited a measurable pickup in deal closure velocity vs Q2.',
    whyItMatters:
      'Reinforces the durable INR-weakness tailwind for exporters. Margin progression now the swing factor for FY guidance.',
    signal: 'support',
    affectedCompanies: ['INFY', 'TCS', 'HCLTECH'],
    affectedSectors: ['IT services'],
    sourceType: 'Reliable media',
    action: 'Add to thesis: deal velocity',
    timestamp: '07:30 IST',
  },
  {
    id: 's-4',
    lensType: 'sectoral',
    category: 'FMCG',
    headline: 'Rural volume green shoots — three quarters of confirmation',
    shortContext: 'HUL, ITC and Marico print stable rural mix improvement.',
    fullContext:
      'After two years of urban-led growth, the latest three quarters show consistent low-single-digit rural volume expansion. Distribution depth and selective price cuts both contributing.',
    whyItMatters:
      'Long-cycle support for FMCG and small-ticket discretionary. Watch crude pass-through if Brent stays elevated.',
    signal: 'support',
    affectedCompanies: ['HINDUNILVR', 'ITC', 'MARICO', 'DABUR'],
    affectedSectors: ['FMCG', 'Consumer staples'],
    sourceType: 'Company source',
    action: 'Update rural thesis',
    timestamp: '07:18 IST',
  },
  {
    id: 's-5',
    lensType: 'sectoral',
    category: 'Metals',
    headline: 'Domestic HRC spreads narrow as imports tick up',
    shortContext: 'CRISIL data: Q2 spreads at multi-quarter low; volumes still resilient.',
    fullContext:
      'Hot-rolled coil realisations down ~3% QoQ while coking coal cost has stayed flat. China export pressure remains the swing factor.',
    whyItMatters:
      'Margin compression continues — EBITDA/t guidance the key call-out for Q3 prints. Pricing power weakest at the higher-cost end.',
    signal: 'risk',
    affectedCompanies: ['TATASTEEL', 'JSWSTEEL', 'SAIL'],
    affectedSectors: ['Steel', 'Base metals'],
    sourceType: 'Reliable media',
    action: 'Stress-test EBITDA/t',
    timestamp: '07:05 IST',
  },
  {
    id: 's-6',
    lensType: 'sectoral',
    category: 'Pharma',
    headline: 'US gx pricing erosion trending to mid-single digit',
    shortContext: 'Channel checks across complex gx and specialty stabilising.',
    fullContext:
      'After three years of high-single to low-double-digit erosion, the latest channel snapshot points to ~5–6% pricing erosion across complex generics — a clear improvement.',
    whyItMatters:
      'Margin tailwind for US-heavy names; supports the case for re-rating in select complex-gx exporters.',
    signal: 'support',
    affectedCompanies: ['SUNPHARMA', 'DRREDDY', 'CIPLA'],
    affectedSectors: ['Pharmaceuticals'],
    sourceType: 'Reliable media',
    action: 'Refresh US-gx model',
    timestamp: '06:48 IST',
  },
  {
    id: 's-7',
    lensType: 'sectoral',
    category: 'Real estate',
    headline: 'Tier-1 city pre-sales hold despite mortgage rate creep',
    shortContext: 'Q2 launches up 11% YoY; inventory months at multi-year low.',
    fullContext:
      'Listed developers booked record Q2 pre-sales. Inventory-to-sales months tracking at 18 vs the 25–30 long-term average. Pricing growth moderating but positive.',
    whyItMatters:
      'Constructive backdrop for cement, tiles and pipes ecosystem. Monitor mortgage rate sensitivity at the affordable end.',
    signal: 'support',
    affectedCompanies: ['DLF', 'GODREJPROP', 'PRESTIGE'],
    affectedSectors: ['Real estate', 'Cement', 'Building materials'],
    sourceType: 'Company source',
    action: 'Track ancillary cement demand',
    timestamp: '06:32 IST',
  },

  // ---------------- PORTFOLIO RELATED ----------------
  {
    id: 'p-1',
    lensType: 'portfolio',
    category: 'Filing · Portfolio',
    headline: 'Asian Paints — 0.6% selective price hike',
    shortContext: 'Pass-through retained; eases crude pass-through worry.',
    fullContext:
      'The company filed a 0.6% selective price hike effective immediately across decorative paints in two categories. The narrow, surgical nature of the hike suggests management is monitoring competitive intensity carefully.',
    whyItMatters:
      'Confirms pricing power despite Berger / Indigo / Birla disruption. Slight positive for FY margin trajectory.',
    signal: 'support',
    affectedCompanies: ['ASIANP'],
    affectedSectors: ['Paints'],
    sourceType: 'Official filing',
    action: 'Update thesis · refresh model',
    timestamp: '08:18 IST',
  },
  {
    id: 'p-2',
    lensType: 'portfolio',
    category: 'Risk · Portfolio',
    headline: 'M&M — FX + steel double squeeze',
    shortContext: 'Auto inputs rising; margin watch flagged.',
    fullContext:
      'USD/INR drift past 84.6 combined with HRC pricing firming creates a textbook double squeeze on auto OEM margins. M&M has the highest tractor mix sensitivity in the OEM set.',
    whyItMatters:
      'Highest-weight holding facing the strongest combined input pressure. Likely 80–120 bps EBITDA margin risk into Q3 if both move persists.',
    signal: 'risk',
    affectedCompanies: ['M&M'],
    affectedSectors: ['Auto OEM'],
    sourceType: 'Reliable media',
    action: 'Assign follow-up · PM review',
    timestamp: '08:02 IST',
  },
  {
    id: 'p-3',
    lensType: 'portfolio',
    category: 'Macro · Portfolio',
    headline: 'India CPI cools to 4.62% — rate cut visibility improves',
    shortContext: 'Headline within MPC comfort band; food inflation moderating.',
    fullContext:
      'Headline CPI printed 4.62% vs consensus 4.85%. Core sticky at 3.4%. Food inflation cooling led by vegetables. RBI rate-cut visibility for the Feb meeting improves materially.',
    whyItMatters:
      'Positive for portfolio rate-sensitive names — HDFC Bank, Bajaj Finance. Modest support for consumer discretionary via real-income improvement.',
    signal: 'support',
    affectedCompanies: ['HDFCB', 'BAJFIN'],
    affectedSectors: ['Banks', 'NBFC', 'Consumer discretionary'],
    sourceType: 'Government source',
    action: 'Refresh rate-trajectory thesis',
    timestamp: '07:55 IST',
  },
  {
    id: 'p-4',
    lensType: 'portfolio',
    category: 'Watchlist',
    headline: 'DMART — 1.8x volume on no news',
    shortContext: 'Quiet accumulation pattern building.',
    fullContext:
      "DMART traded at 1.8x its 20-day average volume yesterday with no specific news flow or block trade visibility. Order-book skewed to the buy side through the second half of the session.",
    whyItMatters:
      'Quiet accumulation often precedes a fundamental catalyst. Worth flagging to research for store-economics refresh.',
    signal: 'monitor',
    affectedCompanies: ['DMART'],
    affectedSectors: ['Retail'],
    sourceType: 'Reliable media',
    action: 'Read later · refresh store math',
    timestamp: '07:36 IST',
  },
  {
    id: 'p-5',
    lensType: 'portfolio',
    category: 'Watchlist',
    headline: 'Pidilite corrected without negative news',
    shortContext: '4-day correction with no negative catalyst — opportunity?',
    fullContext:
      'Pidilite is down 4.2% over four sessions on declining volume with no specific negative news. Sector data points (real estate, building materials) remain constructive.',
    whyItMatters:
      'Classic no-news correction setup. Worth adding to opportunity watchlist with a small position-sizing trigger.',
    signal: 'support',
    affectedCompanies: ['PIDILITIND'],
    affectedSectors: ['Specialty chemicals', 'Building materials'],
    sourceType: 'Reliable media',
    action: '+ Add to thesis · size trigger',
    timestamp: '07:20 IST',
  },
  {
    id: 'p-6',
    lensType: 'portfolio',
    category: 'Currency · Portfolio',
    headline: 'USD/INR weakness now a durable 5-day trend',
    shortContext: 'Importer pressure across paints, autos; exporter tailwind for IT.',
    fullContext:
      'USD/INR has weakened 0.62% over five sessions with consistent daily prints. RBI intervention has eased at the margin. Forward implied yields point to continued drift.',
    whyItMatters:
      'Dual signal across the book — input cost pressure for paint and auto holdings, simultaneous tailwind for IT exporters. Net negative on weight-adjusted basis.',
    signal: 'risk',
    affectedCompanies: ['M&M', 'ASIANP', 'INFY', 'TCS'],
    affectedSectors: ['Auto', 'Paints', 'IT services'],
    sourceType: 'Reliable media',
    action: 'Add to thesis · FX overlay',
    timestamp: '07:02 IST',
  },
];
