import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { actions } from '../data/actions';
import { timeAgo } from '../utils/format';
import clsx from 'clsx';
import type { ActionItem } from '../types';

const COLS: ActionItem['status'][] = ['open', 'in-progress', 'reviewed', 'completed'];
const COL_LABEL: Record<ActionItem['status'], string> = {
  open: 'Open',
  'in-progress': 'In progress',
  reviewed: 'Reviewed',
  completed: 'Completed',
};

const TYPE_ACCENT: Record<ActionItem['type'], string> = {
  'Add to thesis': 'bg-calm-green',
  'Assign follow-up': 'bg-calm-navy',
  'Read later': 'bg-calm-amber',
  'Mark noise': 'bg-charcoal-mute',
  'Escalate to PM': 'bg-calm-rose',
};

export function Actions() {
  const [items, setItems] = useState<ActionItem[]>(actions);
  const [filter, setFilter] = useState<'all' | ActionItem['status']>('all');

  const grouped = useMemo(() => {
    const m: Record<ActionItem['status'], ActionItem[]> = {
      open: [], 'in-progress': [], reviewed: [], completed: [],
    };
    items.forEach((i) => m[i.status].push(i));
    return m;
  }, [items]);

  const advance = (id: string) => {
    setItems((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next: ActionItem['status'] =
          p.status === 'open' ? 'in-progress'
            : p.status === 'in-progress' ? 'reviewed'
            : p.status === 'reviewed' ? 'completed' : 'completed';
        return { ...p, status: next };
      })
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-7">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="label-mute">Actions</p>
          <h1 className="h-display text-[26px] font-semibold mt-1.5">Task board</h1>
          <p className="text-[12.5px] text-charcoal-mute mt-1.5">Triage your day — keep the flow short.</p>
        </div>
        <div className="inline-flex items-center gap-0.5 bg-cream-deep border border-bordersoft rounded-full p-0.5 shadow-soft">
          {(['all', 'open', 'in-progress', 'reviewed', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'px-3 py-1 rounded-full text-[11.5px] capitalize transition',
                filter === f ? 'bg-charcoal text-cream shadow-soft' : 'text-charcoal-mute hover:text-charcoal-soft'
              )}
            >
              {f.replace('-', ' ')}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLS.filter((c) => filter === 'all' || filter === c).map((col) => (
          <div key={col} className="bg-cream-deep rounded-2xl border border-bordersoft p-3 min-h-[140px]">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <div className="label-mute">{COL_LABEL[col]}</div>
              <div className="text-[10.5px] text-charcoal-mute tabular-nums">{grouped[col].length}</div>
            </div>
            <div className="space-y-2">
              {grouped[col].map((a) => (
                <div key={a.id} className="bg-cream rounded-xl border border-bordersoft p-3 shadow-soft">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={clsx('w-1.5 h-1.5 rounded-full', TYPE_ACCENT[a.type])} />
                      <span className="text-[11px] text-charcoal-mute">{a.type}</span>
                    </div>
                    <span className="text-[10.5px] text-charcoal-mute">{timeAgo(a.createdAt)}</span>
                  </div>
                  <div className="text-[12.5px] font-medium text-charcoal leading-snug mt-2">{a.title}</div>
                  <div className="text-[11px] text-charcoal-mute mt-1 leading-snug">{a.context}</div>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      {a.related?.map((r) => (
                        <span key={r} className="font-mono text-[10.5px] text-charcoal-soft bg-cream-deep border border-bordersoft px-1.5 py-0.5 rounded">{r}</span>
                      ))}
                    </div>
                    {col !== 'completed' && (
                      <button
                        onClick={() => advance(a.id)}
                        className="text-[11px] text-calm-violet hover:underline font-medium"
                      >
                        Advance
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {grouped[col].length === 0 && (
                <div className="text-[11px] text-charcoal-mute p-3 text-center italic">No items</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <section>
        <Card title="Action history" subtitle="Recent decisions for the audit trail" padding="md">
          <table className="tbl mt-2">
            <thead>
              <tr>
                <th>Title</th>
                <th className="w-[140px]">Type</th>
                <th className="w-[100px]">Owner</th>
                <th className="w-[110px]">Status</th>
                <th className="w-[100px]">When</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td className="text-[12.5px] text-charcoal font-medium">{a.title}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span className={clsx('w-1.5 h-1.5 rounded-full', TYPE_ACCENT[a.type])} />
                      <span className="text-[11.5px] text-charcoal-soft">{a.type}</span>
                    </div>
                  </td>
                  <td className="text-[11.5px] text-charcoal-soft">{a.owner}</td>
                  <td className="text-[11.5px] text-charcoal-mute capitalize">{a.status.replace('-', ' ')}</td>
                  <td className="text-[11.5px] text-charcoal-mute tabular-nums">{timeAgo(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </motion.div>
  );
}
