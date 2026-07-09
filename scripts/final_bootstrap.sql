-- =================================================================
-- ADITYA CONSTRUCTIONS — FINAL BOOTSTRAP
-- Purpose : Populate the already-migrated Supabase database with
--           demo users (profiles + roles), the full permission
--           matrix, and realistic business seed data.
--
-- Prerequisites : Run schema_clean.sql first (all tables, enums,
--                 triggers, policies, and functions must exist).
--
-- Idempotent  : Safe to run multiple times.  Every INSERT uses
--               ON CONFLICT … DO UPDATE or ON CONFLICT … DO NOTHING.
--
-- Auth users  : Cannot be created via SQL — Supabase Auth is
--               managed outside PostgreSQL.  Section 1 detects
--               which of the 10 demo accounts are missing and
--               prints Admin-API curl commands to create them.
-- =================================================================

-- =================================================================
-- SECTION 1 — AUTH USER DETECTION
-- Prints a NOTICE per missing user + the curl command to create it.
-- If all 10 exist the block is a no-op.
-- =================================================================
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT v.id::uuid AS uid, v.email, v.password, v.full_name
    FROM (VALUES
      ('25bab248-2845-4c67-8c65-d674120b67c7','owner@adityaconstruction.com',       'Owner@123','Aditya Owner'),
      ('6ed29f27-f975-456a-a87a-d4a619fa7493','operations@adityaconstruction.com',  'Ops@123',  'Operations Manager'),
      ('b05836e8-f1e4-45c5-b59c-4e8f3db3b53c','rahul.sharma@adityaconstruction.com','Staff@123','Rahul Sharma'),
      ('95ec572b-c804-488e-977d-6f21cd9bf349','priya.gupta@adityaconstruction.com', 'Staff@123','Priya Gupta'),
      ('a55461da-4780-4624-8854-6ad7eb8fbc3b','amit.singh@adityaconstruction.com',  'Staff@123','Amit Singh'),
      ('85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01','neha.verma@adityaconstruction.com',  'Staff@123','Neha Verma'),
      ('fbbe86ee-0d2b-4de8-ab31-8d1daa807685','deepak.joshi@adityaconstruction.com','Staff@123','Deepak Joshi'),
      ('85610fb3-06ae-43b7-93c4-1e98bb98dae3','kavya.nair@adityaconstruction.com',  'Staff@123','Kavya Nair'),
      ('742b15de-6ed8-46e5-86b4-577c91c8136d','arjun.mehta@adityaconstruction.com', 'Staff@123','Arjun Mehta'),
      ('774c222a-c67b-494c-8738-a9c5fa17dd1f','kiran.reddy@adityaconstruction.com', 'Staff@123','Kiran Reddy')
    ) AS v(id, email, password, full_name)
    WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v.id::uuid)
  LOOP
    RAISE NOTICE
      E'MISSING AUTH USER: %\nCreate via Supabase Dashboard → Authentication → Users → "Add user"\nor via Admin API:\ncurl -X POST https://<project-ref>.supabase.co/auth/v1/admin/users \\\n  -H "apikey: <service-role-key>" \\\n  -H "Authorization: Bearer <service-role-key>" \\\n  -H "Content-Type: application/json" \\\n  -d ''{"email":"%","password":"%","email_confirm":true,"user_metadata":{"full_name":"%"}}''',
      rec.email, rec.email, rec.password, rec.full_name;
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id IN (
      '25bab248-2845-4c67-8c65-d674120b67c7','6ed29f27-f975-456a-a87a-d4a619fa7493',
      'b05836e8-f1e4-45c5-b59c-4e8f3db3b53c','95ec572b-c804-488e-977d-6f21cd9bf349',
      'a55461da-4780-4624-8854-6ad7eb8fbc3b','85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01',
      'fbbe86ee-0d2b-4de8-ab31-8d1daa807685','85610fb3-06ae-43b7-93c4-1e98bb98dae3',
      '742b15de-6ed8-46e5-86b4-577c91c8136d','774c222a-c67b-494c-8738-a9c5fa17dd1f'
    )
    HAVING count(*) < 10
  ) THEN
    RAISE NOTICE 'All 10 demo auth users confirmed present. Proceeding with seed …';
  END IF;
END;
$$;


-- =================================================================
-- SECTION 2 — PROFILES (UPSERT)
-- Only inserts rows where the auth user already exists.
-- =================================================================
INSERT INTO public.profiles (id, full_name, phone, email, status, department, employee_id, bio, created_at, updated_at)
SELECT
  v.id::uuid, v.full_name, v.phone, v.email,
  'active'::public.user_status,
  v.department, v.employee_id, v.bio,
  now(), now()
FROM (VALUES
  ('25bab248-2845-4c67-8c65-d674120b67c7',
    'Aditya Kumar',       '+91-9000000001', 'owner@adityaconstruction.com',
    'Executive','EMP-001',
    'Founder and owner of Aditya Constructions. 20+ years experience in real estate and construction across Greater Noida and NCR.'),
  ('6ed29f27-f975-456a-a87a-d4a619fa7493',
    'Vikram Nair',        '+91-9000000002', 'operations@adityaconstruction.com',
    'Operations','EMP-002',
    'Operations Manager overseeing all active project sites, vendor coordination, and daily field operations.'),
  ('b05836e8-f1e4-45c5-b59c-4e8f3db3b53c',
    'Rahul Sharma',       '+91-9811001001', 'rahul.sharma@adityaconstruction.com',
    'Human Resources','EMP-003',
    'HR Manager responsible for recruitment, payroll processing, attendance, and employee welfare.'),
  ('95ec572b-c804-488e-977d-6f21cd9bf349',
    'Priya Gupta',        '+91-9811001002', 'priya.gupta@adityaconstruction.com',
    'Projects','EMP-004',
    'Senior Project Manager with expertise in residential and commercial construction projects in Greater Noida.'),
  ('a55461da-4780-4624-8854-6ad7eb8fbc3b',
    'Amit Singh',         '+91-9811001003', 'amit.singh@adityaconstruction.com',
    'Engineering','EMP-005',
    'Civil Site Engineer specialising in structural work, quality control, and safety compliance on construction sites.'),
  ('85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01',
    'Neha Verma',         '+91-9811001004', 'neha.verma@adityaconstruction.com',
    'Sales','EMP-006',
    'Sales Executive managing client relationships, property inquiries, and lead follow-up for residential projects.'),
  ('fbbe86ee-0d2b-4de8-ab31-8d1daa807685',
    'Deepak Joshi',       '+91-9811001008', 'deepak.joshi@adityaconstruction.com',
    'Sales','EMP-007',
    'Sales Manager driving revenue targets, leading the sales team, and managing key client accounts.'),
  ('85610fb3-06ae-43b7-93c4-1e98bb98dae3',
    'Kavya Nair',         '+91-9811001009', 'kavya.nair@adityaconstruction.com',
    'Customer Support','EMP-008',
    'Customer Support Specialist handling client queries, ticket resolution, and post-sales coordination.'),
  ('742b15de-6ed8-46e5-86b4-577c91c8136d',
    'Arjun Mehta',        '+91-9811001010', 'arjun.mehta@adityaconstruction.com',
    'Finance','EMP-009',
    'Accountant managing project budgets, payroll, vendor payments, and financial reporting.'),
  ('774c222a-c67b-494c-8738-a9c5fa17dd1f',
    'Kiran Reddy',        '+91-9811001015', 'kiran.reddy@adityaconstruction.com',
    'Operations','EMP-010',
    'Field staff member assisting in daily site operations and logistics.')
) AS v(id, full_name, phone, email, department, employee_id, bio)
WHERE EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = v.id::uuid)
ON CONFLICT (id) DO UPDATE SET
  full_name   = EXCLUDED.full_name,
  phone       = EXCLUDED.phone,
  email       = EXCLUDED.email,
  status      = EXCLUDED.status,
  department  = EXCLUDED.department,
  employee_id = EXCLUDED.employee_id,
  bio         = EXCLUDED.bio,
  updated_at  = now();


-- =================================================================
-- SECTION 3 — USER ROLES (UPSERT)
-- =================================================================
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT v.user_id::uuid, v.role::public.app_role, now()
FROM (VALUES
  ('25bab248-2845-4c67-8c65-d674120b67c7', 'owner'),
  ('6ed29f27-f975-456a-a87a-d4a619fa7493', 'operations_manager'),
  ('b05836e8-f1e4-45c5-b59c-4e8f3db3b53c', 'hr_manager'),
  ('95ec572b-c804-488e-977d-6f21cd9bf349', 'project_manager'),
  ('a55461da-4780-4624-8854-6ad7eb8fbc3b', 'site_engineer'),
  ('85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01', 'sales_executive'),
  ('fbbe86ee-0d2b-4de8-ab31-8d1daa807685', 'sales_manager'),
  ('85610fb3-06ae-43b7-93c4-1e98bb98dae3', 'customer_support'),
  ('742b15de-6ed8-46e5-86b4-577c91c8136d', 'accountant'),
  ('774c222a-c67b-494c-8738-a9c5fa17dd1f', 'staff')
) AS v(user_id, role)
WHERE EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = v.user_id::uuid)
ON CONFLICT (user_id, role) DO NOTHING;


-- =================================================================
-- SECTION 4 — ROLE PERMISSIONS (full matrix, idempotent)
-- =================================================================
INSERT INTO public.role_permissions (role, module, allowed) VALUES
  -- Owner: every module
  ('owner','dashboard',true),('owner','leads',true),('owner','quotes',true),
  ('owner','projects',true),('owner','tickets',true),('owner','hr',true),
  ('owner','blog',true),('owner','team',true),('owner','testimonials',true),
  ('owner','messages',true),('owner','users',true),('owner','audit',true),
  ('owner','permissions',true),('owner','tasks',true),('owner','leaves',true),
  ('owner','reports',true),('owner','finance',true),
  -- Admin (backward-compat alias)
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


-- =================================================================
-- SECTION 5 — PROJECTS
-- 5 realistic projects for a Greater Noida construction company.
-- customer_id → owner (as client account)
-- project_manager_id → project_manager user
-- =================================================================
INSERT INTO public.projects
  (id, customer_id, project_manager_id, title, description, service_type, status,
   progress, budget, spent, start_date, end_date, location, created_at, updated_at)
