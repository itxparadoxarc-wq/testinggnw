
-- Trigger-only functions should not be callable via the API.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_order_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- has_role is used inside RLS policies; keep authenticated access for policy evaluation but remove anon.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- password_reset_codes: service_role only; deny everyone else via a restrictive policy so RLS is enforced.
CREATE POLICY "Deny direct access" ON public.password_reset_codes FOR ALL USING (false) WITH CHECK (false);
