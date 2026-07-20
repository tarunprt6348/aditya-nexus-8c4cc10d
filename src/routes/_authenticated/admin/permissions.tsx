import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PermissionGuard } from "@/components/PermissionGuard";
import { getRolePermissions, upsertRolePermissions } from "@/lib/data.functions";
import { type AppRole } from "@/lib/roles";
import { ALL_MODULES, type Module } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/admin/permissions")({ component: PermissionsPage });

const STAFF_ROLES: AppRole[] = [
  "managing_director", "operations_manager", "hr_manager", "sales_manager",
  "sales_executive", "marketing_manager", "accountant", "project_manager",
  "site_engineer", "customer_support", "general_staff", "staff",
];

type Matrix = Record<string, Record<string, boolean>>;

function PermissionsPage() {
  const [matrix, setMatrix] = useState<Matrix>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getRolePermissions().then(perms => {
      const m: Matrix = {};
      for (const role of STAFF_ROLES) {
        m[role] = {};
        for (const mod of ALL_MODULES) {
          const found = perms.find(p => p.role === role && p.module === mod);
          m[role][mod] = found ? found.allowed : true;
        }
      }
      setMatrix(m);
    }).catch(() => toast.error("Failed to load permissions.")).finally(() => setLoading(false));
  }, []);

  function toggle(role: string, mod: string) {
    setMatrix(prev => ({
      ...prev,
      [role]: { ...prev[role], [mod]: !prev[role][mod] },
    }));
  }

  async function save() {
    setSaving(true);
    const upserts: { role: string; module: string; allowed: boolean }[] = [];
    for (const role of STAFF_ROLES) {
      for (const mod of ALL_MODULES) {
        upserts.push({ role, module: mod, allowed: matrix[role]?.[mod] ?? true });
      }
    }
    try {
      await upsertRolePermissions({ data: { upserts } });
      toast.success("Permissions saved.");
    } catch { toast.error("Save failed."); }
    finally { setSaving(false); }
  }

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>;

  return (
    <PermissionGuard module="permissions">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl">Role Permissions</h1>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left">Module</th>
                {STAFF_ROLES.map(r => <th key={r} className="px-3 py-2 text-center capitalize">{r.replace(/_/g, " ")}</th>)}
              </tr>
            </thead>
            <tbody>
              {ALL_MODULES.map(mod => (
                <tr key={mod} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium capitalize">{mod}</td>
                  {STAFF_ROLES.map(role => (
                    <td key={role} className="px-3 py-2 text-center">
                      <Switch
                        checked={matrix[role]?.[mod] ?? true}
                        onCheckedChange={() => toggle(role, mod)}
                        className="scale-75"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PermissionGuard>
  );
}
