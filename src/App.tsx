import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SideNav } from './components/SideNav';
import type { TabKey } from './components/SideNav';
import { AISignalDrawer } from './components/AISignalDrawer';
import { HeadlineDrawer } from './components/HeadlineDrawer';
import watermarkUrl from './assets/logos/munshot-logo.png';
import { StoreProvider } from './state/store';
import { LiveDataProvider } from './state/liveData';
import { Today } from './tabs/Today';
import { Macro } from './tabs/Macro';
import { Markets } from './tabs/Markets';
import { Currency } from './tabs/Currency';
import { Commodities } from './tabs/Commodities';
import { NewsFilings } from './tabs/NewsFilings';
import { Book } from './tabs/Book';
import { Events } from './tabs/Events';

function renderTab(tab: TabKey) {
  switch (tab) {
    case 'Today': return <Today />;
    case 'Macro': return <Macro />;
    case 'Markets': return <Markets />;
    case 'Currency': return <Currency />;
    case 'Commodities': return <Commodities />;
    case 'News & Filings': return <NewsFilings />;
    case 'Portfolio Management': return <Book />;
    case 'Events': return <Events />;
  }
}

function App() {
  const [tab, setTab] = useState<TabKey>('Today');

  // Whenever the active tab changes, return the page to the top so the
  // new tab opens at its masthead instead of mid-scroll.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tab]);

  return (
    <LiveDataProvider>
    <StoreProvider>
      <div className="min-h-screen text-charcoal">
        <SideNav active={tab} onChange={setTab} />
        <main className="max-w-[1320px] mx-auto px-6 pt-3 pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
            >
              {renderTab(tab)}
            </motion.div>
          </AnimatePresence>
        </main>
        <footer className="max-w-[1320px] mx-auto px-6 pb-10 pt-4 text-[10.5px] text-charcoal-mute tracking-wider uppercase border-t border-bordersoft/60 mt-10">
          Daily Market Pulse · By Munshot · Mock data
        </footer>
        <AISignalDrawer />
        <HeadlineDrawer />
        <div
          aria-hidden
          className="pointer-events-none fixed bottom-5 right-5 z-10 hidden sm:flex items-center gap-2.5 pl-2 pr-3.5 py-2 rounded-full bg-cream/70 backdrop-blur-md ring-1 ring-bordersoft/60 shadow-soft"
        >
          <img
            src={watermarkUrl}
            alt=""
            width={32}
            height={32}
            className="block rounded-lg opacity-90"
            draggable={false}
          />
          <span className="text-[9.5px] tracking-[0.22em] uppercase font-semibold text-charcoal-mute">
            Munshot
          </span>
        </div>
      </div>
    </StoreProvider>
    </LiveDataProvider>
  );
}

export default App;
