import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { Heatmap } from '../components/Heatmap';
import type { HeatCell } from '../components/Heatmap';
import { portfolio as mockPortfolio, portfolioStats } from '../data/portfolio';
import { useLiveOverlay, DataSourceChip } from '../state/liveData';
import { useUserBook, mergeUserBook } from '../state/userBook';
import { useQuote } from '../state/quotes';
import { HoldingDialog } from '../components/HoldingDialog';
import type { DialogInitial } from '../components/HoldingDialog';
import { Delta } from '../components/Delta';
import { Sparkline } from '../components/Sparkline';
import { ToneDot, MeaningBadge } from '../components/Tone';
import { PulseBrief } from '../components/PulseBrief';
import { pct } from '../utils/format';
import { getSignalTone, toneTokens, marketMeaning } from '../utils/tone';
import { aiSignals } from '../data/signals';
import { useStore } from '../state/store';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import clsx from 'clsx';
import type { Holding } from '../types';

export function Portfolio({ hideBrief = false }: { hideBrief?: boolean } = {}) {
  const { openDrawer } = useStore();
  const { state: bookState, add, edit, remove } = useUserBook();
  const merged = useMemo(
    () => mergeUserBook(mockPortfolio, bookState.portfolio),
    [bookState.portfolio],
  );
  const portfolio = useLiveOverlay(merged, 'holdings');
  const sortedByWeight = [...portfolio].sort((a, b) => b.weight - a.weight);

  const [dialog, setDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; editId?: string; initial?: DialogInitial }>({
    open: false,
    mode: 'add',
  });
  const userIds = new Set(bookState.portfolio.added.map((a) => a.id));

  const heat: HeatCell[] = sortedByWeight.map((h) => ({
    id: h.id,
    label: h.ticker,
    value: h.trend!.d1,
    sub: h.sector,
    size: h.weight,
  }));

  const contribData = [...portfolio]
    .map((h) => ({ name: h.ticker, value: h.trend!.d1 * (h.weight / 100) * 100, raw: h.trend!.d1 }))
    .sort((a, b) => b.value - a.value);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-9">
      {!hideBrief && <PulseBrief tabKey="Portfolio" />}

      <header>
        <p className="label-mute">Portfolio</p>
        <h1 className="h-display text-[26px] font-semibold mt-1.5">Your book</h1>
        <p className="text-[12.5px] text-charcoal-mute mt-1.5">What changed since yesterday for your holdings.</p>
      </header>

      {/* Immediate analyst read — moved up so the most actionable
          summary is visible before the user scrolls past the
          scorecards / heatmap. */}
      <WhatChangedCard />

      {/* Scorecards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Scorecard label="Book value" value={portfolioStats.bookValue} sub="mock NAV" accent="navy" />
        <Scorecard label="Today" value={pct(portfolioStats.todayChange)} dir={portfolioStats.todayChange} sub={`${portfolioStats.positive}↑ / ${portfolioStats.negative}↓`} />
        <Scorecard label="5-day" value={pct(portfolioStats.d5Change)} dir={portfolioStats.d5Change} sub="rolling" />
        <Scorecard label="1-month" value={pct(portfolioStats.m1Change)} dir={portfolioStats.m1Change} sub="rolling" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title="Holdings heatmap" subtitle="Sized by weight · coloured by 1D move">
          <Heatmap cells={heat} cols={4} onClick={() => openDrawer(aiSignals[0])} />
        </Card>
        <Card title="Contribution (1D)" subtitle="Weighted bps to book today">
          <div className="h-[220px] mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contribData} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#7A7A82' }} width={56} />
                <ReferenceLine x={0} stroke="#DDD6E8" />
                <Bar dataKey="value" radius={[3, 3, 3, 3]} barSize={10}>
                  {contribData.map((d) => (
                    <Cell key={d.name} fill={d.value >= 0 ? '#0F8F6F' : '#C86B6B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeader
          title="Portfolio Impact Board"
          eyebrow="Holdings"
          hint="Weight, today's move, 5D trend, impact driver and action."
          right={
            <div className="flex items-center gap-2">
              <DataSourceChip section="holdings" />
              <button
                type="button"
                onClick={() => setDialog({ open: true, mode: 'add' })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-b from-calm-emerald to-[#0C7A5E] text-white text-[11px] font-semibold shadow-soft hover:shadow-lift transition"
              >
                <span aria-hidden>+</span> Add holding
              </button>
            </div>
          }
        />
        <div className="card overflow-hidden">
          <table className="tbl">
            <thead>
              <tr>
                <th className="pl-5">Company</th>
                <th className="w-[90px]">Weight</th>
                <th className="w-[90px]">1D</th>
                <th className="w-[110px]">5D trend</th>
                <th>Impact driver</th>
                <th className="w-[90px]">Signal</th>
                <th className="pr-5 w-[120px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedByWeight.map((h) => (
                <HoldingRow
                  key={h.id}
                  h={h}
                  isUser={userIds.has(h.id)}
                  onOpen={() => openDrawer(aiSignals[0])}
                  onEdit={() =>
                    setDialog({
                      open: true,
                      mode: 'edit',
                      editId: h.id,
                      initial: {
                        ticker: (h as Holding & { ticker?: string }).ticker,
                        title: h.title,
                        sector: h.sector,
                        weight: h.weight,
                        thesis: h.thesis,
                      },
                    })
                  }
                  onRemove={() => {
                    if (confirm(`Remove ${h.title}?`)) remove('portfolio', h.id);
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <HoldingDialog
        open={dialog.open}
        mode={dialog.mode}
        surface="portfolio"
        initial={dialog.initial}
        onClose={() => setDialog({ open: false, mode: 'add' })}
        onSubmit={(data) => {
          if (dialog.mode === 'add') {
            add('portfolio', data as Parameters<typeof add>[1]);
          } else if (dialog.editId) {
            edit('portfolio', dialog.editId, data);
          }
          setDialog({ open: false, mode: 'add' });
        }}
      />
    </motion.div>
  );
}

// Row component — handles its own live-quote fetch for user-added
// holdings so the demo rows (which come pre-populated via the live
// overlay) don't pay any extra cost.
function HoldingRow({
  h,
  isUser,
  onOpen,
  onEdit,
  onRemove,
}: {
  h: Holding;
  isUser: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const tone = getSignalTone({ ...h, scope: 'portfolio' });
  const meaning = marketMeaning({ ...h, category: 'portfolio' });
  // For user-added rows the bundled overlay can't fill values (no id
  // match in live.json). Fetch on demand from /api/quote.
  const quote = useQuote(isUser ? h.ticker : null);
  const d1 = isUser && quote.data ? quote.data.trend.d1 : h.trend!.d1;
  const spark = isUser && quote.data && quote.data.trend.spark.length > 0
    ? quote.data.trend.spark
    : h.trend!.spark;

  return (
    <tr
      className={clsx('row-link group', toneTokens(tone).rowClass)}
      onClick={onOpen}
    >
      <td className="pl-5">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-charcoal">{h.title}</span>
          {isUser && (
            <span className="chip bg-calm-violet-bg text-calm-violet" title="User-added">
              You
            </span>
          )}
          {meaning && <MeaningBadge tone={tone}>{meaning}</MeaningBadge>}
        </div>
        <div className="text-[10.5px] text-charcoal-mute mt-0.5">
          {h.sector}
          {isUser && quote.loading && <span className="ml-2 text-charcoal-mute/60">fetching live price…</span>}
          {isUser && quote.error && <span className="ml-2 text-calm-rose">price unavailable</span>}
        </div>
      </td>
      <td className="tabular-nums text-charcoal-soft text-[12px]">{h.weight}%</td>
      <td>
        {isUser && quote.loading ? (
          <span className="text-charcoal-mute text-[12px]">—</span>
        ) : (
          <Delta value={d1} />
        )}
      </td>
      <td>
        <div className="w-[80px]">
          {spark.length > 1 ? (
            <Sparkline data={spark} color={toneTokens(tone).spark} height={22} />
          ) : (
            <span className="text-charcoal-mute text-[10px]">—</span>
          )}
        </div>
      </td>
      <td className="text-[11.5px] text-charcoal-mute leading-snug">{h.whyShown}</td>
      <td><ToneDot tone={tone} /></td>
      <td className="pr-5">
        <div className="flex items-center gap-2 justify-end">
          <span className="text-[11.5px] text-calm-violet">{h.action || '—'}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="opacity-0 group-hover:opacity-100 transition text-charcoal-mute hover:text-charcoal-soft text-[11px] px-1"
            title="Edit"
            aria-label="Edit holding"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="opacity-0 group-hover:opacity-100 transition text-charcoal-mute hover:text-calm-rose text-[12px] px-1"
            title="Remove"
            aria-label="Remove holding"
          >
            ×
          </button>
        </div>
      </td>
    </tr>
  );
}

function Scorecard({ label, value, sub, dir, accent }: { label: string; value: string; sub?: string; dir?: number; accent?: 'navy' }) {
  const c =
    accent === 'navy'
      ? 'border-l-calm-navy'
      : dir !== undefined
      ? dir > 0
        ? 'border-l-calm-green'
        : dir < 0
        ? 'border-l-calm-rose'
        : 'border-l-bordersoft'
      : 'border-l-bordersoft';
  return (
    <div className={clsx('bg-cream border border-bordersoft border-l-[3px] rounded-xl p-4 shadow-soft', c)}>
      <div className="label-mute">{label}</div>
      <div className="mt-2 font-display text-[20px] font-semibold text-charcoal leading-tight tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-[11.5px] text-charcoal-mute">{sub}</div>}
    </div>
  );
}

type ChangeKind = 'risk' | 'support' | 'change' | 'trend';
interface ChangeRow {
  kind: ChangeKind;
  label: string;
  text: string;
}

const CHANGE_ROWS: ChangeRow[] = [
  { kind: 'risk',    label: 'Risk increased',         text: 'Autos input cost squeeze deepened for M&M and Maruti.' },
  { kind: 'support', label: 'Support improved',       text: 'CPI cooled, helping rate-sensitive holdings.' },
  { kind: 'change',  label: 'Changed since yesterday', text: 'Asian Paints filing eased crude pass-through worry.' },
  { kind: 'trend',   label: '5-day trend',            text: 'INR weakness remains durable: exporter tailwind, importer drag.' },
];

const CHIP_STYLE: Record<ChangeKind, string> = {
  risk:    'bg-calm-rose-bg/70 text-calm-rose ring-calm-rose/20',
  support: 'bg-calm-emerald-bg/70 text-calm-emerald ring-calm-emerald/25',
  change:  'bg-calm-violet-bg/70 text-calm-violet ring-calm-violet/20',
  trend:   'bg-calm-amber-bg/70 text-calm-amber ring-calm-amber/25',
};

function WhatChangedCard() {
  return (
    <section
      aria-labelledby="what-changed-title"
      className="relative rounded-2xl border border-bordersoft bg-white overflow-hidden"
      style={{
        boxShadow: '0 14px 38px rgba(72,55,120,0.10), 0 1px 0 rgba(255,255,255,0.6) inset',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: 'linear-gradient(180deg, #0F8F6F 0%, #8C79C9 100%)' }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 88% -10%, rgba(140,121,201,0.10) 0%, transparent 45%)',
        }}
      />

      <div className="relative px-5 py-4 md:px-6 md:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 id="what-changed-title" className="font-display text-[16px] font-semibold text-charcoal">
              What changed since yesterday
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-calm-violet-bg/60 ring-1 ring-calm-violet/20 text-[9.5px] tracking-[0.18em] uppercase font-semibold text-calm-violet">
              <span className="w-1.5 h-1.5 rounded-full bg-calm-violet" />
              Book read
            </span>
          </div>
          <span className="text-[10.5px] tracking-[0.18em] uppercase font-semibold text-charcoal-mute">
            Updated today
          </span>
        </div>

        <ul className="divide-y divide-bordersoft/50">
          {CHANGE_ROWS.map((r) => (
            <li
              key={r.label}
              className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span
                className={clsx(
                  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ring-1 text-[9.5px] tracking-[0.16em] uppercase font-semibold shrink-0 mt-[1px]',
                  CHIP_STYLE[r.kind],
                )}
              >
                {r.label}
              </span>
              <span className="text-[12.5px] text-charcoal-soft leading-snug">{r.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
