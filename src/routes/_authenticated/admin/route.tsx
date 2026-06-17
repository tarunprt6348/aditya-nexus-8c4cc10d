import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/site/AdminSidebar";
import { ImpersonationBanner } from "@/components/site/ImpersonationBanner";
import { Toaster } from "@/components/ui/sonner";

const ADMIN_AREA_ROLES = [
  "owner","admin","managing_director","operations_manager",
  "hr_manager","sales_manager","marketing_manager","accountant",
];
const STAFF_AREA_ROLES = [
  "staff","sales_executive","project_manager","site_engineer",
  "customer_support","general_staff",
];

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    const userRoles = (roles ?? []).map((r) => r.role as string);
    const hasAccess = userRoles.some((r) => ADMIN_AREA_ROLES.includes(r));
    if (!hasAccess) throw redirect({ to: "/portal" });

    // Impersonation area enforcement:
    // If the owner is impersonating a staff-area role, the effective "view-as"
    // experience must be the staff area — redirect them there instead.
    if (typeof window !== "undefined") {
      const impersonation = localStorage.getItem("ac_impersonating");
      if (impersonation && userRoles.includes("owner")) {
        const { targetId } = JSON.parse(impersonation) as { targetId: string };
        const { data: targetRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", targetId);
        const targetIsStaff = (targetRoles ?? []).some((r) =>
          STAFF_AREA_ROLES.includes(r.role),
        );
        if (targetIsStaff) throw redirect({ to: "/staff" });
      }
    }
  },
  component: () => (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <ImpersonationBanner />
      <div className="flex flex-1">
        <AdminSidebar area="admin" />
        <main className="flex-1 px-6 py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-center" />
    </div>
  ),
});
