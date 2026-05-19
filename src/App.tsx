import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TopNav } from './components/TopNav';
import type { TabKey } from './components/TopNav';
import { AISignalDrawer } from './components/AISignalDrawer';
import { StoreProvider } from './state/store';
import { Today } from './tabs/Today';
import { Macro } from './tabs/Macro';
import { Markets } from './tabs/Markets';
import { Currency } from './tabs/Currency';
import { Commodities } from './tabs/Commodities';
import { NewsFilings } from './tabs/NewsFilings';
import { Portfolio } from './tabs/Portfolio';
import { Watchlist } from './tabs/Watchlist';
import { Events } from './tabs/Events';
import { Actions } from './tabs/Actions';

function renderTab(tab: TabKey) {
  switch (tab) {
    case 'Today': return <Today />;
    case 'Macro': return <Macro />;
    case 'Markets': return <Markets />;
    case 'Currency': return <Currency />;
    case 'Commodities': return <Commodities />;
    case 'News & Filings': return <NewsFilings />;
    case 'Portfolio': return <Portfolio />;
    case 'Watchlist': return <Watchlist />;
    case 'Events': return <Events />;
    case 'Actions': return <Actions />;
  }
}

function App() {
  const [tab, setTab] = useState<TabKey>('Today');
  return (
    <StoreProvider>
      <div className="min-h-screen text-charcoal">
        <TopNav active={tab} onChange={setTab} />
        <main className="max-w-[1320px] mx-auto px-6 py-10">
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
          Daily Market Pulse · Calm Alpha · Mock data
        </footer>
        <AISignalDrawer />
      </div>
    </StoreProvider>
  );
}

export default App;
