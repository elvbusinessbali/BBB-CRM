'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/LanguageProvider';
import { LanguageToggle } from '@/components/LanguageToggle';
import { PipelineLogo } from '@/components/PipelineLogo';

export function AppHeader({ title, back, right }: { title?: string; back?: boolean; right?: React.ReactNode }) {
  const router = useRouter();
  const { t } = useT();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-neutral-200">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {back && (
            <button
              onClick={() => router.back()}
              className="text-neutral-600 text-lg px-1"
              aria-label="Back"
            >
              ←
            </button>
          )}
          {!back && !title && <PipelineLogo className="h-4 w-auto shrink-0" />}
          <h1 className="text-base font-semibold truncate">{title ?? t('appName')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {right}
          <LanguageToggle />
          <button
            onClick={handleLogout}
            className="text-xs text-neutral-600 hover:text-neutral-900 px-2 py-1"
            title={t('logout')}
          >
            {t('logout')}
          </button>
        </div>
      </div>
    </header>
  );
}
