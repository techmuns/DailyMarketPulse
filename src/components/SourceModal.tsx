// Small confirmation popup shown before sending the reader to an
// external source. Opened via store.openSource({ title, url, source? }).
// Surfaces where the link goes (host) and asks before redirecting,
// instead of silently opening a new tab.

import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../state/store';

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'the source';
  }
}

export function SourceModal() {
  const { sourceConfirm: target, closeSource } = useStore();
  const host = target ? target.source ?? hostOf(target.url) : '';

  const go = () => {
    if (target) window.open(target.url, '_blank', 'noopener,noreferrer');
    closeSource();
  };

  return (
    <AnimatePresence>
      {target && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-charcoal/30 backdrop-blur-[3px] z-[60]"
            onClick={closeSource}
          />
          <motion.div
            key="box"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed left-1/2 top-1/2 z-[61] w-[min(92vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-bordersoft bg-cream shadow-lift p-5"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative inline-flex w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-calm-emerald opacity-60 animate-ping" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-calm-emerald" />
              </span>
              <span className="label-mute">Open source</span>
            </div>
            <h3 className="font-display text-[15px] font-semibold text-charcoal leading-snug">{target.title}</h3>
            <p className="mt-2 text-[12.5px] text-charcoal-soft leading-relaxed">
              This opens the original story on{' '}
              <span className="font-medium text-charcoal">{host}</span> in a new tab. Continue?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={closeSource}
                className="px-3.5 py-2 rounded-full text-[12.5px] font-medium text-charcoal-mute hover:text-charcoal hover:bg-ivory-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={go}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12.5px] font-semibold bg-calm-emerald text-white hover:bg-[#0CA67F] transition shadow-soft"
              >
                Open source
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
