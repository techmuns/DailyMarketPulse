import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { pulseBriefs } from '../data/pulseBriefs';
import type { BriefKey } from '../data/pulseBriefs';
import { topChanges } from '../data/topChanges';
import { useSpeech } from '../utils/useSpeech';
import { buildTopFiveAudioScript } from '../utils/topFiveScript';
import { generateTopFiveAudio, revokeAudio } from '../services/audioService';
import { toneTokens } from '../utils/tone';
import { aiSignals } from '../data/signals';
import { useStore } from '../state/store';

interface Props {
  tabKey: BriefKey;
  className?: string;
}

type PlayState = 'idle' | 'loading' | 'playing';

export function PulseBrief({ tabKey, className }: Props) {
  const brief = pulseBriefs[tabKey];
  const { speak, stop: stopBrowser, isSpeaking, supported } = useSpeech();
  const { openDrawer } = useStore();
  const tokens = toneTokens(brief.tone);

  const [state, setState] = useState<PlayState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current = null;
    }
    stopBrowser();
    setState('idle');
  }, [stopBrowser]);

  // Stop everything on tab change / unmount.
  useEffect(() => {
    return () => {
      stopAudio();
      revokeAudio(lastUrlRef.current);
      lastUrlRef.current = null;
    };
  }, [tabKey, stopAudio]);

  // If the browser TTS finishes (or errors) on its own, reset state.
  useEffect(() => {
    if (state === 'playing' && !audioRef.current && !isSpeaking) {
      setState('idle');
    }
  }, [isSpeaking, state]);

  const onPlay = useCallback(async () => {
    if (state === 'playing' || state === 'loading') {
      stopAudio();
      return;
    }
    const script = buildTopFiveAudioScript(topChanges);
    setState('loading');

    // Try premium first.
    const premium = await generateTopFiveAudio(script);
    if (premium?.url) {
      revokeAudio(lastUrlRef.current);
      lastUrlRef.current = premium.url;
      const audio = new Audio(premium.url);
      audio.onended = () => setState('idle');
      audio.onerror = () => {
        setState('idle');
      };
      audioRef.current = audio;
      try {
        await audio.play();
        setState('playing');
      } catch {
        setState('idle');
      }
      return;
    }

    // Fall back to browser speech.
    if (supported) {
      speak(script);
      setState('playing');
    } else {
      setState('idle');
    }
  }, [state, stopAudio, supported, speak]);

  const audioCapable = supported || isPremiumModeEnabled();
  const label =
    state === 'loading' ? 'Preparing audio…' : state === 'playing' ? 'Stop' : 'Play Today’s Top 5';

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={tabKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className={clsx(
          'relative rounded-[24px] overflow-hidden border-l-[4px] border-l-calm-emerald',
          className
        )}
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(221,214,232,0.85)',
          borderLeft: '4px solid #0B7E61',
          boxShadow:
            '0 18px 45px rgba(72,55,120,0.12), 0 2px 8px rgba(15,143,111,0.05)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              'radial-gradient(circle at 90% 20%, rgba(140,121,201,0.10) 0%, transparent 35%)',
          }}
        />
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
            {audioCapable ? (
              <button
                onClick={onPlay}
                disabled={state === 'loading'}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition shadow-soft',
                  state === 'playing' && 'bg-calm-rose-bg text-calm-rose hover:bg-calm-rose-bg/70',
                  state === 'loading' && 'bg-calm-violet-bg text-calm-violet cursor-wait',
                  state === 'idle' && 'bg-calm-emerald text-white hover:bg-[#0CA67F]'
                )}
              >
                {state === 'loading' ? <SpinnerIcon /> : state === 'playing' ? <StopIcon /> : <SpeakerIcon />}
                {label}
              </button>
            ) : (
              <span className="text-[10.5px] text-charcoal-mute italic">Audio not supported in this browser</span>
            )}
            {audioCapable && (
              <span className="text-[10px] tracking-[0.18em] uppercase text-charcoal-mute font-semibold">
                Today&rsquo;s top 5 &middot; audio
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

function isPremiumModeEnabled(): boolean {
  return (import.meta.env.VITE_AUDIO_MODE ?? 'browser').toLowerCase() === 'premium';
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

function SpinnerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.3-8.58" />
    </svg>
  );
}
