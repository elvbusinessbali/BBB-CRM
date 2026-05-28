'use client';

import { useT } from '@/lib/i18n/LanguageProvider';

export function LanguageToggle() {
  const { lang, setLang } = useT();
  return (
    <div className="inline-flex rounded-full border border-neutral-200 bg-white text-xs">
      <button
        onClick={() => setLang('en')}
        className={`px-3 py-1 rounded-full ${lang === 'en' ? 'bg-neutral-900 text-white' : 'text-neutral-600'}`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('id')}
        className={`px-3 py-1 rounded-full ${lang === 'id' ? 'bg-neutral-900 text-white' : 'text-neutral-600'}`}
      >
        ID
      </button>
    </div>
  );
}
