
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
