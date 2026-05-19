import { motion } from 'framer-motion';
import { SectionHeader } from '../components/SectionHeader';
import { ChangeStripChip, SignalChip, SourceChip } from '../components/Chip';
import { news, filings } from '../data/news';
import { aiSignals } from '../data/signals';
import { useStore } from '../state/store';
import type { NewsItem, Filing } from '../types';

export function NewsFilings() {
  const portfolioN = news.filter((n) => n.scope === 'portfolio');
  const watchlistN = news.filter((n) => n.scope === 'watchlist');
  const broaderN = news.filter((n) => n.scope === 'broader');

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-7">
      <header>
        <h1 className="font-display text-[28px] text-charcoal">News & Filings</h1>
        <p className="text-[13px] text-charcoal-mute mt-1">Ranked by relevance to your book. Every item shows "Why shown" and a source label.</p>
      </header>

      <section>
        <SectionHeader title="Portfolio news" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolioN.map((n) => <NewsCard key={n.id} item={n} />)}
        </div>
      </section>

      <section>
        <SectionHeader title="Watchlist news" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {watchlistN.map((n) => <NewsCard key={n.id} item={n} />)}
        </div>
      </section>

      <section>
        <SectionHeader title="Official filings" hint="BSE/NSE intimations, management changes, results updates." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filings.map((f) => <FilingCard key={f.id} item={f} />)}
        </div>
      </section>

      <section>
        <SectionHeader title="Broader market" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {broaderN.map((n) => <NewsCard key={n.id} item={n} />)}
        </div>
      </section>
    </motion.div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const { openDrawer } = useStore();
  return (
    <button
      onClick={() => openDrawer(aiSignals[1])}
      className="card card-hover text-left p-4 w-full"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <ChangeStripChip value={item.changeStrip} />
            <SourceChip value={item.source} />
            <span className="chip bg-ivory-100 text-charcoal-soft border border-bordersoft">{item.scope}</span>
          </div>
          <div className="text-[14.5px] font-semibold text-charcoal leading-snug">{item.title}</div>
          <div className="text-[12.5px] text-charcoal-soft mt-1 leading-snug">{item.summary}</div>
        </div>
        <SignalChip value={item.signal} />
      </div>
      <div className="text-[11.5px] text-charcoal-mute mt-2 leading-snug">
        Why shown · {item.whyShown}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap mt-2">
        {item.affected.slice(0, 4).map((a) => (
          <span key={a} className="chip bg-calm-navy-bg text-calm-navy border border-calm-navy/20">{a}</span>
        ))}
      </div>
    </button>
  );
}

function FilingCard({ item }: { item: Filing }) {
  const { openDrawer } = useStore();
  return (
    <button
      onClick={() => openDrawer(aiSignals[1])}
      className="card card-hover text-left p-4 w-full"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <ChangeStripChip value={item.changeStrip} />
            <SourceChip value={item.source} />
            <span className="chip bg-ivory-100 text-charcoal-soft border border-bordersoft">{item.filingType}</span>
          </div>
          <div className="text-[14.5px] font-semibold text-charcoal leading-snug">{item.title}</div>
          <div className="text-[12.5px] text-charcoal-soft mt-1 leading-snug">{item.summary}</div>
        </div>
        <SignalChip value={item.signal} />
      </div>
      <div className="text-[11.5px] text-charcoal-mute mt-2">Why shown · {item.whyShown}</div>
    </button>
  );
}
