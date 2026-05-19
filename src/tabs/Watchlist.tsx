import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { Delta } from '../components/Delta';
import { Sparkline } from '../components/Sparkline';
import { ToneDot, MeaningBadge } from '../components/Tone';
import { watchlist } from '../data/watchlist';
import { aiSignals } from '../data/signals';
import { useStore } from '../state/store';
import { num } from '../utils/format';
import { getSignalTone, toneTokens, marketMeaning } from '../utils/tone';
import clsx from 'clsx';

export function Watchlist() {
  const { openDrawer } = useStore();
  const opp = watchlist.filter((w) => w.signal === 'support' || w.signal === 'monitor');
  const risk = watchlist.filter((w) => w.signal === 'risk');
  const correctedNoNews = watchlist.filter((w) => w.trend!.d1 < 0);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-9">
      <header>
        <p className="label-mute">Watchlist</p>
        <h1 className="h-display text-[26px] font-semibold mt-1.5">On the radar</h1>
        <p className="text-[12.5px] text-charcoal-mute mt-1.5">Movers, opportunity & risk signals, unusual volume.</p>
      </header>

      <section>
        <SectionHeader title="Watchlist board" eyebrow="Today" />
        <div className="card overflow-hidden">
          <table className="tbl">
            <thead>
              <tr>
                <th className="pl-5">Company</th>
                <th className="w-[100px]">Price</th>
                <th className="w-[80px]">1D</th>
                <th className="w-[80px]">5D</th>
                <th className="w-[80px]">1M</th>
                <th className="w-[110px]">Trend</th>
                <th>Why shown</th>
                <th className="pr-5 w-[90px]">Signal</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((w) => {
                const tone = getSignalTone({ ...w, category: 'watchlist' });
                const meaning = marketMeaning({ ...w, category: 'watchlist' });
                return (
                  <tr key={w.id} className={clsx('row-link', toneTokens(tone).rowClass)} onClick={() => openDrawer(aiSignals[2])}>
                    <td className="pl-5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-charcoal">{w.title}</span>
                        {meaning && <MeaningBadge tone={tone}>{meaning}</MeaningBadge>}
                      </div>
                      <div className="text-[10.5px] text-charcoal-mute mt-0.5">{w.sector}</div>
                    </td>
                    <td className="font-display font-medium text-charcoal tabular-nums">{num(w.current as number, 1)}</td>
                    <td><Delta value={w.trend!.d1} /></td>
                    <td><Delta value={w.trend!.d5} size="xs" /></td>
                    <td><Delta value={w.trend!.m1} size="xs" /></td>
                    <td><div className="w-[90px]"><Sparkline data={w.trend!.spark} color={toneTokens(tone).spark} height={24} /></div></td>
                    <td className="text-[11.5px] text-charcoal-mute leading-snug">{w.whyShown}</td>
                    <td className="pr-5"><ToneDot tone={tone} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Opportunity signals" right={<ToneDot tone="support" />}>
          <ul className="mt-1 divide-y divide-bordersoft/60 text-[12.5px]">
            {opp.map((w) => (
              <li key={w.id} className="py-2 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <span className="text-charcoal">{w.ticker}</span>
                <span className="text-[11px] text-charcoal-mute text-right truncate">{w.whyShown}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Risk signals" right={<ToneDot tone="risk" />}>
          <ul className="mt-1 divide-y divide-bordersoft/60 text-[12.5px]">
            {risk.map((w) => (
              <li key={w.id} className="py-2 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <span className="text-charcoal">{w.ticker}</span>
                <span className="text-[11px] text-charcoal-mute text-right truncate">{w.whyShown}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section>
        <SectionHeader title="Corrected without negative news" eyebrow="Quiet movers" hint="Often the more interesting list." />
        <div className="card overflow-hidden">
          <table className="tbl">
            <thead>
              <tr>
                <th className="pl-5">Company</th>
                <th className="w-[80px]">1D</th>
                <th className="w-[80px]">5D</th>
                <th>Read</th>
                <th className="pr-5 w-[120px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {correctedNoNews.map((w) => (
                <tr key={w.id} className="row-link" onClick={() => openDrawer(aiSignals[2])}>
                  <td className="pl-5 text-[13px] font-medium text-charcoal">{w.title}</td>
                  <td><Delta value={w.trend!.d1} /></td>
                  <td><Delta value={w.trend!.d5} size="xs" /></td>
                  <td className="text-[11.5px] text-charcoal-mute">{w.whyShown}</td>
                  <td className="pr-5 text-[11.5px] text-calm-violet">+ Add to thesis</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
}
