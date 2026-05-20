import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import logoUrl from '../assets/logos/munshot-logo-w.png';

export type TabKey =
  | 'Today'
  | 'Macro'
  | 'Markets'
  | 'Currency'
  | 'Commodities'
  | 'News & Filings'
  | 'Portfolio Management'
  | 'Events';

interface Props {
  active: TabKey;
  onChange: (t: TabKey) => void;
}

export function MunshotMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span
      className={clsx('shrink-0 inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-label="Munshot"
    >
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        className="block w-full h-full object-contain select-none pointer-events-none"
        style={{ mixBlendMode: 'multiply' }}
        draggable={false}
      />
    </span>
  );
}

// Light-weight inline icons (no extra dep). Stroke-based so they pick
// up the surrounding text colour cleanly.
type IconProps = { className?: string };
const Icon = ({ className, children }: IconProps & { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={clsx('shrink-0 w-[15px] h-[15px]', className)}
    aria-hidden
  >
    {children}
  </svg>
);

const Icons = {
  Today: (p: IconProps) => (
    <Icon {...p}>
      <path d="M3 12h3l2-7 4 14 2-7 2 3h5" />
    </Icon>
  ),
  Macro: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </Icon>
  ),
  Markets: (p: IconProps) => (
    <Icon {...p}>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 15l3-4 3 3 5-7" />
    </Icon>
  ),
  Currency: (p: IconProps) => (
    <Icon {...p}>
      <path d="M16 7H9.5a2.5 2.5 0 1 0 0 5h5a2.5 2.5 0 1 1 0 5H7" />
      <path d="M12 3v18" />
    </Icon>
  ),
  Commodities: (p: IconProps) => (
    <Icon {...p}>
      <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
      <path d="M3 8l9 5 9-5M12 13v9" />
    </Icon>
  ),
  News: (p: IconProps) => (
    <Icon {...p}>
      <path d="M4 5h13a2 2 0 0 1 2 2v11a2 2 0 0 0 2 2H7a3 3 0 0 1-3-3z" />
      <path d="M8 9h7M8 13h7M8 17h4" />
    </Icon>
  ),
  Portfolio: (p: IconProps) => (
    <Icon {...p}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </Icon>
  ),
  Events: (p: IconProps) => (
    <Icon {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </Icon>
  ),
  Menu: (p: IconProps) => (
    <Icon {...p}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Icon>
  ),
  Close: (p: IconProps) => (
    <Icon {...p}>
      <path d="M6 6l12 12M6 18L18 6" />
    </Icon>
  ),
};

const ITEMS: { key: TabKey; label: string; Icon: React.FC<IconProps> }[] = [
  { key: 'Today', label: 'Today', Icon: Icons.Today },
  { key: 'Macro', label: 'Macro', Icon: Icons.Macro },
  { key: 'Markets', label: 'Markets', Icon: Icons.Markets },
  { key: 'Currency', label: 'Currency', Icon: Icons.Currency },
  { key: 'Commodities', label: 'Commodities', Icon: Icons.Commodities },
  { key: 'News & Filings', label: 'News & Filings', Icon: Icons.News },
  { key: 'Portfolio Management', label: 'Portfolio', Icon: Icons.Portfolio },
  { key: 'Events', label: 'Events', Icon: Icons.Events },
];

const CAPSULE_GLASS_STYLE: React.CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.78), rgba(240,235,255,0.66), rgba(238,232,247,0.58))',
  borderColor: 'rgba(221,214,232,0.75)',
  boxShadow:
    '0 1px 0 rgba(255,255,255,0.85) inset, 0 18px 50px rgba(72,55,120,0.14)',
};

function Brand() {
  return (
    <div className="flex items-center gap-2 pl-0.5">
      <MunshotMark size={28} />
      <div className="leading-none min-w-0">
        <div className="font-masthead text-[11.5px] font-bold tracking-tight truncate">Daily Market Pulse</div>
        <div className="text-[8.5px] text-charcoal-mute mt-1 tracking-[0.22em] uppercase font-semibold">By Munshot</div>
      </div>
    </div>
  );
}

function StatusBadge() {
  return (
    <span className="inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full bg-calm-emerald-bg text-calm-emerald text-[9.5px] font-medium tracking-wide w-full">
      <span className="w-1 h-1 rounded-full bg-calm-emerald inline-block" />
      Live · mock
    </span>
  );
}

// Slim variant used inside the hover-reveal desktop capsule — just a
// pulsing dot + tiny label, no chip background.
function StatusDot() {
  return (
    <span className="inline-flex items-center justify-center gap-1.5 text-[9px] tracking-[0.18em] uppercase font-semibold text-charcoal-mute">
      <span className="relative inline-flex w-1.5 h-1.5">
        <span className="absolute inset-0 rounded-full bg-calm-emerald opacity-60 animate-ping" />
        <span className="relative w-1.5 h-1.5 rounded-full bg-calm-emerald" />
      </span>
      Live
    </span>
  );
}

