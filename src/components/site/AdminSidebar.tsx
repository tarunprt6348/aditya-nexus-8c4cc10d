import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, FileText, Building2, MessageSquare, Star, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/leads", label: "Leads", icon: Users },
  { to: "/admin/quotes", label: "Quote Requests", icon: FileText },
  { to: "/admin/projects", label: "Projects", icon: Building2 },
  { to: "/admin/tickets", label: "Tickets", icon: MessageSquare },
  { to: "/admin/testimonials", label: "Testimonials", icon: Star },
] as const;

export function AdminSidebar({ kind = "admin" }: { kind?: "admin" | "staff" }) {
  const navigate = useNavigate();
  const links = kind === "admin"
    ? items
    : [
        { to: "/staff", label: "My Tasks", icon: LayoutDashboard },
        { to: "/staff/projects", label: "Projects", icon: Building2 },
      ] as const;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <Link to="/" className="flex items-center gap-2 border-b border-border px-5 py-5">
        <span className="grid h-8 w-8 place-items-center rounded-sm bg-navy text-gold font-display">A</span>
        <span className="font-display text-sm">Aditya · {kind === "admin" ? "Admin" : "Staff"}</span>
      </Link>
      <nav className="flex-1 space-y-1 p-3">
        {links.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={{ exact: it.to === "/admin" || it.to === "/staff" }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground [&.active]:bg-navy [&.active]:text-gold"
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </aside>
  );
}
