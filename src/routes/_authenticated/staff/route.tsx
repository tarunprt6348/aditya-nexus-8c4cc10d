import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/site/AdminSidebar";
import { ImpersonationBanner } from "@/components/site/ImpersonationBanner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const STAFF_AREA_ROLES = [
  "staff","sales_executive","project_manager","site_engineer",
  "customer_support","general_staff",
];
const ADMIN_AREA_ROLES = [
  "owner","admin","managing_director","operations_manager",
  "hr_manager","sales_manager","marketing_manager","accountant",
];

export const Route = createFileRoute("/_authenticated/staff")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    const userRoles = (roles ?? []).map((r) => r.role as string);
    const hasStaff = userRoles.some((r) => STAFF_AREA_ROLES.includes(r));
    const hasAdmin = userRoles.some((r) => ADMIN_AREA_ROLES.includes(r));

    if (!hasStaff && !hasAdmin) throw redirect({ to: "/portal" });

    if (!hasStaff && hasAdmin) {
      const impersonation =
        typeof window !== "undefined"
          ? localStorage.getItem("ac_impersonating")
          : null;
      if (impersonation) {
        const { targetId } = JSON.parse(impersonation) as { targetId: string };
        const { data: targetRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", targetId);
        const targetIsStaff = (targetRoles ?? []).some((r) =>
          STAFF_AREA_ROLES.includes(r.role),
        );
        if (targetIsStaff) return;
      }
      throw redirect({ to: "/admin" });
    }
  },
  component: StaffLayout,
});

function StaffLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <ImpersonationBanner />
      {/* Mobile top bar */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="font-display text-sm">Aditya · Staff</span>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 md:static md:translate-x-0 md:block ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <AdminSidebar area="staff" onNavigate={() => setSidebarOpen(false)} />
        </div>
        <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-6 md:py-7 lg:px-10">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-center" />
    </div>
  );
}
