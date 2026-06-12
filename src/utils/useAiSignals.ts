// Derive the AI signal cards (shown in the signal drawer) from the live
// feeds instead of the hardcoded demo array. Built from the largest live
// moves plus a macro, news and event signal so the existing call sites
// (which index [0]..[3] and find by category) keep resolving. Falls back
// to the bundled demo signals when live.json has not loaded.

import { useMemo } from 'react';
import { useLive } from '../state/liveData';
import { useMacroFeed } from '../state/macroFeed';
import { useNewsFeed } from '../state/newsFeed';
import { useEventsFeed } from '../state/eventsFeed';
import { aiSignals as mockSignals } from '../data/signals';
import type { AISignal, Signal } from '../types';
import { currencySignal, commoditySignal } from './deriveSignal';
import { indices } from '../data/markets';
import { currencies } from '../data/currencies';
import { commodities } from '../data/commodities';
import { portfolio } from '../data/portfolio';
import { watchlist } from '../data/watchlist';

const NAME: Record<string, string> = {};
for (const arr of [indices, currencies, commodities, portfolio, watchlist]) {
  for (const x of arr) NAME[x.id] = x.title;
}

const fmt = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

type Kind = 'indices' | 'currencies' | 'commodities' | 'holdings';
interface Row { id: string; name: string; kind: Kind; d1: number; d5: number; current: number }

function trendOrNoise(d1: number, d5: number): AISignal['trendOrNoise'] {
  if (Math.sign(d1) === Math.sign(d5) && Math.abs(d5) >= Math.abs(d1)) return 'trend';
  if (Math.abs(d1) >= 1) return 'one-day-noise';
  return 'building';
}

function signalFor(kind: Kind, id: string, d1: number): Signal {
  if (kind === 'currencies') return currencySignal(id, d1);
  if (kind === 'commodities') return commoditySignal(id, d1);
  if (Math.abs(d1) < 0.2) return 'monitor';
  return d1 > 0 ? 'support' : 'risk';
}

const CATEGORY: Record<Kind, string> = { indices: 'markets', currencies: 'currency', commodities: 'commodities', holdings: 'portfolio' };

function whyFor(name: string, sig: Signal): string {
  if (sig === 'risk') return `Adds downside pressure for ${name}; watch for follow-through next session.`;
  if (sig === 'support') return `Supportive for ${name} if the move sustains beyond a single session.`;
  return `Worth monitoring — not yet a decisive move for ${name}.`;
}

function fromRow(r: Row, ts: string): AISignal {
  const sig = signalFor(r.kind, r.id, r.d1);
  return {
    id: `as-${r.id}`,
    title: `${r.name} ${r.d1 >= 0 ? 'up' : 'down'} ${Math.abs(r.d1).toFixed(2)}%`,
    whatChanged: `${r.name} is at ${r.current} — ${fmt(r.d1)} today and ${fmt(r.d5)} over five sessions.`,
    whyItMatters: whyFor(r.name, sig),
    trendOrNoise: trendOrNoise(r.d1, r.d5),
    affected: [r.name],
    signal: sig,
    confidence: Math.min(90, 55 + Math.round(Math.abs(r.d1) * 8)),
    source: 'Reliable media',
    suggestedActions: ['Review thesis impact', 'Watch next session for confirmation'],
    category: CATEGORY[r.kind],
    timestamp: ts,
  };
}

export function useAiSignals(): AISignal[] {
  const live = useLive();
  const macro = useMacroFeed();
  const news = useNewsFeed();
  const events = useEventsFeed();

  return useMemo(() => {
    const data = live.data;
    if (!data) return mockSignals;
    const ts = data.fetchedAt ?? new Date().toISOString();
    const rows: Row[] = [];
    (['indices', 'currencies', 'commodities', 'holdings'] as const).forEach((kind) => {
      for (const it of data[kind] ?? []) {
        rows.push({ id: it.id, name: NAME[it.id] ?? it.id, kind, d1: it.trend?.d1 ?? 0, d5: it.trend?.d5 ?? 0, current: it.current });
      }
    });
    if (!rows.length) return mockSignals;

    const signals: AISignal[] = [...rows]
      .sort((a, b) => Math.abs(b.d1) - Math.abs(a.d1))
      .slice(0, 5)
      .map((r) => fromRow(r, ts));

    // Macro signal — Macro tab finds by category === 'macro'.
    const us10y = (macro.items ?? []).find((x) => x.id === 'm-us10y');
    signals.push({
      id: 'as-macro',
      title: us10y ? `US 10Y at ${us10y.current}%` : 'Macro backdrop in focus',
      whatChanged: us10y ? `US 10Y yield at ${us10y.current}% (${fmt(us10y.trend.d1)} on the day).` : 'Rates and sector breadth are the macro swing factors today.',
      whyItMatters: 'Rate direction shapes risk appetite for rate-sensitive sectors (banks, NBFCs, real estate).',
      trendOrNoise: 'trend',
      affected: ['Banks', 'NBFC', 'IT Services'],
      signal: 'monitor',
      confidence: 70,
      source: 'Reliable media',
      suggestedActions: ['Note for the PM brief', 'Watch rate-sensitive names'],
      category: 'macro',
      timestamp: ts,
    });

    // News signal — from the top live headline, if present.
    const topNews = (news.items ?? [])[0];
    if (topNews) {
      signals.push({
        id: 'as-news',
        title: topNews.title.length > 70 ? `${topNews.title.slice(0, 67)}…` : topNews.title,
        whatChanged: topNews.title,
        whyItMatters: topNews.whyShown || 'Relevant market headline.',
        trendOrNoise: 'building',
        affected: topNews.affected ?? ['Markets'],
        signal: topNews.signal ?? 'monitor',
        confidence: 60,
        source: topNews.source ?? 'Reliable media',
        suggestedActions: ['Read at source', 'Assess relevance to the book'],
        category: 'news',
        timestamp: topNews.timestamp ?? ts,
      });
    }

    // Event signal — from the nearest corporate event, if present.
    const topEvent = (events.items ?? [])[0];
    if (topEvent) {
      signals.push({
        id: 'as-event',
        title: topEvent.title,
        whatChanged: `${topEvent.title} (${topEvent.when}).`,
        whyItMatters: 'Calendar event that can move the affected name around the print.',
        trendOrNoise: 'building',
        affected: topEvent.affected ?? [],
        signal: 'monitor',
        confidence: 65,
        source: 'Company source',
        suggestedActions: ['Prepare for the event', 'Set a reminder'],
        category: 'events',
        timestamp: topEvent.timestamp ?? ts,
      });
    }

    return signals;
  }, [live.data, macro.items, news.items, events.items]);
}
