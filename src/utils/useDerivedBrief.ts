// Derive the per-tab Pulse Brief from the live feeds (no LLM, no mock).
// Each tab's headline + bullets are computed from real numbers; when a
// feed has not loaded the bundled demo brief is returned as a fallback.

import { useMemo } from 'react';
import { useLive } from '../state/liveData';
import type { LivePayload } from '../state/liveData';
import { useMarketsFeed } from '../state/marketsFeed';
import { useMacroFeed } from '../state/macroFeed';
import { useNewsFeed } from '../state/newsFeed';
import { useEventsFeed } from '../state/eventsFeed';
import { pulseBriefs } from '../data/pulseBriefs';
import type { BriefKey, PulseBrief } from '../data/pulseBriefs';
import type { Tone } from './tone';
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
const toneFor = (d: number): Tone => (d > 0.2 ? 'support' : d < -0.2 ? 'risk' : 'monitor');

interface Row { id: string; name: string; current: number; d1: number; d5: number }

function liveMap(data: LivePayload): Map<string, Row> {
  const m = new Map<string, Row>();
  (['indices', 'currencies', 'commodities', 'holdings'] as const).forEach((k) => {
    for (const it of data[k] ?? []) {
      m.set(it.id, { id: it.id, name: NAME[it.id] ?? it.id, current: it.current, d1: it.trend?.d1 ?? 0, d5: it.trend?.d5 ?? 0 });
    }
  });
  return m;
}

const prefixed = (m: Map<string, Row>, p: string) => [...m.values()].filter((r) => r.id.startsWith(p));