VALUES
  -- Project 1: Large residential complex (in progress)
  ('c1000001-0000-4000-8000-000000000001',
   '25bab248-2845-4c67-8c65-d674120b67c7',
   '95ec572b-c804-488e-977d-6f21cd9bf349',
   'Mahagun Mywoods Phase 3 — Residential Complex',
   'Construction of 240-unit G+12 residential apartment complex with two basements, clubhouse, and landscaped podium. RERA approved. Targeting completion Q4 2026.',
   'construction','in_progress',
   62, 18500000.00, 11470000.00,
   '2025-03-01', '2026-12-31',
   'Sector Omega-1, Greater Noida, Uttar Pradesh',
   now() - interval '16 months', now()),

  -- Project 2: Commercial office tower (planning)
  ('c1000002-0000-4000-8000-000000000002',
   '25bab248-2845-4c67-8c65-d674120b67c7',
   '95ec572b-c804-488e-977d-6f21cd9bf349',
   'ACE City Commercial Tower — IT Hub',
   'Design and construction of a 9-floor commercial IT park with flexible co-working zones, dedicated server rooms, and EV-ready parking for 350 vehicles.',
   'construction','planning',
   8, 32000000.00, 2560000.00,
   '2026-08-01', '2028-03-31',
   'Sector 150, Noida Expressway, Uttar Pradesh',
   now() - interval '2 months', now()),

  -- Project 3: Interior design (in progress)
  ('c1000003-0000-4000-8000-000000000003',
   '6ed29f27-f975-456a-a87a-d4a619fa7493',
   '95ec572b-c804-488e-977d-6f21cd9bf349',
   'Green Valley Villas — Luxury Interior Fit-Out',
   'Full interior design and execution for 12 luxury villa units: Italian marble flooring, modular kitchens, premium bathroom fittings, and smart home automation.',
   'interiors','in_progress',
   45, 7200000.00, 3240000.00,
   '2026-01-15', '2026-09-30',
   'Sector 22D, Yamuna Expressway, Greater Noida',
   now() - interval '6 months', now()),

  -- Project 4: Solar installation (completed)
  ('c1000004-0000-4000-8000-000000000004',
   '25bab248-2845-4c67-8c65-d674120b67c7',
   '95ec572b-c804-488e-977d-6f21cd9bf349',
   'Pari Chowk Plaza — Rooftop Solar Grid',
   '400 kWp rooftop solar installation across three commercial buildings. Includes net-metering connection, battery backup (200 kWh), and remote monitoring dashboard.',
   'solar','completed',
   100, 4800000.00, 4650000.00,
   '2025-10-01', '2026-04-30',
   'Pari Chowk, Greater Noida, Uttar Pradesh',
   now() - interval '9 months', now()),

  -- Project 5: HVAC (in progress)
  ('c1000005-0000-4000-8000-000000000005',
   '6ed29f27-f975-456a-a87a-d4a619fa7493',
   '95ec572b-c804-488e-977d-6f21cd9bf349',
   'Sports City Convention Centre — Central HVAC',
   'Design and installation of a 2,400-TR central HVAC plant for the 180,000 sq ft convention centre. Includes chiller plant, AHU banks, BMS integration, and commissioning.',
   'hvac','in_progress',
   35, 9600000.00, 3360000.00,
   '2026-03-01', '2026-11-30',
   'Greater Noida Sports City, Sector XI, Greater Noida',
   now() - interval '4 months', now())
ON CONFLICT (id) DO UPDATE SET
  title        = EXCLUDED.title,
  description  = EXCLUDED.description,
  status       = EXCLUDED.status,
  progress     = EXCLUDED.progress,
  budget       = EXCLUDED.budget,
  spent        = EXCLUDED.spent,
  updated_at   = now();


-- =================================================================
-- SECTION 6 — PROJECT MILESTONES
-- =================================================================
INSERT INTO public.project_milestones
  (id, project_id, title, description, due_date, completed_at, status, order_index, created_at)
VALUES
  -- Project 1 milestones
  ('d1000001-0000-4000-8000-000000000001','c1000001-0000-4000-8000-000000000001',
   'Foundation & Basement Slab','Pile foundation, retaining walls, and both basement floor slabs',
   '2025-07-31','2025-08-05 00:00:00+05:30','completed',1, now()-interval '15 months'),
  ('d1000002-0000-4000-8000-000000000002','c1000001-0000-4000-8000-000000000001',
   'Structural Frame (Floors 1-6)','RCC frame up to 6th floor including columns, beams, slabs',
   '2025-12-31','2026-01-10 00:00:00+05:30','completed',2, now()-interval '14 months'),
  ('d1000003-0000-4000-8000-000000000003','c1000001-0000-4000-8000-000000000001',
   'Structural Frame (Floors 7-12)','RCC frame completion, water tank, and terrace slab',
   '2026-05-31',NULL,'in_progress',3, now()-interval '10 months'),
  ('d1000004-0000-4000-8000-000000000004','c1000001-0000-4000-8000-000000000001',
   'MEP Rough-in & Plastering','Electrical conduits, plumbing, HVAC ducting, and internal plastering',
   '2026-09-30',NULL,'pending',4, now()-interval '10 months'),
  ('d1000005-0000-4000-8000-000000000005','c1000001-0000-4000-8000-000000000001',
   'Finishing, Handover & OC','Final tiles, paint, fixtures, lifts, landscaping, and occupancy certificate',
   '2026-12-31',NULL,'pending',5, now()-interval '10 months'),

  -- Project 2 milestones
  ('d1000006-0000-4000-8000-000000000006','c1000002-0000-4000-8000-000000000002',
   'Design & Approvals','Architectural design, structural drawings, GNIDA approval',
   '2026-10-31',NULL,'in_progress',1, now()-interval '2 months'),
  ('d1000007-0000-4000-8000-000000000007','c1000002-0000-4000-8000-000000000002',
   'Piling & Foundation','Pile boring, pile caps, and grade beam construction',
   '2027-03-31',NULL,'pending',2, now()-interval '2 months'),

  -- Project 3 milestones
  ('d1000008-0000-4000-8000-000000000008','c1000003-0000-4000-8000-000000000003',
   'Civil Preparation & Surface Treatment','Wall treatment, waterproofing, and false ceiling grid',
   '2026-03-31','2026-04-02 00:00:00+05:30','completed',1, now()-interval '6 months'),
  ('d1000009-0000-4000-8000-000000000009','c1000003-0000-4000-8000-000000000003',
   'Flooring & Woodwork','Italian marble installation and all custom woodwork',
   '2026-06-30',NULL,'in_progress',2, now()-interval '5 months'),
  ('d1000010-0000-4000-8000-000000000010','c1000003-0000-4000-8000-000000000003',
   'Kitchen, Bath & Smart Home','Modular kitchens, bathroom fittings, and home automation commissioning',
   '2026-09-30',NULL,'pending',3, now()-interval '5 months'),

  -- Project 4 milestones (all completed)
  ('d1000011-0000-4000-8000-000000000011','c1000004-0000-4000-8000-000000000004',
   'Structural Assessment & Mounting','Rooftop load analysis and module mounting structure',
   '2025-12-15','2025-12-12 00:00:00+05:30','completed',1, now()-interval '9 months'),
  ('d1000012-0000-4000-8000-000000000012','c1000004-0000-4000-8000-000000000004',
   'Panel Installation & Wiring','400 kWp panel installation, DC wiring, and inverters',
   '2026-02-28','2026-02-25 00:00:00+05:30','completed',2, now()-interval '9 months'),
  ('d1000013-0000-4000-8000-000000000013','c1000004-0000-4000-8000-000000000004',
   'Grid Connection & Commissioning','DISCOM net-metering approval, battery integration, monitoring go-live',
   '2026-04-30','2026-04-28 00:00:00+05:30','completed',3, now()-interval '9 months'),

  -- Project 5 milestones
  ('d1000014-0000-4000-8000-000000000014','c1000005-0000-4000-8000-000000000005',
   'Chiller Plant & Cooling Tower','2,400-TR centrifugal chillers, cooling towers, and primary pumping',
   '2026-06-30',NULL,'in_progress',1, now()-interval '4 months'),
  ('d1000015-0000-4000-8000-000000000015','c1000005-0000-4000-8000-000000000005',
   'AHU, Ducting & VAV Boxes','Air handling units, distribution ductwork, and VAV controls',
   '2026-09-30',NULL,'pending',2, now()-interval '4 months'),
  ('d1000016-0000-4000-8000-000000000016','c1000005-0000-4000-8000-000000000005',
   'BMS Integration & Commissioning','Building management system integration, balancing, and handover',
   '2026-11-30',NULL,'pending',3, now()-interval '4 months')
ON CONFLICT (id) DO UPDATE SET
  title        = EXCLUDED.title,
  status       = EXCLUDED.status,
  completed_at = EXCLUDED.completed_at;


-- =================================================================
-- SECTION 7 — PROJECT UPDATES
-- =================================================================
INSERT INTO public.project_updates
  (id, project_id, author_id, title, content, photo_urls, created_at)
VALUES
  ('e1000001-0000-4000-8000-000000000001','c1000001-0000-4000-8000-000000000001',
   '95ec572b-c804-488e-977d-6f21cd9bf349',
   'Q2 2026 Progress Report',
   'Structural frame for floors 7–10 is 80% complete. Concrete pour for floor 11 slab scheduled for 15 July. Plastering work has commenced on floors 1–4. Progress is on track for December handover.',
   ARRAY[]::TEXT[], now()-interval '10 days'),

  ('e1000002-0000-4000-8000-000000000002','c1000001-0000-4000-8000-000000000001',
   'a55461da-4780-4624-8854-6ad7eb8fbc3b',
   'Floors 7-9 Frame Inspection Passed',
   'Third-party structural inspection by M/s Tata Consulting Engineers passed without major observations. All RCC columns and beams meet the M40 grade requirement. Report filed with GNIDA.',
   ARRAY[]::TEXT[], now()-interval '3 weeks'),

  ('e1000003-0000-4000-8000-000000000003','c1000003-0000-4000-8000-000000000003',
   '95ec572b-c804-488e-977d-6f21cd9bf349',
   'Villa A & B Flooring Started',
   'Italian marble (Statuario Venato) installation has commenced in Villas A and B. Rectified large-format tile laying is complete in all bathrooms of Villa C. Woodwork cabinetry for Villa A kitchen delivered and installation begins Monday.',
   ARRAY[]::TEXT[], now()-interval '5 days'),

  ('e1000004-0000-4000-8000-000000000004','c1000004-0000-4000-8000-000000000004',
   '95ec572b-c804-488e-977d-6f21cd9bf349',
   'Solar Project — Final Commissioning Complete',
   'All 1,600 panels are live. Net-metering approved by PVVNL. First generation reading: 6,240 kWh in the first 7 days. Battery backup successfully tested during a grid outage simulation. Full handover documents submitted to client.',
   ARRAY[]::TEXT[], now()-interval '2 months'),

  ('e1000005-0000-4000-8000-000000000005','c1000005-0000-4000-8000-000000000005',
   '6ed29f27-f975-456a-a87a-d4a619fa7493',
   'Chiller Plant Equipment Delivered',
   'Two 1,200-TR Carrier centrifugal chillers delivered to site and placed in chiller room using 200-ton crane. Cooling tower structural work 70% complete on terrace. Primary pump connections to begin next week.',
   ARRAY[]::TEXT[], now()-interval '2 weeks')
ON CONFLICT (id) DO NOTHING;


-- =================================================================
-- SECTION 8 — LEADS
-- 8 realistic sales leads with varied statuses.
-- assigned_to → sales_executive or sales_manager
-- =================================================================
INSERT INTO public.leads
  (id, name, email, phone, service, message, source, status, assigned_to, notes, created_at, updated_at)
