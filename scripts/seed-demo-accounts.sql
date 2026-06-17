-- ==========================================================================
-- DEMO ACCOUNT SEED SCRIPT — Aditya Constructions Enterprise Platform
-- ==========================================================================
-- INSTRUCTIONS:
--   1. Run this in Supabase SQL Editor (NOT in psql — requires auth.users)
--   2. For each demo account, create the auth user manually via:
--      Supabase Dashboard → Authentication → Users → Invite user / Add user
--      Then run the role assignment queries below.
--   3. Default password for all accounts: Demo@1234
-- ==========================================================================

-- After creating each auth user, find their UUID from auth.users and run:
-- REPLACE <uuid-here> with the actual UUID from auth.users

-- ── OWNER ──────────────────────────────────────────────────────────────────
-- Email: owner@adityaconstructions.com
-- After creating the user, assign role:
DO $$
DECLARE _uid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'owner@adityaconstructions.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _uid;
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'owner');
    UPDATE public.profiles SET full_name = 'Aditya Sharma', department = 'Executive' WHERE id = _uid;
    RAISE NOTICE 'owner assigned to %', _uid;
  ELSE
    RAISE NOTICE 'owner@adityaconstructions.com not found — create the auth user first';
  END IF;
END$$;

-- ── ADMIN ──────────────────────────────────────────────────────────────────
-- Email: admin@adityaconstructions.com
DO $$
DECLARE _uid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'admin@adityaconstructions.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _uid;
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'admin');
    UPDATE public.profiles SET full_name = 'Admin User', department = 'Operations' WHERE id = _uid;
  END IF;
END$$;

-- ── MANAGING DIRECTOR ──────────────────────────────────────────────────────
-- Email: md@adityaconstructions.com
DO $$
DECLARE _uid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'md@adityaconstructions.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _uid;
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'managing_director');
    UPDATE public.profiles SET full_name = 'Rajesh Mehta', department = 'Executive' WHERE id = _uid;
  END IF;
END$$;

-- ── OPERATIONS MANAGER ─────────────────────────────────────────────────────
-- Email: ops@adityaconstructions.com
DO $$
DECLARE _uid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'ops@adityaconstructions.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _uid;
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'operations_manager');
    UPDATE public.profiles SET full_name = 'Priya Nair', department = 'Operations' WHERE id = _uid;
  END IF;
END$$;

-- ── HR MANAGER ─────────────────────────────────────────────────────────────
-- Email: hr@adityaconstructions.com
DO $$
DECLARE _uid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'hr@adityaconstructions.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _uid;
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'hr_manager');
    UPDATE public.profiles SET full_name = 'Sunita Rao', department = 'HR' WHERE id = _uid;
  END IF;
END$$;

-- ── SALES MANAGER ──────────────────────────────────────────────────────────
-- Email: sales@adityaconstructions.com
DO $$
DECLARE _uid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'sales@adityaconstructions.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _uid;
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'sales_manager');
    UPDATE public.profiles SET full_name = 'Vikram Singh', department = 'Sales' WHERE id = _uid;
  END IF;
END$$;

-- ── MARKETING MANAGER ──────────────────────────────────────────────────────
-- Email: mkt@adityaconstructions.com
DO $$
DECLARE _uid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'mkt@adityaconstructions.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _uid;
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'marketing_manager');
    UPDATE public.profiles SET full_name = 'Ananya Desai', department = 'Marketing' WHERE id = _uid;
  END IF;
END$$;

-- ── ACCOUNTANT ─────────────────────────────────────────────────────────────
-- Email: accounts@adityaconstructions.com
DO $$
DECLARE _uid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'accounts@adityaconstructions.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _uid;
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'accountant');
    UPDATE public.profiles SET full_name = 'Deepak Joshi', department = 'Finance' WHERE id = _uid;
  END IF;
END$$;

-- ── SALES EXECUTIVE ────────────────────────────────────────────────────────
-- Email: salexec@adityaconstructions.com
DO $$
DECLARE _uid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'salexec@adityaconstructions.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _uid;
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'sales_executive');
    UPDATE public.profiles SET full_name = 'Ravi Kumar', department = 'Sales' WHERE id = _uid;
  END IF;
END$$;

-- ── PROJECT MANAGER ────────────────────────────────────────────────────────
-- Email: pm@adityaconstructions.com
DO $$
DECLARE _uid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'pm@adityaconstructions.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _uid;
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'project_manager');
    UPDATE public.profiles SET full_name = 'Kavitha Reddy', department = 'Projects' WHERE id = _uid;
  END IF;
END$$;

-- ── SITE ENGINEER ──────────────────────────────────────────────────────────
-- Email: engineer@adityaconstructions.com
DO $$
DECLARE _uid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'engineer@adityaconstructions.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _uid;
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'site_engineer');
    UPDATE public.profiles SET full_name = 'Arjun Patil', department = 'Engineering' WHERE id = _uid;
  END IF;
END$$;

-- ── CUSTOMER SUPPORT ───────────────────────────────────────────────────────
-- Email: support@adityaconstructions.com
DO $$
DECLARE _uid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'support@adityaconstructions.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _uid;
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'customer_support');
    UPDATE public.profiles SET full_name = 'Meena Thomas', department = 'Support' WHERE id = _uid;
  END IF;
END$$;

-- ── GENERAL STAFF ──────────────────────────────────────────────────────────
-- Email: staff@adityaconstructions.com
DO $$
DECLARE _uid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'staff@adityaconstructions.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _uid;
    INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'general_staff');
    UPDATE public.profiles SET full_name = 'Ramesh Gupta', department = 'General' WHERE id = _uid;
  END IF;
END$$;

-- ==========================================================================
-- VERIFY ASSIGNMENTS
-- ==========================================================================
SELECT
  p.full_name,
  p.email,
  ur.role,
  p.department
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id
WHERE p.email IN (
  'owner@adityaconstructions.com',
  'admin@adityaconstructions.com',
  'md@adityaconstructions.com',
  'ops@adityaconstructions.com',
  'hr@adityaconstructions.com',
  'sales@adityaconstructions.com',
  'mkt@adityaconstructions.com',
  'accounts@adityaconstructions.com',
  'salexec@adityaconstructions.com',
  'pm@adityaconstructions.com',
  'engineer@adityaconstructions.com',
  'support@adityaconstructions.com',
  'staff@adityaconstructions.com'
)
ORDER BY ur.role;
