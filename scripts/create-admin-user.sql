-- ============================================================
-- Aditya Constructions — Create Portal Owner Account
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

DO $$
DECLARE
  v_user_id  uuid := 'e893ef74-9bf4-4fa4-a2d0-d094007be956';
  v_email    text := 'owner@adityaconstructions.in';
  v_password text := 'Aditya@Portal2024';
  v_name     text := 'Aditya Owner';
BEGIN

  -- 1. Create auth user (bcrypt via pgcrypto — always available in Supabase)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    NOW(),                         -- email pre-confirmed
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', v_name),
    NOW(),
    NOW(),
    '', '', '', ''
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create email identity
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    '6822121d-0e6c-4844-a2d3-0edd160a9e22',
    v_user_id,
    v_email,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- 3. Create profile (trigger may already handle this — ON CONFLICT is safe)
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (v_user_id, v_name, '+91-9000000001')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- 4. Assign Owner role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'owner')
  ON CONFLICT (user_id) DO UPDATE SET role = 'owner';

  RAISE NOTICE 'SUCCESS — Owner account created: %', v_email;
END;
$$;
