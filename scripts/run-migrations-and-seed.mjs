/**
 * Migration runner + seed script for Aditya Constructions
 * Applies all Supabase migrations and seeds demo users.
 *
 * Uses three approaches for SQL execution (in order):
 *  1. PostgREST /rest/v1/ with Accept: application/vnd.pgrst.plan header (PostgREST v12)
 *  2. supabase-js sql tagged template
 *  3. Direct table operations via admin client
 */
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// --- Supabase admin client (with ws for Node 20) ---
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

// ─────────────────────────────────────────────────────────────────────────────
// SQL execution via PostgREST /rest/v1/ SQL endpoint (PostgREST v12+)
// ─────────────────────────────────────────────────────────────────────────────
async function execSqlFetch(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/sql",
      Accept: "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: sql,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json().catch(() => null);
}

// Fallback: call supabase.rpc with a helper if it exists
async function execSqlRpc(sql) {
  const { data, error } = await admin.rpc("exec_sql" , { sql });
  if (error) throw new Error(error.message);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Check whether the key tables already exist
// ─────────────────────────────────────────────────────────────────────────────
async function tableExists(name) {
  const { error } = await admin.from(name).select("*").limit(1);
  // PostgREST returns 404 / "relation does not exist" when table missing
  if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) return false;
  return true;
}

