import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getStoredToken } from "@/integrations/auth/client";
import { getMe } from "@/lib/auth.functions";
import { AdminLayout } from "@/components/layout/AdminLayout";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const token = getStoredToken();
    if (!token) throw redirect({ to: "/auth" });

    const me = await getMe();
    if (!me) throw redirect({ to: "/auth" });

    const ADMIN_ROLES = [
      "owner", "admin", "managing_director", "operations_manager",
      "hr_manager", "sales_manager", "marketing_manager", "accountant",
    ];
    const hasAdminRole = (me.roles ?? []).some(r => ADMIN_ROLES.includes(r));
    if (!hasAdminRole) {
      // Route staff/customers to their correct portal
      const staffRoles = ["staff", "sales_executive", "project_manager", "site_engineer", "customer_support", "general_staff"];
      if ((me.roles ?? []).some(r => staffRoles.includes(r))) throw redirect({ to: "/staff" });
      throw redirect({ to: "/portal" });
    }

    return {};
  },
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
});
