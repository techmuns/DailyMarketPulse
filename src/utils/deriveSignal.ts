// Domain-aware signal derivation from a real 1D move. These encode the
// same economic logic the demo data used (rupee-weaker = risk tilt for
// an import-heavy book; rising input costs = margin risk; gold strength
// = support) but drive it from the live trend instead of hardcoding it.

import type { Signal } from '../types';

const FLAT_FX = 0.1; // % — below this an FX move is noise
const FLAT_COMMODITY = 0.3;

export function currencySignal(_id: string, d1: number): Signal {
  if (Math.abs(d1) < FLAT_FX) return 'monitor';
  // INR pairs up = rupee weaker; DXY up = USD strength. Both tilt risk
  // for an import-heavy book (and support exporters); down = relief.
  return d1 > 0 ? 'risk' : 'support';
}

// Commodities that are primarily an input cost — a rise squeezes the
// margins of the companies that consume them.
const INPUT_COST = new Set(['c-brent', 'c-steel', 'c-alum', 'c-copper', 'c-sugar', 'c-palm']);

export function commoditySignal(id: string, d1: number): Signal {
  if (Math.abs(d1) < FLAT_COMMODITY) return 'monitor';
  if (id === 'c-gold') return d1 > 0 ? 'support' : 'monitor'; // safe-haven / jewellery proxy
  if (INPUT_COST.has(id)) return d1 > 0 ? 'risk' : 'support'; // rising input cost = margin risk
  return d1 > 0 ? 'support' : 'risk';
}