VALUES
  ('f1000001-0000-4000-8000-000000000001',
   'Sundar Rajan','sundar.rajan@gmail.com','+91-9810234567',
   'construction',
   'Looking to build a 3,500 sq ft duplex bungalow on my 200 sq yd plot in Sector 10, Greater Noida. Budget around 1.2 Cr. Need to start by October 2026.',
   'website','qualified',
   '85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01',
   'Site visit done on 2 July. Client has clear NOC from GNIDA. Very serious buyer. Follow up on quote.',
   now()-interval '25 days', now()-interval '7 days'),

  ('f1000002-0000-4000-8000-000000000002',
   'Meenakshi Iyer','m.iyer@techcorp.in','+91-9820345678',
   'interiors',
   'Interior design and fit-out for a 3 BHK flat (1,850 sq ft) in Mahagun Moderne, Sector 78. Modern minimalist style. Budget ₹35-45 lakhs.',
   'referral','contacted',
   '85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01',
   'Called on 5 July, shared portfolio link. Awaiting callback to schedule in-person meeting.',
   now()-interval '18 days', now()-interval '4 days'),

  ('f1000003-0000-4000-8000-000000000003',
   'Harish Enterprises Pvt Ltd','info@harishenterprises.co.in','+91-9870456789',
   'real_estate',
   'Interested in commercial space 5,000-8,000 sq ft on Noida Expressway for manufacturing unit registration office. Lease or purchase both acceptable.',
   'google_ads','new',
   'fbbe86ee-0d2b-4de8-ab31-8d1daa807685',
   NULL,
   now()-interval '3 days', now()-interval '3 days'),

  ('f1000004-0000-4000-8000-000000000004',
   'Dr. Kavitha Pillai','kavitha.pillai@apollohosp.com','+91-9880567890',
   'construction',
   'Planning a 60-bed speciality clinic building on a 1,000 sq mt plot in Knowledge Park III. Need hospital-grade design and construction.',
   'website','converted',
   '85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01',
   'Converted to Project — see Green Valley Villas quote. Signed MoU on 20 June.',
   now()-interval '45 days', now()-interval '15 days'),

  ('f1000005-0000-4000-8000-000000000005',
   'Raj Singhania','raj.singhania@outlook.com','+91-9990678901',
   'solar',
   'Want 10 kWp rooftop solar for my residence in Sector 36, Greater Noida. Looking for the best price with 25-year warranty panels.',
   'justdial','new',
   NULL,
   NULL,
   now()-interval '1 day', now()-interval '1 day'),

  ('f1000006-0000-4000-8000-000000000006',
   'Lotus Green Developers','bd@lotusgreen.in','+91-9000123456',
   'construction',
   'Tender inquiry for civil contractor for 500-unit affordable housing project. EWS/LIG category. Turnkey execution preferred.',
   'reference','lost',
   'fbbe86ee-0d2b-4de8-ab31-8d1daa807685',
   'Lost to L&T Construction — pricing too high for affordable segment. Keep for future high-value tenders.',
   now()-interval '60 days', now()-interval '30 days'),

  ('f1000007-0000-4000-8000-000000000007',
   'Pradeep Malhotra','pmalhotra@yahoo.com','+91-9898789012',
   'hvac',
   'HVAC requirement for a 12,000 sq ft warehouse in Ecotech-II, Greater Noida. Needs to maintain 18-22°C year round.',
   'website','qualified',
   '85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01',
   'Technical survey completed 4 July. Recommended 3×5-TR precision ACs + evaporative cooling. Quote due 12 July.',
   now()-interval '12 days', now()-interval '5 days'),

  ('f1000008-0000-4000-8000-000000000008',
   'Seema Agarwal','seema.agarwal@gmail.com','+91-9811890123',
   'interiors',
   'Full home interior for newly purchased 4 BHK penthouse in Supertech Capetown, Sector 74. 3,200 sq ft. Classic contemporary theme. Budget flexible up to ₹80 lakhs.',
   'instagram','contacted',
   'fbbe86ee-0d2b-4de8-ab31-8d1daa807685',
   'Met at property expo 1 July. Very interested. Site visit scheduled 10 July.',
   now()-interval '8 days', now()-interval '2 days')
ON CONFLICT (id) DO UPDATE SET
  status     = EXCLUDED.status,
  notes      = EXCLUDED.notes,
  assigned_to = EXCLUDED.assigned_to,
  updated_at = now();


-- =================================================================
-- SECTION 9 — QUOTE REQUESTS
-- 5 realistic quote requests with varied statuses.
-- =================================================================
INSERT INTO public.quote_requests
  (id, user_id, name, email, phone, service_type, project_type,
   budget_range, timeline, location, area_sqft, requirements,
   ai_estimate, ai_breakdown, status, quoted_amount, created_at, updated_at)
VALUES
  ('g1000001-0000-4000-8000-000000000001',
   '25bab248-2845-4c67-8c65-d674120b67c7',
   'Aditya Kumar','owner@adityaconstruction.com','+91-9000000001',
   'construction','Residential Bungalow',
   '₹80L – ₹1.2 Cr','12 months','Sector 10, Greater Noida',3500,
   'G+1 bungalow with 4 bedrooms, home theatre, modular kitchen, 2-car basement parking, and solar-ready rooftop. Premium finishes.',
   'Estimated cost: ₹95 – ₹1.1 Cr based on ₹2,800–₹3,150/sqft for semi-luxury construction in Greater Noida including civil, MEP, and finishing.',
   '{"civil":{"percentage":55,"amount":5500000},"mep":{"percentage":20,"amount":2000000},"finishing":{"percentage":25,"amount":2500000}}'::jsonb,
   'quoted', 9800000.00,
   now()-interval '30 days', now()-interval '20 days'),

  ('g1000002-0000-4000-8000-000000000002',
   NULL,
   'Meenakshi Iyer','m.iyer@techcorp.in','+91-9820345678',
   'interiors','3 BHK Flat Interior',
   '₹35L – ₹45L','4 months','Sector 78, Noida',1850,
   'Full interior fit-out: false ceilings, premium flooring, modular kitchen, wardrobes, custom furniture, lighting, and smart home basics.',
   'Estimated: ₹38 – ₹44 lakhs at ₹2,050–₹2,380/sqft for a premium 3 BHK interior in Noida.',
   '{"furniture":{"percentage":35,"amount":1540000},"civil":{"percentage":30,"amount":1320000},"electrical_lighting":{"percentage":20,"amount":880000},"hvac_misc":{"percentage":15,"amount":660000}}'::jsonb,
   'reviewing', NULL,
   now()-interval '15 days', now()-interval '10 days'),

  ('g1000003-0000-4000-8000-000000000003',
   NULL,
   'Raj Singhania','raj.singhania@outlook.com','+91-9990678901',
   'solar','Residential Rooftop Solar',
   '₹5L – ₹7L','2 months','Sector 36, Greater Noida',NULL,
   '10 kWp grid-tied solar system. Prefer Tier-1 panels (Waaree / Adani). Include 10-year AMC quote separately.',
   'Estimated: ₹5.5 – ₹6.5 lakhs for a 10 kWp system with Tier-1 panels, inverter, BOS, and installation (₹55,000–₹65,000 per kWp).',
   '{"panels":{"percentage":50,"amount":302500},"inverter":{"percentage":20,"amount":121000},"mounting_wiring":{"percentage":20,"amount":121000},"commissioning":{"percentage":10,"amount":60500}}'::jsonb,
   'pending', NULL,
   now()-interval '1 day', now()-interval '1 day'),

  ('g1000004-0000-4000-8000-000000000004',
   NULL,
   'Pradeep Malhotra','pmalhotra@yahoo.com','+91-9898789012',
   'hvac','Warehouse HVAC System',
   '₹25L – ₹40L','3 months','Ecotech-II, Greater Noida',12000,
   'Precision temperature control for pharmaceutical storage warehouse. Target 18–22°C, 40–60% RH. Need 24×7 reliable operation with BMS.',
   'Estimated: ₹28 – ₹36 lakhs for precision HVAC with BMS for a 12,000 sqft pharma warehouse in Greater Noida.',
   '{"equipment":{"percentage":60,"amount":1920000},"installation":{"percentage":25,"amount":800000},"bms_controls":{"percentage":15,"amount":480000}}'::jsonb,
   'quoted', 3200000.00,
   now()-interval '10 days', now()-interval '5 days'),

  ('g1000005-0000-4000-8000-000000000005',
   '6ed29f27-f975-456a-a87a-d4a619fa7493',
   'Vikram Nair','operations@adityaconstruction.com','+91-9000000002',
   'real_estate','Commercial Office Space',
   '₹2 Cr – ₹3.5 Cr','Immediate','Noida Expressway, Sector 132',6000,
   'Turnkey office space for a 60-person tech team. Need server room, boardroom (20-seat), open work area, cafeteria, and 20 parking slots.',
   'Estimated: ₹2.4 – ₹3.2 Cr for a Grade-A 6,000 sqft office fit-out on Noida Expressway (₹4,000–₹5,300/sqft).',
   '{"civil_fit_out":{"percentage":40,"amount":1120000},"mep":{"percentage":25,"amount":700000},"furniture":{"percentage":20,"amount":560000},"it_infra":{"percentage":15,"amount":420000}}'::jsonb,
   'accepted', 28000000.00,
   now()-interval '20 days', now()-interval '8 days')
ON CONFLICT (id) DO UPDATE SET
  status        = EXCLUDED.status,
  quoted_amount = EXCLUDED.quoted_amount,
  updated_at    = now();


-- =================================================================
-- SECTION 10 — SUPPORT TICKETS + MESSAGES
-- Tickets need a customer_id (NOT NULL → auth.users).
-- Using staff users as the "customers" raising issues.
-- assigned_to → customer_support user.
-- =================================================================
INSERT INTO public.tickets
  (id, customer_id, project_id, assigned_to, subject, message, status, priority, created_at, updated_at)
VALUES
  ('h1000001-0000-4000-8000-000000000001',
   '25bab248-2845-4c67-8c65-d674120b67c7',
   'c1000001-0000-4000-8000-000000000001',
   '85610fb3-06ae-43b7-93c4-1e98bb98dae3',
   'Delay in Floor 9 Concrete Pour — Need Timeline Update',
   'The concrete pour for Floor 9 slab was originally scheduled for 28 June but has not happened yet. The delay is impacting our monsoon-proofing schedule. Please provide a revised timeline and reason for the delay.',
   'in_progress','high',
   now()-interval '11 days', now()-interval '2 days'),

  ('h1000002-0000-4000-8000-000000000002',
   '6ed29f27-f975-456a-a87a-d4a619fa7493',
   'c1000003-0000-4000-8000-000000000003',
   '85610fb3-06ae-43b7-93c4-1e98bb98dae3',
   'Italian Marble Shade Variation in Villa B',
   'The Statuario Venato marble installed in Villa B living room has a noticeable shade variation compared to the sample approved during the design phase. Two slabs appear distinctly grey, unlike the white-dominant batch. Requesting inspection and replacement of the mismatched slabs.',
   'open','urgent',
   now()-interval '5 days', now()-interval '5 days'),

  ('h1000003-0000-4000-8000-000000000003',
   '95ec572b-c804-488e-977d-6f21cd9bf349',
   'c1000005-0000-4000-8000-000000000005',
   '85610fb3-06ae-43b7-93c4-1e98bb98dae3',
   'Chiller Make Change Request — Approval Needed',
   'The Carrier 30XW-V centrifugal chiller (1,200 TR) specified in the BOQ is currently out of stock with 5-month delivery. Vendor is proposing Trane CenTraVac as an equivalent at 2% higher cost. Requesting client approval to proceed.',
   'in_progress','medium',
   now()-interval '8 days', now()-interval '3 days'),

  ('h1000004-0000-4000-8000-000000000004',
   'a55461da-4780-4624-8854-6ad7eb8fbc3b',
   NULL,
   '85610fb3-06ae-43b7-93c4-1e98bb98dae3',
   'Safety Helmet Stock Running Low on Site',
   'We have 12 helmets remaining for 45 workers on the Mahagun site. Monsoon season brings additional hazard. Requesting immediate procurement of 60 ISI-marked helmets and 30 safety harnesses.',
   'resolved','low',
   now()-interval '20 days', now()-interval '14 days'),

  ('h1000005-0000-4000-8000-000000000005',
   '85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01',
   NULL,
   '85610fb3-06ae-43b7-93c4-1e98bb98dae3',
   'CRM Access Issue — Cannot View Lead History',
   'Since the portal update on 30 June I am unable to view the full history of leads assigned to me. The page loads but shows no entries before 1 July. This is affecting follow-up with 4 clients who were in the qualified stage.',
   'resolved','medium',
   now()-interval '9 days', now()-interval '6 days'),

  ('h1000006-0000-4000-8000-000000000006',
   'fbbe86ee-0d2b-4de8-ab31-8d1daa807685',
   'c1000002-0000-4000-8000-000000000002',
   '85610fb3-06ae-43b7-93c4-1e98bb98dae3',
   'ACE City Project — GNIDA Drawing Approval Status',
   'The building plan for ACE City Commercial Tower was submitted to GNIDA on 15 June. The 30-day statutory deadline has passed. Please confirm current status and whether any objections have been raised so we can update the client.',
   'open','high',
   now()-interval '6 days', now()-interval '6 days')
