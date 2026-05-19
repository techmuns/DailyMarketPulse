// Semantic tone system — color = meaning, not decoration.
// Every visual element on the dashboard should derive its colour from
// getSignalTone(item) so positive/negative/uncertain/AI items read at a glance.

import type { Signal } from '../types';

export type Tone = 'support' | 'risk' | 'monitor' | 'neutral' | 'ai' | 'urgent';

export interface ToneTokens {
  // Tailwind class fragments
  border: string;       // border-l-{color}
  rowClass: string;     // row className (defined in index.css .tone-*)
  cardWash: string;     // optional bg wash on cards
  text: string;         // primary text color
  textOnWash: string;   // text color used on a coloured wash
  dot: string;          // bg-* for the small dot
  chipBg: string;       // bg-* for chip
  // Concrete colour for charts
  spark: string;
  label: string;
}

const TONES: Record<Tone, ToneTokens> = {
  support: {
    border: 'border-l-calm-emerald',
    rowClass: 'tone-support',
    cardWash: 'bg-calm-emerald-bg/40',
    text: 'text-calm-emerald',
    textOnWash: 'text-calm-emerald',
    dot: 'bg-calm-emerald',
    chipBg: 'bg-calm-emerald-bg',
    spark: '#0FA77A',
    label: 'Support',
  },
  risk: {
    border: 'border-l-calm-rose',
    rowClass: 'tone-risk',
    cardWash: 'bg-calm-rose-bg/40',
    text: 'text-calm-rose',
    textOnWash: 'text-calm-rose',
    dot: 'bg-calm-rose',
    chipBg: 'bg-calm-rose-bg',
    spark: '#CF5F5F',
    label: 'Risk',
  },
  monitor: {
    border: 'border-l-calm-amber',
    rowClass: 'tone-monitor',
    cardWash: 'bg-calm-amber-bg/35',
    text: 'text-calm-amber',
    textOnWash: 'text-calm-amber',
    dot: 'bg-calm-amber',
    chipBg: 'bg-calm-amber-bg',
    spark: '#D7A14A',
    label: 'Monitor',
  },
  neutral: {
    border: 'border-l-bordersoft',
    rowClass: '',
    cardWash: '',
    text: 'text-charcoal-mute',
    textOnWash: 'text-charcoal-soft',
    dot: 'bg-charcoal-mute/70',
    chipBg: 'bg-cream-deep',
    spark: '#8C79C9',
    label: 'Neutral',
  },
  ai: {
    border: 'border-l-calm-violet',
    rowClass: 'tone-ai',
    cardWash: 'bg-calm-violet-bg/40',
    text: 'text-calm-violet',
    textOnWash: 'text-calm-violet',
    dot: 'bg-calm-violet',
    chipBg: 'bg-calm-violet-bg',
    spark: '#8C79C9',
    label: 'AI signal',
  },
  urgent: {
    border: 'border-l-[#B95050]',
    rowClass: 'tone-urgent',
    cardWash: 'bg-calm-rose-bg/55',
    text: 'text-[#B95050]',
    textOnWash: 'text-[#B95050]',
    dot: 'bg-[#B95050]',
    chipBg: 'bg-calm-rose-bg',
    spark: '#B95050',
    label: 'Urgent',
  },
};

export function toneTokens(t: Tone): ToneTokens {
  return TONES[t];
}

export interface ToneInput {
  signal?: Signal;
  impact?: number;
  confidence?: number;
  category?: string;
  scope?: 'portfolio' | 'watchlist' | 'broader';
  trend?: { d1: number; d5: number; m1: number };
}

/**
 * Derive a semantic tone from an item.
 * Rules combine signal, impact, confidence, and scope so the colour
 * carries context — not just whether a number is positive.
 */
export function getSignalTone(item: ToneInput): Tone {
  const sig = item.signal;
  const impact = item.impact ?? 0;
  const confidence = item.confidence ?? 0;

  // Urgent: a high-conviction, high-impact risk gets a deeper red.
  if (sig === 'risk' && impact >= 78 && confidence >= 75) return 'urgent';

  // Portfolio-touching risk reads stronger than broader risk.
  if (sig === 'risk' && item.scope === 'portfolio' && impact >= 60) return 'urgent';

  if (sig === 'noise') return 'neutral';
  if (sig === 'risk') return 'risk';
  if (sig === 'support') return 'support';
  if (sig === 'monitor') return 'monitor';
  return 'neutral';
}

