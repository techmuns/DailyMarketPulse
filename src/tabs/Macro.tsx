import { motion } from 'framer-motion';
import { SectionHeader } from '../components/SectionHeader';
import { PulseBrief } from '../components/PulseBrief';
import { Delta } from '../components/Delta';
import { Sparkline } from '../components/Sparkline';
import { ToneDot, MeaningBadge } from '../components/Tone';
import { macro, macroPulseSummary } from '../data/macro';
import { aiSignals } from '../data/signals';
import { useStore } from '../state/store';
import { getSignalTone, toneTokens, marketMeaning } from '../utils/tone';
import clsx from 'clsx';

export function Macro() {
  const { openDrawer } = useStore();

  const sectorReads = [
    { sector: 'Banks', signal: 'support' as const, note: 'Liquidity + dovish CPI' },
    { sector: 'NBFC', signal: 'support' as const, note: 'Funding cost easing' },
    { sector: 'Autos', signal: 'risk' as const, note: 'FX + steel cost squeeze' },
    { sector: 'IT', signal: 'support' as const, note: 'INR + US yields tailwind' },
    { sector: 'Paints', signal: 'risk' as const, note: 'Crude input pressure' },
    { sector: 'Real Estate', signal: 'support' as const, note: 'Rate path improving' },
    { sector: 'FMCG', signal: 'monitor' as const, note: 'Palm oil + CPO firm' },
    { sector: 'Capital Goods', signal: 'support' as const, note: 'IIP firming' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-9">
      <PulseBrief tabKey="Macro" />

      <header>
        <p className="label-mute">Macro</p>
        <h1 className="h-display text-[26px] font-semibold mt-1.5">Pulse</h1>
        <p className="text-[12.5px] text-charcoal-mute mt-1.5">{macroPulseSummary}</p>
      </header>

      <section>
        <SectionHeader title="Macro Pressure Board" eyebrow="Indicators" hint="Inflation, rates, liquidity and policy moves since yesterday." />
        <div className="card overflow-hidden">
          <table className="tbl">
            <thead>
              <tr>
                <th className="pl-5">Indicator</th>
                <th className="w-[100px]">Current</th>
                <th className="w-[80px]">1D</th>
                <th className="w-[80px]">5D</th>
                <th className="w-[80px]">1M</th>
                <th className="w-[110px]">Trend</th>
                <th>Affected</th>
                <th className="pr-5 w-[90px]">Signal</th>
              </tr>
            </thead>
            <tbody>
              {macro.map((m) => {
                const tone = getSignalTone(m);
                const meaning = marketMeaning(m);
                return (
                  <tr key={m.id} className={clsx('row-link', toneTokens(tone).rowClass)} onClick={() => openDrawer(aiSignals.find(s => s.category === 'macro') || aiSignals[0])}>
                    <td className="pl-5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-charcoal">{m.title}</span>
                        {meaning && <MeaningBadge tone={tone}>{meaning}</MeaningBadge>}
                      </div>
                      <div className="text-[10.5px] text-charcoal-mute capitalize mt-0.5">{m.category}</div>
                    </td>
                    <td className="font-display font-medium text-charcoal tabular-nums">
                      {m.current}
                      {m.unit && <span className="text-[10px] text-charcoal-mute ml-1">{m.unit}</span>}
                    </td>
                    <td><Delta value={m.trend!.d1} /></td>
                    <td><Delta value={m.trend!.d5} size="xs" /></td>
                    <td><Delta value={m.trend!.m1} size="xs" /></td>
                    <td><div className="w-[90px]"><Sparkline data={m.trend!.spark} color={toneTokens(tone).spark} height={24} /></div></td>
                    <td className="text-[11.5px] text-charcoal-mute leading-snug">{m.affected.slice(0, 2).join(', ')}</td>
                    <td className="pr-5"><ToneDot tone={tone} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionHeader title="Sectors affected" eyebrow="Read" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {sectorReads.map((s) => {
            const bg =
              s.signal === 'support' ? 'bg-calm-green-bg/60'
                : s.signal === 'risk' ? 'bg-calm-rose-bg/60'
                : 'bg-calm-amber-bg/60';
            return (
              <div key={s.sector} className={clsx('rounded-xl p-3 border border-bordersoft', bg)}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-charcoal">{s.sector}</span>
                  <ToneDot tone={s.signal === 'support' ? 'support' : s.signal === 'risk' ? 'risk' : 'monitor'} />
                </div>
                <div className="text-[11px] text-charcoal-mute mt-1.5 leading-snug">{s.note}</div>
              </div>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}
