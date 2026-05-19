import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { portfolio, portfolioStats } from '../data/portfolio';
import { Delta } from '../components/Delta';
import { Sparkline } from '../components/Sparkline';
import { SignalChip, ChangeStripChip } from '../components/Chip';
import { pct, deltaColor } from '../utils/format';
import { aiSignals } from '../data/signals';
import { useStore } from '../state/store';
import clsx from 'clsx';

export function Portfolio() {
  const { openDrawer } = useStore();
  const tempSpark = [49, 51, 52, 53, 51, 50, 49];
  const sorted = [...portfolio].sort((a, b) => b.weight - a.weight);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-7">
      <header>
        <h1 className="font-display text-[28px] text-charcoal">Portfolio</h1>
        <p className="text-[13px] text-charcoal-mute mt-1">What changed since yesterday for your book.</p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="label-mute">Portfolio temperature</span>
            <span className="chip bg-calm-amber-bg text-calm-amber border border-calm-amber/30">Mildly defensive</span>
          </div>
          <div className="font-display text-[24px] text-charcoal mt-2">{portfolioStats.bookValue}</div>
          <div className="flex items-center gap-3 mt-2">
            <Delta value={portfolioStats.todayChange} label="1D" />
            <Delta value={portfolioStats.d5Change} label="5D" />
            <Delta value={portfolioStats.m1Change} label="1M" />
          </div>
          <div className="mt-3">
            <Sparkline data={tempSpark} color="#3A5A7A" height={48} strokeWidth={2} />
          </div>
        </Card>
        <Card>
          <div className="label-mute">Positions up</div>
          <div className="text-[22px] font-display font-semibold text-calm-green mt-1">{portfolioStats.positive}</div>
          <div className="text-[12px] text-charcoal-mute">of {portfolioStats.positive + portfolioStats.negative}</div>
        </Card>
        <Card>
          <div className="label-mute">Positions down</div>
          <div className="text-[22px] font-display font-semibold text-calm-rose mt-1">{portfolioStats.negative}</div>
          <div className="text-[12px] text-charcoal-mute">of {portfolioStats.positive + portfolioStats.negative}</div>
        </Card>
      </section>

      <section>
        <SectionHeader title="Holdings heatmap" hint="Sized by weight, coloured by 1D change." />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {sorted.map((h) => {
            const v = h.trend!.d1;
            const intensity = Math.min(1, Math.abs(v) / 2);
            const bg = v >= 0
              ? `rgba(91, 174, 138, ${0.10 + intensity * 0.35})`
              : `rgba(201, 122, 120, ${0.10 + intensity * 0.35})`;
            return (
              <button
                key={h.id}
                onClick={() => openDrawer(aiSignals[0])}
                className="text-left p-3 rounded-xl border border-bordersoft hover:shadow-soft transition"
                style={{ background: bg }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[12px] text-charcoal-soft truncate">{h.title}</div>
                  <div className="text-[11px] text-charcoal-mute">{h.weight}%</div>
                </div>
                <div className={clsx('text-[16px] font-semibold mt-1', deltaColor(v))}>{pct(v)}</div>
                <div className="text-[11px] text-charcoal-mute mt-0.5">{h.sector}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeader title="Top contributors & detractors" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Contributors">
            <ul className="mt-2 divide-y divide-bordersoft">
              {[...portfolio].sort((a, b) => b.trend!.d1 - a.trend!.d1).slice(0, 3).map((h) => (
                <li key={h.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="text-[13.5px] font-medium text-charcoal">{h.title}</div>
                    <div className="text-[12px] text-charcoal-mute">{h.whyShown}</div>
                  </div>
                  <Delta value={h.trend!.d1} />
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Detractors">
            <ul className="mt-2 divide-y divide-bordersoft">
              {[...portfolio].sort((a, b) => a.trend!.d1 - b.trend!.d1).slice(0, 3).map((h) => (
                <li key={h.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="text-[13.5px] font-medium text-charcoal">{h.title}</div>
                    <div className="text-[12px] text-charcoal-mute">{h.whyShown}</div>
                  </div>
                  <Delta value={h.trend!.d1} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section>
        <SectionHeader title="Thesis risk / support changes" hint="How today's flows lean against (or with) your written thesis." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolio.slice(0, 6).map((h) => (
            <Card
              key={h.id}
              strip={h.changeStrip}
              title={`${h.title} (${h.ticker})`}
              subtitle={h.thesis}
              right={<SignalChip value={h.signal} />}
              onClick={() => openDrawer(aiSignals[0])}
            >
              <div className="flex items-center justify-between mt-1">
                <div className="text-[12px] text-charcoal-mute">Weight {h.weight}% · {h.sector}</div>
                <Delta value={h.trend!.d1} label="1D" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title='"What changed since yesterday for my book?"' />
        <Card>
          <ul className="space-y-2 text-[13.5px] text-charcoal-soft">
            <li className="flex items-center gap-2"><ChangeStripChip value="Risk increased" /> Autos input cost squeeze deepened (M&M, Maruti).</li>
            <li className="flex items-center gap-2"><ChangeStripChip value="Support improved" /> CPI cooler than expected — supports rate-sensitive holdings.</li>
            <li className="flex items-center gap-2"><ChangeStripChip value="Changed since yesterday" /> Asian Paints filing eased crude worry.</li>
            <li className="flex items-center gap-2"><ChangeStripChip value="5-day trend" /> INR weakness now durable — exporter tailwind, importer drag.</li>
          </ul>
        </Card>
      </section>
    </motion.div>
  );
}
