import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/site/AdminSidebar";
import { ImpersonationBanner } from "@/components/site/ImpersonationBanner";
import { Toaster } from "@/components/ui/sonner";

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

    // Admin-area users trying to reach /staff:
    // Allow through ONLY if they are actively impersonating a staff-area role
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
        if (targetIsStaff) return; // let the owner see the staff area as the impersonated user
      }
      // Not impersonating or target is not a staff role → redirect to admin
      throw redirect({ to: "/admin" });
    }
  },
  component: () => (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <ImpersonationBanner />
      <div className="flex flex-1">
        <AdminSidebar area="staff" />
        <main className="flex-1 px-6 py-8 lg:px-10">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-center" />
    </div>
  ),
});
