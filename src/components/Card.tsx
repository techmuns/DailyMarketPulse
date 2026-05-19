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
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'cream' | 'deep';
}

export function Card({
  children,
  className,
  hover,
  onClick,
  strip,
  title,
  subtitle,
  right,
  bare,
  padding = 'md',
  variant = 'cream',
}: Props) {
  const Comp = onClick ? motion.button : motion.div;
  const pad = padding === 'lg' ? 'p-6' : padding === 'sm' ? 'p-4' : 'p-5';
  const head = padding === 'lg' ? 'px-6 pt-6 pb-2' : padding === 'sm' ? 'px-4 pt-4 pb-2' : 'px-5 pt-5 pb-2';
  const body = padding === 'lg' ? 'px-6 pb-6' : padding === 'sm' ? 'px-4 pb-4' : 'px-5 pb-5';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      whileHover={hover || onClick ? { y: -1 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={clsx(
        bare ? '' : variant === 'deep' ? 'card-deep' : 'card',
        (hover || onClick) && 'card-hover cursor-pointer text-left',
        'block w-full',
        className
      )}
    >
      {(strip || title || right) ? (
        <>
          <div className={clsx('flex items-start justify-between gap-3', head)}>
            <div className="flex flex-col gap-1.5 min-w-0">
              {strip && <ChangeStripChip value={strip} />}
              {title && <h3 className="text-[14.5px] font-semibold text-charcoal leading-snug truncate">{title}</h3>}
              {subtitle && <p className="text-[12px] text-charcoal-mute leading-snug">{subtitle}</p>}
            </div>
            {right && <div className="shrink-0">{right}</div>}
          </div>
          <div className={body}>{children}</div>
        </>
      ) : (
        <div className={pad}>{children}</div>
      )}
    </Comp>
  );
}
