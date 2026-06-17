import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { PermissionGuard } from "@/components/site/PermissionGuard";
import { Search, LayoutList, Kanban, Phone, Mail, Calendar, Tag } from "lucide-react";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type Status = Database["public"]["Enums"]["lead_status"];

const STATUSES: Status[] = ["new", "contacted", "qualified", "converted", "lost"];

const STATUS_CONFIG: Record<Status, { label: string; color: string; dot: string }> = {
  new:       { label: "New",       color: "bg-blue-50 text-blue-700 border-blue-200",   dot: "bg-blue-500" },
  contacted: { label: "Contacted", color: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  qualified: { label: "Qualified", color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  converted: { label: "Converted", color: "bg-green-50 text-green-700 border-green-200",  dot: "bg-green-500" },
  lost:      { label: "Lost",      color: "bg-red-50 text-red-700 border-red-200",      dot: "bg-red-400" },
};

export const Route = createFileRoute("/_authenticated/admin/leads")({
  head: () => ({ meta: [{ title: "Leads — Admin" }] }),
  component: () => <PermissionGuard module="leads"><Leads /></PermissionGuard>,
});

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function Leads() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const services = useMemo(() => {
    const set = new Set(rows.map((r) => r.service).filter(Boolean));
    return Array.from(set) as string[];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.phone ?? "").includes(q);
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchService = serviceFilter === "all" || r.service === serviceFilter;
      return matchSearch && matchStatus && matchService;
    });
  }, [rows, search, statusFilter, serviceFilter]);

  async function setStatus(id: string, status: Status) {
    setUpdating(true);
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    setUpdating(false);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status } : s);
  }

  const counts = useMemo(() =>
    STATUSES.reduce((acc, s) => ({ ...acc, [s]: rows.filter((r) => r.status === s).length }), {} as Record<Status, number>),
    [rows]
  );

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Leads</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{filtered.length} of {rows.length} leads</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "table" ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setView("table")}
          >
            <LayoutList className="h-3.5 w-3.5" /> Table
          </Button>
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setView("kanban")}
          >
            <Kanban className="h-3.5 w-3.5" /> Kanban
          </Button>
        </div>
      </div>

      {/* Status summary strip */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all hover:shadow-sm ${
                statusFilter === s ? cfg.color + " ring-1 ring-current/30" : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
              <span className="ml-0.5 font-display text-sm font-semibold">{counts[s]}</span>
            </button>
          );
        })}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-9 text-sm"
          />
        </div>
        <Select value={serviceFilter} onValueChange={(v) => setServiceFilter(v)}>
          <SelectTrigger className="h-8 w-44 text-sm">
            <Tag className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="All services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All services</SelectItem>
            {services.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || statusFilter !== "all" || serviceFilter !== "all") && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setSearch(""); setStatusFilter("all"); setServiceFilter("all"); }}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Table view */}
      {view === "table" && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5 hidden sm:table-cell">Contact</th>
                <th className="px-4 py-2.5 hidden md:table-cell">Service</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  className="cursor-pointer border-t border-border transition-colors hover:bg-muted/30"
                  onClick={() => setSelected(l)}
                >
                  <td className="px-4 py-3 font-medium">{l.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span>{l.email}</span>
                      {l.phone && <span>{l.phone}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="capitalize text-muted-foreground">{l.service?.replace(/_/g, " ") ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    {new Date(l.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {rows.length === 0 ? "No leads yet." : "No leads match your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Kanban view */}
      {view === "kanban" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STATUSES.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const col = filtered.filter((r) => r.status === status);
            return (
              <div key={status} className="flex flex-col gap-2">
                <div className={`flex items-center gap-2 rounded-t-md border px-3 py-2 text-xs font-semibold ${cfg.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                  <span className="ml-auto font-display">{col.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {col.map((l) => (
                    <Card
                      key={l.id}
                      className="cursor-pointer p-3 transition-all hover:shadow-md hover:-translate-y-0.5"
                      onClick={() => setSelected(l)}
                    >
                      <div className="text-sm font-medium leading-tight">{l.name}</div>
                      {l.service && (
                        <div className="mt-1 text-xs capitalize text-muted-foreground">{l.service.replace(/_/g, " ")}</div>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</div>
                    </Card>
                  ))}
                  {col.length === 0 && (
                    <div className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground/60">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead detail sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="font-display text-xl">{selected.name}</SheetTitle>
                <StatusBadge status={selected.status} />
              </SheetHeader>

              <div className="space-y-5">
                {/* Contact info */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <a href={`mailto:${selected.email}`} className="hover:text-foreground transition-colors">{selected.email}</a>
                    </div>
                    {selected.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <a href={`tel:${selected.phone}`} className="hover:text-foreground transition-colors">{selected.phone}</a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>Received {new Date(selected.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Service & source */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service</div>
                    <div className="capitalize">{selected.service?.replace(/_/g, " ") ?? "—"}</div>
                  </div>
                  {(selected as any).source && (
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</div>
                      <div className="capitalize">{(selected as any).source}</div>
                    </div>
                  )}
                  {(selected as any).budget_range && (
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Budget</div>
                      <div>{(selected as any).budget_range}</div>
                    </div>
                  )}
                  {(selected as any).location && (
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</div>
                      <div>{(selected as any).location}</div>
                    </div>
                  )}
                </div>

                {selected.message && (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selected.message}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Status change */}
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Update Status</div>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => {
                      const cfg = STATUS_CONFIG[s];
                      return (
                        <button
                          key={s}
                          disabled={updating || selected.status === s}
                          onClick={() => setStatus(selected.id, s)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all hover:shadow-sm disabled:opacity-50 ${
                            selected.status === s ? cfg.color + " ring-1 ring-current/20" : "border-border bg-card text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
