import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionGuard } from "@/components/site/PermissionGuard";
import { toast } from "sonner";
import { Search, Bot, CheckCircle2, XCircle, Clock, Send } from "lucide-react";

type QuoteStatus = "pending" | "reviewed" | "quoted" | "accepted" | "rejected";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pending",  color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  reviewed: { label: "Reviewed", color: "bg-blue-50 text-blue-700 border-blue-200" },
  quoted:   { label: "Quoted",   color: "bg-purple-50 text-purple-700 border-purple-200" },
  accepted: { label: "Accepted", color: "bg-green-50 text-green-700 border-green-200" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200" },
};

export const Route = createFileRoute("/_authenticated/admin/quotes")({
  head: () => ({ meta: [{ title: "Quote Requests — Admin" }] }),
  component: () => <PermissionGuard module="quotes"><Quotes /></PermissionGuard>,
});

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function Quotes() {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("quote_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const matchSearch = !q || r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [rows, search, statusFilter]);

  const counts = useMemo(() =>
    Object.keys(STATUS_CONFIG).reduce((acc, s) => ({
      ...acc,
      [s]: rows.filter((r) => r.status === s).length,
    }), {} as Record<string, number>),
    [rows]
  );

  async function setStatus(id: string, status: string) {
    setUpdating(id);
    const { error } = await supabase.from("quote_requests").update({ status }).eq("id", id);
    setUpdating(null);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Quote Requests</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{filtered.length} of {rows.length} requests</p>
        </div>
      </div>

      {/* Status strip */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all hover:shadow-sm ${statusFilter === "all" ? "border-navy bg-navy text-white" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
        >
          All <span className="ml-1 font-display">{rows.length}</span>
        </button>
        {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all hover:shadow-sm ${statusFilter === s ? cfg.color + " ring-1 ring-current/20" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
          >
            {cfg.label} <span className="ml-1 font-display">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pl-9 text-sm"
        />
      </div>

      {/* Cards */}
      <div className="grid gap-3">
        {filtered.map((q) => (
          <Card key={q.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base">{q.name}</h3>
                  {q.service_type && (
                    <Badge variant="outline" className="capitalize text-xs">
                      {q.service_type.replace(/_/g, " ")}
                    </Badge>
                  )}
                  <StatusBadge status={q.status ?? "pending"} />
                  {q.ai_estimate && (
                    <span className="flex items-center gap-1 text-xs text-gold">
                      <Bot className="h-3 w-3" /> AI estimate
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {q.email}{q.phone ? ` · ${q.phone}` : ""}{q.location ? ` · ${q.location}` : ""}
                </p>
                {q.requirements && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{q.requirements}</p>
                )}
                {q.ai_estimate && (
                  <p className="mt-1.5 text-xs text-gold bg-gold/5 rounded px-2 py-1 inline-block">{q.ai_estimate}</p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="text-right text-xs text-muted-foreground">
                  {new Date(q.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  {q.budget_range && <div>Budget: {q.budget_range}</div>}
                  {q.timeline && <div>Timeline: {q.timeline}</div>}
                </div>

                {/* Quick action buttons */}
                <div className="flex gap-1.5">
                  {q.status !== "reviewed" && q.status !== "quoted" && q.status !== "accepted" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      disabled={updating === q.id}
                      onClick={() => setStatus(q.id, "reviewed")}
                    >
                      <Clock className="h-3 w-3" /> Review
                    </Button>
                  )}
                  {q.status !== "quoted" && q.status !== "accepted" && q.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      disabled={updating === q.id}
                      onClick={() => setStatus(q.id, "quoted")}
                    >
                      <Send className="h-3 w-3" /> Quote sent
                    </Button>
                  )}
                  {q.status !== "accepted" && q.status !== "rejected" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs text-green-700 hover:bg-green-50 border-green-200"
                        disabled={updating === q.id}
                        onClick={() => setStatus(q.id, "accepted")}
                      >
                        <CheckCircle2 className="h-3 w-3" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs text-red-700 hover:bg-red-50 border-red-200"
                        disabled={updating === q.id}
                        onClick={() => setStatus(q.id, "rejected")}
                      >
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "No quote requests yet." : "No requests match your filters."}
          </p>
        )}
      </div>
    </div>
  );
}