ON CONFLICT (id) DO UPDATE SET
  status     = EXCLUDED.status,
  priority   = EXCLUDED.priority,
  updated_at = now();

-- Ticket messages
INSERT INTO public.ticket_messages
  (id, ticket_id, author_id, message, created_at)
VALUES
  ('i1000001-0000-4000-8000-000000000001','h1000001-0000-4000-8000-000000000001',
   '85610fb3-06ae-43b7-93c4-1e98bb98dae3',
   'Thank you for raising this. I have escalated to the site team and project manager. The delay is due to monsoon rain halting RMC plant operations on 27 June. Concrete pour has been rescheduled to 14 July. I will update the master schedule and share it by tomorrow.',
   now()-interval '10 days'),

  ('i1000002-0000-4000-8000-000000000002','h1000001-0000-4000-8000-000000000001',
   '95ec572b-c804-488e-977d-6f21cd9bf349',
   'Updated project schedule shared via email. RMC plant resumed on 10 July. Pour on 14 July is confirmed. The 5-day delay has been absorbed within the float — overall handover date of 31 December 2026 remains unchanged.',
   now()-interval '2 days'),

  ('i1000003-0000-4000-8000-000000000003','h1000002-0000-4000-8000-000000000002',
   '85610fb3-06ae-43b7-93c4-1e98bb98dae3',
   'Registered your complaint. Our interior quality team has been informed and a site inspection is scheduled for 11 July. Marble supplier (M/s Rajputana Stones) has been notified to keep replacement stock ready. We apologise for the inconvenience.',
   now()-interval '4 days'),

  ('i1000004-0000-4000-8000-000000000004','h1000003-0000-4000-8000-000000000003',
   '85610fb3-06ae-43b7-93c4-1e98bb98dae3',
   'Noted. Forwarded the Trane CenTraVac technical datasheet and comparative pricing to the client for review. Awaiting approval. Estimated response time: 3 business days.',
   now()-interval '7 days'),

  ('i1000005-0000-4000-8000-000000000005','h1000004-0000-4000-8000-000000000004',
   '6ed29f27-f975-456a-a87a-d4a619fa7493',
   'Purchase order raised for 60 helmets and 30 harnesses from M/s Safety First India. Delivery expected by 25 June. Closing ticket as resolved.',
   now()-interval '14 days'),

  ('i1000006-0000-4000-8000-000000000006','h1000005-0000-4000-8000-000000000005',
   '85610fb3-06ae-43b7-93c4-1e98bb98dae3',
   'This was a pagination bug in the lead history API introduced on 30 June. The engineering team has deployed a hotfix (v1.4.2) and all lead records are now visible. Please confirm on your end and we will close this ticket.',
   now()-interval '7 days')
ON CONFLICT (id) DO NOTHING;


-- =================================================================
-- SECTION 11 — TESTIMONIALS
-- 6 realistic client testimonials for a Greater Noida firm.
-- =================================================================
INSERT INTO public.testimonials
  (id, client_name, client_role, content, rating, project_type, featured, published, created_at)
VALUES
  ('j1000001-0000-4000-8000-000000000001',
   'Sanjeev Kapoor',
   'CEO, Kapoor Agro Industries, Greater Noida',
   'Aditya Constructions delivered our 40,000 sqft warehouse in Ecotech-II exactly on schedule and within the approved budget. Their site management is excellent — zero safety incidents across 14 months. We have already engaged them for a second facility.',
   5,'construction',true,true,
   now()-interval '3 months'),

  ('j1000002-0000-4000-8000-000000000002',
   'Dr. Ananya Krishnan',
   'Director, AK Diagnostics, Noida',
   'The interior team transformed our 2,200 sqft clinic into a world-class patient environment. Every detail — from ergonomic workstations to calming colour palettes — was executed perfectly. Patients frequently compliment the space.',
   5,'interiors',true,true,
   now()-interval '2 months'),

  ('j1000003-0000-4000-8000-000000000003',
   'Ramesh Gupta',
   'Managing Director, Gupta Realtors, Greater Noida',
   'We have worked with many contractors in NCR but Aditya Constructions stands apart for transparency. Their online portal gave us real-time visibility into progress, costs, and milestones. Highly recommended for large-scale residential projects.',
   5,'construction',true,true,
   now()-interval '4 months'),

  ('j1000004-0000-4000-8000-000000000004',
   'Preeti Sharma',
   'Homeowner, Sector 36, Greater Noida',
   'Got a 10 kWp solar system installed by Aditya Constructions. From survey to commissioning in just 6 weeks. My electricity bill has dropped by ₹8,500/month. The after-sales team is very responsive — two minor issues resolved within 24 hours.',
   4,'solar',false,true,
   now()-interval '5 weeks'),

  ('j1000005-0000-4000-8000-000000000005',
   'Vikrant Arora',
   'VP Engineering, Nexus Logistics, Noida',
   'The HVAC team delivered a technically sound design for our 80,000 sqft cold-chain facility. Energy consumption is 18% below our design target. The BMS integration is seamless and monitoring works perfectly on our SCADA.',
   5,'hvac',false,true,
   now()-interval '6 weeks'),

  ('j1000006-0000-4000-8000-000000000006',
   'Lakshmi Venkatesh',
   'Interior Designer, LV Design Studio, Delhi',
   'Collaborated with Aditya Constructions on a premium residential project. Their civil team''s precision — particularly the GRC false ceiling and stone cladding — made our design vision achievable. A reliable execution partner.',
   4,'interiors',false,true,
   now()-interval '7 weeks')
ON CONFLICT (id) DO UPDATE SET
  featured  = EXCLUDED.featured,
  published = EXCLUDED.published;


-- =================================================================
-- SECTION 12 — BLOG POSTS
-- 4 published articles relevant to a Greater Noida construction firm.
-- author_id → owner
-- =================================================================
INSERT INTO public.blog_posts
  (id, slug, title, excerpt, content, cover_image, author_id, category, published, published_at, created_at, updated_at)
VALUES
  ('k1000001-0000-4000-8000-000000000001',
   'green-building-norms-gnida-2026',
   'Green Building Norms Under GNIDA's 2026 Master Plan: What Every Developer Must Know',
   'GNIDA has mandated green building certification for all projects above 20,000 sqm. Here is what developers, contractors, and buyers need to know before the July 2026 deadline.',
   E'## Introduction\n\nThe Greater Noida Industrial Development Authority (GNIDA) revised its Master Plan in early 2026 to mandate GRIHA or IGBC certification for all new commercial and residential projects exceeding 20,000 sqm of built-up area. This is a significant step towards a sustainable NCR.\n\n## Key Requirements\n\n**Energy Performance:** Projects must achieve at least 25% energy savings over baseline. This means high-performance glazing, LED lighting with sensors, and HVAC systems with a minimum COP of 5.5 for chillers.\n\n**Water Conservation:** Rainwater harvesting with a minimum storage capacity of 50 litres per sqm of roof area. Dual-flush fixtures and low-flow taps are mandatory in all bathrooms.\n\n**Materials:** A minimum of 20% of construction materials (by cost) must be sourced from within 400 km of the site. Fly-ash bricks are now compulsory for non-load-bearing walls.\n\n**Waste Management:** A site waste management plan must be submitted with the building plan application. Construction waste recycling targets of 75% apply.\n\n## Impact on Timelines and Costs\n\nOur experience suggests that green compliance adds 4-7% to the project cost upfront but delivers 15-20% savings on lifetime operating costs. More importantly, GNIDA is unlikely to grant the Occupancy Certificate without valid certification from an accredited agency.\n\n## What You Should Do Now\n\nIf you have a project above the threshold, engage a GRIHA facilitator immediately. The certification process takes 6-9 months and must begin during the design stage — not after construction.',
   NULL,
   '25bab248-2845-4c67-8c65-d674120b67c7',
   'Regulations',true,
   now()-interval '30 days', now()-interval '35 days', now()-interval '30 days'),

  ('k1000002-0000-4000-8000-000000000002',
   'cost-estimation-construction-noida-2026',
   'Construction Cost Estimation in Noida & Greater Noida: 2026 Benchmarks',
   'Material prices have stabilised after two volatile years. We break down the latest 2026 benchmarks for civil, MEP, and finishing works across residential and commercial segments.',
   E'## Overview\n\nAfter significant volatility in 2024-25 driven by cement and steel price swings, the construction cost landscape in Noida and Greater Noida has stabilised in the first half of 2026. Here are the current benchmarks our estimation team uses.\n\n## Residential Construction (per sqft, finished)\n\n| Category | Civil + Structure | MEP | Finishing | Total |\n|---|---|---|---|---|\n| Budget (B+G+2) | ₹950 | ₹350 | ₹450 | **₹1,750** |\n| Standard (G+4) | ₹1,100 | ₹450 | ₹700 | **₹2,250** |\n| Premium (G+12) | ₹1,400 | ₹650 | ₹1,100 | **₹3,150** |\n| Luxury | ₹1,800+ | ₹900+ | ₹2,000+ | **₹4,700+** |\n\n## Key Material Rates (July 2026)\n\n- **OPC 53 Grade Cement:** ₹385/bag (50 kg)\n- **TMT Steel (Fe-500D):** ₹58,500/MT\n- **AAC Blocks (600×200×150):** ₹4,800/cum\n- **River Sand:** ₹1,650/brass (unavailability still a challenge; M-Sand at ₹1,100/brass)\n- **Ready-Mix Concrete M30:** ₹5,400/cum\n\n## Labour Rates (Skilled, per day)\n\n- Mason: ₹850–950\n- Bar Bender: ₹800–900\n- Carpenter: ₹900–1,050\n- Electrician: ₹950–1,100\n- Plumber: ₹900–1,000\n\n## Our Advice\n\nAlways build a 10-12% contingency into project budgets. Material prices can move 5-8% in a single quarter. Lock rates with cement and steel suppliers for projects exceeding ₹5 Cr.',
   NULL,
   '25bab248-2845-4c67-8c65-d674120b67c7',
   'Industry Insights',true,
   now()-interval '15 days', now()-interval '18 days', now()-interval '15 days'),

  ('k1000003-0000-4000-8000-000000000003',
   'solar-rooftop-residential-guide-2026',
   'Residential Rooftop Solar in Greater Noida: Complete Guide for 2026',
   'With PVVNL now processing net-metering connections in under 30 days and PM Surya Ghar subsidies active, 2026 is the best year to go solar. Here is everything you need to know.',
   E'## Why 2026 Is the Year to Go Solar\n\nThree factors have converged in 2026 to make residential rooftop solar the most financially compelling it has ever been in Greater Noida:\n\n1. **PM Surya Ghar Muft Bijli Yojana subsidy** — ₹30,000 per kWp for systems up to 2 kWp, ₹18,000/kWp for 2–3 kWp, and ₹9,000/kWp for 3–10 kWp (capped).\n2. **PVVNL fast-tracked net metering** — The distribution company now processes applications within 30 days, down from 90+ days in 2023.\n3. **Module prices at historic lows** — Tier-1 monocrystalline panels are now below ₹22/Wp, cutting system costs by 35% since 2022.\n\n## System Sizing Guide\n\n| Monthly Bill | Recommended Size | Approx. System Cost | Payback (net of subsidy) |\n|---|---|---|---|\n| ₹2,000 | 2 kWp | ₹1.1 – 1.3 L | 5–6 years |\n| ₹5,000 | 5 kWp | ₹2.5 – 3 L | 4–5 years |\n| ₹10,000 | 10 kWp | ₹5 – 6 L | 4–4.5 years |\n\n## What We Install\n\nAditya Constructions is an empanelled vendor under PM Surya Ghar in Uttar Pradesh. We install Waaree, Adani, and Vikram Solar panels with SolarEdge and Fronius inverters. All installations come with a 25-year panel performance warranty and a 5-year system warranty.',
   NULL,
   '25bab248-2845-4c67-8c65-d674120b67c7',
   'Solar & Green Energy',true,
   now()-interval '8 days', now()-interval '10 days', now()-interval '8 days'),

  ('k1000004-0000-4000-8000-000000000004',
   'interior-design-trends-ncr-2026',
   'Interior Design Trends Dominating NCR Homes in 2026',
   'From japandi minimalism to biophilic offices, these are the five design directions our clients are requesting most in 2026 — and how to make them work in Greater Noida apartments.',
   E'## What Clients Are Asking For in 2026\n\nAfter years of maximalist and heavy-wood aesthetics, NCR homeowners are embracing cleaner, calmer interiors. Here are the five trends our design team is executing most frequently this year.\n\n## 1. Japandi — The Japanese-Scandinavian Fusion\n\nMuted earth tones, natural materials, clean lines, and deliberate negative space. Japandi interiors feel restful in dense urban environments. Key elements: live-edge oak shelving, wabi-sabi ceramics, off-white plaster walls, and concealed storage.\n\n## 2. Biophilic Workspaces\n\nPost-pandemic, home offices have become a permanent fixture. Clients want living moss walls, abundant natural light, and indoor planting integrated into workspace design — not just a desk in a corner.\n\n## 3. Fluted Panels Everywhere\n\nFluted (ribbed) panels in MDF, veneer, marble, and even metal are being used on TV walls, kitchen islands, bathroom vanities, and entrance lobbies. The texture adds depth without visual clutter.\n\n## 4. Multi-Functional Furniture\n\nRising flat sizes and nuclear family living mean every sq ft must earn its place. Murphy wall beds, extendable dining tables, and modular sectional sofas with hidden storage are in very high demand.\n\n## 5. Warm Earthy Palettes\n\nTaupe, warm beige, terracotta, and deep olive have replaced the cool grey dominance of 2019-2022. Pair with brushed brass hardware and warm-white lighting (2,700K–3,000K) for a timeless look.',
   NULL,
   '25bab248-2845-4c67-8c65-d674120b67c7',
   'Interior Design',true,
   now()-interval '2 days', now()-interval '3 days', now()-interval '2 days')
