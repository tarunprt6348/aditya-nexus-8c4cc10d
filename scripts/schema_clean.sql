-- ============================================================
-- ADITYA CONSTRUCTIONS — CLEAN SCHEMA
-- ============================================================
-- Run on a brand-new Supabase project:
--   Dashboard → SQL Editor → New Query → paste → Run
--
-- Idempotent: safe to re-run (CREATE … IF NOT EXISTS,
-- DROP … IF EXISTS, ALTER … ADD COLUMN IF NOT EXISTS).
-- Does NOT include demo user data — run seed_demo_data.sql
-- separately after creating auth accounts (see demo_accounts.md).
-- ============================================================


-- ============================================================
-- SECTION 1: ENUMS
-- ============================================================

-- app_role — full 15-value enterprise set
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'owner', 'admin', 'managing_director', 'operations_manager',
    'hr_manager', 'sales_manager', 'sales_executive', 'marketing_manager',
    'accountant', 'project_manager', 'site_engineer', 'customer_support',
    'general_staff', 'staff', 'customer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- Ensure every value exists even if enum was created with fewer values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'managing_director';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_executive';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accountant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'site_engineer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer_support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'general_staff';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';

DO $$ BEGIN CREATE TYPE public.user_status AS ENUM (
  'active', 'inactive', 'suspended', 'pending_verification'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.lead_status AS ENUM (
  'new', 'contacted', 'qualified', 'converted', 'lost'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.quote_status AS ENUM (
  'pending', 'reviewing', 'quoted', 'accepted', 'rejected'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.project_status AS ENUM (
  'planning', 'in_progress', 'on_hold', 'completed', 'cancelled'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.milestone_status AS ENUM (
  'pending', 'in_progress', 'completed', 'delayed'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.ticket_status AS ENUM (
  'open', 'in_progress', 'resolved', 'closed'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.ticket_priority AS ENUM (
  'low', 'medium', 'high', 'urgent'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.service_type AS ENUM (
  'construction', 'interiors', 'real_estate', 'hvac', 'solar'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE public.task_status AS ENUM (
  'todo', 'in_progress', 'done', 'blocked'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- SECTION 2: UTILITY FUNCTIONS (no table dependencies)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;


-- ============================================================
-- SECTION 3: CORE TABLES — profiles, user_roles
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID              PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  company     TEXT,
  avatar_url  TEXT,
  email       TEXT,
  status      public.user_status NOT NULL DEFAULT 'active',
  department  TEXT,
  employee_id TEXT,
  bio         TEXT,
  last_seen   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ       NOT NULL DEFAULT now()
);
-- Backfill columns absent in partial-migration databases
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email       TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status      public.user_status NOT NULL DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department  TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio         TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen   TIMESTAMPTZ;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE TRIGGER trg_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at TIMESTAMPTZ     NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- SECTION 4: SECURITY FUNCTIONS (depend on user_roles)
-- ============================================================

-- has_role(_role, _user_id): _user_id defaults to auth.uid()
-- Call as: has_role('owner') or has_role('owner', some_uuid)
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role);
CREATE OR REPLACE FUNCTION public.has_role(
  _role    public.app_role,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(public.app_role, UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(public.app_role, UUID) TO authenticated, service_role;


-- is_admin_role: management-tier roles that access the admin portal
CREATE OR REPLACE FUNCTION public.is_admin_role(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'owner', 'admin', 'managing_director', 'operations_manager',
        'hr_manager', 'sales_manager', 'marketing_manager', 'accountant'
      )
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_admin_role(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_admin_role(UUID) TO authenticated, service_role;


-- is_staff_role: all internal roles (management + field/support staff)
CREATE OR REPLACE FUNCTION public.is_staff_role(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'owner', 'admin', 'managing_director', 'operations_manager',
        'hr_manager', 'sales_manager', 'marketing_manager', 'accountant',
        'staff', 'sales_executive', 'project_manager', 'site_engineer',
        'customer_support', 'general_staff'
      )
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_staff_role(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_staff_role(UUID) TO authenticated, service_role;


-- ============================================================
-- SECTION 5: SIGNUP TRIGGER
-- Creates a profile row and assigns 'customer' role on every signup.
-- ============================================================

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
    SET email     = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- SECTION 6: BUSINESS TABLES
-- ============================================================

-- ── Leads ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT               NOT NULL,
  email       TEXT               NOT NULL,
  phone       TEXT,
  service     public.service_type,
  message     TEXT,
  source      TEXT               DEFAULT 'website',
  status      public.lead_status NOT NULL DEFAULT 'new',
  assigned_to UUID               REFERENCES auth.users(id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ        NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT INSERT ON public.leads TO anon;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE TRIGGER trg_leads_updated
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── Contact Messages ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  phone      TEXT,
  subject    TEXT,
  message    TEXT        NOT NULL,
  handled    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;


-- ── Quote Requests ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id            UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID               REFERENCES auth.users(id) ON DELETE SET NULL,
  name          TEXT               NOT NULL,
  email         TEXT               NOT NULL,
  phone         TEXT               NOT NULL,
  service_type  public.service_type NOT NULL,
  project_type  TEXT,
  budget_range  TEXT,
  timeline      TEXT,
  location      TEXT,
  area_sqft     INTEGER,
  requirements  TEXT               NOT NULL,
  ai_estimate   TEXT,
  ai_breakdown  JSONB,
  status        public.quote_status NOT NULL DEFAULT 'pending',
  quoted_amount NUMERIC,
  created_at    TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ        NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT INSERT ON public.quote_requests TO anon;
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE TRIGGER trg_quotes_updated
    BEFORE UPDATE ON public.quote_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── Projects ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id                 UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id        UUID                  REFERENCES auth.users(id) ON DELETE SET NULL,
  project_manager_id UUID                  REFERENCES auth.users(id) ON DELETE SET NULL,
  title              TEXT                  NOT NULL,
  description        TEXT,
  service_type       public.service_type   NOT NULL,
  status             public.project_status NOT NULL DEFAULT 'planning',
  progress           INTEGER               NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget             NUMERIC,
  spent              NUMERIC               NOT NULL DEFAULT 0,
  start_date         DATE,
  end_date           DATE,
  location           TEXT,
  cover_image        TEXT,
  created_at         TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ           NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE TRIGGER trg_projects_updated
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── Project Milestones ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id           UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID                    NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title        TEXT                    NOT NULL,
  description  TEXT,
  due_date     DATE,
  completed_at TIMESTAMPTZ,
  status       public.milestone_status NOT NULL DEFAULT 'pending',
  order_index  INTEGER                 NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ             NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_milestones TO authenticated;
GRANT ALL ON public.project_milestones TO service_role;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;


-- ── Project Updates ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_updates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  title      TEXT        NOT NULL,
  content    TEXT,
  photo_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_updates TO authenticated;
GRANT ALL ON public.project_updates TO service_role;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;


-- ── Tickets ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tickets (
  id          UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID                   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  UUID                   REFERENCES public.projects(id) ON DELETE SET NULL,
  assigned_to UUID                   REFERENCES auth.users(id) ON DELETE SET NULL,
  subject     TEXT                   NOT NULL,
  message     TEXT                   NOT NULL,
  status      public.ticket_status   NOT NULL DEFAULT 'open',
  priority    public.ticket_priority NOT NULL DEFAULT 'medium',
  created_at  TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ            NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE TRIGGER trg_tickets_updated
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── Ticket Messages ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID        NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_messages TO service_role;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;


-- ── Testimonials ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testimonials (
  id           UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name  TEXT               NOT NULL,
  client_role  TEXT,
  content      TEXT               NOT NULL,
  rating       INTEGER            NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  project_type public.service_type,
  featured     BOOLEAN            NOT NULL DEFAULT false,
  published    BOOLEAN            NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ        NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;


-- ── Blog Posts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT        NOT NULL UNIQUE,
  title        TEXT        NOT NULL,
  excerpt      TEXT,
  content      TEXT        NOT NULL,
  cover_image  TEXT,
  author_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  category     TEXT,
  published    BOOLEAN     NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE TRIGGER trg_posts_updated
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── Staff Tasks ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_tasks (
  id          UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_to UUID                   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID                   REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id  UUID                   REFERENCES public.projects(id) ON DELETE SET NULL,
  title       TEXT                   NOT NULL,
  description TEXT,
  due_date    DATE,
  status      public.task_status     NOT NULL DEFAULT 'todo',
  priority    public.ticket_priority NOT NULL DEFAULT 'medium',
  created_at  TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ            NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_tasks TO authenticated;
GRANT ALL ON public.staff_tasks TO service_role;
ALTER TABLE public.staff_tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE TRIGGER trg_tasks_updated
    BEFORE UPDATE ON public.staff_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── Attendance ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date      DATE        NOT NULL DEFAULT CURRENT_DATE,
  check_in  TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out TIMESTAMPTZ,
  notes     TEXT,
  UNIQUE (user_id, date)
);
GRANT SELECT, INSERT, UPDATE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;


-- ── Staff Salaries ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_salaries (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_month  DATE          NOT NULL,
  amount        NUMERIC(12,2) NOT NULL,
  status        TEXT          NOT NULL DEFAULT 'pending',
  notes         TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_salaries TO authenticated;
GRANT ALL ON public.staff_salaries TO service_role;
ALTER TABLE public.staff_salaries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE TRIGGER trg_staff_salaries_updated
    BEFORE UPDATE ON public.staff_salaries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── Staff Leaves ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_leaves (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_date     DATE        NOT NULL,
  to_date       DATE        NOT NULL,
  leave_type    TEXT        NOT NULL DEFAULT 'casual',
  status        TEXT        NOT NULL DEFAULT 'pending',
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_leaves TO authenticated;
GRANT ALL ON public.staff_leaves TO service_role;
ALTER TABLE public.staff_leaves ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE TRIGGER trg_staff_leaves_updated
    BEFORE UPDATE ON public.staff_leaves
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- SECTION 7: RBAC & GOVERNANCE TABLES
-- ============================================================

-- ── Role Permissions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id         UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  role       public.app_role NOT NULL,
  module     TEXT            NOT NULL,
  allowed    BOOLEAN         NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ     NOT NULL DEFAULT now(),
  UNIQUE (role, module)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE TRIGGER trg_role_permissions_updated
    BEFORE UPDATE ON public.role_permissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── Audit Logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email  TEXT,
  action       TEXT        NOT NULL,
  target_type  TEXT,
  target_id    TEXT,
  target_email TEXT,
  metadata     JSONB       DEFAULT '{}',
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;


-- ── User Sessions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address  TEXT,
  user_agent  TEXT,
  device_type TEXT,
  location    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active   BOOLEAN     NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_sessions TO service_role;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;


-- ── Impersonation Log ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.impersonation_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  impersonator_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at         TIMESTAMPTZ,
  reason           TEXT
);
GRANT SELECT, INSERT, UPDATE ON public.impersonation_log TO authenticated;
GRANT ALL ON public.impersonation_log TO service_role;
ALTER TABLE public.impersonation_log ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- SECTION 8: OWNER-ONLY MANAGEMENT RPCs
-- ============================================================

-- Assign a single role to a user (replaces all existing roles)
CREATE OR REPLACE FUNCTION public.owner_set_user_role(
  _target UUID,
  _role   public.app_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role('owner') THEN
    RAISE EXCEPTION 'Permission denied: owner role required';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.owner_set_user_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.owner_set_user_role(UUID, public.app_role) TO authenticated;

-- Revoke a specific role from a user
CREATE OR REPLACE FUNCTION public.owner_revoke_user_role(
  _target UUID,
  _role   public.app_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role('owner') THEN
    RAISE EXCEPTION 'Permission denied: owner role required';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target AND role = _role;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.owner_revoke_user_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.owner_revoke_user_role(UUID, public.app_role) TO authenticated;

-- Update a user account status
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
  IF NOT public.has_role('owner') THEN
    RAISE EXCEPTION 'Permission denied: owner role required';
  END IF;
  UPDATE public.profiles SET status = _status WHERE id = _target;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.owner_update_user_status(UUID, public.user_status) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.owner_update_user_status(UUID, public.user_status) TO authenticated;

-- Legacy RPCs kept for backward compatibility but restricted
CREATE OR REPLACE FUNCTION public.set_user_role(_target UUID, _role public.app_role)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role('owner') OR public.has_role('admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_user_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.revoke_user_role(_target UUID, _role public.app_role)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.has_role('owner') OR public.has_role('admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target AND role = _role;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.revoke_user_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;


-- ============================================================
-- SECTION 9: SESSION RPCs
-- ============================================================

-- Record a new browser session; bumps last_seen on the profile
CREATE OR REPLACE FUNCTION public.record_user_session(
  _user_agent  TEXT DEFAULT NULL,
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
REVOKE EXECUTE ON FUNCTION public.record_user_session(TEXT, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.record_user_session(TEXT, TEXT) TO authenticated;

-- Keep a session's last_seen timestamp fresh
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
REVOKE EXECUTE ON FUNCTION public.touch_session(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.touch_session(UUID) TO authenticated;


-- ============================================================
-- SECTION 10: ROW LEVEL SECURITY POLICIES
-- All old variant names dropped first; clean canonical names created.
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own profile"        ON public.profiles;
DROP POLICY IF EXISTS "Staff and admins can view all profiles"  ON public.profiles;
DROP POLICY IF EXISTS "Owner and admin can view all profiles"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_manager"         ON public.profiles;
DROP POLICY IF EXISTS "profiles_select"                        ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile"      ON public.profiles;
DROP POLICY IF EXISTS "Owner can update any profile"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_owner_only"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_update"                        ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert"                        ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role('owner')
    OR public.has_role('admin')
    OR public.is_staff_role()
  );

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING   (auth.uid() = id OR public.has_role('owner'))
  WITH CHECK (auth.uid() = id OR public.has_role('owner'));


-- ── user_roles ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own roles"      ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles"           ON public.user_roles;
DROP POLICY IF EXISTS "Owner or admin can view all roles"   ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_read_owner_and_admin"     ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select"                   ON public.user_roles;
DROP POLICY IF EXISTS "Owner can manage all roles"          ON public.user_roles;
DROP POLICY IF EXISTS "Owner can delete roles"              ON public.user_roles;
DROP POLICY IF EXISTS "Owner only insert roles"             ON public.user_roles;
DROP POLICY IF EXISTS "Owner only delete roles"             ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_owner_only"        ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_owner_only"        ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert"                   ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete"                   ON public.user_roles;

CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role('owner') OR public.has_role('admin'));

CREATE POLICY "user_roles_insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role('owner'));

CREATE POLICY "user_roles_delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role('owner'));


-- ── leads ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can submit a lead"          ON public.leads;
DROP POLICY IF EXISTS "Staff and admins can view leads"   ON public.leads;
DROP POLICY IF EXISTS "Staff and admins can update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads"           ON public.leads;
DROP POLICY IF EXISTS "leads_insert"                      ON public.leads;
DROP POLICY IF EXISTS "leads_select"                      ON public.leads;
DROP POLICY IF EXISTS "leads_update"                      ON public.leads;
DROP POLICY IF EXISTS "leads_delete"                      ON public.leads;

CREATE POLICY "leads_insert" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(name))  BETWEEN 1 AND 200 AND
    length(trim(email)) BETWEEN 3 AND 200 AND
    email LIKE '%@%'
  );

CREATE POLICY "leads_select" ON public.leads
  FOR SELECT TO authenticated
  USING (public.is_admin_role() OR public.is_staff_role());

CREATE POLICY "leads_update" ON public.leads
  FOR UPDATE TO authenticated
  USING (public.is_admin_role() OR public.is_staff_role());

CREATE POLICY "leads_delete" ON public.leads
  FOR DELETE TO authenticated
  USING (public.has_role('owner') OR public.has_role('admin'));


-- ── contact_messages ──────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can submit contact"          ON public.contact_messages;
DROP POLICY IF EXISTS "Staff and admins read contact"      ON public.contact_messages;
DROP POLICY IF EXISTS "Staff and admins update contact"    ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_insert"            ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_select"            ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_update"            ON public.contact_messages;

CREATE POLICY "contact_messages_insert" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(name))  BETWEEN 1 AND 200 AND
    length(trim(email)) BETWEEN 3 AND 200 AND
    email LIKE '%@%' AND
    length(message)     BETWEEN 1 AND 5000
  );

CREATE POLICY "contact_messages_select" ON public.contact_messages
  FOR SELECT TO authenticated
  USING (public.is_admin_role() OR public.is_staff_role());

CREATE POLICY "contact_messages_update" ON public.contact_messages
  FOR UPDATE TO authenticated
  USING (public.is_admin_role() OR public.is_staff_role());


-- ── quote_requests ────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can request a quote"      ON public.quote_requests;
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quote_requests;
DROP POLICY IF EXISTS "Staff and admins update quotes"  ON public.quote_requests;
DROP POLICY IF EXISTS "quote_requests_insert"           ON public.quote_requests;
DROP POLICY IF EXISTS "quote_requests_select"           ON public.quote_requests;
DROP POLICY IF EXISTS "quote_requests_update"           ON public.quote_requests;

CREATE POLICY "quote_requests_insert" ON public.quote_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(name))         BETWEEN 1 AND 200 AND
    length(trim(email))        BETWEEN 3 AND 200 AND
    email LIKE '%@%' AND
    length(trim(phone))        BETWEEN 6 AND 20  AND
    length(requirements)       BETWEEN 1 AND 5000
  );

CREATE POLICY "quote_requests_select" ON public.quote_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_role() OR public.is_staff_role());

CREATE POLICY "quote_requests_update" ON public.quote_requests
  FOR UPDATE TO authenticated
  USING (public.is_admin_role() OR public.is_staff_role());


-- ── projects ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Customers see their projects"      ON public.projects;
DROP POLICY IF EXISTS "Staff and admins manage projects"  ON public.projects;
DROP POLICY IF EXISTS "Staff and admins update projects"  ON public.projects;
DROP POLICY IF EXISTS "Admins delete projects"            ON public.projects;
DROP POLICY IF EXISTS "projects_select"                   ON public.projects;
DROP POLICY IF EXISTS "projects_insert"                   ON public.projects;
DROP POLICY IF EXISTS "projects_update"                   ON public.projects;
DROP POLICY IF EXISTS "projects_delete"                   ON public.projects;

CREATE POLICY "projects_select" ON public.projects
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid() OR project_manager_id = auth.uid()
    OR public.is_admin_role() OR public.is_staff_role()
  );

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_role() OR public.is_staff_role());

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.is_admin_role() OR public.is_staff_role());

CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE TO authenticated
  USING (public.has_role('owner') OR public.has_role('admin'));


-- ── project_milestones ────────────────────────────────────────
DROP POLICY IF EXISTS "View milestones for accessible projects" ON public.project_milestones;
DROP POLICY IF EXISTS "Staff manage milestones"                 ON public.project_milestones;
DROP POLICY IF EXISTS "milestones_select"                       ON public.project_milestones;
DROP POLICY IF EXISTS "milestones_write"                        ON public.project_milestones;

CREATE POLICY "milestones_select" ON public.project_milestones
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id
      AND (p.customer_id = auth.uid() OR p.project_manager_id = auth.uid()
           OR public.is_admin_role() OR public.is_staff_role())
  ));

CREATE POLICY "milestones_write" ON public.project_milestones
  FOR ALL TO authenticated
  USING   (public.is_admin_role() OR public.is_staff_role())
  WITH CHECK (public.is_admin_role() OR public.is_staff_role());


-- ── project_updates ───────────────────────────────────────────
DROP POLICY IF EXISTS "View updates for accessible projects" ON public.project_updates;
DROP POLICY IF EXISTS "Staff post updates"                   ON public.project_updates;
DROP POLICY IF EXISTS "Staff edit updates"                   ON public.project_updates;
DROP POLICY IF EXISTS "project_updates_select"               ON public.project_updates;
DROP POLICY IF EXISTS "project_updates_insert"               ON public.project_updates;
DROP POLICY IF EXISTS "project_updates_update"               ON public.project_updates;

CREATE POLICY "project_updates_select" ON public.project_updates
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id
      AND (p.customer_id = auth.uid() OR p.project_manager_id = auth.uid()
           OR public.is_admin_role() OR public.is_staff_role())
  ));

CREATE POLICY "project_updates_insert" ON public.project_updates
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_role() OR public.is_staff_role());

CREATE POLICY "project_updates_update" ON public.project_updates
  FOR UPDATE TO authenticated
  USING (public.is_admin_role() OR public.is_staff_role());


-- ── tickets ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Customer manages own tickets" ON public.tickets;
DROP POLICY IF EXISTS "tickets_all"                  ON public.tickets;

CREATE POLICY "tickets_all" ON public.tickets
  FOR ALL TO authenticated
  USING   (customer_id = auth.uid() OR public.is_admin_role() OR public.is_staff_role())
  WITH CHECK (customer_id = auth.uid() OR public.is_admin_role() OR public.is_staff_role());


-- ── ticket_messages ───────────────────────────────────────────
DROP POLICY IF EXISTS "Ticket messages visible to participants" ON public.ticket_messages;
DROP POLICY IF EXISTS "Participants post ticket messages"       ON public.ticket_messages;
DROP POLICY IF EXISTS "ticket_messages_select"                  ON public.ticket_messages;
DROP POLICY IF EXISTS "ticket_messages_insert"                  ON public.ticket_messages;

CREATE POLICY "ticket_messages_select" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_id
      AND (t.customer_id = auth.uid() OR public.is_admin_role() OR public.is_staff_role())
  ));

CREATE POLICY "ticket_messages_insert" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id
        AND (t.customer_id = auth.uid() OR public.is_admin_role() OR public.is_staff_role())
    )
  );


