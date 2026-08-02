// Server-only helper that returns the privileged Supabase client with a clear,
// user-facing error when the deployment has no service-role key configured.
// Everything else in the app runs on the committed public backend config, so this
// is the only feature that can require a platform secret.
import { supabaseAdmin } from '@/integrations/supabase/client.server';

export function hasAdminCredentials(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getAdminClient() {
  if (!hasAdminCredentials()) {
    throw new Error(
      'Account management is unavailable on this deployment because SUPABASE_SERVICE_ROLE_KEY is not set. Add it as an environment variable on your hosting platform to enable creating and managing admin accounts.',
    );
  }
  return supabaseAdmin;
}
