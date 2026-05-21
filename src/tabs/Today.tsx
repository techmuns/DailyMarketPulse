import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeader } from '../components/SectionHeader';
import { ChangeStripChip, Ticker } from '../components/Chip';
import { ToneDot, MeaningBadge } from '../components/Tone';
import { PulseBrief } from '../components/PulseBrief';
import { getSignalTone, toneTokens } from '../utils/tone';
import { Delta } from '../components/Delta';
import { Sparkline } from '../components/Sparkline';
import { PriorityLensSelector } from '../components/PriorityLens';
import { HeadlineStack } from '../components/HeadlineStack';
import { LiveWire } from '../components/LiveWire';
import { SectorIntel } from '../components/SectorIntel';
import { aiSignals } from '../data/signals';
import { marketTemperature, indices } from '../data/markets';
import { lensHeadlines } from '../data/lensHeadlines';
import { useStore } from '../state/store';
import { todayLong, pct } from '../utils/format';
import { useLive, formatFreshness } from '../state/liveData';
import clsx from 'clsx';
import type { LensType, Signal } from '../types';

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
  impact: number;
  scope?: 'portfolio' | 'watchlist' | 'broader';
  meaning?: string;
};

export function Today() {
  const { lens, openDrawer } = useStore();
  const liveFetchedAt = useLive().data?.fetchedAt ?? null;

  const baseFeed: FeedItem[] = useMemo(() => [
    { id: 'f-cur', group: 'currency', title: 'USD/INR weakness — 5-day trend', why: 'Importer cost pressure; exporter tailwind', affected: ['M&M', 'ASIANP', 'INFY', 'TCS'], signal: 'risk', change: '5-day trend', d1: 0.25, d5: 0.62, action: 'Add to thesis', impact: 85, scope: 'portfolio', meaning: 'FX Pressure' },
    { id: 'f-port-mm', group: 'portfolio', title: 'M&M — FX + steel double squeeze', why: 'Auto inputs rising; margin watch', affected: ['M&M'], signal: 'risk', change: 'Risk increased', d1: -1.94, d5: -3.1, action: 'Assign follow-up', impact: 81, scope: 'portfolio', meaning: 'Margin Risk' },
    { id: 'f-filing', group: 'filing', title: 'Asian Paints — 0.6% selective price hike', why: 'Pass-through retained; eases crude risk', affected: ['ASIANP'], signal: 'support', change: 'New today', d1: 0.4, d5: 0.7, action: 'Update thesis', impact: 62, scope: 'portfolio', meaning: 'Input Cost Relief' },
    { id: 'f-macro-cpi', group: 'macro', title: 'India CPI cools to 4.62%', why: 'Rate-cut visibility improves', affected: ['HDFCB', 'BAJFIN'], signal: 'support', change: 'Support improved', d1: -4.0, d5: -4.0, impact: 78, scope: 'portfolio', meaning: 'Rate Support' },
    { id: 'f-com-brent', group: 'commodity', title: 'Brent crude firms above $84', why: 'Input cost pressure for paints, aviation', affected: ['ASIANP', 'Aviation'], signal: 'risk', change: 'Repeated theme', d1: 2.06, d5: 3.4, action: 'Add to thesis', impact: 82, scope: 'portfolio', meaning: 'Input Cost ↑' },
    { id: 'f-mkt-dmart', group: 'markets', title: 'DMART — 1.8x volume, no news', why: 'Quiet accumulation pattern', affected: ['DMART'], signal: 'monitor', change: 'New today', d1: 1.02, d5: 1.6, action: 'Read later', impact: 55, scope: 'watchlist', meaning: 'Volume Breakout' },
    { id: 'f-news-rbi', group: 'news', title: 'RBI: room for accommodation', why: 'Reinforces rate-cut visibility', affected: ['Banks', 'NBFC'], signal: 'support', change: 'Changed since yesterday', d1: 0.0, d5: 0.0, impact: 76, scope: 'broader', meaning: 'Rate Support' },
  ], []);

  const feed = useMemo(() => {
    const groupRank: Record<string, number> = {
      portfolio: 0, macro: 1, markets: 2, currency: 3, commodity: 4, filing: 5, news: 6,
    };
    // Map the new lens semantic onto the feed groups so the "Top changes"
    // table still reorders in a sensible way. Global → macro/news; Sectoral
    // → markets; Portfolio Related → portfolio.
    const lensFocus: Record<string, FeedItem['group']> = {
      Global: 'macro',
      Sectoral: 'markets',
      'Portfolio Related': 'portfolio',
    };
    const focus = lensFocus[lens];
    return [...baseFeed].sort((a, b) => {
      const af = a.group === focus ? -10 : 0;
      const bf = b.group === focus ? -10 : 0;
      return groupRank[a.group] + af - (groupRank[b.group] + bf);
    });
  }, [baseFeed, lens]);

  const lensType: LensType =
    lens === 'Global' ? 'global'
      : lens === 'Sectoral' ? 'sectoral'
      : 'portfolio';
  const stripHeadlines = lensHeadlines.filter((h) => h.lensType === lensType);
  const stripTitle: Record<LensType, string> = {
    global: 'Top global headlines',
    sectoral: 'Sector headlines',
    portfolio: 'Headlines linked to your book',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-9">
      {/* A — Newspaper masthead */}
      <Masthead liveFetchedAt={liveFetchedAt} />

      <PulseBrief tabKey="Today" />

      {/* Below-PulseBrief 2-column module: Market Weather (left)
          + vertical lens headlines (right). The lens selector in the
          masthead control bar still drives which headlines fill the
          right column. */}
      <CuratedHeadlinesSection
        title={stripTitle[lensType]}
        lens={lens}
        items={stripHeadlines.slice(0, 5)}
        lensType={lensType}
        sectoralHeadlines={lensHeadlines.filter((h) => h.lensType === 'sectoral')}
      />

      <LiveWire
        title="Live market wire"
        eyebrow="MoneyControl · markets"
        hint="Live India-market headlines, refreshed twice a day."
        limit={6}
      />

      {/* Top changes since yesterday — moved up to sit directly under
          the Market Weather + Headlines block. */}
      <section>
        <SectionHeader
          title="Top changes since yesterday"
          eyebrow={`Reordered by ${lens} lens`}
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
              {feed.map((f, i) => {
                const tone = getSignalTone(f);
                return (
                  <tr
                    key={f.id}
                    className={clsx('row-link', toneTokens(tone).rowClass)}
                    onClick={() => openDrawer(aiSignals[i % aiSignals.length])}
                  >
                    <td className="pl-5 font-mono text-[11px] text-charcoal-mute tabular-nums">{String(i + 1).padStart(2, '0')}</td>
                    <td>
                      <div className="flex items-center gap-2 flex-wrap">
                        {f.change && <ChangeStripChip value={f.change as any} />}
                        {f.meaning && <MeaningBadge tone={tone}>{f.meaning}</MeaningBadge>}
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
                    <td><ToneDot tone={tone} /></td>
                    <td className="pr-5 text-[11.5px] text-calm-violet">{f.action || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

    </motion.div>
  );
}

type MoodKey =
  | 'heat-alert'
  | 'breezy-uptrend'
  | 'sunny'
  | 'mixed'
  | 'cloudy'
  | 'storm-watch';

const MOOD: Record<MoodKey, { label: string; chip: string; glyph: string; spark: string }> = {
  'heat-alert':     { label: 'Heat Alert',     chip: 'bg-calm-emerald-bg text-calm-emerald', glyph: '🔥', spark: '#0B7E61' },
  'breezy-uptrend': { label: 'Breezy Uptrend', chip: 'bg-calm-emerald-bg text-calm-emerald', glyph: '☀',  spark: '#0B7E61' },
  'sunny':          { label: 'Sunny',          chip: 'bg-calm-green-bg text-calm-green',     glyph: '🌤', spark: '#36A379' },
  'mixed':          { label: 'Mixed',          chip: 'bg-calm-amber-bg text-calm-amber',     glyph: '⛅', spark: '#D7A14A' },
  'cloudy':         { label: 'Cloudy',         chip: 'bg-calm-navy-bg text-calm-navy',       glyph: '☁',  spark: '#4F5D7A' },
  'storm-watch':    { label: 'Storm Watch',    chip: 'bg-calm-rose-bg text-calm-rose',       glyph: '⛈', spark: '#C86B6B' },
};

// Map live index 1-day moves to a weather mood. Uses NIFTY 50, SENSEX,
// and (when present) NIFTY Midcap; if breadth disagrees we fall back
// to "mixed" regardless of magnitude.

// Data-state machinery for the Market Weather card.
// Production must export VITE_DATA_MODE=live (set in the Cloudflare
// Pages environment) to opt into the live overlay. Local dev / any
// build without the variable defaults to mock mode so the dashboard
// renders against bundled data.
const MOCK_MODE = import.meta.env.VITE_DATA_MODE !== 'live';
const FRESH_MS = 4 * 60 * 60 * 1000;

type DataState = 'live' | 'delayed' | 'mock' | 'unavailable';

function resolveDataState(fetchedAt: string | null): {
  state: DataState;
  ageMs: number | null;
} {
  if (MOCK_MODE) return { state: 'mock', ageMs: null };
  if (!fetchedAt) return { state: 'unavailable', ageMs: null };
  const t = Date.parse(fetchedAt);
  if (Number.isNaN(t)) return { state: 'unavailable', ageMs: null };
  const ageMs = Date.now() - t;
  return { state: ageMs <= FRESH_MS ? 'live' : 'delayed', ageMs };
}

function formatAge(ageMs: number): string {
  const mins = Math.max(0, Math.floor(ageMs / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function deriveMood(moves: number[]): MoodKey {
  const valid = moves.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (valid.length === 0) return 'mixed';
  const ups = valid.filter((m) => m > 0.05).length;
  const downs = valid.filter((m) => m < -0.05).length;
  const avg = valid.reduce((s, v) => s + v, 0) / valid.length;
  // Breadth disagrees (some up + some down) → mixed.
  if (ups > 0 && downs > 0) return 'mixed';
  if (avg >= 1.0) return 'heat-alert';
  if (avg >= 0.4) return 'breezy-uptrend';
  if (avg >= 0.05) return 'sunny';
  if (avg <= -0.6) return 'storm-watch';
  if (avg <= -0.05) return 'cloudy';
  return 'mixed';
}

interface ResolvedIndex {
  value: number | null;
  change: number | null;
  d5: number | null;
  m1: number | null;
  spark: number[] | null;
}

function MarketWeatherCard() {
  const { oneLine, spark } = marketTemperature;
  const liveCtx = useLive();
  const fetchedAt = liveCtx.data?.fetchedAt ?? null;
  const { state, ageMs } = resolveDataState(fetchedAt);

  // Index resolver — mock numbers in mock mode, real overlay values
  // in live mode, nulls when the live feed is missing a particular id.
  function pickIndex(id: string): ResolvedIndex {
    if (MOCK_MODE) {
      const m = indices.find((i) => i.id === id);
      if (!m || !m.trend) return { value: null, change: null, d5: null, m1: null, spark: null };
      return {
        value: m.current as number,
        change: m.trend.d1,
        d5: m.trend.d5,
        m1: m.trend.m1,
        spark: m.trend.spark,
      };
    }
    const l = liveCtx.data?.indices.find((i) => i.id === id);
    if (!l) return { value: null, change: null, d5: null, m1: null, spark: null };
    return {
      value: l.current,
      change: l.trend.d1,
      d5: l.trend.d5,
      m1: l.trend.m1,
      spark: l.trend.spark,
    };
  }

  const nifty = pickIndex('i-nifty');
  const sensex = pickIndex('i-sensex');
  const midcap = pickIndex('i-niftym');
  const nasdaq = pickIndex('i-nasdaq');
  const spx = pickIndex('i-spx');

  // Feed deriveMood only finite numbers so its existing breadth logic
  // gracefully ignores tiles that are "—" in unavailable mode.
  const moodInputs = [nifty.change, sensex.change, midcap.change, nasdaq.change, spx.change]
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const moodKey = moodInputs.length === 0 ? 'mixed' : deriveMood(moodInputs);
  const mood = MOOD[moodKey];

  // Sparkline source rules (per spec): mock spark is allowed ONLY in
  // mock mode. In live mode an unavailable feed must NOT fall back to
  // marketTemperature.spark — we render a muted placeholder strip
  // instead.
  const sparkData: number[] | null = nifty.spark ?? (MOCK_MODE ? spark : null);

  return (
    <div
      className="relative rounded-[28px] border overflow-hidden p-5 sm:p-6"
      style={{
        background:
          'linear-gradient(135deg, #FFFFFF 0%, #FCFBFF 65%, #F1ECFF 100%)',
        borderColor: 'rgba(15,143,111,0.22)',
        boxShadow: '0 18px 45px rgba(72,55,120,0.12)',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px] opacity-75"
        style={{ background: 'linear-gradient(90deg, #0B7E61 0%, #8C79C9 60%, transparent 100%)' }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <span className="label-mute">Market Weather</span>
          <div className="mt-1 text-[10.5px] text-charcoal-mute">Today's market mood</div>
          <div className="mt-2">
            <span className={clsx('chip', mood.chip)}>
              <span aria-hidden>{mood.glyph}</span>
              {mood.label}
            </span>
          </div>
        </div>
        <DataStateChip state={state} ageMs={ageMs} />
      </div>

      <p className="relative mt-4 font-display italic text-[14px] md:text-[14.5px] text-charcoal-soft leading-snug">
        {oneLine}
      </p>

      <div className="relative mt-4 grid grid-cols-2 gap-2.5">
        <IndexRow name="NIFTY 50" value={nifty.value} change={nifty.change} />
        <IndexRow name="SENSEX" value={sensex.value} change={sensex.change} />
        <IndexRow name="NASDAQ" value={nasdaq.value} change={nasdaq.change} />
        <IndexRow name="S&P 500" value={spx.value} change={spx.change} />
      </div>

      <div className="relative mt-4 text-[9.5px] tracking-[0.22em] uppercase font-semibold text-charcoal-mute">
        Market Pulse Trend
      </div>
      <div className="relative -mx-2 mt-1">
        {sparkData ? (
          <Sparkline
            data={sparkData}
            color={mood.spark}
            height={48}
            strokeWidth={2}
          />
        ) : (
          <SparklinePlaceholder />
        )}
      </div>

      <div className="relative mt-3 flex items-center gap-5 text-[11.5px] text-charcoal-mute">
        <TrendStat label="1D" value={nifty.change ?? undefined} />
        <TrendStat label="5D" value={nifty.d5 ?? undefined} />
        <TrendStat label="1M" value={nifty.m1 ?? undefined} />
      </div>
    </div>
  );
}

function CuratedHeadlinesSection({
  title,
  lens,
  items,
  lensType,
  sectoralHeadlines,
}: {
  title: string;
  lens: string;
  items: import('../types').LensHeadline[];
  lensType: LensType;
  sectoralHeadlines: import('../types').LensHeadline[];
}) {
  // Same shell across all three lenses: Market Weather is the
  // constant left anchor, and only the right column changes when
  // the user picks a different lens. The right column crossfades so
  // the eye doesn't have to re-parse the whole page on every switch.

  const sectionTitle =
    lensType === 'sectoral'
      ? 'Which sectors mattered today'
      : title;
  const eyebrowText =
    lensType === 'sectoral'
      ? 'Sectoral lens · intelligence'
      : `${lens} lens · curated`;
  const hintText =
    lensType === 'sectoral'
      ? 'AI-ranked sectors that made today’s narrative. Pick any sector to see its top 5 headlines.'
      : 'Editorial narratives with portfolio context. The live wire below carries raw moneycontrol headlines.';

  return (
    <section>
      <SectionHeader
        title={sectionTitle}
        eyebrow={eyebrowText}
        hint={hintText}
        right={
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-calm-violet-bg/60 ring-1 ring-calm-violet/25 text-[9.5px] tracking-[0.18em] uppercase font-semibold text-calm-violet shrink-0"
            title="Curated editorial narratives, not raw news"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-calm-violet" />
            Curated
          </span>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-[38%_62%] gap-6 items-start">
        {/* Stable left anchor — never changes across lenses. */}
        <MarketWeatherCard />

        {/* Right column — crossfades on lens switch. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={lensType}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="min-w-0"
          >
            {lensType === 'sectoral' ? (
              <SectorIntel headlines={sectoralHeadlines} />
            ) : (
              <HeadlineStack items={items} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function DataStateChip({ state, ageMs }: { state: DataState; ageMs: number | null }) {
  if (state === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-calm-emerald-bg/70 ring-1 ring-calm-emerald/25 text-[9.5px] tracking-[0.18em] uppercase font-semibold text-calm-emerald shrink-0">
        <span className="relative inline-flex w-1.5 h-1.5">
          <span className="absolute inset-0 rounded-full bg-calm-emerald opacity-60 animate-ping" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-calm-emerald" />
        </span>
        Live · updated {formatAge(ageMs ?? 0)}
      </span>
    );
  }
  if (state === 'delayed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-calm-amber-bg ring-1 ring-calm-amber/30 text-[9.5px] tracking-[0.18em] uppercase font-semibold text-calm-amber shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-calm-amber" />
        Delayed · updated {formatAge(ageMs ?? 0)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cream-deep ring-1 ring-bordersoft text-[9.5px] tracking-[0.18em] uppercase font-semibold text-charcoal-mute shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-charcoal-mute/60" />
      {state === 'mock' ? 'Mock data' : 'Data unavailable'}
    </span>
  );
}

function SparklinePlaceholder() {
  return (
    <div className="h-12 mx-2 flex items-center justify-center rounded-md border border-dashed border-bordersoft bg-cream-deep/40 text-[10.5px] tracking-[0.18em] uppercase font-semibold text-charcoal-mute">
      Market feed unavailable
    </div>
  );
}

function TrendStat({ label, value }: { label: string; value?: number }) {
  const v = typeof value === 'number' && Number.isFinite(value) ? value : null;
  return (
    <span>
      {label}{' '}
      <span className="text-charcoal-soft font-medium ml-1 tabular-nums">
        {v == null ? '—' : pct(v)}
      </span>
    </span>
  );
}

function IndexRow({ name, value, change }: { name: string; value: number | null; change: number | null }) {
  const up = change != null && change > 0;
  const down = change != null && change < 0;
  const rail = up
    ? 'border-l-calm-green'
    : down
    ? 'border-l-calm-rose'
    : 'border-l-bordersoft';
  const missing = value == null || change == null;
  return (
    <div
      className={clsx(
        'rounded-xl border border-bordersoft bg-white px-3 py-2 border-l-[3px]',
        rail
      )}
    >
      <div className="label-mute">{name}</div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="font-display text-[15px] font-semibold tabular-nums text-charcoal">
          {value == null ? '—' : value.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
        </span>
        {missing ? (
          <span className="text-[11px] text-charcoal-mute">—</span>
        ) : (
          <>
            <Delta value={change!} size="xs" />
            <span
              aria-hidden
              className={clsx(
                'text-[10px]',
                up ? 'text-calm-green' : down ? 'text-calm-rose' : 'text-charcoal-mute'
              )}
            >
              {up ? '▲' : down ? '▼' : '◆'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function Masthead({ liveFetchedAt }: { liveFetchedAt: string | null }) {
  const dateStr = todayLong();
  return (
    <header className="relative">
      {/* Eyebrow strip */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex w-1.5 h-1.5">
            <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-calm-emerald opacity-60" />
            <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-calm-emerald" />
          </span>
          <span className="text-[10.5px] tracking-[0.22em] uppercase text-charcoal-soft font-semibold">
            Live Market Brief · India / Global · 08:25 IST
          </span>
        </div>
        <span className="text-[10.5px] tracking-[0.22em] uppercase text-calm-emerald font-semibold hidden md:inline">
          5-Minute Market Edge
        </span>
      </div>

      {/* Top hairline */}
      <div className="h-[3px] bg-charcoal/90 rounded-full mb-5" />

      {/* Masthead title */}
      <h1 className="h-masthead text-center text-[38px] sm:text-[54px] md:text-[68px] lg:text-[80px] leading-[0.94] uppercase">
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

      {/* Publication mark */}
      <p className="mt-3 text-center text-[10px] tracking-[0.32em] uppercase font-semibold text-charcoal-soft">
        By <span className="text-calm-emerald">Munshot</span>
      </p>

      {/* Market Pulse control bar — replaces the plain Date | Market |
          Data | Lens row with a three-zone capsule: edition info,
          today's pulse tagline, and the lens selector. */}
      <div
        className="mt-6 flex items-center justify-between flex-wrap gap-3 rounded-[24px] border px-4 py-2.5"
        style={{
          background:
            'linear-gradient(135deg, #FFFFFF 0%, #FCFBFF 70%, #F5F0FF 100%)',
          borderColor: 'rgba(140,121,201,0.18)',
          boxShadow: '0 12px 30px rgba(72,55,120,0.07)',
        }}
      >
        <EditionInfo dateStr={dateStr} freshness={formatFreshness(liveFetchedAt)} />
        <PulseTagline fragments={['Risk-off feel', 'INR weak', 'Autos lag']} />
        <PriorityLensSelector />
      </div>
    </header>
  );
}

function DotSep() {
  return <span className="text-charcoal-mute/40 select-none">·</span>;
}

function CalendarGlyph() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-calm-violet/70 shrink-0"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function EditionInfo({ dateStr, freshness }: { dateStr: string; freshness: string }) {
  return (
    <div className="flex items-center gap-3 text-[11.5px] text-charcoal-soft flex-wrap">
      <span className="inline-flex items-center gap-1.5">
        <CalendarGlyph />
        <span className="font-medium">{dateStr}</span>
      </span>
      <DotSep />
      <span className="inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-calm-emerald" />
        <span className="font-medium">Market Open</span>
      </span>
      <DotSep />
      <span className="inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-calm-violet/70" />
        <span className="font-medium">{freshness}</span>
      </span>
    </div>
  );
}

function PulseTagline({ fragments }: { fragments: string[] }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-calm-emerald-bg/50 ring-1 ring-calm-emerald/15 text-[11.5px] text-charcoal-soft">
      <span className="relative inline-flex w-1.5 h-1.5">
        <span className="absolute inset-0 rounded-full bg-calm-emerald opacity-60 animate-ping" />
        <span className="relative w-1.5 h-1.5 rounded-full bg-calm-emerald" />
      </span>
      {fragments.map((frag, i) => (
        <span key={frag} className="inline-flex items-center gap-2">
          <span className="font-medium">{frag}</span>
          {i < fragments.length - 1 && <span className="text-charcoal-mute/40">·</span>}
        </span>
      ))}
    </div>
  );
}

