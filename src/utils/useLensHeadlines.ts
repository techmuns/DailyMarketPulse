// Derive Today's lens headlines from the real news feed (news.json).
// News items are classified into the four lenses and shaped as
// LensHeadline so the existing HeadlineStack / HeadlineDrawer render
// them unchanged. Returns null when the news feed has not loaded so the
// caller can fall back to the bundled demo headlines.

import { useMemo } from 'react';
import { useNewsFeed } from '../state/newsFeed';
import type { LensHeadline, LensType, NewsItem } from '../types';

type NewsWithPublisher = NewsItem & { publisher?: string };

// Keyword → sector tags for the Sectoral lens (Yahoo news carries no
// sector taxonomy, so we infer from the headline text).
const SECTOR_KEYWORDS: [string, RegExp][] = [
  ['IT', /\b(IT services|software|Infosys|TCS|Wipro|HCL|Tech Mahindra)\b/i],
  ['Banks', /\b(bank|HDFC|ICICI|SBI|Axis|Kotak|lender)\b/i],
  ['Autos', /\b(auto|Maruti|Mahindra|Tata Motors|Bajaj|Hero|EV)\b/i],
  ['Pharma', /\b(pharma|drug|Sun Pharma|Cipla|Divi|generic)\b/i],
  ['Metals', /\b(metal|steel|Tata Steel|Hindalco|JSW|aluminium|copper)\b/i],
  ['Energy', /\b(oil|crude|energy|Reliance|ONGC|power|gas)\b/i],
  ['FMCG', /\b(FMCG|consumer goods|Hindustan Unilever|ITC|Nestle|Britannia)\b/i],
  ['Realty', /\b(realty|real estate|property|DLF|housing)\b/i],
];

function classify(n: NewsItem): { lensType: LensType; sectors: string[] } {
  if (n.scope === 'portfolio') return { lensType: 'portfolio', sectors: [] };
  if (n.scope === 'watchlist') return { lensType: 'custom', sectors: [] };
  const sectors = SECTOR_KEYWORDS.filter(([, re]) => re.test(n.title)).map(([s]) => s);
  if (sectors.length) return { lensType: 'sectoral', sectors };
  return { lensType: 'global', sectors: [] };
}

function toHeadline(n: NewsWithPublisher): LensHeadline {
  const { lensType, sectors } = classify(n);
  const category =
    lensType === 'portfolio' ? 'Your book'
      : lensType === 'custom' ? 'Watchlist'
      : lensType === 'sectoral' ? (sectors[0] ?? 'Sector')
      : 'Markets';
  return {
    id: `lh-${n.id}`,
    lensType,
    category,
    headline: n.title,
    shortContext: n.publisher ? `via ${n.publisher}` : 'Market headline',
    fullContext: `${n.publisher ? `Reported by ${n.publisher}. ` : ''}Open the source for the full report.`,
    whyItMatters: n.whyShown || 'Relevant to the current market context.',
    signal: n.signal,
    affectedCompanies: (n.affected ?? []).filter((a) => a && a !== 'Markets'),
    affectedSectors: sectors,
    sourceType: n.source,
    action: 'Read at source',
    timestamp: n.timestamp,
    url: n.url,
  };
}

export function useLensHeadlines(): LensHeadline[] | null {
  const { items } = useNewsFeed();
  return useMemo(() => (items ? items.map((n) => toHeadline(n as NewsWithPublisher)) : null), [items]);
}
