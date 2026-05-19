import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { events } from '../data/events';
import { SignalChip } from '../components/Chip';
import clsx from 'clsx';

const WHENS: Array<{ key: 'today' | 'tomorrow' | 'this-week'; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'this-week', label: 'This week' },
];

export function Events() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-7">
      <header>
        <h1 className="font-display text-[28px] text-charcoal">Events</h1>
        <p className="text-[13px] text-charcoal-mute mt-1">Results, concalls, policy and macro events affecting your book.</p>
      </header>

      <Card className="border-calm-amber/30 bg-calm-amber-bg">
        <div className="flex items-center gap-2">
          <span className="chip bg-calm-amber text-white">Heads up</span>
          <span className="text-[13.5px] text-charcoal">
            Asian Paints Q4 tomorrow and US CPI release tomorrow — both touch your book.
          </span>
        </div>
      </Card>

      {WHENS.map(({ key, label }) => {
        const items = events.filter((e) => e.when === key);
        if (items.length === 0) return null;
        return (
          <section key={key}>
            <SectionHeader title={label} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((e) => (
                <Card
                  key={e.id}
                  strip={e.changeStrip}
                  title={e.title}
                  subtitle={e.whyShown}
                  right={
                    <span
                      className={clsx(
                        'chip border capitalize',
                        e.eventType === 'result' && 'bg-calm-navy-bg text-calm-navy border-calm-navy/30',
                        e.eventType === 'concall' && 'bg-calm-violet-bg text-calm-violet border-calm-violet/30',
                        e.eventType === 'policy' && 'bg-calm-amber-bg text-calm-amber border-calm-amber/30',
                        e.eventType === 'macro' && 'bg-calm-green-bg text-calm-green border-calm-green/30',
                        e.eventType === 'corporate' && 'bg-ivory-100 text-charcoal-soft border-bordersoft'
                      )}
                    >
                      {e.eventType}
                    </span>
                  }
                >
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <SignalChip value={e.signal} />
                    {e.affected.slice(0, 3).map((a) => (
                      <span key={a} className="chip bg-ivory-100 text-charcoal-soft border border-bordersoft">{a}</span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </motion.div>
  );
}