ON CONFLICT (slug) DO UPDATE SET
  title        = EXCLUDED.title,
  excerpt      = EXCLUDED.excerpt,
  content      = EXCLUDED.content,
  published    = EXCLUDED.published,
  published_at = EXCLUDED.published_at,
  updated_at   = now();


-- =================================================================
-- SECTION 13 — STAFF TASKS
-- 10 tasks spread across team members with FK to projects.
-- assigned_by → owner or operations_manager
-- =================================================================
INSERT INTO public.staff_tasks
  (id, assigned_to, assigned_by, project_id, title, description, due_date, status, priority, created_at, updated_at)
VALUES
  ('l1000001-0000-4000-8000-000000000001',
   'a55461da-4780-4624-8854-6ad7eb8fbc3b',
   '6ed29f27-f975-456a-a87a-d4a619fa7493',
   'c1000001-0000-4000-8000-000000000001',
   'Floor 11 Slab Shuttering Inspection',
   'Inspect shuttering and staging for Floor 11 RCC slab. Verify prop spacing per structural drawing SC-32, check plumb of all columns, and sign off inspection checklist before concrete pour on 14 July.',
   '2026-07-13','todo','high',
   now()-interval '2 days', now()-interval '2 days'),

  ('l1000002-0000-4000-8000-000000000002',
   '95ec572b-c804-488e-977d-6f21cd9bf349',
   '25bab248-2845-4c67-8c65-d674120b67c7',
   'c1000002-0000-4000-8000-000000000002',
   'ACE City — Submit Revised BOQ to Client',
   'Revise the Bill of Quantities for ACE City Commercial Tower incorporating the value engineering changes discussed on 5 July. Reduce provisional sums by 8%. Submit to client by 11 July for approval.',
   '2026-07-11','in_progress','urgent',
   now()-interval '4 days', now()-interval '1 day'),

  ('l1000003-0000-4000-8000-000000000003',
   '85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01',
   'fbbe86ee-0d2b-4de8-ab31-8d1daa807685',
   NULL,
   'Follow Up — Sundar Rajan Duplex Quote',
   'Client Sundar Rajan (Sector 10, Greater Noida) received a quote on 28 June for a ₹98 lakh duplex bungalow. Call him on 10 July to discuss any objections and attempt to close by end of week. Update CRM lead status accordingly.',
   '2026-07-11','todo','high',
   now()-interval '3 days', now()-interval '3 days'),

  ('l1000004-0000-4000-8000-000000000004',
   '742b15de-6ed8-46e5-86b4-577c91c8136d',
   '25bab248-2845-4c67-8c65-d674120b67c7',
   NULL,
   'Prepare Q2 2026 Financial Report',
   'Consolidate all project expenditure, receivables, and payroll data for Q2 2026 (April–June). Prepare P&L statement, cash-flow summary, and project-wise cost variance report. Present to management on 15 July.',
   '2026-07-14','in_progress','high',
   now()-interval '5 days', now()-interval '1 day'),

  ('l1000005-0000-4000-8000-000000000005',
   'b05836e8-f1e4-45c5-b59c-4e8f3db3b53c',
   '25bab248-2845-4c67-8c65-d674120b67c7',
   NULL,
   'Process June 2026 Payroll',
   'Calculate and process June 2026 payroll for all 47 employees. Include overtime (Floors 9-10 crew), deduct advance recoveries, and credit salaries to bank accounts by 10 July. Upload salary slips to the portal.',
   '2026-07-10','done','urgent',
   now()-interval '8 days', now()-interval '1 day'),

  ('l1000006-0000-4000-8000-000000000006',
   '85610fb3-06ae-43b7-93c4-1e98bb98dae3',
   '6ed29f27-f975-456a-a87a-d4a619fa7493',
   NULL,
   'Resolve Marble Shade Complaint — Villa B',
   'Coordinate with M/s Rajputana Stones for replacement of 3 mismatched Statuario Venato slabs in Villa B. Schedule delivery and installation within 7 days. Close Ticket #TKT-002 upon completion.',
   '2026-07-16','todo','urgent',
   now()-interval '1 day', now()-interval '1 day'),

  ('l1000007-0000-4000-8000-000000000007',
   '95ec572b-c804-488e-977d-6f21cd9bf349',
   '25bab248-2845-4c67-8c65-d674120b67c7',
   'c1000005-0000-4000-8000-000000000005',
   'Sports City HVAC — Chiller Room Slab Inspection',
   'Inspect the chiller room floor slab (anti-vibration isolator pockets and anchor bolt positions) per structural drawing HVAC-S-04 before chiller placement. Coordinate with Carrier service engineers.',
   '2026-07-12','in_progress','medium',
   now()-interval '3 days', now()-interval '1 day'),

  ('l1000008-0000-4000-8000-000000000008',
   '774c222a-c67b-494c-8738-a9c5fa17dd1f',
   '6ed29f27-f975-456a-a87a-d4a619fa7493',
   'c1000001-0000-4000-8000-000000000001',
   'Daily Material Inventory Count — Mahagun Site',
   'Conduct daily count of cement bags, steel MT, and aggregate stock at Mahagun Mywoods site. Update the inventory register and alert site manager if any material falls below the 3-day buffer threshold.',
   '2026-07-09','in_progress','low',
   now()-interval '6 days', now()),

  ('l1000009-0000-4000-8000-000000000009',
   'a55461da-4780-4624-8854-6ad7eb8fbc3b',
   '95ec572b-c804-488e-977d-6f21cd9bf349',
   'c1000003-0000-4000-8000-000000000003',
   'Green Valley — Waterproofing Test (Villa C Terrace)',
   'Conduct 24-hour ponding test on Villa C terrace after waterproofing membrane application. Record results in quality log QC-WP-06. If test passes, issue clearance for screeding.',
   '2026-07-10','todo','medium',
   now()-interval '1 day', now()-interval '1 day'),

  ('l1000010-0000-4000-8000-000000000010',
   'fbbe86ee-0d2b-4de8-ab31-8d1daa807685',
   '25bab248-2845-4c67-8c65-d674120b67c7',
   NULL,
   'Seema Agarwal Site Visit — Penthouse',
   'Accompany Seema Agarwal (Supertech Capetown penthouse, Sector 74) on site visit on 10 July. Bring interior portfolio lookbook and Japandi style boards. Objective: sign interior design agreement on the same day.',
   '2026-07-10','todo','high',
   now()-interval '2 days', now()-interval '2 days')
ON CONFLICT (id) DO UPDATE SET
  status     = EXCLUDED.status,
  priority   = EXCLUDED.priority,
  updated_at = now();


-- =================================================================
-- SECTION 14 — ATTENDANCE (last 5 working days for all 10 staff)
-- Working days: Mon 7 Jul, Tue 8 Jul, Wed 9 Jul, Thu 3 Jul, Fri 4 Jul
-- UNIQUE (user_id, date) — safe ON CONFLICT clause.
-- =================================================================
INSERT INTO public.attendance (id, user_id, date, check_in, check_out, notes)
VALUES
-- === 9 July 2026 (Wednesday — today) ===
  ('m100001-0000-4000-8000-000000000001','25bab248-2845-4c67-8c65-d674120b67c7','2026-07-09','2026-07-09 09:02:00+05:30','2026-07-09 19:15:00+05:30',NULL),
  ('m100002-0000-4000-8000-000000000002','6ed29f27-f975-456a-a87a-d4a619fa7493','2026-07-09','2026-07-09 08:45:00+05:30','2026-07-09 18:30:00+05:30',NULL),
  ('m100003-0000-4000-8000-000000000003','b05836e8-f1e4-45c5-b59c-4e8f3db3b53c','2026-07-09','2026-07-09 09:15:00+05:30','2026-07-09 18:00:00+05:30',NULL),
  ('m100004-0000-4000-8000-000000000004','95ec572b-c804-488e-977d-6f21cd9bf349','2026-07-09','2026-07-09 08:30:00+05:30','2026-07-09 20:00:00+05:30','On site — Mahagun Floor 11 prep'),
  ('m100005-0000-4000-8000-000000000005','a55461da-4780-4624-8854-6ad7eb8fbc3b','2026-07-09','2026-07-09 07:00:00+05:30','2026-07-09 17:00:00+05:30','Site duty'),
  ('m100006-0000-4000-8000-000000000006','85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01','2026-07-09','2026-07-09 09:30:00+05:30','2026-07-09 18:45:00+05:30',NULL),
  ('m100007-0000-4000-8000-000000000007','fbbe86ee-0d2b-4de8-ab31-8d1daa807685','2026-07-09','2026-07-09 09:00:00+05:30','2026-07-09 19:30:00+05:30',NULL),
  ('m100008-0000-4000-8000-000000000008','85610fb3-06ae-43b7-93c4-1e98bb98dae3','2026-07-09','2026-07-09 09:00:00+05:30','2026-07-09 18:00:00+05:30',NULL),
  ('m100009-0000-4000-8000-000000000009','742b15de-6ed8-46e5-86b4-577c91c8136d','2026-07-09','2026-07-09 09:10:00+05:30','2026-07-09 18:30:00+05:30',NULL),
  ('m100010-0000-4000-8000-000000000010','774c222a-c67b-494c-8738-a9c5fa17dd1f','2026-07-09','2026-07-09 07:30:00+05:30','2026-07-09 17:30:00+05:30','Site duty'),
