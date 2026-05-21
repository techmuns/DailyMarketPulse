// Sector intelligence — aggregates curated lens headlines (and any
// live news with sector tags) into a "which sectors mattered today"
// summary used by the Sectoral lens.
//
// Three responsibilities:
//   1. Normalise messy sector strings ("Auto OEM", "Private banks",
//      "Steel") onto a canonical 16-sector universe.
//   2. Score how "material" a headline is, by keyword match against
//      the analyst-watch lexicon (RBI, USFDA, margin, guidance, …).
//      Higher score = headline that genuinely moved the sector
//      conversation, not just a routine mention.
//   3. Aggregate per canonical sector: dominant tone, material count,
//      ordered headline list for the detail view.

import type { LensHeadline, Signal } from '../types';

export type SectorTone = 'support' | 'pressure' | 'mixed' | 'quiet';

// The dropdown universe — spec requires these 16 to always be
// available, even if no headlines mention them today.
export const SECTOR_UNIVERSE = [
  'Auto',
  'Banks',
  'NBFC',
  'IT Services',
  'FMCG',
  'Metals',
  'Energy',
  'Oil & Gas',
  'Pharma',
  'Cement',
  'Telecom',
  'Real Estate',
  'Capital Goods',
  'Chemicals',
  'Consumer Durables',
  'Healthcare',
  'Power',
] as const;

export type CanonicalSector = (typeof SECTOR_UNIVERSE)[number];

// Maps the loose sector strings found in lensHeadlines.affectedSectors
// (e.g. "Auto OEM", "Private banks", "Pharmaceuticals") onto the
// canonical universe. Keys are lowercase for case-insensitive lookup.
const ALIAS_MAP: Record<string, CanonicalSector> = {
  // Auto
  auto: 'Auto',
  autos: 'Auto',
  'auto oem': 'Auto',
  'auto ancillaries': 'Auto',
  'auto ancillary': 'Auto',
  // Banks
  banks: 'Banks',
  bank: 'Banks',
  'private banks': 'Banks',
  'psu banks': 'Banks',
  'public sector banks': 'Banks',
  // NBFC
  nbfc: 'NBFC',
  nbfcs: 'NBFC',
  'auto finance': 'NBFC',
  // IT
  it: 'IT Services',
  'it services': 'IT Services',
  'it exporters': 'IT Services',
  'information technology': 'IT Services',
  // FMCG
  fmcg: 'FMCG',
  'consumer staples': 'FMCG',
  // Metals
  metals: 'Metals',
  steel: 'Metals',
  'base metals': 'Metals',
  aluminium: 'Metals',
  mining: 'Metals',
  // Energy / Oil & Gas
  energy: 'Energy',
  utilities: 'Power',
  power: 'Power',
  'oil & gas': 'Oil & Gas',
  'oil and gas': 'Oil & Gas',
  refining: 'Oil & Gas',
  // Pharma
  pharma: 'Pharma',
  pharmaceuticals: 'Pharma',
  // Cement / building
  cement: 'Cement',
  'building materials': 'Cement',
  // Telecom
  telecom: 'Telecom',
  telecoms: 'Telecom',
  // Real Estate
  realty: 'Real Estate',
  'real estate': 'Real Estate',
  // Capital Goods
  'capital goods': 'Capital Goods',
  industrials: 'Capital Goods',
  // Chemicals
  chemicals: 'Chemicals',
  'specialty chemicals': 'Chemicals',
  // Consumer Durables
  durables: 'Consumer Durables',
  'consumer durables': 'Consumer Durables',
  // Healthcare
  healthcare: 'Healthcare',
  hospitals: 'Healthcare',
  diagnostics: 'Healthcare',
};

export function normaliseSector(raw: string): CanonicalSector | null {
  const key = raw.trim().toLowerCase();
  if (key in ALIAS_MAP) return ALIAS_MAP[key];
  // Exact case-insensitive match against the universe itself.
  const hit = SECTOR_UNIVERSE.find((s) => s.toLowerCase() === key);
  return hit ?? null;
}

