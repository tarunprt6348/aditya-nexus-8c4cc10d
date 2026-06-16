import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/team")({
  head: () => ({ meta: [{ title: "Team & Roles — Owner" }] }),
  component: Team,
});

type Role = "admin" | "staff" | "customer";
const ALL_ROLES: Role[] = ["admin", "staff", "customer"];

function Team() {
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const byUser = new Map<string, Role[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role);
      byUser.set(r.user_id, arr);
    });
    setRows((profiles ?? []).map((p: any) => ({ ...p, roles: byUser.get(p.id) ?? [] })));
  };
  useEffect(() => { load(); }, []);

  async function toggle(userId: string, role: Role, have: boolean) {
    const fn = have ? "revoke_user_role" : "set_user_role";
    const { error } = await supabase.rpc(fn, { _target: userId, _role: role });
    if (error) return toast.error(error.message);
    toast.success(have ? `Removed ${role}` : `Granted ${role}`);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Team & Roles</h1>
      <p className="mt-1 text-muted-foreground">Grant Owner (admin), Staff or Customer access. Users must sign up at <code>/auth</code> first.</p>
      <div className="mt-6 grid gap-3">
        {rows.map((p) => (
          <Card key={p.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-medium">{p.full_name || "(no name)"}</div>
              <div className="text-xs text-muted-foreground">{p.phone || p.id.slice(0, 8)}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((r) => {
                const have = p.roles.includes(r);
                return (
                  <Button key={r} size="sm" variant={have ? "default" : "outline"} className={have ? "bg-navy text-navy-foreground" : ""} onClick={() => toggle(p.id, r, have)}>
                    {have ? "✓ " : ""}{r}
                  </Button>
                );
              })}
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-center text-muted-foreground">No users yet.</p>}
      </div>
    </div>
  );
}
