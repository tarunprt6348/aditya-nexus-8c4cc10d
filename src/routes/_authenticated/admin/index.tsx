import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { ROLE_LABELS } from "@/lib/roles";
import {
  Users, FileText, Building2, MessageSquare,
  TrendingUp, Star, BookOpen, DollarSign, Shield,
  UserCog, ClipboardList, BarChart3, Bell,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Aditya Constructions" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { role, isImpersonating, impersonationName } = useRole();
  const [k, setK] = useState({ leads: 0, quotes: 0, projects: 0, tickets: 0, users: 0 });

  useEffect(() => {
    (async () => {
      const [l, q, p, t, u] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("quote_requests").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("tickets").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      setK({
        leads: l.count ?? 0,
        quotes: q.count ?? 0,
        projects: p.count ?? 0,
        tickets: t.count ?? 0,
        users: u.count ?? 0,
      });
    })();
  }, []);

  const roleLabel = ROLE_LABELS[role] ?? role;

  // Role-specific cards
  const cardsByRole: Record<string, Array<{ label: string; v: number; Icon: React.ElementType; to: string }>> = {
    owner: [
      { label: "Total Users", v: k.users, Icon: Shield, to: "/admin/users" },
      { label: "Active Leads", v: k.leads, Icon: Users, to: "/admin/leads" },
      { label: "Quote Requests", v: k.quotes, Icon: FileText, to: "/admin/quotes" },
      { label: "Projects", v: k.projects, Icon: Building2, to: "/admin/projects" },
      { label: "Support Tickets", v: k.tickets, Icon: MessageSquare, to: "/admin/tickets" },
    ],
    admin: [
      { label: "Total Users", v: k.users, Icon: Shield, to: "/admin/users" },
      { label: "Active Leads", v: k.leads, Icon: Users, to: "/admin/leads" },
      { label: "Quote Requests", v: k.quotes, Icon: FileText, to: "/admin/quotes" },
      { label: "Projects", v: k.projects, Icon: Building2, to: "/admin/projects" },
      { label: "Support Tickets", v: k.tickets, Icon: MessageSquare, to: "/admin/tickets" },
    ],
    managing_director: [
      { label: "Projects", v: k.projects, Icon: Building2, to: "/admin/projects" },
      { label: "Leads", v: k.leads, Icon: TrendingUp, to: "/admin/leads" },
      { label: "Quotes", v: k.quotes, Icon: FileText, to: "/admin/quotes" },
      { label: "Tickets", v: k.tickets, Icon: MessageSquare, to: "/admin/tickets" },
    ],
    operations_manager: [
      { label: "Projects", v: k.projects, Icon: Building2, to: "/admin/projects" },
      { label: "Quotes", v: k.quotes, Icon: FileText, to: "/admin/quotes" },
      { label: "Leads", v: k.leads, Icon: Users, to: "/admin/leads" },
      { label: "Tickets", v: k.tickets, Icon: MessageSquare, to: "/admin/tickets" },
    ],
    hr_manager: [
      { label: "Team Members", v: k.users, Icon: UserCog, to: "/admin/team" },
    ],
    sales_manager: [
      { label: "Active Leads", v: k.leads, Icon: Users, to: "/admin/leads" },
      { label: "Quote Requests", v: k.quotes, Icon: FileText, to: "/admin/quotes" },
    ],
    marketing_manager: [
      { label: "Leads", v: k.leads, Icon: TrendingUp, to: "/admin/leads" },
    ],
    accountant: [
      { label: "Quote Requests", v: k.quotes, Icon: DollarSign, to: "/admin/quotes" },
    ],
  };

  const cards = cardsByRole[role] ?? [
    { label: "Leads", v: k.leads, Icon: Users, to: "/admin/leads" },
    { label: "Quotes", v: k.quotes, Icon: FileText, to: "/admin/quotes" },
    { label: "Projects", v: k.projects, Icon: Building2, to: "/admin/projects" },
    { label: "Tickets", v: k.tickets, Icon: MessageSquare, to: "/admin/tickets" },
  ];

  // Quick access links per role
  const quickLinks: Record<string, Array<{ to: string; label: string; icon: React.ElementType; desc: string }>> = {
    owner: [
      { to: "/admin/users", label: "User Management", icon: Shield, desc: "Create, edit, suspend users" },
      { to: "/admin/audit", label: "Audit Log", icon: ClipboardList, desc: "View all system actions" },
      { to: "/admin/permissions", label: "Permissions", icon: BarChart3, desc: "Configure role access" },
      { to: "/admin/hr", label: "HR Module", icon: UserCog, desc: "Salaries & leave management" },
    ],
    admin: [
      { to: "/admin/users", label: "User Management", icon: Shield, desc: "Create, edit, suspend users" },
      { to: "/admin/audit", label: "Audit Log", icon: ClipboardList, desc: "View all system actions" },
      { to: "/admin/permissions", label: "Permissions", icon: BarChart3, desc: "Configure role access" },
      { to: "/admin/hr", label: "HR Module", icon: UserCog, desc: "Salaries & leave management" },
    ],
    hr_manager: [
      { to: "/admin/hr", label: "HR & Salaries", icon: UserCog, desc: "Manage staff salaries" },
      { to: "/admin/team", label: "Team", icon: Users, desc: "View all team members" },
    ],
    sales_manager: [
      { to: "/admin/leads", label: "Lead Pipeline", icon: TrendingUp, desc: "Manage incoming leads" },
      { to: "/admin/quotes", label: "Quote Requests", icon: FileText, desc: "Review & send quotes" },
    ],
    marketing_manager: [
      { to: "/admin/blog", label: "Blog Posts", icon: BookOpen, desc: "Write & publish articles" },
      { to: "/admin/testimonials", label: "Testimonials", icon: Star, desc: "Manage client reviews" },
    ],
  };

  const links = quickLinks[role] ?? [];

  return (
    <div>
      {isImpersonating && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You are viewing this dashboard as <strong>{impersonationName}</strong>
        </div>
      )}

      <h1 className="font-display text-3xl">
        {roleLabel} Dashboard
      </h1>
      <p className="mt-1 text-muted-foreground">
        Welcome back. Here's your operational overview.
      </p>

      {/* Metric Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, v, Icon, to }) => (
          <Link key={label} to={to}>
            <Card className="transition-shadow hover:shadow-md cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
                <Icon className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="font-display text-3xl">{v}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Access */}
      {links.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl mb-4">Quick Access</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {links.map(({ to, label, icon: Icon, desc }) => (
              <Link key={to} to={to}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-navy/10 p-2">
                        <Icon className="h-5 w-5 text-navy" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Owner: Role Matrix Summary */}
      {(role === "owner" || role === "admin") && (
        <div className="mt-10">
          <h2 className="font-display text-xl mb-4">Platform Overview</h2>
          <Card>
            <CardContent className="pt-6 pb-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Active Users", v: k.users, icon: Users },
                  { label: "Open Leads", v: k.leads, icon: TrendingUp },
                  { label: "Open Tickets", v: k.tickets, icon: Bell },
                ].map(({ label, v, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="rounded-full bg-muted p-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-display text-2xl">{v}</div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
