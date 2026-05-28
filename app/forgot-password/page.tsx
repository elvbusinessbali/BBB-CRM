'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient, isConfigured } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/LanguageProvider';
import { LanguageToggle } from '@/components/LanguageToggle';
import { SetupNeeded } from '@/components/SetupNeeded';
import { Captcha, captchaRequired } from '@/components/Captcha';
import { authErrorMessage } from '@/lib/authError';

export default function ForgotPasswordPage() {
  if (!isConfigured()) return <SetupNeeded />;
  return <ForgotForm />;
}

function ForgotForm() {
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (captchaRequired() && !captchaToken) {
      setError(t('captchaRequired'));
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
      captchaToken: captchaToken || undefined,
    });
    setLoading(false);
    if (error) {
      setError(authErrorMessage(error, t));
      return;
    }
    setInfo(t('resetLinkSent'));
  }

  const inputCls = 'border border-neutral-200 bg-white rounded-xl px-3.5 py-3 text-base outline-none focus:border-brand';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4">
        <Link href="/login" className="text-sm text-neutral-600">←</Link>
        <LanguageToggle />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
          <h1 className="text-2xl font-bold mb-1">{t('forgotPasswordTitle')}</h1>
          <p className="text-sm text-neutral-600 -mt-1 mb-1">{t('forgotPasswordHint')}</p>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('email')}</span>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </label>
          <Captcha onToken={setCaptchaToken} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-emerald-700">{info}</p>}
          <button
            type="submit"
            disabled={loading || (captchaRequired() && !captchaToken)}
            className="rounded-full bg-brand text-white py-3 font-medium hover:bg-brand-deep disabled:opacity-60"
          >
            {loading ? t('saving') : t('sendResetLink')}
          </button>
          <p className="text-sm text-center text-neutral-600">
            <Link href="/login" className="text-neutral-900 underline">{t('backToLogin')}</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
