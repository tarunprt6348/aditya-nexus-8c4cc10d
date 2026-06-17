import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { ROLE_LABELS, logAudit, type AppRole } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users, Search, Eye, UserX, UserCheck, Edit2, Plus,
  Clock, Shield, ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "User Management — Aditya Constructions" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: ok } = await supabase.rpc("has_role", {
      _user_id: u.user.id, _role: "owner" as AppRole,
    });
    const { data: ok2 } = await supabase.rpc("has_role", {
      _user_id: u.user.id, _role: "admin" as AppRole,
    });
    if (!ok && !ok2) throw redirect({ to: "/admin" });
  },
  component: UserManagement,
});

type UserStatus = "active" | "inactive" | "suspended" | "pending_verification";

interface UserRecord {
  id: string;
  full_name: string | null;
  email?: string | null;
  phone: string | null;
  department: string | null;
  status: UserStatus;
  last_seen: string | null;
  created_at: string;
  roles: AppRole[];
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

function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [filtered, setFiltered] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [editRole, setEditRole] = useState<AppRole>("customer");
  const [editStatus, setEditStatus] = useState<UserStatus>("active");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("customer");
  const [invitePassword, setInvitePassword] = useState("");
  const { realUserId, email: realEmail, startImpersonation } = useRole();

  const load = async () => {
    setLoading(true);
    // Fetch profiles joined with user_roles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, phone, department, status, last_seen, created_at")
      .order("created_at", { ascending: false });

    if (!profiles) { setLoading(false); return; }

    // Fetch all user roles
    const { data: allRoles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const roleMap: Record<string, AppRole[]> = {};
    (allRoles ?? []).forEach((r) => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role as AppRole);
    });

    const records: UserRecord[] = profiles.map((p) => ({
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      department: p.department,
      status: (p.status as UserStatus) ?? "active",
      last_seen: p.last_seen,
      created_at: p.created_at,
      roles: roleMap[p.id] ?? ["customer"],
    }));

    setUsers(records);
    setFiltered(records);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((u) => u.status === statusFilter);
    }
    if (roleFilter !== "all") {
      result = result.filter((u) => u.roles.includes(roleFilter as AppRole));
    }
    setFiltered(result);
  }, [search, statusFilter, roleFilter, users]);

  async function saveEdit() {
    if (!editUser) return;
    const { data: actor } = await supabase.auth.getUser();
    if (!actor.user) return;

    // Update status
    await supabase
      .from("profiles")
      .update({ status: editStatus })
      .eq("id", editUser.id);

    // Update role: remove old roles, add new
    await supabase.from("user_roles").delete().eq("user_id", editUser.id);
    await supabase.from("user_roles").insert({ user_id: editUser.id, role: editRole });

    await logAudit({
      actorId: actor.user.id,
      actorEmail: actor.user.email ?? "",
      action: "user_updated",
      targetType: "user",
      targetId: editUser.id,
      metadata: { newRole: editRole, newStatus: editStatus },
    });

    toast.success("User updated.");
    setEditUser(null);
    load();
  }

  async function toggleSuspend(user: UserRecord) {
    const { data: actor } = await supabase.auth.getUser();
    const newStatus: UserStatus = user.status === "suspended" ? "active" : "suspended";
    await supabase.from("profiles").update({ status: newStatus }).eq("id", user.id);
    if (actor.user) {
      await logAudit({
        actorId: actor.user.id,
        actorEmail: actor.user.email ?? "",
        action: newStatus === "suspended" ? "user_suspended" : "user_reactivated",
        targetType: "user",
        targetId: user.id,
      });
    }
    toast.success(`User ${newStatus === "suspended" ? "suspended" : "reactivated"}.`);
    load();
  }

  async function createUser() {
    if (!inviteEmail || !inviteName || !invitePassword) {
      return toast.error("Fill in all fields.");
    }
    const { data: actor } = await supabase.auth.getUser();

    // Create auth user via sign up (workaround — no admin API)
    const { data, error } = await supabase.auth.signUp({
      email: inviteEmail,
      password: invitePassword,
      options: { data: { full_name: inviteName } },
    });

    if (error) return toast.error(error.message);
    if (!data.user) return toast.error("Failed to create user.");

    // Set role
    await supabase.from("user_roles").delete().eq("user_id", data.user.id);
    await supabase.from("user_roles").insert({ user_id: data.user.id, role: inviteRole });

    if (actor.user) {
      await logAudit({
        actorId: actor.user.id,
        actorEmail: actor.user.email ?? "",
        action: "user_created",
        targetType: "user",
        targetId: data.user.id,
        targetEmail: inviteEmail,
        metadata: { role: inviteRole, name: inviteName },
      });
    }

    toast.success(`User ${inviteName} created as ${ROLE_LABELS[inviteRole]}.`);
    setInviteOpen(false);
    setInviteEmail(""); setInviteName(""); setInvitePassword("");
    load();
  }

  async function handleImpersonate(user: UserRecord) {
    await startImpersonation(
      user.id,
      `${user.full_name ?? user.id}@impersonated`,
      user.full_name ?? user.id,
    );
    toast.success(`Now viewing as ${user.full_name ?? "user"}`);
  }

  const primaryRole = (u: UserRecord): AppRole => {
    const priority: AppRole[] = [
      "owner","admin","managing_director","operations_manager","hr_manager",
      "sales_manager","marketing_manager","accountant","sales_executive",
      "project_manager","site_engineer","customer_support","general_staff","staff","customer",
    ];
    for (const r of priority) {
      if (u.roles.includes(r)) return r;
    }
    return "customer";
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">User Management</h1>
          <p className="mt-1 text-muted-foreground">
            {users.length} users · Create, edit, suspend, and impersonate accounts.
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy text-white hover:bg-navy/90">
              <Plus className="mr-2 h-4 w-4" /> Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              </div>
              <div>
                <Label>Temporary Password</Label>
                <Input type="password" value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} minLength={6} />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-navy text-white" onClick={createUser}>
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
            {ALL_ROLES.map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
            ))}
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Seen</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const pr = primaryRole(u);
                const isSelf = u.id === realUserId;
                return (
                  <tr key={u.id} className={`border-b border-border last:border-0 ${isSelf ? "bg-gold/5" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.full_name ?? "—"}</div>
                      {u.department && (
                        <div className="text-xs text-muted-foreground">{u.department}</div>
                      )}
                      {isSelf && <Badge variant="outline" className="mt-1 text-[10px]">You</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {ROLE_LABELS[pr]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[u.status]}`}>
                        {u.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.last_seen
                        ? new Date(u.last_seen).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {/* Edit */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditUser(u);
                                setEditRole(pr);
                                setEditStatus(u.status);
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit {editUser?.full_name ?? "User"}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Role</Label>
                                <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {ALL_ROLES.map((r) => (
                                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                                    ))}
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
                              <Button className="w-full bg-navy text-white" onClick={saveEdit}>
                                Save Changes
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Suspend/Reactivate */}
                        {!isSelf && (
                          <Button
                            size="sm"
                            variant={u.status === "suspended" ? "outline" : "ghost"}
                            className={u.status === "suspended" ? "text-green-600" : "text-red-600"}
                            onClick={() => toggleSuspend(u)}
                          >
                            {u.status === "suspended" ? (
                              <UserCheck className="h-3 w-3" />
                            ) : (
                              <UserX className="h-3 w-3" />
                            )}
                          </Button>
                        )}

                        {/* Impersonate */}
                        {!isSelf && pr !== "owner" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-amber-600"
                            onClick={() => handleImpersonate(u)}
                            title="View as this user"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Demo Credentials Card */}
      <DemoCredentials />
    </div>
  );
}

