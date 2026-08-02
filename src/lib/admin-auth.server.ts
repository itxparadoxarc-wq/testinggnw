export async function assertAdmin(context: {
  supabase: { rpc: (name: string, params: Record<string, string>) => PromiseLike<{ data: unknown; error: unknown }> };
  userId: string;
}) {
  const { data, error } = await context.supabase.rpc('has_role', {
    _user_id: context.userId,
    _role: 'admin',
  });

  if (error || data !== true) {
    throw new Error('Forbidden: admin access required');
  }
}