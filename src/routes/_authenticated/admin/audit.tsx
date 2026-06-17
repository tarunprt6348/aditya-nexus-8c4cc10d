import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Download, ClipboardList, Eye, UserX, UserCheck, Edit2, Plus, LogIn } from "lucide-react";
import type { AppRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({ meta: [{ title: "Audit Log — Aditya Constructions" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const [{ data: ok }, { data: ok2 }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: u.user.id, _role: "owner" as AppRole }),
      supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" as AppRole }),
    ]);
    if (!ok && !ok2) throw redirect({ to: "/admin" });
  },
  component: AuditLog,
});

interface AuditEntry {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_email: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const ACTION_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  user_created: { label: "User Created", icon: Plus, color: "text-green-600" },
  user_updated: { label: "User Updated", icon: Edit2, color: "text-blue-600" },
  user_suspended: { label: "User Suspended", icon: UserX, color: "text-red-600" },
  user_reactivated: { label: "User Reactivated", icon: UserCheck, color: "text-green-600" },
  impersonation_start: { label: "Impersonation Started", icon: Eye, color: "text-amber-600" },
  impersonation_stop: { label: "Impersonation Ended", icon: Eye, color: "text-gray-600" },
  role_changed: { label: "Role Changed", icon: Edit2, color: "text-purple-600" },
  permission_updated: { label: "Permission Updated", icon: ClipboardList, color: "text-indigo-600" },
};

function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filtered, setFiltered] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("audit_logs" as never)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500) as { data: AuditEntry[] | null };
    setEntries(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = entries;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.actor_email?.toLowerCase().includes(q) ||
          e.target_email?.toLowerCase().includes(q) ||
          e.action.includes(q),
      );
    }
    if (actionFilter !== "all") {
      result = result.filter((e) => e.action === actionFilter);
    }
    setFiltered(result);
    setPage(0);
  }, [search, actionFilter, entries]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function exportCSV() {
    const header = "id,actor_email,action,target_email,target_type,created_at\n";
    const rows = filtered
      .map((e) =>
        [e.id, e.actor_email, e.action, e.target_email, e.target_type, e.created_at]
          .map((v) => `"${v ?? ""}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-log.csv";
    a.click();
  }

  const uniqueActions = [...new Set(entries.map((e) => e.action))];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Audit Log</h1>
          <p className="mt-1 text-muted-foreground">
            {filtered.length} events · Complete trail of all administrative actions.
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by actor or target email…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {uniqueActions.map((a) => (
              <SelectItem key={a} value={a}>
                {ACTION_META[a]?.label ?? a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading audit log…</div>
        ) : paginated.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No audit entries found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">When</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actor</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Target</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((e) => {
                const meta = ACTION_META[e.action];
                const Icon = meta?.icon ?? ClipboardList;
                return (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 font-medium ${meta?.color ?? ""}`}>
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {meta?.label ?? e.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {e.actor_email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {e.target_email ?? e.target_id?.slice(0, 8) ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {e.metadata && Object.keys(e.metadata).length > 0 && (
                        <code className="text-xs text-muted-foreground">
                          {JSON.stringify(e.metadata).slice(0, 60)}
                        </code>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
