import { supabase } from '@/integrations/supabase/client';

/** Returns the current user's access token (empty string when signed out). */
export async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? '';
}
