import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
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

const STAFF_AREA_ROLES = [
  "staff","sales_executive","project_manager","site_engineer",
  "customer_support","general_staff",
];

/**
 * Routes to the dedicated dashboard component for the effective role.
 * If the effective role (including impersonated) is a staff-area role,
 * redirects to /staff to enforce "view-as" area isolation.
 */
function AdminDashboardRouter() {
  const { role } = useRole();
  const navigate = useNavigate();

  // Enforce area routing based on effective (impersonated) role.
  // If owner is impersonating a staff-area role and somehow landed on /admin,
  // redirect to /staff so the full staff experience renders correctly.
  useEffect(() => {
    if (STAFF_AREA_ROLES.includes(role)) {
      navigate({ to: "/staff", replace: true });
    }
  }, [role, navigate]);

  // Don't render admin content for staff-area effective roles (even briefly)
  if (STAFF_AREA_ROLES.includes(role)) return null;

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
      // Any other admin-area role: show generic admin dashboard
      return <AdminDashboard />;
  }
}
