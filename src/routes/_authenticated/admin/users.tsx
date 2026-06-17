import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { ROLE_LABELS, logAudit, type AppRole } from "@/lib/roles";
import { inviteUser, sendPasswordReset } from "@/lib/admin-user.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Search, Eye, UserX, UserCheck, Edit2, Plus, KeyRound, Clock, Monitor, Copy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "User Management — Aditya Constructions" }] }),
  // Owner-only: admin role cannot access user management
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: ok } = await supabase.rpc("has_role", {
      _user_id: u.user.id,
      _role: "owner" as AppRole,
    });
    if (!ok) throw redirect({ to: "/admin" });
  },
  component: UserManagement,
});

type UserStatus = "active" | "inactive" | "suspended" | "pending_verification";

interface UserRecord {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  status: UserStatus;
  last_seen: string | null;
  created_at: string;
  roles: AppRole[];
}

interface SessionRecord {
  id: string;
  user_id: string;
  user_agent: string | null;
  device_type: string | null;
  created_at: string;
  last_seen: string;
  is_active: boolean;
}

const ALL_ROLES: AppRole[] = [
  "owner","admin","managing_director","operations_manager","hr_manager",
  "sales_manager","marketing_manager","accountant","sales_executive",
  "project_manager","site_engineer","customer_support","general_staff",
  "staff","customer",
];

const STATUS_COLORS: Record<UserStatus, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  suspended: "bg-red-100 text-red-800",
  pending_verification: "bg-yellow-100 text-yellow-800",
};

const ROLE_PRIORITY: AppRole[] = [
  "owner","admin","managing_director","operations_manager","hr_manager",
  "sales_manager","marketing_manager","accountant","sales_executive",
  "project_manager","site_engineer","customer_support","general_staff","staff","customer",
];

function primaryRole(u: UserRecord): AppRole {
  for (const r of ROLE_PRIORITY) {
    if (u.roles.includes(r)) return r;
  }
  return "customer";
}

