-- ============================================================
-- ADITYA CONSTRUCTIONS — DEMO SEED DATA
-- ============================================================
-- Prerequisites:
--   1. schema_clean.sql has been applied to the database.
--   2. Auth accounts have been created via the Supabase Admin API
--      script in scripts/demo_accounts.md.
--      The handle_new_user trigger will have created a profile row
--      and a 'customer' role for each account automatically.
--
-- What this script does:
--   • Upgrades profile rows with realistic names, departments, etc.
--   • Reassigns roles to the correct enterprise roles.
--   • Populates every business table with realistic demo data.
--   • All IDs omitted — DEFAULT gen_random_uuid() is used.
--   • All FK references resolved via subqueries on profiles.email
--     so no hardcoded fake UUIDs appear anywhere.
--
-- Idempotent: run multiple times safely (ON CONFLICT / WHERE NOT EXISTS).
-- ============================================================


-- ============================================================
-- SECTION A: PROFILES — enrich with department, bio, employee_id
-- The handle_new_user trigger already created the row; we update it.
-- ============================================================

UPDATE public.profiles SET
  full_name   = 'Aditya Kumar',
  phone       = '+91-9000000001',
  department  = 'Executive',
  employee_id = 'EMP-001',
  bio         = 'Founder and Owner of Aditya Constructions. Over 20 years of experience in construction and real estate across Greater Noida.',
  status      = 'active'
WHERE email = 'owner@adityaconstruction.com';

UPDATE public.profiles SET
  full_name   = 'Raj Sharma',
  phone       = '+91-9000000002',
  department  = 'Operations',
  employee_id = 'EMP-002',
  bio         = 'Operations Manager overseeing all project execution, vendor management, and on-site coordination.',
  status      = 'active'
WHERE email = 'operations@adityaconstruction.com';

UPDATE public.profiles SET
  full_name   = 'Rahul Sharma',
  phone       = '+91-9811001001',
  department  = 'Human Resources',
  employee_id = 'EMP-003',
  bio         = 'HR Manager responsible for recruitment, payroll processing, and employee welfare.',
  status      = 'active'
WHERE email = 'rahul.sharma@adityaconstruction.com';

UPDATE public.profiles SET
  full_name   = 'Priya Gupta',
  phone       = '+91-9811001002',
  department  = 'Projects',
  employee_id = 'EMP-004',
  bio         = 'Project Manager with expertise in construction timelines, client communication, and milestone tracking.',
  status      = 'active'
WHERE email = 'priya.gupta@adityaconstruction.com';

UPDATE public.profiles SET
  full_name   = 'Amit Singh',
  phone       = '+91-9811001003',
  department  = 'Engineering',
  employee_id = 'EMP-005',
  bio         = 'Site Engineer specialising in structural supervision, quality control, and safety compliance.',
  status      = 'active'
WHERE email = 'amit.singh@adityaconstruction.com';

UPDATE public.profiles SET
  full_name   = 'Neha Verma',
  phone       = '+91-9811001004',
  department  = 'Sales',
  employee_id = 'EMP-006',
  bio         = 'Sales Executive focused on residential interiors and HVAC leads across Greater Noida.',
  status      = 'active'
WHERE email = 'neha.verma@adityaconstruction.com';

UPDATE public.profiles SET
  full_name   = 'Deepak Joshi',
  phone       = '+91-9811001008',
  department  = 'Sales',
  employee_id = 'EMP-007',
  bio         = 'Sales Manager heading the B2B and commercial real estate pipeline.',
  status      = 'active'
WHERE email = 'deepak.joshi@adityaconstruction.com';

UPDATE public.profiles SET
  full_name   = 'Kavya Nair',
  phone       = '+91-9811001009',
  department  = 'Customer Support',
  employee_id = 'EMP-008',
  bio         = 'Customer Support lead handling post-sales queries, ticketing, and client satisfaction.',
  status      = 'active'
WHERE email = 'kavya.nair@adityaconstruction.com';

UPDATE public.profiles SET
  full_name   = 'Arjun Mehta',
  phone       = '+91-9811001010',
  department  = 'Finance',
  employee_id = 'EMP-009',
  bio         = 'Accountant managing project billing, salary disbursements, and GST compliance.',
  status      = 'active'
WHERE email = 'arjun.mehta@adityaconstruction.com';

UPDATE public.profiles SET
  full_name   = 'Kiran Reddy',
  phone       = '+91-9811001015',
  department  = 'Operations',
  employee_id = 'EMP-010',
  bio         = 'General staff member assisting with site logistics and material procurement.',
  status      = 'active'
WHERE email = 'kiran.reddy@adityaconstruction.com';

UPDATE public.profiles SET
  full_name   = 'Vikram Nair',
  phone       = '+91-9900001001',
  company     = 'Nair Enterprises',
  status      = 'active'
WHERE email = 'customer1@example.com';

UPDATE public.profiles SET
  full_name   = 'Sunita Patel',
  phone       = '+91-9900001002',
  company     = 'Patel Residences',
  status      = 'active'
WHERE email = 'customer2@example.com';


-- ============================================================
-- SECTION B: USER ROLES
-- The trigger assigned 'customer' to everyone on signup.
-- We now delete that and insert the correct role for each staff
-- account. Customer accounts keep their 'customer' role.
-- ============================================================

-- Remove the auto-assigned 'customer' role from staff accounts
DELETE FROM public.user_roles
WHERE role = 'customer'
  AND user_id IN (
    SELECT id FROM public.profiles
    WHERE email IN (
      'owner@adityaconstruction.com',
      'operations@adityaconstruction.com',
      'rahul.sharma@adityaconstruction.com',
      'priya.gupta@adityaconstruction.com',
      'amit.singh@adityaconstruction.com',
      'neha.verma@adityaconstruction.com',
      'deepak.joshi@adityaconstruction.com',
      'kavya.nair@adityaconstruction.com',
      'arjun.mehta@adityaconstruction.com',
      'kiran.reddy@adityaconstruction.com'
    )
  );

-- Assign correct enterprise roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'::public.app_role
FROM public.profiles WHERE email = 'owner@adityaconstruction.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'operations_manager'::public.app_role
FROM public.profiles WHERE email = 'operations@adityaconstruction.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'hr_manager'::public.app_role
FROM public.profiles WHERE email = 'rahul.sharma@adityaconstruction.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'project_manager'::public.app_role
FROM public.profiles WHERE email = 'priya.gupta@adityaconstruction.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'site_engineer'::public.app_role
FROM public.profiles WHERE email = 'amit.singh@adityaconstruction.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'sales_executive'::public.app_role
FROM public.profiles WHERE email = 'neha.verma@adityaconstruction.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'sales_manager'::public.app_role
FROM public.profiles WHERE email = 'deepak.joshi@adityaconstruction.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'customer_support'::public.app_role
FROM public.profiles WHERE email = 'kavya.nair@adityaconstruction.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'accountant'::public.app_role
FROM public.profiles WHERE email = 'arjun.mehta@adityaconstruction.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'staff'::public.app_role
FROM public.profiles WHERE email = 'kiran.reddy@adityaconstruction.com'
ON CONFLICT (user_id, role) DO NOTHING;