function DemoCredentials() {
  const demoAccounts = [
    { role: "Owner", email: "owner@adityaconstructions.com", note: "Full platform access" },
    { role: "Operations Manager", email: "ops@adityaconstructions.com", note: "Projects, tickets, leads" },
    { role: "HR Manager", email: "hr@adityaconstructions.com", note: "HR, leaves, team" },
    { role: "Sales Manager", email: "sales@adityaconstructions.com", note: "Leads, quotes, pipeline" },
    { role: "Project Manager", email: "pm@adityaconstructions.com", note: "Projects, tasks, site reports" },
    { role: "Site Engineer", email: "engineer@adityaconstructions.com", note: "Projects, tasks" },
    { role: "Customer Support", email: "support@adityaconstructions.com", note: "Tickets, messages" },
    { role: "Client / Customer", email: "client@adityaconstructions.com", note: "Client portal access" },
  ];

  return (
    <Card className="mt-10 border-amber-200 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Shield className="h-5 w-5" />
          Demo Credentials (Development Reference)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-amber-700">
          Default password for all demo accounts: <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">Demo@1234</code>
        </p>
        <div className="overflow-hidden rounded-lg border border-amber-200">
          <table className="w-full text-sm">
            <thead className="bg-amber-100/70">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-amber-800">Role</th>
                <th className="px-3 py-2 text-left font-medium text-amber-800">Email</th>
                <th className="px-3 py-2 text-left font-medium text-amber-800">Access</th>
              </tr>
            </thead>
            <tbody>
              {demoAccounts.map((acc, i) => (
                <tr key={i} className="border-t border-amber-100">
                  <td className="px-3 py-2 font-medium text-amber-900">{acc.role}</td>
                  <td className="px-3 py-2 font-mono text-xs text-amber-800">{acc.email}</td>
                  <td className="px-3 py-2 text-amber-700">{acc.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-amber-600">
          To activate these accounts: create each user above with the matching email and password, then set the correct role.
        </p>
      </CardContent>
    </Card>
  );
}
