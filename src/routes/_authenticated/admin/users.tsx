import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PermissionGuard } from "@/components/PermissionGuard";
import { getUsersWithRoles, getAllUserRoles, ownerUpdateUserStatus } from "@/lib/data.functions";
import { inviteUser, sendPasswordReset } from "@/lib/admin-user.functions";
import { ROLE_LABELS, type AppRole } from "@/lib/roles";
import type { UserStatus } from "@/lib/app-types";
import { UserPlus, Key } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: UsersPage });

const ALL_ROLES: AppRole[] = [
  "owner", "admin", "managing_director", "operations_manager", "hr_manager",
  "sales_manager", "sales_executive", "marketing_manager", "accountant",
  "project_manager", "site_engineer", "customer_support", "general_staff", "staff", "customer",
];

function UsersPage() {
  const [users, setUsers] = useState<{ id: string; full_name: string | null; email: string | null; phone: string | null; status: string; created_at: string }[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<string>("customer");
  const [inviteResult, setInviteResult] = useState<{ temporaryPassword: string } | null>(null);

  async function load() {
    try {
      const [us, rs] = await Promise.all([getUsersWithRoles(), getAllUserRoles()]);
      setUsers(us);
      const map: Record<string, string> = {};
      for (const r of rs) map[r.user_id] = r.role;
      setUserRoles(map);
    } catch { toast.error("Failed to load users."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const result = await inviteUser({ data: { email: fd.email as string, name: fd.name as string, role: inviteRole } });
      setInviteResult({ temporaryPassword: result.temporaryPassword });
      toast.success("User invited.");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invite failed.");
    }
  }

  async function handleResetPassword(userId: string, email: string | null) {
    if (!email) return;
    if (!confirm(`Reset password for ${email}? They will be given the default temporary password.`)) return;
    try {
      const result = await sendPasswordReset({ data: { targetEmail: email, targetId: userId } });
      toast.success(`Password reset. Temporary password: ${result.temporaryPassword}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Reset failed.");
    }
  }

  async function handleStatusChange(userId: string, status: UserStatus) {
    try {
      await ownerUpdateUserStatus({ data: { targetUserId: userId, status } });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
      toast.success("Status updated.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  }

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>;

  return (
    <PermissionGuard module="users">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl">Users</h1>
          <Button size="sm" onClick={() => { setInviteOpen(true); setInviteResult(null); }} className="gap-2">
            <UserPlus className="h-4 w-4" /> Invite User
          </Button>
        </div>
        <div className="rounded-lg border bg-card overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users.</td></tr>}
              {users.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{u.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{ROLE_LABELS[userRoles[u.id] as AppRole] ?? userRoles[u.id] ?? "customer"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.status}
                      onChange={e => handleStatusChange(u.id, e.target.value as UserStatus)}
                      className="rounded border bg-background px-2 py-1 text-xs"
                    >
                      {(["active", "inactive", "suspended", "pending_verification"] as UserStatus[]).map(s =>
                        <option key={s} value={s}>{s}</option>
                      )}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs"
                      onClick={() => handleResetPassword(u.id, u.email)}>
                      <Key className="h-3 w-3" /> Reset pw
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
            {inviteResult ? (
              <div className="space-y-3">
                <p className="text-sm text-green-700">User created successfully.</p>
                <div className="rounded bg-muted p-3 font-mono text-sm">
                  Temporary password: <strong>{inviteResult.temporaryPassword}</strong>
                </div>
                <p className="text-xs text-muted-foreground">Share this with the user. They should change it after first login.</p>
                <Button onClick={() => setInviteOpen(false)} className="w-full">Done</Button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-3">
                <div><Label>Full name</Label><Input name="name" required /></div>
                <div><Label>Email</Label><Input name="email" type="email" required /></div>
                <div>
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Create & Invite</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