-- ============================================================
-- SECTION C: LEADS
-- ============================================================

INSERT INTO public.leads (name, email, phone, service, message, source, status, assigned_to, notes)
SELECT
  v.name, v.email, v.phone,
  v.service::public.service_type, v.message, v.source,
  v.status::public.lead_status,
  (SELECT id FROM public.profiles WHERE email = v.assigned_email),
  v.notes
FROM (VALUES
  ('Rohit Agarwal',    'rohit.agarwal@gmail.com',    '+91-9871234501', 'construction',
   'Looking for commercial office building 10,000 sq ft in Sector 62',  'website',  'qualified',
   'neha.verma@adityaconstruction.com',
   'Budget confirmed Rs 2.5 Cr. Site visit scheduled for next week.'),

  ('Meena Krishnan',   'meena.k@hotmail.com',        '+91-9871234502', 'interiors',
   'Need complete interior design and furnishing for 3BHK flat',        'referral', 'contacted',
   'neha.verma@adityaconstruction.com',
   'Referred by Vikram Nair. Prefers minimal Scandinavian style.'),

  ('Suresh Balakrishna','suresh.b@yahoo.com',         '+91-9871234503', 'solar',
   'Want to install rooftop solar for factory in Greater Noida',        'google',   'new',
   'deepak.joshi@adityaconstruction.com',
   NULL),

  ('Pooja Taneja',     'pooja.taneja@outlook.com',   '+91-9871234504', 'real_estate',
   'Interested in 2BHK plots in Sector 150 Noida',                      'website',  'converted',
   'deepak.joshi@adityaconstruction.com',
   'Converted to project. Deposit collected.'),

  ('Harish Gupta',     'harish.gupta@gmail.com',     '+91-9871234505', 'hvac',
   'Central AC installation for showroom 4,000 sq ft',                  'instagram','new',
   'neha.verma@adityaconstruction.com',
   NULL),

  ('Ritu Malhotra',    'ritu.malhotra@gmail.com',    '+91-9871234506', 'construction',
   'Residential villa construction G+2 in Greater Noida West',          'website',  'qualified',
   'deepak.joshi@adityaconstruction.com',
   'Has approved architect drawings. Ready to sign contract.'),

  ('Anil Kapoor',      'anil.kapoor.gn@gmail.com',   '+91-9871234507', 'interiors',
   'Office interior for 2,500 sq ft co-working space',                   'linkedin', 'contacted',
   'neha.verma@adityaconstruction.com',
   'Follow up after Diwali break.'),

  ('Sangeeta Rao',     'sangeeta.rao@gmail.com',     '+91-9871234508', 'solar',
   'Residential solar system 10 kW for 4BHK bungalow',                  'referral', 'lost',
   'neha.verma@adityaconstruction.com',
   'Went with competitor on price.'),

  ('Tarun Bajaj',      'tarun.bajaj@gmail.com',      '+91-9871234509', 'real_estate',
   'Looking for commercial plot near NH24',                              'website',  'new',
   'deepak.joshi@adityaconstruction.com',
   NULL),

  ('Preethi Menon',    'preethi.menon@gmail.com',    '+91-9871234510', 'construction',
   'Warehouse construction 50,000 sq ft in Industrial Area Phase II',    'google',   'qualified',
   'deepak.joshi@adityaconstruction.com',
   'Large industrial project. Owner meeting required.')
) AS v(name, email, phone, service, message, source, status, assigned_email, notes)
WHERE NOT EXISTS (
  SELECT 1 FROM public.leads WHERE leads.email = v.email
);


-- ============================================================
-- SECTION D: CONTACT MESSAGES
-- ============================================================

INSERT INTO public.contact_messages (name, email, phone, subject, message, handled)
SELECT v.name, v.email, v.phone, v.subject, v.message, v.handled
FROM (VALUES
  ('Amit Bose',      'amit.bose@gmail.com',      '+91-9812340001',
   'General Enquiry',
   'Hi, I would like to know more about your solar installation services and pricing for residential properties.',
   false),

  ('Rekha Sharma',   'rekha.sharma@gmail.com',   '+91-9812340002',
   'Project Status',
   'I am Rekha Sharma, customer ID C-1024. Could someone please update me on the interior work progress at my flat in Sector 93?',
   true),

  ('Gaurav Mehta',   'gaurav.mehta@gmail.com',   '+91-9812340003',
   'Partnership Enquiry',
   'We are a materials supplier and would like to explore supply partnerships with Aditya Constructions.',
   false),

  ('Divya Pillai',   'divya.pillai@gmail.com',   '+91-9812340004',
   'Complaint',
   'The tiles in my kitchen have started chipping within 6 months of completion. Please send someone to inspect.',
   true),

  ('Nikhil Jain',    'nikhil.jain@gmail.com',    '+91-9812340005',
   'Quote Request',
   'Kindly share a detailed quote for HVAC installation in a 6,000 sq ft showroom in Noida Sector 18.',
   false),

  ('Smita Kulkarni', 'smita.kulkarni@gmail.com', '+91-9812340006',
   'Career',
   'I am a civil engineer with 8 years experience and would like to apply for a site engineer position.',
   false)
) AS v(name, email, phone, subject, message, handled)
WHERE NOT EXISTS (
  SELECT 1 FROM public.contact_messages WHERE contact_messages.email = v.email
);


-- ============================================================
-- SECTION E: QUOTE REQUESTS
-- ============================================================

INSERT INTO public.quote_requests
  (user_id, name, email, phone, service_type, project_type, budget_range,
   timeline, location, area_sqft, requirements, status, quoted_amount)
SELECT
  (SELECT id FROM public.profiles WHERE email = v.user_email),
  v.name, v.email, v.phone,
  v.service_type::public.service_type,
  v.project_type, v.budget_range, v.timeline, v.location,
  v.area_sqft::integer, v.requirements,
  v.status::public.quote_status, v.quoted_amount::numeric
