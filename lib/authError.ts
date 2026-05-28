import type { DictKey } from '@/lib/i18n/dictionary';

/**
 * Maps raw Supabase auth error messages (English, server-side) to friendly
 * localized dictionary keys. Falls back to the raw message if unrecognized.
 */
export function authErrorMessage(
  err: unknown,
  t: (k: DictKey) => string
): string {
  const raw = readMessage(err).toLowerCase();

  if (!raw) return t('error');

  // Rate limits (most common pain point during dev)
  if (raw.includes('rate limit') || raw.includes('over_email_send_rate_limit')) {
    return t('errEmailRateLimit');
  }

  // Bad credentials
  if (raw.includes('invalid login credentials') || raw.includes('invalid_credentials')) {
    return t('errBadCredentials');
  }

  // Email confirmation pending
  if (raw.includes('email not confirmed') || raw.includes('email_not_confirmed')) {
    return t('errEmailNotConfirmed');
  }

  // Captcha
  if (raw.includes('captcha')) {
    return t('errCaptcha');
  }

  // Weak password
  if (raw.includes('weak password') || raw.includes('password should be') || raw.includes('password is too short')) {
    return t('errWeakPassword');
  }

  // User already exists (signup)
  if (raw.includes('user already registered') || raw.includes('already exists')) {
    return t('errUserExists');
  }

  // Expired / invalid auth link
  if (raw.includes('token has expired') || raw.includes('expired') || raw.includes('invalid token')) {
    return t('errLinkExpired');
  }

  // Unknown — surface the raw message so we don't hide a real bug
  return readMessage(err);
}

function readMessage(err: unknown): string {
  if (err == null) return '';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return String(err);
}
