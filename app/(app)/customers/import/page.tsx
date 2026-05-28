'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getAdCampaigns, getMyBusiness, type AdCampaign } from '@/lib/supabase/queries';
import {
  buildTemplateCsv,
  parseCsv,
  detectColumns,
  mapRow,
  type ColumnMap,
  type ParsedCustomer,
} from '@/lib/csvImport';
import { downloadCsv } from '@/lib/csv';
import { useT } from '@/lib/i18n/LanguageProvider';
import type { DictKey } from '@/lib/i18n/dictionary';
import { AppHeader } from '@/components/AppHeader';

export default function ImportCustomersPage() {
  const { t } = useT();
  const router = useRouter();

  const [headers, setHeaders] = useState<string[]>([]);
  const [cols, setCols] = useState<ColumnMap>({});
  const [parsed, setParsed] = useState<ParsedCustomer[]>([]);
  const [rawCount, setRawCount] = useState(0);
  const [fileName, setFileName] = useState('');

  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [bulkCampaignId, setBulkCampaignId] = useState<string>(''); // '' = no override

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [doneCount, setDoneCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const cs = await getAdCampaigns(supabase);
        setCampaigns(cs);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  function handleDownloadTemplate() {
    downloadCsv('bbb-crm-import-template.csv', buildTemplateCsv());
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setDoneCount(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    try {
      const rows = parseCsv(text);
      setRawCount(rows.length);
      if (rows.length === 0) {
        setError(t('csvEmpty'));
        setHeaders([]);
        setParsed([]);
        return;
      }
      const hs = Object.keys(rows[0]);
      setHeaders(hs);
      const detected = detectColumns(hs);
      setCols(detected);
      const mapped: ParsedCustomer[] = [];
      for (const r of rows) {
        const m = mapRow(r, detected);
        if (m) mapped.push(m);
      }
      setParsed(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    }
  }

  function changeMapping(field: keyof ColumnMap, header: string) {
    const next: ColumnMap = { ...cols, [field]: header || undefined };
    if (!header) delete next[field];
    setCols(next);
    const remapped: ParsedCustomer[] = [];
    for (const p of parsed) {
      const m = mapRow(p._source, next);
      if (m) remapped.push(m);
    }
    setParsed(remapped);
  }

  /** Resolve a row to a final campaign_id: bulk override > per-row name match > null. */
  function resolveCampaignId(p: ParsedCustomer): string | null {
    if (bulkCampaignId) return bulkCampaignId;
    if (!p.campaign_name) return null;
    const match = campaigns.find(
      (c) => c.name.toLowerCase() === p.campaign_name!.toLowerCase()
    );
    return match?.id ?? null;
  }

  async function handleImport() {
    if (parsed.length === 0) return;
    setImporting(true);
    setError(null);
    setProgress(0);
    const supabase = createClient();
    try {
      const business = await getMyBusiness(supabase);
      const BATCH = 100;
      let imported = 0;
      for (let i = 0; i < parsed.length; i += BATCH) {
        const slice = parsed.slice(i, i + BATCH);
        const rows = slice.map((p) => ({
          business_id: business.id,
          first_name: p.first_name,
          last_name: p.last_name,
          name: [p.first_name, p.last_name].filter(Boolean).join(' '),
          phone: p.phone,
          email: p.email,
          birthday: p.birthday,
          tags: p.tags,
          notes: p.notes,
          status: p.status,
          campaign_id: resolveCampaignId(p),
        }));
        const { error } = await supabase.from('customers').insert(rows);
        if (error) throw error;
        imported += slice.length;
        setProgress(Math.round((imported / parsed.length) * 100));
      }
      setDoneCount(imported);
      setTimeout(() => router.push('/customers'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setImporting(false);
    }
  }

  const fieldsToShow: Array<keyof ColumnMap> = [
    'first_name',
    'last_name',
    'name',
    'phone',
    'email',
    'birthday',
    'tags',
    'notes',
    'status',
    'campaign',
  ];

  // How many parsed rows mention a campaign name, and how many of those resolve?
  const rowsWithCampaign = parsed.filter((p) => p.campaign_name).length;
  const rowsResolvedByName = parsed.filter((p) => {
    if (!p.campaign_name) return false;
    return campaigns.some((c) => c.name.toLowerCase() === p.campaign_name!.toLowerCase());
  }).length;

  return (
    <>
      <AppHeader title={t('importCsv')} back />
      <main className="px-4 py-4 flex flex-col gap-4">
        {doneCount !== null ? (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center">
            <p className="text-emerald-800 font-medium">
              {t('importedN').replace('{n}', String(doneCount))}
            </p>
            <Link href="/customers" className="underline text-emerald-900 text-sm">
              {t('customers')}
            </Link>
          </div>
        ) : (
          <>
            {/* Step 1: upload (with template download) */}
            <section className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-medium">1. {t('chooseFile')}</h2>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-xs text-brand underline"
                >
                  ↓ {t('downloadTemplate')}
                </button>
              </div>
              <p className="text-xs text-neutral-500">{t('importHint')}</p>
              <label className="rounded-xl border-2 border-dashed border-neutral-300 px-4 py-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-neutral-50">
                <span className="text-2xl">📄</span>
                <span className="text-sm text-neutral-700">
                  {fileName ? fileName : t('pickCsv')}
                </span>
                <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
              </label>
            </section>

            {/* Step 2: attribute to a campaign (bulk) */}
            {parsed.length > 0 && (
              <section className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col gap-2">
                <h2 className="font-medium">2. {t('attributeAll')}</h2>
                <p className="text-xs text-neutral-500">{t('attributeAllHint')}</p>
                {campaigns.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    {t('noCampaignsYet')}{' '}
                    <Link href="/ads" className="text-brand underline">{t('ads')}</Link>
                  </p>
                ) : (
                  <select
                    value={bulkCampaignId}
                    onChange={(e) => setBulkCampaignId(e.target.value)}
                    className="border border-neutral-200 rounded-xl px-3 py-2.5 text-base bg-white outline-none focus:border-brand"
                  >
                    <option value="">— {t('attributePerRow')} —</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.source ? ` (${c.source})` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {!bulkCampaignId && rowsWithCampaign > 0 && (
                  <p className="text-xs text-neutral-500">
                    {t('campaignResolveStatus')
                      .replace('{matched}', String(rowsResolvedByName))
                      .replace('{total}', String(rowsWithCampaign))}
                  </p>
                )}
              </section>
            )}

            {/* Step 3: column mapping */}
            {headers.length > 0 && (
              <section className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col gap-3">
                <h2 className="font-medium">3. {t('matchColumns')}</h2>
                <p className="text-xs text-neutral-500">{t('matchColumnsHint')}</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-sm">
                  {fieldsToShow.map((field) => (
                    <label key={field} className="flex flex-col gap-1">
                      <span className="text-xs text-neutral-600">{labelFor(field, t)}</span>
                      <select
                        value={cols[field] ?? ''}
                        onChange={(e) => changeMapping(field, e.target.value)}
                        className="border border-neutral-200 rounded-lg px-2 py-1.5 bg-white"
                      >
                        <option value="">— {t('skipColumn')} —</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </section>
            )}

            {/* Step 4: preview */}
            {parsed.length > 0 && (
              <section className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col gap-2">
                <h2 className="font-medium">
                  4. {t('previewImport').replace('{n}', String(parsed.length)).replace('{total}', String(rawCount))}
                </h2>
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-xs">
                    <thead className="text-neutral-500">
                      <tr>
                        <th className="text-left pr-3 font-normal">First</th>
                        <th className="text-left pr-3 font-normal">Last</th>
                        <th className="text-left pr-3 font-normal">Phone</th>
                        <th className="text-left pr-3 font-normal">Email</th>
                        <th className="text-left pr-3 font-normal">Status</th>
                        <th className="text-left pr-3 font-normal">{t('source')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.slice(0, 5).map((p, i) => {
                        const cid = resolveCampaignId(p);
                        const campName = cid ? campaigns.find((c) => c.id === cid)?.name : null;
                        return (
                          <tr key={i} className="border-t border-neutral-100">
                            <td className="py-1 pr-3">{p.first_name}</td>
                            <td className="py-1 pr-3">{p.last_name ?? ''}</td>
                            <td className="py-1 pr-3">{p.phone ?? ''}</td>
                            <td className="py-1 pr-3">{p.email ?? ''}</td>
                            <td className="py-1 pr-3">{p.status}</td>
                            <td className="py-1 pr-3 truncate max-w-[110px]">
                              {campName ?? (p.campaign_name ? `${p.campaign_name} ⚠` : '—')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {parsed.length > 5 && (
                    <p className="text-xs text-neutral-400 mt-1">
                      … +{parsed.length - 5} {t('more')}
                    </p>
                  )}
                </div>
              </section>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={handleImport}
              disabled={importing || parsed.length === 0}
              className="rounded-full bg-brand text-white py-3 font-medium disabled:opacity-60"
            >
              {importing
                ? `${t('importing')} ${progress}%`
                : parsed.length === 0
                  ? t('importCustomers')
                  : `${t('importCustomers')} (${parsed.length})`}
            </button>

            <p className="text-xs text-neutral-500 text-center">{t('importDuplicateWarning')}</p>
          </>
        )}
      </main>
    </>
  );
}

function labelFor(field: keyof ColumnMap, t: (k: DictKey) => string): string {
  switch (field) {
    case 'first_name': return t('firstName');
    case 'last_name':  return t('lastName');
    case 'name':       return t('name');
    case 'phone':      return t('phone');
    case 'email':      return t('email');
    case 'birthday':   return t('birthday');
    case 'tags':       return t('tags');
    case 'notes':      return t('notes');
    case 'status':     return t('status');
    case 'campaign':   return t('source');
    default:           return String(field);
  }
}
