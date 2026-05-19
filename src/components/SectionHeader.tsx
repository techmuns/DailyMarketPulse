import type { ReactNode } from 'react';

export function SectionHeader({
  title,
  hint,
  right,
}: {
  title: string;
  hint?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        <h2 className="font-display text-[20px] text-charcoal leading-none">{title}</h2>
        {hint && <p className="text-[12.5px] text-charcoal-mute mt-1.5">{hint}</p>}
      </div>
      {right}
    </div>
  );
}
