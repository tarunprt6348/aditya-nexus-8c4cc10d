import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/hr")({
  head: () => ({ meta: [{ title: "HR — Owner" }] }),
  component: HR,
});

function HR() {
  const [staff, setStaff] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [sel, setSel] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const load = async () => {
    const [{ data: roles }, { data: sal }, { data: lv }] = await Promise.all([
      supabase.from("user_roles").select("user_id, role").eq("role", "staff"),
      supabase.from("staff_salaries").select("*").order("period_month", { ascending: false }),
      supabase.from("staff_leaves").select("*").order("from_date", { ascending: false }),
    ]);
    const ids = Array.from(new Set((roles ?? []).map((r: any) => r.user_id)));
    const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    setStaff(profs ?? []);
    setSalaries(sal ?? []);
    setLeaves(lv ?? []);
  };
  useEffect(() => { load(); }, []);

  async function addSalary() {
    if (!sel || !month || !amount) return toast.error("Pick staff, month and amount.");
    const { error } = await supabase.from("staff_salaries").insert({
      staff_user_id: sel, period_month: `${month}-01`, amount: Number(amount), status: "paid",
    });
    if (error) return toast.error(error.message);
    toast.success("Salary recorded");
    setAmount("");
    load();
  }

  async function setLeaveStatus(id: string, status: string) {
    const { error } = await supabase.from("staff_leaves").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  const nameOf = (id: string) => staff.find((s) => s.id === id)?.full_name ?? id.slice(0, 8);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl">HR · Salary & Leaves</h1>
        <p className="mt-1 text-muted-foreground">Record monthly salaries and approve leave requests.</p>
      </div>

      <Card className="p-5">
        <h2 className="font-display text-lg">Record salary</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div>
            <Label>Staff</Label>
            <Select value={sel} onValueChange={setSel}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name || s.id.slice(0,8)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Month</Label><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
          <div><Label>Amount (₹)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="flex items-end"><Button onClick={addSalary} className="w-full bg-navy text-navy-foreground hover:bg-navy/90">Add</Button></div>
        </div>
        <div className="mt-6 grid gap-2">
          {salaries.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded border border-border p-3 text-sm">
              <span>{nameOf(s.staff_user_id)} · {s.period_month}</span>
              <span className="font-medium">₹{Number(s.amount).toLocaleString("en-IN")} · {s.status}</span>
            </div>
          ))}
          {salaries.length === 0 && <p className="text-sm text-muted-foreground">No salary records yet.</p>}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-lg">Leave requests</h2>
        <div className="mt-4 grid gap-2">
          {leaves.map((l) => (
            <div key={l.id} className="flex flex-col gap-2 rounded border border-border p-3 text-sm md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-medium">{nameOf(l.staff_user_id)} · {l.leave_type}</div>
                <div className="text-xs text-muted-foreground">{l.from_date} → {l.to_date} · {l.reason || "—"}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{l.status}</span>
                {l.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => setLeaveStatus(l.id, "approved")}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => setLeaveStatus(l.id, "rejected")}>Reject</Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {leaves.length === 0 && <p className="text-sm text-muted-foreground">No leave requests.</p>}
        </div>
      </Card>
    </div>
  );
}
