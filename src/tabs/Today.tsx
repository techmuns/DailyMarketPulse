import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { ChangeStripChip, SignalChip, Ticker } from '../components/Chip';
import { Delta } from '../components/Delta';
import { Sparkline } from '../components/Sparkline';
import { PriorityLensSelector } from '../components/PriorityLens';
import { SnapshotStrip } from '../components/SnapshotStrip';
import type { SnapshotItem } from '../components/SnapshotStrip';
import { aiSignals, featuredSignal } from '../data/signals';
import { portfolio, portfolioStats } from '../data/portfolio';
import { marketTemperature } from '../data/markets';
import { actions } from '../data/actions';
import { useStore } from '../state/store';
import { todayLong, pct } from '../utils/format';
import clsx from 'clsx';
import type { Signal } from '../types';

type FeedItem = {
  id: string;
  group: 'macro' | 'markets' | 'currency' | 'commodity' | 'filing' | 'portfolio' | 'news';
  title: string;
  why: string;
  affected: string[];
  signal: Signal;
  change?: string;
  d1: number;
  d5: number;
  action?: string;
};

export function Today() {
  const { lens, openDrawer } = useStore();
  const [showAll, setShowAll] = useState(false);

  const baseFeed: FeedItem[] = useMemo(() => [
    { id: 'f-cur', group: 'currency', title: 'USD/INR weakness — 5-day trend', why: 'Importer cost pressure; exporter tailwind', affected: ['M&M', 'ASIANP', 'INFY', 'TCS'], signal: 'risk', change: '5-day trend', d1: 0.25, d5: 0.62, action: 'Add to thesis' },
    { id: 'f-port-mm', group: 'portfolio', title: 'M&M — FX + steel double squeeze', why: 'Auto inputs rising; margin watch', affected: ['M&M'], signal: 'risk', change: 'Risk increased', d1: -1.94, d5: -3.1, action: 'Assign follow-up' },
    { id: 'f-filing', group: 'filing', title: 'Asian Paints — 0.6% selective price hike', why: 'Pass-through retained; eases crude risk', affected: ['ASIANP'], signal: 'support', change: 'New today', d1: 0.4, d5: 0.7, action: 'Update thesis' },
    { id: 'f-macro-cpi', group: 'macro', title: 'India CPI cools to 4.62%', why: 'Rate-cut visibility improves', affected: ['HDFCB', 'BAJFIN'], signal: 'support', change: 'Support improved', d1: -4.0, d5: -4.0 },
    { id: 'f-com-brent', group: 'commodity', title: 'Brent crude firms above $84', why: 'Input cost pressure for paints, aviation', affected: ['ASIANP', 'Aviation'], signal: 'risk', change: 'Repeated theme', d1: 2.06, d5: 3.4, action: 'Add to thesis' },
    { id: 'f-mkt-dmart', group: 'markets', title: 'DMART — 1.8x volume, no news', why: 'Quiet accumulation pattern', affected: ['DMART'], signal: 'monitor', change: 'New today', d1: 1.02, d5: 1.6, action: 'Read later' },
    { id: 'f-news-rbi', group: 'news', title: 'RBI: room for accommodation', why: 'Reinforces rate-cut visibility', affected: ['Banks', 'NBFC'], signal: 'support', change: 'Changed since yesterday', d1: 0.0, d5: 0.0 },
  ], []);

  const feed = useMemo(() => {
    const groupRank: Record<string, number> = {
      portfolio: 0, macro: 1, markets: 2, currency: 3, commodity: 4, filing: 5, news: 6,
    };
    const lensFocus: Record<string, FeedItem['group']> = {
      'Portfolio First': 'portfolio',
      'Macro First': 'macro',
      'Markets First': 'markets',
      'News First': 'news',
      'Watchlist First': 'markets',
      Custom: 'portfolio',
    };
    const focus = lensFocus[lens];
    return [...baseFeed].sort((a, b) => {
      const af = a.group === focus ? -10 : 0;
      const bf = b.group === focus ? -10 : 0;
      return groupRank[a.group] + af - (groupRank[b.group] + bf);
    });
  }, [baseFeed, lens]);

  const visible = showAll ? feed : feed.slice(0, 3);

  const portfolioBiggestUp = [...portfolio].sort((a, b) => b.trend!.d1 - a.trend!.d1)[0];
  const portfolioBiggestDown = [...portfolio].sort((a, b) => a.trend!.d1 - b.trend!.d1)[0];

  const snapshot: SnapshotItem[] = [
    {
      key: 'portfolio',
      label: 'Portfolio',
      headline: `${portfolioBiggestDown.ticker} drag, ${portfolioBiggestUp.ticker} support`,
      delta: portfolioStats.todayChange,
      spark: [50, 51, 52, 51, 50, 49, 49],
      signal: 'monitor',
    },
    {
      key: 'markets',
      label: 'Markets',
      headline: 'NIFTY flat, midcaps quietly lead',
      delta: -0.22,
      spark: [24620, 24680, 24752, 24868, 24820, 24800, 24812],
      signal: 'monitor',
    },
    {
      key: 'currency',
      label: 'Currency',
      headline: 'INR weak — 5D trend',
      delta: 0.25,
      spark: [83.71, 83.92, 84.10, 84.28, 84.41, 84.55, 84.62],
      signal: 'risk',
    },
    {
      key: 'commodities',
      label: 'Commodities',
      headline: 'Brent firm, gold breakout',
      delta: 2.06,
      spark: [80.1, 81.0, 81.8, 82.5, 83.1, 83.7, 84.2],
      signal: 'risk',
    },
    {
      key: 'events',
      label: 'Events',
      headline: 'ASIANP Q4 + US CPI tomorrow',
      delta: 0,
      spark: [1, 1, 2, 2, 3, 3, 4],
      signal: 'monitor',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-9">
      {/* A — Newspaper masthead */}
      <Masthead />

      {/* B — Hero row: 2 cards only */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <MarketTemperatureCard />
        <FeaturedAISignal />
      </section>

      {/* D — Snapshot strip */}
      <section>
        <SectionHeader title="Across your cockpit" eyebrow="Snapshot" />
        <SnapshotStrip items={snapshot} />
      </section>

      {/* C — Top changes (3 by default) */}
      <section>
        <SectionHeader
          title="Top changes since yesterday"
          eyebrow={`Reordered by ${lens.replace(' First', '')} lens`}
          right={
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-[12px] text-charcoal-mute hover:text-charcoal-soft underline-offset-4 hover:underline transition"
            >
              {showAll ? `Show top 3` : `View all changes (${feed.length})`}
            </button>
          }
        />
        <div className="card overflow-hidden">
          <table className="tbl">
            <thead>
              <tr>
                <th className="pl-5 w-8">#</th>
                <th>What changed</th>
                <th className="w-[110px]">1D</th>
                <th className="w-[88px]">5D</th>
                <th className="w-[120px]">Affected</th>
                <th className="w-[80px]">Signal</th>
                <th className="pr-5 w-[120px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((f, i) => (
                <tr
                  key={f.id}
                  className="row-link"
                  onClick={() => openDrawer(aiSignals[i % aiSignals.length])}
                >
                  <td className="pl-5 font-mono text-[11px] text-charcoal-mute tabular-nums">{String(i + 1).padStart(2, '0')}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {f.change && <ChangeStripChip value={f.change as any} />}
                      <span className="text-[13px] font-medium text-charcoal">{f.title}</span>
                    </div>
                    <div className="text-[11.5px] text-charcoal-mute mt-0.5">{f.why}</div>
                  </td>
                  <td><Delta value={f.d1} /></td>
                  <td><Delta value={f.d5} size="xs" /></td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {f.affected.slice(0, 2).map((a) => <Ticker key={a}>{a}</Ticker>)}
                      {f.affected.length > 2 && (
                        <span className="text-[10.5px] text-charcoal-mute self-center">+{f.affected.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td><SignalChip value={f.signal} dot /></td>
                  <td className="pr-5 text-[11.5px] text-calm-violet">{f.action || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Portfolio Impact (compact scorecards + heatmap) */}
      <section>
        <SectionHeader title="Portfolio impact" eyebrow="Your book" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniScore
            label="Today"
            value={pct(portfolioStats.todayChange)}
            dir={portfolioStats.todayChange}
            sub="₹4.82 Cr book"
          />
          <MiniScore
            label="5-day"
            value={pct(portfolioStats.d5Change)}
            dir={portfolioStats.d5Change}
            sub={`1M ${pct(portfolioStats.m1Change)}`}
          />
          <MiniScore
            label="Top +"
            value={portfolioBiggestUp.ticker}
            dir={portfolioBiggestUp.trend!.d1}
            sub={pct(portfolioBiggestUp.trend!.d1)}
          />
          <MiniScore
            label="Top −"
            value={portfolioBiggestDown.ticker}
            dir={portfolioBiggestDown.trend!.d1}
            sub={pct(portfolioBiggestDown.trend!.d1)}
          />
        </div>
      </section>

      {/* E — Action queue: calm, compact, low priority visually */}
      <section>
        <SectionHeader title="Action queue" eyebrow="Quick triage" />
        <Card padding="md">
          <ul className="divide-y divide-bordersoft/60">
            {actions.slice(0, 4).map((a) => (
              <li key={a.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={clsx(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    a.type === 'Add to thesis' && 'bg-calm-green',
                    a.type === 'Assign follow-up' && 'bg-calm-navy',
                    a.type === 'Read later' && 'bg-calm-amber',
                    a.type === 'Mark noise' && 'bg-charcoal-mute',
                    a.type === 'Escalate to PM' && 'bg-calm-rose'
                  )} />
                  <div className="min-w-0">
                    <div className="text-[13px] text-charcoal font-medium truncate">{a.title}</div>
                    <div className="text-[11.5px] text-charcoal-mute truncate">{a.type} · {a.owner}</div>
                  </div>
                </div>
                <span className="text-[11px] text-charcoal-mute capitalize">{a.status.replace('-', ' ')}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </motion.div>
  );
}

function MarketTemperatureCard() {
  const { status, oneLine, spark } = marketTemperature;
  const accent =
    status === 'risk-on' ? 'bg-calm-green-bg text-calm-green'
      : status === 'risk-off' ? 'bg-calm-rose-bg text-calm-rose'
      : 'bg-calm-amber-bg text-calm-amber';
  return (
    <Card className="lg:col-span-2" padding="lg">
      <div className="flex items-start justify-between">
        <div>
          <span className="label-mute">Market temperature</span>
          <div className="mt-2 flex items-baseline gap-3">
            <span className={clsx('chip capitalize', accent)}>{status.replace('-', ' ')}</span>
          </div>
        </div>
        <div className="text-right">
          <Delta value={2.1} label="1D" />
        </div>
      </div>
      <p className="mt-3 text-[14px] text-charcoal-soft leading-snug">{oneLine}</p>
      <div className="-mx-2 mt-4">
        <Sparkline data={spark} color="#0F8F6F" height={52} strokeWidth={2} />
      </div>
      <div className="mt-3 flex items-center gap-5 text-[11.5px] text-charcoal-mute">
        <span>1D <span className="text-charcoal-soft font-medium ml-1 tabular-nums">+2.10%</span></span>
        <span>5D <span className="text-charcoal-soft font-medium ml-1 tabular-nums">+4.60%</span></span>
        <span>1M <span className="text-charcoal-soft font-medium ml-1 tabular-nums">+7.20%</span></span>
      </div>
    </Card>
  );
}

function FeaturedAISignal() {
  const { openDrawer } = useStore();
  return (
    <button
      onClick={() => openDrawer(featuredSignal)}
      className="lg:col-span-3 group relative text-left rounded-2xl border border-calm-violet/30 bg-gradient-to-br from-calm-violet-bg/70 via-cream to-cream-deep p-6 shadow-soft hover:shadow-lift transition-all duration-300 overflow-hidden"
    >
      <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-calm-violet/15 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <span className="chip bg-calm-violet text-cream">AI Signal · Featured</span>
          <span className="chip bg-calm-amber-bg text-calm-amber">5-day trend</span>
        </div>
        <h2 className="h-display text-[20px] font-semibold leading-snug">{featuredSignal.title}</h2>
        <p className="text-[13px] text-charcoal-soft mt-2 leading-relaxed line-clamp-2">
          {featuredSignal.whyItMatters}
        </p>
        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[11.5px] text-charcoal-mute">
            <span>Confidence <span className="text-charcoal-soft font-medium">{featuredSignal.confidence}%</span></span>
            <span className="opacity-40">·</span>
            <span>{featuredSignal.source}</span>
          </div>
          <span className="text-[12px] text-calm-violet font-medium group-hover:translate-x-0.5 transition-transform">
            Open signal drawer →
          </span>
        </div>
      </div>
    </button>
  );
}

function Masthead() {
  const dateStr = todayLong();
  return (
    <header className="relative">
      {/* Eyebrow / volume */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-calm-emerald" />
          <span className="text-[10.5px] tracking-[0.22em] uppercase text-charcoal-mute font-semibold">
            Vol. I · Edition · IST
          </span>
        </div>
        <span className="text-[10.5px] tracking-[0.22em] uppercase text-charcoal-mute font-semibold hidden md:inline">
          The Investor's Morning Cockpit
        </span>
      </div>

      {/* Top hairline */}
      <div className="h-[3px] bg-charcoal/90 rounded-full mb-4" />

      {/* Masthead title */}
      <h1 className="h-masthead text-center text-[44px] sm:text-[64px] md:text-[80px] lg:text-[92px] leading-[0.92] uppercase">
        Daily Market Pulse
      </h1>

      {/* Subtitle */}
      <p className="font-display italic text-center text-[15px] md:text-[17px] text-charcoal-soft mt-4">
        What changed overnight. <span className="text-calm-emerald">What matters now.</span>
      </p>

      {/* Ornamental divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-bordersoft" />
        <span className="w-1 h-1 rounded-full bg-calm-emerald" />
        <span className="w-1.5 h-1.5 rounded-full bg-calm-violet" />
        <span className="w-1 h-1 rounded-full bg-calm-emerald" />
        <div className="flex-1 h-px bg-bordersoft" />
      </div>

      {/* Descriptor */}
      <p className="text-center text-[10.5px] md:text-[11px] tracking-[0.28em] uppercase text-charcoal-mute font-medium">
        Macro · Markets · Currency · Commodities · Filings · Portfolio Impact
      </p>

      {/* Metadata row */}
      <div className="mt-6 pt-4 border-t border-bordersoft flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 md:gap-5 flex-wrap text-[11.5px]">
          <Meta label="Date" value={dateStr} />
          <Sep />
          <Meta label="Market">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-calm-emerald" />
              <span className="text-charcoal-soft font-medium">Open</span>
            </span>
          </Meta>
          <Sep />
          <Meta label="Data">
            <span className="text-charcoal-soft font-medium">Fresh · 3m ago</span>
          </Meta>
        </div>
        <PriorityLensSelector />
      </div>
    </header>
  );
}

function Meta({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="label-mute">{label}</span>
      {value ? <span className="text-charcoal-soft font-medium">{value}</span> : children}
    </span>
  );
}

function Sep() {
  return <span className="text-charcoal-mute/40 select-none">|</span>;
}

function MiniScore({ label, value, dir, sub }: { label: string; value: string; dir: number; sub: string }) {
  const accent =
    dir > 0 ? 'border-l-calm-emerald' : dir < 0 ? 'border-l-calm-rose' : 'border-l-bordersoft';
  return (
    <div className={clsx('bg-cream border border-bordersoft border-l-[3px] rounded-xl p-3.5 shadow-soft', accent)}>
      <div className="label-mute">{label}</div>
      <div className="mt-1.5 font-display text-[18px] font-semibold text-charcoal leading-tight tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11.5px] text-charcoal-mute tabular-nums">{sub}</div>
    </div>
  );
}
