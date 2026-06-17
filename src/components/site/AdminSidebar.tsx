import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, FileText, Building2, MessageSquare,
  Star, LogOut, BookOpen, UserCog, CalendarDays, Mail,
  ShieldCheck, ClipboardList, BarChart3, ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useRole } from "@/contexts/RoleContext";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/roles";

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
};

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/leads", label: "Leads", icon: Users },
  { to: "/admin/quotes", label: "Quote Requests", icon: FileText },
  { to: "/admin/projects", label: "Projects", icon: Building2 },
  { to: "/admin/tickets", label: "Tickets", icon: MessageSquare },
  { to: "/admin/testimonials", label: "Testimonials", icon: Star },
  { to: "/admin/blog", label: "Blog", icon: BookOpen },
  { to: "/admin/team", label: "Team & Roles", icon: UserCog },
  { to: "/admin/hr", label: "HR · Salary & Leaves", icon: CalendarDays },
  { to: "/admin/messages", label: "Messages", icon: Mail },
  { to: "/admin/users", label: "User Management", icon: ShieldCheck },
  { to: "/admin/audit", label: "Audit Log", icon: ClipboardList },
  { to: "/admin/permissions", label: "Permission Matrix", icon: BarChart3 },
];

const STAFF_NAV: NavItem[] = [
  { to: "/staff", label: "My Tasks", icon: LayoutDashboard, exact: true },
  { to: "/staff/leaves", label: "My Leaves", icon: CalendarDays },
];

// Which nav items each role can see in the admin area
const ADMIN_ROLE_NAV_MAP: Record<string, string[]> = {
  owner: [
    "/admin","/admin/leads","/admin/quotes","/admin/projects","/admin/tickets",
    "/admin/testimonials","/admin/blog","/admin/team","/admin/hr","/admin/messages",
    "/admin/users","/admin/audit","/admin/permissions",
  ],
  admin: [
    "/admin","/admin/leads","/admin/quotes","/admin/projects","/admin/tickets",
    "/admin/testimonials","/admin/blog","/admin/team","/admin/hr","/admin/messages",
    "/admin/users","/admin/audit","/admin/permissions",
  ],
  managing_director: [
    "/admin","/admin/projects","/admin/quotes","/admin/leads","/admin/hr",
    "/admin/team","/admin/tickets",
  ],
  operations_manager: [
    "/admin","/admin/projects","/admin/quotes","/admin/tickets",
    "/admin/leads","/admin/messages","/admin/team",
  ],
  hr_manager: ["/admin","/admin/hr","/admin/team"],
  sales_manager: ["/admin","/admin/leads","/admin/quotes","/admin/messages"],
  marketing_manager: ["/admin","/admin/blog","/admin/testimonials","/admin/leads","/admin/messages"],
  accountant: ["/admin","/admin/quotes"],
};

export function AdminSidebar({ area }: { area: "admin" | "staff" }) {
  const navigate = useNavigate();
  const { role, isImpersonating } = useRole();

  const navItems = area === "admin" ? ADMIN_NAV : STAFF_NAV;
  const allowedPaths = area === "admin"
    ? (ADMIN_ROLE_NAV_MAP[role] ?? ["/admin"])
    : ["/staff", "/staff/leaves"];

  const filteredItems = navItems.filter((it) => allowedPaths.includes(it.to));

  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <Link
        to="/"
        className="flex items-center gap-2 border-b border-border px-5 py-5"
      >
        <span className="grid h-8 w-8 place-items-center rounded-sm bg-navy text-gold font-display text-sm">
          A
        </span>
        <div className="flex flex-col">
          <span className="font-display text-sm leading-none">Aditya</span>
          <span className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            Operations
          </span>
        </div>
      </Link>

      {/* Role badge */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Badge
          variant="outline"
          className={`text-[10px] uppercase tracking-widest ${
            isImpersonating ? "border-amber-400 text-amber-600" : "border-gold/40 text-gold"
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
