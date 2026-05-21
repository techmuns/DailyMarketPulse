// Live news wire — renders headlines fetched from moneycontrol.com via
// scripts/fetch-moneycontrol.mjs (committed as public/data/moneycontrol.json
// by the refresh-moneycontrol GitHub workflow).
//
// Pure presentational; consumes useLiveHeadlines(keywords?) so the same
// component can render the global feed, currency-filtered feed, sectoral
// feed, etc. Falls back to a muted "feed unavailable" state when no
// live data is loaded, instead of fake content.

import { useLiveHeadlines, LiveHeadlinesChip } from '../state/liveData';
import { SectionHeader } from './SectionHeader';

interface Props {
  title: string;
  eyebrow?: string;
  hint?: string;
  keywords?: string[];
  limit?: number;
}

export function LiveWire({ title, eyebrow = 'Live wire', hint, keywords, limit = 6 }: Props) {
  const state = useLiveHeadlines(keywords);
  const items = state.items.slice(0, limit);

  // Silent-hide when there's nothing live to show. The section only
  // appears once the moneycontrol pipeline produces a payload AND that
  // payload has at least one item matching the (optional) keyword
  // filter. Avoids a permanent "headlines unavailable" empty state
  // when the workflow hasn't been wired up yet.
  if (state.kind !== 'live' && state.kind !== 'delayed') return null;
  if (items.length === 0) return null;

  return (
    <section>
      <SectionHeader
        title={title}
        eyebrow={eyebrow}
        hint={hint}
        right={<LiveHeadlinesChip state={state} />}
      />
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((n) => (
          <li key={n.url}>
            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl border border-bordersoft/70 bg-cream shadow-soft hover:shadow-lift transition-shadow px-4 py-3 h-full"
            >
              <div className="flex items-start gap-3">
                <span className="relative inline-flex w-1.5 h-1.5 mt-1.5 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-calm-emerald opacity-60 animate-ping" />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-calm-emerald" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[13.5px] font-medium text-charcoal leading-snug line-clamp-3 group-hover:text-calm-emerald transition-colors">
                    {n.title}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-charcoal-mute tracking-wide">
                    <span>MoneyControl</span>
                    {n.publishedAt && (
                      <>
                        <span className="text-charcoal-mute/40">·</span>
                        <span className="truncate">{n.publishedAt}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
