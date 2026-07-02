-- ============================================================
-- ADITYA CONSTRUCTIONS — PROFILE & ROLE SEED
-- Run this AFTER the migrations have been applied.
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- Upsert profiles
INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
VALUES
  ('25bab248-2845-4c67-8c65-d674120b67c7', 'Aditya Owner',      '+91-9000000001', now(), now()),
  ('6ed29f27-f975-456a-a87a-d4a619fa7493', 'Operations Manager','+91-9000000002', now(), now()),
  ('b05836e8-f1e4-45c5-b59c-4e8f3db3b53c', 'Rahul Sharma',      '+91-9811001001', now(), now()),
  ('95ec572b-c804-488e-977d-6f21cd9bf349', 'Priya Gupta',       '+91-9811001002', now(), now()),
  ('a55461da-4780-4624-8854-6ad7eb8fbc3b', 'Amit Singh',        '+91-9811001003', now(), now()),
  ('85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01', 'Neha Verma',        '+91-9811001004', now(), now()),
  ('fbbe86ee-0d2b-4de8-ab31-8d1daa807685', 'Deepak Joshi',      '+91-9811001008', now(), now()),
  ('85610fb3-06ae-43b7-93c4-1e98bb98dae3', 'Kavya Nair',        '+91-9811001009', now(), now()),
  ('742b15de-6ed8-46e5-86b4-577c91c8136d', 'Arjun Mehta',       '+91-9811001010', now(), now()),
  ('774c222a-c67b-494c-8738-a9c5fa17dd1f', 'Kiran Reddy',       '+91-9811001015', now(), now())
ON CONFLICT (id) DO UPDATE SET
  full_name  = EXCLUDED.full_name,
  phone      = EXCLUDED.phone,
  updated_at = now();

-- Upsert roles
INSERT INTO public.user_roles (user_id, role, created_at)
VALUES
  ('25bab248-2845-4c67-8c65-d674120b67c7', 'owner',             now()),
  ('6ed29f27-f975-456a-a87a-d4a619fa7493', 'operations_manager',now()),
  ('b05836e8-f1e4-45c5-b59c-4e8f3db3b53c', 'hr_manager',        now()),
  ('95ec572b-c804-488e-977d-6f21cd9bf349', 'project_manager',   now()),
  ('a55461da-4780-4624-8854-6ad7eb8fbc3b', 'site_engineer',     now()),
  ('85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01', 'sales_executive',   now()),
  ('fbbe86ee-0d2b-4de8-ab31-8d1daa807685', 'sales_manager',     now()),
  ('85610fb3-06ae-43b7-93c4-1e98bb98dae3', 'customer_support',  now()),
  ('742b15de-6ed8-46e5-86b4-577c91c8136d', 'accountant',        now()),
  ('774c222a-c67b-494c-8738-a9c5fa17dd1f', 'staff',             now())
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role;

-- Verify
SELECT
  au.email,
  p.full_name,
  ur.role
FROM auth.users au
LEFT JOIN public.profiles   p  ON p.id       = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE au.email LIKE '%adityaconstruction.com'
ORDER BY ur.role;
