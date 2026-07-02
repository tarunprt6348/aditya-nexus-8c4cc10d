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
All Supabase public keys are committed in `.env` and mirrored in `.replit` `[userenv]`. If you need the Supabase **service role key** or **OpenAI API key**, add them as Replit Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`).

## Key directories
- `src/routes/` — all pages (file-based routing via TanStack Router)
- `src/routes/admin/` — admin dashboard (auth-protected)
- `src/components/` — shared UI components
- `server/` — server-side API handlers and Replit integration files
- `supabase/` — Supabase config and migration scripts
- `scripts/` — DB seed SQL

## User preferences
