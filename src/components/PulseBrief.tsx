import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { pulseBriefs } from '../data/pulseBriefs';
import { topChanges } from '../data/topChanges';
import type { TabKey } from './TopNav';
import { useSpeech } from '../utils/useSpeech';
import { buildSpokenBrief } from '../utils/spokenBrief';
import { toneTokens } from '../utils/tone';
import { aiSignals } from '../data/signals';
import { useStore } from '../state/store';

interface Props {
  tabKey: TabKey;
  className?: string;
}

export function PulseBrief({ tabKey, className }: Props) {
  const brief = pulseBriefs[tabKey];
  const { speak, stop, isSpeaking, supported } = useSpeech();
  const { openDrawer } = useStore();
  const tokens = toneTokens(brief.tone);

  // Stop any active speech when the tab changes — no audio bleed.
  useEffect(() => {
    stop();
    return () => stop();
  }, [tabKey, stop]);

  const onListen = () => {
    if (isSpeaking) {
      stop();
      return;
    }
    speak(buildSpokenBrief(topChanges));
  };

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={tabKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className={clsx(
          'relative rounded-2xl border border-bordersoft bg-calm-violet-bg/40 shadow-soft overflow-hidden',
          'border-l-[3px] border-l-calm-emerald',
          className
        )}
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-calm-violet/15 blur-2xl pointer-events-none" />
        <div className="relative px-5 py-4 md:px-6 md:py-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <PulseIcon />
              <span className="text-[10.5px] tracking-[0.22em] uppercase font-bold text-calm-emerald">
                Pulse Brief
              </span>
              <span className="text-[10.5px] tracking-[0.18em] uppercase text-charcoal-mute font-semibold hidden sm:inline">
                · {tabKey}
              </span>
            </div>
            <h3 className="h-display text-[17px] md:text-[19px] font-semibold leading-snug text-charcoal">
              {brief.headline}
            </h3>
            <ul className="mt-2.5 grid gap-1 md:grid-cols-3 md:gap-x-6">
              {brief.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] text-charcoal-soft leading-snug">
                  <span className={clsx('w-1 h-1 rounded-full mt-1.5 shrink-0', tokens.dot)} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {supported ? (
              <button
                onClick={onListen}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition shadow-soft',
                  isSpeaking
                    ? 'bg-calm-rose-bg text-calm-rose hover:bg-calm-rose-bg/70'
                    : 'bg-calm-emerald text-white hover:bg-[#0CA67F]'
                )}
              >
                {isSpeaking ? <StopIcon /> : <SpeakerIcon />}
                {isSpeaking ? 'Stop' : 'Listen to Top 5'}
              </button>
            ) : (
              <span className="text-[10.5px] text-charcoal-mute italic">Audio not supported in this browser</span>
            )}
            {supported && (
              <span className="text-[10px] tracking-[0.18em] uppercase text-charcoal-mute font-semibold">
                Today's top 5 · audio
              </span>
            )}
            <button
              onClick={() => openDrawer(aiSignals[0])}
              className="hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11.5px] text-calm-violet bg-calm-violet-bg/70 hover:bg-calm-violet-bg transition"
            >
              Open signal →
            </button>
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}

function PulseIcon() {
  return (
    <span className="relative flex w-2 h-2">
      <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-calm-emerald opacity-60" />
      <span className="relative inline-flex rounded-full w-2 h-2 bg-calm-emerald" />
    </span>
  );
}

function SpeakerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  );
}