/**
 * Short "market meaning" badge for headline context.
 * Returns undefined when nothing meaningful applies.
 */
export function marketMeaning(item: ToneInput & { title?: string }): string | undefined {
  const sig = item.signal;
  const cat = item.category;
  if (!cat || !sig) return undefined;

  if (cat === 'currency') return sig === 'risk' ? 'FX Pressure' : sig === 'support' ? 'FX Tailwind' : 'FX Watch';
  if (cat === 'energy' || cat === 'industrial-metal' || cat === 'soft')
    return sig === 'risk' ? 'Input Cost ↑' : sig === 'support' ? 'Input Cost Relief' : 'Input Watch';
  if (cat === 'precious-metal') return 'Mixed Read';
  if (cat === 'inflation' || cat === 'rates') return sig === 'support' ? 'Rate Support' : sig === 'risk' ? 'Rate Pressure' : 'Rate Watch';
  if (cat === 'liquidity') return sig === 'support' ? 'Liquidity Up' : 'Liquidity Tight';
  if (cat === 'policy' || cat === 'geopolitics') return sig === 'risk' ? 'Policy Risk' : 'Policy Watch';
  if (cat === 'gdp-activity') return sig === 'support' ? 'Activity Firm' : 'Activity Soft';
  if (cat === 'filing') return sig === 'support' ? 'Filing Positive' : sig === 'risk' ? 'Filing Risk' : 'Filing Watch';
  if (cat === 'news') return sig === 'support' ? 'Thesis Support' : sig === 'risk' ? 'Thesis Risk' : undefined;
  if (cat === 'portfolio') return sig === 'risk' ? 'Margin Risk' : sig === 'support' ? 'Thesis Support' : undefined;
  if (cat === 'watchlist') return sig === 'support' ? 'Opportunity' : sig === 'risk' ? 'Setup Risk' : 'No-News Move';
  if (cat === 'event') return 'Event Soon';
  if (cat === 'sector') return sig === 'support' ? 'Sector Tailwind' : sig === 'risk' ? 'Sector Drag' : 'Sector Watch';
  if (cat === 'index') return sig === 'support' ? 'Risk On' : sig === 'risk' ? 'Risk Off' : 'Mixed';
  return undefined;
}

/**
 * Plain-language explanation of WHY a tone was assigned — used by the
 * AI Signal Drawer so the user understands the colour choice.
 */
export function toneExplanation(item: ToneInput & { affected?: string[] }): string {
  const tone = getSignalTone(item);
  const cat = item.category;
  if (tone === 'urgent') {
    return `High-impact risk touching your book — impact ${item.impact}, confidence ${item.confidence}.`;
  }
  if (tone === 'support') {
    if (cat === 'currency') return 'Weaker INR translates dollar revenue higher for exporters in your book.';
    if (cat === 'inflation' || cat === 'rates') return 'Improving rate-cut visibility benefits rate-sensitive holdings.';
    if (cat === 'filing') return 'Official filing reinforces the bullish leg of the thesis.';
    return 'Reads positive for affected portfolio / watchlist names.';
  }
  if (tone === 'risk') {
    if (cat === 'currency') return 'INR weakness raises landed input cost for importer holdings.';
    if (cat === 'energy' || cat === 'industrial-metal' || cat === 'soft') return 'Commodity firming squeezes input-cost-heavy sectors.';
    if (cat === 'portfolio') return 'Direct portfolio drag — track in next leg.';
    return 'Reads negative for affected portfolio / watchlist names.';
  }
  if (tone === 'monitor') {
    return 'Direction unclear — context-dependent for affected names. Worth watching.';
  }
  if (tone === 'ai') return 'AI surfaced a cross-market pattern worth your attention.';
  return 'Background market update — no direct thesis impact.';
}

/**
 * Spark colour from item context (used in tables, snapshot strip,
 * trend cards). Falls back to a neutral lavender for "noise" items.
 */
export function sparkForItem(item: ToneInput): string {
  return toneTokens(getSignalTone(item)).spark;
}
