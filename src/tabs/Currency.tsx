import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { Delta } from '../components/Delta';
import { Sparkline } from '../components/Sparkline';
import { ToneDot, MeaningBadge } from '../components/Tone';
import { PulseBrief } from '../components/PulseBrief';
import { currencies as mockCurrencies, currencySummary } from '../data/currencies';
import { useLiveOverlay, DataSourceChip } from '../state/liveData';
import { LiveWire } from '../components/LiveWire';
import { aiSignals } from '../data/signals';
import { useStore } from '../state/store';
import { num } from '../utils/format';
import { getSignalTone, toneTokens, marketMeaning } from '../utils/tone';
import clsx from 'clsx';

export function Currency() {
  const { openDrawer } = useStore();
  const currencies = useLiveOverlay(mockCurrencies, 'currencies');
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-9">
      <PulseBrief tabKey="Currency" />

      <header>
        <p className="label-mute">Currency</p>
        <h1 className="h-display text-[26px] font-semibold mt-1.5">FX board</h1>
        <p className="text-[12.5px] text-charcoal-mute mt-1.5">{currencySummary}</p>
      </header>

      <section>
        <SectionHeader
          title="Currency Pressure Board"
          eyebrow="Pairs"
          hint="Rate, 1D / 5D / 1M moves, trend, and portfolio impact."
          right={<DataSourceChip section="currencies" />}
        />
        <div className="card overflow-hidden">
          <table className="tbl">
            <thead>
              <tr>
                <th className="pl-5">Currency</th>
                <th className="w-[100px]">Rate</th>
                <th className="w-[80px]">1D</th>
                <th className="w-[80px]">5D</th>
                <th className="w-[80px]">1M</th>
                <th className="w-[120px]">Trend</th>
                <th>Portfolio impact</th>
                <th className="pr-5 w-[90px]">Signal</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((c) => {
                const tone = getSignalTone(c);
                const meaning = marketMeaning(c);
                return (
                  <tr key={c.id} className={clsx('row-link', toneTokens(tone).rowClass)} onClick={() => openDrawer(aiSignals[0])}>
                    <td className="pl-5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-charcoal">{c.title}</span>
                        {meaning && <MeaningBadge tone={tone}>{meaning}</MeaningBadge>}
                      </div>
                      <div className="text-[10.5px] text-charcoal-mute font-mono mt-0.5">{c.pair}</div>
                    </td>
                    <td className="font-display font-medium text-charcoal tabular-nums">{num(c.current as number, c.pair === 'JPYINR' ? 3 : 2)}</td>
                    <td><Delta value={c.trend!.d1} /></td>
                    <td><Delta value={c.trend!.d5} size="xs" /></td>
                    <td><Delta value={c.trend!.m1} size="xs" /></td>
                    <td>
                      <div className="w-[100px]">
                        <Sparkline data={c.trend!.spark} color={toneTokens(tone).spark} height={26} />
                      </div>
                    </td>
                    <td className="text-[11.5px] text-charcoal-mute leading-snug">{c.affected.slice(0, 2).join('; ')}</td>
                    <td className="pr-5"><ToneDot tone={tone} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <LiveWire
        title="Currency news wire"
        eyebrow="MoneyControl · FX-filtered"
        hint="Live headlines mentioning the rupee, USD, or FX flows."
        keywords={['rupee', 'inr', 'usd', 'dollar', 'currency', 'fx', 'forex', 'rbi', 'euro', 'yen']}
        limit={6}
      />

      <section>
        <SectionHeader title="Importer / exporter map" eyebrow="FX impact" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Importers" subtitle="Stronger USD = landed input cost up" right={<ToneDot tone="risk" />}>
            <ul className="mt-1 divide-y divide-bordersoft/60 text-[12.5px] text-charcoal-soft">
              <ImpactRow ticker="M&M" note="Steel + USD raw materials" />
              <ImpactRow ticker="MARUTI" note="JPY eased, USD intact" />
              <ImpactRow ticker="ASIANP" note="Crude / TiO2 / specialty" />
              <ImpactRow ticker="HUL" note="Palm oil + packaging" />
            </ul>
          </Card>
          <Card title="Exporters" subtitle="Weaker INR = USD revenue tailwind" right={<ToneDot tone="support" />}>
            <ul className="mt-1 divide-y divide-bordersoft/60 text-[12.5px] text-charcoal-soft">
              <ImpactRow ticker="INFY" note="USD revenue concentration" />
              <ImpactRow ticker="TCS" note="USD revenue concentration" />
              <ImpactRow ticker="PI" note="CSM exports" />
              <ImpactRow ticker="DIVIS" note="US generics & API" />
            </ul>
          </Card>
        </div>
      </section>
    </motion.div>
  );
}

function ImpactRow({ ticker, note }: { ticker: string; note: string }) {
  return (
    <li className="py-2 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
      <span className="font-mono text-[11.5px] text-charcoal bg-cream-deep border border-bordersoft px-1.5 py-0.5 rounded">{ticker}</span>
      <span className="text-[11.5px] text-charcoal-mute text-right">{note}</span>
    </li>
  );
}