-- ── testimonials ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read published testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins manage testimonials"         ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_select"                ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_write"                 ON public.testimonials;

CREATE POLICY "testimonials_select" ON public.testimonials
  FOR SELECT TO anon, authenticated USING (published = true);

CREATE POLICY "testimonials_write" ON public.testimonials
  FOR ALL TO authenticated
  USING   (public.has_role('owner') OR public.has_role('admin'))
  WITH CHECK (public.has_role('owner') OR public.has_role('admin'));


-- ── blog_posts ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public reads published posts"   ON public.blog_posts;
DROP POLICY IF EXISTS "Admins read all posts"          ON public.blog_posts;
DROP POLICY IF EXISTS "Admins manage posts"            ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_select_public"       ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_select_admin"        ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_write"               ON public.blog_posts;

CREATE POLICY "blog_posts_select_public" ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (published = true);

CREATE POLICY "blog_posts_select_admin" ON public.blog_posts
  FOR SELECT TO authenticated
  USING (public.has_role('owner') OR public.has_role('admin'));

CREATE POLICY "blog_posts_write" ON public.blog_posts
  FOR ALL TO authenticated
  USING   (public.has_role('owner') OR public.has_role('admin'))
  WITH CHECK (public.has_role('owner') OR public.has_role('admin'));


-- ── staff_tasks ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff see own/admins see all tasks" ON public.staff_tasks;
DROP POLICY IF EXISTS "Admins create tasks"                ON public.staff_tasks;
DROP POLICY IF EXISTS "Assignee or admin update tasks"     ON public.staff_tasks;
DROP POLICY IF EXISTS "Admins delete tasks"                ON public.staff_tasks;
DROP POLICY IF EXISTS "staff_tasks_select"                 ON public.staff_tasks;
DROP POLICY IF EXISTS "staff_tasks_insert"                 ON public.staff_tasks;
DROP POLICY IF EXISTS "staff_tasks_update"                 ON public.staff_tasks;
DROP POLICY IF EXISTS "staff_tasks_delete"                 ON public.staff_tasks;

