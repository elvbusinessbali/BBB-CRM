import type { DictKey } from '@/lib/i18n/dictionary';

export const STATUSES = ['cold', 'warm', 'hot', 'deal_done', 'paused'] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_META: Record<Status, { tKey: DictKey; bg: string; text: string; ring: string }> = {
  cold:      { tKey: 'statusCold',     bg: 'bg-sky-100',     text: 'text-sky-800',     ring: 'ring-sky-300' },
  warm:      { tKey: 'statusWarm',     bg: 'bg-amber-100',   text: 'text-amber-800',   ring: 'ring-amber-300' },
  hot:       { tKey: 'statusHot',      bg: 'bg-rose-100',    text: 'text-rose-800',    ring: 'ring-rose-300' },
  deal_done: { tKey: 'statusDealDone', bg: 'bg-emerald-100', text: 'text-emerald-800', ring: 'ring-emerald-300' },
  paused:    { tKey: 'statusPaused',   bg: 'bg-neutral-200', text: 'text-neutral-700', ring: 'ring-neutral-300' },
};

export function isStatus(v: string): v is Status {
  return (STATUSES as readonly string[]).includes(v);
}