/** Fixed top-left brand chrome, separate from the hover capsule. */
export function DesktopBrand() {
  return (
    <div className="hidden md:flex fixed top-5 left-6 z-40 items-center gap-2 select-none">
      <MunshotMark size={30} />
      <div className="leading-none">
        <div className="font-masthead text-[13px] font-bold tracking-tight">Daily Market Pulse</div>
        <div className="text-[9px] text-charcoal-mute mt-1 tracking-[0.22em] uppercase font-semibold">By Munshot</div>
      </div>
    </div>
  );
}

function NavList({
  active,
  onChange,
  layoutScope,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  layoutScope: string;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {ITEMS.map(({ key, label, Icon: ItemIcon }) => {
        const isActive = key === active;
        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => onChange(key)}
              className={clsx(
                'relative w-full flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[12px] transition',
                isActive
                  ? 'text-calm-emerald font-semibold'
                  : 'text-charcoal-mute hover:text-charcoal-soft hover:bg-cream/55'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={`sidenav-${layoutScope}`}
                  className="absolute inset-0 rounded-full bg-gradient-to-b from-calm-emerald-bg to-[#D9F1E6] ring-1 ring-calm-emerald/15 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_2px_6px_-2px_rgba(15,143,111,0.25)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <ItemIcon className="relative z-10 w-[14px] h-[14px]" />
              <span className="relative z-10 truncate">{label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function SideNav({ active, onChange }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  // Desktop hover-reveal state. A small grace period on mouseleave
  // lets the cursor cross the gap between trigger strip and capsule
  // without closing.
  const [hoverOpen, setHoverOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setHoverOpen(false), 140);
  };
  useEffect(() => cancelClose, []);

  return (
    <>
      {/* Mobile top capsule */}
      <div className="md:hidden sticky top-0 z-30 pt-3 px-3 pb-2 bg-gradient-to-b from-ivory-50/90 via-ivory-50/70 to-transparent backdrop-blur-sm">
        <div
          className="flex items-center justify-between gap-3 h-[58px] pl-3 pr-2 rounded-full border backdrop-blur-[18px]"
          style={CAPSULE_GLASS_STYLE}
        >
          <Brand />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full text-charcoal-soft hover:text-charcoal hover:bg-cream/60 transition"
          >
            <Icons.Menu />
          </button>
        </div>
      </div>

      {/* Desktop hover-reveal: thin trigger strip pinned to the left
          edge, plus the floating capsule that slides in from off-screen
          when the strip or the capsule itself is hovered. The strip
          starts below the brand chrome so it doesn't fight with the
          top-left brand. */}
      <div
        aria-hidden
        className="hidden md:block fixed left-0 top-[68px] bottom-0 w-[18px] z-30"
        onMouseEnter={() => {
          cancelClose();
          setHoverOpen(true);
        }}
        onMouseLeave={scheduleClose}
      />

      <motion.aside
        initial={false}
        animate={{ x: hoverOpen ? 22 : -126 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onMouseEnter={() => {
          cancelClose();
          setHoverOpen(true);
        }}
        onMouseLeave={scheduleClose}
        className="hidden md:flex fixed left-0 top-1/2 z-30 w-[144px] flex-col gap-2.5 p-3 rounded-[40px] border backdrop-blur-[18px] max-h-[70vh]"
        style={{ ...CAPSULE_GLASS_STYLE, y: '-50%' }}
        aria-label="Primary navigation"
      >
        <nav className="flex-1 min-h-0 overflow-y-auto no-scrollbar -mx-1 px-1">
          <NavList active={active} onChange={onChange} layoutScope="desktop" />
        </nav>
        <StatusDot />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-charcoal/25 backdrop-blur-[2px] z-40 md:hidden"
              onClick={close}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -240, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -240, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed left-3 top-3 bottom-3 z-50 w-[230px] flex flex-col gap-4 p-4 rounded-[28px] border backdrop-blur-[18px] md:hidden"
              style={CAPSULE_GLASS_STYLE}
            >
              <div className="flex items-center justify-between gap-2">
                <Brand />
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close navigation"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-charcoal-mute hover:text-charcoal hover:bg-cream/60 transition"
                >
                  <Icons.Close />
                </button>
              </div>
              <div className="h-px bg-bordersoft/60" />
              <nav className="flex-1 min-h-0 overflow-y-auto no-scrollbar -mx-1 px-1">
                <NavList
                  active={active}
                  onChange={(t) => {
                    onChange(t);
                    close();
                  }}
                  layoutScope="mobile"
                />
              </nav>
              <StatusBadge />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
