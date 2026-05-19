import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChangeStripChip, SourceChip } from '../components/Chip';
import { ToneDot, MeaningBadge } from '../components/Tone';
import { getSignalTone, toneTokens, marketMeaning } from '../utils/tone';
import { news, filings } from '../data/news';
import { aiSignals } from '../data/signals';
import { useStore } from '../state/store';
import { timeAgo } from '../utils/format';
import clsx from 'clsx';
import type { NewsItem, Filing } from '../types';

type Scope = 'all' | 'portfolio' | 'watchlist' | 'broader' | 'filings';

export function NewsFilings() {
  const [scope, setScope] = useState<Scope>('all');
  const { openDrawer } = useStore();

  const rows: Array<
    { kind: 'news'; item: NewsItem } | { kind: 'filing'; item: Filing }
  > = [
    ...news.map((n) => ({ kind: 'news' as const, item: n })),
    ...filings.map((f) => ({ kind: 'filing' as const, item: f })),
  ]
    .filter((r) => {
      if (scope === 'all') return true;
      if (scope === 'filings') return r.kind === 'filing';
      return r.kind === 'news' && r.item.scope === scope;
    })
    .sort((a, b) => +new Date(b.item.timestamp) - +new Date(a.item.timestamp));

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-7">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="label-mute">News & Filings</p>
          <h1 className="h-display text-[26px] font-semibold mt-1.5">Wire</h1>
          <p className="text-[12.5px] text-charcoal-mute mt-1.5">Portfolio first, then watchlist, then broader. Every item shows "Why shown" and a source label.</p>
        </div>
        <ScopeSelector value={scope} onChange={setScope} />
      </header>

      <div className="card overflow-hidden">
        <table className="tbl">
          <thead>
            <tr>
              <th className="pl-5 w-[80px]">Time</th>
              <th className="w-[120px]">Company / Sector</th>
              <th>Event</th>
              <th className="w-[120px]">Source</th>
              <th className="w-[80px]">Signal</th>
              <th>Why shown</th>
              <th className="pr-5 w-[110px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const item = r.item;
              const tags = (item as any).affected as string[];
              const scope = r.kind === 'news' ? (item as NewsItem).scope : 'portfolio';
              const tone = getSignalTone({ ...item, scope });
              const meaning = marketMeaning({ ...item, category: r.kind === 'filing' ? 'filing' : 'news' });
              return (
                <tr key={item.id} className={clsx('row-link', toneTokens(tone).rowClass)} onClick={() => openDrawer(aiSignals[1])}>
                  <td className="pl-5 text-[11.5px] text-charcoal-mute tabular-nums whitespace-nowrap">{timeAgo(item.timestamp)}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 2).map((a) => (
                        <span key={a} className="font-mono text-[11px] text-charcoal-soft bg-cream-deep border border-bordersoft px-1.5 py-0.5 rounded">{a}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.changeStrip && <ChangeStripChip value={item.changeStrip} />}
                      {meaning && <MeaningBadge tone={tone}>{meaning}</MeaningBadge>}
                      {r.kind === 'filing' && (
                        <span className="chip bg-calm-navy-bg text-calm-navy">{(item as Filing).filingType}</span>
                      )}
                    </div>
                    <div className="text-[13px] font-medium text-charcoal mt-1 leading-snug">{item.title}</div>
                  </td>
                  <td><SourceChip value={item.source} /></td>
                  <td><ToneDot tone={tone} /></td>
                  <td className="text-[11.5px] text-charcoal-mute leading-snug">{item.whyShown}</td>
                  <td className="pr-5 text-[11.5px] text-calm-violet">{item.action || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-charcoal-mute">
        Showing {rows.length} items · {scope === 'all' ? 'all scopes' : scope}
      </div>
    </motion.div>
  );
}

function ScopeSelector({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  const opts: Array<{ key: Scope; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'portfolio', label: 'Portfolio' },
    { key: 'watchlist', label: 'Watchlist' },
    { key: 'broader', label: 'Broader' },
    { key: 'filings', label: 'Filings' },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 bg-cream-deep border border-bordersoft rounded-full p-0.5 shadow-soft">
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={clsx(
            'px-3 py-1 rounded-full text-[11.5px] transition',
            value === o.key ? 'bg-charcoal text-cream shadow-soft' : 'text-charcoal-mute hover:text-charcoal-soft'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
