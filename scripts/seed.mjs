/**
 * Aditya Constructions — Replit PostgreSQL Demo Seed
 * Idempotent: safe to re-run. Uses ON CONFLICT DO NOTHING / DO UPDATE.
 * Password for all accounts: Demo_Lost.experts.reassigned
 */
import bcrypt from "bcryptjs";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { max: 5 });
const DEMO_PASSWORD = "Demo_Lost.experts.reassigned";

async function main() {
  console.log("Hashing demo password...");
  const pwHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ── 1. DEMO USERS ──────────────────────────────────────────────────────────
  const accounts = [
    { email: "owner@adityaconstruction.com",        name: "Aditya Kumar",   role: "owner",              dept: "Executive",   empId: "EMP001" },
    { email: "operations@adityaconstruction.com",   name: "Raj Sharma",     role: "operations_manager", dept: "Operations",  empId: "EMP002" },
    { email: "rahul.sharma@adityaconstruction.com", name: "Rahul Sharma",   role: "hr_manager",         dept: "HR",          empId: "EMP003" },
    { email: "priya.gupta@adityaconstruction.com",  name: "Priya Gupta",    role: "project_manager",    dept: "Projects",    empId: "EMP004" },
    { email: "amit.singh@adityaconstruction.com",   name: "Amit Singh",     role: "site_engineer",      dept: "Engineering", empId: "EMP005" },
    { email: "neha.verma@adityaconstruction.com",   name: "Neha Verma",     role: "sales_executive",    dept: "Sales",       empId: "EMP006" },
    { email: "deepak.joshi@adityaconstruction.com", name: "Deepak Joshi",   role: "sales_manager",      dept: "Sales",       empId: "EMP007" },
    { email: "kavya.nair@adityaconstruction.com",   name: "Kavya Nair",     role: "customer_support",   dept: "Support",     empId: "EMP008" },
    { email: "arjun.mehta@adityaconstruction.com",  name: "Arjun Mehta",    role: "accountant",         dept: "Finance",     empId: "EMP009" },
    { email: "kiran.reddy@adityaconstruction.com",  name: "Kiran Reddy",    role: "general_staff",      dept: "Operations",  empId: "EMP010" },
    { email: "customer1@example.com",               name: "Vikram Nair",    role: "customer",           dept: null,          empId: null },
    { email: "customer2@example.com",               name: "Sunita Patel",   role: "customer",           dept: null,          empId: null },
  ];

  console.log("Inserting demo users...");
  const userIds = {};
  for (const acc of accounts) {
    const [u] = await sql`
      INSERT INTO public.users (email, password_hash)
      VALUES (${acc.email}, ${pwHash})
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id
    `;
    userIds[acc.email] = u.id;

    await sql`
      INSERT INTO public.profiles (id, full_name, status, department, employee_id)
      VALUES (${u.id}, ${acc.name}, 'active', ${acc.dept}, ${acc.empId})
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, department = EXCLUDED.department, employee_id = EXCLUDED.employee_id
    `;

    await sql`
      INSERT INTO public.user_roles (user_id, role)
      VALUES (${u.id}, ${acc.role})
      ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role
    `;
    console.log(`  ✓ ${acc.email} (${acc.role})`);
  }

  // Convenience aliases
  const ownerId    = userIds["owner@adityaconstruction.com"];
  const opsId      = userIds["operations@adityaconstruction.com"];
  const hrId       = userIds["rahul.sharma@adityaconstruction.com"];
  const pmId       = userIds["priya.gupta@adityaconstruction.com"];
  const engId      = userIds["amit.singh@adityaconstruction.com"];
  const salesExId  = userIds["neha.verma@adityaconstruction.com"];
  const salesMgrId = userIds["deepak.joshi@adityaconstruction.com"];
  const supportId  = userIds["kavya.nair@adityaconstruction.com"];
  const acctId     = userIds["arjun.mehta@adityaconstruction.com"];
  const staffId    = userIds["kiran.reddy@adityaconstruction.com"];
  const cust1Id    = userIds["customer1@example.com"];
  const cust2Id    = userIds["customer2@example.com"];

  // ── 2. ROLE PERMISSIONS ────────────────────────────────────────────────────
  console.log("Seeding role_permissions...");
  const PERMISSIONS = {
    owner:              ["dashboard","leads","quotes","projects","tickets","hr","blog","team","testimonials","messages","users","audit","permissions","tasks","leaves","reports","finance","clients","employees","vendors","materials","equipment","procurement","documents","site_monitoring","quality","safety","scheduling","system"],
    admin:              ["dashboard","leads","quotes","projects","tickets","hr","blog","team","testimonials","messages","users","audit","permissions","tasks","leaves","reports","finance","clients","employees","vendors","materials","equipment","procurement","documents","site_monitoring","quality","safety","scheduling","system"],
    managing_director:  ["dashboard","projects","quotes","leads","hr","reports","finance","tickets","team","clients","employees","vendors","procurement","documents","scheduling"],
    operations_manager: ["dashboard","projects","quotes","tickets","tasks","messages","leads","team","clients","materials","equipment","site_monitoring","scheduling","documents","vendors"],
    hr_manager:         ["dashboard","hr","leaves","tasks","team","employees","scheduling"],
    sales_manager:      ["dashboard","leads","quotes","tasks","messages","reports","clients"],
    marketing_manager:  ["dashboard","blog","testimonials","leads","messages","clients"],
    accountant:         ["dashboard","finance","reports","quotes","procurement"],
    sales_executive:    ["dashboard","leads","tasks","clients"],
    project_manager:    ["dashboard","projects","tasks","quotes","site_monitoring","scheduling","documents","materials","equipment","quality","safety"],
    site_engineer:      ["dashboard","projects","tasks","site_monitoring","quality","safety","materials"],
    customer_support:   ["dashboard","tickets","messages","tasks","clients"],
    general_staff:      ["dashboard","tasks","leaves"],
    staff:              ["dashboard","tasks","leaves"],
    customer:           ["dashboard"],
  };
  for (const [role, modules] of Object.entries(PERMISSIONS)) {
    for (const module of modules) {
      await sql`
        INSERT INTO public.role_permissions (role, module, allowed)
        VALUES (${role}, ${module}, true)
        ON CONFLICT (role, module) DO NOTHING
      `;
    }
  }
  console.log("  ✓ role_permissions seeded");

  // ── 3. PROJECTS ────────────────────────────────────────────────────────────
  console.log("Seeding projects...");
  const projects = await sql`
    INSERT INTO public.projects (title, description, service_type, status, progress, location, budget, start_date, end_date, customer_id)
    VALUES
      ('Sector 78 Residential Complex', '12-storey residential complex with 96 luxury apartments, parking, and amenity floors.', 'construction', 'in_progress', 68, 'Sector 78, Greater Noida', 42000000, '2025-02-01', '2026-06-30', ${cust1Id}),
      ('Omega Green Office Park', 'Grade-A commercial office park with 3 towers and landscaped gardens.', 'construction', 'in_progress', 45, 'Knowledge Park III, Greater Noida', 78000000, '2025-06-15', '2027-03-31', ${cust2Id}),
      ('Villa Aura Interior Fit-Out', 'Premium interior fit-out for 8 independent villas — Italian marble, designer fixtures.', 'interiors', 'completed', 100, 'Yamuna Expressway, Greater Noida', 9500000, '2024-10-01', '2025-04-15', ${cust1Id}),
      ('Shoppers Hub HVAC System', 'Central HVAC design and installation for 180,000 sq.ft. retail mall.', 'hvac', 'in_progress', 72, 'Alpha Commercial Belt, Greater Noida', 15600000, '2025-04-01', '2025-11-30', null),
      ('GreenSun Rooftop Solar Array', '500 kW grid-tied rooftop solar installation for industrial client.', 'solar', 'completed', 100, 'GNIDA Industrial Area, Phase II', 8200000, '2024-08-01', '2025-01-31', null),
      ('Emerald Heights Residential Tower', 'Single 20-storey luxury residential tower with rooftop pool.', 'construction', 'planning', 12, 'Sector 50, Greater Noida', 55000000, '2025-08-01', '2027-12-31', ${cust2Id}),
      ('Zen Office Interiors', 'Minimalist open-plan interior redesign for 22,000 sq.ft. IT company.', 'interiors', 'in_progress', 55, 'Tech Zone IV, Greater Noida', 4200000, '2025-05-01', '2025-10-31', null),
      ('Sunrise Villas Real Estate Development', '48-plot premium villa community with clubhouse and park.', 'real_estate', 'planning', 8, 'Sector 22D, Yamuna Expressway', 31000000, '2025-09-01', '2027-06-30', null)
    RETURNING id, title
  `;

  const [p1, p2, p3, p4, p5, p6, p7, p8] = projects;
  console.log(`  ✓ ${projects.length} projects inserted`);

  // ── 4. PROJECT MILESTONES ──────────────────────────────────────────────────
  console.log("Seeding project milestones...");
  await sql`
    INSERT INTO public.project_milestones (project_id, title, description, status, due_date) VALUES
      (${p1.id}, 'Foundation & Piling', 'Complete pile driving and raft foundation.', 'completed', '2025-05-31'),
      (${p1.id}, 'Structure Floors 1–6',  'RCC frame for lower six floors.', 'completed', '2025-09-30'),
      (${p1.id}, 'Structure Floors 7–12', 'RCC frame for upper six floors.', 'in_progress', '2026-01-31'),
      (${p1.id}, 'Facade & Glazing',      'External cladding, windows, and terrace waterproofing.', 'pending', '2026-04-30'),
      (${p1.id}, 'Handover',              'Final inspection and key handover to client.', 'pending', '2026-06-30'),
      (${p2.id}, 'Site Clearance & Levelling', 'Demolish existing structure and level ground.', 'completed', '2025-07-31'),
      (${p2.id}, 'Tower A Foundation',    'Foundation works for Tower A.', 'in_progress', '2025-12-31'),
      (${p2.id}, 'Tower B & C Foundation', 'Foundation works for Towers B and C.', 'pending', '2026-04-30'),
      (${p3.id}, 'Design Sign-Off',       'Client approves final material selections and layouts.', 'completed', '2024-10-20'),
      (${p3.id}, 'Civil & Flooring Works','Marble flooring, false ceilings installed.', 'completed', '2025-01-31'),
      (${p3.id}, 'Fixtures & Furnishing', 'Sanitary fixtures, kitchen and furniture installed.', 'completed', '2025-03-31'),
      (${p3.id}, 'Snagging & Handover',   'Final punch list cleared and keys handed over.', 'completed', '2025-04-15'),
      (${p4.id}, 'Duct Design & Approval','MEP drawings approved by client consultant.', 'completed', '2025-04-30'),
      (${p4.id}, 'Main Plant Installation','AHUs, chillers, and cooling towers commissioned.', 'in_progress', '2025-09-30'),
      (${p4.id}, 'Branch Distribution',   'Ductwork distribution on all floors complete.', 'pending', '2025-11-15'),
      (${p5.id}, 'Structural Assessment', 'Roof load capacity confirmed by structural engineer.', 'completed', '2024-08-20'),
      (${p5.id}, 'Panel Installation',    '500 kW panels and inverters installed.', 'completed', '2024-11-30'),
      (${p5.id}, 'Grid Synchronisation',  'DISCOM approval received, system live.', 'completed', '2025-01-25')
  `;
  console.log("  ✓ project_milestones seeded");

  // ── 5. PROJECT UPDATES ─────────────────────────────────────────────────────
  console.log("Seeding project_updates...");
  await sql`
    INSERT INTO public.project_updates (project_id, content, posted_by, created_at) VALUES
      (${p1.id}, 'Piling works completed ahead of schedule. Ready for raft foundation.', ${pmId}, now() - interval '120 days'),
      (${p1.id}, 'Raft foundation poured. 7th floor columns in progress.', ${pmId}, now() - interval '90 days'),
      (${p1.id}, 'Floor 8 slab struck. Structural inspection passed.', ${engId}, now() - interval '60 days'),
      (${p1.id}, 'Facade contractor mobilised. Curtain wall system delivery on track.', ${pmId}, now() - interval '14 days'),
      (${p2.id}, 'Site clearance complete. Survey pins set for Tower A layout.', ${engId}, now() - interval '80 days'),
      (${p2.id}, 'Tower A pile cap excavation 60% complete.', ${pmId}, now() - interval '45 days'),
      (${p2.id}, 'Client requested minor scope change on Tower B retail plinth. Revised drawings issued.', ${opsId}, now() - interval '20 days'),
      (${p4.id}, 'Chillers and cooling towers installed on rooftop. Commissioning next week.', ${engId}, now() - interval '30 days'),
      (${p4.id}, 'Floor 1–5 ductwork complete. Air balancing in progress.', ${engId}, now() - interval '10 days'),
      (${p7.id}, 'Design concept approved. Demolition of existing interiors underway.', ${pmId}, now() - interval '40 days'),
      (${p7.id}, 'Flooring and ceiling grid installed on 60% of floor plate.', ${engId}, now() - interval '15 days')
  `;
  console.log("  ✓ project_updates seeded");

  // ── 6. LEADS ───────────────────────────────────────────────────────────────
  console.log("Seeding leads...");
  await sql`
    INSERT INTO public.leads (name, email, phone, service, message, status, source, budget_range, location, assigned_to, created_at) VALUES
      ('Sandeep Malhotra',  'sandeep.m@gmail.com',        '+91-9876543210', 'construction', 'Need a 4BHK villa in Greater Noida west.', 'qualified',  'Website',    '₹1.5–2 Cr',   'Greater Noida West', ${salesMgrId}, now() - interval '60 days'),
      ('Rajeshwari Iyer',   'rajeshwari.iyer@outlook.com', '+91-9845012345', 'interiors',    'Interior design for our new 3BHK apartment.', 'contacted', 'Referral',   '₹15–25 L',   'Noida Sector 104',   ${salesExId},  now() - interval '50 days'),
      ('Pradeep Construction', 'pradeep.cst@business.in',  '+91-9911223344', 'hvac',         'Central AC for our 2-lakh sqft warehouse.', 'new',        'Google Ads', '₹80L–1.2 Cr', 'GNIDA Industrial',   ${salesMgrId}, now() - interval '45 days'),
      ('Meena Aggarwal',    'meena.aggarwal@yahoo.com',    '+91-9701122334', 'solar',        'Rooftop solar for our factory 300 kW target.', 'qualified', 'LinkedIn',   '₹55–70 L',   'Sector 63, Noida',   ${salesExId},  now() - interval '40 days'),
      ('Rajeev Sinha',      'rajeev.sinha@gmail.com',      '+91-9821009876', 'real_estate',  'Looking for 200 sq.yd. commercial plot.', 'contacted',   'Walk-in',    '₹50–60 L',   'Yamuna Expressway',  ${salesMgrId}, now() - interval '35 days'),
      ('TechBuild Pvt Ltd', 'procurement@techbuild.co.in', '+91-9312233445', 'construction', 'Office campus construction 5 acres.',       'new',        'Exhibition', '₹40–60 Cr',  'Knowledge Park II',  ${opsId},      now() - interval '30 days'),
      ('Ananya Kapoor',     'ananya.k@designstudio.in',    '+91-9643312345', 'interiors',    'Boutique hotel lobby and 24 room interiors.', 'qualified', 'Website',    '₹2–3 Cr',    'Connaught Place',    ${salesExId},  now() - interval '25 days'),
      ('Dr Vikrant Rao',    'dr.vikrant@raohospitals.com', '+91-9734554321', 'hvac',         'Hospital HVAC upgrade — 10 OTs & ICU.',     'converted',  'Referral',   '₹1.8–2.5 Cr', 'Greater Noida',     ${salesMgrId}, now() - interval '20 days'),
      ('Shreya Ventures',   'shreya.v@business.in',        '+91-9654123456', 'solar',        '80 kW solar for mall parking canopy.',      'lost',       'Google Ads', '₹15–20 L',   'Sector 18, Noida',   ${salesExId},  now() - interval '15 days'),
      ('Harish Gupta',      'harish.g@hgfinance.com',      '+91-9845612345', 'real_estate',  'Invest in 4 residential units off-plan.',    'new',        'Website',    '₹2–2.5 Cr',  'Greater Noida West', ${salesMgrId}, now() - interval '10 days'),
      ('City Corp Housing', 'purchase@citycorp.gov.in',    '+91-1124356789', 'construction', '1000 EWS housing units turnkey project.',    'qualified',  'Tender',     '₹120–160 Cr','Greater Noida',     ${opsId},      now() - interval '7 days'),
      ('Nimisha Sharma',    'nimisha.s@infosys.com',        '+91-9701234567', 'interiors',   'Corporate office interiors 30,000 sqft.',    'contacted',  'LinkedIn',   '₹1–1.5 Cr',  'Sector 135, Noida',  ${salesExId},  now() - interval '3 days')
  `;
  console.log("  ✓ leads seeded");

  // ── 7. QUOTE REQUESTS ─────────────────────────────────────────────────────
  console.log("Seeding quote_requests...");
  await sql`
    INSERT INTO public.quote_requests (name, email, phone, service_type, requirements, budget_range, timeline, location, status, user_id, created_at) VALUES
      ('Vikram Nair',    'customer1@example.com',        '+91-9876543210', 'construction', '2-floor standalone home 2400 sqft, 4 BHK, traditional style.', '₹60–80 L',   '12–15 months', 'Sector 36, Greater Noida', 'quoted',    ${cust1Id},  now() - interval '45 days'),
      ('Sunita Patel',   'customer2@example.com',        '+91-9812345678', 'interiors',    'Living room and master bedroom complete interior.', '₹8–12 L', '3 months', 'Noida Extension', 'reviewing', ${cust2Id},  now() - interval '30 days'),
      ('Ramesh Tiwari',  'ramesh.t@tiwarigroup.com',     '+91-9910001111', 'hvac',         'Data centre precision cooling — 200 kW load.', '₹90 L–1.1 Cr', '6 months', 'Sector 63, Noida', 'quoted',    null,        now() - interval '25 days'),
      ('Prakash Energy', 'projects@prakashenergy.in',    '+91-1125551234', 'solar',        '1 MW ground-mount solar farm.', '₹5–7 Cr', '9–12 months', 'Agra Highway, UP', 'pending',   null,        now() - interval '20 days'),
      ('Kavitha Menon',  'kavitha.m@gmail.com',          '+91-9745123456', 'real_estate',  'Residential plot 100 sq.yd. in ready society.', '₹25–35 L', 'Immediate', 'Greater Noida West', 'accepted',  null,        now() - interval '15 days'),
      ('Arun Logistics', 'arun@arunlog.co.in',           '+91-9312312312', 'construction', 'Warehouse 50,000 sqft industrial RCC frame.', '₹8–10 Cr', '18 months', 'GNIDA Phase II', 'reviewing', null,        now() - interval '10 days'),
      ('Harini Iyer',    'harini.iyer@outlook.com',      '+91-9900112233', 'interiors',    'Restaurant interior 6000 sqft — contemporary theme.', '₹40–55 L', '5 months', 'Connaught Place', 'pending',   null,        now() - interval '5 days'),
      ('Vikram Nair',    'customer1@example.com',        '+91-9876543210', 'solar',        'Residential 10 kW grid-tied rooftop.', '₹6–8 L', '2 months', 'Sector 36, Greater Noida', 'pending',   ${cust1Id},  now() - interval '2 days')
  `;
  console.log("  ✓ quote_requests seeded");

  // ── 8. TICKETS ─────────────────────────────────────────────────────────────
  console.log("Seeding tickets...");
  const tickets = await sql`
    INSERT INTO public.tickets (subject, description, status, priority, customer_id, assigned_to, created_at) VALUES
      ('Ceiling seepage in master bedroom', 'Water stain visible after rains. Requires urgent inspection.', 'in_progress', 'high',   ${cust1Id}, ${supportId}, now() - interval '30 days'),
      ('Delay in project milestone update', 'Dashboard still shows old milestone. Please update.', 'open',        'medium', ${cust2Id}, ${supportId}, now() - interval '20 days'),
      ('Invoice query — payment mismatch',  'Amount on invoice 1023 does not match the PO. Need clarification.', 'resolved', 'medium', ${cust1Id}, ${acctId},   now() - interval '18 days'),
      ('Change request: add a study room',  'Client wants to convert storage to study. Scope change required.', 'open',     'high',   ${cust2Id}, ${pmId},     now() - interval '15 days'),
      ('HVAC noisy in Level 2 section B',   'Loud vibration from AHU-2. Needs service.', 'in_progress',  'urgent', ${cust1Id}, ${engId},    now() - interval '10 days'),
      ('Solar monitoring portal access',    'Cannot log in to solar monitoring dashboard.', 'open',        'low',    ${cust2Id}, ${supportId}, now() - interval '8 days'),
      ('Request for site visit booking',    'Client wants to visit Sector 78 site on Saturday.', 'resolved', 'low',    ${cust1Id}, ${opsId},    now() - interval '5 days'),
      ('Material quality complaint',        'Flooring tiles in Block C appear to have colour variation.', 'open', 'high', ${cust2Id}, ${pmId},    now() - interval '2 days')
    RETURNING id, subject
  `;
  console.log(`  ✓ ${tickets.length} tickets inserted`);

  // ── 9. TICKET MESSAGES ─────────────────────────────────────────────────────
  console.log("Seeding ticket_messages...");
  const [t1, t2, t3, t4, t5] = tickets;
  await sql`
    INSERT INTO public.ticket_messages (ticket_id, sender_id, message, created_at) VALUES
      (${t1.id}, ${cust1Id},  'I noticed water dripping near the AC duct junction. Happens every time it rains.', now() - interval '30 days'),
      (${t1.id}, ${supportId},'Thank you for reporting. Our site engineer has been informed. Site visit scheduled for tomorrow.', now() - interval '29 days'),
      (${t1.id}, ${engId},    'Inspected on site. The parapet flashing above the room needs resealing. Will be fixed this week.', now() - interval '28 days'),
      (${t1.id}, ${cust1Id},  'Has the work been done? Still some discolouration visible.', now() - interval '25 days'),
      (${t1.id}, ${supportId},'Repair completed. Paint touch-up will follow once surface dries. Thank you for your patience.', now() - interval '24 days'),
      (${t2.id}, ${cust2Id},  'Milestone 3 was supposed to be marked complete last week. Dashboard still shows pending.', now() - interval '20 days'),
      (${t2.id}, ${pmId},     'Apologies for the delay. I have updated the milestone now. Please refresh the portal.', now() - interval '19 days'),
      (${t3.id}, ${cust1Id},  'Invoice shows ₹47,800 but our PO is for ₹45,000. Please advise.', now() - interval '18 days'),
      (${t3.id}, ${acctId},   'The difference of ₹2,800 is GST applicable on the variation order approved on 12 Jan. I will send the breakup.', now() - interval '17 days'),
      (${t3.id}, ${cust1Id},  'Got the breakup. Makes sense. Thank you.', now() - interval '16 days'),
      (${t4.id}, ${cust2Id},  'We need a study room instead of the storage space on the second floor. Can this be done?', now() - interval '15 days'),
      (${t4.id}, ${pmId},     'Scope change noted. We will prepare a variation order for your approval. Estimated cost ₹1.2L additional.', now() - interval '14 days'),
      (${t5.id}, ${cust1Id},  'There is a grinding noise from the unit above the main corridor. Very disruptive during working hours.', now() - interval '10 days'),
      (${t5.id}, ${engId},    'Identified loose fan belt in AHU-2. Replacement part ordered. Will be fixed within 48 hours.', now() - interval '9 days')
  `;
  console.log("  ✓ ticket_messages seeded");

  // ── 10. BLOG POSTS ─────────────────────────────────────────────────────────
  console.log("Seeding blog_posts...");
  await sql`
    INSERT INTO public.blog_posts (title, slug, excerpt, content, category, published, published_at, author_id, created_at) VALUES
      (
        'Why Green Buildings Are the Future of Construction in India',
        'green-buildings-future-india',
        'Sustainable construction is no longer optional — it is a business imperative.',
        '## The Green Building Revolution\n\nIndia''s construction sector accounts for nearly 40% of national energy consumption. As urbanisation accelerates, green building practices are shifting from niche to mainstream.\n\n### What Makes a Building Green?\n\nGreen buildings incorporate energy-efficient systems, renewable materials, water conservation, and smart automation to minimise environmental impact throughout their lifecycle.\n\n### Aditya Constructions'' Approach\n\nWe integrate LEED and GRIHA rating criteria into every major project, from site selection to material procurement. Our Omega Green Office Park is designed to achieve a 4-Star GRIHA rating upon completion.\n\n### The Financial Case\n\nGreen buildings typically achieve 10–30% lower operating costs, commanding a rental premium of 5–15% in Tier-1 and Tier-2 cities.\n\n### Conclusion\n\nSustainability is not a cost — it is an investment with measurable returns for clients, communities, and the planet.',
        'Construction', true, now() - interval '45 days', ${ownerId}, now() - interval '50 days'
      ),
      (
        'Top 5 Trends in Luxury Interior Design for 2025',
        'luxury-interior-trends-2025',
        'From biophilic elements to smart home integration, interior design is evolving fast.',
        '## 2025 Interior Design Trends\n\n### 1. Biophilic Design\nNatural materials, living walls, and maximised daylight create spaces that reduce stress and boost productivity.\n\n### 2. Smart Home Integration\nVoice-controlled lighting, automated blinds, and integrated AV systems are now expected in premium homes.\n\n### 3. Artisan Craftsmanship\nHandcrafted furniture and locally-sourced stone are replacing mass-produced finishes.\n\n### 4. Earthy Palettes\nWarm terracottas, sage greens, and warm whites are replacing the cool greys of the previous decade.\n\n### 5. Multi-Functional Spaces\nWork-from-home reality has made flexible room layouts a standard client requirement.\n\nAt Aditya Constructions, our interiors team helps clients navigate these trends to create timeless, personalised spaces.',
        'Interiors', true, now() - interval '30 days', ${pmId}, now() - interval '35 days'
      ),
      (
        'Solar Energy for Commercial Properties: A Cost-Benefit Analysis',
        'solar-energy-commercial-cost-benefit',
        'With electricity prices rising, the ROI on commercial solar has never been more compelling.',
        '## Solar for Commercial Properties\n\n### Current Electricity Costs\nCommercial consumers in Uttar Pradesh pay ₹7.50–₹9.50 per kWh during peak hours. A 100,000 sq.ft. facility can spend ₹25–40L annually on electricity.\n\n### Typical Solar Savings\nA well-sized rooftop installation can offset 60–80% of daytime consumption, yielding payback periods of 4–6 years.\n\n### Government Incentives\n- MNRE Central Financial Assistance for commercial rooftop\n- Accelerated depreciation at 40%\n- Net metering credits\n\n### Our Track Record\nAditya Constructions has commissioned over 3 MW of commercial and industrial solar across Uttar Pradesh. Our GreenSun project delivered a 5.2-year payback for the client.\n\n### Next Steps\nContact our energy team for a free site assessment and financial model.',
        'Solar', true, now() - interval '20 days', ${opsId}, now() - interval '22 days'
      ),
      (
        'Understanding HVAC Systems for Large Commercial Spaces',
        'hvac-large-commercial-spaces',
        'Choosing the right HVAC system is critical for occupant comfort and energy efficiency.',
        '## HVAC for Commercial Buildings\n\nA poorly designed HVAC system is one of the most expensive mistakes a building owner can make. This guide explains the key considerations.\n\n### System Types\n- **Chilled Water Systems** — ideal for buildings above 50,000 sq.ft.\n- **VRF/VRV Systems** — flexible zoning for mid-size offices.\n- **Packaged Rooftop Units** — economical for warehouses and retail.\n\n### Key Design Parameters\n- Occupancy density\n- Ventilation requirements (ASHRAE 62.1)\n- Local climate data\n- Integration with BMS\n\n### Common Mistakes\n1. Under-sizing equipment to save initial cost\n2. Ignoring humidity control\n3. Poor maintenance access planning\n\nAditya Constructions'' MEP team follows a detailed load calculation process for every project to ensure right-sized, energy-efficient systems.',
        'HVAC', true, now() - interval '10 days', ${engId}, now() - interval '12 days'
      ),
      (
        'Real Estate Investment Opportunities in Greater Noida 2025',
        'real-estate-investment-greater-noida-2025',
        'Why Greater Noida is emerging as the preferred destination for property investors.',
        '## Greater Noida: The Emerging Property Hub\n\nWith the Noida International Airport under construction and the Delhi-Mumbai Industrial Corridor passing nearby, Greater Noida is attracting institutional and retail investment alike.\n\n### Key Micro-Markets\n- **Yamuna Expressway** — fastest appreciating corridor\n- **Knowledge Park** — IT and institutional demand\n- **Greater Noida West** — affordable residential with metro connectivity\n\n### Price Trends\nResidential prices along Yamuna Expressway have risen 22% YoY as of Q1 2025, driven by airport-area speculation and genuine end-user demand.\n\n### Aditya Constructions Projects\nOur Sunrise Villas development on Yamaha Expressway offers pre-launch pricing with flexible payment plans.\n\nContact our real estate team for detailed project brochures.',
        'Real Estate', false, null, ${salesMgrId}, now() - interval '5 days'
      ),
      (
        'Careers in Construction: Why the Sector Offers Unparalleled Growth',
        'careers-in-construction-growth',
        'The Indian construction industry is projected to reach $1.4 trillion by 2030 — creating millions of skilled jobs.',
        '## A Career in Construction\n\nFew industries offer the tangible satisfaction of building something that will outlast you by decades. The Indian construction sector is also one of the fastest-growing employment generators.\n\n### In-Demand Roles\n- Civil & Structural Engineers\n- MEP Designers\n- Project Managers (PMP certified preferred)\n- BIM Technicians\n- Site Safety Officers\n\n### Aditya Constructions'' Culture\nWe invest heavily in safety training, technical upskilling, and leadership development. Our attrition rate is below 8% — a testament to our work environment.\n\n### How to Apply\nVisit our Careers page or email hr@adityaconstruction.com with your CV and the role you are targeting.',
        'Company', false, null, ${hrId}, now() - interval '2 days'
      )
  `;
  console.log("  ✓ blog_posts seeded");

  // ── 11. TESTIMONIALS ───────────────────────────────────────────────────────
  console.log("Seeding testimonials...");
  await sql`
    INSERT INTO public.testimonials (client_name, client_role, company, content, rating, published, project_id, created_at) VALUES
      ('Vikram Nair',       'Property Owner',           null,                          'Aditya Constructions delivered our Sector 78 apartment project on time and within budget. The quality of workmanship exceeded expectations — our architect was particularly impressed by the RCC detailing.',                                     5, true,  ${p1.id}, now() - interval '60 days'),
      ('Sunita Patel',      'Director',                 'SP Ventures',                 'The interior team transformed our villa into something straight out of a design magazine. Every detail was attended to. Would not hesitate to recommend Aditya for premium interiors.',                                                             5, true,  ${p3.id}, now() - interval '40 days'),
      ('Dr Anil Verma',     'CEO',                      'MedCore Hospitals',           'Our HVAC retrofit was handled professionally from design to commissioning. No disruption to hospital operations — which was our primary concern. Excellent project management.',                                                                    5, true,  null,     now() - interval '30 days'),
      ('Priya Malhotra',    'Facility Manager',         'GreenLeaf Industries',        'The 500 kW solar array has reduced our electricity bill by ₹4.2L per month. The installation team was professional and safety-conscious throughout.',                                                                                             4, true,  ${p5.id}, now() - interval '25 days'),
      ('Rajesh Aggarwal',   'Managing Director',        'Aggarwal Retail Group',       'Shoppers Hub HVAC installation is progressing well. The project manager keeps us informed weekly. Responsive team.',                                                                                                                              4, true,  ${p4.id}, now() - interval '20 days'),
      ('Meenakshi Reddy',   'Home Owner',               null,                          'We engaged Aditya Constructions for the interior fit-out of our 4BHK. The Italian marble work and modular kitchen turned out beautifully. Project was delivered three weeks ahead of schedule.',                                                  5, true,  null,     now() - interval '15 days'),
      ('Sanjay Chandra',    'VP Real Estate',           'Chandra Properties Ltd',      'Professional team, transparent billing, and zero compromises on quality. The Emerald Heights planning process has been thorough and well-communicated.',                                                                                           5, false, ${p6.id}, now() - interval '10 days'),
      ('Tanveer Ahmed',     'Operations Head',          'TechZone IT Park',            'Zen Office Interiors project is halfway through and looking fantastic. Love the open-plan concept the design team proposed.',                                                                                                                     4, false, ${p7.id}, now() - interval '5 days')
  `;
  console.log("  ✓ testimonials seeded");

  // ── 12. CONTACT MESSAGES ───────────────────────────────────────────────────
  console.log("Seeding contact_messages...");
  await sql`
    INSERT INTO public.contact_messages (name, email, phone, subject, message, handled, created_at) VALUES
      ('Ravi Kumar',        'ravi.k@gmail.com',          '+91-9876512345', 'New residential project inquiry', 'We are planning to construct a 3BHK house in Sector 12. Can we schedule a meeting?', true,  now() - interval '40 days'),
      ('Anita Sharma',      'anita.s@yahoo.com',          null,             'Interior design consultation',    'Looking for interior designers for our 2BHK apartment. Would like to see your portfolio.', true, now() - interval '35 days'),
      ('MegaBuild Corp',    'info@megabuild.co.in',       '+91-1124001200', 'Subcontractor tie-up proposal',   'We are a civil contractor looking to partner for MEP works. Please share your subcontractor onboarding process.', false, now() - interval '28 days'),
      ('Pooja Nair',        'pooja.n@outlook.com',        '+91-9711223344', 'Solar panel for home',            'Interested in a 5 kW rooftop solar system for our independent house. Please call us.', true, now() - interval '20 days'),
      ('Harish Chaudhary',  'harish.c@harish.biz',        '+91-9312234567', 'Commercial HVAC quotation',       'We are setting up a 60,000 sqft logistics centre and need a turnkey HVAC solution.', false, now() - interval '15 days'),
      ('Priti Singh',       'priti.singh@gmail.com',       null,             'Testimonial submission',          'Very happy with our villa interiors. Please do share how I can submit a review.', true, now() - interval '10 days'),
      ('Neeraj Mathur',     'neeraj.m@mathurgroup.in',    '+91-9801020304', 'Real estate joint development',   'We own 2 acres near Yamuna Expressway and wish to explore a joint development with Aditya Constructions.', false, now() - interval '5 days'),
      ('Shalini Roy',       'shalini.r@shalinidesigns.in', null,            'Career opportunity inquiry',      'I am an interior designer with 8 years experience. Are you hiring?', false, now() - interval '2 days')
  `;
  console.log("  ✓ contact_messages seeded");

  // ── 13. STAFF TASKS ────────────────────────────────────────────────────────
  console.log("Seeding staff_tasks...");
  await sql`
    INSERT INTO public.staff_tasks (title, description, assigned_to, assigned_by, status, due_date, created_at) VALUES
      ('Prepare Sector 78 monthly progress report', 'Compile site photos, milestone status, and material consumption for July report.', ${pmId},     ${opsId},    'in_progress', current_date + 3,  now() - interval '5 days'),
      ('Site safety audit — Omega Green Phase 1',  'Conduct safety audit per OSHA checklist. Submit form to HSE officer.', ${engId},     ${pmId},     'todo',        current_date + 7,  now() - interval '4 days'),
      ('Follow up on Ananya Kapoor quote',         'Send revised scope and timeline to Ananya Kapoor for hotel lobby project.', ${salesExId}, ${salesMgrId},'in_progress', current_date + 2,  now() - interval '3 days'),
      ('Reconcile April invoices',                 'Match vendor invoices for April with PO register and flag discrepancies.', ${acctId},    ${opsId},    'done',        current_date - 5,  now() - interval '10 days'),
      ('Update employee attendance for June',      'Enter June leave and attendance data into HR system.', ${hrId},       ${ownerId},  'done',        current_date - 10, now() - interval '15 days'),
      ('Source marble samples for Villa Aura 2',   'Collect samples from 3 approved vendors. Present to client by end of week.', ${engId},     ${pmId},     'in_progress', current_date + 1,  now() - interval '2 days'),
      ('LinkedIn campaign for Emerald Heights',    'Create 3 social media posts and schedule for next 2 weeks.', ${salesExId}, ${salesMgrId},'todo',        current_date + 5,  now() - interval '1 day'),
      ('Renew contractor insurance certificates',  'Collect updated insurance docs from 5 civil contractors.', ${hrId},       ${opsId},    'blocked',     current_date + 14, now() - interval '6 days'),
      ('Training: new BIM software walkthrough',   'Attend online BIM training and prepare summary for team.', ${engId},     ${pmId},     'todo',        current_date + 10, now() - interval '3 days'),
      ('Prepare salary slips for March',           'Generate and email salary slips for all staff for March payroll.', ${acctId},    ${hrId},     'done',        current_date - 20, now() - interval '25 days'),
      ('Site induction for new labour batch',      'Conduct 20-person labour induction session at Sector 78 site.', ${staffId},   ${engId},    'todo',        current_date + 2,  now() - interval '1 day'),
      ('Client walkthrough preparation',           'Set up display units and prepare presentation for Sunita Patel''s site visit.', ${pmId}, ${opsId},    'in_progress', current_date + 1,  now() - interval '2 days')
  `;
  console.log("  ✓ staff_tasks seeded");

  // ── 14. ATTENDANCE ─────────────────────────────────────────────────────────
  console.log("Seeding attendance (90 days)...");
  const staffUsers = [pmId, engId, salesExId, salesMgrId, supportId, acctId, hrId, staffId];
  const checkIns   = ['08:30', '08:45', '09:00', '09:15', '08:00'];
  const checkOuts  = ['17:30', '17:45', '18:00', '18:30', '19:00'];
  const attendanceBatch = [];
  for (let d = 90; d >= 1; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    const dateStr = date.toISOString().split('T')[0];
    for (const uid of staffUsers) {
      if (Math.random() < 0.08) continue; // ~8% absence
      attendanceBatch.push({ user_id: uid, date: dateStr,
        check_in:  checkIns[Math.floor(Math.random() * checkIns.length)],
        check_out: checkOuts[Math.floor(Math.random() * checkOuts.length)],
      });
    }
  }
  // Insert in chunks
  for (let i = 0; i < attendanceBatch.length; i += 50) {
    const chunk = attendanceBatch.slice(i, i + 50);
    for (const row of chunk) {
      await sql`
        INSERT INTO public.attendance (user_id, date, check_in, check_out)
        VALUES (${row.user_id}, ${row.date}, ${row.check_in}, ${row.check_out})
        ON CONFLICT (user_id, date) DO NOTHING
      `;
    }
  }
  console.log(`  ✓ attendance seeded (${attendanceBatch.length} records)`);

  // ── 15. STAFF SALARIES ─────────────────────────────────────────────────────
  console.log("Seeding staff_salaries...");
  const salaryConfig = [
    { uid: pmId,      amount: 95000 },
    { uid: engId,     amount: 72000 },
    { uid: salesExId, amount: 58000 },
    { uid: salesMgrId,amount: 88000 },
    { uid: supportId, amount: 52000 },
    { uid: acctId,    amount: 68000 },
    { uid: hrId,      amount: 75000 },
    { uid: staffId,   amount: 32000 },
    { uid: opsId,     amount: 110000 },
  ];
  const months = ['2025-01','2025-02','2025-03','2025-04','2025-05','2025-06','2025-07'];
  for (const { uid, amount } of salaryConfig) {
    for (const month of months) {
      const status = month < '2025-07' ? 'paid' : 'pending';
      await sql`
        INSERT INTO public.staff_salaries (staff_user_id, period_month, amount, status)
        VALUES (${uid}, ${month}, ${amount}, ${status})
        ON CONFLICT (staff_user_id, period_month) DO NOTHING
      `;
    }
  }
  console.log("  ✓ staff_salaries seeded");

  // ── 16. STAFF LEAVES ───────────────────────────────────────────────────────
  console.log("Seeding staff_leaves...");
  await sql`
    INSERT INTO public.staff_leaves (staff_user_id, from_date, to_date, leave_type, reason, status, created_at) VALUES
      (${engId},     '2025-04-14', '2025-04-16', 'casual',    'Family function in hometown.',            'approved', now() - interval '90 days'),
      (${salesExId}, '2025-05-01', '2025-05-02', 'sick',      'Viral fever — doctor certificate attached.', 'approved', now() - interval '75 days'),
      (${hrId},      '2025-06-09', '2025-06-13', 'privilege', 'Annual vacation.',                        'approved', now() - interval '60 days'),
      (${staffId},   '2025-06-20', '2025-06-20', 'casual',    'Personal work.',                          'approved', now() - interval '50 days'),
      (${pmId},      '2025-07-04', '2025-07-05', 'sick',      'Fever and body ache.',                   'pending',  now() - interval '17 days'),
      (${acctId},    '2025-07-14', '2025-07-18', 'privilege', 'Planned vacation with family.',           'pending',  now() - interval '10 days'),
      (${engId},     '2025-08-11', '2025-08-15', 'privilege', 'Independence Day week vacation.',         'pending',  now() - interval '5 days'),
      (${supportId}, '2025-08-01', '2025-08-01', 'casual',    'Attending sibling''s graduation ceremony.','pending', now() - interval '3 days')
  `;
  console.log("  ✓ staff_leaves seeded");

  // ── 17. AUDIT LOGS ─────────────────────────────────────────────────────────
  console.log("Seeding audit_logs...");
  await sql`
    INSERT INTO public.audit_logs (actor_id, actor_email, action, target_type, target_id, target_email, metadata, created_at) VALUES
      (${ownerId}, 'owner@adityaconstruction.com',        'user_created',        'user', ${opsId},      'operations@adityaconstruction.com',   '{"role":"operations_manager"}', now() - interval '180 days'),
      (${ownerId}, 'owner@adityaconstruction.com',        'user_created',        'user', ${hrId},       'rahul.sharma@adityaconstruction.com', '{"role":"hr_manager"}', now() - interval '179 days'),
      (${ownerId}, 'owner@adityaconstruction.com',        'user_created',        'user', ${pmId},       'priya.gupta@adityaconstruction.com',  '{"role":"project_manager"}', now() - interval '178 days'),
      (${ownerId}, 'owner@adityaconstruction.com',        'user_created',        'user', ${engId},      'amit.singh@adityaconstruction.com',   '{"role":"site_engineer"}', now() - interval '177 days'),
      (${opsId},   'operations@adityaconstruction.com',   'project_created',     'project', ${p1.id},   null,                                  '{"title":"Sector 78 Residential Complex"}', now() - interval '150 days'),
      (${opsId},   'operations@adityaconstruction.com',   'project_created',     'project', ${p2.id},   null,                                  '{"title":"Omega Green Office Park"}', now() - interval '120 days'),
      (${ownerId}, 'owner@adityaconstruction.com',        'role_changed',        'user', ${salesMgrId}, 'deepak.joshi@adityaconstruction.com', '{"new_role":"sales_manager","old_role":"sales_executive"}', now() - interval '90 days'),
      (${pmId},    'priya.gupta@adityaconstruction.com',  'milestone_completed', 'project', ${p1.id},   null,                                  '{"milestone":"Foundation & Piling"}', now() - interval '60 days'),
      (${pmId},    'priya.gupta@adityaconstruction.com',  'milestone_completed', 'project', ${p3.id},   null,                                  '{"milestone":"Snagging & Handover"}', now() - interval '45 days'),
      (${opsId},   'operations@adityaconstruction.com',   'quote_status_changed','quote', null,         'ramesh.t@tiwarigroup.com',            '{"status":"quoted"}', now() - interval '20 days'),
      (${acctId},  'arjun.mehta@adityaconstruction.com',  'salary_processed',    'payroll', null,       null,                                  '{"month":"2025-06","total_staff":9}', now() - interval '15 days'),
      (${hrId},    'rahul.sharma@adityaconstruction.com', 'leave_approved',      'user', ${engId},      'amit.singh@adityaconstruction.com',   '{"leave_type":"casual","dates":"2025-04-14 to 2025-04-16"}', now() - interval '88 days'),
      (${ownerId}, 'owner@adityaconstruction.com',        'user_created',        'user', ${acctId},     'arjun.mehta@adityaconstruction.com',  '{"role":"accountant"}', now() - interval '176 days'),
      (${supportId},'kavya.nair@adityaconstruction.com',  'ticket_resolved',     'ticket', ${t3.id},    'customer1@example.com',               '{"subject":"Invoice query"}', now() - interval '15 days'),
      (${opsId},   'operations@adityaconstruction.com',   'permissions_updated', 'system', null,        null,                                  '{"roles_updated":["sales_executive","site_engineer"]}', now() - interval '10 days')
  `;
  console.log("  ✓ audit_logs seeded");

  // ── 18. USER SESSIONS ──────────────────────────────────────────────────────
  console.log("Seeding user_sessions...");
  const sessionUsers = [ownerId, opsId, pmId, engId, salesMgrId, salesExId, hrId, acctId, supportId, cust1Id, cust2Id];
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/Safari',
    'Mozilla/5.0 (Linux; Android 14) Chrome/124 Mobile',
  ];
  for (const uid of sessionUsers) {
    for (let s = 0; s < 3; s++) {
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const device = agent.includes('iPhone') || agent.includes('Android') ? 'mobile' : 'desktop';
      await sql`
        INSERT INTO public.user_sessions (user_id, user_agent, device_type, created_at, last_seen, is_active)
        VALUES (${uid}, ${agent}, ${device}, now() - (${daysAgo} || ' days')::interval, now() - (${daysAgo - 1} || ' days')::interval, ${s === 0})
      `;
    }
  }
  console.log("  ✓ user_sessions seeded");

  // ── 19. IMPERSONATION LOG ──────────────────────────────────────────────────
  console.log("Seeding impersonation_log...");
  await sql`
    INSERT INTO public.impersonation_log (impersonator_id, target_user_id, started_at, ended_at) VALUES
      (${ownerId}, ${pmId},      now() - interval '45 days', now() - interval '45 days' + interval '25 minutes'),
      (${ownerId}, ${cust1Id},   now() - interval '30 days', now() - interval '30 days' + interval '10 minutes'),
      (${ownerId}, ${supportId}, now() - interval '20 days', now() - interval '20 days' + interval '15 minutes'),
      (${ownerId}, ${cust2Id},   now() - interval '7 days',  null)
  `;
  console.log("  ✓ impersonation_log seeded");

  // ── FINAL COUNT ────────────────────────────────────────────────────────────
  console.log("\n── TABLE ROW COUNTS ──────────────────────────────────────────");
  const tables = [
    'users','profiles','user_roles','role_permissions','leads','quote_requests',
    'projects','project_milestones','project_updates','tickets','ticket_messages',
    'testimonials','blog_posts','contact_messages','staff_tasks','attendance',
    'staff_salaries','staff_leaves','audit_logs','user_sessions','impersonation_log',
  ];
  for (const t of tables) {
    const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM public.${sql(t)}`;
    console.log(`  ${t.padEnd(25)} ${count}`);
  }

  await sql.end();
  console.log("\n✅ Seed complete.");
}

main().catch(err => { console.error(err); process.exit(1); });
