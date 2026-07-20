import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/PermissionGuard";
import { getUsersWithRoles, getAllUserRoles } from "@/lib/data.functions";
import { ROLE_LABELS, type AppRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin/employees")({ component: EmployeesPage });

const STAFF_ROLES = new Set<AppRole>([
  "managing_director", "operations_manager", "hr_manager", "sales_manager",
  "sales_executive", "marketing_manager", "accountant", "project_manager",
  "site_engineer", "customer_support", "general_staff", "staff", "admin", "owner",
]);

function EmployeesPage() {
  const [employees, setEmployees] = useState<{ id: string; full_name: string | null; email: string | null; status: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUsersWithRoles(), getAllUserRoles()])
      .then(([users, roles]) => {
        const roleMap: Record<string, string> = {};
        for (const r of roles) roleMap[r.user_id] = r.role;
        setEmployees(users
          .filter(u => STAFF_ROLES.has(roleMap[u.id] as AppRole))
          .map(u => ({ ...u, role: roleMap[u.id] ?? "staff" })));
      })
      .catch(() => toast.error("Failed to load employees."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>;

  return (
    <PermissionGuard module="employees">
      <div className="p-6">
        <h1 className="mb-6 font-display text-2xl">Employees ({employees.length})</h1>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {employees.length === 0 && <p className="col-span-full text-muted-foreground">No employees found.</p>}
          {employees.map(e => (
            <div key={e.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/10 font-display text-lg font-bold text-navy">
                  {(e.full_name ?? "U")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{e.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{e.email ?? "—"}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="capitalize text-muted-foreground">{ROLE_LABELS[e.role as AppRole] ?? e.role}</span>
                <span className={`rounded-full px-2 py-0.5 font-medium ${e.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                  {e.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PermissionGuard>
  );
}