CREATE POLICY "staff_tasks_select" ON public.staff_tasks
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid() OR public.is_admin_role());

CREATE POLICY "staff_tasks_insert" ON public.staff_tasks
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_role() OR public.is_staff_role());

CREATE POLICY "staff_tasks_update" ON public.staff_tasks
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid() OR public.is_admin_role());

CREATE POLICY "staff_tasks_delete" ON public.staff_tasks
  FOR DELETE TO authenticated
  USING (public.is_admin_role());


-- ── attendance ────────────────────────────────────────────────
DROP POLICY IF EXISTS "User manages own attendance" ON public.attendance;
DROP POLICY IF EXISTS "attendance_all"              ON public.attendance;

CREATE POLICY "attendance_all" ON public.attendance
  FOR ALL TO authenticated
  USING   (user_id = auth.uid() OR public.is_admin_role())
  WITH CHECK (user_id = auth.uid() OR public.is_admin_role());


-- ── staff_salaries ────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff read own salary"       ON public.staff_salaries;
DROP POLICY IF EXISTS "Admin manage salaries"       ON public.staff_salaries;
DROP POLICY IF EXISTS "staff_salaries_select"       ON public.staff_salaries;
DROP POLICY IF EXISTS "staff_salaries_write"        ON public.staff_salaries;

