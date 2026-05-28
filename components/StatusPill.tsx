'use client';

import { STATUS_META, type Status } from '@/lib/status';
import { useT } from '@/lib/i18n/LanguageProvider';

export function StatusPill({ status, size = 'sm' }: { status: Status; size?: 'sm' | 'md' }) {
  const { t } = useT();
  const meta = STATUS_META[status];
  const sizeCls = size === 'md' ? 'text-sm px-2.5 py-1' : 'text-[11px] px-2 py-0.5';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${meta.bg} ${meta.text} ${sizeCls}`}>
      {t(meta.tKey)}
    </span>
  );
}
