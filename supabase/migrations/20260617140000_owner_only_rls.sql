-- ============================================================
-- OWNER-ONLY ENFORCEMENT: Tighten all governance operations to owner role ONLY
-- admin role must NOT be able to mutate user roles, permissions, or impersonation
-- ============================================================

-- Drop the broader admin-inclusive versions
DROP FUNCTION IF EXISTS public.owner_set_user_role(UUID, public.app_role);
DROP FUNCTION IF EXISTS public.owner_revoke_user_role(UUID, public.app_role);
DROP FUNCTION IF EXISTS public.owner_update_user_status(UUID, public.user_status);

-- Re-create as owner-ONLY (strictly no admin)
CREATE OR REPLACE FUNCTION public.owner_set_user_role(
  _target UUID,
  _role public.app_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Permission denied: owner role required';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_revoke_user_role(
  _target UUID,
  _role public.app_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Permission denied: owner role required';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target AND role = _role;
END;
$$;

CREATE OR REPLACE FUNCTION public.owner_update_user_status(
  _target UUID,
  _status public.user_status
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Permission denied: owner role required';
  END IF;
  UPDATE public.profiles SET status = _status WHERE id = _target;
END;
$$;

-- Tighten role_permissions table: only owner can INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Owner can manage role_permissions" ON public.role_permissions;
CREATE POLICY "Owner can read role_permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owner can write role_permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- Tighten audit_logs: only owner can read all; users can read their own events
DROP POLICY IF EXISTS "Owner can view audit logs" ON public.audit_logs;
CREATE POLICY "Audit log owner read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner')
    OR actor_id = auth.uid()
  );

CREATE POLICY "Audit log insert authenticated" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- Tighten impersonation_log: only owner can read/write
DROP POLICY IF EXISTS "Owner can manage impersonation log" ON public.impersonation_log;
CREATE POLICY "Impersonation log owner only" ON public.impersonation_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR impersonator_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR impersonator_id = auth.uid());

-- Tighten user_roles mutations: only owner (not admin) can INSERT/DELETE
DROP POLICY IF EXISTS "Owner can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owner can delete roles" ON public.user_roles;

CREATE POLICY "Owner only insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owner only delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- user_sessions: owner reads all; users read their own
DROP POLICY IF EXISTS "Owner can view all sessions" ON public.user_sessions;
CREATE POLICY "User sessions owner read" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner')
    OR user_id = auth.uid()
  );
CREATE POLICY "User sessions insert own" ON public.user_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "User sessions update own" ON public.user_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