CREATE POLICY "staff_salaries_select" ON public.staff_salaries
  FOR SELECT TO authenticated
  USING (staff_user_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "staff_salaries_write" ON public.staff_salaries
  FOR ALL TO authenticated
  USING   (public.is_admin_role())
  WITH CHECK (public.is_admin_role());


-- ── staff_leaves ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff read own leaves"      ON public.staff_leaves;
DROP POLICY IF EXISTS "Staff insert own leaves"    ON public.staff_leaves;
DROP POLICY IF EXISTS "Admin manage leaves"        ON public.staff_leaves;
DROP POLICY IF EXISTS "staff_leaves_select"        ON public.staff_leaves;
DROP POLICY IF EXISTS "staff_leaves_insert"        ON public.staff_leaves;
DROP POLICY IF EXISTS "staff_leaves_write"         ON public.staff_leaves;

CREATE POLICY "staff_leaves_select" ON public.staff_leaves
  FOR SELECT TO authenticated
  USING (staff_user_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "staff_leaves_insert" ON public.staff_leaves
  FOR INSERT TO authenticated
  WITH CHECK (staff_user_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "staff_leaves_write" ON public.staff_leaves
  FOR ALL TO authenticated
  USING   (public.is_admin_role())
  WITH CHECK (public.is_admin_role());


-- ── role_permissions ──────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated can read permissions"  ON public.role_permissions;
DROP POLICY IF EXISTS "Owners can manage permissions"       ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions_select"             ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions_write"              ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions_write_owner_only"   ON public.role_permissions;

CREATE POLICY "role_permissions_select" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "role_permissions_write" ON public.role_permissions
  FOR ALL TO authenticated
  USING   (public.has_role('owner'))
  WITH CHECK (public.has_role('owner'));


-- ── audit_logs ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owners can view all audit logs"      ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select"                   ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert"                   ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_owner_read"               ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_own"               ON public.audit_logs;
DROP POLICY IF EXISTS "Owner can view audit logs"           ON public.audit_logs;
DROP POLICY IF EXISTS "Audit log owner read"                ON public.audit_logs;
DROP POLICY IF EXISTS "Audit log insert authenticated"      ON public.audit_logs;

CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role('owner') OR actor_id = auth.uid());

CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());


-- ── user_sessions ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users view own sessions; owners view all" ON public.user_sessions;
DROP POLICY IF EXISTS "Users insert own sessions"                ON public.user_sessions;
DROP POLICY IF EXISTS "Users update own sessions"                ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_select"                     ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_insert"                     ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_update"                     ON public.user_sessions;

CREATE POLICY "user_sessions_select" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role('owner'));

