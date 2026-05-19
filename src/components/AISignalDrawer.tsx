import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../state/store';
import { SignalChip, SourceChip } from './Chip';
import clsx from 'clsx';

export function AISignalDrawer() {
  const { drawerSignal, closeDrawer } = useStore();
  return (
    <AnimatePresence>
      {drawerSignal && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-charcoal/20 backdrop-blur-[2px] z-40"
            onClick={closeDrawer}
          />
          <motion.aside
            key="drawer"
            initial={{ x: 480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 480, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="fixed top-0 right-0 h-full w-[440px] max-w-[92vw] bg-cream border-l border-bordersoft shadow-lift z-50 overflow-y-auto"
          >
            <div className="p-5 border-b border-bordersoft flex items-start justify-between gap-3 sticky top-0 bg-cream z-10">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="chip bg-calm-violet-bg text-calm-violet border border-calm-violet/30">AI Signal</span>
                  <SignalChip value={drawerSignal.signal} />
                </div>
                <h2 className="text-[17px] font-semibold leading-snug text-charcoal">{drawerSignal.title}</h2>
              </div>
              <button
                onClick={closeDrawer}
                className="text-charcoal-mute hover:text-charcoal transition rounded-lg p-1 hover:bg-ivory-100"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              <Section title="What changed">
                <p className="text-[14px] leading-relaxed text-charcoal-soft">{drawerSignal.whatChanged}</p>
              </Section>

              <Section title="Why it matters">
                <p className="text-[14px] leading-relaxed text-charcoal-soft">{drawerSignal.whyItMatters}</p>
              </Section>

              <div className="grid grid-cols-2 gap-3">
                <Stat label="Trend or noise">
                  <span
                    className={clsx(
                      'chip border',
                      drawerSignal.trendOrNoise === 'trend' && 'bg-calm-amber-bg text-calm-amber border-calm-amber/30',
                      drawerSignal.trendOrNoise === 'one-day-noise' && 'bg-ivory-100 text-charcoal-soft border-bordersoft',
                      drawerSignal.trendOrNoise === 'building' && 'bg-calm-navy-bg text-calm-navy border-calm-navy/30'
                    )}
                  >
                    {drawerSignal.trendOrNoise === 'trend'
                      ? '5-day trend'
                      : drawerSignal.trendOrNoise === 'one-day-noise'
                      ? 'One-day move'
                      : 'Building'}
                  </span>
                </Stat>
                <Stat label="Source">
                  <SourceChip value={drawerSignal.source} />
                </Stat>
                <Stat label="Confidence">
                  <ConfidenceBar value={drawerSignal.confidence} />
                </Stat>
                <Stat label="Signal">
                  <SignalChip value={drawerSignal.signal} />
                </Stat>
              </div>

              <Section title="Affected names / sectors">
                <div className="flex flex-wrap gap-1.5">
                  {drawerSignal.affected.map((a) => (
                    <span key={a} className="chip bg-ivory-100 text-charcoal-soft border border-bordersoft">
                      {a}
                    </span>
                  ))}
                </div>
              </Section>

              <Section title="Suggested actions">
                <div className="flex flex-col gap-2">
                  {drawerSignal.suggestedActions.map((a) => (
                    <button
                      key={a}
                      className="text-left text-[13.5px] px-3 py-2 rounded-xl bg-white border border-bordersoft hover:border-calm-violet/40 hover:bg-calm-violet-bg/40 transition"
                    >
                      <span className="text-calm-violet font-medium">+ </span>
                      <span className="text-charcoal">{a}</span>
                    </button>
                  ))}
                </div>
              </Section>

              <div className="text-[11px] text-charcoal-mute pt-2 border-t border-bordersoft">
                Demo data · generated for the Daily Market Pulse MVP.
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-mute mb-1.5">{title}</div>
      {children}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl bg-white border border-bordersoft">
      <div className="label-mute mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div>
      <div className="text-[13px] font-medium text-charcoal">{value}%</div>
      <div className="mt-1 h-1.5 rounded-full bg-ivory-100 overflow-hidden">
        <div
          className="h-full bg-calm-violet/70"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
