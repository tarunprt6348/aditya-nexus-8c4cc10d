import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, FileText, Building2, MessageSquare,
  Star, LogOut, BookOpen, UserCog, CalendarDays, Mail,
  ShieldCheck, ClipboardList, BarChart3, ChevronRight,
  Briefcase, Truck, Package, Wrench, DollarSign, ShoppingCart,
  FolderOpen, Camera, CheckSquare, AlertTriangle, Calendar,
  HardHat, Settings, UserCheck, BarChart2,
} from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { clearSession } from "@/integrations/auth/client";
import { Button } from "@/components/ui/button";
import { useRole } from "@/contexts/RoleContext";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/roles";
import type { Module } from "@/lib/permissions";

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  module: Module;
  ownerOnly?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, module: "dashboard" },
      { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart2, module: "reports" },
      { to: "/admin/scheduling", label: "Scheduling", icon: Calendar, module: "scheduling" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/admin/projects", label: "Projects", icon: Building2, module: "projects" },
      { to: "/admin/site-monitoring", label: "Site Monitoring", icon: Camera, module: "site_monitoring" },
      { to: "/admin/quality", label: "Quality Control", icon: CheckSquare, module: "quality" },
      { to: "/admin/safety", label: "Safety Management", icon: HardHat, module: "safety" },
    ],
  },
  {
    label: "People & CRM",
    items: [
      { to: "/admin/leads", label: "Leads", icon: Users, module: "leads" },
      { to: "/admin/clients", label: "Client Management", icon: Briefcase, module: "clients" },
      { to: "/admin/employees", label: "Employees", icon: UserCheck, module: "employees" },
      { to: "/admin/hr", label: "HR · Salary & Leaves", icon: CalendarDays, module: "hr" },
      { to: "/admin/team", label: "Team & Roles", icon: UserCog, module: "team" },
      { to: "/admin/vendors", label: "Contractors & Vendors", icon: Truck, module: "vendors" },
    ],
  },
  {
    label: "Finance & Supply",
    items: [
      { to: "/admin/finance", label: "Financial Management", icon: DollarSign, module: "finance" },
      { to: "/admin/procurement", label: "Procurement", icon: ShoppingCart, module: "procurement" },
      { to: "/admin/materials", label: "Materials", icon: Package, module: "materials" },
      { to: "/admin/equipment", label: "Equipment", icon: Wrench, module: "equipment" },
    ],
  },
  {
    label: "Sales & Support",
    items: [
      { to: "/admin/quotes", label: "Quote Requests", icon: FileText, module: "quotes" },
      { to: "/admin/tickets", label: "Support Tickets", icon: MessageSquare, module: "tickets" },
      { to: "/admin/messages", label: "Messages", icon: Mail, module: "messages" },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/blog", label: "Blog", icon: BookOpen, module: "blog" },
      { to: "/admin/testimonials", label: "Testimonials", icon: Star, module: "testimonials" },
      { to: "/admin/documents", label: "Documents", icon: FolderOpen, module: "documents" },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/admin/users", label: "User Management", icon: ShieldCheck, module: "users", ownerOnly: true },
      { to: "/admin/audit", label: "Audit Log", icon: ClipboardList, module: "audit", ownerOnly: true },
      { to: "/admin/permissions", label: "Permission Matrix", icon: BarChart3, module: "permissions", ownerOnly: true },
      { to: "/admin/system", label: "System Settings", icon: Settings, module: "system", ownerOnly: true },
    ],
  },
];

const STAFF_NAV: NavItem[] = [
  { to: "/staff", label: "My Tasks", icon: LayoutDashboard, exact: true, module: "tasks" },
  { to: "/staff/leaves", label: "My Leaves", icon: CalendarDays, module: "leaves" },
];

export function AdminSidebar({
  area,
  onNavigate,
}: {
  area: "admin" | "staff";
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const { role, can, isImpersonating } = useRole();
  const roleLabel = ROLE_LABELS[role] ?? role;

  if (area === "staff") {
    return (
      <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-card">
        <Link to="/" className="flex items-center gap-3 border-b border-border px-4 py-4" onClick={onNavigate}>
          <Logo className="h-9 w-auto shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-display text-sm leading-none truncate">Aditya Constructions</span>
            <span className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">Staff Portal</span>
          </div>
        </Link>
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-gold/40 text-gold">{roleLabel}</Badge>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {STAFF_NAV.map((it) => {
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to} activeOptions={{ exact: it.exact ?? false }}
                className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-navy [&.active]:text-gold"
                onClick={onNavigate}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{it.label}</span>
                <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50 group-[.active]:opacity-100" />
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => { clearSession(); navigate({ to: "/" }); }}>
            <LogOut className="mr-2 h-4 w-4" />Sign out
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-card">
      <Link to="/" className="flex items-center gap-3 border-b border-border px-4 py-4" onClick={onNavigate}>
        <Logo className="h-9 w-auto shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="font-display text-sm leading-none truncate">Aditya Constructions</span>
          <span className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">Operations Portal</span>
        </div>
      </Link>

      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Badge variant="outline" className={`text-[10px] uppercase tracking-widest ${isImpersonating ? "border-amber-400 text-amber-600" : "border-gold/40 text-gold"}`}>
          {roleLabel}
        </Badge>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {ADMIN_NAV_GROUPS.map((group) => {
          const visible = group.items.filter((it) => {
            if (it.ownerOnly) return role === "owner";
            return it.module === "dashboard" || can(it.module);
          });
          if (!visible.length) return null;
          return (
            <div key={group.label} className="mb-3">
              <p className="mb-1 px-3 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visible.map((it) => {
                  const Icon = it.icon;
                  return (
                    <Link key={it.to} to={it.to} activeOptions={{ exact: it.exact ?? false }}
                      className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-navy [&.active]:text-gold"
                      onClick={onNavigate}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-xs">{it.label}</span>
                      <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50 group-[.active]:opacity-100" />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => { clearSession(); navigate({ to: "/" }); }}>
          <LogOut className="mr-2 h-4 w-4" />Sign out
        </Button>
      </div>
    </aside>
  );
}
