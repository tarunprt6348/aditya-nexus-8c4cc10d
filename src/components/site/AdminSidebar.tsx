import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, FileText, Building2, MessageSquare,
  Star, LogOut, BookOpen, UserCog, CalendarDays, Mail,
  ShieldCheck, ClipboardList, BarChart3, ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { supabase } from "@/integrations/supabase/client";
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

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, module: "dashboard" },
  { to: "/admin/leads", label: "Leads", icon: Users, module: "leads" },
  { to: "/admin/quotes", label: "Quote Requests", icon: FileText, module: "quotes" },
  { to: "/admin/projects", label: "Projects", icon: Building2, module: "projects" },
  { to: "/admin/tickets", label: "Tickets", icon: MessageSquare, module: "tickets" },
  { to: "/admin/testimonials", label: "Testimonials", icon: Star, module: "testimonials" },
  { to: "/admin/blog", label: "Blog", icon: BookOpen, module: "blog" },
  { to: "/admin/team", label: "Team & Roles", icon: UserCog, module: "team" },
  { to: "/admin/hr", label: "HR · Salary & Leaves", icon: CalendarDays, module: "hr" },
  { to: "/admin/messages", label: "Messages", icon: Mail, module: "messages" },
  { to: "/admin/users", label: "User Management", icon: ShieldCheck, module: "users", ownerOnly: true },
  { to: "/admin/audit", label: "Audit Log", icon: ClipboardList, module: "audit", ownerOnly: true },
  { to: "/admin/permissions", label: "Permission Matrix", icon: BarChart3, module: "permissions", ownerOnly: true },
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

  const navItems = area === "admin" ? ADMIN_NAV : STAFF_NAV;

  const filteredItems = navItems.filter((it) => {
    if (it.ownerOnly) return role === "owner";
    return it.module === "dashboard" || can(it.module);
  });

  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-card">
      <Link
        to="/"
        className="flex items-center gap-3 border-b border-border px-4 py-4"
        onClick={onNavigate}
      >
        <Logo className="h-9 w-auto shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="font-display text-sm leading-none truncate">Aditya Constructions</span>
          <span className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            {area === "admin" ? "Operations Portal" : "Staff Portal"}
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Badge
          variant="outline"
          className={`text-[10px] uppercase tracking-widest ${
            isImpersonating
              ? "border-amber-400 text-amber-600"
              : "border-gold/40 text-gold"
          }`}
        >
          {roleLabel}
        </Badge>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {filteredItems.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={{ exact: it.exact ?? false }}
              className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-navy [&.active]:text-gold"
              onClick={onNavigate}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{it.label}</span>
              <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50 group-[.active]:opacity-100" />
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/" });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