CREATE POLICY "user_sessions_insert" ON public.user_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_sessions_update" ON public.user_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());


-- ── impersonation_log ─────────────────────────────────────────
DROP POLICY IF EXISTS "Owners can manage impersonation log"      ON public.impersonation_log;
DROP POLICY IF EXISTS "Owner can manage impersonation log"       ON public.impersonation_log;
DROP POLICY IF EXISTS "impersonation_log_select"                 ON public.impersonation_log;
DROP POLICY IF EXISTS "impersonation_log_insert"                 ON public.impersonation_log;
DROP POLICY IF EXISTS "impersonation_log_update"                 ON public.impersonation_log;

CREATE POLICY "impersonation_log_select" ON public.impersonation_log
  FOR SELECT TO authenticated
  USING (public.has_role('owner') OR impersonator_id = auth.uid());

CREATE POLICY "impersonation_log_insert" ON public.impersonation_log
  FOR INSERT TO authenticated
  WITH CHECK (impersonator_id = auth.uid());

CREATE POLICY "impersonation_log_update" ON public.impersonation_log
  FOR UPDATE TO authenticated
  USING (public.has_role('owner') OR impersonator_id = auth.uid());


-- ============================================================
-- SECTION 11: INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_status        ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created       ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_status       ON public.quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quotes_user         ON public.quote_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_customer   ON public.projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_pm         ON public.projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status     ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_milestones_project  ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_updates_project     ON public.project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer    ON public.tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status      ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_blog_published      ON public.blog_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_slug           ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee      ON public.staff_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status        ON public.staff_tasks(status);
CREATE INDEX IF NOT EXISTS idx_attendance_user     ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_salaries_staff      ON public.staff_salaries(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_leaves_staff        ON public.staff_leaves(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor         ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created       ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action        ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_sessions_user       ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen  ON public.user_sessions(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_impersonation_actor ON public.impersonation_log(impersonator_id);


-- ============================================================
-- SECTION 12: SEED — role_permissions matrix (config, not demo data)
-- ============================================================
INSERT INTO public.role_permissions (role, module, allowed) VALUES
  -- Owner: all modules
  ('owner','dashboard',true),('owner','leads',true),('owner','quotes',true),
  ('owner','projects',true),('owner','tickets',true),('owner','hr',true),
  ('owner','blog',true),('owner','team',true),('owner','testimonials',true),
  ('owner','messages',true),('owner','users',true),('owner','audit',true),
  ('owner','permissions',true),('owner','tasks',true),('owner','leaves',true),
  ('owner','reports',true),('owner','finance',true),
  -- Admin (backward compat): all modules
  ('admin','dashboard',true),('admin','leads',true),('admin','quotes',true),
  ('admin','projects',true),('admin','tickets',true),('admin','hr',true),
  ('admin','blog',true),('admin','team',true),('admin','testimonials',true),
  ('admin','messages',true),('admin','users',true),('admin','audit',true),
  ('admin','permissions',true),('admin','tasks',true),('admin','leaves',true),
  ('admin','reports',true),('admin','finance',true),
  -- Managing Director
  ('managing_director','dashboard',true),('managing_director','projects',true),
  ('managing_director','quotes',true),('managing_director','leads',true),
  ('managing_director','hr',true),('managing_director','reports',true),
  ('managing_director','finance',true),('managing_director','tickets',true),
  ('managing_director','team',true),
  -- Operations Manager
  ('operations_manager','dashboard',true),('operations_manager','projects',true),
  ('operations_manager','quotes',true),('operations_manager','tickets',true),
  ('operations_manager','tasks',true),('operations_manager','messages',true),
  ('operations_manager','leads',true),('operations_manager','team',true),
  -- HR Manager
  ('hr_manager','dashboard',true),('hr_manager','hr',true),
  ('hr_manager','leaves',true),('hr_manager','tasks',true),('hr_manager','team',true),
  -- Sales Manager
  ('sales_manager','dashboard',true),('sales_manager','leads',true),
  ('sales_manager','quotes',true),('sales_manager','tasks',true),
  ('sales_manager','messages',true),('sales_manager','reports',true),
  -- Marketing Manager
  ('marketing_manager','dashboard',true),('marketing_manager','blog',true),
  ('marketing_manager','testimonials',true),('marketing_manager','leads',true),
  ('marketing_manager','messages',true),
  -- Accountant
  ('accountant','dashboard',true),('accountant','finance',true),
  ('accountant','reports',true),('accountant','quotes',true),
  -- Sales Executive
  ('sales_executive','dashboard',true),('sales_executive','leads',true),
  ('sales_executive','tasks',true),
  -- Project Manager
  ('project_manager','dashboard',true),('project_manager','projects',true),
  ('project_manager','tasks',true),('project_manager','quotes',true),
  -- Site Engineer
  ('site_engineer','dashboard',true),('site_engineer','projects',true),
  ('site_engineer','tasks',true),
  -- Customer Support
  ('customer_support','dashboard',true),('customer_support','tickets',true),
  ('customer_support','messages',true),('customer_support','tasks',true),
  -- General Staff / Staff
  ('general_staff','dashboard',true),('general_staff','tasks',true),('general_staff','leaves',true),
  ('staff','dashboard',true),('staff','tasks',true),('staff','leaves',true)
ON CONFLICT (role, module) DO NOTHING;


-- ============================================================
-- SCHEMA COMPLETE
-- Next steps:
--   1. Create auth accounts using the Supabase Admin API script
--      in scripts/demo_accounts.md
--   2. Run scripts/seed_demo_data.sql to populate business data
-- ============================================================
