## Plan: Restore Index Route + Build Admin/Staff Portals + AI Assistant

### 1. Fix the missing route (blocker)
The previous step deleted `src/routes/index.tsx`, but TanStack Start requires it as the bootstrap homepage. The marketing home currently lives at `src/routes/_marketing.index.tsx` which already serves `/`, so the conflict is the cause of the runtime error.

- Verify routeTree state and confirm `_marketing.index.tsx` is the only `/` route.
- If the router still errors, add a thin `src/routes/index.tsx` that redirects to the marketing home, OR keep `_marketing.index.tsx` as the canonical `/` (preferred — no duplicate).
- Re-check preview loads cleanly.

### 2. Admin CRM Dashboard (`/admin/*`)
New `_authenticated/admin` route group, gated by `has_role(uid,'admin')`:
- `admin/index` — KPIs (open leads, active projects, revenue pipeline, tickets)
- `admin/leads` — table with status pipeline (new → contacted → qualified → won/lost), inline edit, assign to staff
- `admin/quotes` — quote requests inbox, convert to project
- `admin/projects` — project list + milestone editor + update poster (with photo upload to Supabase Storage)
- `admin/tickets` — ticket triage + messaging
- `admin/testimonials` — approve/reject queue
- `admin/blog` — post editor (markdown + cover image)
- `admin/users` — list profiles, grant/revoke staff/admin roles

### 3. Staff Portal (`/staff/*`)
Gated by `has_role(uid,'staff')`:
- `staff/index` — today's tasks + assigned projects
- `staff/tasks` — kanban (todo / in_progress / done)
- `staff/attendance` — clock in / clock out (geo-stamped)
- `staff/projects/$id` — post update + upload progress photos

### 4. AI Quote Assistant
- Server function `estimateQuote` using Lovable AI Gateway (`google/gemini-2.5-flash`) with structured output: service_type, scope summary, ballpark range (₹), recommended next steps.
- Conversational widget on `/quote` page; persists transcript + final estimate into `quote_requests`.
- Streaming responses via SSE.

### 5. Storage + missing tables
- Create `project-media` and `blog-media` Supabase Storage buckets with RLS.
- Verify `contact_messages` table exists (used by contact form) — add migration if missing.

### 6. Polish
- Sidebar shell for admin + staff (shadcn sidebar, navy/gold theme).
- Toast confirmations on all mutations.
- Empty states + skeleton loaders.
- SEO `head()` on all marketing routes (titles, descriptions, OG).

### Technical notes
- All admin/staff routes under `_authenticated` subtree so loaders can safely call `requireSupabaseAuth` server functions.
- Role check via `has_role` RPC inside server functions; client-side guard for UX only.
- Quote AI uses `LOVABLE_API_KEY` (already provisioned) — no user secret needed.
- Image uploads via signed URLs; max 10MB; webp conversion client-side.

Reply **"approve"** to switch to build mode and execute, or tell me what to adjust.