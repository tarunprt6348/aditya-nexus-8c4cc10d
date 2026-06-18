/**
 * Demo user seed script for Aditya Constructions
 * Run: node scripts/seed-demo-users.mjs
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS = [
  // ── Portals ──────────────────────────────────────────────────────────────
  {
    email: "owner@adityaconstruction.com",
    password: "Owner@123",
    name: "Aditya Owner",
    role: "owner",
    department: "Executive",
    phone: "+91-9000000001",
  },
  {
    email: "operations@adityaconstruction.com",
    password: "Ops@123",
    name: "Operations Manager",
    role: "operations_manager",
    department: "Operations",
    phone: "+91-9000000002",
  },

  // ── Staff (15 accounts) ──────────────────────────────────────────────────
  {
    email: "rahul.sharma@adityaconstruction.com",
    password: "Staff@123",
    name: "Rahul Sharma",
    role: "hr_manager",
    department: "Human Resources",
    phone: "+91-9811001001",
  },
  {
    email: "priya.gupta@adityaconstruction.com",
    password: "Staff@123",
    name: "Priya Gupta",
    role: "project_manager",
    department: "Projects",
    phone: "+91-9811001002",
  },
  {
    email: "amit.singh@adityaconstruction.com",
    password: "Staff@123",
    name: "Amit Singh",
    role: "site_engineer",
    department: "Construction",
    phone: "+91-9811001003",
  },
  {
    email: "neha.verma@adityaconstruction.com",
    password: "Staff@123",
    name: "Neha Verma",
    role: "sales_executive",
    department: "Sales",
    phone: "+91-9811001004",
  },
  {
    email: "vikram.patel@adityaconstruction.com",
    password: "Staff@123",
    name: "Vikram Patel",
    role: "general_staff",
    department: "Interiors",
    phone: "+91-9811001005",
  },
  {
    email: "ananya.rao@adityaconstruction.com",
    password: "Staff@123",
    name: "Ananya Rao",
    role: "general_staff",
    department: "HVAC",
    phone: "+91-9811001006",
  },
  {
    email: "suresh.kumar@adityaconstruction.com",
    password: "Staff@123",
    name: "Suresh Kumar",
    role: "general_staff",
    department: "Solar",
    phone: "+91-9811001007",
  },
  {
    email: "deepak.joshi@adityaconstruction.com",
    password: "Staff@123",
    name: "Deepak Joshi",
    role: "sales_manager",
    department: "Sales",
    phone: "+91-9811001008",
  },
  {
    email: "kavya.nair@adityaconstruction.com",
    password: "Staff@123",
    name: "Kavya Nair",
    role: "customer_support",
    department: "Support",
    phone: "+91-9811001009",
  },
  {
    email: "arjun.mehta@adityaconstruction.com",
    password: "Staff@123",
    name: "Arjun Mehta",
    role: "accountant",
    department: "Finance",
    phone: "+91-9811001010",
  },
  {
    email: "pooja.sharma@adityaconstruction.com",
    password: "Staff@123",
    name: "Pooja Sharma",
    role: "marketing_manager",
    department: "Marketing",
    phone: "+91-9811001011",
  },
  {
    email: "rohit.agarwal@adityaconstruction.com",
    password: "Staff@123",
    name: "Rohit Agarwal",
    role: "site_engineer",
    department: "Construction",
    phone: "+91-9811001012",
  },
  {
    email: "sanjay.tiwari@adityaconstruction.com",
    password: "Staff@123",
    name: "Sanjay Tiwari",
    role: "project_manager",
    department: "Projects",
    phone: "+91-9811001013",
  },
  {
    email: "meena.patel@adityaconstruction.com",
    password: "Staff@123",
    name: "Meena Patel",
    role: "sales_executive",
    department: "Real Estate",
    phone: "+91-9811001014",
  },
  {
    email: "kiran.reddy@adityaconstruction.com",
    password: "Staff@123",
    name: "Kiran Reddy",
    role: "staff",
    department: "General",
    phone: "+91-9811001015",
  },
];

async function seed() {
  console.log(`\n🚀 Seeding ${USERS.length} demo users into Aditya Constructions...\n`);
  const results = [];

  for (const u of USERS) {
    process.stdout.write(`  Creating ${u.name} (${u.email})… `);

    // 1. Check if user already exists
    const { data: existing } = await admin.auth.admin.listUsers();
    const alreadyExists = existing?.users?.find((eu) => eu.email === u.email);

    let uid;
    if (alreadyExists) {
      uid = alreadyExists.id;
      // Update password in case it changed
      await admin.auth.admin.updateUserById(uid, { password: u.password });
      console.log("✓ updated (already existed)");
    } else {
      // 2. Create auth user with password
      const { data: created, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.name },
      });
      if (error) {
        console.log(`✗ ERROR: ${error.message}`);
        results.push({ ...u, success: false, error: error.message });
        continue;
      }
      uid = created.user.id;
      console.log("✓ created");
    }

    // 3. Upsert profile
    await admin.from("profiles").upsert(
      {
        id: uid,
        full_name: u.name,
        phone: u.phone,
      },
      { onConflict: "id" },
    );

    // 4. Assign role (upsert to avoid duplicates)
    await admin
      .from("user_roles")
      .upsert({ user_id: uid, role: u.role }, { onConflict: "user_id" });

    results.push({ ...u, uid, success: true });
  }

  // Print summary table
  console.log("\n" + "═".repeat(80));
  console.log("  ADITYA CONSTRUCTIONS — DEMO CREDENTIALS SUMMARY");
  console.log("═".repeat(80));

  const portals = results.filter((r) => ["owner", "operations_manager"].includes(r.role));
  const staff = results.filter((r) => !["owner", "operations_manager"].includes(r.role));

  console.log("\n  ── PORTAL ACCOUNTS ──────────────────────────────────────────────────────");
  console.log(`  ${"Email".padEnd(45)} ${"Password".padEnd(12)} Role`);
  console.log("  " + "─".repeat(76));
  for (const u of portals) {
    const portal = u.role === "owner" ? "Owner / Authorizer Portal" : "Operations Portal";
    console.log(`  ${u.email.padEnd(45)} ${u.password.padEnd(12)} ${portal}`);
  }

  console.log("\n  ── STAFF ACCOUNTS (all share: password Staff@123) ──────────────────────");
  console.log(`  ${"Email".padEnd(45)} ${"Name".padEnd(22)} Role`);
  console.log("  " + "─".repeat(76));
  for (const u of staff) {
    console.log(`  ${u.email.padEnd(45)} ${u.name.padEnd(22)} ${u.role}`);
  }

  const failed = results.filter((r) => !r.success);
  if (failed.length > 0) {
    console.log(`\n  ⚠ ${failed.length} account(s) failed to create.`);
    failed.forEach((f) => console.log(`    ✗ ${f.email}: ${f.error}`));
  }

  console.log("\n  ── SIGN IN URL ─────────────────────────────────────────────────────────");
  console.log(`  https://${process.env.REPLIT_DEV_DOMAIN ?? "your-app.replit.app"}/auth`);
  console.log("\n  Operations portal: /admin  |  Staff portal: /staff");
  console.log("═".repeat(80) + "\n");
}

seed().catch(console.error);
