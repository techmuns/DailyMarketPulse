import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../state/store';
import { SourceChip } from './Chip';
import { ToneDot, MeaningBadge } from './Tone';
import { Sparkline } from './Sparkline';
import clsx from 'clsx';
import { getSignalTone, toneTokens, marketMeaning, toneExplanation } from '../utils/tone';

export function AISignalDrawer() {
  const { drawerSignal, closeDrawer } = useStore();
  const tone = drawerSignal ? getSignalTone({ signal: drawerSignal.signal, impact: 80, confidence: drawerSignal.confidence, category: drawerSignal.category }) : 'neutral';
  const tokens = toneTokens(tone);
  const meaning = drawerSignal ? marketMeaning({ signal: drawerSignal.signal, category: drawerSignal.category }) : undefined;
  const whyColor = drawerSignal ? toneExplanation({ signal: drawerSignal.signal, impact: 80, confidence: drawerSignal.confidence, category: drawerSignal.category, affected: drawerSignal.affected }) : '';
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
            className="fixed inset-0 bg-charcoal/25 backdrop-blur-[3px] z-40"
            onClick={closeDrawer}
          />
          <motion.aside
            key="drawer"
            initial={{ x: 460, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 460, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className={clsx(
              'fixed top-0 right-0 h-full w-[440px] max-w-[92vw] bg-cream border-l border-bordersoft shadow-lift z-50 overflow-y-auto border-l-[3px]',
              tokens.border
            )}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-bordersoft flex items-start justify-between gap-3 sticky top-0 bg-cream z-10">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className="chip bg-calm-violet-bg text-calm-violet">AI Signal</span>
                  <ToneDot tone={tone} />
                  {meaning && <MeaningBadge tone={tone}>{meaning}</MeaningBadge>}
                </div>
                <h2 className="h-display text-[16px] font-semibold leading-snug">{drawerSignal.title}</h2>
              </div>
              <button
                onClick={closeDrawer}
                className="text-charcoal-mute hover:text-charcoal-soft transition rounded-lg p-1 hover:bg-ivory-100"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Why this colour */}
              <div className={clsx('rounded-xl border border-bordersoft p-3.5', tokens.cardWash || 'bg-cream-deep')}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="label-mute">Why this colour</span>
                  <ToneDot tone={tone} />
                </div>
                <p className="text-[12.5px] text-charcoal-soft leading-relaxed">{whyColor}</p>
              </div>

              {/* Trend mini-chart */}
              <div className="bg-cream-deep rounded-xl border border-bordersoft p-3.5">
                <div className="flex items-center justify-between">
                  <span className="label-mute">Trend</span>
                  <span
                    className={clsx(
                      'chip',
                      drawerSignal.trendOrNoise === 'trend' && 'bg-calm-amber-bg text-calm-amber',
                      drawerSignal.trendOrNoise === 'one-day-noise' && 'bg-ivory-100 text-charcoal-mute',
                      drawerSignal.trendOrNoise === 'building' && 'bg-calm-navy-bg text-calm-navy'
                    )}
                  >
                    {drawerSignal.trendOrNoise === 'trend' ? '5-day trend' :
                     drawerSignal.trendOrNoise === 'one-day-noise' ? 'One-day move' : 'Building'}
                  </span>
                </div>
                <div className="mt-2 -mx-1">
                  <Sparkline
                    data={[1, 1.05, 1.12, 1.18, 1.22, 1.28, 1.32]}
                    color={tokens.spark}
                    height={52}
                    strokeWidth={2}
                  />
                </div>
              </div>

              {/* Compact key-value table */}
              <table className="w-full text-[12.5px]">
                <tbody className="divide-y divide-bordersoft/60">
                  <KV label="What changed" value={drawerSignal.whatChanged} />
                  <KV label="Why it matters" value={drawerSignal.whyItMatters} />
                  <tr>
                    <td className="py-2.5 align-top label-mute w-[110px]">Affected</td>
                    <td className="py-2.5 text-charcoal-soft">
                      <div className="flex flex-wrap gap-1">
                        {drawerSignal.affected.map((a) => (
                          <span key={a} className="chip bg-ivory-100 text-charcoal-soft">{a}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 align-middle label-mute">Source</td>
                    <td className="py-2.5"><SourceChip value={drawerSignal.source} /></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 align-middle label-mute">Confidence</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-ivory-100 overflow-hidden">
                          <div
                            className="h-full bg-calm-violet/80"
                            style={{ width: `${Math.min(100, Math.max(0, drawerSignal.confidence))}%` }}
                          />
                        </div>
                        <span className="text-[12px] font-medium text-charcoal tabular-nums w-9 text-right">
                          {drawerSignal.confidence}%
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 align-middle label-mute">Signal</td>
                    <td className="py-2.5"><ToneDot tone={tone} /></td>
                  </tr>
                </tbody>
              </table>

              {/* Suggested actions */}
              <div>
                <div className="label-mute mb-2">Suggested actions</div>
                <div className="flex flex-col gap-1.5">
                  {drawerSignal.suggestedActions.map((a) => (
                    <button
                      key={a}
                      className="text-left text-[13px] px-3 py-2 rounded-lg bg-cream-deep border border-bordersoft hover:border-calm-violet/40 hover:bg-calm-violet-bg/60 transition flex items-center justify-between gap-2"
                    >
                      <span className="text-charcoal-soft">{a}</span>
                      <span className="text-calm-violet text-[12px]">+</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10.5px] text-charcoal-mute pt-3 border-t border-bordersoft tracking-wide">
                Demo data · generated for the Daily Market Pulse MVP.
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-2.5 align-top label-mute w-[110px]">{label}</td>
      <td className="py-2.5 text-charcoal-soft leading-relaxed">{value}</td>
    </tr>
  );
}
