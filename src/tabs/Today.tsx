import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { ChangeStripChip, SignalChip, SourceChip } from '../components/Chip';
import { Delta } from '../components/Delta';
import { Sparkline } from '../components/Sparkline';
import { PriorityLensSelector } from '../components/PriorityLens';
import { aiSignals, featuredSignal } from '../data/signals';
import { macro } from '../data/macro';
import { news } from '../data/news';
import { filings } from '../data/news';
import { portfolio, portfolioStats } from '../data/portfolio';
import { marketTemperature } from '../data/markets';
import { actions } from '../data/actions';
import { useStore } from '../state/store';
import { todayLong, signalColor, pct } from '../utils/format';
import clsx from 'clsx';

type FeedItem = {
  id: string;
  group: 'macro' | 'markets' | 'currency' | 'commodity' | 'filing' | 'portfolio' | 'news';
  title: string;
  why: string;
  affected: string[];
  signal: 'risk' | 'support' | 'monitor' | 'noise';
  change?: string;
  source: string;
  action?: string;
};

export function Today() {
  const { lens, openDrawer } = useStore();

  const baseFeed: FeedItem[] = useMemo(() => {
    return [
      {
        id: 'f-cur',
        group: 'currency',
        title: 'USD/INR up — 5-day trend',
        why: 'Sustained INR weakness pressures importers (autos, paints); supports IT/pharma exporters.',
        affected: ['M&M', 'ASIANP', 'INFY', 'TCS'],
        signal: 'risk',
        change: '5-day trend',
        source: 'Reliable media',
        action: 'Add to thesis',
      },
      {
        id: 'f-port-mm',
        group: 'portfolio',
        title: 'M&M down 1.94% — FX + steel double squeeze',
        why: 'Auto inputs rising; margin watch into Q4 commentary.',
        affected: ['M&M'],
        signal: 'risk',
        change: 'Risk increased',
        source: 'Reliable media',
        action: 'Assign follow-up',
      },
      {
        id: 'f-filing',
        group: 'filing',
        title: 'Asian Paints — selective 0.6% price hike',
        why: 'Pass-through retained; softens crude-cost worry.',
        affected: ['ASIANP'],
        signal: 'support',
        change: 'New today',
        source: 'Official filing',
        action: 'Update thesis',
      },
      {
        id: 'f-macro-cpi',
        group: 'macro',
        title: 'India CPI cools to 4.62%',
        why: 'Lower CPI improves rate-cut visibility; rate-sensitives benefit.',
        affected: ['HDFCB', 'BAJFIN', 'Real Estate'],
        signal: 'support',
        change: 'Support improved',
        source: 'Government source',
      },
      {
        id: 'f-com-brent',
        group: 'commodity',
        title: 'Brent crude firms above $84',
        why: 'Input-cost pressure for paints, chemicals, aviation.',
        affected: ['ASIANP', 'Aviation', 'Chemicals'],
        signal: 'risk',
        change: 'Repeated theme',
        source: 'Reliable media',
        action: 'Add to thesis',
      },
      {
        id: 'f-mkt-dmart',
        group: 'markets',
        title: 'DMART — 1.8x volume, no news',
        why: 'Quiet accumulation pattern in watchlist name.',
        affected: ['DMART'],
        signal: 'monitor',
        change: 'New today',
        source: 'Reliable media',
        action: 'Read later',
      },
      {
        id: 'f-news-rbi',
        group: 'news',
        title: 'RBI Deputy Gov: room for accommodation',
        why: 'Reinforces rate-cut visibility; banks, NBFCs, real estate.',
        affected: ['Banks', 'NBFC', 'Real Estate'],
        signal: 'support',
        change: 'Changed since yesterday',
        source: 'Government source',
      },
    ];
  }, []);

  const feed = useMemo(() => {
    const groupRank: Record<string, number> = {
      portfolio: 0,
      macro: 1,
      markets: 2,
      currency: 3,
      commodity: 4,
      filing: 5,
      news: 6,
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

  const top5 = feed.slice(0, 5);

  const portfolioBiggestUp = [...portfolio].sort((a, b) => (b.trend!.d1 - a.trend!.d1))[0];
  const portfolioBiggestDown = [...portfolio].sort((a, b) => a.trend!.d1 - b.trend!.d1)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[12.5px] text-charcoal-mute tracking-wide">Good morning</p>
          <h1 className="font-display text-[34px] leading-tight text-charcoal mt-1">
            Daily Market Pulse
          </h1>
          <p className="text-[13px] text-charcoal-soft mt-1.5">
            {todayLong()} · Markets open · Data fresh as of 08:25 IST
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex items-center gap-2">
            <span className="chip bg-calm-green-bg text-calm-green border border-calm-green/30">
              <span className="w-1.5 h-1.5 rounded-full bg-calm-green inline-block" />
              Data fresh · 3m ago
            </span>
            <span className="chip bg-calm-navy-bg text-calm-navy border border-calm-navy/30">Markets: Open</span>
          </div>
          <PriorityLensSelector />
        </div>
      </header>

      {/* Top row: Market temperature + Featured AI Signal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <MarketTemperatureCard />
        <FeaturedAISignal />
      </div>

      {/* Top 5 changes */}
      <section>
        <SectionHeader
          title="Top 5 changes since yesterday"
          hint="A mix of macro, market movers, currency, commodity, filings, and portfolio impact — re-ordered by your Priority Lens."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {top5.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <ChangeFeedCard item={f} index={i + 1} onOpen={() => openDrawer(aiSignals[i % aiSignals.length])} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Hidden Signal of the Day */}
      <HiddenSignalCard />

      {/* Portfolio impact snapshot */}
      <section>
        <SectionHeader
          title="Portfolio impact snapshot"
          hint="Where today's moves landed in your book."
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatTile
            label="Book temperature"
            value="Mildly defensive"
            accent="bg-calm-amber-bg text-calm-amber border-calm-amber/30"
            sub="Risk slightly elevated"
          />
          <StatTile
            label="Today change"
            value={pct(portfolioStats.todayChange)}
            accent={portfolioStats.todayChange >= 0 ? 'bg-calm-green-bg text-calm-green border-calm-green/30' : 'bg-calm-rose-bg text-calm-rose border-calm-rose/30'}
            sub={`5D ${pct(portfolioStats.d5Change)} · 1M ${pct(portfolioStats.m1Change)}`}
          />
          <StatTile
            label="Biggest positive"
            value={portfolioBiggestUp.title}
            accent="bg-calm-green-bg text-calm-green border-calm-green/30"
            sub={pct(portfolioBiggestUp.trend!.d1)}
          />
          <StatTile
            label="Biggest negative"
            value={portfolioBiggestDown.title}
            accent="bg-calm-rose-bg text-calm-rose border-calm-rose/30"
            sub={pct(portfolioBiggestDown.trend!.d1)}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Companies in today's crosshairs" subtitle="Touched by macro/market/currency moves">
            <ul className="space-y-2 mt-2">
              {portfolio
                .filter((h) => Math.abs(h.trend!.d1) >= 0.7)
                .slice(0, 5)
                .map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-charcoal truncate">{h.title}</div>
                      <div className="text-[12px] text-charcoal-mute truncate">{h.whyShown}</div>
                    </div>
                    <Delta value={h.trend!.d1} />
                  </li>
                ))}
            </ul>
          </Card>
          <Card title="Macro variables touching your book" subtitle="Aggregate macro reads for portfolio sectors">
            <div className="mt-2 grid grid-cols-2 gap-2">
              {macro.slice(0, 4).map((m) => (
                <button
                  key={m.id}
                  onClick={() => openDrawer(aiSignals.find((s) => s.category === 'macro') || aiSignals[0])}
                  className="text-left p-3 rounded-xl bg-ivory-50 border border-bordersoft hover:bg-white transition"
                >
                  <div className="text-[12px] text-charcoal-mute">{m.title}</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-[14px] font-semibold text-charcoal">
                      {typeof m.current === 'number' ? m.current : m.current}
                      {m.unit && <span className="text-[11px] text-charcoal-mute ml-1">{m.unit}</span>}
                    </div>
                    <Delta value={m.trend!.d1} />
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Action queue */}
      <section>
        <SectionHeader title="Action queue" hint="Quick triage — keep your daily flow short and intentional." />
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {actions.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-bordersoft last:border-b-0">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-calm-violet" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] text-charcoal font-medium truncate">{a.title}</div>
                  <div className="text-[12px] text-charcoal-mute truncate">{a.context}</div>
                </div>
                <span className="chip bg-ivory-100 text-charcoal-soft border border-bordersoft">{a.type}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <BroaderMarketNews />

      {/* Filings preview */}
      <section>
        <SectionHeader title="Today's filings" hint="Official intimations relevant to your book." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filings.map((f) => (
            <Card key={f.id} strip={f.changeStrip} title={f.title} subtitle={f.summary} right={<SignalChip value={f.signal} />}>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <SourceChip value={f.source} />
                <span className="chip bg-ivory-100 text-charcoal-soft border border-bordersoft">{f.filingType}</span>
                {f.affected.map((a) => (
                  <span key={a} className="chip bg-calm-navy-bg text-calm-navy border border-calm-navy/20">{a}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function MarketTemperatureCard() {
  const { status, oneLine, spark } = marketTemperature;
  const accent =
    status === 'risk-on'
      ? 'bg-calm-green-bg text-calm-green border-calm-green/30'
      : status === 'risk-off'
      ? 'bg-calm-rose-bg text-calm-rose border-calm-rose/30'
      : 'bg-calm-amber-bg text-calm-amber border-calm-amber/30';
  return (
    <Card className="lg:col-span-1">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="label-mute">Market temperature</span>
          <span className={clsx('chip border capitalize', accent)}>
            {status.replace('-', ' ')}
          </span>
        </div>
        <div className="text-[15.5px] text-charcoal leading-snug">{oneLine}</div>
        <div className="-mx-1">
          <Sparkline data={spark} color="#3A5A7A" height={56} strokeWidth={2} />
        </div>
        <div className="flex items-center gap-3 text-[12px] text-charcoal-mute">
          <span>1D <span className="text-charcoal font-medium ml-1">{pct(2.1)}</span></span>
          <span>5D <span className="text-charcoal font-medium ml-1">{pct(4.6)}</span></span>
          <span>1M <span className="text-charcoal font-medium ml-1">{pct(7.2)}</span></span>
        </div>
      </div>
    </Card>
  );
}

function FeaturedAISignal() {
  const { openDrawer } = useStore();
  return (
    <button
      onClick={() => openDrawer(featuredSignal)}
      className="lg:col-span-2 group relative text-left rounded-2xl border border-calm-violet/25 bg-gradient-to-br from-calm-violet-bg via-cream to-white p-5 shadow-soft hover:shadow-lift transition-all duration-300 overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-calm-violet/15 blur-2xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="chip bg-calm-violet text-white">AI Signal · Featured</span>
          <ChangeStripChip value="5-day trend" />
        </div>
        <h2 className="font-display text-[22px] leading-snug text-charcoal">{featuredSignal.title}</h2>
        <p className="text-[13.5px] text-charcoal-soft mt-2 leading-relaxed">
          {featuredSignal.whyItMatters}
        </p>
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <SourceChip value={featuredSignal.source} />
          <span className="chip bg-white text-charcoal-soft border border-bordersoft">
            Confidence {featuredSignal.confidence}%
          </span>
          {featuredSignal.affected.slice(0, 4).map((a) => (
            <span key={a} className="chip bg-white text-charcoal-soft border border-bordersoft">
              {a}
            </span>
          ))}
        </div>
        <div className="mt-4 text-[12.5px] text-calm-violet font-medium group-hover:translate-x-0.5 transition-transform">
          Open signal drawer →
        </div>
      </div>
    </button>
  );
}

function ChangeFeedCard({ item, index, onOpen }: { item: FeedItem; index: number; onOpen: () => void }) {
  const sig = signalColor(item.signal);
  return (
    <button
      onClick={onOpen}
      className="card card-hover text-left w-full p-4 flex flex-col gap-2.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-charcoal-mute">{String(index).padStart(2, '0')}</span>
          {item.change && <ChangeStripChip value={item.change as any} />}
        </div>
        <SignalChip value={item.signal} />
      </div>
      <div className="text-[14px] font-semibold text-charcoal leading-snug">{item.title}</div>
      <div className="text-[12.5px] text-charcoal-soft leading-snug">{item.why}</div>
      <div className="flex items-center gap-1.5 flex-wrap mt-1">
        {item.affected.slice(0, 3).map((a) => (
          <span key={a} className={clsx('chip border', sig.bg, sig.fg, sig.border)}>{a}</span>
        ))}
      </div>
      {item.action && (
        <div className="text-[12px] text-calm-violet font-medium mt-1">+ {item.action}</div>
      )}
    </button>
  );
}

function HiddenSignalCard() {
  const { openDrawer } = useStore();
  return (
    <button
      onClick={() => openDrawer(aiSignals[0])}
      className="block w-full text-left rounded-2xl border border-bordersoft bg-cream p-6 shadow-soft hover:shadow-lift transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="chip bg-calm-violet text-white">Hidden Signal of the Day</span>
        <span className="chip bg-calm-amber-bg text-calm-amber border border-calm-amber/30">5-day trend</span>
      </div>
      <h2 className="font-display text-[22px] leading-snug text-charcoal">
        INR weakness is now a 5-day trend.
      </h2>
      <p className="text-[14.5px] text-charcoal-soft mt-2 leading-relaxed">
        Import-cost pressure increased for autos and paints, while IT exporters may benefit.
        Two of your holdings (M&M, Asian Paints) and two thesis-positive names (Infosys, TCS) are touched by the same theme.
      </p>
      <div className="mt-3 text-[12.5px] text-calm-violet font-medium">Open AI Signal Drawer →</div>
    </button>
  );
}

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="card p-4">
      <div className="label-mute">{label}</div>
      <div className="text-[18px] font-display font-semibold text-charcoal mt-1.5 leading-tight">{value}</div>
      {sub && (
        <span className={clsx('chip border mt-2 inline-flex', accent)}>{sub}</span>
      )}
    </div>
  );
}

function BroaderMarketNews() {
  const broader = news.filter((n) => n.scope === 'broader');
  const portfolioNews = news.filter((n) => n.scope === 'portfolio' || n.scope === 'watchlist');
  return (
    <section>
      <SectionHeader title="Your book first, then the wider market" hint="Portfolio and watchlist news sit above broader market chatter." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="label-mute">Portfolio & watchlist</div>
          {portfolioNews.map((n) => (
            <NewsRow key={n.id} item={n} />
          ))}
        </div>
        <div className="space-y-3">
          <div className="label-mute">Broader market</div>
          {broader.map((n) => (
            <NewsRow key={n.id} item={n} />
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsRow({ item }: { item: (typeof news)[number] }) {
  const { openDrawer } = useStore();
  return (
    <button
      onClick={() => openDrawer(aiSignals[1])}
      className="text-left w-full card card-hover p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {item.changeStrip && <ChangeStripChip value={item.changeStrip} />}
            <SourceChip value={item.source} />
          </div>
          <div className="text-[14px] font-semibold text-charcoal leading-snug">{item.title}</div>
          <div className="text-[12.5px] text-charcoal-soft mt-1">{item.summary}</div>
        </div>
        <SignalChip value={item.signal} />
      </div>
      <div className="text-[11.5px] text-charcoal-mute mt-2">
        Why shown · {item.whyShown}
      </div>
    </button>
  );
}
