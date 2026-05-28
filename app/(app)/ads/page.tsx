'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  CAMPAIGN_SOURCES,
  computeCampaignStats,
  createAdCampaign,
  deleteAdCampaign,
  getAdCampaigns,
  getCustomers,
  getInteractionTotalsPerCustomer,
  getMyBusiness,
  updateAdCampaign,
  type AdCampaign,
  type CampaignSource,
  type Customer,
} from '@/lib/supabase/queries';
import { formatAmount } from '@/lib/format';
import { useT } from '@/lib/i18n/LanguageProvider';
import { AppHeader } from '@/components/AppHeader';

export default function AdsPage() {
  const { t, lang } = useT();

  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totals, setTotals] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdCampaign | 'new' | null>(null);

  async function reload() {
    const supabase = createClient();
    const [biz, camps, custs, tots] = await Promise.all([
      getMyBusiness(supabase),
      getAdCampaigns(supabase),
      getCustomers(supabase),
      getInteractionTotalsPerCustomer(supabase),
    ]);
    setBusinessId(biz.id);
    setCampaigns(camps);
    setCustomers(custs);
    setTotals(tots);
  }

  useEffect(() => {
    (async () => {
      try {
        await reload();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalSpend = useMemo(
    () => campaigns.reduce((s, c) => s + Number(c.spend), 0),
    [campaigns]
  );
  const totalAttributed = useMemo(
    () => customers.filter((c) => c.campaign_id).length,
    [customers]
  );
  const totalRevenueFromAds = useMemo(() => {
    let r = 0;
    for (const c of customers) {
      if (c.campaign_id) r += totals.get(c.id) ?? 0;
    }
    return r;
  }, [customers, totals]);
  const overallCac = totalAttributed > 0 ? totalSpend / totalAttributed : null;
  const overallRoas = totalSpend > 0 ? totalRevenueFromAds / totalSpend : null;

  return (
    <>
      <AppHeader
        title={t('ads')}
        right={
          <button
            onClick={() => setEditing('new')}
            className="text-xs text-neutral-700 underline"
          >
            + {t('newCampaign')}
          </button>
        }
      />
      <main className="px-4 py-4 flex flex-col gap-4">
        {loading ? (
          <p className="text-neutral-500 text-center py-12">{t('loading')}</p>
        ) : (
          <>
            {/* Overall summary */}
            <section className="grid grid-cols-2 gap-2">
              <SummaryCard label={t('totalSpend')} value={formatAmount(totalSpend, lang)} />
              <SummaryCard label={t('customersFromAds')} value={String(totalAttributed)} />
              <SummaryCard
                label={t('avgCac')}
                value={overallCac == null ? '—' : formatAmount(overallCac, lang)}
              />
              <SummaryCard
                label={t('overallRoas')}
                value={overallRoas == null ? '—' : `${overallRoas.toFixed(1)}×`}
              />
            </section>

            {campaigns.length === 0 ? (
              <div className="text-center text-neutral-500 py-8 px-6">
                <p>{t('noCampaignsYet')}</p>
                <button
                  onClick={() => setEditing('new')}
                  className="inline-block mt-4 rounded-full bg-brand text-white px-4 py-2 text-sm"
                >
                  + {t('newCampaign')}
                </button>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {campaigns.map((c) => {
                  const stats = computeCampaignStats(c, customers, totals);
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => setEditing(c)}
                        className="w-full text-left bg-white border border-neutral-200 rounded-2xl px-4 py-3 hover:bg-neutral-50 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{c.name}</p>
                            <p className="text-xs text-neutral-500 capitalize">
                              {c.source ?? t('sourceOther').toLowerCase()}
                              {c.started_at && ` · ${c.started_at}`}
                              {c.ended_at && ` → ${c.ended_at}`}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-neutral-500">{t('spend')}</p>
                            <p className="text-sm font-semibold tabular-nums">{formatAmount(Number(c.spend), lang)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs text-neutral-600 mt-1">
                          <Stat label={t('customersShort')} value={String(stats.customers)} />
                          <Stat label={t('revenueShort')} value={formatAmount(stats.revenue, lang)} small />
                          <Stat label="CAC" value={stats.cac == null ? '—' : formatAmount(stats.cac, lang)} small />
                          <Stat label="ROAS" value={stats.roas == null ? '—' : `${stats.roas.toFixed(1)}×`} />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <Link href="/dashboard" className="text-xs text-neutral-500 underline self-center mt-2">
              ← {t('home')}
            </Link>
          </>
        )}
      </main>

      {editing && businessId && (
        <CampaignForm
          businessId={businessId}
          campaign={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-neutral-400">{label}</span>
      <span className={small ? 'text-xs font-medium tabular-nums truncate' : 'font-medium tabular-nums'}>{value}</span>
    </div>
  );
}

function CampaignForm({
  businessId,
  campaign,
  onClose,
  onSaved,
}: {
  businessId: string;
  campaign: AdCampaign | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState(campaign?.name ?? '');
  const [source, setSource] = useState<CampaignSource | ''>((campaign?.source as CampaignSource) ?? '');
  const [spend, setSpend] = useState(campaign ? String(campaign.spend) : '');
  const [startedAt, setStartedAt] = useState(campaign?.started_at ?? '');
  const [endedAt, setEndedAt] = useState(campaign?.ended_at ?? '');
  const [notes, setNotes] = useState(campaign?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const payload = {
        name: name.trim(),
        source: source || null,
        spend: Number(spend) || 0,
        started_at: startedAt || null,
        ended_at: endedAt || null,
        notes: notes.trim() || null,
      };
      if (campaign) {
        await updateAdCampaign(supabase, campaign.id, payload);
      } else {
        await createAdCampaign(supabase, businessId, payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!campaign) return;
    if (!confirm(t('confirmDeleteCampaign'))) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      await deleteAdCampaign(supabase, campaign.id);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
      setDeleting(false);
    }
  }

  const inputCls = 'w-full border border-neutral-200 bg-white rounded-xl px-3 py-2.5 text-base outline-none focus:border-brand';

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 flex flex-col gap-3 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {campaign ? t('editCampaign') : t('newCampaign')}
          </h3>
          <button type="button" onClick={onClose} className="text-neutral-500 text-xl px-2">✕</button>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-neutral-700">{t('campaignName')} *</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Facebook Ad - Mei" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-neutral-700">{t('source')}</span>
          <select value={source} onChange={(e) => setSource(e.target.value as CampaignSource | '')} className={inputCls}>
            <option value="">—</option>
            {CAMPAIGN_SOURCES.map((s) => (
              <option key={s} value={s} className="capitalize">{labelForSource(s, t)}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-neutral-700">{t('spendIdr')}</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={spend}
            onChange={(e) => setSpend(e.target.value)}
            className={inputCls}
            placeholder="500000"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('startedAt')}</span>
            <input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('endedAt')}</span>
            <input type="date" value={endedAt} onChange={(e) => setEndedAt(e.target.value)} className={inputCls} />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-neutral-700">{t('notes')}</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} rows={2} />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-neutral-200 bg-white py-3 font-medium"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-full bg-brand text-white py-3 font-medium disabled:opacity-60"
          >
            {saving ? t('saving') : t('save')}
          </button>
        </div>

        {campaign && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full border border-red-300 text-red-700 py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-60 mt-1"
          >
            {deleting ? '…' : t('deleteCampaign')}
          </button>
        )}
      </form>
    </div>
  );
}

function labelForSource(s: CampaignSource, t: (k: 'sourceInstagram' | 'sourceFacebook' | 'sourceTiktok' | 'sourceGoogle' | 'sourceWhatsapp' | 'sourceReferral' | 'sourceFlyer' | 'sourceWalkIn' | 'sourceOther') => string): string {
  switch (s) {
    case 'instagram': return t('sourceInstagram');
    case 'facebook':  return t('sourceFacebook');
    case 'tiktok':    return t('sourceTiktok');
    case 'google':    return t('sourceGoogle');
    case 'whatsapp':  return t('sourceWhatsapp');
    case 'referral':  return t('sourceReferral');
    case 'flyer':     return t('sourceFlyer');
    case 'walk_in':   return t('sourceWalkIn');
    case 'other':     return t('sourceOther');
  }
}
