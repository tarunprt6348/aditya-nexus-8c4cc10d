---
name: Supabase schema column names
description: Actual column names in the Supabase DB that differ from what code might assume
---

## Profiles table
Has: `id`, `full_name`, `phone`, `avatar_url`, `company`, `created_at`, `updated_at`
Does NOT have: `email` (email lives in Supabase Auth only), `department`, `status`, `last_seen`

**How to apply:** Never query `email` from `profiles`. Get it from `supabase.auth.getUser()` or Auth admin API server-side.

## Projects table
Column is `title`, not `name`.

## Leads table
Service column is `service` (enum: service_type), not `service_interest`.

## Blog posts table
Uses `published` (boolean), not `status` string. Filter with `.eq("published", true/false)`.

## Testimonials table
Column is `client_name`, not `name`. No `company` column — has `client_role` instead.

## Untyped tables (use `as never` casts)
These tables exist in the DB but are NOT in `src/integrations/supabase/types.ts`:
- `audit_logs` — has actor_id, actor_email, action, target_type, target_id, target_email, metadata
- `impersonation_log` — has impersonator_id, target_user_id, ended_at
- `role_permissions` — has role, module, allowed
- `user_sessions` — has user_id, user_agent, device_type, created_at, last_seen, is_active

For these, use: `.from("table_name" as never).insert({...} as never)` — cast BOTH the table name AND the object.
