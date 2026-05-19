import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { watchlist } from '../data/watchlist';
import { Delta } from '../components/Delta';
import { SignalChip, ChangeStripChip } from '../components/Chip';
import { Sparkline } from '../components/Sparkline';
import { aiSignals } from '../data/signals';
import { useStore } from '../state/store';

export function Watchlist() {
  const { openDrawer } = useStore();
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-7">
      <header>
        <h1 className="font-display text-[28px] text-charcoal">Watchlist</h1>
        <p className="text-[13px] text-charcoal-mute mt-1">Movers, opportunity signals, risks, unusual volume.</p>
      </header>

      <section>
        <SectionHeader title="Watchlist movers" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {watchlist.map((w) => (
            <Card
              key={w.id}
              strip={w.changeStrip}
              title={`${w.title} (${w.ticker})`}
              subtitle={w.whyShown}
              right={<SignalChip value={w.signal} />}
              onClick={() => openDrawer(aiSignals[2])}
            >
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[22px] font-display font-semibold text-charcoal">{w.current}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <Delta value={w.trend!.d1} label="1D" />
                    <Delta value={w.trend!.d5} label="5D" />
                    <Delta value={w.trend!.m1} label="1M" />
                  </div>
                </div>
                <div className="w-24">
                  <Sparkline data={w.trend!.spark} color={w.signal === 'risk' ? '#C97A78' : w.signal === 'support' ? '#5BAE8A' : '#D4A24C'} />
                </div>
              </div>
              <div className="mt-3 text-[12px] text-charcoal-mute">{w.thesis}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Opportunity signals" right={<SignalChip value="support" />}>
          <ul className="space-y-1.5 mt-2 text-[13.5px] text-charcoal-soft">
            <li>· DMART — 1.8x volume, no news, quiet accumulation</li>
            <li>· PI Industries — INR tailwind for CSM exports</li>
            <li>· Pidilite — corrected without negative news</li>
          </ul>
        </Card>
        <Card title="Risk signals" right={<SignalChip value="risk" />}>
          <ul className="space-y-1.5 mt-2 text-[13.5px] text-charcoal-soft">
            <li>· Zomato — quick-commerce competitive intensity rising</li>
            <li>· Divi's — range-bound; thesis intact but slow</li>
          </ul>
        </Card>
      </section>

      <section>
        <SectionHeader title="Corrected without negative news" hint="Often the more interesting list." />
        <Card>
          <ul className="space-y-2 mt-2">
            {watchlist.filter((w) => w.trend!.d1 < 0).map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 border-b border-bordersoft last:border-b-0 pb-2">
                <div>
                  <div className="text-[13.5px] font-medium text-charcoal">{w.title}</div>
                  <div className="text-[12px] text-charcoal-mute">{w.whyShown}</div>
                </div>
                <div className="flex items-center gap-2">
                  <ChangeStripChip value={w.changeStrip} />
                  <Delta value={w.trend!.d1} />
                  <button
                    onClick={() => openDrawer(aiSignals[2])}
                    className="chip bg-calm-violet-bg text-calm-violet border border-calm-violet/30"
                  >
                    + Add to thesis
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </motion.div>
  );
}
