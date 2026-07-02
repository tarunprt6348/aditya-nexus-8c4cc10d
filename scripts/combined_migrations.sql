-- ============================================================
-- ADITYA CONSTRUCTIONS — COMBINED MIGRATIONS
-- Run this entire script in:
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ============================================================
-- Migration: 20260615181252_50f3ffb0-1443-4327-9e95-fe4ff3015f52.sql
-- ============================================================

-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'customer');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');
CREATE TYPE public.quote_status AS ENUM ('pending', 'reviewing', 'quoted', 'accepted', 'rejected');
CREATE TYPE public.project_status AS ENUM ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled');
CREATE TYPE public.milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'delayed');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.service_type AS ENUM ('construction', 'interiors', 'real_estate', 'hvac', 'solar');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done', 'blocked');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  company TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ PROFILES POLICIES ============
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Staff and admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ AUTO PROFILE + ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ UPDATED_AT HELPER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ LEADS ============
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service public.service_type,
  message TEXT,
  source TEXT DEFAULT 'website',
  status public.lead_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT INSERT ON public.leads TO anon;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff and admins can view leads" ON public.leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Staff and admins can update leads" ON public.leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CONTACT MESSAGES ============
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  handled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff and admins read contact" ON public.contact_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Staff and admins update contact" ON public.contact_messages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- ============ QUOTE REQUESTS ============
CREATE TABLE public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_type public.service_type NOT NULL,
  project_type TEXT,
  budget_range TEXT,
  timeline TEXT,
  location TEXT,
  area_sqft INTEGER,
  requirements TEXT NOT NULL,
  ai_estimate TEXT,
  ai_breakdown JSONB,
  status public.quote_status NOT NULL DEFAULT 'pending',
  quoted_amount NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT INSERT ON public.quote_requests TO anon;
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request a quote" ON public.quote_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users can view their own quotes" ON public.quote_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Staff and admins update quotes" ON public.quote_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));
CREATE TRIGGER trg_quotes_updated BEFORE UPDATE ON public.quote_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROJECTS ============
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  service_type public.service_type NOT NULL,
  status public.project_status NOT NULL DEFAULT 'planning',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget NUMERIC,
  spent NUMERIC NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  location TEXT,
  cover_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers see their projects" ON public.projects FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR project_manager_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Staff and admins manage projects" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Staff and admins update projects" ON public.projects FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Admins delete projects" ON public.projects FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ MILESTONES ============
CREATE TABLE public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  status public.milestone_status NOT NULL DEFAULT 'pending',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_milestones TO authenticated;
GRANT ALL ON public.project_milestones TO service_role;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View milestones for accessible projects" ON public.project_milestones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.customer_id = auth.uid() OR p.project_manager_id = auth.uid()
      OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))));
CREATE POLICY "Staff manage milestones" ON public.project_milestones FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));

-- ============ PROJECT UPDATES (photos, status) ============
CREATE TABLE public.project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  photo_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_updates TO authenticated;
GRANT ALL ON public.project_updates TO service_role;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View updates for accessible projects" ON public.project_updates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id
    AND (p.customer_id = auth.uid() OR p.project_manager_id = auth.uid()
      OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))));
CREATE POLICY "Staff post updates" ON public.project_updates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Staff edit updates" ON public.project_updates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));

-- ============ TICKETS ============
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'open',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customer manages own tickets" ON public.tickets FOR ALL TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  WITH CHECK (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_messages TO service_role;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ticket messages visible to participants" ON public.ticket_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id
    AND (t.customer_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))));
CREATE POLICY "Participants post ticket messages" ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id
    AND (t.customer_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))));

-- ============ TESTIMONIALS ============
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_role TEXT,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  project_type public.service_type,
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published testimonials" ON public.testimonials FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ BLOG ============
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published posts" ON public.blog_posts FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admins read all posts" ON public.blog_posts FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage posts" ON public.blog_posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STAFF TASKS ============
CREATE TABLE public.staff_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_tasks TO authenticated;
GRANT ALL ON public.staff_tasks TO service_role;
ALTER TABLE public.staff_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff see own/admins see all tasks" ON public.staff_tasks FOR SELECT TO authenticated
  USING (assigned_to = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins create tasks" ON public.staff_tasks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'));
CREATE POLICY "Assignee or admin update tasks" ON public.staff_tasks FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete tasks" ON public.staff_tasks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.staff_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ATTENDANCE ============
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out TIMESTAMPTZ,
  notes TEXT,
  UNIQUE (user_id, date)
);
GRANT SELECT, INSERT, UPDATE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User manages own attendance" ON public.attendance FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============ INDEXES ============
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created ON public.leads(created_at DESC);
CREATE INDEX idx_quotes_status ON public.quote_requests(status);
CREATE INDEX idx_projects_customer ON public.projects(customer_id);
CREATE INDEX idx_milestones_project ON public.project_milestones(project_id);
CREATE INDEX idx_updates_project ON public.project_updates(project_id);
CREATE INDEX idx_tickets_customer ON public.tickets(customer_id);
CREATE INDEX idx_blog_published ON public.blog_posts(published, published_at DESC);
CREATE INDEX idx_tasks_assignee ON public.staff_tasks(assigned_to);

