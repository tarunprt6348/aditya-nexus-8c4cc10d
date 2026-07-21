/**
 * Data access server functions — all queries run server-side with parameterized SQL.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query, queryOne, queryCount } from "./db.server";
import { getVerifiedUser } from "./auth.server";
import type {
  Lead, LeadStatus, QuoteRequest, Project, ProjectStatus, Ticket,
  BlogPost, Testimonial, ContactMessage, StaffSalary, StaffLeave,
  AuditLog, UserSession, RolePermission, Profile, ServiceType, AppRole,
} from "./app-types";

// ──────────────────────────────────────────────────────────────────────────────
// PROFILES
// ──────────────────────────────────────────────────────────────────────────────

export const getProfiles = createServerFn({ method: "GET" }).handler(async () => {
  return query<Profile & { email: string | null }>(
    `SELECT p.*, u.email
     FROM public.profiles p
     LEFT JOIN public.users u ON u.id = p.id
     ORDER BY p.created_at DESC`,
  );
});

export const getProfile = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    return queryOne<Profile & { email: string | null }>(
      `SELECT p.*, u.email FROM public.profiles p LEFT JOIN public.users u ON u.id = p.id WHERE p.id = $1`,
      [data.userId],
    );
  });

export const getMyProfile = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getVerifiedUser();
  if (!user) return null;
  return queryOne<Profile & { email: string | null }>(
    `SELECT p.*, u.email FROM public.profiles p LEFT JOIN public.users u ON u.id = p.id WHERE p.id = $1`,
    [user.id],
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// USER ROLES
// ──────────────────────────────────────────────────────────────────────────────

export const getUserRoles = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const rows = await query<{ role: string }>(
      `SELECT role FROM public.user_roles WHERE user_id = $1`,
      [data.userId],
    );
    return rows.map(r => r.role as AppRole);
  });

export const getAllUserRoles = createServerFn({ method: "GET" }).handler(async () => {
  return query<{ user_id: string; role: string }>(
    `SELECT user_id, role FROM public.user_roles`,
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// ROLE PERMISSIONS
// ──────────────────────────────────────────────────────────────────────────────

export const getRolePermissions = createServerFn({ method: "GET" }).handler(async () => {
  return query<RolePermission>(
    `SELECT id, role, module, allowed FROM public.role_permissions ORDER BY role, module`,
  );
});

const UpsertPermissionsSchema = z.object({
  upserts: z.array(z.object({ role: z.string(), module: z.string(), allowed: z.boolean() })),
});

export const upsertRolePermissions = createServerFn({ method: "POST" })
  .validator((d: unknown) => UpsertPermissionsSchema.parse(d))
  .handler(async ({ data }) => {
    const { transaction } = await import("./db.server");
    await transaction(async tx => {
      for (const { role, module, allowed } of data.upserts) {
        await tx.unsafe(
          `INSERT INTO public.role_permissions (role, module, allowed)
           VALUES ($1, $2, $3)
           ON CONFLICT (role, module) DO UPDATE SET allowed = EXCLUDED.allowed`,
          [role, module, allowed],
        );
      }
    });
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// LEADS
// ──────────────────────────────────────────────────────────────────────────────

export const getLeads = createServerFn({ method: "GET" }).handler(async () => {
  return query<Lead>(`SELECT * FROM public.leads ORDER BY created_at DESC`);
});

const UpdateLeadStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]),
});

export const updateLeadStatus = createServerFn({ method: "POST" })
  .validator((d: unknown) => UpdateLeadStatusSchema.parse(d))
  .handler(async ({ data }) => {
    await query(
      `UPDATE public.leads SET status = $1, updated_at = now() WHERE id = $2`,
      [data.status, data.id],
    );
    return { ok: true };
  });

const InsertLeadSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).nullable().optional(),
  service: z.string().nullable().optional(),
  message: z.string().max(2000).nullable().optional(),
  source: z.string().nullable().optional(),
  budget_range: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
});

export const insertLead = createServerFn({ method: "POST" })
  .validator((d: unknown) => InsertLeadSchema.parse(d))
  .handler(async ({ data }) => {
    const row = await queryOne<{ id: string }>(
      `INSERT INTO public.leads (name, email, phone, service, message, source, budget_range, location, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new') RETURNING id`,
      [data.name, data.email, data.phone ?? null, data.service ?? null,
       data.message ?? null, data.source ?? null, data.budget_range ?? null, data.location ?? null],
    );
    return { id: row?.id };
  });

// ──────────────────────────────────────────────────────────────────────────────
// QUOTE REQUESTS
// ──────────────────────────────────────────────────────────────────────────────

export const getQuoteRequests = createServerFn({ method: "GET" }).handler(async () => {
  return query<QuoteRequest>(`SELECT * FROM public.quote_requests ORDER BY created_at DESC`);
});

const UpdateQuoteStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "reviewing", "quoted", "accepted", "rejected"]),
});

export const updateQuoteStatus = createServerFn({ method: "POST" })
  .validator((d: unknown) => UpdateQuoteStatusSchema.parse(d))
  .handler(async ({ data }) => {
    await query(
      `UPDATE public.quote_requests SET status = $1, updated_at = now() WHERE id = $2`,
      [data.status, data.id],
    );
    return { ok: true };
  });

const InsertQuoteSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).nullable().optional(),
  service_type: z.string().nullable().optional(),
  requirements: z.string().max(2000).nullable().optional(),
  budget_range: z.string().max(100).nullable().optional(),
  timeline: z.string().max(100).nullable().optional(),
  location: z.string().max(100).nullable().optional(),
});

export const insertQuoteRequest = createServerFn({ method: "POST" })
  .validator((d: unknown) => InsertQuoteSchema.parse(d))
  .handler(async ({ data }) => {
    const row = await queryOne<{ id: string }>(
      `INSERT INTO public.quote_requests (name, email, phone, service_type, requirements, budget_range, timeline, location, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING id`,
      [data.name, data.email, data.phone ?? null, data.service_type ?? null,
       data.requirements ?? null, data.budget_range ?? null, data.timeline ?? null, data.location ?? null],
    );
    return { id: row?.id };
  });

export const getMyQuoteRequests = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getVerifiedUser();
  if (!user) return [];
  return query<QuoteRequest>(
    `SELECT * FROM public.quote_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
    [user.id],
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// PROJECTS
// ──────────────────────────────────────────────────────────────────────────────

export const getProjects = createServerFn({ method: "GET" }).handler(async () => {
  return query<Project>(`SELECT * FROM public.projects ORDER BY created_at DESC`);
});

export const getMyProjects = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getVerifiedUser();
  if (!user) return [];
  return query<Project>(
    `SELECT * FROM public.projects WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 5`,
    [user.id],
  );
});

const UpsertProjectSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  service_type: z.string(),
  status: z.string(),
  progress: z.number().min(0).max(100).default(0),
  description: z.string().max(5000).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  budget: z.number().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
});

export const upsertProject = createServerFn({ method: "POST" })
  .validator((d: unknown) => UpsertProjectSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.id) {
      await query(
        `UPDATE public.projects SET title=$1, service_type=$2, status=$3, progress=$4,
         description=$5, location=$6, budget=$7, start_date=$8, end_date=$9, updated_at=now()
         WHERE id=$10`,
        [data.title, data.service_type, data.status, data.progress, data.description ?? null,
         data.location ?? null, data.budget ?? null, data.start_date ?? null, data.end_date ?? null, data.id],
      );
      return { id: data.id };
    } else {
      const row = await queryOne<{ id: string }>(
        `INSERT INTO public.projects (title, service_type, status, progress, description, location, budget, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [data.title, data.service_type, data.status, data.progress, data.description ?? null,
         data.location ?? null, data.budget ?? null, data.start_date ?? null, data.end_date ?? null],
      );
      return { id: row?.id };
    }
  });

export const deleteProject = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await query(`DELETE FROM public.projects WHERE id = $1`, [data.id]);
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// TICKETS
// ──────────────────────────────────────────────────────────────────────────────

export const getTickets = createServerFn({ method: "GET" }).handler(async () => {
  return query<Ticket>(`SELECT * FROM public.tickets ORDER BY created_at DESC`);
});

export const getMyTickets = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getVerifiedUser();
  if (!user) return [];
  return query<Ticket>(
    `SELECT * FROM public.tickets WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 5`,
    [user.id],
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// BLOG POSTS
// ──────────────────────────────────────────────────────────────────────────────

export const getBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  return query<BlogPost>(`SELECT * FROM public.blog_posts ORDER BY created_at DESC`);
});

export const getPublishedBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  return query<BlogPost>(
    `SELECT * FROM public.blog_posts WHERE published = true ORDER BY published_at DESC`,
  );
});

const UpsertBlogPostSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(300),
  excerpt: z.string().max(500).nullable().optional(),
  content: z.string().min(1),
  cover_image: z.string().max(500).nullable().optional(),
  published: z.boolean().default(false),
  published_at: z.string().nullable().optional(),
});

export const upsertBlogPost = createServerFn({ method: "POST" })
  .validator((d: unknown) => UpsertBlogPostSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.id) {
      await query(
        `UPDATE public.blog_posts SET title=$1, slug=$2, excerpt=$3, content=$4, cover_image=$5,
         published=$6, published_at=$7, updated_at=now() WHERE id=$8`,
        [data.title, data.slug, data.excerpt ?? null, data.content, data.cover_image ?? null,
         data.published, data.published_at ?? null, data.id],
      );
      return { id: data.id };
    } else {
      const row = await queryOne<{ id: string }>(
        `INSERT INTO public.blog_posts (title, slug, excerpt, content, cover_image, published, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [data.title, data.slug, data.excerpt ?? null, data.content, data.cover_image ?? null,
         data.published, data.published_at ?? null],
      );
      return { id: row?.id };
    }
  });

// ──────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS
// ──────────────────────────────────────────────────────────────────────────────

export const getTestimonials = createServerFn({ method: "GET" }).handler(async () => {
  return query<Testimonial>(`SELECT * FROM public.testimonials ORDER BY created_at DESC`);
});

export const getPublishedTestimonials = createServerFn({ method: "GET" }).handler(async () => {
  return query<Testimonial>(
    `SELECT * FROM public.testimonials WHERE published = true ORDER BY created_at DESC`,
  );
});

export const updateTestimonialPublished = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string().uuid(), published: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await query(
      `UPDATE public.testimonials SET published = $1 WHERE id = $2`,
      [data.published, data.id],
    );
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// CONTACT MESSAGES
// ──────────────────────────────────────────────────────────────────────────────

export const getContactMessages = createServerFn({ method: "GET" }).handler(async () => {
  return query<ContactMessage>(`SELECT * FROM public.contact_messages ORDER BY created_at DESC`);
});

const InsertContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).nullable().optional(),
  subject: z.string().max(200).nullable().optional(),
  message: z.string().min(10).max(2000),
});

export const insertContactMessage = createServerFn({ method: "POST" })
  .validator((d: unknown) => InsertContactSchema.parse(d))
  .handler(async ({ data }) => {
    await query(
      `INSERT INTO public.contact_messages (name, email, phone, subject, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [data.name, data.email, data.phone ?? null, data.subject ?? null, data.message],
    );
    return { ok: true };
  });

export const updateContactMessageHandled = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string().uuid(), handled: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await query(
      `UPDATE public.contact_messages SET handled = $1 WHERE id = $2`,
      [data.handled, data.id],
    );
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// STAFF SALARIES
// ──────────────────────────────────────────────────────────────────────────────

export const getStaffSalaries = createServerFn({ method: "GET" }).handler(async () => {
  return query<StaffSalary>(
    `SELECT * FROM public.staff_salaries ORDER BY period_month DESC`,
  );
});

const InsertSalarySchema = z.object({
  staff_user_id: z.string().uuid(),
  period_month: z.string(),
  amount: z.number().positive(),
  status: z.string().default("paid"),
});

export const insertSalary = createServerFn({ method: "POST" })
  .validator((d: unknown) => InsertSalarySchema.parse(d))
  .handler(async ({ data }) => {
    await query(
      `INSERT INTO public.staff_salaries (staff_user_id, period_month, amount, status)
       VALUES ($1, $2, $3, $4)`,
      [data.staff_user_id, data.period_month, data.amount, data.status],
    );
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// STAFF LEAVES
// ──────────────────────────────────────────────────────────────────────────────

export const getStaffLeaves = createServerFn({ method: "GET" }).handler(async () => {
  return query<StaffLeave>(
    `SELECT * FROM public.staff_leaves ORDER BY from_date DESC`,
  );
});

export const getMyLeaves = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getVerifiedUser();
  if (!user) return [];
  return query<StaffLeave>(
    `SELECT * FROM public.staff_leaves WHERE staff_user_id = $1 ORDER BY from_date DESC`,
    [user.id],
  );
});

const InsertLeaveSchema = z.object({
  from_date: z.string(),
  to_date: z.string(),
  leave_type: z.string().default("casual"),
  reason: z.string().max(500).nullable().optional(),
});

export const insertLeave = createServerFn({ method: "POST" })
  .validator((d: unknown) => InsertLeaveSchema.parse(d))
  .handler(async ({ data }) => {
    const user = await getVerifiedUser();
    if (!user) throw new Error("Not authenticated.");
    await query(
      `INSERT INTO public.staff_leaves (staff_user_id, from_date, to_date, leave_type, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [user.id, data.from_date, data.to_date, data.leave_type, data.reason ?? null],
    );
    return { ok: true };
  });

export const updateLeaveStatus = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string().uuid(), status: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await query(
      `UPDATE public.staff_leaves SET status = $1 WHERE id = $2`,
      [data.status, data.id],
    );
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// AUDIT LOGS
// ──────────────────────────────────────────────────────────────────────────────

export const getAuditLogs = createServerFn({ method: "GET" }).handler(async () => {
  return query<AuditLog>(
    `SELECT * FROM public.audit_logs ORDER BY created_at DESC LIMIT 500`,
  );
});

export const insertAuditLog = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    actor_id: z.string().uuid().nullable().optional(),
    actor_email: z.string().nullable().optional(),
    action: z.string(),
    target_type: z.string().nullable().optional(),
    target_id: z.string().nullable().optional(),
    target_email: z.string().nullable().optional(),
    metadata: z.record(z.unknown()).default({}),
  }).parse(d))
  .handler(async ({ data }) => {
    await query(
      `INSERT INTO public.audit_logs (actor_id, actor_email, action, target_type, target_id, target_email, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [data.actor_id ?? null, data.actor_email ?? null, data.action,
       data.target_type ?? null, data.target_id ?? null, data.target_email ?? null, JSON.stringify(data.metadata)],
    );
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// USER SESSIONS
// ──────────────────────────────────────────────────────────────────────────────

export const getUserSessions = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    return query<UserSession>(
      `SELECT * FROM public.user_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [data.userId],
    );
  });

export const recordSession = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    userAgent: z.string().max(500).optional(),
    deviceType: z.string().max(50).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const user = await getVerifiedUser();
    if (!user) return null;
    const row = await queryOne<{ id: string }>(
      `INSERT INTO public.user_sessions (user_id, user_agent, device_type, last_seen)
       VALUES ($1, $2, $3, now()) RETURNING id`,
      [user.id, data.userAgent ?? null, data.deviceType ?? null],
    );
    return row?.id ?? null;
  });

export const touchSession = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await query(
      `UPDATE public.user_sessions SET last_seen = now() WHERE id = $1`,
      [data.sessionId],
    );
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// IMPERSONATION
// ──────────────────────────────────────────────────────────────────────────────

export const startImpersonationLog = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    impersonatorId: z.string().uuid(),
    targetUserId: z.string().uuid(),
  }).parse(d))
  .handler(async ({ data }) => {
    const row = await queryOne<{ id: string }>(
      `INSERT INTO public.impersonation_log (impersonator_id, target_user_id)
       VALUES ($1, $2) RETURNING id`,
      [data.impersonatorId, data.targetUserId],
    );
    return { id: row?.id };
  });

export const endImpersonationLog = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await query(
      `UPDATE public.impersonation_log SET ended_at = now() WHERE id = $1`,
      [data.id],
    );
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// OWNER ADMIN OPS
// ──────────────────────────────────────────────────────────────────────────────

export const hasRole = createServerFn({ method: "GET" })
  .validator((d: unknown) => z.object({ userId: z.string().uuid(), role: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const row = await queryOne(
      `SELECT 1 FROM public.user_roles WHERE user_id = $1 AND role = $2`,
      [data.userId, data.role],
    );
    return !!row;
  });

export const ownerSetUserRole = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ targetUserId: z.string().uuid(), role: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const caller = await getVerifiedUser();
    if (!caller) throw new Error("Not authenticated.");
    const isOwner = await queryOne(
      `SELECT 1 FROM public.user_roles WHERE user_id = $1 AND role = 'owner'`,
      [caller.id],
    );
    if (!isOwner) throw new Error("Forbidden: owner role required.");

    await query(
      `INSERT INTO public.user_roles (user_id, role) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role`,
      [data.targetUserId, data.role],
    );
    return { ok: true };
  });

export const ownerUpdateUserStatus = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({
    targetUserId: z.string().uuid(),
    status: z.enum(["active", "inactive", "suspended", "pending_verification"]),
  }).parse(d))
  .handler(async ({ data }) => {
    const caller = await getVerifiedUser();
    if (!caller) throw new Error("Not authenticated.");
    const isOwner = await queryOne(
      `SELECT 1 FROM public.user_roles WHERE user_id = $1 AND role = 'owner'`,
      [caller.id],
    );
    if (!isOwner) throw new Error("Forbidden: owner role required.");

    await query(
      `UPDATE public.profiles SET status = $1, updated_at = now() WHERE id = $2`,
      [data.status, data.targetUserId],
    );
    return { ok: true };
  });

// ──────────────────────────────────────────────────────────────────────────────
// DASHBOARD COUNTS (aggregated for KPI cards)
// ──────────────────────────────────────────────────────────────────────────────

export const getDashboardCounts = createServerFn({ method: "GET" }).handler(async () => {
  const [users, leads, quotes, projects, tickets, sessions, impersonations,
         activeProjects, openTickets, pendingLeaves, pendingQuotes, newLeads,
         staff] = await Promise.all([
    queryCount(`SELECT COUNT(*) FROM public.profiles`),
    queryCount(`SELECT COUNT(*) FROM public.leads`),
    queryCount(`SELECT COUNT(*) FROM public.quote_requests`),
    queryCount(`SELECT COUNT(*) FROM public.projects`),
    queryCount(`SELECT COUNT(*) FROM public.tickets`),
    queryCount(`SELECT COUNT(*) FROM public.user_sessions`),
    queryCount(`SELECT COUNT(*) FROM public.impersonation_log`),
    queryCount(`SELECT COUNT(*) FROM public.projects WHERE status = 'in_progress'`),
    queryCount(`SELECT COUNT(*) FROM public.tickets WHERE status != 'closed'`),
    queryCount(`SELECT COUNT(*) FROM public.staff_leaves WHERE status = 'pending'`),
    queryCount(`SELECT COUNT(*) FROM public.quote_requests WHERE status = 'pending'`),
    queryCount(`SELECT COUNT(*) FROM public.leads WHERE status = 'new'`),
    queryCount(`SELECT COUNT(*) FROM public.profiles`),
  ]);

  return {
    users, leads, quotes, projects, tickets, sessions, impersonations,
    activeProjects, openTickets, pendingLeaves, pendingQuotes, newLeads,
    staff,
  };
});

export const getRecentAuditLogs = createServerFn({ method: "GET" }).handler(async () => {
  return query<Pick<AuditLog, "id" | "action" | "actor_email" | "created_at">>(
    `SELECT id, action, actor_email, created_at FROM public.audit_logs ORDER BY created_at DESC LIMIT 5`,
  );
});

export const getProjectsSummary = createServerFn({ method: "GET" }).handler(async () => {
  const projects = await query<{ id: string; title: string; status: string; budget: number | null; location: string | null; progress: number }>(
    `SELECT id, title, status, budget, location, progress FROM public.projects ORDER BY created_at DESC`,
  );
  return projects;
});

export const getStaffProfilesForHR = createServerFn({ method: "GET" }).handler(async () => {
  // Returns all non-customer profiles with their roles
  const rows = await query<{ user_id: string; role: string }>(
    `SELECT user_id, role FROM public.user_roles WHERE role != 'customer'`,
  );
  const ids = rows.map(r => r.user_id);
  if (ids.length === 0) return [];

  const profiles = await query<{ id: string; full_name: string | null }>(
    `SELECT id, full_name FROM public.profiles WHERE id = ANY($1::uuid[])`,
    [ids],
  );
  return profiles;
});

export const getUsersWithRoles = createServerFn({ method: "GET" }).handler(async () => {
  return query<{ id: string; full_name: string | null; email: string | null; phone: string | null; status: string; created_at: string }>(
    `SELECT p.id, p.full_name, u.email, p.phone, p.status, p.created_at
     FROM public.profiles p
     LEFT JOIN public.users u ON u.id = p.id
     ORDER BY p.created_at DESC`,
  );
});
