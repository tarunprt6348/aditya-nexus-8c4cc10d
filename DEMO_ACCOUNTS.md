# Demo Accounts — Aditya Constructions

All demo accounts use the same password: **`Demo_Lost.experts.reassigned`**

Run `node scripts/seed.mjs` on any fresh Replit PostgreSQL database to create these accounts and all demo data. The script is idempotent — safe to re-run.

---

## Account List

| # | Email | Role | Full Name | Area |
|---|-------|------|-----------|------|
| 1 | owner@adityaconstruction.com | owner | Aditya Kumar | Admin |
| 2 | operations@adityaconstruction.com | operations_manager | Raj Sharma | Admin |
| 3 | rahul.sharma@adityaconstruction.com | hr_manager | Rahul Sharma | Admin |
| 4 | priya.gupta@adityaconstruction.com | project_manager | Priya Gupta | Staff |
| 5 | amit.singh@adityaconstruction.com | site_engineer | Amit Singh | Staff |
| 6 | neha.verma@adityaconstruction.com | sales_executive | Neha Verma | Staff |
| 7 | deepak.joshi@adityaconstruction.com | sales_manager | Deepak Joshi | Admin |
| 8 | kavya.nair@adityaconstruction.com | customer_support | Kavya Nair | Staff |
| 9 | arjun.mehta@adityaconstruction.com | accountant | Arjun Mehta | Admin |
| 10 | kiran.reddy@adityaconstruction.com | general_staff | Kiran Reddy | Staff |
| 11 | customer1@example.com | customer | Vikram Nair | Portal |
| 12 | customer2@example.com | customer | Sunita Patel | Portal |

---

## Re-seeding a Fresh Database

```bash
# 1. Apply schema (idempotent)
psql "$DATABASE_URL" -f scripts/schema_replit.sql

# 2. Seed demo accounts and data (idempotent)
node scripts/seed.mjs
```

---

## Route Access by Role

| Area | URL | Roles |
|------|-----|-------|
| Admin dashboard | `/admin` | owner, admin, operations_manager, hr_manager, sales_manager, accountant, managing_director, marketing_manager |
| Staff portal | `/staff` | sales_executive, project_manager, site_engineer, customer_support, general_staff, staff |
| Customer portal | `/portal` | customer |

---

> **No Supabase dependency.** Authentication uses bcrypt + JWT stored in localStorage.
> Passwords are hashed with bcrypt (cost factor 12). No plaintext passwords are stored.