export function useDerivedBrief(tabKey: BriefKey): PulseBrief {
  const live = useLive().data;
  const markets = useMarketsFeed();
  const macro = useMacroFeed();
  const news = useNewsFeed();
  const events = useEventsFeed();

  return useMemo(() => {
    const fallback = pulseBriefs[tabKey];
    if (!live) return fallback;
    const m = liveMap(live);
    const get = (id: string) => m.get(id);
    const withBullets = (b: (string | null | undefined)[]): string[] => b.filter((x): x is string => !!x);

    switch (tabKey) {
      case 'Today': {
        const nifty = get('i-nifty');
        const sensex = get('i-sensex');
        const g = markets.gainers?.[0];
        const l = markets.losers?.[0];
        const d = nifty?.d1 ?? 0;
        const bullets = withBullets([
          nifty && `NIFTY 50 ${fmt(nifty.d1)} today, ${fmt(nifty.d5)} over 5d.`,
          sensex && `SENSEX ${fmt(sensex.d1)} on the day.`,
          g && l ? `Top mover ${g.name} ${fmt(g.pct)}; weakest ${l.name} ${fmt(l.pct)}.`
            : markets.breadth ? `Breadth ${markets.breadth.advancers} up / ${markets.breadth.decliners} down.` : null,
        ]);
        return bullets.length
          ? { headline: `Indian equities ${d > 0.2 ? 'firm' : d < -0.2 ? 'soft' : 'mixed'} — NIFTY ${fmt(d)}.`, bullets, tone: toneFor(d) }
          : fallback;
      }
      case 'Macro': {
        const sectors = markets.sectors ?? [];
        const up = sectors.filter((s) => (s.trend?.d1 ?? 0) > 0).length;
        const down = sectors.filter((s) => (s.trend?.d1 ?? 0) < 0).length;
        const byId = new Map((macro.items ?? []).map((i) => [i.id, i]));
        const us10y = byId.get('m-us10y');
        const cpi = byId.get('m-cpi-in');
        const bullets = withBullets([
          us10y && `US 10Y yield at ${us10y.current}%.`,
          cpi && `India CPI ${cpi.current}%${cpi.asOf ? ` (${cpi.asOf})` : ''}.`,
          sectors.length ? `${up} NSE sectors advancing, ${down} declining.` : null,
        ]);
        return bullets.length
          ? { headline: `Macro tilt ${up > down ? 'supportive' : down > up ? 'cautious' : 'balanced'} across sectors.`, bullets, tone: up > down ? 'support' : down > up ? 'risk' : 'monitor' }
          : fallback;
      }
      case 'Markets': {
        const b = markets.breadth;
        const topSector = [...(markets.sectors ?? [])].sort((a, z) => Math.abs(z.trend?.d1 ?? 0) - Math.abs(a.trend?.d1 ?? 0))[0];
        const g = markets.gainers?.[0];
        const l = markets.losers?.[0];
        const net = b ? b.advancers - b.decliners : 0;
        const bullets = withBullets([
          b && `Breadth ${b.advancers} up / ${b.decliners} down; ${b.aboveSMA50}% above 50DMA.`,
          topSector && `${topSector.title} leads sectors at ${fmt(topSector.trend?.d1 ?? 0)}.`,
          g && l && `${g.name} ${fmt(g.pct)} top; ${l.name} ${fmt(l.pct)} weakest.`,
        ]);
        return bullets.length
          ? { headline: `Breadth ${net > 0 ? 'positive' : net < 0 ? 'negative' : 'mixed'}${b ? ` — ${b.advancers} advancers` : ''}.`, bullets, tone: net > 0 ? 'support' : net < 0 ? 'risk' : 'monitor' }
          : fallback;
      }
      case 'Currency': {
        const usd = get('fx-usdinr');
        const eur = get('fx-eurinr');
        const d = usd?.d1 ?? 0;
        const bullets = withBullets([
          usd && `USD/INR ${usd.current} (${fmt(usd.d1)} today, ${fmt(usd.d5)} 5d).`,
          eur && `EUR/INR ${eur.current} (${fmt(eur.d1)}).`,
          d > 0 ? 'A weaker rupee aids exporters, pressures importers.' : 'A firmer rupee eases imported-input costs.',
        ]);
        return usd
          ? { headline: `Rupee ${d > 0.1 ? 'weaker' : d < -0.1 ? 'firmer' : 'steady'} — USD/INR ${fmt(d)}.`, bullets, tone: Math.abs(d) < 0.1 ? 'monitor' : d > 0 ? 'risk' : 'support' }
          : fallback;
      }
      case 'Commodities': {
        const brent = get('c-brent');
        const gold = get('c-gold');
        const top = prefixed(m, 'c-').sort((a, z) => Math.abs(z.d1) - Math.abs(a.d1))[0];
        const d = brent?.d1 ?? 0;
        const bullets = withBullets([
          brent && `Brent ${brent.current} (${fmt(brent.d1)}).`,
          gold && `Gold ${gold.current} (${fmt(gold.d1)}).`,
          top && `Biggest move: ${top.name} ${fmt(top.d1)}.`,
        ]);
        return bullets.length
          ? { headline: `Commodities ${d > 0.3 ? 'firmer' : d < -0.3 ? 'softer' : 'steady'} — Brent ${fmt(d)}.`, bullets, tone: d > 0.3 ? 'risk' : d < -0.3 ? 'support' : 'monitor' }
          : fallback;
      }
      case 'Portfolio':
      case 'Watchlist':
      case 'Book': {
        const rows = tabKey === 'Book' ? [...prefixed(m, 'p-'), ...prefixed(m, 'w-')] : prefixed(m, tabKey === 'Portfolio' ? 'p-' : 'w-');
        if (!rows.length) return fallback;
        const avg = rows.reduce((s, x) => s + x.d1, 0) / rows.length;
        const best = [...rows].sort((a, z) => z.d1 - a.d1)[0];
        const worst = [...rows].sort((a, z) => a.d1 - z.d1)[0];
        const green = rows.filter((x) => x.d1 > 0).length;
        const label = tabKey === 'Watchlist' ? 'Watchlist' : 'Book';
        return {
          headline: `${label} ${avg > 0.1 ? 'firm' : avg < -0.1 ? 'soft' : 'mixed'} — ${green}/${rows.length} names green.`,
          bullets: [`${best.name} leads ${fmt(best.d1)}.`, `${worst.name} lags ${fmt(worst.d1)}.`, `Average move ${fmt(avg)}.`],
          tone: toneFor(avg),
        };
      }
      case 'Events': {
        const items = events.items ?? [];
        if (!items.length) return fallback;
        const soon = items.filter((e) => e.when === 'today' || e.when === 'tomorrow');
        return {
          headline: soon.length ? `${soon.length} event${soon.length > 1 ? 's' : ''} in the next day touching your book.` : `${items.length} corporate events on the calendar.`,
          bullets: items.slice(0, 3).map((e) => `${e.title} (${e.when}).`),
          tone: 'monitor',
        };
      }
      case 'News & Filings': {
        const items = news.items ?? [];
        if (!items.length) return fallback;
        const port = items.filter((n) => n.scope === 'portfolio').length;
        return {
          headline: `${items.length} live headlines${port ? `, ${port} touching your book` : ''}.`,
          bullets: items.slice(0, 3).map((n) => (n.title.length > 84 ? `${n.title.slice(0, 81)}…` : n.title)),
          tone: 'monitor',
        };
      }
      default:
        return fallback;
    }
  }, [tabKey, live, markets, macro.items, news.items, events.items]);
}
