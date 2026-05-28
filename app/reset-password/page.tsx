'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, isConfigured } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/LanguageProvider';
import { LanguageToggle } from '@/components/LanguageToggle';
import { SetupNeeded } from '@/components/SetupNeeded';
import { PasswordInput } from '@/components/PasswordInput';

export default function ResetPasswordPage() {
  if (!isConfigured()) return <SetupNeeded />;
  return <ResetForm />;
}

function ResetForm() {
  const { t } = useT();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setAuthed(Boolean(data.session));
      setChecking(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password !== confirm) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo(t('passwordUpdated'));
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 1200);
  }

  const inputCls = 'border border-neutral-200 bg-white rounded-xl px-3.5 py-3 text-base outline-none focus:border-brand';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4">
        <Link href="/login" className="text-sm text-neutral-600">←</Link>
        <LanguageToggle />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        {checking ? (
          <p className="text-neutral-500">{t('verifyingLink')}</p>
        ) : !authed ? (
          <div className="text-center max-w-sm flex flex-col gap-3">
            <p className="text-neutral-700">{t('invalidResetLink')}</p>
            <Link href="/forgot-password" className="text-neutral-900 underline">
              {t('forgotPassword')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
            <h1 className="text-2xl font-bold mb-1">{t('resetPasswordTitle')}</h1>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-neutral-700">{t('newPassword')}</span>
              <PasswordInput required minLength={6} autoComplete="new-password" value={password} onChange={setPassword} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-neutral-700">{t('confirmPassword')}</span>
              <PasswordInput required minLength={6} autoComplete="new-password" value={confirm} onChange={setConfirm} className={inputCls} />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {info && <p className="text-sm text-emerald-700">{info}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-brand text-white py-3 font-medium hover:bg-brand-deep disabled:opacity-60"
            >
              {loading ? t('saving') : t('save')}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
