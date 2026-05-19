import type { ReactNode } from 'react';

export function SectionHeader({
  title,
  hint,
  right,
  eyebrow,
}: {
  title: string;
  hint?: string;
  right?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3.5">
      <div>
        {eyebrow && <div className="label-mute mb-1.5">{eyebrow}</div>}
        <h2 className="h-display text-[18px] font-semibold leading-tight">{title}</h2>
        {hint && <p className="text-[12px] text-charcoal-mute mt-1.5">{hint}</p>}
      </div>
      {right}
    </div>
  );
}
