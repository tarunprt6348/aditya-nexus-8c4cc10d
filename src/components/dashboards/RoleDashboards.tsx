/**
 * Dedicated dashboard components for each of the 15 enterprise roles.
 * Each component fetches role-relevant data and presents a focused view.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, Building2, MessageSquare, Star, BookOpen,
  DollarSign, Shield, ClipboardList, BarChart3, TrendingUp,
  UserCog, Bell, Eye, Activity, CheckCircle2, Clock,
  AlertTriangle, CalendarDays, Mail, ChevronRight, Target,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, to, color = "text-gold" }: {
  label: string; value: number | string; icon: React.ElementType;
  to?: string; color?: string;
}) {
  const inner = (
    <Card className="group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="font-display text-3xl">{value}</div>
      </CardContent>
    </Card>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function QuickLink({ to, label, icon: Icon, desc }: {
  to: string; label: string; icon: React.ElementType; desc: string;
}) {
  return (
    <Link to={to}>
      <Card className="group cursor-pointer transition-all hover:shadow-md">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-navy/10 p-2 group-hover:bg-navy/20 transition-colors">
              <Icon className="h-5 w-5 text-navy" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 mt-1 group-hover:text-muted-foreground transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ImpersonationBanner({ name }: { name: string }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <Eye className="h-4 w-4 text-amber-600 shrink-0" />
      <span className="text-sm text-amber-800">
        Viewing as <strong>{name}</strong> — data scope matches their permissions
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OWNER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export function OwnerDashboard() {
  const { isImpersonating, impersonationName } = useRole();
  const [kpi, setKpi] = useState({ users: 0, auditEvents: 0, activeSessions: 0, impersonations: 0 });
  const [recentAudit, setRecentAudit] = useState<Array<{ id: string; action: string; actor_email: string | null; created_at: string }>>([]);
  const [pendingUsers, setPendingUsers] = useState(0);

  useEffect(() => {
    (async () => {
      const [u, audit, sessions, imperLog, pending] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("audit_logs" as never).select("id", { count: "exact", head: true }),
        supabase.from("user_sessions" as never).select("id", { count: "exact", head: true }),
        supabase.from("impersonation_log" as never).select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status" as never, "pending_verification"),
      ]);
      setKpi({
        users: u.count ?? 0,
        auditEvents: (audit as { count: number | null }).count ?? 0,
        activeSessions: (sessions as { count: number | null }).count ?? 0,
        impersonations: (imperLog as { count: number | null }).count ?? 0,
      });
      setPendingUsers((pending as { count: number | null }).count ?? 0);

      const { data } = await supabase
        .from("audit_logs" as never)
        .select("id, action, actor_email, created_at")
        .order("created_at", { ascending: false })
        .limit(5) as { data: Array<{ id: string; action: string; actor_email: string | null; created_at: string }> | null };
      setRecentAudit(data ?? []);
    })();
  }, []);

  return (
    <div>
      {isImpersonating && <ImpersonationBanner name={impersonationName} />}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Owner Command Center</h1>
          <p className="mt-1 text-muted-foreground">Full platform visibility and governance controls.</p>
        </div>
        {pendingUsers > 0 && (
          <Link to="/admin/users">
            <Badge className="bg-amber-500 text-white gap-1">
              <Bell className="h-3 w-3" /> {pendingUsers} pending verification
            </Badge>
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Users" value={kpi.users} icon={Users} to="/admin/users" />
        <KpiCard label="Audit Events" value={kpi.auditEvents} icon={ClipboardList} to="/admin/audit" color="text-blue-500" />
        <KpiCard label="Total Sessions" value={kpi.activeSessions} icon={Activity} color="text-green-500" />
        <KpiCard label="Impersonations" value={kpi.impersonations} icon={Eye} color="text-amber-500" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Governance quick links */}
        <div>
          <h2 className="font-display text-xl mb-4">Governance</h2>
          <div className="space-y-3">
            <QuickLink to="/admin/users" label="User Management" icon={Shield} desc="Create, edit, suspend, and impersonate accounts" />
            <QuickLink to="/admin/audit" label="Audit Log" desc="Complete trail of all administrative actions" icon={ClipboardList} />
            <QuickLink to="/admin/permissions" label="Permission Matrix" desc="Fine-tune module access per role" icon={BarChart3} />
          </div>
        </div>

        {/* Recent audit events */}
        <div>
          <h2 className="font-display text-xl mb-4">Recent Actions</h2>
          <Card>
            <CardContent className="pt-4 pb-2">
              {recentAudit.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No events yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentAudit.map((e) => (
                    <div key={e.id} className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-medium capitalize">{e.action.replace(/_/g, " ")}</span>
                        <div className="text-xs text-muted-foreground">{e.actor_email ?? "system"}</div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(e.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl mb-4">Operations Overview</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink to="/admin/leads" label="Leads" icon={Users} desc="Manage incoming inquiries" />
          <QuickLink to="/admin/projects" label="Projects" icon={Building2} desc="All active construction projects" />
          <QuickLink to="/admin/hr" label="HR & Payroll" icon={UserCog} desc="Salaries, leaves, attendance" />
          <QuickLink to="/admin/tickets" label="Support Tickets" icon={MessageSquare} desc="Customer support queue" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const { isImpersonating, impersonationName } = useRole();
  const [kpi, setKpi] = useState({ leads: 0, quotes: 0, projects: 0, tickets: 0, users: 0 });

  useEffect(() => {
    (async () => {
      const [l, q, p, t, u] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("quote_requests").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("tickets").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      setKpi({ leads: l.count ?? 0, quotes: q.count ?? 0, projects: p.count ?? 0, tickets: t.count ?? 0, users: u.count ?? 0 });
    })();
  }, []);

  return (
    <div>
      {isImpersonating && <ImpersonationBanner name={impersonationName} />}
      <h1 className="font-display text-3xl">Admin Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Platform administration and operations management.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total Users" value={kpi.users} icon={Users} to="/admin/users" />
        <KpiCard label="Active Leads" value={kpi.leads} icon={TrendingUp} to="/admin/leads" />
        <KpiCard label="Quote Requests" value={kpi.quotes} icon={FileText} to="/admin/quotes" />
        <KpiCard label="Projects" value={kpi.projects} icon={Building2} to="/admin/projects" />
        <KpiCard label="Open Tickets" value={kpi.tickets} icon={MessageSquare} to="/admin/tickets" />
      </div>
      <div className="mt-10">
        <h2 className="font-display text-xl mb-4">Quick Access</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink to="/admin/leads" label="Lead Pipeline" icon={TrendingUp} desc="Manage incoming inquiries" />
          <QuickLink to="/admin/hr" label="HR & Payroll" icon={UserCog} desc="Staff salaries and leaves" />
          <QuickLink to="/admin/team" label="Team & Roles" icon={Users} desc="View all team members" />
          <QuickLink to="/admin/blog" label="Blog Management" icon={BookOpen} desc="Publish articles and news" />
          <QuickLink to="/admin/messages" label="Messages" icon={Mail} desc="Contact form submissions" />
          <QuickLink to="/admin/testimonials" label="Testimonials" icon={Star} desc="Client reviews" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MANAGING DIRECTOR DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export function ManagingDirectorDashboard() {
  const { isImpersonating, impersonationName } = useRole();
  const [kpi, setKpi] = useState({ projects: 0, totalBudget: 0, leads: 0, teamSize: 0 });
  const [projectsByStatus, setProjectsByStatus] = useState<Array<{ status: string; count: number }>>([]);
  const [recentProjects, setRecentProjects] = useState<Array<{ id: string; name: string; status: string; budget: number | null }>>([]);

  useEffect(() => {
    (async () => {
      const [pRes, profRes, leadsRes, projDetail] = await Promise.all([
        supabase.from("projects").select("id,status,budget"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("projects").select("id,name,status,budget").order("created_at", { ascending: false }).limit(5),
      ]);
      const projects = pRes.data ?? [];
      const totalBudget = projects.reduce((s, p) => s + (p.budget ?? 0), 0);
      const byStatus: Record<string, number> = {};
      projects.forEach((p) => { byStatus[p.status] = (byStatus[p.status] ?? 0) + 1; });
      setProjectsByStatus(Object.entries(byStatus).map(([status, count]) => ({ status, count })));
      setKpi({ projects: projects.length, totalBudget, leads: leadsRes.count ?? 0, teamSize: profRes.count ?? 0 });
      setRecentProjects(projDetail.data ?? []);
    })();
  }, []);

  const STATUS_COLOR: Record<string, string> = {
    planning: "bg-blue-100 text-blue-800",
    in_progress: "bg-amber-100 text-amber-800",
    completed: "bg-green-100 text-green-800",
    on_hold: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div>
      {isImpersonating && <ImpersonationBanner name={impersonationName} />}
      <h1 className="font-display text-3xl">Managing Director Overview</h1>
      <p className="mt-1 text-muted-foreground">Executive view — business performance and strategic metrics.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active Projects" value={kpi.projects} icon={Building2} to="/admin/projects" />
        <KpiCard label="Total Budget (₹)" value={kpi.totalBudget.toLocaleString("en-IN")} icon={DollarSign} color="text-green-500" />
        <KpiCard label="New Leads" value={kpi.leads} icon={TrendingUp} to="/admin/leads" />
        <KpiCard label="Team Size" value={kpi.teamSize} icon={Users} to="/admin/team" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl mb-4">Project Status Breakdown</h2>
          <Card>
            <CardContent className="pt-4 pb-2">
              {projectsByStatus.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No projects yet.</p>
              ) : (
                <div className="space-y-3">
                  {projectsByStatus.map(({ status, count }) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLOR[status] ?? "bg-gray-100 text-gray-800"}`}>
                        {status.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="h-2 rounded-full bg-muted overflow-hidden w-24">
                          <div
                            className="h-full bg-navy rounded-full"
                            style={{ width: `${Math.min(100, (count / kpi.projects) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-4 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="font-display text-xl mb-4">Recent Projects</h2>
          <Card>
            <CardContent className="pt-4 pb-2">
              {recentProjects.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No projects yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentProjects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          ₹{(p.budget ?? 0).toLocaleString("en-IN")}
                        </div>
                      </div>
                      <span className={`text-xs rounded-full px-2 py-0.5 ${STATUS_COLOR[p.status] ?? ""}`}>
                        {p.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl mb-4">Quick Links</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickLink to="/admin/projects" label="All Projects" icon={Building2} desc="Full project pipeline" />
          <QuickLink to="/admin/leads" label="Sales Pipeline" icon={TrendingUp} desc="Lead conversion funnel" />
          <QuickLink to="/admin/quotes" label="Quote Requests" icon={FileText} desc="Pending & sent quotes" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OPERATIONS MANAGER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export function OperationsManagerDashboard() {
  const { isImpersonating, impersonationName } = useRole();
  const [kpi, setKpi] = useState({ activeProjects: 0, openQuotes: 0, openTickets: 0, leads: 0 });
  const [projects, setProjects] = useState<Array<{ id: string; name: string; status: string; location: string | null }>>([]);
  const [tickets, setTickets] = useState<Array<{ id: string; subject: string; priority: string; status: string }>>([]);

  useEffect(() => {
    (async () => {
      const [pRes, qRes, tRes, lRes, projData, tickData] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
        supabase.from("quote_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("tickets").select("id", { count: "exact", head: true }).neq("status", "closed"),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("projects").select("id,name,status,location").in("status", ["in_progress", "planning"]).order("created_at", { ascending: false }).limit(6),
        supabase.from("tickets").select("id,subject,priority,status").neq("status", "closed").order("created_at", { ascending: false }).limit(5),
      ]);
      setKpi({ activeProjects: pRes.count ?? 0, openQuotes: qRes.count ?? 0, openTickets: tRes.count ?? 0, leads: lRes.count ?? 0 });
      setProjects(projData.data ?? []);
      setTickets(tickData.data ?? []);
    })();
  }, []);

  const PRIORITY_COLOR: Record<string, string> = {
    low: "text-gray-500", medium: "text-blue-600", high: "text-orange-600", urgent: "text-red-600"
  };

  return (
    <div>
      {isImpersonating && <ImpersonationBanner name={impersonationName} />}
      <h1 className="font-display text-3xl">Operations Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Real-time operations — projects, quotes, and support status.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active Projects" value={kpi.activeProjects} icon={Building2} to="/admin/projects" />
        <KpiCard label="Pending Quotes" value={kpi.openQuotes} icon={FileText} to="/admin/quotes" color="text-amber-500" />
        <KpiCard label="Open Tickets" value={kpi.openTickets} icon={AlertTriangle} to="/admin/tickets" color="text-red-500" />
        <KpiCard label="New Leads" value={kpi.leads} icon={Users} to="/admin/leads" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl mb-4">Active Projects</h2>
          <Card>
            <CardContent className="pt-4 pb-2">
              {projects.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No active projects.</p> : (
                <div className="divide-y divide-border">
                  {projects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        {p.location && <div className="text-xs text-muted-foreground">{p.location}</div>}
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{p.status.replace("_", " ")}</Badge>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/admin/projects" className="mt-2 flex items-center justify-center py-2 text-xs text-navy hover:underline">View all projects <ChevronRight className="h-3 w-3" /></Link>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="font-display text-xl mb-4">Priority Tickets</h2>
          <Card>
            <CardContent className="pt-4 pb-2">
              {tickets.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No open tickets.</p> : (
                <div className="divide-y divide-border">
                  {tickets.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-3">
                      <div className="text-sm font-medium line-clamp-1 flex-1">{t.subject}</div>
                      <span className={`ml-2 text-xs font-medium capitalize ${PRIORITY_COLOR[t.priority] ?? ""}`}>{t.priority}</span>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/admin/tickets" className="mt-2 flex items-center justify-center py-2 text-xs text-navy hover:underline">View all tickets <ChevronRight className="h-3 w-3" /></Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HR MANAGER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export function HRManagerDashboard() {
  const { isImpersonating, impersonationName } = useRole();
  const [kpi, setKpi] = useState({ totalStaff: 0, pendingLeaves: 0, departments: 0 });
  const [byDept, setByDept] = useState<Array<{ dept: string; count: number }>>([]);
  const [recentStaff, setRecentStaff] = useState<Array<{ id: string; full_name: string | null; department: string | null; created_at: string }>>([]);

  useEffect(() => {
    (async () => {
      const [staffData, leavesRes] = await Promise.all([
        supabase.from("profiles").select("id,full_name,department,created_at,status").neq("status" as never, "pending_verification"),
        supabase.from("staff_leaves" as never).select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const staff = staffData.data ?? [];
      const deptMap: Record<string, number> = {};
      staff.forEach((s) => {
        const d = s.department ?? "Unassigned";
        deptMap[d] = (deptMap[d] ?? 0) + 1;
      });

      setKpi({ totalStaff: staff.length, pendingLeaves: (leavesRes as { count: number | null }).count ?? 0, departments: Object.keys(deptMap).length });
      setByDept(Object.entries(deptMap).map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count));
      setRecentStaff(
        [...staff].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
      );
    })();
  }, []);

  return (
    <div>
      {isImpersonating && <ImpersonationBanner name={impersonationName} />}
      <h1 className="font-display text-3xl">HR Management</h1>
      <p className="mt-1 text-muted-foreground">People operations — staff roster, leaves, and payroll.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total Staff" value={kpi.totalStaff} icon={Users} to="/admin/team" />
        <KpiCard label="Pending Leave Requests" value={kpi.pendingLeaves} icon={CalendarDays} to="/admin/hr" color={kpi.pendingLeaves > 0 ? "text-amber-500" : "text-green-500"} />
        <KpiCard label="Departments" value={kpi.departments} icon={Building2} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl mb-4">Staff by Department</h2>
          <Card>
            <CardContent className="pt-4 pb-2">
              {byDept.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No departments found.</p> : (
                <div className="space-y-3">
                  {byDept.map(({ dept, count }) => (
                    <div key={dept} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{dept}</span>
                      <div className="flex items-center gap-3">
                        <div className="h-2 rounded-full bg-muted w-24">
                          <div className="h-full bg-navy rounded-full" style={{ width: `${Math.min(100, (count / kpi.totalStaff) * 100)}%` }} />
                        </div>
                        <span className="text-sm font-medium w-4 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="font-display text-xl mb-4">Recent Joiners</h2>
          <Card>
            <CardContent className="pt-4 pb-2">
              {recentStaff.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No staff records.</p> : (
                <div className="divide-y divide-border">
                  {recentStaff.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-sm font-medium">{s.full_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{s.department ?? "—"}</div>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl mb-4">Quick Access</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickLink to="/admin/hr" label="Salary Management" icon={DollarSign} desc="Manage staff salaries and records" />
          <QuickLink to="/admin/team" label="Team Directory" icon={UserCog} desc="All staff members and roles" />
          <QuickLink to="/admin/hr" label="Leave Requests" icon={CalendarDays} desc="Review and approve leave requests" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SALES MANAGER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export function SalesManagerDashboard() {
  const { isImpersonating, impersonationName } = useRole();
  const [kpi, setKpi] = useState({ newLeads: 0, quotedLeads: 0, pendingQuotes: 0, acceptedQuotes: 0 });
  const [pipeline, setPipeline] = useState<Array<{ status: string; count: number }>>([]);
  const [recentLeads, setRecentLeads] = useState<Array<{ id: string; name: string; service_interest: string | null; status: string; created_at: string }>>([]);

  useEffect(() => {
    (async () => {
      const [leadData, qNew, qAccepted] = await Promise.all([
        supabase.from("leads").select("id,name,service_interest,status,created_at").order("created_at", { ascending: false }),
        supabase.from("quote_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("quote_requests").select("id", { count: "exact", head: true }).eq("status", "accepted"),
      ]);
      const leads = leadData.data ?? [];
      const byStatus: Record<string, number> = {};
      leads.forEach((l) => { byStatus[l.status] = (byStatus[l.status] ?? 0) + 1; });
      setPipeline(Object.entries(byStatus).map(([status, count]) => ({ status, count })));
      setKpi({
        newLeads: byStatus["new"] ?? 0,
        quotedLeads: byStatus["qualified"] ?? 0,
        pendingQuotes: qNew.count ?? 0,
        acceptedQuotes: qAccepted.count ?? 0,
      });
      setRecentLeads(leads.slice(0, 5));
    })();
  }, []);

  const STATUS_COLOR: Record<string, string> = {
    new: "bg-blue-100 text-blue-800", contacted: "bg-purple-100 text-purple-800",
    qualified: "bg-amber-100 text-amber-800", converted: "bg-green-100 text-green-800",
    lost: "bg-red-100 text-red-800",
  };

  return (
    <div>
      {isImpersonating && <ImpersonationBanner name={impersonationName} />}
      <h1 className="font-display text-3xl">Sales Manager Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Pipeline health — leads, quotes, and conversion metrics.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="New Leads" value={kpi.newLeads} icon={Users} to="/admin/leads" />
        <KpiCard label="Qualified Leads" value={kpi.quotedLeads} icon={Target} to="/admin/leads" color="text-amber-500" />
        <KpiCard label="Pending Quotes" value={kpi.pendingQuotes} icon={FileText} to="/admin/quotes" color="text-blue-500" />
        <KpiCard label="Accepted Quotes" value={kpi.acceptedQuotes} icon={CheckCircle2} to="/admin/quotes" color="text-green-500" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl mb-4">Lead Funnel</h2>
          <Card>
            <CardContent className="pt-4 pb-4">
              {pipeline.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No leads yet.</p> : (
                <div className="space-y-3">
                  {["new", "contacted", "qualified", "converted", "lost"].map((status) => {
                    const count = pipeline.find((p) => p.status === status)?.count ?? 0;
                    const total = pipeline.reduce((s, p) => s + p.count, 0);
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span className={`text-xs rounded-full px-2 py-0.5 w-20 text-center capitalize ${STATUS_COLOR[status]}`}>{status}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted">
                          <div className="h-full bg-navy rounded-full transition-all" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
                        </div>
                        <span className="text-sm font-medium w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="font-display text-xl mb-4">Recent Leads</h2>
          <Card>
            <CardContent className="pt-4 pb-2">
              {recentLeads.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No leads yet.</p> : (
                <div className="divide-y divide-border">
                  {recentLeads.map((l) => (
                    <div key={l.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-sm font-medium">{l.name}</div>
                        <div className="text-xs text-muted-foreground">{l.service_interest ?? "—"}</div>
                      </div>
                      <span className={`text-xs rounded-full px-2 py-0.5 ${STATUS_COLOR[l.status] ?? ""}`}>{l.status}</span>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/admin/leads" className="mt-2 flex items-center justify-center py-2 text-xs text-navy hover:underline">View all leads <ChevronRight className="h-3 w-3" /></Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKETING MANAGER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export function MarketingManagerDashboard() {
  const { isImpersonating, impersonationName } = useRole();
  const [kpi, setKpi] = useState({ publishedPosts: 0, draftPosts: 0, testimonials: 0, newMessages: 0 });
  const [recentPosts, setRecentPosts] = useState<Array<{ id: string; title: string; status: string; created_at: string }>>([]);
  const [recentTesti, setRecentTesti] = useState<Array<{ id: string; name: string; rating: number | null; company: string | null }>>([]);

  useEffect(() => {
    (async () => {
      const [bPub, bDraft, tRes, msgRes, posts, testis] = await Promise.all([
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("testimonials").select("id", { count: "exact", head: true }),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
        supabase.from("blog_posts").select("id,title,status,created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("testimonials").select("id,name,rating,company").order("created_at", { ascending: false }).limit(4),
      ]);
      setKpi({
        publishedPosts: bPub.count ?? 0, draftPosts: bDraft.count ?? 0,
        testimonials: tRes.count ?? 0, newMessages: msgRes.count ?? 0,
      });
      setRecentPosts(posts.data ?? []);
      setRecentTesti(testis.data ?? []);
    })();
  }, []);

  return (
    <div>
      {isImpersonating && <ImpersonationBanner name={impersonationName} />}
      <h1 className="font-display text-3xl">Marketing Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Content, brand presence, and lead generation overview.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Published Posts" value={kpi.publishedPosts} icon={BookOpen} to="/admin/blog" color="text-green-500" />
        <KpiCard label="Draft Posts" value={kpi.draftPosts} icon={FileText} to="/admin/blog" color="text-amber-500" />
        <KpiCard label="Testimonials" value={kpi.testimonials} icon={Star} to="/admin/testimonials" />
        <KpiCard label="Contact Messages" value={kpi.newMessages} icon={Mail} to="/admin/messages" color="text-blue-500" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl mb-4">Recent Blog Posts</h2>
          <Card>
            <CardContent className="pt-4 pb-2">
              {recentPosts.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No posts yet.</p> : (
                <div className="divide-y divide-border">
                  {recentPosts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3">
                      <div className="text-sm font-medium line-clamp-1 flex-1">{p.title}</div>
                      <Badge variant="outline" className={`ml-2 text-xs capitalize ${p.status === "published" ? "border-green-300 text-green-700" : ""}`}>{p.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/admin/blog" className="mt-2 flex items-center justify-center py-2 text-xs text-navy hover:underline">Manage blog <ChevronRight className="h-3 w-3" /></Link>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="font-display text-xl mb-4">Recent Testimonials</h2>
          <Card>
            <CardContent className="pt-4 pb-2">
              {recentTesti.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No testimonials yet.</p> : (
                <div className="divide-y divide-border">
                  {recentTesti.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.company ?? "—"}</div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: t.rating ?? 0 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-gold text-gold" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTANT DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export function AccountantDashboard() {
  const { isImpersonating, impersonationName } = useRole();
  const [kpi, setKpi] = useState({ totalBudget: 0, quotedAmount: 0, pendingQuotes: 0, acceptedQuotes: 0 });
  const [quotes, setQuotes] = useState<Array<{ id: string; name: string; quoted_amount: number | null; status: string; project_type: string | null }>>([]);

  useEffect(() => {
    (async () => {
      const [projData, quoteData, qPending, qAccepted] = await Promise.all([
        supabase.from("projects").select("budget"),
        supabase.from("quote_requests").select("id,name,quoted_amount,status,project_type").order("created_at", { ascending: false }).limit(10),
        supabase.from("quote_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("quote_requests").select("id", { count: "exact", head: true }).eq("status", "accepted"),
      ]);
      const totalBudget = (projData.data ?? []).reduce((s, p) => s + (p.budget ?? 0), 0);
      const acceptedQ = (quoteData.data ?? []).filter((q) => q.status === "accepted");
      const quotedAmount = acceptedQ.reduce((s, q) => s + (q.quoted_amount ?? 0), 0);
      setKpi({ totalBudget, quotedAmount, pendingQuotes: qPending.count ?? 0, acceptedQuotes: qAccepted.count ?? 0 });
      setQuotes(quoteData.data ?? []);
    })();
  }, []);

  const STATUS_COLOR: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800", accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800", quoted: "bg-blue-100 text-blue-800",
  };

  return (
    <div>
      {isImpersonating && <ImpersonationBanner name={impersonationName} />}
      <h1 className="font-display text-3xl">Financial Overview</h1>
      <p className="mt-1 text-muted-foreground">Budget tracking, quote financials, and revenue pipeline.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Project Budget (₹)" value={kpi.totalBudget.toLocaleString("en-IN")} icon={Building2} color="text-blue-500" />
        <KpiCard label="Accepted Quote Value (₹)" value={kpi.quotedAmount.toLocaleString("en-IN")} icon={DollarSign} to="/admin/quotes" color="text-green-500" />
        <KpiCard label="Pending Quotes" value={kpi.pendingQuotes} icon={Clock} to="/admin/quotes" color="text-amber-500" />
        <KpiCard label="Accepted Quotes" value={kpi.acceptedQuotes} icon={CheckCircle2} to="/admin/quotes" color="text-green-500" />
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl mb-4">Quote Financial Summary</h2>
        <Card>
          <CardContent className="pt-4 pb-2">
            {quotes.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No quotes yet.</p> : (
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Client</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Type</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Status</th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q.id} className="border-b border-border last:border-0">
                      <td className="py-2 font-medium">{q.name}</td>
                      <td className="py-2 text-muted-foreground text-xs">{q.project_type ?? "—"}</td>
                      <td className="py-2">
                        <span className={`text-xs rounded-full px-2 py-0.5 ${STATUS_COLOR[q.status] ?? ""}`}>{q.status}</span>
                      </td>
                      <td className="py-2 text-right font-medium">
                        {q.quoted_amount ? q.quoted_amount.toLocaleString("en-IN") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAFF AREA DASHBOARDS (rendered in /staff route)
// ─────────────────────────────────────────────────────────────────────────────

// Shared task kanban for all staff roles
function TaskKanban({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Array<{
    id: string; title: string; status: string;
    priority: string; description: string | null; due_date: string | null;
  }>>([]);

  const load = async () => {
    if (!userId) return;
    const { data } = await supabase.from("staff_tasks").select("*").eq("assigned_to", userId).order("due_date", { ascending: true });
    setRows(data ?? []);
  };

  useEffect(() => { if (userId) load(); }, [userId]);

  const COLUMNS = ["todo", "in_progress", "done"];
  const PRIORITY_COLOR: Record<string, string> = {
    low: "", medium: "", high: "border-orange-300 text-orange-700", urgent: "border-red-300 text-red-700"
  };

  async function advance(id: string, status: string) {
    await supabase.from("staff_tasks").update({ status }).eq("id", id);
    load();
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = rows.filter((r) => r.status === col);
        return (
          <div key={col}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground">{col.replace("_", " ")}</h3>
              <Badge variant="outline" className="text-xs">{items.length}</Badge>
            </div>
            <div className="space-y-3">
              {items.map((t) => (
                <Card key={t.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium">{t.title}</h4>
                    <Badge variant="outline" className={`capitalize text-xs shrink-0 ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</Badge>
                  </div>
                  {t.description && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
                  {t.due_date && (
                    <p className={`mt-2 text-xs ${new Date(t.due_date) < new Date() && t.status !== "done" ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                      Due {new Date(t.due_date).toLocaleDateString()}
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    {col === "todo" && <Button size="sm" variant="outline" onClick={() => advance(t.id, "in_progress")}>Start</Button>}
                    {col !== "done" && <Button size="sm" className="bg-navy text-white text-xs" onClick={() => advance(t.id, "done")}>Complete</Button>}
                    {col === "done" && <Button size="sm" variant="ghost" className="text-xs" onClick={() => advance(t.id, "todo")}>Reopen</Button>}
                  </div>
                </Card>
              ))}
              {items.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-border p-4 text-center text-xs text-muted-foreground">Empty</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SalesExecutiveDashboard() {
  const { userId, isImpersonating, impersonationName } = useRole();
  const [kpi, setKpi] = useState({ myLeads: 0, newLeads: 0, tasksDue: 0 });

  useEffect(() => {
    (async () => {
      const [myL, newL, taskRes] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("assigned_to" as never, userId),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("staff_tasks").select("id", { count: "exact", head: true })
          .eq("assigned_to", userId).neq("status", "done"),
      ]);
      setKpi({ myLeads: myL.count ?? 0, newLeads: newL.count ?? 0, tasksDue: taskRes.count ?? 0 });
    })();
  }, [userId]);

  return (
    <div>
      {isImpersonating && <ImpersonationBanner name={impersonationName} />}
      <h1 className="font-display text-3xl">Sales Executive</h1>
      <p className="mt-1 text-muted-foreground">Your lead pipeline and task board.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <KpiCard label="My Leads" value={kpi.myLeads} icon={Users} color="text-blue-500" />
        <KpiCard label="New Unassigned Leads" value={kpi.newLeads} icon={TrendingUp} color="text-amber-500" />
        <KpiCard label="Open Tasks" value={kpi.tasksDue} icon={ClipboardList} color="text-red-500" />
      </div>
      <div className="mt-10">
        <h2 className="font-display text-xl mb-4">My Task Board</h2>
        <TaskKanban userId={userId} />
      </div>
    </div>
  );
}

export function ProjectManagerDashboard() {
  const { userId, isImpersonating, impersonationName } = useRole();
  const [projects, setProjects] = useState<Array<{ id: string; name: string; status: string; location: string | null }>>([]);
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    (async () => {
      const [projRes, taskRes] = await Promise.all([
        supabase.from("projects").select("id,name,status,location").eq("project_manager_id" as never, userId),
        supabase.from("staff_tasks").select("id", { count: "exact", head: true }).eq("assigned_to", userId).neq("status", "done"),
      ]);
      setProjects(projRes.data ?? []);
      setTaskCount(taskRes.count ?? 0);
    })();
  }, [userId]);

  const STATUS_COLOR: Record<string, string> = {
    planning: "bg-blue-100 text-blue-800", in_progress: "bg-amber-100 text-amber-800",
    completed: "bg-green-100 text-green-800", on_hold: "bg-gray-100 text-gray-800",
  };

  return (
    <div>
      {isImpersonating && <ImpersonationBanner name={impersonationName} />}
      <h1 className="font-display text-3xl">Project Manager</h1>
      <p className="mt-1 text-muted-foreground">Your projects and team coordination.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <KpiCard label="My Projects" value={projects.length} icon={Building2} color="text-blue-500" />
        <KpiCard label="Open Tasks" value={taskCount} icon={ClipboardList} color="text-amber-500" />
      </div>
      {projects.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl mb-4">My Projects</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    {p.location && <div className="text-xs text-muted-foreground mt-0.5">{p.location}</div>}
                  </div>
                  <span className={`text-xs rounded-full px-2 py-0.5 ${STATUS_COLOR[p.status] ?? ""}`}>{p.status.replace("_", " ")}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      <div className="mt-10">
        <h2 className="font-display text-xl mb-4">My Task Board</h2>
        <TaskKanban userId={userId} />
      </div>
    </div>
  );
}

export function SiteEngineerDashboard() {
  const { userId, isImpersonating, impersonationName } = useRole();
  const [taskCount, setTaskCount] = useState({ todo: 0, in_progress: 0, done: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("staff_tasks").select("status").eq("assigned_to", userId);
      const counts = { todo: 0, in_progress: 0, done: 0 };
      (data ?? []).forEach((t) => { counts[t.status as keyof typeof counts] = (counts[t.status as keyof typeof counts] ?? 0) + 1; });
      setTaskCount(counts);
    })();
  }, [userId]);

  return (
    <div>
      {isImpersonating && <ImpersonationBanner name={impersonationName} />}
      <h1 className="font-display text-3xl">Site Engineer</h1>
      <p className="mt-1 text-muted-foreground">Your field assignments and task progress.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <KpiCard label="To Do" value={taskCount.todo} icon={Clock} color="text-blue-500" />
        <KpiCard label="In Progress" value={taskCount.in_progress} icon={Activity} color="text-amber-500" />
        <KpiCard label="Completed" value={taskCount.done} icon={CheckCircle2} color="text-green-500" />
      </div>
      <div className="mt-10">
        <h2 className="font-display text-xl mb-4">My Task Board</h2>
        <TaskKanban userId={userId} />
      </div>
    </div>
  );
}

export function CustomerSupportDashboard() {
  const { userId, isImpersonating, impersonationName } = useRole();
  const [kpi, setKpi] = useState({ assigned: 0, open: 0, tasksDue: 0 });

  useEffect(() => {
    (async () => {
      const [myT, openT, taskRes] = await Promise.all([
        supabase.from("tickets").select("id", { count: "exact", head: true }).eq("assigned_to" as never, userId),
        supabase.from("tickets").select("id", { count: "exact", head: true }).neq("status", "closed"),
        supabase.from("staff_tasks").select("id", { count: "exact", head: true }).eq("assigned_to", userId).neq("status", "done"),
      ]);
      setKpi({ assigned: myT.count ?? 0, open: openT.count ?? 0, tasksDue: taskRes.count ?? 0 });
    })();
  }, [userId]);

  return (
    <div>
      {isImpersonating && <ImpersonationBanner name={impersonationName} />}
      <h1 className="font-display text-3xl">Customer Support</h1>
      <p className="mt-1 text-muted-foreground">Your ticket queue and support tasks.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <KpiCard label="My Tickets" value={kpi.assigned} icon={MessageSquare} color="text-blue-500" />
        <KpiCard label="All Open Tickets" value={kpi.open} icon={AlertTriangle} color="text-red-500" />
        <KpiCard label="Open Tasks" value={kpi.tasksDue} icon={ClipboardList} color="text-amber-500" />
      </div>
      <div className="mt-10">
        <h2 className="font-display text-xl mb-4">My Task Board</h2>
        <TaskKanban userId={userId} />
      </div>
    </div>
  );
}

export function GeneralStaffDashboard() {
  const { userId, role, isImpersonating, impersonationName } = useRole();
  const [taskCount, setTaskCount] = useState({ open: 0, done: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("staff_tasks").select("status").eq("assigned_to", userId);
      const open = (data ?? []).filter((t) => t.status !== "done").length;
      const done = (data ?? []).filter((t) => t.status === "done").length;
      setTaskCount({ open, done });
    })();
  }, [userId]);

  return (
    <div>
      {isImpersonating && <ImpersonationBanner name={impersonationName} />}
      <h1 className="font-display text-3xl capitalize">{role.replace("_", " ")}</h1>
      <p className="mt-1 text-muted-foreground">Your daily tasks and work assignments.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <KpiCard label="Open Tasks" value={taskCount.open} icon={ClipboardList} color="text-amber-500" />
        <KpiCard label="Completed Tasks" value={taskCount.done} icon={CheckCircle2} color="text-green-500" />
      </div>
      <div className="mt-10">
        <h2 className="font-display text-xl mb-4">My Task Board</h2>
        <TaskKanban userId={userId} />
      </div>
    </div>
  );
}
