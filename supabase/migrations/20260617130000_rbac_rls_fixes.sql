-- ============================================================
-- RBAC RLS FIXES: owner-gated mutations + secure RPCs
-- ============================================================

-- Allow owners to view all user_roles (and use in joins)
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Owner or admin can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id
    OR public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'admin'));

-- Owner/admin can insert and delete user_roles (for user management)
CREATE POLICY "Owner can manage all roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Owner can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'admin')
  );

-- Allow owner/admin to update any profile (status, department, etc.)
DROP POLICY IF EXISTS "Staff and admins can view all profiles" ON public.profiles;
CREATE POLICY "Owner and admin can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_staff_role(auth.uid())
  );

CREATE POLICY "Owner can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    auth.uid() = id
    OR public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'admin')
  );

-- ============================================================
-- SECURE owner-gated RPCs (SECURITY DEFINER = bypass RLS safely)
-- ============================================================

-- Assign a role to a user (owner only)
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
  IF NOT (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Permission denied: requires owner or admin role';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Revoke a specific role from a user (owner only)
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
  IF NOT (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Permission denied: requires owner or admin role';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target AND role = _role;
END;
$$;

-- Update user status (owner only)
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
  IF NOT (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Permission denied: requires owner or admin role';
  END IF;
  UPDATE public.profiles SET status = _status WHERE id = _target;
END;
$$;

-- Add email column to profiles (for display in user management)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update handle_new_user to capture email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
    ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Record user session on each auth event (called from client init)
CREATE OR REPLACE FUNCTION public.record_user_session(
  _user_agent TEXT DEFAULT NULL,
  _device_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _session_id UUID;
BEGIN
  INSERT INTO public.user_sessions (user_id, user_agent, device_type)
  VALUES (auth.uid(), _user_agent, _device_type)
  RETURNING id INTO _session_id;

  UPDATE public.profiles SET last_seen = now() WHERE id = auth.uid();
  RETURN _session_id;
END;
$$;

-- Update last_seen + session last_seen
CREATE OR REPLACE FUNCTION public.touch_session(_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions
    SET last_seen = now()
    WHERE id = _session_id AND user_id = auth.uid();
  UPDATE public.profiles SET last_seen = now() WHERE id = auth.uid();
END;
$$;