FROM (VALUES
  ('customer1@example.com',
   'Vikram Nair',    'customer1@example.com',    '+91-9900001001',
   'construction',   'Commercial Office Building', 'Rs 2-3 Cr',
   '12 months',      'Sector 62, Noida',           10000,
   'G+4 commercial office building with basement parking, 4 lifts, fire safety systems, and modern facade.',
   'quoted',         2750000.00),

  ('customer2@example.com',
   'Sunita Patel',   'customer2@example.com',    '+91-9900001002',
   'interiors',      '3BHK Apartment Interior',   'Rs 25-35 L',
   '4 months',       'Gaur City 2, Greater Noida', 1450,
   'Full interior including modular kitchen, wardrobes, false ceiling with lighting, bathroom fittings, and furniture.',
   'accepted',       2950000.00),

  (NULL,
   'Sanjay Rathore', 'sanjay.r@gmail.com',       '+91-9871234520',
   'solar',          'Rooftop Solar',             'Rs 5-8 L',
   '1 month',        'Greater Noida West',        NULL,
   '10 kW rooftop solar with battery backup for 4BHK bungalow. Need net metering.',
   'reviewing',      NULL),

  (NULL,
   'Anita Desai',    'anita.desai@gmail.com',     '+91-9871234521',
   'hvac',           'Central Air Conditioning',  'Rs 8-12 L',
   '2 months',       'Sector 50, Noida',           4000,
   'VRF central AC system for 4,000 sq ft showroom with 8 zones.',
   'pending',        NULL),

  (NULL,
   'Karthik Iyer',   'karthik.iyer@gmail.com',    '+91-9871234522',
   'real_estate',    'Plot Purchase',             'Rs 50-70 L',
   'Immediate',      'Greater Noida',             NULL,
   'Looking for 200 sq yard residential plot near NH24 or expressway.',
   'pending',        NULL)
) AS v(user_email, name, email, phone, service_type, project_type, budget_range,
        timeline, location, area_sqft, requirements, status, quoted_amount)
WHERE NOT EXISTS (
  SELECT 1 FROM public.quote_requests WHERE quote_requests.email = v.email
);


-- ============================================================
-- SECTION F: PROJECTS
-- We insert projects and capture their generated IDs using a
-- writable CTE so we can reference them in later sections.
-- ============================================================

WITH inserted_projects AS (
  INSERT INTO public.projects
    (customer_id, project_manager_id, title, description, service_type,
     status, progress, budget, spent, start_date, end_date, location)
  SELECT
    (SELECT id FROM public.profiles WHERE email = v.customer_email),
    (SELECT id FROM public.profiles WHERE email = 'priya.gupta@adityaconstruction.com'),
    v.title, v.description,
    v.service_type::public.service_type,
    v.status::public.project_status,
    v.progress::integer,
    v.budget::numeric, v.spent::numeric,
    v.start_date::date, v.end_date::date,
    v.location
  FROM (VALUES
    ('customer1@example.com',
     'Nair Enterprises Office Building',
     'G+4 commercial office building with basement parking in Sector 62 Noida. Modern glass facade with green building features.',
     'construction', 'in_progress', 45,
     27500000, 12375000, '2025-02-01', '2026-02-28', 'Sector 62, Noida'),

    ('customer2@example.com',
     'Sunita Patel 3BHK Interior',
     'Complete interior design and furnishing for 3BHK apartment. Scandinavian-minimal theme with warm accents.',
     'interiors', 'in_progress', 70,
     2950000, 2065000, '2025-10-15', '2026-02-15', 'Gaur City 2, Greater Noida'),

    ('customer1@example.com',
     'Nair Warehouse Phase 1',
     'Industrial warehouse construction 50,000 sq ft with dock levellers, fire suppression, and CCTV.',
     'construction', 'planning', 5,
     18000000, 900000, '2026-03-01', '2027-03-31', 'Industrial Area Phase II, Greater Noida'),

    ('customer2@example.com',
     'Patel Residence Solar Installation',
     '10 kW rooftop solar PV system with 20 kWh battery backup and smart monitoring.',
     'solar', 'completed', 100,
     650000, 650000, '2025-07-01', '2025-07-31', 'Greater Noida West'),

    ('customer1@example.com',
     'Nair Showroom HVAC',
     'VRF central AC system for Nair Enterprises showroom with 8 independent zones and smart controls.',
     'hvac', 'on_hold', 15,
     1100000, 165000, '2025-11-01', '2026-01-31', 'Sector 50, Noida')
  ) AS v(customer_email, title, description, service_type, status, progress,
          budget, spent, start_date, end_date, location)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.projects WHERE projects.title = v.title
  )
  RETURNING id, title
)
SELECT id, title FROM inserted_projects; -- ensures CTE executes


-- ============================================================
-- SECTION G: PROJECT MILESTONES
-- ============================================================

-- Milestones for "Nair Enterprises Office Building"
INSERT INTO public.project_milestones (project_id, title, description, due_date, status, order_index, completed_at)
SELECT
  (SELECT id FROM public.projects WHERE title = 'Nair Enterprises Office Building'),
  v.title, v.description, v.due_date::date,
  v.status::public.milestone_status, v.order_index::integer,
  v.completed_at::timestamptz
FROM (VALUES
  ('Foundation & Basement',
   'Complete excavation, RCC foundation piling, and basement floor slab.',
   '2025-04-30', 'completed', 1, '2025-04-25 00:00:00+05:30'),

  ('Ground Floor Structure',
   'RCC columns, beams, and slab for ground floor.',
   '2025-06-30', 'completed', 2, '2025-06-28 00:00:00+05:30'),

  ('Floors 1–3 Structure',
   'RCC framework for first three floors including staircase core.',
   '2025-09-30', 'in_progress', 3, NULL),

  ('Floor 4 & Roof',
   'Top floor slab, terrace waterproofing, and parapet walls.',
   '2025-12-31', 'pending', 4, NULL),

  ('Facade & Glazing',
   'Install glass curtain wall facade and aluminium windows.',
   '2026-01-31', 'pending', 5, NULL),

  ('MEP & Interiors',
   'Mechanical, electrical, plumbing, lift installation, and lobby finishes.',
   '2026-02-28', 'pending', 6, NULL)
) AS v(title, description, due_date, status, order_index, completed_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_milestones
  WHERE project_milestones.project_id = (SELECT id FROM public.projects WHERE title = 'Nair Enterprises Office Building')
    AND project_milestones.title = v.title
);

-- Milestones for "Sunita Patel 3BHK Interior"
INSERT INTO public.project_milestones (project_id, title, description, due_date, status, order_index, completed_at)
SELECT
  (SELECT id FROM public.projects WHERE title = 'Sunita Patel 3BHK Interior'),
  v.title, v.description, v.due_date::date,
  v.status::public.milestone_status, v.order_index::integer,
  v.completed_at::timestamptz
FROM (VALUES
  ('Demolition & Civil',
   'Remove old tiles, replaster walls and ceiling, fix electrical conduits.',
   '2025-11-15', 'completed', 1, '2025-11-13 00:00:00+05:30'),

  ('Flooring',
   'Lay Italian marble in living areas and vitrified tiles in bedrooms.',
   '2025-12-15', 'completed', 2, '2025-12-12 00:00:00+05:30'),

  ('Modular Kitchen & Wardrobes',
   'Install modular kitchen with hettich fittings and bedroom wardrobes.',
   '2026-01-15', 'in_progress', 3, NULL),

  ('False Ceiling & Lighting',
   'Gypsum false ceiling with cove lighting in all rooms.',
   '2026-01-31', 'pending', 4, NULL),

  ('Painting & Furnishing',
   'Final painting, furniture delivery, and soft furnishings.',
   '2026-02-15', 'pending', 5, NULL)
) AS v(title, description, due_date, status, order_index, completed_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_milestones
  WHERE project_milestones.project_id = (SELECT id FROM public.projects WHERE title = 'Sunita Patel 3BHK Interior')
    AND project_milestones.title = v.title
);

