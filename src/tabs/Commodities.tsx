import { motion } from 'framer-motion';
import { TrendCard } from '../components/TrendCard';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { commodities, commoditySummary } from '../data/commodities';
import { ChangeStripChip, SignalChip } from '../components/Chip';

export function Commodities() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-7">
      <header>
        <h1 className="font-display text-[28px] text-charcoal">Commodities</h1>
        <p className="text-[13px] text-charcoal-mute mt-1">Energy, metals, soft commodities and input-cost reads.</p>
      </header>

      <Card>
        <div className="flex items-center gap-2 mb-2">
          <span className="chip bg-calm-navy-bg text-calm-navy border border-calm-navy/30">Commodity Pulse</span>
          <ChangeStripChip value="Repeated theme" />
        </div>
        <p className="font-display text-[18px] text-charcoal leading-snug">{commoditySummary}</p>
      </Card>

      <section>
        <SectionHeader title="Commodity trend cards" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {commodities.map((c) => (
            <TrendCard key={c.id} item={c} unit={c.unit} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Input cost / support map" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Cost pressure — risk" right={<SignalChip value="risk" />}>
            <ul className="space-y-1.5 mt-2 text-[13.5px] text-charcoal-soft">
              <li>· Paints (ASIANP): crude + TiO2</li>
              <li>· Autos (M&M): steel + aluminium</li>
              <li>· FMCG (HUL): palm oil</li>
              <li>· Aviation: crude</li>
            </ul>
          </Card>
          <Card title="Tailwind — support" right={<SignalChip value="support" />}>
            <ul className="space-y-1.5 mt-2 text-[13.5px] text-charcoal-soft">
              <li>· Jewellery (TITAN): gold breakout</li>
              <li>· Metals (TATAST): LME copper, aluminium firm</li>
              <li>· Sugar producers: lower raw sugar</li>
            </ul>
          </Card>
        </div>
      </section>
    </motion.div>
  );
}
