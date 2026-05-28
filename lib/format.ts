import type { Lang } from '@/lib/i18n/dictionary';

/**
 * BBB CRM is an IDR-only product (its users run Indonesian small businesses),
 * regardless of UI language. Lang only affects the thousands-separator locale.
 */
export function formatAmount(n: number, lang: Lang) {
  return new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}