-- Milestones for "Patel Residence Solar Installation" (completed)
INSERT INTO public.project_milestones (project_id, title, description, due_date, status, order_index, completed_at)
SELECT
  (SELECT id FROM public.projects WHERE title = 'Patel Residence Solar Installation'),
  v.title, v.description, v.due_date::date,
  v.status::public.milestone_status, v.order_index::integer,
  v.completed_at::timestamptz
FROM (VALUES
  ('Site Survey & Design',
   'Rooftop survey, shadow analysis, and system design finalisation.',
   '2025-07-05', 'completed', 1, '2025-07-04 00:00:00+05:30'),

  ('Panel & Inverter Installation',
   'Mount 30 panels on roof, install 10 kW inverter and battery bank.',
   '2025-07-20', 'completed', 2, '2025-07-18 00:00:00+05:30'),

  ('Grid Tie & Commissioning',
   'Connect to PVVNL grid, net metering registration, and handover.',
   '2025-07-31', 'completed', 3, '2025-07-30 00:00:00+05:30')
) AS v(title, description, due_date, status, order_index, completed_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_milestones
  WHERE project_milestones.project_id = (SELECT id FROM public.projects WHERE title = 'Patel Residence Solar Installation')
    AND project_milestones.title = v.title
);


-- ============================================================
-- SECTION H: PROJECT UPDATES
-- ============================================================

INSERT INTO public.project_updates (project_id, author_id, title, content, created_at)
SELECT
  (SELECT id FROM public.projects WHERE title = 'Nair Enterprises Office Building'),
  (SELECT id FROM public.profiles WHERE email = 'priya.gupta@adityaconstruction.com'),
  v.title, v.content, v.created_at::timestamptz
FROM (VALUES
  ('Foundation Work Complete',
   'The RCC pile foundation and basement retaining walls have been completed ahead of schedule. All concrete cube tests passed at 28-day strength. Ready to begin ground floor columns.',
   '2025-04-26 10:00:00+05:30'),

  ('Ground Floor Slab Cast',
   'Ground floor slab (4,200 sq ft) has been poured and cured successfully. Shuttering removal in progress. Lift shaft core walls started.',
   '2025-07-02 09:30:00+05:30'),

  ('First Floor Progress',
   'First floor columns and beams are 60% complete. Steel reinforcement inspected and approved by structural consultant. On track for September milestone.',
   '2025-09-01 11:00:00+05:30')
) AS v(title, content, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_updates
  WHERE project_updates.project_id = (SELECT id FROM public.projects WHERE title = 'Nair Enterprises Office Building')
    AND project_updates.title = v.title
);

INSERT INTO public.project_updates (project_id, author_id, title, content, created_at)
SELECT
  (SELECT id FROM public.projects WHERE title = 'Sunita Patel 3BHK Interior'),
  (SELECT id FROM public.profiles WHERE email = 'priya.gupta@adityaconstruction.com'),
  v.title, v.content, v.created_at::timestamptz
FROM (VALUES
  ('Civil Work Completed',
   'All demolition and replastering work has been finished. Electrical conduits laid and concealed. Waterproofing in bathrooms applied — 48-hour water test passed.',
   '2025-11-14 14:00:00+05:30'),

  ('Flooring Installed',
   'Italian marble laid in living room and dining. Vitrified tiles installed in all three bedrooms. Grouting and polishing complete.',
   '2025-12-13 16:30:00+05:30'),

  ('Kitchen Cabinets Under Installation',
   'Modular kitchen upper and lower cabinets installed. Countertop (black granite) being cut and fitted. Hettich soft-close fittings in all drawers.',
   '2026-01-10 12:00:00+05:30')
) AS v(title, content, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_updates
  WHERE project_updates.project_id = (SELECT id FROM public.projects WHERE title = 'Sunita Patel 3BHK Interior')
    AND project_updates.title = v.title
);


-- ============================================================
-- SECTION I: TICKETS (SUPPORT)
-- ============================================================

INSERT INTO public.tickets
  (customer_id, project_id, assigned_to, subject, message, status, priority, created_at)
SELECT
  (SELECT id FROM public.profiles WHERE email = v.customer_email),
  (SELECT id FROM public.projects  WHERE title  = v.project_title),
  (SELECT id FROM public.profiles WHERE email = 'kavya.nair@adityaconstruction.com'),
  v.subject, v.message,
  v.status::public.ticket_status,
  v.priority::public.ticket_priority,
  v.created_at::timestamptz
FROM (VALUES
  ('customer1@example.com', 'Nair Enterprises Office Building',
   'Delay in third floor slab — need updated timeline',
   'The third floor slab was supposed to be done by end of September. It is now October and I have not received any update. Please send a revised schedule.',
   'open', 'high', '2025-10-05 09:00:00+05:30'),

  ('customer2@example.com', 'Sunita Patel 3BHK Interior',
   'Kitchen countertop colour mismatch',
   'The black granite installed does not match the sample approved at Haridwar Marbles. Please arrange for an inspection and replacement.',
   'in_progress', 'medium', '2026-01-12 11:30:00+05:30'),

  ('customer1@example.com', NULL,
   'Invoice discrepancy — payment receipt not received',
   'I paid Rs 12.5 lakh on 15 Dec via RTGS. I have not received the official receipt or updated invoice. Reference: RTGS/2025/1215/0042.',
   'resolved', 'high', '2025-12-18 10:00:00+05:30'),

  ('customer2@example.com', 'Sunita Patel 3BHK Interior',
   'Request for additional power points in master bedroom',
   'We would like two extra 16A points on the east wall of the master bedroom. Is this still possible before the false ceiling is done?',
   'open', 'low', '2026-01-08 15:00:00+05:30')
) AS v(customer_email, project_title, subject, message, status, priority, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tickets
  WHERE tickets.customer_id = (SELECT id FROM public.profiles WHERE email = v.customer_email)
    AND tickets.subject = v.subject
);


-- ============================================================
-- SECTION J: TICKET MESSAGES
-- ============================================================

INSERT INTO public.ticket_messages (ticket_id, author_id, message, created_at)
SELECT
  (SELECT t.id FROM public.tickets t
   JOIN public.profiles p ON t.customer_id = p.id
   WHERE p.email = 'customer1@example.com'
     AND t.subject = 'Delay in third floor slab — need updated timeline'
   LIMIT 1),
  (SELECT id FROM public.profiles WHERE email = 'kavya.nair@adityaconstruction.com'),
  'Hello Vikram ji, thank you for reaching out. I have escalated this to Priya Gupta (Project Manager). She will share an updated schedule by Friday. Apologies for the inconvenience.',
  '2025-10-05 14:00:00+05:30'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ticket_messages tm
  JOIN public.tickets t ON tm.ticket_id = t.id
  JOIN public.profiles p ON t.customer_id = p.id
  WHERE p.email = 'customer1@example.com'
    AND t.subject = 'Delay in third floor slab — need updated timeline'
);

