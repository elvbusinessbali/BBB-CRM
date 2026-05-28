'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, isConfigured } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/LanguageProvider';
import { LanguageToggle } from '@/components/LanguageToggle';
import { SetupNeeded } from '@/components/SetupNeeded';

export default function SignupPage() {
  if (!isConfigured()) return <SetupNeeded />;
  return <SignupForm />;
}

function SignupForm() {
  const { t } = useT();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { business_name: businessName } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setInfo(t('checkEmail'));
    }
  }

  const inputCls =
    'border border-neutral-200 bg-white rounded-xl px-3.5 py-3 text-base outline-none focus:border-neutral-900';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4">
        <Link href="/" className="text-sm text-neutral-600">←</Link>
        <LanguageToggle />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
          <h1 className="text-2xl font-bold mb-2">{t('signup')}</h1>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('businessName')}</span>
            <input type="text" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('email')}</span>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-neutral-700">{t('password')}</span>
            <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-emerald-700">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-neutral-900 text-white py-3 font-medium hover:bg-neutral-800 disabled:opacity-60"
          >
            {loading ? t('saving') : t('signupCta')}
          </button>
          <p className="text-sm text-center text-neutral-600">
            {t('haveAccount')} <Link href="/login" className="text-neutral-900 underline">{t('login')}</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
