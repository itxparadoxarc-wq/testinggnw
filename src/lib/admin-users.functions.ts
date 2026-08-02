import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const listAdmins = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import('@/lib/admin-auth.server');
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    const { data: roles, error } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')
      .eq('role', 'admin');
    if (error) throw new Error(error.message);

    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length === 0) return [] as Array<{ id: string; email: string; full_name: string | null; created_at: string; last_sign_in_at: string | null }>;

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, full_name, created_at')
      .in('user_id', ids);

    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });

    return ids.map((id) => {
      const p = profiles?.find((x) => x.user_id === id);
      const u = authList?.users.find((x) => x.id === id);
      return {
        id,
        email: p?.email ?? u?.email ?? '—',
        full_name: p?.full_name ?? (u?.user_metadata?.full_name as string) ?? null,
        created_at: p?.created_at ?? u?.created_at ?? '',
        last_sign_in_at: u?.last_sign_in_at ?? null,
      };
    });
  });

export const createAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(72),
        full_name: z.string().trim().max(100).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import('@/lib/admin-auth.server');
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name ?? '' },
    });
    if (error || !created.user) throw new Error(error?.message ?? 'Failed to create user');

    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: created.user.id, role: 'admin' });
    if (roleError) throw new Error(roleError.message);

    return { id: created.user.id };
  });

export const promoteToAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().trim().email().max(255) }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import('@/lib/admin-auth.server');
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('email', data.email)
      .maybeSingle();
    if (!profile) throw new Error('No account found with that email');

    const { error } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: profile.user_id, role: 'admin' }, { onConflict: 'user_id,role' });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokeAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import('@/lib/admin-auth.server');
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error('You cannot revoke your own admin access');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', data.userId)
      .eq('role', 'admin');
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAdminAccount = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import('@/lib/admin-auth.server');
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error('You cannot delete your own account');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetAdminPassword = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ userId: z.string().uuid(), password: z.string().min(8).max(72) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import('@/lib/admin-auth.server');
    await assertAdmin(context);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
