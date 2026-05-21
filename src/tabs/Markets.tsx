import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { PulseBrief } from '../components/PulseBrief';
import { Heatmap } from '../components/Heatmap';
import type { HeatCell } from '../components/Heatmap';
import { indices as mockIndices, sectors as mockSectors, breadth, gainers, losers, unusualVolume } from '../data/markets';
import { useLiveOverlay, DataSourceChip, useLiveMovers, useLiveFiiDii } from '../state/liveData';
import { LiveWire } from '../components/LiveWire';
import type { MoverItem } from '../data/markets';
import type { MoneyControlMover } from '../state/liveData';
import { Delta } from '../components/Delta';
import { Sparkline } from '../components/Sparkline';
import clsx from 'clsx';
import { useStore } from '../state/store';
import { aiSignals } from '../data/signals';
import { num } from '../utils/format';
import { getSignalTone, toneTokens } from '../utils/tone';

export function Markets() {
  const { openDrawer } = useStore();
  const indices = useLiveOverlay(mockIndices, 'indices');
  const sectors = useLiveOverlay(mockSectors, 'sectors');
  const liveGainers = useLiveMovers('gainers');
  const liveLosers = useLiveMovers('losers');
  const fiiDii = useLiveFiiDii();

  const sectorCells: HeatCell[] = sectors.map((s) => ({
    id: s.id,
    label: s.title,
    value: s.trend!.d1,
    sub: s.whyShown,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-9">
      <PulseBrief tabKey="Markets" />

      <header>
        <p className="label-mute">Markets</p>
        <h1 className="h-display text-[26px] font-semibold mt-1.5">Indices, sectors & movers</h1>
      </header>

      <section>
        <SectionHeader
          title="Market Movers Board"
          eyebrow="Indices"
          hint="Index levels, 1D / 5D / 1M reads, and where today's flow is leaning."
          right={<DataSourceChip section="indices" />}
        />
        <div className="card overflow-hidden">
          <table className="tbl">
            <thead>
              <tr>
                <th className="pl-5">Index</th>
                <th className="w-[110px]">Level</th>
                <th className="w-[80px]">1D</th>
                <th className="w-[80px]">5D</th>
                <th className="w-[80px]">1M</th>
                <th className="w-[120px]">Trend</th>
                <th className="pr-5">Read</th>
              </tr>
            </thead>
            <tbody>
              {indices.map((i) => {
                const tone = getSignalTone(i);
                return (
                  <tr key={i.id} className={clsx('row-link', toneTokens(tone).rowClass)} onClick={() => openDrawer(aiSignals[3])}>
                    <td className="pl-5">
                      <div className="text-[13px] font-semibold text-charcoal">{i.title}</div>
                      <div className="text-[10.5px] text-charcoal-mute">{i.region}</div>
                    </td>
                    <td className="font-display font-medium text-charcoal tabular-nums">{num(i.current as number, i.title === 'India VIX' ? 2 : 0)}</td>
                    <td><Delta value={i.trend!.d1} /></td>
                    <td><Delta value={i.trend!.d5} size="xs" /></td>
                    <td><Delta value={i.trend!.m1} size="xs" /></td>
                    <td><div className="w-[100px]"><Sparkline data={i.trend!.spark} color={toneTokens(tone).spark} height={22} /></div></td>
                    <td className="pr-5 text-[11.5px] text-charcoal-mute leading-snug">{i.whyShown}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Sector heatmap"
          eyebrow="Sectors"
          hint="Nifty sector index 1D moves."
          right={<DataSourceChip section="sectors" />}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2" padding="md">
            <Heatmap cells={sectorCells} cols={4} onClick={() => openDrawer(aiSignals[3])} />
          </Card>
          <Card title="Market breadth" subtitle="Advance / decline (mock)">
            <div className="grid grid-cols-2 gap-2.5 mt-1">
              <BreadthStat label="Advancers" value={breadth.advancers} accent="text-calm-green" />
              <BreadthStat label="Decliners" value={breadth.decliners} accent="text-calm-rose" />
              <BreadthStat label="New highs" value={breadth.newHighs} accent="text-calm-green" />
              <BreadthStat label="New lows" value={breadth.newLows} accent="text-calm-rose" />
              <BreadthStat label="% > 50D" value={`${breadth.aboveSMA50}%`} accent="text-charcoal" />
              <BreadthStat label="% > 200D" value={`${breadth.aboveSMA200}%`} accent="text-charcoal" />
            </div>
          </Card>
        </div>
      </section>

      <FiiDiiCard state={fiiDii} />

      <section>
        <SectionHeader
          title="Movers"
          eyebrow="NSE · today"
          hint="Top gainers, losers, and unusual volume."
          right={
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] tracking-[0.18em] uppercase font-semibold shrink-0',
                liveGainers.kind === 'live' || liveGainers.kind === 'delayed'
                  ? 'bg-calm-emerald-bg/70 ring-1 ring-calm-emerald/25 text-calm-emerald'
                  : 'bg-cream-deep ring-1 ring-bordersoft text-charcoal-mute'
              )}
              title={liveGainers.kind === 'live' ? 'Live NSE movers via moneycontrol' : 'Bundled mock movers'}
            >
              {liveGainers.kind === 'live' || liveGainers.kind === 'delayed' ? (
                <>
                  <span className="relative inline-flex w-1.5 h-1.5">
                    <span className="absolute inset-0 rounded-full bg-calm-emerald opacity-60 animate-ping" />
                    <span className="relative w-1.5 h-1.5 rounded-full bg-calm-emerald" />
                  </span>
                  Live · NSE
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-charcoal-mute/60" />
                  Mock
                </>
              )}
            </span>
          }
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MoverTable
            title="Top gainers"
            liveItems={liveGainers.kind === 'live' || liveGainers.kind === 'delayed' ? liveGainers.items : null}
            mockItems={gainers}
          />
          <MoverTable
            title="Top losers"
            liveItems={liveLosers.kind === 'live' || liveLosers.kind === 'delayed' ? liveLosers.items : null}
            mockItems={losers}
          />
          <MoverTable
            title="Unusual volume"
            mockItems={unusualVolume}
            liveItems={null}
            volume
          />
        </div>
      </section>

      <LiveWire
        title="Sectoral & index news wire"
        eyebrow="MoneyControl · markets-filtered"
        hint="Live headlines mentioning indices, sectors, or major movers."
        keywords={['nifty', 'sensex', 'bse', 'nse', 'index', 'sector', 'bank', 'it', 'auto', 'pharma', 'metal', 'fmcg']}
        limit={6}
      />
    </motion.div>
  );
}

function BreadthStat({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="p-3 rounded-lg bg-cream-deep border border-bordersoft">
      <div className="label-mute">{label}</div>
      <div className={clsx('text-[16px] font-display font-semibold mt-1 tabular-nums', accent)}>{value}</div>
    </div>
  );
}

function MoverTable({
  title,
  mockItems,
  liveItems,
  volume,
}: {
  title: string;
  mockItems: MoverItem[];
  liveItems: MoneyControlMover[] | null;
  volume?: boolean;
}) {
  const { openDrawer } = useStore();
  const useLive = liveItems != null && liveItems.length > 0;
  return (
    <Card title={title} subtitle={useLive ? 'NSE · top 10 live' : 'Portfolio first, broader below'}>
      <table className="tbl mt-2">
        <thead>
          <tr>
            <th>Name</th>
            <th className="w-[60px]">%</th>
            {volume && <th className="w-[40px]">Vol</th>}
          </tr>
        </thead>
        <tbody>
          {useLive
            ? liveItems!.map((m) => {
                const pct = m.changePct ?? 0;
                const tone = pct >= 0 ? 'support' : 'risk';
                return (
                  <tr
                    key={m.name}
                    className={clsx('row-link', toneTokens(tone).rowClass)}
                    onClick={() => openDrawer(aiSignals[2])}
                  >
                    <td>
                      <span className="font-mono text-[11.5px] text-charcoal-soft bg-cream-deep border border-bordersoft px-1.5 py-0.5 rounded">
                        {m.name}
                      </span>
                    </td>
                    <td><Delta value={pct} /></td>
                  </tr>
                );
              })
            : mockItems.map((m) => {
                const tone = volume ? 'monitor' : m.pct >= 0 ? 'support' : 'risk';
                return (
                  <tr key={m.ticker} className={clsx('row-link', toneTokens(tone).rowClass)} onClick={() => openDrawer(aiSignals[2])}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11.5px] text-charcoal-soft bg-cream-deep border border-bordersoft px-1.5 py-0.5 rounded">{m.ticker}</span>
                        <span className={clsx(
                          'chip',
                          m.scope === 'portfolio' && 'bg-calm-navy-bg text-calm-navy',
                          m.scope === 'watchlist' && 'bg-calm-violet-bg text-calm-violet',
                          m.scope === 'broader' && 'bg-cream-deep text-charcoal-mute'
                        )}>
                          {m.scope}
                        </span>
                      </div>
                    </td>
                    <td><Delta value={m.pct} /></td>
                    {volume && <td className="text-[11.5px] text-charcoal-mute tabular-nums">{m.volumeX}x</td>}
                  </tr>
                );
              })}
        </tbody>
      </table>
    </Card>
  );
}

function FiiDiiCard({
  state,
}: {
  state: ReturnType<typeof useLiveFiiDii>;
}) {
  const live = state.kind === 'live' || state.kind === 'delayed';
  if (!live || !state.data) return null;
  const { date, fii, dii } = state.data;
  const fmt = (n: number | null) =>
    n == null ? '—' : `${n > 0 ? '+' : ''}${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const fiiNet = fii.net ?? 0;
  const diiNet = dii.net ?? 0;
  return (
    <section>
      <SectionHeader
        title="FII / DII activity"
        eyebrow={`MoneyControl · ${date}`}
        hint="Net flows ₹ cr. Negative = selling, positive = buying."
        right={
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-calm-emerald-bg/70 ring-1 ring-calm-emerald/25 text-[9.5px] tracking-[0.18em] uppercase font-semibold text-calm-emerald shrink-0">
            <span className="relative inline-flex w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-calm-emerald opacity-60 animate-ping" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-calm-emerald" />
            </span>
            Live
          </span>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="FII (Foreign)" subtitle="Net ₹ cr">
          <div className={clsx(
            'font-display text-[28px] font-semibold tabular-nums mt-1',
            fiiNet > 0 ? 'text-calm-green' : fiiNet < 0 ? 'text-calm-rose' : 'text-charcoal'
          )}>
            {fmt(fii.net)}
          </div>
          <div className="text-[11px] text-charcoal-mute mt-1">
            Buy {fmt(fii.buy)} · Sell {fmt(fii.sell)}
          </div>
        </Card>
        <Card title="DII (Domestic)" subtitle="Net ₹ cr">
          <div className={clsx(
            'font-display text-[28px] font-semibold tabular-nums mt-1',
            diiNet > 0 ? 'text-calm-green' : diiNet < 0 ? 'text-calm-rose' : 'text-charcoal'
          )}>
            {fmt(dii.net)}
          </div>
          <div className="text-[11px] text-charcoal-mute mt-1">
            Buy {fmt(dii.buy)} · Sell {fmt(dii.sell)}
          </div>
        </Card>
      </div>
    </section>
  );
}
