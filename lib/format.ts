import type { Lang } from '@/lib/i18n/dictionary';

export function formatAmount(n: number, lang: Lang) {
  return new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: lang === 'id' ? 'IDR' : 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}
