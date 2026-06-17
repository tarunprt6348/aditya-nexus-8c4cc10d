import { createFileRoute } from "@tanstack/react-router";
import { useRole } from "@/contexts/RoleContext";
import {
  OwnerDashboard,
  AdminDashboard,
  ManagingDirectorDashboard,
  OperationsManagerDashboard,
  HRManagerDashboard,
  SalesManagerDashboard,
  MarketingManagerDashboard,
  AccountantDashboard,
} from "@/components/dashboards/RoleDashboards";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Aditya Constructions" }] }),
  component: AdminDashboardRouter,
});

/**
 * Routes to the dedicated dashboard component for the current role.
 * Each dashboard is a distinct, full-featured view tailored to that role's
 * responsibilities, KPIs, and quick-access patterns.
 */
function AdminDashboardRouter() {
  const { role } = useRole();

  switch (role) {
    case "owner":
      return <OwnerDashboard />;
    case "admin":
      return <AdminDashboard />;
    case "managing_director":
      return <ManagingDirectorDashboard />;
    case "operations_manager":
      return <OperationsManagerDashboard />;
    case "hr_manager":
      return <HRManagerDashboard />;
    case "sales_manager":
      return <SalesManagerDashboard />;
    case "marketing_manager":
      return <MarketingManagerDashboard />;
    case "accountant":
      return <AccountantDashboard />;
    default:
      // Fallback: render the admin dashboard for any unexpected admin-area role
      return <AdminDashboard />;
  }
}