INSERT INTO public.ticket_messages (ticket_id, author_id, message, created_at)
SELECT
  (SELECT t.id FROM public.tickets t
   JOIN public.profiles p ON t.customer_id = p.id
   WHERE p.email = 'customer2@example.com'
     AND t.subject = 'Kitchen countertop colour mismatch'
   LIMIT 1),
  (SELECT id FROM public.profiles WHERE email = 'kavya.nair@adityaconstruction.com'),
  'Dear Sunita ji, our site supervisor Amit Singh will visit on 14 Jan to inspect the countertop. We will compare against your approved sample. If there is indeed a mismatch we will replace it at no cost.',
  '2026-01-12 17:00:00+05:30'
WHERE NOT EXISTS (
  SELECT 1 FROM public.ticket_messages tm
  JOIN public.tickets t ON tm.ticket_id = t.id
  JOIN public.profiles p ON t.customer_id = p.id
  WHERE p.email = 'customer2@example.com'
    AND t.subject = 'Kitchen countertop colour mismatch'
);


-- ============================================================
-- SECTION K: TESTIMONIALS
-- ============================================================

INSERT INTO public.testimonials (client_name, client_role, content, rating, project_type, featured, published)
SELECT v.client_name, v.client_role, v.content, v.rating::integer,
       v.project_type::public.service_type, v.featured::boolean, v.published::boolean
FROM (VALUES
  ('Sunita Patel',
   'Homeowner, Greater Noida West',
   'Aditya Constructions transformed our flat into a beautiful home. Every detail from the marble flooring to the modular kitchen was executed perfectly. The team was professional, punctual, and kept us updated throughout. Highly recommended!',
   5, 'interiors', true, true),

  ('Rajesh Khanna',
   'Director, Khanna Industries',
   'We engaged Aditya Constructions for our factory warehouse and were impressed by their project management discipline. They delivered on time within budget — rare in this industry. The structural quality is excellent.',
   5, 'construction', true, true),

  ('Priya Bhatia',
   'Resident, Sector 93 Noida',
   'The solar installation by Aditya Constructions was seamless. From permit processing to commissioning, everything was handled professionally. Our electricity bill dropped by 80% in the first month!',
   5, 'solar', true, true),

  ('Manish Agarwal',
   'Business Owner, Noida',
   'Got our showroom HVAC installed. Very satisfied with the VRF system and the clean installation. The team explained everything clearly. Minor delay in delivery but overall a good experience.',
   4, 'hvac', false, true),

  ('Deepa Nair',
   'Property Investor',
   'Aditya Constructions helped us source the right plot and managed the entire legal and registration process. Very trustworthy and transparent. Will use them again for future purchases.',
   5, 'real_estate', true, true),

  ('Sunil Verma',
   'Managing Director, Verma Group',
   'Our G+3 commercial building was built by Aditya Constructions. Solid construction quality with attention to fire safety and green building norms. The glass facade looks stunning. Highly recommend for commercial projects.',
   5, 'construction', false, true)
) AS v(client_name, client_role, content, rating, project_type, featured, published)
WHERE NOT EXISTS (
  SELECT 1 FROM public.testimonials WHERE testimonials.client_name = v.client_name
);


-- ============================================================
-- SECTION L: BLOG POSTS
-- ============================================================

INSERT INTO public.blog_posts
  (slug, title, excerpt, content, author_id, category, published, published_at)
SELECT
  v.slug, v.title, v.excerpt, v.content,
  (SELECT id FROM public.profiles WHERE email = 'owner@adityaconstruction.com'),
  v.category, true, v.published_at::timestamptz
FROM (VALUES
  ('vastu-tips-for-modern-homes',
   'Vastu Shastra Tips for Modern Homes in Greater Noida',
   'How to blend traditional Vastu principles with contemporary architecture to create harmonious living spaces.',
   'Vastu Shastra, the ancient Indian science of architecture, offers timeless guidance for designing homes that promote health, prosperity, and harmony. In modern construction, many homeowners in Greater Noida ask whether Vastu principles can be integrated without compromising on contemporary design. The answer is a resounding yes.

**Entrance and Main Door**
The main entrance should ideally face East or North. An East-facing door welcomes the morning sun, symbolising new beginnings and positive energy. Ensure the entrance is well-lit, clutter-free, and wider than any other door in the house.

**Master Bedroom**
The master bedroom should be located in the South-West corner of the home. This placement is believed to provide stability and strength to the head of the family. Avoid placing the bedroom in the North-East as it can cause sleep disturbances.

**Kitchen Placement**
The kitchen should be in the South-East corner — the zone of fire. The cooking platform should be positioned so that the cook faces East while preparing food.

**Living Room**
The living room works best in the North or East zone. Keep the centre of the living room open and avoid heavy furniture blocking energy flow.

At Aditya Constructions, our design team incorporates Vastu guidance as a natural part of the planning process, ensuring your home is both beautiful and aligned with positive energy.',
   'Interiors & Design', '2025-08-15 08:00:00+05:30'),

  ('solar-rooftop-guide-noida',
   'Complete Guide to Rooftop Solar in Noida and Greater Noida (2025)',
   'Everything homeowners and businesses need to know about installing solar panels, net metering, and government subsidies in Noida.',
   'India is experiencing a solar revolution, and Greater Noida is at the forefront of it. With over 300 sunny days per year and supportive government policies, rooftop solar is one of the smartest investments a homeowner or business can make in 2025.

**Why Go Solar?**
Electricity bills in Noida have risen 12% year-on-year. A properly sized solar system eliminates 70–90% of your electricity bill and pays for itself within 4–5 years. After that, you generate free electricity for 20+ years.

**System Sizing**
For a typical 4BHK home consuming 400–500 units per month, a 5–7 kW system is ideal. For commercial establishments, factor in peak demand and Air Conditioning load, which typically calls for systems in the 20–100 kW range.

**Net Metering**
Under the PVVNL net metering scheme, excess solar power is exported to the grid and credited to your electricity account. You only pay for the net difference between what you consume and what you generate.

**Government Subsidy**
Residential consumers are eligible for a 30% central government subsidy (PM Surya Ghar Yojana) on systems up to 3 kW, and 20% for 3–10 kW. Our team assists with all subsidy applications and DISCOM approvals.

**Why Choose Aditya Constructions?**
We use only Tier-1 solar panels (Waaree, Adani, or Luminous) and renowned inverter brands (SolarEdge, Growatt). All installations include a 5-year workmanship warranty and 25-year panel performance guarantee.',
   'Solar & Energy', '2025-09-22 09:00:00+05:30'),

  ('construction-cost-calculator-2025',
   'Construction Cost in Greater Noida 2025 — What to Expect',
   'A transparent breakdown of construction costs per square foot in Greater Noida for residential and commercial projects.',
   'One of the most common questions we receive is: how much does construction cost per square foot in Greater Noida? The answer depends on several factors — quality specifications, structural complexity, and finishes chosen.

**Residential Construction (G+2 or G+3)**

| Category        | Cost per Sq Ft |
|-----------------|----------------|
| Economy         | Rs 1,600–1,900 |
| Standard        | Rs 2,000–2,500 |
| Premium         | Rs 2,600–3,200 |
| Luxury          | Rs 3,500+      |

Economy construction uses ISI-grade materials, standard tiles, and basic MEP. Premium construction uses AAC blocks, branded sanitary ware, modular kitchens, and home automation.

**What is Included?**
- Foundation, columns, beams, slabs (RCC structure)
- Brick masonry and plastering
- Flooring (tiles or marble as per grade)
- Doors and windows
- Basic electrical and plumbing
- Painting (two coats)

**What is NOT Included?**
- Land cost
- Architect and structural consultant fees (typically 1–2%)
- Interior design (modular kitchen, false ceiling, woodwork)
- Landscaping
- Government approval fees and connection charges

**Getting an Accurate Quote**
Every project is unique. We recommend a free site visit where our engineers assess the soil conditions, setback requirements, and your functional brief to give you a precise estimate. Contact us today.',
   'Construction', '2025-11-10 10:00:00+05:30'),

  ('office-interior-trends-2026',
   '5 Office Interior Trends Dominating Greater Noida in 2026',
   'From biophilic design to activity-based workspaces — the office interior trends transforming workplaces in Noida and Greater Noida.',
   'The way we work has changed forever, and office interiors are evolving to match. Here are the five biggest office interior trends our design team is seeing in Greater Noida projects in 2026.

**1. Biophilic Design**
Incorporating plants, natural light, water features, and organic materials into office spaces reduces stress and increases productivity. Living walls and planter partitions are now standard in premium office fitouts.

**2. Activity-Based Workspaces**
Instead of assigned desks, activity-based offices offer a variety of settings — focus pods, collaboration zones, lounge areas, and phone booths. Employees choose the space that suits their task.

**3. Acoustic Engineering**
Open offices are notoriously noisy. Sound-absorbing ceiling panels, acoustic wall tiles, and carpeted zones are now non-negotiable in well-designed workplaces.

**4. Smart Lighting**
Circadian-rhythm-aligned LED lighting that adjusts colour temperature throughout the day is now cost-effective and widely available. Paired with motion sensors, it also reduces energy consumption by 40%.

**5. Sustainable Materials**
Clients are increasingly specifying low-VOC paints, recycled content tiles, FSC-certified wood, and energy-efficient glass. Green building certification (LEED or IGBC) is becoming a differentiator for commercial leasing.

Aditya Constructions'' interior division specialises in complete office turnkey fitouts from design to handover. Call us to schedule a design consultation.',
   'Interiors & Design', '2026-01-05 08:30:00+05:30')
) AS v(slug, title, excerpt, content, category, published_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.blog_posts WHERE blog_posts.slug = v.slug
);


