import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, logAudit, type AppRole } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/site/PermissionGuard";

const ALL_ROLES: AppRole[] = [
  "owner","admin","managing_director","operations_manager","hr_manager",
  "sales_manager","marketing_manager","accountant","sales_executive",
  "project_manager","site_engineer","customer_support","general_staff",
  "staff","customer",
];

export const Route = createFileRoute("/_authenticated/admin/team")({
  head: () => ({ meta: [{ title: "Team & Roles — Aditya Constructions" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: ok } = await supabase.rpc("has_role", {
      _user_id: u.user.id,
      _role: "owner" as AppRole,
    });
    if (!ok) throw redirect({ to: "/admin" });
  },
  component: () => <PermissionGuard module="team"><Team /></PermissionGuard>,
});

interface TeamRow {
  id: string;
  full_name: string | null;
  email: string | null;
  roles: AppRole[];
}

function Team() {
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const byUser = new Map<string, AppRole[]>();
    (roles ?? []).forEach((r: { user_id: string; role: string }) => {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      byUser.set(r.user_id, arr);
    });
    setRows(
      (profiles ?? []).map((p: { id: string; full_name: string | null }) => ({
        id: p.id,
        full_name: p.full_name,
        email: null,
        roles: byUser.get(p.id) ?? (["customer"] as AppRole[]),
      })),
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  async function setRole(userId: string, newRole: AppRole, userEmail: string | null) {
    const { data: actor } = await supabase.auth.getUser();
    if (!actor.user) return;

    const { error } = await supabase.rpc("owner_set_user_role" as never, {
      _target: userId,
      _role: newRole,
    } as never);

    if (error) return toast.error(error.message);

    await logAudit({
      actorId: actor.user.id,
      actorEmail: actor.user.email ?? "",
      action: "role_changed",
      targetType: "user",
      targetId: userId,
      targetEmail: userEmail ?? undefined,
      metadata: { newRole },
    });

    toast.success(`Role updated to ${ROLE_LABELS[newRole]}.`);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Team & Roles</h1>
      <p className="mt-1 text-muted-foreground">
        Assign roles to team members. Changes are logged to the audit trail.
      </p>
      {loading ? (
        <p className="mt-8 text-center text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-6 grid gap-3">
          {rows.map((p) => {
            const primaryRole = p.roles[0] ?? "customer";
            return (
              <Card key={p.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium">{p.full_name ?? "(no name)"}</div>
                  <div className="text-xs text-muted-foreground">{p.email ?? p.id.slice(0, 8)}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-xs">{ROLE_LABELS[r]}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={primaryRole}
                    onValueChange={(v) => setRole(p.id, v as AppRole, p.email)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            );
          })}
          {rows.length === 0 && (
            <p className="text-center text-muted-foreground">No users yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
