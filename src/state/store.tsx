import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AISignal, LensHeadline, PriorityLens } from '../types';

export interface SourceTarget {
  title: string;
  url: string;
  source?: string;
}

interface StoreCtx {
  lens: PriorityLens;
  setLens: (l: PriorityLens) => void;
  drawerSignal: AISignal | null;
  openDrawer: (s: AISignal) => void;
  closeDrawer: () => void;
  headlineDrawer: LensHeadline | null;
  openHeadline: (h: LensHeadline) => void;
  closeHeadline: () => void;
  sourceConfirm: SourceTarget | null;
  openSource: (t: SourceTarget) => void;
  closeSource: () => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lens, setLens] = useState<PriorityLens>('Global');
  const [drawerSignal, setDrawerSignal] = useState<AISignal | null>(null);
  const [headlineDrawer, setHeadlineDrawer] = useState<LensHeadline | null>(null);
  const [sourceConfirm, setSourceConfirm] = useState<SourceTarget | null>(null);

  const value = useMemo<StoreCtx>(
    () => ({
      lens,
      setLens,
      drawerSignal,
      openDrawer: (s) => setDrawerSignal(s),
      closeDrawer: () => setDrawerSignal(null),
      headlineDrawer,
      openHeadline: (h) => setHeadlineDrawer(h),
      closeHeadline: () => setHeadlineDrawer(null),
      sourceConfirm,
      openSource: (t) => setSourceConfirm(t),
      closeSource: () => setSourceConfirm(null),
    }),
    [lens, drawerSignal, headlineDrawer, sourceConfirm]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used within StoreProvider');
  return v;
}
