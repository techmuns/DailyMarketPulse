import { motion } from 'framer-motion';
import { TrendCard } from '../components/TrendCard';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { macro, macroPulseSummary } from '../data/macro';
import { aiSignals } from '../data/signals';
import { ChangeStripChip, SignalChip } from '../components/Chip';
import { useStore } from '../state/store';

export function Macro() {
  const { openDrawer } = useStore();
  const macroAI = aiSignals.find((s) => s.category === 'macro') || aiSignals[0];

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-7">
      <header>
        <h1 className="font-display text-[28px] text-charcoal">Macro</h1>
        <p className="text-[13px] text-charcoal-mute mt-1">Inflation, rates, policy, liquidity, geopolitics, activity.</p>
      </header>

      <Card>
        <div className="flex items-center gap-2 mb-2">
          <span className="chip bg-calm-navy-bg text-calm-navy border border-calm-navy/30">Macro Pulse</span>
          <ChangeStripChip value="Support improved" />
        </div>
        <p className="font-display text-[18px] text-charcoal leading-snug">{macroPulseSummary}</p>
      </Card>

      <button
        onClick={() => openDrawer(macroAI)}
        className="block w-full text-left rounded-2xl border border-calm-violet/25 bg-gradient-to-br from-calm-violet-bg via-cream to-white p-5 shadow-soft hover:shadow-lift transition-all"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="chip bg-calm-violet text-white">AI Macro Signal</span>
          <SignalChip value={macroAI.signal} />
        </div>
        <div className="font-display text-[18px] text-charcoal">{macroAI.title}</div>
        <p className="text-[13.5px] text-charcoal-soft mt-1.5">{macroAI.whyItMatters}</p>
      </button>

      <section>
        <SectionHeader title="Macro indicators" hint="What changed since yesterday and over 5D/1M." />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {macro.map((m) => (
            <TrendCard key={m.id} item={m} unit={m.unit} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Portfolio sectors affected" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Banks', 'NBFC', 'Autos', 'IT Services', 'Paints', 'Real Estate', 'FMCG', 'Capital Goods'].map((s) => (
            <div key={s} className="card p-4">
              <div className="label-mute">Sector</div>
              <div className="text-[14px] font-semibold text-charcoal mt-1">{s}</div>
              <div className="text-[12px] text-charcoal-mute mt-1">
                {s === 'Autos' || s === 'Paints'
                  ? 'Cost pressure rising'
                  : s === 'IT Services'
                  ? 'FX + yields tailwind'
                  : 'Macro tilt mildly supportive'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