-- ============================================================
-- Migration: 20260615181355_1a385ffe-23f4-44ba-96d2-e59d517ae0d0.sql
-- ============================================================

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

-- ============================================================
-- Migration: 20260616043950_0f1aa0dc-bf66-4797-932e-7d1e04970870.sql
-- ============================================================

-- Staff salaries
CREATE TABLE public.staff_salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_month date NOT NULL,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_salaries TO authenticated;
GRANT ALL ON public.staff_salaries TO service_role;
ALTER TABLE public.staff_salaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read own salary" ON public.staff_salaries
  FOR SELECT TO authenticated USING (staff_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manage salaries" ON public.staff_salaries
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_staff_salaries_updated BEFORE UPDATE ON public.staff_salaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Staff leaves
CREATE TABLE public.staff_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_date date NOT NULL,
  to_date date NOT NULL,
  leave_type text NOT NULL DEFAULT 'casual',
  status text NOT NULL DEFAULT 'pending',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_leaves TO authenticated;
GRANT ALL ON public.staff_leaves TO service_role;
ALTER TABLE public.staff_leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read own leaves" ON public.staff_leaves
  FOR SELECT TO authenticated USING (staff_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Staff insert own leaves" ON public.staff_leaves
  FOR INSERT TO authenticated WITH CHECK (staff_user_id = auth.uid());
CREATE POLICY "Admin manage leaves" ON public.staff_leaves
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_staff_leaves_updated BEFORE UPDATE ON public.staff_leaves
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Role-grant RPC: only admins can call
CREATE OR REPLACE FUNCTION public.set_user_role(_target uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_user_role(_target uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target AND role = _role;
END;
$$;

-- ============================================================
-- Migration: 20260616044012_8ed27208-bfb7-4a44-a993-150739cf9c26.sql
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_user_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_role(uuid, app_role) TO authenticated;

-- ============================================================
-- Migration: 20260617063725_48628297-d346-4039-98e5-a5278ebdb13a.sql
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'phone');

  IF lower(NEW.email) = 'd653040@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = 'd653040@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
-- ============================================================
-- Migration: 20260617063804_6016d9e0-1744-47c3-b4e6-0bacbd31bab7.sql
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_user_role(uuid, public.app_role) FROM PUBLIC, anon;
-- ============================================================
-- Migration: 20260617120000_enterprise_rbac.sql
-- ============================================================
-- ============================================================
-- ENTERPRISE RBAC: 12 roles, permissions, audit, sessions
-- ============================================================

-- Extend app_role enum with new enterprise roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
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

-- Add user status enum
CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');

-- Add status, department to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status public.user_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS employee_id TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- ============================================================
-- ROLE PERMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  module TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, module)
);

GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners can manage permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_role_permissions_updated
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  target_email TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view all audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);

-- ============================================================
-- USER SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

GRANT SELECT, INSERT, UPDATE ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_sessions TO service_role;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions; owners view all" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own sessions" ON public.user_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own sessions" ON public.user_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON public.user_sessions(last_seen DESC);

-- ============================================================
-- IMPERSONATION LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.impersonation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  impersonator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  reason TEXT
);

GRANT SELECT, INSERT, UPDATE ON public.impersonation_log TO authenticated;
GRANT ALL ON public.impersonation_log TO service_role;
ALTER TABLE public.impersonation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage impersonation log" ON public.impersonation_log
  FOR ALL TO authenticated
  USING (impersonator_id = auth.uid() OR public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (impersonator_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_impersonation_actor ON public.impersonation_log(impersonator_id);

-- ============================================================
-- RLS POLICIES: admin route access for new roles
-- Helper function: is_admin_role
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('owner','admin','managing_director','operations_manager',
                 'hr_manager','sales_manager','marketing_manager','accountant')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('owner','admin','managing_director','operations_manager',
                 'hr_manager','sales_manager','marketing_manager','accountant',
                 'staff','sales_executive','project_manager','site_engineer',
                 'customer_support','general_staff')
  )
$$;

-- ============================================================
-- UPDATE EXISTING POLICIES to include new admin roles
-- ============================================================

-- Leads: add new admin-like roles
DROP POLICY IF EXISTS "Staff and admins can view leads" ON public.leads;
CREATE POLICY "Staff and admins can view leads" ON public.leads
  FOR SELECT TO authenticated
  USING (public.is_admin_role(auth.uid()) OR public.is_staff_role(auth.uid()));

DROP POLICY IF EXISTS "Staff and admins can update leads" ON public.leads;
CREATE POLICY "Staff and admins can update leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (public.is_admin_role(auth.uid()) OR public.is_staff_role(auth.uid()));

-- Projects: add project_manager role
DROP POLICY IF EXISTS "Customers see their projects" ON public.projects;
CREATE POLICY "Customers see their projects" ON public.projects
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR project_manager_id = auth.uid()
    OR public.is_admin_role(auth.uid()) OR public.is_staff_role(auth.uid()));