-- === 8 July 2026 (Tuesday) ===
  ('m100011-0000-4000-8000-000000000011','25bab248-2845-4c67-8c65-d674120b67c7','2026-07-08','2026-07-08 09:00:00+05:30','2026-07-08 18:30:00+05:30',NULL),
  ('m100012-0000-4000-8000-000000000012','6ed29f27-f975-456a-a87a-d4a619fa7493','2026-07-08','2026-07-08 08:50:00+05:30','2026-07-08 18:00:00+05:30',NULL),
  ('m100013-0000-4000-8000-000000000013','b05836e8-f1e4-45c5-b59c-4e8f3db3b53c','2026-07-08','2026-07-08 09:20:00+05:30','2026-07-08 18:15:00+05:30',NULL),
  ('m100014-0000-4000-8000-000000000014','95ec572b-c804-488e-977d-6f21cd9bf349','2026-07-08','2026-07-08 08:00:00+05:30','2026-07-08 19:00:00+05:30','Site + office'),
  ('m100015-0000-4000-8000-000000000015','a55461da-4780-4624-8854-6ad7eb8fbc3b','2026-07-08','2026-07-08 07:00:00+05:30','2026-07-08 17:00:00+05:30','Site duty'),
  ('m100016-0000-4000-8000-000000000016','85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01','2026-07-08','2026-07-08 09:30:00+05:30','2026-07-08 18:30:00+05:30',NULL),
  ('m100017-0000-4000-8000-000000000017','fbbe86ee-0d2b-4de8-ab31-8d1daa807685','2026-07-08','2026-07-08 09:00:00+05:30','2026-07-08 19:00:00+05:30',NULL),
  ('m100018-0000-4000-8000-000000000018','85610fb3-06ae-43b7-93c4-1e98bb98dae3','2026-07-08','2026-07-08 09:05:00+05:30','2026-07-08 18:00:00+05:30',NULL),
  ('m100019-0000-4000-8000-000000000019','742b15de-6ed8-46e5-86b4-577c91c8136d','2026-07-08','2026-07-08 09:00:00+05:30','2026-07-08 19:00:00+05:30','Monthly payroll processing'),
  ('m100020-0000-4000-8000-000000000020','774c222a-c67b-494c-8738-a9c5fa17dd1f','2026-07-08','2026-07-08 07:15:00+05:30','2026-07-08 17:15:00+05:30','Site duty'),
-- === 7 July 2026 (Monday) ===
  ('m100021-0000-4000-8000-000000000021','25bab248-2845-4c67-8c65-d674120b67c7','2026-07-07','2026-07-07 09:00:00+05:30','2026-07-07 19:00:00+05:30',NULL),
  ('m100022-0000-4000-8000-000000000022','6ed29f27-f975-456a-a87a-d4a619fa7493','2026-07-07','2026-07-07 08:45:00+05:30','2026-07-07 18:45:00+05:30',NULL),
  ('m100023-0000-4000-8000-000000000023','b05836e8-f1e4-45c5-b59c-4e8f3db3b53c','2026-07-07','2026-07-07 09:15:00+05:30','2026-07-07 18:00:00+05:30',NULL),
  ('m100024-0000-4000-8000-000000000024','95ec572b-c804-488e-977d-6f21cd9bf349','2026-07-07','2026-07-07 08:30:00+05:30','2026-07-07 20:00:00+05:30','Weekly site rounds — all 3 active sites'),
  ('m100025-0000-4000-8000-000000000025','a55461da-4780-4624-8854-6ad7eb8fbc3b','2026-07-07','2026-07-07 07:00:00+05:30','2026-07-07 17:00:00+05:30','Site duty'),
  ('m100026-0000-4000-8000-000000000026','85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01','2026-07-07','2026-07-07 09:30:00+05:30','2026-07-07 18:30:00+05:30',NULL),
  ('m100027-0000-4000-8000-000000000027','fbbe86ee-0d2b-4de8-ab31-8d1daa807685','2026-07-07','2026-07-07 09:00:00+05:30','2026-07-07 19:30:00+05:30','Weekly sales team review'),
  ('m100028-0000-4000-8000-000000000028','85610fb3-06ae-43b7-93c4-1e98bb98dae3','2026-07-07','2026-07-07 09:00:00+05:30','2026-07-07 18:00:00+05:30',NULL),
  ('m100029-0000-4000-8000-000000000029','742b15de-6ed8-46e5-86b4-577c91c8136d','2026-07-07','2026-07-07 09:00:00+05:30','2026-07-07 18:00:00+05:30',NULL),
  ('m100030-0000-4000-8000-000000000030','774c222a-c67b-494c-8738-a9c5fa17dd1f','2026-07-07','2026-07-07 07:30:00+05:30','2026-07-07 17:30:00+05:30','Site duty'),
-- === 4 July 2026 (Friday) ===
  ('m100031-0000-4000-8000-000000000031','25bab248-2845-4c67-8c65-d674120b67c7','2026-07-04','2026-07-04 09:00:00+05:30','2026-07-04 18:00:00+05:30',NULL),
  ('m100032-0000-4000-8000-000000000032','6ed29f27-f975-456a-a87a-d4a619fa7493','2026-07-04','2026-07-04 08:45:00+05:30','2026-07-04 18:00:00+05:30',NULL),
  ('m100033-0000-4000-8000-000000000033','b05836e8-f1e4-45c5-b59c-4e8f3db3b53c','2026-07-04','2026-07-04 09:15:00+05:30','2026-07-04 18:00:00+05:30',NULL),
  ('m100034-0000-4000-8000-000000000034','95ec572b-c804-488e-977d-6f21cd9bf349','2026-07-04','2026-07-04 08:30:00+05:30','2026-07-04 18:30:00+05:30',NULL),
  ('m100035-0000-4000-8000-000000000035','a55461da-4780-4624-8854-6ad7eb8fbc3b','2026-07-04','2026-07-04 07:00:00+05:30','2026-07-04 17:00:00+05:30','Site duty'),
  ('m100036-0000-4000-8000-000000000036','85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01','2026-07-04','2026-07-04 09:30:00+05:30','2026-07-04 17:00:00+05:30',NULL),
  ('m100037-0000-4000-8000-000000000037','fbbe86ee-0d2b-4de8-ab31-8d1daa807685','2026-07-04','2026-07-04 09:00:00+05:30','2026-07-04 17:30:00+05:30',NULL),
  ('m100038-0000-4000-8000-000000000038','85610fb3-06ae-43b7-93c4-1e98bb98dae3','2026-07-04','2026-07-04 09:00:00+05:30','2026-07-04 18:00:00+05:30',NULL),
  ('m100039-0000-4000-8000-000000000039','742b15de-6ed8-46e5-86b4-577c91c8136d','2026-07-04','2026-07-04 09:00:00+05:30','2026-07-04 18:00:00+05:30',NULL),
  ('m100040-0000-4000-8000-000000000040','774c222a-c67b-494c-8738-a9c5fa17dd1f','2026-07-04','2026-07-04 07:00:00+05:30','2026-07-04 17:00:00+05:30','Site duty'),
-- === 3 July 2026 (Thursday) ===
  ('m100041-0000-4000-8000-000000000041','25bab248-2845-4c67-8c65-d674120b67c7','2026-07-03','2026-07-03 09:00:00+05:30','2026-07-03 19:00:00+05:30',NULL),
  ('m100042-0000-4000-8000-000000000042','6ed29f27-f975-456a-a87a-d4a619fa7493','2026-07-03','2026-07-03 08:30:00+05:30','2026-07-03 19:30:00+05:30','Vendor meeting — RMC plant'),
  ('m100043-0000-4000-8000-000000000043','b05836e8-f1e4-45c5-b59c-4e8f3db3b53c','2026-07-03','2026-07-03 09:15:00+05:30','2026-07-03 18:00:00+05:30',NULL),
  ('m100044-0000-4000-8000-000000000044','95ec572b-c804-488e-977d-6f21cd9bf349','2026-07-03','2026-07-03 08:00:00+05:30','2026-07-03 20:30:00+05:30','Monsoon preparation review'),
  ('m100045-0000-4000-8000-000000000045','a55461da-4780-4624-8854-6ad7eb8fbc3b','2026-07-03','2026-07-03 07:00:00+05:30','2026-07-03 17:00:00+05:30','Site duty'),
  ('m100046-0000-4000-8000-000000000046','85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01','2026-07-03','2026-07-03 09:30:00+05:30','2026-07-03 18:30:00+05:30',NULL),
  ('m100047-0000-4000-8000-000000000047','fbbe86ee-0d2b-4de8-ab31-8d1daa807685','2026-07-03','2026-07-03 09:00:00+05:30','2026-07-03 19:00:00+05:30',NULL),
  ('m100048-0000-4000-8000-000000000048','85610fb3-06ae-43b7-93c4-1e98bb98dae3','2026-07-03','2026-07-03 09:00:00+05:30','2026-07-03 18:00:00+05:30',NULL),
  ('m100049-0000-4000-8000-000000000049','742b15de-6ed8-46e5-86b4-577c91c8136d','2026-07-03','2026-07-03 09:00:00+05:30','2026-07-03 20:00:00+05:30','Quarterly close — extended hours'),
  ('m100050-0000-4000-8000-000000000050','774c222a-c67b-494c-8738-a9c5fa17dd1f','2026-07-03','2026-07-03 07:00:00+05:30','2026-07-03 17:00:00+05:30','Site duty')
ON CONFLICT (user_id, date) DO UPDATE SET
  check_in  = EXCLUDED.check_in,
  check_out = EXCLUDED.check_out,
  notes     = EXCLUDED.notes;


-- =================================================================
-- SECTION 15 — STAFF SALARIES (3 months: Apr, May, Jun 2026)
-- staff_salaries has no unique constraint beyond PK — use explicit
-- UUIDs with ON CONFLICT (id) DO NOTHING for idempotency.
-- =================================================================
INSERT INTO public.staff_salaries
  (id, staff_user_id, period_month, amount, status, notes, created_at, updated_at)
