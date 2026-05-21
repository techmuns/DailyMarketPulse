import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { events } from '../data/events';
import { ToneDot } from '../components/Tone';
import { PulseBrief } from '../components/PulseBrief';
import { CompactMasthead } from '../components/CompactMasthead';
import { getSignalTone, toneTokens } from '../utils/tone';
import clsx from 'clsx';

const WHENS: Array<{ key: 'today' | 'tomorrow' | 'this-week'; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'this-week', label: 'This week' },
];

export function Events() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-9">
      <CompactMasthead section="Events" chips={['Earnings week', 'Macro print', 'Policy watch']} />
      <PulseBrief tabKey="Events" />

      <header>
        <p className="label-mute">Events</p>
        <h1 className="h-display text-[26px] font-semibold mt-1.5">Event Risk Board</h1>
        <p className="text-[12.5px] text-charcoal-mute mt-1.5">Results, concalls, policy and macro events affecting your book.</p>
      </header>

      <Card padding="md" className="bg-calm-amber-bg/70 border-calm-amber/30">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-calm-amber" />
          <span className="text-[13px] text-charcoal-soft">
            <span className="font-semibold text-charcoal">Heads up · </span>
            ASIANP Q4 and US CPI release tomorrow — both touch your book.
          </span>
        </div>
      </Card>

      {WHENS.map(({ key, label }) => {
        const items = events.filter((e) => e.when === key);
        if (items.length === 0) return null;
        return (
          <section key={key}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="h-display text-[16px] font-semibold">{label}</h2>
              <span className="text-[10.5px] text-charcoal-mute uppercase tracking-wider">{items.length} event{items.length === 1 ? '' : 's'}</span>
            </div>
            <div className="card overflow-hidden">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="pl-5 w-[90px]">Type</th>
                    <th>Event</th>
                    <th className="w-[120px]">Company / Sector</th>
                    <th className="w-[90px]">Signal</th>
                    <th className="pr-5">Why shown</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((e) => {
                    const tone = e.impact >= 75 ? 'monitor' : getSignalTone(e);
                    return (
                      <tr key={e.id} className={toneTokens(tone).rowClass}>
                        <td className="pl-5">
                          <span
                            className={clsx(
                              'chip capitalize',
                              e.eventType === 'result' && 'bg-calm-navy-bg text-calm-navy',
                              e.eventType === 'concall' && 'bg-calm-violet-bg text-calm-violet',
                              e.eventType === 'policy' && 'bg-calm-amber-bg text-calm-amber',
                              e.eventType === 'macro' && 'bg-calm-emerald-bg text-calm-emerald',
                              e.eventType === 'corporate' && 'bg-cream-deep text-charcoal-mute'
                            )}
                          >
                            {e.eventType}
                          </span>
                        </td>
                        <td>
                          <div className="text-[13px] font-medium text-charcoal">{e.title}</div>
                        </td>
                        <td className="text-[11.5px] text-charcoal-mute">
                          {e.company || e.affected[0]}
                        </td>
                        <td><ToneDot tone={tone} /></td>
                        <td className="pr-5 text-[11.5px] text-charcoal-mute leading-snug">{e.whyShown}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </motion.div>
  );
}
