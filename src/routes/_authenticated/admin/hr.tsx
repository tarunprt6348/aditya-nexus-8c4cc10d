import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PermissionGuard } from "@/components/PermissionGuard";
import { getStaffSalaries, getStaffLeaves, insertSalary, updateLeaveStatus, getStaffProfilesForHR } from "@/lib/data.functions";
import type { StaffSalary, StaffLeave } from "@/lib/app-types";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/hr")({ component: HRPage });

function HRPage() {
  const [salaries, setSalaries] = useState<StaffSalary[]>([]);
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [staff, setStaff] = useState<{ id: string; full_name: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [staffId, setStaffId] = useState("");

  async function load() {
    try {
      const [s, l, st] = await Promise.all([getStaffSalaries(), getStaffLeaves(), getStaffProfilesForHR()]);
      setSalaries(s);
      setLeaves(l);
      setStaff(st);
    } catch { toast.error("Failed to load HR data."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleAddSalary(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    if (!staffId) return toast.error("Select a staff member.");
    try {
      await insertSalary({
        data: {
          staff_user_id: staffId,
          period_month: fd.period_month as string,
          amount: Number(fd.amount),
          status: "paid",
        },
      });
      toast.success("Salary record added.");
      setOpen(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add salary.");
    }
  }

  async function handleLeaveStatus(id: string, status: string) {
    try {
      await updateLeaveStatus({ data: { id, status } });
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      toast.success("Leave status updated.");
    } catch { toast.error("Update failed."); }
  }

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>;

  return (
    <PermissionGuard module="hr">
      <div className="p-6">
        <h1 className="mb-6 font-display text-2xl">HR Management</h1>
        <Tabs defaultValue="salaries">
          <TabsList>
            <TabsTrigger value="salaries">Salaries</TabsTrigger>
            <TabsTrigger value="leaves">Leave Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="salaries" className="mt-4">
            <div className="mb-4 flex justify-end">
              <Button size="sm" onClick={() => setOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Record
              </Button>
            </div>
            <div className="rounded-lg border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left">Staff ID</th>
                    <th className="px-4 py-3 text-left">Month</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {salaries.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No salary records.</td></tr>}
                  {salaries.map(s => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{s.staff_user_id.split("-")[0]}</td>
                      <td className="px-4 py-3">{s.period_month}</td>
                      <td className="px-4 py-3">₹{s.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 capitalize">{s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="leaves" className="mt-4">
            <div className="space-y-3">
              {leaves.length === 0 && <p className="text-muted-foreground">No leave requests.</p>}
              {leaves.map(l => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
                  <div>
                    <p className="text-sm font-medium">{l.leave_type} — {l.from_date} to {l.to_date}</p>
                    <p className="text-xs text-muted-foreground">{l.reason ?? "No reason provided"}</p>
                    <p className="text-xs text-muted-foreground capitalize">Status: {l.status}</p>
                  </div>
                  {l.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleLeaveStatus(l.id, "approved")}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => handleLeaveStatus(l.id, "rejected")}>Reject</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Salary Record</DialogTitle></DialogHeader>
            <form onSubmit={handleAddSalary} className="space-y-3">
              <div>
                <Label>Staff Member</Label>
                <Select value={staffId} onValueChange={setStaffId}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name ?? s.id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Month (YYYY-MM)</Label><Input name="period_month" placeholder="2025-01" required /></div>
              <div><Label>Amount (₹)</Label><Input name="amount" type="number" min={0} required /></div>
              <Button type="submit" className="w-full">Add Record</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