VALUES
  -- April 2026
  ('n100001-0000-4000-8000-000000000001','25bab248-2845-4c67-8c65-d674120b67c7','2026-04-01',250000.00,'paid','Director draw — April 2026',now()-interval '2 months',now()-interval '2 months'),
  ('n100002-0000-4000-8000-000000000002','6ed29f27-f975-456a-a87a-d4a619fa7493','2026-04-01',95000.00,'paid',NULL,now()-interval '2 months',now()-interval '2 months'),
  ('n100003-0000-4000-8000-000000000003','b05836e8-f1e4-45c5-b59c-4e8f3db3b53c','2026-04-01',75000.00,'paid',NULL,now()-interval '2 months',now()-interval '2 months'),
  ('n100004-0000-4000-8000-000000000004','95ec572b-c804-488e-977d-6f21cd9bf349','2026-04-01',85000.00,'paid',NULL,now()-interval '2 months',now()-interval '2 months'),
  ('n100005-0000-4000-8000-000000000005','a55461da-4780-4624-8854-6ad7eb8fbc3b','2026-04-01',52000.00,'paid','Includes site allowance ₹5,000',now()-interval '2 months',now()-interval '2 months'),
  ('n100006-0000-4000-8000-000000000006','85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01','2026-04-01',48000.00,'paid','Base + ₹12,000 commission (2 leads converted)',now()-interval '2 months',now()-interval '2 months'),
  ('n100007-0000-4000-8000-000000000007','fbbe86ee-0d2b-4de8-ab31-8d1daa807685','2026-04-01',82000.00,'paid','Base + ₹20,000 Q1 bonus',now()-interval '2 months',now()-interval '2 months'),
  ('n100008-0000-4000-8000-000000000008','85610fb3-06ae-43b7-93c4-1e98bb98dae3','2026-04-01',45000.00,'paid',NULL,now()-interval '2 months',now()-interval '2 months'),
  ('n100009-0000-4000-8000-000000000009','742b15de-6ed8-46e5-86b4-577c91c8136d','2026-04-01',68000.00,'paid',NULL,now()-interval '2 months',now()-interval '2 months'),
  ('n100010-0000-4000-8000-000000000010','774c222a-c67b-494c-8738-a9c5fa17dd1f','2026-04-01',32000.00,'paid','Includes site allowance ₹3,000',now()-interval '2 months',now()-interval '2 months'),
  -- May 2026
  ('n100011-0000-4000-8000-000000000011','25bab248-2845-4c67-8c65-d674120b67c7','2026-05-01',250000.00,'paid','Director draw — May 2026',now()-interval '1 month',now()-interval '1 month'),
  ('n100012-0000-4000-8000-000000000012','6ed29f27-f975-456a-a87a-d4a619fa7493','2026-05-01',95000.00,'paid',NULL,now()-interval '1 month',now()-interval '1 month'),
  ('n100013-0000-4000-8000-000000000013','b05836e8-f1e4-45c5-b59c-4e8f3db3b53c','2026-05-01',75000.00,'paid',NULL,now()-interval '1 month',now()-interval '1 month'),
  ('n100014-0000-4000-8000-000000000014','95ec572b-c804-488e-977d-6f21cd9bf349','2026-05-01',85000.00,'paid',NULL,now()-interval '1 month',now()-interval '1 month'),
  ('n100015-0000-4000-8000-000000000015','a55461da-4780-4624-8854-6ad7eb8fbc3b','2026-05-01',55000.00,'paid','Site allowance + 3 days OT',now()-interval '1 month',now()-interval '1 month'),
  ('n100016-0000-4000-8000-000000000016','85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01','2026-05-01',42000.00,'paid','Base only — no closings in May',now()-interval '1 month',now()-interval '1 month'),
  ('n100017-0000-4000-8000-000000000017','fbbe86ee-0d2b-4de8-ab31-8d1daa807685','2026-05-01',65000.00,'paid',NULL,now()-interval '1 month',now()-interval '1 month'),
  ('n100018-0000-4000-8000-000000000018','85610fb3-06ae-43b7-93c4-1e98bb98dae3','2026-05-01',45000.00,'paid',NULL,now()-interval '1 month',now()-interval '1 month'),
  ('n100019-0000-4000-8000-000000000019','742b15de-6ed8-46e5-86b4-577c91c8136d','2026-05-01',68000.00,'paid',NULL,now()-interval '1 month',now()-interval '1 month'),
  ('n100020-0000-4000-8000-000000000020','774c222a-c67b-494c-8738-a9c5fa17dd1f','2026-05-01',32000.00,'paid',NULL,now()-interval '1 month',now()-interval '1 month'),
  -- June 2026
  ('n100021-0000-4000-8000-000000000021','25bab248-2845-4c67-8c65-d674120b67c7','2026-06-01',250000.00,'paid','Director draw — June 2026',now()-interval '9 days',now()-interval '9 days'),
  ('n100022-0000-4000-8000-000000000022','6ed29f27-f975-456a-a87a-d4a619fa7493','2026-06-01',95000.00,'paid',NULL,now()-interval '9 days',now()-interval '9 days'),
  ('n100023-0000-4000-8000-000000000023','b05836e8-f1e4-45c5-b59c-4e8f3db3b53c','2026-06-01',75000.00,'paid',NULL,now()-interval '9 days',now()-interval '9 days'),
  ('n100024-0000-4000-8000-000000000024','95ec572b-c804-488e-977d-6f21cd9bf349','2026-06-01',85000.00,'paid',NULL,now()-interval '9 days',now()-interval '9 days'),
  ('n100025-0000-4000-8000-000000000025','a55461da-4780-4624-8854-6ad7eb8fbc3b','2026-06-01',52000.00,'paid','Site allowance included',now()-interval '9 days',now()-interval '9 days'),
  ('n100026-0000-4000-8000-000000000026','85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01','2026-06-01',54000.00,'paid','Base + ₹18,000 commission (Sundar Rajan quote closed)',now()-interval '9 days',now()-interval '9 days'),
  ('n100027-0000-4000-8000-000000000027','fbbe86ee-0d2b-4de8-ab31-8d1daa807685','2026-06-01',75000.00,'paid','Base + ₹12,000 target achieved',now()-interval '9 days',now()-interval '9 days'),
  ('n100028-0000-4000-8000-000000000028','85610fb3-06ae-43b7-93c4-1e98bb98dae3','2026-06-01',45000.00,'paid',NULL,now()-interval '9 days',now()-interval '9 days'),
  ('n100029-0000-4000-8000-000000000029','742b15de-6ed8-46e5-86b4-577c91c8136d','2026-06-01',68000.00,'paid',NULL,now()-interval '9 days',now()-interval '9 days'),
  ('n100030-0000-4000-8000-000000000030','774c222a-c67b-494c-8738-a9c5fa17dd1f','2026-06-01',32000.00,'paid',NULL,now()-interval '9 days',now()-interval '9 days')
ON CONFLICT (id) DO NOTHING;


-- =================================================================
-- SECTION 16 — STAFF LEAVES
-- 6 leave requests: mix of approved, pending, rejected.
-- =================================================================
INSERT INTO public.staff_leaves
  (id, staff_user_id, from_date, to_date, leave_type, status, reason, created_at, updated_at)
VALUES
  ('o100001-0000-4000-8000-000000000001',
   'a55461da-4780-4624-8854-6ad7eb8fbc3b',
   '2026-07-14','2026-07-16','casual','approved',
   'Personal work — need to travel to native place in Agra for family function.',
   now()-interval '8 days', now()-interval '5 days'),

  ('o100002-0000-4000-8000-000000000002',
   'b05836e8-f1e4-45c5-b59c-4e8f3db3b53c',
   '2026-07-21','2026-07-25','earned','pending',
   'Annual family vacation — Himachal Pradesh trip planned since March.',
   now()-interval '3 days', now()-interval '3 days'),

  ('o100003-0000-4000-8000-000000000003',
   '85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01',
   '2026-06-23','2026-06-23','sick','approved',
   'Severe migraine — unable to attend office. Doctor visit confirmed.',
   now()-interval '16 days', now()-interval '15 days'),

  ('o100004-0000-4000-8000-000000000004',
   '774c222a-c67b-494c-8738-a9c5fa17dd1f',
   '2026-07-18','2026-07-20','casual','pending',
   'Sister''s wedding function in Hyderabad.',
   now()-interval '2 days', now()-interval '2 days'),

  ('o100005-0000-4000-8000-000000000005',
   '85610fb3-06ae-43b7-93c4-1e98bb98dae3',
   '2026-06-02','2026-06-06','earned','approved',
   'Planned vacation — approved in advance by Operations Manager.',
   now()-interval '40 days', now()-interval '39 days'),

  ('o100006-0000-4000-8000-000000000006',
   '742b15de-6ed8-46e5-86b4-577c91c8136d',
   '2026-07-07','2026-07-07','casual','rejected',
   'Personal errand.',
   now()-interval '7 days', now()-interval '6 days')
ON CONFLICT (id) DO NOTHING;


-- =================================================================
-- SECTION 17 — AUDIT LOGS
-- 15 representative audit events covering logins, data changes,
-- and admin actions.
-- =================================================================
INSERT INTO public.audit_logs
  (id, actor_id, actor_email, action, target_type, target_id, target_email, metadata, ip_address, created_at)
