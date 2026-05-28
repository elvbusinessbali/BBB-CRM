'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  getCustomers,
  getInteractionTotalsPerCustomer,
  type Customer,
} from '@/lib/supabase/queries';
import { STATUSES, STATUS_META, isStatus, type Status } from '@/lib/status';
import { formatAmount } from '@/lib/format';
import { useT } from '@/lib/i18n/LanguageProvider';
import { AppHeader } from '@/components/AppHeader';
import { StatusPill } from '@/components/StatusPill';

export default function CustomersPage() {
  const { t, lang } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const activeStatus: Status | 'all' = statusParam && isStatus(statusParam) ? statusParam : 'all';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totals, setTotals] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const [list, t] = await Promise.all([
          getCustomers(supabase),
          getInteractionTotalsPerCustomer(supabase),
        ]);
        setCustomers(list);
        setTotals(t);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = customers;
    if (activeStatus !== 'all') list = list.filter((c) => c.status === activeStatus);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          (c.phone ?? '').toLowerCase().includes(needle) ||
          (c.email ?? '').toLowerCase().includes(needle)
      );
    }
    return list;
  }, [customers, q, activeStatus]);

  function setStatus(s: Status | 'all') {
    const url = s === 'all' ? '/customers' : `/customers?status=${s}`;
    router.replace(url);
  }

  return (
    <>
      <AppHeader title={t('customers')} />
      <main className="px-4 py-4 flex flex-col gap-4">
        <div className="-mx-4 px-4 overflow-x-auto">
          <div className="flex gap-1.5 w-max">
            <Chip active={activeStatus === 'all'} onClick={() => setStatus('all')}>
              {t('allStatuses')}
            </Chip>
            {STATUSES.map((s) => (
              <Chip key={s} active={activeStatus === s} onClick={() => setStatus(s)}>
                {t(STATUS_META[s].tKey)}
              </Chip>
            ))}
          </div>
        </div>

        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full border border-neutral-200 bg-white rounded-xl px-3.5 py-3 text-base outline-none focus:border-neutral-900"
        />

        {loading ? (
          <p className="text-neutral-500 text-center py-12">{t('loading')}</p>
        ) : customers.length === 0 ? (
          <div className="text-center text-neutral-500 py-12 px-6">
            <p>{t('noCustomersYet')}</p>
            <Link href="/customers/new" className="inline-block mt-4 rounded-full bg-neutral-900 text-white px-4 py-2 text-sm">
              + {t('addCustomer')}
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">{t('noResults')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((c) => {
              const ltv = totals.get(c.id) ?? 0;
              return (
                <li key={c.id}>
                  <Link
                    href={`/customers/${c.id}`}
                    className="flex items-center gap-3 bg-white border border-neutral-200 rounded-2xl px-4 py-3 hover:bg-neutral-50"
                  >
                    <Avatar name={c.name} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{c.name}</p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        {c.phone && <span className="truncate">{c.phone}</span>}
                        {ltv > 0 && <span className="tabular-nums">· {formatAmount(ltv, lang)}</span>}
                      </div>
                    </div>
                    <StatusPill status={c.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs rounded-full px-3 py-1.5 border whitespace-nowrap ${
        active
          ? 'bg-neutral-900 text-white border-neutral-900'
          : 'bg-white text-neutral-700 border-neutral-200'
      }`}
    >
      {children}
    </button>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <div className="h-10 w-10 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center text-sm font-semibold shrink-0">
      {initials || '?'}
    </div>
  );
}
