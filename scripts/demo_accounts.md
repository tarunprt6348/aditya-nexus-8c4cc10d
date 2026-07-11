# Demo Accounts — Aditya Constructions

## Overview

These are the 12 demo accounts for the application. Auth users **cannot** be
created via SQL — they must be created through the Supabase Auth Admin API.

Once created, the `handle_new_user` trigger automatically creates a profile row
and assigns a temporary `customer` role. Run `seed_demo_data.sql` afterwards to
upgrade roles and populate all business data.

---

## Account List

| # | Email | Password | Role | Full Name |
|---|-------|----------|------|-----------|
| 1 | owner@adityaconstruction.com | Demo@1234! | owner | Aditya Kumar |
| 2 | operations@adityaconstruction.com | Demo@1234! | operations_manager | Raj Sharma |
| 3 | rahul.sharma@adityaconstruction.com | Demo@1234! | hr_manager | Rahul Sharma |
| 4 | priya.gupta@adityaconstruction.com | Demo@1234! | project_manager | Priya Gupta |
| 5 | amit.singh@adityaconstruction.com | Demo@1234! | site_engineer | Amit Singh |
| 6 | neha.verma@adityaconstruction.com | Demo@1234! | sales_executive | Neha Verma |
| 7 | deepak.joshi@adityaconstruction.com | Demo@1234! | sales_manager | Deepak Joshi |
| 8 | kavya.nair@adityaconstruction.com | Demo@1234! | customer_support | Kavya Nair |
| 9 | arjun.mehta@adityaconstruction.com | Demo@1234! | accountant | Arjun Mehta |
| 10 | kiran.reddy@adityaconstruction.com | Demo@1234! | staff | Kiran Reddy |
| 11 | customer1@example.com | Demo@1234! | customer | Vikram Nair |
| 12 | customer2@example.com | Demo@1234! | customer | Sunita Patel |

---

## Creation Script (Node.js — Supabase Admin API)

Save this as `scripts/create-demo-accounts.mjs` and run it once against your
Supabase project. Requires the **service role key** (not the anon key).

```javascript
// scripts/create-demo-accounts.mjs
// Usage: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/create-demo-accounts.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const accounts = [
  { email: 'owner@adityaconstruction.com',       password: 'Demo@1234!', full_name: 'Aditya Kumar' },
  { email: 'operations@adityaconstruction.com',  password: 'Demo@1234!', full_name: 'Raj Sharma' },
  { email: 'rahul.sharma@adityaconstruction.com',password: 'Demo@1234!', full_name: 'Rahul Sharma' },
  { email: 'priya.gupta@adityaconstruction.com', password: 'Demo@1234!', full_name: 'Priya Gupta' },
  { email: 'amit.singh@adityaconstruction.com',  password: 'Demo@1234!', full_name: 'Amit Singh' },
  { email: 'neha.verma@adityaconstruction.com',  password: 'Demo@1234!', full_name: 'Neha Verma' },
  { email: 'deepak.joshi@adityaconstruction.com',password: 'Demo@1234!', full_name: 'Deepak Joshi' },
  { email: 'kavya.nair@adityaconstruction.com',  password: 'Demo@1234!', full_name: 'Kavya Nair' },
  { email: 'arjun.mehta@adityaconstruction.com', password: 'Demo@1234!', full_name: 'Arjun Mehta' },
  { email: 'kiran.reddy@adityaconstruction.com', password: 'Demo@1234!', full_name: 'Kiran Reddy' },
  { email: 'customer1@example.com',              password: 'Demo@1234!', full_name: 'Vikram Nair' },
  { email: 'customer2@example.com',              password: 'Demo@1234!', full_name: 'Sunita Patel' },
];

for (const account of accounts) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,           // skip email verification
    user_metadata: { full_name: account.full_name }
  });

  if (error) {
    if (error.message?.includes('already been registered')) {
      console.log(`SKIP  ${account.email} — already exists`);
    } else {
      console.error(`ERROR ${account.email}: ${error.message}`);
    }
  } else {
    console.log(`OK    ${account.email} — id: ${data.user.id}`);
  }
}

console.log('\nDone. Now run seed_demo_data.sql in the Supabase SQL editor.');
```

### Running the script on Replit

The SUPABASE_SERVICE_ROLE_KEY must be set as a Replit Secret (not in `.env`).
Once it is available:

```bash
node scripts/create-demo-accounts.mjs
```

---

## Deployment Order

Run these three steps in order on a fresh Supabase project:

1. **Apply schema**
   Supabase Dashboard → SQL Editor → New Query → paste `scripts/schema_clean.sql` → Run

2. **Create auth accounts**
   ```bash
   node scripts/create-demo-accounts.mjs
   ```
   This creates all 12 auth users and triggers `handle_new_user` to auto-create
   their profile rows with a default `customer` role.

3. **Seed business data**
   Supabase Dashboard → SQL Editor → New Query → paste `scripts/seed_demo_data.sql` → Run
   This upgrades roles to the correct enterprise roles and inserts all demo data.

---

## Verification

After running all three steps, execute this query in the SQL editor:

```sql
SELECT
  p.email,
  p.full_name,
  p.department,
  ur.role,
  p.status
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
ORDER BY ur.role, p.email;
```

Expected result: 12 rows, each with a non-null role matching the table above.
