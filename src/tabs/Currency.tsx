import { motion } from 'framer-motion';
import { TrendCard } from '../components/TrendCard';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { currencies, currencySummary } from '../data/currencies';
import { ChangeStripChip } from '../components/Chip';

export function Currency() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-7">
      <header>
        <h1 className="font-display text-[28px] text-charcoal">Currency</h1>
        <p className="text-[13px] text-charcoal-mute mt-1">USD/INR, EUR/INR, JPY/INR, CNY/INR, DXY — importer/exporter impact.</p>
      </header>

      <Card>
        <div className="flex items-center gap-2 mb-2">
          <span className="chip bg-calm-navy-bg text-calm-navy border border-calm-navy/30">Currency Pulse</span>
          <ChangeStripChip value="Risk increased" />
        </div>
        <p className="font-display text-[18px] text-charcoal leading-snug">{currencySummary}</p>
      </Card>

      <section>
        <SectionHeader title="Pairs" hint="1D / 5D / 1M move with sparkline." />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {currencies.map((c) => (
            <TrendCard key={c.id} item={c} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Importer / exporter impact map" hint="Who carries the cost, who collects the tailwind." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Importers — cost pressure" subtitle="Stronger USD raises landed input cost.">
            <ul className="space-y-2 mt-2 text-[13.5px] text-charcoal-soft">
              <li>· Mahindra & Mahindra — steel + FX double squeeze</li>
              <li>· Maruti Suzuki — Yen sourcing eased, USD raw materials watch</li>
              <li>· Asian Paints — crude / TiO2 / specialty imports</li>
              <li>· HUL — palm oil + packaging</li>
            </ul>
          </Card>
          <Card title="Exporters — revenue tailwind" subtitle="Weaker INR translates dollar revenue higher.">
            <ul className="space-y-2 mt-2 text-[13.5px] text-charcoal-soft">
              <li>· Infosys, TCS — USD revenue concentration</li>
              <li>· PI Industries — CSM exports</li>
              <li>· Sun Pharma, Divi's — US generics & API</li>
              <li>· Bharat Forge — global components</li>
            </ul>
          </Card>
        </div>
      </section>
    </motion.div>
  );
}
