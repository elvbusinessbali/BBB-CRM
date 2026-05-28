'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getCustomer, type Customer } from '@/lib/supabase/queries';
import { STATUSES, STATUS_META, type Status } from '@/lib/status';
import { useT } from '@/lib/i18n/LanguageProvider';
import { AppHeader } from '@/components/AppHeader';
import { TagPicker } from '@/components/TagPicker';
import { CampaignPicker } from '@/components/CampaignPicker';

export default function EditCustomerPage() {
  const { t } = useT();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const customerId = params.id;

  const [loaded, setLoaded] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Status>('cold');
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const c = await getCustomer(supabase, customerId);
      if (c) {
        applyCustomer(c);
      }
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  function applyCustomer(c: Customer) {
    setFirstName(c.first_name || c.name?.split(' ')[0] || '');
    setLastName(c.last_name ?? (c.name?.split(' ').slice(1).join(' ') || ''));
    setPhone(c.phone ?? '');
    setEmail(c.email ?? '');
    setBirthday(c.birthday ?? '');
    setTags(c.tags ?? []);
    setNotes(c.notes ?? '');
    setStatus(c.status);
    setCampaignId(c.campaign_id ?? null);
  }

  async function handleDelete() {
    if (!confirm(t('confirmDelete'))) return;
    setDeleting(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from('customers').delete().eq('id', customerId);
    if (error) {
      setError(error.message);
      setDeleting(false);
      return;
    }
    router.push('/customers');
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
      const { error } = await supabase
        .from('customers')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          name: fullName,
          phone: phone.trim() || null,
          email: email.trim().toLowerCase() || null,
          birthday: birthday || null,
          tags,
          notes: notes.trim() || null,
          status,
          campaign_id: campaignId,
        })
        .eq('id', customerId);
      if (error) throw error;
      router.push(`/customers/${customerId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
      setSaving(false);
    }
  }

  const inputCls = 'w-full border border-neutral-200 bg-white rounded-xl px-3.5 py-3 text-base outline-none focus:border-brand';

  if (!loaded) {
    return (
      <>
        <AppHeader back />
        <main className="px-4 py-12 text-center text-neutral-500">{t('loading')}</main>
      </>
    );
  }

  return (
    <>
      <AppHeader title={t('editCustomer')} back />
      <main className="px-4 py-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('status')}</span>
            <div className="-mx-1 px-1 overflow-x-auto">
              <div className="flex gap-1.5 w-max">
                {STATUSES.map((s) => {
                  const meta = STATUS_META[s];
                  const active = status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`text-xs rounded-full px-3 py-2 border whitespace-nowrap font-medium ${
                        active
                          ? `${meta.bg} ${meta.text} border-transparent`
                          : 'bg-white text-neutral-700 border-neutral-200'
                      }`}
                    >
                      {t(meta.tKey)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-neutral-700">{t('firstName')} *</span>
              <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-neutral-700">{t('lastName')}</span>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('phone')}</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('email')}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('birthday')}</span>
            <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className={inputCls} />
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('howFoundYou')}</span>
            <CampaignPicker value={campaignId} onChange={setCampaignId} />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('tags')}</span>
            <TagPicker value={tags} onChange={setTags} />
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('notes')}</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} rows={3} />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
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
        </form>

        <section className="mt-8 border-t border-red-100 pt-4">
          <p className="text-xs uppercase tracking-wide text-red-600 mb-1">{t('dangerZone')}</p>
          <p className="text-xs text-neutral-500 mb-3">{t('dangerZoneHint')}</p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full border border-red-300 text-red-700 px-4 py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? t('saving') : t('deleteCustomer')}
          </button>
        </section>
      </main>
    </>
  );
}
