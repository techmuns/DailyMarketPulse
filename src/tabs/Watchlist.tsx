import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { Delta } from '../components/Delta';
import { Sparkline } from '../components/Sparkline';
import { ToneDot, MeaningBadge } from '../components/Tone';
import { PulseBrief } from '../components/PulseBrief';
import { watchlist as mockWatchlist } from '../data/watchlist';
import { useLiveOverlay, DataSourceChip } from '../state/liveData';
import { useUserBook, mergeUserBook } from '../state/userBook';
import { useQuote } from '../state/quotes';
import { HoldingDialog } from '../components/HoldingDialog';
import type { DialogInitial } from '../components/HoldingDialog';
import { aiSignals } from '../data/signals';
import { useStore } from '../state/store';
import { num } from '../utils/format';
import { getSignalTone, toneTokens, marketMeaning } from '../utils/tone';
import clsx from 'clsx';
import type { Holding } from '../types';

export function Watchlist({ hideBrief = false }: { hideBrief?: boolean } = {}) {
  const { openDrawer } = useStore();
  const { state: bookState, add, edit, remove } = useUserBook();
  const merged = useMemo(
    () => mergeUserBook(mockWatchlist, bookState.watchlist),
    [bookState.watchlist],
  );
  const watchlist = useLiveOverlay(merged, 'holdings');
  const opp = watchlist.filter((w) => w.signal === 'support' || w.signal === 'monitor');
  const risk = watchlist.filter((w) => w.signal === 'risk');
  const correctedNoNews = watchlist.filter((w) => w.trend!.d1 < 0);
  const userIds = new Set(bookState.watchlist.added.map((a) => a.id));

  const [dialog, setDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; editId?: string; initial?: DialogInitial }>({
    open: false,
    mode: 'add',
  });

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-9">
      {!hideBrief && <PulseBrief tabKey="Watchlist" />}

      <header>
        <p className="label-mute">Watchlist</p>
        <h1 className="h-display text-[26px] font-semibold mt-1.5">On the radar</h1>
        <p className="text-[12.5px] text-charcoal-mute mt-1.5">Movers, opportunity & risk signals, unusual volume.</p>
      </header>

      <section>
        <SectionHeader
          title="Watchlist Signal Board"
          eyebrow="Today"
          hint="Movers, opportunity setups, risk signals, and no-news corrections."
          right={
            <div className="flex items-center gap-2">
              <DataSourceChip section="holdings" />
              <button
                type="button"
                onClick={() => setDialog({ open: true, mode: 'add' })}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-b from-calm-emerald to-[#0C7A5E] text-white text-[11px] font-semibold shadow-soft hover:shadow-lift transition"
              >
                <span aria-hidden>+</span> Add ticker
              </button>
            </div>
          }
        />
        <div className="card overflow-hidden">
          <table className="tbl">
            <thead>
              <tr>
                <th className="pl-5">Company</th>
                <th className="w-[100px]">Price</th>
                <th className="w-[80px]">1D</th>
                <th className="w-[80px]">5D</th>
                <th className="w-[80px]">1M</th>
                <th className="w-[110px]">Trend</th>
                <th>Why shown</th>
                <th className="pr-5 w-[90px]">Signal</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((w) => (
                <WatchRow
                  key={w.id}
                  w={w}
                  isUser={userIds.has(w.id)}
                  onOpen={() => openDrawer(aiSignals[2])}
                  onEdit={() =>
                    setDialog({
                      open: true,
                      mode: 'edit',
                      editId: w.id,
                      initial: {
                        ticker: w.ticker,
                        title: w.title,
                        sector: w.sector,
                        thesis: w.thesis,
                      },
                    })
                  }
                  onRemove={() => {
                    if (confirm(`Remove ${w.title}?`)) remove('watchlist', w.id);
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Opportunity signals" right={<ToneDot tone="support" />}>
          <ul className="mt-1 divide-y divide-bordersoft/60 text-[12.5px]">
            {opp.map((w) => (
              <li key={w.id} className="py-2 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <span className="text-charcoal">{w.ticker}</span>
                <span className="text-[11px] text-charcoal-mute text-right truncate">{w.whyShown}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Risk signals" right={<ToneDot tone="risk" />}>
          <ul className="mt-1 divide-y divide-bordersoft/60 text-[12.5px]">
            {risk.map((w) => (
              <li key={w.id} className="py-2 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <span className="text-charcoal">{w.ticker}</span>
                <span className="text-[11px] text-charcoal-mute text-right truncate">{w.whyShown}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section>
        <SectionHeader title="Corrected without negative news" eyebrow="Quiet movers" hint="Often the more interesting list." />
        <div className="card overflow-hidden">
          <table className="tbl">
            <thead>
              <tr>
                <th className="pl-5">Company</th>
                <th className="w-[80px]">1D</th>
                <th className="w-[80px]">5D</th>
                <th>Read</th>
                <th className="pr-5 w-[120px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {correctedNoNews.map((w) => (
                <tr key={w.id} className="row-link" onClick={() => openDrawer(aiSignals[2])}>
                  <td className="pl-5 text-[13px] font-medium text-charcoal">{w.title}</td>
                  <td><Delta value={w.trend!.d1} /></td>
                  <td><Delta value={w.trend!.d5} size="xs" /></td>
                  <td className="text-[11.5px] text-charcoal-mute">{w.whyShown}</td>
                  <td className="pr-5 text-[11.5px] text-calm-violet">+ Add to thesis</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <HoldingDialog
        open={dialog.open}
        mode={dialog.mode}
        surface="watchlist"
        initial={dialog.initial}
        onClose={() => setDialog({ open: false, mode: 'add' })}
        onSubmit={(data) => {
          if (dialog.mode === 'add') {
            add('watchlist', data as Parameters<typeof add>[1]);
          } else if (dialog.editId) {
            edit('watchlist', dialog.editId, data);
          }
          setDialog({ open: false, mode: 'add' });
        }}
      />
    </motion.div>
  );
}

function WatchRow({
  w,
  isUser,
  onOpen,
  onEdit,
  onRemove,
}: {
  w: Holding;
  isUser: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const tone = getSignalTone({ ...w, category: 'watchlist' });
  const meaning = marketMeaning({ ...w, category: 'watchlist' });
  const quote = useQuote(isUser ? w.ticker : null);
  const current = isUser && quote.data ? quote.data.current : (w.current as number | undefined);
  const d1 = isUser && quote.data ? quote.data.trend.d1 : w.trend!.d1;
  const d5 = isUser && quote.data ? quote.data.trend.d5 : w.trend!.d5;
  const m1 = isUser && quote.data ? quote.data.trend.m1 : w.trend!.m1;
  const spark = isUser && quote.data && quote.data.trend.spark.length > 0
    ? quote.data.trend.spark
    : w.trend!.spark;

  return (
    <tr className={clsx('row-link group', toneTokens(tone).rowClass)} onClick={onOpen}>
      <td className="pl-5">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-charcoal">{w.title}</span>
          {isUser && (
            <span className="chip bg-calm-violet-bg text-calm-violet" title="User-added">
              You
            </span>
          )}
          {meaning && <MeaningBadge tone={tone}>{meaning}</MeaningBadge>}
        </div>
        <div className="text-[10.5px] text-charcoal-mute mt-0.5">
          {w.sector}
          {isUser && quote.loading && <span className="ml-2 text-charcoal-mute/60">fetching live price…</span>}
          {isUser && quote.error && <span className="ml-2 text-calm-rose">price unavailable</span>}
        </div>
      </td>
      <td className="font-display font-medium text-charcoal tabular-nums">
        {current != null ? num(current, 1) : '—'}
      </td>
      <td><Delta value={d1} /></td>
      <td><Delta value={d5} size="xs" /></td>
      <td><Delta value={m1} size="xs" /></td>
      <td>
        <div className="w-[90px]">
          {spark.length > 1 ? (
            <Sparkline data={spark} color={toneTokens(tone).spark} height={24} />
          ) : (
            <span className="text-charcoal-mute text-[10px]">—</span>
          )}
        </div>
      </td>
      <td className="text-[11.5px] text-charcoal-mute leading-snug">{w.whyShown}</td>
      <td className="pr-5">
        <div className="flex items-center gap-2 justify-end">
          <ToneDot tone={tone} />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="opacity-0 group-hover:opacity-100 transition text-charcoal-mute hover:text-charcoal-soft text-[11px] px-1"
            title="Edit"
            aria-label="Edit ticker"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="opacity-0 group-hover:opacity-100 transition text-charcoal-mute hover:text-calm-rose text-[12px] px-1"
            title="Remove"
            aria-label="Remove ticker"
          >
            ×
          </button>
        </div>
      </td>
    </tr>
  );
}
