import { motion } from 'framer-motion';
import { TrendCard } from '../components/TrendCard';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { indices, sectors, breadth, gainers, losers, unusualVolume } from '../data/markets';
import type { MoverItem } from '../data/markets';
import { Delta } from '../components/Delta';
import { SignalChip } from '../components/Chip';
import clsx from 'clsx';
import { useStore } from '../state/store';
import { aiSignals } from '../data/signals';
import { pct, deltaColor } from '../utils/format';

export function Markets() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-7">
      <header>
        <h1 className="font-display text-[28px] text-charcoal">Markets</h1>
        <p className="text-[13px] text-charcoal-mute mt-1">Indices, sectors, breadth, movers, unusual volume.</p>
      </header>

      <section>
        <SectionHeader title="Indices" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {indices.map((i) => (
            <TrendCard key={i.id} item={i} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Sector heatmap" subtitle="1D % change" className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {sectors.map((s) => {
              const v = s.trend!.d1;
              const intensity = Math.min(1, Math.abs(v) / 2);
              const bg = v >= 0
                ? `rgba(91, 174, 138, ${0.10 + intensity * 0.35})`
                : `rgba(201, 122, 120, ${0.10 + intensity * 0.35})`;
              return (
                <div
                  key={s.id}
                  className="rounded-xl p-3 border border-bordersoft"
                  style={{ background: bg }}
                >
                  <div className="text-[12px] text-charcoal-soft truncate">{s.title}</div>
                  <div className={clsx('text-[16px] font-semibold mt-1', deltaColor(v))}>{pct(v)}</div>
                  <div className="text-[11px] text-charcoal-mute mt-1 line-clamp-1">{s.whyShown}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Market breadth" subtitle="Advance / decline & participation">
          <div className="grid grid-cols-2 gap-3 mt-2">
            <BreadthStat label="Advancers" value={breadth.advancers} accent="text-calm-green" />
            <BreadthStat label="Decliners" value={breadth.decliners} accent="text-calm-rose" />
            <BreadthStat label="New highs" value={breadth.newHighs} accent="text-calm-green" />
            <BreadthStat label="New lows" value={breadth.newLows} accent="text-calm-rose" />
            <BreadthStat label="% above 50D" value={`${breadth.aboveSMA50}%`} accent="text-charcoal" />
            <BreadthStat label="% above 200D" value={`${breadth.aboveSMA200}%`} accent="text-charcoal" />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MoverList title="Top gainers" items={gainers} positive />
        <MoverList title="Top losers" items={losers} />
        <MoverList title="Unusual volume" items={unusualVolume} volumeFocus />
      </section>

      <section>
        <SectionHeader title='"Why did this move?"' hint="Quick explanation cards for today's notable movers." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectors.slice(0, 4).map((s) => (
            <Card key={s.id} title={s.title} subtitle={s.whyShown} right={<SignalChip value={s.signal} />}>
              <div className="flex items-center gap-3 mt-1">
                <Delta value={s.trend!.d1} label="1D" />
                <Delta value={s.trend!.d5} label="5D" />
                <Delta value={s.trend!.m1} label="1M" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function BreadthStat({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="p-3 rounded-xl bg-ivory-50 border border-bordersoft">
      <div className="label-mute">{label}</div>
      <div className={clsx('text-[18px] font-display font-semibold mt-1', accent)}>{value}</div>
    </div>
  );
}

function MoverList({ title, items, positive, volumeFocus }: { title: string; items: MoverItem[]; positive?: boolean; volumeFocus?: boolean }) {
  const { openDrawer } = useStore();
  return (
    <Card title={title} subtitle={positive ? 'Portfolio first, then broader' : volumeFocus ? 'Volume relative to average' : 'Portfolio first, then broader'}>
      <ul className="mt-2 divide-y divide-bordersoft">
        {items.map((m) => (
          <li key={m.ticker}>
            <button
              onClick={() => openDrawer(aiSignals[2])}
              className="w-full text-left py-2.5 flex items-center justify-between gap-3 hover:bg-ivory-50 rounded-lg px-2 transition"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-[13px] font-semibold text-charcoal">{m.ticker}</div>
                  <span className={clsx(
                    'chip',
                    m.scope === 'portfolio' ? 'bg-calm-navy-bg text-calm-navy border border-calm-navy/30'
                      : m.scope === 'watchlist' ? 'bg-calm-violet-bg text-calm-violet border border-calm-violet/30'
                      : 'bg-ivory-100 text-charcoal-mute border border-bordersoft'
                  )}>
                    {m.scope}
                  </span>
                </div>
                <div className="text-[12px] text-charcoal-mute truncate">{m.reason}</div>
              </div>
              <div className="text-right">
                <Delta value={m.pct} />
                {m.volumeX && <div className="text-[11px] text-charcoal-mute">{m.volumeX}x vol</div>}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
