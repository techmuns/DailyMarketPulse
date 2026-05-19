import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechReturn {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  supported: boolean;
}

/**
 * Pick a bright, clear female English voice from the available list.
 * Preference order: en-IN female → en-GB female → en-US female →
 * any English female → any English → any.
 */
export function selectPreferredVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // Names that are reliably female across common platforms.
  const femalePattern =
    /(heera|zira|samantha|karen|veena|tessa|fiona|moira|kate|serena|allison|susan|female|google uk english female|google us english|priya|raveena|aaliyah)/i;
  const malePattern = /(male|david|mark|alex|fred|daniel|james|google uk english male|microsoft mark|microsoft david)/i;

  const enIN = voices.filter((v) => /en[-_]IN/i.test(v.lang));
  const enGB = voices.filter((v) => /en[-_]GB/i.test(v.lang));
  const enUS = voices.filter((v) => /en[-_]US/i.test(v.lang));
  const enAny = voices.filter((v) => /^en/i.test(v.lang));

  const pools = [enIN, enGB, enUS, enAny];
  for (const pool of pools) {
    const explicitFemale = pool.find((v) => femalePattern.test(v.name));
    if (explicitFemale) return explicitFemale;
    const notMale = pool.find((v) => !malePattern.test(v.name));
    if (notMale) return notMale;
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
      // Bright but professional: slightly elevated pitch, natural rate.
      u.rate = 1.02;
      u.pitch = 1.12;
      u.volume = 1.0;
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      utterRef.current = u;
      window.speechSynthesis.speak(u);
    },
    [supported, voice]
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  return { speak, stop, isSpeaking, supported };
}
