
-- Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Replace overly permissive INSERT policies with validated checks
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT TO anon, authenticated
  WITH CHECK (length(trim(name)) BETWEEN 1 AND 200 AND length(trim(email)) BETWEEN 3 AND 200 AND email LIKE '%@%');

DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact" ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (length(trim(name)) BETWEEN 1 AND 200 AND length(trim(email)) BETWEEN 3 AND 200 AND email LIKE '%@%' AND length(message) BETWEEN 1 AND 5000);

DROP POLICY IF EXISTS "Anyone can request a quote" ON public.quote_requests;
CREATE POLICY "Anyone can request a quote" ON public.quote_requests FOR INSERT TO anon, authenticated
  WITH CHECK (length(trim(name)) BETWEEN 1 AND 200 AND length(trim(email)) BETWEEN 3 AND 200 AND email LIKE '%@%' AND length(trim(phone)) BETWEEN 6 AND 20 AND length(requirements) BETWEEN 1 AND 5000);