// Analyst-watch keywords. Headlines that match get a higher material
// score, pushing them to the top of the per-sector ranking.
const MATERIAL_KEYWORDS = [
  'rbi',
  'regulation',
  'policy',
  'earnings',
  'guidance',
  'margin',
  'volume',
  'credit cost',
  'asset quality',
  'crude',
  'inr',
  'commodity',
  'demand',
  'pricing',
  'market share',
  'usfda',
  'order win',
  'downgrade',
  'upgrade',
  'risk-weight',
  'risk weight',
  'pre-sales',
  'unsecured',
  'erosion',
  'spread',
  'capex',
];

// Large-cap names that frequently move sector narratives. A hit
// adds a small boost on top of the keyword score.
const LARGE_COMPANY_NAMES = [
  'reliance',
  'tcs',
  'infosys',
  'hdfc',
  'icici',
  'sbi',
  'kotak',
  'axis',
  'hul',
  'itc',
  'maruti',
  'tata motors',
  'm&m',
  'mahindra',
  'bajaj',
  'asian paints',
  'titan',
  'sun pharma',
  'dr reddy',
  'cipla',
  'tata steel',
  'jsw',
  'ntpc',
  'ongc',
  'larsen',
  'lt',
];

export interface HeadlineScored {
  headline: LensHeadline;
  score: number;
  matched: string[];
}

export function scoreHeadline(h: LensHeadline): HeadlineScored {
  const blob = [h.headline, h.shortContext, h.whyItMatters, h.category].join(' ').toLowerCase();
  const matched: string[] = [];

  for (const kw of MATERIAL_KEYWORDS) {
    if (blob.includes(kw)) matched.push(kw);
  }
  let score = matched.length * 2;

  for (const name of LARGE_COMPANY_NAMES) {
    if (blob.includes(name)) score += 0.5;
  }
  // Affected-companies array is curated; treat each as half a point.
  score += (h.affectedCompanies?.length ?? 0) * 0.5;

  return { headline: h, score, matched };
}

// A headline is "material" if it crosses this score threshold. The
// rest are routine mentions surfaced under "Low-signal mentions".
const MATERIAL_THRESHOLD = 2.5;

export function isMaterial(s: HeadlineScored): boolean {
  return s.score >= MATERIAL_THRESHOLD;
}

export interface SectorSummary {
  sector: CanonicalSector;
  tone: SectorTone;
  materialCount: number;
  totalCount: number;
  topReason: string;       // one-liner derived from top headline
  topCategory: string;     // the headline's category badge
  signals: Record<Signal, number>;
  headlines: HeadlineScored[]; // sorted desc by score
}

function deriveTone(signals: Record<Signal, number>): SectorTone {
  const sup = signals.support ?? 0;
  const risk = signals.risk ?? 0;
  const monitor = signals.monitor ?? 0;
  const noise = signals.noise ?? 0;
  const total = sup + risk + monitor + noise;
  if (total === 0) return 'quiet';
  if (sup > 0 && risk > 0) return 'mixed';
  if (risk > 0) return 'pressure';
  if (sup > 0) return 'support';
  if (monitor > 0) return 'mixed';
  return 'quiet';
}

