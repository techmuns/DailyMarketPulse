import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import logoUrl from '../assets/logos/munshot-logo-w.png';
import { useDataState } from '../state/liveData';
import type { DataState } from '../state/liveData';

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
type IconProps = { className?: string; style?: React.CSSProperties };
const Icon = ({ className, style, children }: IconProps & { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={clsx('shrink-0 w-[15px] h-[15px]', className)}
    style={style}
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

// Per-section icon hues used when an item is inactive. Active items
// fold into the emerald active pill (white-on-emerald).
const ITEMS: { key: TabKey; label: string; Icon: React.FC<IconProps>; color: string }[] = [
  { key: 'Today', label: 'Today', Icon: Icons.Today, color: '#0F8F6F' },
  { key: 'Macro', label: 'Macro', Icon: Icons.Macro, color: '#8C79C9' },
  { key: 'Markets', label: 'Markets', Icon: Icons.Markets, color: '#3F6E9A' },
  { key: 'Currency', label: 'Currency', Icon: Icons.Currency, color: '#159A86' },
  { key: 'Commodities', label: 'Commodities', Icon: Icons.Commodities, color: '#D7A14A' },
  { key: 'News & Filings', label: 'News & Filings', Icon: Icons.News, color: '#C86B6B' },
  { key: 'Portfolio Management', label: 'Portfolio', Icon: Icons.Portfolio, color: '#18A77B' },
  { key: 'Events', label: 'Events', Icon: Icons.Events, color: '#8C79C9' },
];

const CAPSULE_GLASS_STYLE: React.CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(245,240,255,0.92), rgba(238,231,252,0.86), rgba(232,247,239,0.50))',
  borderColor: 'rgba(140,121,201,0.28)',
  boxShadow:
    '0 1px 0 rgba(255,255,255,0.85) inset, 0 20px 55px rgba(72,55,120,0.18)',
};

function Brand() {
  return (
    <div className="flex items-center gap-2.5 pl-0.5">
      <MunshotMark size={32} />
      <div className="leading-none min-w-0">
        <div className="font-masthead text-[13px] font-bold tracking-tight text-charcoal truncate">Daily Market Pulse</div>
        <div className="text-[8.5px] text-charcoal-mute mt-1.5 tracking-[0.22em] uppercase font-semibold">By Munshot</div>
      </div>
    </div>
  );
}

// Visual treatment per data state, shared by both badge variants. Driven
// by the real live feed (see useDataState) so the badge reports the
// actual state instead of a hardcoded label.
const STATUS_VIEW: Record<
  DataState,
  { label: string; chip: string; pill: string; dot: string; ping: boolean }
> = {
  live: {
    label: 'Live',
    chip: 'bg-calm-emerald-bg text-calm-emerald',
    pill: 'bg-calm-emerald-bg/70 ring-1 ring-calm-emerald/20 text-calm-emerald',
    dot: 'bg-calm-emerald',
    ping: true,
  },
  delayed: {
    label: 'Delayed',
    chip: 'bg-calm-amber-bg text-calm-amber',
    pill: 'bg-calm-amber-bg/70 ring-1 ring-calm-amber/25 text-calm-amber',
    dot: 'bg-calm-amber',
    ping: false,
  },
  mock: {
    label: 'Mock',
    chip: 'bg-cream-deep text-charcoal-mute',
    pill: 'bg-cream-deep ring-1 ring-bordersoft text-charcoal-mute',
    dot: 'bg-charcoal-mute/60',
    ping: false,
  },
  unavailable: {
    label: 'Offline',
    chip: 'bg-cream-deep text-charcoal-mute',
    pill: 'bg-cream-deep ring-1 ring-bordersoft text-charcoal-mute',
    dot: 'bg-charcoal-mute/60',
    ping: false,
  },
};

function StatusBadge() {
  const { state } = useDataState();
  const v = STATUS_VIEW[state];
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-medium tracking-wide w-full',
        v.chip
      )}
    >
      <span className={clsx('w-1 h-1 rounded-full inline-block', v.dot)} />
      {v.label}
    </span>
  );
}