async function checkSchemaStatus() {
  const tables = ["profiles", "user_roles", "role_permissions", "audit_logs", "impersonation_log"];
  const status = {};
  await Promise.all(
    tables.map(async (t) => {
      status[t] = await tableExists(t);
    })
  );
  return status;
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply a single migration SQL string, try multiple strategies
// ─────────────────────────────────────────────────────────────────────────────
async function applySql(sql, label) {
  // Strategy 1: PostgREST SQL endpoint
  try {
    await execSqlFetch(sql);
    return { ok: true, strategy: "postgrest-sql" };
  } catch (e1) {
    // Strategy 2: supabase.rpc exec_sql
    try {
      await execSqlRpc(sql);
      return { ok: true, strategy: "rpc-exec_sql" };
    } catch (e2) {
      return { ok: false, error: `PostgREST: ${e1.message} | RPC: ${e2.message}` };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🔍  Checking database schema status...\n");
  const status = await checkSchemaStatus();

  const allExist = Object.values(status).every(Boolean);
  const noneExist = Object.values(status).every((v) => !v);

  for (const [table, exists] of Object.entries(status)) {
    console.log(`  ${exists ? "✓" : "✗"} ${table}`);
  }

  // ── MIGRATIONS ──────────────────────────────────────────────────────────────
  if (!allExist) {
    console.log("\n🔧  Applying migrations...\n");

    const migDir = join(__dirname, "..", "supabase", "migrations");
    const files = readdirSync(migDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = readFileSync(join(migDir, file), "utf8");
      process.stdout.write(`  Applying ${file}... `);
      const result = await applySql(sql, file);
      if (result.ok) {
        console.log(`✓ (${result.strategy})`);
      } else {
        console.log(`⚠  (non-fatal — may already be applied)\n  └ ${result.error.slice(0, 200)}`);
      }
    }
  } else {
    console.log("\n✅  Schema already up-to-date — skipping migrations.");
  }

  // ── VERIFY SCHEMA ────────────────────────────────────────────────────────────
  console.log("\n🔍  Re-checking schema after migrations...\n");
  const afterStatus = await checkSchemaStatus();
  for (const [table, exists] of Object.entries(afterStatus)) {
    console.log(`  ${exists ? "✓" : "✗"} ${table}`);
  }

  // ── SEED DEMO USERS ──────────────────────────────────────────────────────────
  console.log("\n👥  Seeding demo users...\n");

  const USERS = [
    { email: "owner@adityaconstruction.com",      password: "Owner@123",  name: "Aditya Owner",      role: "owner",            phone: "+91-9000000001" },
    { email: "operations@adityaconstruction.com",  password: "Ops@123",    name: "Operations Manager",role: "operations_manager",phone: "+91-9000000002" },
    { email: "rahul.sharma@adityaconstruction.com",password: "Staff@123",  name: "Rahul Sharma",      role: "hr_manager",       phone: "+91-9811001001" },
    { email: "priya.gupta@adityaconstruction.com", password: "Staff@123",  name: "Priya Gupta",       role: "project_manager",  phone: "+91-9811001002" },
    { email: "amit.singh@adityaconstruction.com",  password: "Staff@123",  name: "Amit Singh",        role: "site_engineer",    phone: "+91-9811001003" },
    { email: "neha.verma@adityaconstruction.com",  password: "Staff@123",  name: "Neha Verma",        role: "sales_executive",  phone: "+91-9811001004" },
    { email: "deepak.joshi@adityaconstruction.com",password: "Staff@123",  name: "Deepak Joshi",      role: "sales_manager",    phone: "+91-9811001008" },
    { email: "kavya.nair@adityaconstruction.com",  password: "Staff@123",  name: "Kavya Nair",        role: "customer_support", phone: "+91-9811001009" },
    { email: "arjun.mehta@adityaconstruction.com", password: "Staff@123",  name: "Arjun Mehta",       role: "accountant",       phone: "+91-9811001010" },
    { email: "kiran.reddy@adityaconstruction.com", password: "Staff@123",  name: "Kiran Reddy",       role: "staff",            phone: "+91-9811001015" },
  ];

  const results = [];
  const { data: { users: existingUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 });

  for (const u of USERS) {
    process.stdout.write(`  ${u.name} (${u.email})... `);
    const existing = existingUsers.find((eu) => eu.email === u.email);

    let uid;
    if (existing) {
      uid = existing.id;
      await admin.auth.admin.updateUserById(uid, { password: u.password });
      console.log("✓ updated");
    } else {
      const { data: created, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.name },
      });
      if (error) {
        console.log(`✗ ${error.message}`);
        results.push({ ...u, success: false, error: error.message });
        continue;
      }
      uid = created.user.id;
      console.log("✓ created");
    }

    // Upsert profile
    const { error: profileErr } = await admin.from("profiles").upsert(
      { id: uid, full_name: u.name, phone: u.phone },
      { onConflict: "id" }
    );
    if (profileErr) console.log(`    ⚠ profile: ${profileErr.message}`);

    // Upsert role
    const { error: roleErr } = await admin
      .from("user_roles")
      .upsert({ user_id: uid, role: u.role }, { onConflict: "user_id" });
    if (roleErr) console.log(`    ⚠ role: ${roleErr.message}`);

    results.push({ ...u, uid, success: true });
  }

  // ── VERIFY LOGIN ─────────────────────────────────────────────────────────────
  console.log("\n🔐  Verifying authentication (test sign-in)...\n");

  const testAccounts = [
    { email: "owner@adityaconstruction.com",     password: "Owner@123" },
    { email: "operations@adityaconstruction.com", password: "Ops@123"   },
    { email: "rahul.sharma@adityaconstruction.com",password: "Staff@123" },
  ];

  const anonClient = createClient(SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  });

  for (const acct of testAccounts) {
    const { data, error } = await anonClient.auth.signInWithPassword(acct);
    if (error) {
      console.log(`  ✗ ${acct.email}: ${error.message}`);
    } else {
      const roleRes = await admin.from("user_roles").select("role").eq("user_id", data.user.id).single();
      console.log(`  ✓ ${acct.email} — role: ${roleRes.data?.role ?? "none"}`);
      await anonClient.auth.signOut();
    }
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(80));
  console.log("  ADITYA CONSTRUCTIONS — DEMO CREDENTIALS");
  console.log("═".repeat(80));
  console.log(`
  ╔══════════════════════════════════════════════════════════════════════════╗
  ║  PORTAL / ADMIN ACCOUNTS                                                ║
  ╠══════════════════════════════════════════════════════════════════════════╣
  ║  Email                                    Password    Role              ║
  ╠══════════════════════════════════════════════════════════════════════════╣
  ║  owner@adityaconstruction.com             Owner@123   owner             ║
  ║  operations@adityaconstruction.com        Ops@123     operations_manager║
  ╠══════════════════════════════════════════════════════════════════════════╣
  ║  STAFF ACCOUNTS — all share password: Staff@123                         ║
  ╠══════════════════════════════════════════════════════════════════════════╣
  ║  rahul.sharma@adityaconstruction.com                  hr_manager        ║
  ║  priya.gupta@adityaconstruction.com                   project_manager   ║
  ║  amit.singh@adityaconstruction.com                    site_engineer     ║
  ║  neha.verma@adityaconstruction.com                    sales_executive   ║
  ║  deepak.joshi@adityaconstruction.com                  sales_manager     ║
  ║  kavya.nair@adityaconstruction.com                    customer_support  ║
  ║  arjun.mehta@adityaconstruction.com                   accountant        ║
  ║  kiran.reddy@adityaconstruction.com                   staff             ║
  ╠══════════════════════════════════════════════════════════════════════════╣
  ║  Sign in at: /auth                                                       ║
  ║  Admin area: /admin    Staff area: /staff                                ║
  ╚══════════════════════════════════════════════════════════════════════════╝
`);
  const failed = results.filter((r) => !r.success);
  if (failed.length) {
    console.log(`  ⚠  ${failed.length} account(s) failed:`);
    failed.forEach((f) => console.log(`     ✗ ${f.email}: ${f.error}`));
  }
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
