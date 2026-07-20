/**
 * Dedicated dashboard components for each of the 15 enterprise roles.
 * All data fetching via server functions — no direct Supabase calls.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useRole } from "@/contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, Building2, MessageSquare, Star, BookOpen,
  DollarSign, Shield, ClipboardList, BarChart3,
  UserCog, Eye, CheckCircle2, Clock, Mail,
  AlertTriangle, CalendarDays, ChevronRight, Target,
} from "lucide-react";
import {
  getDashboardCounts, getRecentAuditLogs, getProjectsSummary, getUserSessions,
} from "@/lib/data.functions";

// ─── Shared sub-components ───────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, to, color = "text-gold" }: {
  label: string; value: number | string; icon: React.ElementType;
  to?: string; color?: string;
}) {
  const inner = (
    <Card className="group transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-3.5 w-3.5 ${color}`} />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="font-display text-2xl">{value}</div>
      </CardContent>
    </Card>
  );
  return to ? <Link to={to} className="cursor-pointer">{inner}</Link> : inner;
}

function QuickLink({ to, label, icon: Icon, desc }: {
  to: string; label: string; icon: React.ElementType; desc: string;
}) {
  return (
    <Link to={to}>
      <Card className="group cursor-pointer transition-all hover:shadow-md">
        <CardContent className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-navy/10 p-1.5 group-hover:bg-navy/20 transition-colors">
              <Icon className="h-4 w-4 text-navy" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 group-hover:text-muted-foreground transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ImpersonationNote({ name }: { name: string }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <Eye className="h-4 w-4 text-amber-600 shrink-0" />
      <span className="text-sm text-amber-800">
        Viewing as <strong>{name}</strong> — data scope matches their permissions
      </span>
    </div>
  );
}

type DashCounts = {
  users: number; leads: number; quotes: number; projects: number; tickets: number;
  sessions: number; impersonations: number; activeProjects: number; openTickets: number;
  pendingLeaves: number; pendingQuotes: number; newLeads: number; staff: number;
};

function useCounts() {
  const [counts, setCounts] = useState<DashCounts | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getDashboardCounts().then(setCounts).catch(console.error).finally(() => setLoading(false));
  }, []);
  return { counts, loading };
}

// ─── OWNER DASHBOARD ─────────────────────────────────────────────────────────
export function OwnerDashboard() {
  const { isImpersonating, impersonationName } = useRole();
  const { counts, loading } = useCounts();
  const [recentLogs, setRecentLogs] = useState<{ id: string; action: string; actor_email: string | null; created_at: string }[]>([]);

  useEffect(() => {
    getRecentAuditLogs().then(setRecentLogs).catch(() => {});
  }, []);

  return (
    <div>
      {isImpersonating && <ImpersonationNote name={impersonationName} />}
      <h1 className="mb-1 font-display text-3xl">Owner Console</h1>
      <p className="mb-6 text-sm text-muted-foreground">Full system view — all data across every role.</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total users" value={loading ? "…" : counts?.users ?? 0} icon={Users} to="/admin/users" />
        <KpiCard label="Leads" value={loading ? "…" : counts?.leads ?? 0} icon={Target} to="/admin/leads" />
        <KpiCard label="Active projects" value={loading ? "…" : counts?.activeProjects ?? 0} icon={Building2} to="/admin/projects" />
        <KpiCard label="Open tickets" value={loading ? "…" : counts?.openTickets ?? 0} icon={AlertTriangle} to="/admin/tickets" color="text-red-500" />
      </div>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Sessions recorded" value={loading ? "…" : counts?.sessions ?? 0} icon={Shield} />
        <KpiCard label="Impersonations" value={loading ? "…" : counts?.impersonations ?? 0} icon={Eye} />
        <KpiCard label="Pending quotes" value={loading ? "…" : counts?.pendingQuotes ?? 0} icon={FileText} to="/admin/quotes" />
        <KpiCard label="New leads" value={loading ? "…" : counts?.newLeads ?? 0} icon={MessageSquare} to="/admin/leads" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Quick actions</CardTitle></CardHeader>
          <CardContent className="grid gap-2 pt-0">
            <QuickLink to="/admin/users" icon={Users} label="User management" desc="Invite users, set roles, reset passwords" />
            <QuickLink to="/admin/team" icon={UserCog} label="Team & roles" desc="Assign roles and impersonate accounts" />
            <QuickLink to="/admin/audit" icon={Shield} label="Audit log" desc="Full action history across all users" />
            <QuickLink to="/admin/permissions" icon={ClipboardList} label="Permissions" desc="Configure module access per role" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Recent audit events</CardTitle></CardHeader>
          <CardContent className="pt-0">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent events.</p>
            ) : (
              <ul className="space-y-2">
                {recentLogs.map(l => (
                  <li key={l.id} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 text-muted-foreground">{new Date(l.created_at).toLocaleTimeString()}</span>
                    <span className="font-mono text-navy">{l.action}</span>
                    <span className="text-muted-foreground truncate">{l.actor_email ?? "system"}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
export function AdminDashboard() {
  const { counts, loading } = useCounts();
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Admin Console</h1>
      <p className="mb-6 text-sm text-muted-foreground">Full platform administration.</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total users" value={loading ? "…" : counts?.users ?? 0} icon={Users} to="/admin/users" />
        <KpiCard label="Active projects" value={loading ? "…" : counts?.activeProjects ?? 0} icon={Building2} to="/admin/projects" />
        <KpiCard label="Open tickets" value={loading ? "…" : counts?.openTickets ?? 0} icon={AlertTriangle} to="/admin/tickets" />
        <KpiCard label="Pending quotes" value={loading ? "…" : counts?.pendingQuotes ?? 0} icon={FileText} to="/admin/quotes" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink to="/admin/leads" icon={Target} label="Leads" desc="Manage sales pipeline" />
        <QuickLink to="/admin/messages" icon={MessageSquare} label="Messages" desc="Contact enquiries" />
        <QuickLink to="/admin/blog" icon={BookOpen} label="Blog" desc="Publish articles" />
        <QuickLink to="/admin/testimonials" icon={Star} label="Testimonials" desc="Manage reviews" />
        <QuickLink to="/admin/team" icon={UserCog} label="Team" desc="Role assignments" />
        <QuickLink to="/admin/audit" icon={Shield} label="Audit" desc="System activity log" />
      </div>
    </div>
  );
}

// ─── MANAGING DIRECTOR ────────────────────────────────────────────────────────
export function ManagingDirectorDashboard() {
  const { counts, loading } = useCounts();
  const [projects, setProjects] = useState<{ id: string; title: string; status: string; progress: number; location: string | null }[]>([]);

  useEffect(() => {
    getProjectsSummary().then(setProjects).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Executive Overview</h1>
      <p className="mb-6 text-sm text-muted-foreground">Strategic metrics and project pipeline.</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active projects" value={loading ? "…" : counts?.activeProjects ?? 0} icon={Building2} to="/admin/projects" />
        <KpiCard label="Pending quotes" value={loading ? "…" : counts?.pendingQuotes ?? 0} icon={FileText} to="/admin/quotes" />
        <KpiCard label="Total staff" value={loading ? "…" : counts?.staff ?? 0} icon={Users} to="/admin/employees" />
        <KpiCard label="Open tickets" value={loading ? "…" : counts?.openTickets ?? 0} icon={AlertTriangle} to="/admin/tickets" color="text-red-500" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Project pipeline</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-3">
            {projects.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.location ?? "—"} · {p.status.replace("_", " ")}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${p.progress}%` }} />
                  </div>
                  <span className="text-xs tabular-nums">{p.progress}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-2">
          <QuickLink to="/admin/projects" icon={Building2} label="All projects" desc="Full project management" />
          <QuickLink to="/admin/quotes" icon={FileText} label="Quotes" desc="Review and approve" />
          <QuickLink to="/admin/hr" icon={Users} label="HR" desc="Salaries and leave" />
        </div>
      </div>
    </div>
  );
}

// ─── OPERATIONS MANAGER ──────────────────────────────────────────────────────
export function OperationsManagerDashboard() {
  const { counts, loading } = useCounts();
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Operations</h1>
      <p className="mb-6 text-sm text-muted-foreground">Day-to-day operational oversight.</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active projects" value={loading ? "…" : counts?.activeProjects ?? 0} icon={Building2} to="/admin/projects" />
        <KpiCard label="Open tickets" value={loading ? "…" : counts?.openTickets ?? 0} icon={AlertTriangle} to="/admin/tickets" color="text-orange-500" />
        <KpiCard label="New leads" value={loading ? "…" : counts?.newLeads ?? 0} icon={Target} to="/admin/leads" />
        <KpiCard label="Pending quotes" value={loading ? "…" : counts?.pendingQuotes ?? 0} icon={FileText} to="/admin/quotes" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink to="/admin/projects" icon={Building2} label="Projects" desc="Project tracking" />
        <QuickLink to="/admin/tickets" icon={AlertTriangle} label="Tickets" desc="Support resolution" />
        <QuickLink to="/admin/messages" icon={MessageSquare} label="Messages" desc="Enquiry inbox" />
        <QuickLink to="/admin/leads" icon={Target} label="Leads" desc="Sales pipeline" />
        <QuickLink to="/admin/quotes" icon={FileText} label="Quotes" desc="Quote management" />
        <QuickLink to="/admin/team" icon={Users} label="Team" desc="Staff coordination" />
      </div>
    </div>
  );
}

// ─── HR MANAGER ──────────────────────────────────────────────────────────────
export { HrManagerDashboard as HRManagerDashboard };
export function HrManagerDashboard() {
  const { counts, loading } = useCounts();
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">HR Dashboard</h1>
      <p className="mb-6 text-sm text-muted-foreground">People, leaves and payroll.</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total employees" value={loading ? "…" : counts?.staff ?? 0} icon={Users} to="/admin/employees" />
        <KpiCard label="Pending leaves" value={loading ? "…" : counts?.pendingLeaves ?? 0} icon={CalendarDays} to="/admin/hr" color="text-orange-500" />
        <KpiCard label="Active staff" value={loading ? "…" : counts?.users ?? 0} icon={CheckCircle2} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink to="/admin/hr" icon={CalendarDays} label="Leave management" desc="Review and approve leaves" />
        <QuickLink to="/admin/employees" icon={Users} label="Employees" desc="Employee directory" />
        <QuickLink to="/admin/team" icon={UserCog} label="Team roles" desc="Role assignments" />
      </div>
    </div>
  );
}

// ─── SALES MANAGER ───────────────────────────────────────────────────────────
export function SalesManagerDashboard() {
  const { counts, loading } = useCounts();
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Sales Dashboard</h1>
      <p className="mb-6 text-sm text-muted-foreground">Pipeline, quotes and conversion.</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total leads" value={loading ? "…" : counts?.leads ?? 0} icon={Target} to="/admin/leads" />
        <KpiCard label="New leads" value={loading ? "…" : counts?.newLeads ?? 0} icon={MessageSquare} to="/admin/leads" color="text-green-600" />
        <KpiCard label="Pending quotes" value={loading ? "…" : counts?.pendingQuotes ?? 0} icon={FileText} to="/admin/quotes" />
        <KpiCard label="Total quotes" value={loading ? "…" : counts?.quotes ?? 0} icon={BarChart3} to="/admin/quotes" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink to="/admin/leads" icon={Target} label="Leads" desc="Full pipeline management" />
        <QuickLink to="/admin/quotes" icon={FileText} label="Quotes" desc="Quote status & follow-up" />
        <QuickLink to="/admin/messages" icon={MessageSquare} label="Enquiries" desc="Contact messages" />
      </div>
    </div>
  );
}

// ─── MARKETING MANAGER ───────────────────────────────────────────────────────
export function MarketingManagerDashboard() {
  const { counts, loading } = useCounts();
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Marketing</h1>
      <p className="mb-6 text-sm text-muted-foreground">Content, testimonials and lead generation.</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total leads" value={loading ? "…" : counts?.leads ?? 0} icon={Target} to="/admin/leads" />
        <KpiCard label="New leads" value={loading ? "…" : counts?.newLeads ?? 0} icon={MessageSquare} to="/admin/leads" />
        <KpiCard label="Messages" value={loading ? "…" : counts?.quotes ?? 0} icon={Mail} to="/admin/messages" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink to="/admin/blog" icon={BookOpen} label="Blog" desc="Publish and edit articles" />
        <QuickLink to="/admin/testimonials" icon={Star} label="Testimonials" desc="Manage client reviews" />
        <QuickLink to="/admin/leads" icon={Target} label="Leads" desc="Lead pipeline" />
        <QuickLink to="/admin/messages" icon={MessageSquare} label="Enquiries" desc="Contact messages" />
      </div>
    </div>
  );
}

// ─── ACCOUNTANT ──────────────────────────────────────────────────────────────
export function AccountantDashboard() {
  const { counts, loading } = useCounts();
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Finance</h1>
      <p className="mb-6 text-sm text-muted-foreground">Revenue, quotes and payroll overview.</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total quotes" value={loading ? "…" : counts?.quotes ?? 0} icon={FileText} to="/admin/quotes" />
        <KpiCard label="Pending quotes" value={loading ? "…" : counts?.pendingQuotes ?? 0} icon={Clock} to="/admin/quotes" color="text-orange-500" />
        <KpiCard label="Active projects" value={loading ? "…" : counts?.activeProjects ?? 0} icon={Building2} to="/admin/projects" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink to="/admin/quotes" icon={FileText} label="Quotes" desc="Financial review" />
        <QuickLink to="/admin/hr" icon={DollarSign} label="Payroll" desc="Salary records" />
        <QuickLink to="/admin/projects" icon={Building2} label="Projects" desc="Budget tracking" />
      </div>
    </div>
  );
}

// ─── PROJECT MANAGER ─────────────────────────────────────────────────────────
export function ProjectManagerDashboard() {
  const { counts, loading } = useCounts();
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Project Management</h1>
      <p className="mb-6 text-sm text-muted-foreground">Site progress, tasks and milestones.</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Active projects" value={loading ? "…" : counts?.activeProjects ?? 0} icon={Building2} to="/admin/projects" />
        <KpiCard label="Open tickets" value={loading ? "…" : counts?.openTickets ?? 0} icon={AlertTriangle} to="/admin/tickets" />
        <KpiCard label="Total projects" value={loading ? "…" : counts?.projects ?? 0} icon={ClipboardList} to="/admin/projects" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink to="/admin/projects" icon={Building2} label="Projects" desc="Track all projects" />
        <QuickLink to="/admin/tickets" icon={AlertTriangle} label="Tickets" desc="Site issue resolution" />
        <QuickLink to="/admin/quotes" icon={FileText} label="Quotes" desc="Client proposals" />
      </div>
    </div>
  );
}

// ─── SITE ENGINEER ───────────────────────────────────────────────────────────
export function SiteEngineerDashboard() {
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Site Engineering</h1>
      <p className="mb-6 text-sm text-muted-foreground">On-site progress and quality checks.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink to="/admin/projects" icon={Building2} label="Projects" desc="View active site projects" />
        <QuickLink to="/admin/tickets" icon={AlertTriangle} label="Site issues" desc="Log and track defects" />
      </div>
    </div>
  );
}

// ─── CUSTOMER SUPPORT ────────────────────────────────────────────────────────
export function CustomerSupportDashboard() {
  const { counts, loading } = useCounts();
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Customer Support</h1>
      <p className="mb-6 text-sm text-muted-foreground">Tickets, messages and client communication.</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Open tickets" value={loading ? "…" : counts?.openTickets ?? 0} icon={AlertTriangle} to="/admin/tickets" color="text-orange-500" />
        <KpiCard label="Total tickets" value={loading ? "…" : counts?.tickets ?? 0} icon={ClipboardList} to="/admin/tickets" />
        <KpiCard label="Messages" value={loading ? "…" : counts?.quotes ?? 0} icon={MessageSquare} to="/admin/messages" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink to="/admin/tickets" icon={AlertTriangle} label="Tickets" desc="Resolve customer issues" />
        <QuickLink to="/admin/messages" icon={MessageSquare} label="Messages" desc="Respond to enquiries" />
      </div>
    </div>
  );
}

// ─── SALES EXECUTIVE ─────────────────────────────────────────────────────────
export function SalesExecutiveDashboard() {
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Sales</h1>
      <p className="mb-6 text-sm text-muted-foreground">Your assigned leads and tasks.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink to="/admin/leads" icon={Target} label="Leads" desc="Manage your pipeline" />
        <QuickLink to="/admin/quotes" icon={FileText} label="Quotes" desc="Active proposals" />
      </div>
    </div>
  );
}

// ─── GENERAL STAFF / STAFF ────────────────────────────────────────────────────
export function GeneralStaffDashboard() {
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Staff Portal</h1>
      <p className="mb-6 text-sm text-muted-foreground">Your tasks and leave requests.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink to="/staff/leaves" icon={CalendarDays} label="Leave requests" desc="Apply and track leaves" />
      </div>
    </div>
  );
}

// Alias
export const StaffDashboard = GeneralStaffDashboard;

// ─── CUSTOMER DASHBOARD ───────────────────────────────────────────────────────
export function CustomerDashboard() {
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Client Portal</h1>
      <p className="mb-6 text-sm text-muted-foreground">Your projects, tickets and requests.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink to="/portal" icon={Building2} label="My projects" desc="Track project progress" />
        <QuickLink to="/portal" icon={AlertTriangle} label="Support tickets" desc="View open issues" />
        <QuickLink to="/portal" icon={FileText} label="Quote requests" desc="Your submitted enquiries" />
        <QuickLink to="/quote" icon={Target} label="Request a quote" desc="New project enquiry" />
      </div>
    </div>
  );
}
