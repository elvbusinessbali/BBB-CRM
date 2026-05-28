'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/LanguageProvider';
import type { DictKey } from '@/lib/i18n/dictionary';

/**
 * Tiny "ⓘ" icon button. Tap → opens a bottom sheet with a short explanation.
 * Pass either dictionary keys (preferred, auto-translated) or raw strings.
 */
export function HelpButton({
  titleKey,
  bodyKey,
  title,
  body,
  size = 'sm',
}: {
  titleKey?: DictKey;
  bodyKey?: DictKey;
  title?: string;
  body?: string;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);
  const { t } = useT();

  const resolvedTitle = title ?? (titleKey ? t(titleKey) : '');
  const resolvedBody = body ?? (bodyKey ? t(bodyKey) : '');

  const cls = size === 'md' ? 'h-5 w-5 text-[13px]' : 'h-4 w-4 text-[11px]';

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        className={`${cls} inline-flex items-center justify-center rounded-full border border-neutral-300 text-neutral-500 hover:text-neutral-800 hover:border-neutral-500 align-middle leading-none`}
        aria-label={t('help')}
        title={t('help')}
      >
        i
      </button>
      {open && (
        <HelpSheet title={resolvedTitle} body={resolvedBody} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function HelpSheet({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  const { t } = useT();
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-xs sm:max-w-sm p-4 flex flex-col gap-2 max-h-[70vh] overflow-y-auto shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-sm">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 text-lg leading-none -mt-0.5"
            aria-label={t('gotIt')}
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-neutral-700 whitespace-pre-wrap leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
