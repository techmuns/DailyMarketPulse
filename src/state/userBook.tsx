// User-editable portfolio + watchlist persisted in localStorage.
//
// State shape per surface ('portfolio' | 'watchlist'):
//   - added:      user-created holdings (rendered alongside the bundled
//                 demo data)
//   - overrides:  patches keyed by holding id, applied on top of either
//                 demo or user-added items (lets users edit weight /
//                 sector / title without re-creating)
//   - hiddenIds:  bundled demo ids the user has chosen to hide; user
//                 additions are removed by deleting them from `added`
//
// Storage key: `dmp:user-book:v1`. Versioned so a future shape bump
// can migrate cleanly.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { Holding } from '../types';

export type BookSurface = 'portfolio' | 'watchlist';

export interface UserHolding {
  id: string;
  ticker: string;       // Yahoo symbol, e.g. RELIANCE.NS
  title: string;        // display name
  sector: string;
  weight: number;       // % of book (watchlist items use 0)
  thesis: string;
  source: 'user';
  addedAt: string;      // ISO
}

export type HoldingPatch = Partial<Pick<UserHolding, 'title' | 'ticker' | 'sector' | 'weight' | 'thesis'>>;

interface SurfaceState {
  added: UserHolding[];
  overrides: Record<string, HoldingPatch>;
  hiddenIds: string[];
}

interface BookState {
  v: 1;
  portfolio: SurfaceState;
  watchlist: SurfaceState;
}

const EMPTY_SURFACE: SurfaceState = { added: [], overrides: {}, hiddenIds: [] };
const EMPTY_STATE: BookState = { v: 1, portfolio: EMPTY_SURFACE, watchlist: EMPTY_SURFACE };

const STORAGE_KEY = 'dmp:user-book:v1';

function loadState(): BookState {
  if (typeof window === 'undefined') return EMPTY_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<BookState>;
    if (parsed?.v !== 1) return EMPTY_STATE;
    return {
      v: 1,
      portfolio: { ...EMPTY_SURFACE, ...(parsed.portfolio ?? {}) },
      watchlist: { ...EMPTY_SURFACE, ...(parsed.watchlist ?? {}) },
    };
  } catch {
    return EMPTY_STATE;
  }
}

function saveState(state: BookState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage full or unavailable — silently drop, UI still works in-memory */
  }
}

interface UserBookCtx {
  state: BookState;
  add: (surface: BookSurface, holding: Omit<UserHolding, 'id' | 'source' | 'addedAt'>) => string;
  edit: (surface: BookSurface, id: string, patch: HoldingPatch) => void;
  remove: (surface: BookSurface, id: string) => void;
  reset: (surface: BookSurface) => void;
}

const Ctx = createContext<UserBookCtx | null>(null);

export function UserBookProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const add = useCallback(
    (surface: BookSurface, h: Omit<UserHolding, 'id' | 'source' | 'addedAt'>) => {
      const id = `user-${surface[0]}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      setState((s) => ({
        ...s,
        [surface]: {
          ...s[surface],
          added: [
            ...s[surface].added,
            { ...h, id, source: 'user', addedAt: new Date().toISOString() },
          ],
        },
      }));
      return id;
    },
    [],
  );

  const edit = useCallback((surface: BookSurface, id: string, patch: HoldingPatch) => {
    setState((s) => {
      const current = s[surface];
      // If it's a user-added item, mutate in-place; otherwise store as override.
      const userIdx = current.added.findIndex((a) => a.id === id);
      if (userIdx >= 0) {
        const next = [...current.added];
        next[userIdx] = { ...next[userIdx], ...patch };
        return { ...s, [surface]: { ...current, added: next } };
      }
      return {
        ...s,
        [surface]: {
          ...current,
          overrides: {
            ...current.overrides,
            [id]: { ...(current.overrides[id] ?? {}), ...patch },
          },
        },
      };
    });
  }, []);

  const remove = useCallback((surface: BookSurface, id: string) => {
    setState((s) => {
      const current = s[surface];
      if (current.added.some((a) => a.id === id)) {
        return {
          ...s,
          [surface]: {
            ...current,
            added: current.added.filter((a) => a.id !== id),
            overrides: omitKey(current.overrides, id),
          },
        };
      }
      return {
        ...s,
        [surface]: {
          ...current,
          hiddenIds: current.hiddenIds.includes(id)
            ? current.hiddenIds
            : [...current.hiddenIds, id],
        },
      };
    });
  }, []);

  const reset = useCallback((surface: BookSurface) => {
    setState((s) => ({ ...s, [surface]: EMPTY_SURFACE }));
  }, []);

  const value = useMemo(() => ({ state, add, edit, remove, reset }), [state, add, edit, remove, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserBook(): UserBookCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useUserBook must be used inside <UserBookProvider>');
  return v;
}

function omitKey<T extends Record<string, unknown>>(obj: T, key: string): T {
  if (!(key in obj)) return obj;
  const next = { ...obj };
  delete next[key];
  return next;
}

/**
 * Merge a bundled mock array with user state: drops hidden ids,
 * applies overrides, and appends user-added rows (cast to the same
 * Holding shape with sensible defaults for the demo fields).
 */
export function mergeUserBook<T extends Holding>(
  bundled: T[],
  surface: SurfaceState,
): T[] {
  const visible = bundled
    .filter((h) => !surface.hiddenIds.includes(h.id))
    .map((h) => {
      const patch = surface.overrides[h.id];
      return patch ? ({ ...h, ...patch } as T) : h;
    });

  const userRows: T[] = surface.added.map((u) => ({
    id: u.id,
    title: u.title,
    ticker: u.ticker,
    sector: u.sector,
    weight: u.weight,
    thesis: u.thesis,
    category: 'portfolio',
    current: undefined as unknown as number, // will be filled by useUserQuote
    previous: undefined as unknown as number,
    trend: { d1: 0, d5: 0, m1: 0, spark: [] },
    signal: 'monitor',
    impact: 50,
    affected: [u.ticker.split('.')[0]],
    whyShown: 'User-added holding',
    source: 'Reliable media',
    confidence: 60,
    timestamp: u.addedAt,
  } as unknown as T));

  return [...visible, ...userRows];
}
