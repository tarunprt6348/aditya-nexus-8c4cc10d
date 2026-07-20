import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/PermissionGuard";
import { getAuditLogs } from "@/lib/data.functions";
import type { AuditLog } from "@/lib/app-types";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/audit")({ component: AuditPage });

function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs().then(setLogs).catch(() => toast.error("Failed to load audit logs.")).finally(() => setLoading(false));
  }, []);

  function exportCsv() {
    const header = "Timestamp,Actor,Action,Target Type,Target Email,Metadata";
    const rows = logs.map(l =>
      [new Date(l.created_at).toISOString(), l.actor_email ?? "", l.action,
       l.target_type ?? "", l.target_email ?? "", JSON.stringify(l.metadata)].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit_log.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>;

  return (
    <PermissionGuard module="audit">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl">Audit Logs</h1>
          <Button size="sm" variant="outline" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
        <div className="rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Actor</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Target</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No audit entries.</td></tr>}
              {logs.map(l => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30 text-xs">
                  <td className="px-4 py-2.5 text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{l.actor_email ?? "system"}</td>
                  <td className="px-4 py-2.5 font-mono">{l.action}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{l.target_email ?? l.target_type ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PermissionGuard>
  );
}
