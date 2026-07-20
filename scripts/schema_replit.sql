-- ============================================================
-- ADITYA CONSTRUCTIONS — Replit PostgreSQL Schema
-- ============================================================
-- No Supabase dependency. Run this on a fresh Replit PostgreSQL database.
-- Safe to re-run (idempotent via IF NOT EXISTS / ON CONFLICT).
-- ============================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUMS ──────────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM (
  'owner', 'admin', 'managing_director', 'operations_manager',
  'hr_manager', 'sales_manager', 'sales_executive', 'marketing_manager',
  'accountant', 'project_manager', 'site_engineer', 'customer_support',
  'general_staff', 'staff', 'customer'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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

-- ─── TRIGGER HELPER ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ─── USERS (replaces Supabase auth.users) ───────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── PROFILES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID               PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  company     TEXT,
  avatar_url  TEXT,
  status      public.user_status NOT NULL DEFAULT 'active',
  department  TEXT,
  employee_id TEXT,
  bio         TEXT,
  last_seen   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ        NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── USER ROLES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID            NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at TIMESTAMPTZ     NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- ─── ROLE PERMISSIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  role    public.app_role NOT NULL,
  module  TEXT            NOT NULL,
  allowed BOOLEAN         NOT NULL DEFAULT true,
  UNIQUE (role, module)
);

-- ─── LEADS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id           UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT               NOT NULL,
  email        TEXT               NOT NULL,
  phone        TEXT,
  service      public.service_type,
  message      TEXT,
  status       public.lead_status NOT NULL DEFAULT 'new',
  source       TEXT,
  budget_range TEXT,
  location     TEXT,
  assigned_to  UUID               REFERENCES public.users(id),
  created_at   TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ        NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── CONTACT MESSAGES ────────────────────────────────────────
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

-- ─── QUOTE REQUESTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id           UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT                NOT NULL,
  email        TEXT                NOT NULL,
  phone        TEXT,
  service_type public.service_type,
  requirements TEXT,
  budget_range TEXT,
  timeline     TEXT,
  location     TEXT,
  status       public.quote_status NOT NULL DEFAULT 'pending',
  ai_estimate  TEXT,
  user_id      UUID                REFERENCES public.users(id),
  created_at   TIMESTAMPTZ         NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ         NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER trg_qr_updated BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── PROJECTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id          UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT                  NOT NULL,
  description TEXT,
  service_type public.service_type  NOT NULL DEFAULT 'construction',
  status      public.project_status NOT NULL DEFAULT 'planning',
  progress    INTEGER               NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  location    TEXT,
  budget      NUMERIC(15,2),
  start_date  DATE,
  end_date    DATE,
  customer_id UUID                  REFERENCES public.users(id),
  created_at  TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ           NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── PROJECT MILESTONES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id          UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID                    NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title       TEXT                    NOT NULL,
  description TEXT,
  status      public.milestone_status NOT NULL DEFAULT 'pending',
  due_date    DATE,
  created_at  TIMESTAMPTZ             NOT NULL DEFAULT now()
);

-- ─── PROJECT UPDATES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_updates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  posted_by   UUID        REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TICKETS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tickets (
  id          UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  subject     TEXT                   NOT NULL,
  description TEXT,
  status      public.ticket_status   NOT NULL DEFAULT 'open',
  priority    public.ticket_priority NOT NULL DEFAULT 'medium',
  customer_id UUID                   REFERENCES public.users(id),
  assigned_to UUID                   REFERENCES public.users(id),
  created_at  TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ            NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── TICKET MESSAGES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID        NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id  UUID        REFERENCES public.users(id),
  message    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TESTIMONIALS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testimonials (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT        NOT NULL,
  client_role TEXT,
  company     TEXT,
  content     TEXT        NOT NULL,
  rating      INTEGER     NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  published   BOOLEAN     NOT NULL DEFAULT false,
  project_id  UUID        REFERENCES public.projects(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── BLOG POSTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  excerpt     TEXT,
  content     TEXT        NOT NULL,
  cover_image TEXT,
  category    TEXT,
  published   BOOLEAN     NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  author_id   UUID        REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER trg_blog_updated BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── STAFF TASKS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_tasks (
  id          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT               NOT NULL,
  description TEXT,
  assigned_to UUID               REFERENCES public.users(id),
  assigned_by UUID               REFERENCES public.users(id),
  status      public.task_status NOT NULL DEFAULT 'todo',
  due_date    DATE,
  created_at  TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ        NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.staff_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── ATTENDANCE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID        NOT NULL REFERENCES public.users(id),
  date      DATE        NOT NULL,
  check_in  TIME        NOT NULL,
  check_out TIME,
  notes     TEXT,
  UNIQUE (user_id, date)
);

-- ─── STAFF SALARIES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_salaries (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id UUID        NOT NULL REFERENCES public.users(id),
  period_month  TEXT        NOT NULL,
  amount        NUMERIC(12,2) NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'paid',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (staff_user_id, period_month)
);

-- ─── STAFF LEAVES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_leaves (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id UUID        NOT NULL REFERENCES public.users(id),
  from_date     DATE        NOT NULL,
  to_date       DATE        NOT NULL,
  leave_type    TEXT        NOT NULL DEFAULT 'casual',
  reason        TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── AUDIT LOGS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID        REFERENCES public.users(id),
  actor_email  TEXT,
  action       TEXT        NOT NULL,
  target_type  TEXT,
  target_id    UUID,
  target_email TEXT,
  metadata     JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ─── USER SESSIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_agent  TEXT,
  device_type TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active   BOOLEAN     NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.user_sessions(user_id);

-- ─── IMPERSONATION LOG ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.impersonation_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  impersonator_id  UUID        NOT NULL REFERENCES public.users(id),
  target_user_id   UUID        NOT NULL REFERENCES public.users(id),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at         TIMESTAMPTZ
);
