-- ============================================================
-- Aditya Constructions Demo Account Seed Script
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- STEP 1: Insert auth.users
-- ============================================================
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_user_meta_data, raw_app_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change
)
VALUES
  (
    'f5724f63-d3f2-4529-9b12-748c623c5dab',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'owner@adityaconstruction.com',
    crypt('Owner@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Aditya Owner"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    '864745aa-55c6-4764-bbe3-a2bff20fc101',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'operations@adityaconstruction.com',
    crypt('Ops@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Operations Manager"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    '26b3b29f-294e-4e47-8fba-eb30346b8d2e',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'rahul.sharma@adityaconstruction.com',
    crypt('Staff@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Rahul Sharma"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    '2c302cfe-3786-435c-898a-b227a8bfd0b7',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'priya.gupta@adityaconstruction.com',
    crypt('Staff@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Priya Gupta"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    'cba56331-dd1e-4d45-9590-56dd0b401715',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'amit.singh@adityaconstruction.com',
    crypt('Staff@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Amit Singh"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    '2166bb12-2b92-4c87-883d-726b192371a7',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'neha.verma@adityaconstruction.com',
    crypt('Staff@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Neha Verma"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    '98560831-4fd2-4adf-b6cf-df02de3e9cb5',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'vikram.patel@adityaconstruction.com',
    crypt('Staff@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Vikram Patel"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    '949d2025-f9fd-4e90-87ad-7f28bad63b4d',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'ananya.rao@adityaconstruction.com',
    crypt('Staff@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Ananya Rao"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    '805be7bc-94f9-446d-b7b2-4bc187b04380',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'suresh.kumar@adityaconstruction.com',
    crypt('Staff@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Suresh Kumar"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    'dcbfae6d-8dae-460c-a17b-4185e8af8837',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'deepak.joshi@adityaconstruction.com',
    crypt('Staff@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Deepak Joshi"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    '59afabec-c6b8-4dab-a8ea-3df42388f65b',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'kavya.nair@adityaconstruction.com',
    crypt('Staff@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Kavya Nair"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    'feea9376-7a8e-4e6e-821f-8cd8b64fe5a8',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'arjun.mehta@adityaconstruction.com',
    crypt('Staff@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Arjun Mehta"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    '700d9665-2d92-41c1-b18e-3983288357ab',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'pooja.sharma@adityaconstruction.com',
    crypt('Staff@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Pooja Sharma"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    '39237c19-1a03-42f3-9e5d-c94bae883e8f',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'rohit.agarwal@adityaconstruction.com',
    crypt('Staff@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Rohit Agarwal"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    '9169f9fc-cfa9-46f3-af78-fab1150165e4',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'sanjay.tiwari@adityaconstruction.com',
    crypt('Staff@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Sanjay Tiwari"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    'ed298ef4-78c0-4016-b2f4-53f48dc64b10',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'meena.patel@adityaconstruction.com',
    crypt('Staff@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Meena Patel"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  ),
  (
    '45b7bdec-1e30-4841-88ae-34fb0e9d9c13',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'kiran.reddy@adityaconstruction.com',
    crypt('Staff@123', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name":"Kiran Reddy"}', '{"provider":"email","providers":["email"]}',
    false, '', '', '', ''
  )
ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  updated_at = now();

-- ============================================================
-- STEP 2: Insert auth.identities (email provider)
-- ============================================================
INSERT INTO auth.identities (
  id, user_id, provider_id, provider,
  identity_data, last_sign_in_at, created_at, updated_at
)
VALUES
  ('f5724f63-d3f2-4529-9b12-748c623c5dab', 'f5724f63-d3f2-4529-9b12-748c623c5dab', 'owner@adityaconstruction.com', 'email', '{"sub":"f5724f63-d3f2-4529-9b12-748c623c5dab","email":"owner@adityaconstruction.com"}', now(), now(), now()),
  ('864745aa-55c6-4764-bbe3-a2bff20fc101', '864745aa-55c6-4764-bbe3-a2bff20fc101', 'operations@adityaconstruction.com', 'email', '{"sub":"864745aa-55c6-4764-bbe3-a2bff20fc101","email":"operations@adityaconstruction.com"}', now(), now(), now()),
  ('26b3b29f-294e-4e47-8fba-eb30346b8d2e', '26b3b29f-294e-4e47-8fba-eb30346b8d2e', 'rahul.sharma@adityaconstruction.com', 'email', '{"sub":"26b3b29f-294e-4e47-8fba-eb30346b8d2e","email":"rahul.sharma@adityaconstruction.com"}', now(), now(), now()),
  ('2c302cfe-3786-435c-898a-b227a8bfd0b7', '2c302cfe-3786-435c-898a-b227a8bfd0b7', 'priya.gupta@adityaconstruction.com', 'email', '{"sub":"2c302cfe-3786-435c-898a-b227a8bfd0b7","email":"priya.gupta@adityaconstruction.com"}', now(), now(), now()),
  ('cba56331-dd1e-4d45-9590-56dd0b401715', 'cba56331-dd1e-4d45-9590-56dd0b401715', 'amit.singh@adityaconstruction.com', 'email', '{"sub":"cba56331-dd1e-4d45-9590-56dd0b401715","email":"amit.singh@adityaconstruction.com"}', now(), now(), now()),
  ('2166bb12-2b92-4c87-883d-726b192371a7', '2166bb12-2b92-4c87-883d-726b192371a7', 'neha.verma@adityaconstruction.com', 'email', '{"sub":"2166bb12-2b92-4c87-883d-726b192371a7","email":"neha.verma@adityaconstruction.com"}', now(), now(), now()),
  ('98560831-4fd2-4adf-b6cf-df02de3e9cb5', '98560831-4fd2-4adf-b6cf-df02de3e9cb5', 'vikram.patel@adityaconstruction.com', 'email', '{"sub":"98560831-4fd2-4adf-b6cf-df02de3e9cb5","email":"vikram.patel@adityaconstruction.com"}', now(), now(), now()),
  ('949d2025-f9fd-4e90-87ad-7f28bad63b4d', '949d2025-f9fd-4e90-87ad-7f28bad63b4d', 'ananya.rao@adityaconstruction.com', 'email', '{"sub":"949d2025-f9fd-4e90-87ad-7f28bad63b4d","email":"ananya.rao@adityaconstruction.com"}', now(), now(), now()),
  ('805be7bc-94f9-446d-b7b2-4bc187b04380', '805be7bc-94f9-446d-b7b2-4bc187b04380', 'suresh.kumar@adityaconstruction.com', 'email', '{"sub":"805be7bc-94f9-446d-b7b2-4bc187b04380","email":"suresh.kumar@adityaconstruction.com"}', now(), now(), now()),
  ('dcbfae6d-8dae-460c-a17b-4185e8af8837', 'dcbfae6d-8dae-460c-a17b-4185e8af8837', 'deepak.joshi@adityaconstruction.com', 'email', '{"sub":"dcbfae6d-8dae-460c-a17b-4185e8af8837","email":"deepak.joshi@adityaconstruction.com"}', now(), now(), now()),
  ('59afabec-c6b8-4dab-a8ea-3df42388f65b', '59afabec-c6b8-4dab-a8ea-3df42388f65b', 'kavya.nair@adityaconstruction.com', 'email', '{"sub":"59afabec-c6b8-4dab-a8ea-3df42388f65b","email":"kavya.nair@adityaconstruction.com"}', now(), now(), now()),
  ('feea9376-7a8e-4e6e-821f-8cd8b64fe5a8', 'feea9376-7a8e-4e6e-821f-8cd8b64fe5a8', 'arjun.mehta@adityaconstruction.com', 'email', '{"sub":"feea9376-7a8e-4e6e-821f-8cd8b64fe5a8","email":"arjun.mehta@adityaconstruction.com"}', now(), now(), now()),
  ('700d9665-2d92-41c1-b18e-3983288357ab', '700d9665-2d92-41c1-b18e-3983288357ab', 'pooja.sharma@adityaconstruction.com', 'email', '{"sub":"700d9665-2d92-41c1-b18e-3983288357ab","email":"pooja.sharma@adityaconstruction.com"}', now(), now(), now()),
  ('39237c19-1a03-42f3-9e5d-c94bae883e8f', '39237c19-1a03-42f3-9e5d-c94bae883e8f', 'rohit.agarwal@adityaconstruction.com', 'email', '{"sub":"39237c19-1a03-42f3-9e5d-c94bae883e8f","email":"rohit.agarwal@adityaconstruction.com"}', now(), now(), now()),
  ('9169f9fc-cfa9-46f3-af78-fab1150165e4', '9169f9fc-cfa9-46f3-af78-fab1150165e4', 'sanjay.tiwari@adityaconstruction.com', 'email', '{"sub":"9169f9fc-cfa9-46f3-af78-fab1150165e4","email":"sanjay.tiwari@adityaconstruction.com"}', now(), now(), now()),
  ('ed298ef4-78c0-4016-b2f4-53f48dc64b10', 'ed298ef4-78c0-4016-b2f4-53f48dc64b10', 'meena.patel@adityaconstruction.com', 'email', '{"sub":"ed298ef4-78c0-4016-b2f4-53f48dc64b10","email":"meena.patel@adityaconstruction.com"}', now(), now(), now()),
  ('45b7bdec-1e30-4841-88ae-34fb0e9d9c13', '45b7bdec-1e30-4841-88ae-34fb0e9d9c13', 'kiran.reddy@adityaconstruction.com', 'email', '{"sub":"45b7bdec-1e30-4841-88ae-34fb0e9d9c13","email":"kiran.reddy@adityaconstruction.com"}', now(), now(), now())
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ============================================================
-- STEP 3: Upsert public.profiles
-- ============================================================
INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
VALUES
  ('f5724f63-d3f2-4529-9b12-748c623c5dab', 'Aditya Owner', '+91-9000000001', now(), now()),
  ('864745aa-55c6-4764-bbe3-a2bff20fc101', 'Operations Manager', '+91-9000000002', now(), now()),
  ('26b3b29f-294e-4e47-8fba-eb30346b8d2e', 'Rahul Sharma', '+91-9811001001', now(), now()),
  ('2c302cfe-3786-435c-898a-b227a8bfd0b7', 'Priya Gupta', '+91-9811001002', now(), now()),
  ('cba56331-dd1e-4d45-9590-56dd0b401715', 'Amit Singh', '+91-9811001003', now(), now()),
  ('2166bb12-2b92-4c87-883d-726b192371a7', 'Neha Verma', '+91-9811001004', now(), now()),
  ('98560831-4fd2-4adf-b6cf-df02de3e9cb5', 'Vikram Patel', '+91-9811001005', now(), now()),
  ('949d2025-f9fd-4e90-87ad-7f28bad63b4d', 'Ananya Rao', '+91-9811001006', now(), now()),
  ('805be7bc-94f9-446d-b7b2-4bc187b04380', 'Suresh Kumar', '+91-9811001007', now(), now()),
  ('dcbfae6d-8dae-460c-a17b-4185e8af8837', 'Deepak Joshi', '+91-9811001008', now(), now()),
  ('59afabec-c6b8-4dab-a8ea-3df42388f65b', 'Kavya Nair', '+91-9811001009', now(), now()),
  ('feea9376-7a8e-4e6e-821f-8cd8b64fe5a8', 'Arjun Mehta', '+91-9811001010', now(), now()),
  ('700d9665-2d92-41c1-b18e-3983288357ab', 'Pooja Sharma', '+91-9811001011', now(), now()),
  ('39237c19-1a03-42f3-9e5d-c94bae883e8f', 'Rohit Agarwal', '+91-9811001012', now(), now()),
  ('9169f9fc-cfa9-46f3-af78-fab1150165e4', 'Sanjay Tiwari', '+91-9811001013', now(), now()),
  ('ed298ef4-78c0-4016-b2f4-53f48dc64b10', 'Meena Patel', '+91-9811001014', now(), now()),
  ('45b7bdec-1e30-4841-88ae-34fb0e9d9c13', 'Kiran Reddy', '+91-9811001015', now(), now())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  updated_at = now();

-- ============================================================
-- STEP 4: Assign roles in public.user_roles
-- ============================================================
INSERT INTO public.user_roles (user_id, role, created_at)
VALUES
  ('f5724f63-d3f2-4529-9b12-748c623c5dab', 'owner', now()),
  ('864745aa-55c6-4764-bbe3-a2bff20fc101', 'operations_manager', now()),
  ('26b3b29f-294e-4e47-8fba-eb30346b8d2e', 'hr_manager', now()),
  ('2c302cfe-3786-435c-898a-b227a8bfd0b7', 'project_manager', now()),
  ('cba56331-dd1e-4d45-9590-56dd0b401715', 'site_engineer', now()),
  ('2166bb12-2b92-4c87-883d-726b192371a7', 'sales_executive', now()),
  ('98560831-4fd2-4adf-b6cf-df02de3e9cb5', 'general_staff', now()),
  ('949d2025-f9fd-4e90-87ad-7f28bad63b4d', 'general_staff', now()),
  ('805be7bc-94f9-446d-b7b2-4bc187b04380', 'general_staff', now()),
  ('dcbfae6d-8dae-460c-a17b-4185e8af8837', 'sales_manager', now()),
  ('59afabec-c6b8-4dab-a8ea-3df42388f65b', 'customer_support', now()),
  ('feea9376-7a8e-4e6e-821f-8cd8b64fe5a8', 'accountant', now()),
  ('700d9665-2d92-41c1-b18e-3983288357ab', 'marketing_manager', now()),
  ('39237c19-1a03-42f3-9e5d-c94bae883e8f', 'site_engineer', now()),
  ('9169f9fc-cfa9-46f3-af78-fab1150165e4', 'project_manager', now()),
  ('ed298ef4-78c0-4016-b2f4-53f48dc64b10', 'sales_executive', now()),
  ('45b7bdec-1e30-4841-88ae-34fb0e9d9c13', 'staff', now())
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role;

-- ============================================================
-- DONE! Verify with:
-- SELECT u.email, ur.role FROM auth.users u
-- JOIN public.user_roles ur ON ur.user_id = u.id
-- ORDER BY ur.role;
-- ============================================================

