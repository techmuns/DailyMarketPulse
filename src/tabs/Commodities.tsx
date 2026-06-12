import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { Delta } from '../components/Delta';
import { Sparkline } from '../components/Sparkline';
import { ToneDot, MeaningBadge } from '../components/Tone';
import { Heatmap } from '../components/Heatmap';
import { PulseBrief } from '../components/PulseBrief';
import { getSignalTone, toneTokens, marketMeaning } from '../utils/tone';
import clsx from 'clsx';
import type { HeatCell } from '../components/Heatmap';
import { commodities as mockCommodities, commoditySummary } from '../data/commodities';
import { portfolio as mockPortfolio } from '../data/portfolio';
import { watchlist as mockWatchlist } from '../data/watchlist';
import { useLiveOverlay, useLive } from '../state/liveData';
import { commoditySignal } from '../utils/deriveSignal';
import { useAiSignals } from '../utils/useAiSignals';
import { useStore } from '../state/store';
import { num } from '../utils/format';

// Book names whose margins are driven by a commodity input cost.
const COMMODITY_EXPOSURE: Record<string, string> = {
  'p-asianp': 'Crude / TiO2',
  'p-mm': 'Steel + aluminium',
  'p-titan': 'Gold',
  'p-relian': 'Crude / energy',
};

const MOCK_PRESSURE_CELLS: HeatCell[] = [
  { id: 'h-asianp', label: 'ASIANP — Paints', value: -1.51, sub: 'Crude + TiO2' },
  { id: 'h-mm', label: 'M&M — Autos', value: -1.94, sub: 'Steel + alu' },
  { id: 'h-hul', label: 'HUL — FMCG', value: -0.3, sub: 'Palm oil' },
  { id: 'h-avia', label: 'Aviation', value: -0.6, sub: 'Crude' },
  { id: 'h-titan', label: 'TITAN — Jewellery', value: 0.74, sub: 'Gold' },
  { id: 'h-tatast', label: 'TATAST — Steel', value: 1.7, sub: 'LME firm' },
  { id: 'h-hindal', label: 'HINDALCO', value: 1.1, sub: 'Aluminium' },
  { id: 'h-sugar', label: 'Sugar producers', value: -0.2, sub: 'Raw soft' },
];

export function Commodities() {
  const { openDrawer } = useStore();
  const aiSignals = useAiSignals();
  const overlaid = useLiveOverlay(mockCommodities, 'commodities');
  const isLive = useLive().data != null;
  // When live, recompute the tone from the real move via domain rules.
  const commodities = isLive
    ? overlaid.map((c) => ({ ...c, signal: commoditySignal(c.id, c.trend?.d1 ?? 0) }))
    : overlaid;

  // Input-cost pressure on the book's commodity-sensitive names, using
  // their live 1D move; falls back to demo cells in mock mode.
  const book = useLiveOverlay([...mockPortfolio, ...mockWatchlist], 'holdings');
  const pressureCells: HeatCell[] = isLive
    ? book
        .filter((h) => COMMODITY_EXPOSURE[h.id])
        .map((h) => ({
          id: h.id,
          label: `${h.title} — ${COMMODITY_EXPOSURE[h.id]}`,
          value: h.trend?.d1 ?? 0,
          sub: COMMODITY_EXPOSURE[h.id],
        }))
    : MOCK_PRESSURE_CELLS;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-9">
      <PulseBrief tabKey="Commodities" />

      <header>
        <p className="label-mute">Commodities</p>
        <h1 className="h-display text-[26px] font-semibold mt-1.5">Input-cost board</h1>
        <p className="text-[12.5px] text-charcoal-mute mt-1.5">{commoditySummary}</p>
      </header>

      <section>
        <SectionHeader title="Commodity Pressure Board" eyebrow="Pressure & support" hint="Input-cost moves, portfolio impact, and sector pressure." />
        <div className="card overflow-hidden">
          <table className="tbl">
            <thead>
              <tr>
                <th className="pl-5">Commodity</th>
                <th className="w-[110px]">Price</th>
                <th className="w-[80px]">1D</th>
                <th className="w-[80px]">5D</th>
                <th className="w-[80px]">1M</th>
                <th className="w-[120px]">Trend</th>
                <th>Affected sectors</th>
                <th className="pr-5 w-[90px]">Signal</th>
              </tr>
            </thead>
            <tbody>
              {commodities.map((c) => {
                const tone = getSignalTone(c);
                const meaning = marketMeaning(c);
                return (
                  <tr key={c.id} className={clsx('row-link', toneTokens(tone).rowClass)} onClick={() => openDrawer(aiSignals[0])}>
                    <td className="pl-5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-charcoal">{c.title}</span>
                        {meaning && <MeaningBadge tone={tone}>{meaning}</MeaningBadge>}
                      </div>
                      <div className="text-[10.5px] text-charcoal-mute mt-0.5">{c.unit}</div>
                    </td>
                    <td className="font-display font-medium text-charcoal tabular-nums">{num(c.current as number, 0)}</td>
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

      <section>
        <SectionHeader title="Input-cost pressure" eyebrow="Heatmap" />
        <Card padding="md">
          <Heatmap cells={pressureCells} cols={4} />
        </Card>
      </section>
    </motion.div>
  );
}
