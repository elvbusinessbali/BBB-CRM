'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, isConfigured } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/LanguageProvider';
import { LanguageToggle } from '@/components/LanguageToggle';
import { SetupNeeded } from '@/components/SetupNeeded';
import { Captcha, captchaRequired } from '@/components/Captcha';
import { PasswordInput } from '@/components/PasswordInput';

export default function LoginPage() {
  if (!isConfigured()) return <SetupNeeded />;
  return <LoginForm />;
}

function LoginForm() {
  const { t } = useT();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (captchaRequired() && !captchaToken) {
      setError(t('captchaRequired'));
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  const inputCls = 'border border-neutral-200 bg-white rounded-xl px-3.5 py-3 text-base outline-none focus:border-brand';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4">
        <Link href="/" className="text-sm text-neutral-600">←</Link>
        <LanguageToggle />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
          <h1 className="text-2xl font-bold mb-2">{t('login')}</h1>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('email')}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('password')}</span>
            <PasswordInput
              value={password}
              onChange={setPassword}
              required
              autoComplete="current-password"
              className={inputCls}
            />
            <Link href="/forgot-password" className="text-xs text-neutral-600 underline self-end mt-1">
              {t('forgotPassword')}
            </Link>
          </label>
          <Captcha onToken={setCaptchaToken} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || (captchaRequired() && !captchaToken)}
            className="rounded-full bg-brand text-white py-3 font-medium hover:bg-brand-deep disabled:opacity-60"
          >
            {loading ? t('saving') : t('loginCta')}
          </button>
          <p className="text-sm text-center text-neutral-600">
            {t('noAccount')} <Link href="/signup" className="text-neutral-900 underline">{t('signup')}</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
