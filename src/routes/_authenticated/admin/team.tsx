import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PermissionGuard } from "@/components/PermissionGuard";
import { getUsersWithRoles, getAllUserRoles, ownerSetUserRole } from "@/lib/data.functions";
import { ROLE_LABELS, type AppRole } from "@/lib/roles";
import { useRole } from "@/contexts/RoleContext";
import { startImpersonationLog } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/admin/team")({ component: TeamPage });

const ALL_ROLES: AppRole[] = [
  "owner", "admin", "managing_director", "operations_manager", "hr_manager",
  "sales_manager", "sales_executive", "marketing_manager", "accountant",
  "project_manager", "site_engineer", "customer_support", "general_staff", "staff", "customer",
];

function TeamPage() {
  const { role: myRole, userId: myUserId, startImpersonation } = useRole();
  const [users, setUsers] = useState<{ id: string; full_name: string | null; email: string | null; status: string }[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    try {
      const [us, rs] = await Promise.all([getUsersWithRoles(), getAllUserRoles()]);
      setUsers(us);
      const roleMap: Record<string, string> = {};
      for (const r of rs) roleMap[r.user_id] = r.role;
      setUserRoles(roleMap);
    } catch { toast.error("Failed to load team."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleRoleChange(userId: string, role: string) {
    setUpdating(userId);
    try {
      await ownerSetUserRole({ data: { targetUserId: userId, role } });
      setUserRoles(prev => ({ ...prev, [userId]: role }));
      toast.success("Role updated.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    } finally { setUpdating(null); }
  }

  async function handleImpersonate(userId: string, email: string | null, name: string | null) {
    if (userId === myUserId) return toast.error("Can't impersonate yourself.");
    await startImpersonation(userId, email ?? "", name ?? "Unknown");
    toast.success(`Now viewing as ${name}.`);
  }

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>;

  return (
    <PermissionGuard module="team">
      <div className="p-6">
        <h1 className="mb-6 font-display text-2xl">Team Management</h1>
        <div className="rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                {myRole === "owner" && <th className="px-4 py-3 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users.</td></tr>}
              {users.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{u.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    {myRole === "owner" ? (
                      <Select
                        value={userRoles[u.id] ?? "customer"}
                        onValueChange={v => handleRoleChange(u.id, v)}
                        disabled={updating === u.id}
                      >
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="capitalize">{ROLE_LABELS[userRoles[u.id] as AppRole] ?? userRoles[u.id] ?? "customer"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{u.status}</td>
                  {myRole === "owner" && (
                    <td className="px-4 py-3">
                      {u.id !== myUserId && (
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => handleImpersonate(u.id, u.email, u.full_name)}>
                          View as
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PermissionGuard>
  );
}