// Aggregate by canonical sector. A single headline can contribute to
// multiple sectors (e.g. "FMCG + Consumer staples" → both map to FMCG
// here, so the headline lands once in FMCG; "Real estate + Cement"
// would contribute to both Real Estate and Cement).
export function aggregateBySector(headlines: LensHeadline[]): SectorSummary[] {
  const buckets = new Map<CanonicalSector, HeadlineScored[]>();
  for (const h of headlines) {
    const scored = scoreHeadline(h);
    const sectors = new Set<CanonicalSector>();
    for (const s of h.affectedSectors ?? []) {
      const c = normaliseSector(s);
      if (c) sectors.add(c);
    }
    // Also probe the category field as a fallback (e.g. category="Banks / NBFC").
    if (h.category) {
      for (const piece of h.category.split(/[/·,&]/)) {
        const c = normaliseSector(piece.trim());
        if (c) sectors.add(c);
      }
    }
    for (const sector of sectors) {
      const arr = buckets.get(sector) ?? [];
      arr.push(scored);
      buckets.set(sector, arr);
    }
  }

  const out: SectorSummary[] = [];
  for (const [sector, arr] of buckets) {
    arr.sort((a, b) => b.score - a.score);
    const signals: Record<Signal, number> = { support: 0, risk: 0, monitor: 0, noise: 0 };
    for (const s of arr) signals[s.headline.signal] = (signals[s.headline.signal] ?? 0) + 1;
    const materialCount = arr.filter(isMaterial).length;
    const top = arr[0];
    out.push({
      sector,
      tone: deriveTone(signals),
      materialCount,
      totalCount: arr.length,
      topReason: top?.headline.shortContext ?? '',
      topCategory: top?.headline.category ?? '',
      signals,
      headlines: arr,
    });
  }
  // Sort by materialCount desc, then total desc, then alphabetically.
  out.sort((a, b) => {
    if (b.materialCount !== a.materialCount) return b.materialCount - a.materialCount;
    if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
    return a.sector.localeCompare(b.sector);
  });
  return out;
}

// Convenience: take the top N sectors that actually had at least one
// material headline. If fewer than N material sectors exist, fall
// back to sectors with any headlines so the chips aren't empty.
export function topSectors(summaries: SectorSummary[], n = 5): SectorSummary[] {
  const material = summaries.filter((s) => s.materialCount > 0);
  if (material.length >= n) return material.slice(0, n);
  // Pad with the next-most-active sectors that have at least one headline.
  const seen = new Set(material.map((s) => s.sector));
  const filler = summaries.filter((s) => !seen.has(s.sector) && s.totalCount > 0);
  return [...material, ...filler].slice(0, n);
}

// Phrase used in AI commentary for each tone.
const TONE_PHRASE: Record<SectorTone, string> = {
  support: 'strength',
  pressure: 'pressure',
  mixed: 'mixed signals',
  quiet: 'low activity',
};

export function tonePhrase(t: SectorTone): string {
  return TONE_PHRASE[t];
}

// Short verb form used in the crisp default commentary, e.g.
// "Banks were under pressure, IT Services led, FMCG was mixed."
const TONE_VERB: Record<SectorTone, string> = {
  support: 'led',
  pressure: 'was under pressure',
  mixed: 'was mixed',
  quiet: 'was quiet',
};

// Default (no sector picked) AI read — one short sentence, the
// minimum a buy-side reader needs to know which sectors moved.
export function defaultCommentary(top: SectorSummary[]): string {
  if (top.length === 0) {
    return 'No sector cleared the material-change threshold today.';
  }
  const lead = top.slice(0, 3).map((s) => s.sector);
  const joined =
    lead.length === 3
      ? `${lead[0]}, ${lead[1]} and ${lead[2]}`
      : lead.join(' and ');
  const tones = top.slice(0, 3).map((s) => `${s.sector} ${TONE_VERB[s.tone]}`).join(', ');
  return `${joined} led today's sector narrative; ${tones}.`;
}

// Per-sector AI read — one short sentence when there's a story,
// the spec literal when there isn't.
export function sectorCommentary(summary: SectorSummary | undefined, picked: CanonicalSector): string {
  if (!summary || summary.materialCount === 0) {
    return 'This sector did not make the main market narrative today. There are routine mentions, but no material sector-moving change detected.';
  }
  const toneLabel: Record<SectorTone, string> = {
    support: 'Support',
    pressure: 'Pressure',
    mixed: 'Mixed',
    quiet: 'Quiet',
  };
  const themes = summary.headlines
    .slice(0, 2)
    .map((h) => {
      const cat = h.headline.category.replace(/^[^·:]*[·:]\s*/, '').toLowerCase();
      return cat || h.headline.headline.toLowerCase().slice(0, 40);
    })
    .join(' and ');
  const n = summary.materialCount;
  return `${picked} · ${toneLabel[summary.tone]} tone · ${n} material change${n === 1 ? '' : 's'} on ${themes}.`;
}
