
-- 1) Profiles: replace public SELECT with own-profile + admin
DROP POLICY IF EXISTS "Public profiles viewable" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 2) Tighten always-true INSERT policies
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND length(email) BETWEEN 3 AND 255 AND email LIKE '%_@_%.__%');

DROP POLICY IF EXISTS "Anyone can submit" ON public.contact_submissions;
CREATE POLICY "Anyone can submit" ON public.contact_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL AND length(email) BETWEEN 3 AND 255
    AND name IS NOT NULL AND length(name) BETWEEN 1 AND 200
    AND message IS NOT NULL AND length(message) BETWEEN 1 AND 5000
  );

-- 3) Revoke execute on internal trigger functions (called by triggers as owner; not needed by clients)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_order_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
