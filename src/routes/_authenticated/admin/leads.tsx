import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { PermissionGuard } from "@/components/site/PermissionGuard";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type Status = Database["public"]["Enums"]["lead_status"];
const STATUSES: Status[] = ["new", "contacted", "qualified", "converted", "lost"];

export const Route = createFileRoute("/_authenticated/admin/leads")({
  head: () => ({ meta: [{ title: "Leads — Admin" }] }),
  component: () => <PermissionGuard module="leads"><Leads /></PermissionGuard>,
});

function Leads() {
  const [rows, setRows] = useState<Lead[]>([]);
  const load = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: Status) {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Leads</h1>
      <p className="mt-1 text-muted-foreground">{rows.length} total</p>
      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th></tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{l.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{l.email}<br/>{l.phone}</td>
                <td className="px-4 py-3 capitalize">{l.service?.replace("_", " ") ?? "—"}</td>
                <td className="px-4 py-3">
                  <Select value={l.status} onValueChange={(v) => setStatus(l.id, v as Status)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No leads yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