VALUES
  ('p100001-0000-4000-8000-000000000001',
   '25bab248-2845-4c67-8c65-d674120b67c7','owner@adityaconstruction.com',
   'USER_LOGIN','user','25bab248-2845-4c67-8c65-d674120b67c7',NULL,
   '{"device":"Chrome 126 / Windows 11","location":"Greater Noida"}'::jsonb,
   '103.21.45.67', now()-interval '11 days'),

  ('p100002-0000-4000-8000-000000000002',
   '25bab248-2845-4c67-8c65-d674120b67c7','owner@adityaconstruction.com',
   'PROJECT_CREATED','project','c1000002-0000-4000-8000-000000000002',NULL,
   '{"title":"ACE City Commercial Tower — IT Hub","budget":32000000}'::jsonb,
   '103.21.45.67', now()-interval '2 months'),

  ('p100003-0000-4000-8000-000000000003',
   'fbbe86ee-0d2b-4de8-ab31-8d1daa807685','deepak.joshi@adityaconstruction.com',
   'LEAD_STATUS_CHANGED','lead','f1000006-0000-4000-8000-000000000006',NULL,
   '{"from":"qualified","to":"lost","reason":"Lost to L&T Construction on pricing"}'::jsonb,
   '182.70.112.34', now()-interval '30 days'),

  ('p100004-0000-4000-8000-000000000004',
   '95ec572b-c804-488e-977d-6f21cd9bf349','priya.gupta@adityaconstruction.com',
   'PROJECT_PROGRESS_UPDATED','project','c1000004-0000-4000-8000-000000000004',NULL,
   '{"from":85,"to":100,"milestone":"Solar commissioning complete"}'::jsonb,
   '106.51.89.23', now()-interval '2 months'),

  ('p100005-0000-4000-8000-000000000005',
   'b05836e8-f1e4-45c5-b59c-4e8f3db3b53c','rahul.sharma@adityaconstruction.com',
   'PAYROLL_PROCESSED','payroll','2026-06',NULL,
   '{"period":"June 2026","total_staff":10,"total_amount":831000}'::jsonb,
   '103.21.45.67', now()-interval '9 days'),

  ('p100006-0000-4000-8000-000000000006',
   '25bab248-2845-4c67-8c65-d674120b67c7','owner@adityaconstruction.com',
   'ROLE_ASSIGNED','user','85610fb3-06ae-43b7-93c4-1e98bb98dae3','kavya.nair@adityaconstruction.com',
   '{"role":"customer_support"}'::jsonb,
   '103.21.45.67', now()-interval '6 months'),

  ('p100007-0000-4000-8000-000000000007',
   '85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01','neha.verma@adityaconstruction.com',
   'LEAD_CREATED','lead','f1000007-0000-4000-8000-000000000007',NULL,
   '{"name":"Pradeep Malhotra","service":"hvac","source":"website"}'::jsonb,
   '49.205.67.89', now()-interval '12 days'),

  ('p100008-0000-4000-8000-000000000008',
   '95ec572b-c804-488e-977d-6f21cd9bf349','priya.gupta@adityaconstruction.com',
   'QUOTE_SENT','quote_request','g1000001-0000-4000-8000-000000000001','owner@adityaconstruction.com',
   '{"amount":9800000,"service":"construction","title":"Sector 10 Duplex Bungalow"}'::jsonb,
   '106.51.89.23', now()-interval '20 days'),

  ('p100009-0000-4000-8000-000000000009',
   '85610fb3-06ae-43b7-93c4-1e98bb98dae3','kavya.nair@adityaconstruction.com',
   'TICKET_RESOLVED','ticket','h1000004-0000-4000-8000-000000000004',NULL,
   '{"subject":"Safety Helmet Stock Running Low","resolution":"PO raised for 60 helmets"}'::jsonb,
   '103.21.45.67', now()-interval '14 days'),

  ('p100010-0000-4000-8000-000000000010',
   '742b15de-6ed8-46e5-86b4-577c91c8136d','arjun.mehta@adityaconstruction.com',
   'USER_LOGIN','user','742b15de-6ed8-46e5-86b4-577c91c8136d',NULL,
   '{"device":"Firefox 128 / Ubuntu","location":"Noida"}'::jsonb,
   '117.197.34.56', now()-interval '1 day'),

  ('p100011-0000-4000-8000-000000000011',
   '6ed29f27-f975-456a-a87a-d4a619fa7493','operations@adityaconstruction.com',
   'PROJECT_STATUS_CHANGED','project','c1000004-0000-4000-8000-000000000004',NULL,
   '{"from":"in_progress","to":"completed"}'::jsonb,
   '103.21.45.67', now()-interval '2 months'),

  ('p100012-0000-4000-8000-000000000012',
   '25bab248-2845-4c67-8c65-d674120b67c7','owner@adityaconstruction.com',
   'PERMISSIONS_UPDATED','role','sales_executive',NULL,
   '{"module":"quotes","changed_to":false}'::jsonb,
   '103.21.45.67', now()-interval '3 months'),

  ('p100013-0000-4000-8000-000000000013',
   'fbbe86ee-0d2b-4de8-ab31-8d1daa807685','deepak.joshi@adityaconstruction.com',
   'QUOTE_ACCEPTED','quote_request','g1000005-0000-4000-8000-000000000005',NULL,
   '{"amount":28000000,"client":"Vikram Nair","project":"ACE City Office Fit-out"}'::jsonb,
   '182.70.112.34', now()-interval '8 days'),

  ('p100014-0000-4000-8000-000000000014',
   'b05836e8-f1e4-45c5-b59c-4e8f3db3b53c','rahul.sharma@adityaconstruction.com',
   'LEAVE_APPROVED','leave','o100001-0000-4000-8000-000000000001','amit.singh@adityaconstruction.com',
   '{"from_date":"2026-07-14","to_date":"2026-07-16","type":"casual"}'::jsonb,
   '103.21.45.67', now()-interval '5 days'),

  ('p100015-0000-4000-8000-000000000015',
   '25bab248-2845-4c67-8c65-d674120b67c7','owner@adityaconstruction.com',
   'BLOG_PUBLISHED','blog_post','k1000001-0000-4000-8000-000000000001',NULL,
   '{"slug":"green-building-norms-gnida-2026","title":"Green Building Norms Under GNIDA''s 2026 Master Plan"}'::jsonb,
   '103.21.45.67', now()-interval '30 days')
ON CONFLICT (id) DO NOTHING;


-- =================================================================
-- SECTION 18 — CONTACT MESSAGES (sample enquiries)
-- =================================================================
INSERT INTO public.contact_messages
  (id, name, email, phone, subject, message, handled, created_at)
VALUES
  ('q100001-0000-4000-8000-000000000001',
   'Ajay Tripathi','ajay.tripathi@gmail.com','+91-9911223344',
   'New Office Requirement — 3,000 sqft',
   'Hi, I am looking for a ready-to-move 3,000 sqft commercial office space on Noida Expressway. Budget is ₹2.5 Cr. Please share available options and site visit schedule.',
   false, now()-interval '2 days'),

  ('q100002-0000-4000-8000-000000000002',
   'Pooja Saxena','pooja.s@yahoo.in','+91-9870334455',
   'Interior Design Query — 2 BHK',
   'Interested in complete interior design for my 2 BHK apartment in Gaur City 2. 1,050 sqft. Looking for something modern but not too expensive. Can you share your portfolio?',
   true, now()-interval '5 days'),

  ('q100003-0000-4000-8000-000000000003',
   'Infra Tech Solutions','contact@infratechsol.com','+91-8800556677',
   'Partnership Inquiry — Turnkey Projects',
   'We are a project management company looking to partner with a reliable civil contractor for NCR region. We have 3 projects in pipeline — Ghaziabad, Noida, and Greater Noida. Would like to explore a long-term partnership.',
   false, now()-interval '1 day')
ON CONFLICT (id) DO NOTHING;


-- =================================================================
-- SECTION 19 — VERIFICATION QUERIES
-- Run these after applying to confirm data is correctly seeded.
-- =================================================================

SELECT '======================================' AS separator;
SELECT '  ADITYA CONSTRUCTIONS — SEED VERIFY  ' AS separator;
SELECT '======================================' AS separator;

SELECT
  'auth_users'    AS entity,
  count(*)::text  AS count,
  CASE WHEN count(*) = 10 THEN '✓ OK' ELSE '✗ CHECK' END AS status
FROM auth.users
WHERE id IN (
  '25bab248-2845-4c67-8c65-d674120b67c7','6ed29f27-f975-456a-a87a-d4a619fa7493',
  'b05836e8-f1e4-45c5-b59c-4e8f3db3b53c','95ec572b-c804-488e-977d-6f21cd9bf349',
  'a55461da-4780-4624-8854-6ad7eb8fbc3b','85fabe48-ab0c-4a3f-9fc6-9e5ef4ad5b01',
  'fbbe86ee-0d2b-4de8-ab31-8d1daa807685','85610fb3-06ae-43b7-93c4-1e98bb98dae3',
  '742b15de-6ed8-46e5-86b4-577c91c8136d','774c222a-c67b-494c-8738-a9c5fa17dd1f'
)

UNION ALL SELECT 'profiles',      count(*)::text, CASE WHEN count(*)>=10 THEN '✓ OK' ELSE '✗ CHECK' END FROM public.profiles
UNION ALL SELECT 'user_roles',    count(*)::text, CASE WHEN count(*)>=10 THEN '✓ OK' ELSE '✗ CHECK' END FROM public.user_roles
UNION ALL SELECT 'role_perms',    count(*)::text, CASE WHEN count(*)>=80 THEN '✓ OK' ELSE '✗ CHECK' END FROM public.role_permissions
UNION ALL SELECT 'projects',      count(*)::text, CASE WHEN count(*)>=5  THEN '✓ OK' ELSE '✗ CHECK' END FROM public.projects
UNION ALL SELECT 'milestones',    count(*)::text, CASE WHEN count(*)>=10 THEN '✓ OK' ELSE '✗ CHECK' END FROM public.project_milestones
UNION ALL SELECT 'leads',         count(*)::text, CASE WHEN count(*)>=8  THEN '✓ OK' ELSE '✗ CHECK' END FROM public.leads
UNION ALL SELECT 'quote_requests',count(*)::text, CASE WHEN count(*)>=5  THEN '✓ OK' ELSE '✗ CHECK' END FROM public.quote_requests
UNION ALL SELECT 'tickets',       count(*)::text, CASE WHEN count(*)>=6  THEN '✓ OK' ELSE '✗ CHECK' END FROM public.tickets
UNION ALL SELECT 'ticket_messages',count(*)::text,CASE WHEN count(*)>=6  THEN '✓ OK' ELSE '✗ CHECK' END FROM public.ticket_messages
UNION ALL SELECT 'testimonials',  count(*)::text, CASE WHEN count(*)>=6  THEN '✓ OK' ELSE '✗ CHECK' END FROM public.testimonials
UNION ALL SELECT 'blog_posts',    count(*)::text, CASE WHEN count(*)>=4  THEN '✓ OK' ELSE '✗ CHECK' END FROM public.blog_posts
UNION ALL SELECT 'staff_tasks',   count(*)::text, CASE WHEN count(*)>=10 THEN '✓ OK' ELSE '✗ CHECK' END FROM public.staff_tasks
UNION ALL SELECT 'attendance',    count(*)::text, CASE WHEN count(*)>=50 THEN '✓ OK' ELSE '✗ CHECK' END FROM public.attendance
UNION ALL SELECT 'salaries',      count(*)::text, CASE WHEN count(*)>=30 THEN '✓ OK' ELSE '✗ CHECK' END FROM public.staff_salaries
UNION ALL SELECT 'leaves',        count(*)::text, CASE WHEN count(*)>=6  THEN '✓ OK' ELSE '✗ CHECK' END FROM public.staff_leaves
UNION ALL SELECT 'audit_logs',    count(*)::text, CASE WHEN count(*)>=15 THEN '✓ OK' ELSE '✗ CHECK' END FROM public.audit_logs
UNION ALL SELECT 'contact_msgs',  count(*)::text, CASE WHEN count(*)>=3  THEN '✓ OK' ELSE '✗ CHECK' END FROM public.contact_messages

ORDER BY entity;

-- Per-user role confirmation
SELECT
  p.full_name,
  p.email,
  ur.role::text         AS role,
  p.department,
  p.employee_id,
  p.status::text        AS status
FROM public.profiles   p
JOIN public.user_roles ur ON ur.user_id = p.id
ORDER BY ur.role;


-- =================================================================
-- SECTION 20 — LOGIN CREDENTIALS
-- =================================================================
SELECT
  '===================================================' AS "--- DEMO LOGIN CREDENTIALS ---";

SELECT
  v.email          AS "Email",
  v.password       AS "Password",
  v.role           AS "Role"
FROM (VALUES
  ('owner@adityaconstruction.com',       'Owner@123', 'owner'),
  ('operations@adityaconstruction.com',  'Ops@123',   'operations_manager'),
  ('rahul.sharma@adityaconstruction.com','Staff@123', 'hr_manager'),
  ('priya.gupta@adityaconstruction.com', 'Staff@123', 'project_manager'),
  ('amit.singh@adityaconstruction.com',  'Staff@123', 'site_engineer'),
  ('neha.verma@adityaconstruction.com',  'Staff@123', 'sales_executive'),
  ('deepak.joshi@adityaconstruction.com','Staff@123', 'sales_manager'),
  ('kavya.nair@adityaconstruction.com',  'Staff@123', 'customer_support'),
  ('arjun.mehta@adityaconstruction.com', 'Staff@123', 'accountant'),
  ('kiran.reddy@adityaconstruction.com', 'Staff@123', 'staff')
) AS v(email, password, role);
