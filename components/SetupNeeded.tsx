'use client';

import { useT } from '@/lib/i18n/LanguageProvider';
import { LanguageToggle } from '@/components/LanguageToggle';
import Link from 'next/link';

export function SetupNeeded() {
  const { lang } = useT();
  const en = lang === 'en';
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4">
        <Link href="/" className="text-sm text-neutral-600">←</Link>
        <LanguageToggle />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-sm flex flex-col gap-4">
          <div className="text-5xl mb-2">⚙️</div>
          <h1 className="text-xl font-bold">
            {en ? 'Setup needed' : 'Perlu disiapkan dulu'}
          </h1>
          <p className="text-neutral-600 text-sm leading-relaxed">
            {en
              ? 'Connect this app to your Supabase project to start using it. The README walks you through 5 steps (about 10 minutes).'
              : 'Hubungkan aplikasi ini ke project Supabase kamu untuk mulai memakai. README punya 5 langkah (sekitar 10 menit).'}
          </p>
          <pre className="bg-neutral-100 text-left text-xs rounded-xl p-3 font-mono whitespace-pre-wrap break-all">
{`# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...`}
          </pre>
          <p className="text-xs text-neutral-500">
            {en
              ? 'See README.md → Setup'
              : 'Lihat README.md → Setup'}
          </p>
        </div>
      </main>
    </div>
  );
}
