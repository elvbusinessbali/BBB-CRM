'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getMyBusiness } from '@/lib/supabase/queries';
import { STATUSES, STATUS_META, type Status } from '@/lib/status';
import { useT } from '@/lib/i18n/LanguageProvider';
import { AppHeader } from '@/components/AppHeader';

export default function NewCustomerPage() {
  const { t } = useT();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Status>('cold');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    try {
      const business = await getMyBusiness(supabase);
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const { data, error } = await supabase
        .from('customers')
        .insert({
          business_id: business.id,
          name,
          phone: phone || null,
          email: email || null,
          birthday: birthday || null,
          tags: tagList,
          notes: notes || null,
          status,
        })
        .select('id')
        .single();
      if (error) throw error;
      router.push(`/customers/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
      setSaving(false);
    }
  }

  const inputCls = 'w-full border border-neutral-200 bg-white rounded-xl px-3.5 py-3 text-base outline-none focus:border-neutral-900';

  return (
    <>
      <AppHeader title={t('addCustomer')} back />
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

          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('name')} *</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('phone')}</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="08123456789" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('email')}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('birthday')}</span>
            <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('tags')}</span>
            <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="VIP, regular" />
          </label>
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
              className="flex-1 rounded-full bg-neutral-900 text-white py-3 font-medium disabled:opacity-60"
            >
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
