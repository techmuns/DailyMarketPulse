import type { ReactNode } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { ChangeStripChip } from './Chip';
import type { ChangeStrip } from '../types';

interface Props {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  strip?: ChangeStrip;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  bare?: boolean;
}

export function Card({ children, className, hover, onClick, strip, title, subtitle, right, bare }: Props) {
  const Comp = onClick ? motion.button : motion.div;
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      whileHover={hover || onClick ? { y: -1 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={clsx(
        bare ? '' : 'card',
        (hover || onClick) && 'card-hover cursor-pointer text-left',
        'block w-full',
        className
      )}
    >
      {(strip || title || right) && (
        <div className="flex items-start justify-between gap-3 p-4 pb-2">
          <div className="flex flex-col gap-1.5 min-w-0">
            {strip && <ChangeStripChip value={strip} />}
            {title && <h3 className="text-[15px] font-semibold text-charcoal leading-snug truncate">{title}</h3>}
            {subtitle && <p className="text-[12.5px] text-charcoal-mute leading-snug">{subtitle}</p>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      )}
      <div className={clsx((strip || title || right) ? 'p-4 pt-1' : 'p-4')}>{children}</div>
    </Comp>
  );
}