-- ============================================================
-- SEED DEFAULT PERMISSION MATRIX
-- ============================================================
INSERT INTO public.role_permissions (role, module, allowed) VALUES
  -- Owner: all modules
  ('owner', 'dashboard', true),('owner', 'leads', true),('owner', 'quotes', true),
  ('owner', 'projects', true),('owner', 'tickets', true),('owner', 'hr', true),
  ('owner', 'blog', true),('owner', 'team', true),('owner', 'testimonials', true),
  ('owner', 'messages', true),('owner', 'users', true),('owner', 'audit', true),
  ('owner', 'permissions', true),('owner', 'tasks', true),('owner', 'leaves', true),
  ('owner', 'reports', true),('owner', 'finance', true),
  -- Admin: all modules (backward compat)
  ('admin', 'dashboard', true),('admin', 'leads', true),('admin', 'quotes', true),
  ('admin', 'projects', true),('admin', 'tickets', true),('admin', 'hr', true),
  ('admin', 'blog', true),('admin', 'team', true),('admin', 'testimonials', true),
  ('admin', 'messages', true),('admin', 'users', true),('admin', 'audit', true),
  ('admin', 'permissions', true),('admin', 'tasks', true),('admin', 'leaves', true),
  ('admin', 'reports', true),('admin', 'finance', true),
  -- Managing Director
  ('managing_director', 'dashboard', true),('managing_director', 'projects', true),
  ('managing_director', 'quotes', true),('managing_director', 'leads', true),
  ('managing_director', 'hr', true),('managing_director', 'reports', true),
  ('managing_director', 'finance', true),('managing_director', 'tickets', true),
  ('managing_director', 'team', true),
  -- Operations Manager
  ('operations_manager', 'dashboard', true),('operations_manager', 'projects', true),
  ('operations_manager', 'quotes', true),('operations_manager', 'tickets', true),
  ('operations_manager', 'tasks', true),('operations_manager', 'messages', true),
  ('operations_manager', 'leads', true),('operations_manager', 'team', true),
  -- HR Manager
  ('hr_manager', 'dashboard', true),('hr_manager', 'hr', true),
  ('hr_manager', 'leaves', true),('hr_manager', 'tasks', true),('hr_manager', 'team', true),
  -- Sales Manager
  ('sales_manager', 'dashboard', true),('sales_manager', 'leads', true),
  ('sales_manager', 'quotes', true),('sales_manager', 'tasks', true),
  ('sales_manager', 'messages', true),('sales_manager', 'reports', true),
  -- Marketing Manager
  ('marketing_manager', 'dashboard', true),('marketing_manager', 'blog', true),
  ('marketing_manager', 'testimonials', true),('marketing_manager', 'leads', true),
  ('marketing_manager', 'messages', true),
  -- Accountant
  ('accountant', 'dashboard', true),('accountant', 'finance', true),
  ('accountant', 'reports', true),('accountant', 'quotes', true),
  -- Sales Executive (staff area)
  ('sales_executive', 'dashboard', true),('sales_executive', 'leads', true),
  ('sales_executive', 'tasks', true),
  -- Project Manager (staff area)
  ('project_manager', 'dashboard', true),('project_manager', 'projects', true),
  ('project_manager', 'tasks', true),('project_manager', 'quotes', true),
  -- Site Engineer (staff area)
  ('site_engineer', 'dashboard', true),('site_engineer', 'projects', true),
  ('site_engineer', 'tasks', true),
  -- Customer Support (staff area)
  ('customer_support', 'dashboard', true),('customer_support', 'tickets', true),
  ('customer_support', 'messages', true),('customer_support', 'tasks', true),
  -- General Staff / Staff
  ('general_staff', 'dashboard', true),('general_staff', 'tasks', true),
  ('general_staff', 'leaves', true),
  ('staff', 'dashboard', true),('staff', 'tasks', true),('staff', 'leaves', true)
ON CONFLICT (role, module) DO NOTHING;

-- ============================================================
-- Migration: 20260617130000_rbac_rls_fixes.sql
-- ============================================================
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

-- ============================================================
-- Migration: 20260617140000_owner_only_rls.sql
-- ============================================================
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

-- ============================================================
-- Migration: 20260617150000_rls_complete_fix.sql
-- ============================================================
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

-- ============================================================
-- Migration: 20260617160000_revoke_legacy_role_rpcs.sql
-- ============================================================
-- Migration: Revoke legacy role-mutation RPCs from authenticated users
-- These functions (set_user_role, revoke_user_role) pre-date the owner-only
-- RBAC system and allowed any admin to escalate roles, including to owner.
-- Owner-only mutations now go through owner_set_user_role (SECURITY DEFINER,
-- checks has_role(caller, 'owner')). The legacy functions are revoked here.

-- Revoke execute from authenticated (blocks all non-superuser callers)
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.revoke_user_role(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_user_role(uuid, text) FROM anon;

-- Also revoke from public to close any residual grant paths
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.revoke_user_role(uuid, text) FROM public;
