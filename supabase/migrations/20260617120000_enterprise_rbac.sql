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
