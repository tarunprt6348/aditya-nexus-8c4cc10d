import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, logAudit, type AppRole } from "@/lib/roles";
import { type Module } from "@/lib/permissions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Check, X, Save, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/permissions")({
  head: () => ({ meta: [{ title: "Permission Matrix — Aditya Constructions" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const [{ data: ok }, { data: ok2 }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: u.user.id, _role: "owner" as AppRole }),
      supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" as AppRole }),
    ]);
    if (!ok && !ok2) throw redirect({ to: "/admin" });
  },
  component: PermissionMatrix,
});

const ALL_MODULES: { id: Module; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "leads", label: "Leads" },
  { id: "quotes", label: "Quote Requests" },
  { id: "projects", label: "Projects" },
  { id: "tickets", label: "Tickets" },
  { id: "hr", label: "HR & Salaries" },
  { id: "blog", label: "Blog" },
  { id: "team", label: "Team & Roles" },
  { id: "testimonials", label: "Testimonials" },
  { id: "messages", label: "Messages" },
  { id: "users", label: "User Management" },
  { id: "audit", label: "Audit Log" },
  { id: "permissions", label: "Permissions" },
  { id: "tasks", label: "Tasks" },
  { id: "leaves", label: "Leaves" },
  { id: "reports", label: "Reports" },
  { id: "finance", label: "Finance" },
];

const CONFIGURABLE_ROLES: AppRole[] = [
  "managing_director","operations_manager","hr_manager","sales_manager",
  "marketing_manager","accountant","sales_executive","project_manager",
  "site_engineer","customer_support","general_staff","staff",
];

type PermMatrix = Record<AppRole, Record<Module, boolean>>;

function PermissionMatrix() {
  const [matrix, setMatrix] = useState<PermMatrix>({} as PermMatrix);
  const [original, setOriginal] = useState<PermMatrix>({} as PermMatrix);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("role_permissions" as never)
      .select("role, module, allowed") as { data: Array<{ role: AppRole; module: Module; allowed: boolean }> | null };

    const m: PermMatrix = {} as PermMatrix;
    CONFIGURABLE_ROLES.forEach((role) => {
      m[role] = {} as Record<Module, boolean>;
      ALL_MODULES.forEach(({ id }) => { m[role][id] = false; });
    });

    (data ?? []).forEach(({ role, module, allowed }) => {
      if (m[role]) m[role][module] = allowed;
    });

    setMatrix(JSON.parse(JSON.stringify(m)));
    setOriginal(JSON.parse(JSON.stringify(m)));
    setLoading(false);
    setDirty(false);
  }

  function toggle(role: AppRole, module: Module) {
    setMatrix((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as PermMatrix;
      next[role][module] = !next[role][module];
      return next;
    });
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();

    const upserts: Array<{ role: string; module: string; allowed: boolean }> = [];
    CONFIGURABLE_ROLES.forEach((role) => {
      ALL_MODULES.forEach(({ id }) => {
        upserts.push({ role, module: id, allowed: matrix[role][id] });
      });
    });

    const { error } = await supabase
      .from("role_permissions" as never)
      .upsert(upserts as never, { onConflict: "role,module" });

    if (error) {
      toast.error("Failed to save permissions.");
      setSaving(false);
      return;
    }

    if (u.user) {
      await logAudit({
        actorId: u.user.id,
        actorEmail: u.user.email ?? "",
        action: "permission_updated",
        metadata: { roles: CONFIGURABLE_ROLES },
      });
    }

    toast.success("Permission matrix saved.");
    setOriginal(JSON.parse(JSON.stringify(matrix)));
    setDirty(false);
    setSaving(false);
  }

  function reset() {
    setMatrix(JSON.parse(JSON.stringify(original)));
    setDirty(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading permission matrix…
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Permission Matrix</h1>
          <p className="mt-1 text-muted-foreground">
            Configure which modules each role can access. Owner and Admin always have full access.
          </p>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          )}
          <Button
            className="bg-navy text-white hover:bg-navy/90"
            disabled={!dirty || saving}
            onClick={save}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-medium text-muted-foreground min-w-36">
                Module
              </th>
              {CONFIGURABLE_ROLES.map((role) => (
                <th key={role} className="px-3 py-3 text-center font-medium text-muted-foreground min-w-28">
                  <div className="text-[11px] leading-tight">{ROLE_LABELS[role]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_MODULES.map(({ id, label }) => (
              <tr key={id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="sticky left-0 z-10 bg-card px-4 py-2.5 font-medium hover:bg-muted/20">
                  {label}
                </td>
                {CONFIGURABLE_ROLES.map((role) => {
                  const allowed = matrix[role]?.[id] ?? false;
                  return (
                    <td key={role} className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={allowed}
                          onCheckedChange={() => toggle(role, id)}
                          className="scale-75"
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>Owner & Admin: full access (not configurable)</span>
        <span>Toggle switches to grant or revoke module access per role</span>
        <span className="text-amber-600 font-medium">Changes take effect on next login</span>
      </div>
    </div>
  );
}
