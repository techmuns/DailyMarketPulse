import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechReturn {
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSpeaking: boolean;
  supported: boolean;
}

/**
 * Pick a bright, clear female English voice from the available list.
 * Preference order: en-US female → en-GB female → any English female
 * → any English → first voice. en-IN voices are deliberately
 * deprioritised and only used when no other English voice exists.
 */
export function selectPreferredVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const femalePattern =
    /(samantha|zira|karen|tessa|fiona|moira|kate|serena|allison|susan|female|google us english|google uk english female|aria|jenny|sonia)/i;
  const malePattern = /(male|david|mark|alex|fred|daniel|james|google uk english male|microsoft mark|microsoft david)/i;

  const isLang = (v: SpeechSynthesisVoice, code: string) => new RegExp(`^${code}([-_]|$)`, 'i').test(v.lang);
  const enUS = voices.filter((v) => isLang(v, 'en[-_]US'));
  const enGB = voices.filter((v) => isLang(v, 'en[-_]GB'));
  const enAU = voices.filter((v) => isLang(v, 'en[-_]AU'));
  const enCA = voices.filter((v) => isLang(v, 'en[-_]CA'));
  const enOther = voices.filter(
    (v) => /^en/i.test(v.lang) && !/en[-_](US|GB|AU|CA|IN)/i.test(v.lang)
  );
  const enIN = voices.filter((v) => isLang(v, 'en[-_]IN'));

  // Pools in priority order. Inside each pool: explicit-female → not-male.
  const pools = [enUS, enGB, enAU, enCA, enOther];
  for (const pool of pools) {
    const explicitFemale = pool.find((v) => femalePattern.test(v.name));
    if (explicitFemale) return explicitFemale;
  }
  for (const pool of pools) {
    const notMale = pool.find((v) => !malePattern.test(v.name));
    if (notMale) return notMale;
  }
  // Only fall back to en-IN if no other English voice exists at all.
  if (enIN.length > 0) {
    const femaleIN = enIN.find((v) => femalePattern.test(v.name));
    if (femaleIN) return femaleIN;
    const notMaleIN = enIN.find((v) => !malePattern.test(v.name));
    if (notMaleIN) return notMaleIN;
    return enIN[0];
  }
  return voices[0] ?? null;
}

export function useSpeech(): UseSpeechReturn {
  const supported =
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis !== 'undefined' &&
    typeof window.SpeechSynthesisUtterance !== 'undefined';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Voices load asynchronously on first call; subscribe to the change event.
  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const v = selectPreferredVoice(window.speechSynthesis.getVoices());
      if (v) setVoice(v);
    };
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      }
      // Bright but professional. Used only as a fallback when the
      // premium TTS layer is unavailable.
      u.rate = 1.02;
      u.pitch = 1.10;
      u.volume = 1.0;
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      utterRef.current = u;
      window.speechSynthesis.speak(u);
    },
    [supported, voice]
  );

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  return { speak, pause, resume, stop, isSpeaking, supported };
}