-- ============================================================
-- SECTION M: STAFF TASKS
-- ============================================================

INSERT INTO public.staff_tasks
  (assigned_to, assigned_by, project_id, title, description, due_date, status, priority)
SELECT
  (SELECT id FROM public.profiles WHERE email = v.assigned_email),
  (SELECT id FROM public.profiles WHERE email = v.assigned_by_email),
  (SELECT id FROM public.projects  WHERE title  = v.project_title),
  v.title, v.description, v.due_date::date,
  v.status::public.task_status,
  v.priority::public.ticket_priority
FROM (VALUES
  ('amit.singh@adityaconstruction.com',
   'priya.gupta@adityaconstruction.com',
   'Nair Enterprises Office Building',
   'Inspect second floor column reinforcement',
   'Check rebar spacing, cover depth, and lap lengths on all second floor columns before concrete pour. Document with photos.',
   '2025-10-20', 'done', 'high'),

  ('amit.singh@adityaconstruction.com',
   'priya.gupta@adityaconstruction.com',
   'Nair Enterprises Office Building',
   'Submit quality report for October slab',
   'Compile cube test results, photographic record, and deviation register for October slab casting. Submit to PM by 5 Nov.',
   '2025-11-05', 'in_progress', 'medium'),

  ('kiran.reddy@adityaconstruction.com',
   'operations@adityaconstruction.com',
   'Nair Enterprises Office Building',
   'Coordinate steel delivery for 3rd floor',
   'Liaise with Rathi Steel for scheduled delivery. Ensure stacking area is prepared and crane operator is available.',
   '2025-10-25', 'done', 'high'),

  ('neha.verma@adityaconstruction.com',
   'deepak.joshi@adityaconstruction.com',
   NULL,
   'Follow up on 5 qualified leads from October',
   'Call all leads with status "qualified" and push for site visit or document collection. Update CRM notes.',
   '2025-11-15', 'done', 'medium'),

  ('neha.verma@adityaconstruction.com',
   'deepak.joshi@adityaconstruction.com',
   NULL,
   'Prepare solar brochure for residential clients',
   'Update product brochure with 2025 subsidy rates, PM Surya Ghar scheme details, and new panel models.',
   '2026-01-20', 'in_progress', 'low'),

  ('kavya.nair@adityaconstruction.com',
   'operations@adityaconstruction.com',
   NULL,
   'Respond to all open support tickets',
   'Review all tickets with status "open". Send acknowledgement within 4 hours and resolution within 48 hours.',
   '2026-01-15', 'in_progress', 'high'),

  ('arjun.mehta@adityaconstruction.com',
   'owner@adityaconstruction.com',
   NULL,
   'Prepare Q3 project billing summary',
   'Compile all invoices raised, payments received, and outstanding balances for Q3 FY2025-26. Submit to owner by 15 Jan.',
   '2026-01-15', 'todo', 'high'),

  ('rahul.sharma@adityaconstruction.com',
   'owner@adityaconstruction.com',
   NULL,
   'Process December salary disbursements',
   'Verify attendance data, process salary for all 10 staff members, and initiate bank transfers by 31 Dec.',
   '2025-12-31', 'done', 'urgent')
) AS v(assigned_email, assigned_by_email, project_title, title, description,
        due_date, status, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.staff_tasks
  WHERE staff_tasks.assigned_to = (SELECT id FROM public.profiles WHERE email = v.assigned_email)
    AND staff_tasks.title = v.title
);


-- ============================================================
-- SECTION N: ATTENDANCE
-- ============================================================

-- Insert attendance records for the past 5 working days for all staff
-- We use a fixed reference date (2026-01-10 week) for reproducibility

INSERT INTO public.attendance (user_id, date, check_in, check_out, notes)
SELECT
  (SELECT id FROM public.profiles WHERE email = v.email),
  v.work_date::date,
  (v.work_date || ' ' || v.check_in_time || '+05:30')::timestamptz,
  CASE WHEN v.checked_out THEN (v.work_date || ' ' || v.check_out_time || '+05:30')::timestamptz ELSE NULL END,
  v.notes
