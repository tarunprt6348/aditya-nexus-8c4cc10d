
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
