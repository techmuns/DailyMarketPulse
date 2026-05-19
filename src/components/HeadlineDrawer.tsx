import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { useStore } from '../state/store';
import type { Signal } from '../types';

const TONE: Record<Signal, { rail: string; chip: string; chipText: string; label: string }> = {
  support: { rail: 'border-l-calm-green', chip: 'bg-calm-green-bg', chipText: 'text-calm-green', label: 'Support' },
  risk: { rail: 'border-l-calm-rose', chip: 'bg-calm-rose-bg', chipText: 'text-calm-rose', label: 'Risk' },
  monitor: { rail: 'border-l-calm-amber', chip: 'bg-calm-amber-bg', chipText: 'text-calm-amber', label: 'Monitor' },
  noise: { rail: 'border-l-calm-violet', chip: 'bg-calm-violet-bg', chipText: 'text-calm-violet', label: 'Neutral' },
};

export function HeadlineDrawer() {
  const { headlineDrawer: h, closeHeadline } = useStore();
  const tone = h ? TONE[h.signal] : TONE.noise;

  return (
    <AnimatePresence>
      {h && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-charcoal/25 backdrop-blur-[3px] z-40"
            onClick={closeHeadline}
          />
          <motion.aside
            key="drawer"
            initial={{ x: 460, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 460, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className={clsx(
              'fixed top-0 right-0 h-full w-[440px] max-w-[92vw] bg-cream border-l border-bordersoft shadow-lift z-50 overflow-y-auto border-l-[3px]',
              tone.rail
            )}
          >
            <div className="px-5 py-4 border-b border-bordersoft flex items-start justify-between gap-3 sticky top-0 bg-cream z-10">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] tracking-[0.18em] uppercase font-semibold text-charcoal-mute">
                    {h.category}
                  </span>
                  <span className={clsx('chip', tone.chip, tone.chipText)}>{tone.label}</span>
                </div>
                <h2 className="h-display text-[17px] font-semibold leading-snug">{h.headline}</h2>
              </div>
              <button
                onClick={closeHeadline}
                className="text-charcoal-mute hover:text-charcoal-soft transition rounded-lg p-1 hover:bg-ivory-100"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              <Section label="Summary">
                <p className="text-[13px] text-charcoal-soft leading-relaxed">{h.fullContext}</p>
              </Section>

              <Section label="Why it matters">
                <p className="text-[13px] text-charcoal-soft leading-relaxed">{h.whyItMatters}</p>
              </Section>

              {h.affectedSectors.length > 0 && (
                <Section label="Affected sectors">
                  <div className="flex flex-wrap gap-1.5">
                    {h.affectedSectors.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-cream-deep border border-bordersoft text-charcoal-soft"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {h.affectedCompanies.length > 0 && (
                <Section label="Affected companies">
                  <div className="flex flex-wrap gap-1.5">
                    {h.affectedCompanies.map((c) => (
                      <span
                        key={c}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-ivory-100 border border-bordersoft text-charcoal-soft font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Section label="Source">
                  <p className="text-[12.5px] text-charcoal-soft">{h.sourceType}</p>
                </Section>
                <Section label="Logged">
                  <p className="text-[12.5px] text-charcoal-soft tabular-nums">{h.timestamp}</p>
                </Section>
              </div>

              <Section label="Suggested action">
                <div className="rounded-xl border border-bordersoft bg-cream-deep px-3.5 py-3 text-[12.5px] text-charcoal-soft">
                  {h.action}
                </div>
              </Section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-mute mb-1.5">{label}</div>
      {children}
    </div>
  );
}
