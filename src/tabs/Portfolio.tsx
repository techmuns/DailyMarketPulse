import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { Heatmap } from '../components/Heatmap';
import type { HeatCell } from '../components/Heatmap';
import { portfolio as mockPortfolio, portfolioStats } from '../data/portfolio';
import { useLiveOverlay } from '../state/liveData';
import { Delta } from '../components/Delta';
import { Sparkline } from '../components/Sparkline';
import { ToneDot, MeaningBadge } from '../components/Tone';
import { PulseBrief } from '../components/PulseBrief';
import { pct } from '../utils/format';
import { getSignalTone, toneTokens, marketMeaning } from '../utils/tone';
import { aiSignals } from '../data/signals';
import { useStore } from '../state/store';
import { AddHolding } from '../components/AddHolding';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import clsx from 'clsx';

export function Portfolio({ hideBrief = false }: { hideBrief?: boolean } = {}) {
  const { openDrawer } = useStore();
  const portfolio = useLiveOverlay(mockPortfolio, 'holdings');
  const sortedByWeight = [...portfolio].sort((a, b) => b.weight - a.weight);

  const heat: HeatCell[] = sortedByWeight.map((h) => ({
    id: h.id,
    label: h.ticker,
    value: h.trend!.d1,
    sub: h.sector,
    size: h.weight,
  }));

  const contribData = [...portfolio]
    .map((h) => ({ name: h.ticker, value: h.trend!.d1 * (h.weight / 100) * 100, raw: h.trend!.d1 }))
    .sort((a, b) => b.value - a.value);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-9">
      {!hideBrief && <PulseBrief tabKey="Portfolio" />}

      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="label-mute">Portfolio</p>
          <h1 className="h-display text-[26px] font-semibold mt-1.5">Your book</h1>
          <p className="text-[12.5px] text-charcoal-mute mt-1.5">What changed since yesterday for your holdings.</p>
        </div>
        <div className="shrink-0 pt-1">
          <AddHolding />
        </div>
      </header>

      {/* Scorecards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Scorecard label="Book value" value={portfolioStats.bookValue} sub="mock NAV" accent="navy" />
        <Scorecard label="Today" value={pct(portfolioStats.todayChange)} dir={portfolioStats.todayChange} sub={`${portfolioStats.positive}↑ / ${portfolioStats.negative}↓`} />
        <Scorecard label="5-day" value={pct(portfolioStats.d5Change)} dir={portfolioStats.d5Change} sub="rolling" />
        <Scorecard label="1-month" value={pct(portfolioStats.m1Change)} dir={portfolioStats.m1Change} sub="rolling" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title="Holdings heatmap" subtitle="Sized by weight · coloured by 1D move">
          <Heatmap cells={heat} cols={4} onClick={() => openDrawer(aiSignals[0])} />
        </Card>
        <Card title="Contribution (1D)" subtitle="Weighted bps to book today">
          <div className="h-[220px] mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contribData} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#7A7A82' }} width={56} />
                <ReferenceLine x={0} stroke="#DDD6E8" />
                <Bar dataKey="value" radius={[3, 3, 3, 3]} barSize={10}>
                  {contribData.map((d) => (
                    <Cell key={d.name} fill={d.value >= 0 ? '#0F8F6F' : '#C86B6B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeader title="Portfolio Impact Board" eyebrow="Holdings" hint="Weight, today's move, 5D trend, impact driver and action." />
        <div className="card overflow-hidden">
          <table className="tbl">
            <thead>
              <tr>
                <th className="pl-5">Company</th>
                <th className="w-[90px]">Weight</th>
                <th className="w-[90px]">1D</th>
                <th className="w-[110px]">5D trend</th>
                <th>Impact driver</th>
                <th className="w-[90px]">Signal</th>
                <th className="pr-5 w-[120px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedByWeight.map((h) => {
                const tone = getSignalTone({ ...h, scope: 'portfolio' });
                const meaning = marketMeaning({ ...h, category: 'portfolio' });
                return (
                  <tr key={h.id} className={clsx('row-link', toneTokens(tone).rowClass)} onClick={() => openDrawer(aiSignals[0])}>
                    <td className="pl-5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-charcoal">{h.title}</span>
                        {meaning && <MeaningBadge tone={tone}>{meaning}</MeaningBadge>}
                      </div>
                      <div className="text-[10.5px] text-charcoal-mute mt-0.5">{h.sector}</div>
                    </td>
                    <td className="tabular-nums text-charcoal-soft text-[12px]">{h.weight}%</td>
                    <td><Delta value={h.trend!.d1} /></td>
                    <td>
                      <div className="w-[80px]">
                        <Sparkline data={h.trend!.spark} color={toneTokens(tone).spark} height={22} />
                      </div>
                    </td>
                    <td className="text-[11.5px] text-charcoal-mute leading-snug">{h.whyShown}</td>
                    <td><ToneDot tone={tone} /></td>
                    <td className="pr-5 text-[11.5px] text-calm-violet">{h.action || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionHeader title="What changed since yesterday for my book" eyebrow="Read" />
        <Card padding="md">
          <ul className="text-[12.5px] text-charcoal-soft space-y-2.5">
            <Read change="Risk increased" text="Autos input cost squeezed deepened (M&M, MARUTI)" />
            <Read change="Support improved" text="CPI cooler than expected — rate-sensitive holdings benefit" />
            <Read change="Changed since yesterday" text="Asian Paints filing eased crude pass-through worry" />
            <Read change="5-day trend" text="INR weakness now durable — exporter tailwind, importer drag" />
          </ul>
        </Card>
      </section>
    </motion.div>
  );
}

function Scorecard({ label, value, sub, dir, accent }: { label: string; value: string; sub?: string; dir?: number; accent?: 'navy' }) {
  const c =
    accent === 'navy'
      ? 'border-l-calm-navy'
      : dir !== undefined
      ? dir > 0
        ? 'border-l-calm-green'
        : dir < 0
        ? 'border-l-calm-rose'
        : 'border-l-bordersoft'
      : 'border-l-bordersoft';
  return (
    <div className={clsx('bg-cream border border-bordersoft border-l-[3px] rounded-xl p-4 shadow-soft', c)}>
      <div className="label-mute">{label}</div>
      <div className="mt-2 font-display text-[20px] font-semibold text-charcoal leading-tight tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-[11.5px] text-charcoal-mute">{sub}</div>}
    </div>
  );
}

function Read({ change, text }: { change: any; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="chip bg-cream-deep text-charcoal-mute shrink-0 mt-0.5">{change}</span>
      <span>{text}</span>
    </li>
  );
}
