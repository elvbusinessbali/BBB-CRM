import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Handles email-link auth callbacks. Supabase sends users here with one of two
 * shapes depending on the flow:
 *
 *  1. OAuth / PKCE code flow:        ?code=...&next=/somewhere
 *  2. Email OTP flow (signup        ?token_hash=...&type=recovery&next=/reset-password
 *     confirmation, password
 *     recovery, magic links,
 *     invites, email change)
 *
 * We support both, exchange or verify, set the session cookie, then forward to
 * ?next= (defaults to /dashboard).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = url.searchParams.get('next') || '/dashboard';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });

  let error: unknown = null;

  if (code) {
    // PKCE / OAuth flow
    const { error: e } = await supabase.auth.exchangeCodeForSession(code);
    error = e;
  } else if (tokenHash && type) {
    // Email OTP flow (recovery / signup / invite / magiclink / email_change)
    const { error: e } = await supabase.auth.verifyOtp({
      // type is validated by Supabase server-side; cast keeps TS happy
      type: type as 'recovery' | 'signup' | 'invite' | 'magiclink' | 'email_change',
      token_hash: tokenHash,
    });
    error = e;
  } else {
    // No usable params — bounce to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (error) {
    const failUrl = new URL('/login', request.url);
    failUrl.searchParams.set('error', 'invalid_link');
    return NextResponse.redirect(failUrl);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
