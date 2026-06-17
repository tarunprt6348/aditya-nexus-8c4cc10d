import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/staff/leaves")({
  head: () => ({ meta: [{ title: "My Leaves — Staff" }] }),
  component: () => <PermissionGuard module="leaves"><Leaves /></PermissionGuard>,
});

function Leaves() {
  const [rows, setRows] = useState<any[]>([]);
  const [uid, setUid] = useState("");
  const [f, setF] = useState({ from_date: "", to_date: "", leave_type: "casual", reason: "" });

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setUid(u.user.id);
    const { data } = await supabase.from("staff_leaves").select("*").eq("staff_user_id", u.user.id).order("from_date", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  async function submit() {
    if (!f.from_date || !f.to_date) return toast.error("Pick the dates.");
    const { error } = await supabase.from("staff_leaves").insert({ ...f, staff_user_id: uid });
    if (error) return toast.error(error.message);
    toast.success("Leave submitted");
    setF({ from_date: "", to_date: "", leave_type: "casual", reason: "" });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl">My Leaves</h1>
      <Card className="mt-6 p-5">
        <h2 className="font-display text-lg">Request leave</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div><Label>From</Label><Input type="date" value={f.from_date} onChange={(e) => setF({ ...f, from_date: e.target.value })} /></div>
          <div><Label>To</Label><Input type="date" value={f.to_date} onChange={(e) => setF({ ...f, to_date: e.target.value })} /></div>
          <div><Label>Type</Label><Input value={f.leave_type} onChange={(e) => setF({ ...f, leave_type: e.target.value })} /></div>
          <div className="flex items-end"><Button onClick={submit} className="w-full bg-navy text-navy-foreground hover:bg-navy/90">Submit</Button></div>
          <div className="md:col-span-4"><Label>Reason</Label><Textarea rows={2} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
        </div>
      </Card>
      <div className="mt-6 grid gap-2">
        {rows.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded border border-border bg-card p-3 text-sm">
            <div>
              <div className="font-medium">{l.from_date} → {l.to_date} · {l.leave_type}</div>
              <div className="text-xs text-muted-foreground">{l.reason || "—"}</div>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{l.status}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No leave requests yet.</p>}
      </div>
    </div>
  );
}
