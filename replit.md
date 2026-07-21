# Aditya Constructions — TanStack Start App

A full-stack marketing and admin portal for **Aditya Constructions** (Greater Noida), covering construction, interiors, real estate, HVAC, and solar services.

## Stack
- **Framework:** TanStack Start (SSR) + TanStack Router + TanStack Query
- **Frontend:** React 19, Tailwind CSS v4, Radix UI / shadcn-style components
- **Backend/DB:** Supabase (PostgreSQL + Auth)
- **AI:** Vercel AI SDK + OpenAI
- **Bundler:** Vite 6

## How to run
```
npm install
npm run dev   # starts on port 5000
```

The workflow "Start application" runs `npm run dev` and serves the app on port 5000.

## Environment variables
- `DATABASE_URL` — provided automatically by Replit PostgreSQL (do NOT hardcode)
- `SESSION_SECRET` — set as a Replit Secret; used for JWT signing
- `OPENAI_API_KEY` — set as a Replit Secret to enable the "Ask Aditya" AI assistant
- The `.env` file contains Supabase public keys left over from the original project; they are **not used** by the application (all data is in Replit PostgreSQL)

## Database
Replit PostgreSQL. To initialise a fresh database:
```bash
psql "$DATABASE_URL" -f scripts/schema_replit.sql   # apply schema (idempotent)
node scripts/seed.mjs                                # seed demo accounts + data (idempotent)
```
See `DEMO_ACCOUNTS.md` for all demo login credentials. Password: `Demo_Lost.experts.reassigned`

## Key directories
- `src/routes/` — all pages (file-based routing via TanStack Router)
- `src/routes/admin/` — admin dashboard (auth-protected)
- `src/components/` — shared UI components
- `server/` — server-side API handlers and Replit integration files
- `supabase/` — Supabase config and migration scripts
- `scripts/` — DB seed SQL

## User preferences
