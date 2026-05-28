/**
 * Supabase's default email templates ({{ .ConfirmationURL }}) land users at
 * /auth/confirm — NOT /auth/callback. Both routes share the same handler so
 * password reset, signup confirmation, magic links, etc. all work regardless
 * of which path the email link uses.
 */
export { GET } from '../callback/route';