FROM (VALUES
  -- Amit Singh (Site Engineer) — attended all 5 days
  ('amit.singh@adityaconstruction.com', '2026-01-06', '08:02', '17:05', true, NULL),
  ('amit.singh@adityaconstruction.com', '2026-01-07', '08:10', '17:00', true, NULL),
  ('amit.singh@adityaconstruction.com', '2026-01-08', '07:55', '17:30', true, 'Extra hours for slab inspection'),
  ('amit.singh@adityaconstruction.com', '2026-01-09', '08:05', '17:00', true, NULL),
  ('amit.singh@adityaconstruction.com', '2026-01-10', '08:00', '17:10', true, NULL),

  -- Kiran Reddy (Staff) — 4 days, 1 absent
  ('kiran.reddy@adityaconstruction.com', '2026-01-06', '08:30', '17:00', true, NULL),
  ('kiran.reddy@adityaconstruction.com', '2026-01-07', '08:25', '17:00', true, NULL),
  ('kiran.reddy@adityaconstruction.com', '2026-01-09', '08:35', '17:05', true, NULL),
  ('kiran.reddy@adityaconstruction.com', '2026-01-10', '08:28', '17:00', true, NULL),

  -- Neha Verma (Sales Executive)
  ('neha.verma@adityaconstruction.com', '2026-01-06', '09:00', '18:00', true, NULL),
  ('neha.verma@adityaconstruction.com', '2026-01-07', '09:05', '18:00', true, NULL),
  ('neha.verma@adityaconstruction.com', '2026-01-08', '09:00', '18:30', true, 'Client meeting extended'),
  ('neha.verma@adityaconstruction.com', '2026-01-09', '09:10', '18:00', true, NULL),
  ('neha.verma@adityaconstruction.com', '2026-01-10', '09:00', '18:00', true, NULL),

  -- Kavya Nair (Customer Support)
  ('kavya.nair@adityaconstruction.com', '2026-01-06', '09:00', '18:00', true, NULL),
  ('kavya.nair@adityaconstruction.com', '2026-01-07', '09:02', '18:00', true, NULL),
  ('kavya.nair@adityaconstruction.com', '2026-01-08', '09:00', '18:00', true, NULL),
  ('kavya.nair@adityaconstruction.com', '2026-01-09', '09:00', '18:00', true, NULL),
  ('kavya.nair@adityaconstruction.com', '2026-01-10', '09:05', '17:55', true, NULL),

  -- Rahul Sharma (HR Manager)
  ('rahul.sharma@adityaconstruction.com', '2026-01-06', '09:00', '18:00', true, NULL),
  ('rahul.sharma@adityaconstruction.com', '2026-01-07', '09:00', '18:00', true, NULL),
  ('rahul.sharma@adityaconstruction.com', '2026-01-08', '09:00', '18:00', true, NULL),
  ('rahul.sharma@adityaconstruction.com', '2026-01-09', '09:00', '18:00', true, NULL),
  ('rahul.sharma@adityaconstruction.com', '2026-01-10', '09:00', '18:00', true, NULL),

  -- Arjun Mehta (Accountant)
  ('arjun.mehta@adityaconstruction.com', '2026-01-06', '09:15', '18:30', true, NULL),
  ('arjun.mehta@adityaconstruction.com', '2026-01-07', '09:10', '18:00', true, NULL),
  ('arjun.mehta@adityaconstruction.com', '2026-01-08', '09:00', '18:00', true, NULL),
  ('arjun.mehta@adityaconstruction.com', '2026-01-09', '09:05', '18:00', true, NULL),
  ('arjun.mehta@adityaconstruction.com', '2026-01-10', '09:00', '18:15', true, NULL)
) AS v(email, work_date, check_in_time, check_out_time, checked_out, notes)
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance
  WHERE attendance.user_id = (SELECT id FROM public.profiles WHERE email = v.email)
    AND attendance.date = v.work_date::date
);


-- ============================================================
-- SECTION O: STAFF SALARIES
-- ============================================================

INSERT INTO public.staff_salaries (staff_user_id, period_month, amount, status, notes)
SELECT
  (SELECT id FROM public.profiles WHERE email = v.email),
  v.period::date, v.amount::numeric, v.status, v.notes
FROM (VALUES
  -- December 2025 salaries
  ('operations@adityaconstruction.com',    '2025-12-01', 85000,  'paid',    'Includes Rs 5,000 performance bonus'),
  ('rahul.sharma@adityaconstruction.com',  '2025-12-01', 65000,  'paid',    NULL),
  ('priya.gupta@adityaconstruction.com',   '2025-12-01', 75000,  'paid',    NULL),
  ('amit.singh@adityaconstruction.com',    '2025-12-01', 55000,  'paid',    'Includes overtime allowance'),
  ('neha.verma@adityaconstruction.com',    '2025-12-01', 45000,  'paid',    'Base + Rs 8,000 incentive on conversions'),
  ('deepak.joshi@adityaconstruction.com',  '2025-12-01', 70000,  'paid',    'Base + Rs 10,000 commission'),
  ('kavya.nair@adityaconstruction.com',    '2025-12-01', 42000,  'paid',    NULL),
  ('arjun.mehta@adityaconstruction.com',   '2025-12-01', 60000,  'paid',    NULL),
  ('kiran.reddy@adityaconstruction.com',   '2025-12-01', 32000,  'paid',    NULL),

  -- January 2026 salaries (pending processing)
  ('operations@adityaconstruction.com',    '2026-01-01', 85000,  'pending', NULL),
  ('rahul.sharma@adityaconstruction.com',  '2026-01-01', 65000,  'pending', NULL),
  ('priya.gupta@adityaconstruction.com',   '2026-01-01', 75000,  'pending', NULL),
  ('amit.singh@adityaconstruction.com',    '2026-01-01', 55000,  'pending', NULL),
  ('neha.verma@adityaconstruction.com',    '2026-01-01', 45000,  'pending', NULL),
  ('deepak.joshi@adityaconstruction.com',  '2026-01-01', 70000,  'pending', NULL),
  ('kavya.nair@adityaconstruction.com',    '2026-01-01', 42000,  'pending', NULL),
  ('arjun.mehta@adityaconstruction.com',   '2026-01-01', 60000,  'pending', NULL),
  ('kiran.reddy@adityaconstruction.com',   '2026-01-01', 32000,  'pending', NULL)
) AS v(email, period, amount, status, notes)
WHERE NOT EXISTS (
  SELECT 1 FROM public.staff_salaries
  WHERE staff_salaries.staff_user_id = (SELECT id FROM public.profiles WHERE email = v.email)
    AND staff_salaries.period_month = v.period::date
);


-- ============================================================
-- SECTION P: STAFF LEAVES
-- ============================================================

INSERT INTO public.staff_leaves
  (staff_user_id, from_date, to_date, leave_type, status, reason)
SELECT
  (SELECT id FROM public.profiles WHERE email = v.email),
  v.from_date::date, v.to_date::date,
  v.leave_type, v.status, v.reason
