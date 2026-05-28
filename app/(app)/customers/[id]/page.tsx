'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  getCustomer,
  getInteractionsForCustomer,
  getMyBusiness,
  updateCustomerStatus,
  fullName,
  type Customer,
  type Interaction,
} from '@/lib/supabase/queries';
import { STATUSES, STATUS_META, type Status } from '@/lib/status';
import { formatAmount } from '@/lib/format';
import { useT } from '@/lib/i18n/LanguageProvider';
import { AppHeader } from '@/components/AppHeader';
import { StatusPill } from '@/components/StatusPill';
import { HelpButton } from '@/components/HelpButton';

export default function CustomerDetailPage() {
  const { t, lang } = useT();
  const params = useParams<{ id: string }>();
  const customerId = params.id;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  async function reload() {
    const supabase = createClient();
    const [c, ints] = await Promise.all([
      getCustomer(supabase, customerId),
      getInteractionsForCustomer(supabase, customerId),
    ]);
    setCustomer(c);
    setInteractions(ints);
  }

  useEffect(() => {
    (async () => {
      try {
        await reload();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  async function handleStatusChange(newStatus: Status) {
    if (!customer || customer.status === newStatus) {
      setShowStatusPicker(false);
      return;
    }
    setCustomer({ ...customer, status: newStatus });
    setShowStatusPicker(false);
    const supabase = createClient();
    try {
      await updateCustomerStatus(supabase, customer.id, newStatus);
    } catch {
      await reload();
    }
  }

  const ltv = useMemo(
    () => interactions.reduce((sum, i) => sum + (i.amount ?? 0), 0),
    [interactions]
  );

  const waLink = useMemo(() => {
    if (!customer?.phone) return null;
    const digits = customer.phone.replace(/\D/g, '');
    if (!digits) return null;
    const normalized = digits.startsWith('0') ? '62' + digits.slice(1) : digits;
    return `https://wa.me/${normalized}`;
  }, [customer]);

  if (loading) {
    return (
      <>
        <AppHeader back />
        <main className="p-6 text-neutral-500">{t('loading')}</main>
      </>
    );
  }

  if (!customer) {
    return (
      <>
        <AppHeader back />
        <main className="p-6 text-neutral-500">{t('error')}</main>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title={fullName(customer)}
        back
        right={
          <Link href={`/customers/${customer.id}/edit`} className="text-xs text-neutral-700 underline">
            {t('edit')}
          </Link>
        }
      />
      <main className="px-4 py-4 flex flex-col gap-4">
        <section className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500 flex items-center gap-1.5">
                {t('lifetimeValue')}
                <HelpButton titleKey="helpLtvTitle" bodyKey="helpLtvBody" />
              </p>
              <p className="text-3xl font-bold tabular-nums">{formatAmount(ltv, lang)}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {interactions.length} {t('timeline').toLowerCase()}
              </p>
            </div>
            <button
              onClick={() => setShowStatusPicker(true)}
              className="shrink-0"
              aria-label={t('changeStatus')}
            >
              <StatusPill status={customer.status} size="md" />
            </button>
          </div>

          <div className="border-t border-neutral-100 pt-3 flex flex-col gap-2">
            <Row label={t('phone')} value={customer.phone ?? '—'} />
            <Row
              label={t('email')}
              value={customer.email ?? '—'}
              href={customer.email ? `mailto:${customer.email}` : undefined}
            />
            <Row label={t('birthday')} value={customer.birthday ?? '—'} />
          </div>
          {customer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {customer.tags.map((tag) => (
                <span key={tag} className="text-xs bg-neutral-100 text-neutral-700 rounded-full px-2 py-0.5">{tag}</span>
              ))}
            </div>
          )}
          {customer.notes && <p className="text-sm text-neutral-600 whitespace-pre-wrap">{customer.notes}</p>}
        </section>

        <div className="flex gap-2">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener"
              className="flex-1 rounded-full bg-emerald-600 text-white py-3 font-medium text-center"
            >
              {t('openWhatsApp')}
            </a>
          )}
          <button
            onClick={() => setShowLog(true)}
            className="flex-1 rounded-full bg-brand text-white py-3 font-medium"
          >
            + {t('logInteraction')}
          </button>
        </div>

        <section>
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">{t('timeline')}</p>
          {interactions.length === 0 ? (
            <p className="text-neutral-500 text-sm">{t('noInteractionsYet')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {interactions.map((i) => (
                <li key={i.id} className="bg-white border border-neutral-200 rounded-2xl p-3 flex items-start gap-3">
                  <div className="text-xs text-neutral-500 w-20 shrink-0">
                    {formatRelative(i.occurred_at, t, lang)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{kindLabel(i.kind, t)}</p>
                    {i.notes && <p className="text-sm text-neutral-600 truncate">{i.notes}</p>}
                  </div>
                  {i.amount != null && (
                    <p className="text-sm font-mono tabular-nums">{formatAmount(i.amount, lang)}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

      </main>

      {showLog && (
        <LogInteractionModal
          customerId={customerId}
          onClose={() => setShowLog(false)}
          onSaved={async () => {
            setShowLog(false);
            await reload();
          }}
        />
      )}

      {showStatusPicker && (
        <StatusPickerSheet
          current={customer.status}
          onPick={handleStatusChange}
          onClose={() => setShowStatusPicker(false)}
        />
      )}
    </>
  );
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-neutral-500">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand underline truncate ml-2"
        >
          {value}
        </a>
      ) : (
        <span className="text-neutral-900 truncate ml-2">{value}</span>
      )}
    </div>
  );
}

function kindLabel(kind: string, t: (k: 'visitKind' | 'callKind' | 'saleKind' | 'messageKind' | 'otherKind') => string) {
  switch (kind) {
    case 'visit': return t('visitKind');
    case 'call': return t('callKind');
    case 'sale': return t('saleKind');
    case 'message': return t('messageKind');
    default: return t('otherKind');
  }
}

function formatRelative(iso: string, t: (k: 'today' | 'yesterday' | 'daysAgo', vars?: Record<string, string | number>) => string, lang: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.floor((startOfDay(now) - startOfDay(date)) / (24 * 60 * 60 * 1000));
  if (days === 0) return t('today');
  if (days === 1) return t('yesterday');
  if (days < 14) return t('daysAgo', { n: days });
  return date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusPickerSheet({
  current,
  onPick,
  onClose,
}: {
  current: Status;
  onPick: (s: Status) => void;
  onClose: () => void;
}) {
  const { t } = useT();
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 flex flex-col gap-2"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-lg">{t('changeStatus')}</h3>
          <button type="button" onClick={onClose} className="text-neutral-500 text-xl px-2">✕</button>
        </div>
        <div className="flex flex-col gap-1.5">
          {STATUSES.map((s) => {
            const meta = STATUS_META[s];
            const active = s === current;
            return (
              <button
                key={s}
                onClick={() => onPick(s)}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                  active ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 bg-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${meta.bg}`} />
                  <span className="font-medium">{t(meta.tKey)}</span>
                </span>
                {active && <span className="text-neutral-900">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LogInteractionModal({
  customerId,
  onClose,
  onSaved,
}: {
  customerId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useT();
  const [kind, setKind] = useState('visit');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    try {
      const business = await getMyBusiness(supabase);
      const { error } = await supabase.from('interactions').insert({
        business_id: business.id,
        customer_id: customerId,
        kind,
        amount: amount ? Number(amount) : null,
        notes: notes || null,
        occurred_at: new Date(occurredAt).toISOString(),
      });
      if (error) throw error;
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
      setSaving(false);
    }
  }

  const inputCls = 'w-full border border-neutral-200 bg-white rounded-xl px-3.5 py-3 text-base outline-none focus:border-brand';

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-lg">{t('logInteraction')}</h3>
          <button type="button" onClick={onClose} className="text-neutral-500 text-xl px-2">✕</button>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-neutral-700">{t('kind')}</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
            <option value="visit">{t('visitKind')}</option>
            <option value="call">{t('callKind')}</option>
            <option value="sale">{t('saleKind')}</option>
            <option value="message">{t('messageKind')}</option>
            <option value="other">{t('otherKind')}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-neutral-700">{t('occurredAt')}</span>
          <input type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-neutral-700">{t('amount')}</span>
          <input type="number" inputMode="numeric" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-neutral-700">{t('notes')}</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} rows={2} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand text-white py-3 font-medium disabled:opacity-60 mt-1"
        >
          {saving ? t('saving') : t('save')}
        </button>
      </form>
    </div>
  );
}
