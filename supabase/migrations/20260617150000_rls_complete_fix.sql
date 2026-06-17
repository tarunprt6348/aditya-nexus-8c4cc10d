-- ============================================================
-- COMPLETE RLS FIX: Drop every known policy variant by exact name,
-- then re-create clean, owner-only governance policies.
-- Addresses: migration 140000 used wrong policy names, leaving
-- admin-inclusive policies from migration 120000 still active.
-- ============================================================

-- ── ROLE PERMISSIONS ─────────────────────────────────────────
-- From 120000: "Authenticated can read permissions", "Owners can manage permissions"
-- From 130000: "Owner can read role_permissions", "Owner can write role_permissions"
-- From 140000: "Owner can manage role_permissions" (wrong name – probably not created)
DROP POLICY IF EXISTS "Authenticated can read permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Owners can manage permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Owner can read role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Owner can write role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Owner can manage role_permissions" ON public.role_permissions;

CREATE POLICY "role_permissions_select" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "role_permissions_write_owner_only" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- ── AUDIT LOGS ───────────────────────────────────────────────
-- From 120000: "Owners can view all audit logs" (owner OR admin!), "Authenticated can insert audit logs"
-- From 140000: "Audit log owner read", "Audit log insert authenticated"
-- Wrong-name drops that probably never ran:
DROP POLICY IF EXISTS "Owners can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit log owner read" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit log insert authenticated" ON public.audit_logs;
DROP POLICY IF EXISTS "Owner can view audit logs" ON public.audit_logs;

-- Owner reads all; users only see their own events
CREATE POLICY "audit_logs_owner_read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR actor_id = auth.uid());

CREATE POLICY "audit_logs_insert_own" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- ── USER SESSIONS ─────────────────────────────────────────────
-- From 120000: "Users view own sessions; owners view all" (owner OR admin!),
--              "Users insert own sessions", "Users update own sessions"
-- From 140000: "User sessions owner read", "User sessions insert own", "User sessions update own"
-- Wrong-name: "Owner can view all sessions"
DROP POLICY IF EXISTS "Users view own sessions; owners view all" ON public.user_sessions;
DROP POLICY IF EXISTS "Users insert own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users update own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "User sessions owner read" ON public.user_sessions;
DROP POLICY IF EXISTS "User sessions insert own" ON public.user_sessions;
DROP POLICY IF EXISTS "User sessions update own" ON public.user_sessions;
DROP POLICY IF EXISTS "Owner can view all sessions" ON public.user_sessions;

CREATE POLICY "user_sessions_read" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR user_id = auth.uid());

CREATE POLICY "user_sessions_insert" ON public.user_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_sessions_update" ON public.user_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ── IMPERSONATION LOG ─────────────────────────────────────────
-- From 120000: "Owners can manage impersonation log" (owner OR admin OR impersonator!)
-- From 140000: "Impersonation log owner only" (wrong-drop target)
DROP POLICY IF EXISTS "Owners can manage impersonation log" ON public.impersonation_log;
DROP POLICY IF EXISTS "Impersonation log owner only" ON public.impersonation_log;
DROP POLICY IF EXISTS "Owner can manage impersonation log" ON public.impersonation_log;

-- Owner views all; impersonators can insert/update their own sessions
CREATE POLICY "impersonation_log_owner_read" ON public.impersonation_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR impersonator_id = auth.uid());

CREATE POLICY "impersonation_log_impersonator_write" ON public.impersonation_log
  FOR INSERT TO authenticated WITH CHECK (impersonator_id = auth.uid());

CREATE POLICY "impersonation_log_impersonator_update" ON public.impersonation_log
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR impersonator_id = auth.uid());

-- ── USER ROLES ────────────────────────────────────────────────
-- From 120000 base: "Users can view their own roles", "Admins can view all roles"
-- From 130000: "Owner or admin can view all roles", "Owner can manage all roles", "Owner can delete roles"
-- From 140000: "Owner only insert roles", "Owner only delete roles"
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owner or admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owner can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owner can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owner only insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Owner only delete roles" ON public.user_roles;
-- Keep "Users can view their own roles" from base migration

CREATE POLICY "user_roles_read_owner_and_admin" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "user_roles_insert_owner_only" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "user_roles_delete_owner_only" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- ── PROFILES ──────────────────────────────────────────────────
-- From 130000: "Owner and admin can view all profiles", "Owner can update any profile"
--              (these drop "Staff and admins can view all profiles" from base)
-- Re-affirm these with clean names (130000 should have these correct already)
DROP POLICY IF EXISTS "Owner and admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner can update any profile" ON public.profiles;

CREATE POLICY "profiles_select_own_or_manager" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_staff_role(auth.uid())
  );

CREATE POLICY "profiles_update_own_or_owner_only" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'owner'));

-- ── VERIFY EFFECTIVE POLICIES (informational) ─────────────────
-- Run this query after applying to verify no admin-inclusive policies remain:
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('role_permissions','audit_logs','user_sessions',
--                     'impersonation_log','user_roles','profiles')
-- ORDER BY tablename, policyname;
