import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { PulseBrief } from '../components/PulseBrief';
import { Heatmap } from '../components/Heatmap';
import type { HeatCell } from '../components/Heatmap';
import { indices as mockIndices, sectors as mockSectors, breadth as mockBreadth, gainers as mockGainers, losers as mockLosers, unusualVolume as mockUnusualVolume } from '../data/markets';
import { useLiveOverlay } from '../state/liveData';
import { useMarketsFeed } from '../state/marketsFeed';
import type { MoverItem } from '../data/markets';
import { Delta } from '../components/Delta';
import { Sparkline } from '../components/Sparkline';
import clsx from 'clsx';
import { useStore } from '../state/store';
import { useAiSignals } from '../utils/useAiSignals';
import { num } from '../utils/format';
import { getSignalTone, toneTokens } from '../utils/tone';

export function Markets() {
  const { openDrawer } = useStore();
  const aiSignals = useAiSignals();
  const indices = useLiveOverlay(mockIndices, 'indices');
  const mkt = useMarketsFeed();
  const sectors = mkt.sectors ?? mockSectors;
  const breadth = mkt.breadth ?? mockBreadth;
  const gainers = mkt.gainers ?? mockGainers;
  const losers = mkt.losers ?? mockLosers;
  const unusualVolume = mkt.unusualVolume ?? mockUnusualVolume;

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
        <SectionHeader title="Market Movers Board" eyebrow="Indices" hint="Index levels, 1D / 5D / 1M reads, and where today's flow is leaning." />
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

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title="Sector heatmap" subtitle="1D change">
          <Heatmap cells={sectorCells} cols={4} onClick={() => openDrawer(aiSignals[3])} />
        </Card>
        <Card title="Market breadth" subtitle="Advance / decline">
          <div className="grid grid-cols-2 gap-2.5 mt-1">
            <BreadthStat label="Advancers" value={breadth.advancers} accent="text-calm-green" />
            <BreadthStat label="Decliners" value={breadth.decliners} accent="text-calm-rose" />
            <BreadthStat label="New highs" value={breadth.newHighs} accent="text-calm-green" />
            <BreadthStat label="New lows" value={breadth.newLows} accent="text-calm-rose" />
            <BreadthStat label="% > 50D" value={`${breadth.aboveSMA50}%`} accent="text-charcoal" />
            <BreadthStat label="% > 200D" value={`${breadth.aboveSMA200}%`} accent="text-charcoal" />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MoverTable title="Top gainers" items={gainers} />
        <MoverTable title="Top losers" items={losers} />
        <MoverTable title="Unusual volume" items={unusualVolume} volume />
      </section>
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

function MoverTable({ title, items, volume }: { title: string; items: MoverItem[]; volume?: boolean }) {
  const { openDrawer } = useStore();
  const aiSignals = useAiSignals();
  return (
    <Card title={title} subtitle="Portfolio first, broader below">
      <table className="tbl mt-2">
        <thead>
          <tr>
            <th>Name</th>
            <th className="w-[60px]">%</th>
            {volume && <th className="w-[40px]">Vol</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((m) => {
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
