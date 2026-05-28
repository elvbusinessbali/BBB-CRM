'use client';

import { useEffect, useRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { useT } from '@/lib/i18n/LanguageProvider';

/**
 * Renders a Cloudflare Turnstile widget. Calls onToken when a token is produced.
 * If NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set, this renders nothing AND immediately
 * gives an empty string token so the form can submit without captcha (useful while
 * setting up).
 */
export function Captcha({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const { lang } = useT();
  const ref = useRef<TurnstileInstance | null>(null);

  if (!siteKey) return <EmptyToken onToken={onToken} />;

  return (
    <div className="self-center">
      <Turnstile
        ref={ref}
        siteKey={siteKey}
        options={{
          theme: 'light',
          size: 'flexible',
          language: lang === 'id' ? 'id' : 'en',
        }}
        onSuccess={onToken}
        onExpire={() => onToken('')}
        onError={() => onToken('')}
      />
    </div>
  );
}

function EmptyToken({ onToken }: { onToken: (t: string) => void }) {
  useEffect(() => {
    onToken('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** True when captcha is configured and therefore required. */
export function captchaRequired() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}