FROM (VALUES
  ('kiran.reddy@adityaconstruction.com',
   '2026-01-08', '2026-01-08', 'casual', 'approved',
   'Personal errand — bank work'),

  ('neha.verma@adityaconstruction.com',
   '2026-01-20', '2026-01-22', 'casual', 'pending',
   'Family function — sister''s wedding'),

  ('amit.singh@adityaconstruction.com',
   '2025-12-25', '2025-12-26', 'casual', 'approved',
   'Christmas travel'),

  ('kavya.nair@adityaconstruction.com',
   '2025-11-01', '2025-11-05', 'sick', 'approved',
   'Viral fever — medical certificate submitted'),

  ('rahul.sharma@adityaconstruction.com',
   '2026-02-10', '2026-02-14', 'earned', 'pending',
   'Planned vacation — Rajasthan trip'),

  ('arjun.mehta@adityaconstruction.com',
   '2025-12-31', '2025-12-31', 'casual', 'approved',
   'New Year''s Eve — half day')
) AS v(email, from_date, to_date, leave_type, status, reason)
WHERE NOT EXISTS (
  SELECT 1 FROM public.staff_leaves
  WHERE staff_leaves.staff_user_id = (SELECT id FROM public.profiles WHERE email = v.email)
    AND staff_leaves.from_date = v.from_date::date
    AND staff_leaves.to_date = v.to_date::date
);


-- ============================================================
-- SECTION Q: AUDIT LOGS
-- ============================================================

INSERT INTO public.audit_logs
  (actor_id, actor_email, action, target_type, target_id, target_email, metadata, created_at)
SELECT
  (SELECT id FROM public.profiles WHERE email = v.actor_email),
  v.actor_email,
  v.action,
  v.target_type,
  CASE
    WHEN v.target_type = 'user' THEN
      (SELECT id::text FROM public.profiles WHERE email = v.target_email)
    ELSE v.target_id
  END,
  v.target_email,
  v.metadata::jsonb,
  v.created_at::timestamptz
FROM (VALUES
  ('owner@adityaconstruction.com',
   'role_change', 'user',
   'operations@adityaconstruction.com',
   '{"old_role":"customer","new_role":"operations_manager"}',
   '2025-07-01 10:00:00+05:30'),

  ('owner@adityaconstruction.com',
   'user_created', 'user',
   'priya.gupta@adityaconstruction.com',
   '{"role":"project_manager","department":"Projects"}',
   '2025-07-01 10:15:00+05:30'),

  ('owner@adityaconstruction.com',
   'project_created', 'project',
   NULL,
   '{"project_title":"Nair Enterprises Office Building","budget":27500000}',
   '2025-01-20 09:00:00+05:30'),

  ('operations@adityaconstruction.com',
   'lead_status_updated', 'lead',
   NULL,
   '{"lead_email":"pooja.taneja@outlook.com","old_status":"qualified","new_status":"converted"}',
   '2025-09-10 14:30:00+05:30'),

  ('owner@adityaconstruction.com',
   'permission_updated', 'role',
   NULL,
   '{"role":"sales_executive","module":"reports","allowed":false}',
   '2025-10-05 11:00:00+05:30'),

  ('rahul.sharma@adityaconstruction.com',
   'salary_disbursed', 'user',
   'kiran.reddy@adityaconstruction.com',
   '{"period":"2025-12","amount":32000,"method":"bank_transfer"}',
   '2025-12-31 17:00:00+05:30'),

  ('kavya.nair@adityaconstruction.com',
   'ticket_resolved', 'ticket',
   NULL,
   '{"subject":"Invoice discrepancy — payment receipt not received","customer":"customer1@example.com"}',
   '2025-12-20 15:00:00+05:30'),

  ('owner@adityaconstruction.com',
   'blog_published', 'blog_post',
   NULL,
   '{"slug":"solar-rooftop-guide-noida","title":"Complete Guide to Rooftop Solar in Noida"}',
   '2025-09-22 09:05:00+05:30')
) AS v(actor_email, action, target_type, target_email, metadata, created_at)
CROSS JOIN LATERAL (SELECT NULL AS target_id) dummy
WHERE NOT EXISTS (
  SELECT 1 FROM public.audit_logs
  WHERE audit_logs.actor_id = (SELECT id FROM public.profiles WHERE email = v.actor_email)
    AND audit_logs.action = v.action
    AND audit_logs.created_at = v.created_at::timestamptz
);


-- ============================================================
-- SECTION R: USER SESSIONS
-- ============================================================

INSERT INTO public.user_sessions (user_id, ip_address, user_agent, device_type, location, is_active)
SELECT
  (SELECT id FROM public.profiles WHERE email = v.email),
  v.ip_address, v.user_agent, v.device_type, v.location, v.is_active::boolean
FROM (VALUES
  ('owner@adityaconstruction.com',
   '203.145.12.44',
   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
   'desktop', 'Greater Noida, UP', true),

  ('priya.gupta@adityaconstruction.com',
   '203.145.12.52',
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
   'desktop', 'Noida, UP', true),

  ('deepak.joshi@adityaconstruction.com',
   '49.36.220.105',
   'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
   'mobile', 'Greater Noida, UP', true),

  ('kavya.nair@adityaconstruction.com',
   '203.145.12.55',
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
   'desktop', 'Noida, UP', true),

  ('customer1@example.com',
   '110.235.48.22',
   'Mozilla/5.0 (Android 13; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',
   'mobile', 'Delhi, NCR', false)
) AS v(email, ip_address, user_agent, device_type, location, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_sessions
  WHERE user_sessions.user_id = (SELECT id FROM public.profiles WHERE email = v.email)
    AND user_sessions.ip_address = v.ip_address
);


-- ============================================================
-- SECTION S: IMPERSONATION LOG
-- ============================================================

INSERT INTO public.impersonation_log (impersonator_id, target_user_id, started_at, ended_at, reason)
SELECT
  (SELECT id FROM public.profiles WHERE email = 'owner@adityaconstruction.com'),
  (SELECT id FROM public.profiles WHERE email = v.target_email),
  v.started_at::timestamptz,
  v.ended_at::timestamptz,
  v.reason
FROM (VALUES
  ('customer1@example.com',
   '2025-12-20 11:00:00+05:30', '2025-12-20 11:15:00+05:30',
   'Verifying invoice visibility for customer support ticket #3'),

  ('kavya.nair@adityaconstruction.com',
   '2026-01-05 14:00:00+05:30', '2026-01-05 14:10:00+05:30',
   'Debugging ticket creation flow reported by customer support team')
) AS v(target_email, started_at, ended_at, reason)
WHERE NOT EXISTS (
  SELECT 1 FROM public.impersonation_log
  WHERE impersonation_log.impersonator_id = (SELECT id FROM public.profiles WHERE email = 'owner@adityaconstruction.com')
    AND impersonation_log.target_user_id  = (SELECT id FROM public.profiles WHERE email = v.target_email)
    AND impersonation_log.started_at      = v.started_at::timestamptz
);


-- ============================================================
-- SEED COMPLETE
-- Run the verification query below to confirm:
--
-- SELECT
--   p.email,
--   p.full_name,
--   p.department,
--   ur.role
-- FROM public.profiles p
-- LEFT JOIN public.user_roles ur ON ur.user_id = p.id
-- ORDER BY ur.role, p.email;
-- ============================================================