function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [filtered, setFiltered] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [editRole, setEditRole] = useState<AppRole>("customer");
  const [editStatus, setEditStatus] = useState<UserStatus>("active");
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("staff");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const { realUserId, startImpersonation } = useRole();

  const load = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, phone, created_at")
      .order("created_at", { ascending: false });

    if (!profiles) { setLoading(false); return; }

    const { data: allRoles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const roleMap: Record<string, AppRole[]> = {};
    (allRoles ?? []).forEach((r) => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role as AppRole);
    });

    setUsers(
      profiles.map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: null,
        phone: p.phone,
        department: null,
        status: "active" as UserStatus,
        last_seen: null,
        created_at: p.created_at,
        roles: roleMap[p.id] ?? ["customer"],
      })),
    );
    setLoading(false);
  };

  const loadSessions = async (userId: string) => {
    const { data } = await supabase
      .from("user_sessions" as never)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20) as { data: SessionRecord[] | null };
    setSessions(data ?? []);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.department?.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") result = result.filter((u) => u.status === statusFilter);
    if (roleFilter !== "all") result = result.filter((u) => u.roles.includes(roleFilter as AppRole));
    setFiltered(result);
  }, [search, statusFilter, roleFilter, users]);

  async function saveEdit() {
    if (!editUser) return;
    const { data: actor } = await supabase.auth.getUser();
    if (!actor.user) return;

    // Use secure owner-gated RPCs to mutate role and status
    const { error: roleErr } = await supabase.rpc("owner_set_user_role" as never, {
      _target: editUser.id,
      _role: editRole,
    } as never);
    if (roleErr) return toast.error("Failed to update role: " + roleErr.message);

    const { error: statusErr } = await supabase.rpc("owner_update_user_status" as never, {
      _target: editUser.id,
      _status: editStatus,
    } as never);
    if (statusErr) return toast.error("Failed to update status: " + statusErr.message);

    await logAudit({
      actorId: actor.user.id,
      actorEmail: actor.user.email ?? "",
      action: "user_updated",
      targetType: "user",
      targetId: editUser.id,
      targetEmail: editUser.email ?? undefined,
      metadata: { newRole: editRole, newStatus: editStatus },
    });

    toast.success("User updated.");
    setEditUser(null);
    load();
  }

  async function toggleSuspend(user: UserRecord) {
    const { data: actor } = await supabase.auth.getUser();
    const newStatus: UserStatus = user.status === "suspended" ? "active" : "suspended";
    const { error } = await supabase.rpc("owner_update_user_status" as never, {
      _target: user.id,
      _status: newStatus,
    } as never);
    if (error) return toast.error(error.message);

    if (actor.user) {
      await logAudit({
        actorId: actor.user.id,
        actorEmail: actor.user.email ?? "",
        action: newStatus === "suspended" ? "user_suspended" : "user_reactivated",
        targetType: "user",
        targetId: user.id,
        targetEmail: user.email ?? undefined,
      });
    }
    toast.success(`User ${newStatus === "suspended" ? "suspended" : "reactivated"}.`);
    load();
  }

  async function createUser() {
    if (!inviteEmail || !inviteName) return toast.error("Fill in all fields.");
    setInviting(true);
    try {
      // actorId/actorEmail are NOT sent — server derives them from the JWT
      const result = await inviteUser({
        data: {
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
        },
      });
      setInviteLink(result.inviteLink);
      toast.success(`${inviteName} created as ${ROLE_LABELS[inviteRole]}.`);
      setInviteEmail("");
      setInviteName("");
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setInviting(false);
    }
  }

  async function handlePasswordReset(user: UserRecord) {
    if (!user.email) return;
    try {
      // actor is verified server-side from JWT; only targetEmail/targetId needed
      const result = await sendPasswordReset({
        data: {
          targetEmail: user.email,
          targetId: user.id,
        },
      });
      if (result.resetLink) {
        await navigator.clipboard.writeText(result.resetLink);
        toast.success("Password reset link copied to clipboard.", { duration: 5000 });
      } else {
        toast.success("Password reset email sent to " + user.email);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset.");
    }
  }

  async function handleImpersonate(user: UserRecord) {
    await startImpersonation(
      user.id,
      user.email ?? `${user.full_name ?? user.id}`,
      user.full_name ?? user.id,
    );
    toast.success(`Now viewing as ${user.full_name ?? "user"}`);
  }

  async function openSessionHistory(user: UserRecord) {
    setSelectedUser(user);
    await loadSessions(user.id);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">User Management</h1>
          <p className="mt-1 text-muted-foreground">
            {users.length} users · Create, edit, suspend, and impersonate accounts.
          </p>
        </div>

        {/* Create User — server-side via service role (no session disruption) */}
        <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) setInviteLink(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-navy text-white hover:bg-navy/90">
              <Plus className="mr-2 h-4 w-4" /> Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            {inviteLink ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  User created. Copy the one-time invite link below and share it securely. It lets the user set their password without needing an email from Supabase.
                </p>
                <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
                  <code className="flex-1 break-all text-xs">{inviteLink}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success("Copied!"); }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="w-full" variant="outline" onClick={() => { setInviteOpen(false); setInviteLink(null); }}>Done</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div><Label>Full Name</Label><Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} /></div>
                <div><Label>Email</Label><Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} /></div>
                <div>
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map((r) => (<SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  User is created server-side (owner session is preserved). A one-time invite link is generated for secure onboarding.
                </p>
                <Button className="w-full bg-navy text-white" onClick={createUser} disabled={inviting}>
                  {inviting ? "Creating…" : "Create User & Get Invite Link"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending_verification">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ALL_ROLES.map((r) => (<SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* User table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Seen</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const pr = primaryRole(u);
                const isSelf = u.id === realUserId;
                return (
                  <tr key={u.id} className={`border-b border-border last:border-0 ${isSelf ? "bg-gold/5" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.full_name ?? "—"}</div>
                      {u.department && <div className="text-xs text-muted-foreground">{u.department}</div>}
                      {isSelf && <Badge variant="outline" className="mt-1 text-[10px]">You</Badge>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{ROLE_LABELS[pr]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[u.status]}`}>
                        {u.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.last_seen ? new Date(u.last_seen).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {/* Edit dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => { setEditUser(u); setEditRole(pr); setEditStatus(u.status); }}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Edit {editUser?.full_name ?? "User"}</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Role</Label>
                                <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {ALL_ROLES.map((r) => (<SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Account Status</Label>
                                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as UserStatus)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button className="w-full bg-navy text-white" onClick={saveEdit}>Save Changes</Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Suspend/reactivate */}
                        {!isSelf && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={u.status === "suspended" ? "text-green-600" : "text-red-600"}
                            onClick={() => toggleSuspend(u)}
                            title={u.status === "suspended" ? "Reactivate" : "Suspend"}
                          >
                            {u.status === "suspended" ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                          </Button>
                        )}

                        {/* Password reset */}
                        {!isSelf && u.email && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-purple-600"
                            onClick={() => handlePasswordReset(u)}
                            title="Send password reset link"
                          >
                            <KeyRound className="h-3 w-3" />
                          </Button>
                        )}

                        {/* Impersonate (owner can't impersonate another owner) */}
                        {!isSelf && pr !== "owner" && (
                          <Button size="sm" variant="ghost" className="text-amber-600" onClick={() => handleImpersonate(u)} title="View as this user">
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}

                        {/* Session history */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => openSessionHistory(u)} title="Session history">
                              <Clock className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Session History — {selectedUser?.full_name ?? "User"}</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-80 overflow-y-auto">
                              {sessions.length === 0 ? (
                                <p className="py-4 text-center text-sm text-muted-foreground">No sessions recorded yet.</p>
                              ) : (
                                <table className="w-full text-sm">
                                  <thead className="border-b border-border">
                                    <tr>
                                      <th className="pb-2 text-left text-xs font-medium text-muted-foreground">When</th>
                                      <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Device</th>
                                      <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Last Seen</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sessions.map((s) => (
                                      <tr key={s.id} className="border-b border-border last:border-0">
                                        <td className="py-2 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</td>
                                        <td className="py-2">
                                          <span className="flex items-center gap-1 text-xs">
                                            <Monitor className="h-3 w-3" />
                                            {s.device_type ?? "unknown"}
                                          </span>
                                        </td>
                                        <td className="py-2 text-xs text-muted-foreground">{new Date(s.last_seen).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
