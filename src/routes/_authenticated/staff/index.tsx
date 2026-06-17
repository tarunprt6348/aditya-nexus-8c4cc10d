import { createFileRoute } from "@tanstack/react-router";
import { useRole } from "@/contexts/RoleContext";
import {
  SalesExecutiveDashboard,
  ProjectManagerDashboard,
  SiteEngineerDashboard,
  CustomerSupportDashboard,
  GeneralStaffDashboard,
} from "@/components/dashboards/RoleDashboards";

export const Route = createFileRoute("/_authenticated/staff/")({
  head: () => ({ meta: [{ title: "Staff Dashboard — Aditya Constructions" }] }),
  component: StaffDashboardRouter,
});

/**
 * Routes to the dedicated dashboard component for the current staff role.
 * Each dashboard presents role-relevant data: leads for sales executives,
 * projects for project managers, tickets for customer support, etc.
 * Works correctly with impersonation — uses `useRole().userId` for data queries.
 */
function StaffDashboardRouter() {
  const { role } = useRole();

  switch (role) {
    case "sales_executive":
      return <SalesExecutiveDashboard />;
    case "project_manager":
      return <ProjectManagerDashboard />;
    case "site_engineer":
      return <SiteEngineerDashboard />;
    case "customer_support":
      return <CustomerSupportDashboard />;
    case "general_staff":
    case "staff":
    default:
      return <GeneralStaffDashboard />;
  }
}
