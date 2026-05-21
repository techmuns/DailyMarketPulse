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

type PlayState = 'idle' | 'loading' | 'playing' | 'paused';

// Global lock — guarantees only one audio source is playing across the
// whole app even if two PulseBriefs render simultaneously. Set when a
// brief starts, cleared on stop/end. The stopper is invoked by any
// other brief that wants to start.
let activeStopper: (() => void) | null = null;

export function PulseBrief({ tabKey, className }: Props) {
  const brief = pulseBriefs[tabKey];
  const { speak, pause: pauseBrowser, resume: resumeBrowser, stop: stopBrowser, isSpeaking, supported } = useSpeech();
  const { openDrawer } = useStore();
  const tokens = toneTokens(brief.tone);

  const [state, setState] = useState<PlayState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUrlRef = useRef<string | null>(null);
  // Tracks whether playback is using the HTMLAudioElement (premium)
  // or the browser SpeechSynthesis fallback — pause/resume route
  // differently per source.
  const sourceRef = useRef<'audio' | 'speech' | null>(null);
  // SpeechSynthesisUtterance.onstart fires asynchronously after
  // speak() returns, so `isSpeaking` is briefly still false right
  // after we set state to 'playing'. Without this flag the auto-idle
  // effect below would flip state back to 'idle' before the Pause
  // button ever renders. We set this to true when speech actually
  // starts and only allow the auto-idle transition after that.
  const speechStartedRef = useRef(false);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current = null;
    }
    stopBrowser();
    sourceRef.current = null;
    speechStartedRef.current = false;
    if (activeStopper === stopAudio) activeStopper = null;
    setState('idle');
  }, [stopBrowser]);

  const pauseAudio = useCallback(() => {
    if (sourceRef.current === 'audio' && audioRef.current) {
      audioRef.current.pause();
    } else if (sourceRef.current === 'speech') {
      pauseBrowser();
    }
    setState('paused');
  }, [pauseBrowser]);

  const resumeAudio = useCallback(async () => {
    if (sourceRef.current === 'audio' && audioRef.current) {
      try {
        await audioRef.current.play();
        setState('playing');
      } catch {
        setState('idle');
      }
    } else if (sourceRef.current === 'speech') {
      resumeBrowser();
      setState('playing');
    }
  }, [resumeBrowser]);

  // Stop everything on tab change / unmount.
  useEffect(() => {
    return () => {
      stopAudio();
      revokeAudio(lastUrlRef.current);
      lastUrlRef.current = null;
    };
  }, [tabKey, stopAudio]);

  // Auto-recover to idle when the browser-TTS finishes on its own.
  // Only valid AFTER speech has actually started — otherwise the
  // initial !isSpeaking after calling speak() would flip us back to
  // idle before Pause/Stop ever render (the bug this guards against).
  useEffect(() => {
    if (isSpeaking) {
      speechStartedRef.current = true;
      return;
    }
    if (
      state === 'playing' &&
      sourceRef.current === 'speech' &&
      speechStartedRef.current &&
      !isSpeaking
    ) {
      setState('idle');
      sourceRef.current = null;
      speechStartedRef.current = false;
    }
  }, [isSpeaking, state]);

  const onPrimary = useCallback(async () => {
    if (state === 'playing') {
      pauseAudio();
      return;
    }
    if (state === 'paused') {
      await resumeAudio();
      return;
    }
    if (state === 'loading') return;

    // Kick off a fresh playback. First, ensure any other brief that
    // might be playing in the app is stopped — no overlap.
    if (activeStopper && activeStopper !== stopAudio) {
      activeStopper();
    }
    activeStopper = stopAudio;

    const script = buildTopFiveAudioScript(topChanges);
    setState('loading');

    const premium = await generateTopFiveAudio(script);
    if (premium?.url) {
      revokeAudio(lastUrlRef.current);
      lastUrlRef.current = premium.url;
      const audio = new Audio(premium.url);
      audio.onended = () => {
        setState('idle');
        sourceRef.current = null;
        if (activeStopper === stopAudio) activeStopper = null;
      };
      audio.onerror = () => setState('idle');
      audioRef.current = audio;
      sourceRef.current = 'audio';
      try {
        await audio.play();
        setState('playing');
      } catch {
        setState('idle');
      }
      return;
    }

    if (supported) {
      speechStartedRef.current = false;
      speak(script);
      sourceRef.current = 'speech';
      setState('playing');
    } else {
      setState('idle');
    }
  }, [state, pauseAudio, resumeAudio, stopAudio, supported, speak]);

  const audioCapable = supported || isPremiumModeEnabled();
  const primaryLabel =
    state === 'loading' ? 'Preparing audio…'
      : state === 'playing' ? 'Pause'
      : state === 'paused' ? 'Resume'
      : 'Play Today’s Top 5';
  const showStopBtn = state === 'playing' || state === 'paused' || state === 'loading';

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
              <div className="inline-flex items-center gap-1.5">
                <button
                  onClick={onPrimary}
                  disabled={state === 'loading'}
                  aria-label={
                    state === 'playing' ? 'Pause audio'
                      : state === 'paused' ? 'Resume audio'
                      : state === 'loading' ? 'Preparing audio'
                      : "Play Today's top 5 audio"
                  }
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition shadow-soft',
                    state === 'playing' && 'bg-calm-emerald text-white hover:bg-[#0CA67F]',
                    state === 'paused' && 'bg-calm-emerald text-white hover:bg-[#0CA67F]',
                    state === 'loading' && 'bg-calm-violet-bg text-calm-violet cursor-wait',
                    state === 'idle' && 'bg-calm-emerald text-white hover:bg-[#0CA67F]'
                  )}
                >
                  {state === 'loading' ? <SpinnerIcon />
                    : state === 'playing' ? <PauseIcon />
                    : <SpeakerIcon />}
                  {primaryLabel}
                </button>
                {showStopBtn && (
                  <button
                    onClick={stopAudio}
                    aria-label="Stop audio"
                    title="Stop"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-cream-deep border border-bordersoft text-charcoal-mute hover:text-calm-rose hover:border-calm-rose/30 transition"
                  >
                    <StopIcon />
                  </button>
                )}
              </div>
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

function PauseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
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
