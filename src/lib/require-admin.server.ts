/**
 * Verifies that an incoming request carries a valid Supabase session belonging
 * to a user with the `admin` role. Used to protect privileged server routes.
 */
const SUPABASE_URL = () => process.env.SUPABASE_URL as string | undefined;
const SUPABASE_KEY = () =>
  (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY) as string | undefined;

export interface AdminCheck {
  ok: boolean;
  userId?: string;
  response?: Response;
}

const deny = (status: number, error: string): AdminCheck => ({
  ok: false,
  response: Response.json({ error }, { status }),
});

export async function requireAdmin(request: Request): Promise<AdminCheck> {
  const url = SUPABASE_URL();
  const key = SUPABASE_KEY();
  if (!url || !key) return deny(500, 'Server auth is not configured.');

  const header = request.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';

  // Reject the publishable/anon API key being used as a session token.
  if (!token || token === key || token.startsWith('sb_publishable_') || token.startsWith('sb_secret_')) {
    return deny(401, 'Authentication required.');
  }

  let userId: string;
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: key, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return deny(401, 'Authentication required.');
    const user = (await res.json()) as { id?: string };
    if (!user?.id) return deny(401, 'Authentication required.');
    userId = user.id;
  } catch {
    return deny(401, 'Authentication required.');
  }

  try {
    const res = await fetch(`${url}/rest/v1/rpc/has_role`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ _user_id: userId, _role: 'admin' }),
    });
    if (!res.ok) return deny(403, 'Admin access required.');
    const isAdmin = (await res.json()) === true;
    if (!isAdmin) return deny(403, 'Admin access required.');
  } catch {
    return deny(403, 'Admin access required.');
  }

  return { ok: true, userId };
}