// Slim variant used inside the hover-reveal desktop capsule — just a
// pulsing dot + tiny label, no chip background.
function StatusDot() {
  const { state } = useDataState();
  const v = STATUS_VIEW[state];
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] tracking-[0.18em] uppercase font-semibold w-fit mx-auto',
        v.pill
      )}
    >
      <span className="relative inline-flex w-1.5 h-1.5">
        {v.ping && (
          <span className={clsx('absolute inset-0 rounded-full opacity-60 animate-ping', v.dot)} />
        )}
        <span className={clsx('relative w-1.5 h-1.5 rounded-full', v.dot)} />
      </span>
      {v.label}
    </span>
  );
}

/**
 * Visible emerald→lavender hover handle that tells the user where to
 * hover when the nav capsule is hidden. Becomes transparent (but stays
 * mounted) while the capsule is open so it doesn't compete visually,
 * and is wrapped in a wider invisible trigger zone so the cursor can
 * cross from the handle to the capsule without entering a dead gap.
 */
function HoverHandle({ open }: { open: boolean }) {
  return (
    <motion.div
      aria-hidden
      initial={false}
      animate={{ opacity: open ? 0 : 1 }}
      transition={{ duration: 0.2 }}
      className="absolute left-3 top-1/2 -translate-y-1/2 w-[12px] h-[150px] rounded-full pointer-events-none"
      style={{
        background: 'linear-gradient(180deg, #0F8F6F 0%, #8C79C9 100%)',
        boxShadow:
          '0 0 22px rgba(15,143,111,0.30), 0 6px 18px rgba(140,121,201,0.30), 0 1px 0 rgba(255,255,255,0.55) inset',
      }}
    />
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
    <ul className="flex flex-col gap-1.5">
      {ITEMS.map(({ key, label, Icon: ItemIcon, color }) => {
        const isActive = key === active;
        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => onChange(key)}
              className={clsx(
                'group relative w-full flex items-center gap-2.5 h-10 px-3 rounded-full text-[13px] transition',
                isActive
                  ? 'text-white font-semibold'
                  : 'text-charcoal-soft font-medium hover:bg-cream/55'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={`sidenav-${layoutScope}`}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #0F8F6F 0%, #18A77B 100%)',
                    boxShadow:
                      '0 8px 22px rgba(15,143,111,0.28), 0 1px 0 rgba(255,255,255,0.18) inset',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <ItemIcon
                className="relative z-10 w-[17px] h-[17px] transition-opacity"
                style={{
                  color: isActive ? '#FFFFFF' : color,
                  opacity: isActive ? 1 : 0.78,
                }}
              />
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

      {/* Desktop hover-reveal. Outer wrapper is pointer-events-none so
          dashboard content underneath stays clickable; the trigger zone
          + capsule re-enable pointer events on themselves. The trigger
          zone hosts the visible handle and extends a bit past the
          handle so the cursor never falls into a dead gap when the
          capsule slides in. */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 w-[220px] z-30 pointer-events-none">
        <div
          className="absolute left-0 top-0 bottom-0 w-[32px] pointer-events-auto"
          onMouseEnter={() => {
            cancelClose();
            setHoverOpen(true);
          }}
          onMouseLeave={scheduleClose}
        >
          <HoverHandle open={hoverOpen} />
        </div>

        <motion.aside
          initial={false}
          animate={{ x: hoverOpen ? 20 : -180 }}
          transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          onMouseEnter={() => {
            cancelClose();
            setHoverOpen(true);
          }}
          onMouseLeave={scheduleClose}
          className="absolute left-0 top-1/2 w-[184px] flex flex-col gap-3.5 pt-[18px] pb-[14px] px-[14px] rounded-[48px] border backdrop-blur-[18px] pointer-events-auto h-[min(76vh,640px)] min-h-[560px] max-h-[calc(100vh-3rem)]"
          style={{ ...CAPSULE_GLASS_STYLE, y: '-50%' }}
          aria-label="Primary navigation"
        >
          <Brand />
          <div className="h-px bg-gradient-to-r from-transparent via-calm-violet/25 to-transparent" />
          <nav className="flex-1 min-h-0 overflow-y-auto no-scrollbar -mx-1 px-1">
            <div className="text-[8.5px] tracking-[0.28em] uppercase font-semibold text-charcoal-mute/80 pl-3 mb-2 select-none">
              Market Desk
            </div>
            <NavList active={active} onChange={onChange} layoutScope="desktop" />
          </nav>
          <StatusDot />
        </motion.aside>
      </div>

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
