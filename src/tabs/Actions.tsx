import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
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

export function Actions() {
  const [items, setItems] = useState<ActionItem[]>(actions);

  const grouped = useMemo(() => {
    const m: Record<ActionItem['status'], ActionItem[]> = {
      open: [],
      'in-progress': [],
      reviewed: [],
      completed: [],
    };
    items.forEach((i) => m[i.status].push(i));
    return m;
  }, [items]);

  const advance = (id: string) => {
    setItems((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next: ActionItem['status'] =
          p.status === 'open'
            ? 'in-progress'
            : p.status === 'in-progress'
            ? 'reviewed'
            : p.status === 'reviewed'
            ? 'completed'
            : 'completed';
        return { ...p, status: next };
      })
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-7">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] text-charcoal">Actions</h1>
          <p className="text-[13px] text-charcoal-mute mt-1">Analyst task board — keep the daily flow clean.</p>
        </div>
        <div className="flex items-center gap-2">
          {(['Add to thesis', 'Assign follow-up', 'Read later', 'Mark noise', 'Escalate to PM'] as const).map((t) => (
            <button
              key={t}
              className="chip bg-white border border-bordersoft text-charcoal-soft hover:text-charcoal hover:border-calm-violet/40 hover:bg-calm-violet-bg/50 transition"
            >
              + {t}
            </button>
          ))}
        </div>
      </header>

      <SectionHeader title="Task board" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLS.map((col) => (
          <div key={col} className="bg-cream rounded-2xl border border-bordersoft p-3 min-h-[120px]">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="label-mute">{COL_LABEL[col]}</div>
              <div className="text-[11px] text-charcoal-mute">{grouped[col].length}</div>
            </div>
            <div className="space-y-2">
              {grouped[col].map((a) => (
                <div key={a.id} className="bg-white rounded-xl border border-bordersoft p-3 shadow-soft">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={clsx(
                        'chip border',
                        a.type === 'Add to thesis' && 'bg-calm-green-bg text-calm-green border-calm-green/30',
                        a.type === 'Assign follow-up' && 'bg-calm-navy-bg text-calm-navy border-calm-navy/30',
                        a.type === 'Read later' && 'bg-calm-amber-bg text-calm-amber border-calm-amber/30',
                        a.type === 'Mark noise' && 'bg-ivory-100 text-charcoal-mute border-bordersoft',
                        a.type === 'Escalate to PM' && 'bg-calm-rose-bg text-calm-rose border-calm-rose/30'
                      )}
                    >
                      {a.type}
                    </span>
                    <span className="text-[10.5px] text-charcoal-mute">{timeAgo(a.createdAt)}</span>
                  </div>
                  <div className="text-[13px] font-medium text-charcoal leading-snug mt-2">{a.title}</div>
                  <div className="text-[11.5px] text-charcoal-mute mt-1">{a.context}</div>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {a.related?.map((r) => (
                        <span key={r} className="chip bg-ivory-100 text-charcoal-soft border border-bordersoft">{r}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => advance(a.id)}
                      className="text-[11.5px] text-calm-violet hover:underline font-medium"
                    >
                      {col === 'completed' ? 'Done' : '→ Advance'}
                    </button>
                  </div>
                </div>
              ))}
              {grouped[col].length === 0 && (
                <div className="text-[11.5px] text-charcoal-mute p-3 text-center italic">No items</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <section>
        <SectionHeader title="Action history" hint="Recent decisions for the audit trail." />
        <Card>
          <ul className="divide-y divide-bordersoft">
            {items.map((a) => (
              <li key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] text-charcoal font-medium truncate">{a.title}</div>
                  <div className="text-[11.5px] text-charcoal-mute">{a.type} · {a.owner}</div>
                </div>
                <span className="chip bg-ivory-100 text-charcoal-soft border border-bordersoft capitalize">{a.status.replace('-', ' ')}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </motion.div>
  );
}
