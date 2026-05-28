'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/LanguageProvider';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function Home() {
  const { t } = useT();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex justify-end p-4">
        <LanguageToggle />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md flex flex-col gap-8">
          <div>
            <div className="text-6xl mb-4">✨</div>
            <h1 className="text-3xl font-bold tracking-tight">{t('appName')}</h1>
            <p className="mt-3 text-neutral-600">{t('tagline')}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-neutral-900 text-white py-3 font-medium hover:bg-neutral-800"
            >
              {t('signup')}
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-neutral-200 bg-white py-3 font-medium hover:bg-neutral-50"
            >
              {t('login')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
