## Goals
1. Update site copy with the real Aditya Constructions brand details from the PDF (Greater Noida address, phone, email, tagline "Everything Under One Roof", correct services, vision/mission/experience). Strip Hyderabad and any company‑size claims.
2. Provide three distinct role logins (Owner / Staff / Customer) with role‑specific portals.
3. Give Owner the ability to author/edit data directly from the portal (projects, leads, quotes, tickets, testimonials, blog, staff records, salaries, leaves).

## Brand & content updates
- Replace all "Hyderabad" / 25‑year / team‑size copy across:
  - `_marketing.index.tsx`, `_marketing.about.tsx`, `_marketing.contact.tsx`, `_marketing.quote.tsx`, `_marketing.services.*`, `SiteFooter.tsx`, `SiteHeader.tsx`, `auth.tsx`.
- Header tagline: "Everything Under One Roof".
- Contact block everywhere: T‑22 & 23, Beta Plaza, Beta‑1, Greater Noida, U.P. 201310 · +91 96509 98403 · adityaconstructionsfirm@gmail.com.
- Rewrite About using PDF's Overview, Vision, Mission, Experience, Why Choose Us.
- Service pages: align bullet lists to the PDF (Construction, Interiors, Real Estate, HVAC, Solar).
- Default location placeholder on the quote form changes from "Hyderabad" to "Greater Noida".

## Roles model
Current `app_role` enum is `admin | staff | customer`. We will map:
- Owner → `admin` (full access; rename UI labels from "Admin" to "Owner")
- Staff → `staff`
- Customer → `customer` (default for new sign‑ups, already wired by `handle_new_user`)

No schema change to the enum needed. New migration only adds two tables for HR features (see below) and a small RPC for the Owner to assign roles.

### Login experience
- Single `/auth` page keeps Email/Password + Google.
- After sign‑in we route by highest role:
  - admin → `/owner`
  - staff → `/staff`
  - customer → `/portal`
- `/owner` is a renamed alias of the existing `_authenticated/admin` subtree (sidebar label "Owner Console"). Old `/admin/*` URLs redirect to `/owner/*`.

## Owner Console (writable everywhere)
Extend the existing admin pages so every list also has create/edit/delete:
- **Leads** — add "New lead" dialog + inline status/notes edit.
- **Quote requests** — edit status, add internal notes, convert to project.
- **Projects** — create/edit project (name, client, service, status, progress, dates, budget, description) + milestones editor (add/check off milestones in `project_milestones`).
- **Tickets** — change status/priority, post replies to `ticket_messages`.
- **Testimonials** — already has publish toggle; add "New testimonial" form + delete.
- **Blog** — new page with list + rich‑text (textarea) editor writing to `blog_posts` (title, slug, excerpt, content, cover, published).
- **Team & Roles** — new page listing `profiles` joined with `user_roles`; Owner can grant/revoke `staff` / `admin` via a `set_user_role(target uuid, role app_role)` SECURITY DEFINER RPC that checks `has_role(auth.uid(),'admin')`.
- **HR (Staff records)** — new page to view & edit each staff member's:
  - Salary records (new table `staff_salaries`: staff_user_id, month, amount, status, notes).
  - Leave requests (new table `staff_leaves`: staff_user_id, from_date, to_date, type, status, reason). Owner approves/rejects; Staff can submit their own.
  - Attendance (existing `attendance` table) — Owner sees all rows.
- **Contact messages** — new page surfacing `contact_messages` with mark‑as‑read.

All writes go through the browser Supabase client under RLS policies that allow when `has_role(auth.uid(),'admin')`.

## Staff Portal additions
- Existing kanban stays.
- Add "My salary" (read own `staff_salaries`).
- Add "My leaves" — list + submit new leave request (insert into `staff_leaves` where `staff_user_id = auth.uid()`).
- Add "My attendance" — check‑in/out writing to `attendance`.
- Add "My projects" — projects where staff is assigned (uses existing `projects.assigned_to` if present, else filter by tasks).

## Customer Portal additions
Replace minimal `/portal` with:
- "My projects" — projects where `client_id = auth.uid()` showing progress + milestones.
- "My quotes" — own `quote_requests`.
- "Raise inquiry / ticket" — form inserting into `tickets`, plus thread view via `ticket_messages`.

## Database migration (single migration)
1. `CREATE TABLE public.staff_salaries (...)` + grants + RLS:
   - Staff can `SELECT` own rows; Owner (`admin`) full access.
2. `CREATE TABLE public.staff_leaves (...)` + grants + RLS:
   - Staff insert/select own; Owner full access incl. status update.
3. `CREATE OR REPLACE FUNCTION public.set_user_role(_target uuid, _role app_role)` SECURITY DEFINER — only callable if caller has admin role; upserts into `user_roles`.
4. Updated‑at triggers on the new tables.

## Routing plan (file changes)
- New: `src/routes/_authenticated/owner/route.tsx` (admin gate, sidebar) + child pages: `index.tsx`, `leads.tsx`, `quotes.tsx`, `projects.tsx` (with editor), `tickets.tsx`, `testimonials.tsx`, `blog.tsx`, `team.tsx`, `hr.tsx`, `messages.tsx`.
- Old `_authenticated/admin/*` files become thin redirects to `/owner/*` (so existing links keep working).
- Updated: `_authenticated/staff/index.tsx` becomes a layout with tabs (Tasks, Attendance, Leaves, Salary).
- Updated: `_authenticated/portal.tsx` becomes the Customer Portal with tabs (Projects, Quotes, Tickets).
- Updated: `auth.tsx` → post‑login router checks role and redirects to the right portal.

## Out of scope (ask if wanted)
- Email/SMS notifications for new leads, ticket replies, leave approvals.
- File uploads (project photos, blog covers) — current plan uses URL fields; storage buckets can be added next.
- Public "Owner sign‑up" — Owner accounts are created by promoting an existing user from the Team page (no self‑serve owner sign‑up, for safety).

## How you (Owner) get access
After this ships:
1. Sign up once at `/auth` with your email — you'll be created as a `customer`.
2. Tell me your email; I'll run a one‑line data update to grant your account the `admin` role. From then on you can promote/demote anyone else from the Team page yourself.
