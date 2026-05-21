// Sectoral lens intelligence layer.
//
// Replaces the curated 2-up headline stack when the user picks the
// "Sectoral" priority lens. The aim is not to show every sector —
// it's to answer "which sectors actually moved the narrative today,
// and what are the headlines I need to know for the one I care about?"
//
// Composition:
//   - AI commentary block (top, full width)
//   - Searchable sector dropdown + tone legend
//   - Default view: top-5 sector chips, click to drill in
//   - Selected view: top-5 ranked headlines for that sector, plus a
//     collapsed "Low-signal mentions" section for routine items

import { useMemo, useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import type { LensHeadline } from '../types';
import { useStore } from '../state/store';
import {
  SECTOR_UNIVERSE,
  aggregateBySector,
  topSectors,
  defaultCommentary,
  sectorCommentary,
  isMaterial,
  type CanonicalSector,
  type SectorTone,
  type SectorSummary,
} from '../utils/sectorIntel';

interface Props {
  headlines: LensHeadline[];
  // Controlled selection so the parent can render the picker in its
  // own header strip without duplicating state.
  picked: CanonicalSector | null;
  onPick: (s: CanonicalSector | null) => void;
}

export function SectorIntel({ headlines, picked, onPick }: Props) {
  const { openHeadline } = useStore();

  const summaries = useMemo(() => aggregateBySector(headlines), [headlines]);
  const top = useMemo(() => topSectors(summaries, 5), [summaries]);
  const summaryByPicked = useMemo(
    () => (picked ? summaries.find((s) => s.sector === picked) : undefined),
    [summaries, picked],
  );

  const commentary = picked
    ? sectorCommentary(summaryByPicked, picked)
    : defaultCommentary(top);

  return (
    <div className="space-y-3.5">
      <AiCommentary text={commentary} picked={picked} />

      <AnimatePresence mode="wait">
        {picked ? (
          <motion.div
            key={`detail-${picked}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <SectorDetail
              sector={picked}
              summary={summaryByPicked}
              onOpen={openHeadline}
              onBack={() => onPick(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <TopSectorsCards top={top} onSelect={onPick} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Exposed so the parent (Today.tsx) can render the picker in the
// section header alongside the "Curated" badge — frees vertical
// space inside the intel column.
export function SectorPickerControl({
  picked,
  onPick,
  activeSectors,
}: {
  picked: CanonicalSector | null;
  onPick: (s: CanonicalSector | null) => void;
  activeSectors: CanonicalSector[];
}) {
  return <SectorPicker value={picked} onChange={onPick} activeSectors={activeSectors} />;
}

export function useSectorSummaries(headlines: LensHeadline[]): CanonicalSector[] {
  return useMemo(
    () => aggregateBySector(headlines).map((s) => s.sector),
    [headlines],
  );
}

/* ---------- AI commentary card ---------- */

function AiCommentary({ text, picked }: { text: string; picked: CanonicalSector | null }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-bordersoft bg-cream shadow-soft px-4 py-3">
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: 'linear-gradient(180deg, #8C79C9 0%, #0F8F6F 100%)' }}
      />
      <div className="flex items-center gap-2 mb-1">
        <span className="relative inline-flex w-1.5 h-1.5">
          <span className="absolute inset-0 rounded-full bg-calm-violet opacity-60 animate-ping" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-calm-violet" />
        </span>
        <span className="text-[9px] tracking-[0.22em] uppercase font-semibold text-calm-violet">
          AI read{picked ? ` · ${picked}` : ''}
        </span>
      </div>
      <p className="text-[12.5px] md:text-[13px] text-charcoal-soft leading-snug">{text}</p>
    </div>
  );
}

/* ---------- Sector picker (searchable dropdown) ---------- */

function SectorPicker({
  value,
  onChange,
  activeSectors,
}: {
  value: CanonicalSector | null;
  onChange: (s: CanonicalSector | null) => void;
  activeSectors: CanonicalSector[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const activeSet = useMemo(() => new Set(activeSectors), [activeSectors]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SECTOR_UNIVERSE.filter((s) => !q || s.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border border-bordersoft bg-cream text-[12px] text-charcoal-soft shadow-soft hover:shadow-lift transition min-w-[200px] justify-between"
      >
        <span className="flex items-center gap-2 min-w-0">
          <SearchIcon />
          <span className="truncate">
            {value ?? 'Pick a sector'}
          </span>
        </span>
        <span className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear sector"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setQuery('');
              }}
              className="text-charcoal-mute hover:text-calm-rose px-1"
            >
              ×
            </span>
          )}
          <ChevronIcon open={open} />
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute z-30 mt-1.5 w-[min(80vw,280px)] rounded-2xl border border-bordersoft bg-cream shadow-lift overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-bordersoft/60">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sectors"
                autoFocus
                className="w-full bg-transparent text-[12.5px] text-charcoal placeholder:text-charcoal-mute focus:outline-none"
              />
            </div>
            <ul role="listbox" className="max-h-[280px] overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-[11.5px] text-charcoal-mute">
                  No sector matches “{query}”.
                </li>
              )}
              {filtered.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(s);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={clsx(
                      'w-full text-left px-3 py-1.5 text-[12.5px] flex items-center justify-between gap-2 hover:bg-cream-deep/60 transition',
                      value === s && 'bg-cream-deep/80'
                    )}
                  >
                    <span className="text-charcoal">{s}</span>
                    {activeSet.has(s) && (
                      <span className="text-[9.5px] tracking-[0.18em] uppercase font-semibold text-calm-emerald">
                        active
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Tone legend ---------- */

const TONE_STYLE: Record<SectorTone, { dot: string; chip: string; label: string }> = {
  support: {
    dot: 'bg-calm-green',
    chip: 'bg-calm-green-bg text-calm-green ring-calm-green/25',
    label: 'Support',
  },
  pressure: {
    dot: 'bg-calm-rose',
    chip: 'bg-calm-rose-bg text-calm-rose ring-calm-rose/25',
    label: 'Pressure',
  },
  mixed: {
    dot: 'bg-calm-violet',
    chip: 'bg-calm-violet-bg text-calm-violet ring-calm-violet/25',
    label: 'Mixed',
  },
  quiet: {
    dot: 'bg-charcoal-mute/60',
    chip: 'bg-cream-deep text-charcoal-mute ring-bordersoft',
    label: 'Quiet',
  },
};


function ToneChip({ tone }: { tone: SectorTone }) {
  const s = TONE_STYLE[tone];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ring-1 text-[9.5px] tracking-[0.18em] uppercase font-semibold',
        s.chip
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

/* ---------- Default: top sectors list ---------- */

function TopSectorsCards({
  top,
  onSelect,
}: {
  top: SectorSummary[];
  onSelect: (s: CanonicalSector) => void;
}) {
  if (top.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-bordersoft bg-cream/60 px-5 py-10 text-center text-[12.5px] text-charcoal-mute">
        No sector cleared the material-change threshold today.
      </div>
    );
  }
  // Same rectangular-card grid as Global / Portfolio HeadlineStack so
  // the three lenses share one visual language. The 5th card spans
  // the full row when the column count is 2 (odd total) so the grid
  // never has a half-row of whitespace.
  const items = top.slice(0, 5);
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {items.map((s, i) => {
        const isLastOdd = items.length % 2 === 1 && i === items.length - 1;
        const rail = TONE_STYLE[s.tone].dot;
        return (
          <li key={s.sector} className={clsx(isLastOdd && 'sm:col-span-2')}>
            <button
              type="button"
              onClick={() => onSelect(s.sector)}
              className="group relative w-full text-left rounded-2xl border border-bordersoft/70 bg-cream shadow-soft hover:shadow-lift transition-shadow overflow-hidden h-full flex flex-col"
            >
              <div className={clsx('absolute inset-y-0 left-0 w-[3px]', rail)} aria-hidden />
              <div className="relative pl-4 pr-3.5 py-3 flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-[14px] font-semibold text-charcoal truncate">
                    {s.sector}
                  </span>
                  <ToneChip tone={s.tone} />
                </div>
                <p className="text-[11.5px] text-charcoal-soft leading-snug line-clamp-2">
                  {s.topReason}
                </p>
                <div className="mt-auto pt-1 flex items-end justify-between gap-3">
                  <span className="text-[10px] tracking-[0.16em] uppercase font-semibold text-charcoal-mute">
                    {s.materialCount} material · {s.totalCount} total
                  </span>
                  <span className="text-[11px] font-medium text-calm-emerald group-hover:text-calm-emerald/80 transition">
                    Open →
                  </span>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Selected sector detail ---------- */

function SectorDetail({
  sector,
  summary,
  onOpen,
  onBack,
}: {
  sector: CanonicalSector;
  summary: SectorSummary | undefined;
  onOpen: (h: LensHeadline) => void;
  onBack: () => void;
}) {
  const DEFAULT_VISIBLE = 3;
  const [expanded, setExpanded] = useState(false);
  const material = summary?.headlines.filter(isMaterial) ?? [];
  const routine = summary?.headlines.filter((h) => !isMaterial(h)) ?? [];
  const tone: SectorTone = summary?.tone ?? 'quiet';
  const materialCount = material.length;
  const visible = expanded ? material.slice(0, 5) : material.slice(0, DEFAULT_VISIBLE);
  const hidden = Math.max(0, Math.min(material.length, 5) - visible.length);

  return (
    <div className="rounded-2xl border border-bordersoft bg-cream shadow-soft overflow-hidden">
      <div className="px-4 py-2.5 flex items-center justify-between gap-3 border-b border-bordersoft/60">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="text-[11px] text-charcoal-mute hover:text-charcoal-soft transition shrink-0"
          >
            ← All sectors
          </button>
          <span className="text-charcoal-mute/40">·</span>
          <h3 className="font-display text-[14px] font-semibold text-charcoal truncate">{sector}</h3>
          <ToneChip tone={tone} />
          <span className="text-[10px] tracking-[0.16em] uppercase font-semibold text-charcoal-mute">
            {materialCount} material
          </span>
        </div>
      </div>

      {material.length > 0 ? (
        <>
          <ul className="divide-y divide-bordersoft/60">
            {visible.map((s) => (
              <HeadlineRow key={s.headline.id} headline={s.headline} onOpen={onOpen} />
            ))}
          </ul>
          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full px-4 py-2 border-t border-bordersoft/60 text-[11px] tracking-wide font-medium text-calm-violet hover:bg-cream-deep/40 transition"
            >
              Show all {Math.min(material.length, 5)}
            </button>
          )}
          {expanded && material.length > DEFAULT_VISIBLE && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="w-full px-4 py-2 border-t border-bordersoft/60 text-[11px] tracking-wide text-charcoal-mute hover:text-charcoal-soft transition"
            >
              Show less
            </button>
          )}
        </>
      ) : (
        <div className="px-5 py-7 text-center text-[12px] text-charcoal-mute">
          No material sector-moving change detected today.
        </div>
      )}

      {routine.length > 0 && <LowSignalSection routine={routine} onOpen={onOpen} />}
    </div>
  );
}

function HeadlineRow({
  headline,
  onOpen,
}: {
  headline: LensHeadline;
  onOpen: (h: LensHeadline) => void;
}) {
  const tone: SectorTone =
    headline.signal === 'support'
      ? 'support'
      : headline.signal === 'risk'
      ? 'pressure'
      : headline.signal === 'monitor'
      ? 'mixed'
      : 'quiet';
  const companies = headline.affectedCompanies?.slice(0, 2) ?? [];

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(headline)}
        className="w-full text-left px-4 py-2.5 hover:bg-cream-deep/50 transition flex flex-col gap-1"
      >
        <div className="flex items-center gap-2 flex-wrap text-[10px] text-charcoal-mute tracking-wide">
          <ToneChip tone={tone} />
          <span className="truncate">{headline.category}</span>
          <span className="text-charcoal-mute/40">·</span>
          <span>{headline.timestamp}</span>
        </div>

        <h4 className="font-display text-[13px] font-medium text-charcoal leading-snug line-clamp-2">
          {headline.headline}
        </h4>
        <p className="text-[11.5px] text-charcoal-soft leading-snug truncate">
          {headline.whyItMatters}
        </p>

        {companies.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-0.5">
            {companies.map((c) => (
              <span
                key={c}
                className="font-mono text-[10px] text-charcoal-soft bg-cream-deep border border-bordersoft px-1.5 py-0.5 rounded"
              >
                {c}
              </span>
            ))}
            {(headline.affectedCompanies?.length ?? 0) > 2 && (
              <span className="text-[10px] text-charcoal-mute">
                +{(headline.affectedCompanies?.length ?? 0) - 2}
              </span>
            )}
          </div>
        )}
      </button>
    </li>
  );
}

function LowSignalSection({
  routine,
  onOpen,
}: {
  routine: { headline: LensHeadline; score: number }[];
  onOpen: (h: LensHeadline) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-bordersoft/60 bg-cream-deep/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-2.5 flex items-center justify-between text-[10.5px] tracking-[0.18em] uppercase font-semibold text-charcoal-mute hover:text-charcoal-soft transition"
      >
        <span>Low-signal mentions ({routine.length})</span>
        <ChevronIcon open={open} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden divide-y divide-bordersoft/40"
          >
            {routine.map((s) => (
              <li
                key={s.headline.id}
                className="px-5 py-2.5 flex items-center justify-between gap-3 hover:bg-cream-deep/40 transition cursor-pointer"
                onClick={() => onOpen(s.headline)}
              >
                <span className="text-[12px] text-charcoal-soft truncate">
                  {s.headline.headline}
                </span>
                <span className="text-[10.5px] text-charcoal-mute shrink-0">
                  {s.headline.category}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Tiny icon helpers ---------- */

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-charcoal-mute shrink-0">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      className={clsx('text-charcoal-mute transition-transform', open && 'rotate-180')}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
