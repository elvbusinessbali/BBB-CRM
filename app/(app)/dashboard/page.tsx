'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  getCustomers,
  getInteractionTotalsPerCustomer,
  getLastInteractionPerCustomer,
  getMyBusiness,
  fullName,
  type Customer,
} from '@/lib/supabase/queries';
import { STATUSES, STATUS_META } from '@/lib/status';
import { formatAmount } from '@/lib/format';
import { useT } from '@/lib/i18n/LanguageProvider';
import { AppHeader } from '@/components/AppHeader';
import { HelpButton } from '@/components/HelpButton';

export default function DashboardPage() {
  const { t, lang } = useT();
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [lastSeen, setLastSeen] = useState<Map<string, string>>(new Map());
  const [totals, setTotals] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const [biz, custs, last, sums] = await Promise.all([
          getMyBusiness(supabase),
          getCustomers(supabase),
          getLastInteractionPerCustomer(supabase),
          getInteractionTotalsPerCustomer(supabase),
        ]);
        setBusinessName(biz?.name ?? null);
        setCustomers(custs);
        setLastSeen(last);
        setTotals(sums);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = customers.length;
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  const dormant = customers.filter((c) => {
    const last = lastSeen.get(c.id);
    if (!last) return true;
    return now - new Date(last).getTime() > THIRTY_DAYS;
  }).length;

  const today = new Date();
  const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const birthdays = customers.filter((c) => c.birthday && c.birthday.slice(5, 10) === todayMD);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of STATUSES) counts[s] = 0;
    for (const c of customers) counts[c.status] = (counts[c.status] ?? 0) + 1;
    return counts;
  }, [customers]);

  const totalSpend = useMemo(() => {
    let s = 0;
    for (const v of totals.values()) s += v;
    return s;
  }, [totals]);

  return (
    <>
      <AppHeader />
      <main className="px-4 py-6 flex flex-col gap-6">
        <div>
          <p className="text-sm text-neutral-500">{t('welcome')}</p>
          <h2 className="text-2xl font-bold">{businessName ?? '—'}</h2>
        </div>

        {loading ? (
          <p className="text-neutral-500">{t('loading')}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              <StatCard label={t('totalCustomers')} value={total} accent="neutral" />
              <StatCard
                label={t('totalCustomersLtv')}
                value={formatAmount(totalSpend, lang)}
                accent="neutral"
                helpTitleKey="helpIncomeTitle"
                helpBodyKey="helpIncomeBody"
              />
              <StatCard
                label={t('dormant30')}
                value={dormant}
                accent="amber"
                helpTitleKey="helpDormantTitle"
                helpBodyKey="helpDormantBody"
              />
              <StatCard
                label={t('birthdaysToday')}
                value={birthdays.length}
                accent="rose"
                detail={birthdays.map(fullName).join(', ') || undefined}
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2 flex items-center gap-2">
                {t('pipeline')}
                <HelpButton titleKey="helpPipelineTitle" bodyKey="helpPipelineBody" />
              </p>
              <div className="-mx-4 px-4 overflow-x-auto">
                <div className="flex gap-2 w-max">
                  {STATUSES.map((s) => {
                    const meta = STATUS_META[s];
                    const count = statusCounts[s] ?? 0;
                    return (
                      <Link
                        key={s}
                        href={`/customers?status=${s}`}
                        className={`flex flex-col items-start rounded-2xl border border-neutral-200 px-3 py-2 min-w-[90px] ${meta.bg}`}
                      >
                        <span className={`text-[10px] uppercase tracking-wide ${meta.text}`}>
                          {t(meta.tKey)}
                        </span>
                        <span className={`text-2xl font-bold tabular-nums ${meta.text}`}>{count}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">{t('quickActions')}</p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/customers/new"
                  className="rounded-2xl bg-brand text-white px-4 py-3 font-medium text-center"
                >
                  + {t('addCustomer')}
                </Link>
                <Link
                  href="/customers"
                  className="rounded-2xl bg-white border border-neutral-200 px-4 py-3 font-medium text-center"
                >
                  {t('customers')}
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  accent,
  detail,
  helpTitleKey,
  helpBodyKey,
}: {
  label: string;
  value: number | string;
  accent: 'neutral' | 'amber' | 'rose';
  detail?: string;
  helpTitleKey?: import('@/lib/i18n/dictionary').DictKey;
  helpBodyKey?: import('@/lib/i18n/dictionary').DictKey;
}) {
  const accentBg = { neutral: 'bg-white', amber: 'bg-amber-50', rose: 'bg-rose-50' }[accent];
  return (
    <div className={`rounded-2xl border border-neutral-200 ${accentBg} px-4 py-4`}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-neutral-600">{label}</p>
          {helpTitleKey && helpBodyKey && <HelpButton titleKey={helpTitleKey} bodyKey={helpBodyKey} />}
        </div>
        <p className="text-3xl font-bold tabular-nums">{value}</p>
      </div>
      {detail && <p className="text-xs text-neutral-500 mt-1">{detail}</p>}
    </div>
  );
}
